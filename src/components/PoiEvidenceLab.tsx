import { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Eye, Info, TriangleAlert } from 'lucide-react';
import './PoiEvidenceLab.css';

const base = {
  target: {a:[0.06,-0.12,0.14,-0.05,0.12],b:[1.51,1.69,1.41,1.56,1.63]},
  unrelated:{a:[0.63,1.27,0.80,1.11,0.72],b:[0.89,1.04,0.78,1.24,0.60]},
};
function mean(x:number[]){return x.reduce((s,v)=>s+v,0)/x.length;}
function variance(x:number[]){const m=mean(x);return x.reduce((s,v)=>s+(v-m)**2,0)/x.length;}
export function toyMetrics(group:{a:number[],b:number[]}) {
  const a=group.a,b=group.b,m0=mean(a),m1=mean(b),m=(m0+m1)/2;
  const between=((m0-m)**2+(m1-m)**2)/2;
  const within=(variance(a)+variance(b))/2;
  return {m0,m1,between,within,snr:between/Math.max(1e-12,within),nicv:between/Math.max(1e-12,between+within)};
}
export default function PoiEvidenceLab(){
  const [point,setPoint]=useState<'target'|'unrelated'>('target');
  const [predict,setPredict]=useState<'target'|'unrelated'|null>(null);
  const [reveal,setReveal]=useState(false);
  const [noise,setNoise]=useState(1);
  const groups=useMemo(()=>({
    target:{a:base.target.a.map(v=>(v-.02)*noise+.02),b:base.target.b.map(v=>1.54+(v-1.54)*noise)},
    unrelated:{a:base.unrelated.a.map(v=>.94+(v-.94)*noise),b:base.unrelated.b.map(v=>.94+(v-.94)*noise)}
  }),[noise]);
  const stats=toyMetrics(groups[point]);
  const ys = [...groups[point].a.map((n,i)=>({x:n,y:27+i*15,label:'A'})), ...groups[point].b.map((n,i)=>({x:n,y:113+i*15,label:'B'}))];
  return <section className="panel poi-evidence">
    <span className="step-tag">WHY LAB · 先理解数据再理解公式</span>
    <h2>为什么最大波形不等于最佳 PoI？</h2>
    <p>下面假设采集了两组<strong>已知 HW 标签</strong>的参考迹线：A 类的中间值 HW 较低，B 类较高。我们在两个候选时间点读取每条迹线的电磁采样值，并比较不同类是否可以区分。</p>
    <div className="poi-choose">
      <button className={point==='target'?'selected':''} onClick={()=>{setPoint('target');setReveal(false)}}>时间点 #83 · 候选 A</button>
      <button className={point==='unrelated'?'selected':''} onClick={()=>{setPoint('unrelated');setReveal(false)}}>时间点 #224 · 候选 B</button>
    </div>
    <div className="poi-sample-plot">
      <svg viewBox="0 0 500 202" role="img" aria-label="两组标签对应的采样值分布。横轴为信号数值，纵向分为类别 A 与 B。">
        {Array.from({length:6},(_,i)=><g key={i}><line x1={75+i*70} x2={75+i*70} y1="8" y2="177" stroke="currentColor" strokeOpacity=".10"/><text x={75+i*70} y="194" textAnchor="middle" fontSize="11" fill="currentColor">{(i*.5).toFixed(1)}</text></g>)}
        <text x="18" y="64" fontSize="12" fill="#3394c0">HW 类 A</text><text x="18" y="145" fontSize="12" fill="#0d9488">HW 类 B</text>
        {ys.map((p,i)=><circle key={i} cx={75+p.x*140} cy={p.y} r="6" fill={p.label==='A'?'#3394c0':'#0d9488'} opacity=".87"/>)}
        <path d="M75 178 H470" stroke="currentColor" strokeOpacity=".40"/>
        <text x="275" y="200" fill="currentColor" fontSize="10" textAnchor="middle">测量幅值（教学数值，不是伏特） →</text>
      </svg>
    </div>
    <label className="poi-noise"><span>把组内噪声放大</span><input type="range" min="0.3" max="2.5" step="0.1" value={noise} onChange={e=>setNoise(Number(e.target.value))}/><b>{noise.toFixed(1)}×</b></label>
    <p><b>先预测：</b>这两个时间点中，哪一个更可能帮助区分 HW 类别？</p>
    <div className="poi-choose">
      <button className={predict==='target'?'selected':''} onClick={()=>setPredict('target')}>#83 的类间差异</button>
      <button className={predict==='unrelated'?'selected':''} onClick={()=>setPredict('unrelated')}>#224 的无关活动</button>
    </div>
    {predict&&<div className="poi-prediction">{predict==='target'?<CheckCircle2 size={18}/>:<TriangleAlert size={18}/>}<p>{predict==='target'?'方向正确！比较的是标签组是否表现出可区分的统计特征，不是“波峰最大”。':'这里容易被单次幅度误导。仔细比较 A、B 两组点的重叠程度，而不是只看整体信号有多高。'}</p></div>}
    <button className="poi-reveal" onClick={()=>setReveal(v=>!v)}><Eye size={16}/>{reveal?'收起计算过程':'展开 SNR 与 NICV 的每一步计算'} <ArrowRight size={16}/></button>
    {reveal&&<div className="poi-derivation">
      <p><b>① 按标签分组，分别求均值：</b>μA={stats.m0.toFixed(3)}，μB={stats.m1.toFixed(3)}。</p>
      <p><b>② 计算组间变化：</b>两组均值相隔得越明显，通常越有利于分辨标签。当前 Var(E[T|Y])≈{stats.between.toFixed(4)}。</p>
      <p><b>③ 计算组内噪声：</b>同组重复采样也会变化。当前 E[Var(T|Y)]≈{stats.within.toFixed(4)}。</p>
      <p><b>④ 形成指标：</b>SNR=组间/组内≈<strong>{stats.snr.toFixed(3)}</strong>；NICV=组间/总变化≈<strong>{stats.nicv.toFixed(3)}</strong>。</p>
      <p><b>⑤ 为什么还要验证？</b>这些指标使用参考标签，只是筛选候选点；最优攻击窗口必须在独立验证上对比模型与密钥排名，不能只看分数最大值。</p>
    </div>}
    <div className="poi-caveat"><Info size={17}/><span>这里为了看清原理，人工构造了两组简单数值，不是现实 HW 类的全部分布。普通 Fixed/Random TVLA 比较的是另一种分组问题：即使某位置与公开明文加载有关，也可能产生明显 TVLA 峰而不帮助恢复所选 SBox 子密钥。</span></div>
  </section>;
}
