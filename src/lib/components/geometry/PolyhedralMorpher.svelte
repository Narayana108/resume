<script>
  /** Hero corner polyhedral morpher. Purely decorative. */
  import { onMount } from 'svelte';

  let canvas;
  let frame = 0;
  let raf = 0;

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgba(hex, alpha) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function polygon(ctx, cx, cy, radius, sides, rotation) {
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const angle = rotation + ((Math.PI * 2) / sides) * i;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

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

    const brand = read('--brand', '#6D28D9');
    const accent = read('--accent', '#009B5A');
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.34;

    frame += 0.006;

    for (let s = 0; s < 5; s++) {
      const sides = 3 + s;
      const rotation = frame * (s % 2 ? -1 : 1) + ((Math.PI * 2) / 5) * s;
      const scale = 0.55 + 0.45 * Math.sin(frame * 0.7 + s);
      polygon(ctx, cx, cy, radius * scale, sides, rotation);
      ctx.strokeStyle = rgba(s % 2 ? accent : brand, 0.16 + 0.12 * Math.sin(frame + s));
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.16, 0, Math.PI * 2);
    ctx.fillStyle = rgba(brand, 0.22);
    ctx.fill();

    raf = requestAnimationFrame(draw);
  }

  onMount(() => {
    draw();
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