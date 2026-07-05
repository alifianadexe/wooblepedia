import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { SegmentedControl, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, trainingMemoryPerGPU, type ParallelMode } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "training-infrastructure-systems")!;

const H100_GB = 80;
const HOME_CARD_GB = 8;

type Mode = "inference" | "train";
type ParallelDemo = "dp" | "tp" | "pp";

function gridColor(gb: number, budget: number): string {
  if (gb <= budget * 0.75) return colors.green;
  if (gb <= budget) return colors.amber;
  return colors.red;
}

export default function TrainingInfrastructureSystems() {
  const [log2SizeB, setLog2SizeB] = useLabSetting("m2-infra-log2sizeb", 6.6);
  const [logGpus, setLogGpus] = useLabSetting("m2-infra-loggpus", 6);
  const [mode, setMode] = useLabSetting<Mode>("m2-infra-mode", "train");
  const [shard, setShard] = useLabSetting<ParallelMode>("m2-infra-shard", "zero3");
  const [parallelDemo, setParallelDemo] = useLabSetting<ParallelDemo>("m2-infra-paralleldemo", "pp");

  const sizeB = 2 ** log2SizeB;
  const N = sizeB * 1e9;
  const gpuCount = Math.round(2 ** logGpus);
  const bytesPerParam = mode === "inference" ? 2 : 16;
  const perGPUBytes = trainingMemoryPerGPU(N, gpuCount, shard, bytesPerParam);
  const perGPUGB = bytesToGB(perGPUBytes);

  const gridCells = Math.min(gpuCount, 64);

  const demoCells = Array.from({ length: 8 }, (_, i) => {
    if (parallelDemo === "dp") {
      return { title: "REPLICA", subtitle: `batch shard ${i + 1}/8`, color: colors.cyan };
    }
    if (parallelDemo === "tp") {
      return { title: `SLICE ${i + 1}/8`, subtitle: "every layer, 1/8 width", color: colors.amber };
    }
    return { title: `STAGE ${i + 1}/8`, subtitle: `layers ${i * 4 + 1}-${i * 4 + 4} of 32`, color: `hsl(${180 + i * 22}, 65%, 55%)` };
  });

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          A model too large for one GPU's memory can't simply be "run slower" -- it has to be split across
          many GPUs in a specific, deliberate way, and the choice of how to split it is itself a major
          engineering decision. This lesson starts from the raw memory arithmetic and builds up to the three
          ways a model actually gets distributed across a cluster.
        </p>
      }
      takeaways={[
        "Inference costs about 2 bytes/parameter (fp16 weights); mixed-precision AdamW training costs about 16 bytes/parameter -- before any activations are counted.",
        "Data parallelism replicates the whole model on every GPU and splits the batch; tensor parallelism splits individual matrix multiplications across GPUs; pipeline parallelism splits the layers themselves into sequential stages.",
        "ZeRO/FSDP shards optimizer states, gradients, and parameters across data-parallel ranks instead of replicating them, trading some communication for a dramatic per-GPU memory reduction.",
        "Activation checkpointing trades recomputation for memory: instead of storing every intermediate activation for backprop, it recomputes them on the backward pass from a handful of saved checkpoints.",
        "At thousands of GPUs, hardware failures become a near-constant background process -- automated checkpoint-and-resume tooling, not failure prevention, is what keeps a multi-month run alive.",
      ]}
      references={[
        {
          title: "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism — Shoeybi et al., 2019",
          meta: "arXiv:1909.08053 — tensor parallelism",
          url: "https://arxiv.org/abs/1909.08053",
        },
        {
          title: "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models — Rajbhandari et al., 2019",
          meta: "arXiv:1910.02054",
          url: "https://arxiv.org/abs/1910.02054",
        },
        {
          title: "Efficient Large-Scale Language Model Training on GPU Clusters — Narayanan et al., 2021",
          meta: "arXiv:2104.04473 — combining data, tensor, and pipeline parallelism",
          url: "https://arxiv.org/abs/2104.04473",
        },
        {
          title: "The Llama 3 Herd of Models — infrastructure section",
          meta: "arXiv:2407.21783 — real operational detail on training at 16K-GPU scale",
          url: "https://arxiv.org/abs/2407.21783",
        },
      ]}
    >
      <Section title="Lab — the memory console">
        <p>
          Set a model size and a GPU count, pick inference or training, and toggle full replication against
          ZeRO-3 style sharding. Every reading is <code>trainingMemoryPerGPU</code> from{" "}
          <code>src/lib/math.ts</code>.
        </p>
        <ScopeScreen label="Per-GPU memory console with model size, GPU count, mode, and sharding controls">
          <Slider label="MODEL SIZE (BILLIONS OF PARAMS, LOG SCALE)" value={log2SizeB} min={0} max={9} step={0.05}
            onChange={setLog2SizeB}
            format={() => `${sizeB.toFixed(1)}B`}
          />
          <Slider label="LOG2(GPU COUNT)" value={logGpus} min={0} max={10} step={1} onChange={setLogGpus} format={() => gpuCount.toString()} />
          <SegmentedControl label="MODE" value={mode} options={[{ value: "inference", label: "INFERENCE" }, { value: "train", label: "TRAIN" }]} onChange={setMode} />
          <SegmentedControl label="SHARDING" value={shard} options={[{ value: "replicated", label: "FULLY REPLICATED" }, { value: "zero3", label: "ZERO-3 SHARDED" }]} onChange={setShard} />

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "14px 0" }}>
            <Readout label="PER-GPU MEMORY" value={`${perGPUGB.toFixed(2)} GB`} accent={gridColor(perGPUGB, H100_GB)} />
            <Readout label="VS. H100 (80GB)" value={perGPUGB <= H100_GB ? "FITS" : "EXCEEDS"} accent={gridColor(perGPUGB, H100_GB)} />
            <Readout label="VS. YOUR 8GB CARD" value={perGPUGB <= HOME_CARD_GB ? "FITS" : "EXCEEDS"} accent={gridColor(perGPUGB, HOME_CARD_GB)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(8, gridCells)}, 1fr)`, gap: 3, maxWidth: 320 }} role="img" aria-label={`Grid of ${gridCells} GPUs colored by whether their memory usage fits an H100`}>
            {Array.from({ length: gridCells }, (_, i) => (
              <div key={i} style={{ aspectRatio: "1", background: gridColor(perGPUGB, H100_GB), borderRadius: 2, opacity: shard === "replicated" ? 0.9 : 0.55 }} />
            ))}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            {shard === "replicated" ? "Every GPU holds a full copy." : `Every GPU holds roughly 1/${gpuCount} of the state.`}
            {gpuCount > 64 && ` (showing first 64 of ${gpuCount})`}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Three ways to split a model">
        <p>
          <strong>Data parallelism</strong> is the simplest: every GPU holds an identical full copy of the
          model and processes a different slice of the batch; gradients are all-reduced (averaged) across
          GPUs before the optimizer step. <strong>Tensor parallelism</strong> (Megatron-style) instead splits
          individual weight matrices themselves -- a single matrix multiplication is computed cooperatively
          across GPUs, each holding only a column or row slice. <strong>Pipeline parallelism</strong> splits
          the model's layers into sequential stages, each living on a different GPU, with microbatching used
          to keep every stage busy rather than idle while waiting on the stage before it (the "pipeline
          bubble" problem). Real large-scale training runs combine all three simultaneously.
        </p>
        <ScopeScreen label="Eight-GPU grid recolored to show what each GPU holds under data, tensor, or pipeline parallelism">
          <SegmentedControl
            label="PARALLELISM MODE"
            value={parallelDemo}
            options={[{ value: "dp", label: "DATA PARALLEL" }, { value: "tp", label: "TENSOR PARALLEL" }, { value: "pp", label: "PIPELINE PARALLEL" }]}
            onChange={setParallelDemo}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>
            {demoCells.map((c, i) => (
              <div key={i} className="panel-2" style={{ padding: 8, borderLeft: `3px solid ${c.color}`, fontSize: 11 }}>
                <div className="mono" style={{ color: c.color }}>{c.title}</div>
                <div style={{ color: "var(--muted)", marginTop: 2 }}>{c.subtitle}</div>
              </div>
            ))}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="ZeRO/FSDP, activation checkpointing, and staying alive at scale">
        <p>
          Data parallelism's obvious waste is that every GPU redundantly stores the full optimizer state,
          gradients, and parameters. ZeRO (and its widely-used implementation, FSDP) shards all three across
          the data-parallel group instead of replicating them -- each GPU holds only its slice, reconstructing
          the full parameter briefly via communication only when needed for compute. The memory console above
          computed exactly this trade-off. Separately, <strong>activation checkpointing</strong> discards
          most intermediate activations during the forward pass and recomputes them during the backward pass
          from a small number of saved checkpoints -- trading extra compute for a large activation-memory
          reduction, often essential once a model plus its optimizer state already consumes most of a GPU's
          budget. At the scale of thousands of GPUs running for months, hardware failures stop being an edge
          case and become routine background noise; frequent, fast checkpoint-and-resume is the operational
          discipline that makes runs at that scale survivable at all.
        </p>
      </Section>
    </LessonLayout>
  );
}
