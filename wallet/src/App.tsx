import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClaimPage } from './pages/ClaimPage';
import { PresentPage } from './pages/PresentPage';
import { HistoryPage } from './pages/HistoryPage';
import { CredentialDetailModal } from './components/CredentialDetailModal';
import { SDJWTCredential } from './types/campusId';
import { VerifierPresentationRequest } from './types/presentation';
import { SharedHistoryEntry } from './types/history';
import { getStoredCredentials, getSharedHistory, deleteCredential } from './services/storage';
import { parsePresentationRequest } from './services/openid4vp';
import { claimCredentialFromOffer } from './services/openid4vci';
import { Check, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('wallet_auth_user') || 'student';
  });

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [credentials, setCredentials] = useState<SDJWTCredential[]>([]);
  const [history, setHistory] = useState<SharedHistoryEntry[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  // Active Presentation / Inspection State
  const [activeInspectionCred, setActiveInspectionCred] = useState<SDJWTCredential | null>(null);
  const [activePresentationReq, setActivePresentationReq] = useState<VerifierPresentationRequest | null>(null);
  const [selectedCredForPresent, setSelectedCredForPresent] = useState<SDJWTCredential | null>(null);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentRoute(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const onPopState = () => {
      setCurrentRoute(window.location.pathname || '/');
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const refreshState = async () => {
    const creds = await getStoredCredentials();
    const hist = await getSharedHistory();
    setCredentials(creds);
    setHistory(hist);
  };

  useEffect(() => {
    refreshState();

    // Ingest URL queries if opened via deep-link or direct portal button
    const params = new URLSearchParams(window.location.search);
    const reqUri = params.get('request');
    const offerUri = params.get('offer');

    if (reqUri) {
      const parsed = parsePresentationRequest(reqUri);
      if (parsed) {
        setActivePresentationReq(parsed);
        navigate('/present');
      }
    } else if (offerUri) {
      navigate('/claim');
    }
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('wallet_auth_user');
    setCurrentUser(null);
    navigate('/login');
    showNotification('Signed out of identity vault.');
  };

  const handleLoginSuccess = (username: string) => {
    setCurrentUser(username);
    navigate('/');
    showNotification(`Welcome back, ${username}.`);
    refreshState();
  };

  const handleDeleteCred = async (id: string) => {
    await deleteCredential(id);
    await refreshState();
    showNotification(`Removed credential ${id}.`);
  };

  const handleIssueDemo = async () => {
    try {
      showNotification('Requesting pre-authorized demo credential...');
      const resp = await fetch('http://localhost:8000/api/v1/issuer/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'urn:ietf:params:oauth:grant-type:pre-authorized_code',
          pre_authorized_code: 'demo_code',
        }),
      }).catch(() => null);

      if (resp && resp.ok) {
        const cred = await claimCredentialFromOffer(
          'openid-credential-offer://?credential_issuer=http://localhost:8000&pre-authorized_code=demo_code'
        );
        await refreshState();
        showNotification(`Claimed ${cred.id} successfully.`);
      } else {
        showNotification('Backend not reachable on http://localhost:8000.');
      }
    } catch (err: any) {
      showNotification(`Issuance error: ${err.message}`);
    }
  };

  // Route Router Logic
  const renderCurrentPage = () => {
    if (!currentUser && currentRoute !== '/register') {
      return (
        <LoginPage
          onLoginSuccess={handleLoginSuccess}
          onNavigate={navigate}
        />
      );
    }

    switch (currentRoute) {
      case '/login':
        return (
          <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onNavigate={navigate}
          />
        );

      case '/register':
        return (
          <RegisterPage
            onRegisterSuccess={handleLoginSuccess}
            onNavigate={navigate}
          />
        );

      case '/claim':
        return (
          <ClaimPage
            onNavigate={navigate}
            onClaimSuccess={async () => {
              await refreshState();
            }}
            onNotification={showNotification}
          />
        );

      case '/present':
        return (
          <PresentPage
            credentials={credentials}
            initialRequest={activePresentationReq}
            selectedCredential={selectedCredForPresent}
            onNavigate={(route) => {
              setActivePresentationReq(null);
              setSelectedCredForPresent(null);
              navigate(route);
            }}
            onSuccess={(msg) => {
              showNotification(msg);
              refreshState();
            }}
          />
        );

      case '/history':
        return <HistoryPage entries={history} onNavigate={navigate} />;

      case '/':
      default:
        return (
          <DashboardPage
            credentials={credentials}
            onNavigate={navigate}
            onSelectCred={(cred) => setActiveInspectionCred(cred)}
            onDeleteCred={handleDeleteCred}
            onPresentCred={(cred) => {
              setSelectedCredForPresent(cred);
              navigate('/present');
            }}
            onIssueDemo={handleIssueDemo}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-950 flex flex-col font-sans">
      {/* Top Navbar */}
      <Header
        currentRoute={currentRoute}
        onNavigate={navigate}
        currentUser={currentUser}
        onLogout={handleLogout}
        credentialsCount={credentials.length}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-16 right-4 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3.5 py-2.5 text-xs font-medium text-zinc-900 shadow-lg">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-zinc-400 hover:text-zinc-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Page Content */}
      <main className="flex-1 w-full">{renderCurrentPage()}</main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-6 text-center text-xs text-zinc-400 bg-white">
        <p>Digital Identity Wallet &middot; OpenID4VCI & OpenID4VP Standard Architecture</p>
      </footer>

      {/* Cryptographic Inspector Modal */}
      <CredentialDetailModal
        isOpen={!!activeInspectionCred}
        credential={activeInspectionCred}
        onClose={() => setActiveInspectionCred(null)}
      />
    </div>
  );
};

export default App;
