import { hammingWeight, SBOX } from './aes';

/** All samples here are synthetic, not extracted from a physical target or a measured dataset. */
export const TRACE_LENGTH = 256;
export type SyntheticTrace = { samples: number[]; plaintext: number; value: number; hw: number; group: 'fixed' | 'random' };
export type PoiMethod = 'snr' | 'nicv' | 'tvla' | 'correlation';
export type LabSettings = { noise: number; jitter: number; count: number };
const FIXED_KEY = 0x2b;
function seeded(seed: number) {
  let state = seed >>> 0;
  return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 0x100000000; };
}
function gaussian(rand: () => number): number {
  return Math.sqrt(-2 * Math.log(Math.max(rand(), 1e-12))) * Math.cos(2 * Math.PI * rand());
}
const pulse = (sample: number, center: number, spread: number) => Math.exp(-0.5 * ((sample - center) / spread) ** 2);
export function generateTraces(settings: LabSettings): SyntheticTrace[] {
  const rng = seeded(20261010);
  const rows: SyntheticTrace[] = [];
  const total = settings.count * 2;
  for (let i = 0; i < total; i++) {
    const group: SyntheticTrace['group'] = i < settings.count ? 'random' : 'fixed';
    const plaintext = group === 'fixed' ? 0x11 : Math.floor(rng() * 256);
    const value = SBOX[plaintext ^ FIXED_KEY];
    const hw = hammingWeight(value);
    const shift = Math.floor((rng() * 2 - 1) * settings.jitter);
    const offset = (hw - 4) / 4;
    // Physical inspiration: an HW-correlated data term at sample 83 and bit-specific term at 164.
    // Additional activity at 224 is independent of the sensitive intermediate value.
    const bitEffect = (value & 1 ? 1 : -1) * 0.28;
    const unrelated = gaussian(rng) * 0.55;
    const samples = Array.from({ length: TRACE_LENGTH }, (_, x) =>
      0.14 * Math.sin(x / 7.2) +
      2.15 * offset * pulse(x, 83 + shift, 6) +
      2.6 * bitEffect * pulse(x, 164 + shift, 8) +
      unrelated * pulse(x, 224, 4) +
      gaussian(rng) * settings.noise
    );
    rows.push({ samples, plaintext, value, hw, group });
  }
  return rows;
}
export function calculatePoiMetrics(traces: SyntheticTrace[]) {
  const random = traces.filter(t => t.group === 'random');
  const fixed = traces.filter(t => t.group === 'fixed');
  const n = random.length;
  const snr: number[] = [], nicv: number[] = [], tvla: number[] = [], correlation: number[] = [];
  const meanHW = random.reduce((s, t) => s + t.hw, 0) / n;
  const varHW = random.reduce((s, t) => s + (t.hw - meanHW) ** 2, 0) / n;
  for (let x = 0; x < TRACE_LENGTH; x++) {
    const globalMean = random.reduce((s, t) => s + t.samples[x], 0) / n;
    const varTotal = random.reduce((s, t) => s + (t.samples[x] - globalMean) ** 2, 0) / n;
    const grouped = Array.from({ length: 9 }, (_, h) => random.filter(t => t.hw === h));
    let explained = 0, within = 0;
    for (const group of grouped) {
      if (!group.length) continue;
      const avg = group.reduce((s, t) => s + t.samples[x], 0) / group.length;
      explained += group.length * (avg - globalMean) ** 2;
      within += group.reduce((s, t) => s + (t.samples[x] - avg) ** 2, 0);
    }
    explained /= n;
    within /= n;
    snr.push(explained / Math.max(within, 1e-12));
    nicv.push(explained / Math.max(varTotal, 1e-12));
    const cov = random.reduce((s, t) => s + (t.samples[x] - globalMean) * (t.hw - meanHW), 0) / n;
    correlation.push(Math.abs(cov / Math.sqrt(Math.max(varTotal * varHW, 1e-12))));
    const avgFixed = fixed.reduce((s, t) => s + t.samples[x], 0) / fixed.length;
    const varFixed = fixed.reduce((s, t) => s + (t.samples[x] - avgFixed) ** 2, 0) / (fixed.length - 1);
    const varRandom = random.reduce((s, t) => s + (t.samples[x] - globalMean) ** 2, 0) / (n - 1);
    // Absolute Welch t-statistic: detects fixed/random differences, not a specific AES operation.
    tvla.push(Math.abs((avgFixed - globalMean) / Math.sqrt(Math.max(varFixed / fixed.length + varRandom / n, 1e-12))));
  }
  return { snr, nicv, tvla, correlation };
}
export function topPoi(metric: number[]): { point: number; value: number } {
  let point = 0;
  for (let i = 1; i < metric.length; i++) if (metric[i] > metric[point]) point = i;
  return { point, value: metric[point] };
}
export const POI_GUIDE: Record<PoiMethod, { name: string; subtitle: string; equation: string; caveat: string; supervised: string }> = {
  snr: {
    name: 'SNR · 信噪比', subtitle: '测量不同 HW 类别的均值差异，相对于类别内噪声有多大。',
    equation: 'Var(E[T | Y]) / E[Var(T | Y)]', caveat: '需要标签；较少样本的类别会使估计不稳定。峰值并不自动等于最优攻击窗口。', supervised: '需要目标标签',
  },
  nicv: {
    name: 'NICV · 类间变化占比', subtitle: '衡量选定标签 Y 能解释迹线该采样点总方差的多少。',
    equation: 'Var(E[T | Y]) / Var(T)', caveat: '需要标签。高 NICV 表示关联强，不代表定位到了某条精确机器指令。', supervised: '需要目标标签',
  },
  tvla: {
    name: 'TVLA · 固定/随机检验', subtitle: '使用 Welch t 检验比较固定输入与随机输入两组迹线。',
    equation: '|(μfixed − μrandom) / √(s²fixed/nfixed + s²random/nrandom)|', caveat: '本实验绘制 |t|。它检测输入分组的统计差异，不保证差异来自目标 SBox。也不是直接的 PoI 最优性标准。', supervised: '需要固定/随机分组',
  },
  correlation: {
    name: '相关性 · Pearson |r|', subtitle: '使用建模设备已知标签计算 HW 与采样值的线性相关程度。',
    equation: '|Cov(T, HW(V)) / (σT · σHW)|', caveat: '这里使用已知建模密钥的真实 HW 标签；不能假装未知目标密钥的标签已知。', supervised: '需要目标标签',
  },
};
