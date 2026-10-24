import React from 'react';
import { GraduationCap, QrCode, Shield, Calendar, Hash, BookOpen, Trash2 } from 'lucide-react';
import { SDJWTCredential } from '../types/campusId';
import { StatusBadge } from './StatusBadge';

interface CampusIdCardProps {
  credential: SDJWTCredential;
  onSelect?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
}

export const CampusIdCard: React.FC<CampusIdCardProps> = ({ credential, onSelect, onShare, onDelete }) => {
  const { claims, issuer, status } = credential;
  const isExpired = claims.valid_until ? new Date(claims.valid_until).getTime() < new Date().setHours(0,0,0,0) : false;
  const displayStatus = isExpired ? 'expired' : status;

  return (
    <div className={`relative group overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-850 to-emerald-950/40 p-6 border shadow-2xl transition-all duration-300 hover:shadow-emerald-900/20 ${isExpired ? 'border-amber-500/50' : 'border-slate-700/60 hover:border-emerald-500/50'}`}>
      {/* Background watermark icon */}
      <div className="absolute -right-6 -bottom-6 text-white/[0.03] pointer-events-none">
        <GraduationCap className="w-56 h-56" />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-700/40">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shadow-inner">
            {issuer.logo || '🎓'}
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-wide">{issuer.name}</h3>
            <p className="text-xs text-slate-400 font-medium">Digital Campus Credential (SD-JWT)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={displayStatus} />
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete credential ${credential.id} from wallet vault?`)) {
                  onDelete();
                }
              }}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
              title="Delete credential from vault"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Body: Student Attributes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Student Name
          </span>
          <p className="text-lg font-bold text-slate-100 tracking-tight">{claims.name}</p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Hash className="w-3 h-3 text-emerald-400" /> Roll Number
          </span>
          <p className="text-sm font-mono font-bold text-emerald-300 bg-slate-900/60 px-2 py-1 rounded border border-emerald-500/20 inline-block">
            {claims.roll_number}
          </p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" /> Branch / Program
          </span>
          <p className="text-xs text-slate-200 font-medium">{claims.branch}</p>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Valid Until
          </span>
          <p className="text-xs text-slate-200 font-medium font-mono">{claims.valid_until}</p>
        </div>
      </div>

      {/* Footer / Actions */}
      <div className="pt-4 border-t border-slate-700/40 flex items-center justify-between">
        <button
          onClick={onSelect}
          className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Shield className="w-3.5 h-3.5 text-emerald-400" />
          Inspect Crypto Proof
        </button>

        {onShare && (
          <button
            onClick={onShare}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <QrCode className="w-3.5 h-3.5" />
            Present Proof
          </button>
        )}
      </div>
    </div>
  );
};
