/**
 * Site-wide acronym glossary, shown in the "hint" popover (GlossaryHint).
 * Terms and expansions are technical names and stay in English in both
 * languages, per the site's convention -- only category labels and chrome
 * around them are translated.
 */
import type { Lang } from "./i18n";

export interface GlossaryTerm {
  term: string;
  expansion: string;
}

export interface GlossaryCategory {
  key: string;
  label: string;
  labelId: string;
  terms: GlossaryTerm[];
}

export const glossary: GlossaryCategory[] = [
  {
    key: "core",
    label: "Core pipeline",
    labelId: "Jalur Inti",
    terms: [
      { term: `LM (as in "LM head")`, expansion: "Language Model" },
      { term: "MLP", expansion: "Multi-Layer Perceptron" },
      { term: "GPT", expansion: "Generative Pre-trained Transformer" },
      { term: "BPE", expansion: "Byte-Pair Encoding" },
      { term: `KV (as in KV-cache)`, expansion: "Key/Value" },
      { term: "GQA", expansion: "Grouped-Query Attention" },
      { term: "RoPE", expansion: "Rotary Position Embedding" },
      { term: "FLOPs", expansion: "Floating-Point Operations" },
    ],
  },
  {
    key: "post-training",
    label: "Post-training / fine-tuning",
    labelId: "Pasca-Pelatihan / Fine-Tuning",
    terms: [
      { term: "SFT", expansion: "Supervised Fine-Tuning" },
      { term: "LoRA", expansion: "Low-Rank Adaptation" },
      { term: "QLoRA", expansion: "Quantized LoRA" },
      { term: "DPO", expansion: "Direct Preference Optimization" },
      { term: "RLHF", expansion: "Reinforcement Learning from Human Feedback" },
      { term: "RLVR", expansion: "Reinforcement Learning with Verifiable Rewards" },
      { term: "PPO", expansion: "Proximal Policy Optimization" },
      { term: "IPO", expansion: "Identity Preference Optimization" },
      { term: "KTO", expansion: "Kahneman-Tversky Optimization" },
      { term: "GRPO", expansion: "Group Relative Policy Optimization" },
      { term: "FIM", expansion: "Fill-In-the-Middle" },
    ],
  },
  {
    key: "systems",
    label: "Systems",
    labelId: "Sistem",
    terms: [
      { term: "ZeRO", expansion: "Zero Redundancy Optimizer" },
      { term: "FSDP", expansion: "Fully Sharded Data Parallel" },
      { term: "MFU", expansion: "Model FLOPs Utilization" },
    ],
  },
];

export function categoryLabel(c: GlossaryCategory, lang: Lang): string {
  return lang === "id" ? c.labelId : c.label;
}
