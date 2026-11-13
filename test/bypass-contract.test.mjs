// 破甲契约：这 25 条是"闸门"。任何人（包括后续优化）改动它们，
// 指纹就会变，CI 直接红——要动必须先说明理由并更新这里的指纹。
// 质量优化只能碰非闸门补丁（例如已移除的 #18/#19）。
import { test } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { ALL_PATCHES, patchEnabled } from "../lib/core.js";

const GATE_FINGERPRINTS = {
  5: "13e205e4c8f319e3",
  6: "5d03a6507943f586",
  7: "2e490a6fd7e2a07e",
  8: "004ed85a11810181",
  9: "e1f2c1fa551e2fa0",
  10: "1e1197b70cd4bcd9",
  11: "f732bb54043fe3f6",
  12: "e7e94c2c5d5d6e0f",
  // 0.2.2-rc.3: add the identical bypass for SandboxEscalationError; the
  // three checks and the replacement text are unchanged.
  13: "439a5b6d85c9eecb",
  14: "7aec29a1b4b82ddb",
  15: "68bd19d2e61b65bb",
  16: "9698a6c3b4e9e7ba",
  // rc.5 has its own editIntent body instead of the shared edit/delete method.
  17: "19bdb473d05f28c9",
  30: "c844cddcc7933514",
  31: "f80165c28dc19a5e",
  34: "1ecd46f5b4067b0f",
  35: "eab9ef59d3ca00b8",
  36: "fd8e27dd7b1b21b3",
  59: "fc2fc00d258210b1",
  60: "9e13ac2da676e434",
  // Accept the same native sentence after #93 has removed its branding.
  61: "c175ed1d70acf41d",
  63: "b92dd05efb4ba817",
  66: "a97a223234457fee",
  // 1.6.74: correct the literal newline escape and migrate only its malformed
  // output; the two existing message-length conditions are unchanged.
  67: "1cb9cbbaf23fb2d8",
  68: "2590e742617f1242",
};

function fingerprint(patch) {
  const shape = JSON.stringify({
    name: patch.name,
    replacements: (patch.replacements || []).map((r) => ({
      p: String(r.pattern).slice(0, 400),
      r: String(r.replace).slice(0, 400),
    })),
  });
  return crypto.createHash("sha256").update(shape).digest("hex").slice(0, 16);
}

test("all 25 bypass gates exist with unchanged semantics", () => {
  const byId = new Map(ALL_PATCHES.map((p) => [p.id, p]));
  const problems = [];
  for (const [id, expected] of Object.entries(GATE_FINGERPRINTS)) {
    const patch = byId.get(Number(id));
    if (!patch) {
      problems.push(`#${id} missing`);
      continue;
    }
    const actual = fingerprint(patch);
    if (actual !== expected) problems.push(`#${id} ${patch.name} changed (${expected} -> ${actual})`);
  }
  assert.deepEqual(problems, [], problems.join("; "));
});

test("quality-reducing patches stay opt-in and off by default", () => {
  // #18/#19 关闭的是上下文保护（重复调用提醒、工具结果修剪），不是门禁。
  // 它们以 disabledByDefault 形态存在：能显式打开，但默认绝不写入宿主。
  for (const id of [18, 19]) {
    const patch = ALL_PATCHES.find((p) => p.id === id);
    assert.ok(patch, `#${id} should exist as an opt-in patch`);
    assert.equal(patch.disabledByDefault, true, `#${id} must stay off by default`);
    assert.equal(patchEnabled(patch, []), false, `#${id} must not apply without an explicit opt-in`);
  }
});
