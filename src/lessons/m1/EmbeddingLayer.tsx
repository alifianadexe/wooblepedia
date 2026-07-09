import { useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { cosineSimilarity, dotProduct } from "../../lib/math";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(1, "embedding-layer")!;

interface WordPoint {
  word: string;
  id: number;
  x: number;
  y: number;
  cluster: string;
}

const WORDS: WordPoint[] = [
  { word: "cat", id: 0, x: -6, y: 5, cluster: "animal" },
  { word: "dog", id: 1, x: -5, y: 6.5, cluster: "animal" },
  { word: "bird", id: 2, x: -7, y: 6, cluster: "animal" },
  { word: "fish", id: 3, x: -6.5, y: 3.5, cluster: "animal" },
  { word: "run", id: 4, x: 5, y: 6, cluster: "verb" },
  { word: "jump", id: 5, x: 6.5, y: 5, cluster: "verb" },
  { word: "swim", id: 6, x: 4, y: 4.5, cluster: "verb" },
  { word: "fly", id: 7, x: 5.5, y: 3.5, cluster: "verb" },
  { word: "the", id: 8, x: 0.6, y: 0.3, cluster: "determiner" },
  { word: "a", id: 9, x: 0.3, y: -0.3, cluster: "determiner" },
  { word: "an", id: 10, x: 0.5, y: 0.1, cluster: "determiner" },
  { word: "this", id: 11, x: -0.3, y: 0.5, cluster: "determiner" },
  { word: "king", id: 12, x: -5, y: -4, cluster: "royalty" },
  { word: "queen", id: 13, x: -4, y: -5.5, cluster: "royalty" },
  { word: "man", id: 14, x: -6.5, y: -5, cluster: "royalty" },
  { word: "woman", id: 15, x: -5, y: -6.5, cluster: "royalty" },
];

const CLUSTER_COLOR: Record<string, string> = {
  animal: colors.cyan,
  verb: colors.amber,
  determiner: colors.muted,
  royalty: colors.magenta,
};

const SCALE = 15;
const CENTER = 150;
function toScreen(x: number, y: number): [number, number] {
  return [CENTER + x * SCALE, CENTER - y * SCALE];
}

export default function EmbeddingLayer() {
  const { lang } = useLang();
  const [selected, setSelected] = useState<number[]>([0, 12]);
  const [lookupId, setLookupId] = useState<number>(0);

  function toggleSelect(id: number) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev;
      if (prev.length < 2) return [...prev, id];
      return [prev[1], id];
    });
  }

  const wordA = WORDS.find((w) => w.id === selected[0]);
  const wordB = WORDS.find((w) => w.id === selected[1]);
  const cos = wordA && wordB ? cosineSimilarity([wordA.x, wordA.y], [wordB.x, wordB.y]) : null;
  const dot = wordA && wordB ? dotProduct([wordA.x, wordA.y], [wordB.x, wordB.y]) : null;

  const lookupWord = WORDS.find((w) => w.id === lookupId)!;

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              The tokenizer's output is just an ID number, and a number like 4,082 carries no meaning by
              itself. The embedding layer is where meaning enters the system. It's one giant table with a row
              for every token in the vocabulary, and each row holds a long list of numbers -- that token's
              coordinates in a kind of "meaning space," where words used in similar ways sit near each other.
              Using it couldn't be simpler: given token number 4,082, go fetch row 4,082. That's it.
            </p>
          }
          id={
            <p>
              Keluaran tokenizer hanyalah nomor ID, dan angka seperti 4.082 tidak membawa makna apa pun
              sendirian. Lapisan embedding adalah tempat makna masuk ke sistem. Ia satu tabel raksasa dengan
              satu baris untuk setiap token di kosakata, dan tiap baris memuat deretan angka panjang --
              koordinat token itu dalam semacam "ruang makna", tempat kata-kata yang dipakai dengan cara
              serupa duduk berdekatan. Cara memakainya tak bisa lebih sederhana lagi: diberi token nomor
              4.082, ambil baris ke-4.082. Selesai.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "The embedding table is learned: training constantly nudges every row, unlike the tokenizer's fixed codebook, which never changes.",
          "A token's embedding is its position in meaning space. How related two words are gets measured by the angle between their arrows (cosine similarity), not by how long the arrows are.",
          "Tokenizer codebook (a fixed file), embedding table (learned numbers inside the model), and vector databases (a separate tool outside the model) are three different things -- don't blur them together.",
          "Many models reuse this same table at the very end of the pipeline too (turning final vectors back into token scores), roughly halving that cost -- you'll use this fact in lesson 1.9's accounting.",
        ],
        [
          "Tabel embedding itu dipelajari: pelatihan terus-menerus menggeser setiap barisnya -- berbeda dari buku kode tokenizer yang tetap dan tak pernah berubah.",
          "Embedding sebuah token adalah posisinya di ruang makna. Seberapa berkaitan dua kata diukur dari sudut antara panah keduanya (cosine similarity), bukan dari panjang panahnya.",
          "Buku kode tokenizer (berkas tetap), tabel embedding (angka hasil belajar di dalam model), dan vector database (alat terpisah di luar model) adalah tiga hal berbeda -- jangan dilebur jadi satu.",
          "Banyak model memakai ulang tabel yang sama ini di ujung akhir jalur (mengubah vektor akhir kembali menjadi skor token), memangkas biayanya kira-kira separuh -- fakta ini akan kamu pakai di perhitungan pelajaran 1.9.",
        ],
      )}
      references={[
        {
          title: "Distributed Representations of Words and Phrases and their Compositionality — Mikolov et al., 2013",
          meta: "arXiv:1301.3781 — the word2vec paper that popularized learned dense word vectors",
          url: "https://arxiv.org/abs/1301.3781",
        },
        {
          title: "The Illustrated Word2vec — Jay Alammar",
          meta: "blog — intuitive walkthrough of embeddings and analogical structure",
          url: "https://jalammar.github.io/illustrated-word2vec/",
        },
        {
          title: "Using the Output Embedding to Improve Language Models — Press & Wolf, 2016",
          meta: "arXiv:1608.05859 — the weight-tying result referenced above",
          url: "https://arxiv.org/abs/1608.05859",
        },
      ]}
    >
      <Section title={pick(lang, "A table lookup, not a calculation", "Sekadar mencari di tabel, bukan menghitung")}>
        <Bi
          en={
            <p>
              Everything after this layer -- attention, the MLP -- works on vectors (those lists of numbers),
              never on the raw ID numbers. So the embedding layer's entire job is the swap: token number in,
              row of the table out. No math happens here at all when the model runs -- it's like flipping to a
              page in a book. What makes the rows <em>meaningful</em> is what happened during training. Every
              time the model practiced predicting text, the training process nudged these rows a tiny bit, and
              after trillions of nudges, words that show up in similar sentences ("cat" and "dog," "king" and
              "queen") ended up with similar rows. Nobody planned that layout -- it emerged.
            </p>
          }
          id={
            <p>
              Semua yang datang setelah lapisan ini -- attention, MLP -- bekerja pada vektor (deretan angka itu),
              tak pernah pada nomor ID mentah. Jadi seluruh tugas lapisan embedding hanyalah penukaran: nomor
              token masuk, baris tabel keluar. Tidak ada matematika sama sekali di sini saat model berjalan --
              seperti membuka halaman tertentu di sebuah buku. Yang membuat baris-barisnya <em>bermakna</em>{" "}
              adalah apa yang terjadi selama pelatihan. Setiap kali model berlatih menebak teks, proses
              pelatihan menggeser baris-baris ini sedikit demi sedikit, dan setelah triliunan geseran,
              kata-kata yang muncul di kalimat serupa ("kucing" dan "anjing", "raja" dan "ratu") berakhir
              dengan baris yang serupa. Tidak ada yang merancang tata letak itu -- ia muncul sendiri.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Meaning space, measured with cosine similarity", "Ruang makna, diukur dengan cosine similarity")}>
        <Bi
          en={
            <p>
              Click any two words below. This toy meaning space uses just 2 numbers per word so you can
              actually see it as a map -- real models use hundreds or thousands of numbers per word, which
              works the same way but can't be drawn. Each word is an arrow from the center of the map to its
              spot. The "cosine similarity" computed underneath measures the <em>angle</em> between the two
              arrows: pointing the same way scores near 1 (very related), at right angles scores near 0
              (unrelated), and opposite ways scores negative. Direction is what matters, not how long the
              arrows are.
            </p>
          }
          id={
            <p>
              Klik dua kata mana pun di bawah. Ruang makna mainan ini hanya memakai 2 angka per kata agar
              benar-benar bisa kamu lihat sebagai peta -- model sungguhan memakai ratusan atau ribuan angka
              per kata, yang bekerja dengan cara sama tetapi tak bisa digambar. Setiap kata adalah panah dari
              pusat peta ke titiknya. "Cosine similarity" yang dihitung di bawahnya mengukur <em>sudut</em>{" "}
              antara kedua panah: menunjuk ke arah yang sama nilainya mendekati 1 (sangat berkaitan), tegak
              lurus mendekati 0 (tak berkaitan), dan berlawanan arah bernilai negatif. Arah yang penting,
              bukan panjang panahnya.
            </p>
          }
        />
        <ScopeScreen label="2D toy embedding space with clickable words and live cosine similarity">
          <svg viewBox="0 0 300 300" width="100%" height="320" aria-label="Scatter plot of toy word embeddings in 2D meaning space">
            <line x1={0} y1={CENTER} x2={300} y2={CENTER} stroke={colors.border} strokeWidth={1} />
            <line x1={CENTER} y1={0} x2={CENTER} y2={300} stroke={colors.border} strokeWidth={1} />

            {wordA && (
              <line
                x1={CENTER} y1={CENTER}
                x2={toScreen(wordA.x, wordA.y)[0]} y2={toScreen(wordA.x, wordA.y)[1]}
                stroke={colors.amber} strokeWidth={2} markerEnd="url(#arrowA)"
              />
            )}
            {wordB && (
              <line
                x1={CENTER} y1={CENTER}
                x2={toScreen(wordB.x, wordB.y)[0]} y2={toScreen(wordB.x, wordB.y)[1]}
                stroke={colors.cyan} strokeWidth={2} markerEnd="url(#arrowB)"
              />
            )}
            <defs>
              <marker id="arrowA" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="3" fill={colors.amber} />
              </marker>
              <marker id="arrowB" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
                <circle cx="4" cy="4" r="3" fill={colors.cyan} />
              </marker>
            </defs>

            {WORDS.map((w) => {
              const [sx, sy] = toScreen(w.x, w.y);
              const isSelected = selected.includes(w.id);
              return (
                <g
                  key={w.id}
                  onClick={() => toggleSelect(w.id)}
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  role="button"
                  aria-label={`Select word ${w.word}`}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") toggleSelect(w.id); }}
                >
                  <circle cx={sx} cy={sy} r={isSelected ? 6 : 4} fill={CLUSTER_COLOR[w.cluster]} stroke={isSelected ? colors.text : "none"} strokeWidth={1.5} />
                  <text x={sx + 8} y={sy + 4} fontSize={11} fontFamily="monospace" fill={colors.text}>{w.word}</text>
                </g>
              );
            })}
          </svg>

          <div className="mono" style={{ fontSize: 13, marginTop: 8 }}>
            <span style={{ color: colors.amber }}>{wordA?.word ?? "—"}</span> = [{wordA?.x}, {wordA?.y}] &nbsp;·&nbsp;
            <span style={{ color: colors.cyan }}>{wordB?.word ?? "—"}</span> = [{wordB?.x}, {wordB?.y}]
          </div>
          <div className="mono" style={{ fontSize: 14, marginTop: 6 }}>
            dot product = {dot?.toFixed(3) ?? "—"} &nbsp;|&nbsp; cosine similarity ={" "}
            <strong style={{ color: colors.green }}>{cos?.toFixed(3) ?? "—"}</strong>
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            {pick(
              lang,
              "Try cat vs. dog (same cluster, high similarity), cat vs. run (unrelated, near zero), or king vs. queen (royalty cluster, high similarity despite king/queen being far from the animal cluster).",
              "Coba cat vs. dog (satu kelompok, kemiripan tinggi), cat vs. run (tak berkaitan, mendekati nol), atau king vs. queen (kelompok kerajaan, kemiripan tinggi walau jauh dari kelompok hewan).",
            )}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "The lookup, made literal", "Pencarian barisnya, dibuat harfiah")}>
        <Bi
          en={
            <p>
              Click a token below and watch its row get fetched. This really is everything the embedding
              layer does while the model runs: number in, row out.
            </p>
          }
          id={
            <p>
              Klik sebuah token di bawah dan lihat barisnya diambil. Sungguh, inilah seluruh pekerjaan
              lapisan embedding saat model berjalan: nomor masuk, baris keluar.
            </p>
          }
        />
        <ScopeScreen label="Embedding matrix row lookup by token id">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
            {WORDS.map((w) => (
              <button
                key={w.id}
                type="button"
                className="btn"
                onClick={() => setLookupId(w.id)}
                aria-pressed={lookupId === w.id}
                style={{
                  borderColor: lookupId === w.id ? colors.cyan : undefined,
                  color: lookupId === w.id ? colors.cyan : undefined,
                }}
              >
                #{w.id} {w.word}
              </button>
            ))}
          </div>
          <table className="data-table">
            <thead><tr><th>id</th><th>token</th><th>dim0</th><th>dim1</th></tr></thead>
            <tbody>
              {WORDS.map((w) => (
                <tr key={w.id} style={{ background: w.id === lookupId ? "var(--panel-2)" : undefined }}>
                  <td>{w.id}</td><td>{w.word}</td><td>{w.x}</td><td>{w.y}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mono" style={{ fontSize: 13, marginTop: 10, color: colors.green }}>
            row fetched: embeddings[{lookupId}] = [{lookupWord.x}, {lookupWord.y}]
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Three storage systems, restated", "Tiga sistem penyimpanan, ditegaskan lagi")}>
        <Bi
          en={
            <p>
              This lesson's table, the tokenizer's glue rules from lesson 1.2, and a vector database are easy
              to blur together because all three "store something about text." But they don't overlap at all.
              The tokenizer's codebook is a fixed file that never learns anything. The embedding table here is
              made of learned numbers inside the model, adjusted throughout training. A vector database is a
              separate piece of software outside the model entirely -- a searchable filing cabinet where you
              can store descriptions of whole documents so a model can look things up later (covered much
              later in this course). Confusing "the embedding table" with "a vector database" is one of the
              most common mix-ups newcomers make; they solve completely different problems.
            </p>
          }
          id={
            <p>
              Tabel di pelajaran ini, aturan rekat tokenizer dari pelajaran 1.2, dan vector database mudah
              melebur di kepala karena ketiganya "menyimpan sesuatu tentang teks". Padahal mereka sama sekali
              tak tumpang tindih. Buku kode tokenizer adalah berkas tetap yang tak pernah belajar apa pun.
              Tabel embedding di sini terbuat dari angka hasil belajar di dalam model, disetel sepanjang
              pelatihan. Vector database adalah perangkat lunak terpisah di luar model sepenuhnya -- lemari
              arsip yang bisa dicari, tempat menyimpan gambaran dokumen-dokumen utuh supaya model bisa mencari
              informasi nanti (dibahas jauh di belakang kursus ini). Menukar "tabel embedding" dengan "vector
              database" adalah salah satu kekeliruan paling umum para pemula; keduanya menyelesaikan masalah
              yang sama sekali berbeda.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Weight tying, previewed", "Weight tying, sekilas")}>
        <Bi
          en={
            <p>
              Here's a neat trick to file away. At the very end of the model, a final layer has to turn a
              vector back into a score for every token in the vocabulary -- meaning it needs a table of
              exactly the same size as this one, just used in the reverse direction. Many models, including
              GPT-2, simply reuse the same table for both jobs instead of storing two. It's called "weight
              tying," it saves a meaningful chunk of the model's total size, and you'll use it directly when
              you add up a real model's parameter count in lesson 1.9.
            </p>
          }
          id={
            <p>
              Ini trik rapi untuk disimpan. Di ujung paling akhir model, sebuah lapisan terakhir harus
              mengubah vektor kembali menjadi skor untuk setiap token di kosakata -- artinya ia butuh tabel
              berukuran persis sama dengan yang ini, hanya dipakai ke arah sebaliknya. Banyak model, termasuk
              GPT-2, memilih memakai ulang tabel yang sama untuk kedua tugas alih-alih menyimpan dua. Namanya
              "weight tying", ia menghemat porsi berarti dari ukuran total model, dan akan kamu pakai langsung
              saat menjumlahkan parameter model sungguhan di pelajaran 1.9.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
