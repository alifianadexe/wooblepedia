/**
 * Reading font-size control. Multiplies the lesson-reading text sizes by a
 * scale factor (via the CSS custom property --reading-scale), persisted in
 * localStorage so a comfortable size sticks across visits. Only the reading
 * surfaces scale -- the instrument chrome (mono labels, buttons) stays fixed.
 */
const STORAGE_KEY = "llmfund:fontscale";

export const FONT_SCALES = [0.9, 1, 1.15, 1.3, 1.45] as const;
export const DEFAULT_SCALE = 1;

export function clampScale(v: number): number {
  const min = FONT_SCALES[0];
  const max = FONT_SCALES[FONT_SCALES.length - 1];
  return Math.min(max, Math.max(min, v));
}

export function readFontScale(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCALE;
    const n = Number(raw);
    return Number.isFinite(n) ? clampScale(n) : DEFAULT_SCALE;
  } catch {
    return DEFAULT_SCALE;
  }
}

export function setFontScale(scale: number): number {
  const clamped = clampScale(scale);
  document.documentElement.style.setProperty("--reading-scale", String(clamped));
  try {
    localStorage.setItem(STORAGE_KEY, String(clamped));
  } catch {
    // localStorage unavailable -- size just won't persist
  }
  return clamped;
}

/** Sets the CSS variable from the stored value; call once before render. */
export function applyStoredFontScale(): void {
  document.documentElement.style.setProperty("--reading-scale", String(readFontScale()));
}

/** Nearest step up/down from the current scale, for the −/+ buttons. */
export function stepScale(current: number, dir: 1 | -1): number {
  if (dir === 1) {
    const next = FONT_SCALES.find((s) => s > current + 1e-6);
    return next ?? FONT_SCALES[FONT_SCALES.length - 1];
  }
  const lower = [...FONT_SCALES].reverse().find((s) => s < current - 1e-6);
  return lower ?? FONT_SCALES[0];
}
