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
    <div className="gameshow-bg relative min-h-screen overflow-hidden p-4 text-slate-950">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
        <div className="gameshow-card w-full max-w-xl rounded-3xl p-7 md:p-10">
          <p className="gameshow-chip inline-block rounded-full bg-[var(--show-cyan)] px-4 py-1 text-xs font-extrabold tracking-[0.22em] text-[var(--show-ink)] md:text-sm">
            STUDIO ACCESS
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            LOGIN TO PLAY
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-700 md:text-base">
            Step into the arena and join your next climate showdown.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-800">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border-[3px] border-[var(--show-ink)] bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-[0_4px_0_var(--show-ink)] outline-none focus:ring-4 focus:ring-cyan-300"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-800">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border-[3px] border-[var(--show-ink)] bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-[0_4px_0_var(--show-ink)] outline-none focus:ring-4 focus:ring-yellow-300"
                placeholder="Enter your password"
              />
            </div>

            {errorMessage && (
              <p className="gameshow-chip rounded-lg bg-[var(--show-pink)] px-3 py-2 text-sm font-bold text-[var(--show-ink)]">
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="gameshow-button w-full rounded-xl bg-[var(--show-yellow)] px-5 py-3 text-lg font-black uppercase tracking-wider text-[var(--show-ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={signUpHref}
              className="gameshow-button rounded-xl bg-[var(--show-cyan)] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-[var(--show-ink)]"
            >
              Create Account
            </Link>
            <Link
              href="/"
              className="gameshow-button rounded-xl bg-[var(--show-orange)] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-[var(--show-ink)]"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
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
