import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { SegmentedControl, Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bytesToGB, trainingMemoryPerGPU, type ParallelMode } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(2, "training-infrastructure-systems")!;

const H100_GB = 80;
const HOME_CARD_GB = 8;

type Mode = "inference" | "train";
type ParallelDemo = "dp" | "tp" | "pp";

function gridColor(gb: number, budget: number): string {
  if (gb <= budget * 0.75) return colors.green;
  if (gb <= budget) return colors.amber;
  return colors.red;
}

export default function TrainingInfrastructureSystems() {
  const { lang } = useLang();
  const [log2SizeB, setLog2SizeB] = useLabSetting("m2-infra-log2sizeb", 6.6);
  const [logGpus, setLogGpus] = useLabSetting("m2-infra-loggpus", 6);
  const [mode, setMode] = useLabSetting<Mode>("m2-infra-mode", "train");
  const [shard, setShard] = useLabSetting<ParallelMode>("m2-infra-shard", "zero3");
  const [parallelDemo, setParallelDemo] = useLabSetting<ParallelDemo>("m2-infra-paralleldemo", "pp");

  const sizeB = 2 ** log2SizeB;
  const N = sizeB * 1e9;
  const gpuCount = Math.round(2 ** logGpus);
  const bytesPerParam = mode === "inference" ? 2 : 16;
  const perGPUBytes = trainingMemoryPerGPU(N, gpuCount, shard, bytesPerParam);
  const perGPUGB = bytesToGB(perGPUBytes);

  const gridCells = Math.min(gpuCount, 64);

  const demoCells = Array.from({ length: 8 }, (_, i) => {
    if (parallelDemo === "dp") {
      return { title: "REPLICA", subtitle: `batch shard ${i + 1}/8`, color: colors.cyan };
    }
    if (parallelDemo === "tp") {
      return { title: `SLICE ${i + 1}/8`, subtitle: "every layer, 1/8 width", color: colors.amber };
    }
    return { title: `STAGE ${i + 1}/8`, subtitle: `layers ${i * 4 + 1}-${i * 4 + 4} of 32`, color: `hsl(${180 + i * 22}, 65%, 55%)` };
  });

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              When a model is too big for one GPU's memory, you can't just "run it slower" -- like a puzzle
              too large for one table, it has to be split across many machines, and <em>how</em> you split it
              is a genuine engineering decision with big consequences. This lesson starts from the plain
              memory arithmetic and builds up to the three ways a model actually gets divided across a
              warehouse of GPUs.
            </p>
          }
          id={
            <p>
              Pas model kegedean buat memori satu GPU, kamu nggak bisa cuma "ngejalaninnya lebih lambat" --
              kayak puzzle yang kegedean buat satu meja, dia harus dipecah ke banyak mesin, dan{" "}
              <em>gimana</em> mecahnya itu keputusan engineering beneran dengan akibat gede. Pelajaran ini mulai
              dari aritmetika memori yang polos dan naik sampai tiga cara model beneran dibagi ke segudang GPU.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "Running a model takes about 2 bytes of memory per parameter; training takes about 16, because of all the extra bookkeeping numbers -- and that's before counting the temporary working numbers.",
          "Three ways to split the work: give every GPU a full copy of the model and different text to chew on (data parallel); split each layer's math across GPUs (tensor parallel); or deal out the layers themselves like an assembly line (pipeline parallel). Big runs combine all three.",
          "A trick called ZeRO stops every GPU from wastefully storing identical copies of the training bookkeeping -- each holds just its slice and they share on demand, cutting per-GPU memory dramatically.",
          "Activation checkpointing saves memory by throwing away most in-between results and redoing that math later when needed -- deliberately trading extra computation for space.",
          "With thousands of GPUs running for months, something is always breaking. What keeps a run alive isn't preventing failures -- it's automatic save-points and fast restarts.",
        ],
        [
          "Ngejalanin model makan sekitar 2 byte memori per parameter; nge-training-nya sekitar 16, gara-gara semua angka pembukuan ekstra -- dan itu belum ngitung angka kerja sementara.",
          "Tiga cara bagi kerjaan: kasih tiap GPU salinan penuh model dan teks beda buat dikunyah (data parallel); pecah matematika tiap layer ke banyak GPU (tensor parallel); atau bagiin layer-layernya sendiri kayak lini perakitan (pipeline parallel). Training gede nge-gabungin ketiganya.",
          "Trik namanya ZeRO nyetop tiap GPU nyimpen salinan identik pembukuan training secara boros -- masing-masing megang irisannya doang dan sharing sesuai kebutuhan, mangkas memori per-GPU drastis.",
          "Activation checkpointing ngirit memori dengan buang sebagian besar hasil antara dan ngulang hitungannya nanti pas dibutuhin -- sengaja nuker compute ekstra sama ruang.",
          "Dengan ribuan GPU jalan berbulan-bulan, selalu ada yang rusak. Yang bikin training tetap hidup bukan nyegah kegagalan -- tapi checkpoint otomatis dan restart yang cepat.",
        ],
      )}
      references={[
        {
          title: "Megatron-LM: Training Multi-Billion Parameter Language Models Using Model Parallelism — Shoeybi et al., 2019",
          meta: "arXiv:1909.08053 — tensor parallelism",
          url: "https://arxiv.org/abs/1909.08053",
        },
        {
          title: "ZeRO: Memory Optimizations Toward Training Trillion Parameter Models — Rajbhandari et al., 2019",
          meta: "arXiv:1910.02054",
          url: "https://arxiv.org/abs/1910.02054",
        },
        {
          title: "Efficient Large-Scale Language Model Training on GPU Clusters — Narayanan et al., 2021",
          meta: "arXiv:2104.04473 — combining data, tensor, and pipeline parallelism",
          url: "https://arxiv.org/abs/2104.04473",
        },
        {
          title: "The Llama 3 Herd of Models — infrastructure section",
          meta: "arXiv:2407.21783 — real operational detail on training at 16K-GPU scale",
          url: "https://arxiv.org/abs/2407.21783",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — the memory console", "Lab — konsol memori")}>
        <Bi
          en={
            <p>
              Set a model size and a GPU count, pick running versus training, and toggle between "every GPU
              stores everything" and "each GPU stores only its share." Every readout is computed live -- watch
              how sharing the storage makes an impossible model suddenly fit.
            </p>
          }
          id={
            <p>
              Atur ukuran model dan jumlah GPU, pilih ngejalanin versus nge-training, dan pindah antara "tiap
              GPU nyimpen semuanya" dan "tiap GPU nyimpen bagiannya doang." Tiap pembacaan dihitung secara
              langsung -- lihat gimana sharing penyimpanan bikin model yang mustahil mendadak muat.
            </p>
          }
        />
        <ScopeScreen label="Per-GPU memory console with model size, GPU count, mode, and sharding controls">
          <Slider label="MODEL SIZE (BILLIONS OF PARAMS, LOG SCALE)" value={log2SizeB} min={0} max={9} step={0.05}
            onChange={setLog2SizeB}
            format={() => `${sizeB.toFixed(1)}B`}
          />
          <Slider label="LOG2(GPU COUNT)" value={logGpus} min={0} max={10} step={1} onChange={setLogGpus} format={() => gpuCount.toString()} />
          <SegmentedControl label="MODE" value={mode} options={[{ value: "inference", label: "INFERENCE" }, { value: "train", label: "TRAIN" }]} onChange={setMode} />
          <SegmentedControl label="SHARDING" value={shard} options={[{ value: "replicated", label: "FULLY REPLICATED" }, { value: "zero3", label: "ZERO-3 SHARDED" }]} onChange={setShard} />

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", margin: "14px 0" }}>
            <Readout label="PER-GPU MEMORY" value={`${perGPUGB.toFixed(2)} GB`} accent={gridColor(perGPUGB, H100_GB)} />
            <Readout label="VS. H100 (80GB)" value={perGPUGB <= H100_GB ? "FITS" : "EXCEEDS"} accent={gridColor(perGPUGB, H100_GB)} />
            <Readout label="VS. YOUR 8GB CARD" value={perGPUGB <= HOME_CARD_GB ? "FITS" : "EXCEEDS"} accent={gridColor(perGPUGB, HOME_CARD_GB)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(8, gridCells)}, 1fr)`, gap: 3, maxWidth: 320 }} role="img" aria-label={`Grid of ${gridCells} GPUs colored by whether their memory usage fits an H100`}>
            {Array.from({ length: gridCells }, (_, i) => (
              <div key={i} style={{ aspectRatio: "1", background: gridColor(perGPUGB, H100_GB), borderRadius: 2, opacity: shard === "replicated" ? 0.9 : 0.55 }} />
            ))}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 6 }}>
            {shard === "replicated"
              ? pick(lang, "Every GPU holds a full copy.", "Tiap GPU megang salinan penuh.")
              : pick(lang, `Every GPU holds roughly 1/${gpuCount} of the state.`, `Tiap GPU megang kira-kira 1/${gpuCount} dari keseluruhan.`)}
            {gpuCount > 64 && pick(lang, ` (showing first 64 of ${gpuCount})`, ` (nampilin 64 pertama dari ${gpuCount})`)}
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Three ways to split a model", "Tiga cara memecah model")}>
        <Bi
          en={
            <p>
              <strong>Data parallelism</strong> is the simplest: every GPU gets an identical full copy of the
              model and a different pile of text to practice on -- like giving every student in a class the
              same textbook but different homework problems, then averaging what everyone learned after each
              round. <strong>Tensor parallelism</strong> splits the math <em>inside</em> each layer: one
              giant multiplication is carved into slices, each GPU computes its slice, and the pieces get
              stitched together -- several cooks chopping one enormous onion. <strong>Pipeline
              parallelism</strong> deals out the layers themselves like an assembly line: GPU 1 holds layers
              1-4, GPU 2 holds layers 5-8, and text flows down the line station by station. (The classic
              assembly-line problem applies too -- stations idling while waiting for the one before them --
              and it's managed by keeping many small batches moving at once.) Real large-scale runs combine
              all three at the same time.
            </p>
          }
          id={
            <p>
              <strong>Data parallelism</strong> paling sederhana: tiap GPU dapet salinan penuh model yang
              identik dan tumpukan teks beda buat latihan -- kayak ngasih tiap murid di kelas buku pelajaran
              sama tapi soal PR beda, terus ngerata-ratain apa yang dipelajarin semua orang tiap ronde.{" "}
              <strong>Tensor parallelism</strong> mecah matematika <em>di dalam</em> tiap layer: satu perkalian
              raksasa diiris-iris, tiap GPU ngitung irisannya, dan kepingannya dijahit balik -- beberapa koki
              nyincang satu bawang raksasa. <strong>Pipeline parallelism</strong> bagiin layer-layernya sendiri
              kayak lini perakitan: GPU 1 megang layer 1-4, GPU 2 megang layer 5-8, dan teks ngalir nyusurin
              lini stasiun demi stasiun. (Masalah klasik lini perakitan juga berlaku -- stasiun nganggur nungguin
              stasiun sebelumnya -- dan diatasi dengan jaga banyak batch kecil bergerak sekaligus.) Training
              skala gede beneran pakai ketiganya bareng.
            </p>
          }
        />
        <ScopeScreen label="Eight-GPU grid recolored to show what each GPU holds under data, tensor, or pipeline parallelism">
          <SegmentedControl
            label="PARALLELISM MODE"
            value={parallelDemo}
            options={[{ value: "dp", label: "DATA PARALLEL" }, { value: "tp", label: "TENSOR PARALLEL" }, { value: "pp", label: "PIPELINE PARALLEL" }]}
            onChange={setParallelDemo}
          />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 10 }}>
            {demoCells.map((c, i) => (
              <div key={i} className="panel-2" style={{ padding: 8, borderLeft: `3px solid ${c.color}`, fontSize: 11 }}>
                <div className="mono" style={{ color: c.color }}>{c.title}</div>
                <div style={{ color: "var(--muted)", marginTop: 2 }}>{c.subtitle}</div>
              </div>
            ))}
          </div>
        </ScopeScreen>
      </Section>

      <Section
        title={pick(
          lang,
          "ZeRO/FSDP, activation checkpointing, and staying alive at scale",
          "ZeRO/FSDP, activation checkpointing, dan bertahan hidup di skala besar",
        )}
      >
        <Bi
          en={
            <p>
              The give-everyone-a-full-copy approach has an obvious waste: a thousand GPUs storing a thousand
              identical copies of all the training bookkeeping. The fix, called <strong>ZeRO</strong>, works
              like a study group that splits up one textbook instead of everyone buying their own: each GPU
              permanently stores only its assigned slice, and whenever a GPU briefly needs a part it doesn't
              hold, the group passes it over the network. Some extra chatter, dramatically less memory each --
              the console above computed exactly this trade. A second trick, <strong>activation
              checkpointing</strong>, deals with the temporary working numbers: instead of keeping every
              in-between result around for the learning step, the GPU throws most of them away and simply
              redoes that math later when it's needed -- spending extra computation to free up space, like
              re-deriving a formula instead of keeping every page of scratch work. And one last reality of
              scale: with thousands of machines running for months, hardware failures stop being emergencies
              and become weather. Runs survive not by preventing failures but by saving progress constantly
              and restarting fast when -- not if -- something dies.
            </p>
          }
          id={
            <p>
              Pendekatan kasih-semua-salinan-penuh punya pemborosan yang jelas: seribu GPU nyimpen seribu
              salinan identik semua pembukuan training. Perbaikannya, namanya <strong>ZeRO</strong>, jalannya
              kayak kelompok belajar yang bagi satu buku pelajaran daripada semua orang beli sendiri-sendiri:
              tiap GPU secara permanen nyimpen cuma irisan jatahnya, dan kapan pun sebuah GPU butuh sebentar
              bagian yang nggak dia pegang, kelompoknya ngoperinnya lewat jaringan. Ada obrolan ekstra dikit,
              memori masing-masing jauh lebih hemat -- konsol di atas ngitung persis pertukaran ini. Trik kedua,{" "}
              <strong>activation checkpointing</strong>, ngurusin angka kerja sementara: daripada nyimpen tiap
              hasil antara buat langkah belajar, GPU buang sebagian besar dan cuma ngulang hitungan itu nanti pas
              dibutuhin -- ngeluarin compute ekstra demi ngebebasin ruang, kayak nurunin ulang rumus daripada
              nyimpen tiap lembar coretan. Dan satu kenyataan skala terakhir: dengan ribuan mesin jalan
              berbulan-bulan, kegagalan hardware berhenti jadi darurat dan jadi cuaca. Training bertahan bukan
              dengan nyegah kegagalan tapi dengan nyimpen kemajuan terus-terusan dan restart cepat pas -- bukan
              kalau -- sesuatu mati.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
