import { Prisma, StepType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDevContext } from "@/lib/auth";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requirePermission } from "@/lib/permissions";
import { commandStepsSchema } from "@/lib/schemas";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organisationId, user } = await getDevContext();
    requirePermission(user.role, "commands:read");
    const { id } = await params;
    const command = await prisma.actionCommand.findFirst({
      where: { id, organisationId },
      include: {
        steps: true,
        executions: { orderBy: { createdAt: "desc" }, take: 10 },
        drifts: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });

    if (!command) return notFound("Command not found");
    return ok({ command });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return forbidden(error.message);
    }
    return serverError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organisationId, user } = await getDevContext();
    requirePermission(user.role, "commands:manage");
    const { id } = await params;
    const json = await request.json();

    const existing = await prisma.actionCommand.findFirst({ where: { id, organisationId } });
    if (!existing) return notFound("Command not found");

    const parsedSteps = json.steps === undefined ? null : commandStepsSchema.safeParse(json.steps);
    if (parsedSteps && !parsedSteps.success) {
      return badRequest("Invalid command steps", parsedSteps.error.flatten());
    }

    const command = await prisma.$transaction(async (tx) => {
      await tx.actionCommand.update({
        where: { id },
        data: {
          description: typeof json.description === "string" ? json.description : undefined,
          inputSchemaJson: json.input_schema_json,
          outputSchemaJson: json.output_schema_json,
          approvalRulesJson: json.approval_rules_json,
          successCondition: typeof json.success_condition === "string" ? json.success_condition : undefined,
        },
      });

      if (parsedSteps?.success) {
        await tx.commandStep.deleteMany({ where: { commandId: id } });
        await tx.commandStep.createMany({
          data: parsedSteps.data.map((step, index) => ({
            commandId: id,
            stepIndex: index,
            stepType: StepType.api,
            apiRoute: step.api_route,
            httpMethod: step.http_method,
            inputMappingJson: step.input_mapping_json as Prisma.InputJsonValue | undefined,
            successConditionJson: step.success_condition_json as Prisma.InputJsonValue | undefined,
            errorConditionJson: step.error_condition_json as Prisma.InputJsonValue | undefined,
          })),
        });
      }

      return tx.actionCommand.findUniqueOrThrow({ where: { id }, include: { steps: true } });
    });

    return ok({ command });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return forbidden(error.message);
    }
    return serverError(error);
  }
}
