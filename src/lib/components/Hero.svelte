<script>
  import { site } from '../data/resume.js';
  import PolyhedralMorpher from './geometry/PolyhedralMorpher.svelte';
  import { mode } from '../stores/theme.js';

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
  const SUIT = 1;

  // Follow the theme by default: pp_suit on the dark theme, pp_white on light.
  // A click sets a manual override that sticks until the page is reloaded.
  let override = $state(null);
  const themed = $derived($mode === 'dark' ? SUIT : 0);
  const portrait = $derived(override ?? themed);
  const avatarSrc = $derived(PORTRAITS[portrait]);

  function togglePortrait() {
    override = portrait === 0 ? 1 : 0;
  }

  // Selecting a theme switches the portrait with it, even after a manual
  // toggle, so the pairing pp_white/light and pp_suit/dark always holds.
  let prevMode = $mode;
  $effect(() => {
    if ($mode !== prevMode) {
      prevMode = $mode;
      override = null;
    }
  });

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
        <svg class="gh-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path
            d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.89 3.633 17.89c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"
          />
        </svg>
        {site.githubLabel}
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
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 16px;
    font-weight: 600;
    letter-spacing: 0.01em;
    color: var(--bub-ink);
    background: var(--bub-1);
    border: 1px solid var(--bub-border);
    border-radius: 9999px;
    padding: 3px 11px;
    white-space: nowrap;
    transition: box-shadow 0.3s ease, filter 0.3s ease, border-color 0.3s ease;
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

  /* Subtle shine on hover: a soft halo plus a lift in luminance.
     Deliberately no transform here — bubble-float owns transform, and a
     running animation overrides a class-level transform. */
  .tagline-bubble:hover {
    filter: brightness(1.08);
    border-color: var(--brand);
    box-shadow: 0 0 0 3px var(--glow), 0 6px 18px -8px var(--glow);
  }

  .hero-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 600;
    line-height: 1.22;
    letter-spacing: -0.015em;
    color: var(--brand);
    margin: 0 0 6px;
    animation: name-reveal 0.9s cubic-bezier(0.22, 1, 0.36, 1) both;
  }

  /* The name wipes in from the left on load. */
  @keyframes name-reveal {
    from {
      clip-path: inset(0 100% 0 0);
      opacity: 0;
    }
    to {
      clip-path: inset(0 0 0 0);
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .hero-name { animation: none; }
  }

  .hero-role {
    font-family: 'Cormorant Garamond', Georgia, serif;
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

  .gh-icon {
    width: 15px;
    height: 15px;
    flex: 0 0 auto;
  }

  .hero-actions :global(.btn-ghost),
  .hero-actions :global(.btn-solid) {
    border-radius: 9999px;
    padding: 8px 14px;
  }
</style>