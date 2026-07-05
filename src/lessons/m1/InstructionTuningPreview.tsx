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
  { label: "BASE MODEL", desc: "raw next-token completion engine, no notion of \"answering\"", link: null },
  { label: "SFT", desc: "trained on (prompt, ideal response) demonstrations", link: "/m3/supervised-fine-tuning" },
  { label: "PREFERENCE OPT.", desc: "shaped further by chosen vs. rejected response pairs", link: "/m3/preference-optimization" },
  { label: "RL / TOOLS / SAFETY", desc: "verifiable rewards, tool-call training, refusal tuning", link: "/m3/tools-and-safety-tuning" },
  { label: "DEPLOYED ASSISTANT", desc: "the model you actually talk to", link: null },
];

export default function InstructionTuningPreview() {
  const [showInstruct, setShowInstruct] = useLabSetting("m1-instruct-preview-toggle", true);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Every lesson so far builds toward one destination: a model that predicts the next token of
          whatever text distribution it was trained on. Point that model at "Explain what a for-loop does."
          and, left to its own devices, it may just as happily continue with more textbook-style questions
          as it would answer yours -- because in its training data, questions are often followed by more
          questions. This lesson is a preview of the fix; Module 3 is the full treatment.
        </p>
      }
      takeaways={[
        "A freshly pre-trained ('base') model is a raw completion engine: it continues text plausibly, with no built-in notion that a prompt phrased as a question should be answered directly.",
        "The standard fix is three stages: supervised fine-tuning on curated demonstrations, preference optimization from chosen/rejected response pairs, then RL-style refinement (verifiable rewards, tool use, safety tuning).",
        "The architecture never changes across any of this -- every behavioral difference between a base model and an assistant lives entirely in the weights.",
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
          Nothing about pre-training (Module 2) ever shows a model the shape "user asks, assistant answers
          helpfully and stops." It shows the model the entire internet's distribution of text, in which
          question-shaped text is followed by all sorts of things: more questions, a table of contents, a
          forum reply arguing with the premise, or -- sometimes -- a genuinely good answer. A base model
          samples from that whole distribution. Post-training's job is to concentrate its behavior onto the
          "genuinely good answer, then stop" slice, without touching the architecture at all.
        </p>
      </Section>

      <Section title="Lab — the same prompt, before and after">
        <p>
          Toggle between a plausible base-model continuation and a plausible instruction-tuned response to
          the identical prompt. Both are illustrative examples of the two regimes' typical behavior, not
          output from a running model -- the mechanics that produce this difference are the real content of
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
          <strong>Supervised fine-tuning (SFT)</strong> retrains the model, with the same cross-entropy loss
          from lesson 1.7, on curated (prompt, ideal response) pairs -- teaching the shape of a good answer
          directly. <strong>Preference optimization</strong> goes further: for qualities that are easier to
          judge than to demonstrate (is this response more helpful? more honest?), it trains on pairs of
          chosen versus rejected responses instead. <strong>RL and safety tuning</strong> layers on
          verifiable rewards (did the code run? did the math check out?), tool-use training, and refusal
          behavior for genuinely harmful requests. Click through the pipeline below -- each stage links to
          its full lesson in Module 3.
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
          Nothing about the transformer block, the attention mechanism, or the parameter count changes
          between a base model and the assistant built on top of it. Same architecture, same forward pass,
          same eight-stage pipeline from lesson 1.1 -- the entire behavioral transformation lives in what
          gradient descent wrote into the weights during these later stages. That fact is also why
          post-training is where a single engineer with modest compute can make real, measurable progress:
          Module 3 shows you LoRA and DPO runs that fit on rented GPUs over a weekend, not a data-center
          fleet.
        </p>
      </Section>
    </LessonLayout>
  );
}
