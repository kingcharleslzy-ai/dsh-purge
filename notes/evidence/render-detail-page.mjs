import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
import React from "react";
import TestRenderer from "react-test-renderer";
const { create, act } = TestRenderer;
const W = "E:/FXS/Data/DSH-Dev/pr/dsh-purge-community/worktrees/refactor-plugin-detail-page";
const OUT = path.join(W, "notes/evidence/tmp");

const status = {
  ok: true,
  ai_base: "E:/fixture/app",
  surface: "desktop",
  plugin_version: "1.6.102",
  patches_total: 82,
  patches_total_all: 88,
  patches_applied: 71,
  patches_na: 6,
  compatibility: { host_version: "0.2.2-rc.2", level: "qualified" },
  channel: "stable",
  has_backup: true,
  override_status: "custom",
  override_path: "E:/fixture/home/prompt-inject.md",
  dsh_home: "E:/fixture/home",
  hooks_deny_bypass: true,
  skills: [{ name: "a" }, { name: "b" }],
  host_layout: { family: "desktop" },
};
const responses = {
  "/dsh-purge/status": status,
  "/dsh-purge/community": { ok: true, compatibility: status.compatibility, version: "1.6.100" },
  "/dsh-purge/override": { ok: true, content: "Purge 注入正文（帧预算与门禁相关段落省略）\n\n这一行用来确认提示词编辑器有内容。" },
  "/dsh-purge/own-servers": { ok: true, content: "example.test\nstaging.example.test" },
  "/dsh-purge/selfcheck": { ok: true, layers: [], state: "ok" },
};

const storage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
const doc = { head: { append() {} }, createElement() { return { setAttribute() {}, remove() {}, textContent: "" }; } };
let plugin;
const seats = [];
let dicts = {};
const win = {
  location: { origin: "http://test", href: "http://test" },
  localStorage: storage, sessionStorage: storage,
  setTimeout, clearTimeout, addEventListener() {}, removeEventListener() {},
  __ModuleLoader__: { load: ({ factory }) => { plugin = factory((n) => (n === "react" ? React : require(n))); } },
};
const sandbox = {
  window: win, document: doc, localStorage: storage, console, AbortController, URL,
  setTimeout, clearTimeout, setInterval, clearInterval,
  fetch: async (url) => {
    const p = new URL(url, "http://test").pathname;
    return { ok: true, status: 200, json: async () => responses[p] || { ok: true }, text: async () => JSON.stringify(responses[p] || { ok: true }) };
  },
};
vm.runInNewContext(fs.readFileSync(path.join(W, "client.js"), "utf8"), sandbox);
const dict = {};
const ctx = {
  locale: {
    register: (_, v) => { dicts = v; Object.assign(dict, v.zh); return () => {}; },
    bind: () => (k, args = {}) => String(dict[k] || k).replace(/\{(\w+)\}/g, (_, n) => (args[n] === undefined ? "" : args[n])),
  },
  effect: (fn) => fn(),
  slots: { inject: (_, fn) => fn(), register: (spec, body) => { seats.push({ spec, body }); return () => {}; } },
  inject: () => {},
};
plugin.apply(ctx);

function esc(v) { return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function styleText(style) {
  if (!style || typeof style !== "object") return "";
  return Object.entries(style).map(([k, v]) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) + ":" + v).join(";");
}
const VOID = new Set(["img", "br", "hr", "input", "meta", "link"]);
function serialize(node) {
  if (node === null || node === undefined || node === false) return "";
  if (typeof node === "string") return esc(node);
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(serialize).join("");
  if (typeof node !== "object") return "";
  const type = typeof node.type === "function" ? null : node.type;
  if (!type) return (node.children || []).map(serialize).join("");
  const props = node.props || {};
  const attrs = [];
  for (const [k, v] of Object.entries(props)) {
    if (k === "children" || v === undefined || v === null || v === false) continue;
    if (k === "style") { const s = styleText(v); if (s) attrs.push("style=\"" + s + "\""); continue; }
    if (k === "className") { attrs.push("class=\"" + esc(v) + "\""); continue; }
    if (/^(key|ref|on[A-Z])/.test(k)) continue;
    if (v === true) { attrs.push(k); continue; }
    attrs.push(k + "=\"" + esc(v) + "\"");
  }
  const open = "<" + type + (attrs.length ? " " + attrs.join(" ") : "") + ">";
  if (VOID.has(type)) return open.replace(/>$/, ">");
  // Inside <style>/<script> the text is not HTML: escaping ">" would break every
  // child selector, so this is the one place the tree is emitted verbatim.
  const inner = (type === "style" || type === "script")
    ? (node.children || []).map((c) => (typeof c === "string" ? c : "")).join("")
    : (node.children || []).map(serialize).join("");
  return open + inner + "</" + type + ">";
}

const themeRaw = fs.readFileSync("E:/FXS/APP/DSH NEXT/resources/app/node_modules/@deepseek-ai/dsh-client-ui-theme/lib/client.js", "utf8");
const themeCss = [...themeRaw.matchAll(/"((?:[^"\\]|\\.)*--dsw-alias-(?:[^"\\]|\\.)*)"/g)]
  .map((m) => m[1].replace(/\\n/g, "\n").replace(/\\"/g, "\""))
  .join("\n");
console.log("theme css bytes", themeCss.length);

const parts = ["base.css", "native.css", "detail-card.css"].map((f) => fs.readFileSync(path.join(W, "packages/purge-panel/src/styles", f), "utf8"));
const panelCss = parts.join("\n");

const seat = seats.find((s) => s.spec.name === "plugins.bundle.config");
let tree;
await act(async () => { tree = create(React.createElement(seat.body, { t: ctx.locale.bind() })); });
await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
const html = serialize(tree.toJSON());
const rowSeat = seats.find((s) => s.spec.name === "plugins.row.config");
let rowTree;
await act(async () => { rowTree = create(React.createElement(rowSeat.body, { t: ctx.locale.bind(), view: "page" })); });
await act(async () => { await new Promise((r) => setTimeout(r, 30)); });
const configHtml = serialize(rowTree.toJSON());
console.log("html bytes", html.length);

const page = (theme, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${themeCss}</style><style>html,body{margin:0;padding:0;background:var(--dsw-alias-bg-base);}
.shot{width:720px;box-sizing:border-box;padding:24px;margin:0 auto;color:var(--dsw-alias-label-primary);font-family:"Segoe UI",system-ui,sans-serif;font-size:14px;line-height:1.5;}
.bar{display:flex;align-items:center;gap:8px;margin:0 0 16px;font-size:12px;color:var(--dsw-alias-label-tertiary);}</style></head>
<body data-theme="${theme}" style="background:var(--dsw-alias-bg-base)"><div class="shot"><div class="bar"><b style="font-size:14px;color:var(--dsw-alias-label-primary)">插件详情页</b> · 真实组件树 · ${theme}</div>${body}</div></body></html>`;
fs.writeFileSync(path.join(OUT, "page-light.html"), page("light", html));
fs.writeFileSync(path.join(OUT, "page-dark.html"), page("dark", html));
fs.writeFileSync(path.join(OUT, "config-light.html"), page("light", configHtml).replace("插件详情页", "行页配置"));
fs.writeFileSync(path.join(OUT, "config-dark.html"), page("dark", configHtml).replace("插件详情页", "行页配置"));
console.log("wrote page/config html");