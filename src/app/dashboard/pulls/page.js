"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  Plus,
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Search,
  Loader2,
  MessageSquare,
  Eye,
} from "lucide-react";

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
  return `${days}d ago`;
}

export default function PullRequestsPage() {
  const router = useRouter();
  const [pulls, setPulls] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("open");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchPulls() {
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
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);
      await fetchPulls();
    }
    init();
  }, [router]);

  const counts = {
    open: pulls.filter((p) => p.status === "open" || p.status === "approved" || p.status === "changes_requested").length,
    merged: pulls.filter((p) => p.status === "merged").length,
    closed: pulls.filter((p) => p.status === "closed").length,
  };

  const filtered = pulls.filter((p) => {
    const isMatchingStatus =
      activeFilter === "open"
        ? p.status === "open" || p.status === "approved" || p.status === "changes_requested"
        : p.status === activeFilter;

    if (!isMatchingStatus) return false;
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    return (
      p.title?.toLowerCase().includes(q) ||
      p.author?.toLowerCase().includes(q) ||
      p.file_key?.toLowerCase().includes(q) ||
      p.source_branch?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] text-black font-sans flex flex-col">
      {/* Top Bar */}
      <header className="h-14 border-b border-[#e5e5e5]/60 bg-white/70 backdrop-blur-lg px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-[13px] font-bold text-[#666666] hover:text-black transition-colors">
            Dashboard
          </Link>
          <span className="text-[#bbb] text-[13px]">/</span>
          <span className="text-[14px] font-semibold text-black">Pull Requests</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/pulls/new"
            className="bg-black text-white hover:bg-black/80 font-semibold text-[12px] px-4 py-1.75 rounded flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
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
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs mb-4">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e5e5]/40 gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1">
              {[
                { key: "open", label: "Open", Icon: GitPullRequest, count: counts.open },
                { key: "merged", label: "Merged", Icon: CheckCircle2, count: counts.merged },
                { key: "closed", label: "Closed", Icon: XCircle, count: counts.closed },
              ].map((f) => {
                const TabIcon = f.Icon;
                return (
                  <button
                    key={f.key}
                    onClick={() => setActiveFilter(f.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-colors cursor-pointer ${
                      activeFilter === f.key
                        ? "bg-black text-white"
                        : "text-[#555555] hover:bg-white/60 hover:text-black"
                    }`}
                  >
                    <TabIcon className="w-3.5 h-3.5" />
                    {f.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      activeFilter === f.key ? "bg-white/20 text-white" : "bg-[#f0f0f0] text-[#555555]"
                    }`}>
                      {f.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#999] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pull requests…"
                className="pl-9 pr-4 py-1.75 border border-[#e0e0e0]/60 rounded-lg bg-white/50 hover:bg-white/80 focus:bg-white text-[12px] text-black placeholder-[#aaa] outline-none focus:border-black transition-colors w-55"
              />
            </div>
          </div>

          {/* PR List */}
          {loading ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#888]">
              <Loader2 className="w-7 h-7 animate-spin text-black" />
              <span className="text-[13px]">Loading pull requests…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-3 text-[#888]">
              <GitPullRequest className="w-10 h-10 opacity-30 text-black" />
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
                          <Eye className="w-3.5 h-3.5" />
                          {reviewCount}
                        </span>
                      )}
                      {commentCount > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
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
