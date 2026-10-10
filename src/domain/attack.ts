import { hammingWeight, SBOX } from './aes';

// Transparent toy likelihood model, NOT a trained neural network. The UI must say this explicitly.
export type AttackMode = 'id' | 'hw';
export type AttackSample = { plaintext: number; observation: number; actualValue: number; probabilities: number[] };
export type AttackRun = { samples: AttackSample[]; scoreByN: number[][]; rankByN: number[]; key: number; mode: AttackMode };
const SECRET_FOR_EVALUATION = 0x2b;
function randGen(seed: number) { let v = seed >>> 0; return () => { v = (Math.imul(v, 1664525) + 1013904223) >>> 0; return v / 0x100000000; }; }
const gaussian = (r: () => number) => Math.sqrt(-2 * Math.log(Math.max(1e-10, r()))) * Math.cos(2 * Math.PI * r());
const meanForByte = (v: number) => (hammingWeight(v) - 4) * 0.75 + ((v & 1) ? 0.33 : -0.33) + ((v & 64) ? 0.21 : -0.21);
const meanForHW = (h: number) => (h - 4) * 0.75;
const choose = [1,8,28,56,70,56,28,8,1]; // binomial C(8,h)
export function runAttack(noise = 1.2, mode: AttackMode = 'id', total = 220): AttackRun {
  const rng = randGen(0x41534341);
  const samples: AttackSample[] = [];
  const scores = Array(256).fill(0);
  const scoreByN: number[][] = [[...scores]];
  const rankByN: number[] = [255];
  for (let i = 0; i < total; i++) {
    const plaintext = Math.floor(rng() * 256);
    const actualValue = SBOX[plaintext ^ SECRET_FOR_EVALUATION];
    const observation = meanForByte(actualValue) + noise * gaussian(rng);
    const means = mode === 'id' ? SBOX.map((_, v) => meanForByte(v)) : choose.map((_, h) => meanForHW(h));
    const likelihood = means.map((mean, index) => {
      const prior = mode === 'id' ? 1 : choose[index];
      return prior * Math.exp(-0.5 * ((observation - mean) / Math.max(noise, 0.1)) ** 2);
    });
    const totalLikelihood = likelihood.reduce((a, b) => a + b, 0);
    const probabilities = likelihood.map(x => Math.max(x / Math.max(totalLikelihood, 1e-200), 1e-100));
    samples.push({ plaintext, actualValue, observation, probabilities });
    for (let k = 0; k < 256; k++) {
      const value = SBOX[plaintext ^ k];
      const label = mode === 'id' ? value : hammingWeight(value);
      scores[k] += Math.log(probabilities[label]);
    }
    scoreByN.push([...scores]);
    const trueScore = scores[SECRET_FOR_EVALUATION];
    rankByN.push(scores.reduce((n, x) => n + (x > trueScore + 1e-10 ? 1 : 0), 0));
  }
  return { samples, scoreByN, rankByN, key: SECRET_FOR_EVALUATION, mode };
}
export function sortedCandidates(scores: number[]) {
  return scores.map((score, key) => ({ key, score })).sort((a, b) => b.score - a.score || a.key - b.key);
}
