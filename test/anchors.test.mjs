// Local re-anchor overrides: when a host update moves an anchor, the operator can
// pin a replacement pattern without editing plugin source.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readOverrides, writeOverride, clearOverride, applyOverrides } from "../lib/anchors.js";
import { applyReplacementsToText } from "../lib/core.js";

const patch = () => ({
  id: 42,
  name: "FIXTURE",
  replacements: [
    { pattern: "old anchor\nsecond line", replace: "NEW" },
    { pattern: "other", replace: "OTHER" },
  ],
  markers: ["NEW"],
});

test("overrides round-trip, apply per index, and clear", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-anchor-"));
  try {
    assert.deepEqual(readOverrides(home), {});
    writeOverride(home, 42, 0, "new anchor\nsecond line", { host: "0.2.1-rc.2" });
    const all = readOverrides(home);
    assert.equal(all["42"]["0"].pattern, "new anchor\nsecond line");
    assert.equal(all["42"]["0"].host, "0.2.1-rc.2");

    const lined = applyOverrides(patch(), all);
    assert.equal(lined.overridden, true);
    assert.equal(lined.replacements[0].pattern, "new anchor\nsecond line");
    assert.equal(lined.replacements[1].pattern, "other", "other entries untouched");
    // The original object was not modified
    assert.equal(patch().replacements[0].pattern, "old anchor\nsecond line");

    // After override, the new anchor matches and the old one no longer matches
    const text = "header\nnew anchor\nsecond line\nfooter";
    assert.equal(applyReplacementsToText(text, lined).text.includes("NEW"), true);
    assert.equal(applyReplacementsToText(text, patch()).changed, false);

    clearOverride(home, 42, 0);
    assert.deepEqual(readOverrides(home), {});
    // Out-of-bounds index does not take effect
    assert.equal(applyOverrides(patch(), { 42: { 9: { pattern: "x" } } }).overridden, undefined);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
