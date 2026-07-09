import { useEffect, useRef, useState } from "react";
import { glossary, categoryLabel } from "../lib/glossary";
import { useLang, useUI } from "../lib/i18n";

export function GlossaryHint() {
  const [open, setOpen] = useState(false);
  const { lang } = useLang();
  const ui = useUI();
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="btn hint-btn"
        onClick={() => setOpen(true)}
        aria-label={ui.hintAria}
        aria-haspopup="dialog"
      >
        <span className="hint-btn__glyph" aria-hidden="true">?</span>
        {ui.hintButton}
      </button>

      {open && (
        <div
          className="glossary-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div
            className="glossary-modal panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="glossary-title"
          >
            <div className="glossary-modal__header">
              <div>
                <div id="glossary-title" className="glossary-modal__title mono">
                  {ui.glossaryTitle}
                </div>
                <div className="glossary-modal__intro">{ui.glossaryIntro}</div>
              </div>
              <button
                ref={closeBtnRef}
                type="button"
                className="btn glossary-modal__close"
                onClick={close}
                aria-label={ui.glossaryCloseAria}
              >
                ×
              </button>
            </div>

            <div className="glossary-modal__body">
              {glossary.map((cat) => (
                <div key={cat.key} className="glossary-category">
                  <div className="glossary-category__label mono">{categoryLabel(cat, lang)}</div>
                  <table className="glossary-table">
                    <tbody>
                      {cat.terms.map((t) => (
                        <tr key={t.term}>
                          <td className="glossary-table__term mono">{t.term}</td>
                          <td className="glossary-table__expansion">{t.expansion}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            <div className="glossary-modal__footer">
              <button type="button" className="btn btn--primary" onClick={close}>
                {ui.glossaryClose}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
