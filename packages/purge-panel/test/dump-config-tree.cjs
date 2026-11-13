const path = require("path");
process.env.PANEL_CLIENT =
  process.env.PANEL_CLIENT ||
  path.join(__dirname, "..", "..", "..", "client.js");
const fs = require("fs"),
  vm = require("vm");
const React = require("react"),
  { create, act } = require("react-test-renderer");
const seats = [];
let plugin;
const dict = {};
const doc = {
  head: { append() {} },
  createElement() {
    return { setAttribute() {}, textContent: "", remove() {} };
  },
};
const storage = { getItem: () => null, setItem() {}, removeItem() {} };
const status = {
  ok: true,
  ai_base: "/fixture",
  surface: "desktop",
  plugin_version: "1.6.105",
  patches_total: 73,
  patches_total_all: 88,
  patches_applied: 64,
  patches_na: 6,
  patches: Array.from({ length: 73 }, (_, i) => ({
    id: i + 1,
    status: i % 7 === 0 ? "pending" : "applied",
  })),
  compatibility: { host_version: "0.2.2-rc.1", level: "kernel" },
  channel: "stable",
  has_backup: true,
  override_status: "custom",
  override_path: "/f/p.md",
  dsh_home: "/f/home",
  hooks_deny_bypass: true,
  skills: [{ name: "a" }],
  host_layout: { family: "desktop" },
};
const responses = {
  "/dsh-purge/status": status,
  "/dsh-purge/community": { ok: true, compatibility: status.compatibility },
  "/dsh-purge/hooks-deny": { ok: true, hooksDenyBypass: true },
  "/dsh-purge/override": { ok: true, content: "x" },
  "/dsh-purge/own-servers": { ok: true, content: "" },
  "/dsh-purge/selfcheck": { ok: true, layers: [] },
};
const win = {
  location: { origin: "http://t", href: "http://t" },
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
  fetch: async (u) => {
    const p = new URL(u, "http://t").pathname;
    return {
      ok: true,
      status: 200,
      json: async () => responses[p] || { ok: true },
      text: async () => JSON.stringify(responses[p] || { ok: true }),
    };
  },
};
vm.runInNewContext(fs.readFileSync(process.env.PANEL_CLIENT, "utf8"), sandbox);
const ctx = {
  locale: {
    register: (_, v) => {
      Object.assign(dict, v.zh);
      return () => {};
    },
    bind: () => (k) => String(dict[k] || k),
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
const seat = seats.find((s) => s.spec.name === "plugins.row.config");
(async () => {
  let tree;
  await act(async () => {
    tree = create(
      React.createElement(seat.body, { t: ctx.locale.bind(), view: "page" }),
    );
  });
  await act(async () => {
    await new Promise((r) => setTimeout(r, 80));
  });
  const view = process.env.VIEW || "rules";
  if (view !== "rules") {
    const tab = tree.root.findAll(
      (n) => n.props && n.props["data-view"] === view,
    )[0];
    if (tab)
      await act(async () => {
        tab.props.onClick();
      });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 60));
    });
  }
  const out = [];
  const walk = (n, d) => {
    if (n == null || typeof n !== "object") return;
    if (Array.isArray(n)) return n.forEach((c) => walk(c, d));
    if (typeof n.type !== "string")
      return (n.children || []).forEach((c) => walk(c, d));
    const p = n.props || {};
    if (p.hidden === true) return;
    const cls =
      typeof p.className === "string"
        ? "." + p.className.split(/\s+/).join(".")
        : "";
    const st = p.style ? " style=" + JSON.stringify(p.style) : "";
    const hid = p.hidden ? " [hidden]" : "";
    const txt = (n.children || [])
      .filter((c) => typeof c === "string")
      .join(" ")
      .slice(0, 30);
    out.push(
      "  ".repeat(d) + n.type + cls + hid + st + (txt ? "  «" + txt + "»" : ""),
    );
    (n.children || []).forEach((c) => walk(c, d + 1));
  };
  walk(tree.toJSON(), 0);
  const a = out.findIndex((l) => l.includes("dpg-business"));
  const limit = Number(process.env.LINES || 44);
  console.log(out.slice(Math.max(0, a - 1), a + limit).join("\n"));
})();
