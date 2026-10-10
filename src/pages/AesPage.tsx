import { useMemo, useState } from 'react';
import { ArrowRight, Info, RotateCcw, ShieldCheck } from 'lucide-react';
import { encryptAES128, formatHex, hammingWeight, hexByte, INV_SBOX, parseHexBytes, SBOX } from '../domain/aes';
import LabGuide from '../components/LabGuide';

const DEFAULT_P = '00112233445566778899AABBCCDDEEFF';
const DEFAULT_K = '000102030405060708090A0B0C0D0E0F';
function ByteField({ label, value, update }: { label: string; value: string; update: (next: string) => void }) {
  return <label className="form-field"><span>{label}</span><input spellCheck={false} maxLength={2} value={value} onChange={event=>update(event.target.value.replace(/[^a-fA-F0-9]/g, '').toUpperCase().slice(0, 2))} /><small>00–FF</small></label>;
}
function StateGrid({ bytes, selected }: { bytes: number[]; selected?: number }) {
  return <div className="matrix" role="table" aria-label="AES state column-major">
    {Array.from({ length: 4 }, (_, r) => <div className="matrix-row" role="row" key={r}>{Array.from({ length: 4 }, (_, c) => {
      const pos = 4*c+r;
      return <span role="cell" key={c} className={`matrix-byte ${pos === selected ? 'matrix-active' : ''}`}>{hexByte(bytes[pos])}</span>;
    })}</div>)}
  </div>;
}
export default function AesPage() {
  const [plaintext, setPlaintext] = useState(DEFAULT_P);
  const [key, setKey] = useState(DEFAULT_K);
  const [step, setStep] = useState(2);
  const [pByte, setPByte] = useState('2B');
  const [kByte, setKByte] = useState('2B');
  const p = parseHexBytes(plaintext, 16), k = parseHexBytes(key, 16);
  const aes = useMemo(() => p && k ? encryptAES128(p, k) : null, [plaintext, key]);
  const frame = aes?.frames[Math.min(step, aes.frames.length - 1)];
  const pb = parseHexBytes(pByte, 1)?.[0], kb = parseHexBytes(kByte, 1)?.[0];
  const validByte = pb !== undefined && kb !== undefined;
  const xor = validByte ? pb ^ kb : 0;
  const v = SBOX[xor];
  return <div className="page-content">
    <div className="page-heading"><span className="eyebrow">LAB 01 · CRYPTOGRAPHY</span><h1>让 AES 的内部运算<br/><em>变得看得见。</em></h1><p>先不要急着攻击。亲手更改明文与密钥，观察一个字节如何穿过 XOR、SBox，以及完整 AES-128 的 10 轮变换。</p></div>
    <LabGuide kind="aes"/>
    <section className="panel">
      <div className="section-bar"><div><span className="step-tag">01 / BYTE LAB</span><h2>第一轮的一个字节</h2></div><button className="quiet-button" onClick={()=>{setPByte('2B');setKByte('2B');}}><RotateCcw size={15}/> 重置</button></div>
      <div className="byte-inputs"><ByteField label="明文字节 P" value={pByte} update={setPByte}/><div className="operator">⊕</div><ByteField label="密钥字节 K" value={kByte} update={setKByte}/><div className="operator">→</div><div className="result-tile"><span>异或结果</span><b>{validByte ? hexByte(xor) : '--'}</b></div><div className="operator"><ArrowRight size={20}/></div><div className="result-tile tinted"><span>敏感值 V = SBox(X)</span><b>{validByte ? hexByte(v) : '--'}</b></div></div>
      {validByte ? <><div className="binary-row"><span>中间值的二进制表示</span><div className="bit-strip">{v.toString(2).padStart(8,'0').split('').map((b,i)=><span className={b==='1'?'on':''} key={i}>{b}</span>)}</div></div><div className="split-callouts"><div><span>ID / Identity 标签</span><strong>{v}</strong><small>直接使用 SBox 输出，256 类</small></div><div><span>HW / 汉明重量标签</span><strong>{hammingWeight(v)}</strong><small>只数有多少个 1，9 类</small></div><div><span>逆 SBox 验证</span><strong>{hexByte(INV_SBOX[v])}</strong><small>逆 SBox 可以还原 XOR 结果</small></div></div></> : <div className="inline-warning">请输入两个完整的十六进制字节（例如 2B）。</div>}
      <div className="teaching-note"><Info size={18}/><p><b>为什么这就是敏感中间值？</b> 因为它同时依赖公开的明文 P 和未知的密钥 K。建模时真实 K 已知，可计算 V 作为标签；攻击时真实 K 未知，只能针对候选 k 计算假设 V。</p></div>
    </section>
    <section className="panel">
      <div className="section-bar"><div><span className="step-tag">02 / AES ROUND EXPLORER</span><h2>完整 AES-128 逐步执行器</h2></div><span className="source-pill"><ShieldCheck size={14}/> NIST 测试向量</span></div>
      <p className="fine-copy">输入 16 字节明文和 16 字节主密钥。下方按 FIPS 197 的状态顺序展示每次变换后的 4 × 4 状态矩阵。状态矩阵是列优先排列的。</p>
      <div className="hex-inputs"><label className="form-field"><span>明文 · 128 bit（32 位十六进制）</span><input spellCheck={false} value={plaintext} onChange={e=>setPlaintext(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,32))}/></label><label className="form-field"><span>主密钥 · 128 bit</span><input spellCheck={false} value={key} onChange={e=>setKey(e.target.value.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,32))}/></label></div>
      {!aes ? <div className="inline-warning">每项都需要完整 32 位十六进制输入。补全后才能执行 AES。</div> : <>
        <div className="aes-demo-grid"><div className="state-pane"><div className="muted-label">当前内部状态 · {frame?.operation}</div><StateGrid bytes={frame!.state} selected={frame?.round===1&&frame.operation==='SubBytes'?0:undefined}/><small>状态索引：state[row + 4 × column]</small></div><div className="step-pane"><span className="phase-number">ROUND {frame?.round.toString().padStart(2,'0')}</span><h3>{frame?.operation}</h3><p>{frame?.note}</p><div className="frame-navigation"><button disabled={step===0} onClick={()=>setStep(s=>s-1)}>← 上一步</button><span>{step+1} / {aes.frames.length}</span><button disabled={step===aes.frames.length-1} onClick={()=>setStep(s=>s+1)}>下一步 →</button></div><input className="range-input" type="range" min="0" max={aes.frames.length-1} value={step} onChange={e=>setStep(Number(e.target.value))} aria-label="AES 运算步骤" /></div></div>
        <div className="cipher-banner"><span>最终密文 C</span><code>{formatHex(aes.ciphertext)}</code><span className="pass-mark">✓ AES-128</span></div>
        <div className="teaching-note"><Info size={18}/><p><b>如何理解第一轮与最后一轮？</b> 第一轮的中间值常容易通过公开明文构造；最后一轮的某些中间值可以通过公开密文和末轮候选子密钥构造。选择轮次会改变标签公式与要观察的泄漏窗口，不意味着必须更换整套采集设备。</p></div>
      </>}
    </section>
  </div>;
}
