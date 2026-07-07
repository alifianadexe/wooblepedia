import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "instruction-tuning-rlhf-preview")!;

const PROMPT = "Explain what a for-loop does.";

const BASE_CONTINUATION =
  'Explain what a for-loop does. Explain what a while-loop does. Explain what a function is. ' +
  'Explain what a variable is. In this tutorial series we will cover the fundamentals of programming ' +
  'starting from the very basics, assuming no prior knowledge...';

const INSTRUCT_CONTINUATION =
  'A for-loop repeats a block of code a set number of times (or once per item in a collection), ' +
  'automatically advancing a counter or iterator each pass -- for example, `for i in range(5):` runs ' +
  'the loop body with i equal to 0, 1, 2, 3, then 4.';

const STAGES: { label: string; desc: string; link: string | null }[] = [
  { label: "BASE MODEL", desc: "raw autocomplete engine, no idea that questions deserve answers", link: null },
  { label: "SFT", desc: "shown thousands of examples of good answers", link: "/m3/supervised-fine-tuning" },
  { label: "PREFERENCE OPT.", desc: "taught to prefer better answers over worse ones", link: "/m3/preference-optimization" },
  { label: "RL / TOOLS / SAFETY", desc: "checkable rewards, tool practice, learning to decline harm", link: "/m3/tools-and-safety-tuning" },
  { label: "DEPLOYED ASSISTANT", desc: "the model you actually talk to", link: null },
];

export default function InstructionTuningPreview() {
  const [showInstruct, setShowInstruct] = useLabSetting("m1-instruct-preview-toggle", true);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Everything so far builds toward one thing: a model that continues text the way the internet
          would continue it. And there's the catch. Ask that model "Explain what a for-loop does." and it
          might not answer at all -- it might just add <em>more questions</em>, because on the internet, a
          question like that often appears in a list of textbook exercises, and more exercises is a
          perfectly plausible continuation. Turning "plausibly continues text" into "actually answers
          you" is a whole extra phase of training. This lesson is a sneak preview; Module 3 covers it
          fully.
        </p>
      }
      takeaways={[
        "A freshly trained ('base') model is a raw autocomplete engine: it continues text plausibly, with no built-in idea that a question deserves an answer.",
        "The standard fix has three stages: first show it thousands of examples of good answers, then teach it to prefer better answers over worse ones, then polish with rewards, tool use, and safety training.",
        "The machine itself never changes through any of this -- every behavioral difference between raw autocomplete and a helpful assistant lives entirely in the learned numbers.",
        "Each stage below gets a full lesson with real, computed labs in Module 3 -- this lesson is intentionally just the map.",
      ]}
      references={[
        {
          title: "Training Language Models to Follow Instructions with Human Feedback — Ouyang et al., 2022",
          meta: "arXiv:2203.02155 — the InstructGPT paper that established this pipeline",
          url: "https://arxiv.org/abs/2203.02155",
        },
        {
          title: "Training a Helpful and Harmless Assistant with RLHF — Anthropic, 2022",
          meta: "arXiv:2204.05862 — a detailed account of the same pipeline applied at scale",
          url: "https://arxiv.org/abs/2204.05862",
        },
      ]}
    >
      <Section title="The gap between a completion engine and an assistant">
        <p>
          Nothing in the big training phase (Module 2) ever shows the model the pattern "person asks,
          assistant answers helpfully and stops." It shows the model the whole internet, where a question
          is followed by all sorts of things: more questions, a table of contents, a forum reply arguing
          that the question is dumb, or -- sometimes -- a genuinely good answer. A base model happily
          imitates <em>any</em> of those. The job of post-training is to focus its behavior onto the
          "genuinely good answer, then stop" slice, without changing the machinery at all.
        </p>
      </Section>

      <Section title="Lab — the same prompt, before and after">
        <p>
          Toggle between how a base model might continue this prompt and how an instruction-tuned model
          would respond to it. Both are typical illustrations written for this lesson, not live output
          from a running model -- the machinery that produces this difference is the real content of
          Module 3.
        </p>
        <ScopeScreen label="Toggle between an illustrative base-model continuation and an illustrative instruction-tuned response to the same prompt">
          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            PROMPT: "{PROMPT}"
          </div>
          <Toggle label="SHOW INSTRUCTION-TUNED RESPONSE" checked={showInstruct} onChange={setShowInstruct} />
          <div
            className="panel-2"
            style={{ padding: 14, marginTop: 12, borderLeft: `3px solid ${showInstruct ? colors.green : colors.red}` }}
          >
            <div className="mono" style={{ fontSize: 11, color: showInstruct ? colors.green : colors.red, marginBottom: 8 }}>
              {showInstruct ? "INSTRUCTION-TUNED MODEL" : "BASE MODEL"}
            </div>
            <p style={{ margin: 0 }}>{showInstruct ? INSTRUCT_CONTINUATION : BASE_CONTINUATION}</p>
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {showInstruct
              ? "SFT taught the model that a question-shaped prompt gets a direct, bounded answer, and preference optimization rewarded the more helpful, more concise version of that answer over rambling alternatives."
              : "The base model treats the prompt as the start of a document that looks like a programming tutorial's table of contents, and keeps generating whatever is most statistically plausible next -- which is often more questions, not an answer."}
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Three stages, previewed">
        <p>
          <strong>Supervised fine-tuning (SFT)</strong> continues training the model -- same
          guess-and-grade loop from lesson 1.7 -- but now on a carefully written collection of
          question-and-ideal-answer pairs, directly teaching it the shape of a good answer.{" "}
          <strong>Preference optimization</strong> handles qualities that are easier to judge than to
          write down: shown two responses to the same question, which is more helpful? More honest? The
          model learns from thousands of these this-one-not-that-one choices.{" "}
          <strong>Reward and safety training</strong> adds checkable rewards (did the code actually run?
          did the math actually check out?), practice at using tools, and learning to decline genuinely
          harmful requests. Click through the pipeline below -- each stage links to its full lesson in
          Module 3.
        </p>
        <ScopeScreen label="Five-stage post-training pipeline from base model to deployed assistant, each stage linking to its Module 3 lesson">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {STAGES.map((s, i) => {
              const content = (
                <div
                  className="panel"
                  style={{
                    padding: 12,
                    minWidth: 150,
                    flex: "1 1 150px",
                    borderColor: s.link ? colors.magenta : undefined,
                  }}
                >
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>STAGE {i + 1}</div>
                  <div className="mono" style={{ fontSize: 12, color: s.link ? colors.magenta : colors.text, margin: "4px 0" }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{s.desc}</div>
                </div>
              );
              return s.link ? (
                <Link key={s.label} to={s.link} style={{ textDecoration: "none", flex: "1 1 150px" }}>
                  {content}
                </Link>
              ) : (
                <div key={s.label} style={{ flex: "1 1 150px" }}>{content}</div>
              );
            })}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="The punchline">
        <p>
          Nothing about the machinery -- not the layers, not attention, not the parameter count --
          changes between a base model and the assistant built from it. Same architecture, same
          eight-stage pipeline from lesson 1.1. The entire personality transplant lives in what training
          wrote into the learned numbers during these later stages. That fact has a happy consequence:
          because post-training is small compared to pre-training, it's the part where one person with a
          modest budget can do real, measurable work. Module 3 shows you techniques that fit on rented
          hardware over a weekend, not a data-center fleet.
        </p>
      </Section>
    </LessonLayout>
  );
}
