// GramSync Bilingual Field Dictionary (English & Hindi)
export type SupportedLang = 'en' | 'hi';

let currentLang: SupportedLang = (localStorage.getItem('gramsync_lang') as SupportedLang) || 'en';
const langListeners: Set<(lang: SupportedLang) => void> = new Set();

export const getLanguage = (): SupportedLang => currentLang;

export const setLanguage = (lang: SupportedLang) => {
  currentLang = lang;
  try {
    localStorage.setItem('gramsync_lang', lang);
  } catch (e) {
    // Ignore storage issues
  }
  langListeners.forEach(fn => fn(lang));
};

export const subscribeLanguage = (fn: (lang: SupportedLang) => void) => {
  langListeners.add(fn);
  return () => {
    langListeners.delete(fn);
  };
};

export const DICTIONARY = {
  en: {
    trackTitle: 'HT-03 // ZERO-INTERNET CLINICAL ENGINE',
    tabLab: '[1] Sync Lab',
    tabField: '[2] Field View',
    tabSecurity: '[3] Security Vault',
    tabFlow: '[4] Architecture Flow',
    stageConflict: '⚡ STAGE CONFLICT',
    reset: 'RESET',
    bp: 'Blood Pressure',
    heartRate: 'Heart Rate',
    spo2: 'Pulse Oximetry',
    hemoglobin: 'Hemoglobin',
    temperature: 'Temperature',
    clinicalNotes: 'Clinical Triage Notes & Observations',
    medications: 'Pharmaceutical & Stock Dispensation',
    saveVisit: 'COMMIT CLINICAL ENTRY',
    resolveConflict: 'RESOLVE 3-WAY CONFLICT',
    normal: 'Normal Range',
    highRisk: 'High Risk',
    anemia: 'Nutritional Anemia Warning',
    hypoxemia: 'Hypoxemia Warning',
  },
  hi: {
    trackTitle: 'HT-03 // बिना इंटरनेट क्लिनिकल इंजन',
    tabLab: '[1] सिंक लैब',
    tabField: '[2] फील्ड दृश्य',
    tabSecurity: '[3] सुरक्षा वॉल्ट',
    tabFlow: '[4] सिस्टम फ्लो',
    stageConflict: '⚡ टकराव उत्पन्न करें',
    reset: 'रीसेट',
    bp: 'रक्तचाप (BP)',
    heartRate: 'हृदय गति (HR)',
    spo2: 'ऑक्सीजन स्तर (SpO2)',
    hemoglobin: 'हीमोग्लोबिन (Hb)',
    temperature: 'शरीर का तापमान',
    clinicalNotes: 'नैदानिक परीक्षण एवं लक्षण नोट्स',
    medications: 'दवा एवं स्टॉक वितरण',
    saveVisit: 'क्लिनिकल डेटा सुरक्षित करें',
    resolveConflict: '3-तरफा टकराव हल करें',
    normal: 'सामान्य स्थिति',
    highRisk: 'गंभीर जोखिम',
    anemia: 'रक्ताल्पता (एनीमिया) चेतावनी',
    hypoxemia: 'कम ऑक्सीजन स्तर चेतावनी',
  }
};

export const t = (key: keyof typeof DICTIONARY['en']): string => {
  return DICTIONARY[currentLang][key] || DICTIONARY['en'][key];
};
