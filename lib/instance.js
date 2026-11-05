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
/**
 * 探测插件根是否真的可用。
 * 只把「路径不存在」当成缺席；EACCES / EIO / EPERM 这类读取异常必须把原因带出去，
 * 否则上层只能笼统报「未定位」，和真正没装的场景混在一起。
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

/**
 * 唯一允许的实例解析入口：显式选择器（DSH_BASE / PURGE_DSH_CLI）→ 当前进程入口。
 * 绝不扫描 DSH_HOME、npm prefix、shim 目录或其它安装——那会把别的实例状态
 * 显示成当前实例，再据此写补丁。
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
    reason: "未定位当前实例；可用 DSH_BASE / PURGE_DSH_CLI 显式指定，不会扫描其它安装",
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
    // 目标目录存在但组件不全时，仍然把它交出去：让上层报「缺件」，
    // 而不是清成空串退回「未定位」。否则 status/diagnose 拿不到目标，
    // selfcheck 却会自己再解析出物理路径，三个 handler 各说各话。
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
          ? `${source} 指向的插件根无法读取（${probe.code || "IO 错误"}）：${probe.error}`
          : source + " 指向的目录不是有效插件根（需要 dsh-agent-instructions/lib）",
      probe: { reason: probe.reason, code: probe.code },
    };
  };
  // 显式选择器只负责「选中哪个实例」，选中之后落到哪个物理目标仍走原诊断链。
  // 直接 describe(raw) 会把 DSH_BASE 指向归档时的宿主留在 app.asar 里，于是
  // status/diagnose 读归档、selfcheck 读物理 app，两套依据打架。
  // 这里不放松选择（指错仍 resolved:false），也不回退扫描其它安装。
  const pinned = (raw, source) =>
    describe(diagnosticHost({ ...options, env, reader, diskReader: reader, aiBase: raw }) || raw, source);
  if (env.DSH_BASE && String(env.DSH_BASE).trim())
    return pinned(String(env.DSH_BASE).trim(), "DSH_BASE");
  if (env.PURGE_DSH_CLI && String(env.PURGE_DSH_CLI).trim()) {
    const cli = canonical(String(env.PURGE_DSH_CLI).trim(), reader);
    if (!reader.existsSync(cli))
      throw Error("PURGE_DSH_CLI 指向的文件不存在：" + cli);
    const pkg = packageAbove(cli, reader);
    if (!pkg) throw Error("PURGE_DSH_CLI 不在 @deepseek-ai/dsh 包内：" + cli);
    return pinned(path.dirname(pkg.root), "PURGE_DSH_CLI");
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
      // app.asar 仍在时，app.asar.unpacked 只是归档的旁路（原生模块），不是宿主本身。
      // 此时宿主仍是归档，预期目标应当是解包之后的 app/，否则会把一个没有
      // dsh-agent-instructions/lib 的旁路目录当成宿主，面板只能报「未定位」。
      if (layout === "app.asar.unpacked") {
        let sealed = false;
        try { sealed = reader.statSync(path.join(resources, "app.asar")).isFile(); }
        catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
        if (sealed) continue;
      }
      // 首选目录存在 → 它就是本安装的权威目标。即使组件缺失也不再回落到旁路目录，
      // 否则 unpacked 里一份残缺副本会盖掉「首选 app 少了东西」这个诊断。
      const candidates = [path.join(root, "node_modules/@deepseek-ai"), path.join(root, "dsh/node_modules/@deepseek-ai")];
      for (const candidate of candidates) {
        let dir = false;
        try { dir = reader.statSync(candidate).isDirectory(); }
        catch (error) { if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error; }
        if (!dir) continue;
        const base = normalizeHostBase(candidate, reader);
        const probe = probeAiBase(base, reader);
        // 可读且完整 → 用它；存在但不可读或不全 → 仍然锁定这一份，把原因交给上层。
        if (probe.usable || probe.reason === "unreadable") return base;
        return candidate;
      }
      // 整个 scope 缺失：给出本 layout 的预期路径，由 compatibility 报 no-host。
      return candidates[0];
    }
    // 两份目录都不存在（归档仍封着）：预期路径。
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
    desktop = /[\\/]resources[\\/](?:app|app\.asar|app\.asar\.unpacked)[\\/]/i.test(cli);
  } else {
    const host = currentHost({ ...options, env, argv, reader });
    const resources =
      desktopResourcesForHost(host) || (!host ? resourcesPath : "");
    if (resources) {
      cli = desktopCliFromResources(resources, reader);
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
        throw Error("DSH CLI 不可执行；请指定当前实例的 CLI 文件");
      command = "/bin/sh";
      args = [cli];
    }
  }
  return { command, args, cli, source, node: command === execPath, env: runtimeEnv };
}
