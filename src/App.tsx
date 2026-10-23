import React, { useState, useEffect } from 'react';
import { UserRole } from './types/clinical';
import { storageEngine } from './services/storageEngine';
import { TopTelemetryBar, ActiveTab } from './components/TopTelemetryBar';
import { DualNodeSyncLab } from './components/DualNodeSyncLab';
import { SingleFieldClinicianView } from './components/SingleFieldClinicianView';
import { SecurityVaultView } from './components/SecurityVaultView';
import { PinAuthModal } from './components/PinAuthModal';
import { FooterBanner } from './components/FooterBanner';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('LAB');
  const [currentRole, setCurrentRole] = useState<UserRole>('ASHA_WORKER');
  const [pinTargetRole, setPinTargetRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure storage is initialized with pre-encrypted seeds
    storageEngine.ensureInitialized().then(() => {
      setIsReady(true);
    });
  }, []);

  if (!isReady) {
    return (
      <div className="h-screen w-screen bg-canvas flex items-center justify-center font-mono text-xs text-charcoal">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slateteal animate-ping rounded-full"></div>
          <span>INITIALIZING GRAMSYNC SECURE STORAGE VAULT...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-canvas text-charcoal overflow-hidden font-sans select-none">
      {/* Top Telemetry & Control Bar */}
      <TopTelemetryBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenPinModal={role => setPinTargetRole(role)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {activeTab === 'LAB' && <DualNodeSyncLab userRole={currentRole} />}
        {activeTab === 'SINGLE_FIELD' && <SingleFieldClinicianView userRole={currentRole} />}
        {activeTab === 'SECURITY' && (
          <SecurityVaultView
            currentRole={currentRole}
            onOpenPinModal={role => setPinTargetRole(role)}
          />
        )}
        {activeTab === 'FLOW' && (
          <div className="flex-1 flex flex-col min-h-0 bg-canvas p-2 gap-2 overflow-hidden">
            <div className="bg-paper border border-stonehairline px-3 py-1.5 rounded-sm flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-bold text-charcoal">ARCHIFY v3.2 SYSTEM FLOWCHART TELEMETRY</span>
                <span className="text-mutedink hidden md:inline">| Deterministic Offline-First Clinical Synchronization Pipeline</span>
              </div>
              <a
                href="http://localhost:8080/flow"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-0.5 bg-canvas hover:bg-stone-200 border border-stonehairline text-slateteal font-bold rounded-xs flex items-center gap-1 transition-colors"
                title="Open standalone page at localhost:8080/flow"
              >
                <span>OPEN STANDALONE (localhost:8080/flow)</span>
                <span className="text-xs">↗</span>
              </a>
            </div>
            <div className="flex-1 border border-stonehairline rounded-sm overflow-hidden bg-white shadow-xs">
              <iframe
                src="/flow.html"
                title="GramSync Architecture Flowchart"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}
      </main>

      {/* PIN Authentication Modal */}
      {pinTargetRole && (
        <PinAuthModal
          targetRole={pinTargetRole}
          onSuccess={newRole => {
            setCurrentRole(newRole);
            setPinTargetRole(null);
          }}
          onCancel={() => setPinTargetRole(null)}
        />
      )}

      {/* Non-intrusive Compliance Footer Banner */}
      <FooterBanner />
    </div>
  );
};

export default App;
