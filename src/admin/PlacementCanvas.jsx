import { useEffect, useRef, useState } from 'react'
import { composeToCanvas } from '../lib/compositor.js'
import { templateFormat } from '../lib/templateSchema.js'

// In the builder, text fields show a muted placeholder label (not sample text),
// so they read as "to be filled" — matching the image-slot placeholders.
const PREVIEW_FIELDS = {
  title: 'Headline',
  description: 'Description',
  name: 'Name',
  village: 'Village',
  booth: 'Booth',
}

// Shared canvas context for measuring text so the selection box matches the
// actually-rendered lines (not an overestimate).
const measureCtx = typeof document !== 'undefined' ? document.createElement('canvas').getContext('2d') : null

function countLines(value, ctx, maxWidth, maxLines) {
  const words = String(value || '').split(/\s+/).filter(Boolean)
  let lines = 0
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines++
      line = w
      if (lines === maxLines) return maxLines
    } else {
      line = test
    }
  }
  if (line) lines++
  return Math.min(Math.max(lines, 1), maxLines)
}

/**
 * Places the variable fields over the imported base poster. The base layer
 * (layer with `base: true`, or index 0) is fixed; every other layer gets a
 * draggable/resizable box. Dragging commits fractional x/y on pointer-up; the
 * corner handle sets w/h.
 */
export default function PlacementCanvas({ template, selectedIndex, onSelect, onLayerChange, displayWidth = 380 }) {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)
  const fmt = templateFormat(template)
  const dw = displayWidth
  const dh = Math.round((displayWidth * fmt.height) / fmt.width)
  const [drag, setDrag] = useState(null)

  const key = JSON.stringify({ layers: template.layers, f: fmt })
  useEffect(() => {
    // No slot images in the builder — show clean icon placeholders instead of
    // the sample photos, so admin sees a professional placement guide.
    composeToCanvas(canvasRef.current, template, fmt, {}, PREVIEW_FIELDS, { placeholder: true }).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const isBase = (layer, i) => layer.base || (i === 0 && layer.type === 'image' && !layer.slot)

  function boxStyle(layer) {
    const x = (layer.x ?? 0) * dw
    const y = (layer.y ?? 0) * dh
    const w = (layer.w ?? 0.2) * dw
    let h = (layer.h ?? 0.1) * dh
    if (layer.type === 'text' && measureCtx) {
      // Match the compositor: font size = fraction of height, wrap within width,
      // then size the box to the ACTUAL number of lines drawn.
      const fontPx = (layer.size || 0.03) * dh
      const fam = layer.devanagari ? "'Noto Sans Devanagari', Inter, sans-serif" : 'Inter, sans-serif'
      measureCtx.font = `${layer.weight || 500} ${fontPx}px ${fam}`
      const value = PREVIEW_FIELDS[layer.bind] ?? layer.text ?? ''
      const lines = countLines(value, measureCtx, w, layer.maxLines || 3)
      h = lines * fontPx * (layer.lineHeight || 1.25) + 2
    }
    return { left: x, top: y, width: w, height: h }
  }

  function down(e, index, mode) {
    e.stopPropagation()
    e.preventDefault()
    onSelect(index)
    const l = template.layers[index]
    setDrag({ index, mode, sx: e.clientX, sy: e.clientY, orig: { x: l.x ?? 0, y: l.y ?? 0, w: l.w ?? 0.2, h: l.h ?? 0.1 } })
  }

  useEffect(() => {
    if (!drag) return
    const move = (e) => {
      const ddx = (e.clientX - drag.sx) / dw
      const ddy = (e.clientY - drag.sy) / dh
      const el = wrapRef.current?.querySelector(`[data-box="${drag.index}"]`)
      if (!el) return
      if (drag.mode === 'move') {
        el.style.left = `${(drag.orig.x + ddx) * dw}px`
        el.style.top = `${(drag.orig.y + ddy) * dh}px`
      } else {
        el.style.width = `${Math.max(0.02, drag.orig.w + ddx) * dw}px`
        el.style.height = `${Math.max(0.02, drag.orig.h + ddy) * dh}px`
      }
    }
    const up = (e) => {
      const ddx = (e.clientX - drag.sx) / dw
      const ddy = (e.clientY - drag.sy) / dh
      const r = (v) => Math.round(v * 1000) / 1000
      if (drag.mode === 'move') {
        onLayerChange(drag.index, { x: r(Math.min(1, Math.max(-0.2, drag.orig.x + ddx))), y: r(Math.min(1, Math.max(-0.2, drag.orig.y + ddy))) })
      } else {
        onLayerChange(drag.index, { w: Math.max(0.02, r(drag.orig.w + ddx)), h: Math.max(0.02, r(drag.orig.h + ddy)) })
      }
      setDrag(null)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [drag, dw, dh, onLayerChange])

  return (
    <div
      ref={wrapRef}
      className="relative select-none rounded-lg border border-slate-300 bg-white shadow-sm"
      style={{ width: dw, height: dh }}
      onPointerDown={() => onSelect(-1)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full rounded-lg" />
      {template.layers.map((layer, i) => {
        if (isBase(layer, i)) return null
        const selected = i === selectedIndex
        const label = layer.slot
          ? (layer.slot === 'karyakartaPhoto' ? 'कार्यकर्ता' : 'Issue')
          : { title: 'Headline', description: 'Description', name: 'Name', village: 'Village' }[layer.bind] || 'Text'
        return (
          <div
            key={i}
            data-box={i}
            onPointerDown={(e) => down(e, i, 'move')}
            className={`absolute cursor-move ${
              selected ? 'ring-2 ring-blue-500' : 'hover:ring-1 hover:ring-blue-400/70'
            }`}
            style={boxStyle(layer)}
          >
            {selected && (
              <>
                <span className="pointer-events-none absolute -top-4 left-0 rounded bg-blue-600 px-1 text-[9px] font-medium text-white">
                  {label}
                </span>
                <div
                  onPointerDown={(e) => down(e, i, 'resize')}
                  className="absolute -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize rounded-sm border border-white bg-blue-600"
                />
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}
