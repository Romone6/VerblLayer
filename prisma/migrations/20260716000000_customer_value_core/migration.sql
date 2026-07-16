-- Additive customer-value core migration. No existing command contracts are removed.
CREATE TABLE "command_versions" (
    "id" TEXT NOT NULL,
    "command_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "published_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "command_versions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "command_executions" ADD COLUMN "is_dry_run" BOOLEAN NOT NULL DEFAULT false;

CREATE UNIQUE INDEX "command_versions_command_id_version_key" ON "command_versions"("command_id", "version");
CREATE INDEX "command_versions_command_id_idx" ON "command_versions"("command_id");

ALTER TABLE "command_versions" ADD CONSTRAINT "command_versions_command_id_fkey" FOREIGN KEY ("command_id") REFERENCES "action_commands"("id") ON DELETE CASCADE ON UPDATE CASCADE;
