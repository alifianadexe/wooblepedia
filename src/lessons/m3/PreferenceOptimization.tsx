import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bradleyTerryProb, dpoLoss, sigmoid } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang } from "../../lib/i18n";

const lesson = getLessonMeta(3, "preference-optimization")!;

const MARGIN_SAMPLES = Array.from({ length: 100 }, (_, i) => -6 + (i / 99) * 12);

export default function PreferenceOptimization() {
  const { lang } = useLang();
  const [beta, setBeta] = useLabSetting("m3-dpo-beta", 0.3);
  const [margin, setMargin] = useLabSetting("m3-dpo-margin", 0.5);

  const [rewardChosen, setRewardChosen] = useLabSetting("m3-bt-rc", 1.5);
  const [rewardRejected, setRewardRejected] = useLabSetting("m3-bt-rr", 0.2);

  const loss = dpoLoss(beta, margin);
  const gradMag = beta * sigmoid(-beta * margin);
  const pChosen = bradleyTerryProb(rewardChosen, rewardRejected);

  const curve = MARGIN_SAMPLES.map((m) => ({ m, loss: dpoLoss(beta, m) }));
  const maxLoss = Math.max(...curve.map((c) => Math.min(c.loss, 8)));

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              Try writing down the perfect answer to "cheer me up, my day was awful." Hard, right? But shown
              two attempts, you'd instantly know which was better. Many qualities -- helpfulness, honesty,
              humor -- are like that: far easier to judge by comparison than to demonstrate from scratch.
              Once you accept that, the natural teaching signal isn't "here's the correct answer" but "this
              one, not that one" -- a chosen-versus-rejected pair. This lesson is about how to train on
              exactly that kind of data.
            </p>
          }
          id={
            <p>
              Coba tuliskan jawaban sempurna untuk "hibur aku dong, hariku kacau banget." Susah, kan? Tetapi
              diperlihatkan dua percobaan, kamu langsung tahu mana yang lebih baik. Banyak kualitas -- sifat
              membantu, kejujuran, humor -- seperti itu: jauh lebih mudah dinilai lewat perbandingan daripada
              dicontohkan dari nol. Begitu kamu menerimanya, sinyal pengajaran yang alami bukan "ini jawaban
              yang benar" melainkan "yang ini, bukan yang itu" -- pasangan terpilih-versus-tertolak.
              Pelajaran ini tentang cara berlatih persis pada data jenis itu.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "The Bradley-Terry formula turns two quality scores into a probability of which answer a person would prefer -- the same math behind chess ratings, where two players' ratings predict who wins.",
          "The classic approach (called RLHF) has two stages: first train a separate judge model to predict human preferences, then train the assistant to score highly with that judge -- while a 'leash' keeps it from drifting too far from its starting point.",
          "DPO's discovery: all of that collapses into one simple exercise on the assistant itself -- directly boost the chosen answer and suppress the rejected one. No judge model, no two-stage complexity.",
          "DPO's β dial sets the leash tightness: how hard the training yanks when the model still prefers the rejected answer.",
          "The trade: DPO is simpler and more stable but only learns from the comparisons it's handed, while RLHF explores fresh answers as it trains. Newer variants each adjust a different corner of that trade.",
        ],
        [
          "Rumus Bradley-Terry mengubah dua skor kualitas menjadi probabilitas jawaban mana yang bakal dipilih orang -- matematika yang sama di balik rating catur, di mana rating dua pemain memprediksi siapa menang.",
          "Pendekatan klasiknya (bernama RLHF) punya dua tahap: pertama latih model juri terpisah untuk memprediksi preferensi manusia, lalu latih si asisten mengejar skor tinggi di mata juri itu -- sementara sebuah 'tali kekang' menahannya agar tak melantur jauh dari titik awalnya.",
          "Temuan DPO: semua itu runtuh menjadi satu latihan sederhana pada si asisten sendiri -- langsung dorong jawaban terpilih dan tekan jawaban tertolak. Tanpa model juri, tanpa kerumitan dua tahap.",
          "Kenop β milik DPO mengatur kencangnya tali kekang: seberapa keras latihan menyentak saat model masih memilih jawaban yang tertolak.",
          "Pertukarannya: DPO lebih sederhana dan stabil tetapi hanya belajar dari perbandingan yang disodorkan, sementara RLHF menjelajahi jawaban segar sambil berlatih. Varian-varian lebih baru masing-masing menyetel sudut berbeda dari pertukaran itu.",
        ],
      )}
      references={[
        {
          title: "Deep Reinforcement Learning from Human Preferences — Christiano et al., 2017",
          meta: "arXiv:1706.03741 — the foundational preference-learning setup",
          url: "https://arxiv.org/abs/1706.03741",
        },
        {
          title: "Training Language Models to Follow Instructions with Human Feedback — Ouyang et al., 2022",
          meta: "arXiv:2203.02155 — RLHF with a reward model and PPO, applied to LLMs",
          url: "https://arxiv.org/abs/2203.02155",
        },
        {
          title: "Direct Preference Optimization — Rafailov et al., 2023",
          meta: "arXiv:2305.18290",
          url: "https://arxiv.org/abs/2305.18290",
        },
        {
          title: "Proximal Policy Optimization Algorithms — Schulman et al., 2017",
          meta: "arXiv:1707.06347 — the RL algorithm classic RLHF optimizes against the reward model",
          url: "https://arxiv.org/abs/1707.06347",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — the Bradley-Terry model", "Lab — model Bradley-Terry")}>
        <Bi
          en={
            <p>
              Give two answers a quality score each and watch the formula convert the <em>difference</em>{" "}
              into a win probability. Equal scores means a coin flip; a big gap means a near-certain win.
              It's exactly how chess ratings work: only the gap between two players matters, never the raw
              numbers.
            </p>
          }
          id={
            <p>
              Beri dua jawaban masing-masing skor kualitas dan lihat rumusnya mengubah <em>selisihnya</em>{" "}
              menjadi probabilitas menang. Skor seri berarti lempar koin; selisih besar berarti kemenangan
              yang nyaris pasti. Persis cara kerja rating catur: hanya selisih antara dua pemain yang
              penting, tak pernah angka mentahnya.
            </p>
          }
        />
        <ScopeScreen label="Bradley-Terry preference probability from two reward scores">
          <Slider label="REWARD(CHOSEN)" value={rewardChosen} min={-5} max={5} step={0.1} onChange={setRewardChosen} />
          <Slider label="REWARD(REJECTED)" value={rewardRejected} min={-5} max={5} step={0.1} onChange={setRewardRejected} />
          <div style={{ display: "flex", height: 26, borderRadius: 4, overflow: "hidden", marginTop: 10, border: `1px solid ${colors.border}` }}>
            <div style={{ width: `${pChosen * 100}%`, background: colors.green }} />
            <div style={{ width: `${(1 - pChosen) * 100}%`, background: colors.red }} />
          </div>
          <Readout label="p(CHOSEN PREFERRED) = σ(reward_chosen − reward_rejected)" value={pChosen.toFixed(3)} accent={colors.green} />
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "From a two-stage system to one direct exercise", "Dari sistem dua tahap ke satu latihan langsung")}>
        <Bi
          en={
            <p>
              The classic approach, <strong>RLHF</strong> (reinforcement learning from human feedback), works
              in two stages. First, train a separate "judge" model on thousands of human this-one-not-that-one
              choices until it can predict which of two answers a person would prefer. Then let the assistant
              practice: it writes answers, the judge scores them, and the assistant learns to score higher --
              with a leash keeping it from wandering too far from its starting point (a model chasing a judge's
              approval will otherwise find weird shortcuts, like flattery or padding). It works, but running
              two models against each other in a live training loop is complicated and famously touchy.
            </p>
          }
          id={
            <p>
              Pendekatan klasiknya, <strong>RLHF</strong> (reinforcement learning from human feedback),
              bekerja dua tahap. Pertama, latih model "juri" terpisah pada ribuan pilihan
              yang-ini-bukan-yang-itu dari manusia sampai ia bisa memprediksi jawaban mana dari dua yang
              bakal dipilih orang. Lalu biarkan si asisten berlatih: ia menulis jawaban, si juri menilainya,
              dan si asisten belajar mengejar nilai lebih tinggi -- dengan tali kekang yang menahannya agar
              tak mengembara jauh dari titik awal (model yang memburu restu juri kalau tidak akan menemukan
              jalan pintas aneh, seperti menjilat atau mengulur-ulur). Berhasil, tetapi menjalankan dua model
              saling berhadapan dalam loop latihan langsung itu rumit dan terkenal rewel.
            </p>
          }
        />
        <Bi
          en={
            <p>
              Then came <strong>DPO</strong> (direct preference optimization), with a genuinely surprising
              mathematical discovery: under the same assumptions, that whole two-stage contraption is exactly
              equivalent to one simple exercise applied directly to the assistant -- for each pair, nudge the
              model to make the chosen answer more likely and the rejected one less likely, with the leash
              built right into the formula. No judge model, no live practice loop. Cheaper, simpler, and far
              more stable.
            </p>
          }
          id={
            <p>
              Lalu datanglah <strong>DPO</strong> (direct preference optimization), dengan temuan matematis
              yang sungguh mengejutkan: di bawah asumsi yang sama, seluruh perkakas dua tahap itu persis
              setara dengan satu latihan sederhana yang diterapkan langsung pada si asisten -- untuk tiap
              pasangan, geser model agar jawaban terpilih makin mungkin dan jawaban tertolak makin tidak,
              dengan tali kekang terpasang langsung di dalam rumusnya. Tanpa model juri, tanpa loop latihan
              langsung. Lebih murah, lebih sederhana, dan jauh lebih stabil.
            </p>
          }
        />
      </Section>

      <Section title={pick(lang, "Lab — the DPO loss curve", "Lab — kurva loss DPO")}>
        <Bi
          en={
            <p>
              The curve below is DPO's grading rule. The "margin" measures how much more the model currently
              favors the chosen answer over the rejected one (compared against its starting point). Left of
              zero, the model still prefers the <em>wrong</em> answer -- and the penalty is steep, demanding
              correction. Right of zero, it already prefers the right one -- and the curve flattens: no point
              pushing a lesson the model has already learned. Try the β slider to tighten or loosen the leash.
            </p>
          }
          id={
            <p>
              Kurva di bawah adalah aturan penilaian DPO. Si "margin" mengukur seberapa lebih condong model
              saat ini ke jawaban terpilih dibanding yang tertolak (diperbandingkan terhadap titik awalnya).
              Di kiri nol, model masih memilih jawaban yang <em>salah</em> -- dan hukumannya curam, menuntut
              koreksi. Di kanan nol, ia sudah memilih yang benar -- dan kurvanya mendatar: tak ada gunanya
              mendorong pelajaran yang sudah dikuasai model. Coba slider β untuk mengencangkan atau
              mengendurkan tali kekangnya.
            </p>
          }
        />
        <ScopeScreen label="DPO loss curve as a function of margin, with beta as a KL-strength control">
          <Slider label="β (KL LEASH STRENGTH)" value={beta} min={0.05} max={1.5} step={0.01} onChange={setBeta} />
          <Slider label="MARGIN (log-ratio difference)" value={margin} min={-6} max={6} step={0.1} onChange={setMargin} />

          <svg viewBox="0 0 400 160" width="100%" height="170" aria-label="DPO loss as a function of margin at the current beta, with the current point marked">
            <line x1={10} y1={140} x2={390} y2={140} stroke={colors.border} strokeWidth={1} />
            <line x1={200} y1={10} x2={200} y2={140} stroke={colors.border} strokeWidth={1} strokeDasharray="2 2" />
            <polyline
              fill="none"
              stroke={colors.magenta}
              strokeWidth={2}
              points={curve.map((c) => `${10 + ((c.m + 6) / 12) * 380},${140 - (Math.min(c.loss, 8) / maxLoss) * 120}`).join(" ")}
            />
            <circle cx={10 + ((margin + 6) / 12) * 380} cy={140 - (Math.min(loss, 8) / maxLoss) * 120} r={5} fill={colors.amber} />
          </svg>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <Readout label="LOSS" value={loss.toFixed(3)} accent={colors.magenta} />
            <Readout label="|dLOSS/dMARGIN|" value={gradMag.toFixed(4)} accent={colors.cyan} />
          </div>
          <p className="mono" style={{ fontSize: 11, color: "var(--muted)", marginTop: 8 }}>
            {pick(
              lang,
              'The correction is strongest near zero (the model is still torn) and fades to nothing at high positive margin (already confidently right) -- the same "confidently wrong hurts most" shape as lesson 1.7\'s grading curve.',
              'Koreksinya paling kuat dekat nol (model masih bimbang) dan memudar habis di margin positif tinggi (sudah yakin benar) -- bentuk "salah dengan percaya diri paling sakit" yang sama dengan kurva penilaian pelajaran 1.7.',
            )}
          </p>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Honest trade-offs, and what came after DPO", "Pertukaran yang jujur, dan apa yang datang setelah DPO")}>
        <Bi
          en={
            <p>
              DPO's simplicity has a price: it's a student who only studies flashcards it was handed, while
              RLHF is a student who writes fresh practice essays and gets them graded -- exploring new
              territory as it learns. DPO can never discover an answer better than anything in its stack of
              comparisons. Since DPO's debut, a family of variants has tinkered with the recipe, and you'll
              see their names around: <strong>IPO</strong> (Identity Preference Optimization) tames DPO's
              tendency to over-learn lopsided comparisons; <strong>KTO</strong> (Kahneman-Tversky
              Optimization) works from simple thumbs-up/thumbs-down labels instead of matched pairs (much
              easier data to collect); <strong>GRPO</strong> (Group Relative Policy Optimization) brings
              back live practice but grades each answer against the average of a batch of the model's own
              attempts -- the method
              behind several recent reasoning-focused models. None of them wins outright; each picks a
              different spot on the same simplicity-versus-flexibility trade.
            </p>
          }
          id={
            <p>
              Kesederhanaan DPO ada harganya: ia murid yang hanya mempelajari kartu hafalan yang disodorkan,
              sementara RLHF adalah murid yang menulis esai latihan segar dan mendapat nilai -- menjelajahi
              wilayah baru sambil belajar. DPO tak akan pernah menemukan jawaban yang lebih baik dari apa pun
              di tumpukan perbandingannya. Sejak debut DPO, sekeluarga varian mengutak-atik resepnya, dan
              nama-nama mereka akan kamu jumpai: <strong>IPO</strong> (Identity Preference Optimization)
              menjinakkan kecenderungan DPO belajar-berlebihan pada perbandingan yang timpang;{" "}
              <strong>KTO</strong> (Kahneman-Tversky Optimization) bekerja dari label
              jempol-naik/jempol-turun sederhana alih-alih pasangan berjodoh (data yang jauh lebih mudah
              dikumpulkan); <strong>GRPO</strong> (Group Relative Policy Optimization) menghidupkan lagi
              latihan langsung tetapi menilai tiap
              jawaban terhadap rata-rata satu kelompok percobaan si model sendiri -- metode di balik beberapa
              model fokus-penalaran mutakhir. Tak ada yang menang mutlak; masing-masing memilih titik berbeda
              pada pertukaran kesederhanaan-versus-keluwesan yang sama.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
