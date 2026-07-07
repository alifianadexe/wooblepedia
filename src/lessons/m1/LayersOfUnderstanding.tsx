import { useMemo } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { attentionScores, attentionWeights, matVecMul, sinusoidalPE } from "../../lib/math";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(1, "layers-of-understanding")!;

const TOKENS = ["the", "cat", "sat", "on", "the", "mat"];
const N = TOKENS.length;
const VOCAB = ["the", "cat", "sat", "on", "mat"];
const D = 4;

const BASE_EMBED: Record<string, number[]> = {
  the: [0.9, 0.1, 0.0, 0.2],
  cat: [0.2, 0.8, 0.1, 0.4],
  sat: [0.1, 0.3, 0.9, 0.2],
  on: [0.6, 0.2, 0.2, 0.1],
  mat: [0.3, 0.7, 0.2, 0.5],
};

const W_Q = [[1, 0.2, -0.3, 0.1], [0.1, 1, 0.2, -0.2], [-0.2, 0.3, 1, 0.1], [0.2, -0.1, 0.3, 1]];
const W_K = [[1, -0.1, 0.2, 0.3], [0.2, 1, -0.1, 0.2], [0.1, 0.2, 1, -0.3], [-0.3, 0.1, 0.2, 1]];

function oneHot(index: number, length: number): number[] {
  return Array.from({ length }, (_, i) => (i === index ? 1 : 0));
}

function MiniHeatmap({ matrix, label, accent }: { matrix: number[][]; label: string; accent: string }) {
  const size = 30;
  return (
    <div style={{ flex: "1 1 160px", minWidth: 160 }}>
      <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>{label}</div>
      <svg viewBox={`0 0 ${N * size} ${N * size}`} width="100%" height={N * size} aria-label={`${label} attention weight heatmap, ${N} by ${N}`}>
        {matrix.map((row, i) =>
          row.map((w, j) => (
            <rect key={`${i}-${j}`} x={j * size} y={i * size} width={size - 2} height={size - 2} fill={accent} opacity={Math.max(w, 0.04)} stroke={colors.border} />
          )),
        )}
      </svg>
    </div>
  );
}

export default function LayersOfUnderstanding() {
  const { lang } = useLang();
  const heads = useMemo(() => {
    const X = TOKENS.map((t, pos) => BASE_EMBED[t].map((v, d) => v + sinusoidalPE(pos, d, D) * 0.3));

    // Head A: content-based, learned-style projections (same mechanism as lesson 1.5).
    const qA = X.map((x) => matVecMul(W_Q, x));
    const kA = X.map((x) => matVecMul(W_K, x));
    const contentHead = attentionWeights(attentionScores(qA, kA, D, true));

    // Head B: previous-token head -- query for position i is built to want position i-1 exactly.
    const qB = TOKENS.map((_, i) => oneHot(Math.max(i - 1, 0), N).map((v) => v * 8));
    const kB = TOKENS.map((_, j) => oneHot(j, N));
    const prevTokenHead = attentionWeights(attentionScores(qB, kB, N, true));

    // Head C: same-token head -- query/key built from token identity, so duplicate tokens find each other.
    const tokenId = (t: string) => VOCAB.indexOf(t);
    const qC = TOKENS.map((t) => oneHot(tokenId(t), VOCAB.length).map((v) => v * 8));
    const kC = TOKENS.map((t) => oneHot(tokenId(t), VOCAB.length));
    const sameTokenHead = attentionWeights(attentionScores(qC, kC, VOCAB.length, true));

    return { contentHead, prevTokenHead, sameTokenHead };
  }, []);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              One attention operation is already useful. Real models run several of them side by side --
              called <strong>heads</strong> -- and then stack dozens of these layers on top of each other.
              This lesson is about what all that buys you: different heads that each learn to watch for a
              different kind of relationship between words, and a clever "running total" design (the residual
              stream) that keeps a 100-layer-deep model trainable at all.
            </p>
          }
          id={
            <p>
              Satu operasi atensi saja sudah berguna. Model sungguhan menjalankan beberapa sekaligus
              berdampingan -- disebut <strong>head</strong> -- lalu menumpuk lusinan lapisan seperti ini.
              Pelajaran ini membahas apa yang kamu dapat dari semua itu: head-head berbeda yang
              masing-masing belajar mengawasi jenis hubungan antarkata yang berbeda, dan desain "jumlah
              berjalan" yang cerdik (residual stream) yang membuat model sedalam 100 lapisan tetap bisa
              dilatih.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Multi-head attention runs several smaller attention operations side by side, each with its own learned lenses, then stitches their answers back together -- and each head tends to specialize in noticing one kind of relationship.",
          "The residual stream is a running total: each layer reads the current numbers and adds its own small contribution on top, rather than replacing everything. That additive design is why very deep models can still learn -- the training signal has a straight path back through all the plus signs.",
          "Layer norm is just a volume knob that keeps the running total from drifting too big or too small as dozens of layers add to it. It adds stability, not smarts.",
          "Attention is the only step where words exchange information; the MLP then works on each word alone -- and it holds roughly two-thirds of a layer's learned numbers, acting a lot like the model's fact-and-pattern storage.",
          "Early layers tend to notice surface-level things (which word is next door, exact repeats); deeper layers combine those clues into more abstract understanding.",
        ],
        [
          "Multi-head attention menjalankan beberapa operasi atensi lebih kecil berdampingan, masing-masing dengan lensa hasil belajarnya sendiri, lalu menjahit jawaban mereka kembali jadi satu -- dan tiap head cenderung berspesialisasi memperhatikan satu jenis hubungan.",
          "Residual stream adalah jumlah berjalan: tiap lapisan membaca angka saat ini dan menambahkan sumbangan kecilnya di atasnya, bukan mengganti semuanya. Desain penjumlahan itulah kenapa model yang sangat dalam tetap bisa belajar -- sinyal pelatihan punya jalan lurus kembali melewati semua tanda tambah.",
          "Layer norm hanyalah kenop volume yang menjaga jumlah berjalan itu tidak melantur terlalu besar atau kecil saat lusinan lapisan terus menambah. Ia menyumbang kestabilan, bukan kecerdasan.",
          "Atensi adalah satu-satunya langkah tempat kata bertukar informasi; MLP setelahnya menggarap tiap kata sendirian -- dan ia memegang kira-kira dua pertiga angka hasil belajar sebuah lapisan, berperilaku sangat mirip gudang fakta-dan-pola milik model.",
          "Lapisan awal cenderung memperhatikan hal-hal di permukaan (kata mana yang bersebelahan, pengulangan persis); lapisan lebih dalam menggabungkan petunjuk itu menjadi pemahaman yang lebih abstrak.",
        ],
      )}
      references={[
        {
          title: "A Mathematical Framework for Transformer Circuits — Anthropic, 2021",
          meta: "transformer-circuits.pub — formalizes the residual stream and per-head specialization used in this lesson",
          url: "https://transformer-circuits.pub/2021/framework/index.html",
        },
        {
          title: "Transformer Feed-Forward Layers Are Key-Value Memories — Geva et al., 2020",
          meta: "arXiv:2012.14913 — the MLP-as-memory framing referenced above",
          url: "https://arxiv.org/abs/2012.14913",
        },
        {
          title: "Softmax Linear Units — Elhage et al., 2022 (Anthropic)",
          meta: "transformer-circuits.pub — follow-up on superposition and head interpretability, optional deeper read",
          url: "https://transformer-circuits.pub/2022/solu/index.html",
        },
      ]}
    >
      <Section
        title={pick(
          lang,
          "Multi-head attention: several smaller searches, not one big one",
          "Multi-head attention: beberapa pencarian kecil, bukan satu yang besar",
        )}
      >
        <Bi
          en={
            <p>
              Instead of running one big attention operation, each layer splits the work among several
              smaller <strong>heads</strong>. Each head gets its own learned lenses for making queries, keys,
              and values, runs the exact attention math from last lesson independently, and then all the
              heads' answers get stitched back together and blended. Think of a group of friends watching the
              same movie: one tracks the plot, one watches the costumes, one catches the background jokes.
              Nobody assigns those jobs -- and nothing assigns jobs to attention heads either -- but
              specialization reliably emerges during training: some heads end up watching word positions,
              some track repeated words, some follow grammar relationships like which noun a verb belongs to.
              The lab below computes three genuinely different heads live, not staged pictures.
            </p>
          }
          id={
            <p>
              Alih-alih menjalankan satu operasi atensi besar, tiap lapisan membagi pekerjaan ke beberapa{" "}
              <strong>head</strong> yang lebih kecil. Tiap head mendapat lensa hasil belajarnya sendiri untuk
              membuat query, key, dan value, menjalankan matematika atensi dari pelajaran lalu secara mandiri,
              lalu jawaban semua head dijahit kembali dan dicampur. Bayangkan sekelompok teman menonton film
              yang sama: satu mengikuti alur, satu memperhatikan kostum, satu menangkap lelucon di latar.
              Tidak ada yang membagi tugas itu -- dan tidak ada pula yang membagi tugas ke head atensi --
              tetapi spesialisasi muncul dengan andal selama pelatihan: sebagian head akhirnya mengawasi
              posisi kata, sebagian melacak kata yang berulang, sebagian mengikuti hubungan tata bahasa
              seperti kata benda mana milik sebuah kata kerja. Lab di bawah menghitung tiga head yang
              sungguh berbeda secara langsung, bukan gambar rekayasa.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — three heads, the same sentence, real weights", "Lab — tiga head, kalimat sama, bobot asli")}>
        <Bi
          en={
            <p>
              The sentence is "the cat sat on the mat," with peeking-ahead blocked. Head A matches words by
              their meaning, reusing last lesson's setup. Head B is built to always look at whichever word
              came immediately before. Head C matches on word identity alone -- so the second "the" (position
              4) should light up strongly for the first "the" (position 0).
            </p>
          }
          id={
            <p>
              Kalimatnya "the cat sat on the mat", dengan intip-ke-depan diblokir. Head A mencocokkan kata
              berdasarkan maknanya, memakai ulang susunan pelajaran lalu. Head B dibuat untuk selalu melihat
              kata yang datang tepat sebelumnya. Head C mencocokkan berdasarkan identitas kata semata -- jadi
              "the" kedua (posisi 4) semestinya menyala kuat untuk "the" pertama (posisi 0).
            </p>
          }
        />
        <ScopeScreen label="Three attention heads over the same sentence, showing different specializations">
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            <MiniHeatmap matrix={heads.contentHead} label="HEAD A · CONTENT" accent={colors.amber} />
            <MiniHeatmap matrix={heads.prevTokenHead} label="HEAD B · PREVIOUS-TOKEN" accent={colors.cyan} />
            <MiniHeatmap matrix={heads.sameTokenHead} label="HEAD C · SAME-TOKEN" accent={colors.magenta} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {pick(
              lang,
              'Read each row as "when this token does the looking, how much lands on each column." Head B shows a bright stripe just below the diagonal (everyone looking one word back); in Head C, row 4 ("the") lights up at column 0 (the other "the").',
              'Baca tiap baris sebagai "saat token ini yang melihat, berapa banyak jatuh ke tiap kolom." Head B menampilkan garis terang tepat di bawah diagonal (semua melihat satu kata ke belakang); di Head C, baris 4 ("the") menyala di kolom 0 ("the" satunya).',
            )}
          </p>
        </ScopeScreen>
      </Section>

      <Section
        title={pick(
          lang,
          "The residual stream: a shared document everyone adds notes to",
          "Residual stream: dokumen bersama yang semua orang menempeli catatan",
        )}
      >
        <Bi
          en={
            <p>
              From the embedding layer to the very end, each word carries one vector -- the{" "}
              <strong>residual stream</strong> -- and here's the crucial design choice: no layer ever replaces
              it. Each attention and MLP step reads the current vector, computes its contribution, and{" "}
              <em>adds</em> it on top: <code>stream = stream + this layer's contribution</code>. Picture a
              shared document passed down a long line of editors, where each editor may only append notes in
              the margin, never rewrite the text. This additive design is the secret to training very deep
              models. During training, a correction signal has to travel backward from the final answer to
              the earliest layers, and in older network designs it faded to nothing along the way -- like a
              message garbled in a hundred-person game of telephone. With addition, the signal passes
              straight through every plus sign undiminished, so even layer 1 of a 100-layer model hears
              clearly what it should fix. Layer norm, a small step you'll see mentioned around transformers,
              is just the volume knob: with dozens of editors adding notes, the numbers would drift ever
              larger, and layer norm rescales them to a steady size. Stability, not smarts.
            </p>
          }
          id={
            <p>
              Dari lapisan embedding sampai ujung akhir, tiap kata membawa satu vektor -- si{" "}
              <strong>residual stream</strong> -- dan inilah pilihan desain krusialnya: tidak ada lapisan yang
              pernah menggantinya. Tiap langkah atensi dan MLP membaca vektor saat ini, menghitung
              sumbangannya, lalu <em>menambahkannya</em> di atas:{" "}
              <code>stream = stream + sumbangan lapisan ini</code>. Bayangkan dokumen bersama yang
              dioper menyusuri barisan panjang editor, di mana tiap editor hanya boleh menempelkan catatan di
              pinggir, tak pernah menulis ulang teksnya. Desain penjumlahan ini adalah rahasia melatih model
              yang sangat dalam. Selama pelatihan, sinyal koreksi harus berjalan mundur dari jawaban akhir ke
              lapisan-lapisan paling awal, dan di desain jaringan lama ia memudar jadi tak tersisa di
              perjalanan -- seperti pesan yang kacau dalam permainan bisik berantai seratus orang. Dengan
              penjumlahan, sinyal lewat lurus melalui setiap tanda tambah tanpa berkurang, sehingga lapisan 1
              dari model 100 lapisan pun mendengar jelas apa yang harus ia perbaiki. Layer norm, langkah kecil
              yang akan sering kamu dengar seputar transformer, hanyalah kenop volume: dengan lusinan editor
              menambah catatan, angka-angkanya akan melantur makin besar, dan layer norm menskalakan ulang ke
              ukuran yang mantap. Kestabilan, bukan kecerdasan.
            </p>
          }
        />
        <ScopeScreen label="Residual stream diagram: attention and MLP sublayers read from and add back into a shared horizontal stream">
          <svg viewBox="0 0 400 130" width="100%" height="150" aria-label="Residual stream diagram with attention and MLP sublayers tapping into a shared horizontal bus via addition junctions">
            <line x1={20} y1={20} x2={380} y2={20} stroke={colors.cyan} strokeWidth={3} className="residual-stream-line" />
            <text x={20} y={12} fontSize={10} fontFamily="monospace" fill={colors.muted}>RESIDUAL STREAM</text>

            {[
              { cx: 130, label: "ATTENTION", color: colors.amber },
              { cx: 290, label: "MLP", color: colors.magenta },
            ].map((s) => (
              <g key={s.label}>
                <line x1={s.cx} y1={20} x2={s.cx} y2={55} stroke={colors.border} strokeWidth={2} />
                <rect x={s.cx - 55} y={55} width={110} height={34} rx={6} fill={colors.panel2} stroke={s.color} />
                <text x={s.cx} y={76} fontSize={11} textAnchor="middle" fontFamily="monospace" fill={s.color}>{s.label}</text>
                <line x1={s.cx} y1={89} x2={s.cx} y2={112} stroke={colors.border} strokeWidth={2} />
                <circle cx={s.cx} cy={20} r={9} fill={colors.screen} stroke={colors.text} strokeWidth={1.5} />
                <text x={s.cx} y={24} fontSize={12} textAnchor="middle" fill={colors.text}>+</text>
              </g>
            ))}
          </svg>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Attention talks, the MLP thinks", "Atensi bicara, MLP berpikir")}>
        <Bi
          en={
            <p>
              A useful way to remember the division of labor: attention is the talking step -- the only
              moment a word's vector can be influenced by other words. The <strong>MLP</strong> (short for
              "multi-layer perceptron," a small stack of number-crunching operations) is the thinking step:
              it takes one word's vector, alone, and transforms it, with zero visibility into any other word.
              Concretely, the MLP stretches the vector out to about 4 times its width, applies a simple
              filter, and squeezes it back down -- and at that ratio it holds roughly two-thirds of a layer's
              learned numbers (you'll verify that split with real numbers in lesson 1.9).
            </p>
          }
          id={
            <p>
              Cara berguna mengingat pembagian kerjanya: atensi adalah langkah bicara -- satu-satunya momen
              vektor sebuah kata bisa dipengaruhi kata lain. <strong>MLP</strong> (singkatan "multi-layer
              perceptron", tumpukan kecil operasi pengolah angka) adalah langkah berpikir: ia mengambil
              vektor satu kata, sendirian, dan mengubahnya, tanpa bisa melihat kata lain sama sekali.
              Konkretnya, MLP merentangkan vektor sampai sekitar 4 kali lebarnya, menerapkan saringan
              sederhana, lalu memerasnya kembali -- dan pada rasio itu ia memegang kira-kira dua pertiga
              angka hasil belajar sebuah lapisan (kamu akan memastikan pembagian itu dengan angka sungguhan
              di pelajaran 1.9).
            </p>
          }
        />
        <Bi
          en={
            <p>
              All that capacity isn't sitting idle. Researchers who've looked inside these models find that
              the MLP behaves a lot like a giant bank of if-then flashcards: the first half learns to
              recognize patterns in the incoming vector ("this looks like a city name in a sentence about
              geography"), and the second half writes relevant information back in when a pattern fires
              ("cities go with countries"). The flashcards in early layers tend to fire on surface-level
              things -- the previous word, exact repeats, punctuation. The ones in deeper layers fire on more
              abstract, built-up structure, including stored facts. That's a tendency researchers observe
              across many models, not a strict rule every layer obeys.
            </p>
          }
          id={
            <p>
              Kapasitas sebesar itu tidak menganggur. Para peneliti yang mengintip ke dalam model-model ini
              menemukan MLP berperilaku sangat mirip bank raksasa kartu hafalan jika-maka: paruh pertama
              belajar mengenali pola di vektor yang masuk ("ini kelihatan seperti nama kota di kalimat
              tentang geografi"), dan paruh kedua menuliskan kembali informasi yang relevan saat sebuah pola
              menyala ("kota berpasangan dengan negara"). Kartu-kartu di lapisan awal cenderung menyala pada
              hal-hal di permukaan -- kata sebelumnya, pengulangan persis, tanda baca. Yang di lapisan lebih
              dalam menyala pada struktur yang lebih abstrak dan tersusun, termasuk fakta yang tersimpan. Itu
              kecenderungan yang diamati peneliti di banyak model, bukan aturan kaku yang dipatuhi setiap
              lapisan.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
