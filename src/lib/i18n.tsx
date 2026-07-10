/**
 * Two-language support: English (default) and Indonesian. The chosen language
 * persists in localStorage under "llmfund:lang" and applies site-wide via
 * context. Lesson prose switches with the <Bi> component / pick() helper;
 * shared chrome strings live in the UI dictionary below.
 */
import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

export type Lang = "en" | "id";

const STORAGE_KEY = "llmfund:lang";

function readLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === "id" ? "id" : "en";
  } catch {
    return "en";
  }
}

const LangContext = createContext<{ lang: Lang; setLang: (l: Lang) => void }>({
  lang: "en",
  setLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readLang);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // localStorage unavailable -- language just won't persist
    }
  }, []);
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
}

export function useLang(): { lang: Lang; setLang: (l: Lang) => void } {
  return useContext(LangContext);
}

/** Pick the value for the active language: pick(lang, enValue, idValue). */
export function pick<T>(lang: Lang, en: T, id: T): T {
  return lang === "id" ? id : en;
}

/** Bilingual block: renders the EN or ID node depending on the active language. */
export function Bi({ en, id }: { en: ReactNode; id: ReactNode }) {
  const { lang } = useLang();
  return <>{lang === "id" ? id : en}</>;
}

/** Shared chrome strings, keyed by language. */
export const UI = {
  en: {
    keyTakeaways: "KEY TAKEAWAYS",
    references: "REFERENCES — CHECK OFF AS YOU READ",
    markComplete: "MARK LESSON COMPLETE",
    markedComplete: "MARKED COMPLETE",
    prev: "PREV",
    next: "NEXT",
    module: "MODULE",
    calibrated: "CALIBRATED",
    calibration: "CALIBRATION",
    homeTitle: "LLM FUNDAMENTALS — SIGNAL LAB CURRICULUM",
    homeIntro:
      "Twenty-two stops across three modules, laid out as one continuous path. Every lab on this site computes its numbers live from the real equations underneath — follow the trail, then turn the dials yourself.",
    notFoundMsg: "That lesson channel doesn't exist.",
    backToDashboard: "BACK TO DASHBOARD",
    progressAria: "Overall course progress",
    lessonNavAria: "Lesson navigation",
    languageAria: "Site language",
    hintButton: "HINT",
    hintAria: "Show acronym glossary",
    glossaryTitle: "ACRONYM GLOSSARY",
    glossaryIntro: "Every short term used across the lessons, spelled out in full.",
    glossaryClose: "Close",
    glossaryCloseAria: "Close glossary",
    fontSizeAria: "Reading text size",
    fontSmaller: "Decrease text size",
    fontLarger: "Increase text size",
  },
  id: {
    keyTakeaways: "POIN-POIN KUNCI",
    references: "REFERENSI — CENTANG SETELAH DIBACA",
    markComplete: "TANDAI PELAJARAN SELESAI",
    markedComplete: "SUDAH SELESAI",
    prev: "SEBELUMNYA",
    next: "BERIKUTNYA",
    module: "MODUL",
    calibrated: "TERKALIBRASI",
    calibration: "KALIBRASI",
    homeTitle: "DASAR-DASAR LLM — KURIKULUM LAB SINYAL",
    homeIntro:
      "Dua puluh dua perhentian dalam tiga modul, ditata jadi satu jalur nyambung. Setiap lab di situs ini ngitung angkanya secara langsung dari persamaan aslinya — ikutin jalannya, terus puter sendiri kenop-kenopnya.",
    notFoundMsg: "Kanal pelajaran itu tidak ada.",
    backToDashboard: "KEMBALI KE DASBOR",
    progressAria: "Kemajuan kursus keseluruhan",
    lessonNavAria: "Navigasi pelajaran",
    languageAria: "Bahasa situs",
    hintButton: "PETUNJUK",
    hintAria: "Tampilkan daftar istilah singkatan",
    glossaryTitle: "DAFTAR ISTILAH SINGKATAN",
    glossaryIntro: "Setiap istilah singkat yang dipakai di seluruh pelajaran, dieja lengkap.",
    glossaryClose: "Tutup",
    glossaryCloseAria: "Tutup daftar istilah",
    fontSizeAria: "Ukuran teks bacaan",
    fontSmaller: "Perkecil ukuran teks",
    fontLarger: "Perbesar ukuran teks",
  },
} as const;

export function useUI() {
  const { lang } = useLang();
  return UI[lang];
}
