"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderGit2,
  GitBranch,
  GitPullRequest,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  CheckCircle2,
  SplitSquareHorizontal,
  Plus,
  Edit3,
  Layers,
  Star,
  ChevronUp,
} from "lucide-react";

// Corner Dot Pins for Section Boundary Intersections
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

export default function LandingPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);

  // Hero Interactive Demo State
  const [heroBranch, setHeroBranch] = useState("main");
  const [heroSelectedLayer, setHeroSelectedLayer] = useState("button-primary");

  // Feature Showcase Active Tab
  const [activeFeatureTab, setActiveFeatureTab] = useState(0);

  useEffect(() => {
    async function checkAuth() {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
        }
      } catch (e) {
        setUser(null);
      }
    }
    checkAuth();
  }, []);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const featureTabs = [
    {
      id: "repos",
      num: "01",
      title: "Repositories",
      headline: "Every file, finally organized.",
      desc: "Turn any Figma file into a design repository. Track components, frames, and full libraries in one place — searchable, starred, and never lost in duplicated files again.",
      bullets: [
        "One repo per file, component library, or design system",
        "Star the ones you use most for quick access",
        "See commit count, contributors, and status at a glance",
      ],
      preview: {
        type: "repo",
        repos: [
          { name: "mobile-app-ui", commits: 18, contributors: 2, starred: true },
          { name: "design-system-tokens", commits: 42, contributors: 5, starred: true },
          { name: "web-landing-pages", commits: 9, contributors: 1, starred: false },
        ],
      },
    },
    {
      id: "commits",
      num: "02",
      title: "Visual Commits",
      headline: "See exactly what changed. Not just that something did.",
      desc: "Every push captures a snapshot. Open any commit to see a real visual diff — old frame vs new frame, with exact property-level changes called out.",
      bullets: [
        "Side-by-side slider and overlay diff views",
        "Property-level change logs (color, spacing, type, position)",
        "Roll back to any previous snapshot in one click",
      ],
      preview: {
        type: "diff",
        layerName: "Primary CTA Button Component",
        sha: "#c178524",
        props: [
          { name: "fills", before: "#3B82F6 (Blue)", after: "#2563EB (Royal)" },
          { name: "cornerRadius", before: "8px", after: "12px" },
        ],
      },
    },
    {
      id: "branches",
      num: "03",
      title: "Branches",
      headline: "Experiment without breaking what's live.",
      desc: "Want to try a wild redesign without touching the approved version? Branch it. Work in your own space, compare against main whenever you want, and merge when ready.",
      bullets: [
        "Unlimited branches per repository",
        "Visual branch graph — see design history at a glance",
        "Merge conflicts shown side-by-side, resolved in a click",
      ],
      preview: {
        type: "branch",
        branches: [
          { name: "main", status: "Live Production", color: "bg-emerald-500", text: "text-emerald-700" },
          { name: "dark-mode-exploration", status: "In Review", color: "bg-purple-500", text: "text-purple-700" },
          { name: "checkout-v2-test", status: "Draft", color: "bg-blue-500", text: "text-blue-700" },
        ],
      },
    },
    {
      id: "prs",
      num: "04",
      title: "Pull Requests",
      headline: "Approvals that actually make sense.",
      desc: "Open a pull request when a design is ready for review. Reviewers see the real diff, leave comments pinned directly on the frame, and approve or request changes.",
      bullets: [
        "Comments pinned directly to exact design elements",
        "Approve / Request changes workflow, just like code review",
        "Full audit history of who approved what, and when",
      ],
      preview: {
        type: "pr",
        title: "PR #e94881: New Navigation Concept",
        author: "Satyam Singh",
        comment: "Looks clean! Approved for merge into main branch.",
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] font-sans antialiased selection:bg-black selection:text-white flex flex-col relative">
      {/* ── BACKGROUND ATMOSPHERIC LIGHTING / VIDEO ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-[1px]"
        >
          <source src="/landing-bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,0,0,0.07),rgba(255,255,255,0))]" />
      </div>

      {/* ── 1. FLOATING PILL NAVIGATION HEADER ── */}
      <header className="sticky top-4 z-50 max-w-310 mx-auto px-4 w-full">
        <nav className="bg-white/85 backdrop-blur-xl border border-slate-200/90 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-all flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[16px] tracking-tight font-sans text-slate-950">
              GitDesign
            </span>
          </Link>

          <div className="hidden md:flex items-center bg-slate-100/90 border border-slate-200/80 p-1 rounded-full text-[13px] font-medium text-slate-600">
            <a href="#features" className="px-4 py-1.5 rounded-full hover:text-black hover:bg-white transition-all">
              Features
            </a>
            <a href="#how-it-works" className="px-4 py-1.5 rounded-full hover:text-black hover:bg-white transition-all">
              How it works
            </a>
            <a href="#plugin" className="px-4 py-1.5 rounded-full hover:text-black hover:bg-white transition-all">
              Plugin
            </a>
            <a href="#comparison" className="px-4 py-1.5 rounded-full hover:text-black hover:bg-white transition-all">
              Comparison
            </a>
            <a href="#faq" className="px-4 py-1.5 rounded-full hover:text-black hover:bg-white transition-all">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-2.5">
            {user ? (
              <Link
                href="/dashboard"
                className="bg-black hover:bg-slate-800 text-white rounded-full px-5 py-2 text-[12px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:inline-flex text-[13px] font-semibold text-slate-600 hover:text-black px-3.5 py-1.5 transition-colors"
                >
                  Sign In
                </Link>
                <a
                  href="#plugin"
                  className="bg-black hover:bg-slate-800 text-white rounded-full px-5 py-2 text-[12px] font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>Install Plugin</span>
                </a>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ── MAIN CONTENT CONTAINER WITH DASHED BOUNDARY BORDERS ── */}
      <main className="max-w-310 mx-auto w-full border-x border-dashed border-slate-300/80 bg-white/40 backdrop-blur-2xs relative my-6">

        {/* ── 2. HERO SECTION ── */}
        <section className="relative border-b border-dashed border-slate-300/80 py-16 md:py-24 px-6 md:px-12 flex flex-col items-center text-center">
          <CornerPins />

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-[12px] font-semibold text-slate-700 mb-6 shadow-2xs hover:shadow-xs transition-shadow"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Now available as a free Figma plugin</span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-900 font-bold">Figma &amp; Flowstep Ready</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-[38px] sm:text-[56px] md:text-[68px] font-bold text-slate-950 tracking-tight leading-[1.05] max-w-240 mb-6 font-sans"
          >
            Version control{" "}
            <span className="inline-flex items-center px-4 py-1 rounded-2xl bg-linear-to-r from-slate-950 via-slate-900 to-black text-white border border-slate-950 font-mono text-[32px] sm:text-[46px] md:text-[54px] align-middle shadow-md hover:scale-105 transition-transform cursor-default">
              {"{Git}"}
            </span>{" "}
            for Figma &amp; design teams.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[17px] sm:text-[20px] text-slate-600 max-w-190 leading-relaxed mb-9 font-normal"
          >
            GitDesign brings repos, commits, branches, and pull requests directly to your Figma files — so{" "}
            <code className="bg-slate-200/80 text-slate-900 font-mono px-2 py-0.5 rounded-md text-[14px] font-semibold border border-slate-300/80">
              &quot;final_v2_ACTUALLY_final.fig&quot;
            </code>{" "}
            never happens again.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4 mb-16 w-full sm:w-auto"
          >
            <a
              href="#plugin"
              className="w-full sm:w-auto bg-black hover:bg-slate-800 text-white font-bold text-[14px] px-8 py-4 rounded-full transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2.5 cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>Install Figma Plugin</span>
            </a>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto bg-white border border-slate-300 hover:border-slate-400 text-slate-900 font-bold text-[14px] px-7 py-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50"
            >
              <span>See how it works</span>
              <ArrowRight className="w-4 h-4 text-black" />
            </a>
          </motion.div>

          {/* Interactive Studio Canvas Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-275 rounded-2xl border border-dashed border-slate-300 bg-white shadow-2xl overflow-hidden text-left relative group"
          >
            <CornerPins />

            <div className="bg-slate-100/90 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
                <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
                <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
                <span className="text-[12px] font-mono text-slate-500 font-bold ml-2">
                  gitdesign / mobile-app-ui
                </span>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-lg text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setHeroBranch("main")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    heroBranch === "main"
                      ? "bg-white text-black shadow-2xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-emerald-600" />
                    main
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setHeroBranch("dark-mode")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    heroBranch === "dark-mode"
                      ? "bg-white text-black shadow-2xs"
                      : "text-slate-600 hover:text-black"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-purple-600" />
                    dark-mode-exploration
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Synced with Figma Canvas
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 bg-slate-50/50 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3 shadow-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-[12px] font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-black" />
                    Layer Inspector
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded font-bold">
                    ~ 1 modified
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 text-[12px]">
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-slate-700 font-medium">
                    <span>Frame 2147238701</span>
                    <span className="text-[9px] font-mono uppercase bg-slate-200 px-1 rounded">FRAME</span>
                  </div>
                  <div
                    onClick={() => setHeroSelectedLayer("button-primary")}
                    className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                      heroSelectedLayer === "button-primary"
                        ? "bg-amber-50 border-amber-300 text-amber-950 font-bold border-l-4 border-l-amber-500 shadow-2xs"
                        : "bg-white border-slate-200 text-slate-700"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                      Primary CTA Button
                    </span>
                    <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.2 rounded">
                      MODIFIED
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-950 flex items-center justify-between font-semibold border-l-4 border-l-emerald-500">
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-emerald-600" />
                      Hero Heading Text
                    </span>
                    <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded">
                      + ADDED
                    </span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
                    <SplitSquareHorizontal className="w-4 h-4 text-black" />
                    Visual Diff Comparison — Branch:{" "}
                    <code className="text-slate-950 font-bold font-mono">{heroBranch}</code>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    SHA: <strong className="text-black">#c178524</strong>
                  </span>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg flex flex-col gap-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900">
                    <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Layer Property Changes Detected:</span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] font-mono pt-1">
                    <span className="text-slate-600">fills:</span>
                    <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded line-through">
                      #3B82F6 (Blue)
                    </span>
                    <span className="text-amber-600 font-bold">→</span>
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                      #2563EB (Royal)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── 3. SOCIAL PROOF STRIP ── */}
        <section className="relative border-b border-dashed border-slate-300/80 py-8 px-6 text-center bg-white">
          <CornerPins />
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 text-slate-700 text-[13px] font-semibold">
            <ShieldCheck className="w-4.5 h-4.5 text-emerald-600" />
            <span>Built for design teams who are tired of losing track of their own work.</span>
          </div>
        </section>

        {/* ── 4. PROBLEM SECTION ("You know this feeling") ── */}
        <section className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12">
          <CornerPins />
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              The Pain Points
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold text-slate-950 tracking-tight mt-3 mb-3 font-sans">
              You know this feeling.
            </h2>
            <p className="text-[16px] text-slate-600 max-w-155 mx-auto">
              Design tools give you infinite freedom, but zero memory. Here is what happens every week:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white border border-dashed border-slate-300 rounded-2xl p-7 flex flex-col gap-4 shadow-xs relative group"
            >
              <CornerPins />
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-[18px] text-slate-950 font-sans leading-tight">
                <code className="bg-slate-100 px-2 py-0.5 rounded text-[14px] text-slate-900 border border-slate-200">
                  Homepage_v4_FINAL_v2.fig
                </code>
              </h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Every design file becomes a graveyard of &quot;final&quot; versions. Nobody knows which frame is actually live in production.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white border border-dashed border-slate-300 rounded-2xl p-7 flex flex-col gap-4 shadow-xs relative group"
            >
              <CornerPins />
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-[18px] text-slate-950 font-sans leading-tight">
                &quot;Wait, who changed the button color?&quot;
              </h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Someone edits a shared frame. Nobody knows what changed, when, or why — until it ships wrong in production.
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white border border-dashed border-slate-300 rounded-2xl p-7 flex flex-col gap-4 shadow-xs relative group"
            >
              <CornerPins />
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-[18px] text-slate-950 font-sans leading-tight">
                Feedback, scattered everywhere
              </h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Comments in Slack. Notes in email. A screenshot in a group chat. Nothing lives where the design actually lives.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ── 5. SOLUTION INTRO ("Meet GitDesign") ── */}
        <section className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12 bg-white">
          <CornerPins />
          <div className="max-w-230 mx-auto text-center flex flex-col items-center gap-6">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold shadow-md">
              <FolderGit2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-[34px] sm:text-[44px] font-bold text-slate-950 tracking-tight font-sans">
              Meet GitDesign.
            </h2>
            <p className="text-[18px] sm:text-[20px] text-slate-700 leading-relaxed font-normal">
              GitDesign is what developers have had for years, rebuilt for the way designers actually work. Every Figma file becomes a repository. Every save can be a commit. Every risky idea gets its own branch. Every approval happens through a real pull request — with the actual design attached, not a screenshot of it.
            </p>
            <div className="pt-3">
              <span className="text-[14px] font-bold text-slate-900 bg-slate-100 border border-slate-200 px-5 py-2.5 rounded-full shadow-2xs">
                No command line. No new tool to learn. Just a plugin, and your Figma files finally have a memory.
              </span>
            </div>
          </div>
        </section>

        {/* ── 6. CORE FEATURES (Interactive Tab Explorer) ── */}
        <section id="features" className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12">
          <CornerPins />
          <div className="text-center mb-14">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Core Features
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold text-slate-950 tracking-tight mt-3 font-sans">
              Built specifically for Figma workflows.
            </h2>
          </div>

          <div className="flex items-center justify-center gap-2 mb-12 flex-wrap">
            {featureTabs.map((tab, idx) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFeatureTab(idx)}
                className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                  activeFeatureTab === idx
                    ? "bg-black text-white shadow-md scale-105"
                    : "bg-white text-slate-600 hover:text-black border border-slate-200 hover:bg-slate-50"
                }`}
              >
                <span>{tab.num}. {tab.title}</span>
              </button>
            ))}
          </div>

          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 sm:p-12 shadow-xl grid grid-cols-1 lg:grid-cols-2 gap-10 items-center relative">
            <CornerPins />
            <div className="flex flex-col gap-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-md w-fit border border-slate-200">
                {featureTabs[activeFeatureTab].num} &middot; {featureTabs[activeFeatureTab].title}
              </span>
              <h3 className="text-[28px] sm:text-[34px] font-bold text-slate-950 tracking-tight leading-tight font-sans">
                {featureTabs[activeFeatureTab].headline}
              </h3>
              <p className="text-[15px] text-slate-600 leading-relaxed">
                {featureTabs[activeFeatureTab].desc}
              </p>
              <ul className="flex flex-col gap-3 pt-2 text-[14px] text-slate-800 font-medium">
                {featureTabs[activeFeatureTab].bullets.map((b, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-inner flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="font-bold text-[13px] text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-black" />
                  Live {featureTabs[activeFeatureTab].title} Preview
                </span>
                <span className="text-[10px] bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold">
                  GitDesign Studio
                </span>
              </div>

              {featureTabs[activeFeatureTab].preview.type === "repo" && (
                <div className="flex flex-col gap-3">
                  {featureTabs[activeFeatureTab].preview.repos.map((r, i) => (
                    <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <FolderGit2 className="w-5 h-5 text-black" />
                        <div>
                          <span className="font-bold text-[13px] text-black">{r.name}</span>
                          <p className="text-[11px] text-slate-500">{r.commits} commits &middot; {r.contributors} contributors</p>
                        </div>
                      </div>
                      {r.starred && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                    </div>
                  ))}
                </div>
              )}

              {featureTabs[activeFeatureTab].preview.type === "diff" && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between text-[12px] font-bold text-slate-900">
                    <span>{featureTabs[activeFeatureTab].preview.layerName}</span>
                    <span className="font-mono text-[10px] text-slate-500">{featureTabs[activeFeatureTab].preview.sha}</span>
                  </div>
                  {featureTabs[activeFeatureTab].preview.props.map((p, i) => (
                    <div key={i} className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-950 font-mono flex flex-col gap-1">
                      <span className="font-bold uppercase">{p.name}:</span>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-red-600">{p.before}</span>
                        <span className="font-bold">→</span>
                        <span className="font-bold text-emerald-700">{p.after}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {featureTabs[activeFeatureTab].preview.type === "branch" && (
                <div className="flex flex-col gap-3">
                  {featureTabs[activeFeatureTab].preview.branches.map((b, i) => (
                    <div key={i} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-2.5">
                        <GitBranch className="w-4 h-4 text-black" />
                        <span className="font-bold text-[13px] text-slate-950">{b.name}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.text} bg-slate-100 border border-slate-200`}>
                        {b.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {featureTabs[activeFeatureTab].preview.type === "pr" && (
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[13px] font-bold text-slate-950">
                    <GitPullRequest className="w-4 h-4 text-black" />
                    <span>{featureTabs[activeFeatureTab].preview.title}</span>
                  </div>
                  <p className="text-[12px] text-slate-500">Reviewed by {featureTabs[activeFeatureTab].preview.author}</p>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-[12px] font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>&quot;{featureTabs[activeFeatureTab].preview.comment}&quot;</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── 7. HOW IT WORKS (3-Step Pipeline) ── */}
        <section id="how-it-works" className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12 bg-white">
          <CornerPins />
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Setup Guide
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold text-slate-950 tracking-tight mt-3 mb-3 font-sans">
              From Figma to fully tracked, in three steps.
            </h2>
            <p className="text-[16px] text-slate-600 max-w-150 mx-auto">
              Getting started takes less than two minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col gap-4 relative">
              <CornerPins />
              <span className="w-9 h-9 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center font-mono shadow-xs">
                01
              </span>
              <h3 className="font-bold text-[18px] text-slate-950 font-sans">Install the plugin</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Add GitDesign to Figma in one click. No account setup gymnastics.
              </p>
            </div>

            <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col gap-4 relative">
              <CornerPins />
              <span className="w-9 h-9 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center font-mono shadow-xs">
                02
              </span>
              <h3 className="font-bold text-[18px] text-slate-950 font-sans">Push your first file</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Turn any file into a repo. Your first commit captures where you&apos;re starting from.
              </p>
            </div>

            <div className="p-8 bg-slate-50 border border-dashed border-slate-300 rounded-2xl flex flex-col gap-4 relative">
              <CornerPins />
              <span className="w-9 h-9 rounded-full bg-black text-white font-bold text-sm flex items-center justify-center font-mono shadow-xs">
                03
              </span>
              <h3 className="font-bold text-[18px] text-slate-950 font-sans">Branch, review, ship</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">
                Iterate freely, open pull requests when ready, and keep a permanent record of every decision.
              </p>
            </div>
          </div>
        </section>

        {/* ── 8. FIGMA PLUGIN SPOTLIGHT ── */}
        <section id="plugin" className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12">
          <CornerPins />
          <div className="bg-black text-white rounded-3xl p-8 sm:p-14 flex flex-col md:flex-row items-center justify-between gap-10 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col gap-5 max-w-155 z-10">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 bg-slate-800 px-3 py-1 rounded-full w-fit border border-slate-700">
                Figma Plugin Spotlight
              </span>
              <h2 className="text-[32px] sm:text-[44px] font-bold tracking-tight leading-tight font-sans text-white">
                Lives right inside Figma. Because that’s where design actually happens.
              </h2>
              <p className="text-[16px] text-slate-300 leading-relaxed">
                GitDesign isn’t a separate tool you have to remember to update. Push and pull straight from the Figma plugin panel — your repo stays in sync with your canvas, automatically.
              </p>
              <div className="pt-2">
                <a
                  href="#plugin"
                  className="inline-flex items-center gap-2.5 bg-white text-black hover:bg-slate-200 font-bold text-[14px] px-7 py-3.5 rounded-full transition-all shadow-md cursor-pointer active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-black" />
                  <span>Get the Plugin — it&apos;s free</span>
                </a>
              </div>
            </div>

            <div className="z-10 bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-90 flex flex-col gap-4 shadow-2xl relative">
              <CornerPins />
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-bold text-[13px] text-white">GitDesign Plugin Panel</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex flex-col gap-2.5">
                <div className="p-3 bg-slate-800/80 rounded-lg text-[12px] font-mono text-slate-300 flex justify-between">
                  <span>Current Branch:</span>
                  <span className="text-white font-bold">main</span>
                </div>
                <button
                  type="button"
                  className="bg-white text-black font-bold text-[13px] py-2.5 rounded-lg text-center hover:bg-slate-200 transition-colors shadow-xs"
                >
                  Push New Commit
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── 9. COMPARISON STRIP ── */}
        <section id="comparison" className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12">
          <CornerPins />
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              Comparison
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold text-slate-950 tracking-tight mt-3 mb-3 font-sans">
              This isn’t Figma’s version history.
            </h2>
            <p className="text-[16px] text-slate-600 max-w-150 mx-auto">
              See how GitDesign compares to native file history:
            </p>
          </div>

          <div className="overflow-x-auto relative">
            <table className="w-full text-left border-collapse bg-white rounded-2xl border border-dashed border-slate-300 shadow-xs">
              <thead>
                <tr className="border-b border-dashed border-slate-300 bg-slate-50">
                  <th className="py-4.5 px-6 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Feature</th>
                  <th className="py-4.5 px-6 text-[13px] font-bold text-slate-500 uppercase tracking-wider">Figma Version History</th>
                  <th className="py-4.5 px-6 text-[13px] font-bold text-black uppercase tracking-wider bg-emerald-50/60">GitDesign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[14px]">
                <tr>
                  <td className="py-4.5 px-6 font-semibold text-slate-950">Structure</td>
                  <td className="py-4.5 px-6 text-slate-500">One flat timeline</td>
                  <td className="py-4.5 px-6 font-bold text-slate-950 bg-emerald-50/40">Repos, branches, real history</td>
                </tr>
                <tr>
                  <td className="py-4.5 px-6 font-semibold text-slate-950">Diffs</td>
                  <td className="py-4.5 px-6 text-slate-500">Manual scrubbing</td>
                  <td className="py-4.5 px-6 font-bold text-slate-950 bg-emerald-50/40">Visual, side-by-side diffs</td>
                </tr>
                <tr>
                  <td className="py-4.5 px-6 font-semibold text-slate-950">Review</td>
                  <td className="py-4.5 px-6 text-slate-500">Comments scattered in file</td>
                  <td className="py-4.5 px-6 font-bold text-slate-950 bg-emerald-50/40">Structured pull requests</td>
                </tr>
                <tr>
                  <td className="py-4.5 px-6 font-semibold text-slate-950">Experimentation</td>
                  <td className="py-4.5 px-6 text-slate-500">Duplicate the whole file</td>
                  <td className="py-4.5 px-6 font-bold text-slate-950 bg-emerald-50/40">Branch just the part you need</td>
                </tr>
                <tr>
                  <td className="py-4.5 px-6 font-semibold text-slate-950">Conflicts</td>
                  <td className="py-4.5 px-6 text-slate-500">Overwritten silently</td>
                  <td className="py-4.5 px-6 font-bold text-slate-950 bg-emerald-50/40">Shown and resolved explicitly</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ── 10. TESTIMONIAL BLOCK ── */}
        <section className="relative border-b border-dashed border-slate-300/80 py-20 px-6 md:px-12 bg-white text-center">
          <CornerPins />
          <div className="max-w-210 mx-auto flex flex-col items-center gap-4">
            <p className="text-[22px] sm:text-[28px] font-bold text-slate-950 leading-snug tracking-tight font-sans italic">
              &quot;I stopped naming files &apos;final_v3&apos; the day I installed this.&quot;
            </p>
            <span className="text-[14px] text-slate-600 font-medium">— Early GitDesign User</span>
          </div>
        </section>

        {/* ── 11. FAQ SECTION ── */}
        <section id="faq" className="relative border-b border-dashed border-slate-300/80 py-20 md:py-24 px-6 md:px-12">
          <CornerPins />
          <div className="text-center mb-16">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              FAQ
            </span>
            <h2 className="text-[32px] sm:text-[42px] font-bold text-slate-950 tracking-tight mt-3 mb-3 font-sans">
              Frequently asked questions
            </h2>
          </div>

          <div className="flex flex-col gap-4 max-w-215 mx-auto">
            {[
              {
                q: "Do I need to know Git to use this?",
                a: "No. If you've ever saved a file, you already know everything you need.",
              },
              {
                q: "Does this replace Figma's version history?",
                a: "It builds on top of it. You get structure — repos, branches, pull requests — instead of one long unlabeled timeline.",
              },
              {
                q: "Will this slow down my Figma file?",
                a: "No. GitDesign syncs in the background through the plugin; it doesn't touch how your file performs.",
              },
              {
                q: "Can my whole team use it, or just me?",
                a: "Built for teams. Branches, pull requests, and reviewer comments only make sense with more than one person in the loop — though it works great solo too.",
              },
              {
                q: "Is it free?",
                a: "The plugin is free to install.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-[16px] text-slate-950 font-sans cursor-pointer hover:bg-slate-50"
                >
                  <span>{item.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="w-4 h-4 text-black shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>
                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-5 text-[14px] text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
                    >
                      {item.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── 12 & 13. FULL-WIDTH LIGHT THEME FOOTER WITH INTEGRATED CTA ── */}
      <footer className="w-full bg-[#f8fafc] border-t border-dashed border-slate-300/80 relative text-slate-800">
        {/* Inner Content Container matching max-w-[1240px] with continuous border-x lines */}
        <div className="max-w-310 mx-auto px-6 md:px-12 flex flex-col gap-16 relative border-x border-dashed border-slate-300/80 py-8">
          <CornerPins />

          {/* Integrated CTA Hero Card */}
          <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-8 sm:p-14 text-center shadow-xl flex flex-col items-center gap-6 relative">
            <CornerPins />

            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-black" />
              <span>Ready for Figma Version Control?</span>
            </div>

            <h2 className="text-[36px] sm:text-[54px] font-bold tracking-tight leading-[1.08] font-sans text-slate-950 max-w-190">
              Your Figma files deserve a memory.
            </h2>
            <p className="text-[17px] sm:text-[19px] text-slate-600 max-w-145 leading-relaxed">
              Install the plugin. Push your first file. Never lose track of a design decision again.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <a
                href="#plugin"
                className="bg-black hover:bg-slate-800 text-white font-bold text-[14px] px-8 py-4 rounded-full transition-all shadow-md flex items-center gap-2.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-white" />
                <span>Install Figma Plugin</span>
              </a>
              <Link
                href="/dashboard"
                className="bg-white border border-slate-300 hover:border-slate-400 text-slate-900 font-bold text-[14px] px-7 py-4 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:bg-slate-50"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-4 h-4 text-black" />
              </Link>
            </div>
          </div>

          {/* Clean Footer Links & Brand Section */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 border-t border-dashed border-slate-300 pt-12">
            {/* Brand Information */}
            <div className="flex flex-col gap-4 max-w-85">
              <Link href="/" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-xs group-hover:scale-105 transition-transform">
                  <FolderGit2 className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-[18px] tracking-tight font-sans text-slate-950">
                  GitDesign
                </span>
              </Link>
              <p className="text-[13px] text-slate-500 leading-relaxed font-normal">
                Git version control, rebuilt for Figma files and modern design teams. Track commits, branch iterations, and review pull requests seamlessly.
              </p>

              {/* Live Status Badge */}
              <div className="inline-flex items-center gap-2 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-full w-fit shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Plugin &amp; Web App: Operational</span>
              </div>
            </div>

            {/* Relevant Links Columns */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-12 text-[13px]">
              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-950 uppercase text-[11px] tracking-wider font-mono">
                  Product
                </span>
                <a href="#features" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Features
                </a>
                <a href="#how-it-works" className="text-slate-600 hover:text-black font-medium transition-colors">
                  How it works
                </a>
                <a href="#plugin" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Figma Plugin
                </a>
                <a href="#comparison" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Comparison Matrix
                </a>
                <a href="#faq" className="text-slate-600 hover:text-black font-medium transition-colors">
                  FAQ
                </a>
              </div>

              <div className="flex flex-col gap-3">
                <span className="font-bold text-slate-950 uppercase text-[11px] tracking-wider font-mono">
                  App Navigation
                </span>
                <Link href="/dashboard" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Dashboard
                </Link>
                <Link href="/dashboard/activity" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Activity Timeline
                </Link>
                <Link href="/dashboard/pulls" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Pull Requests
                </Link>
                <Link href="/login" className="text-slate-600 hover:text-black font-medium transition-colors">
                  Sign In / Register
                </Link>
              </div>
            </div>
          </div>

          {/* Copyright & Social Strip */}
          <div className="border-t border-slate-200/90 pt-6 flex flex-col sm:flex-row justify-between items-center text-[12px] text-slate-500 gap-4">
            <span>&copy; {new Date().getFullYear()} GitDesign. Built for designers.</span>
            <div className="flex items-center gap-6 font-medium">
              <a href="https://figma.com" target="_blank" rel="noreferrer" className="hover:text-black transition-colors">
                Figma Community
              </a>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-black transition-colors">
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
