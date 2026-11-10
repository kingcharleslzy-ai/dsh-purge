// node --expose-internals run.mjs <directory containing the published host's node_modules>
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const host = path.resolve(process.argv[2]);
const resolve = createRequire(path.join(host, "package.json")).resolve;
const root = mkdtempSync(path.join(os.tmpdir(), "profile-ownership-"));
process.env.DSH_HOME = root;

try {
  const { boot } = await import(pathToFileURL(resolve("@deepseek-ai/dsh-app-boot")));
  const modules = path.resolve(path.dirname(resolve("@deepseek-ai/dsh-agent-preset/package.json")), "../..");
  symlinkSync(modules, path.join(root, "node_modules"), "junction");
  const presetPlugin = "@deepseek-ai/dsh-agent-preset";
  const probePlugin = new URL("./probe.mjs", import.meta.url).href;
  const probe = [{ id: "observer", name: probePlugin }];
  const preset = [{ id: "independent-row-name", name: presetPlugin,
    config: { id: "notes", name: "profile", plugins: [] } }];
  for (const [name, entries, expected] of [
    ["observer first", [...probe, ...preset], "profile"],
    ["profile first", [...preset, ...probe], "profile"],
    ["disabled", [...probe, { ...preset[0], disabled: true }], "fallback"],
    ["other profile only", [...probe], "fallback"],
  ]) {
    // JSON flow style is legal YAML. Use a sibling profile containing the same
    // id so a filesystem-wide scan would fail the last scenario.
    writeFileSync(path.join(root, "other.yml"), JSON.stringify(preset));
    const file = path.join(root, "active.yml");
    writeFileSync(file, JSON.stringify(entries));
    const rows = new Map();
    const attempts = [];
    const context = await boot("dsh", file, [], ctx => ctx.provide("agentPresets", {
      register(definition) {
        attempts.push(definition.name);
        assert.ok(!rows.has(definition.id), "duplicate " + definition.id);
        rows.set(definition.id, definition);
        return () => rows.delete(definition.id);
      },
    }));
    try {
      assert.deepEqual(attempts, [expected], name);
      assert.equal(rows.get("notes")?.name, expected, name);
    } finally {
      await context.fiber.dispose();
    }
    assert.equal(rows.size, 0);
    console.log("PASS", name);
  }
} finally {
  // Unlink the test junction before deleting the disposable directory.
  const link = path.join(root, "node_modules");
  try { unlinkSync(link); } catch (error) { if (error.code !== "ENOENT") throw error; }
  rmSync(root, { recursive: true, force: true });
}
