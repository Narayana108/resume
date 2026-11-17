<script>
  /** One role in the experience timeline. */
  let { title, subtitle, date, bullets = [], subBullets = [], clients = [], projects = [] } = $props();
</script>

<article class="card entry">
  <div class="entry-head">
    <div class="entry-titles">
      <h3 class="entry-title">{title}</h3>
      {#if subtitle}<p class="entry-sub">{subtitle}</p>{/if}
    </div>
    <span class="entry-date">{date}</span>
  </div>

  {#if bullets.length}
    <ul class="bullets">
      {#each bullets as bullet}
        <li>{bullet}</li>
      {/each}
    </ul>
  {/if}

  {#if subBullets.length}
    <ul class="bullets sub">
      {#each subBullets as bullet}
        <li>{bullet}</li>
      {/each}
    </ul>
  {/if}

  {#each clients as client}
    <div class="client">
      <div class="client-head">
        <span class="client-name">{client.name}</span>
        <span class="entry-date">{client.date}</span>
      </div>
      <ul class="bullets">
        {#each client.bullets as bullet}
          <li>{bullet}</li>
        {/each}
      </ul>
    </div>
  {/each}

  {#if projects.length}
    <p class="entry-note">
      <span class="note-label">Projects:</span>
      {#each projects as project, i}
        {#if i > 0}<span class="sep"> · </span>{/if}
        <a href={project.href} target="_blank" rel="noopener">{project.label}</a>
      {/each}
    </p>
  {/if}
</article>

<style>
  .entry {
    padding: 18px 18px 20px;
  }

  @media (min-width: 640px) {
    .entry { padding: 22px 24px 24px; }
  }

  .entry-head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--hairline);
  }

  @media (min-width: 640px) {
    .entry-head {
      flex-direction: row;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;
    }
  }

  .entry-titles { min-width: 0; }

  .entry-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 21px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--brand);
    margin: 0 0 2px;
  }

  .entry-sub {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px;
    color: var(--brand-strong);
    margin: 0;
  }

  .bullets {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .bullets :global(li) {
    position: relative;
    padding-left: 17px;
    font-size: 17px;
    font-weight: 500;
    line-height: 1.55;
    color: var(--ink-muted);
  }

  .bullets :global(li)::before {
    content: '';
    position: absolute;
    left: 3px;
    top: 0.6em;
    width: 5px;
    height: 5px;
    border-radius: 9999px;
    background: var(--brand);
    opacity: 0.75;
  }

  .bullets.sub {
    margin-top: 8px;
    padding-left: 16px;
    border-left: 2px solid var(--hairline);
  }

  .bullets.sub :global(li)::before {
    background: var(--accent);
    opacity: 0.55;
  }

  .client {
    margin-top: 14px;
    padding: 12px 14px;
    background: var(--surface-subtle);
    border: 1px solid var(--hairline);
    border-radius: 12px;
  }

  .client-head {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-bottom: 9px;
  }

  @media (min-width: 560px) {
    .client-head {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
  }

  .client-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17px;
    font-weight: 600;
    color: var(--accent);
  }

  .entry-note {
    font-size: 15px;
    color: var(--ink-muted);
    margin: 12px 0 0;
    line-height: 1.5;
  }

  .note-label {
    font-weight: 600;
    color: var(--ink);
  }

  .sep { color: var(--ink-faint); }
</style>