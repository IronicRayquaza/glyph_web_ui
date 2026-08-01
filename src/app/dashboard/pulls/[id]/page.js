"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import DesignInspectPanel from "@/components/dashboard/DesignInspectPanel";

const STATUS_CONFIG = {
  open: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Open" },
  approved: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Approved" },
  changes_requested: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Changes Requested" },
  merged: { bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", label: "Merged" },
  closed: { bg: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-400", label: "Closed" },
};

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

// ─── Visual Diff Slider Component ───────────────────────────────────────────
function VisualDiffSlider({ beforeUrl, afterUrl }) {
  const [sliderX, setSliderX] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  function onMouseMove(e) {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(98, Math.max(2, x)));
  }

  function onTouchMove(e) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(98, Math.max(2, x)));
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-[#e0e0e0] select-none cursor-col-resize shadow-xs"
      style={{ aspectRatio: "16/9", background: "#f0f0f2" }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => setDragging(false)}
    >
      {/* Before (full width, clipped on right) */}
      <div className="absolute inset-0">
        {beforeUrl ? (
          <img src={beforeUrl} alt="Before" className="w-full h-full object-contain bg-[#f8f8f8]" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#999999] flex-col gap-2">
            <span className="material-symbols-outlined text-[32px] opacity-40">image</span>
            <span className="text-[12px] font-medium">No snapshot available for base branch (main)</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end p-3 pointer-events-none">
          <span className="bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm">
            BEFORE · main
          </span>
        </div>
      </div>

      {/* After (clipped on left by slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderX}%)` }}
      >
        {afterUrl ? (
          <img src={afterUrl} alt="After" className="w-full h-full object-contain bg-[#f8f8f8]" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#999999] flex-col gap-2">
            <span className="material-symbols-outlined text-[32px] opacity-40">image</span>
            <span className="text-[12px] font-medium">No snapshot available for compare branch</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
          <span className="bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm">
            AFTER · feature branch
          </span>
        </div>
      </div>

      {/* Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-lg z-10 pointer-events-none"
        style={{ left: `${sliderX}%` }}
      />

      {/* Drag Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-8 h-8 bg-white rounded-full shadow-lg border border-[#e0e0e0] flex items-center justify-center cursor-col-resize"
        style={{ left: `${sliderX}%` }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <span className="material-symbols-outlined text-[16px] text-black">drag_handle</span>
      </div>

      {/* Percentage indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
        {Math.round(sliderX)}%
      </div>
    </div>
  );
}

// ─── Comment Thread Component ────────────────────────────────────────────────
function CommentThread({ comments, prId, user, onNewComment }) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!body.trim() || !user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("dvc_pr_comments")
        .insert({
          pr_id: prId,
          author_id: user.id,
          author_name: user.email,
          body: body.trim(),
          resolved: false,
        })
        .select()
        .single();
      if (error) throw error;
      setBody("");
      onNewComment(data);
    } catch (e) {
      console.error("Comment error:", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* List of comments */}
      {comments.length === 0 ? (
        <div className="bg-white/80 border border-[#e5e5e5]/60 rounded-xl p-8 text-center text-[#888888] text-[13px]">
          No comments yet on this pull request. Be the first to start the discussion!
        </div>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">
              {(c.author_name || "?").slice(0, 2).toUpperCase()}
            </div>
            <div className="grow bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl overflow-hidden shadow-xs">
              <div className="flex items-center justify-between px-4 py-2 bg-[#f8f8fa] border-b border-[#e5e5e5]/60">
                <span className="text-[12px] font-bold text-black">{c.author_name || "Designer"}</span>
                <span className="text-[11px] text-[#888888]">{timeAgo(c.created_at)}</span>
              </div>
              <div className="p-4 text-[13px] text-black leading-relaxed whitespace-pre-wrap font-sans">
                {c.body}
              </div>
            </div>
          </div>
        ))
      )}

      {/* New comment input box */}
      <form onSubmit={handleSubmit} className="flex items-start gap-3 pt-2">
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 shadow-xs">
          {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
        </div>
        <div className="grow bg-white/80 backdrop-blur-md border border-[#e0e0e0] focus-within:border-black rounded-xl overflow-hidden shadow-xs transition-colors">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a review comment or ask questions about the design tokens..."
            rows={4}
            className="w-full p-4 text-[13px] text-black placeholder-[#999999] outline-none resize-none font-sans leading-relaxed"
          />
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f8f8fa] border-t border-[#e5e5e5]/60">
            <span className="text-[11px] text-[#888888]">Markdown formatting supported</span>
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="bg-black text-white font-bold text-[12px] px-4 py-1.5 rounded-lg hover:bg-black/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              {submitting && (
                <span className="material-symbols-outlined animate-spin text-[14px]">
                  progress_activity
                </span>
              )}
              Submit Comment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Main PR Detail Page Component ───────────────────────────────────────────
export default function PRDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const [pr, setPr] = useState(null);
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [commits, setCommits] = useState([]);
  const [inspectNodes, setInspectNodes] = useState([]);
  const [activeTab, setActiveTab] = useState("conversation"); // "conversation" | "diff" | "files" | "inspect"

  // Visual diff state
  const [beforeSnapshot, setBeforeSnapshot] = useState(null);
  const [afterSnapshot, setAfterSnapshot] = useState(null);

  // Review form state
  const [reviewAction, setReviewAction] = useState("comment");
  const [reviewBody, setReviewBody] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [merging, setMerging] = useState(false);

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

  async function loadAll(id, currentUser) {
    setLoading(true);
    try {
      // 1. Fetch PR by exact ID or short hex prefix (e.g. e94881)
      let prData = null;

      if (id.length === 36) {
        const { data: directData } = await supabase
          .from("dvc_pull_requests")
          .select("*")
          .eq("id", id)
          .single();
        if (directData) prData = directData;
      }

      if (!prData) {
        const { data: prList } = await supabase
          .from("dvc_pull_requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (prList) {
          prData = prList.find(
            (p) =>
              p.id?.toString() === id ||
              p.id?.toString().toLowerCase().startsWith(id.toLowerCase()) ||
              p.id?.toString().slice(0, 6).toLowerCase() === id.toLowerCase()
          );
        }
      }

      if (!prData) {
        setLoading(false);
        return;
      }
      setPr(prData);

      // Clean browser address bar to show 6-character short ID instead of 36-char UUID
      if (id.length > 8 && typeof window !== "undefined") {
        window.history.replaceState(null, "", `/dashboard/pulls/${prData.id.slice(0, 6)}`);
      }

      // Load comments
      const { data: commentsData } = await supabase
        .from("dvc_pr_comments")
        .select("*")
        .eq("pr_id", prData.id)
        .order("created_at", { ascending: true });
      setComments(commentsData || []);

      // Load reviews
      const { data: reviewsData } = await supabase
        .from("dvc_pr_reviews")
        .select("*")
        .eq("pr_id", prData.id)
        .order("created_at", { ascending: true });
      setReviews(reviewsData || []);

      // 4. Load related commits, design inspect nodes, and visual diff snapshots
      if (prData.file_key) {
        // Fetch all commits for this repo (matching frame_name || file_key || branch_id)
        const { data: repoCommits } = await supabase
          .from("dvc_commits")
          .select("id, file_key, frame_name, branch_id, message, author, timestamp, node_count, snapshot_url, nodes")
          .order("timestamp", { ascending: false });

        const filteredRepoCommits = (repoCommits || []).filter(
          (c) =>
            c.frame_name === prData.file_key ||
            c.file_key === prData.file_key ||
            c.branch_id === prData.source_branch_id ||
            c.branch_id === prData.target_branch_id
        );

        // Filter commits belonging to the source branch if source_branch_id exists
        let prCommits = [];
        if (prData.source_branch_id) {
          prCommits = filteredRepoCommits.filter((c) => c.branch_id === prData.source_branch_id);
        }
        if (prCommits.length === 0) {
          prCommits = filteredRepoCommits;
        }

        setCommits(prCommits);

        // Fetch source and target branch records to resolve head commits
        const { data: branchesData } = await supabase
          .from("dvc_branches")
          .select("id, name, head_commit_id, file_key");

        let srcBranch = (branchesData || []).find(
          (b) => b.id === prData.source_branch_id || (b.file_key === prData.file_key && b.name === prData.source_branch)
        );
        let tgtBranch = (branchesData || []).find(
          (b) => b.id === prData.target_branch_id || (b.file_key === prData.file_key && b.name === prData.target_branch)
        );

        let sourceHeadCommit = null;
        let targetHeadCommit = null;

        if (srcBranch?.head_commit_id) {
          sourceHeadCommit = (repoCommits || []).find((c) => c.id === srcBranch.head_commit_id);
        }
        if (!sourceHeadCommit && prCommits.length > 0) {
          sourceHeadCommit = prCommits[0];
        }

        if (tgtBranch?.head_commit_id) {
          targetHeadCommit = (repoCommits || []).find((c) => c.id === tgtBranch.head_commit_id);
        }
        if (!targetHeadCommit && filteredRepoCommits.length > 1) {
          targetHeadCommit = filteredRepoCommits.find((c) => c.id !== sourceHeadCommit?.id) || filteredRepoCommits[1];
        }

        // Set Visual Diff Snapshots
        setAfterSnapshot(sourceHeadCommit?.snapshot_url || null);
        setBeforeSnapshot(targetHeadCommit?.snapshot_url || null);

        // Set Developer Inspect Mode nodes (from source branch head commit)
        if (sourceHeadCommit?.nodes) {
          setInspectNodes(sourceHeadCommit.nodes);
        } else if (filteredRepoCommits[0]?.nodes) {
          setInspectNodes(filteredRepoCommits[0].nodes);
        }
      }

      await fetchNotifications(currentUser.id);
    } catch (e) {
      console.error("PR Load error:", e.message);
    } finally {
      setLoading(false);
    }
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
      await loadAll(rawId, user);
    }
    init();
  }, [rawId, router]);

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!user || !pr) return;
    setReviewSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("dvc_pr_reviews")
        .insert({
          pr_id: pr.id,
          reviewer_id: user.id,
          reviewer_name: user.email,
          action: reviewAction,
          body: reviewBody.trim(),
        })
        .select()
        .single();
      if (error) throw error;

      // Update PR status
      let newStatus = pr.status;
      if (reviewAction === "approve") newStatus = "approved";
      if (reviewAction === "request_changes") newStatus = "changes_requested";

      if (newStatus !== pr.status) {
        await supabase.from("dvc_pull_requests").update({ status: newStatus }).eq("id", pr.id);
        setPr((prev) => ({ ...prev, status: newStatus }));
      }

      setReviews((prev) => [...prev, data]);
      setReviewBody("");
    } catch (e) {
      console.error("Review submit error:", e.message);
    } finally {
      setReviewSubmitting(false);
    }
  }

  async function handleMerge() {
    if (!pr || !user) return;
    setMerging(true);
    try {
      // 1. Resolve source branch head_commit_id
      let sourceHeadId = null;
      if (pr.source_branch_id) {
        const { data: sb } = await supabase
          .from("dvc_branches")
          .select("head_commit_id")
          .eq("id", pr.source_branch_id)
          .single();
        sourceHeadId = sb?.head_commit_id;
      }
      if (!sourceHeadId && pr.file_key && pr.source_branch) {
        const { data: sb } = await supabase
          .from("dvc_branches")
          .select("head_commit_id")
          .eq("file_key", pr.file_key)
          .eq("name", pr.source_branch)
          .single();
        sourceHeadId = sb?.head_commit_id;
      }
      // Fallback: use latest commit for this file_key
      if (!sourceHeadId && pr.file_key) {
        const { data: lc } = await supabase
          .from("dvc_commits")
          .select("id")
          .eq("file_key", pr.file_key)
          .order("timestamp", { ascending: false })
          .limit(1);
        sourceHeadId = lc?.[0]?.id;
      }

      // 2. Advance target branch pointer to source branch head commit
      if (sourceHeadId) {
        if (pr.target_branch_id) {
          await supabase
            .from("dvc_branches")
            .update({ head_commit_id: sourceHeadId })
            .eq("id", pr.target_branch_id);
        } else if (pr.file_key && pr.target_branch) {
          await supabase
            .from("dvc_branches")
            .update({ head_commit_id: sourceHeadId })
            .eq("file_key", pr.file_key)
            .eq("name", pr.target_branch);
        }
      }

      // 3. Mark PR as merged
      await supabase
        .from("dvc_pull_requests")
        .update({
          status: "merged",
          merged_at: new Date().toISOString(),
          merged_by: user.email,
        })
        .eq("id", pr.id);

      setPr((prev) => ({
        ...prev,
        status: "merged",
        merged_at: new Date().toISOString(),
        merged_by: user.email,
      }));
    } catch (e) {
      console.error("Merge error:", e.message);
    } finally {
      setMerging(false);
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
            <p className="text-[13px] text-[#666666] font-medium">Loading Pull Request Details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!pr) {
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
        <main className="grow p-8 max-w-[1600px] w-full mx-auto flex flex-col items-center justify-center gap-4 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#888888]">error_outline</span>
          <h1 className="text-[20px] font-bold text-black">Pull Request Not Found</h1>
          <p className="text-[13px] text-[#666666]">The pull request with ID #{rawId.slice(0, 8)} does not exist or was deleted.</p>
          <Link href="/dashboard/pulls" className="mt-2 bg-black text-white font-bold text-[12px] px-4 py-2 rounded-lg">
            Back to Pull Requests
          </Link>
        </main>
      </div>
    );
  }

  const shortId = pr.id.slice(0, 6);
  const statusCfg = STATUS_CONFIG[pr.status] || STATUS_CONFIG.open;
  const hasApproval = reviews.some((r) => r.action === "approve");
  const canMerge = pr.status === "approved" || (pr.status === "open" && hasApproval);
  const isMerged = pr.status === "merged";

  return (
    <div className="grow flex flex-col min-w-0">
      {/* Top Header */}
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

      {/* Main Content Area */}
      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Breadcrumbs & Title Banner */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[12px] text-[#666666] font-medium">
            <Link href="/dashboard" className="hover:text-black transition-colors">
              Dashboard
            </Link>
            <span>/</span>
            <Link href="/dashboard/pulls" className="hover:text-black transition-colors">
              Pull Requests
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-black">#{shortId}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[24px] md:text-[28px] font-sans tracking-tight text-black font-bold leading-tight">
                  {pr.title}
                </h1>
                <span className="text-[#888888] font-mono text-[20px] font-normal">
                  #{shortId}
                </span>
                <span
                  className={`text-[12px] font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 shrink-0 ${statusCfg.bg}`}
                >
                  <span className={`w-2 h-2 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[12px] text-[#666666] flex-wrap">
                <span className="font-bold text-black">{pr.author}</span>
                <span>wants to merge</span>
                <span className="bg-white border border-[#c5c5c5] font-mono text-[11px] font-bold text-black px-2 py-0.5 rounded">
                  {pr.source_branch || "feature"}
                </span>
                <span>into</span>
                <span className="bg-white border border-[#c5c5c5] font-mono text-[11px] font-bold text-black px-2 py-0.5 rounded">
                  {pr.target_branch || "main"}
                </span>
                <span>&middot;</span>
                <span>opened {timeAgo(pr.created_at)}</span>
              </div>
            </div>

            <Link
              href="/dashboard/pulls/new"
              className="bg-black text-white hover:bg-black/90 font-bold text-[12px] px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs shrink-0 self-start md:self-auto cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New PR
            </Link>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="border-b border-[#e5e5e5]/60 flex items-center gap-2">
          {[
            { id: "conversation", label: "Conversation", count: comments.length, icon: "forum" },
            { id: "diff", label: "Visual Diff Comparison", icon: "compare" },
            { id: "inspect", label: "Developer Inspect Mode", icon: "code" },
            { id: "files", label: "Commits & Node History", count: commits.length, icon: "history" },
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-[13px] font-bold transition-all border-b-2 cursor-pointer ${
                  isSelected
                    ? "border-black text-black"
                    : "border-transparent text-[#666666] hover:text-black hover:border-[#c5c5c5]"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? "bg-black text-white" : "bg-[#f0f0f2] text-[#666666]"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 2-Column Responsive Dashboard Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
          {/* Left Column (2/3 width): Main Tab Content */}
          <div className="xl:col-span-2 flex flex-col gap-6">
            {/* Conversation Tab */}
            {activeTab === "conversation" && (
              <div className="flex flex-col gap-6">
                {/* Original PR Description Card */}
                <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between px-5 py-3 bg-white/50 border-b border-[#e5e5e5]/40">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[13px] text-black">{pr.author}</span>
                      <span className="text-[11px] text-[#888888]">commented {timeAgo(pr.created_at)}</span>
                    </div>
                    <span className="text-[11px] font-bold text-black bg-white/80 px-2.5 py-0.5 rounded border border-[#e0e0e0]/60">
                      Author
                    </span>
                  </div>
                  <div className="p-5 text-[13px] text-black leading-relaxed font-sans whitespace-pre-wrap">
                    {pr.description || "No description provided."}
                  </div>
                </div>

                {/* Comment Thread Component */}
                <CommentThread
                  comments={comments}
                  prId={pr.id}
                  user={user}
                  onNewComment={(newC) => setComments((prev) => [...prev, newC])}
                />
              </div>
            )}

            {/* Visual Diff Comparison Tab */}
            {activeTab === "diff" && (
              <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/60 rounded-xl p-6 shadow-xs flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-black">compare</span>
                    <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
                      Figma Visual Diff Comparison
                    </h2>
                  </div>
                  <div className="text-[11px] font-mono text-black bg-[#f0f0f2] px-2.5 py-1 rounded border border-[#e0e0e0]">
                    gitdesign/{pr.file_key}
                  </div>
                </div>

                {/* Split Interactive Diff Slider */}
                <VisualDiffSlider beforeUrl={beforeSnapshot} afterUrl={afterSnapshot} />

                <div className="flex items-center justify-between text-[11px] text-[#666666] pt-2 border-t border-[#f0f0f2]">
                  <span>Drag the center divider handle to compare Figma design snapshots.</span>
                  <span className="font-bold text-black">
                    Target File: gitdesign/{pr.file_key}
                  </span>
                </div>
              </div>
            )}

            {/* Commits & Files Changed Tab */}
            {activeTab === "files" && (
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-[#f0f0f2] pb-3">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-black">history</span>
                    <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
                      Recent Commits in Branch ({commits.length})
                    </h2>
                  </div>
                </div>

                <div className="flex flex-col divide-y divide-[#f0f0f2]">
                  {commits.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/dashboard/commit/${c.id}`)}
                      className="py-3.5 flex items-center justify-between hover:bg-white px-3 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 min-w-0 grow">
                        <span className="material-symbols-outlined text-[20px] text-black mt-0.5">
                          commit
                        </span>
                        <div className="flex flex-col gap-1 min-w-0">
                          <p className="text-[13px] font-bold text-black group-hover:underline truncate">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#666666]">
                            <span className="font-mono bg-[#f0f0f2] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-[10px] text-black font-semibold">
                              {c.id.slice(0, 7)}
                            </span>
                            <span>by {c.author}</span>
                            <span>&middot;</span>
                            <span>{timeAgo(c.timestamp)}</span>
                          </div>
                        </div>
                      </div>

                      <span className="material-symbols-outlined text-[18px] text-[#999999] group-hover:text-black">
                        chevron_right
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Developer Inspect Mode Tab */}
            {activeTab === "inspect" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-[#e5e5e5]/50 shadow-xs">
                  <div>
                    <h3 className="text-[14px] font-bold text-black flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">code</span>
                      Developer Spec Handoff Mode
                    </h3>
                    <p className="text-[11px] text-[#666] mt-0.5">
                      Inspect generated CSS, dimensions, color HEX codes, and typography directly from this PR.
                    </p>
                  </div>
                </div>
                <DesignInspectPanel nodes={inspectNodes} />
              </div>
            )}
          </div>

          {/* Right Column (1/3 width): Merge Box & Review Controls */}
          <div className="flex flex-col gap-6">
            {/* Merge Control Card */}
            <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-4">
              <h2 className="text-[16px] font-bold text-black font-sans tracking-tight border-b border-[#f0f0f2] pb-3">
                Merge Status
              </h2>

              {!isMerged ? (
                <div className="flex flex-col gap-3">
                  <div className={`p-3.5 rounded-lg border flex items-center gap-2.5 ${
                    canMerge ? "bg-emerald-50 border-emerald-200" : "bg-[#f8f8fa] border-[#e0e0e4]"
                  }`}>
                    <span className={`material-symbols-outlined text-[20px] ${canMerge ? "text-emerald-600" : "text-[#888888]"}`}>
                      {canMerge ? "check_circle" : "pending"}
                    </span>
                    <div className="flex flex-col">
                      <span className={`text-[12px] font-bold ${canMerge ? "text-emerald-800" : "text-black"}`}>
                        {canMerge ? "Ready to Merge" : "Awaiting Review Approval"}
                      </span>
                      <span className="text-[10px] text-[#666666]">
                        {canMerge
                          ? "These design branch changes can be safely merged."
                          : "At least one reviewer must approve before merging."}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleMerge}
                    disabled={!canMerge || merging}
                    className="w-full bg-purple-700 hover:bg-purple-800 text-white font-bold text-[13px] py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2 shadow-xs"
                  >
                    {merging ? (
                      <span className="material-symbols-outlined animate-spin text-[16px]">
                        progress_activity
                      </span>
                    ) : (
                      <span className="material-symbols-outlined text-[16px]">call_merge</span>
                    )}
                    {merging ? "Merging Changes..." : "Merge Pull Request"}
                  </button>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
                  <span className="material-symbols-outlined text-[24px] text-purple-700">call_merge</span>
                  <div className="flex flex-col">
                    <span className="text-[13px] font-bold text-purple-900">Pull Request Merged</span>
                    <span className="text-[11px] text-purple-700 mt-0.5">
                      Merged by {pr.merged_by || pr.author} into {pr.target_branch || "main"}.
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Review Form Card */}
            {!isMerged && (
              <form onSubmit={handleReviewSubmit} className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-4">
                <h2 className="text-[16px] font-bold text-black font-sans tracking-tight border-b border-[#f0f0f2] pb-3">
                  Submit a Review
                </h2>

                <textarea
                  value={reviewBody}
                  onChange={(e) => setReviewBody(e.target.value)}
                  placeholder="Leave review comments..."
                  rows={4}
                  className="w-full p-3 border border-[#c5c5c5] focus:border-black rounded-lg text-[12px] text-black placeholder-[#999999] outline-none resize-none font-sans"
                />

                <div className="flex flex-col gap-2 select-none">
                  {[
                    { value: "comment", icon: "chat_bubble", label: "Comment", desc: "General feedback" },
                    { value: "approve", icon: "check_circle", label: "Approve", desc: "Ready to merge" },
                    { value: "request_changes", icon: "change_circle", label: "Request Changes", desc: "Must be addressed" },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-[#f5f5f7] cursor-pointer transition-colors">
                      <input
                        type="radio"
                        name="review-action-group"
                        value={opt.value}
                        checked={reviewAction === opt.value}
                        onChange={() => setReviewAction(opt.value)}
                        className="mt-0.5 accent-black cursor-pointer"
                      />
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold text-black flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">{opt.icon}</span>
                          {opt.label}
                        </span>
                        <span className="text-[10px] text-[#777777]">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={reviewSubmitting}
                  className="w-full bg-black hover:bg-black/90 text-white font-bold text-[12px] py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                >
                  {reviewSubmitting && (
                    <span className="material-symbols-outlined animate-spin text-[14px]">
                      progress_activity
                    </span>
                  )}
                  Submit Review
                </button>
              </form>
            )}

            {/* Target Design File Metadata */}
            <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-3">
              <span className="text-[11px] font-bold text-[#666666] uppercase tracking-wider">
                Target Design File
              </span>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-black">folder_open</span>
                <span className="text-[13px] font-bold text-black font-mono">
                  gitdesign/{pr.file_key}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
