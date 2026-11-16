#!/usr/bin/env node
import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { Maintenance, compatibility, ROOT, PACKAGE } from "../lib/community.js";
import { findDshHome, patchDrift } from "../lib/core.js";
import { currentHost, diagnosticHost, hostSurface } from "../lib/instance.js";
import { readOverrides, writeOverride, clearOverride } from "../lib/anchors.js";
import { logAudit, readAudit } from "../lib/audit.js";
import { readFileSync, writeFileSync } from "node:fs";
import { installPreset, presetStatus } from "../lib/presets.js";
import { readBoost, writeBoost } from "../lib/boost.js";
import { readTuning, writeTuning } from "../lib/tuning.js";
import { createProbe, readProbe } from "../lib/probe.js";
const rawArgs = process.argv.slice(2);
// Preserve all original CLI actions (apply/revert/uninstall/edit/status)
// unchanged; purge-community only forwards them to avoid implementation drift.
const LEGACY = { apply: "--apply", revert: "--revert", uninstall: "--uninstall", edit: "--edit", "legacy-status": "--status" };
const [op = "status", argument, argument2] = rawArgs,
  home = process.env.DSH_HOME || findDshHome();
// Resolve the running/explicit installation, not another machine-wide Desktop.
const aiBase = currentHost();
// Lazy construction: status / diagnose / selfcheck must not crash just because
// the profile directory is temporarily unavailable.
const maintenance = () => new Maintenance({
  home,
  profile: process.env.PURGE_PROFILE_DIR,
  aiBase,
});
if (LEGACY[op]) {
  const run = spawnSync(process.execPath, [path.join(ROOT, "bin", "dsh-purge.js"), LEGACY[op], ...rawArgs.slice(1)], { stdio: "inherit" });
  process.exitCode = run.status === null ? 1 : run.status;
} else try {
  let result;
  if (op === "audit") {
    const n = rawArgs.includes("--limit") ? Number(rawArgs[rawArgs.indexOf("--limit") + 1]) : 20;
    result = { ok: true, entries: readAudit({ limit: Number.isFinite(n) ? n : 20, home }) };
  } else if (op === "reanchor") {
    const sub = argument || "list";
    const host = aiBase || currentHost();
    const drift = await patchDrift(host);
    const rows = [...drift.drifted, ...drift.optionalDrift];
    const byId = (id) => rows.find((r) => r.id === Number(id));
    if (sub === "list") {
      result = {
        host: drift.host,
        overrides: readOverrides(),
        drifted: rows.map((r) => ({
          id: r.id,
          name: r.name,
          optional: r.optional,
          anchors: r.anchors.map((a) => ({ index: a.index, file: a.file, line: a.suggestion?.line })),
        })),
      };
    } else if (sub === "show") {
      const row = byId(argument2);
      if (!row) throw Error(`No drifted patch #${argument2}`);
      result = row;
    } else if (sub === "clear") {
      const idx = rawArgs.indexOf("--index");
      const wanted = idx >= 0 ? Number(rawArgs[idx + 1]) : undefined;
      if (idx >= 0 && !Number.isInteger(wanted)) throw Error("--index requires an integer");
      result = { cleared: true, overrides: clearOverride(home, argument2, wanted) };
    } else if (sub === "apply") {
      const row = byId(argument2);
      if (!row) throw Error(`No drifted patch #${argument2}`);
      const idxFlag = rawArgs.indexOf("--index");
      const wanted = idxFlag >= 0 ? Number(rawArgs[idxFlag + 1]) : NaN;
      if (idxFlag >= 0 && !Number.isInteger(wanted)) throw Error("--index requires an integer");
      const target = idxFlag >= 0 ? row.anchors.find((a) => a.index === wanted) : row.anchors[0];
      if (!target) throw Error("Could not find the matching anchor (use --index to specify one)");
      const text = readFileSync(target.file, "utf8").replace(/\r\n/g, "\n");
      const lines = text.split("\n");
      const oldCount = String(target.head || "").split("\n").length;
      const linesFlag = rawArgs.indexOf("--lines");
      let from;
      let to;
      if (linesFlag >= 0) {
        const [a, b] = String(rawArgs[linesFlag + 1]).split("-").map(Number);
        if (!Number.isInteger(a) || !Number.isInteger(b) || a < 1 || b < a) throw Error("--lines must look like 120-132");
        from = a - 1;
        to = b;
      } else {
        const center = (target.suggestion?.line || 1) - 1;
        const span = Math.max(1, Math.min(oldCount || 3, 40));
        from = Math.max(0, center - Math.floor(span / 2));
        to = Math.min(lines.length, from + span);
      }
      const candidate = lines.slice(from, to).join("\n");
      if (!candidate.trim()) throw Error("The selected snippet is empty; use --lines to specify a range");
      const occurrences = text.split(candidate).length - 1;
      if (occurrences !== 1) throw Error(`The candidate snippet appears ${occurrences} times in the file; it must be unique. Narrow the range with --lines`);
      const preview = {
        patch: row.id,
        name: row.name,
        index: target.index,
        file: target.file,
        lines: `${from + 1}-${to}`,
        candidate: candidate.slice(0, 800),
        applies: (await import("../lib/core.js")).applyReplacementsToText(
          text,
          { ...row, replacements: [{ pattern: candidate, replace: "x" }], markers: ["__never__"] },
          target.file,
        ).changed,
      };
      if (!rawArgs.includes("--yes")) {
        result = { dryRun: true, ...preview, hint: "After confirming, add --yes to write the local reanchor override" };
      } else {
        writeOverride(home, row.id, target.index, candidate, { host: drift.host });
        logAudit("reanchor", { patch: row.id, index: target.index, host: drift.host }, home);
        const core = await import("../lib/core.js");
        core.refreshAnchorOverrides();
        result = { written: true, ...preview, status: (await core.patchStatus(host))[row.id] };
      }
    } else {
      throw Error("Usage: purge-community reanchor list | show <id> | apply <id> [--index n] [--lines a-b] [--yes] | clear <id>");
    }
  } else if (op === "patches") {
    const sub = (argument || "list").toLowerCase();
    const current = readTuning(home).extraPatches || [];
    const ids = String(argument2 || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0);
    const optIn = (await import("../lib/core.js")).ALL_PATCHES.filter((p) => p.disabledByDefault).map((p) => p.id);
    if (sub === "enable" || sub === "disable") {
      if (!ids.length) throw Error(`Usage: purge-community patches ${sub} ${optIn.join(",") || "<id,id>"}`);
      const known = new Set(optIn);
      const unknown = ids.filter((id) => !known.has(id));
      if (unknown.length) throw Error(`Only patches disabled by default can be toggled manually: ${[...known].join(",")} (unknown: ${unknown.join(",")})`);
      const next = sub === "enable"
        ? [...new Set([...current, ...ids])].sort((a, b) => a - b)
        : current.filter((id) => !ids.includes(id));
      const saved = writeTuning({ extraPatches: next }, home);
      logAudit("patches_setting", { action: sub, ids: ids.join(","), effective: saved.extraPatches.join(",") }, home);
      result = { ok: true, extraPatches: saved.extraPatches, restart_required: false, hint: sub === "enable" ? "Click Apply once to write changes to the host, then quit and reopen." : "Disabling only affects future Apply runs; to remove it from the host now, run Revert once." };
    } else {
      result = {
        ok: true,
        optIn,
        extraPatches: current,
        hint: "purge-community patches enable 18,19 | disable 18",
        note: "Disabled by default: enabling removes repeated-call reminders and tool-result trimming, which increases long-session context size",
      };
    }
  } else if (op === "retry") {
    const sub = (argument || "status").toLowerCase();
    if (sub === "on" || sub === "off") {
      const next = writeTuning({ refusalRetry: sub === "on" });
      result = { ok: true, refusalRetry: next.refusalRetry, restart_required: false, effective: "next-turn" };
    } else if (sub === "decompose") {
      const mode = (argument2 || "status").toLowerCase();
      if (mode === "on" || mode === "off") {
        const next = writeTuning({ refusalDecompose: mode === "on" });
        result = { ok: true, refusalDecompose: next.refusalDecompose, restart_required: false, effective: "next-turn" };
      } else {
        result = { ok: true, refusalDecompose: readTuning(home).refusalDecompose !== false, hint: "purge-community retry decompose on|off" };
      }
    } else {
      const tuning = readTuning(home);
      result = {
        ok: true,
        refusalRetry: tuning.refusalRetry === true,
        refusalDecompose: tuning.refusalDecompose !== false,
        hint: "purge-community retry on|off | retry decompose on|off",
      };
    }
  } else if (op === "rewind") {
    const sub = (argument || "status").toLowerCase();
    if (sub === "on" || sub === "off") {
      const next = writeTuning({ rewind: sub === "on" });
      result = { ok: true, rewind: next.rewind, restart_required: false, effective: "page-refresh" };
    } else {
      result = { ok: true, rewind: readTuning(home).rewind === true, hint: "purge-community rewind on|off" };
    }
  } else if (op === "inject") {
    // Injection position: head / tail / both. Takes effect on the next turn
    // (the section rereads tuning each round); no restart required. The panel
    // will refresh the displayed position on the next read.
    const sub = (argument || "status").toLowerCase();
    const allowed = ["head", "tail", "both"];
    if (allowed.includes(sub)) {
      const next = writeTuning({ injectPosition: sub });
      logAudit("tuning_setting", { setting: "injectPosition", value: next.injectPosition }, home);
      result = { ok: true, injectPosition: next.injectPosition, restart_required: false };
    } else if (sub === "status" || !argument) {
      result = { ok: true, injectPosition: readTuning(home).injectPosition || "head", hint: "purge-community inject head|tail|both" };
    } else {
      result = { ok: false, error: "injectPosition only accepts head / tail / both", value: sub };
      process.exitCode = 2;
    }
  } else if (op === "probe") {
    if (argument === "new" || argument === "create") {
      const probe = createProbe();
      logAudit("probe", { nonce: probe.nonce }, home);
      result = { ok: true, ...probe };
    } else {
      const probe = readProbe();
      result = { ok: true, active: !!probe, nonce: probe?.nonce || "", hint: "purge-community probe new" };
    }
  } else if (op === "preset") {
    const sub = argument || "status";
    if (sub === "install" || sub === "update") {
      result = installPreset({ force: rawArgs.includes("--force") });
      logAudit("preset", { action: result.action, dir: result.dir }, home);
    } else if (sub === "status" || sub === "path") {
      result = presetStatus(home);
    } else {
      throw Error("Usage: purge-community preset [status|install [--force]]");
    }
  } else if (op === "boost") {
    if (argument === "on" || argument === "off") result = { enabled: writeBoost(argument === "on") };
    else result = { enabled: readBoost(), hint: "purge-community boost on|off" };
  } else if (op === "selfcheck" || op === "check-bypass") {
    // The extracted installer runs migrate before runtime dependencies are installed.
    const { selfCheck } = await import("../lib/selfcheck.js");
    // When run directly from the CLI (node bin/community.js), argv points to this plugin,
    // so currentHost() cannot identify the host. selfCheck accepts an empty aiBase and
    // resolves on its own; pass DSH_HOME through to avoid another default guess.
    const report = await selfCheck(aiBase || "", process.env.DSH_HOME || findDshHome());
    process.exitCode = report.state === "broken" ? 1 : 0;
    if (rawArgs.includes("--json")) result = report;
    else {
      const notApplicable = report.patch.not_applicable || 0;
      const naNote = notApplicable ? ` (${notApplicable} more explicitly not applicable, disabled, or no migration needed)` : "";
      const missingNote = report.patch.missing_file ? ` · missing targets: ${report.patch.missing_file} (see diagnose)` : "";
      const lines = [
        `Purge bypass self-check · ${report.host || "(host not located)"}`,
        `  DSH ${report.host_version} · ${report.level} · host patches ${report.patch.applied}/${report.patch.total}${naNote}${missingNote}`,
        "",
      ];
      for (const layer of report.layers) {
        const mark = ["pending", "inferred", "unknown"].includes(layer.state) ? "⏳" : layer.ok ? "✓" : "✗";
        const tail = layer.note
          || (layer.broken.length ? JSON.stringify(layer.broken) : "")
          || (layer.pending && layer.pending.length ? `pending #${layer.pending.join("/#")}` : "");
        lines.push(`  ${mark} ${layer.title}  ${layer.applied}/${layer.required ?? layer.total}${tail ? "  " + tail : ""}`);
      }
      const pendingCount = (report.summary && report.summary.pending && report.summary.pending.patches) || 0;
      lines.push(
        "",
        report.state === "pending"
          ? `Result: ${pendingCount} patches are pending — click Apply once, then quit and reopen DSH.`
          : report.state === "broken"
            ? "Result: one or more layers are not actually active (✗). See above."
            : ["unknown", "inferred"].includes(report.state)
              ? "Result: no confirmed failures found, but there are inferred or unconfirmed items. See per-layer details."
              : "Result: all layers are in place.",
      );
      if (rawArgs.includes("--text")) {
        console.log(lines.join("\n"));
        process.exit(report.state === "broken" ? 1 : 0);
      }
      result = { ok: report.ok, text: lines.join("\n"), summary: report.summary };
    }
  } else if (op === "host-status") {
    const { hostLayoutEvidence } = await import("../lib/host-layout.js");
    result = hostLayoutEvidence(aiBase);
  } else if (op === "diagnose") {
    const target = diagnosticHost();
    const drift = target
      ? await patchDrift(target, undefined, {surface:hostSurface(target),dshHome:home})
      : {host:"",state:"unknown",checked:0,drifted:[],optionalDrift:[],chained:[],missing:[],
          note:"Current instance not located; specify DSH_BASE or PURGE_DSH_CLI explicitly and do not scan other installations"};
    result = { name: "Purge Community", package: PACKAGE, compatibility: compatibility(target), ...drift };
  } else if (op === "status") {
    const target = diagnosticHost();
    result = {
      name: "Purge Community",
      package: PACKAGE,
      compatibility: compatibility(target),
      host_selection: target ? "explicit-or-running" : "unresolved",
      ...(target ? {} : { hint: "Could not determine the current instance entry point. Specify DSH_BASE / PURGE_DSH_CLI, or check the diagnostics in the running host panel. This is not proof that the plugin is not installed." }),
      backups: (() => { try { return maintenance().list(); } catch { return []; } })(),
    };
  } else if (op === "backup") result = await maintenance().backup("cli");
  else if (op === "prune") result = await maintenance().pruneLocked();
  else if (op === "usage") result = maintenance().usage();
  else if (op === "rollback") result = await maintenance().rollback(argument);
  else if (op === "install" || op === "migrate") {
    if (!argument) throw Error("Package path is required");
    result = await maintenance().install(path.resolve(argument), {
      reason: op === "migrate" ? "before-migration" : "before-update",
      migrate: op === "migrate",
    });
  } else
    throw Error(
      "Usage: purge-community status | host-status | diagnose | selfcheck [--json] | boost on|off | rewind on|off | patches [list|enable ids|disable ids] | probe [new] | audit [--limit n] | preset [status|install] | backup [prune|usage] | rollback <backup-id> | migrate <tgz> | apply | revert | uninstall | edit",
    );
  console.log(JSON.stringify(result, null, 2));
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
