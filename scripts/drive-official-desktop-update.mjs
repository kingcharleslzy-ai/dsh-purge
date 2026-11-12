// Invoked by check-official-desktop-update.ps1 using the disposable installation's Electron binary.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { NEW_TOOL_PATCHES } from "../lib/patches/new-tools.mjs";
import { applyReplacementsToText } from "../lib/core/verify.mjs";

if (process.env.RUNNER_ENVIRONMENT !== "github-hosted" || process.env.RUNNER_OS !== "Windows") {
  throw new Error("This installer test requires a disposable Windows runner");
}
const [home, rc, installer] = process.argv.slice(2);
const version = "0.2.2-rc." + rc;
const disk = createRequire(import.meta.url)("original-fs");
const resources = path.join(path.dirname(process.execPath), "resources");
let shell;
const unpacked = path.join(resources, "app", "lib", "main.js");
if (disk.existsSync(unpacked)) {
  shell = disk.readFileSync(unpacked, "utf8");
} else {
  const archive = disk.readFileSync(path.join(resources, "app.asar"));
  const manifest = JSON.parse(archive.subarray(16, 16 + archive.readUInt32LE(12)));
  const entry = manifest.files.lib.files["main.js"];
  const start = 8 + archive.readUInt32LE(4) + Number(entry.offset);
  shell = archive.subarray(start, start + entry.size).toString("utf8");
}
const result = applyReplacementsToText(shell, NEW_TOOL_PATCHES.find(p => p.id === 45));
if (!result.changed || result.hitMismatch) throw new Error("Unsupported official update coordinator");
const match = /^var DesktopUpdateCoordinator = (class \{[\s\S]*?^\});/m.exec(result.text);
if (!match) throw new Error("Missing desktop update coordinator");
const pkgName = rc === "1" ? "dsh-purge" : "dsh-purge-community";
const lib = path.join(home, "profiles", "desktop", "node_modules", pkgName, "lib");
fs.mkdirSync(lib, { recursive: true });
for (const file of ["official-installer.mjs", "official-installer.ps1", "official-installer-launch.jsw"]) {
  fs.copyFileSync(new URL("../lib/" + file, import.meta.url), path.join(lib, file));
}
process.env.DSH_HOME = home;
let quit = false;
const app = {quit() { quit = true; }};
const Coordinator = new Function("join", "homedir", "existsSync", "app", "DesktopUpdatePreparationError",
  "return " + match[1])(path.join, os.homedir, fs.existsSync, app, class extends Error {});
const owner = Object.create(Coordinator.prototype);
if (Object.getOwnPropertyDescriptor(Coordinator.prototype, "candidate")) {
  Object.assign(owner, {generation: 0, switching: 0, release: {kind: "downloaded", version}});
} else {
  Object.assign(owner, {downloaded: true, candidate: version});
}
const { createHash } = await import("node:crypto");
const hash = createHash("sha512").update(fs.readFileSync(installer)).digest("base64");
Object.assign(owner, {
  beforeRestart: async () => true, publish() {}, current: {phase:"ready",version},
  updater: {installerPath:installer, downloadedUpdateHelper:{
    file: installer, versionInfo: {version}, fileInfo:{info:{sha512:hash}}
  }},
});
const state = await owner.install(version);
if (!quit || state.phase !== "installing") throw new Error(state.message || "Host did not authorize a normal exit");
