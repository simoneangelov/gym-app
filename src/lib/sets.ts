// Pure helpers for logging sets. Kept free of Supabase/Next imports so they
// can be unit tested.

export const MAX_SETS_PER_ADD = 20;
export const MAX_REPS = 1000;
export const MAX_WEIGHT = 9999;

/** Trim and collapse internal whitespace: "  Bench   Press " -> "Bench Press". */
export function normalizeExerciseName(raw: string) {
  return raw.trim().replace(/\s+/g, " ");
}

/** Escape LIKE/ILIKE wildcards so a name matches literally. */
export function escapeLike(value: string) {
  return value.replace(/[%_\\]/g, "\\$&");
}

export type SetInput = {
  exerciseName: string;
  reps: number;
  weight: number;
  count: number;
};

export type ParseResult = { ok: true; value: SetInput } | { ok: false; error: string };

/**
 * Validate the raw "add set" form fields. Empty weight means bodyweight (0);
 * empty count means 1, and count is clamped to 1..MAX_SETS_PER_ADD.
 * `maxWeight` is in whatever unit the weight was typed in (default MAX_WEIGHT).
 */
export function parseSetInput(fields: {
  exercise: string;
  reps: string;
  weight: string;
  count: string;
}, { maxWeight = MAX_WEIGHT }: { maxWeight?: number } = {}): ParseResult {
  const exerciseName = normalizeExerciseName(fields.exercise);
  const reps = fields.reps.trim() === "" ? NaN : Number(fields.reps);
  const weight = Number(fields.weight.trim() || 0);
  const rawCount = Number(fields.count.trim() || 1);
  const count = Number.isFinite(rawCount)
    ? Math.min(Math.max(Math.floor(rawCount), 1), MAX_SETS_PER_ADD)
    : 1;

  if (!exerciseName) return { ok: false, error: "Pick or type an exercise." };
  if (!Number.isInteger(reps) || reps < 0 || reps > MAX_REPS)
    return { ok: false, error: "Reps must be a whole number." };
  if (!Number.isFinite(weight) || weight < 0 || weight > maxWeight)
    return { ok: false, error: "Weight looks off." };

  return { ok: true, value: { exerciseName, reps, weight, count } };
}

/** Build `count` identical rows for the workout_sets insert. */
export function buildSetRows(workoutId: string, exerciseId: string, input: SetInput) {
  return Array.from({ length: input.count }, () => ({
    workout_id: workoutId,
    exercise_id: exerciseId,
    reps: input.reps,
    weight: input.weight,
  }));
}

/** Postgres unique_violation, e.g. the (user_id, lower(name)) index on exercises. */
export function isUniqueViolation(error: { code?: string } | null | undefined) {
  return error?.code === "23505";
}
