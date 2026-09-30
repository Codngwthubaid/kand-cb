import { Trash2, X } from "lucide-react";
import { GROQ_MODEL } from "../../config";
import type { ThemePreference } from "../../types/chat";
import { isApiKeyConfigured } from "../../services/groq";
import { clearAllChats } from "../../utils/storage";

interface SettingsModalProps {
  open: boolean;
  themePreference: ThemePreference;
  onThemeChange: (pref: ThemePreference) => void;
  onClose: () => void;
  onChatsCleared: () => void;
}

export function SettingsModal({ open, themePreference, onThemeChange, onClose, onChatsCleared }: SettingsModalProps) {
  // Mount the form only while open so its state is freshly initialised
  // from localStorage on every open (no sync effect needed).
  if (!open) return null;
  return (
    <SettingsForm
      themePreference={themePreference}
      onThemeChange={onThemeChange}
      onClose={onClose}
      onChatsCleared={onChatsCleared}
    />
  );
}

function SettingsForm({
  themePreference,
  onThemeChange,
  onClose,
  onChatsCleared,
}: Omit<SettingsModalProps, "open">) {
  const envConfigured = isApiKeyConfigured();

  const clearChats = (): void => {
    clearAllChats();
    onChatsCleared();
    onClose();
  };

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-label="Settings">
      <div className="modal-overlay" onClick={onClose} aria-hidden="true" />
      <div className="modal-panel">
        <div className="modal-header">
          <h2>Settings</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close settings">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal-body">
          <section className="setting-group">
            <h3>Appearance</h3>
            <div className="segmented" role="radiogroup" aria-label="Theme">
              {(["light", "dark", "system"] as ThemePreference[]).map((pref) => (
                <button
                  key={pref}
                  type="button"
                  role="radio"
                  aria-checked={themePreference === pref}
                  className={`segmented-btn${themePreference === pref ? " active" : ""}`}
                  onClick={() => onThemeChange(pref)}
                >
                  {pref.charAt(0).toUpperCase() + pref.slice(1)}
                </button>
              ))}
            </div>
          </section>

          <section className="setting-group">
            <h3>Groq API</h3>
            <p className="setting-text">
              Model: <code className="inline-code">{GROQ_MODEL}</code>
              <br />
              Status: {envConfigured ? "API key configured ✓" : "No API key found"}
            </p>
            <label className="setting-label">API key</label>
            <p className="setting-hint">
              Configured via the <code className="inline-code">VITE_GROQ_API_KEY</code>{" "}
              environment variable. Keys in a frontend-only app are visible to users — set spend
              limits and rotate the key if it leaks (Groq console).
            </p>
          </section>

          <section className="setting-group">
            <h3>Privacy &amp; storage</h3>
            <p className="setting-text">
              Chats are stored locally and automatically deleted after 24 hours. No accounts, no
              cookies, no backend.
            </p>
            <button type="button" className="btn btn-danger btn-sm" onClick={clearChats}>
              <Trash2 size={14} aria-hidden="true" />
              Delete all chats
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
