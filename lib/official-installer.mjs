import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createInterface } from "node:readline";

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
  const script = fs.readFileSync(new URL("./official-installer.ps1", import.meta.url), "utf8");
  const shell = path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  const child = spawn(shell, ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", script], {
    cwd: os.tmpdir(), windowsHide: true, detached: true, stdio: ["ignore", "pipe", "ignore"],
    env: { ...process.env, DSH_UPDATE_EXE: exe, DSH_UPDATE_FILE: installer, DSH_UPDATE_VERSION: version,
      DSH_UPDATE_HASH: sha512, DSH_UPDATE_LOG: log, DSH_UPDATE_PARENT: String(process.pid) },
  });
  const lines = createInterface({ input: child.stdout });
  try {
    await new Promise((resolve, reject) => {
      const expired = setTimeout(() => {
        child.kill();
        reject(new Error("官方安装包校验超时，请查看 " + log));
      }, 120000);
      function done(error) {
        clearTimeout(expired);
        if (error) reject(error);
        else resolve();
      }
      child.once("error", done);
      child.once("exit", code => done(new Error("官方安装器交接失败（" + code + "），请查看 " + log)));
      lines.on("line", line => { if (line === "READY") done(); });
    });
  } finally {
    lines.close();
    child.stdout.destroy();
    child.unref();
  }
  return true;
}
