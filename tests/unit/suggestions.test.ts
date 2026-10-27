import { describe, expect, it } from 'vitest';
import { suggestMethod } from '../../src/core/suggestions';

describe('suggestMethod', () => {
  it('suggests Jafari, and Tehran in Iran, only to Shia users', () => {
    expect(suggestMethod('GB', 'shia')).toEqual({
      suggested: 'jafari',
      alternatives: [],
      confidence: 'high',
    });
    expect(suggestMethod('IR', 'shia').suggested).toBe('tehran');
    expect(suggestMethod('IR', 'sunni').suggested).not.toBe('jafari');
  });

  it('uses the country table for a single official method', () => {
    expect(suggestMethod('SA', 'sunni').suggested).toBe('umm-al-qura');
    expect(suggestMethod('pk', 'sunni').suggested).toBe('karachi');
    expect(suggestMethod('TR', 'sunni').suggested).toBe('turkey');
    expect(suggestMethod('ID', 'sunni').suggested).toBe('singapore');
    expect(suggestMethod('BH', 'sunni')).toMatchObject({ suggested: 'qatar', confidence: 'low' });
  });

  it('gives the UK, Ireland, the US and Canada three real choices', () => {
    for (const country of ['GB', 'IE', 'US', 'CA']) {
      expect(suggestMethod(country, 'sunni')).toEqual({
        suggested: 'moonsighting',
        alternatives: ['north-america', 'karachi'],
        confidence: 'high',
      });
    }
  });

  it('gives everywhere else Muslim World League with two alternatives', () => {
    expect(suggestMethod('DE', 'sunni')).toEqual({
      suggested: 'mwl',
      alternatives: ['moonsighting', 'karachi'],
      confidence: 'medium',
    });
    expect(suggestMethod('ZZ', 'sunni').suggested).toBe('mwl');
  });
});
