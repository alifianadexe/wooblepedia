/**
 * localStorage-backed persistence. All keys are namespaced under "llmfund:"
 * per the site spec. Writes dispatch a same-tab custom event so components
 * elsewhere on the page can react without a page reload (the native
 * "storage" event only fires in *other* tabs).
 */
import { useCallback, useEffect, useState } from "react";

const PREFIX = "llmfund:";
const PROGRESS_EVENT = "llmfund:progress";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(PROGRESS_EVENT));
  } catch {
    // localStorage unavailable (private mode / quota) -- fail silently
  }
}

export function getCompletedSlugs(): string[] {
  return readJSON<string[]>("completed", []);
}

export function isSlugComplete(slug: string): boolean {
  return getCompletedSlugs().includes(slug);
}

export function setSlugComplete(slug: string, complete: boolean): string[] {
  const current = new Set(getCompletedSlugs());
  if (complete) current.add(slug);
  else current.delete(slug);
  const next = Array.from(current);
  writeJSON("completed", next);
  return next;
}

export function getReadRefs(slug: string): Record<number, boolean> {
  return readJSON<Record<number, boolean>>(`refs:${slug}`, {});
}

export function setRefRead(slug: string, index: number, read: boolean): Record<number, boolean> {
  const current = getReadRefs(slug);
  const next = { ...current, [index]: read };
  writeJSON(`refs:${slug}`, next);
  return next;
}

export function getLabSetting<T>(labKey: string, fallback: T): T {
  return readJSON<T>(`lab:${labKey}`, fallback);
}

export function setLabSetting<T>(labKey: string, value: T): void {
  writeJSON(`lab:${labKey}`, value);
}

// ---------------------------------------------------------------------------
// React hooks
// ---------------------------------------------------------------------------

export function useCompletion(slug: string): [boolean, (v: boolean) => void] {
  const [complete, setComplete] = useState(() => isSlugComplete(slug));
  useEffect(() => setComplete(isSlugComplete(slug)), [slug]);
  const update = useCallback(
    (v: boolean) => {
      setSlugComplete(slug, v);
      setComplete(v);
    },
    [slug],
  );
  return [complete, update];
}

export function useCompletedSlugs(): string[] {
  const [slugs, setSlugs] = useState<string[]>(() => getCompletedSlugs());
  useEffect(() => {
    const handler = () => setSlugs(getCompletedSlugs());
    window.addEventListener("storage", handler);
    window.addEventListener(PROGRESS_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(PROGRESS_EVENT, handler);
    };
  }, []);
  return slugs;
}

/** Persisted numeric/string/boolean lab setting, restored across visits. */
export function useLabSetting<T>(labKey: string, fallback: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => getLabSetting(labKey, fallback));
  const update = useCallback(
    (v: T) => {
      setValue(v);
      setLabSetting(labKey, v);
    },
    [labKey],
  );
  return [value, update];
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setReduced(mql.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return reduced;
}
