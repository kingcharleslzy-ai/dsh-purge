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
let plugin,
  dict = {},
  fetchHook = null;
const disposers = [],
  timers = new Map();
const reply = (d, status = 200) => ({
  ok: status < 400,
  status,
  statusText: "Error",
  text: async () => JSON.stringify(d),
  json: async () => d,
});
const flush = () => new Promise((r) => setTimeout(r, 0));
const later = (fn, ms) => {
  if (ms >= 20000 || ms === 400) {
    const id = {};
    timers.set(id, fn);
    return id;
  }
  return setTimeout(fn, ms);
};
const cancel = (id) => {
  if (!timers.delete(id)) clearTimeout(id);
};
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
  localStorage: storage,
  console,
  AbortController,
  URL,
  setTimeout: later,
  clearTimeout: cancel,
  setInterval,
  clearInterval,
  fetch: async (url, init = {}) => {
    const path = new URL(url, "http://test").pathname;
    calls.push(path);
    if (init.method === "POST") writes.push(path);
    if (fetchHook) {
      const result = fetchHook(path, init);
      if (result) return await result;
    }
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
  effect: (fn) => {
    const dispose = fn();
    if (typeof dispose === "function") disposers.push(dispose);
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
assert.equal(
  calls.length,
  0,
  "Module evaluation must not start network requests",
);
plugin.apply(ctx);
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

(async () => {
  let tree, resolveGet;
  fetchHook = (path, init) =>
    path === "/dsh-purge/override" && !init.method
      ? new Promise((r) => {
          resolveGet = r;
        })
      : null;
  await act(async () => {
    tree = create(React.createElement(body));
    await flush();
  });
  const area = (label) =>
    tree.root
      .findAllByType("textarea")
      .find((x) => x.props["aria-label"] === label);
  const btn = (text) =>
    tree.root.findAllByType("button").find((x) => x.children.join("") === text);
  assert.equal(
    area("提示词内容").props.disabled,
    true,
    "Initial loading must not overwrite editable input",
  );
  await act(async () => {
    resolveGet(reply(responses["/dsh-purge/override"]));
    await flush();
  });
  assert.equal(area("提示词内容").props.disabled, false);
  fetchHook = null;
  await act(async () => {
    btn("提示词").props.onClick();
    area("提示词内容").props.onChange({ target: { value: "first draft" } });
  });
  let resolvePost;
  fetchHook = (path, init) =>
    path === "/dsh-purge/override" && init.method === "POST"
      ? new Promise((r) => {
          resolvePost = r;
        })
      : null;
  const before = writes.length;
  await act(async () => {
    btn("保存").props.onClick();
    btn("保存").props.onClick();
    await flush();
  });
  assert.equal(writes.length, before + 1, "Duplicate save must be coalesced");
  assert.equal(btn("保存").props.disabled, true);
  await act(async () =>
    area("提示词内容").props.onChange({ target: { value: "newer draft" } }),
  );
  await act(async () => {
    resolvePost(reply({ ok: true, content: "first draft" }));
    await flush();
  });
  assert.equal(
    area("提示词内容").props.value,
    "newer draft",
    "Slow save response must preserve newer edits",
  );
  assert(JSON.stringify(tree.toJSON()).includes("当前修改尚未保存"));
  fetchHook = (path, init) =>
    init.method === "POST"
      ? reply({ ok: true, content: "bad response" }, 500)
      : null;
  await act(async () => {
    btn("保存").props.onClick();
    await flush();
  });
  assert.equal(
    area("提示词内容").props.value,
    "newer draft",
    "HTTP error must not apply response data",
  );
  assert(JSON.stringify(tree.toJSON()).includes("500 Error"));
  await act(async () => {
    btn("更多").props.onClick();
    area("服务器名单").props.onChange({
      target: { value: "first.example.test" },
    });
  });
  fetchHook = (path, init) =>
    path === "/dsh-purge/own-servers" && init.method === "POST"
      ? new Promise((r) => {
          resolvePost = r;
        })
      : null;
  const beforeOwn = writes.length;
  await act(async () => {
    btn("保存名单").props.onClick();
    btn("保存名单").props.onClick();
    await flush();
  });
  assert.equal(writes.length, beforeOwn + 1);
  assert.equal(btn("保存名单").props.disabled, true);
  await act(async () =>
    area("服务器名单").props.onChange({
      target: { value: "newer.example.test" },
    }),
  );
  await act(async () => {
    resolvePost(reply({ ok: true, content: "first.example.test" }));
    await flush();
  });
  assert.equal(area("服务器名单").props.value, "newer.example.test");
  assert.equal(btn("保存名单").props.disabled, false);
  // A controlled timer fires the actual AbortController timeout; no real waiting.
  fetchHook = (path, init) =>
    init.method === "POST"
      ? new Promise((resolve, reject) => {
          assert(init.signal, "Save must use bounded API request");
          init.signal.addEventListener(
            "abort",
            () => {
              const e = new Error("aborted");
              e.name = "AbortError";
              reject(e);
            },
            { once: true },
          );
        })
      : null;
  await act(async () => {
    btn("保存名单").props.onClick();
    await flush();
  });
  await act(async () => {
    for (const fn of [...timers.values()]) fn();
    await flush();
  });
  assert.equal(
    btn("保存名单").props.disabled,
    false,
    "Timeout must unlock save",
  );
  assert.equal(area("服务器名单").props.value, "newer.example.test");
  assert(JSON.stringify(tree.toJSON()).includes("timeout"));
  await act(async () => tree.unmount());
  disposers.reverse().forEach((d) => d());
  assert.equal(timers.size, 0, "Request timers must be cleaned up");
  // A failed read schedules one retry; disabling the plugin must cancel it.
  disposers.length = 0;
  win.setTimeout = later;
  win.clearTimeout = cancel;
  fetchHook = (path) =>
    path === "/dsh-purge/drill-grant"
      ? Promise.reject(new Error("offline"))
      : null;
  plugin.apply(ctx);
  await flush();
  assert.equal(
    timers.size,
    1,
    "Read-only grant sync should schedule a bounded retry",
  );
  disposers.reverse().forEach((d) => d());
  assert.equal(
    timers.size,
    0,
    "Disabling the plugin must cancel pending grant retries",
  );
  console.log(
    "PASS: slow initial load, concurrent saves, edits during save, HTTP failures, timeout recovery, lifecycle",
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
