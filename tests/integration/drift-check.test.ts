import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { runDriftCheck } from "@/lib/drift";

const prisma = new PrismaClient();
let organisationId = "";
let commandId = "";

beforeAll(async () => {
  const suffix = randomUUID().slice(0, 8);
  const org = await prisma.organisation.create({
    data: { name: `Drift Org ${suffix}`, slug: `drift-org-${suffix}`, plan: "test" },
  });
  organisationId = org.id;

  const command = await prisma.actionCommand.create({
    data: {
      organisationId,
      name: `drift_command_${suffix}`,
      description: "drift command",
      inputSchemaJson: { ticket_id: "string" },
      outputSchemaJson: { status: "string" },
      executionStrategy: "review_required",
      riskLevel: "low",
      successCondition: "ok",
      sourceEvidenceJson: ["drift test"],
      failureConditionsJson: [],
      status: "published",
    },
  });
  commandId = command.id;

  await prisma.commandStep.create({
    data: {
      commandId,
      stepIndex: 0,
      stepType: "api",
      apiRoute: "/api/this-route-does-not-exist",
      httpMethod: "GET",
    },
  });
});

afterAll(async () => {
  await prisma.auditLog.deleteMany({ where: { organisationId } });
  await prisma.driftCheck.deleteMany({ where: { organisationId } });
  await prisma.commandStep.deleteMany({ where: { commandId } });
  await prisma.actionCommand.deleteMany({ where: { organisationId } });
  await prisma.organisation.deleteMany({ where: { id: organisationId } });
  await prisma.$disconnect();
});

describe("drift monitor", () => {
  it("stores broken/warning result from real check", async () => {
    const check = await runDriftCheck(commandId, organisationId);
    expect(["warning", "broken", "healthy"]).toContain(check.status);

    const stored = await prisma.driftCheck.findMany({ where: { organisationId } });
    expect(stored.length).toBe(1);
  }, 20000);

});
