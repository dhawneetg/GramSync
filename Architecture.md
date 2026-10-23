# System Architecture: GramSync

## 1. Tech Stack (Zero-Flake 24-Hour Build)
- **Frontend Framework:** React 18 + TypeScript + Vite + Tailwind CSS + Lucide React (minimal, functional iconography only).
- **Local Storage Engine:** Native `IndexedDB` wrapper (or `idb` / `Dexie`) managing three isolated object stores per virtual node (`node_a`, `node_b`):
  - `patients`: Local working state of patient records.
  - `outbox_queue`: Ordered FIFO mutation log of offline edits.
  - `audit_log`: Immutable local security and sync event trail.
- **Central Sync Server (Simulated + Express API Ready):**
  - Deterministic state coordinator (runs via local Express API or in-browser Service Coordinator with realistic network latency simulation of 350ms) backed by persistent storage so the live demo cannot fail if venue Wi-Fi drops.

## 2. Data Schema (`PatientRecord`)
```typescript
export type SyncStatus = 'LOCAL' | 'PENDING' | 'SYNCED' | 'CONFLICT';

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

export interface PatientRecord {
  patientId: string;           // e.g., "PT-8041"
  fullName: string;            // Fictional patient name
  age: number;
  villageCluster: string;      // e.g., "Bassi PHC - Sector 4"
  revision: number;            // Monotonically increasing integer (1, 2, 3...)
  baseRevision: number;        // The server revision this local edit branched from
  syncStatus: SyncStatus;
  lastModifiedBy: 'ASHA_NODE_A' | 'CLINIC_NODE_B' | 'SYSTEM';
  lastModifiedAt: string;      // ISO-8601
  data: VitalSignPayload;
  encryptedBlobPreview?: string; // Base64 AES-GCM ciphertext preview for security inspector
  conflictPayload?: {
    baseData: VitalSignPayload;
    localData: VitalSignPayload;
    remoteData: VitalSignPayload;
    remoteRevision: number;
    remoteAuthor: string;
    remoteTimestamp: string;
  };
}