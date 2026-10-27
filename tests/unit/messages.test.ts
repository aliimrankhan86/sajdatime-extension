import { describe, expect, it } from 'vitest';
import { parseAlertMessage, soundMessageType } from '../../src/core/messages';

const SELF = 'abcdefghijklmnopabcdefghijklmnop';
const BASE = `chrome-extension://${SELF}/`;
const SENDER = { id: SELF, url: `${BASE}popup/index.html` };

describe('parseAlertMessage', () => {
  it('accepts a known type from an extension page', () => {
    expect(parseAlertMessage({ type: 'play-beep' }, SENDER, SELF, BASE)).toBe('play-beep');
  });

  it('ignores a message from another extension', () => {
    expect(parseAlertMessage({ type: 'play-beep' }, { ...SENDER, id: 'other' }, SELF, BASE)).toBeNull();
  });

  it('ignores a message from a web page', () => {
    expect(
      parseAlertMessage({ type: 'play-beep' }, { ...SENDER, url: 'https://evil.example.com/x' }, SELF, BASE),
    ).toBeNull();
  });

  it('does not accept a lookalike extension URL', () => {
    expect(
      parseAlertMessage(
        { type: 'play-beep' },
        { ...SENDER, url: `chrome-extension://${SELF}evil/index.html` },
        SELF,
        BASE,
      ),
    ).toBeNull();
  });

  it('ignores an unknown type', () => {
    expect(parseAlertMessage({ type: 'play-evil' }, SENDER, SELF, BASE)).toBeNull();
  });

  it('ignores a known type with extra fields', () => {
    expect(
      parseAlertMessage({ type: 'play-beep', url: 'https://evil.example.com/x' }, SENDER, SELF, BASE),
    ).toBeNull();
  });

  it('ignores anything that is not an object with exactly a type', () => {
    expect(parseAlertMessage('play-beep', SENDER, SELF, BASE)).toBeNull();
    expect(parseAlertMessage(null, SENDER, SELF, BASE)).toBeNull();
    expect(parseAlertMessage({}, SENDER, SELF, BASE)).toBeNull();
  });
});

describe('soundMessageType', () => {
  it('maps the three sounds to the fixed message types', () => {
    expect(soundMessageType('beep', 'sunni')).toBe('play-beep');
    expect(soundMessageType('adhan', 'sunni')).toBe('play-adhan-sunni');
    expect(soundMessageType('adhan', 'shia')).toBe('play-adhan-shia');
    expect(soundMessageType('silent', 'sunni')).toBeNull();
  });
});
