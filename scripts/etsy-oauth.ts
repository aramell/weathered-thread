/**
 * Etsy OAuth 2.0 (authorization code + PKCE) helpers shared by `scripts/etsy-auth.ts`
 * (one-time consent), `scripts/sync-etsy.ts` (refresh on every run) and the server-only
 * `lib/etsy-live.ts` (refresh at request time). Nothing under `app/` or `components/` may import
 * this, and it never reaches a client bundle.
 */
import { createHash, randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const AUTHORIZE_URL = "https://www.etsy.com/oauth/connect";
export const TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";
export const SCOPE = "listings_r";
export const REDIRECT_PORT = 3003;
/** Must be registered verbatim as a redirect URI on the Etsy app. */
export const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`;
const REQUEST_TIMEOUT_MS = 30_000;

export class OAuthError extends Error {}

export type TokenSet = { accessToken: string; refreshToken: string };

/** An Etsy app's OAuth client_id is the keystring half of `<keystring>:<shared_secret>`. */
export function clientIdFromApiKey(apiKey: string): string {
  const keystring = apiKey.split(":")[0]?.trim();
  if (!keystring) throw new OAuthError("ETSY_API_KEY must look like <keystring>:<shared_secret>");
  return keystring;
}

const base64url = (buffer: Buffer) => buffer.toString("base64url");

export function createPkce(): { verifier: string; challenge: string; state: string } {
  const verifier = base64url(randomBytes(48));
  return {
    verifier,
    challenge: base64url(createHash("sha256").update(verifier).digest()),
    state: base64url(randomBytes(16)),
  };
}

export function buildAuthorizeUrl(params: { clientId: string; challenge: string; state: string }): string {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPE,
    client_id: params.clientId,
    state: params.state,
    code_challenge: params.challenge,
    code_challenge_method: "S256",
  }).toString();
  return url.toString();
}

async function postToken(fetchFn: typeof fetch, body: Record<string, string>, what: string): Promise<TokenSet> {
  let response: Response;
  try {
    response = await fetchFn(TOKEN_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new OAuthError(`${what}: network error: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) {
    const detail = (await response.text().catch(() => "")).slice(0, 200).trim();
    const hint =
      response.status === 400 || response.status === 401
        ? " (the refresh token may be expired or revoked — re-run `npm run auth:etsy`)"
        : "";
    throw new OAuthError(`${what}: HTTP ${response.status}${hint}${detail ? ` — ${detail}` : ""}`);
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    throw new OAuthError(`${what}: response was not valid JSON`);
  }
  const record = typeof json === "object" && json !== null ? (json as Record<string, unknown>) : {};
  const { access_token: accessToken, refresh_token: refreshToken } = record;
  if (typeof accessToken !== "string" || !accessToken || typeof refreshToken !== "string" || !refreshToken) {
    throw new OAuthError(`${what}: malformed token response`);
  }
  return { accessToken, refreshToken };
}

export function exchangeCode(
  fetchFn: typeof fetch,
  params: { clientId: string; code: string; verifier: string },
): Promise<TokenSet> {
  return postToken(
    fetchFn,
    {
      grant_type: "authorization_code",
      client_id: params.clientId,
      redirect_uri: REDIRECT_URI,
      code: params.code,
      code_verifier: params.verifier,
    },
    "token exchange",
  );
}

export function refreshAccessToken(
  fetchFn: typeof fetch,
  params: { clientId: string; refreshToken: string },
): Promise<TokenSet> {
  return postToken(
    fetchFn,
    { grant_type: "refresh_token", client_id: params.clientId, refresh_token: params.refreshToken },
    "token refresh",
  );
}

/** Set `NAME=value` in an env file (replacing an existing line, else appending), keeping everything else. */
export async function upsertEnvVar(file: string, name: string, value: string): Promise<void> {
  const existing = await fs.readFile(file, "utf8").catch(() => "");
  const line = `${name}=${value}`;
  const pattern = new RegExp(`^${name}=.*$`, "m");
  const next = pattern.test(existing)
    ? existing.replace(pattern, () => line)
    : `${existing}${existing === "" || existing.endsWith("\n") ? "" : "\n"}${line}\n`;
  const tmp = path.join(path.dirname(file), `.${path.basename(file)}.tmp-${process.pid}`);
  await fs.writeFile(tmp, next, { encoding: "utf8", mode: 0o600 });
  await fs.rename(tmp, file);
}
