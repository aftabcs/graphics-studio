import { useEffect, useRef, useState } from 'react'
import { CameraIcon, UploadIcon, CloseIcon, CheckIcon } from './icons.jsx'
import { fileToPngDataUrl, removeBgFromDataUrl } from '../lib/compositor.js'
import { mlRemoveBackground } from '../lib/bgRemoveML.js'
import { getMyPhotos, saveMyPhoto, deleteMyPhoto } from '../lib/store.js'
import { useLang } from '../lib/i18n.jsx'

/**
 * Karyakarta photo input. Background removal uses on-device ML (@imgly) for clean
 * cutouts, keeping the ORIGINAL photo so re-toggling never degrades quality. If
 * the model can't load (e.g. first-ever use offline), it falls back to the
 * algorithmic remover.
 */
export default function PhotoInput({ value, onChange }) {
  const { t } = useLang()
  const [mode, setMode] = useState('idle') // 'idle' | 'camera'
  const [error, setError] = useState('')
  const [removeBg, setRemoveBg] = useState(true)
  const [original, setOriginal] = useState('') // raw photo, before removal
  const [processing, setProcessing] = useState(false)
  const [savedPhotos, setSavedPhotos] = useState(() => getMyPhotos())
  const [justSaved, setJustSaved] = useState(false)
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const fileRef = useRef(null)

  useEffect(() => () => stopCamera(), [])

  // Recompute the cutout from the original whenever the toggle changes.
  useEffect(() => {
    if (!original) return
    let cancelled = false
    ;(async () => {
      if (!removeBg) { onChange(original); return }
      setProcessing(true)
      let out
      try {
        out = await mlRemoveBackground(original)
      } catch {
        out = await removeBgFromDataUrl(original, { tolerance: 24 }).catch(() => original)
      }
      if (!cancelled) { onChange(out); setProcessing(false) }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [original, removeBg])

  function stopCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop())
    streamRef.current = null
  }

  async function startCamera() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
      streamRef.current = stream
      setMode('camera')
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().catch(() => {})
        }
      })
    } catch {
      setError(t('cameraUnavailable'))
      setMode('idle')
    }
  }

  function capture() {
    const video = videoRef.current
    if (!video) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    setOriginal(canvas.toDataURL('image/png')) // raw; effect applies removal
    stopCamera()
    setMode('idle')
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      setOriginal(await fileToPngDataUrl(file, { removeBg: false })) // raw
    } catch {
      setError(t('couldNotRead'))
    }
  }

  function clearPhoto() {
    setOriginal('')
    onChange('')
  }

  function saveCurrent() {
    if (!value) return
    setSavedPhotos(saveMyPhoto(value))
    setJustSaved(true)
    setTimeout(() => setJustSaved(false), 1500)
  }

  // Reuse a saved cutout directly — it's already processed, so skip re-removal.
  function useSaved(dataUrl) {
    setOriginal('')
    onChange(dataUrl)
  }

  function removeSaved(e, dataUrl) {
    e.stopPropagation()
    setSavedPhotos(deleteMyPhoto(dataUrl))
  }

  return (
    <div>
      {savedPhotos.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-[11px] text-slate-500">{t('savedPhotos')}</p>
          <div className="flex flex-wrap gap-2">
            {savedPhotos.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => useSaved(p)}
                className={`relative h-12 w-12 overflow-hidden rounded-lg border bg-slate-100 hover:border-[#12306e] ${value === p ? 'border-[#12306e] ring-2 ring-[#12306e]/20' : 'border-slate-200'}`}
              >
                <img src={p} alt="saved" className="h-full w-full object-cover" />
                <span
                  onClick={(e) => removeSaved(e, p)}
                  className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl bg-black/50 text-[11px] leading-none text-white"
                >
                  ×
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100">
          {value ? (
            <img src={value} alt="karyakarta" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">{t('noPhoto')}</div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <UploadIcon className="h-3.5 w-3.5" /> {t('uploadPhoto')}
          </button>
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <CameraIcon className="h-3.5 w-3.5" /> {t('clickPhoto')}
          </button>
          {value && !processing && (
            <button
              type="button"
              onClick={saveCurrent}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {justSaved ? (
                <>
                  <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> {t('savedWord')}
                </>
              ) : (
                t('savePhoto')
              )}
            </button>
          )}
          {(value || original) && (
            <button type="button" onClick={clearPhoto} className="text-left text-xs text-slate-400 hover:text-slate-600">
              {t('removeWord')}
            </button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      </div>

      {/* Background removal + calibration */}
      <label className="mt-3 flex items-center gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={removeBg}
          onChange={(e) => setRemoveBg(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-slate-300 text-[#12306e]"
        />
        {t('removeBg')} {processing && <span className="text-slate-400">· {t('processing')}</span>}
      </label>
      {original && removeBg && <p className="mt-1 text-[10px] text-slate-400">{t('bgOnDevice')}</p>}

      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}

      {mode === 'camera' && (
        <div className="mt-3 rounded-lg border border-slate-200 p-2">
          <div className="relative overflow-hidden rounded-md bg-black">
            <video ref={videoRef} className="mx-auto max-h-56 w-full object-contain" playsInline muted />
            <button
              type="button"
              onClick={() => { stopCamera(); setMode('idle') }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={capture}
            className="mt-2 w-full rounded-lg bg-[#12306e] py-2 text-sm font-semibold text-white hover:bg-[#0e2757]"
          >
            {t('capture')}
          </button>
        </div>
      )}
    </div>
  )
}
