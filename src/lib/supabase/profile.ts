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
