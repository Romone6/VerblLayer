import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const repositoryRoot = process.cwd();
const packageJson = JSON.parse(readFileSync(resolve(repositoryRoot, "package.json"), "utf8")) as { scripts: Record<string, string> };
const workflow = readFileSync(resolve(repositoryRoot, ".github/workflows/phase4-gate.yml"), "utf8");

describe("publication CI contract", () => {
  it("uses the current Postgres-only verification command", () => {
    expect(packageJson.scripts["verify:ci"]).toContain("prisma:migrate:deploy");
    expect(packageJson.scripts["verify:ci"]).toContain("playwright:test");
    expect(workflow).toContain("pnpm verify:ci");
    expect(workflow).not.toContain("verify:phase4:ci");
    expect(workflow).not.toContain("redis:");
  });

  it("enables dependency update monitoring for the public repository", () => {
    const dependabot = readFileSync(resolve(repositoryRoot, ".github/dependabot.yml"), "utf8");
    expect(dependabot).toContain("package-ecosystem: npm");
    expect(dependabot).toContain("interval: weekly");
  });
});
