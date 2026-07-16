import { describe, expect, it } from "vitest";

import { buildApiDriftRequest, buildApiExecutionRequest, expandApiRouteTemplate } from "@/lib/execution-routing";

describe("execution routing", () => {
  it("encodes route-template substitutions", () => {
    expect(expandApiRouteTemplate("/api/v2/tickets/{ticket_id}.json", { ticket_id: "42/urgent" })).toBe("/api/v2/tickets/42%2Furgent.json");
  });

  it("rejects missing route-template substitutions", () => {
    expect(() => expandApiRouteTemplate("/api/v2/tickets/{ticket_id}.json", {})).toThrow("ticket_id");
  });

  it("rejects external execution routes", () => {
    expect(() => expandApiRouteTemplate("https://untrusted.example/run", {})).toThrow("relative");
  });

  it("preserves the command app URL and reviewed method", () => {
    expect(buildApiExecutionRequest({ baseUrl: "https://support.example.com/", route: "/api/v2/tickets/{ticket_id}.json", method: "PUT", input: { ticket_id: 42 } })).toMatchObject({
      url: "https://support.example.com/api/v2/tickets/42.json",
      method: "PUT",
    });
  });

  it("uses the persisted app URL for a route-level drift probe without pretending to execute", () => {
    expect(buildApiDriftRequest("https://support.example.com/", "/api/v2/tickets/{ticket_id}.json")).toBe("https://support.example.com/api/v2/tickets/0.json");
  });
});
