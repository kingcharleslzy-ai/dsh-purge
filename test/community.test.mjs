import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import {
  Maintenance,
  compatibility,
  requirePatchCompatibility,
  download,
  PACKAGE,
} from "../lib/community.js";
import { atomicCopyFileSync } from "../lib/core.js";
import { filterDirs } from "../lib/update-install.js";
function setup() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "purge-community-")),
    profile = path.join(home, "profiles/desktop"),
    aiBase = path.join(home, "host");
  fs.mkdirSync(profile, { recursive: true });
  fs.mkdirSync(path.join(aiBase, "dsh-agent-instructions", "lib"), { recursive: true });
  for (const pkg of ["dsh-agent-loop", "dsh-system-prompt"]) {
    fs.mkdirSync(path.join(aiBase, pkg), { recursive: true });
    fs.writeFileSync(
      path.join(aiBase, pkg, "package.json"),
      JSON.stringify({ version: "0.2.1-rc.1" }),
    );
  }
  const root = path.join(profile, "node_modules", PACKAGE);
  fs.mkdirSync(root, { recursive: true });
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: PACKAGE, version: "1.2.0" }),
  );
  fs.writeFileSync(path.join(root, "client.js"), "original client");
  fs.writeFileSync(
    path.join(profile, "package.json"),
    JSON.stringify({
      dependencies: { [PACKAGE]: "file:original", "unrelated-plugin": "keep" },
      dsh: { profile: { bundles: [PACKAGE, "unrelated-plugin"] } },
    }),
  );
  fs.writeFileSync(
    path.join(profile, "cordis.patch.yml"),
    "PRIVATE CURRENT SETTINGS",
  );
  fs.writeFileSync(path.join(home, "prompt-inject.md"), "PRIVATE USER PROMPT");
  const packRoot = path.join(home, "candidate/package");
  fs.mkdirSync(packRoot, { recursive: true });
  fs.writeFileSync(
    path.join(packRoot, "package.json"),
    JSON.stringify({
      name: PACKAGE,
      version: "1.2.0",
      repository: { url: "https://github.com/kingcharleslzy-ai/dsh-purge.git" },
    }),
  );
  const candidate = path.join(home, "candidate.tgz");
  execFileSync("tar", [
    "-czf",
    candidate,
    "-C",
    path.dirname(packRoot),
    "package",
  ]);
  const installs = [];
  const manager = new Maintenance({
    home,
    candidate,
    profile,
    root,
    aiBase,
    verifier: async () => {},
    installer: async (file) => {
      installs.push(file);
    },
  });
  return {
    home,
    candidate,
    profile,
    root,
    aiBase,
    manager,
    installs,
    close: () => fs.rmSync(home, { recursive: true, force: true }),
  };
}
test("compatibility reports instead of disabling: 0.2.1 qualified, unknown version unverified but writable", () => {
  const f = setup();
  try {
    const base = compatibility(f.aiBase);
    assert.equal(base.runtime_supported, true);
    assert.equal(base.patch_writes_allowed, true);
    assert.equal(base.qualified, true);
    assert.equal(base.level, "qualified");
    // 有宿主就允许写：门禁只挡"完全找不到宿主"，不按版本一刀切。
    assert.doesNotThrow(() => requirePatchCompatibility(f.aiBase));
    fs.writeFileSync(
      path.join(f.aiBase, "dsh-system-prompt/package.json"),
      JSON.stringify({ version: "0.2.2" }),
    );
    const mixed = compatibility(f.aiBase);
    assert.equal(mixed.level, "mixed");
    // 版本不一致只报告，不再挡写入：补丁照打，状态与备份兜底。
    assert.equal(mixed.patch_writes_allowed, true);
    assert.doesNotThrow(() => requirePatchCompatibility(f.aiBase));
    for (const pkg of ["dsh-agent-loop", "dsh-system-prompt"])
      fs.writeFileSync(
        path.join(f.aiBase, pkg, "package.json"),
        JSON.stringify({ version: "99.0.0" }),
      );
    const unknown = compatibility(f.aiBase);
    assert.equal(unknown.runtime_supported, true);
    assert.equal(unknown.qualified, false);
    assert.equal(unknown.level, "unverified");
    assert.equal(unknown.patch_writes_allowed, true);
    assert.doesNotThrow(() => requirePatchCompatibility(f.aiBase));
  } finally {
    f.close();
  }
});

test("no host layout still blocks writes with a clear message", () => {
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "purge-nohost-"));
  try {
    const none = compatibility(empty);
    assert.equal(none.level, "no-host");
    assert.equal(none.patch_writes_allowed, false);
    assert.throws(() => requirePatchCompatibility(empty), /未定位到宿主/);
  } finally {
    fs.rmSync(empty, { recursive: true, force: true });
  }
});
test("backup retention keeps the newest snapshots and reports disk usage", async () => {
  const f = setup();
  try {
    const made = [];
    for (let i = 0; i < 4; i += 1) made.push(await f.manager.backup("retention-test"));
    const usage = f.manager.usage();
    assert(usage.count >= 4);
    assert(usage.bytes > 0);
    const pruned = f.manager.prune({ keepLast: 2, keepDays: 1, maxTotalBytes: 512 * 1024 * 1024 });
    assert(pruned.kept <= 3, `kept ${pruned.kept}`);
    const left = f.manager.list().map((b) => b.id);
    assert(left.includes(made[made.length - 1].id), "newest snapshot must survive");
    assert(f.manager.verify(made[made.length - 1].id));
    assert(pruned.freed >= 0);
  } finally {
    f.close();
  }
});

test("backup is complete, private, verifiable and does not include credentials or images", async () => {
  const f = setup();
  try {
    fs.writeFileSync(path.join(f.home, ".credentials.yaml"), "SECRET");
    const b = await f.manager.backup();
    assert(f.manager.verify(b.id));
    // Windows uses inherited ACLs, not POSIX mode bits.
    if (process.platform !== "win32") assert.equal(fs.statSync(b.folder).mode & 0o777, 0o700);
    assert.equal(
      fs.existsSync(path.join(b.folder, ".credentials.yaml")),
      false,
    );
    assert.equal(f.manager.list().length, 1);
    assert.equal(f.installs.length, 0);
  } finally {
    f.close();
  }
});
test("tampered backups rejected before installer or settings changes", async () => {
  const f = setup();
  try {
    const b = await f.manager.backup();
    fs.writeFileSync(
      path.join(b.folder, "plugins", PACKAGE, "client.js"),
      "tampered",
    );
    await assert.rejects(f.manager.rollback(b.id), /校验/);
    assert.equal(f.installs.length, 0);
    assert.equal(
      fs.readFileSync(path.join(f.profile, "cordis.patch.yml"), "utf8"),
      "PRIVATE CURRENT SETTINGS",
    );
    await assert.rejects(f.manager.rollback("../escape"), /ID/);
  } finally {
    f.close();
  }
});
test("rollback restores plugin enablement while preserving current settings and other dependencies", async () => {
  const f = setup();
  try {
    const b = await f.manager.backup();
    fs.writeFileSync(path.join(f.home, "prompt-inject.md"), "NEW USER PROMPT");
    const p = JSON.parse(fs.readFileSync(path.join(f.profile, "package.json")));
    p.dependencies["another-plugin"] = "added";
    p.dsh.profile.bundles.push("another-plugin");
    fs.writeFileSync(path.join(f.profile, "package.json"), JSON.stringify(p));
    const r = await f.manager.rollback(b.id);
    assert(r.restart_required);
    assert.equal(f.manager.list().length, 2);
    assert.equal(f.installs.length, 1);
    assert.equal(
      fs.readFileSync(path.join(f.home, "prompt-inject.md"), "utf8"),
      "NEW USER PROMPT",
    );
    const now = JSON.parse(
      fs.readFileSync(path.join(f.profile, "package.json")),
    );
    assert(now.dsh.profile.bundles.includes("another-plugin"));
    assert.equal(now.dependencies["another-plugin"], "added");
  } finally {
    f.close();
  }
});
test("installation backs up before writing, replaces only Purge bundles and preserves legacy dependency availability", async () => {
  const f = setup();
  try {
    const p = JSON.parse(fs.readFileSync(path.join(f.profile, "package.json")));
    p.dsh.profile.bundles.unshift("dsh-purge", "dsh-purge-panel");
    fs.writeFileSync(path.join(f.profile, "package.json"), JSON.stringify(p));
    await f.manager.install(f.candidate);
    assert.equal(f.manager.list().length, 1);
    const now = JSON.parse(
      fs.readFileSync(path.join(f.profile, "package.json")),
    );
    assert.deepEqual(now.dsh.profile.bundles, ["unrelated-plugin", PACKAGE]);
    assert.equal(
      fs.readFileSync(path.join(f.home, "prompt-inject.md"), "utf8"),
      "PRIVATE USER PROMPT",
    );
  } finally {
    f.close();
  }
});
test("failed installer preserves a recovery snapshot and restores prior manifest", async () => {
  const f = setup();
  try {
    const before = fs.readFileSync(path.join(f.profile, "package.json"));
    f.manager.installer = async () => {
      throw Error("simulated failure");
    };
    await assert.rejects(f.manager.install(f.candidate), /安装失败/);
    assert.equal(f.manager.list().length, 1);
    assert.deepEqual(
      fs.readFileSync(path.join(f.profile, "package.json")),
      before,
    );
    assert(!fs.existsSync(path.join(f.manager.base, "maintenance.lock")));
  } finally {
    f.close();
  }
});
test("maintenance serializes writes across processes", async () => {
  const f = setup();
  try {
    fs.mkdirSync(f.manager.base, { recursive: true });
    fs.writeFileSync(path.join(f.manager.base, "maintenance.lock"), "fixture");
    await assert.rejects(f.manager.backup(), /已有维护操作/);
    assert.equal(f.manager.list().length, 0);
  } finally {
    f.close();
  }
});
test("download rejects redirects to untrusted and insecure hosts before a second request", async () => {
  let calls = 0;
  const request = async () => {
    calls++;
    return new Response(null, {
      status: 302,
      headers: { location: "http://127.0.0.1/secret" },
    });
  };
  await assert.rejects(
    download("https://github.com/test", 1024, request),
    /来源无效/,
  );
  assert.equal(calls, 1);
});
test("download limits streamed size even without content-length", async () => {
  await assert.rejects(
    download("https://github.com/test", 3, async () => new Response("too big")),
    /过大/,
  );
});

test("missing prompt component does not pass a version check", () => {
  const f = setup();
  try {
    fs.unlinkSync(path.join(f.aiBase, "dsh-system-prompt/package.json"));
    assert.equal(compatibility(f.aiBase).runtime_supported, false);
  } finally {
    f.close();
  }
});
test("repeated rollback stages fresh verified code instead of reusing mutable package-manager links", async () => {
  const f = setup();
  try {
    const b = await f.manager.backup();
    await f.manager.rollback(b.id);
    const first = f.installs.at(-1);
    fs.writeFileSync(first, "changed archive");
    await f.manager.rollback(b.id);
    const second = f.installs.at(-1);
    assert.notEqual(first, second);
    assert.equal(
      execFileSync("tar", ["-xOzf", second, "package/client.js"], {encoding:"utf8"}),
      "original client",
    );
  } finally {
    f.close();
  }
});
test("release checksum failure stops before installation", async () => {
  const { installRelease } = await import("../lib/community.js");
  const f = setup(),
    previous = globalThis.fetch;
  try {
    globalThis.fetch = async (url) =>
      new Response(
        String(url).endsWith("sums")
          ? "0".repeat(64) + "  " + PACKAGE + "-1.2.0.tgz"
          : "wrong bytes",
      );
    await assert.rejects(
      installRelease(f.manager, {
        ref: "v1.2.0",
        version: "1.2.0",
        asset: "https://github.com/fixture/asset",
        sums: "https://github.com/fixture/sums",
      }, globalThis.fetch),
      /SHA256/,
    );
    assert.equal(f.installs.length, 0);
    assert.equal(f.manager.list().length, 0);
  } finally {
    globalThis.fetch = previous;
    f.close();
  }
});

test("Desktop POSIX launcher without executable permission runs through sh without changing app permissions", { skip: process.platform === "win32" }, async () => {
  const { installWithDsh } = await import("../lib/community.js"),
    f = setup(),
    previous = process.env.PURGE_DSH_CLI;
  try {
    const cli = path.join(f.home, "dsh");
    fs.writeFileSync(
      cli,
      '#!/bin/sh\nprintf "%s\\n" "$@" > "$DSH_HOME/cli-args"\n',
      { mode: 0o600 },
    );
    process.env.PURGE_DSH_CLI = cli;
    await installWithDsh(f.candidate, f.manager);
    assert.equal(
      fs.readFileSync(path.join(f.home, "cli-args"), "utf8"),
      ["plugin", "--profile", "desktop", "add", f.candidate, ""].join("\n"),
    );
    assert.equal(fs.statSync(cli).mode & 0o777, 0o600);
  } finally {
    if (previous === undefined) delete process.env.PURGE_DSH_CLI;
    else process.env.PURGE_DSH_CLI = previous;
    f.close();
  }
});

test("large files are stored once and restored byte-for-byte", async () => {
  const f = setup();
  try {
    const big = Buffer.alloc(64 * 1024, 7);
    fs.writeFileSync(path.join(f.root, "client.js"), big);
    const a = await f.manager.backup("dedupe-a");
    const b = await f.manager.backup("dedupe-b");
    const objects = path.join(f.home, "dsh-purge-community", "objects");
    assert.equal(fs.readdirSync(objects).length, 1, "same content -> one object");
    // 备份目录里不再重复放这份大文件
    assert(
      !fs.existsSync(
        path.join(f.home, "dsh-purge-community", "backups", a.id, "plugins", PACKAGE, "client.js"),
      ),
      "deduped file is not copied into the snapshot folder",
    );
    assert(f.manager.verify(a.id));
    assert(f.manager.verify(b.id));

    // 回滚能把内容完整写回
    const before = f.installs.length;
    await f.manager.rollback(a.id);
    const staged = f.installs.slice(before).find((p) => p.endsWith(PACKAGE + ".tgz"));
    assert(staged, "rollback staged the plugin");
    assert(execFileSync("tar", ["-xOzf", staged, "package/client.js"]).equals(big), "bytes restored");

    const usage = f.manager.usage();
    assert(usage.objects > 0);
    // 全部删掉以后，对象被回收
    const pr = f.manager.prune({ keepLast: 0, keepDays: 0, maxTotalBytes: 0 });
    assert(pr.gc.removed >= 0);
    assert.equal(f.manager.list().length <= 1, true);
  } finally {
    f.close();
  }
});

test("atomicCopyFileSync copies atomically and cleans up on failure", async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-copy-"));
  try {
    const src = path.join(dir, "src.txt");
    fs.writeFileSync(src, "official bytes");
    const dst = path.join(dir, "nested", "dst.txt");
    atomicCopyFileSync(src, dst);
    assert.equal(fs.readFileSync(dst, "utf8"), "official bytes");
    assert.equal(
      fs.readdirSync(path.dirname(dst)).filter((n) => n.endsWith(".copytmp")).length,
      0,
      "no temp file left behind",
    );
    // 目标目录不可写：抛错且不留临时文件
    fs.chmodSync(path.dirname(dst), 0o500);
    try {
      atomicCopyFileSync(src, path.join(path.dirname(dst), "x.txt"));
      assert.fail("should throw on unwritable directory");
    } catch (e) {
      assert(e instanceof Error);
    } finally {
      fs.chmodSync(path.dirname(dst), 0o700);
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('successful CLI exit cannot claim a mismatching installed version is updated',async()=>{
 const f=setup();try{
  const pkg=path.join(f.profile,'node_modules',PACKAGE,'package.json');fs.writeFileSync(pkg,JSON.stringify({name:PACKAGE,version:'0.0.1'}));
  await assert.rejects(f.manager.install(f.candidate),/Installed plugin mismatch/);assert(f.manager.list().length>0);assert.equal(fs.readFileSync(path.join(f.home,'prompt-inject.md'),'utf8'),'PRIVATE USER PROMPT');
 }finally{f.close();}
});

test('native installer stages a fresh source for its own rollback link and restores the link on failure',async()=>{
 const {installWithDsh}=await import('../lib/community.js');const f=setup();const old=process.env.PURGE_DSH_CLI;
 try{
  const cli=path.join(f.home,'cli.js');fs.writeFileSync(cli,'');process.env.PURGE_DSH_CLI=cli;
  const link=path.join(f.profile,'node_modules',PACKAGE),target=path.join(f.manager.base,'restored','known',PACKAGE);
  fs.mkdirSync(path.dirname(target),{recursive:true});fs.renameSync(link,target);fs.symlinkSync(target,link,process.platform==='win32'?'junction':'dir');
  let absent=false;await assert.rejects(installWithDsh(f.candidate,f.manager,{execute:async(_cmd,args)=>{absent=!fs.existsSync(link);if(args.includes('remove'))return{stdout:''};assert.notEqual(args.at(-1),f.candidate);assert(fs.existsSync(args.at(-1)));throw Error('install failed');}}),/install failed/);
  assert.equal(absent,true);assert.equal(fs.realpathSync(link),fs.realpathSync(target));assert.equal(fs.readFileSync(path.join(target,'client.js'),'utf8'),'original client');
 }finally{if(old===undefined)delete process.env.PURGE_DSH_CLI;else process.env.PURGE_DSH_CLI=old;f.close();}
});

test("overlay targets that are files are skipped instead of aborting the update", () => {
  // issue #118：file:<tgz> 依赖会把 tar 包路径当成安装目录
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "purge-dirs-"));
  try {
    const realDir = path.join(dir, "pkg");
    fs.mkdirSync(realDir);
    const tar = path.join(dir, "pkg.tgz");
    fs.writeFileSync(tar, "x");
    const missing = path.join(dir, "not-yet");
    const { kept, skipped } = filterDirs([realDir, tar, missing]);
    assert.deepEqual(kept.sort(), [realDir, missing].sort());
    assert.deepEqual(skipped, [tar]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a failed fresh install quarantines partial package and retains user settings', async () => {
  const f = setup();
  try {
    fs.rmSync(f.root, { recursive: true });
    const freshManifest = JSON.parse(fs.readFileSync(path.join(f.profile,'package.json')));
    delete freshManifest.dependencies[PACKAGE];
    fs.writeFileSync(path.join(f.profile,'package.json'),JSON.stringify(freshManifest));
    f.manager.installer = async () => {
      fs.mkdirSync(f.root, { recursive: true });
      fs.writeFileSync(path.join(f.root, 'incomplete.js'), 'partial download');
      throw Error('fixture install failed');
    };
    await assert.rejects(f.manager.install(f.candidate), /fixture install failed.*安装前依赖、安装与清单已恢复/);
    assert.equal(fs.existsSync(f.root), false);
    const recovery = path.join(f.manager.base, 'install-recovery');
    const failed = fs.readdirSync(recovery);
    assert.equal(failed.length, 1);
    assert.equal(fs.readFileSync(path.join(recovery, failed[0], 'failed-node_modules', PACKAGE, 'incomplete.js'),'utf8'), 'partial download');
    assert.equal(fs.readFileSync(path.join(f.profile,'cordis.patch.yml'),'utf8'), 'PRIVATE CURRENT SETTINGS');
    assert.equal(fs.readFileSync(path.join(f.home,'prompt-inject.md'),'utf8'), 'PRIVATE USER PROMPT');
  } finally { f.close(); }
});

test('panel rollback restores the full prior graph on installer or entry import failure', async () => {
  for (const stage of ['install','verify']) {
    const f = setup();
    try {
      fs.writeFileSync(path.join(f.profile,'pnpm-lock.yaml'),'old lock');
      const snapshot = await f.manager.backup();
      const manifest = fs.readFileSync(path.join(f.profile,'package.json'));
      f.manager.installer = async archive => {
        assert(archive.endsWith('.tgz'));
        const p = JSON.parse(manifest); p.dependencies[PACKAGE] = 'file:' + archive;
        fs.writeFileSync(path.join(f.profile,'package.json'),JSON.stringify(p));
        fs.writeFileSync(path.join(f.profile,'pnpm-lock.yaml'),'mutated lock');
        fs.writeFileSync(path.join(f.root,'client.js'),'broken code');
        if(stage === 'install') throw Error('installer failed');
      };
      f.manager.verifier = async () => { throw Error('ERR_MODULE_NOT_FOUND'); };
      await assert.rejects(f.manager.rollback(snapshot.id),/回滚前依赖、安装与清单已恢复/);
      assert.deepEqual(fs.readFileSync(path.join(f.profile,'package.json')),manifest);
      assert.equal(fs.readFileSync(path.join(f.profile,'pnpm-lock.yaml'),'utf8'),'old lock');
      assert.equal(fs.readFileSync(path.join(f.root,'client.js'),'utf8'),'original client');
      assert.equal(fs.readFileSync(path.join(f.profile,'cordis.patch.yml'),'utf8'),'PRIVATE CURRENT SETTINGS');
    } finally { f.close(); }
  }
});

test('fresh-process verifier rejects a version-correct package with missing dependencies', async () => {
  const {verifyInstalledPackage} = await import('../lib/rollback-transaction.js');
  const f=setup();
  try {
    const meta={name:PACKAGE,version:'1.2.0',main:'index.js',type:'module',dependencies:{'purge-nonexistent-test-dependency':'1.0.0'}};
    fs.writeFileSync(path.join(f.root,'package.json'),JSON.stringify(meta));
    fs.writeFileSync(path.join(f.root,'index.js'),'export const valid=true;');
    await assert.rejects(verifyInstalledPackage(f.profile,meta),/Cannot find module/);
    delete meta.dependencies;
    fs.writeFileSync(path.join(f.root,'package.json'),JSON.stringify(meta));
    await verifyInstalledPackage(f.profile,meta);
  } finally { f.close(); }
});


test('Windows native installer resolves archive path aliases without changing their bytes', {skip:process.platform !== 'win32'}, async () => {
  const {installWithDsh}=await import('../lib/community.js');const f=setup();const previous=process.env.PURGE_DSH_CLI;
  try {
    const dir=path.join(f.home,'archive-input');fs.mkdirSync(dir);
    const archive=path.join(dir,'candidate.tgz');fs.copyFileSync(f.candidate,archive);
    const alias=path.join(f.home,'archive-alias');fs.symlinkSync(dir,alias,'junction');
    const input=path.join(alias,'candidate.tgz'),before=fs.readFileSync(input);
    const cli=path.join(f.home,'cli.js');fs.writeFileSync(cli,'');process.env.PURGE_DSH_CLI=cli;
    let supplied;
    await installWithDsh(input,f.manager,{execute:async(_cmd,args)=>{assert.equal(args.at(-2),'add');supplied=args.at(-1);return {stdout:''};}});
    assert.equal(supplied,fs.realpathSync.native(input));assert.notEqual(supplied,input);
    assert.deepEqual(fs.readFileSync(input),before);assert(fs.lstatSync(alias).isSymbolicLink());
  } finally {if(previous===undefined)delete process.env.PURGE_DSH_CLI;else process.env.PURGE_DSH_CLI=previous;f.close();}
});

test('failed install restores the complete dependency graph and lockfile, not just the manifest', async () => {
  for (const stage of ['install','verify']) {
    const f=setup();
    try {
      const manifest=fs.readFileSync(path.join(f.profile,'package.json'));
      fs.writeFileSync(path.join(f.profile,'pnpm-lock.yaml'),'old lock');
      f.manager.installer=async()=>{
        const pkg=JSON.parse(manifest);pkg.dependencies[PACKAGE]='file:candidate';
        fs.writeFileSync(path.join(f.profile,'package.json'),JSON.stringify(pkg));
        fs.writeFileSync(path.join(f.profile,'pnpm-lock.yaml'),'new lock');
        fs.writeFileSync(path.join(f.root,'client.js'),'partial replacement');
        if(stage==='install')throw Error('download failure');
      };
      f.manager.verifier=async()=>{throw Error('dependency import failure');};
      await assert.rejects(f.manager.install(f.candidate),/安装前依赖、安装与清单已恢复/);
      assert.deepEqual(fs.readFileSync(path.join(f.profile,'package.json')),manifest);
      assert.equal(fs.readFileSync(path.join(f.profile,'pnpm-lock.yaml'),'utf8'),'old lock');
      assert.equal(fs.readFileSync(path.join(f.root,'client.js'),'utf8'),'original client');
      assert.equal(fs.readFileSync(path.join(f.home,'prompt-inject.md'),'utf8'),'PRIVATE USER PROMPT');
    } finally {f.close();}
  }
});
test('install recovery refuses to erase concurrent unrelated dependency changes',async()=>{
  const f=setup();
  try {
    f.manager.installer=async()=>{
      const file=path.join(f.profile,'package.json'),pkg=JSON.parse(fs.readFileSync(file));
      pkg.dependencies.concurrent='1.0.0';fs.writeFileSync(file,JSON.stringify(pkg));
      throw Error('failure after concurrent change');
    };
    await assert.rejects(f.manager.install(f.candidate),/检测到并发配置变化，未覆盖/);
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.profile,'package.json'))).dependencies.concurrent,'1.0.0');
    assert.equal(fs.readdirSync(path.join(f.manager.base,'install-recovery')).length,1);
  } finally {f.close();}
});

test('install ownership loss preserves concurrent changes and recovery checkpoint', async () => {
  const f = setup();
  try {
    f.manager.installer = async () => {
      fs.writeFileSync(path.join(f.manager.base, 'maintenance.lock'), 'replacement-owner');
      fs.writeFileSync(path.join(f.profile, 'cordis.patch.yml'), 'NEW OWNER SETTINGS');
      const manifest=path.join(f.profile,'package.json');
      const pkg=JSON.parse(fs.readFileSync(manifest,'utf8'));pkg.concurrentWriter=true;
      fs.writeFileSync(manifest,JSON.stringify(pkg));
    };
    await assert.rejects(f.manager.install(f.candidate), /维护锁归属无法确认/);
    assert.equal(fs.readFileSync(path.join(f.profile,'cordis.patch.yml'),'utf8'),'NEW OWNER SETTINGS');
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.profile,'package.json'),'utf8')).concurrentWriter,true);
    assert.equal(fs.readFileSync(path.join(f.manager.base,'maintenance.lock'),'utf8'),'replacement-owner');
    assert(fs.readdirSync(path.join(f.manager.base,'install-recovery')).length>0);
  } finally { f.close(); }
});

test('rollback ownership loss never restores over a new writer', async () => {
  const f=setup();
  try {
    const backup=await f.manager.backup();
    f.manager.installer=async()=>{
      fs.writeFileSync(path.join(f.manager.base,'maintenance.lock'),'replacement-owner');
      fs.writeFileSync(path.join(f.profile,'cordis.patch.yml'),'NEW OWNER SETTINGS');
    };
    await assert.rejects(f.manager.rollback(backup.id),/维护锁归属无法确认/);
    assert.equal(fs.readFileSync(path.join(f.profile,'cordis.patch.yml'),'utf8'),'NEW OWNER SETTINGS');
    assert.equal(fs.readFileSync(path.join(f.manager.base,'maintenance.lock'),'utf8'),'replacement-owner');
    assert(f.manager.list().some(item=>item.id===backup.id));
  } finally { f.close(); }
});

test('missing CLI preflight stops before profile installation or checkpoint mutation',async()=>{
 const f=setup();try {
  const before=fs.readFileSync(path.join(f.profile,'package.json'));
  f.manager.preflight=()=>{throw Error('fixture CLI unavailable');};
  await assert.rejects(f.manager.install(f.candidate),/fixture CLI unavailable/);
  assert.deepEqual(fs.readFileSync(path.join(f.profile,'package.json')),before);
  assert.equal(f.installs.length,0);
  assert(!fs.existsSync(path.join(f.manager.base,'install-recovery')));
 } finally {fs.rmSync(f.home,{recursive:true,force:true});}
});
