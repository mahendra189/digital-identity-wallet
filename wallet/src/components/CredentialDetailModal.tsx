import React from 'react';
import { X, ShieldCheck, Key, FileCode } from 'lucide-react';
import { SDJWTCredential } from '../types/campusId';
import { Button } from './ui/button';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-xl bg-white border border-zinc-200 shadow-xl p-6 max-h-[90vh] flex flex-col text-zinc-950">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        >
          <X className="size-4" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
          <div className="p-2 rounded-lg bg-zinc-100 text-zinc-800">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-zinc-900">Cryptographic Credential Details</h3>
            <p className="text-xs text-zinc-500 font-mono">{credential.id}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-1 text-xs">
          {/* Metadata Block */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs">
            <div>
              <span className="text-zinc-500 block mb-0.5 text-[11px]">Format</span>
              <span className="font-mono font-medium text-zinc-900">SD-JWT (RFC 9537)</span>
            </div>
            <div>
              <span className="text-zinc-500 block mb-0.5 text-[11px]">Signature Algorithm</span>
              <span className="font-mono font-medium text-zinc-900">ES256 (ECDSA P-256 + SHA-256)</span>
            </div>
            <div className="col-span-2">
              <span className="text-zinc-500 block mb-0.5 text-[11px]">Issuer Authority</span>
              <span className="font-mono text-zinc-800 break-all">{credential.issuer.id}</span>
            </div>
          </div>

          {/* Disclosed Fields */}
          <div>
            <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
              <Key className="size-3.5 text-zinc-600" />
              Selective Disclosures
            </h4>
            <div className="space-y-1.5">
              {Object.entries(credential.disclosures || {}).map(([key, rawValue]) => (
                <div
                  key={key}
                  className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]"
                >
                  <span className="font-medium text-zinc-800">{key}</span>
                  <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                    <span>Value: <strong className="text-zinc-900">{String(credential.claims[key as keyof typeof credential.claims] || rawValue)}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Raw SD-JWT Envelope */}
          <div>
            <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-1.5">
              <FileCode className="size-3.5 text-zinc-600" />
              Raw SD-JWT Token
            </h4>
            <pre className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-[10px] font-mono text-zinc-700 break-all whitespace-pre-wrap max-h-32 overflow-y-auto">
              {credential.rawSDJWT}
            </pre>
          </div>
        </div>

        <div className="pt-3 border-t border-zinc-100 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
