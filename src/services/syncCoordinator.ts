import { 
  NodeId, 
  NetworkMode, 
  PatientRecord, 
  VitalSignPayload, 
  ConflictDetails 
} from '../types/clinical';
import { storageEngine } from './storageEngine';
import { encryptClinicalPayload, formatCiphertextDisplay } from './cryptoVault';

export interface NodeNetworkStatus {
  nodeId: NodeId;
  networkMode: NetworkMode;
  isSyncing: boolean;
  lastSyncTime: string | null;
}

class SyncCoordinator {
  private networkStates: Record<NodeId, NetworkMode> = {
    NODE_A: 'ONLINE',
    NODE_B: 'ONLINE'
  };

  private syncingStates: Record<NodeId, boolean> = {
    NODE_A: false,
    NODE_B: false
  };

  private listeners: Set<() => void> = new Set();

  constructor() {
    // Listen to storage engine changes
    storageEngine.subscribe(() => this.notify());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getNetworkMode(nodeId: NodeId): NetworkMode {
    return this.networkStates[nodeId];
  }

  public isSyncing(nodeId: NodeId): boolean {
    return this.syncingStates[nodeId];
  }

  public async setNetworkMode(nodeId: NodeId, mode: NetworkMode): Promise<void> {
    const previous = this.networkStates[nodeId];
    this.networkStates[nodeId] = mode;
    this.notify();

    storageEngine.logAudit({
      nodeId,
      role: 'SYSTEM',
      action: 'SYNC_DISPATCHED',
      details: `Network adapter switched: [${previous}] -> [${mode}]`
    });

    // Auto-drain outbox if switching back to ONLINE or FLAKY
    if (mode !== 'OFFLINE' && previous === 'OFFLINE') {
      await this.drainOutbox(nodeId);
    }
  }

  // --- Pull Fresh Server State to Node (if node is ONLINE) ---
  public syncDownFromServer(nodeId: NodeId): void {
    if (this.networkStates[nodeId] === 'OFFLINE') return;

    const serverPatients = storageEngine.getPatients('CENTRAL_SERVER');
    const localPatients = storageEngine.getPatients(nodeId);
    const outbox = storageEngine.getOutbox(nodeId);

    const merged = localPatients.map(local => {
      // If locally in CONFLICT or has active un-drained outbox mutation, keep local state
      const hasPendingOutbox = outbox.some(m => m.patientId === local.patientId);
      if (local.syncStatus === 'CONFLICT' || hasPendingOutbox) {
        return local;
      }

      const serverVersion = serverPatients.find(s => s.patientId === local.patientId);
      if (serverVersion) {
        return {
          ...serverVersion,
          syncStatus: 'SYNCED' as const
        };
      }

      // Patient was created offline, outbox is drained/empty, but server doesn't have it yet:
      // Canonicalize to server now!
      if (local.syncStatus === 'PENDING' || local.syncStatus === 'LOCAL') {
        const canonicalRecord: PatientRecord = {
          ...local,
          revision: 1,
          baseRevision: 1,
          syncStatus: 'SYNCED'
        };
        serverPatients.unshift(canonicalRecord);
        storageEngine.setPatients('CENTRAL_SERVER', serverPatients);

        storageEngine.logSyncPacket({
          sourceNode: nodeId,
          targetNode: 'CENTRAL_SERVER',
          patientId: local.patientId,
          baseRevision: 1,
          status: 'ACCEPTED_200',
          latencyMs: 120,
          summary: `HTTP 200 OK — Offline patient ${local.fullName} (${local.patientId}) canonicalized to Central Server.`
        });

        return canonicalRecord;
      }

      return local;
    });

    // Also pull in any server records not present on this local node
    const localIds = new Set(merged.map(p => p.patientId));
    serverPatients.forEach(sp => {
      if (!localIds.has(sp.patientId)) {
        merged.push({ ...sp, syncStatus: 'SYNCED' });
      }
    });

    storageEngine.setPatients(nodeId, merged);
  }

  // --- Drain Node's Outbox to Central Server ---
  public async drainOutbox(nodeId: NodeId): Promise<{ synced: number; conflicts: number }> {
    if (this.networkStates[nodeId] === 'OFFLINE') {
      return { synced: 0, conflicts: 0 };
    }

    this.syncingStates[nodeId] = true;
    this.notify();

    const latency = this.networkStates[nodeId] === 'FLAKY' ? 950 : 350;
    // Simulate real network flight latency
    await new Promise(res => setTimeout(res, latency));

    const outbox = storageEngine.getOutbox(nodeId);
    if (outbox.length === 0) {
      // Sync down any fresh server updates and reconcile any orphaned PENDING records
      this.syncDownFromServer(nodeId);
      this.syncingStates[nodeId] = false;
      this.notify();
      return { synced: 0, conflicts: 0 };
    }

    let syncedCount = 0;
    let conflictCount = 0;

    const serverPatients = storageEngine.getPatients('CENTRAL_SERVER');
    const localPatients = storageEngine.getPatients(nodeId);

    for (const mutation of outbox) {
      const serverIdx = serverPatients.findIndex(p => p.patientId === mutation.patientId);
      const localIdx = localPatients.findIndex(p => p.patientId === mutation.patientId);

      if (localIdx === -1) {
        storageEngine.removeOutboxMutation(nodeId, mutation.mutationId);
        continue;
      }

      const localRecord = localPatients[localIdx];

      // CASE 0: NEW PATIENT CREATED OFFLINE (Not yet present in Central Server)
      if (serverIdx === -1) {
        const enc = await encryptClinicalPayload(localRecord.data);
        const newServerRecord: PatientRecord = {
          ...localRecord,
          revision: 1,
          baseRevision: 1,
          syncStatus: 'SYNCED',
          lastModifiedBy: mutation.author,
          lastModifiedAt: mutation.timestamp,
          encryptedBlobPreview: `${enc.algorithm}::${formatCiphertextDisplay(enc.ciphertextBase64, 32)}::IV:${enc.ivHex.slice(0, 8)}`,
          conflictPayload: undefined
        };

        serverPatients.unshift(newServerRecord);
        storageEngine.setPatients('CENTRAL_SERVER', serverPatients);

        localPatients[localIdx] = {
          ...newServerRecord,
          syncStatus: 'SYNCED'
        };

        storageEngine.removeOutboxMutation(nodeId, mutation.mutationId);
        syncedCount++;

        storageEngine.logSyncPacket({
          sourceNode: nodeId,
          targetNode: 'CENTRAL_SERVER',
          patientId: mutation.patientId,
          baseRevision: 1,
          status: 'ACCEPTED_200',
          latencyMs: latency,
          summary: `HTTP 200 OK — Offline registration of patient ${localRecord.fullName} (${localRecord.patientId}) canonicalized to Central Server.`
        });

        storageEngine.logAudit({
          nodeId,
          role: mutation.role,
          action: 'SYNC_ACKNOWLEDGED',
          patientId: mutation.patientId,
          revision: 1,
          details: `Offline registration synced. Patient ${localRecord.fullName} committed as canonical v1.`
        });

        continue;
      }

      const serverRecord = serverPatients[serverIdx];

      // Handshake revision check
      if (mutation.baseRevision === serverRecord.revision) {
        // CASE 1: CLEAN COMMIT (Fast-Forward Handshake)
        const nextRev = serverRecord.revision + 1;
        const enc = await encryptClinicalPayload(mutation.draftData);

        const updatedServerRecord: PatientRecord = {
          ...serverRecord,
          revision: nextRev,
          baseRevision: nextRev,
          syncStatus: 'SYNCED',
          lastModifiedBy: mutation.author,
          lastModifiedAt: mutation.timestamp,
          data: mutation.draftData,
          encryptedBlobPreview: `${enc.algorithm}::${formatCiphertextDisplay(enc.ciphertextBase64, 32)}::IV:${enc.ivHex.slice(0, 8)}`,
          conflictPayload: undefined
        };

        serverPatients[serverIdx] = updatedServerRecord;
        storageEngine.setPatients('CENTRAL_SERVER', serverPatients);

        // Update local node state
        localPatients[localIdx] = {
          ...updatedServerRecord,
          syncStatus: 'SYNCED'
        };

        storageEngine.removeOutboxMutation(nodeId, mutation.mutationId);
        syncedCount++;

        storageEngine.logSyncPacket({
          sourceNode: nodeId,
          targetNode: 'CENTRAL_SERVER',
          patientId: mutation.patientId,
          baseRevision: mutation.baseRevision,
          status: 'ACCEPTED_200',
          latencyMs: latency,
          summary: `HTTP 200 OK — Revision bumped v${mutation.baseRevision} → v${nextRev}. Record canonicalized.`
        });

        storageEngine.logAudit({
          nodeId,
          role: mutation.role,
          action: 'SYNC_ACKNOWLEDGED',
          patientId: mutation.patientId,
          revision: nextRev,
          details: `Sync handshake completed. Server revision updated to v${nextRev}.`
        });

      } else {
        // CASE 2: CONFLICT DETECTED (HTTP 409 Conflict)
        conflictCount++;

        const conflictDetails: ConflictDetails = {
          baseData: { ...localRecord.data }, // Base before divergent edits
          localData: mutation.draftData,
          remoteData: serverRecord.data,
          remoteRevision: serverRecord.revision,
          remoteAuthor: serverRecord.lastModifiedBy,
          remoteTimestamp: serverRecord.lastModifiedAt
        };

        localPatients[localIdx] = {
          ...localRecord,
          syncStatus: 'CONFLICT',
          conflictPayload: conflictDetails
        };

        storageEngine.logSyncPacket({
          sourceNode: nodeId,
          targetNode: 'CENTRAL_SERVER',
          patientId: mutation.patientId,
          baseRevision: mutation.baseRevision,
          status: 'CONFLICT_409',
          latencyMs: latency,
          summary: `HTTP 409 Conflict — Local edit branched from v${mutation.baseRevision}, but Central Server is at v${serverRecord.revision} (authored by ${serverRecord.lastModifiedBy}). Silent overwrite blocked.`
        });

        storageEngine.logAudit({
          nodeId,
          role: mutation.role,
          action: 'CONFLICT_DETECTED',
          patientId: mutation.patientId,
          revision: serverRecord.revision,
          details: `Concurrent edit conflict flagged against v${serverRecord.revision}. Awaiting 3-way clinical reconciliation.`
        });
      }
    }

    storageEngine.setPatients(nodeId, localPatients);

    // If other node is online, also propagate server revisions down
    const otherNode: NodeId = nodeId === 'NODE_A' ? 'NODE_B' : 'NODE_A';
    if (this.networkStates[otherNode] === 'ONLINE') {
      this.syncDownFromServer(otherNode);
    }

    this.syncingStates[nodeId] = false;
    this.notify();

    return { synced: syncedCount, conflicts: conflictCount };
  }

  // --- 3-Way Conflict Resolution Commit ---
  public async resolveConflict(
    resolvingNodeId: NodeId,
    patientId: string,
    resolvedData: VitalSignPayload,
    clinicalResolutionNote: string,
    resolvedByRole: 'ASHA_WORKER' | 'MEDICAL_OFFICER'
  ): Promise<void> {
    const serverPatients = storageEngine.getPatients('CENTRAL_SERVER');
    const serverIdx = serverPatients.findIndex(p => p.patientId === patientId);
    if (serverIdx === -1) return;

    const currentServer = serverPatients[serverIdx];
    const newRevision = currentServer.revision + 1;

    // Attach resolution note to clinicalNotes
    const finalData: VitalSignPayload = {
      ...resolvedData,
      clinicalNotes: `${resolvedData.clinicalNotes.trim()}\n[3-WAY RESOLUTION v${newRevision} by ${resolvedByRole}]: ${clinicalResolutionNote}`
    };

    const enc = await encryptClinicalPayload(finalData);

    const mergedRecord: PatientRecord = {
      ...currentServer,
      revision: newRevision,
      baseRevision: newRevision,
      syncStatus: 'SYNCED',
      lastModifiedBy: resolvingNodeId === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      data: finalData,
      encryptedBlobPreview: `${enc.algorithm}::${formatCiphertextDisplay(enc.ciphertextBase64, 32)}::IV:${enc.ivHex.slice(0, 8)}`,
      conflictPayload: undefined
    };

    // Update Central Server
    serverPatients[serverIdx] = mergedRecord;
    storageEngine.setPatients('CENTRAL_SERVER', serverPatients);

    // Update Node A
    const nodeAPatients = storageEngine.getPatients('NODE_A');
    const aIdx = nodeAPatients.findIndex(p => p.patientId === patientId);
    if (aIdx !== -1) {
      nodeAPatients[aIdx] = { ...mergedRecord, syncStatus: 'SYNCED' };
      storageEngine.setPatients('NODE_A', nodeAPatients);
      storageEngine.clearOutbox('NODE_A');
    }

    // Update Node B
    const nodeBPatients = storageEngine.getPatients('NODE_B');
    const bIdx = nodeBPatients.findIndex(p => p.patientId === patientId);
    if (bIdx !== -1) {
      nodeBPatients[bIdx] = { ...mergedRecord, syncStatus: 'SYNCED' };
      storageEngine.setPatients('NODE_B', nodeBPatients);
      storageEngine.clearOutbox('NODE_B');
    }

    storageEngine.logSyncPacket({
      sourceNode: resolvingNodeId,
      targetNode: 'CENTRAL_SERVER',
      patientId,
      baseRevision: currentServer.revision,
      status: 'ACCEPTED_200',
      latencyMs: 180,
      summary: `HTTP 200 OK — 3-Way clinical merge accepted. Committed as canonical v${newRevision}.`
    });

    storageEngine.logAudit({
      nodeId: resolvingNodeId,
      role: resolvedByRole,
      action: 'CONFLICT_RESOLVED',
      patientId,
      revision: newRevision,
      details: `Conflict reconciled. Field-level clinical merge committed as v${newRevision}. Note: ${clinicalResolutionNote}`
    });

    this.notify();
  }

  // --- 1-Click Demo Macro for Live Judging ---
  public async stageConflictScenario(): Promise<void> {
    // 1. Reset baseline to clean state first
    await storageEngine.resetAllStores();

    // 2. Set Node A to OFFLINE
    this.networkStates['NODE_A'] = 'OFFLINE';
    this.networkStates['NODE_B'] = 'ONLINE';
    this.notify();

    // 3. Edit Sunita Devi (PT-8041) on Node A (ASHA field worker, offline)
    await storageEngine.updateLocalPatientRecord(
      'NODE_A',
      'PT-8041',
      {
        systolicBP: 160,
        diastolicBP: 102,
        hemoglobinGdl: 9.6,
        clinicalNotes: 'ASHA Field Check: Patient reports persistent frontal headache and blurred vision. Severe gestational hypertension detected.'
      },
      'ASHA_WORKER'
    );

    // 4. Edit Sunita Devi (PT-8041) on Node B (Doctor at PHC Clinic Desk, online)
    await storageEngine.updateLocalPatientRecord(
      'NODE_B',
      'PT-8041',
      {
        medicationsIssued: 'Urgent: IV Magnesium Sulfate 4g loading dose + Labetalol 200mg BD. Emergency obstetrics transfer.',
        clinicalNotes: 'PHC Clinic Desk: High risk pre-eclampsia suspected. Emergency 108 ambulance dispatch requested for Bassi cluster.'
      },
      'MEDICAL_OFFICER'
    );

    // Drain Node B (which is online, so it commits directly to Central Server as v2)
    await this.drainOutbox('NODE_B');

    // 5. Now bring Node A back ONLINE and attempt to drain!
    this.networkStates['NODE_A'] = 'ONLINE';
    this.notify();

    // Draining Node A will encounter server at v2 while Node A branched from v1!
    // Triggers HTTP 409 Conflict deterministically!
    await this.drainOutbox('NODE_A');

    storageEngine.logAudit({
      nodeId: 'CENTRAL_SERVER',
      role: 'SYSTEM',
      action: 'CONFLICT_DETECTED',
      patientId: 'PT-8041',
      details: 'DEMO SCENARIO STAGED: Node A (ASHA) and Node B (Doctor) made concurrent offline/online modifications to PT-8041.'
    });
  }
}

export const syncCoordinator = new SyncCoordinator();
