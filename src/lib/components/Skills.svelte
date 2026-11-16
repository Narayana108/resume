<script>
  import { skills } from '../data/resume.js';
</script>

<ul class="skills">
  {#each skills as skill}
    <li><span class="skill-label">{skill.label}:</span> {skill.text}</li>
  {/each}
</ul>

<style>
  .skills {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px 28px;
  }

  @media (min-width: 700px) {
    .skills { grid-template-columns: 1fr 1fr; }
  }

  .skills :global(li) {
    position: relative;
    padding-left: 18px;
    font-size: 17px;
    line-height: 1.55;
    color: var(--ink-muted);
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), color 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }

  .skills :global(li):hover {
    transform: translateX(4px);
    color: var(--ink);
  }

  .skills :global(li)::before {
    content: '';
    position: absolute;
    left: 2px;
    top: 0.62em;
    width: 6px;
    height: 6px;
    border-radius: 9999px;
    background: var(--brand);
  }

  .skill-label {
    font-weight: 600;
    color: var(--ink);
  }
</style>