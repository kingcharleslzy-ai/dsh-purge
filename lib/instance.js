/** Instance-local maintenance discovery. No PATH or other-app/global desktop scan. */
import fs from "node:fs";
import { desktopCliFromResources, desktopPackageManager } from "./desktop-cli.js";
import path from "node:path";
import { diskFs } from "./extract-asar.js";
import { desktopIdentity } from "./desktop-identity.js";

function canonical(file, reader) {
  try {
    return reader.realpathSync(file);
  } catch {
    return path.resolve(file);
  }
}
function directory(file, reader) {
  try {
    return reader.statSync(file).isDirectory();
  } catch {
    return false;
  }
}
function profileName(name) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name || ""))
    throw Error("invalid profile name");
  return name;
}
export function resolveProfile(home, options = {}) {
  const {
    env = process.env,
    argv = process.argv,
    reader = fs,
    profile,
  } = options;
  if (!home) throw Error("DSH_HOME not determined; cannot locate the current profile");
  const root = canonical(
    path.join(canonical(home, reader), "profiles"),
    reader,
  );
  const select = (value, source, isPath = false) => {
    const dir = isPath
      ? path.resolve(value)
      : path.join(root, profileName(value));
    if (!directory(dir, reader))
      throw Error(`no profile found for ${source}: ${dir}`);
    return {
      directory: canonical(dir, reader),
      name: path.basename(dir),
      source,
    };
  };
  if (profile) return select(profile, "explicit argument", path.isAbsolute(profile));
  if (env.PURGE_PROFILE_DIR)
    return select(env.PURGE_PROFILE_DIR, "PURGE_PROFILE_DIR", true);
  const paths = [
    ...new Set(
      argv.filter(
        (arg) =>
          typeof arg === "string" &&
          path.isAbsolute(arg) &&
          canonical(path.dirname(arg), reader) === root,
      ),
    ),
  ];
  if (paths.length > 1)
    throw Error("multiple profile dirs in the launch args; cannot determine the current instance");
  if (paths.length) return select(paths[0], "host launch args", true);
  if (
    argv.some(
      (arg) =>
        typeof arg === "string" &&
        path.isAbsolute(arg) &&
        /[\\/]profiles[\\/][^\\/]+$/.test(arg),
    )
  ) {
    throw Error(
      "a launch-arg profile is not under the current DSH_HOME; check the service environment. No other dir was selected",
    );
  }

  const flags = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--profile") {
      if (!argv[i + 1] || argv[i + 1].startsWith("--"))
        throw Error("--profile is missing a name");
      flags.push(argv[++i]);
    } else if (argv[i]?.startsWith("--profile=")) flags.push(argv[i].slice(10));
  }
  if (new Set(flags).size > 1)
    throw Error("multiple --profile flags; cannot determine the current instance");
  if (flags.length) return select(flags[0], "--profile");
  // The official npm CLI also accepts `dsh web` / `dsh <custom-profile>`.
  // Only trust this positional argument at a verified DSH entry, never at an
  // arbitrary plugin script whose first argument may be a maintenance command.
  const shorthand = argv[2];
  const launch = packageAbove(argv[1], reader);
  const launchBin = typeof launch?.meta.bin === "string" ? launch.meta.bin : launch?.meta.bin?.dsh;
  if (
    typeof shorthand === "string" &&
    /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(shorthand) &&
    shorthand !== "plugin" &&
    launch?.meta.name === "@deepseek-ai/dsh" &&
    launchBin &&
    canonical(argv[1], reader) === canonical(path.resolve(launch.root, launchBin), reader)
  ) return select(shorthand, "DSH profile shorthand");
  if (env.DSH_PROFILE) return select(env.DSH_PROFILE, "DSH_PROFILE");
  let candidates = [];
  try {
    candidates = reader
      .readdirSync(root, { withFileTypes: true })
      .filter(
        (e) =>
          (e.isDirectory() ||
            (e.isSymbolicLink() &&
              directory(path.join(root, e.name), reader))) &&
          /^[a-zA-Z0-9]/.test(e.name) &&
          e.name !== "node_modules" &&
          reader.existsSync(path.join(root, e.name, "package.json")),
      )
      .map((e) => e.name);
  } catch {}
  if (candidates.length === 1)
    return select(candidates[0], "the only initialized profile");
  throw Error(
    `cannot uniquely determine the current profile${candidates.length ? " (" + candidates.join(", ") + ")" : ""}; pass --profile or set DSH_PROFILE / PURGE_PROFILE_DIR`,
  );
}

function packageAbove(file, reader) {
  if (!file) return null;
  let dir = path.dirname(canonical(file, reader));
  for (let i = 0; i < 8; i++) {
    try {
      const meta = JSON.parse(
        reader.readFileSync(path.join(dir, "package.json"), "utf8"),
      );
      if (
        ["@deepseek-ai/dsh", "@deepseek-ai/dsh-desktop-host"].includes(
          meta.name,
        )
      )
        return { root: dir, meta };
    } catch {}
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}
// Published installs use a scope/dsh directory. A workspace link resolves to
// apps/cli instead; its parent is not an npm scope and can contain other apps.
function installationOf(pkg) {
  const parent = path.dirname(pkg.root);
  if (pkg.meta.name === "@deepseek-ai/dsh" &&
      !(path.basename(parent) === "@deepseek-ai" && path.basename(pkg.root) === "dsh")) {
    return pkg.root;
  }
  return parent;
}
/**
 * Probe whether the plugin root is really usable.
 * Only a missing path counts as absent; read errors like EACCES / EIO / EPERM must carry their reason out,
 * or callers can only report "not located" and mix it with a genuinely absent install.
 */
export function probeAiBase(base, reader = fs) {
  if (!base) return { usable: false, reason: "empty", code: "" };
  try {
    const ok = reader
      .statSync(path.join(base, "dsh-agent-instructions", "lib"))
      .isDirectory();
    return ok
      ? { usable: true, reason: "", code: "" }
      : { usable: false, reason: "missing", code: "" };
  } catch (error) {
    const code = error && error.code ? String(error.code) : "";
    if (code === "ENOENT" || code === "ENOTDIR")
      return { usable: false, reason: "missing", code };
    return {
      usable: false,
      reason: "unreadable",
      code,
      error: String(error && error.message ? error.message : error),
    };
  }
}
function usableAiBase(base, reader = fs) {
  return probeAiBase(base, reader).usable;
}
export function desktopResourcesForHost(host) {
  const normalized = String(host || "").replace(/\\/g, "/");
  const match =
    /^(.*\/resources)\/(?:app|app\.asar|app\.asar\.unpacked)\/(?:dsh\/)?node_modules\/@deepseek-ai\/?$/i.exec(
      normalized,
    );
  return match ? path.normalize(match[1]) : "";
}
export function hostSurface(host) {
  if (!host) return "unknown";
  if (desktopResourcesForHost(host)) return "desktop";
  for (const pkg of ["dsh", "dsh-agent-loop", "dsh-system-prompt"]) {
    if (fs.existsSync(path.join(host, pkg, "package.json"))) return "web";
  }
  return "unknown";
}
/** Resolve only known shapes below the selected installation, never PATH/global scans.
 * The result is for component inspection; currentHost remains the installation
 * root so maintenance can still locate the owning package's CLI.
 */
export function normalizeHostBase(base, reader = fs) {
  if (!base) return "";
  const start = canonical(base, reader);
  const candidates = [
    start,
    path.join(start, "node_modules", "@deepseek-ai"),
    path.join(start, "dsh", "node_modules", "@deepseek-ai"),
  ];
  for (const candidate of candidates) {
    // A partial installation stays on its own root and is diagnosed as partial.
    // Requiring all components here would hide missing files behind another root.
    if (["dsh-agent-loop", "dsh-system-prompt", "dsh-agent-instructions"].some(pkg => {
      try { return reader.statSync(path.join(candidate, pkg, "package.json")).isFile(); }
      catch { return false; }
    })) return canonical(candidate, reader);
  }
  return start;
}

export function currentHost(options = {}) {
  const { env = process.env, argv = process.argv, reader = fs } = options;
  if (options.aiBase) return canonical(options.aiBase, reader);
  if (env.DSH_BASE) return canonical(env.DSH_BASE, reader);
  // Explicit CLI means that installation, not an unrelated global/npm binary.
  if (env.PURGE_DSH_CLI) {
    const found = packageAbove(env.PURGE_DSH_CLI, reader);
    if (found) return installationOf(found);
    // Desktop's shipped shell launcher lives under Resources/runtime/cli/bin.
    const launcher = canonical(env.PURGE_DSH_CLI, reader).replace(/\\/g, "/");
    const resources = /^(.*\/resources)\/runtime\/cli\/bin\/dsh$/i.exec(
      launcher,
    )?.[1];
    if (resources) {
      for (const layout of ["app.asar", "app.asar.unpacked", "app"]) {
        const candidate = path.join(
          resources,
          layout,
          "dsh/node_modules/@deepseek-ai",
        );
        if (directory(candidate, reader)) return canonical(candidate, reader);
      }
    }
    return "";
  }
  const running = packageAbove(argv[1], reader);
  return running ? installationOf(running) : "";
}

/**
 * The only allowed instance resolution: explicit selector (DSH_BASE / PURGE_DSH_CLI) -> current process entry.
 * Never scan DSH_HOME, the npm prefix, shim dirs, or other installs — that would show another
 * instance's state as this one and patch based on it.
 */
export function resolveInstance(options = {}) {
  const env = options.env || process.env;
  const reader = options.reader || fs;
  const empty = {
    host: "",
    candidate: "",
    source: "unresolved",
    surface: "unknown",
    family: "",
    resolved: false,
    reason: "current instance not located; set DSH_BASE / PURGE_DSH_CLI explicitly. Other installs are never scanned",
  };
  const describe = (host, source) => {
    const base = normalizeHostBase(host, reader);
    const resources = desktopResourcesForHost(base);
    let family = "";
    try {
      family = resources ? (desktopIdentity(resources) || {}).kind || "" : "";
    } catch {
      family = "";
    }
    const probe = probeAiBase(base, reader);
    const resolved = probe.usable;
    // A target dir that exists but is incomplete is still handed over so callers report "missing parts"
    // instead of blanking to "not located". Otherwise status/diagnose get no target while
    // selfcheck resolves a physical path on its own and the three handlers disagree.
    let present = false;
    try { present = reader.statSync(base).isDirectory(); } catch { present = false; }
    return {
      host: resolved || present ? base : "",
      candidate: base,
      source: resolved || present ? source : "unresolved",
      surface: hostSurface(base),
      family,
      resolved,
      reason: resolved
        ? ""
        : probe.reason === "unreadable"
          ? `plugin root from ${source} is unreadable (${probe.code || "IO error"}): ${probe.error}`
          : source + " points at a dir that is not a valid plugin root (needs dsh-agent-instructions/lib)",
      probe: { reason: probe.reason, code: probe.code },
    };
  };
  // The explicit selector only picks which instance; the physical target still comes from the diagnostic chain.
  // describe(raw) with a DSH_BASE pointing at an archive leaves the host in app.asar, so
  // status/diagnose read the archive while selfcheck reads the physical app — two conflicting sources.
  // Selection is not loosened (a wrong pointer still yields resolved:false) and nothing scans other installs.
  const pinned = (raw, source) =>
    describe(diagnosticHost({ ...options, env, reader, diskReader: reader, aiBase: raw }) || raw, source);
  if (env.DSH_BASE && String(env.DSH_BASE).trim())
    return pinned(String(env.DSH_BASE).trim(), "DSH_BASE");
  if (env.PURGE_DSH_CLI && String(env.PURGE_DSH_CLI).trim()) {
    const cli = canonical(String(env.PURGE_DSH_CLI).trim(), reader);
    if (!reader.existsSync(cli))
      throw Error("PURGE_DSH_CLI points at a missing file: " + cli);
    const pkg = packageAbove(cli, reader);
    if (!pkg) throw Error("PURGE_DSH_CLI is not inside the @deepseek-ai/dsh package: " + cli);
    return pinned(installationOf(pkg), "PURGE_DSH_CLI");
  }
  const host = diagnosticHost({ ...options, env, reader });
  if (!host) return empty;
  // Partial or unreadable is still evidence about this selected installation.
  // Preserve its target, family and probe error just as for explicit selectors;
  // resolved remains false and no other installation is searched.
  return describe(host, "process-entry");
}

/** Diagnostics inspect physical files in the selected installation, never another app.
 * Keep currentHost() unchanged: it is also used by the installer/CLI launcher.
 */
export function diagnosticHost(options = {}) {
  const selected = currentHost(options);
  const reader = options.diskReader || diskFs();
  if (!selected) {
    const env = options.env || process.env;
    // An invalid explicit selector must never fall through to another host.
    if (options.aiBase || env.DSH_BASE || env.PURGE_DSH_CLI) return "";
    const resources = options.resourcesPath ?? process.resourcesPath;
    const electron = options.electron ?? process.versions.electron;
    // Read-only fallback for a packaged Electron main process (argv[1] may
    // only be --updated). Never scan PATH, neighboring apps or user installs.
    if (!electron || !resources || !path.isAbsolute(resources) || !desktopIdentity(resources)) return "";
    for (const layout of ["app", "app.asar.unpacked"]) {
      const root = path.join(resources, layout);
      let rootPresent = false;
      try { reader.statSync(root); rootPresent = true; }
      catch (error) {
        if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
      }
      if (!rootPresent) continue;
      // While app.asar remains, app.asar.unpacked is only the archive's sidecar (native modules), not the host.
      // The host is still the archive and the expected target is the unpacked app/, or a sidecar dir
      // without dsh-agent-instructions/lib counts as the host and the panel can only report "not located".
      if (layout === "app.asar.unpacked") {
        let sealed = false;
        try { sealed = reader.statSync(path.join(resources, "app.asar")).isFile(); }
        catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
        if (sealed) continue;
      }
      // An existing primary dir is this install's authoritative target. Even with parts missing it never falls
      // back to the sidecar, or a partial copy in unpacked would mask "the primary app lacks something".
      const candidates = [path.join(root, "node_modules/@deepseek-ai"), path.join(root, "dsh/node_modules/@deepseek-ai")];
      for (const candidate of candidates) {
        let dir = false;
        try { dir = reader.statSync(candidate).isDirectory(); }
        catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
        if (!dir) continue;
        const base = normalizeHostBase(candidate, reader);
        const probe = probeAiBase(base, reader);
        // Readable and complete -> use it; present but unreadable or partial -> still lock onto it and report why.
        if (probe.usable || probe.reason === "unreadable") return base;
        return candidate;
      }
      // Whole scope missing: give this layout's expected path and let compatibility report no-host.
      return candidates[0];
    }
    // Neither dir exists (archive still sealed): expected path.
    return path.join(resources, "app/node_modules/@deepseek-ai");
  }
  const normalized = selected.replace(/\\/g, "/");
  const archive = /^(.*\/resources)\/app\.asar\/((?:dsh\/)?node_modules\/@deepseek-ai)\/?$/i.exec(normalized);
  if (!archive) return normalizeHostBase(selected, reader);
  const roots = ["app", "app.asar.unpacked"].map(layout => path.join(archive[1], layout));
  const candidates = roots.map(root => path.join(root, archive[2]));
  // A partial app directory must not be replaced by a healthier sibling.
  for (const [index, candidate] of candidates.entries()) {
    try {
      // Even an incomplete extraction or a file occupying app/ is evidence of
      // this target; do not hide it by selecting the other directory.
      reader.statSync(roots[index]);
      return normalizeHostBase(candidate, reader);
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) return candidate;
    }
  }
  // No extraction yet: keep this same app's expected path, so missing files and
  // the sealed-archive warning remain errors rather than silently passing.
  return candidates[0];
}
function npmCli(host, reader) {
  // Accept outer scope, package root, or its exact nested component root. Never
  // climb arbitrary ancestors: a bad target must not select another installation.
  const roots = [host, path.join(host, "dsh")];
  if (path.basename(host) === "@deepseek-ai" &&
      path.basename(path.dirname(host)) === "node_modules" &&
      path.basename(path.dirname(path.dirname(host))) === "dsh") {
    roots.push(path.dirname(path.dirname(host)));
  }
  for (const root of roots) {
    let meta;
    try {
      meta = JSON.parse(reader.readFileSync(path.join(root, "package.json"), "utf8"));
    } catch (error) {
      if (["ENOENT", "ENOTDIR"].includes(error.code)) continue;
      throw error;
    }
    if (meta.name !== "@deepseek-ai/dsh") continue;
    const bin = typeof meta.bin === "string" ? meta.bin : meta.bin?.dsh;
    if (typeof bin !== "string" || !bin) return "";
    const cli = path.resolve(root, bin);
    const inside = (base, file) => {
      const relative = path.relative(base, file);
      return relative && relative !== ".." && !relative.startsWith(".." + path.sep) && !path.isAbsolute(relative);
    };
    if (!inside(root, cli)) return "";
    try {
      if (reader.statSync(cli).isFile() && inside(reader.realpathSync(root), reader.realpathSync(cli))) return cli;
    } catch (error) {
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
    }
    return ""; // The owning package has a broken bin. Never select a neighboring app.
  }
  return "";
}
export function resolveDshCli(options = {}) {
  const {
    env = process.env,
    argv = process.argv,
    reader = fs,
    execPath = process.execPath,
    resourcesPath = process.resourcesPath,
    platform = process.platform,
  } = options;
  let cli = "",
    source = "",
    desktop = false;
  if (env.PURGE_DSH_CLI) {
    cli = canonical(env.PURGE_DSH_CLI, reader);
    source = "PURGE_DSH_CLI";
    if (!reader.existsSync(cli))
      throw Error(`PURGE_DSH_CLI points at a missing file: ${cli}`);
    desktop = /[\\/]resources[\\/](?:app|app\.asar|app\.asar\.unpacked)[\\/]/i.test(cli);
  } else {
    const host = currentHost({ ...options, env, argv, reader });
    const resources =
      desktopResourcesForHost(host) || (!host ? resourcesPath : "");
    if (resources) {
      cli = desktopCliFromResources(resources, reader);
      desktop = true;
      source = "current Desktop instance";
    } else if (host) {
      cli = npmCli(host, reader);
      source = "current npm/Node instance";
    }
  }
  if (!cli)
    throw Error(
      "Cannot locate the CLI of the current DSH instance; set PURGE_DSH_CLI to the dsh launcher this service uses and set DSH_PROFILE (e.g. web). No other global install is tried.",
    );
  let command = cli,
    args = [], runtimeEnv = {};
  if (/\.[cm]?js$/i.test(cli)) {
    command = execPath;
    const resources = desktop ? /^(.*[\\/]resources)[\\/](?:app|app\.asar|app\.asar\.unpacked)[\\/]/i.exec(cli)?.[1] : '';
    const wrapper = resources && path.join(resources, 'harness-node-entry.mjs');
    if (wrapper && reader.existsSync(wrapper)) runtimeEnv = desktopPackageManager(cli, reader);
    args = [...(desktop ? ["--expose-internals"] : []), ...(wrapper && reader.existsSync(wrapper) ? [wrapper] : []), cli];
  } else if (platform !== "win32") {
    try {
      reader.accessSync(cli, fs.constants.X_OK);
    } catch {
      if (
        !/^#!\/bin\/(?:ba)?sh(?:\r?\n|$)/.test(
          reader.readFileSync(cli, "utf8").slice(0, 64),
        )
      )
        throw Error("DSH CLI is not executable; point at this instance's CLI file");
      command = "/bin/sh";
      args = [cli];
    }
  }
  return { command, args, cli, source, node: command === execPath, env: runtimeEnv };
}
