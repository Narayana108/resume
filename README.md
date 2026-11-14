# Nārāyaṇa Dās Harricharaṇ — Resume

Interactive resume built with Svelte 5 and Vite. Two switchable views — an
interactive studio and a print-clean ATS sheet — with two colour palettes, light
and dark modes, and a terminal.

**Live:** https://Narayana108.github.io/resume/

---

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
```

## Build

```bash
npm run build      # static output in dist/
npm run preview    # serve the built dist/ locally
```

The build is fully static — no server, no runtime dependencies. `dist/` is ready
to deploy as-is.

## Deploy to GitHub Pages

The repo is configured with `base: './'` in `vite.config.js`, so the build works
from a project sub-path. Publish `dist/` via GitHub Pages (Settings → Pages →
Deploy from a branch → `dist/` or an Actions workflow).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Type-check-free production build to `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
index.html              Vite entry — meta, fonts, #app mount
public/                 Copied verbatim into dist/
  favicon.ico
  pp.png                avatar
  Nārāyaṇa - DevOps Engineer - Resume.pdf
src/
  main.js               mount App into #app
  App.svelte            view switch, theme application, shell layout
  app.css               theme tokens, resets, shared primitives, print
  lib/
    data/resume.js      single source of truth for all resume content
    stores/theme.js     palette + mode + view stores (localStorage)
    components/
      TopBar.svelte
      Hero.svelte
      Section.svelte
      Profile.svelte
      Skills.svelte
      Experience.svelte
      ExperienceEntry.svelte
      Education.svelte
      CleanSheet.svelte
      Terminal.svelte
      Footer.svelte
      geometry/
        FlowerOfLife.svelte
        Hexagram.svelte
        PolyhedralMorpher.svelte
```

## Editing content

All resume text lives in `src/lib/data/resume.js` — `site`, `profile`, `skills`,
`experience`, `education`, `equilibrium`. Edit that file; components render from
it. Nothing is fetched at runtime.

## Theming

Theme tokens are CSS custom properties in `src/app.css`, scoped by
`html[data-palette]` and `html[data-mode]`:

| Palette | `--brand` | `--accent` |
|---|---|---|
| Purple (indigo) | `#6D28D9` | `#1D297A` |
| Emerald | `#009B5A` | `#1E4D36` |

Each has a light and a dark variant. The active palette and mode are mirrored
onto `<html>` by `src/lib/stores/theme.js` and persisted to `localStorage`.

The Clean Resume sheet is pinned to emerald in both screen and print so the
preview matches the downloaded PDF.

## Views

- **Interactive Resume** — cards, hero, geometry, terminal
- **Clean Resume** — single-column ATS-friendly document, light themes only

The Clean Resume is light-only: entering it forces the light theme and disables
the mode toggle.

## Print / PDF

Print rules live inside `CleanSheet.svelte` so they outrank the component's scoped
screen styles. `@page { size: A4; margin: 14mm }`, chrome hidden, geometry
hidden, job entries may split across pages while bullets and paragraphs stay
intact. The committed PDF is regenerated from this view.

To regenerate the PDF artifact:

```bash
npm run build
npx vite preview --port 4321 &
chromium --headless=new --no-sandbox --disable-gpu --no-pdf-header-footer \
  --virtual-time-budget=15000 \
  --print-to-pdf="public/Nārāyaṇa - DevOps Engineer - Resume.pdf" \
  "http://localhost:4321/"
```

## Requirements

- Node.js 18+ (developed on Node 26)
- npm 9+
- No runtime dependencies — `svelte`, `vite`, `@sveltejs/vite-plugin-svelte` are dev-only