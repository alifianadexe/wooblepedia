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
          Some qualities of a response -- is it more helpful, more honest, funnier -- are far easier for a
          human to judge by comparison than to demonstrate by writing an ideal example from scratch. Once
          you accept that, the natural training signal isn't "here's the correct answer," it's "this
          response is better than that one" -- a chosen/rejected pair.
        </p>
      }
      takeaways={[
        "Bradley-Terry models the probability that one response is preferred as σ(reward_chosen − reward_rejected) -- a pairwise comparison model, not an absolute score.",
        "Classic RLHF trains a separate reward model on preference pairs, then optimizes the policy against it with PPO, constrained by a KL penalty back to a reference model.",
        "DPO collapses that entire pipeline into one direct classification loss on the policy itself: L = −log σ(β·margin), where margin is the difference in log-probability ratios between chosen and rejected responses -- no reward model, no RL rollouts.",
        "β acts as a leash: it controls how sharply the loss punishes preferring the rejected response, which is functionally similar to RLHF's KL penalty but expressed directly in the loss.",
        "DPO trades RLHF's online exploration for offline simplicity and stability -- newer variants (IPO, KTO, GRPO) each adjust a different part of that trade.",
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
          Set two reward scores; the probability that the "chosen" response wins the comparison is exactly
          the sigmoid of their difference.
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

      <Section title="From reward model + PPO to one direct loss">
        <p>
          Classic RLHF is a two-stage system: first, train a reward model on human preference pairs so it
          predicts which of two responses a person would prefer; then, run reinforcement learning (PPO)
          against that frozen reward model, adding a KL penalty that keeps the evolving policy from drifting
          too far from a fixed reference model (usually the SFT checkpoint). It works, but it means running
          an RL training loop with online rollouts against a separately-trained model -- real infrastructure
          complexity and real instability risk.
        </p>
        <p>
          DPO's insight is that, under the same Bradley-Terry assumption, the optimal RLHF policy has a
          closed form in terms of the reference model -- and substituting that back in collapses the entire
          two-stage pipeline into one direct loss computed on the policy alone, with no reward model and no
          RL rollouts required.
        </p>
      </Section>

      <Section title="Lab — the DPO loss curve">
        <p>
          Margin here is <code>(log π/π_ref)(chosen) − (log π/π_ref)(rejected)</code> -- how much more the
          current policy favors the chosen response over the rejected one, relative to the reference model.
          Negative margin means the policy still prefers the rejected response; the loss is steep there.
          Positive margin means it already prefers the chosen one; the loss flattens out.
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
            Gradient magnitude peaks near margin = 0 (the model is still unsure) and vanishes at large
            positive margin (already confidently correct) -- exactly the same "confidently wrong is punished,
            hedging is safe" shape from lesson 1.7's cross-entropy curve.
          </p>
        </ScopeScreen>
      </Section>

      <Section title="Honest trade-offs, and what came after DPO">
        <p>
          DPO is simpler and more stable to run than RLHF, at the cost of being purely offline -- it can only
          learn from the preference pairs it's given, with no online exploration of new responses the way
          PPO's rollouts provide. β plays a similar role to RLHF's KL penalty (both keep the policy from
          straying too far from the reference), but it's a fixed hyperparameter in DPO rather than an
          adaptively-tuned constraint. Since DPO's introduction, several variants have addressed specific
          weaknesses: <strong>IPO</strong> bounds the objective to reduce DPO's tendency to overfit sharp
          preferences; <strong>KTO</strong> learns from unpaired binary "good/bad" labels instead of requiring
          matched pairs; <strong>GRPO</strong> returns to an RL-style update but drops the learned value
          network, using the relative reward within a sampled group of responses instead -- popularized by
          reasoning-focused post-training. None of these replace the others outright; each is a different
          point on the same simplicity-versus-flexibility trade-off.
        </p>
      </Section>
    </LessonLayout>
  );
}
