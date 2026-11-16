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
function harness(transport, component = "CommunityMaintenance") {
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
      window: { location: { origin: "http://test" }, confirm: () => true },
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
    tree.root.findByProps({ "aria-label": "Select a backup to restore" }).props
      .value,
    "",
  );
  assert(button(tree, "Roll back plugin").props.disabled);
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
  assert(text(tree).includes("Loading backups"));
  assert(!text(tree).includes("No backups yet"));
  await act(async () => {
    resolve(reply({ ok: false, error: "profile ambiguous" }));
    await flush();
  });
  assert(text(tree).includes("Failed to load backups: profile ambiguous"));
  assert(!text(tree).includes("No backups yet"));
  mode = "empty";
  await click(tree, "Refresh backups");
  assert(text(tree).includes("No backups yet"));
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
  await click(tree, "Check for community updates");
  await click(tree, "Install selected version");
  assert(text(tree).includes("CLI not located"));
  assert(text(tree).includes("recovery"));
  assert(!text(tree).includes("Backup created: undefined"));
  assert.equal(h.calls.filter((c) => c.body?.op === "update").length, 1);
  assert.equal(
    tree.root.findByProps({ "aria-label": "Select a backup to restore" }).props
      .value,
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
  await click(tree, "Check for community updates");
  await click(tree, "Install selected version");
  assert(text(tree).includes("Plugin installed: 1.6.4"));
  assert(
    text(tree).includes(
      "refreshing the browser alone will not load the updated backend",
    ),
  );
  assert(!text(tree).includes("Backup created:"));
  await unmount(tree);
});
test("no-op, backup success and partial update failure keep their own result semantics", async () => {
  const h = harness((c) =>
    c.method === "GET"
      ? reply({ ok: true, backups: [] })
      : reply({ ok: true, id: "created" }),
  );
  const tree = await mount(h);
  await click(tree, "Back up now");
  assert(text(tree).includes("Backup created: created"));
  await unmount(tree);
  const context = { module: { exports: {} }, exports: {}, require };
  context.exports = context.module.exports;
  vm.runInNewContext(bundle, context);
  const { maintenanceNotice, assertMaintenanceResult } = context.module.exports;
  assert(
    maintenanceNotice("update", { ok: true, applied: false }).includes(
      "No new version was installed",
    ),
  );
  assert.match(
    maintenanceNotice("update", {
      ok: true,
      applied: true,
      cleanup_warnings: [{ stage: "checkpoint", code: "EPERM" }],
    }),
    /Cleanup incomplete.*checkpoint:EPERM.*remaining files were retained/,
  );
  assert.throws(
    () =>
      assertMaintenanceResult({
        ok: false,
        applied: true,
        error: "one target failed",
      }),
    /some targets were updated/,
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
  assert(text(tree).includes("Waiting for you to restart DSH manually"));
  await act(async () => {
    await tree.root
      .findByProps({ "aria-label": "Automatically install updates" })
      .props.onChange({ target: { checked: true } });
    await flush();
  });
  assert.equal(h.calls.at(-1).body.value.autoInstall, true);
  assert.equal(
    tree.root.findByProps({ "aria-label": "Automatically check for updates" })
      .props.checked,
    true,
  );
  await act(async () => {
    await tree.root
      .findByProps({ "aria-label": "Automatically check for updates" })
      .props.onChange({ target: { checked: false } });
    await flush();
  });
  assert.equal(
    tree.root.findByProps({ "aria-label": "Automatically install updates" })
      .props.checked,
    true,
  );
  assert.equal(
    tree.root.findByProps({ "aria-label": "Update check interval" }).props
      .disabled,
    true,
  );
  assert(
    h.calls.every((c) => c.method === "GET" || c.body.op === "preferences"),
  );
  await act(async () => {
    tree.root
      .findByProps({
        "aria-label": "Automatically install updates (view help)",
      })
      .props.onMouseEnter();
  });
  assert(text(tree).includes("Restart DSH manually afterward"));
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
                  title: "Current profile permission selection",
                  kind: "config",
                  state: "inferred",
                  ok: false,
                  applied: 0,
                  total: 1,
                  broken: [],
                  note: "Not explicitly pinned; inferred from the host",
                },
                {
                  title: "Host runtime layout",
                  kind: "layout",
                  state: "unknown",
                  ok: false,
                  applied: 0,
                  total: 1,
                  broken: [],
                  note: "The current process has not located the host",
                },
              ],
            },
      ),
    "StatusExtras",
  );
  const tree = await mount(h);
  const rendered = text(tree);
  assert(rendered.includes("2 layers need confirmation"));
  assert(rendered.includes("Inferred from host"));
  assert(rendered.includes("Unconfirmed"));
  assert(!rendered.includes("layers inactive"));
  assert(!rendered.includes("layers in place"));
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
              ? {
                  ok: false,
                  error:
                    "API quota exhausted; Atom fallback failed: proxy timeout",
                }
              : {
                  ok: true,
                  versions: [],
                  hasUpdate: false,
                  stale: true,
                  degraded:
                    "API quota exhausted; using the last successful list",
                },
          ),
    );
    const tree = await mount(h);
    await click(tree, "Check for community updates");
    assert(text(tree).includes("quota exhausted"));
    assert(text(tree).includes(failed ? "proxy timeout" : "cached list"));
    assert(!text(tree).includes("The latest stable version is installed"));
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
  assert(text(tree).includes("Version on disk: 1.6.41; running: 1.6.40"));
  await render({
    runningVersion: "1.6.41",
    restartRequired: false,
    checkedAt: "2026-10-21T00:00:00Z",
    installError: "web rollback failed",
  });
  assert(!text(tree).includes("Waiting for you to restart DSH manually"));
  assert(text(tree).includes("web rollback failed"));
  await render({
    restartRequired: true,
    pendingVersion: "1.6.33",
    reconciliationError: "package unreadable",
    error: "network timeout",
    installError: "web rollback failed",
  });
  assert(text(tree).includes("Installation status needs verification"));
  assert(text(tree).includes("package unreadable"));
  assert(text(tree).includes("network timeout"));
  assert(text(tree).includes("web rollback failed"));
  assert(!text(tree).includes("Waiting for you to restart DSH manually"));
  assert.equal(
    h.calls.length,
    0,
    "rendering status must never install or restart",
  );
  await render({
    error: "network timeout",
    installError: "network timeout",
    reconciliationError: "package unreadable",
  });
  assert.deepEqual(
    tree.root
      .findAllByProps({ role: "alert" })
      .map((node) => node.children.join("")),
    ["package unreadable", "network timeout"],
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
  await click(tree, "Save");
  assert(saved);
  assert.equal(h.calls.length, 1);
  assert.deepEqual(h.calls[0].body, {
    op: "preferences",
    value: { githubToken: "fixture-token" },
  });
  await unmount(tree);
});

test("mirror changes save only the transport preference and clearing it is explicit", async () => {
  for (const [initial, next] of [
    ["", "https://mirror.example/"],
    ["https://mirror.example/", ""],
  ]) {
    const h = harness(
      () => reply({ ok: true, update_preferences: { mirrorUrl: next } }),
      "UpdateChannelDialog",
    );
    let tree;
    await act(async () => {
      tree = create(
        React.createElement(h.Component, {
          value: {
            mirrorUrl: initial,
            proxyUrl: "socks5://proxy.test:1080",
            hasProxyCredentials: true,
            hasGithubToken: true,
          },
          onSaved() {},
          onClose() {},
        }),
      );
    });
    const field = tree.root.findByProps({
      placeholder: "https://mirror.example/",
    });
    assert.equal(field.props.value, initial);
    await act(async () => field.props.onChange({ target: { value: next } }));
    await click(tree, "Save");
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.calls[0].body, {
      op: "preferences",
      value: { mirrorUrl: next },
    });
    await unmount(tree);
  }
});
