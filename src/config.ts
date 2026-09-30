/**
 * Central application configuration.
 *
 * The Groq model name lives in exactly one place so it can be
 * swapped without touching any other file.
 */

/** Free-tier friendly default. Change only this value to switch models. */
export const GROQ_MODEL = "openai/gpt-oss-20b";

/** OpenAI-compatible chat completions endpoint. */
export const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

/** Request timeout in milliseconds. */
export const GROQ_REQUEST_TIMEOUT_MS = 60_000;

/** Chat time-to-live: 24 hours in milliseconds. */
export const CHAT_TTL_MS = 24 * 60 * 60 * 1000;
