import { useCallback, useMemo, useRef, useState } from "react";
import { sendGroqMessage, toFriendlyErrorFromUnknown } from "../services/groq";
import type { Chat, FriendlyError, Message, ResponseLength, StoredChat } from "../types/chat";
import { generateChatTitle, createId } from "../utils/chatTitle";
import { LENGTH_STORAGE_KEY, readResponseLength, systemPromptFor } from "../utils/responseLength";
import { loadChats, saveChats, toStoredChat, touchChat } from "../utils/storage";

interface UseChatResult {
  chats: StoredChat[];
  activeChat: StoredChat | null;
  activeChatId: string | null;
  isGenerating: boolean;
  error: FriendlyError | null;
  lastFailedPrompt: string | null;
  responseLength: ResponseLength;
  setResponseLength: (length: ResponseLength) => void;
  sendMessage: (text: string) => Promise<void>;
  retry: () => Promise<void>;
  regenerate: () => Promise<void>;
  stopGeneration: () => void;
  newChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  clearError: () => void;
}

function emptyChat(): Chat {
  const now = Date.now();
  return { id: createId(), title: "New chat", messages: [], createdAt: now, updatedAt: now };
}

export function useChat(): UseChatResult {
  const [chats, setChats] = useState<StoredChat[]>(() => loadChats());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<FriendlyError | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [responseLength, setResponseLengthState] = useState<ResponseLength>(readResponseLength);
  const abortRef = useRef<AbortController | null>(null);
  /** Length used by the most recent request — retry/regenerate reuse it. */
  const lastLengthRef = useRef<ResponseLength>(readResponseLength());

  // `loadChats()` purges expired chats on every read and `saveChats()` purges
  // on every write, so expiry is enforced without a mount effect.

  const persist = useCallback((next: StoredChat[]) => {
    setChats(saveChats(next));
  }, []);

  const activeChat = useMemo(
    () => chats.find((c) => c.id === activeChatId) ?? null,
    [chats, activeChatId],
  );

  const setResponseLength = useCallback((length: ResponseLength) => {
    lastLengthRef.current = length;
    setResponseLengthState(length);
    try {
      localStorage.setItem(LENGTH_STORAGE_KEY, length);
    } catch {
      // ignore
    }
  }, []);

  const runGeneration = useCallback(
    async (chatId: string, promptText: string, historyForApi: Message[], length: ResponseLength) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setIsGenerating(true);
      setError(null);
      try {
        const replyText = await sendGroqMessage(promptText, historyForApi, {
          signal: controller.signal,
          systemPrompt: systemPromptFor(length),
        });
        const aiMessage: Message = {
          id: createId(),
          role: "model",
          text: replyText,
          createdAt: Date.now(),
        };
        setChats((prev) => {
          const target = prev.find((c) => c.id === chatId);
          if (!target) return prev;
          const updated: StoredChat = touchChat({
            ...target,
            messages: [...target.messages, aiMessage],
          });
          const next = prev.map((c) => (c.id === chatId ? updated : c));
          return saveChats(next);
        });
        setLastFailedPrompt(null);
      } catch (err) {
        const friendly = toFriendlyErrorFromUnknown(err);
        if (friendly.kind === "aborted") {
          // Stopped by the user — keep the user message, show no error card.
          setLastFailedPrompt(null);
          return;
        }
        setError(friendly);
        setLastFailedPrompt(promptText);
      } finally {
        abortRef.current = null;
        setIsGenerating(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || isGenerating) return;
      lastLengthRef.current = responseLength;

      let chatId = activeChatId;
      let historyForApi: Message[] = [];

      if (!chatId) {
        // Lazily create the chat on first send so "New chat" stays empty until used.
        const now = Date.now();
        const base = emptyChat();
        const userMessage: Message = { id: createId(), role: "user", text, createdAt: now };
        const created: StoredChat = toStoredChat({
          ...base,
          title: generateChatTitle(text),
          messages: [userMessage],
          createdAt: now,
          updatedAt: now,
        });
        persist([created, ...chats]);
        setActiveChatId(created.id);
        chatId = created.id;
        historyForApi = [];
        await runGeneration(chatId, text, historyForApi, responseLength);
        return;
      }

      const current = chats.find((c) => c.id === chatId);
      const priorMessages = current?.messages ?? [];
      const userMessage: Message = { id: createId(), role: "user", text, createdAt: Date.now() };
      const isFirstUserMessage =
        priorMessages.filter((m) => m.role === "user").length === 0;

      setChats((prev) => {
        const target = prev.find((c) => c.id === chatId);
        if (!target) return prev;
        const updated: StoredChat = touchChat({
          ...target,
          title: isFirstUserMessage ? generateChatTitle(text) : target.title,
          messages: [...target.messages, userMessage],
        });
        return saveChats(prev.map((c) => (c.id === chatId ? updated : c)));
      });

      historyForApi = priorMessages;
      await runGeneration(chatId, text, historyForApi, responseLength);
    },
    [activeChatId, chats, isGenerating, persist, responseLength, runGeneration],
  );

  const retry = useCallback(async () => {
    if (isGenerating || !lastFailedPrompt || !activeChatId) return;
    const current = chats.find((c) => c.id === activeChatId);
    const messages = current?.messages ?? [];
    // The failed user prompt is already the trailing message — exclude it
    // from history so it isn't sent twice.
    const history =
      messages.length > 0 &&
      messages[messages.length - 1].role === "user" &&
      messages[messages.length - 1].text === lastFailedPrompt
        ? messages.slice(0, -1)
        : messages;
    await runGeneration(activeChatId, lastFailedPrompt, history, lastLengthRef.current);
  }, [activeChatId, chats, isGenerating, lastFailedPrompt, runGeneration]);

  const regenerate = useCallback(async () => {
    if (isGenerating || !activeChatId) return;
    const current = chats.find((c) => c.id === activeChatId);
    const messages = current?.messages ?? [];
    // Re-answer the last user message: drop any trailing model reply (and a
    // possible newer failed attempt is handled by retry instead).
    let idx = messages.length - 1;
    while (idx >= 0 && messages[idx].role !== "user") idx--;
    if (idx < 0) return;
    const prompt = messages[idx].text;
    const history = messages.slice(0, idx);
    setChats((prev) => {
      const target = prev.find((c) => c.id === activeChatId);
      if (!target) return prev;
      const trimmed: StoredChat = touchChat({
        ...target,
        messages: [...messages.slice(0, idx + 1)],
      });
      return saveChats(prev.map((c) => (c.id === activeChatId ? trimmed : c)));
    });
    await runGeneration(activeChatId, prompt, history, lastLengthRef.current);
  }, [activeChatId, chats, isGenerating, runGeneration]);

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const newChat = useCallback(() => {
    stopGeneration();
    setActiveChatId(null);
    setError(null);
    setLastFailedPrompt(null);
    setIsGenerating(false);
  }, [stopGeneration]);

  const selectChat = useCallback(
    (id: string) => {
      if (isGenerating) stopGeneration();
      setActiveChatId(id);
      setError(null);
      setLastFailedPrompt(null);
    },
    [isGenerating, stopGeneration],
  );

  const deleteChat = useCallback(
    (id: string) => {
      if (isGenerating && id === activeChatId) stopGeneration();
      setChats((prev) => saveChats(prev.filter((c) => c.id !== id)));
      setActiveChatId((prev) => (prev === id ? null : prev));
      setError(null);
      setLastFailedPrompt(null);
    },
    [activeChatId, isGenerating, stopGeneration],
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    chats,
    activeChat,
    activeChatId,
    isGenerating,
    error,
    lastFailedPrompt,
    responseLength,
    setResponseLength,
    sendMessage,
    retry,
    regenerate,
    stopGeneration,
    newChat,
    selectChat,
    deleteChat,
    clearError,
  };
}
