// Alternative package layouts are optional. An installed copy is a required target.
import fs from "node:fs";
import path from "node:path";
import { ALL_PATCHES } from "./patches/index.mjs";
import { patchHasRemainingWork } from "./core/shared.mjs";

const packageName = "@linxin666/dsh-liangshen";
const spec = "agent.cordis.yml";

function packageDirs(profile) {
  return [
    "node_modules",
    ".dsh-module-fallback/node_modules",
    "node_modules/@linxin666/dsh-web-all/node_modules",
  ].map((dir) => path.join(profile, dir, packageName));
}

function profiles(home, reader) {
  const dir = path.join(home, "profiles");
  try {
    return reader
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
      .map((entry) => path.join(dir, entry.name));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    return [];
  }
}

export function liangshenRoots(home, reader = fs) {
  return [
    path.join(home, ".agent-presets/liangshen"),
    ...profiles(home, reader).flatMap((profile) =>
      packageDirs(profile).map((dir) => path.join(dir, "presets/liangshen")),
    ),
  ];
}

export function liangshenInventory(home, reader = fs, allows = () => true) {
  const targets = [];
  const problems = [];
  function exists(candidate, key) {
    try {
      reader.lstatSync(candidate);
      return true;
    } catch (error) {
      if (error.code !== "ENOENT")
        problems.push({ key, path: candidate, status: "unreadable" });
      return false;
    }
  }
  const local = path.join(home, ".agent-presets/liangshen");
  if (allows(path.join(local, spec)) && exists(local, "preset-liangshen"))
    targets.push({ key: "preset-liangshen", path: path.join(local, spec) });
  const key = "preset-liangshen-pkg";
  let dirs;
  try {
    dirs = profiles(home, reader);
  } catch {
    problems.push({
      key,
      path: path.join(home, "profiles"),
      status: "unreadable",
    });
    return { targets, problems };
  }
  for (const profile of dirs) {
    if (!allows(profile)) continue;
    const candidates = packageDirs(profile).filter((dir) => allows(path.join(dir, "presets/liangshen", spec)));
    if (!candidates.length) continue;
    const installed = candidates.filter((dir) => exists(dir, key));
    if (!installed.length) {
      const manifest = path.join(profile, "package.json");
      try {
        const pkg = JSON.parse(reader.readFileSync(manifest, "utf8"));
        if (
          ["dependencies", "devDependencies", "optionalDependencies"].some(
            (group) => Object.hasOwn(pkg[group] || {}, packageName),
          )
        )
          installed.push(candidates[0]);
      } catch (error) {
        if (error.code !== "ENOENT")
          problems.push({ key, path: manifest, status: "unreadable" });
      }
    }
    for (const dir of installed)
      targets.push({ key, path: path.join(dir, "presets/liangshen", spec) });
  }
  return { targets, problems };
}

export function liangshenPresence(home, reader = fs) {
  const { targets, problems } = liangshenInventory(home, reader);
  return targets.length ? "present" : problems.length ? "unknown" : "absent";
}

export async function liangshenReport(
  home,
  patch = ALL_PATCHES.find((p) => p.id === 71),
  inventory = liangshenInventory(home),
) {
  const files = [...inventory.problems];
  for (const target of inventory.targets) {
    let outcome;
    try {
      const text = await fs.promises.readFile(target.path, "utf8");
      const { inspectLiangshenText } = await import("./preset-diagnostic.js");
      const prefix = inspectLiangshenText(text);
      if (prefix === "clear") outcome = "applied";
      else if (prefix === "present")
        outcome = patchHasRemainingWork(text, patch, target.path)
          ? "pending"
          : "unmatched";
      else outcome = prefix;
    } catch (error) {
      outcome = error.code === "ENOENT" ? "missing_file" : "unreadable";
    }
    files.push({ ...target, status: outcome });
  }
  const states = new Set(files.map((file) => file.status));
  if (!files.length) return { status: "na", files };
  if (states.has("unreadable") || states.has("unknown"))
    return { status: "unknown", files };
  if (states.has("applied") && states.size > 1)
    return { status: "partial", files };
  for (const status of ["missing_file", "unmatched", "pending", "applied"])
    if (states.has(status)) return { status, files };
  return { status: "unknown", files };
}
