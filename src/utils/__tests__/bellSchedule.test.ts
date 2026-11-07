import { describe, it, expect } from 'vitest';
import { familyKey, selectBellEntries } from '../timeUtils';

describe('familyKey', () => {
  it('strips a trailing section letter', () => {
    expect(familyKey('II AIML-J')).toBe('II AIML');
  });
  it('strips a SEC-number designator', () => {
    expect(familyKey('I SASH SEC-29')).toBe('I SASH');
    expect(familyKey('I X SEC-51')).toBe('I X');
    expect(familyKey('I Y SEC-26')).toBe('I Y');
  });
  it('strips a "Sec N" designator', () => {
    expect(familyKey('III CSE-Sec 11')).toBe('III CSE');
  });
  it('keeps a program name that has no section suffix', () => {
    expect(familyKey('III CSBS')).toBe('III CSBS');
    expect(familyKey('I BS(DS)')).toBe('I BS(DS)');
    expect(familyKey('II MTECH(DS)(Room No: 602)')).toBe('II MTECH(DS)(Room No: 602)');
  });
});

describe('selectBellEntries', () => {
  const sibling = (sectionId: string, startTime: string, endTime: string) =>
    ({ sectionId, startTime, endTime });

  it('adds a sibling period the section is free for', () => {
    const department = [sibling('II AIML-K', '13:40', '14:30')];
    const own = [{ startTime: '08:15', endTime: '09:05' }];
    expect(selectBellEntries(department, 'II AIML-J', own)).toHaveLength(1);
  });

  it('ignores entries from other programs', () => {
    const department = [sibling('III CSBS', '13:40', '14:30')];
    const own = [{ startTime: '08:15', endTime: '09:05' }];
    expect(selectBellEntries(department, 'III CSBS', own)).toHaveLength(1);
    expect(selectBellEntries(department, 'III AIML-A', own)).toHaveLength(0);
  });

  it('drops a sibling interval that collides with the section own class', () => {
    const department = [sibling('I X SEC-02', '10:05', '10:55')];
    const own = [{ startTime: '10:10', endTime: '11:00' }];
    expect(selectBellEntries(department, 'I X SEC-51', own)).toHaveLength(0);
  });

  it('returns nothing when the family runs two different bells', () => {
    const department = [
      sibling('I X SEC-02', '12:40', '13:30'),
      sibling('I X SEC-52', '12:50', '13:40'),
    ];
    const own = [{ startTime: '08:15', endTime: '09:05' }];
    expect(selectBellEntries(department, 'I X SEC-51', own)).toHaveLength(0);
  });
});
