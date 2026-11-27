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
// 同一句话在不同工具文件里的份数不一定相同（rc.5 的 pwsh 描述重复了一份）。
// 这里把已知的"每文件命中数"钉死：未登记的锚点必须恰好 1 次，登记过的必须等于登记值，
// 将来宿主再复制/删掉一份就会报错——检测力不变，只是不再假设"全宿主唯一"。
const DECLARED_HITS = [
  // [patch id, 锚点前缀, { 文件条目: 次数 }]
  [33, "a policy denial: do not retry another way", { "tool-pwsh": 2 }],
  [33, "[sandbox: file access denied under <mode> mode]", { "tool-pwsh": 2 }],
  [48, "Before any delete or move, verify that the resolved absolute target path", { "tool-pwsh": 2 }],
];

function declaredHits(id, pattern, key) {
  const row = DECLARED_HITS.find(
    ([pid, prefix]) => pid === id && String(pattern).startsWith(prefix),
  );
  if (!row) return 1;
  return row[2][key] ?? 1;
}

test("real host: every literal anchor matches its declared hit count (pristine copy)", () => {
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
          if (p.multiHit) continue;
          // 补丁自己声明的期望次数优先（应用时会校验），否则用本文件的登记值。
          const expected =
            typeof rep.expect === "number" ? rep.expect : declaredHits(p.id, rep.pattern, key);
          // 0 次 = 本端没有这段文案（optional 锚点），由 selfcheck 报「不适用」，不算漂移。
          if (n === 0) continue;
          if (n !== expected) {
            offenders.push(`#${p.id} ${key}/${path.basename(fp)} hits=${n} expected=${expected}`);
          }
        }
      }
    }
  }
  assert.deepEqual(offenders, [], "anchor hit count drifted from what the patch declares");
});
