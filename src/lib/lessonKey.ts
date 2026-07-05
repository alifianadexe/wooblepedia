import type { LessonMeta } from "./syllabus";

/**
 * Module 2 and Module 3 both have a chapter named "overview" with the same
 * slug -- storage keys must include the module so completion/reference
 * state doesn't bleed across them.
 */
export function lessonKey(l: Pick<LessonMeta, "module" | "slug">): string {
  return `m${l.module}/${l.slug}`;
}
