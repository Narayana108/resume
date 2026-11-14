<script>
  import { site } from '../data/resume.js';
  import { palette, mode, view, setPalette, setMode, setView, toggleMode } from '../stores/theme.js';

  const palettes = [
    { id: 'indigo', label: 'Purple', title: 'Purple and indigo' },
    { id: 'emerald', label: 'Emerald', title: 'Emerald and forest green' }
  ];
</script>

<header class="topbar">
  <div class="topbar-inner">
    <a class="brand" href="#top">
      <span class="brand-mark" aria-hidden="true">N</span>
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
        ▤ Clean Resume
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