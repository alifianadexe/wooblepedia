/**
 * Solid-color palette for inline SVG/canvas rendering, where fills must be
 * opaque (no CSS variables, no translucency). Mirrors the CSS custom
 * properties in styles/global.css -- a warm-paper, single-accent system
 * modeled on Notion's marketing design language: one structural blue,
 * everything else decorative "sticker" color.
 */
export const colors = {
  background: "#F6F5F4",
  panel: "#FFFFFF",
  panel2: "#F0EEEB",
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
  // Extended sticker + brand tokens (not aliased above, used directly where needed)
  ink2: "#31302E",
  primaryActive: "#005BAB",
  secondary: "#213183",
  sky: "#62AEF0",
  purple: "#D6B6F6",
  purpleDeep: "#391C57",
  brown: "#523410",
  onPrimary: "#FFFFFF",
} as const;

export type ModuleId = 1 | 2 | 3;

export const moduleAccent: Record<ModuleId, string> = {
  1: colors.cyan,
  2: colors.amber,
  3: colors.magenta,
};

export const moduleName: Record<ModuleId, string> = {
  1: "Architecture",
  2: "Pre-Training",
  3: "Post-Training",
};

export const fonts = {
  mono: `"Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif`,
  sans: `"Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif`,
};
