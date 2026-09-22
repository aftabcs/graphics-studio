/**
 * PERSISTENCE STORE (offline, localStorage-backed)
 * ------------------------------------------------
 * Single source of truth for admin-authored data: templates (now), and later
 * asset library + motto sets. Everything is plain JSON so it can be exported,
 * imported, or swapped for a real backend at integration time — replace the
 * read/write helpers here and nothing else changes.
 */

import { TEMPLATES as BUILTIN_TEMPLATES } from './templateSchema.js'
import { TEXT_LIBRARY_SEED } from '../data/textLibrary.js'
import { ELECTION_SEED } from '../data/electionData.js'

const KEYS = {
  templates: 'gs.templates.v2',
  textLibrary: 'gs.textLibrary.v2',
  categories: 'gs.categories.v1',
  elections: 'gs.elections.v1',
  role: 'gs.role.v1',
}

const DEFAULT_CATEGORIES = ['Booth Issues', 'Manifesto', 'General']

function readJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key))
  } catch {
    return null
  }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Strip runtime-only fields (e.g. cached Image objects) before persisting. */
function cleanTemplate(t) {
  return {
    ...t,
    layers: (t.layers || []).map(({ _loaded, ...layer }) => ({ ...layer })),
  }
}

export function newId(prefix = 'tpl') {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`
}

// --- Templates ---------------------------------------------------------------

export function getTemplates() {
  const saved = readJSON(KEYS.templates)
  if (Array.isArray(saved) && saved.length) return saved
  const seeded = BUILTIN_TEMPLATES.map(cleanTemplate)
  writeJSON(KEYS.templates, seeded)
  return seeded
}

export function saveTemplate(template) {
  const list = getTemplates()
  const clean = cleanTemplate(template)
  const i = list.findIndex((t) => t.id === clean.id)
  if (i >= 0) list[i] = clean
  else list.push(clean)
  writeJSON(KEYS.templates, list)
  return list
}

export function deleteTemplate(id) {
  const list = getTemplates().filter((t) => t.id !== id)
  writeJSON(KEYS.templates, list)
  return list
}

/** Reset the template store back to the built-in seeds. */
export function resetTemplates() {
  const seeded = BUILTIN_TEMPLATES.map(cleanTemplate)
  writeJSON(KEYS.templates, seeded)
  return seeded
}

export function exportTemplatesJSON() {
  return JSON.stringify(getTemplates(), null, 2)
}

export function importTemplatesJSON(json) {
  const parsed = JSON.parse(json)
  if (!Array.isArray(parsed)) throw new Error('Expected a JSON array of templates')
  const list = parsed.map(cleanTemplate)
  writeJSON(KEYS.templates, list)
  return list
}

/** Templates visible to karyakartas: only those marked live (seeds default live). */
export function getLiveTemplates() {
  return getTemplates().filter((t) => t.live !== false)
}

// --- Poster categories -------------------------------------------------------

export function getCategories() {
  const saved = readJSON(KEYS.categories)
  if (Array.isArray(saved)) return saved
  writeJSON(KEYS.categories, DEFAULT_CATEGORIES)
  return [...DEFAULT_CATEGORIES]
}

export function saveCategories(list) {
  writeJSON(KEYS.categories, list)
  return list
}

// --- Text library (campaign mottos by civic issue) ---------------------------

export function getTextLibrary() {
  const saved = readJSON(KEYS.textLibrary)
  if (saved && typeof saved === 'object' && Object.keys(saved).length) return saved
  writeJSON(KEYS.textLibrary, TEXT_LIBRARY_SEED)
  return structuredClone(TEXT_LIBRARY_SEED)
}

export function saveTextLibrary(lib) {
  writeJSON(KEYS.textLibrary, lib)
  return lib
}

export function resetTextLibrary() {
  const seed = structuredClone(TEXT_LIBRARY_SEED)
  writeJSON(KEYS.textLibrary, seed)
  return seed
}

export function exportTextLibraryJSON() {
  return JSON.stringify(getTextLibrary(), null, 2)
}

/**
 * All candidate lines for an issue: the issue's own category plus the shared
 * `general` bucket. Optionally filtered by `kind`.
 */
export function getTextsForCategory(category, kind = null) {
  const lib = getTextLibrary()
  const list = [...(lib[category] || []), ...(lib.general || [])]
  return kind ? list.filter((t) => t.kind === kind) : list
}

/**
 * Pick one line for a category. `random` (default) picks any candidate;
 * otherwise returns the first. `seed` lets callers vary the random choice.
 */
export function pickText(category, { kind = null, random = true, seed } = {}) {
  const list = getTextsForCategory(category, kind)
  if (!list.length) return null
  if (!random) return list[0]
  const i = seed != null ? Math.abs(seed) % list.length : Math.floor(Math.random() * list.length)
  return list[i]
}

// --- Election records (booth-wise, from Form 20) -----------------------------

export function getElectionRecords() {
  const saved = readJSON(KEYS.elections)
  if (Array.isArray(saved) && saved.length) return saved
  const seed = structuredClone(ELECTION_SEED)
  writeJSON(KEYS.elections, seed)
  return seed
}
export function saveElectionRecords(records) {
  writeJSON(KEYS.elections, records)
  return records
}
export function resetElectionRecords() {
  const seed = structuredClone(ELECTION_SEED)
  writeJSON(KEYS.elections, seed)
  return seed
}
export function exportElectionRecordsJSON() {
  return JSON.stringify(getElectionRecords(), null, 2)
}
/** Records for a single booth name (used by the karyakarta's own-booth card). */
export function getBoothRecord(boothName) {
  return getElectionRecords().find((b) => b.booth === boothName) || null
}

// --- Karyakarta's saved cutout photos (local reuse) --------------------------

const MY_PHOTOS_KEY = 'gs.myPhotos.v1'
const MY_PHOTOS_MAX = 6

export function getMyPhotos() {
  const list = readJSON(MY_PHOTOS_KEY)
  return Array.isArray(list) ? list : []
}

/** Save a (background-removed) photo for reuse; most-recent first, deduped, capped. */
export function saveMyPhoto(dataUrl) {
  if (!dataUrl) return getMyPhotos()
  const next = [dataUrl, ...getMyPhotos().filter((p) => p !== dataUrl)].slice(0, MY_PHOTOS_MAX)
  try {
    writeJSON(MY_PHOTOS_KEY, next)
  } catch {
    // localStorage full — drop the oldest and retry once
    writeJSON(MY_PHOTOS_KEY, next.slice(0, Math.max(1, next.length - 1)))
  }
  return getMyPhotos()
}

export function deleteMyPhoto(dataUrl) {
  const next = getMyPhotos().filter((p) => p !== dataUrl)
  writeJSON(MY_PHOTOS_KEY, next)
  return next
}

// --- Role (mock auth) --------------------------------------------------------

export function getRole() {
  return localStorage.getItem(KEYS.role) || null
}
export function setRole(role) {
  if (role) localStorage.setItem(KEYS.role, role)
  else localStorage.removeItem(KEYS.role)
}
