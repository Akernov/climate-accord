"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [session, setSession] = useState<Session | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleLogout() {
    setIsSubmitting(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signOut();
    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    router.push("/login");
    router.refresh();
  }

  const label =
    (typeof session?.user.user_metadata?.display_name === "string" &&
      session.user.user_metadata.display_name.trim()) ||
    session?.user.email ||
    "Guest";

  return (
    <div className="gameshow-bg relative min-h-screen overflow-hidden p-4 text-slate-950">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-4xl items-center justify-center">
        <div className="gameshow-card w-full max-w-xl rounded-3xl p-7 md:p-10">
          <p className="gameshow-chip inline-block rounded-full bg-[var(--show-orange)] px-4 py-1 text-xs font-extrabold tracking-[0.22em] text-[var(--show-ink)] md:text-sm">
            EXIT STAGE
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            READY TO SIGN OUT?
          </h1>
          <p className="mt-3 text-sm font-semibold text-slate-700 md:text-base">
            Current player: <span className="font-black text-slate-900">{label}</span>
          </p>

          {errorMessage && (
            <p className="gameshow-chip mt-5 rounded-lg bg-[var(--show-pink)] px-3 py-2 text-sm font-bold text-[var(--show-ink)]">
              {errorMessage}
            </p>
          )}

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleLogout}
              disabled={isSubmitting}
              className="gameshow-button rounded-xl bg-[var(--show-yellow)] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-[var(--show-ink)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing Out..." : "Confirm Logout"}
            </button>

            <Link
              href="/"
              className="gameshow-button rounded-xl bg-[var(--show-cyan)] px-4 py-3 text-center text-sm font-black uppercase tracking-widest text-[var(--show-ink)]"
            >
              Cancel
            </Link>
          </div>

          {!session && (
            <p className="mt-4 text-sm font-semibold text-slate-700">
              No active session found. You can return home or login again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
