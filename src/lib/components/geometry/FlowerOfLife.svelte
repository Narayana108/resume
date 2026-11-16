<script>
  /**
   * Full-viewport interactive Flower of Life.
   *
   * Ported from the sacred-geometry sanctuary's continuous-spotlight renderer.
   * The lattice is never re-stroked circle by circle: a whisper-subtle base
   * layer and a bright gold layer are each rendered once into an offscreen
   * canvas, then a soft radial light field is built per frame and used as a
   * `source-in` mask over the gold layer. The spotlight therefore glides
   * across the lattice as a continuous gradient instead of snapping from
   * circle to circle.
   *
   * Cost control, because a full-viewport gradient fill per frame is what made
   * the first port of this laggy:
   *  - only the bounding box of the live light sources is touched each frame,
   *    and it is the union of this frame's box and the last one so nothing is
   *    left behind;
   *  - the loop stops completely when the pointer is still and no ripple is
   *    alive, instead of redrawing a static lattice at 60fps forever;
   *  - the backing store is capped at 1.5x, not 2x, which is a 44% cut in pixels
   *    for a layer made of hairlines.
   *
   * Clicking the page background drops a water ripple: expanding crest rings
   * plus a refraction band that bends the lattice as the wave passes through it.
   */
  import { onMount } from 'svelte';
  import { playHarmonicChime } from '../../audio.js';

  let canvas;

  const PHI = (1 + Math.sqrt(5)) / 2;
  const TWO_PI = Math.PI * 2;
  const R = 48;
  const MAX_DPR = 1.5;
  const TRAIL_MAX = 4;
  const RIPPLE_MAX = 6;
  const SPOT_SCALE = 3.8;
  const MAX_LAG = 70;

  const state = {
    pointerX: -9999,
    pointerY: -9999,
    smoothX: -9999,
    smoothY: -9999,
    pointerActive: false,
    intensity: 0,
    trail: [],
    ripples: []
  };

  let ctx = null;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let prevDirty = null;
  let lastNow = 0;

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

  /** Hex lattice: row pitch r*sqrt(3)/2, odd rows shifted by r/2. */
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
    for (const c of [baseCanvas, glowCanvas, lightCanvas]) {
      c.width = Math.max(1, Math.floor(width * dpr));
      c.height = Math.max(1, Math.floor(height * dpr));
    }
    baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lightCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /** Render both lattice layers once. Re-run only on resize or theme change. */
  function buildLattice() {
    nodes = buildNodes();
    sizeBuffers();

    baseCtx.clearRect(0, 0, width, height);
    baseCtx.beginPath();
    for (const n of nodes) {
      baseCtx.moveTo(n.x + R, n.y);
      baseCtx.arc(n.x, n.y, R, 0, TWO_PI);
    }
    baseCtx.strokeStyle = rgba(brand, 0.055);
    baseCtx.lineWidth = 0.8;
    baseCtx.stroke();

    glowCtx.clearRect(0, 0, width, height);
    glowCtx.beginPath();
    for (const n of nodes) {
      glowCtx.moveTo(n.x + R, n.y);
      glowCtx.arc(n.x, n.y, R, 0, TWO_PI);
    }
    glowCtx.strokeStyle = rgba(highlight, 0.78);
    glowCtx.lineWidth = 1.45;
    glowCtx.stroke();

    glowCtx.beginPath();
    for (const n of nodes) {
      glowCtx.moveTo(n.x + 2.2, n.y);
      glowCtx.arc(n.x, n.y, 2.2, 0, TWO_PI);
    }
    glowCtx.fillStyle = rgba(highlight, 0.65);
    glowCtx.fill();
  }

  /** Full repaint: the base lattice, then whatever light is currently live. */
  function paintBase() {
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseCanvas, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    prevDirty = null;
  }

  function spotRadius() {
    return R * SPOT_SCALE;
  }

  /** Bounding box of everything that will be lit this frame, in CSS px. */
  function lightBox() {
    const spotR = spotRadius();
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;

    const add = (x, y, r) => {
      x0 = Math.min(x0, x - r);
      y0 = Math.min(y0, y - r);
      x1 = Math.max(x1, x + r);
      y1 = Math.max(y1, y + r);
    };

    if (state.intensity > 0.001) add(state.smoothX, state.smoothY, spotR);
    for (const tp of state.trail) add(tp.x, tp.y, spotR * (0.45 + 0.35 * tp.life));
    for (const rp of state.ripples) add(rp.x, rp.y, rp.radius + rp.band);

    if (x0 === Infinity) return null;

    x0 = Math.max(0, Math.floor(x0) - 2);
    y0 = Math.max(0, Math.floor(y0) - 2);
    x1 = Math.min(width, Math.ceil(x1) + 2);
    y1 = Math.min(height, Math.ceil(y1) + 2);

    if (x1 <= x0 || y1 <= y0) return null;
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  function union(a, b) {
    if (!a) return b;
    if (!b) return a;
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const x1 = Math.max(a.x + a.w, b.x + b.w);
    const y1 = Math.max(a.y + a.h, b.y + b.h);
    return { x, y, w: x1 - x, h: y1 - y };
  }

  /** Build the light field and mask the gold lattice with it, inside `box`. */
  function renderLight(box) {
    const spotR = spotRadius();

    lightCtx.save();
    lightCtx.beginPath();
    lightCtx.rect(box.x, box.y, box.w, box.h);
    lightCtx.clip();
    lightCtx.clearRect(box.x, box.y, box.w, box.h);
    lightCtx.globalCompositeOperation = 'source-over';

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

      for (const tp of state.trail) {
        const tr = spotR * (0.38 + 0.28 * tp.life);
        const tg = lightCtx.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, tr);
        tg.addColorStop(0, `rgba(255, 255, 255, ${(tp.life * 0.35).toFixed(3)})`);
        tg.addColorStop(1, 'rgba(255, 255, 255, 0)');
        lightCtx.fillStyle = tg;
        lightCtx.beginPath();
        lightCtx.arc(tp.x, tp.y, tr, 0, TWO_PI);
        lightCtx.fill();
      }
    }

    for (const rp of state.ripples) {
      const innerR = Math.max(0, rp.radius - rp.band);
      const outerR = rp.radius + rp.band;
      const rg = lightCtx.createRadialGradient(rp.x, rp.y, innerR, rp.x, rp.y, outerR);
      rg.addColorStop(0, 'rgba(255, 255, 255, 0)');
      rg.addColorStop(0.5, `rgba(255, 255, 255, ${Math.min(1, rp.alpha * 1.15).toFixed(3)})`);
      rg.addColorStop(1, 'rgba(255, 255, 255, 0)');
      lightCtx.fillStyle = rg;
      lightCtx.beginPath();
      lightCtx.arc(rp.x, rp.y, outerR, 0, TWO_PI);
      lightCtx.fill();
    }

    lightCtx.globalCompositeOperation = 'source-in';
    lightCtx.drawImage(
      glowCanvas,
      box.x * dpr, box.y * dpr, box.w * dpr, box.h * dpr,
      box.x, box.y, box.w, box.h
    );
    lightCtx.restore();
  }

  /** Water ripple: crest rings plus a refraction band that bends the lattice. */
  function drawRipples(box) {
    for (const rp of state.ripples) {
      const outer = rp.radius + rp.band;
      const inner = Math.max(0, rp.radius - rp.band);
      if (outer < box.x || inner > box.x + box.w) continue;
      if (outer < box.y || inner > box.y + box.h) continue;

      if (rp.alpha > 0.12 && inner > 0.5 && rp.radius < Math.min(width, height) * 0.3) {
        // Refraction: redraw the lattice through a slight radial scale so the
        // wave front visibly bends it. Only the ripple's own bounding box is
        // sampled — scaling the whole viewport through a clip is what made
        // this cost 5ms a frame.
        const bx = Math.max(0, rp.x - outer);
        const by = Math.max(0, rp.y - outer);
        const bx1 = Math.min(width, rp.x + outer);
        const by1 = Math.min(height, rp.y + outer);
        const bw = bx1 - bx;
        const bh = by1 - by;

        if (bw > 0 && bh > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(rp.x, rp.y, outer, 0, TWO_PI);
          ctx.arc(rp.x, rp.y, inner, 0, TWO_PI, true);
          ctx.clip();
          const s = 1 + rp.alpha * 0.07;
          ctx.translate(rp.x, rp.y);
          ctx.scale(s, s);
          ctx.translate(-rp.x, -rp.y);
          ctx.globalAlpha = Math.min(0.85, rp.alpha * 0.9);
          ctx.drawImage(
            baseCanvas,
            bx * dpr, by * dpr, bw * dpr, bh * dpr,
            bx, by, bw, bh
          );
          ctx.restore();
        }
      }

      for (let k = 0; k < 3; k++) {
        const rr = rp.radius - k * rp.band * 0.62;
        if (rr <= 1) continue;
        const a = rp.alpha * (0.62 - k * 0.17);
        if (a <= 0.01) continue;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rr, 0, TWO_PI);
        ctx.strokeStyle = rgba(highlight, a);
        ctx.lineWidth = 1.7 - k * 0.4;
        ctx.stroke();
      }
    }
  }

  function render(box) {
    if (!box) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(box.x, box.y, box.w, box.h);
    ctx.drawImage(
      baseCanvas,
      box.x * dpr, box.y * dpr, box.w * dpr, box.h * dpr,
      box.x, box.y, box.w, box.h
    );

    renderLight(box);
    ctx.drawImage(
      lightCanvas,
      box.x * dpr, box.y * dpr, box.w * dpr, box.h * dpr,
      box.x, box.y, box.w, box.h
    );

    drawRipples(box);
  }

  function frame(now) {
    raf = 0;

    // Frame-rate independent: a 120Hz display must not smooth twice as fast as
    // a 60Hz one, and a slow frame must not stall the light.
    const dt = lastNow ? Math.min(0.05, (now - lastNow) / 1000) : 0.016;
    lastNow = now;

    const sx0 = state.smoothX;
    const sy0 = state.smoothY;
    const i0 = state.intensity;

    // ~32ms time constant. The old per-frame 0.16 factor was a ~95ms constant,
    // which is what read as the spotlight lagging behind the cursor.
    const k = 1 - Math.exp(-dt / 0.032);

    let dx = state.pointerX - state.smoothX;
    let dy = state.pointerY - state.smoothY;
    let dist = Math.hypot(dx, dy);

    // Never trail further than MAX_LAG behind. A fast flick would otherwise
    // leave the light crawling across the page long after the cursor stopped.
    if (dist > MAX_LAG) {
      state.smoothX = state.pointerX - (dx / dist) * MAX_LAG;
      state.smoothY = state.pointerY - (dy / dist) * MAX_LAG;
      dx = state.pointerX - state.smoothX;
      dy = state.pointerY - state.smoothY;
      dist = MAX_LAG;
    }

    if (dist > 0.001) {
      state.smoothX += dx * k;
      state.smoothY += dy * k;
    }

    const ki = 1 - Math.exp(-dt / 0.07);
    state.intensity += ((state.pointerActive ? 1 : 0) - state.intensity) * ki;

    // Snap once the easing is below a visible threshold. Without this the
    // position approaches its target asymptotically and never equals it, so
    // the loop below could never conclude that nothing had changed.
    if (Math.abs(state.pointerX - state.smoothX) < 0.05) state.smoothX = state.pointerX;
    if (Math.abs(state.pointerY - state.smoothY) < 0.05) state.smoothY = state.pointerY;
    if (Math.abs((state.pointerActive ? 1 : 0) - state.intensity) < 0.002) {
      state.intensity = state.pointerActive ? 1 : 0;
    }

    for (let i = state.trail.length - 1; i >= 0; i--) {
      state.trail[i].life *= Math.pow(0.84, dt * 60);
      if (state.trail[i].life < 0.03) state.trail.splice(i, 1);
    }

    for (let i = state.ripples.length - 1; i >= 0; i--) {
      const rp = state.ripples[i];
      rp.radius += 450 * dt;
      rp.alpha *= Math.pow(0.962, dt * 60);
      if (rp.alpha < 0.015) state.ripples.splice(i, 1);
    }

    const cur = lightBox();
    const box = union(prevDirty, cur);
    render(box);
    prevDirty = cur;

    // Nothing moved and nothing is animating: the canvas already shows the
    // right image, so stop rather than redraw a static lattice at 60fps.
    const changed =
      state.smoothX !== sx0 ||
      state.smoothY !== sy0 ||
      state.intensity !== i0 ||
      state.trail.length > 0 ||
      state.ripples.length > 0;

    if (changed) {
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
      if (state.trail.length > TRAIL_MAX) state.trail.shift();
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
    state.ripples.push({ x, y, radius: 0, alpha: 0.92, band: R * 1.15 });
    if (state.ripples.length > RIPPLE_MAX) state.ripples.shift();
    playHarmonicChime(freq || 432, 1.3);
    kick();
  }

  const INTERACTIVE =
    'a, button, input, textarea, select, label, .card, .terminal, .topbar, [role="button"]';

  function onPointerDown(e) {
    if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
    spawnRipple(e.clientX, e.clientY, 432);
  }

  function resize() {
    if (!canvas) return;
    dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
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
    paintBase();
    kick();
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
