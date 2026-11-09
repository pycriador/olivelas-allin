import { setStorage } from "@/core/providers/storage";
import { SupabaseProvider } from "@/core/providers/storage/SupabaseProvider";
import { isSupabaseConfigured } from "@/lib/supabase";

if (isSupabaseConfigured()) {
  setStorage(new SupabaseProvider());
}
