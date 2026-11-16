// Host ownership validation for panel routes. During DNS rebinding, Host and Origin are both attacker domains;
// "both are equal" self-comparison proves nothing — Host must first be required to belong to a local listener target.
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

test("DNS rebinding: rejected when Host and Origin are both attacker domains", () => {
  // The browser writes both headers as the attacker domain; sec-fetch-site remains same-origin.
  const out = decide({
    host: "rebind.attacker.example:43120",
    origin: "http://rebind.attacker.example:43120",
    "sec-fetch-site": "same-origin",
  });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("DNS rebinding: read requests without Origin are also rejected", () => {
  // Image/script probes do not carry Origin; Host is the only header that can be checked.
  const out = decide({ host: "rebind.attacker.example:43120", "sec-fetch-site": "same-origin" });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("local panel requests are allowed (127.0.0.1 / localhost / [::1])", () => {
  for (const host of ["127.0.0.1:43120", "localhost:43120", "[::1]:43120"]) {
    const out = decide({ host, origin: `http://${host}`, "sec-fetch-site": "same-origin" });
    assert.equal(out.allowed, true, host);
  }
});

test("any 127/8 address counts as loopback; non-loopback public addresses do not", () => {
  assert.equal(decide({ host: "127.0.0.53:3080" }).allowed, true);
  assert.equal(decide({ host: "127.255.255.254:3080" }).allowed, true);
  assert.equal(decide({ host: "128.0.0.1:3080" }).allowed, false);
  assert.equal(decide({ host: "localhost.evil.example:3080" }).allowed, false);
});

test("IPv6 loopback, including IPv4-mapped forms", () => {
  // Host-side isLoopbackHost() uses range() === "loopback", which also treats mapped forms as loopback.
  for (const host of ["[::1]:43120", "[::1]", "[0:0:0:0:0:0:0:1]:43120"]) {
    assert.equal(decide({ host }).allowed, true, host);
  }
  for (const host of ["[::ffff:127.0.0.1]:43120", "[::ffff:127.0.0.53]:43120"]) {
    assert.equal(decide({ host }).allowed, true, host);
  }
  // Non-loopback IPv6 must not be misclassified as loopback due to format
  for (const host of ["[2001:db8::1]:43120", "[::2]:43120", "[fe80::1]:43120"]) {
    assert.equal(decide({ host }).allowed, false, host);
  }
});

test("when bound to a bare IPv6 address, a bracketed Host header can match", () => {
  // webServer.host is the raw config value: it may be a bare address like `2001:db8::1` without brackets,
  // while the HTTP Host header must be written as `[2001:db8::1]:port`. The two must be equal after normalization.
  const trusted = new Set(["2001:db8::1"]);
  assert.equal(
    decide({ host: "[2001:db8::1]:43120", origin: "http://[2001:db8::1]:43120", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  // Port notation for a bare address is ambiguous; after normalization it remains the address itself
  assert.equal(decide({ host: "2001:db8::1" }, trusted).allowed, true);
  // Adjacent addresses are still rejected
  assert.equal(decide({ host: "[2001:db8::2]:43120" }, trusted).allowed, false);
});

test("when bound to bare ::1, loopback requests are still allowed", () => {
  // If bare `::1` were truncated by treating "last colon as port", it would become `:` and reject local access.
  const trusted = new Set(["::1"]);
  assert.equal(decide({ host: "[::1]:43120" }, trusted).allowed, true);
  assert.equal(decide({ host: "[::1]" }, trusted).allowed, true);
});

test("true cross-site requests are still blocked by the original check", () => {
  const out = decide({
    host: "127.0.0.1:43120",
    origin: "http://evil.example",
    "sec-fetch-site": "cross-site",
  });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("Origin: null is rejected", () => {
  assert.equal(decide({ host: "127.0.0.1:43120", origin: "null" }).allowed, false);
});

test("same machine but Origin pointing to a different port is not allowed", () => {
  const out = decide({
    host: "127.0.0.1:43120",
    origin: "http://127.0.0.1:3080",
    "sec-fetch-site": "same-origin",
  });
  assert.equal(out.allowed, false);
  assert.equal(out.code, 403);
});

test("when not bound to loopback, the listener's own address is accepted", () => {
  // LAN binding: only allowedHosts derived from config include it; the request header itself does not grant authorization.
  const trusted = new Set(["192.168.1.50"]);
  assert.equal(
    decide({ host: "192.168.1.50:43120", origin: "http://192.168.1.50:43120", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  // Same binding but Host replaced with an attacker domain → still rejected.
  assert.equal(decide({ host: "192.168.1.50:43120" }, new Set()).allowed, false);
});

test("explicitly trusted hostnames (reverse proxy) are allowed; unlisted domains are still rejected", () => {
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

test("requests missing the Host header are always rejected", () => {
  assert.equal(decide({}).allowed, false);
  assert.equal(decide({ origin: "http://127.0.0.1:43120" }).allowed, false);
});

test("PURGE_TRUSTED_HOSTS parses into a usable trust list (default parameter path)", (t) => {
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });

  // Mixed separators: comma, semicolon, whitespace, with port, with brackets, mixed case, surrounding whitespace.
  process.env.PURGE_TRUSTED_HOSTS = " Panel.Example.COM ; 192.168.1.50:43120 ,[fd00::1]:8080 ";
  // Omit the third argument → takes allowPluginRequest's default value (= read from environment variable).
  assert.equal(decide({ host: "panel.example.com", "sec-fetch-site": "same-origin" }).allowed, true);
  assert.equal(decide({ host: "192.168.1.50:9999" }).allowed, true, "different port should still match hostname");
  assert.equal(decide({ host: "[fd00::1]:43120" }).allowed, true);
  // Unlisted domains are still rejected.
  assert.equal(decide({ host: "other.example.com" }).allowed, false);
});

test("clearing PURGE_TRUSTED_HOSTS no longer allows non-loopback hosts", (t) => {
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });

  process.env.PURGE_TRUSTED_HOSTS = "panel.example.com";
  assert.equal(decide({ host: "panel.example.com" }).allowed, true);

  delete process.env.PURGE_TRUSTED_HOSTS;
  assert.equal(decide({ host: "panel.example.com" }).allowed, false, "must fall back to rejection after trust is removed");
  // Loopback does not depend on this variable.
  assert.equal(decide({ host: "127.0.0.1:3080" }).allowed, true);
});

test("trust list does not affect loopback determination and cannot bypass Origin same-origin checks", (t) => {
  const previous = process.env.PURGE_TRUSTED_HOSTS;
  t.after(() => {
    if (previous === undefined) delete process.env.PURGE_TRUSTED_HOSTS;
    else process.env.PURGE_TRUSTED_HOSTS = previous;
  });
  process.env.PURGE_TRUSTED_HOSTS = "panel.example.com";

  // panel is trusted, but Origin points elsewhere → still rejected.
  assert.equal(
    decide({ host: "panel.example.com", origin: "https://evil.example", "sec-fetch-site": "same-origin" }).allowed,
    false,
  );
  // sec-fetch-site: cross-site has higher priority than the trust list.
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

test("host --trusted-host domain can access the panel (consistent with DSH core behavior)", () => {
  // Deployment uses `--trusted-host dsh.example.com` so DSH core accepts this domain;
  // the panel previously only recognized loopback + listener addresses, causing "core accessible, panel 403" on the same machine.
  // After merging the list provided by the host connection service, both sides make consistent decisions.
  const trusted = new Set(["dsh.example.com"]);
  assert.equal(
    decide({ host: "dsh.example.com", origin: "https://dsh.example.com", "sec-fetch-site": "same-origin" }, trusted).allowed,
    true,
  );
  // Merging does not mean relaxing: unlisted domains are still rejected.
  assert.equal(
    decide({ host: "other.example.com", origin: "https://other.example.com", "sec-fetch-site": "same-origin" }, trusted).allowed,
    false,
  );
});

test("host trusted list does not bypass Origin same-origin and cross-site checks", () => {
  const trusted = new Set(["dsh.example.com"]);
  // Host is trusted, but Origin points to attacker → rejected.
  assert.equal(
    decide({ host: "dsh.example.com", origin: "https://evil.example", "sec-fetch-site": "same-origin" }, trusted).allowed,
    false,
  );
  // cross-site has higher priority.
  assert.equal(
    decide({ host: "dsh.example.com", origin: "https://dsh.example.com", "sec-fetch-site": "cross-site" }, trusted).allowed,
    false,
  );
  // Origin: null is still rejected.
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
