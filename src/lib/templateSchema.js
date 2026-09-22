/**
 * TEMPLATE SCHEMA  (offline, no-AI, permutation-friendly)
 * -------------------------------------------------------
 * A template is a plain JSON object describing an ordered stack of layers that
 * the canvas compositor paints bottom-to-top. This is the format your real PNG
 * templates will drop into later.
 *
 * Coordinates & sizes are FRACTIONS (0..1) of the rendered canvas, so one
 * template renders correctly at any output size (WhatsApp 9:16, Instagram 1:1,
 * poster 4:5, ...). Font sizes are a fraction of canvas height.
 *
 * Layer types:
 *   { type: 'rect',   x,y,w,h, fill, radius? }
 *   { type: 'stripes', x,y,w,h, colors:[...], vertical? }   // tricolour accents etc.
 *   { type: 'image',  x,y,w,h, fit:'cover'|'contain', shape:'rect'|'circle',
 *                     radius?, border?, src? , slot? }
 *        - `slot` = 'karyakartaPhoto' | 'issuePhoto'  → replaced at render time
 *        - `src`  = a FIXED pre-fed asset URL (unchanging across permutations)
 *   { type: 'text',   x,y,w, bind, size, weight, color, align, maxLines,
 *                     devanagari?, uppercase? }
 *        - `bind` names a field key (see resolveFields). Literal text: use `text`.
 *
 * PERMUTATION / COMBINATION:
 *   Only the `karyakartaPhoto` and `issuePhoto` slots change per generation.
 *   Everything else (background, emblem, stripes, text frames) is fixed. Because
 *   templates are just data, N templates × M issue photos × K karyakarta photos
 *   yields N·M·K distinct graphics from the same engine.
 */

// --- Output formats (target canvases) ---------------------------------------

export const OUTPUT_FORMATS = [
  { id: 'poster_2_3', label: 'Poster (2:3)', width: 1080, height: 1620 },
  { id: 'wa_status', label: 'WhatsApp Status (9:16)', width: 1080, height: 1920 },
  { id: 'ig_portrait', label: 'Instagram Portrait (4:5)', width: 1080, height: 1350 },
  { id: 'ig_square', label: 'Instagram Square (1:1)', width: 1080, height: 1080 },
]

// --- Field resolution --------------------------------------------------------
/**
 * Merge database-derived defaults (from the selected issue + karyakarta) with
 * any manual overrides the user typed. Manual, non-empty values win. This is
 * where "auto text from DB, with manual option" is enforced in one place.
 */
export function resolveFields(issue, karyakarta, overrides = {}) {
  const auto = {
    title: issue?.categoryLabel ? `${issue.categoryLabel} — जनसमस्या` : 'जनसमस्या',
    description: issue?.description || '',
    booth: issue?.booth || karyakarta?.booth || '',
    village: issue?.village || karyakarta?.village || '',
    name: karyakarta?.name || '',
    reportedBy: issue?.reportedByName || '',
    quotation: '',
  }
  const merged = { ...auto }
  for (const [k, v] of Object.entries(overrides)) {
    if (v != null && String(v).trim() !== '') merged[k] = v
  }
  return merged
}

// --- Built-in placeholder templates -----------------------------------------
// These are stand-ins so the whole flow works before your real PNG assets
// arrive. Each corresponds to a card in the template picker. Replace/extend by
// adding real templates with the same shape (and `fixedAssets` PNG URLs).

const TRICOLOUR = ['#FF9933', '#FFFFFF', '#138808']

// Base path for the supplied PNG assets (served from public/poster-assets).
const A = '/poster-assets/'

export const TEMPLATES = [
  {
    id: 'booth_issue_portrait',
    name: 'Booth Issue Poster (Uttarakhand)',
    orientation: 'portrait',
    thumbAspect: '3 / 4',
    // Defaults for the two swappable slots — used until the user picks/uploads.
    slotDefaults: {
      karyakartaPhoto: A + 'Local_Karyakarta_Portrait.png',
      issuePhoto: A + 'Broken_Building_Local_Issue.png',
    },
    // How each swapped-in image is cleaned before compositing.
    slotClean: {
      karyakartaPhoto: { removeBg: true, trimBottom: 0.12, tolerance: 46 },
      issuePhoto: { trimBottom: 0.12 },
    },
    // Designed to match the 2:3 reference poster. Colours:
    //   navy #13387a · green #2f9e44 · orange #f26a1b · yellow #f5b70a
    layers: [
      // Orange page border + white field
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, fill: '#f26a1b' },
      { type: 'rect', x: 0.018, y: 0.012, w: 0.964, h: 0.976, fill: '#ffffff' },

      // --- Top-left: two leaders + labels ---
      { type: 'image', src: A + 'Leader_TomCruise_Portrait.png', x: 0.05, y: 0.03, w: 0.26, h: 0.25, fit: 'contain', clean: { removeBg: true, trimBottom: 0.12 } },
      { type: 'image', src: A + 'State_Leader_Portrait.png', x: 0.29, y: 0.055, w: 0.22, h: 0.225, fit: 'contain', clean: { removeBg: true, trimBottom: 0.12 } },
      { type: 'text', text: 'राहुल गांधी', x: 0.03, y: 0.285, w: 0.26, size: 0.019, weight: 700, color: '#13387a', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', text: 'पूर्व अध्यक्ष, भारतीय राष्ट्रीय कांग्रेस', x: 0.02, y: 0.308, w: 0.28, size: 0.011, weight: 600, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.1, devanagari: true },
      { type: 'text', text: 'गणेश गोदियाल', x: 0.28, y: 0.285, w: 0.25, size: 0.019, weight: 700, color: '#13387a', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', text: 'प्रदेश अध्यक्ष, उत्तराखंड कांग्रेस', x: 0.27, y: 0.308, w: 0.27, size: 0.011, weight: 600, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.1, devanagari: true },

      // --- Top-right: party emblem + brand line (star is a stand-in for hand logo) ---
      { type: 'image', src: A + 'Party_Star_Symbol.png', x: 0.75, y: 0.02, w: 0.17, h: 0.13, fit: 'contain', clean: { removeBg: true, trimBottom: 0.16 } },
      { type: 'text', text: 'हाथ बदलेगा उत्तराखंड', x: 0.57, y: 0.165, w: 0.41, size: 0.03, weight: 700, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.1, devanagari: true },
      { type: 'image', src: A + 'Tricolour_Brush_Stroke.png', x: 0.62, y: 0.235, w: 0.31, h: 0.018, fit: 'fill', clean: { removeBg: true, trimBottom: 0.16 } },

      // --- Mid-left: documented issue photo ---
      { type: 'image', slot: 'issuePhoto', x: 0.04, y: 0.35, w: 0.48, h: 0.235, fit: 'cover', radius: 0.02, border: '#ffffff', borderWidth: 0.01 },

      // --- Mid-right: mountain motif + two-tone headline + subline ---
      { type: 'image', src: A + 'Himalayan_Line_Art.png', x: 0.62, y: 0.30, w: 0.30, h: 0.055, fit: 'contain', clean: { removeBg: true, trimBottom: 0.14 } },
      { type: 'text', text: 'विकास भी,', x: 0.55, y: 0.35, w: 0.43, size: 0.058, weight: 700, color: '#13387a', align: 'left', maxLines: 1, devanagari: true },
      { type: 'text', text: 'सुरक्षा भी', x: 0.55, y: 0.42, w: 0.43, size: 0.058, weight: 700, color: '#2f9e44', align: 'left', maxLines: 1, devanagari: true },
      { type: 'text', text: 'हर गांव, हर वार्ड', x: 0.55, y: 0.505, w: 0.43, size: 0.026, weight: 600, color: '#13387a', align: 'left', maxLines: 1, devanagari: true },
      { type: 'text', text: 'की यही है पुकार', x: 0.55, y: 0.54, w: 0.43, size: 0.026, weight: 600, color: '#13387a', align: 'left', maxLines: 1, devanagari: true },

      // --- Center-left: issue slogan on navy brush panel (line 1 = issue title) ---
      { type: 'image', src: A + 'Navy_Brush_Text_Panel.png', x: 0.03, y: 0.60, w: 0.55, h: 0.105, fit: 'fill', clean: { removeBg: true, trimBottom: 0.16 } },
      { type: 'text', bind: 'title', x: 0.06, y: 0.615, w: 0.49, size: 0.026, weight: 700, color: '#ffffff', align: 'left', maxLines: 1, devanagari: true },
      { type: 'text', text: 'मजबूत उत्तराखंड चाहिए', x: 0.06, y: 0.648, w: 0.49, size: 0.03, weight: 700, color: '#f5b70a', align: 'left', maxLines: 1, devanagari: true },

      // --- Lower-left: three benefit rows (blue circular icons) ---
      { type: 'image', src: A + 'Healthcare_Icon.png', x: 0.05, y: 0.735, w: 0.06, h: 0.05, fit: 'contain', clean: { removeBg: true, trimBottom: 0.2 } },
      { type: 'text', text: 'सुरक्षित भवन सभी के लिए', x: 0.14, y: 0.74, w: 0.34, size: 0.018, weight: 700, color: '#13387a', align: 'left', maxLines: 2, lineHeight: 1.1, devanagari: true },
      { type: 'image', src: A + 'Road_Icon.png', x: 0.05, y: 0.795, w: 0.06, h: 0.05, fit: 'contain', clean: { removeBg: true, trimBottom: 0.2 } },
      { type: 'text', text: 'बेहतर सड़कें हर गांव तक', x: 0.14, y: 0.80, w: 0.34, size: 0.018, weight: 700, color: '#13387a', align: 'left', maxLines: 2, lineHeight: 1.1, devanagari: true },
      { type: 'image', src: A + 'Employment_Icon.png', x: 0.05, y: 0.855, w: 0.06, h: 0.05, fit: 'contain', clean: { removeBg: true, trimBottom: 0.2 } },
      { type: 'text', text: 'जनहित की योजनाएं समय पर', x: 0.14, y: 0.86, w: 0.34, size: 0.018, weight: 700, color: '#13387a', align: 'left', maxLines: 2, lineHeight: 1.1, devanagari: true },

      // --- Lower-right: karyakarta cutout + orange nameplate ---
      { type: 'image', slot: 'karyakartaPhoto', x: 0.57, y: 0.60, w: 0.37, h: 0.29, fit: 'contain' },
      { type: 'rect', x: 0.55, y: 0.885, w: 0.43, h: 0.052, fill: '#f26a1b', radius: 0.025 },
      { type: 'text', bind: 'name', x: 0.55, y: 0.892, w: 0.43, size: 0.028, weight: 700, color: '#ffffff', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', text: 'स्थानीय कांग्रेस कार्यकर्ता उत्तराखंड', x: 0.55, y: 0.942, w: 0.43, size: 0.015, weight: 600, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.1, devanagari: true },

      // --- Bottom: mountain silhouette band ---
      { type: 'image', src: A + 'Himalayan_Line_Art.png', x: 0.02, y: 0.94, w: 0.5, h: 0.05, fit: 'contain', clean: { removeBg: true, trimBottom: 0.14 } },
    ],
  },
  {
    id: 'uttarakhand_vikas_portrait',
    name: 'Vikas Poster — Rahul & Ganesh (Uttarakhand)',
    orientation: 'portrait',
    thumbAspect: '2 / 3',
    slotDefaults: {
      karyakartaPhoto: A + 'Local_Karyakarta_Portrait.png',
      issuePhoto: A + 'Broken_Building_Local_Issue.png',
    },
    slotClean: {
      karyakartaPhoto: { removeBg: true, trimBottom: 0.12, tolerance: 46 },
      issuePhoto: { trimBottom: 0.12 },
    },
    layers: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, fill: '#f26a1b' },
      { type: 'rect', x: 0.018, y: 0.012, w: 0.964, h: 0.976, fill: '#ffffff' },

      // Header: star + brand line + tricolour
      { type: 'image', src: A + 'Party_Star_Symbol.png', x: 0.05, y: 0.03, w: 0.13, h: 0.1, fit: 'contain', clean: { removeBg: true, trimBottom: 0.16 } },
      { type: 'text', text: 'हाथ बदलेगा उत्तराखंड', x: 0.19, y: 0.045, w: 0.62, size: 0.036, weight: 700, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.05, devanagari: true },
      { type: 'image', src: A + 'Tricolour_Brush_Stroke.png', x: 0.34, y: 0.115, w: 0.32, h: 0.016, fit: 'fill', clean: { removeBg: true, trimBottom: 0.16 } },

      // Leaders side by side + labels
      { type: 'image', src: A + 'Leader_TomCruise_Portrait.png', x: 0.27, y: 0.15, w: 0.23, h: 0.21, fit: 'contain', clean: { removeBg: true, trimBottom: 0.12 } },
      { type: 'image', src: A + 'State_Leader_Portrait.png', x: 0.50, y: 0.16, w: 0.22, h: 0.20, fit: 'contain', clean: { removeBg: true, trimBottom: 0.12 } },
      { type: 'text', text: 'राहुल गांधी', x: 0.25, y: 0.365, w: 0.24, size: 0.017, weight: 700, color: '#13387a', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', text: 'गणेश गोदियाल', x: 0.50, y: 0.365, w: 0.24, size: 0.017, weight: 700, color: '#13387a', align: 'center', maxLines: 1, devanagari: true },

      // Mountain motif + headline (from library) + green subline
      { type: 'image', src: A + 'Himalayan_Line_Art.png', x: 0.42, y: 0.40, w: 0.16, h: 0.03, fit: 'contain', clean: { removeBg: true, trimBottom: 0.14 } },
      { type: 'text', bind: 'title', x: 0.08, y: 0.435, w: 0.84, size: 0.05, weight: 700, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.08, devanagari: true },
      { type: 'text', text: 'देवभूमि की पुकार, कांग्रेस सरकार', x: 0.1, y: 0.53, w: 0.8, size: 0.026, weight: 600, color: '#2f9e44', align: 'center', maxLines: 1, devanagari: true },

      // Vacant slots: issue photo (left) + karyakarta (right) with nameplate
      { type: 'image', slot: 'issuePhoto', x: 0.06, y: 0.58, w: 0.46, h: 0.24, fit: 'cover', radius: 0.02, border: '#ffffff', borderWidth: 0.01 },
      { type: 'text', bind: 'description', x: 0.06, y: 0.83, w: 0.46, size: 0.017, weight: 500, color: '#1e293b', align: 'left', maxLines: 4, lineHeight: 1.25, devanagari: true },
      { type: 'image', slot: 'karyakartaPhoto', x: 0.56, y: 0.56, w: 0.38, h: 0.28, fit: 'contain' },
      { type: 'rect', x: 0.56, y: 0.845, w: 0.38, h: 0.05, fill: '#f26a1b', radius: 0.025 },
      { type: 'text', bind: 'name', x: 0.56, y: 0.852, w: 0.38, size: 0.026, weight: 700, color: '#ffffff', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', bind: 'village', x: 0.56, y: 0.902, w: 0.38, size: 0.015, weight: 600, color: '#13387a', align: 'center', maxLines: 1, devanagari: true },

      // Footer: mountains + tricolour
      { type: 'image', src: A + 'Himalayan_Line_Art.png', x: 0.03, y: 0.94, w: 0.45, h: 0.045, fit: 'contain', clean: { removeBg: true, trimBottom: 0.14 } },
      { type: 'stripes', x: 0, y: 0.982, w: 1, h: 0.006, colors: TRICOLOUR },
    ],
  },
  {
    id: 'karyakarta_spotlight_portrait',
    name: 'Karyakarta Spotlight — Uttarakhand',
    orientation: 'portrait',
    thumbAspect: '2 / 3',
    slotDefaults: {
      karyakartaPhoto: A + 'Local_Karyakarta_Portrait.png',
      issuePhoto: A + 'Broken_Building_Local_Issue.png',
    },
    slotClean: {
      karyakartaPhoto: { removeBg: true, trimBottom: 0.12, tolerance: 46 },
      issuePhoto: { trimBottom: 0.12 },
    },
    layers: [
      { type: 'rect', x: 0, y: 0, w: 1, h: 1, fill: '#f26a1b' },
      { type: 'rect', x: 0.018, y: 0.012, w: 0.964, h: 0.976, fill: '#ffffff' },

      // Navy top band with brand + leaders + star
      { type: 'rect', x: 0.018, y: 0.012, w: 0.964, h: 0.16, fill: '#13387a' },
      { type: 'image', src: A + 'Leader_TomCruise_Portrait.png', x: 0.04, y: 0.02, w: 0.12, h: 0.14, fit: 'contain', clean: { removeBg: true, trimBottom: 0.12 } },
      { type: 'image', src: A + 'State_Leader_Portrait.png', x: 0.15, y: 0.025, w: 0.12, h: 0.135, fit: 'contain', clean: { removeBg: true, trimBottom: 0.12 } },
      { type: 'text', text: 'हाथ बदलेगा उत्तराखंड', x: 0.30, y: 0.055, w: 0.5, size: 0.03, weight: 700, color: '#ffffff', align: 'center', maxLines: 2, lineHeight: 1.1, devanagari: true },
      { type: 'image', src: A + 'Party_Star_Symbol.png', x: 0.85, y: 0.03, w: 0.1, h: 0.08, fit: 'contain', clean: { removeBg: true, trimBottom: 0.16 } },

      // Spotlight: large vacant karyakarta slot + orange nameplate
      { type: 'image', slot: 'karyakartaPhoto', x: 0.30, y: 0.18, w: 0.40, h: 0.40, fit: 'contain' },
      { type: 'rect', x: 0.24, y: 0.59, w: 0.52, h: 0.06, fill: '#f26a1b', radius: 0.03 },
      { type: 'text', bind: 'name', x: 0.24, y: 0.6, w: 0.52, size: 0.03, weight: 700, color: '#ffffff', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', text: 'स्थानीय कांग्रेस कार्यकर्ता', x: 0.24, y: 0.652, w: 0.52, size: 0.016, weight: 600, color: '#13387a', align: 'center', maxLines: 1, devanagari: true },
      { type: 'text', bind: 'village', x: 0.24, y: 0.678, w: 0.52, size: 0.015, weight: 600, color: '#2f9e44', align: 'center', maxLines: 1, devanagari: true },

      // Headline (from library)
      { type: 'text', bind: 'title', x: 0.08, y: 0.71, w: 0.84, size: 0.042, weight: 700, color: '#13387a', align: 'center', maxLines: 2, lineHeight: 1.08, devanagari: true },

      // Vacant issue photo + description
      { type: 'image', slot: 'issuePhoto', x: 0.06, y: 0.79, w: 0.4, h: 0.16, fit: 'cover', radius: 0.02, border: '#ffffff', borderWidth: 0.01 },
      { type: 'text', bind: 'description', x: 0.5, y: 0.79, w: 0.44, size: 0.017, weight: 500, color: '#1e293b', align: 'left', maxLines: 5, lineHeight: 1.25, devanagari: true },

      { type: 'stripes', x: 0, y: 0.982, w: 1, h: 0.006, colors: TRICOLOUR },
    ],
  },
]

export function getTemplateById(id) {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0]
}

/** A template's native canvas size (from its imported base graphic), default 2:3. */
export function templateFormat(t) {
  return t?.format || { width: 1080, height: 1620 }
}

/**
 * Some text layers bind to composed values (e.g. "Booth 3 · Vaidya"). Expand
 * those convenience binds against the resolved field set.
 */
export function expandFields(fields) {
  return {
    ...fields,
    boothVillage: [fields.booth, fields.village].filter(Boolean).join(' · '),
    quotationOrDesc: fields.quotation?.trim() ? fields.quotation : fields.description,
  }
}
