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
      'export * from "./src/api/client.js"; export {setTranslate,en} from "./src/shared/locale.js"; export { StatusStrip, VersionNotice } from "./src/components/page.js"; export { PurgifySection } from "./src/components/settings-form.js"; export {tallyPatches,PatchGroups} from "./src/components/patch-status.js";',
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
    (api.en[key] || key).replace(/\{(\w+)\}/g, (_, name) => values[name] ?? ""),
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
  // Real payload: patch_rows contains 88 per-patch truth rows; patches has only 3 display groups.
  const rows = [
    ...Array.from({ length: 73 }, (_, i) => ({
      id: i + 1,
      layer: "Code",
      name: "a",
      status: "applied",
    })),
    ...Array.from({ length: 2 }, (_, i) => ({
      id: 80 + i,
      layer: "Code",
      name: "b",
      status: "disabled",
    })),
    ...Array.from({ length: 13 }, (_, i) => ({
      id: 90 + i,
      layer: "Tools",
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
      { id: 1, ids: [1, 2, 3], layer: "Code", status: "applied" },
      { id: 80, ids: [80, 81], layer: "Code", status: "disabled" },
      { id: 90, ids: [90, 91, 92], layer: "Tools", status: "skipped" },
    ],
  };
  const markup = renderToStaticMarkup(
    React.createElement(h.PatchGroups, { state }),
  );
  assert.match(markup, /73 \/ 75/, "group table must not compress 88 rows into 3");
  assert.doesNotMatch(markup, /3 \/ 3/, "must not use group count as denominator");
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
  ].map((status, id) => ({ id, status, layer: "Code" }));
  const state = { ok: true, ai_base: "/fixture", patches, patch_status: {} };
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
    assert.match(text, /Drifted 2/);
    assert.match(text, /Opt-in off 1/);
    assert.match(text, /Partial 1/);
    assert.match(text, /Pending 1/);
    assert.match(text, /No match 1/);
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
  assert.match(markup, /Failed to load/);
  assert.match(markup, /timeout/);
  assert.match(markup, /\?\/\?/);
  assert.doesNotMatch(markup, /0\/0|host not located/);
  const text = JSON.stringify(view.toJSON());
  assert.match(text, /Unknown/);
  assert.doesNotMatch(text, /host not located/i);
  fail = false;
  const refresh = view.root
    .findAllByType("button")
    .find((b) => String(b.props.className || "").includes("dshpp-scan"));
  await act(async () => {
    refresh.props.onClick();
  });
  assert.equal(states.at(-1).ai_base, "/fixture");
  assert.equal(states.at(-1).patches_applied, 2);
  assert.doesNotMatch(JSON.stringify(view.toJSON()), /timeout|Read failed/);
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
  assert.match(markup, /host not located/);
  assert.doesNotMatch(markup, /Failed to load/);
});

test("the compatibility strip distinguishes archived, kernel-only and unknown future levels", () => {
  const h = harness();
  for (const [level, label] of Object.entries({
    qualified: "regression verified",
    mixed: "mixed component versions",
    unverified: "unverified version",
    sealed: "host archive located",
    "kernel-verified": "kernel verified, host unverified",
    "no-host": "host not located",
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
