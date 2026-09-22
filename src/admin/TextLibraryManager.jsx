import { useRef, useState } from 'react'
import { CIVIC_ISSUES } from '../data/textLibrary.js'
import {
  getTextLibrary, saveTextLibrary, resetTextLibrary, exportTextLibraryJSON, newId,
} from '../lib/store.js'
import { parseTextFile, downloadTemplateXlsx } from '../lib/textImport.js'
import { useLang } from '../lib/i18n.jsx'

const KINDS = ['headline', 'slogan', 'sub']

export default function TextLibraryManager() {
  const { t, lang } = useLang()
  const [lib, setLib] = useState(() => getTextLibrary())
  const [selectedCat, setSelectedCat] = useState('general')
  const [msg, setMsg] = useState('')
  const [newText, setNewText] = useState('')
  const [newKind, setNewKind] = useState('slogan')
  const uploadRef = useRef(null)

  const entries = lib[selectedCat] || []
  const update = (next) => { setLib(next); saveTextLibrary(next) }
  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }

  const editEntry = (i, patch) => update({ ...lib, [selectedCat]: entries.map((e, idx) => (idx === i ? { ...e, ...patch } : e)) })
  const deleteEntry = (i) => update({ ...lib, [selectedCat]: entries.filter((_, idx) => idx !== i) })
  function addEntry() {
    const t = newText.trim(); if (!t) return
    update({ ...lib, [selectedCat]: [...entries, { id: newId('txt'), text: t, kind: newKind }] })
    setNewText('')
  }

  async function onUpload(e) {
    const file = e.target.files?.[0]; if (!file) return
    try {
      const { library, added, skipped } = await parseTextFile(file)
      if (!added) { flash('No valid rows found. Check the format / category names.'); return }
      const replace = confirm(`Parsed ${added} lines (${skipped} skipped).\n\nOK = REPLACE the whole library.\nCancel = ADD to the existing library.`)
      let next
      if (replace) next = library
      else { next = { ...lib }; for (const [cat, list] of Object.entries(library)) next[cat] = [...(next[cat] || []), ...list] }
      update(next)
      flash(`Imported ${added} lines${skipped ? `, skipped ${skipped}` : ''}.`)
    } catch (err) { flash('Import failed: ' + err.message) } finally { e.target.value = '' }
  }

  function exportJson() {
    const blob = new Blob([exportTextLibraryJSON()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'text-library.json'
    document.body.appendChild(a); a.click(); a.remove()
  }

  const btn = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="mr-2 text-sm font-bold text-slate-900">{t('tabText')}</span>
        <button className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600" onClick={() => uploadRef.current?.click()}>{t('uploadExcel')}</button>
        <button className={btn} onClick={() => downloadTemplateXlsx()}>{t('downloadTemplate')}</button>
        <button className={btn} onClick={exportJson}>{t('exportJson')}</button>
        <button className={btn} onClick={() => { if (confirm('Reset text library to defaults?')) update(resetTextLibrary()) }}>{t('resetWord')}</button>
        <span className="text-xs text-emerald-600">{msg}</span>
        <input ref={uploadRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="w-60 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          {CIVIC_ISSUES.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCat(c.id)}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${c.id === selectedCat ? 'bg-blue-50 text-blue-800' : 'text-slate-700 hover:bg-slate-50'}`}
            >
              <span>{c.label}<span className="devanagari ml-1 text-xs text-slate-400">{c.labelHi}</span></span>
              <span className="ml-2 shrink-0 rounded-full bg-slate-100 px-2 text-xs text-slate-500">{(lib[c.id] || []).length}</span>
            </button>
          ))}
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            {(() => { const c = CIVIC_ISSUES.find((x) => x.id === selectedCat); return lang === 'hi' ? c?.labelHi : c?.label })()} {t('linesWord')}
            <span className="ml-2 text-xs font-normal text-slate-400">{entries.length} {t('entriesWord')}</span>
          </h2>
          <div className="space-y-2">
            {entries.map((e, i) => (
              <div key={e.id || i} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2">
                <input value={e.text} onChange={(ev) => editEntry(i, { text: ev.target.value })} className="devanagari flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
                <select value={e.kind || 'slogan'} onChange={(ev) => editEntry(i, { kind: ev.target.value })} className="rounded border border-slate-200 px-2 py-1.5 text-xs">
                  {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <button onClick={() => deleteEntry(i)} className="rounded px-2 py-1 text-xs text-rose-500 hover:bg-rose-50">{t('deleteWord')}</button>
              </div>
            ))}
            {entries.length === 0 && <p className="text-sm text-slate-400">{t('noLines')}</p>}
          </div>
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white p-2">
            <input value={newText} onChange={(e) => setNewText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addEntry()} placeholder={t('addLine')} className="devanagari flex-1 rounded border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
            <select value={newKind} onChange={(e) => setNewKind(e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-xs">
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={addEntry} className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600">{t('add')}</button>
          </div>
          <p className="mt-6 text-xs text-slate-400">{t('textLibFooter')}</p>
        </main>
      </div>
    </div>
  )
}
