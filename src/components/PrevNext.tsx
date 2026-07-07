import { Link } from "react-router-dom";
import type { LessonMeta } from "../lib/syllabus";
import { getNextLesson, getPrevLesson, lessonPath, lessonTitle } from "../lib/syllabus";
import { useLang, useUI } from "../lib/i18n";

export function PrevNext({ lesson }: { lesson: LessonMeta }) {
  const prev = getPrevLesson(lesson.module, lesson.slug);
  const next = getNextLesson(lesson.module, lesson.slug);
  const { lang } = useLang();
  const ui = useUI();
  return (
    <nav className="prev-next" aria-label={ui.lessonNavAria}>
      {prev ? (
        <Link className="prev-next__link" to={lessonPath(prev)}>
          <div className="prev-next__dir">&larr; {ui.prev}</div>
          <div className="prev-next__title">{lessonTitle(prev, lang)}</div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="prev-next__link prev-next__link--next" to={lessonPath(next)}>
          <div className="prev-next__dir">{ui.next} &rarr;</div>
          <div className="prev-next__title">{lessonTitle(next, lang)}</div>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
