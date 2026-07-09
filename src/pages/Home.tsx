import { lessonsByModule, moduleTitleFor, type ModuleId } from "../lib/syllabus";
import { moduleAccent } from "../lib/theme";
import { lessonKey } from "../lib/lessonKey";
import { useCompletedSlugs } from "../lib/storage";
import { useLang, useUI } from "../lib/i18n";
import { JourneyPath } from "../components/JourneyPath";

const MODULES: ModuleId[] = [1, 2, 3];

export function Home() {
  const completed = useCompletedSlugs();
  const completedSet = new Set(completed);
  const { lang } = useLang();
  const ui = useUI();

  return (
    <div>
      <h1 style={{ fontSize: 20 }}>{ui.homeTitle}</h1>
      <p className="lesson-prose" style={{ maxWidth: "68ch", color: "var(--muted)" }}>
        {ui.homeIntro}
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
                {ui.module} {m} — {moduleTitleFor(m, lang).toUpperCase()}
              </span>
              <span className="module-card__count">
                {doneCount}/{topics.length} {ui.calibrated}
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
