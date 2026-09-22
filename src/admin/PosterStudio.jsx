import { useRef, useState } from 'react'
import PlacementCanvas from './PlacementCanvas.jsx'
import FieldProperties from './FieldProperties.jsx'
import { UserIcon, ImageIcon, TextIcon, ParagraphIcon, MapPinIcon } from '../components/icons.jsx'
import { useLang } from '../lib/i18n.jsx'
import { templateFormat } from '../lib/templateSchema.js'
import { fileToPngDataUrl, loadImage } from '../lib/compositor.js'
import {
  getTemplates, saveTemplate, deleteTemplate, exportTemplatesJSON, importTemplatesJSON, newId,
} from '../lib/store.js'

const DEFAULTS = {
  slotDefaults: {
    karyakartaPhoto: '/poster-assets/Local_Karyakarta_Portrait.png',
    issuePhoto: '/poster-assets/Broken_Building_Local_Issue.png',
  },
  slotClean: {
    karyakartaPhoto: { removeBg: true, trimBottom: 0.12, tolerance: 46 },
    issuePhoto: { trimBottom: 0.12 },
  },
}

function makeField(kind) {
  switch (kind) {
    case 'karyakarta': return { type: 'image', slot: 'karyakartaPhoto', x: 0.6, y: 0.6, w: 0.3, h: 0.25, fit: 'contain' }
    case 'issue': return { type: 'image', slot: 'issuePhoto', x: 0.06, y: 0.35, w: 0.45, h: 0.22, fit: 'cover', radius: 0.02, border: '#ffffff', borderWidth: 0.008 }
    case 'headline': return { type: 'text', bind: 'title', x: 0.08, y: 0.62, w: 0.6, size: 0.032, weight: 700, color: '#13387a', align: 'left', maxLines: 3, lineHeight: 1.1, devanagari: true }
    case 'description': return { type: 'text', bind: 'description', x: 0.08, y: 0.76, w: 0.6, size: 0.02, weight: 500, color: '#1e293b', align: 'left', maxLines: 4, lineHeight: 1.25, devanagari: true }
    case 'name': return { type: 'text', bind: 'name', x: 0.58, y: 0.9, w: 0.36, size: 0.028, weight: 700, color: '#ffffff', align: 'center', maxLines: 1, devanagari: true }
    case 'village': return { type: 'text', bind: 'village', x: 0.58, y: 0.94, w: 0.36, size: 0.016, weight: 600, color: '#13387a', align: 'center', maxLines: 1, devanagari: true }
    default: return null
  }
}

const FIELD_NAME = { title: 'Headline', description: 'Description', name: 'Karyakarta name', village: 'Village name' }
function fieldLabel(l) {
  if (l.slot) return l.slot === 'karyakartaPhoto' ? 'Karyakarta photo' : 'Issue photo'
  if (l.type === 'text') return FIELD_NAME[l.bind] || 'Text'
  return 'Base poster'
}
const isBase = (l, i) => l.base || (i === 0 && l.type === 'image' && !l.slot)

export default function PosterStudio({ initialTemplateId } = {}) {
  const { t } = useLang()
  const [templates, setTemplates] = useState(() => getTemplates())
  const [current, setCurrent] = useState(() => {
    const list = getTemplates()
    const t = initialTemplateId ? list.find((x) => x.id === initialTemplateId) : null
    return structuredClone(t || list[0])
  })
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [msg, setMsg] = useState('')
  const baseRef = useRef(null)
  const importRef = useRef(null)

  const fmt = templateFormat(current)
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 1500) }

  function patchLayer(index, patch) {
    if (index < 0) return
    setCurrent((c) => ({ ...c, layers: c.layers.map((l, i) => (i === index ? { ...l, ...patch } : l)) }))
  }
  function addField(kind) {
    const f = makeField(kind)
    if (!f) return
    // Add the field but DON'T auto-select it — it only gets selected when the
    // admin clicks it on the canvas.
    setCurrent((c) => ({ ...c, layers: [...c.layers, f] }))
  }
  function deleteLayer() {
    if (selectedIndex < 0) return
    setCurrent((c) => ({ ...c, layers: c.layers.filter((_, i) => i !== selectedIndex) }))
    setSelectedIndex(-1)
  }

  async function importBase(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await fileToPngDataUrl(file, { removeBg: false, maxSize: 1600 })
    const img = await loadImage(dataUrl).catch(() => null)
    const w = img?.naturalWidth || 1080
    const h = img?.naturalHeight || 1620
    const format = { width: 1080, height: Math.round((1080 * h) / w) }
    const baseLayer = { type: 'image', src: dataUrl, x: 0, y: 0, w: 1, h: 1, fit: 'fill', base: true }
    // Fresh start: just the base poster, no fields — admin adds them.
    setCurrent((c) => ({ ...c, format, layers: [baseLayer] }))
    setSelectedIndex(-1)
    flash('Base poster imported')
    e.target.value = ''
  }

  function doSave() { setTemplates(saveTemplate(current)); flash(t('savedMsg')) }
  function selectTemplate(id) { const t = templates.find((x) => x.id === id); if (t) { setCurrent(structuredClone(t)); setSelectedIndex(-1) } }
  function newTemplate() {
    setCurrent({
      id: newId(),
      name: 'New poster',
      format: { width: 1080, height: 1620 },
      live: false, // new posters start as Draft
      category: '',
      createdAt: new Date().toISOString(),
      ...DEFAULTS,
      layers: [],
    })
    setSelectedIndex(-1)
  }
  function removeCurrent() { const list = deleteTemplate(current.id); setTemplates(list); if (list[0]) setCurrent(structuredClone(list[0])) }
  function doExport() {
    const blob = new Blob([exportTemplatesJSON()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'posters.json'
    document.body.appendChild(a); a.click(); a.remove()
  }
  async function doImport(e) {
    const file = e.target.files?.[0]; if (!file) return
    try { const list = importTemplatesJSON(await file.text()); setTemplates(list); if (list[0]) setCurrent(structuredClone(list[0])) }
    catch (err) { alert('Import failed: ' + err.message) }
  }

  const hasBase = current.layers.some((l, i) => isBase(l, i))
  const selectedLayer = selectedIndex >= 0 ? current.layers[selectedIndex] : null
  const btn = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'
  const fieldBtn = 'flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="mr-2 text-sm font-bold text-slate-900">{t('tabStudio')} <span className="font-normal text-slate-400">(admin)</span></span>
        <select value={current.id} onChange={(e) => selectTemplate(e.target.value)} className={btn}>
          {templates.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
        </select>
        <input value={current.name} onChange={(e) => setCurrent((c) => ({ ...c, name: e.target.value }))} className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs" placeholder={t('posterName')} />
        <button className={btn} onClick={newTemplate}>{t('newWord')}</button>
        <button className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600" onClick={doSave}>{t('saveWord')}</button>
        <button className={btn} onClick={doExport}>{t('exportWord')}</button>
        <button className={btn} onClick={() => importRef.current?.click()}>{t('importWord')}</button>
        <button className={btn} onClick={() => { if (confirm('Delete this poster?')) removeCurrent() }}>{t('deleteWord')}</button>
        <span className="ml-auto text-xs text-emerald-600">{msg}</span>
        <input ref={importRef} type="file" accept="application/json" className="hidden" onChange={doImport} />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-2">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('basePoster')}</p>
            <button className={`${fieldBtn} mb-1 w-full`} onClick={() => baseRef.current?.click()}>
              <ImageIcon className="h-3.5 w-3.5" /> {t('importBase')}
            </button>
            <input ref={baseRef} type="file" accept="image/*" className="hidden" onChange={importBase} />
            <p className="text-[10px] text-slate-400">{hasBase ? t('baseSet') : t('importFirst')}</p>
          </div>
          <div className="border-b border-slate-100 p-2">
            <p className="mb-1 text-xs font-semibold uppercase text-slate-500">{t('placeField')}</p>
            <div className="grid grid-cols-2 gap-1">
              <button className={fieldBtn} onClick={() => addField('karyakarta')}><UserIcon className="h-3.5 w-3.5" /> {t('fieldKaryakarta')}</button>
              <button className={fieldBtn} onClick={() => addField('issue')}><ImageIcon className="h-3.5 w-3.5" /> {t('fieldIssue')}</button>
              <button className={fieldBtn} onClick={() => addField('headline')}><TextIcon className="h-3.5 w-3.5" /> {t('headlineLabel')}</button>
              <button className={fieldBtn} onClick={() => addField('description')}><ParagraphIcon className="h-3.5 w-3.5" /> {t('descriptionLabel')}</button>
              <button className={fieldBtn} onClick={() => addField('name')}><UserIcon className="h-3.5 w-3.5" /> {t('fieldName')}</button>
              <button className={fieldBtn} onClick={() => addField('village')}><MapPinIcon className="h-3.5 w-3.5" /> {t('fieldVillage')}</button>
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <p className="px-3 py-2 text-xs font-semibold uppercase text-slate-500">{t('fieldsWord')}</p>
            {current.layers.map((l, i) => (isBase(l, i) ? null : (
              <div key={i} onClick={() => setSelectedIndex(i)} className={`cursor-pointer px-3 py-1.5 text-xs ${i === selectedIndex ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50'}`}>
                ◧ {fieldLabel(l)}
              </div>
            )))}
          </div>
        </aside>

        <main className="flex min-w-0 flex-1 items-center justify-center overflow-auto p-6">
          <PlacementCanvas
            template={current}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onLayerChange={patchLayer}
            displayWidth={fmt.width >= fmt.height ? 460 : 360}
          />
        </main>

        <aside className="w-60 shrink-0 overflow-y-auto border-l border-slate-200 bg-white">
          <p className="border-b border-slate-100 px-3 py-2 text-xs font-semibold uppercase text-slate-500">{t('properties')}</p>
          <FieldProperties layer={selectedLayer} onChange={(patch) => patchLayer(selectedIndex, patch)} onDelete={deleteLayer} />
        </aside>
      </div>
    </div>
  )
}
