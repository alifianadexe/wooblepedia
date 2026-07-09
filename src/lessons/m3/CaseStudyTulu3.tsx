import { useState } from "react";
import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang, type Lang } from "../../lib/i18n";

const lesson = getLessonMeta(3, "case-study-tulu-3")!;

interface SpecCard {
  label: string;
  labelId: string;
  value: string;
  valueId: string;
  link?: string;
}

const CARDS: SpecCard[] = [
  {
    label: "BASE MODEL",
    labelId: "MODEL BASE",
    value: "Llama 3.1 (8B and 70B variants)",
    valueId: "Llama 3.1 (varian 8B dan 70B)",
  },
  {
    label: "STAGE 1",
    labelId: "TAHAP 1",
    value: "SFT — example answers, with each data source's contribution tested separately",
    valueId: "SFT — contoh jawaban, dengan sumbangan tiap sumber data diuji terpisah",
    link: "/m3/supervised-fine-tuning",
  },
  {
    label: "STAGE 2",
    labelId: "TAHAP 2",
    value: "DPO — better-vs-worse comparisons, including ones judged on the model's own answers",
    valueId: "DPO — perbandingan lebih-baik-vs-lebih-buruk, termasuk yang dinilai pada jawaban si model sendiri",
    link: "/m3/preference-optimization",
  },
  {
    label: "STAGE 3",
    labelId: "TAHAP 3",
    value: "RLVR — practice graded by an answer-checking program, not a judge model",
    valueId: "RLVR — latihan yang dinilai program pengecek jawaban, bukan model juri",
  },
  {
    label: "TEST HYGIENE",
    labelId: "HIGIENE TES",
    value: "Training data continuously scrubbed of benchmark test questions",
    valueId: "Data latihan terus-menerus dibersihkan dari soal-soal tes benchmark",
  },
  {
    label: "RELEASE",
    labelId: "RILIS",
    value: "Data, training code, and finished model all public",
    valueId: "Data, kode pelatihan, dan model jadinya semua publik",
  },
];

function cardText(c: SpecCard, lang: Lang): { label: string; value: string } {
  return lang === "id" ? { label: c.labelId, value: c.valueId } : { label: c.label, value: c.value };
}

interface MathProblem {
  question: string;
  correctAnswer: string;
  candidates: string[];
}

const PROBLEMS: MathProblem[] = [
  { question: "12 × 7 = ?", correctAnswer: "84", candidates: ["84", "82", "91"] },
  { question: "15% of 200 = ?", correctAnswer: "30", candidates: ["20", "30", "35"] },
  { question: "Solve for x: 2x + 3 = 11", correctAnswer: "4", candidates: ["4", "5", "7"] },
  { question: "Remainder of 17 ÷ 5?", correctAnswer: "2", candidates: ["2", "3", "0"] },
];

function verify(candidate: string, correct: string): number {
  return candidate.trim() === correct.trim() ? 1 : 0;
}

export default function CaseStudyTulu3() {
  const { lang } = useLang();
  const [problemIdx, setProblemIdx] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const problem = PROBLEMS[problemIdx % PROBLEMS.length];
  const meanReward = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;

  function pickAnswer(candidate: string) {
    const reward = verify(candidate, problem.correctAnswer);
    setHistory((h) => [...h, reward]);
    setProblemIdx((i) => i + 1);
  }

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Every stage in this module has well-documented theory but murky practice -- most labs keep
              their exact data and recipes secret. Tulu 3, from the Allen Institute for AI, is the exception:
              they published everything -- the data, the training code, the finished model, and a frank
              account of every decision along the way. It's the closest thing this module has to a complete
              published cookbook, and it runs the exact three-stage pipeline you've just learned.
            </p>
          }
          id={
            <p>
              Setiap tahap di modul ini punya teori yang terdokumentasi baik tetapi praktik yang buram --
              kebanyakan lab merahasiakan data dan resep persisnya. Tulu 3, dari Allen Institute for AI,
              adalah pengecualiannya: mereka menerbitkan semuanya -- datanya, kode pelatihannya, model
              jadinya, dan cerita jujur setiap keputusan di sepanjang jalan. Inilah yang paling mendekati
              buku resep lengkap yang diterbitkan untuk modul ini, dan ia menjalankan persis jalur tiga
              tahap yang baru kamu pelajari.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Tulu 3 runs this module's exact three-stage pipeline -- example answers (SFT), then answer comparisons (DPO), then reward-based practice -- on public Llama 3.1 base models, with every stage's data and code released.",
          "Its reward stage uses RLVR (Reinforcement Learning with Verifiable Rewards): instead of a trained judge model guessing what people like, a plain computer program checks the answer -- did the math come out right? was the rule followed? An answer key, not a judge's opinion.",
          "Throughout, the team kept scrubbing their training data of anything overlapping the standard tests -- the same keep-the-exam-honest discipline from lesson 2.7.",
          "Because everything is public, reproducing a slice of the Tulu 3 recipe on rented hardware is a realistic, well-specified capstone project for this course.",
        ],
        [
          "Tulu 3 menjalankan persis jalur tiga tahap modul ini -- contoh jawaban (SFT), lalu perbandingan jawaban (DPO), lalu latihan berbasis hadiah -- pada model base Llama 3.1 yang publik, dengan data dan kode tiap tahap dirilis.",
          "Tahap hadiahnya memakai RLVR (Reinforcement Learning with Verifiable Rewards): alih-alih model juri terlatih menebak apa yang disukai orang, program komputer polos mengecek jawabannya -- apakah matematikanya keluar benar? apakah aturannya dipatuhi? Kunci jawaban, bukan opini juri.",
          "Sepanjang jalan, tim terus membersihkan data latihannya dari apa pun yang beririsan dengan tes standar -- disiplin jaga-ujian-tetap-jujur yang sama dari pelajaran 2.7.",
          "Karena semuanya publik, mereproduksi seiris resep Tulu 3 di perangkat sewaan adalah proyek puncak yang realistis dan terspesifikasi baik untuk kursus ini.",
        ],
      )}
      references={[
        {
          title: "Tulu 3: Pushing Frontiers in Open Language Model Post-Training — Lambert et al., 2024",
          meta: "arXiv:2411.15124",
          url: "https://arxiv.org/abs/2411.15124",
        },
        {
          title: "Tulu 3 — AI2 blog and released datasets",
          meta: "allenai.org / Hugging Face — the actual data, code, and weights referenced throughout this lesson",
          url: "https://allenai.org/blog/tulu-3",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — the recipe dashboard", "Lab — dasbor resep")}>
        <ScopeScreen label="Tulu 3 recipe dashboard with cards linking to the lessons covering each stage">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {CARDS.map((c) => {
              const text = cardText(c, lang);
              const body = (
                <div className="panel" style={{ padding: 12, height: "100%", borderColor: c.link ? colors.magenta : undefined }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{text.label}</div>
                  <div style={{ fontSize: 13, color: c.link ? colors.magenta : colors.text, marginTop: 4 }}>{text.value}</div>
                </div>
              );
              return c.link ? <Link key={c.label} to={c.link} style={{ textDecoration: "none" }}>{body}</Link> : <div key={c.label}>{body}</div>;
            })}
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Lab — a toy RLVR console", "Lab — konsol RLVR mainan")}>
        <Bi
          en={
            <p>
              Play the model's role: pick an answer to each problem below. A real checking function grades
              your pick and awards 1 point for correct, 0 for wrong -- no opinions, no judge model, just a
              program comparing against the answer key. That's the entire idea of RLVR: for subjects where
              answers can be checked mechanically (math, code, following explicit rules), let the checker be
              the teacher.
            </p>
          }
          id={
            <p>
              Mainkan peran si model: pilih jawaban untuk tiap soal di bawah. Fungsi pengecek sungguhan
              menilai pilihanmu dan memberi 1 poin untuk benar, 0 untuk salah -- tanpa opini, tanpa model
              juri, hanya program yang membandingkan dengan kunci jawaban. Itulah seluruh ide RLVR: untuk
              bidang-bidang yang jawabannya bisa dicek mekanis (matematika, kode, mengikuti aturan
              eksplisit), biarkan si pengecek jadi gurunya.
            </p>
          }
        />
        <ScopeScreen label="Toy reinforcement learning from verifiable rewards console with math problems and a running mean reward">
          <div className="mono" style={{ fontSize: 14, marginBottom: 10 }}>{problem.question}</div>
          <div className="btn-row">
            {problem.candidates.map((c) => (
              <button key={c} type="button" className="btn" onClick={() => pickAnswer(c)}>{c}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
            <Readout label="ATTEMPTS" value={history.length.toString()} accent={colors.cyan} />
            <Readout label="MEAN REWARD" value={meanReward.toFixed(2)} accent={colors.green} />
          </div>

          <div style={{ display: "flex", gap: 3, marginTop: 10, flexWrap: "wrap" }} aria-label="Reward history, one square per attempt">
            {history.map((r, i) => (
              <div key={i} style={{ width: 14, height: 14, background: r === 1 ? colors.green : colors.red, borderRadius: 2 }} title={`attempt ${i + 1}: reward ${r}`} />
            ))}
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "A realistic capstone", "Proyek puncak yang realistis")}>
        <Bi
          en={
            <p>
              Because Tulu 3's example answers, comparison data, and practice problems are all public, you
              can genuinely reproduce a slice of it yourself: fine-tune an 8-billion-parameter model on part
              of its data using the LoRA add-on trick from lesson 3.2, then run DPO on its released
              comparisons using lesson 3.3's recipe -- all on rented cloud hardware over a long weekend. A
              fully published recipe at a scale one person can actually cook: that's what makes Tulu 3 this
              course's natural final destination.
            </p>
          }
          id={
            <p>
              Karena contoh jawaban, data perbandingan, dan soal-soal latihan Tulu 3 semuanya publik, kamu
              sungguh bisa mereproduksi seirisnya sendiri: fine-tune model 8 miliar parameter pada sebagian
              datanya memakai trik tempelan LoRA dari pelajaran 3.2, lalu jalankan DPO pada
              perbandingan-perbandingan rilisannya memakai resep pelajaran 3.3 -- semua di perangkat cloud
              sewaan dalam satu akhir pekan panjang. Resep yang diterbitkan penuh pada skala yang sungguh
              bisa dimasak satu orang: itulah yang menjadikan Tulu 3 tujuan akhir alami kursus ini.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
