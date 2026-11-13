process.env.PANEL_CLIENT = require("path").join(__dirname, "..", "client.js");
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert");
const React = require("react"),
  { create, act } = require("react-test-renderer");
const calls = [],
  writes = [],
  seats = [],
  definitions = [];
const headStyles = [],
  lifecycle = [];
const doc = {
  head: {
    append(node) {
      headStyles.push(node);
    },
  },
  createElement(tag) {
    assert.equal(tag, "style");
    return {
      setAttribute() {},
      textContent: "",
      remove() {
        const index = headStyles.indexOf(this);
        if (index >= 0) headStyles.splice(index, 1);
      },
    };
  },
};
let plugin,
  dict = {};
const responses = {
  "/dsh-purge/status": {
    ok: true,
    surface: "desktop",
    ai_base: "/fixture",
    patches_total: 68,
    patches_applied: 66,
    patches_skipped: 2,
    patches_pending: 0,
    patch_status: {},
    patches: [],
    plugin_version: "1.1.71",
    has_backup: true,
  },
  "/dsh-purge/update": { versions: [], channel: "stable" },
  "/dsh-purge/override": {
    ok: true,
    content: "Existing test prompt",
    defaultContent: "Default test prompt",
  },
  "/dsh-purge/own-servers": { ok: true, content: "example.test" },
  "/dsh-purge/hooks-deny": { ok: true, hooksDenyBypass: false },
  "/dsh-purge/drill-grant": { ok: true, granted: false },
};
const storage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};
const win = {
  location: { origin: "http://test", href: "http://test" },
  localStorage: storage,
  sessionStorage: storage,
  setTimeout,
  clearTimeout,
  addEventListener() {},
  removeEventListener() {},
  __ModuleLoader__: {
    load: ({ factory }) => {
      plugin = factory((n) => (n === "react" ? React : require(n)));
    },
  },
};
const sandbox = {
  window: win,
  document: doc,
  localStorage: storage,
  console,
  AbortController,
  URL,
  setTimeout,
  clearTimeout,
  setInterval,
  clearInterval,
  fetch: async (url, init = {}) => {
    const path = new URL(url, "http://test").pathname;
    calls.push(path);
    if (init.method === "POST") writes.push(path);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(responses[path] || { ok: true }),
      json: async () => responses[path] || { ok: true },
    };
  },
};
vm.runInNewContext(
  fs.readFileSync(
    process.env.PANEL_CLIENT || "../dsh-purge-ui/client.js",
    "utf8",
  ),
  sandbox,
);
const ctx = {
  locale: {
    register: (_, v) => {
      dict = v.zh;
      return () => {};
    },
    bind: () => (k) => dict[k] || k,
  },
  effect: (fn, name) => {
    const dispose = fn();
    lifecycle.push({ name, dispose });
    return dispose;
  },
  slots: {
    inject: (_, fn) => fn(),
    register: (spec, body) => {
      seats.push({ spec, body });
      return () => {};
    },
  },
  sidebarRight: { openTab() {} },
  sidebarRightTabs: {
    register: (d) => {
      definitions.push(d);
      return () => {};
    },
  },
  inject: (deps, fn) => {
    if (deps[0] === "sidebarRightTabs" || deps[0] === "sessions") fn(ctx);
  },
};
plugin.apply(ctx);
// The gate stays the first stylesheet apply installs; the plugin's own sheet is
// installed once, right after it (it used to be rendered inside each page).
assert(
  headStyles.length >= 1,
  "Legacy visibility must install before any overlay is rendered",
);
assert(
  headStyles[0].textContent.includes(".dshp-dock{display:none!important}"),
  "legacy visibility gate is the first stylesheet",
);
assert(
  headStyles.some((el) => el.textContent.includes(".dpg-card")),
  "plugin stylesheet is installed once at apply",
);
if (process.env.PANEL_CLIENT) {
  assert.equal(plugin.name, "dsh-purge-panel");
  const rewindSeat = seats.find(
    (x) => x.spec.name === "conversation.input.right",
  );
  assert(rewindSeat, "rewind slot is registered");
  assert.equal(rewindSeat.spec.id, "dsh-purge-rewind");
  assert.equal(rewindSeat.spec.order, 20);
}
assert(
  !seats.some((x) => x.spec.name === "sidebar.panellist"),
  "the left rail entry is gone: the plugin detail page is the single entry",
);
assert(
  !seats.some((x) => x.spec.name === "main"),
  "the standalone page is gone: the plugin detail page is the single entry",
);
const statusSeat = seats.find((x) => x.spec.name === "plugins.detail.section");
assert(statusSeat, "the status area is registered on the detail section slot");
assert.equal(statusSeat.spec.id, "dsh-purge-status");
const rowSeat = seats.find((x) => x.spec.name === "plugins.row.config");
assert(rowSeat, "the row page is registered on the row slot");
assert.equal(
  rowSeat.spec.key,
  plugin.name +
    "#" +
    (plugin.name === "dsh-purge-panel" ? "dsh-purge-panel" : "dsh-purge"),
);
const body = statusSeat.body;
const SUBJECT = { kind: "bundle", pkg: { name: plugin.name } };
const configBody = rowSeat.body;
const byClass = (node, name) =>
  node.findAll(
    (x) =>
      typeof x.props.className === "string" &&
      x.props.className.split(/\s+/).includes(name),
  );
const test = async () => {
  // The plugin page: the status area and one business component.
  let page;
  await act(async () => {
    page = create(
      React.createElement(body, { t: ctx.locale.bind(), subject: SUBJECT }),
    );
    await new Promise((r) => setTimeout(r, 10));
  });
  assert.equal(
    byClass(page.root, "dpg-card").length,
    1,
    "the plugin page carries the status area only",
  );
  assert.equal(
    byClass(page.root, "dpg-facts").length,
    1,
    "the status card renders one facts list",
  );
  assert.equal(
    byClass(page.root, "dpg-tab").length,
    0,
    "the plugin page carries no business area",
  );
  assert.equal(
    byClass(page.root, "dshpp-page-tabs").length,
    0,
    "the tab strip is gone",
  );
  await act(async () => page.unmount());
  // The rule view seeds itself on first open; the configuration flow is measured
  // from here, so reset the ledger.
  writes.length = 0;
  // The configuration lives on the row page.
  let tree;
  await act(async () => {
    tree = create(
      React.createElement(configBody, { view: "page", t: ctx.locale.bind() }),
    );
    await new Promise((r) => setTimeout(r, 10));
  });
  const root = tree.root;
  const btn = (text) =>
    root.findAllByType("button").find((x) => x.children.join("") === text);
  const area = (label) =>
    root.findAllByType("textarea").find((x) => x.props["aria-label"] === label);
  assert.equal(
    byClass(root, "dpg-config").length,
    1,
    "the row page is the configuration area",
  );
  assert.equal(area("提示词内容").props.value, "Existing test prompt");
  await act(async () =>
    area("提示词内容").props.onChange({ target: { value: "UNSAVED prompt" } }),
  );
  await act(async () =>
    area("服务器名单").props.onChange({
      target: { value: "unsaved.example.test" },
    }),
  );
  await act(async () => {
    btn("刷新").props.onClick();
    await new Promise((r) => setTimeout(r, 10));
  });
  assert.equal(area("提示词内容").props.value, "UNSAVED prompt");
  assert.equal(area("服务器名单").props.value, "unsaved.example.test");
  // POST-shaped reads (`{op:"status"}`) are reads: count mutations only.
  // The row page also carries the business area; its rule view seeds itself once.
  assert(
    writes.every((path) => path === "/dsh-purge/rules"),
    "opening the configuration writes nothing beyond the one-time rule seed: " +
      JSON.stringify(writes),
  );
  assert(
    !root
      .findAllByType("button")
      .some((x) =>
        /dshp-launch|hero-chip|tab-btn/.test(x.props.className || ""),
      ),
  );
  await act(async () => tree.unmount());
  if (process.env.PANEL_CLIENT) {
    const overlay = seats.find(
      (x) => x.spec.id === "dsh-purge-panel-overlays",
    ).body;
    let o;
    await act(async () => {
      o = create(React.createElement(overlay));
    });
    const dialogs = () => o.root.findAll((x) => x.props.role === "dialog");
    assert.equal(
      dialogs().length,
      1,
      "first-run welcome notice is restored into the overlay",
    );
    assert(JSON.stringify(o.toJSON()).includes("用户须知"));
    assert(
      !o.root
        .findAllByType("button")
        .some((x) =>
          /dshp-launch|hero-chip|tab-btn/.test(x.props.className || ""),
        ),
      "no legacy launcher buttons in the overlay",
    );
    await act(async () => {
      o.root.findByType("input").props.onChange({ target: { checked: true } });
    });
    await act(async () => {
      o.root
        .findAllByType("button")
        .find((x) => x.children.join("") === "我已知晓并继续")
        .props.onClick();
    });
    assert.equal(dialogs().length, 0, "acknowledging closes the notice");
    await act(async () => o.unmount());
    assert.equal(
      headStyles.length,
      2,
      "Unmounting an overlay must not expose the legacy dock",
    );
    lifecycle.find((x) => x.name === "panel legacy visibility").dispose();
    assert.equal(
      headStyles.length,
      1,
      "Disabling the plugin must remove only its owned visibility style",
    );
    lifecycle.find((x) => x.name === "dsh-purge styles").dispose();
    assert.equal(
      headStyles.length,
      0,
      "the plugin stylesheet is reclaimed with the fiber",
    );
    responses["/dsh-purge/status"].plugin_version = "2.0.0";
    await act(async () => {
      tree = create(
        React.createElement(body, { t: ctx.locale.bind(), subject: SUBJECT }),
      );
      await new Promise((r) => setTimeout(r, 10));
    });
    assert.equal(
      tree.root.findAll(
        (x) =>
          x.props.role === "status" && /dpg-note/.test(x.props.className || ""),
      ).length,
      1,
      "the version mismatch note renders from the refreshed status",
    );
    await act(async () => tree.unmount());
    responses["/dsh-purge/status"] = { ok: false, error: "unavailable" };
    await act(async () => {
      tree = create(
        React.createElement(body, { t: ctx.locale.bind(), subject: SUBJECT }),
      );
      await new Promise((r) => setTimeout(r, 10));
    });
    assert(
      JSON.stringify(tree.toJSON()).includes("状态读取失败：unavailable"),
      "an unavailable status is named on the page",
    );
    await act(async () => tree.unmount());
    assert(
      writes.every((path) => path === "/dsh-purge/rules"),
      "no write other than the one-time rule seed: " + JSON.stringify(writes),
    );
    console.log(
      "PASS: isolated overlay, first-run welcome notice, upstream version warning, unavailable service warning, restored composer rewind slot",
    );
  }
  console.log(
    "PASS: native registry, persistent tab, loaded values, draft preservation across tabs and refresh, no implicit writes, no legacy launchers",
  );
  // 演练台：旧版靠外层 dock 把 .rt-* 的 CSS 注入 <head>，重构时丢了 → 面板在右侧栏里
  // 完全没样式。这条守住"CSS 必须随组件一起发出"和"容器要能撑开"。
  const bundleText = fs.readFileSync(process.env.PANEL_CLIENT, "utf8");
  assert(
    bundleText.includes("data-dsh-purge-drill"),
    "drill stylesheet must be attached by the panel",
  );
  assert(
    bundleText.includes(".rt-dock.rt-embedded"),
    "the drill CSS itself must ship in the bundle",
  );
  assert(
    /\.dshpp-native-drill\s*\{[^}]*min-height:\s*72vh/.test(bundleText),
    "the drill container must reserve height inside the narrow sidebar",
  );
  console.log(
    "PASS: drill stylesheet is attached and the container reserves space in the sidebar",
  );
};
test().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
