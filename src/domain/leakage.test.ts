import { describe, expect, it } from 'vitest';
import { calculatePoiMetrics, generateTraces, topPoi, TRACE_LENGTH } from './leakage';
import { runAttack, sortedCandidates } from './attack';
describe('transparent synthetic laboratory calculations', () => {
  it('generates deterministic synthetic traces and metric arrays', () => {
    const options = { noise: 0.4, jitter: 0, count: 256 };
    const a = generateTraces(options);
    const b = generateTraces(options);
    expect(a).toEqual(b);
    expect(a).toHaveLength(512);
    expect(a[0].samples).toHaveLength(TRACE_LENGTH);
    const metrics = calculatePoiMetrics(a);
    for (const metric of Object.values(metrics)) {
      expect(metric).toHaveLength(TRACE_LENGTH);
      expect(metric.every(x => Number.isFinite(x))).toBe(true);
    }
    expect(Math.abs(topPoi(metrics.correlation).point - 83)).toBeLessThan(8);
  });
  it('accumulates 256 actual candidate scores from model likelihoods', () => {
    const run = runAttack(0.5, 'id', 220);
    expect(run.samples[0].probabilities).toHaveLength(256);
    expect(run.samples[0].probabilities.reduce((s, p) => s + p, 0)).toBeCloseTo(1, 9);
    expect(run.scoreByN[30]).toHaveLength(256);
    expect(sortedCandidates(run.scoreByN[220])[0].key).toBe(run.key);
  });
  it('supports nine-class HW scoring without reading the real target label', () => {
    const run = runAttack(0.7, 'hw', 220);
    expect(run.samples[0].probabilities).toHaveLength(9);
    expect(sortedCandidates(run.scoreByN[220])[0].key).toBe(run.key);
  });
});
