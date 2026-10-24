import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { claimCredentialFromOffer } from '../services/openid4vci';
import {
  DownloadCloud,
  Building2,
  GraduationCap,
  BookOpen,
  Bus,
  Search,
  CheckCircle2,
  ArrowRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface FetchDocumentsPageProps {
  onNavigate: (route: string) => void;
  onRefresh: () => Promise<void>;
  onNotification: (msg: string) => void;
}

interface IssuerItem {
  id: string;
  name: string;
  category: 'Education' | 'Identity' | 'Campus Services' | 'Transport';
  description: string;
  icon: any;
  documents: {
    id: string;
    name: string;
    code: string;
    available: boolean;
  }[];
}

const ISSUERS: IssuerItem[] = [
  {
    id: 'campus-registrar',
    name: 'Office of the Campus Registrar',
    category: 'Education',
    description: 'Official university registry maintaining student enrollment and primary digital IDs.',
    icon: GraduationCap,
    documents: [
      { id: 'campus-id', name: 'Campus Student Identity Card', code: 'CAMPUS_ID', available: true },
      { id: 'enrollment-cert', name: 'Enrollment Verification Certificate', code: 'ENROLL_CERT', available: true },
    ],
  },
  {
    id: 'exam-cell',
    name: 'Academic Evaluation & Examination Cell',
    category: 'Education',
    description: 'Official degree certifications, semester transcripts, and provisional degrees.',
    icon: AwardIcon,
    documents: [
      { id: 'degree-cert', name: 'Degree & Graduation Certificate', code: 'DEGREE_CERT', available: true },
      { id: 'semester-transcript', name: 'Official Semester Grade Sheet', code: 'TRANSCRIPT', available: true },
    ],
  },
  {
    id: 'central-library',
    name: 'Campus Central Library',
    category: 'Campus Services',
    description: 'Library privileges, research access passes, and clearance certificates.',
    icon: BookOpen,
    documents: [
      { id: 'library-card', name: 'Library Borrowing & RFID Pass', code: 'LIB_PASS', available: true },
    ],
  },
  {
    id: 'campus-transport',
    name: 'University Fleet & Transit Authority',
    category: 'Transport',
    description: 'Transit passes for campus shuttle routes and metropolitan bus concessions.',
    icon: Bus,
    documents: [
      { id: 'bus-pass', name: 'Semester Transit Shuttle Pass', code: 'BUS_PASS', available: true },
    ],
  },
];

function AwardIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}

export const FetchDocumentsPage: React.FC<FetchDocumentsPageProps> = ({
  onNavigate,
  onRefresh,
  onNotification,
}) => {
  const [selectedIssuer, setSelectedIssuer] = useState<IssuerItem | null>(ISSUERS[0]);
  const [selectedDocId, setSelectedDocId] = useState<string>(ISSUERS[0].documents[0].id);
  const [rollNumber, setRollNumber] = useState('CS2024-001');
  const [fullName, setFullName] = useState('Alex Rivers');
  const [hasConsent, setHasConsent] = useState(true);

  // Status flow
  const [status, setStatus] = useState<'idle' | 'fetching' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const filteredIssuers = ISSUERS.filter((iss) => {
    const matchesSearch =
      iss.name.toLowerCase().includes(search.toLowerCase()) ||
      iss.documents.some((d) => d.name.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === 'All' || iss.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasConsent) {
      onNotification('Please consent to fetch this document from the issuer.');
      return;
    }

    setStatus('fetching');
    setErrorMessage('');
    setStatusMessage('Connecting to OpenID4VCI Issuer endpoint...');

    try {
      // Step 1: Pre-authorized token exchange
      setStatusMessage('Requesting pre-authorized authorization token...');
      const tokenResp = await fetch('http://localhost:8000/api/v1/issuer/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          pre_authorized_code: 'demo_code',
        }),
      }).catch(() => null);

      if (!tokenResp || !tokenResp.ok) {
        throw new Error('Could not establish connection with Inji Certify backend on http://localhost:8000.');
      }

      // Step 2: Protocol claim with holder key binding
      setStatusMessage('Binding P-256 holder key and fetching SD-JWT credential...');
      const offerUri =
        'openid-credential-offer://?credential_issuer=http://localhost:8000&pre-authorized_code=demo_code';
      const cred = await claimCredentialFromOffer(offerUri);

      // Step 3: Refresh local state
      setStatusMessage('Securing credential in local IndexedDB vault...');
      await onRefresh();

      setStatus('success');
      setStatusMessage(`Successfully issued and anchored "${cred.id}".`);
      onNotification(`Retrieved document from ${selectedIssuer?.name}.`);
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(
        err.message || 'Failed to retrieve document. Verify backend is running on port 8000.'
      );
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>DigiLocker Services</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">Fetch Documents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Fetch Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Directly pull authenticated digital certificates and identity records from verified institutional
            issuers through standard OpenID4VCI protocol.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate('/issued-documents')}
          className="border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          View Issued Documents
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1: Select Issuer (Left Column 5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                1
              </span>
              Select Issuer
            </h2>
            <span className="text-xs text-slate-400">{filteredIssuers.length} available</span>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {['All', 'Education', 'Campus Services', 'Transport'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCat(cat)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-colors ${
                  selectedCat === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="size-3.5 text-slate-400 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search issuers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-xs bg-white"
            />
          </div>

          {/* Issuer List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredIssuers.map((iss) => {
              const IconComp = iss.icon;
              const isSelected = selectedIssuer?.id === iss.id;

              return (
                <div
                  key={iss.id}
                  onClick={() => {
                    setSelectedIssuer(iss);
                    setSelectedDocId(iss.documents[0]?.id || '');
                    setStatus('idle');
                  }}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      <IconComp className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs text-slate-900 truncate">{iss.name}</h3>
                        <Badge
                          variant="secondary"
                          className="text-[9px] py-0 px-1 font-normal uppercase"
                        >
                          {iss.category}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                        {iss.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2 & 3: Configure Request & Consent (Right Column 7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span className="size-5 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                2
              </span>
              Document Details & Consent
            </h2>
          </div>

          {selectedIssuer ? (
            <Card className="bg-white border-slate-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-6 space-y-5">
                {/* Selected Issuer Header Banner */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="size-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                    <Building2 className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-900">{selectedIssuer.name}</h3>
                    <p className="text-[11px] text-slate-500">Inji Certify OpenID4VCI Verified Issuer</p>
                  </div>
                </div>

                <form onSubmit={handleFetch} className="space-y-4">
                  {/* Document Type Dropdown */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold text-slate-700">Select Document Type</Label>
                    <div className="space-y-2">
                      {selectedIssuer.documents.map((doc) => (
                        <label
                          key={doc.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer text-xs transition-colors ${
                            selectedDocId === doc.id
                              ? 'border-blue-600 bg-blue-50/30 font-semibold text-blue-900'
                              : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="document_type"
                              checked={selectedDocId === doc.id}
                              onChange={() => setSelectedDocId(doc.id)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span>{doc.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {doc.code}
                          </Badge>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Required Parameters */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="roll-no" className="text-xs font-semibold text-slate-700">
                        Roll Number / Student ID
                      </Label>
                      <Input
                        id="roll-no"
                        type="text"
                        value={rollNumber}
                        onChange={(e) => setRollNumber(e.target.value)}
                        placeholder="e.g. CS2024-001"
                        className="text-xs h-9 font-mono"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="full-name" className="text-xs font-semibold text-slate-700">
                        Full Name (as registered)
                      </Label>
                      <Input
                        id="full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Alex Rivers"
                        className="text-xs h-9"
                        required
                      />
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={hasConsent}
                        onChange={(e) => setHasConsent(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 size-4"
                      />
                      <span className="text-[11px] text-slate-600 leading-relaxed">
                        I hereby provide my explicit consent to Digital Identity Wallet to request, receive,
                        and cryptographically anchor my credential from the verified issuer under OpenID4VCI
                        specifications.
                      </span>
                    </label>
                  </div>

                  {/* Execution Feedback States */}
                  {status === 'fetching' && (
                    <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-3 text-xs text-blue-900">
                      <Loader2 className="size-4 text-blue-600 animate-spin shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {status === 'success' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                        <CheckCircle2 className="size-4 text-emerald-600" />
                        <span>Document Retrieved Successfully!</span>
                      </div>
                      <p className="text-[11px] text-emerald-800 leading-relaxed">
                        Your verifiable credential has been signed by the issuer and stored into your local
                        IndexedDB vault with hardware key binding.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onNavigate('/issued-documents')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
                      >
                        Go to Issued Documents
                        <ArrowRight className="size-3.5" />
                      </Button>
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
                      <AlertCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold">Retrieval Failed</span>
                        <p className="text-[11px] text-red-700 leading-relaxed">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Submit CTA */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      disabled={status === 'fetching' || !hasConsent}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white h-10 text-xs font-bold gap-2 shadow-sm"
                    >
                      {status === 'fetching' ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Fetching Credential...
                        </>
                      ) : (
                        <>
                          <DownloadCloud className="size-4" />
                          Fetch Document from Issuer
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-8 text-center text-slate-400 bg-white border-slate-200">
              Select an issuer from the left panel to proceed.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
