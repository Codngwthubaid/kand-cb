import { Plus, ShieldCheck } from "lucide-react";
import type { StoredChat } from "../../types/chat";
import { ChatHistoryItem } from "./ChatHistoryItem";

interface ChatSidebarProps {
  chats: StoredChat[];
  activeChatId: string | null;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ChatSidebar({ chats, activeChatId, onNewChat, onSelect, onDelete }: ChatSidebarProps) {
  return (
    <aside className="sidebar" aria-label="Chat history">
      <button type="button" className="btn btn-primary new-chat-btn" onClick={onNewChat}>
        <Plus size={16} aria-hidden="true" />
        New Chat
      </button>

      {chats.length === 0 ? (
        <p className="history-empty">No saved chats yet. Start a new conversation.</p>
      ) : (
        <nav aria-label="Previous conversations">
          <p className="history-heading">Today</p>
          <ul className="history-list">
            {chats.map((chat) => (
              <ChatHistoryItem
                key={chat.id}
                id={chat.id}
                title={chat.title}
                updatedAt={chat.updatedAt}
                active={chat.id === activeChatId}
                onSelect={onSelect}
                onDelete={onDelete}
              />
            ))}
          </ul>
        </nav>
      )}

      <div className="sidebar-footer">
        <ShieldCheck size={14} aria-hidden="true" />
        <span>Local only · auto-deletes after 24h</span>
      </div>
    </aside>
  );
}
