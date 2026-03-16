"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { ensureProfileExists } from "@/lib/supabase/profile";

function getSafeNextPath(rawPath: string | null): string {
  if (!rawPath) {
    return "/";
  }

  return rawPath.startsWith("/") ? rawPath : "/";
}

export default function SignupPage() {
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
      setErrorMessage(error.message);
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

    // Since we disabled email auth, if there is NO error and NO session, something is weird.
    // Replace the old success message advising them to check their inbox:
    setErrorMessage("An unexpected error occurred during signup.");
    setIsSubmitting(false);
  }

  const loginHref = `/login?next=${encodeURIComponent(nextPath)}`;

  return (
    <div className="gameshow-bg relative min-h-screen overflow-hidden p-4 text-slate-950">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center">
        <div className="gameshow-card w-full max-w-2xl rounded-3xl p-7 md:p-10">
          <p className="gameshow-chip inline-block rounded-full bg-[var(--show-yellow)] px-4 py-1 text-xs font-extrabold tracking-[0.22em] text-[var(--show-ink)] md:text-sm">
            NEW CONTESTANT
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            CREATE YOUR PLAYER CARD
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-700 md:text-base">
            Sign up and jump into the next fast-paced policy battle.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-800">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border-[3px] border-[var(--show-ink)] bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-[0_4px_0_var(--show-ink)] outline-none focus:ring-4 focus:ring-cyan-300"
                placeholder="How other players see you"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-800">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border-[3px] border-[var(--show-ink)] bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-[0_4px_0_var(--show-ink)] outline-none focus:ring-4 focus:ring-yellow-300"
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
                className="mt-1 w-full rounded-xl border-[3px] border-[var(--show-ink)] bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-[0_4px_0_var(--show-ink)] outline-none focus:ring-4 focus:ring-pink-300"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-bold uppercase tracking-wide text-slate-800">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                className="mt-1 w-full rounded-xl border-[3px] border-[var(--show-ink)] bg-white px-4 py-3 text-base font-semibold text-slate-900 shadow-[0_4px_0_var(--show-ink)] outline-none focus:ring-4 focus:ring-orange-300"
                placeholder="Re-enter password"
              />
            </div>

            {errorMessage && (
              <p className="gameshow-chip md:col-span-2 rounded-lg bg-[var(--show-pink)] px-3 py-2 text-sm font-bold text-[var(--show-ink)]">
                {errorMessage}
              </p>
            )}

            {successMessage && (
              <p className="gameshow-chip md:col-span-2 rounded-lg bg-[var(--show-cyan)] px-3 py-2 text-sm font-bold text-[var(--show-ink)]">
                {successMessage}
              </p>
            )}

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="gameshow-button w-full rounded-xl bg-[var(--show-orange)] px-5 py-3 text-lg font-black uppercase tracking-wider text-[var(--show-ink)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating Account..." : "Sign Up"}
              </button>
            </div>
          </form>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href={loginHref}
              className="gameshow-button rounded-xl bg-[var(--show-cyan)] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-[var(--show-ink)]"
            >
              Go To Login
            </Link>
            <Link
              href="/"
              className="gameshow-button rounded-xl bg-[var(--show-yellow)] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-[var(--show-ink)]"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
