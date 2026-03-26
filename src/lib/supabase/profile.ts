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
  const { data, error } = await supabase
    .from("game_players")
    .select(`
      game_id, 
      role, 
      created_at,
      games!inner(winner_faction)`)
    .eq("user_id", userId)
    .not("games.winner_faction", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getUserMatchHistory] Failed:", error);
    return { matches: [], error: error.message };
  }

  const matches: MatchRecord[] = data.map((row: any) => ({
    game_id: row.game_id,
    role: row.role as "advocate" | "lobbyist",
    winner_faction: row.games?.winner_faction as "advocate" | "lobbyist",
    created_at: row.created_at,
  }));

  return { matches, error: null };
}