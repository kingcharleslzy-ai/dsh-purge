// dsh-go 手机本机引擎（DSH App）的宿主锚点回归。
// 只验证补丁文本匹配与产物可编译，不执行宿主、不读用户配置、不改权限。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { ALL_PATCHES } from "../lib/patches/index.mjs";
import { applyReplacementsToText } from "../lib/core/verify.mjs";
import { patchApplied } from "../lib/core/shared.mjs";
import {
  nativeSteeringRestored,
  NATIVE_QUEUE_CASE,
  HOST_QUEUE_CASE_GATED,
  OLD_QUEUE_CASE_GATED,
} from "../lib/steering.js";

const steering = ALL_PATCHES.find((x) => x.id === 90);
const prestep = ALL_PATCHES.find((x) => x.id === 74);
const rc2 = JSON.parse(
  fs.readFileSync(new URL("./fixtures/steering-rc2.json", import.meta.url), "utf8"),
);
const loopFixture = JSON.parse(
  fs.readFileSync(
    new URL("./fixtures/agent-loop-022-native.json", import.meta.url),
    "utf8",
  ),
);

// DSH App 在 updateQueue 的 case "steer" 前插入的生命周期闸门。
const GATE =
  '\t\t\t\tthis.ctx.get("sessionPersistence")?.dshGoDeletion?.assertAdmit(agent.id);\n';

test("#90: dsh-go gated native branch settles without rewriting it", () => {
  const controller = rc2.controller.replace(NATIVE_QUEUE_CASE, HOST_QUEUE_CASE_GATED);
  assert.equal(nativeSteeringRestored(controller), true);
  const result = applyReplacementsToText(controller, steering);
  assert.equal(result.changed, false, "already-native code must not be rewritten");
  assert.equal(patchApplied(result.text, steering), true);
});

test("#90: dsh-go gated #86 residue migrates back to the native branch", () => {
  const gated86 = rc2.controller.replace(NATIVE_QUEUE_CASE, OLD_QUEUE_CASE_GATED);
  assert.equal(nativeSteeringRestored(gated86), false);
  const result = applyReplacementsToText(gated86, steering);
  assert.equal(result.changed, true);
  assert.equal(
    result.text.replace("// [dsh-purge] native steering restored (#90)\n", ""),
    rc2.controller.replace(NATIVE_QUEUE_CASE, HOST_QUEUE_CASE_GATED),
  );
  assert.equal(nativeSteeringRestored(result.text), true);
  assert.equal(applyReplacementsToText(result.text, steering).changed, false);
});

test("#90: gated migration keeps CRLF and stays a no-op on repeat", () => {
  const crlf = rc2.controller
    .replace(NATIVE_QUEUE_CASE, OLD_QUEUE_CASE_GATED)
    .replace(/\n/g, "\r\n");
  const result = applyReplacementsToText(crlf, steering);
  assert.ok(!/(?<!\r)\n/.test(result.text));
  assert.equal(nativeSteeringRestored(result.text), true);
  assert.equal(applyReplacementsToText(result.text, steering).changed, false);
});

test("#90: a gate on an unknown branch is still reported, not settled", () => {
  const unknown = rc2.controller
    .replace(NATIVE_QUEUE_CASE, HOST_QUEUE_CASE_GATED)
    .replace("agent.steer(message);", "agent.customSteer(message);");
  assert.equal(nativeSteeringRestored(unknown), false);
  assert.equal(steering.strictFiles, true);
});

test("#74: dsh-go recall seam is claimed and yields compilable preStep", () => {
  const native = loopFixture.preStep;
  const gated = native.replace(
    "\t\tconst claimed = this.inbox.claim(target, position.turn);\n\t\tconst selection = this.model.current();",
    "\t\tconst claimed = this.inbox.claim(target, position.turn);\n" +
      "\t\tconst recall = await dshGoRecall.prepare(this.loopCtx, this, position, claimed, signal);\n" +
      "\t\tconst selection = this.model.current();",
  );
  assert.notEqual(gated, native, "fixture must actually contain the recall seam");
  const result = applyReplacementsToText(gated, prestep);
  assert.equal(result.changed, true);
  assert.ok(patchApplied(result.text, prestep));
  assert.doesNotThrow(() => new vm.Script(`({${result.text}})`));
  // 钩子必须落在 recall 之后、model.current() 之前，且只出现一次。
  const hook = result.text.indexOf("__dshPurgePrepareAssemble");
  assert.ok(hook > result.text.indexOf("dshGoRecall.prepare"));
  assert.ok(hook < result.text.indexOf("const selection = this.model.current();"));
  assert.equal(result.text.split("__dshPurgePrepareAssemble").length, 2);
  assert.equal(applyReplacementsToText(result.text, prestep).changed, false);
});

test("#74: hosts without the recall seam keep migrating unchanged", () => {
  const result = applyReplacementsToText(loopFixture.preStep, prestep);
  assert.equal(result.changed, true);
  assert.ok(patchApplied(result.text, prestep));
  assert.ok(!result.text.includes("dshGoRecall"));
  assert.doesNotThrow(() => new vm.Script(`({${result.text}})`));
});

test("#90 reports both controller and loop evidence in either direction", async t => {
  const { mkdtempSync, mkdirSync, writeFileSync, rmSync } = fs;
  const { default: os } = await import("node:os");
  const { default: path } = await import("node:path");
  const { patchStatusDetail, applyPatches } = await import("../lib/core.js");
  const { summarizeApplyReport } = await import("../lib/core/verify.mjs");
  const root = mkdtempSync(path.join(os.tmpdir(),"purge-mobile-anchors-"));
  const home = path.join(root, "profile");
  mkdirSync(home);
  const ai = path.join(root, "host", "node_modules", "@deepseek-ai");
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const oldHome = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  t.after(() => { if (oldHome === undefined) delete process.env.DSH_HOME; else process.env.DSH_HOME = oldHome; });
  const files = ["dsh-api-session-controller","dsh-agent-loop"].map(pkg => path.join(ai,pkg,"lib","index.js"));
  const native = [rc2.controller.replace(NATIVE_QUEUE_CASE,HOST_QUEUE_CASE_GATED),rc2.agentMethods];
  const opts = {dshHome:home, surface:"web", extraPatches:[]};
  for (const file of files) mkdirSync(path.dirname(file),{recursive:true});
  for (const side of [0,1]) {
    for (const missing of [false,true]) {
      files.forEach((file,i) => writeFileSync(file, i === side ? "// unknown layout" : native[i]));
      if (missing) rmSync(files[side]);
      const read = await patchStatusDetail(ai,[steering],opts);
      assert.equal(read.status[90],"partial");
      const report = await applyPatches(ai,[steering],opts);
      assert.equal(summarizeApplyReport(report,[steering]).failed.length,1);
    }
  }
  files.forEach((file,i) => writeFileSync(file,native[i]));
  assert.equal((await patchStatusDetail(ai,[steering],opts)).status[90],"applied");
  assert.equal(summarizeApplyReport(await applyPatches(ai,[steering],opts),[steering]).failed.length,0);
});
