import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Split, 
  UserCheck, 
  ShieldCheck, 
  Zap, 
  RotateCcw, 
  Lock, 
  Unlock,
  GitBranch,
  Languages
} from 'lucide-react';
import { UserRole } from '../types/clinical';
import { syncCoordinator } from '../services/syncCoordinator';
import { storageEngine } from '../services/storageEngine';
import { getLanguage, setLanguage, subscribeLanguage, t, SupportedLang } from '../services/languageService';

export type ActiveTab = 'LAB' | 'SINGLE_FIELD' | 'SECURITY' | 'FLOW';

interface Props {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  onOpenPinModal: (targetRole: UserRole) => void;
}

export const TopTelemetryBar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  currentRole,
  onOpenPinModal
}) => {
  const [isStaging, setIsStaging] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lang, setLang] = useState<SupportedLang>(getLanguage());

  useEffect(() => {
    return subscribeLanguage(newLang => setLang(newLang));
  }, []);

  const handleStageConflict = async () => {
    setIsStaging(true);
    try {
      await syncCoordinator.stageConflictScenario();
      // Automatically switch to Lab view so the user can immediately observe the conflict
      setActiveTab('LAB');
    } finally {
      setIsStaging(false);
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await storageEngine.resetAllStores();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="bg-paper border-b border-stonehairline px-3 py-1.5 md:py-0 md:h-12 flex flex-col md:flex-row md:items-center md:justify-between select-none sticky top-0 z-40 text-xs gap-2 md:gap-0">
      {/* Top Row on Mobile / Left on Desktop: App Brand & Track Identifier */}
      <div className="flex items-center justify-between md:justify-start gap-3">
        <div className="flex items-center gap-2 pr-2 md:pr-3 md:border-r border-stonehairline">
          <div className="w-5 h-5 bg-slateteal flex items-center justify-center rounded-sm text-white shrink-0">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <span className="font-mono font-bold tracking-tight text-charcoal text-[13px]">
            GRAMSYNC
          </span>
          <span className="font-mono text-[10px] text-mutedink px-1.5 py-0.5 bg-canvas border border-stonehairline rounded-sm">
            v2.4
          </span>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-mono text-mutedink">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
          <span>{t('trackTitle')}</span>
        </div>

        {/* Mobile-only compact quick actions (Lang + Role + Reset) */}
        <div className="flex md:hidden items-center gap-1.5">
          <button
            onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
            className="px-2 py-0.5 text-[11px] font-mono font-bold bg-canvas border border-stonehairline rounded-sm text-slateteal"
            title="Language"
          >
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="px-2 py-0.5 font-mono text-[10px] font-bold rounded-sm border border-stonehairline bg-canvas text-charcoal flex items-center gap-1"
          >
            {currentRole === 'MEDICAL_OFFICER' ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-slateteal" />}
            <span>{currentRole === 'MEDICAL_OFFICER' ? 'MO' : 'ASHA'}</span>
          </button>
        </div>
      </div>

      {/* Center on Desktop / Second Row on Mobile: Horizontally Scrollable Mode Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-0.5 md:pb-0">
        <nav className="flex items-center bg-canvas p-0.5 border border-stonehairline rounded-sm shrink-0">
          <button
            onClick={() => setActiveTab('LAB')}
            className={`flex items-center gap-1 px-2 md:px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              activeTab === 'LAB'
                ? 'bg-paper text-charcoal font-semibold shadow-xs border border-stonehairline'
                : 'text-mutedink hover:text-charcoal'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-slateteal shrink-0" />
            <span>{t('tabLab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('SINGLE_FIELD')}
            className={`flex items-center gap-1 px-2 md:px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              activeTab === 'SINGLE_FIELD'
                ? 'bg-paper text-charcoal font-semibold shadow-xs border border-stonehairline'
                : 'text-mutedink hover:text-charcoal'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slateteal shrink-0" />
            <span>{t('tabField')}</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-1 px-2 md:px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              activeTab === 'SECURITY'
                ? 'bg-paper text-charcoal font-semibold shadow-xs border border-stonehairline'
                : 'text-mutedink hover:text-charcoal'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slateteal shrink-0" />
            <span>{t('tabSecurity')}</span>
          </button>

          <button
            onClick={() => setActiveTab('FLOW')}
            className={`flex items-center gap-1 px-2 md:px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap ${
              activeTab === 'FLOW'
                ? 'bg-paper text-charcoal font-semibold shadow-xs border border-stonehairline'
                : 'text-mutedink hover:text-charcoal'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-slateteal shrink-0" />
            <span>{t('tabFlow')}</span>
          </button>
        </nav>

        {/* Mobile Stage Conflict Macro button in tab row */}
        <button
          onClick={handleStageConflict}
          disabled={isStaging}
          className="md:hidden flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-sm shrink-0 whitespace-nowrap"
        >
          <Zap className={`w-3 h-3 text-amber-600 ${isStaging ? 'animate-spin' : ''}`} />
          <span>{isStaging ? '...' : '⚡ STAGE'}</span>
        </button>
      </div>

      {/* Right on Desktop: Demo Macros, Language Toggle & RBAC Indicator */}
      <div className="hidden md:flex items-center gap-2">
        {/* Language Switcher (EN | हिंदी) */}
        <button
          onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold bg-canvas hover:bg-stone-200 border border-stonehairline rounded-sm text-slateteal transition-colors cursor-pointer"
          title="Switch Language: English / हिंदी"
        >
          <Languages className="w-3.5 h-3.5 text-slateteal" />
          <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
        </button>

        {/* 1-Click Judge Macro */}
        <button
          onClick={handleStageConflict}
          disabled={isStaging}
          title="Macro: Disconnects Node A, makes concurrent clinical edits on both nodes, reconnects Node A to trigger HTTP 409 Conflict"
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-sm transition-all disabled:opacity-50 cursor-pointer shadow-xs"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-600 ${isStaging ? 'animate-spin' : ''}`} />
          <span>{isStaging ? 'STAGING...' : t('stageConflict')}</span>
        </button>

        {/* Reset Store */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset all IndexedDB/Local stores back to clean baseline"
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono text-mutedink hover:text-charcoal bg-canvas hover:bg-white border border-stonehairline rounded-sm transition-colors cursor-pointer"
        >
          <RotateCcw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{t('reset')}</span>
        </button>

        {/* Role Switcher with PIN Lock */}
        <div className="pl-2 border-l border-stonehairline flex items-center gap-1.5">
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="flex items-center gap-1.5 px-2 py-1 font-mono text-[11px] rounded-sm border border-stonehairline bg-canvas hover:bg-paper text-charcoal transition-colors cursor-pointer"
            title="Click to switch role via PIN authentication"
          >
            {currentRole === 'MEDICAL_OFFICER' ? (
              <>
                <Unlock className="w-3 h-3 text-emerald-600" />
                <span className="font-semibold text-emerald-800">DR. / MO (PIN 9999)</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-slateteal" />
                <span className="font-semibold text-slateteal">ASHA WORKER (PIN 1234)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
