import { cache } from "react";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { DEFAULT_THEME, isTheme, type Theme } from "@/lib/theme";
import { isWeightUnit, type WeightUnit } from "@/lib/units";
import { VISITOR_COOKIE } from "@/lib/visitor";
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

/** The current session's user. Cached per request so the nav, tab bar and page share one check. */
export const requireUser = cache(async () => {
  // The session is per request, and Supabase checks token expiry with Date.now(), which Cache
  // Components refuses while prerendering. Wait for the real request before reading it.
  await connection();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  return { supabase, userId: userId ?? null, email: (data?.claims?.email as string | undefined) ?? null };
});

/**
 * Who is looking at the page: a signed-in user, or a visitor (no account, read-only)
 * who chose "View as a visitor". Visitors' queries run as anon, so RLS limits them to
 * reading accounts that opted in.
 */
export const getViewer = cache(async () => {
  const user = await requireUser();
  const isVisitor = !user.userId && (await cookies()).get(VISITOR_COOKIE)?.value === "1";
  return { ...user, isVisitor };
});

/**
 * The signed-in user's settings. Falls back to defaults when there is no
 * profile row yet (or a profiles migration has not been applied — hence
 * select("*") rather than naming columns that may not exist).
 * Cached per request so the nav and the page share one query.
 */
type Profile = { weightUnit: WeightUnit; theme: Theme; visibleToVisitors: boolean };

export const getProfile = cache(async (): Promise<Profile> => {
  const { supabase, userId } = await requireUser();
  if (!userId) return { weightUnit: "lb", theme: DEFAULT_THEME, visibleToVisitors: false };
  const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  return {
    weightUnit: isWeightUnit(data?.weight_unit) ? data.weight_unit : "lb",
    theme: isTheme(data?.theme) ? data.theme : DEFAULT_THEME,
    visibleToVisitors: data?.visible_to_visitors === true,
  };
});

/** The signed-in user's preferred weight unit ("lb" by default). */
export async function getWeightUnit(): Promise<WeightUnit> {
  return (await getProfile()).weightUnit;
}
