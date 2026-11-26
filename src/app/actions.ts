"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient, getWeightUnit, requireUser } from "@/lib/supabase/server";
import { fromUnit, isWeightUnit } from "@/lib/units";

export type FormState = { error?: string } | undefined;

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

export async function signUp(_: FormState, formData: FormData): Promise<FormState> {
  const supabase = await createClient();
  const h = await headers();
  const origin = h.get("origin") ?? (h.get("host") ? `https://${h.get("host")}` : "");
  const { data, error } = await supabase.auth.signUp({
    email: str(formData, "email"),
    password: str(formData, "password"),
    options: origin ? { emailRedirectTo: `${origin}/auth/confirm` } : undefined,
  });
  if (error) return { error: error.message };
  if (!data.session) return { error: "Check your email to confirm your account, then sign in." };
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
  const exerciseName = str(formData, "exercise").replace(/\s+/g, " ");
  const unit = await getWeightUnit();
  const reps = Number(str(formData, "reps"));
  const weightInput = Number(str(formData, "weight") || 0);
  const count = Math.min(Math.max(Number(str(formData, "count") || 1), 1), 20);

  if (!exerciseName) return { error: "Pick or type an exercise." };
  if (!Number.isInteger(reps) || reps < 0 || reps > 1000) return { error: "Reps must be a whole number." };
  const weightError = checkWeight(weightInput, unit);
  if (weightError) return { error: weightError };
  const weight = fromUnit(weightInput, unit);

  // Find the exercise by case-insensitive name, or create it.
  let exerciseId: string | undefined;
  const { data: existing } = await supabase
    .from("exercises")
    .select("id")
    .ilike("name", exerciseName.replace(/[%_\\]/g, "\\$&"))
    .limit(1)
    .maybeSingle();
  exerciseId = existing?.id;

  if (!exerciseId) {
    const { data: created, error } = await supabase
      .from("exercises")
      .insert({ name: exerciseName })
      .select("id")
      .single();
    if (error) return { error: error.message };
    exerciseId = created.id;
  }

  const rows = Array.from({ length: count }, () => ({
    workout_id: workoutId,
    exercise_id: exerciseId,
    reps,
    weight,
  }));
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

function checkWeight(value: number, unit: "lb" | "kg") {
  // The column holds up to 9999.99 lb.
  const max = unit === "kg" ? 4500 : 9999;
  if (!Number.isFinite(value) || value < 0 || value > max) return "Weight looks off.";
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

// ---------- Exercises ----------

export async function renameExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const name = str(formData, "name").replace(/\s+/g, " ");
  if (!name) return;
  const { error } = await supabase.from("exercises").update({ name }).eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
}

export async function deleteExercise(formData: FormData) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("exercises").delete().eq("id", str(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/exercises");
  revalidatePath("/");
}
