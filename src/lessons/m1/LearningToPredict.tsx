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
          Everything upstream -- tokenizer, embeddings, position, attention, MLP -- produces one thing per
          position: a distribution over the next token. Training is the loop that turns "produces some
          distribution" into "produces a good one": run the forward pass, measure how wrong the
          distribution was, push weights in the direction that makes it less wrong, repeat billions of
          times.
        </p>
      }
      takeaways={[
        "Cross-entropy loss per position is -ln(p(correct token)); training minimizes the average of this across every position in every sequence.",
        "The -ln curve is brutal near p=0 and cheap near p=1: a confidently wrong prediction costs enormously more than a hedged, uncertain one.",
        "Perplexity = e^loss is the loss re-expressed as \"the model was as uncertain as choosing uniformly among this many tokens\" -- more interpretable than a raw nat value.",
        "Teacher forcing plus the causal mask let every position in a sequence be trained in parallel in one forward pass, rather than one token at a time.",
        "AdamW adapts a per-parameter step size from running estimates of the gradient's mean and variance, and decouples weight decay from that adaptive step -- it's the default optimizer for essentially all modern LLM training.",
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
          Forward pass: run the current sequence through the model, get a probability distribution over
          the vocabulary at every position. Loss: compare each position's distribution against the actual
          next token that appeared in the training text, using cross-entropy. Backward pass: compute the
          gradient of that loss with respect to every weight in the network. Optimizer step: nudge every
          weight slightly against its gradient. That four-step loop, repeated over trillions of tokens, is
          the entirety of pre-training -- Module 2 is about how to do it at scale, not what it fundamentally
          is.
        </p>
      </Section>

      <Section title="Lab — the shape of being wrong">
        <p>
          Cross-entropy for one position is <code>-ln(p)</code>, where p is the probability the model
          assigned to the token that actually came next. Drag the slider to set that probability and watch
          both numbers update live.
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
          A fixed, smooth loss surface with two shallow minima. Set a learning rate and a starting point,
          then step through gradient descent one update at a time, or run 30 updates at once. Watch what a
          learning rate that's too high actually does -- it isn't "slower convergence," it's outright
          divergence.
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

      <Section title="Teacher forcing: training every position at once">
        <p>
          Generation is sequential -- one token at a time, fed back in. Training doesn't have to be: given a
          full real sequence from the training corpus, the causal mask (lesson 1.5) already guarantees
          position i can only see positions ≤ i. That means every position's "predict the next token" loss
          can be computed in a single forward pass over the whole sequence simultaneously -- position 3 is
          trained to predict the real token 4 using only tokens 0-3, position 4 to predict token 5 using
          tokens 0-4, all at once. This is "teacher forcing": the model is always shown the real, correct
          history, never its own (possibly wrong) previous guesses, during training.
        </p>
      </Section>

      <Section title="AdamW, briefly">
        <p>
          Plain gradient descent uses one global learning rate for every parameter. AdamW keeps a running
          estimate of each parameter's gradient mean and variance and uses them to give every parameter its
          own effective step size -- parameters with small, consistent gradients get bigger relative steps;
          parameters with noisy or huge gradients get damped ones. The "W" is decoupled weight decay: rather
          than folding L2 regularization into the gradient itself (where Adam's adaptive scaling distorts
          it), AdamW applies weight decay directly to the weights each step, independent of the adaptive
          part. This combination is the default optimizer for nearly every LLM trained today.
        </p>
      </Section>
    </LessonLayout>
  );
}
