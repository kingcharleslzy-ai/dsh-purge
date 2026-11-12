import assert from "node:assert/strict";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { handoffOfficialInstaller } from "../lib/official-installer.mjs";
import { NEW_TOOL_PATCHES } from "../lib/patches/new-tools.mjs";
import { applyReplacementsToText } from "../lib/core/verify.mjs";
const patch = NEW_TOOL_PATCHES.find(item => item.id === 45);
const nativeCall = "\t\t\t\tthis.updater.quitAndInstall(true, true);";
const legacy = 'function dshPurgeHandoffDesktopUpdate(owner) {\n\towner.updater.quitAndInstall(true, true);\n}\nvar DesktopUpdateCoordinator = class {';
test("native, previously modified and CRLF call sites migrate once", () => {
  for (const original of [nativeCall, legacy + "\n" + nativeCall.replace("this.updater.quitAndInstall(true, true)", "dshPurgeHandoffDesktopUpdate(this)")]) {
    for (const input of [original, original.replaceAll("\n", "\r\n")]) {
      const first = applyReplacementsToText(input, patch);
      assert.equal(first.changed, true);
      assert.equal(first.text.includes("function dshPurgeHandoffDesktopUpdate(owner)"), false);
      assert.deepEqual(applyReplacementsToText(first.text, patch), { text: first.text, changed: false });
    }
  }
  assert.equal(applyReplacementsToText(nativeCall + "\n" + nativeCall, patch).hitMismatch.actual, 2);
});
test("both package names in both profiles can hand off, missing helper is reported before quitting", async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "official-handoff-"));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const fn = Object.getPrototypeOf(async function() {}).constructor("process", "join", "homedir", "existsSync", "app", applyReplacementsToText(nativeCall, patch).text);
  let quits = 0;
  const app = { quit() { quits++; } };
  const inputs = [{ platform: "win32", execPath: "/test/exe", env: {DSH_HOME: root} }, path.join, os.homedir, fs.existsSync, app];
  await assert.rejects(fn.call({}, ...inputs), /找不到官方安装器/);
  for (const profile of ["desktop", "web"]) {
    for (const pkg of ["dsh-purge-community", "dsh-purge"]) {
      const dir = path.join(root, "profiles", profile, "node_modules", pkg, "lib");
      const file = path.join(dir, "official-installer.mjs");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, 'export async function handoffOfficialInstaller(owner, exe, home) { owner.seen = {exe,home,url:import.meta.url}; return true; }');
      const owner = {};
      await fn.call(owner, ...inputs);
      assert.deepEqual(owner.seen, {exe: "/test/exe",home: root,url:pathToFileURL(fs.realpathSync(file)).href});
      fs.unlinkSync(file);
    }
  }
  assert.equal(quits, 4);
});
test("reject stale or incomplete upstream installer metadata", async () => {
  const d = { file: path.resolve("setup.exe"), versionInfo: {version:"v1"}, fileInfo: {info:{sha512:"A".repeat(86)+"=="}} };
  const owner = {candidate:"v2", updater:{installerPath:d.file, downloadedUpdateHelper:d}};
  await assert.rejects(handoffOfficialInstaller(owner, "", ""), /SHA512/);
  d.versionInfo.version="v2";
  d.fileInfo.info.sha512="";
  await assert.rejects(handoffOfficialInstaller(owner, "", ""), /SHA512/);
});
