import { useMemo, useState } from 'react';
import { ArrowRight, Info, KeyRound, Lock, Unlock } from 'lucide-react';
import { hammingWeight, hexByte, SBOX } from '../domain/aes';
import { runAttack, sortedCandidates, type AttackMode } from '../domain/attack';
import LineChart from '../components/LineChart';
import LabGuide from '../components/LabGuide';
export default function AttackPage() {
  const [n, setN] = useState(48);
  const [noise, setNoise] = useState(1.2);
  const [mode, setMode] = useState<AttackMode>('id');
  const [candidate, setCandidate] = useState('2B');
  const [reveal, setReveal] = useState(false);
  const run = useMemo(()=>runAttack(noise,mode),[noise,mode]);
  const scores = run.scoreByN[n];
  const order = useMemo(()=>sortedCandidates(scores),[scores]);
  const sample = run.samples[Math.max(0,n-1)];
  const k = /^[A-F0-9]{2}$/i.test(candidate) ? parseInt(candidate,16):null;
  const hypothesis = k === null ? null : SBOX[sample.plaintext ^ k];
  const label = hypothesis === null ? null : mode==='id' ? hypothesis : hammingWeight(hypothesis);
  const matched = label === null ? null : sample.probabilities[label];
  const currentRank = run.rankByN[n];
  const rankCurve = run.rankByN.slice(1,n+1);
  return <div className="page-content">
    <div className="page-heading"><span className="eyebrow">LAB 03 · KEY RECOVERY</span><h1>模型只预测中间值，<br/><em>怎么变成密钥？</em></h1><p>模拟器真正为 256 个候选密钥计算假设中间值、读取概率并累积 log 分数。你可以逐条加入 Trace，观察排名如何变化。</p></div>
    <LabGuide kind="attack"/>
    <div className="disclaimer"><Info size={18}/><span>这里的概率由<strong>透明的高斯似然玩具模型</strong>计算，不是已经训练完成的深度神经网络；它只用于演示后续密钥推断的数学过程。</span></div>
    <section className="panel"><div className="section-bar"><div><span className="step-tag">01 / SET THE EXPERIMENT</span><h2>改变分类标签和噪声</h2></div><span className="source-pill"><Lock size={13}/> 目标密钥对攻击器不可见</span></div>
      <div className="method-tabs"><button className={mode==='id'?'selected':''} onClick={()=>setMode('id')}>ID · 256 类</button><button className={mode==='hw'?'selected':''} onClick={()=>setMode('hw')}>HW · 9 类</button></div>
      <label className="slider-block roomy"><span><b>模拟观测噪声</b><em>σ = {noise.toFixed(2)}</em></span><input type="range" min="0.4" max="2.5" step="0.1" value={noise} onChange={e=>setNoise(Number(e.target.value))}/></label>
      <label className="slider-block roomy"><span><b>已累积攻击迹线数量</b><em>{n} / 220</em></span><input type="range" min="1" max="220" step="1" value={n} onChange={e=>setN(Number(e.target.value))}/></label>
      <div className="trace-buttons"><button onClick={()=>setN(x=>Math.max(1,x-1))} disabled={n<=1}>− 一条 Trace</button><button onClick={()=>setN(x=>Math.min(220,x+1))} disabled={n>=220}>+ 一条 Trace</button><button onClick={()=>setN(1)}>从第 1 条开始</button><button onClick={()=>setN(220)}>使用全部 220 条</button></div>
    </section>
    <section className="panel"><div className="section-bar"><div><span className="step-tag">02 / HOW ONE TRACE IS SCORED</span><h2>一条 Trace 的两条推理路径</h2></div></div>
      <div className="attack-grid"><div className="attack-route"><span className="tiny-overline">路径 A · 公开的 AES 数学关系</span><div className="route-step">明文字节 P <b>0x{hexByte(sample.plaintext)}</b></div><div className="route-step candidate-row"><label>候选密钥 k</label><input aria-label="十六进制候选密钥字节" spellCheck={false} maxLength={2} value={candidate} onChange={e=>setCandidate(e.target.value.replace(/[^A-Fa-f0-9]/g,'').toUpperCase().slice(0,2))}/></div><div className="route-step">假设中间值 SBox(P ⊕ k) <b>{hypothesis===null?'--':`0x${hexByte(hypothesis)}`}</b></div><div className="route-step">模型目标类别（{mode.toUpperCase()}） <b>{label===null?'--':label}</b></div></div><div className="attack-route blue-route"><span className="tiny-overline">路径 B · Trace → 类别概率</span><div className="route-step">模拟泄漏观测 <b>{sample.observation.toFixed(3)}</b></div><div className="route-step">模型输出向量 <b>{sample.probabilities.length} 类</b></div><div className="route-step">查找类别 {label===null?'?':label} 的概率 <b>{matched===null?'--':matched.toFixed(5)}</b></div><div className="route-step highlighted">累积 log(概率) <b>{matched===null?'--':Math.log(matched).toFixed(3)}</b></div></div></div>
      <div className="formula-note"><code>S<sub>N</sub>(k) = Σ<sub>i=1..N</sub> log p<sub>i</sub>[ label(SBox(P<sub>i</sub> ⊕ k)) ]</code><p>每个候选密钥都用同一套公式打分。真实密钥不参与评分计算，唯一被枚举的是候选 k。</p></div>
    </section>
    <section className="panel"><div className="section-bar"><div><span className="step-tag">03 / CANDIDATE RANKING</span><h2>谁排在 256 个候选的第一位？</h2></div><span className="source-pill"><KeyRound size={14}/> 第 0 个密钥字节</span></div>
      <div className="ranking-layout"><div><div className="chart-caption"><span>真实密钥的 Rank · 0 = 第一名</span><span>仅在受控实验评估时可知</span></div><LineChart data={rankCurve} xStart={1} tone="mint" label="正确密钥排名随已累积 Trace 数变化" height={190}/><div className="stats-row"><div><span>当前正确密钥 Rank</span><strong>{currentRank}</strong></div><div><span>目前得分最高的候选</span><strong>0x{hexByte(order[0].key)}</strong></div></div></div><div className="leaderboard"><div className="leaderboard-title">TOP CANDIDATES</div>{order.slice(0,6).map((item,i)=><div className="leader-row" key={item.key}><span className="leader-place">{String(i+1).padStart(2,'0')}</span><strong>0x{hexByte(item.key)}</strong><div className="mini-bar"><span style={{width:`${Math.max(5,100*Math.exp(Math.max(-8,item.score-order[0].score)/3))}%`}}/></div><small>{item.score.toFixed(1)}</small></div>)}</div></div>
      <button className="reveal-button" onClick={()=>setReveal(v=>!v)}>{reveal?<Unlock size={17}/>:<Lock size={17}/>} {reveal?'隐藏评估答案':'揭示模拟器中的真实密钥（仅用于评估）'} <ArrowRight size={15}/></button>
      {reveal&&<div className="answer-banner">本模拟器固定真实子密钥：<b>0x{hexByte(run.key)}</b>。受控实验可以用这个值计算 Rank，但攻击器不能在推断时读取它。</div>}
      <div className="teaching-note"><Info size={18}/><p><b>为什么不直接逆 SBox？</b> 因为单条迹线无法保证预测中间值正确。保留整条概率分布，为全部候选评分并跨 Trace 累积，能够避免只保留 argmax 带来的信息损失。Rank 也可能随着新迹线加入而短暂升高。</p></div>
    </section>
  </div>;
}
