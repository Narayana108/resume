<script>
  import { profile } from '../data/resume.js';
</script>

<ul class="bullets profile-list">
  {#each profile.points as point}
    <li><strong class="prose-label">{point.label}:</strong> {point.text}</li>
  {/each}
</ul>

<p class="prose prose-closing">
  {profile.closing.lead}
  <strong>{profile.closing.emphasis}</strong>
  {profile.closing.tail}
</p>

<style>
  .profile-list {
    margin-bottom: 14px;
  }

  .profile-list :global(li) {
    font-size: 17px;
    line-height: 1.55;
  }

  .prose-closing {
    padding-top: 12px;
    border-top: 1px solid var(--hairline);
    margin-bottom: 0;
  }
</style>