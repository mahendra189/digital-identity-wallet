import React, { useState } from 'react';
import { X, CheckCircle2, Building2, Send } from 'lucide-react';
import { VerifierPresentationRequest } from '../types/presentation';
import { SDJWTCredential, CampusIdClaims } from '../types/campusId';
import { ClaimToggleRow } from '../components/ClaimToggleRow';
import { submitPresentationProof } from '../services/openid4vp';
import { logSharedHistory } from '../services/storage';

interface SharingConsentModalProps {
  isOpen: boolean;
  request: VerifierPresentationRequest | null;
  credential: SDJWTCredential | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export const SharingConsentModal: React.FC<SharingConsentModalProps> = ({
  isOpen,
  request,
  credential,
  onClose,
  onSuccess,
}) => {
  // All hooks must run unconditionally before any early return
  const [selectedClaims, setSelectedClaims] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Synchronize selected claims whenever request changes
  React.useEffect(() => {
    if (request) {
      const initial: Record<string, boolean> = {};
      (request.requiredClaims || []).forEach((c) => (initial[c] = true));
      if (request.optionalClaims) {
        request.optionalClaims.forEach((c) => (initial[c] = false));
      }
      setSelectedClaims(initial);
      setErrorMessage(null);
    }
  }, [request]);

  if (!isOpen || !request || !credential) return null;

  const handleToggle = (claimKey: string, enabled: boolean) => {
    setSelectedClaims((prev) => ({
      ...prev,
      [claimKey]: enabled,
    }));
  };

  const handleApprove = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const allowed = Object.entries(selectedClaims)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key as keyof CampusIdClaims);

      const result = await submitPresentationProof(request, credential, allowed);
      onSuccess(result.message);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit presentation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    logSharedHistory({
      verifierName: request.verifier.name,
      verifierDomain: request.verifier.domain,
      purpose: request.verifier.purpose,
      disclosedClaims: [],
      withheldClaims: ['name', 'roll_number', 'branch', 'enrollment_status', 'valid_until'],
      outcome: 'REJECTED',
    });
    onClose();
  };


  const claimLabels: Record<keyof CampusIdClaims, string> = {
    name: 'Full Name',
    roll_number: 'Roll Number (Student ID)',
    branch: 'Academic Branch',
    enrollment_status: 'Enrollment Status',
    valid_until: 'Validity Date',
    photo: 'Student Photograph',
  };

  const allAvailableClaims = Array.from(
    new Set([...request.requiredClaims, ...(request.optionalClaims || [])])
  ) as Array<keyof CampusIdClaims>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl p-6 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={handleReject}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header: Verifier Profile */}
        <div className="flex items-start gap-4 pb-4 border-b border-slate-800">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">{request.verifier.name}</h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700">
                {request.verifier.domain}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{request.verifier.purpose}</p>
          </div>
        </div>

        {/* Privacy Notice Banner */}
        <div className="my-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex items-start gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong className="text-emerald-300">Holder-Controlled Selective Disclosure:</strong> You choose which fields are revealed. Unchecked attributes will remain cryptographically concealed from the verifier.
          </p>
        </div>

        {errorMessage && (
          <div className="mb-3 p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300">
            <strong>Verification Error:</strong> {errorMessage}
          </div>
        )}


        {/* Selective Disclosure Toggles */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 my-2">
          {allAvailableClaims.map((claimKey) => {
            const val = credential.claims[claimKey];
            if (!val) return null;
            const isReq = request.requiredClaims.includes(claimKey);

            return (
              <ClaimToggleRow
                key={claimKey}
                claimKey={claimKey}
                label={claimLabels[claimKey]}
                value={String(val)}
                enabled={!!selectedClaims[claimKey]}
                isRequired={isReq}
                onToggle={(en) => handleToggle(claimKey, en)}
              />
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleReject}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors"
          >
            Reject Request
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-all active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            {isSubmitting ? 'Signing Presentation...' : 'Authorize & Present Proof'}
          </button>
        </div>
      </div>
    </div>
  );
};
