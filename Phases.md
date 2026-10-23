# Iterative Implementation Phases

## Phase 1: Foundation, Aesthetic Tokens & Persistent Storage Engine
- Configure Tailwind with clinical paper palette (`#F6F5F2`), monospace tabular font rules, and exposed hairline grid classes.
- Build `src/services/cryptoVault.ts` using `window.crypto.subtle` (AES-GCM 256-bit) to encrypt/decrypt local record payloads and expose raw ciphertext for inspection.
- Build `src/services/storageEngine.ts` managing persistent storage for **Node A (ASHA Field Worker)**, **Node B (PHC Medical Officer)**, and **Central PHC Server**, complete with seed data (5 fictional patients) and Outbox Queue tracking.

## Phase 2: Deterministic Sync Coordinator & 3-Way Conflict Engine
- Build `src/services/syncCoordinator.ts` implementing the `baseRevision` vs `server.revision` handshake.
- Support individual node network toggles (`ONLINE` / `OFFLINE`).
- Implement automatic Outbox drain when a node flips from `OFFLINE` -> `ONLINE`.
- Accurately detect concurrent edits (`baseRevision < server.revision`), flag `CONFLICT`, and store the 3-way payload (`baseData`, `localData`, `remoteData`).

## Phase 3: Utilitarian Clinical Workspace & Dual-Node Sync Lab UI
- Build the Top Telemetry Bar with Role/PIN switcher, View Mode tabs, and a 1-click **"Simulate Live Conflict"** macro button for instant judge demonstrations.
- Build the **Dual-Node Sync Lab** view:
  - Left Column: **Node A (ASHA Field Tablet)** with its own Online/Offline toggle, Outbox badge, and patient editor.
  - Center Spine: **Central PHC Cloud Registry** showing canonical server revisions (`v1`, `v2`, `v3`) and live sync packet logs.
  - Right Column: **Node B (PHC Clinic Terminal)** with its own Online/Offline toggle and patient editor.

## Phase 4: Interactive 3-Way Clinical Conflict Resolver & Security Vault
- Build `src/components/ConflictResolutionModal.tsx`: side-by-side field-level comparison table highlighting exact differing vitals/medications in red/amber, letting the user click to choose Node A or Node B values per field, and committing `server.revision + 1`.
- Build `src/components/SecurityVaultView.tsx`: Role-Based Access Control matrix (`ASHA_WORKER` vs `MEDICAL_OFFICER`), PIN lock simulation, live AES-GCM ciphertext inspector, and immutable audit log table.
- Run `npm run build` and verify zero TypeScript or runtime errors.