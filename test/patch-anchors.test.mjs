// Anchors pinned to the real DSH 0.2.1-rc.1 host source. If the host changes shape,
// these fixtures and the patch table must be updated together — that is the point.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ALL_PATCHES, applyReplacementsToText } from "../lib/core.js";

const patch = (id) => {
  const found = ALL_PATCHES.find((p) => p.id === id);
  assert.ok(found, `patch #${id} must exist`);
  return found;
};

const WEB_PROMPT = "const WEB_SURFACE_PROMPT = `You are interacting with the user through the DeepSeek Harness Web GUI whose URL the runtime context names. When the user refers to \"this page\", \"this GUI\", or \"this app\" without naming another target, they mean this GUI. The browser provides no implicit DOM, route, or screenshot context. The client-plugin HMR receiver is active, but client-plugin changes reload without a refresh only while \\`pnpm run dev:web\\` is also running from this same checkout to rebuild their bundles; verify that watcher before promising automatic updates. Every other change — the apps/web shell and plain packages — requires rebuilding the affected Web artifacts and verifying this existing URL after a page refresh. Starting another server does not update this GUI. The apps/web Vite entry builds the shell but is not a standalone application because only dsh web injects window.__DSH_BOOT__. Do not start a replacement server unless the user asks; if one is needed, use a managed background job and verify its exact URL.`;";

const SYSTEM_PROMPT_ASSEMBLE = "\t\tconst transformed = await this.ctx.waterfall(scopeTarget(this, scope), \"system-prompt/assemble\", assembly, context, () => Promise.resolve(assembly));\n\t\tif (completeSection === void 0 && !runtimeContextSuppressed) return {\n\t\t\t...transformed,\n\t\t\ttools\n\t\t};\n\t\tconst requiredContexts = new Set([...contextByName.values()].filter((entry) => entry.required === true).map((entry) => entry.name));\n\t\treturn {\n\t\t\t...transformed,\n\t\t\ttools,\n\t\t\tsections: completeSection === void 0 ? transformed.sections : [completeSection],\n\t\t\tcontexts: runtimeContextSuppressed ? transformed.contexts.filter((entry) => requiredContexts.has(entry.name)) : transformed.contexts\n\t\t};\n";

const CONVERSATION_APPEND = "\t\t\tappend(record) {\n\t\t\t\tconst event = record.event;\n\t\t\t\tif (this.inputs.has(event.seq)) return \"none\";\n\t\t\t\tif (this.revised.size > 0) this.revised.clear();\n\t\t\t\tthis.inputs.set(event.seq, record);\n";

test("0.2.1 web-surface prompt: #32 neutralizes the product name, #53 drops identity and do-not-start", () => {
  const branded = WEB_PROMPT;
  assert.ok(branded.includes("DeepSeek Harness Web GUI"));
  const after32 = applyReplacementsToText(branded, patch(32)).text;
  assert.ok(!after32.includes("DeepSeek Harness Web GUI"));
  assert.ok(after32.includes("the local web GUI whose URL the runtime context names"));
  const after53 = applyReplacementsToText(after32, patch(53)).text;
  assert.ok(after53.includes("Local web GUI: its URL is named in the runtime context."));
  assert.ok(!after53.includes("Do not start a replacement server"));
  // legacy paragraph text inside the same file must survive: it is used to match old sessions.
  const legacy = 'suffix: "Do not start a replacement server unless the user asks; if one is needed, use a managed background job and verify its exact URL."';
  const kept = applyReplacementsToText(legacy, patch(53)).text;
  assert.equal(kept, legacy);
  // idempotent
  assert.equal(applyReplacementsToText(after53, patch(32)).changed, false);
  assert.equal(applyReplacementsToText(after53, patch(53)).changed, false);
});

test("0.2.2 complete preset still carries the dsh-purge inject after assemble", () => {
  const out = applyReplacementsToText(SYSTEM_PROMPT_ASSEMBLE, patch(40));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes("const dshPurgeSections ="));
  // complete 模式保留原 complete 段，并把注入段一并带上。
  assert.ok(out.text.includes("[completeSection, ...dshPurgeSections]"));
  assert.ok(out.text.includes("const requiredContexts = new Set("));
  assert.ok(out.text.includes("requiredContexts.has(entry.name)"));
  assert.equal(applyReplacementsToText(out.text, patch(40)).changed, false);
});

test("0.2.1 rewind marker drops sent messages on append", () => {
  const out = applyReplacementsToText(CONVERSATION_APPEND, patch(77));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes("if (isRewindMarker(event)) {"));
  assert.ok(out.text.includes("return this.replaceWindow(entries, this.hasMore);"));
  assert.ok(out.text.includes("if (this.revised.size > 0) this.revised.clear();"));
  assert.equal(applyReplacementsToText(out.text, patch(77)).changed, false);
});

test("undo and chained patches declare their settle semantics", () => {
  assert.equal(patch(80).settleWhenAbsent, true);
  assert.equal(patch(88).chainedAfter, 87);
});

test("0.2.1 ask_user_question keeps the requested wait and caps only -1", () => {
  const src = "\t\tasync execute(args, exec) {\n\t\t\tconst timeout = validateTimeout(args.timeout ?? defaultTimeout);\n\t\t\tvalidateQuestionIds(args.questions);";
  const out = applyReplacementsToText(src, patch(89));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes("args.timeout === -1 ? 300 : (args.timeout ?? defaultTimeout)"));
  assert.ok(!out.text.includes("const timeout = 1;"));
  assert.equal(applyReplacementsToText(out.text, patch(89)).changed, false);
});

// The responses path names its role variable `instructionRole`, not `role`.
// Pinning the real host text keeps the #57 anchor from silently drifting to a
// name no host version ever used — the failure mode is invisible because the
// patch is `optional`, so a miss still reports as applied.
const RESPONSES_INSTRUCTION_ROLE =
	'    const instructionRole = model.reasoning && compat?.supportsDeveloperRole !== false ? "developer" : "system";';

test("#57 responses anchor matches the real instructionRole line and gates on the gateway", () => {
  const out = applyReplacementsToText(RESPONSES_INSTRUCTION_ROLE, patch(57));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes("const instructionRole = model.reasoning"));
  assert.ok(out.text.includes('includes("api.openai.com")'));
  assert.ok(out.text.includes('includes("azure.com")'));
  assert.ok(out.text.includes("// [dsh-purge] developer role allowlist: openai/azure"));
  // The rewrite must keep the role variable name, or the host stops compiling.
  assert.ok(out.text.includes('? "developer" : "system";'));
  assert.equal(applyReplacementsToText(out.text, patch(57)).changed, false);
});

test("#57 responses anchor leaves the vendor-native decision intact", () => {
  const apply = (baseUrl) =>
    eval(
      `((model, compat) => ${applyReplacementsToText(RESPONSES_INSTRUCTION_ROLE, patch(57)).text
        .trim()
        .replace(/^const instructionRole = /, "")
        .replace(/;\s*(\/\/.*)?$/, "")})`,
    )({ reasoning: true, baseUrl }, undefined);
  assert.equal(apply("https://api.openai.com/v1"), "developer");
  assert.equal(apply("https://foo.azure.com"), "developer");
  assert.equal(apply("https://gateway.example.com/v1"), "system");
  assert.equal(apply("https://relay.example.net/v1"), "system");
});

// --- #57: real-host verification and legacy upgrade -------------------------
// Everything above uses a single pinned line. The bug this guards against was
// invisible precisely because nobody ran the patch against the real file, so
// this block reads the installed host when it is available and checks the
// whole-file rewrite, its syntax, and idempotency.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const HOST_ROOTS = [
  process.env.PURGE_TEST_HOST,
  "/Applications/DeepSeek Harness.app/Contents/Resources/app/dsh/node_modules",
].filter(Boolean);

function responsesFile() {
  for (const root of HOST_ROOTS) {
    for (const base of [root, path.join(root, "@deepseek-ai")]) {
      const candidate = path.join(base, "@earendil-works/pi-ai/dist/api/openai-responses-shared.js");
      if (fs.existsSync(candidate)) return candidate;
      const direct = path.join(base, "pi-ai/dist/api/openai-responses-shared.js");
      if (fs.existsSync(direct)) return direct;
    }
  }
  return "";
}

function nodeCheck(source) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-syntax-"));
  const file = path.join(dir, "probe.mjs");
  fs.writeFileSync(file, source);
  const result = spawnSync(process.execPath, ["--check", file], { encoding: "utf8" });
  fs.rmSync(dir, { recursive: true, force: true });
  return result;
}

test("#57 rewrites the real responses file, keeps it parseable, and is idempotent", () => {
  const file = responsesFile();
  if (!file) return; // host not installed on this machine: pinned-line tests still cover the shape
  const original = fs.readFileSync(file, "utf8");
  // The anchor must exist in the shipped file, not merely in our fixture.
  assert.ok(original.includes('const instructionRole = model.reasoning && compat?.supportsDeveloperRole !== false'));
  assert.equal(original.includes("const role = model.reasoning"), false);

  // The host may already be patched on a developer machine, so the assertion is
  // state-agnostic: either the rewrite happens now, or it happened in an earlier
  // apply and must be a no-op. Both states must stay parseable.
  const marked = original.includes("// [dsh-purge] developer role allowlist: openai/azure");
  const once = applyReplacementsToText(original, patch(57));
  assert.equal(once.changed, !marked, marked ? "already patched host must be a no-op" : "unpatched host must be rewritten");
  assert.ok(once.text.includes("// [dsh-purge] developer role allowlist: openai/azure"));
  assert.ok(once.text.includes("const instructionRole = model.reasoning"));
  assert.equal(nodeCheck(once.text).status, 0, "rewritten host file must still parse");
  assert.equal(applyReplacementsToText(once.text, patch(57)).changed, false, "a second apply must be a no-op");
});

test("#57 upgrades a file that still carries the old deepseek-only marker", () => {
  const legacy =
    '    const instructionRole = model.reasoning && compat?.supportsDeveloperRole !== false && !String(model.baseUrl || "").toLowerCase().includes("deepseek.com") ? "developer" : "system"; // [dsh-purge] deepseek.com keeps system role';
  const out = applyReplacementsToText(legacy, patch(57));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes('includes("api.openai.com")'));
  assert.ok(out.text.includes("// [dsh-purge] developer role allowlist: openai/azure"));
  assert.equal(out.text.includes("deepseek.com"), false);
  assert.equal(applyReplacementsToText(out.text, patch(57)).changed, false);
});

test("#57 covers both pi-ai paths that decide the developer role", () => {
  const files = patch(57).file;
  assert.deepEqual([...files].sort(), ["pi-ai-completions", "pi-ai-responses-shared"]);
});

// Run the real rc.5 method fragments, with observable host-service boundaries.
// Supplying a source directory additionally checks a pristine npm package.
test("rc.5 keeps complete persona, selected tools and required contexts; first-step prepare runs before assemble", async () => {
  const fs = await import("node:fs/promises");
  const vm = await import("node:vm");
  const path = await import("node:path");
  const fixture = JSON.parse(await fs.readFile(new URL("./fixtures/prompt-rc5-host.json", import.meta.url)));
  const input = process.env.PURGE_RC5_SOURCE;
  async function patched(fragment, pkg, id) {
    const original = input ? await fs.readFile(path.join(input, pkg, "lib/index.js"), "utf8") : fragment;
    assert.ok(original.includes(fragment));
    const result = applyReplacementsToText(original, patch(id));
    assert.ok(result.changed);
    assert.equal(applyReplacementsToText(result.text, patch(id)).changed, false);
    const part = applyReplacementsToText(fragment, patch(id)).text;
    assert.ok(result.text.includes(part));
    return part;
  }
  const tail = await patched(fixture.assembleTail, "dsh-system-prompt", 40);
  const prepare = await patched(fixture.preStep, "dsh-agent-loop", 74);
  const assemble = vm.runInNewContext('(async function(assembly, completeSection, runtimeContextSuppressed, contextByName) {' + tail + '})',
    {scopeTarget: () => null, scope: null, context: {}});
  const complete = {name:"user-persona", text:"User supplied text"};
  const extra = {name:"dsh-purge-test", text:"User supplied supplement"};
  const assembly = {sections:[{name:"other", text:"ordinary"}, complete, extra], tools:[{name:"read"}], contexts:[{name:"keep"}, {name:"drop"}]};
  const ctx = {waterfall: async (_target, _event, original) => original};
  const run = (persona, suppress) => assemble.call({ctx}, assembly, persona, suppress, new Map([["keep",{name:"keep",required:true}]]));
  assert.equal(await run(undefined, false), assembly);
  const result = await run(complete, true);
  assert.deepEqual(Array.from(result.sections), [complete, extra]);
  assert.deepEqual(Array.from(result.contexts), [assembly.contexts[0]]);
  assert.equal(result.tools, assembly.tools);
  ctx.waterfall = async () => { throw Error("provider failure"); };
  await assert.rejects(run(complete, false), /provider failure/);
  const events = [];
  const method = vm.runInNewContext('({' + prepare + '}).preStep', {
    __dshPurgePrepareAssemble: () => events.push("prepare"),
    assembleContextFor: () => ({}), renderContextSections: () => [], joinContextSections: () => "",
  });
  const agent = {phase:{kind:"running",abort:new AbortController()}, inbox:{claim:()=>[]},
    loopCtx:{systemPrompt:{assemble:async()=>{events.push("assemble");return assembly;}}},
    dispatch:{waterfall:async(_event,_args,next)=>next()},runtimeContext:{project:()=>undefined}};
  assert.equal((await method.call(agent,"next-turn",{turn:1})).assembly, assembly);
  assert.deepEqual(events, ["prepare","assemble"]);
});

test("0.2.2-rc.3 sandbox escalation: #13 still replaces the coded errors", () => {
  const rc3 = [
    '\tif (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) throw new SandboxEscalationError(`sandbox escalation to "${mode}" is not strictly wider than this call\'s current "${effectiveMode}" mode`, "SANDBOX_ESCALATION_INVALID_ARGUMENT");',
    '\tif (approval.approver === void 0) throw new SandboxEscalationError(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`, "SANDBOX_ESCALATION_UNAVAILABLE");',
    '\tif (approval.agent === void 0) throw new SandboxEscalationError(`sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`, "SANDBOX_ESCALATION_UNAVAILABLE");',
  ].join("\n");
  const out = applyReplacementsToText(rc3, patch(13));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes("[dsh-purge] escalation bypass"));
  assert.ok(!out.text.includes("SandboxEscalationError"));
  assert.equal(applyReplacementsToText(out.text, patch(13)).changed, false);
});

test("0.2.2-rc.2 minified inspector client: #96 drops only the oversized tree frame", () => {
  const minified = 'if(!this.stateFits()){if(previous===void 0)this.state.delete(topic);else this.state.set(topic,previous);throw new Error(`inspector: source state exceeds the source-frame byte limit`)}this.enqueue(record)';
  const out = applyReplacementsToText(minified, patch(96));
  assert.equal(out.changed, true);
  assert.ok(out.text.includes('[dsh-purge] discard oversized Cordis tree'));
  assert.ok(out.text.includes('if(topic===`cordis/tree`)return;'));
  const again = applyReplacementsToText(out.text, patch(96));
  assert.equal(again.changed, false);
  assert.equal(again.hitMismatch, undefined);
});
