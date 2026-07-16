export type ApiExecutionRequest = {
  url: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
};

export function expandApiRouteTemplate(route: string, input: Record<string, unknown>): string {
  if (!route.startsWith("/") || route.startsWith("//") || route.includes("://")) {
    throw new Error("Command API route must be a relative path.");
  }

  return route.replace(/\{([A-Za-z][A-Za-z0-9_]*)\}/g, (_match, key: string) => {
    const value = input[key];
    if (value === undefined || value === null || value === "") {
      throw new Error(`Missing route parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

export function buildApiExecutionRequest(params: {
  baseUrl: string;
  route: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  input: Record<string, unknown>;
}): ApiExecutionRequest {
  return {
    url: new URL(expandApiRouteTemplate(params.route, params.input), params.baseUrl).toString(),
    method: params.method,
  };
}

export function buildApiDriftRequest(baseUrl: string, route: string): string {
  const probeRoute = route.replace(/\{[A-Za-z][A-Za-z0-9_]*\}/g, "0");
  return new URL(expandApiRouteTemplate(probeRoute, {}), baseUrl).toString();
}
