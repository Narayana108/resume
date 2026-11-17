<script>
  /** Shared section scaffolding: heading + card slot. */
  let { title, children } = $props();
</script>

<section class="block">
  <header class="block-head">
    <h2 class="block-title">{title}</h2>
  </header>

  <div class="card pad">
    {@render children()}
  </div>
</section>

<style>
  .block {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .block-head {
    position: relative;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--hairline);
  }

  /* A brand-coloured rule sweeps across the divider when the section is
     hovered, so the heading reads as interactive without adding chrome. */
  .block-head::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -1px;
    height: 2px;
    width: 0;
    background: var(--brand);
    transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .block:hover .block-head::after {
    width: 100%;
  }

  .block-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(24px, 3.4vw, 32px);
    font-weight: 600;
    line-height: 1.15;
    letter-spacing: -0.01em;
    color: var(--brand);
    margin: 0;
  }
</style>