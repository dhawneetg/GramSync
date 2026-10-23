import React, { useState } from 'react';
import { Lock, X, Check, ShieldAlert } from 'lucide-react';
import { UserRole } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';

interface Props {
  targetRole: UserRole;
  onSuccess: (role: UserRole) => void;
  onCancel: () => void;
}

export const PinAuthModal: React.FC<Props> = ({ targetRole, onSuccess, onCancel }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const expectedPin = targetRole === 'MEDICAL_OFFICER' ? '9999' : '1234';
  const roleTitle = targetRole === 'MEDICAL_OFFICER' ? 'Primary Health Centre Medical Officer' : 'Frontline ASHA Field Worker';

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin === expectedPin) {
      storageEngine.logAudit({
        nodeId: targetRole === 'MEDICAL_OFFICER' ? 'NODE_B' : 'NODE_A',
        role: targetRole,
        action: 'PIN_UNLOCKED',
        details: `Clinician PIN verified for [${targetRole}]. Session privilege elevated.`
      });
      onSuccess(targetRole);
    } else {
      setError(true);
      setPin('');
    }
  };

  const handleQuickKey = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === 4) {
        if (nextPin === expectedPin) {
          storageEngine.logAudit({
            nodeId: targetRole === 'MEDICAL_OFFICER' ? 'NODE_B' : 'NODE_A',
            role: targetRole,
            action: 'PIN_UNLOCKED',
            details: `Clinician PIN verified for [${targetRole}]. Session privilege elevated.`
          });
          onSuccess(targetRole);
        } else {
          setError(true);
          setPin('');
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-paper border border-stonehairline w-full max-w-sm rounded-sm shadow-xl p-5 select-none">
        <div className="flex items-center justify-between border-b border-stonehairline pb-3 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slateteal text-white rounded-sm flex items-center justify-center">
              <Lock className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-charcoal">
                CLINICAL AUTHENTICATION PIN
              </h3>
              <p className="text-[11px] text-mutedink">{roleTitle}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-stone-400 hover:text-charcoal p-1 rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center py-2">
          <div className="text-[11px] font-mono text-stone-500 mb-2">
            ENTER 4-DIGIT CLINICAL PASSCODE
          </div>

          <div className="flex justify-center gap-3 my-3">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-10 h-10 border rounded-sm flex items-center justify-center text-lg font-mono font-bold transition-all ${
                  error
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : pin.length > i
                    ? 'border-slateteal bg-slate-50 text-slateteal'
                    : 'border-stonehairline bg-canvas text-stone-300'
                }`}
              >
                {pin.length > i ? '●' : ''}
              </div>
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-red-600 text-[11px] font-mono mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>INVALID PIN. EXPECTED: {expectedPin}</span>
            </div>
          )}

          <div className="text-[10px] font-mono text-mutedink bg-canvas p-1.5 border border-stonehairline rounded-sm my-3">
            DEMO PASSCODES: ASHA = <span className="font-bold text-charcoal">1234</span> | MO / DOCTOR = <span className="font-bold text-charcoal">9999</span>
          </div>

          {/* NumPad */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
              <button
                key={n}
                onClick={() => handleQuickKey(n)}
                className="h-10 bg-canvas hover:bg-stone-200 border border-stonehairline font-mono font-semibold text-sm rounded-sm active:scale-95 transition-all text-charcoal"
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => { setPin(''); setError(false); }}
              className="h-10 bg-canvas hover:bg-red-50 text-red-700 border border-stonehairline font-mono text-xs rounded-sm transition-all"
            >
              CLR
            </button>
            <button
              onClick={() => handleQuickKey('0')}
              className="h-10 bg-canvas hover:bg-stone-200 border border-stonehairline font-mono font-semibold text-sm rounded-sm text-charcoal"
            >
              0
            </button>
            <button
              onClick={() => handleSubmit()}
              className="h-10 bg-slateteal hover:bg-slateteal-hover text-white border border-slateteal font-mono text-xs font-semibold rounded-sm flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>OK</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
