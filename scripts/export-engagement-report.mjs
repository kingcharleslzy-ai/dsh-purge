import { removeTreeNoFollowSync } from "../lib/remove-tree.js";
#!/usr/bin/env node
/**
 * Export a target's scoring report as a portable deliverable: `<outDir>/<target>-red-team-repro-report.md` + `<outDir>/shots/`.
 *
 * In panel-downloaded markdown, evidence screenshots use absolute paths and break when shared.
 * This copies shots/ into the output directory and uses relative paths in markdown.
 *
 * Usage:
 *   node scripts/export-engagement-report.mjs
 *   node scripts/export-engagement-report.mjs --out ~/delivery/target-name
 *   node scripts/export-engagement-report.mjs --engagement <id>
 */
import { mkdirSync, writeFileSync, cpSync, rmSync, existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { RedteamStore } from "../lib/redteam/store-core.js";

const argv = process.argv.slice(2);
const argOf = (name, fallback) => {
  const i = argv.indexOf("--" + name);
  return i === -1 || argv[i + 1] === undefined ? fallback : argv[i + 1];
};

const root = process.env.REDTEAM_HOME || join(process.env.DSH_HOME || join(homedir(), ".dsh"), "redteam");
const store = new RedteamStore(root);
const id = argOf("engagement", store.activeEngagementId());
if (!id) {
  console.error("No available target: create one in the panel first, or specify with --engagement <id>");
  process.exit(1);
}
const outDir = resolve(argOf("out", process.cwd()));
mkdirSync(outDir, { recursive: true });

const shotsSrc = join(root, "engagements", id, "shots");
const shotsDst = join(outDir, "shots");
if (existsSync(shotsSrc)) {
  removeTreeNoFollowSync(shotsDst);
  cpSync(shotsSrc, shotsDst, { recursive: true });
}

const rep = store.scoreReport(id, { shotRef: "relative" });
const name = String(rep.target || id).replace(/[/\\:*?"<>|]/g, "_");
const outFile = join(outDir, name + "-red-team-repro-report.md");
writeFileSync(outFile, rep.markdown, "utf8");
store.close();

const imgs = (rep.markdown.match(/!\[[^\]]*\]\([^)]+\)/g) || []).length;
console.log("✓ Report: " + outFile);
console.log("  Total " + rep.summary.points + " pts · " + rep.items.length + " body entries · " + imgs + " embedded screenshots"
  + (existsSync(shotsDst) ? " (shots/ " + readdirSync(shotsDst).length + " files, copy together with the report)" : ""));
