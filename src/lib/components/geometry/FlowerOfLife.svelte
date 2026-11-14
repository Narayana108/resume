<script>
  /**
   * Full-viewport flower-of-life background with a Metatron's Cube that locks
   * to the lattice.
   *
   * Performance shape:
   *  - The static lattice is rendered once into an offscreen canvas and blitted
   *    per frame, so a frame costs one drawImage plus a handful of nearby
   *    circles instead of a full re-stroke of every circle.
   *  - Theme colours are cached and only re-read when <html> changes palette or
   *    mode, not per frame (getComputedStyle forces a style recalc).
   *  - The cube is a single prebuilt Path2D stroked once, not 78 beginPath calls.
   *  - The cube eases toward the nearest lattice point instead of teleporting
   *    between them, so it stays locked to the grid but moves continuously.
   *  - The rAF loop stops when nothing is moving.
   */
  import { onMount } from 'svelte';

  let canvas;

  const RADIUS = 46;
  const DX = RADIUS * Math.sqrt(3);
  const DY = RADIUS * 1.5;
  const INFLUENCE = 190;
  const EASE = 0.22;
  const FADE = 0.14;

  let raf = 0;
  let running = false;
  let dpr = 1;
  let w = 0;
  let h = 0;

  let brand = '#009B5A';
  let accent = '#1E4D36';
  let staticLayer = null;
  let cubePath = null;

  // Eased cube position, and the lattice point it is easing toward.
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

  /** Metatron's Cube: centre, 6 inner, 6 outer, every pair connected. */
  function buildCube() {
    const pts = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push([Math.cos(a) * RADIUS, Math.sin(a) * RADIUS]);
    }
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      pts.push([Math.cos(a) * RADIUS * Math.sqrt(3), Math.sin(a) * RADIUS * Math.sqrt(3)]);
    }

    const path = new Path2D();
    for (let p = 0; p < pts.length; p++) {
      for (let q = p + 1; q < pts.length; q++) {
        path.moveTo(pts[p][0], pts[p][1]);
        path.lineTo(pts[q][0], pts[q][1]);
      }
    }
    return path;
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

    // Only the cells that can be lit by the cube need re-stroking.
    const reach = Math.ceil(INFLUENCE / DX) + 1;
    const rowReach = Math.ceil(INFLUENCE / DY) + 1;
    const baseRow = Math.round(pos.y / DY);
    const baseCol = Math.round(pos.x / DX);

    for (let row = baseRow - rowReach; row <= baseRow + rowReach; row++) {
      const offset = row % 2 ? DX / 2 : 0;
      for (let col = baseCol - reach; col <= baseCol + reach; col++) {
        const x = col * DX + offset;
        const y = row * DY;
        const dist = Math.hypot(x - pos.x, y - pos.y);
        const near = Math.max(0, 1 - dist / INFLUENCE) * alpha;
        if (near <= 0.02) continue;

        ctx.beginPath();
        ctx.arc(x, y, RADIUS, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(accent, near * 0.35);
        ctx.lineWidth = 1 + near * 1.1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, RADIUS * 0.5, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(accent, near * 0.22);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    if (cubePath) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.strokeStyle = rgba(accent, 0.3 * alpha);
      ctx.lineWidth = 1;
      ctx.stroke(cubePath);
      ctx.restore();
    }
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
      (!target || (pos.x === target.x && pos.y === target.y)) &&
      alpha === alphaTarget;

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
    buildStatic();
    draw();
  }

  onMount(() => {
    cubePath = buildCube();
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