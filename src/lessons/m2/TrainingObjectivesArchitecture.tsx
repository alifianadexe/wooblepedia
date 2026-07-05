import { Fragment, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, kvCacheBytes } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "training-objectives-architecture")!;

type DetailKey = "norm" | "attention" | "position" | "mlp";

const DETAILS: Record<DetailKey, { title: string; gpt2: string; llama: string; why: string }> = {
  norm: {
    title: "NORMALIZATION",
    gpt2: "LayerNorm (subtract mean, divide by std, then scale/shift)",
    llama: "RMSNorm (skip mean-centering, divide by root-mean-square)",
    why: "RMSNorm drops the mean-centering step entirely, keeping only the rescaling. It's cheaper to compute and empirically performs on par with LayerNorm at scale.",
  },
  attention: {
    title: "ATTENTION",
    gpt2: "Multi-head attention (MHA) — every query head has its own K/V head",
    llama: "Grouped-query attention (GQA) — groups of query heads share one K/V head",
    why: "Sharing K/V heads across a group of query heads shrinks the KV cache proportionally to the number of groups, with minimal measured quality loss — the calculator below makes this concrete.",
  },
  position: {
    title: "POSITION ENCODING",
    gpt2: "Learned absolute position embeddings (a second lookup table, added at the input)",
    llama: "RoPE — rotates query/key pairs by a position-dependent angle inside attention",
    why: "RoPE makes attention scores depend on relative offset rather than absolute position, which tends to generalize better to sequence lengths beyond what was seen in training (lesson 1.4).",
  },
  mlp: {
    title: "MLP",
    gpt2: "Two matrices, GELU nonlinearity, 4x hidden expansion",
    llama: "SwiGLU — three matrices (one acts as a learned gate), hidden expansion ≈ 8/3·d",
    why: "SwiGLU multiplies a learned gate against an activation before the down-projection. The 8/3 (rather than 4x) hidden ratio roughly compensates for the extra matrix, keeping total MLP parameters comparable.",
  },
};

const KV_BASELINE_HEADS = 128;

export default function TrainingObjectivesArchitecture() {
  const [detail, setDetail] = useState<DetailKey>("attention");
  const [layers, setLayers] = useLabSetting("m2-arch-layers", 32);
  const [kvHeads, setKvHeads] = useLabSetting("m2-arch-kvheads", 8);
  const [headDim, setHeadDim] = useLabSetting("m2-arch-headdim", 128);
  const [logCtx, setLogCtx] = useLabSetting("m2-arch-logctx", 13);
  const [batch, setBatch] = useLabSetting("m2-arch-batch", 1);

  const ctxLen = Math.round(2 ** logCtx);
  const currentBytes = kvCacheBytes(layers, kvHeads, headDim, ctxLen, batch, 2);
  const baselineBytes = kvCacheBytes(layers, KV_BASELINE_HEADS, headDim, ctxLen, batch, 2);
  const currentGB = bytesToGB(currentBytes);
  const baselineGB = bytesToGB(baselineBytes);
  const shrink = baselineBytes / currentBytes;

  const d = DETAILS[detail];

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Train a modern open-weight model and you're still minimizing next-token cross-entropy -- lesson
          1.7's loss function, unchanged. What's different is the block itself: four component swaps, each
          made for a concrete, measurable reason, separate the GPT-2 block from a current Llama-3-style
          block.
        </p>
      }
      takeaways={[
        "The training objective is essentially unchanged since GPT-2 -- next-token cross-entropy over massive text.",
        "RMSNorm replaces LayerNorm (drop mean-centering, cheaper); RoPE replaces learned absolute positions (relative-offset attention, better length generalization).",
        "SwiGLU replaces the plain GELU MLP (a learned gate, ~8/3·d hidden width); GQA replaces full multi-head attention (shared K/V heads, smaller KV cache).",
        "GQA's entire value proposition is memory: sharing K/V heads across query-head groups shrinks the KV cache proportionally, directly computed in the calculator below.",
        "Biases are typically dropped from linear layers and norms in modern blocks -- a small parameter and stability win with negligible quality cost.",
      ]}
      references={[
        {
          title: "Root Mean Square Layer Normalization — Zhang & Sennrich, 2019",
          meta: "arXiv:1910.07467 — RMSNorm",
          url: "https://arxiv.org/abs/1910.07467",
        },
        {
          title: "GLU Variants Improve Transformer — Shazeer, 2020",
          meta: "arXiv:2002.05202 — SwiGLU and other gated MLP variants",
          url: "https://arxiv.org/abs/2002.05202",
        },
        {
          title: "RoFormer: Enhanced Transformer with Rotary Position Embedding — Su et al., 2021",
          meta: "arXiv:2104.09864 — RoPE",
          url: "https://arxiv.org/abs/2104.09864",
        },
        {
          title: "GQA: Training Generalized Multi-Query Transformer Models — Ainslie et al., 2023",
          meta: "arXiv:2305.13245 — grouped-query attention",
          url: "https://arxiv.org/abs/2305.13245",
        },
      ]}
    >
      <Section title="Lab — GPT-2 block vs. Llama-3 block">
        <p>Click any row to see why that component changed.</p>
        <ScopeScreen label="Side by side comparison of a GPT-2 block and a Llama-3 style block, with clickable rows explaining each difference">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>GPT-2 BLOCK</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>LLAMA-3 BLOCK</div>
            {(Object.keys(DETAILS) as DetailKey[]).map((key) => {
              const item = DETAILS[key];
              const active = key === detail;
              const cellStyle = {
                padding: "10px 12px",
                fontSize: 12.5,
                border: `1px solid ${active ? colors.magenta : "var(--border)"}`,
                cursor: "pointer",
                background: active ? "var(--panel-2)" : "var(--panel)",
              };
              return (
                <Fragment key={key}>
                  <div style={cellStyle} onClick={() => setDetail(key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setDetail(key)}>
                    {item.gpt2}
                  </div>
                  <div style={cellStyle} onClick={() => setDetail(key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setDetail(key)}>
                    {item.llama}
                  </div>
                </Fragment>
              );
            })}
          </div>
          <div className="panel-2" style={{ padding: 14, marginTop: 12, borderLeft: `3px solid ${colors.magenta}` }}>
            <div className="mono" style={{ fontSize: 11, color: colors.magenta, marginBottom: 6 }}>{d.title}</div>
            <p style={{ margin: 0, fontSize: 13.5 }}>{d.why}</p>
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Lab — the KV-cache calculator">
        <p>
          KV-cache bytes = 2 (K and V) × layers × kv_heads × head_dim × context_length × bytes_per_element ×
          batch. Slide kv_heads down from a full 128-head baseline toward a GQA-style 8 and watch the cache
          shrink in direct proportion.
        </p>
        <ScopeScreen label="KV cache memory calculator with sliders for layers, KV heads, head dimension, context length, and batch size">
          <Slider label="LAYERS" value={layers} min={1} max={128} step={1} onChange={setLayers} />
          <Slider label="KV HEADS" value={kvHeads} min={1} max={128} step={1} onChange={setKvHeads} />
          <Slider label="HEAD DIM" value={headDim} min={32} max={256} step={8} onChange={setHeadDim} />
          <Slider label="CONTEXT LENGTH" value={logCtx} min={9} max={17} step={1} onChange={setLogCtx} format={() => ctxLen.toLocaleString()} />
          <Slider label="BATCH" value={batch} min={1} max={64} step={1} onChange={setBatch} />

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 14 }}>
            <Readout label={`KV CACHE @ ${kvHeads} HEADS`} value={`${currentGB.toFixed(2)} GB`} accent={colors.cyan} />
            <Readout label={`BASELINE @ ${KV_BASELINE_HEADS} HEADS (FULL MHA)`} value={`${baselineGB.toFixed(2)} GB`} accent={colors.muted} />
            <Readout label="SHRINK FACTOR" value={`${shrink.toFixed(1)}×`} accent={colors.green} />
          </div>
          <div className="mono" style={{ fontSize: 12, marginTop: 10, color: currentGB <= 8 ? colors.green : colors.red }}>
            {currentGB <= 8 ? "FITS" : "EXCEEDS"} your 8GB card's budget for the KV cache alone at this configuration.
          </div>
        </ScopeScreen>
      </Section>
    </LessonLayout>
  );
}
