/**
 * etsy-live — reads a listing's current per-variation inventory from Etsy at request time.
 * Needs an OAuth `listings_r` token. Etsy rotates the refresh token on every use, so the
 * current pair lives in a shared store (Vercel Blob in production) rather than in env; env
 * only seeds the first refresh. This chain is separate from the one the catalog sync uses
 * (`ETSY_REFRESH_TOKEN`): two consumers of one chain would invalidate each other. Authorize a
 * second time with `npm run auth:etsy` to mint this one, and store it as `ETSY_LIVE_REFRESH_TOKEN`.
 *
 * Server-only, and the Etsy `url` it never touches is the same one NFR8 keeps out of markup.
 */
import "server-only";

import { clientIdFromApiKey, OAuthError, refreshAccessToken, type TokenSet } from "@/scripts/etsy-oauth";
import { parseInventory, type SyncedVariation } from "./etsy-inventory";

const API_BASE = "https://openapi.etsy.com/v3/application";
const REQUEST_TIMEOUT_MS = 8_000;
/** Etsy access tokens last an hour; renew with room to spare. */
const ACCESS_TOKEN_TTL_MS = 50 * 60_000;
/** Etsy allows about 5 requests a second; stay under it even when a build renders many pages at once. */
const MIN_REQUEST_GAP_MS = 300;
const RATE_LIMIT_RETRY_MS = 1_500;

export type StoredTokens = { accessToken: string; refreshToken: string; obtainedAt: number };

export type TokenStore = {
  read: () => Promise<StoredTokens | null>;
  write: (tokens: StoredTokens) => Promise<void>;
};

export type LiveEtsyDeps = {
  /** `<keystring>:<shared_secret>`. */
  apiKey: string;
  /** Used only while the store has nothing yet. */
  seedRefreshToken: string | undefined;
  store: TokenStore;
  fetch: typeof fetch;
  now: () => number;
  /** Injected so tests don't wait. */
  sleep?: (ms: number) => Promise<void>;
};

export class LiveEtsyError extends Error {}

export function createLiveEtsy(deps: LiveEtsyDeps) {
  let memo: StoredTokens | null = null;
  let inflight: Promise<string> | null = null;
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));

  // Requests leave one at a time, spaced out; each waits its turn on the previous one.
  let queue: Promise<unknown> = Promise.resolve();
  const paced = <T>(task: () => Promise<T>): Promise<T> => {
    const run = queue.then(task);
    queue = run.then(
      () => sleep(MIN_REQUEST_GAP_MS),
      () => sleep(MIN_REQUEST_GAP_MS),
    );
    return run;
  };
  const pending = new Map<number, Promise<SyncedVariation[]>>();

  const isFresh = (tokens: StoredTokens) => deps.now() - tokens.obtainedAt < ACCESS_TOKEN_TTL_MS;

  async function renew(): Promise<string> {
    const clientId = clientIdFromApiKey(deps.apiKey);
    const read = await deps.store.read();
    // A rotated pair this instance failed to persist is newer than what the store holds.
    const stored = memo && (!read || memo.obtainedAt > read.obtainedAt) ? memo : read;
    if (stored && isFresh(stored)) {
      memo = stored;
      return stored.accessToken;
    }
    const refreshToken = stored?.refreshToken ?? deps.seedRefreshToken;
    if (!refreshToken) throw new LiveEtsyError("no Etsy refresh token in the store or ETSY_LIVE_REFRESH_TOKEN");

    let tokens: TokenSet;
    try {
      tokens = await refreshAccessToken(deps.fetch, { clientId, refreshToken });
    } catch (error) {
      // Another instance may have rotated the token a moment ago; use what it stored.
      const latest = await deps.store.read();
      if (latest && isFresh(latest)) {
        memo = latest;
        return latest.accessToken;
      }
      throw new LiveEtsyError(error instanceof OAuthError ? error.message : `token refresh failed: ${String(error)}`);
    }
    memo = { ...tokens, obtainedAt: deps.now() };
    // The token is good and Etsy has already rotated the old one, so a failed save must not
    // fail the read; `memo` carries the new pair until a later renew persists it.
    await deps.store.write(memo).catch((error) => {
      console.error("could not store the rotated Etsy token pair:", error);
    });
    return memo.accessToken;
  }

  function getAccessToken(): Promise<string> {
    if (memo && isFresh(memo)) return Promise.resolve(memo.accessToken);
    // Concurrent renders in one instance share a single refresh.
    inflight ??= renew().finally(() => {
      inflight = null;
    });
    return inflight;
  }

  async function requestInventory(listingId: number): Promise<SyncedVariation[]> {
    const what = `listing ${listingId} GET /inventory`;
    const get = async () =>
      deps.fetch(`${API_BASE}/listings/${listingId}/inventory`, {
        headers: {
          "x-api-key": deps.apiKey,
          accept: "application/json",
          authorization: `Bearer ${await getAccessToken()}`,
        },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });
    let response = await paced(get);
    if (response.status === 429) {
      await sleep(RATE_LIMIT_RETRY_MS);
      response = await paced(get);
    }
    if (!response.ok) {
      if (response.status === 401 && memo) {
        // Rejected despite looking fresh (revoked, or rotated elsewhere): force the next call to refresh.
        await deps.store.write({ ...memo, obtainedAt: 0 }).catch(() => {});
        memo = null;
      }
      throw new LiveEtsyError(`${what}: HTTP ${response.status}`);
    }
    return parseInventory(await response.json(), what);
  }

  /** Concurrent callers for one listing share a single request. */
  function fetchVariations(listingId: number): Promise<SyncedVariation[]> {
    let request = pending.get(listingId);
    if (!request) {
      request = requestInventory(listingId).finally(() => pending.delete(listingId));
      pending.set(listingId, request);
    }
    return request;
  }

  return { fetchVariations };
}
