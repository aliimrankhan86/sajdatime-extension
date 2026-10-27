import type { AlertSound } from '../settings/types';
import type { Sect } from './types';

export type AlertMessageType =
  | 'play-beep'
  | 'play-adhan-sunni'
  | 'play-adhan-shia'
  | 'stop'
  | 'test-alert';

const MESSAGE_TYPES: readonly AlertMessageType[] = [
  'play-beep',
  'play-adhan-sunni',
  'play-adhan-shia',
  'stop',
  'test-alert',
];

/**
 * The one gate every runtime message passes (SECURITY.md R4). Only an extension page
 * whose URL is under the given prefix may talk to this context, and only a message that
 * is exactly `{ type }` with a known type gets through. A field of the message is never
 * used as a URL, file path, alarm name prefix or HTML.
 */
export function parseAlertMessage(
  message: unknown,
  sender: chrome.runtime.MessageSender | undefined,
  selfId: string,
  allowedUrlPrefix: string,
): AlertMessageType | null {
  if (!sender) return null;
  if (sender.id !== selfId) return null;
  if (!sender.url || !sender.url.startsWith(allowedUrlPrefix)) return null;
  if (typeof message !== 'object' || message === null || Array.isArray(message)) return null;
  const keys = Object.keys(message);
  if (keys.length !== 1 || keys[0] !== 'type') return null;
  const type = (message as { type?: unknown }).type;
  if (typeof type !== 'string') return null;
  if (!MESSAGE_TYPES.includes(type as AlertMessageType)) return null;
  return type as AlertMessageType;
}

/** The fixed message type for a chosen sound, or null for silent. */
export function soundMessageType(sound: AlertSound, sect: Sect): AlertMessageType | null {
  if (sound === 'beep') return 'play-beep';
  if (sound === 'adhan') return sect === 'shia' ? 'play-adhan-shia' : 'play-adhan-sunni';
  return null;
}
