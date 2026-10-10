import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, CircleHelp, Eye, Info, LockKeyhole, TriangleAlert } from 'lucide-react';
import { journey, type JourneyStep } from '../content/journey';
import { SBOX, INV_SBOX, hexByte, hammingWeight } from '../domain/aes';
import './GuidedJourney.css';

const isHex = (s:string) => /^[0-9a-f]{2}$/i.test(s);
function StoredMastery(): string[] {
  try {const x=JSON.parse(localStorage.getItem('dlsca:guided-mastery')||'[]');return Array.isArray(x)?x.filter(y=>typeof y==='string'):[];} catch{return [];}
}
function MiniTrace({ reveal }: {reveal:boolean}) {
  const values = Array.from({length:160},(_,i)=> 45+3.4*Math.sin(i*1.71)+1.5*Math.sin(i*3.17) + (i>50&&i<76?13*Math.sin(i*1.3):0) + (i>115&&i<132?19*Math.sin(i*2.2):0));
  const points=values.map((v,i)=>`${12+i*2.05},${v.toFixed(1)}`).join(' ');
  return <div className="journey-signal">
    <svg viewBox="0 0 352 115" role="img" aria-label="演示性合成时间序列：包含目标数据相关区域与可能的无关尖峰">
      <rect x="12" y="9" width="328" height="78" rx="8" fill="currentColor" fillOpacity=".03"/>
      {reveal&&<><rect x="110" y="11" width="52" height="75" rx="4" fill="#0d9488" fillOpacity=".17"/><text x="136" y="100" fontSize="10" fill="#0d9488" textAnchor="middle">目标数据相关</text><text x="269" y="100" fontSize="10" fill="#b7791f" textAnchor="middle">无关高峰</text></>}
      <polyline points={points} fill="none" stroke="#2492cc" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M12 9 V87 H340" fill="none" stroke="currentColor" strokeWidth="1" strokeOpacity=".35"/>
      <text x="330" y="109" fontSize="9" fill="currentColor" opacity=".65">时间 →</text>
    </svg>
    <small>教学绘制的合成信号，并非真实设备测量；视觉幅度不是 PoI 的判定标准。</small>
  </div>;
}
function Activity({ step }: {step: JourneyStep}) {
  const [p,setP]=useState('2B');
  const [k,setK]=useState('2B');
  const [v,setV]=useState(0x63);
  const [known,setKnown]=useState(false);
  const [reveal,setReveal]=useState(false);
  const [guess,setGuess]=useState('2A');
  const [m,setM]=useState<'id'|'hw'>('id');
  const [sampleCount,setSampleCount]=useState(1);
  const pb=isHex(p)?parseInt(p,16):null;
  const kb=isHex(k)?parseInt(k,16):null;
  const change=(f:(s:string)=>void)=>(e:React.ChangeEvent<HTMLInputElement>)=>f(e.target.value.replace(/[^0-9a-f]/gi,'').toUpperCase().slice(0,2));
  switch(step.activity){
    case 'secret': return <div className="journey-demo"><b>钥匙与盒子</b><div className="journey-equation"><span>公开规则 AES</span><span>+</span><span className="key-tag">{known?'密钥 0x2B':'秘密密钥 ?'}</span><span>→</span><span>加密结果</span></div><button className="journey-inline" onClick={()=>setKnown(s=>!s)}><Eye size={16}/>{known?'重新隐藏密钥':'在参考设备上揭示密钥'}</button><p>注意：知道参考设备的密钥，是为了建立训练答案；不会让我们自动知道目标设备的密钥。</p></div>;
    case 'bits': return <div className="journey-demo"><b>把数字拆成 8 个 bit</b><div className="journey-equation">{Array.from({length:8},(_,i)=><span className="bitbox" key={i}>{(v>>>(7-i))&1}</span>)}</div><input type="range" min="0" max="255" value={v} onChange={e=>setV(Number(e.target.value))} aria-label="改变一个字节的十进制数值"/><p>当前数值：十进制 <b>{v}</b>，十六进制 <b>0x{hexByte(v)}</b>。观察最大取值为 255，加上 0 一共 256 种。</p></div>;
    case 'xor':case 'sbox':case 'guess': return <div className="journey-demo">
      <b>亲手改变数字，看 AES 关系怎样计算</b>
      <div className="journey-byte-inputs"><label>明文字节 P<input aria-label="演示明文字节 P" value={p} onChange={change(setP)}/></label><span>⊕</span><label>{step.activity==='guess'?'候选密钥 k':'示例密钥 K'}<input aria-label="演示密钥字节" value={step.activity==='guess'?guess:k} onChange={change(step.activity==='guess'?setGuess:setK)}/></label></div>
      {(step.activity==='guess'?isHex(guess):kb!==null)&&pb!==null?(()=>{
        const candidate=step.activity==='guess'?parseInt(guess,16):kb!;
        const xor=pb^candidate, sv=SBOX[xor];
        return <><div className="journey-equation"><span>0x{hexByte(xor)}</span><span>→ SBox →</span><strong>0x{hexByte(sv)}</strong></div><p>先 XOR，再查公开的 SBox。{step.activity==='guess'?'这个结果只是“假设 k 正确”时的中间值，不能因此确定真实目标密钥。':`逆查 SBox 得 0x${hexByte(INV_SBOX[sv])}，再与明文 XOR 即可回到示例密钥。`}</p></>;
      })():<p>请输入两个完整的十六进制字节（00–FF）。</p>}
      {step.activity==='guess'&&<button className="journey-inline" onClick={()=>setGuess(guess==='2A'?'2B':'2A')}>切换候选 0x2A / 0x2B</button>}
    </div>;
    case 'hamming': return <div className="journey-demo"><b>两个标签看的是同一个 V</b><div className="journey-equation">{Array.from({length:8},(_,i)=><button key={i} className="bitbox togglable" aria-label={`翻转第${7-i}位`} onClick={()=>setV(prev=>prev^(1<<(7-i)))}>{(v>>>(7-i))&1}</button>)}</div><div className="journey-equation"><button className={m==='id'?'journey-tab active':'journey-tab'} onClick={()=>setM('id')}>ID</button><button className={m==='hw'?'journey-tab active':'journey-tab'} onClick={()=>setM('hw')}>HW</button><strong>{m==='id'?v:hammingWeight(v)}</strong></div><p>点击任何一位翻转。ID 直接表示整个数；HW 只数 1。试着找到两个不同的 V，拥有相同 HW。</p></div>;
    case 'trace':case 'poi': return <div className="journey-demo"><b>观察波形，再揭示哪些位置被人为设置为“数据相关”</b><MiniTrace reveal={reveal}/><button className="journey-inline" onClick={()=>setReveal(s=>!s)}><Eye size={16}/>{reveal?'先隐藏答案':'揭示信号生成机制'}</button><p>注意：这只能用来建立直觉。真实研究需要依据实现时序、标签统计与独立验证集，而不是知道模拟器预设答案。</p></div>;
    case 'rank': return <div className="journey-demo"><b>用最小例子理解“两条证据胜过一条”</b><div className="journey-equation"><span>候选 A</span><strong>{(sampleCount===1?.6:.42).toFixed(2)}</strong><span>候选 B</span><strong>{(sampleCount===1?.3:.03).toFixed(2)}</strong></div><button className="journey-inline" onClick={()=>setSampleCount(sampleCount===1?2:1)}>{sampleCount===1?'加入第二条 Trace（A×0.7，B×0.1）':'返回只有一条 Trace'}</button><p>候选 A 与 B 的分数来自各自假设类别的模型概率。多条迹线时，将匹配概率相乘（或 log 相加）。</p></div>;
    case 'workflow': return <div className="journey-demo"><b>完整推断链：从已知到未知</b><div className="journey-chain">{['已知参考 K','计算训练标签','学习 Trace → 概率','目标 K 未知','遍历全部 k','多迹线累计','子密钥排序'].map((s,i)=><div key={s}><span>{i+1}</span>{s}</div>)}</div><p>请指出：哪一步使用参考真实密钥？哪一步只能使用候选？哪一步可以知道实际答案但只用它计算 Rank？</p></div>;
    default:return null;
  }
}
function countPassed(ids:string[]) {return new Set(ids).size;}
export default function GuidedJourney({ onExplore, onBack }:{onExplore:(page:'aes'|'poi'|'attack')=>void;onBack:()=>void}) {
  const [index,setIndex]=useState(0);
  const [unfold,setUnfold]=useState(0);
  const [showWhy,setShowWhy]=useState(false);
  const [selected,setSelected]=useState<number|null>(null);
  const [mastery,setMastery]=useState<string[]>(StoredMastery);
  const [teachBack,setTeachBack]=useState('');
  const [reviewed,setReviewed]=useState(false);
  const stage=journey[index];
  const passed=mastery.includes(stage.id);
  const allDone=mastery.length===journey.length;
  useEffect(()=>{try{localStorage.setItem('dlsca:guided-mastery',JSON.stringify(mastery));}catch{}},[mastery]);
  const selectStage=(next:number)=>{setIndex(Math.max(0,Math.min(journey.length-1,next)));setUnfold(0);setSelected(null);setShowWhy(false);window.scrollTo({top:0,behavior:'smooth'});};
  const feedback=selected===null?null:stage.checkpoint.why[selected];
  const next=()=>selectStage(index+1);
  return <div className="page-content guided-journey">
    <button className="back-link" onClick={onBack}><ArrowLeft size={17}/> 返回学习首页</button>
    <header className="journey-header"><div><span className="eyebrow">GUIDED MODE · 真正从零开始</span><h1>先理解为什么，<br/><em>再学习叫什么。</em></h1><p>一共 {journey.length} 个学习站点。每次只解决一个问题：看场景 → 自己试 → 逐层揭示原因 → 判断是否理解。</p></div><div className="journey-progress"><strong>{countPassed(mastery)} / {journey.length}</strong><span>站点通过理解检查</span><div className="journey-meter"><span style={{width:`${100*countPassed(mastery)/journey.length}%`}}/></div></div></header>
    <div className="journey-progress-track" aria-label="站点导航">{journey.map((s,i)=><button key={s.id} title={`${i+1}. ${s.title}`} aria-label={`前往第${i+1}站：${s.title}`} className={i===index?'current':mastery.includes(s.id)?'mastered':''} onClick={()=>selectStage(i)}>{mastery.includes(s.id)?'✓':String(i+1)}</button>)}</div>
    <section className="journey-scenario panel">
      <div className="journey-topline"><span>站点 {String(index+1).padStart(2,'0')} / {journey.length} · {stage.chapter}</span>{passed&&<span className="journey-passed"><CheckCircle2 size={14}/> 已通过本站测验</span>}</div>
      <h2>{stage.title}</h2><h3>{stage.question}</h3>
      <div className="journey-known"><div><strong><Eye size={16}/> 此刻已知</strong>{stage.known.map(x=><span key={x}>✓ {x}</span>)}</div><div><strong><LockKeyhole size={16}/> 此刻未知</strong>{stage.unknown.map(x=><span key={x}>? {x}</span>)}</div></div>
      <div className="journey-story">
        <span className="tiny-overline">01 · 从一个场景开始</span>
        {stage.situation.slice(0,unfold+1).map((text,i)=><p key={i}><span className="story-num">{i+1}</span>{text}</p>)}
        {unfold<stage.situation.length-1&&<button className="journey-inline" onClick={()=>setUnfold(u=>u+1)}>明白，接着发生了什么？ <ArrowRight size={16}/></button>}
      </div>
      {unfold===stage.situation.length-1&&<>
        {stage.activity&&<div className="journey-activity"><span className="tiny-overline">02 · 自己试试 · 所有数字都在实时计算</span><Activity key={stage.id} step={stage}/></div>}
        <div className="journey-reason"><div className="journey-reason-intro"><span className="tiny-overline">03 · 为什么？不是只记结论</span><button className="journey-inline" onClick={()=>setShowWhy(v=>!v)}><CircleHelp size={17}/>{showWhy?'暂时收起推导':'逐层展开完整原因'} <ChevronDown size={15}/></button></div>
          {showWhy&&<div className="journey-why-chain">{stage.why.map((why,i)=><div className="journey-cause" key={i}><span>{i+1}</span><p>{why}</p></div>)}<div className="journey-worked"><b>用具体例子再算一次</b><p>{stage.example}</p></div><div className="journey-error"><TriangleAlert size={17}/><p><b>如果有人这样理解呢？</b> {stage.counterexample}</p></div><p className="journey-recap"><b>所以本节最重要的是：</b>{stage.recap}</p></div>}
        </div>
        <details className="journey-terms"><summary>本节刚出现的术语（{stage.terms.length} 个）</summary>{stage.terms.map(t=><p key={t.name}><b>{t.name}</b> — {t.meaning}</p>)}</details>
        {showWhy&&<div className="journey-check"><span className="tiny-overline">04 · 不是选择正确答案，而是说清“为什么”</span><h3>{stage.checkpoint.prompt}</h3><div className="journey-options">{stage.checkpoint.options.map((option,i)=><button key={i} className={selected===i?(i===stage.checkpoint.answer?'correct':'wrong'):''} onClick={()=>{setSelected(i);if(i===stage.checkpoint.answer)setMastery(a=>a.includes(stage.id)?a:[...a,stage.id]);}}><span>{String.fromCharCode(65+i)}</span>{option}</button>)}</div>{feedback&&<div className={selected===stage.checkpoint.answer?'journey-feedback good':'journey-feedback'}><b>{selected===stage.checkpoint.answer?'✓ 这一步理解正确':'这个推理哪里出了问题？'}</b><p>{feedback}</p>{selected!==stage.checkpoint.answer&&<small>请根据解释重新选择，直到能说明原因。</small>}</div>}</div>}
      </>}
    </section>
    <div className="journey-controls"><button className="outlined-button" disabled={index===0} onClick={()=>selectStage(index-1)}><ArrowLeft size={17}/> 上一站</button><span>允许自由查看，但仅答对理解检查才计入掌握进度。</span><button className="primary-button" disabled={index===journey.length-1} onClick={next}>{passed?'进入下一站':'先查看下一站'} <ArrowRight size={17}/></button></div>
    {index===journey.length-1&&<section className="panel journey-graduation"><span className="eyebrow">TEACH-BACK · 用你的话证明你理解</span><h2>现在请独立讲解一次 DLSCA</h2><p>不看答案，假设你要向另一位完全不会 AES 的同学解释：从明文、AES 中间值到 Trace、建模、PoI、预测概率、候选密钥和 Rank，每一步是什么、为什么需要。至少写 80 个字。</p><textarea value={teachBack} onChange={e=>{setTeachBack(e.target.value);setReviewed(false)}} rows={7} placeholder="例如：我们首先知道公开的AES算法，但不知道目标设备的密钥……" aria-label="独立讲解完整DLSCA流程"/><div className="journey-controls"><span>{teachBack.trim().length} 字 · {allDone?'全部理解检查已完成':'还有站点测验未通过'}</span><button className="primary-button" disabled={teachBack.trim().length<80} onClick={()=>setReviewed(true)}>查看自查清单</button></div>{reviewed&&<div className="journey-worked"><b>请对照你的讲解逐项自查（不会自动判定回答质量）</b>{['解释 AES 算法公开但目标 K 未知','解释为何选 V=SBox(P⊕K) 以及为何需要物理 Trace','区分建模设备的已知 K 与攻击设备的未知 K','解释 ID/HW、PoI 与概率模型各起什么作用','解释逐候选 V(k) 的计算与 log 评分累积','说明 Rank 0 只代表当前子密钥排名第一'].map(x=><label className="journey-rubric" key={x}><input type="checkbox"/> {x}</label>)}<p>这只是自主对照，不是正式通过认证。下一步请在实验室实际完成计算。</p></div>}<div className="journey-lab-buttons"><button onClick={()=>onExplore('aes')}>进入 AES 实验 <ArrowRight size={16}/></button><button onClick={()=>onExplore('poi')}>进入 PoI 实验 <ArrowRight size={16}/></button><button onClick={()=>onExplore('attack')}>进入密钥恢复实验 <ArrowRight size={16}/></button></div></section>}
    <div className="journey-disclaimer"><Info size={16}/><span>这条主线使用受控的 AES 数字例子与合成信号建立直觉。网页不会声称它们就是现实设备的泄漏，也不会把玩具概率模型当成已经训练的 CNN。</span></div>
  </div>;
}
