import { CommandStatus, Prisma } from "@prisma/client";

import { getDevContext } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { hasExecutableApiStep } from "@/lib/command-lifecycle";
import { canTransitionStatus } from "@/lib/command-status";
import { createCommandVersionSnapshot } from "@/lib/command-version";
import { prisma } from "@/lib/db";
import { badRequest, forbidden, notFound, ok, serverError } from "@/lib/http";
import { requirePermission } from "@/lib/permissions";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organisationId, userId, user } = await getDevContext();
    requirePermission(user.role, "commands:publish");
    const { id } = await params;

    const existing = await prisma.actionCommand.findFirst({ where: { id, organisationId }, include: { steps: true } });
    if (!existing) return notFound("Command not found");
    if (!hasExecutableApiStep(existing.steps)) return badRequest("Command needs an explicit API execution step before publishing.");

    const result = await prisma.$transaction(async (tx) => {
      const command = await tx.actionCommand.findUniqueOrThrow({ where: { id }, include: { steps: { orderBy: { stepIndex: "asc" } } } });
      let publishedCommand = command;
      if (command.status !== CommandStatus.published) {
        const target = command.status === CommandStatus.draft ? CommandStatus.needs_review : command.status;
        if (target !== command.status) {
          publishedCommand = await tx.actionCommand.update({ where: { id }, data: { status: target }, include: { steps: { orderBy: { stepIndex: "asc" } } } });
        }
        if (!canTransitionStatus(publishedCommand.status, CommandStatus.published)) {
          throw new Error(`Command cannot be published from ${publishedCommand.status}.`);
        }
        publishedCommand = await tx.actionCommand.update({ where: { id }, data: { status: CommandStatus.published }, include: { steps: { orderBy: { stepIndex: "asc" } } } });
      }

      const latestVersion = await tx.commandVersion.findFirst({ where: { commandId: id }, orderBy: { version: "desc" }, select: { version: true } });
      const version = await tx.commandVersion.create({
        data: {
          commandId: id,
          version: (latestVersion?.version ?? 0) + 1,
          publishedBy: userId,
          snapshotJson: createCommandVersionSnapshot(publishedCommand) as Prisma.InputJsonValue,
        },
      });
      return { command: publishedCommand, version };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await writeAuditLog({
      organisationId,
      eventType: "command_published",
      actorType: "user",
      actorId: userId,
      commandId: id,
      details: { command_name: result.command.name, version: result.version.version },
    });

    return ok(result);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Forbidden")) return forbidden(error.message);
    return serverError(error);
  }
}
