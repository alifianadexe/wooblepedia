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
          Next-token prediction is the load-bearing objective, but it isn't the only signal a pre-training
          run extracts from the same text. This lesson covers four variations layered on top of it -- each
          still fundamentally a causal, left-to-right model, just fed cleverly rearranged or augmented data.
        </p>
      }
      takeaways={[
        "Fill-in-the-middle (FIM) rearranges a document into prefix/suffix/middle order with sentinel tokens, teaching an otherwise strictly left-to-right model to infill -- essential for code-editing use cases.",
        "Multi-token prediction adds extra output heads that predict t+2, t+3, ... alongside the standard t+1 head, giving a denser training signal and later enabling speculative decoding.",
        "Long-context extension typically trains at a short context first, then extends via RoPE theta scaling or position interpolation and a short continued-training phase at the new length.",
        "Curriculum and annealing schedule the highest-quality data toward the end of training, when the model is most able to make full use of it.",
        "UL2-style span corruption (masking random spans, often bidirectionally) is a related but distinct family from FIM -- FIM stays strictly causal by reordering text, span corruption changes the attention pattern itself.",
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
          Pick a "middle" span inside the snippet below. The lab shows the literal training sequence the
          model actually sees -- prefix and suffix swapped to the front, sentinel tokens marking each part,
          and the middle moved to the end, which is exactly what the model is trained (in causal,
          left-to-right fashion) to predict.
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
            The highlighted region after &lt;MID&gt; is the loss region -- the only part the model is
            actually trained to generate; everything before it is context it conditions on.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Lab — one head or four">
        <p>
          Standard training attaches one output head that predicts token t+1. Multi-token prediction
          attaches several extra heads, each predicting further ahead (t+2, t+3, t+4) from the same
          position's hidden state -- more learning signal per position, and later, at inference time, a
          mechanism for proposing several tokens at once and verifying them cheaply (speculative decoding).
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
          Training at a very long context from step one is expensive -- attention cost grows with sequence
          length, so most runs train the bulk of pre-training at a shorter context (e.g. 4K-8K tokens) and
          extend afterward. Two common mechanisms: scaling RoPE's base frequency ("theta scaling") so the
          same rotation angles cover a longer range, or position interpolation, which compresses long-context
          positions back into the range the model was originally trained on. Either way, extension is
          followed by a comparatively short continued-training phase at the new, longer length.
        </p>
        <p>
          Curriculum and annealing are scheduling decisions, not architectural ones: many training recipes
          deliberately hold back their highest-quality data (heavily filtered web text, textbooks, curated
          instruction-like data) for the final portion of training, when the model is best positioned to
          make full use of it, rather than mixing it in uniformly from the start. Separately, it's worth
          knowing this course's FIM and multi-token objectives are not the only game in town: UL2-style{" "}
          <strong>span corruption</strong> masks random spans in a document and trains the model to fill
          them in, often in a prefix-LM or encoder-decoder setup that isn't strictly causal token-by-token.
          FIM, by contrast, never changes the attention pattern at all -- it just reorders the text so a
          strictly causal, decoder-only model can still learn to infill.
        </p>
      </Section>
    </LessonLayout>
  );
}
