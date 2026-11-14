/**
 * Theme state: palette (indigo | emerald) and mode (light | dark).
 * Persists to localStorage and mirrors onto <html data-palette / data-mode>
 * so the CSS token blocks in app.css apply.
 */
import { writable, get } from 'svelte/store';

const PALETTES = ['indigo', 'emerald'];
const MODES = ['light', 'dark'];
const STORAGE_KEY = 'resume-theme';

function readStored() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return {
      palette: PALETTES.includes(parsed.palette) ? parsed.palette : null,
      mode: MODES.includes(parsed.mode) ? parsed.mode : null
    };
  } catch {
    return null;
  }
}

const stored = readStored();

export const palette = writable(stored?.palette ?? 'emerald');
export const mode = writable(stored?.mode ?? 'light');
export const view = writable('interactive');

function persist() {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ palette: get(palette), mode: get(mode) })
    );
  } catch {
    /* storage unavailable — non-fatal */
  }
}

export function setPalette(value) {
  if (!PALETTES.includes(value)) return;
  palette.set(value);
  persist();
}

export function setMode(value) {
  if (!MODES.includes(value)) return;
  mode.set(value);
  persist();
}

export function toggleMode() {
  setMode(get(mode) === 'dark' ? 'light' : 'dark');
}

/**
 * The Clean Resume sheet is a light-only document: entering it forces the
 * light theme, and the mode toggle is disabled while it is open.
 */
export function setView(next) {
  if (next === 'ats') setMode('light');
  view.set(next);
}

/** Apply the current theme to <html> so the CSS token blocks take effect. */
export function applyTheme(pal, md) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-palette', pal);
  root.setAttribute('data-mode', md);
}