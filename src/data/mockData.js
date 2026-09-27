/**
 * MOCK DATA LAYER
 * ---------------
 * This file is the ONLY place with hardcoded sample data. Everything the UI
 * needs is exported from here behind small functions so that, at integration
 * time, you can replace the bodies of `getStudioState`, `getIssues`,
 * `getIssuePhotoLibrary`, and `getCurrentKaryakarta` with real API calls
 * without touching any component.
 *
 * Nothing here fabricates political facts. Text shown on graphics comes from
 * the issue records themselves (reported by karyakartas) + fields the user
 * types manually. See lib/templateSchema.js for how text slots are bound.
 */

// --- Reference lookups -------------------------------------------------------

export const CATEGORIES = [
  { id: 'all', label: 'All Categories' },
  { id: 'water', label: 'Water Supply' },
  { id: 'road', label: 'Road / Pothole' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'education', label: 'Education' },
  { id: 'employment', label: 'Employment' },
  { id: 'electricity', label: 'Electricity' },
]

// Visual styling per category / severity / status. Kept as data so new values
// degrade gracefully to a neutral style instead of crashing.
export const CATEGORY_STYLE = {
  water: 'bg-sky-50 text-sky-700',
  road: 'bg-blue-50 text-blue-700',
  healthcare: 'bg-teal-50 text-teal-700',
  education: 'bg-indigo-50 text-indigo-700',
  employment: 'bg-violet-50 text-violet-700',
  electricity: 'bg-amber-50 text-amber-700',
  _default: 'bg-slate-100 text-slate-700',
}

export const SEVERITY_STYLE = {
  Low: 'border border-emerald-300 text-emerald-700',
  Medium: 'border border-amber-300 text-amber-700',
  High: 'border border-red-300 text-red-700',
  _default: 'border border-slate-300 text-slate-600',
}

export const STATUS_STYLE = {
  Open: 'border border-rose-300 text-rose-600',
  'In Progress': 'border border-amber-300 text-amber-700',
  Resolved: 'border border-emerald-300 text-emerald-700',
  _default: 'border border-slate-300 text-slate-600',
}

// --- Sample issues (as reported from the field) ------------------------------

const ISSUES = [
  {
    id: 'iss-101',
    category: 'water',
    categoryLabel: 'Water Supply',
    severity: 'Medium',
    status: 'Open',
    description:
      'गांव में पीने के पानी की कमी के कारण लोगों को हर दिन दो किलोमीटर दूर से पानी लाना पड़ता है; यदि इस समस्या का समाधान किया जाए, तो आने वाली पीढ़ियों को राहत मिलेगी।',
    booth: 'Booth 3',
    village: 'वैद्य',
    reportedByName: 'सुरेश नेगी',
    reportedAgo: '14d ago',
    photoId: 'lib-water-1',
  },
  {
    id: 'iss-102',
    category: 'road',
    categoryLabel: 'Road / Pothole',
    severity: 'High',
    status: 'Open',
    description:
      'हमारे गांव में सड़कों पर बहुत सारे गड्ढे हो गए हैं, जिससे मेरी एक वर्ष पुरानी बाइक का सस्पेंशन खराब हो गया है और सभी नट-बोल्ट ढीले हो गए हैं।',
    booth: 'Booth 2',
    village: 'वैद्य',
    reportedByName: 'महेश रावत',
    reportedAgo: '14d ago',
    photoId: 'lib-broken-building',
  },
  {
    id: 'iss-103',
    category: 'water',
    categoryLabel: 'Water Supply',
    severity: 'Medium',
    status: 'Open',
    description: 'Water supply pipeline near the market has been leaking for over a week.',
    booth: 'Booth 1',
    village: 'शंभूराहे वैद्य',
    reportedByName: 'अनीता बिष्ट',
    reportedAgo: '57d ago',
    photoId: 'lib-water-2',
  },
  {
    id: 'iss-104',
    category: 'healthcare',
    categoryLabel: 'Healthcare',
    severity: 'High',
    status: 'In Progress',
    description:
      'प्राथमिक स्वास्थ्य केंद्र में डॉक्टर सप्ताह में केवल दो दिन आते हैं, जिससे मरीजों को शहर जाना पड़ता है।',
    booth: 'Booth 4',
    village: 'वैद्य',
    reportedByName: 'कमला देवी',
    reportedAgo: '9d ago',
    photoId: 'lib-health-1',
  },
  {
    id: 'iss-105',
    category: 'employment',
    categoryLabel: 'Employment',
    severity: 'Low',
    status: 'Open',
    description: 'Local youth are asking for a skill-training centre near the block office.',
    booth: 'Booth 2',
    village: 'वैद्य',
    reportedByName: 'दीपक जोशी',
    reportedAgo: '3d ago',
    photoId: 'lib-emp-1',
  },
]

// --- Issue photo library -----------------------------------------------------
// Placeholder photos generated as data-URIs at load time (see photoPlaceholder).
// Real deployment: replace `src` with actual uploaded issue photo URLs.
// Each issue-photo entry is an issue RECORD: photo + auto-scraped description
// (+ category). At integration these come from the reported-issues database;
// `description` auto-fills the poster's description field.
export const ISSUE_PHOTO_LIBRARY = [
  { id: 'lib-broken-building', label: 'Broken building', category: 'road', src: '/poster-assets/Broken_Building_Local_Issue.png', description: 'गाँव की सरकारी इमारत जर्जर हो चुकी है — मरम्मत की सख्त ज़रूरत है।' },
  { id: 'lib-water-1', label: 'Dry handpump', category: 'water', description: 'पीने के पानी की किल्लत — हैंडपंप सूख चुके हैं।' },
  { id: 'lib-water-2', label: 'Leaking pipeline', category: 'water', description: 'बाज़ार के पास पाइपलाइन एक हफ़्ते से लीक हो रही है।' },
  { id: 'lib-road-1', label: 'Potholed road', category: 'road', description: 'गाँव की सड़कों पर बड़े-बड़े गड्ढे — आवाजाही मुश्किल।' },
  { id: 'lib-health-1', label: 'PHC building', category: 'healthcare', description: 'प्राथमिक स्वास्थ्य केंद्र में डॉक्टर हफ़्ते में सिर्फ़ दो दिन आते हैं।' },
  { id: 'lib-emp-1', label: 'Block office', category: 'employment', description: 'स्थानीय युवाओं के लिए रोज़गार व कौशल केंद्र की माँग।' },
]

// --- Current karyakarta + daily task progress (drives the unlock reward) -----

const STUDIO_STATE = {
  karyakarta: {
    id: 'kk-1',
    name: 'रमेश वैद्य',
    booth: 'Booth 3',
    village: 'वैद्य',
    party: 'Local Unit',
  },
  // The reward gate: studio unlocks only when both daily tasks are complete.
  progress: {
    votersLogged: 3,
    votersRequired: 10,
    issuesReported: 0,
    issuesRequired: 2,
  },
}

// --- Public accessors (swap these bodies for real API calls later) -----------

export function getStudioState() {
  return STUDIO_STATE
}

export function getIssues() {
  return ISSUES
}

export function getIssuePhotoLibrary() {
  return ISSUE_PHOTO_LIBRARY
}

export function getCurrentKaryakarta() {
  return STUDIO_STATE.karyakarta
}

/**
 * Whether the reward feature is unlocked. Pure function of progress so the UI
 * and the compositor agree on the same rule.
 */
export function isStudioUnlocked(progress) {
  return (
    progress.votersLogged >= progress.votersRequired &&
    progress.issuesReported >= progress.issuesRequired
  )
}
