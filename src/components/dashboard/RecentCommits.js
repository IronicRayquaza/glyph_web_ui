"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, ArrowRight, CheckCircle2, MinusCircle, CircleDot, ChevronRight } from "lucide-react";

export default function RecentCommits({ filteredCommits = [], onSelectFile, timeAgo, limit = 4 }) {
  const router = useRouter();
  const displayedCommits = filteredCommits.slice(0, limit);

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-6 shadow-xs flex flex-col justify-between h-full gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-black" />
          <h2 className="text-[15px] font-semibold text-black font-sans tracking-tight">
            Recent Visual Commits
          </h2>
          <span className="text-[11px] font-medium text-[#666666] bg-[#f0f0f0] px-2 py-0.5 rounded-full border border-[#e0e0e0]">
            {filteredCommits.length}
          </span>
        </div>

        <Link
          href="/dashboard/activity"
          className="text-[12px] font-medium text-black hover:underline cursor-pointer flex items-center gap-1"
        >
          View All Activity
          <ArrowRight className="w-3.5 h-3.5 text-black" />
        </Link>
      </div>

      <div className="flex flex-col divide-y divide-[#f0f0f0]">
        {displayedCommits.length === 0 ? (
          <div className="p-8 text-center text-[#888888] text-[13px] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
            No recent visual commits found matching your search or file filter.
          </div>
        ) : (
          displayedCommits.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/commit/${c.id}`)}
              className="py-3.5 flex items-center justify-between hover:bg-white/70 px-3 rounded-lg transition-colors cursor-pointer group"
            >
              {/* Left Side: Status Icon & Details */}
              <div className="flex items-start gap-3.5 min-w-0 grow">
                <div className="pt-0.5 shrink-0 select-none">
                  {c.node_count > 10 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : c.node_count === 0 ? (
                    <MinusCircle className="w-5 h-5 text-[#aaaaaa]" />
                  ) : (
                    <CircleDot className="w-5 h-5 text-black" />
                  )}
                </div>

                <div className="flex flex-col gap-1 min-w-0 grow">
                  <div className="flex items-center gap-2">
                    <p className="text-[13px] font-medium text-black group-hover:underline truncate leading-snug">
                      {c.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-[#666666] flex-wrap">
                    <span className="font-mono text-[10px] bg-white/80 border border-[#e0e0e0] px-1.5 py-0.5 rounded text-black font-semibold">
                      {c.id.slice(0, 7)}
                    </span>
                    <span>in</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/repos/${encodeURIComponent(c.frame_name || c.file_key)}`);
                      }}
                      className="font-medium text-black hover:underline"
                    >
                      oleidian/{c.frame_name || c.file_key}
                    </button>
                    <span>&middot;</span>
                    <span>{timeAgo(c.timestamp)}</span>
                    <span className="text-[#999999]">&middot; {c.author}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: Snapshot thumbnail & Arrow */}
              <div className="flex items-center gap-3 shrink-0 ml-4">
                {c.snapshot_url && (
                  <div className="w-16 h-11 rounded-md overflow-hidden border border-[#e0e0e0] bg-[#f5f5f7] shadow-xs">
                    <img
                      src={c.snapshot_url}
                      alt="Commit Snapshot"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <ChevronRight className="w-4.5 h-4.5 text-[#999999] group-hover:text-black group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>
          ))
        )}
      </div>

      {filteredCommits.length > limit && (
        <div className="pt-2 text-center border-t border-[#f0f0f0]">
          <Link
            href="/dashboard/activity"
            className="text-[12px] font-bold text-[#666666] hover:text-black hover:underline cursor-pointer flex items-center justify-center gap-1"
          >
            Show all {filteredCommits.length} activity events in Activity Stream →
          </Link>
        </div>
      )}
    </div>
  );
}
