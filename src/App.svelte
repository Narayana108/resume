<script>
  import { onMount } from 'svelte';
  import { palette, mode, view, applyTheme } from './lib/stores/theme.js';
  import { equilibrium } from './lib/data/resume.js';

  import TopBar from './lib/components/TopBar.svelte';
  import Hero from './lib/components/Hero.svelte';
  import Section from './lib/components/Section.svelte';
  import Profile from './lib/components/Profile.svelte';
  import Skills from './lib/components/Skills.svelte';
  import Experience from './lib/components/Experience.svelte';
  import Education from './lib/components/Education.svelte';
  import CleanSheet from './lib/components/CleanSheet.svelte';
  import Terminal from './lib/components/Terminal.svelte';
  import Footer from './lib/components/Footer.svelte';
  import FlowerOfLife from './lib/components/geometry/FlowerOfLife.svelte';
  import Hexagram from './lib/components/geometry/Hexagram.svelte';

  // Mirror the theme onto <html> whenever it changes.
  $: applyTheme($palette, $mode);

  onMount(() => {
    // Re-apply on first paint so a stored theme wins over the markup default.
    applyTheme($palette, $mode);
  });
</script>

<FlowerOfLife />

<TopBar />

<main id="top" class="shell">
  <div class="center">
    <Hero />

    <div id="view-interactive" hidden={$view !== 'interactive'}>
      <Section title={equilibrium.heading}>
        <Hexagram />
      </Section>

      <Section title="Profile">
        <Profile />
      </Section>

      <Section title="Technical Skills">
        <Skills />
      </Section>

      <Section title="Experience">
        <Experience />
      </Section>

      <Section title="Education &amp; Certifications">
        <Education />
      </Section>
    </div>

    <div id="view-ats" hidden={$view !== 'ats'}>
      <CleanSheet />
    </div>
  </div>

  <Terminal />
  <Footer />
</main>

<style>
  .shell {
    width: 100%;
    max-width: 1440px;
    margin: 0 auto;
    padding: 24px 12px 64px;
  }

  @media (min-width: 640px) {
    .shell { padding: 32px 24px 72px; }
  }

  .center {
    width: 100%;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  #view-interactive {
    display: flex;
    flex-direction: column;
    gap: 40px;
  }

  @media print {
    .shell {
      max-width: none;
      padding: 0 !important;
      margin: 0;
    }

    .center {
      display: block;
    }
  }
</style>