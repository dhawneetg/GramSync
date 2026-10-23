---

#### 3. `Design.md` (Anti-AI-Slop Industrial Clinical Aesthetic)
```markdown
# Design System: Field-Grade Clinical Instrument ("Swiss Utility")

## 1. Anti-AI Design Manifesto (STRICT)
This interface MUST look like a real-world ruggedized clinical field terminal (inspired by OpenMRS, Linear's high-density tables, and Teenage Engineering's utilitarian telemetry). 
**NEVER USE:**
- Purple/indigo/pink gradients, neon glowing shadows, or floating decorative 3D blobs.
- Marketing hero sections ("Welcome to the Future of Rural Healthcare!"). Launch directly into the working clinical instrument.
- Rounded-3xl puffy cards with huge empty whitespace and generic startup KPIs.
- Chatbots or conversational AI gimmicks.

## 2. Color Palette (High-Sunlight Readability & Medical Paper)
- **Canvas Background:** Warm Clinical Alabaster `#F6F5F2` (reduces glare in field conditions).
- **Surface / Panel Background:** Crisp Paper `#FFFFFF` with sharp `1px solid #D6D3CD` structural borders.
- **Primary Ink:** Deep Charcoal `#141413` (Body) and `#57534E` (Muted metadata labels).
- **Primary Action Accent:** Clinical Slate Teal `#0F4C5C` (solid, flat, high contrast).
- **Semantic Sync Status Tokens (Solid Pills with 1px Borders & Monospace Labels):**
  - `LOCAL`: Background `#F3F4F6`, Border `#9CA3AF`, Text `#374151` (`● LOCAL ONLY`)
  - `PENDING`: Background `#FEF3C7`, Border `#D97706`, Text `#92400E` (`↻ OUTBOX QUEUED`)
  - `SYNCED`: Background `#DCFCE7`, Border `#15803D`, Text `#14532D` (`✓ VERIFIED v{N}`)
  - `CONFLICT`: Background `#FEE2E2`, Border `#B91C1C`, Text `#7F1D1D` (`! REVISION CONFLICT`)

## 3. Typography & Scannability
- **UI & Clinical Labels:** `Plus Jakarta Sans` or `Inter` — tight tracking, bold section headers (`text-xs uppercase tracking-wider font-semibold text-stone-500`).
- **Vitals, Revisions, Hashes & Timestamps:** `JetBrains Mono` or `IBM Plex Mono` (`font-mono tabular-nums`). All blood pressures, SpO2 values, revision numbers (`REV #04`), and crypto hashes MUST use tabular monospace.

## 4. Layout & Spatial Architecture (Exposed Grid Hairlines)
- **Top Telemetry Ribbon (`h-12`):** Compact industrial bar showing:
  - App ID (`GRAMSYNC // FIELD-SYNC v2.4`)
  - Active View Switcher (`[1] Dual-Node Sync Lab` | `[2] Field Clinician Mode` | `[3] Security & Storage Vault`)
  - Quick Demo Scenario Triggers (`⚡ Trigger Concurrent Conflict Scenario`, `↻ Reset Demo State`)
- **Main Workspace:** Exposed `1px solid #D6D3CD` hairline grid layout (`rounded-sm` max `4px` border radius).
- **3-Way Conflict Resolution Drawer/Modal:**
  - Structured like a clinical Git diff table: rows represent clinical fields (`Systolic BP`, `Hemoglobin`, `Medications Issued`), columns represent `Base (v1)`, `ASHA Field Tablet (Local)`, and `PHC Doctor Desk (Server v2)`.
  - Clicking a cell highlights it with a solid `#0F4C5C` selection border and updates the live **"Merged Output (v3)"** preview column on the right.