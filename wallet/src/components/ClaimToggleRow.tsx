import React from 'react';
import { Eye, EyeOff, Lock } from 'lucide-react';

interface ClaimToggleRowProps {
  label: string;
  claimKey: string;
  value: string;
  enabled: boolean;
  isRequired?: boolean;
  onToggle: (enabled: boolean) => void;
}

export const ClaimToggleRow: React.FC<ClaimToggleRowProps> = ({
  label,
  value,
  enabled,
  isRequired,
  onToggle,
}) => {
  return (
    <div
      onClick={() => onToggle(!enabled)}
      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
        enabled
          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-100 shadow-sm'
          : 'bg-slate-800/40 border-slate-700/50 text-slate-400 opacity-70'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-1.5 rounded-lg mt-0.5 ${enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-500'}`}>
          {enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">{label}</span>
            {isRequired && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-0.5">
                <Lock className="w-2.5 h-2.5" /> Required by verifier
              </span>
            )}
          </div>
          <p className="text-xs font-mono font-medium text-slate-400 mt-0.5">
            {enabled ? value : '•••••••••••• (Withheld)'}
          </p>
        </div>
      </div>

      {/* Switch Toggle */}
      <div
        className={`w-11 h-6 flex items-center rounded-full p-1 duration-300 ease-in-out ${
          enabled ? 'bg-emerald-500' : 'bg-slate-700'
        }`}
      >
        <div
          className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${
            enabled ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
};
