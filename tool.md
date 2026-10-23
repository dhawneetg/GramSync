# GramSync // Technical Tool & Architecture Specification (`tool.md`)
**Track:** JU TECHFEST 2026 | **Problem Statement:** HT-03 (Healthcare Without Internet)  
**System Version:** v2.4.0 (Industrial Clinical Sync Engine)  
**Live Application:** `http://localhost:5173/`  
**Flowchart Telemetry:** `http://localhost:8080/flow` (and `/flow`)

---

## 1. Executive Summary & Objective

**GramSync** is a field-grade, offline-first clinical workflow and synchronization engine engineered specifically for zero-connectivity Primary Health Centres (PHCs) and frontline ASHA health workers in rural clusters. Frontline workers record acute maternal, pediatric, and primary-care vitals on low-cost field tablets in remote geographical zones with zero mobile reception. GramSync provides zero-data-loss local persistence, hardware-accelerated W3C Web Crypto (`AES-GCM` 256-bit) at-rest encryption, an explicit 4-state mutation lifecycle, and a deterministic 3-way clinical Git-diff conflict reconciler that strictly blocks silent overwriting of critical clinical updates.

---

## 2. Technology Stack & Architectural Pillars

| Component | Technology | Rationale |
|---|---|---|
| **Frontend Framework** | React 18 + TypeScript + Vite | Zero-overhead, deterministic rendering with static type safety across clinical payload mutations. |
| **Styling & Design System** | Tailwind CSS (Swiss Utility Clinical Palette) | Warm Alabaster (`#F6F5F2`), Crisp Paper (`#FFFFFF`), `1px solid #D6D3CD` structural hairlines, tabular monospace (`JetBrains Mono`). Zero AI gradient slop. |
| **Local Storage Engine** | Isolated `IndexedDB` / `localStorage` Stores | Isolated sandboxes for `NODE_A` (ASHA tablet), `NODE_B` (Doctor desk), and `CENTRAL_SERVER` (District Cloud). |
| **At-Rest Cryptography** | Native Web Crypto API (`window.crypto.subtle`) | Authenticated `AES-GCM-256` encryption with PBKDF2 100,000-iteration key stretching and unique 96-bit IVs. |
| **Diagram & Flow Engine** | Archify v3.2 Native Workflow Compiler | Standalone compiled SVG/HTML pipeline visualization with interactive lanes, motion, and dark/light modes. |
| **Icons & Telemetry** | Lucide React | Minimal utilitarian medical and systems iconography. |

---

## 3. Repository Directory Structure

```
d:\Code things\Hackathons\JECRC HACKATHON\
├── .agents/skills/archify/      # Native Archify diagram compiler & schemas
├── src/
│   ├── types/
│   │   └── clinical.ts         # PatientRecord, VitalSignPayload, SyncStatus, AuditLog types
│   ├── services/
│   │   ├── cryptoVault.ts      # Web Crypto API AES-GCM 256-bit encryption/decryption vault
│   │   ├── storageEngine.ts    # Multi-node isolated persistence & FIFO Outbox queue
│   │   └── syncCoordinator.ts  # Deterministic baseRevision handshake & 409 conflict engine
│   ├── components/
│   │   ├── TopTelemetryBar.tsx # Ribbon with branding, mode tabs, demo macros, and PIN lock
│   │   ├── DualNodeSyncLab.tsx # Split-bench simulator (Node A, Central Server, Node B)
│   │   ├── SingleFieldClinicianView.tsx # Focused single-tablet clinical care interface
│   │   ├── PatientEditorModal.tsx       # Vitals intake & stock dispensation form
│   │   ├── ConflictResolutionModal.tsx  # 3-Way Clinical Git-diff conflict resolver
│   │   ├── SecurityVaultView.tsx        # Web Crypto ciphertext inspector & RBAC matrix
│   │   ├── PinAuthModal.tsx    # Role authentication modal (ASHA: 1234, MO: 9999)
│   │   └── FooterBanner.tsx    # Permanent clinical prototype compliance safeguard
│   ├── App.tsx                 # Root coordinator with tab routing and modal state
│   ├── main.tsx                # React DOM mount point
│   └── index.css               # Hairline grid utilities & tabular numeral typography
├── public/
│   └── flow.html               # Compiled interactive Archify system workflow
├── flowServer.cjs              # Standalone HTTP service hosting localhost:8080/flow
├── Architecture.md             # Schema definitions and data contracts
├── Design.md                   # Anti-AI Swiss Utility design manifesto
├── PRD.md                      # Problem requirements & rubric alignment
├── Rules.md                    # Engineering & visual execution rules
├── Phases.md                   # Implementation phase roadmap
├── Memory.md                   # Chronological project progress & verification log
└── tool.md                     # Comprehensive tool and system documentation (This file)
```

---

## 4. Core Subsystem Architecture

### 4.1 Cryptographic At-Rest Vault (`cryptoVault.ts`)
- **Algorithm:** Authenticated `AES-GCM` with 256-bit key length.
- **Key Derivation:** W3C `SubtleCrypto.deriveKey()` utilizing `PBKDF2` over SHA-256 with 100,000 iterations against a master device salt.
- **IV Generation:** 96-bit (12-byte) cryptographically secure pseudorandom values per transaction via `window.crypto.getRandomValues()`.
- **Ciphertext Presentation:** Formatted into base64 strings with hex-encoded IV and algorithm metadata tags (`AES-GCM-256::b64...::IV:hex`) for realtime audit inspection in the Security & Storage Vault tab.

### 4.2 Storage Engine & FIFO Outbox (`storageEngine.ts`)
Each virtual endpoint operates on an isolated physical storage partition:
1. `node_a_patients`: Local working copy for ASHA Field Tablet.
2. `node_b_patients`: Local working copy for Primary Health Centre Medical Officer.
3. `central_server_patients`: Canonical authority registry representing the district cloud repository.
4. `node_a_outbox` / `node_b_outbox`: FIFO queue of offline mutations pending network synchronization.
5. `audit_log`: Immutable log tracking every clinical visit, outbox queueing event, sync dispatch, conflict detection, and cryptographic operation.

### 4.3 Deterministic Synchronization Coordinator (`syncCoordinator.ts`)
Synchronization follows an optimistic local-first model with integer revision tracking:
- Every record maintains two revision counters:
  - `revision`: The current version integer of the record.
  - `baseRevision`: The server revision from which the local draft was branched.
- **Network Modes:** Each node features independent connectivity switches (`ONLINE`, `OFFLINE`, `FLAKY 3G`).
- **Handshake Logic:**
  - If node is `OFFLINE`: Edits are committed to local storage, flagged as `PENDING` (`↻ OUTBOX QUEUED`), and held in FIFO queue.
  - When node flips to `ONLINE`: Automatic `drainOutbox()` triggers simulated network flight (350ms standard, 950ms flaky).
  - **Case 1 (Clean Fast-Forward Handshake):** `mutation.baseRevision === serverRecord.revision`  
    - Central server increments `revision = serverRecord.revision + 1`.  
    - Emits `HTTP 200 OK`. Local record updates to `SYNCED` (`✓ VERIFIED v{N}`). Mutation cleared from Outbox.
  - **Case 2 (Concurrent Divergent Edit):** `mutation.baseRevision < serverRecord.revision`  
    - Central server blocks commit with `HTTP 409 Conflict`.  
    - Local record flags `CONFLICT` (`! REVISION CONFLICT`).  
    - Gathers `baseData`, `localData`, and `remoteData` into a structured `conflictPayload` for clinical reconciliation.

---

## 5. 3-Way Clinical Git-Diff Conflict Resolver (`ConflictResolutionModal.tsx`)

When concurrent edits occur on the same patient:
1. **Side-by-Side Differential Matrix:**
   - Rows: Systolic BP, Diastolic BP, Heart Rate, SpO2, Hemoglobin, Temperature, Medications Issued, Clinical Notes.
   - Columns:
     - `Base Commit (v1)`: Common ancestor state.
     - `Local (Node A - ASHA)`: Divergent offline field tablet entry with timestamp.
     - `Remote Server (v2)`: Canonical entry committed by PHC doctor desk with timestamp.
     - `Merged Output (v3)`: Live interactive preview of the final merged commit.
2. **Interactive Selection:** Clicking any cell instantly selects that value into the merged payload with visual `#0F4C5C` teal highlight.
3. **Manual Override:** Clinicians can directly edit values in the merged column if a compromise dosage or vital is warranted.
4. **Mandatory Audit Note:** Compliant with clinical record-keeping standards; the reconciler requires an explanatory clinical justification note before committing `v3` to the canonical registry.

---

## 6. Role-Based Access Control (RBAC) & PIN Gate

| Clinical Operation | ASHA Worker (`PIN: 1234`) | Medical Officer (`PIN: 9999`) |
|---|---|---|
| **Bedside Vitals (BP, HR, SpO2, Temp)** | Full Read/Write | Full Read/Write |
| **Hemoglobin & Blood Glucose Counts** | Full Read/Write | Full Read/Write |
| **Field Kit Stock (IFA/ORS/Paracetamol)** | Authorized Dispensation | Authorized Dispensation |
| **Scheduled Rx Prescription & Narcotics** | Blocked (Requires Referral) | Full Prescriptive Authority |
| **3-Way Conflict Diff Reconciliation** | Permitted with Audit Note | Full Authority with Audit Note |

---

## 7. Flowchart Telemetry & Architecture Diagram (`/flow`)

An interactive workflow diagram was compiled using the **Archify v3.2** native compiler. It details the complete end-to-end lifecycle:
- **Lanes:** Frontline Clinician UI → Local Offline Engine & AES-GCM Vault → Network Transport Adapter → Central PHC Cloud Coordinator → 3-Way Reconciler.
- **Phases:** Local Point-of-Care Intake → Offline Queue & Encryption → Deterministic Revision Handshake → Canonical Commit & Audit Trail.
- **Access Endpoints:**
  - Standalone dedicated port: `http://localhost:8080/flow`
  - Integrated Vite app route: `http://localhost:5173/flow` (or via the Top Telemetry Bar)

---

## 8. Step-by-Step Judge Demonstration Script

To verify all requirements in under 60 seconds:
1. **Launch App:** Open `http://localhost:5173/`.
2. **Observe Multi-Node Simulator:** View Node A (ASHA Tablet) on left, Central Cloud Registry in center, and Node B (PHC Desk) on right.
3. **Trigger Macro:** Click `⚡ STAGE CONFLICT` in the top bar.
   - Node A goes offline, records high BP for Sunita Devi.
   - Node B modifies medications online and commits to server as `v2`.
   - Node A reconnects and syncs; handshake rejects with `HTTP 409 Conflict`.
4. **Resolve Conflict:** Click `RESOLVE CONFLICT` on Node A.
   - View the 3-Way Git Diff table with Base `v1`, Local ASHA, and Remote Server `v2`.
   - Select field values, inspect live `v3` output, and click `COMMIT MERGE AS CANONICAL v3`.
   - Observe both nodes and server synchronize to `✓ VERIFIED v3`.
5. **Inspect Security Vault:** Click tab `[3] Security & Storage Vault` to see live Web Crypto `AES-GCM-256` ciphertext generation, RBAC rules, and the immutable audit log.
6. **Open Flowchart:** Navigate to `http://localhost:8080/flow` to inspect the full architecture workflow.
