<script>
  import { profile } from '../data/resume.js';
  import Radar from './geometry/Radar.svelte';
</script>

<div class="profile">
  <Radar />

  <div class="profile-body">
    <ul class="bullets profile-list">
      {#each profile.points as point}
        <li><strong class="prose-label">{point.label}:</strong> {point.text}</li>
      {/each}
    </ul>

    <p class="prose prose-closing">
      {profile.closing.lead}
      <strong>{profile.closing.emphasis}</strong>{profile.closing.tail}
    </p>
  </div>
</div>

<style>
  .profile {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
    align-items: center;
  }

  @media (min-width: 768px) {
    .profile {
      grid-template-columns: 340px minmax(0, 1fr);
      gap: 28px;
    }
  }

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