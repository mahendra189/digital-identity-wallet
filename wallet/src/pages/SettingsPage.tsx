import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getOrCreateHolderKey, resetWallet } from '../services/storage';
import { HolderKeyPair } from '../services/crypto';
import {
  Shield,
  Key,
  User,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Database,
  LogOut,
} from 'lucide-react';

interface SettingsPageProps {
  currentUser: string | null;
  onLogout: () => void;
  onNotification: (msg: string) => void;
  onResetWallet: () => Promise<void>;
  issuedCount: number;
  uploadedCount: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onLogout,
  onNotification,
  onResetWallet,
  issuedCount,
  uploadedCount,
}) => {
  const [activeTab, setActiveTab] = useState<'security' | 'account' | 'storage'>('security');
  const [holderKey, setHolderKey] = useState<HolderKeyPair | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    getOrCreateHolderKey().then((k) => setHolderKey(k));
  }, []);

  const handleCopyDid = () => {
    if (holderKey?.didJwk) {
      navigator.clipboard.writeText(holderKey.didJwk);
      setCopiedKey(true);
      onNotification('Copied DID:JWK to clipboard.');
      setTimeout(() => setCopiedKey(false), 2500);
    }
  };

  const handleWipeVault = async () => {
    setIsResetting(true);
    try {
      await resetWallet();
      await onResetWallet();
      setIsResetConfirmOpen(false);
      onNotification('Identity vault wiped successfully.');
    } catch {
      onNotification('Failed to reset vault.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>DigiLocker Services</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">Settings & Security</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Settings & Security
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Configure your client-side identity vault, manage cryptographic P-256 keys, and view storage metrics.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onLogout}
          className="border-slate-200 text-slate-700 hover:text-red-600 hover:border-red-200 hover:bg-red-50 gap-2 shrink-0"
        >
          <LogOut className="size-4" />
          Sign Out
        </Button>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="size-4" />
          Hardware Vault & Keys
        </button>

        <button
          onClick={() => setActiveTab('account')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'account'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <User className="size-4" />
          Account & Sessions
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`pb-3 px-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'storage'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="size-4" />
          Data & Local Storage
        </button>
      </div>

      {/* Tab 1: Security & Hardware Keys */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Key className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">
                      Holder Cryptographic Keypair (ECDSA P-256)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Client-generated private key for Selective Disclosure (SD-JWT) key-binding
                    </p>
                  </div>
                </div>

                <Badge variant="success" className="text-[10px]">
                  Active & Non-Extractable
                </Badge>
              </div>

              {/* Key Specs Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Algorithm</span>
                  <span className="font-mono font-bold text-slate-800">ES256 (ECDSA)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Elliptic Curve</span>
                  <span className="font-mono font-bold text-slate-800">NIST P-256 (secp256r1)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Storage Engine</span>
                  <span className="font-mono font-bold text-slate-800">Browser IndexedDB Sandbox</span>
                </div>
              </div>

              {/* Decentralized Identifier */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                  <span>Holder Decentralized Identifier (did:jwk)</span>
                  <button
                    onClick={handleCopyDid}
                    className="text-blue-600 hover:text-blue-700 flex items-center gap-1 font-normal text-[11px]"
                  >
                    {copiedKey ? (
                      <>
                        <Check className="size-3 text-emerald-600" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="size-3" /> Copy DID
                      </>
                    )}
                  </button>
                </label>
                <div className="p-3 bg-slate-900 text-slate-200 rounded-lg font-mono text-[11px] break-all border border-slate-800 select-all">
                  {holderKey?.didJwk || 'Generating key in browser sandbox...'}
                </div>
              </div>

              {/* Public JWK Payload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Public Key JSON Web Key (JWK)</label>
                <pre className="p-3 bg-slate-50 text-slate-800 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-200 max-h-40">
                  {holderKey?.jwk
                    ? JSON.stringify(holderKey.jwk, null, 2)
                    : '// Loading key...'}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Account & Sessions */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <User className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">User Profile</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Your authenticated session in this browser</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500">Username / ID</span>
                  <span className="font-semibold text-slate-900">{currentUser || 'student'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500">Role</span>
                  <span className="font-semibold text-slate-900">Student & Credential Holder</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-100 text-xs">
                  <span className="text-slate-500">Protocol Compliance</span>
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <Check className="size-3" /> OpenID4VCI & OpenID4VP
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Local Storage & Danger Zone */}
      {activeTab === 'storage' && (
        <div className="space-y-6">
          <Card className="bg-white border-slate-200 rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Database className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Vault Storage Breakdown</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Items stored inside local browser IndexedDB</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">Issued Credentials (SD-JWT)</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{issuedCount}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-xs font-semibold text-slate-500">User Uploaded Documents</span>
                  <p className="text-xl font-bold text-slate-900 mt-1">{uploadedCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50/40 rounded-xl overflow-hidden">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <AlertTriangle className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-red-950">Danger Zone: Wipe Local Identity Vault</h3>
                  <p className="text-xs text-red-800 mt-0.5">
                    Irrevocably erase all stored credentials, keys, and uploaded files from this device.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => setIsResetConfirmOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs gap-2 shadow-xs"
                >
                  <Trash2 className="size-4" />
                  Erase and Reset Vault
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Wipe Local Identity Vault?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              This will permanently delete your holder keypair, all issued credentials, uploaded documents,
              and consent logs stored on this device.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={isResetting}
                onClick={() => setIsResetConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isResetting}
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleWipeVault}
              >
                {isResetting ? 'Wiping...' : 'Yes, Wipe Everything'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
