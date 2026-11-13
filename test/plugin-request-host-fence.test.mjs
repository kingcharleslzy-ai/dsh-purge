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

test("IPv6 回环，含 IPv4-mapped 形式", () => {
  // 宿主 isLoopbackHost() 用 range() === "loopback"，把 mapped 形式也算回环。
  for (const host of ["[::1]:43120", "[::1]", "[0:0:0:0:0:0:0:1]:43120"]) {
    assert.equal(decide({ host }).allowed, true, host);
  }
  for (const host of ["[::ffff:127.0.0.1]:43120", "[::ffff:127.0.0.53]:43120"]) {
    assert.equal(decide({ host }).allowed, true, host);
  }
  // 非回环 IPv6 不应因为格式被误判为回环
  for (const host of ["[2001:db8::1]:43120", "[::2]:43120", "[fe80::1]:43120"]) {
    assert.equal(decide({ host }).allowed, false, host);
  }
});

test("绑定裸 IPv6 地址时，带方括号的 Host 能匹配", () => {
  // webServer.host 是配置原文：可能是 `2001:db8::1` 这种不带方括号的裸地址，
  // 而 HTTP 的 Host 头必须写成 `[2001:db8::1]:端口`。两者规范化后必须相等。
  const trusted = new Set(["2001:db8::1"]);
  assert.equal(
    decide({ host: "[2001:db8::1]:43120", origin: "http://[2001:db8::1]:43120", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  // 裸地址的端口写法有歧义，规范化后仍是地址本身
  assert.equal(decide({ host: "2001:db8::1" }, trusted).allowed, true);
  // 相邻地址仍拒绝
  assert.equal(decide({ host: "[2001:db8::2]:43120" }, trusted).allowed, false);
});

test("绑定裸 ::1 时，回环请求仍放行", () => {
  // 裸 `::1` 若按「最后一个冒号是端口」截断会变成 `:`，导致本机访问被拒。
  const trusted = new Set(["::1"]);
  assert.equal(decide({ host: "[::1]:43120" }, trusted).allowed, true);
  assert.equal(decide({ host: "[::1]" }, trusted).allowed, true);
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

test("PURGE_TRUSTED_HOSTS 解析出可用的信任名单（默认参数路径）", (t) => {
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });

  // 分隔符混用：逗号、分号、空白、带端口、带方括号、大小写、前后空白。
  process.env.PURGE_TRUSTED_HOSTS = " Panel.Example.COM ; 192.168.1.50:43120 ,[fd00::1]:8080 ";
  // 省略第三个参数 → 走 allowPluginRequest 的默认值（= 从环境变量读）。
  assert.equal(decide({ host: "panel.example.com", "sec-fetch-site": "same-origin" }).allowed, true);
  assert.equal(decide({ host: "192.168.1.50:9999" }).allowed, true, "端口不同也应匹配主机名");
  assert.equal(decide({ host: "[fd00::1]:43120" }).allowed, true);
  // 未列出的域名仍拒绝。
  assert.equal(decide({ host: "other.example.com" }).allowed, false);
});

test("清空 PURGE_TRUSTED_HOSTS 后不再放行非回环主机", (t) => {
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });

  process.env.PURGE_TRUSTED_HOSTS = "panel.example.com";
  assert.equal(decide({ host: "panel.example.com" }).allowed, true);

  delete process.env.PURGE_TRUSTED_HOSTS;
  assert.equal(decide({ host: "panel.example.com" }).allowed, false, "取消信任后必须回落为拒绝");
  // 回环不依赖该变量。
  assert.equal(decide({ host: "127.0.0.1:3080" }).allowed, true);
});

test("信任名单不影响回环判定，也不能绕过 Origin 同源检查", (t) => {
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });
  process.env.PURGE_TRUSTED_HOSTS = "panel.example.com";

  // 信任了 panel，但 Origin 指向别处 → 仍然拒绝。
  assert.equal(
    decide({ host: "panel.example.com", origin: "https://evil.example", "sec-fetch-site": "same-origin" }).allowed,
    false,
  );
  // sec-fetch-site: cross-site 优先级高于信任名单。
  assert.equal(
    decide({ host: "panel.example.com", origin: "https://panel.example.com", "sec-fetch-site": "cross-site" }).allowed,
    false,
  );
});

test("malformed port or bracket suffix does not identify a local listener", () => {
  for (const host of ["localhost:bad", "localhost:65536", "[::1]extra", "[::1]:bad", "127.0.00.1"]) {
    assert.equal(decide({ host }).allowed, false, host);
  }
});

test("宿主 --trusted-host 的域名可进面板（与 DSH 本体口径一致）", () => {
  // 部署用 `--trusted-host dsh.example.com` 让 DSH 本体接受这个域名，
  // 面板原先只认回环 + 监听地址，于是同一台机器上"宿主能进、面板 403"。
  // 合并宿主连接服务给出的清单后，两边判定一致。
  const trusted = new Set(["dsh.example.com"]);
  assert.equal(
    decide({ host: "dsh.example.com", origin: "https://dsh.example.com", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  // 合并不等于放松：未列出的域名照样拒绝。
  assert.equal(
    decide({ host: "other.example.com", origin: "https://other.example.com", "sec-fetch-site": "same-origin" }, trusted).allowed,
    false,
  );
});

test("宿主受信清单不绕过 Origin 同源与 cross-site 检查", () => {
  const trusted = new Set(["dsh.example.com"]);
  // Host 已受信，但 Origin 指向攻击者 → 拒绝。
  assert.equal(
    decide({ host: "dsh.example.com", origin: "https://evil.example", "sec-fetch-site": "same-origin" }, trusted).allowed,
    false,
  );
  // cross-site 的优先级更高。
  assert.equal(
    decide({ host: "dsh.example.com", origin: "https://dsh.example.com", "sec-fetch-site": "cross-site" }, trusted).allowed,
    false,
  );
  // Origin: null 依旧拒绝。
  assert.equal(decide({ host: "dsh.example.com", origin: "null" }, trusted).allowed, false);
});

test("a host deployment and the environment can each allow additional same-origin names", async (t) => {
  const { trustedHostnames } = await import("../lib/index.js");
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });
  process.env.PURGE_TRUSTED_HOSTS = "a.example,b.example; c.example d.example";
  const trusted = trustedHostnames("0.0.0.0", ["host.example"]);
  for (const host of ["a.example", "b.example", "c.example", "d.example", "host.example"]) {
    assert.equal(decide({ host, origin: "https://" + host }, trusted).allowed, true, host);
  }
  assert.equal(decide({host: "unknown.example"}, trusted).allowed, false);
  assert.equal(decide({host: "host.example", origin: "https://a.example"}, trusted).allowed, false);
  assert.equal(decide({host: "a.example", "sec-fetch-site": "cross-site"}, trusted).allowed, false);
});
