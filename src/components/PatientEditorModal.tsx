import React, { useState, useRef, useEffect } from 'react';
import { X, Save, AlertTriangle, ShieldCheck, Stethoscope, Mic, MicOff } from 'lucide-react';
import { PatientRecord, NodeId, UserRole, VitalSignPayload } from '../types/clinical';
import { storageEngine } from '../services/storageEngine';
import { syncCoordinator } from '../services/syncCoordinator';

interface Props {
  patient: PatientRecord;
  nodeId: NodeId;
  userRole: UserRole;
  onClose: () => void;
  onSaved: () => void;
}

export const PatientEditorModal: React.FC<Props> = ({
  patient,
  nodeId,
  userRole,
  onClose,
  onSaved
}) => {
  const [formData, setFormData] = useState<VitalSignPayload>({ ...patient.data });
  const [fullName, setFullName] = useState(patient.fullName);
  const [age, setAge] = useState(patient.age);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>(patient.gender);
  const [phone, setPhone] = useState(patient.phone || '');
  const [villageCluster, setVillageCluster] = useState(patient.villageCluster);
  const [conditionTag, setConditionTag] = useState(patient.conditionTag);
  const [showDemographics, setShowDemographics] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceDictation = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is supported in Chrome, Edge, and Android Chrome.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        if (transcript) {
          setFormData(prev => ({
            ...prev,
            clinicalNotes: prev.clinicalNotes
              ? `${prev.clinicalNotes} ${transcript.trim()}`
              : transcript.trim()
          }));
        }
      };

      recognition.onerror = (e: any) => {
        console.warn('Voice dictation error:', e);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed to start:', err);
      setIsListening(false);
    }
  };

  const nodeName = nodeId === 'NODE_A' ? 'Node A (ASHA Field Tablet)' : 'Node B (PHC Doctor Desk)';
  const networkMode = syncCoordinator.getNetworkMode(nodeId);

  const handleChange = (field: keyof VitalSignPayload, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && !isNaN(Number(value)) && field !== 'medicationsIssued' && field !== 'clinicalNotes'
        ? Number(value)
        : value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await storageEngine.updateLocalPatientRecord(
        nodeId,
        patient.patientId,
        formData,
        userRole,
        {
          fullName: fullName.trim(),
          age: Number(age),
          gender,
          phone: phone.trim(),
          villageCluster: villageCluster.trim(),
          conditionTag: conditionTag.trim()
        }
      );

      // If online, immediately drain outbox to server
      if (networkMode !== 'OFFLINE') {
        await syncCoordinator.drainOutbox(nodeId);
      }

      onSaved();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-charcoal/50 backdrop-blur-xs flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-paper border border-stonehairline w-full max-w-2xl rounded-sm shadow-2xl flex flex-col max-h-[96vh]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-canvas border-b border-stonehairline flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-slateteal text-white rounded-sm flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-mono text-sm font-bold text-charcoal">
                  RECORD CLINICAL VISIT: {patient.fullName}
                </h3>
                <span className="font-mono text-xs text-mutedink">({patient.patientId})</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-mutedink">
                <span>{nodeName}</span>
                <span>•</span>
                <span className="text-stone-700 font-semibold">{patient.conditionTag}</span>
                <span>•</span>
                <span>REV #{patient.revision}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-charcoal p-1 rounded-sm border border-transparent hover:border-stonehairline transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Network State Warning Banner */}
        <div className={`px-4 py-1.5 text-xs font-mono flex items-center justify-between border-b ${
          networkMode === 'OFFLINE'
            ? 'bg-amber-50 text-amber-900 border-amber-200'
            : 'bg-emerald-50 text-emerald-900 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {networkMode === 'OFFLINE' ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>OFFLINE MODE: This mutation will be stored in IndexedDB and queued in Outbox for background sync.</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>ONLINE: Mutation will commit directly to Central PHC Server handshake.</span>
              </>
            )}
          </div>
          <span className="font-bold">STATUS: {networkMode}</span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-4 overflow-y-auto space-y-4">
          {/* Patient Profile & Demographics Settings Accordion */}
          <div className="border border-stone-200 rounded-xl bg-stone-50/70 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <span>👤</span>
                <span>मरीज विवरण एवं प्रोफाइल सेटिंग्स (Profile & Gender)</span>
              </span>
              <button
                type="button"
                onClick={() => setShowDemographics(!showDemographics)}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
              >
                {showDemographics ? 'कम विवरण छुपाएं (Hide)' : 'प्रोफाइल / लिंग बदलें (Edit Profile)'}
              </button>
            </div>

            {showDemographics && (
              <div className="pt-2 border-t border-stone-200 space-y-3 animate-in fade-in duration-150">
                {/* Gender Switcher */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 mb-1.5">
                    लिंग (Gender Selection)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Female', 'Male', 'Other'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                          gender === g
                            ? g === 'Female'
                              ? 'bg-rose-50 border-rose-300 text-rose-800 shadow-2xs'
                              : g === 'Male'
                              ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-2xs'
                              : 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-100'
                        }`}
                      >
                        <span>{g === 'Female' ? '👩' : g === 'Male' ? '👨' : '🧑'}</span>
                        <span>{g === 'Female' ? 'महिला (Female)' : g === 'Male' ? 'पुरुष (Male)' : 'अन्य (Other)'}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">पूरा नाम (Full Name)</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs text-stone-900 font-semibold focus:outline-emerald-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">उम्र (Age)</label>
                      <input
                        type="number"
                        min={1}
                        max={110}
                        required
                        value={age}
                        onChange={e => setAge(Number(e.target.value))}
                        className="w-full bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs text-stone-900 focus:outline-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-stone-600 mb-1">मोबाइल (Phone)</label>
                      <input
                        type="text"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="w-full bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs text-stone-900 focus:outline-emerald-600 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">स्वास्थ्य स्थिति (Condition Tag)</label>
                    <input
                      type="text"
                      value={conditionTag}
                      onChange={e => setConditionTag(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs text-stone-900 focus:outline-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-stone-600 mb-1">गाँव / उप-केंद्र (Village Cluster)</label>
                    <input
                      type="text"
                      value={villageCluster}
                      onChange={e => setVillageCluster(e.target.value)}
                      className="w-full bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg text-xs text-stone-900 focus:outline-emerald-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Vitals Grid */}
          <div>
            <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink mb-2">
              1. PRIMARY PHYSIOLOGICAL VITALS (TABULAR NUMERICS)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* BP Systolic */}
              <div className="border border-stonehairline p-2.5 rounded-sm bg-canvas">
                <label className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Systolic BP (mmHg)
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  max={260}
                  value={formData.systolicBP}
                  onChange={e => handleChange('systolicBP', e.target.value)}
                  className="w-full bg-paper border border-stonehairline px-2.5 py-1.5 font-mono text-base font-bold tabular-nums text-charcoal focus:outline-slateteal rounded-sm"
                />
              </div>

              {/* BP Diastolic */}
              <div className="border border-stonehairline p-2.5 rounded-sm bg-canvas">
                <label className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Diastolic BP (mmHg)
                </label>
                <input
                  type="number"
                  required
                  min={30}
                  max={160}
                  value={formData.diastolicBP}
                  onChange={e => handleChange('diastolicBP', e.target.value)}
                  className="w-full bg-paper border border-stonehairline px-2.5 py-1.5 font-mono text-base font-bold tabular-nums text-charcoal focus:outline-slateteal rounded-sm"
                />
              </div>

              {/* Heart Rate */}
              <div className="border border-stonehairline p-2.5 rounded-sm bg-canvas">
                <label className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Heart Rate (BPM)
                </label>
                <input
                  type="number"
                  required
                  min={30}
                  max={220}
                  value={formData.heartRate}
                  onChange={e => handleChange('heartRate', e.target.value)}
                  className="w-full bg-paper border border-stonehairline px-2.5 py-1.5 font-mono text-base font-bold tabular-nums text-charcoal focus:outline-slateteal rounded-sm"
                />
              </div>

              {/* SpO2 */}
              <div className="border border-stonehairline p-2.5 rounded-sm bg-canvas">
                <label className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Oxygen SpO2 (%)
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  max={100}
                  value={formData.spO2}
                  onChange={e => handleChange('spO2', e.target.value)}
                  className="w-full bg-paper border border-stonehairline px-2.5 py-1.5 font-mono text-base font-bold tabular-nums text-charcoal focus:outline-slateteal rounded-sm"
                />
              </div>

              {/* Hemoglobin */}
              <div className="border border-stonehairline p-2.5 rounded-sm bg-canvas">
                <label className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Hemoglobin (g/dL)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={2}
                  max={20}
                  value={formData.hemoglobinGdl}
                  onChange={e => handleChange('hemoglobinGdl', e.target.value)}
                  className="w-full bg-paper border border-stonehairline px-2.5 py-1.5 font-mono text-base font-bold tabular-nums text-charcoal focus:outline-slateteal rounded-sm"
                />
              </div>

              {/* Temperature */}
              <div className="border border-stonehairline p-2.5 rounded-sm bg-canvas">
                <label className="block text-[11px] font-mono text-mutedink uppercase mb-1">
                  Temp (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={32}
                  max={43}
                  value={formData.temperatureC}
                  onChange={e => handleChange('temperatureC', e.target.value)}
                  className="w-full bg-paper border border-stonehairline px-2.5 py-1.5 font-mono text-base font-bold tabular-nums text-charcoal focus:outline-slateteal rounded-sm"
                />
              </div>
            </div>
          </div>

          {/* Medications Issued */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink">
                2. PHARMACEUTICAL & STOCK DISPENSATION
              </label>
              {userRole === 'ASHA_WORKER' && (
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded-sm">
                  ASHA Role: Essential Field Kit items only
                </span>
              )}
            </div>
            <textarea
              rows={2}
              required
              value={formData.medicationsIssued}
              onChange={e => handleChange('medicationsIssued', e.target.value)}
              placeholder="e.g. Labetalol 100mg BD, IFA Tablets, ORS sachets..."
              className="w-full bg-paper border border-stonehairline p-2 font-mono text-xs text-charcoal rounded-sm focus:outline-slateteal"
            />
          </div>

          {/* Clinical Field Notes with Voice-to-Text */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-mono font-bold uppercase tracking-wider text-mutedink flex items-center gap-1.5">
                <span>3. CLINICAL TRIAGE NOTES & OBSERVATIONS</span>
              </label>

              {/* Speech-to-Text Voice Dictation Trigger */}
              <div className="flex items-center gap-1.5">
                <select
                  value={voiceLang}
                  onChange={e => setVoiceLang(e.target.value as any)}
                  className="bg-paper border border-stonehairline text-[10px] font-mono py-0.5 px-1 rounded-sm text-charcoal focus:outline-none cursor-pointer"
                  title="Dictation Language"
                >
                  <option value="en-IN">EN (Indian)</option>
                  <option value="hi-IN">HI (हिंदी)</option>
                </select>

                <button
                  type="button"
                  onClick={toggleVoiceDictation}
                  className={`flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold rounded-sm border transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-600 text-white border-red-700 animate-pulse'
                      : 'bg-paper hover:bg-stone-200 text-stone-700 border-stonehairline'
                  }`}
                  title="Click to dictate clinical notes via voice"
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3 h-3 text-white" />
                      <span>STOP RECORDING</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3 h-3 text-slateteal" />
                      <span>VOICE DICTATE</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {isListening && (
              <div className="mb-1.5 px-2 py-1 bg-red-50 border border-red-200 text-[10px] font-mono text-red-700 flex items-center justify-between rounded-sm animate-pulse">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                  Listening in {voiceLang === 'hi-IN' ? 'Hindi (हिंदी)' : 'Indian English'}... Speak clearly.
                </span>
                <span className="text-[9px] text-red-500">Auto-appends to notes</span>
              </div>
            )}

            <textarea
              rows={3}
              required
              value={formData.clinicalNotes}
              onChange={e => handleChange('clinicalNotes', e.target.value)}
              placeholder="Record symptoms, fetal heart sounds, edema, maternal follow-up date... (or click VOICE DICTATE)"
              className="w-full bg-paper border border-stonehairline p-2 font-mono text-xs text-charcoal rounded-sm focus:outline-slateteal"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stonehairline flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-mono text-mutedink hover:text-charcoal bg-canvas border border-stonehairline rounded-sm"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-1.5 text-xs font-mono font-semibold text-white bg-slateteal hover:bg-slateteal-hover rounded-sm flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'SAVING...' : 'COMMIT CLINICAL ENTRY'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
