import { useState } from "react";
import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang, type Lang } from "../../lib/i18n";

const lesson = getLessonMeta(3, "overview")!;

interface Stage {
  key: string;
  label: string;
  link: string | null;
  detail: string;
  detailId: string;
  example: string;
}

function stageDetail(s: Stage, lang: Lang): string {
  return lang === "id" ? s.detailId : s.detail;
}

const STAGES: Stage[] = [
  {
    key: "base",
    label: "BASE MODEL",
    link: null,
    detail: "A raw next-token guesser straight out of Module 2's training. No idea that questions deserve answers.",
    detailId: "Penebak token berikutnya yang mentah, baru keluar dari training Modul 2. Nggak tau kalau pertanyaan layak dijawab.",
    example: 'How do I reverse a linked list? How do I reverse a string? How do I reverse an array? These are common interview questions...',
  },
  {
    key: "sft",
    label: "SFT",
    link: "/m3/supervised-fine-tuning",
    detail: "Trained on a curated collection of questions paired with ideal answers -- and graded only on the answer parts.",
    detailId: "Di-training di koleksi terkurasi pertanyaan berpasangan jawaban ideal -- dan cuma dinilai di bagian jawabannya.",
    example: 'To reverse a linked list, iterate through it while re-pointing each node\'s next pointer to the previous node, using three pointers: prev, curr, and next.',
  },
  {
    key: "preference",
    label: "PREFERENCE OPT.",
    link: "/m3/preference-optimization",
    detail: "Shaped further by better-vs-worse answer comparisons -- sharpening qualities that are easier to judge than to write down.",
    detailId: "Dibentuk lebih lanjut lewat perbandingan jawaban lebih-bagus-vs-lebih-jelek -- ngasah kualitas yang lebih gampang dinilai daripada dituliskan.",
    example: 'Track three pointers -- prev, curr, next. At each step: save curr.next, point curr.next to prev, then advance prev and curr. Runs in O(n) time, O(1) space.',
  },
  {
    key: "rl",
    label: "RL / TOOLS / SAFETY",
    link: "/m3/tools-and-safety-tuning",
    detail: "Adds checkable rewards (did the code actually run?), practice using tools, and learning to decline genuinely harmful requests.",
    detailId: "Nambahin hadiah yang bisa dicek (kodenya beneran jalan nggak?), latihan pakai tools, dan belajar nolak permintaan yang beneran berbahaya.",
    example: '(after running the candidate code against test cases) Verified: the three-pointer approach passes all cases, including empty and single-node lists.',
  },
  {
    key: "deployed",
    label: "DEPLOYED ASSISTANT",
    link: null,
    detail: "The model you actually talk to -- the same machine as the base model; every difference above lives in the learned numbers.",
    detailId: "Model yang beneran kamu ajak ngobrol -- mesin yang sama dengan model base; setiap perbedaan di atas hidup di angka-angka hasil training.",
    example: 'Reverse a linked list with three pointers (prev, curr, next), re-linking each node backward as you go -- O(n) time, O(1) space. Want the code?',
  },
];

export default function Overview() {
  const { lang } = useLang();
  const [active, setActive] = useState<string>("sft");
  const activeStage = STAGES.find((s) => s.key === active)!;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              A freshly pre-trained model is a mirror of the internet: brilliant at continuing any text
              plausibly, and nearly useless as an assistant, because nothing in its training ever singled
              out "answer the person helpfully, then stop" as the goal. Post-training is the fix. Think of
              pre-training as twelve years of school and post-training as a short, intense job-training
              course afterward -- tiny by comparison, but it's what turns raw knowledge into someone you'd
              actually want to work with.
            </p>
          }
          id={
            <p>
              Model yang baru selesai pra-training itu cermin internet: brilian nerusin teks apa pun secara
              masuk akal, dan nyaris nggak berguna sebagai asisten, karena nggak ada apa pun di training-nya
              yang pernah nentuin "jawab orangnya dengan membantu, terus berhenti" sebagai tujuan.
              Pasca-training itu perbaikannya. Bayangin pra-training sebagai dua belas tahun sekolah dan
              pasca-training sebagai kursus kerja singkat nan padat setelahnya -- mungil dibandingin, tapi
              itulah yang ngubah pengetahuan mentah jadi seseorang yang beneran pengen kamu ajak kerja.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Post-training costs a tiny fraction of pre-training -- yet it's responsible for essentially all the difference between raw autocomplete and a helpful assistant.",
          "The standard pipeline: base model → learn from example answers (SFT) → learn from better-vs-worse comparisons → rewards, tools, and safety → the deployed assistant. Each stage has its own lesson.",
          "The machine never changes at any stage -- every difference in behavior lives entirely in the learned numbers.",
          "This is the part of the field where one person with a modest budget can genuinely contribute: fine-tuning a mid-sized open model with this module's techniques is a weekend project on rented hardware, not a data-center undertaking.",
        ],
        [
          "Pasca-training biayanya sekelumit kecil dari pra-training -- tapi dialah yang bertanggung jawab atas hampir semua perbedaan antara autocomplete mentah dan asisten yang membantu.",
          "Pipeline standarnya: model base → belajar dari contoh jawaban (SFT) → belajar dari perbandingan lebih-bagus-vs-lebih-jelek → hadiah, tools, dan keamanan → asisten yang diluncurin. Tiap tahap punya pelajarannya sendiri.",
          "Mesinnya nggak pernah berubah di tahap mana pun -- setiap perbedaan perilaku hidup sepenuhnya di angka-angka hasil training.",
          "Inilah bagian bidang ini di mana satu orang beranggaran sederhana bisa beneran berkontribusi: fine-tuning model terbuka ukuran sedang dengan teknik-teknik modul ini itu proyek akhir pekan di perangkat sewaan, bukan urusan data center.",
        ],
      )}
      references={[
        {
          title: "Training Language Models to Follow Instructions with Human Feedback — Ouyang et al., 2022",
          meta: "arXiv:2203.02155 — InstructGPT, the paper that established this pipeline",
          url: "https://arxiv.org/abs/2203.02155",
        },
        {
          title: "RLHF Book — Nathan Lambert",
          meta: "rlhfbook.com — an open, continuously updated reference on this entire pipeline",
          url: "https://rlhfbook.com/",
        },
        {
          title: "Tulu 3: Pushing Frontiers in Open Language Model Post-Training — Lambert et al., 2024",
          meta: "arXiv:2411.15124 — this module's spine and lesson 3.5's case study",
          url: "https://arxiv.org/abs/2411.15124",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — five stages, one prompt", "Lab — lima tahap, satu prompt")}>
        <Bi
          en={
            <p>
              Click through the pipeline. Each stage's response to the same prompt is an illustrative example of
              that stage's typical behavior, not live model output -- the pipeline mechanics, and the lessons
              behind each stage, are the real content here.
            </p>
          }
          id={
            <p>
              Klik nyusurin pipeline-nya. Respons tiap tahap ke prompt yang sama itu contoh ilustrasi perilaku
              khas tahap itu, bukan output model langsung -- mekanika pipeline-nya, dan pelajaran di balik tiap
              tahap, itulah isi sesungguhnya di sini. (Contoh jawabannya dibiarin dalam bahasa Inggris karena
              prompt-nya berbahasa Inggris.)
            </p>
          }
        />
        <ScopeScreen label="Five-stage post-training pipeline with a before-and-after strip for the same prompt at each stage">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {STAGES.map((s) => (
              <button
                key={s.key}
                type="button"
                className="btn"
                onClick={() => setActive(s.key)}
                aria-pressed={active === s.key}
                style={{
                  borderColor: active === s.key ? colors.magenta : undefined,
                  color: active === s.key ? colors.magenta : undefined,
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="mono" style={{ fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>
            PROMPT: "How do I reverse a linked list?"
          </div>

          <div className="panel-2" style={{ padding: 14, borderLeft: `3px solid ${colors.magenta}` }}>
            <div className="mono" style={{ fontSize: 11, color: colors.magenta, marginBottom: 6 }}>
              {activeStage.label} {activeStage.link && "— "}
              {activeStage.link && (
                <Link to={activeStage.link} style={{ color: colors.magenta }}>
                  {pick(lang, "full lesson →", "pelajaran lengkap →")}
                </Link>
              )}
            </div>
            <p style={{ margin: "0 0 10px 0", fontStyle: "italic" }}>"{activeStage.example}"</p>
            <div style={{ fontSize: 12.5, color: "var(--muted)" }}>{stageDetail(activeStage, lang)}</div>
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Same machine, different numbers", "Mesin sama, angka berbeda")}>
        <Bi
          en={
            <p>
              It's worth stating plainly because it's easy to lose track of: nothing about the model's
              machinery -- not the layers, not attention, not the parameter count -- changes across any stage
              above. The base model and the deployed assistant are the identical machine from Module 1. Every
              difference in behavior -- helpfulness, declining harmful requests, using tools, tone of voice --
              comes from what training wrote into the learned numbers during these later stages. Personality
              is data, not hardware.
            </p>
          }
          id={
            <p>
              Layak ditegasin gamblang karena gampang kelupaan: nggak ada apa pun di mesin model -- bukan
              layer, bukan attention, bukan jumlah parameter -- yang berubah di tahap mana pun di atas. Model
              base dan asisten yang diluncurin itu mesin identik dari Modul 1. Setiap perbedaan perilaku --
              sifat membantu, nolak permintaan berbahaya, pakai tools, nada bicara -- datang dari apa yang
              dituliskan training ke angka-angka hasil training selama tahap-tahap belakangan ini. Kepribadian
              itu data, bukan hardware.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Where an individual actually competes", "Di mana perorangan beneran bisa bersaing")}>
        <Bi
          en={
            <p>
              Pre-training at the frontier takes resources far beyond any individual or small team.
              Post-training does not. LoRA (lesson 3.2) trains only a tiny add-on instead of the whole model;
              DPO (lesson 3.3) learns from answer comparisons without any of the heavyweight machinery that
              used to be required. Fine-tuning an open mid-sized model with both techniques is realistically
              a single weekend on rented cloud hardware -- which is exactly why this module, more than Module
              2, is where your own hands-on practice should concentrate.
            </p>
          }
          id={
            <p>
              Pra-training di garis depan nuntut sumber daya jauh ngelewatin perorangan atau tim kecil mana
              pun. Pasca-training nggak. LoRA (pelajaran 3.2) cuma nge-training tempelan mungil daripada seluruh
              model; DPO (pelajaran 3.3) belajar dari perbandingan jawaban tanpa mesin berat yang dulu
              diperluin. Fine-tuning model terbuka ukuran sedang dengan kedua teknik itu realistisnya satu
              akhir pekan di perangkat cloud sewaan -- persis itulah kenapa modul ini, lebih dari Modul 2, itu
              tempat latihan langsungmu sebaiknya dipusatin.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
