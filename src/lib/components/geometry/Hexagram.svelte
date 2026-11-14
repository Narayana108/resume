<script>
  /** Hexagram: upward triangle = full-stack delivery, downward = DevOps platform. */
  import { onMount } from 'svelte';
  import { equilibrium } from '../../data/resume.js';

  let canvas;

  function read(name, fallback) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  }

  function rgba(hex, alpha) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
  }

  function triangle(ctx, cx, cy, radius, rotation, colour, fill) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = rotation + ((Math.PI * 2) / 3) * i;
      const x = cx + Math.cos(a) * radius;
      const y = cy + Math.sin(a) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = colour;
    ctx.lineWidth = 2;
    ctx.stroke();
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

    const brand = read('--brand', '#009B5A');
    const accent = read('--accent', '#1E4D36');
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.36;

    triangle(ctx, cx, cy, radius, -Math.PI / 2, brand, rgba(brand, 0.1));
    triangle(ctx, cx, cy, radius, Math.PI / 2, accent, rgba(accent, 0.1));

    ctx.beginPath();
    ctx.arc(cx, cy, radius * 0.3, 0, Math.PI * 2);
    ctx.strokeStyle = rgba(accent, 0.45);
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  onMount(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  });
</script>

<div class="equilibrium">
  <div class="geo-canvas-wrap">
    <canvas bind:this={canvas} aria-label="Hexagram showing full-stack and DevOps capability"></canvas>
  </div>

  <div class="equilibrium-body">
    {#each equilibrium.paragraphs as paragraph}
      <p class="prose">{paragraph}</p>
    {/each}
  </div>
</div>

<style>
  .equilibrium {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    align-items: center;
  }

  @media (min-width: 768px) {
    .equilibrium {
      grid-template-columns: 300px minmax(0, 1fr);
      gap: 28px;
    }
  }

  .geo-canvas-wrap {
    position: relative;
    width: 100%;
    max-width: 300px;
    margin: 0 auto;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    border: 1px solid var(--hairline);
    background: var(--surface-subtle);
    overflow: hidden;
  }

  .geo-canvas-wrap canvas { display: block; width: 100%; height: 100%; }
</style>