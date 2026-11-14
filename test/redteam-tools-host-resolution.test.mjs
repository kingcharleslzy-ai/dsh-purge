// 桌面版宿主启动（out/main/host.js）时 loadDefineTool() 必须仍能找到 @deepseek-ai/dsh-tools。
// 回归背景：1.7.14 的候选路径只覆盖 CLI 启动（argv[1] = node_modules/@deepseek-ai/dsh 内的 bin）。
// DSH Desktop 0.2.2 的 Electron 宿主用 ELECTRON_RUN_AS_NODE 启动 <app>/out/main/host.js，
// considerBin 的全部候选落空 → 模块加载抛错 → 预设行 redteam-tools never started
// → 整份「红队模式」被模式下拉过滤（无限制模式等不含本插件行的预设不受影响）。
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const repoRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const toolsModule = path.join(repoRoot, "lib", "redteam", "tools.js");
const source = fs.readFileSync(toolsModule, "utf8");

/** 复刻 DSH Desktop 解包布局：<app>/out/main/host.js + <app>/node_modules/@deepseek-ai/{dsh,dsh-tools}。 */
function buildDesktopHostTree(root, withPackages) {
  const app = path.join(root, "app");
  fs.mkdirSync(path.join(app, "out", "main"), { recursive: true });
  fs.writeFileSync(path.join(app, "out", "main", "host.js"), "// fixture desktop host entry\n");
  if (withPackages) {
    const scope = path.join(app, "node_modules", "@deepseek-ai");
    fs.mkdirSync(path.join(scope, "dsh"), { recursive: true });
    fs.writeFileSync(
      path.join(scope, "dsh", "package.json"),
      JSON.stringify({ name: "@deepseek-ai/dsh", version: "0.0.0-fixture" }),
    );
    fs.mkdirSync(path.join(scope, "dsh-tools"), { recursive: true });
    fs.writeFileSync(
      path.join(scope, "dsh-tools", "package.json"),
      JSON.stringify({ name: "@deepseek-ai/dsh-tools", version: "0.0.0-fixture", main: "index.js" }),
    );
    fs.writeFileSync(
      path.join(scope, "dsh-tools", "index.js"),
      "export function defineTool(definition, fn) { return fn }\nexport default { defineTool }\n",
    );
  }
  return path.join(app, "out", "main", "host.js");
}

/** 固定其它候选输入，让结果只由 argv 决定。 */
function isolateCandidateInputs(envBackup) {
  envBackup.PURGE_DSH_CLI = process.env.PURGE_DSH_CLI;
  envBackup.DSH_HOME = process.env.DSH_HOME;
  delete process.env.PURGE_DSH_CLI;
  delete process.env.DSH_HOME;
}

function restoreCandidateInputs(envBackup) {
  for (const [key, value] of Object.entries(envBackup)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

test("source wires the host-entry walk into loadDefineTool", () => {
  assert.match(source, /function considerHostTree\(/, "必须有从宿主入口向上探测的函数");
  assert.match(
    source,
    /considerHostTree\(candidates, process\.argv\[1\]\)/,
    "argv[1]（CLI bin 或桌面 host.js）必须参与探测",
  );
  assert.match(
    source,
    /considerHostTree\(candidates, process\.argv\[2\]\)/,
    "argv[2]（桌面宿主的应用根目录）必须参与探测",
  );
  assert.match(
    source,
    /considerHostTree\(candidates, process\.env\.PURGE_DSH_CLI\)/,
    "PURGE_DSH_CLI 也必须走同样的向上探测",
  );
  assert.match(
    source,
    /'@deepseek-ai', 'dsh', 'package\.json'/,
    "探测目标必须是宿主包的 package.json",
  );
});

test("desktop host entry (out/main/host.js) resolves dsh-tools from the app tree", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-redteam-host-"));
  const envBackup = {};
  const argvBackup = [process.argv[0], process.argv[1], process.argv[2]];
  try {
    isolateCandidateInputs(envBackup);
    const hostEntry = buildDesktopHostTree(root, true);
    process.argv[1] = hostEntry;
    process.argv[2] = undefined;
    const mod = await import(`${pathToFileURL(toolsModule).href}?case=desktop-host`);
    assert.equal(mod.name, "dsh-purge-redteam-tools");
    assert.ok(Array.isArray(mod.inject) && mod.inject.includes("tools"));
  } finally {
    process.argv[1] = argvBackup[1];
    process.argv[2] = argvBackup[2];
    restoreCandidateInputs(envBackup);
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("without the app tree the module still fails with the diagnostic error", async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "purge-redteam-bare-"));
  const envBackup = {};
  const argvBackup = [process.argv[0], process.argv[1], process.argv[2]];
  try {
    isolateCandidateInputs(envBackup);
    const hostEntry = buildDesktopHostTree(root, false);
    process.argv[1] = hostEntry;
    process.argv[2] = undefined;
    await assert.rejects(
      () => import(`${pathToFileURL(toolsModule).href}?case=bare-host`),
      /cannot resolve @deepseek-ai\/dsh-tools from host/,
    );
  } finally {
    process.argv[1] = argvBackup[1];
    process.argv[2] = argvBackup[2];
    restoreCandidateInputs(envBackup);
    fs.rmSync(root, { recursive: true, force: true });
  }
});
