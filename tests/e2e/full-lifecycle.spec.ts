import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

test("reviewed candidate lifecycle: configure -> publish -> approve -> execute -> drift", async ({ request }) => {
  const user = await prisma.user.findFirstOrThrow();
  const suffix = Date.now().toString().slice(-6);
  const appCreate = await request.post("/api/apps", { data: { name: `Acme Target ${suffix}`, type: "internal_web_app", base_url: "http://localhost:3100", auth_method: "none", execution_mode: "api" } });
  expect(appCreate.ok()).toBeTruthy();
  const appId = (await appCreate.json()).app.id as string;
  // This fixture starts after discovery; discovery itself is separately tested for real provider configuration/errors.
  const candidate = await prisma.workflowCandidate.create({ data: { organisationId: user.organisationId, appId, name: `issue_refund_from_ticket_${suffix}`, description: "Issues a refund from a verified ticket", confidence: 0.82, riskLevel: "medium", requiredInputsJson: ["ticket_id", "amount", "reason"], expectedOutputsJson: ["refund_id", "status", "ticket_status"], approvalConditionsJson: ["amount > 200"], sourceEvidenceJson: ["fixture evidence"], status: "needs_review" } });
  expect((await request.post(`/api/discovery/candidates/${candidate.id}/accept`)).ok()).toBeTruthy();
  const generate = await request.post(`/api/discovery/candidates/${candidate.id}/generate-command`);
  expect(generate.status()).toBe(201);
  const commandId = (await generate.json()).command.id as string;
  const configure = await request.patch(`/api/commands/${commandId}`, { data: { steps: [{ step_type: "api", api_route: "/api/internal/acme/refunds", http_method: "POST" }], approval_rules_json: { amount_greater_than: 200 } } });
  expect(configure.ok()).toBeTruthy();
  expect((await request.post(`/api/commands/${commandId}/publish`)).ok()).toBeTruthy();
  const customer = await prisma.customer.create({ data: { organisationId: user.organisationId, externalId: `FULL-${suffix}`, email: `full-${suffix}@example.com`, name: "Full Flow Customer" } });
  const ticket = await prisma.ticket.create({ data: { organisationId: user.organisationId, customerId: customer.id, ticketCode: `TCK-FULL-${suffix}`, subject: "Full flow refund", description: "full lifecycle", status: "open", refundEligible: true } });
  const run = await request.post(`/api/commands/${commandId}/run`, { data: { agent_name: "full-flow-agent", input: { ticket_id: ticket.ticketCode, amount: 450, reason: "duplicate billing" } } });
  const runBody = await run.json();
  expect(runBody.status).toBe("waiting_for_approval");
  const approval = await prisma.approval.findFirstOrThrow({ where: { organisationId: user.organisationId, executionId: runBody.execution_id, status: "pending" } });
  expect((await request.post(`/api/approvals/${approval.id}/approve`)).ok()).toBeTruthy();
  expect((await (await request.get(`/api/executions/${runBody.execution_id}`)).json()).execution.status).toBe("succeeded");
  expect((await request.post(`/api/drift/check/${commandId}`)).ok()).toBeTruthy();
  const failedRun = await request.post(`/api/commands/${commandId}/run`, { data: { agent_name: "full-flow-agent", input: { ticket_id: ticket.ticketCode, amount: 40 } } });
  expect((await failedRun.json()).status).toBe("failed");
});
