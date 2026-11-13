// Chrome exercises the shipped client. Only update preferences are written, to a temporary DSH home.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";
import {
  preferences,
  publicPreferences,
  savePreferences,
} from "../../../lib/update-policy.js";

const home = await fs.mkdtemp(path.join(os.tmpdir(), "purge-settings-ui-"));
const writes = [];
const fixture = await build({
  entryPoints: [
    fileURLToPath(new URL("settings-entries.fixture.js", import.meta.url)),
  ],
  bundle: true,
  write: false,
  define: { "process.env.NODE_ENV": '"production"' },
});
const client = await fs.readFile(
  new URL("../../../client.js", import.meta.url),
);
const html =
  '<!doctype html><meta charset=utf-8><main></main><script src="/fixture.js"></script><script src="/client.js"></script><script>testEntries().then(()=>report("ok"),e=>report(String(e))); function report(result){fetch("/result",{method:"POST",body:result});}</script>';
let done;
const result = new Promise((resolve) => {
  done = resolve;
});
const server = createServer(async (req, res) => {
  const send = (type, body) => {
    res.setHeader("content-type", type);
    res.end(body);
  };
  try {
    if (req.url === "/") return send("text/html", html);
    if (req.url === "/fixture.js")
      return send("text/javascript", fixture.outputFiles[0].contents);
    if (req.url === "/client.js") return send("text/javascript", client);
    let body = "";
    for await (const part of req) body += part;
    if (req.url === "/result") {
      done(body);
      return res.end();
    }
    if (req.url === "/dsh-purge/community") {
      if (req.method === "POST") {
        const { op, value } = JSON.parse(body);
        assert.equal(op, "preferences");
        assert.deepEqual(Object.keys(value), ["intervalHours"]);
        savePreferences(home, value);
        writes.push(value.intervalHours);
      }
      return send(
        "application/json",
        JSON.stringify({
          ok: true,
          backups: [],
          update_preferences: publicPreferences(preferences(home)),
        }),
      );
    }
    assert.equal(req.method, "GET");
    send("application/json", JSON.stringify({ ok: true }));
  } catch (err) {
    done(String(err));
    res.statusCode = 500;
    res.end();
  }
});
let browser, exited, timer;
try {
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  browser = spawn(
    process.env.CHROME_BIN || "google-chrome",
    [
      "--headless",
      "--disable-extensions",
      "--disable-background-networking",
      "--no-first-run",
      "--user-data-dir=" + path.join(home, "chrome"),
      "http://127.0.0.1:" + server.address().port,
    ],
    { stdio: "ignore" },
  );
  exited = once(browser, "exit");
  const outcome = await Promise.race([
    result,
    exited.then(() => "Chrome exited before reporting"),
    new Promise((resolve) => {
      timer = setTimeout(() => resolve("browser timed out"), 25000);
    }),
  ]);
  assert.equal(outcome, "ok");
  assert.deepEqual(writes, [12, 24]);
  assert.equal(preferences(home).intervalHours, 24);
  console.log(
    "PASS: sidebar → bundle → sidebar; row detail reloaded 24 hours from disk",
  );
} finally {
  clearTimeout(timer);
  if (browser?.pid && browser.exitCode === null) {
    browser.kill();
    await exited;
  }
  server.close();
  server.closeAllConnections();
  await fs.rm(home, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
