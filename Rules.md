# Engineering & Execution Rules for Antigravity Agent

1. **Read First, Update Memory Always:**
   - Before writing code in any phase, read `PRD.md`, `Architecture.md`, `Design.md`, and `Memory.md`.
   - After completing any phase, immediately update `Memory.md` with completed tasks, files created, and verification status.
2. **Zero External API Dependency for Core Demo:**
   - Do not require external cloud keys that could fail during judging. All IndexedDB persistence, AES-GCM Web Crypto encryption, and Central Server Revision Coordination must run deterministically locally.
3. **Real Persistence & Real Crypto:**
   - Do not fake persistence with React `useState` alone. Every patient edit, outbox queue item, and central server state must persist across browser refreshes (`IndexedDB` / `localStorage`).
   - Use the browser's native `window.crypto.subtle` (`AES-GCM`) to generate real encrypted ciphertext previews for the Device Security Inspector.
4. **Strict Visual Discipline:**
   - Follow `Design.md` strictly. No rounded-2xl cards, no gradients, no marketing splash pages. Use dense, utilitarian tables, `1px` stone borders, and monospace telemetry numbers.
5. **Pre-Loaded Realistic Clinical Test Cases:**
   - Seed the database on first load with 5 realistic fictional rural maternal/primary-care records (e.g., *Sunita Devi, 26y, Gestational Hypertension watch*; *Rameshwar Meena, 58y, Type-2 Diabetes follow-up*) plus a 1-click **"Simulate Conflict Scenario"** button for judges.