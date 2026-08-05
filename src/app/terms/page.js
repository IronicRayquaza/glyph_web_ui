"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Lenis from "lenis";
import {
  FileCheck,
  ArrowLeft,
  BookOpen,
  UserCheck,
  Layers,
  AlertOctagon,
  Activity,
  ShieldAlert,
  Gavel,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

function CornerPins() {
  return (
    <>
      <div className="absolute -top-1.25 -left-1.25 w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shadow-2xs z-20" />
      <div className="absolute -top-1.25 -right-1.25 w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shadow-2xs z-20" />
      <div className="absolute -bottom-1.25 -left-1.25 w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shadow-2xs z-20" />
      <div className="absolute -bottom-1.25 -right-1.25 w-2.5 h-2.5 rounded-full bg-white border border-slate-400 shadow-2xs z-20" />
    </>
  );
}

const TOC_ITEMS = [
  { id: "acceptance", label: "1. Acceptance of Terms", icon: FileCheck },
  { id: "services", label: "2. Description of Service", icon: BookOpen },
  { id: "accounts", label: "3. Accounts & Security", icon: UserCheck },
  { id: "ownership", label: "4. Intellectual Property", icon: Layers },
  { id: "acceptable-use", label: "5. Acceptable Use", icon: AlertOctagon },
  { id: "availability", label: "6. Service SLAs & Uptime", icon: Activity },
  { id: "liability", label: "7. Limitation of Liability", icon: ShieldAlert },
  { id: "governing-law", label: "8. Governing Law & Disputes", icon: Gavel },
];

export default function TermsAndConditionsPage() {
  const [activeSection, setActiveSection] = useState("acceptance");

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // ScrollSpy: Automatically update activeSection as user scrolls through content
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: 0.1,
      }
    );

    TOC_ITEMS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-black selection:text-white relative">
      {/* Background Dotted Blueprint Grid */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grid-dots" />

      {/* Floating Header */}
      <header className="sticky top-4 z-50 max-w-310 mx-auto w-full px-4">
        <nav className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-full px-5 py-2.5 shadow-xs flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-xs group-hover:scale-105 transition-transform border border-black/10">
              <Image width={32} height={32} src="/logo.svg" alt="Oleidian Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-bold text-[16px] tracking-tight font-sans text-slate-950">
              Oleidian
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="text-[12px] font-bold text-slate-700 hover:text-black px-3.5 py-1.5 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="bg-black text-white hover:bg-slate-800 text-[12px] font-bold px-4 py-1.5 rounded-full transition-all shadow-xs"
            >
              Go to Dashboard
            </Link>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-310 mx-auto w-full border-x border-dashed border-slate-300/80 bg-white/40 backdrop-blur-2xs relative my-6 min-h-screen">
        
        {/* Banner Section */}
        <section className="relative border-b border-dashed border-slate-300/80 py-12 px-6 md:px-12 bg-linear-to-b from-white to-slate-50/50">
          <CornerPins />
          <div className="max-w-240 mx-auto flex flex-col items-center text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-4">
              <FileCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Legal Agreement &amp; Usage Rules</span>
            </div>

            <h1 className="text-[36px] sm:text-[48px] font-bold text-slate-950 tracking-tight leading-tight mb-4">
              Terms &amp; Conditions
            </h1>

            <p className="text-[15px] sm:text-[17px] text-slate-600 max-w-180 leading-relaxed mb-6 font-normal">
              Please read these Terms &amp; Conditions carefully before using Oleidian&apos;s web dashboard or Figma version control plugin.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 text-[12px] text-slate-500 font-medium border-t border-slate-200/80 pt-4 w-full max-w-140">
              <span><strong>Last Updated:</strong> August 5, 2026</span>
              <span>&bull;</span>
              <span><strong>Effective Date:</strong> August 1, 2026</span>
              <span>&bull;</span>
              <span><strong>Version:</strong> 1.0</span>
            </div>
          </div>
        </section>

        {/* Content & Sidebar Grid */}
        <section className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Table of Contents Sticky Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-2">
            <div className="sticky top-24 bg-white/80 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono px-2">
                Navigation Index
              </span>

              <nav className="flex flex-col gap-1">
                {TOC_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-[12px] font-semibold transition-all text-left cursor-pointer ${
                        isActive
                          ? "bg-slate-950 text-white shadow-xs"
                          : "text-slate-700 hover:bg-slate-100 hover:text-black"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-500"}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white opacity-100" : "opacity-0"}`} />
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Right Main Terms Text Content */}
          <article className="lg:col-span-8 flex flex-col gap-10 text-[14px] text-slate-700 leading-relaxed font-normal">
            
            {/* 1. Acceptance of Terms */}
            <div id="acceptance" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <FileCheck className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  1. Acceptance of Terms
                </h2>
              </div>
              <p>
                By creating an account, installing the Oleidian Figma plugin, or accessing the Oleidian web platform, you agree to be bound by these Terms &amp; Conditions and all applicable laws and regulations.
              </p>
              <p>
                If you are entering into this agreement on behalf of a company, organization, or design studio, you represent that you have the legal authority to bind that entity to these terms.
              </p>
            </div>

            {/* 2. Description of Service */}
            <div id="services" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  2. Description of Service
                </h2>
              </div>
              <p>
                Oleidian provides a specialized Git-style version control layer designed specifically for Figma files. Features include:
              </p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-slate-700">
                <li>Creating visual design repositories mapped to Figma canvas components and UI kits.</li>
                <li>Committing visual diff snapshots with structured commit messages.</li>
                <li>Branching design explorations and merging changes via interactive Pull Requests.</li>
                <li>Collaborative review tools, design approvals, and activity timelines.</li>
              </ul>
            </div>

            {/* 3. Accounts & Security */}
            <div id="accounts" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  3. Account Registration &amp; Security
                </h2>
              </div>
              <p>
                You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. You agree to notify Oleidian immediately of any unauthorized access or breach of security.
              </p>
            </div>

            {/* 4. Intellectual Property */}
            <div id="ownership" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Layers className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  4. Intellectual Property &amp; Content Ownership
                </h2>
              </div>
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-4 text-[13px] text-slate-800">
                <strong>Your Assets Remain 100% Yours:</strong> Oleidian claims zero ownership rights over your Figma design files, component libraries, graphics, or code. You retain full copyright and intellectual property rights over all work pushed to our platform.
              </div>
              <p>
                The Oleidian web application code, logo, brand assets, software architecture, and Figma plugin code are the exclusive property of Oleidian.
              </p>
            </div>

            {/* 5. Acceptable Use */}
            <div id="acceptable-use" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <AlertOctagon className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  5. Acceptable Use Policy
                </h2>
              </div>
              <p>You agree not to engage in any of the following prohibited activities:</p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-slate-700">
                <li>Reverse engineering, decompiling, or attempting to extract source code from the Oleidian Service or plugin.</li>
                <li>Attempting to bypass row-level database security rules, rate limits, or authentication tokens.</li>
                <li>Using automated scripts to scrape or overload platform APIs.</li>
                <li>Uploading malicious payloads or infringing third-party trademarks/copyrights.</li>
              </ul>
            </div>

            {/* 6. Service SLAs & Uptime */}
            <div id="availability" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  6. Service Availability &amp; Maintenance
                </h2>
              </div>
              <p>
                While we strive for 99.9% platform availability, Oleidian is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. We reserve the right to perform scheduled maintenance, update APIs, or roll out bug fixes with minimal downtime.
              </p>
            </div>

            {/* 7. Limitation of Liability */}
            <div id="liability" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  7. Limitation of Liability
                </h2>
              </div>
              <p>
                To the maximum extent permitted by law, Oleidian shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data corruption, or business interruption arising from the use or inability to use our Service.
              </p>
            </div>

            {/* 8. Governing Law & Contact */}
            <div id="governing-law" className="bg-slate-950 text-white rounded-2xl p-8 shadow-md flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <Gavel className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-white tracking-tight">
                  8. Governing Law &amp; Legal Contact
                </h2>
              </div>
              <p className="text-slate-300">
                These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-1 text-[13px] text-slate-300 font-mono">
                <span><strong>Legal Enquiries:</strong> legal@oleidian.com</span>
                <span><strong>Support:</strong> support@oleidian.com</span>
              </div>
            </div>

          </article>
        </section>

      </main>

      {/* Shared Landing Footer */}
      <footer className="max-w-310 mx-auto px-4 pb-12 w-full text-slate-600 font-sans">
        <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row justify-between items-center text-[12px] gap-4">
          <span>&copy; {new Date().getFullYear()} Oleidian. Built for designers.</span>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/privacy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-slate-950 font-bold hover:underline">Terms &amp; Conditions</Link>
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
