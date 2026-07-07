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
  { label: "STAGE 1", value: "SFT — example answers, with each data source's contribution tested separately", link: "/m3/supervised-fine-tuning" },
  { label: "STAGE 2", value: "DPO — better-vs-worse comparisons, including ones judged on the model's own answers", link: "/m3/preference-optimization" },
  { label: "STAGE 3", value: "RLVR — practice graded by an answer-checking program, not a judge model" },
  { label: "TEST HYGIENE", value: "Training data continuously scrubbed of benchmark test questions" },
  { label: "RELEASE", value: "Data, training code, and finished model all public" },
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
          Every stage in this module has well-documented theory but murky practice -- most labs keep
          their exact data and recipes secret. Tulu 3, from the Allen Institute for AI, is the exception:
          they published everything -- the data, the training code, the finished model, and a frank
          account of every decision along the way. It's the closest thing this module has to a complete
          published cookbook, and it runs the exact three-stage pipeline you've just learned.
        </p>
      }
      takeaways={[
        "Tulu 3 runs this module's exact three-stage pipeline -- example answers (SFT), then answer comparisons (DPO), then reward-based practice -- on public Llama 3.1 base models, with every stage's data and code released.",
        "Its reward stage uses RLVR ('verifiable rewards'): instead of a trained judge model guessing what people like, a plain computer program checks the answer -- did the math come out right? was the rule followed? An answer key, not a judge's opinion.",
        "Throughout, the team kept scrubbing their training data of anything overlapping the standard tests -- the same keep-the-exam-honest discipline from lesson 2.7.",
        "Because everything is public, reproducing a slice of the Tulu 3 recipe on rented hardware is a realistic, well-specified capstone project for this course.",
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
          Play the model's role: pick an answer to each problem below. A real checking function grades
          your pick and awards 1 point for correct, 0 for wrong -- no opinions, no judge model, just a
          program comparing against the answer key. That's the entire idea of RLVR: for subjects where
          answers can be checked mechanically (math, code, following explicit rules), let the checker be
          the teacher.
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
          Because Tulu 3's example answers, comparison data, and practice problems are all public, you
          can genuinely reproduce a slice of it yourself: fine-tune an 8-billion-parameter model on part
          of its data using the LoRA add-on trick from lesson 3.2, then run DPO on its released
          comparisons using lesson 3.3's recipe -- all on rented cloud hardware over a long weekend. A
          fully published recipe at a scale one person can actually cook: that's what makes Tulu 3 this
          course's natural final destination.
        </p>
      </Section>
    </LessonLayout>
  );
}
