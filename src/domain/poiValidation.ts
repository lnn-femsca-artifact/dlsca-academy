import { calculatePoiMetrics, topPoi, TRACE_LENGTH, type PoiMethod, type SyntheticTrace } from './leakage';
/** Deliberately simple 1D nearest-class-mean validation, NOT a DNN or a real AES attack. */
export type ValidationRow={name:string;point:number;width:number;accuracy:number;trainSize:number;validationSize:number};
export function evaluatePoiSelection(traces:SyntheticTrace[],windowSize:number):ValidationRow[]{
  const random=traces.filter(t=>t.group==='random');
  const fixed=traces.filter(t=>t.group==='fixed');
  const n=Math.floor(Math.min(random.length,fixed.length)/2);
  if(n<20)throw Error('Need at least 40 random and fixed traces to split selection and validation');
  const selection=[...random.slice(0,n),...fixed.slice(0,n)];
  const validation=random.slice(n);
  const metrics=calculatePoiMetrics(selection);
  const methods:PoiMethod[]=['snr','nicv','tvla','correlation'];
  const plans=[...methods.map(method=>({name:method.toUpperCase(),point:topPoi(metrics[method]).point})),{name:'随机窗口基线',point:33},{name:'无关峰基线',point:224}];
  return plans.map(plan=>{
    const start=Math.max(0,Math.min(TRACE_LENGTH-windowSize,plan.point-Math.floor(windowSize/2)));
    const feature=(t:SyntheticTrace)=>t.samples.slice(start,start+windowSize).reduce((s,v)=>s+v,0)/windowSize;
    const bins=Array.from({length:9},()=>[] as number[]);
    random.slice(0,n).forEach(t=>bins[t.hw].push(feature(t)));
    const centroids=bins.map(bin=>bin.length?bin.reduce((s,v)=>s+v,0)/bin.length:null);
    let correct=0;
    for(const item of validation){
      const x=feature(item);
      let best=-1, distance=Infinity;
      centroids.forEach((value,idx)=>{
        if(value===null)return;
        const d=Math.abs(x-value);
        if(d<distance){distance=d;best=idx;}
      });
      if(best===item.hw)correct++;
    }
    return {name:plan.name,point:plan.point,width:windowSize,accuracy:correct/validation.length,trainSize:n,validationSize:validation.length};
  });
}
