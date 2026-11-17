<script>
  import { site } from '../data/resume.js';
</script>

<footer class="colophon">
  <p class="colophon-line">
    <a href={site.website} target="_blank" rel="noopener">Website by {site.name}</a>
  </p>
</footer>

<style>
  .colophon {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid var(--hairline);
    text-align: center;
  }

  .colophon-line {
    margin: 0;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-style: italic;
    font-size: 15px;
    color: var(--ink-faint);
  }
</style>