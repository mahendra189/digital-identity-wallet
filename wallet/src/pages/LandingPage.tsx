import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import {
  Shield,
  FileCheck2,
  Lock,
  ArrowRight,
  GraduationCap,
  IdCard,
  Car,
  Building,
  CheckCircle,
  QrCode,
  HelpCircle,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (route: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const categories = [
    {
      title: 'Identity Credentials',
      desc: 'National & campus identity cards, Aadhaar/ID profiles, and proof-of-identity tokens.',
      icon: IdCard,
      badge: 'Popular',
    },
    {
      title: 'Education Documents',
      desc: 'University degrees, semester marksheets, student enrollment certificates, and admit cards.',
      icon: GraduationCap,
      badge: 'Integrated',
    },
    {
      title: 'Transport Services',
      desc: 'Driving licences, vehicle registration certificates, and digital transit gate passes.',
      icon: Car,
      badge: 'Ready',
    },
    {
      title: 'Institutional Services',
      desc: 'Employment cards, library borrowing passes, and hostel residence verification.',
      icon: Building,
      badge: 'Campus',
    },
  ];

  const steps = [
    {
      step: '01',
      title: 'Connect & Fetch',
      desc: 'Retrieve officially signed credentials from verified university registrars, departments, and public issuers.',
      icon: FileCheck2,
    },
    {
      step: '02',
      title: 'Secure On-Device',
      desc: 'Your private keys are generated with Web Crypto API and held exclusively in your local device vault.',
      icon: Lock,
    },
    {
      step: '03',
      title: 'Selectively Disclose',
      desc: 'Share only requested attributes (e.g. validity & status) while withholding sensitive fields using RFC 9537 SD-JWT.',
      icon: QrCode,
    },
  ];

  const faqs = [
    {
      q: 'What is a Digital Identity Wallet?',
      a: 'A secure client-side platform enabling individuals to receive, store, and present verifiable digital credentials. Designed on open standards including OpenID4VCI, OpenID4VP, and IETF SD-JWT.',
    },
    {
      q: 'How does Selective Disclosure protect my privacy?',
      a: 'With Selective Disclosure (SD-JWT), each attribute has its own cryptographic salt. When presenting to a gate or verifier, you can reveal solely your enrollment status without disclosing your name, photo, or roll number.',
    },
    {
      q: 'Where are my private keys stored?',
      a: 'Keys are created on-device using the Web Crypto API (P-256 curve) and stored in encrypted client-side IndexedDB. Private keys are non-exportable and never transmitted over the network.',
    },
    {
      q: 'Are documents issued through Inji Certify legally verifiable?',
      a: 'Yes. Issued credentials contain X.509 certificate chains and ES256 digital signatures that verifiers can cryptographically authenticate in real time against revocation registries.',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Top Public Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Shield className="size-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-slate-900">
                Digital Identity <span className="text-blue-600">Wallet</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                DigiLocker Architecture
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-blue-600 transition-colors">Capabilities</a>
            <a href="#how-it-works" className="hover:text-blue-600 transition-colors">How it works</a>
            <a href="#security" className="hover:text-blue-600 transition-colors">Security</a>
            <a href="#faq" className="hover:text-blue-600 transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('/login')}>
              Sign In
            </Button>
            <Button size="sm" onClick={() => onNavigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-blue-50/50 via-white to-white border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
            <CheckCircle className="size-3.5 text-blue-600" />
            <span>Privacy-First Self-Sovereign Identity</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-950 tracking-tight leading-tight">
            Your Trusted Digital Wallet for <span className="text-blue-600">Verified Credentials</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A unified, secure platform to store, manage, and share campus, educational, and identity documents. Built on OpenID4VCI, OpenID4VP, and RFC 9537 SD-JWT.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button size="lg" onClick={() => onNavigate('/register')} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-sm font-semibold">
              Create Free Wallet
              <ArrowRight className="size-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => onNavigate('/login')} className="w-full sm:w-auto border-slate-300 text-slate-700 font-medium">
              Access Existing Vault
            </Button>
          </div>
        </div>
      </section>

      {/* Document Categories Overview */}
      <section id="features" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Supported Document Categories
          </h2>
          <p className="text-sm text-slate-500">
            Seamlessly organize both officially issued digital credentials and uploaded personal verification records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => {
            const Icon = cat.icon;
            return (
              <Card key={i} className="border-slate-200 hover:border-blue-300 hover:shadow-md transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="size-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Icon className="size-5" />
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-slate-50 font-normal">
                      {cat.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{cat.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-slate-500 leading-relaxed">{cat.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-16 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              How the Digital Identity Wallet Works
            </h2>
            <p className="text-sm text-slate-500">
              Zero passwords, zero cloud-held private keys, full cryptographic self-sovereignty.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st, idx) => {
              const Icon = st.icon;
              return (
                <div key={idx} className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3 relative">
                  <span className="text-2xl font-black text-blue-600/20 block font-mono">{st.step}</span>
                  <div className="flex items-center gap-2">
                    <Icon className="size-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900 text-base">{st.title}</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Security & FAQ Section */}
      <section id="faq" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-500">Everything you need to know about security, privacy, and digital credentials.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-5 rounded-xl border border-slate-200 bg-white space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="size-4 text-blue-600 shrink-0" />
                {f.q}
              </h3>
              <p className="text-xs text-slate-600 pl-6 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-10 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-semibold">
            <Shield className="size-4 text-blue-600" />
            <span>Digital Identity Wallet Architecture</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-slate-500">
            <span>OpenID4VCI & OpenID4VP Compliant</span>
            <span>MOSIP Inji Certify Ecosystem</span>
            <span>W3C Verifiable Credentials</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
