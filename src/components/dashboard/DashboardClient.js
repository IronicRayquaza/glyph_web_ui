"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import MetricKpiCards from "@/components/dashboard/MetricKpiCards";
import DesignRepositoriesGrid from "@/components/dashboard/DesignRepositoriesGrid";
import ActivePullRequestsWidget from "@/components/dashboard/ActivePullRequestsWidget";
import RecentCommits from "@/components/dashboard/RecentCommits";
import ContributionHeatmap from "@/components/dashboard/ContributionHeatmap";
import CommandPalette from "@/components/dashboard/CommandPalette";
import { Loader2, Plus, X } from "lucide-react";

// Time formatting helper
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

export default function DashboardClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commits, setCommits] = useState([]);
  const [pullRequests, setPullRequests] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedFile, setSelectedFile] = useState("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Fetch commits list
  async function fetchCommits() {
    try {
      const { data, error } = await supabase
        .from("dvc_commits")
        .select(
          "id, parent_id, file_key, frame_key, message, author, author_id, timestamp, page_name, frame_name, node_count, snapshot_url"
        )
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setCommits(data || []);
    } catch (e) {
      console.error("Error fetching commits:", e.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch pull requests
  async function fetchPullRequests() {
    try {
      const { data } = await supabase
        .from("dvc_pull_requests")
        .select("id, title, status, author, file_key, source_branch, target_branch, created_at")
        .order("created_at", { ascending: false });
      setPullRequests(data || []);
    } catch (e) {
      setPullRequests([]);
    }
  }

  // Fetch notifications list
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

  // Mark all notifications read
  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("dvc_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  // Mark single notification read
  async function markNotifRead(notifId) {
    await supabase.from("dvc_notifications").update({ read: true }).eq("id", notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
  }

  // Handle user sign out
  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Keyboard shortcut listener for `/` key
  useEffect(() => {
    function handleKeyDown(e) {
      if (
        e.key === "/" &&
        document.activeElement.tagName !== "INPUT" &&
        document.activeElement.tagName !== "TEXTAREA"
      ) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Check authentication status & load data
  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        await Promise.all([
          fetchCommits(),
          fetchPullRequests(),
          fetchNotifications(user.id),
        ]);
      }
    }
    checkUser();
  }, [router]);

  // Filter commits by selected file and search query
  const filteredCommits = commits.filter((c) => {
    const matchesFile = selectedFile === "__all__" || c.file_key === selectedFile;
    const matchesSearch =
      searchQuery === "" ||
      c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.file_key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFile && matchesSearch;
  });

  // Calculate heatmap data
  const contributionByDay = {};
  filteredCommits.forEach((c) => {
    if (c.timestamp) {
      const day = c.timestamp.slice(0, 10);
      contributionByDay[day] = (contributionByDay[day] || 0) + 1;
    }
  });

  // Render contribution activity cells
  const WEEKS = 45;
  const today = new Date();
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - WEEKS * 7);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  const cols = [];
  let cursor = new Date(startDate);
  while (cursor <= today) {
    const colCells = [];
    for (let d = 0; d < 7; d++) {
      if (cursor > today) break;
      const key = cursor.toISOString().slice(0, 10);
      const count = contributionByDay[key] || 0;
      colCells.push({ key, count });
      cursor.setDate(cursor.getDate() + 1);
    }
    cols.push(colCells);
  }

  // Extract repositories map & list
  const reposMap = {};
  commits.forEach((c) => {
    if (!reposMap[c.file_key]) {
      reposMap[c.file_key] = {
        name: c.file_key,
        commits: 0,
        recentTimestamp: c.timestamp,
        description: `Design systems repository for the "${c.file_key}" components and templates.`,
      };
    }
    reposMap[c.file_key].commits += 1;
  });
  const reposList = Object.values(reposMap).sort((a, b) => b.commits - a.commits);

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
            <p className="text-[13px] text-[#666666] font-medium">Loading GitDesign Workspace...</p>
          </div>
        </main>
      </div>
    );
  }

  const openPullsCount = pullRequests.filter((pr) =>
    ["open", "approved", "changes_requested"].includes(pr.status)
  ).length;

  return (
    <div className="grow flex flex-col min-w-0">
      {/* Header Bar Component */}
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

      {/* Main Dashboard Content */}
      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Workspace Title & Quick Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[26px] font-sans tracking-tight text-black font-bold">
                Design System Overview
              </h1>
              <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                v1.0
              </span>
            </div>
            <p className="text-[13px] text-[#666666]">
              Manage your Figma component libraries, review visual pull requests, and track version releases.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {selectedFile !== "__all__" && (
              <button
                type="button"
                onClick={() => setSelectedFile("__all__")}
                className="bg-white/80 border border-[#c5c5c5] text-black text-[12px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-black" />
                Clear File Filter ({selectedFile})
              </button>
            )}

            <Link
              href="/dashboard/pulls/new"
              className="bg-black text-white hover:bg-black/90 font-bold text-[12px] px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4 text-white" />
              New Pull Request
            </Link>
          </div>
        </div>

        {/* Section 1: KPI Metric Banner */}
        <MetricKpiCards
          commits={commits}
          reposList={reposList}
          openPullsCount={openPullsCount}
          notifications={notifications}
        />

        {/* Section 2: 2-Column Split (Design Repositories + Active PRs Queue) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 flex flex-col">
            <DesignRepositoriesGrid
              reposList={reposList}
              commits={commits}
              onSelectFile={(fileKey) => setSelectedFile(fileKey)}
            />
          </div>

          <div className="xl:col-span-1 flex flex-col">
            <ActivePullRequestsWidget pullRequests={pullRequests} />
          </div>
        </div>

        {/* Section 3: 2-Column Split (Recent Commits Feed + Heatmap Widget) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
          <div className="xl:col-span-2 flex flex-col">
            <RecentCommits
              filteredCommits={filteredCommits}
              onSelectFile={(fileKey) => setSelectedFile(fileKey)}
              timeAgo={timeAgo}
            />
          </div>

          <div className="xl:col-span-1 flex flex-col">
            <ContributionHeatmap
              commits={commits}
              onResetFilter={() => setSelectedFile("__all__")}
            />
          </div>
        </div>
      </main>

      {/* Command Palette Search Modal Component */}
      <CommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filteredCommits={filteredCommits}
        timeAgo={timeAgo}
      />
    </div>
  );
}
