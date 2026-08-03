"use client";

import { useState, useRef, useEffect } from "react";
import { FolderGit2, ChevronDown, Check } from "lucide-react";

export default function CustomRepoDropdown({ selectedRepo, setSelectedRepo, repoList = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const options = [
    { value: "__all__", label: "All Repositories" },
    ...repoList.map((r) => ({ value: r, label: `oleidian/${r}` })),
  ];

  const selectedOption = options.find((o) => o.value === selectedRepo) || options[0];

  return (
    <div className="relative shrink-0 z-30" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-white hover:bg-[#fafafa] border border-[#e0e0e0] focus:border-black rounded-lg px-3.5 py-2 text-[12px] font-bold text-black flex items-center gap-2.5 transition-colors cursor-pointer shadow-xs min-w-48 justify-between"
      >
        <div className="flex items-center gap-2 truncate">
          <FolderGit2 className="w-4 h-4 text-[#666666] shrink-0" />
          <span className="truncate">{selectedOption.label}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#888888] transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-60 bg-white border border-[#e0e0e0] rounded-xl shadow-2xl z-999 py-1.5 flex flex-col overflow-hidden">
          <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#888888] border-b border-[#f0f0f2]">
            Filter Repository
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {options.map((opt) => {
              const isSelected = selectedRepo === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setSelectedRepo(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3.5 py-2 text-[12px] text-left transition-colors flex items-center justify-between cursor-pointer ${
                    isSelected ? "bg-[#f4f4f6] font-bold text-black" : "text-[#444444] hover:bg-[#fafafa]"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <Check className="w-4 h-4 text-black shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
