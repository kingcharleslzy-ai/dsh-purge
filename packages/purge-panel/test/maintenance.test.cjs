const { test } = require("node:test"),
  assert = require("node:assert/strict");
const vm = require("node:vm"),
  path = require("node:path");
const React = require("react"),
  { create, act } = require("react-test-renderer");
const { buildSync } = require("esbuild");
const bundle = buildSync({
  entryPoints: [path.join(__dirname, "../src/components/maintenance.js")],
  bundle: true,
  write: false,
  format: "cjs",
  platform: "browser",
  external: ["react", "react-dom"],
}).outputFiles[0].text;
const backup = (id) => ({
  id,
  created_at: "2026-10-18T00:00:00Z",
  plugins: [{ version: "1.6.3" }],
});
const reply = (body, status = 200) =>
  new Response(JSON.stringify(body), { status });
function harness(
  transport,
  component = "CommunityMaintenance",
  confirm = () => true,
) {
  const calls = [],
    context = {
      module: { exports: {} },
      exports: {},
      require,
      console,
      URL,
      AbortController,
      setTimeout,
      clearTimeout,
      window: { location: { origin: "http://test" }, confirm },
      fetch: async (url, init = {}) => {
        const call = {
          url: String(url),
          method: init.method || "GET",
          body: init.body ? JSON.parse(init.body) : null,
        };
        calls.push(call);
        return transport(call);
      },
    };
  context.exports = context.module.exports;
  vm.runInNewContext(bundle, context);
  return { Component: context.module.exports[component], calls };
}
const flush = () => new Promise((resolve) => setImmediate(resolve));
const text = (tree) => JSON.stringify(tree.toJSON());
const button = (tree, label) =>
  tree.root.findAllByType("button").find((b) => b.children.join("") === label);
async function mount(h) {
  let tree;
  await act(async () => {
    tree = create(React.createElement(h.Component));
    await flush();
  });
  return tree;
}
async function click(tree, label) {
  await act(async () => {
    await button(tree, label).props.onClick();
    await flush();
  });
}
async function unmount(tree) {
  await act(async () => tree.unmount());
}

test("mount/remount load existing backups and never preselect a rollback target", async () => {
  let rows = [backup("first")];
  const h = harness(() => reply({ ok: true, backups: rows }));
  let tree = await mount(h);
  assert(text(tree).includes("first"));
  assert.equal(
    tree.root.findByProps({ "aria-label": "选择回滚备份" }).props.value,
    "",
  );
  assert(button(tree, "回滚插件").props.disabled);
  await unmount(tree);
  rows = [backup("second")];
  tree = await mount(h);
  assert(text(tree).includes("second"));
  assert(!text(tree).includes("first"));
  assert.equal(h.calls.filter((c) => c.method === "GET").length, 2);
  assert(!h.calls.some((c) => c.method === "POST"));
  await unmount(tree);
});
test("loading, read failure and empty backup lists are distinct; refresh recovers", async () => {
  let resolve;
  let mode = "pending";
  const h = harness(() =>
    mode === "pending"
      ? new Promise((r) => {
          resolve = r;
        })
      : reply({ ok: true, backups: [] }),
  );
  const tree = await mount(h);
  assert(text(tree).includes("正在读取备份"));
  assert(!text(tree).includes("暂无备份"));
  await act(async () => {
    resolve(reply({ ok: false, error: "profile ambiguous" }));
    await flush();
  });
  assert(text(tree).includes("读取备份失败：profile ambiguous"));
  assert(!text(tree).includes("暂无备份"));
  mode = "empty";
  await click(tree, "刷新备份列表");
  assert(text(tree).includes("暂无备份"));
  await unmount(tree);
});
test("HTTP 200 business failure shows the update error and rereads recovery backups without replaying writes", async () => {
  let recovered = false;
  const h = harness((c) => {
    if (c.method === "GET")
      return reply({
        ok: true,
        backups: recovered ? [backup("recovery")] : [],
      });
    if (c.body.op === "check")
      return reply({
        ok: true,
        versions: [
          { asset: "tgz", ref: "v1.6.4", label: "Purge Community 1.6.4" },
        ],
        hasUpdate: true,
        remoteVersion: "1.6.4",
      });
    recovered = true;
    return reply({ ok: false, errors: ["CLI not located"] });
  });
  const tree = await mount(h);
  await click(tree, "检查社区版更新");
  await click(tree, "安装所选版本");
  assert(text(tree).includes("CLI not located"));
  assert(text(tree).includes("recovery"));
  assert(!text(tree).includes("备份已创建：undefined"));
  assert.equal(h.calls.filter((c) => c.body?.op === "update").length, 1);
  assert.equal(
    tree.root.findByProps({ "aria-label": "选择回滚备份" }).props.value,
    "",
  );
  await unmount(tree);
});
test("successful update reports its version and DSH process restart, not a backup notice", async () => {
  const h = harness((c) =>
    c.method === "GET"
      ? reply({ ok: true, backups: [] })
      : c.body.op === "check"
        ? reply({
            ok: true,
            versions: [{ asset: "tgz", ref: "v1.6.4", label: "1.6.4" }],
          })
        : reply({
            ok: true,
            applied: true,
            localVersion: "1.6.4",
            needRestart: true,
          }),
  );
  const tree = await mount(h);
  await click(tree, "检查社区版更新");
  await click(tree, "安装所选版本");
  assert(text(tree).includes("插件已安装：1.6.4"));
  assert(text(tree).includes("仅刷新浏览器不会加载新版后端"));
  assert(!text(tree).includes("备份已创建："));
  await unmount(tree);
});
test("no-op, backup success and partial update failure keep their own result semantics", async () => {
  const h = harness((c) =>
    c.method === "GET"
      ? reply({ ok: true, backups: [] })
      : reply({ ok: true, id: "created" }),
  );
  const tree = await mount(h);
  await click(tree, "立即备份");
  assert(text(tree).includes("备份已创建：created"));
  await unmount(tree);
  const context = { module: { exports: {} }, exports: {}, require };
  context.exports = context.module.exports;
  vm.runInNewContext(bundle, context);
  const { maintenanceNotice, assertMaintenanceResult } = context.module.exports;
  assert(
    maintenanceNotice("update", { ok: true, applied: false }).includes(
      "未安装新版本",
    ),
  );
  assert.match(
    maintenanceNotice("update", {
      ok: true,
      applied: true,
      cleanup_warnings: [{ stage: "checkpoint", code: "EPERM" }],
    }),
    /清理未完成.*checkpoint:EPERM.*残留已保留/,
  );
  assert.throws(
    () =>
      assertMaintenanceResult({
        ok: false,
        applied: true,
        error: "one target failed",
      }),
    /部分目标已更新/,
  );
});
test("late reads from an unmounted panel cannot update a new panel", async () => {
  let resolve,
    reads = 0;
  const h = harness(() =>
    ++reads === 1
      ? new Promise((r) => {
          resolve = r;
        })
      : reply({ ok: true, backups: [backup("current")] }),
  );
  let tree = await mount(h);
  await unmount(tree);
  tree = await mount(h);
  await act(async () => {
    resolve(reply({ ok: true, backups: [backup("stale")] }));
    await flush();
  });
  assert(text(tree).includes("current"));
  assert(!text(tree).includes("stale"));
  await unmount(tree);
});

test("update switches save separate preferences without invoking install or restart", async () => {
  const prefs = { autoCheck: true, autoInstall: false, intervalHours: 6 };
  const h = harness((c) => {
    if (c.method === "GET")
      return reply({
        ok: true,
        backups: [],
        update_preferences: prefs,
        update_status: { restartRequired: true, pendingVersion: "1.6.5" },
      });
    assert.equal(c.body.op, "preferences");
    Object.assign(prefs, c.body.value);
    return reply({ ok: true, update_preferences: prefs });
  });
  const tree = await mount(h);
  assert(text(tree).includes("等待你手动重启"));
  await act(async () => {
    await tree.root
      .findByProps({ "aria-label": "自动安装更新" })
      .props.onChange({ target: { checked: true } });
    await flush();
  });
  assert.equal(h.calls.at(-1).body.value.autoInstall, true);
  assert.equal(
    tree.root.findByProps({ "aria-label": "自动检查更新" }).props.checked,
    true,
  );
  await act(async () => {
    await tree.root
      .findByProps({ "aria-label": "自动检查更新" })
      .props.onChange({ target: { checked: false } });
    await flush();
  });
  assert.equal(
    tree.root.findByProps({ "aria-label": "自动安装更新" }).props.checked,
    true,
  );
  assert.equal(
    tree.root.findByProps({ "aria-label": "更新检查间隔" }).props.disabled,
    true,
  );
  assert(
    h.calls.every((c) => c.method === "GET" || c.body.op === "preferences"),
  );
  await act(async () => {
    tree.root
      .findByProps({ "aria-label": "自动安装更新（查看说明）" })
      .props.onMouseEnter();
  });
  assert(text(tree).includes("不会自动重启 DSH"));
  await unmount(tree);
});

test("selfcheck inferred and unknown values show warning labels and explanation instead of red or all-green", async () => {
  const h = harness(
    ({ url }) =>
      reply(
        url.endsWith("/boost")
          ? { enabled: true }
          : {
              state: "unknown",
              layers: [
                {
                  title: "当前 profile 的权限选择",
                  kind: "config",
                  state: "inferred",
                  ok: false,
                  applied: 0,
                  total: 1,
                  broken: [],
                  note: "未显式固定，宿主推导已生效",
                },
                {
                  title: "宿主运行方式",
                  kind: "layout",
                  state: "unknown",
                  ok: false,
                  applied: 0,
                  total: 1,
                  broken: [],
                  note: "当前进程未定位宿主",
                },
              ],
            },
      ),
    "StatusExtras",
  );
  const tree = await mount(h);
  const rendered = text(tree);
  assert(rendered.includes("2 层需确认"));
  assert(rendered.includes("宿主推导"));
  assert(rendered.includes("未确认"));
  assert(!rendered.includes("层未生效"));
  assert(!rendered.includes("全部在位"));
  assert(!rendered.includes("is-bad"));
  await unmount(tree);
});

test("cached releases and failed fallbacks are visible instead of claiming latest", async () => {
  for (const failed of [false, true]) {
    const h = harness((c) =>
      c.method === "GET"
        ? reply({ ok: true, backups: [] })
        : reply(
            failed
              ? { ok: false, error: "API 额度耗尽；Atom 降级失败：代理超时" }
              : {
                  ok: true,
                  versions: [],
                  hasUpdate: false,
                  stale: true,
                  degraded: "API 额度耗尽，沿用最近一次成功列表",
                },
          ),
    );
    const tree = await mount(h);
    await click(tree, "检查社区版更新");
    assert(text(tree).includes("额度耗尽"));
    assert(text(tree).includes(failed ? "代理超时" : "缓存列表"));
    assert(!text(tree).includes("当前已是最新正式版"));
    await unmount(tree);
  }
});

test("update status distinguishes loaded code, pending disk version and independent failures", async () => {
  const h = harness(() => reply({ ok: true }), "UpdatePreferences");
  let tree;
  const render = async (status) =>
    act(async () => {
      const props = {
        value: { autoCheck: true, autoInstall: true, intervalHours: 24 },
        status,
        onSaved() {},
      };
      if (tree) tree.update(React.createElement(h.Component, props));
      else tree = create(React.createElement(h.Component, props));
    });
  await render({
    runningVersion: "1.6.40",
    pendingVersion: "1.6.41",
    restartRequired: true,
  });
  assert(text(tree).includes("磁盘版本 1.6.41，当前运行 1.6.40"));
  await render({
    runningVersion: "1.6.41",
    restartRequired: false,
    checkedAt: "2026-10-21T00:00:00Z",
    installError: "web rollback failed",
  });
  assert(!text(tree).includes("等待你手动重启"));
  assert(text(tree).includes("web rollback failed"));
  await render({
    restartRequired: true,
    pendingVersion: "1.6.33",
    reconciliationError: "package unreadable",
    error: "network timeout",
    installError: "web rollback failed",
  });
  assert(text(tree).includes("安装状态待核对"));
  assert(text(tree).includes("package unreadable"));
  assert(text(tree).includes("network timeout"));
  assert(text(tree).includes("web rollback failed"));
  assert(!text(tree).includes("等待你手动重启"));
  assert.equal(
    h.calls.length,
    0,
    "rendering status must never install or restart",
  );
  await unmount(tree);
});

test("saving a token does not erase masked proxy credentials or auto-update preferences", async () => {
  const h = harness(
    () => reply({ ok: true, update_preferences: { hasGithubToken: true } }),
    "UpdateChannelDialog",
  );
  let tree,
    saved = false;
  await act(async () => {
    tree = create(
      React.createElement(h.Component, {
        value: {
          proxyUrl: "socks5://proxy.test:1080",
          hasProxyCredentials: true,
          hasGithubToken: true,
        },
        onSaved() {
          saved = true;
        },
        onClose() {},
      }),
    );
  });
  const field = tree.root
    .findAllByType("input")
    .find((n) => n.props.type === "password");
  assert.equal(field.props.value, "");
  await act(async () =>
    field.props.onChange({ target: { value: "fixture-token" } }),
  );
  await click(tree, "保存");
  assert(saved);
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0].body, {
    op: "preferences",
    value: { githubToken: "fixture-token" },
  });
  await unmount(tree);
});

test("update offers a second explicit backup decision, scoped to the failed profile and selected release", async () => {
  const confirmations = [];
  const token = "a".repeat(64);
  const h = harness(
    (c) => {
      if (c.method === "GET") return reply({ ok: true, backups: [] });
      if (c.body.op === "check")
        return reply({
          ok: true,
          versions: [{ asset: "tgz", ref: "v1.6.63", label: "1.6.63" }],
        });
      if (!c.body.acceptBackupFailures)
        return reply({
          ok: false,
          error: "backup destination full",
          release: { ref: "v1.6.63" },
          targets: [
            {
              profile: "desktop",
              ok: false,
              backup_failure: {
                can_continue: true,
                confirmation: token,
                message: "完整备份未完成",
              },
            },
          ],
        });
      assert.equal(c.body.acceptBackupFailures.desktop, token);
      assert.equal(c.body.ref, "v1.6.63");
      return reply({
        ok: true,
        applied: true,
        release: { version: "1.6.63" },
        backup_warnings: [{ accepted: true }],
      });
    },
    "CommunityMaintenance",
    (message) => {
      confirmations.push(message);
      return true;
    },
  );
  const tree = await mount(h);
  await click(tree, "检查社区版更新");
  await click(tree, "安装所选版本");
  assert.equal(h.calls.filter((c) => c.body?.op === "update").length, 2);
  assert.equal(confirmations.length, 2);
  assert.match(confirmations[1], /放弃完整历史备份/);
  assert(text(tree).includes("本次未保留完整备份"));
  await unmount(tree);
});
for (const blocked of [false, true])
  test(`backup decision ${blocked ? "security blocked" : "user declined"} never retries installation`, async () => {
    let prompts = 0;
    const h = harness(
      (c) =>
        c.method === "GET"
          ? reply({ ok: true, backups: [] })
          : c.body.op === "check"
            ? reply({
                ok: true,
                versions: [{ asset: "tgz", ref: "v1.6.63", label: "1.6.63" }],
              })
            : reply({
                ok: false,
                error: blocked ? "Defender UNKNOWN" : "backup failed",
                targets: [
                  {
                    profile: "desktop",
                    ok: false,
                    backup_failure: {
                      can_continue: !blocked,
                      confirmation: blocked ? "" : "a".repeat(64),
                      message: "backup failed",
                    },
                  },
                ],
              }),
      "CommunityMaintenance",
      () => ++prompts === 1,
    );
    const tree = await mount(h);
    await click(tree, "检查社区版更新");
    await click(tree, "安装所选版本");
    assert.equal(h.calls.filter((c) => c.body?.op === "update").length, 1);
    assert.equal(prompts, blocked ? 1 : 2);
    assert(text(tree).includes(blocked ? "Defender UNKNOWN" : "backup failed"));
    await unmount(tree);
  });
