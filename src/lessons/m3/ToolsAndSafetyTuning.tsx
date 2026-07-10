import { LessonLayout } from "../../components/LessonLayout";
import { Section } from "../../components/Section";
import { ScopeScreen } from "../../components/ScopeScreen";
import { Toggle } from "../../components/Controls";
import { getLessonMeta } from "../../lib/syllabus";
import { useLabSetting } from "../../lib/storage";
import { colors } from "../../lib/theme";
import { Bi, pick, useLang, type Lang } from "../../lib/i18n";

const lesson = getLessonMeta(3, "tools-and-safety-tuning")!;

interface TraceStep {
  role: "user" | "assistant-call" | "tool-result" | "assistant-final";
  label: string;
  labelId: string;
  content: string;
  trained: boolean;
}

const TRACE: TraceStep[] = [
  {
    role: "user",
    label: "USER",
    labelId: "USER",
    content: "What's the weather in Tokyo right now?",
    trained: false,
  },
  {
    role: "assistant-call",
    label: "ASSISTANT — FUNCTION CALL",
    labelId: "ASISTEN — FUNCTION CALL",
    content: '{"tool_call": {"name": "get_weather", "arguments": {"location": "Tokyo"}}}',
    trained: true,
  },
  {
    role: "tool-result",
    label: "TOOL RESULT (runtime-injected)",
    labelId: "TOOL RESULT (disisipin sistem)",
    content: '{"temperature_c": 18, "condition": "cloudy"}',
    trained: false,
  },
  {
    role: "assistant-final",
    label: "ASSISTANT — GROUNDED ANSWER",
    labelId: "ASISTEN — JAWABAN BERDASAR DATA",
    content: "It's 18°C and cloudy in Tokyo right now.",
    trained: true,
  },
];

function traceLabel(t: TraceStep, lang: Lang): string {
  return lang === "id" ? t.labelId : t.label;
}

const ROLE_COLOR: Record<TraceStep["role"], string> = {
  user: colors.text,
  "assistant-call": colors.amber,
  "tool-result": colors.cyan,
  "assistant-final": colors.green,
};

export default function ToolsAndSafetyTuning() {
  const { lang } = useLang();
  const [stepIdx, setStepIdx] = useLabSetting("m3-tools-step", 3);
  const [grounded, setGrounded] = useLabSetting("m3-tools-grounded", true);

  return (
    <LessonLayout
      lesson={lesson}
      intro={
        <Bi
          en={
            <p>
              How does a model learn to check the weather, run code, or refuse a dangerous request? Here's
              the anticlimax: with the exact same training machinery from the last two lessons -- example
              conversations and better-vs-worse comparisons. Nothing new gets bolted onto the model. What
              changes is purely what the training conversations <em>contain</em> and what they're designed to
              teach.
            </p>
          }
          id={
            <p>
              Gimana model belajar ngecek cuaca, njalanin kode, atau nolak permintaan berbahaya? Ini
              antiklimaksnya: dengan mesin training yang persis sama dari dua pelajaran terakhir -- percakapan
              contoh dan perbandingan lebih-bagus-vs-lebih-jelek. Nggak ada yang baru dipasangin ke model. Yang
              berubah murni apa yang <em>dimuat</em> percakapan training-nya dan apa yang dirancang buat
              diajarinnya.
            </p>
          }
        />
      }
      takeaways={pick(
        lang,
        [
          "A model can't actually fetch the weather -- it can only write a request in an agreed format. Separate software reads the request, does the real work, and pastes the result back into the conversation for the model to read. Tool use is trained by showing thousands of examples of this exchange. (An 'agent' is just this loop repeated.)",
          "In those examples, the model is graded only on its own lines -- the request and the final answer. The pasted-in tool result is something it learns to read, never to invent.",
          "Refusing harmful requests is taught through the same two stages as helpfulness -- example refusals, plus comparisons where the appropriate response beats both dangerous compliance and pointless over-refusal. Safety is not a separate system.",
          "Constitutional AI has the model critique and revise its own answers against an explicit written list of principles, so AI-generated feedback can supplement expensive human labeling.",
          "Jailbreaks work by dressing a harmful request up to look unlike anything the safety training covered -- which is why teams attack their own model continuously (red-teaming), not as a one-time check before launch.",
        ],
        [
          "Model nggak bisa beneran ngambil data cuaca -- dia cuma bisa nulis permintaan dalam format yang disepakati. Software terpisah baca permintaan itu, ngerjain yang sesungguhnya, dan nempelin hasilnya balik ke percakapan buat dibaca model. Pemakaian tool di-training dengan nunjukin ribuan contoh pertukaran ini. ('Agent' cuma loop ini yang diulang.)",
          "Di contoh-contoh itu, model cuma dinilai di kalimatnya sendiri -- permintaan dan jawaban akhir. Tool result yang ditempel itu sesuatu yang dia pelajari buat dibaca, nggak pernah buat dikarang.",
          "Nolak permintaan berbahaya diajarin lewat dua tahap yang sama dengan sifat membantu -- contoh penolakan, plus perbandingan di mana respons yang pantas ngalahin baik kepatuhan berbahaya maupun penolakan berlebihan yang sia-sia. Keamanan bukan sistem terpisah.",
          "Constitutional AI nyuruh model ngritik dan ngerevisi jawabannya sendiri terhadap daftar prinsip tertulis yang gamblang, jadi feedback buatan AI bisa ngelengkapin pelabelan manusia yang mahal.",
          "Jailbreak jalannya dengan ndandanin permintaan berbahaya biar keliatan nggak mirip apa pun yang dicakup training keamanan -- itulah kenapa tim nyerang model mereka sendiri terus-terusan (red-teaming), bukan sekadar cek sekali sebelum rilis.",
        ],
      )}
      references={[
        {
          title: "Toolformer: Language Models Can Teach Themselves to Use Tools — Schick et al., 2023",
          meta: "arXiv:2302.04761",
          url: "https://arxiv.org/abs/2302.04761",
        },
        {
          title: "Constitutional AI: Harmlessness from AI Feedback — Bai et al., 2022",
          meta: "arXiv:2212.08073",
          url: "https://arxiv.org/abs/2212.08073",
        },
        {
          title: "Tool Use — Anthropic Documentation",
          meta: "docs.claude.com — a practical, current reference for function-calling formats",
          url: "https://docs.claude.com/en/docs/build-with-claude/tool-use",
        },
      ]}
    >
      <Section title={pick(lang, "Lab — a tool-call trace, step by step", "Lab — jejak tool-call, langkah demi langkah")}>
        <Bi
          en={
            <p>
              Step through a full exchange: the person asks, the model writes a weather request in the agreed
              format, outside software actually fetches the data and pastes it in, and the model turns it
              into a plain-language answer. Notice the labels -- the model is only trained on the turns it
              authors itself.
            </p>
          }
          id={
            <p>
              Telusurin satu pertukaran penuh: orangnya nanya, model nulis permintaan cuaca dalam format yang
              disepakati, software luar beneran ngambil datanya dan nempelinnya, dan model ngubahnya jadi
              jawaban bahasa sehari-hari. Perhatiin labelnya -- model cuma di-training di giliran yang dia
              tulis sendiri.
            </p>
          }
        />
        <ScopeScreen label="Step-through tool-call trace showing a user question, a function call, an injected tool result, and a grounded final answer">
          <div className="btn-row">
            <button type="button" className="btn" disabled={stepIdx <= 0} onClick={() => setStepIdx(Math.max(0, stepIdx - 1))}>← PREV TURN</button>
            <button type="button" className="btn btn--primary" disabled={stepIdx >= TRACE.length - 1} onClick={() => setStepIdx(Math.min(TRACE.length - 1, stepIdx + 1))}>NEXT TURN →</button>
          </div>
          {TRACE.slice(0, stepIdx + 1).map((t, i) => (
            <div key={i} className="panel-2" style={{ padding: 10, marginTop: 8, borderLeft: `3px solid ${ROLE_COLOR[t.role]}` }}>
              <div className="mono" style={{ fontSize: 10, color: ROLE_COLOR[t.role] }}>
                {traceLabel(t, lang)}{" "}
                {t.trained
                  ? pick(lang, "— LOSS-RELEVANT", "— DINILAI")
                  : pick(lang, "— NOT TRAINED", "— NGGAK DI-TRAINING")}
              </div>
              <div className="mono" style={{ fontSize: 12.5, marginTop: 4 }}>{t.content}</div>
            </div>
          ))}
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Lab — grounded vs. hallucinated", "Lab — berdasar data vs. ngarang")}>
        <Bi
          en={
            <p>
              Why bother with all this? Because without tools, the model still answers -- it just makes
              something up. A language model always produces fluent, confident text; fluency is no guarantee
              of truth. Flip the toggle to compare.
            </p>
          }
          id={
            <p>
              Buat apa repot-repot semua ini? Karena tanpa tool, model tetap njawab -- dia cuma ngarang.
              Language model selalu ngehasilin teks yang lancar dan percaya diri; kelancaran bukan jaminan
              kebenaran. Balik sakelarnya buat ngebandingin.
            </p>
          }
        />
        <ScopeScreen label="Toggle between a tool-grounded weather answer and an illustrative hallucinated guess with no tool access">
          <Toggle label="TOOL ACCESS ENABLED" checked={grounded} onChange={setGrounded} />
          <div className="panel-2" style={{ padding: 14, marginTop: 10, borderLeft: `3px solid ${grounded ? colors.green : colors.red}` }}>
            <div className="mono" style={{ fontSize: 11, color: grounded ? colors.green : colors.red, marginBottom: 6 }}>
              {grounded
                ? pick(lang, "TOOL-GROUNDED ANSWER", "JAWABAN BERDASAR DATA TOOL")
                : pick(lang, "NO TOOL ACCESS — ILLUSTRATIVE HALLUCINATION", "TANPA AKSES TOOL — CONTOH KARANGAN")}
            </div>
            <p style={{ margin: 0 }}>
              {grounded
                ? "It's 18°C and cloudy in Tokyo right now."
                : "It's probably around 20°C and partly cloudy in Tokyo today -- (a fluent, plausible-sounding guess with no actual current data behind it)."}
            </p>
          </div>
        </ScopeScreen>
      </Section>

      <Section title={pick(lang, "Safety tuning: the same pipeline, different data", "Tuning keamanan: pipeline sama, data beda")}>
        <Bi
          en={
            <p>
              Learning to decline genuinely harmful requests is trained exactly the way helpfulness is:
              example conversations showing appropriate refusals, plus comparisons where the right response
              -- a safe, helpful answer, or a polite refusal when warranted -- is chosen over both dangerous
              compliance <em>and</em> pointless over-caution. That last part matters, because there's a real
              tension here: push only on safety and the model starts refusing harmless questions ("how do I
              kill a process on my computer?"); push only on helpfulness and it risks going along with
              genuinely dangerous requests. Getting that balance right is an explicit goal teams work on
              directly, not something that happens by accident.
            </p>
          }
          id={
            <p>
              Belajar nolak permintaan yang beneran berbahaya di-training persis kayak sifat membantu:
              percakapan contoh yang nunjukin penolakan yang pantas, plus perbandingan di mana respons yang
              bener -- jawaban aman yang membantu, atau penolakan sopan kalau memang perlu -- dipilih di atas
              kepatuhan berbahaya <em>maupun</em> kehati-hatian berlebihan yang sia-sia. Bagian terakhir itu
              penting, karena ada ketegangan nyata di sini: dorong keamanan doang dan model mulai nolak
              pertanyaan nggak berbahaya ("gimana cara matiin proses di komputerku?"); dorong sifat membantu
              doang dan dia berisiko nurutin permintaan yang beneran berbahaya. Nyeimbanginnya dengan bener itu
              tujuan eksplisit yang digarap tim secara langsung, bukan sesuatu yang terjadi kebetulan.
            </p>
          }
        />
        <Bi
          en={
            <p>
              Labeling enough safe-versus-unsafe comparisons by hand is expensive, and{" "}
              <strong>Constitutional AI</strong> is one clever way around it: write out an explicit list of
              principles (a "constitution"), then have the model critique and revise its own answers against
              that list -- AI-generated feedback that supplements the human-labeled kind. And a note on{" "}
              <strong>jailbreaks</strong>, the prompts people craft to trick models past their training: they
              work by making a harmful request look unlike anything the safety examples covered -- wrapping it
              in a costume, a fictional story, an elaborate roleplay. The lesson a model learned from its
              training examples simply may not stretch to inputs that strange. That's why serious teams
              attack their own models continuously ("red-teaming"), treating safety as an ongoing practice
              rather than a box checked once before launch.
            </p>
          }
          id={
            <p>
              Ngelabelin cukup banyak perbandingan aman-versus-nggak-aman pakai tangan itu mahal, dan{" "}
              <strong>Constitutional AI</strong> itu satu jalan pintar ngakalinnya: tulis daftar prinsip yang
              gamblang (sebuah "konstitusi"), terus suruh model ngritik dan ngerevisi jawaban-jawabannya
              sendiri terhadap daftar itu -- feedback buatan AI yang ngelengkapin yang berlabel manusia. Dan
              catatan soal <strong>jailbreak</strong>, prompt yang dirancang orang buat ngecoh model ngelewatin
              training-nya: dia jalannya dengan bikin permintaan berbahaya keliatan nggak mirip apa pun yang
              dicakup contoh-contoh keamanan -- mbungkusnya dengan kostum, cerita fiksi, roleplay yang berbelit.
              Pelajaran yang dipetik model dari contoh training-nya bisa jadi memang nggak sampai merentang ke
              input seaneh itu. Itulah kenapa tim yang serius nyerang model mereka sendiri terus-terusan
              ("red-teaming"), nganggep keamanan sebagai praktik berkelanjutan daripada kotak yang dicentang
              sekali sebelum rilis.
            </p>
          }
        />
      </Section>
    </LessonLayout>
  );
}
