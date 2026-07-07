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
          How does a model learn to check the weather, run code, or refuse a dangerous request? Here's
          the anticlimax: with the exact same training machinery from the last two lessons -- example
          conversations and better-vs-worse comparisons. Nothing new gets bolted onto the model. What
          changes is purely what the training conversations <em>contain</em> and what they're designed to
          teach.
        </p>
      }
      takeaways={[
        "A model can't actually fetch the weather -- it can only write a request in an agreed format. Separate software reads the request, does the real work, and pastes the result back into the conversation for the model to read. Tool use is trained by showing thousands of examples of this exchange. (An 'agent' is just this loop repeated.)",
        "In those examples, the model is graded only on its own lines -- the request and the final answer. The pasted-in tool result is something it learns to read, never to invent.",
        "Refusing harmful requests is taught through the same two stages as helpfulness -- example refusals, plus comparisons where the appropriate response beats both dangerous compliance and pointless over-refusal. Safety is not a separate system.",
        "Constitutional AI has the model critique and revise its own answers against an explicit written list of principles, so AI-generated feedback can supplement expensive human labeling.",
        "Jailbreaks work by dressing a harmful request up to look unlike anything the safety training covered -- which is why teams attack their own model continuously (red-teaming), not as a one-time check before launch.",
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
        <p>
          Step through a full exchange: the person asks, the model writes a weather request in the agreed
          format, outside software actually fetches the data and pastes it in, and the model turns it
          into a plain-language answer. Notice the labels -- the model is only trained on the turns it
          authors itself.
        </p>
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
        <p>
          Why bother with all this? Because without tools, the model still answers -- it just makes
          something up. A language model always produces fluent, confident text; fluency is no guarantee
          of truth. Flip the toggle to compare.
        </p>
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
          Learning to decline genuinely harmful requests is trained exactly the way helpfulness is:
          example conversations showing appropriate refusals, plus comparisons where the right response
          -- a safe, helpful answer, or a polite refusal when warranted -- is chosen over both dangerous
          compliance <em>and</em> pointless over-caution. That last part matters, because there's a real
          tension here: push only on safety and the model starts refusing harmless questions ("how do I
          kill a process on my computer?"); push only on helpfulness and it risks going along with
          genuinely dangerous requests. Getting that balance right is an explicit goal teams work on
          directly, not something that happens by accident.
        </p>
        <p>
          Labeling enough safe-versus-unsafe comparisons by hand is expensive, and{" "}
          <strong>Constitutional AI</strong> is one clever way around it: write out an explicit list of
          principles (a "constitution"), then have the model critique and revise its own answers against
          that list -- AI-generated feedback that supplements the human-labeled kind. And a note on{" "}
          <strong>jailbreaks</strong>, the prompts people craft to trick models past their training: they
          work by making a harmful request look unlike anything the safety examples covered -- wrapping it
          in a costume, a fictional story, an elaborate roleplay. The lesson a model learned from its
          training examples simply may not stretch to inputs that strange. That's why serious teams
          attack their own models continuously ("red-teaming"), treating safety as an ongoing practice
          rather than a box checked once before launch.
        </p>
      </Section>
    </LessonLayout>
  );
}
