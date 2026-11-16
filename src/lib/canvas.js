/**
 * Shared canvas helpers.
 *
 * The geometry components all need to read CSS custom properties and turn a
 * hex token into an rgba() string. Both live here so the three canvases stay
 * in step and the theme lookup happens in exactly one place.
 */

/** Read a CSS custom property from <html>, with a fallback. */
export function read(name, fallback) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Expand #rgb / #rrggbb to "r, g, b" for use inside rgba(). */
export function rgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Hex token to an rgba() string at the given alpha. */
export function rgba(hex, alpha) {
  return `rgba(${rgb(hex)}, ${alpha})`;
}