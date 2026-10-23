import React, { useState } from 'react';
import { X, FlaskConical, Plus } from 'lucide-react';
import { LabInvestigation } from '../types/clinical';
import { t } from '../services/languageService';

interface Props {
  patientName: string;
  onClose: () => void;
  onSave: (lab: LabInvestigation) => void;
}

const COMMON_TESTS = [
  { name: 'CBC - Hemoglobin (Hb)', range: '12.0 - 15.0 g/dL', defaultVal: '10.8 g/dL', defaultStatus: 'ELEVATED' as const },
  { name: 'Fasting Blood Glucose (FBG)', range: '70 - 100 mg/dL', defaultVal: '118 mg/dL', defaultStatus: 'ELEVATED' as const },
  { name: 'Serum Creatinine (Renal)', range: '0.6 - 1.2 mg/dL', defaultVal: '0.9 mg/dL', defaultStatus: 'NORMAL' as const },
  { name: 'Urine Albumin (Dipstick)', range: 'Nil / Negative', defaultVal: 'Trace (1+)', defaultStatus: 'ELEVATED' as const },
  { name: 'Rapid Malaria Dual (Pf/Pv)', range: 'Non-reactive', defaultVal: 'Negative (Non-reactive)', defaultStatus: 'NORMAL' as const },
  { name: 'Sputum Smear (AFB - TB)', range: 'Negative', defaultVal: 'Negative for AFB', defaultStatus: 'NORMAL' as const }
];

export const AddLabTestModal: React.FC<Props> = ({ patientName, onClose, onSave }) => {
  const [testName, setTestName] = useState(COMMON_TESTS[0].name);
  const [resultValue, setResultValue] = useState(COMMON_TESTS[0].defaultVal);
  const [normalRange, setNormalRange] = useState(COMMON_TESTS[0].range);
  const [status, setStatus] = useState<'NORMAL' | 'ELEVATED' | 'CRITICAL'>(COMMON_TESTS[0].defaultStatus);
  const [performedAt, setPerformedAt] = useState('PHC Central Pathology Lab');
  const [doctorRemarks, setDoctorRemarks] = useState('Mild alteration noted. Advised clinical follow-up.');

  const handleSelectPreset = (test: typeof COMMON_TESTS[0]) => {
    setTestName(test.name);
    setNormalRange(test.range);
    setResultValue(test.defaultVal);
    setStatus(test.defaultStatus);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !resultValue.trim()) return;

    const newLab: LabInvestigation = {
      id: `LAB-${Date.now().toString().slice(-6)}`,
      testName: testName.trim(),
      testDate: new Date().toISOString(),
      performedAt: performedAt.trim() || 'PHC Diagnostic Lab',
      resultValue: resultValue.trim(),
      normalRange: normalRange.trim() || 'Refer to standard lab protocol',
      status,
      doctorRemarks: doctorRemarks.trim() || 'Recorded via GramSync Node'
    };

    onSave(newLab);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <FlaskConical className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                नया लैब टेस्ट दर्ज करें (Add Lab Report)
              </h3>
              <p className="text-[11px] text-indigo-200">
                मरीज: <strong className="text-white">{patientName}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          {/* Preset Buttons */}
          <div>
            <label className="text-[11px] font-bold uppercase text-stone-500 block mb-1.5">
              त्वरित चयन (Quick Select PHC Tests):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_TESTS.map(t => (
                <button
                  type="button"
                  key={t.name}
                  onClick={() => handleSelectPreset(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    testName === t.name 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold' 
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {t.name.split(' - ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Test Name */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              जाँच का नाम (Test Name) *
            </label>
            <input
              type="text"
              required
              value={testName}
              onChange={e => setTestName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="उदा. Hemoglobin (Hb), Blood Sugar..."
            />
          </div>

          {/* Result Value & Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                परिणाम (Result Value) *
              </label>
              <input
                type="text"
                required
                value={resultValue}
                onChange={e => setResultValue(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono font-bold border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="उदा. 10.8 g/dL या 118 mg/dL"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                सामान्य सीमा (Normal Range)
              </label>
              <input
                type="text"
                value={normalRange}
                onChange={e => setNormalRange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                placeholder="उदा. 12.0 - 15.0 g/dL"
              />
            </div>
          </div>

          {/* Status Radio */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1.5">
              जाँच स्थिति (Clinical Status)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <label className={`flex items-center justify-center p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                status === 'NORMAL' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}>
                <input
                  type="radio"
                  name="labStatus"
                  value="NORMAL"
                  checked={status === 'NORMAL'}
                  onChange={() => setStatus('NORMAL')}
                  className="sr-only"
                />
                <span>✓ सामान्य (Normal)</span>
              </label>

              <label className={`flex items-center justify-center p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                status === 'ELEVATED' ? 'bg-amber-50 border-amber-500 text-amber-800' : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}>
                <input
                  type="radio"
                  name="labStatus"
                  value="ELEVATED"
                  checked={status === 'ELEVATED'}
                  onChange={() => setStatus('ELEVATED')}
                  className="sr-only"
                />
                <span>⚠️ मध्यम (Elevated)</span>
              </label>

              <label className={`flex items-center justify-center p-2 rounded-xl border text-xs font-bold cursor-pointer transition-all ${
                status === 'CRITICAL' ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-stone-50 border-stone-200 text-stone-600'
              }`}>
                <input
                  type="radio"
                  name="labStatus"
                  value="CRITICAL"
                  checked={status === 'CRITICAL'}
                  onChange={() => setStatus('CRITICAL')}
                  className="sr-only"
                />
                <span>🚨 गंभीर (Critical)</span>
              </label>
            </div>
          </div>

          {/* Facility & Doctor Remarks */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              जाँच केंद्र (Testing Facility)
            </label>
            <input
              type="text"
              value={performedAt}
              onChange={e => setPerformedAt(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="उदा. PHC Central Pathology Lab"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              चिकित्सक या लैब टिप्पणी (Doctor / Lab Remarks)
            </label>
            <input
              type="text"
              value={doctorRemarks}
              onChange={e => setDoctorRemarks(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              placeholder="उदा. Follow-up after 15 days..."
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('saveReport')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
