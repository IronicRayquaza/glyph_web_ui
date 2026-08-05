"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Lenis from "lenis";
import {
  ShieldCheck,
  ArrowLeft,
  FileText,
  Lock,
  Eye,
  Database,
  Globe,
  UserCheck,
  Bell,
  HelpCircle,
  CheckCircle2,
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
  { id: "overview", label: "1. Overview & Scope", icon: Eye },
  { id: "data-collection", label: "2. Information We Collect", icon: Database },
  { id: "data-usage", label: "3. How We Use Data", icon: FileText },
  { id: "security", label: "4. Security & Storage", icon: Lock },
  { id: "third-parties", label: "5. Third-Party Services", icon: Globe },
  { id: "retention", label: "6. Data Retention & Deletion", icon: ShieldCheck },
  { id: "your-rights", label: "7. Your Rights & Choices", icon: UserCheck },
  { id: "contact", label: "8. Contact Information", icon: HelpCircle },
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState("overview");

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
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privacy &amp; Data Protection</span>
            </div>

            <h1 className="text-[36px] sm:text-[48px] font-bold text-slate-950 tracking-tight leading-tight mb-4">
              Privacy Policy
            </h1>

            <p className="text-[15px] sm:text-[17px] text-slate-600 max-w-180 leading-relaxed mb-6 font-normal">
              Transparency matters. Learn how Oleidian handles your Figma design metadata, commit history, user accounts, and visual diff previews securely.
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

        {/* Executive Summary Card (At a Glance) */}
        <section className="p-6 md:px-12 py-8 border-b border-dashed border-slate-300/80">
          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-6 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-[15px] font-bold text-slate-950">At a Glance: Our Privacy Commitments</h3>
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  Oleidian never sells your design data. We store only essential version control metadata (commit messages, branch pointers, frame diff snapshots) to provide version tracking inside Figma and our Web Dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Content & Sidebar Grid */}
        <section className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Left Table of Contents Sticky Sidebar */}
          <aside className="lg:col-span-4 flex flex-col gap-2">
            <div className="sticky top-24 bg-white/80 border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col gap-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 font-mono px-2">
                Table of Contents
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

          {/* Right Main Policy Text Content */}
          <article className="lg:col-span-8 flex flex-col gap-10 text-[14px] text-slate-700 leading-relaxed font-normal">
            
            {/* 1. Overview & Scope */}
            <div id="overview" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Eye className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  1. Overview &amp; Scope
                </h2>
              </div>
              <p>
                This Privacy Policy describes how <strong>Oleidian</strong> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, stores, and protects information when you use our web application, browser dashboard, Figma plugin, and related version control services (collectively, the &quot;Service&quot;).
              </p>
              <p>
                By accessing or using Oleidian, creating an account, or installing the Oleidian Figma Plugin, you agree to the collection and use of information in accordance with this policy. If you do not agree with any terms in this policy, please discontinue use of our Service.
              </p>
            </div>

            {/* 2. Information We Collect */}
            <div id="data-collection" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Database className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  2. Information We Collect
                </h2>
              </div>

              <p>We collect information to provide, maintain, and improve our design version control platform:</p>

              <div className="flex flex-col gap-3 pt-2">
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-1.5">
                  <span className="font-bold text-[13px] text-slate-950">A. Account &amp; Authentication Information</span>
                  <p className="text-[13px] text-slate-600">
                    When you sign up via Email or Third-Party OAuth providers (such as GitHub or Google), we store your primary email address, full name, avatar URL, and user ID token.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-1.5">
                  <span className="font-bold text-[13px] text-slate-950">B. Figma Plugin &amp; Design Metadata</span>
                  <p className="text-[13px] text-slate-600">
                    When you push visual commits or create branches from the Figma plugin panel, we collect file keys, frame names, commit messages, timestamp logs, branch names, and preview snapshot image URLs.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col gap-1.5">
                  <span className="font-bold text-[13px] text-slate-950">C. System Usage &amp; Diagnostics</span>
                  <p className="text-[13px] text-slate-600">
                    We collect standard browser telemetry, access logs, IP addresses, browser agent specs, and error stack traces to detect system issues and maintain service uptime.
                  </p>
                </div>
              </div>
            </div>

            {/* 3. How We Use Data */}
            <div id="data-usage" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  3. How We Use Your Information
                </h2>
              </div>
              <p>Oleidian utilizes the collected data exclusively for operational and security purposes:</p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-slate-700">
                <li>Providing visual diff comparisons, branch merging, and pull request reviews.</li>
                <li>Synchronizing Figma canvas state changes with web dashboard repositories.</li>
                <li>Sending notification alerts for assigned pull requests, review comments, and branch updates.</li>
                <li>Preventing malicious activities, unauthorized logins, and service abuse.</li>
                <li>Improving platform performance, UI workflows, and responsiveness.</li>
              </ul>
            </div>

            {/* 4. Security & Storage */}
            <div id="security" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  4. Data Security &amp; Encryption
                </h2>
              </div>
              <p>
                We enforce industry-standard security protocols to protect your data. All network communications between the browser, Figma plugin, and backend infrastructure are encrypted in transit via TLS 1.3/HTTPS.
              </p>
              <p>
                Database records and file storage buckets are safeguarded using enterprise-grade encryption at rest (AES-256) hosted on SOC 2 Type II compliant infrastructure. Access keys and OAuth access tokens are stored securely with strict row-level security (RLS) authorization rules.
              </p>
            </div>

            {/* 5. Third-Party Services */}
            <div id="third-parties" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  5. Third-Party Services &amp; Sub-Processors
                </h2>
              </div>
              <p>We partner with trusted service providers to support our cloud infrastructure:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70">
                  <strong className="text-slate-950 font-bold block text-[13px]">Supabase</strong>
                  <span className="text-[12px] text-slate-600">Database storage, row-level security policies, and user authentication infrastructure.</span>
                </div>
                <div className="p-4 border border-slate-200 rounded-xl bg-slate-50/70">
                  <strong className="text-slate-950 font-bold block text-[13px]">Figma REST &amp; Plugin API</strong>
                  <span className="text-[12px] text-slate-600">Reading frame nodes, exporting visual canvas previews, and plugin sync triggers.</span>
                </div>
              </div>
            </div>

            {/* 6. Data Retention & Deletion */}
            <div id="retention" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  6. Data Retention &amp; Deletion
                </h2>
              </div>
              <p>
                We retain your account data and commit history for as long as your account remains active. If you request account deletion or delete a repository, associated commit history, branch references, and notification logs are permanently removed from our active database within 30 days.
              </p>
            </div>

            {/* 7. Your Rights & Choices */}
            <div id="your-rights" className="bg-white border border-slate-200 rounded-2xl p-8 shadow-2xs flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-900 flex items-center justify-center shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-slate-950 tracking-tight">
                  7. Your Rights &amp; Choices
                </h2>
              </div>
              <p>Depending on your location (including GDPR &amp; CCPA jurisdictions), you have rights regarding your personal information:</p>
              <ul className="list-disc pl-5 flex flex-col gap-2 text-slate-700">
                <li><strong>Access &amp; Export:</strong> You can request a copy of your stored visual commit records and account details.</li>
                <li><strong>Correction:</strong> You can update profile information directly inside your dashboard settings.</li>
                <li><strong>Erasure:</strong> You may request complete deletion of your account data by contacting our privacy team.</li>
              </ul>
            </div>

            {/* 8. Contact Information */}
            <div id="contact" className="bg-slate-950 text-white rounded-2xl p-8 shadow-md flex flex-col gap-4 scroll-mt-28">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <h2 className="text-[20px] font-bold text-white tracking-tight">
                  8. Contact Information &amp; Support
                </h2>
              </div>
              <p className="text-slate-300">
                If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please reach out to our privacy officer:
              </p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col gap-1 text-[13px] text-slate-300 font-mono">
                <span><strong>Email:</strong> privacy@oleidian.com</span>
                <span><strong>Help Desk:</strong> support@oleidian.com</span>
                <span><strong>Location:</strong> San Francisco, CA &middot; Global Remote Operations</span>
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
            <Link href="/privacy" className="text-slate-950 font-bold hover:underline">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms &amp; Conditions</Link>
            <Link href="/" className="hover:text-black transition-colors">Home</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
