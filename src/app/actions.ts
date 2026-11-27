"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getWeightUnit, requireUser } from "@/lib/supabase/server";
import { buildSetRows, escapeLike, isUniqueViolation, normalizeExerciseName, parseSetInput } from "@/lib/sets";
import { isTheme, THEME_COOKIE } from "@/lib/theme";
import { fromUnit, isWeightUnit, type WeightUnit } from "@/lib/units";

export type FormState = { error?: string; message?: string } | undefined;

function str(formData: FormData, key: string) {
  const v = formData.get(key);
  return typeof v === "string" ? v.trim() : "";
}

// ---------- Auth ----------

export async function signIn(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: str(formData, "email"),
    password: str(formData, "password"),
  });
  if (error) return { error: error.message };
  redirect("/");
}

async function requestOrigin() {
  const h = await headers();
  return h.get("origin") ?? (h.get("host") ? `https://${h.get("host")}` : "");
}

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const origin = await requestOrigin();
  const { data, error } = await supabase.auth.signUp({
    email: str(formData, "email"),
    password: str(formData, "password"),
    options: origin ? { emailRedirectTo: `${origin}/auth/confirm` } : undefined,
  });
  if (error) return { error: error.message };
  if (!data.session) return { error: "Check your email to confirm your account, then sign in." };
  redirect("/");
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = str(formData, "email");
  if (!email) return { error: "Enter your email." };
  const supabase = await createClient();
  const origin = await requestOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin ? `${origin}/auth/confirm?next=/reset-password` : undefined,
  });
  // Rate limits are worth surfacing; anything else gets the same reply so the
  // form doesn't reveal which emails have accounts.
  if (error?.status === 429) return { error: "Too many requests. Wait a minute and try again." };
  return { message: "If that email has an account, a reset link is on its way. Check your inbox." };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "Your reset link expired. Request a new one." };
  const password = str(formData, "password");
  if (password.length < 6) return { error: "Use at least 6 characters." };
  if (password !== str(formData, "confirm")) return { error: "Passwords don't match." };
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---------- Workouts ----------

export async function createWorkout(formData: FormData) {
  const { supabase, userId } = await requireUser();
  if (!userId) redirect("/login");

  const name = str(formData, "name") || "Workout";
  const performed_on = str(formData, "performed_on") || undefined;

  const { data, error } = await supabase
    .from("workouts")
    .insert({ name, performed_on })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/");
  redirect(`/workouts/${data.id}`);
}

export async function updateWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const id = str(formData, "id");
  const { error } = await supabase
    .from("workouts")
    .update({
      name: str(formData, "name") || "Workout",
      performed_on: str(formData, "performed_on") || undefined,
      notes: str(formData, "notes") || null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath(`/workouts/${id}`);
  revalidatePath("/");
}

export async function deleteWorkout(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("workouts").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/");
  redirect("/");
}

// ---------- Sets ----------

export async function addSet(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "You are signed out." };

  const workoutId = str(formData, "workout_id");
  const unit = await getWeightUnit();
  const parsed = parseSetInput(
    {
      exercise: str(formData, "exercise"),
      reps: str(formData, "reps"),
      weight: str(formData, "weight"),
      count: str(formData, "count"),
    },
    { maxWeight: maxWeightFor(unit) },
  );
  if (!parsed.ok) return { error: parsed.error };
  // The form takes weight in the user's unit; the column stores pounds.
  const input = { ...parsed.value, weight: fromUnit(parsed.value.weight, unit) };

  // Find the exercise by case-insensitive name, or create it.
  const { data: existing } = await supabase
    .from("exercises")
    .select("id")
    .ilike("name", escapeLike(input.exerciseName))
    .limit(1)
    .maybeSingle();
  let exerciseId: string = existing?.id;

  if (!existing) {
    const { data: created, error } = await supabase
      .from("exercises")
      .insert({ name: input.exerciseName })
      .select("id")
      .single();
    if (error) return { error: error.message };
    exerciseId = created.id;
  }

  const rows = buildSetRows(workoutId, exerciseId, input);
  const { error } = await supabase.from("workout_sets").insert(rows);
  if (error) return { error: error.message };

  revalidatePath(`/workouts/${workoutId}`);
  revalidatePath("/exercises");
  return undefined;
}

export async function updateSet(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase, userId } = await requireUser();
  if (!userId) return { error: "You are signed out." };

  const unit = await getWeightUnit();
  const id = str(formData, "id");
  const workoutId = str(formData, "workout_id");
  const reps = Number(str(formData, "reps"));
  const weightInput = Number(str(formData, "weight") || 0);

  if (!Number.isInteger(reps) || reps < 0 || reps > 1000) return { error: "Reps must be a whole number." };
  const weightError = checkWeight(weightInput, unit);
  if (weightError) return { error: weightError };

  const { data, error } = await supabase
    .from("workout_sets")
    .update({ reps, weight: fromUnit(weightInput, unit) })
    .eq("id", id)
    .select("id");
  if (error) return { error: error.message };
  if (!data?.length) return { error: "That set no longer exists." };

  revalidatePath(`/workouts/${workoutId}`);
  revalidatePath("/exercises");
  return undefined;
}

export async function deleteSet(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("workout_sets").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/workouts/${str(formData, "workout_id")}`);
  revalidatePath("/exercises");
}

// The column holds up to 9999.99 lb.
function maxWeightFor(unit: WeightUnit) {
  return unit === "kg" ? 4500 : 9999;
}

function checkWeight(value: number, unit: WeightUnit) {
  if (!Number.isFinite(value) || value < 0 || value > maxWeightFor(unit)) return "Weight looks off.";
  return null;
}

// ---------- Settings ----------

export async function setWeightUnit(formData: FormData) {
  const { supabase, userId } = await requireUser();
  if (!userId) redirect("/login");
  const unit = str(formData, "unit");
  if (!isWeightUnit(unit)) return;
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, weight_unit: unit, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

export async function setTheme(formData: FormData) {
  const { supabase, userId } = await requireUser();
  if (!userId) redirect("/login");
  const theme = str(formData, "theme");
  if (!isTheme(theme)) return;
  // The cookie lets the pre-paint script pick the theme on the next load.
  (await cookies()).set(THEME_COOKIE, theme, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, theme, updated_at: new Date().toISOString() });
  if (error) throw new Error(error.message);
  revalidatePath("/", "layout");
}

// ---------- Exercises ----------

export async function renameExercise(_: FormState, formData: FormData): Promise<FormState> {
  const { supabase } = await requireUser();
  const name = normalizeExerciseName(str(formData, "name"));
  if (!name) return { error: "Name can't be empty." };
  const { error } = await supabase.from("exercises").update({ name }).eq("id", str(formData, "id"));
  if (isUniqueViolation(error)) {
    return { error: `You already have an exercise called "${name}". Pick another name, or delete one of them.` };
  }
  if (error) return { error: error.message };
  revalidatePath("/exercises");
  revalidatePath("/");
  return { message: "Renamed." };
}

export async function deleteExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("exercises").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
  revalidatePath("/");
}
