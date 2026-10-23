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
    <header className="bg-white border-b border-stone-200/90 px-3 md:px-5 py-2 min-h-[56px] flex flex-wrap md:flex-nowrap items-center justify-between select-none sticky top-0 z-40 text-xs gap-2.5 shadow-2xs">
      {/* Brand */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-7 h-7 bg-emerald-600 flex items-center justify-center rounded-lg text-white shadow-xs shrink-0">
          <Activity className="w-4 h-4" />
        </div>
        <span className="font-bold tracking-tight text-stone-900 text-sm font-sans">
          GRAMSYNC
        </span>

        {/* Mobile-only compact quick actions */}
        <div className="flex md:hidden items-center gap-1.5 ml-auto">
          <button
            onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
            className="px-2.5 py-1 text-xs font-semibold bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-lg text-emerald-800 transition-colors"
            title="Switch Language"
          >
            {lang === 'en' ? 'हिंदी' : 'EN'}
          </button>
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-stone-200 bg-stone-50 text-stone-700 flex items-center gap-1"
          >
            {currentRole === 'MEDICAL_OFFICER' ? <Unlock className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-emerald-700" />}
            <span>{currentRole === 'MEDICAL_OFFICER' ? 'MO' : 'ASHA'}</span>
          </button>
        </div>
      </div>

      {/* Center Tabs: Horizontally Scrollable Mode Tabs */}
      <div className="flex items-center overflow-x-auto no-scrollbar py-0.5">
        <nav className="flex items-center bg-stone-100 p-1 border border-stone-200/70 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('SINGLE_FIELD')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'SINGLE_FIELD'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
            }`}
          >
            <UserCheck className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'SINGLE_FIELD' ? 'text-white' : 'text-emerald-700'}`} />
            <span>{t('tabField')}</span>
          </button>

          <button
            onClick={() => setActiveTab('LAB')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'LAB'
                ? 'bg-white text-stone-900 font-semibold shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
            }`}
          >
            <Split className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{t('tabLab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('SECURITY')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'SECURITY'
                ? 'bg-white text-stone-900 font-semibold shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{t('tabSecurity')}</span>
          </button>

          <button
            onClick={() => setActiveTab('FLOW')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 whitespace-nowrap cursor-pointer ${
              activeTab === 'FLOW'
                ? 'bg-white text-stone-900 font-semibold shadow-xs border border-stone-200/80'
                : 'text-stone-600 hover:text-stone-900 hover:bg-white/70'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
            <span>{t('tabFlow')}</span>
          </button>
        </nav>
      </div>

      {/* Right on Desktop: Demo Macros, Language Toggle & RBAC Indicator */}
      <div className="hidden md:flex items-center gap-2 shrink-0">
        {/* Language Switcher (EN | हिंदी) */}
        <button
          onClick={() => setLanguage(lang === 'en' ? 'hi' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 border border-stone-200 rounded-lg text-stone-700 transition-all cursor-pointer shadow-2xs"
          title="Switch Language: English / हिंदी"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-700" />
          <span>{lang === 'en' ? 'हिंदी' : 'English'}</span>
        </button>

        {/* 1-Click Judge Macro */}
        <button
          onClick={handleStageConflict}
          disabled={isStaging}
          title="Macro: Disconnects Node A, makes concurrent clinical edits on both nodes, reconnects Node A to trigger HTTP 409 Conflict"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 rounded-lg transition-all disabled:opacity-50 cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <Zap className={`w-3.5 h-3.5 text-amber-600 ${isStaging ? 'animate-spin' : ''}`} />
          <span>{isStaging ? '...' : t('stageConflict')}</span>
        </button>

        {/* Reset Store */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset all IndexedDB/Local stores back to clean baseline"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition-all cursor-pointer shadow-2xs whitespace-nowrap"
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
          <span>{t('reset')}</span>
        </button>

        {/* Role Switcher with PIN Lock */}
        <div className="pl-2 border-l border-stone-200 flex items-center">
          <button
            onClick={() => onOpenPinModal(currentRole === 'ASHA_WORKER' ? 'MEDICAL_OFFICER' : 'ASHA_WORKER')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 bg-stone-50 hover:bg-white text-stone-800 transition-all cursor-pointer shadow-2xs whitespace-nowrap"
            title="Click to switch role via PIN authentication"
          >
            {currentRole === 'MEDICAL_OFFICER' ? (
              <>
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-800">DR. / MO (PIN 9999)</span>
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 text-emerald-700" />
                <span className="text-stone-800">ASHA WORKER (PIN 1234)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
