import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
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
 * The signed-in user's preferred weight unit. Defaults to "lb" when there is no
 * profile row yet (or the profiles migration has not been applied).
 * Cached per request so the nav and the page share one query.
 */
export const getWeightUnit = cache(async (): Promise<WeightUnit> => {
  const { supabase, userId } = await requireUser();
  if (!userId) return "lb";
  const { data } = await supabase.from("profiles").select("weight_unit").eq("user_id", userId).maybeSingle();
  return isWeightUnit(data?.weight_unit) ? data.weight_unit : "lb";
});
