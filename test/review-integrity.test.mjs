import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { writeTuning, readTuning } from "../lib/tuning.js";
import { readAudit } from "../lib/audit.js";
import { splitRedteamInject, withoutCtfContract } from "../lib/identity.js";
import { looksLikeRefusal, streamWithRefusalRetry } from "../lib/refusal-retry.js";
import { observeStream } from "../lib/stream-observation.js";

const cli = fileURLToPath(new URL("../bin/community.js", import.meta.url));
const delta = text => ({ type: "text-delta", text });
const collect = async stream => { const result = []; for await (const c of stream) result.push(c); return result; };

test("ordinary technical answers and quotations keep their complete original stream", async () => {
  for (const text of [
    "Prompt injection 防护需要区分用户指令和网页内容。",
    "Jailbreak 是本文讨论的术语，下面分析其风险。",
    "我注意到提示词包含两个格式要求，下面分别处理。",
    "这段指令用于覆盖界面主题颜色，修改如下。",
  ]) {
    assert.equal(looksLikeRefusal(text), false);
    let calls = 0;
    const chunks = [delta(text), { type: "finish" }];
    const result = await collect(streamWithRefusalRetry(() => {
      calls++; return (async function* () { yield* chunks; })();
    }, {}));
    assert.equal(calls, 1); assert.deepEqual(result, chunks);
  }
});

test("consumer cancellation closes the ordinary upstream stream", async () => {
  let closed = false;
  const stream = streamWithRefusalRetry(() => (async function* () {
    try { yield delta("Normal answer."); yield delta("More content."); }
    finally { closed = true; }
  })(), {}, { bufferChars: 1 });
  await stream.next(); await stream.return();
  assert.equal(closed, true);
});

test("prompt prose, quotes, fenced examples and mixed-case text are preserved", () => {
  for (const text of [
    "请解释 CTF CORE CONTRACT 一词。\n后续用户规则必须保留。",
    "> CTF CORE CONTRACT\n引用后的正文",
    "`CTF CORE CONTRACT`\n正文",
    "```text\nCTF CORE CONTRACT\n```\n正文",
    "~~~~\nCTF CORE CONTRACT\n~~~\n仍在代码块",
    "CTF Core Contract\n正文",
    "    CTF CORE CONTRACT\n缩进代码之后",
  ]) {
    assert.deepEqual(splitRedteamInject(text), { common: text, ctfTail: "" });
    assert.equal(withoutCtfContract(text), text);
  }
});

test("legacy standalone marker remains recognized after a closed fenced example", () => {
  const prefix = "```\nCTF CORE CONTRACT\n```\nkeep";
  assert.deepEqual(splitRedteamInject(prefix + "\r\nCTF CORE CONTRACT\r\nfixture"), {
    common: prefix, ctfTail: "CTF CORE CONTRACT\r\nfixture",
  });
});

test("stream diagnostics describe transport completion, not answer quality", async () => {
  for (const [chunks, outcome] of [
    [[delta("complete")], "text"],
    [[{ type: "tool-call-delta", name: "read" }], "tool_call"],
    [[{ type: "reasoning-delta", text: "thinking" }, delta("answer")], "text"],
    [[{ type: "reasoning-delta", text: "thinking" }], "reasoning_only"],
    [[{ type: "finish" }], "empty"],
  ]) {
    const rows = [];
    const output = await collect(observeStream(() => (async function* () { yield* chunks; })(), { report: r => rows.push(r) }));
    assert.deepEqual(output, chunks); assert.equal(rows.length, 1); assert.equal(rows[0].outcome, outcome);
    assert.equal(JSON.stringify(rows).includes("thinking"), false);
  }
});

test("late stream errors are reported once and propagated without logging private text", async () => {
  const rows = [];
  const error = new Error("private response URL and credentials");
  const stream = observeStream(() => (async function* () {
    yield delta("x".repeat(500)); throw error;
  })(), { report: r => rows.push(r) });
  assert.equal((await stream.next()).value.text.length, 500);
  assert.equal(rows.length, 0, "no premature recovered record");
  await assert.rejects(stream.next(), e => e === error);
  assert.equal(rows.length, 1); assert.equal(rows[0].outcome, "error");
  assert.equal(JSON.stringify(rows).includes("private"), false);
});

test("synchronous stream creation failures and consumer cancellation are distinct", async () => {
  const rows = [];
  await assert.rejects(collect(observeStream(() => { throw Error("creation failed"); }, { report: r => rows.push(r) })), /creation failed/);
  assert.equal(rows[0].outcome, "error");
  let closed = false;
  const stream = observeStream(() => (async function* () {
    try { yield delta("first"); yield delta("second"); } finally { closed = true; }
  })(), { report: r => rows.push(r) });
  await stream.next(); await stream.return();
  assert(closed); assert.equal(rows[1].outcome, "cancelled");
});

test("audit failure does not change a successful stream", async () => {
  assert.deepEqual(await collect(observeStream(() => (async function* () { yield delta("ok"); })(), {
    report() { throw Error("audit unavailable"); },
  })), [delta("ok")]);
});

test("real CLI records effective setting changes once and keeps unknown settings", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-review-"));
  const run = (...args) => spawnSync(process.execPath, [cli, ...args], {
    env: { ...process.env, DSH_HOME: home }, encoding: "utf8",
  });
  try {
    assert.equal(JSON.parse(run("rewind").stdout).rewind, false);
    writeTuning({ customPrivateField: "private fixture", rewind: true }, home);
    let rows = readAudit({ home });
    assert.equal(rows.length, 1); assert.equal(rows[0].key, "rewind");
    assert(!JSON.stringify(rows).includes("private fixture"));
    const a = run("rewind", "off"); assert.equal(a.status, 0, a.stderr);
    assert.equal(JSON.parse(a.stdout).restart_required, false);
    assert.equal(readTuning(home).customPrivateField, "private fixture");
    const b = run("rewind", "off"); assert.equal(b.status, 0, b.stderr);
    rows = readAudit({ home }); assert.equal(rows.length, 2);
    assert(rows.every(r => r.event === "tuning_setting"));
    const c = run("retry", "off"); assert.equal(c.status, 0, c.stderr);
    assert.equal(JSON.parse(c.stdout).restart_required, false);
    assert.equal(JSON.parse(c.stdout).effective, "next-turn");
    writeTuning({ injectPosition: "invalid" }, home);
    assert.equal(readTuning(home).injectPosition, "head");
    assert.equal(readAudit({ home }).length, 2, "normalized no-op is not a real setting change");
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("cancel closes a non-generator iterator exactly once", async () => {
  let closes = 0;
  const upstream = {
    [Symbol.asyncIterator]() { return this; },
    async next() { return { done: false, value: delta("ordinary content") }; },
    async return() { closes++; return { done: true }; },
  };
  const stream = streamWithRefusalRetry(() => upstream, {}, { bufferChars: 1 });
  await stream.next(); await stream.return(); await stream.return();
  assert.equal(closes, 1);
});

test("invalid known settings are not copied to audit; a failed write never logs success", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-audit-integrity-"));
  try {
    writeTuning({ rewind: "sensitive-invalid-value" }, home);
    writeTuning({ rewind: true }, home);
    const rows = readAudit({ home });
    assert.equal(rows.length, 2);
    assert.equal(JSON.stringify(rows).includes("sensitive-invalid-value"), false);
    const file = path.join(home, "dsh-purge", "tuning.json");
    fs.unlinkSync(file); fs.mkdirSync(file);
    assert.throws(() => writeTuning({ rewind: false }, home));
    assert.equal(readAudit({ home }).length, 2);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

test("real HTTP stream cancellation releases the upstream connection", { timeout: 10000 }, async () => {
  const { createServer } = await import("node:http");
  const { once } = await import("node:events");
  let disconnected;
  const closed = new Promise(resolve => { disconnected = resolve; });
  const server = createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.write("first chunk\n");
    res.on("close", disconnected);
  });
  server.listen(0, "127.0.0.1"); await once(server, "listening");
  const rows = [];
  const controller = new AbortController();
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}`, { signal: controller.signal });
    const stream = observeStream(() => response.body, { report: row => rows.push(row) });
    const first = await stream.next(); assert.equal(first.done, false);
    await stream.return(); await closed;
    assert.equal(rows.length, 1); assert.equal(rows[0].outcome, "cancelled");
  } finally {
    controller.abort(); server.closeAllConnections(); await new Promise(resolve => server.close(resolve));
  }
});
