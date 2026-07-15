import { RiskLevel, type WorkflowCandidate } from "@prisma/client";

export function inferSchemaTypes(inputNames: string[]) {
  const schema: Record<string, string> = {};
  for (const name of inputNames) {
    schema[name] = name.toLowerCase().includes("amount") ? "number" : "string";
  }
  return schema;
}

export function buildCommandFromCandidate(candidate: WorkflowCandidate) {
  const requiredInputs = candidate.requiredInputsJson as string[];
  const expectedOutputs = candidate.expectedOutputsJson as string[];
  const sourceEvidence = candidate.sourceEvidenceJson as string[];

  const inputSchema = inferSchemaTypes(requiredInputs);
  const outputSchema = inferSchemaTypes(expectedOutputs);

  return {
    name: candidate.name,
    description: candidate.description,
    inputSchema,
    outputSchema,
    executionStrategy: "review_required",
    riskLevel: candidate.riskLevel as RiskLevel,
    approvalRules: null,
    successCondition: "configured during review",
    failureConditions: [],
    sourceEvidence,
  };
}

