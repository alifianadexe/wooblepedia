import type { ReactNode } from "react";
import { ChannelHeader } from "./ChannelHeader";
import { TakeawaysBox } from "./TakeawaysBox";
import { RefChecklist, type ReferenceItem } from "./RefChecklist";
import { PrevNext } from "./PrevNext";
import { StatusDot } from "./StatusDot";
import { useCompletion } from "../lib/storage";
import { lessonKey } from "../lib/lessonKey";
import type { LessonMeta } from "../lib/syllabus";

export function LessonLayout({
  lesson,
  intro,
  takeaways,
  references,
  children,
}: {
  lesson: LessonMeta;
  intro: ReactNode;
  takeaways: string[];
  references: ReferenceItem[];
  children: ReactNode;
}) {
  const key = lessonKey(lesson);
  const [complete, setComplete] = useCompletion(key);

  return (
    <article>
      <ChannelHeader lesson={lesson} />
      <div className="lesson-intro lesson-prose">{intro}</div>
      {children}
      <TakeawaysBox items={takeaways} />
      <RefChecklist lessonKey={key} items={references} />
      <div className="lesson-footer">
        <button
          type="button"
          className={`mark-complete-btn ${complete ? "mark-complete-btn--done" : ""}`}
          onClick={() => setComplete(!complete)}
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <StatusDot complete={complete} />
          {complete ? "MARKED COMPLETE" : "MARK LESSON COMPLETE"}
        </button>
      </div>
      <PrevNext lesson={lesson} />
    </article>
  );
}
