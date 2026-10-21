import { usePrefs } from './prefs';

/** Kinds of game feedback. Deliberately few and subtle: no reward fanfare. */
export type FeedbackKind = 'spend' | 'drain' | 'end';

const VIBRATION: Record<FeedbackKind, number | number[]> = {
  spend: 12,
  drain: 8,
  end: [30, 60, 30],
};

/** Short tones: [frequency Hz, duration ms]. */
const TONES: Record<FeedbackKind, Array<[number, number]>> = {
  spend: [[520, 70]],
  drain: [[300, 50]],
  end: [
    [440, 90],
    [330, 140],
  ],
};

let audio: AudioContext | null = null;

function playTones(kind: FeedbackKind) {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audio ??= new Ctx();
    let t = audio.currentTime;
    for (const [freq, ms] of TONES[kind]) {
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.08, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + ms / 1000);
      osc.connect(gain).connect(audio.destination);
      osc.start(t);
      osc.stop(t + ms / 1000 + 0.02);
      t += ms / 1000;
    }
  } catch {
    // Audio is optional; never let it break the game.
  }
}

export function canVibrate(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

/** Play feedback according to the player's sound/vibration settings. */
export function feedback(kind: FeedbackKind) {
  const { sound, vibration } = usePrefs.getState();
  if (vibration && canVibrate()) {
    try {
      navigator.vibrate(VIBRATION[kind]);
    } catch {
      // Ignore: some browsers block vibration without a user gesture.
    }
  }
  if (sound) playTones(kind);
}
