"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [commits, setCommits] = useState([]);
  const [activeTab, setActiveTab] = useState("Activity");
  const [selectedFile, setSelectedFile] = useState("__all__");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef(null);

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

  // Check auth
  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      } else {
        setUser(user);
        fetchCommits(user.id);
        fetchNotifications(user.id);
      }
    }
    checkUser();
  }, [router]);

  // Close notif dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch commits
  async function fetchCommits(userId) {
    try {
      const { data, error } = await supabase
        .from("dvc_commits")
        .select("id, parent_id, file_key, frame_key, message, author, author_id, timestamp, page_name, frame_name, node_count")
        .order("timestamp", { ascending: false });

      if (error) throw error;
      setCommits(data || []);
    } catch (e) {
      console.error("Error fetching commits:", e.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch notifications for current user
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
      // Table may not exist yet — silently ignore
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
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }

  async function markNotifRead(notifId) {
    await supabase.from("dvc_notifications").update({ read: true }).eq("id", notifId);
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Filter commits by search and selected file
  const filteredCommits = commits.filter((c) => {
    const matchesFile = selectedFile === "__all__" || c.file_key === selectedFile;
    const matchesSearch = searchQuery === "" || 
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

  // Extract repositories (Figma files)
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

  // Time formatting helper
  function timeAgo(dateString) {
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

  if (loading) {
    return (
      <div className="bg-[#fcfcfc] text-black min-h-screen flex justify-center items-center font-sans">
        <div className="flex flex-col items-center gap-sm">
          <span className="material-symbols-outlined animate-spin text-2xl text-black">progress_activity</span>
          <p className="text-secondary text-body-sm font-medium">Loading GitDesign Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-black font-sans min-h-screen flex flex-row relative bg-transparent">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/From%20Klickpin.com-%20Stylish%20Pinterest%20marketing%20ideas%20that%20feel%20fresh%20elevated%20and%20surprisingly%20easy%20to%20recreate%20at%20home%20for%20busy%20people%20who%20still.mp4" type="video/mp4" />
      </video>
      
      {/* ─── LEFT SIDEBAR ────────────────────────────────────── */}
      <aside className="w-60 bg-white/70 backdrop-blur-lg border-r border-[#d5d5d5]/40 flex flex-col shrink-0 z-10">
        {/* Profile Card Header */}
        <div className="p-md border-b border-[#d5d5d5]/40 flex items-center gap-sm">
          <div className="w-10 h-10 bg-white/80 border border-[#c5c5c5]/40 rounded-DEFAULT flex items-center justify-center overflow-hidden">
            {/* Visual design file icon thumbnail placeholder */}
            <span className="material-symbols-outlined text-[20px] text-black font-bold">menu_book</span>
          </div>
          <div className="flex flex-col truncate">
            <span className="text-[13px] font-bold text-black tracking-tight">GitDesign</span>
            <span className="text-[11px] text-[#777777] font-medium">Design Systems</span>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="grow py-sm flex flex-col justify-between">
          <div className="flex flex-col">
            {[
              { id: "Dashboard", icon: "grid_view", href: null },
              { id: "Repositories", icon: "folder_open", href: null },
              { id: "Branches", icon: "call_split", href: null },
              { id: "Pull Requests", icon: "merge_type", href: "/dashboard/pulls" },
              { id: "Activity", icon: "history", href: null }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              if (tab.href) {
                return (
                  <Link
                    key={tab.id}
                    href={tab.href}
                    className="w-full flex items-center gap-sm px-md py-2.5 text-[13px] text-left transition-colors relative text-[#555555] hover:bg-[#e2e2e2]/40 hover:text-black"
                  >
                    <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                    {tab.id}
                  </Link>
                );
              }
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-sm px-md py-2.5 text-[13px] text-left transition-colors relative cursor-pointer ${
                    isSelected 
                      ? "bg-white/80 backdrop-blur-sm font-bold text-black border-l-[3px] border-black" 
                      : "text-[#555555] hover:bg-[#e2e2e2]/40 hover:text-black"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                  {tab.id}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-sm px-md pb-md">
            <button
              onClick={() => setActiveTab("Settings")}
              className={`w-full flex items-center gap-sm py-xs text-[13px] text-left transition-colors cursor-pointer ${
                activeTab === "Settings" 
                  ? "font-bold text-black" 
                  : "text-[#555555] hover:text-black"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Settings
            </button>

            <button 
              className="bg-white/80 border border-[#c5c5c5]/40 text-black text-[12px] font-bold py-xs text-center rounded shadow-none hover:bg-white/95 transition-colors cursor-pointer w-full"
            >
              Upgrade Plan
            </button>
          </div>
        </nav>
      </aside>

      {/* ─── MAIN COLUMN ────────────────────────────────────── */}
      <div className="grow flex flex-col min-w-0 z-10">
        
        {/* Top Header Bar */}
        <header className="bg-white/70 backdrop-blur-lg border-b border-[#e5e5e5]/40 h-16 flex justify-between items-center px-margin">
          <div className="flex items-center gap-xl grow max-w-4xl">
            <Link href="/" className="text-[18px] font-bold font-sans tracking-tight text-black select-none">
              GitDesign
            </Link>

            {/* Small GitHub-style Search Trigger Button */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="relative w-60 bg-white/60 hover:bg-white/80 border border-[#d5d5d5]/30 rounded px-sm py-1.5 flex items-center justify-between text-[12px] text-[#666666] cursor-pointer select-none transition-colors"
            >
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px] text-[#666666]">search</span>
                <span>Type <span className="font-mono">/</span> to search</span>
              </div>
              <span className="border border-[#c5c5c5]/40 bg-white/80 rounded px-1 text-[9px] font-mono text-[#888888]">/</span>
            </div>
          </div>

          {/* Right Header Navigation */}
          <div className="flex items-center gap-sm">
            {/* Notifications Bell */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotifOpen(!isNotifOpen)}
                className="text-[#555555] hover:text-black p-xs rounded cursor-pointer transition-colors relative"
              >
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute top-[4px] right-[4px] w-[8px] h-[8px] bg-black rounded-full border-2 border-white" />
                )}
              </button>

              {/* Notifications Dropdown */}
              {isNotifOpen && (
                <div className="absolute right-0 top-full mt-2 w-85 bg-white border border-[#e0e0e0] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
                    <span className="text-[13px] font-bold text-black">Notifications</span>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={markAllRead}
                        className="text-[11px] text-[#666] hover:text-black transition-colors cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-90 overflow-y-auto divide-y divide-[#f5f5f5]">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center flex flex-col items-center gap-2 text-[#aaa]">
                        <span className="material-symbols-outlined text-[28px] opacity-40">notifications_none</span>
                        <span className="text-[12px]">No notifications yet</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => { markNotifRead(n.id); if (n.pr_id) router.push(`/dashboard/pulls/${n.pr_id}`); setIsNotifOpen(false); }}
                          className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                            !n.read ? "bg-[#f8f8ff] hover:bg-[#f0f0ff]" : "hover:bg-[#fafafa]"
                          }`}
                        >
                          <span className={`material-symbols-outlined text-[16px] mt-0.5 shrink-0 ${
                            n.type === "approve" ? "text-emerald-500" :
                            n.type === "request_changes" ? "text-amber-500" :
                            n.type === "merged" ? "text-purple-500" :
                            n.type === "review_requested" ? "text-blue-500" :
                            "text-[#888]"
                          }`}>
                            {n.type === "approve" ? "check_circle" :
                             n.type === "request_changes" ? "change_circle" :
                             n.type === "merged" ? "merge" :
                             n.type === "review_requested" ? "rate_review" :
                             "notifications"}
                          </span>
                          <div className="grow min-w-0">
                            <p className={`text-[12px] leading-tight ${!n.read ? "font-semibold text-black" : "text-[#555]"}`}>{n.title}</p>
                            <p className="text-[11px] text-[#888] mt-0.5 leading-snug truncate">{n.body}</p>
                          </div>
                          {!n.read && <div className="w-2 h-2 bg-black rounded-full shrink-0 mt-1" />}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/dashboard/pulls/new"
              className="bg-black text-white hover:bg-black/90 font-medium text-[12px] px-sm py-1.5 rounded transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              New PR
            </Link>
            
            {/* User Avatar Initials */}
            <button 
              onClick={handleSignOut}
              className="w-8 h-8 rounded-full border border-[#c5c5c5]/40 flex items-center justify-center text-[12px] font-bold bg-white/70 hover:bg-black hover:text-white transition-colors cursor-pointer select-none"
              title="Sign out"
            >
              {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
            </button>
          </div>
        </header>

        {/* Main Content Workspace Scroll */}
        <main className="grow p-margin overflow-y-auto max-w-6xl w-full mx-auto">
          {/* Header Title Section */}
          <div className="flex justify-between items-start mb-sm">
            <div className="flex flex-col gap-0.5">
              <h1 className="text-[26px] font-sans tracking-tight text-black font-bold">
                Contribution Activity
              </h1>
              <p className="text-[13px] text-[#666666]">
                Track your design system commits, merges, and overall impact.
              </p>
            </div>
            
            {/* Select timeframe calendar dropdown */}
            <button className="bg-white/80 backdrop-blur-sm border border-[#c5c5c5]/40 text-black text-[12px] font-bold px-sm py-1.5 rounded flex items-center gap-xs hover:bg-white/95 transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[15px]">calendar_today</span>
              This Year
            </button>
          </div>

          {/* Grid Layout (Two Column Layout matching mockup) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-sm items-start">
            
            {/* ─── LEFT COLUMN: Activity heatmap and commit timeline (2/3 width) ─── */}
            <div className="lg:col-span-2 flex flex-col gap-sm">
              
              {/* Heatmap Card */}
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 p-md rounded flex flex-col gap-sm shadow-sm z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-black">
                    {commits.length} contributions in the last year
                  </h2>
                  <button 
                    onClick={() => setSelectedFile("__all__")}
                    className="text-[11px] text-[#666666] hover:underline cursor-pointer"
                  >
                    Settings
                  </button>
                </div>

                {/* Heatmap Grid Cells */}
                <div className="flex gap-0.75 items-start overflow-x-auto py-xs scrollbar-thin">
                  <div className="flex flex-col gap-0.75 text-[9px] text-[#888888] select-none pr-xs h-25.75 justify-between text-right font-medium">
                    <span>Sun</span>
                    <span>Wed</span>
                    <span>Sat</span>
                  </div>
                  <div className="flex gap-0.75 items-start">
                    {cols.map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-0.75">
                        {col.map((cell) => {
                          let colorClass = "bg-[#f0f0f0] border border-[#e8e8e8]";
                          if (cell.count === 1) colorClass = "bg-[#c8c8c8] border border-[#bebebe]";
                          else if (cell.count === 2) colorClass = "bg-[#8c8c8c] border border-[#808080]";
                          else if (cell.count === 3) colorClass = "bg-[#4c4c4c] border border-[#404040]";
                          else if (cell.count > 3) colorClass = "bg-[#000000] border border-[#000000]";
                          return (
                            <div
                              key={cell.key}
                              className={`w-2.75 h-2.75 rounded-[1px] ${colorClass} hover:ring-1 hover:ring-black cursor-default`}
                              title={`${cell.key}: ${cell.count} commits`}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heatmap Footer Legend */}
                <div className="flex justify-between items-center text-[11px] text-[#666666] pt-base border-t border-[#f5f5f5]">
                  <a href="#" className="hover:underline">Learn how we count contributions</a>
                  <div className="flex items-center gap-0.75 select-none">
                    <span>Less</span>
                    <div className="w-2.75 h-2.75 bg-[#f0f0f0] border border-[#e8e8e8] rounded-[1px]" />
                    <div className="w-2.75 h-2.75 bg-[#c8c8c8] border border-[#bebebe] rounded-[1px]" />
                    <div className="w-2.75 h-2.75 bg-[#8c8c8c] border border-[#808080] rounded-[1px]" />
                    <div className="w-2.75 h-2.75 bg-[#4c4c4c] border border-[#404040] rounded-[1px]" />
                    <div className="w-2.75 h-2.75 bg-[#000000] border border-black rounded-[1px]" />
                    <span>More</span>
                  </div>
                </div>
              </div>

              {/* Recent Commits Log List Card */}
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded overflow-hidden shadow-sm z-10">
                <div className="border-b border-[#e5e5e5] px-md py-sm flex items-center justify-between">
                  <h2 className="text-[13px] font-bold text-black font-sans">
                    Recent Commits
                  </h2>
                  <button className="text-[11px] text-[#666666] hover:underline cursor-pointer">
                    View all
                  </button>
                </div>

                {/* Commits logs mapping list */}
                <div className="divide-y divide-[#e5e5e5]">
                  {filteredCommits.length === 0 ? (
                    <div className="p-xl text-center text-[#888888] text-[13px]">
                      No recent commits found matching search query.
                    </div>
                  ) : (
                    filteredCommits.map((c) => {
                      return (
                        <div
                          key={c.id}
                          onClick={() => router.push(`/dashboard/commit/${c.id}`)}
                          className="p-md flex items-start gap-md hover:bg-white/65 transition-colors cursor-pointer group"
                        >
                          {/* Visual status icon on left */}
                          <div className="pt-base shrink-0 select-none">
                            {c.node_count > 10 ? (
                              <span className="material-symbols-outlined text-[18px] text-black">check_circle</span>
                            ) : c.node_count === 0 ? (
                              <span className="material-symbols-outlined text-[18px] text-[#999999]">remove_circle</span>
                            ) : (
                              <span className="material-symbols-outlined text-[18px] text-[#444444]">adjust</span>
                            )}
                          </div>

                          {/* Commit metadata details */}
                          <div className="flex flex-col gap-base grow min-w-0">
                            <p className="text-[13px] font-medium text-black leading-tight">
                              {c.message}
                            </p>
                            <div className="flex items-center gap-xs text-[11px] text-[#666666] flex-wrap">
                              <span className="bg-white/60 border border-[#e0e0e0]/40 font-mono px-sm py-0.5 rounded text-[10px] text-black">
                                {c.id.slice(0, 7)}
                              </span>
                              <span>in</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFile(c.file_key);
                                }}
                                className="text-black hover:underline font-medium"
                              >
                                gitdesign/{c.file_key}
                              </button>
                              <span>&middot;</span>
                              <span>{timeAgo(c.timestamp)}</span>
                              {c.snapshot_url && (
                                <span className="flex items-center gap-[3px] text-[#888] text-[9px] border border-[#e0e0e0] bg-white/60 px-1.5 py-[1px] rounded-full">
                                  <span className="material-symbols-outlined text-[10px]">image</span>
                                  snapshot
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Snapshot thumbnail */}
                          {c.snapshot_url && (
                            <div className="shrink-0 w-14 h-10 rounded overflow-hidden border border-[#e5e5e5] bg-[#f5f5f5] opacity-80 group-hover:opacity-100 transition-opacity">
                              <img
                                src={c.snapshot_url}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            </div>
                          )}

                          {/* Arrow indicator */}
                          <div className="shrink-0 flex items-center self-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="material-symbols-outlined text-[16px] text-[#888]">chevron_right</span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* ─── RIGHT COLUMN: Stats at a glance and Popular Repositories ─── */}
            <div className="flex flex-col gap-sm">
              
              {/* Stats Card */}
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 p-md rounded flex flex-col gap-sm shadow-sm z-10">
                <h2 className="text-[13px] font-bold text-black font-sans">
                  Stats at a glance
                </h2>
                
                <div className="flex flex-col gap-sm pt-base">
                  <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
                    <span className="text-[12px] text-[#555555]">Total Commits</span>
                    <span className="text-[16px] font-bold font-sans text-black">{commits.length}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
                    <span className="text-[12px] text-[#555555]">Design Files</span>
                    <span className="text-[16px] font-bold font-sans text-black">
                      {reposList.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
                    <span className="text-[12px] text-[#555555]">Notifications</span>
                    <span className="text-[16px] font-bold font-sans text-black">
                      {notifications.filter(n => !n.read).length > 0 ? (
                        <span className="flex items-center gap-1">
                          {notifications.filter(n => !n.read).length}
                          <span className="text-[10px] text-[#888] font-normal">unread</span>
                        </span>
                      ) : notifications.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#555555]">Contributors</span>
                    <span className="text-[16px] font-bold font-sans text-black">
                      {[...new Set(commits.map(c => c.author))].filter(Boolean).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Repositories Card */}
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/40 rounded overflow-hidden flex flex-col shadow-sm z-10">
                <div className="border-b border-[#e5e5e5]/40 px-md py-sm">
                  <h2 className="text-[13px] font-bold text-black font-sans">
                    Popular Repositories
                  </h2>
                </div>

                <div className="p-md flex flex-col gap-md">
                  {reposList.length === 0 ? (
                    <div className="text-center text-[#888888] text-[12px] py-md">
                      No design file repositories found.
                    </div>
                  ) : (
                    reposList.slice(0, 3).map((repo) => (
                      <div key={repo.name} className="flex flex-col gap-base border-b border-[#f5f5f5]/40 pb-sm last:border-b-0 last:pb-0">
                        <div className="flex items-center justify-between">
                          <button 
                            onClick={() => setSelectedFile(repo.name)}
                            className="text-[13px] font-bold text-black hover:underline text-left truncate max-w-30"
                            title={repo.name}
                          >
                            {repo.name}
                          </button>
                          
                          <div className="flex items-center gap-0.5 text-[11px] text-[#555555] select-none">
                            <span className="material-symbols-outlined text-[13px] fill">star</span>
                            <span>{repo.commits * 10}</span>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#666666] leading-snug">
                          {repo.description}
                        </p>

                        <div className="flex items-center gap-xs text-[10px] text-[#555555]">
                          <span className="w-[8px] h-[8px] bg-black rounded-full" />
                          <span>Figma Design</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* GitHub-style Expandable Command Palette Search Modal */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex justify-center items-start pt-20 px-sm"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="bg-white border border-[#d5d5d5] rounded shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-125"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Input Box */}
            <div className="flex items-center gap-sm px-md py-sm border-b border-[#e5e5e5] bg-[#fafafa]">
              <span className="material-symbols-outlined text-[20px] text-[#555555]">search</span>
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search commits, files, or authors..."
                className="grow bg-transparent border-none text-[14px] text-black outline-none placeholder-[#999999]"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="border border-[#c5c5c5] hover:bg-[#fafafa] bg-white rounded px-1.5 py-0.5 text-[9px] font-mono text-[#666666] transition-colors cursor-pointer font-semibold shadow-none"
              >
                ESC
              </button>
            </div>

            {/* Results list panel */}
            <div className="overflow-y-auto grow divide-y divide-[#f0f0f0] bg-white max-h-100">
              {searchQuery === "" ? (
                <div className="p-md text-center text-[#888888] text-[12px] flex flex-col items-center gap-xs">
                  <span className="material-symbols-outlined text-[24px] opacity-40">keyboard_command_key</span>
                  <span>Search by commit message, design file name, or author email.</span>
                </div>
              ) : filteredCommits.length === 0 ? (
                <div className="p-md text-center text-[#888888] text-[12px]">
                  No commits or files match &quot;{searchQuery}&quot;
                </div>
              ) : (
                filteredCommits.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      handleCommitClick(c);
                      setIsSearchOpen(false);
                    }}
                    className="p-sm flex items-center justify-between hover:bg-[#fafafa] transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col gap-base truncate">
                      <span className="text-[13px] font-semibold text-black truncate max-w-112.5">
                        {c.message}
                      </span>
                      <div className="flex items-center gap-xs text-[11px] text-[#666666]">
                        <span className="font-mono bg-[#f0f0f0] px-sm py-0.5 rounded text-[10px] text-black">
                          {c.id.slice(0, 7)}
                        </span>
                        <span>in</span>
                        <span className="font-bold text-black">gitdesign/{c.file_key}</span>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#888888] font-mono pr-xs">{timeAgo(c.timestamp)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
