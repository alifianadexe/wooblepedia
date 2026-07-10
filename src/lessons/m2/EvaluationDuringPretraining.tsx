import { useMemo } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { benchmarkAccuracyCurve, generateTrainingRun, mulberry32, perplexity } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(2, "evaluation-during-pretraining")!;

const STEPS = 3000;
const SPIKE_STEPS = [800, 2100];
const lossCurve = generateTrainingRun(STEPS, 1.9, 6, 0.3, 42, SPIKE_STEPS);
const smoothAcc = benchmarkAccuracyCurve(STEPS, 1200, 2.5);

const SAMPLE_EVERY = 150;
const sampledSteps: number[] = [];
for (let t = SAMPLE_EVERY; t <= STEPS; t += SAMPLE_EVERY) sampledSteps.push(t);
const noiseRand = mulberry32(7);
const sampledAcc = sampledSteps.map((t) => Math.min(1, Math.max(0, smoothAcc[t - 1] + (noiseRand() - 0.5) * 0.05)));

const lossMin = Math.min(...lossCurve);
const lossMax = Math.max(...lossCurve);

export default function EvaluationDuringPretraining() {
  const { lang } = useLang();
  const [step, setStep] = useLabSetting("m2-eval-step", 1500);
  const [showBench, setShowBench] = useLabSetting("m2-eval-showbench", true);

  const loss = lossCurve[step - 1];
  const ppl = perplexity(loss);

  const nearestSpike = useMemo(() => SPIKE_STEPS.find((s) => Math.abs(s - step) < 40), [step]);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              A training run can last months and cost millions, and you can't exactly stop and ask the
              half-trained model how it's feeling. Like a long flight over open ocean, you fly on
              instruments -- and the only instruments you'll have are the ones you built in before takeoff.
              This lesson is about what those instruments actually are, and why two of them -- one smooth,
              one jumpy -- can be measuring the exact same underlying improvement.
            </p>
          }
          id={
            <p>
              Training bisa berlangsung berbulan-bulan dan nelen jutaan dolar, dan kamu nggak bisa gitu aja
              berhenti terus nanya ke model setengah-jadi gimana perasaannya. Kayak penerbangan panjang
              nyebrang samudra, kamu terbang pakai instrumen -- dan satu-satunya instrumen yang kamu punya itu
              yang kamu pasang sebelum lepas landas. Pelajaran ini soal apa sebenernya instrumen-instrumen itu,
              dan kenapa dua di antaranya -- satu mulus, satu melonjak-lonjak -- bisa lagi ngukur perbaikan
              mendasar yang persis sama.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "The main gauge is the wrongness score measured on set-aside text the model never trains on -- cheap enough to check constantly, like a pop quiz the model never gets to study for.",
          "The scaling-law curves from lesson 2.3 double as a flight plan: if the measured score drifts badly off the predicted path, something's wrong -- caught long before any other test would notice.",
          "Standard test suites (trivia, common sense, coding problems) are run only occasionally and score pass/fail -- which can make smooth improvement underneath look like a sudden magical leap.",
          "Those test scores only mean anything because of the cleaning step from lesson 2.4 that removed test questions from the training data -- otherwise the model has simply seen the answers.",
          "When the wrongness score suddenly spikes, the fix is mundane: rewind to the last save-point, skip the batch that caused it, maybe ease off the learning speed, and resume.",
        ],
        [
          "Pengukur utamanya itu skor kesalahan yang diukur di teks sisihan yang nggak pernah di-training-in ke model -- cukup murah buat dicek terus-terusan, kayak kuis dadakan yang nggak pernah bisa dipelajarin model sebelumnya.",
          "Kurva scaling law dari pelajaran 2.3 nyambi jadi rencana penerbangan: kalau skor terukur melenceng parah dari jalur prediksi, ada yang salah -- ketangkep jauh sebelum tes lain nyadar.",
          "Paket tes standar (trivia, akal sehat, soal koding) cuma dijalanin sesekali dan nilainya lulus/gagal -- yang bisa bikin perbaikan mulus di baliknya keliatan kayak lompatan ajaib mendadak.",
          "Skor tes itu cuma bermakna berkat tahap pembersihan dari pelajaran 2.4 yang buang soal-soal tes dari data training -- kalau nggak, model cuma udah lihat jawabannya.",
          "Pas skor kesalahan tiba-tiba melonjak, perbaikannya ngebosenin: mundur ke checkpoint terakhir, skip batch penyebabnya, mungkin kendurin learning rate, terus lanjut.",
        ],
      )}
      references={[
        {
          title: "Training Compute-Optimal Large Language Models — Hoffmann et al., 2022",
          meta: "arXiv:2203.15556 — scaling-law loss predictions as an in-run sanity check",
          url: "https://arxiv.org/abs/2203.15556",
        },
        {
          title: "Emergent Abilities of Large Language Models — Wei et al., 2022",
          meta: "arXiv:2206.07682 — the original observation of sudden benchmark jumps with scale",
          url: "https://arxiv.org/abs/2206.07682",
        },
        {
          title: "Are Emergent Abilities of Large Language Models a Mirage? — Schaeffer et al., 2023",
          meta: "arXiv:2304.15004 — argues many 'emergent' jumps are metric artifacts, not sudden capability shifts",
          url: "https://arxiv.org/abs/2304.15004",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — a simulated training run", "Lab — simulasi training")}>
        <Bi
          en={
            <p>
              This wrongness-score curve is generated from the real mathematical shape training runs follow
              (with realistic noise and two deliberately injected spikes) -- not hand-drawn. Drag through the
              training steps and watch the readouts update. Then toggle the benchmark overlay to compare the
              two kinds of instrument: the score that's measured every single step versus a test that's only
              run once in a while.
            </p>
          }
          id={
            <p>
              Kurva skor kesalahan ini dihasilin dari bentuk matematis asli yang diikutin training beneran
              (dengan noise realistis dan dua lonjakan yang sengaja disuntikin) -- bukan digambar tangan. Seret
              nyusurin langkah-langkah training dan lihat pembacaannya berubah. Terus nyalain lapisan benchmark
              buat ngebandingin dua jenis instrumen: skor yang diukur tiap langkah versus tes yang cuma dijalanin
              sesekali.
            </p>
          }
        />
        <ScopeScreen label="Simulated training run with a scrubber showing loss, perplexity, and an optional benchmark accuracy overlay">
          <Slider label="TRAINING STEP" value={step} min={1} max={STEPS} step={1} onChange={setStep} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "10px 0" }}>
            <Readout label="LOSS" value={loss.toFixed(3)} accent={colors.cyan} />
            <Readout label="PERPLEXITY" value={ppl.toFixed(2)} accent={colors.green} />
          </div>
          <Toggle label="OVERLAY BENCHMARK ACCURACY (sampled every 150 steps)" checked={showBench} onChange={setShowBench} />

          <svg viewBox="0 0 400 170" width="100%" height="190" aria-label="Loss curve over training steps with an optional sparsely-sampled benchmark accuracy overlay and a scrubber marking the current step">
            <polyline
              fill="none"
              stroke={colors.cyan}
              strokeWidth={1.5}
              points={lossCurve.map((l, i) => `${(i / STEPS) * 400},${150 - ((l - lossMin) / (lossMax - lossMin)) * 130}`).join(" ")}
            />
            {showBench && (
              <polyline
                fill="none"
                stroke={colors.amber}
                strokeWidth={2}
                points={sampledSteps.map((t, i) => `${(t / STEPS) * 400},${150 - sampledAcc[i] * 130}`).join(" ")}
              />
            )}
            {showBench && sampledSteps.map((t, i) => (
              <circle key={t} cx={(t / STEPS) * 400} cy={150 - sampledAcc[i] * 130} r={2.5} fill={colors.amber} />
            ))}
            {SPIKE_STEPS.map((s) => (
              <line key={s} x1={(s / STEPS) * 400} y1={20} x2={(s / STEPS) * 400} y2={150} stroke={colors.red} strokeDasharray="3 3" strokeWidth={1} />
            ))}
            <line x1={(step / STEPS) * 400} y1={20} x2={(step / STEPS) * 400} y2={150} stroke={colors.text} strokeWidth={1.5} />
          </svg>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>
            {pick(
              lang,
              `cyan = loss (measured every step, smooth) — amber = benchmark accuracy (sampled every ${SAMPLE_EVERY} steps, jumpier) — red dashed = injected loss spikes`,
              `biru kehijauan = loss (diukur tiap langkah, mulus) — kuning = akurasi benchmark (dicuplik tiap ${SAMPLE_EVERY} langkah, lebih melonjak) — merah putus-putus = lonjakan loss suntikkan`,
            )}
          </div>
          {nearestSpike && (
            <div className="panel-2" style={{ padding: 10, marginTop: 10, borderLeft: `3px solid ${colors.red}` }}>
              <div className="mono" style={{ fontSize: 11, color: colors.red }}>
                {pick(lang, `LOSS SPIKE NEAR STEP ${nearestSpike}`, `LONJAKAN LOSS DEKAT LANGKAH ${nearestSpike}`)}
              </div>
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                {pick(
                  lang,
                  "Real teams respond by rewinding to the last stable checkpoint, skipping the batch that triggered it, or lowering the learning rate before resuming -- rarely anything more exotic.",
                  "Tim beneran nanggepinnya dengan mundur ke checkpoint stabil terakhir, skip batch pemicunya, atau nurunin learning rate sebelum lanjut -- jarang ada yang lebih eksotis.",
                )}
              </div>
            </div>
          )}
        </ScopeScreen>
      </Section>

      <Section
        title={pick(
          lang,
          "Why 'emergence' is often a measurement artifact",
          "Kenapa 'kemunculan tiba-tiba' sering cuma jebakan pengukuran",
        )}
      >
        <Bi
          en={
            <p>
              You may have heard that big models suddenly "unlock" abilities out of nowhere. Often, the
              suddenness is an illusion created by how we measure. The wrongness score is a smooth number
              checked every step, so it shows gradual improvement directly. Benchmarks, by contrast, grade
              pass/fail -- the model either got the exact answer or it didn't -- and run only occasionally.
              Imagine a kid whose basketball shot improves a tiny bit every day, but the only stat anyone
              records is "made the shot or missed": for months the scoresheet says zero, then one week it
              says 60%, and it looks like magic. Nothing jumped -- the skill grew smoothly, and the pass/fail
              ruler couldn't see it until it crossed the line. Researchers have shown many famous "emergent
              leaps" in AI are exactly this measurement artifact.
            </p>
          }
          id={
            <p>
              Kamu mungkin pernah denger model gede tiba-tiba "ngebuka" kemampuan entah dari mana. Seringnya,
              ketiba-tibaan itu ilusi yang diciptain cara kita ngukur. Skor kesalahan itu angka mulus yang dicek
              tiap langkah, jadi dia nunjukin perbaikan bertahap secara langsung. Benchmark, sebaliknya, nilainya
              lulus/gagal -- model dapet jawaban persis atau nggak -- dan cuma dijalanin sesekali. Bayangin anak
              yang tembakan basketnya makin bagus dikit demi dikit tiap hari, tapi satu-satunya statistik yang
              dicatet cuma "masuk atau meleset": selama berbulan-bulan lembar nilai bilang nol, terus suatu
              minggu bilang 60%, dan itu keliatan kayak sulap. Nggak ada yang melompat -- skill-nya tumbuh
              mulus, dan penggaris lulus/gagal nggak bisa ngeliatnya sampai dia ngelewatin garis. Para peneliti
              udah nunjukin banyak "lompatan kemunculan" terkenal di AI persis merupakan jebakan pengukuran ini.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
