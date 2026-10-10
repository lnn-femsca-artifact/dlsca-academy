import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown, Info } from 'lucide-react';
import './LabGuide.css';
type LabName='aes'|'poi'|'attack';
type Step={title:string;notice:string;tryThis:string;why:string;observation:string;mistake:string};
const guides:Record<LabName,{title:string;why:string;steps:Step[]}>={
 aes:{
 title:'先学看懂字节，再研究完整 AES',
 why:'你不需要提前记住 XOR、SBox、AES 状态矩阵；先观察同一个数怎样被改变，再理解全体 16 字节的流程。',
 steps:[
 {title:'先看一个最小的字节运算',notice:'下方第一组数值从 P=0x2B、K=0x2B 开始。',tryThis:'将密钥改为 2A，比较 XOR 结果与 SBox 输出的变化。',why:'一个 XOR 与 SBox 结果依赖公开 P 和选择的密钥字节。这就是第一轮敏感中间值的由来。',observation:'K=2B 时 P⊕K=00、SBox=63；K=2A 时 XOR=01、SBox=7C。',mistake:'看到 V 随 K 改变，不代表攻击者知道目标真实 K；实验里我们在控制示例输入。'},
 {title:'理解为什么 SBox 可逆却仍不能直接求 K',notice:'SBox 是完全公开且一一对应的查找表。',tryThis:'观察逆 SBox 验证如何把 SBox 输出还原成 XOR 的输入。',why:'只有拿到真正的内部 V，才能计算 K=P⊕InvSBox(V)；未知目标设备并不会公开它。',observation:'当 V=63，InvSBox(63)=00，和 P=2B XOR 得 2B。',mistake:'知道逆函数不等于知道目标设备真正的函数输出。'},
 {title:'再观察 16 字节与 10 轮',notice:'完整 AES-128 一次处理 16 字节，而不是一个字节。',tryThis:'点击完整状态演示中的“下一步”，比较 SubBytes、ShiftRows 与 MixColumns 的区别。',why:'第一轮一个字节能方便地建模；中间轮字节经多轮混合后，通常不再仅取决于一个公开字节和一个子密钥候选。',observation:'ShiftRows 改变排列位置；MixColumns 把同一列中的多个字节混合；最后一轮不做 MixColumns。',mistake:'状态矩阵在 UI 的视觉位置和内部一维存储索引必须遵循列优先约定。'},
 {title:'最后把 AES 内部值连接到侧信道',notice:'普通加密设备只输出 C，不直接输出第一轮 V。',tryThis:'指出第一轮 SBox 输出是哪一段加密流程产生的，以及目标设备中哪项信息未知。',why:'DLSCA 依赖物理测量来补充内部信息，再结合公开的 AES 关系推断候选密钥。',observation:'建模时 K 已知，可以生成 V 标签；攻击时 K 未知，只能枚举候选 k。',mistake:'公开 P 与 C 并不直接给出所有内部状态。'},
 ]},
 poi:{
 title:'先找与中间值有关的变化，后比较统计方法',
 why:'PoI 不是“挑一段最大的波形”。我们关心的是数据标签与某些时刻的观测是否发生系统性关联。',
 steps:[
 {title:'认识时间轴上的一条 Trace',notice:'这是合成测量，不是真实示波器信号。',tryThis:'先保持默认噪声和错位，观察 256 个采样点的时序波形。',why:'一条 Trace 只包含一次加密期间的物理采样，既可能有目标泄漏，也可能有无关信号与噪声。',observation:'波形的一部分峰值来自人为设置的 HW 相关脉冲，另一些来自无关信号。',mistake:'单条波形尖峰的幅度不直接等于密钥相关性。'},
 {title:'为何要收集许多不同明文的 Trace',notice:'参考设备密钥已知，可以给每条 Trace 计算 HW 标签。',tryThis:'点击“揭示合成数据生成位置”，再与统计峰值的位置比较。',why:'我们想知道同一时刻的采样值是否随所选中间值类别系统性变化。多条迹线才能估计分组均值、方差与噪声。',observation:'预设的数据相关位置靠近 83、164 点，但不同标签模型下指标峰的位置可能不同。',mistake:'已知参考标签才能直接做按真实 HW 类别分组的 SNR；不能把目标未知密钥的真值偷用进来。'},
 {title:'依次比较 SNR、NICV、TVLA',notice:'这三个名字并不代表同一种检验。',tryThis:'先看 SNR 与 NICV，再切换 TVLA，观察峰值和解释的变化。',why:'SNR 用组间均值差与组内噪声比较；NICV 看标签解释的总方差比例；普通 TVLA 只检测指定两组有无统计差异。',observation:'普通固定/随机 TVLA 的峰值并不一定恰好识别选定 SBox 的最佳攻击点。',mistake:'不能直接比较“TVLA 的 5”和“SNR 的 0.5”，判断哪个泄漏更强。'},
 {title:'改变噪声与错位',notice:'真实采集有噪声和时间不稳定。',tryThis:'逐步增大噪声 σ，再增加错位量，看峰变弱或变宽。',why:'如果每条迹线同一中间值泄漏发生时间不同，固定索引分组统计就会失焦。',observation:'高噪声和错位通常增加定位的不确定性，但具体结果取决于统计样本数量及模型。',mistake:'峰减弱不证明泄漏完全不存在；可能只是当前分析方法不适合。'},
 {title:'别忘了最终验证窗口',notice:'曲线上最大的点不一定对应最少攻击迹线数。',tryThis:'修改候选窗口宽度，然后点击页面下方的“开始独立窗口验证”，比较不同方法和随机基线在留出数据上的分类准确率。',why:'过窄可能丢掉邻近有用泄漏，过宽可能引入噪声或增加模型复杂度；不应根据最终测试集反复调参。',observation:'页面的“独立验证”只比较简单的 HW 类均值分类器，是真正使用留出数据的验证步骤；还不能代替深度学习密钥攻击的 Rank/PGE。',mistake:'“找到了统计峰”不等于“已经证明最佳攻击窗口”。'},
 ]},
 attack:{
 title:'从一条迹线的一个猜测，走到 256 个候选的排名',
 why:'这个实验用透明的概率模型代替真实神经网络，只为演示为什么“预测中间值”能够转化为“恢复密钥”。',
 steps:[
 {title:'先只看公开明文 P',notice:'每条目标 Trace 附带公开的明文字节。真实目标密钥并不参与评分。',tryThis:'找到“明文字节 P”和“候选密钥 k”两个输入，先将 k 设为 2B。',why:'AES 第一轮的假设值 V(k)=SBox(P⊕k) 完全可以在已知 P 和候选 k 的情况下计算。',observation:'模型对 Trace 只推理一次；候选 k 变化时假设 V(k) 会变化。',mistake:'不能把攻击者枚举的 k 当作已经读到的正确 K。'},
 {title:'为什么模型输出概率不是直接输出 K',notice:'模型输出的是对 256 个 ID 中间值类（或 9 个 HW 类）的概率。',tryThis:'将候选 k 从 2B 改为 2A，观察 V(k)、标签与查出的概率一起变化。',why:'每个候选 k 映射到一个假设标签；“标签概率”会被转换为“该候选的匹配得分”。',observation:'读取的是 p[label(V(k))]，而不是模型直接输出 p[K=k]。',mistake:'最大概率类别可能不是实际 V，不能只看单条 argmax。'},
 {title:'为什么要增加多条 Trace',notice:'初始只是有限的噪声观测，候选排名不稳定。',tryThis:'点击“从第 1 条开始”，再逐条增加 Trace，观察第一名如何变化。',why:'目标密钥不变，但 P 和噪声变化；多次观测为同一候选提供新的独立或近似独立证据。',observation:'候选 log 分数按迹线逐次相加，排名可能上下波动。',mistake:'一次 Rank=0 不保证以后一直为 0。'},
 {title:'为什么使用 log 概率累积',notice:'上百个小于 1 的数不断相乘可能发生数值下溢。',tryThis:'选择一个候选，观察单次 log(概率) 与总分之间的关系。',why:'log(∏pᵢ)=Σlog(pᵢ)，在保持乘积排序的同时提高数值稳定性。',observation:'对每个 k 累积的都是“它假设出的标签”的模型概率；最后按总分降序排列。',mistake:'log 得分并不无条件等于经校准的真实密钥后验概率。'},
 {title:'解释 Rank、HW 和真实密钥的边界',notice:'本实验只尝试一个 8 bit 字节，模拟真值只用于计算 Rank。',tryThis:'切换 ID 与 HW，再使用全部 220 条 Trace；最后点击“揭示模拟器中的真实密钥”。',why:'HW 会将许多 V 压缩为同一标签，但多条不同 P 仍可能提供区分证据；Rank 0 只代表这一个字节候选当前第一。',observation:'受控评估可以知道真实子密钥计算 Rank，而攻击评分绝对不能读取该真值。',mistake:'单字节 Rank 0 不等于完整 128 bit AES 密钥被恢复。'},
 ]},
};
export default function LabGuide({kind}:{kind:LabName}) {
  const [open,setOpen]=useState(true);
  const [index,setIndex]=useState(0);
  const g=guides[kind],step=g.steps[index];
  return <section className="lab-guide"><div className="lab-guide-bar"><div><span className="tiny-overline">第一次来？请先完成引导</span><h2><BookOpen size={21}/> {g.title}</h2></div><button onClick={()=>setOpen(s=>!s)} aria-expanded={open} aria-label={open?'收起实验引导':'展开实验引导'}>{open?'收起':'查看引导'} <ChevronDown size={15}/></button></div>{open&&<div className="lab-guide-body">
    <p className="lab-guide-purpose"><Info size={16}/>{g.why}</p>
    <div className="lab-guide-steps">{g.steps.map((s,i)=><button key={s.title} onClick={()=>setIndex(i)} className={i===index?'current':''} aria-label={`实验步骤${i+1}：${s.title}`}>{i+1}</button>)}</div>
    <h3>{step.title}</h3><p>{step.notice}</p>
    <div className="lab-guide-instruction"><strong>现在动手做什么？</strong><p>{step.tryThis}</p></div>
    <div className="lab-guide-reason"><strong>为什么要做这一步？</strong><p>{step.why}</p></div>
    <details><summary>做完后应该观察到什么？</summary><p>{step.observation}</p></details>
    <details><summary>这里最容易产生什么误解？</summary><p>{step.mistake}</p></details>
    <div className="lab-guide-nav"><button disabled={index===0} onClick={()=>setIndex(i=>i-1)}><ArrowLeft size={15}/> 上一步</button><span>{index+1} / {g.steps.length}</span><button disabled={index===g.steps.length-1} onClick={()=>setIndex(i=>i+1)}>下一步 <ArrowRight size={15}/></button></div>
    {index===g.steps.length-1&&<p className="lab-guide-complete"><CheckCircle2 size={15}/> 完成阅读后还需要自己操作实验并解释观察；仅阅读引导不代表掌握。</p>}
  </div>}</section>;
}
