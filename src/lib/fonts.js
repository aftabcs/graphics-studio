/**
 * Devanagari display fonts the admin can pick per text field. Each `family` is a
 * CSS font-family string (loaded in index.html). The compositor falls back to
 * Noto Sans Devanagari so unknown glyphs still render.
 */
export const DEVANAGARI_FONTS = [
  { label: 'Noto Sans — clean (default)', family: "'Noto Sans Devanagari'" },
  { label: 'Baloo 2 — bold & rounded', family: "'Baloo 2'" },
  { label: 'Rozha One — elegant display', family: "'Rozha One'" },
  { label: 'Tiro — traditional serif', family: "'Tiro Devanagari Hindi'" },
  { label: 'Mukta — modern sans', family: "'Mukta'" },
  { label: 'Anek — contemporary', family: "'Anek Devanagari'" },
  { label: 'Yatra One — poster display', family: "'Yatra One'" },
  { label: 'Kalam — handwritten', family: "'Kalam'" },
]
