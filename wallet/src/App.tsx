import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { MyDocumentsPage } from './pages/MyDocumentsPage';
import { IssuedDocumentsPage } from './pages/IssuedDocumentsPage';
import { FetchDocumentsPage } from './pages/FetchDocumentsPage';
import { SharedDocumentsPage } from './pages/SharedDocumentsPage';
import { IssuersPage } from './pages/IssuersPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ClaimPage } from './pages/ClaimPage';
import { PresentPage } from './pages/PresentPage';
import { CredentialDetailModal } from './components/CredentialDetailModal';
import { SDJWTCredential } from './types/campusId';
import { VerifierPresentationRequest } from './types/presentation';
import { SharedHistoryEntry } from './types/history';
import {
  getStoredCredentials,
  getSharedHistory,
  deleteCredential,
  getUploadedDocuments,
  saveUploadedDocument,
  deleteUploadedDocument,
  UploadedDocument,
} from './services/storage';
import { parsePresentationRequest } from './services/openid4vp';
import { Check, X } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
    return localStorage.getItem('wallet_auth_user') || 'student';
  });

  const [currentRoute, setCurrentRoute] = useState<string>(() => {
    return window.location.pathname || '/';
  });

  const [credentials, setCredentials] = useState<SDJWTCredential[]>([]);
  const [uploads, setUploads] = useState<UploadedDocument[]>([]);
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
    const upDocs = await getUploadedDocuments();
    const hist = await getSharedHistory();
    setCredentials(creds);
    setUploads(upDocs);
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
    navigate('/');
    showNotification('Signed out of identity vault.');
  };

  const handleLoginSuccess = (username: string) => {
    localStorage.setItem('wallet_auth_user', username);
    setCurrentUser(username);
    navigate('/dashboard');
    showNotification(`Welcome back, ${username}.`);
    refreshState();
  };

  const handleDeleteCred = async (id: string) => {
    await deleteCredential(id);
    await refreshState();
    showNotification(`Removed credential ${id}.`);
  };

  const handleSaveUpload = async (doc: UploadedDocument) => {
    await saveUploadedDocument(doc);
    await refreshState();
  };

  const handleDeleteUpload = async (id: string) => {
    await deleteUploadedDocument(id);
    await refreshState();
  };

  // If unauthenticated:
  if (!currentUser) {
    if (currentRoute === '/login') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
          <LoginPage onLoginSuccess={handleLoginSuccess} onNavigate={navigate} />
        </div>
      );
    }
    if (currentRoute === '/register') {
      return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
          <RegisterPage onRegisterSuccess={handleLoginSuccess} onNavigate={navigate} />
        </div>
      );
    }
    // Public DigiLocker Landing Page
    return <LandingPage onNavigate={navigate} />;
  }

  // If authenticated, route inside the AppShell layout:
  const renderShellContent = () => {
    switch (currentRoute) {
      case '/my-documents':
        return (
          <MyDocumentsPage
            documents={uploads}
            onUpload={handleSaveUpload}
            onDelete={handleDeleteUpload}
            onNotification={showNotification}
          />
        );

      case '/issued-documents':
        return (
          <IssuedDocumentsPage
            credentials={credentials}
            onNavigate={navigate}
            onSelectCred={(cred) => setActiveInspectionCred(cred)}
            onDeleteCred={handleDeleteCred}
            onPresentCred={(cred) => {
              setSelectedCredForPresent(cred);
              navigate('/present');
            }}
          />
        );

      case '/fetch-documents':
        return (
          <FetchDocumentsPage
            onNavigate={navigate}
            onRefresh={refreshState}
            onNotification={showNotification}
          />
        );

      case '/shared-documents':
        return (
          <SharedDocumentsPage
            entries={history}
            onNavigate={navigate}
            onNotification={showNotification}
          />
        );

      case '/issuers':
        return <IssuersPage onNavigate={navigate} />;

      case '/history':
        return <HistoryPage entries={history} onNavigate={navigate} />;

      case '/settings':
        return (
          <SettingsPage
            currentUser={currentUser}
            onLogout={handleLogout}
            onNotification={showNotification}
            onResetWallet={refreshState}
            issuedCount={credentials.length}
            uploadedCount={uploads.length}
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

      case '/':
      case '/dashboard':
      default:
        return (
          <DashboardPage
            currentUser={currentUser}
            credentials={credentials}
            uploads={uploads}
            sharedCount={history.length}
            onNavigate={navigate}
            onSelectCred={(cred) => setActiveInspectionCred(cred)}
            onPresentCred={(cred) => {
              setSelectedCredForPresent(cred);
              navigate('/present');
            }}
          />
        );
    }
  };

  return (
    <AppShell
      currentRoute={currentRoute === '/' ? '/dashboard' : currentRoute}
      onNavigate={navigate}
      currentUser={currentUser}
      onLogout={handleLogout}
      issuedCount={credentials.length}
      uploadedCount={uploads.length}
      sharedCount={history.length}
    >
      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed top-18 right-6 z-50 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-900 shadow-xl">
            <Check className="size-4 text-emerald-600 shrink-0" />
            <span>{notification}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 text-slate-400 hover:text-slate-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Primary Page Content */}
      <div className="pb-16">{renderShellContent()}</div>

      {/* Cryptographic Inspector Modal */}
      <CredentialDetailModal
        isOpen={!!activeInspectionCred}
        credential={activeInspectionCred}
        onClose={() => setActiveInspectionCred(null)}
      />
    </AppShell>
  );
};

export default App;
