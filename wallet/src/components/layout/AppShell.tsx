import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  FileCheck2,
  DownloadCloud,
  Share2,
  Building2,
  History,
  Settings,
  Search,
  Bell,
  Menu,
  X,
  Shield,
  LogOut,
  User,
  ChevronDown,
} from 'lucide-react';

interface AppShellProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  currentUser: string | null;
  onLogout: () => void;
  issuedCount: number;
  uploadedCount: number;
  sharedCount: number;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onLogout,
  issuedCount,
  uploadedCount,
  sharedCount,
  children,
}) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');

  const navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: LayoutDashboard },
    { label: 'My Documents', route: '/my-documents', icon: FolderOpen, count: uploadedCount },
    { label: 'Issued Documents', route: '/issued-documents', icon: FileCheck2, count: issuedCount },
    { label: 'Fetch Documents', route: '/fetch-documents', icon: DownloadCloud },
    { label: 'Shared Documents', route: '/shared-documents', icon: Share2, count: sharedCount },
    { label: 'Issuers & Services', route: '/issuers', icon: Building2 },
    { label: 'Activity History', route: '/history', icon: History },
    { label: 'Settings & Security', route: '/settings', icon: Settings },
  ];

  const handleNavClick = (route: string) => {
    onNavigate(route);
    setIsMobileOpen(false);
    setIsProfileOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col font-sans">
      {/* Top Global Navigation Bar */}
      <header className="sticky top-0 z-40 h-16 bg-white border-b border-slate-200 shadow-xs px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-1.5 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle navigation"
          >
            {isMobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {/* Logo & Brand */}
          <button
            onClick={() => handleNavClick('/dashboard')}
            className="flex items-center gap-2.5 text-left focus:outline-none"
          >
            <div className="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Shield className="size-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900">
                Digital Identity <span className="text-blue-600">Wallet</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold">
                Inji Vault
              </span>
            </div>
          </button>
        </div>

        {/* Global Search Bar (DigiLocker UX) */}
        <div className="hidden lg:flex items-center w-80 relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search documents, issuers, or IDs..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Right Tools & Profile Dropdown */}
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <button
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 relative transition-colors"
            title="Notifications"
          >
            <Bell className="size-4" />
            <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-left"
            >
              <div className="size-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center border border-blue-200">
                {currentUser ? currentUser.substring(0, 2).toUpperCase() : 'ST'}
              </div>
              <div className="hidden sm:block">
                <span className="text-xs font-semibold text-slate-900 block leading-tight">
                  {currentUser || 'Student'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block leading-tight">
                  Vault Verified
                </span>
              </div>
              <ChevronDown className="size-3.5 text-slate-400" />
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-lg py-1.5 z-50 animate-in fade-in duration-150 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-semibold text-slate-900">{currentUser || 'Student'}</p>
                  <p className="text-[10px] text-slate-500 truncate">Device Hardware Key Active</p>
                </div>
                <button
                  onClick={() => handleNavClick('/settings')}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <User className="size-3.5 text-slate-500" /> Profile & Account
                </button>
                <button
                  onClick={() => handleNavClick('/settings')}
                  className="w-full text-left px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="size-3.5 text-slate-500" /> Security Settings
                </button>
                <div className="border-t border-slate-100 my-1" />
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut className="size-3.5" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Left Desktop Sidebar */}
        <aside className="hidden md:block w-64 border-r border-slate-200 bg-white py-6 px-3 shrink-0">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 block">
              Document Wallet
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentRoute === item.route;

              return (
                <button
                  key={item.route}
                  onClick={() => handleNavClick(item.route)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 rounded-l-none'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`size-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && item.count > 0 && (
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-blue-200/80 text-blue-900 font-bold' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 px-3 space-y-2">
            <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200/60 text-xs">
              <span className="font-semibold text-blue-900 block mb-0.5 flex items-center gap-1.5">
                <Shield className="size-3.5 text-blue-600" /> Device Key Valid
              </span>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                P-256 Web Crypto vault is active and isolating private keys on this machine.
              </p>
            </div>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        {isMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-xs"
              onClick={() => setIsMobileOpen(false)}
            />
            <div className="relative w-72 bg-white h-full shadow-2xl p-4 flex flex-col justify-between z-10">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                      DL
                    </div>
                    <span className="font-bold text-sm text-slate-900">Digital Identity Wallet</span>
                  </div>
                  <button onClick={() => setIsMobileOpen(false)} className="p-1 rounded text-slate-500">
                    <X className="size-5" />
                  </button>
                </div>

                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        onClick={() => handleNavClick(item.route)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium ${
                          isActive
                            ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`size-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {item.count !== undefined && item.count > 0 && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setIsMobileOpen(false);
                    onLogout();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <LogOut className="size-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Pane */}
        <main className="flex-1 min-w-0 py-6 px-4 sm:px-8">{children}</main>
      </div>

      {/* Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        <p>Digital Identity Wallet &middot; OpenID4VCI & OpenID4VP Architecture &middot; MOSIP Inji Ecosystem</p>
      </footer>
    </div>
  );
};
