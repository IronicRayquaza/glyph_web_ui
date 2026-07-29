"use client";

import { useState, useMemo } from "react";
import {
  GitCommit,
  ArrowRight,
  Plus,
  Minus,
  Edit3,
  Image as ImageIcon,
  Layers,
  ChevronDown,
  ExternalLink,
  CheckCircle2
} from "lucide-react";

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

function computeLayerDiff(baseNodes = [], targetNodes = []) {
  const baseMap = {};
  const targetMap = {};

  baseNodes.forEach((n) => {
    if (n && n.id) baseMap[n.id] = n;
  });
  targetNodes.forEach((n) => {
    if (n && n.id) targetMap[n.id] = n;
  });

  const added = [];
  const removed = [];
  const modified = [];
  const unchanged = [];

  targetNodes.forEach((curr) => {
    const prev = baseMap[curr.id];
    if (!prev) {
      added.push(curr);
    } else if (prev.hash !== curr.hash) {
      modified.push(curr);
    } else {
      unchanged.push(curr);
    }
  });

  baseNodes.forEach((n) => {
    if (!targetMap[n.id]) removed.push(n);
  });

  return { added, removed, modified, unchanged };
}

export default function SideBySideDiffViewer({
  currentCommit,
  baseCommit,
  allCommits = [],
  onSelectBaseCommit,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const diff = useMemo(() => {
    return computeLayerDiff(baseCommit?.nodes || [], currentCommit?.nodes || []);
  }, [baseCommit, currentCommit]);

  const availableBaseCommits = useMemo(() => {
    return allCommits.filter((c) => c.id !== currentCommit?.id);
  }, [allCommits, currentCommit]);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Top Controls & Baseline Dropdown */}
      <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl px-5 py-3.5 shadow-xs flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <GitCommit className="w-4.5 h-4.5 text-black" />
          <span className="text-[13px] font-semibold text-black">
            Side-by-Side Commit Comparison
          </span>
        </div>

        {/* Base Commit Dropdown Selector */}
        <div className="relative flex items-center gap-2 text-[12px]">
          <span className="text-[#666] font-medium">Compare Baseline:</span>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="bg-white/80 hover:bg-white border border-[#e0e0e4] font-medium text-black px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="font-mono text-[11px] bg-[#f0f0f4] border border-[#e0e0e4] px-1.5 py-0.5 rounded text-black font-semibold">
                {baseCommit ? baseCommit.id.slice(0, 7) : "Initial"}
              </span>
              <span className="truncate max-w-[140px]">
                {baseCommit ? baseCommit.message : "Baseline Commit"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-[#777]" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-72 bg-white/95 backdrop-blur-xl border border-[#e5e5e5] rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto custom-scrollbar">
                <div className="px-3 py-1.5 text-[10px] font-semibold text-[#888] uppercase tracking-wider border-b border-[#f0f0f4]">
                  Select Baseline Commit
                </div>
                {availableBaseCommits.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-[#999] text-center">
                    No historical baseline commits
                  </div>
                ) : (
                  availableBaseCommits.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        if (onSelectBaseCommit) onSelectBaseCommit(c);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] hover:bg-[#f5f5f8] flex flex-col gap-0.5 transition-colors cursor-pointer ${
                        baseCommit?.id === c.id ? "bg-slate-50 font-semibold" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] bg-[#f0f0f4] px-1.5 py-0.5 rounded text-black">
                          {c.id.slice(0, 7)}
                        </span>
                        <span className="text-[10px] text-[#888]">{timeAgo(c.timestamp)}</span>
                      </div>
                      <span className="text-black truncate leading-snug font-medium">
                        {c.message}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column Split: Base Commit (Left) vs Current Commit (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: BASE / BEFORE COMMIT */}
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs flex flex-col h-[510px] max-h-[510px]">
          {/* Header */}
          <div className="p-3.5 border-b border-[#e5e5e5]/60 bg-red-50/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[13px] font-semibold text-black">
                BEFORE (Baseline)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#666]">
              <span className="font-mono bg-white border border-[#e0e0e4] px-1.5 py-0.5 rounded text-black font-semibold">
                {baseCommit ? baseCommit.id.slice(0, 7) : "baseline"}
              </span>
              <span>by {baseCommit?.author || "Initial"}</span>
            </div>
          </div>

          {/* Body content: Image preview + Removed/Modified Layer tree */}
          <div className="p-4 flex flex-col gap-3.5 grow overflow-y-auto custom-scrollbar">
            {/* Snapshot Thumbnail */}
            <div className="rounded-lg overflow-hidden border border-[#e0e0e4] bg-[#f4f4f6] relative h-44 shrink-0 flex items-center justify-center">
              {baseCommit?.snapshot_url ? (
                <img
                  src={baseCommit.snapshot_url}
                  alt="Base Commit Snapshot"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[#aaa] text-[11px]">
                  <ImageIcon className="w-6 h-6 opacity-40 text-black" />
                  <span>No baseline snapshot preview</span>
                </div>
              )}
            </div>

            {/* Base Commit Message */}
            <div className="text-[12px] font-medium text-black bg-white/60 p-2.5 rounded-lg border border-[#e5e5e5]/60">
              <span className="text-[#888] font-mono text-[11px] block">Commit Message:</span>
              <p className="truncate mt-0.5">{baseCommit?.message || "Initial baseline commit"}</p>
            </div>

            {/* Base Layer Hierarchy */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-[#666] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-black" />
                Baseline Layers ({baseCommit?.nodes?.length || 0})
              </span>
              <div className="flex flex-col gap-1">
                {baseCommit?.nodes?.length ? (
                  baseCommit.nodes.map((n) => {
                    const isRemoved = diff.removed.some((r) => r.id === n.id);
                    const isMod = diff.modified.some((m) => m.id === n.id);
                    return (
                      <div
                        key={n.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-[12px] border ${
                          isRemoved
                            ? "bg-red-50/80 border-red-200 text-red-900"
                            : isMod
                            ? "bg-amber-50/80 border-amber-200 text-amber-900"
                            : "bg-white/50 border-[#e8e8ed] text-black"
                        }`}
                      >
                        <span className="font-medium truncate max-w-[200px]">{n.name}</span>
                        {isRemoved && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                            Removed
                          </span>
                        )}
                        {isMod && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Modified
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[11px] text-[#999] p-3 text-center border border-dashed border-[#e0e0e4] rounded-lg">
                    No layers recorded in baseline
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CURRENT / AFTER COMMIT */}
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs flex flex-col h-[510px] max-h-[510px]">
          {/* Header */}
          <div className="p-3.5 border-b border-[#e5e5e5]/60 bg-emerald-50/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-[13px] font-semibold text-black">
                AFTER (Target)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-[#666]">
              <span className="font-mono bg-white border border-[#e0e0e4] px-1.5 py-0.5 rounded text-black font-semibold">
                {currentCommit ? currentCommit.id.slice(0, 7) : "head"}
              </span>
              <span>by {currentCommit?.author || "Designer"}</span>
            </div>
          </div>

          {/* Body content: Image preview + Added/Modified Layer tree */}
          <div className="p-4 flex flex-col gap-3.5 grow overflow-y-auto custom-scrollbar">
            {/* Snapshot Thumbnail */}
            <div className="rounded-lg overflow-hidden border border-[#e0e0e4] bg-[#f4f4f6] relative h-44 shrink-0 flex items-center justify-center">
              {currentCommit?.snapshot_url ? (
                <img
                  src={currentCommit.snapshot_url}
                  alt="Current Commit Snapshot"
                  className="w-full h-full object-contain p-1.5"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-[#aaa] text-[11px]">
                  <ImageIcon className="w-6 h-6 opacity-40 text-black" />
                  <span>No target snapshot preview</span>
                </div>
              )}
            </div>

            {/* Target Commit Message */}
            <div className="text-[12px] font-medium text-black bg-white/60 p-2.5 rounded-lg border border-[#e5e5e5]/60">
              <span className="text-[#888] font-mono text-[11px] block">Commit Message:</span>
              <p className="truncate mt-0.5">{currentCommit?.message || "Current target commit"}</p>
            </div>

            {/* Target Layer Hierarchy */}
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-[#666] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-black" />
                Target Layers ({currentCommit?.nodes?.length || 0})
              </span>
              <div className="flex flex-col gap-1">
                {currentCommit?.nodes?.length ? (
                  currentCommit.nodes.map((n) => {
                    const isAdded = diff.added.some((a) => a.id === n.id);
                    const isMod = diff.modified.some((m) => m.id === n.id);
                    return (
                      <div
                        key={n.id}
                        className={`flex items-center justify-between p-2 rounded-lg text-[12px] border ${
                          isAdded
                            ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                            : isMod
                            ? "bg-amber-50/80 border-amber-200 text-amber-900"
                            : "bg-white/50 border-[#e8e8ed] text-black"
                        }`}
                      >
                        <span className="font-medium truncate max-w-[200px]">{n.name}</span>
                        {isAdded && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">
                            Added
                          </span>
                        )}
                        {isMod && (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Modified
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-[11px] text-[#999] p-3 text-center border border-dashed border-[#e0e0e4] rounded-lg">
                    No layers recorded in target commit
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
