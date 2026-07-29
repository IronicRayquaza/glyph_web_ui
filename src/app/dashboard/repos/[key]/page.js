"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import DesignInspectPanel from "@/components/dashboard/DesignInspectPanel";
import {
  FolderGit2,
  GitCommit,
  GitPullRequest,
  Layers,
  Code,
  ArrowLeft,
  Clock,
  User,
  Plus,
  ExternalLink,
  Maximize2,
  Image as ImageIcon,
  ImageOff,
  CheckCircle2,
  MinusCircle,
  CircleDot,
  ArrowRight,
  GitBranch,
  Star,
  Eye,
  History
} from "lucide-react";

function timeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}h ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function RepositoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const repoKey = params?.key ? decodeURIComponent(params.key) : "";

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commits, setCommits] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Active Tab State: "overview", "commits", "pulls", "inspect"
  const [activeTab, setActiveTab] = useState("overview");
  const [searchCommitQuery, setSearchCommitQuery] = useState("");

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
      if (!repoKey) return;
      setLoading(true);
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser();
        if (!currentUser) {
          router.push("/login");
          return;
        }
        setUser(currentUser);

        // Fetch commits for this repository frame or file key
        const { data: allCommitRows } = await supabase
          .from("dvc_commits")
          .select("*")
          .order("timestamp", { ascending: false });

        const commitRows = (allCommitRows || []).filter(
          (c) => (c.frame_name || c.file_key) === repoKey || c.file_key === repoKey
        );

        // Fetch pull requests for this repository frame or file key
        const { data: allPrRows } = await supabase
          .from("dvc_pull_requests")
          .select("*")
          .order("created_at", { ascending: false });

        const prRows = (allPrRows || []).filter(
          (pr) => (pr.frame_name || pr.file_key) === repoKey || pr.file_key === repoKey
        );

        setCommits(commitRows);
        setPullRequests(prRows);
        await fetchNotifications(currentUser.id);
      } catch (e) {
        console.error("Error loading repo details:", e.message);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [repoKey, router]);

  const latestCommit = commits[0] || null;
  const snapshotUrl = latestCommit?.snapshot_url || null;

  const filteredCommits = useMemo(() => {
    if (!searchCommitQuery) return commits;
    return commits.filter(
      (c) =>
        c.message?.toLowerCase().includes(searchCommitQuery.toLowerCase()) ||
        c.author?.toLowerCase().includes(searchCommitQuery.toLowerCase()) ||
        c.id?.toLowerCase().includes(searchCommitQuery.toLowerCase())
    );
  }, [commits, searchCommitQuery]);

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
            <p className="text-[13px] text-[#666666] font-medium">Loading Repository Hub...</p>
          </div>
        </main>
      </div>
    );
  }

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

      {/* Main Content */}
      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* GitHub Breadcrumbs & Repository Header Card */}
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="p-2 rounded-lg bg-white/80 hover:bg-white border border-[#e0e0e4] text-[#555] hover:text-black transition-colors cursor-pointer"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <FolderGit2 className="w-6 h-6 text-black" />
                <div className="flex items-center gap-1.5 text-[20px] font-semibold text-black font-sans tracking-tight">
                  <span className="text-[#666]">gitdesign /</span>
                  <span>{repoKey}</span>
                </div>
                <span className="text-[11px] font-medium text-[#666] bg-[#f0f0f4] px-2.5 py-0.5 rounded-full border border-[#e0e0e4] ml-2">
                  Public Design Repo
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/dashboard/pulls/new?repo=${repoKey}`}
                className="bg-black text-white hover:bg-black/90 font-medium text-[12px] px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Pull Request
              </Link>
            </div>
          </div>

          {/* Sub Stats Bar */}
          <div className="flex items-center gap-6 text-[12px] text-[#666666] pt-3 border-t border-[#f0f0f4] flex-wrap">
            <div className="flex items-center gap-1.5">
              <GitCommit className="w-4 h-4 text-black" />
              <span className="font-semibold text-black">{commits.length}</span> commits
            </div>
            <div className="flex items-center gap-1.5">
              <GitPullRequest className="w-4 h-4 text-black" />
              <span className="font-semibold text-black">{pullRequests.length}</span> pull requests
            </div>
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-black" />
              <span className="font-semibold text-black">{latestCommit?.node_count || 0}</span> design layers
            </div>
            {latestCommit && (
              <div className="flex items-center gap-1.5 ml-auto text-[11px]">
                <Clock className="w-3.5 h-3.5 text-[#888]" />
                <span>Updated {timeAgo(latestCommit.timestamp)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Repository Nav Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e5e5e5]/60 pb-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-black text-white shadow-xs"
                : "bg-white/60 text-[#666] hover:bg-white hover:text-black border border-[#e0e0e4]"
            }`}
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            Overview
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("commits")}
            className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "commits"
                ? "bg-black text-white shadow-xs"
                : "bg-white/60 text-[#666] hover:bg-white hover:text-black border border-[#e0e0e4]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Commits ({commits.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pulls")}
            className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "pulls"
                ? "bg-black text-white shadow-xs"
                : "bg-white/60 text-[#666] hover:bg-white hover:text-black border border-[#e0e0e4]"
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            Pull Requests ({pullRequests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("inspect")}
            className={`flex items-center gap-1.5 text-[12px] font-semibold px-4 py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === "inspect"
                ? "bg-black text-white shadow-xs"
                : "bg-white/60 text-[#666] hover:bg-white hover:text-black border border-[#e0e0e4]"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            📐 Design Inspect
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left Column (2/5): Primary Canvas Snapshot Banner */}
            <div className="lg:col-span-2">
              <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f4]">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4.5 h-4.5 text-black" />
                    <h3 className="text-[14px] font-semibold text-black font-sans">
                      Canvas Preview
                    </h3>
                  </div>
                  {snapshotUrl && (
                    <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                      Latest Baseline
                    </span>
                  )}
                </div>

                {snapshotUrl ? (
                  <div className="rounded-lg overflow-hidden border border-[#e0e0e4] bg-[#f4f4f6] relative h-64 flex items-center justify-center">
                    <img
                      src={snapshotUrl}
                      alt={repoKey}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#aaa] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
                    <ImageOff className="w-8 h-8 opacity-40 text-black" />
                    <p className="text-[12px] font-medium text-[#666]">
                      No snapshot preview available
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (3/5): Recent Commits & Open PRs */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Recent Commits */}
              <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f4]">
                  <div className="flex items-center gap-2">
                    <GitCommit className="w-4.5 h-4.5 text-black" />
                    <h3 className="text-[14px] font-semibold text-black font-sans">
                      Recent Commits ({commits.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("commits")}
                    className="text-[12px] font-medium text-black hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-[#f0f0f4] max-h-64 overflow-y-auto custom-scrollbar">
                  {commits.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => router.push(`/dashboard/commit/${c.id}`)}
                      className="py-3 flex items-center justify-between hover:bg-white/60 px-2 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start gap-3 min-w-0 grow">
                        <CircleDot className="w-4 h-4 text-black shrink-0 mt-0.5" />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <p className="text-[13px] font-medium text-black group-hover:underline truncate">
                            {c.message}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-[#666]">
                            <span className="font-mono text-[10px] bg-[#f0f0f4] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-black font-semibold">
                              {c.id.slice(0, 7)}
                            </span>
                            <span>by {c.author}</span>
                            <span>&middot;</span>
                            <span>{timeAgo(c.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#999] group-hover:text-black shrink-0 ml-2" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Open Pull Requests */}
              <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-5 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f4]">
                  <div className="flex items-center gap-2">
                    <GitPullRequest className="w-4.5 h-4.5 text-black" />
                    <h3 className="text-[14px] font-semibold text-black font-sans">
                      Active Pull Requests ({pullRequests.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("pulls")}
                    className="text-[12px] font-medium text-black hover:underline cursor-pointer flex items-center gap-1"
                  >
                    View All <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-col divide-y divide-[#f0f0f4]">
                  {pullRequests.length === 0 ? (
                    <div className="py-6 text-center text-[#888] text-[12px]">
                      No active pull requests for gitdesign/{repoKey}
                    </div>
                  ) : (
                    pullRequests.slice(0, 3).map((pr) => (
                      <div
                        key={pr.id}
                        onClick={() => router.push(`/dashboard/pulls/${pr.id.slice(0, 6)}`)}
                        className="py-3 flex items-center justify-between hover:bg-white/60 px-2 rounded-lg transition-colors cursor-pointer group"
                      >
                        <div className="flex items-start gap-3 min-w-0 grow">
                          <GitPullRequest className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="flex flex-col gap-0.5 min-w-0">
                            <p className="text-[13px] font-medium text-black group-hover:underline truncate">
                              {pr.title}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-[#666]">
                              <span>#{pr.id.slice(0, 6)}</span>
                              <span>by {pr.author}</span>
                              <span>&middot;</span>
                              <span>{timeAgo(pr.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#999] group-hover:text-black shrink-0 ml-2" />
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMMITS */}
        {activeTab === "commits" && (
          <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between gap-4 flex-wrap pb-3 border-b border-[#f0f0f4]">
              <div className="flex items-center gap-2">
                <GitCommit className="w-5 h-5 text-black" />
                <h2 className="text-[16px] font-semibold text-black font-sans">
                  Visual Commit History
                </h2>
              </div>

              <input
                type="text"
                value={searchCommitQuery}
                onChange={(e) => setSearchCommitQuery(e.target.value)}
                placeholder="Filter commit message, author, or hash..."
                className="px-3 py-1.5 border border-[#e0e0e4] focus:border-black rounded-lg bg-white text-[12px] text-black outline-none w-64 shadow-2xs"
              />
            </div>

            <div className="flex flex-col divide-y divide-[#f0f0f4]">
              {filteredCommits.length === 0 ? (
                <div className="py-12 text-center text-[#888] text-[13px]">
                  No commits found matching your filter.
                </div>
              ) : (
                filteredCommits.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => router.push(`/dashboard/commit/${c.id}`)}
                    className="py-4 flex items-center justify-between hover:bg-white/70 px-3 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 grow">
                      <CircleDot className="w-5 h-5 text-black shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <p className="text-[14px] font-medium text-black group-hover:underline leading-snug">
                          {c.message}
                        </p>
                        <div className="flex items-center gap-2 text-[11px] text-[#666] flex-wrap">
                          <span className="font-mono text-[10px] bg-white border border-[#e0e0e0] px-1.5 py-0.5 rounded text-black font-semibold">
                            {c.id.slice(0, 7)}
                          </span>
                          <span>by {c.author}</span>
                          <span>&middot;</span>
                          <span>{timeAgo(c.timestamp)}</span>
                          <span className="text-[#999]">&middot; {c.node_count} nodes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 ml-4">
                      {c.snapshot_url && (
                        <div className="w-16 h-11 rounded-md overflow-hidden border border-[#e0e0e0] bg-[#f5f5f7]">
                          <img
                            src={c.snapshot_url}
                            alt="Snapshot"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <ArrowRight className="w-4 h-4 text-[#999] group-hover:text-black" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PULL REQUESTS */}
        {activeTab === "pulls" && (
          <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f4] flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <GitPullRequest className="w-5 h-5 text-black" />
                <h2 className="text-[16px] font-semibold text-black font-sans">
                  Pull Requests for gitdesign/{repoKey}
                </h2>
              </div>

              <Link
                href={`/dashboard/pulls/new?repo=${repoKey}`}
                className="bg-black text-white hover:bg-black/90 font-medium text-[12px] px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                New Pull Request
              </Link>
            </div>

            <div className="flex flex-col divide-y divide-[#f0f0f4]">
              {pullRequests.length === 0 ? (
                <div className="py-12 text-center text-[#888] text-[13px]">
                  No pull requests recorded for gitdesign/{repoKey}.
                </div>
              ) : (
                pullRequests.map((pr) => (
                  <div
                    key={pr.id}
                    onClick={() => router.push(`/dashboard/pulls/${pr.id.slice(0, 6)}`)}
                    className="py-4 flex items-center justify-between hover:bg-white/70 px-3 rounded-xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start gap-3.5 min-w-0 grow">
                      <GitPullRequest className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[14px] font-medium text-black group-hover:underline leading-snug">
                            {pr.title}
                          </p>
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-100/80 text-slate-700 border-slate-300/80 capitalize">
                            {pr.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#666] flex-wrap">
                          <span>#{pr.id.slice(0, 6)}</span>
                          <span>by {pr.author}</span>
                          <span>&middot;</span>
                          <span>{timeAgo(pr.created_at)}</span>
                          <span>&middot;</span>
                          <span className="font-mono text-[10px] bg-white border border-[#e0e0e0] px-1.5 py-0.5 rounded text-black">
                            {pr.source_branch} → {pr.target_branch}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#999] group-hover:text-black shrink-0 ml-4" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 4: DESIGN INSPECT MODE */}
        {activeTab === "inspect" && (
          <div className="flex flex-col gap-4">
            <div className="bg-white/70 backdrop-blur-lg p-4 rounded-xl border border-[#e5e5e5]/50 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-amber-500" />
                <h3 className="text-[14px] font-semibold text-black">
                  Repository Developer Design Inspect
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#666] bg-[#f0f0f4] px-2.5 py-1 rounded border border-[#e0e0e4]">
                Baseline Commit: {latestCommit ? latestCommit.id.slice(0, 7) : "None"}
              </span>
            </div>

            <DesignInspectPanel nodes={latestCommit?.nodes || []} />
          </div>
        )}
      </main>
    </div>
  );
}
