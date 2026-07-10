import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { crossEntropyFromProb, lossSurface, perplexity } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(1, "learning-to-predict")!;

const CURVE_POINTS = Array.from({ length: 60 }, (_, i) => 0.02 + (i / 59) * 0.96);

const X_DOMAIN = 9;
const Y_MIN = 3.5;
const Y_CAP = 11;
const PLOT_W = 320;
const PLOT_H = 200;

function xToScreen(x: number): number {
  return ((x + X_DOMAIN) / (2 * X_DOMAIN)) * PLOT_W;
}
function yToScreen(f: number): number {
  const clamped = Math.min(f, Y_CAP);
  return PLOT_H - 20 - ((clamped - Y_MIN) / (Y_CAP - Y_MIN)) * (PLOT_H - 40);
}

const CURVE_SAMPLES = Array.from({ length: 140 }, (_, i) => -X_DOMAIN + (i / 139) * 2 * X_DOMAIN);

export default function LearningToPredict() {
  const { lang } = useLang();
  const [pCorrect, setPCorrect] = useLabSetting("m1-ltp-pcorrect", 0.5);
  const [lr, setLr] = useLabSetting("m1-ltp-lr", 0.15);
  const [x0, setX0] = useLabSetting("m1-ltp-x0", 4);
  const [trail, setTrail] = useState<number[]>([4]);

  const loss = crossEntropyFromProb(pCorrect);
  const ppl = perplexity(loss);

  const clippedCurve = useMemo(() => {
    const pts: number[] = [];
    for (const x of trail) {
      if (Math.abs(x) > X_DOMAIN) break;
      pts.push(x);
    }
    return pts;
  }, [trail]);
  const diverged = clippedCurve.length < trail.length;
  const current = trail[trail.length - 1];

  function step() {
    const next = current - lr * (0.2 * current ** 3 - 0.8 * current + 0.1);
    setTrail((t) => [...t, next]);
  }
  function run() {
    let x = current;
    const next: number[] = [];
    for (let i = 0; i < 30; i++) {
      x = x - lr * (0.2 * x ** 3 - 0.8 * x + 0.1);
      next.push(x);
      if (!Number.isFinite(x) || Math.abs(x) > 1e8) break;
    }
    setTrail((t) => [...t, ...next]);
  }
  function reset() {
    setTrail([x0]);
  }

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Everything you've built so far -- tokenizer, embeddings, position stamps, attention, MLP --
              ends in one output: for each spot in the text, a set of percentages over "what token comes
              next." A freshly created model produces garbage percentages, because all its learned numbers
              start out random. Training is the loop that fixes that: make a guess, measure how wrong it was,
              nudge every number in the direction that would have made the guess less wrong, and repeat --
              billions of times.
            </p>
          }
          id={
            <p>
              Semua yang kamu bangun sejauh ini -- tokenizer, embedding, stempel posisi, attention, MLP --
              berujung ke satu output: buat tiap titik di teks, sekumpulan persentase tentang "token apa
              berikutnya". Model yang baru dibikin ngeluarin persentase sampah, karena semua angka hasil
              training-nya berawal acak. Training itu loop yang memperbaikinya: bikin tebakan, ukur seberapa
              salah, geser tiap angka ke arah yang bikin tebakan itu jadi nggak sesalah tadi, lalu ulangi --
              miliaran kali.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "The model's wrongness score (\"loss\") for one guess depends only on the percentage it gave to the token that actually came next -- high percentage means low loss. Training works to shrink the average loss across every guess.",
          "The scoring curve is brutally unfair on purpose: being confidently wrong costs enormously more than honestly hedging. That pressure teaches the model calibrated uncertainty.",
          "Perplexity re-expresses the loss as \"the model was as unsure as if it were picking blindly among this many equally likely tokens\" -- perplexity 20 means as lost as a 20-way coin flip.",
          "During training, the model doesn't generate one token at a time -- it grades its guess at every position of a real text simultaneously, in one pass. That trick is called teacher forcing.",
          "AdamW, the standard training algorithm, gives every individual parameter its own personalized step size instead of one global speed for all -- it's the default for essentially all modern LLM training.",
        ],
        [
          "Skor kesalahan model (\"loss\") buat satu tebakan cuma bergantung pada persentase yang ia kasih ke token yang beneran muncul berikutnya -- persentase tinggi berarti loss rendah. Training berusaha ngecilin rata-rata loss di semua tebakan.",
          "Kurva penilaiannya sengaja kejam nggak adil: salah dengan pede jauh lebih mahal ketimbang jujur ragu-ragu. Tekanan itulah yang ngajarin model buat ragu di saat yang tepat.",
          "Perplexity nyatain ulang loss jadi \"model sebingung milih buta di antara sekian token yang sama mungkinnya\" -- perplexity 20 berarti sebingung undian 20 arah.",
          "Selama training, model nggak menghasilkan token satu demi satu -- ia menilai tebakannya di tiap posisi sebuah teks asli sekaligus, dalam satu pass. Trik itu namanya teacher forcing.",
          "AdamW, algoritma training standar, ngasih tiap parameter ukuran langkahnya sendiri ketimbang satu kecepatan global buat semua -- ia default buat hampir semua training LLM modern.",
        ],
      )}
      references={[
        {
          title: "The Spelled-out Intro to Neural Networks and Backpropagation — Andrej Karpathy",
          meta: "video (micrograd) — builds backprop and gradient descent from scratch, line by line",
          url: "https://www.youtube.com/watch?v=VMj-3S1tku0",
        },
        {
          title: "Decoupled Weight Decay Regularization — Loshchilov & Hutter, 2017",
          meta: "arXiv:1711.05101 — the AdamW paper",
          url: "https://arxiv.org/abs/1711.05101",
        },
        {
          title: "Gradient Descent, How Neural Networks Learn — 3Blue1Brown",
          meta: "video — the visual intuition this lesson's gradient-descent lab is built to make concrete",
          url: "https://www.3blue1brown.com/lessons/gradient-descent",
        },
      ]}
    >
      <Section title={pick(lang, "The loop", "Loop-nya")}>
        <Bi
          en={
            <p>
              Training is four steps on repeat. <strong>Guess:</strong> run a real sentence from the training
              text through the model and get its percentages for the next token at every spot.{" "}
              <strong>Grade:</strong> compare each guess against the token that <em>actually</em> came next
              in the text, producing a single wrongness number called the <strong>loss</strong>.{" "}
              <strong>Diagnose:</strong> work out, for every one of the model's millions of learned numbers,
              whether raising or lowering it slightly would have made the loss smaller (this per-number
              direction is called the <strong>gradient</strong>). <strong>Nudge:</strong> move every number a
              tiny bit in its helpful direction. That's the whole thing. Repeated over trillions of tokens,
              this loop <em>is</em> pre-training -- Module 2 is about doing it at gigantic scale, not about
              anything fundamentally different.
            </p>
          }
          id={
            <p>
              Training itu empat step yang diulang-ulang. <strong>Tebak:</strong> jalanin kalimat asli dari
              teks training lewat model dan dapetin persentasenya buat token berikutnya di tiap titik.{" "}
              <strong>Nilai:</strong> bandingin tiap tebakan dengan token yang <em>beneran</em> muncul
              berikutnya di teks, menghasilkan satu angka kesalahan bernama <strong>loss</strong>.{" "}
              <strong>Diagnosis:</strong> hitung, buat tiap satu dari jutaan angka hasil training model,
              apakah naikin atau nurunin dikit bakal bikin loss lebih kecil (arah per-angka ini disebut{" "}
              <strong>gradien</strong>). <strong>Geser:</strong> pindahin tiap angka sedikit aja ke arah yang
              nolongin. Cuma gitu. Diulang di triliunan token, loop inilah pra-training -- Modul 2 membahas
              cara melakukannya dalam skala raksasa, bukan sesuatu yang beda secara mendasar.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — the shape of being wrong", "Lab — bentuk dari kesalahan")}>
        <Bi
          en={
            <p>
              The official name for the wrongness score is <strong>cross-entropy</strong>, and for one guess
              it's simply <code>-ln(p)</code>: take the percentage <code>p</code> the model gave to the token
              that actually came next, and feed it through a curve that's near zero when p is high and
              skyrockets as p approaches zero. Drag the slider to set that percentage and watch both readouts
              update live.
            </p>
          }
          id={
            <p>
              Nama resmi skor kesalahan itu <strong>cross-entropy</strong>, dan buat satu tebakan rumusnya
              sesederhana <code>-ln(p)</code>: ambil persentase <code>p</code> yang model kasih ke token yang
              beneran muncul berikutnya, lalu lewatin ke kurva yang mendekati nol pas p tinggi dan meroket
              pas p mendekati nol. Geser slider buat ngatur persentase itu dan lihat kedua angka pembacaannya
              berubah secara langsung.
            </p>
          }
        />
        <ScopeScreen label="Cross-entropy loss curve with a slider for the model's assigned probability to the correct token">
          <Slider label="p(CORRECT TOKEN)" value={pCorrect} min={0.02} max={0.98} step={0.01} onChange={setPCorrect} format={(v) => v.toFixed(2)} />
          <svg viewBox="0 0 320 160" width="100%" height="180" aria-label="Plot of negative log probability (cross-entropy) as a function of assigned probability, with the current point marked">
            <line x1={20} y1={140} x2={310} y2={140} stroke={colors.border} strokeWidth={1} />
            <line x1={20} y1={10} x2={20} y2={140} stroke={colors.border} strokeWidth={1} />
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={2}
              points={CURVE_POINTS.map((p) => {
                const x = 20 + p * 290;
                const y = 140 - Math.min(crossEntropyFromProb(p), 4) * 32;
                return `${x},${y}`;
              }).join(" ")}
            />
            <circle cx={20 + pCorrect * 290} cy={140 - Math.min(loss, 4) * 32} r={5} fill={colors.amber} />
          </svg>
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 8 }}>
            <Readout label="CROSS-ENTROPY LOSS" value={`${loss.toFixed(3)} nats`} accent={colors.amber} />
            <Readout label="PERPLEXITY = e^loss" value={ppl.toFixed(2)} accent={colors.green} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {pick(
              lang,
              `Perplexity ${ppl.toFixed(1)} reads as "as uncertain as choosing uniformly among ${ppl.toFixed(0)} equally likely tokens."`,
              `Perplexity ${ppl.toFixed(1)} dibaca "sebingung milih acak di antara ${ppl.toFixed(0)} token yang sama-sama mungkin."`,
            )}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Lab — gradient descent, for real", "Lab — gradient descent, sungguhan")}>
        <Bi
          en={
            <p>
              Picture the loss as a hilly landscape where lower means better, and training as a hiker in
              thick fog who can only feel the slope underfoot and always steps downhill. The curve below is
              such a landscape, with two valleys. The <strong>learning rate</strong> is the hiker's stride
              length. Set it and a starting point, then step downhill one move at a time, or run 30 moves at
              once. Small strides creep along slowly; sensible strides settle into a valley; and try cranking
              the stride way up -- the hiker doesn't just descend slower, it overshoots the valley entirely
              and goes flying out of the landscape. That's called divergence, and it's a real failure mode.
            </p>
          }
          id={
            <p>
              Bayangin loss sebagai lanskap berbukit di mana makin rendah makin bagus, dan training sebagai
              pendaki dalam kabut tebal yang cuma bisa ngerasain kemiringan di bawah kakinya dan selalu
              melangkah menurun. Kurva di bawah itu lanskap kayak gitu, dengan dua lembah.{" "}
              <strong>Learning rate</strong> itu panjang langkah si pendaki. Atur itu dan titik awal, lalu
              melangkah turun satu gerakan demi satu, atau jalanin 30 gerakan sekaligus. Langkah kecil
              merayap pelan; langkah yang pas mengendap ke sebuah lembah; dan coba gedein langkahnya
              habis-habisan -- si pendaki bukan cuma turun lebih lambat, tapi ngelewatin lembahnya total dan
              terbang keluar dari lanskap. Itu namanya divergensi, dan itu mode kegagalan yang beneran.
            </p>
          }
        />
        <ScopeScreen label="Gradient descent lab on a fixed 1D polynomial loss surface">
          <Slider label="LEARNING RATE" value={lr} min={0.01} max={1.0} step={0.01} onChange={setLr} format={(v) => v.toFixed(2)} />
          <Slider label="START POINT (x0)" value={x0} min={-8} max={8} step={0.5} onChange={(v) => { setX0(v); setTrail([v]); }} format={(v) => v.toFixed(1)} />
          <div className="btn-row">
            <button type="button" className="btn btn--primary" onClick={step}>STEP</button>
            <button type="button" className="btn" onClick={run}>RUN 30 STEPS</button>
            <button type="button" className="btn" onClick={reset}>RESET</button>
          </div>

          <svg viewBox={`0 0 ${PLOT_W} ${PLOT_H}`} width="100%" height={PLOT_H} aria-label="Loss surface with the gradient descent trajectory plotted as connected points">
            <polyline
              fill="none"
              stroke={colors.border}
              strokeWidth={2}
              points={CURVE_SAMPLES.map((x) => `${xToScreen(x)},${yToScreen(lossSurface(x))}`).join(" ")}
            />
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={1.5}
              points={clippedCurve.map((x) => `${xToScreen(x)},${yToScreen(lossSurface(x))}`).join(" ")}
            />
            {clippedCurve.map((x, i) => (
              <circle
                key={i}
                cx={xToScreen(x)}
                cy={yToScreen(lossSurface(x))}
                r={i === clippedCurve.length - 1 ? 5 : 2.5}
                fill={i === clippedCurve.length - 1 ? colors.amber : colors.cyan}
              />
            ))}
          </svg>

          <div className="mono" style={{ fontSize: 12, marginTop: 6 }}>
            step {trail.length - 1} — x = {Number.isFinite(current) ? current.toFixed(3) : "∞"}, loss = {Number.isFinite(current) ? lossSurface(current).toFixed(3) : "∞"}
            {diverged && <span style={{ color: colors.red }}> — DIVERGED (left the plotted domain)</span>}
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Teacher forcing: grading every guess at once", "Teacher forcing: menilai semua tebakan sekaligus")}>
        <Bi
          en={
            <p>
              When a model <em>generates</em> text, it must go one token at a time -- each new token gets fed
              back in before the next guess. Training has a wonderful shortcut. Given a complete real
              sentence from the training text, the no-peeking rule from lesson 1.5 already guarantees that
              each position only sees what came before it. So the model can be graded on <em>every</em>{" "}
              position of the sentence in a single pass: "after word 3, did you predict word 4?", "after word
              4, did you predict word 5?" -- all simultaneously, like grading every question on a completed
              exam at once instead of waiting for the student to answer one question before revealing the
              next. This is called <strong>teacher forcing</strong>, because at every position the model reads
              the true, correct history from the real text -- never its own possibly-wrong earlier guesses.
            </p>
          }
          id={
            <p>
              Pas model <em>menghasilkan</em> teks, ia harus jalan satu token demi satu -- tiap token baru
              dimasukin lagi sebelum tebakan berikutnya. Nah, training punya jalan pintas yang keren. Dikasih
              kalimat asli yang utuh dari teks training, aturan dilarang-ngintip dari pelajaran 1.5 udah
              menjamin tiap posisi cuma lihat apa yang datang sebelumnya. Jadi model bisa dinilai di{" "}
              <em>tiap</em> posisi kalimat dalam satu pass: "setelah kata 3, apakah kamu nebak kata 4?",
              "setelah kata 4, apakah kamu nebak kata 5?" -- semuanya sekaligus, kayak nilai semua soal di
              ujian yang udah kelar sekaligus, ketimbang nunggu murid jawab satu soal sebelum buka soal
              berikutnya. Ini namanya <strong>teacher forcing</strong>, karena di tiap posisi model baca
              riwayat yang benar dari teks asli -- nggak pernah tebakan-tebakan lamanya sendiri yang mungkin
              salah.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "AdamW, briefly", "AdamW, singkatnya")}>
        <Bi
          en={
            <p>
              The plain "hiker" above uses one stride length for every single parameter in the model. In
              practice, that's clumsy: some parameters get steady, gentle signals and could safely take
              bigger steps, while others get wild, noisy signals and need to be reined in.{" "}
              <strong>AdamW</strong>, the training algorithm nearly every modern LLM actually uses, keeps a
              short memory of how each individual parameter's signals have been behaving and gives each one
              its own personalized stride -- bigger for the steady ones, damped for the jumpy ones. The "W"
              adds one more habit: every step, all parameters get pulled a tiny bit back toward zero
              ("weight decay"), a gentle discipline that discourages any single number from growing huge and
              helps the model generalize instead of memorizing.
            </p>
          }
          id={
            <p>
              "Pendaki" polos di atas pakai satu panjang langkah buat tiap parameter di model. Dalam praktik,
              itu kaku: sebagian parameter nerima sinyal yang tenang dan mantap jadi aman ngambil langkah
              lebih besar, sementara yang lain nerima sinyal liar dan berisik jadi perlu dikekang.{" "}
              <strong>AdamW</strong>, algoritma training yang beneran dipakai hampir semua LLM modern,
              nyimpen ingatan pendek soal perilaku sinyal tiap parameter dan ngasih masing-masing langkahnya
              sendiri -- lebih besar buat yang mantap, diredam buat yang lonjak-lonjak. Huruf "W" nambah satu
              kebiasaan lagi: di tiap step, semua parameter ditarik sedikit balik ke arah nol ("weight
              decay"), disiplin lembut yang mencegah satu angka pun tumbuh raksasa dan bantu model
              menggeneralisasi ketimbang cuma ngapalin.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
