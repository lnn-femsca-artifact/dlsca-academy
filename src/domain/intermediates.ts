/** Public AES-128 byte-level intermediates. Ciphertext positions are post-ShiftRows positions. */
import { INV_SBOX, SBOX } from './aes';

function byte(value: number): boolean { return Number.isInteger(value) && value >= 0 && value <= 255; }
function index(value: number): boolean { return Number.isInteger(value) && value >= 0 && value < 16; }

/** Initial-round SubBytes output for a chosen byte (AES-128 round 0 key = master key). */
export function firstRoundOutput(plaintextByte: number, initialKeyByte: number): number {
  if (!byte(plaintextByte) || !byte(initialKeyByte)) throw new RangeError('Expected two bytes in range 0..255');
  return SBOX[plaintextByte ^ initialKeyByte];
}

/** Ciphertext byte j maps to this input-state byte before the final ShiftRows. */
export function lastRoundSourceIndex(ciphertextPosition: number): number {
  if (!index(ciphertextPosition)) throw new RangeError('AES state index must be 0..15');
  const row = ciphertextPosition % 4;
  const col = Math.floor(ciphertextPosition / 4);
  return ((col + row) % 4) * 4 + row;
}

/** Inverse final-round SBox applied to the ciphertext byte after undoing AddRoundKey.
 *  The output belongs to pre-ShiftRows source position lastRoundSourceIndex(j).
 */
export function lastRoundInput(ciphertextByte: number, finalRoundKeyByte: number): number {
  if (!byte(ciphertextByte) || !byte(finalRoundKeyByte)) throw new RangeError('Expected two bytes in range 0..255');
  return INV_SBOX[ciphertextByte ^ finalRoundKeyByte];
}
