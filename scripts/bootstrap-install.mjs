/** Shared installer: selected Desktop's Electron runtime or Linux CLI's Node. */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile, spawn } from "node:child_process";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
const exec = promisify(execFile);
const repo = "kingcharleslzy-ai/dsh-purge";
const hosts = new Set(["api.github.com", "github.com", "release-assets.githubusercontent.com", "objects.githubusercontent.com"]);

// Keep this module self-contained: the raw installer runs before dependencies exist.
const transientCodes = new Set(['ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'ENETUNREACH', 'EHOSTUNREACH', 'EAI_AGAIN', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT', 'UND_ERR_SOCKET', 'UND_ERR_DESTROYED', 'TimeoutError', 'AbortError']);
const retryStatus = new Set([408, 429, 500, 502, 503, 504]);
function failure(code, retryable = false) { return Object.assign(new Error(code), { code, retryable }); }
function trustedURL(value) {
  let u;
  try { u = new URL(value); } catch { throw failure('INVALID_RELEASE_URL'); }
  if (u.protocol !== 'https:' || u.username || u.password || (u.port && u.port !== '443') || !hosts.has(u.hostname)) throw failure('UNTRUSTED_RELEASE_URL');
  return u;
}
function errorCodes(error, seen = new Set()) {
  if (!error || seen.has(error) || seen.size >= 12) return [];
  seen.add(error);
  // Never log raw error messages: they may contain proxy credentials or signed URLs.
  const code = error.code || (['TimeoutError', 'AbortError'].includes(error.name) ? error.name : null);
  return [...(typeof code === 'string' && /^[A-Z_a-z0-9]{1,64}$/.test(code) ? [code] : []),
    ...errorCodes(error.cause, seen), ...(error.errors || []).flatMap(e => errorCodes(e, seen))];
}
function retryable(error) {
  if (typeof error.retryable === 'boolean') return error.retryable;
  const codes = errorCodes(error);
  return codes.length > 0 && codes.every(code => transientCodes.has(code));
}

// No shell, no curlrc, no automatic redirects, no insecure TLS. Stream into a
// bounded buffer, including headers, so an untrusted body cannot fill disk/RAM.
export function curlReleaseRequest(url, { timeout, limit, env = process.env } = {}) {
  trustedURL(url);
  return new Promise((resolve, reject) => {
    const executable = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'curl.exe') : '/usr/bin/curl';
    const args = ['--disable', '--silent', '--show-error', '--globoff', '--proto', '=https', '--connect-timeout', '20', '--max-time', String(Math.max(0.001, timeout / 1000)),
      '--include', '--suppress-connect-headers', '--header', 'accept: application/vnd.github+json', '--user-agent', 'purge-community-installer', '--url', url];
    // Schannel curl does not consistently honor CURL_CA_BUNDLE implicitly.
    // Honor an explicitly provided CA file without touching the system trust store.
    if (env.CURL_CA_BUNDLE) args.splice(args.length - 2, 0, '--cacert', env.CURL_CA_BUNDLE);
    const child = spawn(executable, args, { env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let header = Buffer.alloc(0), headers, status, parts = [], size = 0, stopped = false;
    const stop = error => { if (!stopped) { stopped = true; clearTimeout(timer); child.kill(); reject(error); } };
    const timer = setTimeout(() => stop(failure('CURL_TIMEOUT', true)), timeout + 1000);
    // stderr can include credential-bearing URLs. Drain it, never echo it.
    child.stderr.resume();
    child.on('error', error => stop(failure(error.code === 'ENOENT' ? 'CURL_UNAVAILABLE' : 'CURL_START_FAILED')));
    child.stdout.on('data', chunk => {
      if (stopped) return;
      if (!headers) {
        header = Buffer.concat([header, chunk]);
        for (;;) {
          const end = header.indexOf('\r\n\r\n');
          if (end < 0) { if (header.length > 65536) stop(failure('RELEASE_HEADERS_TOO_LARGE')); return; }
          if (end > 65536) { stop(failure('RELEASE_HEADERS_TOO_LARGE')); return; }
          const lines = header.subarray(0, end).toString('latin1').split('\r\n');
          const match = /^HTTP\/[^ ]+ (\d{3})(?: |$)/.exec(lines.shift());
          if (!match) { stop(failure('INVALID_RELEASE_RESPONSE')); return; }
          status = Number(match[1]);
          chunk = header.subarray(end + 4); header = Buffer.alloc(0);
          if (status >= 100 && status < 200) { header = chunk; continue; }
          headers = new Headers();
          try { for (const line of lines) { const colon = line.indexOf(':'); if (colon > 0) headers.append(line.slice(0, colon), line.slice(colon + 1).trim()); } }
          catch { stop(failure('INVALID_RELEASE_HEADERS')); return; }
          if (Number(headers.get('content-length')) > limit) { stop(failure('RELEASE_FILE_TOO_LARGE')); return; }
          break;
        }
      }
      size += chunk.length;
      if (size > limit) { stop(failure('RELEASE_FILE_TOO_LARGE')); return; }
      parts.push(chunk);
    });
    child.on('close', code => {
      clearTimeout(timer);
      if (stopped) return;
      stopped = true;
      if (code !== 0) { reject(failure(`CURL_EXIT_${code}`, [5, 6, 7, 18, 28, 52, 55, 56, 92].includes(code))); return; }
      if (!headers) { reject(failure('INVALID_RELEASE_RESPONSE')); return; }
      resolve({ status, headers, body: Buffer.concat(parts) });
    });
  });
}

export async function downloadReleaseFile(url, limit, { request = fetch, curlRequest = curlReleaseRequest, log = console.log,
  stage = 'release', budget = 60000, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  trustedURL(url);
  const deadline = Date.now() + budget;
  const failures = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const transport = attempt < 2 ? 'fetch' : 'curl';
    let current = url, lastHost = trustedURL(url).hostname;
    try {
      // Restart at the official URL on retry; signed asset redirects may expire.
      for (let hop = 0; hop < 6; hop++) {
        const u = trustedURL(current), remaining = deadline - Date.now();
        if (remaining <= 0) throw failure('DOWNLOAD_BUDGET_EXHAUSTED');
        lastHost = u.hostname;
        const timeout = transport === 'fetch' ? Math.min(20000, remaining) : remaining;
        let result;
        if (transport === 'curl') result = await curlRequest(current, { timeout, limit });
        else {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(new DOMException('Timed out', 'TimeoutError')), timeout);
          let response;
          try {
            response = await request(current, { redirect: 'manual', signal: controller.signal, headers: { 'user-agent': 'purge-community-installer', accept: 'application/vnd.github+json' } });
            if (response.status < 200 || response.status >= 300) {
              result = { status: response.status, headers: response.headers };
            } else {
              if (Number(response.headers.get('content-length')) > limit) throw failure('RELEASE_FILE_TOO_LARGE');
              const parts = []; let size = 0;
              for await (const chunk of response.body) {
                size += chunk.length;
                if (size > limit) throw failure('RELEASE_FILE_TOO_LARGE');
                parts.push(chunk);
              }
              result = { status: response.status, headers: response.headers, body: Buffer.concat(parts) };
            }
          } finally {
            clearTimeout(timer);
            // Abort unused redirect/error bodies as well as partial streams.
            controller.abort();
            if (response?.body && !response.body.locked) await response.body.cancel().catch(() => {});
          }
        }
        if (result.status >= 300 && result.status < 400) {
          const location = result.headers.get('location');
          if (!location) throw failure('INVALID_RELEASE_REDIRECT');
          try { current = new URL(location, u).href; } catch { throw failure('INVALID_RELEASE_REDIRECT'); }
          trustedURL(current);
          continue;
        }
        if (result.status < 200 || result.status >= 300) throw failure(`HTTP_${result.status}`, retryStatus.has(result.status));
        if (!Buffer.isBuffer(result.body) || result.body.length > limit) throw failure('RELEASE_FILE_TOO_LARGE');
        if (attempt) log(`[download] stage=${stage} transport=${transport} recovered; SHA256 verification is still required.`);
        return result.body;
      }
      throw failure('TOO_MANY_RELEASE_REDIRECTS');
    } catch (error) {
      const codes = [...new Set(errorCodes(error))].join(',') || 'NETWORK_OR_RESPONSE_ERROR';
      const diagnostic = `stage=${stage} host=${lastHost} transport=${transport} attempt=${attempt + 1}/3 code=${codes}`;
      failures.push(diagnostic);
      if (!retryable(error) || attempt === 2 || deadline - Date.now() <= 1000) {
        throw new Error(`Release download failed: ${failures.join(' | ')}. Nothing installed. Check the existing network/proxy and certificate configuration; do not disable TLS or SHA256 verification.`);
      }
      log(`[download] ${diagnostic}; ${attempt === 0 ? 'retrying once' : 'trying system curl with the existing environment'}.`);
      await sleep(500 * (attempt + 1));
    }
  }
}

export function archiveDownloadBudget(env = process.env) {
  const raw = env.PURGE_DOWNLOAD_TIMEOUT_MS;
  if (raw === undefined || raw === '') return 180000;
  if (!/^\d+$/.test(raw) || Number(raw) < 30000 || Number(raw) > 900000) throw Error('PURGE_DOWNLOAD_TIMEOUT_MS must be 30000–900000');
  return Number(raw);
}

export function verifyChecksum(bytes, text, filename) {
  const lines = text.trim().split(/\r?\n/).map(line => /^([a-f0-9]{64})\s+\*?([^\s]+)$/i.exec(line));
  const matches = lines.filter(row => row && row[2] === filename);
  if (matches.length !== 1 || matches[0][1].toLowerCase() !== createHash("sha256").update(bytes).digest("hex")) throw Error(`SHA256 verification failed: ${filename}`);
}

export function desktopCli(executable, platform = process.platform) {
  const resources = platform === "darwin"
    ? path.resolve(executable, "../../Resources")
    : path.join(path.dirname(executable), "resources");
  const relative = "dsh/node_modules/@deepseek-ai/dsh-desktop-host/lib/cli.js";
  const cli = ["app.asar", "app.asar.unpacked", "app"].map(layout => path.join(resources, layout, relative)).find(file => fs.existsSync(file));
  if (!cli) throw Error("Cannot find this DSH Desktop's CLI. Specify the installed DSH executable, not a different Node runtime.");
  return cli;
}

export function webCli(launcher = process.env.PURGE_DSH_CLI) {
  if (!launcher) throw Error("Set PURGE_DSH_CLI to this DSH instance's launcher.");
  const cli = fs.realpathSync(launcher);
  if (!fs.statSync(cli).isFile()) throw Error("DSH CLI must be a file.");
  fs.accessSync(cli, fs.constants.R_OK);
  if (!/\.[cm]?js$/i.test(cli)) fs.accessSync(cli, fs.constants.X_OK);
  return cli;
}

// System npm installations are commonly root-owned. Keep the official package
// intact and run the same code from an owned copy; never weaken /usr permissions.
export function prepareLinuxHost(cli, { userHome = os.homedir(), log = console.log } = {}) {
  // Canonicalize existing parents even on a first install. /var -> /private/var
  // on macOS and linked Linux home directories must compare as the same tree.
  let parent = path.resolve(userHome);
  const suffix = [];
  for (;;) {
    try { userHome = path.join(fs.realpathSync(parent), ...suffix); break; }
    catch (error) {
      if (error.code !== "ENOENT" || path.dirname(parent) === parent) throw error;
      suffix.unshift(path.basename(parent)); parent = path.dirname(parent);
    }
  }
  cli = fs.realpathSync(cli);
  let root = path.dirname(cli), meta;
  for (;;) {
    try {
      const candidate = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
      const bin = typeof candidate.bin === "string" ? candidate.bin : candidate.bin?.dsh;
      if (candidate.name === "@deepseek-ai/dsh" && typeof bin === "string" && fs.realpathSync(path.resolve(root, bin)) === cli) { meta = candidate; break; }
    } catch {}
    const parent = path.dirname(root);
    if (parent === root) return { cli, copied: false };
    root = parent;
  }
  const aiBase = path.join(root, "node_modules/@deepseek-ai");
  try { fs.accessSync(root, fs.constants.W_OK); fs.accessSync(aiBase, fs.constants.W_OK); return { cli, copied: false }; } catch {}
  const inside = (base, file) => file === base || (!path.relative(base, file).startsWith(".." + path.sep) && path.relative(base, file) !== ".." && !path.isAbsolute(path.relative(base, file)));
  const identity = createHash("sha256").update(root).update(JSON.stringify(meta)).update(String(fs.statSync(path.join(root, "package.json")).mtimeMs)).update(fs.readFileSync(cli)).digest("hex");
  const hostsDir = path.join(userHome, ".local/share/dsh-purge/hosts");
  const destination = path.join(hostsDir, identity.slice(0, 20));
  const target = path.join(destination, "dsh");
  const targetCli = path.join(target, path.relative(root, cli));
  const launcher = path.join(userHome, ".local/bin/dsh");
  const owner = file => !fs.lstatSync(file).isSymbolicLink() && (typeof process.getuid !== "function" || fs.statSync(file).uid === process.getuid());
  const managed = directory => {
    try { return owner(directory) && JSON.parse(fs.readFileSync(path.join(directory, "manifest.json"), "utf8")).managedBy === "dsh-purge-linux-host"; } catch { return false; }
  };
  // Refuse to replace a user's unrelated command, including dangling symlinks.
  let previousLink = null;
  try {
    const stat = fs.lstatSync(launcher);
    const existing = stat.isSymbolicLink() && fs.realpathSync(launcher);
    previousLink = { target: stat.isSymbolicLink() ? fs.readlinkSync(launcher) : null, ino: stat.ino, dev: stat.dev };
    const directory = existing && path.dirname(path.dirname(path.dirname(existing)));
    if (!existing || !inside(hostsDir, existing) || !managed(directory)) throw Error(`Existing launcher is not managed by Purge: ${launcher}`);
  } catch (error) { if (error.code !== "ENOENT") throw error; else if (fs.existsSync(path.dirname(launcher)) && fs.readdirSync(path.dirname(launcher)).includes("dsh")) throw Error(`Existing launcher is not managed by Purge: ${launcher}`); }
  fs.mkdirSync(hostsDir, { recursive: true, mode: 0o700 });
  if (fs.existsSync(destination)) {
    if (!managed(destination) || JSON.parse(fs.readFileSync(path.join(destination, "manifest.json"), "utf8")).identity !== identity || !owner(target) || !inside(target, fs.realpathSync(targetCli))) throw Error("Invalid managed DSH copy; inspect it before retrying");
  } else {
    const stage = fs.mkdtempSync(path.join(hostsDir, ".stage-"));
    const copy = (source, dest) => {
      const stat = fs.lstatSync(source);
      if (stat.isSymbolicLink()) {
        const resolved = fs.realpathSync(source);
        if (!inside(root, resolved)) throw Error(`DSH dependency symlink escapes installation: ${source}`);
        fs.symlinkSync(path.relative(path.dirname(dest), path.join(stage, "dsh", path.relative(root, resolved))), dest);
      } else if (stat.isDirectory()) {
        fs.mkdirSync(dest, { mode: (stat.mode & 0o777) | 0o700 });
        for (const name of fs.readdirSync(source)) copy(path.join(source, name), path.join(dest, name));
      } else if (stat.isFile()) {
        fs.copyFileSync(source, dest, fs.constants.COPYFILE_FICLONE);
        fs.chmodSync(dest, (stat.mode & 0o777) | 0o200);
      } else throw Error(`Unsupported DSH package entry: ${source}`);
    };
    try {
      log(`System DSH is read-only; copying official ${meta.version} to ${target}...`);
      copy(root, path.join(stage, "dsh"));
      fs.writeFileSync(path.join(stage, "manifest.json"), JSON.stringify({ managedBy: "dsh-purge-linux-host", identity, source: root, version: meta.version }, null, 2) + "\n", { mode: 0o600 });
      fs.renameSync(stage, destination);
    } finally { removeTreeNoFollowSync(stage); }
  }
  fs.accessSync(targetCli, fs.constants.X_OK);
  // Copy preparation is not activation. Migration may still fail, so leave
  // the current command (including an older managed host) untouched until then.
  const activate = () => {
    let current = null;
    try {
      const stat = fs.lstatSync(launcher);
      current = { target: stat.isSymbolicLink() ? fs.readlinkSync(launcher) : null, ino: stat.ino, dev: stat.dev };
    } catch (error) { if (error.code !== "ENOENT") throw error; }
    if (JSON.stringify(current) !== JSON.stringify(previousLink))
      throw Error(`DSH launcher changed during installation; retained current command: ${launcher}`);
    fs.mkdirSync(path.dirname(launcher), { recursive: true });
    if (!current) fs.symlinkSync(targetCli, launcher); // exclusive: never overwrite a new user command
    else if (fs.realpathSync(launcher) !== targetCli) {
      const stage = fs.mkdtempSync(path.join(path.dirname(launcher), ".purge-launcher-"));
      try { fs.symlinkSync(targetCli, path.join(stage, "dsh")); fs.renameSync(path.join(stage, "dsh"), launcher); }
      finally { removeTreeNoFollowSync(stage); }
    }
    log(`User-owned DSH ready: ${launcher}. Quit the old DSH and launch this path to use it.`);
  };
  return { cli: targetCli, copied: true, launcher, aiBase: path.join(target, "node_modules/@deepseek-ai"), activate };
}

export async function bootstrapInstall(options = {}) {
  const { request = fetch, download = {}, run = exec, log = console.log, executable = process.execPath, platform = process.platform,
    mode = process.env.PURGE_INSTALL_MODE || "desktop",
    home = process.env.DSH_HOME || path.join(os.homedir(), ".dsh"), profile = process.env.DSH_PROFILE || (mode === "web" ? "web" : "desktop"), dryRun = false } = options;
  if (!["web", "desktop"].includes(mode)) throw Error("Invalid installation mode");
  if (Number(process.versions.node.split(".")[0]) < 18) throw Error("Node >=18 is required");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(profile)) throw Error("Invalid profile name");
  if (!fs.existsSync(path.join(home, "profiles", profile, "package.json"))) throw Error("Profile is not initialized; open DSH once first, or specify the correct home/profile.");
  let cli = options.cli || (mode === "web" ? webCli() : desktopCli(executable, platform));
  const local = options.archiveFile !== undefined || options.sha256 !== undefined;
  if (local && (!options.archiveFile || !/^[a-f0-9]{64}$/i.test(options.sha256 || ""))) throw Error("Local install requires --archive and a 64-character --sha256");
  let version = options.version || (local ? /^dsh-purge-community-(\d+\.\d+\.\d+)\.tgz$/.exec(path.basename(options.archiveFile))?.[1] : undefined);
  if (local && !version) throw Error("Specify --version for this local archive");
  if (!version) {
    const release = JSON.parse((await downloadReleaseFile(`https://api.github.com/repos/${repo}/releases/latest`, 1024 * 1024, { ...download, request, log, stage: "metadata" })).toString("utf8"));
    if (release.draft || release.prerelease) throw Error("Latest release is not stable");
    version = String(release.tag_name || "").replace(/^v/, "");
  }
  if (!/^\d+\.\d+\.\d+$/.test(version)) throw Error("Invalid release version");
  const filename = `dsh-purge-community-${version}.tgz`;
  const base = `https://github.com/${repo}/releases/download/v${version}`;
  log(`${local ? "Verifying local" : "Downloading"} Purge Community ${version}...`);
  if (local && fs.statSync(options.archiveFile).size > 50 * 1024 * 1024) throw Error("Release file too large");
  const archive = local ? fs.readFileSync(options.archiveFile) : await downloadReleaseFile(`${base}/${filename}`, 50 * 1024 * 1024, { ...download, request, log, stage: "archive", budget: archiveDownloadBudget() });
  const sums = local ? `${options.sha256}  ${filename}\n` : (await downloadReleaseFile(`${base}/SHA256SUMS.txt`, 64 * 1024, { ...download, request, log, stage: "checksum" })).toString("utf8");
  verifyChecksum(archive, sums, filename);
  if (dryRun) { log("SHA256 verified; dry run, nothing installed."); return { version, dryRun: true }; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "purge-installer-"));
  try {
    const file = path.join(tmp, filename);
    fs.writeFileSync(file, archive, { mode: 0o600 });
    const tar = platform === "win32" ? path.join(process.env.SystemRoot || "C:\\Windows", "System32", "tar.exe") : "tar";
    // cwd is passed as Unicode by CreateProcess; legacy tar builds mangle Unicode argv.
    const listing = await run(tar, ["-tzf", filename], { cwd: tmp, timeout: 30000, maxBuffer: 4 * 1024 * 1024, windowsHide: true });
    if (!listing.stdout.trim() || listing.stdout.trim().split(/\r?\n/).some(name => !/^package\//.test(name) || name.includes("\\") || name.split("/").some(part => part === ".."))) throw Error("Invalid archive paths");
    await run(tar, ["-xzf", filename], { cwd: tmp, timeout: 30000, windowsHide: true });
    const manifest = JSON.parse(fs.readFileSync(path.join(tmp, "package/package.json"), "utf8"));
    if (manifest.name !== "dsh-purge-community" || manifest.version !== version || manifest.repository?.url !== `git+https://github.com/${repo}.git`) throw Error("Release package identity mismatch");
    const host = platform === "linux" && mode === "web" ? prepareLinuxHost(cli, { userHome: options.userHome, log }) : null;
    if (host) cli = host.cli;
    const result = await run(executable, [path.join(tmp, "package/bin/community.js"), "migrate", file, ...(options.acceptBackupFailure ? ["--accept-backup-failure=" + options.acceptBackupFailure] : [])], {
      timeout: 600000, maxBuffer: 4 * 1024 * 1024, windowsHide: true,
      env: { ...process.env, ELECTRON_RUN_AS_NODE: "1", DSH_SURFACE: mode, PURGE_DSH_CLI: cli, DSH_BASE: "", DSH_HOME: home, DSH_PROFILE: profile, PURGE_PROFILE_DIR: path.join(home, "profiles", profile) },
    });
    host?.activate?.();
    if (result.stdout?.trim()) log(result.stdout.trim());
    if (result.stderr?.trim()) log(result.stderr.trim());
    log("Installed. Settings preserved. Quit and reopen DSH manually when convenient; no restart or host patch was performed.");
    return { version, installed: true };
  } finally { removeTreeNoFollowSync(tmp); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(fs.realpathSync(process.argv[1])).href) {
  try {
    const options = {};
    for (const arg of process.argv.slice(2)) {
      if (arg.startsWith("--accept-backup-failure=")) options.acceptBackupFailure = arg.slice(24);
      else if (arg === "--dry-run") options.dryRun = true;
      else if (arg.startsWith("--version=")) options.version = arg.slice(10);
      else if (arg.startsWith("--profile=")) options.profile = arg.slice(10);
      else if (arg.startsWith("--archive=")) options.archiveFile = arg.slice(10);
      else if (arg.startsWith("--sha256=")) options.sha256 = arg.slice(9);
      else throw Error(`Unknown argument: ${arg}`);
    }
    await bootstrapInstall(options);
  } catch (error) { console.error(error.stderr || error.message); process.exitCode = 1; }
}

// BEGIN standalone no-follow cleanup (checked against lib/remove-tree.js)
function removeTreeNoFollowSync(target, options = {}) {
  const io = options.fs || fs;
  const root = path.resolve(target);
  if (root === path.parse(root).root) throw Error('Refusing to remove a filesystem root');
  const maxRetries = options.maxRetries ?? 0;
  const retryDelay = options.retryDelay ?? 100;
  const retryable = new Set(['EBUSY', 'EMFILE', 'ENFILE', 'ENOTEMPTY', 'EPERM']);
  const walk = file => {
    let stat;
    try { stat = io.lstatSync(file); } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    // lstat must come before isDirectory: never stat / realpath a deletion target.
    try {
      if (stat.isSymbolicLink()) { io.unlinkSync(file); return; }
      if (stat.isDirectory()) {
        for (const name of io.readdirSync(file)) walk(path.join(file, name));
        io.rmdirSync(file); // Non-recursive: no native recursive rm fallback.
      } else io.unlinkSync(file);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  };
  for (let attempt = 0; ; attempt++) {
    try { walk(root); return; } catch (error) {
      if (error.code === 'ENOENT') return;
      if (attempt >= maxRetries || !retryable.has(error.code)) throw error;
      // Each retry re-lstats every remaining entry, including the root.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryDelay * (attempt + 1));
    }
  }
}
// END standalone no-follow cleanup
