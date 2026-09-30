import { memo } from "react";
import { MessageSquareText, Trash2 } from "lucide-react";
import { relativeTime } from "../../utils/date";

interface ChatHistoryItemProps {
  id: string;
  title: string;
  updatedAt: number;
  active: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const ChatHistoryItem = memo(function ChatHistoryItem({
  id,
  title,
  updatedAt,
  active,
  onSelect,
  onDelete,
}: ChatHistoryItemProps) {
  return (
    <li className={`history-item${active ? " active" : ""}`}>
      <button
        type="button"
        className="history-select"
        onClick={() => onSelect(id)}
        aria-label={`Open chat: ${title}`}
        aria-current={active ? "true" : undefined}
      >
        <MessageSquareText size={15} aria-hidden="true" className="history-icon" />
        <span className="history-text">
          <span className="history-title">{title}</span>
          <span className="history-time">{relativeTime(updatedAt)}</span>
        </span>
      </button>
      <button
        type="button"
        className="icon-btn history-delete"
        onClick={() => onDelete(id)}
        aria-label={`Delete chat: ${title}`}
        title="Delete chat"
      >
        <Trash2 size={14} aria-hidden="true" />
      </button>
    </li>
  );
});
