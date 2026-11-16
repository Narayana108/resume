<script>
  import { site } from '../data/resume.js';
  import PolyhedralMorpher from './geometry/PolyhedralMorpher.svelte';

  const email = `${site.email.user}@${site.email.domain}.${site.email.tld}`;

  const reduced =
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  // Must be $state: a plain `let` is not tracked in Svelte 5, so the
  // transform never re-rendered and the card never actually tilted.
  let rx = $state(0);
  let ry = $state(0);
  let tiltOn = $state(true);
  let copied = false;
  let copyTimer;

  const PORTRAITS = ['./pp-white.png', './pp-suit.png'];
  let portrait = $state(0);
  const avatarSrc = $derived(PORTRAITS[portrait]);

  function togglePortrait() {
    portrait = (portrait + 1) % PORTRAITS.length;
  }

  function onMove(e) {
    if (reduced || !tiltOn) return;
    const r = e.currentTarget.getBoundingClientRect();
    ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
    rx = -((e.clientY - r.top) / r.height - 0.5) * 9;
  }

  function onLeave() {
    rx = 0;
    ry = 0;
  }

  /**
   * Clicking the card's own surface toggles the tilt, so the motion can be
   * turned off without leaving the page. Clicks on links and buttons inside
   * the card are left alone.
   */
  function onClick(e) {
    if (e.target.closest('a, button, input, label, select, textarea')) return;
    tiltOn = !tiltOn;
    if (!tiltOn) onLeave();
  }

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(email);
      copied = true;
      clearTimeout(copyTimer);
      copyTimer = setTimeout(() => (copied = false), 1600);
    } catch {
      copied = false;
    }
  }
</script>

<section
  class="card hero"
  onpointermove={onMove}
  onpointerleave={onLeave}
  onclick={onClick}
  style:transform={tiltOn ? `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)` : 'none'}
>
  <PolyhedralMorpher />

  <button type="button" class="avatar-btn" onclick={togglePortrait} title="Switch portrait" aria-label="Switch portrait">
    <img class="avatar" src={avatarSrc} alt="" width="176" height="176" />
  </button>

  <div class="hero-body">
    <div class="tagline">
      {#each site.tagline as phrase}
        <span class="tagline-bubble">{phrase}</span>
      {/each}
    </div>

    <h1 class="hero-name">{site.name}</h1>
    <p class="hero-role">{site.role}</p>

    <dl class="facts">
      {#each site.facts as fact}
        <div class="fact">
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      {/each}
    </dl>

    <div class="hero-actions">
      <button type="button" class="btn-ghost" onclick={copyEmail} title="Copy email address">
        <span aria-hidden="true">{copied ? '✓' : '✉'}</span> {copied ? 'Copied' : email}
      </button>
      <a class="btn-ghost" href={site.github} target="_blank" rel="noopener">
        <span aria-hidden="true">⌘</span> {site.githubLabel}
      </a>
      <a class="btn-solid" href={site.resumeFile} download>
        <span aria-hidden="true">⬇</span> Download PDF
      </a>
    </div>
  </div>
</section>

<style>
  .hero {
    padding: 22px 20px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    position: relative;
    overflow: hidden;
    transform-style: preserve-3d;
    transition: transform 0.18s ease-out, box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
    will-change: transform;
  }

  .hero:hover {
    box-shadow: var(--shadow-hover), 0 0 0 4px var(--glow);
  }

  @media (min-width: 640px) {
    .hero {
      padding: 30px;
      flex-direction: row;
      align-items: flex-start;
      gap: 26px;
    }
  }

  .avatar-btn {
    padding: 0;
    border: 0;
    background: none;
    border-radius: 14px;
    cursor: pointer;
    flex: 0 0 auto;
    line-height: 0;
    display: block;
  }

  .avatar {
    width: 140px;
    height: 140px;
    object-fit: cover;
    border-radius: 14px;
    border: 1px solid var(--hairline);
    padding: 4px;
    background: var(--surface);
    flex: 0 0 auto;
    transition: transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .avatar:hover {
    transform: scale(1.04);
    box-shadow: 0 0 0 4px var(--glow);
  }

  .hero:hover {
    box-shadow: var(--shadow-hover), 0 0 0 4px var(--glow);
  }

  @media (min-width: 640px) {
    .avatar { width: 176px; height: 176px; }
  }

  .hero-body {
    min-width: 0;
    flex: 1 1 auto;
    position: relative;
    z-index: 1;
  }

  .tagline {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 14px;
  }

  .tagline-bubble {
    display: inline-flex;
    align-items: center;
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--bub-ink);
    background: var(--bub-1);
    border: 1px solid var(--bub-border);
    border-radius: 9999px;
    padding: 3px 11px;
    white-space: nowrap;
    animation: bubble-float 5s ease-in-out infinite;
  }

  .tagline-bubble:nth-child(2) { animation-delay: 0.6s; }
  .tagline-bubble:nth-child(3) { animation-delay: 1.2s; }

  @keyframes bubble-float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }

  .tagline-bubble:nth-child(2) { background: var(--bub-2); }
  .tagline-bubble:nth-child(3) { background: var(--bub-3); }

  .hero-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.015em;
    color: var(--brand);
    margin: 0 0 4px;
  }

  .hero-role {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 17px;
    color: var(--brand-strong);
    margin: 0;
  }

  .facts {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px 20px;
    margin: 16px 0 18px;
    padding: 14px 0 0;
    border-top: 1px solid var(--hairline);
  }

  @media (min-width: 560px) {
    .facts { grid-template-columns: 1fr 1fr; }
  }

  .fact {
    display: flex;
    gap: 8px;
    align-items: baseline;
    min-width: 0;
  }

  .fact dt {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--ink-faint);
    flex: 0 0 auto;
  }

  .fact dd {
    margin: 0;
    font-size: 16px;
    color: var(--ink);
    min-width: 0;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .hero-actions :global(.btn-ghost),
  .hero-actions :global(.btn-solid) {
    border-radius: 9999px;
    padding: 8px 14px;
  }
</style>