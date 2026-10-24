import React from 'react';
import { Button } from './ui/button';
import { Shield, FileText, QrCode, Plus, History, LogOut } from 'lucide-react';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  currentUser: string | null;
  onLogout: () => void;
  credentialsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  currentUser,
  onLogout,
  credentialsCount,
}) => {
  const navItems = [
    { label: 'Credentials', route: '/', icon: FileText, count: credentialsCount },
    { label: 'Claim', route: '/claim', icon: Plus },
    { label: 'Present', route: '/present', icon: QrCode },
    { label: 'Activity', route: '/history', icon: History },
  ];

  return (
    <header className="sticky top-0 z-30 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto flex h-14 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2 text-zinc-950 font-bold text-sm tracking-tight"
          >
            <div className="size-6 rounded-md bg-zinc-900 text-white flex items-center justify-center">
              <Shield className="size-3.5" />
            </div>
            <span>Identity Wallet</span>
          </button>

          {/* Desktop Nav */}
          {currentUser && (
            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentRoute === item.route;
                return (
                  <button
                    key={item.route}
                    onClick={() => onNavigate(item.route)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-zinc-100 text-zinc-950'
                        : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                    {item.count !== undefined && item.count > 0 && (
                      <span className="ml-1 rounded-full bg-zinc-200/80 px-1.5 py-0.2 text-[10px] text-zinc-800 font-mono">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* User Status / Actions */}
        <div className="flex items-center gap-2">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-500 font-mono hidden sm:inline">
                {currentUser}
              </span>

              <Button variant="ghost" size="sm" onClick={onLogout} className="text-xs text-zinc-600">
                <LogOut className="size-3.5 mr-1" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={() => onNavigate('/login')}>
                Sign In
              </Button>
              <Button size="sm" onClick={() => onNavigate('/register')}>
                Register
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
