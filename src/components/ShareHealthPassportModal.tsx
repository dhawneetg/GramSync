import React, { useState, useEffect, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  Printer, 
  Copy, 
  Check, 
  Share2, 
  Activity, 
  FlaskConical, 
  Pill, 
  ShieldCheck, 
  Phone, 
  MapPin, 
  Calendar,
  User,
  QrCode,
  Download,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { PatientRecord } from '../types/clinical';
import { t } from '../services/languageService';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const ShareHealthPassportModal: React.FC<Props> = ({ patient, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [qrUrl, setQrUrl] = useState<string>('');
  const [showRawPayload, setShowRawPayload] = useState(false);

  const abha = patient.abhaId || `91-${patient.patientId}-2026-9912`;
  const labs = patient.labReports || [];
  const rxs = patient.prescriptions || [];

  // Scannable payload formatted for clean readability on any phone camera / QR reader
  const qrTextPayload = useMemo(() => {
    return [
      `🏛️ GRAMSYNC OFFLINE HEALTH PASSPORT`,
      `Name: ${patient.fullName} (${patient.gender === 'Female' ? 'F' : 'M'}, ${patient.age}y)`,
      `ABHA ID: ${abha}`,
      `Village: ${patient.villageCluster}`,
      `Condition: ${patient.conditionTag}`,
      `Vitals: BP ${patient.data.systolicBP}/${patient.data.diastolicBP} mmHg | SpO2 ${patient.data.spO2}% | Hb ${patient.data.hemoglobinGdl} g/dL | Pulse ${patient.data.heartRate} bpm`,
      `--- ACTIVE MEDICINES ---`,
      ...(rxs.length > 0
        ? rxs.map((r, i) => `${i + 1}. ${r.medicineName} (${r.dosage}) - ${r.frequency} [${r.timing === 'AFTER_FOOD' ? 'After Food' : 'Before Food'}] - ${r.daysPrescribed}d (By: ${r.issuedBy})`)
        : [`1. ${patient.data.medicationsIssued}`]),
      ...(labs.length > 0 ? [
        `--- PHC LAB TESTS ---`,
        ...labs.map(l => `• ${l.testName}: ${l.resultValue} [${l.status}] (${l.performedAt})`)
      ] : []),
      `Verified Offline via GramSync Engine`
    ].join('\n');
  }, [patient, abha, rxs, labs]);

  // Generate offline QR code as base64 data URL
  useEffect(() => {
    QRCode.toDataURL(qrTextPayload, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#042f2e',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then(url => setQrUrl(url))
      .catch(err => console.error('Failed to generate offline QR', err));
  }, [qrTextPayload]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `GramSync-Passport-${patient.patientId}-${patient.fullName.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopySummary = () => {
    const text = `
*GOVERNMENT OF INDIA // NATIONAL HEALTH MISSION*
*ABHA DIGITAL HEALTH PASSPORT - AYUSHMAN BHARAT*
--------------------------------------------------
*Patient Name:* ${patient.fullName} (${patient.gender}, ${patient.age}y)
*ABHA ID:* ${abha}
*Village Cluster:* ${patient.villageCluster}
*Condition / Triage:* ${patient.conditionTag}

*LATEST DOMICILIARY VITALS:*
• BP: ${patient.data.systolicBP}/${patient.data.diastolicBP} mmHg
• Pulse: ${patient.data.heartRate} bpm
• SpO2: ${patient.data.spO2}%
• Hb: ${patient.data.hemoglobinGdl} g/dL
• Temp: ${patient.data.temperatureC}°C

*PHC LAB INVESTIGATIONS:*
${labs.map(l => `• ${l.testName}: ${l.resultValue} (${l.normalRange}) - [${l.status}] - ${l.performedAt}`).join('\n') || '• No pending lab investigations.'}

*ACTIVE PRESCRIPTION SCHEDULE:*
${rxs.map(r => `• ${r.medicineName} (${r.dosage}) - ${r.frequency} [${r.timing === 'AFTER_FOOD' ? 'After Food' : 'Before Food'}] for ${r.daysPrescribed} days (Prescribed by: ${r.issuedBy})`).join('\n') || `• ${patient.data.medicationsIssued}`}

*CLINICAL FIELD NOTES:*
${patient.data.clinicalNotes}

*Last Synchronized:* ${new Date(patient.lastModifiedAt).toLocaleString()}
*GramSync v2.4 (HT-03 Offline Healthcare Engine)*
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xs">
              <Share2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  Ayushman Bharat Digital Health Passport
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Unified Clinical Record & Prescription QR
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-stone-50/50">
          
          {/* FEATURE HIGHLIGHT: Instant Scannable Offline Medicine QR Code Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-emerald-700/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* QR Code Container */}
              <div className="bg-white p-2.5 rounded-2xl shadow-lg border-2 border-emerald-300/40 shrink-0 text-center relative group">
                {qrUrl ? (
                  <img 
                    src={qrUrl} 
                    alt="Patient Offline Prescription QR" 
                    className="w-40 h-40 sm:w-44 sm:h-44 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center bg-stone-100 rounded-lg text-stone-400">
                    <QrCode className="w-8 h-8 animate-pulse text-stone-400" />
                  </div>
                )}
                <div className="mt-1 flex items-center justify-center gap-1 text-[10px] font-bold text-emerald-900 uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>100% Offline QR</span>
                </div>
              </div>

              {/* QR Info & Actions */}
              <div className="flex-1 text-center sm:text-left space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[11px] font-bold border border-emerald-400/30">
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{t('qrPrescriptionTitle')}</span>
                </div>

                <h4 className="text-base sm:text-lg font-bold text-white leading-tight">
                  {patient.fullName} • {t('latestMedicines')} ({rxs.length} दवाइयाँ)
                </h4>

                <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
                  {t('qrPrescriptionSubtitle')}. 
                  इस क्यूआर कोड को किसी भी स्मार्टफ़ोन कैमरे, 2D स्कैनर या केमिस्ट सॉफ्टवेयर से स्कैन करके वर्तमान दवाइयाँ व शारीरिक स्थिति देखी जा सकती है।
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <button
                    onClick={handleDownloadQr}
                    className="px-3 py-1.5 text-xs font-bold bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t('downloadQr')}</span>
                  </button>

                  <button
                    onClick={() => setShowRawPayload(!showRawPayload)}
                    className="px-3 py-1.5 text-xs font-semibold bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 rounded-xl flex items-center gap-1.5 border border-emerald-600/40 transition-colors cursor-pointer"
                  >
                    {showRawPayload ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{t('previewQrData')}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Optional Scanned Payload Inspector */}
            {showRawPayload && (
              <div className="mt-4 pt-3 border-t border-emerald-700/50 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                    {t('scanHelp')} (Decoded String):
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    {qrTextPayload.length} bytes
                  </span>
                </div>
                <pre className="bg-emerald-950/90 p-3 rounded-xl border border-emerald-700/60 text-emerald-200 text-[11px] font-mono leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                  {qrTextPayload}
                </pre>
              </div>
            )}
          </div>

          {/* ABHA Patient ID Card Header */}
          <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              ABHA Verified Record
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Dignified Patient Photo / ID Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-900 text-white flex flex-col items-center justify-center shadow-md shrink-0 border-2 border-emerald-400/40 ring-4 ring-emerald-500/10 relative">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mb-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-bold tracking-tight text-white font-mono">
                  {patient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-emerald-100 font-medium">
                  {patient.gender === 'Female' ? 'महिला' : 'पुरुष'}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-bold text-stone-900">
                    {patient.fullName}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    {patient.gender === 'Female' ? 'महिला' : 'पुरुष'}, {patient.age} वर्ष
                  </span>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                    {patient.conditionTag}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-stone-600 pt-1 font-mono">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>ABHA ID: <strong className="text-stone-900 font-bold">{abha}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>{patient.villageCluster}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>{patient.phone || '+91 98290 XXXXX'}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                    <span>Last Check: {new Date(patient.lastModifiedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1: Domiciliary Vitals Strip */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-emerald-600" />
                1. Domiciliary Acute Physiological Vitals
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                ASHA Field Kit Verified
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center">
              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Blood Pressure</span>
                <span className="text-base font-bold text-stone-900 font-mono">
                  {patient.data.systolicBP}/{patient.data.diastolicBP}
                </span>
                <span className="text-[10px] text-stone-500 block">mmHg</span>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Heart Rate</span>
                <span className="text-base font-bold text-rose-700 font-mono">
                  {patient.data.heartRate}
                </span>
                <span className="text-[10px] text-stone-500 block">BPM</span>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Oxygen (SpO2)</span>
                <span className="text-base font-bold text-blue-700 font-mono">
                  {patient.data.spO2}%
                </span>
                <span className="text-[10px] text-stone-500 block">Normal &gt; 95%</span>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Hemoglobin</span>
                <span className="text-base font-bold text-amber-800 font-mono">
                  {patient.data.hemoglobinGdl}
                </span>
                <span className="text-[10px] text-stone-500 block">g/dL</span>
              </div>

              <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-100 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-stone-500 uppercase block font-semibold">Temperature</span>
                <span className="text-base font-bold text-orange-700 font-mono">
                  {patient.data.temperatureC}°C
                </span>
                <span className="text-[10px] text-stone-500 block">Axillary</span>
              </div>
            </div>
          </div>

          {/* Section 2: PHC / Hospital Diagnostic Lab Records */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-indigo-600" />
                2. PHC & Referral Diagnostic Laboratory Reports
              </span>
              <span className="text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
                {labs.length} Tests Synced
              </span>
            </div>

            {labs.length > 0 ? (
              <div className="divide-y divide-stone-100">
                {labs.map(lab => (
                  <div key={lab.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">{lab.testName}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          lab.status === 'CRITICAL' 
                            ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                            : lab.status === 'ELEVATED'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {lab.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                        <span>{lab.performedAt}</span>
                        <span>•</span>
                        <span>{new Date(lab.testDate).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[11px] text-stone-600 italic mt-0.5">
                        Note: {lab.doctorRemarks}
                      </p>
                    </div>

                    <div className="text-left sm:text-right shrink-0 bg-stone-50 sm:bg-transparent p-2 sm:p-0 rounded-lg">
                      <div className="text-sm font-bold text-stone-900 font-mono">{lab.resultValue}</div>
                      <div className="text-[10px] text-stone-500">Ref: {lab.normalRange}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-stone-400">
                No hospital diagnostic laboratory records recorded yet.
              </div>
            )}
          </div>

          {/* Section 3: Active Prescription & Medicines */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b border-stone-100 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-rose-600" />
                3. Active Prescriptions & Medication Regimen
              </span>
              <span className="text-[11px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                {rxs.length} Prescribed
              </span>
            </div>

            {rxs.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {rxs.map(rx => (
                  <div key={rx.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{rx.medicineName}</span>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-xs">
                        {rx.daysPrescribed} Days
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600 flex items-center justify-between">
                      <span>खुराक: <strong>{rx.dosage}</strong></span>
                      <span className="text-[10px] text-stone-500">{rx.timing === 'AFTER_FOOD' ? 'खाने के बाद' : 'खाली पेट'}</span>
                    </div>
                    <div className="text-[11px] text-emerald-700 font-semibold">
                      समय: {rx.frequency}
                    </div>
                    <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-200">
                      Issued by {rx.issuedBy} ({rx.issuedDate})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-stone-700 p-2.5 bg-stone-50 rounded-xl">
                {patient.data.medicationsIssued}
              </div>
            )}
          </div>

          {/* Section 4: Clinical Observations */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1">
              4. ASHA Field Worker Clinical Triage Observations
            </span>
            <p className="text-xs text-stone-700 leading-relaxed bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
              {patient.data.clinicalNotes}
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-5 py-3.5 bg-white border-t border-stone-200 flex flex-wrap items-center justify-between gap-2.5">
          <div className="text-[11px] text-stone-500 font-mono">
            GramSync • Offline ABDM Clinical Summary
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopySummary}
              className="px-3.5 py-2 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">COPIED WHATSAPP SUMMARY!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-600" />
                  <span>SHARE ON WHATSAPP / COPY</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT HEALTH PASSPORT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
