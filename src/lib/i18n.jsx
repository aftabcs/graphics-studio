import { createContext, useCallback, useContext, useState } from 'react'

/**
 * Minimal bilingual (English / Hindi) layer. `t('key', {vars})` returns the
 * string for the current language; `{var}` tokens are interpolated. Language
 * choice persists in localStorage.
 */
const STR = {
  langName: { en: 'EN', hi: 'हिं' },
  appTitle: { en: 'Graphics Studio', hi: 'ग्राफिक्स स्टूडियो' },
  appSubtitle: {
    en: 'Booth-level campaign material — add photos and download',
    hi: 'बूथ स्तर की चुनावी सामग्री — फोटो जोड़ें और डाउनलोड करें',
  },
  demoToggle: { en: 'Demo: simulate tasks complete', hi: 'डेमो: कार्य पूर्ण मानें' },

  gateTitle: {
    en: 'Log your voters and report your issues to unlock Graphics Studio',
    hi: 'ग्राफिक्स स्टूडियो अनलॉक करने के लिए मतदाता दर्ज करें व समस्याएँ रिपोर्ट करें',
  },
  gateBody: {
    en: 'You can look around and set up a graphic below, but generating it stays locked until your voter-info and issue-reporting work for today is done.',
    hi: 'आप नीचे देख सकते हैं और ग्राफ़िक तैयार कर सकते हैं, लेकिन आज का मतदाता व समस्या रिपोर्टिंग कार्य पूरा होने तक जनरेट करना लॉक रहेगा।',
  },
  gateProgress: {
    en: '{v} of {vr} voters logged, {i} of {ir} issues reported today',
    hi: '{v}/{vr} मतदाता दर्ज, {i}/{ir} समस्याएँ आज रिपोर्ट',
  },

  choosePoster: { en: 'Choose a poster', hi: 'पोस्टर चुनें' },
  all: { en: 'All', hi: 'सभी' },
  lockedNote: {
    en: "Finish today's voter and issue tasks to unlock poster generation.",
    hi: 'पोस्टर जनरेशन अनलॉक करने के लिए आज के मतदाता व समस्या कार्य पूरे करें।',
  },
  noPosters: { en: 'No posters available yet.', hi: 'अभी कोई पोस्टर उपलब्ध नहीं।' },

  addPhotos: { en: 'Add your photos', hi: 'अपनी फोटो जोड़ें' },
  autoFillNote: { en: 'Name, village and headline fill in automatically.', hi: 'नाम, गाँव और शीर्षक अपने आप भर जाते हैं।' },
  yourPhoto: { en: '1. Your photo', hi: '1. आपकी फोटो' },
  issuePhotoStep: { en: '2. Issue photo', hi: '2. समस्या की फोटो' },
  uploadIssue: { en: 'Upload issue photo', hi: 'समस्या फोटो अपलोड करें' },
  orPickLibrary: { en: '…or pick from the library:', hi: '…या लाइब्रेरी से चुनें:' },
  preview: { en: 'Preview', hi: 'प्रीव्यू' },
  updating: { en: 'updating…', hi: 'अपडेट हो रहा है…' },
  poster: { en: 'Poster', hi: 'पोस्टर' },
  whatsapp: { en: 'WhatsApp', hi: 'व्हाट्सऐप' },

  uploadPhoto: { en: 'Upload photo', hi: 'फोटो अपलोड करें' },
  clickPhoto: { en: 'Click photo', hi: 'फोटो खींचें' },
  noPhoto: { en: 'No photo', hi: 'कोई फोटो नहीं' },
  removeWord: { en: 'Remove', hi: 'हटाएँ' },
  capture: { en: 'Capture', hi: 'कैप्चर' },
  removeBg: { en: 'Remove background', hi: 'बैकग्राउंड हटाएँ' },
  bgStrength: { en: 'Background removal strength', hi: 'बैकग्राउंड हटाने की तीव्रता' },
  bgHint: { en: 'Slide to fine-tune the cutout for your photo.', hi: 'अपनी फोटो के लिए कटआउट को समायोजित करने हेतु स्लाइड करें।' },
  bgOnDevice: { en: 'Cleaned automatically on your device (first use downloads a small model).', hi: 'आपके डिवाइस पर अपने आप साफ़ किया जाता है (पहली बार एक छोटा मॉडल डाउनलोड होता है)।' },
  savePhoto: { en: 'Save this photo', hi: 'यह फ़ोटो सेव करें' },
  savedWord: { en: 'Saved ✓', hi: 'सेव हो गया ✓' },
  savedPhotos: { en: 'Your saved photos (tap to reuse)', hi: 'आपकी सेव की गई फ़ोटो (दोबारा उपयोग हेतु टैप करें)' },
  processing: { en: 'removing background…', hi: 'बैकग्राउंड हटाया जा रहा है…' },
  cameraUnavailable: { en: 'Camera unavailable. Use Upload instead.', hi: 'कैमरा उपलब्ध नहीं। कृपया अपलोड करें।' },
  couldNotRead: { en: 'Could not read that image.', hi: 'यह छवि पढ़ी नहीं जा सकी।' },

  // Karyakarta headline/description pickers
  headlineLabel: { en: 'Headline', hi: 'शीर्षक' },
  descriptionLabel: { en: 'Description', hi: 'विवरण' },
  autoOption: { en: 'Auto', hi: 'स्वतः' },
  chooseFromLibrary: { en: 'Choose from library', hi: 'लाइब्रेरी से चुनें' },

  // Admin — shell
  admin: { en: 'Admin', hi: 'एडमिन' },
  tabPosters: { en: 'My Posters', hi: 'मेरे पोस्टर' },
  tabStudio: { en: 'Poster Studio', hi: 'पोस्टर स्टूडियो' },
  tabText: { en: 'Text Library', hi: 'टेक्स्ट लाइब्रेरी' },
  exitToApp: { en: 'Exit to app', hi: 'ऐप पर लौटें' },

  // Admin — posters manager
  categories: { en: 'Categories', hi: 'श्रेणियाँ' },
  newCategory: { en: 'New category…', hi: 'नई श्रेणी…' },
  add: { en: 'Add', hi: 'जोड़ें' },
  myPosters: { en: 'My posters', hi: 'मेरे पोस्टर' },
  resetSamples: { en: 'Reset to samples', hi: 'सैंपल पर रीसेट करें' },
  noCategory: { en: '(no category)', hi: '(कोई श्रेणी नहीं)' },
  live: { en: 'Live', hi: 'लाइव' },
  draft: { en: 'Draft', hi: 'ड्राफ्ट' },
  goLive: { en: 'Go live', hi: 'लाइव करें' },
  edit: { en: 'Edit', hi: 'एडिट' },
  del: { en: 'Del', hi: 'हटाएँ' },

  // Admin — poster studio
  posterName: { en: 'Poster name', hi: 'पोस्टर नाम' },
  newWord: { en: 'New', hi: 'नया' },
  saveWord: { en: 'Save', hi: 'सेव' },
  savedMsg: { en: 'Saved ✓', hi: 'सेव हो गया ✓' },
  exportWord: { en: 'Export', hi: 'एक्सपोर्ट' },
  importWord: { en: 'Import', hi: 'इम्पोर्ट' },
  deleteWord: { en: 'Delete', hi: 'डिलीट' },
  basePoster: { en: 'Base poster', hi: 'बेस पोस्टर' },
  importBase: { en: 'Import base poster', hi: 'बेस पोस्टर इम्पोर्ट करें' },
  baseSet: { en: 'Base set — the whole artwork.', hi: 'बेस सेट — पूरा आर्टवर्क।' },
  importFirst: { en: 'Import the finished artwork first.', hi: 'पहले तैयार आर्टवर्क इम्पोर्ट करें।' },
  placeField: { en: 'Place field', hi: 'फ़ील्ड रखें' },
  fieldKaryakarta: { en: 'Karyakarta', hi: 'कार्यकर्ता' },
  fieldIssue: { en: 'Issue photo', hi: 'समस्या फोटो' },
  fieldName: { en: 'Name', hi: 'नाम' },
  fieldVillage: { en: 'Village', hi: 'गाँव' },
  fieldsWord: { en: 'Fields', hi: 'फ़ील्ड्स' },
  properties: { en: 'Properties', hi: 'गुण' },
  selectField: { en: 'Select a field on the poster to move, resize, or style it.', hi: 'मूव, रिसाइज़ या स्टाइल करने के लिए पोस्टर पर कोई फ़ील्ड चुनें।' },
  karyakartaPhotoLabel: { en: 'Karyakarta photo', hi: 'कार्यकर्ता फोटो' },
  villageNameLabel: { en: 'Village name', hi: 'गाँव का नाम' },
  width: { en: 'Width', hi: 'चौड़ाई' },
  height: { en: 'Height', hi: 'ऊँचाई' },
  fit: { en: 'Fit', hi: 'फ़िट' },
  graphic: { en: 'Graphic', hi: 'ग्राफ़िक' },
  importFileWord: { en: 'Import file', hi: 'फ़ाइल इम्पोर्ट' },
  chooseImage: { en: 'Choose image…', hi: 'छवि चुनें…' },
  font: { en: 'Font', hi: 'फ़ॉन्ट' },
  rotation: { en: 'Rotate', hi: 'घुमाएँ' },
  selectIssue: { en: 'Select the issue (for auto-fill)', hi: 'समस्या चुनें (ऑटो-फिल के लिए)' },
  fontSize: { en: 'Font size', hi: 'फ़ॉन्ट आकार' },
  colour: { en: 'Colour', hi: 'रंग' },
  align: { en: 'Align', hi: 'संरेखण' },
  fillsAuto: { en: 'Fills automatically at generation.', hi: 'जनरेशन के समय अपने आप भर जाता है।' },

  // Admin — text library
  uploadExcel: { en: 'Upload Excel / CSV', hi: 'एक्सेल / CSV अपलोड करें' },
  downloadTemplate: { en: 'Download template', hi: 'टेम्पलेट डाउनलोड करें' },
  exportJson: { en: 'Export JSON', hi: 'JSON एक्सपोर्ट' },
  resetWord: { en: 'Reset', hi: 'रीसेट' },
  linesWord: { en: 'lines', hi: 'पंक्तियाँ' },
  entriesWord: { en: 'entries', hi: 'प्रविष्टियाँ' },
  addLine: { en: 'Add a new campaign line…', hi: 'नई अभियान पंक्ति जोड़ें…' },
  noLines: { en: 'No lines yet. Add one below or upload a file.', hi: 'अभी कोई पंक्ति नहीं। नीचे जोड़ें या फ़ाइल अपलोड करें।' },
  textLibFooter: {
    en: 'Changes save automatically. These lines auto-fill the poster headline at generation (matching issue + General).',
    hi: 'बदलाव अपने आप सेव होते हैं। ये पंक्तियाँ जनरेशन के समय पोस्टर शीर्षक में अपने आप भरती हैं (मिलती-जुलती समस्या + सामान्य)।',
  },
}

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k })

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('gs.lang') || 'en')
  const setLang = useCallback((l) => {
    localStorage.setItem('gs.lang', l)
    setLangState(l)
  }, [])
  const t = useCallback(
    (key, vars) => {
      let s = (STR[key] && (STR[key][lang] || STR[key].en)) || key
      if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v)
      return s
    },
    [lang],
  )
  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>
}

export function useLang() {
  return useContext(LangContext)
}

/** A compact EN / हिं toggle. */
export function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLang()
  return (
    <div className={`inline-flex overflow-hidden rounded-lg border border-slate-200 bg-white text-xs ${className}`}>
      {['en', 'hi'].map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className={`px-2.5 py-1.5 font-medium ${lang === l ? 'bg-[#12306e] text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {l === 'en' ? 'EN' : 'हिं'}
        </button>
      ))}
    </div>
  )
}
