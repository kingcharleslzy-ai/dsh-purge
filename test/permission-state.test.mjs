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

test("retired permission edits have restoration evidence but cannot be selected", async () => {
  const {ALL_PATCHES} = await import("../lib/core.js");
  const {retiredRulesFor} = await import("../lib/retired-permissions.mjs");
  const former=[6,7,8,9,10,13,14,15,16,35,51,59,60,62];
  assert(!ALL_PATCHES.some(p=>former.includes(p.id)));
  assert.deepEqual(retiredRulesFor(["sandbox-local"]).map(p=>p.id),[6,15]);
});

test("permission migration recovers only reproducible plugin output", async () => {
  const {migratedPermissions} = await import("../lib/permission-migration.mjs");
  const permission = {id:7, patterns:["native default"], replace:"wide default"};
  const feature = {id:21, patterns:["old feature"], replace:"new feature"};
  const patches = [permission, feature], disabled = new Set([7]);
  const migrate = (base, live) => migratedPermissions(base, live, patches, disabled, "host.js");
  const original = "native default\r\nold feature";
  assert.equal(migrate(original, "wide default\r\nnew feature"), "native default\r\nnew feature");
  assert.equal(migrate(original, "native default\r\nnew feature"), "native default\r\nnew feature");
  assert.equal(migrate("wide default", "wide default"), "wide default", "user-selected baseline");
  assert.throws(() => migrate(original, "wide default\r\nmy edit"), /differ/);
  assert.throws(() => migrate(null, "wide default"), /missing/);
  assert.throws(() => migrate("", "wide default"), /empty/);
  assert.throws(() => migrate(original, "partially changed default\r\nold feature"), /differ/);
  assert.equal(migratedPermissions(original, "wide default\r\nnew feature", patches, new Set(), "host.js"), "wide default\r\nnew feature");
});

test("a partial legacy permission edit is reported before Apply and leaves the file intact", async (t) => {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const os = await import("node:os");
  const {inspectPermissionMigration} = await import("../lib/permission-migration.mjs");
  const root = fs.mkdtempSync(path.join(os.tmpdir(),"purge-permission-proof-"));
  t.after(() => fs.rmSync(root,{recursive:true,force:true}));
  const file = path.join(root,"module.js"), backup = file + ".dshpurge.bak";
  const patch = {id:16, file:"fs-sandbox", patterns:["native fence"], replace:"pass // [dsh-purge] test"};
  const inspect = save => inspectPermissionMigration({files:{"fs-sandbox":file}, all:[patch],
    disabled:new Set([16]), roots:[root], fs, save});
  fs.writeFileSync(backup,"native fence");
  fs.writeFileSync(file,patch.replace + "\nuser modification");
  const failWrite = () => assert.fail("ambiguous files must not be written");
  assert.equal((await inspect()).get(16)[0].status, "unmatched");
  assert.match((await inspect(failWrite)).get(16)[0].error, /differ/);
  assert.equal(fs.readFileSync(file,"utf8"), patch.replace + "\nuser modification");
  fs.unlinkSync(backup);
  assert.match((await inspect(failWrite)).get(16)[0].error, /missing/);
  fs.writeFileSync(backup,patch.replace);
  assert.match((await inspect(failWrite)).get(16)[0].error, /previous plugin marker/);
  fs.writeFileSync(backup,Buffer.from([0xff]));
  assert.match((await inspect(failWrite)).get(16)[0].error, /UTF-8/);
});
