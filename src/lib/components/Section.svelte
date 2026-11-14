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
    padding-bottom: 10px;
    border-bottom: 1px solid var(--hairline);
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