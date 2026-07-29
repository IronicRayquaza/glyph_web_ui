"use client";

export default function StatsGlance({ commits = [], reposList = [], notifications = [] }) {
  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const uniqueContributorsCount = [...new Set(commits.map((c) => c.author))].filter(Boolean).length;

  return (
    <div className="bg-white/70 backdrop-blur-lg border border-[#e5e5e5]/40 p-md rounded-xl flex flex-col gap-sm shadow-xs z-10">
      <h2 className="text-[13px] font-bold text-black font-sans">Stats at a glance</h2>

      <div className="flex flex-col gap-sm pt-base">
        <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
          <span className="text-[12px] text-[#555555]">Total Commits</span>
          <span className="text-[16px] font-bold font-sans text-black">{commits.length}</span>
        </div>
        <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
          <span className="text-[12px] text-[#555555]">Design Files</span>
          <span className="text-[16px] font-bold font-sans text-black">{reposList.length}</span>
        </div>
        <div className="flex items-center justify-between border-b border-[#f5f5f5]/40 pb-base">
          <span className="text-[12px] text-[#555555]">Notifications</span>
          <span className="text-[16px] font-bold font-sans text-black">
            {unreadNotifCount > 0 ? (
              <span className="flex items-center gap-1">
                {unreadNotifCount}
                <span className="text-[10px] text-[#888] font-normal">unread</span>
              </span>
            ) : (
              notifications.length
            )}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-[#555555]">Contributors</span>
          <span className="text-[16px] font-bold font-sans text-black">{uniqueContributorsCount}</span>
        </div>
      </div>
    </div>
  );
}
