import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  GitMerge, 
  X, 
  ArrowRight, 
  Clock, 
  User, 
  FileCheck 
} from 'lucide-react';
import { PatientRecord, NodeId, UserRole, VitalSignPayload } from '../types/clinical';
import { syncCoordinator } from '../services/syncCoordinator';

interface Props {
  patient: PatientRecord;
  nodeId: NodeId;
  userRole: UserRole;
  onClose: () => void;
  onResolved: () => void;
}

type ClinicalField = keyof VitalSignPayload;

interface FieldConfig {
  key: ClinicalField;
  label: string;
  unit: string;
  isTextarea?: boolean;
}

const CLINICAL_FIELDS: FieldConfig[] = [
  { key: 'systolicBP', label: 'Systolic Blood Pressure', unit: 'mmHg' },
  { key: 'diastolicBP', label: 'Diastolic Blood Pressure', unit: 'mmHg' },
  { key: 'heartRate', label: 'Heart Rate', unit: 'BPM' },
  { key: 'spO2', label: 'Oxygen Saturation', unit: '%' },
  { key: 'hemoglobinGdl', label: 'Hemoglobin Count', unit: 'g/dL' },
  { key: 'temperatureC', label: 'Body Temperature', unit: '°C' },
  { key: 'medicationsIssued', label: 'Medications Prescribed', unit: 'Rx', isTextarea: true },
  { key: 'clinicalNotes', label: 'Clinical Triage Notes', unit: 'Notes', isTextarea: true }
];

export const ConflictResolutionModal: React.FC<Props> = ({
  patient,
  nodeId,
  userRole,
  onClose,
  onResolved
}) => {
  const conflict = patient.conflictPayload;
  if (!conflict) return null;

  const base = conflict.baseData;
  const local = conflict.localData;
  const remote = conflict.remoteData;

  // Track selection per field: 'LOCAL' | 'REMOTE' | 'CUSTOM'
  const [selections, setSelections] = useState<Record<ClinicalField, 'LOCAL' | 'REMOTE' | 'CUSTOM'>>(() => {
    const init: Record<string, 'LOCAL' | 'REMOTE' | 'CUSTOM'> = {};
    CLINICAL_FIELDS.forEach(f => {
      // If local changed from base, default to local, else remote
      const localChanged = local[f.key] !== base[f.key];
      const remoteChanged = remote[f.key] !== base[f.key];
      if (localChanged && !remoteChanged) {
        init[f.key] = 'LOCAL';
      } else if (remoteChanged && !localChanged) {
        init[f.key] = 'REMOTE';
      } else {
        // Both changed concurrently: default to remote or local
        init[f.key] = 'LOCAL';
      }
    });
    return init as Record<ClinicalField, 'LOCAL' | 'REMOTE' | 'CUSTOM'>;
  });

  const [mergedDraft, setMergedDraft] = useState<VitalSignPayload>(() => {
    const initialDraft: Partial<VitalSignPayload> = {};
    CLINICAL_FIELDS.forEach(f => {
      const localChanged = local[f.key] !== base[f.key];
      initialDraft[f.key] = localChanged ? (local[f.key] as never) : (remote[f.key] as never);
    });
    return initialDraft as VitalSignPayload;
  });

  const [resolutionNote, setResolutionNote] = useState(
    'Reconciled field vitals with remote PHC clinical directives. Prioritized acute bedside BP vitals with updated emergency medication regimen.'
  );
  const [isCommitting, setIsCommitting] = useState(false);

  const selectFieldSource = (field: ClinicalField, source: 'LOCAL' | 'REMOTE') => {
    setSelections(prev => ({ ...prev, [field]: source }));
    setMergedDraft(prev => ({
      ...prev,
      [field]: source === 'LOCAL' ? local[field] : remote[field]
    }));
  };

  const handleCustomChange = (field: ClinicalField, val: string | number) => {
    setSelections(prev => ({ ...prev, [field]: 'CUSTOM' }));
    setMergedDraft(prev => ({
      ...prev,
      [field]: typeof val === 'string' && !isNaN(Number(val)) && field !== 'medicationsIssued' && field !== 'clinicalNotes'
        ? Number(val)
        : val
    }));
  };

  const handleCommitMerge = async () => {
    if (!resolutionNote.trim()) {
      alert('Mandatory requirement: A clinical justification note is required to commit a 3-way conflict resolution.');
      return;
    }

    setIsCommitting(true);
    try {
      await syncCoordinator.resolveConflict(
        nodeId,
        patient.patientId,
        mergedDraft,
        resolutionNote,
        userRole
      );
      onResolved();
      onClose();
    } finally {
      setIsCommitting(false);
    }
  };

  const nextRev = conflict.remoteRevision + 1;

  return (
    <div className="fixed inset-0 bg-charcoal/60 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-paper border border-stonehairline w-full max-w-6xl rounded-sm shadow-2xl flex flex-col max-h-[96vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-red-50/60 border-b border-red-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-700 text-white rounded-sm flex items-center justify-center">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-red-800 bg-red-100 px-1.5 py-0.5 border border-red-300 rounded-sm">
                  HTTP 409 REVISION CONFLICT
                </span>
                <h3 className="font-mono text-sm font-bold text-charcoal">
                  PATIENT: {patient.fullName} ({patient.patientId})
                </h3>
              </div>
              <p className="text-[11px] font-mono text-stone-600 mt-0.5">
                Divergent branch detected: Base Revision was <span className="font-bold">v{patient.baseRevision}</span>. Remote Server advanced to <span className="font-bold">v{conflict.remoteRevision}</span>. Resolution will commit as canonical <span className="font-bold text-slateteal">v{nextRev}</span>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-charcoal p-1 rounded-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3-Way Git Diff Table */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="border border-stonehairline rounded-sm overflow-hidden bg-white shadow-xs">
            <table className="w-full border-collapse text-left text-xs font-mono">
              <thead>
                <tr className="bg-canvas border-b border-stonehairline text-[11px] text-mutedink uppercase">
                  <th className="p-2.5 border-r border-stonehairline w-48 font-bold">
                    Clinical Metric
                  </th>
                  <th className="p-2.5 border-r border-stonehairline w-44 bg-stone-100/70">
                    <div>BASE COMMIT (v{patient.baseRevision})</div>
                    <div className="text-[9px] text-stone-400 font-normal">Common Ancestor</div>
                  </th>
                  <th className="p-2.5 border-r border-stonehairline w-64 bg-amber-50/50">
                    <div className="flex items-center justify-between text-amber-900 font-bold">
                      <span>LOCAL (Node A - ASHA)</span>
                      <span className="text-[9px] bg-amber-200/80 px-1 rounded-xs">Divergent Draft</span>
                    </div>
                    <div className="text-[9px] text-amber-700 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{new Date(patient.lastModifiedAt).toLocaleTimeString()}</span>
                    </div>
                  </th>
                  <th className="p-2.5 border-r border-stonehairline w-64 bg-blue-50/50">
                    <div className="flex items-center justify-between text-blue-900 font-bold">
                      <span>REMOTE SERVER (v{conflict.remoteRevision})</span>
                      <span className="text-[9px] bg-blue-200/80 px-1 rounded-xs">{conflict.remoteAuthor}</span>
                    </div>
                    <div className="text-[9px] text-blue-700 flex items-center gap-1 mt-0.5">
                      <User className="w-2.5 h-2.5" />
                      <span>{new Date(conflict.remoteTimestamp).toLocaleTimeString()}</span>
                    </div>
                  </th>
                  <th className="p-2.5 bg-emerald-50/60 text-emerald-950 font-bold">
                    <div className="flex items-center gap-1.5">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>MERGED OUTPUT (v{nextRev})</span>
                    </div>
                    <div className="text-[9px] text-emerald-700 font-normal">Active Selection / Custom</div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stonehairline">
                {CLINICAL_FIELDS.map(field => {
                  const baseVal = base[field.key];
                  const localVal = local[field.key];
                  const remoteVal = remote[field.key];
                  const mergedVal = mergedDraft[field.key];
                  const isConflict = localVal !== remoteVal;
                  const currentChoice = selections[field.key];

                  return (
                    <tr
                      key={field.key}
                      className={`hover:bg-stone-50/80 transition-colors ${
                        isConflict ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Metric Name */}
                      <td className="p-2.5 border-r border-stonehairline font-sans font-semibold text-charcoal">
                        <div>{field.label}</div>
                        <div className="text-[10px] font-mono text-mutedink">{field.unit}</div>
                      </td>

                      {/* Base Value */}
                      <td className="p-2.5 border-r border-stonehairline font-mono text-stone-500 bg-stone-50/40 tabular-nums">
                        {String(baseVal)}
                      </td>

                      {/* Local Node A Value */}
                      <td
                        onClick={() => selectFieldSource(field.key, 'LOCAL')}
                        className={`p-2.5 border-r border-stonehairline cursor-pointer select-none transition-all ${
                          currentChoice === 'LOCAL'
                            ? 'bg-amber-100/80 ring-2 ring-slateteal ring-inset font-bold text-charcoal'
                            : 'hover:bg-amber-50 text-stone-700'
                        }`}
                        title="Click to adopt Local (ASHA) value into merge"
                      >
                        <div className="flex items-center justify-between">
                          <span className="tabular-nums">{String(localVal)}</span>
                          {currentChoice === 'LOCAL' && (
                            <span className="text-[9px] bg-slateteal text-white px-1 rounded-xs">
                              SELECTED
                            </span>
                          )}
                        </div>
                        {localVal !== baseVal && (
                          <span className="text-[9px] text-amber-700 font-semibold block mt-0.5">
                            ▲ Modified offline
                          </span>
                        )}
                      </td>

                      {/* Remote Node B / Server Value */}
                      <td
                        onClick={() => selectFieldSource(field.key, 'REMOTE')}
                        className={`p-2.5 border-r border-stonehairline cursor-pointer select-none transition-all ${
                          currentChoice === 'REMOTE'
                            ? 'bg-blue-100/80 ring-2 ring-slateteal ring-inset font-bold text-charcoal'
                            : 'hover:bg-blue-50 text-stone-700'
                        }`}
                        title="Click to adopt Remote (PHC Clinic) value into merge"
                      >
                        <div className="flex items-center justify-between">
                          <span className="tabular-nums">{String(remoteVal)}</span>
                          {currentChoice === 'REMOTE' && (
                            <span className="text-[9px] bg-slateteal text-white px-1 rounded-xs">
                              SELECTED
                            </span>
                          )}
                        </div>
                        {remoteVal !== baseVal && (
                          <span className="text-[9px] text-blue-700 font-semibold block mt-0.5">
                            ▲ Modified on server
                          </span>
                        )}
                      </td>

                      {/* Merged Resolution Cell */}
                      <td className="p-2.5 bg-emerald-50/30">
                        {field.isTextarea ? (
                          <textarea
                            rows={2}
                            value={String(mergedVal)}
                            onChange={e => handleCustomChange(field.key, e.target.value)}
                            className="w-full bg-white border border-stonehairline p-1.5 font-mono text-xs rounded-sm focus:outline-slateteal text-charcoal"
                          />
                        ) : (
                          <input
                            type={typeof baseVal === 'number' ? 'number' : 'text'}
                            value={String(mergedVal)}
                            onChange={e => handleCustomChange(field.key, e.target.value)}
                            className="w-full bg-white border border-stonehairline px-2 py-1 font-mono text-xs font-bold tabular-nums rounded-sm focus:outline-slateteal text-charcoal"
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mandatory Clinical Resolution Justification Note */}
          <div className="p-3 bg-canvas border border-stonehairline rounded-sm space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-charcoal flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>MANDATORY CLINICAL RESOLUTION AUDIT NOTE (ISO 13606 COMPLIANCE)</span>
              </label>
              <span className="text-[10px] font-mono text-mutedink">
                Logged immutably to device audit chain
              </span>
            </div>
            <textarea
              rows={2}
              required
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              placeholder="Explain rationale for choosing specific physiological vitals or medication dosages during conflict reconciliation..."
              className="w-full bg-white border border-stonehairline p-2 font-mono text-xs text-charcoal rounded-sm focus:outline-slateteal"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-4 py-3 bg-canvas border-t border-stonehairline flex items-center justify-between">
          <div className="text-[11px] font-mono text-mutedink flex items-center gap-2">
            <span>Resolving as Role:</span>
            <span className="font-bold text-charcoal bg-paper px-2 py-0.5 border border-stonehairline rounded-sm">
              {userRole}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono text-mutedink hover:text-charcoal bg-white border border-stonehairline rounded-sm"
            >
              CANCEL
            </button>
            <button
              onClick={handleCommitMerge}
              disabled={isCommitting || !resolutionNote.trim()}
              className="px-4 py-1.5 text-xs font-mono font-semibold text-white bg-slateteal hover:bg-slateteal-hover rounded-sm flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isCommitting ? 'COMMITTING MERGE...' : `COMMIT MERGE AS CANONICAL v${nextRev}`}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
