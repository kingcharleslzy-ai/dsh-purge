// The historical and altered copies below are data only. No patched host code is loaded.
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  unlink,
} from "node:fs/promises";
import path from "node:path";
import os from "node:os";
const prefix = path.resolve(process.argv[2]);
const root = await mkdtemp(
  path.join(os.tmpdir(), "retired-permission-upgrade-"),
);
try {
  process.env.DSH_HOME = path.join(root, "profile");
  const { backupAll, patchStatusDetail, revertAll } =
    await import("../lib/core.js");
  const base = path.join(root, "host", "node_modules", "@deepseek-ai");
  const relative = path.join("dsh-sandbox-local", "lib", "index.js");
  const file = path.join(base, relative),
    bak = file + ".dshpurge.bak";
  const clean = await readFile(
    path.join(prefix, "node_modules", "@deepseek-ai", relative),
    "utf8",
  );
  const native = '"(deny file-write*)"',
    legacy = '"(allow file-write*)"';
  assert.equal(clean.split(native).length, 2, "unexpected official fixture");
  const old = clean.replace(native, legacy);
  await mkdir(path.dirname(file), { recursive: true });
  await mkdir(process.env.DSH_HOME, { recursive: true });
  const settings = path.join(process.env.DSH_HOME, "my-settings.json");
  await writeFile(settings, '{"chosen":"workspace-write"}');
  await writeFile(bak, clean);
  await writeFile(file, old);
  const report = await patchStatusDetail(base, []);
  assert.equal(report.legacyPermissions.status, "pending");
  assert.equal(report.legacyPermissions.message, file);
  await backupAll(base);
  assert.equal(await readFile(bak, "utf8"), clean);
  await revertAll(base);
  assert.equal(await readFile(file, "utf8"), clean);
  await revertAll(base);
  assert.equal(await readFile(file, "utf8"), clean);
  await writeFile(file, old + "\n// owner edit\n");
  await writeFile(bak, clean);
  await assert.rejects(revertAll(base), /unrelated changes/);
  assert.equal(await readFile(file, "utf8"), old + "\n// owner edit\n");
  assert.equal(await readFile(bak, "utf8"), clean);
  const partial = clean.replace(native, '"local-edited-rule"');
  await writeFile(file, partial);
  await assert.rejects(revertAll(base), /native permission anchor changed/);
  assert.equal(await readFile(file, "utf8"), partial);
  await writeFile(file, old);
  await writeFile(bak, old);
  await assert.rejects(revertAll(base), /backup contains historical output/);
  assert.equal(await readFile(file, "utf8"), old);
  await unlink(bak);
  await assert.rejects(backupAll(base), /missing backup/);
  await assert.rejects(readFile(bak), { code: "ENOENT" });
  assert.equal(
    await readFile(settings, "utf8"),
    '{"chosen":"workspace-write"}',
  );
  console.log(
    "PASS: official module restored byte-for-byte, second run, missing backup, independent edit, profile intact",
    process.platform,
  );
} finally {
  await rm(root, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
}
