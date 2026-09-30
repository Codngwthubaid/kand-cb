import { Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="empty-state" role="region" aria-label="Start a conversation">
      <div className="empty-icon" aria-hidden="true">
        <Sparkles size={28} />
      </div>
      <h2 className="empty-title">Kand - CB</h2>
      <p className="empty-subtitle">Ask me anything and get a helpful response.</p>
      <p className="empty-hint">
        Select any text in a reply to ask about it · Type a message below to start.
      </p>
    </div>
  );
}
