import { useLang } from '../lib/i18n.jsx'
import { DEVANAGARI_FONTS } from '../lib/fonts.js'

/**
 * Minimal properties for a placed field: position, size, and (for text) size /
 * colour / alignment. Which data the field carries is fixed by its type.
 */
const FIELD_LABEL_KEY = {
  title: 'headlineLabel',
  description: 'descriptionLabel',
  name: 'fieldName',
  village: 'villageNameLabel',
}
const ALIGNS = ['left', 'center', 'right']

function Row({ label, children }) {
  return (
    <label className="flex items-center justify-between gap-2 py-1 text-xs">
      <span className="w-20 shrink-0 text-slate-500">{label}</span>
      {children}
    </label>
  )
}
const inp = 'w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-blue-400'
function Num({ value, onChange, step = 0.01 }) {
  return <input type="number" step={step} value={value ?? 0} onChange={(e) => onChange(parseFloat(e.target.value))} className={inp} />
}

export default function FieldProperties({ layer, onChange, onDelete }) {
  const { t } = useLang()
  const typeLabel = (l) => {
    if (l.slot) return l.slot === 'karyakartaPhoto' ? t('karyakartaPhotoLabel') : t('fieldIssue')
    if (l.type === 'text') return t(FIELD_LABEL_KEY[l.bind] || 'headlineLabel')
    return t('graphic')
  }
  if (!layer) return <p className="p-3 text-xs text-slate-400">{t('selectField')}</p>
  const isText = layer.type === 'text'
  return (
    <div className="space-y-1 p-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">{typeLabel(layer)}</span>
        <button onClick={onDelete} className="text-xs text-rose-500 hover:underline">{t('removeWord')}</button>
      </div>
      <Row label="X"><Num value={layer.x} onChange={(v) => onChange({ x: v })} /></Row>
      <Row label="Y"><Num value={layer.y} onChange={(v) => onChange({ y: v })} /></Row>
      <Row label={t('width')}><Num value={layer.w} onChange={(v) => onChange({ w: v })} /></Row>
      {!isText && <Row label={t('height')}><Num value={layer.h} onChange={(v) => onChange({ h: v })} /></Row>}
      {layer.type === 'image' && (
        <Row label={t('rotation')}>
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={layer.rotation ?? 0}
            onChange={(e) => onChange({ rotation: Number(e.target.value) })}
            className="w-full accent-[#12306e]"
          />
        </Row>
      )}
      {layer.type === 'image' && <div className="pb-1 text-right text-[10px] text-slate-400">{layer.rotation ?? 0}°</div>}
      {isText && (
        <>
          <Row label={t('font')}>
            <select value={layer.font ?? ''} onChange={(e) => onChange({ font: e.target.value || undefined })} className={inp}>
              {DEVANAGARI_FONTS.map((f) => <option key={f.family} value={f.family}>{f.label}</option>)}
            </select>
          </Row>
          <Row label={t('fontSize')}><Num value={layer.size} onChange={(v) => onChange({ size: v })} step={0.002} /></Row>
          <Row label={t('colour')}><input type="color" value={layer.color ?? '#13387a'} onChange={(e) => onChange({ color: e.target.value })} /></Row>
          <Row label={t('align')}>
            <select value={layer.align ?? 'left'} onChange={(e) => onChange({ align: e.target.value })} className={inp}>
              {ALIGNS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </Row>
          <p className="pt-1 text-[10px] text-slate-400">{t('fillsAuto')}</p>
        </>
      )}
    </div>
  )
}
