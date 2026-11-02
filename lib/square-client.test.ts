import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  createSquareClient,
  squareEnvPrefix,
  resolveSquareConfig,
  SQUARE_API_VERSION,
  SquareApiError,
  SquareConfigError,
  type SquareConfig,
} from "./square-client";

const SANDBOX_TOKEN = "sandbox-token-secret";
const PRODUCTION_TOKEN = "production-token-secret";

const env = {
  SQUARE_SANDBOX_ACCESS_TOKEN: SANDBOX_TOKEN,
  SQUARE_SANDBOX_LOCATION_ID: "LSANDBOX",
  SQUARE_ACCESS_TOKEN: PRODUCTION_TOKEN,
  SQUARE_LOCATION_ID: "LPROD",
};

describe("resolveSquareConfig", () => {
  it("defaults to sandbox when SQUARE_ENVIRONMENT is unset or blank", () => {
    for (const environment of [undefined, "", "  "]) {
      const config = resolveSquareConfig({ ...env, SQUARE_ENVIRONMENT: environment });
      assert.equal(config.environment, "sandbox");
      assert.equal(config.accessToken, SANDBOX_TOKEN);
      assert.equal(config.locationId, "LSANDBOX");
      assert.equal(config.baseUrl, "https://connect.squareupsandbox.com");
    }
  });

  it("uses the production variables only when SQUARE_ENVIRONMENT is production", () => {
    const config = resolveSquareConfig({ ...env, SQUARE_ENVIRONMENT: "production" });
    assert.equal(config.environment, "production");
    assert.equal(config.accessToken, PRODUCTION_TOKEN);
    assert.equal(config.locationId, "LPROD");
    assert.equal(config.baseUrl, "https://connect.squareup.com");
  });

  it("trims whitespace around values", () => {
    const config = resolveSquareConfig({
      SQUARE_ENVIRONMENT: " sandbox ",
      SQUARE_SANDBOX_ACCESS_TOKEN: ` ${SANDBOX_TOKEN}\n`,
      SQUARE_SANDBOX_LOCATION_ID: " LSANDBOX ",
    });
    assert.equal(config.accessToken, SANDBOX_TOKEN);
    assert.equal(config.locationId, "LSANDBOX");
  });

  it("names the missing variable without echoing any value", () => {
    assert.throws(
      () => resolveSquareConfig({ SQUARE_SANDBOX_LOCATION_ID: "LSANDBOX" }),
      (error: unknown) => error instanceof SquareConfigError && /SQUARE_SANDBOX_ACCESS_TOKEN/.test(error.message),
    );
    assert.throws(
      () => resolveSquareConfig({ SQUARE_ENVIRONMENT: "production", SQUARE_ACCESS_TOKEN: PRODUCTION_TOKEN }),
      (error: unknown) =>
        error instanceof SquareConfigError &&
        /SQUARE_LOCATION_ID/.test(error.message) &&
        !error.message.includes(PRODUCTION_TOKEN),
    );
  });

  it("rejects an unknown environment instead of guessing", () => {
    assert.throws(
      () => resolveSquareConfig({ ...env, SQUARE_ENVIRONMENT: "prod" }),
      (error: unknown) => error instanceof SquareConfigError && /SQUARE_ENVIRONMENT/.test(error.message),
    );
  });
});

describe("squareEnvPrefix", () => {
  it("is the sandbox prefix by default and the plain one in production", () => {
    assert.equal(squareEnvPrefix({}), "SQUARE_SANDBOX_");
    assert.equal(squareEnvPrefix({ SQUARE_ENVIRONMENT: "production" }), "SQUARE_");
    assert.throws(() => squareEnvPrefix({ SQUARE_ENVIRONMENT: "prod" }), SquareConfigError);
  });
});

const config: SquareConfig = {
  environment: "sandbox",
  accessToken: SANDBOX_TOKEN,
  locationId: "LSANDBOX",
  baseUrl: "https://connect.squareupsandbox.com",
};

function stubFetch(respond: (url: string, init: RequestInit) => Response | Promise<Response>) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchStub = (async (input: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(input), init });
    return respond(String(input), init);
  }) as typeof fetch;
  return { fetchStub, calls };
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("createSquareClient", () => {
  it("sends the bearer token, pinned version and JSON body to the environment's host", async () => {
    const { fetchStub, calls } = stubFetch(() => json({ payment_link: { id: "PL1" } }));
    const client = createSquareClient(config, { fetch: fetchStub });

    const result = await client.request<{ payment_link: { id: string } }>("POST", "/v2/online-checkout/payment-links", {
      idempotency_key: "k1",
    });

    assert.equal(result.payment_link.id, "PL1");
    assert.equal(calls[0].url, "https://connect.squareupsandbox.com/v2/online-checkout/payment-links");
    assert.equal(calls[0].init.method, "POST");
    const headers = new Headers(calls[0].init.headers);
    assert.equal(headers.get("authorization"), `Bearer ${SANDBOX_TOKEN}`);
    assert.equal(headers.get("square-version"), SQUARE_API_VERSION);
    assert.equal(headers.get("content-type"), "application/json");
    assert.equal(calls[0].init.body, JSON.stringify({ idempotency_key: "k1" }));
    assert.equal(calls[0].init.cache, "no-store");
  });

  it("sends no body or content type on a bodiless GET", async () => {
    const { fetchStub, calls } = stubFetch(() => json({ location: {} }));
    await createSquareClient(config, { fetch: fetchStub }).request("GET", "/v2/locations/LSANDBOX");
    assert.equal(calls[0].init.body, undefined);
    assert.equal(new Headers(calls[0].init.headers).get("content-type"), null);
  });

  it("exposes the configured location id", () => {
    assert.equal(createSquareClient(config, { fetch: stubFetch(() => json({})).fetchStub }).locationId, "LSANDBOX");
  });

  it("turns an error response into a SquareApiError carrying status and codes, never the token", async () => {
    const { fetchStub } = stubFetch(() =>
      json({ errors: [{ category: "INVALID_REQUEST_ERROR", code: "BAD_REQUEST", detail: "nope" }] }, 400),
    );
    await assert.rejects(
      createSquareClient(config, { fetch: fetchStub }).request("POST", "/v2/x", {}),
      (error: unknown) =>
        error instanceof SquareApiError &&
        error.status === 400 &&
        error.codes.join() === "BAD_REQUEST" &&
        !error.message.includes(SANDBOX_TOKEN),
    );
  });

  it("handles an error response whose body is not JSON", async () => {
    const { fetchStub } = stubFetch(() => new Response("<html>bad gateway</html>", { status: 502 }));
    await assert.rejects(
      createSquareClient(config, { fetch: fetchStub }).request("GET", "/v2/x"),
      (error: unknown) => error instanceof SquareApiError && error.status === 502 && error.codes.length === 0,
    );
  });

  it("wraps a network failure or timeout without status and without leaking the token", async () => {
    const { fetchStub } = stubFetch(() => {
      throw new TypeError(`fetch failed for Bearer ${SANDBOX_TOKEN}`);
    });
    await assert.rejects(
      createSquareClient(config, { fetch: fetchStub }).request("GET", "/v2/x"),
      (error: unknown) =>
        error instanceof SquareApiError && error.status === null && !error.message.includes(SANDBOX_TOKEN),
    );
  });

  it("passes an abort signal so a hung request times out", async () => {
    const { fetchStub, calls } = stubFetch(() => json({}));
    await createSquareClient(config, { fetch: fetchStub }).request("GET", "/v2/x");
    assert.ok(calls[0].init.signal instanceof AbortSignal);
  });
});
