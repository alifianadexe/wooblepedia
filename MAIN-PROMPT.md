# CLAUDE CODE BUILD PROMPT — "LLM Fundamentals: Signal Lab Curriculum"

Copy everything below this line into Claude Code as your prompt.

---

Build a complete, production-quality educational website called **LLM Fundamentals — Signal Lab Curriculum**. It is a full interactive curriculum with **one dedicated lesson page for every one of the 22 syllabus topics** listed below. Every lesson page must contain three mandatory parts: (1) a detailed lecturer-style explanation, (2) at least one interactive visualization whose numbers are **genuinely computed from the real equations** (never hard-coded fake values, never schematic approximations), and (3) a references section with linked papers/resources specific to that topic.

## Who this is for

A single learner: a backend software engineer with no prior ML background, studying to become an LLM engineer. Consequences for the writing:

- Explain like a lecturer talking to one smart student. Warm, direct, rigorous. No hand-waving.
- Ground every concept in backend-engineering analogies where natural. Established ones that land well (reuse and extend them): tokenizer = serializer; embedding lookup = `SELECT vector FROM embeddings WHERE id = ?`; positional encoding = a `created_at` column; attention = a soft hash-map lookup (query/key/value); residual stream = middleware chain mutating a shared state object additively; GPUs = a stadium of parallel workers vs. a CPU's few senior engineers; attention = the network I/O of a block, the MLP = per-request compute.
- The learner owns an **8GB VRAM GPU**. Every time memory or compute is discussed, include a concrete "on your 8GB card" readout or callout.
- Three storage systems must never be conflated (call this out explicitly in the relevant lessons): tokenizer vocabulary (static JSON), token embedding matrix (model weights), vector databases (external, for RAG).

## Tech stack and project shape

- **Vite + React + TypeScript**. React Router for navigation. No UI framework — all styling hand-rolled (inline styles and/or CSS modules) to hit the exact aesthetic below. Zero heavy dependencies; SVG visualizations are hand-built, not charting libraries.
- Project must `npm run build` cleanly and pass `tsc --noEmit`. Verify both before finishing.
- **localStorage is available and expected** (this is a real website, not a sandboxed artifact): persist per-topic completion, per-reference read-checkboxes, and any lab settings worth restoring. Key prefix: `llmfund:`.
- Routes: `/` (home/dashboard), `/m1/:slug`, `/m2/:slug`, `/m3/:slug` — one route per topic. Prev/next lesson links at the bottom of every lesson in syllabus order.
- Code organization: `src/lessons/m1/*.tsx` etc., one file per lesson; shared components in `src/components/`; all math in `src/lib/math.ts` with unit-testable pure functions.

## Aesthetic (non-negotiable — this is the learner's established style)

Dark oscilloscope / instrument-panel. Palette:

- background `#070B12`, panel `#0C1322`, panel-2 `#101A2E`, screen `#08101E`
- border `#1C2B44`, grid lines `rgba(62,219,211,0.06)` as 24px background grid on "scope screens"
- phosphor traces: amber `#FFB454` (attention/primary signal), cyan `#3EDBD3` (data path), green `#8CE05F` (status/success), magenta `#E86AA6` (post-training/secondary), red `#F0716B` (over-budget/error)
- text `#DCE6F2`, muted `#64788F`, faint `#3A4A61`

Type: monospace (`JetBrains Mono` stack) for all instrument labels, headings, numbers, and formulas; a clean sans (`Inter` stack) for lecture prose at 15px / 1.75 line-height. Channel-strip headers on every lesson ("M2 · CH3 — SCALING LAWS", colored status dot with glow). Sentence-case prose, UPPERCASE mono for labels.

Quality floor: responsive down to mobile, visible keyboard focus rings, `prefers-reduced-motion` respected on all animations, every SVG has an aria-label. No emoji.

## Global site features

1. **Home dashboard**: the three modules rendered like the learner's syllabus card (Architecture 9 topics / Pre-Training 8 / Post-Training 5), each topic a row with completion dot, linking to its lesson. Overall progress bar ("CALIBRATION n/22") in a sticky header present on every page.
2. **Per-lesson layout**: channel header → "why this matters" intro paragraph → sections of prose interleaved with the interactive lab(s) → a "key takeaways" box (3–5 bullets, mono) → references checklist → mark-complete button → prev/next.
3. **All interactive labs must compute for real.** Put every formula in `src/lib/math.ts` (softmax, cross-entropy, Chinchilla loss, param counts, sigmoid, BPE merge step, sinusoidal PE, etc.) and import them. If a lab displays a number, that number must be the output of one of these functions.

---

## THE 22 LESSONS — full per-topic spec

### MODULE 1 — ARCHITECTURE (cyan accent)

**1.1 Introduction**
- Explain: what an LLM actually is — an autoregressive next-token predictor; the full request lifecycle text → tokens → vectors → blocks → logits → sampled token → loop; why "predict the next token" at scale yields apparent understanding; parameters vs. activations; where this course goes.
- Visualization: animated end-to-end pipeline (the "signal path") — a pulse sweeping through 8 clickable stages (raw text, tokenizer, embedding, +position, attention, MLP, LM head, softmax→sample), each click showing a detail panel. Add a "run one generation step" mode that appends a sampled token to a visible sequence and loops.
- References: Vaswani et al. 2017 (arxiv 1706.03762); Alammar, The Illustrated Transformer; 3Blue1Brown neural networks series.

**1.2 Tokenization**
- Explain: why not characters or words; byte-pair encoding from first principles — start from bytes, repeatedly merge the most frequent pair; vocabulary as static JSON (merge rules + id map), zero learned weights; tokenization quirks (whitespace, numbers, non-English inefficiency) and why they cause real bugs; vocab-size trade-off.
- Visualization: **a real BPE trainer/encoder**. Train actual merges live on a tiny built-in corpus (implement the merge loop in math.ts), show the merge table growing step by step with a "next merge" button; then a text input where the user types anything and sees it segmented into tokens with ids using the learned merges. Show token count vs. character count ratio.
- References: Sennrich et al. 2015 (arxiv 1508.07909, BPE for NMT); GPT-2 paper (Radford et al. 2019); Karpathy, "Let's build the GPT Tokenizer" video + minbpe repo.

**1.3 The Embedding Layer**
- Explain: the embedding matrix as learned weights — a `vocab × d` table, lookup = row fetch; embeddings as coordinates in meaning-space; cosine similarity; explicitly disambiguate the three storage systems (tokenizer JSON / embedding weights / vector DBs); weight tying preview (same matrix reused at the output).
- Visualization: a 2-D toy embedding space (12–16 words with hand-designed 2-D coordinates that cluster semantically: animals, verbs, articles…). Click any two words → draw the vectors, compute and display the real cosine similarity and dot product. A second panel: "the lookup" — click a token id, watch the corresponding row highlight in a rendered matrix and slide out as the vector.
- References: Mikolov et al. 2013 (arxiv 1301.3781, word2vec); Alammar, The Illustrated Word2Vec; Press & Wolf 2016 (arxiv 1608.05859, weight tying).

**1.4 Positional Encoding**
- Explain: attention is permutation-invariant, so order must be injected — the `created_at` column; sinusoidal PE from the original paper with the actual formula PE(pos,2i)=sin(pos/10000^(2i/d)); why multiple frequencies (clock-hands intuition: fast dims disambiguate neighbors, slow dims encode coarse position); learned absolute embeddings; modern RoPE in one paragraph (rotate q,k pairs by position-dependent angle so attention depends on relative offset).
- Visualization: **compute and render the real sinusoidal PE matrix** as a heatmap (positions × dims, d=64, 128 positions), amber-cyan diverging color scale; sliders for position → overlay that row as a waveform trace on a scope screen; a comparison toggle showing two identical tokens ("the" at pos 0 and pos 4) getting different final vectors.
- References: Vaswani et al. 2017 §3.5; Su et al. 2021 (arxiv 2104.09864, RoPE); Kazemnejad, "Transformer Architecture: positional encoding" blog.

**1.5 Attention**
- Explain: the soft hash map in full — q = x·Wq ("what am I looking for"), k ("what do I advertise"), v ("what I hand over"); scores s = q·k/√d and why the √d scaling prevents softmax saturation; softmax to weights; output = Σwᵢvᵢ; **the causal mask** — set future scores to −∞ before softmax so e^{−∞}=0, the single difference between BERT-style encoders and GPT-style generators; KV-caching consequence for inference.
- Visualization: the full attention playground. Sentence "the cat sat on the mat" with hand-crafted 4-d q/k vectors; click any token as query → arcs fan to all tokens with thickness/opacity = real softmax weight, bars with weights and raw scores beneath; causal-mask toggle that dims masked tokens and shows s = −∞; below it, the complete 6×6 weight-matrix heatmap (all queries at once — one batched matmul) with values, upper triangle zeroing when masked.
- References: Vaswani et al. 2017; Alammar, The Illustrated Transformer (attention section); Anthropic, "A Mathematical Framework for Transformer Circuits" (transformer-circuits.pub 2021).

**1.6 Layers of Understanding**
- Explain: multi-head attention — h parallel heads with separate smaller Wq/Wk/Wv, concat + Wo, so different heads track different relations (syntax, position, identity); **the residual stream** — sublayers read the stream, compute a delta, add it back (middleware chain), why gradients survive 100+ layers; layer norm as the stabilizer; attention = the only cross-token communication, MLP = per-token compute holding ~2/3 of parameters and acting as key-value memory; what shallow vs. deep layers tend to learn.
- Visualization: (a) three genuinely different attention heads over the same sentence rendered as three small heatmaps — a content "subject-finder" head, a position-derived "previous-token" head (queries built from position one-hots), a "same-token" similarity head — all computed live; (b) the residual bus: horizontal animated stream with ATTENTION and MLP tap-boxes reading down and writing back up through ⊕ junctions, dash-flow animation, reduced-motion safe.
- References: Anthropic Transformer Circuits framework 2021; Elhage et al., "Softmax Linear Units / superposition" follow-ups optional; Geva et al. 2020 (arxiv 2012.14913, FFNs as key-value memories).

**1.7 Learning to Predict**
- Explain: the training loop — forward pass, cross-entropy loss = −ln p(correct next token) averaged over positions, backward pass, optimizer step; why confidently-wrong is punished brutally and hedging is cheap (curve shape); perplexity = e^loss ("as uncertain as choosing uniformly among k tokens"); gradient descent intuition; AdamW in one paragraph; teacher forcing (all positions trained in parallel thanks to the causal mask).
- Visualization: (a) p(correct) slider → live loss and perplexity, with the −ln curve drawn and the current point marked; (b) **a real gradient-descent lab**: a 1-D loss surface (a fixed smooth polynomial), a learning-rate slider, a "step" and "run" button that iterate actual gradient descent (compute the derivative in code), leaving a trail of steps — show divergence at high LR and crawling at low LR.
- References: Karpathy, "The spelled-out intro to neural networks: backpropagation" (micrograd video); Loshchilov & Hutter 2017 (arxiv 1711.05101, AdamW); 3Blue1Brown gradient descent chapter.

**1.8 Instruction Tuning and RLHF (preview)**
- Explain: the gap — a pre-trained model is a completion engine, not an assistant (ask it a question, it may continue with more questions); the three-stage fix at a preview level: SFT on demonstrations, preference optimization from chosen/rejected pairs, RL variants; the punchline that same architecture + different weights = entirely different behavior; forward-reference Module 3 where each stage gets a full lesson.
- Visualization: a "base vs. instruct" console — one prompt, a toggle that switches between a plausible base-model continuation (rambling completion) and an instruct-model answer, annotated with what changed and why; beneath, a compact 5-stage post-training pipeline whose stages link directly to the Module 3 lessons.
- References: Ouyang et al. 2022 (arxiv 2203.02155, InstructGPT); Anthropic, "Training a helpful and harmless assistant" (arxiv 2204.05862).

**1.9 GPT-2 from Scratch**
- Explain: the capstone — sizing before coding; the exact parameter accounting: embeddings = vocab·d + ctx·d; per block = 12d² + 13d (attention 4d²+4d, MLP 8d²+5d, layer norms 4d); final LN 2d; verify GPT-2 small = 124M live; training memory ≈ 16 bytes/param (fp16 weights + grads + two AdamW moments) vs. 2 bytes/param inference; what fits on 8GB; then the implementation map — walk the nanoGPT file structure (model.py: CausalSelfAttention, MLP, Block, GPT; train.py loop) as prose with a rendered module tree, and a concrete "your first run" recipe (Shakespeare char-level on the 8GB card).
- Visualization: the **parameter budget console**: d_model and n_layers sliders + GPT-2 small/medium/large/XL presets; stacked breakdown bars (embeddings/attention/MLP/norms) with live totals; fp16-inference and AdamW-training GB readouts with green/amber/red "fits your 8GB card" verdicts.
- References: Radford et al. 2019 (GPT-2 paper PDF on OpenAI CDN); Karpathy nanoGPT repo + "Let's build GPT from scratch" video; Bahdanau-era history optional.

### MODULE 2 — PRE-TRAINING (amber accent)

**2.1 Overview**
- Explain: pre-training as the expensive phase that writes knowledge into weights — one objective (next-token CE) over trillions of tokens; the three currencies (compute C, parameters N, data D) and C ≈ 6·N·D; the phase map of a training run (data prep → tokenize/shard → train with checkpoints → evaluate); orders of magnitude across model history; why everything hard here is engineering, not math.
- Visualization: an interactive "three currencies" triangle/console: sliders for any two of N, D → compute C = 6ND live with historical model markers (GPT-2 ~1e21, GPT-3 ~3e23, Llama-3-405B ~3.8e25) plotted on a log compute axis; hovering a marker shows that model's N and D.
- References: Kaplan et al. 2020 (arxiv 2001.08361); Brown et al. 2020 (arxiv 2005.14165, GPT-3); Epoch AI compute trends dashboard (epochai.org).

**2.2 Training Objectives and Architectural Details**
- Explain: the objective barely changed since GPT-2 — what changed is the block: LayerNorm→RMSNorm (drop the mean, cheaper), GELU MLP→SwiGLU (gated, 3 matrices, hidden ≈ 8/3·d), learned absolute positions→RoPE, MHA→**GQA** (groups of query heads share K/V heads to shrink the KV cache), pre-norm placement, no biases; each with one-line "why".
- Visualization: (a) a side-by-side "GPT-2 block vs. Llama-3 block" schematic with each differing component clickable for its rationale; (b) **a real KV-cache calculator**: sliders for layers, kv_heads (vs. query heads), head_dim, context length, batch → KV bytes = 2 · layers · kv_heads · head_dim · ctx · 2 bytes (fp16) · batch, live GB readout, GQA slider showing the cache shrink from 128 KV heads to 8, with the 8GB-card verdict.
- References: Zhang & Sennrich 2019 (arxiv 1910.07467, RMSNorm); Shazeer 2020 (arxiv 2002.05202, GLU variants); Su et al. 2021 (RoPE); Ainslie et al. 2023 (arxiv 2305.13245, GQA).

**2.3 Scaling Laws and Optimization**
- Explain: Kaplan's power laws; the Chinchilla correction and its fitted loss L(N,D) = 1.69 + 406.4/N^0.34 + 410.7/D^0.28; compute-optimal ≈ 20 tokens/param; why modern models deliberately overtrain (inference economics — the curve is shallow to the right); the 1.69 floor as irreducible text entropy; then optimization: LR warmup + cosine decay (give the actual schedule formula), batch size ramp, gradient clipping, loss-spike lore.
- Visualization: (a) the **Chinchilla allocation lab**: compute-budget slider 10^19–10^26 FLOPs, tokens-per-param slider 1–200; live N, D, predicted loss, perplexity; the full loss-vs-ratio curve at the chosen budget with the optimal marker and the user's point; (b) an **LR schedule plotter**: warmup steps + max LR + total steps sliders → the real warmup-linear + cosine-decay curve drawn and annotated.
- References: Kaplan et al. 2020; Hoffmann et al. 2022 (arxiv 2203.15556, Chinchilla); Loshchilov & Hutter 2016 (arxiv 1608.03983, SGDR/cosine).

**2.4 Training Data Engineering**
- Explain: the funnel — crawl (Common Crawl) → text extraction from HTML → language ID → quality filtering (heuristics: length, symbol ratios; model-based classifiers) → deduplication (exact hash + fuzzy MinHash) → PII/contamination scrubbing → mixture weighting by ablation; only a few percent of raw crawl survives; why dedup matters twice (wasted compute + memorization); decontamination against eval sets; the thesis that data quality is the highest-leverage area for small teams (FineWeb as proof).
- Visualization: an **interactive pipeline funnel**: stages as scope panels with toggle-able filters; a counter starting at 100 TB raw showing realistic retention percentages shrinking live as stages toggle; a final mixture donut/stacked-bar (web/code/math/multilingual/books) with draggable weights that renormalize to 100% and a note on what each slice buys.
- References: Penedo et al. 2024 FineWeb (HF blog + arxiv 2406.17557); Lee et al. 2021 (arxiv 2107.06499, dedup); Soldaini et al. 2024 (arxiv 2402.00159, Dolma).

**2.5 Training Infrastructure and Systems**
- Explain: memory arithmetic first — 2 B/param to hold fp16, ~16 B/param to train with AdamW mixed precision, before activations; then the three parallelisms: data (replicate model, split batch; gradients all-reduced), tensor (split individual matmuls — Megatron), pipeline (split layers into stages, microbatching to hide bubbles); ZeRO/FSDP sharding optimizer states/grads/params across DP ranks; activation checkpointing; failure rates and checkpoint-resume at 16k-GPU scale.
- Visualization: the **memory console**: model-size slider (1B–405B log), GPU-count slider (1–1024), INFERENCE/TRAIN mode toggle, REPLICATED vs ZeRO-3 toggle → per-GPU GB computed live with a GPU-grid recoloring (full replica vs 1/G shards), verdicts against H100 80GB and the 8GB home card; plus a DP/TP/PP mode switch that recolors an 8-GPU grid by what each GPU holds (same data different layers / same layers different slices / replicas).
- References: Shoeybi et al. 2019 (arxiv 1909.08053, Megatron-LM); Rajbhandari et al. 2019 (arxiv 1910.02054, ZeRO); Narayanan et al. 2021 (arxiv 2104.04473, efficient large-scale training); Llama 3 paper §infrastructure.

**2.6 Advanced Pretraining Objectives**
- Explain: variants layered on next-token: fill-in-the-middle for code (rearrange to prefix|suffix|middle with sentinels so a causal model learns infilling); multi-token prediction (extra heads predict t+2, t+3 — denser signal, later powers speculative decoding); long-context extension (RoPE theta scaling / position interpolation, staged context growth); curriculum & annealing (high-quality data last); brief span-corruption/UL2 contrast.
- Visualization: a **FIM transformer**: a code snippet where the user drags to select the "middle"; the lab shows the literal rearranged training sequence with colored sentinel tokens (<PRE> prefix <SUF> suffix <MID> middle) and the loss region; a second small panel toggling 1-token vs 4-token prediction heads on a sequence diagram.
- References: Bavarian et al. 2022 (arxiv 2207.14255, FIM); Gloeckle et al. 2024 (arxiv 2404.19737, multi-token prediction); Chen et al. 2023 (arxiv 2306.15595, position interpolation).

**2.7 Evaluation During Pretraining**
- Explain: the training loss curve as the primary instrument — held-out loss, perplexity = e^loss; scaling-law fits as sanity checks mid-run; benchmark suites sampled during training (MMLU, HellaSwag, HumanEval…) and emergence-looking jumps (often metric artifacts — discuss); contamination checking; loss spikes and what teams do (rewind, skip batch, lower LR).
- Visualization: a **simulated training-run scope**: generate a realistic loss curve from the actual power law L(t) = L∞ + a·t^(−b) plus seeded noise and 1–2 injected spikes; scrubber over training steps showing live loss and perplexity; toggle overlay of a benchmark accuracy curve that stays flat then climbs, with an annotation on smooth-loss-vs-jumpy-benchmark; a "spike" annotation explaining recovery options.
- References: Hoffmann et al. 2022; Wei et al. 2022 (arxiv 2206.07682, emergent abilities); Schaeffer et al. 2023 (arxiv 2304.15004, "Are emergent abilities a mirage?").

**2.8 Case Study — LLaMA 3**
- Explain: read the whole module through one model: 405B dense (no MoE — argument: simple architecture + data + scale), 126 layers, d=16384, 128 heads GQA 8 KV, 128K vocab, 15.6T tokens (~38 tok/param — deliberately past Chinchilla, per lesson 2.3), staged long-context training, up to 16K H100s, real-world failure/recovery cadence, annealing on high-quality data; what the paper is unusually candid about and why it's the best public systems document.
- Visualization: a **spec dashboard** with every headline number as an instrument card, where each card cross-links to the lesson that explains it (tok/param → 2.3, GQA → 2.2, 16K GPUs → 2.5); plus a live C = 6ND computation from its actual N and D showing ≈3.8×10^25 FLOPs, and the memory console preset to 405B/TRAIN to show why 16K GPUs is not optional.
- References: Llama 3 herd of models (arxiv 2407.21783); Meta AI engineering blog on Llama 3 infrastructure.

### MODULE 3 — POST-TRAINING (magenta accent)

**3.1 Overview**
- Explain: the base model is a mirror of the internet — brilliant and useless as an assistant; post-training as the small surgical phase (fraction of pre-training compute) that shapes behavior; the standard pipeline base → SFT → preference optimization → RL/safety/tools → deployed assistant; the key mental model: identical architecture and forward pass — every behavioral difference lives in the weights; why post-training is where an individual with modest compute genuinely competes (LoRA + DPO on 8B = a cloud-GPU weekend).
- Visualization: the **five-stage pipeline console**: clickable stages with detail panels; each stage links to its dedicated lesson; a before/after strip showing the same prompt answered at each stage of the pipeline (illustrative continuations, clearly labeled as illustrative — the pipeline mechanics are the real content).
- References: Ouyang et al. 2022 (InstructGPT); Lambert, "RLHF Book / rlhfbook.com"; Tulu 3 paper (arxiv 2411.15124) as the module's spine.

**3.2 Supervised Fine-Tuning**
- Explain: SFT = pre-training's cross-entropy on curated (prompt, ideal response) conversations; the chat template — special tokens creating turn structure the model conditions on; **the loss mask** — gradients only through assistant tokens so the model learns to answer, not to imitate users; data quality >> quantity (LIMA result); multi-turn packing; then the practical path for the learner: **LoRA** — freeze weights, learn low-rank adapters ΔW = B·A, trainable params = Σ r·(d_in + d_out) over targeted matrices; QLoRA (4-bit base + adapters) as the 8GB unlock.
- Visualization: (a) the **template & mask microscope**: a real templated conversation with special tokens rendered as chips; LOSS MASK toggle dims everything except assistant spans; (b) a **LoRA budget lab**: rank r slider (1–256, log), target-modules checkboxes (q,k,v,o,up,down,gate) on an 8B-param Llama-style config → live trainable-param count and % of full model, plus QLoRA memory estimate vs. the 8GB card.
- References: Zhou et al. 2023 (arxiv 2305.11206, LIMA); Hu et al. 2021 (arxiv 2106.09685, LoRA); Dettmers et al. 2023 (arxiv 2305.14314, QLoRA); Tulu 3 SFT mixture section.

**3.3 Preference Optimization**
- Explain: some qualities are easier to judge than to demonstrate → collect chosen/rejected pairs; Bradley-Terry: p(chosen ≻ rejected) = σ(r_c − r_r); classic RLHF: train a reward model on pairs, then PPO against it with a KL penalty keeping the policy near the reference; **DPO**: the same objective collapses into a direct classification loss L = −log σ(β·[(log π/π_ref)(chosen) − (log π/π_ref)(rejected)]) — no reward model, no rollouts; read the loss curve (steep when the model prefers the rejected answer, flat once learned); β as the KL leash; honest trade-offs RLHF vs DPO vs newer variants (IPO/KTO/GRPO one-liners).
- Visualization: (a) the **DPO lab**: β and margin sliders → live loss on the real −log σ(β·m) curve with the current point, gradient-magnitude annotation; (b) a **Bradley-Terry panel**: two reward sliders → live p(chosen) via sigmoid of the difference; (c) a compact RLHF-vs-DPO pipeline diagram (reward model + PPO loop vs. single loss) with pros/cons.
- References: Christiano et al. 2017 (arxiv 1706.03741, deep RL from human preferences); Ouyang et al. 2022; Rafailov et al. 2023 (arxiv 2305.18290, DPO); Schulman et al. 2017 (arxiv 1707.06347, PPO).

**3.4 Tools and Safety Tuning**
- Explain: tool use is a data problem inside SFT/RL — train on function-call traces: model emits structured JSON call → runtime executes → result returns as a special-role message → model continues; schema-following, when-to-call-vs-answer, parallel calls; agents = this loop iterated. Safety tuning: refusal data through SFT + preference stages; the helpful/harmless tension; Constitutional AI — AI feedback judged against explicit written principles (RLAIF) instead of only human labels; jailbreaks as distribution shift; evals/red-teaming.
- Visualization: an **interactive tool-call trace**: a chat-style scope where stepping through shows each turn materialize — user ask → assistant JSON function call (rendered as a syntax-highlighted instrument card) → tool result → grounded final answer — with the loss-relevant spans highlighted (which turns the model is trained to produce); a side toggle "no-tool hallucinated answer vs. tool-grounded answer".
- References: Schick et al. 2023 (arxiv 2302.04761, Toolformer); Bai et al. 2022 (arxiv 2212.08073, Constitutional AI); Anthropic tool-use docs (docs.claude.com) as a practical reference.

**3.5 Case Study — Tulu 3**
- Explain: the only frontier-adjacent post-training pipeline that is fully inspectable — AI2 released data, code, weights, and decisions; base Llama 3.1 8B/70B; the three stages exactly as taught: SFT on a curated mixture (with per-source ablations), DPO on on-policy + off-policy preference pairs, then **RLVR** — RL where the reward is a programmatic verifier (did the math answer match? was the constraint satisfied?) rather than a learned preference model; decontamination discipline; how to reproduce a slice of it on rented GPUs as the learner's own capstone.
- Visualization: (a) a **recipe dashboard** mirroring the LLaMA-3 spec-card pattern (stages, data scale, evals) with cards linking back to lessons 3.2/3.3; (b) a **toy RLVR console**: a small set of math prompts; the user picks a model "answer" from candidates; a real verifier function checks it and emits reward 1/0; a running mean-reward trace updates — making "reward = a program, not a preference" tactile.
- References: Lambert et al. 2024 (arxiv 2411.15124, Tulu 3); AI2 Tulu 3 blog + released datasets on Hugging Face; DPO and PPO papers from 3.3 as supporting reading.

---

## Build order (work in these phases, verifying as you go)

1. Scaffold Vite+React+TS, router, theme constants, shared components (ChannelHeader, ScopeScreen, Slider, RefChecklist, TakeawaysBox, ProgressStore with localStorage), `src/lib/math.ts` with all pure functions + a few sanity assertions (GPT-2 small = ~124.4M; Chinchilla loss decreasing in N and D; softmax sums to 1).
2. Home dashboard + navigation + progress system.
3. Module 1 lessons (1.1–1.9).
4. Module 2 lessons (2.1–2.8).
5. Module 3 lessons (3.1–3.5).
6. Final pass: `tsc --noEmit`, `npm run build`, keyboard/reduced-motion audit, mobile check, prev/next link integrity across all 22 lessons.

Do not stub any lesson. Every one of the 22 pages ships with real prose (500–900 words), a working computed visualization, takeaways, and references. If context runs long, complete lessons fully one at a time rather than sketching all of them thinly.
