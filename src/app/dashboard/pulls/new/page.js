"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import {
  GitFork,
  GitMerge,
  GitPullRequest,
  CheckCircle2,
  FolderGit2,
  FileEdit,
  AlertCircle,
  ArrowLeft,
  UserPlus,
  X,
  Lightbulb,
  Check,
  Loader2,
} from "lucide-react";

function NewPullRequestContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileKey, setFileKey] = useState("");
  const [sourceBranch, setSourceBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [reviewers, setReviewers] = useState([]);
  const [reviewerInput, setReviewerInput] = useState("");

  // Available files & branches from existing commits
  const [availableFiles, setAvailableFiles] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);

  // Real branches from dvc_branches table
  const [dbBranches, setDbBranches] = useState([]);
  const [sourceBranchId, setSourceBranchId] = useState("");
  const [targetBranchId, setTargetBranchId] = useState("");

  async function fetchDbBranches(fk, preSelectSourceId, preSelectBranchName) {
    if (!fk) { setDbBranches([]); return; }
    try {
      const { data } = await supabase
        .from("dvc_branches")
        .select("id,name,head_commit_id,file_key")
        .order("created_at", { ascending: true });
      const allRows = data || [];
      let rows = allRows.filter(b => b.file_key === fk);
      if (rows.length === 0 && allRows.length > 0) {
        rows = allRows;
      }
      setDbBranches(rows);
      if (rows.length > 0) {
        const mainB = rows.find(b => b.name === "main") || rows[0];
        setTargetBranchId(mainB.id);
        setTargetBranch(mainB.name);

        const nonMain = rows.filter(b => b.id !== mainB.id);
        let srcB = null;
        if (preSelectSourceId) {
          srcB = rows.find(b => b.id === preSelectSourceId);
        }
        if (!srcB && preSelectBranchName) {
          srcB = rows.find(b => b.name === preSelectBranchName);
        }
        if (!srcB) {
          srcB = nonMain.length > 0 ? nonMain[nonMain.length - 1] : rows[0];
        }
        if (srcB) {
          setSourceBranchId(srcB.id);
          setSourceBranch(srcB.name);
        }
      }
    } catch {
      setDbBranches([]);
    }
  }

  async function fetchNotifications(userId) {
    try {
      const { data } = await supabase
        .from("dvc_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
    } catch {
      setNotifications([]);
    }
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from("dvc_notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markNotifRead(notifId) {
    await supabase.from("dvc_notifications").update({ read: true }).eq("id", notifId);
    setNotifications(prev => prev.map(n => (n.id === notifId ? { ...n, read: true } : n)));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    async function init() {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);
        await fetchNotifications(currentUser.id);

        const paramFile = searchParams.get("fileKey") || searchParams.get("repo") || "";
        const paramBranch = searchParams.get("branch") || "";
        const paramBranchId = searchParams.get("sourceBranchId") || "";

        // Fetch commits & branches to assemble comprehensive file & branch options
        const [commitRes, branchRes] = await Promise.all([
          supabase.from("dvc_commits").select("file_key, branch, frame_name").order("timestamp", { ascending: false }),
          supabase.from("dvc_branches").select("id, name, file_key").order("created_at", { ascending: true }),
        ]);

        const commitRows = commitRes.data || [];
        const dbBranchRows = branchRes.data || [];

        const commitFiles = commitRows.map(c => c.file_key).filter(Boolean);
        const branchFiles = dbBranchRows.map(b => b.file_key).filter(Boolean);
        const commitBranches = commitRows.map(c => c.branch).filter(Boolean);
        const dbBranchNames = dbBranchRows.map(b => b.name).filter(Boolean);

        const allFiles = Array.from(new Set([
          ...(paramFile ? [paramFile] : []),
          ...commitFiles,
          ...branchFiles,
        ]));

        const allBranches = Array.from(new Set([
          ...(paramBranch ? [paramBranch] : []),
          ...commitBranches,
          ...dbBranchNames,
        ]));

        setAvailableFiles(allFiles);
        setAvailableBranches(allBranches);

        const selectedFile = paramFile || allFiles[0] || "";
        setFileKey(selectedFile);

        const selectedSource = paramBranch || allBranches[0] || "";
        setSourceBranch(selectedSource);

        if (selectedFile) {
          await fetchDbBranches(selectedFile, paramBranchId, paramBranch);
        }
      } catch (e) {
        console.error("Error initializing PR form:", e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router, searchParams]);

  function addReviewer(emailToAdd) {
    const val = (emailToAdd || reviewerInput).trim().toLowerCase();
    if (!val) return;
    if (reviewers.includes(val)) return;
    setReviewers([...reviewers, val]);
    if (!emailToAdd) setReviewerInput("");
  }

  function removeReviewer(emailToRemove) {
    setReviewers(reviewers.filter(r => r !== emailToRemove));
  }

  function insertMarkdown(type) {
    if (type === "bold") setDescription(prev => prev + " **bold text**");
    if (type === "italic") setDescription(prev => prev + " *italic text*");
    if (type === "code") setDescription(prev => prev + " `code`");
    if (type === "list") setDescription(prev => prev + "\n- Item 1\n- Item 2");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Please provide a title for your pull request.");
      return;
    }

    setSubmitting(true);

    try {
      const srcBranch = dbBranches.find(b => b.id === sourceBranchId);
      const tgtBranch = dbBranches.find(b => b.id === targetBranchId);

      const payload = {
        title: title.trim(),
        description: description.trim(),
        file_key: fileKey,
        source_branch: srcBranch?.name || sourceBranch || "-",
        target_branch: tgtBranch?.name || targetBranch || "main",
        source_branch_id: sourceBranchId || null,
        target_branch_id: targetBranchId || null,
        status: "open",
        author: user?.email?.split("@")[0] || "Designer",
        user_id: user?.id,
        created_at: new Date().toISOString(),
      };

      const { data: newPr, error: prErr } = await supabase
        .from("dvc_pull_requests")
        .insert(payload)
        .select()
        .single();

      if (prErr) throw prErr;

      if (reviewers.length > 0) {
        const notifInserts = reviewers.map(revEmail => ({
          user_id: user?.id,
          title: `Assigned PR: "${title.trim().slice(0, 40)}..."`,
          message: `You were added as a reviewer for PR #${newPr.id.slice(0, 7)} by ${user?.email}`,
          read: false,
          created_at: new Date().toISOString(),
        }));
        await supabase.from("dvc_notifications").insert(notifInserts);
      }

      router.push(`/dashboard/pulls/${newPr.id}`);
    } catch (err) {
      console.error("Error creating PR:", err.message);
      setError(err.message || "Failed to create pull request. Please try again.");
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grow flex flex-col min-w-0">
        <Header
          user={user}
          notifications={notifications}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          markAllRead={markAllRead}
          markNotifRead={markNotifRead}
          setIsSearchOpen={setIsSearchOpen}
          onSignOut={handleSignOut}
        />
        <main className="grow p-8 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center min-h-100">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-[13px] text-[#666666] font-medium">Preparing PR form...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="grow flex flex-col min-w-0">
      {/* Top Header Component */}
      <Header
        user={user}
        notifications={notifications}
        isNotifOpen={isNotifOpen}
        setIsNotifOpen={setIsNotifOpen}
        markAllRead={markAllRead}
        markNotifRead={markNotifRead}
        setIsSearchOpen={setIsSearchOpen}
        onSignOut={handleSignOut}
      />

      {/* Main Content Container */}
      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Breadcrumbs & Title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 text-[12px] text-[#666666] font-medium">
            <Link href="/dashboard" className="hover:text-black transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/pulls" className="hover:text-black transition-colors">
              Pull Requests
            </Link>
            <span>/</span>
            <span className="font-bold text-black">New</span>
          </div>

          <h1 className="text-[26px] font-sans tracking-tight text-black font-bold mt-1">
            Open a Pull Request
          </h1>
          <p className="text-[13px] text-[#666666]">
            Propose design system changes from a branch for team review before merging into production files.
          </p>
        </div>

        {/* 2-Column Form Layout */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left Column (2/3 width): Branch Comparison + Title & Description */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Branch Comparison Banner */}
            <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GitFork className="w-5 h-5 text-black" />
                  <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
                    Branch Comparison & Target File
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Able to merge
                </span>
              </div>

              {/* Branch Merge Flow Bar */}
              <div className="bg-white/50 border border-[#e0e0e4]/60 rounded-lg p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-[#666666]">Merging:</span>
                  <span className="bg-white border border-[#c5c5c5] font-mono text-[11px] font-bold text-black px-2.5 py-1 rounded flex items-center gap-1">
                    <GitFork className="w-3.5 h-3.5" />
                    {dbBranches.find(b => b.id === sourceBranchId)?.name || sourceBranch || "(source)"}
                  </span>
                  <span className="text-[#888888] font-bold">into</span>
                  <span className="bg-white border border-[#c5c5c5] font-mono text-[11px] font-bold text-black px-2.5 py-1 rounded flex items-center gap-1">
                    <GitMerge className="w-3.5 h-3.5" />
                    {dbBranches.find(b => b.id === targetBranchId)?.name || targetBranch || "main"}
                  </span>
                </div>
                <div className="text-[11px] text-[#777777]">
                  Target File: <strong className="text-black">oleidian/{fileKey || "local"}</strong>
                </div>
              </div>

              {/* Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Base Branch (Target) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Base Branch (Target)
                  </label>
                  <div className="relative">
                    <GitMerge className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {dbBranches.length > 0 ? (
                      <select
                        value={targetBranchId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setTargetBranchId(id);
                          const found = dbBranches.find(b => b.id === id);
                          if (found) setTargetBranch(found.name);
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                      >
                        {dbBranches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={targetBranch}
                        onChange={(e) => setTargetBranch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                      >
                        <option value="main">main</option>
                        <option value="develop">develop</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Compare Branch (Source) */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Compare Branch (Source)
                  </label>
                  <div className="relative">
                    <GitFork className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    {dbBranches.length > 0 ? (
                      <select
                        value={sourceBranchId}
                        onChange={(e) => {
                          const id = e.target.value;
                          setSourceBranchId(id);
                          const found = dbBranches.find(b => b.id === id);
                          if (found) setSourceBranch(found.name);
                        }}
                        className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                      >
                        {dbBranches.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={sourceBranch}
                        onChange={(e) => setSourceBranch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                      >
                        {availableBranches.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Target Design File */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Figma Design File
                  </label>
                  <div className="relative">
                    <FolderGit2 className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={fileKey}
                      onChange={(e) => { setFileKey(e.target.value); fetchDbBranches(e.target.value, null, null); }}
                      className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                    >
                      {availableFiles.map((f) => (
                        <option key={f} value={f}>oleidian/{f}</option>
                      ))}
                      {availableFiles.length === 0 && <option value="">Select a design file...</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Description Form Card */}
            <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#f0f0f2] pb-3">
                <FileEdit className="w-5 h-5 text-black" />
                <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
                  Pull Request Details
                </h2>
              </div>

              {/* Title Input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-[#888888]">
                    {title.length}/100 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  maxLength={100}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Merge feature-branch into main"
                  className="px-3.5 py-2.5 border border-[#c5c5c5] focus:border-black rounded-lg bg-white text-[13px] font-semibold text-black placeholder-[#999999] outline-none focus:ring-1 focus:ring-black transition-all"
                  required
                />
              </div>

              {/* Description Input & Toolbar */}
              <div className="flex flex-col gap-1.5 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Description & Context
                  </label>
                  {/* Markdown Format Helpers */}
                  <div className="flex items-center gap-1 select-none">
                    <button
                      type="button"
                      onClick={() => insertMarkdown("bold")}
                      className="px-1.5 py-0.5 text-[10px] font-bold text-[#666666] hover:bg-[#f0f0f2] rounded border border-[#e0e0e0]"
                      title="Add bold text"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("italic")}
                      className="px-1.5 py-0.5 text-[10px] font-italic text-[#666666] hover:bg-[#f0f0f2] rounded border border-[#e0e0e0]"
                      title="Add italic text"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("code")}
                      className="px-1.5 py-0.5 text-[10px] font-mono text-[#666666] hover:bg-[#f0f0f2] rounded border border-[#e0e0e0]"
                      title="Add code snippet"
                    >
                      &lt;/&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown("list")}
                      className="px-1.5 py-0.5 text-[10px] text-[#666666] hover:bg-[#f0f0f2] rounded border border-[#e0e0e0]"
                      title="Add bullet list"
                    >
                      List
                    </button>
                  </div>
                </div>

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what visual components were modified, why this change was made, and link relevant Figma design frames..."
                  rows={6}
                  className="px-3.5 py-2.5 border border-[#c5c5c5] focus:border-black rounded-lg bg-white text-[13px] text-black placeholder-[#999999] outline-none focus:ring-1 focus:ring-black transition-all resize-none font-sans leading-relaxed"
                />
                <p className="text-[11px] text-[#888888]">
                  Markdown formatting supported - use <code className="font-mono text-black bg-[#f0f0f2] px-1 rounded">**bold**</code>, <code className="font-mono text-black bg-[#f0f0f2] px-1 rounded">*italic*</code>, or bullet lists.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 text-red-600" />
                {error}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/dashboard/pulls"
                className="text-[13px] font-bold text-[#666666] hover:text-black transition-colors flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Cancel & Return
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white font-bold text-[13px] px-6 py-2.5 rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Pull Request...
                  </>
                ) : (
                  <>
                    <GitPullRequest className="w-4 h-4" />
                    Create Pull Request
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column (1/3 width): Reviewers & Guidelines */}
          <div className="flex flex-col gap-6">
            {/* Reviewers Card */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-black" />
                  <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
                    Reviewers
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-[#666666] bg-[#f0f0f0] px-2 py-0.5 rounded-full border border-[#e0e0e0]">
                  {reviewers.length} Assigned
                </span>
              </div>

              {/* Add Reviewer Input */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <div className="relative grow">
                    <UserPlus className="w-4 h-4 text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      value={reviewerInput}
                      onChange={(e) => setReviewerInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addReviewer();
                        }
                      }}
                      placeholder="Enter reviewer email..."
                      className="pl-9 pr-3 py-2 border border-[#c5c5c5] focus:border-black rounded-lg bg-white text-[12px] font-medium text-black placeholder-[#999999] outline-none transition-all w-full"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addReviewer()}
                    className="px-3 py-2 border border-[#c5c5c5] hover:bg-black hover:text-white text-[12px] font-bold text-black rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Reviewers List Chips */}
              {reviewers.length > 0 && (
                <div className="flex flex-col gap-2 pt-2 border-t border-[#f0f0f2]">
                  {reviewers.map((r) => (
                    <div
                      key={r}
                      className="flex items-center justify-between bg-[#f8f8fa] border border-[#e0e0e4] rounded-lg px-3 py-1.5 text-[11px] font-semibold text-black"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 bg-black text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                          {r.slice(0, 1).toUpperCase()}
                        </div>
                        <span className="truncate">{r}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeReviewer(r)}
                        className="text-[#888888] hover:text-black cursor-pointer shrink-0 ml-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Design PR Guidelines Card */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-black font-bold text-[14px]">
                <Lightbulb className="w-4.5 h-4.5 text-amber-500" />
                Design Review Best Practices
              </div>
              <ul className="text-[12px] text-[#666666] flex flex-col gap-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Summarize modified component tokens (fills, strokes, corner radius).</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Assign at least one Design Lead for visual approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Verify that node counts match target Figma frames.</span>
                </li>
              </ul>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function NewPullRequestPage() {
  return (
    <Suspense fallback={<div className="grow flex items-center justify-center text-[13px] text-[#888]">Loading…</div>}>
      <NewPullRequestContent />
    </Suspense>
  );
}
