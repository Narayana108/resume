<script>
  /**
   * Hero polyhedral shape morpher.
   *
   * Ported from the sacred-geometry sanctuary: vertices and sacred chords
   * interpolate across Tetrahedron, Cube, Octahedron, Merkaba, Icosahedron and
   * Dodecahedron, so the form dissolves through the space between solids rather
   * than cutting between them. Purely decorative.
   */
  import { onMount } from 'svelte';

  let canvas;
  let raf = 0;

  const CYCLE = 3.2; // seconds per form
  const HOLD = 0.35; // fraction of the cycle spent resting on a form

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgba(hex, alpha) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (t) => t * t * (3 - 2 * t);

  /** `count` vertices evenly spaced on a circle of radius `rad`. */
  function vCircle(count, rad, offset = -Math.PI / 2) {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const a = offset + (i * 2 * Math.PI) / count;
      arr.push({ x: rad * Math.cos(a), y: rad * Math.sin(a) });
    }
    return arr;
  }

  /**
   * Every form is 13 vertices in the same order — centre, 6 outer, 6 inner — so
   * morphing is a straight per-index interpolation with no correspondence
   * search. The inner ring radii are the classical ratios: 1/2, 1/√3, 1/φ.
   */
  function buildForms(R) {
    const outer = vCircle(6, R, -Math.PI / 2);
    const inner = (k, off) => vCircle(6, R * k, -Math.PI / 2 + off);
    const ring = (ptsRev) => [{ x: 0, y: 0 }, ...outer, ...ptsRev];

    return [
      { name: 'Tetrahedron (Fire)', pts: ring(inner(0.48, Math.PI / 6)) },
      { name: 'Hexahedron / Cube', pts: ring(inner(0.52, Math.PI / 6)) },
      { name: 'Octahedron (Air)', pts: ring(inner(0.34, 0)) },
      { name: 'Merkaba Star', pts: ring(inner(0.577, Math.PI / 6)) },
      { name: 'Icosahedron (φ)', pts: ring(inner(0.618, 0)) },
      { name: 'Dodecahedron (12)', pts: ring(inner(0.82, Math.PI / 6)) }
    ];
  }

  // Outer ring 1..6, inner ring 7..12, centre 0.
  const EDGES = [
    [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 1],
    [1, 3], [3, 5], [5, 1], [2, 4], [4, 6], [6, 2],
    [7, 8], [8, 9], [9, 10], [10, 11], [11, 12], [12, 7],
    [1, 7], [2, 7], [2, 8], [3, 8], [3, 9], [4, 9],
    [4, 10], [5, 10], [5, 11], [6, 11], [6, 12], [1, 12],
    [0, 1], [0, 3], [0, 5], [0, 2], [0, 4], [0, 6]
  ];

  function draw() {
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(1, Math.round(rect.height));

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const brand = read('--brand', '#009B5A');
    const accent = read('--accent', '#1E4D36');
    const highlight = read('--geo-highlight', '#34D399');

    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) * 0.34;
    const forms = buildForms(R);

    const time = performance.now() / 1000;
    const total = time / CYCLE;
    const idxA = Math.floor(total) % forms.length;
    const idxB = (idxA + 1) % forms.length;
    const raw = total - Math.floor(total);
    const t = raw < HOLD ? 0 : smoothstep((raw - HOLD) / (1 - HOLD));

    const rot = time * 0.16;
    const cosR = Math.cos(rot);
    const sinR = Math.sin(rot);

    const pts = forms[idxA].pts.map((pa, i) => {
      const pb = forms[idxB].pts[i];
      const lx = lerp(pa.x, pb.x, t);
      const ly = lerp(pa.y, pb.y, t);
      return { x: cx + (lx * cosR - ly * sinR), y: cy + (lx * sinR + ly * cosR) };
    });

    // Containment circle.
    ctx.beginPath();
    ctx.arc(cx, cy, R * 1.06, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(accent, 0.12);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Chords: inner ring gold, outer ring brand, spokes soft.
    for (let e = 0; e < EDGES.length; e++) {
      const [a, b] = EDGES[e];
      ctx.beginPath();
      ctx.moveTo(pts[a].x, pts[a].y);
      ctx.lineTo(pts[b].x, pts[b].y);
      if (e >= 6 && e < 12) {
        ctx.strokeStyle = rgba(highlight, 0.55);
        ctx.lineWidth = 1.8;
      } else if (e < 6) {
        ctx.strokeStyle = rgba(brand, 0.5);
        ctx.lineWidth = 1.5;
      } else {
        ctx.strokeStyle = rgba(accent, 0.22);
        ctx.lineWidth = 1;
      }
      ctx.stroke();
    }

    // Vertices.
    for (let i = 0; i < pts.length; i++) {
      ctx.beginPath();
      ctx.arc(pts[i].x, pts[i].y, i === 0 ? 3.4 : 2.2, 0, Math.PI * 2);
      ctx.fillStyle = rgba(i <= 6 ? highlight : brand, 0.75);
      ctx.fill();
    }

    raf = requestAnimationFrame(draw);
  }

  onMount(() => {
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  });
</script>

<canvas bind:this={canvas} class="hero-geo" aria-hidden="true"></canvas>

<style>
  .hero-geo {
    position: absolute;
    top: -34px;
    right: -34px;
    width: 200px;
    height: 200px;
    opacity: 0.55;
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 900px) {
    .hero-geo { width: 130px; height: 130px; top: -18px; right: -18px; }
  }
</style>