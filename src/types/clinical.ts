export type SyncStatus = 'LOCAL' | 'PENDING' | 'SYNCED' | 'CONFLICT';

export type UserRole = 'ASHA_WORKER' | 'MEDICAL_OFFICER';

export type NodeId = 'NODE_A' | 'NODE_B';

export type NetworkMode = 'ONLINE' | 'OFFLINE' | 'FLAKY';

export interface VitalSignPayload {
  systolicBP: number;
  diastolicBP: number;
  heartRate: number;
  temperatureC: number;
  spO2: number;
  hemoglobinGdl: number;
  medicationsIssued: string;
  clinicalNotes: string;
}

export interface ConflictDetails {
  baseData: VitalSignPayload;
  localData: VitalSignPayload;
  remoteData: VitalSignPayload;
  remoteRevision: number;
  remoteAuthor: string;
  remoteTimestamp: string;
}

export interface PatientRecord {
  patientId: string;             // e.g., "PT-8041"
  fullName: string;              // Fictional patient name
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  villageCluster: string;        // e.g., "Bassi PHC - Cluster 3"
  conditionTag: string;          // e.g., "Gestational HTN", "Type-2 DM"
  revision: number;              // Current revision integer
  baseRevision: number;          // Revision this local change branched from
  syncStatus: SyncStatus;
  lastModifiedBy: 'ASHA_NODE_A' | 'CLINIC_NODE_B' | 'SYSTEM';
  lastModifiedAt: string;        // ISO-8601
  data: VitalSignPayload;
  encryptedBlobPreview?: string; // Real WebCrypto AES-GCM base64 ciphertext
  conflictPayload?: ConflictDetails;
}

export interface OutboxMutation {
  mutationId: string;
  nodeId: NodeId;
  patientId: string;
  timestamp: string;
  baseRevision: number;
  draftData: VitalSignPayload;
  author: 'ASHA_NODE_A' | 'CLINIC_NODE_B';
  role: UserRole;
  retryCount: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  nodeId: NodeId | 'CENTRAL_SERVER';
  role: UserRole | 'SYSTEM';
  action: 
    | 'RECORD_CREATED' 
    | 'RECORD_UPDATED' 
    | 'QUEUED_OUTBOX' 
    | 'SYNC_DISPATCHED' 
    | 'SYNC_ACKNOWLEDGED' 
    | 'CONFLICT_DETECTED' 
    | 'CONFLICT_RESOLVED' 
    | 'CRYPTO_ENCRYPT' 
    | 'PIN_UNLOCKED' 
    | 'DATABASE_RESET';
  details: string;
  patientId?: string;
  revision?: number;
}

export interface SyncPacket {
  packetId: string;
  timestamp: string;
  sourceNode: NodeId;
  targetNode: 'CENTRAL_SERVER';
  patientId: string;
  baseRevision: number;
  status: 'PENDING' | 'ACCEPTED_200' | 'CONFLICT_409' | 'DROPPED_OFFLINE';
  latencyMs: number;
  summary: string;
}
