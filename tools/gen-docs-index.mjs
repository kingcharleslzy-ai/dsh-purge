// 用法：npm run docs:index —— 增删 `docs/*.md` 之后手动跑一次，`docs/INDEX.md` 随仓库提交。
// 没有接进 check:docs：索引是导航而非事实，漂移不会让读者拿到错结论，不值得让 CI 因它变红。
import fs from "node:fs";
import path from "node:path";
const R = process.cwd();
const docs = fs.readdirSync(path.join(R, "docs")).filter((f) => f.endsWith(".md")).sort();
const releases = fs.existsSync(path.join(R, "docs/releases"))
  ? fs.readdirSync(path.join(R, "docs/releases")).filter((f) => f.endsWith(".md")).sort((a, b) => {
      const n = (s) => s.replace(/\.md$/, "").split(".").map(Number);
      const [a1, a2, a3] = n(a), [b1, b2, b3] = n(b);
      return a1 - b1 || a2 - b2 || a3 - b3;
    })
  : [];
const title = (file) => {
  const text = fs.readFileSync(file, "utf8");
  const m = text.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : path.basename(file, ".md");
};
const GROUPS = [
  ["怎么用", ["INSTALLATION.md", "AUTO-UPDATE.md", "MARKET-MIGRATION.md", "DSH-STORE.md", "CWD-COMPAT.md"]],
  ["怎么回事", ["MAINTENANCE.md", "WEB-MAINTENANCE.md", "NATIVE-PANEL.md", "maintenance-detail-page.md", "detail.zh.md", "detail.en.md"]],
  ["踩过什么坑", docs.filter((f) => f.startsWith("maintenance-"))],
];
const used = new Set();
const line = (f) => "- [" + title(path.join(R, "docs", f)) + "](" + f + ")";
let out = "# 文档索引\n\n";
out += "> 公开文档只记**已发生的事实**：怎么用、怎么回事、怎么验收、已知限制。\n";
out += "> 排期、逐版本过程记录、本机取证在 `docs-private/`（不入库），结论稳定后升级到这里。\n\n";
for (const [name, files] of GROUPS) {
  const rows = files.filter((f) => docs.includes(f) && !used.has(f));
  if (!rows.length) continue;
  out += "## " + name + "\n\n";
  for (const f of rows) { out += line(f) + "\n"; used.add(f); }
  out += "\n";
}
const rest = docs.filter((f) => !used.has(f) && f !== "INDEX.md");
if (rest.length) {
  out += "## 其它\n\n";
  for (const f of rest) out += line(f) + "\n";
  out += "\n";
}
if (releases.length) {
  out += "## 逐版本发行范围（" + releases.length + " 篇）\n\n";
  out += releases.map((f) => "- [" + f.replace(/\.md$/, "") + "](releases/" + f + ")").join("\n") + "\n\n";
}
out += "## 根目录\n\n- [README](../README.md) · [AGENTS.md](../AGENTS.md) · [发行说明](../release-notes.md) · [NOTICE](../NOTICE.md)\n";
fs.writeFileSync(path.join(R, "docs/INDEX.md"), out);
console.log("docs/INDEX.md 生成：", docs.length, "篇 + releases", releases.length, "篇");
