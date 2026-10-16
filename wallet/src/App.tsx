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
  addCredential,
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

  useEffect(() => {
    setCredentials(getStoredCredentials());
    setHistory(getSharedHistory());
  }, []);

  const refreshState = () => {
    setCredentials(getStoredCredentials());
    setHistory(getSharedHistory());
  };

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Handler for QR scan / URI input
  const handleScanPayload = (payload: string) => {
    // Check if it's a presentation request (OpenID4VP)
    if (payload.includes('openid4vp://') || payload.includes('required_claims') || payload.includes('library')) {
      const parsedReq = parsePresentationRequest(payload);
      if (parsedReq) {
        setActivePresentationReq(parsedReq);
        return;
      }
    }

    // Check if it's a credential issuance offer (OpenID4VCI)
    if (payload.includes('openid-credential-offer://') || payload.includes('credential_issuer')) {
      claimCredentialFromOffer('https://certify.college.edu/inji', 'Mahendra Kumar', '2024CS089')
        .then((newCred) => {
          addCredential(newCred);
          refreshState();
          showNotification('🎉 Successfully claimed new Campus ID via OpenID4VCI!');
        });
      return;
    }

    showNotification('⚠️ Unrecognized QR payload. Please provide an OpenID4VP request or OpenID4VCI offer.');
  };

  const handleIssueMock = async () => {
    const newCred = await claimCredentialFromOffer('https://certify.college.edu/inji');
    addCredential(newCred);
    refreshState();
    showNotification('✅ Issued fresh mock Campus ID to wallet vault');
  };

  const sampleScanPresets = [
    {
      label: 'Campus Library Gate Request (Requires Enrollment Status only)',
      payload: 'openid4vp://authorize?client_id=library.campus.edu&client_name=Campus+Central+Library&purpose=Borrowing+privileges+verification&required_claims=enrollment_status,valid_until',
    },
    {
      label: 'Exam Hall Verification (Requires Name, Roll No, Status)',
      payload: 'openid4vp://authorize?client_id=exams.campus.edu&client_name=Academic+Examination+Cell&purpose=Identity+and+admit+card+clearance&required_claims=name,roll_number,enrollment_status,valid_until',
    },
    {
      label: 'OpenID4VCI Issue Offer (State Institute of Tech)',
      payload: 'openid-credential-offer://?credential_issuer=https://certify.college.edu/inji&credential_configuration_ids=CampusID',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      <Navbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onScanClick={() => setIsScannerOpen(true)}
        onClaimDemoClick={handleIssueMock}
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
                  Simulate Verifier Check
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Credentials Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {credentials.map((cred) => (
                <CampusIdCard
                  key={cred.id}
                  credential={cred}
                  onSelect={() => setActiveInspectionCred(cred)}
                  onShare={() => {
                    // Launch mock library verifier request
                    handleScanPayload(sampleScanPresets[0].payload);
                  }}
                />
              ))}
            </div>
          </div>
        ) : (
          <SharedHistoryScreen entries={history} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>Campus ID Digital Identity Wallet &middot; MOSIP Inji Ecosystem &middot; Team 2 Slice</p>
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
        credential={credentials[0] || null}
        onClose={() => setActivePresentationReq(null)}
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
