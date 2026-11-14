<script>
  import { site, profile, skills, experience, education } from '../data/resume.js';
  import { palette, mode, view, setPalette, setMode, setView } from '../stores/theme.js';

  let output = $state([]);
  let input = $state('');
  let termEl = $state(null);

  function push(lines, cls = 'term-ok') {
    for (const line of lines) output.push({ text: line, cls });
    if (termEl) termEl.scrollTop = termEl.scrollHeight;
  }

  const commands = {
    help() {
      push(
        [
          'Available commands:',
          '  help          show this message',
          '  whoami        identity and summary',
          '  profile       profile text',
          '  skills        technical skills inventory',
          '  experience    employment timeline',
          '  education     education and certifications',
          '  contact       contact details and links',
          '  theme <p>     set palette: indigo | emerald',
          '  mode          toggle light / dark',
          '  view          toggle interactive studio / ATS sheet',
          '  clear         clear the terminal'
        ],
        'term-ok'
      );
    },

    whoami() {
      push([site.name, site.role, site.tagline.join(' · '), 'India (GMT+5:30)'], 'term-ok');
    },

    profile() {
      const lines = [];
      for (const p of profile.points) lines.push(`${p.label}: ${p.text}`);
      lines.push('', `${profile.closing.lead} ${profile.closing.emphasis}, ${profile.closing.tail}`);
      push(lines, 'term-ok');
    },

    skills() {
      push(skills.map((s) => `${s.label}: ${s.text}`), 'term-ok');
    },

    experience() {
      push(experience.map((j) => `${j.title} — ${j.date}`), 'term-ok');
    },

    education() {
      push(education.map((e) => `${e.title} — ${e.meta} (${e.date})`), 'term-ok');
    },

    contact() {
      const email = `${site.email.user}@${site.email.domain}.${site.email.tld}`;
      push([`Email:    ${email}`, `GitHub:   ${site.github}`, `Website:  ${site.website}`], 'term-ok');
    },

    theme(arg) {
      if (arg === 'indigo' || arg === 'emerald') {
        setPalette(arg);
        push(`palette set to ${arg}`, 'term-ok');
      } else {
        push('usage: theme <indigo|emerald>', 'term-warn');
      }
    },

    mode() {
      setMode($mode === 'dark' ? 'light' : 'dark');
      push(`mode: ${$mode}`, 'term-ok');
    },

    view() {
      setView($view === 'ats' ? 'interactive' : 'ats');
      push(`view: ${$view}`, 'term-ok');
    },

    clear() {
      output = [];
    }
  };

  function run(raw) {
    const cmd = raw.trim();
    if (!cmd) return;

    output.push({ text: `❯ ${cmd}`, cls: 'term-echo' });

    const [head, ...rest] = cmd.toLowerCase().split(/\s+/);
    const fn = commands[head];

    if (!fn) {
      push([`command not found: ${head} — try "help"`], 'term-warn');
      return;
    }

    if (head === 'mode' || head === 'view') {
      fn();
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

  const quick = ['help', 'skills', 'experience', 'contact'];

  push([`${site.name} — resume shell`, 'Type "help" for available commands.'], 'term-dim');
</script>

<section class="terminal" aria-label="Interactive terminal">
  <div class="terminal-bar">
    <div class="terminal-dots" aria-hidden="true">
      <span></span><span></span><span></span>
    </div>
    <span class="terminal-title">narayana@resume:~ (zsh)</span>
    <div class="terminal-quick">
      {#each quick as cmd}
        <button type="button" class="term-chip" onclick={() => run(cmd)}>{cmd}</button>
      {/each}
    </div>
  </div>

  <div class="terminal-body">
    <div bind:this={termEl} class="term-out" role="log" aria-live="polite">
      {#each output as line}
        <div class="term-line {line.cls}">{line.text}</div>
      {/each}
    </div>

    <form class="term-form" onsubmit={submit}>
      <label class="term-prompt" for="term-in">❯</label>
      <input
        id="term-in"
        class="term-in"
        type="text"
        spellcheck="false"
        placeholder="Type a command (help, skills, experience, education, contact, theme, clear)..."
        bind:value={input}
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
  }

  .terminal-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 14px;
    background: var(--term-bar);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
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
    color: #9aa4b2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .terminal-quick { display: flex; gap: 5px; margin-left: auto; flex-wrap: wrap; }

  .term-chip {
    border: 1px solid rgba(255, 255, 255, 0.14);
    background: rgba(255, 255, 255, 0.05);
    color: #c7d0db;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 10px;
    padding: 3px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;
  }

  .term-chip:hover { background: rgba(255, 255, 255, 0.14); color: #fff; }

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
  .term-echo { color: var(--term-accent); }
  .term-ok { color: var(--term-ink); }
  .term-dim { color: var(--term-dim); }
  .term-warn { color: var(--term-warn); }

  .term-form {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding-top: 11px;
    border-top: 1px solid rgba(255, 255, 255, 0.09);
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
    color: #fff;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12px;
    padding: 4px 0;
  }

  .term-in:focus { outline: none; }
  .term-in::placeholder { color: #5c6672; }

  .term-run {
    flex: 0 0 auto;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(255, 255, 255, 0.08);
    color: #e5eaf0;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 11px;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 7px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .term-run:hover { background: rgba(255, 255, 255, 0.18); }
</style>