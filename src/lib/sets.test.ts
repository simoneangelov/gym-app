import { describe, expect, it } from "vitest";
import {
  buildSetRows,
  escapeLike,
  isUniqueViolation,
  MAX_SETS_PER_ADD,
  normalizeExerciseName,
  parseSetInput,
} from "./sets";

const base = { exercise: "Bench Press", reps: "5", weight: "135", count: "3" };

describe("normalizeExerciseName", () => {
  it("trims and collapses whitespace", () => {
    expect(normalizeExerciseName("  Bench \t  Press  ")).toBe("Bench Press");
  });
});

describe("escapeLike", () => {
  it("escapes LIKE wildcards and backslashes", () => {
    expect(escapeLike("100%_curl\\x")).toBe("100\\%\\_curl\\\\x");
  });
  it("leaves plain names alone", () => {
    expect(escapeLike("Squat")).toBe("Squat");
  });
});

describe("parseSetInput", () => {
  it("parses a normal set", () => {
    expect(parseSetInput(base)).toEqual({
      ok: true,
      value: { exerciseName: "Bench Press", reps: 5, weight: 135, count: 3 },
    });
  });

  it("treats empty weight as bodyweight and empty count as one set", () => {
    const r = parseSetInput({ ...base, weight: "", count: "" });
    expect(r).toMatchObject({ ok: true, value: { weight: 0, count: 1 } });
  });

  it("accepts half-pound weights", () => {
    expect(parseSetInput({ ...base, weight: "22.5" })).toMatchObject({ ok: true, value: { weight: 22.5 } });
  });

  it("clamps count to 1..MAX_SETS_PER_ADD", () => {
    expect(parseSetInput({ ...base, count: "0" })).toMatchObject({ value: { count: 1 } });
    expect(parseSetInput({ ...base, count: "-4" })).toMatchObject({ value: { count: 1 } });
    expect(parseSetInput({ ...base, count: "500" })).toMatchObject({ value: { count: MAX_SETS_PER_ADD } });
    expect(parseSetInput({ ...base, count: "abc" })).toMatchObject({ value: { count: 1 } });
  });

  it("requires an exercise name", () => {
    expect(parseSetInput({ ...base, exercise: "   " })).toEqual({ ok: false, error: "Pick or type an exercise." });
  });

  it.each(["", "2.5", "-1", "1001", "ten"])("rejects reps %j", (reps) => {
    expect(parseSetInput({ ...base, reps })).toEqual({ ok: false, error: "Reps must be a whole number." });
  });

  it("allows zero reps (e.g. a failed attempt)", () => {
    expect(parseSetInput({ ...base, reps: "0" })).toMatchObject({ ok: true, value: { reps: 0 } });
  });

  it.each(["-5", "10000", "heavy"])("rejects weight %j", (weight) => {
    expect(parseSetInput({ ...base, weight })).toEqual({ ok: false, error: "Weight looks off." });
  });
});

describe("buildSetRows", () => {
  it("creates one row per set", () => {
    const rows = buildSetRows("w1", "e1", { exerciseName: "Squat", reps: 5, weight: 225, count: 3 });
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({ workout_id: "w1", exercise_id: "e1", reps: 5, weight: 225 });
  });
});

describe("isUniqueViolation", () => {
  it("detects Postgres 23505", () => {
    expect(isUniqueViolation({ code: "23505" })).toBe(true);
    expect(isUniqueViolation({ code: "23514" })).toBe(false);
    expect(isUniqueViolation(null)).toBe(false);
  });
});
