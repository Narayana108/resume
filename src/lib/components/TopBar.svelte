<script>
  import { onMount } from 'svelte';
  import { site } from '../data/resume.js';
  import { palette, mode, view, setPalette, setMode, setView, toggleMode } from '../stores/theme.js';
  import { isAudioEnabled, toggleAudio } from '../audio.js';
  import Merkaba from './geometry/Merkaba.svelte';

  let audioOn = $state(isAudioEnabled());
  let progress = $state(0);

  function onAudioToggle() {
    audioOn = toggleAudio();
  }

  /**
   * The brand link points at #top. Handle it in JS so the jump is a smooth
   * glide rather than an instant hash change, and so no history entry is left
   * behind by the anchor.
   */
  function onBrandClick(e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onMount(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  });

  const palettes = [
    { id: 'indigo', label: 'Purple', title: 'Purple and indigo' },
    { id: 'emerald', label: 'Emerald', title: 'Emerald and forest green' }
  ];
</script>

<header class="topbar" class:is-scrolled={progress > 0}>
  <div class="scroll-progress" style:transform={`scaleX(${progress})`} aria-hidden="true"></div>
  <div class="topbar-inner">
    <a class="brand" href="#top" onclick={onBrandClick}>
      <span class="brand-mark" aria-hidden="true"><Merkaba /></span>
      <span class="brand-text">
        <span class="brand-name">{site.name}</span>
        <span class="brand-role">{site.role}</span>
      </span>
    </a>

    <nav class="view-switch" aria-label="Resume view">
      <button
        type="button"
        class="view-tab"
        class:is-active={$view === 'interactive'}
        aria-pressed={$view === 'interactive'}
        onclick={() => setView('interactive')}
      >
        ✦ Interactive Resume
      </button>
      <button
        type="button"
        class="view-tab"
        class:is-active={$view === 'ats'}
        aria-pressed={$view === 'ats'}
        onclick={() => setView('ats')}
      >
        ▤ Clean ATS Resume
      </button>
    </nav>

    <div class="topbar-actions">
      <div class="palette-switch" role="group" aria-label="Colour theme">
        {#each palettes as p}
          <button
            type="button"
            class="chip"
            class:is-active={$palette === p.id}
            title={p.title}
            onclick={() => setPalette(p.id)}
          >
            {p.label}
          </button>
        {/each}
      </div>

      <button
        type="button"
        class="btn-ghost"
        title="Switch between light and dark"
        onclick={toggleMode}
        disabled={$view === 'ats'}
      >
        <span aria-hidden="true">{$mode === 'dark' ? '☾' : '☀'}</span>
        <span>{$mode === 'dark' ? 'Dark' : 'Light'}</span>
      </button>

      <button
        type="button"
        class="btn-ghost"
        title={audioOn ? 'Mute harmonic chimes' : 'Unmute harmonic chimes'}
        aria-pressed={audioOn}
        onclick={onAudioToggle}
      >
        <span aria-hidden="true">{audioOn ? '\u{1F50A}' : '\u{1F507}'}</span>
        <span>{audioOn ? 'Sound' : 'Muted'}</span>
      </button>

      <a
        class="btn-solid"
        id="print-btn"
        href={site.resumeFile}
        download
        title="Download the resume as a PDF"
      >
        ⬇ PDF
      </a>
    </div>
  </div>
</header>