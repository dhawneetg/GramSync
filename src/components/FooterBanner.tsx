import React from 'react';
import { ShieldAlert, Database } from 'lucide-react';

export const FooterBanner: React.FC = () => {
  return (
    <footer className="h-7 bg-canvas border-t border-stonehairline px-3 flex items-center justify-between text-[10px] font-mono text-mutedink select-none shrink-0 z-30">
      <div className="flex items-center gap-2">
        <ShieldAlert className="w-3 h-3 text-amber-700" />
        <span className="font-semibold text-charcoal">
          COMPLIANCE NOTICE:
        </span>
        <span className="hidden sm:inline">
          Clinical Decision & Sync Support Prototype — Not Production Medical-Record Compliant. All patient profiles are strictly synthetic/fictional.
        </span>
        <span className="sm:hidden">
          Prototype only • Synthetic Data.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1">
          <Database className="w-2.5 h-2.5 text-slateteal" />
          <span>VAULT: AES-GCM (256-BIT)</span>
        </span>
        <span className="hidden md:inline">JU TECHFEST 2026 // HT-03</span>
      </div>
    </footer>
  );
};
