/**
 * Excel/CSV import + template export for the campaign text library.
 * `xlsx` (SheetJS) is dynamically imported so it only loads in the admin area,
 * never in the karyakarta bundle. Works fully client-side / offline.
 *
 * Accepted formats:
 *   A) One sheet with headers:  Category | Text | Kind
 *   B) One sheet per issue: sheet named after the issue, col A = text, col B = kind.
 * `Category` may be an issue id ("water"), English ("Water Supply") or Hindi.
 */
import { CIVIC_ISSUES } from '../data/textLibrary.js'
import { newId } from './store.js'

const CAT_LOOKUP = (() => {
  const m = new Map()
  for (const c of CIVIC_ISSUES) {
    m.set(c.id.toLowerCase(), c.id)
    m.set(c.label.toLowerCase(), c.id)
    m.set(c.labelHi.toLowerCase(), c.id)
  }
  return m
})()

const resolveCategory = (raw) => (raw ? CAT_LOOKUP.get(String(raw).trim().toLowerCase()) || null : null)

function normalizeKind(raw) {
  const k = String(raw || '').trim().toLowerCase()
  if (k.startsWith('head')) return 'headline'
  if (k === 'sub' || k.startsWith('support')) return 'sub'
  return 'slogan'
}

/** Parse an uploaded File into { library, added, skipped }. */
export async function parseTextFile(file) {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { type: 'array' })
  const library = {}
  let added = 0
  let skipped = 0

  const push = (catRaw, text, kind) => {
    const cat = resolveCategory(catRaw)
    const t = String(text ?? '').trim()
    if (!cat || !t) { if (t) skipped++; return }
    ;(library[cat] ||= []).push({ id: newId('txt'), text: t, kind: normalizeKind(kind) })
    added++
  }

  for (const sheetName of wb.SheetNames) {
    const aoa = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1, blankrows: false })
    if (!aoa.length) continue
    const header = aoa[0].map((h) => String(h || '').trim().toLowerCase())
    const catIdx = header.findIndex((h) => /categor|issue|मुद्द|श्रेणी/.test(h))
    const textIdx = header.findIndex((h) => /text|motto|slogan|line|पाठ|नारा|वाक्य/.test(h))
    const kindIdx = header.findIndex((h) => /kind|type|प्रकार/.test(h))
    const sheetCat = resolveCategory(sheetName)
    if (textIdx >= 0) {
      for (let r = 1; r < aoa.length; r++) {
        const row = aoa[r]
        push(catIdx >= 0 ? row[catIdx] : sheetCat, row[textIdx], kindIdx >= 0 ? row[kindIdx] : undefined)
      }
    } else if (sheetCat) {
      for (const row of aoa) push(sheetCat, row[0], row[1])
    }
  }
  return { library, added, skipped }
}

/** Download a ready-to-fill .xlsx template with the expected columns + examples. */
export async function downloadTemplateXlsx() {
  const XLSX = await import('xlsx')
  const rows = [
    ['Category', 'Text', 'Kind'],
    ['water', 'हर घर नल, हर घर जल', 'slogan'],
    ['road', 'टूटी सड़कें नहीं, मजबूत उत्तराखंड चाहिए', 'headline'],
    ['general', 'हाथ बदलेगा उत्तराखंड', 'headline'],
  ]
  const ws = XLSX.utils.aoa_to_sheet(rows)
  ws['!cols'] = [{ wch: 16 }, { wch: 48 }, { wch: 12 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Texts')
  const ref = [['id', 'English', 'Hindi'], ...CIVIC_ISSUES.map((c) => [c.id, c.label, c.labelHi])]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(ref), 'Categories')
  XLSX.writeFile(wb, 'text-library-template.xlsx')
}
