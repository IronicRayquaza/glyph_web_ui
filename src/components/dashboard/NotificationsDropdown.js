"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, GitMerge, MessageSquare, Bell } from "lucide-react";

export default function NotificationsDropdown({ notifications = [], markAllRead, markNotifRead, onClose }) {
  const router = useRouter();

  const getNotifIconAndColor = (type) => {
    switch (type) {
      case "approve":
        return { Icon: CheckCircle2, color: "text-emerald-500" };
      case "request_changes":
        return { Icon: AlertCircle, color: "text-amber-500" };
      case "merged":
        return { Icon: GitMerge, color: "text-purple-500" };
      case "review_requested":
        return { Icon: MessageSquare, color: "text-blue-500" };
      default:
        return { Icon: Bell, color: "text-[#888]" };
    }
  };

  const handleNotificationClick = (n) => {
    if (markNotifRead) markNotifRead(n.id);
    if (n.pr_id) router.push(`/dashboard/pulls/${n.pr_id?.toString().slice(0, 6)}`);
    if (onClose) onClose();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-85 bg-white border border-[#e0e0e0] rounded-lg shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#f0f0f0] bg-[#fafafa]">
        <span className="text-[13px] font-bold text-black">Notifications</span>
        {notifications.some((n) => !n.read) && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-[11px] text-[#666] hover:text-black transition-colors cursor-pointer"
          >
            Mark all read
          </button>
        )}
      </div>
      <div className="max-h-90 overflow-y-auto divide-y divide-[#f5f5f5]">
        {notifications.length === 0 ? (
          <div className="px-4 py-8 text-center flex flex-col items-center gap-2 text-[#aaa]">
            <Bell className="w-7 h-7 opacity-40" />
            <span className="text-[12px]">No notifications yet</span>
          </div>
        ) : (
          notifications.map((n) => {
            const { Icon, color } = getNotifIconAndColor(n.type);
            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                className={`px-4 py-3 flex items-start gap-3 cursor-pointer transition-colors ${
                  !n.read ? "bg-[#f8f8ff] hover:bg-[#f0f0ff]" : "hover:bg-[#fafafa]"
                }`}
              >
                <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
                <div className="grow min-w-0">
                  <p className={`text-[12px] leading-tight ${!n.read ? "font-semibold text-black" : "text-[#555]"}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-[#888] mt-0.5 leading-snug truncate">{n.body}</p>
                </div>
                {!n.read && <div className="w-2 h-2 bg-black rounded-full shrink-0 mt-1" />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
