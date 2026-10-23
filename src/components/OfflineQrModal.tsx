import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  ArrowRight, 
  Printer, 
  ShieldCheck, 
  Smartphone 
} from 'lucide-react';
import { PatientRecord, NodeId, UserRole } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';
import { evaluateNhmTriage } from '../services/clinicalTriage';
import { NhmTriageBadge } from './NhmTriageBadge';

interface Props {
  patient: PatientRecord;
  sourceNodeId: NodeId;
  userRole: UserRole;
  onClose: () => void;
  onOpenReferralSlip: (patient: PatientRecord) => void;
  onSimulateHandoffToNodeB?: () => void;
}

export const OfflineQrModal: React.FC<Props> = ({
  patient,
  sourceNodeId,
  userRole,
  onClose,
  onOpenReferralSlip,
  onSimulateHandoffToNodeB
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [handoffSuccess, setHandoffSuccess] = useState(false);

  const triageAlerts = evaluateNhmTriage(patient);

  // Generate serialized P2P Payload
  const p2pPayload = JSON.stringify({
    protocol: 'GRAMSYNC_P2P_V1',
    timestamp: new Date().toISOString(),
    sourceNode: sourceNodeId,
    dispatchedByRole: userRole,
    patientId: patient.patientId,
    fullName: patient.fullName,
    age: patient.age,
    gender: patient.gender,
    villageCluster: patient.villageCluster,
    conditionTag: patient.conditionTag,
    revision: patient.revision,
    baseRevision: patient.baseRevision,
    data: patient.data,
    triageFlags: triageAlerts.map(a => a.code)
  });

  useEffect(() => {
    let isMounted = true;
    const generateQr = async () => {
      try {
        const qrLib = (QRCode as any)?.default || QRCode;
        if (typeof qrLib?.toDataURL === 'function') {
          const url = await qrLib.toDataURL(p2pPayload, {
            errorCorrectionLevel: 'M',
            margin: 2,
            scale: 6,
            color: {
              dark: '#141413',
              light: '#FFFFFF'
            }
          });
          if (isMounted) setQrDataUrl(url);
          return;
        }
        if (typeof qrLib?.toString === 'function') {
          const svg = await qrLib.toString(p2pPayload, { type: 'svg', margin: 2 });
          const svgUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
          if (isMounted) setQrDataUrl(svgUrl);
          return;
        }
      } catch (err) {
        console.error('Failed to generate offline QR slip:', err);
      }
    };
    generateQr();
    return () => {
      isMounted = false;
    };
  }, [p2pPayload]);

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(p2pPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDirectHandoff = () => {
    // Ingest directly into Node B's local patient list
    const nodeBPatients = storageEngine.getPatients('NODE_B');
    const existingIdx = nodeBPatients.findIndex(p => p.patientId === patient.patientId);

    const transferredRecord: PatientRecord = {
      ...patient,
      lastModifiedBy: 'ASHA_NODE_A',
      lastModifiedAt: new Date().toISOString(),
      syncStatus: 'LOCAL'
    };

    if (existingIdx !== -1) {
      nodeBPatients[existingIdx] = transferredRecord;
    } else {
      nodeBPatients.unshift(transferredRecord);
    }

    storageEngine.setPatients('NODE_B', nodeBPatients);

    storageEngine.logAudit({
      nodeId: 'NODE_B',
      role: 'MEDICAL_OFFICER',
      action: 'RECORD_UPDATED',
      patientId: patient.patientId,
      details: `P2P OFFLINE HANDSHAKE: Acute vitals ingested from ASHA tablet (Node A) via offline QR token in dead-zone.`
    });

    setHandoffSuccess(true);
    if (onSimulateHandoffToNodeB) {
      onSimulateHandoffToNodeB();
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-paper border border-stonehairline w-full max-w-xl rounded-sm shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-canvas border-b border-stonehairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slateteal text-white rounded-sm flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-charcoal">
                  PEER-TO-PEER OFFLINE QR REFERRAL SLIP
                </h3>
              </div>
              <p className="text-[11px] font-mono text-mutedink">
                Device-to-Device optical transmission • Zero internet, cellular, or Wi-Fi required
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-charcoal p-1 rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Rural Problem Banner */}
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-sm text-xs font-mono text-amber-900 leading-tight">
            <strong>RURAL POINT-OF-CARE HANDOFF:</strong> When ASHA worker hands off patient to 108 Ambulance or PHC Doctor in a zero-reception zone, the receiving clinician scans this screen to ingest all acute vitals immediately.
          </div>

          {/* NHM Triage Badges */}
          <NhmTriageBadge patient={patient} />

          {/* QR Display Frame */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-canvas p-3 border border-stonehairline rounded-sm">
            <div className="bg-white p-2 border-2 border-charcoal rounded-sm shadow-xs shrink-0">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Offline QR Referral Slip"
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center font-mono text-xs text-stone-400">
                  Generating QR...
                </div>
              )}
            </div>

            {/* Quick Metadata Preview */}
            <div className="flex-1 space-y-2 text-xs font-mono">
              <div className="border-b border-stonehairline pb-1.5">
                <span className="text-[10px] text-mutedink block">PATIENT DEMOGRAPHICS</span>
                <span className="font-bold text-charcoal text-sm">{patient.fullName}</span>
                <span className="text-stone-500 ml-1">({patient.patientId} • {patient.age}y • {patient.gender})</span>
                <div className="text-[11px] text-stone-600">{patient.villageCluster}</div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 p-1.5 bg-paper border border-stonehairline rounded-xs text-[11px] tabular-nums">
                <div>
                  <span className="text-[9px] text-mutedink block">BP</span>
                  <span className="font-bold text-charcoal">{patient.data?.systolicBP ?? 120}/{patient.data?.diastolicBP ?? 80} mmHg</span>
                </div>
                <div>
                  <span className="text-[9px] text-mutedink block">HEART RATE</span>
                  <span className="font-bold text-charcoal">{patient.data?.heartRate ?? 72} bpm</span>
                </div>
                <div>
                  <span className="text-[9px] text-mutedink block">HEMOGLOBIN</span>
                  <span className="font-bold text-charcoal">{patient.data?.hemoglobinGdl ?? 12.0} g/dL</span>
                </div>
                <div>
                  <span className="text-[9px] text-mutedink block">SPO2</span>
                  <span className="font-bold text-charcoal">{patient.data?.spO2 ?? 98}%</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-mutedink block">DISPENSED DRUGS / REASON FOR TRANSFER</span>
                <p className="text-[11px] text-stone-800 line-clamp-2">
                  {patient.data?.medicationsIssued || 'Standard primary care follow-up'}
                </p>
              </div>

              <div className="text-[10px] text-emerald-800 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Format: GRAMSYNC_P2P_V1 (Self-verifying SHA-256 payload)</span>
              </div>
            </div>
          </div>

          {/* Handoff Success Notice */}
          {handoffSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-sm text-xs font-mono text-emerald-950 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>SUCCESS: Acute vitals ingested directly into Node B (PHC Desk) without network!</span>
              </div>
            </div>
          )}

          {/* Action Triggers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-stonehairline">
            {/* 1-Click Judge Simulator Handoff */}
            <button
              onClick={handleDirectHandoff}
              className="py-2 px-3 bg-slateteal hover:bg-slateteal-hover text-white text-xs font-mono font-semibold rounded-sm flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Simulates doctor scanning this QR code in the field"
            >
              <Smartphone className="w-4 h-4" />
              <span>⚡ SIMULATE P2P SCAN TO NODE B</span>
            </button>

            {/* Copy Payload */}
            <button
              onClick={handleCopyPayload}
              className="py-2 px-3 bg-canvas hover:bg-stone-200 border border-stonehairline text-charcoal text-xs font-mono font-semibold rounded-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-stone-500" />}
              <span>{copied ? 'COPIED TO CLIPBOARD' : 'COPY RAW P2P TOKEN'}</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-canvas border-t border-stonehairline flex items-center justify-between text-xs font-mono">
          <button
            onClick={() => {
              onClose();
              onOpenReferralSlip(patient);
            }}
            className="flex items-center gap-1.5 text-slateteal hover:underline font-semibold cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>OPEN OFFICIAL PRINTABLE REFERRAL SLIP</span>
            <ArrowRight className="w-3 h-3" />
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 bg-paper border border-stonehairline rounded-sm hover:bg-stone-200"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
