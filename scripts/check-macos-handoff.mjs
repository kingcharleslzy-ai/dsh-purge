import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
/** Real, isolated Electron lifecycle. Never opens, quits or edits the user's DSH. */
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import { readMacAsarHandoff } from "../lib/macos-asar-handoff.js";
if (process.platform !== "darwin") {
  console.log("macOS lifecycle: not applicable on this platform");
  process.exit(0);
}
const binary = process.env.PURGE_ELECTRON_EXEC;
if (!binary || !binary.includes("/Electron.app/Contents/MacOS/"))
  throw Error(
    "Use PURGE_ELECTRON_EXEC pointing to a disposable pristine Electron.app; do not use live DSH.",
  );
const root = fs.realpathSync(
  fs.mkdtempSync(path.join(os.tmpdir(), "purge-mac-electron-")),
);
const bundle = path.join(root, "Acceptance Fixture.app"),
  resources = path.join(bundle, "Contents/Resources"),
  asar = path.join(resources, "app.asar");
const exe = path.join(bundle, "Contents/MacOS/Electron");
const hash = (f) =>
  createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const delay = (ms) => new Promise((r) => setTimeout(r, ms));
let child,
  logs = "";
async function until(fn, label) {
  for (let i = 0; i < 300; i++) {
    const value = fn();
    if (value) return value;
    await delay(100);
  }
  throw Error(label + " timed out\n" + logs);
}
const buildAsar = (files) => {
  const header = { files: {} },
    buffers = [];
  let offset = 0;
  for (const [name, text] of Object.entries(files)) {
    const b = Buffer.from(text);
    header.files[name] = { size: b.length, offset: String(offset) };
    buffers.push(b);
    offset += b.length;
  }
  const json = Buffer.from(JSON.stringify(header)),
    padded = Math.ceil(json.length / 4) * 4,
    pre = Buffer.alloc(16 + padded);
  pre.writeUInt32LE(4, 0);
  pre.writeUInt32LE(8 + padded, 4);
  pre.writeUInt32LE(4 + padded, 8);
  pre.writeUInt32LE(json.length, 12);
  json.copy(pre, 16);
  return Buffer.concat([pre, ...buffers]);
};
function main(marker) {
  return `
const {app,BrowserWindow}=require('electron'),fs=require('node:fs'),path=require('node:path');
const base=process.env.PURGE_FIXTURE_ROOT;app.setPath('userData',path.join(base,'isolated-user-data'));
app.whenReady().then(async()=>{
 const w=new BrowserWindow({show:false});await w.loadURL('data:text/html,isolated');
 fs.writeFileSync(path.join(base,'ready-${marker}'),JSON.stringify({path:app.getAppPath(),pid:process.pid,electron:process.versions.electron}));
 let applied=false,quitting=false;
 const timer=setInterval(async()=>{
  if(!applied&&fs.existsSync(path.join(base,'apply'))){applied=true;
   try{const {scheduleMacAsarHandoff}=await import(${JSON.stringify(pathToFileURL(path.resolve("lib/macos-asar-handoff.js")).href)});
   const result=scheduleMacAsarHandoff({exe:process.execPath,asar:path.join(process.resourcesPath,'app.asar')});
   fs.writeFileSync(path.join(base,'scheduled'),JSON.stringify(result));}
   catch(e){fs.writeFileSync(path.join(base,'error'),e.stack);}
  }
  if(!quitting&&fs.existsSync(path.join(base,'quit'))){quitting=true;clearInterval(timer);app.quit();}
 },50);
});
`;
}
async function expectExit() {
  await until(
    () => child.exitCode !== null || child.signalCode !== null,
    "fixture quit",
  );
  assert.equal(child.signalCode, null, "fixture crashed: " + logs);
  assert.equal(child.exitCode, 0, "fixture exited abnormally: " + logs);
}
function launch() {
  const env = { ...process.env, PURGE_FIXTURE_ROOT: root };
  delete env.ELECTRON_RUN_AS_NODE;
  child = spawn(exe, [], { env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (s) => (logs += s));
  child.stderr.on("data", (s) => (logs += s));
  return child;
}
try {
  fs.cpSync(binary.slice(0, binary.indexOf("/Contents/MacOS/")), bundle, {
    recursive: true,
    verbatimSymlinks: true,
  });
  const icu = path.join(
    bundle,
    "Contents/Frameworks/Electron Framework.framework/Resources/icudtl.dat",
  );
  assert(
    fs.realpathSync(icu).startsWith(bundle + path.sep),
    "framework links must remain within the copied app",
  );
  fs.rmSync(path.join(resources, "default_app.asar"), { force: true });
  const meta = JSON.stringify({
    name: "purge-isolated-acceptance",
    version: "1.0.0",
    main: "index.cjs",
  });
  fs.writeFileSync(
    asar,
    buildAsar({ "package.json": meta, "index.cjs": main("archive") }),
  );
  fs.mkdirSync(path.join(resources, "app"), { recursive: true });
  fs.writeFileSync(path.join(resources, "app/package.json"), meta);
  fs.writeFileSync(path.join(resources, "app/index.cjs"), main("directory"));
  const original = hash(asar);
  const settings = path.join(root, "settings.yml");
  fs.writeFileSync(settings, "private-fixture: keep\n");
  const settingsHash = hash(settings);
  launch();
  await until(
    () => fs.existsSync(path.join(root, "ready-archive")),
    "initial sealed launch",
  );
  const initial = JSON.parse(fs.readFileSync(path.join(root, "ready-archive")));
  assert(initial.path.endsWith("app.asar"));
  fs.writeFileSync(path.join(root, "apply"), "1");
  await until(() => {
    if (fs.existsSync(path.join(root, "error")))
      throw Error(fs.readFileSync(path.join(root, "error"), "utf8"));
    return readMacAsarHandoff(asar)?.phase === "waiting_for_quit";
  }, "waiting for manual quit");
  assert.equal(
    JSON.parse(fs.readFileSync(path.join(root, "scheduled"))).restarting,
    false,
  );
  await delay(300);
  assert.equal(child.exitCode, null, logs);
  assert.equal(child.signalCode, null, logs);
  assert.equal(hash(asar), original);
  fs.writeFileSync(path.join(root, "quit"), "1");
  await expectExit();
  const done = await until(() => {
    const s = readMacAsarHandoff(asar);
    if (s?.phase === "failed") throw Error(s.detail);
    return s?.phase === "complete" && s;
  }, "handoff completion after manual quit");
  assert.equal(hash(done.backup), original);
  assert.equal(fs.existsSync(asar), false);
  assert.equal(hash(settings), settingsHash);
  await delay(500);
  assert.equal(
    fs.existsSync(path.join(root, "ready-directory")),
    false,
    "helper must not relaunch",
  );
  fs.unlinkSync(path.join(root, "apply"));
  fs.unlinkSync(path.join(root, "quit"));
  launch();
  await until(
    () => fs.existsSync(path.join(root, "ready-directory")),
    "explicit second launch",
  );
  const second = JSON.parse(
    fs.readFileSync(path.join(root, "ready-directory")),
  );
  assert(second.path.endsWith("/app"));
  fs.writeFileSync(path.join(root, "quit"), "1");
  await expectExit();
  // Exercise the documented host-archive rollback without touching user data.
  assert.equal(fs.existsSync(asar), false);
  fs.copyFileSync(done.backup, asar, fs.constants.COPYFILE_EXCL);
  assert.equal(hash(asar), original);
  fs.unlinkSync(path.join(root, "quit"));
  fs.unlinkSync(path.join(root, "ready-archive"));
  launch();
  await until(
    () => fs.existsSync(path.join(root, "ready-archive")),
    "rollback launch",
  );
  assert(
    JSON.parse(fs.readFileSync(path.join(root, "ready-archive"))).path.endsWith(
      "app.asar",
    ),
  );
  assert.equal(hash(settings), settingsHash);
  fs.writeFileSync(path.join(root, "quit"), "1");
  await expectExit();
  console.log(
    JSON.stringify({
      platform: process.platform,
      electron: initial.electron,
      initial: "app.asar",
      waitedForManualQuit: true,
      backupHashVerified: true,
      autoRestart: false,
      explicitSecondLaunch: "app",
      rollbackLaunch: "app.asar",
      settingsUnchanged: true,
    }),
  );
} finally {
  // Only a temporary fixture process is allowed to be terminated on a test failure.
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill();
    for (
      let i = 0;
      i < 30 && child.exitCode === null && child.signalCode === null;
      i++
    )
      await delay(100);
  }
  removeTreeNoFollowSync(root);
}
