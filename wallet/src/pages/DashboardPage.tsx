import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card';
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

  const filtered = credentials.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.claims.name?.toLowerCase().includes(q) ||
      c.claims.roll_number?.toLowerCase().includes(q) ||
      c.claims.branch?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Credentials</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your hardware-backed campus identity documents and selective disclosures
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onNavigate('/claim')}>
            <Plus className="size-4" />
            Claim Credential
          </Button>

          <Button size="sm" onClick={() => onNavigate('/present')}>
            <QrCode className="size-4" />
            Present / Verify
          </Button>
        </div>
      </div>

      {/* Search Bar & Quick Demo Trigger */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-sm">
          <Search className="size-4 text-zinc-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search credentials by name, roll no, or branch..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="ghost" size="sm" onClick={onIssueDemo} className="text-xs text-zinc-600">
          <Sparkles className="size-3.5 mr-1" />
          Issue quick demo credential
        </Button>
      </div>

      {/* Credentials List / Grid */}
      {credentials.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="size-12 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center mx-auto mb-3">
            <FileText className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900">No credentials found</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            You do not have any credentials in your wallet vault yet. Claim a credential from an OpenID4VCI offer.
          </p>
          <div className="mt-5 flex items-center justify-center gap-2">
            <Button size="sm" onClick={() => onNavigate('/claim')}>
              <Plus className="size-4" />
              Claim from Offer
            </Button>
            <Button size="sm" variant="outline" onClick={onIssueDemo}>
              Issue Demo Pass
            </Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center text-sm text-zinc-500">
          No credentials matching "{search}".
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((cred) => {
            const isExpired = cred.claims.valid_until
              ? new Date(cred.claims.valid_until).getTime() < new Date().setHours(0, 0, 0, 0)
              : false;

            return (
              <Card key={cred.id} className="overflow-hidden hover:border-zinc-300 transition-colors">
                <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50 flex flex-row items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="size-4 text-zinc-600" />
                      <span className="text-xs font-semibold text-zinc-600 uppercase tracking-wider">
                        {cred.issuer.name || 'Campus Identity'}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold">{cred.claims.name}</CardTitle>
                  </div>

                  <Badge variant={isExpired ? 'warning' : 'success'}>
                    {isExpired ? 'Expired' : 'Active'}
                  </Badge>
                </CardHeader>

                <CardContent className="pt-4 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2 text-zinc-600">
                    <div>
                      <span className="text-[11px] font-medium text-zinc-400 block">Roll Number</span>
                      <span className="font-mono font-semibold text-zinc-900">{cred.claims.roll_number}</span>
                    </div>

                    <div>
                      <span className="text-[11px] font-medium text-zinc-400 block">Valid Until</span>
                      <span className={`font-mono ${isExpired ? 'text-amber-700 font-semibold' : 'text-zinc-900'}`}>
                        {cred.claims.valid_until}
                      </span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[11px] font-medium text-zinc-400 block">Branch / Department</span>
                      <span className="text-zinc-900 font-medium">{cred.claims.branch}</span>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={() => onSelectCred(cred)}>
                      <Shield className="size-3.5" />
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
                      className="text-zinc-500 hover:text-red-600"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>

                  <Button size="sm" onClick={() => onPresentCred(cred)}>
                    <QrCode className="size-3.5" />
                    Present
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
