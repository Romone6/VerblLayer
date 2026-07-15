import { describe, expect, it } from "vitest";
import type { WorkflowCandidate } from "@prisma/client";
import { buildCommandFromCandidate } from "@/lib/command-generator";

const candidate = {
  name: "close_customer_case",
  description: "Close a support case after a verified resolution.",
  riskLevel: "low",
  requiredInputsJson: ["case_id"],
  expectedOutputsJson: ["case_status"],
  sourceEvidenceJson: ["support-sop.md"],
} as unknown as WorkflowCandidate;

describe("command generation", () => {
  it("creates a review-required draft without inventing a target workflow", () => {
    const command = buildCommandFromCandidate(candidate);

    expect(command.executionStrategy).toBe("review_required");
    expect(command.approvalRules).toBeNull();
    expect(command.successCondition).toBe("configured during review");
    expect(command.failureConditions).toEqual([]);
  });
});
