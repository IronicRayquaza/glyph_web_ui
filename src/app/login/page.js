"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { BsGithub } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import Image from "next/image";

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
    <div className="w-full max-w-120 bg-white/80 backdrop-blur-lg border border-[#e5e5e5] rounded overflow-hidden shadow-sm flex flex-col">
      {/* Login / Sign Up Tabs Selection */}
      <div className="flex select-none">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false);
            setError(null);
          }}
          className={`flex-1 text-center py-3.5 text-[13px] font-bold transition-all cursor-pointer border-b-2 ${
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
          className={`flex-1 text-center py-3.5 text-[13px] font-bold transition-all cursor-pointer border-b-2 ${
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
              className="bg-white border border-[#c5c5c5] focus:border-black focus:ring-1 focus:ring-black rounded px-sm py-1.75 text-[13px] text-black placeholder-[#999999] outline-none transition-colors"
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
              className="bg-white border border-[#c5c5c5] focus:border-black focus:ring-1 focus:ring-black rounded px-sm py-1.75 text-[13px] text-black placeholder-[#999999] outline-none transition-colors"
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
          <div className="grow border-t border-[#e5e5e5]"></div>
          <span className="shrink mx-sm text-[11px] text-[#888888] font-medium">Or continue with</span>
          <div className="grow border-t border-[#e5e5e5]"></div>
        </div>

        {/* Social logins with SVG logos */}
        <div className="grid grid-cols-2 gap-sm">
          <button className="bg-white border border-[#c5c5c5] text-black hover:bg-[#fafafa] font-bold text-[16px] py-sm rounded-DEFAULT flex items-center justify-center gap-xs cursor-pointer transition-colors">
            <BsGithub />
            GitHub
          </button>
          <button className="bg-white border border-[#c5c5c5] text-black hover:bg-[#fafafa] font-bold text-[16px] py-sm rounded-DEFAULT flex items-center justify-center gap-xs cursor-pointer transition-colors">
            <FcGoogle />
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
      <div className="relative z-10 flex flex-col items-center w-full max-w-120">
        {/* Oleidian Branding Header */}
        <div className="flex flex-col items-center gap-base mb-lg text-center select-none">
          <div className="flex items-center gap-2.5 text-headline-xl font-headline-xl font-bold tracking-tight text-black">
            <Image width={36} height={36} src="/logo.svg" alt="Oleidian Logo" className="w-9 h-9 rounded-lg object-contain shadow-xs" />
            <span className="font-sans">Oleidian</span>
          </div>
          <p className="text-[12px] text-[#555555] tracking-wide uppercase font-medium">
            Design Systems Version Control
          </p>
        </div>

        <Suspense fallback={
          <div className="w-full bg-white/80 backdrop-blur-lg border border-[#e5e5e5] rounded p-8 flex flex-col items-center justify-center min-h-85">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <p className="text-secondary text-body-sm mt-sm">Loading login credentials...</p>
          </div>
        }>
          <LoginForm />
        </Suspense>

        {/* Footer disclaimer links */}
        <p className="mt-6 text-[11px] text-[#666666] text-center w-full max-w-85 leading-normal">
          By continuing, you agree to Oleidian&apos;s{" "}
          <a href="#" className="underline text-black font-semibold hover:opacity-85">Terms of Service</a> and{" "}
          <a href="#" className="underline text-black font-semibold hover:opacity-85">Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
}
