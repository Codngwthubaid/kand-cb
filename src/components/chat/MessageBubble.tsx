import { memo, useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Copy, RotateCcw, User } from "lucide-react";
import type { Message } from "../../types/chat";
import { formatClockTime, formatFullDateTime } from "../../utils/date";

interface MessageBubbleProps {
  message: Message;
  /** True for the latest AI reply — enables the regenerate action. */
  isLastAi?: boolean;
  isGenerating?: boolean;
  onRegenerate?: () => void;
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — ignore
    }
  }, [code]);

  return (
    <div className="codeblock">
      <div className="codeblock-header">
        <span className="codeblock-lang">{language || "code"}</span>
        <button
          type="button"
          className="icon-btn codeblock-copy"
          onClick={copy}
          aria-label={copied ? "Code copied" : "Copy code"}
          title={copied ? "Copied" : "Copy code"}
        >
          {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
          <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre className="codeblock-pre" tabIndex={0}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

function AiMarkdown({ text }: { text: string }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a(props) {
            const { href, children } = props;
            return (
              <a href={href} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
          // `inline` is not in the current @types; detect via absence of className.
          code(props) {
            const { className, children } = props as {
              className?: string;
              children?: React.ReactNode;
            };
            const raw = String(children ?? "").replace(/\n$/, "");
            const match = /language-(\w+)/.exec(className ?? "");
            if (match) {
              return <CodeBlock language={match[1]} code={raw} />;
            }
            return <code className="inline-code">{children}</code>;
          },
          pre(props) {
            const { children } = props;
            // If the child is already our CodeBlock wrapper, don't double-wrap.
            return <>{children}</>;
          },
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isLastAi = false,
  isGenerating = false,
  onRegenerate,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copyResponse = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore
    }
  }, [message.text]);

  if (isUser) {
    return (
      <div className="message-row user">
        <div className="bubble bubble-user">
          <p className="message-text">{message.text}</p>
          <time
            className="timestamp"
            dateTime={new Date(message.createdAt).toISOString()}
            title={formatFullDateTime(message.createdAt)}
          >
            {formatClockTime(message.createdAt)}
          </time>
        </div>
        <div className="avatar avatar-user" aria-hidden="true">
          <User size={18} />
        </div>
      </div>
    );
  }

  return (
    <div className="message-row ai">
      <div className="avatar avatar-ai" aria-hidden="true">
        <Bot size={16} />
      </div>
      <div className="bubble bubble-ai">
        <AiMarkdown text={message.text} />
        <div className="ai-actions">
          <button
            type="button"
            className="action-btn"
            onClick={copyResponse}
            aria-label={copied ? "Response copied" : "Copy response"}
            title={copied ? "Copied" : "Copy response"}
          >
            {copied ? (
              <Check size={15} aria-hidden="true" />
            ) : (
              <Copy size={15} aria-hidden="true" />
            )}
            <span className="sr-only" aria-live="polite">
              {copied ? "Copied" : ""}
            </span>
          </button>
          {isLastAi && onRegenerate && (
            <button
              type="button"
              className="action-btn"
              onClick={onRegenerate}
              disabled={isGenerating}
              aria-label="Regenerate response"
              title="Regenerate response"
            >
              <RotateCcw size={15} aria-hidden="true" />
            </button>
          )}
          <time
            className="timestamp timestamp-inline"
            dateTime={new Date(message.createdAt).toISOString()}
            title={formatFullDateTime(message.createdAt)}
          >
            {formatClockTime(message.createdAt)}
          </time>
          {copied && (
            <span className="copied-hint" aria-hidden="true">
              Copied ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
});
