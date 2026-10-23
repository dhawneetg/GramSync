# PRD: GramSync — Offline-First Field Clinical Sync Engine
**Track:** JU TECHFEST 2026 | HT-03: Healthcare Without Internet

## 1. Problem & Core Objective
Frontline healthcare workers (ASHA workers and Primary Health Centre clinicians) operate in intermittent or zero-connectivity zones. GramSync is an offline-first clinical workflow engine that stores essential patient visit records locally, encrypts data at rest on the device, and synchronizes changes deterministically when connectivity returns without ever silently overwriting clinical updates.

## 2. Core Functional Requirements (Rubric-Aligned)
1. **Offline Patient Record CRUD:**
   - Create, view, and update limited fictional patient records while completely offline.
   - Persist all states in browser `IndexedDB` (`gramsync_vault`) so page reloads while offline lose zero data.
2. **Explicit 4-State Sync Lifecycle:**
   - Every record and field mutation must visibly display one of four deterministic states:
     - `LOCAL`: Created/edited offline, stored locally.
     - `PENDING`: Queued in the local Outbox awaiting network handshake.
     - `SYNCED`: Verified match with Central PHC Cloud Revision.
     - `CONFLICT`: Divergent concurrent edits detected between two endpoints on the same base revision.
3. **Interactive Split-Bench Multi-Node Simulator (For Live Judging):**
   - Provide a toggleable view switching between **Single-Clinician Field Mode** and **Dual-Node Sync Lab (Node A: ASHA Tablet | Central Cloud Registry | Node B: PHC Clinic Desk)**.
   - Independent network switches (`ONLINE` / `OFFLINE` / `FLAKY 3G`) per node so judges can watch conflicts happen and resolve in real time on one projector screen.
4. **Field-Level 3-Way Conflict Resolution UI:**
   - When Node A and Node B edit the same patient record offline from the same `baseRevision`, reconnecting triggers an `HTTP 409 Conflict` state.
   - Present a side-by-side clinical diff viewer showing: `Base Value`, `Node A Entry (with timestamp & author)`, and `Node B Entry (with timestamp & author)`.
   - Allow field-by-field selection and require a mandatory clinical resolution note before committing the merged revision.
5. **Device Storage Security & RBAC Inspector:**
   - Role switcher (`ASHA_WORKER` vs `MEDICAL_OFFICER`) with PIN lock (`1234` / `9999`) enforcing field-level write permissions.
   - Web Crypto API (`AES-GCM` 256-bit) encryption toggle showing raw encrypted ciphertext stored in local storage alongside an immutable local Audit Log.

## 3. Strict Boundaries & Safeguards
- All patient data must be explicitly labeled **FICTIONAL / SYNTHETIC TEST DATA**.
- Display a permanent non-intrusive footer banner: *"Clinical Decision & Sync Support Prototype — Not Production Medical-Record Compliant."*