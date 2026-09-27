import { useMemo, useState } from 'react'
import GatingBanner from './components/GatingBanner.jsx'
import PosterThumb from './components/PosterThumb.jsx'
import GenerateModal from './components/GenerateModal.jsx'
import TricolourBar from './components/TricolourBar.jsx'
import { MountainMark } from './components/icons.jsx'
import { useLang, LanguageToggle } from './lib/i18n.jsx'
import { getStudioState, isStudioUnlocked } from './data/mockData.js'
import { getLiveTemplates, pickText, getFreeGraphicsUsed, incrementFreeGraphicsUsed, FREE_GRAPHICS_LIMIT } from './lib/store.js'

/**
 * The entire app: pick a ready-made poster, add two photos, download.
 * Generation stays locked (reward) until the karyakarta's daily tasks are done.
 */
export default function KaryakartaStudio() {
  const { t, lang } = useLang()
  const studio = useMemo(() => getStudioState(), [])
  const templates = useMemo(() => getLiveTemplates(), [])
  const previewHeadline = useMemo(() => pickText('general', { kind: 'headline' })?.text || '', [])
  const categories = useMemo(
    () => [...new Set(templates.map((t) => t.category).filter(Boolean))],
    [templates],
  )

  const [demoUnlock, setDemoUnlock] = useState(false)
  const [freeUsed, setFreeUsed] = useState(() => getFreeGraphicsUsed())
  // Fully unlocked when daily tasks are done (or demo). Otherwise the first few
  // graphics are still free; after that the reward gate applies.
  const taskUnlocked = demoUnlock || isStudioUnlocked(studio.progress)
  const freeLeft = Math.max(0, FREE_GRAPHICS_LIMIT - freeUsed)
  const unlocked = taskUnlocked || freeLeft > 0
  // A generated graphic only spends a free credit when the karyakarta is relying
  // on the trial (not when tasks are already complete).
  const onGenerated = () => { if (!taskUnlocked) setFreeUsed(incrementFreeGraphicsUsed()) }
  const [chosen, setChosen] = useState(null)
  const [catFilter, setCatFilter] = useState('all')
  const shown = catFilter === 'all' ? templates : templates.filter((t) => t.category === catFilter)

  return (
    <div className="min-h-screen">
      <TricolourBar />
      <div className="mx-auto max-w-4xl px-6 py-8">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#12306e] text-white shadow-sm">
              <MountainMark className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#12306e]">{t('appTitle')}</h1>
              <p className={`mt-0.5 text-sm text-slate-500 ${lang === 'hi' ? 'devanagari' : ''}`}>{t('appSubtitle')}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <LanguageToggle />
            <label className="flex select-none items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-500 shadow-sm">
              <input
                type="checkbox"
                checked={demoUnlock}
                onChange={(e) => setDemoUnlock(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-slate-300 text-[#12306e]"
              />
              {t('demoToggle')}
            </label>
          </div>
        </header>

        {!taskUnlocked && <GatingBanner progress={studio.progress} freeLeft={freeLeft} />}

        <h2 className="mb-3 text-sm font-semibold text-slate-900">{t('choosePoster')}</h2>

        {categories.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {['all', ...categories].map((c) => (
              <button
                key={c}
                onClick={() => setCatFilter(c)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  catFilter === c ? 'bg-[#12306e] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c === 'all' ? t('all') : c}
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {shown.length === 0 && <p className="text-sm text-slate-400">{t('noPosters')}</p>}
          {shown.map((t) => (
            <PosterThumb
              key={t.id}
              template={t}
              karyakarta={studio.karyakarta}
              headline={previewHeadline}
              selected={chosen?.id === t.id}
              disabled={!unlocked}
              onSelect={setChosen}
            />
          ))}
        </div>

        {!unlocked && <p className="mt-4 text-xs text-slate-400">{t('lockedNote')}</p>}
      </div>

      {/* Opening is gated by the disabled thumbs; once open, keep the modal until
          the karyakarta closes it (so spending the last free credit mid-session
          doesn't yank the window away). */}
      {chosen && (
        <GenerateModal
          template={chosen}
          karyakarta={studio.karyakarta}
          onGenerated={onGenerated}
          onClose={() => setChosen(null)}
        />
      )}
    </div>
  )
}
