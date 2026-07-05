import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { SegmentedControl, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, gpt2ParamCount, inferenceMemoryBytes, trainingMemoryBytes } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "gpt2-from-scratch")!;

const VOCAB = 50257;
const CTX = 1024;

const PRESETS: Record<string, { d: number; layers: number }> = {
  SMALL: { d: 768, layers: 12 },
  MEDIUM: { d: 1024, layers: 24 },
  LARGE: { d: 1280, layers: 36 },
  XL: { d: 1600, layers: 48 },
};

const CARD_BUDGET_GB = 8;

function verdict(gb: number): { label: string; color: string } {
  if (gb <= CARD_BUDGET_GB * 0.75) return { label: "FITS", color: colors.green };
  if (gb <= CARD_BUDGET_GB) return { label: "TIGHT", color: colors.amber };
  return { label: "WON'T FIT", color: colors.red };
}

export default function GPT2FromScratch() {
  const [dModel, setDModel] = useLabSetting("m1-gpt2-dmodel", 768);
  const [nLayers, setNLayers] = useLabSetting("m1-gpt2-nlayers", 12);

  const breakdown = gpt2ParamCount(dModel, nLayers, VOCAB, CTX);
  const infGB = bytesToGB(inferenceMemoryBytes(breakdown.total));
  const trainGB = bytesToGB(trainingMemoryBytes(breakdown.total));
  const infV = verdict(infGB);
  const trainV = verdict(trainGB);

  const segments = [
    { label: "EMBEDDINGS", value: breakdown.embeddings, color: colors.cyan },
    { label: "ATTENTION", value: breakdown.attention, color: colors.amber },
    { label: "MLP", value: breakdown.mlp, color: colors.magenta },
    { label: "LAYER NORMS", value: breakdown.layerNorms, color: colors.green },
  ];

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Every idea from this module -- tokens, embeddings, position, attention, the residual stream,
          training -- adds up to one concrete artifact: a real GPT-2. Before writing a line of model code,
          a competent engineer sizes it: how many parameters, how much memory to run it, how much to train
          it, and whether any of that fits the hardware on hand. This lesson does that sizing exactly, then
          maps it onto the actual file structure you'd write.
        </p>
      }
      takeaways={[
        "Parameter count decomposes exactly: embeddings = vocab·d + ctx·d; each block = 12d² + 13d (attention 4d²+4d, MLP 8d²+5d, norms 4d); plus a final 2d for the last layer norm.",
        "That formula reproduces GPT-2's published sizes exactly: 124M (small), ~355M (medium), 774M (large), 1.56B (XL) at their respective (d, layers) settings.",
        "Inference memory is roughly 2 bytes/param at fp16; mixed-precision AdamW training is roughly 16 bytes/param (fp16 weights + fp16 grads + fp32 master weights + two fp32 Adam moments) -- before a single activation is counted.",
        "On an 8GB card, GPT-2 small trains comfortably; GPT-2 XL's training footprint alone (~25GB) does not fit without offloading, quantization, or a smaller model.",
        "nanoGPT's entire model definition lives in about 300 lines across four classes (CausalSelfAttention, MLP, Block, GPT) -- proof that the ideas in this module, not raw code volume, are the hard part.",
      ]}
      references={[
        {
          title: "Language Models are Unsupervised Multitask Learners (GPT-2) — Radford et al., 2019",
          meta: "OpenAI paper — the four published GPT-2 sizes this lab's presets reproduce",
          url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
        },
        {
          title: "nanoGPT — Andrej Karpathy",
          meta: "repo + \"Let's build GPT from scratch\" video — the minimal, readable reference implementation this lesson's file map describes",
          url: "https://github.com/karpathy/nanoGPT",
        },
      ]}
    >
      <Section title="Lab — the parameter budget console">
        <p>
          Adjust d_model and layer count directly, or jump to one of the four published GPT-2 sizes. Every
          number below comes from <code>gpt2ParamCount</code> in <code>src/lib/math.ts</code>.
        </p>
        <ScopeScreen label="GPT-2 parameter budget console with sliders, presets, and memory verdicts for an 8GB GPU">
          <SegmentedControl
            label="PRESET"
            value={Object.keys(PRESETS).find((k) => PRESETS[k].d === dModel && PRESETS[k].layers === nLayers) ?? "CUSTOM"}
            options={[
              { value: "SMALL", label: "SMALL (124M)" },
              { value: "MEDIUM", label: "MEDIUM (355M)" },
              { value: "LARGE", label: "LARGE (774M)" },
              { value: "XL", label: "XL (1.56B)" },
              { value: "CUSTOM", label: "CUSTOM" },
            ]}
            onChange={(v) => {
              if (v !== "CUSTOM" && PRESETS[v]) {
                setDModel(PRESETS[v].d);
                setNLayers(PRESETS[v].layers);
              }
            }}
          />
          <Slider label="D_MODEL" value={dModel} min={64} max={2048} step={64} onChange={setDModel} />
          <Slider label="N_LAYERS" value={nLayers} min={1} max={60} step={1} onChange={setNLayers} />

          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", margin: "12px 0 4px" }}>
            PARAMETER BREAKDOWN — TOTAL {(breakdown.total / 1e6).toFixed(1)}M
          </div>
          <div style={{ display: "flex", height: 28, borderRadius: 4, overflow: "hidden", border: `1px solid ${colors.border}` }}>
            {segments.map((s) => (
              <div
                key={s.label}
                title={`${s.label}: ${(s.value / 1e6).toFixed(1)}M`}
                style={{ width: `${(s.value / breakdown.total) * 100}%`, background: s.color }}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginTop: 8 }}>
            {segments.map((s) => (
              <div key={s.label} className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
                <span style={{ display: "inline-block", width: 8, height: 8, background: s.color, marginRight: 4 }} />
                {s.label}: {(s.value / 1e6).toFixed(1)}M
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 20 }}>
            <div>
              <Readout label="FP16 INFERENCE" value={`${infGB.toFixed(2)} GB`} accent={infV.color} />
              <div className="mono" style={{ fontSize: 11, color: infV.color, marginTop: 4 }}>{infV.label} ON YOUR 8GB CARD</div>
            </div>
            <div>
              <Readout label="ADAMW TRAINING (16B/param)" value={`${trainGB.toFixed(2)} GB`} accent={trainV.color} />
              <div className="mono" style={{ fontSize: 11, color: trainV.color, marginTop: 4 }}>{trainV.label} ON YOUR 8GB CARD</div>
            </div>
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            These figures exclude activations, which scale with batch size and sequence length on top of
            this floor -- a model that "fits" here can still run out of memory mid-forward-pass at a large
            batch size or long context.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Verifying the formula against reality">
        <p>
          Set the preset to SMALL: d_model 768, 12 layers, GPT-2's real vocab (50,257) and context (1,024).
          The console should read exactly 124.4M parameters -- the widely cited "GPT-2 124M." Switch through
          MEDIUM, LARGE, and XL and you'll land on 355M, 774M, and 1.56B respectively, matching OpenAI's
          published sizes. This isn't a coincidence baked into the demo; it's the same arithmetic
          (embeddings + 12 layers × (12d²+13d) + final norm) that produced those numbers in the first place.
        </p>
      </Section>

      <Section title="The implementation map">
        <p>
          nanoGPT's <code>model.py</code> mirrors this module's lessons almost one-to-one. A quick tour:
        </p>
        <ScopeScreen label="nanoGPT file and class structure">
          <pre className="mono" style={{ fontSize: 12.5, margin: 0, lineHeight: 1.9 }}>
{`model.py
├── CausalSelfAttention   — lesson 1.5: q/k/v projections, scaled dot-product, causal mask
├── MLP                   — lesson 1.6: 4x expansion, GELU, project back down
├── Block                 — lesson 1.6: LayerNorm → attention → residual add,
│                            LayerNorm → MLP → residual add
└── GPT                   — lesson 1.3/1.4: token + position embeddings,
                             stack of Blocks, final LayerNorm, tied LM head

train.py                  — lesson 1.7: the forward/loss/backward/optimizer-step loop,
                             plus data loading, checkpointing, and the LR schedule (lesson 2.3)`}
          </pre>
        </ScopeScreen>
      </Section>

      <Section title="Your first run, on your 8GB card">
        <p>
          The smallest meaningful nanoGPT experiment is character-level Shakespeare -- a few megabytes of
          text, a vocabulary of about 65 characters, and a model small enough to train from scratch in
          minutes rather than days:
        </p>
        <ScopeScreen label="Command sequence for training a tiny character-level GPT-2 on an 8GB GPU">
          <pre className="mono" style={{ fontSize: 12.5, margin: 0 }}>
{`git clone https://github.com/karpathy/nanoGPT
cd nanoGPT
python data/shakespeare_char/prepare.py

python train.py config/train_shakespeare_char.py \\
  --device=cuda --compile=False \\
  --batch_size=32 --block_size=256 \\
  --n_layer=6 --n_head=6 --n_embd=384`}
          </pre>
        </ScopeScreen>
        <p>
          That configuration -- 6 layers, 384-dim, 256-token context -- lands at only a few million
          parameters: comfortably inside 8GB even with full fp32 AdamW training and room to spare for
          activations. It's small enough to be wrong in instructive ways and fast enough to iterate on in
          one sitting, which is exactly what a first from-scratch run should be.
        </p>
      </Section>
    </LessonLayout>
  );
}
