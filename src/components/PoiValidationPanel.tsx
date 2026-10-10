import { useState } from 'react';
import { Info, RefreshCw } from 'lucide-react';
import { generateTraces } from '../domain/leakage';
import { evaluatePoiSelection, type ValidationRow } from '../domain/poiValidation';
import './PoiValidationPanel.css';
export default function PoiValidationPanel({noise,jitter,windowSize}:{noise:number;jitter:number;windowSize:number}) {
  const [snapshot,setSnapshot]=useState<{params:string;rows:ValidationRow[]}|null>(null);
  const params=`${noise.toFixed(1)}/${jitter}/${windowSize}`;
  const stale=snapshot!==null&&snapshot.params!==params;
  const run=()=>{
    const source=generateTraces({noise,jitter,count:256});
    const rows=evaluatePoiSelection(source,windowSize);
    setSnapshot({params,rows});
  };
  return <section className="panel poi-validation-panel">
    <span className="step-tag">03 / FROM POINTS TO VALIDATION</span>
    <h2>统计峰选出来了，怎样证明窗口真的有用？</h2>
    <p>上面的方法只能<strong>筛选候选窗口</strong>。我们再用一个可重复的小实验做独立验证：把每种输入的合成迹线划分为两个不重叠部分，<b>第一部分选择峰和拟合一个极简单的分类器；第二部分只用来比较预测效果。</b></p>
    <div className="poi-validation-flow"><div><b>选择/建模数据</b><span>计算 SNR、NICV、TVLA 或相关性；选中心并拟合 9 类 HW 均值</span></div><span>→</span><div><b>独立验证数据</b><span>不再参与选点，只检验分类结果是否与真实 HW 一致</span></div></div>
    <button className="poi-validation-run" onClick={run}><RefreshCw size={16}/> {snapshot?'使用当前设置重新验证':'开始独立窗口验证'}</button>
    {stale&&<p className="poi-validation-stale">你修改了上方的噪声、错位或窗口宽度。表格是旧设置的结果，请重新运行。</p>}
    {snapshot&&<><div className="poi-validation-table-wrap"><table className="poi-validation-table"><thead><tr><th>候选窗口来源</th><th>中心点</th><th>独立 HW 分类准确率</th></tr></thead><tbody>{snapshot.rows.map(x=><tr key={x.name}><td>{x.name}</td><td>#{x.point}</td><td>{(100*x.accuracy).toFixed(1)}%</td></tr>)}</tbody></table></div>
    <p className="poi-validation-foot">每种方法使用同一批数据切分与相同的 {snapshot.rows[0]?.width} 点窗口。随机/无关峰是基线，不是额外的 PoI 检测方法；每组随机迹线中 {snapshot.rows[0]?.trainSize} 条用于拟合，{snapshot.rows[0]?.validationSize} 条用于验证。</p></>}
    <div className="poi-validation-warning"><Info size={18}/><span><b>不要误读：</b>这里只验证一个基于单一窗口均值的简单“最近类别中心”分类器，不是 CNN/LNN，也不是密钥恢复的 PGE。因此准确率高不保证真实攻击最佳。我们要学的是：用标签统计筛候选，再用独立数据评价实际任务，不能用最终测试集不断挑结果。</span></div>
  </section>;
}
