<script>
  import { tick, onMount } from 'svelte';
  import { site, profile } from '../data/resume.js';
  import { mode, view, setPalette, setMode, setView } from '../stores/theme.js';

  let output = $state([]);
  let input = $state('');
  let termEl = $state(null);
  let inputEl = $state(null);
  let collapsed = $state(true);

  /** A line is a list of coloured segments: [text, class] pairs. */
  function pushSegs(segs) {
    output.push({ segs: segs.map(([t, c]) => ({ t, c: c || 't-val' })) });
    // A long session would otherwise grow the array and the DOM without bound.
    if (output.length > 200) output.splice(0, output.length - 200);
    scroll();
  }

  function scroll() {
    if (termEl) termEl.scrollTop = termEl.scrollHeight;
  }

  const commands = {
    help() {
      const rows = [
        ['help', 'show this message'],
        ['whoami', 'identity and summary'],
        ['profile', 'profile text'],
        ['contact', 'contact details and links'],
        ['theme <p>', 'set palette: indigo | emerald'],
        ['mode', 'toggle light / dark'],
        ['view', 'toggle interactive studio / ATS sheet'],
        ['clear', 'clear the terminal']
      ];
      pushSegs([['Available commands:', 't-key']]);
      for (const [cmd, desc] of rows) {
        pushSegs([
          ['  ', 't-val'],
          [cmd.padEnd(14), 't-cmd'],
          [desc, 't-dim']
        ]);
      }
    },

    whoami() {
      pushSegs([[site.name, 't-key']]);
      pushSegs([[site.role, 't-val']]);
      pushSegs([[site.tagline.join(' · '), 't-link']]);
      pushSegs([[site.location, 't-dim']]);
    },

    profile() {
      for (const p of profile.points) {
        pushSegs([[`${p.label}: `, 't-key'], [p.text, 't-val']]);
      }
      pushSegs([
        ['', 't-val'],
        [profile.closing.lead + ' ', 't-dim'],
        [profile.closing.emphasis, 't-ok'],
        [profile.closing.tail, 't-dim']
      ]);
    },

    contact() {
      const email = `${site.email.user}@${site.email.domain}.${site.email.tld}`;
      pushSegs([['Email:    ', 't-dim'], [email, 't-link']]);
      pushSegs([['GitHub:   ', 't-dim'], [site.github, 't-link']]);
      pushSegs([['Website:  ', 't-dim'], [site.website, 't-link']]);
    },

    theme(arg) {
      if (arg === 'indigo' || arg === 'emerald') {
        setPalette(arg);
        pushSegs([['palette set to ', 't-dim'], [arg, 't-ok']]);
      } else {
        pushSegs([['usage: ', 't-dim'], ['theme <indigo|emerald>', 't-cmd']]);
      }
    },

    mode() {
      setMode($mode === 'dark' ? 'light' : 'dark');
      pushSegs([['mode: ', 't-dim'], [$mode, 't-ok']]);
    },

    view() {
      setView($view === 'ats' ? 'interactive' : 'ats');
      pushSegs([['view: ', 't-dim'], [$view, 't-ok']]);
    },

    clear() {
      output = [];
    }
  };

  /**
   * Commands that change the view resize the document, and the browser clamps
   * scrollY to the new maximum. Coming back the other way leaves the viewport
   * stranded wherever the clamp put it, which reads as the page jumping.
   *
   * Anchor the terminal to its current viewport position across the update so
   * the thing being typed into stays put, whatever the document does.
   */
  async function anchored(fn) {
    const el = document.querySelector('.terminal');
    if (!el) {
      fn();
      return;
    }

    const before = el.getBoundingClientRect().top;
    fn();
    await tick();

    const settle = () => {
      const drift = el.getBoundingClientRect().top - before;
      if (Math.abs(drift) > 1) window.scrollTo({ top: window.scrollY + drift, behavior: 'instant' });
    };

    settle();
    requestAnimationFrame(settle);
  }

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    pushSegs([['❯ ', 't-prompt'], [cmd, 't-cmd']]);

    const [head, ...rest] = cmd.toLowerCase().split(/\s+/);
    const fn = commands[head];

    if (!fn) {
      pushSegs([[`command not found: ${head}`, 't-warn'], [' — try "help"', 't-dim']]);
      return;
    }

    if (head === 'mode' || head === 'view') {
      anchored(fn);
    } else {
      fn(rest[0]);
    }
  }

  function submit(e) {
    e.preventDefault();
    run(input);
    input = '';
  }

  $effect(() => {
    if (output.length && termEl) termEl.scrollTop = termEl.scrollHeight;
  });

  // Press "/" anywhere outside a field to jump into the terminal.
  onMount(() => {
    const onKey = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target;
      if (el instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      e.preventDefault();
      if (inputEl) inputEl.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const quick = ['help', 'contact', 'clear'];

  pushSegs([[site.name, 't-key'], [' — resume shell', 't-dim']]);
  pushSegs([['Type ', 't-dim'], ['"help"', 't-cmd'], [' for available commands.', 't-dim']]);
</script>

<section class="terminal" aria-label="Interactive terminal">
  <div class="terminal-bar">
    <div class="terminal-dots" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <span class="terminal-title">narayana@resume:~ (zsh)</span>
    <button
      type="button"
      class="term-toggle"
      class:is-collapsed={collapsed}
      onclick={() => (collapsed = !collapsed)}
      aria-expanded={!collapsed}
      title={collapsed ? 'Open terminal' : 'Collapse terminal'}
    >
      {collapsed ? '▾' : '▴'}
    </button>
    <div class="terminal-quick">
      {#each quick as cmd}
        <button
          type="button"
          class="term-chip"
          onclick={() => {
            collapsed = false;
            run(cmd);
          }}
        >
          {cmd}
        </button>
      {/each}
    </div>
  </div>

  <div class="terminal-body" hidden={collapsed}>
    <div bind:this={termEl} class="term-out" role="log" aria-live="polite">
      {#each output as line}
        <div class="term-line">
          {#each line.segs as seg}<span class={seg.c}>{seg.t}</span>{/each}
        </div>
      {/each}
    </div>

    <form class="term-form" onsubmit={submit}>
      <label class="term-prompt" for="term-in" aria-hidden="true">❯</label>
      <input
        id="term-in"
        aria-label="Terminal command"
        class="term-in"
        type="text"
        spellcheck="false"
        placeholder="Type a command (help, contact, theme, clear)..."
        bind:value={input}
        bind:this={inputEl}
      />
      <button type="submit" class="term-run">Execute</button>
    </form>
  </div>
</section>

<style>
  .terminal {
    margin-top: 32px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--hairline-strong);
    background: var(--term-bg);
    box-shadow: var(--shadow);
    transition: box-shadow 0.3s ease, border-color 0.3s ease;
  }

  /* The terminal lights up when it is being used: hover, or focus anywhere
     inside it (the input, a quick chip, the Execute button). */
  .terminal:hover,
  .terminal:focus-within {
    border-color: var(--brand);
    box-shadow: var(--shadow), 0 0 0 4px var(--glow), 0 0 26px -6px var(--glow);
  }

  @keyframes term-breathe {
    0%, 100% {
      box-shadow: var(--shadow), 0 0 0 4px var(--glow), 0 0 22px -8px var(--glow);
    }
    50% {
      box-shadow: var(--shadow), 0 0 0 5px var(--glow), 0 0 34px -4px var(--glow);
    }
  }

  .terminal:focus-within {
    animation: term-breathe 2.8s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .terminal:focus-within { animation: none; }
  }

  .terminal-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    background: var(--term-bar);
    border-bottom: 1px solid var(--term-line);
    flex-wrap: wrap;
  }

  .terminal-dots { display: flex; gap: 6px; flex: 0 0 auto; }
  .terminal-dots span { width: 10px; height: 10px; border-radius: 9999px; display: block; }
  .terminal-dots span:nth-child(1) { background: #f87171; }
  .terminal-dots span:nth-child(2) { background: #fbbf24; }
  .terminal-dots span:nth-child(3) { background: #34d399; }

  .terminal-title {
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11.5px;
    color: var(--term-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .term-toggle {
    appearance: none;
    border: 1px solid var(--term-line);
    background: var(--term-chip);
    color: var(--term-ink);
    font-size: 10px;
    line-height: 1;
    padding: 3px 7px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  @keyframes term-nudge {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(3px); }
  }

  .term-toggle.is-collapsed {
    color: var(--term-ok);
    animation: term-nudge 1.6s ease-in-out infinite;
  }

  @media (prefers-reduced-motion: reduce) {
    .term-toggle.is-collapsed { animation: none; }
  }

  .term-toggle:hover {
    background: var(--term-chip-hover);
    color: var(--term-ink);
  }

  .terminal-quick { display: flex; gap: 5px; margin-left: auto; flex-wrap: wrap; }

  .term-chip {
    border: 1px solid var(--term-line);
    background: var(--term-chip);
    color: var(--term-ink);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .term-chip:hover { background: var(--term-chip-hover); color: var(--term-ink); }

  .terminal-body { padding: 14px; background: var(--term-bg); }

  .term-out {
    height: 210px;
    overflow-y: auto;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    line-height: 1.65;
    color: var(--term-ink);
    padding-right: 6px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .term-line { margin: 0; }

  /* Segment colours — all driven by the active palette's terminal tokens. */
  .t-prompt { color: var(--term-ok); font-weight: 700; }
  .t-cmd { color: var(--term-accent); font-weight: 600; }
  .t-key { color: var(--term-key); font-weight: 700; }
  .t-val { color: var(--term-ink); }
  .t-ok { color: var(--term-ok); font-weight: 600; }
  .t-link { color: var(--term-link); text-decoration: underline; text-underline-offset: 2px; }
  .t-dim { color: var(--term-dim); }
  .t-warn { color: var(--term-warn); }

  .term-form {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid var(--term-line);
  }

  .term-prompt {
    color: var(--term-ok);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 13px;
    font-weight: 700;
    flex: 0 0 auto;
  }

  .term-in {
    flex: 1 1 auto;
    min-width: 0;
    background: transparent;
    border: 0;
    color: var(--term-ink);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    padding: 4px 0;
  }

  .term-in:focus { outline: none; }
  .term-in::placeholder { color: var(--term-dim); }

  .term-run {
    flex: 0 0 auto;
    border: 1px solid var(--term-line);
    background: var(--term-run-bg);
    color: var(--term-run-ink);
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .term-run:hover { background: var(--term-run-bg-hover); }
</style>