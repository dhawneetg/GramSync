import { 
  PatientRecord, 
  OutboxMutation, 
  AuditLogEntry, 
  NodeId, 
  UserRole,
  SyncPacket 
} from '../types/clinical';
import { encryptClinicalPayload, formatCiphertextDisplay } from './cryptoVault';

// Storage Keys
const STORAGE_PREFIX = 'gramsync_v2_';
const KEY_NODE_A_PATIENTS = `${STORAGE_PREFIX}node_a_patients`;
const KEY_NODE_B_PATIENTS = `${STORAGE_PREFIX}node_b_patients`;
const KEY_SERVER_PATIENTS = `${STORAGE_PREFIX}central_server_patients`;
const KEY_NODE_A_OUTBOX = `${STORAGE_PREFIX}node_a_outbox`;
const KEY_NODE_B_OUTBOX = `${STORAGE_PREFIX}node_b_outbox`;
const KEY_AUDIT_LOG = `${STORAGE_PREFIX}audit_log`;
const KEY_SYNC_PACKETS = `${STORAGE_PREFIX}sync_packets`;

// Realistic Fictional Seed Records (All strictly synthetic clinical data)
export const SEED_PATIENTS: PatientRecord[] = [
  {
    patientId: 'PT-8041',
    fullName: 'Sunita Devi',
    age: 26,
    gender: 'Female',
    villageCluster: 'Bassi PHC - Subcentre Cluster 3',
    conditionTag: 'Gestational HTN (Week 32)',
    revision: 1,
    baseRevision: 1,
    syncStatus: 'SYNCED',
    lastModifiedBy: 'SYSTEM',
    lastModifiedAt: '2026-10-23T06:00:00.000Z',
    data: {
      systolicBP: 142,
      diastolicBP: 92,
      heartRate: 78,
      temperatureC: 36.8,
      spO2: 98,
      hemoglobinGdl: 10.2,
      medicationsIssued: 'Labetalol 100mg BD, IFA Tablets (Iron & Folic Acid)',
      clinicalNotes: 'Gestational age 32 weeks. Pitting edema +1. Regular fetal heart sound 144 bpm. Strict salt restriction advised.'
    }
  },
  {
    patientId: 'PT-8042',
    fullName: 'Rameshwar Meena',
    age: 58,
    gender: 'Male',
    villageCluster: 'Sanganer Outpost - Sector 4B',
    conditionTag: 'Type-2 DM & Peripheral Neuropathy',
    revision: 1,
    baseRevision: 1,
    syncStatus: 'SYNCED',
    lastModifiedBy: 'SYSTEM',
    lastModifiedAt: '2026-10-23T06:15:00.000Z',
    data: {
      systolicBP: 130,
      diastolicBP: 84,
      heartRate: 72,
      temperatureC: 36.6,
      spO2: 97,
      hemoglobinGdl: 13.5,
      medicationsIssued: 'Metformin 500mg SR, Pregabalin 75mg HS',
      clinicalNotes: 'Fasting capillary glucose 168 mg/dL. Reduced foot sensation bilaterally. Monofilament test ordered. Foot care kit provided.'
    }
  },
  {
    patientId: 'PT-8043',
    fullName: 'Geeta Bai',
    age: 34,
    gender: 'Female',
    villageCluster: 'Chaksu Subcentre - Sector 1',
    conditionTag: 'Severe Nutritional Anemia (High Risk)',
    revision: 1,
    baseRevision: 1,
    syncStatus: 'SYNCED',
    lastModifiedBy: 'SYSTEM',
    lastModifiedAt: '2026-10-23T06:30:00.000Z',
    data: {
      systolicBP: 108,
      diastolicBP: 68,
      heartRate: 92,
      temperatureC: 37.0,
      spO2: 96,
      hemoglobinGdl: 7.4,
      medicationsIssued: 'IV Ferric Carboxymaltose 500mg planned, Deworming Albendazole 400mg',
      clinicalNotes: 'Pallor +++ in palpebral conjunctiva. Easy fatiguability. PHC referral scheduled for parenteral iron infusion tomorrow morning.'
    }
  },
  {
    patientId: 'PT-8044',
    fullName: 'Mohan Lal Sharma',
    age: 62,
    gender: 'Male',
    villageCluster: 'Amer Rural Post - Hill Unit',
    conditionTag: 'Chronic Bronchitis / Stage 2 HTN',
    revision: 1,
    baseRevision: 1,
    syncStatus: 'SYNCED',
    lastModifiedBy: 'SYSTEM',
    lastModifiedAt: '2026-10-23T06:45:00.000Z',
    data: {
      systolicBP: 154,
      diastolicBP: 96,
      heartRate: 84,
      temperatureC: 36.9,
      spO2: 92,
      hemoglobinGdl: 14.8,
      medicationsIssued: 'Amlodipine 5mg OD, Salbutamol MDI 100mcg PRN',
      clinicalNotes: 'Bilateral expiratory wheeze. Cough with whitish expectoration. Advised wood-smoke avoidance and biomass stove replacement.'
    }
  },
  {
    patientId: 'PT-8045',
    fullName: 'Priyanka Gurjar',
    age: 21,
    gender: 'Female',
    villageCluster: 'Jamwa Ramgarh PHC - Ward 2',
    conditionTag: 'Postpartum Day 4 Surveillance',
    revision: 1,
    baseRevision: 1,
    syncStatus: 'SYNCED',
    lastModifiedBy: 'SYSTEM',
    lastModifiedAt: '2026-10-23T07:00:00.000Z',
    data: {
      systolicBP: 114,
      diastolicBP: 74,
      heartRate: 76,
      temperatureC: 37.1,
      spO2: 99,
      hemoglobinGdl: 11.0,
      medicationsIssued: 'Calcium Carbonate 500mg, IFA Blue, Paracetamol 500mg SOS',
      clinicalNotes: 'Normal vaginal delivery Day 4. Lochia rubra moderate. Neonate active, breastfeeding established successfully.'
    }
  }
];

class StorageEngine {
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public async ensureInitialized(forceReset = false): Promise<void> {
    const initialized = localStorage.getItem(`${STORAGE_PREFIX}initialized`);
    if (!initialized || forceReset) {
      // Pre-encrypt payloads for initial storage inspection
      const preparedSeed = await Promise.all(
        SEED_PATIENTS.map(async p => {
          const enc = await encryptClinicalPayload(p.data);
          return {
            ...p,
            encryptedBlobPreview: `${enc.algorithm}::${formatCiphertextDisplay(enc.ciphertextBase64, 32)}::IV:${enc.ivHex.slice(0, 8)}`
          };
        })
      );

      localStorage.setItem(KEY_SERVER_PATIENTS, JSON.stringify(preparedSeed));
      localStorage.setItem(KEY_NODE_A_PATIENTS, JSON.stringify(preparedSeed));
      localStorage.setItem(KEY_NODE_B_PATIENTS, JSON.stringify(preparedSeed));
      localStorage.setItem(KEY_NODE_A_OUTBOX, JSON.stringify([]));
      localStorage.setItem(KEY_NODE_B_OUTBOX, JSON.stringify([]));
      localStorage.setItem(KEY_SYNC_PACKETS, JSON.stringify([]));

      const initialAudit: AuditLogEntry[] = [
        {
          id: 'AUD-001',
          timestamp: new Date().toISOString(),
          nodeId: 'CENTRAL_SERVER',
          role: 'SYSTEM',
          action: 'DATABASE_RESET',
          details: 'Central PHC Cloud and Local Nodes A & B seeded with 5 baseline patient registries.'
        }
      ];
      localStorage.setItem(KEY_AUDIT_LOG, JSON.stringify(initialAudit));
      localStorage.setItem(`${STORAGE_PREFIX}initialized`, 'true');
      this.notify();
    }
  }

  // --- Patients Retrieval & Mutation ---
  public getPatients(nodeId: NodeId | 'CENTRAL_SERVER'): PatientRecord[] {
    const key = 
      nodeId === 'NODE_A' ? KEY_NODE_A_PATIENTS :
      nodeId === 'NODE_B' ? KEY_NODE_B_PATIENTS : KEY_SERVER_PATIENTS;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public setPatients(nodeId: NodeId | 'CENTRAL_SERVER', patients: PatientRecord[]): void {
    const key = 
      nodeId === 'NODE_A' ? KEY_NODE_A_PATIENTS :
      nodeId === 'NODE_B' ? KEY_NODE_B_PATIENTS : KEY_SERVER_PATIENTS;
    localStorage.setItem(key, JSON.stringify(patients));
    this.notify();
  }

  public async updateLocalPatientRecord(
    nodeId: NodeId,
    patientId: string,
    updatedData: Partial<PatientRecord['data']>,
    role: UserRole
  ): Promise<PatientRecord> {
    const patients = this.getPatients(nodeId);
    const index = patients.findIndex(p => p.patientId === patientId);
    if (index === -1) {
      throw new Error(`Patient ${patientId} not found on ${nodeId}`);
    }

    const current = patients[index];
    const mergedData = { ...current.data, ...updatedData };
    const enc = await encryptClinicalPayload(mergedData);

    const updatedRecord: PatientRecord = {
      ...current,
      syncStatus: 'LOCAL',
      lastModifiedBy: nodeId === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      lastModifiedAt: new Date().toISOString(),
      data: mergedData,
      encryptedBlobPreview: `${enc.algorithm}::${formatCiphertextDisplay(enc.ciphertextBase64, 32)}::IV:${enc.ivHex.slice(0, 8)}`
    };

    patients[index] = updatedRecord;
    this.setPatients(nodeId, patients);

    // Enqueue to Outbox
    this.enqueueOutboxMutation({
      mutationId: `MUT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nodeId,
      patientId,
      timestamp: new Date().toISOString(),
      baseRevision: current.baseRevision,
      draftData: mergedData,
      author: nodeId === 'NODE_A' ? 'ASHA_NODE_A' : 'CLINIC_NODE_B',
      role,
      retryCount: 0
    });

    // Mark as PENDING in local UI
    updatedRecord.syncStatus = 'PENDING';
    patients[index] = updatedRecord;
    this.setPatients(nodeId, patients);

    this.logAudit({
      nodeId,
      role,
      action: 'RECORD_UPDATED',
      patientId,
      revision: current.revision,
      details: `Local clinical entry committed. Queued in local outbox against baseRevision v${current.baseRevision}.`
    });

    return updatedRecord;
  }

  // --- Outbox Queue FIFO Management ---
  public getOutbox(nodeId: NodeId): OutboxMutation[] {
    const key = nodeId === 'NODE_A' ? KEY_NODE_A_OUTBOX : KEY_NODE_B_OUTBOX;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public enqueueOutboxMutation(mutation: OutboxMutation): void {
    const outbox = this.getOutbox(mutation.nodeId);
    // Replace existing pending mutation for same patient if already in outbox, else push
    const filtered = outbox.filter(m => m.patientId !== mutation.patientId);
    filtered.push(mutation);
    const key = mutation.nodeId === 'NODE_A' ? KEY_NODE_A_OUTBOX : KEY_NODE_B_OUTBOX;
    localStorage.setItem(key, JSON.stringify(filtered));
    this.notify();
  }

  public removeOutboxMutation(nodeId: NodeId, mutationId: string): void {
    const outbox = this.getOutbox(nodeId);
    const filtered = outbox.filter(m => m.mutationId !== mutationId);
    const key = nodeId === 'NODE_A' ? KEY_NODE_A_OUTBOX : KEY_NODE_B_OUTBOX;
    localStorage.setItem(key, JSON.stringify(filtered));
    this.notify();
  }

  public clearOutbox(nodeId: NodeId): void {
    const key = nodeId === 'NODE_A' ? KEY_NODE_A_OUTBOX : KEY_NODE_B_OUTBOX;
    localStorage.setItem(key, JSON.stringify([]));
    this.notify();
  }

  // --- Audit Log Management ---
  public getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(KEY_AUDIT_LOG);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public logAudit(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newEntry: AuditLogEntry = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toISOString(),
      ...entry
    };
    // Keep most recent 100 log entries
    const updated = [newEntry, ...logs].slice(0, 100);
    localStorage.setItem(KEY_AUDIT_LOG, JSON.stringify(updated));
    this.notify();
  }

  // --- Telemetry Sync Packets ---
  public getSyncPackets(): SyncPacket[] {
    try {
      const data = localStorage.getItem(KEY_SYNC_PACKETS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public logSyncPacket(packet: Omit<SyncPacket, 'packetId' | 'timestamp'>): void {
    const packets = this.getSyncPackets();
    const newPacket: SyncPacket = {
      packetId: `PKT-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toISOString(),
      ...packet
    };
    const updated = [newPacket, ...packets].slice(0, 50);
    localStorage.setItem(KEY_SYNC_PACKETS, JSON.stringify(updated));
    this.notify();
  }

  // Reset entire system to initial baseline
  public async resetAllStores(): Promise<void> {
    await this.ensureInitialized(true);
  }
}

export const storageEngine = new StorageEngine();
