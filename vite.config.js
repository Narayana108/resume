import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

// Static build for GitHub Pages. The site is served from a sub-path, so
// assets are referenced relatively.
export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});