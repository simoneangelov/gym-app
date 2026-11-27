import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DEFAULT_THEME, isTheme, type Theme } from "@/lib/theme";
import { isWeightUnit, type WeightUnit } from "@/lib/units";
import { supabaseKey, supabaseUrl } from "./env";

// Create a new client per request — never share one across requests.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // The proxy refreshes the session, so this is safe to ignore.
        }
      },
    },
  });
}

export async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return { supabase, userId: userId ?? null, email: (data?.claims?.email as string | undefined) ?? null };
}

/**
 * The signed-in user's settings. Falls back to defaults when there is no
 * profile row yet (or a profiles migration has not been applied — hence
 * select("*") rather than naming columns that may not exist).
 * Cached per request so the nav and the page share one query.
 */
export const getProfile = cache(async (): Promise<{ weightUnit: WeightUnit; theme: Theme }> => {
  const { supabase, userId } = await requireUser();
  if (!userId) return { weightUnit: "lb", theme: DEFAULT_THEME };
  const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  return {
    weightUnit: isWeightUnit(data?.weight_unit) ? data.weight_unit : "lb",
    theme: isTheme(data?.theme) ? data.theme : DEFAULT_THEME,
  };
});

/** The signed-in user's preferred weight unit ("lb" by default). */
export async function getWeightUnit(): Promise<WeightUnit> {
  return (await getProfile()).weightUnit;
}
