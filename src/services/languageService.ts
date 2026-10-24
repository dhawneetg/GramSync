// GramSync Comprehensive Bilingual Field Dictionary (English & Hindi)
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
    // Top bar
    tabField: 'ASHA Companion',
    tabLab: 'Sync Simulator',
    tabSecurity: 'Security Vault',
    tabFlow: 'System Flow',
    stageConflict: 'Stage Conflict',
    reset: 'Reset',
    roleAsha: 'ASHA WORKER (PIN 1234)',
    roleMo: 'DR. / MO (PIN 9999)',

    // Header banner
    bannerTitle: 'GramHealth Field Companion',
    bannerSubtitle: 'ASHA Field Worker & Primary Health Centre (PHC) Offline Clinical Records',
    nhmBadge: 'National Health Mission (NHM)',
    nodeA: 'ASHA Tablet (Node A)',
    nodeB: 'PHC Clinic (Node B)',
    online: 'Online',
    offline: 'Offline',
    syncNow: 'Sync Now',

    // Left List
    searchPlaceholder: 'Search by Name, ABHA ID or Village...',
    newPatientBtn: 'New Patient',
    patientDirectory: 'Patient Directory',
    healthCard: 'Health Card',
    female: 'Female',
    male: 'Male',
    years: 'yrs',

    // Active Profile Header & Actions
    shareRecordBtn: 'Share Record',
    newVisitBtn: 'Record Visit',
    resolveConflict: 'Resolve Conflict',

    // Tabs
    tabAll: 'All-in-One Dashboard',
    tabVitals: '1. Vitals & Screening',
    tabLabs: '2. PHC Lab Reports',
    tabPrescriptions: '3. Doctor Prescriptions',

    // Vitals Cards
    bpTitle: 'Blood Pressure',
    bpHigher: 'High Stage-1 (Elevated)',
    bpNormal: 'Normal Range',
    hrTitle: 'Heart Rate',
    hrRegular: 'Regular Rhythm',
    spo2Title: 'Oxygen (SpO2)',
    spo2Low: 'Low Oxygen (<95%)',
    spo2Normal: 'Normal Oxygen (>95%)',
    hbTitle: 'Hemoglobin (Hb)',
    hbAnemia: 'Moderate Anemia Warning',
    hbNormal: 'Normal Safe Range',
    tempTitle: 'Body Temperature',
    tempNormal: 'Afebrile (Normal)',
    notesTitle: 'ASHA Field Clinical Observations & Notes',

    // Labs Tab
    labsHeader: 'Government Health Centre Diagnostic Lab Records',
    testsAvailable: 'Tests Recorded',
    statusNormal: 'Normal',
    statusElevated: 'Elevated',
    statusCritical: 'Critical',
    normalRange: 'Normal Range',
    doctorRemarks: 'Doctor Remarks',
    performedAt: 'Testing Facility',
    testDate: 'Date',

    // Prescriptions Tab
    prescriptionsHeader: 'Active PHC Medical Officer Prescriptions',
    prescriptionsAvailable: 'Medications Prescribed',
    dosage: 'Dosage',
    timing: 'Timing',
    days: 'Days',
    issuedBy: 'Prescribed By',
    beforeFood: 'Before Food',
    afterFood: 'After Food',
    withFood: 'With Food',

    // QR & Dynamic Entry additions
    qrShareBtn: 'Medicine QR',
    addLabBtn: '+ Add Lab Test',
    addPrescriptionBtn: '+ Add Prescription',
    qrPrescriptionTitle: 'Offline Prescription & Health Passport (QR)',
    qrPrescriptionSubtitle: 'Instant scan by local chemist, pharmacist, or hospital without internet',
    downloadQr: 'Download QR Image',
    previewQrData: 'Preview Scanned Data',
    scanHelp: 'Scan with any smartphone camera or 2D barcode scanner',
    latestMedicines: 'Active Prescriptions',
    saveReport: 'Save Record',
    cancel: 'Cancel'
  },
  hi: {
    // Top bar
    tabField: 'आशा साथी',
    tabLab: 'सिंक सिमुलेटर',
    tabSecurity: 'सुरक्षा वॉल्ट',
    tabFlow: 'सिस्टम फ्लो',
    stageConflict: 'टकराव उत्पन्न करें',
    reset: 'रीसेट',
    roleAsha: 'आशा कार्यकर्ता (PIN 1234)',
    roleMo: 'चिकित्सा अधिकारी (PIN 9999)',

    // Header banner
    bannerTitle: 'ग्रामीण स्वास्थ्य साथी (GramHealth)',
    bannerSubtitle: 'आशा कार्यकर्ता एवं प्राथमिक स्वास्थ्य केंद्र (PHC) ऑफ़लाइन क्लिनिकल रिकॉर्ड',
    nhmBadge: 'राष्ट्रीय स्वास्थ्य मिशन (NHM)',
    nodeA: 'आशा टैबलेट (Node A)',
    nodeB: 'PHC क्लीनिक (Node B)',
    online: 'ऑनलाइन',
    offline: 'ऑफलाइन',
    syncNow: 'सिंक करें',

    // Left List
    searchPlaceholder: 'नाम, ABHA ID या गाँव से खोजें...',
    newPatientBtn: 'नया मरीज',
    patientDirectory: 'मरीज सूची',
    healthCard: 'स्वास्थ्य कार्ड',
    female: 'महिला',
    male: 'पुरुष',
    years: 'वर्ष',

    // Active Profile Header & Actions
    shareRecordBtn: 'रिकॉर्ड साझा करें',
    newVisitBtn: 'शारीरिक जाँच दर्ज करें',
    resolveConflict: 'मतभेद हल करें',

    // Tabs
    tabAll: 'सम्पूर्ण डैशबोर्ड (All)',
    tabVitals: '1. शारीरिक जाँच (Vitals)',
    tabLabs: '2. PHC लैब रिपोर्ट',
    tabPrescriptions: '3. डॉक्टर की दवाइयाँ',

    // Vitals Cards
    bpTitle: 'रक्तचाप (Blood Pressure)',
    bpHigher: 'उच्च रक्तचाप (Stage 1)',
    bpNormal: 'सामान्य सीमा',
    hrTitle: 'हृदय गति (Heart Rate)',
    hrRegular: 'नियमित ताल (Regular)',
    spo2Title: 'ऑक्सीजन स्तर (SpO2)',
    spo2Low: 'कम ऑक्सीजन (<95%)',
    spo2Normal: 'सामान्य ऑक्सीजन (>95%)',
    hbTitle: 'हीमोग्लोबिन (Hb)',
    hbAnemia: 'रक्ताल्पता (एनीमिया) चेतावनी',
    hbNormal: 'सुरक्षित सामान्य स्तर',
    tempTitle: 'शरीर का तापमान',
    tempNormal: 'सामान्य (बुखार नहीं)',
    notesTitle: 'आशा कार्यकर्ता नैदानिक टिप्पणियाँ एवं फील्ड प्रेक्षण',

    // Labs Tab
    labsHeader: 'सरकारी स्वास्थ्य केंद्र लैब परिणाम (PHC Diagnostics)',
    testsAvailable: 'परीक्षण उपलब्ध',
    statusNormal: 'सामान्य',
    statusElevated: 'मध्यम',
    statusCritical: 'गंभीर',
    normalRange: 'सामान्य सीमा',
    doctorRemarks: 'चिकित्सक टिप्पणी',
    performedAt: 'जाँच केंद्र',
    testDate: 'जाँच दिनांक',

    // Prescriptions Tab
    prescriptionsHeader: 'प्राथमिक स्वास्थ्य केंद्र डॉक्टर की दवाइयाँ',
    prescriptionsAvailable: 'दवाइयाँ उपलब्ध',
    dosage: 'मात्रा',
    timing: 'सेवन समय',
    days: 'दिन',
    issuedBy: 'परामर्शक',
    beforeFood: 'खाली पेट',
    afterFood: 'खाने के बाद',
    withFood: 'भोजन के साथ',

    // QR & Dynamic Entry additions
    qrShareBtn: 'दवा QR',
    addLabBtn: '+ नया टेस्ट जोड़ें',
    addPrescriptionBtn: '+ नई दवा जोड़ें',
    qrPrescriptionTitle: 'ऑफ़लाइन दवा पर्ची व स्वास्थ्य पासपोर्ट (QR)',
    qrPrescriptionSubtitle: 'स्थानीय केमिस्ट, फार्मासिस्ट या अस्पताल द्वारा बिना इंटरनेट तुरंत स्कैन',
    downloadQr: 'क्यूआर कोड डाउनलोड करें',
    previewQrData: 'स्कैन डेटा देखें',
    scanHelp: 'किसी भी स्मार्टफोन कैमरे या 2D बारकोड स्कैनर से स्कैन करें',
    latestMedicines: 'सक्रिय दवाइयाँ',
    saveReport: 'रिकॉर्ड सहेजें',
    cancel: 'रद्द करें'
  }
};

export const t = (key: keyof typeof DICTIONARY['en']): string => {
  return DICTIONARY[currentLang][key] || DICTIONARY['en'][key] || key;
};
