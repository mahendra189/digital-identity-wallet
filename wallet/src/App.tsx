import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CampusIdCard } from './components/CampusIdCard';
import { QRScannerModal } from './components/QRScannerModal';
import { SharingConsentModal } from './screens/SharingConsentModal';
import { SharedHistoryScreen } from './screens/SharedHistoryScreen';
import { CredentialDetailModal } from './components/CredentialDetailModal';
import { SDJWTCredential } from './types/campusId';
import { VerifierPresentationRequest } from './types/presentation';
import { SharedHistoryEntry } from './types/history';
import {
  getStoredCredentials,
  getSharedHistory,
  saveCredential,
  deleteCredential,
} from './services/storage';
import { parsePresentationRequest } from './services/openid4vp';
import { claimCredentialFromOffer } from './services/openid4vci';
import { Sparkles, Shield, ArrowUpRight } from 'lucide-react';

export const App: React.FC = () => {
  const [credentials, setCredentials] = useState<SDJWTCredential[]>([]);
  const [history, setHistory] = useState<SharedHistoryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'cards' | 'history'>('cards');

  // Modals state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeInspectionCred, setActiveInspectionCred] = useState<SDJWTCredential | null>(null);
  const [activePresentationReq, setActivePresentationReq] = useState<VerifierPresentationRequest | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  const [selectedCredId, setSelectedCredId] = useState<string | null>(null);

  const refreshState = async () => {
    const creds = await getStoredCredentials();
    const hist = await getSharedHistory();
    setCredentials(creds);
    setHistory(hist);
  };

  const handleDeleteCredential = async (id: string) => {
    await deleteCredential(id);
    await refreshState();
    showNotification(`🗑️ Credential ${id} removed from vault.`);
  };

  // Automatically select an unexpired credential, or the chosen one, or the latest
  const credentialToPresent =
    credentials.find((c) => c.id === selectedCredId) ||
    credentials.find((c) => {
      if (!c.claims.valid_until) return true;
      return new Date(c.claims.valid_until).getTime() >= new Date().setHours(0, 0, 0, 0);
    }) ||
    credentials[0] ||
    null;

  useEffect(() => {
    refreshState();

    // Check if opened with a direct request or offer in URL query
    const params = new URLSearchParams(window.location.search);
    const reqUri = params.get('request');
    const offerUri = params.get('offer');
    if (reqUri) {
      handleScanPayload(reqUri);
    } else if (offerUri) {
      handleScanPayload(offerUri);
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handler for QR scan / URI input
  const handleScanPayload = async (payload: string) => {
    const trimmed = payload.trim();

    // Check if it's a presentation request (OpenID4VP)
    if (trimmed.includes('openid4vp') || trimmed.includes('required_claims') || trimmed.includes('response_uri')) {
      const parsedReq = parsePresentationRequest(trimmed);
      if (parsedReq) {
        if (credentials.length === 0) {
          showNotification('⚠️ No credentials in your wallet vault! Please issue/claim a credential before presenting.');
          return;
        }
        setActivePresentationReq(parsedReq);
        return;
      }
    }

    // Check if it's a credential issuance offer (OpenID4VCI)
    if (trimmed.includes('openid-credential-offer://') || trimmed.includes('credential_issuer') || trimmed.includes('pre-authorized_code')) {
      try {
        showNotification('⏳ Contacting issuer and claiming credential via OpenID4VCI...');
        const newCred = await claimCredentialFromOffer(trimmed);
        await saveCredential(newCred);
        await refreshState();
        showNotification(`🎉 Successfully claimed Campus ID for ${newCred.claims.name} (${newCred.id})!`);
      } catch (err: any) {
        showNotification(`❌ Issuance failed: ${err.message}`);
      }
      return;
    }

    showNotification('⚠️ Unrecognized QR payload. Please provide an OpenID4VP request or OpenID4VCI offer.');
  };

  const handleIssueDemo = async () => {
    try {
      showNotification('⏳ Requesting credential offer from campus backend...');
      const resp = await fetch('http://localhost:8000/api/v1/issuer/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          pre_authorized_code: 'demo_code',
        }),
      }).catch(() => null);

      if (resp && resp.ok) {
        const cred = await claimCredentialFromOffer('openid-credential-offer://?credential_issuer=http://localhost:8000&pre-authorized_code=demo_code');
        await refreshState();
        showNotification(`✅ Successfully issued ${cred.id} via local OpenID4VCI service!`);
      } else {
        showNotification('⚠️ Backend not reachable on http://localhost:8000. Start backend to issue live credentials.');
      }
    } catch (err: any) {
      showNotification(`❌ Issuance error: ${err.message}`);
    }
  };

  const sampleScanPresets = [
    {
      label: 'Campus Library Gate Request (Requires Enrollment Status only)',
      payload: 'openid4vp://authorize?client_id=campus-verifier&client_name=Campus+Central+Library&purpose=Borrowing+privileges+verification&required_claims=enrollment_status,valid_until&response_uri=http://localhost:8000/api/v1/presentation',
    },
    {
      label: 'Exam Hall Verification (Requires Name, Roll No, Status)',
      payload: 'openid4vp://authorize?client_id=campus-verifier&client_name=Academic+Examination+Cell&purpose=Identity+and+admit+card+clearance&required_claims=name,roll_number,enrollment_status,valid_until&response_uri=http://localhost:8000/api/v1/presentation',
    },
    {
      label: 'Live Campus Backend Offer (OpenID4VCI)',
      payload: 'openid-credential-offer://?credential_issuer=http://localhost:8000&credential_configuration_ids=CampusID',
    },
  ];


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onScanClick={() => setIsScannerOpen(true)}
        onClaimDemoClick={handleIssueDemo}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 duration-200">
          <div className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
            <Sparkles className="w-4 h-4 shrink-0" />
            {notification}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8">
        {activeTab === 'cards' ? (
          <div className="space-y-8">
            {/* Hero / Quick Explainer */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-850 to-slate-900 border border-emerald-500/20 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5" /> Privacy-First Self-Sovereign Identity
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight">Your Digital Campus Credentials</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Cryptographically signed by your college via <strong>Inji Certify</strong>. Present only what is needed using <strong>SD-JWT</strong> selective disclosure.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsScannerOpen(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                >
                  Verify or Scan QR
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Credentials Grid */}
            {credentials.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-2xl">
                <p className="text-sm text-slate-400">No credentials currently in wallet vault.</p>
                <p className="text-xs text-slate-500 mt-1">Scan an OpenID4VCI credential offer QR code from the Admin Portal to receive your Campus ID.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {credentials.map((cred) => (
                  <CampusIdCard
                    key={cred.id}
                    credential={cred}
                    onSelect={() => setActiveInspectionCred(cred)}
                    onDelete={() => handleDeleteCredential(cred.id)}
                    onShare={() => {
                      setSelectedCredId(cred.id);
                      setIsScannerOpen(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <SharedHistoryScreen entries={history} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Campus ID Digital Identity Wallet &middot; MOSIP Inji Ecosystem</p>
      </footer>

      {/* Modals */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanPayload}
        title="Scan OpenID4VP / OpenID4VCI QR Code"
        samplePayloads={sampleScanPresets}
      />

      <SharingConsentModal
        isOpen={!!activePresentationReq}
        request={activePresentationReq}
        credential={credentialToPresent}
        onClose={() => {
          setActivePresentationReq(null);
          setSelectedCredId(null);
        }}
        onSuccess={(msg) => {
          showNotification(msg);
          refreshState();
        }}
      />

      <CredentialDetailModal
        isOpen={!!activeInspectionCred}
        credential={activeInspectionCred}
        onClose={() => setActiveInspectionCred(null)}
      />
    </div>
  );
};

export default App;
