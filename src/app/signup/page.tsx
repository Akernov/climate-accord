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

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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
    setSuccessMessage("");

    const normalizedName = displayName.trim();
    if (!normalizedName) {
      setErrorMessage("Please choose a display name.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password should be at least 8 characters.");
      return;
    }

    setIsSubmitting(true);

    // Check if display name already taken
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("display_name", normalizedName);

    if (count && count > 0) {
      setErrorMessage("That display name is already taken. Please choose another.");
      setIsSubmitting(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: normalizedName,
        },
      },
    });

    if (error) {
      if (error.message.includes("Database error saving new user")) {
        setErrorMessage("That display name (or email) is already registered. Please try another.");
      } else {
        setErrorMessage(error.message);
      }
      setIsSubmitting(false);
      return;
    }

    if (data.session) {
      if (data.user) {
        const profileResult = await ensureProfileExists(supabase, data.user, normalizedName);
        if (profileResult.error) {
          setErrorMessage(`Account created, but profile sync failed: ${profileResult.error}`);
          setIsSubmitting(false);
          return;
        }
      }

      router.push(nextPath);
      router.refresh();
      return;
    }

    setErrorMessage("An unexpected error occurred during signup.");
    setIsSubmitting(false);
  }

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

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
            Create your player card
          </p>
        </header>

        {/* Form Card */}
        <main className="flex flex-1 items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-gray-900/90 backdrop-blur-sm rounded-xl border border-gray-700 shadow-xl p-6 md:p-8">

            <h2 className="text-2xl font-bold text-center mb-6">Sign Up</h2>

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Display Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="How other players see you"
                />
              </div>

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

              {/* Password & Confirm Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    placeholder="At least 8 characters"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Re-enter password"
                  />
                </div>
              </div>

              {/* Error / Success Messages */}
              {errorMessage && (
                <div className="bg-red-900/50 border border-red-700 text-red-200 rounded-lg px-4 py-3 text-sm">
                  {errorMessage}
                </div>
              )}
              {successMessage && (
                <div className="bg-green-900/50 border border-green-700 text-green-200 rounded-lg px-4 py-3 text-sm">
                  {successMessage}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-700 text-white text-xl font-bold py-3 px-8 rounded-lg border-4 border-green-900 shadow-lg hover:scale-105 hover:bg-green-800 hover:shadow-[0_0_25px_rgba(34,197,94,0.6)] transition-all disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
              >
                {isSubmitting ? "Creating Account..." : "Sign Up"}
              </button>
            </form>

            {/* Action Links */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <Link
                href={loginHref}
                className="text-center bg-blue-700 text-white font-bold py-3 px-4 rounded-lg border-4 border-blue-900 shadow-lg hover:scale-105 hover:bg-blue-800 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] transition-all"
              >
                Go To Login
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

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-black">Loading...</div>}>
      <SignupContent />
    </Suspense>
  );
}
