import { issueRefundFromTicket } from "@/lib/acme";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { badRequest, ok, serverError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    if (request.headers.get("x-internal-token") !== env.INTERNAL_EXECUTION_TOKEN) {
      return badRequest("Invalid internal execution token");
    }

    const executionId = request.headers.get("x-execution-id");
    if (!executionId) return badRequest("x-execution-id is required");

    const execution = await prisma.commandExecution.findUnique({
      where: { id: executionId },
      select: { organisationId: true },
    });
    if (!execution) return badRequest("Execution not found");

    const body = await request.json();
    if (typeof body.ticket_id !== "string" || typeof body.amount !== "number" || typeof body.reason !== "string") {
      return badRequest("ticket_id (string), amount (number), reason (string) are required");
    }

    return ok(
      await issueRefundFromTicket({
        organisationId: execution.organisationId,
        ticketId: body.ticket_id,
        amount: body.amount,
        reason: body.reason,
      }),
    );
  } catch (error) {
    return serverError(error);
  }
}
