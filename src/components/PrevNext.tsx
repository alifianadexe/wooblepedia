import { Link } from "react-router-dom";
import type { LessonMeta } from "../lib/syllabus";
import { getNextLesson, getPrevLesson, lessonPath } from "../lib/syllabus";

export function PrevNext({ lesson }: { lesson: LessonMeta }) {
  const prev = getPrevLesson(lesson.module, lesson.slug);
  const next = getNextLesson(lesson.module, lesson.slug);
  return (
    <nav className="prev-next" aria-label="Lesson navigation">
      {prev ? (
        <Link className="prev-next__link" to={lessonPath(prev)}>
          <div className="prev-next__dir">&larr; PREV</div>
          <div className="prev-next__title">{prev.title}</div>
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link className="prev-next__link prev-next__link--next" to={lessonPath(next)}>
          <div className="prev-next__dir">NEXT &rarr;</div>
          <div className="prev-next__title">{next.title}</div>
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
