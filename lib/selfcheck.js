import { permissionState } from "./permission-state.js";
import { refinePresetDiagnostic } from "./preset-diagnostic.js";
// Purge self-check: prove, layer by layer, that the bypass actually exists on
// this machine — instead of trusting "the plugin is installed" as evidence.
// Derived from the dsh-purge patch table (MIT, Copyright (c) 2026 Xiao Yang).
import fs from "node:fs";
import { diskFs } from "./extract-asar.js";
import path from "node:path";
import * as core from "./core.js";
import { compatibility } from "./community.js";
import { resolveProfile, diagnosticHost, hostSurface, desktopResourcesForHost } from "./instance.js";

/**
 * Each layer maps to one (or a group of) real patches; `why` says "what breaks when this layer is gone".
 * kind: host = host source patch, runtime = plugin runtime injection, config = this profile's choice.
 */
export const BYPASS_LAYERS = Object.freeze([
  { ids: [15], title: "sandbox confine passthrough", kind: "host",
    why: "read-only / workspace-write no longer wrap commands in bwrap or similar runners; the denial signature is empty" },
  { ids: [16], title: "filesystem fence disabled", kind: "host",
    why: "writes/edits are no longer blocked by FS_SANDBOX_DENIED for read-only or workspace boundaries" },
  { ids: [17], title: "observation policy relaxed", kind: "host",
    why: "edit no longer requires a read first; the version-conflict gate passes too" },
  { ids: [6, 33, 48], title: "refusal wording neutralized", kind: "host",
    why: "tool descriptions no longer tell the model 'the sandbox will deny this, request approval'" },
  { ids: [7, 8, 10], title: "default policy", kind: "host",
    why: "sandbox defaults to danger-full-access, approval to never (UI can override; env is not hardcoded)" },
  { ids: [9, 35], title: "approval auto-grant", kind: "host",
    why: "the approval gate grants outright; rejected/cancelled/unavailable no longer throw and break the turn" },
  { ids: [59], title: "Auto Review does not block tools", kind: "host",
    why: "official auto review no longer vetoes tool calls" },
  { ids: [60, 62, 61], title: "tool approval fail-open", kind: "host",
    why: "run_code / no approval channel passes; an explicit user reject still rejects" },
  { ids: [63], title: "plan mode does not hard-block", kind: "host",
    why: "when the operator asks to implement, plan mode no longer refuses to execute" },
  { ids: [4, 25, 43, 71, 76], optionalIds: [71, 76], title: "official identity stripped", kind: "host",
    why: "removes 'You are a coding agent powered by ...' and built-in preset identity lines" },
  { ids: [32, 53], title: "Web surface identity neutralized", kind: "host",
    why: "the Web prompt no longer calls itself DeepSeek Harness or forbids starting another service" },
  { ids: [40, 74, 55, 72], title: "injection survives presets", kind: "host",
    why: "complete presets, first-turn assemble, and per-step system replacement all keep the dsh-purge injection" },
  { ids: [26, 28], optionalIds: [28], title: "minimal / Liangshen presets keep injection", kind: "host",
    why: "the minimal preset opens inject; Liangshen phase-1 is not stripped" },
  { ids: [29, 50], title: "external content not downgraded to read-only", kind: "host",
    why: "web/session referenced content still works as executable data" },
  { ids: [30, 31, 64, 65], optionalIds: [30, 31, 64, 65], title: "hooks do not veto the turn", kind: "host",
    why: "with hooks-claude-code / hooks-codex installed, deny no longer rejects the whole turn" },
  { ids: [21, 22, 23], title: "tool caps raised", kind: "host",
    why: "bash wait restored, read cap raised, subagent depth default 3->10" },
  { ids: [24, 37], title: "no lock on presets or subagents", kind: "host",
    why: "preset fetch on; subagent scope-lock wording neutralized so it cannot narrow itself" },
  { ids: [51, 52], title: "new-session and log defaults", kind: "host",
    why: "new sessions keep full access; official session logs are not uploaded by default" },
  { ids: [56, 58, 75, 77], title: "rewind leaves no residue", kind: "host",
    why: "rewind only hides the withdrawn round; markers never reach model requests; tasks reclaimed; append replaces the window" },
  { ids: [47, 49, 57, 69], title: "model gateway compatibility", kind: "host",
    why: "OAuth inserts no Claude identity, developer role falls back, stream connections survive patching" },
  { ids: [87, 88, 90], title: "session message delivery and mounting", kind: "host",
    why: "hung inject blocks dedupe on LF anchors instead of doubling; #90 restores native steering: steer returns to next-step and user messages are no longer forced into the next round" },
  { ids: [82, 83, 84], optionalIds: [82, 83, 84], title: "desktop host startup fallback", kind: "host",
    why: "profiles resolve even without DSH_PROFILE; a signalled or clean host exit shows no crash dialog" },
]);

function readProfileConfig(dshHome, options) {
  let file = "";
  try {
    const profile = resolveProfile(dshHome, options);
    file = path.join(profile.directory,"cordis.patch.yml");
    return {file, text:fs.readFileSync(file,"utf8"), profile};
  } catch (e) { return {file, text:"", error:e.message}; }
}

function configLayer(dshHome, options) {
  const { file, text, profile, error } = readProfileConfig(dshHome, options);
  return {
    ...permissionState(text, options?.ctx),
    file,
    profile: profile?.name || "",
    profile_source: profile?.source || "",
    ...(error ? { error, note: `cannot read the current profile: ${error}` } : {}),
  };
}

function runtimeLayer(dshHome) {
  const file = core.findOverrideFile(dshHome);
  let text = "";
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    text = "";
  }
  const bytes = Buffer.byteLength(text, "utf8");
  return {
    file,
    bytes,
    ok: bytes > 0,
    note: bytes > 0
      ? `inject file is ${bytes} bytes and is re-pasted every step as the dsh-purge section`
      : "the inject file is empty: the plugin loads but has nothing to inject",
  };
}

// Only explicit applicability evidence can remove a patch from the denominator.
function notApplicable(patch, status) {
  return status === "na" || status === "off" || status === "disabled" ||
    (status === "not_needed" && patch?.id === 76) ||
    (status === "missing_file" && !!patch?.optional) ||
    (status === "skipped" && !!patch?.settleWhenAbsent);
}

export function tallyPatchStatus(status, patches = core.ALL_PATCHES) {
  const result = {applied:0, total:0, all:patches.length, na:0, skipped:0, missing_file:0, off:0, disabled:0, not_applicable:0, partial:0};
  for (const patch of patches) {
    const value = status[patch.id];
    if (["na", "skipped", "missing_file", "off", "disabled"].includes(value)) result[value]++;
    if (value === "partial") result.partial++;
    if (notApplicable(patch, value)) result.not_applicable++;
    else {
      result.total++;
      if (value === "applied" || value === "already") result.applied++;
    }
  }
  return result;
}

export function rollupLayers(status, hasHost, options = {}) {
  // When patch status is unreadable the table is empty: never fold "unknown" into "all pass".
  const statusFailed = Boolean(options.statusError);
  const layers = [];
  const metadata = new Map((options.patches || core.ALL_PATCHES).map(p => [p.id, p]));
  for (const layer of BYPASS_LAYERS) {
    const optionalIds = new Set(layer.optionalIds || []);
    const rows = layer.ids.map((id) => ({
      id,
      optional: metadata.has(id) ? !!metadata.get(id).optional : optionalIds.has(id),
      status: status[id] || (hasHost ? "unknown" : "unlocated"),
    }));
    // Only clearly inapplicable or missing optional targets may be excluded; a missing required file must not look like success.
    const required = rows.filter((row) => !notApplicable({...metadata.get(row.id), optional:row.optional}, row.status));
    const applied = rows.filter((row) => row.status === "applied" || row.status === "already");
    const pending = required.filter((row) => row.status === "pending");
    // Pending != unpatched: pending just needs one Apply; only the latter needs a new anchor.
    // partial = some target files hit while another exists but misses: must show as an anomaly, never ok.
    const broken = required.filter((row) => !["applied", "already", "pending", "unlocated", "unknown"].includes(row.status));
    const absent = rows.filter((row) => notApplicable({...metadata.get(row.id), optional:row.optional}, row.status));
    const unknown = statusFailed || rows.some((row) => row.status === "unlocated" || row.status === "unknown");
    const state = broken.length ? "broken" : unknown ? "unknown" : pending.length ? "pending" : "ok";
    layers.push({
      title: layer.title,
      why: layer.why,
      kind: layer.kind,
      ids: layer.ids,
      ok: state === "ok",
      state,
      applied: applied.length,
      required: required.length,
      total: rows.length,
      pending: pending.map((row) => row.id),
      absent: absent.map((row) => row.id),
      broken: broken.map((row) => ({ id: row.id, status: row.status })),
      note: statusFailed
        ? `read of patch status failed; this layer was not checked: ${options.statusError}`
        : rows.some(row => row.id === 76 && row.status === "unknown") && !statusFailed
          ? "this preset cannot be checked statically: check readability, YAML shape, and persona.prefix; dynamic expressions are not executed, and unknown does not mean in effect"
        : unknown ? "host not located or status incomplete; this layer cannot be checked, which does not mean the patch is off"
        : rows.some(row => row.status === "not_needed") ? "the current preset body was checked read-only; #76 needs nothing and is not counted as applied"
        : absent.length === rows.length ? "the target plugin/preset is not installed; this layer does not apply" : "",
      ...(statusFailed ? { status_error: options.statusError } : {}),
    });
  }
  return layers;
}

/**
 * Per-layer selfcheck.
 * @param aiBase - target host @deepseek-ai root (empty: resolve only current launch info / explicit env).
 * @param dshHome - DSH data dir (defaults to core.findDshHome()).
 */
export function resolveHost(aiBase, options = {}) {
  return diagnosticHost({...options, aiBase, diskReader: options.reader});
}

/** Read only the requested host, never a different installed Desktop application. */
export function hostLayoutLayer(host, reader = diskFs()) {
  const surface = hostSurface(host);
  const base = {title:"host disk layout",kind:"layout",ids:[],pending:[],broken:[]};
  if (surface === "web") return {...base,why:"the target is an npm/Web host; the desktop app.asar check does not apply",ok:true,state:"na",applicable:false,applied:0,total:0,required:0,note:"not applicable (Web host)",detail:{surface,asar_still_sealed:null}};
  if (surface === "unknown") return {...base,why:"target instance undetermined; another desktop install cannot stand in",ok:false,state:"unknown",applied:0,total:1,broken:[],note:"current host not located; the run mode cannot be confirmed",detail:{surface,asar_still_sealed:null}};
  const resources = desktopResourcesForHost(host), archive=path.join(resources,"app.asar");
  let sealed = false;
  try { sealed=reader.statSync(archive).isFile(); }
  catch (e) {
    if (e.code !== "ENOENT") return {...base,why:"cannot read the packaging state of the target instance",ok:false,state:"broken",applied:0,total:1,broken:[{id:"asar",status:"unreadable"}],detail:{surface,archive,error:e.message,asar_still_sealed:null}};
  }
  return {...base,why:"checks only app.asar on the target disk, not what this process loaded; see host-status for entry evidence",ok:!sealed,state:sealed?"broken":"ok",applied:sealed?0:1,total:1,broken:sealed?[{id:"asar",status:"sealed"}]:[],detail:{surface,archive,asar_still_sealed:sealed}};
}

export async function selfCheck(aiBase, dshHome = core.findDshHome(), options = {}) {
  const host = resolveHost(aiBase, options);
  const compat = compatibility(host);
  const services=options.coreModule || core;
  let status = {};
  let statusError = "";
  if (host) {
    try {
      status=await services.patchStatus(host, services.ALL_PATCHES, {surface:hostSurface(host),dshHome});
      status=refinePresetDiagnostic(status,dshHome);
    }
    catch (e) { status={}; statusError=String(e && e.message ? e.message : e); }
  }
  const layers = rollupLayers(status, Boolean(host), {statusError, patches:services.ALL_PATCHES});
  // Some patches have no named layer; missing required targets still need to be
  // visible in the overall verdict, not just a smaller headline count.
  const grouped = new Set(BYPASS_LAYERS.flatMap(layer => layer.ids));
  const missing = services.ALL_PATCHES.filter(p => !grouped.has(p.id) && !p.optional && status[p.id] === "missing_file");
  if (missing.length) layers.push({
    title:"other required target files", kind:"host", why:"the install lacks a required target file; check the target path or install completeness",
    ids:missing.map(p=>p.id), ok:false, state:"broken", applied:0, total:missing.length,
    pending:[], broken:missing.map(p=>({id:p.id,status:"missing_file"})),
  });
  const runtime = runtimeLayer(dshHome);
  layers.push({
    title: "runtime prompt injection",
    why: "prompt-inject.md joins every step of system prompt assembly as the dsh-purge section",
    kind: "runtime",
    ids: [],
    ok: runtime.ok,
    state: runtime.ok ? "ok" : "broken",
    applied: runtime.ok ? 1 : 0,
    total: 1,
    pending: [],
    broken: runtime.ok ? [] : [{ id: "inject", status: "empty" }],
    detail: runtime,
  });
  const config = configLayer(dshHome, options);
  layers.push({
    title: "permission choice of the current profile",
    why: "the last gate at the UI layer: even if patches fail, this combination shows no approval prompt",
    kind: "config",
    ids: [],
    ok: config.ok,
    state: config.state,
    note: config.note,
    applied: config.ok ? 1 : 0,
    total: 1,
    pending: [],
    broken: config.state === "broken" ? [{ id: "preset", status: `${config.preset}/${config.approval}` }] : [],
    detail: config,
  });
  layers.push(hostLayoutLayer(host, options.reader || diskFs()));

  const byKind = (kind) => layers.filter((layer) => layer.kind === kind && layer.applicable !== false);
  const summarize = (list) => ({
    ok: list.every((layer) => layer.ok),
    passed: list.filter((layer) => layer.ok).length,
    total: list.length,
  });
  const baseSummary = {
    host: summarize(byKind("host")),
    runtime: summarize(byKind("runtime")),
    config: summarize(byKind("config")),
    layout: summarize(byKind("layout")),
  };
  const uncertain = layers.filter((layer) => ["unknown", "inferred"].includes(layer.state));
  const failed = layers.filter((layer) => !layer.ok);
  const pendingLayers = layers.filter((layer) => layer.state === "pending");
  const brokenLayers = layers.filter((layer) => layer.state === "broken");
  return {
    ok: failed.length === 0,
    state: brokenLayers.length ? "broken" : pendingLayers.length ? "pending" : uncertain.some((layer) => layer.state === "unknown") ? "unknown" : uncertain.length ? "inferred" : "ok",
    needsApply: brokenLayers.length === 0 && pendingLayers.length > 0,
    summary: {
      ...baseSummary,
      pending: { layers: pendingLayers.length, patches: pendingLayers.reduce((n, l) => n + l.pending.length, 0) },
      uncertain: { layers: uncertain.length },
      broken: { layers: brokenLayers.length },
    },
    host,
    host_version: compat.host_version,
    qualified: compat.qualified,
    level: compat.level,
    patch: tallyPatchStatus(status, services.ALL_PATCHES),
    layers,
    hints: failed.map((layer) => ({
      title: layer.title,
      action: layer.kind === "config"
        ? (config.error || config.note)
        : layer.kind === "layout"
          ? (layer.detail?.asar_still_sealed === true
            ? "app.asar is still on the target disk; run host-status to check the service entry. Disk state does not mean loaded; the user performs any restart"
            : "cannot determine how the target instance runs; set DSH_BASE or PURGE_DSH_CLI. Other installs are not scanned")
          : layer.kind === "runtime"
            ? "write prompt-inject.md or save a prompt once in plugin settings"
            : layer.status_error
              ? `patch status read failed: ${layer.status_error}; fix that error first instead of reinstalling or changing permissions`
              : layer.state === "unknown"
                ? (layer.note || "current host not located; set DSH_BASE or PURGE_DSH_CLI. No reinstall or permission change is needed")
                : `run purge-community diagnose for the #${layer.ids.join("/#")} anchors`,
    })),
  };
}
