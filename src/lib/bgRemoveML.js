/**
 * On-device ML background removal via @imgly/background-removal.
 * Dynamically imported so the (large) library + model only load when a photo is
 * actually processed — never in the initial bundle. Runs entirely in the
 * browser; the photo never leaves the device. The model + WASM are self-hosted
 * in /public/imgly/, so it runs fully offline with no CDN calls (see mlConfig).
 *
 * Speed: (1) the input is downscaled first — inference time scales with pixel
 * count, and a karyakarta slot on a poster never needs full-res; (2) it runs on
 * the GPU (WebGPU) when available, falling back to CPU/WASM.
 *
 * NOTE: @imgly/background-removal is AGPL-3.0 — fine for open/internal use, but a
 * networked deployment must either open-source the app or hold an IMG.LY
 * commercial licence. The algorithmic remover (removeBgFromDataUrl) remains as a
 * permissive, offline fallback.
 */
import { loadImage } from './compositor.js'

async function downscale(src, maxSize) {
  const img = await loadImage(src)
  if (!img) return src
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  if (scale >= 1) return src
  const cv = document.createElement('canvas')
  cv.width = Math.round(img.naturalWidth * scale)
  cv.height = Math.round(img.naturalHeight * scale)
  cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height)
  return cv.toDataURL('image/png')
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Self-hosted model + WASM (fully offline). The isnet_fp16 model and onnxruntime
// WASM live in /public/imgly/ (with resources.json), so the app never fetches
// from the @imgly CDN — first run and every run work with no internet.
const LOCAL_ASSETS = (typeof location !== 'undefined' ? location.origin : '') + '/imgly/'

const mlConfig = () => ({
  model: 'isnet_fp16',
  publicPath: LOCAL_ASSETS,
  device: typeof navigator !== 'undefined' && navigator.gpu ? 'gpu' : undefined,
})

/**
 * Warm up the model (download + init) ahead of time — call when the editor opens
 * so the cold start overlaps with the karyakarta picking an issue/photo, making
 * the actual removal feel instant. Fire-and-forget; safe to call repeatedly.
 */
let _warming
export function warmupBgModel() {
  if (_warming) return _warming
  _warming = (async () => {
    try {
      const mod = await import('@imgly/background-removal')
      if (mod.preload) await mod.preload(mlConfig())
    } catch {
      /* ignore — falls back at removal time */
    }
  })()
  return _warming
}

export async function mlRemoveBackground(src, { maxSize = 720 } = {}) {
  await warmupBgModel() // reuse the warm model instead of racing a second load
  const small = await downscale(src, maxSize)
  const { removeBackground } = await import('@imgly/background-removal')
  // WebGPU when available; multithreaded WASM via the cross-origin isolation
  // headers in vite.config.js. Model init is warmed by warmupBgModel().
  const blob = await removeBackground(small, { ...mlConfig(), output: { format: 'image/png' } })
  return blobToDataUrl(blob)
}
