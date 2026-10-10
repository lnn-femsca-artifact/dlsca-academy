/** Educational AES-128 reference implementation. State is column-major as specified by NIST FIPS 197. */
export function gfMultiply(a: number, b: number): number {
  let x = a & 255;
  let y = b & 255;
  let result = 0;
  for (let i = 0; i < 8; i++) {
    if (y & 1) result ^= x;
    x = (x << 1) ^ ((x & 0x80) ? 0x11b : 0);
    x &= 255;
    y >>= 1;
  }
  return result;
}
function power(a: number, exponent: number): number {
  let result = 1;
  while (exponent > 0) {
    if (exponent & 1) result = gfMultiply(result, a);
    a = gfMultiply(a, a);
    exponent >>= 1;
  }
  return result;
}
const rotl8 = (x: number, b: number) => ((x << b) | (x >> (8 - b))) & 255;
export const SBOX: number[] = Array.from({ length: 256 }, (_, n) => {
  const inverse = n === 0 ? 0 : power(n, 254);
  return (0x63 ^ inverse ^ rotl8(inverse, 1) ^ rotl8(inverse, 2) ^ rotl8(inverse, 3) ^ rotl8(inverse, 4)) & 255;
});
export const INV_SBOX: number[] = Array.from({ length: 256 }, (_, i) => SBOX.indexOf(i));
export function hammingWeight(value: number): number {
  let n = value & 255;
  let count = 0;
  while (n) { count += n & 1; n >>>= 1; }
  return count;
}
export const hexByte = (n: number) => n.toString(16).toUpperCase().padStart(2, '0');
export const formatHex = (bytes: Iterable<number>) => Array.from(bytes).map(hexByte).join('');
export function parseHexBytes(input: string, length: number): number[] | null {
  const normalized = input.replace(/\s/g, '');
  if (normalized.length !== length * 2 || !/^[a-fA-F0-9]+$/.test(normalized)) return null;
  return Array.from({ length }, (_, i) => parseInt(normalized.slice(i * 2, i * 2 + 2), 16));
}
export function expandKey128(key: readonly number[]): number[][] {
  if (key.length !== 16) throw new Error('AES-128 key must have 16 bytes');
  const words = Array.from({ length: 44 }, () => [0, 0, 0, 0]);
  for (let i = 0; i < 4; i++) words[i] = key.slice(i * 4, i * 4 + 4);
  let rcon = 1;
  for (let i = 4; i < 44; i++) {
    let temp = [...words[i - 1]];
    if (i % 4 === 0) {
      temp = [temp[1], temp[2], temp[3], temp[0]].map(x => SBOX[x]);
      temp[0] ^= rcon;
      rcon = gfMultiply(rcon, 2);
    }
    words[i] = words[i - 4].map((x, j) => x ^ temp[j]);
  }
  return Array.from({ length: 11 }, (_, round) => words.slice(round * 4, round * 4 + 4).flat());
}
const xorKey = (s: number[], key: number[]) => s.map((v, i) => v ^ key[i]);
const subBytes = (s: number[]) => s.map(v => SBOX[v]);
function shiftRows(s: number[]): number[] {
  return s.map((_, i) => { const row = i % 4; const col = Math.floor(i / 4); return s[((col + row) % 4) * 4 + row]; });
}
function mixColumns(s: number[]): number[] {
  const out = [...s];
  for (let c = 0; c < 4; c++) {
    const j = c * 4;
    const [a, b, d, e] = s.slice(j, j + 4);
    out[j] = gfMultiply(a, 2) ^ gfMultiply(b, 3) ^ d ^ e;
    out[j + 1] = a ^ gfMultiply(b, 2) ^ gfMultiply(d, 3) ^ e;
    out[j + 2] = a ^ b ^ gfMultiply(d, 2) ^ gfMultiply(e, 3);
    out[j + 3] = gfMultiply(a, 3) ^ b ^ d ^ gfMultiply(e, 2);
  }
  return out;
}
export type AesFrame = { id: string; round: number; operation: string; note: string; state: number[]; roundKey?: number[] };
export function encryptAES128(plaintext: readonly number[], key: readonly number[]) {
  if (plaintext.length !== 16) throw new Error('AES plaintext must have 16 bytes');
  const roundKeys = expandKey128(key);
  const frames: AesFrame[] = [];
  const record = (round: number, operation: string, note: string, state: number[], roundKey?: number[]) =>
    frames.push({ id: `${round}-${operation}`, round, operation, note, state: [...state], roundKey });
  let state = [...plaintext];
  record(0, 'Input', '16 字节明文被装入 AES 状态矩阵；矩阵以列优先排列。', state);
  state = xorKey(state, roundKeys[0]);
  record(0, 'AddRoundKey', '每一个状态字节与相应的初始轮密钥字节异或。', state, roundKeys[0]);
  for (let round = 1; round <= 10; round++) {
    state = subBytes(state);
    record(round, 'SubBytes', '将每个字节通过公开、可逆的 AES SBox 逐一替换。', state);
    state = shiftRows(state);
    record(round, 'ShiftRows', '状态矩阵第 0、1、2、3 行分别循环左移 0、1、2、3 字节。', state);
    if (round < 10) {
      state = mixColumns(state);
      record(round, 'MixColumns', '对每列执行有限域线性变换；最后一轮不执行该步骤。', state);
    }
    state = xorKey(state, roundKeys[round]);
    record(round, 'AddRoundKey', '与该轮扩展轮密钥异或。', state, roundKeys[round]);
  }
  return { ciphertext: [...state], frames, roundKeys };
}
