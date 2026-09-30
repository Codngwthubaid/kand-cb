import { X } from "lucide-react";
import type { ReactNode } from "react";

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  if (!open) return null;
  return (
    <div className="drawer-root">
      <div
        className="drawer-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="drawer-panel" role="dialog" aria-modal="true" aria-label="Chat history">
        <button type="button" className="icon-btn drawer-close" onClick={onClose} aria-label="Close chat history">
          <X size={20} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>
  );
}
