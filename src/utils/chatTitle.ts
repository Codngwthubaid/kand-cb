/**
 * Generate a short, human-readable chat title from the first user message.
 * Purely local — no API call.
 */

const MAX_TITLE_LENGTH = 42;
const MAX_WORDS = 6;

export function generateChatTitle(firstMessage: string): string {
  const collapsed = firstMessage.replace(/\s+/g, " ").trim();
  if (!collapsed) return "New chat";

  // Strip common leading prompt verbs for a cleaner noun-ish title is
  // overkill; instead just take the first few words and title-case them
  // lightly by capitalising the first letter.
  const words = collapsed.split(" ").slice(0, MAX_WORDS);
  let title = words.join(" ");

  if (title.length > MAX_TITLE_LENGTH) {
    title = title.slice(0, MAX_TITLE_LENGTH).trimEnd();
    // Avoid cutting mid-word when possible.
    const lastSpace = title.lastIndexOf(" ");
    if (lastSpace > MAX_TITLE_LENGTH * 0.6) {
      title = title.slice(0, lastSpace);
    }
    title += "…";
  }

  return title.charAt(0).toUpperCase() + title.slice(1);
}

export function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
