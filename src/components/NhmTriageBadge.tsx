import React from 'react';
import { AlertTriangle, AlertCircle } from 'lucide-react';
import { PatientRecord } from '../types/clinical';
import { evaluateNhmTriage, TriageAlert } from '../services/clinicalTriage';

interface Props {
  patient?: PatientRecord;
  alerts?: TriageAlert[];
  compact?: boolean;
}

export const NhmTriageBadge: React.FC<Props> = ({ patient, alerts: providedAlerts, compact = false }) => {
  const alerts = providedAlerts || (patient ? evaluateNhmTriage(patient) : []);

  if (alerts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 my-1">
      {alerts.map(alert => (
        <span
          key={alert.id}
          title={`${alert.protocolDescription} (${alert.nhmReference})`}
          className={`inline-flex items-center gap-1 font-mono uppercase tracking-wider rounded-xs border tabular-nums transition-all ${
            compact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[10px]'
          } ${
            alert.severity === 'CRITICAL'
              ? 'bg-rose-50 border-rose-300 text-rose-900 font-bold'
              : 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
          }`}
        >
          {alert.severity === 'CRITICAL' ? (
            <AlertTriangle className="w-2.5 h-2.5 text-red-700 shrink-0" />
          ) : (
            <AlertCircle className="w-2.5 h-2.5 text-amber-700 shrink-0" />
          )}
          <span>{alert.label}</span>
        </span>
      ))}
    </div>
  );
};
