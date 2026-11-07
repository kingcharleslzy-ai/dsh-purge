// 隐私补丁表（#95–#97）：形状契约 + 锚点唯一性。
//
// 这三条只改"默认值"，一旦锚点写宽了就会连带改掉别处的同名默认值，所以这里
// 钉两件事：每条 replacement 的 pattern 在全表内不重复；声明了 expect 的必须是
// 正整数。真实宿主上的命中数由 patch-anchors / expect-contract 那套实机测试负责，
// 这里不依赖任何安装。
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_PATCHES } from "../lib/patches/index.mjs";
import { PRIVACY_PATCHES } from "../lib/patches/privacy.mjs";

const IDS = [95, 96, 97];

test("privacy patches are registered in ALL_PATCHES exactly once", () => {
  for (const id of IDS) {
    const hits = ALL_PATCHES.filter((p) => p.id === id);
    assert.equal(hits.length, 1, "patch " + id + " registered once");
  }
  const allIds = ALL_PATCHES.map((p) => p.id);
  assert.equal(new Set(allIds).size, allIds.length, "patch ids are unique across the table");
});

test("privacy patches stay optional and carry markers", () => {
  for (const p of PRIVACY_PATCHES) {
    assert.equal(p.optional, true, p.name + " must be optional (package may be absent)");
    assert(Array.isArray(p.file) && p.file.length > 0, p.name + " declares target keys");
    assert(Array.isArray(p.markers) && p.markers.length > 0, p.name + " declares markers");
    assert(Array.isArray(p.replacements) && p.replacements.length > 0, p.name + " has replacements");
  }
});

test("declared expect values are positive integers", () => {
  for (const p of PRIVACY_PATCHES) {
    for (const r of p.replacements) {
      assert(typeof r.pattern === "string" && r.pattern.length > 0, p.name + " pattern is a non-empty string");
      assert(typeof r.replace === "string" && r.replace.length > 0, p.name + " replace is a non-empty string");
      if (r.expect !== undefined) {
        assert(Number.isInteger(r.expect) && r.expect > 0, p.name + " expect is a positive integer");
      }
    }
  }
});

test("privacy anchors do not collide inside the same target files", () => {
  // 同一个 pattern 可以出现在不同补丁里 —— 只要它们不落在同一批宿主文件上。
  // 例如 #52 与 #95 都改 "enabled: z.boolean().default(true),"，但一个在
  // session-log-deepseek、一个在 product-analytics，互不影响。
  const keysOf = (p) => new Set(Array.isArray(p.file) ? p.file : [p.file]);
  for (const p of PRIVACY_PATCHES) {
    const mine = keysOf(p);
    for (const other of ALL_PATCHES) {
      if (other.id === p.id) continue;
      const theirs = keysOf(other);
      const overlap = [...mine].some((k) => theirs.has(k));
      if (!overlap) continue;
      for (const a of p.replacements) {
        for (const b of other.replacements || []) {
          assert.notEqual(String(a.pattern), String(b.pattern), `${p.name} shares a pattern with #${other.id} on the same target`);
        }
      }
    }
  }
});
