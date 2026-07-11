import { useTheme } from "../lib/themeMode";
import { useUI } from "../lib/i18n";

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M15.6 4.4l-1.4 1.4M5.8 14.2l-1.4 1.4M15.6 15.6l-1.4-1.4M5.8 5.8L4.4 4.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M17.2 12.1A7.5 7.5 0 018.4 2.9a7.5 7.5 0 108.8 9.2z" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const ui = useUI();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="btn font-size-control__btn"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? ui.themeToLight : ui.themeToDark}
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}
