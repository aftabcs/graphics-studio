# Graphics Studio — Developer Handoff & Integration Guide

A self-contained **React + Vite + Tailwind** feature: karyakartas turn a ground
issue into a ready-to-share campaign poster; admins build the poster templates,
manage the campaign text library, and control which posters are live.

This is a **front-end prototype with a clean data seam** — all data goes through
`src/lib/store.js` + `src/data/*`, so wiring it to your real backend is mostly
replacing those function bodies. No component needs to change.

---

## 1. Run it locally

```bash
npm install
npm run dev        # http://localhost:5173  (dev server)
npm run build      # production build → dist/
npm run preview    # serve the production build
```

Node 18+ recommended.

**Karyakarta app:** `/`  ·  **Admin (hidden):** `/?admin`

---

## 2. What's in the box

```
src/
  App.jsx                 # router: "/" = karyakarta, "/?admin" = admin (mock)
  KaryakartaStudio.jsx    # karyakarta: poster gallery + reward gate
  components/
    GenerateModal.jsx     # fill flow: issue select, photos, text pickers, download
    PhotoInput.jsx        # karyakarta photo: upload/camera, ML bg-removal, saved photos
    PosterThumb.jsx       # live poster preview card
    GatingBanner.jsx  TricolourBar.jsx  icons.jsx
  admin/
    AdminShell.jsx        # tabs: My Posters | Poster Studio | Text Library
    PostersManager.jsx    # file mgmt: live/draft, categories, edit/delete
    PosterStudio.jsx      # template builder (base image + placed fields)
    PlacementCanvas.jsx   # drag/resize placement overlay
    FieldProperties.jsx   # per-field props (position, size, font, rotate, colour)
    TextLibraryManager.jsx# campaign lines per civic issue + Excel/CSV upload
  lib/
    store.js              # ← DATA SEAM: templates, categories, text library, saved photos, role
    compositor.js         # offline HTML5-canvas poster renderer (layers → PNG)
    templateSchema.js     # template/layer schema, output formats, resolveFields
    textImport.js         # Excel/CSV parsing (lazy-loads xlsx)
    bgRemoveML.js         # on-device ML background removal (@imgly)
    fonts.js  placeholders.js  i18n.jsx
  data/
    mockData.js           # ← DATA SEAM: issues, karyakarta profile, progress, issue photos
    textLibrary.js        # ← DATA SEAM: seed campaign lines (Congress/Uttarakhand)
public/poster-assets/     # supplied PNG assets (backgrounds, leaders, icons, …)
```

---

## 3. How the developer integrates it

### Option A — mount as a feature/route (recommended)
It's plain React. Drop the folders into your app and render:
```jsx
import KaryakartaStudio from './graphics-studio/KaryakartaStudio.jsx'
import AdminShell from './graphics-studio/admin/AdminShell.jsx'
// karyakarta route → <KaryakartaStudio />
// admin route     → <AdminShell onExit={...} />
```
Wrap the app once in the language provider:
```jsx
import { LanguageProvider } from './graphics-studio/lib/i18n.jsx'
<LanguageProvider><App/></LanguageProvider>
```
Tailwind: merge `tailwind.config.js` content globs + the `@tailwind` directives
and the fonts in `index.html`.

### Option B — ship the static build
`npm run build` → host `dist/` as a static bundle and iframe/link it. Simplest,
but harder to share auth/data with the host app.

### Replace the data seams (the real work)
All of these are small functions returning mock data today — swap the bodies for
your API calls; **the UI stays the same**:

| Replace | In | Provides |
|---|---|---|
| `getIssues()`, `ISSUE_PHOTO_LIBRARY` | `data/mockData.js` | reported issues + photos + descriptions |
| `getCurrentKaryakarta()`, `getStudioState()`, `isStudioUnlocked()` | `data/mockData.js` | logged-in worker (name/village/booth) + daily-task reward gate |
| `getTemplates/saveTemplate/…`, `getCategories/…`, `getTextLibrary/…`, `getMyPhotos/…` | `lib/store.js` | persistence (currently `localStorage`) → your DB/API |
| `textLibrary.js` seed | `data/textLibrary.js` | campaign lines → your DB |

Auth/roles: `/?admin` + role is a **mock** (no passwords). Map your real
auth's role to admin vs karyakarta and gate `AdminShell` behind it.

Assets: `public/poster-assets/*` are the supplied PNGs. Admin-created templates
store their base image + uploaded assets as data-URLs in the store today — for
production, upload those to your asset storage and keep URLs instead.

---

## 4. Infra requirement — cross-origin isolation (for fast bg-removal)

The on-device ML background removal (@imgly / onnxruntime-web) is much faster
with multithreaded WASM, which needs the page **cross-origin isolated**. Serve the
app (and its host) with:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: credentialless
```

(Already set for Vite dev/preview in `vite.config.js`; replicate on your prod
server/CDN.) Without these it still works, just slower (single-threaded).

---

## 5. Dependencies & licensing (please review before shipping)

| Package | Use | License | Note |
|---|---|---|---|
| react, react-dom, vite, tailwind | app | MIT | fine |
| `xlsx` (SheetJS) | admin Excel/CSV import | Apache-2.0 | fine; lazy-loaded |
| **`@imgly/background-removal`** | ML bg-removal | **AGPL-3.0** | ⚠️ **see below** |
| Google Fonts (Inter, Noto Sans Devanagari, Baloo 2, Rozha One, Tiro, Mukta, Anek, Yatra One, Kalam) | typography | OFL | fine; loaded via CDN in index.html |

⚠️ **@imgly is AGPL-3.0.** For a public/networked deployment that legally means
either open-sourcing your app or buying an **IMG.LY commercial licence**. If
that's not acceptable, swap `lib/bgRemoveML.js` for a **permissively-licensed**
on-device alternative (e.g. `@huggingface/transformers` + a BiRefNet/MIT model) —
it's an isolated file with one function (`mlRemoveBackground`); the algorithmic
fallback (`removeBgFromDataUrl` in `compositor.js`) stays either way.

The `@imgly` model is fetched from a CDN on first use (then cached). For strict
offline, self-host the model and set its `publicPath`.

---

## 6. Notable design facts (so nothing surprises the developer)

- **Compositor** (`lib/compositor.js`) renders posters purely on an HTML5 canvas
  from a JSON layer list — offline, no server. A template = base image + layers;
  only the `karyakartaPhoto` and `issuePhoto` slots + bound text change per graphic.
- **Bilingual** EN/हिं via `lib/i18n.jsx` (`useLang().t()`), persisted in localStorage.
- **Downloads**: poster at the template's native aspect + a WhatsApp 9:16 (letterboxed).
- **Saved photos**: cut-out karyakarta photos are stored locally for instant reuse.
- Everything currently persists in `localStorage` — clearing it resets to seeds.
```
