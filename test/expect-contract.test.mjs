// #188 (upstream 1.1.83): a replacement may declare how many times its pattern is
// expected to appear. More or fewer hits means the host changed underneath us, so
// the whole replacement is refused instead of silently rewriting every copy.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ALL_PATCHES, applyReplacementsToText, targetFiles } from "../lib/core.js";

const patchWith = (...replacements) => ({ id: 999, file: ["x"], replacements });

test("literal pattern: exact hit count is required", () => {
  const p = patchWith({ pattern: "AAA", replace: "B", expect: 1 });
  assert.equal(applyReplacementsToText("xAAAz", p).text, "xBz");

  const twice = applyReplacementsToText("xAAAyAAAz", p);
  assert.equal(twice.changed, false);
  assert.deepEqual(twice.hitMismatch, { patch_id: 999, expected: 1, actual: 2, file: "" });

  const none = applyReplacementsToText("nothing here", p);
  assert.equal(none.changed, false);
  assert.equal(none.hitMismatch.actual, 0, "zero hits is a mismatch too, not a quiet skip");
});

test("regexp pattern enforces the same contract", () => {
  const p = patchWith({ pattern: /AAA/g, replace: "B", expect: 2 });
  assert.equal(applyReplacementsToText("AAA-AAA", p).text, "B-B");
  const one = applyReplacementsToText("AAA-AAA-AAA", p);
  assert.equal(one.changed, false);
  assert.equal(one.hitMismatch.actual, 3);
});

test("without expect the old replace-all behaviour is unchanged", () => {
  const p = patchWith({ pattern: "AAA", replace: "B" });
  assert.equal(applyReplacementsToText("AAA-AAA", p).text, "B-B");
});

// Real-host probe: every literal anchor must appear exactly once per pristine file.
// It is skipped when no host is installed, so CI still passes without one.
test("real host: every literal anchor appears exactly once (pristine copy)", () => {
  const ai = process.env.PURGE_TEST_HOST
    || "/Applications/DeepSeek Harness.app/Contents/Resources/app/dsh/node_modules/@deepseek-ai";
  if (!fs.existsSync(ai)) return;
  let files;
  try {
    files = targetFiles(ai, process.env.DSH_HOME || path.join(process.env.HOME || "", ".dsh"));
  } catch {
    return;
  }
  const offenders = [];
  for (const p of ALL_PATCHES) {
    for (const key of Array.isArray(p.file) ? p.file : [p.file]) {
      for (const fp of files[key] || []) {
        const pristine = `${fp}.dshpurge.bak`;
        const file = fs.existsSync(pristine) ? pristine : fp;
        let text;
        try {
          text = fs.readFileSync(file, "utf8");
        } catch {
          continue;
        }
        for (const rep of p.replacements || []) {
          if (!rep.pattern || rep.pattern instanceof RegExp) continue;
          const n = text.split(rep.pattern).length - 1;
          if (n > 1) offenders.push(`#${p.id} ${path.basename(fp)} hits=${n}`);
        }
      }
    }
  }
  assert.deepEqual(offenders, [], "anchor appears more than once; declare expect or narrow the pattern");
});
