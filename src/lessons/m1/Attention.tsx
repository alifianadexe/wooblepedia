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
          Attention is the only place in the whole model where words get to look at each other and share
          information -- every other step processes each word alone. The way it works is like a classroom
          where everyone asks around for help at once. Each word raises a <strong>query</strong> ("here's
          what I'm looking for"), each word wears a <strong>key</strong> ("here's what I know about"), and
          each word carries a <strong>value</strong> ("here's what I'll share if you pick me"). But
          instead of picking exactly one classmate, every word takes a little from everyone -- more from
          the good matches, less from the poor ones -- and blends it all together.
        </p>
      }
      takeaways={[
        "Each word's query, key, and value are three different remixes of the same word vector, made by multiplying it against three learned grids of numbers. Same input, three different roles.",
        "A query and a key are compared by multiplying matching entries and adding them up (a \"dot product\") -- big result means good match. The result is divided by a size-correction factor (√d) so the numbers don't blow up in bigger models and turn the blend into a winner-take-all.",
        "The \"causal mask\" blocks every word from peeking at words that come after it -- essential when the whole game is predicting what comes next. This one rule is the main difference between a GPT-style text generator and models that read whole sentences at once.",
        "Once a word's key and value are computed, they never change -- so when generating text, models save them (the \"KV-cache\") instead of redoing the math for the whole text at every step. You'll compute what that cache costs in memory in lesson 2.2.",
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
      <Section title="A lookup that never says 'not found'">
        <p>
          Think of a strict library catalog: you ask for one exact title and get that book or nothing.
          Attention is the friendly librarian instead. You describe what you're after, and rather than
          demanding an exact match, she checks your description against every book's cover, then hands
          you a blend -- mostly from the best matches, a pinch from everything else. That fuzziness is a
          feature, not sloppiness: it means "the cat sat" and "the dog sat" can be handled by nearly the
          same machinery, because similar-but-not-identical things still find each other.
        </p>
      </Section>

      <Section title="Scores, scaling, and softmax">
        <p>
          How is a match actually scored? A query and a key are both just lists of numbers, so you
          multiply them entry by entry and add up the results -- an operation called a{" "}
          <strong>dot product</strong>. When two lists point in a similar direction, the sum comes out
          big; when they're unrelated, it comes out near zero. One wrinkle: the longer the lists, the
          more terms get added, so raw scores naturally balloon in bigger models. That's why every score
          is divided by <code>√d</code> (the square root of the list length) -- pure size correction.
          Skip it and one score tends to tower over the rest, the blend collapses into "listen to exactly
          one word and ignore everyone else," and the model has a much harder time learning. Finally, the
          corrected scores go through <strong>softmax</strong>, a formula that converts any set of scores
          into positive percentages summing to 100%. Those percentages are the recipe for the blend: each
          word's output is that weighted mix of everyone's values.
        </p>
      </Section>

      <Section title="Lab — pick a query, watch the weights">
        <p>
          Six real tokens, each with genuinely computed query, key, and value lists, run through the real
          attention math -- nothing staged. Click a token to make it the one doing the "looking," and
          watch the arcs: thicker means that word is contributing more to the blend. Flip the causal-mask
          toggle to see the difference between a model that must not peek ahead (how text generators
          work) and one allowed to look both directions.
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
          A real model doesn't handle one "looking" word at a time -- it computes every word's blend
          percentages simultaneously in one big batch of arithmetic. Here's the full grid for the
          sentence above: each row is one word doing the looking, each column is a word being looked at,
          and each cell shows the percentage. With the causal mask on, the upper-right half is exactly
          zero -- those cells would be words peeking at the future.
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
          Here's a money-saving observation: once a word's key and value have been computed, they never
          change -- the grids that produce them are frozen after training, and the word itself isn't
          going anywhere. So when a model is generating text one token at a time, it doesn't redo the
          math for the entire text at every step. It computes the newest token's query, key, and value,
          and simply re-reads everyone else's from a saved copy called the <strong>KV-cache</strong>.
          It's the difference between re-reading a whole book every time you add a sentence versus
          keeping your notes. The catch is that those notes take up memory -- and how much, exactly, is a
          calculation you'll do yourself in lesson 2.2.
        </p>
      </Section>
    </LessonLayout>
  );
}
