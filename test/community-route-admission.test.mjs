// /dsh-purge/community admission must follow the same rule as the other /dsh-purge/* routes.
//
// This route is registered separately in apply(), not through installWebServer's registerPluginRoute wrapper,
// and once missed the "listener bind address counts as local" rule: under a non-loopback bind only it returned 403
// while other routes worked. The tests pin three things at once: bind address reachable, loopback reachable, rebinding rejected.
import { test } from "node:test";
import assert from "node:assert/strict";
import { Readable } from "node:stream";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Context, Service } from "@deepseek-ai/cordis";
import { allowPluginRequest } from "../lib/index.js";

const BIND = "192.168.1.50";

/**
 * Calls the admission function directly to compare passing the bind address with omitting it.
 *
 * Core regression assertion: without the third argument (= the old code) the bind address is rejected,
 * with it, it passes. Both must be compared in one test, or fixing one side stays invisible.
 */
const decide = (headers, trusted) => {
  const res = { writeHead(code) { this.code = code; }, end() {} };
  const request = { headers };
  const allowed = trusted === undefined
    ? allowPluginRequest(request, res)
    : allowPluginRequest(request, res, trusted);
  return allowed;
};

test("the bind address passes with trustedHostnames(bind) and is rejected without it", () => {
  const withBind = new Set([BIND]);
  const headers = { host: `${BIND}:43120` };

  assert.equal(decide(headers), false, "must reject when the bind address is omitted (the old community route behavior)");
  assert.equal(decide(headers, withBind), true, "passes only when the bind address is passed (the other routes' behavior)");
});

test("Hosts other than loopback and bind addresses are always rejected", () => {
  const withBind = new Set([BIND]);
  for (const host of ["127.0.0.1:43120", "localhost:43120", "[::1]:43120"]) {
    assert.equal(decide({ host }, withBind), true, host);
  }
  for (const host of ["10.0.0.9:43120", "rebind.evil.example:43120", "example.com"]) {
    assert.equal(decide({ host }, withBind), false, host);
  }
});

/**
 * Starts a minimal host so apply() registers real routes and drives them one by one.
 *
 * apply() also depends on host services; here only the web part must attach routes,
 * and a missing service makes apply throw after routes are usually registered — hence the try.
 */
async function bootRoutes(t, hostEntries = []) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-community-route-"));
  const savedHome = process.env.DSH_HOME;
  const savedTrusted = process.env.PURGE_TRUSTED_HOSTS;
  process.env.DSH_HOME = home;
  delete process.env.PURGE_TRUSTED_HOSTS;

  const { apply, installWebServer } = await import("../lib/index.js");

  class Web extends Service {
    constructor(ctx) {
      super(ctx, "webServer");
      this.routes = new Map();
      this.host = BIND;
      this.port = 43120;
    }
    register(spec) {
      this.routes.set(spec.path, spec);
      return () => this.routes.delete(spec.path);
    }
  }

  const ctx = new Context();
  class Connection extends Service {
    constructor(ctx) {
      super(ctx, "connection");
      this.trustedHosts = hostEntries;
    }
  }
  await ctx.plugin(Connection);
  await ctx.plugin(Web);
  try { apply(ctx, { enabled: false }); } catch { /* only care whether the web routes attached */ }
  if (hostEntries.length) installWebServer(ctx, {});
  await new Promise((resolve) => setTimeout(resolve, 200));

  t.after(async () => {
    await ctx.fiber.dispose().catch(() => {});
    fs.rmSync(home, { recursive: true, force: true });
    if (savedHome === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = savedHome;
    if (savedTrusted === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = savedTrusted;
  });

  const call = async (routePath, headers) => {
    const spec = ctx.webServer.routes.get(routePath);
    if (!spec) return { registered: false };
    const res = {
      headers: {},
      setHeader() {},
      writeHead(code) { this.code = code; },
      end(body) { this.body = body; },
    };
    const request = Object.assign(Readable.from([]), { method: "GET", headers });
    try {
      await spec.handler(request, res);
    } catch (error) {
      return { registered: true, threw: String(error?.message || error) };
    }
    return { registered: true, code: res.code, body: String(res.body || "") };
  };

  return { ctx, call, home };
}

test("/dsh-purge/community no longer returns 403 under a non-loopback bind", async (t) => {
  const { ctx, call } = await bootRoutes(t);
  const spec = ctx.webServer.routes.get("/dsh-purge/community");
  if (!spec) return t.skip("community route not registered in this environment, skipping");

  const result = await call("/dsh-purge/community", { host: `${BIND}:43120` });
  // 401/403 mean admission rejection; any other status (including business-layer 400/500) means it reached the handler.
  assert.notEqual(result.code, 403, "bind-address access to the community route must not be admission-rejected");
  assert.notEqual(result.code, 401);
});

test("/dsh-purge/community still rejects DNS rebinding", async (t) => {
  const { ctx, call } = await bootRoutes(t);
  const spec = ctx.webServer.routes.get("/dsh-purge/community");
  if (!spec) return t.skip("community route not registered in this environment, skipping");

  const result = await call("/dsh-purge/community", {
    host: "rebind.evil.example:43120",
    origin: "http://rebind.evil.example:43120",
    "sec-fetch-site": "same-origin",
  });
  assert.equal(result.code, 403);
});

test("registered routes use the same host and environment allowlists", async (t) => {
  const {call} = await bootRoutes(t, ["host.example"]);
  process.env.PURGE_TRUSTED_HOSTS = "one.example,two.example";
  for (const route of ["/dsh-purge/community", "/dsh-purge/skills", "/dsh-purge/rules"]) {
    for (const host of ["one.example", "two.example", "host.example"]) {
      const result = await call(route, {host, origin: "https://" + host});
      assert.ok(result.registered, route);
      assert.ok(result.code >= 200 && result.code !== 403, JSON.stringify({route, host, result}));
    }
    assert.equal((await call(route, {host: "unknown.example"})).code, 403);
  }
});

test("settings route reports corrupt tuning without leaking contents or replacing it", async t => {
  const { call, home } = await bootRoutes(t, ["localhost"]);
  const dir = path.join(home, "dsh-purge");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "tuning.json");
  const invalid = '{"private-setting":';
  fs.writeFileSync(file, invalid);
  const result = await call("/dsh-purge/boost", { host: `${BIND}:43120` });
  assert.equal(result.code, 500);
  const response = JSON.parse(result.body);
  assert.equal(response.ok, false);
  assert.match(response.error, /tuning\.json/);
  assert.doesNotMatch(response.error, /private-setting/);
  assert.equal(fs.readFileSync(file, "utf8"), invalid);
});
