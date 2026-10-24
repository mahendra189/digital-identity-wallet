import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { SDJWTCredential } from '../types/campusId';
import {
  FileText,
  Search,
  Plus,
  QrCode,
  Shield,
  Trash2,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  Lock,
  Clock,
  IdCard,
} from 'lucide-react';

interface DashboardPageProps {
  credentials: SDJWTCredential[];
  onNavigate: (route: string) => void;
  onSelectCred: (cred: SDJWTCredential) => void;
  onDeleteCred: (id: string) => void;
  onPresentCred: (cred: SDJWTCredential) => void;
  onIssueDemo: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  credentials,
  onNavigate,
  onSelectCred,
  onDeleteCred,
  onPresentCred,
  onIssueDemo,
}) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  const now = new Date().setHours(0, 0, 0, 0);

  const filtered = credentials.filter((c) => {
    const isExpired = c.claims.valid_until ? new Date(c.claims.valid_until).getTime() < now : false;
    if (filter === 'active' && isExpired) return false;
    if (filter === 'expired' && !isExpired) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.claims.name?.toLowerCase().includes(q) ||
      c.claims.roll_number?.toLowerCase().includes(q) ||
      c.claims.branch?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  const activeCount = credentials.filter((c) => {
    return c.claims.valid_until ? new Date(c.claims.valid_until).getTime() >= now : true;
  }).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 mb-1">
            <span>Identity Vault</span>
            <span>/</span>
            <span className="text-zinc-900 font-semibold">Credentials</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">Credentials</h1>
          <p className="text-sm text-zinc-500 mt-1 max-w-xl">
            Hardware-secured verifiable credentials issued via Inji Certify and selectively disclosed using SD-JWT.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onNavigate('/claim')} className="gap-1.5">
            <Plus className="size-4" />
            Claim Credential
          </Button>

          <Button size="sm" onClick={() => onNavigate('/present')} className="gap-1.5 shadow-sm">
            <QrCode className="size-4" />
            Present / Verify
          </Button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-zinc-200 shadow-sm flex items-start gap-3">
          <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
            <IdCard className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Issued Documents</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-zinc-900">{credentials.length}</span>
              <span className="text-xs text-emerald-600 font-medium">({activeCount} Active)</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-zinc-200 shadow-sm flex items-start gap-3">
          <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
            <Lock className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Device Security</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-semibold text-zinc-900">WebCrypto P-256</span>
              <span className="text-[11px] text-zinc-400">· IndexedDB</span>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-white border-zinc-200 shadow-sm flex items-start gap-3">
          <div className="size-9 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
            <Shield className="size-5" />
          </div>
          <div>
            <span className="text-xs font-medium text-zinc-500 block">Privacy Standard</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-semibold text-zinc-900">RFC 9537 SD-JWT</span>
              <span className="text-[11px] text-zinc-400">· kb+jwt</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="size-4 text-zinc-400 absolute left-3 top-2.5" />
            <Input
              type="text"
              placeholder="Search by name, roll no, branch..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'all' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'active' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilter('expired')}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                filter === 'expired' ? 'bg-white text-zinc-950 shadow-xs' : 'text-zinc-600 hover:text-zinc-950'
              }`}
            >
              Expired
            </button>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onIssueDemo} className="text-xs text-zinc-600 hover:text-zinc-900">
          <Sparkles className="size-3.5 mr-1.5 text-zinc-400" />
          Issue quick demo credential
        </Button>
      </div>

      {/* Credentials Grid */}
      {credentials.length === 0 ? (
        <Card className="border-dashed p-12 text-center bg-white shadow-xs">
          <div className="size-12 rounded-xl bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <FileText className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900">No credentials in vault</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            Your wallet vault is empty. Claim a student identity credential from an OpenID4VCI offer or issue a demo pass.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2.5">
            <Button size="sm" onClick={() => onNavigate('/claim')}>
              <Plus className="size-4 mr-1" />
              Claim from Offer
            </Button>
            <Button size="sm" variant="outline" onClick={onIssueDemo}>
              Issue Demo Pass
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-zinc-500 bg-white rounded-xl border border-zinc-200">
          No credentials matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map((cred) => {
            const isExpired = cred.claims.valid_until
              ? new Date(cred.claims.valid_until).getTime() < now
              : false;

            return (
              <Card
                key={cred.id}
                className="overflow-hidden bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                {/* Card Header Banner */}
                <div className="p-5 pb-4 border-b border-zinc-100 bg-gradient-to-b from-zinc-50/80 to-white">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        <GraduationCap className="size-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                          {cred.issuer.name || 'Campus Identity Authority'}
                        </span>
                        <h3 className="text-base font-bold text-zinc-950 leading-tight">
                          {cred.claims.name}
                        </h3>
                      </div>
                    </div>

                    <Badge
                      variant={isExpired ? 'warning' : 'success'}
                      className="gap-1 font-medium text-[11px] py-0.5 px-2"
                    >
                      {isExpired ? (
                        <>
                          <Clock className="size-3" /> Expired
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-3" /> Active
                        </>
                      )}
                    </Badge>
                  </div>
                </div>

                {/* Card Body Attributes */}
                <div className="p-5 space-y-3.5 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                        Roll Number / Student ID
                      </span>
                      <span className="font-mono font-semibold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-xs inline-block">
                        {cred.claims.roll_number}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                        Academic Program
                      </span>
                      <span className="font-medium text-zinc-900 truncate block">
                        {cred.claims.branch}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 border-t border-zinc-100">
                    <div>
                      <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                        Validity Date
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          isExpired ? 'text-amber-700 font-semibold' : 'text-zinc-700 font-medium'
                        }`}
                      >
                        {cred.claims.valid_until}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-zinc-400 block mb-0.5">
                        Credential ID
                      </span>
                      <span className="font-mono text-[11px] text-zinc-500 truncate block">
                        {cred.id}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="px-5 py-3 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCred(cred)}
                      className="text-xs h-8 px-2.5 text-zinc-700"
                    >
                      <Shield className="size-3.5 mr-1" />
                      Inspect
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`Delete ${cred.id} from your wallet?`)) {
                          onDeleteCred(cred.id);
                        }
                      }}
                      className="size-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50"
                      title="Delete credential"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => onPresentCred(cred)}
                    className="h-8 text-xs font-semibold shadow-xs"
                  >
                    <QrCode className="size-3.5 mr-1.5" />
                    Present Proof
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
