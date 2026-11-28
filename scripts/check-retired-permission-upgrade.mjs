// The historical and altered copies below are data only. No patched host code is loaded.
import assert from "node:assert/strict";
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  rm,
  unlink,
  symlink,
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
  const workspace = path.join(root,"workspace");
  const scope = path.join(workspace,"apps/cli/node_modules/@deepseek-ai");
  const nativePackage = path.join(workspace,"packages/sandbox/sandbox-local");
  const basePackage = path.join(workspace,"packages/bundle/base");
  await mkdir(path.join(nativePackage,"lib"),{recursive:true});
  await mkdir(basePackage,{recursive:true}); await mkdir(scope,{recursive:true});
  const linkType=process.platform==="win32"?"junction":"dir";
  await symlink(basePackage,path.join(scope,"dsh-base"),linkType);
  const alias=path.join(scope,"dsh-sandbox-local");
  await symlink(nativePackage,alias,linkType);
  await writeFile(path.join(nativePackage,"package.json"),JSON.stringify({name:"@deepseek-ai/dsh-sandbox-local"}));
  const live=path.join(nativePackage,"lib/index.js");
  await writeFile(live,old); await writeFile(live+".dshpurge.bak",clean);
  const evidence=(await patchStatusDetail(scope,[])).legacyPermissions;
  assert.equal(evidence.status,"pending",evidence.message);
  await revertAll(scope);
  assert.equal(await readFile(live,"utf8"),clean);
  await rm(alias);
  const outside=path.join(root,"unrelated","dsh-sandbox-local");
  await mkdir(path.join(outside,"lib"),{recursive:true}); await symlink(outside,alias,linkType);
  const forbidden=path.join(outside,"lib/index.js");
  await writeFile(forbidden,old); await writeFile(forbidden+".dshpurge.bak",clean);
  await assert.rejects(revertAll(scope),/outside allowed/);
  assert.equal(await readFile(forbidden,"utf8"),old);
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
