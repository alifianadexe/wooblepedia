import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Slider } from "../../components/Slider";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { bradleyTerryProb, dpoLoss, sigmoid } from "../../lib/math";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(3, "preference-optimization")!;

const MARGIN_SAMPLES = Array.from({ length: 100 }, (_, i) => -6 + (i / 99) * 12);

export default function PreferenceOptimization() {
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
        <p>
          Try writing down the perfect answer to "cheer me up, my day was awful." Hard, right? But shown
          two attempts, you'd instantly know which was better. Many qualities -- helpfulness, honesty,
          humor -- are like that: far easier to judge by comparison than to demonstrate from scratch.
          Once you accept that, the natural teaching signal isn't "here's the correct answer" but "this
          one, not that one" -- a chosen-versus-rejected pair. This lesson is about how to train on
          exactly that kind of data.
        </p>
      }
      takeaways={[
        "The Bradley-Terry formula turns two quality scores into a probability of which answer a person would prefer -- the same math behind chess ratings, where two players' ratings predict who wins.",
        "The classic approach (called RLHF) has two stages: first train a separate judge model to predict human preferences, then train the assistant to score highly with that judge -- while a 'leash' keeps it from drifting too far from its starting point.",
        "DPO's discovery: all of that collapses into one simple exercise on the assistant itself -- directly boost the chosen answer and suppress the rejected one. No judge model, no two-stage complexity.",
        "DPO's β dial sets the leash tightness: how hard the training yanks when the model still prefers the rejected answer.",
        "The trade: DPO is simpler and more stable but only learns from the comparisons it's handed, while RLHF explores fresh answers as it trains. Newer variants each adjust a different corner of that trade.",
      ]}
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
      <Section title="Lab — the Bradley-Terry model">
        <p>
          Give two answers a quality score each and watch the formula convert the <em>difference</em>{" "}
          into a win probability. Equal scores means a coin flip; a big gap means a near-certain win.
          It's exactly how chess ratings work: only the gap between two players matters, never the raw
          numbers.
        </p>
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

      <Section title="From a two-stage system to one direct exercise">
        <p>
          The classic approach, <strong>RLHF</strong> (reinforcement learning from human feedback), works
          in two stages. First, train a separate "judge" model on thousands of human this-one-not-that-one
          choices until it can predict which of two answers a person would prefer. Then let the assistant
          practice: it writes answers, the judge scores them, and the assistant learns to score higher --
          with a leash keeping it from wandering too far from its starting point (a model chasing a judge's
          approval will otherwise find weird shortcuts, like flattery or padding). It works, but running
          two models against each other in a live training loop is complicated and famously touchy.
        </p>
        <p>
          Then came <strong>DPO</strong> (direct preference optimization), with a genuinely surprising
          mathematical discovery: under the same assumptions, that whole two-stage contraption is exactly
          equivalent to one simple exercise applied directly to the assistant -- for each pair, nudge the
          model to make the chosen answer more likely and the rejected one less likely, with the leash
          built right into the formula. No judge model, no live practice loop. Cheaper, simpler, and far
          more stable.
        </p>
      </Section>

      <Section title="Lab — the DPO loss curve">
        <p>
          The curve below is DPO's grading rule. The "margin" measures how much more the model currently
          favors the chosen answer over the rejected one (compared against its starting point). Left of
          zero, the model still prefers the <em>wrong</em> answer -- and the penalty is steep, demanding
          correction. Right of zero, it already prefers the right one -- and the curve flattens: no point
          pushing a lesson the model has already learned. Try the β slider to tighten or loosen the leash.
        </p>
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
            The correction is strongest near zero (the model is still torn) and fades to nothing at high
            positive margin (already confidently right) -- the same "confidently wrong hurts most" shape
            as lesson 1.7's grading curve.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Honest trade-offs, and what came after DPO">
        <p>
          DPO's simplicity has a price: it's a student who only studies flashcards it was handed, while
          RLHF is a student who writes fresh practice essays and gets them graded -- exploring new
          territory as it learns. DPO can never discover an answer better than anything in its stack of
          comparisons. Since DPO's debut, a family of variants has tinkered with the recipe, and you'll
          see their names around: <strong>IPO</strong> tames DPO's tendency to over-learn lopsided
          comparisons; <strong>KTO</strong> works from simple thumbs-up/thumbs-down labels instead of
          matched pairs (much easier data to collect); <strong>GRPO</strong> brings back live practice
          but grades each answer against the average of a batch of the model's own attempts -- the method
          behind several recent reasoning-focused models. None of them wins outright; each picks a
          different spot on the same simplicity-versus-flexibility trade.
        </p>
      </Section>
    </LessonLayout>
  );
}
