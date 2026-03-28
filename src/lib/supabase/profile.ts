import { stringToBase64URL } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";

function deriveDisplayName(user: User, preferredDisplayName?: string): string {
  const preferred = preferredDisplayName?.trim();
  if (preferred) {
    return preferred;
  }

  const fromMetadata =
    (typeof user.user_metadata?.display_name === "string" &&
      user.user_metadata.display_name.trim()) ||
    (typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim());

  if (fromMetadata) {
    return fromMetadata;
  }

  if (typeof user.email === "string" && user.email.trim()) {
    return user.email.split("@")[0];
  }

  return `user-${user.id.slice(0, 8)}`;
}

export async function ensureProfileExists(
  supabase: SupabaseClient,
  user: User,
  preferredDisplayName?: string,
): Promise<{ error: string | null }> {
  const displayName = deriveDisplayName(user, preferredDisplayName);

  const { error } = await supabase.from("profiles").upsert(
    {
      user_id: user.id,
      display_name: displayName,
    },
    {
      onConflict: "user_id",
      ignoreDuplicates: true,
    },
  );

  return { error: error?.message ?? null };
}

export type MatchRecord = {
  game_id: string;
  role: "advocate" | "lobbyist";
  winner_faction: "advocate" | "lobbyist";
  created_at: string;
}

export async function getUserMatchHistory(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ matches: MatchRecord[]; error: string | null }> {
  console.log("[getUserMatchHistory] Starting fetch for userId:", userId);
  const { data, error } = await supabase
    .from("game_players")
    .select(`
      game_id, 
      role, 
      created_at,
      games:games!game_players_game_id_fkey(winner_faction)`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserMatchHistory] Query error:", error);
    return { matches: [], error: error.message };
  }

  // Diagnostic Log to see exact structure from Supabase
  console.log("[getUserMatchHistory] Raw JSON from Supabase:", JSON.stringify(data, null, 2));

  const matches: MatchRecord[] = (data || [])
    .filter((row: any) => {
      const g = Array.isArray(row.games) ? row.games[0] : row.games;
      // Filter for finished games that have a winner
      return g && g.winner_faction !== null;
    })
    .map((row: any) => {
      const g = Array.isArray(row.games) ? row.games[0] : row.games;
      return {
        game_id: row.game_id,
        role: (row.role ?? "advocate") as "advocate" | "lobbyist",
        winner_faction: g.winner_faction as "advocate" | "lobbyist",
        created_at: row.created_at,
      };
    });

  console.log("[getUserMatchHistory] Successfully mapped matches:", matches.length);
  return { matches, error: null };
}