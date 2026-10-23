import { 
  PatientRecord, 
  OutboxMutation, 
  AuditLogEntry, 
  NodeId, 
  UserRole,
  SyncPacket,
  LabInvestigation,
  StructuredPrescription
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
    abhaId: '91-8041-3312-8801',
    phone: '+91 98291 44102',
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
    },
    labReports: [
      {
        id: 'LAB-901',
        testName: 'Urine Albumin / Protein Rapid Strip',
        testDate: '2026-10-22T09:30:00.000Z',
        performedAt: 'Bassi Community Health Centre Lab',
        resultValue: 'Trace (+1)',
        normalRange: 'Negative (Nil)',
        status: 'ELEVATED',
        doctorRemarks: 'Mild proteinuria in pregnancy. Preeclampsia monitoring initiated.'
      },
      {
        id: 'LAB-902',
        testName: 'Obstetric Fetal Doppler Sonogram',
        testDate: '2026-10-21T11:15:00.000Z',
        performedAt: 'District Mother & Child Wing (MCH)',
        resultValue: '144 BPM Regular',
        normalRange: '120 - 160 BPM',
        status: 'NORMAL',
        doctorRemarks: 'Adequate fetal heart sounds, no deceleration noted.'
      },
      {
        id: 'LAB-903',
        testName: 'Complete Blood Count (CBC Hemoglobin)',
        testDate: '2026-10-20T08:45:00.000Z',
        performedAt: 'Bassi PHC Diagnostic Centre',
        resultValue: '10.2 g/dL',
        normalRange: '11.0 - 14.5 g/dL',
        status: 'ELEVATED',
        doctorRemarks: 'Mild gestational nutritional anemia. Continue IFA supplement.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-101',
        medicineName: 'Labetalol 100mg Tablet',
        dosage: '1 Tab',
        frequency: 'Morning & Night (सुबह - रात)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 14,
        issuedBy: 'Dr. R. K. Sharma (Medical Officer)',
        issuedDate: '2026-10-22'
      },
      {
        id: 'RX-102',
        medicineName: 'IFA Red Tablet (Iron & Folic Acid)',
        dosage: '1 Tab',
        frequency: 'Afternoon (दोपहर)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 30,
        issuedBy: 'Dr. R. K. Sharma (Medical Officer)',
        issuedDate: '2026-10-22'
      },
      {
        id: 'RX-103',
        medicineName: 'Calcium Carbonate 500mg + Vit D3',
        dosage: '1 Tab',
        frequency: 'Morning (सुबह)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 30,
        issuedBy: 'Dr. R. K. Sharma (Medical Officer)',
        issuedDate: '2026-10-22'
      }
    ]
  },
  {
    patientId: 'PT-8042',
    abhaId: '91-8042-7721-9943',
    phone: '+91 94140 88219',
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
    },
    labReports: [
      {
        id: 'LAB-904',
        testName: 'Fasting Capillary Blood Glucose (Glucometer)',
        testDate: '2026-10-23T06:30:00.000Z',
        performedAt: 'Sanganer Subcentre Point-of-Care Lab',
        resultValue: '168 mg/dL',
        normalRange: '70 - 100 mg/dL',
        status: 'CRITICAL',
        doctorRemarks: 'Fasting hyperglycemia. Advised carb restriction and dosage titration.'
      },
      {
        id: 'LAB-905',
        testName: 'Glycated Hemoglobin (HbA1c)',
        testDate: '2026-10-18T10:00:00.000Z',
        performedAt: 'District Hospital Jaipur Central Lab',
        resultValue: '8.4 %',
        normalRange: '< 6.5 %',
        status: 'CRITICAL',
        doctorRemarks: 'Suboptimal 3-month glycemic control. Renal panel recommended.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-104',
        medicineName: 'Metformin 500mg SR',
        dosage: '1 Tab',
        frequency: 'Morning & Night (सुबह - रात)',
        timing: 'BEFORE_FOOD',
        daysPrescribed: 30,
        issuedBy: 'Dr. Ananya Sen (Physician)',
        issuedDate: '2026-10-18'
      },
      {
        id: 'RX-105',
        medicineName: 'Pregabalin 75mg Capsule',
        dosage: '1 Cap',
        frequency: 'Night Bedtime (रात)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 15,
        issuedBy: 'Dr. Ananya Sen (Physician)',
        issuedDate: '2026-10-18'
      }
    ]
  },
  {
    patientId: 'PT-8043',
    abhaId: '91-8043-4419-2204',
    phone: '+91 97852 11048',
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
    },
    labReports: [
      {
        id: 'LAB-906',
        testName: 'Hemocue Photometric Hemoglobin Test',
        testDate: '2026-10-23T07:15:00.000Z',
        performedAt: 'Chaksu ASHA Domiciliary Camp',
        resultValue: '7.4 g/dL',
        normalRange: '12.0 - 15.0 g/dL',
        status: 'CRITICAL',
        doctorRemarks: 'Severe microcytic anemia. High risk for cardiac deconditioning.'
      },
      {
        id: 'LAB-907',
        testName: 'Serum Ferritin Assay',
        testDate: '2026-10-19T09:00:00.000Z',
        performedAt: 'Jaipur Rural District Lab',
        resultValue: '6.2 ng/mL',
        normalRange: '15.0 - 150.0 ng/mL',
        status: 'CRITICAL',
        doctorRemarks: 'Exhausted iron marrow stores. Urgent parenteral iron required.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-106',
        medicineName: 'IV Ferric Carboxymaltose 500mg in 100ml NS',
        dosage: '1 Infusion',
        frequency: 'Hospital Day Care (एक बार)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 1,
        issuedBy: 'Dr. R. K. Sharma (Medical Officer)',
        issuedDate: '2026-10-23'
      },
      {
        id: 'RX-107',
        medicineName: 'Albendazole 400mg Chewable',
        dosage: '1 Tab',
        frequency: 'Stat Night (रात को एक बार)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 1,
        issuedBy: 'Dr. R. K. Sharma (Medical Officer)',
        issuedDate: '2026-10-23'
      }
    ]
  },
  {
    patientId: 'PT-8044',
    abhaId: '91-8044-1109-7756',
    phone: '+91 99281 77312',
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
    },
    labReports: [
      {
        id: 'LAB-908',
        testName: 'Peak Expiratory Flow Rate (PEFR)',
        testDate: '2026-10-21T10:30:00.000Z',
        performedAt: 'Amer Health & Wellness Subcentre',
        resultValue: '280 L/min',
        normalRange: '450 - 600 L/min',
        status: 'ELEVATED',
        doctorRemarks: 'Moderate obstructive airway pattern. Inhaler technique demonstrated.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-108',
        medicineName: 'Amlodipine 5mg Tablet',
        dosage: '1 Tab',
        frequency: 'Morning (सुबह)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 30,
        issuedBy: 'Dr. Vivek Mehra (Medical Officer)',
        issuedDate: '2026-10-21'
      },
      {
        id: 'RX-109',
        medicineName: 'Salbutamol Inhaler 100mcg',
        dosage: '2 Puffs',
        frequency: 'As needed for breathlessness (जरूरत पड़ने पर)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 30,
        issuedBy: 'Dr. Vivek Mehra (Medical Officer)',
        issuedDate: '2026-10-21'
      }
    ]
  },
  {
    patientId: 'PT-8045',
    abhaId: '91-8045-8832-5509',
    phone: '+91 96024 33811',
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
    },
    labReports: [
      {
        id: 'LAB-910',
        testName: 'Postnatal Capillary Hemoglobin Check',
        testDate: '2026-10-23T07:00:00.000Z',
        performedAt: 'Jamwa Ramgarh Maternity Subcentre',
        resultValue: '11.0 g/dL',
        normalRange: '11.0 - 14.0 g/dL',
        status: 'NORMAL',
        doctorRemarks: 'Satisfactory postnatal recovery. Continue maternal nutrition.'
      }
    ],
    prescriptions: [
      {
        id: 'RX-110',
        medicineName: 'Calcium Carbonate 500mg + D3',
        dosage: '1 Tab',
        frequency: 'Morning & Night (सुबह - रात)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 60,
        issuedBy: 'Dr. Sunita Bansal (Gynaecologist)',
        issuedDate: '2026-10-20'
      },
      {
        id: 'RX-111',
        medicineName: 'IFA Tablet (Maternal Support)',
        dosage: '1 Tab',
        frequency: 'Afternoon (दोपहर)',
        timing: 'AFTER_FOOD',
        daysPrescribed: 100,
        issuedBy: 'Dr. Sunita Bansal (Gynaecologist)',
        issuedDate: '2026-10-20'
      }
    ]
  }
];

class StorageEngine {
  private listeners: Set<() => void> = new Set();
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    this.ensureInitialized();

    // Enable cross-tab & cross-window live synchronization with ZERO internet
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('gramsync_sync_channel');
        this.broadcastChannel.onmessage = () => {
          this.notify(false);
        };
      } catch (err) {
        console.warn('BroadcastChannel not available, falling back to storage events');
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key && e.key.startsWith(STORAGE_PREFIX)) {
          this.notify(false);
        }
      });
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(broadcast = true) {
    this.listeners.forEach(fn => fn());
    if (broadcast && this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ timestamp: Date.now() });
      } catch (e) {
        // Ignore channel post errors
      }
    }
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
      const parsed: PatientRecord[] = data ? JSON.parse(data) : [];
      if (parsed.length === 0) {
        return SEED_PATIENTS;
      }
      return parsed.map(p => {
        const seed = SEED_PATIENTS.find(s => s.patientId === p.patientId);
        const fallbackLabs: LabInvestigation[] = [
          {
            id: `LAB-${p.patientId}-1`,
            testName: 'Complete Blood Count - Hemoglobin (Hb)',
            testDate: new Date().toISOString(),
            performedAt: 'PHC Central Pathology Lab',
            resultValue: `${p.data.hemoglobinGdl} g/dL`,
            normalRange: '12.0 - 15.0 g/dL',
            status: p.data.hemoglobinGdl < 11 ? 'CRITICAL' : p.data.hemoglobinGdl < 12 ? 'ELEVATED' : 'NORMAL',
            doctorRemarks: 'Field screening verified via Hemocue digital photometer.'
          }
        ];

        const fallbackRxs: StructuredPrescription[] = [
          {
            id: `RX-${p.patientId}-1`,
            medicineName: p.data.medicationsIssued.split(',')[0] || 'Paracetamol 500mg',
            dosage: '1 Tab',
            frequency: '1-0-1 (सुबह - रात)',
            timing: 'AFTER_FOOD',
            daysPrescribed: 14,
            issuedBy: 'Dr. S. K. Sharma (Medical Officer, PHC)',
            issuedDate: new Date().toISOString().split('T')[0]
          }
        ];

        return {
          ...p,
          abhaId: p.abhaId || seed?.abhaId || `91-${p.patientId}-8801`,
          phone: p.phone || seed?.phone || '+91 98290 XXXXX',
          labReports: (p.labReports && p.labReports.length > 0) 
            ? p.labReports 
            : (seed?.labReports && seed.labReports.length > 0 ? seed.labReports : fallbackLabs),
          prescriptions: (p.prescriptions && p.prescriptions.length > 0) 
            ? p.prescriptions 
            : (seed?.prescriptions && seed.prescriptions.length > 0 ? seed.prescriptions : fallbackRxs)
        };
      });
    } catch {
      return SEED_PATIENTS;
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
