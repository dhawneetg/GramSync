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
      badgeStyles = 'bg-[#F3F4F6] border-[#9CA3AF] text-[#374151]';
      content = '● LOCAL ONLY';
      break;
    case 'PENDING':
      badgeStyles = 'bg-[#FEF3C7] border-[#D97706] text-[#92400E] animate-pulse';
      content = '↻ OUTBOX QUEUED';
      break;
    case 'SYNCED':
      badgeStyles = 'bg-[#DCFCE7] border-[#15803D] text-[#14532D]';
      content = `✓ VERIFIED v${revision ?? 1}`;
      break;
    case 'CONFLICT':
      badgeStyles = 'bg-[#FEE2E2] border-[#B91C1C] text-[#7F1D1D] font-bold ring-1 ring-red-400';
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
