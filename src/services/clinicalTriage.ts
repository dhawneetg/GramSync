import { PatientRecord } from '../types/clinical';

export type TriageSeverity = 'CRITICAL' | 'WARNING' | 'NORMAL';

export interface TriageAlert {
  id: string;
  code: string;
  label: string;
  severity: TriageSeverity;
  protocolDescription: string;
  nhmReference: string;
}

/**
 * Evaluates patient physiological vitals and condition tags against
 * National Health Mission (NHM) and Ayushman Bharat rural clinical triage protocols.
 */
export function evaluateNhmTriage(patient: PatientRecord): TriageAlert[] {
  if (!patient || !patient.data) return [];
  const alerts: TriageAlert[] = [];
  const { data } = patient;
  const condition = (patient.conditionTag || '').toLowerCase();
  const gender = patient.gender || '';

  const sys = typeof data.systolicBP === 'number' ? data.systolicBP : 0;
  const dia = typeof data.diastolicBP === 'number' ? data.diastolicBP : 0;
  const hb = typeof data.hemoglobinGdl === 'number' ? data.hemoglobinGdl : 12;
  const spo2 = typeof data.spO2 === 'number' ? data.spO2 : 98;

  // 1. High-Risk Pregnancy (HRP) & Gestational HTN / Pre-Eclampsia Watch
  const isMaternal = 
    (gender.toLowerCase() === 'female' || !gender) && 
    (condition.includes('gestational') || 
     condition.includes('postpartum') || 
     condition.includes('antenatal') || 
     condition.includes('pregnancy'));

  if (isMaternal && (sys >= 140 || dia >= 90)) {
    alerts.push({
      id: 'TRIAGE-HRP-01',
      code: 'NHM-HRP-01',
      label: 'HIGH-RISK PREGNANCY (HRP) // PRE-ECLAMPSIA WATCH',
      severity: 'CRITICAL',
      protocolDescription: 'BP ≥ 140/90 in pregnancy. Urgent referral to First Referral Unit (FRU). Standby Labetalol / IV Magnesium Sulfate.',
      nhmReference: 'NHM Maternal Health Guidelines 2024'
    });
  } else if (sys >= 160 || dia >= 100) {
    alerts.push({
      id: 'TRIAGE-HTN-02',
      code: 'NHM-NCD-HTN',
      label: 'STAGE-2 HYPERTENSIVE CRISIS',
      severity: 'CRITICAL',
      protocolDescription: 'Acute severe hypertension. Immediate anti-hypertensive intervention and cardiovascular stabilization.',
      nhmReference: 'National NCD Control Programme'
    });
  }

  // 2. Severe Nutritional Anemia (Hb < 8.0 g/dL)
  if (hb < 8.0) {
    alerts.push({
      id: 'TRIAGE-ANEMIA-01',
      code: 'AMB-SEV-01',
      label: 'SEVERE NUTRITIONAL ANEMIA (IV INFUSION REQ)',
      severity: 'CRITICAL',
      protocolDescription: 'Hb < 8.0 g/dL. Prescribe Parenteral Iron (IV Ferric Carboxymaltose 500mg) at FRU/PHC. Avoid oral-only delay.',
      nhmReference: 'Anemia Mukt Bharat (AMB) Protocol'
    });
  } else if (hb < 11.0) {
    alerts.push({
      id: 'TRIAGE-ANEMIA-02',
      code: 'AMB-MOD-02',
      label: 'MODERATE ANEMIA (IFA RED PROTOCOL)',
      severity: 'WARNING',
      protocolDescription: 'Hb 8.0-10.9 g/dL. Daily Iron & Folic Acid (IFA Red) tablet with Albendazole 400mg deworming.',
      nhmReference: 'Anemia Mukt Bharat (AMB)'
    });
  }

  // 3. Uncontrolled Diabetes Mellitus (Capillary Blood Glucose / Diabetic Complications)
  if (condition.includes('diabetes') || condition.includes('dm-2') || condition.includes('dm') || condition.includes('glucose')) {
    alerts.push({
      id: 'TRIAGE-NCD-DM',
      code: 'NPCDCS-DM-02',
      label: 'UNCONTROLLED DM-2 // GLUCOSE WATCH',
      severity: 'WARNING',
      protocolDescription: 'Capillary glucose surveillance. Diabetic monofilament foot screening and renal microalbuminuria follow-up.',
      nhmReference: 'NPCDCS Primary Health Centre Manual'
    });
  }

  // 4. Acute Respiratory Distress / Hypoxemia (SpO2 < 94%)
  if (spo2 < 94) {
    alerts.push({
      id: 'TRIAGE-RESP-01',
      code: 'NHM-EM-RESP',
      label: 'ACUTE HYPOXEMIA (O2 THERAPY REQUIRED)',
      severity: 'CRITICAL',
      protocolDescription: 'Oxygen saturation below 94%. Administer supplemental oxygen via nasal cannula and prepare for immediate PHC transfer.',
      nhmReference: 'Rural Emergency Health Manual'
    });
  }

  return alerts;
}
