/**
 * Solid-color palette for inline SVG/canvas rendering, where fills must be
 * opaque (no CSS variables, no translucency). Mirrors the CSS custom
 * properties in styles/global.css -- a warm-paper, single-accent system
 * modeled on Notion's marketing design language: one structural blue,
 * everything else decorative "sticker" color.
 *
 * `colors` and `moduleAccent` are Proxies that resolve against the live
 * `data-theme` attribute on <html> (see lib/themeMode.tsx), so every lesson
 * that reads e.g. `colors.cyan` picks up the current light/dark palette
 * automatically -- no lesson file needs to know dark mode exists.
 */
const LIGHT = {
  background: "#F6F5F4",
  panel: "#FFFFFF",
  panel2: "#F0EEEA",
  screen: "#FBFAF9",
  border: "#E6E6E6",
  borderStrong: "#D8D6D3",
  gridLine: "rgba(25,25,24,0.05)",
  amber: "#DD5B00",
  cyan: "#0075DE",
  green: "#1AAE39",
  magenta: "#FF64C8",
  red: "#E5484D",
  text: "#191918",
  muted: "#615D59",
  faint: "#A39E98",
  ink2: "#31302E",
  primaryActive: "#005BAB",
  secondary: "#213183",
  sky: "#62AEF0",
  purple: "#D6B6F6",
  purpleDeep: "#391C57",
  brown: "#523410",
  onPrimary: "#FFFFFF",
} as const;

const DARK = {
  background: "#191919",
  panel: "#242424",
  panel2: "#1D1D1D",
  screen: "#202020",
  border: "#3A3A3A",
  borderStrong: "#4A4A4A",
  gridLine: "rgba(255,255,255,0.06)",
  amber: "#FF8A3D",
  cyan: "#4DA3FF",
  green: "#4DD273",
  magenta: "#FF8AD8",
  red: "#FF6B6B",
  text: "#EDEDEC",
  muted: "#9B9B98",
  faint: "#666663",
  ink2: "#D4D4D1",
  primaryActive: "#7CBBFF",
  secondary: "#3548A8",
  sky: "#8AC4FF",
  purple: "#E3CBFA",
  purpleDeep: "#C9A6EE",
  brown: "#B98352",
  onPrimary: "#101010",
} as const;

type Palette = { [K in keyof typeof LIGHT]: string };

function isDarkMode(): boolean {
  return typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "dark";
}

function livePalette(): Palette {
  return isDarkMode() ? DARK : LIGHT;
}

export const colors: Palette = new Proxy({} as Palette, {
  get(_target, prop: string) {
    return livePalette()[prop as keyof Palette];
  },
}) as Palette;

export type ModuleId = 1 | 2 | 3;

export const moduleAccent: Record<ModuleId, string> = new Proxy({} as Record<ModuleId, string>, {
  get(_target, prop: string) {
    const id = Number(prop);
    if (id === 1) return colors.cyan;
    if (id === 2) return colors.amber;
    if (id === 3) return colors.magenta;
    return undefined;
  },
}) as Record<ModuleId, string>;

export const moduleName: Record<ModuleId, string> = {
  1: "Architecture",
  2: "Pre-Training",
  3: "Post-Training",
};

export const fonts = {
  mono: `"Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif`,
  sans: `"Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif`,
};
