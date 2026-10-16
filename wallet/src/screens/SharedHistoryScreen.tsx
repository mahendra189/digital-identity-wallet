import React from 'react';
import { History, ShieldCheck, ShieldX, Building2, Calendar, Eye, EyeOff } from 'lucide-react';
import { SharedHistoryEntry } from '../types/history';

interface SharedHistoryScreenProps {
  entries: SharedHistoryEntry[];
  onClear?: () => void;
}

export const SharedHistoryScreen: React.FC<SharedHistoryScreenProps> = ({ entries }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" />
            Local Sharing Audit Log
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Private, on-device history of all presentations and selective disclosures.
          </p>
        </div>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
          {entries.length} Event{entries.length === 1 ? '' : 's'}
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-850/60 border border-slate-800">
          <History className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">No sharing events yet</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            When you present your Campus ID to a library, gate, or exam hall verifier, the event will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="p-5 rounded-2xl bg-slate-850 border border-slate-750/70 hover:border-slate-600/70 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-800 text-emerald-400 border border-slate-700 mt-0.5">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {entry.verifierName}
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                        {entry.verifierDomain}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{entry.purpose}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0">
                  {entry.outcome === 'ACCEPTED' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" /> Shared
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20">
                      <ShieldX className="w-3.5 h-3.5" /> Rejected
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-slate-500 mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Claims Breakdown */}
              <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/20">
                  <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <Eye className="w-3 h-3" /> Disclosed Attributes ({entry.disclosedClaims.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {entry.disclosedClaims.length > 0 ? (
                      entry.disclosedClaims.map((c) => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-1">
                    <EyeOff className="w-3 h-3" /> Withheld Attributes ({entry.withheldClaims.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {entry.withheldClaims.length > 0 ? (
                      entry.withheldClaims.map((c) => (
                        <span key={c} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">None</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
