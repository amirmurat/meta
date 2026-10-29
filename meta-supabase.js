import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0/+esm";

export const supabase = createClient(
  "https://munmvexfrtqwmwptafkf.supabase.co",
  "sb_publishable_-4QiT3aG9-a54aKVxTFo3g_CjdpFCWz",
  {
    auth: {
      flowType: "pkce",
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
);

export async function authenticatedUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user) return null;
  return data.user;
}

export async function ensureProfile(user) {
  const { data, error } = await supabase.from("profiles")
    .select("id,display_name,username,learning_goal,about")
    .eq("id", user.id)
    .maybeSingle();
  if (error) throw error;
  if (data) return data;
  const name = user.user_metadata?.full_name || "";
  const { data: created, error: insertError } = await supabase.from("profiles")
    .upsert({id:user.id,display_name:String(name).slice(0,80)}, {onConflict:"id"})
    .select("id,display_name,username,learning_goal,about").single();
  if (insertError) throw insertError;
  return created;
}

export function authPage(redirect = "") {
  const url = new URL("./account.html", window.location.href);
  if (redirect) url.searchParams.set("next", redirect);
  return url.toString();
}
