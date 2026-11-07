import { describe, it, expect } from 'vitest';
import { canonicalRoomId } from '../roomUtils';

describe('canonicalRoomId', () => {
  it('collapses the spellings of one room to a single id', () => {
    const spellings = ['VBFF 1', 'VBFF-1', 'VBFF1', ' vbff-1 '];
    const ids = new Set(spellings.map(canonicalRoomId));
    expect(ids.size).toBe(1);
    expect(canonicalRoomId('VBFF 1')).toBe('VBFF-1');
  });

  it('matches the N-block catalogue ids', () => {
    expect(canonicalRoomId('N-514A')).toBe('N-514A');
    expect(canonicalRoomId('N-514-A')).toBe('N-514A');
    expect(canonicalRoomId('NB 107')).toBe('NB-107');
    expect(canonicalRoomId('NB-107')).toBe('NB-107');
    expect(canonicalRoomId('NB107')).toBe('NB-107');
  });

  it('keeps a numeric-leading suffix so 501-A and 501A agree', () => {
    expect(canonicalRoomId('501-A')).toBe('501A');
    expect(canonicalRoomId('501A')).toBe('501A');
    expect(canonicalRoomId('619-A')).toBe(canonicalRoomId('619A'));
  });

  it('drops leading zeros so the padded and plain codes agree', () => {
    expect(canonicalRoomId('VBFF-01')).toBe('VBFF-1');
    expect(canonicalRoomId('VBT-08')).toBe('VBT-8');
    expect(canonicalRoomId('VBFFTF-03')).toBe(canonicalRoomId('VBFFTF-3'));
  });

  it('drops a bracketed qualifier that is a note, not part of the code', () => {
    expect(canonicalRoomId('LAB-2(LIB 2 FLOOR)')).toBe('LAB-2');
    expect(canonicalRoomId('N-107 (LAB)')).toBe('N-107');
  });

  it('returns null for empty input', () => {
    expect(canonicalRoomId(null)).toBeNull();
    expect(canonicalRoomId(undefined)).toBeNull();
    expect(canonicalRoomId('   ')).toBeNull();
    expect(canonicalRoomId('()')).toBeNull();
  });
});
