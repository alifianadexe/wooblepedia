# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wooblepedia ("LLM Fundamentals — Signal Lab Curriculum") is an interactive educational website teaching LLM fundamentals from tokenization through post-training. It has one dedicated lesson page per syllabus topic (22 total across three modules), each combining lecturer-style prose, an interactive visualization computed from real equations, and a references checklist. See [MAIN-PROMPT.md](MAIN-PROMPT.md) for the full original build spec (aesthetic rules, per-lesson content requirements, backend-engineering analogies to reuse).

## Commands

```bash
npm install
npm run dev         # start the Vite dev server
npm run typecheck   # tsc --noEmit
npm run build       # typecheck + production build to dist/
npm run preview     # preview the production build locally
```

There is no test suite configured.

## Architecture

- **`src/lib/math.ts`** — the single source of truth for every computed value shown in any lab: softmax, cross-entropy/perplexity, a real BPE trainer/encoder, sinusoidal positional encoding, scaled dot-product attention, GPT-2 parameter accounting, Chinchilla scaling laws, KV-cache sizing, LR schedules, gradient descent, DPO/Bradley-Terry loss, LoRA parameter budgets, and more. **Every lab must import its numbers from here — never hard-code a displayed value.** Includes `runMathSanityChecks()`, invoked once from `main.tsx` in dev mode.
- **`src/lib/syllabus.ts`** — the 22-topic registry (module, chapter, slug, title) that drives routing, the home dashboard, and prev/next ordering. `lessonKey()` in `src/lib/lessonKey.ts` namespaces localStorage keys by `module/slug` since module 2 and module 3 both have a lesson slugged `overview`.
- **`src/lib/storage.ts`** — all `localStorage` reads/writes (key prefix `llmfund:`) plus the React hooks (`useCompletion`, `useCompletedSlugs`, `useLabSetting`, `usePrefersReducedMotion`) lessons use to persist progress, reference-read state, and lab widget settings.
- **`src/lib/theme.ts`** — the oscilloscope color palette and font stacks as JS constants, mirroring the CSS custom properties in `src/styles/global.css`. Use these (not new hex literals) for any inline/SVG styling so the palette stays consistent.
- **`src/components/`** — shared chrome every lesson composes: `LessonLayout` (the standard page shell: channel header → intro → sections → takeaways → references → mark-complete → prev/next), `ChannelHeader`, `ScopeScreen` (the grid-background instrument panel wrapper), `Slider`/`Toggle`/`SegmentedControl`/`Readout` (generic lab controls), `RefChecklist`, `TakeawaysBox`, `PrevNext`, `SiteHeader`/`HeaderProgress`.
- **`src/lessons/{m1,m2,m3}/*.tsx`** — one file per lesson, registered in `src/lessons/index.ts` via `React.lazy` keyed as `` `${module}/${slug}` ``. Each lesson renders `<LessonLayout lesson={...} intro=... takeaways=... references=...>` with `<Section>` blocks and at least one lab built from `ScopeScreen` + real `math.ts` calls.
- **`src/pages/`** — `Home` (syllabus dashboard), `LessonPage` (resolves `:slug` against the module's lessons via the registry, wrapped in `Suspense`), `NotFound`.
- Routing: `/` , `/m1/:slug`, `/m2/:slug`, `/m3/:slug`, defined in `App.tsx`.

## Conventions to preserve

- **Voice: explain everything for a total beginner (high-schooler level).** Assume no programming, math, or ML background. Use everyday analogies (codebooks, librarians, hikers in fog, assembly lines) — NOT backend-engineering analogies; the backend analogies suggested in MAIN-PROMPT.md are superseded by this rule. Define every technical term in plain words at first use (token, vector, parameter, gradient, loss, KV-cache, …) and reuse the same analogies across lessons so later lessons can build on earlier ones.
- **Bilingual EN/ID.** English is the primary language; Indonesian is the secondary. The active language lives in `src/lib/i18n.tsx` (`LanguageProvider` + `useLang`, persisted under `llmfund:lang`; EN|ID switcher in `SiteHeader`). All lesson prose must ship in both languages: wrap JSX prose blocks in `<Bi en={…} id={…} />`, pick between parallel string arrays/objects with `pick(lang, en, id)`, give every `syllabus.ts` entry a `titleId`, and add chrome strings to the `UI` dictionary in `i18n.tsx`. References/citations stay in English in both languages.
- No UI framework; styling is hand-rolled CSS (`src/styles/global.css`) plus inline styles. Visualizations are hand-built SVG (or `<canvas>` for large heatmaps), never a charting library.
- Dark oscilloscope aesthetic: JetBrains Mono for instrument labels/numbers, Inter for prose, module accent colors from `moduleAccent` (cyan = Architecture, amber = Pre-Training, magenta = Post-Training).
- Every `<svg>` needs an `aria-label`; respect `prefers-reduced-motion` (global CSS already disables animation durations under that media query — prefer relying on that over ad hoc JS checks).
- When adding a new lesson: add its metadata to `syllabus.ts`, add a lazy entry to `lessons/index.ts`, and follow the existing lesson files as the template for structure and word count (~500-900 words of prose plus a genuinely computed lab).
