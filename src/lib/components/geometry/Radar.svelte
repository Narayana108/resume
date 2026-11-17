<script>
  /**
   * Full-spectrum radar chart.
   *
   * Six axes, one per capability the role spans, each rated 0-5. The shape is
   * meant to read as broad rather than spiky: no axis is a spike and none is a
   * dent.
   *
   * The canvas is painted, not styled, so it redraws on resize and on theme
   * change. Dimensions and colours are cached rather than re-read per frame —
   * getComputedStyle and getBoundingClientRect both force work, and the click
   * glow animates for ~1s at a time.
   */
  import { onMount } from 'svelte';
  import { profile } from '../../data/resume.js';
  import { playHarmonicChime } from '../../audio.js';
  import { read, rgba } from '../../canvas.js';
  import { onThemeChange } from '../../stores/theme.js';

  let canvas;
  let glow = null;
  let hover = -1;
  let labelHits = [];
  const reduced =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;

  let w = 0;
  let h = 0;
  let dpr = 1;
  let brand = '#009B5A';
  let accent = '#1E4D36';
  let inkMuted = '#5A5A5A';
  let highlight = '#34D399';

  const axes = profile.axes;
  const max = Math.max(...axes.map((a) => a.value));

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

  function readColours() {
    brand = read('--brand', '#009B5A');
    accent = read('--accent', '#1E4D36');
    inkMuted = read('--ink-muted', '#5A5A5A');
    highlight = read('--geo-highlight', '#34D399');
  }

  function draw() {
    if (!canvas || !w) return;

    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

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
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const [x, y] = point(i, axes[i].value / max);
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
      const [x, y] = point(i, axes[i].value / max);
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
    // The laid-out boxes are recorded so the pointer can hit-test them.
    ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.textBaseline = 'middle';
    const pad = 4;
    labelHits = [];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + ((Math.PI * 2) / n) * i;
      const cos = Math.cos(a);
      const label = axes[i].label;
      const tw = ctx.measureText(label).width;
      const [x, y] = point(i, 1.18);

      let tx;
      let align;
      if (cos < -0.2) {
        align = 'right';
        tx = Math.min(w - pad, Math.max(pad + tw, x));
      } else if (cos > 0.2) {
        align = 'left';
        tx = Math.max(pad, Math.min(w - pad - tw, x));
      } else {
        align = 'center';
        tx = Math.min(w - pad - tw / 2, Math.max(pad + tw / 2, x));
      }

      const left = align === 'right' ? tx - tw : align === 'left' ? tx : tx - tw / 2;
      labelHits.push({ x: left, y: y - 7, w: tw, h: 14 });

      ctx.textAlign = align;
      if (i === hover) {
        ctx.save();
        ctx.shadowColor = rgba(highlight, 0.95);
        ctx.shadowBlur = 12;
        ctx.fillStyle = highlight;
        ctx.fillText(label, tx, y);
        ctx.restore();
      } else {
        ctx.fillStyle = inkMuted;
        ctx.fillText(label, tx, y);
      }
    }
    // Click glow: a soft hexagonal crest and wash. The radar is a hexagon,
    if (glow) {
      const p = (performance.now() - glow.start) / 1100;
      if (p >= 1) {
        glow = null;
      } else {
        const e = 1 - Math.pow(1 - p, 3); // ease-out expansion
        const a = Math.pow(1 - p, 1.6); // smooth fade
        const gr = radius * (0.5 + e * 1.15);
        const band = radius * 0.36;

        const hex = (r) => {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const ang = -Math.PI / 2 + (Math.PI / 3) * i;
            const x = cx + Math.cos(ang) * r;
            const y = cy + Math.sin(ang) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
        };

        // Crest: layered hexagon strokes, alpha peaking in the middle of the
        // band, so the ring is soft and six-sided rather than a hard circle.
        const layers = 6;
        for (let i = 0; i < layers; i++) {
          const t = i / (layers - 1);
          const rr = gr - band + band * 2 * t;
          const aa = a * Math.sin(Math.PI * t);
          hex(rr);
          ctx.strokeStyle = rgba(brand, 0.55 * aa);
          ctx.lineWidth = 2.4;
          ctx.stroke();
        }

        // Wash: a radial gradient clipped to a hexagon.
        ctx.save();
        hex(radius * 0.95);
        ctx.clip();
        const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.95);
        wash.addColorStop(0, rgba(highlight, 0.24 * a));
        wash.addColorStop(1, rgba(highlight, 0));
        ctx.fillStyle = wash;
        ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
        ctx.restore();
      }
    }
  }

  function frame() {
    draw();
    if (glow) {
      raf = requestAnimationFrame(frame);
    } else {
      raf = 0;
    }
  }

  /** Hit-test the axis labels so the hovered one can glow. */
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let next = -1;
    for (let i = 0; i < labelHits.length; i++) {
      const b = labelHits[i];
      if (mx >= b.x - 6 && mx <= b.x + b.w + 6 && my >= b.y - 5 && my <= b.y + b.h + 5) {
        next = i;
        break;
      }
    }
    if (next !== hover) {
      hover = next;
      draw();
    }
  }

  function onLeave() {
    if (hover !== -1) {
      hover = -1;
      draw();
    }
  }  function onPointerDown(e) {
    if (e.button !== 0) return;
    if (!reduced) glow = { start: performance.now() };
    playHarmonicChime(432, 1.2);
    if (!reduced && !raf) raf = requestAnimationFrame(frame);
  }

  function onResize() {
    measure();
    draw();
  }

  function onTheme() {
    readColours();
    draw();
  }

  onMount(() => {
    measure();
    readColours();
    draw();

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    window.addEventListener('resize', onResize);
    const unsubscribe = onThemeChange(onTheme);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('resize', onResize);
      unsubscribe();
    };
  });
</script>

<div class="radar">
  <h3 class="radar-title">full spectrum engineer</h3>
  <div class="geo-canvas-wrap">
    <canvas
      bind:this={canvas}
      role="img"
      aria-label="Radar chart of full-spectrum engineering capability, rated out of five"
    ></canvas>
  </div>
</div>

<style>
  .radar {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .radar-title {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--brand);
    text-align: center;
    margin: 0;
  }

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