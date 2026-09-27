import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseIcon, DownloadIcon, UploadIcon } from './icons.jsx'
import PhotoInput from './PhotoInput.jsx'
import { getIssuePhotoLibrary, getIssues } from '../data/mockData.js'
import { resolveFields, templateFormat } from '../lib/templateSchema.js'
import { composeToCanvas, downloadCanvasPng, fileToPngDataUrl, fitOnto } from '../lib/compositor.js'
import { photoPlaceholder } from '../lib/placeholders.js'
import { pickText, getTextsForCategory } from '../lib/store.js'
import { warmupBgModel } from '../lib/bgRemoveML.js'
import { useLang } from '../lib/i18n.jsx'

function libraryPhotoSrc(item) {
  if (!item) return ''
  return item.src || photoPlaceholder(item.label, item.category)
}

// Per-photo transform the karyakarta can tweak within a slot.
const DEFAULT_ADJUST = { scale: 1, rotate: 0, flipH: false, flipV: false, offsetX: 0, offsetY: 0 }
const normDeg = (d) => (((d + 180) % 360) + 360) % 360 - 180

/** Size / rotate / flip / reposition controls for one photo slot. */
function AdjustPanel({ value, onChange, t }) {
  const set = (patch) => onChange({ ...value, ...patch })
  const btn = 'rounded-md border px-2.5 py-1 text-[11px] font-medium'
  const off = 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
  const on = 'border-[#12306e] bg-[#12306e] text-white'
  const lbl = 'block text-[11px] font-medium text-slate-500'
  return (
    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-600">{t('adjustPhoto')}</span>
        <button type="button" onClick={() => onChange({ ...DEFAULT_ADJUST })} className="text-[11px] text-slate-500 underline hover:text-slate-700">
          {t('resetWord')}
        </button>
      </div>
      <label className={lbl}>
        {t('sizeLabel')}
        <input type="range" min="0.4" max="2.5" step="0.05" value={value.scale}
          onChange={(e) => set({ scale: +e.target.value })} className="mt-1 w-full accent-[#12306e]" />
      </label>
      <label className={lbl}>
        {t('rotateLabel')} ({Math.round(value.rotate)}°)
        <input type="range" min="-180" max="180" step="1" value={value.rotate}
          onChange={(e) => set({ rotate: +e.target.value })} className="mt-1 w-full accent-[#12306e]" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className={lbl}>
          {t('moveXLabel')}
          <input type="range" min="-0.5" max="0.5" step="0.02" value={value.offsetX}
            onChange={(e) => set({ offsetX: +e.target.value })} className="mt-1 w-full accent-[#12306e]" />
        </label>
        <label className={lbl}>
          {t('moveYLabel')}
          <input type="range" min="-0.5" max="0.5" step="0.02" value={value.offsetY}
            onChange={(e) => set({ offsetY: +e.target.value })} className="mt-1 w-full accent-[#12306e]" />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => set({ rotate: normDeg((value.rotate || 0) + 90) })} className={`${btn} ${off}`}>{t('rotate90')}</button>
        <button type="button" onClick={() => set({ flipH: !value.flipH })} className={`${btn} ${value.flipH ? on : off}`}>{t('flipHLabel')}</button>
        <button type="button" onClick={() => set({ flipV: !value.flipV })} className={`${btn} ${value.flipV ? on : off}`}>{t('flipVLabel')}</button>
      </div>
    </div>
  )
}

/**
 * Simple fill flow: add the two photos (yours + the issue). Everything else —
 * name, village, headline — fills automatically. Then download.
 */
export default function GenerateModal({ template, karyakarta, onGenerated, onClose }) {
  const { t } = useLang()
  const library = getIssuePhotoLibrary()
  const issues = useMemo(() => getIssues(), [])
  const canvasRef = useRef(null)
  const fmt = templateFormat(template) // native size of this poster
  const countedRef = useRef(false) // spend one free credit per design, not per download

  const [karyakartaPhoto, setKaryakartaPhoto] = useState('')
  const [kAdjust, setKAdjust] = useState(DEFAULT_ADJUST)
  const [iAdjust, setIAdjust] = useState(DEFAULT_ADJUST)
  const [selectedIssueId, setSelectedIssueId] = useState(issues[0]?.id || null)
  const [issuePhotoId, setIssuePhotoId] = useState(issues[0]?.photoId || null)
  const [issueUpload, setIssueUpload] = useState('')
  const [rendering, setRendering] = useState(false)
  // null = use the auto value; otherwise the karyakarta's chosen library line.
  const [chosenTitle, setChosenTitle] = useState(null)
  const [chosenDesc, setChosenDesc] = useState(null)
  const issueFileRef = useRef(null)

  // Warm up the background-removal model as soon as the editor opens, so it's
  // ready by the time the karyakarta adds their photo.
  useEffect(() => { warmupBgModel() }, [])

  // Selecting a reported issue gives the auto-fill CONTEXT: category (→ headline),
  // description, booth/village, and the issue photo.
  const selectedIssue = issues.find((i) => i.id === selectedIssueId)
  const selectedLibItem = library.find((p) => p.id === issuePhotoId)
  const issueCategory = selectedIssue?.category || selectedLibItem?.category || 'general'
  const issueSrc = issueUpload || libraryPhotoSrc(selectedLibItem) || template.slotDefaults?.issuePhoto || ''
  const karyakartaSrc = karyakartaPhoto || template.slotDefaults?.karyakartaPhoto || ''

  // Library lines for this issue (+ general) that the karyakarta can choose from.
  const libLines = useMemo(() => getTextsForCategory(issueCategory), [issueCategory])
  const autoHeadline = useMemo(
    () => pickText(issueCategory, { kind: 'headline' })?.text || pickText(issueCategory, {})?.text || '',
    [issueCategory],
  )
  const autoDescription = selectedIssue?.description || selectedLibItem?.description || ''
  const title = chosenTitle ?? autoHeadline
  const description = chosenDesc ?? autoDescription

  function onIssueChange(e) {
    const id = e.target.value
    setSelectedIssueId(id)
    const iss = issues.find((i) => i.id === id)
    if (iss) { setIssuePhotoId(iss.photoId); setIssueUpload('') }
    setChosenTitle(null)
    setChosenDesc(null)
  }

  const fields = useMemo(
    () => ({ ...resolveFields(selectedIssue, karyakarta), title, description }),
    [selectedIssue, karyakarta, title, description],
  )
  const adjust = useMemo(
    () => ({ karyakartaPhoto: kAdjust, issuePhoto: iAdjust }),
    [kAdjust, iAdjust],
  )

  useEffect(() => {
    let cancelled = false
    setRendering(true)
    composeToCanvas(canvasRef.current, template, fmt, { karyakartaPhoto: karyakartaSrc, issuePhoto: issueSrc }, fields, { adjust })
      .catch(() => {})
      .finally(() => !cancelled && setRendering(false))
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id, karyakartaSrc, issueSrc, title, description, adjust])

  async function onIssueUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setIssueUpload(await fileToPngDataUrl(file, { removeBg: false }))
    setIssuePhotoId(null)
  }

  async function renderNative() {
    const canvas = document.createElement('canvas')
    await composeToCanvas(canvas, template, fmt, { karyakartaPhoto: karyakartaSrc, issuePhoto: issueSrc }, fields, { adjust })
    return canvas
  }
  // One design = one free credit, whether they download Poster, WhatsApp, or both.
  function countOnce() {
    if (!countedRef.current) { countedRef.current = true; onGenerated?.() }
  }
  async function downloadPoster() {
    downloadCanvasPng(await renderNative(), 'poster.png')
    countOnce()
  }
  async function downloadWhatsApp() {
    // Fit the poster (native aspect) onto a 9:16 status canvas, no distortion.
    downloadCanvasPng(fitOnto(await renderNative(), 1080, 1920, '#ffffff'), 'poster-whatsapp.png')
    countOnce()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-[#12306e]">{t('addPhotos')}</h2>
            <p className="text-xs text-slate-500">{t('autoFillNote')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100">
            <CloseIcon />
          </button>
        </div>

        <div className="grid flex-1 grid-cols-1 gap-0 overflow-hidden md:grid-cols-2">
          {/* Two photo inputs */}
          <div className="space-y-6 overflow-y-auto border-r border-slate-100 p-5">
            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('selectIssue')}</h3>
              <select
                value={selectedIssueId ?? ''}
                onChange={onIssueChange}
                className="devanagari w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]"
              >
                {issues.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.categoryLabel} · {i.booth} — {i.description.slice(0, 40)}…
                  </option>
                ))}
              </select>
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('yourPhoto')}</h3>
              <PhotoInput value={karyakartaPhoto} onChange={setKaryakartaPhoto} />
              {karyakartaPhoto && <AdjustPanel value={kAdjust} onChange={setKAdjust} t={t} />}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('issuePhotoStep')}</h3>
              <button
                type="button"
                onClick={() => issueFileRef.current?.click()}
                className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <UploadIcon className="h-3.5 w-3.5" /> {t('uploadIssue')}
              </button>
              <input ref={issueFileRef} type="file" accept="image/*" className="hidden" onChange={onIssueUpload} />
              <p className="mb-1 text-xs text-slate-400">{t('orPickLibrary')}</p>
              <div className="grid grid-cols-4 gap-2">
                {library.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setIssuePhotoId(p.id); setIssueUpload('') }}
                    title={p.label}
                    className={`overflow-hidden rounded-lg border-2 ${
                      !issueUpload && p.id === issuePhotoId ? 'border-blue-500' : 'border-transparent'
                    }`}
                  >
                    <img src={libraryPhotoSrc(p)} alt={p.label} className="aspect-square w-full object-cover" />
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-400">{t('autoFillNote')}</p>
              {issueSrc && <AdjustPanel value={iAdjust} onChange={setIAdjust} t={t} />}
            </section>

            <section>
              <h3 className="mb-2 text-sm font-semibold text-slate-800">{t('headlineLabel')}</h3>
              <select
                value={chosenTitle ?? ''}
                onChange={(e) => setChosenTitle(e.target.value || null)}
                className="devanagari w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]"
              >
                <option value="">{t('autoOption')}{autoHeadline ? ` — ${autoHeadline}` : ''}</option>
                {libLines.map((l) => <option key={l.id} value={l.text}>{l.text}</option>)}
              </select>

              <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-800">{t('descriptionLabel')}</h3>
              <select
                value={chosenDesc ?? ''}
                onChange={(e) => setChosenDesc(e.target.value || null)}
                className="devanagari w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#12306e]"
              >
                <option value="">{t('autoOption')}{autoDescription ? ` — ${autoDescription.slice(0, 40)}…` : ''}</option>
                {libLines.map((l) => <option key={l.id} value={l.text}>{l.text}</option>)}
              </select>
            </section>
          </div>

          {/* Preview + downloads */}
          <div className="flex flex-col overflow-y-auto bg-slate-50 p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {t('preview')} {rendering && <span className="text-slate-400">· {t('updating')}</span>}
            </h3>
            <div className="flex flex-1 items-center justify-center">
              <canvas ref={canvasRef} className="max-h-[56vh] max-w-full rounded-lg border border-slate-200 bg-white shadow-sm" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={downloadPoster}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#12306e] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0e2757]"
              >
                <DownloadIcon className="h-4 w-4" /> {t('poster')}
              </button>
              <button
                type="button"
                onClick={downloadWhatsApp}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2f9e44] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#278139]"
              >
                <DownloadIcon className="h-4 w-4" /> {t('whatsapp')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
