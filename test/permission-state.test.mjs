import { test } from "node:test";
import assert from "node:assert/strict";
import { permissionState } from "../lib/permission-state.js";
const config = (preset = "danger-full-access", approval = "never") => `
- id: permission-presets
  config:
    defaultPreset: '${preset}' # quoted, comment and reversed property order
    presets:
      ${preset}:
        approval: ${approval}
        sandbox: ${preset}
`;
const live = (sandbox = "danger-full-access", approval = "never") => ({get(name) {
  if (name === "permissionPresets") return {defaultPreset:sandbox,resolve() {return {sandbox,approval};}};
}});

test("effective inferred policy is distinct from a persisted choice, with no config writes", () => {
  assert.equal(permissionState("", live()).state, "inferred");
  assert.equal(permissionState("", live("workspace-write", "ask")).state, "broken");
  assert.equal(permissionState(config(), live()).state, "ok");
  const changed = permissionState(config(), live("workspace-write", "ask"));
  assert.equal(changed.state, "broken", "runtime settings override stale file evidence");
  assert.equal(changed.source, "runtime:permissionPresets");
});

test("CLI reports unavailable effective defaults as unknown; literal file evidence is scoped", () => {
  assert.equal(permissionState("").state, "unknown");
  assert.equal(permissionState("defaultPreset: danger-full-access\n").state, "unknown");
  assert.equal(permissionState(config()).state, "ok");
  assert.equal(permissionState(config()).source, "profile-file");
  assert.equal(permissionState(config("workspace-write", "ask")).state, "broken");
  assert.equal(permissionState(config().replace("permission-presets", "other-plugin")).state, "unknown");
  assert.equal(permissionState(config().replace("sandbox: danger-full-access", "sandbox: !!js process.env.MODE")).state, "unknown");
});

test("YAML comments, other plugins, malformed YAML and JS tags cannot fabricate a pinned policy", () => {
  assert.equal(permissionState("# defaultPreset: danger-full-access\n", live()).state, "inferred");
  assert.equal(permissionState("- id: other\n  config:\n    text: |\n      defaultPreset: danger-full-access\n", live()).state, "inferred");
  assert.equal(permissionState("- [broken", live()).state, "inferred");
  assert(permissionState("- [broken").error.includes("YAML"));
  globalThis.purgeYamlExecuted = false;
  const expression = "- id: permission-presets\n  config:\n    defaultPreset: !!js globalThis.purgeYamlExecuted=true\n";
  assert.equal(permissionState(expression, live()).state, "inferred");
  assert.equal(globalThis.purgeYamlExecuted, false);
  delete globalThis.purgeYamlExecuted;
  assert.equal(permissionState(config(), {get(){throw Error("disposed service")}}).state, "unknown");
});

test("permission default patches require explicit selection", async () => {
  const { ALL_PATCHES, patchEnabled } = await import("../lib/core.js");
  for (const id of [7, 8, 10, 51]) {
    const patch = ALL_PATCHES.find(item => item.id === id);
    assert.equal(patchEnabled(patch, []), false);
    assert.equal(patchEnabled(patch, [18, 19]), false);
    assert.equal(patchEnabled(patch, [id]), true);
  }
});
