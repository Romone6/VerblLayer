-- Intentional destructive pivot: removes enterprise-only surfaces. Back up a deployed database before applying.
DROP TABLE IF EXISTS "send_events" CASCADE;
DROP TABLE IF EXISTS "approval_policies" CASCADE;
DROP TABLE IF EXISTS "compliance_exports" CASCADE;
DROP TABLE IF EXISTS "export_signing_keys" CASCADE;
DROP TABLE IF EXISTS "retention_policies" CASCADE;
DROP TABLE IF EXISTS "identity_providers" CASCADE;
DROP TABLE IF EXISTS "scim_tokens" CASCADE;
DROP TABLE IF EXISTS "organisation_security_policies" CASCADE;
DROP TABLE IF EXISTS "custom_roles" CASCADE;
DROP TABLE IF EXISTS "cron_jwks_keys" CASCADE;
ALTER TABLE "users" DROP COLUMN IF EXISTS "clerk_user_id", DROP COLUMN IF EXISTS "external_id";
ALTER TABLE "organisations" DROP COLUMN IF EXISTS "clerk_org_id";
ALTER TABLE "command_steps" DROP COLUMN IF EXISTS "selector", DROP COLUMN IF EXISTS "fallback_selector";
ALTER TABLE "approvals" DROP COLUMN IF EXISTS "stage_index", DROP COLUMN IF EXISTS "stage_name", DROP COLUMN IF EXISTS "required_role";
DROP TYPE IF EXISTS "CronJwksKeyStatus";
