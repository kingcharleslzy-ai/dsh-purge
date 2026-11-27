const { test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { create, act } = require("react-test-renderer");
const { buildSync } = require("esbuild");
const code = buildSync({
  stdin: {
    contents:
      'export * from "./src/api/client.js"; export {setTranslate,zh} from "./src/shared/locale.js"; export { StatusStrip, VersionNotice } from "./src/components/page.js"; export { PurgifySection } from "./src/components/settings-form.js"; export {tallyPatches,patchGroupCounts,patchRowsAll,PatchGroups,PatchHealth} from "./src/components/patch-status.js";',
    resolveDir: path.join(__dirname, ".."),
  },
  bundle: true,
  write: false,
  format: "cjs",
  platform: "browser",
  loader: { ".css": "text" },
  external: ["react", "react-dom"],
  define: { __PANEL_VERSION__: '"test"', __COMMUNITY__: "true" },
}).outputFiles[0].text;
function harness(fetch) {
  const context = {
    module: { exports: {} },
    require,
    console,
    URL,
    AbortController,
    setTimeout,
    clearTimeout,
    window: { location: { origin: "http://test" } },
    fetch,
  };
  context.exports = context.module.exports;
  vm.runInNewContext(code, context);
  const api = context.module.exports;
  api.setTranslate((key, values = {}) =>
    (api.zh[key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? ""),
  );
  return api;
}
const reply = (body) => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify(body),
});
test("mixed diagnostic states retain exact finite counts without counting drift as applied", () => {
  const h = harness();
  const rows = [
    ...Array.from({ length: 65 }, () => ({ st: "applied" })),
    ...Array.from({ length: 8 }, () => ({ st: "drifted" })),
    ...Array.from({ length: 2 }, () => ({ st: "disabled" })),
    ...Array.from({ length: 3 }, () => ({ st: "skipped" })),
  ];
  const tally = h.tallyPatches(rows);
  assert.equal(tally.applied, 65);
  assert.equal(tally.total, 78);
  assert.equal(tally.drifted, 8);
  assert.equal(tally.disabled, 2);
  assert.equal(tally.skipped, 3);
  for (const value of Object.values(h.tallyPatches([]))) assert.equal(value, 0);
  for (const value of Object.values(tally)) assert(Number.isFinite(value));
});
test("status counts come from per-patch rows, never from display groups", async () => {
  const h = harness();
  // 真实载荷：patch_rows 是 88 条逐补丁真值；patches 只有 3 个显示分组。
  const rows = [
    ...Array.from({ length: 73 }, (_, i) => ({
      id: i + 1,
      layer: "代码",
      name: "a",
      status: "applied",
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      id: 80 + i,
      layer: "代码",
      name: "b",
      status: "disabled",
    })),
    ...Array.from({ length: 13 }, (_, i) => ({
      id: 90 + i,
      layer: "工具",
      name: "c",
      status: "skipped",
    })),
  ];
  const state = {
    ok: true,
    ai_base: "/fixture",
    patch_status: {},
    patch_rows: rows,
    patches: [
      { id: 1, ids: [1, 2, 3], layer: "代码", status: "applied" },
      { id: 80, ids: [80, 81], layer: "代码", status: "disabled" },
      { id: 90, ids: [90, 91, 92], layer: "工具", status: "skipped" },
    ],
  };
  const markup = renderToStaticMarkup(
    React.createElement(h.PatchGroups, { state }),
  );
  assert.match(markup, /73 \/ 73/, "显式 disabled 不计入代码组分母");
  assert.match(markup, /0 \/ 13/, "未经确认的 skipped 仍计入工具组分母");
  assert.equal(h.patchGroupCounts(h.patchRowsAll(state)).denom, 86);
  assert.doesNotMatch(markup, /3 \/ 3/, "不能按分组数当分母");
});

test("summary and group headings explain drift, partial results and opt-in choices", async () => {
  const patches = [
    "applied",
    "drifted",
    "drifted",
    "disabled",
    "partial",
    "pending",
    "unmatched",
  ].map((status, id) => ({ id, status, layer: "代码" }));
  const state = {
    ok: true,
    ai_base: "/fixture",
    patch_rows: patches,
    patch_status: {},
  };
  const h = harness(async (url) =>
    reply(
      String(url).endsWith("/status")
        ? state
        : {
            ok: true,
            versions: [],
            content: "user draft",
            defaultContent: "default",
          },
    ),
  );
  const groups = renderToStaticMarkup(
    React.createElement(h.PatchGroups, { state }),
  );
  let view;
  await act(async () => {
    view = create(React.createElement(h.PurgifySection));
  });
  const summary = JSON.stringify(view.toJSON());
  for (const text of [groups, summary]) {
    assert.match(text, /锚点漂移 2/);
    assert.match(text, /可选关闭 1/);
    assert.match(text, /部分命中 1/);
    assert.match(text, /待处理 1/);
    assert.match(text, /没对上 1/);
    assert.doesNotMatch(text, /NaN/);
  }
  await act(async () => view.unmount());
});
test("concurrent status reads share work; settled responses and post-mutation reads are fresh", async () => {
  const waiting = [],
    calls = [];
  const h = harness((url, init) => {
    calls.push({ url, init });
    return new Promise((resolve) => waiting.push(resolve));
  });
  const a = h.apiJson("/dsh-purge/status"),
    b = h.apiJson("/dsh-purge/status");
  assert.equal(a, b);
  assert.equal(calls.length, 1);
  const mutation = h.apiJson("/dsh-purge/apply", { method: "POST" });
  const fresh = h.apiJson("/dsh-purge/status");
  assert.notEqual(a, fresh);
  assert.equal(calls.length, 3);
  waiting[0](reply({ old: true }));
  await a;
  assert.equal(
    h.apiJson("/dsh-purge/status"),
    fresh,
    "old completion cannot clear newer request",
  );
  waiting[1](reply({ ok: true }));
  waiting[2](reply({ fresh: true }));
  await Promise.all([mutation, fresh]);
  const next = h.apiJson("/dsh-purge/status");
  assert.equal(calls.length, 4);
  waiting[3](reply({ next: true }));
  await next;
});
test("failed status can retry and does not fabricate zero patch counts or a missing host", async () => {
  let fail = true;
  const h = harness(async (url) => {
    if (String(url).endsWith("/status")) {
      if (fail) throw Object.assign(Error("aborted"), { name: "AbortError" });
      return reply({
        ok: true,
        ai_base: "/fixture",
        patches: [],
        patch_status: {},
        patches_applied: 2,
        patches_total: 3,
      });
    }
    return reply({
      ok: true,
      versions: [],
      content: "user draft",
      defaultContent: "default",
    });
  });
  const states = [];
  let view;
  await act(async () => {
    view = create(
      React.createElement(h.PurgifySection, {
        onStatus: (s) => states.push(s),
      }),
    );
  });
  const failure = states.at(-1);
  assert.equal(failure.ok, false);
  assert.equal(failure.error, "timeout");
  assert.equal(failure.patches_total, undefined);
  const markup =
    renderToStaticMarkup(
      React.createElement(h.StatusStrip, { info: failure }),
    ) +
    renderToStaticMarkup(
      React.createElement(h.VersionNotice, { info: failure }),
    );
  assert.match(markup, /读取失败/);
  assert.match(markup, /timeout/);
  assert.match(markup, /无法核实/);
  assert.doesNotMatch(markup, /0\/0|未定位宿主/);
  const text = JSON.stringify(view.toJSON());
  assert.match(text, /状态未知/);
  assert.doesNotMatch(text, /未定位到.*宿主/);
  fail = false;
  const refresh = view.root
    .findAllByType("button")
    .find((b) => String(b.props.className || "").includes("dshpp-scan"));
  await act(async () => {
    refresh.props.onClick();
  });
  assert.equal(states.at(-1).ai_base, "/fixture");
  assert.equal(states.at(-1).patches_applied, 2);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /timeout|状态未知/);
  await act(async () => view.unmount());
});
test("a confirmed missing host remains a visible diagnostic, not a read failure", () => {
  const h = harness();
  const markup = renderToStaticMarkup(
    React.createElement(h.StatusStrip, {
      info: {
        ok: true,
        compatibility: { level: "missing" },
        patches_applied: 0,
        patches_total: 0,
      },
    }),
  );
  assert.match(markup, /未定位宿主/);
  assert.doesNotMatch(markup, /读取失败/);
});

test("the compatibility strip distinguishes archived, kernel-only and unknown future levels", () => {
  const h = harness();
  for (const [level, label] of Object.entries({
    qualified: "已回归验证",
    mixed: "组件版本不一致",
    unverified: "未验证版本",
    sealed: "已定位归档宿主",
    "kernel-verified": "内核已验证，宿主未验证",
    "no-host": "未定位宿主",
    "future-level": "future-level",
  })) {
    const html = renderToStaticMarkup(
      React.createElement(h.StatusStrip, {
        info: {
          ok: true,
          compatibility: { level, host_version: "0.2.2-rc.1" },
        },
      }),
    );
    assert.ok(html.includes(label), level);
    assert.equal(html.includes("is-ok"), level === "qualified");
  }
});

test("#71 missing and unreadable files remain visible in patch detail", () => {
  const h = harness();
  const state = {
    ai_base: "/fixture",
    patch_status: { 71: "missing_file" },
    patch_files: {
      71: [{ path: "/fixture/local/agent.cordis.yml", status: "missing_file" }],
    },
  };
  const render = () =>
    renderToStaticMarkup(React.createElement(h.PatchGroups, { state }));
  assert.match(render(), /0 \/ 1/);
  assert.match(render(), /缺少预设文件/);
  assert.match(render(), /fixture\/local\/agent.cordis.yml/);
  state.patch_status[71] = "unknown";
  state.patch_files[71][0].status = "unreadable";
  assert.match(render(), /无法读取/);
});

test("panel uses shared counts for required, optional and unknown states", async () => {
  const { summarizePatchRows } = await import("../../../lib/patch-state.mjs");
  const ui = harness();
  for (const metadata of [
    { id: 90 },
    { id: 71 },
    { id: 3, optional: true },
    { id: 4, settleWhenAbsent: true },
    { id: 76 },
  ]) {
    for (const status of [
      "applied",
      "already",
      "partial",
      "pending",
      "missing_file",
      "unreadable",
      "unknown",
      "skipped",
      "disabled",
      "off",
      "na",
      "not_needed",
      "future_error",
      undefined,
    ]) {
      const rows = [{ ...metadata, status }];
      const self = summarizePatchRows(rows);
      const panelRows = ui.patchRowsAll({
        ai_base: "/fixture",
        patch_rows: rows,
      });
      const panel = ui.patchGroupCounts(panelRows);
      assert.equal(panel.denom, self.total, JSON.stringify(rows));
      assert.equal(panel.applied, self.applied);
    }
  }
  const legacy = ui.patchGroupCounts(
    ui.patchRowsAll({
      ai_base: "/fixture",
      patch_status: { 90: "missing_file" },
    }),
  );
  assert.equal(
    legacy.denom,
    1,
    "old responses without optional metadata are conservative",
  );
  assert.equal(legacy.applied, 0);
});
test("required missing paths and partial results stay visible in rendered panel", () => {
  const ui = harness();
  for (const status of ["partial", "missing_file", "unknown"]) {
    const html = renderToStaticMarkup(
      React.createElement(ui.PatchGroups, {
        state: {
          ai_base: "/fixture",
          patch_status: { 90: status },
          patch_rows: [{ id: 90, layer: "代码", status }],
          patch_files: {
            90: [
              {
                path: "/fixture/agent-loop/lib/index.js",
                status: "unreadable",
              },
            ],
          },
        },
      }),
    );
    assert.match(html, /0 \/ 1/);
    assert.match(html, /agent-loop\/lib\/index.js/);
    assert.match(html, /无法读取|无法核实/);
  }
});

test("filter membership matches inactive and required counts", async () => {
  const ui = harness();
  const rows = [
    { id: 1, status: "disabled" },
    { id: 2, status: "off" },
    { id: 3, status: "na" },
    { id: 4, status: "missing_file" },
    { id: 5, status: "missing_file", optional: true },
    { id: 6, status: "skipped" },
    { id: 7, status: "skipped", settleWhenAbsent: true },
    { id: 8, status: "unknown" },
  ].map((row) => ({ ...row, layer: "代码" }));
  const state = {
    ai_base: "/fixture",
    patch_rows: rows,
    patch_status: Object.fromEntries(rows.map((r) => [r.id, r.status])),
  };
  let view;
  await act(async () => {
    view = create(React.createElement(ui.PatchGroups, { state }));
  });
  try {
    for (const [tab, ids] of [
      [2, ["#1", "#2"]],
      [3, ["#3", "#5", "#7"]],
      [1, ["#4", "#6", "#8"]],
    ]) {
      await act(async () => {
        view.root
          .findAllByType("button")
          .filter((b) => b.props.className?.includes("dshpp-fbtn"))
          [tab].props.onClick();
      });
      assert.deepEqual(
        view.root
          .findAllByType("td")
          .filter((td) => td.props.className === "dshpp-id")
          .map((td) => td.children[0]),
        ids,
      );
    }
  } finally {
    await act(async () => view.unmount());
  }
});

test("same two patches: details count once, legacy summaries keep errors without counts, absent evidence stays unknown", () => {
  const api = harness();
  const rows = [
    { id: 41, status: "applied" },
    { id: 42, status: "drifted" },
  ];
  const groups = [
    { id: 41, ids: [41, 42], status: "partial", layer: "代码", members: rows },
  ];
  for (const [kind, payload] of [
    ["detail", { patch_rows: rows, patches: groups }],
    [
      "detail",
      { patch_status: { 41: "applied", 42: "drifted" }, patches: groups },
    ],
    ["summary", { patches: groups }],
    ["summary", { patch_rows: [], patch_status: {}, patches: groups }],
    ["summary", { patches: groups.map(({ members, ...g }) => g) }],
    ["unknown", {}],
    ["unknown", { patch_rows: [], patch_status: {}, patches: [] }],
  ]) {
    const state = {
      ok: true,
      ai_base: "fixture",
      patches_applied: 1,
      patches_total: 1,
      ...payload,
    };
    const render = (component, prop) =>
      renderToStaticMarkup(React.createElement(component, { [prop]: state }));
    const markup =
      render(api.PatchGroups, "state") +
      render(api.StatusStrip, "info") +
      render(api.PatchHealth, "state");
    if (kind === "detail") {
      assert.match(markup, /1 \/ 2/);
      assert.match(markup, /锚点漂移/);
    } else {
      assert.match(markup, kind === "summary" ? /仅有分组摘要/ : /无法核实/);
      assert.doesNotMatch(
        markup,
        /\d\s*\/\s*\d|宿主补丁全部就位|dshpp-fbtn|dshpp-skel/,
      );
      if (kind === "summary") assert.match(markup, /部分命中/);
      if (payload.patches?.[0]?.members) assert.match(markup, /#42：锚点漂移/);
    }
  }
});

test("status refresh ignores late results and retries without reloading editable data", async () => {
  const waits = [],
    reads = [];
  const api = harness(async (url, init) => {
    if (String(url).endsWith("/status"))
      return new Promise((resolve) => waits.push(resolve));
    reads.push(String(url));
    return reply({ ok: true, versions: [], content: "original" });
  });
  let tree;
  const states = [];
  const observe = (s) => states.push(s);
  const render = (active) =>
    React.createElement(api.PurgifySection, { active, onStatus: observe });
  await act(async () => {
    tree = create(render(true));
  });
  const before = [...reads];
  await act(async () => {
    tree.update(render(false));
  });
  // The write invalidates an in-flight GET, just as a host mutation would.
  await api.apiJson("/fixture-write", { method: "POST" });
  await act(async () => {
    tree.update(render(true));
  });
  assert.equal(waits.length, 2);
  await act(async () =>
    waits[1](
      reply({
        ok: true,
        ai_base: "fixture",
        patch_status: { 1: "applied", 2: "applied" },
      }),
    ),
  );
  await act(async () =>
    waits[0](
      reply({
        ok: true,
        ai_base: "fixture",
        patch_status: { 1: "applied", 2: "pending" },
      }),
    ),
  );
  assert.deepEqual(
    { ...states.at(-1).patch_status },
    { 1: "applied", 2: "applied" },
  );
  const refresh = () =>
    tree.root
      .findAllByType("button")
      .find((b) => b.props.className?.includes("dshpp-scan"))
      .props.onClick();
  await act(async () => refresh());
  await act(async () => waits[2](reply({ ok: false, error: "unavailable" })));
  assert.equal(states.at(-1).ok, false);
  await act(async () => refresh());
  await act(async () =>
    waits[3](
      reply({
        ok: true,
        ai_base: "fixture",
        patch_status: { 1: "pending", 2: "applied" },
      }),
    ),
  );
  assert.equal(states.at(-1).ok, true);
  assert.deepEqual(
    reads.filter((s) => !s.endsWith("/fixture-write")),
    before,
  );
  await act(async () => tree.unmount());
});
