import { describe, expect, it } from "vitest";
import { canTransitionStatus } from "@/lib/command-status";
import { firstApiRoute, hasExecutableApiStep } from "@/lib/command-lifecycle";

describe("command status transitions", () => {
  it("allows valid transitions", () => {
    expect(canTransitionStatus("draft", "published")).toBe(true);
    expect(canTransitionStatus("published", "paused")).toBe(true);
  });

  it("blocks invalid transitions", () => {
    expect(canTransitionStatus("archived", "published")).toBe(false);
    expect(canTransitionStatus("published", "draft")).toBe(false);
  });

  it("requires an explicit API step before publishing", () => {
    expect(hasExecutableApiStep([])).toBe(false);
    expect(hasExecutableApiStep([{ apiRoute: null }])).toBe(false);
    expect(hasExecutableApiStep([{ apiRoute: "/api/internal/acme/refunds", httpMethod: null }])).toBe(false);
    expect(hasExecutableApiStep([{ apiRoute: "/api/internal/acme/refunds", httpMethod: "POST" }])).toBe(true);
    expect(firstApiRoute([{ apiRoute: null }, { apiRoute: "/api/internal/acme/refunds" }])).toBe("/api/internal/acme/refunds");
  });
});
