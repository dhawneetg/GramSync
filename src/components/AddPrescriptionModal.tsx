import React, { useState } from 'react';
import { X, Pill, Plus } from 'lucide-react';
import { StructuredPrescription } from '../types/clinical';
import { t } from '../services/languageService';

interface Props {
  patientName: string;
  onClose: () => void;
  onSave: (rx: StructuredPrescription) => void;
}

const COMMON_DRUGS = [
  { name: 'Amlodipine 5mg', dosage: '1 Tablet', freq: '1-0-0 (सुबह)', timing: 'AFTER_FOOD' as const, days: 30 },
  { name: 'Metformin 500mg', dosage: '1 Tablet', freq: '1-0-1 (सुबह - रात)', timing: 'AFTER_FOOD' as const, days: 30 },
  { name: 'Paracetamol 500mg', dosage: '1 Tablet SOS', freq: 'जरूरत पड़ने पर (SOS)', timing: 'AFTER_FOOD' as const, days: 5 },
  { name: 'Iron & Folic Acid (IFA)', dosage: '1 Tablet', freq: '1-0-0 (दोपहर बाद)', timing: 'AFTER_FOOD' as const, days: 60 },
  { name: 'Amoxicillin 500mg', dosage: '1 Capsule', freq: '1-1-1 (दिन में 3 बार)', timing: 'AFTER_FOOD' as const, days: 5 },
  { name: 'ORS (Oral Rehydration)', dosage: '1 Sachet in 1L', freq: 'दिनभर घूंट-घूंट पिएं', timing: 'BEFORE_FOOD' as const, days: 3 },
  { name: 'Calcium + Vit D3', dosage: '1 Tablet', freq: '1-0-0 (सुबह)', timing: 'AFTER_FOOD' as const, days: 30 },
  { name: 'Omeprazole 20mg', dosage: '1 Capsule', freq: '1-0-0 (सुबह खाली पेट)', timing: 'BEFORE_FOOD' as const, days: 14 }
];

export const AddPrescriptionModal: React.FC<Props> = ({ patientName, onClose, onSave }) => {
  const [medicineName, setMedicineName] = useState(COMMON_DRUGS[0].name);
  const [dosage, setDosage] = useState(COMMON_DRUGS[0].dosage);
  const [frequency, setFrequency] = useState(COMMON_DRUGS[0].freq);
  const [timing, setTiming] = useState<'BEFORE_FOOD' | 'AFTER_FOOD'>(COMMON_DRUGS[0].timing);
  const [daysPrescribed, setDaysPrescribed] = useState<number>(COMMON_DRUGS[0].days);
  const [issuedBy, setIssuedBy] = useState('Dr. S. K. Sharma (Medical Officer, PHC)');

  const handleSelectPreset = (drug: typeof COMMON_DRUGS[0]) => {
    setMedicineName(drug.name);
    setDosage(drug.dosage);
    setFrequency(drug.freq);
    setTiming(drug.timing);
    setDaysPrescribed(drug.days);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim() || !dosage.trim()) return;

    const newRx: StructuredPrescription = {
      id: `RX-${Date.now().toString().slice(-6)}`,
      medicineName: medicineName.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      timing,
      daysPrescribed: Number(daysPrescribed) || 7,
      issuedBy: issuedBy.trim() || 'Medical Officer PHC',
      issuedDate: new Date().toISOString().split('T')[0]
    };

    onSave(newRx);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-stone-200 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-rose-800 to-rose-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Pill className="w-4 h-4 text-rose-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight">
                नई डॉक्टर पर्ची / दवा जोड़ें (Add Prescription)
              </h3>
              <p className="text-[11px] text-rose-200">
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
              सामान्य आवश्यक दवाइयाँ (Essential PHC Medicine Formulary):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_DRUGS.map(d => (
                <button
                  type="button"
                  key={d.name}
                  onClick={() => handleSelectPreset(d)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    medicineName === d.name 
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold' 
                      : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {d.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Medicine Name */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              दवा का नाम (Medicine Name) *
            </label>
            <input
              type="text"
              required
              value={medicineName}
              onChange={e => setMedicineName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              placeholder="उदा. Amlodipine 5mg, Paracetamol..."
            />
          </div>

          {/* Dosage & Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                खुराक / मात्रा (Dosage) *
              </label>
              <input
                type="text"
                required
                value={dosage}
                onChange={e => setDosage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                placeholder="उदा. 1 Tablet, 5ml"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                दिनों की संख्या (Days Duration) *
              </label>
              <input
                type="number"
                min="1"
                max="180"
                required
                value={daysPrescribed}
                onChange={e => setDaysPrescribed(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                placeholder="उदा. 14, 30"
              />
            </div>
          </div>

          {/* Frequency & Timing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                लेने का समय / आवृत्ति (Frequency)
              </label>
              <input
                type="text"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                placeholder="उदा. 1-0-1 (सुबह - रात)"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                भोजन निर्देश (Meal Timing)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTiming('AFTER_FOOD')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    timing === 'AFTER_FOOD'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  खाने के बाद
                </button>
                <button
                  type="button"
                  onClick={() => setTiming('BEFORE_FOOD')}
                  className={`py-2 px-2 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                    timing === 'BEFORE_FOOD'
                      ? 'bg-amber-50 border-amber-500 text-amber-800'
                      : 'bg-stone-50 border-stone-200 text-stone-600'
                  }`}
                >
                  खाली पेट
                </button>
              </div>
            </div>
          </div>

          {/* Prescribed By */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              परामर्शक डॉक्टर / PHC (Prescribing Doctor)
            </label>
            <input
              type="text"
              value={issuedBy}
              onChange={e => setIssuedBy(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              placeholder="उदा. Dr. S. K. Sharma (Medical Officer, PHC)"
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
              className="px-4 py-2 text-xs font-bold bg-rose-700 hover:bg-rose-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
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
