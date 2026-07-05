import { Suspense } from "react";
import { useParams } from "react-router-dom";
import { lessonComponents } from "../lessons";
import type { ModuleId } from "../lib/syllabus";
import { NotFound } from "./NotFound";

export function LessonPage({ moduleId }: { moduleId: ModuleId }) {
  const { slug = "" } = useParams();
  const Component = lessonComponents[`${moduleId}/${slug}`];

  if (!Component) return <NotFound />;

  return (
    <Suspense fallback={<div className="mono" style={{ color: "var(--muted)" }}>LOADING CHANNEL…</div>}>
      <Component />
    </Suspense>
  );
}
