/**
 * Response-length preference: Short / Moderate / Detail.
 * Maps each choice to a system instruction sent with the API request
 * (never stored in chat history) and to UI metadata.
 */

import type { ResponseLength } from "../types/chat";

export const LENGTH_STORAGE_KEY = "ai-chatbot.response-length";

export interface LengthOption {
  value: ResponseLength;
  label: string;
  hint: string;
}

export const LENGTH_OPTIONS: LengthOption[] = [
  { value: "short", label: "Short", hint: "Brief answers" },
  { value: "moderate", label: "Moderate", hint: "Balanced answers" },
  { value: "detail", label: "Detail", hint: "In-depth answers" },
];

export function readResponseLength(): ResponseLength {
  try {
    const raw = localStorage.getItem(LENGTH_STORAGE_KEY);
    if (raw === "short" || raw === "moderate" || raw === "detail") return raw;
  } catch {
    // ignore
  }
  return "moderate";
}

export function systemPromptFor(length: ResponseLength): string {
  switch (length) {
    case "short":
      return "Answer concisely. Keep the response brief — a few sentences or short bullet points at most. Do not add lengthy explanations or examples unless explicitly asked.";
    case "detail":
      return "Give a thorough, in-depth answer with clear explanations and helpful examples. Use structure such as headings, lists, or code samples where appropriate.";
    case "moderate":
      return "Give a clear, balanced answer with moderate detail — neither terse nor exhaustive.";
  }
}
