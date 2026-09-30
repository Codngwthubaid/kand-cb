import { useCallback, useState } from "react";
import { ChatContainer } from "./components/chat/ChatContainer";
import { Header } from "./components/layout/Header";
import { MobileDrawer } from "./components/layout/MobileDrawer";
import { SettingsModal } from "./components/layout/SettingsModal";
import { ChatSidebar } from "./components/sidebar/ChatSidebar";
import { useChat } from "./hooks/useChat";
import { useTheme } from "./hooks/useTheme";
import { loadChats } from "./utils/storage";

function isMobileViewport(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 900px)").matches
  );
}

export default function App() {
  const { preference, resolved, setPreference, toggle } = useTheme();
  const chat = useChat();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingQuote, setPendingQuote] = useState<{ id: number; text: string } | null>(null);

  const handleSelect = useCallback(
    (id: string) => {
      chat.selectChat(id);
      setDrawerOpen(false);
    },
    [chat],
  );

  const handleNewChat = useCallback(() => {
    chat.newChat();
    setDrawerOpen(false);
  }, [chat]);

  /** Hamburger: opens the drawer on mobile, collapses the sidebar on desktop. */
  const handleMenu = useCallback(() => {
    if (isMobileViewport()) {
      setDrawerOpen(true);
    } else {
      setSidebarCollapsed((prev) => !prev);
    }
  }, []);

  const handleAskAboutSelection = useCallback((text: string) => {
    setPendingQuote({ id: Date.now(), text });
  }, []);

  const handleQuoteConsumed = useCallback(() => {
    setPendingQuote(null);
  }, []);

  const handleChatsCleared = useCallback(() => {
    // Force a reload of the (now empty) store by re-selecting nothing.
    chat.newChat();
    // loadChats purges; trigger state refresh through a fresh read.
    void loadChats();
    window.location.reload();
  }, [chat]);

  const sidebar = (
    <ChatSidebar
      chats={chat.chats}
      activeChatId={chat.activeChatId}
      onNewChat={handleNewChat}
      onSelect={handleSelect}
      onDelete={chat.deleteChat}
    />
  );

  return (
    <div className="app-shell">
      <Header
        resolvedTheme={resolved}
        sidebarExpanded={!sidebarCollapsed}
        onToggleTheme={toggle}
        onNewChat={handleNewChat}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenMenu={handleMenu}
      />
      <div className="app-body">
        <div className={`sidebar-desktop${sidebarCollapsed ? " hidden" : ""}`}>{sidebar}</div>
        <ChatContainer
          activeChat={chat.activeChat}
          isGenerating={chat.isGenerating}
          error={chat.error}
          length={chat.responseLength}
          onLengthChange={chat.setResponseLength}
          pendingQuote={pendingQuote}
          onQuoteConsumed={handleQuoteConsumed}
          onSend={chat.sendMessage}
          onStop={chat.stopGeneration}
          onRetry={chat.retry}
          onRegenerate={chat.regenerate}
          onDismissError={chat.clearError}
          onAskAboutSelection={handleAskAboutSelection}
        />
      </div>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {sidebar}
      </MobileDrawer>
      <SettingsModal
        open={settingsOpen}
        themePreference={preference}
        onThemeChange={setPreference}
        onClose={() => setSettingsOpen(false)}
        onChatsCleared={handleChatsCleared}
      />
    </div>
  );
}
