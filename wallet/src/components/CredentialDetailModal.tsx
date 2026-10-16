import React from 'react';
import { X, ShieldCheck, Key, FileCode, CheckCircle } from 'lucide-react';
import { SDJWTCredential } from '../types/campusId';

interface CredentialDetailModalProps {
  isOpen: boolean;
  credential: SDJWTCredential | null;
  onClose: () => void;
}

export const CredentialDetailModal: React.FC<CredentialDetailModalProps> = ({
  isOpen,
  credential,
  onClose,
}) => {
  if (!isOpen || !credential) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-6 max-h-[90vh] flex flex-col">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cryptographic Credential Inspection</h3>
            <p className="text-xs text-slate-400 font-mono">{credential.id}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-5 my-4 pr-1 text-xs">
          {/* Metadata Block */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-850 border border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Credential Format</span>
              <span className="font-semibold text-emerald-400 font-mono">SD-JWT (RFC 9537 / W3C VC)</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Algorithm</span>
              <span className="font-semibold text-white font-mono">ES256 (ECDSA P-256 + SHA-256)</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Issuer DID / Authority</span>
              <span className="font-mono text-slate-300 break-all">{credential.issuer.id}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Status List Check</span>
              <span className="font-mono text-emerald-300 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Bitstring Index #{credential.statusList?.index ?? 0}
              </span>
            </div>
          </div>

          {/* Decoded Claims */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-emerald-400" /> Decoded Holder Claims
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-slate-300 overflow-x-auto">
              <pre>{JSON.stringify(credential.claims, null, 2)}</pre>
            </div>
          </div>

          {/* Raw SD-JWT Disclosures */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-emerald-400" /> SD-JWT Salted Disclosures
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-400 overflow-x-auto space-y-1.5">
              {Object.entries(credential.disclosures).map(([k, d]) => (
                <div key={k} className="flex items-center justify-between border-b border-slate-900 pb-1">
                  <span className="text-emerald-400 font-semibold">{k}:</span>
                  <span className="text-slate-500 truncate max-w-xs">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
