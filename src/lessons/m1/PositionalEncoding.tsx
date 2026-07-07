import { useEffect, useMemo, useRef } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { buildSinusoidalPEMatrix, sinusoidalPE } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(1, "positional-encoding")!;

const D_MODEL = 64;
const NUM_POSITIONS = 128;
const MATRIX = buildSinusoidalPEMatrix(NUM_POSITIONS, D_MODEL);

function divergeColor(v: number): string {
  const t = Math.min(1, Math.abs(v));
  return v >= 0 ? `rgba(255,180,84,${0.12 + 0.85 * t})` : `rgba(62,219,211,${0.12 + 0.85 * t})`;
}

function PEHeatmap({ highlightPos }: { highlightPos: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const cellW = canvas.width / NUM_POSITIONS;
    const cellH = canvas.height / D_MODEL;
    for (let pos = 0; pos < NUM_POSITIONS; pos++) {
      for (let d = 0; d < D_MODEL; d++) {
        ctx.fillStyle = divergeColor(MATRIX[pos][d]);
        ctx.fillRect(pos * cellW, d * cellH, cellW + 0.6, cellH + 0.6);
      }
    }
    // highlight column for the selected position
    ctx.strokeStyle = colors.text;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(highlightPos * cellW, 0, cellW, canvas.height);
  }, [highlightPos]);

  return (
    <canvas
      ref={canvasRef}
      width={NUM_POSITIONS * 3}
      height={D_MODEL * 4}
      role="img"
      aria-label="Heatmap of the sinusoidal positional encoding matrix across 128 positions (horizontal) and 64 dimensions (vertical), amber for positive values and cyan for negative"
      style={{ width: "100%", height: "auto", imageRendering: "pixelated", display: "block" }}
    />
  );
}

const BASE_EMBED = [0.9, 0.1, 0.0, 0.2, 0.5, 0.3, 0.1, 0.6];

export default function PositionalEncoding() {
  const { lang } = useLang();
  const [position, setPosition] = useLabSetting("m1-pe-position", 4);
  const [compareOn, setCompareOn] = useLabSetting("m1-pe-compare", true);

  const rowTrace = useMemo(() => MATRIX[position], [position]);

  const vecAt0 = useMemo(() => BASE_EMBED.map((v, d) => v + sinusoidalPE(0, d, 8)), []);
  const vecAtP = useMemo(() => BASE_EMBED.map((v, d) => v + sinusoidalPE(4, d, 8)), []);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Here's a strange fact about the attention step coming up in the next lesson: on its own, it
              can't tell what order the tokens came in. It treats a sentence like a bag of words -- "the cat
              sat" and "sat the cat" look identical to it. But word order obviously matters ("dog bites man"
              is not "man bites dog"), so order has to be smuggled in as part of the data itself. Positional
              encoding is how: before anything else happens, every token's vector gets a "position stamp"
              mixed in -- a unique numerical pattern that says "I'm word #1," "I'm word #2," and so on.
            </p>
          }
          id={
            <p>
              Ada fakta aneh tentang langkah atensi yang akan datang di pelajaran berikutnya: sendirian, ia
              tak bisa tahu urutan kedatangan token. Ia memperlakukan kalimat seperti sekantong kata --
              "kucing itu duduk" dan "duduk itu kucing" terlihat identik baginya. Padahal urutan kata jelas
              penting ("anjing menggigit orang" bukanlah "orang menggigit anjing"), jadi urutan harus
              diselundupkan sebagai bagian dari datanya sendiri. Pengodean posisi adalah caranya: sebelum apa
              pun terjadi, vektor tiap token dicampuri "stempel posisi" -- pola angka unik yang berkata "aku
              kata ke-1", "aku kata ke-2", dan seterusnya.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Attention on its own is order-blind: without position information, \"the cat sat\" and \"sat the cat\" would come out exactly the same.",
          "The classic fix adds a fixed wave pattern (made of sines and cosines) to every token's vector -- no learning involved, just a formula.",
          "The pattern mixes fast waves and slow waves, like a clock's second hand and hour hand: fast ones tell nearby positions apart, slow ones say roughly where you are overall, and together every position gets a unique stamp.",
          "The same word at two different positions really does become two different vectors -- the lab below computes this live rather than just claiming it.",
          "Most modern models use a newer scheme called RoPE, which encodes how far apart two words are rather than each word's absolute spot -- and that handles longer texts much more gracefully.",
        ],
        [
          "Atensi sendirian buta urutan: tanpa informasi posisi, \"kucing itu duduk\" dan \"duduk itu kucing\" keluar persis sama.",
          "Perbaikan klasiknya menambahkan pola gelombang tetap (dari sinus dan kosinus) ke vektor tiap token -- tanpa pembelajaran, murni rumus.",
          "Polanya mencampur gelombang cepat dan lambat, seperti jarum detik dan jarum jam: yang cepat membedakan posisi bertetangga, yang lambat menunjukkan kira-kira di mana kamu berada, dan bersama-sama setiap posisi mendapat stempel unik.",
          "Kata yang sama di dua posisi berbeda sungguh menjadi dua vektor berbeda -- lab di bawah menghitungnya langsung, bukan sekadar mengklaim.",
          "Kebanyakan model modern memakai skema lebih baru bernama RoPE, yang mengodekan seberapa jauh dua kata terpisah alih-alih posisi mutlak tiap kata -- dan itu menangani teks panjang jauh lebih anggun.",
        ],
      )}
      references={[
        {
          title: "Attention Is All You Need, §3.5 — Vaswani et al., 2017",
          meta: "arXiv:1706.03762 — the original sinusoidal positional encoding formula",
          url: "https://arxiv.org/abs/1706.03762",
        },
        {
          title: "RoFormer: Enhanced Transformer with Rotary Position Embedding — Su et al., 2021",
          meta: "arXiv:2104.09864 — RoPE, the rotation-based scheme used by most current open models",
          url: "https://arxiv.org/abs/2104.09864",
        },
        {
          title: "Transformer Architecture: The Positional Encoding — Amirhossein Kazemnejad",
          meta: "blog — a widely-cited intuition-first explanation of the sinusoidal scheme",
          url: "https://kazemnejad.com/blog/transformer_architecture_positional_encoding/",
        },
      ]}
    >
      <Section title={pick(lang, "Why order has to be mixed into the data", "Kenapa urutan harus dicampurkan ke dalam data")}>
        <Bi
          en={
            <p>
              Imagine someone hands you a stack of photos from a trip with no dates written on them and the
              stack already shuffled. No amount of staring will recover which photo came first -- the order
              information simply isn't there. Attention receives tokens in exactly that condition: a
              collection, not a sequence. Positional encoding is the fix, and it works like writing the date
              on the back of each photo before shuffling: a position-dependent pattern is added directly into
              each token's vector before the first attention layer ever runs, so "order" travels with the
              data itself instead of being something the machinery has to track separately.
            </p>
          }
          id={
            <p>
              Bayangkan seseorang menyerahkan setumpuk foto liburan tanpa tanggal tertulis, dan tumpukannya
              sudah teracak. Sekuat apa pun menatapnya, kamu tak akan bisa memulihkan foto mana yang lebih
              dulu -- informasi urutannya memang tidak ada. Atensi menerima token persis dalam kondisi itu:
              sebuah kumpulan, bukan barisan. Pengodean posisi adalah perbaikannya, dan cara kerjanya seperti
              menuliskan tanggal di belakang tiap foto sebelum diacak: pola yang bergantung posisi ditambahkan
              langsung ke vektor tiap token sebelum lapisan atensi pertama berjalan, sehingga "urutan" ikut
              bepergian bersama datanya sendiri, bukan sesuatu yang harus dilacak mesin secara terpisah.
            </p>
          }
        />
      </Section>

      <Section
        title={pick(
          lang,
          "The wave formula, and why it uses many speeds at once",
          "Rumus gelombangnya, dan kenapa memakai banyak kecepatan sekaligus",
        )}
      >
        <Bi
          en={
            <p>
              The original transformer built each position stamp out of waves -- the smooth, repeating sine
              and cosine curves from math class. Each slot in the vector gets its own wave, and each wave
              repeats at a different speed. For position <code>pos</code>, slot <code>2i</code> gets a sine
              and slot <code>2i+1</code> gets a cosine:
            </p>
          }
          id={
            <p>
              Transformer yang asli membangun tiap stempel posisi dari gelombang -- kurva sinus dan kosinus
              yang mulus dan berulang dari pelajaran matematika. Tiap slot di vektor mendapat gelombangnya
              sendiri, dan tiap gelombang berulang dengan kecepatan berbeda. Untuk posisi <code>pos</code>,
              slot <code>2i</code> mendapat sinus dan slot <code>2i+1</code> mendapat kosinus:
            </p>
          }
        />
        <p className="mono" style={{ fontSize: 14 }}>
          PE(pos, 2i) = sin(pos / 10000^(2i/d)) &nbsp;&nbsp; PE(pos, 2i+1) = cos(pos / 10000^(2i/d))
        </p>
        <Bi
          en={
            <p>
              The formula looks scary, but the idea is a clock face. The second hand spins fast: it can tell
              two nearby moments apart but says nothing about the hour. The hour hand moves slowly: it tells
              you the big picture but not the fine detail. Neither hand alone pins down the time -- both
              together do. Same here: the fast waves tell neighboring positions apart, the slow waves say
              roughly where you are in the whole text, and the full combination gives every single position a
              pattern that belongs to it alone.
            </p>
          }
          id={
            <p>
              Rumusnya terlihat seram, tetapi idenya adalah jam dinding. Jarum detik berputar cepat: ia bisa
              membedakan dua saat yang berdekatan tetapi tak berkata apa pun soal jamnya. Jarum jam bergerak
              lambat: ia memberi gambaran besar tetapi bukan detail halus. Satu jarum saja tak bisa
              memastikan waktu -- keduanya bersama bisa. Sama di sini: gelombang cepat membedakan posisi
              bertetangga, gelombang lambat menunjukkan kira-kira di mana kamu berada di seluruh teks, dan
              kombinasi penuhnya memberi setiap posisi pola yang jadi miliknya sendiri.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — the real PE matrix, and one row of it", "Lab — matriks PE sungguhan, dan satu barisnya")}>
        <Bi
          en={
            <p>
              Below is the real wave pattern for a vector of 64 numbers across 128 positions, computed live.
              Every column is one position's stamp; amber means a positive number, cyan means negative. Drag
              the slider to pick a position -- that column gets outlined, and its 64 values are drawn as a
              wiggly line underneath. Notice how the top rows flicker rapidly as you slide (the fast waves)
              while the bottom rows barely change (the slow waves).
            </p>
          }
          id={
            <p>
              Di bawah ini pola gelombang sungguhan untuk vektor 64 angka pada 128 posisi, dihitung langsung.
              Setiap kolom adalah stempel satu posisi; kuning berarti angka positif, biru kehijauan berarti
              negatif. Geser slider untuk memilih posisi -- kolom itu diberi garis tepi, dan 64 nilainya
              digambar sebagai garis bergelombang di bawahnya. Perhatikan baris-baris atas berkedip cepat
              saat kamu menggeser (gelombang cepat) sementara baris bawah nyaris tak berubah (gelombang lambat).
            </p>
          }
        />
        <ScopeScreen label="Sinusoidal positional encoding heatmap and single-position waveform">
          <PEHeatmap highlightPos={position} />
          <div style={{ marginTop: 16 }}>
            <Slider label="POSITION" value={position} min={0} max={NUM_POSITIONS - 1} onChange={setPosition} />
          </div>
          <svg viewBox="0 0 384 100" width="100%" height="100" aria-label={`Waveform of the 64 positional encoding values at position ${position}`}>
            <line x1={0} y1={50} x2={384} y2={50} stroke={colors.border} strokeWidth={1} />
            <polyline
              fill="none"
              stroke={colors.amber}
              strokeWidth={1.5}
              points={rowTrace.map((v, d) => `${(d / (D_MODEL - 1)) * 384},${50 - v * 45}`).join(" ")}
            />
          </svg>
        </ScopeScreen>
      </Section>

      <Section
        title={pick(
          lang,
          "Lab — the same token, two positions, two different vectors",
          "Lab — token sama, dua posisi, dua vektor berbeda",
        )}
      >
        <Bi
          en={
            <p>
              Flip the toggle: the word "the" starts from the identical table row both times (lesson 1.3's
              lookup never changes). The only difference is which position stamp gets added -- position 0's or
              position 4's -- and that alone is enough to make the two final vectors genuinely different by
              the time the attention layer sees them.
            </p>
          }
          id={
            <p>
              Balik sakelarnya: kata "the" berangkat dari baris tabel yang identik di kedua kesempatan
              (pencarian di pelajaran 1.3 tak pernah berubah). Satu-satunya perbedaan adalah stempel posisi
              mana yang ditambahkan -- milik posisi 0 atau posisi 4 -- dan itu saja sudah cukup membuat kedua
              vektor akhirnya sungguh berbeda saat tiba di lapisan atensi.
            </p>
          }
        />
        <ScopeScreen label="Comparison of the same token embedding at two different positions">
          <Toggle label="SHOW POSITION 4 INSTEAD OF POSITION 0" checked={compareOn} onChange={setCompareOn} />
          <table className="data-table" style={{ marginTop: 10 }}>
            <thead><tr><th>dim</th>{BASE_EMBED.map((_, d) => <th key={d}>{d}</th>)}</tr></thead>
            <tbody>
              <tr>
                <td>"the" embedding</td>
                {BASE_EMBED.map((v, d) => <td key={d}>{v.toFixed(2)}</td>)}
              </tr>
              <tr>
                <td>+ PE(pos={compareOn ? 4 : 0})</td>
                {BASE_EMBED.map((_, d) => <td key={d}>{sinusoidalPE(compareOn ? 4 : 0, d, 8).toFixed(2)}</td>)}
              </tr>
              <tr style={{ color: colors.green }}>
                <td>final vector</td>
                {(compareOn ? vecAtP : vecAt0).map((v, d) => <td key={d}>{v.toFixed(2)}</td>)}
              </tr>
            </tbody>
          </table>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {pick(lang, "Position 0 vector", "Vektor posisi 0")}: [{vecAt0.map((v) => v.toFixed(2)).join(", ")}] —{" "}
            {pick(lang, "Position 4 vector", "Vektor posisi 4")}: [{vecAtP.map((v) => v.toFixed(2)).join(", ")}].{" "}
            {pick(lang, "Same token, different vectors.", "Token sama, vektor berbeda.")}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Learned positions, and where RoPE fits", "Posisi yang dipelajari, dan di mana RoPE berperan")}>
        <Bi
          en={
            <p>
              Instead of a fixed formula, a model can also just <em>learn</em> its position stamps -- a second
              lookup table with one trained row per position, added to the word's vector the same way. Models
              from the GPT-2 era did this. The catch is rigidity: if the table was only ever trained for
              positions 0 through 1,023, then position 1,024 has no sensible row at all -- like a hotel with
              exactly 1,024 numbered mailboxes suddenly needing to handle guest number 1,025.
            </p>
          }
          id={
            <p>
              Alih-alih rumus tetap, model juga bisa sekadar <em>mempelajari</em> stempel posisinya -- tabel
              kedua dengan satu baris terlatih per posisi, ditambahkan ke vektor kata dengan cara yang sama.
              Model-model era GPT-2 melakukan ini. Kelemahannya adalah kaku: kalau tabel hanya pernah dilatih
              untuk posisi 0 sampai 1.023, maka posisi 1.024 sama sekali tak punya baris yang masuk akal --
              seperti hotel dengan persis 1.024 kotak surat bernomor yang tiba-tiba harus melayani tamu nomor
              1.025.
            </p>
          }
        />
        <Bi
          en={
            <p>
              Most current models instead use <strong>RoPE</strong> ("rotary position embedding"). Rather than
              adding a stamp to each token, RoPE gently rotates each token's arrow by an angle that depends on
              its position -- token #10 gets rotated a little, token #100 a lot. The clever consequence: when
              two rotated arrows are compared in the attention step, what matters ends up being the{" "}
              <em>difference</em> between their angles -- in other words, how far apart the two words are, not
              where each one sits absolutely. "Five words apart" behaves the same anywhere in the text, which
              is exactly why RoPE handles texts longer than anything seen in training far more gracefully.
              You'll see it used for real in lesson 2.2.
            </p>
          }
          id={
            <p>
              Kebanyakan model masa kini justru memakai <strong>RoPE</strong> ("rotary position embedding").
              Alih-alih menambahkan stempel ke tiap token, RoPE memutar pelan panah tiap token dengan sudut
              yang bergantung pada posisinya -- token ke-10 diputar sedikit, token ke-100 diputar banyak.
              Akibat cerdiknya: saat dua panah yang sudah diputar dibandingkan di langkah atensi, yang penting
              ternyata adalah <em>selisih</em> sudut keduanya -- dengan kata lain, seberapa jauh kedua kata
              terpisah, bukan di mana masing-masing duduk secara mutlak. "Terpisah lima kata" berperilaku sama
              di mana pun dalam teks, dan justru itulah kenapa RoPE menangani teks yang lebih panjang dari apa
              pun yang pernah dilihat saat pelatihan dengan jauh lebih anggun. Kamu akan melihatnya dipakai
              sungguhan di pelajaran 2.2.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
