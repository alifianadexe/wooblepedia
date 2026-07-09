import { Link } from "react-router-dom";
import { HeaderProgress } from "./HeaderProgress";
import { GlossaryHint } from "./GlossaryHint";
import { FontSizeControl } from "./FontSizeControl";
import { useLang, useUI, type Lang } from "../lib/i18n";
import { colors } from "../lib/theme";

const LANGS: { value: Lang; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "id", label: "ID" },
];

export function SiteHeader() {
  const { lang, setLang } = useLang();
  const ui = useUI();
  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" to="/">
          WOOBLEPEDIA
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <FontSizeControl />
          <GlossaryHint />
          <div role="group" aria-label={ui.languageAria} style={{ display: "flex", gap: 4 }}>
            {LANGS.map((l) => (
              <button
                key={l.value}
                type="button"
                className="btn"
                onClick={() => setLang(l.value)}
                aria-pressed={lang === l.value}
                style={{
                  padding: "2px 8px",
                  fontSize: 11,
                  borderColor: lang === l.value ? colors.cyan : undefined,
                  color: lang === l.value ? colors.cyan : undefined,
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
          <HeaderProgress />
        </div>
      </div>
    </header>
  );
}
