import type { LessonMeta } from "../lib/syllabus";
import { channelLabel, moduleTitle } from "../lib/syllabus";
import { moduleAccent } from "../lib/theme";

export function ChannelHeader({ lesson }: { lesson: LessonMeta }) {
  const accent = moduleAccent[lesson.module];
  return (
    <header className="channel-header" style={{ borderLeftColor: accent }}>
      <span
        className="status-dot status-dot--glow"
        aria-hidden="true"
        style={{ background: accent, color: accent }}
      />
      <div>
        <div className="channel-header__label">{channelLabel(lesson)}</div>
        <div className="channel-header__module">
          MODULE {lesson.module} · {moduleTitle[lesson.module].toUpperCase()}
        </div>
      </div>
    </header>
  );
}
