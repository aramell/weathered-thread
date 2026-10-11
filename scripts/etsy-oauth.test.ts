/** Unit tests for scripts/etsy-oauth.ts — PKCE, authorize URL, env upsert. Run via `npm run test:sync`. */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";

import { buildAuthorizeUrl, clientIdFromApiKey, createPkce, exchangeCode, OAuthError, upsertEnvVar } from "./etsy-oauth";

describe("etsy-oauth", () => {
  it("PKCE challenge is the S256 of the verifier", () => {
    const { verifier, challenge, state } = createPkce();
    assert.equal(challenge, createHash("sha256").update(verifier).digest("base64url"));
    assert.ok(verifier.length >= 43 && state.length > 10);
  });

  it("authorize URL carries scope, redirect, client id, state and S256 challenge", () => {
    const url = new URL(buildAuthorizeUrl({ clientId: "abc", challenge: "ch", state: "st" }));
    assert.equal(url.origin + url.pathname, "https://www.etsy.com/oauth/connect");
    assert.equal(url.searchParams.get("scope"), "listings_r");
    assert.equal(url.searchParams.get("redirect_uri"), "http://localhost:3003/callback");
    assert.equal(url.searchParams.get("client_id"), "abc");
    assert.equal(url.searchParams.get("code_challenge_method"), "S256");
    assert.equal(url.searchParams.get("state"), "st");
  });

  it("client id is the keystring half of the API key", () => {
    assert.equal(clientIdFromApiKey("keystring:secret"), "keystring");
    assert.throws(() => clientIdFromApiKey(":secret"), OAuthError);
  });

  it("code exchange posts the verifier and returns both tokens", async () => {
    let body = "";
    const fetchStub = (async (_url: RequestInfo | URL, init?: RequestInit) => {
      body = String(init?.body);
      return new Response(JSON.stringify({ access_token: "a", refresh_token: "r" }));
    }) as typeof fetch;
    assert.deepEqual(await exchangeCode(fetchStub, { clientId: "c", code: "code", verifier: "v" }), {
      accessToken: "a",
      refreshToken: "r",
    });
    const form = new URLSearchParams(body);
    assert.equal(form.get("grant_type"), "authorization_code");
    assert.equal(form.get("code_verifier"), "v");
  });

  it("upsertEnvVar replaces an existing line, appends otherwise, preserves the rest", async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), "etsy-oauth-"));
    const file = path.join(dir, ".env.local");
    try {
      await fs.writeFile(file, "A=1\nETSY_REFRESH_TOKEN=old\nB=2");
      await upsertEnvVar(file, "ETSY_REFRESH_TOKEN", "new$&token");
      assert.equal(await fs.readFile(file, "utf8"), "A=1\nETSY_REFRESH_TOKEN=new$&token\nB=2");
      await upsertEnvVar(file, "C", "3");
      assert.equal(await fs.readFile(file, "utf8"), "A=1\nETSY_REFRESH_TOKEN=new$&token\nB=2\nC=3\n");
    } finally {
      await fs.rm(dir, { recursive: true, force: true });
    }
  });
});
