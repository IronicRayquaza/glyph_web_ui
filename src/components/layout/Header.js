"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import NotificationsDropdown from "@/components/dashboard/NotificationsDropdown";
import { Search, Bell, Plus } from "lucide-react";
import Image from "next/image";

export default function Header({
  user,
  notifications = [],
  isNotifOpen,
  setIsNotifOpen,
  markAllRead,
  markNotifRead,
  setIsSearchOpen,
  onSignOut,
}) {
  const notifRef = useRef(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsNotifOpen]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="bg-white/70 backdrop-blur-lg border-b border-[#e5e5e5]/40 h-16 flex justify-between items-center px-6 sticky top-0 z-20">
      <div className="flex items-center gap-8 grow max-w-4xl">
        <Link href="/" className="text-[18px] font-bold font-sans tracking-tight text-black select-none flex items-center gap-2.5">
          <Image width={36} height={36} src="/logo.svg" alt="Oleidian Logo" className="w-7 h-7 rounded-md object-contain" />
          <span>Oleidian</span>
        </Link>

        {/* Small GitHub-style Search Trigger Button */}
        <div
          onClick={() => setIsSearchOpen(true)}
          className="relative w-60 bg-white/60 hover:bg-white/80 border border-[#d5d5d5]/30 rounded-lg px-3 py-1.5 flex items-center justify-between text-[12px] text-[#666666] cursor-pointer select-none transition-colors"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-[#666666]" />
            <span>
              Type <span className="font-mono">/</span> to search
            </span>
          </div>
          <span className="border border-[#c5c5c5]/40 bg-white/80 rounded px-1.5 text-[9px] font-mono text-[#888888]">
            /
          </span>
        </div>
      </div>

      {/* Right Header Controls */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-[#555555] hover:text-black p-2 rounded-lg cursor-pointer transition-colors relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black rounded-full border-2 border-white" />
            )}
          </button>

          {isNotifOpen && (
            <NotificationsDropdown
              notifications={notifications}
              markAllRead={markAllRead}
              markNotifRead={markNotifRead}
              onClose={() => setIsNotifOpen(false)}
            />
          )}
        </div>

        {/* New PR Button */}
        <Link
          href="/dashboard/pulls/new"
          className="bg-black text-white hover:bg-black/90 font-bold text-[12px] px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-white" />
          New PR
        </Link>

        {/* User Avatar Initials */}
        <button
          type="button"
          onClick={onSignOut}
          className="w-8 h-8 rounded-full border border-[#c5c5c5]/40 flex items-center justify-center text-[12px] font-bold bg-white/70 hover:bg-black hover:text-white transition-colors cursor-pointer select-none"
          title="Sign out"
        >
          {user?.email ? user.email.slice(0, 2).toUpperCase() : "U"}
        </button>
      </div>
    </header>
  );
}
