"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Header from "@/components/layout/Header";
import {
  GitCommit,
  GitBranch,
  FolderGit2,
  Clock,
  User,
  Copy,
  ExternalLink,
  CheckCircle2,
  MinusCircle,
  CircleDot,
  ArrowLeft,
  Layers,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  Minus,
  Edit3,
  Image as ImageIcon,
  ImageOff,
  GitPullRequest,
  LayoutGrid,
  Loader2,
  X,
} from "lucide-react";

const CHANGED_PROP_LABELS = {
  name: "Name",
  visible: "Visibility",
  opacity: "Opacity",
  x: "X Position",
  y: "Y Position",
  width: "Width",
  height: "Height",
  fills: "Fill Color",
  strokes: "Stroke",
  strokeWeight: "Stroke Weight",
  cornerRadius: "Corner Radius",
  effects: "Effects & Shadows",
  layoutMode: "Layout Mode",
  itemSpacing: "Item Spacing",
  paddingLeft: "Padding Left",
  paddingRight: "Padding Right",
  paddingTop: "Padding Top",
  paddingBottom: "Padding Bottom",
  characters: "Text Content",
  fontSize: "Font Size",
  fontName: "Typography",
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
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function formatDate(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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
  return props.filter((p) => JSON.stringify(prev[p]) !== JSON.stringify(curr[p]));
}

function computeDiff(currentNodes, parentNodes) {
  const currentMap = flattenNodes(currentNodes);
  const parentMap = flattenNodes(parentNodes);
  const added = [],
    removed = [],
    modified = [],
    unchanged = [];

  Object.keys(currentMap).forEach((id) => {
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

  Object.keys(parentMap).forEach((id) => {
    if (!currentMap[id]) removed.push(parentMap[id]);
  });

  return { added, removed, modified, unchanged };
}

// Type badge component
function TypeBadge({ type }) {
  const MAP = {
    FRAME: { label: "Frame", color: "bg-blue-50 text-blue-600 border-blue-200" },
    COMPONENT: { label: "Component", color: "bg-purple-50 text-purple-600 border-purple-200" },
    INSTANCE: { label: "Instance", color: "bg-violet-50 text-violet-600 border-violet-200" },
    TEXT: { label: "Text", color: "bg-amber-50 text-amber-600 border-amber-200" },
    RECTANGLE: { label: "Rect", color: "bg-gray-50 text-gray-600 border-gray-200" },
    ELLIPSE: { label: "Ellipse", color: "bg-gray-50 text-gray-600 border-gray-200" },
    GROUP: { label: "Group", color: "bg-gray-50 text-gray-600 border-gray-200" },
    VECTOR: { label: "Vector", color: "bg-pink-50 text-pink-600 border-pink-200" },
    SECTION: { label: "Section", color: "bg-teal-50 text-teal-600 border-teal-200" },
  };
  const style = MAP[type] || { label: type, color: "bg-gray-50 text-gray-500 border-gray-200" };
  return (
    <span className={`inline-block text-[9px] font-semibold px-1.5 py-0.5 rounded border ${style.color}`}>
      {style.label}
    </span>
  );
}

// Single diff row component
function DiffRow({ node, kind }) {
  const [expanded, setExpanded] = useState(false);
  const colors = {
    added: {
      bg: "bg-emerald-50/60",
      border: "border-emerald-200",
      text: "text-emerald-800",
      sig: "+",
      sigColor: "text-emerald-600",
      bar: "bg-emerald-500",
      Icon: Plus,
    },
    removed: {
      bg: "bg-red-50/60",
      border: "border-red-200",
      text: "text-red-800",
      sig: "−",
      sigColor: "text-red-500",
      bar: "bg-red-500",
      Icon: Minus,
    },
    modified: {
      bg: "bg-amber-50/60",
      border: "border-amber-200",
      text: "text-amber-800",
      sig: "~",
      sigColor: "text-amber-600",
      bar: "bg-amber-500",
      Icon: Edit3,
    },
  };
  const c = colors[kind];
  const IconComp = c.Icon;
  const hasProps = kind === "modified" && node.changedProps?.length > 0;

  return (
    <div className={`border ${c.border} ${c.bg} rounded-lg overflow-hidden mb-2 transition-all`}>
      <div
        className={`flex items-center gap-3 px-3.5 py-2.5 ${hasProps ? "cursor-pointer hover:bg-black/5" : ""}`}
        onClick={() => hasProps && setExpanded(!expanded)}
      >
        {/* Color accent bar */}
        <div className={`w-1 self-stretch rounded-full ${c.bar} shrink-0`} />

        {/* Icon status indicator */}
        <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${c.sigColor}`}>
          <IconComp className="w-3.5 h-3.5" />
        </span>

        {/* Node name */}
        <span className={`font-semibold text-[13px] grow truncate ${c.text}`}>{node.name}</span>

        {/* Node type badge */}
        <TypeBadge type={node.type} />

        {/* Expand toggle for modified properties */}
        {hasProps && (
          <button type="button" className={`p-1 rounded text-[#666] hover:text-black transition-transform ${expanded ? "rotate-180" : ""}`}>
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Expanded property diff chips */}
      {expanded && hasProps && (
        <div className="px-4 pb-3 pt-2 border-t border-amber-200/60 bg-white/60 flex flex-wrap gap-1.5">
          {node.changedProps.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-100/80 text-amber-800 border border-amber-300/80"
            >
              <Edit3 className="w-3 h-3 text-amber-600" />
              {CHANGED_PROP_LABELS[p] || p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CommitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const commitId = params.id;

  const [user, setUser] = useState(null);
  const [commit, setCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Header State
  const [notifications, setNotifications] = useState([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  async function fetchNotifications(userId) {
    try {
      const { data } = await supabase
        .from("dvc_notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
    } catch (e) {
      setNotifications([]);
    }
  }

  async function markAllRead() {
    if (!user) return;
    await supabase
      .from("dvc_notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  async function markNotifRead(notifId) {
    await supabase.from("dvc_notifications").update({ read: true }).eq("id", notifId);
    setNotifications((prev) => prev.map((n) => (n.id === notifId ? { ...n, read: true } : n)));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function loadCommit(currentUser) {
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

      // Fetch parent commit for diff calculation
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
      await fetchNotifications(currentUser.id);
    } catch (e) {
      console.error("Error loading commit:", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);
      await loadCommit(user);
    }
    init();
  }, [commitId, router]);

  function copyCommitHash() {
    if (commit?.id) {
      navigator.clipboard.writeText(commit.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (loading) {
    return (
      <div className="grow flex flex-col min-w-0">
        <Header
          user={user}
          notifications={notifications}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          markAllRead={markAllRead}
          markNotifRead={markNotifRead}
          setIsSearchOpen={setIsSearchOpen}
          onSignOut={handleSignOut}
        />
        <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center min-h-125">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-black" />
            <p className="text-[13px] text-[#666666] font-medium">Loading Visual Commit Details...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!commit) {
    return (
      <div className="grow flex flex-col min-w-0">
        <Header
          user={user}
          notifications={notifications}
          isNotifOpen={isNotifOpen}
          setIsNotifOpen={setIsNotifOpen}
          markAllRead={markAllRead}
          markNotifRead={markNotifRead}
          setIsSearchOpen={setIsSearchOpen}
          onSignOut={handleSignOut}
        />
        <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col items-center justify-center min-h-125">
          <div className="text-center flex flex-col items-center gap-3">
            <ImageOff className="w-10 h-10 text-[#aaa]" />
            <p className="text-[16px] font-bold text-black">Commit Not Found</p>
            <p className="text-[13px] text-[#777]">The requested commit ID #{commitId} does not exist or was removed.</p>
            <Link href="/dashboard/activity" className="mt-2 bg-black text-white text-[12px] font-bold px-4 py-2 rounded-lg hover:bg-black/90 transition-colors">
              Back to Activity Stream
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const shortId = commit.id?.slice(0, 7);
  const totalChanges = diff ? diff.added.length + diff.removed.length + diff.modified.length : 0;
  const isFirstCommit = !commit.parent_id;

  return (
    <div className="grow flex flex-col min-w-0">
      {/* Persistent App Header */}
      <Header
        user={user}
        notifications={notifications}
        isNotifOpen={isNotifOpen}
        setIsNotifOpen={setIsNotifOpen}
        markAllRead={markAllRead}
        markNotifRead={markNotifRead}
        setIsSearchOpen={setIsSearchOpen}
        onSignOut={handleSignOut}
      />

      {/* Main Content Area matching 1600px max width */}
      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Breadcrumb Navigation & Quick Actions Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[13px] flex-wrap">
            <Link href="/dashboard" className="font-bold text-black hover:underline flex items-center gap-1.5">
              <FolderGit2 className="w-4 h-4 text-black" />
              GitDesign
            </Link>
            <span className="text-[#bbb]">/</span>
            <Link href="/dashboard/activity" className="text-[#666666] hover:text-black transition-colors font-medium">
              Activity
            </Link>
            <span className="text-[#bbb]">/</span>
            <span className="font-mono text-[11px] bg-[#f0f0f4] border border-[#e0e0e4] px-2 py-0.5 rounded-md font-bold text-black">
              #{shortId}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/dashboard/activity"
              className="bg-white/80 border border-[#c5c5c5] text-black text-[12px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-black" />
              Back to Activity
            </Link>

            <button
              type="button"
              onClick={copyCommitHash}
              className="bg-white/80 border border-[#c5c5c5] text-black text-[12px] font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 hover:bg-white transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-black" />}
              {copied ? "Copied SHA" : "Copy Hash"}
            </button>

            <Link
              href="/dashboard/pulls/new"
              className="bg-black text-white hover:bg-black/90 font-bold text-[12px] px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
            >
              <GitPullRequest className="w-4 h-4 text-white" />
              Create PR
            </Link>
          </div>
        </div>

        {/* Commit Hero Card */}
        <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl overflow-hidden shadow-sm flex flex-col">
          {/* Header Message */}
          <div className="p-6 border-b border-[#f0f0f0] flex flex-col gap-3">
            <h1 className="text-[22px] font-bold text-black font-sans leading-tight tracking-tight">
              {commit.message}
            </h1>
            <div className="flex items-center gap-3 text-[13px] text-[#666666] flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                  {(commit.author || "U").slice(0, 1).toUpperCase()}
                </div>
                <span className="font-semibold text-black">{commit.author || "Unknown designer"}</span>
              </div>
              <span>&middot;</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#888]" />
                {formatDate(commit.timestamp)}
              </span>
              <span>&middot;</span>
              <span className="text-[#888] font-medium">{timeAgo(commit.timestamp)}</span>
            </div>
          </div>

          {/* Metadata Strip */}
          <div className="px-6 py-3.5 bg-[#fafafa]/90 flex items-center gap-4 flex-wrap text-[11px] border-t border-[#f2f2f4]">
            <div className="flex items-center gap-1.5 text-[#555]">
              <FolderGit2 className="w-3.5 h-3.5 text-black" />
              <span>Repository:</span>
              <span className="font-mono font-bold text-black bg-[#f0f0f4] px-1.5 py-0.5 rounded border border-[#e0e0e4]">
                gitdesign/{commit.file_key}
              </span>
            </div>

            <span className="text-[#ddd]">|</span>

            <div className="flex items-center gap-1.5 text-[#555]">
              <LayoutGrid className="w-3.5 h-3.5 text-black" />
              <span>Canvas Page:</span>
              <span className="font-semibold text-black">{commit.page_name || "Page 1"}</span>
              {commit.frame_name && (
                <>
                  <span className="text-[#bbb]">›</span>
                  <span className="font-semibold text-black">{commit.frame_name}</span>
                </>
              )}
            </div>

            <span className="text-[#ddd]">|</span>

            <div className="flex items-center gap-1.5 text-[#555]">
              <Layers className="w-3.5 h-3.5 text-black" />
              <span>{commit.node_count || 0} Figma nodes</span>
            </div>

            <span className="text-[#ddd]">|</span>

            <div className="flex items-center gap-1.5 text-[#555]">
              <GitCommit className="w-3.5 h-3.5 text-black" />
              <span>SHA:</span>
              <code className="font-mono text-[10px] bg-[#f0f0f4] border border-[#e0e0e4] px-2 py-0.5 rounded font-bold text-black">
                {commit.id?.slice(0, 12)}
              </code>
            </div>

            {commit.parent_id && (
              <>
                <span className="text-[#ddd]">|</span>
                <Link
                  href={`/dashboard/commit/${commit.parent_id}`}
                  className="flex items-center gap-1 text-[#555] hover:text-black transition-colors group"
                >
                  <GitBranch className="w-3.5 h-3.5 text-black" />
                  <span>Parent:</span>
                  <code className="font-mono text-[10px] font-bold group-hover:underline text-black">
                    #{commit.parent_id?.slice(0, 7)}
                  </code>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* 2-Column Split: Design Snapshot Preview + Layer Diff Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* Left Column: Visual Design Snapshot Banner */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl overflow-hidden shadow-sm sticky top-24 flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4.5 h-4.5 text-black" />
                  <h3 className="text-[14px] font-bold text-black font-sans tracking-tight">Design Snapshot</h3>
                </div>
                {commit.snapshot_url && (
                  <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded-full">
                    Captured
                  </span>
                )}
              </div>

              {commit.snapshot_url && !snapshotError ? (
                <div className="flex flex-col gap-3">
                  <div className="rounded-lg overflow-hidden border border-[#e0e0e0] bg-[#f4f4f6] relative group" style={{ aspectRatio: "4/3" }}>
                    <img
                      src={commit.snapshot_url}
                      alt={`Snapshot — ${commit.frame_name || "Figma Frame"}`}
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-102"
                      onError={() => setSnapshotError(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="absolute bottom-3 right-3 bg-black/80 hover:bg-black text-white p-2 rounded-lg transition-colors shadow-md cursor-pointer"
                      title="Expand full screen preview"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                  </div>

                  <a
                    href={commit.snapshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 text-[12px] font-bold text-black border border-[#c5c5c5] hover:bg-black hover:text-white transition-colors rounded-lg py-2.5 cursor-pointer shadow-xs"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Original Image
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-[#aaa] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
                  <ImageOff className="w-10 h-10 opacity-40 text-black" />
                  <div className="text-center">
                    <p className="text-[13px] font-semibold text-black">No snapshot preview</p>
                    <p className="text-[11px] text-[#888888] mt-1">
                      {snapshotError
                        ? "Failed to load snapshot image asset."
                        : "Visual snapshot preview was not attached to this commit."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Layer & Node Diff Inspection */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            {/* Diff Summary Bar */}
            {diff && (
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl px-6 py-4 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-black">
                    {isFirstCommit
                      ? "Initial Commit"
                      : totalChanges === 0
                      ? "No layer changes vs. parent"
                      : `${totalChanges} layer${totalChanges !== 1 ? "s" : ""} modified`}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {diff.added.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                      <Plus className="w-3 h-3 text-emerald-600" />
                      {diff.added.length} added
                    </span>
                  )}
                  {diff.removed.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                      <Minus className="w-3 h-3 text-red-600" />
                      {diff.removed.length} removed
                    </span>
                  )}
                  {diff.modified.length > 0 && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                      <Edit3 className="w-3 h-3 text-amber-600" />
                      {diff.modified.length} modified
                    </span>
                  )}
                  {diff.unchanged.length > 0 && (
                    <span className="text-[11px] font-medium text-[#777] bg-[#f0f0f4] border border-[#e0e0e4] px-2.5 py-1 rounded-full">
                      {diff.unchanged.length} unchanged
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Layer Changes List Section */}
            {diff && (
              <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <div className="w-3.5 h-1 rounded-full bg-emerald-500" />
                      <div className="w-3.5 h-1 rounded-full bg-red-400" />
                    </div>
                    <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">Layer Changes</h2>
                  </div>
                  {isFirstCommit && (
                    <span className="text-[10px] bg-[#f0f0f4] border border-[#e0e0e4] text-[#666] font-semibold px-2.5 py-0.5 rounded-full">
                      Initial commit baseline
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  {/* Added layers */}
                  {diff.added.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Added ({diff.added.length})</span>
                      </div>
                      {diff.added.map((n) => (
                        <DiffRow key={n.id} node={n} kind="added" />
                      ))}
                    </div>
                  )}

                  {/* Removed layers */}
                  {diff.removed.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-[12px] font-bold text-red-700">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        <span>Removed ({diff.removed.length})</span>
                      </div>
                      {diff.removed.map((n) => (
                        <DiffRow key={n.id} node={n} kind="removed" />
                      ))}
                    </div>
                  )}

                  {/* Modified layers */}
                  {diff.modified.length > 0 && (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between text-[12px] font-bold text-amber-700">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span>Modified ({diff.modified.length})</span>
                        </div>
                        <span className="text-[10px] text-[#777] font-normal">Click any layer to view changed properties</span>
                      </div>
                      {diff.modified.map((n) => (
                        <DiffRow key={n.id} node={n} kind="modified" />
                      ))}
                    </div>
                  )}

                  {/* Empty state when no changes */}
                  {!isFirstCommit && totalChanges === 0 && (
                    <div className="flex flex-col items-center py-12 gap-2 text-[#aaa] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      <p className="text-[13px] font-bold text-black">No Layer Changes Detected</p>
                      <p className="text-[11px] text-[#888888]">This commit matches the exact structure of its parent commit.</p>
                    </div>
                  )}

                  {isFirstCommit && diff.added.length === 0 && (
                    <div className="flex flex-col items-center py-10 gap-2 text-center">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                      <p className="text-[13px] font-bold text-black">First Commit Created</p>
                      <p className="text-[11px] text-[#777777]">
                        All <strong className="text-black">{commit.node_count || 0}</strong> Figma nodes are tracked in this initial version.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Lightbox Modal for snapshot image */}
      {isLightboxOpen && commit.snapshot_url && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-xl overflow-hidden p-2 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#eee]">
              <span className="text-[13px] font-bold text-black truncate">{commit.frame_name || commit.message}</span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1 rounded-lg hover:bg-black/10 transition-colors text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto p-4 flex justify-center items-center">
              <img src={commit.snapshot_url} alt="Full snapshot preview" className="max-h-[75vh] object-contain rounded" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
