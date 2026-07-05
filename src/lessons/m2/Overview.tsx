import { useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { computeFlops } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "overview")!;

const LOG_C_MIN = 19;
const LOG_C_MAX = 26;
const AXIS_W = 600;

interface Marker {
  name: string;
  N: number;
  D: number;
}

const MARKERS: Marker[] = [
  { name: "GPT-2", N: 1.5e9, D: 1e11 },
  { name: "GPT-3", N: 175e9, D: 3e11 },
  { name: "LLaMA-3 405B", N: 405e9, D: 15.6e12 },
];

function logAxisX(c: number): number {
  const t = (Math.log10(c) - LOG_C_MIN) / (LOG_C_MAX - LOG_C_MIN);
  return Math.min(Math.max(t, 0), 1) * AXIS_W;
}

function fmtSci(v: number): string {
  return v.toExponential(2);
}

export default function Overview() {
  const [logN, setLogN] = useLabSetting("m2-overview-logN", 10.5);
  const [logD, setLogD] = useLabSetting("m2-overview-logD", 11.5);
  const [selected, setSelected] = useState<Marker | null>(null);

  const N = 10 ** logN;
  const D = 10 ** logD;
  const C = computeFlops(N, D);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Pre-training is where knowledge gets written into the weights -- and it is, by a wide margin, the
          expensive phase. Module 1 built the mechanism a single forward pass runs; Module 2 is about
          running that mechanism over trillions of tokens, at a cost measured in floating-point operations
          large enough that "engineering" rather than "mathematics" becomes the binding constraint.
        </p>
      }
      takeaways={[
        "Pre-training optimizes one objective -- next-token cross-entropy -- over enormous data; nothing about the loss function itself changed much since GPT-2.",
        "Three currencies govern a training run: compute C, parameters N, and data D, related by C ≈ 6·N·D FLOPs.",
        "A real training run's phase map is data prep → tokenize/shard → train with checkpoints → evaluate -- each phase gets its own lesson in this module.",
        "Compute budgets have grown roughly five orders of magnitude from GPT-2 to frontier 2024 models -- a difference of degree, not of the underlying mechanism.",
        "Almost everything hard in this module -- data pipelines, distributed systems, failure recovery -- is engineering, not new math.",
      ]}
      references={[
        {
          title: "Scaling Laws for Neural Language Models — Kaplan et al., 2020",
          meta: "arXiv:2001.08361 — established the compute/params/data relationship this lesson's lab uses",
          url: "https://arxiv.org/abs/2001.08361",
        },
        {
          title: "Language Models are Few-Shot Learners (GPT-3) — Brown et al., 2020",
          meta: "arXiv:2005.14165 — the 175B-parameter, ~300B-token run marked on the chart below",
          url: "https://arxiv.org/abs/2005.14165",
        },
        {
          title: "Epoch AI — Machine Learning Trends",
          meta: "epochai.org — a maintained dashboard of training compute across major models",
          url: "https://epochai.org/trends",
        },
      ]}
    >
      <Section title="Three currencies">
        <p>
          Every training run trades between three quantities. <strong>Compute</strong> (C, in FLOPs) is
          what you pay for, in GPU-hours. <strong>Parameters</strong> (N) is the size of the model you're
          training. <strong>Data</strong> (D, in tokens) is how much text you train it on. Kaplan et al.'s
          approximation ties them together: <code>C ≈ 6·N·D</code> -- each parameter, for each token,
          costs roughly 6 floating-point operations across the forward and backward pass combined. Fix any
          two and the third falls out; lesson 2.3 spends real time on how to choose N and D optimally for a
          given C.
        </p>
      </Section>

      <Section title="Lab — the three-currencies console">
        <p>
          Set N and D with the sliders (both log-scaled -- real training runs span many orders of
          magnitude) and watch compute update live via <code>computeFlops</code>. The three markers are
          real published models, placed by their actual N, D, and the resulting C.
        </p>
        <ScopeScreen label="Three currencies console: compute as a function of parameters and data, with historical model markers">
          <Slider label="LOG10(N) — PARAMETERS" value={logN} min={6} max={12.7} step={0.05} onChange={setLogN} format={(v) => (10 ** v).toExponential(2)} />
          <Slider label="LOG10(D) — TRAINING TOKENS" value={logD} min={9} max={13.5} step={0.05} onChange={setLogD} format={(v) => (10 ** v).toExponential(2)} />

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "14px 0" }}>
            <Readout label="N (PARAMS)" value={fmtSci(N)} accent={colors.cyan} />
            <Readout label="D (TOKENS)" value={fmtSci(D)} accent={colors.amber} />
            <Readout label="C = 6ND (FLOPS)" value={fmtSci(C)} accent={colors.green} />
          </div>

          <svg viewBox={`0 0 ${AXIS_W + 20} 70`} width="100%" height={80} aria-label="Log-scale compute axis showing the user's current configuration and three historical model markers">
            <line x1={10} y1={40} x2={AXIS_W + 10} y2={40} stroke={colors.border} strokeWidth={1} />
            {Array.from({ length: LOG_C_MAX - LOG_C_MIN + 1 }, (_, i) => LOG_C_MIN + i).map((exp) => (
              <g key={exp}>
                <line x1={10 + logAxisX(10 ** exp)} y1={36} x2={10 + logAxisX(10 ** exp)} y2={44} stroke={colors.border} />
                <text x={10 + logAxisX(10 ** exp)} y={58} fontSize={9} fontFamily="monospace" fill={colors.muted} textAnchor="middle">1e{exp}</text>
              </g>
            ))}
            {MARKERS.map((m) => {
              const mc = computeFlops(m.N, m.D);
              return (
                <g
                  key={m.name}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(m)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${m.name}: ${fmtSci(m.N)} parameters, ${fmtSci(m.D)} tokens`}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(m); }}
                >
                  <circle cx={10 + logAxisX(mc)} cy={40} r={6} fill={colors.magenta} />
                  <text x={10 + logAxisX(mc)} y={25} fontSize={9} fontFamily="monospace" fill={colors.text} textAnchor="middle">{m.name}</text>
                </g>
              );
            })}
            <circle cx={10 + logAxisX(C)} cy={40} r={5} fill={colors.green} stroke={colors.text} strokeWidth={1} />
          </svg>
          {selected && (
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
              {selected.name}: N = {fmtSci(selected.N)}, D = {fmtSci(selected.D)}, C = {fmtSci(computeFlops(selected.N, selected.D))} FLOPs
            </div>
          )}
        </ScopeScreen>
      </Section>

      <Section title="The phase map of a real run">
        <p>
          Concretely, a training run moves through four phases, each the subject of its own lesson here:{" "}
          <strong>data preparation</strong> (crawling, filtering, deduplicating -- lesson 2.4),{" "}
          <strong>tokenizing and sharding</strong> the cleaned corpus into fixed-size files distributed
          across a storage cluster, <strong>training</strong> itself across potentially thousands of GPUs
          with periodic checkpoints (lessons 2.2, 2.5, 2.6), and continuous <strong>evaluation</strong>{" "}
          against held-out loss and benchmark suites throughout (lesson 2.7). None of these phases is
          optional at scale -- skip data quality control and you waste the compute regardless of how
          correct your training loop is.
        </p>
      </Section>

      <Section title="Orders of magnitude, and why this is an engineering module">
        <p>
          GPT-2's training run cost on the order of 10^21 FLOPs. LLaMA 3 405B's cost on the order of 10^25.6
          -- roughly 500,000 times more compute, four years later. None of that growth came from a
          fundamentally new algorithm; the transformer block from Module 1 is essentially unchanged. What
          changed is almost entirely engineering: better data pipelines, distributed training systems that
          keep thousands of GPUs fed and synchronized, and the operational discipline to keep a run alive
          for months without losing progress to a hardware failure. That's the throughline for the rest of
          this module.
        </p>
      </Section>
    </LessonLayout>
  );
}
