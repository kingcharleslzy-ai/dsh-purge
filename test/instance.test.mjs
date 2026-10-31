import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveProfile, currentHost, resolveDshCli, normalizeHostBase, diagnosticHost } from "../lib/instance.js";
import {
  Maintenance,
  defaultProfile,
  installWithDsh,
} from "../lib/community.js";
import { selfCheck, hostLayoutLayer, resolveHost } from "../lib/selfcheck.js";
import { patchDrift } from "../lib/core.js";
function fixture() {
  const root = fs.realpathSync(
    fs.mkdtempSync(path.join(os.tmpdir(), "purge-instance-")),
  );
  const home = path.join(root, "home");
  fs.mkdirSync(home);
  const profile = (name) => {
    const p = path.join(home, "profiles", name);
    fs.mkdirSync(p, { recursive: true });
    fs.writeFileSync(path.join(p, "package.json"), "{}");
    return p;
  };
  const npm = path.join(root, "npm/node_modules/@deepseek-ai");
  const pkg = path.join(npm, "dsh");
  fs.mkdirSync(path.join(pkg, "lib"), { recursive: true });
  fs.writeFileSync(
    path.join(pkg, "package.json"),
    JSON.stringify({ name: "@deepseek-ai/dsh", bin: { dsh: "lib/bin.mjs" } }),
  );
  const cli = path.join(pkg, "lib/bin.mjs");
  fs.writeFileSync(
    cli,
    `import fs from 'node:fs';fs.writeFileSync(process.env.DSH_HOME+'/invocation.json',JSON.stringify({args:process.argv.slice(2),home:process.env.DSH_HOME,profile:process.env.DSH_PROFILE}));`,
  );
  const resources = path.join(root, "Desktop.app/Contents/Resources"),
    desktop = path.join(resources, "app/dsh/node_modules/@deepseek-ai");
  fs.mkdirSync(path.join(desktop, "dsh-desktop-host/lib"), { recursive: true });
  fs.writeFileSync(path.join(resources, "app.asar"), "fixture archive");
  fs.writeFileSync(path.join(desktop, "dsh-desktop-host/lib/cli.js"), "");
  return {
    root,
    home,
    profile,
    npm,
    cli,
    desktop,
    resources,
    close: () => fs.rmSync(root, { recursive: true, force: true }),
  };
}

test("#40 archive diagnostics select only the same installation's physical target", () => {
  const f = fixture();
  try {
    const archive = f.desktop.replace(`${path.sep}app${path.sep}`, `${path.sep}app.asar${path.sep}`);
    const unpacked = f.desktop.replace(`${path.sep}app${path.sep}`, `${path.sep}app.asar.unpacked${path.sep}`);
    fs.mkdirSync(path.join(unpacked, "dsh-agent-loop"), {recursive:true});
    fs.writeFileSync(path.join(unpacked, "dsh-agent-loop/package.json"), "{}");
    const options = {env:{},argv:[],aiBase:archive};
    assert.equal(currentHost(options), archive, "installer entry semantics remain unchanged");
    assert.equal(diagnosticHost(options), f.desktop, "partial app must not fall through to healthier unpacked sibling");
    fs.rmSync(path.join(f.resources, "app/dsh"), {recursive:true});
    assert.equal(diagnosticHost(options), f.desktop, "incomplete extraction stays on app even when the component root is missing");
    fs.rmSync(path.join(f.resources, "app"), {recursive:true});
    assert.equal(diagnosticHost(options), unpacked);
    fs.rmSync(path.join(f.resources, "app.asar.unpacked"), {recursive:true});
    assert.equal(diagnosticHost(options), f.desktop, "unextracted expected path stays missing");
    assert.equal(diagnosticHost({...options,aiBase:unpacked}), unpacked, "explicit physical path is never redirected");
    assert.equal(diagnosticHost({env:{},argv:[]}), "", "no global or other-app fallback");
    const reader = {statSync(){throw Object.assign(Error("denied"),{code:"EACCES"});}};
    assert.equal(diagnosticHost({...options,diskReader:reader}), f.desktop, "unreadable preferred target is not skipped");
  } finally {f.close();}
});

test("#40 standalone diagnose without a selected instance stays unknown", () => {
  const f = fixture();
  try {
    const env = {...process.env,DSH_HOME:f.home};
    delete env.DSH_BASE; delete env.PURGE_DSH_CLI;
    const result = spawnSync(process.execPath, ["bin/community.js","diagnose","--json"], {env,encoding:"utf8"});
    assert.equal(result.status,0,result.stderr);
    const report = JSON.parse(result.stdout);
    assert.equal(report.host,"");
    assert.equal(report.state,"unknown");
    assert.equal(report.checked,0);
    assert.deepEqual(report.missing,[]);
  } finally {f.close();}
});

test("#40 drift diagnostics use the selected surface rather than the caller's environment", async () => {
  const f = fixture();
  try {
    const patches = [
      {id:998,file:"agent-instructions",surfaces:["web"],replacements:[]},
      {id:999,file:"agent-instructions",surfaces:["desktop"],replacements:[]},
    ];
    for (const [surface, expected] of [["desktop",999],["web",998]]) {
      const report = await patchDrift(f.desktop,patches,{surface,dshHome:f.home});
      assert.equal(report.checked,1);
      assert.deepEqual(report.missing.map(row=>row.id),[expected]);
    }
  } finally {f.close();}
});
test("unique web profile is shared by maintenance and diagnostics, without desktop fallback", async () => {
  const f = fixture();
  try {
    const p = f.profile("web");
    fs.writeFileSync(
      path.join(p, "cordis.patch.yml"),
      "defaultPreset: workspace-write\n",
    );
    const options = {
      env: {},
      argv: [],
      coreModule: { ALL_PATCHES: [], patchStatus: async () => ({}) },
    };
    assert.equal(defaultProfile(f.home, options), p);
    const report = await selfCheck(f.npm, f.home, options);
    const cfg = report.layers.find((x) => x.kind === "config");
    assert.equal(cfg.detail.file, path.join(p, "cordis.patch.yml"));
    assert.equal(
      cfg.ok,
      false,
      "intentional permissions must remain an actual config state",
    );
    assert.equal(
      fs.readFileSync(cfg.detail.file, "utf8"),
      "defaultPreset: workspace-write\n",
    );
  } finally {
    f.close();
  }
});
test("profile resolution honors explicit path, host argv, both profile flag forms, then env", () => {
  const f = fixture();
  try {
    const web = f.profile("web"),
      desktop = f.profile("desktop"),
      base = {
        env: { DSH_PROFILE: "desktop" },
        argv: ["node", "dsh", "--profile", "web"],
      };
    assert.equal(resolveProfile(f.home, base).directory, web);
    assert.equal(
      resolveProfile(f.home, {
        ...base,
        argv: ["node", "dsh", "--profile=web"],
      }).directory,
      web,
    );
    assert.equal(
      resolveProfile(f.home, { ...base, argv: ["node", "host", web] })
        .directory,
      web,
    );
    assert.equal(
      resolveProfile(f.home, { ...base, profile: desktop }).directory,
      desktop,
    );
    assert.equal(
      resolveProfile(f.home, { env: { DSH_PROFILE: "web" }, argv: [] })
        .directory,
      web,
    );
    assert.equal(
      resolveProfile(f.home, { env: { PURGE_PROFILE_DIR: web }, argv: [] })
        .directory,
      web,
    );
  } finally {
    f.close();
  }
});
test("ambiguous, missing or conflicting profiles fail explicitly instead of choosing desktop", async () => {
  const f = fixture();
  try {
    f.profile("web");
    f.profile("desktop");
    assert.throws(
      () => defaultProfile(f.home, { env: {}, argv: [] }),
      /无法唯一确定/,
    );
    assert.throws(
      () =>
        defaultProfile(f.home, { env: { DSH_PROFILE: "missing" }, argv: [] }),
      /未找到/,
    );
    assert.throws(
      () =>
        defaultProfile(f.home, {
          env: {},
          argv: ["--profile", "web", "--profile=desktop"],
        }),
      /多个 --profile/,
    );
    const r = await selfCheck(f.npm, f.home, {
      env: {},
      argv: [],
      coreModule: { ALL_PATCHES: [], patchStatus: async () => ({}) },
    });
    assert(
      r.layers
        .find((l) => l.kind === "config")
        .detail.error.includes("无法唯一确定"),
    );
  } finally {
    f.close();
  }
});
test("a nested single-package host root resolves to the component directory that actually holds the agent", () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-nested-host-")));
  try {
    // 单包布局：@deepseek-ai/dsh/node_modules/@deepseek-ai/{dsh-agent-loop,…}
    const outer = path.join(root, "@deepseek-ai");
    const nested = path.join(outer, "dsh", "node_modules", "@deepseek-ai");
    for (const pkg of ["dsh-agent-loop", "dsh-system-prompt", "dsh-agent-instructions"]) {
      fs.mkdirSync(path.join(nested, pkg, "lib"), { recursive: true });
      fs.writeFileSync(path.join(nested, pkg, "package.json"), JSON.stringify({ name: `@deepseek-ai/${pkg}`, version: "0.2.1-rc.2" }));
    }
    fs.mkdirSync(path.join(outer, "dsh", "lib"), { recursive: true });
    fs.writeFileSync(path.join(outer, "dsh", "package.json"), JSON.stringify({ name: "@deepseek-ai/dsh", version: "0.2.1-rc.2", bin: { dsh: "lib/bin.mjs" } }));
    fs.writeFileSync(path.join(outer, "dsh", "lib", "bin.mjs"), "");

    // 指到外层、指到 dsh 包、指到组件根，三种写法都要落到组件根。
    for (const given of [outer, path.join(outer, "dsh"), nested]) {
      assert.equal(resolveHost(given, { env: {}, argv: [] }), nested, `aiBase=${given}`);
      assert.equal(resolveHost("", { env: { DSH_BASE: given }, argv: [] }), nested, `DSH_BASE=${given}`);
    }
    // 从 dsh 自己的 CLI 启动（argv）时返回 dsh 包所在的 @deepseek-ai 外层：
    // 这是 resolveDshCli 拼 dsh/<bin> 的基准，改成组件根会让 npmCli 找不到 bin。
    assert.equal(currentHost({ env: {}, argv: ["node", path.join(outer, "dsh", "lib", "bin.mjs")] }), outer);
    // 指到不相干目录时不许「顺手找到」别的安装。
    assert.equal(currentHost({ env: { DSH_BASE: path.join(root, "elsewhere") }, argv: [] }), path.join(root, "elsewhere"));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
test("Web CLI uses its own npm package metadata even when another Desktop is installed", () => {
  const f = fixture();
  try {
    const argv = ["node", f.cli, "web"];
    assert.equal(currentHost({ argv, env: {} }), f.npm);
    const cli = resolveDshCli({
      argv,
      env: {},
      resourcesPath: f.resources,
      execPath: process.execPath,
    });
    assert.equal(cli.cli, f.cli);
    assert.equal(cli.source, "当前 npm/Node 实例");
    assert.equal(cli.command, process.execPath);
  } finally {
    f.close();
  }
});
test("explicit JS CLI override takes priority and a missing target is not replaced by another install", () => {
  const f = fixture();
  try {
    assert.equal(
      resolveDshCli({ aiBase: f.desktop, env: { PURGE_DSH_CLI: f.cli } }).cli,
      f.cli,
    );
    assert.throws(
      () =>
        resolveDshCli({
          env: {},
          argv: ["node", "unknown"],
          resourcesPath: undefined,
        }),
      /无法定位当前 DSH 实例/,
    );
    assert.throws(
      () =>
        resolveDshCli({
          env: { PURGE_DSH_CLI: path.join(f.root, "missing") },
          argv: [],
        }),
      /文件不存在/,
    );
  } finally {
    f.close();
  }
});
test("headless installer executes npm CLI with the exact home and selected profile", async () => {
  const f = fixture();
  try {
    const p = f.profile("web");
    const manager = new Maintenance({
      home: f.home,
      profile: p,
      aiBase: f.npm,
    });
    await installWithDsh("/fixture.tgz", manager, {
      env: {},
      argv: ["node", f.cli, "web"],
      resourcesPath: undefined,
    });
    const invocation = JSON.parse(
      fs.readFileSync(path.join(f.home, "invocation.json"), "utf8"),
    );
    assert.deepEqual(invocation, {
      args: ["plugin", "--profile", "web", "add", "/fixture.tgz"],
      home: f.home,
      profile: "web",
    });
  } finally {
    f.close();
  }
});
test("Web host layout is explicitly not applicable, without probing a coexisting sealed Desktop", () => {
  const f = fixture();
  try {
    const layer = hostLayoutLayer(f.npm, {
      statSync() {
        throw Error("must not scan another app");
      },
    });
    assert.equal(layer.state, "na");
    assert.equal(layer.applicable, false);
    assert.equal(layer.total, 0);
    assert.equal(layer.applied, 0);
    assert.equal(layer.detail.asar_still_sealed, null);
  } finally {
    f.close();
  }
});
test("Desktop layout checks only the requested resource directory and reports uncertainty", () => {
  const f = fixture();
  try {
    assert.equal(
      hostLayoutLayer(f.desktop).detail.archive,
      path.join(f.resources, "app.asar"),
    );
    assert.equal(hostLayoutLayer(f.desktop).state, "broken");
    fs.unlinkSync(path.join(f.resources, "app.asar"));
    assert.equal(hostLayoutLayer(f.desktop).state, "ok");
    assert.equal(hostLayoutLayer("").detail.surface, "unknown");
    assert.equal(hostLayoutLayer("").ok, false);
  } finally {
    f.close();
  }
});
test("target-specific selfcheck does not mutate global surface or inspect another Desktop", async () => {
  const f = fixture();
  try {
    f.profile("web");
    const before = process.env.DSH_SURFACE;
    let target;
    const result = await selfCheck(f.npm, f.home, {
      env: {},
      argv: [],
      coreModule: {
        ALL_PATCHES: [],
        patchStatus: async (host, patches, options) => {
          target = { host, ...options };
          return {};
        },
      },
    });
    assert.equal(target.host, f.npm);
    assert.equal(target.surface, "web");
    assert.equal(process.env.DSH_SURFACE, before);
    assert.equal(result.summary.layout.total, 0);
    assert(!result.hints.some((h) => h.title === "宿主运行方式"));
  } finally {
    f.close();
  }
});

test("foreign host profile directories are rejected instead of silently changing DSH_HOME target", () => {
  const f = fixture();
  try {
    f.profile("web");
    assert.throws(
      () =>
        resolveProfile(f.home, {
          env: {},
          argv: ["node", "host", path.join(f.root, "other/profiles/web")],
        }),
      /不属于当前 DSH_HOME/,
    );
  } finally {
    f.close();
  }
});
test("Desktop CLI discovery stays in the explicitly requested resources", () => {
  const f = fixture();
  try {
    const cli = resolveDshCli({
      aiBase: f.desktop,
      env: {},
      argv: [],
      execPath: process.execPath,
    });
    assert.equal(cli.cli, path.join(f.desktop, "dsh-desktop-host/lib/cli.js"));
    assert.deepEqual(cli.args, ["--expose-internals", cli.cli]);
  } finally {
    f.close();
  }
});
test("symlinked npm entry resolves to the same package, without consulting PATH", () => {
  const f = fixture();
  try {
    const link = path.join(f.root, "dsh-link");
    fs.symlinkSync(f.cli, link);
    assert.equal(currentHost({ env: {}, argv: ["node", link, "web"] }), f.npm);
    assert.equal(
      resolveDshCli({ env: {}, argv: ["node", link, "web"] }).cli,
      f.cli,
    );
  } finally {
    f.close();
  }
});
test("unreadable Desktop archive is uncertainty, not a successful layout check", () => {
  const f = fixture();
  try {
    const layer = hostLayoutLayer(f.desktop, {
      statSync() {
        throw Object.assign(Error("permission denied"), { code: "EACCES" });
      },
    });
    assert.equal(layer.ok, false);
    assert.equal(layer.detail.asar_still_sealed, null);
    assert.equal(layer.broken[0].status, "unreadable");
  } finally {
    f.close();
  }
});

test("an unresolved nonempty host path is unknown rather than an assumed Web installation", () => {
  const f = fixture();
  try {
    const layer = hostLayoutLayer(path.join(f.root, "missing-host"));
    assert.equal(layer.detail.surface, "unknown");
    assert.equal(layer.ok, false);
    assert.equal(layer.applied, 0);
  } finally {
    f.close();
  }
});

test("a symlinked profile keeps its logical CLI name while using the canonical data directory", async () => {
  const f = fixture();
  try {
    const target = path.join(f.root, "external-config");
    fs.mkdirSync(target);
    fs.writeFileSync(path.join(target, "package.json"), "{}");
    fs.mkdirSync(path.join(f.home, "profiles"));
    const logical = path.join(f.home, "profiles/web");
    fs.symlinkSync(target, logical);
    assert.equal(
      defaultProfile(f.home, { env: {}, argv: ["node", "host", logical] }),
      target,
    );
    const manager = new Maintenance({
      home: f.home,
      profile: logical,
      aiBase: f.npm,
    });
    await installWithDsh("/fixture.tgz", manager, { env: {}, argv: [] });
    const invocation = JSON.parse(
      fs.readFileSync(path.join(f.home, "invocation.json"), "utf8"),
    );
    assert.equal(invocation.profile, "web");
  } finally {
    f.close();
  }
});

test("apply restart distinguishes sealed / cross-surface / manual", async () => {
  const { planApplyRestartAction } = await import("../lib/core.js");
  assert.deepEqual(planApplyRestartAction({ sealed: true }), { action: "swap" });
  assert.deepEqual(planApplyRestartAction({ foreign: { asar: "/x/app.asar" }, desktopPid: 42 }), {
    action: "swap-foreign",
    waitPid: 42,
  });
  const manual = planApplyRestartAction({ foreign: { asar: "/x/app.asar" }, desktopPid: 0 });
  assert.equal(manual.action, "manual");
  assert.match(manual.reason, /桌面宿主未运行/);
  assert.deepEqual(planApplyRestartAction({}), { action: "plain" });
});

test("diskFs survives a read-only process.noDeprecation", async () => {
  // PR #23：宿主用 --no-deprecation 启动时该属性只读，ESM 严格模式下赋值会抛
  const { execFileSync } = await import("node:child_process");
  const script = `
    Object.defineProperty(process, "noDeprecation", { value: true, writable: false, configurable: true });
    const { diskFs } = await import(${JSON.stringify(new URL("../lib/extract-asar.js", import.meta.url).href)});
    diskFs();
    console.log("ok");
  `;
  const out = execFileSync(process.execPath, ["--input-type=module", "-e", script], { encoding: "utf8" });
  assert.match(out, /ok/);
});

test("the read-only property comes from the flag, not the Node version", async () => {
  const { execFileSync } = await import("node:child_process");
  const probe =
    'const d=Object.getOwnPropertyDescriptor(process,"noDeprecation");' +
    'console.log(d?JSON.stringify(d):"undefined")';
  const withFlag = execFileSync(process.execPath, ["--input-type=module", "-e", probe], {
    encoding: "utf8",
    env: { ...process.env, NODE_OPTIONS: "--no-deprecation" },
  });
  const desc = JSON.parse(withFlag.trim().split("\n").pop());
  assert.equal(desc.writable, false, "--no-deprecation makes it non-writable");
  const without = execFileSync(process.execPath, ["--input-type=module", "-e", probe], {
    encoding: "utf8",
    env: { ...process.env, NODE_OPTIONS: "" },
  });
  assert.equal(without.trim().split("\n").pop(), "undefined");
});

// Regression: diagnostics must not change the package root used by installation.
test("nested host discovery preserves CLI installation and normalizes diagnostics for every entry", async () => {
  const f = fixture();
  try {
    f.profile("web");
    const pkg = path.join(f.npm, "dsh");
    const nested = path.join(pkg, "node_modules/@deepseek-ai");
    for (const name of ["dsh-agent-loop", "dsh-system-prompt", "dsh-agent-instructions"]) {
      fs.mkdirSync(path.join(nested, name, "lib"), {recursive:true});
      fs.writeFileSync(path.join(nested,name,"package.json"), JSON.stringify({name:`@deepseek-ai/${name}`,version:"0.2.1-rc.2"}));
    }
    const entries = [
      ...[f.npm,pkg,nested].map(aiBase=>({aiBase,env:{},argv:[]})),
      ...[f.npm,pkg,nested].map(base=>({env:{DSH_BASE:base},argv:[]})),
      {env:{PURGE_DSH_CLI:f.cli},argv:[]},
      {env:{},argv:["node",f.cli]},
    ];
    for (const entry of entries) {
      assert.equal(resolveHost(entry.aiBase || "",entry),nested);
      assert.equal(resolveDshCli({...entry,resourcesPath:f.resources}).cli,f.cli);
      let inspected;
      const report=await selfCheck(entry.aiBase || "",f.home,{...entry,coreModule:{ALL_PATCHES:[],patchStatus:async host=>{inspected=host;return {};}}});
      assert.equal(inspected,nested);
      assert.equal(report.level,"qualified");
    }
    // Exercise the actual installWithDsh subprocess, not only its path helper.
    const manager=new Maintenance({home:f.home,profile:path.join(f.home,"profiles/web"),aiBase:nested});
    await installWithDsh("/fixture.tgz",manager,{env:{},argv:[],resourcesPath:f.resources});
    assert.equal(JSON.parse(fs.readFileSync(path.join(f.home,"invocation.json"))).profile,"web");
  } finally { f.close(); }
});

test("selfcheck never falls back to another install when startup target is absent or invalid", () => {
  assert.equal(resolveHost("",{env:{},argv:[]}),"");
  assert.equal(resolveHost("",{env:{PURGE_DSH_CLI:"/not-a-real-instance/dsh.js"},argv:[]}),"");
});

test("component discovery is bounded and never searches parents or other installations", () => {
  const requested = path.resolve("isolated-target");
  const probes = [];
  const reader = {
    realpathSync: p => p,
    statSync(p) { probes.push(p); throw Object.assign(Error("absent"),{code:"ENOENT"}); },
  };
  assert.equal(normalizeHostBase(requested,reader),requested);
  assert.equal(probes.length,9);
  assert(probes.every(p => p.startsWith(requested + path.sep)));
});

test("verified npm CLI shorthand selects its running profile when multiple profiles exist", () => {
  const f = fixture();
  try {
    const web = f.profile("web"), desktop = f.profile("desktop");
    const options = { env: { DSH_PROFILE: "desktop" }, argv: ["node", f.cli, "web"] };
    assert.equal(resolveProfile(f.home, options).directory, web);
    assert.equal(resolveProfile(f.home, { ...options, argv: ["node", f.cli, "web", "--profile=desktop"] }).directory, desktop);
    if (process.platform !== "win32") {
      const bin = path.join(f.root, "bin"); fs.mkdirSync(bin);
      const link = path.join(bin, "dsh"); fs.symlinkSync(f.cli, link);
      assert.equal(resolveProfile(f.home, { env: {}, argv: ["node", link, "web"] }).directory, web);
    }
    assert.throws(() => resolveProfile(f.home, { env: {}, argv: ["node", path.join(f.root, "other.js"), "web"] }), /无法唯一确定/);
    const nested = path.join(f.npm, "dsh/node_modules/other-plugin/bin.js");
    fs.mkdirSync(path.dirname(nested), { recursive: true }); fs.writeFileSync(nested, "");
    assert.throws(() => resolveProfile(f.home, { env: {}, argv: ["node", nested, "web"] }), /无法唯一确定/);
    assert.throws(() => resolveProfile(f.home, { env: {}, argv: ["node", f.cli, "plugin"] }), /无法唯一确定/);
  } finally { f.close(); }
});

test("packaged community diagnostics stay within verified Electron resources", () => {
  const root = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "purge-diagnostic-")));
  const resources = path.join(root, "resources"), app = path.join(resources, "app");
  const host = path.join(app, "node_modules/@deepseek-ai");
  fs.mkdirSync(path.join(app,"lib"), {recursive:true});
  fs.mkdirSync(host, {recursive:true});
  fs.writeFileSync(path.join(app,"package.json"), JSON.stringify({name:"dsh-plugin-desktop",main:"lib/main.js",version:"2.0.18"}));
  fs.writeFileSync(path.join(app,"lib/main.js"), "// fixture");
  const options = {env:{}, argv:["electron", "--updated"], resourcesPath:resources, electron:"44.0.0"};
  try {
    assert.equal(currentHost(options), "", "write target must not change");
    assert.equal(diagnosticHost(options), host);
    assert.equal(diagnosticHost({...options,electron:false}), "");
    assert.throws(() => diagnosticHost({...options,diskReader:{...fs,statSync(file){
      if(file === host) throw Object.assign(Error("denied"),{code:"EACCES"});
      return fs.statSync(file);
    }}}), /denied/, "do not hide access errors by choosing another component root");
    assert.equal(diagnosticHost({...options,env:{PURGE_DSH_CLI:path.join(root,"missing.js")}}), "");
    assert.equal(diagnosticHost({...options,resourcesPath:path.join(root,"unrelated")}), "");
    fs.rmSync(host,{recursive:true});
    const sibling = path.join(resources,"app.asar.unpacked/node_modules/@deepseek-ai");
    fs.mkdirSync(sibling,{recursive:true});
    assert.equal(diagnosticHost(options), host, "partial preferred extraction must not borrow a healthy sibling");
    assert.equal(fs.existsSync(host), false, "diagnostic lookup must not create files");
  } finally { fs.rmSync(root,{recursive:true,force:true}); }
});
