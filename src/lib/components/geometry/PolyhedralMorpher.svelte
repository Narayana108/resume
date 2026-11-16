<script>
  /**
   * Hero 3D sacred solid.
   *
   * Ported from the sacred-geometry sanctuary's Top-Right station: the six
   * Platonic / Merkaba forms are real 3D vertex sets, rotated on three axes and
   * perspective-projected, and the form morphs into the next one by
   * interpolating vertex positions rather than cross-fading. Edges are shaded by
   * average depth so the back of the solid reads darker than the front.
   *
   * Purely decorative — pointer-events are off so it never intercepts the hero
   * links or text selection.
   */
  import { onMount } from 'svelte';

  let canvas;

  const PHI = (1 + Math.sqrt(5)) / 2;
  const TWO_PI = Math.PI * 2;
  const MORPH_STEP = 0.04;
  const HOLD_MS = 4200;

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function normalize(verts) {
    return verts.map((v) => {
      const len = Math.hypot(v[0], v[1], v[2]) || 1;
      return [v[0] / len, v[1] / len, v[2] / len];
    });
  }

  /** Edges are the vertex pairs whose distance matches the solid's edge length. */
  function edgesByLength(raw, target, tolerance) {
    const edges = [];
    for (let i = 0; i < raw.length; i++) {
      for (let j = i + 1; j < raw.length; j++) {
        const d = Math.hypot(
          raw[i][0] - raw[j][0],
          raw[i][1] - raw[j][1],
          raw[i][2] - raw[j][2]
        );
        if (Math.abs(d - target) < tolerance) edges.push([i, j]);
      }
    }
    return edges;
  }

  function buildCatalog() {
    const tetraRaw = [
      [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
    ];
    const tetraE = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];

    const merkabaRaw = [
      [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1],
      [-1, -1, -1], [1, 1, -1], [1, -1, 1], [-1, 1, 1]
    ];
    const merkabaE = [
      [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
      [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7]
    ];

    const cubeRaw = [
      [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
    ];
    const cubeE = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7]
    ];

    const octaRaw = [
      [1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]
    ];
    const octaE = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2]
    ];

    const icosaRaw = [
      [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
      [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
      [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1]
    ];

    const invPhi = 1 / PHI;
    const dodecaRaw = [
      [-1, -1, -1], [-1, -1, 1], [-1, 1, -1], [-1, 1, 1],
      [1, -1, -1], [1, -1, 1], [1, 1, -1], [1, 1, 1],
      [0, -invPhi, -PHI], [0, -invPhi, PHI], [0, invPhi, -PHI], [0, invPhi, PHI],
      [-invPhi, -PHI, 0], [-invPhi, PHI, 0], [invPhi, -PHI, 0], [invPhi, PHI, 0],
      [-PHI, 0, -invPhi], [PHI, 0, -invPhi], [-PHI, 0, invPhi], [PHI, 0, invPhi]
    ];

    return {
      tetrahedron: { v: normalize(tetraRaw), e: tetraE, label: 'Tetrahedron' },
      merkaba: { v: normalize(merkabaRaw), e: merkabaE, label: 'Merkaba' },
      cube: { v: normalize(cubeRaw), e: cubeE, label: 'Hexahedron' },
      octahedron: { v: normalize(octaRaw), e: octaE, label: 'Octahedron' },
      icosahedron: {
        v: normalize(icosaRaw),
        e: edgesByLength(icosaRaw, 2, 0.15),
        label: 'Icosahedron'
      },
      dodecahedron: {
        v: normalize(dodecaRaw),
        e: edgesByLength(dodecaRaw, 2 / PHI, 0.15),
        label: 'Dodecahedron'
      }
    };
  }

  const ORDER = ['merkaba', 'icosahedron', 'dodecahedron', 'octahedron', 'cube', 'tetrahedron'];

  function project3D(vertex, radius, cx, cy, rx, ry, rz) {
    let [x, y, z] = vertex;

    const cosX = Math.cos(rx);
    const sinX = Math.sin(rx);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    y = y1;
    z = z1;

    const cosY = Math.cos(ry);
    const sinY = Math.sin(ry);
    const x2 = x * cosY + z * sinY;
    const z2 = -x * sinY + z * cosY;
    x = x2;
    z = z2;

    const cosZ = Math.cos(rz);
    const sinZ = Math.sin(rz);
    const x3 = x * cosZ - y * sinZ;
    const y3 = x * sinZ + y * cosZ;
    x = x3;
    y = y3;

    const perspective = 3.2 / (3.2 - z * 0.85);
    return {
      x: cx + x * radius * perspective,
      y: cy + y * radius * perspective,
      z,
      scale: perspective
    };
  }

  onMount(() => {
    const catalog = buildCatalog();

    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;

    const rot = { x: 0.42, y: 0.65, z: 0.15 };
    let current = 'merkaba';
    let previous = 'merkaba';
    let morph = 1;
    let lastAdvance = performance.now();

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function measure() {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
    }

    function draw() {
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const brand = read('--brand', '#009B5A');
      const accent = read('--accent', '#1E4D36');
      const highlight = read('--geo-highlight', '#34D399');

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.34;

      const cur = catalog[current] || catalog.merkaba;
      const prev = catalog[previous] || cur;
      const t = Math.min(1, morph);

      const projected = cur.v.map((v, idx) => {
        const pv = prev.v[idx % prev.v.length];
        const ix = pv[0] + (v[0] - pv[0]) * t;
        const iy = pv[1] + (v[1] - pv[1]) * t;
        const iz = pv[2] + (v[2] - pv[2]) * t;
        return project3D([ix, iy, iz], radius, cx, cy, rot.x, rot.y, rot.z);
      });

      // Containment circle.
      ctx.beginPath();
      ctx.arc(cx, cy, radius * 1.12, 0, TWO_PI);
      ctx.strokeStyle = rgba(accent, 0.1);
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i < cur.e.length; i++) {
        const p1 = projected[cur.e[i][0]];
        const p2 = projected[cur.e[i][1]];
        if (!p1 || !p2) continue;

        const avgZ = (p1.z + p2.z) * 0.5;
        const depthAlpha = Math.max(0.18, Math.min(0.92, 0.55 + avgZ * 0.35));

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = rgba(i % 2 === 0 ? highlight : brand, depthAlpha);
        ctx.lineWidth = 1.65 * ((p1.scale + p2.scale) * 0.5);
        ctx.stroke();
      }

      for (const p of projected) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(2, 3.6 * p.scale), 0, TWO_PI);
        ctx.fillStyle = rgba(highlight, 0.88);
        ctx.fill();
      }
    }

    function frame(now) {
      raf = 0;

      if (!reduced) {
        rot.y += 0.007;
        rot.x += 0.004;
        rot.z += 0.002;
        if (morph < 1) morph = Math.min(1, morph + MORPH_STEP);

        if (now - lastAdvance > HOLD_MS) {
          lastAdvance = now;
          previous = current;
          current = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
          morph = 0;
        }
      }

      draw();

      if (!reduced) raf = requestAnimationFrame(frame);
    }

    measure();
    window.addEventListener('resize', measure);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  });
</script>

<canvas bind:this={canvas} class="hero-geo" aria-hidden="true"></canvas>

<style>
  /* Inside the card, not hanging off it: the hero clips overflow, so a
     negative offset cuts the solid in half. */
  .hero-geo {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 180px;
    height: 180px;
    opacity: 0.6;
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 640px) {
    .hero-geo { width: 100px; height: 100px; top: 6px; right: 6px; opacity: 0.5; }
  }
</style>
