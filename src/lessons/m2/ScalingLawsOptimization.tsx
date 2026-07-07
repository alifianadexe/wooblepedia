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
          Suppose you have a fixed budget for training. Should you build a bigger model and show it less
          text, or a smaller model and show it more? Remarkably, this question has a mathematical answer.
          Researchers discovered that a model's final wrongness score falls along smooth, predictable
          curves as you add more compute, more parameters, or more data -- so predictable you can plan a
          $100 million run with them. A famous 2022 study nicknamed "Chinchilla" then showed that almost
          everyone had been getting the split wrong: models were too big and read too little. This lesson
          lets you compute the right split yourself.
        </p>
      }
      takeaways={[
        "The Chinchilla formula predicts a model's final wrongness score from just two inputs -- model size and amount of training text: L(N,D) = 1.69 + 406.4/N^0.34 + 410.7/D^0.28. Bigger model shrinks one term, more data shrinks the other.",
        "The 1.69 at the front is the floor: human language is genuinely unpredictable to a degree, and no amount of scale removes that part.",
        "The headline rule of thumb: for the best model per unit of budget, train on about 20 tokens of text per parameter. (The exact best ratio drifts a little as budgets grow.)",
        "Many real models deliberately 'overtrain' way past 20-to-1: paying somewhat more at training time buys a smaller model that's permanently cheaper to run for every future user -- usually a great trade.",
        "Around the main training loop sits standard scaffolding -- easing the learning speed up then smoothly down, capping oversized updates, starting with smaller batches. Not optional extras; every big run uses them.",
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
          Set a total compute budget, then choose how to split it using the tokens-per-parameter ratio --
          low ratio means "big model, less reading," high ratio means "small model, lots of reading." The
          model size, data amount, and predicted wrongness score all update live from the real Chinchilla
          formula. The curve traces the predicted score across every ratio from 1 to 400 at your chosen
          budget, with the true best point marked in green -- notice it hovers near 20 but isn't pinned
          exactly there.
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
          Look at the curve's shape: it's steep on the left (a big model starved of reading material is a
          bad waste of budget) but nearly flat on the right (a small model that reads extra costs only a
          little quality). Now add a business fact: what it costs to <em>use</em> a model every day
          depends on its size, not on how much it read during training. A company expecting billions of
          conversations will gladly pay somewhat more once, at training time, to end up with a smaller
          model that's cheaper to run forever after -- sliding right along that flat part of the curve on
          purpose. That's exactly why the LLaMA models train far past the 20-to-1 ratio (LLaMA 3 405B, in
          lesson 2.8, reads about 38 tokens per parameter).
        </p>
      </Section>

      <Section title="Lab — the learning-rate schedule">
        <p>
          Remember the learning rate from lesson 1.7 -- the hiker's stride length? In big training runs
          it isn't held constant; it follows a planned schedule, like a runner pacing a marathon. Start
          gently (a "warmup" -- the model's numbers are random garbage at first, and big steps early on
          cause chaos), ramp up to full speed, then ease off smoothly toward zero by the end so the model
          settles precisely into place instead of bouncing around its final answer. Play with the three
          dials below and watch the shape change.
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
          Two more safety measures matter more than their simplicity suggests. <strong>Gradient
          clipping</strong> puts a hard cap on how big any single update can be -- so one weird batch of
          text can't shove the model violently in a wrong direction. <strong>Batch-size ramp-up</strong>{" "}
          starts training on smaller batches of text and grows them over the early phase, when the model
          is at its most fragile. And despite all of it, big runs still hit <strong>loss spikes</strong>:
          the wrongness score suddenly jumps for no obvious reason. Teams handle these like a corrupted
          save file in a video game -- rewind to the last good save-point, skip the batch that caused
          trouble, maybe ease off the learning rate, and carry on. It's hard-won operating lore as much
          as theory, and lesson 2.7 treats it as exactly that.
        </p>
      </Section>
    </LessonLayout>
  );
}
