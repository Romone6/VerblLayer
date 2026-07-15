import { Prisma, StepType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDevContext } from "@/lib/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { requirePermission } from "@/lib/permissions";
import { commandStepsSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  try {
    const { organisationId, user } = await getDevContext();
    requirePermission(user.role, "commands:read");
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const risk = url.searchParams.get("risk");
    const appId = url.searchParams.get("app_id");

    const commands = await prisma.actionCommand.findMany({
      where: {
        organisationId,
        status: status ? (status as never) : undefined,
        riskLevel: risk ? (risk as never) : undefined,
        appId: appId ?? undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ commands });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return forbidden(error.message);
    }
    return serverError(error);
  }
}

export async function POST(request: Request) {
  try {
    const { organisationId, user } = await getDevContext();
    requirePermission(user.role, "commands:manage");
    const json = await request.json();
    if (!json.name || !json.description || !json.input_schema_json || !json.output_schema_json) {
      return badRequest("Missing required command fields");
    }
    const parsedSteps = json.steps === undefined ? null : commandStepsSchema.safeParse(json.steps);
    if (parsedSteps && !parsedSteps.success) {
      return badRequest("Invalid command steps", parsedSteps.error.flatten());
    }

    const command = await prisma.actionCommand.create({
      data: {
        organisationId,
        appId: json.app_id,
        name: json.name,
        description: json.description,
        inputSchemaJson: json.input_schema_json,
        outputSchemaJson: json.output_schema_json,
        executionStrategy: json.execution_strategy ?? "review_required",
        riskLevel: json.risk_level ?? "medium",
        approvalRulesJson: json.approval_rules_json ?? null,
        successCondition: json.success_condition ?? "command finished",
        failureConditionsJson: json.failure_conditions_json ?? [],
        sourceEvidenceJson: json.source_evidence_json ?? [],
        steps: parsedSteps?.success
          ? {
              create: parsedSteps.data.map((step, index) => ({
                stepIndex: index,
                stepType: StepType.api,
                apiRoute: step.api_route,
                httpMethod: step.http_method,
                inputMappingJson: step.input_mapping_json as Prisma.InputJsonValue | undefined,
                successConditionJson: step.success_condition_json as Prisma.InputJsonValue | undefined,
                errorConditionJson: step.error_condition_json as Prisma.InputJsonValue | undefined,
              })),
            }
          : undefined,
      },
      include: { steps: true },
    });

    return ok({ command }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return forbidden(error.message);
    }
    return serverError(error);
  }
}
