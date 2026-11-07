import { describe, it, expect } from 'vitest';
import { roomMatchKey, canonicalRoomId } from '../roomUtils';

describe('roomMatchKey', () => {
  it('collapses the spellings of one room to a single key', () => {
    const spellings = ['VBFF 1', 'VBFF-1', 'VBFF1', ' vbff-1 ', 'VBFF-01'];
    expect(new Set(spellings.map(roomMatchKey)).size).toBe(1);
  });

  it('matches the N-block catalogue ids', () => {
    expect(roomMatchKey('N-514A')).toBe(roomMatchKey('N-514-A'));
    expect(roomMatchKey('NB 107')).toBe(roomMatchKey('NB-107'));
    expect(roomMatchKey('NB-107')).toBe(roomMatchKey('NB107'));
  });

  it('keeps a numeric-leading suffix so 501-A and 501A agree', () => {
    expect(roomMatchKey('501-A')).toBe(roomMatchKey('501A'));
    expect(roomMatchKey('619-A')).toBe(roomMatchKey('619A'));
  });

  it('treats a bracketed qualifier as a note, not part of the code', () => {
    expect(roomMatchKey('N-107 (LAB)')).toBe(roomMatchKey('N-107'));
  });

  it('returns null for empty input', () => {
    expect(roomMatchKey(null)).toBeNull();
    expect(roomMatchKey(undefined)).toBeNull();
    expect(roomMatchKey('   ')).toBeNull();
    expect(roomMatchKey('()')).toBeNull();
  });
});

describe('canonicalRoomId', () => {
  it('tidies a bare PREFIX NUM code', () => {
    expect(canonicalRoomId('VBFF 1')).toBe('VBFF-1');
    expect(canonicalRoomId('nb 107')).toBe('NB-107');
    expect(canonicalRoomId('N-514A')).toBe('N-514A');
  });

  it('leaves free-text labels readable', () => {
    expect(canonicalRoomId('SRAVANTHI SEMINAR HALL')).toBe('SRAVANTHI SEMINAR HALL');
    expect(canonicalRoomId('107 DRAWING HALL, N BLOCK')).toBe('107 DRAWING HALL, N BLOCK');
  });

  it('returns null for empty input', () => {
    expect(canonicalRoomId(null)).toBeNull();
    expect(canonicalRoomId(undefined)).toBeNull();
    expect(canonicalRoomId('   ')).toBeNull();
  });
});
