import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";

// All executable and release metadata come from the update that the host confirmed.
export async function handoffOfficialInstaller(owner, exe, home) {
  const download = owner.updater.downloadedUpdateHelper;
  const version = owner.candidate;
  const installer = owner.updater.installerPath;
  const sha512 = download?.fileInfo?.info?.sha512;
  if (!installer || !path.isAbsolute(installer) || download?.file !== installer ||
      !version || download.versionInfo?.version !== version || !/^[A-Za-z0-9+/]{86}==$/.test(sha512 ?? "")) {
    throw new Error("官方更新器缺少已确认的安装包、版本或 SHA512。请重新检查并下载更新。");
  }
  if (download.packageFile || download.downloadedFileInfo?.isAdminRightsRequired) {
    // The vendor updater owns split packages and elevation.
    owner.updater.quitAndInstall(true, false);
    return false;
  }
  const logDir = path.join(home, "logs", "official-installer");
  fs.mkdirSync(logDir, { recursive: true });
  const log = path.join(fs.mkdtempSync(path.join(logDir, "update-")), "result.jsonl");
  const script = fileURLToPath(new URL("./official-installer.ps1", import.meta.url));
  const shell = path.join(process.env.SystemRoot, "System32", "wscript.exe");
  const launcher = fileURLToPath(new URL("./official-installer-launch.jsw", import.meta.url));
  const child = spawn(shell, ["//B", "//nologo", "//E:JScript", launcher], {
    cwd: os.tmpdir(), windowsHide: true, detached: true, stdio: "ignore",
    env: { ...process.env, DSH_UPDATE_WORKER: script, DSH_UPDATE_EXE: exe, DSH_UPDATE_FILE: installer,
      DSH_UPDATE_VERSION: version, DSH_UPDATE_HASH: sha512, DSH_UPDATE_LOG: log, DSH_UPDATE_PARENT: String(process.pid) },
  });
  let launchError;
  child.once("error", error => { launchError = error; });
  child.unref();
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    if (launchError) throw launchError;
    if (fs.existsSync(log)) {
      const content = fs.readFileSync(log, "utf8");
      // Only complete records are published to the coordinator.
      const last = content.split(/\r?\n/).slice(0, -1).at(-1);
      if (last) {
        const state = JSON.parse(last);
        if (state.phase === "failed") throw new Error(state.detail + " (" + log + ")");
        if (state.phase === "waiting-for-exit") {
          fs.writeFileSync(log + ".confirmed", "", {flag: "wx"});
          return true;
        }
      }
    }
    if (child.exitCode !== null) throw new Error(`官方安装器交接助手提前退出（${child.exitCode}）。请查看 ${log}`);
    await delay(150);
  }
  throw new Error("官方安装包校验超时，请查看 " + log);
}
