# GramSync — Offline-First Field Clinical Sync Engine

**Track:** JU TECHFEST 2026 | **Problem Statement:** HT-03: Healthcare Without Internet  
**Version:** v2.4.0 (Industrial Clinical Sync Instrument)

[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![WebCrypto](https://img.shields.io/badge/Security-AES--GCM--256-0F4C5C)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
[![Archify](https://img.shields.io/badge/Flowchart-Archify_v3.2-15803D)](http://localhost:8080/flow)

---

## 1. Executive Summary

Frontline healthcare workers (ASHA workers and Primary Health Centre clinicians in rural India) operate in intermittent or zero-connectivity zones. **GramSync** is an offline-first clinical workflow engine that stores essential patient visit records locally, encrypts data at rest using the browser's native **Web Crypto API (AES-GCM 256-bit)**, and synchronizes changes deterministically when connectivity returns without ever silently overwriting clinical updates.

---

## 2. Key Capabilities & Rubric Alignment

1. **Full Offline Patient Record CRUD:**
   - Create, search, view, and update patient records while completely disconnected.
   - Real browser storage engine (`IndexedDB` / `localStorage`) ensures all records survive full browser reloads with zero data loss.
2. **Explicit 4-State Sync Lifecycle:**
   - `● LOCAL ONLY` (`LOCAL`): Created or edited offline, stored in client vault.
   - `↻ OUTBOX QUEUED` (`PENDING`): Queued in the local Outbox FIFO awaiting network handshake.
   - `✓ VERIFIED v{N}` (`SYNCED`): Verified match with Central PHC Cloud canonical revision.
   - `! REVISION CONFLICT` (`CONFLICT`): Divergent concurrent edits detected between two endpoints on the same base revision (`HTTP 409 Conflict`).
3. **Interactive Split-Bench Multi-Node Simulator:**
   - **Node A (ASHA Field Tablet):** Offline vitals intake, outbox badge, and network adapter switch (`ONLINE` / `OFFLINE` / `FLAKY 3G`).
   - **Central PHC Cloud Registry:** Canonical server revision history and live sync handshake packet telemetry (`HTTP 200` / `HTTP 409`).
   - **Node B (PHC Clinic Desk):** Primary medical officer workstation with prescription and triage capabilities.
4. **Field-Level 3-Way Conflict Resolution Engine:**
   - When concurrent edits branch from the same base revision, silent overwrites are blocked.
   - Interactive Git-style diff table comparing `Base Commit (v1)`, `Local (Node A - ASHA)`, and `Remote Server (Node B - Doctor v2)`.
   - Field-by-field interactive picker with mandatory ISO-13606 clinical justification note before committing `v3`.
5. **Hardware-Accelerated Security & RBAC Inspector:**
   - Web Crypto API (`AES-GCM-256`) with PBKDF2 100,000-iteration key derivation and 96-bit random IVs.
   - Role-Based Access Control matrix (`ASHA_WORKER` vs `MEDICAL_OFFICER`) with PIN authentication (`1234` for ASHA, `9999` for Doctor).
   - Tamper-evident immutable local audit trail.
6. **Archify v3.2 Native Architecture Flowchart:**
   - Full interactive system pipeline visualization hosted at `http://localhost:8080/flow` and embedded within the app.

---

## 3. Quick Start & Local Execution

### Prerequisites
- Node.js `>= 18.0.0`
- npm `>= 9.0.0`

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Development Server
```bash
npm run dev
```
Open **`http://localhost:5173/`** in your browser.

### 3. (Optional) Start Standalone Archify Flowchart Server
```bash
npm run flow
```
Open **`http://localhost:8080/flow`** in your browser.

---

## 4. 60-Second Judge Demonstration Guide

1. Open `http://localhost:5173/`.
2. Notice the 3-column **Dual-Node Sync Lab** (Node A, Central Registry, Node B).
3. Click the **`⚡ STAGE CONFLICT`** macro in the top bar:
   - Node A goes offline and records acute gestational HTN (BP 160/102) for Sunita Devi.
   - Node B modifies medications online and commits to server as `v2`.
   - Node A reconnects and attempts to sync; handshake blocks silent overwrite with `HTTP 409 Conflict`.
4. Click **`RESOLVE CONFLICT`** on Node A:
   - Review side-by-side values (`Base v1` vs `Local ASHA` vs `Server Doctor v2`).
   - Click cells to pick merged values, enter an audit note, and click **`COMMIT MERGE AS CANONICAL v3`**.
   - Both endpoints immediately synchronize to `✓ VERIFIED v3`.
5. Click **`[3] Security & Storage Vault`** to inspect the live `AES-GCM-256` raw ciphertext, IV, and immutable audit log.
6. Click **`[4] Flowchart Telemetry`** to inspect the interactive Archify architecture workflow.

---

## 5. Architectural Design Principles ("Anti-AI Swiss Utility")

- **Palette:** High-sunlight readable Warm Clinical Alabaster (`#F6F5F2`), Crisp Paper panels (`#FFFFFF`), exposed `1px solid #D6D3CD` hairlines, and Clinical Slate Teal (`#0F4C5C`).
- **Typography:** `Plus Jakarta Sans` for clinical headers, and `JetBrains Mono` (`tabular-nums`) for all physiological vitals, monotonic revisions, and crypto hashes.
- **Strictly No Slop:** No decorative purple/pink gradients, no floating 3D blobs, no generic marketing hero landing pages, and no conversational chatbot gimmicks.

---

## 6. Safeguards & Compliance Notice

> **COMPLIANCE NOTICE:** Clinical Decision & Sync Support Prototype — Not Production Medical-Record Compliant. All patient profiles and clinical records are strictly synthetic/fictional test data.

---

## 7. License

MIT License. Designed and engineered for **JU TECHFEST 2026 (Problem Statement HT-03)**.
