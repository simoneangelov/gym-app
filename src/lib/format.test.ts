import { describe, expect, it } from "vitest";
import { localISODate, monthWeeks, recentMonths, weekDays } from "./format";

describe("weekDays", () => {
  it("runs Sunday through Saturday around a midweek day", () => {
    // 2026-11-26 is a Thursday.
    expect(weekDays("2026-11-26")).toEqual([
      "2026-11-22",
      "2026-11-23",
      "2026-11-24",
      "2026-11-25",
      "2026-11-26",
      "2026-11-27",
      "2026-11-28",
    ]);
  });

  it("starts on the day itself when it is a Sunday, and ends on Saturday itself", () => {
    expect(weekDays("2026-11-22")[0]).toBe("2026-11-22");
    expect(weekDays("2026-11-28")[0]).toBe("2026-11-22");
  });

  it("crosses month and year boundaries", () => {
    // 2027-01-01 is a Friday.
    expect(weekDays("2027-01-01")).toEqual([
      "2026-12-27",
      "2026-12-28",
      "2026-12-29",
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});

describe("localISODate", () => {
  it("uses the local calendar day", () => {
    expect(localISODate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

describe("monthWeeks", () => {
  it("lays November 2026 out Sunday to Saturday with blanks outside the month", () => {
    const weeks = monthWeeks("2026-11-26");
    // Nov 1, 2026 is a Sunday; Nov 30 is a Monday.
    expect(weeks).toHaveLength(5);
    expect(weeks[0][0]).toBe("2026-11-01");
    expect(weeks[4]).toEqual(["2026-11-29", "2026-11-30", null, null, null, null, null]);
  });

  it("pads the first week when the month starts midweek", () => {
    // Jan 1, 2027 is a Friday.
    const weeks = monthWeeks("2027-01-15");
    expect(weeks[0]).toEqual([null, null, null, null, null, "2027-01-01", "2027-01-02"]);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
  });
});

describe("recentMonths", () => {
  it("lists months oldest first, ending with the current one, across a year boundary", () => {
    expect(recentMonths("2027-02-10", 4)).toEqual(["2026-11-01", "2026-12-01", "2027-01-01", "2027-02-01"]);
  });

  it("adds months after the current one", () => {
    expect(recentMonths("2026-12-05", 2, 1)).toEqual(["2026-11-01", "2026-12-01", "2027-01-01"]);
  });
});
