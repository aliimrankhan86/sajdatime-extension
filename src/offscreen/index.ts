import { parseAlertMessage } from '../core/messages';

let audio: HTMLAudioElement | null = null;
// Every sound gets its own id. A timer or event reports the end only if it is still the
// current sound, so a replaced beep's 1.2 second timer can never report a newer sound.
let soundId = 0;

function ended(id: number): void {
  if (id !== soundId) return;
  void chrome.runtime.sendMessage({ type: 'sound-ended' }).catch(() => {});
}

// Stop the current sound without reporting its end. A replaced sound must not send
// sound-ended, or the popup flips back to Play while the new sound is still going.
function stop(): void {
  soundId += 1;
  if (audio) {
    audio.pause();
    audio.currentTime = 0;
    audio = null;
  }
}

function playFile(url: string): void {
  stop();
  const id = ++soundId;
  const next = new Audio(url);
  audio = next;
  next.addEventListener('ended', () => ended(id));
  void next.play().catch(() => {
    if (id === soundId) audio = null;
    ended(id);
  });
}

function playBeep(): void {
  stop();
  const id = ++soundId;
  const context = new AudioContext();
  const master = context.createGain();
  master.connect(context.destination);
  // Two short notes under 1.5 seconds, faded in and out so it stays gentle.
  master.gain.setValueAtTime(0.0001, context.currentTime);
  master.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.03);
  master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.9);

  const first = context.createOscillator();
  first.type = 'sine';
  first.frequency.value = 660;
  first.connect(master);
  first.start(context.currentTime);
  first.stop(context.currentTime + 0.4);

  const second = context.createOscillator();
  second.type = 'sine';
  second.frequency.value = 880;
  second.connect(master);
  second.start(context.currentTime + 0.35);
  second.stop(context.currentTime + 0.95);

  setTimeout(() => {
    void context.close();
    ended(id);
  }, 1200);
}

// The offscreen document answers only the worker. The popup talks to the worker, which
// forwards here, so a popup broadcast never doubles a sound. R4: the type is the only
// field read, and the sound is chosen from this fixed map, never from the message.
chrome.runtime.onMessage.addListener((message, sender) => {
  const type = parseAlertMessage(
    message,
    sender,
    chrome.runtime.id,
    chrome.runtime.getURL('background/index.js'),
  );
  if (!type) return;
  switch (type) {
    case 'play-beep':
      playBeep();
      break;
    case 'play-adhan-sunni':
      playFile(chrome.runtime.getURL('audio/adhan.ogg'));
      break;
    case 'play-adhan-shia':
      playFile(chrome.runtime.getURL('audio/adhan_shia.ogg'));
      break;
    case 'stop':
      // A real user stop reports the end, unlike the internal stop() before a new sound.
      stop();
      ended(soundId);
      break;
    default:
      break;
  }
});
