import { useMemo, useRef, useState } from 'react'
import {
  getElectionRecords, saveElectionRecords, resetElectionRecords, exportElectionRecordsJSON,
} from '../lib/store.js'
import { analyzeBooth, summarize, allParties, partyLabel, partyColor, TAG_META } from '../lib/electionAnalysis.js'
import { parseElectionFile, downloadElectionTemplate } from '../lib/electionImport.js'
import { useLang } from '../lib/i18n.jsx'

const TAG_LABEL_KEY = { swing: 'tagSwingLabel', leaning: 'tagLeaningLabel', safe: 'tagSafeLabel' }

function TagBadge({ tag, t }) {
  const m = TAG_META[tag]
  return <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${m.bg} ${m.text}`}>{t(TAG_LABEL_KEY[tag])}</span>
}

export default function ElectionRecords() {
  const { t } = useLang()
  const [records, setRecords] = useState(() => getElectionRecords())
  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState('all')
  const [openBooth, setOpenBooth] = useState(null)
  const [msg, setMsg] = useState('')
  const uploadRef = useRef(null)

  const parties = useMemo(() => allParties(records), [records])
  const summary = useMemo(() => summarize(records), [records])
  const analyzed = useMemo(
    () => records.map((b) => ({ b, a: analyzeBooth(b) })),
    [records],
  )
  const filtered = analyzed.filter(({ b, a }) => {
    const q = query.trim().toLowerCase()
    const matchesQ = !q || b.booth.toLowerCase().includes(q) || (b.village || '').toLowerCase().includes(q)
    const matchesTag = tagFilter === 'all' || a.tag === tagFilter
    return matchesQ && matchesTag
  })

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 2500) }
  const update = (next) => { setRecords(next) }

  async function onUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { records: parsed, rows, skipped } = await parseElectionFile(file)
      if (!parsed.length) { flash('No valid rows found. Check the columns.'); return }
      const replace = confirm(`Parsed ${rows} rows into ${parsed.length} booths (${skipped} skipped).\n\nOK = REPLACE all records.\nCancel = keep current.`)
      if (replace) update(saveElectionRecords(parsed))
      flash(replace ? `Imported ${parsed.length} booths.` : 'Import cancelled.')
    } catch (err) { flash('Import failed: ' + err.message) } finally { e.target.value = '' }
  }

  function exportJson() {
    const blob = new Blob([exportElectionRecordsJSON()], { type: 'application/json' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'election-records.json'
    document.body.appendChild(a); a.click(); a.remove()
  }

  const btn = 'rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50'
  const chip = (id, label, count, color) => (
    <button
      onClick={() => setTagFilter(tagFilter === id ? 'all' : id)}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${tagFilter === id ? 'border-[#12306e] ring-1 ring-[#12306e]/20' : 'border-slate-200'} bg-white`}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="font-semibold text-slate-900">{count}</span>
      <span className="text-slate-500">{label}</span>
    </button>
  )

  return (
    <div className="flex h-full flex-col bg-slate-100">
      <header className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
        <span className="mr-2 text-sm font-bold text-slate-900">{t('tabElections')}</span>
        <button className="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600" onClick={() => uploadRef.current?.click()}>{t('uploadForm20')}</button>
        <button className={btn} onClick={() => downloadElectionTemplate()}>{t('downloadTemplate')}</button>
        <button className={btn} onClick={exportJson}>{t('exportJson')}</button>
        <button className={btn} onClick={() => { if (confirm('Reset to sample records?')) update(resetElectionRecords()) }}>{t('resetWord')}</button>
        <span className="text-xs text-emerald-600">{msg}</span>
        <input ref={uploadRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onUpload} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        {/* Summary */}
        <div className="mb-4 flex flex-wrap gap-3">
          {chip('all', t('boothsWord'), summary.total, '#12306e')}
          {chip('swing', t('tagSwingLabel'), summary.swing, TAG_META.swing.color)}
          {chip('leaning', t('tagLeaningLabel'), summary.leaning, TAG_META.leaning.color)}
          {chip('safe', t('tagSafeLabel'), summary.safe, TAG_META.safe.color)}
        </div>

        {/* Search */}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('searchBooth')}
          className="mb-3 w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]"
        />

        {filtered.length === 0 && <p className="text-sm text-slate-400">{t('noElectionData')}</p>}

        {/* Booth list */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {filtered.map(({ b, a }) => {
            const open = openBooth === b.booth
            return (
              <div key={b.booth} className="border-b border-slate-100 last:border-0">
                <button
                  onClick={() => setOpenBooth(open ? null : b.booth)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-slate-50"
                >
                  <span className="w-28 shrink-0 font-medium text-slate-800">{b.booth}</span>
                  <span className="w-32 shrink-0 truncate text-sm text-slate-500">{b.village}</span>
                  <TagBadge tag={a.tag} t={t} />
                  <span className="ml-2 flex flex-wrap items-center gap-1.5">
                    {a.perYear.map((p) => (
                      <span key={p.year} className="inline-flex items-center gap-1 rounded bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600">
                        {p.year}
                        <span className="font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</span>
                      </span>
                    ))}
                  </span>
                  <span className="ml-auto text-xs text-slate-400">{open ? '▲' : '▼'}</span>
                </button>

                {open && (
                  <div className="overflow-x-auto px-4 pb-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-slate-400">
                          <th className="py-1 pr-3">{t('yearWord')}</th>
                          {parties.map((p) => <th key={p} className="px-2 py-1 text-right">{partyLabel(p)}</th>)}
                          <th className="px-2 py-1 text-right">{t('turnoutWord')}</th>
                          <th className="px-2 py-1 text-right">{t('winnerWord')}</th>
                          <th className="px-2 py-1 text-right">{t('marginWord')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {a.perYear.map((p) => (
                          <tr key={p.year} className="border-t border-slate-100">
                            <td className="py-1.5 pr-3 font-medium text-slate-700">{p.year}</td>
                            {parties.map((party) => {
                              const v = p.votes[party]
                              const isWin = party === p.winner
                              return (
                                <td key={party} className={`px-2 py-1.5 text-right tabular-nums ${isWin ? 'font-bold' : 'text-slate-600'}`} style={isWin ? { color: partyColor(party) } : undefined}>
                                  {v ?? '—'}
                                </td>
                              )
                            })}
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-500">{p.total}</td>
                            <td className="px-2 py-1.5 text-right font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</td>
                            <td className="px-2 py-1.5 text-right tabular-nums text-slate-600">{p.marginVotes} ({p.marginPct.toFixed(1)}%)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
