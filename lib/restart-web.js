import net from "node:net";
import { spawn, spawnSync } from "node:child_process";
import { envForDetachedSpawn } from "./core.js";

const encoded = process.env.DSH_PURGE_RESTART;
if (!encoded) process.exit(1);

let info;
try {
  info = JSON.parse(encoded);
} catch {
  process.exit(1);
}

const port = Number(info.port) || 3080;
const host = typeof info.host === "string" && info.host ? info.host : "127.0.0.1";

function portFree() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(true));
  });
}

function killOldServer() {
  const pid = Number(info.pid);
  if (!pid || pid === process.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(pid), "/F"], { windowsHide: true, stdio: "ignore" });
    return;
  }
  try { process.kill(pid, "SIGTERM"); } catch { /* already gone */ }
}

function openBrowser(url) {
  if (!url) return;
  if (process.platform === "win32") {
    spawn("rundll32.exe", ["url.dll,FileProtocolHandler", url], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    }).on("error", () => { process.exitCode = 1; }).unref();
    return;
  }
  const opener = process.platform === "darwin" ? "open" : "xdg-open";
  spawn(opener, [url], { detached: true, stdio: "ignore" }).on("error", () => { process.exitCode = 1; }).unref();
}

async function waitFree() {
  for (let i = 0; i < 40; i++) {
    if (await portFree()) return true;
    if (i === 8) killOldServer();
    await new Promise((r) => setTimeout(r, 120));
  }
  killOldServer();
  for (let i = 0; i < 40; i++) {
    if (await portFree()) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

const ok = await waitFree();
if (!ok) process.exit(1);

// With no browser, the replacement can outlive this helper without inheriting a pipe.
const wantBrowser = info.openBrowser !== false;
const child = spawn(info.execPath, info.argv, {
  detached: true,
  stdio: wantBrowser ? ["ignore", "pipe", "pipe"] : "ignore",
  cwd: info.cwd || process.cwd(),
  env: envForDetachedSpawn(),
  windowsHide: true,
  shell: false,
});
child.on("error", () => { process.exitCode = 1; });
child.once("exit", (code, signal) => { process.exitCode = code ?? (signal ? 1 : 0); });
if (wantBrowser) {
  // The address can contain a login token. Read startup lines in memory only,
  // then keep draining both streams until EOF so later log writes remain safe.
  let looking = true;
  const deadline = setTimeout(() => { looking = false; }, 20000);
  deadline.unref();
  for (const stream of [child.stdout, child.stderr]) {
    let tail = "";
    stream.setEncoding("utf8");
    stream.on("data", chunk => {
      if (!looking) { tail = ""; return; }
      const lines = (tail + chunk).split(/\r?\n/);
      tail = lines.pop().slice(-8192);
      for (const line of lines) {
        const match = line.match(/dsh web:\s+(https?:\/\/[^\s]+)/);
        if (!match) continue;
        let url;
        try { url = new URL(match[1].replace(/[),.;]+$/, "")); } catch { continue; }
        looking = false;
        clearTimeout(deadline);
        openBrowser(url.href);
        break;
      }
    });
  }
} else {
  child.unref();
  await new Promise(resolve => setTimeout(resolve, 1500));
}
