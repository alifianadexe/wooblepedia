import { Link } from "react-router-dom";
import { lessonsByModule, moduleTitle, lessonPath, type ModuleId } from "../lib/syllabus";
import { moduleAccent } from "../lib/theme";
import { lessonKey } from "../lib/lessonKey";
import { useCompletedSlugs } from "../lib/storage";
import { StatusDot } from "../components/StatusDot";

const MODULES: ModuleId[] = [1, 2, 3];

export function Home() {
  const completed = useCompletedSlugs();
  const completedSet = new Set(completed);

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>LLM FUNDAMENTALS — SIGNAL LAB CURRICULUM</h1>
      <p className="lesson-prose" style={{ maxWidth: "68ch", color: "var(--muted)" }}>
        Twenty-two channels across three modules. Every lab on this site computes its numbers live
        from the real equations underneath — read the lecture, then turn the dials yourself.
      </p>

      {MODULES.map((m) => {
        const topics = lessonsByModule(m);
        const doneCount = topics.filter((t) => completedSet.has(lessonKey(t))).length;
        const accent = moduleAccent[m];
        return (
          <div
            className="module-card"
            key={m}
            style={{ borderTopColor: accent, borderTopWidth: 3 }}
          >
            <div className="module-card__header">
              <span className="module-card__title" style={{ color: accent }}>
                MODULE {m} — {moduleTitle[m].toUpperCase()}
              </span>
              <span className="module-card__count">
                {doneCount}/{topics.length} CALIBRATED
              </span>
            </div>
            {topics.map((t) => {
              const complete = completedSet.has(lessonKey(t));
              return (
                <Link className="topic-row" to={lessonPath(t)} key={t.slug}>
                  <StatusDot complete={complete} />
                  <span className="topic-row__chapter">CH{t.chapter}</span>
                  <span className="topic-row__title">{t.title}</span>
                </Link>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
