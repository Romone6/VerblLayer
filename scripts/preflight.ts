import { getReadinessReport } from "../lib/readiness";

async function main() {
  const report = await getReadinessReport();
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== "ok") process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
