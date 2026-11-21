// 细粒度注入开关：验证「默认行为不变」是硬约束。
//
// 本 PR 只新增两类能力，二者在**未配置时都必须让判定结果与 1.7.20 逐字一致**：
//   1. excludeSessions —— 按会话 id 精确排除
//   2. layers          —— 按层关闭（main / boost / protocol）
//
// 因此本文件的核心断言是「默认等价性」：对同一组 (config, context)，
// 只要没写 excludeSessions / layers，新实现与旧实现的 allowed 值必须相同。
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  injectionPolicy,
  excludedSessionIds,
  layerEnabled,
  sessionIdOf,
} from "../lib/preset-injection.js";

/** 1.7.20 的原始判定，逐字保留，作为"默认行为"的参照实现（oracle）。 */
function legacyAllowed(config, preset) {
  const ids = Array.isArray(config?.excludePresets)
    ? config.excludePresets.filter((x) => typeof x === "string").map((x) => x.trim().toLowerCase()).filter(Boolean)
    : [];
  const unknown = ids.length > 0 && !preset;
  const excluded = !!preset && ids.includes(preset);
  return config?.enabled !== false && !excluded && !unknown;
}

/** 构造一个让 sessionAgentPreset 返回指定值的 context。 */
function ctxWithPreset(preset, sessionId) {
  const context = {
    agent: {
      session: {
        id: sessionId || "s1",
        header: {},
        agentPreset: preset,
      },
    },
  };
  return context;
}

const CONFIGS = [
  undefined,
  {},
  { enabled: true },
  { enabled: false },
  { excludePresets: [] },
  { excludePresets: ["unrestricted"] },
  { excludePresets: ["UNRESTRICTED", " minimal "] },
  { enabled: true, excludePresets: ["ptc"] },
  { enabled: false, excludePresets: ["ptc"] },
];

const PRESETS = ["", "standard", "unrestricted", "ptc", "minimal"];

test("默认等价性：未写 excludeSessions / layers 时，allowed 与 1.7.20 完全一致", () => {
  for (const config of CONFIGS) {
    for (const preset of PRESETS) {
      const ctx = ctxWithPreset(preset);
      const actual = injectionPolicy(config, ctx).allowed;
      const expected = legacyAllowed(config, preset);
      assert.equal(
        actual,
        expected,
        `config=${JSON.stringify(config)} preset=${preset}: ${actual} !== ${expected}`,
      );
    }
  }
});

test("默认等价性：三层（main/boost/protocol）的 allowed 在未配置 layers 时都等于旧判定", () => {
  for (const config of CONFIGS) {
    for (const preset of PRESETS) {
      const ctx = ctxWithPreset(preset);
      const expected = legacyAllowed(config, preset);
      for (const layer of ["main", "boost", "protocol"]) {
        assert.equal(
          injectionPolicy(config, ctx, layer).allowed,
          expected,
          `layer=${layer} config=${JSON.stringify(config)} preset=${preset}`,
        );
      }
    }
  }
});

test("默认等价性：context 为 undefined 时不抛，且 allowed 与旧判定一致", () => {
  for (const config of CONFIGS) {
    for (const layer of ["main", "boost", "protocol"]) {
      let actual;
      assert.doesNotThrow(() => { actual = injectionPolicy(config, undefined, layer).allowed; });
      // 无 context ⇒ preset 为空串
      assert.equal(actual, legacyAllowed(config, ""), `layer=${layer} config=${JSON.stringify(config)}`);
    }
  }
});

// ---------------- 新增能力 1：按会话排除 ----------------

test("excludeSessions：命中时不注入，未命中时行为不变", () => {
  const config = { enabled: true, excludeSessions: ["s-blocked", " another "] };
  assert.deepEqual(excludedSessionIds(config), ["s-blocked", "another"]);

  assert.equal(injectionPolicy(config, ctxWithPreset("standard", "s-blocked")).allowed, false);
  assert.equal(injectionPolicy(config, ctxWithPreset("standard", "another")).allowed, false);
  // 未列出的会话：与旧行为一致（此处为放行）
  assert.equal(
    injectionPolicy(config, ctxWithPreset("standard", "s-other")).allowed,
    legacyAllowed(config, "standard"),
  );
});

test("excludeSessions：默认（不写该字段）不排除任何会话", () => {
  assert.deepEqual(excludedSessionIds({}), []);
  assert.deepEqual(excludedSessionIds({ excludeSessions: "not-an-array" }), []);
  assert.deepEqual(excludedSessionIds({ excludeSessions: [123, null, "  ", "ok"] }), ["ok"]);
  assert.equal(injectionPolicy({}, ctxWithPreset("standard", "anything")).allowed, true);
});

test("excludeSessions：拿不到会话 id 时不误伤（不会因此排除）", () => {
  const config = { enabled: true, excludeSessions: ["s-blocked"] };
  assert.equal(sessionIdOf(undefined), "");
  assert.equal(sessionIdOf({}), "");
  assert.equal(injectionPolicy(config, undefined).allowed, true);
});

// ---------------- 新增能力 2：按层关闭 ----------------

test("layers：未配置时所有层都为真（默认行为不变）", () => {
  assert.equal(layerEnabled({}, "main"), true);
  assert.equal(layerEnabled({}, "boost"), true);
  assert.equal(layerEnabled({}, "protocol"), true);
  assert.equal(layerEnabled(undefined, "boost"), true);
  assert.equal(layerEnabled({ layers: "oops" }, "boost"), true);
});

test("layers：显式关闭某一层只影响该层", () => {
  const config = { enabled: true, layers: { boost: false } };
  assert.equal(layerEnabled(config, "boost"), false);
  assert.equal(layerEnabled(config, "main"), true, "未写入的层保持开启");
  assert.equal(layerEnabled(config, "protocol"), true);

  const ctx = ctxWithPreset("standard");
  assert.equal(injectionPolicy(config, ctx, "boost").allowed, false);
  assert.equal(injectionPolicy(config, ctx, "main").allowed, true);
  assert.equal(injectionPolicy(config, ctx, "protocol").allowed, true);
});

test("layers：全部关闭等价于三层都不注入", () => {
  const config = { enabled: true, layers: { main: false, boost: false, protocol: false } };
  const ctx = ctxWithPreset("standard");
  for (const layer of ["main", "boost", "protocol"]) {
    assert.equal(injectionPolicy(config, ctx, layer).allowed, false, layer);
  }
});

test("layers 与 excludeSessions 叠加时同时生效", () => {
  const config = { enabled: true, layers: { boost: false }, excludeSessions: ["s2"] };
  assert.equal(injectionPolicy(config, ctxWithPreset("standard", "s1"), "main").allowed, true);
  assert.equal(injectionPolicy(config, ctxWithPreset("standard", "s1"), "boost").allowed, false);
  assert.equal(injectionPolicy(config, ctxWithPreset("standard", "s2"), "main").allowed, false);
  assert.equal(injectionPolicy(config, ctxWithPreset("standard", "s2"), "boost").allowed, false);
});

test("enabled:false 仍然压过一切（保持原有总开关语义）", () => {
  const config = { enabled: false, layers: { main: true }, excludeSessions: [] };
  const ctx = ctxWithPreset("standard");
  for (const layer of ["main", "boost", "protocol"]) {
    assert.equal(injectionPolicy(config, ctx, layer).allowed, false, layer);
  }
});
