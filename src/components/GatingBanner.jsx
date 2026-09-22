import { LockIcon } from './icons.jsx'
import { useLang } from '../lib/i18n.jsx'

/**
 * The reward gate. Shows only while the studio is locked. Explains what must be
 * done and reflects live daily progress. Disappears once unlocked.
 */
export default function GatingBanner({ progress }) {
  const { t, lang } = useLang()
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50/70 px-5 py-4">
      <div className="flex gap-3">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <div className={lang === 'hi' ? 'devanagari' : ''}>
          <p className="text-sm font-semibold text-amber-900">{t('gateTitle')}</p>
          <p className="mt-1 text-sm text-amber-800">{t('gateBody')}</p>
          <p className="mt-1 text-xs font-medium text-amber-700">
            {t('gateProgress', {
              v: progress.votersLogged,
              vr: progress.votersRequired,
              i: progress.issuesReported,
              ir: progress.issuesRequired,
            })}
          </p>
        </div>
      </div>
    </div>
  )
}
