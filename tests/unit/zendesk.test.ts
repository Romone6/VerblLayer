import { describe, expect, it } from "vitest";

import { buildZendeskTicketPayload, isServerEnvironmentVariableName } from "@/lib/connectors/zendesk";

describe("Zendesk connector inputs", () => {
  it.each(["ZENDESK_API_TOKEN", "SUPPORT_AGENT_EMAIL_2"])("accepts server-only environment variable name %s", (name) => {
    expect(isServerEnvironmentVariableName(name)).toBe(true);
  });

  it.each(["NEXT_PUBLIC_TOKEN", "zendesk_token", "TOKEN-NAME", "1TOKEN"])("rejects unsafe environment variable name %s", (name) => {
    expect(isServerEnvironmentVariableName(name)).toBe(false);
  });

  it("creates a real Zendesk ticket update payload", () => {
    expect(buildZendeskTicketPayload({ status: "pending", priority: "high", comment: "Customer notified" })).toEqual({
      ticket: { status: "pending", priority: "high", comment: { body: "Customer notified", public: true } },
    });
  });

  it("rejects an update with no ticket mutation", () => {
    expect(() => buildZendeskTicketPayload({ ticket_id: "42" })).toThrow("at least one ticket update");
  });
});
