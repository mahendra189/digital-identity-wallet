import React, { useState } from 'react';
import { X, QrCode, ArrowRight, Sparkles } from 'lucide-react';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (payload: string) => void;
  title: string;
  placeholder?: string;
  samplePayloads?: Array<{ label: string; payload: string }>;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  title,
  placeholder = 'Paste QR string, OpenID URI, or JSON payload...',
  samplePayloads,
}) => {
  const [inputVal, setInputVal] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      onScan(inputVal.trim());
      setInputVal('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <QrCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-400">Scan via camera simulation or paste URI</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <textarea
              rows={4}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder={placeholder}
              className="w-full rounded-xl bg-slate-950 border border-slate-750 p-3 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-all active:scale-95"
            >
              Process Payload
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        {samplePayloads && samplePayloads.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Demo Presets
            </span>
            <div className="flex flex-col gap-2">
              {samplePayloads.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setInputVal(preset.payload);
                  }}
                  className="text-left text-xs p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/40 transition-colors flex items-center justify-between"
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="text-[10px] text-emerald-400 font-mono">Load</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
