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
          A model can only do math on numbers, so before anything else happens, your text has to become a
          list of numbers. That's the tokenizer's whole job: chop text into pieces (<strong>tokens</strong>)
          and replace each piece with its ID number, the same way every time -- like an old telegraph
          codebook where every common word or word-chunk has its own code. Nothing about it is learned or
          smart: its entire "vocabulary" is a plain list you could open and read in a text editor.
        </p>
      }
      takeaways={[
        "Byte-pair encoding (BPE) starts from single characters and repeatedly glues together whichever pair of neighbors shows up most often in the training text -- that's the entire training algorithm, just counting.",
        "What it produces is a plain list of glue rules plus an ID number for each piece. No learning, no weights -- completely different from the embedding table (next lesson), which is learned.",
        "Vocabulary size is a trade-off: more tokens in the codebook means any sentence splits into fewer pieces, but the model's lookup tables have to grow to hold a row for every token.",
        "Spaces, numbers that split inconsistently (\"2024\" vs. \"202\"+\"4\"), and non-English languages are where real tokenizer surprises happen -- not rare corner cases.",
        "The tokenizer's codebook, the embedding table, and a vector database are three totally different things that people mix up constantly -- keep them separate in your head.",
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
          You could split text one letter at a time. The list of symbols stays tiny, but every sentence
          becomes enormously long, and long sequences make everything downstream slower and more
          expensive -- plus the model has to re-figure-out that "t", "h", "e" spells a common word every
          single time. Or you could go the other way and make every whole word its own token. Now
          sentences are short, but any word not in the dictionary -- a new slang term, a typo, a name --
          simply can't be represented at all, and covering every possible word form ("run", "runs",
          "running", "runner"...) makes the dictionary explode.
        </p>
        <p>
          Byte-pair encoding is the practical middle ground: start from single characters (so <em>nothing</em>{" "}
          is ever impossible to write down), then let the training text itself vote on which letter-chunks
          appear often enough to earn their own token. Common words like "the" end up as a single token;
          rare or made-up words just fall back to smaller pieces, like "wooble" becoming "woo" + "ble".
        </p>
      </Section>

      <Section title="The algorithm, exactly">
        <p>
          Here's how a BPE tokenizer gets built. Write every word in the training text as a string of
          single characters. Then look across all the words and count every pair of neighbors: how many
          times does "l" sit next to "o"? How about "e" next to "s"? Take the single most common pair,
          glue it together into one new symbol everywhere it appears, and write that glue rule down.
          Repeat, over and over, for however many rules you want. That's the whole thing -- no
          intelligence, no learning in the neural-network sense, just counting and gluing.
        </p>
        <p>
          To tokenize <em>new</em> text later, you replay those glue rules in the order they were written
          down: split into single characters, then keep applying whichever rule was learned earliest,
          until no rules fit anymore. The lab below runs exactly this algorithm live in your browser --
          nothing is pre-baked or faked.
        </p>
      </Section>

      <Section title="Lab — train a real tokenizer, then use it">
        <p>
          The practice text below is tiny on purpose -- just word families like{" "}
          <em>low/lower/lowest</em> and <em>new/newer/newest</em> (the classic textbook example). Click
          "train next merge" and watch the rules appear one at a time; the frequency column shows you
          exactly why each pair won its round.
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
          Now type anything -- including words the tiny training text above never saw -- and watch it get
          chopped up using whatever glue rules you've trained so far.
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
          The glue rules and ID numbers you just trained are a <strong>fixed file</strong> -- a codebook
          that never changes once written, no matter how much the model trains afterward. The{" "}
          <strong>embedding table</strong> (next lesson) is the opposite: a huge grid of learned numbers
          that training adjusts constantly. And a <strong>vector database</strong> (a tool you'll meet
          much later, used to help models look things up) is a third, completely separate thing that
          lives outside the model entirely. All three "store something about text," which is exactly why
          people mix them up all the time. Keeping them straight now will save you real confusion later.
        </p>
      </Section>

      <Section title="The vocabulary-size trade-off, and real bugs it causes">
        <p>
          A bigger codebook means any sentence splits into fewer, chunkier tokens -- which makes the model
          faster and cheaper to run, since cost grows with the number of tokens. But every token in the
          codebook needs its own row in the model's lookup tables, so those tables get bigger (you'll
          compute exactly how much in lesson 1.9). GPT-2 shipped with about 50,000 tokens; modern
          multilingual models often use over 128,000 so that languages like Thai or Burmese get fair
          treatment -- with an English-centric codebook, the same sentence in those languages can take 3-5
          times as many tokens, which quietly makes the model slower and more expensive for those users.
          And the everyday weirdness this causes is real: a space before a word can change its tokens
          entirely, "2024" might split as "202" + "4", and "Hello" vs. "hello" are different tokens. When
          a model behaves oddly about spelling or numbers, the tokenizer is often the reason.
        </p>
      </Section>
    </LessonLayout>
  );
}
