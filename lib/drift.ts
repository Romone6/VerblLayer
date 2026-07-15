import { DriftSeverity, DriftStatus, HealthStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";

export async function runDriftCheck(commandId: string, organisationId: string) {
  const command = await prisma.actionCommand.findFirst({ where: { id: commandId, organisationId }, include: { steps: true } });
  if (!command) throw new Error("Command not found");
  const issues: Array<{ type: string; description: string; severity: DriftSeverity }> = [];
  for (const step of command.steps) {
    if (!step.apiRoute) continue;
    try {
      const response = await fetch(`${env.APP_BASE_URL}${step.apiRoute}`, { method: "OPTIONS", signal: AbortSignal.timeout(3000) });
      if (response.status === 404) issues.push({ type: "api_route_missing", description: `API route returned 404: ${step.apiRoute}`, severity: DriftSeverity.high });
    } catch (error) {
      issues.push({ type: "api_unreachable", description: `API route unreachable: ${step.apiRoute} (${error instanceof Error ? error.message : String(error)})`, severity: DriftSeverity.high });
    }
  }
  const status = issues.length === 0 ? DriftStatus.healthy : DriftStatus.broken;
  const check = await prisma.driftCheck.create({ data: { organisationId, commandId, status, severity: issues.length ? DriftSeverity.high : DriftSeverity.low, issueType: issues[0]?.type ?? "no_issues", issueDescription: issues[0]?.description ?? "All API route checks passed", rawResultJson: { issues } } });
  await prisma.actionCommand.update({ where: { id: commandId }, data: { healthStatus: status === DriftStatus.healthy ? HealthStatus.healthy : HealthStatus.broken } });
  await writeAuditLog({ organisationId, eventType: status === DriftStatus.healthy ? "drift_check_passed" : "drift_check_failed", actorType: "system", commandId, details: { drift_check_id: check.id, status, issues } });
  return check;
}
