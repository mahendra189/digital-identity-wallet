import React from 'react';
import { ShieldCheck, ShieldAlert, Clock } from 'lucide-react';

interface StatusBadgeProps {
  status: 'valid' | 'revoked' | 'expired' | 'ACTIVE' | 'REVOKED' | 'SUSPENDED' | 'GRADUATED';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const normalized = status.toLowerCase();

  if (normalized === 'valid' || normalized === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
        <ShieldCheck className="w-3.5 h-3.5" />
        Valid & Active
      </span>
    );
  }

  if (normalized === 'revoked' || normalized === 'suspended') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
        <ShieldAlert className="w-3.5 h-3.5" />
        Revoked
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <Clock className="w-3.5 h-3.5" />
      Expired
    </span>
  );
};
