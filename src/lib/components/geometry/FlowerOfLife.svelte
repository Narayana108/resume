<script>
  /** Full-viewport flower-of-life background with a Metatron's Cube on hover. */
  import { onMount } from 'svelte';

  let canvas;
  let raf = 0;
  let mouse = { x: -9999, y: -9999, active: false };
  let needsDraw = true;

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgba(hex, alpha) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function metatron(ctx, cx, cy, r, colour) {
    const pts = [[0, 0]];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    for (let j = 0; j < 6; j++) {
      const b = (Math.PI / 3) * j;
      pts.push([Math.cos(b) * r * Math.sqrt(3), Math.sin(b) * r * Math.sqrt(3)]);
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = rgba(colour, 0.3);
    ctx.lineWidth = 1;
    for (let p = 0; p < pts.length; p++) {
      for (let q = p + 1; q < pts.length; q++) {
        ctx.beginPath();
        ctx.moveTo(pts[p][0], pts[p][1]);
        ctx.lineTo(pts[q][0], pts[q][1]);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  /**
   * Nearest flower-of-life circle centre to a point.
   *
   * Odd rows are offset by half a cell, so rounding the row first and then the
   * column can pick a centre that is not actually the closest. Check the three
   * candidate rows around the point and keep the true nearest.
   */
  function snap(x, y, dx, dy) {
    const base = Math.round(y / dy);
    let best = null;
    let bestDist = Infinity;

    for (let row = base - 1; row <= base + 1; row++) {
      const offset = row % 2 ? dx / 2 : 0;
      const col = Math.round((x - offset) / dx);
      const px = col * dx + offset;
      const py = row * dy;
      const dist = (px - x) ** 2 + (py - y) ** 2;
      if (dist < bestDist) {
        bestDist = dist;
        best = { x: px, y: py };
      }
    }

    return best;
  }

  function draw() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const brand = read('--brand', '#009B5A');
    const accent = read('--accent', '#1E4D36');
    const radius = 46;
    const dx = radius * Math.sqrt(3);
    const dy = radius * 1.5;
    const cols = Math.ceil(w / dx) + 2;
    const rows = Math.ceil(h / dy) + 2;

    // Lock the cube to the nearest flower-of-life circle centre so it can
    // never sit off-grid or drift asymmetrically between points.
    const snapped = mouse.active ? snap(mouse.x, mouse.y, dx, dy) : null;
    const cx = snapped ? snapped.x : -9999;
    const cy = snapped ? snapped.y : -9999;

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const x = col * dx + (row % 2 ? dx / 2 : 0);
        const y = row * dy;
        const dist = Math.hypot(x - cx, y - cy);
        const near = Math.max(0, 1 - dist / 190);

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = rgba(near > 0.05 ? accent : brand, 0.1 + near * 0.35);
        ctx.lineWidth = 1 + near * 1.1;
        ctx.stroke();

        if (near > 0.02) {
          ctx.beginPath();
          ctx.arc(x, y, radius * 0.5, 0, Math.PI * 2);
          ctx.strokeStyle = rgba(accent, near * 0.22);
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    if (mouse.active) metatron(ctx, cx, cy, radius, accent);
  }

  function onMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
    needsDraw = true;
  }

  function onLeave() {
    mouse.active = false;
    needsDraw = true;
  }

  onMount(() => {
    const loop = () => {
      if (needsDraw) {
        draw();
        needsDraw = false;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('scroll', onLeave, { passive: true });
    window.addEventListener('resize', () => { needsDraw = true; });

    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  });
</script>

<canvas bind:this={canvas} class="geo-bg" aria-hidden="true"></canvas>