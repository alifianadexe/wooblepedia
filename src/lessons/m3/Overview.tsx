import { useState } from "react";
import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(3, "overview")!;

interface Stage {
  key: string;
  label: string;
  link: string | null;
  detail: string;
  example: string;
}

const STAGES: Stage[] = [
  {
    key: "base",
    label: "BASE MODEL",
    link: null,
    detail: "A raw next-token predictor trained only on the pre-training objective (Module 2). No notion of \"answering\" exists yet.",
    example: 'How do I reverse a linked list? How do I reverse a string? How do I reverse an array? These are common interview questions...',
  },
  {
    key: "sft",
    label: "SFT",
    link: "/m3/supervised-fine-tuning",
    detail: "Fine-tuned on curated (prompt, ideal response) demonstrations, with loss computed only on the assistant's turns.",
    example: 'To reverse a linked list, iterate through it while re-pointing each node\'s next pointer to the previous node, using three pointers: prev, curr, and next.',
  },
  {
    key: "preference",
    label: "PREFERENCE OPT.",
    link: "/m3/preference-optimization",
    detail: "Shaped further by chosen-vs-rejected response pairs, sharpening qualities that are easier to judge than to demonstrate directly.",
    example: 'Track three pointers -- prev, curr, next. At each step: save curr.next, point curr.next to prev, then advance prev and curr. Runs in O(n) time, O(1) space.',
  },
  {
    key: "rl",
    label: "RL / TOOLS / SAFETY",
    link: "/m3/tools-and-safety-tuning",
    detail: "Layers on verifiable rewards, tool-call training, and refusal behavior for genuinely harmful requests.",
    example: '(after running the candidate code against test cases) Verified: the three-pointer approach passes all cases, including empty and single-node lists.',
  },
  {
    key: "deployed",
    label: "DEPLOYED ASSISTANT",
    link: null,
    detail: "The model you actually talk to -- same architecture as the base model throughout; every difference above lives in the weights.",
    example: 'Reverse a linked list with three pointers (prev, curr, next), re-linking each node backward as you go -- O(n) time, O(1) space. Want the code?',
  },
];

export default function Overview() {
  const [active, setActive] = useState<string>("sft");
  const activeStage = STAGES.find((s) => s.key === active)!;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          A freshly pre-trained model is a mirror of the internet: brilliant at continuing any text
          plausibly, and nearly useless as an assistant, because nothing in its training ever singled out
          "answer helpfully and stop" as the desired behavior. Post-training is the fix -- and compared to
          the trillions of tokens and months of compute behind Module 2, it is a small, surgical phase.
        </p>
      }
      takeaways={[
        "Post-training is cheap relative to pre-training -- typically a small fraction of the compute -- but responsible for essentially all the difference between a completion engine and an assistant.",
        "The standard pipeline is base → SFT → preference optimization → RL/tools/safety → deployed assistant, each stage covered in its own lesson.",
        "The architecture and forward pass never change across any stage -- every behavioral difference lives entirely in the weights.",
        "This is where an individual engineer with modest compute can genuinely compete: LoRA fine-tuning plus DPO on an 8B model is a realistic cloud-GPU weekend project, not a data-center undertaking.",
      ]}
      references={[
        {
          title: "Training Language Models to Follow Instructions with Human Feedback — Ouyang et al., 2022",
          meta: "arXiv:2203.02155 — InstructGPT, the paper that established this pipeline",
          url: "https://arxiv.org/abs/2203.02155",
        },
        {
          title: "RLHF Book — Nathan Lambert",
          meta: "rlhfbook.com — an open, continuously updated reference on this entire pipeline",
          url: "https://rlhfbook.com/",
        },
        {
          title: "Tulu 3: Pushing Frontiers in Open Language Model Post-Training — Lambert et al., 2024",
          meta: "arXiv:2411.15124 — this module's spine and lesson 3.5's case study",
          url: "https://arxiv.org/abs/2411.15124",
        },
      ]}
    >
      <Section title="Lab — five stages, one prompt">
        <p>
          Click through the pipeline. Each stage's response to the same prompt is an illustrative example of
          that stage's typical behavior, not live model output -- the pipeline mechanics, and the lessons
          behind each stage, are the real content here.
        </p>
        <ScopeScreen label="Five-stage post-training pipeline with a before-and-after strip for the same prompt at each stage">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                className="btn"
                onClick={() => setActive(s.key)}
                aria-pressed={active === s.key}
                style={{
                  borderColor: active === s.key ? colors.magenta : undefined,
                  color: active === s.key ? colors.magenta : undefined,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            PROMPT: "How do I reverse a linked list?"
          </div>

          <div className="panel-2" style={{ padding: 14, borderLeft: `3px solid ${colors.magenta}` }}>
            <div className="mono" style={{ fontSize: 11, color: colors.magenta, marginBottom: 6 }}>
              {activeStage.label} {activeStage.link && "— "}
              {activeStage.link && (
                <Link to={activeStage.link} style={{ color: colors.magenta }}>
                  full lesson →
                </Link>
              )}
            </div>
            <p style={{ margin: "0 0 10px 0", fontStyle: "italic" }}>"{activeStage.example}"</p>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{activeStage.detail}</div>
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Same architecture, different weights">
        <p>
          It's worth stating plainly because it's easy to lose track of: nothing about the transformer
          block, the attention mechanism, or the parameter count changes across any stage above. The base
          model and the deployed assistant run the identical forward pass from Module 1. Every behavioral
          difference -- helpfulness, refusals, tool use, tone -- is a fact about what gradient descent wrote
          into the weights during these later stages, not a fact about the architecture.
        </p>
      </Section>

      <Section title="Where an individual actually competes">
        <p>
          Pre-training at frontier scale requires resources far beyond an individual or small team. Post-
          training does not. LoRA (lesson 3.2) trains a small fraction of a model's parameters; DPO (lesson
          3.3) needs no separate reward model or RL rollouts. Fine-tuning and preference-optimizing an
          open 8B-parameter model with both techniques is realistically a single weekend on rented cloud
          GPUs -- which is exactly why this module, more than Module 2, is where your own hands-on practice
          should concentrate.
        </p>
      </Section>
    </LessonLayout>
  );
}
