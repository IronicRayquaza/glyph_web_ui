"use client";

import { FolderGit2, GitPullRequest, History, Users } from "lucide-react";

export default function MetricKpiCards({ commits = [], reposList = [], openPullsCount = 0 }) {
  const uniqueContributorsCount = [...new Set(commits.map((c) => c.author))].filter(Boolean).length || 1;
  const totalSnapshotsCount = commits.filter(c => c.snapshot_url).length;

  const metrics = [
    {
      title: "Design Repositories",
      value: reposList.length || 1,
      unit: reposList.length === 1 ? "File Library" : "File Libraries",
      subtext: "Figma design systems & UI kits",
      Icon: FolderGit2,
      badge: "Active",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    {
      title: "Open Pull Requests",
      value: openPullsCount,
      unit: openPullsCount === 1 ? "PR in Review" : "PRs in Review",
      subtext: "Pending design approvals & merges",
      Icon: GitPullRequest,
      badge: openPullsCount > 0 ? "Action Required" : "Up to Date",
      badgeColor: openPullsCount > 0 ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      title: "Visual Commits",
      value: commits.length,
      unit: "Total Snapshots",
      subtext: `${totalSnapshotsCount} snapshot previews captured`,
      Icon: History,
      badge: "Synced",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
    },
    {
      title: "Active Contributors",
      value: uniqueContributorsCount,
      unit: uniqueContributorsCount === 1 ? "Design Lead" : "Designers",
      subtext: "Pushing design iterations",
      Icon: Users,
      badge: "Team",
      badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {metrics.map((item, idx) => {
        const Icon = item.Icon;
        return (
          <div
            key={idx}
            className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 hover:border-[#c5c5c5] rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-3 group"
          >
            <div className="flex items-start justify-between">
              <div className="flex flex-col">
                <span className="text-[12px] font-medium text-[#666666]">{item.title}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-[28px] font-bold text-black font-sans leading-none tracking-tight">
                    {item.value}
                  </span>
                  <span className="text-[12px] text-[#777777] font-medium">{item.unit}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[#f5f5f7] group-hover:bg-black group-hover:text-white transition-colors flex items-center justify-center text-black shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0]">
              <span className="text-[11px] text-[#888888] truncate">{item.subtext}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${item.badgeColor}`}>
                {item.badge}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
