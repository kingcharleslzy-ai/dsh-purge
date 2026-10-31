import { test } from "node:test";
import assert from "node:assert/strict";
import { diskFs } from "../lib/extract-asar.js";
const fs = diskFs();
import os from "node:os";
import path from "node:path";
import { hostLayoutEvidence } from "../lib/host-layout.js";
import { sealedAsarHandoff } from "../lib/core.js";

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge layout "));
  const resources = path.join(root, "DeepSeek Harness.app/Contents/Resources");
  const host = path.join(resources, "app/dsh/node_modules/@deepseek-ai");
  fs.mkdirSync(host, { recursive: true });
  fs.writeFileSync(path.join(resources, "app.asar"), "original archive");
  return { root, resources, host, close: () => fs.rmSync(root, { recursive: true, force: true }) };
}

test("#19 identical disk layouts can have archive, directory or unknown process entry", () => {
  const f = fixture();
  try {
    const base = { execArgv: [], argv: ["node", "unrelated.mjs"] };
    const unknown = hostLayoutEvidence(f.host, base);
    assert.equal(unknown.disk.archive_exists, true);
    assert.equal(unknown.disk.unpacked_exists, true);
    assert.equal(unknown.state, "unknown_runtime");
    const archive = hostLayoutEvidence(f.host, { ...base, execArgv: ["--app-path=" + path.join(f.resources, "app.asar")] });
    assert.equal(archive.state, "archive_entry");
    const unpacked = hostLayoutEvidence(f.host, { ...base, argv: ["electron", path.join(f.host, "dsh-desktop-host/lib/index.js")] });
    assert.equal(unpacked.state, "unpacked_entry");
    assert.deepEqual(archive.disk, unpacked.disk);
    // Removing an archive does not update an already-running process's entry.
    fs.unlinkSync(path.join(f.resources, "app.asar"));
    const after = hostLayoutEvidence(f.host, { ...base, argv: ["electron", "--app-path", path.join(f.resources, "app.asar")] });
    assert.equal(after.disk.archive_exists, false); assert.equal(after.state, "archive_entry");
  } finally { f.close(); }
});

test("runtime from another installation is not target evidence; unrelated args never leak", () => {
  const f = fixture(), other = fixture();
  try {
    const result = hostLayoutEvidence(f.host, { execArgv: [], argv: ["node", "script.mjs", "--app-path=" + path.join(other.resources, "app"), "--token=private"] });
    assert.equal(result.state, "different_instance"); assert.equal(result.process.matches_target, false);
    assert(!JSON.stringify(result).includes("private"));
    const onlyArgument = hostLayoutEvidence(f.host, { execArgv: [], argv: ["node", "script.mjs", path.join(f.resources, "app.asar")] });
    assert.equal(onlyArgument.state, "unknown_runtime");
    const denied = hostLayoutEvidence(f.host, { execArgv: [], argv: [], reader: { statSync() { throw Object.assign(Error("denied"), { code: "EACCES" }); } } });
    assert.equal(denied.state, "unreadable"); assert.equal(denied.disk.archive_exists, null);
  } finally { f.close(); other.close(); }
});

test("#19 Web surface can skip the existing Desktop handoff despite an archive on disk (read-only reproduction)", () => {
  const f = fixture();
  try {
    const exe = path.join(f.root, "DeepSeek Harness.app/Contents/MacOS/DeepSeek Harness");
    fs.mkdirSync(path.dirname(exe), { recursive: true }); fs.writeFileSync(exe, "fixture");
    const archive = path.join(f.resources, "app.asar"), before = fs.statSync(archive);
    assert.equal(sealedAsarHandoff({ surface: "web", execPath: exe, resourcesPath: f.resources }), null);
    assert.equal(sealedAsarHandoff({ surface: "desktop", execPath: exe, resourcesPath: f.resources }).asar, archive);
    assert.equal(fs.readFileSync(archive, "utf8"), "original archive");
    assert.equal(fs.statSync(archive).mtimeMs, before.mtimeMs);
    assert(!fs.existsSync(archive + ".bak"));
  } finally { f.close(); }
});

test("packaged Electron --updated uses actual app path, never disk as runtime evidence", () => {
  const f = fixture(), other = fixture();
  try {
    const opts = {argv: ["electron", "--updated"], execArgv: []};
    assert.equal(hostLayoutEvidence(f.host, opts).state, "unknown_runtime");
    const result = hostLayoutEvidence(f.host, {...opts, appPath: path.join(f.resources, "app")});
    assert.equal(result.state, "unpacked_entry");
    assert.equal(result.process.source, "electron-app-path");
    assert.equal(hostLayoutEvidence(f.host, {...opts, appPath: path.join(other.resources, "app")}).state, "different_instance");
    assert.equal(hostLayoutEvidence(f.host, {...opts, appPath: path.join(f.resources, "app.asar")}).state, "archive_entry");
  } finally { f.close(); other.close(); }
});
