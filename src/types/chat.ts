/** Core domain types for the chatbot. */

export type MessageRole = "user" | "model";

export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export interface Message {
  id: string;
  role: MessageRole;
  text: string;
  createdAt: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

/** Shape persisted to localStorage (includes expiry). */
export interface StoredChat extends Chat {
  expiresAt: number;
}

export type ApiErrorKind =
  | "missing-key"
  | "invalid-key"
  | "quota"
  | "rate-limit"
  | "network"
  | "timeout"
  | "empty"
  | "bad-request"
  | "unavailable"
  | "aborted"
  | "unknown";

export interface FriendlyError {
  kind: ApiErrorKind;
  /** Short heading shown in the UI. */
  title: string;
  /** Longer helpful explanation shown in the UI. */
  message: string;
  /** Whether showing a Retry button makes sense. */
  retryable: boolean;
}

export interface SendMessageOptions {
  signal?: AbortSignal;
  /** Optional system instruction prepended to the API request (not stored). */
  systemPrompt?: string;
}

export type ResponseLength = "short" | "moderate" | "detail";
