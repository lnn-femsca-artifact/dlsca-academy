import { describe, expect, it } from 'vitest';
import { encryptAES128, parseHexBytes, SBOX } from './aes';
import { firstRoundOutput, lastRoundInput, lastRoundSourceIndex } from './intermediates';
const p = parseHexBytes('00112233445566778899AABBCCDDEEFF', 16)!;
const k = parseHexBytes('000102030405060708090A0B0C0D0E0F', 16)!;
describe('AES intermediates and byte indexing', () => {
  it('first-round SBox labels match the recorded SubBytes state', () => {
    const run = encryptAES128(p, k);
    const round1 = run.frames.find(f => f.round === 1 && f.operation === 'SubBytes')!;
    for (let j = 0; j < 16; j++) expect(firstRoundOutput(p[j], k[j])).toBe(round1.state[j]);
    expect(firstRoundOutput(0x2b, 0x2b)).toBe(SBOX[0]);
  });
  it('final-round inverse SBox labels account for ShiftRows positions', () => {
    const run = encryptAES128(p, k);
    const previous = run.frames.find(f => f.round === 9 && f.operation === 'AddRoundKey')!;
    for (let j = 0; j < 16; j++) {
      expect(lastRoundInput(run.ciphertext[j], run.roundKeys[10][j]))
        .toBe(previous.state[lastRoundSourceIndex(j)]);
    }
  });
  it('rejects invalid byte positions and input values', () => {
    expect(() => firstRoundOutput(-1, 0)).toThrow();
    expect(() => lastRoundInput(256, 0)).toThrow();
    expect(() => lastRoundSourceIndex(16)).toThrow();
  });
});
