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
          Every capability you will hear attributed to an LLM -- writing code, answering questions,
          holding a conversation -- comes out of one relentlessly simple mechanism repeated billions of
          times: <strong>predict the next token, append it, repeat</strong>. This lesson builds the whole
          request lifecycle end to end, at a toy scale you can click through, so that every later lesson
          has a skeleton to hang onto.
        </p>
      }
      takeaways={[
        "An LLM is an autoregressive next-token predictor: text → tokens → vectors → transformer blocks → logits → sampled token → loop.",
        "Apparent \"understanding\" is a side effect of an objective that is brutally simple to state and astronomically rich to optimize at scale.",
        "Parameters are the fixed, learned weights (the compiled binary); activations are the transient per-request numbers a forward pass produces (the request's stack + heap).",
        "Your 8GB card comfortably holds small models at inference; it is the training-time memory (gradients + optimizer state) that gets expensive first.",
        "Everything downstream in this course -- tokenizer, embeddings, position, attention, MLP, training, alignment -- is a deeper look at one stage of the pipeline you just clicked through.",
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
          Strip away the branding and an LLM is a function: it takes a sequence of tokens and returns a
          probability distribution over "what comes next." That's it. There is no separate
          "understanding module" sitting beside it. If you've built a backend service, think of it as a
          single, very large, purely functional endpoint: <code>POST /next-token</code> with the sequence
          so far as the body, and a probability vector over the vocabulary as the response. Generation is
          just calling that endpoint in a loop, feeding each response back in as part of the next request.
        </p>
        <p>
          "Autoregressive" is the formal name for that loop: the model's own past outputs become part of
          its future inputs. Nothing about the architecture knows about words, facts, or grammar directly
          -- it only ever sees the training signal "given everything so far, what token is next," applied to
          trillions of examples of real text. Module 2 is entirely about that training process; this lesson
          is about the shape of the pipeline that gets trained.
        </p>
      </Section>

      <Section title="The request lifecycle, stage by stage">
        <p>
          Click through the eight stages below. Each one is a real, computed step over a small 5-token
          sentence and a toy 4-dimensional model -- small enough to read every number, structurally
          identical to what happens inside a production model with a 12,288-dimensional hidden state and
          126 layers (that's LLaMA 3 405B, which you'll meet properly in lesson 2.8).
        </p>
        <ol>
          <li><strong>Raw text</strong> — a string, nothing more. No tokens exist yet.</li>
          <li><strong>Tokenizer</strong> — a fixed, deterministic serializer (lesson 1.2) turning text into a sequence of integer ids from a static vocabulary. Zero learned weights live here.</li>
          <li><strong>Embedding</strong> — each token id becomes a row lookup into a learned matrix (lesson 1.3) -- structurally a <code>SELECT vector FROM embeddings WHERE id = ?</code>.</li>
          <li><strong>+Position</strong> — because attention alone can't tell order, a position-dependent signal is added to each vector (lesson 1.4) -- think of it as stamping each row with a <code>created_at</code>.</li>
          <li><strong>Attention</strong> — every position issues a query and reads from every earlier position's key/value pair, like a soft hash-map lookup (lesson 1.5). This is the block's network I/O: the only place information moves between tokens.</li>
          <li><strong>MLP</strong> — each position, independently, runs its vector through a small nonlinear transform (lesson 1.6) -- the block's per-request compute, with no cross-token communication at all.</li>
          <li><strong>LM head</strong> — the final hidden vector is projected back onto the vocabulary, producing one raw score (logit) per possible next token.</li>
          <li><strong>Softmax → sample</strong> — logits become probabilities, and a token is drawn from that distribution. It gets appended to the sequence, and the whole pipeline runs again.</li>
        </ol>
      </Section>

      <Section title="Lab — the signal path">
        <p>
          Step through the pipeline yourself, or hit <strong>run generation step</strong> to execute all
          eight stages on the current sequence and sample a real next token from the resulting
          distribution using the actual softmax probabilities below.
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

      <Section title="Why next-token prediction yields apparent understanding">
        <p>
          "Predict the next token" sounds like a party trick, not a path to competence. The trick is
          scale: to predict the next token in an arbitrary paragraph of code, you have to implicitly model
          syntax; to predict the next token after "the capital of France is," you have to have encoded a
          fact; to predict what comes after "the plaintiff argued," you have to track who is speaking. The
          objective is a single, cheap-to-compute number (cross-entropy loss, covered in lesson 1.7), but
          minimizing it over enough text forces the model to build internal machinery for grammar,
          reasoning chains, and world facts as a side effect -- not because anyone asked for those
          capabilities directly, but because they are the cheapest way to get good at the one thing it was
          actually asked to do.
        </p>
      </Section>

      <Section title="Parameters vs. activations, and your 8GB card">
        <p>
          Two numbers get conflated constantly and shouldn't be: <strong>parameters</strong> are the
          learned weights -- the embedding matrix, every attention and MLP weight, fixed after training,
          serialized to disk. <strong>Activations</strong> are the transient numbers a single forward pass
          produces -- every intermediate vector you just watched flow through the eight stages above. Loosely:
          parameters are your compiled binary; activations are one request's stack and heap.
        </p>
        <p>
          On your 8GB card, parameters at fp16 cost roughly 2 bytes each -- GPT-2 small's 124M parameters
          are about 0.23GB, trivial. A 7B model is about 14GB at fp16, already over budget for inference
          alone before a single activation is computed; that's exactly why lesson 1.9 and Module 3 spend so
          much time on quantization and LoRA. Activations scale with sequence length and batch size, not
          just parameter count, which is why "it loaded fine but ran out of memory mid-generation" is a
          real failure mode you'll learn to predict rather than debug blind.
        </p>
      </Section>

      <Section title="Where this course goes">
        <p>
          Module 1 dissects every stage you just clicked through -- tokenizer, embeddings, position,
          attention, the residual stream, training, and a capstone where you size and reason about a real
          GPT-2. Module 2 is the expensive phase that writes knowledge into the weights: scaling laws,
          data engineering, and the systems work of training at scale. Module 3 is the small, surgical
          phase that turns a raw completion engine into the assistant you actually talk to. Same
          architecture throughout -- everything that changes is what's written into the weights.
        </p>
      </Section>
    </LessonLayout>
  );
}
