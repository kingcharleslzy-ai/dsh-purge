/** Instance-local maintenance discovery. No PATH or other-app/global desktop scan. */
import fs from "node:fs";
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
    throw Error("profile 名称无效");
  return name;
}
export function resolveProfile(home, options = {}) {
  const {
    env = process.env,
    argv = process.argv,
    reader = fs,
    profile,
  } = options;
  if (!home) throw Error("未确定 DSH_HOME，无法定位当前 profile");
  const root = canonical(
    path.join(canonical(home, reader), "profiles"),
    reader,
  );
  const select = (value, source, isPath = false) => {
    const dir = isPath
      ? path.resolve(value)
      : path.join(root, profileName(value));
    if (!directory(dir, reader))
      throw Error(`未找到 ${source} 指定的 profile：${dir}`);
    return {
      directory: canonical(dir, reader),
      name: path.basename(dir),
      source,
    };
  };
  if (profile) return select(profile, "显式参数", path.isAbsolute(profile));
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
    throw Error("启动参数中出现多个 profile 目录，无法确定当前实例");
  if (paths.length) return select(paths[0], "宿主启动参数", true);
  if (
    argv.some(
      (arg) =>
        typeof arg === "string" &&
        path.isAbsolute(arg) &&
        /[\\/]profiles[\\/][^\\/]+$/.test(arg),
    )
  ) {
    throw Error(
      "宿主启动参数中的 profile 不属于当前 DSH_HOME；请核对服务环境，未选择其他目录",
    );
  }

  const flags = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--profile") {
      if (!argv[i + 1] || argv[i + 1].startsWith("--"))
        throw Error("--profile 缺少名称");
      flags.push(argv[++i]);
    } else if (argv[i]?.startsWith("--profile=")) flags.push(argv[i].slice(10));
  }
  if (new Set(flags).size > 1)
    throw Error("启动参数中出现多个 --profile，无法确定当前实例");
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
  ) return select(shorthand, "DSH profile 简写");
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
    return select(candidates[0], "唯一已初始化 profile");
  throw Error(
    `无法唯一确定当前 profile${candidates.length ? "（" + candidates.join("、") + "）" : ""}；请传入 --profile，或设置 DSH_PROFILE / PURGE_PROFILE_DIR`,
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
    if (found) return path.dirname(found.root);
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
  return running ? path.dirname(running.root) : "";
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
      try { reader.statSync(root); }
      catch (error) {
        if (["ENOENT", "ENOTDIR"].includes(error.code)) continue;
        throw error;
      }
      const candidates = [path.join(root, "node_modules/@deepseek-ai"), path.join(root, "dsh/node_modules/@deepseek-ai")];
      // A partial preferred extraction remains partial; never use a healthy
      // sibling app.asar.unpacked to hide its missing components.
      let target = candidates[0];
      for (const candidate of candidates) {
        try { if (reader.statSync(candidate).isDirectory()) { target = candidate; break; } }
        catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
      }
      return normalizeHostBase(target, reader);
    }
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
  const roots = [path.join(host, "dsh"), host];
  if (path.basename(host) === "@deepseek-ai" &&
      path.basename(path.dirname(host)) === "node_modules" &&
      path.basename(path.dirname(path.dirname(host))) === "dsh") {
    roots.push(path.dirname(path.dirname(host)));
  }
  for (const root of roots) {
    try {
      const meta = JSON.parse(reader.readFileSync(path.join(root, "package.json"), "utf8"));
      if (meta.name !== "@deepseek-ai/dsh") continue;
      const bin = typeof meta.bin === "string" ? meta.bin : meta.bin?.dsh;
      if (!bin) continue;
      const cli = path.resolve(root, bin), relative = path.relative(root, cli);
      if (relative.startsWith("..") || path.isAbsolute(relative)) continue;
      if (reader.statSync(cli).isFile()) return cli;
    } catch {}
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
      throw Error(`PURGE_DSH_CLI 指向的文件不存在：${cli}`);
    desktop = /[\\/]resources[\\/](?:app|app\.asar|app\.asar\.unpacked)[\\/]dsh[\\/]node_modules[\\/]@deepseek-ai[\\/]dsh-desktop-host[\\/]lib[\\/]cli\.js$/i.test(cli);
  } else {
    const host = currentHost({ ...options, env, argv, reader });
    const resources =
      desktopResourcesForHost(host) || (!host ? resourcesPath : "");
    if (resources) {
      cli =
        ["app.asar", "app.asar.unpacked", "app"]
          .map((layout) =>
            path.join(
              resources,
              layout,
              "dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js",
            ),
          )
          .find((file) => reader.existsSync(file)) || "";
      desktop = true;
      source = "当前 Desktop 实例";
    } else if (host) {
      cli = npmCli(host, reader);
      source = "当前 npm/Node 实例";
    }
  }
  if (!cli)
    throw Error(
      "无法定位当前 DSH 实例的 CLI；请设置 PURGE_DSH_CLI 指向此服务使用的 dsh 启动文件，并明确 DSH_PROFILE（例如 web）。不会尝试其他全局安装。",
    );
  let command = cli,
    args = [];
  if (/\.[cm]?js$/i.test(cli)) {
    command = execPath;
    args = [...(desktop ? ["--expose-internals"] : []), cli];
  } else if (platform !== "win32") {
    try {
      reader.accessSync(cli, fs.constants.X_OK);
    } catch {
      if (
        !/^#!\/bin\/(?:ba)?sh(?:\r?\n|$)/.test(
          reader.readFileSync(cli, "utf8").slice(0, 64),
        )
      )
        throw Error("DSH CLI 不可执行；请指定当前实例的 CLI 文件");
      command = "/bin/sh";
      args = [cli];
    }
  }
  return { command, args, cli, source, node: command === execPath };
}
