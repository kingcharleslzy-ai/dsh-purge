import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
// 发行包 smoke test：不依赖 DSH 真机，验证"打出来的 tgz 至少能导入、能解析"。
// CI 在 npm pack 之后跑它；本地 `npm run smoke` 同理。
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];
const ok = (label) => console.log("  ✓ " + label);

const sourceManifest = JSON.parse(fs.readFileSync(path.join(root,"package.json"),"utf8"));
const tgz = process.env.SMOKE_TGZ || path.join(root, `${sourceManifest.name}-${sourceManifest.version}.tgz`);
if (!tgz || !fs.existsSync(tgz)) {
  console.error("✗ 找不到 tgz；先跑 npm pack");
  process.exit(1);
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "purge-smoke-"));
try {
  execFileSync("tar", ["-xzf", tgz, "-C", tmp]);
  const pkgDir = path.join(tmp, "package");
  const pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"));

  if (pkg.name !== sourceManifest.name || pkg.version !== sourceManifest.version) throw Error("Packed artifact does not match current manifest");

  // The standalone bootstrap invokes migrate before npm has installed yaml or peers.
  const bootstrapHome = path.join(tmp,"bootstrap-home"), profile = path.join(bootstrapHome,"profiles/desktop");
  fs.mkdirSync(profile,{recursive:true});fs.writeFileSync(path.join(profile,"package.json"),"{}");
  const bootEnv={...process.env,DSH_HOME:bootstrapHome,DSH_PROFILE:"desktop",PURGE_PROFILE_DIR:profile,PURGE_DSH_CLI:"",DSH_BASE:""};
  const boot = execFileSync(process.execPath,[path.join(pkgDir,"bin/community.js"),"status"],{env:bootEnv,encoding:"utf8",timeout:30000});
  if(JSON.parse(boot).package !== pkg.name) throw Error("Dependency-free bootstrap entry failed");
  ok("未安装依赖的解压包可以启动引导 CLI");

  // Validate the preview manifest against the extracted archive, not the checkout.
  for (const preview of JSON.parse(fs.readFileSync(path.join(pkgDir, "screenshots.json"), "utf8"))) {
    if (!fs.statSync(path.join(pkgDir, preview)).isFile()) throw Error("Missing packaged screenshot: " + preview);
  }
  // Install the packed artifact's declared dependencies, not source-tree node_modules.
  const installArgs = ["install", "--ignore-scripts", "--legacy-peer-deps", "--omit=dev", "--no-audit", "--no-fund"];
  // Node cannot exec a .cmd file directly. This command contains only fixed arguments;
  // the temporary package path is passed as cwd, never interpolated into shell code.
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npm ${installArgs.join(" ")}`], {cwd:pkgDir,stdio:"pipe",timeout:120000});
  } else {
    execFileSync("npm", installArgs, {cwd:pkgDir,stdio:"pipe",timeout:120000});
  }

  // 1) 导出映射指向的文件都存在
  for (const [key, target] of Object.entries(pkg.exports || {})) {
    const rel = typeof target === "string" ? target : target && target.default;
    if (!rel) continue;
    if (!fs.existsSync(path.join(pkgDir, rel))) problems.push(`exports["${key}"] -> ${rel} 不存在`);
  }
  if (!problems.length) ok(`${Object.keys(pkg.exports || {}).length} 个导出目标都存在`);

  // 2) 每个入口都能 import
  for (const spec of ["./lib/index.js", "./lib/presets-plugin.js", "./lib/selfcheck.js", "./lib/probe.js", "./lib/audit.js"]) {
    const mod = await import(pathToFileURL(path.join(pkgDir, spec)).href);
    if (!mod || typeof mod !== "object") problems.push(`${spec} 导入失败`);
  }
  ok("核心模块可从发行包导入");

  // 3) 自带预设能被 registry 的解析器读成合法定义
  const composition = await import(pathToFileURL(path.join(pkgDir, "lib/redteam/preset-composition.js")).href);
  const def = composition.readPresetDefinition("unrestricted", path.join(pkgDir, "presets/unrestricted"));
  if (def.id !== "unrestricted" || !Array.isArray(def.plugins) || def.plugins.length < 15)
    problems.push(`预设解析异常：${def.id} / ${def.plugins?.length} 行`);
  else ok(`预设解析：${def.plugins.length} 行`);

  // 4) bundle patch 里的条目名与包名一致
  const yml = fs.readFileSync(path.join(pkgDir, "cordis.patch.yml"), "utf8");
  for (const needle of ["dsh-purge-community", "dsh-purge-community/presets-plugin", "dsh-purge-community/redteam"])
    if (!yml.includes(needle)) problems.push(`cordis.patch.yml 缺少 ${needle}`);
  if (!problems.length) ok("bundle patch 条目完整");

  // 5) CLI 在空目录里也能给出 status（不崩）
  const home = path.join(tmp, "home");
  fs.mkdirSync(home, { recursive: true });
  const out = execFileSync(process.execPath, [path.join(pkgDir, "bin/community.js"), "status"], {
    env: { ...process.env, DSH_HOME: home },
    encoding: "utf8",
  });
  if (!out.includes("Purge")) problems.push("status 输出异常");
  else ok("CLI status 可用");

  // 6) 自检在无宿主时给出 broken 而不是抛异常
  const selfcheck = await import(pathToFileURL(path.join(pkgDir, "lib/selfcheck.js")).href);
  const report = await selfcheck.selfCheck("", home);
  if (report.state !== "broken") problems.push(`无宿主时 selfcheck 应为 broken，实际 ${report.state}`);
  else ok("selfcheck 无宿主时安全降级");
} finally {
  removeTreeNoFollowSync(tmp);
}

if (problems.length) {
  console.error("✗ smoke 失败：");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log("✓ 发行包 smoke 通过");
