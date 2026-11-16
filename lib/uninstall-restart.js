import path from "node:path";
import fs from "node:fs";
import net from "node:net";
import { spawn } from "node:child_process";

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
const cleanup = Array.isArray(info.cleanup) ? info.cleanup : [];

function spawnEnv() {
  const env = { ...process.env };
  delete env.DSH_PERMISSION_MODE;
  delete env.DSH_PURGE_RESTART;
  return env;
}

function portFree() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on("error", () => resolve(true));
  });
}

async function waitFree() {
  for (let i = 0; i < 80; i++) {
    if (await portFree()) return true;
    await new Promise((r) => setTimeout(r, 120));
  }
  return false;
}

function rmTree(dir) {
  if (!dir) return;
  try {
    removeTreeNoFollowSync(dir, { maxRetries: 8, retryDelay: 120 });
  } catch {
    // left in place while locked
  }
}

const ok = await waitFree();
if (!ok) process.exit(1);

for (const dir of cleanup) rmTree(dir);
if (info.helper) {
  try {
    fs.unlinkSync(info.helper);
  } catch {
    // ignore
  }
}

const child = spawn(info.execPath, info.argv, {
  detached: true,
  stdio: "ignore",
  cwd: info.cwd || process.cwd(),
  env: spawnEnv(),
  windowsHide: true,
  shell: false,
});
child.on("error", () => process.exit(1));
child.unref();
await new Promise((r) => setTimeout(r, 400));
process.exit(0);

// BEGIN standalone no-follow cleanup (checked against lib/remove-tree.js)
function removeTreeNoFollowSync(target, options = {}) {
  const io = options.fs || fs;
  const root = path.resolve(target);
  if (root === path.parse(root).root) throw Error('Refusing to remove a filesystem root');
  const maxRetries = options.maxRetries ?? 0;
  const retryDelay = options.retryDelay ?? 100;
  const retryable = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'ENOTEMPTY', 'EPERM']);
  const walk = file => {
    let stat;
    try { stat = io.lstatSync(file); } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    // lstat must come before isDirectory: never stat / realpath a deletion target.
    try {
      if (stat.isSymbolicLink()) { io.unlinkSync(file); return; }
      if (stat.isDirectory()) {
        for (const name of io.readdirSync(file)) walk(path.join(file, name));
        io.rmdirSync(file); // Non-recursive: no native recursive rm fallback.
      } else io.unlinkSync(file);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
  for (let attempt = 0; ; attempt++) {
    try { walk(root); return; } catch (error) {
      if (error.code === 'ENOENT') return;
      if (attempt >= maxRetries || !retryable.has(error.code)) throw error;
      // Each retry re-lstats every remaining entry, including the root.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelay * (attempt + 1));
    }
  }
}
// END standalone no-follow cleanup
