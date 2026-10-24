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
  Edit3,
  FlaskConical,
  Pill,
  Cloud
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
  const [mobileActiveNode, setMobileActiveNode] = useState<'NODE_A' | 'SERVER' | 'NODE_B'>('NODE_A');

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
    <div className="flex-1 flex flex-col p-2 sm:p-3 gap-2 sm:gap-3 overflow-y-auto lg:overflow-hidden bg-stone-50/50">
      {/* Simulation Lab Ribbon */}
      <div className="bg-white border border-stone-200/90 p-2 sm:p-3 rounded-xl shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-sans font-bold text-stone-900 flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 bg-emerald-600 rounded-full inline-block animate-pulse"></span>
            मल्टी-नोड सिंक सिमुलेटर (Multi-Node Clinical Sync Simulator)
          </span>
          <span className="text-stone-500 text-[11px] hidden md:inline">
            | Two isolated offline endpoints synchronizing with central Primary Health Centre cloud revision coordinator
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-stone-500">
          <span>Role: <strong className="text-stone-900 font-semibold">{userRole}</strong></span>
          <span>Storage: <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-bold">IndexedDB ENCRYPTED</strong></span>
        </div>
      </div>

      {/* Mobile Node Switcher Tab Bar */}
      <div className="flex lg:hidden items-center bg-white p-1 border border-stone-200 rounded-sm text-xs font-mono shadow-xs">
        <button
          onClick={() => setMobileActiveNode('NODE_A')}
          className={`flex-1 py-1.5 px-2 rounded-xs text-center font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            mobileActiveNode === 'NODE_A' ? 'bg-amber-100 text-amber-900 border border-amber-300 shadow-xs' : 'text-stone-500'
          }`}
        >
          <Tablet className="w-3.5 h-3.5" />
          <span>Node A (ASHA)</span>
        </button>
        <button
          onClick={() => setMobileActiveNode('SERVER')}
          className={`flex-1 py-1.5 px-2 rounded-xs text-center font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            mobileActiveNode === 'SERVER' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs' : 'text-stone-500'
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>PHC Cloud</span>
        </button>
        <button
          onClick={() => setMobileActiveNode('NODE_B')}
          className={`flex-1 py-1.5 px-2 rounded-xs text-center font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            mobileActiveNode === 'NODE_B' ? 'bg-blue-100 text-blue-900 border border-blue-300 shadow-xs' : 'text-stone-500'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Node B (Clinic)</span>
        </button>
      </div>

      {/* 3-Column Split Bench */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0 overflow-y-auto lg:overflow-hidden">
        
        {/* ========================================================= */}
        {/* COLUMN 1: NODE A (ASHA FIELD TABLET)                     */}
        {/* ========================================================= */}
        <div className={`lg:col-span-4 flex-col bg-white border border-stone-200/90 rounded-2xl min-h-[460px] lg:min-h-0 overflow-hidden shadow-xs ${mobileActiveNode === 'NODE_A' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Node Header */}
          <div className="p-3 bg-stone-50/80 border-b border-stone-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-xs text-stone-900">
                  NODE A: ASHA FIELD TABLET
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-semibold">
                ASHA_WORKER
              </span>
            </div>

            {/* Network Adapter Switcher & Outbox Status */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 bg-white p-0.5 border border-stone-200 rounded-lg shadow-xs">
                {(['ONLINE', 'OFFLINE', 'FLAKY'] as NetworkMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleNetworkToggle('NODE_A', mode)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all duration-150 cursor-pointer ${
                      nodeANetwork === mode
                        ? mode === 'ONLINE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : mode === 'OFFLINE'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
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
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg disabled:opacity-40 transition-all duration-150 cursor-pointer shadow-xs"
                title="Sync Outbox queue with Central Server"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${nodeASyncing ? 'animate-spin' : ''}`} />
                <span>SYNC</span>
                {nodeAOutbox.length > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    {nodeAOutbox.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Patient Records List for Node A */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {nodeAPatients.map(patient => (
              <div
                key={patient.patientId}
                className={`p-3 border rounded-xl transition-all duration-200 hover:shadow-md ${
                  patient.syncStatus === 'CONFLICT'
                    ? 'border-red-300 bg-red-50/40 shadow-xs'
                    : patient.syncStatus === 'PENDING'
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-stone-200/90 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="font-bold text-sm text-stone-900">
                      {patient.fullName}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono ml-1.5">
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

                <div className="text-xs text-stone-600 mb-2 flex items-center justify-between">
                  <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                    {patient.conditionTag}
                  </span>
                  <span className="text-stone-400 font-mono text-[10px]">BASE: v{patient.baseRevision}</span>
                </div>

                {/* Indian Rural Healthcare NHM Triage Badges */}
                <NhmTriageBadge patient={patient} compact />

                {/* Vitals Snapshot */}
                <div className="grid grid-cols-4 gap-1 p-2 bg-stone-50 border border-stone-200/80 rounded-lg text-xs text-stone-800 tabular-nums my-2">
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">BP</span>
                    <span className="font-bold text-stone-900">{patient.data?.systolicBP ?? 120}/{patient.data?.diastolicBP ?? 80}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">HR</span>
                    <span className="font-bold text-stone-900">{patient.data?.heartRate ?? 72}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">Hb</span>
                    <span className="font-bold text-stone-900">{patient.data?.hemoglobinGdl ?? 12.0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">SpO2</span>
                    <span className="font-bold text-emerald-700">{patient.data?.spO2 ?? 98}%</span>
                  </div>
                </div>

                {/* Lab & Prescription Micro-Tags */}
                <div className="flex items-center gap-1.5 text-[11px] mb-2">
                  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-900 border border-indigo-200/80 px-2 py-0.5 rounded-md font-medium">
                    <FlaskConical className="w-3 h-3 text-indigo-600" />
                    <span>{patient.labReports?.length || 0} Labs</span>
                  </span>
                  <span className="flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-200/80 px-2 py-0.5 rounded-md font-medium">
                    <Pill className="w-3 h-3 text-rose-600" />
                    <span>{patient.prescriptions?.length || 0} Rx</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-100 gap-1">
                  <span className="text-[10px] text-stone-400">
                    Mod: {patient.lastModifiedBy}
                  </span>
                  <div className="flex items-center gap-1">
                    {patient.syncStatus === 'CONFLICT' ? (
                      <button
                        onClick={() => setResolvingPatient({ patient, nodeId: 'NODE_A' })}
                        className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 shadow-xs animate-pulse cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>RESOLVE</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingPatient({ patient, nodeId: 'NODE_A' })}
                        className="px-2.5 py-1 text-xs font-medium bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-stone-700 border border-stone-200 rounded-lg flex items-center gap-1 transition-all duration-150 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-600" />
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
        <div className={`lg:col-span-4 flex-col bg-white border border-stone-200/90 rounded-2xl min-h-[460px] lg:min-h-0 overflow-hidden shadow-xs ${mobileActiveNode === 'SERVER' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Center Spine Header */}
          <div className="p-3 bg-stone-50/80 border-b border-stone-200/80 flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-700" />
                <span className="font-bold text-xs text-stone-900">
                  CENTRAL PHC CLOUD REGISTRY
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-full font-semibold">
                CANONICAL STATE
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-stone-500">
              <span>Authority: <strong className="text-stone-800">District Health Server</strong></span>
              <span>Revisions: <strong className="text-emerald-700 font-mono">Deterministic</strong></span>
            </div>
          </div>

          {/* Canonical Patients Snapshot */}
          <div className="p-3 border-b border-stone-200/80 bg-stone-50/40 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2 flex items-center justify-between">
              <span>CANONICAL REGISTRY SNAPSHOT</span>
              <span className="font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">TOTAL: {serverPatients.length}</span>
            </div>
            <div className="space-y-1.5">
              {serverPatients.map(sp => (
                <div
                  key={sp.patientId}
                  className="p-2 bg-white border border-stone-200 rounded-lg flex items-center justify-between text-xs transition-all duration-150 hover:border-emerald-200"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-stone-900">{sp.fullName}</span>
                    <span className="text-stone-400 font-mono text-[10px]">({sp.patientId})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-stone-400 text-[10px]">{sp.lastModifiedBy}</span>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold rounded-md font-mono text-[10px]">
                      REV #{sp.revision}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Sync Packet Telemetry Log */}
          <div className="flex-1 flex flex-col overflow-hidden p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>SYNC HANDSHAKE PACKET LOG</span>
              </span>
              <span className="text-[9px] font-mono text-stone-400">
                LATEST 50 PACKETS
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 font-mono text-[10px] bg-stone-50 p-2.5 border border-stone-200 rounded-xl">
              {syncPackets.length === 0 ? (
                <div className="text-stone-400 italic text-center py-6 font-sans text-xs">
                  No network sync packets dispatched yet. Switch node to Online to trigger Outbox drain.
                </div>
              ) : (
                syncPackets.map(pkt => (
                  <div
                    key={pkt.packetId}
                    className={`p-2 border rounded-lg transition-all ${
                      pkt.status === 'ACCEPTED_200'
                        ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                        : pkt.status === 'CONFLICT_409'
                        ? 'bg-red-50/90 border-red-300 text-red-950'
                        : 'bg-white border-stone-200 text-stone-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-1">
                      <div className="flex items-center gap-1.5">
                        {pkt.status === 'ACCEPTED_200' && (
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 inline" />
                        )}
                        {pkt.status === 'CONFLICT_409' && (
                          <AlertCircle className="w-3.5 h-3.5 text-red-600 inline" />
                        )}
                        <span>{pkt.sourceNode} → SERVER</span>
                      </div>
                      <span className="tabular-nums text-[9px] text-stone-500 font-sans">
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
        {/* COLUMN 3: NODE B (PHC CLINIC DESK)                       */}
        {/* ========================================================= */}
        <div className={`lg:col-span-4 flex-col bg-white border border-stone-200/90 rounded-2xl min-h-[460px] lg:min-h-0 overflow-hidden shadow-xs ${mobileActiveNode === 'NODE_B' ? 'flex' : 'hidden lg:flex'}`}>
          {/* Node Header */}
          <div className="p-3 bg-stone-50/80 border-b border-stone-200/80 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-700" />
                <span className="font-bold text-xs text-stone-900">
                  NODE B: PHC CLINIC DESK
                </span>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-300 rounded-full font-semibold">
                MEDICAL_OFFICER
              </span>
            </div>

            {/* Network Adapter Switcher & Outbox Status */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex items-center gap-1 bg-white p-0.5 border border-stone-200 rounded-lg shadow-xs">
                {(['ONLINE', 'OFFLINE', 'FLAKY'] as NetworkMode[]).map(mode => (
                  <button
                    key={mode}
                    onClick={() => handleNetworkToggle('NODE_B', mode)}
                    className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all duration-150 cursor-pointer ${
                      nodeBNetwork === mode
                        ? mode === 'ONLINE'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : mode === 'OFFLINE'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'bg-amber-600 text-white shadow-xs'
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-100'
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
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg disabled:opacity-40 transition-all duration-150 cursor-pointer shadow-xs"
                title="Sync Outbox queue with Central Server"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-700 ${nodeBSyncing ? 'animate-spin' : ''}`} />
                <span>SYNC</span>
                {nodeBOutbox.length > 0 && (
                  <span className="bg-amber-500 text-white font-mono text-[9px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
                    {nodeBOutbox.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Patient Records List for Node B */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {nodeBPatients.map(patient => (
              <div
                key={patient.patientId}
                className={`p-3 border rounded-xl transition-all duration-200 hover:shadow-md ${
                  patient.syncStatus === 'CONFLICT'
                    ? 'border-red-300 bg-red-50/40 shadow-xs'
                    : patient.syncStatus === 'PENDING'
                    ? 'border-amber-300 bg-amber-50/30'
                    : 'border-stone-200/90 bg-white hover:border-emerald-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="font-bold text-sm text-stone-900">
                      {patient.fullName}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono ml-1.5">
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

                <div className="text-xs text-stone-600 mb-2 flex items-center justify-between">
                  <span className="font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 text-[11px]">
                    {patient.conditionTag}
                  </span>
                  <span className="text-stone-400 font-mono text-[10px]">BASE: v{patient.baseRevision}</span>
                </div>

                {/* Indian Rural Healthcare NHM Triage Badges */}
                <NhmTriageBadge patient={patient} compact />

                {/* Vitals Snapshot */}
                <div className="grid grid-cols-4 gap-1 p-2 bg-stone-50 border border-stone-200/80 rounded-lg text-xs text-stone-800 tabular-nums my-2">
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">BP</span>
                    <span className="font-bold text-stone-900">{patient.data?.systolicBP ?? 120}/{patient.data?.diastolicBP ?? 80}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">HR</span>
                    <span className="font-bold text-stone-900">{patient.data?.heartRate ?? 72}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">Hb</span>
                    <span className="font-bold text-stone-900">{patient.data?.hemoglobinGdl ?? 12.0}</span>
                  </div>
                  <div className="text-center">
                    <span className="text-[10px] text-stone-400 block font-sans">SpO2</span>
                    <span className="font-bold text-emerald-700">{patient.data?.spO2 ?? 98}%</span>
                  </div>
                </div>

                {/* Lab & Prescription Micro-Tags */}
                <div className="flex items-center gap-1.5 text-[11px] mb-2">
                  <span className="flex items-center gap-1 bg-indigo-50 text-indigo-900 border border-indigo-200/80 px-2 py-0.5 rounded-md font-medium">
                    <FlaskConical className="w-3 h-3 text-indigo-600" />
                    <span>{patient.labReports?.length || 0} Labs</span>
                  </span>
                  <span className="flex items-center gap-1 bg-rose-50 text-rose-900 border border-rose-200/80 px-2 py-0.5 rounded-md font-medium">
                    <Pill className="w-3 h-3 text-rose-600" />
                    <span>{patient.prescriptions?.length || 0} Rx</span>
                  </span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between pt-2 border-t border-stone-100 gap-1">
                  <span className="text-[10px] text-stone-400">
                    Mod: {patient.lastModifiedBy}
                  </span>
                  <div className="flex items-center gap-1">
                    {patient.syncStatus === 'CONFLICT' ? (
                      <button
                        onClick={() => setResolvingPatient({ patient, nodeId: 'NODE_B' })}
                        className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 shadow-xs animate-pulse cursor-pointer"
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                        <span>RESOLVE</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingPatient({ patient, nodeId: 'NODE_B' })}
                        className="px-2.5 py-1 text-xs font-medium bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-stone-700 border border-stone-200 rounded-lg flex items-center gap-1 transition-all duration-150 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-600" />
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
