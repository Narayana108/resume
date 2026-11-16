/**
 * Pythagorean harmonic chimes.
 *
 * Two oscillators per note — a sine at the fundamental and a triangle at a
 * perfect fifth above — through a short exponential envelope. The fifth is what
 * makes the chime read as a bell rather than a beep.
 *
 * The AudioContext is created lazily on the first sound, which is always inside
 * a click handler, so it starts in the `running` state and never trips the
 * browser autoplay policy.
 */

let ctx = null;
let enabled = true;

function ensure() {
  if (ctx) return ctx;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  ctx = new AudioContextClass();
  return ctx;
}

export function isAudioEnabled() {
  return enabled;
}

export function setAudioEnabled(next) {
  enabled = Boolean(next);
  if (enabled) {
    const c = ensure();
    if (c && c.state === 'suspended') c.resume().catch(() => {});
  }
  return enabled;
}

export function toggleAudio() {
  return setAudioEnabled(!enabled);
}

/**
 * Play one chime. `freq` is the fundamental in Hz, `duration` in seconds.
 * Silent when audio is disabled or the browser has no Web Audio.
 */
export function playHarmonicChime(freq = 432, duration = 1.4) {
  if (!enabled) return;
  const c = ensure();
  if (!c) return;

  if (c.state === 'suspended') c.resume().catch(() => {});

  try {
    const now = c.currentTime;
    const osc1 = c.createOscillator();
    const osc2 = c.createOscillator();
    const gain = c.createGain();

    osc1.type = 'sine';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);
    osc2.frequency.setValueAtTime(freq * 1.5, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.11, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(c.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    /* audio unavailable — non-fatal */
  }
}
