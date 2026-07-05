import { useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { cosineSimilarity, dotProduct } from "../../lib/math";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "embedding-layer")!;

interface WordPoint {
  word: string;
  id: number;
  x: number;
  y: number;
  cluster: string;
}

const WORDS: WordPoint[] = [
  { word: "cat", id: 0, x: -6, y: 5, cluster: "animal" },
  { word: "dog", id: 1, x: -5, y: 6.5, cluster: "animal" },
  { word: "bird", id: 2, x: -7, y: 6, cluster: "animal" },
  { word: "fish", id: 3, x: -6.5, y: 3.5, cluster: "animal" },
  { word: "run", id: 4, x: 5, y: 6, cluster: "verb" },
  { word: "jump", id: 5, x: 6.5, y: 5, cluster: "verb" },
  { word: "swim", id: 6, x: 4, y: 4.5, cluster: "verb" },
  { word: "fly", id: 7, x: 5.5, y: 3.5, cluster: "verb" },
  { word: "the", id: 8, x: 0.6, y: 0.3, cluster: "determiner" },
  { word: "a", id: 9, x: 0.3, y: -0.3, cluster: "determiner" },
  { word: "an", id: 10, x: 0.5, y: 0.1, cluster: "determiner" },
  { word: "this", id: 11, x: -0.3, y: 0.5, cluster: "determiner" },
  { word: "king", id: 12, x: -5, y: -4, cluster: "royalty" },
  { word: "queen", id: 13, x: -4, y: -5.5, cluster: "royalty" },
  { word: "man", id: 14, x: -6.5, y: -5, cluster: "royalty" },
  { word: "woman", id: 15, x: -5, y: -6.5, cluster: "royalty" },
];

const CLUSTER_COLOR: Record<string, string> = {
  animal: colors.cyan,
  verb: colors.amber,
  determiner: colors.muted,
  royalty: colors.magenta,
};

const SCALE = 15;
const CENTER = 150;
function toScreen(x: number, y: number): [number, number] {
  return [CENTER + x * SCALE, CENTER - y * SCALE];
}

export default function EmbeddingLayer() {
  const [selected, setSelected] = useState<number[]>([0, 12]);
  const [lookupId, setLookupId] = useState<number>(0);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  }

  const wordA = WORDS.find((w) => w.id === selected[0]);
  const wordB = WORDS.find((w) => w.id === selected[1]);
  const cos = wordA && wordB ? cosineSimilarity([wordA.x, wordA.y], [wordB.x, wordB.y]) : null;
  const dot = wordA && wordB ? dotProduct([wordA.x, wordA.y], [wordB.x, wordB.y]) : null;

  const lookupWord = WORDS.find((w) => w.id === lookupId)!;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          The tokenizer's output is just an integer -- an id with no meaning of its own. The embedding
          layer is where meaning enters the system: a single learned weight matrix, shape{" "}
          <code>vocab_size × d_model</code>, where row <em>i</em> is the coordinate of token <em>i</em> in
          a high-dimensional "meaning space." Looking up a token is nothing more exotic than{" "}
          <code>SELECT vector FROM embeddings WHERE id = ?</code>.
        </p>
      }
      takeaways={[
        "The embedding matrix is learned weights (vocab_size × d_model), updated by gradient descent -- unlike the tokenizer's static merge rules.",
        "A token's embedding is a coordinate in meaning-space; semantic closeness is measured by cosine similarity (the angle between vectors), not raw distance.",
        "Tokenizer vocabulary (static JSON), embedding matrix (learned weights), and vector databases (external, for RAG) are three separate storage systems -- don't conflate them.",
        "Many models tie the input embedding matrix and the output LM-head projection to the same weights, roughly halving that parameter cost -- previewed here, used for real in lesson 1.9's accounting.",
      ]}
      references={[
        {
          title: "Distributed Representations of Words and Phrases and their Compositionality — Mikolov et al., 2013",
          meta: "arXiv:1301.3781 — the word2vec paper that popularized learned dense word vectors",
          url: "https://arxiv.org/abs/1301.3781",
        },
        {
          title: "The Illustrated Word2vec — Jay Alammar",
          meta: "blog — intuitive walkthrough of embeddings and analogical structure",
          url: "https://jalammar.github.io/illustrated-word2vec/",
        },
        {
          title: "Using the Output Embedding to Improve Language Models — Press & Wolf, 2016",
          meta: "arXiv:1608.05859 — the weight-tying result referenced above",
          url: "https://arxiv.org/abs/1608.05859",
        },
      ]}
    >
      <Section title="A row fetch, not a computation">
        <p>
          Everything downstream of this layer -- attention, the MLP, the residual stream -- operates on
          vectors, not integers. The embedding layer's entire job is the conversion: given a token id, fetch
          row <em>id</em> from a matrix. There is no arithmetic here at inference time, just indexing. What
          makes the vectors meaningful is what happened during training: gradient descent nudged each row
          so that tokens used in similar contexts end up with similar vectors, in exactly the same sense
          that a well-designed schema puts related records near each other in an index.
        </p>
      </Section>

      <Section title="Meaning space, measured with cosine similarity">
        <p>
          Pick any two words below (a hand-placed 2-D toy embedding space, small enough to see directly --
          real models use 768 to 16,384 dimensions). The arrows are the actual vectors; the numbers beneath
          are computed live by <code>cosineSimilarity</code> and <code>dotProduct</code> from{" "}
          <code>src/lib/math.ts</code>. Cosine similarity cares about direction, not magnitude -- it's why
          two rare, low-magnitude function words can still point the same way.
        </p>
        <ScopeScreen label="2D toy embedding space with clickable words and live cosine similarity">
          <svg viewBox="0 0 300 300" width="100%" height="320" aria-label="Scatter plot of toy word embeddings in 2D meaning space">
            <line x1={0} y1={CENTER} x2={300} y2={CENTER} stroke={colors.border} strokeWidth={1} />
            <line x1={CENTER} y1={0} x2={CENTER} y2={300} stroke={colors.border} strokeWidth={1} />

            {wordA && (
              <line
                x1={CENTER} y1={CENTER}
                x2={toScreen(wordA.x, wordA.y)[0]} y2={toScreen(wordA.x, wordA.y)[1]}
                stroke={colors.amber} strokeWidth={2} markerEnd="url(#arrowA)"
              />
            )}
            {wordB && (
              <line
                x1={CENTER} y1={CENTER}
                x2={toScreen(wordB.x, wordB.y)[0]} y2={toScreen(wordB.x, wordB.y)[1]}
                stroke={colors.cyan} strokeWidth={2} markerEnd="url(#arrowB)"
              />
            )}
            <defs>
              <marker id="arrowA" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="3" fill={colors.amber} />
              </marker>
              <marker id="arrowB" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="3" fill={colors.cyan} />
              </marker>
            </defs>

            {WORDS.map((w) => {
              const [sx, sy] = toScreen(w.x, w.y);
              const isSelected = selected.includes(w.id);
              return (
                <g
                  key={w.id}
                  onClick={() => toggleSelect(w.id)}
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select word ${w.word}`}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSelect(w.id); }}
                >
                  <circle cx={sx} cy={sy} r={isSelected ? 6 : 4} fill={CLUSTER_COLOR[w.cluster]} stroke={isSelected ? colors.text : "none"} strokeWidth={1.5} />
                  <text x={sx + 8} y={sy + 4} fontSize={11} fontFamily="monospace" fill={colors.text}>{w.word}</text>
                </g>
              );
            })}
          </svg>

          <div className="mono" style={{ fontSize: 13, marginTop: 8 }}>
            <span style={{ color: colors.amber }}>{wordA?.word ?? "—"}</span> = [{wordA?.x}, {wordA?.y}] &nbsp;·&nbsp;
            <span style={{ color: colors.cyan }}>{wordB?.word ?? "—"}</span> = [{wordB?.x}, {wordB?.y}]
          </div>
          <div className="mono" style={{ fontSize: 14, marginTop: 6 }}>
            dot product = {dot?.toFixed(3) ?? "—"} &nbsp;|&nbsp; cosine similarity ={" "}
            <strong style={{ color: colors.green }}>{cos?.toFixed(3) ?? "—"}</strong>
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            Try cat vs. dog (same cluster, high similarity), cat vs. run (unrelated, near zero), or king vs.
            queen (royalty cluster, high similarity despite king/queen being far from the animal cluster).
          </p>
        </ScopeScreen>
      </Section>

      <Section title="The lookup, made literal">
        <p>
          Click a row below. This is the entire forward-pass cost of the embedding layer: an index into a
          matrix, and a vector comes out.
        </p>
        <ScopeScreen label="Embedding matrix row lookup by token id">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {WORDS.map((w) => (
              <button
                key={w.id}
                type="button"
                className="btn"
                onClick={() => setLookupId(w.id)}
                aria-pressed={lookupId === w.id}
                style={{
                  borderColor: lookupId === w.id ? colors.cyan : undefined,
                  color: lookupId === w.id ? colors.cyan : undefined,
                }}
              >
                #{w.id} {w.word}
              </button>
            ))}
          </div>
          <table className="data-table">
            <thead><tr><th>id</th><th>token</th><th>dim0</th><th>dim1</th></tr></thead>
            <tbody>
              {WORDS.map((w) => (
                <tr key={w.id} style={{ background: w.id === lookupId ? "var(--panel-2)" : undefined }}>
                  <td>{w.id}</td><td>{w.word}</td><td>{w.x}</td><td>{w.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mono" style={{ fontSize: 13, marginTop: 10, color: colors.green }}>
            row fetched: embeddings[{lookupId}] = [{lookupWord.x}, {lookupWord.y}]
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Three storage systems, restated">
        <p>
          This lesson's matrix, the tokenizer's merge rules from lesson 1.2, and a vector database are easy
          to blur together because all three "hold vectors related to text." They don't overlap in
          practice: the tokenizer vocabulary is a static file with zero learned weights; the embedding
          matrix here is trained weights, updated every step; a vector database is an external index of
          embeddings computed by some model, used for retrieval (covered later in this course), and is not
          part of the model's weights at all. Confusing "the embedding matrix" with "a vector database" is
          one of the most common category errors newcomers to this field make -- they are solving
          completely different problems.
        </p>
      </Section>

      <Section title="Weight tying, previewed">
        <p>
          The LM head at the end of the model (the layer that turns a final hidden vector back into logits
          over the vocabulary) has the exact same shape as this embedding matrix, transposed. Many
          architectures, including GPT-2, simply reuse the same weight tensor for both -- "weight tying" --
          rather than learning two separate vocab-sized matrices. It's a meaningful parameter savings at
          GPT-2 scale and a detail you'll use directly when you total up a real parameter budget in lesson
          1.9.
        </p>
      </Section>
    </LessonLayout>
  );
}
