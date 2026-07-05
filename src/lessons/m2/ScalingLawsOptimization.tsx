import { useMemo } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { chinchillaAllocation, lrSchedule, perplexity } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "scaling-laws-optimization")!;

const RATIO_SAMPLES = Array.from({ length: 200 }, (_, i) => 1 + (i / 199) * 399);

export default function ScalingLawsOptimization() {
  const [logC, setLogC] = useLabSetting("m2-scaling-logc", 24);
  const [ratio, setRatio] = useLabSetting("m2-scaling-ratio", 20);

  const [warmup, setWarmup] = useLabSetting("m2-lr-warmup", 500);
  const [maxLR, setMaxLR] = useLabSetting("m2-lr-maxlr", 0.0006);
  const [totalSteps, setTotalSteps] = useLabSetting("m2-lr-total", 20000);

  const C = 10 ** logC;
  const allocation = chinchillaAllocation(C, ratio);
  const ppl = perplexity(allocation.loss);

  const curve = useMemo(
    () => RATIO_SAMPLES.map((r) => ({ r, loss: chinchillaAllocation(C, r).loss })),
    [C],
  );
  const optimal = useMemo(() => curve.reduce((best, cur) => (cur.loss < best.loss ? cur : best), curve[0]), [curve]);
  const maxLoss = Math.max(...curve.map((c) => c.loss));
  const minLoss = Math.min(...curve.map((c) => c.loss));

  const lrSamples = Array.from({ length: 120 }, (_, i) => Math.round((i / 119) * totalSteps));
  const lrCurve = lrSamples.map((step) => lrSchedule(step, warmup, maxLR, totalSteps));
  const maxLrVal = Math.max(...lrCurve, 1e-9);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Kaplan et al. first showed that loss falls off as a smooth power law in compute, parameters, and
          data independently. Hoffmann et al.'s Chinchilla paper corrected the practical conclusion people
          drew from that: for a fixed compute budget, most labs before 2022 were training models too large
          on too little data. Getting the allocation right is a real optimization problem, not a rule of
          thumb -- this lesson computes it directly.
        </p>
      }
      takeaways={[
        "Chinchilla's fitted loss surface is L(N,D) = 1.69 + 406.4/N^0.34 + 410.7/D^0.28 -- two power-law terms in parameters and data, plus a constant floor.",
        "The 1.69 floor is interpreted as the irreducible entropy of natural text -- loss that no amount of scale removes.",
        "Hoffmann et al.'s headline rule of thumb is roughly 20 tokens per parameter at compute-optimal allocation; the exact optimal ratio drifts slowly with compute, since the two fitted exponents (0.34 and 0.28) aren't quite equal.",
        "Many production models deliberately overtrain past that ratio: the loss-vs-ratio curve is shallow to the right, so a modest extra training-compute cost buys a permanently smaller, cheaper-to-serve model.",
        "Linear warmup into cosine decay, gradient clipping, and a ramped batch size are the standard optimization scaffolding around the loss itself -- not optional extras.",
      ]}
      references={[
        {
          title: "Scaling Laws for Neural Language Models — Kaplan et al., 2020",
          meta: "arXiv:2001.08361",
          url: "https://arxiv.org/abs/2001.08361",
        },
        {
          title: "Training Compute-Optimal Large Language Models — Hoffmann et al., 2022",
          meta: "arXiv:2203.15556 — the Chinchilla paper and its fitted loss surface",
          url: "https://arxiv.org/abs/2203.15556",
        },
        {
          title: "SGDR: Stochastic Gradient Descent with Warm Restarts — Loshchilov & Hutter, 2016",
          meta: "arXiv:1608.03983 — the cosine annealing schedule used almost universally today",
          url: "https://arxiv.org/abs/1608.03983",
        },
      ]}
    >
      <Section title="Lab — the Chinchilla allocation console">
        <p>
          Set a compute budget and a tokens-per-parameter ratio; N, D, and the predicted loss are computed
          live by <code>chinchillaAllocation</code>. The curve traces predicted loss across ratios from 1 to
          400 at your chosen budget, with the numerically-found minimum marked -- watch how it isn't always
          pinned to exactly 20, since the formula's two exponents differ slightly.
        </p>
        <ScopeScreen label="Chinchilla compute-optimal allocation console with loss-vs-ratio curve">
          <Slider label="LOG10(COMPUTE BUDGET, FLOPS)" value={logC} min={19} max={26} step={0.1} onChange={setLogC} format={(v) => (10 ** v).toExponential(2)} />
          <Slider label="TOKENS PER PARAMETER" value={ratio} min={1} max={400} step={1} onChange={setRatio} />

          <div style={{ display: "flex", gap: 18, flexWrap: "wrap", margin: "14px 0" }}>
            <Readout label="N (PARAMS)" value={allocation.N.toExponential(2)} accent={colors.cyan} />
            <Readout label="D (TOKENS)" value={allocation.D.toExponential(2)} accent={colors.amber} />
            <Readout label="PREDICTED LOSS" value={allocation.loss.toFixed(4)} accent={colors.green} />
            <Readout label="PERPLEXITY" value={ppl.toFixed(2)} accent={colors.magenta} />
          </div>

          <svg viewBox="0 0 400 160" width="100%" height="180" aria-label="Predicted loss as a function of tokens-per-parameter ratio at the chosen compute budget, with the optimal ratio and the user's current ratio marked">
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={2}
              points={curve.map((p) => {
                const x = (p.r / 400) * 400;
                const y = 150 - ((p.loss - minLoss) / Math.max(maxLoss - minLoss, 1e-6)) * 130;
                return `${x},${y}`;
              }).join(" ")}
            />
            <circle
              cx={(optimal.r / 400) * 400}
              cy={150 - ((optimal.loss - minLoss) / Math.max(maxLoss - minLoss, 1e-6)) * 130}
              r={5}
              fill={colors.green}
            />
            <circle
              cx={(ratio / 400) * 400}
              cy={150 - ((allocation.loss - minLoss) / Math.max(maxLoss - minLoss, 1e-6)) * 130}
              r={5}
              fill={colors.amber}
              stroke={colors.text}
            />
          </svg>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            green = numerically-optimal ratio at this budget (≈{optimal.r.toFixed(0)} tokens/param) — amber = your current ratio
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Why deliberately overtrain">
        <p>
          The curve above tends to be steep to the left of the optimum (too little data for the model
          size wastes compute badly) but shallow to the right (too much data for the model size costs only
          a little extra loss). Since inference cost scales with parameters, not training tokens, a lab that
          expects to serve a model billions of times will happily pay a modest extra training-compute
          premium -- moving right along that shallow slope -- in exchange for a permanently smaller,
          cheaper-to-run model. This is precisely why LLaMA-family models are trained on ratios well above
          20 (LLaMA 3 405B, in lesson 2.8, trains on roughly 38 tokens per parameter).
        </p>
      </Section>

      <Section title="Lab — the learning-rate schedule">
        <p>
          Nearly every large training run uses linear warmup into cosine decay: the learning rate ramps up
          from zero over the warmup steps (to avoid destabilizing early, poorly-conditioned weights), then
          decays smoothly to near zero by the end of training, following{" "}
          <code>lr = max_lr · 0.5 · (1 + cos(π · progress))</code>.
        </p>
        <ScopeScreen label="Learning rate schedule plot with linear warmup and cosine decay">
          <Slider label="WARMUP STEPS" value={warmup} min={0} max={5000} step={50} onChange={setWarmup} />
          <Slider label="MAX LEARNING RATE" value={maxLR} min={0.0001} max={0.005} step={0.0001} onChange={setMaxLR} format={(v) => v.toFixed(4)} />
          <Slider label="TOTAL STEPS" value={totalSteps} min={2000} max={100000} step={1000} onChange={setTotalSteps} />
          <svg viewBox="0 0 400 140" width="100%" height="150" aria-label="Learning rate over training steps, showing linear warmup followed by cosine decay">
            <line x1={10} y1={130} x2={390} y2={130} stroke={colors.border} strokeWidth={1} />
            <polyline
              fill="none"
              stroke={colors.amber}
              strokeWidth={2}
              points={lrSamples.map((step, i) => `${10 + (step / totalSteps) * 380},${130 - (lrCurve[i] / maxLrVal) * 110}`).join(" ")}
            />
            <line
              x1={10 + (warmup / totalSteps) * 380} y1={10}
              x2={10 + (warmup / totalSteps) * 380} y2={130}
              stroke={colors.border} strokeDasharray="3 3"
            />
            <text x={10 + (warmup / totalSteps) * 380 + 4} y={20} fontSize={9} fontFamily="monospace" fill={colors.muted}>warmup ends</text>
          </svg>
        </ScopeScreen>
      </Section>

      <Section title="The rest of the optimization scaffolding">
        <p>
          Two more details matter in practice more than their simplicity suggests. <strong>Gradient
          clipping</strong> rescales the gradient if its norm exceeds a threshold (commonly 1.0), preventing
          a single bad batch from taking a destructively large step. <strong>Batch size ramp-up</strong>{" "}
          starts training with a smaller batch and grows it over the first portion of a run, which stabilizes
          the very early, most poorly-conditioned phase of optimization. And despite all of this scaffolding,
          large runs still experience <strong>loss spikes</strong> -- sudden, unexplained jumps in training
          loss -- which teams handle by rewinding to the last stable checkpoint, skipping the offending data
          batch, or lowering the learning rate and resuming. It's operational lore as much as theory, and
          you'll see it treated as exactly that in lesson 2.7.
        </p>
      </Section>
    </LessonLayout>
  );
}
