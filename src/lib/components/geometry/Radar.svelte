<script>
  /**
   * Full-spectrum radar chart.
   *
   * Six axes, one per capability the role spans. The shape is deliberately
   * near-regular: the point is that no axis is a spike and none is a dent —
   * the profile is broad rather than deep in one place.
   */
  import { onMount } from 'svelte';
  import { profile } from '../../data/resume.js';

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
    const inkMuted = read('--ink-muted', '#5A5A5A');

    const axes = profile.axes;
    const n = axes.length;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.30;
    const rings = 4;

    // Point on axis i at fraction t of the radius. Axis 0 points straight up.
    const point = (i, t) => {
      const a = -Math.PI / 2 + ((Math.PI * 2) / n) * i;
      return [cx + Math.cos(a) * radius * t, cy + Math.sin(a) * radius * t];
    };

    // Grid rings.
    for (let r = 1; r <= rings; r++) {
      const t = r / rings;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const [x, y] = point(i, t);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = rgba(accent, r === rings ? 0.3 : 0.13);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Spokes.
    for (let i = 0; i < n; i++) {
      const [x, y] = point(i, 1);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = rgba(accent, 0.13);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Data polygon.
    const values = axes.map((a) => a.value);
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const [x, y] = point(i, values[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = rgba(brand, 0.16);
    ctx.fill();
    ctx.strokeStyle = brand;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertices.
    for (let i = 0; i < n; i++) {
      const [x, y] = point(i, values[i]);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = brand;
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Axis labels. Align away from the centre so long labels grow inward
    // rather than off the canvas, then clamp the whole text box to the padding.
    ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = inkMuted;
    ctx.textBaseline = 'middle';
    const pad = 4;
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + ((Math.PI * 2) / n) * i;
      const cos = Math.cos(a);
      const label = axes[i].label;
      const tw = ctx.measureText(label).width;
      const [x, y] = point(i, 1.18);

      let tx;
      if (cos < -0.2) {
        ctx.textAlign = 'right';
        tx = Math.min(w - pad, Math.max(pad + tw, x));
      } else if (cos > 0.2) {
        ctx.textAlign = 'left';
        tx = Math.max(pad, Math.min(w - pad - tw, x));
      } else {
        ctx.textAlign = 'center';
        tx = Math.min(w - pad - tw / 2, Math.max(pad + tw / 2, x));
      }
      ctx.fillText(label, tx, y);
    }
  }

  onMount(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  });
</script>

<div class="geo-canvas-wrap">
  <canvas bind:this={canvas} aria-label="Radar chart of full-spectrum engineering capability"></canvas>
</div>

<style>
  .geo-canvas-wrap {
    position: relative;
    width: 100%;
    max-width: 340px;
    margin: 0 auto;
    aspect-ratio: 1 / 1;
    border-radius: 12px;
    border: 1px solid var(--hairline);
    background: var(--surface-subtle);
    overflow: hidden;
  }

  .geo-canvas-wrap canvas { display: block; width: 100%; height: 100%; }
</style>
