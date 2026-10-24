import React, { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  GraduationCap,
  BookOpen,
  Bus,
  Search,
  DownloadCloud,
  Award,
  Landmark,
} from 'lucide-react';

interface IssuersPageProps {
  onNavigate: (route: string) => void;
}

interface IssuerDirectoryItem {
  id: string;
  name: string;
  type: string;
  category: 'Education' | 'Identity' | 'Campus Services' | 'Transport';
  description: string;
  icon: any;
  status: 'active' | 'coming_soon';
  supportedDocs: string[];
}

const ISSUERS_DIRECTORY: IssuerDirectoryItem[] = [
  {
    id: 'campus-registrar',
    name: 'Office of the Campus Registrar',
    type: 'University Primary Registry',
    category: 'Education',
    description: 'Issues authentic university student identities, enrollment certificates, and bonafide letters.',
    icon: GraduationCap,
    status: 'active',
    supportedDocs: ['Student Identity Card', 'Enrollment Certificate', 'Bonafide Letter'],
  },
  {
    id: 'exam-cell',
    name: 'Academic Evaluation & Examination Cell',
    type: 'Examination & Certification Board',
    category: 'Education',
    description: 'Issues tamper-evident degree diplomas, provisional certificates, and semester mark sheets.',
    icon: Award,
    status: 'active',
    supportedDocs: ['B.Tech / Degree Diploma', 'Semester Grade Cards', 'Migration Certificate'],
  },
  {
    id: 'central-library',
    name: 'University Central Library',
    type: 'Academic Resource Center',
    category: 'Campus Services',
    description: 'Issues digital library borrowing credentials, book reserve permissions, and clearance receipts.',
    icon: BookOpen,
    status: 'active',
    supportedDocs: ['Library Card', 'Inter-Library Pass', 'Clearance Certificate'],
  },
  {
    id: 'campus-transport',
    name: 'University Transit & Bus Authority',
    type: 'Fleet Operations',
    category: 'Transport',
    description: 'Issues seasonal transit passes, parking permits, and university route shuttle passes.',
    icon: Bus,
    status: 'active',
    supportedDocs: ['Semester Shuttle Pass', 'Campus Parking Permit'],
  },
  {
    id: 'state-higher-ed',
    name: 'Department of Higher Education',
    type: 'State Government Portal',
    category: 'Identity',
    description: 'State government repository for higher education scholarship credentials and apex academic IDs.',
    icon: Landmark,
    status: 'coming_soon',
    supportedDocs: ['Scholarship Eligibility Card', 'State Student Registry Pass'],
  },
];

export const IssuersPage: React.FC<IssuersPageProps> = ({ onNavigate }) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState<string>('All');

  const categories = ['All', 'Education', 'Identity', 'Campus Services', 'Transport'];

  const filtered = ISSUERS_DIRECTORY.filter((iss) => {
    const matchesSearch =
      iss.name.toLowerCase().includes(search.toLowerCase()) ||
      iss.type.toLowerCase().includes(search.toLowerCase()) ||
      iss.supportedDocs.some((d) => d.toLowerCase().includes(search.toLowerCase()));
    const matchesCat = selectedCat === 'All' || iss.category === selectedCat;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-1">
            <span>DigiLocker Services</span>
            <span>/</span>
            <span className="text-blue-700 font-semibold">Issuers & Services</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Issuers & Services Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Browse verified institutional departments and government agencies integrated with the
            Digital Identity Wallet network for automated document retrieval.
          </p>
        </div>

        <Button
          onClick={() => onNavigate('/fetch-documents')}
          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs shrink-0"
        >
          <DownloadCloud className="size-4" />
          Fetch a Document
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCat === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="size-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            type="text"
            placeholder="Search issuers or documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-white"
          />
        </div>
      </div>

      {/* Issuers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((iss) => {
          const IconComp = iss.icon;
          const isActive = iss.status === 'active';

          return (
            <Card
              key={iss.id}
              className="bg-white border-slate-200 hover:shadow-md transition-all duration-150 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="size-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                    <IconComp className="size-5" />
                  </div>

                  <Badge
                    variant={isActive ? 'success' : 'secondary'}
                    className="text-[10px] font-medium"
                  >
                    {isActive ? 'OpenID4VCI Live' : 'Coming Soon'}
                  </Badge>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">{iss.name}</h3>
                  <span className="text-[11px] text-blue-700 font-medium block mt-0.5">
                    {iss.type}
                  </span>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {iss.description}
                  </p>
                </div>

                {/* Supported Documents */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                    Supported Documents
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {iss.supportedDocs.map((doc) => (
                      <span
                        key={doc}
                        className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 border border-slate-200 text-[10px] font-medium"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-100">
                {isActive ? (
                  <Button
                    size="sm"
                    onClick={() => onNavigate('/fetch-documents')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold gap-1.5 shadow-xs"
                  >
                    <DownloadCloud className="size-3.5" />
                    Fetch Documents
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled
                    className="w-full text-xs text-slate-400 border-slate-200"
                  >
                    Integration in Progress
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
