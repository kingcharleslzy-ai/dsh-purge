// Regression card for the plugin-detail surfaces added in 1.6.99:
// the bundle badge, the row config page, the page-bottom section and the
// summary strip. The host broadcasts the detail slots to every plugin page, so
// the filtering and the null returns are the contract under test here.
const path = require("path");
process.env.PANEL_CLIENT =
  process.env.PANEL_CLIENT ||
  path.join(__dirname, "..", "..", "..", "client.js");
const fs = require("fs"),
  vm = require("vm"),
  assert = require("assert");
const React = require("react"),
  { create, act } = require("react-test-renderer");
const calls = [],
  seats = [];
const headStyles = [];
const doc = {
  head: {
    append(node) {
      headStyles.push(node);
    },
  },
  createElement() {
    return {
      setAttribute() {},
      textContent: "",
      remove() {},
    };
  },
};
let plugin,
  dicts = {},
  dict = {};
const status = {
  ok: true,
  ai_base: "/fixture",
  surface: "desktop",
  plugin_version: "1.6.99",
  patches_total: 2,
  patches_total_all: 2,
  patches_applied: 1,
  patches: [
    { id: 1, status: "applied" },
    { id: 2, status: "drift" },
  ],
  compatibility: { host_version: "0.2.2-rc.2", level: "qualified" },
  channel: "stable",
  has_backup: true,
  override_status: "custom",
  override_path: "/fixture/prompt-inject.md",
  dsh_home: "/fixture/home",
  hooks_deny_bypass: true,
  skills: [{ name: "a" }, { name: "b" }],
  host_layout: { family: "desktop" },
};
const responses = {
  "/dsh-purge/status": status,
  "/dsh-purge/community": { ok: true, compatibility: status.compatibility },
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
  fetch: async (url) => {
    const p = new URL(url, "http://test").pathname;
    calls.push(p);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify(responses[p] || { ok: true }),
      json: async () => responses[p] || { ok: true },
    };
  },
};
vm.runInNewContext(fs.readFileSync(process.env.PANEL_CLIENT, "utf8"), sandbox);
const ctx = {
  locale: {
    register: (_, v) => {
      dicts = v;
      dict = v.zh;
      return () => {};
    },
    bind:
      () =>
      (k, args = {}) =>
        String(dict[k] || k).replace(/\{(\w+)\}/g, (_, n) =>
          args[n] === undefined ? "" : args[n],
        ),
  },
  effect: (fn) => fn(),
  slots: {
    inject: (_, fn) => fn(),
    register: (spec, body) => {
      seats.push({ spec, body });
      return () => {};
    },
  },
  inject: () => {},
};
plugin.apply(ctx);

const seat = (name) => seats.find((s) => s.spec.name === name);
const t = ctx.locale.bind("settings.dsh-purge-panel");

function texts(node) {
  const out = [];
  const walk = (n) => {
    if (n === null || n === undefined) return;
    if (typeof n === "string") {
      out.push(n);
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (n.children) n.children.forEach(walk);
  };
  walk(node);
  return out.join(" ");
}

async function render(node) {
  let tree;
  await act(async () => {
    tree = create(node);
  });
  await act(async () => {});
  return {
    body: texts(tree.toJSON()),
    unmount: () => act(() => tree.unmount()),
  };
}

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

test("one entry: the plugin detail page", async () => {
  assert.equal(
    seat("sidebar.panellist"),
    undefined,
    "the left rail entry is gone",
  );
  assert.equal(seat("main"), undefined, "the standalone page is gone");
  assert.equal(
    seat("plugins.row.config").spec.key,
    "dsh-purge-community#dsh-purge",
  );
  assert.equal(seat("plugins.detail.badge").spec.id, "dsh-purge-patches");
  assert.equal(
    seat("plugins.bundle.config"),
    undefined,
    "the plugin page has no configuration slot",
  );
  assert.equal(seat("plugins.detail.section").spec.id, "dsh-purge-status");
});

test("badge filters other pages and item subjects", async () => {
  const Badge = seat("plugins.detail.badge").body;
  const other = await render(
    React.createElement(Badge, {
      t,
      subject: { kind: "bundle", pkg: { name: "other" } },
    }),
  );
  assert.equal(other.body.trim(), "", "another bundle must render nothing");
  await other.unmount();
  const item = await render(
    React.createElement(Badge, { t, subject: { kind: "item", id: "x" } }),
  );
  assert.equal(item.body.trim(), "", "an item subject carries no package");
  await item.unmount();
  const mine = await render(
    React.createElement(Badge, {
      t,
      subject: { kind: "bundle", pkg: { name: "dsh-purge-community" } },
    }),
  );
  assert.ok(/1\/2/.test(mine.body), "applied/2 expected, got: " + mine.body);
  await mine.unmount();
});

test("row config: summary line and the page body", async () => {
  const Row = seat("plugins.row.config").body;
  const summary = await render(
    React.createElement(Row, { t, view: "summary", form: undefined }),
  );
  assert.ok(
    /1\/2/.test(summary.body),
    "summary should carry the patch tally: " + summary.body,
  );
  assert.ok(!/维护与关于/.test(summary.body), "summary must not draw the page");
  await summary.unmount();
  const page = await render(
    React.createElement(Row, { t, view: "page", form: undefined }),
  );
  assert.ok(
    /提示词/.test(page.body),
    "the row page renders the configuration: " + page.body.slice(0, 160),
  );
  await page.unmount();
});

test("summary strip renders version, host, patches, compatibility and channel", async () => {
  const Shell = seat("plugins.detail.section").body;
  const view = await render(
    React.createElement(Shell, {
      t,
      subject: { kind: "bundle", pkg: { name: "dsh-purge-community" } },
    }),
  );
  for (const needle of ["1.6.99", "0.2.2-rc.2", "1/2", "stable"])
    assert.ok(
      view.body.indexOf(needle) >= 0,
      "missing " + needle + " in: " + view.body.slice(0, 240),
    );
  await view.unmount();
});

test("the page is native cards: title, sunken body, facts, 28px action", async () => {
  const Shell = seat("plugins.detail.section").body;
  let tree;
  await act(async () => {
    tree = create(
      React.createElement(Shell, {
        t,
        subject: { kind: "bundle", pkg: { name: "dsh-purge-community" } },
      }),
    );
  });
  await act(async () => {});
  const root = tree.root;
  const byClass = (name) =>
    root.findAll(
      (x) =>
        typeof x.props.className === "string" &&
        x.props.className.split(/\s+/).includes(name),
    );
  assert.equal(
    byClass("dpg-card").length,
    1,
    "the plugin page carries the status area only: " +
      byClass("dpg-card").length,
  );
  assert.equal(
    byClass("dpg-card-title").length,
    1,
    "the status card carries its title",
  );
  assert.equal(
    byClass("dpg-facts").length,
    1,
    "one facts list on the status card",
  );
  assert.equal(
    byClass("dpg-small").length,
    1,
    "one 28px action on the status card",
  );
  assert.equal(
    byClass("dpg-tabs").length,
    0,
    "the plugin page carries no business area",
  );
  // The row page is the other two areas: status + business, then the configuration.
  const rowBody = seat("plugins.row.config").body;
  let row;
  await act(async () => {
    row = create(React.createElement(rowBody, { t, view: "page" }));
  });
  await act(async () => {});
  const rowByClass = (name) =>
    row.root.findAll(
      (x) =>
        typeof x.props.className === "string" &&
        x.props.className.split(/\s+/).includes(name),
    );
  // dsh-ops 的分工：状态卡在 bundle 页（上面已断言 1 张），row 页只有业务 + 配置。
  assert.equal(
    rowByClass("dpg-card").length,
    2,
    "business and configuration areas",
  );
  assert.equal(
    rowByClass("dpg-status-body").length,
    0,
    "the row page carries no status card",
  );
  assert.equal(
    rowByClass("dpg-tabs").length,
    1,
    "the business area is one component",
  );
  assert.equal(
    rowByClass("dpg-tab").length,
    4,
    "the business area offers four views",
  );
  assert.equal(
    rowByClass("dpg-config").length,
    1,
    "the configuration area is on the row page",
  );
  await act(() => row.unmount());
  const css = fs.readFileSync(process.env.PANEL_CLIENT, "utf8");
  for (const rule of [
    "border:.5px solid var(--dsw-alias-border-l2)",
    "border-radius:var(--dsw-radius-lg)",
    "padding:14px",
    "background:var(--dsw-alias-interactive-bg-hover)",
    "grid-template-columns:max-content minmax(0,1fr)",
    "column-gap:14px",
    "height:28px",
    "width:12px; height:12px",
  ])
    assert.ok(css.indexOf(rule) >= 0, "missing css contract: " + rule);
  // The card stylesheet is ours; the legacy panel stylesheets still carry hex
  // fallbacks of their own, so the colour contract is asserted on this block.
  // The build strips comments, so the block is delimited by rules, not by the
  // header comment: from the page root to the segmented control.
  const from = css.indexOf(".dpg-detail {");
  const to = css.indexOf(".dpg-tabs {");
  const block = css.slice(from, to);
  assert.ok(
    from >= 0 && to > from && block.length > 800,
    "the card stylesheet ships",
  );
  assert.ok(
    !/var\(--dsw-alias-[a-z0-9-]+,\s*#/.test(block),
    "no hex fallback may sit behind a token",
  );
  assert.ok(
    !/#[0-9a-fA-F]{3,8}\b/.test(block),
    "the card stylesheet names no literal colour",
  );
  await act(() => tree.unmount());
});

test("the business area switches views", async () => {
  const Row = seat("plugins.row.config").body;
  let tree;
  await act(async () => {
    tree = create(React.createElement(Row, { t, view: "page" }));
  });
  await act(async () => {});
  const skills = tree.root.findByProps({ "data-view": "skills" });
  await act(async () => skills.props.onClick());
  assert.equal(
    tree.root.findByProps({ "data-view": "skills" }).props["aria-selected"],
    "true",
  );
  assert.equal(
    tree.root.findByProps({ "data-view": "rules" }).props["aria-selected"],
    "false",
  );
  const panel = tree.root.findByProps({ role: "tabpanel" });
  assert.equal(
    panel.children.length,
    2,
    "the opened view mounts, the rest stay unmounted",
  );
  await act(() => tree.unmount());
});

test("english dictionary carries no CJK", async () => {
  const bad = Object.entries(dicts.en || {}).filter(([, value]) =>
    /[\u4e00-\u9fff]/.test(String(value)),
  );
  assert.deepEqual(
    bad.map(([k]) => k),
    [],
    "CJK left in the english dictionary",
  );
  assert.deepEqual(
    Object.keys(dicts.en).sort(),
    Object.keys(dicts.zh).sort(),
    "dictionaries must agree on the key set",
  );
});

test("styles install once at apply, not inside a page", async () => {
  // Apply installs two sheets: the legacy visibility gate first, then the plugin's
  // own. The detail page used to render its own <style>, so two pages open at once
  // meant two copies.
  assert.equal(headStyles.length, 2, "legacy gate + one plugin stylesheet");
  assert.match(headStyles[1].textContent, /\.dpg-card/);
  const Section = seat("plugins.detail.section").body;
  let tree;
  await act(async () => {
    tree = create(
      React.createElement(Section, {
        t,
        subject: {
          kind: "bundle",
          pkg: { name: "dsh-purge-community", enabled: true },
        },
      }),
    );
  });
  await act(async () => {});
  assert.equal(
    tree.root.findAll((x) => x.type === "style").length,
    0,
    "no <style> inside the page",
  );
  assert.equal(headStyles.length, 2, "rendering a page adds no stylesheet");
  await act(() => tree.unmount());
});

(async () => {
  let failed = 0;
  for (const c of cases) {
    try {
      await c.fn();
      console.log("ok   " + c.name);
    } catch (e) {
      failed += 1;
      console.error("FAIL " + c.name + ": " + e.message);
    }
  }
  if (failed) {
    console.error(
      failed + " of " + cases.length + " detail-surface checks failed",
    );
    process.exit(1);
  }
  console.log(cases.length + " detail-surface checks passed");
})();
