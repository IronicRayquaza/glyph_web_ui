"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const CHANGED_PROP_LABELS = {
  name: "Name", visible: "Visibility", opacity: "Opacity",
  x: "X", y: "Y", width: "Width", height: "Height",
  fills: "Fill", strokes: "Stroke", strokeWeight: "Stroke Weight",
  cornerRadius: "Corner Radius", effects: "Effects",
  layoutMode: "Layout Mode", itemSpacing: "Item Spacing",
  paddingLeft: "Padding L", paddingRight: "Padding R",
  paddingTop: "Padding T", paddingBottom: "Padding B",
  characters: "Text Content", fontSize: "Font Size", fontName: "Font",
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

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function flattenNodes(list, map = {}) {
  for (const n of list) {
    map[n.id] = n;
    if (n.children) flattenNodes(n.children, map);
  }
  return map;
}

function getChangedProps(prev, curr) {
  const props = Object.keys(CHANGED_PROP_LABELS);
  return props.filter(p => JSON.stringify(prev[p]) !== JSON.stringify(curr[p]));
}

function computeDiff(currentNodes, parentNodes) {
  const currentMap = flattenNodes(currentNodes);
  const parentMap = flattenNodes(parentNodes);
  const added = [], removed = [], modified = [], unchanged = [];

  Object.keys(currentMap).forEach(id => {
    const curr = currentMap[id];
    const prev = parentMap[id];
    if (!prev) {
      added.push(curr);
    } else if (prev.hash !== curr.hash) {
      modified.push({ ...curr, changedProps: getChangedProps(prev, curr) });
    } else {
      unchanged.push(curr);
    }
  });

  Object.keys(parentMap).forEach(id => {
    if (!currentMap[id]) removed.push(parentMap[id]);
  });

  return { added, removed, modified, unchanged };
}

// ─── Type icon ───────────────────────────────────────────────────────────────
function TypeBadge({ type }) {
  const MAP = {
    FRAME:     { label: "Frame",     color: "bg-blue-50 text-blue-600 border-blue-200" },
    COMPONENT: { label: "Component", color: "bg-purple-50 text-purple-600 border-purple-200" },
    INSTANCE:  { label: "Instance",  color: "bg-violet-50 text-violet-600 border-violet-200" },
    TEXT:      { label: "Text",      color: "bg-amber-50 text-amber-600 border-amber-200" },
    RECTANGLE: { label: "Rect",      color: "bg-gray-50 text-gray-500 border-gray-200" },
    ELLIPSE:   { label: "Ellipse",   color: "bg-gray-50 text-gray-500 border-gray-200" },
    GROUP:     { label: "Group",     color: "bg-gray-50 text-gray-500 border-gray-200" },
    VECTOR:    { label: "Vector",    color: "bg-pink-50 text-pink-500 border-pink-200" },
    SECTION:   { label: "Section",   color: "bg-teal-50 text-teal-600 border-teal-200" },
  };
  const style = MAP[type] || { label: type, color: "bg-gray-50 text-gray-400 border-gray-200" };
  return (
    <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded border ${style.color}`}>
      {style.label}
    </span>
  );
}

// ─── Diff Row ─────────────────────────────────────────────────────────────────
function DiffRow({ node, kind }) {
  const [expanded, setExpanded] = useState(false);
  const colors = {
    added:    { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", sig: "+", sigColor: "text-emerald-500", bar: "bg-emerald-400" },
    removed:  { bg: "bg-red-50",     border: "border-red-200",     text: "text-red-700",     sig: "−", sigColor: "text-red-400",     bar: "bg-red-400" },
    modified: { bg: "bg-amber-50",   border: "border-amber-200",   text: "text-amber-700",   sig: "~", sigColor: "text-amber-500",   bar: "bg-amber-400" },
  };
  const c = colors[kind];
  const hasProps = kind === "modified" && node.changedProps?.length > 0;

  return (
    <div className={`border ${c.border} ${c.bg} rounded-md overflow-hidden mb-1.5`}>
      <div
        className={`flex items-center gap-3 px-3 py-2 ${hasProps ? "cursor-pointer hover:bg-black/[0.02]" : ""}`}
        onClick={() => hasProps && setExpanded(!expanded)}
      >
        {/* Left color bar */}
        <div className={`w-[3px] self-stretch rounded-full ${c.bar} flex-shrink-0`} />
        {/* Sign */}
        <span className={`font-mono font-bold text-[14px] w-4 flex-shrink-0 ${c.sigColor}`}>{c.sig}</span>
        {/* Name */}
        <span className={`font-medium text-[12px] flex-grow truncate ${c.text}`}>{node.name}</span>
        {/* Type badge */}
        <TypeBadge type={node.type} />
        {/* Expand toggle */}
        {hasProps && (
          <span className={`material-symbols-outlined text-[14px] ${c.sigColor} flex-shrink-0 transition-transform ${expanded ? "rotate-180" : ""}`}>
            expand_more
          </span>
        )}
      </div>
      {/* Changed properties */}
      {expanded && hasProps && (
        <div className="px-4 pb-2.5 pt-1 border-t border-amber-100 flex flex-wrap gap-1.5">
          {node.changedProps.map(p => (
            <span key={p} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <span className="material-symbols-outlined text-[10px]">edit</span>
              {CHANGED_PROP_LABELS[p] || p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const commitId = params.id;

  const [user, setUser] = useState(null);
  const [commit, setCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(false);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUser(user);
      await loadCommit();
    }
    init();
  }, [commitId]);

  async function loadCommit() {
    setLoading(true);
    try {
      // Fetch the commit with full node data
      const { data: rows, error } = await supabase
        .from("dvc_commits")
        .select("*")
        .eq("id", commitId);
      if (error) throw error;
      const c = rows?.[0];
      if (!c) throw new Error("Commit not found");
      setCommit(c);

      // Fetch parent for diff
      let parentNodes = [];
      if (c.parent_id) {
        const { data: parentRows } = await supabase
          .from("dvc_commits")
          .select("nodes")
          .eq("id", c.parent_id);
        parentNodes = parentRows?.[0]?.nodes || [];
      }

      const currentNodes = c.nodes || [];
      setDiff(computeDiff(currentNodes, parentNodes));
    } catch (e) {
      console.error("Error loading commit:", e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans bg-[#f7f9ff]">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined animate-spin text-[28px] text-black">progress_activity</span>
          <span className="text-[13px] text-[#666]">Loading commit…</span>
        </div>
      </div>
    );
  }

  if (!commit) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans">
        <div className="text-center">
          <p className="text-[16px] font-semibold text-black">Commit not found</p>
          <Link href="/dashboard" className="text-[13px] text-[#666] hover:underline mt-2 block">← Back to dashboard</Link>
        </div>
      </div>
    );
  }

  const shortId = commit.id?.slice(0, 7);
  const totalChanges = diff ? diff.added.length + diff.removed.length + diff.modified.length : 0;
  const isFirstCommit = !commit.parent_id;

  return (
    <div className="text-black min-h-screen bg-transparent relative">

      {/* Background Video — same as dashboard */}
      <video
        autoPlay loop muted playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source src="/From%20Klickpin.com-%20Stylish%20Pinterest%20marketing%20ideas%20that%20feel%20fresh%20elevated%20and%20surprisingly%20easy%20to%20recreate%20at%20home%20for%20busy%20people%20who%20still.mp4" type="video/mp4" />
      </video>

      {/* ── Top Nav Bar ── */}
      <header className="bg-white/70 backdrop-blur-md border-b border-[#e5e5e5]/60 h-14 flex items-center justify-between px-8 sticky top-0 z-20">
        <div className="flex items-center gap-2 text-[13px]">
          <Link href="/dashboard" className="font-bold text-black hover:opacity-70 transition-opacity">GitDesign</Link>
          <span className="text-[#c5c5c5]">/</span>
          <Link href="/dashboard" className="text-[#555] hover:text-black transition-colors">Activity</Link>
          <span className="text-[#c5c5c5]">/</span>
          <span className="font-mono text-[12px] bg-[#f0f0f0] border border-[#e0e0e0] px-2 py-0.5 rounded text-black">{shortId}</span>
        </div>
        <button
          onClick={() => { supabase.auth.signOut(); router.push("/login"); }}
          className="w-8 h-8 rounded-full border border-[#c5c5c5]/40 flex items-center justify-center text-[12px] font-bold bg-white hover:bg-black hover:text-white transition-colors cursor-pointer"
        >
          {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
        </button>
      </header>

      <main className="max-w-5xl mx-auto px-8 py-8 flex flex-col gap-6 relative z-10">

        {/* ── Commit Header Card ── */}
        <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden shadow-sm">
          {/* Title bar */}
          <div className="px-6 py-5 border-b border-[#f0f0f0]">
            <h1 className="text-[20px] font-bold text-black leading-tight mb-3">{commit.message}</h1>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Author */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  {(commit.author || "U").slice(0, 1).toUpperCase()}
                </div>
                <span className="text-[13px] font-semibold text-black">{commit.author || "Unknown"}</span>
              </div>
              <span className="text-[#ccc]">·</span>
              <span className="text-[12px] text-[#777]">{formatDate(commit.timestamp)}</span>
              <span className="text-[#ccc]">·</span>
              <span className="text-[12px] text-[#777]">{timeAgo(commit.timestamp)}</span>
            </div>
          </div>

          {/* Meta strip */}
          <div className="px-6 py-3 bg-[#fafafa]/80 flex items-center gap-4 flex-wrap text-[11px]">
            <div className="flex items-center gap-1.5 text-[#555]">
              <span className="material-symbols-outlined text-[14px]">folder_open</span>
              <span className="font-mono font-medium text-black">{commit.file_key}</span>
            </div>
            <span className="text-[#ddd]">|</span>
            <div className="flex items-center gap-1.5 text-[#555]">
              <span className="material-symbols-outlined text-[14px]">dashboard</span>
              <span className="font-medium text-black">{commit.page_name}</span>
              {commit.frame_name && (
                <><span className="text-[#ccc]">›</span><span className="font-medium text-black">{commit.frame_name}</span></>
              )}
            </div>
            <span className="text-[#ddd]">|</span>
            <div className="flex items-center gap-1.5 text-[#555]">
              <span className="material-symbols-outlined text-[14px]">account_tree</span>
              <span>{commit.node_count} nodes</span>
            </div>
            <span className="text-[#ddd]">|</span>
            {/* Commit SHA */}
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[14px] text-[#888]">commit</span>
              <code className="font-mono text-[11px] bg-[#f0f0f0] border border-[#e5e5e5] px-2 py-0.5 rounded text-black">{commit.id?.slice(0, 12)}</code>
            </div>
            {/* Parent link */}
            {commit.parent_id && (
              <>
                <span className="text-[#ddd]">|</span>
                <Link
                  href={`/dashboard/commit/${commit.parent_id}`}
                  className="flex items-center gap-1 text-[#555] hover:text-black transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_back</span>
                  <code className="font-mono text-[11px] hover:underline">{commit.parent_id?.slice(0, 7)}</code>
                  <span className="text-[#888]">parent</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* ── Two-column layout: Snapshot + Diff ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

          {/* ── LEFT: Snapshot ── */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl overflow-hidden shadow-sm sticky top-20">
              <div className="px-4 py-3 border-b border-[#f0f0f0] flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#555]">image</span>
                <span className="text-[13px] font-semibold text-black">Design Snapshot</span>
                {commit.snapshot_url && (
                  <span className="ml-auto text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-600 font-semibold px-2 py-0.5 rounded-full">
                    Captured
                  </span>
                )}
              </div>

              <div className="p-4">
                {commit.snapshot_url && !snapshotError ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-lg overflow-hidden border border-[#e5e5e5] bg-[#f8f8f8]" style={{ aspectRatio: "4/3" }}>
                      <img
                        src={commit.snapshot_url}
                        alt={`Snapshot — ${commit.frame_name}`}
                        className="w-full h-full object-contain"
                        onError={() => setSnapshotError(true)}
                      />
                    </div>
                    <a
                      href={commit.snapshot_url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-1.5 text-[11px] text-[#555] hover:text-black transition-colors border border-[#e5e5e5] rounded-lg py-2 hover:bg-[#f5f5f5]"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      Open full image
                    </a>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#bbb]">
                    <span className="material-symbols-outlined text-[36px] opacity-40">image_not_supported</span>
                    <p className="text-[11px] text-center leading-relaxed">
                      {snapshotError
                        ? "Failed to load snapshot image."
                        : "No snapshot captured for this commit.\nMake a new commit to see visual snapshots."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Diff ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* Summary chips */}
            {diff && (
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl px-5 py-4 shadow-sm flex items-center gap-3 flex-wrap">
                <span className="text-[12px] font-semibold text-[#555]">
                  {isFirstCommit ? "Initial commit —" : totalChanges === 0 ? "No changes vs. parent" : `${totalChanges} layer${totalChanges !== 1 ? "s" : ""} changed`}
                </span>
                <div className="flex items-center gap-2 ml-auto flex-wrap">
                  {diff.added.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <span>+{diff.added.length}</span>
                      <span className="font-normal">added</span>
                    </span>
                  )}
                  {diff.removed.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                      <span>−{diff.removed.length}</span>
                      <span className="font-normal">removed</span>
                    </span>
                  )}
                  {diff.modified.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <span>~{diff.modified.length}</span>
                      <span className="font-normal">modified</span>
                    </span>
                  )}
                  {diff.unchanged.length > 0 && (
                    <span className="text-[11px] text-[#999] bg-[#f5f5f5] border border-[#e5e5e5] px-2.5 py-1 rounded-full">
                      {diff.unchanged.length} unchanged
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Diff Sections */}
            {diff && (
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center gap-2.5">
                  {/* Clean diff icon — two color bars */}
                  <div className="flex flex-col gap-[3px] flex-shrink-0">
                    <div className="w-3.5 h-[3px] rounded-full bg-emerald-500" />
                    <div className="w-3.5 h-[3px] rounded-full bg-red-400" />
                  </div>
                  <span className="text-[13px] font-semibold text-black">Layer changes</span>
                  {isFirstCommit && (
                    <span className="ml-2 text-[10px] bg-[#f0f0f0] border border-[#e5e5e5] text-[#888] px-2 py-0.5 rounded-full">
                      Initial commit — no parent to diff against
                    </span>
                  )}
                </div>

                <div className="p-5 flex flex-col gap-5">
                  {/* Added */}
                  {diff.added.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                        <span className="text-[11px] font-semibold text-[#555]">Added ({diff.added.length})</span>
                      </div>
                      {diff.added.map(n => <DiffRow key={n.id} node={n} kind="added" />)}
                    </div>
                  )}

                  {/* Removed */}
                  {diff.removed.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <span className="text-[11px] font-semibold text-[#555]">Removed ({diff.removed.length})</span>
                      </div>
                      {diff.removed.map(n => <DiffRow key={n.id} node={n} kind="removed" />)}
                    </div>
                  )}

                  {/* Modified */}
                  {diff.modified.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="text-[11px] font-semibold text-[#555]">Modified ({diff.modified.length}) — click to expand</span>
                      </div>
                      {diff.modified.map(n => <DiffRow key={n.id} node={n} kind="modified" />)}
                    </div>
                  )}

                  {/* Empty state */}
                  {!isFirstCommit && totalChanges === 0 && (
                    <div className="flex flex-col items-center py-8 gap-2 text-[#bbb]">
                      <span className="material-symbols-outlined text-[32px] opacity-40">check_circle</span>
                      <p className="text-[12px] text-[#888]">No layer changes compared to the parent commit.</p>
                    </div>
                  )}

                  {isFirstCommit && (
                    <div className="flex flex-col items-center py-8 gap-2">
                      <span className="material-symbols-outlined text-[32px] text-emerald-400">add_circle</span>
                      <p className="text-[12px] text-[#555] text-center">
                        This is the first commit on this frame.<br/>
                        All <strong className="text-black">{diff.added.length}</strong> layers were added in this commit.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
