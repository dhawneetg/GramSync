import React, { useState } from 'react';
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
  Calendar 
} from 'lucide-react';
import { PatientRecord } from '../types/clinical';

interface Props {
  patient: PatientRecord;
  onClose: () => void;
}

export const ShareHealthPassportModal: React.FC<Props> = ({ patient, onClose }) => {
  const [copied, setCopied] = useState(false);

  const abha = patient.abhaId || `91-${patient.patientId}-2026-9912`;
  const labs = patient.labReports || [];
  const rxs = patient.prescriptions || [];

  const handlePrint = () => {
    window.print();
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
${labs.map(l => `• ${l.testName}: ${l.resultValue} (${l.normalRange}) - [${l.status}]`).join('\n') || '• No pending lab investigations.'}

*ACTIVE PRESCRIPTION SCHEDULE:*
${rxs.map(r => `• ${r.medicineName} (${r.dosage}) - ${r.frequency} for ${r.daysPrescribed} days`).join('\n') || `• ${patient.data.medicationsIssued}`}

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
        <div className="px-5 py-4 bg-linear-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-xs">
              <Share2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30">
                  Ayushman Bharat Digital Health Passport
                </span>
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">
                Unified Clinical Record & Lab Passport
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
          {/* ABHA Patient ID Card Header */}
          <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-4 sm:p-5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-bl-xl tracking-wider">
              ABHA Verified Record
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shrink-0">
                {patient.fullName.charAt(0)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-lg font-bold text-stone-900">
                    {patient.fullName}
                  </h4>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">
                    {patient.gender}, {patient.age} वर्ष
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
                Doctor Prescribed
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
            GramSync v2.4 • Offline ABDM Clinical Summary
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
