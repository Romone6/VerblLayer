import { prisma } from "@/lib/db";
import { env } from "@/lib/env";

export type RequestContext = {
  userId: string;
  organisationId: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
};

/**
 * The public core deliberately has no hosted identity provider. Local access is
 * enabled only for development and test environments, and always resolves an
 * actual persisted user/workspace pair.
 */
export async function getRequestContext(): Promise<RequestContext> {
  if (!env.DEV_AUTH_ENABLED) {
    throw new Error("Local authentication is disabled. Set DEV_AUTH_ENABLED=true outside production to use the web console.");
  }

  const user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!user) {
    throw new Error("No local user found. Run `pnpm prisma:seed` first.");
  }

  return {
    userId: user.id,
    organisationId: user.organisationId,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export const getDevContext = getRequestContext;
