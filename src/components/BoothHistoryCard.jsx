import { useMemo } from 'react'
import { getBoothRecord } from '../lib/store.js'
import { analyzeBooth, partyLabel, partyColor, TAG_META } from '../lib/electionAnalysis.js'
import { useLang } from '../lib/i18n.jsx'

const TAG_LABEL_KEY = { swing: 'tagSwingLabel', leaning: 'tagLeaningLabel', safe: 'tagSafeLabel' }

/** Read-only past-results card for the karyakarta's OWN booth. */
export default function BoothHistoryCard({ booth }) {
  const { t } = useLang()
  const rec = useMemo(() => getBoothRecord(booth), [booth])
  const a = useMemo(() => (rec ? analyzeBooth(rec) : null), [rec])

  return (
    <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">
          {t('boothHistoryTitle')} <span className="font-normal text-slate-400">· {booth}</span>
        </h2>
        {a && (
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TAG_META[a.tag].bg} ${TAG_META[a.tag].text}`}>
            {t(TAG_LABEL_KEY[a.tag])}
          </span>
        )}
      </div>

      {!a ? (
        <p className="text-sm text-slate-400">{t('noBoothHistory')}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {a.perYear.map((p) => (
            <div key={p.year} className="rounded-lg border border-slate-200 px-3 py-2">
              <div className="text-xs text-slate-400">{p.year}</div>
              <div className="text-sm font-semibold" style={{ color: partyColor(p.winner) }}>{partyLabel(p.winner)}</div>
              <div className="text-[11px] text-slate-400">{t('marginWord')} {p.marginPct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
