<script>
  /**
   * Compact 3D Merkaba for the brand mark.
   *
   * Same projection as the hero morpher: two interlocking tetrahedra (8
   * vertices, 12 edges), rotated on three axes and perspective-projected, with
   * edges shaded by depth. Deliberately tiny and cheap — it redraws a 30px
   * canvas, and stops entirely under prefers-reduced-motion.
   */
  import { onMount } from 'svelte';
  import { read, rgba } from '../../canvas.js';

  let canvas;

  const TAU = Math.PI * 2;

  // Two interlocking tetrahedra
  const VERTS = [
    [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1],
    [-1, -1, -1], [1, 1, -1], [1, -1, 1], [-1, 1, 1]
  ].map((v) => {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
  });

  const EDGES = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
    [4, 5], [4, 6], [4, 7], [5, 6], [5, 7], [6, 7]
  ];

  function project(v, radius, cx, cy, rx, ry, rz) {
    let [x, y, z] = v;

    const cosX = Math.cos(rx), sinX = Math.sin(rx);
    const y1 = y * cosX - z * sinX;
    const z1 = y * sinX + z * cosX;
    y = y1; z = z1;

    const cosY = Math.cos(ry), sinY = Math.sin(ry);
    const x2 = x * cosY + z * sinY;
    const z2 = -x * sinY + z * cosY;
    x = x2; z = z2;

    const cosZ = Math.cos(rz), sinZ = Math.sin(rz);
    const x3 = x * cosZ - y * sinZ;
    const y3 = x * sinZ + y * cosZ;

    const p = 3.2 / (3.2 - z * 0.85);
    return { x: cx + x3 * radius * p, y: cy + y3 * radius * p, z, scale: p };
  }

  onMount(() => {
    const ctx = canvas.getContext('2d');
    const rot = { x: 0.42, y: 0.65, z: 0.15 };
    let raf = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function measure() {
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
      const brand = read('--brand', '#009B5A');
      const highlight = read('--geo-highlight', '#34D399');

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;
      const radius = Math.min(w, h) * 0.36;

      const pts = VERTS.map((v) => project(v, radius, cx, cy, rot.x, rot.y, rot.z));

      for (let i = 0; i < EDGES.length; i++) {
        const a = pts[EDGES[i][0]];
        const b = pts[EDGES[i][1]];
        const depth = (a.z + b.z) * 0.5;
        const alpha = Math.max(0.25, Math.min(0.95, 0.6 + depth * 0.35));

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(highlight, alpha);
        ctx.lineWidth = 1.1 * ((a.scale + b.scale) * 0.5);
        ctx.stroke();
      }

      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1.1, 1.9 * p.scale), 0, TAU);
        ctx.fillStyle = rgba(brand, 0.9);
        ctx.fill();
      }
    }

    function frame() {
      if (!reduced) {
        rot.y += 0.011;
        rot.x += 0.006;
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

<canvas bind:this={canvas} class="brand-merkaba" aria-hidden="true"></canvas>

<style>
  .brand-merkaba {
    display: block;
    width: 30px;
    height: 30px;
    flex: 0 0 auto;
  }
</style>