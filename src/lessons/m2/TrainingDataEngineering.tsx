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
  { key: "extract", label: "TEXT EXTRACTION FROM HTML", retention: 0.35, note: "Strips markup, nav, ads, and boilerplate from raw crawl pages." },
  { key: "langid", label: "LANGUAGE IDENTIFICATION", retention: 0.65, note: "Keeps only pages classified as the target language(s)." },
  { key: "quality", label: "QUALITY FILTERING", retention: 0.40, note: "Heuristics (length, symbol ratio, boilerplate patterns) plus a trained quality classifier." },
  { key: "exactdedup", label: "EXACT DEDUPLICATION", retention: 0.55, note: "Hash-based removal of byte-identical or near-identical documents." },
  { key: "fuzzydedup", label: "FUZZY DEDUPLICATION (MinHash)", retention: 0.70, note: "Locality-sensitive hashing catches near-duplicates exact hashing misses." },
  { key: "pii", label: "PII / CONTAMINATION SCRUBBING", retention: 0.92, note: "Removes personal data and documents overlapping known evaluation sets." },
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
          A training run's ceiling is set by its data, not its architecture. Raw Common Crawl is enormous
          and mostly useless in its raw form -- boilerplate, duplicate pages, low-quality spam. Everything
          in this lesson is the funnel that turns "the entire crawlable web" into the tokens that actually
          go into training, and why the filtering decisions made along the way matter more than almost
          anything else a small team can control.
        </p>
      }
      takeaways={[
        "The data pipeline is a funnel: extraction → language ID → quality filtering → exact dedup → fuzzy dedup → PII/contamination scrubbing -- each stage discards most of what enters it.",
        "Only a small single-digit percentage of raw crawled bytes typically survives the full pipeline into training data.",
        "Deduplication matters twice over: duplicate documents waste compute re-training on the same content, and heavily repeated documents get memorized more easily, a real privacy and quality risk.",
        "Decontamination -- removing training documents that overlap benchmark test sets -- is what keeps evaluation numbers (lesson 2.7) honest.",
        "Data curation is one of the highest-leverage areas for a small team without a frontier compute budget -- FineWeb showed a well-engineered filtering pipeline on public data can rival closed, proprietary datasets.",
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
          Toggle any stage off to see how much survives without it. Retention fractions below are
          illustrative, order-of-magnitude figures grounded in published pipelines like FineWeb and Dolma --
          the multiplication itself is real and live.
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
          Duplicate documents cost you twice. First, directly: every repeated document is compute spent
          re-training on content the model has already seen, with no new signal. Second, subtly: documents
          repeated many times across a corpus get disproportionately memorized, which both wastes capacity
          that could hold more general knowledge and creates a real risk of verbatim regurgitation --
          including of any personal information those duplicated documents contain. Exact-hash dedup catches
          identical documents; fuzzy dedup (MinHash-based near-duplicate detection) catches the much more
          common case of near-identical pages -- syndicated articles, boilerplate templates, scraped mirrors.
        </p>
      </Section>

      <Section title="Lab — the final training mixture">
        <p>
          Drag any category's weight; the rest renormalize proportionally so the mixture always sums to
          100%. Real pretraining mixtures are set by ablation -- training smaller models on candidate
          mixtures and measuring downstream eval performance -- not by intuition.
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
          A small team will never out-compute a frontier lab. It can out-engineer them on data curation --
          FineWeb's release demonstrated that a carefully built, fully public filtering pipeline over Common
          Crawl produces training data competitive with, or better than, many proprietary corpora used by
          much larger labs. Filtering heuristics, dedup thresholds, and mixture weights are all things one
          engineer can iterate on directly, unlike a 16,000-GPU training cluster.
        </p>
      </Section>
    </LessonLayout>
  );
}
