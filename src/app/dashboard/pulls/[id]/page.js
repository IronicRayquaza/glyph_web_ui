"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const STATUS_COLORS = {
  open: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", label: "Open" },
  merged: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", dot: "bg-purple-500", label: "Merged" },
  closed: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", dot: "bg-red-400", label: "Closed" },
  changes_requested: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", label: "Changes Requested" },
  approved: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500", label: "Approved" },
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
      className="relative w-full overflow-hidden rounded-lg border border-[#e0e0e0] select-none cursor-col-resize"
      style={{ aspectRatio: "16/9", background: "#f0f0f0" }}
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
          <div className="w-full h-full flex items-center justify-center text-[#bbb] flex-col gap-2">
            <span className="material-symbols-outlined text-[32px] opacity-40">image</span>
            <span className="text-[12px]">No snapshot available for base branch</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end p-3">
          <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">BEFORE · main</span>
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
          <div className="w-full h-full flex items-center justify-center text-[#bbb] flex-col gap-2">
            <span className="material-symbols-outlined text-[32px] opacity-40">image</span>
            <span className="text-[12px]">No snapshot available for this branch</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-end p-3">
          <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">AFTER · feature</span>
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
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/60 text-white text-[10px] font-mono px-2 py-0.5 rounded backdrop-blur-sm pointer-events-none">
        {Math.round(sliderX)}%
      </div>
    </div>
  );
}

// ─── Comment Thread ──────────────────────────────────────────────────────────
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
      {/* Existing comments */}
      {comments.map((c) => (
        <div key={c.id} className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
            {(c.author_name || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-grow">
            <div className="bg-white border border-[#e8e8e8] rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-4 py-2 bg-[#fafafa] border-b border-[#f0f0f0]">
                <span className="text-[12px] font-semibold text-black">{c.author_name || "Unknown"}</span>
                <span className="text-[11px] text-[#888]">{timeAgo(c.created_at)}</span>
              </div>
              <div className="px-4 py-3 text-[13px] text-black leading-relaxed whitespace-pre-wrap">
                {c.body}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* New comment form */}
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 mt-0.5">
          {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
        </div>
        <div className="flex-grow bg-white border border-[#e0e0e0] rounded-lg overflow-hidden shadow-sm focus-within:border-black transition-colors">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Leave a comment…"
            rows={3}
            className="w-full px-4 py-3 text-[13px] text-black placeholder-[#bbb] outline-none resize-none font-sans"
          />
          <div className="flex items-center justify-between px-4 py-2 bg-[#fafafa] border-t border-[#f0f0f0]">
            <span className="text-[10px] text-[#aaa]">Markdown supported</span>
            <button
              type="submit"
              disabled={!body.trim() || submitting}
              className="bg-black text-white text-[11px] font-semibold px-3 py-1.5 rounded hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1"
            >
              {submitting ? <span className="material-symbols-outlined animate-spin text-[13px]">progress_activity</span> : null}
              Comment
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Review Panel ────────────────────────────────────────────────────────────
function ReviewPanel({ prId, user, pr, reviews, onReviewSubmitted, onMerge }) {
  const [action, setAction] = useState("comment");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [merging, setMerging] = useState(false);

  const hasApproval = reviews.some(r => r.action === "approve");
  const latestReview = reviews[reviews.length - 1];
  const canMerge = pr.status === "approved" || (pr.status === "open" && hasApproval);
  const isAuthor = user?.id === pr.author_id;
  const isMerged = pr.status === "merged";
  const isClosed = pr.status === "closed";

  async function handleReviewSubmit(e) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("dvc_pr_reviews")
        .insert({
          pr_id: prId,
          reviewer_id: user.id,
          reviewer_name: user.email,
          action,
          body: body.trim(),
        })
        .select()
        .single();
      if (error) throw error;

      // Update PR status based on review action
      let newStatus = pr.status;
      if (action === "approve") newStatus = "approved";
      if (action === "request_changes") newStatus = "changes_requested";

      if (newStatus !== pr.status) {
        await supabase.from("dvc_pull_requests").update({ status: newStatus }).eq("id", prId);
      }

      // Notify PR author
      if (user.id !== pr.author_id) {
        await supabase.from("dvc_notifications").insert({
          user_id: pr.author_id,
          type: action,
          title: action === "approve" ? "Pull request approved" : action === "request_changes" ? "Changes requested" : "New review comment",
          body: `${user.email} ${action === "approve" ? "approved" : action === "request_changes" ? "requested changes on" : "commented on"} "${pr.title}"`,
          pr_id: prId,
          read: false,
        });
      }

      setBody("");
      onReviewSubmitted(data, newStatus);
    } catch (e) {
      console.error("Review error:", e.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMerge() {
    setMerging(true);
    try {
      await supabase.from("dvc_pull_requests").update({
        status: "merged",
        merged_at: new Date().toISOString(),
        merged_by: user.email,
      }).eq("id", prId);

      // Notify all reviewers
      if (reviews.length > 0) {
        await supabase.from("dvc_notifications").insert(
          reviews.map(r => ({
            user_id: r.reviewer_id,
            type: "merged",
            title: "Pull request merged",
            body: `"${pr.title}" was merged into ${pr.target_branch || "main"}.`,
            pr_id: prId,
            read: false,
          }))
        );
      }
      onMerge();
    } catch (e) {
      console.error("Merge error:", e.message);
    } finally {
      setMerging(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Merge Box */}
      {!isMerged && !isClosed && (
        <div className={`border rounded-lg p-4 flex flex-col gap-3 ${
          canMerge
            ? "bg-emerald-50 border-emerald-200"
            : "bg-[#f9f9f9] border-[#e8e8e8]"
        }`}>
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[18px] ${canMerge ? "text-emerald-600" : "text-[#aaa]"}`}>
              {canMerge ? "check_circle" : "pending"}
            </span>
            <span className={`text-[13px] font-semibold ${canMerge ? "text-emerald-700" : "text-[#666]"}`}>
              {canMerge ? "This pull request is ready to merge" : "Awaiting review approval"}
            </span>
          </div>
          {!canMerge && (
            <p className="text-[11px] text-[#888]">At least one reviewer must approve before merging.</p>
          )}
          <button
            onClick={handleMerge}
            disabled={!canMerge || merging}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white font-semibold text-[12px] px-4 py-2.5 rounded hover:bg-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer w-full"
          >
            {merging ? (
              <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">merge</span>
            )}
            {merging ? "Merging…" : "Merge Pull Request"}
          </button>
        </div>
      )}

      {isMerged && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center gap-3">
          <span className="material-symbols-outlined text-[20px] text-purple-600">check_circle</span>
          <div>
            <p className="text-[13px] font-semibold text-purple-700">Pull request merged</p>
            <p className="text-[11px] text-purple-500 mt-0.5">Changes have been merged into {pr.target_branch || "main"}.</p>
          </div>
        </div>
      )}

      {/* Review Summary */}
      {reviews.length > 0 && (
        <div className="bg-white border border-[#e8e8e8] rounded-lg p-4 flex flex-col gap-3">
          <h3 className="text-[12px] font-bold text-black uppercase tracking-wider">Reviews ({reviews.length})</h3>
          <div className="flex flex-col gap-2">
            {reviews.map((r) => {
              const actionIcon = r.action === "approve" ? "check_circle" : r.action === "request_changes" ? "change_circle" : "chat";
              const actionColor = r.action === "approve" ? "text-emerald-600" : r.action === "request_changes" ? "text-amber-600" : "text-[#888]";
              const actionLabel = r.action === "approve" ? "Approved" : r.action === "request_changes" ? "Requested changes" : "Commented";
              return (
                <div key={r.id} className="flex items-start gap-2">
                  <span className={`material-symbols-outlined text-[16px] mt-0.5 ${actionColor}`}>{actionIcon}</span>
                  <div>
                    <span className="text-[12px] font-semibold text-black">{r.reviewer_name}</span>
                    <span className="text-[11px] text-[#888] ml-1.5">{actionLabel} · {timeAgo(r.created_at)}</span>
                    {r.body && <p className="text-[11px] text-[#555] mt-1 leading-relaxed">{r.body}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Submit Review form */}
      {!isMerged && !isClosed && (
        <form onSubmit={handleReviewSubmit} className="bg-white border border-[#e0e0e0] rounded-lg overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
            <h3 className="text-[12px] font-bold text-black">Submit a Review</h3>
          </div>
          <div className="p-4 flex flex-col gap-3">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Leave your review feedback…"
              rows={4}
              className="w-full px-3 py-2.5 border border-[#e0e0e0] rounded text-[12px] text-black placeholder-[#bbb] outline-none resize-none focus:border-black transition-colors font-sans"
            />

            <div className="flex flex-col gap-2">
              {[
                { value: "comment", icon: "chat_bubble", label: "Comment", desc: "General feedback" },
                { value: "approve", icon: "check_circle", label: "Approve", desc: "Ready to merge" },
                { value: "request_changes", icon: "change_circle", label: "Request Changes", desc: "Must be addressed" },
              ].map((opt) => (
                <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer group">
                  <input
                    type="radio"
                    name="review-action"
                    value={opt.value}
                    checked={action === opt.value}
                    onChange={() => setAction(opt.value)}
                    className="mt-0.5 cursor-pointer accent-black"
                  />
                  <div>
                    <span className="text-[12px] font-semibold text-black flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px]">{opt.icon}</span>
                      {opt.label}
                    </span>
                    <span className="text-[10px] text-[#888]">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-black text-white text-[12px] font-semibold py-2.5 rounded hover:bg-black/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              {submitting ? <span className="material-symbols-outlined animate-spin text-[14px]">progress_activity</span> : null}
              Submit Review
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ─── Main PR Detail Page ─────────────────────────────────────────────────────
export default function PRDetailPage() {
  const router = useRouter();
  const params = useParams();
  const prId = params.id;

  const [user, setUser] = useState(null);
  const [pr, setPr] = useState(null);
  const [comments, setComments] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("conversation");

  // Visual diff state
  const [beforeSnapshot, setBeforeSnapshot] = useState(null);
  const [afterSnapshot, setAfterSnapshot] = useState(null);
  const [diffMode, setDiffMode] = useState("slider"); // "slider" | "side-by-side"

  // Text diff state
  const [textDiff, setTextDiff] = useState(null);
  const [loadingTextDiff, setLoadingTextDiff] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await loadAll(user);
    }
    init();
  }, [prId, router]);

  async function loadAll(currentUser) {
    setLoading(true);
    try {
      // Load PR
      const { data: prData, error: prErr } = await supabase
        .from("dvc_pull_requests")
        .select("*")
        .eq("id", prId)
        .single();
      if (prErr) throw prErr;
      setPr(prData);

      // Load comments
      const { data: commentsData } = await supabase
        .from("dvc_pr_comments")
        .select("*")
        .eq("pr_id", prId)
        .order("created_at", { ascending: true });
      setComments(commentsData || []);

      // Load reviews
      const { data: reviewsData } = await supabase
        .from("dvc_pr_reviews")
        .select("*")
        .eq("pr_id", prId)
        .order("created_at", { ascending: true });
      setReviews(reviewsData || []);

      // Load related commits for text diff
      if (prData?.file_key) {
        const { data: commitData } = await supabase
          .from("dvc_commits")
          .select("id, parent_id, message, timestamp, author, nodes, snapshot_url")
          .eq("file_key", prData.file_key)
          .order("timestamp", { ascending: false })
          .limit(5);
        setCommits(commitData || []);

        // Set visual snapshots from latest commits
        const withSnapshot = (commitData || []).filter(c => c.snapshot_url);
        if (withSnapshot.length >= 2) {
          setAfterSnapshot(withSnapshot[0].snapshot_url);
          setBeforeSnapshot(withSnapshot[1].snapshot_url);
        } else if (withSnapshot.length === 1) {
          setAfterSnapshot(withSnapshot[0].snapshot_url);
        }
      }
    } catch (e) {
      console.error("Load error:", e.message);
    } finally {
      setLoading(false);
    }
  }

  function flattenNodes(list, map = {}) {
    for (const n of list) {
      map[n.id] = n;
      if (n.children) flattenNodes(n.children, map);
    }
    return map;
  }

  function getChangedProps(prev, curr) {
    const props = ["name", "visible", "opacity", "x", "y", "width", "height", "fills", "strokes", "strokeWeight", "cornerRadius", "effects", "characters", "fontSize", "fontName"];
    return props.filter(p => JSON.stringify(prev[p]) !== JSON.stringify(curr[p]));
  }

  async function loadTextDiff() {
    if (!commits.length) return;
    setLoadingTextDiff(true);
    try {
      const curr = commits[0];
      const prev = commits[1];
      if (!curr) return;

      const { data: currRows } = await supabase.from("dvc_commits").select("nodes").eq("id", curr.id);
      const currentMap = flattenNodes((currRows?.[0]?.nodes) || []);
      let parentMap = {};
      if (prev) {
        const { data: prevRows } = await supabase.from("dvc_commits").select("nodes").eq("id", prev.id);
        parentMap = flattenNodes((prevRows?.[0]?.nodes) || []);
      }

      const added = [], removed = [], modified = [];
      Object.keys(currentMap).forEach(id => {
        const c = currentMap[id], p = parentMap[id];
        if (!p) added.push(c);
        else if (p.hash !== c.hash) modified.push({ ...c, changedProps: getChangedProps(p, c) });
      });
      Object.keys(parentMap).forEach(id => {
        if (!currentMap[id]) removed.push(parentMap[id]);
      });

      setTextDiff({ added, removed, modified });
    } catch (e) {
      console.error("Text diff error:", e);
    } finally {
      setLoadingTextDiff(false);
    }
  }

  useEffect(() => {
    if (activeTab === "files" && !textDiff && commits.length > 0) {
      loadTextDiff();
    }
  }, [activeTab, commits]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-[28px] text-black">progress_activity</span>
          <span className="text-[13px] text-[#666]">Loading pull request…</span>
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-[16px] font-semibold text-black mb-2">Pull request not found</p>
          <Link href="/dashboard/pulls" className="text-[13px] text-[#666] hover:underline">← Back to pull requests</Link>
        </div>
      </div>
    );
  }

  const st = STATUS_COLORS[pr.status] || STATUS_COLORS.open;

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
        <nav className="flex-grow py-4">
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
        </nav>
      </aside>

      {/* Main */}
      <div className="flex-grow flex flex-col min-w-0 z-10 ml-[240px]">
        {/* Header */}
        <header className="bg-white/70 backdrop-blur-lg border-b border-[#e5e5e5]/40 h-16 flex items-center justify-between px-8 sticky top-0 z-20">
          <div className="flex items-center gap-2 text-[14px] min-w-0">
            <Link href="/dashboard" className="font-bold text-black hover:opacity-70 transition-opacity flex-shrink-0">GitDesign</Link>
            <span className="text-[#c5c5c5] flex-shrink-0">/</span>
            <Link href="/dashboard/pulls" className="text-[#555] hover:text-black transition-colors flex-shrink-0">Pull Requests</Link>
            <span className="text-[#c5c5c5] flex-shrink-0">/</span>
            <span className="font-semibold text-black truncate">#{prId?.toString().slice(0, 6)} {pr.title}</span>
          </div>
          <button
            onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
            className="w-8 h-8 rounded-full border border-[#c5c5c5]/40 flex items-center justify-center text-[12px] font-bold bg-white/70 hover:bg-black hover:text-white transition-colors cursor-pointer flex-shrink-0"
            title="Sign out"
          >
            {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
          </button>
        </header>

        <main className="flex-grow p-8 w-full max-w-7xl mx-auto">
          {/* PR Title & Meta */}
          <div className="mb-6">
            <div className="flex items-start gap-3 flex-wrap mb-3">
              <h1 className="text-[24px] font-bold tracking-tight text-black leading-tight flex-grow">{pr.title}</h1>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${st.bg} ${st.text} ${st.border}`}>
                <span className={`w-2 h-2 rounded-full ${st.dot}`} />
                {st.label}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[12px] text-[#777] flex-wrap">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold">
                  {(pr.author || "U").slice(0, 1).toUpperCase()}
                </div>
                <span className="font-medium text-black">{pr.author}</span>
              </div>
              <span>wants to merge</span>
              <code className="bg-[#f0f0f0] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-[11px] font-mono text-black">{pr.source_branch || "feature"}</code>
              <span>into</span>
              <code className="bg-[#f0f0f0] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-[11px] font-mono text-black">{pr.target_branch || "main"}</code>
              <span>·</span>
              <span>opened {timeAgo(pr.created_at)}</span>
              {pr.merged_at && <><span>·</span><span>merged {timeAgo(pr.merged_at)}</span></>}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-0 border-b border-[#e5e5e5] mb-6">
            {[
              { id: "conversation", icon: "chat_bubble", label: "Conversation", count: comments.length },
              { id: "files", icon: "diff", label: "Files Changed", count: null },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[13px] font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "border-black text-black"
                    : "border-transparent text-[#666] hover:text-black hover:border-[#ccc]"
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                {tab.label}
                {tab.count !== null && tab.count > 0 && (
                  <span className="bg-[#f0f0f0] text-[#555] text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tab.count}</span>
                )}
              </button>
            ))}
          </div>

          {/* Content Area: 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* ── LEFT / MAIN COLUMN ── */}
            <div className="lg:col-span-2 flex flex-col gap-6">

              {/* Description card */}
              {pr.description && (
                <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg overflow-hidden shadow-sm">
                  <div className="flex items-center gap-3 px-5 py-3 bg-[#fafafa] border-b border-[#f0f0f0]">
                    <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                      {(pr.author || "U").slice(0, 1).toUpperCase()}
                    </div>
                    <span className="text-[12px] font-semibold text-black">{pr.author}</span>
                    <span className="text-[11px] text-[#888]">opened this pull request · {timeAgo(pr.created_at)}</span>
                  </div>
                  <div className="px-5 py-4 text-[13px] text-black leading-relaxed whitespace-pre-wrap">
                    {pr.description}
                  </div>
                </div>
              )}

              {/* ── CONVERSATION TAB ── */}
              {activeTab === "conversation" && (
                <div className="flex flex-col gap-4">
                  <CommentThread
                    comments={comments}
                    prId={prId}
                    user={user}
                    onNewComment={(c) => setComments(prev => [...prev, c])}
                  />
                </div>
              )}

              {/* ── FILES CHANGED TAB ── */}
              {activeTab === "files" && (
                <div className="flex flex-col gap-5">
                  {/* Visual Diff Section */}
                  <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-[#555]">compare</span>
                        <h3 className="text-[13px] font-bold text-black">Visual Design Diff</h3>
                        <span className="text-[10px] bg-[#f0f0f0] border border-[#e0e0e0] px-2 py-0.5 rounded text-[#666] font-medium">
                          {beforeSnapshot && afterSnapshot ? "Snapshots available" : beforeSnapshot || afterSnapshot ? "Partial snapshot" : "No snapshots"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setDiffMode("slider")}
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                            diffMode === "slider" ? "bg-black text-white" : "text-[#666] hover:bg-[#f0f0f0]"
                          }`}
                        >
                          Slider
                        </button>
                        <button
                          onClick={() => setDiffMode("side-by-side")}
                          className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-colors cursor-pointer ${
                            diffMode === "side-by-side" ? "bg-black text-white" : "text-[#666] hover:bg-[#f0f0f0]"
                          }`}
                        >
                          Side by Side
                        </button>
                      </div>
                    </div>

                    <div className="p-5">
                      {diffMode === "slider" ? (
                        <VisualDiffSlider beforeUrl={beforeSnapshot} afterUrl={afterSnapshot} />
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-red-400" />
                              <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">Before · main</span>
                            </div>
                            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-[#f8f8f8]" style={{ aspectRatio: "4/3" }}>
                              {beforeSnapshot ? (
                                <img src={beforeSnapshot} alt="Before" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#ccc] gap-2">
                                  <span className="material-symbols-outlined text-[28px]">image_not_supported</span>
                                  <span className="text-[10px]">No snapshot</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-emerald-400" />
                              <span className="text-[10px] font-bold text-[#555] uppercase tracking-wider">After · feature</span>
                            </div>
                            <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-[#f8f8f8]" style={{ aspectRatio: "4/3" }}>
                              {afterSnapshot ? (
                                <img src={afterSnapshot} alt="After" className="w-full h-full object-contain" />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center text-[#ccc] gap-2">
                                  <span className="material-symbols-outlined text-[28px]">image_not_supported</span>
                                  <span className="text-[10px]">No snapshot</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {!beforeSnapshot && !afterSnapshot && (
                        <div className="mt-3 flex items-center gap-2 text-[11px] text-[#888] bg-[#f9f9f9] border border-[#e8e8e8] rounded p-3">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          Visual snapshots are captured automatically when the Figma plugin commits with snapshot data. Falling back to layer diff below.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Layer Diff Section */}
                  <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg overflow-hidden shadow-sm">
                    <div className="px-5 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                      <h3 className="text-[13px] font-bold text-black">Layer-Level Changes</h3>
                    </div>
                    <div className="p-5">
                      {loadingTextDiff ? (
                        <div className="flex items-center gap-2 text-[12px] text-[#666] py-4">
                          <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                          Analyzing layer diff…
                        </div>
                      ) : textDiff ? (
                        <div className="flex flex-col gap-4 font-mono text-[12px]">
                          {textDiff.added.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-1.5">
                                + {textDiff.added.length} Added
                              </div>
                              <div className="flex flex-col gap-0.5 pl-3 border-l-2 border-emerald-300">
                                {textDiff.added.map(n => (
                                  <div key={n.id} className="flex items-center gap-2 text-emerald-700 py-0.5">
                                    <span className="text-emerald-400">+</span>
                                    <span className="font-medium">{n.name}</span>
                                    <span className="text-[10px] text-emerald-400 font-sans">({n.type})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {textDiff.removed.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-1.5">
                                − {textDiff.removed.length} Removed
                              </div>
                              <div className="flex flex-col gap-0.5 pl-3 border-l-2 border-red-300">
                                {textDiff.removed.map(n => (
                                  <div key={n.id} className="flex items-center gap-2 text-red-600 py-0.5">
                                    <span className="text-red-400">−</span>
                                    <span className="font-medium line-through">{n.name}</span>
                                    <span className="text-[10px] text-red-400 font-sans">({n.type})</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {textDiff.modified.length > 0 && (
                            <div>
                              <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">
                                ~ {textDiff.modified.length} Modified
                              </div>
                              <div className="flex flex-col gap-1 pl-3 border-l-2 border-amber-300">
                                {textDiff.modified.map(n => (
                                  <div key={n.id} className="py-0.5">
                                    <div className="flex items-center gap-2 text-amber-700">
                                      <span className="text-amber-400">~</span>
                                      <span className="font-medium">{n.name}</span>
                                      <span className="text-[10px] text-amber-400 font-sans">({n.type})</span>
                                    </div>
                                    {n.changedProps?.length > 0 && (
                                      <div className="text-[10px] text-[#888] pl-4 mt-0.5 font-sans">
                                        Changed: {n.changedProps.join(", ")}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {textDiff.added.length === 0 && textDiff.removed.length === 0 && textDiff.modified.length === 0 && (
                            <div className="text-[12px] text-[#888] italic font-sans py-2">No layer changes detected between the two most recent commits.</div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[12px] text-[#888] py-4 italic">No commit data available for this file.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ── RIGHT / REVIEW SIDEBAR ── */}
            <div className="flex flex-col gap-4">
              <ReviewPanel
                prId={prId}
                user={user}
                pr={pr}
                reviews={reviews}
                onReviewSubmitted={(review, newStatus) => {
                  setReviews(prev => [...prev, review]);
                  setPr(prev => ({ ...prev, status: newStatus }));
                }}
                onMerge={() => {
                  setPr(prev => ({ ...prev, status: "merged", merged_at: new Date().toISOString() }));
                }}
              />

              {/* Reviewers list */}
              {pr.reviewers?.length > 0 && (
                <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg p-4 shadow-sm">
                  <h3 className="text-[11px] font-bold text-[#555] uppercase tracking-wider mb-3">Requested Reviewers</h3>
                  <div className="flex flex-col gap-2">
                    {pr.reviewers.map((r) => {
                      const hasReviewed = reviews.some(rev => rev.reviewer_name === r);
                      return (
                        <div key={r} className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                            {r.slice(0, 1).toUpperCase()}
                          </div>
                          <span className="text-[12px] text-black truncate flex-grow">{r}</span>
                          {hasReviewed ? (
                            <span className="material-symbols-outlined text-[14px] text-emerald-500">check_circle</span>
                          ) : (
                            <span className="text-[10px] text-[#aaa]">Pending</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* File Info */}
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg p-4 shadow-sm">
                <h3 className="text-[11px] font-bold text-[#555] uppercase tracking-wider mb-3">Design File</h3>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#555]">folder_open</span>
                  <span className="text-[12px] font-mono text-black truncate">{pr.file_key}</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
