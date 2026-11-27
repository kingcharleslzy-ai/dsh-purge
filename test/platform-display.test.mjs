import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { platformDisplay, platformLabel } from "../lib/platform-display.js";
import { platformSummary, savePlatformConfig } from "../lib/redteam/platform-config.js";

test("the panel describes the remote host or its explicit platform mode", () => {
  for (const [system, mode, label] of [
    ["darwin", "auto", "macOS"], ["win32", "auto", "Windows"], ["linux", "auto", "Linux"],
    ["darwin", "linux", "Linux"], ["darwin", "windows", "Windows"], ["freebsd", "auto", "freebsd"],
    [undefined, "auto", "未知平台"],
  ]) assert.equal(platformLabel(platformDisplay(system, mode)), label);
});

test("the real backend reports the current OS and honors existing explicit modes", t => {
  const root = mkdtempSync(join(tmpdir(), "platform-display-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const summary = platformSummary(root);
  assert.equal(summary.runtime.nodePlatform, process.platform);
  assert.equal(summary.runtime.effective, platformDisplay(process.platform, "auto"));
  if (process.platform === "darwin") assert.match(summary.hint, /macOS/);
  for (const platform of ["windows", "linux"]) {
    savePlatformConfig({ platform }, root);
    assert.equal(platformSummary(root).runtime.effective, platform);
  }
});
