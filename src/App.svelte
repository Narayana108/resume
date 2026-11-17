<script>
  import { onMount } from 'svelte';
  import { palette, mode, view, applyTheme } from './lib/stores/theme.js';

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

  // Back-to-top affordance: appears once the page is scrolled past the hero.
  let showTop = $state(false);

  function toTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Mirror the theme onto <html> whenever it changes.
  $effect(() => applyTheme($palette, $mode));

  onMount(() => {
    // Reveal sections as they enter the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.hero, #view-interactive .block').forEach((el) => io.observe(el));

    const onScroll = () => {
      showTop = window.scrollY > 420;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  });
</script>

<FlowerOfLife />

<TopBar />

<main id="top" class="shell">
  <div class="center">
    <Hero />

    <div id="view-interactive" hidden={$view !== 'interactive'}>
      <Section title="Profile" cls="block-wide">
        <Profile />
      </Section>

      <Section title="Technical Skills" cls="block-narrow">
        <Skills />
      </Section>

      <Section title="Experience">
        <Experience />
      </Section>

      <Section title="Education &amp; Certifications" cls="block-narrow">
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

<button
  type="button"
  class="to-top"
  class:is-visible={showTop}
  onclick={toTop}
  aria-label="Back to top"
  title="Back to top"
  tabindex={showTop ? 0 : -1}
>
  ↑
</button>

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


  /* Desktop-only back-to-top control. */
  .to-top {
    position: fixed;
    right: 24px;
    bottom: 24px;
    z-index: 30;
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    border-radius: 9999px;
    border: 1px solid var(--hairline-strong);
    background: var(--surface);
    color: var(--brand);
    font-size: 18px;
    line-height: 1;
    cursor: pointer;
    box-shadow: var(--shadow);
    opacity: 0;
    pointer-events: none;
    transform: translateY(10px);
    transition: opacity 0.25s ease, transform 0.25s ease,
      border-color 0.2s ease, color 0.2s ease;
  }

  .to-top.is-visible {
    opacity: 1;
    pointer-events: auto;
    transform: none;
  }

  .to-top:hover {
    border-color: var(--brand);
    color: var(--brand-strong);
  }

  @media (max-width: 899px) {
    .to-top { display: none; }
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