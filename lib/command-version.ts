export type PublishableCommand = {
  name: string;
  description: string;
  inputSchemaJson: unknown;
  outputSchemaJson: unknown;
  executionStrategy: string;
  riskLevel: string;
  approvalRulesJson: unknown;
  successCondition: string;
  failureConditionsJson: unknown;
  sourceEvidenceJson: unknown;
  steps: Array<{ stepIndex: number; apiRoute: string | null; httpMethod: string | null }>;
};

export function createCommandVersionSnapshot(command: PublishableCommand): Record<string, unknown> {
  return {
    name: command.name,
    description: command.description,
    input_schema: command.inputSchemaJson,
    output_schema: command.outputSchemaJson,
    execution_strategy: command.executionStrategy,
    risk_level: command.riskLevel,
    approval_rules: command.approvalRulesJson,
    success_condition: command.successCondition,
    failure_conditions: command.failureConditionsJson,
    source_evidence: command.sourceEvidenceJson,
    steps: command.steps.map((step) => ({
      step_index: step.stepIndex,
      api_route: step.apiRoute,
      http_method: step.httpMethod,
    })),
  };
}
