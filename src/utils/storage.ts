/**
 * localStorage persistence with a strict 24-hour expiry.
 *
 * - No backend, no cookies, no sync.
 * - Every stored chat carries `expiresAt = updatedAt + CHAT_TTL_MS`.
 * - Expiry is NOT extended silently: on message activity we refresh
 *   `updatedAt`, and `expiresAt` is recomputed from the activity time, but
 *   it never lives longer than 24h after the last update (sliding window
 *   capped at last activity, not indefinite — see README).
 * - Expired chats are purged on every read/write.
 */

import { CHAT_TTL_MS } from "../config";
import type { Chat, StoredChat } from "../types/chat";

const STORAGE_KEY = "ai-chatbot.chats.v1";
export const API_KEY_OVERRIDE_KEY = "ai-chatbot.api-key-override";
export const THEME_KEY = "ai-chatbot.theme";

export function expiresAtFor(updatedAt: number): number {
  return updatedAt + CHAT_TTL_MS;
}

function isStoredChat(value: unknown): value is StoredChat {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v["id"] === "string" &&
    typeof v["title"] === "string" &&
    Array.isArray(v["messages"]) &&
    typeof v["createdAt"] === "number" &&
    typeof v["updatedAt"] === "number" &&
    typeof v["expiresAt"] === "number"
  );
}

function readRaw(): StoredChat[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredChat);
  } catch {
    return [];
  }
}

function writeRaw(chats: StoredChat[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Storage full or unavailable — fail silently; chat still works in memory.
  }
}

/** Remove expired chats and persist the cleaned list. Returns live chats. */
export function purgeExpired(chats: StoredChat[], now: number = Date.now()): StoredChat[] {
  const live = chats.filter((c) => c.expiresAt > now);
  if (live.length !== chats.length) {
    writeRaw(live);
  }
  return live;
}

/** Load non-expired chats, newest first. Purges expired ones. */
export function loadChats(now: number = Date.now()): StoredChat[] {
  const live = purgeExpired(readRaw(), now);
  return live.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Persist chats after purging expired entries. */
export function saveChats(chats: StoredChat[], now: number = Date.now()): StoredChat[] {
  const live = chats.filter((c) => c.expiresAt > now);
  writeRaw(live);
  return live.sort((a, b) => b.updatedAt - a.updatedAt);
}

export function toStoredChat(chat: Chat): StoredChat {
  return { ...chat, expiresAt: expiresAtFor(chat.updatedAt) };
}

export function touchChat(chat: StoredChat, now: number = Date.now()): StoredChat {
  return { ...chat, updatedAt: now, expiresAt: expiresAtFor(now) };
}

/** Runtime API-key override (optional, stored locally). Empty string clears. */
export function getApiKeyOverride(): string {
  try {
    return localStorage.getItem(API_KEY_OVERRIDE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setApiKeyOverride(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(API_KEY_OVERRIDE_KEY, key.trim());
    else localStorage.removeItem(API_KEY_OVERRIDE_KEY);
  } catch {
    // ignore
  }
}

export function clearAllChats(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
