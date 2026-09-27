/**
 * OFFLINE CANVAS COMPOSITOR
 * -------------------------
 * Paints a template (see templateSchema.js) onto a <canvas> using only the 2D
 * API. No network, no AI — pure algorithms, so it runs offline. Given a
 * template + resolved fields + the two swappable images, it produces a
 * pixel-perfect, downloadable PNG at any output size.
 */

import { expandFields } from './templateSchema.js'

/** Load an image source (URL / dataURL / Blob URL) into an HTMLImageElement. */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    if (!src) return resolve(null)
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${String(src).slice(0, 40)}`))
    img.src = src
  })
}

/** Convert an uploaded/captured File or Blob to a clean PNG data-URL. */
export async function fileToPngDataUrl(file, { maxSize = 1200, removeBg = false, tolerance = 44 } = {}) {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)
  let canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h)
  bitmap.close?.()
  if (removeBg) {
    removeUniformBackground(canvas, { tolerance, feather: true })
    canvas = autoTrim(canvas)
  }
  return canvas.toDataURL('image/png')
}

/**
 * Re-run background removal on an existing image data-URL at a given strength.
 * Used by the karyakarta photo step to let the user calibrate the cutout live
 * against the ORIGINAL photo (so quality doesn't degrade with repeated passes).
 */
export async function removeBgFromDataUrl(src, { tolerance = 44 } = {}) {
  const img = await loadImage(src)
  if (!img) return src
  let cv = document.createElement('canvas')
  cv.width = img.naturalWidth
  cv.height = img.naturalHeight
  cv.getContext('2d').drawImage(img, 0, 0)
  removeUniformBackground(cv, { tolerance, feather: true })
  cv = autoTrim(cv)
  return cv.toDataURL('image/png')
}

/**
 * Remove a near-uniform background (white / studio / painted-checkerboard) by
 * flood-filling inward from the image edges and zeroing alpha on pixels close
 * to the corner colour. Offline, no AI — best for plain backgrounds.
 */
export function removeUniformBackground(canvas, { tolerance = 42, feather = false } = {}) {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext('2d')
  const img = ctx.getImageData(0, 0, W, H)
  const d = img.data

  // Sample a palette of colours all around the border (not just the corners),
  // deduped — handles backgrounds that vary slightly across the edges.
  const seen = new Set()
  const palette = []
  const addSample = (x, y) => {
    const i = (y * W + x) * 4
    const key = (d[i] >> 3) + '_' + (d[i + 1] >> 3) + '_' + (d[i + 2] >> 3)
    if (!seen.has(key)) { seen.add(key); palette.push([d[i], d[i + 1], d[i + 2]]) }
  }
  // 8 fixed edge samples (corners + edge midpoints) — enough to cover a slightly
  // varying background, but bounded so matching stays fast.
  const hw = W >> 1
  const hh = H >> 1
  for (const [x, y] of [[1, 1], [hw, 1], [W - 2, 1], [1, hh], [W - 2, hh], [1, H - 2], [hw, H - 2], [W - 2, H - 2]]) {
    addSample(x, y)
  }

  // Distance (max colour-channel difference) from a pixel to the NEAREST
  // background sample. Small = background-like, large = clearly the subject.
  const distToBg = (i) => {
    let best = 255
    for (let k = 0; k < palette.length; k++) {
      const p = palette[k]
      const dd = Math.max(Math.abs(d[i] - p[0]), Math.abs(d[i + 1] - p[1]), Math.abs(d[i + 2] - p[2]))
      if (dd < best) best = dd
    }
    return best
  }

  // Flood-fill inward from the border, clearing only pixels that are clearly
  // background (distance within tolerance) AND connected to the edge.
  const visited = new Uint8Array(W * H)
  const stack = []
  for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x) }
  for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1) }
  while (stack.length) {
    const p = stack.pop()
    if (visited[p]) continue
    const i = p * 4
    if (distToBg(i) > tolerance) continue
    visited[p] = 1
    d[i + 3] = 0
    const x = p % W
    const y = (p / W) | 0
    if (x + 1 < W) stack.push(p + 1)
    if (x - 1 >= 0) stack.push(p - 1)
    if (y + 1 < H) stack.push(p + W)
    if (y - 1 >= 0) stack.push(p - W)
  }

  // Edge calibration: for the thin band of kept pixels bordering the cleared
  // region, set a SOFT alpha from each pixel's colour distance to the
  // background — a smoothstep matte. Background-like fringe fades out; true
  // subject stays solid; the transition is anti-aliased. This follows the real
  // subject edge instead of a hard staircase, and removes the colour halo.
  if (feather) {
    const outer = tolerance + 26 // width of the soft transition band
    const base = new Uint8ClampedArray(W * H)
    for (let p = 0; p < W * H; p++) base[p] = d[p * 4 + 3]
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const p = y * W + x
        if (base[p] === 0) continue
        let edge = false
        for (let dy = -1; dy <= 1 && !edge; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue
            if (base[ny * W + nx] === 0) { edge = true; break }
          }
        }
        if (!edge) continue
        const dd = distToBg(p * 4)
        let a = (dd - tolerance) / (outer - tolerance) // 0 at the cut, 1 clearly subject
        a = a < 0 ? 0 : a > 1 ? 1 : a
        a = a * a * (3 - 2 * a) // smoothstep for a natural edge
        d[p * 4 + 3] = Math.round(base[p] * a)
      }
    }
  }

  ctx.putImageData(img, 0, 0)
  return canvas
}

/** Crop the bottom `pct` fraction off a canvas (used to drop baked caption bars). */
function cropBottom(canvas, pct) {
  if (!pct) return canvas
  const W = canvas.width
  const nh = Math.round(canvas.height * (1 - pct))
  const out = document.createElement('canvas')
  out.width = W
  out.height = nh
  out.getContext('2d').drawImage(canvas, 0, 0, W, nh, 0, 0, W, nh)
  return out
}

/** Crop a canvas to the bounding box of its non-transparent pixels. */
export function autoTrim(canvas, alphaThresh = 12) {
  const W = canvas.width
  const H = canvas.height
  const d = canvas.getContext('2d').getImageData(0, 0, W, H).data
  let minX = W, minY = H, maxX = 0, maxY = 0, found = false
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (d[(y * W + x) * 4 + 3] > alphaThresh) {
        found = true
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (!found) return canvas
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const out = document.createElement('canvas')
  out.width = w
  out.height = h
  out.getContext('2d').drawImage(canvas, minX, minY, w, h, 0, 0, w, h)
  return out
}

// Cache cleaned supplied assets by (src + options) so flood-fill runs once.
const _cleanCache = new Map()

/**
 * Clean a supplied asset URL: optionally drop a baked caption bar and remove a
 * uniform background, then trim to content. Returns a PNG data-URL (memoised).
 */
export async function cleanAssetToDataURL(src, { removeBg = false, trimBottom = 0, tolerance = 40 } = {}) {
  const key = `${src}|${removeBg}|${trimBottom}|${tolerance}`
  if (_cleanCache.has(key)) return _cleanCache.get(key)
  const img = await loadImage(src).catch(() => null)
  if (!img) { _cleanCache.set(key, src); return src }
  let cv = document.createElement('canvas')
  cv.width = img.naturalWidth
  cv.height = img.naturalHeight
  cv.getContext('2d').drawImage(img, 0, 0)
  cv = cropBottom(cv, trimBottom)
  if (removeBg) {
    removeUniformBackground(cv, { tolerance })
    cv = autoTrim(cv)
  }
  const url = cv.toDataURL('image/png')
  _cleanCache.set(key, url)
  return url
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + radius, y)
  ctx.arcTo(x + w, y, x + w, y + h, radius)
  ctx.arcTo(x + w, y + h, x, y + h, radius)
  ctx.arcTo(x, y + h, x, y, radius)
  ctx.arcTo(x, y, x + w, y, radius)
  ctx.closePath()
}

/** Draw an image cropped to fill (cover) or fit (contain) a box. */
function drawImageBox(ctx, img, x, y, w, h, fit = 'cover') {
  if (fit === 'fill') {
    ctx.drawImage(img, x, y, w, h)
    return
  }
  const ir = img.width / img.height
  const br = w / h
  let sx = 0, sy = 0, sw = img.width, sh = img.height
  if (fit === 'cover') {
    if (ir > br) {
      sw = img.height * br
      sx = (img.width - sw) / 2
    } else {
      sh = img.width / br
      sy = (img.height - sh) / 2
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
  } else {
    // contain
    let dw = w, dh = h
    if (ir > br) dh = w / ir
    else dw = h * ir
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh)
  }
}

/** A clean, professional icon placeholder for an empty photo slot. */
function drawSlotPlaceholder(ctx, x, y, w, h, slot) {
  const r = Math.min(w, h) * 0.05
  ctx.fillStyle = '#eef2f7'
  roundRect(ctx, x, y, w, h, r)
  ctx.fill()
  ctx.strokeStyle = '#cbd5e1'
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.012)
  ctx.setLineDash([Math.min(w, h) * 0.05, Math.min(w, h) * 0.035])
  roundRect(ctx, x, y, w, h, r)
  ctx.stroke()
  ctx.setLineDash([])

  const cx = x + w / 2
  const cy = y + h / 2
  const s = Math.min(w, h) * 0.3
  ctx.fillStyle = '#9aa8bd'
  if (slot === 'karyakartaPhoto') {
    // person silhouette (head + shoulders)
    ctx.beginPath()
    ctx.arc(cx, cy - s * 0.45, s * 0.42, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.arc(cx, cy + s * 0.75, s * 0.78, Math.PI, 0)
    ctx.fill()
  } else {
    // image icon (frame + sun + mountain)
    ctx.strokeStyle = '#9aa8bd'
    ctx.lineWidth = Math.max(2, s * 0.12)
    roundRect(ctx, cx - s, cy - s * 0.8, s * 2, s * 1.6, s * 0.15)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(cx - s * 0.4, cy - s * 0.3, s * 0.22, 0, Math.PI * 2)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(cx - s * 0.85, cy + s * 0.65)
    ctx.lineTo(cx - s * 0.1, cy - s * 0.1)
    ctx.lineTo(cx + s * 0.85, cy + s * 0.65)
    ctx.closePath()
    ctx.fill()
  }
}

/** Wrap text into lines that fit `maxWidth`, capped at `maxLines` (ellipsis). */
function wrapText(ctx, text, maxWidth, maxLines) {
  const words = String(text || '').split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines - 1) break
    } else {
      line = test
    }
  }
  if (line && lines.length < maxLines) lines.push(line)
  // Handle overflow with ellipsis on the last line
  const remaining = words.slice(lines.join(' ').split(/\s+/).length)
  if (remaining.length && lines.length) {
    let last = lines[lines.length - 1]
    while (ctx.measureText(last + '…').width > maxWidth && last.length) {
      last = last.slice(0, -1)
    }
    lines[lines.length - 1] = last + '…'
  }
  return lines
}

/**
 * Render one template onto `canvas`.
 * @param {HTMLCanvasElement} canvas
 * @param {object} template
 * @param {{width:number, height:number}} format
 * @param {{karyakartaPhoto?:HTMLImageElement, issuePhoto?:HTMLImageElement}} images
 * @param {object} fields  resolved (see resolveFields)
 */
export function renderTemplate(canvas, template, format, images, fields, opts = {}) {
  const W = format.width
  const H = format.height
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, W, H)
  const f = expandFields(fields)

  for (const layer of template.layers) {
    const x = (layer.x ?? 0) * W
    const y = (layer.y ?? 0) * H
    const w = (layer.w ?? 1) * W
    const h = (layer.h ?? 1) * H

    if (layer.type === 'rect') {
      ctx.fillStyle = layer.fill || '#000'
      if (layer.radius) {
        roundRect(ctx, x, y, w, h, layer.radius * W)
        ctx.fill()
      } else {
        ctx.fillRect(x, y, w, h)
      }
    } else if (layer.type === 'stripes') {
      const colors = layer.colors || ['#000']
      if (layer.vertical) {
        const sw = w / colors.length
        colors.forEach((c, i) => {
          ctx.fillStyle = c
          ctx.fillRect(x + i * sw, y, sw + 1, h)
        })
      } else {
        const sh = h / colors.length
        colors.forEach((c, i) => {
          ctx.fillStyle = c
          ctx.fillRect(x, y + i * sh, w, sh + 1)
        })
      }
    } else if (layer.type === 'image') {
      const img = layer.slot ? images[layer.slot] : layer._loaded
      const rot = ((layer.rotation || 0) * Math.PI) / 180
      const rotated = rot !== 0
      if (rotated) {
        ctx.save()
        ctx.translate(x + w / 2, y + h / 2)
        ctx.rotate(rot)
        ctx.translate(-(x + w / 2), -(y + h / 2))
      }
      // Per-slot user transform (karyakarta can zoom/rotate/flip/reposition their
      // photo within its slot at generate time). Only the image moves; the slot
      // frame/border stays put, and the photo is clipped to the slot box.
      const adj = (layer.slot && opts.adjust && opts.adjust[layer.slot]) || null
      ctx.save()
      if (layer.shape === 'circle') {
        ctx.beginPath()
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
        ctx.clip()
      } else if (layer.radius) {
        roundRect(ctx, x, y, w, h, layer.radius * W)
        ctx.clip()
      } else if (adj) {
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()
      }
      if (adj) {
        const cx = x + w / 2
        const cy = y + h / 2
        ctx.translate(cx + (adj.offsetX || 0) * w, cy + (adj.offsetY || 0) * h)
        ctx.rotate(((adj.rotate || 0) * Math.PI) / 180)
        ctx.scale((adj.flipH ? -1 : 1) * (adj.scale || 1), (adj.flipV ? -1 : 1) * (adj.scale || 1))
        ctx.translate(-cx, -cy)
      }
      if (img) {
        drawImageBox(ctx, img, x, y, w, h, layer.fit)
      } else {
        drawSlotPlaceholder(ctx, x, y, w, h, layer.slot)
      }
      ctx.restore()
      if (layer.border) {
        ctx.strokeStyle = layer.border
        ctx.lineWidth = layer.borderWidth ? layer.borderWidth * W : Math.max(2, W * 0.006)
        if (layer.shape === 'circle') {
          ctx.beginPath()
          ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2)
          ctx.stroke()
        } else if (layer.radius) {
          roundRect(ctx, x, y, w, h, layer.radius * W)
          ctx.stroke()
        } else {
          ctx.strokeRect(x, y, w, h)
        }
      }
      if (rotated) ctx.restore()
    } else if (layer.type === 'text') {
      const isPlaceholder = opts.placeholder && layer.bind
      let value = layer.text != null ? layer.text : f[layer.bind]
      if (value == null) value = ''
      if (layer.uppercase) value = String(value).toUpperCase()
      const fontPx = Math.round((layer.size || 0.03) * H)
      const family = layer.font
        ? `${layer.font}, 'Noto Sans Devanagari', sans-serif`
        : layer.devanagari
          ? "'Noto Sans Devanagari', Inter, sans-serif"
          : 'Inter, sans-serif'
      ctx.font = `${layer.weight || 500} ${fontPx}px ${family}`
      ctx.fillStyle = isPlaceholder ? '#9aa8bd' : layer.color || '#0f172a'
      ctx.textAlign = layer.align || 'left'
      ctx.textBaseline = 'top'
      const lines = wrapText(ctx, value, w, layer.maxLines || 3)
      const lineHeight = fontPx * (layer.lineHeight || 1.25)
      const tx = layer.align === 'center' ? x + w / 2 : layer.align === 'right' ? x + w : x
      if (layer.strokeColor && !isPlaceholder) {
        ctx.strokeStyle = layer.strokeColor
        ctx.lineWidth = (layer.strokeWidth || 0.004) * H
        ctx.lineJoin = 'round'
        lines.forEach((ln, i) => ctx.strokeText(ln, tx, y + i * lineHeight))
      }
      lines.forEach((ln, i) => ctx.fillText(ln, tx, y + i * lineHeight))
    }
  }
  return canvas
}

/**
 * Full render: resolves fixed-asset images referenced by `src`, loads the
 * swappable images, and paints. Returns the canvas.
 */
export async function composeToCanvas(canvas, template, format, sources, fields, opts = {}) {
  // Ensure any chosen fonts are loaded before the canvas draws text (otherwise
  // the canvas silently falls back to a default face).
  if (typeof document !== 'undefined' && document.fonts) {
    const needed = new Set()
    for (const l of template.layers) {
      if (l.type !== 'text') continue
      const fam = l.font || (l.devanagari ? "'Noto Sans Devanagari'" : 'Inter')
      needed.add(`${l.weight || 500} 40px ${fam}`)
    }
    await Promise.all([...needed].map((f) => document.fonts.load(f).catch(() => {})))
  }
  // Clean (optional) + preload any fixed-asset images declared with a `src`
  await Promise.all(
    template.layers
      .filter((l) => l.type === 'image' && l.src && !l.slot)
      .map(async (l) => {
        const s = l.clean ? await cleanAssetToDataURL(l.src, l.clean) : l.src
        l._loaded = await loadImage(s).catch(() => null)
      }),
  )
  // Slot images: uploads (data-URLs) are already processed; supplied-asset URLs
  // get cleaned per the template's slotClean config.
  const slotClean = template.slotClean || {}
  const prepSlot = async (slot, src) => {
    if (!src) return null
    let s = src
    if (slotClean[slot] && !src.startsWith('data:')) {
      s = await cleanAssetToDataURL(src, slotClean[slot])
    }
    return loadImage(s).catch(() => null)
  }
  const [karyakartaPhoto, issuePhoto] = await Promise.all([
    prepSlot('karyakartaPhoto', sources.karyakartaPhoto),
    prepSlot('issuePhoto', sources.issuePhoto),
  ])
  return renderTemplate(canvas, template, format, { karyakartaPhoto, issuePhoto }, fields, opts)
}

/** Scale a source canvas to fit (contain, centered) onto a WxH canvas over `bg`. */
export function fitOnto(srcCanvas, W, H, bg = '#ffffff') {
  const out = document.createElement('canvas')
  out.width = W
  out.height = H
  const ctx = out.getContext('2d')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)
  const s = Math.min(W / srcCanvas.width, H / srcCanvas.height)
  const w = srcCanvas.width * s
  const h = srcCanvas.height * s
  ctx.drawImage(srcCanvas, (W - w) / 2, (H - h) / 2, w, h)
  return out
}

/** Trigger a browser download of the current canvas as a PNG file. */
export function downloadCanvasPng(canvas, filename = 'graphic.png') {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL('image/png')
  link.click()
}
