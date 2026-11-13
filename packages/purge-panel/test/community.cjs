process.env.PANEL_CLIENT = require("path").join(
  __dirname,
  "../../..",
  "client.js",
);
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
    compatibility: {
      host_version: "0.2.1-rc.1",
      level: "qualified",
      message: "qualified fixture",
    },
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
  "/dsh-purge/boost": { ok: true, enabled: true },
  "/dsh-purge/selfcheck": {
    ok: true,
    host: "/fixture",
    host_version: "0.2.1-rc.1",
    qualified: true,
    level: "qualified",
    patch: { applied: 74, total: 82 },
    layers: [
      {
        title: "沙箱 confine 直通",
        kind: "host",
        ids: [15],
        ok: true,
        applied: 1,
        required: 1,
        total: 1,
      },
      {
        title: "文件系统围栏禁用",
        kind: "host",
        ids: [16],
        ok: false,
        applied: 0,
        required: 1,
        total: 1,
      },
    ],
    summary: {
      host: { ok: false, passed: 1, total: 2 },
      runtime: { ok: true, passed: 1, total: 1 },
      config: { ok: true, passed: 1, total: 1 },
      layout: { ok: true, passed: 1, total: 1 },
    },
    hints: [],
  },
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
    if (init.method === "POST")
      writes.push({ path, body: JSON.parse(init.body) });
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
    bind:
      () =>
      (k, args = {}) =>
        String(dict[k] || k).replace(/\{(\w+)\}/g, (_, n) => args[n] ?? ""),
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
// The gate must still be the first stylesheet apply installs, before any overlay
// renders. The detail page's own sheet is installed right after it, once for the
// whole plugin (it used to be rendered inside each page component).
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
  "detail page stylesheet is installed once at apply",
);
if (process.env.PANEL_CLIENT) {
  assert.equal(plugin.name, "dsh-purge-community");
  const rewindSeat = seats.find(
    (x) => x.spec.name === "conversation.input.right",
  );
  assert(rewindSeat, "community build restores the composer rewind slot");
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
assert.equal(
  seats.find((x) => x.spec.name === "plugins.bundle.config"),
  undefined,
  "the plugin page has no configuration slot",
);

responses["/dsh-purge/community"] = {
  version: "1.2.0",
  compatibility: {
    host_version: "0.2.1-rc.1",
    message: "Runtime tested; binary patches disabled",
  },
  backups: [
    {
      id: "backup-fixture",
      created_at: "2026-10-17T00:00:00Z",
      reason: "manual",
      plugins: [{ version: "1.1.71" }],
    },
  ],
};
win.confirm = () => true;
(async () => {
  // The plugin page: a status area and one business component, nothing else.
  let page;
  await act(async () => {
    page = create(
      React.createElement(
        seats.find((s) => s.spec.name === "plugins.detail.section").body,
        {
          t: ctx.locale.bind(),
          subject: { kind: "bundle", pkg: { name: "dsh-purge-community" } },
        },
      ),
    );
    await new Promise((r) => setTimeout(r, 15));
  });
  const byClass = (node, name) =>
    node.findAll(
      (x) =>
        typeof x.props.className === "string" &&
        x.props.className.split(/\s+/).includes(name),
    );
  assert.equal(
    byClass(page.root, "dpg-card").length,
    1,
    "the plugin page carries the status area only",
  );
  assert.equal(
    byClass(page.root, "dpg-facts").length,
    1,
    "the status area renders its facts",
  );
  assert.equal(
    byClass(page.root, "dpg-tab").length,
    0,
    "the plugin page carries no business area",
  );
  assert(
    JSON.stringify(page.toJSON()).includes("0.2.1-rc.1"),
    "the status area reports the host version from the backend",
  );
  const button = (text) =>
    page.root.findAllByType("button").find((x) => x.children.join("") === text);
  assert(button("刷新"), "the status area carries its action");
  await act(async () => page.unmount());
  // Everything else — business and configuration — is on the row page.
  await act(async () => {
    page = create(
      React.createElement(
        seats.find((s) => s.spec.name === "plugins.row.config").body,
        { t: ctx.locale.bind(), view: "page" },
      ),
    );
    await new Promise((r) => setTimeout(r, 15));
  });
  assert.equal(
    byClass(page.root, "dpg-tab").length,
    4,
    "the business component switches views",
  );
  await act(async () => {
    page.root.findByProps({ "data-view": "maintenance" }).props.onClick();
    await new Promise((r) => setTimeout(r, 15));
  });
  assert(page.root.findAllByProps({ "aria-label": "社区版维护" }).length);
  const snapshot = JSON.stringify(page.toJSON());
  assert(snapshot.includes("破甲自检"), "self-check block renders");
  assert(
    snapshot.includes("破甲强化段"),
    "boost toggle renders next to the self-check",
  );
  assert(
    snapshot.includes("沙箱 confine 直通") &&
      snapshot.includes("文件系统围栏禁用"),
    "self-check renders every layer reported by /dsh-purge/selfcheck",
  );
  assert(
    snapshot.includes("#16") ||
      snapshot.includes("1 层未生效") ||
      snapshot.includes("有 1 层未生效"),
    "self-check surfaces the failing layer",
  );
  // The rules view reads its state with a POST `{op:"status"}`; that is a read,
  // not a write, so the ledger counts mutations only.
  const mutations = () =>
    writes.filter((w) => !(w.body && w.body.op === "status"));
  assert.deepEqual(mutations(), [], "opening never writes configuration");
  writes.length = 0;
  await act(async () => {
    button("立即备份").props.onClick();
    await new Promise((r) => setTimeout(r, 15));
  });
  assert.deepEqual(
    mutations().map((x) => x.body.op),
    ["backup"],
  );
  await act(async () => {
    page.root
      .findByProps({ "aria-label": "选择回滚备份" })
      .props.onChange({ target: { value: "backup-fixture" } });
  });
  await act(async () => {
    button("回滚插件").props.onClick();
    await new Promise((r) => setTimeout(r, 15));
  });
  assert.equal(mutations()[1].body.id, "backup-fixture");
  assert.equal(mutations()[1].body.op, "rollback");
  assert(
    !mutations().some((x) => /apply|restart|revert/.test(x.path)),
    "maintenance never applies host patches or restarts DSH",
  );
  await act(async () => page.unmount());
  // The row page: the configuration area, with the upstream actions intact.
  let row;
  await act(async () => {
    row = create(
      React.createElement(
        seats.find((s) => s.spec.name === "plugins.row.config").body,
        { t: ctx.locale.bind(), view: "page" },
      ),
    );
    await new Promise((r) => setTimeout(r, 15));
  });
  const rowButton = (text) =>
    row.root.findAllByType("button").find((x) => x.children.join("") === text);
  assert(
    JSON.stringify(row.toJSON()).includes("Hooks 拦截"),
    "original hooks deny section renders in the community build",
  );
  for (const label of ["应用", "还原", "卸载"])
    assert.equal(
      rowButton(label).props.disabled,
      false,
      "community build keeps " + label + " usable",
    );
  await act(async () => row.unmount());
  for (const life of lifecycle.reverse())
    if (typeof life.dispose === "function") life.dispose();
  console.log(
    "PASS: Community bundled UI, single native entry, backup and rollback contracts",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
