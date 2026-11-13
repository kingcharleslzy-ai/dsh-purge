// 版本顺延：把「本 PR 的版本」对齐到合并目标的下一版，并同步所有公开文档里的当前版本行。
//   npm run bump                 → 基线（merge-base）+ 1 个 patch
//   npm run bump -- 1.6.99       → 显式指定
// 只改「当前版本」字样，不动历史条目（以 1.6.x 开头的标题行与链接定义保持原样）。
import { execFileSync } from "node:child_process";
import fs from "node:fs";

const FILES = [
  "README.md",
  "README.zh-CN.md",
  "AGENTS.md",
  "release-notes.md",
  "docs/README.en.md",
  "docs/INSTALLATION.md",
  "docs/MAINTENANCE.md",
];
const current = JSON.parse(fs.readFileSync("package.json", "utf8")).version;

function baseVersion() {
  for (const ref of ["origin/main", "fork/master", "main"]) {
    try {
      execFileSync("git", ["rev-parse", "--verify", ref], { stdio: "ignore" });
      const mb = execFileSync("git", ["merge-base", "HEAD", ref], {
        encoding: "utf8",
      }).trim();
      const pkg = JSON.parse(
        execFileSync("git", ["show", mb + ":package.json"], {
          encoding: "utf8",
        }),
      );
      return pkg.version;
    } catch {
      /* try next */
    }
  }
  return null;
}

const explicit = process.argv[2];
let next = explicit;
if (!next) {
  const base = baseVersion();
  if (!base) {
    console.error("✗ 找不到合并基线，请显式指定：npm run bump -- <version>");
    process.exit(1);
  }
  const [maj, min, patch] = base.split(".").map(Number);
  next = maj + "." + min + "." + (patch + 1);
  console.log("基线 " + base + " → 本 PR " + next);
  // 分支自己可能已经走在基线前面（连续迭代场景）：算出的号不大于当前号时停下，
  // 避免把版本改小（更新器会判定"没有新版本"）。要降号必须显式指定。
  const cmp = (a, b) => {
    const pa = a.split(".").map(Number),
      pb = b.split(".").map(Number);
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
    return 0;
  };
  if (cmp(next, current) <= 0) {
    console.error(
      "✗ 自动算出 " +
        next +
        "，不大于当前 " +
        current +
        "（分支已在基线之前推进）。",
    );
    console.error("  请显式指定：npm run bump -- <version>");
    process.exit(1);
  }
}
if (!/^\d+\.\d+\.\d+$/.test(next)) {
  console.error("✗ 版本格式应为 x.y.z：" + next);
  process.exit(1);
}

const pkg = JSON.parse(fs.readFileSync("package.json", "utf8"));
pkg.version = next;
// dsh.install.tarball 指向本版本自己的发行包，必须一起改（test/market.test.mjs 会校验）。
if (pkg.dsh && pkg.dsh.install && typeof pkg.dsh.install.tarball === "string") {
  pkg.dsh.install.tarball = pkg.dsh.install.tarball
    .replace(/\/download\/v[0-9.]+/, "/download/v" + next)
    .replace(
      new RegExp(pkg.name + "-[0-9.]+\\.tgz"),
      pkg.name + "-" + next + ".tgz",
    );
}
fs.writeFileSync("package.json", JSON.stringify(pkg, null, 2) + "\n");

const touched = ["package.json"];
for (const f of FILES) {
  if (!fs.existsSync(f)) continue;
  const src = fs.readFileSync(f, "utf8");
  // release-notes 的**第一行标题**是「当前版本」，要跟着改；其余 1.6.x 标题属历史条目，保持原样。
  const isReleaseNotes = f === "release-notes.md";
  let topHeadingSeen = false;
  const out = src
    .split("\n")
    .map((line) => {
      const isHeading = /^#{1,4}\s*1\.6\.\d+/.test(line);
      const isLinkDef = /^\[1\.6\.\d+\]:/.test(line);
      if (isHeading && isReleaseNotes && !topHeadingSeen) {
        topHeadingSeen = true;
        return line.replace(/1\.6\.\d+/, next);
      }
      if (isHeading || isLinkDef) return line;
      return line.split(current).join(next);
    })
    .join("\n");
  if (out !== src) {
    fs.writeFileSync(f, out);
    touched.push(f);
  }
}
console.log("改名完成：" + touched.join(", ") + " → " + next);
