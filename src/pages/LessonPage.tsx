import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, FlaskConical, Info, Lightbulb, PencilLine } from 'lucide-react';
import { chapters } from '../content/chapters';
import { lessonDetails, type LessonSection } from '../content/lessonDetails';
import { deepProbes, type DeepProbe } from '../content/deepProbes';
import './LessonPage.deep.css';

function ReasonedSection({ section, probe, index, onReflected }: {section:LessonSection;probe:DeepProbe;index:number;onReflected:()=>void}) {
  const [unfold,setUnfold]=useState(0);
  const [response,setResponse]=useState('');
  const [showAnswer,setShowAnswer]=useState(false);
  return <section className="panel lesson-section deep-section">
    <span className="step-tag">SECTION {String(index+1).padStart(2,'0')}</span>
    <h2>{section.title}</h2>
    <div className="why-box"><CircleHelp size={18}/><span><b>我们为什么必须学这一点？</b> {section.why}</span></div>
    <div className="deep-story">
      {section.body.slice(0,unfold+1).map((p,i)=><p className="lesson-paragraph deep-paragraph" key={i}><span>{String(i+1).padStart(2,'0')}</span>{p}</p>)}
      {unfold<section.body.length-1&&<button className="deep-continue" onClick={()=>setUnfold(v=>v+1)}>这一段明白了，继续看原因 <ArrowRight size={15}/></button>}
    </div>
    {unfold===section.body.length-1&&<>
      {section.formula&&<div className="lesson-formula"><small>现在才引出公式 · 观察每个变量来自哪里</small><code>{section.formula}</code></div>}
      {section.example&&<div className="lesson-example"><b>把抽象概念放进实际数字</b><p>{section.example}</p></div>}
      {section.warning&&<div className="lesson-warning"><Info size={17}/><span>{section.warning}</span></div>}
      <div className="deep-investigation">
        <div className="deep-probe-heading"><Lightbulb size={19}/><div><small>理解检查 · 不是背定义</small><h3>{probe.question}</h3></div></div>
        <p className="deep-try"><strong>先自己动手：</strong>{probe.try}</p>
        <label htmlFor={`reason-${index}`}>不看参考解释，先用自己的话写出原因（至少 20 个字）：</label>
        <textarea id={`reason-${index}`} value={response} onChange={e=>setResponse(e.target.value)} rows={3} placeholder="先说发生了什么，再解释为什么，还可以举一个反例……"/>
        <button className="deep-continue" disabled={response.trim().length<20} onClick={()=>{setShowAnswer(true);onReflected();}}><PencilLine size={16}/> 我已独立思考 · 对照完整推导</button>
        {showAnswer&&<div className="deep-answer">
          <b>参考推导：因果关系要完整</b>
          <ol>{probe.steps.map(x=><li key={x}>{x}</li>)}</ol>
          <p><strong>特别要防止：</strong>{probe.wrong}</p>
          <p className="deep-caution">提示：这里仅记录已提交独立解释，不会自动给自由文本打分。请对照逐条检查自己的答案。</p>
        </div>}
      </div>
    </>}
  </section>;
}
export default function LessonPage({ number, back, openLab, onComplete, completed, onGuided }: {number:string;back:()=>void;openLab:(page:'aes'|'poi'|'attack')=>void;onComplete:()=>void;completed:boolean;onGuided:()=>void}) {
  const chapter = chapters.find(c=>c.number===number)!;
  const lesson = lessonDetails[number];
  const probes = deepProbes[number];
  const [answer,setAnswer] = useState<number|null>(null);
  const [reflected,setReflected] = useState<number[]>([]);
  if(!lesson||!probes)return <div className="page-content"><div className="page-heading"><h1>{chapter.title}</h1><p>本章完整讲义正在更新中。</p></div><button className="outlined-button" onClick={back}>返回课程地图</button></div>;
  const isReady=answer===lesson.quiz.correct&&reflected.length===lesson.sections.length;
  return <div className="page-content lesson-page">
    <button className="back-link" onClick={back}><ArrowLeft size={16}/> 返回课程地图</button>
    <div className="page-heading"><span className="eyebrow">CHAPTER {chapter.number} · LEARN THE WHY</span><h1>{chapter.title}</h1><p>{lesson.lead}</p></div>
    <div className="lesson-intro"><BookOpen size={21}/><div><b>这不是三分钟速览，而是一节需要思考和操作的课程。</b><span>阅读每一步的原因，完成三道开放式解释题后，再参加本章的概念检查；先理解直觉，再看公式。</span></div></div>
    <div className="deep-station-summary"><span>本章练习进度</span><strong>{reflected.length} / {lesson.sections.length} 个开放题已完成独立解释</strong><span>知识选择题：{answer===null?'尚未作答':answer===lesson.quiz.correct?'已答对':'请再尝试'}</span></div>
    {lesson.sections.map((section,index)=><ReasonedSection key={index} section={section} probe={probes[index]} index={index} onReflected={()=>setReflected(s=>s.includes(index)?s:[...s,index])}/>)}
    <section className="panel lesson-quiz"><span className="step-tag">REASONING CHECKPOINT</span><h2>最后确认：是否能独立判断？</h2><h3>{lesson.quiz.question}</h3><div className="choice-list">{lesson.quiz.choices.map((choice,i)=><button key={i} onClick={()=>setAnswer(i)} className={answer===i?(i===lesson.quiz.correct?'correct':'incorrect'):''}><span>{String.fromCharCode(65+i)}</span>{choice}{answer===i&&<CheckCircle2 size={17}/>}</button>)}</div>{answer!==null&&<div className="quiz-explanation"><b>{answer===lesson.quiz.correct?'判断正确，继续检查自己是否能解释原因。':'这个答案存在概念混淆，请对照原因重新思考。'}</b><p>{lesson.quiz.explanation}</p></div>}</section>
    <div className="lesson-actions"><button className="outlined-button" onClick={back}><ArrowLeft size={16}/> 回到知识地图</button><button className="outlined-button" onClick={onGuided}>返回零基础引导 <ArrowRight size={16}/></button>{chapter.destination&&<button className="primary-button" onClick={()=>openLab(chapter.destination!)}><FlaskConical size={17}/> 开始相应实验 <ArrowRight size={16}/></button>}
      <button className="outlined-button" disabled={!isReady||completed} onClick={onComplete}>{completed?'✓ 已记录章节练习完成':isReady?'记录本章练习完成':'请先完成三道开放题并答对测验'}</button>
    </div>
    <div className="lesson-disclaimer"><Info size={16}/> 注意：进度只证明完成了规定交互和自查，并不代表自动评价了开放题质量。真正独立掌握还需要跨章节综合实验与真人试学验证。</div>
  </div>;
}
