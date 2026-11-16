// Upgrade detection in refreshStaleBaksForUpgrade: recognizing only the "[dsh-purge]" marker would misjudge
// a "patched but markerless" file as an official new version, overwriting .dshpurge.bak with patched content.
// The result would be rollback becoming a no-op while the status page still shows all green.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { refreshStaleBaksForUpgrade, patchedTargetStillPatched } from "../lib/core.js";

// Real anchor and product for #94 SKILL_BADGE_DESCRIPTION_NEUTRAL:
const VENDOR = 'Add the official “powered by dsh” badge to documents, pull requests, merge requests, and other content produced with DeepSeek Harness.';
const PATCHED = 'Add a small attribution badge to documents, pull requests, merge requests, and other content.';

/** Create a host tree containing a dsh-skill-badge target. */
function fixture(pkg = "dsh-skill-badge") {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-refresh-"));
  const file = path.join(root, pkg, "lib", "index.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, VENDOR);
  fs.writeFileSync(file + ".dshpurge.bak", VENDOR);
  return { root, file, bak: file + ".dshpurge.bak" };
}

test("keeps bak when file is still in patched form (not overwritten as an official new version)", () => {
  const { root, file, bak } = fixture();
  // Current state: file contains patched output (no marker), bak is the official original -- this is the normal "already patched" form.
  fs.writeFileSync(file, PATCHED);
  const before = fs.readFileSync(bak);
  const refreshed = refreshStaleBaksForUpgrade(root);
  assert.equal(refreshed.length, 0, "should not refresh");
  assert.deepEqual(fs.readFileSync(bak), before, "bak must preserve the official original text");
  fs.rmSync(root, { recursive: true, force: true });
});

test("refreshes bak to the new baseline when the host upgrades to an official new version", () => {
  const { root, file, bak } = fixture();
  // Current state: file is the official original (anchor is back), bak is still the old baseline -- this is the case where bak should be refreshed.
  fs.writeFileSync(bak, "old baseline");
  fs.writeFileSync(file, VENDOR);
  const refreshed = refreshStaleBaksForUpgrade(root);
  assert.equal(refreshed.length, 1, "should refresh");
  assert.equal(fs.readFileSync(bak, "utf8"), VENDOR);
  fs.rmSync(root, { recursive: true, force: true });
});

test("never touches bak for files containing the [dsh-purge] marker", () => {
  const { root, file, bak } = fixture();
  fs.writeFileSync(file, "patched // [dsh-purge] some marker");
  fs.writeFileSync(bak, VENDOR);
  const before = fs.readFileSync(bak);
  assert.equal(refreshStaleBaksForUpgrade(root).length, 0);
  assert.deepEqual(fs.readFileSync(bak), before);
  fs.rmSync(root, { recursive: true, force: true });
});

test("conservatively does not overwrite bak for files with unknown ownership", () => {
  // The target is not in the patch table (a file added in a new version), so we cannot tell whether we modified it.
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-refresh-"));
  const file = path.join(root, "dsh-unknown-pkg", "lib", "index.js");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file + ".dshpurge.bak", "vendor");
  fs.writeFileSync(file, "something else");
  assert.equal(refreshStaleBaksForUpgrade(root).length, 0, "do not refresh out of caution");
  assert.equal(fs.readFileSync(file + ".dshpurge.bak", "utf8"), "vendor");
  fs.rmSync(root, { recursive: true, force: true });
});

test("patchedTargetStillPatched: treats official original as not patched", () => {
  const { root, file } = fixture();
  assert.equal(patchedTargetStillPatched(file, Buffer.from(VENDOR), root), false);
  fs.rmSync(root, { recursive: true, force: true });
});

test("patchedTargetStillPatched: treats patched form as patched", () => {
  const { root, file } = fixture();
  assert.equal(patchedTargetStillPatched(file, Buffer.from(PATCHED), root), true);
  fs.rmSync(root, { recursive: true, force: true });
});

test("patchedTargetStillPatched: treats empty content as modified (protects bak)", () => {
  assert.equal(patchedTargetStillPatched("/nonexistent/file.js", Buffer.alloc(0)), true);
});

test("mixed vendor and replacement text cannot replace a clean rollback copy", (t) => {
  const { root, file, bak } = fixture();
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const baseline = [VENDOR, VENDOR].join("\n");
  fs.writeFileSync(bak, baseline);
  fs.writeFileSync(file, [VENDOR, PATCHED].join("\n"));
  assert.deepEqual(refreshStaleBaksForUpgrade(root), []);
  assert.equal(fs.readFileSync(bak, "utf8"), baseline);
});
