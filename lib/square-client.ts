/**
 * square-client — the one place the Square token and location id are read and used. Server-only
 * so the token, the location id and any Payment Link url stay out of client bundles (NFR8).
 *
 * `SQUARE_ENVIRONMENT` picks the credentials: `sandbox` (the default when unset, so a stray
 * local run never touches the live account) reads `SQUARE_SANDBOX_*`; `production` reads
 * `SQUARE_*`. Errors name a variable or an HTTP status, never a credential value.
 */
import "server-only";

/** Pinned so a Square-side default change can't alter request or response shapes under us. */
export const SQUARE_API_VERSION = "2025-10-16";

const REQUEST_TIMEOUT_MS = 8_000;

const BASE_URLS = {
  sandbox: "https://connect.squareupsandbox.com",
  production: "https://connect.squareup.com",
} as const;

export type SquareEnvironment = keyof typeof BASE_URLS;

export type SquareConfig = {
  environment: SquareEnvironment;
  accessToken: string;
  locationId: string;
  baseUrl: string;
};

export class SquareConfigError extends Error {}

/** A failed Square call: `status` is null when no response arrived (network error or timeout). */
export class SquareApiError extends Error {
  constructor(
    message: string,
    readonly status: number | null,
    readonly codes: string[] = [],
  ) {
    super(message);
  }
}

type Env = Record<string, string | undefined>;

/** The env-var prefix for the configured environment: `SQUARE_SANDBOX_` (default) or `SQUARE_`. */
export function squareEnvPrefix(env: Env): "SQUARE_SANDBOX_" | "SQUARE_" {
  return squareEnvironment(env) === "sandbox" ? "SQUARE_SANDBOX_" : "SQUARE_";
}

function squareEnvironment(env: Env): SquareEnvironment {
  const environment = env.SQUARE_ENVIRONMENT?.trim() || "sandbox";
  if (environment !== "sandbox" && environment !== "production") {
    throw new SquareConfigError('SQUARE_ENVIRONMENT must be "sandbox" or "production"');
  }
  return environment;
}

export function resolveSquareConfig(env: Env): SquareConfig {
  const environment = squareEnvironment(env);
  const prefix = squareEnvPrefix(env);
  const read = (name: string) => {
    const value = env[`${prefix}${name}`]?.trim();
    if (!value) throw new SquareConfigError(`${prefix}${name} is not set`);
    return value;
  };
  return {
    environment,
    accessToken: read("ACCESS_TOKEN"),
    locationId: read("LOCATION_ID"),
    baseUrl: BASE_URLS[environment],
  };
}

export type SquareClientDeps = { fetch?: typeof fetch };

export function createSquareClient(config: SquareConfig, deps: SquareClientDeps = {}) {
  const fetchImpl = deps.fetch ?? fetch;

  async function request<T>(method: "GET" | "POST" | "PUT" | "DELETE", path: string, body?: unknown): Promise<T> {
    const what = `${method} ${path}`;
    const headers: Record<string, string> = {
      authorization: `Bearer ${config.accessToken}`,
      "square-version": SQUARE_API_VERSION,
      accept: "application/json",
    };
    if (body !== undefined) headers["content-type"] = "application/json";

    let response: Response;
    try {
      response = await fetchImpl(`${config.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    } catch (error) {
      // The cause can echo request headers, so only its name is kept.
      const reason = error instanceof Error ? error.name : "unknown error";
      throw new SquareApiError(`${what}: request failed (${reason})`, null);
    }

    if (!response.ok) {
      const codes = await errorCodes(response);
      throw new SquareApiError(`${what}: HTTP ${response.status}${codes.length ? ` ${codes.join(",")}` : ""}`, response.status, codes);
    }
    return (await response.json()) as T;
  }

  return { locationId: config.locationId, request };
}

async function errorCodes(response: Response): Promise<string[]> {
  try {
    const body = (await response.json()) as { errors?: { code?: unknown }[] };
    return (body.errors ?? []).flatMap((entry) => (typeof entry.code === "string" ? [entry.code] : []));
  } catch {
    return [];
  }
}

export type SquareClient = ReturnType<typeof createSquareClient>;

let shared: SquareClient | null = null;

/** The client for this process's environment variables, created on first use. */
export function squareClient(): SquareClient {
  shared ??= createSquareClient(resolveSquareConfig(process.env));
  return shared;
}
