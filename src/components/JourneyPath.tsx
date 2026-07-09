import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import type { LessonMeta } from "../lib/syllabus";
import { lessonPath } from "../lib/syllabus";
import { lessonKey } from "../lib/lessonKey";

const NODE_D = 56;
const SPACING_Y = 122;
const AMPLITUDE = 68;
const CENTER_X = 160;
const VIEW_W = 320;
const TOP_PAD = NODE_D / 2 + 14;

interface NodeAccentStyle extends CSSProperties {
  "--node-accent": string;
}

function CheckGlyph() {
  return (
    <svg className="journey-node__check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4 10.5L8 14.5L16 6" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function JourneyPath({
  lessons,
  accent,
  completedKeys,
}: {
  lessons: LessonMeta[];
  accent: string;
  completedKeys: Set<string>;
}) {
  const positions = lessons.map((_, i) => ({
    x: CENTER_X + AMPLITUDE * Math.sin(i * 0.85 + 0.4),
    y: TOP_PAD + i * SPACING_Y,
  }));
  const totalHeight = positions[positions.length - 1].y + NODE_D / 2 + 14;

  let pathD = "";
  positions.forEach((p, i) => {
    if (i === 0) {
      pathD = `M ${p.x} ${p.y}`;
      return;
    }
    const prev = positions[i - 1];
    const midY = (prev.y + p.y) / 2;
    pathD += ` C ${prev.x} ${midY}, ${p.x} ${midY}, ${p.x} ${p.y}`;
  });

  return (
    <div
      className="journey-path"
      style={{ height: totalHeight }}
      role="list"
      aria-label={`Lesson path, ${lessons.length} stops`}
    >
      <svg
        className="journey-path__svg"
        viewBox={`0 0 ${VIEW_W} ${totalHeight}`}
        preserveAspectRatio="none"
        width="100%"
        height={totalHeight}
        aria-hidden="true"
      >
        <path d={pathD} fill="none" stroke={accent} strokeOpacity={0.4} strokeWidth={3} strokeDasharray="2 13" strokeLinecap="round" />
      </svg>
      {lessons.map((lesson, i) => {
        const p = positions[i];
        const complete = completedKeys.has(lessonKey(lesson));
        const nodeAccent = complete ? "var(--green)" : accent;
        return (
          <Link
            key={lesson.slug}
            to={lessonPath(lesson)}
            className="journey-node"
            role="listitem"
            style={{ left: `${(p.x / VIEW_W) * 100}%`, top: p.y, "--node-accent": nodeAccent } as NodeAccentStyle}
          >
            <span className="journey-node__circle">
              {complete ? <CheckGlyph /> : <span className="journey-node__num">{lesson.chapter}</span>}
            </span>
            <span className="journey-node__label">{lesson.shortTitle}</span>
          </Link>
        );
      })}
    </div>
  );
}
