import React, { useState, useEffect } from 'react';
import { UserRole } from './types/clinical';
import { storageEngine } from './services/storageEngine';
import { subscribeLanguage } from './services/languageService';
import { TopTelemetryBar, ActiveTab } from './components/TopTelemetryBar';
import { DualNodeSyncLab } from './components/DualNodeSyncLab';
import { SingleFieldClinicianView } from './components/SingleFieldClinicianView';
import { SecurityVaultView } from './components/SecurityVaultView';
import { PinAuthModal } from './components/PinAuthModal';
import { FooterBanner } from './components/FooterBanner';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('GramSync Field Engine Crash Caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-canvas p-6 flex items-center justify-center font-mono">
          <div className="bg-paper border-2 border-red-600 p-6 max-w-lg shadow-xl rounded-sm space-y-4">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
              <span>GRAMSYNC CLINICAL CRASH PROTECTION</span>
            </div>
            <p className="text-xs text-charcoal leading-relaxed">
              An unexpected render exception was caught. Local encrypted IndexedDB records remain fully preserved.
            </p>
            <div className="bg-canvas p-3 border border-stonehairline text-[11px] text-red-950 max-h-32 overflow-auto font-mono">
              {this.state.error?.message || 'Unknown runtime error'}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="px-4 py-1.5 bg-slateteal text-white text-xs font-semibold rounded-sm hover:bg-slateteal-hover cursor-pointer"
              >
                ↺ RELOAD CLINICAL WORKSPACE
              </button>
              <button
                onClick={() => {
                  localStorage.clear();
                  window.location.reload();
                }}
                className="px-3 py-1.5 bg-canvas border border-stonehairline text-xs text-stone-600 hover:text-charcoal rounded-sm cursor-pointer"
              >
                CLEAR LOCAL CACHE
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('SINGLE_FIELD');
  const [currentRole, setCurrentRole] = useState<UserRole>('ASHA_WORKER');
  const [pinTargetRole, setPinTargetRole] = useState<UserRole | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [, setLangTick] = useState<number>(0);

  useEffect(() => {
    // Ensure storage is initialized with pre-encrypted seeds
    storageEngine.ensureInitialized().then(() => {
      setIsReady(true);
    });

    const unsubLang = subscribeLanguage(() => {
      setLangTick((t: number) => t + 1);
    });

    return () => {
      unsubLang();
    };
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
    <div className="min-h-[100dvh] h-[100dvh] w-full flex flex-col bg-canvas text-charcoal overflow-x-hidden font-sans select-none">
      {/* Top Telemetry & Control Bar */}
      <TopTelemetryBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentRole={currentRole}
        setCurrentRole={setCurrentRole}
        onOpenPinModal={role => setPinTargetRole(role)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden">
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
                href="/flow.html"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-0.5 bg-canvas hover:bg-stone-200 border border-stonehairline text-slateteal font-bold rounded-xs flex items-center gap-1 transition-colors"
                title="Open standalone flowchart in new tab"
              >
                <span>OPEN STANDALONE</span>
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

export const App: React.FC = () => (
  <ErrorBoundary>
    <AppContent />
  </ErrorBoundary>
);

export default App;
