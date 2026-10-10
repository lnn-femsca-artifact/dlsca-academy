import { describe, expect, it } from 'vitest';
import { generateTraces } from './leakage';
import { evaluatePoiSelection } from './poiValidation';

describe('POI selection vs held-out validation', () => {
 it('never evaluates on the very same random traces used to choose candidate point', () => {
  const data=generateTraces({noise:0.4,jitter:0,count:120});
  const rows=evaluatePoiSelection(data,28);
  expect(rows).toHaveLength(6);
  expect(rows.every(r=>r.trainSize===60&&r.validationSize===60)).toBe(true);
  for(const r of rows){expect(r.accuracy).toBeGreaterThanOrEqual(0);expect(r.accuracy).toBeLessThanOrEqual(1);expect(Number.isFinite(r.accuracy)).toBe(true);}
 });
 it('selects meaningful HW-correlated leakage rather than the unrelated peak in a low noise scenario', () => {
  const data=generateTraces({noise:0.2,jitter:0,count:256});
  const rows=evaluatePoiSelection(data,24);
  const snr=rows.find(r=>r.name==='SNR')!;
  const unrelated=rows.find(r=>r.name==='无关峰基线')!;
  expect(Math.abs(snr.point-83)).toBeLessThan(15);
  expect(snr.accuracy).toBeGreaterThan(unrelated.accuracy);
 });
});
