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
          Every idea from this module -- tokens, embeddings, position stamps, attention, training -- adds
          up to one concrete thing: a real GPT-2, the model OpenAI released in 2019. Before building
          anything big, it's smart to do what an architect does before construction: figure out the
          size. How many learned numbers will this model have? How much memory does it take to run? To
          train? Does any of that fit on an ordinary graphics card? This lesson answers those questions
          with exact arithmetic, then shows how little code the real thing actually takes.
        </p>
      }
      takeaways={[
        "A model's total parameter count isn't a mystery number -- it's simple arithmetic you can do yourself: the embedding tables plus a fixed formula per layer, and everything adds up exactly.",
        "That arithmetic reproduces GPT-2's four published sizes on the nose: 124M, 355M, 774M, and 1.56B parameters. No magic.",
        "Running a model costs about 2 bytes of memory per parameter. Training costs about 16 bytes per parameter -- eight times more -- because training keeps several extra bookkeeping numbers for every single one.",
        "On an 8GB graphics card, the smallest GPT-2 trains comfortably; the largest one's training footprint (~25GB) simply doesn't fit without special tricks or a smaller model.",
        "A complete, working GPT-2 fits in about 300 lines of code. The ideas in this module, not the volume of code, are the hard part.",
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
          Two dials control a GPT-2's size: <strong>d_model</strong>, how many numbers describe each
          token (the "width"), and <strong>n_layers</strong>, how many transformer layers are stacked up
          (the "depth"). Adjust them directly or jump to one of the four sizes OpenAI actually
          published. Every number below is computed live from the real formula -- nothing is hard-coded.
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
            These figures leave out activations -- the temporary numbers from lesson 1.1 -- which pile on
            top depending on how much text you process at once. A model that "fits" here can still run
            out of memory mid-answer on a very long text.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Verifying the formula against reality">
        <p>
          Set the preset to SMALL: width 768, 12 layers, GPT-2's real vocabulary (50,257 tokens) and
          context window (1,024 tokens). The console reads exactly 124.4 million parameters -- the widely
          cited "GPT-2 124M." Click through MEDIUM, LARGE, and XL and you land on 355M, 774M, and 1.56B,
          matching OpenAI's published numbers exactly. That's not a coincidence baked into this demo --
          it's the same arithmetic (the embedding tables, plus a fixed formula for each layer) that
          produced those famous numbers in the first place. Model sizes you read about in the news are
          just this kind of addition.
        </p>
      </Section>

      <Section title="The implementation map">
        <p>
          If you ever want to read a real implementation, nanoGPT (a famous, deliberately minimal GPT-2
          codebase by Andrej Karpathy) mirrors this module's lessons almost one-to-one. You don't need to
          read code to finish this course -- but it's reassuring to see how short the real thing is:
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
          If you do want to try training something yourself, the classic first experiment is teaching a
          tiny model to write fake Shakespeare, one character at a time -- a few megabytes of text, an
          alphabet of about 65 characters, and a model small enough to train from scratch in minutes
          rather than days:
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
          That configuration -- 6 layers, width 384, 256-token context -- lands at only a few million
          parameters: comfortably inside an 8GB graphics card even during training, with room to spare.
          It's small enough to make mistakes you can learn from and fast enough to try again five minutes
          later, which is exactly what a first from-scratch run should be.
        </p>
      </Section>
    </LessonLayout>
  );
}
