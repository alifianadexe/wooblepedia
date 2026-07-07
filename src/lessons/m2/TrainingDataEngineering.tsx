import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "training-data-engineering")!;

interface FunnelStage {
  key: string;
  label: string;
  retention: number;
  note: string;
}

const STAGES: FunnelStage[] = [
  { key: "extract", label: "TEXT EXTRACTION FROM WEB PAGES", retention: 0.35, note: "Strips out menus, ads, buttons, and page decoration, keeping just the actual writing." },
  { key: "langid", label: "LANGUAGE IDENTIFICATION", retention: 0.65, note: "Keeps only pages written in the language(s) you're training for." },
  { key: "quality", label: "QUALITY FILTERING", retention: 0.40, note: "Simple rules (too short? mostly symbols? copy-paste filler?) plus an automated quality grader." },
  { key: "exactdedup", label: "EXACT DUPLICATE REMOVAL", retention: 0.55, note: "Drops pages that are word-for-word copies of pages already kept." },
  { key: "fuzzydedup", label: "NEAR-DUPLICATE REMOVAL", retention: 0.70, note: "Catches almost-copies the exact check misses -- the same article with a different headline, for instance." },
  { key: "pii", label: "PERSONAL-INFO / TEST-LEAK SCRUB", retention: 0.92, note: "Removes personal data, plus any document that overlaps with the standard tests used to grade models." },
];

const RAW_TB = 100;

interface MixSlice {
  key: string;
  label: string;
  color: string;
  buys: string;
}

const SLICES: MixSlice[] = [
  { key: "web", label: "WEB", color: colors.cyan, buys: "breadth: general knowledge and everyday language" },
  { key: "code", label: "CODE", color: colors.amber, buys: "structured reasoning and step-by-step logic" },
  { key: "math", label: "MATH", color: colors.green, buys: "quantitative and symbolic reasoning" },
  { key: "multilingual", label: "MULTILINGUAL", color: colors.magenta, buys: "non-English competence" },
  { key: "books", label: "BOOKS", color: colors.red, buys: "long-form coherence and narrative structure" },
];

const DEFAULT_WEIGHTS: Record<string, number> = { web: 55, code: 15, math: 10, multilingual: 12, books: 8 };

export default function TrainingDataEngineering() {
  const [enabled, setEnabled] = useLabSetting<Record<string, boolean>>(
    "m2-data-stages",
    Object.fromEntries(STAGES.map((s) => [s.key, true])),
  );
  const [weights, setWeights] = useState<Record<string, number>>(DEFAULT_WEIGHTS);

  const finalTB = STAGES.reduce((tb, s) => tb * (enabled[s.key] ? s.retention : 1), RAW_TB);
  const overallPct = (finalTB / RAW_TB) * 100;

  function updateWeight(key: string, value: number) {
    setWeights((prev) => {
      const others = SLICES.map((s) => s.key).filter((k) => k !== key);
      const otherSum = others.reduce((sum, k) => sum + prev[k], 0);
      const remaining = 100 - value;
      const next: Record<string, number> = { ...prev, [key]: value };
      if (otherSum <= 0) {
        others.forEach((k) => (next[k] = remaining / others.length));
      } else {
        const scale = remaining / otherSum;
        others.forEach((k) => (next[k] = prev[k] * scale));
      }
      return next;
    });
  }

  const RADIUS = 70;
  const STROKE = 32;
  const CIRC = 2 * Math.PI * RADIUS;
  const arcs = useMemo(() => {
    let acc = 0;
    return SLICES.map((s) => {
      const frac = weights[s.key] / 100;
      const len = frac * CIRC;
      const arc = { ...s, len, offset: -acc };
      acc += len;
      return arc;
    });
  }, [weights, CIRC]);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          A model can only be as good as what it reads -- and the raw internet, scraped in bulk, is
          mostly garbage: menus and cookie banners, the same article copied across a thousand sites,
          spam. This lesson is about the cleanup funnel that turns "a copy of the crawlable web" into the
          text a model actually trains on. The filtering choices made here set the ceiling on everything
          that follows, and they matter more than almost anything else a small team can control.
        </p>
      }
      takeaways={[
        "Data cleaning is a funnel of stages -- pull the text out of web pages, keep the right languages, filter for quality, remove exact copies, remove near-copies, scrub personal info -- and each stage throws away most of what enters it.",
        "Typically only a few percent of the raw scraped internet survives all the way into training data.",
        "Removing duplicates matters twice: copies waste training budget on text the model already saw, and text repeated many times gets memorized word-for-word -- a real privacy and quality risk.",
        "One scrubbing step removes any document that overlaps with the standard tests used to grade models -- otherwise the model would effectively see the exam answers in advance, and its scores would be meaningless (lesson 2.7).",
        "Data cleaning is the biggest lever a small team has: the FineWeb project showed that a carefully built public pipeline can rival the secret datasets of far bigger labs.",
      ]}
      references={[
        {
          title: "FineWeb: decanting the web for the finest text data at scale — Penedo et al., 2024",
          meta: "HF blog + arXiv:2406.17557",
          url: "https://arxiv.org/abs/2406.17557",
        },
        {
          title: "Deduplicating Training Data Makes Language Models Better — Lee et al., 2021",
          meta: "arXiv:2107.06499 — the memorization/dedup relationship referenced above",
          url: "https://arxiv.org/abs/2107.06499",
        },
        {
          title: "Dolma: an Open Corpus of Three Trillion Tokens — Soldaini et al., 2024",
          meta: "arXiv:2402.00159 — a fully documented open pre-training corpus and pipeline",
          url: "https://arxiv.org/abs/2402.00159",
        },
      ]}
    >
      <Section title="Lab — the retention funnel">
        <p>
          Start with 100 terabytes of raw scraped web -- roughly a hundred laptop hard drives of text --
          and watch each cleaning stage shrink it. Toggle any stage off to see how much would survive
          without it. The keep-percentages are ballpark figures based on published real-world pipelines;
          the multiplication happens live as you flip the switches.
        </p>
        <ScopeScreen label="Data pipeline retention funnel starting from 100 terabytes of raw crawl, with toggleable filter stages">
          <div className="mono" style={{ fontSize: 13, marginBottom: 12 }}>
            RAW COMMON CRAWL: {RAW_TB.toFixed(0)} TB
          </div>
          {STAGES.map((s) => (
            <div key={s.key} style={{ marginBottom: 10 }}>
              <Toggle label={`${s.label} (retain ${(s.retention * 100).toFixed(0)}%)`} checked={enabled[s.key]} onChange={(v) => setEnabled({ ...enabled, [s.key]: v })} />
              <div style={{ fontSize: 11.5, color: "var(--muted)", marginLeft: 23 }}>{s.note}</div>
            </div>
          ))}
          <div className="mono" style={{ fontSize: 15, marginTop: 14, color: colors.green }}>
            FINAL: {finalTB.toFixed(2)} TB ({overallPct.toFixed(2)}% of raw crawl survives)
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Why dedup matters twice">
        <p>
          Duplicate pages cost you twice. First, directly: every repeat is training budget spent on text
          the model has already seen -- like paying a student to reread the same page. Second, more
          subtly: text the model sees many times gets memorized word-for-word, the way a song you've
          heard a hundred times gets stuck in your head. That memorization wastes capacity that could
          have held general knowledge, and it creates a real risk of the model reciting things verbatim
          later -- including any personal information those repeated pages contained. The exact-copy
          check catches identical pages; the near-copy check catches the far more common case of
          almost-identical ones -- the same news story republished on fifty sites, template pages,
          mirrored copies.
        </p>
      </Section>

      <Section title="Lab — the final training mixture">
        <p>
          Cleaned data still has to be blended: how much of the model's reading should be general web
          pages versus computer code versus math versus books? It's like planning a diet -- each
          ingredient feeds a different skill. Drag any category and the others rebalance so the total
          stays 100%. Real labs don't pick these percentages by gut feel: they train small test models on
          candidate blends and measure which blend produces the best results before committing the big
          budget.
        </p>
        <ScopeScreen label="Final training data mixture donut chart with draggable, renormalizing category weights">
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
            <svg viewBox="0 0 160 160" width={180} height={180} aria-label="Donut chart of the training data mixture by category">
              <g transform="rotate(-90 80 80)">
                {arcs.map((a) => (
                  <circle
                    key={a.key}
                    cx={80} cy={80} r={RADIUS}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={STROKE}
                    strokeDasharray={`${a.len} ${CIRC - a.len}`}
                    strokeDashoffset={a.offset}
                  />
                ))}
              </g>
            </svg>
            <div style={{ flex: "1 1 260px" }}>
              {SLICES.map((s) => (
                <div key={s.key} style={{ marginBottom: 12 }}>
                  <div className="control__label">
                    <span style={{ color: s.color }}>{s.label} — {weights[s.key].toFixed(1)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={0.5}
                    value={weights[s.key]}
                    onChange={(e) => updateWeight(s.key, Number(e.target.value))}
                    aria-label={`${s.label} mixture weight`}
                  />
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{s.buys}</div>
                </div>
              ))}
            </div>
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Data as the small team's biggest lever">
        <p>
          A small team will never out-spend a frontier lab on computing power. But it can out-think them
          on data. The FineWeb project proved the point: a carefully built, fully public cleaning
          pipeline over the raw web produced training data as good as -- or better than -- the secret
          datasets many bigger labs use. And unlike a warehouse of 16,000 GPUs, filtering rules,
          duplicate thresholds, and mixture percentages are things one careful person can experiment
          with directly.
        </p>
      </Section>
    </LessonLayout>
  );
}
