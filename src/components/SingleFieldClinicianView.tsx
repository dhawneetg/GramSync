import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Stethoscope, 
  ShieldCheck, 
  AlertTriangle, 
  Heart, 
  Activity, 
  Thermometer, 
  Wind, 
  FileText, 
  Pill, 
  Clock
} from 'lucide-react';
import { PatientRecord, NodeId, NetworkMode, UserRole } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';
import { syncCoordinator } from '../services/syncCoordinator';
import { SyncStatusBadge } from './SyncStatusBadge';
import { PatientEditorModal } from './PatientEditorModal';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { NhmTriageBadge } from './NhmTriageBadge';
import { encryptClinicalPayload, formatCiphertextDisplay } from '../services/cryptoVault';

interface Props {
  userRole: UserRole;
}

export const SingleFieldClinicianView: React.FC<Props> = ({ userRole }) => {
  const [activeNode, setActiveNode] = useState<NodeId>('NODE_A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-8041');
  const [, setTick] = useState(0);

  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // New patient state
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState(28);
  const [newPatientCluster, setNewPatientCluster] = useState('Bassi PHC - Cluster 5');
  const [newPatientCondition, setNewPatientCondition] = useState('Antenatal Triage (Trimester 2)');

  useEffect(() => {
    const unsub1 = storageEngine.subscribe(() => setTick(t => t + 1));
    const unsub2 = syncCoordinator.subscribe(() => setTick(t => t + 1));
    return () => {
      unsub1();
      unsub2();
    };
  }, []);

  const patients = storageEngine.getPatients(activeNode);
  const outbox = storageEngine.getOutbox(activeNode);
  const networkMode = syncCoordinator.getNetworkMode(activeNode);
  const isSyncing = syncCoordinator.isSyncing(activeNode);

  const filteredPatients = patients.filter(p => 
    p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.villageCluster.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.conditionTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedPatient = patients.find(p => p.patientId === selectedPatientId) || patients[0];

  const handleCreateNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim()) return;

    const newId = `PT-${Math.floor(8100 + Math.random() * 800)}`;
    const initialData = {
      systolicBP: 120,
      diastolicBP: 80,
      heartRate: 75,
      temperatureC: 36.8,
      spO2: 98,
      hemoglobinGdl: 11.5,
      medicationsIssued: 'IFA Red Tablet OD, Calcium 500mg BD',
      clinicalNotes: `Initial baseline field intake by ${userRole}. Normal vital parameters recorded at patient domicile.`
    };

    const enc = await encryptClinicalPayload(initialData);

    const newRecord: PatientRecord = {
      patientId: newId,
      fullName: newPatientName.trim(),
      age: Number(newPatientAge),
      gender: 'Female',
      villageCluster: newPatientCluster.trim(),
      conditionTag: newPatientCondition.trim(),
      revision: 1,
      baseRevision: 1,
      syncStatus: networkMode === 'OFFLINE' ? 'PENDING' : 'SYNCED',
      lastModifiedBy: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      data: initialData,
      encryptedBlobPreview: `${enc.algorithm}::${formatCiphertextDisplay(enc.ciphertextBase64, 32)}::IV:${enc.ivHex.slice(0, 8)}`
    };

    const updatedList = [newRecord, ...patients];
    storageEngine.setPatients(activeNode, updatedList);

    // If online, sync to central server, else queue in Outbox
    if (networkMode !== 'OFFLINE') {
      const serverList = [newRecord, ...storageEngine.getPatients('CENTRAL_SERVER')];
      storageEngine.setPatients('CENTRAL_SERVER', serverList);
      storageEngine.logSyncPacket({
        sourceNode: activeNode,
        targetNode: 'CENTRAL_SERVER',
        patientId: newId,
        baseRevision: 1,
        status: 'ACCEPTED_200',
        latencyMs: 250,
        summary: `HTTP 200 OK — New patient ${newId} registered and canonicalized.`
      });
    } else {
      storageEngine.enqueueOutboxMutation({
        mutationId: `MUT-${Date.now()}`,
        nodeId: activeNode,
        patientId: newId,
        timestamp: new Date().toISOString(),
        baseRevision: 1,
        draftData: initialData,
        author: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
        role: userRole,
        retryCount: 0
      });
    }

    storageEngine.logAudit({
      nodeId: activeNode,
      role: userRole,
      action: 'RECORD_CREATED',
      patientId: newId,
      revision: 1,
      details: `New patient record ${newPatientName} (${newId}) initialized offline.`
    });

    setSelectedPatientId(newId);
    setIsCreatingNew(false);
    setNewPatientName('');
  };

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
      {/* Clinician Terminal Ribbon */}
      <div className="bg-paper border border-stonehairline p-2.5 rounded-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono font-bold text-charcoal">
            <Stethoscope className="w-4 h-4 text-slateteal" />
            <span>FIELD WORKSPACE // POINT-OF-CARE INSTRUMENT</span>
          </div>
          <div className="flex items-center gap-1 bg-canvas p-0.5 border border-stonehairline rounded-sm">
            <span className="text-[10px] font-mono text-mutedink px-1.5">DEVICE:</span>
            <button
              onClick={() => setActiveNode('NODE_A')}
              className={`px-2 py-0.5 font-mono text-xs rounded-xs font-semibold ${
                activeNode === 'NODE_A' ? 'bg-paper text-charcoal shadow-xs border border-stonehairline' : 'text-stone-500'
              }`}
            >
              ASHA Tablet (Node A)
            </button>
            <button
              onClick={() => setActiveNode('NODE_B')}
              className={`px-2 py-0.5 font-mono text-xs rounded-xs font-semibold ${
                activeNode === 'NODE_B' ? 'bg-paper text-charcoal shadow-xs border border-stonehairline' : 'text-stone-500'
              }`}
            >
              PHC Desk (Node B)
            </button>
          </div>
        </div>

        {/* Network & Outbox Telemetry */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-canvas p-0.5 border border-stonehairline rounded-sm">
            {(['ONLINE', 'OFFLINE', 'FLAKY'] as NetworkMode[]).map(m => (
              <button
                key={m}
                onClick={() => syncCoordinator.setNetworkMode(activeNode, m)}
                className={`px-2 py-0.5 font-mono text-[10px] font-bold rounded-xs ${
                  networkMode === m
                    ? m === 'ONLINE' ? 'bg-emerald-600 text-white' : m === 'OFFLINE' ? 'bg-red-600 text-white' : 'bg-amber-600 text-white'
                    : 'text-stone-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={() => syncCoordinator.drainOutbox(activeNode)}
            disabled={networkMode === 'OFFLINE' || isSyncing}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-paper hover:bg-canvas border border-stonehairline rounded-sm disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slateteal ${isSyncing ? 'animate-spin' : ''}`} />
            <span>SYNC NOW</span>
            {outbox.length > 0 && (
              <span className="bg-amber-500 text-white font-mono text-[10px] px-1 rounded-full font-bold ml-1">
                {outbox.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Left Column: Patient Directory & Search */}
        <div className="md:col-span-4 flex flex-col bg-paper border border-stonehairline rounded-sm overflow-hidden shadow-xs">
          {/* Search & Add Patient Toolbar */}
          <div className="p-2.5 bg-canvas border-b border-stonehairline flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, cluster, ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-paper border border-stonehairline pl-8 pr-2 py-1 font-mono text-xs text-charcoal rounded-sm focus:outline-slateteal"
              />
            </div>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-2 py-1 bg-slateteal hover:bg-slateteal-hover text-white text-xs font-mono font-semibold rounded-sm flex items-center gap-1 shadow-xs cursor-pointer"
              title="Add New Patient Record Offline"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>NEW</span>
            </button>
          </div>

          {/* Patient Directory List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stonehairline">
            {filteredPatients.map(p => {
              const isSelected = p.patientId === selectedPatient?.patientId;
              return (
                <div
                  key={p.patientId}
                  onClick={() => setSelectedPatientId(p.patientId)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-stone-100/90 border-l-4 border-slateteal' : 'hover:bg-canvas'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-charcoal">
                      {p.fullName}
                    </span>
                    <SyncStatusBadge status={p.syncStatus} revision={p.revision} />
                  </div>
                  <div className="text-[11px] font-mono text-stone-600 flex items-center justify-between">
                    <span>{p.patientId} • {p.age}y</span>
                    <span className="text-[10px] text-mutedink">{p.villageCluster}</span>
                  </div>
                  <div className="text-[11px] font-mono font-semibold text-stone-700 mt-1">
                    {p.conditionTag}
                  </div>
                  {/* Indian Rural Healthcare NHM Triage Badges */}
                  <NhmTriageBadge patient={p} compact />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Patient Triage & Vitals Sheet */}
        <div className="md:col-span-8 flex flex-col bg-paper border border-stonehairline rounded-sm overflow-hidden shadow-xs">
          {selectedPatient ? (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Patient Banner */}
              <div className="p-4 bg-canvas border-b border-stonehairline flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-base font-bold text-charcoal">
                      {selectedPatient.fullName}
                    </h2>
                    <span className="font-mono text-xs text-stone-500">({selectedPatient.patientId})</span>
                    <SyncStatusBadge
                      status={selectedPatient.syncStatus}
                      revision={selectedPatient.revision}
                      onClick={
                        selectedPatient.syncStatus === 'CONFLICT'
                          ? () => setIsResolving(true)
                          : undefined
                      }
                    />
                  </div>
                  <div className="text-xs font-mono text-stone-600 mt-1 flex flex-wrap items-center gap-3">
                    <span>Cluster: <strong className="text-charcoal">{selectedPatient.villageCluster}</strong></span>
                    <span>•</span>
                    <span>Condition: <strong className="text-stone-800">{selectedPatient.conditionTag}</strong></span>
                    <span>•</span>
                    <span>Monotonic Rev: <strong className="text-charcoal tabular-nums">v{selectedPatient.revision}</strong></span>
                  </div>

                  {/* NHM Rural Clinical Triage Badges */}
                  <div className="mt-1">
                    <NhmTriageBadge patient={selectedPatient} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">


                  {selectedPatient.syncStatus === 'CONFLICT' ? (
                    <button
                      onClick={() => setIsResolving(true)}
                      className="px-3 py-1.5 text-xs font-mono font-bold bg-red-700 hover:bg-red-800 text-white rounded-sm flex items-center gap-1.5 animate-pulse"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>RESOLVE 3-WAY CONFLICT</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-1.5 text-xs font-mono font-semibold bg-slateteal hover:bg-slateteal-hover text-white rounded-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>RECORD VISIT / UPDATE VITALS</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vitals Telemetry Grid */}
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink mb-2">
                    BEDSIDE PHYSIOLOGICAL VITALS
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {/* BP */}
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono uppercase">Blood Pressure</span>
                        <Activity className="w-3.5 h-3.5 text-slateteal" />
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.systolicBP ?? 120}/{selectedPatient.data?.diastolicBP ?? 80}
                        <span className="text-xs text-mutedink font-normal ml-1">mmHg</span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        {(selectedPatient.data?.systolicBP ?? 120) > 140 ? '⚠️ High Stage-1' : 'Normal Range'}
                      </div>
                    </div>

                    {/* Heart Rate */}
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono uppercase">Heart Rate</span>
                        <Heart className="w-3.5 h-3.5 text-red-600" />
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.heartRate ?? 72}
                        <span className="text-xs text-mutedink font-normal ml-1">BPM</span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        Rhythm: Regular Sinus
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono uppercase">Pulse Oximetry</span>
                        <Wind className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.spO2 ?? 98}
                        <span className="text-xs text-mutedink font-normal ml-1">%</span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        {(selectedPatient.data?.spO2 ?? 98) < 95 ? '⚠️ Hypoxemia Warning' : 'Optimal Oxygenation'}
                      </div>
                    </div>

                    {/* Hemoglobin */}
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono uppercase">Hemoglobin</span>
                        <Activity className="w-3.5 h-3.5 text-amber-700" />
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.hemoglobinGdl ?? 12.0}
                        <span className="text-xs text-mutedink font-normal ml-1">g/dL</span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        {(selectedPatient.data?.hemoglobinGdl ?? 12.0) < 11 ? '⚠️ Nutritional Anemia' : 'Within Target'}
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono uppercase">Temperature</span>
                        <Thermometer className="w-3.5 h-3.5 text-orange-600" />
                      </div>
                      <div className="font-mono text-xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.temperatureC ?? 36.8}
                        <span className="text-xs text-mutedink font-normal ml-1">°C</span>
                      </div>
                      <div className="text-[10px] font-mono text-stone-500 mt-0.5">
                        Afebrile
                      </div>
                    </div>

                    {/* Revision & Hash Security */}
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono uppercase">At-Rest Vault State</span>
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <div className="font-mono text-xs font-bold text-emerald-800">
                        AES-GCM-256
                      </div>
                      <div className="text-[9px] font-mono text-stone-500 truncate mt-1" title={selectedPatient.encryptedBlobPreview}>
                        {selectedPatient.encryptedBlobPreview || 'Encrypted on save'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medications Issued */}
                <div className="p-3 bg-white border border-stonehairline rounded-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink mb-1.5">
                    <Pill className="w-3.5 h-3.5 text-slateteal" />
                    <span>MEDICATIONS & DISPENSED FIELD SUPPLIES</span>
                  </div>
                  <p className="font-mono text-xs text-charcoal bg-canvas p-2 border border-stonehairline rounded-sm">
                    {selectedPatient.data.medicationsIssued}
                  </p>
                </div>

                {/* Clinical Notes */}
                <div className="p-3 bg-white border border-stonehairline rounded-sm">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink mb-1.5">
                    <FileText className="w-3.5 h-3.5 text-slateteal" />
                    <span>FIELD OBSERVATION & CLINICAL NOTES</span>
                  </div>
                  <p className="font-mono text-xs text-charcoal bg-canvas p-2 border border-stonehairline rounded-sm whitespace-pre-wrap leading-relaxed">
                    {selectedPatient.data.clinicalNotes}
                  </p>
                </div>

                {/* Metadata Stamp */}
                <div className="text-[10px] font-mono text-stone-400 flex items-center justify-between pt-2 border-t border-stonehairline">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Last local mutation: {new Date(selectedPatient.lastModifiedAt).toLocaleString()}</span>
                  </div>
                  <span>Author: {selectedPatient.lastModifiedBy}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center font-mono text-xs text-mutedink">
              Select a patient from the directory to review clinical records.
            </div>
          )}
        </div>
      </div>

      {/* Record Visit Editor Modal */}
      {isEditing && selectedPatient && (
        <PatientEditorModal
          patient={selectedPatient}
          nodeId={activeNode}
          userRole={userRole}
          onClose={() => setIsEditing(false)}
          onSaved={() => setTick(t => t + 1)}
        />
      )}

      {/* 3-Way Conflict Resolution Modal */}
      {isResolving && selectedPatient && (
        <ConflictResolutionModal
          patient={selectedPatient}
          nodeId={activeNode}
          userRole={userRole}
          onClose={() => setIsResolving(false)}
          onResolved={() => setTick(t => t + 1)}
        />
      )}

      {/* Add New Patient Modal */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-paper border border-stonehairline w-full max-w-md rounded-sm shadow-2xl p-5">
            <h3 className="font-mono text-sm font-bold text-charcoal uppercase mb-1">
              CREATE NEW PATIENT RECORD (OFFLINE)
            </h3>
            <p className="text-[11px] font-mono text-mutedink mb-4">
              Stored immediately in local IndexedDB. Queued for deterministic cloud synchronization.
            </p>

            <form onSubmit={handleCreateNewPatient} className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[11px] text-mutedink uppercase mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  placeholder="e.g. Kamala Bai"
                  className="w-full bg-canvas border border-stonehairline p-2 text-charcoal rounded-sm focus:outline-slateteal font-sans font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-mutedink uppercase mb-1">Age (Years)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={110}
                    value={newPatientAge}
                    onChange={e => setNewPatientAge(Number(e.target.value))}
                    className="w-full bg-canvas border border-stonehairline p-2 text-charcoal rounded-sm focus:outline-slateteal tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-mutedink uppercase mb-1">Subcentre Cluster</label>
                  <input
                    type="text"
                    required
                    value={newPatientCluster}
                    onChange={e => setNewPatientCluster(e.target.value)}
                    className="w-full bg-canvas border border-stonehairline p-2 text-charcoal rounded-sm focus:outline-slateteal"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-mutedink uppercase mb-1">Clinical Condition Tag</label>
                <input
                  type="text"
                  required
                  value={newPatientCondition}
                  onChange={e => setNewPatientCondition(e.target.value)}
                  className="w-full bg-canvas border border-stonehairline p-2 text-charcoal rounded-sm focus:outline-slateteal"
                />
              </div>

              <div className="pt-3 border-t border-stonehairline flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3 py-1.5 text-xs text-mutedink hover:text-charcoal bg-canvas border border-stonehairline rounded-sm"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs text-white bg-slateteal hover:bg-slateteal-hover font-semibold rounded-sm shadow-xs"
                >
                  CREATE RECORD
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
