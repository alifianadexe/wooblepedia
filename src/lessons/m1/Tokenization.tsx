import { useMemo, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { getLessonMeta } from "../../lib/syllabus";
import { bpeEncodeText, trainBPE, END_OF_WORD, type BPEMergeStep } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(1, "tokenization")!;

const CORPUS_WORDS = [
  ...Array(6).fill("low"),
  ...Array(2).fill("lower"),
  ...Array(2).fill("lowest"),
  ...Array(7).fill("newest"),
  ...Array(3).fill("new"),
  ...Array(3).fill("newer"),
  ...Array(4).fill("wide"),
  ...Array(3).fill("wider"),
  ...Array(3).fill("widest"),
];

const MAX_MERGES = 14;
const ALL_STEPS = trainBPE(CORPUS_WORDS, MAX_MERGES);

function buildVocab(steps: BPEMergeStep[]): string[] {
  const base = Array.from(new Set([...CORPUS_WORDS.join("").split(""), END_OF_WORD])).sort();
  const vocab = [...base];
  for (const step of steps) {
    if (!vocab.includes(step.merged)) vocab.push(step.merged);
  }
  return vocab;
}

export default function Tokenization() {
  const { lang } = useLang();
  const [numMerges, setNumMerges] = useLabSetting("m1-tokenization-merges", 0);
  const [sample, setSample] = useState("newest widening lowered");

  const activeSteps = ALL_STEPS.slice(0, numMerges);
  const vocab = useMemo(() => buildVocab(activeSteps), [numMerges]);

  const sampleTokens = useMemo(() => bpeEncodeText(sample, activeSteps), [sample, numMerges]);
  const visibleTokens = sampleTokens.filter((t) => !/^\s+$/.test(t));
  const charCount = sample.replace(/\s+/g, "").length;
  const ratio = visibleTokens.length > 0 ? (charCount / visibleTokens.length).toFixed(2) : "—";

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              A model can only do math on numbers, so before anything else happens, your text has to become a
              list of numbers. That's the tokenizer's whole job: chop text into pieces (<strong>tokens</strong>)
              and replace each piece with its ID number, the same way every time -- like an old telegraph
              codebook where every common word or word-chunk has its own code. Nothing about it is learned or
              smart: its entire "vocabulary" is a plain list you could open and read in a text editor.
            </p>
          }
          id={
            <p>
              Model hanya bisa berhitung dengan angka, jadi sebelum apa pun terjadi, teksmu harus menjadi
              deretan angka. Itulah seluruh tugas tokenizer: memotong teks menjadi kepingan
              (<strong>token</strong>) dan mengganti tiap kepingan dengan nomor ID-nya, dengan cara yang sama
              setiap saat -- seperti buku kode telegraf zaman dulu di mana setiap kata atau penggalan kata
              umum punya kodenya sendiri. Tidak ada yang dipelajari atau pintar di sini: seluruh
              "kosakatanya" hanyalah daftar biasa yang bisa kamu buka dan baca di editor teks.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Byte-pair encoding (BPE) starts from single characters and repeatedly glues together whichever pair of neighbors shows up most often in the training text -- that's the entire training algorithm, just counting.",
          "What it produces is a plain list of glue rules plus an ID number for each piece. No learning, no weights -- completely different from the embedding table (next lesson), which is learned.",
          "Vocabulary size is a trade-off: more tokens in the codebook means any sentence splits into fewer pieces, but the model's lookup tables have to grow to hold a row for every token.",
          "Spaces, numbers that split inconsistently (\"2024\" vs. \"202\"+\"4\"), and non-English languages are where real tokenizer surprises happen -- not rare corner cases.",
          "The tokenizer's codebook, the embedding table, and a vector database are three totally different things that people mix up constantly -- keep them separate in your head.",
        ],
        [
          "Byte-pair encoding (BPE) mulai dari huruf-huruf tunggal lalu berulang kali merekatkan pasangan tetangga mana pun yang paling sering muncul di teks latihan -- itu seluruh algoritme pelatihannya, cuma menghitung.",
          "Hasilnya hanyalah daftar aturan rekat plus nomor ID untuk tiap kepingan. Tanpa pembelajaran, tanpa bobot -- sama sekali berbeda dari tabel embedding (pelajaran berikutnya), yang dipelajari.",
          "Ukuran kosakata adalah tarik-ulur: makin banyak token di buku kode, makin sedikit kepingan yang dihasilkan sebuah kalimat, tetapi tabel-tabel model harus membesar untuk memuat satu baris bagi setiap token.",
          "Spasi, angka yang terpecah tidak konsisten (\"2024\" vs. \"202\"+\"4\"), dan bahasa non-Inggris adalah tempat kejutan tokenizer sungguhan terjadi -- bukan kasus langka.",
          "Buku kode tokenizer, tabel embedding, dan vector database adalah tiga hal yang benar-benar berbeda dan terus-menerus tertukar -- jaga agar tetap terpisah di kepalamu.",
        ],
      )}
      references={[
        {
          title: "Neural Machine Translation of Rare Words with Subword Units — Sennrich et al., 2015",
          meta: "arXiv:1508.07909 — brought byte-pair encoding from data compression into NLP",
          url: "https://arxiv.org/abs/1508.07909",
        },
        {
          title: "Language Models are Unsupervised Multitask Learners (GPT-2) — Radford et al., 2019",
          meta: "OpenAI paper — byte-level BPE vocabulary and its practical quirks",
          url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf",
        },
        {
          title: "Let's build the GPT Tokenizer — Andrej Karpathy",
          meta: "video + minbpe repo — builds a BPE tokenizer from scratch on camera",
          url: "https://github.com/karpathy/minbpe",
        },
      ]}
    >
      <Section title={pick(lang, "Why not characters, or whole words?", "Kenapa bukan per huruf, atau per kata utuh?")}>
        <Bi
          en={
            <p>
              You could split text one letter at a time. The list of symbols stays tiny, but every sentence
              becomes enormously long, and long sequences make everything downstream slower and more
              expensive -- plus the model has to re-figure-out that "t", "h", "e" spells a common word every
              single time. Or you could go the other way and make every whole word its own token. Now
              sentences are short, but any word not in the dictionary -- a new slang term, a typo, a name --
              simply can't be represented at all, and covering every possible word form ("run", "runs",
              "running", "runner"...) makes the dictionary explode.
            </p>
          }
          id={
            <p>
              Kamu bisa saja memotong teks satu huruf demi satu huruf. Daftar simbolnya tetap mungil, tetapi
              setiap kalimat menjadi luar biasa panjang, dan barisan panjang membuat semua proses setelahnya
              lebih lambat dan lebih mahal -- ditambah lagi model harus menyimpulkan ulang bahwa "t", "h",
              "e" mengeja kata yang umum, setiap saat. Atau kamu bisa ke arah sebaliknya: jadikan setiap kata
              utuh token tersendiri. Kalimat memang jadi pendek, tetapi kata apa pun yang tak ada di kamus --
              istilah gaul baru, salah ketik, sebuah nama -- sama sekali tak bisa dituliskan, dan mencakup
              semua bentuk kata ("lari", "berlari", "pelari", "larinya"...) membuat kamusnya meledak.
            </p>
          }
        />
        <Bi
          en={
            <p>
              Byte-pair encoding is the practical middle ground: start from single characters (so <em>nothing</em>{" "}
              is ever impossible to write down), then let the training text itself vote on which letter-chunks
              appear often enough to earn their own token. Common words like "the" end up as a single token;
              rare or made-up words just fall back to smaller pieces, like "wooble" becoming "woo" + "ble".
            </p>
          }
          id={
            <p>
              Byte-pair encoding adalah jalan tengah yang praktis: mulai dari huruf tunggal (sehingga{" "}
              <em>tidak ada</em> yang mustahil dituliskan), lalu biarkan teks latihan sendiri yang memilih
              penggalan huruf mana yang cukup sering muncul untuk pantas mendapat token sendiri. Kata umum
              seperti "the" berakhir sebagai satu token; kata langka atau karangan tinggal mundur ke kepingan
              lebih kecil, seperti "wooble" menjadi "woo" + "ble".
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "The algorithm, exactly", "Algoritmenya, persis")}>
        <Bi
          en={
            <p>
              Here's how a BPE tokenizer gets built. Write every word in the training text as a string of
              single characters. Then look across all the words and count every pair of neighbors: how many
              times does "l" sit next to "o"? How about "e" next to "s"? Take the single most common pair,
              glue it together into one new symbol everywhere it appears, and write that glue rule down.
              Repeat, over and over, for however many rules you want. That's the whole thing -- no
              intelligence, no learning in the neural-network sense, just counting and gluing.
            </p>
          }
          id={
            <p>
              Begini cara tokenizer BPE dibuat. Tulis setiap kata di teks latihan sebagai untaian huruf
              tunggal. Lalu periksa semua kata dan hitung setiap pasangan tetangga: berapa kali "l" duduk di
              sebelah "o"? Bagaimana dengan "e" di sebelah "s"? Ambil satu pasangan yang paling sering,
              rekatkan menjadi satu simbol baru di semua tempat ia muncul, dan catat aturan rekat itu.
              Ulangi terus, sebanyak aturan yang kamu mau. Itu saja -- tanpa kecerdasan, tanpa pembelajaran
              ala jaringan saraf, hanya menghitung dan merekatkan.
            </p>
          }
        />
        <Bi
          en={
            <p>
              To tokenize <em>new</em> text later, you replay those glue rules in the order they were written
              down: split into single characters, then keep applying whichever rule was learned earliest,
              until no rules fit anymore. The lab below runs exactly this algorithm live in your browser --
              nothing is pre-baked or faked.
            </p>
          }
          id={
            <p>
              Untuk men-tokenisasi teks <em>baru</em> nantinya, kamu memutar ulang aturan-aturan rekat itu
              sesuai urutan pencatatannya: pecah menjadi huruf tunggal, lalu terus terapkan aturan yang
              paling awal dipelajari, sampai tidak ada aturan yang cocok lagi. Lab di bawah menjalankan
              algoritme ini persis, langsung di browsermu -- tidak ada yang disiapkan diam-diam atau dipalsukan.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — train a real tokenizer, then use it", "Lab — latih tokenizer sungguhan, lalu pakai")}>
        <Bi
          en={
            <p>
              The practice text below is tiny on purpose -- just word families like{" "}
              <em>low/lower/lowest</em> and <em>new/newer/newest</em> (the classic textbook example). Click
              "train next merge" and watch the rules appear one at a time; the frequency column shows you
              exactly why each pair won its round.
            </p>
          }
          id={
            <p>
              Teks latihan di bawah sengaja dibuat mungil -- hanya keluarga kata seperti{" "}
              <em>low/lower/lowest</em> dan <em>new/newer/newest</em> (contoh klasik di buku teks). Klik
              "train next merge" dan saksikan aturan muncul satu per satu; kolom frekuensi menunjukkan persis
              kenapa tiap pasangan memenangkan rondenya.
            </p>
          }
        />

        <ScopeScreen label="Byte-pair encoding merge trainer">
          <div className="btn-row">
            <button
              type="button"
              className="btn btn--primary"
              disabled={numMerges >= MAX_MERGES}
              onClick={() => setNumMerges(Math.min(MAX_MERGES, numMerges + 1))}
            >
              TRAIN NEXT MERGE ({numMerges}/{MAX_MERGES})
            </button>
            <button type="button" className="btn" onClick={() => setNumMerges(0)}>
              RESET
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr><th>rank</th><th>pair merged</th><th>result</th><th>frequency</th></tr>
            </thead>
            <tbody>
              {activeSteps.length === 0 && (
                <tr><td colSpan={4} style={{ color: "var(--muted)" }}>{pick(lang, 'No merges trained yet — click "train next merge."', 'Belum ada merge yang dilatih — klik "train next merge".')}</td></tr>
              )}
              {activeSteps.map((s) => (
                <tr key={s.rank}>
                  <td>{s.rank + 1}</td>
                  <td>"{s.pair[0]}" + "{s.pair[1]}"</td>
                  <td>"{s.merged}"</td>
                  <td>{s.frequency}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {pick(lang, "VOCAB SIZE SO FAR", "UKURAN KOSAKATA SEJAUH INI")}: {vocab.length}{" "}
            {pick(lang, "symbols", "simbol")} ({vocab.length - activeSteps.length}{" "}
            {pick(lang, "base", "dasar")} + {activeSteps.length} {pick(lang, "merged", "hasil merge")})
          </div>
        </ScopeScreen>

        <Bi
          en={
            <p style={{ marginTop: 20 }}>
              Now type anything -- including words the tiny training text above never saw -- and watch it get
              chopped up using whatever glue rules you've trained so far.
            </p>
          }
          id={
            <p style={{ marginTop: 20 }}>
              Sekarang ketik apa saja -- termasuk kata-kata yang tak pernah dilihat teks latihan mungil di
              atas -- dan saksikan teksmu dipotong-potong memakai aturan rekat apa pun yang sudah kamu latih.
            </p>
          }
        />

        <ScopeScreen label="Live byte-pair encoder for user-entered text">
          <input
            className="text-input"
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder="type any text…"
            aria-label="Text to tokenize"
          />
          <div style={{ marginTop: 14 }}>
            {sampleTokens.map((t, i) =>
              /^\s+$/.test(t) ? (
                <span key={i} style={{ display: "inline-block", width: 8 }} />
              ) : (
                <span className="token-chip" key={i}>
                  {t.replace(END_OF_WORD, "")}
                  <span style={{ color: "var(--muted)" }}> #{vocab.indexOf(t)}</span>
                </span>
              ),
            )}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 10 }}>
            {pick(
              lang,
              `${charCount} characters → ${visibleTokens.length} tokens (ratio ${ratio} chars/token). At 0 merges this is character-level; watch the ratio climb as you train more merges.`,
              `${charCount} karakter → ${visibleTokens.length} token (rasio ${ratio} karakter/token). Pada 0 merge ini setara per huruf; lihat rasionya naik saat kamu melatih lebih banyak merge.`,
            )}
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Three storage systems, never to be confused", "Tiga sistem penyimpanan yang jangan sampai tertukar")}>
        <Bi
          en={
            <p>
              The glue rules and ID numbers you just trained are a <strong>fixed file</strong> -- a codebook
              that never changes once written, no matter how much the model trains afterward. The{" "}
              <strong>embedding table</strong> (next lesson) is the opposite: a huge grid of learned numbers
              that training adjusts constantly. And a <strong>vector database</strong> (a tool you'll meet
              much later, used to help models look things up) is a third, completely separate thing that
              lives outside the model entirely. All three "store something about text," which is exactly why
              people mix them up all the time. Keeping them straight now will save you real confusion later.
            </p>
          }
          id={
            <p>
              Aturan rekat dan nomor ID yang barusan kamu latih adalah <strong>berkas tetap</strong> -- buku
              kode yang tak pernah berubah setelah ditulis, seberapa pun lamanya model berlatih setelahnya.{" "}
              <strong>Tabel embedding</strong> (pelajaran berikutnya) adalah kebalikannya: kisi raksasa berisi
              angka hasil belajar yang terus disetel oleh pelatihan. Dan <strong>vector database</strong>{" "}
              (alat yang akan kamu temui jauh nanti, dipakai untuk membantu model mencari informasi) adalah
              hal ketiga yang sepenuhnya terpisah dan hidup di luar model sama sekali. Ketiganya "menyimpan
              sesuatu tentang teks", dan justru itulah kenapa orang terus-menerus menukarnya. Merapikannya
              sekarang akan menyelamatkanmu dari kebingungan sungguhan nanti.
            </p>
          }
        />
      </Section>

      <Section
        title={pick(
          lang,
          "The vocabulary-size trade-off, and real bugs it causes",
          "Tarik-ulur ukuran kosakata, dan bug nyata akibatnya",
        )}
      >
        <Bi
          en={
            <p>
              A bigger codebook means any sentence splits into fewer, chunkier tokens -- which makes the model
              faster and cheaper to run, since cost grows with the number of tokens. But every token in the
              codebook needs its own row in the model's lookup tables, so those tables get bigger (you'll
              compute exactly how much in lesson 1.9). GPT-2 shipped with about 50,000 tokens; modern
              multilingual models often use over 128,000 so that languages like Thai or Burmese get fair
              treatment -- with an English-centric codebook, the same sentence in those languages can take 3-5
              times as many tokens, which quietly makes the model slower and more expensive for those users.
              And the everyday weirdness this causes is real: a space before a word can change its tokens
              entirely, "2024" might split as "202" + "4", and "Hello" vs. "hello" are different tokens. When
              a model behaves oddly about spelling or numbers, the tokenizer is often the reason.
            </p>
          }
          id={
            <p>
              Buku kode yang lebih besar berarti kalimat mana pun terpecah menjadi token yang lebih sedikit
              dan lebih gemuk -- membuat model lebih cepat dan lebih murah dijalankan, karena biaya tumbuh
              mengikuti jumlah token. Tetapi setiap token di buku kode butuh barisnya sendiri di tabel-tabel
              model, sehingga tabel itu ikut membesar (kamu akan menghitung persisnya di pelajaran 1.9).
              GPT-2 dirilis dengan sekitar 50.000 token; model multibahasa modern sering memakai lebih dari
              128.000 agar bahasa seperti Thai atau Burma diperlakukan adil -- dengan buku kode yang
              Inggris-sentris, kalimat yang sama di bahasa-bahasa itu bisa memakan 3-5 kali lebih banyak
              token, yang diam-diam membuat model lebih lambat dan lebih mahal bagi pengguna itu. Dan
              keanehan sehari-hari akibatnya nyata: spasi sebelum sebuah kata bisa mengubah token-tokennya
              sama sekali, "2024" bisa terpecah jadi "202" + "4", dan "Halo" vs. "halo" adalah token yang
              berbeda. Ketika model bertingkah aneh soal ejaan atau angka, tokenizer sering kali biang keroknya.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
