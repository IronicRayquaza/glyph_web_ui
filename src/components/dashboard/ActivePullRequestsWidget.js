"use client";

import Link from "next/link";
import { GitPullRequest, ArrowRight, GitMerge, ChevronRight } from "lucide-react";

const STATUS_BADGES = {
  open: { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", label: "Open" },
  approved: { bg: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500", label: "Approved" },
  changes_requested: { bg: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Changes Requested" },
  merged: { bg: "bg-purple-50 text-purple-700 border-purple-200", dot: "bg-purple-500", label: "Merged" },
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

export default function ActivePullRequestsWidget({ pullRequests = [] }) {
  const activePulls = pullRequests.filter((pr) =>
    ["open", "approved", "changes_requested"].includes(pr.status)
  );

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col justify-between h-full gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitPullRequest className="w-5 h-5 text-black" />
            <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
              Design Pull Requests
            </h2>
            {activePulls.length > 0 && (
              <span className="bg-black text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                {activePulls.length} Active
              </span>
            )}
          </div>
          <Link
            href="/dashboard/pulls"
            className="text-[12px] font-bold text-black hover:underline flex items-center gap-1"
          >
            View All PRs
            <ArrowRight className="w-3.5 h-3.5 text-black" />
          </Link>
        </div>

        {pullRequests.length === 0 ? (
          <div className="p-6 text-center text-[#888888] text-[12px] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
            No active pull requests. Create a new PR to propose design component updates.
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#f0f0f0]">
            {pullRequests.slice(0, 4).map((pr) => {
              const badge = STATUS_BADGES[pr.status] || STATUS_BADGES.open;
              return (
                <Link
                  key={pr.id}
                  href={`/dashboard/pulls/${pr.id.slice(0, 6)}`}
                  className="py-3.5 flex items-center justify-between hover:bg-white/90 px-2 rounded-lg transition-colors group cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-[#f2f4f8] border border-[#e0e0e0] flex items-center justify-center text-black shrink-0 mt-0.5 group-hover:bg-black group-hover:text-white transition-colors">
                      <GitMerge className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-black group-hover:underline truncate">
                          {pr.title}
                        </span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border border-opacity-60 flex items-center gap-1 shrink-0 ${badge.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#777777] flex-wrap">
                        <span className="font-mono bg-[#f4f4f6] px-1.5 py-0.5 rounded text-[10px] text-black border border-[#e0e0e0]">
                          #{pr.id?.toString().slice(0, 6)}
                        </span>
                        <span>
                          <span className="font-medium text-black">{pr.source_branch || "feature"}</span>
                          <span className="mx-1 text-[#bbb]">→</span>
                          <span className="font-medium text-black">{pr.target_branch || "main"}</span>
                        </span>
                        <span>&middot;</span>
                        <span>opened {timeAgo(pr.created_at)} by {pr.author || "designer"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[#888888] group-hover:text-black shrink-0">
                    <span className="text-[11px] font-semibold">Review</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#f0f0f0] flex items-center justify-between text-[11px] text-[#777777]">
        <span>Propose visual component updates</span>
        <Link href="/dashboard/pulls/new" className="font-bold text-black hover:underline">
          + Create PR
        </Link>
      </div>
    </div>
  );
}
