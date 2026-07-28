"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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

export default function PullRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [pulls, setPulls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchPulls() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("dvc_pull_requests")
        .select("*, dvc_pr_reviews(id, action), dvc_pr_comments(id)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setPulls(data || []);
    } catch (e) {
      console.error("Error fetching PRs:", e.message);
      setPulls([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await fetchPulls();
    }
    init();
  }, [router]);

  const filtered = pulls.filter((pr) => {
    const matchesFilter = activeFilter === "all" || pr.status === activeFilter ||
      (activeFilter === "open" && ["open", "approved", "changes_requested"].includes(pr.status));
    const matchesSearch = !searchQuery ||
      pr.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pr.file_key?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    open: pulls.filter(p => ["open", "approved", "changes_requested"].includes(p.status)).length,
    merged: pulls.filter(p => p.status === "merged").length,
    closed: pulls.filter(p => p.status === "closed").length,
  };

  return (
    <div className="grow flex flex-col min-w-0">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-lg border-b border-[#e5e5e5]/40 h-16 flex justify-between items-center px-8 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-[18px] font-bold tracking-tight text-black select-none hover:opacity-70 transition-opacity">
            GitDesign
          </Link>
          <span className="text-[#c5c5c5]">/</span>
          <span className="text-[14px] font-semibold text-black">Pull Requests</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pulls/new"
            className="bg-black text-white hover:bg-black/80 font-semibold text-[12px] px-4 py-1.75 rounded flex items-center gap-2 transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">add</span>
            New Pull Request
          </Link>
          <button
            onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
            className="w-8 h-8 rounded-full border border-[#c5c5c5]/40 flex items-center justify-center text-[12px] font-bold bg-white/70 hover:bg-black hover:text-white transition-colors cursor-pointer"
            title="Sign out"
          >
            {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
          </button>
        </div>
      </header>

      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Page Title */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-black">Pull Requests</h1>
            <p className="text-[13px] text-[#666666] mt-0.5">Review, discuss, and merge design changes.</p>
          </div>
        </div>

        {/* Filters + Search Bar */}
        <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded-lg overflow-hidden shadow-sm mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]/40 gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1">
              {[
                { key: "open", label: "Open", icon: "merge_type", count: counts.open },
                { key: "merged", label: "Merged", icon: "check_circle", count: counts.merged },
                { key: "closed", label: "Closed", icon: "cancel", count: counts.closed },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                    activeFilter === f.key
                      ? "bg-black text-white"
                      : "text-[#555555] hover:bg-[#f0f0f0] hover:text-black"
                  }`}
                >
                  <span className="material-symbols-outlined text-[14px]">{f.icon}</span>
                  {f.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    activeFilter === f.key ? "bg-white/20 text-white" : "bg-[#f0f0f0] text-[#555555]"
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <span className="material-symbols-outlined text-[16px] text-[#999] absolute left-3 pointer-events-none">search</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pull requests…"
                className="pl-9 pr-4 py-1.75 border border-[#e0e0e0] rounded bg-[#fafafa] text-[12px] text-black placeholder-[#aaa] outline-none focus:border-black transition-colors w-55"
              />
            </div>
          </div>

          {/* PR List */}
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#888]">
              <span className="material-symbols-outlined animate-spin text-[28px]">progress_activity</span>
              <span className="text-[13px]">Loading pull requests…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#888]">
              <span className="material-symbols-outlined text-[40px] opacity-30">merge_type</span>
              <div className="text-center">
                <p className="text-[14px] font-semibold text-black">No pull requests found</p>
                <p className="text-[12px] text-[#888] mt-1">
                  {activeFilter === "open" ? "Open a new pull request to start reviewing design changes." : `No ${activeFilter} pull requests yet.`}
                </p>
              </div>
              {activeFilter === "open" && (
                <Link href="/dashboard/pulls/new" className="mt-2 bg-black text-white text-[12px] font-semibold px-4 py-2 rounded hover:bg-black/80 transition-colors">
                  New Pull Request
                </Link>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#f0f0f0]">
              {filtered.map((pr) => {
                const st = STATUS_COLORS[pr.status] || STATUS_COLORS.open;
                const reviewCount = pr.dvc_pr_reviews?.length || 0;
                const commentCount = pr.dvc_pr_comments?.length || 0;
                return (
                  <Link
                    key={pr.id}
                    href={`/dashboard/pulls/${pr.id.slice(0, 6)}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-white/60 transition-colors group"
                  >
                    {/* Status Icon */}
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${st.dot} bg-opacity-20`}>
                      <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                    </div>

                    {/* Content */}
                    <div className="grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-black group-hover:underline truncate">
                          {pr.title}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${st.bg} ${st.text} ${st.border}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                          {st.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#777] flex-wrap">
                        <span className="font-mono bg-[#f5f5f5] px-1.5 py-0.5 rounded text-[10px] text-black border border-[#e8e8e8]">
                          #{pr.id?.toString().slice(0, 6)}
                        </span>
                        <span>
                          <span className="font-medium text-black">{pr.source_branch || "feature-branch"}</span>
                          <span className="mx-1 text-[#bbb]">→</span>
                          <span className="font-medium text-black">{pr.target_branch || "main"}</span>
                        </span>
                        <span>·</span>
                        <span>opened {timeAgo(pr.created_at)} by <span className="font-medium text-black">{pr.author || "designer"}</span></span>
                      </div>
                    </div>

                    {/* Right side: review + comment counts */}
                    <div className="flex items-center gap-3 text-[11px] text-[#888] shrink-0 mt-1">
                      {reviewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">rate_review</span>
                          {reviewCount}
                        </span>
                      )}
                      {commentCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">chat_bubble</span>
                          {commentCount}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
