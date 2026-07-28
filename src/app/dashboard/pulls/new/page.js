"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function NewPullRequestPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fileKey, setFileKey] = useState("");
  const [sourceBranch, setSourceBranch] = useState("");
  const [targetBranch, setTargetBranch] = useState("main");
  const [reviewers, setReviewers] = useState([]);
  const [reviewerInput, setReviewerInput] = useState("");

  // Available files/branches from existing commits
  const [availableFiles, setAvailableFiles] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);

      // Fetch unique file_keys from commits
      const { data } = await supabase
        .from("dvc_commits")
        .select("file_key, page_name, author")
        .order("timestamp", { ascending: false });

      if (data) {
        const files = [...new Set(data.map(d => d.file_key))].filter(Boolean);
        const branches = [...new Set(data.map(d => d.page_name))].filter(Boolean);
        setAvailableFiles(files);
        setAvailableBranches(branches.length ? branches : ["feature-branch", "redesign-v2", "component-updates"]);
        if (files[0]) setFileKey(files[0]);
        if (branches[0]) setSourceBranch(branches[0]);
      }

      setLoading(false);
    }
    init();
  }, [router]);

  function addReviewer() {
    const email = reviewerInput.trim();
    if (email && !reviewers.includes(email)) {
      setReviewers([...reviewers, email]);
      setReviewerInput("");
    }
  }

  function removeReviewer(email) {
    setReviewers(reviewers.filter(r => r !== email));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) { setError("A title is required."); return; }
    if (!fileKey) { setError("Please select a design file."); return; }
    setError("");
    setSubmitting(true);

    try {
      const { data, error: insertError } = await supabase
        .from("dvc_pull_requests")
        .insert({
          title: title.trim(),
          description: description.trim(),
          file_key: fileKey,
          source_branch: sourceBranch,
          target_branch: targetBranch,
          status: "open",
          author: user.email,
          author_id: user.id,
          reviewers: reviewers,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Create notification for reviewers (stored for demo — in prod, real user lookup)
      if (reviewers.length > 0 && data?.id) {
        await supabase.from("dvc_notifications").insert(
          reviewers.map(r => ({
            user_email: r,
            type: "review_requested",
            title: "Review requested",
            body: `${user.email} requested your review on: "${title.trim()}"`,
            pr_id: data.id,
            read: false,
          }))
        );
      }

      router.push(`/dashboard/pulls/${data.id}`);
    } catch (e) {
      console.error("Error creating PR:", e.message);
      setError("Failed to create pull request. Make sure the database table exists.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f9ff] font-sans">
        <span className="material-symbols-outlined animate-spin text-[28px] text-black">progress_activity</span>
      </div>
    );
  }

  return (
    <div className="text-black font-sans min-h-screen flex flex-row relative bg-transparent">
      {/* Background Video */}
      <video autoPlay loop muted playsInline className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none">
        <source src="/From%20Klickpin.com-%20Stylish%20Pinterest%20marketing%20ideas%20that%20feel%20fresh%20elevated%20and%20surprisingly%20easy%20to%20recreate%20at%20home%20for%20busy%20people%20who%20still.mp4" type="video/mp4" />
      </video>

      {/* Sidebar */}
      <aside className="w-[240px] bg-white/70 backdrop-blur-lg border-r border-[#d5d5d5]/40 flex flex-col flex-shrink-0 z-10 fixed top-0 bottom-0 left-0">
        <div className="p-6 border-b border-[#d5d5d5]/40 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/80 border border-[#c5c5c5]/40 rounded flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px] text-black">menu_book</span>
          </div>
          <div className="flex flex-col truncate">
            <span className="text-[13px] font-bold text-black tracking-tight">GitDesign</span>
            <span className="text-[11px] text-[#777777] font-medium">Design Systems</span>
          </div>
        </div>
        <nav className="flex-grow py-4 flex flex-col justify-between">
          <div className="flex flex-col">
            {[
              { id: "Dashboard", icon: "grid_view", href: "/dashboard" },
              { id: "Repositories", icon: "folder_open", href: "/dashboard" },
              { id: "Branches", icon: "call_split", href: "/dashboard" },
              { id: "Pull Requests", icon: "merge_type", href: "/dashboard/pulls" },
              { id: "Activity", icon: "history", href: "/dashboard" },
            ].map((tab) => (
              <Link
                key={tab.id}
                href={tab.href}
                className={`w-full flex items-center gap-4 px-6 py-[10px] text-[13px] text-left transition-colors relative ${
                  tab.id === "Pull Requests"
                    ? "bg-white/80 backdrop-blur-sm font-bold text-black border-l-[3px] border-black"
                    : "text-[#555555] hover:bg-[#e2e2e2]/40 hover:text-black"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                {tab.id}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-grow flex flex-col min-w-0 z-10 ml-[240px]">
        <header className="bg-white/70 backdrop-blur-lg border-b border-[#e5e5e5]/40 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-[14px]">
            <Link href="/dashboard" className="font-bold text-black hover:opacity-70 transition-opacity">GitDesign</Link>
            <span className="text-[#c5c5c5]">/</span>
            <Link href="/dashboard/pulls" className="text-[#555] hover:text-black transition-colors">Pull Requests</Link>
            <span className="text-[#c5c5c5]">/</span>
            <span className="font-semibold text-black">New</span>
          </div>
        </header>

        <main className="flex-grow p-8 max-w-4xl w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-[26px] font-bold tracking-tight text-black">Open a Pull Request</h1>
            <p className="text-[13px] text-[#666] mt-1">Propose design changes from a branch for team review before merging.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Branch selectors */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <h2 className="text-[13px] font-bold text-black">Branch Comparison</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                  <label className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Base Branch</label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[14px] text-[#888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">call_merge</span>
                    <select
                      value={targetBranch}
                      onChange={(e) => setTargetBranch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-[#e0e0e0] rounded bg-[#fafafa] text-[12px] text-black outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                    >
                      <option value="main">main</option>
                      <option value="develop">develop</option>
                    </select>
                  </div>
                </div>

                <span className="material-symbols-outlined text-[20px] text-[#bbb] mt-5">arrow_back</span>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                  <label className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Compare Branch</label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[14px] text-[#888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">call_split</span>
                    <select
                      value={sourceBranch}
                      onChange={(e) => setSourceBranch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-[#e0e0e0] rounded bg-[#fafafa] text-[12px] text-black outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                    >
                      {availableBranches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
                  <label className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Design File</label>
                  <div className="relative">
                    <span className="material-symbols-outlined text-[14px] text-[#888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">folder_open</span>
                    <select
                      value={fileKey}
                      onChange={(e) => setFileKey(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-[#e0e0e0] rounded bg-[#fafafa] text-[12px] text-black outline-none focus:border-black transition-colors appearance-none cursor-pointer"
                    >
                      {availableFiles.map(f => <option key={f} value={f}>{f}</option>)}
                      {availableFiles.length === 0 && <option value="">No files found</option>}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Title & Description */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <h2 className="text-[13px] font-bold text-black">Details</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Update button component padding and border radius"
                  className="px-3 py-2.5 border border-[#e0e0e0] rounded bg-[#fafafa] text-[13px] text-black placeholder-[#bbb] outline-none focus:border-black transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-[#555] uppercase tracking-wider">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the design changes, what was updated and why. Markdown supported."
                  rows={6}
                  className="px-3 py-2.5 border border-[#e0e0e0] rounded bg-[#fafafa] text-[13px] text-black placeholder-[#bbb] outline-none focus:border-black transition-colors resize-none font-sans"
                />
                <p className="text-[10px] text-[#aaa]">Markdown supported — use **bold**, *italic*, `code`, bullet lists</p>
              </div>
            </div>

            {/* Reviewers */}
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg p-6 flex flex-col gap-4 shadow-sm">
              <h2 className="text-[13px] font-bold text-black">Reviewers</h2>
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined text-[14px] text-[#888] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">person_add</span>
                  <input
                    type="email"
                    value={reviewerInput}
                    onChange={(e) => setReviewerInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addReviewer(); } }}
                    placeholder="Add reviewer by email"
                    className="pl-9 pr-3 py-2.5 border border-[#e0e0e0] rounded bg-[#fafafa] text-[12px] text-black placeholder-[#bbb] outline-none focus:border-black transition-colors w-full"
                  />
                </div>
                <button
                  type="button"
                  onClick={addReviewer}
                  className="px-4 py-2 border border-[#e0e0e0] rounded bg-white hover:bg-[#f5f5f5] text-[12px] font-semibold text-black transition-colors cursor-pointer"
                >
                  Add
                </button>
              </div>

              {reviewers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reviewers.map((r) => (
                    <div key={r} className="flex items-center gap-1.5 bg-[#f5f5f5] border border-[#e8e8e8] rounded-full px-3 py-1 text-[11px] font-medium text-black">
                      <div className="w-4 h-4 bg-black text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                        {r.slice(0, 1).toUpperCase()}
                      </div>
                      {r}
                      <button
                        type="button"
                        onClick={() => removeReviewer(r)}
                        className="text-[#888] hover:text-black ml-1 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[12px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-[12px] text-red-600 bg-red-50 border border-red-200 rounded px-4 py-3">
                <span className="material-symbols-outlined text-[16px]">error</span>
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <Link href="/dashboard/pulls" className="text-[12px] text-[#666] hover:text-black transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white font-semibold text-[13px] px-6 py-2.5 rounded hover:bg-black/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                    Opening…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">merge_type</span>
                    Open Pull Request
                  </>
                )}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
