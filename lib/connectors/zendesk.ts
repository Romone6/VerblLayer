import { asMetadataRecord, metadataString } from "@/lib/connectors/metadata";

const environmentVariableName = /^[A-Z][A-Z0-9_]*$/;

export function isServerEnvironmentVariableName(value: string): boolean {
  return environmentVariableName.test(value) && !value.startsWith("NEXT_PUBLIC_");
}

export function readZendeskCredentials(metadata: unknown): { email: string; token: string } {
  const record = asMetadataRecord(metadata as never);
  const authEnvironmentKey = metadataString(record, "auth_env_key");
  const usernameEnvironmentKey = metadataString(record, "username_env_key");

  if (!authEnvironmentKey || !usernameEnvironmentKey || !isServerEnvironmentVariableName(authEnvironmentKey) || !isServerEnvironmentVariableName(usernameEnvironmentKey)) {
    throw new Error("Zendesk requires valid server-only auth_env_key and username_env_key metadata.");
  }

  const token = process.env[authEnvironmentKey];
  const email = process.env[usernameEnvironmentKey];
  if (!token || !email) {
    throw new Error(`Zendesk credential environment variable is unavailable (${!token ? authEnvironmentKey : usernameEnvironmentKey}).`);
  }

  return { email, token };
}

export function zendeskAuthorizationHeader(credentials: { email: string; token: string }): string {
  return `Basic ${Buffer.from(`${credentials.email}/token:${credentials.token}`).toString("base64")}`;
}

export function buildZendeskTicketPayload(input: Record<string, unknown>): { ticket: Record<string, unknown> } {
  const ticket: Record<string, unknown> = {};

  if (typeof input.status === "string" && input.status.trim()) ticket.status = input.status.trim();
  if (typeof input.priority === "string" && input.priority.trim()) ticket.priority = input.priority.trim();
  if (typeof input.comment === "string" && input.comment.trim()) ticket.comment = { body: input.comment.trim(), public: true };

  if (Object.keys(ticket).length === 0) {
    throw new Error("Zendesk ticket updates require at least one ticket update.");
  }

  return { ticket };
}
