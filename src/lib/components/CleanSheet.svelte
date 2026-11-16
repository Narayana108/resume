<script>
  import { site, profile, skills, experience, education } from '../data/resume.js';

  $: email = `${site.email.user}@${site.email.domain}.${site.email.tld}`;
</script>

<section class="card ats">
  <header class="ats-head">
    <h1 class="ats-name">{site.name}</h1>
    <p class="ats-role">{site.role}</p>
    <p class="ats-tagline">{site.tagline.join(' · ')}</p>
    <p class="ats-contact">{email} · {site.location} · {site.githubLabel}</p>

    <dl class="ats-facts">
      {#each site.facts as fact}
        <div class="ats-fact">
          <dt>{fact.label}</dt>
          <dd>{fact.value}</dd>
        </div>
      {/each}
    </dl>
  </header>

  <section class="ats-sec">
    <h2 class="ats-h2">Profile</h2>
    <ul class="ats-list">
      {#each profile.points as point}
        <li><strong>{point.label}:</strong> {point.text}</li>
      {/each}
    </ul>
    <p>
      {profile.closing.lead}
      <strong>{profile.closing.emphasis}</strong>{profile.closing.tail}
    </p>
  </section>

  <section class="ats-sec">
    <h2 class="ats-h2">Technical Skills</h2>
    <ul class="ats-list">
      {#each skills as skill}
        <li><strong>{skill.label}:</strong> {skill.text}</li>
      {/each}
    </ul>
  </section>

  <section class="ats-sec">
    <h2 class="ats-h2">Experience</h2>

    {#each experience as job}
      <div class="ats-job">
        <h3 class="ats-job-title">{job.title}</h3>
        <p class="ats-meta">
          {job.subtitle ? `${job.subtitle} · ${job.date}` : job.date}
        </p>

        {#if job.bullets?.length}
          <ul class="ats-list">
            {#each job.bullets as bullet}
              <li>{bullet}</li>
            {/each}
          </ul>
        {/if}

        {#if job.subBullets?.length}
          <ul class="ats-list">
            {#each job.subBullets as bullet}
              <li>{bullet}</li>
            {/each}
          </ul>
        {/if}

        {#each job.clients ?? [] as client}
          <p class="ats-client">{client.name} · {client.date}</p>
          <ul class="ats-list">
            {#each client.bullets as bullet}
              <li>{bullet}</li>
            {/each}
          </ul>
        {/each}

        {#if job.projects?.length}
          <p class="ats-note">
            Projects:
            {#each job.projects as project, i}
              {i > 0 ? ' · ' : ''}
              <a href={project.href}>{project.label}</a>
            {/each}
          </p>
        {/if}
      </div>
    {/each}
  </section>

  <section class="ats-sec">
    <h2 class="ats-h2">Education &amp; Certifications</h2>
    {#each education as item}
      <div class="ats-job">
        <h3 class="ats-job-title">{item.title}</h3>
        <p class="ats-meta">{item.meta} · {item.date}</p>
      </div>
    {/each}
  </section>
</section>

<style>
  .ats {
    padding: 26px 22px 32px;
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 16px;
    line-height: 1.5;
    color: #000000;
    background: #ffffff;
    border-color: var(--hairline-strong);
    box-shadow: none;
    text-align: left;
  }

  @media (min-width: 640px) {
    .ats { padding: 40px 44px 48px; }
  }

  .ats-head {
    text-align: center;
    padding-bottom: 14px;
    margin-bottom: 18px;
    border-bottom: 1px solid #999999;
  }

  .ats-name {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 28px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: var(--brand);
    margin: 0 0 2px;
  }

  .ats-role { font-size: 17px; margin: 0 0 2px; color: #000; }

  .ats-tagline {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 4px;
    color: var(--brand);
  }

  .ats-contact { font-size: 16px; margin: 0; color: #222; }

  .ats-facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 24px;
    margin: 20px 0 0;
    padding: 0;
    text-align: left;
  }

  .ats-fact {
    display: flex;
    gap: 8px;
    align-items: baseline;
    font-size: 15px;
  }

  .ats-fact dt { font-weight: 700; color: #000; flex: 0 0 auto; }
  .ats-fact dd { margin: 0; color: #222; }

  .ats-sec { margin-bottom: 18px; }

  .ats-h2 {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--accent);
    border-bottom: 1px solid #999999;
    padding-bottom: 3px;
    margin: 0 0 9px;
  }

  .ats :global(p) { margin: 0 0 7px; color: #000; }

  .ats-list {
    list-style: disc;
    margin: 0 0 8px;
    padding-left: 20px;
  }

  .ats-list :global(li) { margin-bottom: 3px; color: #000; }

  .ats-job {
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #E5E5E5;
  }

  .ats-job:last-child { margin-bottom: 0; padding-bottom: 0; border-bottom: 0; }

  .ats-job-title {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--brand-strong);
    margin: 0 0 1px;
  }

  .ats-meta { font-size: 16px; font-style: italic; color: #222; margin: 0 0 6px; }

  .ats-client { font-size: 16px; font-weight: 700; color: var(--brand-strong); margin: 8px 0 4px; }

  .ats-note { font-size: 16px; margin: 3px 0 0; color: #000; }

  .ats :global(a) { color: #000; border-bottom: 1px dotted #666; }
  .ats :global(a:hover) { color: #000; border-bottom-color: #000; }

  /* Print overrides live here so they outrank the scoped screen rules. */
  @media print {
    .ats {
      font-size: 10.2pt;
      padding: 0 !important;
      border: 0 !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      background: #fff !important;
    }

    .ats-name { font-size: 17pt; }
    .ats-h2 { font-size: 9.8pt; }
    .ats-job-title { font-size: 10.8pt; }
    .ats-meta,
    .ats-client,
    .ats-note { font-size: 9.6pt; }

    .ats-head { padding-bottom: 8px; margin-bottom: 10px; }
    .ats-tagline { margin-bottom: 2px; padding-bottom: 2px; border-bottom: 1px solid #009b5a; }
    .ats-facts { margin-top: 8px; gap: 0 20px; }
    .ats-fact { font-size: 9.6pt; }
    .ats-sec { margin-bottom: 10px; }

    .ats-job {
      margin-bottom: 6px;
      padding-bottom: 6px;
      break-inside: auto;
    }

    .ats-h2,
    .ats-client,
    .ats-name,
    .ats-job-title,
    .ats-tagline {
      color: #009b5a !important;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .ats-h2,
    .ats-job-title { break-after: avoid; }
    .ats-meta,
    .ats-client { break-after: avoid; }
    .ats-list li { break-inside: avoid; }
  }
</style>