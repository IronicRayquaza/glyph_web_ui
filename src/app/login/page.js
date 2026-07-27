"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUpDefault = searchParams.get("signup") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(isSignUpDefault);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleAuth(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpErr) throw signUpErr;

        if (data && !data.session) {
          setError("Confirmation link sent to your email. Please verify and log in.");
        } else {
          router.push("/dashboard");
        }
      } else {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInErr) throw signInErr;
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-lg border border-[#e5e5e5] rounded overflow-hidden shadow-sm flex flex-col">
      {/* Login / Sign Up Tabs Selection */}
      <div className="flex select-none">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
          }}
          className={`flex-1 text-center py-[14px] text-[13px] font-bold transition-all cursor-pointer border-b-2 ${
            !isSignUp 
              ? "bg-white/85 text-black border-black" 
              : "bg-[#f2f5f8]/80 text-[#555555] border-[#e5e5e5] hover:text-black"
          }`}
        >
          Login
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true);
            setError(null);
          }}
          className={`flex-1 text-center py-[14px] text-[13px] font-bold transition-all cursor-pointer border-b-2 ${
            isSignUp 
              ? "bg-white/85 text-black border-black" 
              : "bg-[#f2f5f8]/80 text-[#555555] border-[#e5e5e5] hover:text-black"
          }`}
        >
          Sign Up
        </button>
      </div>

      <div className="p-8 md:p-10 flex flex-col gap-sm">
        {error && (
          <div className="bg-error-container text-on-error-container border border-error/20 text-body-sm p-sm rounded-DEFAULT">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="flex flex-col gap-sm">
          {/* Email input field */}
          <div className="flex flex-col gap-base">
            <label className="text-[12px] font-bold text-black" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="bg-white border border-[#c5c5c5] focus:border-black focus:ring-1 focus:ring-black rounded px-sm py-[7px] text-[13px] text-black placeholder-[#999999] outline-none transition-colors"
              required
            />
          </div>

          {/* Password input field */}
          <div className="flex flex-col gap-base">
            <div className="flex justify-between items-center">
              <label className="text-[12px] font-bold text-black" htmlFor="password">
                Password
              </label>
              <a href="#" className="text-[11px] text-[#666666] hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-white border border-[#c5c5c5] focus:border-black focus:ring-1 focus:ring-black rounded px-sm py-[7px] text-[13px] text-black placeholder-[#999999] outline-none transition-colors"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white hover:bg-black/90 font-bold text-[13px] py-sm rounded-DEFAULT cursor-pointer transition-colors mt-base"
          >
            {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        {/* Divider line */}
        <div className="relative flex py-xs items-center select-none">
          <div className="flex-grow border-t border-[#e5e5e5]"></div>
          <span className="flex-shrink mx-sm text-[11px] text-[#888888] font-medium">Or continue with</span>
          <div className="flex-grow border-t border-[#e5e5e5]"></div>
        </div>

        {/* Social logins with SVG logos */}
        <div className="grid grid-cols-2 gap-sm">
          <button className="bg-white border border-[#c5c5c5] text-black hover:bg-[#fafafa] font-bold text-[12px] py-sm rounded-DEFAULT flex items-center justify-center gap-xs cursor-pointer transition-colors">
            {/* GitHub Silhouette SVG */}
            <svg className="w-[14px] h-[14px] fill-current" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </button>
          <button className="bg-white border border-[#c5c5c5] text-black hover:bg-[#fafafa] font-bold text-[12px] py-sm rounded-DEFAULT flex items-center justify-center gap-xs cursor-pointer transition-colors">
            {/* Google Brand G SVG */}
            <svg className="w-[14px] h-[14px]" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.69c-.29 1.5-1.14 2.78-2.4 3.63v3.02h3.89c2.28-2.1 3.56-5.17 3.56-8.5z"/>
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.89-3.02c-1.08.72-2.45 1.16-4.04 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.11C3.18 21.88 7.39 24 12 24z"/>
              <path fill="#FBBC05" d="M5.32 14.27c-.24-.72-.38-1.49-.38-2.27s.14-1.55.38-2.27V6.62H1.21C.44 8.15 0 9.88 0 11.7c0 1.82.44 3.55 1.21 5.08l4.11-3.11z"/>
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.39 0 3.18 2.12 1.21 5.8l4.11 3.11c.94-2.85 3.57-4.96 6.68-4.96z"/>
            </svg>
            Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-sm overflow-hidden bg-white">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/From%20Klickpin.com-%20Copy%20this%20guide%20to%20beautiful%20reception%20ideas%20ideas%20youll%20want%20to%20recreate%20this%20weekend%20for%20a%20stylish%20result%20that%20still%20feels%20ef.mp4" type="video/mp4" />
      </video>

      {/* No dark overlay overlay; blends directly with the login card */}

      {/* Content Layout Column */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-[480px]">
        {/* GitDesign Branding Header */}
        <div className="flex flex-col items-center gap-base mb-lg text-center select-none">
          <div className="flex items-center gap-xs text-headline-xl font-headline-xl font-bold tracking-tight text-black">
            {/* Logo SVG matching reference style */}
            <svg className="w-8 h-8 inline-block text-black" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h5m8 0h5M12 8a4 4 0 110 8 4 4 0 010-8z" />
            </svg>
            <span className="font-sans">GitDesign</span>
          </div>
          <p className="text-[12px] text-[#555555] tracking-wide uppercase font-medium">
            Design Systems Version Control
          </p>
        </div>

        <Suspense fallback={
          <div className="w-full bg-white/80 backdrop-blur-lg border border-[#e5e5e5] rounded p-8 flex flex-col items-center justify-center min-h-[340px]">
            <span className="material-symbols-outlined animate-spin text-2xl text-black">progress_activity</span>
            <p className="text-secondary text-body-sm mt-sm">Loading login credentials...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer disclaimer links */}
        <p className="mt-6 text-[11px] text-[#666666] text-center w-full max-w-[340px] leading-normal">
          By continuing, you agree to GitDesign's{" "}
          <a href="#" className="underline text-black font-semibold hover:opacity-85">Terms of Service</a> and{" "}
          <a href="#" className="underline text-black font-semibold hover:opacity-85">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
