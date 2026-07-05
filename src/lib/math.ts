/**
 * Pure, unit-testable math functions backing every interactive lab in the
 * curriculum. Every number shown in a visualization traces back to a call
 * into this file -- nothing here is a hard-coded display value.
 */

// ---------------------------------------------------------------------------
// Basics: activation functions, vector ops
// ---------------------------------------------------------------------------

export function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export function relu(x: number): number {
  return Math.max(0, x);
}

/** Weighted random draw over a probability distribution using an injected RNG (mulberry32 for reproducibility). */
export function sampleFromDistribution(probs: number[], rand: () => number): number {
  const r = rand();
  let cumulative = 0;
  for (let i = 0; i < probs.length; i++) {
    cumulative += probs[i];
    if (r <= cumulative) return i;
  }
  return probs.length - 1;
}

export function softmax(logits: number[]): number[] {
  const finite = logits.filter((x) => Number.isFinite(x));
  const max = finite.length > 0 ? Math.max(...finite) : 0;
  const exps = logits.map((x) => (Number.isFinite(x) ? Math.exp(x - max) : 0));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => (sum > 0 ? e / sum : 0));
}

export function dotProduct(a: number[], b: number[]): number {
  return a.reduce((sum, v, i) => sum + v * b[i], 0);
}

export function magnitude(a: number[]): number {
  return Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
}

/** y = W*x, where W is stored as an array of rows. */
export function matVecMul(matrix: number[][], vec: number[]): number[] {
  return matrix.map((row) => dotProduct(row, vec));
}

export function cosineSimilarity(a: number[], b: number[]): number {
  const denom = magnitude(a) * magnitude(b);
  return denom === 0 ? 0 : dotProduct(a, b) / denom;
}

// ---------------------------------------------------------------------------
// Training loss / perplexity
// ---------------------------------------------------------------------------

/** Cross-entropy loss of a single next-token prediction: -ln p(correct). */
export function crossEntropyFromProb(pCorrect: number): number {
  const clamped = Math.min(Math.max(pCorrect, 1e-9), 1);
  return -Math.log(clamped);
}

export function perplexity(loss: number): number {
  return Math.exp(loss);
}

// ---------------------------------------------------------------------------
// Sinusoidal positional encoding (Vaswani et al. 2017, eq. 3.5)
// ---------------------------------------------------------------------------

export function sinusoidalPE(pos: number, dim: number, dModel: number): number {
  const i = Math.floor(dim / 2);
  const angle = pos / Math.pow(10000, (2 * i) / dModel);
  return dim % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
}

export function buildSinusoidalPEMatrix(numPositions: number, dModel: number): number[][] {
  const matrix: number[][] = [];
  for (let pos = 0; pos < numPositions; pos++) {
    const row: number[] = [];
    for (let dim = 0; dim < dModel; dim++) {
      row.push(sinusoidalPE(pos, dim, dModel));
    }
    matrix.push(row);
  }
  return matrix;
}

// ---------------------------------------------------------------------------
// Attention
// ---------------------------------------------------------------------------

export function attentionScores(
  queries: number[][],
  keys: number[][],
  dK: number,
  causalMask = false,
): number[][] {
  return queries.map((q, i) =>
    keys.map((k, j) => {
      if (causalMask && j > i) return -Infinity;
      return dotProduct(q, k) / Math.sqrt(dK);
    }),
  );
}

export function attentionWeights(scores: number[][]): number[][] {
  return scores.map((row) => softmax(row));
}

export function attentionOutput(weights: number[][], values: number[][]): number[][] {
  const dim = values[0]?.length ?? 0;
  return weights.map((wRow) => {
    const out = new Array(dim).fill(0);
    wRow.forEach((w, j) => {
      for (let d = 0; d < dim; d++) out[d] += w * values[j][d];
    });
    return out;
  });
}

// ---------------------------------------------------------------------------
// Byte-pair encoding -- a real trainer + encoder, not a lookup table
// ---------------------------------------------------------------------------

export interface BPEMergeStep {
  rank: number;
  pair: [string, string];
  merged: string;
  frequency: number;
}

export const END_OF_WORD = "·"; // visible middle-dot marker for the end of a word

function wordToSymbols(word: string): string[] {
  return [...word.split(""), END_OF_WORD];
}

/** Train BPE merges on a corpus of words (repeats = frequency), exactly like the original algorithm. */
export function trainBPE(corpusWords: string[], numMerges: number): BPEMergeStep[] {
  const wordFreq = new Map<string, number>();
  for (const w of corpusWords) wordFreq.set(w, (wordFreq.get(w) ?? 0) + 1);

  let corpus: { symbols: string[]; freq: number }[] = Array.from(wordFreq.entries()).map(
    ([w, f]) => ({ symbols: wordToSymbols(w), freq: f }),
  );

  const steps: BPEMergeStep[] = [];
  const SEP = "";

  for (let rank = 0; rank < numMerges; rank++) {
    const pairFreq = new Map<string, number>();
    for (const { symbols, freq } of corpus) {
      for (let i = 0; i < symbols.length - 1; i++) {
        const key = symbols[i] + SEP + symbols[i + 1];
        pairFreq.set(key, (pairFreq.get(key) ?? 0) + freq);
      }
    }
    if (pairFreq.size === 0) break;

    let bestKey = "";
    let bestFreq = -1;
    for (const [key, freq] of pairFreq) {
      if (freq > bestFreq) {
        bestFreq = freq;
        bestKey = key;
      }
    }
    const [a, b] = bestKey.split(SEP);
    const merged = a + b;

    corpus = corpus.map(({ symbols, freq }) => {
      const next: string[] = [];
      let i = 0;
      while (i < symbols.length) {
        if (i < symbols.length - 1 && symbols[i] === a && symbols[i + 1] === b) {
          next.push(merged);
          i += 2;
        } else {
          next.push(symbols[i]);
          i += 1;
        }
      }
      return { symbols: next, freq };
    });

    steps.push({ rank, pair: [a, b], merged, frequency: bestFreq });
  }

  return steps;
}

/** Encode a single word by greedily applying learned merges in rank order. */
export function bpeEncodeWord(word: string, merges: BPEMergeStep[]): string[] {
  const rankOf = new Map<string, number>();
  merges.forEach((m, idx) => rankOf.set(m.pair[0] + "" + m.pair[1], idx));

  let symbols = wordToSymbols(word.toLowerCase());
  while (symbols.length > 1) {
    let bestRank = Infinity;
    let bestIdx = -1;
    for (let i = 0; i < symbols.length - 1; i++) {
      const key = symbols[i] + "" + symbols[i + 1];
      const r = rankOf.get(key);
      if (r !== undefined && r < bestRank) {
        bestRank = r;
        bestIdx = i;
      }
    }
    if (bestIdx === -1) break;
    symbols = [
      ...symbols.slice(0, bestIdx),
      symbols[bestIdx] + symbols[bestIdx + 1],
      ...symbols.slice(bestIdx + 2),
    ];
  }
  return symbols;
}

/** Encode free text, preserving whitespace as separate display tokens. */
export function bpeEncodeText(text: string, merges: BPEMergeStep[]): string[] {
  const pieces = text.split(/(\s+)/).filter((p) => p.length > 0);
  const tokens: string[] = [];
  for (const piece of pieces) {
    if (/^\s+$/.test(piece)) {
      tokens.push(piece);
      continue;
    }
    tokens.push(...bpeEncodeWord(piece, merges));
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// GPT-2 style parameter accounting
// ---------------------------------------------------------------------------

export interface GPT2ParamBreakdown {
  embeddings: number;
  attention: number;
  mlp: number;
  layerNorms: number;
  perBlockTotal: number;
  allBlocksTotal: number;
  finalLN: number;
  total: number;
}

/** embeddings = vocab*d + ctx*d; per block = 12d^2 + 13d; final LN = 2d. */
export function gpt2ParamCount(
  dModel: number,
  nLayers: number,
  vocabSize: number,
  ctxLen: number,
): GPT2ParamBreakdown {
  const embeddings = vocabSize * dModel + ctxLen * dModel;
  const attentionPerBlock = 4 * dModel * dModel + 4 * dModel;
  const mlpPerBlock = 8 * dModel * dModel + 5 * dModel;
  const normsPerBlock = 4 * dModel;
  const perBlockTotal = attentionPerBlock + mlpPerBlock + normsPerBlock;
  const allBlocksTotal = perBlockTotal * nLayers;
  const finalLN = 2 * dModel;
  const total = embeddings + allBlocksTotal + finalLN;

  return {
    embeddings,
    attention: attentionPerBlock * nLayers,
    mlp: mlpPerBlock * nLayers,
    layerNorms: normsPerBlock * nLayers + finalLN,
    perBlockTotal,
    allBlocksTotal,
    finalLN,
    total,
  };
}

// ---------------------------------------------------------------------------
// Memory arithmetic
// ---------------------------------------------------------------------------

export function inferenceMemoryBytes(totalParams: number, bytesPerParam = 2): number {
  return totalParams * bytesPerParam;
}

/** Mixed-precision AdamW: fp16 weights (2B) + fp16 grads (2B) + fp32 master (4B) + fp32 m (4B) + fp32 v (4B) = 16B/param. */
export function trainingMemoryBytes(totalParams: number, bytesPerParam = 16): number {
  return totalParams * bytesPerParam;
}

export function bytesToGB(bytes: number): number {
  return bytes / 1024 ** 3;
}

export type ParallelMode = "replicated" | "zero3";

export function trainingMemoryPerGPU(
  totalParams: number,
  numGPUs: number,
  mode: ParallelMode,
  bytesPerParam = 16,
): number {
  const total = totalParams * bytesPerParam;
  return mode === "replicated" ? total : total / Math.max(1, numGPUs);
}

// ---------------------------------------------------------------------------
// KV cache
// ---------------------------------------------------------------------------

/** Bytes = 2 (K and V) * layers * kvHeads * headDim * ctxLen * bytesPerElem * batch. */
export function kvCacheBytes(
  layers: number,
  kvHeads: number,
  headDim: number,
  ctxLen: number,
  batch: number,
  bytesPerElem = 2,
): number {
  return 2 * layers * kvHeads * headDim * ctxLen * bytesPerElem * batch;
}

// ---------------------------------------------------------------------------
// Compute and scaling laws
// ---------------------------------------------------------------------------

/** C ~= 6*N*D (Kaplan et al. 2020). */
export function computeFlops(N: number, D: number): number {
  return 6 * N * D;
}

/** Chinchilla fitted loss surface: L(N,D) = 1.69 + 406.4/N^0.34 + 410.7/D^0.28. */
export function chinchillaLoss(N: number, D: number): number {
  return 1.69 + 406.4 / Math.pow(N, 0.34) + 410.7 / Math.pow(D, 0.28);
}

export interface ChinchillaAllocation {
  N: number;
  D: number;
  loss: number;
}

/** Given a compute budget and a tokens-per-parameter ratio, solve for the compute-optimal N and D. */
export function chinchillaAllocation(
  computeBudget: number,
  tokensPerParam: number,
): ChinchillaAllocation {
  const N = Math.sqrt(computeBudget / (6 * tokensPerParam));
  const D = tokensPerParam * N;
  return { N, D, loss: chinchillaLoss(N, D) };
}

// ---------------------------------------------------------------------------
// Learning-rate schedule: linear warmup + cosine decay
// ---------------------------------------------------------------------------

export function lrSchedule(
  step: number,
  warmupSteps: number,
  maxLR: number,
  totalSteps: number,
): number {
  if (step < warmupSteps) {
    return maxLR * (step / Math.max(1, warmupSteps));
  }
  const progress = (step - warmupSteps) / Math.max(1, totalSteps - warmupSteps);
  const clamped = Math.min(1, Math.max(0, progress));
  return maxLR * 0.5 * (1 + Math.cos(Math.PI * clamped));
}

// ---------------------------------------------------------------------------
// Gradient descent on a fixed smooth double-well polynomial
// ---------------------------------------------------------------------------

export function lossSurface(x: number): number {
  return 0.05 * x ** 4 - 0.4 * x ** 2 + 0.1 * x + 5;
}

export function lossSurfaceGradient(x: number): number {
  return 0.2 * x ** 3 - 0.8 * x + 0.1;
}

export function gradientDescentStep(x: number, lr: number): number {
  return x - lr * lossSurfaceGradient(x);
}

export function runGradientDescent(x0: number, lr: number, steps: number): number[] {
  const trail = [x0];
  let x = x0;
  for (let i = 0; i < steps; i++) {
    x = gradientDescentStep(x, lr);
    trail.push(x);
    if (!Number.isFinite(x) || Math.abs(x) > 1e6) break;
  }
  return trail;
}

// ---------------------------------------------------------------------------
// Preference optimization: DPO and Bradley-Terry
// ---------------------------------------------------------------------------

/** L = -log(sigmoid(beta * margin)), margin = logratio(chosen) - logratio(rejected). */
export function dpoLoss(beta: number, margin: number): number {
  return -Math.log(Math.max(sigmoid(beta * margin), 1e-9));
}

export function bradleyTerryProb(rewardChosen: number, rewardRejected: number): number {
  return sigmoid(rewardChosen - rewardRejected);
}

// ---------------------------------------------------------------------------
// LoRA
// ---------------------------------------------------------------------------

export interface LoRAModuleDims {
  name: string;
  dIn: number;
  dOut: number;
}

/** Trainable params = sum over targeted modules of r*(d_in + d_out). */
export function loraTrainableParams(rank: number, modules: LoRAModuleDims[]): number {
  return modules.reduce((sum, m) => sum + rank * (m.dIn + m.dOut), 0);
}

// ---------------------------------------------------------------------------
// Deterministic PRNG + simulated training run (power law + noise + spikes)
// ---------------------------------------------------------------------------

export function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function powerLawLoss(t: number, lossInf: number, a: number, b: number): number {
  return lossInf + a * Math.pow(Math.max(t, 1), -b);
}

export function generateTrainingRun(
  steps: number,
  lossInf: number,
  a: number,
  b: number,
  seed: number,
  spikeSteps: number[] = [],
): number[] {
  const rand = mulberry32(seed);
  const curve: number[] = [];
  for (let t = 1; t <= steps; t++) {
    let l = powerLawLoss(t, lossInf, a, b);
    l += (rand() - 0.5) * 0.05;
    if (spikeSteps.includes(t)) l += 0.8 + rand() * 0.4;
    curve.push(Math.max(l, lossInf * 0.98));
  }
  return curve;
}

/** A benchmark accuracy curve that stays flat near chance then climbs -- a logistic in log-steps. */
export function benchmarkAccuracyCurve(steps: number, midpoint: number, steepness: number): number[] {
  const curve: number[] = [];
  for (let t = 1; t <= steps; t++) {
    const acc = 0.25 + 0.7 * sigmoid(steepness * (Math.log(t) - Math.log(midpoint)));
    curve.push(acc);
  }
  return curve;
}

// ---------------------------------------------------------------------------
// Fill-in-the-middle rearrangement
// ---------------------------------------------------------------------------

export interface FIMSequence {
  prefix: string;
  middle: string;
  suffix: string;
  rearranged: string;
}

export function fimRearrange(prefix: string, middle: string, suffix: string): FIMSequence {
  return {
    prefix,
    middle,
    suffix,
    rearranged: `<PRE> ${prefix} <SUF> ${suffix} <MID> ${middle}`,
  };
}

// ---------------------------------------------------------------------------
// Dev-time sanity checks -- run once from main.tsx
// ---------------------------------------------------------------------------

export function runMathSanityChecks(): void {
  const gpt2Small = gpt2ParamCount(768, 12, 50257, 1024);
  console.assert(
    Math.abs(gpt2Small.total - 124_439_808) < 1,
    `GPT-2 small param count mismatch: got ${gpt2Small.total}`,
  );

  const lossA = chinchillaLoss(1e9, 2e10);
  const lossB = chinchillaLoss(2e9, 2e10);
  const lossC = chinchillaLoss(1e9, 4e10);
  console.assert(lossB < lossA, "Chinchilla loss should decrease as N grows");
  console.assert(lossC < lossA, "Chinchilla loss should decrease as D grows");

  const probs = softmax([1, 2, 3, 4]);
  const probSum = probs.reduce((a, b) => a + b, 0);
  console.assert(Math.abs(probSum - 1) < 1e-9, `softmax should sum to 1, got ${probSum}`);

  const maskedProbs = softmax([1, 2, -Infinity, -Infinity]);
  console.assert(maskedProbs[2] === 0 && maskedProbs[3] === 0, "masked positions must be exactly 0");
}
