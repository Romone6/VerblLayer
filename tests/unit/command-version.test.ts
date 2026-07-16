import { describe, expect, it } from "vitest";

import { createCommandVersionSnapshot } from "@/lib/command-version";

describe("command version snapshots", () => {
  it("captures the reviewed contract and execution steps at publish time", () => {
    expect(createCommandVersionSnapshot({
      name: "update_support_ticket",
      description: "Update a ticket",
      inputSchemaJson: { ticket_id: "string" },
      outputSchemaJson: { ticket: "object" },
      executionStrategy: "api",
      riskLevel: "medium",
      approvalRulesJson: { amount_greater_than: 100 },
      successCondition: "200 response",
      failureConditionsJson: null,
      sourceEvidenceJson: [{ source_id: "src_1" }],
      steps: [{ stepIndex: 0, apiRoute: "/api/v2/tickets/{ticket_id}.json", httpMethod: "PUT" }],
    })).toMatchObject({
      name: "update_support_ticket",
      steps: [{ api_route: "/api/v2/tickets/{ticket_id}.json", http_method: "PUT" }],
    });
  });
});
