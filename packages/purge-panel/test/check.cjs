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
assert.equal(
  headStyles.length,
  1,
  "Legacy visibility must install before any overlay is rendered",
);
assert(
  headStyles[0].textContent.includes(".dshp-dock{display:none!important}"),
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
const railSeat = seats.find((x) => x.spec.name === "sidebar.panellist");
assert(railSeat, "left rail entry is registered");
assert.equal(railSeat.spec.id, "dsh-purge");
const pageSeat = seats.find((x) => x.spec.name === "main");
assert(pageSeat, "full page is registered on the main slot");
assert.equal(pageSeat.spec.key, "dsh-purge");
const body = pageSeat.body;
const test = async () => {
  let tree;
  await act(async () => {
    tree = create(React.createElement(body, { t: ctx.locale.bind() }));
    await new Promise((r) => setTimeout(r, 10));
  });
  const root = tree.root;
  const btn = (text) =>
    root.findAllByType("button").find((x) => x.children.join("") === text);
  const area = (label) =>
    root.findAllByType("textarea").find((x) => x.props["aria-label"] === label);
  assert.equal(area("提示词内容").props.value, "Existing test prompt");
  await act(async () => btn("提示词").props.onClick());
  await act(async () =>
    area("提示词内容").props.onChange({ target: { value: "UNSAVED prompt" } }),
  );
  await act(async () => btn("更多").props.onClick());
  await act(async () =>
    area("服务器名单").props.onChange({
      target: { value: "unsaved.example.test" },
    }),
  );
  await act(async () => btn("状态").props.onClick());
  await act(async () => {
    btn("刷新").props.onClick();
    await new Promise((r) => setTimeout(r, 10));
  });
  assert.equal(area("提示词内容").props.value, "UNSAVED prompt");
  assert.equal(area("服务器名单").props.value, "unsaved.example.test");
  responses["/dsh-purge/status"].plugin_version = "2.0.0";
  await act(async () => {
    btn("刷新").props.onClick();
    await new Promise((r) => setTimeout(r, 10));
  });
  assert(
    root
      .findAll((x) => x.props.role === "status")
      .some((x) => x.children.join("").includes("官方版本 2.0.0")),
    "Compatibility banner must follow refreshed status",
  );
  assert.equal(
    writes.length,
    0,
    "Opening, changing tabs and refreshing must not write configuration",
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
      1,
      "Unmounting an overlay must not expose the legacy dock",
    );
    lifecycle.find((x) => x.name === "panel legacy visibility").dispose();
    assert.equal(
      headStyles.length,
      0,
      "Disabling the plugin must remove only its owned visibility style",
    );
    responses["/dsh-purge/status"].plugin_version = "2.0.0";
    await act(async () => {
      tree = create(React.createElement(body, { t: ctx.locale.bind() }));
      await new Promise((r) => setTimeout(r, 10));
    });
    assert(
      tree.root
        .findAll((x) => x.props.role === "status")
        .some((x) => x.children.join("").includes("官方版本 2.0.0")),
    );
    await act(async () => tree.unmount());
    responses["/dsh-purge/status"] = { ok: false, error: "unavailable" };
    await act(async () => {
      tree = create(React.createElement(body, { t: ctx.locale.bind() }));
      await new Promise((r) => setTimeout(r, 10));
    });
    assert(
      tree.root
        .findAll((x) => x.props.role === "status")
        .some((x) => x.children.join("").includes("状态读取失败：unavailable")),
    );
    await act(async () => tree.unmount());
    assert.equal(writes.length, 0);
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
