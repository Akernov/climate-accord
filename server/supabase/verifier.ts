import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

let verifierClient: SupabaseClient | null = null;

function requireServerEnv(): { url: string; key: string } {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE;

  if (!url) {
    throw new Error("Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL).");
  }

  if (!key) {
    throw new Error(
      "Missing SUPABASE_PUBLISHABLE_KEY/SUPABASE_ANON_KEY (or NEXT_PUBLIC fallback).",
    );
  }

  return { url, key };
}

export function getSupabaseVerifierClient(): SupabaseClient {
  if (verifierClient) {
    return verifierClient;
  }

  const { url, key } = requireServerEnv();
  verifierClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  return verifierClient;
}

export type VerifiedUserResult =
  | { user: User; error: null }
  | { user: null; error: string };

export async function verifyAccessToken(accessToken: string): Promise<VerifiedUserResult> {
  const token = accessToken.trim();
  if (!token) {
    return { user: null, error: "Missing access token." };
  }

  const client = getSupabaseVerifierClient();
  const { data, error } = await client.auth.getUser(token);

  if (error || !data.user) {
    return { user: null, error: error?.message ?? "Invalid access token." };
  }

  return { user: data.user, error: null };
}

export function readBearerToken(authorizationHeader: string | undefined): string {
  if (!authorizationHeader) {
    return "";
  }

  const [scheme, token] = authorizationHeader.split(" ");
  if (!scheme || !token) {
    return "";
  }

  return scheme.toLowerCase() === "bearer" ? token : "";
}
