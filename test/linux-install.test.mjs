import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createHash } from "node:crypto";
import { bootstrapInstall, desktopCli, webCli, prepareLinuxHost } from "../scripts/bootstrap-install.mjs";
const exec = promisify(execFile);

function fixture(t) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "purge Linux ascii "));
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const home = path.join(tmp, "home"), profile = path.join(home, "profiles/web");
  fs.mkdirSync(profile, { recursive: true });
  fs.writeFileSync(path.join(profile, "package.json"), "{}");
  fs.writeFileSync(path.join(profile, "cordis.patch.yml"), "PRIVATE SETTINGS\n");
  const cli = path.join(tmp, "dsh entry.js");
  fs.writeFileSync(cli, "// selected DSH instance\n");
  return { tmp, home, profile, cli };
}

test("read-only official Linux DSH gets an owned, executable, idempotent copy with contained links", { skip: process.platform !== "linux" || process.getuid?.() === 0 }, async t => {
  let restore;
  t.after(() => restore?.());
  const f = fixture(t), root = path.join(f.tmp, "official"), userHome = path.join(f.tmp, "user ascii");
  const cli = path.join(root, "lib/bin.js"), base = path.join(root, "node_modules/@deepseek-ai");
  fs.mkdirSync(path.dirname(cli), { recursive: true }); fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh", version: "0.2.1-rc.2", bin: { dsh: "lib/bin.js" } }));
  fs.writeFileSync(cli, '#!/usr/bin/env node\nconsole.log(JSON.stringify(process.argv.slice(2)))\n', { mode: 0o755 });
  const module = path.join(base, "fixture.js"); fs.writeFileSync(module, "original", { mode: 0o600 });
  fs.symlinkSync(module, path.join(base, "internal"));
  fs.chmodSync(root, 0o555); fs.chmodSync(base, 0o555);
  restore = () => { fs.chmodSync(root, 0o755); fs.chmodSync(base, 0o755); };
  const options = { userHome, log: () => {} };
  const result = prepareLinuxHost(cli, options);
  assert.equal(result.copied, true);
  assert(!fs.existsSync(result.launcher), "preparing a copy must not activate it");
  result.activate();
  assert.deepEqual(JSON.parse((await exec(result.launcher, ["web", "with space", "--port", "3081"])).stdout), ["web", "with space", "--port", "3081"]);
  assert.equal(fs.statSync(path.join(result.aiBase, "fixture.js")).mode & 0o777, 0o600);
  assert.equal(fs.realpathSync(path.join(result.aiBase, "internal")), path.join(result.aiBase, "fixture.js"));
  fs.writeFileSync(path.join(result.aiBase, "fixture.js"), "patched");
  assert.equal(prepareLinuxHost(cli, options).cli, result.cli);
  assert.equal(fs.readFileSync(path.join(result.aiBase, "fixture.js"), "utf8"), "patched");
  assert.equal(fs.readFileSync(module, "utf8"), "original");
  assert.equal(fs.statSync(root).mode & 0o777, 0o555);
  assert.equal(prepareLinuxHost(result.launcher, options).copied, false);
  fs.unlinkSync(result.launcher); fs.writeFileSync(result.launcher, "user command");
  assert.throws(() => prepareLinuxHost(cli, options), /not managed/);
  assert.equal(fs.readFileSync(result.launcher, "utf8"), "user command");
  fs.unlinkSync(result.launcher);
  // A new source identity must not copy dependencies pointing outside its tree.
  fs.chmodSync(base, 0o755); fs.symlinkSync(f.cli, path.join(base, "external")); fs.chmodSync(base, 0o555);
  fs.chmodSync(root, 0o755); fs.appendFileSync(path.join(root, "package.json"), " "); fs.chmodSync(root, 0o555);
  assert.throws(() => prepareLinuxHost(cli, options), /symlink escapes/);
  assert(!fs.existsSync(result.launcher));
  assert(!fs.readdirSync(path.join(userHome, ".local/share/dsh-purge/hosts")).some(name => name.startsWith(".stage-")));
});

test("Linux CLI resolves the selected symlink and rejects missing/non-executable launchers", { skip: process.platform === "win32" }, t => {
  const f = fixture(t), link = path.join(f.tmp, "dsh");
  fs.symlinkSync(f.cli, link);
  assert.equal(webCli(link), fs.realpathSync(f.cli));
  assert.throws(() => webCli(""), /PURGE_DSH_CLI/);
  assert.throws(() => webCli(f.tmp), /must be a file/);
  fs.unlinkSync(link); fs.writeFileSync(link, "#!/bin/sh\n", { mode: 0o600 });
  assert.throws(() => webCli(link), /EACCES/);
});

test("Linux Desktop CLI discovery keeps the explicitly selected install", t => {
  const f = fixture(t), exe = path.join(f.tmp, "deepseek-harness");
  const cli = path.join(f.tmp, "resources/app/dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js");
  fs.mkdirSync(path.dirname(cli), { recursive: true }); fs.writeFileSync(cli, "");
  assert.equal(desktopCli(exe, "linux"), cli);
  assert.throws(() => desktopCli(path.join(f.tmp, "other/deepseek-harness"), "linux"), /Cannot find/);
});

test("offline Linux bootstrap verifies SHA256, runs migration with web profile and keeps settings", { skip: process.platform !== "linux" }, async t => {
  const f = fixture(t), pack = path.join(f.tmp, "package"), version = "1.6.28";
  fs.mkdirSync(path.join(pack, "bin"), { recursive: true });
  fs.writeFileSync(path.join(pack, "package.json"), JSON.stringify({ name: "dsh-purge-community", version, repository: { url: "git+https://github.com/kingcharleslzy-ai/dsh-purge.git" } }));
  fs.writeFileSync(path.join(pack, "bin/community.js"), `require('node:fs').writeFileSync(process.env.DSH_HOME+'/called.json', JSON.stringify({args:process.argv.slice(2),profile:process.env.DSH_PROFILE,surface:process.env.DSH_SURFACE,cli:process.env.PURGE_DSH_CLI}));`);
  const archiveFile = path.join(f.tmp, `dsh-purge-community-${version}.tgz`);
  await exec("tar", ["-czf", archiveFile, "-C", f.tmp, "package"]);
  const sha256 = createHash("sha256").update(fs.readFileSync(archiveFile)).digest("hex");
  const options = { ...f, mode: "web", profile: "web", archiveFile, sha256, request: () => assert.fail("offline install used network"), log: () => {} };
  const called = path.join(f.home, "called.json");
  await bootstrapInstall({ ...options, dryRun: true, run: () => assert.fail("dry run executed a subprocess") });
  assert(!fs.existsSync(called));
  await assert.rejects(bootstrapInstall({ ...options, sha256: "0".repeat(64) }), /SHA256/);
  await assert.rejects(bootstrapInstall({ ...options, sha256: undefined }), /requires --archive/);
  await assert.rejects(bootstrapInstall({ ...options, mode: "unknown" }), /Invalid installation mode/);
  assert(!fs.existsSync(called));
  assert.equal((await bootstrapInstall(options)).installed, true);
  const result = JSON.parse(fs.readFileSync(called));
  assert.deepEqual({ profile: result.profile, surface: result.surface, cli: result.cli }, { profile: "web", surface: "web", cli: f.cli });
  assert.equal(result.args[0], "migrate");
  assert(!fs.existsSync(result.args[1]), "temporary archive removed after migration");
  assert.equal(fs.readFileSync(path.join(f.profile, "cordis.patch.yml"), "utf8"), "PRIVATE SETTINGS\n");
});

test("Linux shell entry forwards arguments, selects runtime/profile mode, and preserves failures", { skip: process.platform !== "linux" }, async t => {
  const f = fixture(t), script = path.join(f.tmp, "install.sh");
  fs.copyFileSync(path.resolve("scripts/install.sh"), script);
  fs.writeFileSync(path.join(f.tmp, "bootstrap-install.mjs"), `import fs from 'node:fs'; fs.writeFileSync(process.env.PURGE_TEST_RECORD,JSON.stringify({args:process.argv.slice(2),mode:process.env.PURGE_INSTALL_MODE,cli:process.env.PURGE_DSH_CLI,electron:process.env.ELECTRON_RUN_AS_NODE})); process.exitCode=Number(process.env.PURGE_TEST_EXIT||0);`);
  const env = { ...process.env, DSH_APP: "", DSH_NODE: process.execPath, PURGE_DSH_CLI: f.cli, DSH_HOME: f.home, DSH_PROFILE: "", PURGE_VERSION: "1.6.28", PURGE_TEST_RECORD: path.join(f.tmp, "record.json") };
  const run = async (args, extra = {}) => (await exec("/bin/sh", [script, ...args], { env: { ...env, ...extra }, encoding: "utf8" })).stdout;
  await run(["--dry-run", "--profile=custom", "--archive=/path with spaces/pkg.tgz"]);
  const result = JSON.parse(fs.readFileSync(env.PURGE_TEST_RECORD, "utf8"));
  assert.deepEqual(result.args, ["--version=1.6.28", "--dry-run", "--profile=custom", "--archive=/path with spaces/pkg.tgz"]);
  assert.equal(result.mode, "web"); assert.equal(result.cli, f.cli); assert.equal(result.electron, "1");
  await run([], { DSH_APP: process.execPath });
  const desktop = JSON.parse(fs.readFileSync(env.PURGE_TEST_RECORD, "utf8"));
  assert.equal(desktop.mode, "desktop");
  const bin = path.join(f.tmp, "bin"); fs.mkdirSync(bin);
  fs.chmodSync(f.cli, 0o755); fs.symlinkSync(f.cli, path.join(bin, "dsh"));
  await run([], { PURGE_DSH_CLI: "", PATH: bin + path.delimiter + process.env.PATH });
  assert.equal(JSON.parse(fs.readFileSync(env.PURGE_TEST_RECORD, "utf8")).cli, path.join(bin, "dsh"));
  await assert.rejects(() => run([], { PURGE_TEST_EXIT: "23" }), e => e.code === 23);
  await assert.rejects(() => run([], { PURGE_DSH_CLI: path.join(f.tmp, "missing") }), e => e.code === 1 && e.stderr.includes("DSH CLI not found"));
  await assert.rejects(() => run([], { DSH_APP: f.tmp }), e => e.code === 1 && e.stderr.includes("Runtime not found"));
  assert.match(await run(["--help"], { DSH_NODE: "/missing", PURGE_DSH_CLI: "/missing" }), /default profile web/);
});

test("downloaded Linux wrapper waits for bootstrap and cleans temporary files on success/failure", { skip: process.platform !== "linux" }, async t => {
  const f = fixture(t), bin = path.join(f.tmp, "bin"), standalone = path.join(f.tmp, "standalone");
  fs.mkdirSync(bin); fs.mkdirSync(standalone);
  const script = path.join(standalone, "install.sh"), source = path.join(f.tmp, "stub.mjs"), record = path.join(f.tmp, "record.json");
  fs.copyFileSync(path.resolve("scripts/install.sh"), script);
  fs.writeFileSync(source, `import fs from 'node:fs'; await new Promise(r=>setTimeout(r,50)); fs.writeFileSync(process.env.PURGE_TEST_RECORD,JSON.stringify({entry:process.argv[1],args:process.argv.slice(2)}));process.exitCode=Number(process.env.PURGE_TEST_EXIT||0);`);
  fs.writeFileSync(path.join(bin, "curl"), '#!/bin/sh\nif [ "${PURGE_TEST_CURL_EXIT:-0}" != 0 ]; then exit "$PURGE_TEST_CURL_EXIT"; fi\nwhile [ "$#" -gt 0 ]; do\n  if [ "$1" = -o ]; then shift; dest=$1; fi\n  shift\ndone\ncp "$PURGE_TEST_BOOTSTRAP" "$dest"\n', { mode: 0o755 });
  const env = { ...process.env, PATH: bin + path.delimiter + process.env.PATH, DSH_APP: "", DSH_NODE: process.execPath, PURGE_DSH_CLI: f.cli, PURGE_VERSION: "", TMPDIR: f.tmp, PURGE_TEST_RECORD: record, PURGE_TEST_BOOTSTRAP: source };
  await exec("/bin/sh", [script, "--dry-run"], { env });
  let result = JSON.parse(fs.readFileSync(record, "utf8"));
  assert.deepEqual(result.args, ["--dry-run"]);
  assert(!fs.existsSync(path.dirname(result.entry)), "download cleaned after bootstrap finishes");
  await assert.rejects(exec("/bin/sh", [script], { env: { ...env, PURGE_TEST_EXIT: "23" } }), e => e.code === 23);
  result = JSON.parse(fs.readFileSync(record, "utf8"));
  assert(!fs.existsSync(path.dirname(result.entry)), "bootstrap failure also cleans temporary download");
  fs.unlinkSync(record);
  await assert.rejects(exec("/bin/sh", [script], { env: { ...env, PURGE_TEST_CURL_EXIT: "7" } }), e => e.code === 7);
  assert(!fs.existsSync(record), "download failure never runs bootstrap");
  assert(!fs.readdirSync(f.tmp).some(name => name.startsWith("purge-bootstrap.")));
});

// Exercise the real bootstrap/extracted CLI in temporary homes, without a live
// service. macOS also exercises these POSIX file semantics; CI runs Linux itself.
test('Linux migration failure preserves first-install and existing host launchers; success activates last', {skip:process.platform==='win32'||process.getuid?.()===0}, async t => {
 const f=fixture(t), userHome=path.join(f.tmp,'user'), official=path.join(f.tmp,'official');
 const cli=path.join(official,'lib/bin.js'), base=path.join(official,'node_modules/@deepseek-ai');
 fs.mkdirSync(path.dirname(cli),{recursive:true}); fs.mkdirSync(base,{recursive:true});
 const manifest=path.join(official,'package.json');
 const writeHost=version=>fs.writeFileSync(manifest,JSON.stringify({name:'@deepseek-ai/dsh',version,bin:{dsh:'lib/bin.js'}}));
 writeHost('0.2.1-rc.1');
 fs.writeFileSync(cli,'#!/usr/bin/env node\nconsole.log("isolated host")\n',{mode:0o755});
 fs.chmodSync(official,0o555); fs.chmodSync(base,0o555);
 // Restore permissions before fixture's recursive cleanup (also works on Node 18).
 const writable=()=>{fs.chmodSync(official,0o755);fs.chmodSync(base,0o755);};
 try {
  const pack=path.join(f.tmp,'package');fs.mkdirSync(path.join(pack,'bin'),{recursive:true});
  fs.writeFileSync(path.join(pack,'package.json'),JSON.stringify({name:'dsh-purge-community',version:'1.6.32',repository:{url:'git+https://github.com/kingcharleslzy-ai/dsh-purge.git'}}));
  const archiveFile=path.join(f.tmp,'dsh-purge-community-1.6.32.tgz');
  const makeArchive=async source=>{
   fs.writeFileSync(path.join(pack,'bin/community.js'),source);
   await exec('tar',['-czf',archiveFile,'-C',f.tmp,'package']);
   return createHash('sha256').update(fs.readFileSync(archiveFile)).digest('hex');
  };
  const options={...f,cli,userHome,mode:'web',platform:'linux',profile:'web',archiveFile,log:()=>{}};
  const launcher=path.join(userHome,'.local/bin/dsh');
  const settings=fs.readFileSync(path.join(f.profile,'cordis.patch.yml'));
  const failure=await makeArchive('process.exit(42);');
  await assert.rejects(bootstrapInstall({...options,sha256:failure}),error=>error.code===42);
  assert.throws(()=>fs.lstatSync(launcher),{code:'ENOENT'});
  const oldHost=prepareLinuxHost(cli,{userHome,log:()=>{}});oldHost.activate();
  const previous=fs.readlinkSync(launcher), previousStat=fs.lstatSync(launcher);
  writable();writeHost('0.2.1-rc.2');fs.chmodSync(official,0o555);fs.chmodSync(base,0o555);
  await assert.rejects(bootstrapInstall({...options,sha256:failure}),error=>error.code===42);
  assert.equal(fs.readlinkSync(launcher),previous);
  assert.equal(fs.lstatSync(launcher).ino,previousStat.ino);
  assert.deepEqual(fs.readFileSync(path.join(f.profile,'cordis.patch.yml')),settings);
  // The migration child observes the old link; only its successful exit allows activation.
  const success=await makeArchive(`const fs=require('node:fs');if(fs.readlinkSync(${JSON.stringify(launcher)})!==${JSON.stringify(previous)})process.exit(43);`);
  const result=await bootstrapInstall({...options,sha256:success});assert.equal(result.installed,true);
  assert.notEqual(fs.readlinkSync(launcher),previous);
  assert(fs.existsSync(previous),'old host remains available for rollback');
  assert.deepEqual(fs.readFileSync(path.join(f.profile,'cordis.patch.yml')),settings);
 } finally {writable();}
});

test('activation refuses a concurrently changed user launcher and copy failure leaves no active entry', {skip:process.platform==='win32'||process.getuid?.()===0}, t => {
 const f=fixture(t), userHome=path.join(f.tmp,'user'), official=path.join(f.tmp,'official');
 const cli=path.join(official,'lib/bin.js'),base=path.join(official,'node_modules/@deepseek-ai');
 fs.mkdirSync(path.dirname(cli),{recursive:true});fs.mkdirSync(base,{recursive:true});
 fs.writeFileSync(path.join(official,'package.json'),JSON.stringify({name:'@deepseek-ai/dsh',version:'fixture',bin:{dsh:'lib/bin.js'}}));
 fs.writeFileSync(cli,'#!/usr/bin/env node\n',{mode:0o755});fs.chmodSync(official,0o555);fs.chmodSync(base,0o555);
 try {
  const prepared=prepareLinuxHost(cli,{userHome,log:()=>{}});
  fs.mkdirSync(path.dirname(prepared.launcher),{recursive:true});fs.writeFileSync(prepared.launcher,'my command');
  assert.throws(()=>prepared.activate(),/changed during installation/);
  assert.equal(fs.readFileSync(prepared.launcher,'utf8'),'my command');
  fs.unlinkSync(prepared.launcher);fs.chmodSync(official,0o755);fs.chmodSync(base,0o755);
  fs.appendFileSync(path.join(official,'package.json'),' ');fs.symlinkSync(f.cli,path.join(base,'external'));
  fs.chmodSync(official,0o555);fs.chmodSync(base,0o555);
  assert.throws(()=>prepareLinuxHost(cli,{userHome,log:()=>{}}),/symlink escapes/);
  assert(!fs.existsSync(prepared.launcher));
  assert(!fs.readdirSync(path.join(userHome,'.local/share/dsh-purge/hosts')).some(name=>name.startsWith('.stage-')));
 } finally {fs.chmodSync(official,0o755);fs.chmodSync(base,0o755);}
});
