import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, computeFlops, trainingMemoryPerGPU } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "case-study-llama-3")!;

const N = 405e9;
const D = 15.6e12;
const C = computeFlops(N, D);
const TOK_PER_PARAM = D / N;
const H100_EFFECTIVE_FLOPS = 400e12; // ~40% MFU of ~990 TFLOP/s bf16 peak

interface SpecCard {
  label: string;
  value: string;
  link?: string;
}

const CARDS: SpecCard[] = [
  { label: "PARAMETERS", value: "405B (dense)" },
  { label: "LAYERS", value: "126" },
  { label: "D_MODEL", value: "16,384" },
  { label: "ATTENTION HEADS", value: "128 query / 8 KV (GQA)", link: "/m2/training-objectives-architecture" },
  { label: "VOCABULARY", value: "128,000 tokens" },
  { label: "TRAINING TOKENS", value: "15.6T" },
  { label: "TOKENS / PARAMETER", value: `${TOK_PER_PARAM.toFixed(1)} (well past Chinchilla-optimal ~20)`, link: "/m2/scaling-laws-optimization" },
  { label: "TRAINING COMPUTE", value: `${C.toExponential(2)} FLOPs` },
  { label: "CLUSTER", value: "up to 16,000 H100 GPUs", link: "/m2/training-infrastructure-systems" },
];

export default function CaseStudyLlama3() {
  const [gpuCount, setGpuCount] = useLabSetting("m2-llama-gpucount", 16000);

  const perGPUGB = bytesToGB(trainingMemoryPerGPU(N, gpuCount, "zero3", 16));
  const trainingDays = C / (gpuCount * H100_EFFECTIVE_FLOPS) / 86400;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Every idea in this module -- the three currencies, architectural choices, scaling laws, data
          engineering, systems, evaluation -- shows up in one real, fully documented model. LLaMA 3 405B is
          unusual for how candidly Meta wrote about the decisions and failures behind it, which makes it the
          best public systems document this field currently has.
        </p>
      }
      takeaways={[
        "405B parameters, dense (no mixture-of-experts) -- the paper argues a simple, well-scaled dense architecture plus data and compute beats architectural cleverness at this scale.",
        "15.6T training tokens against 405B parameters is about 38 tokens per parameter, deliberately well past the Chinchilla-optimal ratio of roughly 20 -- an inference-cost trade explained in lesson 2.3.",
        "GQA with 8 KV heads (versus 128 query heads) exists specifically to keep the KV cache tractable at long context, per lesson 2.2's calculator.",
        "Training used up to 16,000 H100 GPUs -- driven primarily by the sheer size of the compute budget (needing to finish in months, not years), not by memory capacity alone.",
        "The paper is unusually candid about infrastructure failures and recovery cadence at that scale -- exactly the operational reality described in lesson 2.5.",
      ]}
      references={[
        {
          title: "The Llama 3 Herd of Models — Meta AI, 2024",
          meta: "arXiv:2407.21783 — the primary source for every figure on this page",
          url: "https://arxiv.org/abs/2407.21783",
        },
        {
          title: "Meta AI Engineering Blog — Llama 3 infrastructure",
          meta: "engineering.fb.com — additional detail on the training cluster and systems work",
          url: "https://engineering.fb.com/2024/03/12/data-center-engineering/building-metas-genai-infrastructure/",
        },
      ]}
    >
      <Section title="Lab — the spec dashboard">
        <p>Every headline number, cross-linked back to the lesson that explains where it comes from.</p>
        <ScopeScreen label="LLaMA 3 405B specification dashboard with cards linking to the lessons that explain each figure">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {CARDS.map((c) => {
              const body = (
                <div className="panel" style={{ padding: 12, height: "100%", borderColor: c.link ? colors.amber : undefined }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{c.label}</div>
                  <div className="mono" style={{ fontSize: 14, color: c.link ? colors.amber : colors.text, marginTop: 4 }}>{c.value}</div>
                </div>
              );
              return c.link ? <Link key={c.label} to={c.link} style={{ textDecoration: "none" }}>{body}</Link> : <div key={c.label}>{body}</div>;
            })}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Lab — the compute, and why 16,000 GPUs">
        <p>
          C = 6·N·D from lesson 2.1, computed on LLaMA 3 405B's actual parameters and token count, lands at{" "}
          <strong>{C.toExponential(2)} FLOPs</strong>. Drag the GPU count below to see why a cluster this
          large isn't extravagance -- it's what turns an otherwise multi-year training run into a few months,
          at a realistic effective per-GPU throughput.
        </p>
        <ScopeScreen label="LLaMA 3 training time and per-GPU memory as a function of GPU count">
          <Slider label="GPU COUNT" value={gpuCount} min={500} max={16000} step={500} onChange={setGpuCount} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
            <Readout label="ESTIMATED TRAINING TIME" value={`${trainingDays.toFixed(0)} days`} accent={colors.amber} />
            <Readout label="PER-GPU MEMORY (ZeRO-3 sharded)" value={`${perGPUGB.toFixed(2)} GB`} accent={colors.cyan} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Assumes ~400 TFLOP/s effective per H100 (~40% utilization of its ~990 TFLOP/s bf16 peak). At
            16,000 GPUs this lands in the same few-months range as the real reported training run --
            dropping to a few hundred GPUs stretches an identical run to years, which is the actual
            argument for a cluster this size, more than raw memory capacity.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Dense, not mixture-of-experts">
        <p>
          At 405B parameters, a mixture-of-experts design (routing each token to a subset of specialized
          sub-networks) was a live option, used by some contemporaries. Meta's stated bet was the opposite:
          keep the architecture simple and dense, and put the engineering effort into data quality, training
          stability, and scale instead. The paper frames this explicitly as a choice for simplicity and
          reliability at scale over architectural cleverness -- a defensible position given how much of this
          module's content (systems, data, scaling laws) matters more than any single architectural trick.
        </p>
      </Section>

      <Section title="What the paper is unusually candid about">
        <p>
          Most frontier labs treat training infrastructure as closely guarded. The LLaMA 3 paper instead
          documents staged long-context training (starting short, extending via the position-encoding
          techniques from lesson 2.6), a real account of hardware failure rates and checkpoint-recovery
          practice at 16,000-GPU scale, and an annealing phase that concentrates the highest-quality data at
          the end of training. That combination of scale and candor is exactly why this paper, more than any
          other public document, works as the spine of this entire module.
        </p>
      </Section>
    </LessonLayout>
  );
}
