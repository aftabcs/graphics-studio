# Graphics Studio

Turn a ground issue into a hyperlocal, booth-targeted campaign graphic — **fully
offline, no AI**. A karyakarta picks a reported issue, adds their photo, and the
app composites a shareable graphic (WhatsApp Status / Instagram / print poster)
from layered PNG templates.

This is a **front-end prototype** built to be dropped into a larger app later.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build in dist/
```

## What works today (Phase A + B)

- **Studio shell** matching the design: header, reward **gating banner** with live
  progress, issue list (search + category filter + cards with Devanagari text and
  category/severity/status tags), template picker, targeting & options.
- **Reward gate:** "Generate" shows **Locked** until the karyakarta's daily tasks
  are done. A dev-only "simulate tasks complete" toggle lets you preview both
  states.
- **Generate editor** (modal):
  - Karyakarta photo via **upload or camera capture** → normalised to PNG.
  - Issue photo picked from an **issue library**.
  - **Auto-filled text from the database** (title, description, booth, village,
    name) with **manual override** fields.
  - **Output size** picker: Poster 4:5, WhatsApp Status 9:16, Instagram Square,
    Instagram Portrait.
  - **Live canvas preview** + **Download PNG**.
- **Offline compositor** (`src/lib/compositor.js`): pure HTML5 Canvas layer
  stacking. No network, no AI.

## Architecture & integration seams

| Concern | File | Replace at integration |
|---|---|---|
| Sample data (issues, progress, karyakarta, photo library) | `src/data/mockData.js` | Swap the `get*()` function bodies for real API calls. |
| Template definitions + output formats | `src/lib/templateSchema.js` | Add real templates (see schema below). |
| Rendering engine | `src/lib/compositor.js` | Stable — no change expected. |
| Placeholder imagery | `src/lib/placeholders.js` | Becomes unused once real photos are wired. |

### Template schema (permutation-friendly)

A template is plain JSON describing an ordered stack of layers painted
bottom-to-top. Coordinates/sizes are **fractions (0..1)** of the output canvas,
so one template renders at any size. Only two layers are swappable per
generation:

- `slot: 'karyakartaPhoto'` — the worker's photo
- `slot: 'issuePhoto'` — the issue photo

Everything else (background, tricolour stripes, text frames, and — later — your
**fixed pre-fed PNGs** via `src: '<url>'`) stays constant. So *N templates × M
issue photos × K karyakarta photos* produce *N·K·M* distinct graphics from the
same engine. See `TEMPLATES` in `src/lib/templateSchema.js` for working examples.

## Phase C (next — needs your assets)

The three built-in templates are **placeholders**. Send a sample final graphic +
its individual layer PNGs and they drop straight into `TEMPLATES` (add `image`
layers with `src` for the fixed assets, keep the `karyakartaPhoto` / `issuePhoto`
slots). Then we test the permutation/combination across your real templates.

## Notes

- Text shown on graphics comes from issue records + fields typed by the user.
  The app does **not** invent statistics, quotations, or claims.
- Devanagari renders via the bundled Noto Sans Devanagari font.
