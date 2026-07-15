import { ApprovalStatus, CommandStatus, ExecutionMode, ExecutionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { writeAuditLog } from "@/lib/audit";
import { firstApiRoute } from "@/lib/command-lifecycle";

type CommandInput = Record<string, unknown>;
export type CommandRunResult =
  | { status: "succeeded"; execution_id: string; output: Record<string, unknown>; execution_mode: ExecutionMode }
  | { status: "waiting_for_approval"; approval_required: true; reason: string; execution_id: string }
  | { status: "failed"; execution_id: string; error: string };

function validationIssues(schema: Record<string, string>, input: CommandInput) {
  return Object.entries(schema).flatMap(([field, type]) => {
    const value = input[field];
    if (value === undefined || value === null) return [`Missing required field: ${field}`];
    if (type === "number" && typeof value !== "number") return [`Field ${field} must be number`];
    if (type === "string" && typeof value !== "string") return [`Field ${field} must be string`];
    return [];
  });
}

function approvalThreshold(rules: Prisma.JsonValue | null) {
  if (!rules || typeof rules !== "object" || Array.isArray(rules)) return null;
  const value = (rules as Record<string, unknown>).amount_greater_than;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

async function callControlledTarget(apiRoute: string, executionId: string, input: CommandInput) {
  const response = await fetch(`${env.APP_BASE_URL}${apiRoute}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-internal-token": env.INTERNAL_EXECUTION_TOKEN, "x-execution-id": executionId },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(`API execution failed: ${response.status} ${await response.text()}`);
  return (await response.json()) as Record<string, unknown>;
}

async function resultFor(executionId: string): Promise<CommandRunResult> {
  const execution = await prisma.commandExecution.findUnique({ where: { id: executionId } });
  if (!execution) throw new Error("Execution not found");
  if (execution.status === ExecutionStatus.waiting_for_approval) {
    const approval = await prisma.approval.findFirst({ where: { executionId, status: ApprovalStatus.pending }, orderBy: { createdAt: "desc" } });
    return { status: "waiting_for_approval", approval_required: true, reason: approval?.reason ?? "approval required", execution_id: executionId };
  }
  if (execution.status === ExecutionStatus.succeeded) return { status: "succeeded", execution_id: executionId, output: (execution.outputJson as Record<string, unknown>) ?? {}, execution_mode: execution.executionMode };
  return { status: "failed", execution_id: executionId, error: execution.errorMessage ?? "Execution failed" };
}

async function fail(execution: { id: string; commandId: string }, organisationId: string, agentName: string, error: string): Promise<CommandRunResult> {
  await prisma.commandExecution.update({ where: { id: execution.id }, data: { status: ExecutionStatus.failed, errorMessage: error, completedAt: new Date() } });
  await writeAuditLog({ organisationId, eventType: "command_execution_failed", actorType: "agent", actorId: agentName, commandId: execution.commandId, executionId: execution.id, details: { error } });
  return { status: "failed", execution_id: execution.id, error };
}

export async function runCommandByName(params: { organisationId: string; userId: string; commandName: string; agentName: string; input: CommandInput; dryRun?: boolean; idempotencyKey?: string }): Promise<CommandRunResult> {
  const command = await prisma.actionCommand.findFirst({ where: { organisationId: params.organisationId, name: params.commandName, status: CommandStatus.published }, include: { steps: { select: { apiRoute: true } } } });
  if (!command) throw new Error(`Published command not found: ${params.commandName}`);
  if (params.idempotencyKey) {
    const existing = await prisma.commandExecution.findFirst({ where: { organisationId: params.organisationId, commandId: command.id, idempotencyKey: params.idempotencyKey } });
    if (existing) return resultFor(existing.id);
  }
  const execution = await prisma.commandExecution.create({ data: { organisationId: params.organisationId, commandId: command.id, idempotencyKey: params.idempotencyKey ?? null, userId: params.userId, agentName: params.agentName, inputJson: params.input as Prisma.InputJsonValue, status: ExecutionStatus.queued, executionMode: ExecutionMode.api, startedAt: new Date() } });
  await writeAuditLog({ organisationId: params.organisationId, eventType: params.dryRun ? "command_dry_run" : "command_execution_started", actorType: "agent", actorId: params.agentName, commandId: command.id, executionId: execution.id, details: { input: params.input } });
  const issues = validationIssues(command.inputSchemaJson as Record<string, string>, params.input);
  if (issues.length) return fail(execution, params.organisationId, params.agentName, `Input validation failed: ${issues.join(", ")}`);
  const apiRoute = firstApiRoute(command.steps);
  if (!apiRoute) return fail(execution, params.organisationId, params.agentName, "Command has no reviewed API execution step.");
  const threshold = approvalThreshold(command.approvalRulesJson);
  if (threshold !== null && typeof params.input.amount === "number" && params.input.amount > threshold) {
    await prisma.commandExecution.update({ where: { id: execution.id }, data: { status: ExecutionStatus.waiting_for_approval, approvalStatus: ApprovalStatus.pending } });
    await prisma.approval.create({ data: { organisationId: params.organisationId, executionId: execution.id, commandId: command.id, requestedByAgent: params.agentName, reason: `amount exceeds approval threshold (${threshold})` } });
    await writeAuditLog({ organisationId: params.organisationId, eventType: "approval_requested", actorType: "agent", actorId: params.agentName, commandId: command.id, executionId: execution.id, details: { threshold, amount: params.input.amount } });
    return { status: "waiting_for_approval", approval_required: true, reason: "amount exceeds approval threshold", execution_id: execution.id };
  }
  if (params.dryRun) {
    const output = { dry_run: true, validated: true };
    await prisma.commandExecution.update({ where: { id: execution.id }, data: { status: ExecutionStatus.succeeded, outputJson: output, completedAt: new Date() } });
    return { status: "succeeded", execution_id: execution.id, output, execution_mode: ExecutionMode.api };
  }
  try {
    await prisma.commandExecution.update({ where: { id: execution.id }, data: { status: ExecutionStatus.running } });
    const output = await callControlledTarget(apiRoute, execution.id, params.input);
    await prisma.commandExecution.update({ where: { id: execution.id }, data: { status: ExecutionStatus.succeeded, outputJson: output as Prisma.InputJsonValue, completedAt: new Date() } });
    await writeAuditLog({ organisationId: params.organisationId, eventType: "command_execution_succeeded", actorType: "agent", actorId: params.agentName, commandId: command.id, executionId: execution.id, details: { output, execution_mode: "api" } });
    return { status: "succeeded", execution_id: execution.id, output, execution_mode: ExecutionMode.api };
  } catch (error) {
    return fail(execution, params.organisationId, params.agentName, error instanceof Error ? error.message : String(error));
  }
}

export async function finalizeApprovedExecution(params: { approvalId: string; organisationId: string; reviewerId: string; reviewerRole: string }) {
  const approval = await prisma.approval.findFirst({ where: { id: params.approvalId, organisationId: params.organisationId }, include: { execution: true, command: { include: { steps: { select: { apiRoute: true } } } } } });
  if (!approval) throw new Error("Approval not found");
  if (approval.status !== ApprovalStatus.pending) throw new Error("Approval is not pending");
  if (!["owner", "admin", "reviewer"].includes(params.reviewerRole)) throw new Error("Forbidden: reviewer cannot approve commands");
  const apiRoute = firstApiRoute(approval.command.steps);
  if (!apiRoute) throw new Error("Command has no reviewed API execution step.");
  await prisma.approval.update({ where: { id: approval.id }, data: { status: ApprovalStatus.approved, reviewerId: params.reviewerId, resolvedAt: new Date() } });
  await prisma.commandExecution.update({ where: { id: approval.executionId }, data: { status: ExecutionStatus.running, approvalStatus: ApprovalStatus.approved } });
  try {
    const output = await callControlledTarget(apiRoute, approval.executionId, approval.execution.inputJson as CommandInput);
    await prisma.commandExecution.update({ where: { id: approval.executionId }, data: { status: ExecutionStatus.succeeded, outputJson: output as Prisma.InputJsonValue, executionMode: ExecutionMode.api, completedAt: new Date() } });
    await writeAuditLog({ organisationId: approval.organisationId, eventType: "approval_approved", actorType: "user", actorId: params.reviewerId, commandId: approval.commandId, executionId: approval.executionId, details: { approval_id: approval.id } });
    return output;
  } catch (error) {
    await prisma.commandExecution.update({ where: { id: approval.executionId }, data: { status: ExecutionStatus.failed, errorMessage: error instanceof Error ? error.message : String(error), completedAt: new Date() } });
    throw error;
  }
}

export async function rejectApproval(params: { approvalId: string; organisationId: string; reviewerId: string; reason: string }) {
  const approval = await prisma.approval.findFirst({ where: { id: params.approvalId, organisationId: params.organisationId } });
  if (!approval) throw new Error("Approval not found");
  await prisma.approval.update({ where: { id: approval.id }, data: { status: ApprovalStatus.rejected, reviewerId: params.reviewerId, reason: params.reason, resolvedAt: new Date() } });
  await prisma.commandExecution.update({ where: { id: approval.executionId }, data: { status: ExecutionStatus.failed, approvalStatus: ApprovalStatus.rejected, errorMessage: `Rejected: ${params.reason}`, completedAt: new Date() } });
  await writeAuditLog({ organisationId: approval.organisationId, eventType: "approval_rejected", actorType: "user", actorId: params.reviewerId, commandId: approval.commandId, executionId: approval.executionId, details: { reason: params.reason } });
}
