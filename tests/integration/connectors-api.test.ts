import { describe, expect, it } from "vitest";
import { GET as getConnectors } from "@/app/api/connectors/route";


describe("connectors api", () => {
  it("returns connector catalog with usage rollups", async () => {
    const res = await getConnectors();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.connectors)).toBe(true);

    const zendesk = body.connectors.find((item: { providerKey: string }) => item.providerKey === "zendesk");
    expect(zendesk).toBeTruthy();
    expect(zendesk.status).toBe("available");
    expect(zendesk.capabilities).toContain("api_execution");
    expect(typeof zendesk.usage.total).toBe("number");
  });
});
