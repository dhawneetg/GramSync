import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  RefreshCw, 
  Stethoscope, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Pill, 
  Share2,
  FlaskConical,
  MapPin,
  Wifi,
  WifiOff,
  QrCode,
  LayoutGrid
} from 'lucide-react';
import { PatientRecord, NodeId, UserRole, LabInvestigation, StructuredPrescription } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';
import { syncCoordinator } from '../services/syncCoordinator';
import { SyncStatusBadge } from './SyncStatusBadge';
import { PatientEditorModal } from './PatientEditorModal';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { NhmTriageBadge } from './NhmTriageBadge';
import { ShareHealthPassportModal } from './ShareHealthPassportModal';
import { AddLabTestModal } from './AddLabTestModal';
import { AddPrescriptionModal } from './AddPrescriptionModal';
import { t, subscribeLanguage } from '../services/languageService';

interface Props {
  userRole: UserRole;
}

type DetailTab = 'ALL' | 'VITALS' | 'LABS' | 'PRESCRIPTIONS';

export const SingleFieldClinicianView: React.FC<Props> = ({ userRole }) => {
  const [activeNode, setActiveNode] = useState<NodeId>('NODE_A');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-8041');
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('ALL');
  const [, setTick] = useState<number>(0);

  // Modals
  const [isEditing, setIsEditing] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showPassportModal, setShowPassportModal] = useState(false);
  const [showAddLabModal, setShowAddLabModal] = useState(false);
  const [showAddRxModal, setShowAddRxModal] = useState(false);
  const [mobileView, setMobileView] = useState<'DIRECTORY' | 'CHART'>('CHART');

  // New patient state with full customization & gender switching
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientAge, setNewPatientAge] = useState<number>(26);
  const [newPatientGender, setNewPatientGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [newPatientCluster, setNewPatientCluster] = useState('Bassi PHC - Subcentre Cluster 3');
  const [newPatientCondition, setNewPatientCondition] = useState('Antenatal Care (Trimester 2)');
  const [newPatientPhone, setNewPatientPhone] = useState('+91 98290 44102');
  const [newPatientAbha, setNewPatientAbha] = useState('');
  const [showCustomSettings, setShowCustomSettings] = useState(false);
  const [newSystolicBP, setNewSystolicBP] = useState(120);
  const [newDiastolicBP, setNewDiastolicBP] = useState(80);
  const [newHeartRate, setNewHeartRate] = useState(72);
  const [newTemperature, setNewTemperature] = useState(36.8);
  const [newSpO2, setNewSpO2] = useState(98);
  const [newHemoglobin, setNewHemoglobin] = useState(12.0);
  const [newMedications, setNewMedications] = useState('IFA Tablets (1 Tab OD), Calcium 500mg');
  const [newClinicalNotes, setNewClinicalNotes] = useState('Initial domiciliary clinical assessment recorded by frontline health worker.');

  const generateRandomAbha = () => {
    const clusterNum = Math.floor(8000 + Math.random() * 999);
    const mid = Math.floor(1000 + Math.random() * 9000);
    const end = Math.floor(1000 + Math.random() * 9000);
    return `91-${clusterNum}-${mid}-${end}`;
  };

  const handleGenderSwitch = (g: 'Female' | 'Male' | 'Other') => {
    setNewPatientGender(g);
    if (g === 'Male') {
      if (newPatientCondition.includes('Antenatal') || newPatientCondition.includes('Pregnancy') || newPatientCondition.includes('HRP')) {
        setNewPatientCondition('Hypertension (Stage-1 Elevated)');
      }
      if (newMedications.includes('IFA')) {
        setNewMedications('Multivitamin Tab (1 OD), ORS Powder');
      }
    } else if (g === 'Female') {
      if (newPatientCondition === 'Hypertension (Stage-1 Elevated)' || newPatientCondition === 'General OPD Checkup') {
        setNewPatientCondition('Antenatal Care (Trimester 2)');
      }
      if (newMedications.includes('Multivitamin')) {
        setNewMedications('IFA Tablets (1 Tab OD), Calcium 500mg');
      }
    }
  };

  useEffect(() => {
    const unsub1 = storageEngine.subscribe(() => setTick((t: number) => t + 1));
    const unsub2 = syncCoordinator.subscribe(() => setTick((t: number) => t + 1));
    const unsubLang = subscribeLanguage(() => setTick((t: number) => t + 1));
    return () => {
      unsub1();
      unsub2();
      unsubLang();
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

    const newId = `PT-${Math.floor(8050 + Math.random() * 900)}`;
    const finalAbha = newPatientAbha.trim() || generateRandomAbha();

    const newRecord: PatientRecord = {
      patientId: newId,
      abhaId: finalAbha,
      phone: newPatientPhone.trim() || '+91 98290 12345',
      fullName: newPatientName.trim(),
      age: Number(newPatientAge) || 26,
      gender: newPatientGender,
      villageCluster: newPatientCluster.trim() || 'Bassi PHC - Subcentre Cluster 3',
      conditionTag: newPatientCondition.trim() || 'General OPD Checkup',
      revision: 1,
      baseRevision: 1,
      syncStatus: networkMode === 'OFFLINE' ? 'LOCAL' : 'SYNCED',
      lastModifiedBy: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      data: {
        systolicBP: Number(newSystolicBP) || 120,
        diastolicBP: Number(newDiastolicBP) || 80,
        heartRate: Number(newHeartRate) || 72,
        temperatureC: Number(newTemperature) || 36.8,
        spO2: Number(newSpO2) || 98,
        hemoglobinGdl: Number(newHemoglobin) || 12.0,
        medicationsIssued: newMedications.trim() || (newPatientGender === 'Female' ? 'IFA Tablets (1 Tab OD), Calcium 500mg' : 'Multivitamin Tab (1 OD)'),
        clinicalNotes: newClinicalNotes.trim() || 'Initial domiciliary clinical assessment recorded by frontline health worker.'
      },
      labReports: [
        {
          id: `LAB-${Date.now()}`,
          testName: 'Point-of-Care Capillary Hemoglobin',
          testDate: new Date().toISOString(),
          performedAt: newPatientCluster,
          resultValue: `${newHemoglobin || 12.0} g/dL`,
          normalRange: newPatientGender === 'Female' ? '11.0 - 14.5 g/dL' : '13.0 - 17.0 g/dL',
          status: (Number(newHemoglobin) || 12.0) < (newPatientGender === 'Female' ? 11 : 13) ? 'ELEVATED' : 'NORMAL',
          doctorRemarks: 'Baseline screening.'
        }
      ],
      prescriptions: [
        {
          id: `RX-${Date.now()}`,
          medicineName: newPatientGender === 'Female' ? 'IFA Tablets (Iron & Folic Acid)' : 'Oral Rehydration & Vitamin Supp',
          dosage: '1 Tab',
          frequency: 'Afternoon (दोपहर)',
          timing: 'AFTER_FOOD',
          daysPrescribed: 30,
          issuedBy: 'ASHA Field Dispensation',
          issuedDate: new Date().toISOString().split('T')[0]
        }
      ]
    };

    const currentPatients = storageEngine.getPatients(activeNode);
    storageEngine.setPatients(activeNode, [newRecord, ...currentPatients]);

    if (networkMode === 'OFFLINE') {
      storageEngine.enqueueOutboxMutation({
        mutationId: `MUT-${Date.now()}`,
        nodeId: activeNode,
        patientId: newId,
        timestamp: new Date().toISOString(),
        baseRevision: 1,
        draftData: newRecord.data,
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
      details: `New patient record ${newPatientName} registered offline.`
    });

    setSelectedPatientId(newId);
    setMobileView('CHART');
    setIsCreatingNew(false);
    setNewPatientName('');
  };

  const handleAddLab = (newLab: LabInvestigation) => {
    if (!selectedPatient) return;
    const updatedReports = [newLab, ...(selectedPatient.labReports || [])];
    const updatedPatient: PatientRecord = {
      ...selectedPatient,
      labReports: updatedReports,
      revision: selectedPatient.revision + 1,
      lastModifiedBy: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      syncStatus: 'LOCAL'
    };

    const allPatients = storageEngine.getPatients(activeNode);
    const idx = allPatients.findIndex(p => p.patientId === selectedPatient.patientId);
    if (idx >= 0) {
      allPatients[idx] = updatedPatient;
      storageEngine.setPatients(activeNode, allPatients);
    }

    storageEngine.enqueueOutboxMutation({
      mutationId: `MUT-${Date.now()}-LAB`,
      nodeId: activeNode,
      patientId: selectedPatient.patientId,
      timestamp: new Date().toISOString(),
      baseRevision: selectedPatient.revision,
      draftData: selectedPatient.data,
      author: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      role: userRole,
      retryCount: 0
    });

    storageEngine.logAudit({
      nodeId: activeNode,
      role: userRole,
      action: 'RECORD_UPDATED',
      patientId: selectedPatient.patientId,
      revision: updatedPatient.revision,
      details: `New lab report '${newLab.testName}: ${newLab.resultValue}' recorded.`
    });

    setShowAddLabModal(false);
  };

  const handleAddPrescription = (newRx: StructuredPrescription) => {
    if (!selectedPatient) return;
    const updatedRxs = [newRx, ...(selectedPatient.prescriptions || [])];
    const updatedPatient: PatientRecord = {
      ...selectedPatient,
      prescriptions: updatedRxs,
      revision: selectedPatient.revision + 1,
      lastModifiedBy: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      syncStatus: 'LOCAL'
    };

    const allPatients = storageEngine.getPatients(activeNode);
    const idx = allPatients.findIndex(p => p.patientId === selectedPatient.patientId);
    if (idx >= 0) {
      allPatients[idx] = updatedPatient;
      storageEngine.setPatients(activeNode, allPatients);
    }

    storageEngine.enqueueOutboxMutation({
      mutationId: `MUT-${Date.now()}-RX`,
      nodeId: activeNode,
      patientId: selectedPatient.patientId,
      timestamp: new Date().toISOString(),
      baseRevision: selectedPatient.revision,
      draftData: selectedPatient.data,
      author: activeNode === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      role: userRole,
      retryCount: 0
    });

    storageEngine.logAudit({
      nodeId: activeNode,
      role: userRole,
      action: 'RECORD_UPDATED',
      patientId: selectedPatient.patientId,
      revision: updatedPatient.revision,
      details: `Doctor prescription added: '${newRx.medicineName} (${newRx.dosage}) for ${newRx.daysPrescribed}d'.`
    });

    setShowAddRxModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-2 sm:p-3 gap-2.5 bg-canvas overflow-y-auto lg:overflow-hidden select-none">
      {/* Top Clinical Station Strip */}
      <div className="bg-paper border border-stonehairline p-2.5 sm:px-3 sm:py-2 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-2.5 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-sm bg-slateteal text-white flex items-center justify-center shadow-2xs shrink-0">
            <Stethoscope className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-charcoal tracking-tight font-sans">
                {t('bannerTitle')}
              </h1>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-sm bg-canvas text-stone-600 border border-stonehairline hidden sm:inline">
                {t('nhmBadge')}
              </span>
            </div>
            <p className="text-[11px] text-mutedink">
              {t('bannerSubtitle')}
            </p>
          </div>
        </div>

        {/* Network & Quick Sync Controls */}
        <div className="flex items-center gap-2 font-mono text-xs">
          {/* Node Switcher */}
          <div className="flex items-center bg-canvas p-0.5 rounded-sm border border-stonehairline">
            <button
              onClick={() => setActiveNode('NODE_A')}
              className={`px-2.5 py-1 rounded-xs font-semibold transition-colors cursor-pointer ${
                activeNode === 'NODE_A'
                  ? 'bg-paper text-charcoal shadow-2xs border border-stonehairline/60'
                  : 'text-stone-500 hover:text-charcoal'
              }`}
            >
              {t('nodeA')}
            </button>
            <button
              onClick={() => setActiveNode('NODE_B')}
              className={`px-2.5 py-1 rounded-xs font-semibold transition-colors cursor-pointer ${
                activeNode === 'NODE_B'
                  ? 'bg-paper text-charcoal shadow-2xs border border-stonehairline/60'
                  : 'text-stone-500 hover:text-charcoal'
              }`}
            >
              {t('nodeB')}
            </button>
          </div>

          {/* Online/Offline Badge */}
          <button
            onClick={() => syncCoordinator.setNetworkMode(activeNode, networkMode === 'ONLINE' ? 'OFFLINE' : 'ONLINE')}
            className={`flex items-center justify-center min-w-[85px] gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold transition-colors cursor-pointer border shadow-2xs ${
              networkMode === 'ONLINE'
                ? 'bg-emerald-50/70 text-emerald-800 border-emerald-300 hover:bg-emerald-100/70'
                : 'bg-rose-50/70 text-rose-800 border-rose-300 hover:bg-rose-100/70'
            }`}
            title="Click to toggle network state"
          >
            {networkMode === 'ONLINE' ? <Wifi className="w-3.5 h-3.5 text-emerald-700" /> : <WifiOff className="w-3.5 h-3.5 text-rose-700" />}
            <span>{networkMode === 'ONLINE' ? t('online') : t('offline')}</span>
          </button>

          {/* Sync Now Button */}
          <button
            onClick={() => syncCoordinator.drainOutbox(activeNode)}
            disabled={networkMode === 'OFFLINE' || isSyncing}
            className="flex items-center justify-center min-w-[90px] gap-1.5 px-3 py-1 text-xs font-bold bg-slateteal hover:bg-slateteal-hover text-white rounded-sm border border-slateteal shadow-2xs transition-colors disabled:opacity-40 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{t('syncNow')}</span>
            {outbox.length > 0 && (
              <span className="bg-amber-400 text-amber-950 text-[10px] px-1.5 py-0.2 rounded-xs font-bold ml-0.5">
                {outbox.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Directory / Chart Switcher */}
      <div className="flex md:hidden items-center bg-paper p-1 border border-stonehairline rounded-sm text-xs font-mono shadow-2xs">
        <button
          onClick={() => setMobileView('DIRECTORY')}
          className={`flex-1 py-1.5 px-2 rounded-xs text-center font-bold transition-colors ${
            mobileView === 'DIRECTORY' ? 'bg-slateteal text-white' : 'text-stone-600'
          }`}
        >
          📋 {t('patientDirectory')} ({filteredPatients.length})
        </button>
        <button
          onClick={() => setMobileView('CHART')}
          className={`flex-1 py-1.5 px-2 rounded-xs text-center font-bold transition-colors ${
            mobileView === 'CHART' ? 'bg-slateteal text-white' : 'text-stone-600'
          }`}
        >
          🩺 {t('healthCard')} {selectedPatient ? `• ${selectedPatient.fullName}` : ''}
        </button>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2.5 min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Left Column: Patient Directory (मरीज सूची) */}
        <div className={`md:col-span-4 flex-col bg-paper border border-stonehairline rounded-sm overflow-hidden shadow-2xs ${mobileView === 'DIRECTORY' ? 'flex' : 'hidden md:flex'}`}>
          {/* Search & Add Patient Toolbar */}
          <div className="p-2.5 bg-canvas border-b border-stonehairline flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-paper border border-stonehairline pl-8 pr-2.5 py-1 text-xs text-charcoal rounded-sm focus:outline-slateteal placeholder:text-stone-400 font-sans shadow-2xs"
              />
            </div>
            <button
              onClick={() => setIsCreatingNew(true)}
              className="px-2.5 py-1 bg-slateteal hover:bg-slateteal-hover text-white text-xs font-semibold rounded-sm flex items-center gap-1 shadow-2xs border border-slateteal transition-colors cursor-pointer shrink-0"
              title="Add New Patient"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newPatientBtn')}</span>
            </button>
          </div>

          {/* Patient Directory List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100 p-1 space-y-0.5">
            {filteredPatients.map(p => {
              const isSelected = p.patientId === selectedPatient?.patientId;
              const isHighRisk = p.conditionTag.toLowerCase().includes('htn') || p.conditionTag.toLowerCase().includes('anemia');

              return (
                <div
                  key={p.patientId}
                  onClick={() => {
                    setSelectedPatientId(p.patientId);
                    setMobileView('CHART');
                  }}
                  className={`p-2.5 rounded-sm cursor-pointer transition-colors ${
                    isSelected 
                      ? 'bg-slateteal-light/50 border-l-4 border-l-slateteal border-y-0 border-r-0 shadow-2xs' 
                      : 'hover:bg-canvas/70 border-l-4 border-l-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Patient Avatar Tile */}
                    <div className={`w-9 h-9 rounded-sm flex items-center justify-center font-mono font-bold text-xs shrink-0 border ${
                      isSelected 
                        ? 'bg-slateteal text-white border-slateteal' 
                        : isHighRisk 
                        ? 'bg-rose-50 text-rose-800 border-rose-200' 
                        : 'bg-canvas text-stone-700 border-stonehairline'
                    }`}>
                      {p.fullName.charAt(0)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-xs sm:text-sm text-charcoal truncate">
                          {p.fullName}
                        </span>
                        <SyncStatusBadge status={p.syncStatus} revision={p.revision} />
                      </div>
                      <div className="text-[11px] text-mutedink flex items-center justify-between font-mono">
                        <span>{p.gender === 'Female' ? t('female') : t('male')} • {p.age} {t('years')}</span>
                        <span className="text-[10px] text-stone-400">{p.patientId}</span>
                      </div>
                      <div className="text-[11px] font-medium text-stone-700 truncate mt-0.5">
                        {p.conditionTag}
                      </div>
                      <div className="mt-1">
                        <NhmTriageBadge patient={p} compact />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Patient Health Record & Dashboard */}
        <div className={`md:col-span-8 flex flex-col bg-paper border border-stonehairline rounded-sm overflow-hidden shadow-2xs ${mobileView === 'CHART' ? 'flex' : 'hidden md:flex'}`}>
          {selectedPatient ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Patient Profile Header Card */}
              <div className="p-3 sm:p-3.5 bg-paper border-b border-stonehairline flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-sm bg-canvas border border-stonehairline text-slateteal flex flex-col items-center justify-center shadow-2xs shrink-0 font-mono">
                    <span className="text-sm font-bold tracking-tight">
                      {selectedPatient.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </span>
                    <span className="text-[8px] uppercase tracking-wider text-mutedink font-medium">
                      {selectedPatient.gender === 'Female' ? t('female') : t('male')}
                    </span>
                  </div>
                  <div>
                    <button
                      onClick={() => setMobileView('DIRECTORY')}
                      className="md:hidden mb-1.5 px-2 py-0.5 text-[11px] font-bold bg-canvas border border-stonehairline rounded-sm text-charcoal flex items-center gap-1 cursor-pointer"
                    >
                      ← {t('patientDirectory')}
                    </button>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base sm:text-lg font-bold text-charcoal tracking-tight font-sans">
                        {selectedPatient.fullName}
                      </h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-sm bg-canvas border border-stonehairline text-stone-700">
                        {selectedPatient.gender === 'Female' ? t('female') : t('male')}, {selectedPatient.age} {t('years')}
                      </span>
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

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-mutedink mt-1 font-mono">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-slateteal" />
                        ABHA: <strong className="text-charcoal bg-stone-100 px-1 py-0.2 rounded-xs border border-stone-200">{selectedPatient.abhaId || `91-${selectedPatient.patientId}-8801`}</strong>
                      </span>
                      {selectedPatient.phone && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-stone-600">
                            📞 {selectedPatient.phone}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="flex items-center gap-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {selectedPatient.villageCluster}
                      </span>
                    </div>

                    <div className="mt-1.5">
                      <NhmTriageBadge patient={selectedPatient} />
                    </div>
                  </div>
                </div>

                {/* Patient Clinical Action Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  {/* Secondary Clinical Instrument Buttons */}
                  <button
                    onClick={() => setShowAddLabModal(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Add Diagnostic Lab Test Result"
                  >
                    <FlaskConical className="w-3.5 h-3.5 text-stone-500" />
                    <span>{t('addLabBtn')}</span>
                  </button>

                  <button
                    onClick={() => setShowAddRxModal(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Add Doctor Medicine Prescription"
                  >
                    <Pill className="w-3.5 h-3.5 text-stone-500" />
                    <span>{t('addPrescriptionBtn')}</span>
                  </button>

                  <button
                    onClick={() => setShowPassportModal(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="View Offline Medicine & Prescription QR Code"
                  >
                    <QrCode className="w-3.5 h-3.5 text-stone-500" />
                    <span>{t('qrShareBtn')}</span>
                  </button>

                  <button
                    onClick={() => setShowPassportModal(true)}
                    className="px-2.5 py-1.5 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    title="Generate and Share Unified Patient Health Record"
                  >
                    <Share2 className="w-3.5 h-3.5 text-stone-500" />
                    <span>{t('shareRecordBtn')}</span>
                  </button>

                  {/* Primary CTA: Record Visit or Resolve Conflict */}
                  {selectedPatient.syncStatus === 'CONFLICT' ? (
                    <button
                      onClick={() => setIsResolving(true)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-sm flex items-center gap-1.5 shadow-xs transition-colors animate-pulse cursor-pointer border border-rose-700"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>{t('resolveConflict')}</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-slateteal hover:bg-slateteal-hover text-white rounded-sm flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer border border-slateteal"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>{t('newVisitBtn')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Patient Dashboard Tab Navigation */}
              <div className="px-3 sm:px-4 pt-1 pb-0 bg-paper border-b border-stonehairline flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0 shadow-2xs">
                <button
                  onClick={() => setActiveDetailTab('ALL')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeDetailTab === 'ALL'
                      ? 'border-slateteal text-slateteal bg-slateteal-light/30'
                      : 'border-transparent text-stone-500 hover:text-charcoal hover:bg-canvas'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t('tabAll')}</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('VITALS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeDetailTab === 'VITALS'
                      ? 'border-slateteal text-slateteal bg-slateteal-light/30'
                      : 'border-transparent text-stone-500 hover:text-charcoal hover:bg-canvas'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t('tabVitals')}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-xs font-bold ${activeDetailTab === 'VITALS' ? 'bg-slateteal text-white' : 'bg-canvas text-stone-600 border border-stonehairline'}`}>5</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('LABS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeDetailTab === 'LABS'
                      ? 'border-slateteal text-slateteal bg-slateteal-light/30'
                      : 'border-transparent text-stone-500 hover:text-charcoal hover:bg-canvas'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t('tabLabs')}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-xs font-bold ${activeDetailTab === 'LABS' ? 'bg-slateteal text-white' : 'bg-canvas text-stone-600 border border-stonehairline'}`}>{selectedPatient.labReports?.length || 0}</span>
                </button>

                <button
                  onClick={() => setActiveDetailTab('PRESCRIPTIONS')}
                  className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                    activeDetailTab === 'PRESCRIPTIONS'
                      ? 'border-slateteal text-slateteal bg-slateteal-light/30'
                      : 'border-transparent text-stone-500 hover:text-charcoal hover:bg-canvas'
                  }`}
                >
                  <Pill className="w-3.5 h-3.5 text-stone-500" />
                  <span>{t('tabPrescriptions')}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-xs font-bold ${activeDetailTab === 'PRESCRIPTIONS' ? 'bg-slateteal text-white' : 'bg-canvas text-stone-600 border border-stonehairline'}`}>{selectedPatient.prescriptions?.length || 0}</span>
                </button>
              </div>

              {/* Scrollable Tab Views Container */}
              <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-stone-100">

              {/* Tab 1: Vitals & Field Triage View */}
              {(activeDetailTab === 'ALL' || activeDetailTab === 'VITALS') && (
                <div className="p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {/* BP */}
                    <div className="p-3 bg-paper rounded-sm border border-stonehairline flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{t('bpTitle')}</span>
                        <span className="text-[9px] font-mono text-stone-400">&lt;120/80</span>
                      </div>
                      <div className="font-mono text-2xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.systolicBP ?? 120}/{selectedPatient.data?.diastolicBP ?? 80}
                        <span className="text-xs text-mutedink font-normal ml-1 font-sans">mmHg</span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border inline-flex items-center gap-1 ${
                          (selectedPatient.data?.systolicBP ?? 120) > 140 
                            ? 'text-amber-900 bg-amber-50 border-amber-300' 
                            : 'text-emerald-900 bg-emerald-50 border-emerald-200'
                        }`}>
                          {(selectedPatient.data?.systolicBP ?? 120) > 140 ? `▲ ${t('bpHigher')}` : `● ${t('bpNormal')}`}
                        </span>
                      </div>
                    </div>

                    {/* Heart Rate */}
                    <div className="p-3 bg-paper rounded-sm border border-stonehairline flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{t('hrTitle')}</span>
                        <span className="text-[9px] font-mono text-stone-400">60-100</span>
                      </div>
                      <div className="font-mono text-2xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.heartRate ?? 72}
                        <span className="text-xs text-mutedink font-normal ml-1 font-sans">BPM</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border border-emerald-200 text-emerald-900 bg-emerald-50 inline-flex items-center gap-1">
                          ● {t('hrRegular')}
                        </span>
                      </div>
                    </div>

                    {/* SpO2 */}
                    <div className="p-3 bg-paper rounded-sm border border-stonehairline flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{t('spo2Title')}</span>
                        <span className="text-[9px] font-mono text-stone-400">&gt;95%</span>
                      </div>
                      <div className="font-mono text-2xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.spO2 ?? 98}
                        <span className="text-xs text-mutedink font-normal ml-1 font-sans">%</span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border inline-flex items-center gap-1 ${
                          (selectedPatient.data?.spO2 ?? 98) < 95 
                            ? 'text-amber-900 bg-amber-50 border-amber-300' 
                            : 'text-emerald-900 bg-emerald-50 border-emerald-200'
                        }`}>
                          {(selectedPatient.data?.spO2 ?? 98) < 95 ? `▼ ${t('spo2Low')}` : `● ${t('spo2Normal')}`}
                        </span>
                      </div>
                    </div>

                    {/* Hemoglobin */}
                    <div className="p-3 bg-paper rounded-sm border border-stonehairline flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{t('hbTitle')}</span>
                        <span className="text-[9px] font-mono text-stone-400">12-16</span>
                      </div>
                      <div className="font-mono text-2xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.hemoglobinGdl ?? 12.0}
                        <span className="text-xs text-mutedink font-normal ml-1 font-sans">g/dL</span>
                      </div>
                      <div className="mt-2">
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border inline-flex items-center gap-1 ${
                          (selectedPatient.data?.hemoglobinGdl ?? 12.0) < 11 
                            ? 'text-amber-900 bg-amber-50 border-amber-300' 
                            : 'text-emerald-900 bg-emerald-50 border-emerald-200'
                        }`}>
                          {(selectedPatient.data?.hemoglobinGdl ?? 12.0) < 11 ? `▲ ${t('hbAnemia')}` : `● ${t('hbNormal')}`}
                        </span>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="p-3 bg-paper rounded-sm border border-stonehairline flex flex-col justify-between shadow-2xs hover:border-stone-400 transition-colors">
                      <div className="flex items-center justify-between text-mutedink mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider">{t('tempTitle')}</span>
                        <span className="text-[9px] font-mono text-stone-400">36.5-37.5</span>
                      </div>
                      <div className="font-mono text-2xl font-bold tabular-nums text-charcoal">
                        {selectedPatient.data?.temperatureC ?? 36.8}
                        <span className="text-xs text-mutedink font-normal ml-1 font-sans">°C</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-xs border border-emerald-200 text-emerald-900 bg-emerald-50 inline-flex items-center gap-1">
                          ● {t('tempNormal')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clinical Field Notes */}
                  <div className="p-3 bg-canvas border border-stonehairline rounded-sm space-y-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-mutedink block">
                      {t('notesTitle')}
                    </span>
                    <p className="text-xs text-charcoal leading-relaxed font-sans">
                      {selectedPatient.data.clinicalNotes}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: PHC Diagnostic Lab Reports */}
              {(activeDetailTab === 'ALL' || activeDetailTab === 'LABS') && (
                <div className="p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal block">
                        {t('labsHeader')}
                      </span>
                      <span className="text-[11px] text-mutedink">
                        PHC प्रयोगशाला एवं फील्ड रैपिड टेस्ट परिणाम
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-semibold text-stone-700 bg-canvas border border-stonehairline px-2 py-0.5 rounded-sm">
                        {selectedPatient.labReports?.length || 0} {t('testsAvailable')}
                      </span>
                      <button
                        onClick={() => setShowAddLabModal(true)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-stone-500" />
                        <span>{t('addLabBtn')}</span>
                      </button>
                    </div>
                  </div>

                  {(selectedPatient.labReports && selectedPatient.labReports.length > 0) ? (
                    <div className="space-y-2">
                      {selectedPatient.labReports.map(lab => (
                        <div key={lab.id} className="p-3.5 bg-paper border border-stonehairline rounded-sm shadow-2xs hover:border-stone-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs sm:text-sm text-charcoal">{lab.testName}</h4>
                              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs border ${
                                lab.status === 'CRITICAL'
                                  ? 'bg-rose-50 text-rose-800 border-rose-300'
                                  : lab.status === 'ELEVATED'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                                {lab.status === 'CRITICAL' ? `⚠️ ${t('statusCritical')}` : lab.status === 'ELEVATED' ? t('statusElevated') : `✓ ${t('statusNormal')}`}
                              </span>
                            </div>
                            <div className="text-xs text-mutedink flex items-center gap-2 font-mono">
                              <span>{t('performedAt')}: <strong className="text-charcoal">{lab.performedAt}</strong></span>
                              <span>•</span>
                              <span>{t('testDate')}: {new Date(lab.testDate).toLocaleDateString()}</span>
                            </div>
                            <p className="text-xs text-stone-600 italic">
                              {t('doctorRemarks')}: {lab.doctorRemarks}
                            </p>
                          </div>

                          <div className="bg-canvas p-2.5 rounded-sm border border-stonehairline sm:text-right shrink-0">
                            <div className="text-base font-bold text-charcoal font-mono tabular-nums">{lab.resultValue}</div>
                            <div className="text-[10px] text-mutedink font-mono">{t('normalRange')}: {lab.normalRange}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-stone-400 font-mono">
                      No lab records available.
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Structured Prescriptions */}
              {(activeDetailTab === 'ALL' || activeDetailTab === 'PRESCRIPTIONS') && (
                <div className="p-3.5 sm:p-4 space-y-3 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                    <div>
                      <span className="text-xs font-mono font-bold uppercase tracking-wider text-charcoal block">
                        {t('prescriptionsHeader')}
                      </span>
                      <span className="text-[11px] text-mutedink">
                        डॉक्टर द्वारा प्रमाणित डिजिटल पर्ची व दवाइयाँ
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowPassportModal(true)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                        title="Open Patient QR Code"
                      >
                        <QrCode className="w-3.5 h-3.5 text-stone-500" />
                        <span>{t('qrShareBtn')}</span>
                      </button>

                      <button
                        onClick={() => setShowAddRxModal(true)}
                        className="px-2.5 py-1 text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stonehairline rounded-sm flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 text-stone-500" />
                        <span>{t('addPrescriptionBtn')}</span>
                      </button>
                    </div>
                  </div>

                  {(selectedPatient.prescriptions && selectedPatient.prescriptions.length > 0) ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {selectedPatient.prescriptions.map(rx => (
                        <div key={rx.id} className="p-3.5 bg-paper border border-stonehairline rounded-sm shadow-2xs space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs sm:text-sm text-charcoal">{rx.medicineName}</span>
                            <span className="text-[10px] font-mono font-bold text-stone-700 bg-canvas border border-stonehairline px-2 py-0.5 rounded-sm">
                              {rx.daysPrescribed} {t('days')}
                            </span>
                          </div>
                          <div className="text-xs text-stone-600 flex items-center justify-between">
                            <span>{t('dosage')}: <strong className="text-charcoal font-mono">{rx.dosage}</strong></span>
                            <span className="text-stone-500">{rx.timing === 'AFTER_FOOD' ? t('afterFood') : t('beforeFood')}</span>
                          </div>
                          <div className="text-xs text-slateteal font-semibold bg-slateteal-light/40 border border-slateteal/20 p-2 rounded-sm font-mono">
                            {t('timing')}: {rx.frequency}
                          </div>
                          <div className="text-[10px] text-mutedink pt-1.5 border-t border-stone-100 font-mono">
                            {t('issuedBy')}: {rx.issuedBy} ({rx.issuedDate})
                          </div>
                        </div>
                      ))}
                    </div>

                    {selectedPatient.data.medicationsIssued && (
                      <div className="p-2.5 bg-canvas border border-stonehairline rounded-sm text-xs text-stone-700 flex flex-wrap items-center justify-between gap-1.5 mt-2.5">
                        <span className="text-mutedink font-medium">फील्ड में वितरित दवाइयाँ (Field Dispensed):</span>
                        <strong className="text-charcoal font-mono">{selectedPatient.data.medicationsIssued}</strong>
                      </div>
                    )}
                    </>
                  ) : (
                    <div className="p-3 bg-canvas border border-stonehairline rounded-sm text-xs text-stone-700">
                      {selectedPatient.data.medicationsIssued}
                    </div>
                  )}
                </div>
              )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-stone-400">
              मरीज का विवरण देखने के लिए सूची से किसी मरीज का चयन करें।
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
          onSaved={() => setTick((t: number) => t + 1)}
        />
      )}

      {/* 3-Way Conflict Resolution Modal */}
      {isResolving && selectedPatient && (
        <ConflictResolutionModal
          patient={selectedPatient}
          nodeId={activeNode}
          userRole={userRole}
          onClose={() => setIsResolving(false)}
          onResolved={() => setTick((t: number) => t + 1)}
        />
      )}

      {/* Share Patient Health Passport Modal */}
      {showPassportModal && selectedPatient && (
        <ShareHealthPassportModal
          patient={selectedPatient}
          onClose={() => setShowPassportModal(false)}
        />
      )}

      {/* Add New Patient Modal with Full Gender Switching & Custom Clinical Settings */}
      {isCreatingNew && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-paper border border-stonehairline w-full max-w-lg rounded-sm shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-3.5 sm:p-4 bg-paper border-b border-stonehairline flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-sm bg-slateteal text-white flex items-center justify-center font-bold shadow-2xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-charcoal font-sans">
                    नया मरीज पंजीकृत करें (Patient Registration)
                  </h3>
                  <p className="text-[11px] text-mutedink font-mono">
                    ऑफ़लाइन सुरक्षित पंजीकरण • इंटरनेट मिलते ही PHC सर्वर से सिंक
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreatingNew(false)}
                className="w-7 h-7 rounded-sm text-stone-400 hover:text-charcoal hover:bg-canvas flex items-center justify-center cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewPatient} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 text-xs">
              {/* Gender Switching Segmented Selector */}
              <div>
                <label className="block text-stone-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>मरीज का लिंग (Gender) <span className="text-rose-500">*</span></span>
                  <span className="text-[10px] font-normal text-stone-400">चुना हुआ: {newPatientGender === 'Female' ? 'महिला' : newPatientGender === 'Male' ? 'पुरुष' : 'अन्य'}</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('Female')}
                    className={`py-2 px-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      newPatientGender === 'Female'
                        ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-2 ring-rose-200'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>👩</span>
                    <span>महिला (Female)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('Male')}
                    className={`py-2 px-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      newPatientGender === 'Male'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-xs ring-2 ring-blue-200'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>👨</span>
                    <span>पुरुष (Male)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGenderSwitch('Other')}
                    className={`py-2 px-3 rounded-xl font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                      newPatientGender === 'Other'
                        ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs ring-2 ring-emerald-200'
                        : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    <span>🧑</span>
                    <span>अन्य (Other)</span>
                  </button>
                </div>
              </div>

              {/* Full Name & Age */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-stone-700 font-bold mb-1">
                    मरीज का पूरा नाम (Full Name) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newPatientName}
                    onChange={e => setNewPatientName(e.target.value)}
                    placeholder={newPatientGender === 'Female' ? 'उदा. सुमित्रा देवी' : newPatientGender === 'Male' ? 'उदा. मोहन लाल कुमावत' : 'उदा. किरन'}
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-stone-900 font-semibold focus:outline-emerald-600 focus:bg-white text-sm"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    उम्र (Age) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      required
                      min={1}
                      max={110}
                      value={newPatientAge}
                      onChange={e => setNewPatientAge(Number(e.target.value))}
                      className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-stone-900 font-bold text-center focus:outline-emerald-600 focus:bg-white"
                    />
                    <span className="text-stone-400 font-medium">वर्ष</span>
                  </div>
                </div>
              </div>

              {/* Phone & ABHA ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-bold mb-1">
                    मोबाइल नंबर (Contact Phone)
                  </label>
                  <input
                    type="text"
                    value={newPatientPhone}
                    onChange={e => setNewPatientPhone(e.target.value)}
                    placeholder="+91 98290 12345"
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-stone-900 font-mono focus:outline-emerald-600 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-700 font-bold">
                      ABHA ID (डिजिटल स्वास्थ्य पहचान)
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewPatientAbha(generateRandomAbha())}
                      className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer"
                    >
                      🔄 नया बनाएं
                    </button>
                  </div>
                  <input
                    type="text"
                    value={newPatientAbha}
                    onChange={e => setNewPatientAbha(e.target.value)}
                    placeholder="उदा. 91-8055-1234-5678"
                    className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-stone-900 font-mono text-xs focus:outline-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Village Cluster & Presets */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  उप-केंद्र / गाँव (Village Cluster) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPatientCluster}
                  onChange={e => setNewPatientCluster(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-stone-900 focus:outline-emerald-600 focus:bg-white mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {['Bassi PHC - Subcentre Cluster 3', 'Sanganer Outpost - Sector 4B', 'Chaksu CHC - Ward 2', 'Jamwa Ramgarh - Cluster 1'].map(cluster => (
                    <button
                      key={cluster}
                      type="button"
                      onClick={() => setNewPatientCluster(cluster)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        newPatientCluster === cluster
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {cluster.split(' - ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Condition Tag & Presets */}
              <div>
                <label className="block text-stone-700 font-bold mb-1">
                  स्वास्थ्य स्थिति (Condition Tag / Triage Diagnosis) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newPatientCondition}
                  onChange={e => setNewPatientCondition(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 px-3 py-2 rounded-xl text-stone-900 focus:outline-emerald-600 focus:bg-white mb-1.5"
                />
                <div className="flex flex-wrap gap-1.5">
                  {(newPatientGender === 'Female' ? [
                    'Antenatal Care (Trimester 2)',
                    'High-Risk Pregnancy (HRP) // Pre-Eclampsia Watch',
                    'Moderate Anemia (IFA Red Protocol)',
                    'Gestational HTN (Week 32)',
                    'Type-2 DM & Peripheral Neuropathy',
                    'General OPD Checkup'
                  ] : [
                    'Hypertension (Stage-1 Elevated)',
                    'Type-2 DM & Peripheral Neuropathy',
                    'Moderate Anemia Warning',
                    'COPD / Respiratory Check',
                    'General OPD Health Check'
                  ]).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setNewPatientCondition(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
                        newPatientCondition === tag
                          ? 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold'
                          : 'bg-stone-100 text-stone-600 border-stone-200 hover:bg-stone-200'
                      }`}
                    >
                      {tag.length > 25 ? tag.slice(0, 24) + '...' : tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Expandable Custom Settings / Initial Vitals Section */}
              <div className="border border-stone-200 rounded-xl bg-stone-50/80 p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-stone-700 font-bold">⚙️ क्लिनिकल जांच एवं प्राथमिक दवाइयाँ</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-mono">
                      {showCustomSettings ? 'Active' : 'Defaults Loaded'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCustomSettings(!showCustomSettings)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                  >
                    {showCustomSettings ? 'कम विवरण छुपाएं (Hide)' : 'जांच मान बदलें (Customize)'}
                  </button>
                </div>

                {showCustomSettings && (
                  <div className="pt-2 border-t border-stone-200/80 space-y-3 animate-in fade-in duration-150">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">सिस्टोलिक BP (mmHg)</label>
                        <input
                          type="number"
                          value={newSystolicBP}
                          onChange={e => setNewSystolicBP(Number(e.target.value))}
                          className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">डायस्टोलिक BP (mmHg)</label>
                        <input
                          type="number"
                          value={newDiastolicBP}
                          onChange={e => setNewDiastolicBP(Number(e.target.value))}
                          className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">हृदय गति (HR BPM)</label>
                        <input
                          type="number"
                          value={newHeartRate}
                          onChange={e => setNewHeartRate(Number(e.target.value))}
                          className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">ऑक्सीजन (SpO2 %)</label>
                        <input
                          type="number"
                          value={newSpO2}
                          onChange={e => setNewSpO2(Number(e.target.value))}
                          className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">हीमोग्लोबिन (Hb g/dL)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newHemoglobin}
                          onChange={e => setNewHemoglobin(Number(e.target.value))}
                          className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-stone-600 mb-1">तापमान (Temp °C)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newTemperature}
                          onChange={e => setNewTemperature(Number(e.target.value))}
                          className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs font-bold text-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">वितरित दवा / फील्ड किट (Issued Meds)</label>
                      <input
                        type="text"
                        value={newMedications}
                        onChange={e => setNewMedications(e.target.value)}
                        className="w-full bg-white border border-stone-200 px-2 py-1.5 rounded-lg text-xs text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">क्लिनिकल टिप्पणी (Field Clinical Notes)</label>
                      <textarea
                        rows={2}
                        value={newClinicalNotes}
                        onChange={e => setNewClinicalNotes(e.target.value)}
                        className="w-full bg-white border border-stone-200 p-2 rounded-lg text-xs text-stone-900"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Form Action Buttons */}
              <div className="pt-3 border-t border-stonehairline flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:text-charcoal bg-paper hover:bg-canvas border border-stonehairline rounded-sm cursor-pointer transition-colors"
                >
                  रद्द करें (Cancel)
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-slateteal hover:bg-slateteal-hover rounded-sm shadow-xs border border-slateteal cursor-pointer transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>मरीज पंजीकृत करें (Register Patient)</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lab Report Modal */}
      {showAddLabModal && selectedPatient && (
        <AddLabTestModal
          patientName={selectedPatient.fullName}
          onClose={() => setShowAddLabModal(false)}
          onSave={handleAddLab}
        />
      )}

      {/* Add Prescription Modal */}
      {showAddRxModal && selectedPatient && (
        <AddPrescriptionModal
          patientName={selectedPatient.fullName}
          onClose={() => setShowAddRxModal(false)}
          onSave={handleAddPrescription}
        />
      )}
    </div>
  );
};
