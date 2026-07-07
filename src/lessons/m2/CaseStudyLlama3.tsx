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
          Every idea in this module -- the three currencies, the component swaps, scaling laws, data
          cleaning, the GPU warehouse, the instruments -- shows up in one real, fully documented model:
          LLaMA 3 405B, built by Meta in 2024. Most companies keep the messy details of a big training
          run secret. Meta's team wrote theirs down with unusual honesty, failures included, which makes
          this the best public look inside a frontier training run that currently exists.
        </p>
      }
      takeaways={[
        "405 billion parameters, all active for every token -- Meta deliberately chose a simple design, betting that clean data and sheer scale beat architectural cleverness.",
        "It read 15.6 trillion tokens -- about 38 per parameter, nearly double the textbook-optimal 20. That's the deliberate 'train longer, serve cheaper' trade from lesson 2.3.",
        "Its attention heads share key/value notes in groups (8 sets of notes for 128 heads) -- exactly the memory-saving trick from lesson 2.2's calculator, essential for handling long texts.",
        "Training used up to 16,000 GPUs -- not mainly because the model needed the space, but because with fewer machines the same run would take years instead of months.",
        "The paper openly reports how often hardware failed and how the team recovered -- exactly the save-and-restart reality described in lesson 2.5.",
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
          Apply lesson 2.1's formula (C = 6·N·D) to this model's real size and reading list and you get{" "}
          <strong>{C.toExponential(2)}</strong> individual math operations -- a 4 followed by 25 zeros.
          Drag the GPU count below and watch the estimated training time change. A 16,000-GPU cluster
          isn't showing off: it's the difference between finishing in months and finishing in years.
        </p>
        <ScopeScreen label="LLaMA 3 training time and per-GPU memory as a function of GPU count">
          <Slider label="GPU COUNT" value={gpuCount} min={500} max={16000} step={500} onChange={setGpuCount} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
            <Readout label="ESTIMATED TRAINING TIME" value={`${trainingDays.toFixed(0)} days`} accent={colors.amber} />
            <Readout label="PER-GPU MEMORY (ZeRO-3 sharded)" value={`${perGPUGB.toFixed(2)} GB`} accent={colors.cyan} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Assumes each GPU achieves about 40% of its theoretical top speed -- realistic in practice. At
            16,000 GPUs the estimate lands in the same few-months range as the real reported run; drop to
            a few hundred GPUs and the identical run stretches to years. That, more than storage space,
            is the real argument for a cluster this size.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Keeping it simple, on purpose">
        <p>
          Some rival models at this scale use a design called "mixture of experts," where the model is
          split into specialist sub-networks and each token only visits a few of them -- like a hospital
          routing each patient to the right departments instead of every doctor seeing every patient.
          It's clever and saves compute. Meta bet the other way: one plain network where every parameter
          works on every token, with the effort spent instead on data quality, training stability, and
          sheer scale. Their paper frames it explicitly as choosing reliability over cleverness -- a
          defensible bet given how much of this module's content (data, systems, scaling arithmetic)
          matters more than any single architectural trick.
        </p>
      </Section>

      <Section title="What the paper is unusually candid about">
        <p>
          Most frontier labs guard their training details closely. The LLaMA 3 paper instead documents
          the whole playbook you've just learned: training mostly on shorter texts and stretching to long
          ones late (lesson 2.6's position-encoding tricks), a frank accounting of how often hardware
          died at 16,000-GPU scale and how the save-and-restart routine handled it, and a final phase
          that concentrated the best-quality reading material at the end of training. That combination
          of scale and honesty is exactly why this one paper, more than any other public document, works
          as the spine of this entire module.
        </p>
      </Section>
    </LessonLayout>
  );
}
