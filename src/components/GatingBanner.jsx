import { LockIcon } from './icons.jsx'
import { useLang } from '../lib/i18n.jsx'

/**
 * The reward gate. While the karyakarta still has free graphics, this shows a
 * friendly trial notice; once those run out it shows the locked state with the
 * daily-task progress. Disappears entirely once fully unlocked.
 */
export default function GatingBanner({ progress, freeLeft = 0 }) {
  const { t, lang } = useLang()

  if (freeLeft > 0) {
    return (
      <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50/70 px-5 py-4">
        <div className={lang === 'hi' ? 'devanagari' : ''}>
          <p className="text-sm font-semibold text-emerald-900">{t('freeLeft', { n: freeLeft })}</p>
          <p className="mt-1 text-sm text-emerald-800">{t('freeTrialBody')}</p>
        </div>
      </div>
    )
  }

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
