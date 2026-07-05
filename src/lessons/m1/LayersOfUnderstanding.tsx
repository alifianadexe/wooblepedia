import { useMemo } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { attentionScores, attentionWeights, matVecMul, sinusoidalPE } from "../../lib/math";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "layers-of-understanding")!;

const TOKENS = ["the", "cat", "sat", "on", "the", "mat"];
const N = TOKENS.length;
const VOCAB = ["the", "cat", "sat", "on", "mat"];
const D = 4;

const BASE_EMBED: Record<string, number[]> = {
  the: [0.9, 0.1, 0.0, 0.2],
  cat: [0.2, 0.8, 0.1, 0.4],
  sat: [0.1, 0.3, 0.9, 0.2],
  on: [0.6, 0.2, 0.2, 0.1],
  mat: [0.3, 0.7, 0.2, 0.5],
};

const W_Q = [[1, 0.2, -0.3, 0.1], [0.1, 1, 0.2, -0.2], [-0.2, 0.3, 1, 0.1], [0.2, -0.1, 0.3, 1]];
const W_K = [[1, -0.1, 0.2, 0.3], [0.2, 1, -0.1, 0.2], [0.1, 0.2, 1, -0.3], [-0.3, 0.1, 0.2, 1]];

function oneHot(index: number, length: number): number[] {
  return Array.from({ length }, (_, i) => (i === index ? 1 : 0));
}

function MiniHeatmap({ matrix, label, accent }: { matrix: number[][]; label: string; accent: string }) {
  const size = 30;
  return (
    <div style={{ flex: "1 1 160px", minWidth: 160 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <svg viewBox={`0 0 ${N * size} ${N * size}`} width="100%" height={N * size} aria-label={`${label} attention weight heatmap, ${N} by ${N}`}>
        {matrix.map((row, i) =>
          row.map((w, j) => (
            <rect key={`${i}-${j}`} x={j * size} y={i * size} width={size - 2} height={size - 2} fill={accent} opacity={Math.max(w, 0.04)} stroke={colors.border} />
          )),
        )}
      </svg>
    </div>
  );
}

export default function LayersOfUnderstanding() {
  const heads = useMemo(() => {
    const X = TOKENS.map((t, pos) => BASE_EMBED[t].map((v, d) => v + sinusoidalPE(pos, d, D) * 0.3));

    // Head A: content-based, learned-style projections (same mechanism as lesson 1.5).
    const qA = X.map((x) => matVecMul(W_Q, x));
    const kA = X.map((x) => matVecMul(W_K, x));
    const contentHead = attentionWeights(attentionScores(qA, kA, D, true));

    // Head B: previous-token head -- query for position i is built to want position i-1 exactly.
    const qB = TOKENS.map((_, i) => oneHot(Math.max(i - 1, 0), N).map((v) => v * 8));
    const kB = TOKENS.map((_, j) => oneHot(j, N));
    const prevTokenHead = attentionWeights(attentionScores(qB, kB, N, true));

    // Head C: same-token head -- query/key built from token identity, so duplicate tokens find each other.
    const tokenId = (t: string) => VOCAB.indexOf(t);
    const qC = TOKENS.map((t) => oneHot(tokenId(t), VOCAB.length).map((v) => v * 8));
    const kC = TOKENS.map((t) => oneHot(tokenId(t), VOCAB.length));
    const sameTokenHead = attentionWeights(attentionScores(qC, kC, VOCAB.length, true));

    return { contentHead, prevTokenHead, sameTokenHead };
  }, []);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          One attention operation is already useful; a transformer block runs several in parallel, each
          with its own smaller projections, and stacks dozens of blocks on top of each other. This lesson is
          about what that parallelism and that stacking buy you: different heads specializing in different
          relationships, and a residual stream that lets a 100-layer network still train.
        </p>
      }
      takeaways={[
        "Multi-head attention runs h smaller attention operations in parallel (each with its own Wq/Wk/Wv), concatenates their outputs, and mixes them with one output projection Wo -- different heads learn to track different relationships.",
        "The residual stream is a shared vector that every sublayer reads from and additively writes back into, like middleware mutating a shared request object -- it's why gradients can survive 100+ stacked layers without vanishing.",
        "Layer norm exists purely to keep the residual stream's scale stable as more and more sublayers add to it, not to add expressive capacity.",
        "Attention is the block's only cross-token communication (its network I/O); the MLP is purely per-token compute, holding roughly two-thirds of a block's parameters and behaving, per recent interpretability work, like a key-value memory.",
        "Shallow layers tend to pick up surface patterns (position, adjacent tokens, exact duplicates); deeper layers tend to combine those into more abstract, task-relevant structure.",
      ]}
      references={[
        {
          title: "A Mathematical Framework for Transformer Circuits — Anthropic, 2021",
          meta: "transformer-circuits.pub — formalizes the residual stream and per-head specialization used in this lesson",
          url: "https://transformer-circuits.pub/2021/framework/index.html",
        },
        {
          title: "Transformer Feed-Forward Layers Are Key-Value Memories — Geva et al., 2020",
          meta: "arXiv:2012.14913 — the MLP-as-memory framing referenced above",
          url: "https://arxiv.org/abs/2012.14913",
        },
        {
          title: "Softmax Linear Units — Elhage et al., 2022 (Anthropic)",
          meta: "transformer-circuits.pub — follow-up on superposition and head interpretability, optional deeper read",
          url: "https://transformer-circuits.pub/2022/solu/index.html",
        },
      ]}
    >
      <Section title="Multi-head attention: several smaller lookups, not one big one">
        <p>
          Rather than one attention operation over the full d_model width, a block splits into h heads,
          each with its own, much smaller Wq/Wk/Wv (dimension d_model/h), runs scaled dot-product attention
          independently in each, concatenates all h outputs back to d_model, and mixes them with a final
          output projection Wo. Nothing forces the heads to specialize, but empirically they do: some become
          near-purely positional, some track exact-token recurrence, some track syntactic relationships like
          subject-verb agreement. The lab below computes three genuinely different heads live, not staged
          examples.
        </p>
      </Section>

      <Section title="Lab — three heads, the same sentence, real weights">
        <p>
          "the cat sat on the mat," causally masked. Head A reuses lesson 1.5's content-based projections.
          Head B's queries are built to want exactly the previous position. Head C's queries and keys are
          built from token identity alone, so the repeated word "the" (positions 0 and 4) should light up for
          each other.
        </p>
        <ScopeScreen label="Three attention heads over the same sentence, showing different specializations">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <MiniHeatmap matrix={heads.contentHead} label="HEAD A · CONTENT" accent={colors.amber} />
            <MiniHeatmap matrix={heads.prevTokenHead} label="HEAD B · PREVIOUS-TOKEN" accent={colors.cyan} />
            <MiniHeatmap matrix={heads.sameTokenHead} label="HEAD C · SAME-TOKEN" accent={colors.magenta} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            Read row i as "when token i is the query, how much weight lands on each key column." Head B
            should show a near-diagonal band one step below the main diagonal; Head C should show token 4
            ("the") attending strongly back to token 0 ("the").
          </p>
        </ScopeScreen>
      </Section>

      <Section title="The residual stream: a middleware chain, not a pipeline">
        <p>
          Between the embedding layer and the LM head sits a single vector per position -- the residual
          stream -- that every attention and MLP sublayer reads from and writes back into additively:{" "}
          <code>stream = stream + sublayer(stream)</code>. It behaves exactly like a middleware chain
          mutating a shared request object: nothing replaces the object wholesale, each layer just adds its
          contribution. That additive structure is precisely why gradients survive 100+ stacked layers --
          the gradient of a sum passes straight through the "+" to every term, so even a very deep stack has
          an undiminished direct path from loss back to the earliest layers. Layer norm's entire job is
          keeping that stream's scale from drifting as more and more contributions pile in -- it doesn't add
          expressiveness, it keeps the numbers well-behaved.
        </p>
        <ScopeScreen label="Residual stream diagram: attention and MLP sublayers read from and add back into a shared horizontal stream">
          <svg viewBox="0 0 400 130" width="100%" height="150" aria-label="Residual stream diagram with attention and MLP sublayers tapping into a shared horizontal bus via addition junctions">
            <line x1={20} y1={20} x2={380} y2={20} stroke={colors.cyan} strokeWidth={3} className="residual-stream-line" />
            <text x={20} y={12} fontSize={10} fontFamily="monospace" fill={colors.muted}>RESIDUAL STREAM</text>

            {[
              { cx: 130, label: "ATTENTION", color: colors.amber },
              { cx: 290, label: "MLP", color: colors.magenta },
            ].map((s) => (
              <g key={s.label}>
                <line x1={s.cx} y1={20} x2={s.cx} y2={55} stroke={colors.border} strokeWidth={2} />
                <rect x={s.cx - 55} y={55} width={110} height={34} rx={6} fill={colors.panel2} stroke={s.color} />
                <text x={s.cx} y={76} fontSize={11} textAnchor="middle" fontFamily="monospace" fill={s.color}>{s.label}</text>
                <line x1={s.cx} y1={89} x2={s.cx} y2={112} stroke={colors.border} strokeWidth={2} />
                <circle cx={s.cx} cy={20} r={9} fill={colors.screen} stroke={colors.text} strokeWidth={1.5} />
                <text x={s.cx} y={24} fontSize={12} textAnchor="middle" fill={colors.text}>+</text>
              </g>
            ))}
          </svg>
        </ScopeScreen>
      </Section>

      <Section title="Attention's I/O vs. the MLP's compute">
        <p>
          It helps to map this onto a request-handling analogy directly: attention is the block's network
          I/O -- the only step where a position's representation can depend on any other position's content.
          The MLP that follows is pure per-token compute: it takes one position's vector and transforms it,
          with zero visibility into any other position. Concretely, the MLP typically expands the residual
          stream's width by 4x, applies a nonlinearity, then projects back down -- and at that ratio, it
          holds roughly two-thirds of a transformer block's total parameters (you'll verify the exact split
          with real numbers in lesson 1.9).
        </p>
        <p>
          That's not idle capacity. Geva et al. (2020) show the MLP's first matrix behaves like a bank of
          pattern-detecting keys over the residual stream, and its second matrix like a bank of memory
          values written back in when a key fires -- functionally closer to a large key-value store than to
          a generic nonlinearity. Shallow layers' detectors tend to fire on surface patterns -- the previous
          token, exact duplication, punctuation; deeper layers' detectors tend to fire on more abstract,
          composed structure, including facts and higher-level task signals. This is a tendency observed
          across many models, not a strict law any single layer must obey.
        </p>
      </Section>
    </LessonLayout>
  );
}
