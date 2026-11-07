import { describe, it, expect } from 'vitest';
import { findBuildingBySlug } from '../buildingUtils';

const buildings = [
  { id: 'A', slug: 'vignan-bhavan', name: 'Vignan Bhavan' },
  { id: 'H', slug: 'h-block', name: 'H Block' },
  { id: 'N', slug: 'nagarjuna-block', name: 'Nagarjuna Bhavan' },
  { id: 'P', slug: 'library', name: 'P Block' },
  { id: 'U', slug: 'aryabhata-bhavan', name: 'Aryabhata Bhavan' },
];

describe('findBuildingBySlug', () => {
  it('resolves each dedicated campus URL to its own building', () => {
    expect(findBuildingBySlug(buildings, 'vignan-bhavan')?.id).toBe('A');
    expect(findBuildingBySlug(buildings, 'aryabhata-bhavan')?.id).toBe('U');
    expect(findBuildingBySlug(buildings, 'nagarjuna-block')?.id).toBe('N');
    expect(findBuildingBySlug(buildings, 'h-block')?.id).toBe('H');
    expect(findBuildingBySlug(buildings, 'library')?.id).toBe('P');
  });

  it('accepts the short block code', () => {
    expect(findBuildingBySlug(buildings, 'A')?.slug).toBe('vignan-bhavan');
    expect(findBuildingBySlug(buildings, 'a')?.slug).toBe('vignan-bhavan');
  });

  it('returns undefined for a missing slug instead of defaulting to a building', () => {
    expect(findBuildingBySlug(buildings, undefined)).toBeUndefined();
    expect(findBuildingBySlug(buildings, 'does-not-exist')).toBeUndefined();
  });
});
