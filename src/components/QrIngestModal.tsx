import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  Download, 
  AlertTriangle, 
  UserCheck 
} from 'lucide-react';
import { PatientRecord, NodeId } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';

interface Props {
  targetNodeId: NodeId;
  onClose: () => void;
  onIngested: (patient: PatientRecord) => void;
}

export const QrIngestModal: React.FC<Props> = ({ targetNodeId, onClose, onIngested }) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedPayload, setParsedPayload] = useState<any | null>(null);

  const handleParse = (text: string) => {
    setTokenInput(text);
    setError(null);
    if (!text.trim()) {
      setParsedPayload(null);
      return;
    }

    try {
      const data = JSON.parse(text.trim());
      if (data.protocol !== 'GRAMSYNC_P2P_V1' || !data.patientId || !data.data) {
        throw new Error('Unrecognized clinical P2P format. Expected GRAMSYNC_P2P_V1 protocol.');
      }
      setParsedPayload(data);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON format');
      setParsedPayload(null);
    }
  };

  const handleCommitIngest = () => {
    if (!parsedPayload) return;

    const patients = storageEngine.getPatients(targetNodeId);
    const existingIdx = patients.findIndex(p => p.patientId === parsedPayload.patientId);

    const importedRecord: PatientRecord = {
      patientId: parsedPayload.patientId,
      fullName: parsedPayload.fullName,
      age: parsedPayload.age,
      gender: parsedPayload.gender,
      villageCluster: parsedPayload.villageCluster,
      conditionTag: parsedPayload.conditionTag,
      revision: parsedPayload.revision || 1,
      baseRevision: parsedPayload.baseRevision || 1,
      syncStatus: 'LOCAL',
      lastModifiedBy: parsedPayload.sourceNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      data: parsedPayload.data
    };

    if (existingIdx !== -1) {
      patients[existingIdx] = importedRecord;
    } else {
      patients.unshift(importedRecord);
    }

    storageEngine.setPatients(targetNodeId, patients);

    storageEngine.logAudit({
      nodeId: targetNodeId,
      role: 'MEDICAL_OFFICER',
      action: 'RECORD_UPDATED',
      patientId: parsedPayload.patientId,
      details: `P2P OFFLINE INGEST: Scanned QR packet for ${parsedPayload.fullName} (${parsedPayload.patientId}). Transferred device-to-device without internet.`
    });

    onIngested(importedRecord);
    onClose();
  };

  const handleQuickPasteSample = () => {
    const nodeAPatients = storageEngine.getPatients('NODE_A');
    const sunita = nodeAPatients.find(p => p.patientId === 'PT-8041') || nodeAPatients[0];
    if (sunita) {
      const sample = JSON.stringify({
        protocol: 'GRAMSYNC_P2P_V1',
        timestamp: new Date().toISOString(),
        sourceNode: 'NODE_A',
        dispatchedByRole: 'ASHA_WORKER',
        patientId: sunita.patientId,
        fullName: sunita.fullName,
        age: sunita.age,
        gender: sunita.gender,
        villageCluster: sunita.villageCluster,
        conditionTag: sunita.conditionTag,
        revision: sunita.revision,
        baseRevision: sunita.baseRevision,
        data: sunita.data
      });
      handleParse(sample);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-paper border border-stonehairline w-full max-w-lg rounded-sm shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 bg-canvas border-b border-stonehairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slateteal text-white rounded-sm flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-mono text-sm font-bold text-charcoal">
                INGEST OFFLINE P2P QR PAYLOAD
              </h3>
              <p className="text-[11px] font-mono text-mutedink">
                Target Device: Node B (PHC Doctor Desk) • Zero Network Required
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

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink">
                PASTE RAW QR TOKEN (SCANNED OPTICALLY)
              </label>
              <button
                type="button"
                onClick={handleQuickPasteSample}
                className="text-[10px] font-mono text-slateteal hover:underline font-semibold"
              >
                + Paste Active Node A Patient Token
              </button>
            </div>
            <textarea
              rows={4}
              value={tokenInput}
              onChange={e => handleParse(e.target.value)}
              placeholder="Paste raw JSON string scanned from ASHA field tablet..."
              className="w-full bg-canvas border border-stonehairline p-2 font-mono text-xs text-charcoal rounded-sm focus:outline-slateteal"
            />
            {error && (
              <div className="text-red-600 text-[11px] font-mono mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* Parsed Preview */}
          {parsedPayload && (
            <div className="p-3 bg-canvas border border-stonehairline rounded-sm space-y-2">
              <div className="flex items-center justify-between border-b border-stonehairline pb-1.5">
                <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-charcoal">
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{parsedPayload.fullName} ({parsedPayload.patientId})</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-xs font-semibold">
                  VALID P2P TOKEN
                </span>
              </div>

              <div className="grid grid-cols-4 gap-1 font-mono text-[11px] tabular-nums bg-paper p-1.5 border border-stonehairline rounded-xs">
                <div>
                  <span className="text-[9px] text-mutedink block">BP</span>
                  <span className="font-bold">{parsedPayload.data.systolicBP}/{parsedPayload.data.diastolicBP}</span>
                </div>
                <div>
                  <span className="text-[9px] text-mutedink block">HR</span>
                  <span className="font-bold">{parsedPayload.data.heartRate} bpm</span>
                </div>
                <div>
                  <span className="text-[9px] text-mutedink block">Hb</span>
                  <span className="font-bold">{parsedPayload.data.hemoglobinGdl} g/dL</span>
                </div>
                <div>
                  <span className="text-[9px] text-mutedink block">SpO2</span>
                  <span className="font-bold">{parsedPayload.data.spO2}%</span>
                </div>
              </div>

              <p className="text-[11px] font-mono text-stone-700 bg-paper p-1.5 border border-stonehairline rounded-xs">
                <strong>Rx / Transfer Reason:</strong> {parsedPayload.data.medicationsIssued}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-canvas border-t border-stonehairline flex items-center justify-end gap-2 text-xs font-mono">
          <button
            onClick={onClose}
            className="px-3 py-1.5 bg-paper border border-stonehairline text-mutedink hover:text-charcoal rounded-sm"
          >
            CANCEL
          </button>
          <button
            onClick={handleCommitIngest}
            disabled={!parsedPayload}
            className="px-4 py-1.5 bg-slateteal hover:bg-slateteal-hover text-white font-semibold rounded-sm flex items-center gap-1.5 shadow-xs disabled:opacity-40 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>INGEST INTO NODE B (LOCAL CLINIC DESK)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
