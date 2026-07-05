import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(3, "tools-and-safety-tuning")!;

interface TraceStep {
  role: "user" | "assistant-call" | "tool-result" | "assistant-final";
  label: string;
  content: string;
  trained: boolean;
}

const TRACE: TraceStep[] = [
  { role: "user", label: "USER", content: "What's the weather in Tokyo right now?", trained: false },
  {
    role: "assistant-call",
    label: "ASSISTANT — FUNCTION CALL",
    content: '{"tool_call": {"name": "get_weather", "arguments": {"location": "Tokyo"}}}',
    trained: true,
  },
  { role: "tool-result", label: "TOOL RESULT (runtime-injected)", content: '{"temperature_c": 18, "condition": "cloudy"}', trained: false },
  { role: "assistant-final", label: "ASSISTANT — GROUNDED ANSWER", content: "It's 18°C and cloudy in Tokyo right now.", trained: true },
];

const ROLE_COLOR: Record<TraceStep["role"], string> = {
  user: colors.text,
  "assistant-call": colors.amber,
  "tool-result": colors.cyan,
  "assistant-final": colors.green,
};

export default function ToolsAndSafetyTuning() {
  const [stepIdx, setStepIdx] = useLabSetting("m3-tools-step", 3);
  const [grounded, setGrounded] = useLabSetting("m3-tools-grounded", true);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Tool use and safety behavior are both, mechanically, data problems layered on top of the same
          SFT and preference-optimization machinery from the last two lessons -- not new architectures or
          new loss functions. What changes is what the training data looks like and what it's designed to
          teach.
        </p>
      }
      takeaways={[
        "Tool use is trained on function-call traces: the model emits a structured call, the runtime executes it and injects the result as a special-role message, and the model continues -- an agent is just this loop iterated.",
        "Only the assistant-authored turns (the function call and the final answer) are loss-relevant; the injected tool result is context, not something the model is trained to generate.",
        "Safety tuning pushes refusal behavior through the same SFT and preference-optimization stages as helpfulness -- they are not separate systems.",
        "Constitutional AI judges and revises model outputs against an explicit written set of principles using AI feedback (RLAIF), reducing reliance on purely human-labeled harmful/harmless data.",
        "Jailbreaks are best understood as a distribution-shift problem: adversarial prompts push inputs into regions unlike anything safety training covered, which is why red-teaming and evals matter as an ongoing process, not a one-time check.",
      ]}
      references={[
        {
          title: "Toolformer: Language Models Can Teach Themselves to Use Tools — Schick et al., 2023",
          meta: "arXiv:2302.04761",
          url: "https://arxiv.org/abs/2302.04761",
        },
        {
          title: "Constitutional AI: Harmlessness from AI Feedback — Bai et al., 2022",
          meta: "arXiv:2212.08073",
          url: "https://arxiv.org/abs/2212.08073",
        },
        {
          title: "Tool Use — Anthropic Documentation",
          meta: "docs.claude.com — a practical, current reference for function-calling formats",
          url: "https://docs.claude.com/en/docs/build-with-claude/tool-use",
        },
      ]}
    >
      <Section title="Lab — a tool-call trace, step by step">
        <p>Step through the exchange. Green-labeled turns are what the model is actually trained to produce.</p>
        <ScopeScreen label="Step-through tool-call trace showing a user question, a function call, an injected tool result, and a grounded final answer">
          <div className="btn-row">
            <button type="button" className="btn" disabled={stepIdx <= 0} onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}>← PREV TURN</button>
            <button type="button" className="btn btn--primary" disabled={stepIdx >= TRACE.length - 1} onClick={() => setStepIdx(Math.min(TRACE.length - 1, stepIdx + 1))}>NEXT TURN →</button>
          </div>
          {TRACE.slice(0, stepIdx + 1).map((t, i) => (
            <div key={i} className="panel-2" style={{ padding: 10, marginTop: 8, borderLeft: `3px solid ${ROLE_COLOR[t.role]}` }}>
              <div className="mono" style={{ fontSize: 10, color: ROLE_COLOR[t.role] }}>
                {t.label} {t.trained ? "— LOSS-RELEVANT" : "— NOT TRAINED"}
              </div>
              <div className="mono" style={{ fontSize: 12.5, marginTop: 4 }}>{t.content}</div>
            </div>
          ))}
        </ScopeScreen>
      </Section>

      <Section title="Lab — grounded vs. hallucinated">
        <p>Without tool access, the same question still gets an answer -- just not necessarily a correct one.</p>
        <ScopeScreen label="Toggle between a tool-grounded weather answer and an illustrative hallucinated guess with no tool access">
          <Toggle label="TOOL ACCESS ENABLED" checked={grounded} onChange={setGrounded} />
          <div className="panel-2" style={{ padding: 14, marginTop: 10, borderLeft: `3px solid ${grounded ? colors.green : colors.red}` }}>
            <div className="mono" style={{ fontSize: 11, color: grounded ? colors.green : colors.red, marginBottom: 6 }}>
              {grounded ? "TOOL-GROUNDED ANSWER" : "NO TOOL ACCESS — ILLUSTRATIVE HALLUCINATION"}
            </div>
            <p style={{ margin: 0 }}>
              {grounded
                ? "It's 18°C and cloudy in Tokyo right now."
                : "It's probably around 20°C and partly cloudy in Tokyo today -- (a fluent, plausible-sounding guess with no actual current data behind it)."}
            </p>
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Safety tuning: the same pipeline, different data">
        <p>
          Refusal behavior for genuinely harmful requests is trained the same way helpfulness is: SFT
          demonstrations of appropriate refusals, and preference pairs where an appropriate refusal (or a
          safe, helpful answer) is "chosen" over either harmful compliance or unhelpful over-refusal. This
          creates a real, unavoidable tension -- a model tuned only for harmlessness tends to refuse far too
          much, including entirely benign requests, while one tuned only for helpfulness risks unsafe
          compliance. Getting this balance right is an explicit objective of post-training, not a side
          effect.
        </p>
        <p>
          <strong>Constitutional AI</strong> is one concrete approach to generating the preference data this
          requires without needing a human to label every single harmful/harmless comparison: a model
          critiques and revises its own outputs against an explicit, written set of principles (a
          "constitution"), and that AI-generated feedback (RLAIF, reinforcement learning from AI feedback)
          supplies additional preference pairs alongside human-labeled ones. Jailbreaks are best understood
          as a <strong>distribution-shift</strong> problem: an adversarial prompt is specifically constructed
          to look unlike anything the safety-tuning data covered, so the learned refusal behavior simply
          doesn't generalize there. This is exactly why red-teaming and evaluation are treated as an ongoing
          process throughout deployment, not a checkbox exercise completed once before shipping.
        </p>
      </Section>
    </LessonLayout>
  );
}
