import { CandidateStatus, CommandStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDevContext } from "@/lib/auth";
import { buildCommandFromCandidate } from "@/lib/command-generator";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/permissions";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organisationId, userId, user } = await getDevContext();
    requirePermission(user.role, "discovery:manage");
    const { id } = await params;

    const candidate = await prisma.workflowCandidate.findFirst({ where: { id, organisationId } });
    if (!candidate) return notFound("Candidate not found");
    if (candidate.status !== CandidateStatus.accepted) {
      return badRequest("Candidate must be accepted before command generation.");
    }

    const generated = buildCommandFromCandidate(candidate);

    const command = await prisma.actionCommand.create({
      data: {
        organisationId,
        appId: candidate.appId,
        candidateId: candidate.id,
        name: generated.name,
        description: generated.description,
        inputSchemaJson: generated.inputSchema,
        outputSchemaJson: generated.outputSchema,
        executionStrategy: generated.executionStrategy,
        riskLevel: generated.riskLevel,
        approvalRulesJson: (generated.approvalRules ?? Prisma.JsonNull) as unknown as Prisma.InputJsonValue,
        successCondition: generated.successCondition,
        failureConditionsJson: generated.failureConditions,
        sourceEvidenceJson: generated.sourceEvidence,
        status: CommandStatus.draft,
      },
    });

    await writeAuditLog({
      organisationId,
      eventType: "command_generated",
      actorType: "user",
      actorId: userId,
      commandId: command.id,
      details: { candidate_id: candidate.id },
    });

    return ok({ command }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) {
      return forbidden(error.message);
    }
    return serverError(error);
  }
}
