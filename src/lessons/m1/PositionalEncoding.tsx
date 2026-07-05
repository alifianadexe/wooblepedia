import { useEffect, useMemo, useRef } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { buildSinusoidalPEMatrix, sinusoidalPE } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(1, "positional-encoding")!;

const D_MODEL = 64;
const NUM_POSITIONS = 128;
const MATRIX = buildSinusoidalPEMatrix(NUM_POSITIONS, D_MODEL);

function divergeColor(v: number): string {
  const t = Math.min(1, Math.abs(v));
  return v >= 0 ? `rgba(255,180,84,${0.12 + 0.85 * t})` : `rgba(62,219,211,${0.12 + 0.85 * t})`;
}

function PEHeatmap({ highlightPos }: { highlightPos: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cellW = canvas.width / NUM_POSITIONS;
    const cellH = canvas.height / D_MODEL;
    for (let pos = 0; pos < NUM_POSITIONS; pos++) {
      for (let d = 0; d < D_MODEL; d++) {
        ctx.fillStyle = divergeColor(MATRIX[pos][d]);
        ctx.fillRect(pos * cellW, d * cellH, cellW + 0.6, cellH + 0.6);
      }
    }
    // highlight column for the selected position
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(highlightPos * cellW, 0, cellW, canvas.height);
  }, [highlightPos]);

  return (
    <canvas
      ref={canvasRef}
      width={NUM_POSITIONS * 3}
      height={D_MODEL * 4}
      role="img"
      aria-label="Heatmap of the sinusoidal positional encoding matrix across 128 positions (horizontal) and 64 dimensions (vertical), amber for positive values and cyan for negative"
      style={{ width: "100%", height: "auto", imageRendering: "pixelated", display: "block" }}
    />
  );
}

const BASE_EMBED = [0.9, 0.1, 0.0, 0.2, 0.5, 0.3, 0.1, 0.6];

export default function PositionalEncoding() {
  const [position, setPosition] = useLabSetting("m1-pe-position", 4);
  const [compareOn, setCompareOn] = useLabSetting("m1-pe-compare", true);

  const rowTrace = useMemo(() => MATRIX[position], [position]);

  const vecAt0 = useMemo(() => BASE_EMBED.map((v, d) => v + sinusoidalPE(0, d, 8)), []);
  const vecAtP = useMemo(() => BASE_EMBED.map((v, d) => v + sinusoidalPE(4, d, 8)), []);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Attention, as you'll see precisely in the next lesson, is a weighted average over every position
          -- and a weighted average has no idea which input came first. Shuffle the tokens and, absent
          anything else, attention produces the identical set of outputs in a shuffled order. Order has to
          be injected as data. Positional encoding is that injection: think of it as stamping a{" "}
          <code>created_at</code> value onto every row before it enters the pipeline.
        </p>
      }
      takeaways={[
        "Attention is permutation-invariant by construction; without positional information, \"the cat sat\" and \"sat the cat\" would produce identical per-token outputs.",
        "Sinusoidal PE adds a fixed, non-learned signal: PE(pos, 2i) = sin(pos / 10000^(2i/d)), PE(pos, 2i+1) = cos(pos / 10000^(2i/d)).",
        "Different dimensions oscillate at different frequencies -- fast dimensions disambiguate nearby positions, slow dimensions encode coarse position, and together they make every position's combined pattern unique.",
        "The same token embedding plus a different position produces a genuinely different final vector -- this is computed live below, not asserted.",
        "Modern models mostly use RoPE instead: it rotates query/key pairs by a position-dependent angle so attention naturally depends on relative offset, which generalizes better to longer sequences.",
      ]}
      references={[
        {
          title: "Attention Is All You Need, §3.5 — Vaswani et al., 2017",
          meta: "arXiv:1706.03762 — the original sinusoidal positional encoding formula",
          url: "https://arxiv.org/abs/1706.03762",
        },
        {
          title: "RoFormer: Enhanced Transformer with Rotary Position Embedding — Su et al., 2021",
          meta: "arXiv:2104.09864 — RoPE, the rotation-based scheme used by most current open models",
          url: "https://arxiv.org/abs/2104.09864",
        },
        {
          title: "Transformer Architecture: The Positional Encoding — Amirhossein Kazemnejad",
          meta: "blog — a widely-cited intuition-first explanation of the sinusoidal scheme",
          url: "https://kazemnejad.com/blog/transformer_architecture_positional_encoding/",
        },
      ]}
    >
      <Section title="Why order has to be injected as data">
        <p>
          A backend analogy makes this concrete: if a query returned rows with no ordering guarantee and no
          timestamp column, you could not reconstruct "what happened first" no matter how you post-processed
          the result set. Attention's raw mechanism is exactly that unordered a fetch. Positional encoding
          is the fix -- a per-position signal added directly into each token's vector before the first
          attention layer ever runs, so "order" becomes part of the data itself rather than something the
          architecture tracks separately.
        </p>
      </Section>

      <Section title="The sinusoidal formula, and why multiple frequencies">
        <p>
          The original transformer's scheme sets, for dimension index <code>2i</code> (even) and{" "}
          <code>2i+1</code> (odd) of a <code>d</code>-dimensional vector at position <code>pos</code>:
        </p>
        <p className="mono" style={{ fontSize: 14 }}>
          PE(pos, 2i) = sin(pos / 10000^(2i/d)) &nbsp;&nbsp; PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
        </p>
        <p>
          Picture a clock face: the second hand distinguishes moments within a minute but tells you nothing
          about the hour; the hour hand does the reverse. Neither hand alone gives an unambiguous time, but
          the full set together does. Low dimension indices here have a short period -- like the second hand,
          they oscillate quickly and disambiguate neighboring positions. High dimension indices have a very
          long period -- like the hour hand, they change slowly and encode coarse position across the whole
          sequence. The combination lets the model reconstruct both "roughly where am I" and "exactly which
          neighbor is this" from one additive signal.
        </p>
      </Section>

      <Section title="Lab — the real PE matrix, and one row of it">
        <p>
          Below is the actual sinusoidal matrix for d_model = 64 across 128 positions, computed by{" "}
          <code>buildSinusoidalPEMatrix</code>. Amber is positive, cyan is negative. Drag the slider to
          select a position; that column is outlined, and its 64 values are traced as a waveform underneath
          -- notice how low dimensions oscillate fast and high dimensions barely move across nearby
          positions.
        </p>
        <ScopeScreen label="Sinusoidal positional encoding heatmap and single-position waveform">
          <PEHeatmap highlightPos={position} />
          <div style={{ marginTop: 16 }}>
            <Slider label="POSITION" value={position} min={0} max={NUM_POSITIONS - 1} onChange={setPosition} />
          </div>
          <svg viewBox="0 0 384 100" width="100%" height="100" aria-label={`Waveform of the 64 positional encoding values at position ${position}`}>
            <line x1={0} y1={50} x2={384} y2={50} stroke={colors.border} strokeWidth={1} />
            <polyline
              fill="none"
              stroke={colors.amber}
              strokeWidth={1.5}
              points={rowTrace.map((v, d) => `${(d / (D_MODEL - 1)) * 384},${50 - v * 45}`).join(" ")}
            />
          </svg>
        </ScopeScreen>
      </Section>

      <Section title="Lab — the same token, two positions, two different vectors">
        <p>
          Toggle the comparison: the token "the" uses the identical embedding row both times (lesson 1.3's
          lookup never changes). What differs is only the additive positional signal for position 0 versus
          position 4 -- and that's enough to make the final vectors the attention layer sees genuinely
          different.
        </p>
        <ScopeScreen label="Comparison of the same token embedding at two different positions">
          <Toggle label="SHOW POSITION 4 INSTEAD OF POSITION 0" checked={compareOn} onChange={setCompareOn} />
          <table className="data-table" style={{ marginTop: 10 }}>
            <thead><tr><th>dim</th>{BASE_EMBED.map((_, d) => <th key={d}>{d}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td>"the" embedding</td>
                {BASE_EMBED.map((v, d) => <td key={d}>{v.toFixed(2)}</td>)}
              </tr>
              <tr>
                <td>+ PE(pos={compareOn ? 4 : 0})</td>
                {BASE_EMBED.map((_, d) => <td key={d}>{sinusoidalPE(compareOn ? 4 : 0, d, 8).toFixed(2)}</td>)}
              </tr>
              <tr style={{ color: colors.green }}>
                <td>final vector</td>
                {(compareOn ? vecAtP : vecAt0).map((v, d) => <td key={d}>{v.toFixed(2)}</td>)}
              </tr>
            </tbody>
          </table>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            Position 0 vector: [{vecAt0.map((v) => v.toFixed(2)).join(", ")}] — Position 4 vector: [{vecAtP.map((v) => v.toFixed(2)).join(", ")}]. Same token, different vectors.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Learned positions, and where RoPE fits">
        <p>
          An alternative to a fixed formula is a learned absolute position embedding -- a second lookup
          table, shape <code>max_context_length × d_model</code>, trained by gradient descent exactly like
          the token embedding matrix, and simply added to it. Early GPT-2-era models used this. Its
          practical drawback is rigidity: a model trained with a learned table for positions 0-1023 has
          nothing sensible to output for position 1024, since that row was never trained.
        </p>
        <p>
          Most current open-weight models instead use <strong>RoPE</strong> (Rotary Position Embedding):
          rather than adding a positional vector, RoPE rotates each query/key pair by an angle proportional
          to its position before the dot product in attention is computed. Because rotating both vectors by
          their respective position angles leaves the dot product depending only on their <em>difference</em>
          in position, attention scores become a function of relative offset rather than absolute position --
          which tends to generalize far better to sequence lengths longer than anything seen in training.
          You'll see RoPE used for real in lesson 2.2's architecture comparison.
        </p>
      </Section>
    </LessonLayout>
  );
}
