/** Narrow recovery for a stale public mirror; never relax pnpm policies. */
export const OFFICIAL_REGISTRY = "https://registry.npmjs.org/";
const MIRROR = "https://registry.npmmirror.com/";
const PUBLIC_PACKAGE = "@dsh-ops/bash-win32-x64";

export function missingPublicVersion(error) {
  const log = [error?.stdout, error?.stderr].filter(Boolean).join("\n");
  const codes = [...log.matchAll(/\bERR_PNPM_[A-Z_]+\b/g)].map(m => m[0]);
  if (!codes.length || codes.some(c => c !== "ERR_PNPM_MINIMUM_RELEASE_AGE_VIOLATION")) return null;
  if (!/\b1 lockfile entries failed verification:/.test(log)) return null;
  const entries = [...log.matchAll(/^\s*(@[^\s]+|[^\s@]+)@(\d+\.\d+\.\d+(?:-[\w.-]+)?) could not be checked against minimumReleaseAge \(version not present in registry manifest\)\s*$/gm)];
  if (entries.length !== 1 || entries[0][1] !== PUBLIC_PACKAGE) return null;
  return { name: entries[0][1], version: entries[0][2] };
}

function registryURL(output) {
  const line = String(output || "").trim().split(/\r?\n/).at(-1);
  if (["undefined", "null", ""].includes(line)) return null;
  try {
    const u = new URL(line);
    return !u.username && !u.password && u.protocol === "https:" ? u.href.replace(/\/?$/, "/") : "invalid";
  } catch { return "invalid"; }
}

async function verifyOfficial({ name, version }, request) {
  const response = await request(OFFICIAL_REGISTRY + encodeURIComponent(name), {
    redirect: "error", signal: AbortSignal.timeout(15000),
    headers: { accept: "application/json" },
  });
  if (!response.ok || Number(response.headers.get("content-length")) > 2 * 1024 * 1024) return false;
  let size = 0;
  const chunks = [];
  for await (const chunk of response.body) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw Error("registry metadata too large");
    chunks.push(chunk);
  }
  const meta = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  const pkg = meta.versions?.[version];
  const time = Date.parse(meta.time?.[version]);
  const tarball = new URL(pkg?.dist?.tarball || "invalid:");
  return meta.name === name && pkg?.name === name && pkg.version === version
    && Number.isFinite(time) && time <= Date.now()
    && /^sha512-[A-Za-z0-9+/]+=*$/.test(pkg.dist?.integrity || "")
    && tarball.origin === "https://registry.npmjs.org";
}

/** run receives additional pnpm arguments, config receives a single config key. */
export async function installWithRegistryRecovery({ run, config, request = fetch, warn = console.warn }) {
  try { return await run([]); }
  catch (original) {
    const missing = missingPublicVersion(original);
    if (!missing) throw original;
    try {
      // A private or unknown registry must never silently fall through to public npm.
      const scoped = registryURL(await config("@dsh-ops:registry"));
      const registry = scoped ?? registryURL(await config("registry"));
      if (registry !== MIRROR || !await verifyOfficial(missing, request)) throw original;
    } catch {
      throw new Error(`The install source cannot verify the pinned @dsh-ops version. Security checks were not disabled and source settings were not changed; check the download source and network. See docs/INSTALLATION.md (issue #7).\nOriginal error: ${original.message}`, { cause: original });
    }
    warn(`Public mirror lacks ${missing.name}@${missing.version}; retrying this one @dsh-ops download against the npm registry, verification stays on.`);
    try { return await run([`--config.@dsh-ops:registry=${OFFICIAL_REGISTRY}`]); }
    catch (retry) {
      throw new Error(`Retry against the npm registry failed too: ${retry.message}\nKeep the backup and check the network; no further retries and verification stays on.`, { cause: retry });
    }
  }
}
