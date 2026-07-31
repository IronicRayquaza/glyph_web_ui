"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Code,
  Copy,
  Check,
  Layers,
  Type,
  Maximize2,
  Palette,
  Layout,
  Search,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";

// Helper: convert Figma RGB color (0..1) to HEX
function figmaRgbToHex(fill) {
  if (!fill || fill.type !== "SOLID" || !fill.color) return null;
  const r = Math.round((fill.color.r || 0) * 255);
  const g = Math.round((fill.color.g || 0) * 255);
  const b = Math.round((fill.color.b || 0) * 255);
  const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
  const opacity = fill.opacity !== undefined ? fill.opacity : 1;
  return { hex, opacity, r, g, b };
}

// Helper: generate clean CSS string from node properties
function generateCssSpecs(node) {
  if (!node) return "";
  const lines = [];

  // Dimensions & Position
  if (node.width != null) lines.push(`width: ${Math.round(node.width)}px;`);
  if (node.height != null) lines.push(`height: ${Math.round(node.height)}px;`);
  if (node.x != null) lines.push(`/* x: ${Math.round(node.x)}px, y: ${Math.round(node.y)}px */`);

  // Flexbox / Auto Layout
  if (node.layoutMode && node.layoutMode !== "NONE") {
    lines.push(`display: flex;`);
    lines.push(`flex-direction: ${node.layoutMode === "HORIZONTAL" ? "row" : "column"};`);
    if (node.itemSpacing) lines.push(`gap: ${Math.round(node.itemSpacing)}px;`);
    if (node.paddingLeft || node.paddingRight || node.paddingTop || node.paddingBottom) {
      const pT = Math.round(node.paddingTop || 0);
      const pR = Math.round(node.paddingRight || 0);
      const pB = Math.round(node.paddingBottom || 0);
      const pL = Math.round(node.paddingLeft || 0);
      lines.push(`padding: ${pT}px ${pR}px ${pB}px ${pL}px;`);
    }
  }

  // Fills / Background
  const fills = Array.isArray(node.fills) ? node.fills : [];
  if (fills.length > 0) {
    const solid = fills.find((f) => f && typeof f === "object" && f.type === "SOLID");
    if (solid) {
      const colorInfo = figmaRgbToHex(solid);
      if (colorInfo) {
        if (colorInfo.opacity < 1) {
          lines.push(`background-color: rgba(${colorInfo.r}, ${colorInfo.g}, ${colorInfo.b}, ${colorInfo.opacity.toFixed(2)});`);
        } else {
          lines.push(`background-color: ${colorInfo.hex};`);
        }
      }
    }
  }

  // Corner Radius
  if (node.cornerRadius) {
    lines.push(`border-radius: ${Math.round(node.cornerRadius)}px;`);
  } else if (node.topLeftRadius || node.topRightRadius) {
    lines.push(`border-radius: ${Math.round(node.topLeftRadius || 0)}px ${Math.round(node.topRightRadius || 0)}px ${Math.round(node.bottomRightRadius || 0)}px ${Math.round(node.bottomLeftRadius || 0)}px;`);
  }

  // Strokes / Border
  const strokes = Array.isArray(node.strokes) ? node.strokes : [];
  if (strokes.length > 0) {
    const strokeSolid = strokes.find((s) => s && typeof s === "object" && s.type === "SOLID");
    const weight = Math.round(node.strokeWeight || 1);
    if (strokeSolid) {
      const colorInfo = figmaRgbToHex(strokeSolid);
      if (colorInfo) {
        lines.push(`border: ${weight}px solid ${colorInfo.hex};`);
      }
    }
  }

  // Opacity
  if (node.opacity !== undefined && node.opacity < 1) {
    lines.push(`opacity: ${node.opacity.toFixed(2)};`);
  }

  // Typography
  if (node.type === "TEXT") {
    if (node.fontName?.family) {
      lines.push(`font-family: '${node.fontName.family}', sans-serif;`);
    }
    if (node.fontSize) {
      lines.push(`font-size: ${Math.round(node.fontSize)}px;`);
    }
    if (node.fontName?.style) {
      const style = node.fontName.style.toLowerCase();
      if (style.includes("bold")) lines.push(`font-weight: 700;`);
      else if (style.includes("medium")) lines.push(`font-weight: 500;`);
      else if (style.includes("semibold")) lines.push(`font-weight: 600;`);
      else if (style.includes("light")) lines.push(`font-weight: 300;`);
      else lines.push(`font-weight: 400;`);
    }
    if (node.textAlignHorizontal) {
      lines.push(`text-align: ${node.textAlignHorizontal.toLowerCase()};`);
    }
  }

  return lines.join("\n");
}

// Recursive Tree Node Item
function LayerTreeNode({ node, selectedId, onSelect, depth = 0 }) {
  const [isOpen, setIsOpen] = useState(depth < 2);
  const hasChildren = Array.isArray(node.children) && node.children.length > 0;
  const isSelected = selectedId === node.id;

  return (
    <div className="flex flex-col select-none">
      <div
        onClick={() => onSelect(node)}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        className={`flex items-center gap-1.5 py-1.5 pr-2 rounded-lg text-[12px] font-medium transition-colors cursor-pointer ${isSelected
          ? "bg-black text-white"
          : "text-[#444] hover:bg-[#f0f0f4]"
          }`}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(!isOpen);
            }}
            className="p-0.5 rounded hover:bg-black/10 transition-colors"
          >
            {isOpen ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}

        {node.type === "TEXT" ? (
          <Type className="w-3.5 h-3.5 text-amber-500 shrink-0" />
        ) : node.type === "COMPONENT" || node.type === "INSTANCE" ? (
          <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
        ) : (
          <Layers className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        )}

        <span className="truncate flex-grow">{node.name || "Untitled"}</span>
        <span className="text-[9px] font-mono opacity-50 uppercase px-1 rounded border border-current">
          {node.type}
        </span>
      </div>

      {hasChildren && isOpen && (
        <div className="flex flex-col">
          {node.children.map((child) => (
            <LayerTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function DesignInspectPanel({ nodes = [], className = "h-[510px] max-h-[510px]" }) {
  const [selectedNode, setSelectedNode] = useState(nodes[0] || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedCss, setCopiedCss] = useState(false);

  useEffect(() => {
    if (nodes && nodes.length > 0) {
      setSelectedNode(nodes[0]);
    }
  }, [nodes]);

  const cssSpecs = selectedNode ? generateCssSpecs(selectedNode) : "";
  const fills = Array.isArray(selectedNode?.fills) ? selectedNode.fills : [];
  const solidFill = fills.find((f) => f && typeof f === "object" && f.type === "SOLID");
  const colorInfo = solidFill ? figmaRgbToHex(solidFill) : null;

  function copyCss() {
    if (!cssSpecs) return;
    navigator.clipboard.writeText(cssSpecs);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  }

  return (
    <div className={`bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/50 rounded-xl overflow-hidden shadow-xs flex flex-col lg:flex-row ${className}`}>
      {/* LEFT: Layer Tree Browser */}
      <div className="w-full lg:w-64 border-r border-[#e5e5e5]/40 flex flex-col bg-white/50 shrink-0 h-full">
        <div className="p-3 border-b border-[#e5e5e5]/60 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-black" />
            <span className="text-[13px] font-semibold text-black font-sans">Layer Hierarchy</span>
          </div>
          <span className="text-[10px] font-mono text-[#888] font-semibold">
            {nodes.length} nodes
          </span>
        </div>

        {/* Tree List */}
        <div className="p-2 overflow-y-auto grow flex flex-col gap-0.5 custom-scrollbar">
          {nodes.length === 0 ? (
            <div className="p-4 text-center text-[#888] text-[12px]">No layers available to inspect</div>
          ) : (
            nodes.map((node) => (
              <LayerTreeNode
                key={node.id}
                node={node}
                selectedId={selectedNode?.id}
                onSelect={setSelectedNode}
              />
            ))
          )}
        </div>
      </div>

      {/* RIGHT: Developer CSS & Spec Sheet */}
      <div className="grow p-4 flex flex-col gap-3.5 bg-white/60 backdrop-blur-md overflow-y-auto h-full custom-scrollbar">
        {selectedNode ? (
          <>
            {/* Selected Node Header */}
            <div className="flex items-center justify-between pb-2.5 border-b border-[#f0f0f4] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#f0f0f4]">
                  {selectedNode.type === "TEXT" ? (
                    <Type className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Layers className="w-4 h-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-black font-sans leading-tight">
                    {selectedNode.name}
                  </h4>
                  <span className="text-[10px] font-mono text-[#777]">
                    Type: {selectedNode.type} &middot; ID: {selectedNode.id}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={copyCss}
                className="bg-black text-white hover:bg-black/90 text-[11px] font-medium px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedCss ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedCss ? "Copied CSS!" : "Copy CSS"}
              </button>
            </div>

            {/* Spec Quick Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Dimensions */}
              <div className="p-2.5 rounded-lg bg-[#f8f9fc] border border-[#e5e5ed] flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-[#777] uppercase tracking-wider flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-black" />
                  Size
                </span>
                <span className="text-[12px] font-mono font-medium text-black">
                  {selectedNode.width ? Math.round(selectedNode.width) : 0} &times; {selectedNode.height ? Math.round(selectedNode.height) : 0} px
                </span>
              </div>

              {/* Position */}
              <div className="p-2.5 rounded-lg bg-[#f8f9fc] border border-[#e5e5ed] flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-[#777] uppercase tracking-wider flex items-center gap-1">
                  <Layout className="w-3 h-3 text-black" />
                  Position
                </span>
                <span className="text-[12px] font-mono font-medium text-black">
                  X: {selectedNode.x ? Math.round(selectedNode.x) : 0}, Y: {selectedNode.y ? Math.round(selectedNode.y) : 0}
                </span>
              </div>

              {/* Fill Color */}
              <div className="p-2.5 rounded-lg bg-[#f8f9fc] border border-[#e5e5ed] flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-[#777] uppercase tracking-wider flex items-center gap-1">
                  <Palette className="w-3 h-3 text-black" />
                  Fill Color
                </span>
                <div className="flex items-center gap-1.5">
                  {colorInfo ? (
                    <>
                      <div
                        className="w-3.5 h-3.5 rounded border border-black/20 shrink-0"
                        style={{ backgroundColor: colorInfo.hex }}
                      />
                      <span className="text-[11px] font-mono font-medium text-black">{colorInfo.hex}</span>
                    </>
                  ) : (
                    <span className="text-[11px] text-[#888]">None</span>
                  )}
                </div>
              </div>

              {/* Typography / Border */}
              <div className="p-2.5 rounded-lg bg-[#f8f9fc] border border-[#e5e5ed] flex flex-col gap-0.5">
                <span className="text-[10px] font-medium text-[#777] uppercase tracking-wider flex items-center gap-1">
                  <Type className="w-3 h-3 text-black" />
                  Font / Radius
                </span>
                <span className="text-[11px] font-medium text-black truncate">
                  {selectedNode.type === "TEXT"
                    ? `${selectedNode.fontName?.family || "Inter"} ${selectedNode.fontSize ? Math.round(selectedNode.fontSize) + "px" : ""}`
                    : selectedNode.cornerRadius
                      ? `Radius: ${Math.round(selectedNode.cornerRadius)}px`
                      : "Standard"}
                </span>
              </div>
            </div>

            {/* Generated CSS Block */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-[#555] flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-black" />
                  Generated CSS Output
                </span>
              </div>
              <pre className="p-3 rounded-xl bg-[#111622] text-[#e6edf3] font-mono text-[11px] leading-relaxed overflow-x-auto border border-[#21262d] shadow-inner max-h-[140px] custom-scrollbar">
                <code>{cssSpecs || "/* No layout CSS generated for this layer */"}</code>
              </pre>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 text-[#888] gap-2">
            <Layers className="w-8 h-8 opacity-40" />
            <p className="text-[13px]">Select a layer from the hierarchy tree on the left to inspect CSS specs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
