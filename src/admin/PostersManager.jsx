import { useEffect, useRef, useState } from 'react'
import { composeToCanvas } from '../lib/compositor.js'
import { templateFormat } from '../lib/templateSchema.js'
import { getTemplates, saveTemplate, deleteTemplate, resetTemplates, getCategories, saveCategories } from '../lib/store.js'
import { CheckIcon, CloseIcon } from '../components/icons.jsx'
import { useLang } from '../lib/i18n.jsx'

const PREVIEW_FIELDS = { title: 'हाथ बदलेगा उत्तराखंड', description: 'नमूना विवरण…', name: 'मनीष रावत', village: 'Vaidya' }
const isLive = (t) => t.live !== false

/** Small live preview of a poster (base + icon placeholders + sample text). */
function MiniPoster({ template }) {
  const ref = useRef(null)
  useEffect(() => {
    composeToCanvas(ref.current, template, templateFormat(template), {}, PREVIEW_FIELDS).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id, JSON.stringify(template.layers)])
  return <canvas ref={ref} className="block h-auto w-full rounded-md bg-slate-100" />
}

export default function PostersManager({ onEdit }) {
  const { t } = useLang()
  const [templates, setTemplates] = useState(() => getTemplates())
  const [categories, setCategories] = useState(() => getCategories())
  const [newCat, setNewCat] = useState('')
  const refresh = () => setTemplates(getTemplates())

  function toggleLive(t) { saveTemplate({ ...t, live: !isLive(t) }); refresh() }
  function setCategory(t, category) { saveTemplate({ ...t, category }); refresh() }
  function removePoster(t) { if (confirm(`Delete "${t.name}"?`)) { deleteTemplate(t.id); refresh() } }
  function addCategory() {
    const name = newCat.trim()
    if (!name || categories.includes(name)) { setNewCat(''); return }
    setCategories(saveCategories([...categories, name]))
    setNewCat('')
  }
  function deleteCategory(name) {
    setCategories(saveCategories(categories.filter((c) => c !== name)))
  }

  const btn = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'

  return (
    <div className="h-full overflow-y-auto bg-slate-100 p-5">
      {/* Categories */}
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-slate-900">{t('categories')}</h2>
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <span key={c} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {c}
              <button onClick={() => deleteCategory(c)} className="text-slate-400 hover:text-rose-500"><CloseIcon className="h-3 w-3" /></button>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCategory()}
              placeholder={t('newCategory')}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-400"
            />
            <button onClick={addCategory} className="rounded-lg bg-blue-500 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-600">{t('add')}</button>
          </span>
        </div>
      </section>

      {/* Posters */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">{t('myPosters')} <span className="font-normal text-slate-400">({templates.length})</span></h2>
        <button
          onClick={() => { if (confirm('Reset to the sample posters? Your custom posters will be removed.')) { resetTemplates(); refresh() } }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
        >
          {t('resetSamples')}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {templates.map((p) => (
          <div key={p.id} className="flex flex-col rounded-xl border border-slate-200 bg-white p-2">
            <div className="relative overflow-hidden rounded-md">
              <MiniPoster template={p} />
              <span className={`absolute left-1.5 top-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isLive(p) ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                {isLive(p) ? t('live') : t('draft')}
              </span>
            </div>
            <p className="mt-2 truncate px-1 text-sm font-medium text-slate-800">{p.name}</p>
            <select
              value={p.category || ''}
              onChange={(e) => setCategory(p, e.target.value)}
              className="mt-1 w-full rounded border border-slate-200 px-2 py-1 text-xs text-slate-600"
            >
              <option value="">{t('noCategory')}</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="mt-2 flex items-center gap-1">
              <button
                onClick={() => toggleLive(p)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${isLive(p) ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {isLive(p) && <CheckIcon className="h-3 w-3" />} {isLive(p) ? t('live') : t('goLive')}
              </button>
              <button onClick={() => onEdit(p.id)} className={btn}>{t('edit')}</button>
              <button onClick={() => removePoster(p)} className="rounded-lg px-2 py-1.5 text-xs text-rose-500 hover:bg-rose-50">{t('del')}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
