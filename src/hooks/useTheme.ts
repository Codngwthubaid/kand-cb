import { useCallback, useEffect, useState } from "react";
import type { ResolvedTheme, ThemePreference } from "../types/chat";
import { THEME_KEY } from "../utils/storage";

function readPreference(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "light" || raw === "dark" || raw === "system") return raw;
  } catch {
    // ignore
  }
  return "system";
}

function prefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);
  const [systemDark, setSystemDark] = useState<boolean>(prefersDark);

  const resolved: ResolvedTheme =
    preference === "system" ? (systemDark ? "dark" : "light") : preference;

  // Sync the resolved theme to the DOM + persist the preference.
  // This synchronizes React state with an external system (document + storage),
  // which is the legitimate use of an effect.
  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;
    try {
      localStorage.setItem(THEME_KEY, preference);
    } catch {
      // ignore
    }
  }, [resolved, preference]);

  // Track OS-level changes (only affects the "system" preference).
  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;
    const listener = (e: MediaQueryListEvent): void => setSystemDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
  }, []);

  const toggle = useCallback(() => {
    setPreferenceState((prev) => {
      const current: ResolvedTheme =
        prev === "system" ? (prefersDark() ? "dark" : "light") : prev;
      return current === "dark" ? "light" : "dark";
    });
  }, []);

  return { preference, resolved, setPreference, toggle };
}
