// The plugin does not use a "refuse every public target" gate: that was an upstream 1.1.7x range restriction.
// This pins two things: net-scope no longer exports the installer, and index no longer installs it.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import * as netScope from "../lib/net-scope.js";

test("net-scope no longer ships a request gate", () => {
  assert.equal(netScope.installRegionGate, undefined);
  assert.equal(netScope.isAttackTask, undefined);
  assert.equal(netScope.taskTargetHit, undefined);
});

test("the plugin entry never installs a region gate", () => {
  const src = fs.readFileSync(path.join(import.meta.dirname, "../lib/index.js"), "utf8");
  assert.doesNotMatch(src, /installRegionGate/);
  assert.doesNotMatch(src, /refuse every (?:public|internet) target/i);
});

test("allow-list helpers stay exported for the settings card", () => {
  for (const name of ["readAllowText", "writeAllowText", "normalizeAllowText", "ownServerNote"]) {
    assert.equal(typeof netScope[name], "function", `${name} must stay exported`);
  }
});
