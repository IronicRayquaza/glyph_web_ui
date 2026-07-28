"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";

export default function NewPullRequestPage() {
  const router = useRouter();

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

  async function fetchNotifications(userId) {
    try {
      const { data } = await supabase
        .from("dvc_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
    } catch (e) {
      setNotifications([]);
    }
  }

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("dvc_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markNotifRead(notifId) {
    await supabase.from("dvc_notifications").update({ read: true }).eq("id", notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // Fetch unique file_keys & page_names from commits
      const { data } = await supabase
        .from("dvc_commits")
        .select("file_key, page_name, author")
        .order("timestamp", { ascending: false });

      if (data) {
        const files = [...new Set(data.map((d) => d.file_key))].filter(Boolean);
        const branches = [...new Set(data.map((d) => d.page_name))].filter(Boolean);
        setAvailableFiles(files);
        setAvailableBranches(
          branches.length ? branches : ["Page 1", "component-updates", "dark-mode-tokens"]
        );
        if (files[0]) setFileKey(files[0]);
        if (branches[0]) setSourceBranch(branches[0]);
      }

      await fetchNotifications(user.id);
      setLoading(false);
    }
    init();
  }, [router]);

  function addReviewer(emailToAdd) {
    const targetEmail = (emailToAdd || reviewerInput).trim();
    if (targetEmail && !reviewers.includes(targetEmail)) {
      setReviewers([...reviewers, targetEmail]);
      setReviewerInput("");
    }
  }

  function removeReviewer(email) {
    setReviewers(reviewers.filter((r) => r !== email));
  }

  // Insert markdown helpers into description textarea
  function insertMarkdown(tag) {
    switch (tag) {
      case "bold":
        setDescription((prev) => prev + " **bold text** ");
        break;
      case "italic":
        setDescription((prev) => prev + " *italic text* ");
        break;
      case "code":
        setDescription((prev) => prev + " `code snippet` ");
        break;
      case "list":
        setDescription((prev) => prev + "\n- Item 1\n- Item 2\n");
        break;
      default:
        break;
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setError("A pull request title is required.");
      return;
    }
    if (!fileKey) {
      setError("Please select a target design file.");
      return;
    }
    setError("");
    setSubmitting(true);

    try {
      const { data, error: insertError } = await supabase
        .from("dvc_pull_requests")
        .insert({
          title: title.trim(),
          description: description.trim(),
          file_key: fileKey,
          source_branch: sourceBranch || "Page 1",
          target_branch: targetBranch || "main",
          status: "open",
          author: user.email,
          author_id: user.id,
          reviewers: reviewers,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create notification for reviewers
      if (reviewers.length > 0 && data?.id) {
        await supabase.from("dvc_notifications").insert(
          reviewers.map((r) => ({
            user_email: r,
            type: "review_requested",
            title: "Review requested",
            body: `${user.email} requested your review on: "${title.trim()}"`,
            pr_id: data.id,
            read: false,
          }))
        );
      }

      router.push(`/dashboard/pulls/${data.id.slice(0, 6)}`);
    } catch (e) {
      console.error("Error creating PR:", e.message);
      setError("Failed to create pull request. Please verify connection and try again.");
    } finally {
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
        <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center min-h-125">
          <div className="flex flex-col items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-[32px] text-black">
              progress_activity
            </span>
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
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-black">call_split</span>
                  <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
                    Branch Comparison & Target File
                  </h2>
                </div>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">check_circle</span>
                  Able to merge
                </span>
              </div>

              {/* Branch Merge Flow Bar */}
              <div className="bg-[#f8f9fc] border border-[#e0e0e4] rounded-lg p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-[#666666]">Merging:</span>
                  <span className="bg-white border border-[#c5c5c5] font-mono text-[11px] font-bold text-black px-2.5 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">call_split</span>
                    {sourceBranch || "Page 1"}
                  </span>
                  <span className="text-[#888888] font-bold">into</span>
                  <span className="bg-white border border-[#c5c5c5] font-mono text-[11px] font-bold text-black px-2.5 py-1 rounded flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">call_merge</span>
                    {targetBranch || "main"}
                  </span>
                </div>

                <div className="text-[11px] text-[#777777]">
                  Target File: <strong className="text-black">gitdesign/{fileKey || "local"}</strong>
                </div>
              </div>

              {/* Selectors Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {/* Base Branch */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Base Branch (Target)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[16px] text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      call_merge
                    </span>
                    <select
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                    >
                      <option value="main">main</option>
                      <option value="develop">develop</option>
                    </select>
                  </div>
                </div>

                {/* Compare Branch */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Compare Branch (Source)
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[16px] text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      call_split
                    </span>
                    <select
                      value={sourceBranch}
                      onChange={(e) => setSourceBranch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                    >
                      {availableBranches.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Design File */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                    Figma Design File
                  </label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[16px] text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      folder_open
                    </span>
                    <select
                      value={fileKey}
                      onChange={(e) => setFileKey(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 border border-[#c5c5c5] rounded-lg bg-white text-[12px] font-bold text-black outline-none focus:border-black transition-colors cursor-pointer appearance-none"
                    >
                      {availableFiles.map((f) => (
                        <option key={f} value={f}>
                          gitdesign/{f}
                        </option>
                      ))}
                      {availableFiles.length === 0 && <option value="">gitdesign/local</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Description Form Card */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-[#f0f0f2] pb-3">
                <span className="material-symbols-outlined text-[20px] text-black">edit_note</span>
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
                  placeholder="e.g. Update button component padding and border radius tokens"
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
                  Markdown formatting supported — use <code className="font-mono text-black bg-[#f0f0f2] px-1 rounded">**bold**</code>, <code className="font-mono text-black bg-[#f0f0f2] px-1 rounded">*italic*</code>, or bullet lists.
                </p>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-center gap-2 text-[12px] font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl p-4">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href="/dashboard/pulls"
                className="text-[13px] font-bold text-[#666666] hover:text-black transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Cancel & Return
              </Link>

              <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white font-bold text-[13px] px-6 py-2.5 rounded-lg hover:bg-black/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer shadow-sm"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">
                      progress_activity
                    </span>
                    Creating Pull Request...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">merge_type</span>
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
                  <span className="material-symbols-outlined text-[20px] text-black">group_add</span>
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
                    <span className="material-symbols-outlined text-[16px] text-[#888888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      person_add
                    </span>
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

                {/* Team Quick Suggestions */}
                <div className="flex flex-col gap-1 pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">
                    Suggested Reviewers
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {["design-lead@gitdesign.com", "reviewer@company.com"].map((email) => (
                      <button
                        key={email}
                        type="button"
                        onClick={() => addReviewer(email)}
                        className="text-[10px] font-semibold text-[#555555] hover:text-black bg-[#f0f0f2] hover:bg-[#e4e4e8] px-2 py-1 rounded-md border border-[#e0e0e4] cursor-pointer transition-colors"
                      >
                        + {email.split("@")[0]}
                      </button>
                    ))}
                  </div>
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
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Design PR Guidelines Card */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-black font-bold text-[14px]">
                <span className="material-symbols-outlined text-[18px] text-amber-500">lightbulb</span>
                Design Review Best Practices
              </div>
              <ul className="text-[12px] text-[#666666] flex flex-col gap-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">
                    check
                  </span>
                  <span>Summarize modified component tokens (fills, strokes, corner radius).</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">
                    check
                  </span>
                  <span>Assign at least one Design Lead for visual approval.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-emerald-600 shrink-0 mt-0.5">
                    check
                  </span>
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
