export type WeightUnit = "lb" | "kg";

// Weights are stored in pounds in the database. These helpers convert to and
// from the unit the user prefers.
export const LB_PER_KG = 2.20462262;

export function isWeightUnit(v: unknown): v is WeightUnit {
  return v === "lb" || v === "kg";
}

/** Stored pounds → number in the user's unit. */
export function toUnit(lb: number | string, unit: WeightUnit) {
  const n = Number(lb);
  return unit === "kg" ? n / LB_PER_KG : n;
}

/** Number typed in the user's unit → pounds to store (2 decimals, like the column). */
export function fromUnit(value: number, unit: WeightUnit) {
  const lb = unit === "kg" ? value * LB_PER_KG : value;
  return Math.round(lb * 100) / 100;
}
