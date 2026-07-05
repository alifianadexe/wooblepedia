import { lazy, type LazyExoticComponent, type ComponentType } from "react";

/** Registry key is `${module}/${slug}`. Every entry is code-split via React.lazy. */
export const lessonComponents: Record<string, LazyExoticComponent<ComponentType>> = {
  "1/introduction": lazy(() => import("./m1/Introduction")),
  "1/tokenization": lazy(() => import("./m1/Tokenization")),
  "1/embedding-layer": lazy(() => import("./m1/EmbeddingLayer")),
  "1/positional-encoding": lazy(() => import("./m1/PositionalEncoding")),
  "1/attention": lazy(() => import("./m1/Attention")),
  "1/layers-of-understanding": lazy(() => import("./m1/LayersOfUnderstanding")),
  "1/learning-to-predict": lazy(() => import("./m1/LearningToPredict")),
  "1/instruction-tuning-rlhf-preview": lazy(() => import("./m1/InstructionTuningPreview")),
  "1/gpt2-from-scratch": lazy(() => import("./m1/GPT2FromScratch")),

  "2/overview": lazy(() => import("./m2/Overview")),
  "2/training-objectives-architecture": lazy(() => import("./m2/TrainingObjectivesArchitecture")),
  "2/scaling-laws-optimization": lazy(() => import("./m2/ScalingLawsOptimization")),
  "2/training-data-engineering": lazy(() => import("./m2/TrainingDataEngineering")),
  "2/training-infrastructure-systems": lazy(() => import("./m2/TrainingInfrastructureSystems")),
  "2/advanced-pretraining-objectives": lazy(() => import("./m2/AdvancedPretrainingObjectives")),
  "2/evaluation-during-pretraining": lazy(() => import("./m2/EvaluationDuringPretraining")),
  "2/case-study-llama-3": lazy(() => import("./m2/CaseStudyLlama3")),

  "3/overview": lazy(() => import("./m3/Overview")),
  "3/supervised-fine-tuning": lazy(() => import("./m3/SupervisedFineTuning")),
  "3/preference-optimization": lazy(() => import("./m3/PreferenceOptimization")),
  "3/tools-and-safety-tuning": lazy(() => import("./m3/ToolsAndSafetyTuning")),
  "3/case-study-tulu-3": lazy(() => import("./m3/CaseStudyTulu3")),
};
