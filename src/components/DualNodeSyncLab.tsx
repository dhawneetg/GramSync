import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Server, 
  Tablet, 
  Monitor, 
  GitMerge, 
  AlertCircle, 
  CheckCircle, 
  Edit3
} from 'lucide-react';
import { PatientRecord, NodeId, NetworkMode, UserRole } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';
import { syncCoordinator } from '../services/syncCoordinator';
import { SyncStatusBadge } from './SyncStatusBadge';
import { PatientEditorModal } from './PatientEditorModal';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { NhmTriageBadge } from './NhmTriageBadge';

interface Props {
  userRole: UserRole;
}

export const DualNodeSyncLab: React.FC<Props> = ({ userRole }) => {
  const [, setTick] = useState(0);

  // Modal states
  const [editingPatient, setEditingPatient] = useState<{ patient: PatientRecord; nodeId: NodeId } | null>(null);
  const [resolvingPatient, setResolvingPatient] = useState<{ patient: PatientRecord; nodeId: NodeId } | null>(null);

  useEffect(() => {
    // Re-render when storage or coordinator state changes
    const unsubStorage = storageEngine.subscribe(() => setTick(t => t + 1));
    const unsubCoord = syncCoordinator.subscribe(() => setTick(t => t + 1));
    return () => {
      unsubStorage();
      unsubCoord();
    };
  }, []);

  const nodeAPatients = storageEngine.getPatients('NODE_A');
  const nodeBPatients = storageEngine.getPatients('NODE_B');
  const serverPatients = storageEngine.getPatients('CENTRAL_SERVER');

  const nodeAOutbox = storageEngine.getOutbox('NODE_A');
  const nodeBOutbox = storageEngine.getOutbox('NODE_B');
  const syncPackets = storageEngine.getSyncPackets();

  const nodeANetwork = syncCoordinator.getNetworkMode('NODE_A');
  const nodeBNetwork = syncCoordinator.getNetworkMode('NODE_B');

  const nodeASyncing = syncCoordinator.isSyncing('NODE_A');
  const nodeBSyncing = syncCoordinator.isSyncing('NODE_B');

  const handleDrain = async (nodeId: NodeId) => {
    await syncCoordinator.drainOutbox(nodeId);
  };

  const handleNetworkToggle = (nodeId: NodeId, mode: NetworkMode) => {
    syncCoordinator.setNetworkMode(nodeId, mode);
  };

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
      {/* Simulation Lab Ribbon */}
      <div className="bg-paper border border-stonehairline p-2.5 rounded-sm flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-charcoal flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-slateteal rounded-xs inline-block"></span>
            MULTI-NODE CLINICAL SYNC SIMULATOR
          </span>
          <span className="text-mutedink font-mono text-[11px] hidden md:inline">
            | Two isolated offline endpoints synchronizing with central Primary Health Centre cloud revision coordinator
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] font-mono text-mutedink">
          <span>Active Session Privileges: <strong className="text-charcoal font-semibold">{userRole}</strong></span>
          <span>IndexedDB Stores: <strong className="text-emerald-700">ONLINE & PERSISTED</strong></span>
        </div>
      </div>

      {/* 3-Column Split Bench */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMN 1: NODE A (ASHA FIELD TABLET)                     */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col bg-paper border border-stonehairline rounded-sm min-h-[460px] lg:min-h-0 overflow-hidden shadow-xs">
          {/* Node Header */}
          <div className="p-3 bg-canvas border-b border-stonehairline flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-slateteal" />
                <span className="font-mono font-bold text-xs text-charcoal">
                  NODE A: ASHA FIELD TABLET
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-sm font-semibold">
                ASHA_WORKER
              </span>
            </div>

            {/* Network Adapter Switcher & Outbox Status */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 bg-paper p-0.5 border border-stonehairline rounded-sm">
                {(['ONLINE', 'OFFLINE', 'FLAKY'] as NetworkMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleNetworkToggle('NODE_A', mode)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs transition-colors ${
                      nodeANetwork === mode
                        ? mode === 'ONLINE'
                          ? 'bg-emerald-600 text-white'
                          : mode === 'OFFLINE'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'text-stone-500 hover:text-charcoal'
                    }`}
                  >
                    {mode === 'ONLINE' && <Wifi className="w-2.5 h-2.5 inline mr-1" />}
                    {mode === 'OFFLINE' && <WifiOff className="w-2.5 h-2.5 inline mr-1" />}
                    {mode}
                  </button>
                ))}
              </div>

              {/* Drain / Sync Button */}
              <button
                onClick={() => handleDrain('NODE_A')}
                disabled={nodeANetwork === 'OFFLINE' || nodeASyncing}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono bg-paper hover:bg-canvas border border-stonehairline rounded-sm disabled:opacity-40 text-charcoal transition-colors cursor-pointer"
                title="Sync Outbox queue with Central Server"
              >
                <RefreshCw className={`w-3 h-3 text-slateteal ${nodeASyncing ? 'animate-spin' : ''}`} />
                <span>SYNC</span>
                {nodeAOutbox.length > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[9px] px-1 rounded-full font-bold ml-0.5">
                    {nodeAOutbox.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Patient Records List for Node A */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {nodeAPatients.map(patient => (
              <div
                key={patient.patientId}
                className={`p-2.5 border rounded-sm transition-all ${
                  patient.syncStatus === 'CONFLICT'
                    ? 'border-red-400 bg-red-50/40 shadow-xs'
                    : patient.syncStatus === 'PENDING'
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-stonehairline bg-paper hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="font-mono font-bold text-xs text-charcoal">
                      {patient.fullName}
                    </span>
                    <span className="font-mono text-[10px] text-mutedink ml-1.5">
                      ({patient.patientId})
                    </span>
                  </div>
                  <SyncStatusBadge
                    status={patient.syncStatus}
                    revision={patient.revision}
                    onClick={
                      patient.syncStatus === 'CONFLICT'
                        ? () => setResolvingPatient({ patient, nodeId: 'NODE_A' })
                        : undefined
                    }
                  />
                </div>

                <div className="text-[11px] font-mono text-mutedink mb-1 flex items-center justify-between">
                  <span>{patient.conditionTag}</span>
                  <span className="tabular-nums">BASE: v{patient.baseRevision}</span>
                </div>

                {/* Indian Rural Healthcare NHM Triage Badges */}
                <NhmTriageBadge patient={patient} compact />

                {/* Vitals Snapshot */}
                <div className="grid grid-cols-4 gap-1 p-1.5 bg-canvas/60 border border-stonehairline rounded-sm font-mono text-[11px] text-charcoal tabular-nums mb-2">
                  <div>
                    <span className="text-[9px] text-mutedink block">BP</span>
                    <span className="font-bold">{patient.data?.systolicBP ?? 120}/{patient.data?.diastolicBP ?? 80}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-mutedink block">HR</span>
                    <span className="font-bold">{patient.data?.heartRate ?? 72} bpm</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-mutedink block">Hb</span>
                    <span className="font-bold">{patient.data?.hemoglobinGdl ?? 12.0} g/dL</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-mutedink block">SpO2</span>
                    <span className="font-bold">{patient.data?.spO2 ?? 98}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between pt-1 border-t border-stonehairline/60 gap-1">
                  <span className="text-[9px] font-mono text-mutedink">
                    Mod: {patient.lastModifiedBy}
                  </span>
                  <div className="flex items-center gap-1">


                    {patient.syncStatus === 'CONFLICT' ? (
                      <button
                        onClick={() => setResolvingPatient({ patient, nodeId: 'NODE_A' })}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-700 hover:bg-red-800 text-white rounded-sm flex items-center gap-1 animate-pulse"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>RESOLVE</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingPatient({ patient, nodeId: 'NODE_A' })}
                        className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-canvas hover:bg-stone-200 text-charcoal border border-stonehairline rounded-sm flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-2.5 h-2.5 text-slateteal" />
                        <span>VISIT</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 2: CENTRAL PHC CLOUD REGISTRY & TELEMETRY STREAM   */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col bg-paper border border-stonehairline rounded-sm min-h-[460px] lg:min-h-0 overflow-hidden shadow-xs">
          {/* Center Spine Header */}
          <div className="p-3 bg-canvas border-b border-stonehairline flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-700" />
                <span className="font-mono font-bold text-xs text-charcoal">
                  CENTRAL PHC CLOUD REGISTRY
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-sm font-semibold">
                CANONICAL STATE
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-mutedink">
              <span>Authority: <strong className="text-charcoal">District Health Server</strong></span>
              <span>Revisions: <strong className="text-emerald-800">Deterministic</strong></span>
            </div>
          </div>

          {/* Canonical Patients Snapshot */}
          <div className="p-2 border-b border-stonehairline bg-stone-50/50 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-mutedink mb-1.5 flex items-center justify-between">
              <span>CANONICAL REGISTRY SNAPSHOT</span>
              <span>TOTAL: {serverPatients.length}</span>
            </div>
            <div className="space-y-1">
              {serverPatients.map(sp => (
                <div
                  key={sp.patientId}
                  className="p-1.5 bg-paper border border-stonehairline rounded-sm flex items-center justify-between text-[11px] font-mono"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-charcoal">{sp.fullName}</span>
                    <span className="text-stone-400">({sp.patientId})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-500 text-[10px]">{sp.lastModifiedBy}</span>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-xs tabular-nums text-[10px]">
                      REV #{sp.revision}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Sync Packet Telemetry Log */}
          <div className="flex-1 flex flex-col overflow-hidden p-2">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mutedink flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYNC HANDSHAKE PACKET LOG</span>
              </span>
              <span className="text-[9px] font-mono text-stone-400">
                LATEST 50 PACKETS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 font-mono text-[10px] bg-canvas p-2 border border-stonehairline rounded-sm">
              {syncPackets.length === 0 ? (
                <div className="text-stone-400 italic text-center py-6">
                  No network sync packets dispatched yet. Switch node to Online to trigger Outbox drain.
                </div>
              ) : (
                syncPackets.map(pkt => (
                  <div
                    key={pkt.packetId}
                    className={`p-1.5 border rounded-xs ${
                      pkt.status === 'ACCEPTED_200'
                        ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                        : pkt.status === 'CONFLICT_409'
                        ? 'bg-red-50/80 border-red-300 text-red-950'
                        : 'bg-paper border-stonehairline text-charcoal'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5">
                      <div className="flex items-center gap-1">
                        {pkt.status === 'ACCEPTED_200' && (
                          <CheckCircle className="w-3 h-3 text-emerald-600 inline" />
                        )}
                        {pkt.status === 'CONFLICT_409' && (
                          <AlertCircle className="w-3 h-3 text-red-600 inline" />
                        )}
                        <span>{pkt.sourceNode} → SERVER</span>
                      </div>
                      <span className="tabular-nums text-[9px] text-stone-500">
                        {new Date(pkt.timestamp).toLocaleTimeString()} ({pkt.latencyMs}ms)
                      </span>
                    </div>
                    <p className="text-[10px] leading-tight text-stone-700">
                      {pkt.summary}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* COLUMN 3: NODE B (PHC CLINIC DESK TERMINAL)               */}
        {/* ========================================================= */}
        <div className="lg:col-span-4 flex flex-col bg-paper border border-stonehairline rounded-sm min-h-[460px] lg:min-h-0 overflow-hidden shadow-xs">
          {/* Node Header */}
          <div className="p-3 bg-canvas border-b border-stonehairline flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slateteal" />
                <span className="font-mono font-bold text-xs text-charcoal">
                  NODE B: PHC CLINIC DESK
                </span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-sm font-semibold">
                MEDICAL_OFFICER
              </span>
            </div>

            {/* Network Adapter Switcher & Outbox Status */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 bg-paper p-0.5 border border-stonehairline rounded-sm">
                {(['ONLINE', 'OFFLINE', 'FLAKY'] as NetworkMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleNetworkToggle('NODE_B', mode)}
                    className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-xs transition-colors ${
                      nodeBNetwork === mode
                        ? mode === 'ONLINE'
                          ? 'bg-emerald-600 text-white'
                          : mode === 'OFFLINE'
                          ? 'bg-red-600 text-white'
                          : 'bg-amber-600 text-white'
                        : 'text-stone-500 hover:text-charcoal'
                    }`}
                  >
                    {mode === 'ONLINE' && <Wifi className="w-2.5 h-2.5 inline mr-1" />}
                    {mode === 'OFFLINE' && <WifiOff className="w-2.5 h-2.5 inline mr-1" />}
                    {mode}
                  </button>
                ))}
              </div>

              {/* Drain / Sync Button */}
              <button
                onClick={() => handleDrain('NODE_B')}
                disabled={nodeBNetwork === 'OFFLINE' || nodeBSyncing}
                className="flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono bg-paper hover:bg-canvas border border-stonehairline rounded-sm disabled:opacity-40 text-charcoal transition-colors cursor-pointer"
                title="Sync Outbox queue with Central Server"
              >
                <RefreshCw className={`w-3 h-3 text-slateteal ${nodeBSyncing ? 'animate-spin' : ''}`} />
                <span>SYNC</span>
                {nodeBOutbox.length > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[9px] px-1 rounded-full font-bold ml-0.5">
                    {nodeBOutbox.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Patient Records List for Node B */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {nodeBPatients.map(patient => (
              <div
                key={patient.patientId}
                className={`p-2.5 border rounded-sm transition-all ${
                  patient.syncStatus === 'CONFLICT'
                    ? 'border-red-400 bg-red-50/40 shadow-xs'
                    : patient.syncStatus === 'PENDING'
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-stonehairline bg-paper hover:bg-stone-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="font-mono font-bold text-xs text-charcoal">
                      {patient.fullName}
                    </span>
                    <span className="font-mono text-[10px] text-mutedink ml-1.5">
                      ({patient.patientId})
                    </span>
                  </div>
                  <SyncStatusBadge
                    status={patient.syncStatus}
                    revision={patient.revision}
                    onClick={
                      patient.syncStatus === 'CONFLICT'
                        ? () => setResolvingPatient({ patient, nodeId: 'NODE_B' })
                        : undefined
                    }
                  />
                </div>

                <div className="text-[11px] font-mono text-mutedink mb-1 flex items-center justify-between">
                  <span>{patient.conditionTag}</span>
                  <span className="tabular-nums">BASE: v{patient.baseRevision}</span>
                </div>

                {/* Indian Rural Healthcare NHM Triage Badges */}
                <NhmTriageBadge patient={patient} compact />

                {/* Vitals Snapshot */}
                <div className="grid grid-cols-4 gap-1 p-1.5 bg-canvas/60 border border-stonehairline rounded-sm font-mono text-[11px] text-charcoal tabular-nums mb-2">
                  <div>
                    <span className="text-[9px] text-mutedink block">BP</span>
                    <span className="font-bold">{patient.data?.systolicBP ?? 120}/{patient.data?.diastolicBP ?? 80}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-mutedink block">HR</span>
                    <span className="font-bold">{patient.data?.heartRate ?? 72} bpm</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-mutedink block">Hb</span>
                    <span className="font-bold">{patient.data?.hemoglobinGdl ?? 12.0} g/dL</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-mutedink block">SpO2</span>
                    <span className="font-bold">{patient.data?.spO2 ?? 98}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between pt-1 border-t border-stonehairline/60 gap-1">
                  <span className="text-[9px] font-mono text-mutedink">
                    Mod: {patient.lastModifiedBy}
                  </span>
                  <div className="flex items-center gap-1">


                    {patient.syncStatus === 'CONFLICT' ? (
                      <button
                        onClick={() => setResolvingPatient({ patient, nodeId: 'NODE_B' })}
                        className="px-2 py-0.5 text-[10px] font-mono font-bold bg-red-700 hover:bg-red-800 text-white rounded-sm flex items-center gap-1 animate-pulse"
                      >
                        <GitMerge className="w-3 h-3" />
                        <span>RESOLVE</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingPatient({ patient, nodeId: 'NODE_B' })}
                        className="px-2 py-0.5 text-[10px] font-mono font-semibold bg-canvas hover:bg-stone-200 text-charcoal border border-stonehairline rounded-sm flex items-center gap-1 transition-colors"
                      >
                        <Edit3 className="w-2.5 h-2.5 text-slateteal" />
                        <span>PRESCRIBE / EDIT</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Editor Modal */}
      {editingPatient && (
        <PatientEditorModal
          patient={editingPatient.patient}
          nodeId={editingPatient.nodeId}
          userRole={userRole}
          onClose={() => setEditingPatient(null)}
          onSaved={() => setTick(t => t + 1)}
        />
      )}

      {/* Conflict Resolution Modal */}
      {resolvingPatient && (
        <ConflictResolutionModal
          patient={resolvingPatient.patient}
          nodeId={resolvingPatient.nodeId}
          userRole={userRole}
          onClose={() => setResolvingPatient(null)}
          onResolved={() => setTick(t => t + 1)}
        />
      )}

    </div>
  );
};
