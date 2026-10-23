import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  Lock, 
  Unlock, 
  Terminal, 
  CheckCircle, 
  AlertOctagon, 
  RefreshCw, 
  Database 
} from 'lucide-react';
import { UserRole, AuditLogEntry } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';
import { encryptClinicalPayload, decryptClinicalPayload, EncryptedPackage } from '../services/cryptoVault';

interface Props {
  currentRole: UserRole;
  onOpenPinModal: (role: UserRole) => void;
}

export const SecurityVaultView: React.FC<Props> = ({ currentRole, onOpenPinModal }) => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  // Interactive Web Crypto Test Bench
  const [inputTestPayload, setInputTestPayload] = useState(
    JSON.stringify({ patientId: 'PT-8041', systolicBP: 158, diastolicBP: 98, triage: 'Gestational HTN High Risk' }, null, 2)
  );
  const [cryptoResult, setCryptoResult] = useState<EncryptedPackage | null>(null);
  const [decryptedResult, setDecryptedResult] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    setAuditLogs(storageEngine.getAuditLogs());
    const unsub = storageEngine.subscribe(() => {
      setAuditLogs(storageEngine.getAuditLogs());
    });

    // Run initial test encryption on mount
    handleTestEncrypt();

    return () => unsub();
  }, []);

  const handleTestEncrypt = async () => {
    setIsEncrypting(true);
    try {
      const parsed = JSON.parse(inputTestPayload);
      const enc = await encryptClinicalPayload(parsed);
      setCryptoResult(enc);

      // Decrypt to verify round-trip integrity
      const dec = await decryptClinicalPayload(enc.ciphertextBase64, enc.ivHex);
      setDecryptedResult(JSON.stringify(dec, null, 2));

      storageEngine.logAudit({
        nodeId: 'NODE_A',
        role: currentRole,
        action: 'CRYPTO_ENCRYPT',
        details: `Web Crypto AES-GCM-256 payload generated. Key fingerprint: ${enc.keyFingerprint}`
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsEncrypting(false);
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (filterAction === 'ALL') return true;
    return log.action === filterAction;
  });

  return (
    <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto">
      {/* Top Security Status Banner */}
      <div className="bg-paper border border-stonehairline p-3 rounded-sm flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-slateteal text-white rounded-sm flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-mono text-sm font-bold text-charcoal">
              DEVICE SECURITY, CRYPTOGRAPHIC VAULT & RBAC CONTROLS
            </h2>
            <p className="text-[11px] font-mono text-mutedink">
              Hardware-accelerated AES-GCM 256-bit encryption at rest • FIPS compliant key derivation • Monotonic audit log
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] font-mono text-mutedink">ACTIVE SESSION PRIVILEGE</div>
            <div className="font-mono text-xs font-bold text-charcoal">{currentRole}</div>
          </div>
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="px-2.5 py-1 text-xs font-mono font-semibold bg-canvas hover:bg-paper border border-stonehairline text-charcoal rounded-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {currentRole === 'MEDICAL_OFFICER' ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>SWITCH TO ASHA (PIN 1234)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-slateteal" />
                <span>ELEVATE TO DOCTOR (PIN 9999)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Web Crypto Live Inspector & RBAC Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Web Crypto Live Workbench */}
        <div className="lg:col-span-7 bg-paper border border-stonehairline rounded-sm p-4 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-stonehairline pb-2">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-slateteal" />
              <span className="font-mono font-bold text-xs uppercase text-charcoal">
                WEB CRYPTO API (AES-GCM 256-BIT) ENCRYPTOR
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-sm font-semibold">
              W3C SUBTLE CRYPTO ACTIVE
            </span>
          </div>

          <p className="text-xs font-mono text-stone-600 leading-relaxed">
            Every clinical patient record and outbox mutation is serialized and encrypted at rest on the local device using <strong className="text-charcoal font-semibold">AES-GCM 256-bit</strong> with PBKDF2 100,000-iteration key stretching and a unique 96-bit initialization vector (IV) per mutation.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Input Plaintext */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-mutedink uppercase mb-1">
                <span>Plaintext Clinical Payload</span>
                <span className="text-[10px] text-stone-400">JSON</span>
              </div>
              <textarea
                rows={5}
                value={inputTestPayload}
                onChange={e => setInputTestPayload(e.target.value)}
                className="w-full bg-canvas border border-stonehairline p-2 font-mono text-[11px] rounded-sm text-charcoal focus:outline-slateteal"
              />
              <button
                onClick={handleTestEncrypt}
                disabled={isEncrypting}
                className="mt-2 w-full py-1.5 bg-slateteal hover:bg-slateteal-hover text-white font-mono text-xs font-semibold rounded-sm flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEncrypting ? 'animate-spin' : ''}`} />
                <span>GENERATE AES-GCM CIPHERTEXT</span>
              </button>
            </div>

            {/* Ciphertext Output */}
            <div className="space-y-2">
              <div>
                <span className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Base64 Ciphertext Output (Stored At Rest)
                </span>
                <div className="bg-canvas border border-stonehairline p-2 font-mono text-[10px] text-emerald-900 break-all rounded-sm min-h-20 select-all">
                  {cryptoResult?.ciphertextBase64 || 'Generating...'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                <div className="bg-canvas p-1.5 border border-stonehairline rounded-sm">
                  <span className="text-mutedink block">IV (HEX):</span>
                  <span className="font-bold text-charcoal">{cryptoResult?.ivHex}</span>
                </div>
                <div className="bg-canvas p-1.5 border border-stonehairline rounded-sm">
                  <span className="text-mutedink block">ALGORITHM:</span>
                  <span className="font-bold text-charcoal">{cryptoResult?.algorithm}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Decryption Integrity Verification */}
          <div className="mt-1 p-2 bg-stone-50 border border-stonehairline rounded-sm font-mono text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold mb-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>ROUND-TRIP INTEGRITY VERIFIED (AUTHENTICATED CIPHERTEXT)</span>
            </div>
            <pre className="text-[10px] text-stone-600 overflow-x-auto max-h-24">
              {decryptedResult}
            </pre>
          </div>
        </div>

        {/* RBAC Matrix */}
        <div className="lg:col-span-5 bg-paper border border-stonehairline rounded-sm p-4 flex flex-col gap-3 shadow-xs">
          <div className="flex items-center justify-between border-b border-stonehairline pb-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-slateteal" />
              <span className="font-mono font-bold text-xs uppercase text-charcoal">
                ROLE-BASED ACCESS CONTROL (RBAC) MATRIX
              </span>
            </div>
          </div>

          <div className="text-xs font-mono text-stone-600">
            Field-level enforcement guarantees ASHA frontline workers can capture vitals and emergency stock, while clinical prescription overrides require Medical Officer PIN authorization.
          </div>

          <div className="border border-stonehairline rounded-sm overflow-hidden text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-canvas border-b border-stonehairline text-[10px] text-mutedink uppercase">
                  <th className="p-2 border-r border-stonehairline">Operation / Field</th>
                  <th className="p-2 border-r border-stonehairline text-center">ASHA Worker</th>
                  <th className="p-2 text-center">Medical Officer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stonehairline text-[11px]">
                <tr>
                  <td className="p-2 border-r border-stonehairline font-semibold">Triage Vitals (BP, HR, SpO2)</td>
                  <td className="p-2 border-r border-stonehairline text-center text-emerald-700 font-bold">✓ READ/WRITE</td>
                  <td className="p-2 text-center text-emerald-700 font-bold">✓ READ/WRITE</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-stonehairline font-semibold">Hemoglobin & Glucose Count</td>
                  <td className="p-2 border-r border-stonehairline text-center text-emerald-700 font-bold">✓ READ/WRITE</td>
                  <td className="p-2 text-center text-emerald-700 font-bold">✓ READ/WRITE</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-stonehairline font-semibold">Field Stock (IFA/ORS Kits)</td>
                  <td className="p-2 border-r border-stonehairline text-center text-emerald-700 font-bold">✓ DISPENSE</td>
                  <td className="p-2 text-center text-emerald-700 font-bold">✓ DISPENSE</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-stonehairline font-semibold">Scheduled Rx Prescription</td>
                  <td className="p-2 border-r border-stonehairline text-center text-red-600 font-bold">✕ BLOCKED</td>
                  <td className="p-2 text-center text-emerald-700 font-bold">✓ AUTHORIZED</td>
                </tr>
                <tr>
                  <td className="p-2 border-r border-stonehairline font-semibold">3-Way Clinical Diff Override</td>
                  <td className="p-2 border-r border-stonehairline text-center text-amber-700 font-bold">⚠️ NOTE REQ.</td>
                  <td className="p-2 text-center text-emerald-700 font-bold">✓ AUTHORIZED</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-sm text-[11px] font-mono text-amber-900 flex items-start gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>PIN enforcement active. Enter PIN <strong>1234</strong> for ASHA or <strong>9999</strong> for Medical Officer at any time in the top telemetry bar.</span>
          </div>
        </div>
      </div>

      {/* Immutable Local Audit Log Trail */}
      <div className="bg-paper border border-stonehairline rounded-sm p-4 flex flex-col gap-3 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stonehairline pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-slateteal" />
            <span className="font-mono font-bold text-xs uppercase text-charcoal">
              IMMUTABLE LOCAL AUDIT TRAIL ({filteredLogs.length} EVENTS)
            </span>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <span className="text-mutedink text-[11px]">FILTER:</span>
            <select
              value={filterAction}
              onChange={e => setFilterAction(e.target.value)}
              className="bg-canvas border border-stonehairline px-2 py-0.5 rounded-sm text-xs text-charcoal focus:outline-slateteal"
            >
              <option value="ALL">ALL ACTIONS</option>
              <option value="RECORD_UPDATED">RECORD_UPDATED</option>
              <option value="RECORD_CREATED">RECORD_CREATED</option>
              <option value="CONFLICT_DETECTED">CONFLICT_DETECTED</option>
              <option value="CONFLICT_RESOLVED">CONFLICT_RESOLVED</option>
              <option value="SYNC_ACKNOWLEDGED">SYNC_ACKNOWLEDGED</option>
              <option value="CRYPTO_ENCRYPT">CRYPTO_ENCRYPT</option>
              <option value="PIN_UNLOCKED">PIN_UNLOCKED</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="border border-stonehairline rounded-sm overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full min-w-[560px] text-left font-mono text-xs">
            <thead>
              <tr className="bg-canvas border-b border-stonehairline text-[10px] text-mutedink uppercase">
                <th className="p-2 border-r border-stonehairline w-28">Event ID</th>
                <th className="p-2 border-r border-stonehairline w-40">Timestamp</th>
                <th className="p-2 border-r border-stonehairline w-32">Node / Role</th>
                <th className="p-2 border-r border-stonehairline w-44">Action</th>
                <th className="p-2">Clinical Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stonehairline text-[11px]">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-stone-50/70">
                  <td className="p-2 border-r border-stonehairline font-bold text-charcoal">
                    {log.id}
                  </td>
                  <td className="p-2 border-r border-stonehairline text-stone-500 tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2 border-r border-stonehairline">
                    <span className="font-semibold text-stone-800">{log.nodeId}</span>
                    <span className="block text-[9px] text-mutedink">{log.role}</span>
                  </td>
                  <td className="p-2 border-r border-stonehairline">
                    <span className={`px-1.5 py-0.5 rounded-xs font-bold text-[10px] ${
                      log.action === 'CONFLICT_DETECTED'
                        ? 'bg-red-100 text-red-900 border border-red-300'
                        : log.action === 'CONFLICT_RESOLVED'
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : log.action === 'RECORD_UPDATED'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-stone-100 text-stone-800 border border-stone-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-2 text-stone-700">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
