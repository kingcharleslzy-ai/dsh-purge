import { injectionPolicy, excludedPresetIds, withoutPurgeInjection, rememberPromptRewrite, requestInjectionContext } from "./preset-injection.js";
import { registerCommand } from "./command-registration.js";
import { createUpdateController, preferences, savePreferences, publicPreferences, updateEnv } from "./update-policy.js";
import { withUpdateEnvironment } from "./update-http.js";
import { scheduleDesktopHandoff } from "./desktop-handoff.js";
import { currentHost, hostSurface, resolveInstance } from "./instance.js";
import { cliRepairBlocksApply } from "./apply-gate.js";
import { Maintenance, compatibility, QUALIFIED_HOST_VERSIONS, REPOSITORY } from "./community.js";
import { isIP } from "node:net";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fsFor } from "./extract-asar.js";
import * as core from "./core.js";
import * as desktop from "./desktop.js";
import * as hostctl from "./host.js";
import * as rules from "./rules.js";
import * as skills from "./skills.js";
import * as updater from "./update.js";
import * as reapply from "./reapply.js";
import * as officialUpdate from "./official-update.js";
import {
  GLOBAL_PROMPT_ORDER,
  adaptInjectForMinimalPreset,
  isMnemonPluginMessage,
  isRedteamSession,
  installAssembleGuard,
  modePromptText,
  peelChatmlEnvelope,
  escapeDshInterpolation,
  rewritePromptAssembly,
} from "./identity.js";
import { capabilityProtocolText, CAPABILITY_SECTION } from "./capability-protocol.js";
import { installSubagentRoleCapture, resolveSubagentRoleText } from "./redteam/role-section.js";
import * as rewind from "./rewind.js";
import { streamWithRefusalRetry } from "./refusal-retry.js";
import * as continueRetry from "./continue-retry.js";
import * as uninstaller from "./uninstall.js";
import * as selfcheck from "./selfcheck.js";
import { BOOST_TEXT, readBoost, writeBoost } from "./boost.js";
import { readTuning, writeTuning } from "./tuning.js";
import { PROBE_SECTION, createProbe, probeText, readProbe } from "./probe.js";
import { logAudit, readAudit } from "./audit.js";
import { readDrillGrant, writeDrillGrant } from "./drill-grant.js";
import { readAllowText, writeAllowText } from "./net-scope.js";
import {
  applyShouldRestart,
  isInactiveContextError,
  settleDelayMs,
  settleMayReapply,
  settleMayRestart,
  watchContextLife,
} from "./settle-policy.js";

export const name = "dsh-purge-community";

// Never write pluginPackages into inject: Cordis waits on every key of the map.
// Portable copies and partial Hub installs often lack that service, so writing it means pending -> host exit 1.
export const inject = ["systemPrompt", "tools"];

let bootFullQuit = false;

const DEFAULTS = {
  enabled: true,
  excludePresets: [],
  autoApplyOnStart: false,
  autoUpdateOnStart: false,
  autoRevertOnMissing: false,
  injectOnce: false,
  stripMnemon: true,
  postPrompt: "",
  postPromptOrder: 5100,
  verbose: false,
  autoRetry: true,
  retryMax: 3,
  autoContinue: false,
  continueMax: 3,
  continueText: "continue",
  // Codex style: teach the model to discover skills / MCP; official registry and tool surface untouched.
  capabilityProtocol: true,
  hooksDenyBypass: true,
};

// Host sections all live in the -1000..10200 band: persona-prefix 0, tool sections
// 1000-3000, MCP 3100, TOOLS_SDK 5000, DELIVERABLE 9000, STRUCTURED_OUTPUT 9900,
// HARNESS_SOURCE 10000, WEB_SURFACE 10100, persona-suffix 10200.
// GLOBAL_PROMPT_ORDER is -100000 and only suits "very front"; any "tail" order needs an absolute
// value inside the host band, or GLOBAL_PROMPT_ORDER + n stays negative, sorts before persona,
// and becomes the first thing trimmed in long context.
const HOST_PERSONA_SUFFIX_ORDER = 10200;
const TAIL_PROMPT_ORDER = 10150; // after WEB_SURFACE, before persona-suffix
// Where the boost section goes: default 9500 (after DELIVERABLE, before STRUCTURED_OUTPUT).
// Override for A/B via env or {"order": -50000} in $DSH_HOME/dsh-purge/boost-order.json;
// the file is re-read on every section registration, so a new session picks it up with no restart.
// Measured (1.6.48, same 6 refusal-prone requests): front gave 0/6 first-turn refusals, 9500 gave 2/6,
// so the default is back to "front"; use env / boost-order.json when needed.
const DEFAULT_BOOST_ORDER = GLOBAL_PROMPT_ORDER + 50000;
function boostPromptOrder() {
  const fromEnv = Number(process.env.PURGE_BOOST_ORDER);
  if (Number.isFinite(fromEnv) && fromEnv !== 0) return fromEnv;
  try {
    const home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
    const raw = JSON.parse(fs.readFileSync(path.join(home, "dsh-purge", "boost-order.json"), "utf8"));
    const n = Number(raw?.order);
    if (Number.isFinite(n) && n !== 0) return n;
  } catch { /* no file or unreadable -> use default */ }
  return DEFAULT_BOOST_ORDER;
}

const log = (config, ...args) => {
  if (config?.verbose) console.log("[dsh-purge]", ...args);
};


function fsExists(fp) {
  const list = Array.isArray(fp) ? fp : [fp];
  return list.some((p) => {
    if (!p || typeof p !== "string") return false;
    try {
      return fsFor(p).existsSync(p);
    } catch {
      return false;
    }
  });
}

function line(title, value, ok = null) {
  const mark = ok === null ? "·" : ok ? "✓" : "✗";
  return `${mark} ${title}: ${value}`;
}

function renderStatus(state) {
  const out = [];
  out.push("dsh-purge status");
  out.push(line("surface", state.surface || hostctl.currentSurface()));
  out.push(line("DSH_HOME", state.dsh_home));
  if (state.desktop_install) out.push(line("desktop install", state.desktop_install));
  if (state.ai_base) {
    out.push(line("plugin root", state.ai_base));
    for (const [key, fp] of Object.entries(state.files)) {
      const list = Array.isArray(fp) ? fp : [fp];
      const shown = list.length <= 1 ? String(list[0] || "") : `${list[0]} (+${list.length - 1})`;
      out.push(`    ${fsExists(fp) ? "✓" : "✗"} ${key.padEnd(22)} ${shown}`);
    }
  } else {
    out.push(line("plugin root", core.missingAiBaseMessage(), false));
  }
  out.push(line("shim dir", state.shim_dir || "not found", !!state.shim_dir));
  if (state.desktop_runtimes?.length) {
    out.push(line("Desktop runtime", `${state.desktop_runtimes.length} sealed (shim OK; bak external)`, true));
    for (const d of state.desktop_runtimes) out.push(`    · ${d}`);
  }
  out.push(line("backup", state.has_backup ? "yes" : "no", state.has_backup));
  out.push(line("inject file", state.override_path));
  out.push(line("override status", state.override_status));
  if (state.asar_still_sealed) {
    out.push(line("app.asar", "archive exists on the target disk; this does not tell whether the running process loaded the directory", false));
  }
  if (state.host_layout) out.push(line("entry evidence", state.host_layout.note));
  out.push("");
  const displayRows = Array.isArray(state.display_patches)
    ? state.display_patches
    : core.groupPatchesForDisplay(core.ALL_PATCHES, state.patch_status || {});
  const displayTally = core.tallyDisplayPatches(displayRows);
  out.push(`patches: ${displayTally.applied}/${displayTally.total || 0} applied, ${displayTally.pending} pending`);
  for (const row of displayRows) {
    const s = row.status || "n/a";
    const mark = s === "applied" ? "✓" : s === "pending" ? "✗" : "·";
    const patch = core.ALL_PATCHES.find((item) => item.id === row.id);
    const label = patch ? patch.name : `patch-${row.id}`;
    const layer = patch ? `${patch.layer}/${patch.layer_en}` : row.layer || "";
    out.push(`  ${mark} [#${String(row.id).padEnd(2)}] ${label.padEnd(30)} ${layer} — ${s}`);
  }
  out.push("");
  out.push(`shim: dsh.cmd=${state.shim_cmd}  dsh.ps1=${state.shim_ps1}  dsh=${state.shim_bin}`);
  return out.join("\n");
}

function injectAllowedNow(config, context) {
  return injectionPolicy(config, context).allowed;
}

/** Prompt box edit > prompt-inject.md > encrypted default (see rules.resolveInjectText). */
// mtime throttle: 400ms setInterval + per pre-step + per preset-selected + per readInjectFallback
// fired hot enough to run disk sync + 3 hashOverride + 2 module assignments about 20 times a round.
// Reuse the last result in a short window: same home, same mtime, under 200ms since last -> return the cache.
let hungCache = { home: "", mtime: 0, at: 0, resolved: null };
const HUNG_CACHE_MS = 200;
function statInjectMtimeMs(home) {
  if (!home) return 0;
  try {
    return Math.floor(fs.statSync(core.findOverrideFile(home)).mtimeMs);
  } catch { return 0; }
}
function refreshHungOperator(dshHome = core.findDshHome()) {
  const home = core.pinDshHome() || dshHome || core.findDshHome();
  const now = Date.now();
  const mtimeBefore = statInjectMtimeMs(home);
  if (
    hungCache.resolved
    && hungCache.home === home
    && hungCache.mtime === mtimeBefore
    && now - hungCache.at < HUNG_CACHE_MS
  ) {
    return hungCache.resolved;
  }
  try { core.syncPromptInjectOnDiskSync(home); } catch { /* sync failed; resolve path still runs */ }
  const resolved = rules.resolveInjectText(home);
  // Fallback order: resolved.text > encrypted default > never empty (an empty second-turn fallbackInject leaks purge[]).
  const fallback = core.normalizeOverride(core.defaultOverrideText()) || "";
  // Box, disk, and encrypted slot stay as-is. What goes to the model only gets ChatML on its own line and missing closers added.
  const text = resolved.text || fallback;
  if (text) {
    core.hangOperatorPrompt(text);
    // Same pin as clicking Save: assembly reads this full text even without saving.
    core.rememberCommittedOverride(home, text);
  }
  const out = { ...resolved, text: text || resolved.text };
  // Cache under the post-sync mtime so the next poll hits directly when nothing outside touched the file.
  hungCache = { home, mtime: statInjectMtimeMs(home), at: now, resolved: out };
  return out;
}

export function installHungPromptGlobal(config = {}, isActive = () => true) {
  // Host-side inject fallback: the normal cordis assemble hook (rewriteLiveAssembly) is mutually exclusive with this path,
  // so no double injection; first install / preset switch / hung session / new-conversation first turn fall back here.
  // [v10 four-way fallback] If first-turn refreshHungOperator returns empty because the cache is not ready,
  // sync disk failed, or resolveInjectText came back empty, the host reads an empty inject and the model calls
  // itself "I am Claude". Four fallbacks keep an empty string from ever reaching the host:
  //   1) refreshHungOperator — full path (sync disk + resolve + pin)
  //   2) hungOperatorPrompt   — the in-memory pin from last time (process lifetime)
  //   3) readPromptInjectFileSync — read prompt-inject.md from disk, bypassing sync/resolve
  //   4) defaultOverrideText — decrypt the encrypted slot; non-empty unless the install is incomplete
  const fn = (context) => {
    if (!isActive()) return "";
    if (!injectAllowedNow(config, context)) return "";
    const norm = (s) => peelChatmlEnvelope(String(s || "").replace(/\r\n/g, "\n"));
    let home = "";
    try { home = core.findDshHome(); } catch { home = ""; }
    try {
      const text = norm(refreshHungOperator(home).text);
      if (text) { purgeLog("host.hungFn", { tier: "refresh", bytes: text.length }); return text; }
    } catch (e) { purgeLog("host.hungFn", { tier: "refresh", err: String(e?.message || e) }); }
    try {
      const hung = norm(core.hungOperatorPrompt());
      if (hung) { purgeLog("host.hungFn", { tier: "hung", bytes: hung.length }); return hung; }
    } catch (e) { purgeLog("host.hungFn", { tier: "hung", err: String(e?.message || e) }); }
    try {
      const disk = norm(core.readPromptInjectFileSync(home));
      if (disk) { purgeLog("host.hungFn", { tier: "disk", bytes: disk.length }); return disk; }
    } catch (e) { purgeLog("host.hungFn", { tier: "disk", err: String(e?.message || e) }); }
    try {
      const sealed = norm(core.defaultOverrideText());
      if (sealed) { purgeLog("host.hungFn", { tier: "sealed", bytes: sealed.length }); return sealed; }
    } catch (e) { purgeLog("host.hungFn", { tier: "sealed", err: String(e?.message || e) }); }
    purgeLog("host.hungFn", { tier: "empty", bytes: 0 });
    return "";
  };
  globalThis.__dshPurgeHungPrompt = fn;
  return fn;
}

// Always full text. Slicing tool steps at 6000 / .hung-disabled cuts HARD OUTPUT and guarantees a second-turn refusal.
function shouldInjectAssembly(context) {
  const decision = { mode: "full", taskKind: "general", lastRole: "full", isSubagent: false };
  try {
    decision.isSubagent = context?.agent?.session?.header?.origin === "subagent";
  } catch {}
  if (globalThis.__dshPurgeRetryPending) {
    globalThis.__dshPurgeRetryPending = false;
    decision.lastRole = "retry";
  }
  return decision;
}

function readSessionEvents(session) {
  if (!session) return [];
  try {
    if (typeof session.snapshotEvents === "function") return session.snapshotEvents() || [];
  } catch { /* ignore */ }
  try {
    if (Array.isArray(session.events)) return session.events;
  } catch { /* ignore */ }
  return [];
}

// [plan 2] Log probe. Writes to an internal file, never host stderr. Monitor with tail -F.
const PURGE_INTERNAL_LOG = path.join(os.tmpdir(), "dsh-purge-desktop.log");
// Log rotation: check size about every 1024 writes; past 2MB rename the current file to .1 over the old .1,
// and start fresh. Long sessions and hot reloads firing assemble decisions will not eat the tmp volume.
const PURGE_INTERNAL_LOG_MAX = 2 << 20;
let _purgeLogWriteCount = 0;
function rotatePurgeInternalLog() {
  try {
    const st = fs.statSync(PURGE_INTERNAL_LOG);
    if (st.size > PURGE_INTERNAL_LOG_MAX) {
      try { fs.renameSync(PURGE_INTERNAL_LOG, `${PURGE_INTERNAL_LOG}.1`); } catch { /* concurrent failure; retry next time */ }
    }
  } catch { /* file does not exist */ }
}
// One ISO timestamp + tag + k=v... per line. Easy to tail -F and grep.
// Spaces would split the kv pair, so they become _ to keep grep stable.
function purgeLog(tag, kv) {
  try {
    if ((++_purgeLogWriteCount & 0x3ff) === 0) rotatePurgeInternalLog();
    let line = `${new Date().toISOString()} [${tag}]`;
    if (kv) {
      for (const k of Object.keys(kv)) {
        const raw = kv[k];
        const v = raw === undefined || raw === null ? "" : String(raw).replace(/\s+/g, "_");
        line += ` ${k}=${v}`;
      }
    }
    fs.appendFileSync(PURGE_INTERNAL_LOG, line + "\n", "utf8");
  } catch {}
}
function logAssembleDecision(where, decision) {
  purgeLog(`assemble.${where}`, {
    mode: decision.mode,
    task: decision.taskKind,
    last: decision.lastRole,
    sub: decision.isSubagent,
  });
}

function injectSnapshot(dshHome = core.findDshHome()) {
  const resolved = rules.resolveInjectText(dshHome);
  return {
    injectSource: resolved.source,
    injectRuleId: resolved.ruleId,
    needPrompt: resolved.source === "none",
  };
}

/** Text currently in the box wins; when empty, resolveInjectText (which includes prompt-inject.md). */
function injectSnapshotFromBox(dshHome, boxText) {
  if (typeof boxText === "string" && core.normalizeOverride(boxText)) {
    return { injectSource: "prompt", injectRuleId: null, needPrompt: false };
  }
  const resolved = rules.resolveInjectText(dshHome);
  if (resolved.text) {
    return { injectSource: resolved.source, injectRuleId: null, needPrompt: false };
  }
  return { injectSource: "none", injectRuleId: null, needPrompt: true };
}

const NEED_PROMPT_ERROR = "prompt and rule set are both empty; add a prompt first";

function rejectIfNeedPrompt(dshHome, boxText) {
  const snap = injectSnapshotFromBox(dshHome, boxText);
  if (!snap.needPrompt) return null;
  return { ...snap, error: NEED_PROMPT_ERROR };
}

async function ensureRestartReady() {
  return core.ensureHostClean();
}

/** The prompt service's own ctx usually has no scope, so its section lands in the global layer; a scoped plugin's preset proxy cannot see that layer. */
function addPromptSection(ctx, section) {
  const hosts = [];
  const push = (host) => {
    if (host && !hosts.includes(host)) hosts.push(host);
  };
  try { push(ctx?.systemPrompt?.ctx); } catch { /* touching props on an uninjected proxy throws */ }
  push(ctx);
  const disposers = [];
  let registered = false;
  let lastError = null;
  for (const host of hosts) {
    try {
      const d = host.systemPrompt.section(section);
      registered = true;
      if (typeof d === "function") disposers.push(d);
    } catch (error) {
      const msg = String(error && error.message || error);
      if (msg.includes("already registered")) registered = true;
      else lastError = error;
    }
  }
  if (!registered && lastError) throw lastError;
  // Let ctx.effect tear the section down on reload / dispose; host.systemPrompt.section
  // usually returns no disposer today, so this only applies to implementations returning a function.
  if (disposers.length && typeof ctx?.effect === "function") {
    try {
      ctx.effect(() => () => {
        for (const d of disposers) {
          try { d(); } catch { /* ignore */ }
        }
      });
    } catch { /* dead ctx */ }
  }
}

export function registerPromptSections(ctx, config) {
  const injectText = (context) =>
    !injectAllowedNow(config, context)
      ? ""
      : escapeDshInterpolation(
          peelChatmlEnvelope(
            adaptInjectForMinimalPreset(readInjectFallback(context), context),
          ),
        );
  const tuning = readTuning();
  const injectPosition = tuning.injectPosition;
  // head: stable prefix, fewer tokens, cache friendly; tail: right at the output, least multi-turn decay; both: pin at both ends.
  if (injectPosition === "head" || injectPosition === "both") {
    addPromptSection(ctx, {
      name: "dsh-purge",
      order: GLOBAL_PROMPT_ORDER,
      interpolate: false,
      text: injectText,
    });
  }
  if (injectPosition === "tail" || injectPosition === "both") {
    addPromptSection(ctx, {
      name: "dsh-purge-tail",
      order: TAIL_PROMPT_ORDER,
      interpolate: false,
      text: injectText,
    });
  }
  if (injectPosition === "tail") {
    // In tail mode keep an empty head placeholder so the host or patches looking up dsh-purge by name still find it.
    addPromptSection(ctx, {
      name: "dsh-purge",
      order: GLOBAL_PROMPT_ORDER,
      interpolate: false,
      text: () => "",
    });
  }

  if (config.capabilityProtocol !== false) {
    addPromptSection(ctx, {
      name: CAPABILITY_SECTION,
      order: GLOBAL_PROMPT_ORDER + 1,
      interpolate: false,
      text: (context) => {
        if (!injectAllowedNow(config, context)) return "";
        const redteam = isRedteamSession(context);
        return capabilityProtocolText({
          redteam,
          redteamChild: redteam && context?.agent?.session?.header?.origin === "subagent",
          enabled: true,
        });
      },
    });
  }

  if (readBoost()) {
    // Tail boost section: an order far above normal sections keeps it last in long context.
    addPromptSection(ctx, {
      name: "dsh-purge-boost",
      order: boostPromptOrder(),
      interpolate: false,
      text: (context) => (injectAllowedNow(config, context) ? BOOST_TEXT : ""),
    });
  }

  // Runtime probe: mounted only while probe.json exists and is fresh; it disappears when it expires.
  addPromptSection(ctx, {
    name: PROBE_SECTION,
    order: GLOBAL_PROMPT_ORDER + 60000,
    interpolate: false,
    text: (context) => (injectAllowedNow(config, context) ? probeText() : ""),
  });

  const postPrompt = typeof config.postPrompt === "string" ? config.postPrompt.trim() : "";
  if (!postPrompt) return;
  if (!Number.isFinite(config.postPromptOrder) || config.postPromptOrder <= GLOBAL_PROMPT_ORDER) {
    // The old throw killed the whole apply; postPrompt is an extra section, so skipping it leaves core injection intact.
    console.warn(
      `[dsh-purge] postPromptOrder (${config.postPromptOrder}) must be a finite number > ${GLOBAL_PROMPT_ORDER}; skipping the postPrompt section`,
    );
    return;
  }
  addPromptSection(ctx, {
    name: "dsh-purge:post",
    order: config.postPromptOrder,
    text: (context) => (injectAllowedNow(config, context) ? postPrompt : ""),
  });
}

function readInjectFallback(context) {
  let home = "";
  try { home = core.findDshHome(); } catch { home = ""; }
  const refreshed = refreshHungOperator(home);
  let text = refreshed.text || "";
  let source = text ? "refresh" : "none";
  if (!text) {
    const fallback = rules.ensureOperatorBody(home);
    if (fallback) { text = fallback; source = "ensure"; }
  }
  if (!text) {
    purgeLog("inject.read", { source: "empty", bytes: 0 });
    return "";
  }
  let redteam = false;
  try { redteam = isRedteamSession(context); } catch { redteam = false; }
  let subagent = false;
  try { subagent = context?.agent?.session?.header?.origin === "subagent"; } catch {}
  const out = modePromptText(text, redteam);
  purgeLog("inject.read", {
    source,
    srcTag: refreshed.source || "n/a",
    redteam,
    sub: subagent,
    rawBytes: text.length,
    outBytes: out.length,
  });
  return out;
}

export function installMnemonMessageStrip(ctx, config = {}) {
  if (typeof ctx.on !== "function") return;
  if (ctx.__dshPurgeMnemonStrip) return;
  ctx.__dshPurgeMnemonStrip = true;
  const strip = config.stripMnemon !== false;
  const wrap = async (_payload, next) => {
    const decision = await next();
    // A rejection has no messages by contract. Preserve it exactly; never turn
    // malformed continuation data into a successful empty user turn.
    if (decision?.kind === "reject") return decision;
    if (!decision || typeof decision !== "object" || !Array.isArray(decision.messages)) {
      const error = new TypeError("agent/pre-step returned an invalid decision: messages must be an array; inspect the callback that returned it");
      error.code = "PURGE_INVALID_PRE_STEP_DECISION";
      throw error;
    }
    const incoming = decision.messages;
    const messages = strip ? incoming.filter((message) => !isMnemonPluginMessage(message)) : incoming;
    if (messages.length === incoming.length && Array.isArray(decision.messages)) return decision;
    return { ...decision, messages };
  };
  // With the old late() + queueMicrotask(late) + setTimeout(late, 1500) triple, all three landed and
  // the same wrap stacked 3 deep on the agent/pre-step waterfall, filtering the decision 3 times a turn.
  // A mounted latch here: after the first successful mount there is no retry, and the disposer goes to ctx.effect.
  let mounted = false;
  let dispose = null;
  const late = () => {
    if (mounted) return;
    try {
      const d = ctx.on("agent/pre-step", wrap, { global: true, prepend: true });
      mounted = true;
      if (typeof d === "function") dispose = d;
    } catch { /* retry next time */ }
  };
  late();
  if (!mounted) queueMicrotask(late);
  let retryTimer = null;
  if (!mounted) {
    retryTimer = setTimeout(late, 1500);
    if (typeof retryTimer.unref === "function") retryTimer.unref();
  }
  try {
    ctx.effect(() => () => {
      if (retryTimer) clearTimeout(retryTimer);
      try { dispose?.(); } catch { /* ignore */ }
    });
  } catch { /* no effect on a dead ctx; the next apply overwrites */ }
}

export function rewriteLiveAssembly(config, assembled, context, decision = { mode: "full", taskKind: "general" }) {
  const selection = injectionPolicy(config, context);
  const scoped = excludedPresetIds(config).length > 0;
  if (!selection.allowed && scoped) {
    purgeLog("assemble.excluded", { preset: selection.preset, excluded: selection.excluded, unknown: selection.unknown, policy: "always", injectBytes: 0 });
    return withoutPurgeInjection(assembled);
  }
  if (scoped) assembled = withoutPurgeInjection(assembled, { keepPluginSections: true });
  const enabled = config.enabled !== false;
  const redteam = enabled && isRedteamSession(context);
  const full = enabled ? readInjectFallback(context) : "";
  const dshHome = enabled ? core.findDshHome() : "";
  let cwd = "";
  try { cwd = String(context?.agent?.session?.header?.cwd || "").trim(); } catch { /* ignore */ }
  if (dshHome && cwd) {
    try { rules.writeLastCwd(dshHome, cwd); } catch { /* ignore */ }
  }
  const policy = enabled && dshHome ? rules.readWorkspacePolicy(dshHome) : "always";
  // Only with an empty prompt box do checked local cwd rules act as fallback, to avoid stacking on prompt-inject.md.
  let localInject = "";
  if (enabled && dshHome && !String(full || "").trim()) {
    try { localInject = rules.readSelectedCwdInject(dshHome, cwd); } catch { /* ignore */ }
  }
  const effectiveFull = String(full || "").trim() ? full : localInject;
  const inject = effectiveFull;
  const anchorApplied = false;
  const hasInject = Boolean(String(inject || "").trim());
  let dropWorkspaceBaseline = false;
  if (enabled) {
    if (policy === "strict") dropWorkspaceBaseline = true;
    else if (policy === "fallback") dropWorkspaceBaseline = hasInject;
    else dropWorkspaceBaseline = false;
  }
  const roleText = redteam ? resolveSubagentRoleText(context) : "";
  const rewritten = rewritePromptAssembly(assembled, {
    fallbackInject: inject,
    dropMnemon: config.stripMnemon !== false,
    dropPurgeAfterFold: false,
    capabilityProtocol: config.capabilityProtocol !== false,
    context,
    roleText,
    dropWorkspaceBaseline,
  });
  const closerFollow = closerFollowBytes(rewritten?.sections);
  purgeLog("assemble.rewrite", {
    enabled,
    redteam,
    mode: decision?.mode || "full",
    task: decision?.taskKind || "general",
    last: decision?.lastRole || "unknown",
    fullBytes: full.length,
    localBytes: localInject.length,
    injectBytes: inject.length,
    anchorApplied,
    roleBytes: roleText.length,
    cap: config.capabilityProtocol !== false,
    strip: config.stripMnemon !== false,
    policy,
    dropWorkspaceBaseline,
    injectHead: Array.isArray(rewritten?.sections) && rewritten.sections[0]?.name === "dsh-purge",
    chatml: Array.isArray(rewritten?.sections) && /<project_instructions>|<\|im_start\|>/i.test(String(rewritten.sections[0]?.text || "")),
    afterCloser: closerFollow,
    cwd,
  });
  return scoped ? rememberPromptRewrite(assembled, rewritten) : rewritten;
}

function closerFollowBytes(sections) {
  const closer = "</project_instructions>";
  const joined = (Array.isArray(sections) ? sections : [])
    .map((section) => (typeof section?.text === "string" ? section.text : ""))
    .filter(Boolean)
    .join("\n\n");
  const at = joined.lastIndexOf(closer);
  if (at < 0) return -1;
  return joined.length - (at + closer.length);
}

/** If the registry already computed a rev for the old file, rebuild now so the page's url matches the cache (#63). */
function publishClientBundleRevs(ctx, packageNames) {
  if (!Array.isArray(packageNames) || packageNames.length === 0) return;
  let mods = null;
  try {
    mods = ctx?.get?.("clientModules", false);
  } catch {
    mods = null;
  }
  if (!mods || typeof mods.rebuilt !== "function") return;
  for (const id of packageNames) {
    try { mods.rebuilt(id); } catch { /* package not in the registry yet; the next snapshot reads the new file */ }
  }
}

function installCwdCapture(ctx) {
  if (!ctx || ctx.__dshPurgeCwdCapture) return;
  if (typeof ctx.on !== "function") return;
  ctx.__dshPurgeCwdCapture = true;
  const home = core.findDshHome();
  let lastWritten = "";
  const flush = (session) => {
    try {
      const cwd = String(session?.header?.cwd || "").trim();
      if (!cwd || !home || cwd === lastWritten) return;
      rules.writeLastCwd(home, cwd);
      lastWritten = cwd;
    } catch { /* ignore */ }
  };
  try {
    const store = ctx.get?.("sessions");
    const all = typeof store?.all === "function" ? store.all()
      : typeof store?.list === "function" ? store.list()
      : [];
    for (const session of all || []) flush(session);
  } catch { /* ignore */ }
  ctx.effect(() => {
    const disposers = [];
    try { disposers.push(ctx.on("session/created", flush)); } catch { /* ignore */ }
    try { disposers.push(ctx.on("session/event", (session) => flush(session))); } catch { /* ignore */ }
    return () => {
      for (const d of disposers) {
        try { if (typeof d === "function") d(); } catch { /* ignore */ }
      }
      delete ctx.__dshPurgeCwdCapture;
    };
  });
}

function installRewindDeriveFilter(ctx) {
  if (!ctx || ctx.__dshPurgeRewindDerive) return;
  ctx.__dshPurgeRewindDerive = true;
  const wrapOne = (session) => {
    try { rewind.wrapSessionDeriveMessages(session); } catch { /* ignore */ }
  };
  try {
    const store = ctx.get?.("sessions");
    const all = typeof store?.all === "function" ? store.all()
      : typeof store?.list === "function" ? store.list()
      : [];
    for (const session of all || []) wrapOne(session);
  } catch { /* ignore */ }
  ctx.effect(() => {
    let disposer = null;
    try { disposer = ctx.on("session/created", (session) => wrapOne(session)); } catch { /* ignore */ }
    return () => {
      try { if (typeof disposer === "function") disposer(); } catch { /* ignore */ }
      delete ctx.__dshPurgeRewindDerive;
    };
  });
}

export function installIdentityOverride(ctx, config = {}) {
  if (typeof ctx.on !== "function") return;
  let active = true;
  installSubagentRoleCapture(ctx);
  // installAssembleGuard is idempotent: an already-wrapped prompt only refreshes rewriteFn,
  // it never returns a new dispose. The old version pushed a noop closure into a Set every 400ms + per pre-step,
  // piling up tens of thousands in a 2-hour session. Now only the first real disposer is tracked.
  const wrapDisposers = new Set();
  const wrappedPrompts = new WeakSet();
  const trackDisposer = (d, prompt) => {
    if (typeof d !== "function") return d;
    if (prompt) {
      if (wrappedPrompts.has(prompt)) return d;
      wrappedPrompts.add(prompt);
    }
    wrapDisposers.add(d);
    return d;
  };
  const rewriteFn = (assembled, context) => {
    if (!active) return assembled;
    // [plan 2] installAssembleGuard takes this path too, with the same full/anchor decision.
    const decision = shouldInjectAssembly(context);
    logAssembleDecision("rewriteFn", decision);
    return rewriteLiveAssembly(config, assembled, context, decision);
  };
  // The interval heartbeat runs every 400ms with stable inputs; it logs only on state flips or errors,
  // so a million guard.wrap lines a day cannot blow past a 7MB log and drown the real events.
  let lastGuardSig = "";
  const wrapAssemble = (caller = "unknown") => {
    if (!active) return false;
    try {
      const prompt = ctx.systemPrompt;
      const d = installAssembleGuard(prompt, rewriteFn);
      const mounted = typeof d === "function";
      const tracked = trackDisposer(d, prompt);
      const sig = `${!!prompt}|${mounted}`;
      if (sig !== lastGuardSig) {
        purgeLog("guard.wrap", { caller, prompt: !!prompt, mounted });
        lastGuardSig = sig;
      }
      return tracked;
    } catch (e) {
      purgeLog("guard.wrap", { caller, err: String(e?.message || e) });
      lastGuardSig = "";
      return false;
    }
  };
  if (!ctx.__dshPurgeAssembleHook) {
    ctx.__dshPurgeAssembleHook = true;
    // cordis waterfall signatures vary: (assembly, context) or (assembly, context, next):
    // The old code took position 3 as `next`, so an older host got context as next and await next() threw at once.
    // The disposer stays out of wrapDisposers: ctx.effect cleanup fires on child-scope end and preset switch,
    // so collecting it would unbind early and never remount. On a real cordis dispose the listener dies with ctx.
    try {
      ctx.on("system-prompt/assemble", async (...args) => {
        const [assembly, context] = args;
        const next = args.length >= 3 ? args[args.length - 1] : null;
        // Record on entry — proves the request reached our handler; hasNext=false means cordis
        // used the old signature and the downstream waterfall relies on the assembled we return.
        let eventsLen = 0;
        try { eventsLen = readSessionEvents(context?.agent?.session).length; } catch {}
        purgeLog("assemble.entry", {
          hasNext: typeof next === "function",
          sections: Array.isArray(assembly?.sections) ? assembly.sections.length : -1,
          events: eventsLen,
        });
        let assembled = assembly;
        if (typeof next === "function") {
          try {
            assembled = await next();
          } catch (err) {
            // A failed preset/provider must stay failed. Falling back to the
            // earlier assembly can silently send stale or incomplete instructions.
            try { console.warn("[dsh-purge] system-prompt/assemble waterfall rejected:", err?.message || err); } catch {}
            purgeLog("assemble.waterfall", { err: String(err?.message || err) });
            throw err;
          }
        }
        if (!active) return assembled;
        try {
          // [v10] The event handler refreshes up front: first-turn hungCache may be null and
          // installAssembleGuard may not have wrapped systemPrompt yet, so pinned/disk is forced warm here
          // so readInjectFallback -> refreshHungOperator hits a warm cache instead of the empty path.
          try { refreshHungOperator(core.findDshHome()); } catch { /* resolve errors do not block */ }
          const decision = shouldInjectAssembly(context);
          logAssembleDecision("event", decision);
          return rewriteLiveAssembly(config, assembled, context, decision);
        } catch (err) {
          try { console.warn("[dsh-purge] rewriteLiveAssembly failed:", err?.message || err); } catch {}
          purgeLog("assemble.rewriteFail", { err: String(err?.message || err) });
          return assembled;
        }
      }, { global: true, prepend: true });
    } catch { /* old ctx.on signature throws; next apply covers it */ }
  }
  // Switching presets swaps assemble. The pre-step waterfall runs after assemble, so the first send misses it.
  // The host calls this before assemble, so the current mode's own systemPrompt is used.
  const prepareAssemble = (loopCtx) => {
    if (!active) return null;
    try { refreshHungOperator(core.findDshHome()); } catch { /* no prompt in the home dir yet */ }
    // loopCtx may be a host Proxy that throws on .systemPrompt itself (service not injected yet).
    let prompt = null;
    try { prompt = loopCtx && loopCtx.systemPrompt; } catch { prompt = null; }
    if (prompt) {
      try {
        trackDisposer(installAssembleGuard(prompt, rewriteFn), prompt);
      } catch { /* when this proxy layer cannot be wrapped, the plugin's own layer is wrapped below */ }
    }
    try {
      const iso = (loopCtx && loopCtx.ctx) || loopCtx;
      if (iso && iso !== ctx) registerPromptSections(iso, config);
    } catch { /* the isolated layer has no systemPrompt yet */ }
    wrapAssemble("prepareAssemble");
    return prompt || null;
  };
  globalThis.__dshPurgePrepareAssemble = prepareAssemble;
  const hungFn = installHungPromptGlobal(config, () => active);
  // complete:true overwrites sections after the waterfall; wrap the assemble return so injection is restored each turn.
  wrapAssemble("init");
  // The guard must remount whenever cordis swaps the systemPrompt proxy (in-session preset switch, subagent fork,
  // live-mount). The old clearInterval after 20s missed later proxy swaps -> second-turn inject used native
  // assemble -> the host trims to the token budget -> the user sees "only part was captured". installAssembleGuard is idempotent
  // (wrappedPrompts WeakSet + object identity check), so running every 400ms until ctx dispose costs nothing.
  // 400ms rollback: a 2000ms window can let the first new-conversation assemble run before the hook mounts, collapsing inject.
  // Idempotent-wrap CPU cost is nothing next to "new conversations lose injection".
  const timer = setInterval(() => wrapAssemble("interval"), 400);
  if (typeof timer.unref === "function") timer.unref();
  // The three ctx.on below need the flag: if installIdentityOverride applies twice on one ctx
  // (remount after dispose / hot reload), listeners stack, inject runs N times and wraps stack N deep.
  if (!ctx.__dshPurgeSessionHook) {
    ctx.__dshPurgeSessionHook = true;
    try {
      ctx.on("session/created", () => {
        try { refreshHungOperator(core.findDshHome()); } catch { /* no prompt in the home dir yet */ }
        wrapAssemble("sessionCreated");
      });
    } catch { /* ignore */ }
  }
  if (!ctx.__dshPurgePresetHook) {
    ctx.__dshPurgePresetHook = true;
    try {
      ctx.on("agent-preset/selected", () => {
        try { refreshHungOperator(core.findDshHome()); } catch { /* no prompt in the home dir yet */ }
        wrapAssemble("presetSelected");
      }, { global: true });
    } catch { /* ignore */ }
  }
  if (!ctx.__dshPurgePreStepHook) {
    ctx.__dshPurgePreStepHook = true;
    try {
      ctx.on("agent/pre-step", (payload, next) => {
        wrapAssemble("preStep");
        return typeof next === "function" ? next() : payload;
      }, { global: true, prepend: true });
    } catch { /* ignore */ }
  }
  // Reclaim everything together on hot reload/uninstall: poll timers, the guard proxy layer, globals exposed to the agent loop,
  // all swept in one effect so the next apply does not bind another layer and write repeatedly.
  try {
    ctx.effect(() => () => {
      active = false;
      clearInterval(timer);
      if (globalThis.__dshPurgePrepareAssemble === prepareAssemble) delete globalThis.__dshPurgePrepareAssemble;
      if (globalThis.__dshPurgeHungPrompt === hungFn) delete globalThis.__dshPurgeHungPrompt;
      for (const d of wrapDisposers) {
        try { d(); } catch { /* ignore */ }
      }
      wrapDisposers.clear();
      // Clear the flag so the next apply may remount listeners; otherwise a reused ctx stays silent.
      delete ctx.__dshPurgeSessionHook;
      delete ctx.__dshPurgePresetHook;
      delete ctx.__dshPurgePreStepHook;
      // [v10] AssembleHook must be cleared too. The old code missed it, so a reused ctx saw flag=true, skipped
      // ctx.on("system-prompt/assemble", ...), never installed the cordis listener, and the first new-conversation turn
      // relied on the 400ms wrapAssemble guard and lost inject whenever the window was missed.
      delete ctx.__dshPurgeAssembleHook;
      // Only remove callbacks owned by this scope; a newer plugin instance keeps its hooks.
    });
  } catch { /* without an effect, unref plus the next apply overwrite it */ }
}

function shimNeedsPatch(state) {
  if (hostctl.currentSurface() === "desktop") return false;
  return (
    state.shim_cmd === "original" ||
    state.shim_ps1 === "original" ||
    state.shim_bin === "original"
  );
}

function currentSettleScope() {
  let sealed = false;
  try { sealed = core.desktopAsarStillSealed(); } catch { /* not desktop, or install dir not located */ }
  return { surface: hostctl.currentSurface(), sealed };
}

async function settleInstalledPatches(config, ctx, life) {
  if (life && !life.alive) return "skip:inactive";
  try { core.rememberUnpackedArchive(); } catch { /* no official install dir means no archive to record */ }
  try {
    reapply.ensureInstalledRevSeed();
  } catch (e) {
    log(config, "seed installed-rev failed:", String(e && e.message ? e.message : e));
  }
  try {
    if (reapply.healEmptyAppliedStamp()) log(config, "healed empty applied stamp");
  } catch (e) {
    log(config, "heal applied stamp failed:", String(e && e.message ? e.message : e));
  }

  if (config.autoApplyOnStart !== true) {
    try {
      if (await reapply.patchesMatchInstallStrict() || await reapply.hostCleanEnoughToKeep()) {
        reapply.markPatchesApplied();
        log(config, "boot: host files left untouched; stamp kept");
        return "boot:host-untouched";
      }
    } catch { /* a missing stamp is fine; the user's Apply will set it */ }
    log(config, "boot: skip host writes (Apply once)");
    return "skip:boot-no-host-write";
  }

  const scope = currentSettleScope();
  if (!(await reapply.patchesMatchInstallStrict())) {
    if (!settleMayReapply(scope)) {
      log(config, "sealed desktop: skip startup reapply (wait for Apply)");
      return "skip:sealed-wait-apply";
    }
    if (await reapply.hostCleanEnoughToKeep()) {
      reapply.markPatchesApplied();
      log(config, "host already clean; kept patches and refreshed stamp");
      return "already-clean";
    }
    if (officialUpdate.upgradeMarkerExists(process.execPath)) {
      const upgraded = await reapply.reapplyInstalled({ scheduleSwap: false, upgrade: true });
      if (life && !life.alive) return "skip:inactive";
      if (!upgraded.ok) {
        log(config, "official upgrade reapply failed:", upgraded.error || "");
        return "reapply-failed";
      }
      officialUpdate.clearUpgradeMarker(process.execPath);
      officialUpdate.clearStaleExtractedApps(process.execPath);
      if (!settleMayRestart(currentSettleScope()) || reapply.shouldSkipSettleRestart()) {
        if (upgraded.needsFullQuit) bootFullQuit = true;
        log(config, "official upgrade reapplied; skip settle restart");
        return "reapplied-no-restart";
      }
      reapply.markSettleRestart();
      log(config, "official upgrade reapplied; restarting onto the new build");
      // ctx may be disposed during reapply.reapplyInstalled's await; recheck before restarting.
      if (life && !life.alive) return "skip:inactive";
      try {
        hostctl.scheduleRestart(null, ctx, { openBrowser: false });
      } catch (e) {
        log(config, "restart after official upgrade failed:", String(e && e.message ? e.message : e));
        return "restart-failed";
      }
      return "restarting";
    }

    // Startup self-heal writes to disk only: no asar swap, no process kill, which would hit Host Fiber._reload with INACTIVE_EFFECT.
    const result = await reapply.reapplyInstalled({ scheduleSwap: false });
    if (life && !life.alive) return "skip:inactive";
    if (!result.ok) {
      log(config, "reapply failed:", result.error || "");
      return "reapply-failed";
    }
    // After a successful reapply force a non-empty stamp so the clean path cannot leave it blank and spin (#59/#60).
    try { reapply.markPatchesApplied(); } catch { /* ignore */ }
    if (result.needsFullQuit) {
      bootFullQuit = true;
      log(config, "reapply wrote patches; official host needs a full quit");
      return "full-quit";
    }
    if (!settleMayRestart(currentSettleScope())) {
      log(config, "reapply wrote patches; desktop settle does not restart");
      return "reapplied-no-restart";
    }
    if (reapply.shouldSkipSettleRestart()) {
      log(config, "reapply wrote patches; skip settle restart (cooldown)");
      return "reapplied-no-restart";
    }
    // No restart once aligned; restart once only while stamp/host still disagree.
    if (await reapply.patchesMatchInstallStrict()) {
      log(config, "reapply wrote patches; already aligned, no restart");
      return "reapplied";
    }
    reapply.markSettleRestart();
    log(config, "reapply wrote patches; restarting");
    // reapplyInstalled awaits; recheck life before restarting so scheduleRestart never runs on a disposed ctx.
    if (life && !life.alive) return "skip:inactive";
    try {
      // web: a self-heal restart opens no browser, and closing the window must not keep spawning new ones (#59/#61).
      hostctl.scheduleRestart(null, ctx, { openBrowser: false });
    } catch (e) {
      log(config, "restart after reapply failed:", String(e && e.message ? e.message : e));
      return "restart-failed";
    }
    return "restarting";
  }

  return autoApply(config);
}

async function autoApply(config) {
  try {
    core.applyRuntimeEnv();
    const sanitized = core.sanitizeDesktopCommandRuntimes();
    if (sanitized.length) log(config, "desktop runtime sanitized:", JSON.stringify(sanitized));

    core.refreshHooksDenySettings();
    if (core.getHooksDenySettings().hooksDenyBypass === false) {
      const restored = await core.restoreHookDenyForBases(core.enumeratePatchAiBases());
      if (restored.failed.length) {
        log(config, "hooks-deny restore leftover:", restored.failed.join(","));
      }
    }

    const state = await core.gatherState();
    if (!state.ai_base) {
      log(config, "skip auto-apply: plugin root not found");
      return "skip:plugin_root_not_found";
    }
    try {
      const flash = core.silenceCmdFlash(state.ai_base);
      log(config, "cmd-flash:", JSON.stringify(flash));
      if (!flash.ok) log(config, "cmd-flash incomplete:", flash.entry);
    } catch (e) {
      log(config, "cmd-flash failed:", String(e));
    }

    if (state.patches_pending === 0) {
      if (config.autoApplyOnStart && shimNeedsPatch(state)) {
        await core.patchAllShims();
        core.silenceCmdFlash(state.ai_base);
        log(config, "auto-apply: patches clean, shim refreshed");
        return "already_clean:shim_patched";
      }
      log(config, "auto-apply: already clean");
      return "already_clean";
    }
    if (!config.autoApplyOnStart) {
      log(config, "auto-apply disabled");
      return "disabled";
    }
    const autoMulti = await core.applyPatchesAllHosts(core.ALL_PATCHES, { preserveClientBundles: true });
    await core.patchAllShims();
    const report = autoMulti.report;
    const flash = core.silenceCmdFlash(autoMulti.hosts[0]?.aiBase || state.ai_base);
    const applied = report.filter((r) => r.status === "applied").length;
    log(config, `auto-apply done: ${applied} applied; cmd-flash=${flash.entry} ok=${flash.ok}`);
    return flash.ok ? `applied:${applied}` : `applied:${applied}:cmd_flash_incomplete`;
  } catch (e) {
    console.warn("[dsh-purge] auto-apply error:", String(e));
    return `error:${e}`;
  }
}

/** The restart after Apply. A sealed package quits and reopens instead of waiting for the user. */
function scheduleApplyRestart(shouldRestart, ctx = null) {
  if (!shouldRestart) return { restarting: false };
  if (core.desktopAsarStillSealed()) {
    // Pass ctx to the core so a sealed-package restart can use PowerShell to kill Electron + requestRestart
    // as a backup path and stop the "host stopped" crash dialog (#64).
    const planned = core.restartSealedDesktopIfNeeded({ ctx });
    return {
      ...(planned || {}),
      restarting: Boolean(planned && (planned.restarting || planned.asarSwap)),
    };
  }
  // issue #19: this surface cannot see the archive (typical when Apply comes from the Web GUI panel),
  // yet the desktop install is still sealed in app.asar. The old code did a plain restart and never moved it.
  const foreign = core.sealedDesktopHandoffAnySurface();
  const desktopPid = foreign?.asar ? desktop.runningDesktopPid(foreign.exe) : 0;
  const decision = core.planApplyRestartAction({ foreign, desktopPid });
  if (decision.action === "swap-foreign") {
    try {
      desktop.scheduleAsarSwapRestart({
        exe: foreign.exe,
        asar: foreign.asar,
        waitPid: decision.waitPid,
        exit: true,
        ctx,
      });
      return {
        restarting: true,
        asarSwap: true,
        crossSurface: true,
        note: "Desktop host asked to swap: it quits, renames app.asar, then reopens.",
      };
    } catch (error) {
      return { restarting: false, crossSurface: true, error: String(error && error.message ? error.message : error) };
    }
  }
  if (decision.action === "manual") {
    return {
      restarting: false,
      asarSwap: false,
      needsDesktopApply: true,
      note: "Patches are on disk but the desktop host is not running, so the swap cannot follow its exit. Open the desktop app and click Apply again there.",
    };
  }
  try {
    const planned = hostctl.scheduleRestart(null, ctx);
    if (planned && (planned.restarting === false || planned.clean === false)) return planned;
    return planned || { restarting: true };
  } catch (error) {
    return { restarting: false, error: String(error && error.message ? error.message : error) };
  }
}

async function handlePurgeCommand(rawInput, config, ctx = null) {
  const args = (rawInput || "").trim().split(/\s+/).filter(Boolean);
  const sub = (args[0] || "status").toLowerCase();

  switch (sub) {
    case "status":
    case "s": {
      const state = await core.gatherState();
      return { kind: "success", text: renderStatus(state) };
    }
    case "apply":
    case "a": {
      core.applyRuntimeEnv();
      core.clearDesktopLocateCache();
      const home = core.pinDshHome();
      const scrubbed = core.sanitizeDesktopCommandRuntimes();
      const state = await core.gatherState();
      if (home) state.dsh_home = home;
      let located;
      try {
        located = await core.resolveOfficialAiBase(state.ai_base, { forApply: true });
      } catch (e) {
        return { kind: "error", text: String(e && e.message ? e.message : e) };
      }
      if (!located.aiBase) return { kind: "error", text: core.missingAiBaseMessage() };
      state.ai_base = located.aiBase;
      if (located.extracted && located.handoff?.archive) {
        core.writeUnpackedAsarStamp(located.handoff.archive);
      }
      const blocked = rejectIfNeedPrompt(state.dsh_home);
      if (blocked) return { kind: "error", text: blocked.error };
      const applyMulti = await core.applyPatchesAllHosts(core.ALL_PATCHES, {
        preserveClientBundles: false,
        forApply: true,
      });
      const report = applyMulti.report;
      const shimResult = await core.patchAllShims();
      const flash = core.silenceCmdFlash(applyMulti.hosts[0]?.aiBase || state.ai_base);
      const lines = [];
      for (const h of applyMulti.hosts) lines.push(`  host -> ${h.aiBase}`);
      lines.push(...report.map((r) => {
        const m = r.status === "applied" ? "✓ cleaned" : r.status === "already" ? "- already current" : r.status === "missing_file" ? "⚠ file missing" : `✗ ${r.status}`;
        return `  ${m} patch #${String(r.patch_id).padEnd(2)} ${r.name}`;
      }));
      lines.push("", "shim:");
      for (const [dir, st] of Object.entries(shimResult)) {
        lines.push(`  · ${dir} → ${typeof st === "object" ? JSON.stringify(st) : st}`);
      }
      lines.push(`  cmd-flash=${flash.entry} phase-1=${flash.phase1} ok=${flash.ok}`);
      if (scrubbed.length) {
        lines.push("", "Desktop in-bin .bak scrub:");
        for (const row of scrubbed) lines.push(`  ✓ ${row.dir} → ${row.cleaned.join(", ")}`);
      }
      lines.push("Desktop: sealed host-commands dirs are cleaned only, never injected; bak must not be written into bin (issue #9).");
      const summary = core.summarizeApplyReport(report);
      const hostWritten = core.allPatchHostsWritten(applyMulti.hosts) || core.hostCleanMarkersPresent(state.ai_base);
      const hookDenyRestoreFailed = (applyMulti.hookDenyRestoreFailed || []).length > 0;
      const complete = summary.failed.length === 0 && flash.ok === true && hostWritten && !hookDenyRestoreFailed;
      const promptReady = summary.failed.length > 0 && summary.failed.every((item) => item.status === "pattern_not_found");
      const shouldRestart = applyShouldRestart({
        complete: complete || (promptReady && hostWritten),
        sealed: core.desktopAsarStillSealed(),
        appliedCount: summary.applied,
        promptReady: promptReady && hostWritten,
      });
      if (shouldRestart) reapply.markSettleRestart();
      try { core.seedPromptInjectAtBoot(state.dsh_home); } catch { /* home dir not ready yet */ }
      try { refreshHungOperator(state.dsh_home); } catch { /* ignore */ }
      const planned = scheduleApplyRestart(shouldRestart, ctx);
      if (planned && planned.clean === false) {
        lines.push("", "Cleanup did not reach the running host; restart cancelled.");
      } else if (planned && planned.restarting === false && planned.error) {
        lines.push("", String(planned.error));
      } else if (shouldRestart && planned && planned.restarting !== false) {
        lines.push("", "Restarting.");
      } else if (!complete) {
        lines.push("", "Cleanup did not finish; no restart.");
      } else {
        lines.push("", "Patches are already in the host; no restart.");
      }
      return { kind: "success", text: lines.join("\n") };
    }
    case "revert":
    case "r": {
      const state = await core.gatherState();
      const lines = [];
      if (state.ai_base) {
        const { reverted, errors } = await core.revertAll(state.ai_base);
        lines.push(...reverted.map((p) => `  ✓ reverted / Reverted ${p}`));
        for (const [p, e] of errors) lines.push(`  ⚠ revert failed ${p}: ${e}`);
        if (reverted.length === 0) lines.push("  - no patch backup to restore");
      }
      const shimRevert = await core.revertAllShims();
      for (const [dir, st] of Object.entries(shimRevert)) {
        lines.push(`  shim ${dir}: ${typeof st === "object" ? JSON.stringify(st) : st}`);
      }
      lines.push("", "Revert done. Restart dsh to restore.");
      lines.push("Note: prompt-inject.md kept (user file)");
      return { kind: "success", text: lines.join("\n") };
    }
    case "uninstall":
    case "remove": {
      const result = await uninstaller.uninstallPurge();
      const lines = [];
      if (result.applied) lines.push("Patches detected; restored to the original.");
      else lines.push("No applied patches detected; plugin files are still removed.");
      if (result.patches) {
        lines.push(`  ${result.patches.reverted?.length || 0} files restored`);
      }
      if (result.override?.removed) lines.push(`  removed ${result.override.path}`);
      if (result.stripped?.length) lines.push(`  removed from profile: ${result.stripped.join(", ")}`);
      if (result.errors?.length) {
        for (const e of result.errors) lines.push(`  ⚠ ${e}`);
      }
      lines.push("", "Restart dsh; the plugin will not load afterwards.");
      return { kind: result.ok ? "success" : "error", text: lines.join("\n") };
    }
    case "edit":
    case "e": {
      const state = await core.gatherState();
      let r = core.editOverride(state.dsh_home);
      let created = false;
      if (!r.ok && r.needCreate) {
        await core.installOverride(state.dsh_home, true);
        r = core.editOverride(state.dsh_home);
        created = true;
      }
      // The old code returned kind:"success" even when r.ok was false, so the user saw "opened" with no process.
      if (!r.ok) {
        return { kind: "error", text: r.error || "failed to open the editor" };
      }
      return {
        kind: "success",
        text: created
          ? `Created the default inject file and opened the editor: ${r.path}\nRestart dsh to take effect.`
          : `Opened ${r.editor} on the inject file: ${r.path}\nRestart dsh after editing.`,
      };
    }
    case "help":
    case "h":
    default:
      return {
        kind: "success",
        text: "dsh-purge commands:\n" +
          "  /purge status     show status\n" +
          "  /purge apply      apply everything (prompt + code + shim + override)\n" +
          "  /purge revert     revert to original\n" +
          "  /purge uninstall  uninstall the plugin (reverts first if applied)\n" +
          "  /purge edit       edit the inject file prompt-inject.md\n" +
          "  /purge help       show help\n" +
          "Rule set switching: /rules (list | use <id> | create | delete | reset)\n" +
          "Official skill install: /skills (list | import <path> | create <id> [description] | delete <id>)",
      };
  }
}

function renderRulesStatus(st) {
  const out = [];
  out.push("Rule sets");
  out.push(`  store  ${st.rules_dir}`);
  const targetLine = st.active
    ? `${st.agents_path} (${st.active_target})`
    : "(none active)";
  out.push(`  target ${targetLine} — exists=${st.agents_exists}, synced=${st.agents_synced}`);
  out.push("");
  if (st.rules.length === 0) {
    out.push("  (no rules — use /rules create <id> or add one in settings)");
  }
  for (const r of st.rules) {
    const isActive = r.id === st.active;
    const label = r.name !== r.id ? `${r.name} (${r.id})` : r.id;
    out.push(`  ${isActive ? "▶" : "·"} ${label}${isActive ? " ★ current" : ""} [${r.target}] (${rules.formatSize(r.size)})`);
  }
  return out.join("\n");
}

async function handleRulesCommand(rawInput) {
  const args = (rawInput || "").trim().split(/\s+/).filter(Boolean);
  const sub = (args[0] || "list").toLowerCase();
  const dshHome = core.findDshHome();

  switch (sub) {
    case "list":
    case "ls":
    case "s":
      return { kind: "success", text: renderRulesStatus(await rules.rulesStatus(dshHome)) };
    case "use":
    case "activate":
    case "u": {
      const id = args[1];
      if (!id) return { kind: "error", text: "usage: /rules use <id>" };
      try {
        const meta = await rules.activateRule(dshHome, id);
        refreshHungOperator(dshHome);
        return {
          kind: "success",
          text: `✓ activated rule ${meta.name} (${id}) -> wrote ${rules.targetPath(dshHome, meta.target)} and injected into systemPrompt. Takes effect in a new session.`,
        };
      } catch (e) {
        return { kind: "error", text: `activate failed: ${e.message}` };
      }
    }
    case "create":
    case "new":
    case "c": {
      const id = args[1];
      if (!id) return { kind: "error", text: "usage: /rules create <id> [alias] [AGENTS.md|CLAUDE.md]" };
      const name = args[2] || id;
      const target = args[3] || "AGENTS.md";
      if (!rules.validTarget(target)) {
        return { kind: "error", text: `invalid target: ${target} (AGENTS.md or CLAUDE.md only)` };
      }
      try {
        await rules.saveRule(dshHome, id, "", { name, target });
        return {
          kind: "success",
          text: `✓ created rule ${name} (${id} -> ${target}). Edit and save it under Rule sets in settings.`,
        };
      } catch (e) {
        return { kind: "error", text: `create failed: ${e.message}` };
      }
    }
    case "delete":
    case "rm":
    case "d": {
      const id = args[1];
      if (!id) return { kind: "error", text: "usage: /rules delete <id>" };
      try {
        await rules.deleteRule(dshHome, id);
        refreshHungOperator(dshHome);
        return { kind: "success", text: `✓ deleted rule ${id}.` };
      } catch (e) {
        return { kind: "error", text: `delete failed: ${e.message}` };
      }
    }
    case "reset":
    case "restore":
    case "reset": {
      try {
        const r = await rules.resetToOriginal(dshHome);
        refreshHungOperator(dshHome);
        const lines = [];
        if (r.removed.length > 0) lines.push(`✓ removed plugin-written target files: ${r.removed.join(", ")}`);
        if (r.skipped.length > 0) {
          lines.push(`⚠ skipped (content differs from the rule, possibly hand-edited): ${r.skipped.join(", ")}`);
        }
        lines.push("Activation cleared. The rule library is kept and can be reactivated anytime. Back to factory state: no global instructions.");
        return { kind: "success", text: lines.join("\n") };
      } catch (e) {
        return { kind: "error", text: `reset failed: ${e.message}` };
      }
    }
    case "help":
    case "h":
    default:
      return {
        kind: "success",
        text: "Rule set commands:\n" +
          "  /rules list                         list every rule\n" +
          "  /rules use <id>                     activate a rule (writes AGENTS.md/CLAUDE.md and injects systemPrompt)\n" +
          "  /rules create <id> [alias] [target] create a rule\n" +
          "  /rules delete <id>                  delete a rule\n" +
          "  /rules reset                        restore factory state\n" +
          "  /rules help                         show help",
      };
  }
}

function renderSkillsStatus(st) {
  const out = [];
  out.push("Official user skills / $DSH_HOME/skills");
  out.push(`  ${st.skills_dir}`);
  out.push("  The plugin only installs directories. Invocation is official: the model calls the skill tool when the task matches description/whenToUse; typing /name in chat loads it at once.");
  out.push("  Writing \"activate\" in the body does nothing. Official keys: name, description, whenToUse, disable-model-invocation, user-invocable.");
  out.push("");
  if (!st.skills.length) {
    out.push("  (no user skills yet — use /skills import <archive or folder> or import from settings)");
    return out.join("\n");
  }
  for (const item of st.skills) {
    const mark = item.valid ? "·" : "!";
    const desc = item.description || "(no description)";
    const how = item.valid
      ? [
        item.userInvocable ? `/${item.id}` : "no /name",
        item.modelInvocable ? "model-invocable" : "not model-invocable",
      ].join(" · ")
      : "";
    out.push(`  ${mark} ${item.id}  ${desc}  (${skills.formatSize(item.size)})`);
    if (how) out.push(`      ${how}`);
    if (!item.valid && item.error) out.push(`      ${item.error}`);
  }
  return out.join("\n");
}

async function handleSkillsCommand(rawInput) {
  const args = (rawInput || "").trim().split(/\s+/).filter(Boolean);
  const sub = (args[0] || "list").toLowerCase();
  const dshHome = core.findDshHome();

  switch (sub) {
    case "list":
    case "ls":
    case "s":
      return { kind: "success", text: renderSkillsStatus(await skills.skillsStatus(dshHome)) };
    case "create":
    case "new":
    case "c": {
      const id = args[1];
      if (!id) return { kind: "error", text: "usage: /skills create <id> [description]" };
      if (!skills.validSkillName(id)) {
        return { kind: "error", text: "id must be kebab-case, e.g. code-review" };
      }
      const description = args.slice(2).join(" ").trim() || id;
      try {
        const saved = skills.toPublicSkill(dshHome, await skills.saveSkill(dshHome, id, "", description));
        return {
          kind: "success",
          text: `✓ wrote into the official directory: ${saved.path}\nA new session picks it up; the official loader runs it when the task matches or /${id} is typed.`,
        };
      } catch (e) {
        return { kind: "error", text: `install failed: ${e.message}` };
      }
    }
    case "import":
    case "i": {
      const src = args.slice(1).join(" ").trim();
      if (!src) return { kind: "error", text: "usage: /skills import <archive or folder>" };
      try {
        const packed = await skills.importFromPath(dshHome, src);
        const names = packed.imported.map((item) => item.id).join(", ");
        return { kind: "success", text: `✓ imported into the official $DSH_HOME/skills: ${names}` };
      } catch (e) {
        return { kind: "error", text: `import failed: ${e.message}` };
      }
    }
    case "delete":
    case "rm":
    case "d": {
      const id = args[1];
      if (!id) return { kind: "error", text: "usage: /skills delete <id>" };
      try {
        const removed = skills.toPublicSkill(dshHome, await skills.deleteSkill(dshHome, id));
        return {
          kind: "success",
          text: `✓ deleted ${id} from the official directory${removed.backup ? `\nbackup: ${removed.backup}` : ""}`,
        };
      } catch (e) {
        return { kind: "error", text: `delete failed: ${e.message}` };
      }
    }
    case "help":
    case "h":
    default:
      return {
        kind: "success",
        text: "Official skill install:\n" +
          "  /skills list                 list $DSH_HOME/skills\n" +
          "  /skills create <id> [desc]   write <id>/SKILL.md\n" +
          "  /skills import <path>        import an archive or folder into the official dir\n" +
          "  /skills delete <id>          delete that dir (official drops it from the catalog)\n" +
          "  You may also delete $DSH_HOME/skills/<id> yourself\n" +
          "  Invoke: type /<id> in chat, or let the model call the skill tool by description\n" +
          "  Never injected into systemPrompt and never replaces the prompt",
      };
  }
}

export function apply(ctx, config) {
  const cfg = { ...DEFAULTS, ...(config || {}) };
  // Refusal detection + one retry: off by default, engaged only when tuning.refusalRetry === true.
  ctx.on("llm/stream", (options, next) => {
    let tuning = null;
    try {
      tuning = readTuning();
    } catch {
      tuning = null;
    }
    if (!cfg.enabled || tuning?.refusalRetry !== true || !injectAllowedNow(cfg, requestInjectionContext(ctx, options))) return next();
    return streamWithRefusalRetry((opts) => next(opts), options, {
      decompose: tuning.refusalDecompose !== false,
    });
  });
  const updateHome = core.findDshHome();
  const updateRequest = fn => withUpdateEnvironment(updateEnv(updateHome,cfg),fn);
  const updates = createUpdateController({
    home: updateHome, legacy: cfg, runningVersion: updater.runningVersion(),
    readInstalledVersion: () => updater.installedVersion(updateHome),
    check: () => updateRequest(() => updater.checkUpdate()),
    install: (result) => {
      const lane = updater.channelPublic();
      if (lane.pin || lane.channel !== "stable") return { ok: true, applied: false, skipped: "pinned-or-upstream" };
      return updateRequest(() => updater.applyUpdate(undefined, {
        ref: result.lanes?.stable?.latestRef || result.remoteVersion,
        source: "fork", channel: "stable", pin: false, reason: "auto",
      }));
    },
    onResult: (result) => log(cfg, "update status:", JSON.stringify(result)),
  });
  // The maintenance object must be lazy: when the profile dir or DSH_HOME is unavailable at any step,
  // only the maintenance API may error, never the whole plugin during activate.
  const readHostCompatibility = () => compatibility(resolveInstance().host);
  const maintenance = () => new Maintenance({ home: core.findDshHome(), aiBase: currentHost() });
  ctx.inject(["webServer"], host => host.effect(() => host.webServer.register({
    kind:"exact",path:"/dsh-purge/community",
    handler:async(request,response)=>{
      // Same policy as registerPluginRoute in installWebServer: the listener's bind address
      // also counts as local. Without this argument, a non-loopback deployment 403s on this route alone.
      if(!allowPluginRequest(request,response,trustedHostnames(host.webServer.host,hostTrustedHosts(ctx))))return;
      try {
        let result;
        if(request.method==="GET") {
          const manager=maintenance();
          result={ok:true,name:"dsh-purge Community",version:updater.runningVersion(),repository:REPOSITORY,compatibility:readHostCompatibility(),profile:manager.profile,backups:manager.list(),backup_usage:manager.usage(),update_preferences:publicPreferences(preferences(updateHome,cfg)),update_status:updates.status()};
        }
        else if(request.method==="POST") {
          const body=await readJsonBody(request);
          if(body.op==="preferences") {
            const value=savePreferences(updateHome,body.value,cfg);
            updates.refresh();
            result={ok:true,update_preferences:publicPreferences(value)};
          }
          else if(body.op==="backup")result={ok:true,...await maintenance().backup("manual")};
          else if(body.op==="rollback")result=await maintenance().rollback(body.id);
          else if(body.op==="prune")result=await maintenance().pruneLocked({keepLast:body.keepLast,keepDays:body.keepDays,maxTotalBytes:body.maxTotalBytes});
          else if(body.op==="check")result=await updateRequest(() => updater.checkUpdate());
          else if(body.op==="update")result=await updateRequest(() => updater.handleUpdateOp({ref:body.ref}));
          else throw Error("invalid maintenance operation");
        } else {response.writeHead(405);response.end();return;}
        sendJson(response,200,result);
      }catch(e){sendJson(response,400,{ok:false,error:e.message});}
    }
  },"purge-community maintenance")));
  try {
    const compat = readHostCompatibility();
    if (!compat.qualified) {
      console.warn(`[dsh-purge-community] ${compat.message}`);
    }
    purgeLog("compat", compat);
  } catch (e) {
    console.warn("[dsh-purge-community] compatibility probe failed:", String(e && e.message ? e.message : e));
  }
  if (!cfg.enabled) {
    purgeLog("boot", { enabled: false });
    return;
  }
  purgeLog("boot", {
    enabled: true,
    surface: hostctl.currentSurface(),
    stripMnemon: cfg.stripMnemon !== false,
    cap: cfg.capabilityProtocol !== false,
  });
  core.setHooksDenyConfigValue(cfg.hooksDenyBypass);
  core.refreshHooksDenySettings();
  try {
    const home = core.pinDshHome() || core.findDshHome();
    purgeLog("home", { home: home || "(none)" });
    try {
      if (home) {
        const flag = path.join(home, ".hung-disabled");
        if (fs.existsSync(flag)) {
          fs.unlinkSync(flag);
          purgeLog("hung-disabled", { removed: flag });
        }
      }
    } catch (e) { purgeLog("hung-disabled", { err: String(e?.message || e) }); }
    let bootActive = true;
    const bootHung = installHungPromptGlobal(cfg, () => bootActive);
    ctx.effect(() => () => {
      bootActive = false;
      if (globalThis.__dshPurgeHungPrompt === bootHung) delete globalThis.__dshPurgeHungPrompt;
    });
    // After a successful Apply -> cleanup -> restart, seed the encrypted prompt into prompt-inject.md.
    // Files the user edited are left alone; write only when missing or still empty.
    try {
      const seed = core.seedPromptInjectAtBoot(home);
      log(cfg, "seed prompt-inject:", seed?.action || "noop", seed?.reason || "");
    } catch (e) {
      console.warn("[dsh-purge] seed prompt-inject failed:", String(e && e.message ? e.message : e));
    }
    refreshHungOperator(home);
  } catch { /* with no home dir yet, assembly mounts the built-in default */ }
  // Startup writes no host files. Patches / bak / client.js / runtime are written once on Apply.
  const life = watchContextLife(ctx);
  if (!life.alive) {
    console.warn("[dsh-purge] skip apply: inactive context");
    return;
  }
  const diagnostics = { commands: [] };
  installWebServer(ctx, cfg, diagnostics);
  log(cfg, "plugin enabled");
  ctx.effect(() => {
    updates.start();
    return () => updates.stop();
  });
  core.applyRuntimeEnv();
  try {
    const home = core.pinDshHome() || core.findDshHome();
    refreshHungOperator(home);
  } catch { /* with no home dir yet, assembly mounts the built-in default */ }

  const settleTimer = setTimeout(() => {
    if (!life.alive) {
      log(cfg, "settle skipped: inactive context");
      return;
    }
    settleInstalledPatches(cfg, ctx, life)
      .then((r) => log(cfg, "settle:", r))
      .catch((e) => {
        if (isInactiveContextError(e)) {
          log(cfg, "settle skipped: inactive context");
          return;
        }
        console.warn("[dsh-purge] settle error:", String(e));
      });
    rules.ensureInitialState(core.findDshHome())
      .then((r) => log(cfg, "rules init:", JSON.stringify(r)))
      .catch((e) => console.warn("[dsh-purge] rules init error:", String(e)));
  }, settleDelayMs(hostctl.currentSurface()));
  try {
    ctx.effect(() => () => clearTimeout(settleTimer));
  } catch (e) {
    if (isInactiveContextError(e)) {
      clearTimeout(settleTimer);
      console.warn("[dsh-purge] skip apply: inactive context");
      return;
    }
    throw e;
  }

  try {
    applyHostHooks(ctx, cfg, diagnostics);
  } catch (e) {
    if (isInactiveContextError(e)) {
      console.warn("[dsh-purge] skip apply: inactive context");
      return;
    }
    throw e;
  }
}

function applyHostHooks(ctx, cfg, diagnostics) {
  try {
    const home = core.pinDshHome() || core.findDshHome();
    refreshHungOperator(home);
  } catch { /* home dir not ready yet */ }
  installIdentityOverride(ctx, cfg);
  installRewindDeriveFilter(ctx);
  installCwdCapture(ctx);
  installMnemonMessageStrip(ctx, cfg);
  try {
    registerPromptSections(ctx, cfg);
  } catch (error) {
    if (error.code !== "TUNING_UNREADABLE") throw error;
    console.warn("[dsh-purge]", error.message);
  }

  // continue-retry state scoped to this apply; a disposed ctx takes these closures with it.
  const continuePluginCfg = cfg;
  const savedContinueSettings = continueRetry.loadSettings(core.findDshHome());
  const continueRuntime = continueRetry.installContinueRetry(ctx, {
    getConfig: () => continueRetry.mergeConfig(continuePluginCfg, savedContinueSettings),
  });
  try {
    ctx.effect(() => () => {
      try { continueRuntime?.dispose?.(); } catch { /* ignore */ }
    });
  } catch { /* without an effect, the cordis scope reclaims it */ }

  installCommands(ctx, cfg, diagnostics);

  if (ctx.tools) {
    ctx.tools.register({
      name: "purge_status",
      description: `Show dsh directive-authority cleanup status (${core.ALL_PATCHES.length} patches, shim injection, override file).`,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { text: { type: "string" } },
        },
        render: (_args, value) => [{ type: "text", text: String(value?.text ?? "") }],
      },
      async execute() {
        const state = await core.gatherState();
        return { text: renderStatus(state) };
      },
    });
    ctx.tools.register({
      name: "purge_apply",
      description: `Apply dsh directive-authority cleanup: ${core.ALL_PATCHES.length} patches (prompt layer + code defaults + engine-level approval/sandbox bypass) + shim injection + override file. Restart dsh for full effect.`,
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { text: { type: "string" } },
        },
        render: (_args, value) => [{ type: "text", text: String(value?.text ?? "") }],
      },
      async execute() {
        core.applyRuntimeEnv();
        const scrubbed = core.sanitizeDesktopCommandRuntimes();
        const state = await core.gatherState();
        if (!state.ai_base) return { text: "ERROR: " + core.missingAiBaseMessage() };
        const blocked = rejectIfNeedPrompt(state.dsh_home);
        if (blocked) return { text: "ERROR: " + blocked.error };
        const toolMulti = await core.applyPatchesAllHosts(core.ALL_PATCHES, {
          preserveClientBundles: false,
          forApply: true,
        });
        await core.patchAllShims();
        const flash = core.silenceCmdFlash(toolMulti.hosts[0]?.aiBase || state.ai_base);
        const report = toolMulti.report;
        const applied = report.filter((r) => r.status === "applied").length;
        const already = report.filter((r) => r.status === "already").length;
        const scrubNote = scrubbed.length ? ` desktop_scrub=${scrubbed.length}` : "";
        return { text: `cleanup done / applied=${applied}, already=${already}.${scrubNote} phase-1=${flash.phase1} restart dsh to apply.` };
      },
    });
    ctx.tools.register({
      name: "purge_revert",
      description: "Revert dsh directive-authority cleanup to backup originals (keeps the prompt-inject.md user file).",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      output: {
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { text: { type: "string" } },
        },
        render: (_args, value) => [{ type: "text", text: String(value?.text ?? "") }],
      },
      async execute() {
        const state = await core.gatherState();
        const lines = [];
        if (state.ai_base) {
          const { reverted, errors } = await core.revertAll(state.ai_base);
          lines.push(`reverted=${reverted.length}${errors.length ? ` errors=${errors.length}` : ""}`);
        }
        const shimRevert = await core.revertAllShims();
        lines.push(`shim_dirs=${Object.keys(shimRevert).length}`);
        return { text: `revert done / ${lines.join(", ")}. restart dsh to restore.` };
      },
    });
  }

}

export function installCommands(ctx, cfg, diagnostics = { commands: [] }) {
  ctx.inject(["commands"], (host) => {
    const commands = host.get("commands");
    diagnostics.commands = [];
    host.effect(() => () => { diagnostics.commands = []; });
    const register = (definition, fallback) => diagnostics.commands.push(registerCommand(commands, definition, fallback));
    register({
      name: "purge",
      description: "dsh directive-authority cleanup (status/apply/revert/uninstall/edit/help)",
      input: { hint: "status | apply | revert | uninstall | edit | help" },
      handler: async (invocation) => handlePurgeCommand(invocation.rawInput ?? "", cfg, ctx),
    }, "purge-community");
    register({
      name: "rules",
      description: "Rule set switching (writes AGENTS.md/CLAUDE.md): list | use <id> | create <id> [alias] [target] | delete <id> | reset | help",
      input: { hint: "list | use <id> | create <id> [alias] [target] | delete <id> | reset | help" },
      handler: async (invocation) => handleRulesCommand(invocation.rawInput ?? ""),
    }, "purge-rules");
    register({
      name: "skills",
      description: "Official user skills ($DSH_HOME/skills): list | import <path> | create <id> [description] | delete <id> | help",
      input: { hint: "list | import <path> | create <id> [description] | delete <id> | help" },
      handler: async (invocation) => handleSkillsCommand(invocation.rawInput ?? ""),
    }, "purge-skills");
    register({
      name: "rewind",
      description: "Rewind: a subagent rewinds once; the main agent uses /rewind once or /rewind round",
      input: { hint: "once | round" },
      handler: async (invocation) => {
        const sessionId = rewind.invocationSessionId(invocation);
        const arg = String(invocation.rawInput || "").trim().split(/\s+/)[0]?.toLowerCase() || "";
        const info = await rewind.analyzeRewind(ctx, sessionId);
        const commandName = diagnostics.commands.find(row => row.name === "rewind")?.registered || "rewind";
        if (info.ok && info.kind === "main" && arg !== "once" && arg !== "round") {
          return {
            kind: "success",
            text: `Main agent, pick one: /${commandName} once rewinds one message, /${commandName} round rewinds the last round (including this round's subagents).`,
          };
        }
        const mode = arg === "round" ? "round" : "once";
        const result = await rewind.applyRewind(ctx, sessionId, mode);
        if (!result.ok) return { kind: "error", text: result.error };
        return {
          kind: "success",
          text: mode === "round"
            ? "Rewound the last round. Still in this conversation; the previous message is back in the input box. Sending again leaves out the earlier reply."
            : "Rewound once. Still in this conversation; the previous message is back in the input box. Sending again leaves out the earlier reply.",
        };
      },
    }, "purge-rewind");
  });
}

function headerOf(request, name) {
  const headers = request?.headers;
  if (!headers) return "";
  const value = headers[name] ?? headers[String(name).toLowerCase()];
  if (Array.isArray(value)) return String(value[0] || "");
  return String(value || "");
}

function denyCrossOrigin(response) {
  response.writeHead(403, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify({ ok: false, error: "cross-origin blocked" }));
}

/**
 * Extract the hostname from a Host header or bind address: drop port, brackets, trailing dot, lowercase.
 *
 * Two sources with different formats must both work:
 *
 * - HTTP Host header: IPv6 carries brackets and a port, e.g. `[2001:db8::1]:43120`;
 * - `webServer.host`: raw config, possibly a bare address with no brackets or port, e.g.
 *   `2001:db8::1` (the host-webserver schema only checks `isIP`).
 *
 * In a bare IPv6 the colons belong to the address, so "last colon" is not a port separator —
 * `2001:db8::1` would become `2001:db8:` and `::1` would become `:`, so valid requests stop matching.
 * So check whether it is an IPv6 literal first and keep it whole (`::1` and friends unchanged).
 *
 * @param raw - Host header or bind address.
 * @returns normalized hostname (no port, no brackets); empty string on invalid input.
 */
function authorityHostname(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (isIP(text) === 6) return text.toLowerCase();
  const bracket = text.startsWith("[");
  const match = bracket
    ? /^\[([^\]]+)\](?::(\d+))?$/.exec(text)
    : /^([a-z0-9._-]+)(?::(\d+))?$/i.exec(text);
  if (!match || (match[2] && Number(match[2]) > 65535)) return "";
  if (bracket && isIP(match[1]) !== 6) return "";
  return match[1].replace(/\.$/, "").toLowerCase();
}

/**
 * Loopback: localhost, 127/8, `::1`, and their IPv4-mapped forms.
 *
 * The host's `dsh-host-webserver` `isLoopbackHost()` uses `range() === "loopback"`, which
 * also counts `::ffff:127.0.0.1` and `::0.0.0.1` as loopback. This matches that policy,
 * or local access to such a bind would be rejected.
 */
function isLoopbackHostname(hostname) {
  if (!hostname) return false;
  if (hostname === "localhost") return true;
  // IPv4-mapped: ::ffff:a.b.c.d or ::ffff:7f00:1 (hex tail)
  const mapped = hostname.match(/^::ffff:(.+)$/i);
  if (mapped) return isLoopbackHostname(mapped[1].includes(":") ? hexTailToIpv4(mapped[1]) : mapped[1]);
  if (hostname === "::1" || hostname === "0:0:0:0:0:0:0:1") return true;
  return isIP(hostname) === 4 && hostname.startsWith("127.");
}

/**
 * Turn a hex IPv4 tail like `::ffff:7f00:1` back into dotted form.
 * @param tail - two hex groups such as `7f00:1`.
 * @returns dotted IPv4; empty string when unparsable.
 */
function hexTailToIpv4(tail) {
  const match = String(tail).match(/^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (!match) return "";
  const high = Number.parseInt(match[1], 16);
  const low = Number.parseInt(match[2], 16);
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join(".");
}

/**
 * Allowed Host set: the listener's own bind address plus extra grants from `PURGE_TRUSTED_HOSTS`.
 * Loopback is not enumerated here — 127/8 is a whole range, judged by `isLoopbackHostname()`.
 */
export function trustedHostnames(bindHost, hostEntries = []) {
  const names = new Set();
  const bind = authorityHostname(bindHost);
  if (bind && bind !== "0.0.0.0" && bind !== "::") names.add(bind);
  const entries = [...hostEntries, ...(process.env.PURGE_TRUSTED_HOSTS || "").split(/[;,\s]+/)];
  for (const entry of entries) {
    const name = authorityHostname(entry);
    if (name) names.add(name);
  }
  return names;
}

/**
 * Trusted hostnames this deployment declared: host CLI `--trusted-host` (i.e. connection.trustedHosts).
 *
 * DSH itself allows `/api` by that list while the panel only knew loopback + the bind address,
 * which produced "host reachable, panel 403 cross-origin blocked" on the same machine.
 * Reading the host's list here aligns both; the Origin/Host same-origin check is unchanged.
 *
 * @param ctx - plugin context; the desktop side may have no connection service.
 * @returns trusted hostname array; empty when unreadable.
 */
function hostTrustedHosts(ctx) {
  try {
    const svc = typeof ctx?.get === "function" ? ctx.get("connection") : ctx?.connection;
    const list = svc && Array.isArray(svc.trustedHosts) ? svc.trustedHosts : null;
    if (!list) return [];
    return list.filter((entry) => typeof entry === "string" && entry.trim() !== "");
  } catch {
    return [];
  }
}

/**
 * Request admission for the desktop/Web panel.
 *
 * Host is the one thing an attacking page cannot forge: under DNS rebinding it names the attacker's domain, and
 * the browser writes Origin as that same domain — so "Origin == Host" cannot stop rebinding.
 * Require Host to be local first (loopback / listener bind address / explicit trust), then same-origin from the browser.
 *
 * @param request - Node HTTP request (headers only).
 * @param response - response object used to write the 403.
 * @param trusted - allowed non-loopback Host set; loopback is judged by predicate, unaffected by this set.
 * @returns whether the request may enter plugin routes.
 */
export function allowPluginRequest(request, response, trusted = trustedHostnames()) {
  const host = headerOf(request, "host").trim();
  const hostname = authorityHostname(host);
  if (!host || !(isLoopbackHostname(hostname) || trusted.has(hostname))) {
    denyCrossOrigin(response);
    return false;
  }
  const site = headerOf(request, "sec-fetch-site").toLowerCase();
  if (site === "cross-site") {
    denyCrossOrigin(response);
    return false;
  }
  const origin = headerOf(request, "origin").trim();
  if (origin === "null") {
    denyCrossOrigin(response);
    return false;
  }
  if (!origin) return true;
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    denyCrossOrigin(response);
    return false;
  }
  if (originHost.toLowerCase() !== host.toLowerCase()) {
    denyCrossOrigin(response);
    return false;
  }
  return true;
}

export function installWebServer(ctx, cfg, diagnostics = { commands: [] }) {
  const updateRequest = fn => withUpdateEnvironment(updateEnv(core.findDshHome(),cfg),fn);
  // Desktop embeds @deepseek-ai/dsh-web-app and its settings page uses the same webServer (usually 43120), not just official dsh web.
  ctx.inject(["webServer"], (host) => {
    host.effect(() => {
      // Collect every sub-route's unregister disposer so host.effect cleanup removes them all at once.
      // The old version registered without collecting, so a reload left old handlers mounted under the new ones.
      const routeDisposers = [];
      const trackRoute = (d) => {
        if (typeof d === "function") routeDisposers.push(d);
        return d;
      };
      const registerPluginRoute = (spec, label) => trackRoute(host.webServer.register({
        ...spec,
        handler: async (request, response) => {
          if (!allowPluginRequest(request, response, trustedHostnames(host.webServer.host, hostTrustedHosts(ctx)))) return;
          return spec.handler(request, response);
        },
      }, label));
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/status",
        handler: async (request, response) => {
          if (request.method !== "GET") {
            response.writeHead(405, { allow: "GET" });
            response.end();
            return;
          }
          try {
            const target = resolveInstance().host;
            const state = await core.gatherState({aiBase:target,surface:hostSurface(target)});
            const patch_names = {};
            for (const p of core.ALL_PATCHES) patch_names[String(p.id)] = p.name;
            sendJson(response, 200, {
              ok: true,
              ready: true,
              surface: state.surface || hostctl.currentSurface(),
              ai_base: state.ai_base,
              desktop_install: state.desktop_install || "",
              desktop_exe: state.desktop_exe || "",
              host_layout: state.host_layout,
              asar_still_sealed: state.asar_still_sealed || false,
              asar_handoff: state.asar_handoff || null,
              missing_ai_base: state.ai_base ? "" : core.missingAiBaseMessage(),
              patches_applied: state.ai_base ? state.patches_applied : 0,
              patches_pending: state.display_pending ?? state.patches_pending,
              patches_skipped: state.display_skipped ?? state.patches_skipped ?? 0,
              patches_ready: state.display_ready ?? state.patches_ready ?? 0,
              patches_na: state.patches_na || 0,
              patches_total: state.ai_base ? (state.patches_total ?? 0) : 0,
              patches_total_all: core.ALL_PATCHES.length,
              patches_na: state.patches_na ?? 0,
              patches_lost: reapply.patchesLostAfterHostReset(),
              patch_status: state.patch_status,
              patch_files: state.patch_files || {},
              patches: (state.display_patches || []).map((p) => ({
                id: p.id,
                ids: p.ids,
                layer: p.layer || "",
                status: p.status,
              })),
              // Per-patch truth: status-page counts always come from this, never the grouped table
              // (a group collapses members into one state, so the counts would not add up).
              patch_rows: core.ALL_PATCHES.map((p) => ({
                id: p.id,
                layer: p.layer || "",
                name: p.name,
                status: state.patch_status?.[p.id] || "na",
              })),
              patch_names,
              shim_cmd: state.shim_cmd,
              shim_ps1: state.shim_ps1,
              shim_bin: state.shim_bin,
              has_backup: state.has_backup,
              override_status: state.override_status,
              override_path: state.override_path,
              dsh_home: state.dsh_home,
              plugin_version: updater.runningVersion(),
              community: true,
              commands: diagnostics.commands,
              compatibility: compatibility(state.ai_base),
              boot_full_quit: bootFullQuit,
              update: updater.lastUpdateResult(),
              ...updater.channelPublic(),
              hooks_deny_bypass: core.getHooksDenySettings().hooksDenyBypass,
              ...(await skills.skillsStatus(core.findDshHome()).catch(() => ({ skills: [] }))),
            });
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: status");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/diagnose",
        handler: async (request, response) => {
          if (request.method !== "GET") {
            response.writeHead(405, { allow: "GET" });
            response.end();
            return;
          }
          try {
            const target = resolveInstance().host;
            const state = await core.gatherState({aiBase:target,surface:hostSurface(target)});
            const compat = compatibility(state.ai_base);
            if (!state.ai_base) {
              sendJson(response, 200, {
                ok: true,
                ai_base: "",
                compatibility: compat,
                checked: 0,
                drifted: [],
                optionalDrift: [],
                chained: [],
                missing: [],
              });
              return;
            }
            const drift = await core.patchDrift(state.ai_base, core.ALL_PATCHES, {surface:state.surface,dshHome:state.dsh_home});
            sendJson(response, 200, { ok: true, ai_base: state.ai_base, compatibility: compat, ...drift });
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: diagnose");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/selfcheck",
        handler: async (request, response) => {
          if (request.method !== "GET") {
            response.writeHead(405, { allow: "GET" });
            response.end();
            return;
          }
          try {
            sendJson(response, 200, { ok: true, ...(await selfcheck.selfCheck(resolveInstance().host, core.findDshHome(), { ctx: host })) });
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: selfcheck");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/boost",
        handler: async (request, response) => {
          if (request.method === "GET") {
            try {
              const tuning = readTuning();
              sendJson(response, 200, {
                ok: true,
                enabled: readBoost(),
                rewind: tuning.rewind === true,
                permissionPatches: tuning.permissionPatches !== false,
                contextManagement: tuning.contextManagement === true,
              });
            } catch (error) {
              sendJson(response, 500, { ok: false, error: String(error) });
            }
            return;
          }
          if (request.method === "POST") {
            try {
              const body = await readJsonBody(request);
              if (body && Object.prototype.hasOwnProperty.call(body, "rewind")) {
                const next = writeTuning({ rewind: body.rewind === true });
                sendJson(response, 200, { ok: true, rewind: next.rewind, restart_required: false });
                return;
              }
              // Patch group switch: writes tuning only, never the host; the user must click Apply to reach the host.
              const groupPatch = {};
              if (body && Object.prototype.hasOwnProperty.call(body, "permissionPatches")) {
                groupPatch.permissionPatches = body.permissionPatches !== false;
              }
              if (body && Object.prototype.hasOwnProperty.call(body, "contextManagement")) {
                groupPatch.contextManagement = body.contextManagement === true;
              }
              if (Object.keys(groupPatch).length) {
                const next = writeTuning(groupPatch);
                sendJson(response, 200, {
                  ok: true,
                  permissionPatches: next.permissionPatches !== false,
                  contextManagement: next.contextManagement === true,
                  restart_required: false,
                  apply_required: true,
                });
                return;
              }
              const enabled = writeBoost(body?.enabled === true);
              sendJson(response, 200, { ok: true, enabled, restart_required: true });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: boost");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/probe",
        handler: async (request, response) => {
          try {
            if (request.method === "GET") {
              const probe = readProbe();
              sendJson(response, 200, { ok: true, active: !!probe, nonce: probe?.nonce || "" });
              return;
            }
            if (request.method === "POST") {
              sendJson(response, 200, { ok: true, ...createProbe() });
              return;
            }
            response.writeHead(405, { allow: "GET, POST" });
            response.end();
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: probe");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/audit",
        handler: async (request, response) => {
          if (request.method !== "GET") {
            response.writeHead(405, { allow: "GET" });
            response.end();
            return;
          }
          const n = Number(new URL(request.url || "/", "http://x").searchParams.get("limit") || 20);
          sendJson(response, 200, { ok: true, entries: readAudit({ limit: Number.isFinite(n) ? n : 20 }) });
        },
      }, "dsh-purge: audit");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/hooks-deny",
        handler: async (request, response) => {
          if (request.method === "GET") {
            try {
              const settings = core.refreshHooksDenySettings();
              sendJson(response, 200, { ok: true, hooksDenyBypass: settings.hooksDenyBypass });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          if (request.method === "POST") {
            try {
              const body = await readJsonBody(request);
              if (typeof body?.hooksDenyBypass !== "boolean") {
                sendJson(response, 400, { ok: false, error: "hooksDenyBypass must be boolean" });
                return;
              }
              const saved = core.setHooksDenySettings({ hooksDenyBypass: body.hooksDenyBypass });
              sendJson(response, 200, { ok: true, hooksDenyBypass: saved.hooksDenyBypass });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: hooks-deny");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/last-user",
        handler: async (request, response) => {
          if (request.method !== "GET") {
            response.writeHead(405, { allow: "GET" });
            response.end();
            return;
          }
          try {
            const url = new URL(request.url, "http://127.0.0.1");
            const sessionId = String(url.searchParams.get("sessionId") || "").trim();
            sendJson(response, 200, await rewind.readLastUserText(ctx, sessionId));
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: last user");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/rewind/options",
        handler: async (request, response) => {
          if (request.method !== "GET") {
            response.writeHead(405, { allow: "GET" });
            response.end();
            return;
          }
          try {
            const url = new URL(request.url, "http://127.0.0.1");
            const sessionId = String(url.searchParams.get("sessionId") || "").trim();
            sendJson(response, 200, await rewind.analyzeRewind(ctx, sessionId));
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: rewind options");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/rewind",
        handler: async (request, response) => {
          if (request.method === "GET") {
            try {
              const url = new URL(request.url, "http://127.0.0.1");
              const sessionId = url.searchParams.get("sessionId");
              if (sessionId) {
                const draft = rewind.takeDraft(sessionId);
                sendJson(response, 200, { ok: true, ...(draft || {}) });
                return;
              }
              const pending = rewind.getPending();
              sendJson(response, 200, { ok: true, ...(pending || {}) });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          if (request.method === "POST") {
            try {
              const body = await readJsonBody(request);
              const sessionId = String(body?.sessionId || "").trim();
              if (!sessionId) {
                sendJson(response, 400, { ok: false, error: "sessionId required" });
                return;
              }
              const mode = body?.mode === "round" ? "round" : "once";
              const result = await rewind.applyRewind(ctx, sessionId, mode);
              sendJson(response, result.ok ? 200 : 409, result);
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: rewind");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/update",
        handler: async (request, response) => {
          if (request.method === "GET") {
            try {
              sendJson(response, 200, await updateRequest(() => updater.checkUpdate()));
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          if (request.method === "POST") {
            try {
              const body = await readJsonBody(request);
              const result = await updateRequest(() => updater.handleUpdateOp(body || {}));
              if (result && result.needsFullQuit) bootFullQuit = true;
              sendJson(response, 200, result);
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: update");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/apply",
        handler: async (request, response) => {
          if (request.method !== "POST") {
            response.writeHead(405, { allow: "POST" });
            response.end();
            return;
          }
          try {
            const body = await readJsonBody(request);
            const incoming = typeof body?.content === "string" ? body.content : null;
            core.applyRuntimeEnv();
            core.clearDesktopLocateCache();
            const home = core.pinDshHome();
            const scrubbed = core.sanitizeDesktopCommandRuntimes();
            const state = await core.gatherState();
            if (home) state.dsh_home = home;
            let located;
            try {
              located = await core.resolveOfficialAiBase(state.ai_base, { forApply: true });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e && e.message ? e.message : e) });
              return;
            }
            if (!located.aiBase) {
              sendJson(response, 500, { ok: false, error: core.missingAiBaseMessage() });
              return;
            }
            state.ai_base = located.aiBase;
            if (located.extracted) {
              const arch = located.handoff?.archive;
              if (arch) core.writeUnpackedAsarStamp(arch);
            }
            const handoff = located.handoff && located.handoff.swapAsar ? located.handoff : null;
            const blocked = rejectIfNeedPrompt(state.dsh_home, incoming === null ? undefined : incoming);
            if (blocked) {
              const ui = await core.readOverrideForUi(state.dsh_home);
              sendJson(response, 400, {
                ok: false,
                needPrompt: true,
                override_content: incoming || "",
                defaultContent: ui.defaultContent,
                ...blocked,
              });
              return;
            }
            try {
              await core.commitOverrideOnApply(state.dsh_home, incoming);
            } catch (e) {
              console.warn("[dsh-purge] apply override:", String(e && e.message ? e.message : e));
            }
            const httpMulti = await core.applyPatchesAllHosts(core.ALL_PATCHES, {
              preserveClientBundles: false,
              forApply: true,
            });
            const report = httpMulti.report;
            const shim = await core.patchAllShims();
            let cliRepair = null;
            try {
              cliRepair = core.repairOfficialCliAfterUnpack();
            } catch (e) {
              cliRepair = { ok: false, error: String(e && e.message ? e.message : e) };
            }
            const flash = core.silenceCmdFlash(httpMulti.hosts[0]?.aiBase || state.ai_base);
            const summary = core.summarizeApplyReport(report);
            const hostWritten =
              core.allPatchHostsWritten(httpMulti.hosts) || core.hostCleanMarkersPresent(state.ai_base);
            const hookDenyRestoreFailed = (httpMulti.hookDenyRestoreFailed || []).length > 0;
            const complete = summary.failed.length === 0 && flash.ok === true && hostWritten && !hookDenyRestoreFailed;
            const sealedNow = core.desktopAsarStillSealed();
            if (cliRepairBlocksApply({ handoff, sealed: sealedNow, cliRepair })) {
              sendJson(response, 500, { ok: false, error: "Desktop CLI runtime repair failed; original archive retained.", cli_repair: cliRepair });
              return;
            }
            const promptReady = summary.failed.length > 0 && summary.failed.every((item) => item.status === "pattern_not_found");
            if (flash.ok === true && (complete || promptReady) && hostWritten) {
              reapply.markPatchesApplied();
            }
            // Offer a restart only after cleanup and the host marker land; a sealed package swaps asar on restart.
            const shouldRestart = applyShouldRestart({
              complete: complete || (promptReady && hostWritten),
              sealed: sealedNow,
              appliedCount: summary.applied,
              promptReady: promptReady && hostWritten,
            });
            const manualHandoff = ["win32", "darwin"].includes(process.platform) && shouldRestart && handoff && sealedNow
              ? scheduleDesktopHandoff({ exe: handoff.exe, asar: handoff.asar }) : null;
            if (shouldRestart && handoff && sealedNow) bootFullQuit = true;
            else bootFullQuit = false;
            if (shouldRestart) reapply.markSettleRestart();
            let promptInjectInstall = "skipped";
            if (hostWritten && flash.ok === true) {
              // After a successful Apply -> cleanup -> restart, seed the encrypted prompt into prompt-inject.md.
              // User edits are kept; write only when the file is missing or still the plugin's old default.
              try {
                const seed = core.seedPromptInjectAtBoot(state.dsh_home);
                promptInjectInstall = seed?.action || "noop";
              } catch (e) {
                promptInjectInstall = `error:${String(e && e.message ? e.message : e)}`;
              }
            }
            const hung = refreshHungOperator(state.dsh_home);
            const override = await core.readOverrideForUi(state.dsh_home);
            sendJson(response, 200, {
              ok: true,
              complete,
              restarting: false,
              manualQuit: Boolean(manualHandoff),
              handoff: manualHandoff?.handoff || null,
              restart_after_apply: shouldRestart,
              unpacked_asar: shouldRestart,
              needs_full_quit: shouldRestart,
              asar_still_sealed: sealedNow,
              asar_swap_started: Boolean(manualHandoff),
              applied: summary.applied,
              already: summary.already,
              failed: summary.failed.length,
              failed_items: summary.failed.map((r) => ({
                id: r.patch_id,
                name: r.name,
                status: r.status,
              })),
              report: report.map((r) => ({ id: r.patch_id, name: r.name, status: r.status })),
              override_content: hung.text || override.content,
              defaultContent: override.defaultContent,
              ...injectSnapshot(state.dsh_home),
              override_path: override.path,
              override_installed: promptInjectInstall,
              shim,
              desktop_scrubbed: scrubbed,
              cli_repair: cliRepair,
              cmd_flash: flash,
              // Report the existing completion inputs; do not infer failure from a missing field.
              host_written: hostWritten,
              hook_restore_failed: hookDenyRestoreFailed,
            });
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: apply");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/revert",
        handler: async (request, response) => {
          if (request.method !== "POST") {
            response.writeHead(405, { allow: "POST" });
            response.end();
            return;
          }
          try {
            const state = await core.gatherState();
            const result = {};
            if (state.ai_base) {
              const { reverted, errors } = await core.revertAll(state.ai_base);
              result.reverted = reverted.length;
              result.errors = errors.length;
            }
            result.shim = await core.revertAllShims();
            sendJson(response, 200, { ok: true, ...result, note: "restart dsh to restore; prompt-inject.md kept" });
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: revert");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/uninstall",
        handler: async (request, response) => {
          if (request.method !== "POST") {
            response.writeHead(405, { allow: "POST" });
            response.end();
            return;
          }
          try {
            const result = await uninstaller.uninstallPurge();
            sendJson(response, result.ok ? 200 : 500, {
              ...result,
              surface: hostctl.currentSurface(),
              fullApp: hostctl.currentSurface() === "desktop",
              note: result.ok ? hostctl.restartNote() : undefined,
            });
            if (result.ok) {
              uninstaller.scheduleCleanupRestart({
                request,
                cleanup: result.cleanup,
                ctx,
              });
            }
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e && e.message ? e.message : e) });
          }
        },
      }, "dsh-purge: uninstall");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/drill-grant",
        handler: async (request, response) => {
          const home = core.findDshHome();
          if (request.method === "GET") {
            sendJson(response, 200, { ok: true, ...readDrillGrant(home) });
            return;
          }
          if (request.method === "POST") {
            sendJson(response, 200, { ok: true, ...writeDrillGrant(home) });
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: drill-grant");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/override",
        handler: async (request, response) => {
          if (request.method === "GET") {
            try {
              const home = core.findDshHome();
              // Opening the override panel ensures the encrypted default is seeded; user edits are kept.
              try { core.seedPromptInjectAtBoot(home); } catch { /* ignore */ }
              refreshHungOperator(home);
              const ui = await core.readOverrideForUi(home);
              sendJson(response, 200, { ok: true, ...ui, ...injectSnapshot(home) });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          if (request.method === "POST") {
            try {
              const body = await readJsonBody(request);
              const content = typeof body?.content === "string" ? body.content : null;
              if (content === null) {
                sendJson(response, 400, { ok: false, error: "content must be a string" });
                return;
              }
              const home = core.findDshHome();
              const blocked = rejectIfNeedPrompt(home, content);
              if (blocked) {
                sendJson(response, 400, {
                  ok: false,
                  content,
                  ...blocked,
                });
                return;
              }
              const saved = await core.saveOverrideContent(home, content);
              const hung = refreshHungOperator(home);
              const ui = await core.readOverrideForUi(home);
              sendJson(response, 200, {
                ok: true,
                content: hung.text,
                defaultContent: saved.defaultContent,
                customized: ui.customized,
                usingDefault: ui.usingDefault,
                path: ui.path,
                ...injectSnapshot(home),
              });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e) });
            }
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: override");
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/own-servers",
        handler: async (request, response) => {
          const home = core.findDshHome();
          if (request.method === "GET") {
            sendJson(response, 200, { ok: true, content: readAllowText(home) });
            return;
          }
          if (request.method === "POST") {
            try {
              const body = await readJsonBody(request);
              const content = typeof body?.content === "string" ? body.content : null;
              if (content === null) {
                sendJson(response, 400, { ok: false, error: "content must be a string" });
                return;
              }
              const saved = await writeAllowText(home, content);
              sendJson(response, 200, { ok: true, content: saved.text, dropped: saved.dropped });
            } catch (e) {
              sendJson(response, 500, { ok: false, error: String(e && e.message ? e.message : e) });
            }
            return;
          }
          response.writeHead(405, { allow: "GET, POST" });
          response.end();
        },
      }, "dsh-purge: own-servers");
      trackRoute(installRulesHttp(host.webServer, ctx));
      trackRoute(installSkillsHttp(host.webServer, ctx));
      registerPluginRoute({
        kind: "exact",
        path: "/dsh-purge/restart",
        handler: async (request, response) => {
          if (request.method !== "POST") {
            response.writeHead(405, { allow: "POST" });
            response.end();
            return;
          }
          try {
            const ready = await ensureRestartReady();
            if (!ready.ok) {
              bootFullQuit = false;
              sendJson(response, 200, {
                ok: false,
                error: ready.error || "cleanup did not finish; restart cancelled",
                restarting: false,
                pending: ready.pending || [],
              });
              return;
            }
            const surface = hostctl.currentSurface();
            let planned = null;
            if (core.desktopAsarStillSealed()) {
              planned = core.restartSealedDesktopIfNeeded({ ctx });
            } else {
              planned = hostctl.scheduleRestart(request, ctx);
            }
            if (planned && planned.clean === false) {
              bootFullQuit = false;
              sendJson(response, 200, {
                ok: false,
                error: "cleanup did not reach the running host; restart cancelled",
                restarting: false,
              });
              return;
            }
            // The user clicked restart: clear the sticky marker so this process does not re-refresh or prompt again.
            bootFullQuit = false;
            const restarting = Boolean(planned && !planned.manualQuit && (planned.restarting || planned.asarSwap));
            const restartError = planned && planned.error ? String(planned.error) : "";
            sendJson(response, 200, {
              ok: restarting || !restartError,
              surface,
              fullApp: surface === "desktop",
              restarting,
              already: Boolean(planned && planned.already),
              manualQuit: Boolean(planned?.manualQuit),
              handoff: planned?.handoff || null,
              needsFullQuit: Boolean(planned && planned.asarSwap),
              asar_still_sealed: core.desktopAsarStillSealed(),
              error: restartError || undefined,
              note: planned?.manualQuit ? "Quit DSH completely (⌘Q on macOS, tray exit on Windows); swap status is queryable. Reopen it yourself afterwards; the plugin will not restart it." : restarting ? "Restarting." : restartError,
            });
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e) });
          }
        },
      }, "dsh-purge: restart");
      return () => {
        for (let i = routeDisposers.length - 1; i >= 0; i -= 1) {
          try { routeDisposers[i](); } catch { /* ignore */ }
        }
        routeDisposers.length = 0;
      };
    }, "dsh-purge: http routes");
  });
}

function methodNotAllowed(request, response, allow) {
  if (allow.includes(request.method)) return false;
  response.writeHead(405, { allow: allow.join(", ") });
  response.end();
  return true;
}

async function handleRulesOp(op, body, queryId, queryCwd) {
  const dshHome = core.findDshHome();
  const id = typeof body?.id === "string" ? body.id : String(queryId || "");
  const cwdHint = typeof body?.cwd === "string" && body.cwd.trim()
    ? body.cwd.trim()
    : (typeof queryCwd === "string" && queryCwd.trim() ? queryCwd.trim() : "");
  if (cwdHint) {
    try { rules.writeLastCwd(dshHome, cwdHint); } catch { /* ignore */ }
  }
  if (op === "status") {
    return { ok: true, ...(await rules.rulesStatus(dshHome, cwdHint)) };
  }
  if (op === "scan-cwd" || op === "scan") {
    const effective = cwdHint || rules.readLastCwd(dshHome);
    const candidates = effective ? rules.scanCwdInstructions(effective) : [];
    const selections = rules.readCwdSelections(dshHome);
    return {
      ok: true,
      cwd: effective,
      candidates: candidates.map((item) => ({ ...item, selected: selections.includes(item.path) })),
      selections,
    };
  }
  if (op === "toggle-cwd") {
    const target = typeof body?.path === "string" ? body.path.trim() : "";
    if (!target) return { status: 400, ok: false, error: "path required" };
    const enabled = body?.enabled !== false;
    const next = await rules.toggleCwdSelection(dshHome, target, enabled);
    return { ok: true, selections: next };
  }
  if (op === "set-policy" || op === "workspace-policy") {
    const policy = typeof body?.policy === "string" ? body.policy.trim() : "";
    if (!rules.WORKSPACE_POLICIES.includes(policy)) {
      return { status: 400, ok: false, error: `invalid policy: ${policy}` };
    }
    const applied = await rules.writeWorkspacePolicy(dshHome, policy);
    return { ok: true, policy: applied, policies: [...rules.WORKSPACE_POLICIES] };
  }
  if (op === "read") {
    if (!rules.validRuleId(id)) return { status: 400, ok: false, error: "invalid id" };
    const content = await rules.readRule(dshHome, id);
    if (content === null) return { status: 404, ok: false, error: `rule not found: ${id}` };
    const meta = await rules.readRuleMeta(dshHome, id);
    return { ok: true, id, name: meta.name, target: meta.target, content };
  }
  if (op === "save") {
    const content = typeof body?.content === "string" ? body.content : null;
    if (!rules.validRuleId(id) || content === null) {
      return { status: 400, ok: false, error: "id and content (string) required" };
    }
    const target = typeof body?.target === "string" ? body.target : undefined;
    // The old version wrote body.target straight into rules.saveRule; an invalid target poisoned agents_path inference.
    if (target !== undefined && !rules.validTarget(target)) {
      return { status: 400, ok: false, error: `invalid target: ${target} (AGENTS.md or CLAUDE.md only)` };
    }
    await rules.saveRule(dshHome, id, content, {
      name: typeof body?.name === "string" ? body.name : undefined,
      target,
    });
    refreshHungOperator(dshHome);
    return { ok: true, id, ...injectSnapshot(dshHome) };
  }
  if (op === "activate") {
    if (!rules.validRuleId(id)) return { status: 400, ok: false, error: "invalid id" };
    const meta = await rules.activateRule(dshHome, id);
    refreshHungOperator(dshHome);
    return {
      ok: true,
      id,
      name: meta.name,
      target: meta.target,
      agents_path: rules.targetPath(dshHome, meta.target),
      note: "wrote the target file and injected into systemPrompt; takes effect in a new session",
      ...injectSnapshot(dshHome),
    };
  }
  if (op === "delete") {
    if (!rules.validRuleId(id)) return { status: 400, ok: false, error: "invalid id" };
    await rules.deleteRule(dshHome, id);
    refreshHungOperator(dshHome);
    return { ok: true, id };
  }
  if (op === "reset") {
    const r = await rules.resetToOriginal(dshHome);
    refreshHungOperator(dshHome);
    return { ok: true, ...r, note: "restored factory state (no global instructions); rule library kept" };
  }
  return { status: 400, ok: false, error: `unknown op: ${op}` };
}

function rulesHttpHandler(forcedOp) {
  return async (request, response) => {
    if (request.method === "OPTIONS") {
      sendOptions(response);
      return;
    }
    try {
      const url = new URL(request.url ?? "", "http://127.0.0.1");
      const tail = url.pathname.replace(/^\/dsh-purge\/rules\/?/, "").replace(/\/$/, "");
      let body = {};
      if (request.method === "POST") body = await readJsonBody(request);
      else if (methodNotAllowed(request, response, forcedOp ? ["GET", "POST"] : ["GET", "POST"])) return;
      const op = forcedOp || body.op || tail || "status";
      const result = await handleRulesOp(op, body, url.searchParams.get("id"), url.searchParams.get("cwd"));
      sendJson(response, result.status || 200, result);
    } catch (e) {
      sendJson(response, 500, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  };
}

async function handleSkillsOp(op, body, queryId) {
  const dshHome = core.findDshHome();
  const id = typeof body?.id === "string" ? body.id : String(queryId || "");
  if (op === "status") {
    return { ok: true, ...(await skills.skillsStatus(dshHome)) };
  }
  if (op === "read") {
    if (!skills.validSkillName(id)) return { status: 400, ok: false, error: "invalid skill name" };
    const item = await skills.readSkill(dshHome, id);
    if (!item) return { status: 404, ok: false, error: `skill not found: ${id}` };
    return { ok: true, ...skills.toPublicSkill(dshHome, item) };
  }
  if (op === "save") {
    if (!skills.validSkillName(id)) return { status: 400, ok: false, error: "id must be kebab-case, e.g. code-review" };
    const content = typeof body?.content === "string" ? body.content : "";
    const description = typeof body?.description === "string" ? body.description : "";
    const saved = await skills.saveSkill(dshHome, id, content, description);
    return { ok: true, ...skills.toPublicSkill(dshHome, saved) };
  }
  if (op === "delete") {
    if (!skills.validSkillName(id)) return { status: 400, ok: false, error: "invalid skill name" };
    const removed = await skills.deleteSkill(dshHome, id);
    return { ok: true, ...skills.toPublicSkill(dshHome, removed) };
  }
  if (op === "import") {
    if (body?.path || body?.source || body?.folder) {
      return { status: 400, ok: false, error: "pick an archive or folder on this machine to import" };
    }
    if (typeof body?.data === "string" && body.data.trim()) {
      const packed = await skills.importArchive(dshHome, Buffer.from(body.data, "base64"), body.name || "skill.zip");
      return { ok: true, ...packed };
    }
    if (Array.isArray(body?.files) && body.files.length) {
      const packed = await skills.importFileTree(dshHome, body.files, body.name || "");
      return { ok: true, ...packed };
    }
    return { status: 400, ok: false, error: "choose an archive or folder" };
  }
  return { status: 400, ok: false, error: `unknown op: ${op}` };
}

function skillsHttpHandler(forcedOp) {
  return async (request, response) => {
    if (request.method === "OPTIONS") {
      sendOptions(response);
      return;
    }
    if (request.method !== "GET" && request.method !== "POST") {
      response.writeHead(405, { allow: "GET, POST, OPTIONS" });
      response.end();
      return;
    }
    try {
      const url = new URL(request.url ?? "", "http://127.0.0.1");
      const tail = skillRouteTail(url.pathname);
      const body = request.method === "POST" ? await readJsonBody(request, 14 * 1024 * 1024) : {};
      const op = forcedOp
        || body.op
        || tail
        || url.searchParams.get("op")
        || (url.searchParams.get("id") ? "read" : "status");
      const result = await handleSkillsOp(op, body, url.searchParams.get("id"));
      sendJson(response, result.status || 200, result);
    } catch (e) {
      sendJson(response, 500, { ok: false, error: String(e && e.message ? e.message : e) });
    }
  };
}

function skillRouteTail(pathname) {
  const match = String(pathname || "").match(/^\/dsh-purge\/skills?(?:\/(.*))?$/i);
  if (!match) return "";
  return String(match[1] || "").replace(/\/$/, "");
}

function installSkillsHttp(webServer, ctx) {
  // The old version registered 10+ exact routes each for /dsh-purge/skills[/op] and /dsh-purge/skill[/op] plus a prefix catch-all;
  // the handler already dispatches op by tail, so the exact list only bloated the table and made hot reload harder.
  // Two prefix routes cover everything, and forcedOp="" keeps body.op/tail/op query dispatch working.
  const stop = [];
  stop.push(registerRoute(webServer, ctx, {
    kind: "prefix", path: "/dsh-purge/skills", handler: skillsHttpHandler(""),
  }));
  stop.push(registerRoute(webServer, ctx, {
    kind: "prefix", path: "/dsh-purge/skill", handler: skillsHttpHandler(""),
  }));
  return () => {
    for (let i = stop.length - 1; i >= 0; i -= 1) {
      try { stop[i]?.(); } catch { /* ignore */ }
    }
  };
}

function installRulesHttp(webServer, ctx) {
  // Same as skills: one prefix route covers /dsh-purge/rules[/op]; the handler dispatches op by tail.
  const stop = [];
  stop.push(registerRoute(webServer, ctx, {
    kind: "prefix", path: "/dsh-purge/rules", handler: rulesHttpHandler(""),
  }));
  return () => {
    for (let i = stop.length - 1; i >= 0; i -= 1) {
      try { stop[i]?.(); } catch { /* ignore */ }
    }
  };
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendOptions(response) {
  response.writeHead(204, { "cache-control": "no-store" });
  response.end();
}

function registerRoute(webServer, ctx, spec) {
  try {
    const handler = spec.handler;
    return webServer.register({
      ...spec,
      handler: async (request, response) => {
        if (!allowPluginRequest(request, response, trustedHostnames(webServer?.host, hostTrustedHosts(ctx)))) return;
        return handler(request, response);
      },
    });
  } catch (e) {
    console.warn("[dsh-purge] route", spec?.path, String(e && e.message ? e.message : e));
    return () => {};
  }
}

async function readJsonBody(request, maxBytes = 512 * 1024) {
  const chunks = [];
  let size = 0;
  const limit = Number.isFinite(maxBytes) && maxBytes > 0 ? maxBytes : 512 * 1024;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limit) throw new Error("request body too large");
    chunks.push(buffer);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

const plugin = {
  name,
  inject,
  apply,
};

export default plugin;
