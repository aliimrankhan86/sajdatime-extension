import { describe, expect, it } from 'vitest';
import { eidNoticeKey, formatNoticeDate, ramadanNoticeKey } from '../../src/core/notices';

describe('notice keys', () => {
  it('scopes a coming notice to one Ramadan', () => {
    expect(ramadanNoticeKey(1448)).toBe('sajdatime.notice.ramadan.1448');
  });

  it('scopes an Eid notice to one Eid and year', () => {
    expect(eidNoticeKey('fitr', 1448)).toBe('sajdatime.notice.eid.fitr.1448');
    expect(eidNoticeKey('adha', 1447)).toBe('sajdatime.notice.eid.adha.1447');
  });
});

describe('formatNoticeDate', () => {
  it('writes a Gregorian date for the en-GB popup', () => {
    expect(formatNoticeDate('2027-02-08', 'en-GB')).toBe('8 February 2027');
  });
});
