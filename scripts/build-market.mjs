/** Official DSH format-1 index, generated only from published stable releases. */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
const repo = "kingcharleslzy-ai/dsh-purge";
export function buildMarket(releases, git = (args) => execFileSync("git", args, { encoding: "utf8" }).trim()) {
  const versions = releases.filter((r) => !r.draft && !r.prerelease && /^v1\.(?:[7-9]|[1-9]\d)\.\d+$|^v1\.6\.(?:[5-9]|[1-9]\d)$|^v[2-9]\d*\.\d+\.\d+$/.test(r.tag_name))
    .map((r) => {
      const version = r.tag_name.slice(1);
      if (!r.assets?.some((a) => a.name === `dsh-purge-community-${version}.tgz`)) return null;
      const manifest = JSON.parse(git(["show", `${r.tag_name}:package.json`]));
      if (manifest.name !== "dsh-purge-community" || manifest.version !== version || !manifest.dsh?.bundle)
        throw Error(`Invalid bundle manifest at ${r.tag_name}`);
      const commit = git(["rev-parse", `${r.tag_name}^{commit}`]);
      const publishTimestamp = Math.floor(Date.parse(r.published_at) / 1000);
      if (!/^[0-9a-f]{40}$/.test(commit) || !Number.isFinite(publishTimestamp)) throw Error("Invalid release identity");
      return { version, publishTimestamp, source: { type: "git", url: `https://github.com/${repo}`, commit },
        engines: { dsh: manifest.dsh.compatibility?.dsh || ">=0.2.1-rc.1 <0.2.2-0" } };
    }).filter(Boolean).sort((a,b) => b.publishTimestamp-a.publishTimestamp);
  if (!versions.length) throw Error("No published market-qualified release (>=1.6.5)");
  return { format: 1, title: { en: "dsh-purge Community", zh: "dsh-purge Community Plugin Index" },
    description: { en: "Verified releases maintained by kingcharleslzy-ai.", zh: "Official releases maintained by kingcharleslzy-ai." },
    plugins: [{ name: "dsh-purge-community", title: { en: "dsh-purge Community", zh: "dsh-purge Community" },
      description: { en: "Host-policy patches, prompt/rule management, diagnostics, verified updates, and local backup/rollback.", zh: "Host policy patches, prompt and rule management, diagnostics, verified updates, and local backup/rollback." },
      author: "kingcharleslzy-ai; original dsh-purge by YuJunZhiXue",
      homepage: `https://github.com/${repo}#readme`, repository: { url: `https://github.com/${repo}` },
      icon: "data:image/svg+xml;base64," + Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#166534"/><text x="32" y="45" text-anchor="middle" fill="white" font-size="44" font-family="sans-serif">P</text></svg>').toString("base64"),
      versions }] };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const input = process.argv.indexOf("--releases");
  let releases;
  if (input >= 0) releases = JSON.parse(fs.readFileSync(process.argv[input + 1], "utf8"));
  else {
    const headers = { "user-agent": "purge-community-market", accept: "application/vnd.github+json" };
    if (process.env.GH_TOKEN) headers.authorization = `Bearer ${process.env.GH_TOKEN}`;
    const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=100`, { headers, signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw Error(`Release list HTTP ${response.status}`);
    releases = await response.json();
  }
  const out = process.env.MARKET_OUTPUT || "market-dist";
  const index = buildMarket(releases);
  const qwenURL = "https://kingcharleslzy-ai.github.io/DSH-Spicy/index.json";
  const qwenResponse = await fetch(qwenURL, { signal: AbortSignal.timeout(30000), redirect: "error" });
  if (!qwenResponse.ok) throw Error(`Qwen market HTTP ${qwenResponse.status}; existing published index remains intact`);
  const qwen = await qwenResponse.json();
  const plugin = qwen.plugins?.find(p => p.name === "dsh-qwen-studio");
  if (qwen.format !== 1 || !plugin || plugin.repository?.url !== "https://github.com/kingcharleslzy-ai/DSH-Spicy" ||
    !plugin.versions?.length || plugin.versions.some(v => v.source?.type !== "git" || v.source?.url !== plugin.repository.url || !/^[a-f0-9]{40}$/.test(v.source.commit)))
    throw Error("Qwen market identity or pinned sources invalid");
  index.title = { en: "Charles DSH plugins", zh: "Charles DSH Plugin Index" };
  index.description = { en: "Verified dsh-purge Community, DSH-Spicy and Breeze Voice releases.", zh: "Verified releases for dsh-purge Community, DSH-Spicy, and Breeze Voice." };
  index.metadata = qwen.metadata;
  const voice = JSON.parse(fs.readFileSync(new URL("../market/breeze-voice.json", import.meta.url), "utf8"));
  index.plugins.push(plugin, voice);
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, "index.json"), JSON.stringify(index, null, 2) + "\n");
  fs.writeFileSync(path.join(out, "index.html"), '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Charles DSH Plugin Index</title><main><h1>Charles DSH Plugin Index</h1><p>DSH → Plugins → Experimental Plugins → Custom Plugin Market → Discover → Add Index Source.</p><p>Index: <a href="index.json">index.json</a> — copy the full URL of this link to add it.</p><p>Includes dsh-purge Community, <a href="https://github.com/kingcharleslzy-ai/DSH-Spicy">DSH-Spicy</a> (an nsfw content creation plugin that pairs well with purge), and <a href="https://github.com/kingcharleslzy-ai/dsh-breeze-voice">Breeze Voice Chat</a>. <a href="https://github.com/kingcharleslzy-ai/DSH-Spicy">Image, video, and long-form installation guide</a>.</p><p>Host policy patches, prompt management, diagnostics, updates, and backup/rollback. Installation modifies local plugins; applying host patches is a separate action. Manually restart DSH after plugin upgrades.</p><p><a href="https://github.com/kingcharleslzy-ai/dsh-purge">Source and installation instructions</a> · <a href="https://github.com/kingcharleslzy-ai/dsh-purge/releases/latest">Latest release</a></p></main></html>\n');
  console.log(`Generated ${index.plugins[0].versions.length} pinned market versions`);
}
