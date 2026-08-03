"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, Plus, GitBranch, Star, LayoutGrid, ArrowRight } from "lucide-react";

export default function DesignRepositoriesGrid({ reposList = [], commits = [], onSelectFile }) {
  const router = useRouter();
  // Map latest snapshot image strictly for each repository frame / file name
  const latestSnapshotMap = {};
  commits.forEach((c) => {
    const key = c.frame_name || c.file_key;
    if (key && c.snapshot_url && !latestSnapshotMap[key]) {
      latestSnapshotMap[key] = c.snapshot_url;
    }
  });

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col justify-between h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-black" />
          <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
            Design Repositories
          </h2>
          <span className="text-[11px] font-semibold text-[#666666] bg-[#f0f0f0] px-2 py-0.5 rounded-full border border-[#e0e0e0]">
            {reposList.length} Files
          </span>
        </div>
        <Link
          href="/dashboard/pulls/new"
          className="text-[12px] font-bold text-black hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-black" />
          Import Design
        </Link>
      </div>

      {reposList.length === 0 ? (
        <div className="p-8 text-center text-[#888888] text-[13px] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
          No design repositories found yet. Connect your Figma file to push visual commits.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {reposList.map((repo) => {
            const snapshotUrl = latestSnapshotMap[repo.name];
            return (
              <div
                key={repo.name}
                onClick={() => router.push(`/dashboard/repos/${encodeURIComponent(repo.name)}`)}
                className="border border-[#e0e0e0]/60 hover:border-black rounded-xl overflow-hidden bg-white/60 hover:bg-white/90 backdrop-blur-md shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
              >
                {/* Thumbnail Preview Banner */}
                <div className="h-36 bg-[#f4f4f6] relative overflow-hidden flex items-center justify-center border-b border-[#eeeeee]">
                  {snapshotUrl ? (
                    <img
                      src={snapshotUrl}
                      alt={repo.name}
                      className="w-full h-full object-contain p-2 bg-[#f8f8f9]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-[#aaaaaa]">
                      <LayoutGrid className="w-8 h-8 opacity-40" />
                      <span className="text-[11px]">Figma Canvas Preview</span>
                    </div>
                  )}
                  <span className="absolute top-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                    <GitBranch className="w-3 h-3 text-white" />
                    main
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col gap-3 grow justify-between">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-semibold text-black group-hover:underline text-left truncate font-sans">
                        oleidian/{repo.name}
                      </span>
                      <div className="flex items-center gap-1 text-[11px] font-medium text-[#666666]">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span>{repo.stars || 0}</span>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#666666] leading-snug line-clamp-2">
                      {repo.description}
                    </p>
                  </div>

                  {/* Metadata Tags & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#f2f2f4]">
                    <div className="flex items-center gap-2 text-[11px] text-[#777777]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>{repo.commits} commits</span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/repos/${encodeURIComponent(repo.name)}`); }}
                      className="flex items-center gap-1 text-[11px] font-semibold text-black border border-[#c5c5c5] hover:bg-black hover:text-white px-2.5 py-1 rounded transition-colors cursor-pointer"
                    >
                      View Repo <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
