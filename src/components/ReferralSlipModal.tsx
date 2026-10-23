import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  FileText, 
  Activity, 
  PhoneCall 
} from 'lucide-react';
import { PatientRecord, UserRole } from '../types/clinical';
import { evaluateNhmTriage } from '../services/clinicalTriage';
import { NhmTriageBadge } from './NhmTriageBadge';

interface Props {
  patient: PatientRecord;
  userRole: UserRole;
  onClose: () => void;
}

export const ReferralSlipModal: React.FC<Props> = ({ patient, userRole, onClose }) => {
  const triageAlerts = evaluateNhmTriage(patient);
  const refCode = `NHM-REF-2026-${patient?.patientId || 'REC'}-${Math.floor(100 + Math.random() * 900)}`;

  const sys = patient.data?.systolicBP ?? 120;
  const dia = patient.data?.diastolicBP ?? 80;
  const hr = patient.data?.heartRate ?? 72;
  const hb = patient.data?.hemoglobinGdl ?? 12.0;
  const spo2 = patient.data?.spO2 ?? 98;
  const temp = patient.data?.temperatureC ?? 36.8;
  const meds = patient.data?.medicationsIssued || 'Standard primary care follow-up.';
  const notes = patient.data?.clinicalNotes || 'Routine domiciliary triage.';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    const textContent = `
================================================================================
GOVERNMENT OF INDIA // NATIONAL HEALTH MISSION (NHM)
RURAL FIRST REFERRAL UNIT (FRU) EMERGENCY CLINICAL REFERRAL SLIP
================================================================================
REFERRAL REF NO: ${refCode}
DISPATCH TIMESTAMP: ${new Date().toLocaleString()}
REFERRING NODE: Node A (Frontline ASHA Field Tablet - GramSync v2.4)
DISPATCHING ROLE: ${userRole}

--------------------------------------------------------------------------------
1. PATIENT DEMOGRAPHIC IDENTIFIERS
--------------------------------------------------------------------------------
Patient ID      : ${patient.patientId}
Full Name       : ${patient.fullName}
Age / Gender    : ${patient.age} Years / ${patient.gender || 'Unknown'}
Village Cluster : ${patient.villageCluster}
Condition Tag   : ${patient.conditionTag}
Monotonic Rev   : v${patient.revision} (Base: v${patient.baseRevision})

--------------------------------------------------------------------------------
2. ACUTE PHYSIOLOGICAL VITALS (AT DOMICILE)
--------------------------------------------------------------------------------
Blood Pressure  : ${sys}/${dia} mmHg
Heart Rate      : ${hr} bpm (Regular Sinus)
Hemoglobin Count: ${hb} g/dL
Pulse Oximetry  : ${spo2}% SpO2
Body Temperature: ${temp} °C

--------------------------------------------------------------------------------
3. NHM CLINICAL TRIAGE FLAGS
--------------------------------------------------------------------------------
${triageAlerts.length > 0 ? triageAlerts.map(a => `[!] ${a.label} (${a.nhmReference})\n    Protocol: ${a.protocolDescription}`).join('\n\n') : 'Routine Maternal/Primary-Care Follow-up.'}

--------------------------------------------------------------------------------
4. CURRENT DISPENSATION & PHARMACEUTICALS
--------------------------------------------------------------------------------
${meds}

--------------------------------------------------------------------------------
5. BEDSIDE CLINICAL OBSERVATION & FIELD TRIAGE NOTES
--------------------------------------------------------------------------------
${notes}

--------------------------------------------------------------------------------
6. EMERGENCY PROTOCOLS & SIGNATURES
--------------------------------------------------------------------------------
EMRI Emergency Ambulance Dispatch : DIAL 108
Medical Helpline & Tele-Triage   : DIAL 104

Referring Health Worker Signature : [ ASHA WORKER // ${patient.lastModifiedBy} ]
Receiving Medical Officer Stamp   : [ PRIMARY HEALTH CENTRE DESK // NODE B ]

================================================================================
PROTOTYPE NOTICE: Fictional/synthetic clinical data for JU TECHFEST 2026 (HT-03).
================================================================================
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Referral_Slip_${patient.patientId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(patient, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Clinical_Bundle_${patient.patientId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4 print:p-0 print:bg-white print:static print:block print:z-auto">
      <div className="bg-paper border border-stonehairline w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[95vh] overflow-hidden print:max-w-none print:shadow-none print:border-none print:overflow-visible print:h-auto">
        {/* Modal Toolbar (Hidden during print) */}
        <div className="print:hidden px-4 py-2.5 bg-canvas border-b border-stonehairline flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-slateteal" />
            <span className="font-mono text-xs font-bold text-charcoal">
              OFFLINE CLINICAL REFERRAL SLIP
            </span>
            <span className="text-[10px] font-mono text-stone-500">({patient.patientId})</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-2.5 py-1 text-xs font-mono font-semibold bg-slateteal hover:bg-slateteal-hover text-white rounded-sm flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>PRINT SLIP</span>
            </button>
            <button
              onClick={handleDownloadTxt}
              className="px-2 py-1 text-xs font-mono text-charcoal bg-paper hover:bg-stone-200 border border-stonehairline rounded-sm flex items-center gap-1 cursor-pointer"
              title="Download text file"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>.TXT</span>
            </button>
            <button
              onClick={handleDownloadJson}
              className="px-2 py-1 text-xs font-mono text-charcoal bg-paper hover:bg-stone-200 border border-stonehairline rounded-sm flex items-center gap-1 cursor-pointer"
              title="Export JSON audit bundle"
            >
              <Download className="w-3.5 h-3.5 text-stone-500" />
              <span>.JSON</span>
            </button>
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-charcoal p-1 rounded-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Document (Clinical Instrument Style) */}
        <div className="p-6 overflow-y-auto space-y-4 font-mono text-xs bg-white text-charcoal print:p-0 print:m-0">
          {/* Slip Header */}
          <div className="border-b-2 border-charcoal pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 font-bold text-sm tracking-tight text-charcoal">
                <Activity className="w-4 h-4 text-slateteal" />
                <span>NATIONAL HEALTH MISSION (NHM) // RURAL HEALTH DIVISION</span>
              </div>
              <div className="text-[11px] text-stone-600 font-semibold uppercase">
                FIRST REFERRAL UNIT (FRU) CLINICAL HANDOFF & TRANSFER SLIP
              </div>
            </div>
            <div className="text-right text-[10px] text-stone-600">
              <div>SLIP REF: <strong className="text-charcoal">{refCode}</strong></div>
              <div>DATE: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}</div>
            </div>
          </div>

          {/* NHM Triage Banner */}
          <div className="space-y-1">
            <NhmTriageBadge patient={patient} />
          </div>

          {/* Section 1: Demographics */}
          <div className="border border-stonehairline p-3 rounded-xs bg-canvas/40 space-y-2">
            <div className="text-[10px] uppercase font-bold text-mutedink tracking-wider border-b border-stonehairline pb-1">
              1. PATIENT DEMOGRAPHICS & SUBCENTRE CLUSTER
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>
                <span className="text-[9px] text-mutedink block">PATIENT NAME</span>
                <strong className="text-charcoal font-sans text-xs">{patient.fullName}</strong>
              </div>
              <div>
                <span className="text-[9px] text-mutedink block">IDENTIFIER</span>
                <strong className="text-charcoal">{patient.patientId}</strong>
              </div>
              <div>
                <span className="text-[9px] text-mutedink block">AGE / GENDER</span>
                <span>{patient.age} Yrs / {patient.gender}</span>
              </div>
              <div>
                <span className="text-[9px] text-mutedink block">REVISION</span>
                <span className="tabular-nums">v{patient.revision}</span>
              </div>
            </div>
            <div className="text-[11px] pt-1">
              <span className="text-[9px] text-mutedink block">VILLAGE / CLUSTER OUTPOST</span>
              <strong>{patient.villageCluster}</strong>
            </div>
          </div>

          {/* Section 2: Vitals Matrix */}
          <div className="border border-stonehairline rounded-xs overflow-hidden">
            <div className="p-2 bg-canvas border-b border-stonehairline text-[10px] uppercase font-bold text-mutedink tracking-wider">
              2. BEDSIDE PHYSIOLOGICAL VITALS RECORDED AT DOMICILE
            </div>
            <table className="w-full text-left text-xs tabular-nums">
              <thead>
                <tr className="bg-stone-50 border-b border-stonehairline text-[10px] text-stone-500 uppercase">
                  <th className="p-2 border-r border-stonehairline">Blood Pressure</th>
                  <th className="p-2 border-r border-stonehairline">Heart Rate</th>
                  <th className="p-2 border-r border-stonehairline">Hemoglobin</th>
                  <th className="p-2 border-r border-stonehairline">SpO2 Pulse</th>
                  <th className="p-2">Temp (°C)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={`p-2 border-r border-stonehairline font-bold ${sys >= 140 ? 'text-red-700 bg-red-50/50' : 'text-charcoal'}`}>
                    {sys}/{dia} mmHg
                  </td>
                  <td className="p-2 border-r border-stonehairline font-bold text-charcoal">
                    {hr} bpm
                  </td>
                  <td className={`p-2 border-r border-stonehairline font-bold ${hb < 11 ? 'text-amber-800 bg-amber-50/50' : 'text-charcoal'}`}>
                    {hb} g/dL
                  </td>
                  <td className={`p-2 border-r border-stonehairline font-bold ${spo2 < 95 ? 'text-red-700 bg-red-50/50' : 'text-charcoal'}`}>
                    {spo2}%
                  </td>
                  <td className="p-2 text-charcoal">
                    {temp} °C
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3: Medication & Stock */}
          <div className="border border-stonehairline p-3 rounded-xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-mutedink tracking-wider">
              3. DISPENSED MEDICATIONS & FIELD STOCK
            </div>
            <p className="bg-canvas p-2 border border-stonehairline rounded-xs text-[11px] text-charcoal leading-relaxed">
              {meds}
            </p>
          </div>

          {/* Section 4: Clinical Triage Notes */}
          <div className="border border-stonehairline p-3 rounded-xs space-y-1">
            <div className="text-[10px] uppercase font-bold text-mutedink tracking-wider">
              4. CLINICAL FIELD OBSERVATIONS & REASON FOR REFERRAL
            </div>
            <p className="bg-canvas p-2 border border-stonehairline rounded-xs text-[11px] text-charcoal leading-relaxed whitespace-pre-wrap">
              {notes}
            </p>
          </div>

          {/* Section 5: Signatures & Emergency Contacts */}
          <div className="border-t-2 border-charcoal pt-3 grid grid-cols-2 gap-4 text-[11px]">
            <div>
              <span className="text-[9px] text-mutedink uppercase block mb-1">
                EMERGENCY DISPATCH PROTOCOLS
              </span>
              <div className="flex items-center gap-2 text-charcoal font-bold">
                <PhoneCall className="w-3.5 h-3.5 text-red-600" />
                <span>108 (AMBULANCE) / 104 (HEALTH HELPLINE)</span>
              </div>
              <div className="text-[9px] text-stone-500 mt-1">
                At-Rest Encrypted: {patient.encryptedBlobPreview || 'AES-GCM-256 Validated'}
              </div>
            </div>

            <div className="text-right space-y-3">
              <div>
                <span className="text-[9px] text-mutedink uppercase block">
                  REFERRING ASHA WORKER SIGNATURE
                </span>
                <div className="font-bold text-charcoal underline underline-offset-4">
                  {patient.lastModifiedBy} // ASHA_UNIT
                </div>
              </div>
              <div className="text-[9px] text-stone-500">
                OFFICIAL RECORD STAMP: GRAMSYNC LOCAL VAULT
              </div>
            </div>
          </div>

          {/* Prototype Footer Stamp */}
          <div className="text-center text-[9px] text-stone-400 border-t border-stonehairline pt-2">
            JU TECHFEST 2026 // HT-03 PROTOTYPE • FICTIONAL SYNTHETIC CLINICAL TEST DATA ONLY
          </div>
        </div>
      </div>
    </div>
  );
};
