import React from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { SDJWTCredential } from '../types/campusId';
import { UploadedDocument } from '../services/storage';
import {
  FileCheck2,
  FolderOpen,
  Share2,
  DownloadCloud,
  Upload,
  QrCode,
  ShieldCheck,
  Building,
  GraduationCap,
  BookOpen,
  Bus,
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  Shield,
} from 'lucide-react';

interface DashboardPageProps {
  currentUser: string | null;
  credentials: SDJWTCredential[];
  uploads: UploadedDocument[];
  sharedCount: number;
  onNavigate: (route: string) => void;
  onSelectCred: (cred: SDJWTCredential) => void;
  onPresentCred: (cred: SDJWTCredential) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  currentUser,
  credentials,
  uploads,
  sharedCount,
  onNavigate,
  onSelectCred,
  onPresentCred,
}) => {
  const now = new Date().setHours(0, 0, 0, 0);

  const activeIssuedCount = credentials.filter((c) => {
    return c.claims.valid_until ? new Date(c.claims.valid_until).getTime() >= now : true;
  }).length;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Welcome Section (DigiLocker Hero Style) */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold backdrop-blur-xs">
            <ShieldCheck className="size-3.5 text-blue-200" />
            <span>National Digital Locker & Identity Vault</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser || 'Student'}
          </h1>
          <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
            Your tamper-evident digital identity wallet. Access legally recognized credentials issued by
            university departments and store your personal certificates securely.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button
              onClick={() => onNavigate('/fetch-documents')}
              size="sm"
              className="bg-white text-blue-700 hover:bg-blue-50 font-bold shadow-xs text-xs gap-1.5"
            >
              <DownloadCloud className="size-4" />
              Fetch Documents
            </Button>
            <Button
              onClick={() => onNavigate('/my-documents')}
              size="sm"
              variant="outline"
              className="border-white/30 text-white hover:bg-white/10 text-xs gap-1.5"
            >
              <Upload className="size-4" />
              Upload Personal File
            </Button>
          </div>
        </div>

        {/* Subtle decorative background watermark */}
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <Shield className="size-64 text-white" />
        </div>
      </div>

      {/* Summary KPI Cards (DigiLocker Architecture) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Issued Documents */}
        <Card
          onClick={() => onNavigate('/issued-documents')}
          className="bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Issued Documents
            </span>
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileCheck2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{credentials.length}</span>
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle2 className="size-3" /> {activeIssuedCount} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Officially verified by issuers</p>
        </Card>

        {/* Card 2: Uploaded Documents */}
        <Card
          onClick={() => onNavigate('/my-documents')}
          className="bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Uploaded Documents
            </span>
            <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderOpen className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{uploads.length}</span>
            <span className="text-[10px] text-slate-400 font-mono">Self-Managed</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Private scans and PDFs</p>
        </Card>

        {/* Card 3: Shared Documents */}
        <Card
          onClick={() => onNavigate('/shared-documents')}
          className="bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Shared Documents
            </span>
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Share2 className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{sharedCount}</span>
            <span className="text-[10px] text-blue-600 font-semibold">OpenID4VP</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Audit logs & active shares</p>
        </Card>

        {/* Card 4: Vault Security */}
        <Card
          onClick={() => onNavigate('/settings')}
          className="bg-white border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer p-4 rounded-xl"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Vault Security
            </span>
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-sm font-bold text-slate-900">ECDSA P-256</span>
            <Badge variant="success" className="text-[9px] py-0 px-1 font-semibold">
              Hardware Bound
            </Badge>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">IndexedDB Non-Extractable</p>
        </Card>
      </div>

      {/* Quick Actions Bar */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => onNavigate('/fetch-documents')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left flex items-center gap-3 shadow-2xs group"
          >
            <div className="size-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <DownloadCloud className="size-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Fetch Document</span>
              <span className="text-[10px] text-slate-500">From verified issuers</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('/my-documents')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left flex items-center gap-3 shadow-2xs group"
          >
            <div className="size-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Upload className="size-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Upload Document</span>
              <span className="text-[10px] text-slate-500">Personal files & scans</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('/present')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left flex items-center gap-3 shadow-2xs group"
          >
            <div className="size-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <QrCode className="size-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Scan & Present</span>
              <span className="text-[10px] text-slate-500">OpenID4VP verification</span>
            </div>
          </button>

          <button
            onClick={() => onNavigate('/issuers')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left flex items-center gap-3 shadow-2xs group"
          >
            <div className="size-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Building className="size-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">Browse Issuers</span>
              <span className="text-[10px] text-slate-500">Departments & portals</span>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Documents Section (DigiLocker Combined View) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Documents in Wallet</h2>
            <p className="text-xs text-slate-500">Your most recently issued or uploaded records</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('/issued-documents')}
              className="text-xs h-8 border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              View All ({credentials.length + uploads.length})
            </Button>
          </div>
        </div>

        {credentials.length === 0 && uploads.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 p-8 text-center bg-white rounded-xl">
            <div className="size-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2.5">
              <FileCheck2 className="size-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Your wallet is currently empty</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Get started by fetching an authentic document from your university registrar or uploading
              a personal certificate.
            </p>
            <div className="flex items-center justify-center gap-3 mt-4">
              <Button
                size="sm"
                onClick={() => onNavigate('/fetch-documents')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs gap-1.5"
              >
                <DownloadCloud className="size-3.5" />
                Fetch Document
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onNavigate('/my-documents')}
                className="text-xs border-slate-200"
              >
                Upload File
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Show Issued Credentials first */}
            {credentials.slice(0, 3).map((cred) => {
              const isExpired = cred.claims.valid_until
                ? new Date(cred.claims.valid_until).getTime() < now
                : false;

              return (
                <Card
                  key={cred.id}
                  className="bg-white border-slate-200 hover:shadow-xs transition-shadow rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="size-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Award className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {cred.claims.name ? `${cred.claims.name}'s ID` : 'Campus Identity Card'}
                        </h4>
                        <span className="text-[10px] text-slate-500 block truncate">
                          Registrar &middot; {cred.claims.roll_number || 'N/A'}
                        </span>
                      </div>
                    </div>

                    <Badge
                      variant={isExpired ? 'destructive' : 'success'}
                      className="text-[9px] py-0 px-1 font-medium"
                    >
                      {isExpired ? 'Expired' : 'Verified'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-mono">
                    <span className="inline-flex items-center gap-1 font-sans text-blue-700 font-semibold text-[10px]">
                      <ShieldCheck className="size-3" /> Issued SD-JWT
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onPresentCred(cred)}
                        className="text-slate-600 hover:text-blue-700 font-sans font-medium text-[11px]"
                      >
                        Share
                      </button>
                      <button
                        onClick={() => onSelectCred(cred)}
                        className="text-blue-600 hover:text-blue-800 font-sans font-medium flex items-center gap-0.5 text-[11px]"
                      >
                        View <ChevronRight className="size-3" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}

            {/* Show Uploaded Files */}
            {uploads.slice(0, 3).map((doc) => (
              <Card
                key={doc.id}
                className="bg-white border-slate-200 hover:shadow-xs transition-shadow rounded-xl p-4 flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="size-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                      <FolderOpen className="size-4 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{doc.name}</h4>
                      <span className="text-[10px] text-slate-500 block">
                        {doc.category} &middot; Self-Uploaded
                      </span>
                    </div>
                  </div>

                  <Badge variant="secondary" className="text-[9px] py-0 px-1 font-normal">
                    Uploaded
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-100">
                  <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => onNavigate('/my-documents')}
                    className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-0.5"
                  >
                    Manage <ChevronRight className="size-3" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Integrated Issuers Carousel / Grid */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-slate-500">
              Popular Issuing Authorities
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/issuers')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View Directory <ArrowRight className="size-3" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div
            onClick={() => onNavigate('/fetch-documents')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Campus Registrar</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Student IDs, Bonafide certificates</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/fetch-documents')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Examination Cell</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Degree diplomas, Grade transcripts</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/fetch-documents')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Central Library</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Borrower cards, Research passes</p>
            </div>
          </div>

          <div
            onClick={() => onNavigate('/fetch-documents')}
            className="p-3.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-slate-50/50 transition-all cursor-pointer space-y-2 shadow-2xs"
          >
            <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Bus className="size-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-900">Transit & Shuttle</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Campus transit passes & permits</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
