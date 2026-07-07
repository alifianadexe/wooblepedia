import { useEffect, useMemo, useRef, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { usePrefersReducedMotion } from "../../lib/storage";
import {
  attentionOutput,
  attentionScores,
  attentionWeights,
  dotProduct,
  mulberry32,
  relu,
  sampleFromDistribution,
  sinusoidalPE,
  softmax,
} from "../../lib/math";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "introduction")!;

const STAGES = [
  "RAW TEXT",
  "TOKENIZER",
  "EMBEDDING",
  "+POSITION",
  "ATTENTION",
  "MLP",
  "LM HEAD",
  "SOFTMAX → SAMPLE",
] as const;

const TOY_VOCAB = ["the", "cat", "sat", "on", "mat", "dog", "ran", "fast"];

// A fixed 4-d embedding "table" -- a real row-lookup, exactly like a DB table keyed by token.
const EMBED: Record<string, number[]> = {
  the: [0.9, 0.1, 0.0, 0.2],
  cat: [0.2, 0.8, 0.1, 0.4],
  sat: [0.1, 0.3, 0.9, 0.2],
  on: [0.6, 0.2, 0.2, 0.1],
  mat: [0.3, 0.7, 0.2, 0.5],
  dog: [0.2, 0.75, 0.15, 0.45],
  ran: [0.15, 0.25, 0.85, 0.3],
  fast: [0.25, 0.2, 0.6, 0.6],
};

// A fixed toy "LM head" weight matrix mapping the 4-d hidden state to 8 vocab logits.
const LM_HEAD_W: number[][] = TOY_VOCAB.map((_, i) => [
  Math.sin(i * 1.1) * 0.6,
  Math.cos(i * 0.7) * 0.6,
  Math.sin(i * 0.4 + 1) * 0.6,
  Math.cos(i * 1.3 + 2) * 0.6,
]);

function round(v: number, dp = 2): string {
  return v.toFixed(dp);
}

export default function Introduction() {
  const reducedMotion = usePrefersReducedMotion();
  const [activeStage, setActiveStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sequence, setSequence] = useState<string[]>(["the", "cat", "sat", "on", "the"]);
  const [nonce, setNonce] = useState(0);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (playing && !reducedMotion) {
      timerRef.current = window.setInterval(() => {
        setActiveStage((s) => (s + 1) % STAGES.length);
      }, 1100);
      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
      };
    }
    return undefined;
  }, [playing, reducedMotion]);

  const pipeline = useMemo(() => {
    const embeddings = sequence.map((t) => EMBED[t] ?? EMBED.the);
    const withPos = embeddings.map((vec, pos) => vec.map((v, d) => v + sinusoidalPE(pos, d, 4) * 0.3));
    const dK = 4;
    const scores = attentionScores(withPos, withPos, dK, true);
    const weights = attentionWeights(scores);
    const attnOut = attentionOutput(weights, withPos);
    const residual1 = attnOut.map((vec, i) => vec.map((v, d) => v + withPos[i][d]));
    const mlpOut = residual1.map((vec) => vec.map((v) => relu(v * 1.6 - 0.25)));
    const residual2 = mlpOut.map((vec, i) => vec.map((v, d) => v + residual1[i][d]));
    const lastHidden = residual2[residual2.length - 1];
    const logits = LM_HEAD_W.map((row) => dotProduct(row, lastHidden));
    const probs = softmax(logits);
    return { embeddings, withPos, scores, weights, mlpOut, logits, probs };
  }, [sequence]);

  function runGenerationStep() {
    const rand = mulberry32(sequence.length * 977 + nonce * 31 + 7);
    const idx = sampleFromDistribution(pipeline.probs, rand);
    setNonce((n) => n + 1);
    setSequence((seq) => [...seq.slice(-11), TOY_VOCAB[idx]]);
    setActiveStage(0);
  }

  const maxProb = Math.max(...pipeline.probs);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Every impressive thing a large language model (LLM) does -- writing code, answering questions,
          holding a conversation -- comes from one surprisingly simple trick repeated over and over:{" "}
          <strong>guess the next piece of text, add it on, and guess again</strong>. This lesson walks
          through that whole journey, from the text you type to the word the model picks, using a tiny
          model small enough to click through step by step. Every later lesson zooms in on one of these
          steps.
        </p>
      }
      takeaways={[
        "An LLM is a next-token guesser running in a loop: text becomes tokens, tokens become lists of numbers, those numbers flow through the model, and out comes a probability for every possible next token. One gets picked, added to the text, and the loop runs again.",
        "Nobody teaches the model grammar or facts directly. It picks them up anyway, because knowing them turns out to be the only way to get really good at guessing the next token.",
        "Parameters are the model's saved, learned numbers -- fixed once training ends. Activations are the temporary numbers created while answering one prompt, then thrown away.",
        "A small model fits easily in an ordinary graphics card's memory. Training is what gets expensive first, because it needs several extra bookkeeping numbers for every single parameter.",
        "Everything later in this course -- tokenizer, embeddings, position, attention, MLP, training, alignment -- is a closer look at one of the eight steps you just clicked through.",
      ]}
      references={[
        {
          title: "Attention Is All You Need — Vaswani et al., 2017",
          meta: "arXiv:1706.03762 — the paper that introduced the transformer block this whole course is built on",
          url: "https://arxiv.org/abs/1706.03762",
        },
        {
          title: "The Illustrated Transformer — Jay Alammar",
          meta: "blog — the diagram-first walkthrough most engineers cite as where the architecture finally clicked",
          url: "https://jalammar.github.io/illustrated-transformer/",
        },
        {
          title: "Neural Networks — 3Blue1Brown",
          meta: "video series — visual intuition for gradient descent, backprop, and (in later entries) attention",
          url: "https://www.3blue1brown.com/topics/neural-networks",
        },
      ]}
    >
      <Section title="What a language model actually is">
        <p>
          Strip away the branding and an LLM is one giant math function. You give it the text so far
          (chopped into pieces called <strong>tokens</strong> -- roughly word-chunks), and it hands back a
          score for every token it knows, saying how likely each one is to come next. That's the whole
          job. There is no separate "understanding part" hiding inside. It works like your phone's
          autocomplete, just enormously bigger and better: to write a full answer, the model guesses one
          token, sticks it onto the end of the text, and asks itself the same question again -- hundreds
          of times in a row.
        </p>
        <p>
          "Autoregressive" is the formal name for that loop: the model's own past guesses become part of
          what it reads next time around. Notice what's missing -- nobody programs in words, facts, or
          grammar. During training the model only ever practices one exercise, "given everything so far,
          which token comes next?", on trillions of examples of real text. Module 2 is all about that
          training process; this lesson is about the pipeline the text flows through.
        </p>
      </Section>

      <Section title="The request lifecycle, stage by stage">
        <p>
          Click through the eight stages below. Each one is a genuinely computed step over a tiny 5-token
          sentence and a toy model that describes each token with just 4 numbers -- small enough that you
          can read every value on screen. A real production model does exactly the same steps, just with
          thousands of numbers per token and over a hundred stacked layers (you'll meet one, LLaMA 3 405B,
          in lesson 2.8).
        </p>
        <ol>
          <li><strong>Raw text</strong> — just characters, like a sentence in a text message. No tokens exist yet.</li>
          <li><strong>Tokenizer</strong> — a fixed set of rules (lesson 1.2) chops the text into tokens and gives each one an ID number, like every word in a dictionary having its own page number. Nothing here is learned.</li>
          <li><strong>Embedding</strong> — each ID number is swapped for its own long list of numbers (called a <em>vector</em>) by looking up a row in a big table (lesson 1.3). Words with similar meanings end up with similar lists.</li>
          <li><strong>+Position</strong> — the attention step coming up can't tell which token came first on its own, so each token's numbers get a "position stamp" mixed in (lesson 1.4).</li>
          <li><strong>Attention</strong> — the step where tokens look at each other and pass information around (lesson 1.5). "It" can find out that it refers to "the cat." This is the only step where tokens communicate.</li>
          <li><strong>MLP</strong> — each token, entirely on its own, gets pushed through a small number-crunching layer that reshapes its vector (lesson 1.6). No looking at neighbors here.</li>
          <li><strong>LM head</strong> — the final vector gets converted into one raw score (called a <em>logit</em>) for every possible next token.</li>
          <li><strong>Softmax → sample</strong> — the raw scores are turned into percentages that add up to 100%, and one token is drawn, like a raffle where likelier tokens hold more tickets. It's added to the text, and the whole pipeline runs again.</li>
        </ol>
      </Section>

      <Section title="Lab — the signal path">
        <p>
          Step through the pipeline yourself, or hit <strong>run generation step</strong> to run all
          eight stages on the current sentence and actually draw the next token using the real
          percentages computed below -- exactly the raffle described in step 8.
        </p>
        <div className="btn-row">
          <button type="button" className="btn" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
            {playing ? "PAUSE AUTO-STEP" : "AUTO-STEP STAGES"}
          </button>
          <button type="button" className="btn btn--primary" onClick={runGenerationStep}>
            RUN GENERATION STEP
          </button>
        </div>

        <ScopeScreen label="Eight-stage transformer signal path with an active-stage indicator">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {STAGES.map((stage, i) => (
              <button
                key={stage}
                type="button"
                className="btn"
                onClick={() => {
                  setPlaying(false);
                  setActiveStage(i);
                }}
                aria-pressed={i === activeStage}
                style={{
                  borderColor: i === activeStage ? colors.cyan : undefined,
                  color: i === activeStage ? colors.cyan : undefined,
                  fontSize: 11,
                }}
              >
                {i + 1}. {stage}
              </button>
            ))}
          </div>

          <svg
            viewBox="0 0 640 24"
            width="100%"
            height="24"
            aria-label="Animated pulse showing the active pipeline stage"
            style={{ display: "block", marginBottom: 16 }}
          >
            <line x1="10" y1="12" x2="630" y2="12" stroke={colors.border} strokeWidth={2} />
            {STAGES.map((_, i) => {
              const x = 10 + (620 / (STAGES.length - 1)) * i;
              return <circle key={i} cx={x} cy={12} r={4} fill={i <= activeStage ? colors.cyan : colors.faint} />;
            })}
            <circle cx={10 + (620 / (STAGES.length - 1)) * activeStage} cy={12} r={7} fill="none" stroke={colors.amber} strokeWidth={2} />
          </svg>

          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
            SEQUENCE: {sequence.join(" ")}
          </div>

          {activeStage === 0 && (
            <div className="mono" style={{ fontSize: 13 }}>
              "{sequence.join(" ")}" — {sequence.join(" ").length} characters, 0 tokens. Nothing has been
              parsed yet.
            </div>
          )}

          {activeStage === 1 && (
            <div className="mono" style={{ fontSize: 13 }}>
              {sequence.length} tokens: [{sequence.map((t) => `"${t}"`).join(", ")}]. A real BPE tokenizer
              would sub-split unfamiliar words; here each word is already in the toy vocabulary.
            </div>
          )}

          {activeStage === 2 && (
            <table className="data-table">
              <thead>
                <tr><th>token</th><th>embedding row (4d)</th></tr>
              </thead>
              <tbody>
                {sequence.map((t, i) => (
                  <tr key={i}><td>{t}</td><td>[{pipeline.embeddings[i].map((v) => round(v)).join(", ")}]</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {activeStage === 3 && (
            <table className="data-table">
              <thead>
                <tr><th>pos</th><th>token</th><th>embedding + PE</th></tr>
              </thead>
              <tbody>
                {sequence.map((t, i) => (
                  <tr key={i}><td>{i}</td><td>{t}</td><td>[{pipeline.withPos[i].map((v) => round(v)).join(", ")}]</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {activeStage === 4 && (
            <div>
              <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>
                Causal attention weights (row = query position, softmax already applied)
              </div>
              <svg
                viewBox={`0 0 ${sequence.length * 36} ${sequence.length * 36}`}
                width={sequence.length * 36}
                height={sequence.length * 36}
                aria-label="Causal attention weight heatmap for the current sequence"
              >
                {pipeline.weights.map((row, i) =>
                  row.map((w, j) => (
                    <rect
                      key={`${i}-${j}`}
                      x={j * 36}
                      y={i * 36}
                      width={34}
                      height={34}
                      fill={colors.amber}
                      opacity={j > i ? 0 : Math.max(w, 0.04)}
                      stroke={colors.border}
                    />
                  )),
                )}
              </svg>
            </div>
          )}

          {activeStage === 5 && (
            <table className="data-table">
              <thead>
                <tr><th>pos</th><th>token</th><th>relu(1.6·x − 0.25) per dim</th></tr>
              </thead>
              <tbody>
                {sequence.map((t, i) => (
                  <tr key={i}><td>{i}</td><td>{t}</td><td>[{pipeline.mlpOut[i].map((v) => round(v)).join(", ")}]</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {activeStage === 6 && (
            <table className="data-table">
              <thead>
                <tr><th>candidate token</th><th>logit</th></tr>
              </thead>
              <tbody>
                {TOY_VOCAB.map((v, i) => (
                  <tr key={v}><td>{v}</td><td>{round(pipeline.logits[i], 3)}</td></tr>
                ))}
              </tbody>
            </table>
          )}

          {activeStage === 7 && (
            <div>
              <svg
                viewBox="0 0 320 160"
                width="100%"
                height="160"
                aria-label="Softmax probability bar chart over the toy vocabulary for the next token"
              >
                {TOY_VOCAB.map((v, i) => {
                  const p = pipeline.probs[i];
                  const barW = (p / maxProb) * 200;
                  const y = i * 19;
                  return (
                    <g key={v}>
                      <text x={0} y={y + 13} fontSize={10} fill={colors.text} fontFamily="monospace">{v}</text>
                      <rect x={46} y={y + 2} width={Math.max(barW, 1)} height={12} fill={colors.green} />
                      <text x={46 + barW + 6} y={y + 12} fontSize={9} fill={colors.muted} fontFamily="monospace">
                        {(p * 100).toFixed(1)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              <p className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
                These are real softmax outputs over the logits from the previous stage -- press "run
                generation step" to draw a token from exactly this distribution.
              </p>
            </div>
          )}
        </ScopeScreen>
      </Section>

      <Section title="Why guessing the next token leads to apparent understanding">
        <p>
          "Guess the next token" sounds like a party trick, not a path to intelligence. The secret is
          what it takes to be <em>good</em> at it. To guess the next word of a computer program, you have
          to pick up the rules of the programming language. To guess what follows "the capital of France
          is," you have to have stored the fact that it's Paris. To guess what comes after "the lawyer
          argued," you have to keep track of who's talking in the story. Nobody ever asks the model to
          learn grammar, facts, or logic directly -- but soaking up those skills turns out to be the only
          way to get really good at the one thing it <em>is</em> asked to do, across trillions of words of
          practice text. Understanding shows up as a side effect.
        </p>
      </Section>

      <Section title="Parameters vs. activations, and your 8GB graphics card">
        <p>
          Two kinds of numbers live inside a running model, and it pays to keep them straight.{" "}
          <strong>Parameters</strong> (also called <em>weights</em>) are the model's learned numbers --
          the big lookup table, all the attention and MLP numbers -- locked in place once training ends
          and saved to disk. <strong>Activations</strong> are the temporary numbers made fresh for each
          prompt -- every in-between vector you just watched flow through the eight stages. Think of a
          cookbook versus the mess on the kitchen counter: the recipes (parameters) never change while
          you cook; the chopped onions and dirty bowls (activations) exist only for tonight's meal and
          get cleared away after.
        </p>
        <p>
          Why care? Memory. Stored compactly, each parameter takes about 2 bytes. GPT-2 small's 124
          million parameters need only about 0.23 GB -- a cheap 8 GB graphics card barely notices. But a
          7-billion-parameter model needs about 14 GB just to sit in memory, already too big for that
          card before any actual work happens. That's why lesson 1.9 and Module 3 spend so much time on
          tricks for shrinking models. Activations grow with how much text you feed in, not with model
          size -- which is why a model can load fine and still run out of memory halfway through a long
          answer.
        </p>
      </Section>

      <Section title="Where this course goes">
        <p>
          Module 1 takes apart every stage you just clicked through -- tokenizer, embeddings, position,
          attention, training -- and ends with you sizing up a real GPT-2. Module 2 covers the big,
          expensive phase where knowledge gets written into the parameters: what data to use, how much of
          it, and the engineering it takes to train at scale. Module 3 covers the short, careful phase
          that turns a raw autocomplete engine into the helpful assistant you actually chat with. The
          machine itself never changes across all of this -- only the numbers stored inside it do.
        </p>
      </Section>
    </LessonLayout>
  );
}
