"use client";

import { useEffect, useState } from "react";
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
  const [selectedCommit, setSelectedCommit] = useState(null);
  const [diffData, setDiffData] = useState(null);
  const [loadingDiff, setLoadingDiff] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
      }
    }
    checkUser();
  }, [router]);

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

  // Load detailed diff for visual popup or details section
  async function handleCommitClick(commit) {
    if (selectedCommit?.id === commit.id) {
      setSelectedCommit(null);
      setDiffData(null);
      return;
    }
    setSelectedCommit(commit);
    setLoadingDiff(true);
    setDiffData(null);

    try {
      const { data: currentRows, error: err1 } = await supabase
        .from("dvc_commits")
        .select("nodes")
        .eq("id", commit.id);
      if (err1) throw err1;

      const currentNodes = (currentRows && currentRows[0]?.nodes) || [];
      const currentMap = flattenNodes(currentNodes);

      let parentMap = {};
      if (commit.parent_id) {
        const { data: parentRows, error: err2 } = await supabase
          .from("dvc_commits")
          .select("nodes")
          .eq("id", commit.parent_id);
        if (!err2 && parentRows && parentRows[0]) {
          parentMap = flattenNodes(parentRows[0].nodes || []);
        }
      }

      const added = [];
      const removed = [];
      const modified = [];

      Object.keys(currentMap).forEach((id) => {
        const curr = currentMap[id];
        const prev = parentMap[id];
        if (!prev) {
          added.push(curr);
        } else if (prev.hash !== curr.hash) {
          modified.push({
            ...curr,
            changedProps: getChangedProps(prev, curr),
          });
        }
      });

      Object.keys(parentMap).forEach((id) => {
        if (!currentMap[id]) {
          removed.push(parentMap[id]);
        }
      });

      setDiffData({ added, removed, modified });
    } catch (e) {
      console.error("Diff load error:", e);
    } finally {
      setLoadingDiff(false);
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
    const list = [];
    const props = ["name", "visible", "opacity", "x", "y", "width", "height", "fills", "strokes", "strokeWeight", "cornerRadius", "effects", "layoutMode", "itemSpacing", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "characters", "fontSize", "fontName"];
    props.forEach((p) => {
      if (JSON.stringify(prev[p]) !== JSON.stringify(curr[p])) {
        list.push(p);
      }
    });
    return list;
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
      <aside className="w-[240px] bg-white/70 backdrop-blur-lg border-r border-[#d5d5d5]/40 flex flex-col flex-shrink-0 z-10">
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
        <nav className="flex-grow py-sm flex flex-col justify-between">
          <div className="flex flex-col">
            {[
              { id: "Dashboard", icon: "grid_view" },
              { id: "Repositories", icon: "folder_open" },
              { id: "Branches", icon: "call_split" },
              { id: "Pull Requests", icon: "merge_type" },
              { id: "Activity", icon: "history" }
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-sm px-md py-[10px] text-[13px] text-left transition-colors relative cursor-pointer ${
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
      <div className="flex-grow flex flex-col min-w-0 z-10">
        
        {/* Top Header Bar */}
        <header className="bg-white/70 backdrop-blur-lg border-b border-[#e5e5e5]/40 h-16 flex justify-between items-center px-margin">
          <div className="flex items-center gap-xl flex-grow max-w-4xl">
            <Link href="/" className="text-[18px] font-bold font-sans tracking-tight text-black select-none">
              GitDesign
            </Link>

            {/* Small GitHub-style Search Trigger Button */}
            <div 
              onClick={() => setIsSearchOpen(true)}
              className="relative w-[240px] bg-white/60 hover:bg-white/80 border border-[#d5d5d5]/30 rounded px-sm py-[6px] flex items-center justify-between text-[12px] text-[#666666] cursor-pointer select-none transition-colors"
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
            <button className="text-[#555555] hover:text-black p-xs rounded cursor-pointer transition-colors relative">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-[6px] right-[6px] w-[6px] h-[6px] bg-black rounded-full" />
            </button>
            <button className="text-[#555555] hover:text-black p-xs rounded cursor-pointer transition-colors">
              <span className="material-symbols-outlined text-[20px]">help</span>
            </button>
            <button className="bg-black text-white hover:bg-black/90 font-medium text-[12px] px-sm py-[6px] rounded transition-colors cursor-pointer">
              New
            </button>
            
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
        <main className="flex-grow p-margin overflow-y-auto max-w-6xl w-full mx-auto">
          {/* Header Title Section */}
          <div className="flex justify-between items-start mb-sm">
            <div className="flex flex-col gap-[2px]">
              <h1 className="text-[26px] font-sans tracking-tight text-black font-bold">
                Contribution Activity
              </h1>
              <p className="text-[13px] text-[#666666]">
                Track your design system commits, merges, and overall impact.
              </p>
            </div>
            
            {/* Select timeframe calendar dropdown */}
            <button className="bg-white/80 backdrop-blur-sm border border-[#c5c5c5]/40 text-black text-[12px] font-bold px-sm py-[6px] rounded flex items-center gap-xs hover:bg-white/95 transition-colors cursor-pointer">
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
                <div className="flex gap-[3px] items-start overflow-x-auto py-xs scrollbar-thin">
                  <div className="flex flex-col gap-[3px] text-[9px] text-[#888888] select-none pr-xs h-[103px] justify-between text-right font-medium">
                    <span>Sun</span>
                    <span>Wed</span>
                    <span>Sat</span>
                  </div>
                  <div className="flex gap-[3px] items-start">
                    {cols.map((col, cIdx) => (
                      <div key={cIdx} className="flex flex-col gap-[3px]">
                        {col.map((cell) => {
                          let colorClass = "bg-[#f0f0f0] border border-[#e8e8e8]";
                          if (cell.count === 1) colorClass = "bg-[#c8c8c8] border border-[#bebebe]";
                          else if (cell.count === 2) colorClass = "bg-[#8c8c8c] border border-[#808080]";
                          else if (cell.count === 3) colorClass = "bg-[#4c4c4c] border border-[#404040]";
                          else if (cell.count > 3) colorClass = "bg-[#000000] border border-[#000000]";
                          return (
                            <div
                              key={cell.key}
                              className={`w-[11px] h-[11px] rounded-[1px] ${colorClass} hover:ring-1 hover:ring-black cursor-default`}
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
                  <div className="flex items-center gap-[4px] select-none">
                    <span>Less</span>
                    <div className="w-[11px] h-[11px] bg-[#f0f0f0] border border-[#e8e8e8] rounded-[1px]" />
                    <div className="w-[11px] h-[11px] bg-[#c8c8c8] border border-[#bebebe] rounded-[1px]" />
                    <div className="w-[11px] h-[11px] bg-[#8c8c8c] border border-[#808080] rounded-[1px]" />
                    <div className="w-[11px] h-[11px] bg-[#4c4c4c] border border-[#404040] rounded-[1px]" />
                    <div className="w-[11px] h-[11px] bg-[#000000] border border-black rounded-[1px]" />
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
                      const isExpanded = selectedCommit?.id === c.id;
                      return (
                        <div key={c.id} className="flex flex-col">
                          <div 
                            onClick={() => handleCommitClick(c)}
                            className="p-md flex items-start gap-md hover:bg-white/65 transition-colors cursor-pointer"
                          >
                            {/* Visual status icon on left */}
                            <div className="pt-base flex-shrink-0 select-none">
                              {c.node_count > 10 ? (
                                <span className="material-symbols-outlined text-[18px] text-black">check_circle</span>
                              ) : c.node_count === 0 ? (
                                <span className="material-symbols-outlined text-[18px] text-[#999999]">remove_circle</span>
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-[#444444]">adjust</span>
                              )}
                            </div>
                            
                            {/* Commit metadata details */}
                            <div className="flex flex-col gap-base flex-grow">
                              <p className="text-[13px] font-medium text-black leading-tight">
                                {c.message}
                              </p>
                              <div className="flex items-center gap-xs text-[11px] text-[#666666] flex-wrap">
                                <span className="bg-white/60 border border-[#e0e0e0]/40 font-mono px-sm py-[2px] rounded text-[10px] text-black">
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
                              </div>
                            </div>
                          </div>

                          {/* Expandable commits diff details */}
                          {isExpanded && (
                            <div className="bg-[#fafafa]/50 border-t border-[#e5e5e5]/40 p-md flex flex-col gap-sm">
                              <h3 className="text-[11px] font-bold text-[#555555] uppercase tracking-wider">
                                Diff Analysis ({c.frame_name} on {c.page_name})
                              </h3>
                              {loadingDiff ? (
                                <div className="py-sm flex items-center gap-xs text-[#666666] text-[12px]">
                                  <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                                  Analyzing snapshot files...
                                </div>
                              ) : diffData ? (
                                <div className="flex flex-col gap-sm">
                                  {/* Added list */}
                                  {diffData.added.length > 0 && (
                                    <div className="flex flex-col gap-xs">
                                      <span className="text-[10px] font-bold text-green-700">Added Layers:</span>
                                      <div className="flex flex-col gap-[2px] pl-sm border-l border-green-300">
                                        {diffData.added.map(node => (
                                          <div key={node.id} className="text-[11px] text-black font-mono">
                                            + {node.name} <span className="text-[#888888] text-[9px]">({node.type})</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Removed list */}
                                  {diffData.removed.length > 0 && (
                                    <div className="flex flex-col gap-xs">
                                      <span className="text-[10px] font-bold text-red-700">Removed Layers:</span>
                                      <div className="flex flex-col gap-[2px] pl-sm border-l border-red-300">
                                        {diffData.removed.map(node => (
                                          <div key={node.id} className="text-[11px] text-[#666666] font-mono line-through">
                                            - {node.name} <span className="text-[#888888] text-[9px]">({node.type})</span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Modified list */}
                                  {diffData.modified.length > 0 && (
                                    <div className="flex flex-col gap-xs">
                                      <span className="text-[10px] font-bold text-yellow-700">Modified Layers:</span>
                                      <div className="flex flex-col gap-[2px] pl-sm border-l border-yellow-300">
                                        {diffData.modified.map(node => (
                                          <div key={node.id} className="text-[11px] text-black font-mono flex flex-col gap-[2px]">
                                            <div>~ {node.name} <span className="text-[#888888] text-[9px]">({node.type})</span></div>
                                            {node.changedProps && node.changedProps.length > 0 && (
                                              <div className="text-[9px] text-[#666666] pl-sm">
                                                Modified: {node.changedProps.join(", ")}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {diffData.added.length === 0 && diffData.removed.length === 0 && diffData.modified.length === 0 && (
                                    <div className="text-[11px] text-[#666666] italic">
                                      No layer properties changed compared to previous version.
                                    </div>
                                  )}
                                </div>
                              ) : null}
                            </div>
                          )}
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
                    <span className="text-[12px] text-[#555555]">Pull Requests</span>
                    <span className="text-[16px] font-bold font-sans text-black">
                      {Math.floor(commits.length * 0.1) + 2}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
                    <span className="text-[12px] text-[#555555]">Issues Resolved</span>
                    <span className="text-[16px] font-bold font-sans text-black">
                      {commits.filter(c => c.node_count > 10).length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#555555]">Followers</span>
                    <span className="text-[16px] font-bold font-sans text-black">
                      {4892 + commits.length}
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
                            className="text-[13px] font-bold text-black hover:underline text-left truncate max-w-[120px]"
                            title={repo.name}
                          >
                            {repo.name}
                          </button>
                          
                          <div className="flex items-center gap-[2px] text-[11px] text-[#555555] select-none">
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
            className="bg-white border border-[#d5d5d5] rounded shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-[500px]"
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
                className="flex-grow bg-transparent border-none text-[14px] text-black outline-none placeholder-[#999999]"
              />
              <button 
                onClick={() => setIsSearchOpen(false)}
                className="border border-[#c5c5c5] hover:bg-[#fafafa] bg-white rounded px-[6px] py-[2px] text-[9px] font-mono text-[#666666] transition-colors cursor-pointer font-semibold shadow-none"
              >
                ESC
              </button>
            </div>

            {/* Results list panel */}
            <div className="overflow-y-auto flex-grow divide-y divide-[#f0f0f0] bg-white max-h-[400px]">
              {searchQuery === "" ? (
                <div className="p-md text-center text-[#888888] text-[12px] flex flex-col items-center gap-xs">
                  <span className="material-symbols-outlined text-[24px] opacity-40">keyboard_command_key</span>
                  <span>Search by commit message, design file name, or author email.</span>
                </div>
              ) : filteredCommits.length === 0 ? (
                <div className="p-md text-center text-[#888888] text-[12px]">
                  No commits or files match "{searchQuery}"
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
                      <span className="text-[13px] font-semibold text-black truncate max-w-[450px]">
                        {c.message}
                      </span>
                      <div className="flex items-center gap-xs text-[11px] text-[#666666]">
                        <span className="font-mono bg-[#f0f0f0] px-sm py-[2px] rounded text-[10px] text-black">
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
