import { useEffect, useRef } from 'react'
import { composeToCanvas } from '../lib/compositor.js'
import { templateFormat } from '../lib/templateSchema.js'

/**
 * A tappable poster card showing a live preview of the ready-made template
 * (with its default slot images + auto text). Selecting it starts the fill flow.
 */
export default function PosterThumb({ template, karyakarta, headline, selected, disabled, onSelect }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const sources = {
      karyakartaPhoto: template.slotDefaults?.karyakartaPhoto,
      issuePhoto: template.slotDefaults?.issuePhoto,
    }
    const fields = {
      title: headline || 'हाथ बदलेगा उत्तराखंड',
      name: karyakarta?.name || '',
      village: karyakarta?.village || '',
      booth: karyakarta?.booth || '',
      description: '',
    }
    composeToCanvas(canvasRef.current, template, templateFormat(template), sources, fields).catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.id])

  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(template)}
      className={`group overflow-hidden rounded-2xl border bg-white p-2 text-left shadow-sm transition ${
        selected ? 'border-[#12306e] ring-2 ring-[#12306e]/20' : 'border-slate-200'
      } ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 hover:shadow-md'}`}
    >
      <div className="overflow-hidden rounded-xl bg-slate-100">
        <canvas ref={canvasRef} className="block h-auto w-full" />
      </div>
      <p className="mt-2 truncate px-1 text-sm font-semibold text-[#12306e]">{template.name}</p>
    </button>
  )
}
