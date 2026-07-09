import { useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { computeFlops } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(2, "overview")!;

const LOG_C_MIN = 19;
const LOG_C_MAX = 26;
const AXIS_W = 600;

interface Marker {
  name: string;
  N: number;
  D: number;
}

const MARKERS: Marker[] = [
  { name: "GPT-2", N: 1.5e9, D: 1e11 },
  { name: "GPT-3", N: 175e9, D: 3e11 },
  { name: "LLaMA-3 405B", N: 405e9, D: 15.6e12 },
];

function logAxisX(c: number): number {
  const t = (Math.log10(c) - LOG_C_MIN) / (LOG_C_MAX - LOG_C_MIN);
  return Math.min(Math.max(t, 0), 1) * AXIS_W;
}

function fmtSci(v: number): string {
  return v.toExponential(2);
}

export default function Overview() {
  const { lang } = useLang();
  const [logN, setLogN] = useLabSetting("m2-overview-logN", 10.5);
  const [logD, setLogD] = useLabSetting("m2-overview-logD", 11.5);
  const [selected, setSelected] = useState<Marker | null>(null);

  const N = 10 ** logN;
  const D = 10 ** logD;
  const C = computeFlops(N, D);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Pre-training is the phase where knowledge actually gets written into the model's learned
              numbers -- and it is, by a mile, the expensive part. Module 1 built the machine; Module 2 is
              about feeding that machine trillions of words, which takes months, thousands of computers, and
              budgets in the tens of millions of dollars. At that scale, the hard problems stop being math
              problems and become logistics problems.
            </p>
          }
          id={
            <p>
              Pra-pelatihan adalah fase saat pengetahuan benar-benar dituliskan ke angka-angka hasil belajar
              model -- dan sejauh ini, inilah bagian yang mahal. Modul 1 membangun mesinnya; Modul 2 tentang
              memberi makan mesin itu triliunan kata, yang memakan waktu berbulan-bulan, ribuan komputer, dan
              anggaran puluhan juta dolar. Pada skala itu, masalah-masalah sulitnya berhenti menjadi soal
              matematika dan berubah menjadi soal logistik.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Pre-training is still just the guess-and-grade loop from lesson 1.7, run over enormous amounts of text. The core recipe hasn't fundamentally changed since GPT-2.",
          "Three currencies govern any training run: compute (C, the raw calculation you pay for), parameters (N, the model's size), and data (D, how many tokens it reads). They're tied together by one formula: C ≈ 6·N·D.",
          "A real run has four phases -- prepare the data, tokenize and package it, train with regular save-points, and evaluate constantly -- and each gets its own lesson in this module.",
          "From GPT-2 to today's frontier models, compute budgets grew about 500,000-fold. The machinery barely changed; the scale did.",
          "Almost everything hard in this module -- data pipelines, keeping thousands of computers in sync, recovering from crashes -- is engineering and logistics, not new math.",
        ],
        [
          "Pra-pelatihan tetaplah loop tebak-lalu-nilai dari pelajaran 1.7, dijalankan pada teks berjumlah raksasa. Resep intinya tak berubah mendasar sejak GPT-2.",
          "Tiga mata uang mengatur setiap pelatihan: komputasi (C, hitungan mentah yang kamu bayar), parameter (N, ukuran model), dan data (D, berapa token yang ia baca). Ketiganya terikat satu rumus: C ≈ 6·N·D.",
          "Pelatihan sungguhan punya empat fase -- siapkan data, tokenization dan kemas, latih dengan titik-simpan rutin, dan evaluasi terus-menerus -- dan masing-masing mendapat pelajarannya sendiri di modul ini.",
          "Dari GPT-2 ke model terdepan hari ini, anggaran komputasi tumbuh sekitar 500.000 kali lipat. Mesinnya nyaris tak berubah; skalanyalah yang berubah.",
          "Hampir semua yang sulit di modul ini -- jalur data, menjaga ribuan komputer tetap serempak, pulih dari crash -- adalah rekayasa dan logistik, bukan matematika baru.",
        ],
      )}
      references={[
        {
          title: "Scaling Laws for Neural Language Models — Kaplan et al., 2020",
          meta: "arXiv:2001.08361 — established the compute/params/data relationship this lesson's lab uses",
          url: "https://arxiv.org/abs/2001.08361",
        },
        {
          title: "Language Models are Few-Shot Learners (GPT-3) — Brown et al., 2020",
          meta: "arXiv:2005.14165 — the 175B-parameter, ~300B-token run marked on the chart below",
          url: "https://arxiv.org/abs/2005.14165",
        },
        {
          title: "Epoch AI — Machine Learning Trends",
          meta: "epochai.org — a maintained dashboard of training compute across major models",
          url: "https://epochai.org/trends",
        },
      ]}
    >
      <Section title={pick(lang, "Three currencies", "Tiga mata uang")}>
        <Bi
          en={
            <p>
              Every training run is a trade between three quantities. <strong>Compute</strong> (C) is the
              total amount of raw arithmetic performed, counted in individual multiply-and-add operations
              (called FLOPs) -- this is what the electricity bill and the rented hardware actually pay for.{" "}
              <strong>Parameters</strong> (N) is the size of the model being trained.{" "}
              <strong>Data</strong> (D) is how many tokens of text it reads during training. A famous 2020
              research result tied them together in one simple formula: <code>C ≈ 6·N·D</code>. In words:
              every parameter costs about 6 operations for every token it trains on. Pick any two of the
              three and the formula hands you the third -- and lesson 2.3 is all about picking them wisely.
            </p>
          }
          id={
            <p>
              Setiap pelatihan adalah tawar-menawar antara tiga besaran. <strong>Komputasi</strong> (C)
              adalah total aritmetika mentah yang dikerjakan, dihitung dalam operasi kali-dan-tambah satuan
              (disebut FLOPs) -- inilah yang sesungguhnya dibayar tagihan listrik dan perangkat sewaan.{" "}
              <strong>Parameter</strong> (N) adalah ukuran model yang dilatih. <strong>Data</strong> (D)
              adalah berapa token teks yang ia baca selama pelatihan. Sebuah temuan riset terkenal tahun 2020
              mengikat ketiganya dalam satu rumus sederhana: <code>C ≈ 6·N·D</code>. Dalam kata-kata: tiap
              parameter berbiaya sekitar 6 operasi untuk tiap token yang ia latih. Pilih dua dari tiganya dan
              rumus menyerahkan yang ketiga -- dan pelajaran 2.3 seluruhnya tentang memilihnya dengan bijak.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — the three-currencies console", "Lab — konsol tiga mata uang")}>
        <Bi
          en={
            <p>
              Set the model size and data amount with the sliders and watch the compute cost update live.
              (The sliders move in powers of ten, because real training runs range from millions to
              trillions.) The three markers are real published models, placed by their actual sizes and
              training data.
            </p>
          }
          id={
            <p>
              Atur ukuran model dan jumlah data dengan slider dan lihat biaya komputasinya berubah langsung.
              (Slider bergerak dalam pangkat sepuluh, karena pelatihan sungguhan merentang dari jutaan hingga
              triliunan.) Ketiga penanda adalah model sungguhan yang dipublikasikan, ditempatkan sesuai
              ukuran dan data latihan aslinya.
            </p>
          }
        />
        <ScopeScreen label="Three currencies console: compute as a function of parameters and data, with historical model markers">
          <Slider label="LOG10(N) — PARAMETERS" value={logN} min={6} max={12.7} step={0.05} onChange={setLogN} format={(v) => (10 ** v).toExponential(2)} />
          <Slider label="LOG10(D) — TRAINING TOKENS" value={logD} min={9} max={13.5} step={0.05} onChange={setLogD} format={(v) => (10 ** v).toExponential(2)} />

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "14px 0" }}>
            <Readout label="N (PARAMS)" value={fmtSci(N)} accent={colors.cyan} />
            <Readout label="D (TOKENS)" value={fmtSci(D)} accent={colors.amber} />
            <Readout label="C = 6ND (FLOPS)" value={fmtSci(C)} accent={colors.green} />
          </div>

          <svg viewBox={`0 0 ${AXIS_W + 20} 70`} width="100%" height={80} aria-label="Log-scale compute axis showing the user's current configuration and three historical model markers">
            <line x1={10} y1={40} x2={AXIS_W + 10} y2={40} stroke={colors.border} strokeWidth={1} />
            {Array.from({ length: LOG_C_MAX - LOG_C_MIN + 1 }, (_, i) => LOG_C_MIN + i).map((exp) => (
              <g key={exp}>
                <line x1={10 + logAxisX(10 ** exp)} y1={36} x2={10 + logAxisX(10 ** exp)} y2={44} stroke={colors.border} />
                <text x={10 + logAxisX(10 ** exp)} y={58} fontSize={9} fontFamily="monospace" fill={colors.muted} textAnchor="middle">1e{exp}</text>
              </g>
            ))}
            {MARKERS.map((m) => {
              const mc = computeFlops(m.N, m.D);
              return (
                <g
                  key={m.name}
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelected(m)}
                  tabIndex={0}
                  role="button"
                  aria-label={`${m.name}: ${fmtSci(m.N)} parameters, ${fmtSci(m.D)} tokens`}
                  onKeyDown={(e) => { if (e.key === "Enter") setSelected(m); }}
                >
                  <circle cx={10 + logAxisX(mc)} cy={40} r={6} fill={colors.magenta} />
                  <text x={10 + logAxisX(mc)} y={25} fontSize={9} fontFamily="monospace" fill={colors.text} textAnchor="middle">{m.name}</text>
                </g>
              );
            })}
            <circle cx={10 + logAxisX(C)} cy={40} r={5} fill={colors.green} stroke={colors.text} strokeWidth={1} />
          </svg>
          {selected && (
            <div className="mono" style={{ fontSize: 12, color: "var(--muted)" }}>
              {selected.name}: N = {fmtSci(selected.N)}, D = {fmtSci(selected.D)}, C = {fmtSci(computeFlops(selected.N, selected.D))} FLOPs
            </div>
          )}
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "The phase map of a real run", "Peta fase pelatihan sungguhan")}>
        <Bi
          en={
            <p>
              Concretely, a training run moves through four phases, each with its own lesson here.{" "}
              <strong>Data preparation</strong>: gather a huge slice of the internet, filter out the junk,
              and remove duplicates (lesson 2.4). <strong>Tokenizing and packaging</strong>: run all that
              text through the tokenizer and split the result into evenly-sized chunks spread across many
              storage machines. <strong>Training</strong> itself: the guess-and-grade loop running on up to
              thousands of GPUs (specialized processors, originally built for video-game graphics, that
              happen to be superb at this kind of math), with regular save-points so a crash doesn't erase
              months of progress (lessons 2.2, 2.5, 2.6). And <strong>evaluation</strong>: constantly testing
              the model on text it hasn't seen, to catch problems early (lesson 2.7). None of these is
              optional at scale -- train on junk data and you waste the whole budget, no matter how correct
              everything else is.
            </p>
          }
          id={
            <p>
              Konkretnya, sebuah pelatihan bergerak melalui empat fase, masing-masing dengan pelajarannya
              sendiri di sini. <strong>Persiapan data</strong>: kumpulkan potongan raksasa internet, saring
              sampahnya, dan buang duplikatnya (pelajaran 2.4). <strong>Tokenization dan pengemasan</strong>:
              jalankan semua teks itu lewat tokenizer dan pecah hasilnya menjadi potongan berukuran rata yang
              disebar ke banyak mesin penyimpanan. <strong>Pelatihan</strong> itu sendiri: loop
              tebak-lalu-nilai berjalan di sampai ribuan GPU (prosesor khusus, aslinya dibuat untuk grafis
              gim video, yang kebetulan hebat untuk matematika jenis ini), dengan titik-simpan rutin supaya
              crash tak menghapus kemajuan berbulan-bulan (pelajaran 2.2, 2.5, 2.6). Dan{" "}
              <strong>evaluasi</strong>: terus-menerus menguji model pada teks yang belum pernah ia lihat,
              untuk menangkap masalah lebih awal (pelajaran 2.7). Tak satu pun opsional pada skala besar --
              latih dengan data sampah dan seluruh anggaran terbuang, sebenar apa pun semua yang lain.
            </p>
          }
        />
      </Section>

      <Section
        title={pick(
          lang,
          "Orders of magnitude, and why this is an engineering module",
          "Orde besaran, dan kenapa ini modul rekayasa",
        )}
      >
        <Bi
          en={
            <p>
              GPT-2's training took around 10²¹ operations. LLaMA 3 405B, four years later, took roughly
              500,000 times more. Here's the surprising part: almost none of that growth came from new
              ideas. The transformer machine from Module 1 is essentially unchanged. What changed is
              engineering -- better data pipelines, systems that keep thousands of GPUs fed and marching in
              step, and the discipline to keep a months-long run alive when hardware inevitably fails. Think
              less "brilliant new equation" and more "running a flawless months-long expedition." That's the
              throughline for the rest of this module.
            </p>
          }
          id={
            <p>
              Pelatihan GPT-2 memakan sekitar 10²¹ operasi. LLaMA 3 405B, empat tahun kemudian, memakan
              kira-kira 500.000 kali lebih banyak. Bagian mengejutkannya: hampir tak ada dari pertumbuhan itu
              yang datang dari ide baru. Mesin transformer dari Modul 1 pada dasarnya tak berubah. Yang
              berubah adalah rekayasa -- jalur data yang lebih baik, sistem yang menjaga ribuan GPU tetap
              tersuapi dan berbaris serempak, dan disiplin menjaga pelatihan berbulan-bulan tetap hidup saat
              perangkat keras pasti gagal. Bayangkan bukan "persamaan baru yang brilian" melainkan
              "menjalankan ekspedisi berbulan-bulan tanpa cela." Itulah benang merah sisa modul ini.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
