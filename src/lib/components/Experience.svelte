<script>
  import { experience } from '../data/resume.js';
  import ExperienceEntry from './ExperienceEntry.svelte';
</script>

<div class="timeline">
  {#each experience as job}
    <ExperienceEntry {...job} />
  {/each}
</div>

<style>
  .timeline {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
</style>