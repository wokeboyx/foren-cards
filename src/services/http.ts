// HTTP client for the Foren API. Not used yet: every service still runs on the mock backend.
// See src/services/README.md for how to switch a service over.

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly body?: unknown,
  ) {
    super(message);
  }
}

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

/** JSON request to the API. Throws ApiError on a non-2xx response, which the UI shows as a failed save/load. */
export async function http<T>(
  path: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      Accept: "application/json",
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
    credentials: "include",
  });
  const body =
    res.status === 204 ? undefined : await res.json().catch(() => undefined);
  if (!res.ok)
    throw new ApiError(
      (body as { message?: string } | undefined)?.message ?? res.statusText,
      res.status,
      body,
    );
  return body as T;
}
