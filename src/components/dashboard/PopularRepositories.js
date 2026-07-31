"use client";

import { useRouter } from "next/navigation";

export default function PopularRepositories({ reposList = [], onSelectFile }) {
  const router = useRouter();

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/40 rounded-xl overflow-hidden flex flex-col shadow-xs z-10">
      <div className="border-b border-[#e5e5e5]/40 px-md py-sm">
        <h2 className="text-[13px] font-semibold text-black font-sans">Popular Repositories</h2>
      </div>

      <div className="p-md flex flex-col gap-md">
        {reposList.length === 0 ? (
          <div className="text-center text-[#888888] text-[12px] py-md">
            No design file repositories found.
          </div>
        ) : (
          reposList.slice(0, 3).map((repo) => (
            <div
              key={repo.name}
              className="flex flex-col gap-base border-b border-[#f5f5f5]/40 pb-sm last:border-b-0 last:pb-0"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => router.push(`/dashboard/repos/${encodeURIComponent(repo.name)}`)}
                  className="text-[13px] font-semibold text-black hover:underline text-left truncate max-w-30 cursor-pointer"
                  title={repo.name}
                >
                  {repo.name}
                </button>

                <div className="flex items-center gap-0.5 text-[11px] text-[#555555] select-none">
                  <span className="material-symbols-outlined text-[13px] fill">star</span>
                  <span>{repo.stars || 0}</span>
                </div>
              </div>

              <p className="text-[11px] text-[#666666] leading-snug">{repo.description}</p>

              <div className="flex items-center gap-xs text-[10px] text-[#555555]">
                <span className="w-[8px] h-[8px] bg-black rounded-full" />
                <span>Figma Design</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
