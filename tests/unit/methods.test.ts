import { describe, expect, it } from 'vitest';
import { isMethodOfferedTo, methodsOfferedTo, METHOD_IDS } from '../../src/core/methods';

describe('method offered to a school', () => {
  it('offers Jafari and Tehran only to Shia', () => {
    expect(isMethodOfferedTo('jafari', 'shia')).toBe(true);
    expect(isMethodOfferedTo('tehran', 'shia')).toBe(true);
    expect(isMethodOfferedTo('mwl', 'shia')).toBe(false);
    expect(isMethodOfferedTo('umm-al-qura', 'shia')).toBe(false);
  });

  it('offers every other method to Sunni and none of the Shia pair', () => {
    expect(isMethodOfferedTo('mwl', 'sunni')).toBe(true);
    expect(isMethodOfferedTo('karachi', 'sunni')).toBe(true);
    expect(isMethodOfferedTo('jafari', 'sunni')).toBe(false);
    expect(isMethodOfferedTo('tehran', 'sunni')).toBe(false);
  });

  it('lists only the Shia pair for Shia, in the stored method order', () => {
    expect(methodsOfferedTo('shia')).toEqual(['jafari', 'tehran']);
  });

  it('lists every Sunni method for Sunni and none of the Shia pair', () => {
    const sunni = methodsOfferedTo('sunni');
    expect(sunni).not.toContain('jafari');
    expect(sunni).not.toContain('tehran');
    expect(sunni).toHaveLength(METHOD_IDS.length - 2);
    expect(sunni[0]).toBe('moonsighting');
    expect(sunni[sunni.length - 1]).toBe('singapore');
  });
});
