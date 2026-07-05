import { useMemo } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { benchmarkAccuracyCurve, generateTrainingRun, mulberry32, perplexity } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "evaluation-during-pretraining")!;

const STEPS = 3000;
const SPIKE_STEPS = [800, 2100];
const lossCurve = generateTrainingRun(STEPS, 1.9, 6, 0.3, 42, SPIKE_STEPS);
const smoothAcc = benchmarkAccuracyCurve(STEPS, 1200, 2.5);

const SAMPLE_EVERY = 150;
const sampledSteps: number[] = [];
for (let t = SAMPLE_EVERY; t <= STEPS; t += SAMPLE_EVERY) sampledSteps.push(t);
const noiseRand = mulberry32(7);
const sampledAcc = sampledSteps.map((t) => Math.min(1, Math.max(0, smoothAcc[t - 1] + (noiseRand() - 0.5) * 0.05)));

const lossMin = Math.min(...lossCurve);
const lossMax = Math.max(...lossCurve);

export default function EvaluationDuringPretraining() {
  const [step, setStep] = useLabSetting("m2-eval-step", 1500);
  const [showBench, setShowBench] = useLabSetting("m2-eval-showbench", true);

  const loss = lossCurve[step - 1];
  const ppl = perplexity(loss);

  const nearestSpike = useMemo(() => SPIKE_STEPS.find((s) => Math.abs(s - step) < 40), [step]);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          A training run can last weeks and cost millions of dollars, with no way to pause and "check if
          it's working" other than the instruments you built in beforehand. This lesson is about what those
          instruments actually are, and why a smooth loss curve and a jumpy benchmark curve can be
          measuring the exact same underlying improvement.
        </p>
      }
      takeaways={[
        "Held-out loss and its exponential, perplexity, are the primary real-time instrument during a run -- computed every step, cheaply, from data the model never trains on.",
        "Scaling-law loss predictions (lesson 2.3) serve as sanity checks mid-run: if measured loss diverges badly from the predicted curve, something is wrong before a benchmark would ever catch it.",
        "Benchmark suites (MMLU, HellaSwag, HumanEval, etc.) are evaluated only periodically and often score in discrete, thresholded ways -- which can make smooth underlying improvement look like a sudden 'emergent' jump.",
        "Decontamination -- checking that benchmark test data hasn't leaked into training data -- is what keeps those benchmark numbers meaningful at all.",
        "Loss spikes get handled operationally: rewind to the last good checkpoint, skip the offending data batch, or lower the learning rate and resume -- not by anything fancier.",
      ]}
      references={[
        {
          title: "Training Compute-Optimal Large Language Models — Hoffmann et al., 2022",
          meta: "arXiv:2203.15556 — scaling-law loss predictions as an in-run sanity check",
          url: "https://arxiv.org/abs/2203.15556",
        },
        {
          title: "Emergent Abilities of Large Language Models — Wei et al., 2022",
          meta: "arXiv:2206.07682 — the original observation of sudden benchmark jumps with scale",
          url: "https://arxiv.org/abs/2206.07682",
        },
        {
          title: "Are Emergent Abilities of Large Language Models a Mirage? — Schaeffer et al., 2023",
          meta: "arXiv:2304.15004 — argues many 'emergent' jumps are metric artifacts, not sudden capability shifts",
          url: "https://arxiv.org/abs/2304.15004",
        },
      ]}
    >
      <Section title="Lab — a simulated training run">
        <p>
          This loss curve is generated from a real power law, <code>L(t) = L∞ + a·t^(−b)</code>, with seeded
          noise and two injected spikes -- not hand-drawn. Scrub through training steps and watch loss and
          perplexity update; toggle the benchmark overlay to compare a per-step-smooth instrument against
          one that's only sampled occasionally.
        </p>
        <ScopeScreen label="Simulated training run with a scrubber showing loss, perplexity, and an optional benchmark accuracy overlay">
          <Slider label="TRAINING STEP" value={step} min={1} max={STEPS} step={1} onChange={setStep} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "10px 0" }}>
            <Readout label="LOSS" value={loss.toFixed(3)} accent={colors.cyan} />
            <Readout label="PERPLEXITY" value={ppl.toFixed(2)} accent={colors.green} />
          </div>
          <Toggle label="OVERLAY BENCHMARK ACCURACY (sampled every 150 steps)" checked={showBench} onChange={setShowBench} />

          <svg viewBox="0 0 400 170" width="100%" height="190" aria-label="Loss curve over training steps with an optional sparsely-sampled benchmark accuracy overlay and a scrubber marking the current step">
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={1.5}
              points={lossCurve.map((l, i) => `${(i / STEPS) * 400},${150 - ((l - lossMin) / (lossMax - lossMin)) * 130}`).join(" ")}
            />
            {showBench && (
              <polyline
                fill="none"
                stroke={colors.amber}
                strokeWidth={2}
                points={sampledSteps.map((t, i) => `${(t / STEPS) * 400},${150 - sampledAcc[i] * 130}`).join(" ")}
              />
            )}
            {showBench && sampledSteps.map((t, i) => (
              <circle key={t} cx={(t / STEPS) * 400} cy={150 - sampledAcc[i] * 130} r={2.5} fill={colors.amber} />
            ))}
            {SPIKE_STEPS.map((s) => (
              <line key={s} x1={(s / STEPS) * 400} y1={20} x2={(s / STEPS) * 400} y2={150} stroke={colors.red} strokeDasharray="3 3" strokeWidth={1} />
            ))}
            <line x1={(step / STEPS) * 400} y1={20} x2={(step / STEPS) * 400} y2={150} stroke={colors.text} strokeWidth={1.5} />
          </svg>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            cyan = loss (measured every step, smooth) — amber = benchmark accuracy (sampled every {SAMPLE_EVERY} steps, jumpier) — red dashed = injected loss spikes
          </div>
          {nearestSpike && (
            <div className="panel-2" style={{ padding: 10, marginTop: 10, borderLeft: `3px solid ${colors.red}` }}>
              <div className="mono" style={{ fontSize: 11, color: colors.red }}>LOSS SPIKE NEAR STEP {nearestSpike}</div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                Real teams respond by rewinding to the last stable checkpoint, skipping the batch that
                triggered it, or lowering the learning rate before resuming -- rarely anything more exotic.
              </div>
            </div>
          )}
        </ScopeScreen>
      </Section>

      <Section title="Why 'emergence' is often a measurement artifact">
        <p>
          Loss is a continuous, smooth number measured every single step on held-out data, so it reveals
          gradual improvement directly. Many benchmarks, by contrast, score pass/fail on individual problems
          (did the model get the exact right answer?) and are only evaluated periodically. A capability that
          is actually improving smoothly and continuously underneath can cross a scoring threshold abruptly
          on a coarse, infrequent benchmark, producing what looks like a sudden "emergent" jump. Schaeffer et
          al.'s analysis argues this is frequently exactly what's happening -- not a genuine discontinuity in
          the model's underlying ability, but an artifact of measuring smooth progress with a jumpy,
          thresholded ruler.
        </p>
      </Section>
    </LessonLayout>
  );
}
