import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { fimRearrange } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(2, "advanced-pretraining-objectives")!;

const SNIPPET = "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)";

const SEQ_TOKENS = ["The", "cat", "sat", "on", "the", "mat", "and", "slept"];

export default function AdvancedPretrainingObjectives() {
  const [midStart, setMidStart] = useLabSetting("m2-fim-start", 18);
  const [midEnd, setMidEnd] = useLabSetting("m2-fim-end", 40);
  const [multiToken, setMultiToken] = useLabSetting("m2-multitoken", true);

  const start = Math.min(midStart, midEnd - 1);
  const end = Math.max(midEnd, midStart + 1);
  const prefix = SNIPPET.slice(0, start);
  const middle = SNIPPET.slice(start, end);
  const suffix = SNIPPET.slice(end);
  const fim = fimRearrange(prefix, middle, suffix);

  const currentPos = 3;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          "Guess the next token" is the main exercise, but it's not the only drill a training run can
          extract from the same text. This lesson covers four extra drills layered on top of it. The key
          thing to notice: none of them change the machine. The model stays a strict left-to-right
          guesser -- the cleverness is entirely in how the practice material gets rearranged before it's
          fed in.
        </p>
      }
      takeaways={[
        "Fill-in-the-middle (FIM): cut a chunk out of a document, move it to the end, and mark the pieces with special tokens. A strict left-to-right guesser thereby learns to fill in holes -- essential for code editors that complete the middle of your file.",
        "Multi-token prediction: instead of only guessing the very next token, extra prediction heads also guess two, three, and four ahead -- more learning from every position, and a speed trick at generation time later.",
        "Long texts are handled in two phases: train mostly on shorter texts (cheaper), then stretch the position encoding and briefly continue training at the new, longer length.",
        "Curriculum: save the best-quality reading material for the end of training, when the model is best prepared to benefit from it -- the way a course saves its capstone for last.",
        "A related family called span corruption also teaches hole-filling but changes how the model reads; FIM's charm is that it never touches the machine -- it only rearranges the text.",
      ]}
      references={[
        {
          title: "Efficient Training of Language Models to Fill in the Middle — Bavarian et al., 2022",
          meta: "arXiv:2207.14255 — FIM",
          url: "https://arxiv.org/abs/2207.14255",
        },
        {
          title: "Better & Faster Large Language Models via Multi-token Prediction — Gloeckle et al., 2024",
          meta: "arXiv:2404.19737",
          url: "https://arxiv.org/abs/2404.19737",
        },
        {
          title: "Extending Context Window of Large Language Models via Positional Interpolation — Chen et al., 2023",
          meta: "arXiv:2306.15595",
          url: "https://arxiv.org/abs/2306.15595",
        },
      ]}
    >
      <Section title="Lab — fill-in-the-middle, literally rearranged">
        <p>
          Here's the puzzle FIM solves: a left-to-right guesser can only continue text at the end, but a
          programmer's cursor is usually in the <em>middle</em> of a file. The fix is delightfully
          simple -- rearrange the training text. Cut out a middle chunk, put the beginning and the ending
          first (labeled with special marker tokens), and stick the missing middle at the end. Now
          "filling the hole" <em>is</em> "continuing at the end," which the model already knows how to
          do. Drag the sliders to choose the cut-out chunk and see the exact rearranged sequence the
          model would train on.
        </p>
        <ScopeScreen label="Fill-in-the-middle training sequence rearrangement lab">
          <pre className="mono" style={{ fontSize: 12.5, margin: 0, whiteSpace: "pre-wrap" }}>
            <span style={{ color: colors.muted }}>{prefix}</span>
            <span style={{ background: "rgba(232,106,166,0.25)", color: colors.magenta }}>{middle}</span>
            <span style={{ color: colors.muted }}>{suffix}</span>
          </pre>
          <Slider label="MIDDLE START (char index)" value={start} min={0} max={SNIPPET.length - 1} step={1} onChange={setMidStart} />
          <Slider label="MIDDLE END (char index)" value={end} min={1} max={SNIPPET.length} step={1} onChange={setMidEnd} />

          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", margin: "12px 0 4px" }}>REARRANGED TRAINING SEQUENCE:</div>
          <pre className="mono" style={{ fontSize: 12.5, margin: 0, whiteSpace: "pre-wrap", padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6 }}>
            <span style={{ color: colors.amber }}>&lt;PRE&gt;</span> {prefix}{" "}
            <span style={{ color: colors.cyan }}>&lt;SUF&gt;</span> {suffix}{" "}
            <span style={{ color: colors.magenta }}>&lt;MID&gt;</span>{" "}
            <span style={{ background: "rgba(232,106,166,0.25)", color: colors.magenta }}>{middle}</span>
          </pre>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Only the highlighted part after &lt;MID&gt; gets graded -- that's what the model practices
            producing. Everything before it is just context to read.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Lab — one head or four">
        <p>
          Normally the model makes one guess per position: the very next token. Multi-token prediction
          bolts on extra guessing heads that simultaneously predict two, three, and four tokens ahead
          from the same spot -- like a chess student asked to name the next several moves, not just one.
          The model learns more from every position, and the extra heads pay off again later: at
          generation time they can propose several tokens at once for quick checking, a speed trick
          called speculative decoding.
        </p>
        <ScopeScreen label="Diagram comparing single-token and multi-token prediction heads from the same position">
          <Toggle label="SHOW MULTI-TOKEN PREDICTION (4 HEADS)" checked={multiToken} onChange={setMultiToken} />
          <svg viewBox="0 0 320 90" width="100%" height="100" aria-label={multiToken ? "Four prediction heads from the current position, predicting t+1 through t+4" : "One prediction head from the current position, predicting only t+1"}>
            {SEQ_TOKENS.map((t, i) => (
              <g key={i}>
                <circle cx={20 + i * 38} cy={70} r={i === currentPos ? 7 : 5} fill={i === currentPos ? colors.amber : colors.cyan} />
                <text x={20 + i * 38} y={86} fontSize={9} fontFamily="monospace" fill={colors.text} textAnchor="middle">{t}</text>
              </g>
            ))}
            {(multiToken ? [1, 2, 3, 4] : [1]).map((k) => {
              const x1 = 20 + currentPos * 38;
              const x2 = 20 + (currentPos + k) * 38;
              if (currentPos + k >= SEQ_TOKENS.length) return null;
              return (
                <path
                  key={k}
                  d={`M ${x1} 60 Q ${(x1 + x2) / 2} ${20 - k * 3} ${x2} 60`}
                  fill="none"
                  stroke={colors.green}
                  strokeWidth={1.5}
                  markerEnd="url(#mtpArrow)"
                />
              );
            })}
            <defs>
              <marker id="mtpArrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <circle cx="3" cy="3" r="2" fill={colors.green} />
              </marker>
            </defs>
          </svg>
        </ScopeScreen>
      </Section>

      <Section title="Long context, curriculum, and a nod to span corruption">
        <p>
          Training on very long texts from day one is expensive -- the attention step's cost grows fast
          with text length. So most runs do the bulk of training on shorter texts (a few thousand tokens)
          and stretch afterward. Remember RoPE from lesson 1.4, which encodes position by rotating each
          word's numbers? Stretching mostly means adjusting those rotation angles so the same range of
          angles covers a longer stretch of text -- like re-marking a ruler so the same physical length
          now measures a longer distance -- followed by a short extra phase of training at the new
          length so the model gets used to it.
        </p>
        <p>
          <strong>Curriculum</strong> is a scheduling decision, not a machinery change: many training
          recipes deliberately hold back their best material -- carefully filtered text, textbooks,
          question-and-answer style data -- for the final stretch of training, when the model has the
          foundation to actually profit from it. Same logic as a school curriculum: calculus goes after
          algebra. One last cousin worth knowing by name: <strong>span corruption</strong> also teaches
          hole-filling by blanking out random chunks, but it changes how the model is allowed to read the
          text. FIM's whole appeal is that it doesn't -- it just shuffles the text and lets the ordinary
          left-to-right machine do the rest.
        </p>
      </Section>
    </LessonLayout>
  );
}
