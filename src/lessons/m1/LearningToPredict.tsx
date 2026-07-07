import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { crossEntropyFromProb, lossSurface, perplexity } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "learning-to-predict")!;

const CURVE_POINTS = Array.from({ length: 60 }, (_, i) => 0.02 + (i / 59) * 0.96);

const X_DOMAIN = 9;
const Y_MIN = 3.5;
const Y_CAP = 11;
const PLOT_W = 320;
const PLOT_H = 200;

function xToScreen(x: number): number {
  return ((x + X_DOMAIN) / (2 * X_DOMAIN)) * PLOT_W;
}
function yToScreen(f: number): number {
  const clamped = Math.min(f, Y_CAP);
  return PLOT_H - 20 - ((clamped - Y_MIN) / (Y_CAP - Y_MIN)) * (PLOT_H - 40);
}

const CURVE_SAMPLES = Array.from({ length: 140 }, (_, i) => -X_DOMAIN + (i / 139) * 2 * X_DOMAIN);

export default function LearningToPredict() {
  const [pCorrect, setPCorrect] = useLabSetting("m1-ltp-pcorrect", 0.5);
  const [lr, setLr] = useLabSetting("m1-ltp-lr", 0.15);
  const [x0, setX0] = useLabSetting("m1-ltp-x0", 4);
  const [trail, setTrail] = useState<number[]>([4]);

  const loss = crossEntropyFromProb(pCorrect);
  const ppl = perplexity(loss);

  const clippedCurve = useMemo(() => {
    const pts: number[] = [];
    for (const x of trail) {
      if (Math.abs(x) > X_DOMAIN) break;
      pts.push(x);
    }
    return pts;
  }, [trail]);
  const diverged = clippedCurve.length < trail.length;
  const current = trail[trail.length - 1];

  function step() {
    const next = current - lr * (0.2 * current ** 3 - 0.8 * current + 0.1);
    setTrail((t) => [...t, next]);
  }
  function run() {
    let x = current;
    const next: number[] = [];
    for (let i = 0; i < 30; i++) {
      x = x - lr * (0.2 * x ** 3 - 0.8 * x + 0.1);
      next.push(x);
      if (!Number.isFinite(x) || Math.abs(x) > 1e8) break;
    }
    setTrail((t) => [...t, ...next]);
  }
  function reset() {
    setTrail([x0]);
  }

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Everything you've built so far -- tokenizer, embeddings, position stamps, attention, MLP --
          ends in one output: for each spot in the text, a set of percentages over "what token comes
          next." A freshly created model produces garbage percentages, because all its learned numbers
          start out random. Training is the loop that fixes that: make a guess, measure how wrong it was,
          nudge every number in the direction that would have made the guess less wrong, and repeat --
          billions of times.
        </p>
      }
      takeaways={[
        "The model's wrongness score (\"loss\") for one guess depends only on the percentage it gave to the token that actually came next -- high percentage means low loss. Training works to shrink the average loss across every guess.",
        "The scoring curve is brutally unfair on purpose: being confidently wrong costs enormously more than honestly hedging. That pressure teaches the model calibrated uncertainty.",
        "Perplexity re-expresses the loss as \"the model was as unsure as if it were picking blindly among this many equally likely tokens\" -- perplexity 20 means as lost as a 20-way coin flip.",
        "During training, the model doesn't generate one token at a time -- it grades its guess at every position of a real text simultaneously, in one pass. That trick is called teacher forcing.",
        "AdamW, the standard training algorithm, gives every individual parameter its own personalized step size instead of one global speed for all -- it's the default for essentially all modern LLM training.",
      ]}
      references={[
        {
          title: "The Spelled-out Intro to Neural Networks and Backpropagation — Andrej Karpathy",
          meta: "video (micrograd) — builds backprop and gradient descent from scratch, line by line",
          url: "https://www.youtube.com/watch?v=VMj-3S1tku0",
        },
        {
          title: "Decoupled Weight Decay Regularization — Loshchilov & Hutter, 2017",
          meta: "arXiv:1711.05101 — the AdamW paper",
          url: "https://arxiv.org/abs/1711.05101",
        },
        {
          title: "Gradient Descent, How Neural Networks Learn — 3Blue1Brown",
          meta: "video — the visual intuition this lesson's gradient-descent lab is built to make concrete",
          url: "https://www.3blue1brown.com/lessons/gradient-descent",
        },
      ]}
    >
      <Section title="The loop">
        <p>
          Training is four steps on repeat. <strong>Guess:</strong> run a real sentence from the training
          text through the model and get its percentages for the next token at every spot.{" "}
          <strong>Grade:</strong> compare each guess against the token that <em>actually</em> came next
          in the text, producing a single wrongness number called the <strong>loss</strong>.{" "}
          <strong>Diagnose:</strong> work out, for every one of the model's millions of learned numbers,
          whether raising or lowering it slightly would have made the loss smaller (this per-number
          direction is called the <strong>gradient</strong>). <strong>Nudge:</strong> move every number a
          tiny bit in its helpful direction. That's the whole thing. Repeated over trillions of tokens,
          this loop <em>is</em> pre-training -- Module 2 is about doing it at gigantic scale, not about
          anything fundamentally different.
        </p>
      </Section>

      <Section title="Lab — the shape of being wrong">
        <p>
          The official name for the wrongness score is <strong>cross-entropy</strong>, and for one guess
          it's simply <code>-ln(p)</code>: take the percentage <code>p</code> the model gave to the token
          that actually came next, and feed it through a curve that's near zero when p is high and
          skyrockets as p approaches zero. Drag the slider to set that percentage and watch both readouts
          update live.
        </p>
        <ScopeScreen label="Cross-entropy loss curve with a slider for the model's assigned probability to the correct token">
          <Slider label="p(CORRECT TOKEN)" value={pCorrect} min={0.02} max={0.98} step={0.01} onChange={setPCorrect} format={(v) => v.toFixed(2)} />
          <svg viewBox="0 0 320 160" width="100%" height="180" aria-label="Plot of negative log probability (cross-entropy) as a function of assigned probability, with the current point marked">
            <line x1={20} y1={140} x2={310} y2={140} stroke={colors.border} strokeWidth={1} />
            <line x1={20} y1={10} x2={20} y2={140} stroke={colors.border} strokeWidth={1} />
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={2}
              points={CURVE_POINTS.map((p) => {
                const x = 20 + p * 290;
                const y = 140 - Math.min(crossEntropyFromProb(p), 4) * 32;
                return `${x},${y}`;
              }).join(" ")}
            />
            <circle cx={20 + pCorrect * 290} cy={140 - Math.min(loss, 4) * 32} r={5} fill={colors.amber} />
          </svg>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
            <Readout label="CROSS-ENTROPY LOSS" value={`${loss.toFixed(3)} nats`} accent={colors.amber} />
            <Readout label="PERPLEXITY = e^loss" value={ppl.toFixed(2)} accent={colors.green} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            Perplexity {ppl.toFixed(1)} reads as "as uncertain as choosing uniformly among {ppl.toFixed(0)} equally likely tokens."
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Lab — gradient descent, for real">
        <p>
          Picture the loss as a hilly landscape where lower means better, and training as a hiker in
          thick fog who can only feel the slope underfoot and always steps downhill. The curve below is
          such a landscape, with two valleys. The <strong>learning rate</strong> is the hiker's stride
          length. Set it and a starting point, then step downhill one move at a time, or run 30 moves at
          once. Small strides creep along slowly; sensible strides settle into a valley; and try cranking
          the stride way up -- the hiker doesn't just descend slower, it overshoots the valley entirely
          and goes flying out of the landscape. That's called divergence, and it's a real failure mode.
        </p>
        <ScopeScreen label="Gradient descent lab on a fixed 1D polynomial loss surface">
          <Slider label="LEARNING RATE" value={lr} min={0.01} max={1.0} step={0.01} onChange={setLr} format={(v) => v.toFixed(2)} />
          <Slider label="START POINT (x0)" value={x0} min={-8} max={8} step={0.5} onChange={(v) => { setX0(v); setTrail([v]); }} format={(v) => v.toFixed(1)} />
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={step}>STEP</button>
            <button type="button" className="btn" onClick={run}>RUN 30 STEPS</button>
            <button type="button" className="btn" onClick={reset}>RESET</button>
          </div>

          <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} width="100%" height={PLOT_H} aria-label="Loss surface with the gradient descent trajectory plotted as connected points">
            <polyline
              fill="none"
              stroke={colors.border}
              strokeWidth={2}
              points={CURVE_SAMPLES.map((x) => `${xToScreen(x)},${yToScreen(lossSurface(x))}`).join(" ")}
            />
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={1.5}
              points={clippedCurve.map((x) => `${xToScreen(x)},${yToScreen(lossSurface(x))}`).join(" ")}
            />
            {clippedCurve.map((x, i) => (
              <circle
                key={i}
                cx={xToScreen(x)}
                cy={yToScreen(lossSurface(x))}
                r={i === clippedCurve.length - 1 ? 5 : 2.5}
                fill={i === clippedCurve.length - 1 ? colors.amber : colors.cyan}
              />
            ))}
          </svg>

          <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
            step {trail.length - 1} — x = {Number.isFinite(current) ? current.toFixed(3) : "∞"}, loss = {Number.isFinite(current) ? lossSurface(current).toFixed(3) : "∞"}
            {diverged && <span style={{ color: colors.red }}> — DIVERGED (left the plotted domain)</span>}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Teacher forcing: grading every guess at once">
        <p>
          When a model <em>generates</em> text, it must go one token at a time -- each new token gets fed
          back in before the next guess. Training has a wonderful shortcut. Given a complete real
          sentence from the training text, the no-peeking rule from lesson 1.5 already guarantees that
          each position only sees what came before it. So the model can be graded on <em>every</em>{" "}
          position of the sentence in a single pass: "after word 3, did you predict word 4?", "after word
          4, did you predict word 5?" -- all simultaneously, like grading every question on a completed
          exam at once instead of waiting for the student to answer one question before revealing the
          next. This is called <strong>teacher forcing</strong>, because at every position the model reads
          the true, correct history from the real text -- never its own possibly-wrong earlier guesses.
        </p>
      </Section>

      <Section title="AdamW, briefly">
        <p>
          The plain "hiker" above uses one stride length for every single parameter in the model. In
          practice, that's clumsy: some parameters get steady, gentle signals and could safely take
          bigger steps, while others get wild, noisy signals and need to be reined in.{" "}
          <strong>AdamW</strong>, the training algorithm nearly every modern LLM actually uses, keeps a
          short memory of how each individual parameter's signals have been behaving and gives each one
          its own personalized stride -- bigger for the steady ones, damped for the jumpy ones. The "W"
          adds one more habit: every step, all parameters get pulled a tiny bit back toward zero
          ("weight decay"), a gentle discipline that discourages any single number from growing huge and
          helps the model generalize instead of memorizing.
        </p>
      </Section>
    </LessonLayout>
  );
}
