// /dsh-purge/community 的准入必须与其他 /dsh-purge/* 路由同口径。
//
// 这条路由在 apply() 里单独注册，不走 installWebServer 的 registerPluginRoute 包装，
// 曾经因此漏掉「监听器绑定地址也算本机」这一条：非回环绑定时只有它返回 403，
// 其余路由正常。下面同时钉住三件事：绑定地址可访问、回环可访问、rebinding 被拒。
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
 * 直接调用准入函数，验证「传绑定地址」与「不传」的差别。
 *
 * 这是回归的核心断言：不传第三个参数（= 旧代码的做法）时绑定地址被拒，
 * 传入后放行。两者必须在同一条测试里对照，否则修好一侧也看不出来。
 */
const decide = (headers, trusted) => {
  const res = { writeHead(code) { this.code = code; }, end() {} };
  const request = { headers };
  const allowed = trusted === undefined
    ? allowPluginRequest(request, res)
    : allowPluginRequest(request, res, trusted);
  return allowed;
};

test("绑定地址在「传 trustedHostnames(bind)」时放行、在「不传」时被拒", () => {
  const withBind = new Set([BIND]);
  const headers = { host: `${BIND}:43120` };

  assert.equal(decide(headers), false, "不传绑定地址时必须拒绝（这是旧 community 路由的行为）");
  assert.equal(decide(headers, withBind), true, "传了绑定地址才放行（其余路由的行为）");
});

test("回环与非回环绑定地址之外的 Host 一律拒绝", () => {
  const withBind = new Set([BIND]);
  for (const host of ["127.0.0.1:43120", "localhost:43120", "[::1]:43120"]) {
    assert.equal(decide({ host }, withBind), true, host);
  }
  for (const host of ["10.0.0.9:43120", "rebind.evil.example:43120", "example.com"]) {
    assert.equal(decide({ host }, withBind), false, host);
  }
});

/**
 * 起一个最小宿主，让 apply() 注册出真实路由并逐个驱动。
 *
 * apply() 还依赖若干宿主服务；这里只需要 web 部分能把路由挂上，
 * 其余服务缺失时 apply 会抛错，但路由往往已经注册完毕 —— 所以用 try 包住。
 */
async function bootRoutes(t) {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-community-route-"));
  const savedHome = process.env.DSH_HOME;
  const savedTrusted = process.env.PURGE_TRUSTED_HOSTS;
  process.env.DSH_HOME = home;
  delete process.env.PURGE_TRUSTED_HOSTS;

  const { apply } = await import("../lib/index.js");

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
  await ctx.plugin(Web);
  try { apply(ctx, { enabled: false }); } catch { /* 只关心 web 路由是否挂上 */ }
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

  return { ctx, call };
}

test("/dsh-purge/community 在非回环绑定下不再返回 403", async (t) => {
  const { ctx, call } = await bootRoutes(t);
  const spec = ctx.webServer.routes.get("/dsh-purge/community");
  if (!spec) return t.skip("该环境未注册 community 路由，跳过");

  const result = await call("/dsh-purge/community", { host: `${BIND}:43120` });
  // 401/403 是准入拒绝；任何别的状态码（含业务层 400/500）都说明放行到 handler 了。
  assert.notEqual(result.code, 403, "绑定地址访问 community 路由不应被准入拒绝");
  assert.notEqual(result.code, 401);
});

test("/dsh-purge/community 仍然拒绝 DNS rebinding", async (t) => {
  const { ctx, call } = await bootRoutes(t);
  const spec = ctx.webServer.routes.get("/dsh-purge/community");
  if (!spec) return t.skip("该环境未注册 community 路由，跳过");

  const result = await call("/dsh-purge/community", {
    host: "rebind.evil.example:43120",
    origin: "http://rebind.evil.example:43120",
    "sec-fetch-site": "same-origin",
  });
  assert.equal(result.code, 403);
});
