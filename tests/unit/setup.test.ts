import { describe, expect, it } from 'vitest';
import { firstSettings } from '../../src/settings/create';
import { MAKKAH } from '../../src/settings/place';
import { isSetupDraft, MAX_STEP, SETUP_KEY } from '../../src/settings/setup';

const settings = firstSettings(MAKKAH);

function draft(overrides: Record<string, unknown> = {}): unknown {
  return { step: 2, settings, madhabChosen: false, ...overrides };
}

describe('setup draft', () => {
  it('uses its own storage key, separate from finished settings', () => {
    expect(SETUP_KEY).toBe('sajdatime.setup.v1');
  });

  it('accepts a complete draft', () => {
    expect(isSetupDraft(draft())).toBe(true);
    expect(isSetupDraft(draft({ step: 0 }))).toBe(true);
    expect(isSetupDraft(draft({ step: MAX_STEP, madhabChosen: true }))).toBe(true);
  });

  it('rejects a step out of range, a missing flag or damaged settings', () => {
    expect(isSetupDraft(draft({ step: -1 }))).toBe(false);
    expect(isSetupDraft(draft({ step: MAX_STEP + 1 }))).toBe(false);
    expect(isSetupDraft(draft({ step: 1.5 }))).toBe(false);
    expect(isSetupDraft(draft({ step: '2' }))).toBe(false);
    expect(isSetupDraft(draft({ madhabChosen: undefined }))).toBe(false);
    expect(isSetupDraft(draft({ madhabChosen: 'yes' }))).toBe(false);
    expect(isSetupDraft(draft({ settings: { ...settings, method: 'not-a-method' } }))).toBe(false);
    expect(isSetupDraft(null)).toBe(false);
    expect(isSetupDraft({})).toBe(false);
  });
});
