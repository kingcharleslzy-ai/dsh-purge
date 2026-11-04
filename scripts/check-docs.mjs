// 文档跟着版本走：版本号、发行说明首行、英文 README 的版本行必须一致。
// 放在 CI 里跑，避免"代码发版了、README 还停在上一个版本"。
import fs from "node:fs";

const read = (file) => fs.readFileSync(file, "utf8");
const pkg = JSON.parse(read("package.json"));
const version = pkg.version;
const notesFirst = read("release-notes.md").split("\n")[0].trim();
const readme = read("README.md");
const readmeEn = read("docs/README.en.md");
const agents = read("AGENTS.md");

const problems = [];
if (read("README.zh-CN.md") !== readme) problems.push("README.zh-CN.md 必须与 README.md 保持一致");
for (const file of ["docs/MAINTENANCE.md", "docs/INSTALLATION.md"]) {
  if (!read(file).includes(`当前版本 **${version}**`)) problems.push(`${file} 当前版本未同步到 ${version}`);
}
for (const [file, needles] of [
  ["README.md", ["scripts/install.ps1", "issue #7", "插件加载前", "不修改全局 npm 源"]],
  ["AGENTS.md", ["scripts/install.ps1", "minimumReleaseAge=0", "不要安装后自动 apply/restart"]],
]) {
  for (const needle of needles) if (!read(file).includes(needle)) problems.push(`${file} 缺少安装边界：${needle}`);
}
if (notesFirst !== `# ${version}`) {
  problems.push(`release-notes.md 首行应为 "# ${version}"，实际是 "${notesFirst}"`);
}
if (!readme.includes(`**${version}**`)) {
  problems.push(`README.md 首屏缺少版本号 **${version}**`);
}
if (!readme.includes("raw.githubusercontent.com/kingcharleslzy-ai/dsh-purge/master/scripts/install.sh")) {
  problems.push("README.md 缺少安装器下载命令");
}
if (!readmeEn.includes(`Current version ${version}`)) {
  problems.push(`docs/README.en.md 缺少 "Current version ${version}"`);
}
if (!agents.includes(`当前版本：**${version}**`)) {
  problems.push(`AGENTS.md 缺少 "当前版本：**${version}**"`);
}
if (!agents.includes(`\`dsh-purge-community\` ${version}`)) {
  problems.push(`AGENTS.md §9 版本表未同步到 ${version}`);
}
const hostLine = readme.match(/适配 \*\*DSH Desktop ([0-9a-z.\-]+)\*\*/i);
if (!hostLine) problems.push("README.md 缺少「适配 DSH Desktop …」的版本行");

// Copyable release commands must move with the package version, not retain an old TGZ.
for (const file of ["README.md", "docs/README.en.md"]) {
  const doc = read(file);
  const links = [...doc.matchAll(/releases\/download\/v([0-9.]+)\/dsh-purge-community-([0-9.]+)\.tgz/g)];
  if (!links.length) problems.push(`${file} 缺少固定版本的官方 CLI 安装来源`);
  for (const [, tag, archive] of links) if (tag !== version || archive !== version)
    problems.push(`${file} CLI 安装链接版本必须为 ${version}`);
}
if (/安装器不会改动 DSH 本体|installer leaves DSH itself untouched/.test(readme + readmeEn))
  problems.push("安装说明不能承诺安装器完全不写宿主目录");

// 归档的上游 README 里有一段面向 1.0.x 独立包的 `- insert:` 配置。社区版照抄它会多出一条
// `name: 'dsh-purge'` 条目，而本包叫 `dsh-purge-community` → 宿主启动报
// `1 entry did not activate … Cannot find package 'dsh-purge'`，插件不激活。
// 归档正文保持原样，但必须带警示标记；社区自己的文档里不能出现这种照抄入口。
const LEGACY_NOTICE = "<!-- legacy-standalone-config -->";
for (const file of ["docs/upstream/README.md", "docs/upstream/README.zh-CN.md"]) {
  const doc = read(file);
  if (!doc.includes(LEGACY_NOTICE)) problems.push(`${file} 缺少旧版独立包配置警示（${LEGACY_NOTICE}）`);
  else if (!doc.slice(doc.indexOf(LEGACY_NOTICE)).includes("name: 'dsh-purge'"))
    problems.push(`${file} 的警示必须紧贴那段 name: 'dsh-purge' 的示例`);
}
for (const file of ["README.md", "README.zh-CN.md", "docs/README.en.md", "docs/INSTALLATION.md", "docs/MAINTENANCE.md", "AGENTS.md"]) {
  if (/name:\s*['"]dsh-purge['"]/.test(read(file)))
    problems.push(`${file} 出现绑定旧包名 dsh-purge 的条目示例；社区版应为 dsh-purge-community`);
}

if (problems.length) {
  console.error("✗ 文档与版本不一致：");
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log(`✓ 文档版本一致：${version}（README / release-notes / README.en 均指向该版本）`);
