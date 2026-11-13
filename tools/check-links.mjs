// 公开文档的相对链接与锚点门：死链是静默的，移动/改名后必须跑一遍。
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PUBLIC_DIRS = ["docs", "."];
const skip = new Set(["node_modules", ".git", "docs-private", "worktrees", "dist", "coverage"]);

function mdFiles(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(entry.name) || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) mdFiles(full, out);
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

const files = [...new Set(PUBLIC_DIRS.flatMap((d) => {
  const abs = path.join(ROOT, d);
  if (!fs.existsSync(abs)) return [];
  return d === "." ? fs.readdirSync(abs).filter((f) => f.endsWith(".md")).map((f) => path.join(abs, f)) : mdFiles(abs);
}))];

const anchorsOf = (file) => {
  const text = fs.readFileSync(file, "utf8");
  const set = new Set();
  for (const m of text.matchAll(/^#{1,6}\s+(.*)$/gm)) {
    // GitHub 的 slug：小写、去掉除空格与连字符外的标点，然后每个空格换成连字符（不折叠）。
    set.add(
      m[1]
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s-]/gu, "")
        .trim()
        .replace(/\s/g, "-"),
    );
  }
  for (const m of text.matchAll(/<a id="([^"]+)"/g)) set.add(m[1]);
  return set;
};

const problems = [];
const checked = [];
for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  checked.push(file);
  for (const m of text.matchAll(/\[([^\]]*)\]\((?!https?:|mailto:|#)([^)\s]+)\)/g)) {
    const raw = m[2];
    const [target, anchor] = raw.split("#");
    const abs = target ? path.resolve(path.dirname(file), target) : file;
    if (!fs.existsSync(abs)) {
      problems.push(path.relative(ROOT, file) + " → " + raw + "（文件不存在）");
      continue;
    }
    if (anchor && abs.endsWith(".md")) {
      if (!anchorsOf(abs).has(anchor.toLowerCase())) {
        problems.push(path.relative(ROOT, file) + " → " + raw + "（锚点不存在）");
      }
    }
  }
}

if (problems.length) {
  console.error("✗ 文档链接 " + checked.length + " 篇，问题 " + problems.length + " 处：");
  for (const p of problems) console.error("  " + p);
  process.exit(1);
}
console.log("✓ 文档链接 " + checked.length + " 篇，无死链、无失效锚点");
