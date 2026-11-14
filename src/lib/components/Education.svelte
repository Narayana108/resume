<script>
  import { education } from '../data/resume.js';
</script>

{#each education as item}
  <div class="cred">
    <div class="cred-head">
      <h3 class="cred-title">{item.title}</h3>
      <span class="entry-date">{item.date}</span>
    </div>
    <p class="cred-meta">{item.meta}</p>
  </div>
{/each}

<style>
  .cred {
    padding: 14px 0;
    border-bottom: 1px solid var(--hairline);
  }

  .cred:first-child { padding-top: 0; }
  .cred:last-child { padding-bottom: 0; border-bottom: 0; }

  .cred-head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 4px;
  }

  @media (min-width: 640px) {
    .cred-head {
      flex-direction: row;
      align-items: baseline;
      justify-content: space-between;
      gap: 16px;
    }
  }

  .cred-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 19px;
    font-weight: 600;
    line-height: 1.25;
    color: var(--brand);
    margin: 0;
  }

  .entry-date {
    display: inline-block;
    flex: 0 0 auto;
    font-family: 'JetBrains Mono', ui-monospace, monospace;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--ink-muted);
    background: var(--surface-subtle);
    border: 1px solid var(--hairline);
    border-radius: 8px;
    padding: 3px 9px;
    white-space: nowrap;
    align-self: flex-start;
  }

  .cred-meta {
    font-family: 'EB Garamond', Georgia, serif;
    font-size: 16px;
    color: var(--ink-muted);
    margin: 0;
  }
</style>