import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { SharedHistoryEntry } from '../types/history';
import {
  Share2,
  Building2,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Search,
  QrCode,
} from 'lucide-react';

interface SharedDocumentsPageProps {
  entries: SharedHistoryEntry[];
  onNavigate: (route: string) => void;
  onNotification: (msg: string) => void;
}

export const SharedDocumentsPage: React.FC<SharedDocumentsPageProps> = ({
  entries,
  onNavigate,
  onNotification,
}) => {
  const [search, setSearch] = useState('');

  const filtered = entries.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.verifierName.toLowerCase().includes(q) ||
      e.purpose.toLowerCase().includes(q) ||
      e.disclosedClaims.some((c) => c.toLowerCase().includes(q))
    );
  });

  const acceptedCount = entries.filter((e) => e.outcome === 'ACCEPTED').length;
  const uniqueVerifiers = new Set(entries.map((e) => e.verifierName)).size;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>DigiLocker Services</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">Shared Documents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Shared Documents & Consents
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Track and monitor documents shared with external verifiers via OpenID4VP.
            Inspect selective disclosures and audit active verification sessions.
          </p>
        </div>

        <Button
          onClick={() => onNavigate('/present')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs shrink-0"
        >
          <QrCode className="size-4" />
          Share New Document
        </Button>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Share2 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Total Shares
            </span>
            <span className="text-xl font-bold text-slate-900">{entries.length}</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Verified Presentations
            </span>
            <span className="text-xl font-bold text-slate-900">{acceptedCount}</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="size-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Building2 className="size-5" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
              Connected Verifiers
            </span>
            <span className="text-xl font-bold text-slate-900">{uniqueVerifiers}</span>
          </div>
        </Card>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="w-full sm:w-80 relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search by verifier or purpose..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white"
          />
        </div>
      </div>

      {/* Shares List / Table */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 p-12 text-center bg-white rounded-2xl">
          <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Share2 className="size-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No shared documents recorded</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search
              ? 'No shared presentations match your search.'
              : 'You have not shared any documents with verifiers yet.'}
          </p>
          <Button
            onClick={() => onNavigate('/present')}
            size="sm"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <QrCode className="size-4" />
            Initiate Presentation
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isVerified = item.outcome === 'ACCEPTED';
            const dateStr = new Date(item.timestamp).toLocaleString();

            return (
              <Card
                key={item.id}
                className="bg-white border-slate-200 hover:shadow-xs transition-shadow rounded-xl overflow-hidden"
              >
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Building2 className="size-4 text-blue-600" />
                        {item.verifierName}
                      </div>

                      <Badge
                        variant={isVerified ? 'success' : 'destructive'}
                        className="text-[10px] font-medium"
                      >
                        {isVerified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3 text-emerald-600" />
                            Verified by Relying Party
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="size-3 text-red-600" />
                            Rejected / Expired
                          </span>
                        )}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">
                      Purpose: <span className="text-slate-800">{item.purpose}</span>
                    </p>

                    {/* Selective Disclosure Tags */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="text-[11px] font-semibold text-slate-500">Disclosed Claims:</span>
                      {item.disclosedClaims.map((claim) => (
                        <span
                          key={claim}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-mono font-medium"
                        >
                          <Eye className="size-3" />
                          {claim}
                        </span>
                      ))}

                      {item.withheldClaims.length > 0 && (
                        <>
                          <span className="text-[11px] font-semibold text-slate-400 ml-2">
                            Withheld:
                          </span>
                          {item.withheldClaims.map((claim) => (
                            <span
                              key={claim}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-mono"
                            >
                              <EyeOff className="size-3" />
                              {claim}
                            </span>
                          ))}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions & Timestamp */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                    <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {dateStr}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        onNotification(`Consent revoked for ${item.verifierName}.`);
                      }}
                      className="h-8 text-xs text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50"
                    >
                      Revoke Consent
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
