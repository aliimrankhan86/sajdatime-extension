import { describe, expect, it } from 'vitest';
import {
  contains,
  daysUntilStart,
  eidOn,
  hijriFor,
  isLastDay,
  isRamadan,
  offersTimetable,
  ramadanInfo,
  showsComingNotice,
  showsNotice,
  showsSettings,
} from '../../src/core/hijri';

describe('hijriFor', () => {
  it('matches the phone for 1 Ramadan 1447 and 1448', () => {
    expect(hijriFor('2026-02-18')).toEqual({ year: 1447, month: 9, day: 1 });
    expect(hijriFor('2027-02-08')).toEqual({ year: 1448, month: 9, day: 1 });
  });

  it('moves the whole calendar by the user shift', () => {
    expect(hijriFor('2027-02-07', 1)).toEqual({ year: 1448, month: 9, day: 1 });
    expect(hijriFor('2027-02-09', -1)).toEqual({ year: 1448, month: 9, day: 1 });
    expect(hijriFor('2026-02-18', 1)).toEqual({ year: 1447, month: 9, day: 2 });
  });

  it('is null for a date it cannot read', () => {
    expect(hijriFor('not-a-date')).toBeNull();
  });
});

describe('Ramadan', () => {
  it('finds a thirty day Ramadan in 1447', () => {
    const info = ramadanInfo('2026-02-20');
    expect(info).not.toBeNull();
    expect(info?.firstDay).toBe('2026-02-18');
    expect(info?.lastDay).toBe('2026-03-19');
    expect(info?.length).toBe(30);
    expect(info?.dayNumber).toBe(3);
  });

  it('finds a twenty nine day Ramadan in 1448', () => {
    const info = ramadanInfo('2027-02-20');
    expect(info?.firstDay).toBe('2027-02-08');
    expect(info?.lastDay).toBe('2027-03-08');
    expect(info?.length).toBe(29);
    expect(info?.dayNumber).toBe(13);
  });

  it('moves Ramadan with the shift', () => {
    expect(ramadanInfo('2027-02-07', 1)?.firstDay).toBe('2027-02-07');
    expect(ramadanInfo('2027-02-09', -1)?.firstDay).toBe('2027-02-09');
  });

  it('finds the next Ramadan after it has passed', () => {
    const info = ramadanInfo('2026-06-01');
    expect(info?.hijriYear).toBe(1448);
    expect(info?.firstDay).toBe('2027-02-08');
    expect(info?.dayNumber).toBeNull();
  });

  it('offers the timetable thirty days before, not thirty one', () => {
    const info = ramadanInfo('2026-02-20');
    if (!info) throw new Error('expected Ramadan');
    expect(offersTimetable(info, '2026-01-19')).toBe(true);
    expect(offersTimetable(info, '2026-01-18')).toBe(false);
  });

  it('shows the notice from three days before to the second day', () => {
    const info = ramadanInfo('2026-02-20');
    if (!info) throw new Error('expected Ramadan');
    expect(showsNotice(info, '2026-02-15')).toBe(true);
    expect(showsNotice(info, '2026-02-14')).toBe(false);
    expect(showsNotice(info, '2026-02-19')).toBe(true);
    expect(showsNotice(info, '2026-02-20')).toBe(false);
  });

  it('shows the coming notice only in the three days before Ramadan', () => {
    const info = ramadanInfo('2027-02-08');
    if (!info) throw new Error('expected Ramadan');
    expect(showsComingNotice(info, '2027-02-05')).toBe(true);
    expect(showsComingNotice(info, '2027-02-06')).toBe(true);
    expect(showsComingNotice(info, '2027-02-07')).toBe(true);
    expect(showsComingNotice(info, '2027-02-04')).toBe(false);
    expect(showsComingNotice(info, '2027-02-08')).toBe(false);
    expect(showsComingNotice(info, '2027-02-09')).toBe(false);
  });

  it('shows Ramadan settings inside it and in the three days before', () => {
    const info = ramadanInfo('2026-02-20');
    if (!info) throw new Error('expected Ramadan');
    expect(showsSettings(info, '2026-02-15')).toBe(true);
    expect(showsSettings(info, '2026-02-14')).toBe(false);
    expect(contains(info, '2026-03-19')).toBe(true);
    expect(contains(info, '2026-03-20')).toBe(false);
    expect(isLastDay(info)).toBe(false);
  });

  it('counts the days until the start, forwards and backwards', () => {
    const info = ramadanInfo('2026-02-20');
    if (!info) throw new Error('expected Ramadan');
    expect(daysUntilStart(info, '2026-02-15')).toBe(3);
    expect(daysUntilStart(info, '2026-02-18')).toBe(0);
    expect(daysUntilStart(info, '2026-02-20')).toBe(-2);
  });

  it('recognises the two Eids', () => {
    expect(eidOn('2026-03-20')).toEqual({ eid: 'fitr', hijriYear: 1447 });
    expect(eidOn('2026-05-27')).toEqual({ eid: 'adha', hijriYear: 1447 });
  });

  it('is false outside Ramadan', () => {
    expect(isRamadan('2026-01-15')).toBe(false);
    expect(isRamadan('2026-02-18')).toBe(true);
  });
});
