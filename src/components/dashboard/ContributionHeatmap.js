"use client";

import { useState, useMemo } from "react";
import { Calendar } from "lucide-react";

// Robust local YYYY-MM-DD date key generator
function getDayKey(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ContributionHeatmap({ commits = [], onResetFilter }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const CELL_SIZE = 12;
  const GAP_SIZE = 3;
  const COL_STEP = CELL_SIZE + GAP_SIZE; // 15px exact step per week column

  // Generate 24 weeks of activity history
  const { cols, monthHeaders, totalCommitsCount } = useMemo(() => {
    const contributionMap = {};
    commits.forEach((c) => {
      const key = getDayKey(c.timestamp);
      if (key) {
        contributionMap[key] = (contributionMap[key] || 0) + 1;
      }
    });

    const WEEKS_TO_SHOW = 24;
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - WEEKS_TO_SHOW * 7);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const columns = [];
    let cursor = new Date(startDate);
    let totalCount = 0;

    while (cursor <= today) {
      const col = [];
      for (let d = 0; d < 7; d++) {
        if (cursor > today) break;
        const key = getDayKey(cursor);
        const count = contributionMap[key] || 0;
        totalCount += count;
        col.push({
          key,
          count,
          date: new Date(cursor),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      columns.push(col);
    }

    // Calculate month headers (prevent overlapping labels)
    const monthList = [];
    let lastMonth = -1;
    let lastColIdx = -4;

    columns.forEach((col, colIdx) => {
      if (col.length > 0) {
        const month = col[0].date.getMonth();
        if (month !== lastMonth && colIdx - lastColIdx >= 3) {
          monthList.push({
            colIdx,
            label: col[0].date.toLocaleString("en-US", { month: "short" }),
          });
          lastMonth = month;
          lastColIdx = colIdx;
        }
      }
    });

    return {
      cols: columns,
      monthHeaders: monthList,
      totalCommitsCount: totalCount,
    };
  }, [commits]);

  return (
    <div className="bg-white/80 backdrop-blur-md border border-[#e5e5e5]/60 rounded-xl p-6 shadow-sm flex flex-col justify-between h-full gap-4">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-black" />
          <h2 className="text-[16px] font-bold text-black font-sans tracking-tight">
            Activity Heatmap
          </h2>
          <span className="text-[11px] font-semibold text-[#666666] bg-[#f0f0f0] px-2.5 py-0.5 rounded-full border border-[#e0e0e0]">
            {totalCommitsCount || commits.length} Commits
          </span>
        </div>

        <button
          type="button"
          onClick={onResetFilter}
          className="text-[11px] font-bold text-[#666666] hover:text-black hover:underline cursor-pointer"
        >
          Reset Filter
        </button>
      </div>

      {/* Grid Container */}
      <div className="flex flex-col gap-1.5 overflow-x-auto overflow-y-hidden py-2 grow justify-center scrollbar-thin">
        {/* Month Headers Row */}
        <div className="flex items-center text-[10px] text-[#777777] font-semibold select-none relative h-4 w-full">
          {monthHeaders.map((m, idx) => (
            <span
              key={idx}
              className="absolute"
              style={{
                left: `${m.colIdx * COL_STEP}px`,
              }}
            >
              {m.label}
            </span>
          ))}
        </div>

        {/* Cells Matrix */}
        <div className="flex gap-0.75 items-start">
          {cols.map((col, cIdx) => (
            <div key={cIdx} className="flex flex-col gap-0.75">
              {col.map((cell) => {
                const formattedDate = cell.date.toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                const tooltipText = `${cell.count} commit${cell.count === 1 ? "" : "s"} on ${formattedDate}`;

                return (
                  <div
                    key={cell.key}
                    onMouseEnter={() => setHoveredCell({ text: tooltipText, count: cell.count, dateStr: formattedDate })}
                    onMouseLeave={() => setHoveredCell(null)}
                    className="w-3 h-3 rounded-[2px] cursor-pointer transition-all shrink-0 hover:ring-2 hover:ring-black"
                    style={{
                      backgroundColor: cell.count === 1 ? "#9be9a8" : cell.count === 2 ? "#40c463" : cell.count === 3 ? "#30a14e" : cell.count >= 4 ? "#216e39" : "#e5e7eb",
                      borderColor: cell.count === 1 ? "#7edb8d" : cell.count === 2 ? "#34b055" : cell.count === 3 ? "#268c41" : cell.count >= 4 ? "#1b5e30" : "#d1d5db",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}
                    title={tooltipText}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend & Hover Status Footer */}
      <div className="flex items-center justify-between text-[11px] text-[#666666] pt-3 border-t border-[#f0f0f0]">
        <div className="text-[11px] font-medium text-[#555555] truncate">
          {hoveredCell ? (
            <span className="font-semibold text-black">{hoveredCell.text}</span>
          ) : (
            <span className="text-[#777777]">Hover over any cell to view date & commits</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 select-none shrink-0">
          <span className="text-[10px] text-[#888888]">Less</span>
          <div className="w-2.5 h-2.5 bg-[#e5e7eb] border border-[#d1d5db] rounded-[2px]" />
          <div className="w-2.5 h-2.5 bg-[#9be9a8] border border-[#7edb8d] rounded-[2px]" />
          <div className="w-2.5 h-2.5 bg-[#40c463] border border-[#34b055] rounded-[2px]" />
          <div className="w-2.5 h-2.5 bg-[#30a14e] border border-[#268c41] rounded-[2px]" />
          <div className="w-2.5 h-2.5 bg-[#216e39] border border-[#1b5e30] rounded-[2px]" />
          <span className="text-[10px] text-[#888888]">More</span>
        </div>
      </div>
    </div>
  );
}
