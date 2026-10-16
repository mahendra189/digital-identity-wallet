import React from 'react';
import { Wallet, QrCode, History, PlusCircle, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  activeTab: 'cards' | 'history';
  onTabChange: (tab: 'cards' | 'history') => void;
  onScanClick: () => void;
  onClaimDemoClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onTabChange,
  onScanClick,
  onClaimDemoClick,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Inji Web Wallet
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                Team 2
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">Privacy-First Campus Identity Vault</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-slate-850 p-1 rounded-xl border border-slate-750">
          <button
            onClick={() => onTabChange('cards')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'cards'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            My Credentials
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Sharing History
          </button>
        </nav>

        {/* Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onClaimDemoClick}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
            Issue Mock ID
          </button>

          <button
            onClick={onScanClick}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950 transition-all active:scale-95"
          >
            <QrCode className="w-4 h-4" />
            Scan / Present
          </button>
        </div>
      </div>
    </header>
  );
};
