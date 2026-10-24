import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { SDJWTCredential } from '../types/campusId';
import {
  FileCheck2,
  Search,
  ShieldCheck,
  Building,
  Share2,
  Eye,
  Trash2,
  DownloadCloud,
  Award,
} from 'lucide-react';

interface IssuedDocumentsPageProps {
  credentials: SDJWTCredential[];
  onNavigate: (route: string) => void;
  onSelectCred: (cred: SDJWTCredential) => void;
  onDeleteCred: (id: string) => void;
  onPresentCred: (cred: SDJWTCredential) => void;
}

export const IssuedDocumentsPage: React.FC<IssuedDocumentsPageProps> = ({
  credentials,
  onNavigate,
  onSelectCred,
  onDeleteCred,
  onPresentCred,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const now = new Date().setHours(0, 0, 0, 0);

  const filtered = credentials.filter((c) => {
    const isExpired = c.claims.valid_until ? new Date(c.claims.valid_until).getTime() < now : false;
    if (statusFilter === 'active' && isExpired) return false;
    if (statusFilter === 'expired' && !isExpired) return false;

    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.claims.name?.toLowerCase().includes(q) ||
      c.claims.roll_number?.toLowerCase().includes(q) ||
      c.claims.branch?.toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q) ||
      c.issuer.name?.toLowerCase().includes(q) ||
      c.issuer.id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>DigiLocker Services</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">Issued Documents</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Issued Documents
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Legally recognized digital documents issued directly by accredited institutional authorities
            via Inji Certify and secured with SD-JWT cryptographic signatures.
          </p>
        </div>

        <Button
          onClick={() => onNavigate('/fetch-documents')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs shrink-0"
        >
          <DownloadCloud className="size-4" />
          Fetch New Document
        </Button>
      </div>

      {/* Trust Guarantee Box */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 text-xs">
        <ShieldCheck className="size-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-semibold text-blue-950">Legally Valid Digital Credentials</span>
          <p className="text-blue-800 leading-relaxed">
            Issued documents contain ECDSA signatures from the issuing authority and selective disclosures (SD-JWT).
            These credentials can be instantly verified without contacting the issuer again.
          </p>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1.5">
          {(['all', 'active', 'expired'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {s === 'all' ? `All (${credentials.length})` : s}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="w-full sm:w-72 relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search by student name, roll no, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white"
          />
        </div>
      </div>

      {/* Credentials Grid */}
      {filtered.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 p-12 text-center bg-white rounded-2xl">
          <div className="size-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <FileCheck2 className="size-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No issued documents found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || statusFilter !== 'all'
              ? 'No credentials match your search parameters.'
              : 'You have not fetched any official documents into your wallet yet.'}
          </p>
          <Button
            onClick={() => onNavigate('/fetch-documents')}
            size="sm"
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            <DownloadCloud className="size-4" />
            Fetch Documents Now
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((cred) => {
            const isExpired = cred.claims.valid_until
              ? new Date(cred.claims.valid_until).getTime() < now
              : false;

            return (
              <Card
                key={cred.id}
                className="bg-white border-slate-200 hover:shadow-md transition-all duration-150 rounded-xl overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5 space-y-4">
                  {/* Card Header & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                        <Award className="size-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 leading-snug">
                          {cred.claims.name ? `${cred.claims.name}'s ID` : 'Campus Identity Card'}
                        </h3>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building className="size-3 text-slate-400" />
                          Office of the Registrar
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={isExpired ? 'destructive' : 'success'}
                      className="text-[10px] shrink-0 font-medium"
                    >
                      {isExpired ? 'Expired' : 'Verified'}
                    </Badge>
                  </div>

                  {/* Claims Summary Table */}
                  <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Roll Number:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {cred.claims.roll_number || 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Department:</span>
                      <span className="font-medium text-slate-800">{cred.claims.branch || 'General'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Valid Until:</span>
                      <span
                        className={`font-mono text-[11px] ${
                          isExpired ? 'text-red-600 font-bold' : 'text-slate-700'
                        }`}
                      >
                        {cred.claims.valid_until || 'Indefinite'}
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Footprint */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="size-3 text-emerald-600" /> SD-JWT Signed
                    </span>
                    <span className="truncate max-w-[120px]">{cred.id}</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectCred(cred)}
                      className="h-8 px-2.5 text-xs text-slate-700 hover:text-slate-900 border-slate-200 gap-1.5"
                    >
                      <Eye className="size-3.5 text-slate-500" />
                      View Card
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onPresentCred(cred)}
                      className="h-8 px-2.5 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
                    >
                      <Share2 className="size-3.5" />
                      Share / Verify
                    </Button>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirmId(cred.id)}
                    className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    title="Delete credential"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-200">
            <h4 className="font-bold text-slate-900 text-sm">Delete Issued Credential?</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this issued credential from your wallet vault? You will need
              to re-fetch it from the institutional issuer to restore it.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirmId(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  onDeleteCred(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
