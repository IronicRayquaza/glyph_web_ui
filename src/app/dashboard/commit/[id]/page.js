"use client";

import { useEffect, useState, useRef, useMemo } from "react";
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
  Code,
  GitMerge,
  SplitSquareHorizontal,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import DesignInspectPanel from "@/components/dashboard/DesignInspectPanel";

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
  const d = new Date(dateString);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ─── Visual Diff Slider (Before/After) ───────────────────────────────────────
function VisualDiffSlider({ beforeUrl, afterUrl, beforeLabel = "BEFORE", afterLabel = "AFTER" }) {
  const [sliderX, setSliderX] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef(null);

  function onMouseMove(e) {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(98, Math.max(2, x)));
  }

  function onTouchMove(e) {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
    setSliderX(Math.min(98, Math.max(2, x)));
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-xl border border-[#e0e0e0] select-none cursor-col-resize shadow-xs"
      style={{ minHeight: "420px", background: "#f0f0f2" }}
      onMouseMove={onMouseMove}
      onMouseUp={() => setDragging(false)}
      onMouseLeave={() => setDragging(false)}
      onTouchMove={onTouchMove}
      onTouchEnd={() => setDragging(false)}
    >
      {/* Before (full width) */}
      <div className="absolute inset-0">
        {beforeUrl ? (
          <img src={beforeUrl} alt="Before" className="w-full h-full object-contain bg-[#f8f8f8]" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#999999] flex-col gap-2">
            <ImageOff className="w-8 h-8 opacity-40 text-black" />
            <span className="text-[12px] font-medium">No parent snapshot available</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end p-3 pointer-events-none">
          <span className="bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm">
            {beforeLabel}
          </span>
        </div>
      </div>

      {/* After (clipped by slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 0 0 ${sliderX}%)` }}
      >
        {afterUrl ? (
          <img src={afterUrl} alt="After" className="w-full h-full object-contain bg-[#f8f8f8]" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#999999] flex-col gap-2">
            <ImageOff className="w-8 h-8 opacity-40 text-black" />
            <span className="text-[12px] font-medium">No snapshot available</span>
          </div>
        )}
        <div className="absolute inset-0 flex items-end justify-end p-3 pointer-events-none">
          <span className="bg-black/70 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-sm">
            {afterLabel}
          </span>
        </div>
      </div>

      {/* Divider Line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-lg z-10 pointer-events-none"
        style={{ left: `${sliderX}%` }}
      />

      {/* Drag Handle */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-9 h-9 bg-white rounded-full shadow-lg border border-[#e0e0e0] flex items-center justify-center cursor-col-resize"
        style={{ left: `${sliderX}%` }}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <SplitSquareHorizontal className="w-4 h-4 text-black" />
      </div>

      {/* Percentage indicator */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/70 text-white text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-sm pointer-events-none">
        {Math.round(sliderX)}%
      </div>
    </div>
  );
}

// ─── DiffRow component ────────────────────────────────────────────────────────
function DiffRow({ node, kind }) {
  const [isOpen, setIsOpen] = useState(false);
  const kindStyles = {
    added: { bg: "bg-emerald-50 border-emerald-200", badge: "bg-emerald-100 text-emerald-700 border-emerald-300", dot: "bg-emerald-500", icon: <Check className="w-3 h-3 text-emerald-600" />, label: "ADDED" },
    removed: { bg: "bg-red-50 border-red-200", badge: "bg-red-100 text-red-700 border-red-300", dot: "bg-red-500", icon: <X className="w-3 h-3 text-red-600" />, label: "REMOVED" },
    modified: { bg: "bg-amber-50 border-amber-200", badge: "bg-amber-100 text-amber-700 border-amber-300", dot: "bg-amber-500", icon: <Edit3 className="w-3 h-3 text-amber-600" />, label: "MODIFIED" },
    unchanged: { bg: "bg-white border-[#e5e5e5]", badge: "bg-[#f5f5f5] text-[#555] border-[#ddd]", dot: "bg-[#aaa]", icon: <MinusCircle className="w-3 h-3 text-[#aaa]" />, label: "UNCHANGED" },
  };
  const s = kindStyles[kind] || kindStyles.unchanged;
  const changedProps = node.changedProperties || [];

  return (
    <div className={`rounded-lg border ${s.bg} overflow-hidden`}>
      <div
        className={`flex items-center justify-between px-4 py-2.5 gap-3 ${kind === "modified" && changedProps.length > 0 ? "cursor-pointer" : ""}`}
        onClick={() => kind === "modified" && changedProps.length > 0 && setIsOpen((p) => !p)}
      >
        <div className="flex items-center gap-2 min-w-0 grow">
          <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
          <span className="text-[12px] font-medium text-black truncate">{node.name || "Unnamed Layer"}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wide border px-1.5 py-0.5 rounded shrink-0 ${s.badge}`}>
            {s.label}
          </span>
        </div>
        {kind === "modified" && changedProps.length > 0 && (
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] text-[#888] font-medium">{changedProps.length} props</span>
            {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-[#666]" /> : <ChevronDown className="w-3.5 h-3.5 text-[#666]" />}
          </div>
        )}
      </div>

      {isOpen && changedProps.length > 0 && (
        <div className="border-t border-amber-200 px-4 py-3 flex flex-col gap-2 bg-amber-50/50">
          {changedProps.map((prop) => (
            <div key={prop.key} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wide">
                {CHANGED_PROP_LABELS[prop.key] || prop.key}
              </span>
              <div className="flex items-start gap-2 text-[11px]">
                <span className="flex-1 font-mono bg-red-50 border border-red-200 text-red-700 px-2 py-0.5 rounded truncate">{String(prop.before ?? "—")}</span>
                <span className="text-[#666] font-bold shrink-0">→</span>
                <span className="flex-1 font-mono bg-emerald-50 border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded truncate">{String(prop.after ?? "—")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Diff engine ──────────────────────────────────────────────────────────────
function flattenNodes(nodes, result = []) {
  if (!Array.isArray(nodes)) return result;
  for (const n of nodes) {
    result.push(n);
    if (n.children) flattenNodes(n.children, result);
  }
  return result;
}

function getColorValue(fills) {
  if (!Array.isArray(fills)) return null;
  const f = fills.find((x) => x.type === "SOLID" && x.color);
  if (!f) return null;
  const { r, g, b, a = 1 } = f.color;
  return `rgba(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)},${a.toFixed(2)})`;
}

const TRACKED_PROPS = ["name", "visible", "opacity", "x", "y", "width", "height", "fills", "strokes", "strokeWeight", "cornerRadius", "effects", "layoutMode", "itemSpacing", "paddingLeft", "paddingRight", "paddingTop", "paddingBottom", "characters", "fontSize", "fontName"];

function computeDiff(current, parent) {
  const curr = flattenNodes(current);
  const prev = flattenNodes(parent);
  const prevMap = Object.fromEntries(prev.map((n) => [n.id, n]));
  const currMap = Object.fromEntries(curr.map((n) => [n.id, n]));

  const added = [], removed = [], modified = [], unchanged = [];

  for (const n of curr) {
    if (!prevMap[n.id]) { added.push(n); continue; }
    const old = prevMap[n.id];
    const changedProperties = [];
    for (const key of TRACKED_PROPS) {
      const after = key === "fills" ? getColorValue(n[key]) : n[key];
      const before = key === "fills" ? getColorValue(old[key]) : old[key];
      if (JSON.stringify(after) !== JSON.stringify(before)) {
        changedProperties.push({ key, before, after });
      }
    }
    if (changedProperties.length > 0) { modified.push({ ...n, changedProperties }); }
    else { unchanged.push(n); }
  }
  for (const n of prev) { if (!currMap[n.id]) removed.push(n); }
  return { added, removed, modified, unchanged };
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommitDetailPage() {
  const router = useRouter();
  const params = useParams();
  const commitId = params.id;

  const [user, setUser] = useState(null);
  const [commit, setCommit] = useState(null);
  const [parentCommit, setParentCommit] = useState(null);
  const [allRepoCommits, setAllRepoCommits] = useState([]);
  const [selectedCompareCommit, setSelectedCompareCommit] = useState(null);
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snapshotError, setSnapshotError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeRightTab, setActiveRightTab] = useState("diff");
  const [compareMode, setCompareMode] = useState(false);

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

  async function copyCommitHash() {
    if (!commit?.id) return;
    try {
      await navigator.clipboard.writeText(commit.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function loadCommit() {
    setLoading(true);
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      if (!currentUser) {
        router.push("/login");
        return;
      }
      setUser(currentUser);

      const { data: c, error } = await supabase
        .from("dvc_commits")
        .select("*")
        .eq("id", commitId)
        .maybeSingle();

      if (error || !c) {
        router.push("/dashboard");
        return;
      }
      setCommit(c);

      // Fetch all commits for the same frame/file for comparison dropdown
      const { data: repoCommitRows } = await supabase
        .from("dvc_commits")
        .select("id, message, author, timestamp, snapshot_url, frame_name, file_key, nodes")
        .eq("file_key", c.file_key)
        .neq("id", commitId)
        .order("timestamp", { ascending: false });

      const repoCommits = (repoCommitRows || []).filter(
        (r) => (c.frame_name ? r.frame_name === c.frame_name : true)
      );
      setAllRepoCommits(repoCommits);

      // Fetch parent commit for diff + comparison
      let parentObj = null;
      if (c.parent_id) {
        const { data: parentRows } = await supabase
          .from("dvc_commits")
          .select("*")
          .eq("id", c.parent_id);
        parentObj = parentRows?.[0] || null;
      } else {
        parentObj = repoCommits[0] || null;
      }

      setParentCommit(parentObj);
      setSelectedCompareCommit(parentObj);
      await fetchNotifications(currentUser.id);
    } catch (e) {
      console.error("Error loading commit:", e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommit();
  }, [commitId]);

  const activeBaselineCommit = compareMode ? (selectedCompareCommit || parentCommit) : parentCommit;

  const activeDiff = useMemo(() => {
    if (!commit) return null;
    const currentNodes = commit.nodes || [];
    const baselineNodes = activeBaselineCommit?.nodes || [];
    return computeDiff(currentNodes, baselineNodes);
  }, [commit, activeBaselineCommit]);

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
            <p className="text-[13px] text-[#666666] font-medium">Loading commit...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!commit) return null;

  const isFirstCommit = !commit.parent_id;

  const isComparingCustom = compareMode && activeBaselineCommit && activeBaselineCommit.id !== parentCommit?.id;
  const totalChanges = activeDiff ? activeDiff.added.length + activeDiff.removed.length + activeDiff.modified.length : 0;

  const compareCommit = selectedCompareCommit || parentCommit;
  const parentSnapshotUrl = compareCommit?.snapshot_url || null;
  const hasComparisonSnapshots = !!(commit.snapshot_url && parentSnapshotUrl);

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

      <main className="grow p-6 md:p-8 w-full max-w-[1600px] mx-auto flex flex-col gap-6">
        {/* Breadcrumb Nav */}
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg bg-white/80 hover:bg-white border border-[#e0e0e4] text-[#555] hover:text-black transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1.5 text-[13px] text-[#777]">
            <Link href="/dashboard" className="hover:text-black hover:underline">Dashboard</Link>
            <span>›</span>
            <span className="font-semibold text-black">Commit {commit.id?.slice(0, 7)}</span>
          </div>

          <div className="ml-auto flex items-center gap-2">
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
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs flex flex-col">
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
          <div className="px-6 py-3.5 bg-white/50 flex items-center gap-4 flex-wrap text-[11px] border-t border-[#f2f2f4]/60">
            <div className="flex items-center gap-1.5 text-[#555]">
              <FolderGit2 className="w-3.5 h-3.5 text-black" />
              <span>Repository:</span>
              <span className="font-mono font-bold text-black bg-[#f0f0f4] px-1.5 py-0.5 rounded border border-[#e0e0e4]">
                gitdesign/{commit.frame_name || commit.file_key}
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

        {/* ── LARGE VISUAL SECTION ─────────────────────────────────────────── */}
        <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs flex flex-col gap-0">
          {/* Visual Header with Compare Toggle */}
          <div className="px-5 py-3.5 border-b border-[#f0f0f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4.5 h-4.5 text-black" />
              <h3 className="text-[14px] font-semibold text-black font-sans">Design Canvas Snapshot</h3>
              {commit.snapshot_url && (
                <span className="text-[10px] bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                  Captured
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Compare Toggle */}
              <button
                type="button"
                onClick={() => setCompareMode((v) => !v)}
                className={`flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                  compareMode
                    ? "bg-black text-white border-black shadow-xs"
                    : "bg-white/80 text-[#555] border-[#d5d5d5] hover:border-black hover:text-black"
                }`}
              >
                <SplitSquareHorizontal className="w-3.5 h-3.5" />
                {compareMode ? "Comparing" : "Compare"}
              </button>

              {/* Baseline Commit Selector Dropdown */}
              {compareMode && allRepoCommits.length > 0 && (
                <select
                  value={selectedCompareCommit?.id || ""}
                  onChange={(e) => {
                    const found = allRepoCommits.find((c) => c.id === e.target.value);
                    setSelectedCompareCommit(found || null);
                  }}
                  className="text-[12px] font-medium bg-white border border-[#d5d5d5] text-black rounded-lg px-3 py-1.5 outline-none focus:border-black cursor-pointer shadow-xs transition-colors"
                >
                  <option value="" disabled>Select baseline commit…</option>
                  {allRepoCommits.map((c) => (
                    <option key={c.id} value={c.id}>
                      #{c.id.slice(0, 7)} · {c.message?.slice(0, 35)}{c.message?.length > 35 ? "…" : ""} · {timeAgo(c.timestamp)}
                    </option>
                  ))}
                </select>
              )}

              {commit.snapshot_url && !compareMode && (
                <button
                  type="button"
                  onClick={() => setIsLightboxOpen(true)}
                  className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-[#e0e0e4] text-[#555] hover:text-black transition-colors cursor-pointer"
                  title="Expand full screen preview"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Visual Content */}
          <div className="p-5">
            {compareMode ? (
              hasComparisonSnapshots ? (
                <div className="flex flex-col gap-3">
                  <VisualDiffSlider
                    beforeUrl={parentSnapshotUrl}
                    afterUrl={commit.snapshot_url}
                    beforeLabel={`BEFORE · #${compareCommit?.id?.slice(0, 7)}`}
                    afterLabel={`AFTER · #${commit.id?.slice(0, 7)}`}
                  />
                  <p className="text-[11px] text-[#888] text-center">
                    Comparing <strong className="text-black">#{compareCommit?.id?.slice(0, 7)}</strong>
                    {" "}→{" "}
                    <strong className="text-black">#{commit.id?.slice(0, 7)}</strong>
                    {" · "}Drag the handle to compare snapshots
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 py-16 border border-dashed border-[#d5d5d5] rounded-xl bg-[#fafafa]">
                  <ImageOff className="w-10 h-10 opacity-30 text-black" />
                  <p className="text-[13px] font-semibold text-black">No Parent Snapshot Available</p>
                  <p className="text-[11px] text-[#888]">
                    {isFirstCommit
                      ? "This is the first commit — there is no previous version to compare."
                      : "The parent commit doesn't have a snapshot captured."}
                  </p>
                </div>
              )
            ) : commit.snapshot_url && !snapshotError ? (
              <div className="rounded-xl overflow-hidden border border-[#e0e0e0] bg-[#f4f4f6] relative" style={{ minHeight: "420px" }}>
                <img
                  src={commit.snapshot_url}
                  alt={`Snapshot — ${commit.frame_name || "Figma Frame"}`}
                  className="w-full h-full object-contain p-3"
                  style={{ minHeight: "420px" }}
                  onError={() => setSnapshotError(true)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-[#aaa] border border-dashed border-[#d5d5d5] rounded-xl bg-[#fafafa]">
                <ImageOff className="w-10 h-10 opacity-40 text-black" />
                <div className="text-center">
                  <p className="text-[13px] font-semibold text-black">No snapshot preview</p>
                  <p className="text-[11px] text-[#888888] mt-1">
                    {snapshotError ? "Failed to load snapshot image asset." : "Visual snapshot was not attached to this commit."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Open Image link */}
          {commit.snapshot_url && !compareMode && (
            <div className="px-5 pb-4">
              <a
                href={commit.snapshot_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 text-[12px] font-semibold text-black border border-[#c5c5c5] hover:bg-black hover:text-white transition-colors rounded-lg py-2 cursor-pointer shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Open Original Image
              </a>
            </div>
          )}
        </div>

        {/* ── LOWER PANELS: LAYER CHANGES & SIDE-BY-SIDE DEVELOPER INSPECTION ── */}
        {compareMode ? (
          <div className="flex flex-col gap-6">
            {/* Layer Changes Breakdown in Compare Mode */}
            {activeDiff && (
              <div className="flex flex-col gap-3">
                {/* Diff Summary Bar */}
                <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl px-5 py-3.5 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <div className="w-3.5 h-1 rounded-full bg-emerald-500" />
                      <div className="w-3.5 h-1 rounded-full bg-red-400" />
                    </div>
                    <span className="text-[13px] font-bold text-black">
                      Layer Changes (Comparing #{activeBaselineCommit?.id?.slice(0, 7)} → #{commit?.id?.slice(0, 7)})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeDiff.added.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <Plus className="w-3 h-3 text-emerald-600" />
                        {activeDiff.added.length} added
                      </span>
                    )}
                    {activeDiff.removed.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                        <Minus className="w-3 h-3 text-red-600" />
                        {activeDiff.removed.length} removed
                      </span>
                    )}
                    {activeDiff.modified.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        <Edit3 className="w-3 h-3 text-amber-600" />
                        {activeDiff.modified.length} modified
                      </span>
                    )}
                    {activeDiff.unchanged.length > 0 && (
                      <span className="text-[11px] font-medium text-[#777] bg-[#f0f0f4] border border-[#e0e0e4] px-2.5 py-1 rounded-full">
                        {activeDiff.unchanged.length} unchanged
                      </span>
                    )}
                  </div>
                </div>

                {/* Scrollable Layer Changes List */}
                {totalChanges > 0 && (
                  <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-4 shadow-xs flex flex-col gap-3 max-h-[260px] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-black" />
                        <h3 className="text-[14px] font-bold text-black font-sans">Layer Differences List</h3>
                      </div>
                      <span className="text-[10px] text-[#777]">
                        {totalChanges} total changes vs baseline
                      </span>
                    </div>

                    <div className="flex flex-col gap-2">
                      {activeDiff.added.map((n) => (
                        <DiffRow key={n.id} node={n} kind="added" />
                      ))}
                      {activeDiff.removed.map((n) => (
                        <DiffRow key={n.id} node={n} kind="removed" />
                      ))}
                      {activeDiff.modified.map((n) => (
                        <DiffRow key={n.id} node={n} kind="modified" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Side-by-Side Developer Inspect Panels */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
              {/* Left Panel: Baseline Commit Developer Inspect */}
              <div className="flex flex-col gap-3">
                <div className="bg-white/80 backdrop-blur-md border border-amber-200/80 px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                      BEFORE · BASELINE
                    </span>
                    <span className="text-[12px] font-bold text-black font-mono shrink-0">
                      #{activeBaselineCommit?.id?.slice(0, 7)}
                    </span>
                    <span className="text-[11px] text-[#666] truncate">
                      {activeBaselineCommit?.message}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#777] font-semibold shrink-0">
                    {activeBaselineCommit?.nodes?.length || 0} layers
                  </span>
                </div>
                <DesignInspectPanel
                  nodes={activeBaselineCommit?.nodes || []}
                  className="h-[530px] max-h-[530px]"
                />
              </div>

              {/* Right Panel: Target Commit Developer Inspect */}
              <div className="flex flex-col gap-3">
                <div className="bg-white/80 backdrop-blur-md border border-emerald-200/80 px-4 py-2.5 rounded-xl shadow-xs flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md shrink-0">
                      AFTER · TARGET
                    </span>
                    <span className="text-[12px] font-bold text-black font-mono shrink-0">
                      #{commit?.id?.slice(0, 7)}
                    </span>
                    <span className="text-[11px] text-[#666] truncate">
                      {commit?.message}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#777] font-semibold shrink-0">
                    {commit?.nodes?.length || 0} layers
                  </span>
                </div>
                <DesignInspectPanel
                  nodes={commit?.nodes || []}
                  className="h-[530px] max-h-[530px]"
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            {/* Left: Layer Changes */}
            <div className="flex flex-col gap-4">
              {/* Diff Summary Bar */}
              {activeDiff && (
                <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl px-5 py-3.5 shadow-sm flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <div className="w-3.5 h-1 rounded-full bg-emerald-500" />
                      <div className="w-3.5 h-1 rounded-full bg-red-400" />
                    </div>
                    <span className="text-[13px] font-bold text-black">
                      {isFirstCommit
                        ? "Initial Commit"
                        : totalChanges === 0
                        ? "No layer changes vs. parent"
                        : `${totalChanges} layer${totalChanges !== 1 ? "s" : ""} modified`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {activeDiff.added.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <Plus className="w-3 h-3 text-emerald-600" />
                        {activeDiff.added.length} added
                      </span>
                    )}
                    {activeDiff.removed.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                        <Minus className="w-3 h-3 text-red-600" />
                        {activeDiff.removed.length} removed
                      </span>
                    )}
                    {activeDiff.modified.length > 0 && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                        <Edit3 className="w-3 h-3 text-amber-600" />
                        {activeDiff.modified.length} modified
                      </span>
                    )}
                    {activeDiff.unchanged.length > 0 && (
                      <span className="text-[11px] font-medium text-[#777] bg-[#f0f0f4] border border-[#e0e0e4] px-2.5 py-1 rounded-full">
                        {activeDiff.unchanged.length} unchanged
                      </span>
                    )}
                  </div>
                </div>
              )}

              {activeDiff && (
                <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl p-5 shadow-xs flex flex-col gap-4 h-[510px] max-h-[510px]">
                  <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-black" />
                      <h2 className="text-[15px] font-bold text-black font-sans">Layer Changes</h2>
                    </div>
                    {isFirstCommit && (
                      <span className="text-[10px] bg-[#f0f0f4] border border-[#e0e0e4] text-[#666] font-semibold px-2.5 py-0.5 rounded-full">
                        Initial commit baseline
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-4 overflow-y-auto pr-1 custom-scrollbar grow">
                    {activeDiff.added.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-emerald-700">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>Added ({activeDiff.added.length})</span>
                        </div>
                        {activeDiff.added.map((n) => (
                          <DiffRow key={n.id} node={n} kind="added" />
                        ))}
                      </div>
                    )}

                    {activeDiff.removed.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-[12px] font-bold text-red-700">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Removed ({activeDiff.removed.length})</span>
                        </div>
                        {activeDiff.removed.map((n) => (
                          <DiffRow key={n.id} node={n} kind="removed" />
                        ))}
                      </div>
                    )}

                    {activeDiff.modified.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between text-[12px] font-bold text-amber-700">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500" />
                            <span>Modified ({activeDiff.modified.length})</span>
                          </div>
                          <span className="text-[10px] text-[#777] font-normal">Click any layer to view changed properties</span>
                        </div>
                        {activeDiff.modified.map((n) => (
                          <DiffRow key={n.id} node={n} kind="modified" />
                        ))}
                      </div>
                    )}

                    {!isFirstCommit && totalChanges === 0 && (
                      <div className="flex flex-col items-center py-12 gap-2 text-[#aaa] border border-dashed border-[#d5d5d5] rounded-lg bg-[#fafafa]">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                        <p className="text-[13px] font-bold text-black">No Layer Changes Detected</p>
                        <p className="text-[11px] text-[#888888]">This commit matches the baseline commit structure exactly.</p>
                      </div>
                    )}

                    {isFirstCommit && activeDiff.added.length === 0 && (
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

            {/* Right: Developer Inspect */}
            <div>
              <DesignInspectPanel
                nodes={commit?.nodes || []}
                className="h-[578px] max-h-[578px]"
              />
            </div>
          </div>
        )}
      </main>

      {/* Lightbox Modal */}
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
