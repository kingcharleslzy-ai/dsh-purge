import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Context, Service } from "@deepseek-ai/cordis";
import { apply, inject } from "../lib/index.js";

test("creating a session preserves the host's selected permission preset", async (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-session-permissions-"));
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  const root = new Context();
  t.after(async () => {
    await root.fiber.dispose();
    if (previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    fs.rmSync(home, { recursive: true, force: true });
  });
  const writes = [];
  class Permissions extends Service {
    constructor(ctx) { super(ctx, "permissionPresets"); }
    permissionState(session) { return { preset: session.choice }; }
    set(session, preset) { writes.push([session.choice, preset]); }
  }
  class Prompt extends Service {
    constructor(ctx) { super(ctx, "systemPrompt"); }
    section() { return () => {}; }
    async assemble() { return { sections: [] }; }
  }
  class Tools extends Service {
    constructor(ctx) { super(ctx, "tools"); }
    register() { return () => {}; }
  }
  for (const service of [Prompt, Tools, Permissions]) await root.plugin(service);
  const seen = [];
  await root.plugin({ name: "session-permission-regression", inject, apply(ctx) {
    ctx.on("session/created", session => seen.push(session.choice));
    apply(ctx, { enabled: true });
  } });
  const choices = ["workspace-write", "read-only", "danger-full-access"];
  for (const choice of choices) {
    root.emit("session/created", {
      choice, header: { origin: "user" },
      snapshotEvents: () => [{ type: "permission/preset" }],
    });
    await new Promise(resolve => setImmediate(resolve));
  }
  assert.deepEqual(seen, choices);
  assert.deepEqual(writes, []);
});
