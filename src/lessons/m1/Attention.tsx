import { useMemo } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { attentionOutput, attentionScores, attentionWeights, matVecMul, sinusoidalPE } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "attention")!;

const TOKENS = ["the", "cat", "sat", "on", "the", "mat"];
const D = 4;

const BASE_EMBED: Record<string, number[]> = {
  the: [0.9, 0.1, 0.0, 0.2],
  cat: [0.2, 0.8, 0.1, 0.4],
  sat: [0.1, 0.3, 0.9, 0.2],
  on: [0.6, 0.2, 0.2, 0.1],
  mat: [0.3, 0.7, 0.2, 0.5],
};

const W_Q = [
  [1, 0.2, -0.3, 0.1],
  [0.1, 1, 0.2, -0.2],
  [-0.2, 0.3, 1, 0.1],
  [0.2, -0.1, 0.3, 1],
];
const W_K = [
  [1, -0.1, 0.2, 0.3],
  [0.2, 1, -0.1, 0.2],
  [0.1, 0.2, 1, -0.3],
  [-0.3, 0.1, 0.2, 1],
];
const W_V = [
  [1, 0, 0, 0],
  [0, 1, 0, 0],
  [0, 0, 1, 0],
  [0, 0, 0, 1],
];

const X = TOKENS.map((t, pos) => BASE_EMBED[t].map((v, d) => v + sinusoidalPE(pos, d, D) * 0.3));
const Q = X.map((x) => matVecMul(W_Q, x));
const K = X.map((x) => matVecMul(W_K, x));
const V = X.map((x) => matVecMul(W_V, x));

export default function Attention() {
  const [causal, setCausal] = useLabSetting("m1-attention-causal", true);
  const [queryIdx, setQueryIdx] = useLabSetting("m1-attention-query", 4);

  const rawScores = useMemo(() => attentionScores(Q, K, D, false), []);
  const maskedScores = useMemo(() => attentionScores(Q, K, D, true), []);
  const scores = causal ? maskedScores : rawScores;
  const weights = useMemo(() => attentionWeights(scores), [scores]);
  const output = useMemo(() => attentionOutput(weights, V), [weights]);

  const queryWeights = weights[queryIdx];
  const queryScores = scores[queryIdx];

  const positions = TOKENS.map((_, i) => 24 + i * 58);
  const y = 36;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Attention is the only place in the whole architecture where information moves between token
          positions -- the MLP (next lesson) never looks sideways. Structurally it's a soft hash-map lookup:
          every position issues a <strong>query</strong> ("what am I looking for"), every position advertises
          a <strong>key</strong> ("what I contain") and holds a <strong>value</strong> ("what I'll hand over
          if matched"), and instead of an exact key match you get a similarity-weighted blend of every value
          in the map.
        </p>
      }
      takeaways={[
        "q = x·Wq, k = x·Wk, v = x·Wv are three learned linear projections of the same input vector, playing three different roles.",
        "Scores s = q·k / √d are scaled by the key dimension specifically to keep dot-product variance roughly constant, preventing softmax from saturating into near-one-hot, low-gradient territory as d grows.",
        "The causal mask -- setting future scores to −∞ before softmax so their weight becomes exactly 0 -- is the single architectural difference between a GPT-style generator and a BERT-style bidirectional encoder.",
        "Because past keys and values never change once computed, inference caches them (\"KV-cache\") instead of recomputing the whole sequence at every generation step -- the memory cost of that cache gets its own calculator in lesson 2.2.",
      ]}
      references={[
        {
          title: "Attention Is All You Need — Vaswani et al., 2017",
          meta: "arXiv:1706.03762 — scaled dot-product attention, defined precisely",
          url: "https://arxiv.org/abs/1706.03762",
        },
        {
          title: "The Illustrated Transformer (attention section) — Jay Alammar",
          meta: "blog — the query/key/value diagrams most engineers learn this from first",
          url: "https://jalammar.github.io/illustrated-transformer/",
        },
        {
          title: "A Mathematical Framework for Transformer Circuits — Anthropic, 2021",
          meta: "transformer-circuits.pub — a rigorous, mechanistic account of what attention heads compute",
          url: "https://transformer-circuits.pub/2021/framework/index.html",
        },
      ]}
    >
      <Section title="The soft hash-map lookup">
        <p>
          A real hash map returns the exact value for an exact key match, or nothing. Attention softens
          both sides of that: instead of an equality test, it measures similarity between a query and every
          key via a dot product, and instead of returning one value, it returns a weighted average of every
          value, weighted by that similarity. "the cat sat" and "the dog sat" can share almost all of their
          machinery precisely because the lookup is soft -- similar keys get similar weight even when they
          aren't identical.
        </p>
      </Section>

      <Section title="Scores, scaling, and softmax">
        <p>
          For a query vector q at one position and key vectors k at every position, the raw compatibility
          score is a dot product: <code>s = q · k</code>. Dot products grow with dimensionality -- summing
          more terms, even random ones, produces larger typical magnitudes -- so scores are divided by{" "}
          <code>√d</code> (d being the key dimension) to keep their variance roughly constant regardless of
          model width. Skip that scaling and, at high dimensions, scores routinely land far enough apart
          that softmax saturates: one weight near 1, the rest near 0, and gradients through the "rest"
          vanish. The scaled scores then pass through softmax to become weights that sum to 1, and the
          output is <code>Σ weight·v</code> across all positions.
        </p>
      </Section>

      <Section title="Lab — pick a query, watch the weights">
        <p>
          Six real tokens, real 4-d query/key/value vectors derived from fixed weight matrices (
          <code>Q = X·Wq</code>, etc.), and real scaled-dot-product attention. Pick which token is doing
          the "looking," and toggle the causal mask to see GPT-style generation versus BERT-style
          bidirectional attention on the identical vectors.
        </p>
        <ScopeScreen label="Attention arc diagram from a selected query token to every key token">
          <Toggle label="CAUSAL MASK (GPT-style)" checked={causal} onChange={setCausal} />

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "12px 0" }}>
            {TOKENS.map((t, i) => (
              <button
                key={i}
                type="button"
                className="btn"
                onClick={() => setQueryIdx(i)}
                aria-pressed={queryIdx === i}
                style={{
                  borderColor: queryIdx === i ? colors.amber : undefined,
                  color: queryIdx === i ? colors.amber : undefined,
                }}
              >
                {i}:{t}
              </button>
            ))}
          </div>

          <svg viewBox="0 0 380 90" width="100%" height="110" aria-label={`Attention arcs from query token ${queryIdx} (${TOKENS[queryIdx]}) to every key token, thickness proportional to attention weight`}>
            {TOKENS.map((_, j) => {
              const masked = causal && j > queryIdx;
              const w = masked ? 0 : queryWeights[j];
              const x1 = positions[queryIdx];
              const x2 = positions[j];
              const midX = (x1 + x2) / 2;
              const ctrlY = y - 20 - Math.abs(x1 - x2) * 0.15;
              return (
                <path
                  key={j}
                  d={`M ${x1} ${y} Q ${midX} ${ctrlY} ${x2} ${y}`}
                  fill="none"
                  stroke={colors.amber}
                  strokeWidth={masked ? 0.5 : Math.max(w * 10, 0.5)}
                  opacity={masked ? 0.15 : Math.max(w, 0.08)}
                />
              );
            })}
            {TOKENS.map((t, i) => {
              const masked = causal && i > queryIdx;
              return (
                <g key={i}>
                  <circle cx={positions[i]} cy={y} r={i === queryIdx ? 7 : 5} fill={i === queryIdx ? colors.amber : masked ? colors.faint : colors.cyan} />
                  <text x={positions[i]} y={y + 22} fontSize={11} fontFamily="monospace" fill={colors.text} textAnchor="middle">{t}</text>
                </g>
              );
            })}
          </svg>

          <table className="data-table">
            <thead><tr><th>key position</th>{TOKENS.map((t, i) => <th key={i}>{i}:{t}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td>raw score</td>
                {queryScores.map((s, i) => <td key={i}>{Number.isFinite(s) ? s.toFixed(2) : "−∞"}</td>)}
              </tr>
              <tr style={{ color: colors.green }}>
                <td>softmax weight</td>
                {queryWeights.map((w, i) => <td key={i}>{w.toFixed(3)}</td>)}
              </tr>
            </tbody>
          </table>
          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            output[{queryIdx}] = Σ weight·value = [{output[queryIdx].map((v) => v.toFixed(2)).join(", ")}]
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Lab — every query at once, one batched matmul">
        <p>
          Production attention never loops over queries one at a time -- every position's query attends to
          every key simultaneously as a single matrix multiplication. This is the full 6×6 weight matrix
          for the sentence above; with the causal mask on, the upper triangle (attending to future
          positions) is exactly zero.
        </p>
        <ScopeScreen label="Full 6 by 6 attention weight matrix heatmap, upper triangle zeroed when causal mask is on">
          <svg viewBox="0 0 216 216" width={280} height={280} aria-label="6 by 6 attention weight heatmap, rows are queries, columns are keys">
            {weights.map((row, i) =>
              row.map((w, j) => (
                <g key={`${i}-${j}`}>
                  <rect x={j * 36} y={i * 36} width={34} height={34} fill={colors.amber} opacity={Math.max(w, 0.04)} stroke={colors.border} />
                  <text x={j * 36 + 17} y={i * 36 + 20} fontSize={9} fontFamily="monospace" textAnchor="middle" fill={w > 0.5 ? colors.screen : colors.text}>
                    {w.toFixed(2)}
                  </text>
                </g>
              )),
            )}
          </svg>
        </ScopeScreen>
      </Section>

      <Section title="KV-caching, previewed">
        <p>
          Once a key and value vector is computed for a position, it never changes -- <code>Wk</code> and{" "}
          <code>Wv</code> are fixed after training, and the input to that position doesn't change either.
          During generation, that means step <em>t+1</em> only needs to compute one new query, one new key,
          and one new value for the newest token; every earlier key/value pair can be read from a cache
          instead of recomputed. This is exactly why generation speed depends heavily on how much of that
          cache fits in memory -- you'll build the real calculator for it, GQA and all, in lesson 2.2.
        </p>
      </Section>
    </LessonLayout>
  );
}
