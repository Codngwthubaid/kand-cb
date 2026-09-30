import { Menu, Moon, Plus, Settings, Sparkles, Sun } from "lucide-react";
import type { ResolvedTheme } from "../../types/chat";

interface HeaderProps {
  resolvedTheme: ResolvedTheme;
  sidebarExpanded: boolean;
  onToggleTheme: () => void;
  onNewChat: () => void;
  onOpenSettings: () => void;
  onOpenMenu: () => void;
}

export function Header({ resolvedTheme, sidebarExpanded, onToggleTheme, onNewChat, onOpenSettings, onOpenMenu }: HeaderProps) {
  return (
    <header className="app-header">
      <button
        type="button"
        className="icon-btn menu-btn"
        onClick={onOpenMenu}
        aria-label={sidebarExpanded ? "Collapse chat history" : "Expand chat history"}
        aria-expanded={sidebarExpanded}
        title="Toggle sidebar"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="brand">
        <span className="brand-icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <h1 className="brand-title">AI Assistant</h1>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="btn btn-ghost btn-sm header-new-chat"
          onClick={onNewChat}
          aria-label="Start a new chat"
        >
          <Plus size={15} aria-hidden="true" />
          <span className="header-new-chat-label">New Chat</span>
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
        >
          {resolvedTheme === "dark" ? (
            <Sun size={18} aria-hidden="true" />
          ) : (
            <Moon size={18} aria-hidden="true" />
          )}
        </button>
        <button
          type="button"
          className="icon-btn"
          onClick={onOpenSettings}
          aria-label="Open settings"
          title="Settings"
        >
          <Settings size={18} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
