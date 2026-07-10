import { useState } from "react";
import { FONT_SCALES, readFontScale, setFontScale, stepScale } from "../lib/fontScale";
import { useUI } from "../lib/i18n";

export function FontSizeControl() {
  const ui = useUI();
  const [scale, setScale] = useState(() => readFontScale());

  function apply(next: number) {
    setScale(setFontScale(next));
  }

  const atMin = scale <= FONT_SCALES[0] + 1e-6;
  const atMax = scale >= FONT_SCALES[FONT_SCALES.length - 1] - 1e-6;

  return (
    <div className="font-size-control" role="group" aria-label={ui.fontSizeAria}>
      <button
        type="button"
        className="btn font-size-control__btn"
        onClick={() => apply(stepScale(scale, -1))}
        disabled={atMin}
        aria-label={ui.fontSmaller}
      >
        <span style={{ fontSize: 11 }}>A</span>
      </button>
      <button
        type="button"
        className="btn font-size-control__btn"
        onClick={() => apply(stepScale(scale, 1))}
        disabled={atMax}
        aria-label={ui.fontLarger}
      >
        <span style={{ fontSize: 16 }}>A</span>
      </button>
    </div>
  );
}
