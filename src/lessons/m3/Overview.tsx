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
    detail: "A raw next-token guesser straight out of Module 2's training. No idea that questions deserve answers.",
    example: 'How do I reverse a linked list? How do I reverse a string? How do I reverse an array? These are common interview questions...',
  },
  {
    key: "sft",
    label: "SFT",
    link: "/m3/supervised-fine-tuning",
    detail: "Trained on a curated collection of questions paired with ideal answers -- and graded only on the answer parts.",
    example: 'To reverse a linked list, iterate through it while re-pointing each node\'s next pointer to the previous node, using three pointers: prev, curr, and next.',
  },
  {
    key: "preference",
    label: "PREFERENCE OPT.",
    link: "/m3/preference-optimization",
    detail: "Shaped further by better-vs-worse answer comparisons -- sharpening qualities that are easier to judge than to write down.",
    example: 'Track three pointers -- prev, curr, next. At each step: save curr.next, point curr.next to prev, then advance prev and curr. Runs in O(n) time, O(1) space.',
  },
  {
    key: "rl",
    label: "RL / TOOLS / SAFETY",
    link: "/m3/tools-and-safety-tuning",
    detail: "Adds checkable rewards (did the code actually run?), practice using tools, and learning to decline genuinely harmful requests.",
    example: '(after running the candidate code against test cases) Verified: the three-pointer approach passes all cases, including empty and single-node lists.',
  },
  {
    key: "deployed",
    label: "DEPLOYED ASSISTANT",
    link: null,
    detail: "The model you actually talk to -- the same machine as the base model; every difference above lives in the learned numbers.",
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
          plausibly, and nearly useless as an assistant, because nothing in its training ever singled
          out "answer the person helpfully, then stop" as the goal. Post-training is the fix. Think of
          pre-training as twelve years of school and post-training as a short, intense job-training
          course afterward -- tiny by comparison, but it's what turns raw knowledge into someone you'd
          actually want to work with.
        </p>
      }
      takeaways={[
        "Post-training costs a tiny fraction of pre-training -- yet it's responsible for essentially all the difference between raw autocomplete and a helpful assistant.",
        "The standard pipeline: base model → learn from example answers (SFT) → learn from better-vs-worse comparisons → rewards, tools, and safety → the deployed assistant. Each stage has its own lesson.",
        "The machine never changes at any stage -- every difference in behavior lives entirely in the learned numbers.",
        "This is the part of the field where one person with a modest budget can genuinely contribute: fine-tuning a mid-sized open model with this module's techniques is a weekend project on rented hardware, not a data-center undertaking.",
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

      <Section title="Same machine, different numbers">
        <p>
          It's worth stating plainly because it's easy to lose track of: nothing about the model's
          machinery -- not the layers, not attention, not the parameter count -- changes across any stage
          above. The base model and the deployed assistant are the identical machine from Module 1. Every
          difference in behavior -- helpfulness, declining harmful requests, using tools, tone of voice --
          comes from what training wrote into the learned numbers during these later stages. Personality
          is data, not hardware.
        </p>
      </Section>

      <Section title="Where an individual actually competes">
        <p>
          Pre-training at the frontier takes resources far beyond any individual or small team.
          Post-training does not. LoRA (lesson 3.2) trains only a tiny add-on instead of the whole model;
          DPO (lesson 3.3) learns from answer comparisons without any of the heavyweight machinery that
          used to be required. Fine-tuning an open mid-sized model with both techniques is realistically
          a single weekend on rented cloud hardware -- which is exactly why this module, more than Module
          2, is where your own hands-on practice should concentrate.
        </p>
      </Section>
    </LessonLayout>
  );
}
