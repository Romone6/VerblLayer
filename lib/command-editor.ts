type GuidedCommandEditorValues = {
  apiRoute: string;
  httpMethod: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  approvalThreshold?: string;
};

export function buildCommandEditorPatch(values: GuidedCommandEditorValues) {
  const threshold = values.approvalThreshold?.trim();
  const amount = threshold ? Number(threshold) : null;
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) {
    throw new Error("Approval threshold must be a non-negative number.");
  }

  return {
    approval_rules_json: amount === null ? {} : { amount_greater_than: amount },
    steps: [{ step_type: "api" as const, api_route: values.apiRoute, http_method: values.httpMethod }],
  };
}
