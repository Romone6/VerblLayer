import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  APP_BASE_URL: z.string().url().default("http://localhost:3100"),
  DEV_AUTH_ENABLED: z.enum(["true", "false"]).default("false").transform((value) => value === "true"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4.1-mini"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-3-5-sonnet-latest"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
  DISCOVERY_PROVIDER: z.enum(["openai", "anthropic", "openrouter"]).default("openai"),
  INTERNAL_EXECUTION_TOKEN: z.string().min(1, "INTERNAL_EXECUTION_TOKEN is required"),
  API_KEY_ALLOWED_ORIGINS: z.string().default("http://localhost:3100"),
  API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
}

if (parsed.data.NODE_ENV === "production" && parsed.data.DEV_AUTH_ENABLED && process.env.NEXT_PHASE !== "phase-production-build") {
  throw new Error("DEV_AUTH_ENABLED must be false in production. The public core does not ship hosted authentication.");
}

if (parsed.data.NODE_ENV === "production" && parsed.data.INTERNAL_EXECUTION_TOKEN.length < 32) {
  throw new Error("INTERNAL_EXECUTION_TOKEN must be at least 32 characters in production.");
}

export const env = parsed.data;
