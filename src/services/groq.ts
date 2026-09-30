/**
 * Groq integration — isolated from all UI code.
 *
 * Uses Groq's OpenAI-compatible Chat Completions API directly from the
 * browser via `fetch`, so `AbortController` cancellation and request
 * timeouts work reliably and the bundle stays lean.
 *
 * Only `GROQ_MODEL` in `src/config.ts` needs to change to switch models.
 */

import {
  GROQ_CHAT_URL,
  GROQ_MAX_OUTPUT_TOKENS,
  GROQ_MODEL,
  GROQ_REQUEST_TIMEOUT_MS,
} from "../config";
import type {
  ApiErrorKind,
  FriendlyError,
  Message,
  SendMessageOptions,
} from "../types/chat";
import { getApiKeyOverride } from "../utils/storage";

export { GROQ_MODEL };

/** Resolve the API key: runtime override wins, then the Vite env var. */
export function getApiKey(): string {
  const override = getApiKeyOverride().trim();
  if (override) return override;
  return (import.meta.env.VITE_GROQ_API_KEY as string | undefined ?? "").trim();
}

export function isApiKeyConfigured(): boolean {
  return getApiKey().length > 0;
}

interface ChatMessagePart {
  type?: string;
  text?: string;
}

interface ChatChoice {
  message?: {
    role?: string;
    /** Plain string for most models; array of parts for some reasoning models. */
    content?: unknown;
  };
  finish_reason?: string;
}

interface ChatCompletionsResponse {
  choices?: ChatChoice[];
  error?: { message?: string; type?: string; code?: string };
}

function toFriendlyError(kind: ApiErrorKind, title: string, message: string, retryable = true): FriendlyError {
  return { kind, title, message, retryable };
}

export function toFriendlyErrorFromUnknown(error: unknown): FriendlyError {
  if (error instanceof GroqRequestError) return error.friendly;
  if (error instanceof DOMException && error.name === "AbortError") {
    return toFriendlyError("aborted", "Request cancelled", "Generation was stopped.", false);
  }
  if (error instanceof TypeError) {
    // fetch() throws TypeError on network failure.
    return toFriendlyError(
      "network",
      "Connection problem",
      "Something went wrong while generating the response. Please check your internet connection and try again.",
    );
  }
  return toFriendlyError(
    "unknown",
    "Something went wrong",
    "Something went wrong while generating the response. Please try again.",
  );
}

export class GroqRequestError extends Error {
  friendly: FriendlyError;
  constructor(friendly: FriendlyError, options?: ErrorOptions) {
    super(friendly.message, options);
    this.name = "GroqRequestError";
    this.friendly = friendly;
  }
}

function mapHttpStatus(status: number, bodyText: string): FriendlyError {
  const lowered = bodyText.toLowerCase();
  const mentionsKey =
    lowered.includes("api key") || lowered.includes("apikey") || lowered.includes("unauthorized");

  if (status === 401 || (status === 400 && mentionsKey)) {
    return toFriendlyError(
      "invalid-key",
      "Invalid API key",
      "The Groq API rejected the API key. Check your VITE_GROQ_API_KEY value (or the override in Settings) and try again.",
      false,
    );
  }
  if (status === 400) {
    const mentionsModel = lowered.includes("model");
    return toFriendlyError(
      "bad-request",
      "Request not understood",
      mentionsModel
        ? "The Groq API rejected the request — the configured model may be unavailable. Check GROQ_MODEL in src/config.ts and try again."
        : "Something went wrong while generating the response. Please rephrase and try again.",
    );
  }
  if (status === 429) {
    const isQuota =
      lowered.includes("quota") || lowered.includes("exceed") || lowered.includes("billing");
    if (isQuota) {
      return toFriendlyError(
        "quota",
        "Quota exceeded",
        "The Groq API quota has been exceeded. Check your usage/rate limits in the Groq console and try again later.",
        false,
      );
    }
    return toFriendlyError(
      "rate-limit",
      "Too many requests",
      "Too many requests right now. Please wait a moment and try again.",
    );
  }
  if (status === 404) {
    // Groq (like OpenAI) returns 404 when the model ID doesn't exist or
    // was retired.
    return toFriendlyError(
      "bad-request",
      "Model unavailable",
      "The configured Groq model is unavailable or was retired. Check GROQ_MODEL in src/config.ts (see GET /openai/v1/models for the live list) and try again.",
      false,
    );
  }
  if (status >= 500) {
    return toFriendlyError(
      "unavailable",
      "Groq is unavailable",
      "The Groq API is unavailable right now. Please try again in a little while.",
    );
  }
  return toFriendlyError(
    "unknown",
    "Something went wrong",
    "Something went wrong while generating the response. Please try again.",
  );
}

/** Extract plain text from a chat-completion message content field. */
function extractContent(content: unknown): string {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return (content as ChatMessagePart[])
      .filter((p) => typeof p === "object" && p !== null && typeof p.text === "string")
      .map((p) => (p as { text: string }).text)
      .join("")
      .trim();
  }
  return "";
}

/**
 * Send a message to Groq with the given conversation history.
 * `history` should contain all prior messages (user + model) in order.
 */
export async function sendGroqMessage(
  currentText: string,
  history: Message[],
  options: SendMessageOptions = {},
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new GroqRequestError(
      toFriendlyError(
        "missing-key",
        "API key not configured",
        "No Groq API key is configured. Add VITE_GROQ_API_KEY to your .env file (see .env.example) or set an override in Settings.",
        false,
      ),
    );
  }

  const messages = [
    ...(options.systemPrompt ? [{ role: "system", content: options.systemPrompt }] : []),
    ...history.map((m) => ({
      role: m.role === "model" ? "assistant" : "user",
      content: m.text,
    })),
    { role: "user", content: currentText },
  ];

  const externalSignal = options.signal;
  const timeoutController = new AbortController();
  const timeoutId = window.setTimeout(() => timeoutController.abort(), GROQ_REQUEST_TIMEOUT_MS);

  const combined = new AbortController();
  const onExternalAbort = (): void => combined.abort(externalSignal?.reason);
  const onTimeoutAbort = (): void => combined.abort(timeoutController.signal.reason);

  if (externalSignal?.aborted) combined.abort(externalSignal.reason);
  externalSignal?.addEventListener("abort", onExternalAbort);
  timeoutController.signal.addEventListener("abort", onTimeoutAbort);

  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_completion_tokens: GROQ_MAX_OUTPUT_TOKENS,
      }),
      signal: combined.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      if (timeoutController.signal.aborted && !externalSignal?.aborted) {
        throw new GroqRequestError(
          toFriendlyError(
            "timeout",
            "Request timed out",
            "The request took too long. Please check your connection and try again.",
          ),
        );
      }
      throw new GroqRequestError(
        toFriendlyError("aborted", "Request cancelled", "Generation was stopped.", false),
      );
    }
    throw new GroqRequestError(toFriendlyErrorFromUnknown(error));
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
    timeoutController.signal.removeEventListener("abort", onTimeoutAbort);
  }

  if (!response.ok) {
    let bodyText = "";
    try {
      bodyText = await response.text();
    } catch {
      bodyText = "";
    }
    throw new GroqRequestError(mapHttpStatus(response.status, bodyText));
  }

  let data: ChatCompletionsResponse;
  try {
    data = (await response.json()) as ChatCompletionsResponse;
  } catch {
    throw new GroqRequestError(
      toFriendlyError(
        "bad-request",
        "Bad response",
        "Something went wrong while generating the response. The API returned an unreadable response. Please try again.",
      ),
    );
  }

  if (data.error?.message) {
    throw new GroqRequestError(
      toFriendlyError(
        "bad-request",
        "Request failed",
        "Something went wrong while generating the response. Please try again.",
      ),
    );
  }

  const text = extractContent(data.choices?.[0]?.message?.content);

  // Guard against blocked/empty finishes.
  if (!text) {
    const reason = data.choices?.[0]?.finish_reason ?? "";
    if (reason === "content_filter") {
      throw new GroqRequestError(
        toFriendlyError(
          "bad-request",
          "Response blocked",
          "The response was blocked. Please rephrase your message and try again.",
        ),
      );
    }
    throw new GroqRequestError(
      toFriendlyError(
        "empty",
        "Empty response",
        "Something went wrong while generating the response. The AI returned an empty response. Please try again.",
      ),
    );
  }

  return text;
}
