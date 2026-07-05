# Wooblepedia

**LLM Fundamentals — Signal Lab Curriculum**

A free, interactive curriculum that teaches LLM fundamentals from first principles — tokenization through post-training — for backend engineers with no prior ML background. Every lesson pairs a lecturer-style explanation with an interactive lab whose numbers are **genuinely computed from the real equations**, not hard-coded or schematic.

Built with [Claude Fable 5](https://claude.com).

## What's inside

22 lesson pages across three modules, each with prose, a live computed visualization, key takeaways, and linked references:

| Module | Topics | Focus |
|---|---|---|
| **1 — Architecture** | 9 lessons | Tokenizer, embeddings, positional encoding, attention, the residual stream, training, GPT-2 sizing |
| **2 — Pre-Training** | 8 lessons | Scaling laws, data engineering, distributed training systems, evaluation, a LLaMA 3 case study |
| **3 — Post-Training** | 5 lessons | SFT, DPO/RLHF, tool use and safety tuning, a Tulu 3 case study |

Every interactive lab imports its math from [`src/lib/math.ts`](src/lib/math.ts) — softmax, a real byte-pair-encoding trainer, sinusoidal positional encoding, scaled dot-product attention, GPT-2 parameter accounting, Chinchilla scaling laws, KV-cache sizing, DPO/Bradley-Terry loss, LoRA parameter budgets, gradient descent, and more. If a lab shows a number, that function computed it.

Progress, reference checklists, and lab settings persist to `localStorage` under the `llmfund:` key prefix.

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router](https://reactrouter.com/) for navigation
- No UI framework — hand-rolled CSS and hand-built SVG visualizations (no charting libraries)

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (defaults to `http://localhost:5173`).

### Other commands

```bash
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + production build to dist/
npm run preview     # preview the production build locally
```

## Project structure

```
src/
  lib/
    math.ts         # every formula used by every lab — pure, unit-testable functions
    syllabus.ts      # the 22-topic registry driving routing and the dashboard
    storage.ts       # localStorage-backed progress/settings + React hooks
    theme.ts         # oscilloscope color palette and typography constants
  components/        # shared UI: ChannelHeader, ScopeScreen, Slider, LessonLayout, etc.
  lessons/
    m1/ ... m2/ ... m3/   # one file per lesson (22 total)
  pages/             # Home dashboard, lesson router, 404
  styles/global.css  # the dark oscilloscope / instrument-panel aesthetic
```

## Design

Dark oscilloscope / instrument-panel aesthetic: monospace (JetBrains Mono) for instrument labels and numbers, a clean sans (Inter) for lecture prose, phosphor-trace accent colors per module, and scope-screen grid backgrounds. Responsive down to mobile, with visible keyboard focus rings and `prefers-reduced-motion` respected throughout.

## License

MIT — see [LICENSE](LICENSE).
