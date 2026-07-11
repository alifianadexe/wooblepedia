/**
 * Light/dark mode toggle. The chosen mode persists in localStorage under
 * "llmfund:theme" (falling back to the OS `prefers-color-scheme` on first
 * visit) and applies via a `data-theme` attribute on <html>, which drives
 * the dark palette block in styles/global.css. `colors`/`moduleAccent` in
 * lib/theme.ts read that same attribute live, so switching modes re-themes
 * every lesson's inline SVG/canvas fills too -- see the `key={theme}` on
 * the routed content in App.tsx, which forces those labs to remount and
 * redraw with the new palette.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "llmfund:theme";

function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

function readTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    // localStorage unavailable -- fall through to system preference
  }
  return systemPrefersDark() ? "dark" : "light";
}

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
}

/** Sets the data-theme attribute from the stored/system preference; call once before render. */
export function applyStoredTheme(): void {
  applyTheme(readTheme());
}

const ThemeContext = createContext<{ theme: ThemeMode; setTheme: (t: ThemeMode) => void }>({
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(readTheme);
  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // localStorage unavailable -- mode just won't persist
    }
  }, []);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): { theme: ThemeMode; setTheme: (t: ThemeMode) => void } {
  return useContext(ThemeContext);
}
