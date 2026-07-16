import { getDevContext } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { forbidden, notFound, ok, serverError } from "@/lib/http";
import { requirePermission } from "@/lib/permissions";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { organisationId, user } = await getDevContext();
    requirePermission(user.role, "commands:read");
    const { id } = await params;
    const command = await prisma.actionCommand.findFirst({ where: { id, organisationId }, select: { id: true } });
    if (!command) return notFound("Command not found");
    const versions = await prisma.commandVersion.findMany({ where: { commandId: id }, orderBy: { version: "desc" } });
    return ok({ versions });
  } catch (error) {
    return error instanceof Error && error.message.startsWith("Forbidden") ? forbidden(error.message) : serverError(error);
  }
}
