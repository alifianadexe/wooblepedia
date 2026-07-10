import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { fimRearrange } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(2, "advanced-pretraining-objectives")!;

const SNIPPET = "def factorial(n):\n    if n == 0:\n        return 1\n    return n * factorial(n - 1)";

const SEQ_TOKENS = ["The", "cat", "sat", "on", "the", "mat", "and", "slept"];

export default function AdvancedPretrainingObjectives() {
  const { lang } = useLang();
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
        <Bi
          en={
            <p>
              "Guess the next token" is the main exercise, but it's not the only drill a training run can
              extract from the same text. This lesson covers four extra drills layered on top of it. The key
              thing to notice: none of them change the machine. The model stays a strict left-to-right
              guesser -- the cleverness is entirely in how the practice material gets rearranged before it's
              fed in.
            </p>
          }
          id={
            <p>
              "Tebak token berikutnya" itu latihan utamanya, tapi bukan satu-satunya drill yang bisa diperes
              sebuah training dari teks yang sama. Pelajaran ini ngebahas empat drill ekstra yang dilapisin di
              atasnya. Hal kunci yang perlu diperhatiin: nggak ada satu pun yang ngubah mesinnya. Model tetap
              penebak kiri-ke-kanan yang ketat -- kecerdikannya sepenuhnya ada di cara bahan latihan disusun
              ulang sebelum disuapin.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Fill-in-the-middle (FIM): cut a chunk out of a document, move it to the end, and mark the pieces with special tokens. A strict left-to-right guesser thereby learns to fill in holes -- essential for code editors that complete the middle of your file.",
          "Multi-token prediction: instead of only guessing the very next token, extra prediction heads also guess two, three, and four ahead -- more learning from every position, and a speed trick at generation time later.",
          "Long texts are handled in two phases: train mostly on shorter texts (cheaper), then stretch the position encoding and briefly continue training at the new, longer length.",
          "Curriculum: save the best-quality reading material for the end of training, when the model is best prepared to benefit from it -- the way a course saves its capstone for last.",
          "A related family called span corruption also teaches hole-filling but changes how the model reads; FIM's charm is that it never touches the machine -- it only rearranges the text.",
        ],
        [
          "Fill-in-the-middle (FIM): gunting sepotong dari dokumen, pindahin ke ujung, dan tandain kepingannya dengan token khusus. Penebak kiri-ke-kanan yang ketat dengan begitu belajar ngisi lubang -- wajib buat editor kode yang ngelengkapin bagian tengah file-mu.",
          "Multi-token prediction: daripada cuma nebak token persis berikutnya, head penebak ekstra juga nebak dua, tiga, dan empat langkah ke depan -- lebih banyak belajar dari tiap posisi, dan trik kecepatan pas generate teks nanti.",
          "Teks panjang ditangani dua fase: training kebanyakan di teks lebih pendek (lebih murah), terus regangin positional encoding-nya dan lanjutin training sebentar di panjang baru yang lebih gede.",
          "Kurikulum: simpen bahan bacaan kualitas terbaik buat akhir training, pas model paling siap manfaatinnya -- kayak kursus nyimpen proyek puncaknya buat terakhir.",
          "Keluarga serumpun namanya span corruption juga ngajarin isi-lubang tapi ngubah cara model baca; pesona FIM itu dia nggak pernah nyentuh mesinnya -- cuma nyusun ulang teksnya.",
        ],
      )}
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
      <Section title={pick(lang, "Lab — fill-in-the-middle, literally rearranged", "Lab — fill-in-the-middle, beneran disusun ulang")}>
        <Bi
          en={
            <p>
              Here's the puzzle FIM solves: a left-to-right guesser can only continue text at the end, but a
              programmer's cursor is usually in the <em>middle</em> of a file. The fix is delightfully
              simple -- rearrange the training text. Cut out a middle chunk, put the beginning and the ending
              first (labeled with special marker tokens), and stick the missing middle at the end. Now
              "filling the hole" <em>is</em> "continuing at the end," which the model already knows how to
              do. Drag the sliders to choose the cut-out chunk and see the exact rearranged sequence the
              model would train on.
            </p>
          }
          id={
            <p>
              Ini teka-teki yang dipecahin FIM: penebak kiri-ke-kanan cuma bisa nerusin teks di ujungnya,
              padahal kursor programmer biasanya di <em>tengah</em> file. Perbaikannya simpel banget dan bikin
              seneng -- susun ulang teks latihannya. Gunting sepotong bagian tengah, taruh bagian awal dan
              akhirnya duluan (dilabeli token penanda khusus), dan tempelin bagian tengah yang hilang di ujung.
              Sekarang "ngisi lubang" <em>itu sama aja</em> dengan "nerusin di ujung", yang udah model tau
              caranya. Geser slider buat milih potongan yang digunting dan lihat persis barisan susun-ulang
              yang bakal di-training-in ke model.
            </p>
          }
        />
        <ScopeScreen label="Fill-in-the-middle training sequence rearrangement lab">
          <pre className="mono" style={{ fontSize: 12.5, margin: 0, whiteSpace: "pre-wrap" }}>
            <span style={{ color: colors.muted }}>{prefix}</span>
            <span style={{ background: "rgba(232,106,166,0.25)", color: colors.magenta }}>{middle}</span>
            <span style={{ color: colors.muted }}>{suffix}</span>
          </pre>
          <Slider label="MIDDLE START (char index)" value={start} min={0} max={SNIPPET.length - 1} step={1} onChange={setMidStart} />
          <Slider label="MIDDLE END (char index)" value={end} min={1} max={SNIPPET.length} step={1} onChange={setMidEnd} />

          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", margin: "12px 0 4px" }}>{pick(lang, "REARRANGED TRAINING SEQUENCE:", "BARISAN TRAINING SETELAH DISUSUN ULANG:")}</div>
          <pre className="mono" style={{ fontSize: 12.5, margin: 0, whiteSpace: "pre-wrap", padding: 10, border: `1px solid ${colors.border}`, borderRadius: 6 }}>
            <span style={{ color: colors.amber }}>&lt;PRE&gt;</span> {prefix}{" "}
            <span style={{ color: colors.cyan }}>&lt;SUF&gt;</span> {suffix}{" "}
            <span style={{ color: colors.magenta }}>&lt;MID&gt;</span>{" "}
            <span style={{ background: "rgba(232,106,166,0.25)", color: colors.magenta }}>{middle}</span>
          </pre>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {pick(
              lang,
              "Only the highlighted part after <MID> gets graded -- that's what the model practices producing. Everything before it is just context to read.",
              "Cuma bagian tersorot setelah <MID> yang dinilai -- itulah yang model latih buat dihasilin. Semua sebelumnya cuma konteks buat dibaca.",
            )}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Lab — one head or four", "Lab — satu head atau empat")}>
        <Bi
          en={
            <p>
              Normally the model makes one guess per position: the very next token. Multi-token prediction
              bolts on extra guessing heads that simultaneously predict two, three, and four tokens ahead
              from the same spot -- like a chess student asked to name the next several moves, not just one.
              The model learns more from every position, and the extra heads pay off again later: at
              generation time they can propose several tokens at once for quick checking, a speed trick
              called speculative decoding.
            </p>
          }
          id={
            <p>
              Biasanya model bikin satu tebakan per posisi: token persis berikutnya. Multi-token prediction
              masang head penebak ekstra yang serentak nge-prediksi dua, tiga, dan empat token ke depan dari
              titik yang sama -- kayak murid catur yang diminta nyebut beberapa langkah berikutnya, bukan cuma
              satu. Model belajar lebih banyak dari tiap posisi, dan head ekstranya berbuah lagi nanti: pas
              generate teks mereka bisa ngusulin beberapa token sekaligus buat dicek cepat, trik kecepatan
              namanya speculative decoding.
            </p>
          }
        />
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

      <Section
        title={pick(
          lang,
          "Long context, curriculum, and a nod to span corruption",
          "Konteks panjang, kurikulum, dan sekilas span corruption",
        )}
      >
        <Bi
          en={
            <p>
              Training on very long texts from day one is expensive -- the attention step's cost grows fast
              with text length. So most runs do the bulk of training on shorter texts (a few thousand tokens)
              and stretch afterward. Remember RoPE from lesson 1.4, which encodes position by rotating each
              word's numbers? Stretching mostly means adjusting those rotation angles so the same range of
              angles covers a longer stretch of text -- like re-marking a ruler so the same physical length
              now measures a longer distance -- followed by a short extra phase of training at the new
              length so the model gets used to it.
            </p>
          }
          id={
            <p>
              Training di teks yang panjang banget sejak hari pertama itu mahal -- biaya langkah attention naik
              cepet ngikutin panjang teks. Makanya kebanyakan training ngerjain porsi gedenya di teks lebih
              pendek (beberapa ribu token) dan meregang setelahnya. Inget RoPE dari pelajaran 1.4, yang nge-encode
              posisi dengan muter angka-angka tiap kata? Meregang kebanyakan artinya nyetel sudut-sudut putaran
              itu biar rentang sudut yang sama nyakup bentangan teks lebih panjang -- kayak nandain ulang
              penggaris biar panjang fisik yang sama sekarang ngukur jarak lebih jauh -- diikuti fase training
              ekstra singkat di panjang baru biar model terbiasa.
            </p>
          }
        />
        <Bi
          en={
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
          }
          id={
            <p>
              <strong>Kurikulum</strong> itu keputusan penjadwalan, bukan perubahan mesin: banyak resep training
              sengaja nahan bahan terbaiknya -- teks yang tersaring cermat, buku pelajaran, data bergaya
              tanya-jawab -- buat bentangan akhir training, pas model udah punya fondasi buat beneran metiknya.
              Logika yang sama kayak kurikulum sekolah: kalkulus datang setelah aljabar. Satu sepupu terakhir
              yang layak dikenal namanya: <strong>span corruption</strong> juga ngajarin isi-lubang dengan
              ngosongin potongan acak, tapi dia ngubah cara model boleh baca teksnya. Seluruh daya tarik FIM
              itu dia nggak gitu -- dia cuma ngocok teks dan ngebiarin mesin kiri-ke-kanan biasa ngerjain
              sisanya.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
