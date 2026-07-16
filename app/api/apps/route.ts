import { ConnectionStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { getDevContext } from "@/lib/auth";
import { badRequest, forbidden, ok, serverError } from "@/lib/http";
import { inferProviderKey } from "@/lib/connectors/catalog";
import { requirePermission } from "@/lib/permissions";
import { createAppSchema } from "@/lib/schemas";

export async function GET() { try { const { organisationId, user } = await getDevContext(); requirePermission(user.role, "apps:read"); return ok({ apps: await prisma.app.findMany({ where: { organisationId }, orderBy: { createdAt: "desc" } }) }); } catch (error) { return error instanceof Error && error.message.startsWith("Forbidden") ? forbidden(error.message) : serverError(error); } }
export async function POST(request: Request) { try { const { organisationId, user } = await getDevContext(); requirePermission(user.role, "apps:manage"); const parsed = createAppSchema.safeParse(await request.json()); if (!parsed.success) return badRequest("Invalid app payload", parsed.error.flatten()); const providerKey = parsed.data.provider_key ?? inferProviderKey(parsed.data.type); const app = await prisma.app.create({ data: { organisationId, name: parsed.data.name, type: parsed.data.type, baseUrl: parsed.data.base_url, authMethod: parsed.data.auth_method, executionMode: parsed.data.execution_mode, connectionStatus: ConnectionStatus.not_connected, metadataJson: { ...parsed.data.metadata_json, provider_key: providerKey } as Prisma.InputJsonValue } }); return ok({ app }, 201); } catch (error) { return error instanceof Error && error.message.startsWith("Forbidden") ? forbidden(error.message) : serverError(error); } }
