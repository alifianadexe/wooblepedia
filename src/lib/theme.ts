/**
 * Solid-color palette for inline SVG/canvas rendering, where fills must be
 * opaque (no CSS variables, no translucency). `panel`/`panel2`/`screen`/
 * `border` are deliberately solid here even though the same-named CSS
 * custom properties in styles/global.css are translucent glass surfaces --
 * SVG rects and canvas fillStyle need a real opaque backdrop to stay
 * readable regardless of what the page's glass panels are doing.
 */
export const colors = {
  background: "#05070D",
  panel: "#0C1322",
  panel2: "#101A2E",
  screen: "#08101E",
  border: "#1C2B44",
  gridLine: "rgba(62,219,211,0.06)",
  amber: "#FFB454",
  cyan: "#3EDBD3",
  green: "#8CE05F",
  magenta: "#E86AA6",
  red: "#F0716B",
  text: "#DCE6F2",
  muted: "#7688A4",
  faint: "#3A4A61",
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
  mono: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace`,
  sans: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
};
