// Keep package, release notes, and documentation versions synchronized in CI.
import fs from "node:fs";
import { checkInstallExamples } from "./lib/check-install-examples.mjs";

const read = (file) => fs.readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const version = pkg.version;
const notesFirst = read("release-notes.md").split("\n")[0].trim();
const readme = read("README.md");
const readmeEn = read("docs/README.en.md");
const agents = read("AGENTS.md");

const problems = [];
const releaseSummary = `docs/releases/${version}.md`;
if (!fs.existsSync(releaseSummary)) {
  problems.push(`${releaseSummary} is missing the release summary`);
} else if (fs.statSync(releaseSummary).size > 8 * 1024) {
  problems.push(`${releaseSummary} exceeds 8 KiB. Keep changes and known limitations here; link to detailed records.`);
}
for (const file of ["docs/MAINTENANCE.md", "docs/INSTALLATION.md"]) {
  const doc = read(file);
  if (!doc.includes(`Current version **${version}**`)) problems.push(`${file} version is not synchronized to ${version}`);
}
for (const [file, needles] of [
  ["README.md", ["scripts/install.ps1", "issue #7", "before plugin loading", "global npm registry changes"]],
  ["AGENTS.md", ["scripts/install.ps1", "minimumReleaseAge=0", "Do not automatically apply/restart after installation"]],
]) {
  for (const needle of needles) if (!read(file).includes(needle)) problems.push(`${file} is missing an installation constraint: ${needle}`);
}
if (notesFirst !== `# ${version}`) {
  problems.push(`release-notes.md must start with "# ${version}"; found "${notesFirst}"`);
}
if (!readme.includes(`**${version}**`)) {
  problems.push(`README.md is missing version **${version}**`);
}
if (!readme.includes("raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh")) {
  problems.push("README.md is missing the installer download command");
}
if (!readmeEn.includes(`Current version ${version}`)) {
  problems.push(`docs/README.en.md is missing "Current version ${version}"`);
}
if (!agents.includes(`Current version: **${version}**`)) {
  problems.push(`AGENTS.md is missing its current version declaration for ${version}`);
}
if (!agents.includes(`\`dsh-purge-community\` ${version}`)) {
  problems.push(`AGENTS.md section 9 version table is not synchronized to ${version}`);
}
const hostLine = readme.match(/Targets \*\*DSH Desktop ([0-9a-z.\-]+)\*\*/i);
if (!hostLine) problems.push("README.md is missing the Targets DSH Desktop version line");

// Copyable release commands must move with the package version, not retain an old TGZ.
for (const file of ["README.md", "docs/README.en.md"]) {
  const doc = read(file);
  const links = [...doc.matchAll(/releases\/download\/v([0-9.]+)\/dsh-purge-community-([0-9.]+)\.tgz/g)];
  if (!links.length) problems.push(`${file} is missing a pinned official CLI installation source`);
  for (const [, tag, archive] of links) if (tag !== version || archive !== version)
    problems.push(`${file} CLI installation links must use version ${version}`);
}
if (/installer leaves DSH itself untouched/.test(readme + readmeEn))
  problems.push("Installation instructions must not claim the installer never writes to host directories");

// Historical examples remain intact, with a warning attached to the actual YAML.
// Parse entries so quote style cannot bypass the guard and prose is not mistaken for config.
for (const file of ["docs/upstream/README.md"])
  for (const problem of checkInstallExamples(read(file), { archive: true })) problems.push(`${file}: ${problem}`);
for (const file of ["README.md", "docs/README.en.md", "docs/INSTALLATION.md", "docs/MAINTENANCE.md", "AGENTS.md"])
  for (const problem of checkInstallExamples(read(file))) problems.push(`${file}: ${problem}`);

if (problems.length) {
  console.error("Documentation/version inconsistencies:");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`Documentation versions match: ${version} (README / release-notes / README.en)`);
