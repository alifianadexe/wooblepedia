import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { bpeEncodeText, trainBPE, END_OF_WORD, type BPEMergeStep } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";

const lesson = getLessonMeta(1, "tokenization")!;

const CORPUS_WORDS = [
  ...Array(6).fill("low"),
  ...Array(2).fill("lower"),
  ...Array(2).fill("lowest"),
  ...Array(7).fill("newest"),
  ...Array(3).fill("new"),
  ...Array(3).fill("newer"),
  ...Array(4).fill("wide"),
  ...Array(3).fill("wider"),
  ...Array(3).fill("widest"),
];

const MAX_MERGES = 14;
const ALL_STEPS = trainBPE(CORPUS_WORDS, MAX_MERGES);

function buildVocab(steps: BPEMergeStep[]): string[] {
  const base = Array.from(new Set([...CORPUS_WORDS.join("").split(""), END_OF_WORD])).sort();
  const vocab = [...base];
  for (const step of steps) {
    if (!vocab.includes(step.merged)) vocab.push(step.merged);
  }
  return vocab;
}

export default function Tokenization() {
  const [numMerges, setNumMerges] = useLabSetting("m1-tokenization-merges", 0);
  const [sample, setSample] = useState("newest widening lowered");

  const activeSteps = ALL_STEPS.slice(0, numMerges);
  const vocab = useMemo(() => buildVocab(activeSteps), [numMerges]);

  const sampleTokens = useMemo(() => bpeEncodeText(sample, activeSteps), [sample, numMerges]);
  const visibleTokens = sampleTokens.filter((t) => !/^\s+$/.test(t));
  const charCount = sample.replace(/\s+/g, "").length;
  const ratio = visibleTokens.length > 0 ? (charCount / visibleTokens.length).toFixed(2) : "—";

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Before a single weight is multiplied, raw text has to become a fixed sequence of integers. That
          job belongs entirely to the tokenizer -- a deterministic <strong>serializer</strong>, structurally
          no different from a backend service turning a JSON payload into a wire format. It runs the same
          way every time, has zero learned parameters, and its output vocabulary is a static file you could
          <code>cat</code> and read.
        </p>
      }
      takeaways={[
        "Byte-pair encoding starts from raw bytes/characters and greedily merges the most frequent adjacent pair, repeated a fixed number of times.",
        "The result -- a merge-rule list plus an id map -- is a static JSON artifact with zero learned weights, sharply distinct from the embedding matrix that consumes its output.",
        "Vocabulary size trades sequence length for embedding-table size: bigger vocab means shorter sequences but a bigger vocab*d embedding matrix and LM head.",
        "Whitespace handling, digit splitting, and non-English scripts are common sources of real tokenizer bugs, not edge cases you can ignore.",
        "The tokenizer, the embedding matrix, and a vector database are three unrelated storage systems that get confused constantly -- keep them separate in your head.",
      ]}
      references={[
        {
          title: "Neural Machine Translation of Rare Words with Subword Units — Sennrich et al., 2015",
          meta: "arXiv:1508.07909 — brought byte-pair encoding from data compression into NLP",
          url: "https://arxiv.org/abs/1508.07909",
        },
        {
          title: "Language Models are Unsupervised Multitask Learners (GPT-2) — Radford et al., 2019",
          meta: "OpenAI paper — byte-level BPE vocabulary and its practical quirks",
          url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
        },
        {
          title: "Let's build the GPT Tokenizer — Andrej Karpathy",
          meta: "video + minbpe repo — builds a BPE tokenizer from scratch on camera",
          url: "https://github.com/karpathy/minbpe",
        },
      ]}
    >
      <Section title="Why not characters, or whole words?">
        <p>
          Character-level tokenization keeps the vocabulary tiny but makes every sequence enormous --
          quadratic-cost attention then pays for it later, and a model has to relearn "the" as three
          separate symbol-predictions every single time. Whole-word tokenization goes the other way: it
          keeps sequences short, but any word missing from a fixed dictionary becomes an unrecoverable
          <code>&lt;UNK&gt;</code>, and the vocabulary needed to cover a language's morphology explodes.
        </p>
        <p>
          Byte-pair encoding is the pragmatic middle: start from individual bytes (so nothing is ever truly
          unrepresentable), then let the training corpus itself decide which multi-character chunks are
          common enough to deserve their own symbol. Frequent whole words like "the" end up as a single
          token; rare or unfamiliar words fall back to smaller, still-meaningful pieces.
        </p>
      </Section>

      <Section title="The algorithm, exactly">
        <p>
          Represent every word as a sequence of characters plus an end-of-word marker. Count every adjacent
          symbol pair across the whole corpus, weighted by how often each word occurs. Merge the single
          most frequent pair everywhere it appears, and record that merge rule. Repeat for a fixed number
          of merges. That's the entire training algorithm -- no gradients, no loss function, just counting.
        </p>
        <p>
          Encoding new text applies the learned merge rules in the order they were learned: split into
          characters, then repeatedly apply whichever applicable merge has the lowest (earliest-learned)
          rank, until no more rules match. This is exactly the loop implemented in{" "}
          <code>trainBPE</code> and <code>bpeEncodeWord</code> in <code>src/lib/math.ts</code> -- nothing
          in the lab below is precomputed or faked.
        </p>
      </Section>

      <Section title="Lab — train a real tokenizer, then use it">
        <p>
          The corpus below is small on purpose (word-frequency pairs like <em>low/lower/lowest</em> and{" "}
          <em>new/newer/newest</em> are the textbook BPE example) so you can watch the merge table fill in
          one rule at a time and see exactly why each rule won.
        </p>

        <ScopeScreen label="Byte-pair encoding merge trainer">
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={numMerges >= MAX_MERGES}
              onClick={() => setNumMerges(Math.min(MAX_MERGES, numMerges + 1))}
            >
              TRAIN NEXT MERGE ({numMerges}/{MAX_MERGES})
            </button>
            <button type="button" className="btn" onClick={() => setNumMerges(0)}>
              RESET
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>rank</th><th>pair merged</th><th>result</th><th>frequency</th></tr>
            </thead>
            <tbody>
              {activeSteps.length === 0 && (
                <tr><td colSpan={4} style={{ color: "var(--muted)" }}>No merges trained yet — click "train next merge."</td></tr>
              )}
              {activeSteps.map((s) => (
                <tr key={s.rank}>
                  <td>{s.rank + 1}</td>
                  <td>"{s.pair[0]}" + "{s.pair[1]}"</td>
                  <td>"{s.merged}"</td>
                  <td>{s.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            VOCAB SIZE SO FAR: {vocab.length} symbols ({vocab.length - activeSteps.length} base + {activeSteps.length} merged)
          </div>
        </ScopeScreen>

        <p style={{ marginTop: 20 }}>
          Now type anything -- including words the tiny corpus above never saw -- and watch it get
          segmented with whatever merge rules you've trained so far.
        </p>

        <ScopeScreen label="Live byte-pair encoder for user-entered text">
          <input
            className="text-input"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder="type any text…"
            aria-label="Text to tokenize"
          />
          <div style={{ marginTop: 14 }}>
            {sampleTokens.map((t, i) =>
              /^\s+$/.test(t) ? (
                <span key={i} style={{ display: "inline-block", width: 8 }} />
              ) : (
                <span className="token-chip" key={i}>
                  {t.replace(END_OF_WORD, "")}
                  <span style={{ color: "var(--muted)" }}> #{vocab.indexOf(t)}</span>
                </span>
              ),
            )}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {charCount} characters → {visibleTokens.length} tokens (ratio {ratio} chars/token). At 0 merges
            this is character-level; watch the ratio climb as you train more merges.
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Three storage systems, never to be confused">
        <p>
          The merge rules and id map you just trained are a <strong>static JSON artifact</strong> -- no
          gradients touch it after training, and swapping it changes nothing about the model's weights. The{" "}
          <strong>embedding matrix</strong> (next lesson) is the opposite: a learned weight tensor, updated
          every training step. A <strong>vector database</strong> (used for retrieval-augmented generation,
          much later in this course) is a third, external system entirely -- it stores embeddings for
          documents, not tokens, and lives outside the model altogether. All three hold "vectors that
          represent text" in some sense, and mixing them up is a genuinely common source of confusion once
          you start building real systems.
        </p>
      </Section>

      <Section title="The vocabulary-size trade-off, and real bugs it causes">
        <p>
          A bigger vocabulary means shorter token sequences for the same text (cheaper attention, since
          cost grows with sequence length) but a larger embedding matrix and LM head, since both scale with{" "}
          <code>vocab_size × d_model</code> (you'll compute this exactly in lesson 1.9). GPT-2 shipped with
          50,257 tokens; modern multilingual models often exceed 128,000 to give non-English scripts fair
          per-token coverage -- English-centric vocabularies routinely take 3-5x more tokens to represent
          the same sentence in, say, Thai or Burmese, which quietly inflates cost and latency for those
          users. Leading or trailing whitespace, digit sequences that split inconsistently ("2024" vs.
          "202" + "4"), and case sensitivity are the everyday bugs this causes -- not hypothetical corner
          cases, but the actual reason a prompt that "obviously" should tokenize one way sometimes doesn't.
        </p>
      </Section>
    </LessonLayout>
  );
}
