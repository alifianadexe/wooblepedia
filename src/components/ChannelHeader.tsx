import type { LessonMeta } from "../lib/syllabus";
import { channelLabel, moduleTitleFor } from "../lib/syllabus";
import { moduleAccent } from "../lib/theme";
import { useLang, useUI } from "../lib/i18n";

export function ChannelHeader({ lesson }: { lesson: LessonMeta }) {
  const accent = moduleAccent[lesson.module];
  const { lang } = useLang();
  const ui = useUI();
  return (
    <header className="channel-header" style={{ borderLeftColor: accent }}>
      <span
        className="status-dot status-dot--glow"
        aria-hidden="true"
        style={{ background: accent, color: accent }}
      />
      <div>
        <div className="channel-header__label">{channelLabel(lesson, lang)}</div>
        <div className="channel-header__module">
          {ui.module} {lesson.module} · {moduleTitleFor(lesson.module, lang).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
