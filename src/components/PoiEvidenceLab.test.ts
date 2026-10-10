import { describe, expect, it } from 'vitest';
import { toyMetrics } from './PoiEvidenceLab';

describe('small group-based PoI reasoning demonstration',()=>{
 it('assigns high SNR to separated groups and low SNR to overlapping groups',()=>{
  const useful=toyMetrics({a:[0.1,0.2,0.0,0.1],b:[1.8,1.9,1.7,1.8]});
  const useless=toyMetrics({a:[0.1,0.8,0.5,0.3],b:[0.2,0.7,0.6,0.2]});
  expect(useful.snr).toBeGreaterThan(useless.snr);
  expect(useful.nicv).toBeGreaterThan(useless.nicv);
  expect(useful.nicv).toBeLessThanOrEqual(1);
 });
 it('decreases SNR as within-class spread increases at fixed class separation',()=>{
  const low=toyMetrics({a:[0,.1],b:[1,1.1]});
  const high=toyMetrics({a:[-.5,.6],b:[.5,1.6]});
  expect(low.snr).toBeGreaterThan(high.snr);
 });
});
