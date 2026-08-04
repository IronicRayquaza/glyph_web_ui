"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import {
  GitCommit,
  FolderGit2,
  GitPullRequest,
  GitMerge,
  CheckCircle2,
  MessageSquare,
  History,
  Layers,
  Search,
  X,
  Plus,
  ChevronRight,
  Loader2,
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

function formatDateGroup(dateString) {
  if (!dateString) return "Earlier";
  const date = new Date(dateString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ActivityPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commits, setCommits] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Filter States
  const [activeTab, setActiveTab] = useState("all"); // "all", "commit", "pr", "repo", "review"
  const [selectedRepo, setSelectedRepo] = useState("__all__");
  const [searchQuery, setSearchQuery] = useState("");

  async function fetchCommits(currentUser) {
    try {
      if (!currentUser) return;
      let query = supabase
        .from("dvc_commits")
        .select("id, file_key, message, author, author_id, timestamp, node_count, snapshot_url")
        .order("timestamp", { ascending: false });

      if (currentUser.id && currentUser.email) {
        query = query.or(`author_id.eq.${currentUser.id},author.eq.${currentUser.email}`);
      } else if (currentUser.id) {
        query = query.eq("author_id", currentUser.id);
      } else if (currentUser.email) {
        query = query.eq("author", currentUser.email);
      }

      const { data } = await query;
      setCommits(data || []);
    } catch (e) {
      setCommits([]);
    }
  }

  async function fetchPullRequests(currentUser) {
    try {
      if (!currentUser) return;
      let query = supabase
        .from("dvc_pull_requests")
        .select("id, title, status, author, author_id, file_key, source_branch, target_branch, created_at, updated_at")
        .order("created_at", { ascending: false });

      if (currentUser.id && currentUser.email) {
        query = query.or(`author_id.eq.${currentUser.id},author.eq.${currentUser.email}`);
      } else if (currentUser.id) {
        query = query.eq("author_id", currentUser.id);
      } else if (currentUser.email) {
        query = query.eq("author", currentUser.email);
      }

      const { data } = await query;
      setPullRequests(data || []);
    } catch (e) {
      setPullRequests([]);
    }
  }

  async function fetchReviews() {
    try {
      const { data } = await supabase
        .from("dvc_pr_reviews")
        .select("id, pr_id, reviewer_name, action, body, created_at")
        .order("created_at", { ascending: false });
      setReviews(data || []);
    } catch (e) {
      setReviews([]);
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
      await Promise.all([
        fetchCommits(user),
        fetchPullRequests(user),
        fetchReviews(),
        fetchNotifications(user.id),
      ]);
      setLoading(false);
    }
    init();
  }, [router]);

  // Combine all activities into a single unified timeline stream
  const allActivities = useMemo(() => {
    const stream = [];

    // Commits & Repository Initializations
    commits.forEach((c) => {
      const isInit = c.message?.toLowerCase().includes("init");
      stream.push({
        id: `commit-${c.id}`,
        category: isInit ? "repo" : "commit",
        type: isInit ? "repo_created" : "commit",
        title: isInit ? `Initialized repository "oleidian/${c.file_key}"` : c.message,
        author: c.author || "Designer",
        timestamp: c.timestamp,
        repo: c.file_key,
        commitId: c.id,
        nodeCount: c.node_count,
        snapshotUrl: c.snapshot_url,
        link: `/dashboard/commit/${c.id}`,
      });
    });

    // Pull Requests Created
    pullRequests.forEach((pr) => {
      stream.push({
        id: `pr-created-${pr.id}`,
        category: "pr",
        type: "pr_created",
        title: `Opened Pull Request: ${pr.title}`,
        author: pr.author || "Designer",
        timestamp: pr.created_at,
        repo: pr.file_key || "local",
        prId: pr.id,
        sourceBranch: pr.source_branch,
        targetBranch: pr.target_branch,
        status: pr.status,
        link: `/dashboard/pulls/${pr.id.slice(0, 6)}`,
      });

      if (pr.status === "merged" && pr.updated_at) {
        stream.push({
          id: `pr-merged-${pr.id}`,
          category: "pr",
          type: "pr_merged",
          title: `Merged Pull Request #${pr.id?.toString().slice(0, 6)}: ${pr.title}`,
          author: pr.author || "Designer",
          timestamp: pr.updated_at,
          repo: pr.file_key || "local",
          prId: pr.id,
          link: `/dashboard/pulls/${pr.id.slice(0, 6)}`,
        });
      }
    });

    // Reviews & Comments
    reviews.forEach((r) => {
      const isApproved = r.action === "approve";
      stream.push({
        id: `review-${r.id}`,
        category: "review",
        type: isApproved ? "pr_approved" : "review",
        title: `${isApproved ? "Approved" : "Reviewed"} Pull Request #${r.pr_id?.toString().slice(0, 6)}`,
        author: r.reviewer_name || "Reviewer",
        timestamp: r.created_at,
        repo: "design-system",
        prId: r.pr_id,
        details: r.body,
        link: `/dashboard/pulls/${r.pr_id?.toString().slice(0, 6)}`,
      });
    });

    // Sort newest first
    return stream.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }, [commits, pullRequests, reviews]);

  // Extract distinct repositories for filter dropdown
  const repoList = useMemo(() => {
    const repos = new Set();
    allActivities.forEach((a) => {
      if (a.repo) repos.add(a.repo);
    });
    return Array.from(repos);
  }, [allActivities]);

  // Filter activities based on tab, repo dropdown, and search query
  const filteredActivities = useMemo(() => {
    return allActivities.filter((act) => {
      const matchesTab =
        activeTab === "all" ||
        act.category === activeTab ||
        (activeTab === "pr" && act.category === "pr") ||
        (activeTab === "commit" && act.category === "commit") ||
        (activeTab === "repo" && act.category === "repo") ||
        (activeTab === "review" && act.category === "review");

      const matchesRepo = selectedRepo === "__all__" || act.repo === selectedRepo;

      const matchesSearch =
        searchQuery === "" ||
        act.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        act.repo?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesRepo && matchesSearch;
    });
  }, [allActivities, activeTab, selectedRepo, searchQuery]);

  // Group activities by date headers
  const groupedActivities = useMemo(() => {
    const groups = {};
    filteredActivities.forEach((act) => {
      const label = formatDateGroup(act.timestamp);
      if (!groups[label]) groups[label] = [];
      groups[label].push(act);
    });
    return groups;
  }, [filteredActivities]);

  // Activity type icon and color styling helper
  const getActivityIconStyle = (type) => {
    switch (type) {
      case "commit":
        return { Icon: GitCommit, color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
      case "repo_created":
        return { Icon: FolderGit2, color: "bg-purple-100 text-purple-700 border-purple-300" };
      case "pr_created":
        return { Icon: GitPullRequest, color: "bg-blue-100 text-blue-700 border-blue-300" };
      case "pr_merged":
        return { Icon: GitMerge, color: "bg-indigo-100 text-indigo-700 border-indigo-300" };
      case "pr_approved":
        return { Icon: CheckCircle2, color: "bg-emerald-100 text-emerald-700 border-emerald-300" };
      case "review":
        return { Icon: MessageSquare, color: "bg-amber-100 text-amber-700 border-amber-300" };
      default:
        return { Icon: History, color: "bg-gray-100 text-gray-700 border-gray-300" };
    }
  };

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
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-[13px] text-[#666666] font-medium">Loading Activity Stream...</p>
          </div>
        </main>
      </div>
    );
  }

  const counts = {
    all: allActivities.length,
    commit: allActivities.filter((a) => a.category === "commit").length,
    pr: allActivities.filter((a) => a.category === "pr").length,
    repo: allActivities.filter((a) => a.category === "repo").length,
    review: allActivities.filter((a) => a.category === "review").length,
  };

  return (
    <div className="grow flex flex-col min-w-0">
      {/* Header Bar */}
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
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-[24px] font-sans tracking-tight text-black font-semibold">
              Activity Stream
            </h1>
            <p className="text-[13px] text-[#666666]">
              Real-time audit log of design system commits, pull requests, reviews, and repository events.
            </p>
          </div>

          <Link
            href="/dashboard/pulls/new"
            className="bg-black text-white hover:bg-black/90 font-medium text-[12px] px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New Pull Request
          </Link>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative z-30">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All Activity", count: counts.all, Icon: Layers },
              { id: "commit", label: "Commits", count: counts.commit, Icon: GitCommit },
              { id: "pr", label: "Pull Requests", count: counts.pr, Icon: GitPullRequest },
              { id: "repo", label: "Repositories", count: counts.repo, Icon: FolderGit2 },
              { id: "review", label: "Reviews", count: counts.review, Icon: MessageSquare },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-black text-white shadow-xs"
                      : "text-[#555555] hover:bg-white/60 hover:text-black"
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      isSelected ? "bg-white/20 text-white" : "bg-[#f0f0f2] text-[#666666]"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Input only */}
          <div className="relative flex items-center ml-auto">
            <Search className="w-4 h-4 text-[#888888] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity description, author..."
              className="pl-9 pr-8 py-2 border border-[#e0e0e0] focus:border-black rounded-lg bg-white text-[12px] font-medium text-black placeholder-[#999999] outline-none focus:ring-1 focus:ring-black transition-all w-64 sm:w-80 shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-[#999999] hover:text-black cursor-pointer flex items-center justify-center p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Timeline Feed Container */}
        <div className="flex flex-col gap-6">
          {Object.keys(groupedActivities).length === 0 ? (
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-12 text-center flex flex-col items-center gap-3 text-[#888888]">
              <History className="w-9 h-9 opacity-40 text-black" />
              <p className="text-[14px] font-bold text-black">No activity found</p>
              <p className="text-[12px]">No events match the selected category, repository, or search filter.</p>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("all");
                  setSelectedRepo("__all__");
                  setSearchQuery("");
                }}
                className="mt-2 text-[12px] font-bold text-black hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            Object.entries(groupedActivities).map(([dateHeader, items]) => (
              <div key={dateHeader} className="flex flex-col gap-3">
                {/* Date Group Header */}
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-medium text-[#666666] font-sans">
                    {dateHeader}
                  </span>
                  <div className="grow border-t border-[#e0e0e2]/60" />
                </div>

                {/* Group Activity Cards */}
                <div className="flex flex-col gap-3">
                  {items.map((act) => {
                    const style = getActivityIconStyle(act.type);
                    const ActIcon = style.Icon;
                    return (
                      <div
                        key={act.id}
                        onClick={() => router.push(act.link)}
                        className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 hover:border-black/60 rounded-xl p-4 shadow-xs hover:shadow-md transition-all flex items-start justify-between gap-4 group cursor-pointer"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 grow">
                          {/* Type Icon */}
                          <div
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 ${style.color}`}
                          >
                            <ActIcon className="w-4.5 h-4.5" />
                          </div>

                          {/* Details */}
                          <div className="flex flex-col gap-1 min-w-0 grow">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[13px] font-medium text-black group-hover:underline leading-snug">
                                {act.title}
                              </span>
                              {act.status && (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-slate-100/80 text-slate-700 border-slate-300/80">
                                  {act.status}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] text-[#666666] flex-wrap">
                              <span className="font-medium text-[#666]">by {act.author}</span>
                              <span>&middot;</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/repos/${encodeURIComponent(act.repo)}`);
                                }}
                                className="text-black font-medium hover:underline"
                              >
                                oleidian/{act.repo}
                              </button>
                              <span>&middot;</span>
                              <span>{timeAgo(act.timestamp)}</span>

                              {act.commitId && (
                                <span className="font-mono bg-[#f0f0f2] border border-[#e0e0e0] px-1.5 py-0.5 rounded text-[10px] text-black">
                                  {act.commitId.slice(0, 7)}
                                </span>
                              )}

                              {act.sourceBranch && (
                                <span className="flex items-center gap-1 font-mono text-[10px] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-black">
                                  <span>{act.sourceBranch}</span>
                                  <span className="text-[#999]">→</span>
                                  <span>{act.targetBranch}</span>
                                </span>
                              )}
                            </div>

                            {act.details && (
                              <p className="text-[12px] text-[#555555] bg-[#fafafa] p-2.5 rounded-lg border border-[#f0f0f0] mt-1 leading-relaxed">
                                {act.details}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Snapshot thumbnail or Arrow */}
                        <div className="flex items-center gap-3 shrink-0 self-center">
                          {act.snapshotUrl && (
                            <div className="w-16 h-11 rounded-md overflow-hidden border border-[#e0e0e0] bg-[#f5f5f7] shadow-xs group-hover:shadow-md transition-shadow">
                              <img
                                src={act.snapshotUrl}
                                alt="Activity preview"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                }}
                              />
                            </div>
                          )}

                          <ChevronRight className="w-4.5 h-4.5 text-[#999999] group-hover:text-black group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
