// Audit regressions: this group corresponds to four "report vs fact mismatch" defects; before the fix they all failed.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { rollupLayers } from "../lib/selfcheck.js";
import { versionIsNewer, sameRev } from "../lib/update-state.js";
import { atomicFiles } from "../lib/atomic-files.js";
import { dirBackup, dirRestore } from "../lib/update-install.js";

const tmp = (tag) => fs.mkdtempSync(path.join(os.tmpdir(), `purge ${tag} `));

test("when reading patch status fails, selfcheck must not report all green", () => {
  // After patchStatus throws, selfCheck passes status={} + statusError: every layer must be unknown.
  const failed = rollupLayers({}, true, { statusError: "patchStatus boom" });
  assert(failed.every((l) => l.state === "unknown" && l.ok === false));
  assert(failed.every((l) => l.broken.length === 0), "unable to read status does not mean patches are broken");
  assert(failed[0].note.includes("patchStatus boom"));
  assert.equal(failed[0].status_error, "patchStatus boom");

  // An empty status table cannot prove targets are missing: unreturned states must remain unknown.
  assert(rollupLayers({}, true).every((l) => l.state === "unknown"));
  // When the host is not located it remains unknown and must not be swallowed by the error branch above.
  assert(rollupLayers({}, false).every((l) => l.state === "unknown"));
});

test("prerelease segments are compared numerically: rc.2 is not newer than rc.10", () => {
  assert.equal(versionIsNewer("0.2.1-rc.2", "0.2.1-rc.10"), false);
  assert.equal(versionIsNewer("0.2.1-rc.10", "0.2.1-rc.2"), true);
  assert.equal(versionIsNewer("0.2.1-rc.2", "0.2.1"), false);
  assert.equal(versionIsNewer("0.2.1", "0.2.1-rc.2"), true);
  assert.equal(versionIsNewer("1.6.27", "1.6.9"), true);
  assert.equal(versionIsNewer("1.6.100", "1.6.99"), true);
});

test("sameRev only compares git SHA prefixes, and does not treat apply:<version> as the same revision", () => {
  assert.equal(sameRev("apply:1.6.2", "apply:1.6.27"), false);
  assert.equal(sameRev("abc1234", "abc1234def"), true);
  assert.equal(sameRev("abc1234", "fff9999"), false);
});

test("rename backs off and retries on transient contention instead of failing the state file write directly", () => {
  const root = tmp("rename");
  const file = path.join(root, "state.json");
  fs.writeFileSync(file, "old");
  try {
    let calls = 0;
    const fake = { ...fs, promises: { ...fs.promises } };
    fake.renameSync = (from, to) => {
      calls += 1;
      if (calls <= 2) throw Object.assign(Error("busy"), { code: "EBUSY" });
      return fs.renameSync(from, to);
    };
    atomicFiles(fake).atomicWriteSync(file, "new");
    assert.equal(fs.readFileSync(file, "utf8"), "new");
    assert.equal(calls, 3, "should retry once after the first two EBUSY errors");
    assert.deepEqual(fs.readdirSync(root), ["state.json"], "retries must not leave temporary files");

    // Non-contention errors must not be retried: retrying permission errors is meaningless.
    let fatal = 0;
    const deny = { ...fs, promises: { ...fs.promises } };
    deny.renameSync = () => {
      fatal += 1;
      throw Object.assign(Error("denied"), { code: "ENOENT" });
    };
    assert.throws(() => atomicFiles(deny).atomicWriteSync(file, "x"), /denied/);
    assert.equal(fatal, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("directory rollback preserves node_modules that the backup intentionally skipped", () => {
  const root = tmp("dirrestore");
  const home = path.join(root, "home");
  const dir = path.join(root, "plugin");
  try {
    fs.mkdirSync(path.join(dir, "lib"), { recursive: true });
    fs.mkdirSync(path.join(dir, "node_modules", "yaml"), { recursive: true });
    fs.writeFileSync(path.join(dir, "lib", "index.js"), "v1");
    fs.writeFileSync(path.join(dir, "node_modules", "yaml", "index.js"), "dep");
    const backup = dirBackup(dir, { home, reason: "test" });
    // The upgrade corrupted source files, but node_modules is still on disk
    fs.writeFileSync(path.join(dir, "lib", "index.js"), "broken");
    dirRestore(backup, dir);
    assert.equal(fs.readFileSync(path.join(dir, "lib", "index.js"), "utf8"), "v1");
    assert.equal(
      fs.existsSync(path.join(dir, "node_modules", "yaml", "index.js")),
      true,
      "dependencies must remain after rollback, otherwise importing yaml will fail directly",
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
