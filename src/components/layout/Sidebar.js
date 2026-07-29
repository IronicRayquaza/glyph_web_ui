"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  LayoutGrid,
  FolderOpen,
  GitBranch,
  GitPullRequest,
  History,
  BookOpen,
  Settings,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "Dashboard", Icon: LayoutGrid, href: "/dashboard", enabled: true },
  { id: "Repositories", Icon: FolderOpen, href: "/dashboard/repos", enabled: false },
  { id: "Branches", Icon: GitBranch, href: "/dashboard/branches", enabled: false },
  { id: "Pull Requests", Icon: GitPullRequest, href: "/dashboard/pulls", enabled: true },
  { id: "Activity", Icon: History, href: "/dashboard/activity", enabled: true },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [unreadPrCount, setUnreadPrCount] = useState(0);
  const [repoKeys, setRepoKeys] = useState([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: prs } = await supabase
          .from("dvc_pull_requests")
          .select("id")
          .in("status", ["open", "approved", "changes_requested"]);
        if (prs) setUnreadPrCount(prs.length);

        const { data: commits } = await supabase
          .from("dvc_commits")
          .select("frame_name, file_key");
        if (commits) {
          const keys = Array.from(new Set(commits.map((c) => c.frame_name || c.file_key).filter(Boolean)));
          setRepoKeys(keys);
        }
      } catch (e) {
        // silent fallback
      }
    }
    fetchData();
  }, [pathname]);

  return (
    <aside className="w-60 bg-white/70 backdrop-blur-lg border-r border-[#d5d5d5]/40 flex flex-col shrink-0 z-20 h-screen sticky top-0 font-sans">
      {/* Profile / App Branding Header */}
      <div className="p-4 border-b border-[#d5d5d5]/40 flex items-center gap-3">
        <div className="w-9 h-9 bg-white/80 border border-[#c5c5c5]/40 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
          <BookOpen className="w-5 h-5 text-black stroke-[2.2]" />
        </div>
        <div className="flex flex-col truncate">
          <span className="text-[13px] font-bold text-black tracking-tight leading-snug">GitDesign</span>
          <span className="text-[11px] text-[#777777] font-medium leading-none">Design Systems</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="grow py-3 flex flex-col justify-between overflow-y-auto custom-scrollbar">
        <div className="flex flex-col gap-0.5">
          {NAV_ITEMS.map((tab) => {
            const Icon = tab.Icon;
            let isSelected = false;
            if (tab.id === "Dashboard") {
              isSelected = pathname === "/dashboard" || pathname?.startsWith("/dashboard/commit");
            } else if (tab.id === "Pull Requests") {
              isSelected = pathname?.startsWith("/dashboard/pulls");
            } else if (tab.id === "Activity") {
              isSelected = pathname?.startsWith("/dashboard/activity");
            }

            if (!tab.enabled) return null;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-left transition-colors relative ${
                  isSelected
                    ? "bg-white/80 backdrop-blur-sm font-semibold text-black border-l-[3px] border-black"
                    : "text-[#555555] hover:bg-[#e2e2e2]/40 hover:text-black font-medium"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isSelected ? "text-black" : "text-[#666666]"}`} />
                <span className="truncate">{tab.id}</span>
                {tab.id === "Pull Requests" && unreadPrCount > 0 && (
                  <span className="ml-auto bg-black text-white text-[10px] font-semibold rounded-full h-5 w-5 flex items-center justify-center text-center shrink-0">
                    {unreadPrCount}
                  </span>
                )}
              </Link>
            );
          })}

          {/* DESIGN REPOSITORIES LIST */}
          <div className="mt-4 px-4 flex flex-col gap-1">
            <span className="text-[10px] font-semibold text-[#888] uppercase tracking-wider mb-1">
              Repositories
            </span>
            {repoKeys.map((key) => {
              const isSelected = pathname === `/dashboard/repos/${encodeURIComponent(key)}`;
              return (
                <Link
                  key={key}
                  href={`/dashboard/repos/${encodeURIComponent(key)}`}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                    isSelected
                      ? "bg-black text-white shadow-xs"
                      : "text-[#555] hover:bg-white/70 hover:text-black"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">gitdesign/{key}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-3 px-4 pb-4">
          <div
            className="w-full flex items-center gap-3 py-1.5 text-[13px] text-[#888888] opacity-50 cursor-not-allowed select-none"
            title="Coming soon"
          >
            <Settings className="w-4.5 h-4.5 shrink-0" />
            <span>Settings</span>
          </div>

          <button
            type="button"
            className="bg-white/80 border border-[#c5c5c5]/40 text-black text-[12px] font-bold py-2 text-center rounded-lg shadow-none hover:bg-white/95 transition-colors cursor-pointer w-full"
          >
            Upgrade Plan
          </button>
        </div>
      </nav>
    </aside>
  );
}
