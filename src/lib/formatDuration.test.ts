import { describe, expect, it } from "vitest";
import { formatMmSs } from "./formatDuration";

describe("formatMmSs", () => {
  it("formats minutes and seconds", () => {
    expect(formatMmSs(0)).toBe("00:00");
    expect(formatMmSs(999)).toBe("00:00");
    expect(formatMmSs(1_000)).toBe("00:01");
    expect(formatMmSs(59_000)).toBe("00:59");
    expect(formatMmSs(60_000)).toBe("01:00");
    expect(formatMmSs(45 * 60 * 1000)).toBe("45:00");
  });

  it("clamps negative values to zero", () => {
    expect(formatMmSs(-1_500)).toBe("00:00");
  });
});
