import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, computeFlops, trainingMemoryPerGPU } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(2, "case-study-llama-3")!;

const N = 405e9;
const D = 15.6e12;
const C = computeFlops(N, D);
const TOK_PER_PARAM = D / N;
const H100_EFFECTIVE_FLOPS = 400e12; // ~40% MFU of ~990 TFLOP/s bf16 peak

interface SpecCard {
  label: string;
  value: string;
  link?: string;
}

const CARDS: SpecCard[] = [
  { label: "PARAMETERS", value: "405B (dense)" },
  { label: "LAYERS", value: "126" },
  { label: "D_MODEL", value: "16,384" },
  { label: "ATTENTION HEADS", value: "128 query / 8 KV (GQA)", link: "/m2/training-objectives-architecture" },
  { label: "VOCABULARY", value: "128,000 tokens" },
  { label: "TRAINING TOKENS", value: "15.6T" },
  { label: "TOKENS / PARAMETER", value: `${TOK_PER_PARAM.toFixed(1)} (well past Chinchilla-optimal ~20)`, link: "/m2/scaling-laws-optimization" },
  { label: "TRAINING COMPUTE", value: `${C.toExponential(2)} FLOPs` },
  { label: "CLUSTER", value: "up to 16,000 H100 GPUs", link: "/m2/training-infrastructure-systems" },
];

export default function CaseStudyLlama3() {
  const { lang } = useLang();
  const [gpuCount, setGpuCount] = useLabSetting("m2-llama-gpucount", 16000);

  const perGPUGB = bytesToGB(trainingMemoryPerGPU(N, gpuCount, "zero3", 16));
  const trainingDays = C / (gpuCount * H100_EFFECTIVE_FLOPS) / 86400;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Every idea in this module -- the three currencies, the component swaps, scaling laws, data
              cleaning, the GPU warehouse, the instruments -- shows up in one real, fully documented model:
              LLaMA 3 405B, built by Meta in 2024. Most companies keep the messy details of a big training
              run secret. Meta's team wrote theirs down with unusual honesty, failures included, which makes
              this the best public look inside a frontier training run that currently exists.
            </p>
          }
          id={
            <p>
              Setiap ide di modul ini -- tiga mata uang, pertukaran komponen, hukum penskalaan, pembersihan
              data, gudang GPU, instrumen-instrumennya -- muncul dalam satu model nyata yang
              terdokumentasi penuh: LLaMA 3 405B, dibangun Meta pada 2024. Kebanyakan perusahaan
              merahasiakan detail berantakan pelatihan besar. Tim Meta menuliskan milik mereka dengan
              kejujuran yang tak biasa, kegagalan pun disertakan, menjadikannya jendela publik terbaik ke
              dalam pelatihan kelas terdepan yang ada saat ini.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "405 billion parameters, all active for every token -- Meta deliberately chose a simple design, betting that clean data and sheer scale beat architectural cleverness.",
          "It read 15.6 trillion tokens -- about 38 per parameter, nearly double the textbook-optimal 20. That's the deliberate 'train longer, serve cheaper' trade from lesson 2.3.",
          "Its attention heads share key/value notes in groups (8 sets of notes for 128 heads) -- exactly the memory-saving trick from lesson 2.2's calculator, essential for handling long texts.",
          "Training used up to 16,000 GPUs -- not mainly because the model needed the space, but because with fewer machines the same run would take years instead of months.",
          "The paper openly reports how often hardware failed and how the team recovered -- exactly the save-and-restart reality described in lesson 2.5.",
        ],
        [
          "405 miliar parameter, semuanya aktif untuk tiap token -- Meta sengaja memilih desain sederhana, bertaruh bahwa data bersih dan skala mentah mengalahkan kecerdikan arsitektur.",
          "Ia membaca 15,6 triliun token -- sekitar 38 per parameter, hampir dua kali lipat angka optimal buku teks yaitu 20. Itulah pertukaran sengaja 'latih lebih lama, layani lebih murah' dari pelajaran 2.3.",
          "Head atensinya berbagi catatan key/value dalam kelompok (8 set catatan untuk 128 head) -- persis trik hemat memori dari kalkulator pelajaran 2.2, wajib untuk menangani teks panjang.",
          "Pelatihannya memakai sampai 16.000 GPU -- bukan terutama karena modelnya butuh ruang, melainkan karena dengan mesin lebih sedikit pelatihan yang sama memakan bertahun-tahun, bukan berbulan-bulan.",
          "Makalahnya terbuka melaporkan seberapa sering perangkat keras gagal dan bagaimana tim memulihkan -- persis kenyataan simpan-dan-mulai-ulang yang digambarkan pelajaran 2.5.",
        ],
      )}
      references={[
        {
          title: "The Llama 3 Herd of Models — Meta AI, 2024",
          meta: "arXiv:2407.21783 — the primary source for every figure on this page",
          url: "https://arxiv.org/abs/2407.21783",
        },
        {
          title: "Meta AI Engineering Blog — Llama 3 infrastructure",
          meta: "engineering.fb.com — additional detail on the training cluster and systems work",
          url: "https://engineering.fb.com/2024/03/12/data-center-engineering/building-metas-genai-infrastructure/",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — the spec dashboard", "Lab — dasbor spesifikasi")}>
        <p>
          {pick(
            lang,
            "Every headline number, cross-linked back to the lesson that explains where it comes from.",
            "Setiap angka utamanya, tertaut balik ke pelajaran yang menjelaskan asal-usulnya.",
          )}
        </p>
        <ScopeScreen label="LLaMA 3 405B specification dashboard with cards linking to the lessons that explain each figure">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {CARDS.map((c) => {
              const body = (
                <div className="panel" style={{ padding: 12, height: "100%", borderColor: c.link ? colors.amber : undefined }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{c.label}</div>
                  <div className="mono" style={{ fontSize: 14, color: c.link ? colors.amber : colors.text, marginTop: 4 }}>{c.value}</div>
                </div>
              );
              return c.link ? <Link key={c.label} to={c.link} style={{ textDecoration: "none" }}>{body}</Link> : <div key={c.label}>{body}</div>;
            })}
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Lab — the compute, and why 16,000 GPUs", "Lab — komputasinya, dan kenapa 16.000 GPU")}>
        <Bi
          en={
            <p>
              Apply lesson 2.1's formula (C = 6·N·D) to this model's real size and reading list and you get{" "}
              <strong>{C.toExponential(2)}</strong> individual math operations -- a 4 followed by 25 zeros.
              Drag the GPU count below and watch the estimated training time change. A 16,000-GPU cluster
              isn't showing off: it's the difference between finishing in months and finishing in years.
            </p>
          }
          id={
            <p>
              Terapkan rumus pelajaran 2.1 (C = 6·N·D) pada ukuran dan daftar bacaan asli model ini dan kamu
              mendapat <strong>{C.toExponential(2)}</strong> operasi matematika satuan -- angka 4 diikuti 25
              nol. Geser jumlah GPU di bawah dan lihat perkiraan waktu pelatihannya berubah. Klaster 16.000
              GPU bukan pamer: itu bedanya antara selesai dalam hitungan bulan dan selesai dalam hitungan
              tahun.
            </p>
          }
        />
        <ScopeScreen label="LLaMA 3 training time and per-GPU memory as a function of GPU count">
          <Slider label="GPU COUNT" value={gpuCount} min={500} max={16000} step={500} onChange={setGpuCount} />
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 10 }}>
            <Readout label="ESTIMATED TRAINING TIME" value={`${trainingDays.toFixed(0)} days`} accent={colors.amber} />
            <Readout label="PER-GPU MEMORY (ZeRO-3 sharded)" value={`${perGPUGB.toFixed(2)} GB`} accent={colors.cyan} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {pick(
              lang,
              "Assumes each GPU achieves about 40% of its theoretical top speed -- realistic in practice. At 16,000 GPUs the estimate lands in the same few-months range as the real reported run; drop to a few hundred GPUs and the identical run stretches to years. That, more than storage space, is the real argument for a cluster this size.",
              "Mengasumsikan tiap GPU mencapai sekitar 40% kecepatan puncak teoretisnya -- realistis dalam praktik. Pada 16.000 GPU perkiraannya mendarat di rentang beberapa-bulan yang sama dengan laporan aslinya; turunkan ke beberapa ratus GPU dan pelatihan identiknya molor bertahun-tahun. Itulah, lebih dari ruang penyimpanan, argumen sesungguhnya untuk klaster sebesar ini.",
            )}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Keeping it simple, on purpose", "Sengaja dibuat sederhana")}>
        <Bi
          en={
            <p>
              Some rival models at this scale use a design called "mixture of experts," where the model is
              split into specialist sub-networks and each token only visits a few of them -- like a hospital
              routing each patient to the right departments instead of every doctor seeing every patient.
              It's clever and saves compute. Meta bet the other way: one plain network where every parameter
              works on every token, with the effort spent instead on data quality, training stability, and
              sheer scale. Their paper frames it explicitly as choosing reliability over cleverness -- a
              defensible bet given how much of this module's content (data, systems, scaling arithmetic)
              matters more than any single architectural trick.
            </p>
          }
          id={
            <p>
              Sebagian model pesaing di skala ini memakai desain bernama "mixture of experts", di mana model
              dipecah menjadi sub-jaringan spesialis dan tiap token hanya mengunjungi beberapa saja --
              seperti rumah sakit yang mengarahkan tiap pasien ke bagian yang tepat alih-alih semua dokter
              memeriksa semua pasien. Cerdik dan menghemat komputasi. Meta bertaruh sebaliknya: satu
              jaringan polos di mana setiap parameter menggarap setiap token, dengan tenaga dialihkan ke
              kualitas data, kestabilan pelatihan, dan skala mentah. Makalah mereka membingkainya
              gamblang sebagai memilih keandalan di atas kecerdikan -- taruhan yang bisa dibela mengingat
              betapa isi modul ini (data, sistem, aritmetika penskalaan) lebih penting daripada satu trik
              arsitektur mana pun.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "What the paper is unusually candid about", "Hal-hal yang dibeberkan makalahnya dengan tak biasa")}>
        <Bi
          en={
            <p>
              Most frontier labs guard their training details closely. The LLaMA 3 paper instead documents
              the whole playbook you've just learned: training mostly on shorter texts and stretching to long
              ones late (lesson 2.6's position-encoding tricks), a frank accounting of how often hardware
              died at 16,000-GPU scale and how the save-and-restart routine handled it, and a final phase
              that concentrated the best-quality reading material at the end of training. That combination
              of scale and honesty is exactly why this one paper, more than any other public document, works
              as the spine of this entire module.
            </p>
          }
          id={
            <p>
              Kebanyakan lab terdepan menjaga rapat detail pelatihannya. Makalah LLaMA 3 justru
              mendokumentasikan seluruh buku panduan yang baru kamu pelajari: berlatih kebanyakan pada teks
              lebih pendek dan meregang ke yang panjang belakangan (trik pengodean posisi pelajaran 2.6),
              hitung-hitungan jujur seberapa sering perangkat keras mati di skala 16.000 GPU dan bagaimana
              rutinitas simpan-dan-mulai-ulang menanganinya, serta fase akhir yang memusatkan bahan bacaan
              kualitas terbaik di ujung pelatihan. Gabungan skala dan kejujuran itulah kenapa satu makalah
              ini, lebih dari dokumen publik mana pun, berfungsi sebagai tulang punggung seluruh modul ini.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
