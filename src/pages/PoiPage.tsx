import { useMemo, useState } from 'react';
import { Activity, Eye, Info, SlidersHorizontal } from 'lucide-react';
import { calculatePoiMetrics, generateTraces, POI_GUIDE, topPoi, type PoiMethod } from '../domain/leakage';
import LineChart from '../components/LineChart';
import LabGuide from '../components/LabGuide';
import PoiEvidenceLab from '../components/PoiEvidenceLab';
import PoiValidationPanel from '../components/PoiValidationPanel';

export default function PoiPage() {
  const [method, setMethod] = useState<PoiMethod>('snr');
  const [noise, setNoise] = useState(0.6);
  const [jitter, setJitter] = useState(0);
  const [windowSize, setWindowSize] = useState(28);
  const [truth, setTruth] = useState(false);
  const traces = useMemo(()=>generateTraces({ noise, jitter, count: 384 }),[noise,jitter]);
  const metrics = useMemo(()=>calculatePoiMetrics(traces),[traces]);
  const peak = topPoi(metrics[method]);
  const info = POI_GUIDE[method];
  return <div className="page-content">
    <div className="page-heading"><span className="eyebrow">LAB 02 · SIGNAL ANALYSIS</span><h1>Trace 里那么多采样点，<br/><em>到底该看哪里？</em></h1><p>在一个明确可重复的合成侧信道实验里，亲自观察噪声、错位和 PoI 统计方法怎样影响泄漏定位。</p></div>
    <LabGuide kind="poi"/>
    <div className="disclaimer"><Info size={18}/><span>以下波形由公开的数学规则<strong>实时合成</strong>，不是示波器的真实测量结果；本实验使用已知建模密钥生成标签。</span></div>
    <PoiEvidenceLab/>
    <section className="panel">
      <div className="section-bar"><div><span className="step-tag">01 / CONTROL THE CHANNEL</span><h2>先改变泄漏环境</h2></div><SlidersHorizontal size={19} color="#7a899b"/></div>
      <div className="slider-grid"><label className="slider-block"><span><b>高斯噪声强度</b><em>σ = {noise.toFixed(2)}</em></span><input type="range" min="0.2" max="1.8" step="0.1" value={noise} onChange={e=>setNoise(Number(e.target.value))}/><small>越大，单条迹线越难辨认类别。</small></label><label className="slider-block"><span><b>随机时间错位</b><em>±{jitter} 样本</em></span><input type="range" min="0" max="14" step="1" value={jitter} onChange={e=>setJitter(Number(e.target.value))}/><small>错位通常会让固定时间位置的泄漏峰变宽、变弱。</small></label></div>
      <div className="chart-caption"><span><Activity size={16}/> 示例 Trace · 256 采样点</span><span>建模设备 · 合成 EM</span></div>
      <LineChart data={traces[0].samples} tone="blue" truth={truth} label="合成迹线" height={175}/>
      <div className="chart-foot">该条 Trace 公开输入 P = 0x{traces[0].plaintext.toString(16).toUpperCase().padStart(2,'0')}，用于分组的真实 HW 标签 = {traces[0].hw}（仅建模阶段可见）。</div>
    </section>
    <section className="panel">
      <div className="section-bar"><div><span className="step-tag">02 / POINTS OF INTEREST</span><h2>比较 4 种 PoI 统计视角</h2></div><span className="source-pill">固定随机组各 384 条</span></div>
      <div className="method-tabs" role="group" aria-label="选择PoI分析方法">{(['snr','nicv','tvla','correlation'] as PoiMethod[]).map(m=><button key={m} className={method===m?'selected':''} onClick={()=>setMethod(m)}>{m==='correlation'?'|r|':m.toUpperCase()}</button>)}</div>
      <div className="method-explainer"><div><span className="tiny-overline">当前方法</span><h3>{info.name}</h3><p>{info.subtitle}</p><code>{info.equation}</code></div><span className="status-tag">{info.supervised}</span></div>
      <div className="chart-caption"><span>所有采样点的 {method.toUpperCase()} 指标</span><button className="quiet-button" onClick={()=>setTruth(t=>!t)}><Eye size={16}/>{truth?'隐藏合成数据生成位置':'揭示合成数据生成位置'}</button></div>
      <LineChart data={metrics[method]} peak={peak.point} windowSize={windowSize} truth={truth} label={`${info.name} 曲线`}/>
      <div className="stats-row"><div><span>当前最大值所在点</span><strong>#{peak.point}</strong></div><div><span>指标数值</span><strong>{peak.value.toFixed(3)}</strong></div><div><span>候选截取窗口</span><strong>{Math.max(0,peak.point-Math.floor(windowSize/2))}–{Math.min(255,peak.point+Math.ceil(windowSize/2))}</strong></div></div>
      <label className="slider-block roomy"><span><b>候选窗口宽度</b><em>{windowSize} 点</em></span><input type="range" min="8" max="80" step="2" value={windowSize} onChange={e=>setWindowSize(Number(e.target.value))}/></label>
      <div className="teaching-note"><Info size={18}/><p><b>正确解读：</b>{info.caveat} 需要在独立验证数据上比较候选窗口的实际分类和密钥恢复表现，不能只看当前指标最大值。</p></div>
    </section>
    <PoiValidationPanel noise={noise} jitter={jitter} windowSize={windowSize}/>
    <section className="micro-lesson"><div className="micro-icon"><Info size={20}/></div><div><b>为什么同一条 Trace 能攻击不同 AES 轮次？</b><p>如果完整采集窗口覆盖了多个轮次，可在不同运算附近提取不同时间段。PoI 统计峰值表示信号与指定数据标签的关联，并不能独立证明硬件“此刻执行了哪条 SBox 指令”。</p></div></section>
  </div>;
}
