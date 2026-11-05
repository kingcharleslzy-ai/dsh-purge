// Self-check must answer "is this layer really in place?" without a live desktop,
// so the pure parts (runtime inject / profile policy / layer roll-up) are testable.
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { selfCheck, rollupLayers, BYPASS_LAYERS } from "../lib/selfcheck.js";
import { inspectPresetText, refinePresetDiagnostic } from "../lib/preset-diagnostic.js";
import { ALL_PATCHES, patchStatus } from "../lib/core.js";

function fakeHome() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-selfcheck-"));
  const profile = path.join(home, "profiles", "desktop");
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(profile, "package.json"), JSON.stringify({ name: "p" }));
  return { home, profile, close: () => fs.rmSync(home, { recursive: true, force: true }) };
}

test("an empty home reports the layers as missing instead of pretending they are live", async () => {
  const f = fakeHome();
  const prevProfile = process.env.DSH_PROFILE;
  const prevSurface = process.env.DSH_SURFACE;
  process.env.DSH_PROFILE = "desktop";
  process.env.DSH_SURFACE = "desktop";
  try {
    const report = await selfCheck(path.join(f.home, "no-host"), f.home);
    assert.equal(report.ok, false);
    assert.equal(report.host_version, "unknown");
    assert.equal(report.layers.filter(l => l.title !== "其他必需目标文件").length, BYPASS_LAYERS.length + 3); // + runtime / config / layout
    const runtime = report.layers.find((l) => l.kind === "runtime");
    assert.equal(runtime.ok, false, "empty inject must not pass");
    const config = report.layers.find((l) => l.kind === "config");
    assert.equal(config.ok, false, "default profile policy must not pass");
    assert(report.hints.length > 0);
  } finally {
    process.env.DSH_PROFILE = prevProfile ?? "";
    if (prevProfile === undefined) delete process.env.DSH_PROFILE;
    if (prevSurface === undefined) delete process.env.DSH_SURFACE;
    else process.env.DSH_SURFACE = prevSurface;
    f.close();
  }
});

test("runtime inject and profile policy are detected from the real files", async () => {
  const f = fakeHome();
  const prevProfile = process.env.DSH_PROFILE;
  const prevSurface = process.env.DSH_SURFACE;
  process.env.DSH_PROFILE = "desktop";
  process.env.DSH_SURFACE = "desktop";
  try {
    fs.writeFileSync(path.join(f.home, "prompt-inject.md"), "<|im_start|>system:\nMODE: TEST\n");
    fs.writeFileSync(
      path.join(f.profile, "cordis.patch.yml"),
      [
        "- id: permission-presets",
        "  config:",
        "    presets:",
        "      danger-full-access:",
        "        sandbox: danger-full-access",
        "        approval: never",
        "    defaultPreset: danger-full-access",
        "",
      ].join("\n"),
    );
    const report = await selfCheck(path.join(f.home, "no-host"), f.home);
    const runtime = report.layers.find((l) => l.kind === "runtime");
    assert.equal(runtime.ok, true);
    assert(runtime.detail.bytes > 0);
    const config = report.layers.find((l) => l.kind === "config");
    assert.equal(config.ok, true);
    assert.equal(config.detail.preset, "danger-full-access");
    assert.equal(config.detail.approval, "never");
  } finally {
    process.env.DSH_PROFILE = prevProfile ?? "";
    if (prevProfile === undefined) delete process.env.DSH_PROFILE;
    if (prevSurface === undefined) delete process.env.DSH_SURFACE;
    else process.env.DSH_SURFACE = prevSurface;
    f.close();
  }
});

test("pending patches are not reported as broken layers", () => {
  // 24 待应用、37 已应用 → 这一层是 pending，不是 broken
  const pending = rollupLayers({ 24: "pending", 37: "applied" }, true);
  const layer = pending.find((l) => l.ids.includes(24));
  assert.equal(layer.state, "pending");
  assert.equal(layer.ok, false, "still not green, but not a failure");
  assert.deepEqual(layer.pending, [24]);
  assert.deepEqual(layer.broken, []);

  // 锚点对不上才是真的坏
  const broken = rollupLayers({ 24: "pattern_not_found", 37: "applied" }, true);
  const bad = broken.find((l) => l.ids.includes(24));
  assert.equal(bad.state, "broken");
  assert.equal(bad.broken[0].id, 24);

  // 目标插件没装 → 不适用，不算坏
  const absent = rollupLayers({ 24: "na", 37: "na" }, true);
  const na = absent.find((l) => l.ids.includes(24));
  assert.equal(na.state, "ok");
  assert(na.note.includes("不适用"));
});


test("missing host information is unknown, never a red patch failure or an all-green report", () => {
  const layers = rollupLayers({}, false);
  assert(layers.every(l => l.state === "unknown" && !l.ok && l.broken.length === 0));
});

test("standalone JSON and text distinguish uncertainty from a confirmed policy mismatch in exit codes", () => {
  const f = fakeHome();
  const env = {...process.env,DSH_HOME:f.home,DSH_PROFILE:"desktop"};
  delete env.DSH_BASE;delete env.PURGE_DSH_CLI;delete env.PURGE_PROFILE_DIR;
  fs.writeFileSync(path.join(f.home,"prompt-inject.md"),"fixture");
  try {
    for (const format of ["--json","--text"]) {
      const unknown=spawnSync(process.execPath,["bin/community.js","selfcheck",format],{env,encoding:"utf8"});
      assert.equal(unknown.status,0,unknown.stderr);
      assert(!unknown.stdout.includes("所有层都在位"));
      if(format==="--json")assert.equal(JSON.parse(unknown.stdout).state,"unknown");
    }
    fs.writeFileSync(path.join(f.profile,"cordis.patch.yml"),"- id: permission\n  config:\n    defaultPreset: workspace-write\n    presets:\n      workspace-write:\n        sandbox: workspace-write\n        approval: ask\n");
    for (const format of ["--json","--text"]) {
      const mismatch=spawnSync(process.execPath,["bin/community.js","selfcheck",format],{env,encoding:"utf8"});
      assert.equal(mismatch.status,1,mismatch.stderr);
    }
  } finally {f.close();}
});

test("real selfCheck tally keeps missing required files visible and excludes only proven exceptions",async()=>{
  const f=fakeHome();
  const {ALL_PATCHES}=await import("../lib/core.js");
  try {
    const states=Object.fromEntries(ALL_PATCHES.map(p=>[p.id,"applied"]));
    const selected=ALL_PATCHES.find(p=>p.settleWhenAbsent);
    states[15]="missing_file";
    states[16]="skipped"; // An unmatched anchor is not proof that the target is optional.
    states[17]="pending";
    states[24]="na";
    states[selected.id]="skipped";
    const report=await selfCheck(path.join(f.home,"host"),f.home,{env:{},argv:[],coreModule:{ALL_PATCHES,patchStatus:async()=>states}});
    assert.equal(report.patch.missing_file,1);
    assert.equal(report.patch.total,ALL_PATCHES.length-2);
    assert.equal(report.patch.applied,ALL_PATCHES.length-5);
    assert.equal(report.patch.not_applicable,2);
    assert.equal(report.state,"broken");
    assert(report.layers.some(l=>l.broken.some(b=>b.id===15)));
    assert(report.layers.some(l=>l.broken.some(b=>b.id===16)));
    assert(report.layers.some(l=>l.pending.includes(17)));
    assert(!report.layers.some(l=>l.broken.some(b=>b.id===selected.id)));
    const na=Object.fromEntries(ALL_PATCHES.map(p=>[p.id,"na"]));
    const empty=await selfCheck(path.join(f.home,"host"),f.home,{env:{},argv:[],coreModule:{ALL_PATCHES,patchStatus:async()=>na}});
    assert.equal(empty.patch.total,0);
    assert.equal(empty.patch.not_applicable,ALL_PATCHES.length);
  } finally {f.close();}
});

test("absent optional targets, disabled checks and unknown states retain distinct counts", async()=>{
  const {tallyPatchStatus}=await import("../lib/selfcheck.js");
  const patches=[{id:1},{id:2,optional:true},{id:3},{id:4},{id:5,settleWhenAbsent:true}];
  assert.deepEqual(tallyPatchStatus({1:"missing_file",2:"missing_file",3:"off",5:"skipped",4:"disabled"},patches),
    {applied:0,total:1,all:5,na:0,skipped:1,missing_file:2,off:1,disabled:1,not_applicable:4,partial:0});
});

const persona = (prefix) => `- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n    prefix: ${prefix}\n`;

async function presetReport(text) {
  const f = fakeHome();
  const file = path.join(f.home, ".agent-presets/unrestricted/agent.cordis.yml");
  const host = path.join(f.home, "host");
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.mkdirSync(path.join(host, "dsh-agent-loop"), {recursive:true});
  fs.writeFileSync(path.join(host, "dsh-agent-loop/package.json"), '{"version":"0.2.1-rc.2"}');
  fs.writeFileSync(file, text);
  try {
    const original = fs.readFileSync(file);
    // Exercise the actual patch engine for #76, not a hardcoded "skipped" fixture.
    const actual = await patchStatus(host, [ALL_PATCHES.find(p=>p.id===76)], {dshHome:f.home,surface:"web"});
    const states = {...Object.fromEntries(ALL_PATCHES.map(p=>[p.id,"applied"])),...actual};
    const report = await selfCheck(host,f.home,{env:{},argv:[],coreModule:{ALL_PATCHES,patchStatus:async()=>states}});
    assert.deepEqual(fs.readFileSync(file), original, "diagnostics must preserve every preset byte");
    return {actual,report,layer:report.layers.find(l=>l.ids.includes(76))};
  } finally {f.close();}
}

test("#38 shipped default preset with comments and unrelated JS tags needs no work (LF/CRLF)", async()=>{
  // Windows Git checkouts may already use CRLF. Normalize once before constructing
  // the two valid fixtures, instead of accidentally making malformed CRCRLF.
  const text=fs.readFileSync(new URL("../presets/unrestricted/agent.cordis.yml",import.meta.url),"utf8").replace(/\r\n/g,"\n");
  for (const value of [text,text.replace(/\n/g,"\r\n")]) {
    const {actual,report,layer}=await presetReport(value);
    assert.equal(actual[76],"skipped");
    assert.equal(layer.state,"ok");
    assert.equal(layer.applied,4);
    assert.equal(layer.required,4);
    assert.deepEqual(layer.absent,[76]);
    assert.match(layer.note,/无需处理/);
    assert.equal(report.patch.total,ALL_PATCHES.length-1);
    assert.equal(report.patch.applied,ALL_PATCHES.length-1);
  }
});

test("#38 matching work remains pending and an existing applied marker remains applied",async()=>{
  const pending=await presetReport("- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n              prefix: You are a helpful software engineer assistant.\n");
  assert.equal(pending.actual[76],"pending");
  assert.equal(pending.layer.state,"pending");
  assert(pending.layer.pending.includes(76));
  const applied=await presetReport("- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config:\n              prefix: \"\"\n");
  assert.equal(applied.actual[76],"applied");
  assert.equal(applied.layer.applied,5);
});

test("#38 unmatched identity text stays broken even when YAML indentation or quoting differs",async()=>{
  for (const prefix of ['"You are a coding agent powered by the example model."',
    '|\\n      You are a helpful software engineer assistant.'.replace("\\n","\n"),
    '"You  are a helpful software engineer assistant."']) {
    const {actual,layer}=await presetReport(persona(prefix));
    assert.equal(actual[76],"skipped");
    assert.equal(layer.state,"broken");
    assert.deepEqual(layer.broken,[{id:76,status:"skipped"}]);
    assert.equal(layer.required,5);
  }
});

test("#38 malformed, dynamic, inherited or ambiguous persona data stays unknown, never green",async()=>{
  for (const text of [
    persona("[invalid"), persona("!!js 'doNotExecute()'"), persona("42"),
    persona("'{{externalPrefix}}'"), persona("'${externalPrefix}'"),
    persona("*missing"), persona("'hello'")+persona("'second'"),
    "- id: persona\n  name: '@deepseek-ai/dsh-persona'\n  config: {}\n",
    persona("'hello'").replace("  config:","  disabled: !!js true\n  config:"),
    persona("'hello'").replace("  config:","  disabled: true\n  config:"),
    persona("'hello'").replace("  config:","  config: {}\n  config:"),
    persona("'hello'").replace("  config:","  <<: {disabled: true}\n  config:"),
    persona("'hello'").replace("    prefix:","    <<: {prefix: inherited}\n    prefix:"),
    "- id: another\n  config: {}\n",
    persona("'hello'").replace(/\n/g,"\r\r\n"),
  ]) {
    assert.equal(inspectPresetText(text),"unknown",text);
    const {layer}=await presetReport(text);
    assert.equal(layer.state,"unknown",text);
    assert.equal(layer.required,5);
  }
});

test("#38 ignores identity sentences in comments and accepts a literal empty prefix",()=>{
  assert.equal(inspectPresetText("# You are a helpful software engineer assistant.\n"+persona("'custom persona'")),"not_needed");
  assert.equal(inspectPresetText(persona('""')),"not_needed");
});

test("#38 unreadable/missing preset stays unknown; reads only selected home and never evaluates JS",()=>{
  for(const code of ["ENOENT","EACCES"]) {
    const status={76:"skipped",16:"missing_file"};
    const refined=refinePresetDiagnostic(status,"/chosen-home",{readFileSync(file){
      assert.equal(file,path.join("/chosen-home",".agent-presets/unrestricted/agent.cordis.yml"));
      throw Object.assign(Error("fixture"),{code});
    }});
    assert.equal(refined[76],"unknown");
    assert.equal(refined[16],"missing_file");
    assert.equal(status[76],"skipped");
  }
  delete globalThis.purgeDiagnosticExecuted;
  assert.equal(inspectPresetText(persona("!!js globalThis.purgeDiagnosticExecuted = true")),"unknown");
  assert.equal(globalThis.purgeDiagnosticExecuted,undefined);
  for(const state of ["pending","applied","missing_file","na","unknown"]) {
    assert.equal(refinePresetDiagnostic({76:state},"/unused",{readFileSync(){throw Error("must not read");}})[76],state);
  }
});

test("#38 does not exempt arbitrary optional skips or required missing files",()=>{
  const states=Object.fromEntries(ALL_PATCHES.map(p=>[p.id,"applied"]));
  states[71]="skipped";states[76]="not_needed";states[16]="missing_file";
  const layers=rollupLayers(states,true);
  const identity=layers.find(l=>l.ids.includes(76));
  assert.equal(identity.state,"broken");
  assert(identity.broken.some(p=>p.id===71));
  assert.deepEqual(identity.absent,[76]);
  assert(layers.some(l=>l.broken.some(p=>p.id===16)));
  states[76]="unknown";
  const mixed=rollupLayers(states,true).find(l=>l.ids.includes(76));
  assert.equal(mixed.state,"broken","an uncertain preset must not hide another confirmed failure");
  assert(mixed.broken.some(p=>p.id===71));
});

test("observation policy requires every active method in each host layout", async () => {
  const { patchApplied } = await import("../lib/core/shared.mjs");
  const patch = ALL_PATCHES.find(p => p.id === 17);
  const [write, check] = patch.replacements;
  const edit = "\teditIntent(target, actor) {\n\t\t// [dsh-purge] observation bypass: edits are unconditional (no read-first gate).\n\t\treturn void 0;\n\t}";
  const delegations = ["edit", "delete"].map(verb => '\t' + verb + 'Intent(target, actor) {\n\t\treturn this.requirePresent(target, actor, "' + verb + '");\n\t}');
  const policy = (...methods) => ["var ObservedStateGate = class {", ...methods, "};"].join("\n");
  const old = policy(write.replace, edit);
  const modern = policy(write.replace, ...delegations, check.replace);
  for (const full of [old, modern]) {
    assert.equal(patchApplied(full, patch), true);
    assert.equal(patchApplied(full.replaceAll("\n", "\r\n"), patch), true);
  }
  for (const partial of [
    policy(write.pattern, edit), policy(write.replace), policy(write.replace, "/*"+edit+"*/"),
    policy(write.replace, ...delegations, check.pattern), policy(write.pattern, ...delegations, check.replace),
    policy(write.replace, delegations[0], check.replace), policy(write.replace, edit, check.replace),
    old.replace("return void 0;", "return this.get(actor, target);"), modern + "\n" + modern,
    policy(write.replace, edit, "\teditIntent(other) { throw Error(); }"),
  ]) assert.equal(patchApplied(partial, patch), false);
});

test("apply refuses a partial observation rewrite and keeps the original bytes", async t => {
  const {applyPatches, patchStatusDetail} = await import("../lib/core.js");
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "observation-transaction-"));
  const home = path.join(root, "home");
  const host = path.join(root, "node_modules/@deepseek-ai");
  const file = path.join(host, "dsh-fs-observation-policy/lib/index.js");
  fs.mkdirSync(path.dirname(file), {recursive:true});
  fs.mkdirSync(home);
  t.mock.method(process, "cwd", () => root);
  const previous = process.env.DSH_HOME;
  process.env.DSH_HOME = home;
  t.after(() => {
    if(previous === undefined) delete process.env.DSH_HOME;
    else process.env.DSH_HOME = previous;
    fs.rmSync(root, {recursive:true, force:true});
  });
  const patch = ALL_PATCHES.find(p => p.id === 17);
  for (const write of [patch.replacements[0].pattern, patch.replacements[0].replace]) {
    const original = "var ObservedStateGate = class {\n" + write + "\n\teditIntent(target, actor) { throw Error(); }\n};";
    fs.writeFileSync(file, original);
    const [result] = await applyPatches(host, [patch]);
    assert.match(result.status, /incomplete_observation_policy|pattern_not_found/);
    const report = await patchStatusDetail(host, [patch], {dshHome:home,surface:"desktop"});
    assert.match(report.status[17], /pending|drifted/);
    assert.equal(fs.readFileSync(file, "utf8"), original);
  }
});
