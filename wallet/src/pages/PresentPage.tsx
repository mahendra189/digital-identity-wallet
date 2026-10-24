import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { VerifierPresentationRequest } from '../types/presentation';
import { SDJWTCredential, CampusIdClaims } from '../types/campusId';
import { parsePresentationRequest, submitPresentationProof } from '../services/openid4vp';
import { ArrowLeft, AlertCircle, Building2, Lock, Eye, EyeOff } from 'lucide-react';

interface PresentPageProps {
  credentials: SDJWTCredential[];
  initialRequest?: VerifierPresentationRequest | null;
  selectedCredential?: SDJWTCredential | null;
  onNavigate: (route: string) => void;
  onSuccess: (msg: string) => void;
}

export const PresentPage: React.FC<PresentPageProps> = ({
  credentials,
  initialRequest,
  selectedCredential,
  onNavigate,
  onSuccess,
}) => {
  const [requestInput, setRequestInput] = useState('');
  const [activeRequest, setActiveRequest] = useState<VerifierPresentationRequest | null>(initialRequest || null);
  const [selectedCred, setSelectedCred] = useState<SDJWTCredential | null>(
    selectedCredential || credentials[0] || null
  );

  const [selectedClaims, setSelectedClaims] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRequest) {
      setActiveRequest(initialRequest);
    }
  }, [initialRequest]);

  useEffect(() => {
    if (activeRequest) {
      const initial: Record<string, boolean> = {};
      (activeRequest.requiredClaims || []).forEach((c) => (initial[c] = true));
      if (activeRequest.optionalClaims) {
        activeRequest.optionalClaims.forEach((c) => (initial[c] = false));
      }
      setSelectedClaims(initial);
      setError(null);
    }
  }, [activeRequest]);

  const handleParseRequest = () => {
    setError(null);
    if (!requestInput.trim()) {
      setError('Please paste an OpenID4VP request URI or JSON.');
      return;
    }
    const parsed = parsePresentationRequest(requestInput.trim());
    if (!parsed) {
      setError('Could not parse OpenID4VP request. Please ensure it is a valid openid4vp:// URI.');
      return;
    }
    setActiveRequest(parsed);
  };

  const handleToggleClaim = (claim: string) => {
    if (activeRequest?.requiredClaims.includes(claim as any)) return; // Cannot disable required claims
    setSelectedClaims((prev) => ({
      ...prev,
      [claim]: !prev[claim],
    }));
  };

  const handleSubmit = async () => {
    if (!activeRequest || !selectedCred) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const allowed = Object.entries(selectedClaims)
        .filter(([_, enabled]) => enabled)
        .map(([key]) => key as keyof CampusIdClaims);

      const res = await submitPresentationProof(activeRequest, selectedCred, allowed);
      onSuccess(res.message);
      onNavigate('/');
    } catch (err: any) {
      setError(err.message || 'Verification submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimLabels: Record<string, string> = {
    name: 'Full Name',
    roll_number: 'Roll Number (Student ID)',
    branch: 'Academic Program / Branch',
    enrollment_status: 'Enrollment Status',
    valid_until: 'Validity Date',
  };

  const allClaims = activeRequest
    ? Array.from(new Set([...activeRequest.requiredClaims, ...(activeRequest.optionalClaims || [])]))
    : [];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => onNavigate('/')} className="size-8 p-0">
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">Present & Verify</h1>
          <p className="text-xs text-zinc-500">Selectively disclose identity attributes to verifiers via OpenID4VP</p>
        </div>
      </div>

      {/* Step 1: Input Request URI (if none loaded) */}
      {!activeRequest ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Enter OpenID4VP Authorization Request</CardTitle>
            <CardDescription>
              Paste the request link provided by the Campus Verifier portal (`http://localhost:8000/verifier/`).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="requestUri">Request URI</Label>
              <textarea
                id="requestUri"
                rows={3}
                value={requestInput}
                onChange={(e) => setRequestInput(e.target.value)}
                placeholder="openid4vp://authorize?client_id=campus-verifier&nonce=..."
                className="w-full rounded-md border border-zinc-200 bg-white p-3 text-xs font-mono text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
              />
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRequestInput(
                    'openid4vp://authorize?client_id=campus-verifier&client_name=Campus+Central+Library&purpose=Borrowing+privileges+verification&required_claims=enrollment_status,valid_until&response_uri=http://localhost:8000/api/v1/presentation'
                  );
                }}
                className="text-xs"
              >
                Sample Library Request
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setRequestInput(
                    'openid4vp://authorize?client_id=campus-verifier&client_name=Academic+Examination+Cell&purpose=Identity+and+admit+card+clearance&required_claims=name,roll_number,enrollment_status,valid_until&response_uri=http://localhost:8000/api/v1/presentation'
                  );
                }}
                className="text-xs"
              >
                Sample Exam Cell Request
              </Button>
            </div>
          </CardContent>

          <CardFooter className="border-t border-zinc-100 pt-4 flex justify-end">
            <Button size="sm" onClick={handleParseRequest} disabled={!requestInput.trim()}>
              Process Request
            </Button>
          </CardFooter>
        </Card>
      ) : (
        /* Step 2: Selective Disclosure Consent Interface */
        <Card>
          <CardHeader className="border-b border-zinc-100 pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-500">
                  <Building2 className="size-3.5" />
                  <span>{activeRequest.verifier.domain}</span>
                </div>
                <CardTitle className="text-lg">{activeRequest.verifier.name}</CardTitle>
                <CardDescription>{activeRequest.verifier.purpose}</CardDescription>
              </div>

              <Button variant="ghost" size="sm" onClick={() => setActiveRequest(null)} className="text-xs">
                Change request
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 pt-5">
            {error && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Select Credential (if multiple) */}
            {credentials.length > 1 && (
              <div className="space-y-1.5">
                <Label htmlFor="credSelect">Select Credential to Present</Label>
                <select
                  id="credSelect"
                  value={selectedCred?.id || ''}
                  onChange={(e) => {
                    const c = credentials.find((item) => item.id === e.target.value);
                    if (c) setSelectedCred(c);
                  }}
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950"
                >
                  {credentials.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.claims.name} ({c.claims.roll_number}) — {c.id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Selective Disclosure Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                  Selective Attribute Disclosure
                </Label>
                <span className="text-[11px] text-zinc-500">Toggle fields to share or withhold</span>
              </div>

              <div className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 bg-white overflow-hidden">
                {allClaims.map((claim) => {
                  const isRequired = activeRequest.requiredClaims.includes(claim as any);
                  const isDisclosed = selectedClaims[claim] ?? isRequired;
                  const value = selectedCred?.claims[claim as keyof CampusIdClaims] || 'N/A';

                  return (
                    <div
                      key={claim}
                      onClick={() => handleToggleClaim(claim)}
                      className={`p-3 flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isDisclosed ? 'bg-zinc-50/50' : 'bg-white hover:bg-zinc-50/30'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-zinc-900">
                            {claimLabels[claim] || claim}
                          </span>
                          {isRequired && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1.5 text-zinc-600 bg-zinc-50">
                              Mandatory
                            </Badge>
                          )}
                        </div>
                        <span className="text-zinc-500 font-mono text-[11px]">{String(value)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isDisclosed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <Eye className="size-3" /> Disclosed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-medium bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
                            <EyeOff className="size-3" /> Withheld
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-3 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-600 space-y-1">
              <div className="flex items-center gap-1.5 font-medium text-zinc-900">
                <Lock className="size-3.5" /> Cryptographic Key-Binding Guarantee
              </div>
              <p className="text-zinc-500 leading-relaxed text-[11px]">
                Your device will compute an RFC 9537 `sd_hash` covering strictly the disclosed attributes and sign a single-use Key-Binding JWT (`kb+jwt`) bound to nonce <code className="font-mono text-zinc-800">{activeRequest.nonce}</code>.
              </p>
            </div>
          </CardContent>

          <CardFooter className="border-t border-zinc-100 pt-4 flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/')}>
              Cancel
            </Button>

            <Button size="sm" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Signing & Dispatching...' : 'Approve & Present Proof'}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
