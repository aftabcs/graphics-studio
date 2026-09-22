/**
 * CAMPAIGN TEXT LIBRARY (seed)
 * ---------------------------
 * Reusable campaign lines organised by GENERAL CIVIC ISSUE, written for the
 * Indian National Congress (कांग्रेस) contesting the Uttarakhand assembly
 * elections. The admin edits these in the Text Library manager; at generation a
 * line is picked for the selected issue's category — at random or by choice.
 *
 * Each entry: { id, text, kind }  kind: 'headline' | 'slogan' | 'sub'
 *
 * These are aspirational campaign slogans, not factual claims/statistics.
 * `id` values must be unique within a category.
 */

export const CIVIC_ISSUES = [
  { id: 'general', label: 'General / All issues', labelHi: 'सामान्य' },
  { id: 'water', label: 'Water Supply', labelHi: 'जल आपूर्ति' },
  { id: 'road', label: 'Roads', labelHi: 'सड़क' },
  { id: 'healthcare', label: 'Healthcare', labelHi: 'स्वास्थ्य' },
  { id: 'education', label: 'Education', labelHi: 'शिक्षा' },
  { id: 'employment', label: 'Employment', labelHi: 'रोजगार' },
  { id: 'electricity', label: 'Electricity', labelHi: 'बिजली' },
  { id: 'sanitation', label: 'Sanitation', labelHi: 'स्वच्छता' },
  { id: 'drainage', label: 'Drainage / Sewage', labelHi: 'जल निकासी' },
  { id: 'streetlight', label: 'Street Lighting', labelHi: 'स्ट्रीट लाइट' },
  { id: 'transport', label: 'Public Transport', labelHi: 'सार्वजनिक परिवहन' },
  { id: 'women_safety', label: 'Women Safety', labelHi: 'महिला सुरक्षा' },
  { id: 'agriculture', label: 'Agriculture / Irrigation', labelHi: 'कृषि / सिंचाई' },
  { id: 'environment', label: 'Environment', labelHi: 'पर्यावरण' },
  { id: 'housing', label: 'Housing', labelHi: 'आवास' },
  { id: 'governance', label: 'Governance', labelHi: 'सुशासन' },
]

const T = (id, text, kind = 'slogan') => ({ id, text, kind })

export const TEXT_LIBRARY_SEED = {
  general: [
    T('gen-1', 'हाथ बदलेगा उत्तराखंड', 'headline'),
    T('gen-2', 'कांग्रेस के साथ, बदलेगा उत्तराखंड', 'slogan'),
    T('gen-3', 'देवभूमि की पुकार, कांग्रेस सरकार'),
    T('gen-4', 'पहाड़ का दर्द, कांग्रेस समझे'),
    T('gen-5', 'पलायन रोको, उत्तराखंड बचाओ', 'headline'),
    T('gen-6', 'महंगाई और बेरोजगारी के खिलाफ, कांग्रेस'),
    T('gen-7', 'हर गाँव, हर वार्ड की यही है पुकार — कांग्रेस', 'sub'),
    T('gen-8', 'विकास भी, सुरक्षा भी', 'headline'),
  ],
  water: [
    T('wat-1', 'हर घर नल, हर घर जल — कांग्रेस का संकल्प'),
    T('wat-2', 'पहाड़ में पानी की किल्लत खत्म करेगी कांग्रेस', 'headline'),
    T('wat-3', 'स्वच्छ पानी, स्वस्थ उत्तराखंड'),
    T('wat-4', 'हर गाँव तक पहुँचेगा शुद्ध जल', 'headline'),
  ],
  road: [
    T('road-1', 'गाँव-गाँव तक पक्की सड़क, कांग्रेस का वादा'),
    T('road-2', 'टूटी सड़कें नहीं, मजबूत उत्तराखंड चाहिए', 'headline'),
    T('road-3', 'हर गाँव जुड़ेगा, कांग्रेस के साथ'),
    T('road-4', 'पहाड़ की हर राह होगी आसान', 'headline'),
  ],
  healthcare: [
    T('hea-1', 'हर गाँव में अस्पताल, हर मरीज़ का इलाज', 'headline'),
    T('hea-2', 'इलाज के लिए शहर नहीं, गाँव में मिलेगी सुविधा', 'headline'),
    T('hea-3', 'स्वस्थ उत्तराखंड, कांग्रेस का संकल्प'),
    T('hea-4', 'पहाड़ में बेहतर स्वास्थ्य सेवा — कांग्रेस'),
  ],
  education: [
    T('edu-1', 'हर बच्चे को शिक्षा, हर गाँव में स्कूल', 'headline'),
    T('edu-2', 'बेहतर शिक्षा, उज्जवल उत्तराखंड'),
    T('edu-3', 'पहाड़ के बच्चों का भविष्य, कांग्रेस की प्राथमिकता', 'headline'),
    T('edu-4', 'गाँव के स्कूल बनेंगे बेहतर — कांग्रेस'),
  ],
  employment: [
    T('emp-1', 'पलायन नहीं, रोजगार चाहिए', 'headline'),
    T('emp-2', 'युवाओं को रोजगार, कांग्रेस का वादा'),
    T('emp-3', 'पहाड़ में रुकेगा पलायन, मिलेगा रोजगार', 'headline'),
    T('emp-4', 'स्थानीय रोजगार, आत्मनिर्भर उत्तराखंड'),
  ],
  electricity: [
    T('ele-1', 'हर गाँव तक निर्बाध बिजली — कांग्रेस'),
    T('ele-2', 'बिजली की कटौती नहीं, रोशन होगा हर पहाड़', 'headline'),
    T('ele-3', 'सस्ती बिजली, हर घर रोशन'),
  ],
  sanitation: [
    T('san-1', 'स्वच्छ गाँव, स्वस्थ उत्तराखंड'),
    T('san-2', 'हर गाँव होगा साफ-सुथरा — कांग्रेस'),
  ],
  drainage: [
    T('dra-1', 'साफ नालियाँ, स्वस्थ मोहल्ला'),
    T('dra-2', 'जलभराव से मुक्ति, कांग्रेस का संकल्प', 'headline'),
  ],
  streetlight: [
    T('str-1', 'स्ट्रीट लाइट से सुरक्षित रातें — कांग्रेस'),
    T('str-2', 'हर गली होगी रोशन, हर राह सुरक्षित', 'headline'),
  ],
  transport: [
    T('tra-1', 'गाँव-गाँव तक सुलभ परिवहन'),
    T('tra-2', 'पहाड़ में बेहतर परिवहन, कांग्रेस के साथ'),
  ],
  women_safety: [
    T('wom-1', 'नारी शक्ति, कांग्रेस की प्राथमिकता'),
    T('wom-2', 'सुरक्षित महिला, सशक्त उत्तराखंड', 'headline'),
    T('wom-3', 'बेटियों की सुरक्षा, कांग्रेस का वादा'),
  ],
  agriculture: [
    T('agr-1', 'किसान खुशहाल, उत्तराखंड खुशहाल'),
    T('agr-2', 'पहाड़ी खेती को मिलेगा सम्मान — कांग्रेस', 'headline'),
    T('agr-3', 'सिंचाई और समर्थन, किसान के साथ कांग्रेस'),
  ],
  environment: [
    T('env-1', 'हरा-भरा उत्तराखंड, स्वच्छ पर्यावरण'),
    T('env-2', 'देवभूमि की रक्षा, कांग्रेस का संकल्प', 'headline'),
    T('env-3', 'जंगल, नदी, पहाड़ — सबकी रक्षा'),
  ],
  housing: [
    T('hou-1', 'हर परिवार को पक्का घर — कांग्रेस'),
    T('hou-2', 'सबके सिर पर होगी अपनी छत', 'headline'),
  ],
  governance: [
    T('gov-1', 'पारदर्शी शासन, जनता का विश्वास'),
    T('gov-2', 'भ्रष्टाचार नहीं, जनहित की सरकार', 'headline'),
    T('gov-3', 'जनता की सरकार, कांग्रेस के साथ'),
  ],
}
