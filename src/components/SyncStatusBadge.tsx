import React from 'react';
import { SyncStatus } from '../types/clinical';

interface Props {
  status: SyncStatus;
  revision?: number;
  className?: string;
  onClick?: () => void;
}

export const SyncStatusBadge: React.FC<Props> = ({ status, revision, className = '', onClick }) => {
  let badgeStyles = '';
  let content = '';

  switch (status) {
    case 'LOCAL':
      badgeStyles = 'bg-canvas border-stonehairline text-stone-600';
      content = '● LOCAL ONLY';
      break;
    case 'PENDING':
      badgeStyles = 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse';
      content = '↻ OUTBOX QUEUED';
      break;
    case 'SYNCED':
      badgeStyles = 'bg-emerald-50/80 border-emerald-300 text-emerald-800';
      content = `✓ VERIFIED v${revision ?? 1}`;
      break;
    case 'CONFLICT':
      badgeStyles = 'bg-rose-50 border-rose-400 text-rose-900 font-bold';
      content = '! REVISION CONFLICT';
      break;
  }

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono tracking-wider uppercase border rounded-sm tabular-nums transition-all ${
        onClick ? 'cursor-pointer hover:brightness-95 active:scale-95' : ''
      } ${badgeStyles} ${className}`}
      title={status === 'CONFLICT' ? 'Click to open 3-Way Conflict Resolver' : undefined}
    >
      {content}
    </span>
  );
};
