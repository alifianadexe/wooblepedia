import { TOTAL_LESSONS } from "../lib/syllabus";
import { useCompletedSlugs } from "../lib/storage";

export function HeaderProgress() {
  const completed = useCompletedSlugs();
  const pct = Math.round((completed.length / TOTAL_LESSONS) * 100);
  return (
    <div className="site-header__progress">
      <span className="progress-bar__label">
        CALIBRATION {completed.length}/{TOTAL_LESSONS}
      </span>
      <div
        className="progress-bar"
        role="progressbar"
        aria-valuenow={completed.length}
        aria-valuemin={0}
        aria-valuemax={TOTAL_LESSONS}
        aria-label="Overall course progress"
      >
        <div className="progress-bar__fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
