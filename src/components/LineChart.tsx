import { useId } from 'react';

type Props = { data: readonly number[]; height?: number; peak?: number; windowSize?: number; truth?: boolean; label?: string; tone?: 'mint' | 'blue'; xStart?: number; };
export default function LineChart({ data, height = 190, peak, windowSize = 24, truth = false, label = '', tone = 'mint', xStart = 0 }: Props) {
  const id = useId().replaceAll(':', '');
  const width = 760, left = 34, right = 12, top = 18, bottom = 31;
  const plotWidth = width - left - right, plotHeight = height - top - bottom;
  const min = Math.min(...data), max = Math.max(...data);
  const span = Math.max(1e-9, max - min);
  const px = (i: number) => left + i / Math.max(data.length - 1, 1) * plotWidth;
  const py = (v: number) => top + (1 - (v - min) / span) * plotHeight;
  const color = tone === 'mint' ? '#04a990' : '#6593fc';
  const d = data.map((n, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)},${py(n).toFixed(1)}`).join(' ');
  const x0 = peak === undefined ? null : px(Math.max(0, peak - Math.floor(windowSize / 2)));
  const x1 = peak === undefined ? null : px(Math.min(data.length - 1, peak + Math.ceil(windowSize / 2)));
  return <svg viewBox={`0 0 ${width} ${height}`} className="chart" role="img" aria-label={`${label}：包含 ${data.length} 个采样点的曲线图`}>
    <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".2"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {truth && <><rect x={px(75)} y={top} width={px(93)-px(75)} height={plotHeight} fill="#04a990" opacity=".1" rx="3"/><rect x={px(153)} y={top} width={px(175)-px(153)} height={plotHeight} fill="#ffb56a" opacity=".12" rx="3"/></>}
    {x0 !== null && x1 !== null && <rect x={x0} y={top} width={x1-x0} height={plotHeight} fill="#04a990" opacity=".11" rx="3"/>}
    {[0,.25,.5,.75,1].map(t => <line key={t} x1={left} x2={width-right} y1={top+plotHeight*t} y2={top+plotHeight*t} stroke="#dce5e9" strokeDasharray="4 6"/>)}
    <path d={`${d} L${px(data.length-1).toFixed(1)},${top+plotHeight} L${left},${top+plotHeight}Z`} fill={`url(#${id})`}/>
    <path d={d} fill="none" stroke={color} strokeWidth="2.4" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke"/>
    {peak !== undefined && <><line x1={px(peak)} y1={top} x2={px(peak)} y2={top+plotHeight} stroke={color} strokeDasharray="5 5" opacity=".7"/><circle cx={px(peak)} cy={py(data[peak])} r="4.5" fill={color} stroke="white" strokeWidth="2"/></>}
    {[0,.25,.5,.75,1].map(t => <text key={t} x={px(t * (data.length-1))} y={height - 7} fontSize="11" fill="#8393a3" textAnchor="middle">{Math.round(t*(data.length-1))+xStart}</text>)}
    <text x={left} y="12" fontSize="11" fill="#8291a1">{max.toFixed(2)}</text>
    <text x={left} y={height - 23} fontSize="11" fill="#8291a1">{min.toFixed(2)}</text>
  </svg>;
}
