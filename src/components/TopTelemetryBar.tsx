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
    <header className="bg-paper border-b border-stonehairline px-3 md:px-5 py-2 min-h-[52px] flex flex-wrap md:flex-nowrap items-center justify-between select-none sticky top-0 z-40 text-xs gap-2.5 shadow-2xs">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-slateteal flex items-center justify-center rounded-sm text-white shadow-2xs shrink-0">
          <Activity className="w-4 h-4" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-bold tracking-tight text-charcoal text-sm font-sans">
            GRAMSYNC
          </span>
          <span className="font-mono text-[10px] text-mutedink tracking-wider hidden lg:inline">
            // FIELD-SYNC ENGINE v2.4
          </span>
        </div>

        {/* Mobile-only compact quick actions */}
        <div className="flex md:hidden items-center gap-1.5 ml-auto">
          <button
            onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
            className="px-2 py-1 text-xs font-mono font-semibold bg-canvas hover:bg-stone-200 border border-stonehairline rounded-sm text-charcoal transition-colors"
            title="Switch Language"
          >
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="px-2 py-1 text-[11px] font-mono font-semibold rounded-sm border border-stonehairline bg-paper text-charcoal flex items-center gap-1"
          >
            {currentRole === 'MEDICAL_OFFICER' ? <Unlock className="w-3 h-3 text-slateteal" /> : <Lock className="w-3 h-3 text-mutedink" />}
            <span>{currentRole === 'MEDICAL_OFFICER' ? 'MO' : 'ASHA'}</span>
          </button>
        </div>
      </div>

      {/* Center Tabs: Horizontally Scrollable Mode Tabs */}
      <div className="flex items-center overflow-x-auto no-scrollbar py-0.5">
        <nav className="flex items-center bg-canvas p-0.5 border border-stonehairline rounded-sm gap-0.5 shrink-0 font-mono text-xs">
          <button
            onClick={() => setActiveTab('SINGLE_FIELD')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs transition-colors whitespace-nowrap cursor-pointer min-w-[125px] ${
              activeTab === 'SINGLE_FIELD'
                ? 'bg-slateteal text-white font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-charcoal hover:bg-paper/80 font-medium'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'SINGLE_FIELD' ? 'text-white' : 'text-stone-500'}`} />
            <span>{t('tabField')}</span>
          </button>

          <button
            onClick={() => setActiveTab('LAB')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs transition-colors whitespace-nowrap cursor-pointer min-w-[120px] ${
              activeTab === 'LAB'
                ? 'bg-slateteal text-white font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-charcoal hover:bg-paper/80 font-medium'
            }`}
          >
            <Split className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'LAB' ? 'text-white' : 'text-stone-500'}`} />
            <span>{t('tabLab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs transition-colors whitespace-nowrap cursor-pointer min-w-[115px] ${
              activeTab === 'SECURITY'
                ? 'bg-slateteal text-white font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-charcoal hover:bg-paper/80 font-medium'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'SECURITY' ? 'text-white' : 'text-stone-500'}`} />
            <span>{t('tabSecurity')}</span>
          </button>

          <button
            onClick={() => setActiveTab('FLOW')}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xs transition-colors whitespace-nowrap cursor-pointer min-w-[115px] ${
              activeTab === 'FLOW'
                ? 'bg-slateteal text-white font-semibold shadow-2xs'
                : 'text-stone-600 hover:text-charcoal hover:bg-paper/80 font-medium'
            }`}
          >
            <GitBranch className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'FLOW' ? 'text-white' : 'text-stone-500'}`} />
            <span>{t('tabFlow')}</span>
          </button>
        </nav>
      </div>

      {/* Right on Desktop: Demo Macros, Language Toggle & RBAC Indicator */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {/* Language Switcher (EN | हिंदी) */}
        <button
          onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium bg-paper hover:bg-canvas text-charcoal border border-stonehairline rounded-sm transition-colors cursor-pointer shadow-2xs min-w-[70px]"
          title="Switch Language: English / हिंदी"
        >
          <Languages className="w-3.5 h-3.5 text-stone-500" />
          <span>{lang === 'en' ? 'हिंदी' : 'EN'}</span>
        </button>

        {/* 1-Click Judge Macro */}
        <button
          onClick={handleStageConflict}
          disabled={isStaging}
          title="Macro: Disconnects Node A, makes concurrent clinical edits on both nodes, reconnects Node A to trigger HTTP 409 Conflict"
          className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium bg-paper hover:bg-amber-50/60 text-charcoal border border-stonehairline hover:border-amber-400 rounded-sm transition-colors disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap min-w-[125px]"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-600 ${isStaging ? 'animate-spin' : ''}`} />
          <span>{isStaging ? 'STAGING...' : t('stageConflict')}</span>
        </button>

        {/* Reset Store */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset all IndexedDB/Local stores back to clean baseline"
          className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium text-stone-600 hover:text-charcoal bg-paper hover:bg-canvas border border-stonehairline rounded-sm transition-colors cursor-pointer shadow-2xs whitespace-nowrap min-w-[70px]"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{t('reset')}</span>
        </button>

        {/* Role Switcher with PIN Lock */}
        <div className="pl-1.5 border-l border-stonehairline flex items-center">
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold rounded-sm border border-stonehairline bg-paper hover:bg-canvas text-charcoal transition-colors cursor-pointer shadow-2xs whitespace-nowrap min-w-[155px]"
            title="Click to switch role via PIN authentication"
          >
            {currentRole === 'MEDICAL_OFFICER' ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-slateteal" />
                <span className="text-slateteal">{t('roleMo')}</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-mutedink" />
                <span className="text-charcoal">{t('roleAsha')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
