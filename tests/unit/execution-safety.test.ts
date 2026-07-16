import { describe, expect, it } from "vitest";

import { shouldAutoPauseAfterFailure } from "@/lib/execution-safety";

describe("execution safety pause", () => {
  it("pauses after exactly three latest real failures", () => {
    expect(shouldAutoPauseAfterFailure(["failed", "failed", "failed"], false)).toBe(true);
  });

  it("does not pause for fewer failures, a success, or a dry run", () => {
    expect(shouldAutoPauseAfterFailure(["failed", "failed"], false)).toBe(false);
    expect(shouldAutoPauseAfterFailure(["failed", "failed", "succeeded"], false)).toBe(false);
    expect(shouldAutoPauseAfterFailure(["failed", "failed", "failed"], true)).toBe(false);
  });
});
