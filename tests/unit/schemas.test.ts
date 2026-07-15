import { describe, expect, it } from "vitest";
import { commandStepsSchema, createAppSchema, sourceTextSchema } from "@/lib/schemas";

describe("schema validation", () => {
  it("validates app payload", () => {
    const parsed = createAppSchema.safeParse({
      name: "Acme Support Admin",
      type: "internal_web_app",
      base_url: "http://localhost:3000",
      auth_method: "none",
      execution_mode: "api",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects invalid source payload", () => {
    const parsed = sourceTextSchema.safeParse({
      name: "missing fields",
      raw_text: "hello",
    });

    expect(parsed.success).toBe(false);
  });

  it("requires every reviewed API step to have a route", () => {
    const parsed = commandStepsSchema.safeParse([
      { step_type: "api", api_route: "/api/internal/acme/refunds", http_method: "POST" },
    ]);

    expect(parsed.success).toBe(true);
    expect(commandStepsSchema.safeParse([{ step_type: "api" }]).success).toBe(false);
  });
});
