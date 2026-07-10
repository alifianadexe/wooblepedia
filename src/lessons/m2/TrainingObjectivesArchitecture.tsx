import { Fragment, useState } from "react";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, kvCacheBytes } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang, type Lang } from "../../lib/i18n";

const lesson = getLessonMeta(2, "training-objectives-architecture")!;

type DetailKey = "norm" | "attention" | "position" | "mlp";

interface Detail {
  title: string;
  gpt2: string;
  llama: string;
  why: string;
}

const DETAILS_EN: Record<DetailKey, Detail> = {
  norm: {
    title: "NORMALIZATION (the volume knob)",
    gpt2: "LayerNorm — re-centers the numbers around zero, then rescales them",
    llama: "RMSNorm — skips the re-centering, only rescales",
    why: "It turned out the re-centering step wasn't earning its keep. RMSNorm keeps only the rescaling, costs less to compute, and models trained with it come out just as good. A pure simplification win.",
  },
  attention: {
    title: "ATTENTION",
    gpt2: "Multi-head attention — every head keeps its own private key/value notes",
    llama: "Grouped-query attention (GQA) — small groups of heads share one set of notes",
    why: "Remember the KV-cache from lesson 1.5 — the saved notes that make generating text fast? With every head keeping private notes, that cache gets huge. Letting groups of heads share one set shrinks it dramatically, with almost no measured drop in quality. The calculator below makes this concrete.",
  },
  position: {
    title: "POSITION ENCODING",
    gpt2: "A learned table of position stamps, added to each word at the start",
    llama: "RoPE — rotates each word's numbers by an angle based on its position",
    why: "RoPE makes attention care about how far apart two words are, rather than each word's absolute spot in the text. 'Five words apart' works the same everywhere, so the model copes far better with texts longer than anything it trained on (lesson 1.4).",
  },
  mlp: {
    title: "MLP (the thinking step)",
    gpt2: "Two number grids with a simple filter between them",
    llama: "SwiGLU — three grids, where one acts as a learned gate",
    why: "The gate is like a dimmer switch the model learns to control: for each piece of information, it decides how much gets through. To pay for the third grid, the middle layer is made a bit narrower, so the total size stays about the same -- but quality improves.",
  },
};

const DETAILS_ID: Record<DetailKey, Detail> = {
  norm: {
    title: "NORMALISASI (kenop volume)",
    gpt2: "LayerNorm — nge-center ulang angka di sekitar nol, terus nge-scale ulang",
    llama: "RMSNorm — skip yang nge-center ulang, cuma nge-scale",
    why: "Ternyata langkah nge-center ulang itu nggak sepadan sama biayanya. RMSNorm cuma nyimpen bagian scaling-nya, lebih murah dihitung, dan model yang di-training pakai ini sama bagusnya. Kemenangan penyederhanaan murni.",
  },
  attention: {
    title: "ATTENTION",
    gpt2: "Multi-head attention — tiap head nyimpen catatan key/value pribadinya sendiri",
    llama: "Grouped-query attention (GQA) — kelompok kecil head sharing satu set catatan",
    why: "Inget KV-cache dari pelajaran 1.5 — catatan tersimpan yang bikin generate teks jadi cepat? Kalau tiap head nyimpen catatan pribadi, cache itu jadi raksasa. Ngebiarin kelompok head sharing satu set bikin dia ngecil drastis, dengan nyaris nggak ada penurunan kualitas yang keukur. Kalkulator di bawah bikin ini konkret.",
  },
  position: {
    title: "POSITION ENCODING",
    gpt2: "Tabel stempel posisi hasil training, ditambahin ke tiap kata di awal",
    llama: "RoPE — muter angka tiap kata pakai sudut berdasarkan posisinya",
    why: "RoPE bikin attention peduli sama seberapa jauh dua kata kepisah, bukan posisi mutlak tiap kata di teks. 'Kepisah lima kata' jalannya sama di mana pun, jadi model jauh lebih tahan sama teks yang lebih panjang dari apa pun yang pernah dia latih (pelajaran 1.4).",
  },
  mlp: {
    title: "MLP (langkah mikir)",
    gpt2: "Dua kisi angka dengan saringan sederhana di antaranya",
    llama: "SwiGLU — tiga kisi, di mana satu jadi gate hasil training",
    why: "Gate-nya kayak sakelar peredup yang dipelajari model: buat tiap keping informasi, dia mutusin berapa banyak yang lolos. Buat bayar kisi ketiga, layer tengahnya dibikin agak lebih sempit, jadi ukuran totalnya tetap hampir sama -- tapi kualitasnya naik.",
  },
};

function detailsFor(lang: Lang): Record<DetailKey, Detail> {
  return lang === "id" ? DETAILS_ID : DETAILS_EN;
}

const KV_BASELINE_HEADS = 128;

export default function TrainingObjectivesArchitecture() {
  const { lang } = useLang();
  const DETAILS = detailsFor(lang);
  const [detail, setDetail] = useState<DetailKey>("attention");
  const [layers, setLayers] = useLabSetting("m2-arch-layers", 32);
  const [kvHeads, setKvHeads] = useLabSetting("m2-arch-kvheads", 8);
  const [headDim, setHeadDim] = useLabSetting("m2-arch-headdim", 128);
  const [logCtx, setLogCtx] = useLabSetting("m2-arch-logctx", 13);
  const [batch, setBatch] = useLabSetting("m2-arch-batch", 1);

  const ctxLen = Math.round(2 ** logCtx);
  const currentBytes = kvCacheBytes(layers, kvHeads, headDim, ctxLen, batch, 2);
  const baselineBytes = kvCacheBytes(layers, KV_BASELINE_HEADS, headDim, ctxLen, batch, 2);
  const currentGB = bytesToGB(currentBytes);
  const baselineGB = bytesToGB(baselineBytes);
  const shrink = baselineBytes / currentBytes;

  const d = DETAILS[detail];

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Train a modern model and the goal is still exactly lesson 1.7's: guess the next token, get
              graded, improve. What's changed since GPT-2 is the machine's internal parts. Think of it like
              comparing a 2019 car engine to a current one -- same principle, but four specific components
              got swapped out, each for a concrete, measurable reason. This lesson walks through those four
              swaps.
            </p>
          }
          id={
            <p>
              Training model modern dan tujuannya masih persis pelajaran 1.7: tebak token berikutnya, dinilai,
              makin bagus. Yang berubah sejak GPT-2 itu komponen dalam mesinnya. Bayangin ngebandingin mesin
              mobil 2019 sama yang sekarang -- prinsipnya sama, tapi empat komponen spesifik ditukar,
              masing-masing dengan alasan yang konkret dan keukur. Pelajaran ini nelusurin keempat pertukaran itu.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "What the model practices hasn't changed since GPT-2: guess the next token across massive amounts of text.",
          "Swap 1: the 'volume knob' step (layer norm) got simplified to a cheaper version called RMSNorm that skips a step nobody missed. Swap 2: position stamps were replaced by RoPE, which encodes how far apart words are and copes far better with long texts (lesson 1.4).",
          "Swap 3: the MLP gained a learned gate (SwiGLU) that lets it choose what to let through. Swap 4: attention heads now share their key/value notes in groups (GQA) instead of each keeping their own.",
          "That last swap is entirely about memory: fewer separate sets of notes means a proportionally smaller KV-cache -- the calculator below computes exactly how much smaller.",
          "Modern models also dropped many small add-on numbers ('biases') from their layers -- a minor saving with basically no downside.",
        ],
        [
          "Yang dilatih model nggak berubah sejak GPT-2: nebak token berikutnya di teks berjumlah masif.",
          "Tukar 1: langkah 'kenop volume' (layer norm) disederhanain jadi versi lebih murah namanya RMSNorm yang nge-skip satu langkah yang nggak ada yang kangen. Tukar 2: stempel posisi diganti RoPE, yang nge-encode seberapa jauh kata-kata kepisah dan jauh lebih tahan teks panjang (pelajaran 1.4).",
          "Tukar 3: MLP dapet gate hasil training (SwiGLU) yang bikin dia bisa milih apa yang lolos. Tukar 4: head attention sekarang sharing catatan key/value dalam kelompok (GQA), bukan tiap head nyimpen punyanya sendiri.",
          "Pertukaran terakhir itu sepenuhnya soal memori: makin dikit set catatan terpisah, makin kecil KV-cache-nya secara sebanding -- kalkulator di bawah ngitung persis seberapa kecil.",
          "Model modern juga buang banyak angka tambahan kecil ('bias') dari layer-nya -- penghematan kecil yang nyaris nggak ada ruginya.",
        ],
      )}
      references={[
        {
          title: "Root Mean Square Layer Normalization — Zhang & Sennrich, 2019",
          meta: "arXiv:1910.07467 — RMSNorm",
          url: "https://arxiv.org/abs/1910.07467",
        },
        {
          title: "GLU Variants Improve Transformer — Shazeer, 2020",
          meta: "arXiv:2002.05202 — SwiGLU and other gated MLP variants",
          url: "https://arxiv.org/abs/2002.05202",
        },
        {
          title: "RoFormer: Enhanced Transformer with Rotary Position Embedding — Su et al., 2021",
          meta: "arXiv:2104.09864 — RoPE",
          url: "https://arxiv.org/abs/2104.09864",
        },
        {
          title: "GQA: Training Generalized Multi-Query Transformer Models — Ainslie et al., 2023",
          meta: "arXiv:2305.13245 — grouped-query attention",
          url: "https://arxiv.org/abs/2305.13245",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — GPT-2 block vs. Llama-3 block", "Lab — blok GPT-2 vs. blok Llama-3")}>
        <p>{pick(lang, "Click any row to see why that component changed.", "Klik baris mana pun buat lihat kenapa komponen itu diganti.")}</p>
        <ScopeScreen label="Side by side comparison of a GPT-2 block and a Llama-3 style block, with clickable rows explaining each difference">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>GPT-2 BLOCK</div>
            <div className="mono" style={{ fontSize: 11, color: "var(--muted)", textAlign: "center" }}>LLAMA-3 BLOCK</div>
            {(Object.keys(DETAILS) as DetailKey[]).map((key) => {
              const item = DETAILS[key];
              const active = key === detail;
              const cellStyle = {
                padding: "10px 12px",
                fontSize: 12.5,
                border: `1px solid ${active ? colors.magenta : "var(--border)"}`,
                cursor: "pointer",
                background: active ? "var(--panel-2)" : "var(--panel)",
              };
              return (
                <Fragment key={key}>
                  <div style={cellStyle} onClick={() => setDetail(key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setDetail(key)}>
                    {item.gpt2}
                  </div>
                  <div style={cellStyle} onClick={() => setDetail(key)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setDetail(key)}>
                    {item.llama}
                  </div>
                </Fragment>
              );
            })}
          </div>
          <div className="panel-2" style={{ padding: 14, marginTop: 12, borderLeft: `3px solid ${colors.magenta}` }}>
            <div className="mono" style={{ fontSize: 11, color: colors.magenta, marginBottom: 6 }}>{d.title}</div>
            <p style={{ margin: 0, fontSize: 13.5 }}>{d.why}</p>
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Lab — the KV-cache calculator", "Lab — kalkulator KV-cache")}>
        <Bi
          en={
            <p>
              The memory the saved notes take is straight multiplication: 2 (keys and values) × layers ×
              note-keeping heads × numbers per head × text length × bytes per number × how many conversations
              at once. Slide "KV heads" down from 128 (every head keeps private notes) toward 8 (modern
              shared-notes style) and watch the memory shrink in exact proportion.
            </p>
          }
          id={
            <p>
              Memori yang dimakan catatan tersimpan itu perkalian lurus: 2 (key dan value) × layer × head
              pencatat × angka per head × panjang teks × byte per angka × berapa percakapan sekaligus. Geser
              "KV heads" turun dari 128 (tiap head nyimpen catatan pribadi) ke 8 (gaya sharing catatan modern)
              dan lihat memorinya nyusut dalam proporsi yang persis.
            </p>
          }
        />
        <ScopeScreen label="KV cache memory calculator with sliders for layers, KV heads, head dimension, context length, and batch size">
          <Slider label="LAYERS" value={layers} min={1} max={128} step={1} onChange={setLayers} />
          <Slider label="KV HEADS" value={kvHeads} min={1} max={128} step={1} onChange={setKvHeads} />
          <Slider label="HEAD DIM" value={headDim} min={32} max={256} step={8} onChange={setHeadDim} />
          <Slider label="CONTEXT LENGTH" value={logCtx} min={9} max={17} step={1} onChange={setLogCtx} format={() => ctxLen.toLocaleString()} />
          <Slider label="BATCH" value={batch} min={1} max={64} step={1} onChange={setBatch} />

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 14 }}>
            <Readout label={`KV CACHE @ ${kvHeads} HEADS`} value={`${currentGB.toFixed(2)} GB`} accent={colors.cyan} />
            <Readout label={`BASELINE @ ${KV_BASELINE_HEADS} HEADS (FULL MHA)`} value={`${baselineGB.toFixed(2)} GB`} accent={colors.muted} />
            <Readout label="SHRINK FACTOR" value={`${shrink.toFixed(1)}×`} accent={colors.green} />
          </div>
          <div className="mono" style={{ fontSize: 12, marginTop: 10, color: currentGB <= 8 ? colors.green : colors.red }}>
            {pick(
              lang,
              `${currentGB <= 8 ? "FITS" : "EXCEEDS"} your 8GB card's budget for the KV cache alone at this configuration.`,
              `${currentGB <= 8 ? "MUAT di" : "MELEBIHI"} anggaran kartu 8GB-mu buat KV cache doang di konfigurasi ini.`,
            )}
          </div>
        </ScopeScreen>
      </Section>
    </LessonLayout>
  );
}
