/** The 22-topic syllabus: single source of truth for routing, nav order, and the home dashboard. */
import type { Lang } from "./i18n";

export type ModuleId = 1 | 2 | 3;

export interface LessonMeta {
  module: ModuleId;
  chapter: number;
  slug: string;
  title: string;
  /** Indonesian display title; slug/routing always stays English. */
  titleId: string;
  shortTitle: string;
  /** Indonesian short label, used for the compact journey-path nodes. */
  shortTitleId: string;
}

export const syllabus: LessonMeta[] = [
  { module: 1, chapter: 1, slug: "introduction", title: "Introduction", titleId: "Pengantar", shortTitle: "Introduction", shortTitleId: "Pengantar" },
  { module: 1, chapter: 2, slug: "tokenization", title: "Tokenization", titleId: "Tokenization", shortTitle: "Tokenization", shortTitleId: "Tokenization" },
  { module: 1, chapter: 3, slug: "embedding-layer", title: "The Embedding Layer", titleId: "Lapisan Embedding", shortTitle: "Embedding Layer", shortTitleId: "Lapisan Embedding" },
  { module: 1, chapter: 4, slug: "positional-encoding", title: "Positional Encoding", titleId: "Positional Encoding", shortTitle: "Positional Encoding", shortTitleId: "Positional Encoding" },
  { module: 1, chapter: 5, slug: "attention", title: "Attention", titleId: "Attention", shortTitle: "Attention", shortTitleId: "Attention" },
  { module: 1, chapter: 6, slug: "layers-of-understanding", title: "Layers of Understanding", titleId: "Lapisan-Lapisan Pemahaman", shortTitle: "Layers of Understanding", shortTitleId: "Lapisan Pemahaman" },
  { module: 1, chapter: 7, slug: "learning-to-predict", title: "Learning to Predict", titleId: "Belajar Memprediksi", shortTitle: "Learning to Predict", shortTitleId: "Belajar Prediksi" },
  { module: 1, chapter: 8, slug: "instruction-tuning-rlhf-preview", title: "Instruction Tuning and RLHF (preview)", titleId: "Instruction Tuning dan RLHF (pratinjau)", shortTitle: "Instruct + RLHF Preview", shortTitleId: "Pratinjau Instruct + RLHF" },
  { module: 1, chapter: 9, slug: "gpt2-from-scratch", title: "GPT-2 from Scratch", titleId: "GPT-2 dari Nol", shortTitle: "GPT-2 from Scratch", shortTitleId: "GPT-2 dari Nol" },

  { module: 2, chapter: 1, slug: "overview", title: "Overview", titleId: "Ikhtisar", shortTitle: "Overview", shortTitleId: "Ikhtisar" },
  { module: 2, chapter: 2, slug: "training-objectives-architecture", title: "Training Objectives and Architectural Details", titleId: "Tujuan Pelatihan dan Detail Arsitektur", shortTitle: "Objectives & Architecture", shortTitleId: "Tujuan & Arsitektur" },
  { module: 2, chapter: 3, slug: "scaling-laws-optimization", title: "Scaling Laws and Optimization", titleId: "Scaling Laws dan Optimisasi", shortTitle: "Scaling Laws", shortTitleId: "Scaling Laws" },
  { module: 2, chapter: 4, slug: "training-data-engineering", title: "Training Data Engineering", titleId: "Rekayasa Data Pelatihan", shortTitle: "Data Engineering", shortTitleId: "Rekayasa Data" },
  { module: 2, chapter: 5, slug: "training-infrastructure-systems", title: "Training Infrastructure and Systems", titleId: "Infrastruktur dan Sistem Pelatihan", shortTitle: "Infra & Systems", shortTitleId: "Infra & Sistem" },
  { module: 2, chapter: 6, slug: "advanced-pretraining-objectives", title: "Advanced Pretraining Objectives", titleId: "Tujuan Pra-Pelatihan Lanjutan", shortTitle: "Advanced Objectives", shortTitleId: "Tujuan Lanjutan" },
  { module: 2, chapter: 7, slug: "evaluation-during-pretraining", title: "Evaluation During Pretraining", titleId: "Evaluasi Selama Pra-Pelatihan", shortTitle: "Evaluation", shortTitleId: "Evaluasi" },
  { module: 2, chapter: 8, slug: "case-study-llama-3", title: "Case Study — LLaMA 3", titleId: "Studi Kasus — LLaMA 3", shortTitle: "Case Study: LLaMA 3", shortTitleId: "Studi Kasus: LLaMA 3" },

  { module: 3, chapter: 1, slug: "overview", title: "Overview", titleId: "Ikhtisar", shortTitle: "Overview", shortTitleId: "Ikhtisar" },
  { module: 3, chapter: 2, slug: "supervised-fine-tuning", title: "Supervised Fine-Tuning", titleId: "Supervised Fine-Tuning", shortTitle: "SFT", shortTitleId: "SFT" },
  { module: 3, chapter: 3, slug: "preference-optimization", title: "Preference Optimization", titleId: "Optimisasi Preferensi", shortTitle: "Preference Optimization", shortTitleId: "Optimisasi Preferensi" },
  { module: 3, chapter: 4, slug: "tools-and-safety-tuning", title: "Tools and Safety Tuning", titleId: "Tuning Alat dan Keamanan", shortTitle: "Tools & Safety", shortTitleId: "Alat & Keamanan" },
  { module: 3, chapter: 5, slug: "case-study-tulu-3", title: "Case Study — Tulu 3", titleId: "Studi Kasus — Tulu 3", shortTitle: "Case Study: Tulu 3", shortTitleId: "Studi Kasus: Tulu 3" },
];

export const TOTAL_LESSONS = syllabus.length;

export const moduleTitle: Record<ModuleId, string> = {
  1: "Architecture",
  2: "Pre-Training",
  3: "Post-Training",
};

export const moduleTitleId: Record<ModuleId, string> = {
  1: "Arsitektur",
  2: "Pra-Pelatihan",
  3: "Pasca-Pelatihan",
};

export function moduleTitleFor(module: ModuleId, lang: Lang): string {
  return lang === "id" ? moduleTitleId[module] : moduleTitle[module];
}

export function lessonTitle(l: LessonMeta, lang: Lang): string {
  return lang === "id" ? l.titleId : l.title;
}

export function lessonShortTitle(l: LessonMeta, lang: Lang): string {
  return lang === "id" ? l.shortTitleId : l.shortTitle;
}

export function lessonsByModule(module: ModuleId): LessonMeta[] {
  return syllabus.filter((l) => l.module === module);
}

export function getLessonMeta(module: ModuleId, slug: string): LessonMeta | undefined {
  return syllabus.find((l) => l.module === module && l.slug === slug);
}

function getLessonIndex(module: ModuleId, slug: string): number {
  return syllabus.findIndex((l) => l.module === module && l.slug === slug);
}

export function getPrevLesson(module: ModuleId, slug: string): LessonMeta | null {
  const idx = getLessonIndex(module, slug);
  return idx > 0 ? syllabus[idx - 1] : null;
}

export function getNextLesson(module: ModuleId, slug: string): LessonMeta | null {
  const idx = getLessonIndex(module, slug);
  return idx >= 0 && idx < syllabus.length - 1 ? syllabus[idx + 1] : null;
}

export function lessonPath(l: Pick<LessonMeta, "module" | "slug">): string {
  return `/m${l.module}/${l.slug}`;
}

export function channelLabel(l: LessonMeta, lang: Lang = "en"): string {
  return `M${l.module} · CH${l.chapter} — ${lessonTitle(l, lang).toUpperCase()}`;
}
