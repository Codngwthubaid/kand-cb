import { useEffect, useRef, useState } from "react";
import { Send, Square } from "lucide-react";
import type { ResponseLength } from "../../types/chat";
import { LENGTH_OPTIONS } from "../../utils/responseLength";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  isGenerating: boolean;
  disabled?: boolean;
  length: ResponseLength;
  onLengthChange: (length: ResponseLength) => void;
  /** Quoted text to insert (from "ask about selection"). Consumed once. */
  pendingQuote: { id: number; text: string } | null;
  onQuoteConsumed: () => void;
}

function toBlockquote(text: string): string {
  return text
    .trim()
    .split("\n")
    .map((line) => `> ${line}`)
    .join("\n");
}

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  disabled = false,
  length,
  onLengthChange,
  pendingQuote,
  onQuoteConsumed,
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [appliedQuoteId, setAppliedQuoteId] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Insert quoted selection text when a new quote arrives (adjusting state
  // when props change — no effect needed for this). The append is idempotent
  // so StrictMode double-rendering can't insert the quote twice.
  if ((pendingQuote?.id ?? null) !== appliedQuoteId) {
    setAppliedQuoteId(pendingQuote?.id ?? null);
    if (pendingQuote) {
      const quoted = toBlockquote(pendingQuote.text);
      setValue((prev) => {
        const clean = prev.replace(/\s+$/, "");
        if (clean.endsWith(quoted)) return prev;
        return clean ? `${clean}\n\n${quoted}\n\n` : `${quoted}\n\n`;
      });
    }
  }

  // Consume the quote (notify parent) and focus the composer.
  useEffect(() => {
    if (!pendingQuote) return;
    onQuoteConsumed();
    textareaRef.current?.focus();
  }, [pendingQuote, onQuoteConsumed]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !isGenerating && !disabled;

  // Auto-grow (cap via CSS max-height).
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const submit = (): void => {
    if (!canSend) return;
    onSend(trimmed);
    setValue("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  return (
    <div className="composer-wrap">
      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="composer-footer">
          <div className="segmented length-seg" role="radiogroup" aria-label="Answer length">
            {LENGTH_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={length === opt.value}
                className={`segmented-btn${length === opt.value ? " active" : ""}`}
                onClick={() => onLengthChange(opt.value)}
                title={opt.hint}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <label htmlFor="chat-input" className="sr-only">
          Type your message. Press Enter to send, Shift plus Enter for a new line.
        </label>
        <textarea
          id="chat-input"
          ref={textareaRef}
          className="composer-textarea"
          placeholder="Type your message..."
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        {isGenerating ? (
          <button
            type="button"
            className="btn btn-danger send-btn"
            onClick={onStop}
            aria-label="Stop generating response"
            title="Stop generating"
          >
            <Square size={16} aria-hidden="true" />
            <span>Stop</span>
          </button>
        ) : (
          <button
            type="submit"
            className="btn btn-primary send-btn"
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
          >
            <Send size={16} aria-hidden="true" />
            <span>Send</span>
          </button>
        )}
      </form>
    </div>
  );
}
