/** The 22-topic syllabus: single source of truth for routing, nav order, and the home dashboard. */
export type ModuleId = 1 | 2 | 3;

export interface LessonMeta {
  module: ModuleId;
  chapter: number;
  slug: string;
  title: string;
  shortTitle: string;
}

export const syllabus: LessonMeta[] = [
  { module: 1, chapter: 1, slug: "introduction", title: "Introduction", shortTitle: "Introduction" },
  { module: 1, chapter: 2, slug: "tokenization", title: "Tokenization", shortTitle: "Tokenization" },
  { module: 1, chapter: 3, slug: "embedding-layer", title: "The Embedding Layer", shortTitle: "Embedding Layer" },
  { module: 1, chapter: 4, slug: "positional-encoding", title: "Positional Encoding", shortTitle: "Positional Encoding" },
  { module: 1, chapter: 5, slug: "attention", title: "Attention", shortTitle: "Attention" },
  { module: 1, chapter: 6, slug: "layers-of-understanding", title: "Layers of Understanding", shortTitle: "Layers of Understanding" },
  { module: 1, chapter: 7, slug: "learning-to-predict", title: "Learning to Predict", shortTitle: "Learning to Predict" },
  { module: 1, chapter: 8, slug: "instruction-tuning-rlhf-preview", title: "Instruction Tuning and RLHF (preview)", shortTitle: "Instruct + RLHF Preview" },
  { module: 1, chapter: 9, slug: "gpt2-from-scratch", title: "GPT-2 from Scratch", shortTitle: "GPT-2 from Scratch" },

  { module: 2, chapter: 1, slug: "overview", title: "Overview", shortTitle: "Overview" },
  { module: 2, chapter: 2, slug: "training-objectives-architecture", title: "Training Objectives and Architectural Details", shortTitle: "Objectives & Architecture" },
  { module: 2, chapter: 3, slug: "scaling-laws-optimization", title: "Scaling Laws and Optimization", shortTitle: "Scaling Laws" },
  { module: 2, chapter: 4, slug: "training-data-engineering", title: "Training Data Engineering", shortTitle: "Data Engineering" },
  { module: 2, chapter: 5, slug: "training-infrastructure-systems", title: "Training Infrastructure and Systems", shortTitle: "Infra & Systems" },
  { module: 2, chapter: 6, slug: "advanced-pretraining-objectives", title: "Advanced Pretraining Objectives", shortTitle: "Advanced Objectives" },
  { module: 2, chapter: 7, slug: "evaluation-during-pretraining", title: "Evaluation During Pretraining", shortTitle: "Evaluation" },
  { module: 2, chapter: 8, slug: "case-study-llama-3", title: "Case Study — LLaMA 3", shortTitle: "Case Study: LLaMA 3" },

  { module: 3, chapter: 1, slug: "overview", title: "Overview", shortTitle: "Overview" },
  { module: 3, chapter: 2, slug: "supervised-fine-tuning", title: "Supervised Fine-Tuning", shortTitle: "SFT" },
  { module: 3, chapter: 3, slug: "preference-optimization", title: "Preference Optimization", shortTitle: "Preference Optimization" },
  { module: 3, chapter: 4, slug: "tools-and-safety-tuning", title: "Tools and Safety Tuning", shortTitle: "Tools & Safety" },
  { module: 3, chapter: 5, slug: "case-study-tulu-3", title: "Case Study — Tulu 3", shortTitle: "Case Study: Tulu 3" },
];

export const TOTAL_LESSONS = syllabus.length;

export const moduleTitle: Record<ModuleId, string> = {
  1: "Architecture",
  2: "Pre-Training",
  3: "Post-Training",
};

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

export function channelLabel(l: LessonMeta): string {
  return `M${l.module} · CH${l.chapter} — ${l.title.toUpperCase()}`;
}
