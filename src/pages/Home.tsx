import { lessonsByModule, moduleTitle, type ModuleId } from "../lib/syllabus";
import { moduleAccent } from "../lib/theme";
import { lessonKey } from "../lib/lessonKey";
import { useCompletedSlugs } from "../lib/storage";
import { JourneyPath } from "../components/JourneyPath";

const MODULES: ModuleId[] = [1, 2, 3];

export function Home() {
  const completed = useCompletedSlugs();
  const completedSet = new Set(completed);

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>LLM FUNDAMENTALS — SIGNAL LAB CURRICULUM</h1>
      <p className="lesson-prose" style={{ maxWidth: "68ch", color: "var(--muted)" }}>
        Twenty-two stops across three modules, laid out as one continuous path. Every lab on this
        site computes its numbers live from the real equations underneath — follow the trail, then
        turn the dials yourself.
      </p>

      {MODULES.map((m) => {
        const topics = lessonsByModule(m);
        const doneCount = topics.filter((t) => completedSet.has(lessonKey(t))).length;
        const accent = moduleAccent[m];
        return (
          <div
            className="module-card"
            key={m}
            style={{
              borderTopColor: accent,
              borderTopWidth: 3,
              boxShadow: `var(--card-shadow), 0 0 40px -22px ${accent}`,
            }}
          >
            <div className="module-card__header">
              <span className="module-card__title" style={{ color: accent }}>
                MODULE {m} — {moduleTitle[m].toUpperCase()}
              </span>
              <span className="module-card__count">
                {doneCount}/{topics.length} CALIBRATED
              </span>
            </div>
            <div style={{ padding: "28px 16px 32px" }}>
              <JourneyPath lessons={topics} accent={accent} completedKeys={completedSet} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
