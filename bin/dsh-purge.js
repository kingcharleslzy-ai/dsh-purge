#!/usr/bin/env node

import * as core from "../lib/core.js";
import * as rules from "../lib/rules.js";

import { pathToFileURL } from "node:url";
import { realpathSync } from "node:fs";

function printStatus(state) {
  const out = [];
  out.push("dsh-purge status");
  out.push("  host / surface " + (state.surface || "web"));
  out.push("  DSH_HOME       " + state.dsh_home);
  if (state.desktop_install) out.push("  desktop install " + state.desktop_install);
  if (state.ai_base) {
    out.push("  plugin root     " + state.ai_base);
    for (const [key, fp] of Object.entries(state.files)) {
      out.push(`    ${key.padEnd(22)} ${fp}`);
    }
  } else {
    out.push("  plugin root     " + core.missingAiBaseMessage());
  }
  out.push(`  shim directory  ${state.shim_dir || "not found"}`);
  out.push(`  backup          ${state.has_backup ? "yes" : "no"}`);
  out.push(`  inject file     ${state.override_path}`);
  out.push(`  inject status   ${state.override_status}`);
  out.push("");
  out.push(`  patches ${state.patches_applied}/${core.ALL_PATCHES.length} applied, ${state.patches_pending} pending`);
  for (const p of core.ALL_PATCHES) {
    const s = state.patch_status[p.id];
    const mark = s === "applied" ? "✓" : s === "pending" ? "✗" : "·";
    out.push(`    ${mark} [#${String(p.id).padEnd(2)}] ${p.name.padEnd(30)} ${p.layer}/${p.layer_en} — ${s}`);
  }
  out.push("");
  out.push(`  shim: dsh.cmd=${state.shim_cmd}  dsh.ps1=${state.shim_ps1}  dsh=${state.shim_bin}`);
  return out.join("\n");
}

export async function main(args = process.argv.slice(2), dependencies = {}) {
  const hostCore = dependencies.core || core;
  const hostRules = dependencies.rules || rules;
  const mode = args.find((a) => ["--apply", "--revert", "--uninstall", "--status", "--edit", "--help"].includes(a));

  if (mode === "--help" || args.includes("-h")) {
    console.log(`dsh-purge usage:
  dsh-purge --status     Show status
  dsh-purge --apply      Apply all cleanup (prompt + code + shim + override)
  dsh-purge --revert     Revert changes
  dsh-purge --uninstall  Uninstall the plugin (revert first if already applied)
  dsh-purge --edit       Edit the prompt-inject.md file
  dsh-purge --help       Show help`);
    return;
  }

  const state = await hostCore.gatherState();
  console.log(printStatus(state));
  console.log("");

  if (mode === "--apply") {
    let failed = false;
    if (!state.ai_base) {
      console.log("[ERROR] " + hostCore.missingAiBaseMessage());
      process.exit(1);
    }
    const inject = hostRules.resolveInjectText(state.dsh_home);
    if (!inject.text) {
      console.log("[ERROR] Prompt and rule sets are both empty. Add a prompt first.");
      process.exit(1);
    }
    const { hosts, report } = await hostCore.applyPatchesAllHosts(hostCore.ALL_PATCHES, {
      preserveClientBundles: false,
      forApply: true,
    });
    for (const h of hosts) console.log(`  host → ${h.aiBase}`);
    for (const r of report) {
      const m = r.status === "applied" ? "✓ applied" : r.status === "already" ? "- already up to date" : r.status === "missing_file" ? "⚠ missing file" : `✗ ${r.status}`;
      console.log(`  ${m} patch #${String(r.patch_id).padEnd(2)} ${r.name}`);
    }
    const summary = hostCore.summarizeApplyReport(report);
    failed = summary.failed.length > 0;
    const flashHost = hosts[0]?.aiBase || state.ai_base;
    const flash = hostCore.silenceCmdFlash(flashHost);
    console.log(`  cmd-flash=${flash.entry} phase-1=${flash.phase1} ok=${flash.ok}`);
    if (flash.ok === false) failed = true;
    if (hosts.length > 1) {
      console.log(`  multi-host: cleaned ${hosts.length} @deepseek-ai locations`);
    }
    console.log(inject.source === "rule"
      ? "  - Using the current rule set without rewriting the prompt file"
      : "  - Using the existing prompt file");
    if (state.shim_dir) {
      const r = await hostCore.patchShim(state.shim_dir);
      for (const [fname, st] of Object.entries(r)) {
        if (typeof st === "string" && /^(error:|write_error|failed)/.test(st)) failed = true;
        if (st === "patched") console.log(`  ✓ shim ${fname} injected`);
        else if (st === "already_patched") console.log(`  - shim ${fname} already injected`);
        else if (st === "missing") console.log(`  - shim ${fname} missing`);
        else console.log(`  ⚠ shim ${fname}: ${st}`);
      }
    } else {
      console.log("  ⚠ Shim directory not found; skipping injection");
    }
    console.log("");
    if (failed) {
      console.error("Apply incomplete. Resolve the errors above; restarting will not fix write failures.");
      process.exitCode = 1;
    } else console.log("All done. Restart dsh for changes to take effect.");
  } else if (mode === "--revert") {
    let failed = false;
    if (state.ai_base || hostCore.enumeratePatchAiBases().length) {
      const { reverted, errors } = await hostCore.revertAllHosts();
      if (errors.length) failed = true;
      for (const p of reverted) console.log(`  ✓ Reverted ${p}`);
      for (const [p, e] of errors) console.log(`  ⚠ Failed to revert ${p}: ${e}`);
      if (reverted.length === 0) console.log("  - No patch backups available to restore");
    }
    if (state.shim_dir) {
      const r = await hostCore.revertShim(state.shim_dir);
      for (const [fname, st] of Object.entries(r)) {
        if (typeof st === "string" && /^error:/.test(st)) failed = true;
        if (st === "reverted" || st === "stripped_inject") console.log(`  ✓ shim ${fname}: ${st}`);
        else console.log(`  - shim ${fname}: ${st}`);
      }
    }
    console.log("");
    if (failed) {
      console.error("Revert incomplete. Original files and failed backups were preserved; resolve the errors above.");
      process.exitCode = 1;
    } else console.log("Revert complete. Restart dsh to restore the original state.");
    console.log("Note: prompt-inject.md is kept (user file)");
  } else if (mode === "--uninstall") {
    const { uninstallPurge, finishUninstallCleanup } = await import("../lib/uninstall.js");
    const result = await finishUninstallCleanup(await uninstallPurge());
    if (result.applied) console.log("  Detected applied patches and restored the original files.");
    else console.log("  No applied patches detected; plugin files will still be removed.");
    if (result.override?.removed) console.log(`  Removed ${result.override.path}`);
    if (result.stripped?.length) console.log(`  Removed from profile: ${result.stripped.join(", ")}`);
    for (const e of result.errors || []) console.log(`  ⚠ ${e}`);
    if (!result.ok) {
      console.log("  Uninstall incomplete: check the restore, deregistration, or file cleanup errors above.");
      process.exit(1);
    }
    console.log("");
    console.log("Uninstall complete. Restart dsh.");
  } else if (mode === "--edit") {
    const r = hostCore.editOverride(state.dsh_home);
    if (!r.ok && r.needCreate) {
      await hostCore.installOverride(state.dsh_home, true);
      console.log(`  ✓ Created default injection file: ${state.override_path}`);
      hostCore.editOverride(state.dsh_home);
    } else {
      console.log(`  → Opened ${r.editor} to edit the injection file: ${r.path}`);
    }
    console.log("  Restart dsh after editing for changes to take effect.");
  } else {
    console.log("No cleanup is applied by default. Use --apply to apply cleanup.");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href) main().catch((e) => {
  console.error("[dsh-purge] error:", e);
  process.exit(1);
});
