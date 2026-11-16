import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
// Release package smoke test: does not depend on a real DSH host, verifies "the built tgz can at least be imported and parsed".
// CI runs it after npm pack; `npm run smoke` locally does the same.
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
  console.error("✗ tgz not found; run npm pack first");
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
  ok("Unpacked archive without installed dependencies can start the bootstrap CLI");

  // Install the packed artifact's declared dependencies, not source-tree node_modules.
  const installArgs = ["install", "--ignore-scripts", "--legacy-peer-deps", "--omit=dev", "--no-audit", "--no-fund"];
  // Node cannot exec a .cmd file directly. This command contains only fixed arguments;
  // the temporary package path is passed as cwd, never interpolated into shell code.
  if (process.platform === "win32") {
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npm ${installArgs.join(" ")}`], {cwd:pkgDir,stdio:"pipe",timeout:120000});
  } else {
    execFileSync("npm", installArgs, {cwd:pkgDir,stdio:"pipe",timeout:120000});
  }

  // 1) All files referenced by export mappings exist
  for (const [key, target] of Object.entries(pkg.exports || {})) {
    const rel = typeof target === "string" ? target : target && target.default;
    if (!rel) continue;
    if (!fs.existsSync(path.join(pkgDir, rel))) problems.push(`exports["${key}"] -> ${rel} does not exist`);
  }
  if (!problems.length) ok(`${Object.keys(pkg.exports || {}).length} export targets all exist`);

  // 2) Every entry point can be imported
  for (const spec of ["./lib/index.js", "./lib/presets-plugin.js", "./lib/selfcheck.js", "./lib/probe.js", "./lib/audit.js"]) {
    const mod = await import(pathToFileURL(path.join(pkgDir, spec)).href);
    if (!mod || typeof mod !== "object") problems.push(`${spec} import failed`);
  }
  ok("Core modules can be imported from the release package");

  // 3) Bundled preset can be parsed into a valid definition by the registry parser
  const composition = await import(pathToFileURL(path.join(pkgDir, "lib/redteam/preset-composition.js")).href);
  const def = composition.readPresetDefinition("unrestricted", path.join(pkgDir, "presets/unrestricted"));
  if (def.id !== "unrestricted" || !Array.isArray(def.plugins) || def.plugins.length < 15)
    problems.push(`Preset parse error: ${def.id} / ${def.plugins?.length} entries`);
  else ok(`Preset parsed: ${def.plugins.length} entries`);

  // 4) Bundle patch entry names match the package name
  const yml = fs.readFileSync(path.join(pkgDir, "cordis.patch.yml"), "utf8");
  for (const needle of ["dsh-purge-community", "dsh-purge-community/presets-plugin", "dsh-purge-community/redteam"])
    if (!yml.includes(needle)) problems.push(`cordis.patch.yml missing ${needle}`);
  if (!problems.length) ok("Bundle patch entries complete");

  // 5) CLI can produce status in an empty directory without crashing
  const home = path.join(tmp, "home");
  fs.mkdirSync(home, { recursive: true });
  const out = execFileSync(process.execPath, [path.join(pkgDir, "bin/community.js"), "status"], {
    env: { ...process.env, DSH_HOME: home },
    encoding: "utf8",
  });
  if (!out.includes("Purge")) problems.push("status output unexpected");
  else ok("CLI status available");

  // 6) Self-check returns broken (not an exception) when no host is present
  const selfcheck = await import(pathToFileURL(path.join(pkgDir, "lib/selfcheck.js")).href);
  const report = await selfcheck.selfCheck("", home);
  if (report.state !== "broken") problems.push(`selfcheck without host should be broken, got ${report.state}`);
  else ok("selfcheck degrades safely without host");
} finally {
  removeTreeNoFollowSync(tmp);
}

if (problems.length) {
  console.error("✗ smoke failed:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log("✓ Release package smoke passed");
