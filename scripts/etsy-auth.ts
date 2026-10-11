/**
 * etsy-auth — one-time Etsy OAuth consent (`npm run auth:etsy`).
 *
 * Starts a throwaway server on localhost, sends you to Etsy to approve the `listings_r`
 * scope as the shop owner, exchanges the returned code (PKCE) for tokens, and saves the
 * refresh token to `.env.local` as ETSY_REFRESH_TOKEN. `npm run sync:etsy` then refreshes
 * its own access token on every run. Tokens are never printed.
 *
 * Prereq: register REDIRECT_URI (http://localhost:3003/callback) on your Etsy app.
 */
import { execFile } from "node:child_process";
import http from "node:http";
import path from "node:path";

import {
  buildAuthorizeUrl,
  clientIdFromApiKey,
  createPkce,
  exchangeCode,
  OAuthError,
  REDIRECT_PORT,
  REDIRECT_URI,
  upsertEnvVar,
} from "./etsy-oauth";

const WAIT_MS = 5 * 60_000;

function waitForCode(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? "/", REDIRECT_URI);
      if (url.pathname !== "/callback") {
        res.writeHead(404).end();
        return;
      }
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      const ok = !error && code && url.searchParams.get("state") === expectedState;
      res.writeHead(ok ? 200 : 400, { "content-type": "text/plain; charset=utf-8" });
      res.end(ok ? "Etsy authorization received. You can close this tab." : "Authorization failed. Check the terminal.");
      clearTimeout(timer);
      server.close();
      if (ok) resolve(code);
      else reject(new OAuthError(error ? `Etsy denied authorization: ${error}` : "callback state mismatch or missing code"));
    });
    const timer = setTimeout(() => {
      server.close();
      reject(new OAuthError("timed out waiting for Etsy authorization (5 minutes)"));
    }, WAIT_MS);
    server.on("error", (err) => {
      clearTimeout(timer);
      reject(new OAuthError(`could not listen on port ${REDIRECT_PORT}: ${err.message}`));
    });
    server.listen(REDIRECT_PORT, "127.0.0.1");
  });
}

async function main(): Promise<void> {
  const apiKey = process.env.ETSY_API_KEY?.trim();
  if (!apiKey) throw new OAuthError("ETSY_API_KEY is not set. Put `<keystring>:<shared_secret>` in .env.local first.");
  const clientId = clientIdFromApiKey(apiKey);
  const { verifier, challenge, state } = createPkce();
  const authorizeUrl = buildAuthorizeUrl({ clientId, challenge, state });

  const pending = waitForCode(state);
  pending.catch(() => {}); // surfaced below; avoids an unhandled rejection if the browser step throws first
  console.log(`Approve access in your browser (redirect URI ${REDIRECT_URI} must be registered on the Etsy app):\n\n${authorizeUrl}\n`);
  if (process.platform === "darwin") execFile("open", [authorizeUrl], () => {});

  const code = await pending;
  const tokens = await exchangeCode(fetch, { clientId, code, verifier });
  await upsertEnvVar(path.join(process.cwd(), ".env.local"), "ETSY_REFRESH_TOKEN", tokens.refreshToken);
  console.log("Saved ETSY_REFRESH_TOKEN to .env.local. Now run: npm run sync:etsy");
}

main().catch((error) => {
  console.error(`etsy-auth: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
