<script>
  /**
   * Full-viewport interactive Flower of Life.
   *
   * Ported from the sacred-geometry sanctuary's continuous-spotlight renderer.
   * The lattice is never re-stroked circle by circle: a whisper-subtle base
   * layer and a bright gold layer are each rendered once into an offscreen
   * canvas, then a soft radial light field is built per frame and used as a
   * `source-in` mask over the gold layer. The spotlight therefore glides across
   * the lattice as a continuous gradient instead of snapping from circle to
   * circle, which is what keeps it smooth at any pointer speed.
   *
   * Clicking the page background spawns a harmonic ripple and a chime.
   */
  import { onMount } from 'svelte';
  import { playHarmonicChime } from '../../audio.js';

  let canvas;

  const PHI = (1 + Math.sqrt(5)) / 2;
  const TWO_PI = Math.PI * 2;
  const RADIUS_BY_SCALE = { 1: 76, 2: 60, 3: 48, 4: 38 };
  const SCALE = 3;
  const R = RADIUS_BY_SCALE[SCALE];

  const state = {
    pointerX: -9999,
    pointerY: -9999,
    smoothX: -9999,
    smoothY: -9999,
    pointerActive: false,
    intensity: 0,
    trail: [],
    ripples: [],
    time: 0
  };

  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;

  let baseCanvas = null;
  let baseCtx = null;
  let glowCanvas = null;
  let glowCtx = null;
  let lightCanvas = null;
  let lightCtx = null;

  let brand = '#009B5A';
  let highlight = '#34D399';

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgb(hex) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
  }

  function rgba(hex, a) {
    return `rgba(${rgb(hex)}, ${a})`;
  }

  /**
   * Hex lattice of circle centres.
   *
   * Row spacing is r*sqrt(3)/2 and odd rows are shifted by r/2, which is the
   * packing that makes the circles overlap into the Flower of Life rather than
   * sit in a grid.
   */
  function buildNodes() {
    const cx = width * 0.5;
    const cy = height * 0.5;
    const dx = R;
    const dy = R * (Math.sqrt(3) / 2);
    const halfCols = Math.ceil(Math.ceil(width / dx) * 0.5) + 2;
    const halfRows = Math.ceil(Math.ceil(height / dy) * 0.5) + 2;

    const nodes = [];
    for (let row = -halfRows; row <= halfRows; row++) {
      const y = cy + row * dy;
      const xOffset = Math.abs(row) % 2 === 1 ? dx * 0.5 : 0;
      for (let col = -halfCols; col <= halfCols; col++) {
        const x = cx + col * dx + xOffset;
        if (x >= -R * 1.5 && x <= width + R * 1.5 && y >= -R * 1.5 && y <= height + R * 1.5) {
          nodes.push({ x, y });
        }
      }
    }
    return nodes;
  }

  let nodes = [];

  function sizeBuffers() {
    [baseCanvas, glowCanvas, lightCanvas].forEach((c) => {
      c.width = Math.max(1, Math.floor(width * dpr));
      c.height = Math.max(1, Math.floor(height * dpr));
    });
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Render both lattice layers once. Re-run only on resize or theme change. */
  function buildLattice() {
    nodes = buildNodes();
    sizeBuffers();

    // 1. Whisper-subtle base lattice.
    baseCtx.clearRect(0, 0, width, height);
    baseCtx.beginPath();
    for (const n of nodes) {
      baseCtx.moveTo(n.x + R, n.y);
      baseCtx.arc(n.x, n.y, R, 0, TWO_PI);
    }
    baseCtx.strokeStyle = rgba(brand, 0.055);
    baseCtx.lineWidth = 0.8;
    baseCtx.stroke();

    // 2. Illuminated lattice, drawn bright and masked down per frame.
    glowCtx.clearRect(0, 0, width, height);
    glowCtx.beginPath();
    for (const n of nodes) {
      glowCtx.moveTo(n.x + R, n.y);
      glowCtx.arc(n.x, n.y, R, 0, TWO_PI);
    }
    glowCtx.strokeStyle = rgba(highlight, 0.78);
    glowCtx.lineWidth = 1.45;
    glowCtx.stroke();

    // Centre dot on each circle, for richness where the mask is strongest.
    glowCtx.beginPath();
    for (const n of nodes) {
      glowCtx.moveTo(n.x + 2.2, n.y);
      glowCtx.arc(n.x, n.y, 2.2, 0, TWO_PI);
    }
    glowCtx.fillStyle = rgba(highlight, 0.65);
    glowCtx.fill();
  }

  /** Build the continuous light field, mask the gold lattice with it, composite. */
  function drawLattice() {
    lightCtx.clearRect(0, 0, width, height);
    lightCtx.globalCompositeOperation = 'source-over';

    const spotR = R * 3.8;

    if (state.intensity > 0.001) {
      const g = lightCtx.createRadialGradient(
        state.smoothX, state.smoothY, 0,
        state.smoothX, state.smoothY, spotR
      );
      g.addColorStop(0, `rgba(255, 255, 255, ${0.95 * state.intensity})`);
      g.addColorStop(0.38, `rgba(255, 255, 255, ${0.58 * state.intensity})`);
      g.addColorStop(0.72, `rgba(255, 255, 255, ${0.18 * state.intensity})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      lightCtx.fillStyle = g;
      lightCtx.beginPath();
      lightCtx.arc(state.smoothX, state.smoothY, spotR, 0, TWO_PI);
      lightCtx.fill();

      // Afterglow trail.
      for (const tp of state.trail) {
        const tr = spotR * (0.45 + 0.35 * tp.life);
        const tg = lightCtx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, tr);
        tg.addColorStop(0, `rgba(255, 255, 255, ${(tp.life * 0.35).toFixed(3)})`);
        tg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        lightCtx.fillStyle = tg;
        lightCtx.beginPath();
        lightCtx.arc(tp.x, tp.y, tr, 0, TWO_PI);
        lightCtx.fill();
      }
    }

    // Expanding click ripples, as soft bands in the same mask.
    for (const rp of state.ripples) {
      const bandWidth = R * 1.25;
      const innerR = Math.max(0, rp.radius - bandWidth);
      const outerR = rp.radius + bandWidth;
      const rg = lightCtx.createRadialGradient(rp.x, rp.y, innerR, rp.x, rp.y, outerR);
      rg.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rg.addColorStop(0.5, `rgba(255, 255, 255, ${Math.min(1, rp.alpha * 1.15).toFixed(3)})`);
      rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
      lightCtx.fillStyle = rg;
      lightCtx.beginPath();
      lightCtx.arc(rp.x, rp.y, outerR, 0, TWO_PI);
      lightCtx.fill();
    }

    // Mask the gold lattice with the light field.
    lightCtx.globalCompositeOperation = 'source-in';
    lightCtx.drawImage(glowCanvas, 0, 0, width, height);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvas, 0, 0);
    ctx.drawImage(lightCanvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawRipples() {
    for (const rp of state.ripples) {
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius, 0, TWO_PI);
      ctx.strokeStyle = rgba(highlight, rp.alpha);
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius / PHI, 0, TWO_PI);
      ctx.strokeStyle = rgba(brand, rp.alpha * 0.75);
      ctx.lineWidth = 1.3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.radius / (PHI * PHI), 0, TWO_PI);
      ctx.strokeStyle = rgba(highlight, rp.alpha * 0.5);
      ctx.lineWidth = 0.9;
      ctx.stroke();
    }
  }

  function frame() {
    raf = 0;

    state.time += 0.016;

    // Exponential spring smoothing so the spotlight glides.
    state.smoothX += (state.pointerX - state.smoothX) * 0.16;
    state.smoothY += (state.pointerY - state.smoothY) * 0.16;
    state.intensity += ((state.pointerActive ? 1 : 0) - state.intensity) * 0.12;

    for (let i = state.trail.length - 1; i >= 0; i--) {
      state.trail[i].life *= 0.91;
      if (state.trail[i].life < 0.03) state.trail.splice(i, 1);
    }

    for (let i = state.ripples.length - 1; i >= 0; i--) {
      const rp = state.ripples[i];
      rp.radius += 5;
      rp.alpha *= 0.968;
      if (rp.alpha < 0.02) state.ripples.splice(i, 1);
    }

    drawLattice();
    drawRipples();

    const moving =
      state.pointerActive ||
      state.intensity > 0.001 ||
      state.trail.length > 0 ||
      state.ripples.length > 0;

    if (moving) {
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
    const dist = Math.hypot(e.clientX - state.pointerX, e.clientY - state.pointerY);
    if (dist > 14 && state.pointerActive) {
      state.trail.push({ x: state.smoothX, y: state.smoothY, life: 0.75 });
      if (state.trail.length > 10) state.trail.shift();
    }
    state.pointerX = e.clientX;
    state.pointerY = e.clientY;
    if (!state.pointerActive) {
      state.smoothX = e.clientX;
      state.smoothY = e.clientY;
    }
    state.pointerActive = true;
    kick();
  }

  function onLeave() {
    state.pointerActive = false;
    kick();
  }

  function spawnRipple(x, y, freq) {
    state.ripples.push({ x, y, radius: 8, alpha: 0.88 });
    playHarmonicChime(freq || 432, 1.3);
    kick();
  }

  const INTERACTIVE = 'a, button, input, textarea, select, label, .card, .terminal, .topbar, [role="button"]';

  function onPointerDown(e) {
    if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
    spawnRipple(e.clientX, e.clientY, 432);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    retheme();
  }

  function retheme() {
    if (!ctx) return;
    brand = read('--brand', '#009B5A');
    highlight = read('--geo-highlight', '#34D399');
    buildLattice();
    drawLattice();
    drawRipples();
  }

  onMount(() => {
    baseCanvas = document.createElement('canvas');
    baseCtx = baseCanvas.getContext('2d');
    glowCanvas = document.createElement('canvas');
    glowCtx = glowCanvas.getContext('2d');
    lightCanvas = document.createElement('canvas');
    lightCtx = lightCanvas.getContext('2d');

    resize();

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    window.addEventListener('resize', resize);

    const observer = new MutationObserver(retheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-palette', 'data-mode']
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
      window.removeEventListener('resize', resize);
    };
  });
</script>

<canvas bind:this={canvas} class="geo-bg" aria-hidden="true"></canvas>
