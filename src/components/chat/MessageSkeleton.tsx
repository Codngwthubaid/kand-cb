import { Bot } from "lucide-react";

/** Animated AI "thinking" placeholder shown while a response generates. */
export function MessageSkeleton() {
  return (
    <div
      className="message-row ai"
      role="status"
      aria-live="polite"
      aria-label="AI is generating a response"
    >
      <div className="avatar avatar-ai" aria-hidden="true">
        <Bot size={18} />
      </div>
      <div className="bubble bubble-ai skeleton-bubble" aria-hidden="true">
        <div className="skeleton-line" style={{ width: "92%" }} />
        <div className="skeleton-line" style={{ width: "68%" }} />
        <div className="skeleton-line" style={{ width: "82%" }} />
        <div className="skeleton-line short" style={{ width: "38%" }} />
        <span className="sr-only">Generating response…</span>
      </div>
    </div>
  );
}
