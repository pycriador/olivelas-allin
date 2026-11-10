// Native Olivelas OAuth helper (replaces external third-party cloud auth)
import { supabase } from "../supabase/client";

type SignInOptions = {
  redirect_uri?: string;
  extraParams?: Record<string, string>;
};

export const lovable = {
  auth: {
    signInWithOAuth: async (provider: "google" | "apple", opts?: SignInOptions) => {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: opts?.redirect_uri || (typeof window !== "undefined" ? window.location.origin : undefined),
          queryParams: opts?.extraParams,
        },
      });
      if (error) {
        return { error };
      }
      return { redirected: Boolean(data?.url), data };
    },
  },
};
