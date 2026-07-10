import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, loraTrainableParams, type LoRAModuleDims } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(3, "supervised-fine-tuning")!;

interface Turn {
  role: "system" | "user" | "assistant";
  tag: string;
  text: string;
}

const CONVERSATION: Turn[] = [
  { role: "system", tag: "<|system|>", text: "You are a helpful assistant." },
  { role: "user", tag: "<|user|>", text: "What's 2+2?" },
  { role: "assistant", tag: "<|assistant|>", text: "2+2 equals 4." },
  { role: "user", tag: "<|user|>", text: "And 3+3?" },
  { role: "assistant", tag: "<|assistant|>", text: "3+3 equals 6." },
];

const N_FULL_8B = 8.03e9;
const N_LAYERS = 32;

const MODULES: (LoRAModuleDims & { group: string })[] = [
  { name: "q_proj", dIn: 4096, dOut: 4096, group: "attention" },
  { name: "k_proj", dIn: 4096, dOut: 1024, group: "attention" },
  { name: "v_proj", dIn: 4096, dOut: 1024, group: "attention" },
  { name: "o_proj", dIn: 4096, dOut: 4096, group: "attention" },
  { name: "gate_proj", dIn: 4096, dOut: 14336, group: "mlp" },
  { name: "up_proj", dIn: 4096, dOut: 14336, group: "mlp" },
  { name: "down_proj", dIn: 14336, dOut: 4096, group: "mlp" },
];

export default function SupervisedFineTuning() {
  const { lang } = useLang();
  const [maskOn, setMaskOn] = useLabSetting("m3-sft-mask", true);
  const [rank, setRank] = useLabSetting("m3-sft-rank", 16);
  const [selected, setSelected] = useState<Record<string, boolean>>({
    q_proj: true, k_proj: true, v_proj: true, o_proj: true, gate_proj: false, up_proj: false, down_proj: false,
  });

  const activeModules = MODULES.filter((m) => selected[m.name]);
  const perLayerParams = loraTrainableParams(rank, activeModules);
  const totalTrainable = perLayerParams * N_LAYERS;
  const pctOfFull = (totalTrainable / N_FULL_8B) * 100;

  const qloraGB = useMemo(() => {
    const baseWeights4bit = N_FULL_8B * 0.5; // 4-bit quantized base
    const adapterTraining = totalTrainable * 16; // AdamW on just the adapters, fp32 moments etc.
    return bytesToGB(baseWeights4bit + adapterTraining);
  }, [totalTrainable]);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Supervised fine-tuning (SFT) is nothing more than lesson 1.7's guess-and-grade training loop
              pointed at new material: instead of the raw internet, a small, carefully written collection of
              example conversations showing what a good assistant sounds like. The mechanism doesn't change
              at all. What changes is what the model reads -- and, crucially, which parts of it the model
              actually gets graded on.
            </p>
          }
          id={
            <p>
              Supervised fine-tuning (SFT) itu nggak lebih dari loop training tebak-lalu-nilai pelajaran 1.7
              yang diarahin ke bahan baru: daripada internet mentah, koleksi kecil percakapan contoh yang
              ditulis cermat, nunjukin kayak apa asisten yang bagus. Mekanismenya nggak berubah sama sekali.
              Yang berubah itu apa yang dibaca model -- dan, yang krusial, bagian mana darinya yang beneran
              dinilai.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "SFT is the ordinary guess-and-grade training from lesson 1.7 applied to example conversations -- no new math, just new reading material.",
          "A chat template wraps each speaker's turn in special marker tokens (like <|user|> and <|assistant|>) -- stage directions in a script -- so the model can tell who's talking.",
          "The loss mask means the model is only graded on the assistant's lines. It reads the user's messages but isn't trained to imitate them -- you want it to learn the answering role, not both sides of the conversation.",
          "A famous result called LIMA showed that about a thousand truly excellent example conversations beat hundreds of thousands of mediocre ones. For SFT, quality beats quantity, decisively.",
          "LoRA is the trick that makes fine-tuning affordable: freeze the whole model and train only small add-on pieces. QLoRA (Quantized LoRA) also compresses the frozen model into less memory -- together they fit an 8-billion-parameter fine-tune on an ordinary graphics card.",
        ],
        [
          "SFT itu training tebak-lalu-nilai biasa dari pelajaran 1.7 yang diterapin ke percakapan contoh -- tanpa matematika baru, cuma bahan bacaan baru.",
          "Template obrolan mbungkus giliran tiap pembicara dengan token penanda khusus (kayak <|user|> dan <|assistant|>) -- petunjuk panggung dalam naskah -- biar model tau siapa yang lagi ngomong.",
          "Loss mask artinya model cuma dinilai di kalimat-kalimat si asisten. Dia baca pesan user tapi nggak di-training buat nirunya -- kamu pengen dia mempelajari peran njawab, bukan kedua sisi percakapan.",
          "Temuan terkenal namanya LIMA nunjukin sekitar seribu percakapan contoh yang beneran unggul ngalahin ratusan ribu yang biasa-biasa aja. Buat SFT, kualitas ngalahin kuantitas, telak.",
          "LoRA itu trik yang bikin fine-tuning terjangkau: bekuin seluruh model dan training cuma kepingan tempelan kecil. QLoRA (Quantized LoRA) juga mampatin model beku ke memori lebih hemat -- bareng-bareng keduanya bikin fine-tune 8 miliar parameter muat di kartu grafis biasa.",
        ],
      )}
      references={[
        {
          title: "LIMA: Less Is More for Alignment — Zhou et al., 2023",
          meta: "arXiv:2305.11206 — the data-quality-over-quantity result referenced above",
          url: "https://arxiv.org/abs/2305.11206",
        },
        {
          title: "LoRA: Low-Rank Adaptation of Large Language Models — Hu et al., 2021",
          meta: "arXiv:2106.09685",
          url: "https://arxiv.org/abs/2106.09685",
        },
        {
          title: "QLoRA: Efficient Finetuning of Quantized LLMs — Dettmers et al., 2023",
          meta: "arXiv:2305.14314",
          url: "https://arxiv.org/abs/2305.14314",
        },
        {
          title: "Tulu 3 — SFT mixture section",
          meta: "arXiv:2411.15124 — a fully documented real SFT data mixture",
          url: "https://arxiv.org/abs/2411.15124",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — the template and mask microscope", "Lab — mikroskop template dan mask")}>
        <Bi
          en={
            <p>
              Below is a training conversation as the model actually sees it, marker tokens and all. Toggle
              the loss mask to see which parts the model is graded on: only the assistant's own lines.
              Everything else -- the markers, the user's messages -- is read as context but never counted in
              the grade.
            </p>
          }
          id={
            <p>
              Di bawah ini percakapan training persis kayak yang dilihat model, lengkap dengan token
              penandanya. Balik sakelar loss mask buat lihat bagian mana yang dinilai: cuma kalimat-kalimat si
              asisten sendiri. Semua yang lain -- penanda, pesan user -- dibaca sebagai konteks tapi nggak
              pernah dihitung dalam nilai.
            </p>
          }
        />
        <ScopeScreen label="Chat template with special tokens, and a loss mask toggle dimming everything except assistant response tokens">
          <Toggle label="APPLY LOSS MASK (train on assistant tokens only)" checked={maskOn} onChange={setMaskOn} />
          <div style={{ marginTop: 12, lineHeight: 2.2 }}>
            {CONVERSATION.map((turn, i) => {
              const dim = maskOn && turn.role !== "assistant";
              return (
                <div key={i} style={{ opacity: dim ? 0.3 : 1 }}>
                  <span className="token-chip" style={{ color: colors.amber, borderColor: colors.amber }}>{turn.tag}</span>{" "}
                  <span style={{ background: !dim && turn.role === "assistant" ? "rgba(140,224,95,0.12)" : undefined, padding: "2px 4px", borderRadius: 3 }}>
                    {turn.text}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {maskOn
              ? pick(
                  lang,
                  "Only the highlighted assistant text contributes to the loss.",
                  "Cuma teks asisten yang tersorot yang dihitung ke dalam loss.",
                )
              : pick(
                  lang,
                  "Mask off: every token in the sequence would contribute to the loss, including the user's own messages.",
                  "Mask mati: setiap token dalam barisan bakal dihitung ke dalam loss, termasuk pesan-pesan si user sendiri.",
                )}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Data quality over quantity", "Kualitas data di atas kuantitas")}>
        <Bi
          en={
            <p>
              The LIMA study made the point unforgettably: roughly a thousand extremely carefully written
              example conversations produced a model that held its own against ones trained on vastly more,
              messier examples. The insight is that SFT isn't teaching the model new facts -- it already
              absorbed those in pre-training. It's teaching the <em>shape</em> of a good answer: how to
              structure it, how long to make it, when to stop. For teaching a style, a small stack of perfect
              examples beats a warehouse of sloppy ones -- the same way one great writing tutor beats a
              thousand random internet comments. (One practical detail: to save time, several short
              conversations are usually bundled into one training sequence, with the grading mask making sure
              they never blur into each other.)
            </p>
          }
          id={
            <p>
              Studi LIMA negesin poinnya sampai nggak terlupakan: kira-kira seribu percakapan contoh yang
              ditulis luar biasa cermat ngehasilin model yang sanggup ngimbangin model-model yang di-training
              dengan contoh jauh lebih banyak tapi lebih berantakan. Wawasannya: SFT bukan ngajarin model fakta
              baru -- itu udah dia serep di pra-training. Dia ngajarin <em>bentuk</em> jawaban yang bagus: cara
              nyusunnya, seberapa panjang, kapan berhenti. Buat ngajarin gaya, setumpuk kecil contoh sempurna
              ngalahin segudang contoh asal-asalan -- kayak satu guru nulis hebat ngalahin seribu komentar
              internet acak. (Satu detail praktis: demi hemat waktu, beberapa percakapan pendek biasanya
              dibundel jadi satu barisan training, dengan mask penilaian mastiin mereka nggak pernah melebur
              satu sama lain.)
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — the LoRA budget console", "Lab — konsol anggaran LoRA")}>
        <Bi
          en={
            <p>
              Fine-tuning every one of 8 billion parameters takes serious hardware. <strong>LoRA</strong>{" "}
              ("low-rank adaptation") is the workaround: freeze the entire original model and bolt small
              trainable side-pieces onto chosen parts of it -- like renovating a house by adding a few new
              fixtures instead of rebuilding every wall. The side-pieces are deliberately skinny: instead of
              learning a full correction the size of the original grid, LoRA learns two thin strips whose
              product stands in for it, and a dial called the <strong>rank</strong> sets how thin. Pick a
              rank and choose which parts of the model get side-pieces, and watch how few parameters you
              actually end up training.
            </p>
          }
          id={
            <p>
              Fine-tuning kedelapan miliar parameter satu per satu nuntut perangkat serius.{" "}
              <strong>LoRA</strong> ("low-rank adaptation") itu jalan pintasnya: bekuin seluruh model asli dan
              pasang kepingan-samping kecil yang bisa di-training di bagian-bagian pilihannya -- kayak
              ngerenovasi rumah dengan nambah beberapa perabot baru daripada mbangun ulang semua tembok.
              Kepingan-sampingnya sengaja kurus: daripada mempelajari koreksi penuh seukuran kisi aslinya, LoRA
              mempelajari dua bilah tipis yang hasil kalinya ngewakilinnya, dan kenop namanya{" "}
              <strong>rank</strong> ngatur seberapa tipis. Pilih rank dan tentuin bagian model mana yang dapet
              kepingan-samping, terus lihat betapa dikitnya parameter yang akhirnya kamu training.
            </p>
          }
        />
        <ScopeScreen label="LoRA trainable parameter budget console with rank slider, target module checkboxes, and QLoRA memory estimate">
          <Slider label="RANK r" value={rank} min={1} max={256} step={1} onChange={setRank} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "10px 0" }}>
            {MODULES.map((m) => (
              <Toggle
                key={m.name}
                label={`${m.name} (${m.group})`}
                checked={!!selected[m.name]}
                onChange={(v) => setSelected({ ...selected, [m.name]: v })}
              />
            ))}
          </div>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
            <Readout label="TRAINABLE PARAMS (all 32 layers)" value={`${(totalTrainable / 1e6).toFixed(2)}M`} accent={colors.cyan} />
            <Readout label="% OF FULL 8B MODEL" value={`${pctOfFull.toFixed(3)}%`} accent={colors.green} />
            <Readout label="QLoRA ESTIMATED MEMORY" value={`${qloraGB.toFixed(2)} GB`} accent={qloraGB <= 8 ? colors.green : colors.red} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {pick(
              lang,
              "The QLoRA estimate = the frozen model compressed to half a byte per parameter, plus full training bookkeeping on just the tiny add-on pieces. (Temporary working numbers not included.)",
              "Perkiraan QLoRA = model beku dimampatin jadi setengah byte per parameter, plus pembukuan training penuh cuma di kepingan tempelan mungilnya. (Angka kerja sementara belum termasuk.)",
            )}
          </p>
        </ScopeScreen>
      </Section>
    </LessonLayout>
  );
}
