"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RootRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuthAndRedirect() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          router.replace("/dashboard");
        } else {
          router.replace("/login");
        }
      } catch (error) {
        router.replace("/login");
      }
    }
    checkAuthAndRedirect();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#f6f6f6] flex items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-[#666666]">
        <span className="material-symbols-outlined animate-spin text-[24px] text-black">progress_activity</span>
        <span className="text-[12px] font-sans font-medium">Redirecting...</span>
      </div>
    </div>
  );
}
