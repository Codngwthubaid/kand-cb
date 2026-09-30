import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, MessageCircleQuestion, RotateCcw, X } from "lucide-react";
import type { FriendlyError, Message } from "../../types/chat";
import { MessageBubble } from "./MessageBubble";
import { MessageSkeleton } from "./MessageSkeleton";

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
  error: FriendlyError | null;
  onRetry: () => void;
  onRegenerate: () => void;
  onDismissError: () => void;
  onAskAboutSelection: (text: string) => void;
}

interface AskSelection {
  text: string;
  top: number;
  left: number;
}

const MAX_SELECTION_LENGTH = 2000;

export function MessageList({
  messages,
  isGenerating,
  error,
  onRetry,
  onRegenerate,
  onDismissError,
  onAskAboutSelection,
}: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [askSel, setAskSel] = useState<AskSelection | null>(null);

  const handleScroll = (): void => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickRef.current = distanceFromBottom < 80;
    setAskSel(null);
  };

  useEffect(() => {
    if (stickRef.current) {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }
  }, [messages, isGenerating, error]);

  // Track text selection inside the chat to offer "ask about this".
  const updateSelection = useCallback(() => {
    const sel = window.getSelection();
    const el = scrollRef.current;
    if (!sel || sel.isCollapsed || !el || sel.rangeCount === 0) {
      setAskSel(null);
      return;
    }
    if (!el.contains(sel.anchorNode)) {
      setAskSel(null);
      return;
    }
    const text = sel.toString().trim();
    if (!text) {
      setAskSel(null);
      return;
    }
    if (text.length > MAX_SELECTION_LENGTH) return;
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const host = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return;
    setAskSel({
      text,
      top: rect.bottom - host.top + el.scrollTop + 8,
      left: Math.min(Math.max(rect.left - host.left, 8), Math.max(host.width - 170, 8)),
    });
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", updateSelection);
    return () => document.removeEventListener("selectionchange", updateSelection);
  }, [updateSelection]);

  const askAboutSelection = useCallback(() => {
    if (!askSel) return;
    onAskAboutSelection(askSel.text);
    window.getSelection()?.removeAllRanges();
    setAskSel(null);
  }, [askSel, onAskAboutSelection]);

  const lastAiId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "model") return messages[i].id;
    }
    return null;
  })();

  return (
    <div
      ref={scrollRef}
      className="message-list"
      onScroll={handleScroll}
      role="log"
      aria-live="polite"
      aria-label="Chat messages"
      tabIndex={0}
    >
      <div className="message-list-inner">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            isLastAi={m.id === lastAiId}
            isGenerating={isGenerating}
            onRegenerate={onRegenerate}
          />
        ))}

        {isGenerating && <MessageSkeleton />}

        {error && (
          <div className="error-card" role="alert">
            <div className="error-icon" aria-hidden="true">
              <AlertTriangle size={18} />
            </div>
            <div className="error-body">
              <p className="error-title">{error.title}</p>
              <p className="error-text">
                {error.kind === "missing-key" || error.kind === "invalid-key" || error.kind === "quota"
                  ? `${error.message}`
                  : "Something went wrong while generating the response. Please try again."}
              </p>
              <div className="error-actions">
                {error.retryable && (
                  <button type="button" className="btn btn-primary btn-sm" onClick={onRetry}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Retry
                  </button>
                )}
                <button type="button" className="btn btn-ghost btn-sm" onClick={onDismissError}>
                  <X size={14} aria-hidden="true" />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {askSel && (
        <button
          type="button"
          className="ask-popup"
          style={{ top: askSel.top, left: askSel.left }}
          onMouseDown={(e) => e.preventDefault()}
          onClick={askAboutSelection}
          aria-label="Ask about the selected text"
        >
          <MessageCircleQuestion size={15} aria-hidden="true" />
          Ask about this
        </button>
      )}
    </div>
  );
}
