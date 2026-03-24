"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureProfileExists } from "@/lib/supabase/profile";

function getSafeNextPath(rawPath: string | null): string {
  if (!rawPath) {
    return "/";
  }
  return rawPath.startsWith("/") ? rawPath : "/";
}

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      if (data.session && !data.session.user.is_anonymous) {
        router.replace(nextPath);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [supabase, router, nextPath]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    if (data.user) {
      const profileResult = await ensureProfileExists(supabase, data.user);
      if (profileResult.error) {
        setErrorMessage(`Signed in, but profile sync failed: ${profileResult.error}`);
        setIsSubmitting(false);
        return;
      }
    }

    router.push(nextPath);
    router.refresh();
  }

  const signUpHref = `/signup?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="relative min-h-screen mx-auto flex flex-col overflow-hidden text-white">

      {/* ===== BACKGROUND LAYERS ===== */}
      {/* World map image */}
      <div className="absolute inset-0 bg-[url('/images/worldmapbackground.png')] bg-cover bg-center opacity-15 blur-[2px]" />

      {/* Green gradient overlay */}
      <div className="absolute inset-0 animate-greenPulse bg-gradient-to-br from-green-400/50 via-transparent to-transparent blur-[40px]" />

      {/* Gray gradient overlay */}
      <div className="absolute inset-0 animate-grayPulse bg-gradient-to-tr from-gray-300/30 via-transparent to-transparent blur-[40px]" />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40" />

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 flex flex-col min-h-screen">

        {/* Header / Title */}
        <header className="text-center py-12">
          <h1 className="text-7xl font-extrabold tracking-widest text-gray-300 drop-shadow-lg">
            CLIMATE <br /> ACCORD
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            Login to continue your climate battle
          </p>
        </header>

        {/* Form Card */}
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl p-6 md:p-8">

            <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              {/* Error Message */}
              {errorMessage && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
                  {errorMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-700 text-white text-xl font-bold py-3 px-8 rounded-lg border-4 border-green-900 shadow-lg hover:scale-105 hover:bg-green-800 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
              </button>
            </form>

            {/* Action Links */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link
                href={signUpHref}
                className="text-center bg-blue-700 text-white font-bold py-3 px-4 rounded-lg border-4 border-blue-900 shadow-lg hover:scale-105 hover:bg-blue-800 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all"
              >
                Create Account
              </Link>
              <Link
                href="/"
                className="text-center bg-gray-800 text-white font-bold py-3 px-4 rounded-lg border-4 border-black shadow-lg hover:scale-105 hover:bg-gray-900 transition-all"
              >
                Back Home
              </Link>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="text-center pb-6 text-gray-600">
          A SENG 401 Project
        </footer>
      </div>

      {/* ===== ANIMATION STYLES ===== */}
      <style>{`
        @keyframes greenPulse {
          0%, 100% {
            opacity: 0.7;
            transform: scale(1);
          }
          50% {
            opacity: 0.2;
            transform: scale(1.05);
          }
        }

        @keyframes grayPulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1.05);
          }
          50% {
            opacity: 0.7;
            transform: scale(1);
          }
        }

        .animate-greenPulse {
          animation: greenPulse 8s ease-in-out infinite;
        }

        .animate-grayPulse {
          animation: grayPulse 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-black">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
