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
    tabField: 'ASHA Companion',
    tabLab: 'Sync Simulator',
    tabSecurity: 'Security Vault',
    tabFlow: 'System Flow',
    stageConflict: 'Stage Conflict',
    reset: 'Reset',
    roleAsha: 'ASHA Worker',
    roleMo: 'Medical Officer',
    searchPlaceholder: 'Search by Name, ABHA ID or Village...',
    newPatientBtn: 'New Patient',
    patientDirectory: 'Patient Directory',
    tabVitals: '1. Vitals & Screening',
    tabLabs: '2. PHC Lab Reports',
    tabPrescriptions: '3. Prescriptions',
    shareRecordBtn: 'Share Record',
    newVisitBtn: 'Record Visit',
    offlineBanner: 'Offline Mode (Data encrypted locally on device)',
    onlineBanner: 'Online (Ready to sync with PHC server)',
    bp: 'Blood Pressure',
    heartRate: 'Heart Rate',
    spo2: 'Oxygen (SpO2)',
    hemoglobin: 'Hemoglobin (Hb)',
    temperature: 'Body Temp',
    respiratoryRate: 'Respiratory Rate',
    clinicalNotes: 'Clinical Triage Notes & Observations',
    medications: 'Pharmaceutical & Stock Dispensation',
    saveVisit: 'Commit Clinical Entry',
    resolveConflict: 'Resolve 3-Way Conflict',
    normal: 'Normal Range',
    highRisk: 'High Risk',
    anemia: 'Nutritional Anemia Warning',
    hypoxemia: 'Hypoxemia Warning',
    female: 'Female',
    male: 'Male',
    years: 'yrs',
    doctorRemarks: 'Doctor Remarks',
    prescribedMeds: 'Prescribed Regimen',
    dosage: 'Dosage',
    timing: 'Timing',
    days: 'Days',
    issuedBy: 'Issued By',
    beforeFood: 'Before Food (खाली पेट)',
    afterFood: 'After Food (खाने के बाद)',
    withFood: 'With Food (भोजन के साथ)',
  },
  hi: {
    tabField: 'आशा साथी',
    tabLab: 'सिंक सिमुलेटर',
    tabSecurity: 'सुरक्षा वॉल्ट',
    tabFlow: 'सिस्टम फ्लो',
    stageConflict: 'टकराव उत्पन्न करें',
    reset: 'रीसेट',
    roleAsha: 'आशा कार्यकर्ता',
    roleMo: 'चिकित्सा अधिकारी',
    searchPlaceholder: 'नाम, ABHA ID या गाँव से खोजें...',
    newPatientBtn: 'नया मरीज',
    patientDirectory: 'मरीज सूची',
    tabVitals: '1. शारीरिक जाँच (Vitals)',
    tabLabs: '2. PHC लैब रिपोर्ट (Labs)',
    tabPrescriptions: '3. डॉक्टर की दवाइयाँ',
    shareRecordBtn: 'रिकॉर्ड साझा करें',
    newVisitBtn: 'नई विज़िट दर्ज करें',
    offlineBanner: 'ऑफ़लाइन मोड (डेटा डिवाइस में सुरक्षित रूप से संचित है)',
    onlineBanner: 'ऑनलाइन (PHC क्लाउड से सिंक हेतु तैयार)',
    bp: 'रक्तचाप (BP)',
    heartRate: 'हृदय गति (HR)',
    spo2: 'ऑक्सीजन स्तर (SpO2)',
    hemoglobin: 'हीमोग्लोबिन (Hb)',
    temperature: 'शरीर का तापमान',
    respiratoryRate: 'श्वसन दर (RR)',
    clinicalNotes: 'नैदानिक परीक्षण एवं लक्षण नोट्स',
    medications: 'दवा एवं स्टॉक वितरण',
    saveVisit: 'क्लिनिकल डेटा सुरक्षित करें',
    resolveConflict: '3-तरफा टकराव हल करें',
    normal: 'सामान्य स्थिति',
    highRisk: 'गंभीर जोखिम',
    anemia: 'रक्ताल्पता (एनीमिया) चेतावनी',
    hypoxemia: 'कम ऑक्सीजन स्तर चेतावनी',
    female: 'महिला',
    male: 'पुरुष',
    years: 'वर्ष',
    doctorRemarks: 'चिकित्सक टिप्पणी',
    prescribedMeds: 'दवाइयों की खुराक',
    dosage: 'मात्रा',
    timing: 'सेवन का समय',
    days: 'दिन',
    issuedBy: 'द्वारा जारी',
    beforeFood: 'खाली पेट',
    afterFood: 'खाने के बाद',
    withFood: 'भोजन के साथ',
  }
};

export const t = (key: keyof typeof DICTIONARY['en']): string => {
  return DICTIONARY[currentLang][key] || DICTIONARY['en'][key] || key;
};
