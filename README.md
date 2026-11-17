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
    canvas.js           shared read()/rgba() helpers for the canvases
    audio.js            Pythagorean chime synth (Web Audio, lazy context)
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
        Radar.svelte
        PolyhedralMorpher.svelte
```

## Editing content

All resume text lives in `src/lib/data/resume.js` — `site`, `profile`, `skills`,
`experience`, `education`. Edit that file; components render from
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

The Clean ATS Resume sheet follows the active palette on screen, so the preview
matches the theme you are browsing in. In print it is forced to emerald, so the
downloaded PDF is always green.

## Views

- **Interactive Resume** — cards, hero, geometry, terminal
- **Clean ATS Resume** — single-column ATS-friendly document, light themes only

The Clean ATS Resume is light-only: entering it forces the light theme and disables
the mode toggle. The terminal belongs to the interactive studio and is hidden in
the ATS view.

## Interactions

- **Flower-of-life background** — a continuous spotlight follows the cursor. It
  is a `source-in` mask over a pre-rendered gold lattice, so it glides rather
  than snapping between circles. Clicking the page background drops a water
  ripple that refracts the lattice as the wave passes.
- **Hero card** — tilts a few degrees toward the pointer. The polyhedral solid
  in the corner rotates on its own and morphs between the six Platonic forms;
  drag it to orbit, click to advance.
- **Profile radar** — six axes rated out of five. Clicking it fires a hexagonal
  glow and a 432 Hz chime.
- **Terminal** — collapsed by default, with a nudge chevron below it. Click the
  chevron, click a quick chip, or reach the bottom of the page and scroll again
  to open it. Commands: `help`, `whoami`, `profile`, `contact`, `theme`, `mode`,
  `view`, `clear`. Output is colour-coded per segment and follows the palette.
- **Top bar** — a reading-progress hairline tracks scroll position.
- **Section rail** — dots on the right edge track which section is in view and
  jump to it when clicked.
- **Grain** — a fixed 3.2% noise layer gives the flat areas texture.

Every animation is disabled under `prefers-reduced-motion: reduce`, and the
canvases stop their animation loops when they are off-screen or nothing is
moving.
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