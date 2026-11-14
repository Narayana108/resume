<script>
  /**
   * Full-viewport flower-of-life background.
   *
   * The static layer is the 19-circle seed lattice tiled across the viewport.
   * The dynamic layer is the Seed + Lotus Halo motif — twin containment rings,
   * a 12-circle lotus halo, and the individual ring under the cursor lit gold —
   * which eases to the nearest lattice centre as the pointer moves.
   *
   * Performance shape:
   *  - The lattice is rendered once into an offscreen canvas and blitted per
   *    frame, so a frame costs one drawImage plus the motif, not a full
   *    re-stroke of every circle.
   *  - Theme colours are cached and re-read only when <html> changes palette or
   *    mode, never per frame (getComputedStyle forces a style recalc).
   *  - The rAF loop stops when nothing is moving.
   */
  import { onMount } from 'svelte';

  let canvas;

  const RADIUS = 46;
  const DX = RADIUS * Math.sqrt(3);
  const DY = RADIUS * 1.5;

  const EASE = 0.22;
  const FADE = 0.14;

  let raf = 0;
  let running = false;
  let dpr = 1;
  let w = 0;
  let h = 0;

  let brand = '#009B5A';
  let accent = '#1E4D36';
  let highlight = '#34D399';
  let staticLayer = null;

  // Eased motif centre, and the lattice point it is easing toward.
  const pos = { x: 0, y: 0 };
  let target = null;
  let alpha = 0;
  let alphaTarget = 0;

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }

  /**
   * Nearest flower-of-life circle centre to a point.
   *
   * Odd rows are offset by half a cell, so rounding the row first and then the
   * column can pick a centre that is not actually the closest. Check the three
   * candidate rows around the point and keep the true nearest.
   */
  function snap(x, y) {
    const base = Math.round(y / DY);
    let best = null;
    let bestDist = Infinity;

    for (let row = base - 1; row <= base + 1; row++) {
      const offset = row % 2 ? DX / 2 : 0;
      const col = Math.round((x - offset) / DX);
      const px = col * DX + offset;
      const py = row * DY;
      const dist = (px - x) ** 2 + (py - y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: px, y: py };
      }
    }

    return best;
  }

  /** Render the static lattice once into an offscreen canvas. */
  function buildStatic() {
    const layer = document.createElement('canvas');
    layer.width = Math.max(1, Math.round(w * dpr));
    layer.height = Math.max(1, Math.round(h * dpr));

    const ctx = layer.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.strokeStyle = rgba(brand, 0.1);
    ctx.lineWidth = 1;

    const cols = Math.ceil(w / DX) + 2;
    const rows = Math.ceil(h / DY) + 2;

    ctx.beginPath();
    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * DX + (row % 2 ? DX / 2 : 0);
        const y = row * DY;
        ctx.moveTo(x + RADIUS, y);
        ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
      }
    }
    ctx.stroke();

    staticLayer = layer;
  }

  function draw() {
    if (!canvas || !staticLayer) return;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(staticLayer, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (alpha <= 0.001) return;

    const { x, y } = pos;

    // Twin containment rings.
    ctx.beginPath();
    ctx.arc(x, y, RADIUS * 3.0, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(accent, 0.3 * alpha);
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, RADIUS * 3.16, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(highlight, 0.34 * alpha);
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.setLineDash([]);

    // Lotus halo: 12 petals around the seed, alternating accent and highlight.
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      const px = x + RADIUS * 2.35 * Math.cos(a);
      const py = y + RADIUS * 2.35 * Math.sin(a);
      ctx.beginPath();
      ctx.arc(px, py, RADIUS * 0.65, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(i % 2 === 0 ? accent : highlight, 0.26 * alpha);
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    // The individual ring under the cursor, lit.
    ctx.beginPath();
    ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(highlight, 0.9 * alpha);
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = rgba(highlight, 0.95 * alpha);
    ctx.fill();
  }

  function frame() {
    raf = 0;

    if (target) {
      pos.x += (target.x - pos.x) * EASE;
      pos.y += (target.y - pos.y) * EASE;
      if (Math.abs(target.x - pos.x) < 0.05 && Math.abs(target.y - pos.y) < 0.05) {
        pos.x = target.x;
        pos.y = target.y;
      }
    }
    alpha += (alphaTarget - alpha) * FADE;
    if (Math.abs(alphaTarget - alpha) < 0.002) alpha = alphaTarget;

    draw();

    const settled =
      (!target || (pos.x === target.x && pos.y === target.y)) && alpha === alphaTarget;

    if (!settled) {
      raf = requestAnimationFrame(frame);
    } else {
      running = false;
    }
  }

  function kick() {
    if (!running) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
  }

  function onMove(e) {
    const point = snap(e.clientX, e.clientY);
    if (!target) {
      // First entry: start on the lattice point so there is no fly-in.
      pos.x = point.x;
      pos.y = point.y;
    }
    target = point;
    alphaTarget = 1;
    kick();
  }

  function onLeave() {
    target = null;
    alphaTarget = 0;
    kick();
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    buildStatic();
    draw();
  }

  function retheme() {
    brand = read('--brand', '#009B5A');
    accent = read('--accent', '#1E4D36');
    highlight = read('--geo-highlight', '#34D399');
    buildStatic();
    draw();
  }

  onMount(() => {
    retheme();
    resize();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('resize', resize);

    // Re-read the palette tokens only when the theme actually changes.
    const observer = new MutationObserver(retheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-palette', 'data-mode']
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="geo-bg" aria-hidden="true"></canvas>