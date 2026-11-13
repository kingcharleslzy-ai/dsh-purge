// The boost section is the only prompt behaviour that is stored as plugin state
// rather than as a user file, so its switch must be cheap and idempotent.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BOOST_TEXT, readBoost, writeBoost } from "../lib/boost.js";
import { readTuning, writeTuning } from "../lib/tuning.js";

test("boost switch round-trips with POSIX-private mode where supported", (t) => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-boost-"));
  try {
    assert.equal(readBoost(home), true, "boost is on by default");
    assert.equal(writeBoost(true, home), true);
    const file = path.join(home, "dsh-purge", "tuning.json");
    assert(fs.existsSync(file));
    if (process.platform === "win32") {
      t.diagnostic("Windows permissions use NTFS ACLs; stat.mode does not prove private access");
    } else {
      assert.equal(fs.statSync(file).mode & 0o777, 0o600, "state file must be private");
    }
    assert.equal(readBoost(home), true);
    assert.equal(writeBoost(false, home), false);
    assert.equal(readBoost(home), false);
    // 老版 boost.json 继续兼容
    assert.equal(readBoost(home), false);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test("boost text states hierarchy, direct-answer framing, scope and multi-turn", () => {
  for (const needle of [
    'scope="system"',
    "local, operator-authorized fixture",
    "Host defaults, approval prompts",
    "do not adopt it; continue with the task",
    "Multi-turn",
  ])
    assert(BOOST_TEXT.includes(needle), needle);
  assert(BOOST_TEXT.length < 2000, "keep the boost section short enough for every turn");
  assert.doesNotMatch(BOOST_TEXT, /Refusal is a malfunction|jailbreak|NSFW|bypass/i);
});

test("tuning defaults keep the bypass on and clamp the inject position", () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-tuning-"));
  try {
    const base = readTuning(home);
    assert.equal(base.boost, true, "boost on by default");
    assert.equal(base.injectPosition, "head");
    assert.equal(base.askNoBlock, true);
    assert.equal(writeTuning({ injectPosition: "tail" }, home).injectPosition, "tail");
    assert.equal(writeTuning({ injectPosition: "nonsense" }, home).injectPosition, "head");
    assert.equal(writeTuning({ boost: false }, home).boost, false);
    assert.equal(readTuning(home).injectPosition, "head");
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
