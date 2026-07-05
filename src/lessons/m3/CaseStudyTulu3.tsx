import { useState } from "react";
import { Link } from "react-router-dom";
import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Readout } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { colors } from "../../lib/theme";

const lesson = getLessonMeta(3, "case-study-tulu-3")!;

interface SpecCard {
  label: string;
  value: string;
  link?: string;
}

const CARDS: SpecCard[] = [
  { label: "BASE MODEL", value: "Llama 3.1 (8B and 70B variants)" },
  { label: "STAGE 1", value: "SFT on a curated mixture, ablated per data source", link: "/m3/supervised-fine-tuning" },
  { label: "STAGE 2", value: "DPO on a mix of on-policy and off-policy preference pairs", link: "/m3/preference-optimization" },
  { label: "STAGE 3", value: "RLVR — RL against a programmatic verifier, not a learned reward model" },
  { label: "DECONTAMINATION", value: "Explicit checks against benchmark test sets throughout" },
  { label: "RELEASE", value: "Data, training code, and weights all public" },
];

interface MathProblem {
  question: string;
  correctAnswer: string;
  candidates: string[];
}

const PROBLEMS: MathProblem[] = [
  { question: "12 × 7 = ?", correctAnswer: "84", candidates: ["84", "82", "91"] },
  { question: "15% of 200 = ?", correctAnswer: "30", candidates: ["20", "30", "35"] },
  { question: "Solve for x: 2x + 3 = 11", correctAnswer: "4", candidates: ["4", "5", "7"] },
  { question: "Remainder of 17 ÷ 5?", correctAnswer: "2", candidates: ["2", "3", "0"] },
];

function verify(candidate: string, correct: string): number {
  return candidate.trim() === correct.trim() ? 1 : 0;
}

export default function CaseStudyTulu3() {
  const [problemIdx, setProblemIdx] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const problem = PROBLEMS[problemIdx % PROBLEMS.length];
  const meanReward = history.length > 0 ? history.reduce((a, b) => a + b, 0) / history.length : 0;

  function pick(candidate: string) {
    const reward = verify(candidate, problem.correctAnswer);
    setHistory((h) => [...h, reward]);
    setProblemIdx((i) => i + 1);
  }

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <p>
          Every stage in this module has a well-documented theory and a much murkier practice -- most
          frontier labs disclose neither their exact data nor their exact recipe. Tulu 3 is the exception:
          AI2 released the data, the training code, the weights, and a detailed account of the decisions
          behind all three stages, which makes it the closest thing this module has to ground truth.
        </p>
      }
      takeaways={[
        "Tulu 3 runs the exact three-stage pipeline this module teaches -- SFT, then DPO, then RL -- on public Llama 3.1 base models, with every stage's data and code released.",
        "Its RL stage uses RLVR (RL with verifiable rewards): a programmatic checker (did the math answer match? was the constraint satisfied?) supplies the reward, replacing the learned reward model classic RLHF relies on.",
        "Decontamination against benchmark test sets is treated as an explicit, ongoing discipline, not an afterthought -- consistent with lesson 2.7's point about keeping evaluation numbers meaningful.",
        "Because everything is public, reproducing a slice of Tulu 3's recipe on a single rented GPU node is a realistic, well-specified capstone project for this course.",
      ]}
      references={[
        {
          title: "Tulu 3: Pushing Frontiers in Open Language Model Post-Training — Lambert et al., 2024",
          meta: "arXiv:2411.15124",
          url: "https://arxiv.org/abs/2411.15124",
        },
        {
          title: "Tulu 3 — AI2 blog and released datasets",
          meta: "allenai.org / Hugging Face — the actual data, code, and weights referenced throughout this lesson",
          url: "https://allenai.org/blog/tulu-3",
        },
      ]}
    >
      <Section title="Lab — the recipe dashboard">
        <ScopeScreen label="Tulu 3 recipe dashboard with cards linking to the lessons covering each stage">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
            {CARDS.map((c) => {
              const body = (
                <div className="panel" style={{ padding: 12, height: "100%", borderColor: c.link ? colors.magenta : undefined }}>
                  <div className="mono" style={{ fontSize: 10, color: "var(--muted)" }}>{c.label}</div>
                  <div style={{ fontSize: 13, color: c.link ? colors.magenta : colors.text, marginTop: 4 }}>{c.value}</div>
                </div>
              );
              return c.link ? <Link key={c.label} to={c.link} style={{ textDecoration: "none" }}>{body}</Link> : <div key={c.label}>{body}</div>;
            })}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="Lab — a toy RLVR console">
        <p>
          Pick an "answer" for each problem below. A real verifier function checks it exactly and emits a
          reward of 1 or 0 -- no learned reward model, no human preference judgment, just a program deciding
          whether the answer is correct. This is the essence of RLVR.
        </p>
        <ScopeScreen label="Toy reinforcement learning from verifiable rewards console with math problems and a running mean reward">
          <div className="mono" style={{ fontSize: 14, marginBottom: 10 }}>{problem.question}</div>
          <div className="btn-row">
            {problem.candidates.map((c) => (
              <button key={c} type="button" className="btn" onClick={() => pick(c)}>{c}</button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 14 }}>
            <Readout label="ATTEMPTS" value={history.length.toString()} accent={colors.cyan} />
            <Readout label="MEAN REWARD" value={meanReward.toFixed(2)} accent={colors.green} />
          </div>

          <div style={{ display: "flex", gap: 3, marginTop: 10, flexWrap: "wrap" }} aria-label="Reward history, one square per attempt">
            {history.map((r, i) => (
              <div key={i} style={{ width: 14, height: 14, background: r === 1 ? colors.green : colors.red, borderRadius: 2 }} title={`attempt ${i + 1}: reward ${r}`} />
            ))}
          </div>
        </ScopeScreen>
      </Section>

      <Section title="A realistic capstone">
        <p>
          Because Tulu 3's SFT mixture, preference data, and RLVR prompts are all public, reproducing a
          meaningful slice of it -- LoRA-based SFT on a subset of its data, followed by DPO on its released
          preference pairs, both on an 8B model -- is achievable on rented GPUs over a long weekend, using
          exactly the LoRA and DPO machinery from lessons 3.2 and 3.3. That combination of full
          transparency and tractable scale is what makes Tulu 3 this course's natural final destination.
        </p>
      </Section>
    </LessonLayout>
  );
}
