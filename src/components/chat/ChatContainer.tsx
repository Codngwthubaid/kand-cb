import type { FriendlyError, ResponseLength, StoredChat } from "../../types/chat";
import { ChatInput } from "./ChatInput";
import { EmptyState } from "./EmptyState";
import { MessageList } from "./MessageList";

interface ChatContainerProps {
  activeChat: StoredChat | null;
  isGenerating: boolean;
  error: FriendlyError | null;
  length: ResponseLength;
  onLengthChange: (length: ResponseLength) => void;
  pendingQuote: { id: number; text: string } | null;
  onQuoteConsumed: () => void;
  onSend: (text: string) => void;
  onStop: () => void;
  onRetry: () => void;
  onRegenerate: () => void;
  onDismissError: () => void;
  onAskAboutSelection: (text: string) => void;
}

export function ChatContainer({
  activeChat,
  isGenerating,
  error,
  length,
  onLengthChange,
  pendingQuote,
  onQuoteConsumed,
  onSend,
  onStop,
  onRetry,
  onRegenerate,
  onDismissError,
  onAskAboutSelection,
}: ChatContainerProps) {
  const messages = activeChat?.messages ?? [];
  const isEmpty = messages.length === 0;

  return (
    <main className="chat-main" aria-label="Chat conversation">
      {isEmpty ? (
        <div className="chat-scroll">
          <EmptyState />
        </div>
      ) : (
        <MessageList
          messages={messages}
          isGenerating={isGenerating}
          error={error}
          onRetry={onRetry}
          onRegenerate={onRegenerate}
          onDismissError={onDismissError}
          onAskAboutSelection={onAskAboutSelection}
        />
      )}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isGenerating={isGenerating}
        length={length}
        onLengthChange={onLengthChange}
        pendingQuote={pendingQuote}
        onQuoteConsumed={onQuoteConsumed}
      />
      <p className="privacy-note" role="note">
        Chats are stored locally and automatically deleted after 24 hours.
      </p>
    </main>
  );
}
