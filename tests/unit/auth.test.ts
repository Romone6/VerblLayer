import { describe, expect, it } from "vitest";

import { validateTrustedProxyIdentity } from "@/lib/auth";

describe("validateTrustedProxyIdentity", () => {
  const secret = "trusted-proxy-secret-with-at-least-32-chars";

  it("accepts a complete proxy-injected identity", () => {
    expect(
      validateTrustedProxyIdentity(
        new Headers({
          "x-verblayer-auth-secret": secret,
          "x-verblayer-org": "acme",
          "x-verblayer-email": "owner@example.com",
        }),
        secret,
      ),
    ).toEqual({ organisationSlug: "acme", email: "owner@example.com" });
  });

  it.each([
    ["missing secret", new Headers({ "x-verblayer-org": "acme", "x-verblayer-email": "owner@example.com" })],
    ["wrong secret", new Headers({ "x-verblayer-auth-secret": "wrong", "x-verblayer-org": "acme", "x-verblayer-email": "owner@example.com" })],
    ["missing organisation", new Headers({ "x-verblayer-auth-secret": secret, "x-verblayer-email": "owner@example.com" })],
    ["invalid email", new Headers({ "x-verblayer-auth-secret": secret, "x-verblayer-org": "acme", "x-verblayer-email": "not-an-email" })],
  ])("rejects %s", (_caseName, headers) => {
    expect(() => validateTrustedProxyIdentity(headers, secret)).toThrow();
  });
});
