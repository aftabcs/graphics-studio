/**
 * Placeholder image generation (offline, deterministic).
 * Produces small SVG data-URIs so the issue library and previews have visible
 * photos before real assets arrive. Swap ISSUE_PHOTO_LIBRARY `src` with real
 * URLs at integration time and this file becomes unused.
 */

const PALETTE = {
  water: ['#0ea5e9', '#0369a1'],
  road: ['#64748b', '#334155'],
  healthcare: ['#14b8a6', '#0f766e'],
  education: ['#6366f1', '#4338ca'],
  employment: ['#8b5cf6', '#6d28d9'],
  _default: ['#94a3b8', '#475569'],
}

/** A gradient tile with a label — stands in for a photograph. */
export function photoPlaceholder(label, category = '_default') {
  const [c1, c2] = PALETTE[category] || PALETTE._default
  const safe = String(label).replace(/[<>&]/g, '')
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="600" height="600" fill="url(#g)"/>
    <text x="300" y="310" font-family="Inter, sans-serif" font-size="40" font-weight="600"
      fill="#ffffff" text-anchor="middle" opacity="0.9">${safe}</text>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** A neutral avatar placeholder for a karyakarta before a photo is chosen. */
export function avatarPlaceholder() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
    <rect width="400" height="400" fill="#e2e8f0"/>
    <circle cx="200" cy="160" r="70" fill="#94a3b8"/>
    <rect x="90" y="240" width="220" height="140" rx="60" fill="#94a3b8"/>
  </svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}
