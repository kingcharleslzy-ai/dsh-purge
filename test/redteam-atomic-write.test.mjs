// Settings writes must be atomic: a mid-write crash must not leave half a JSON file for readers to swallow as defaults.
import { test } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";
import { atomicWriteFileSync } from "../lib/redteam/atomic-write.js";

const tmpDir = () => fs.mkdtempSync(path.join(os.tmpdir(), "atomic-"));

test("atomic write replaces content and leaves no temp files", () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, "settings.json");
    fs.writeFileSync(file, JSON.stringify({ redteam: { maxDepth: 1 } }), "utf8");
    atomicWriteFileSync(file, JSON.stringify({ redteam: { maxDepth: 2 } }, null, 2) + "\n");
    assert.deepEqual(JSON.parse(fs.readFileSync(file, "utf8")), { redteam: { maxDepth: 2 } });
    assert.deepEqual(fs.readdirSync(dir), ["settings.json"], "the temp file must be renamed or cleaned up");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("atomic write keeps the old file intact when the write fails", () => {
  const dir = tmpDir();
  try {
    const file = path.join(dir, "settings.json");
    const original = JSON.stringify({ keep: true });
    fs.writeFileSync(file, original, "utf8");
    assert.throws(() => atomicWriteFileSync(file, { toString() { throw new Error("boom"); } }));
    assert.equal(fs.readFileSync(file, "utf8"), original, "a failure must preserve the original content");
    assert.deepEqual(fs.readdirSync(dir), ["settings.json"], "a failure must not leave .tmp debris");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
