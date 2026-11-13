import { createClient } from "@supabase/supabase-js";
import { auth } from "./firebase.js";

let supabase;

export function getSupabaseClient() {
  if (supabase) return supabase;

  const { VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY } = import.meta.env;
  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  }

  supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, {
    accessToken: async () => {
      const user = auth.currentUser;
      if (!user) throw new Error("Sign in with Firebase before accessing account data.");
      return user.getIdToken();
    },
  });

  return supabase;
}
