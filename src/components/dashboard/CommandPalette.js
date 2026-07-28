"use client";

import { useRouter } from "next/navigation";
import { Search, Command } from "lucide-react";

export default function CommandPalette({
  isOpen,
  onClose,
  searchQuery,
  setSearchQuery,
  filteredCommits = [],
  timeAgo,
}) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleCommitClick = (commit) => {
    onClose();
    router.push(`/dashboard/commit/${commit.id}`);
  };

  return (
    <div
      className="fixed inset-0 bg-black/35 backdrop-blur-[1px] z-50 flex justify-center items-start pt-20 px-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#d5d5d5] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col overflow-hidden max-h-125"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Input Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#e5e5e5] bg-[#fafafa]">
          <Search className="w-5 h-5 text-[#555555]" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search commits, files, or authors..."
            className="grow bg-transparent border-none text-[14px] text-black outline-none placeholder-[#999999]"
          />
          <button
            type="button"
            onClick={onClose}
            className="border border-[#c5c5c5] hover:bg-[#fafafa] bg-white rounded px-2 py-0.5 text-[9px] font-mono text-[#666666] transition-colors cursor-pointer font-semibold shadow-none"
          >
            ESC
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto grow divide-y divide-[#f0f0f0] bg-white max-h-100">
          {searchQuery === "" ? (
            <div className="p-6 text-center text-[#888888] text-[12px] flex flex-col items-center gap-2">
              <Command className="w-6 h-6 opacity-40" />
              <span>Search by commit message, design file name, or author email.</span>
            </div>
          ) : filteredCommits.length === 0 ? (
            <div className="p-6 text-center text-[#888888] text-[12px]">
              No commits or files match &quot;{searchQuery}&quot;
            </div>
          ) : (
            filteredCommits.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCommitClick(c)}
                className="p-3.5 flex items-center justify-between hover:bg-[#fafafa] transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-1 truncate">
                  <span className="text-[13px] font-semibold text-black truncate max-w-md">
                    {c.message}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-[#666666]">
                    <span className="font-mono bg-[#f0f0f0] px-1.5 py-0.5 rounded text-[10px] text-black font-semibold">
                      {c.id.slice(0, 7)}
                    </span>
                    <span>in</span>
                    <span className="font-bold text-black">gitdesign/{c.file_key}</span>
                  </div>
                </div>
                <span className="text-[11px] text-[#888888] font-mono pr-2">{timeAgo(c.timestamp)}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
