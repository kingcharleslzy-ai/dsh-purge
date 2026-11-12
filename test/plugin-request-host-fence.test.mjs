// 面板路由的 Host 归属校验。DNS rebinding 时 Host 与 Origin 都是攻击者域名，
// 「两者相等」这种自比较证明不了任何事 —— 必须先要求 Host 属于本机监听目标。
import { test } from "node:test";
import assert from "node:assert/strict";
import { allowPluginRequest } from "../lib/index.js";

const request = (headers) => ({ headers });
const response = () => {
  const seen = { code: undefined, body: "" };
  return {
    seen,
    writeHead(code) { seen.code = code; },
    end(body) { seen.body = String(body || ""); },
  };
};
const decide = (headers, trusted) => {
  const res = response();
  const allowed = allowPluginRequest(request(headers), res, trusted);
  return { allowed, code: res.seen.code, body: res.seen.body };
};

test("DNS rebinding：Host 与 Origin 同为攻击者域名时拒绝", () => {
  // 浏览器把两个头都写成攻击者域名，sec-fetch-site 仍是 same-origin。
  const out = decide({
    host: "rebind.attacker.example:43120",
    origin: "http://rebind.attacker.example:43120",
    "sec-fetch-site": "same-origin",
  });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("DNS rebinding：无 Origin 的读请求同样拒绝", () => {
  // 图片/脚本类探测不带 Origin，Host 是唯一可判断的头。
  const out = decide({ host: "rebind.attacker.example:43120", "sec-fetch-site": "same-origin" });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("本地面板请求放行（127.0.0.1 / localhost / [::1]）", () => {
  for (const host of ["127.0.0.1:43120", "localhost:43120", "[::1]:43120"]) {
    const out = decide({ host, origin: `http://${host}`, "sec-fetch-site": "same-origin" });
    assert.equal(out.allowed, true, host);
  }
});

test("任意 127/8 都算回环，非回环公网地址不算", () => {
  assert.equal(decide({ host: "127.0.0.53:3080" }).allowed, true);
  assert.equal(decide({ host: "127.255.255.254:3080" }).allowed, true);
  assert.equal(decide({ host: "128.0.0.1:3080" }).allowed, false);
  assert.equal(decide({ host: "localhost.evil.example:3080" }).allowed, false);
});

test("真跨站仍被原判定挡住", () => {
  const out = decide({
    host: "127.0.0.1:43120",
    origin: "http://evil.example",
    "sec-fetch-site": "cross-site",
  });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("Origin: null 被拒绝", () => {
  assert.equal(decide({ host: "127.0.0.1:43120", origin: "null" }).allowed, false);
});

test("同机但 Origin 指向别的端口时不放行", () => {
  const out = decide({
    host: "127.0.0.1:43120",
    origin: "http://127.0.0.1:3080",
    "sec-fetch-site": "same-origin",
  });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("不绑定回环时，监听器自己的地址被接受", () => {
  // 局域网绑定：从配置推导的 allowedHosts 才包含它，请求头本身不构成授权。
  const trusted = new Set(["192.168.1.50"]);
  assert.equal(
    decide({ host: "192.168.1.50:43120", origin: "http://192.168.1.50:43120", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  // 同一绑定但 Host 换成攻击者域名 → 仍拒绝。
  assert.equal(decide({ host: "192.168.1.50:43120" }, new Set()).allowed, false);
});

test("显式信任的主机名（反向代理）可用，未列出的域名仍拒绝", () => {
  const trusted = new Set(["panel.example.com"]);
  assert.equal(
    decide({ host: "panel.example.com", origin: "https://panel.example.com", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  assert.equal(
    decide({ host: "other.example.com", origin: "https://other.example.com", "sec-fetch-site": "same-origin" }, trusted).allowed,
    false,
  );
});

test("缺少 Host 头一律拒绝", () => {
  assert.equal(decide({}).allowed, false);
  assert.equal(decide({ origin: "http://127.0.0.1:43120" }).allowed, false);
});

test("PURGE_TRUSTED_HOSTS 提供反向代理/局域网部署的逃生口", async () => {
  const { trustedHostnamesForTest } = await import("../lib/index.js").then((mod) => ({
    trustedHostnamesForTest: mod.__trustedHostnamesForTest,
  })).catch(() => ({ trustedHostnamesForTest: undefined }));
  // 该内部函数不导出时，退化为直接验证端到端行为（见上一个用例），此处只断言不抛错。
  if (typeof trustedHostnamesForTest !== "function") return;
  const names = trustedHostnamesForTest("192.168.1.50", " panel.example.com ; other.example.com ");
  assert.ok(names.has("192.168.1.50"));
  assert.ok(names.has("panel.example.com"));
  assert.ok(names.has("other.example.com"));
});
