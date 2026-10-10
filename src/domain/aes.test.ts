import { describe, expect, it } from 'vitest';
import { encryptAES128, expandKey128, formatHex, gfMultiply, hammingWeight, INV_SBOX, parseHexBytes, SBOX } from './aes';
const fromHex = (hex: string) => parseHexBytes(hex, hex.length / 2)!;
describe('NIST AES-128 reference implementation', () => {
  it('implements SBox and inverse correctly for all byte values', () => {
    expect(SBOX[0]).toBe(0x63);
    expect(SBOX[1]).toBe(0x7c);
    expect(new Set(SBOX).size).toBe(256);
    for (let x = 0; x < 256; x++) expect(INV_SBOX[SBOX[x]]).toBe(x);
  });
  it('implements GF(2^8) multiplication correctly', () => expect(gfMultiply(0x57, 0x13)).toBe(0xfe));
  it('calculates HW', () => { expect(hammingWeight(0x63)).toBe(4); expect(hammingWeight(0xff)).toBe(8); });
  it('expands the NIST round 1 key', () => {
    const keys = expandKey128(fromHex('000102030405060708090A0B0C0D0E0F'));
    expect(formatHex(keys[1])).toBe('D6AA74FDD2AF72FADAA678F1D6AB76FE');
  });
  it('matches FIPS 197 appendix B encryption example', () => {
    const result = encryptAES128(fromHex('00112233445566778899AABBCCDDEEFF'), fromHex('000102030405060708090A0B0C0D0E0F'));
    expect(formatHex(result.ciphertext)).toBe('69C4E0D86A7B0430D8CDB78070B4C55A');
    expect(formatHex(result.frames[2].state)).toBe('63CAB7040953D051CD60E0E7BA70E18C');
  });
});
