import { describe, expect, it } from "vitest";

import { buildCommandEditorPatch } from "@/lib/command-editor";

describe("guided command editor", () => {
  it("turns route, method, and threshold fields into the persisted command patch", () => {
    expect(buildCommandEditorPatch({ apiRoute: "/api/v2/tickets/{ticket_id}.json", httpMethod: "PUT", approvalThreshold: "250" })).toEqual({
      approval_rules_json: { amount_greater_than: 250 },
      steps: [{ step_type: "api", api_route: "/api/v2/tickets/{ticket_id}.json", http_method: "PUT" }],
    });
  });

  it("omits an approval threshold when the field is blank", () => {
    expect(buildCommandEditorPatch({ apiRoute: "/api/internal/acme/refunds", httpMethod: "POST", approvalThreshold: "" }).approval_rules_json).toEqual({});
  });
});
