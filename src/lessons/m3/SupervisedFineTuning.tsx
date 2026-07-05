import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, loraTrainableParams, type LoRAModuleDims } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(3, "supervised-fine-tuning")!;

interface Turn {
  role: "system" | "user" | "assistant";
  tag: string;
  text: string;
}

const CONVERSATION: Turn[] = [
  { role: "system", tag: "<|system|>", text: "You are a helpful assistant." },
  { role: "user", tag: "<|user|>", text: "What's 2+2?" },
  { role: "assistant", tag: "<|assistant|>", text: "2+2 equals 4." },
  { role: "user", tag: "<|user|>", text: "And 3+3?" },
  { role: "assistant", tag: "<|assistant|>", text: "3+3 equals 6." },
];

const N_FULL_8B = 8.03e9;
const N_LAYERS = 32;

const MODULES: (LoRAModuleDims & { group: string })[] = [
  { name: "q_proj", dIn: 4096, dOut: 4096, group: "attention" },
  { name: "k_proj", dIn: 4096, dOut: 1024, group: "attention" },
  { name: "v_proj", dIn: 4096, dOut: 1024, group: "attention" },
  { name: "o_proj", dIn: 4096, dOut: 4096, group: "attention" },
  { name: "gate_proj", dIn: 4096, dOut: 14336, group: "mlp" },
  { name: "up_proj", dIn: 4096, dOut: 14336, group: "mlp" },
  { name: "down_proj", dIn: 14336, dOut: 4096, group: "mlp" },
];

export default function SupervisedFineTuning() {
  const [maskOn, setMaskOn] = useLabSetting("m3-sft-mask", true);
  const [rank, setRank] = useLabSetting("m3-sft-rank", 16);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    q_proj: true, k_proj: true, v_proj: true, o_proj: true, gate_proj: false, up_proj: false, down_proj: false,
  });

  const activeModules = MODULES.filter((m) => selected[m.name]);
  const perLayerParams = loraTrainableParams(rank, activeModules);
  const totalTrainable = perLayerParams * N_LAYERS;
  const pctOfFull = (totalTrainable / N_FULL_8B) * 100;

  const qloraGB = useMemo(() => {
    const baseWeights4bit = N_FULL_8B * 0.5; // 4-bit quantized base
    const adapterTraining = totalTrainable * 16; // AdamW on just the adapters, fp32 moments etc.
    return bytesToGB(baseWeights4bit + adapterTraining);
  }, [totalTrainable]);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Supervised fine-tuning reuses lesson 1.7's exact machinery -- cross-entropy loss, forward pass,
          backward pass, optimizer step -- and points it at a different, much smaller dataset: curated
          conversations instead of raw internet text. The mechanism doesn't change; what changes is what the
          model is shown, and, critically, which tokens it's actually graded on.
        </p>
      }
      takeaways={[
        "SFT is ordinary next-token cross-entropy applied to curated (prompt, ideal response) conversations, not a new loss function.",
        "A chat template wraps each turn in special tokens (e.g. <|user|>, <|assistant|>) so the model can condition on conversational structure, not just raw text.",
        "The loss mask restricts gradients to assistant-turn tokens only -- the model is trained to produce good answers, not to imitate user messages or system prompts.",
        "LIMA's result (a small, extremely high-quality dataset outperforming much larger, noisier ones) is the empirical case for data quality over quantity in SFT specifically.",
        "LoRA freezes the base weights and learns a low-rank update ΔW = B·A per targeted matrix; QLoRA adds 4-bit base-weight quantization on top, which is what makes fine-tuning an 8B+ model realistic on an 8GB card.",
      ]}
      references={[
        {
          title: "LIMA: Less Is More for Alignment — Zhou et al., 2023",
          meta: "arXiv:2305.11206 — the data-quality-over-quantity result referenced above",
          url: "https://arxiv.org/abs/2305.11206",
        },
        {
          title: "LoRA: Low-Rank Adaptation of Large Language Models — Hu et al., 2021",
          meta: "arXiv:2106.09685",
          url: "https://arxiv.org/abs/2106.09685",
        },
        {
          title: "QLoRA: Efficient Finetuning of Quantized LLMs — Dettmers et al., 2023",
          meta: "arXiv:2305.14314",
          url: "https://arxiv.org/abs/2305.14314",
        },
        {
          title: "Tulu 3 — SFT mixture section",
          meta: "arXiv:2411.15124 — a fully documented real SFT data mixture",
          url: "https://arxiv.org/abs/2411.15124",
        },
      ]}
    >
      <Section title="Lab — the template and mask microscope">
        <p>
          Toggle the loss mask to see exactly which tokens the model is actually trained on -- everything
          else, including the special structural tokens and the user's own messages, is part of the input
          context but contributes no gradient.
        </p>
        <ScopeScreen label="Chat template with special tokens, and a loss mask toggle dimming everything except assistant response tokens">
          <Toggle label="APPLY LOSS MASK (train on assistant tokens only)" checked={maskOn} onChange={setMaskOn} />
          <div style={{ marginTop: 12, lineHeight: 2.2 }}>
            {CONVERSATION.map((turn, i) => {
              const dim = maskOn && turn.role !== "assistant";
              return (
                <div key={i} style={{ opacity: dim ? 0.3 : 1 }}>
                  <span className="token-chip" style={{ color: colors.amber, borderColor: colors.amber }}>{turn.tag}</span>{" "}
                  <span style={{ background: !dim && turn.role === "assistant" ? "rgba(140,224,95,0.12)" : undefined, padding: "2px 4px", borderRadius: 3 }}>
                    {turn.text}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {maskOn ? "Only the highlighted assistant text contributes to the loss." : "Mask off: every token in the sequence would contribute to the loss, including the user's own messages."}
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Data quality over quantity">
        <p>
          LIMA's central result is that roughly a thousand extremely carefully curated (prompt, response)
          pairs produced a model competitive with ones trained on orders of magnitude more, noisier
          demonstration data. For SFT specifically -- where the goal is teaching the *shape* of a good
          answer, not new world knowledge -- a small, consistent, high-quality dataset routinely beats a
          large messy one. Multi-turn conversations are typically packed together (several conversations
          concatenated into one training sequence, separated by the template's turn boundaries) purely for
          training efficiency, with the loss mask making sure that packing never blurs across conversations.
        </p>
      </Section>

      <Section title="Lab — the LoRA budget console">
        <p>
          Rather than updating every weight, LoRA freezes the base matrix W and learns a low-rank update{" "}
          <code>ΔW = B·A</code> (B is d_out×r, A is r×d_in), so trainable parameters per targeted matrix are{" "}
          <code>r·(d_in + d_out)</code>. Pick a rank and which matrices to target on an 8B-parameter,
          32-layer Llama-style config.
        </p>
        <ScopeScreen label="LoRA trainable parameter budget console with rank slider, target module checkboxes, and QLoRA memory estimate">
          <Slider label="RANK r" value={rank} min={1} max={256} step={1} onChange={setRank} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "10px 0" }}>
            {MODULES.map((m) => (
              <Toggle
                key={m.name}
                label={`${m.name} (${m.group})`}
                checked={!!selected[m.name]}
                onChange={(v) => setSelected({ ...selected, [m.name]: v })}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
            <Readout label="TRAINABLE PARAMS (all 32 layers)" value={`${(totalTrainable / 1e6).toFixed(2)}M`} accent={colors.cyan} />
            <Readout label="% OF FULL 8B MODEL" value={`${pctOfFull.toFixed(3)}%`} accent={colors.green} />
            <Readout label="QLoRA ESTIMATED MEMORY" value={`${qloraGB.toFixed(2)} GB`} accent={qloraGB <= 8 ? colors.green : colors.red} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            QLoRA estimate = 4-bit quantized base weights (0.5 bytes/param) + full-precision AdamW training
            memory on just the adapter parameters -- excludes activations.
          </p>
        </ScopeScreen>
      </Section>
    </LessonLayout>
  );
}
