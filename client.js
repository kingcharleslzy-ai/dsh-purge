// Generated from src/ by npm run build. Do not edit.
// Derived UI: YuJunZhiXue/dsh-purge (MIT), see LICENSE.
(()=>{const __PURGE_MODULE_URL__ = typeof document !== 'undefined' ? document.currentScript?.src : undefined;
window.__ModuleLoader__.load({id:"dsh-purge-community",factory:(require)=>{
var module={exports:{}};var exports=module.exports;
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name2 in all)
    __defProp(target, name2, { get: all[name2], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/entry.js
var entry_exports = {};
__export(entry_exports, {
  PanelOverlays: () => PanelOverlays,
  PurgeIcon: () => PurgeIcon,
  apply: () => apply,
  inject: () => inject,
  name: () => name
});
module.exports = __toCommonJS(entry_exports);

// src/shared/react.js
var import_react = __toESM(require("react"), 1);
var h = import_react.default.createElement;
var { useState, useEffect, useCallback, useRef, Component } = import_react.default;

// src/styles/base.css
var base_default = '.dshpp-root {\r\n  --dshpp-display:\r\n    "Songti SC", "Noto Serif SC", "Iowan Old Style", Palatino,\r\n    "Palatino Linotype", Georgia, serif;\r\n  --dshpp-sans:\r\n    "Yu Gothic UI", "Hiragino Sans GB", "Source Han Sans SC", system-ui,\r\n    sans-serif;\r\n  --dshpp-mono: "Cascadia Mono", "Sarasa Mono SC", ui-monospace, monospace;\r\n  --dshpp-ease: cubic-bezier(0.16, 1, 0.3, 1);\r\n  max-width: 920px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 18px;\r\n  padding: 16px;\r\n  border-radius: 12px;\r\n  background: var(--dshpp-bg);\r\n  color: var(--dshpp-ink);\r\n  font-family: var(--dshpp-sans);\r\n}\r\n.dshpp-root {\r\n  --dshpp-bg: transparent;\r\n  --dshpp-paper: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-bg-layer-1, #f6f4ef) 74%,\r\n    transparent\r\n  );\r\n  --dshpp-ink: var(--dsw-alias-label-primary, #1a1916);\r\n  --dshpp-mute: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-label-primary, #1a1916) 74%,\r\n    var(--dsw-alias-label-secondary, #5c564c)\r\n  );\r\n  --dshpp-line: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-border-l1, #c8c2b6) 78%,\r\n    transparent\r\n  );\r\n  --dshpp-fill: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-brand-primary, #6d8f78) 14%,\r\n    transparent\r\n  );\r\n  --dshpp-accent: var(--dsw-alias-brand-primary, #3f6b52);\r\n  --dshpp-accent-soft: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-brand-primary, #6d8f78) 18%,\r\n    transparent\r\n  );\r\n  --dshpp-ok: #1f7a45;\r\n  --dshpp-warn: #8a5a12;\r\n  --dshpp-bad: #9a3434;\r\n}\r\n.dshpp-root[data-theme="white"] {\r\n  color-scheme: light;\r\n}\r\n.dshpp-root[data-theme="dusk"] {\r\n  color-scheme: dark;\r\n  --dshpp-ok: #8fd0a8;\r\n  --dshpp-warn: #e4c48a;\r\n  --dshpp-bad: #f0b4b4;\r\n}\r\n.dshpp-toolbar {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n}\r\n.dshpp-switch {\r\n  display: inline-flex;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 999px;\r\n  overflow: hidden;\r\n  background: var(--dshpp-paper);\r\n}\r\n.dshpp-switch button {\r\n  appearance: none;\r\n  border: 0;\r\n  background: transparent;\r\n  color: var(--dshpp-mute);\r\n  font: 12px/1 var(--dshpp-sans);\r\n  padding: 6px 14px;\r\n  cursor: pointer;\r\n}\r\n.dshpp-switch button.is-on {\r\n  background: var(--dshpp-accent-soft);\r\n  color: var(--dshpp-ink);\r\n}\r\n.dshpp-switch button:focus-visible {\r\n  outline: 2px solid var(--dshpp-accent);\r\n  outline-offset: -2px;\r\n}\r\n.dshpp-panel {\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dshpp-paper);\r\n  border-radius: 10px;\r\n  padding: 18px 18px 16px;\r\n}\r\n.dshpp-kicker {\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  letter-spacing: 0.14em;\r\n  text-transform: uppercase;\r\n  color: var(--dshpp-mute);\r\n  margin: 0 0 4px;\r\n}\r\n.dshpp-title {\r\n  font-family: var(--dshpp-display);\r\n  font-size: 20px;\r\n  font-weight: 500;\r\n  letter-spacing: 0.02em;\r\n  line-height: 1.3;\r\n  margin: 0;\r\n  color: var(--dshpp-ink);\r\n}\r\n.dshpp-head {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 12px;\r\n  margin-bottom: 14px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-sub {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 8px;\r\n  margin: 20px 0 10px;\r\n}\r\n.dshpp-sub h4 {\r\n  margin: 0;\r\n  font-family: var(--dshpp-display);\r\n  font-size: 15px;\r\n  font-weight: 500;\r\n}\r\n.dshpp-metrics {\r\n  display: grid;\r\n  grid-template-columns: repeat(3, minmax(0, 1fr));\r\n  gap: 8px;\r\n  margin-bottom: 14px;\r\n}\r\n.dshpp-metric {\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dshpp-bg);\r\n  padding: 12px;\r\n  min-height: 68px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n  border-radius: 8px;\r\n}\r\n.dshpp-metric b {\r\n  font-family: var(--dshpp-display);\r\n  font-size: 18px;\r\n  font-weight: 500;\r\n  line-height: 1.2;\r\n}\r\n.dshpp-metric span {\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-bar {\r\n  height: 3px;\r\n  border-radius: 99px;\r\n  background: var(--dshpp-line);\r\n  overflow: hidden;\r\n  margin: 8px 0 14px;\r\n}\r\n.dshpp-bar > i {\r\n  display: block;\r\n  height: 100%;\r\n  background: var(--dshpp-accent);\r\n  width: 0;\r\n  transition: width 0.4s var(--dshpp-ease);\r\n}\r\n.dshpp-group {\r\n  border: 1px solid var(--dshpp-line);\r\n  margin: 0 0 8px;\r\n  background: var(--dshpp-bg);\r\n  border-radius: 8px;\r\n  overflow: hidden;\r\n}\r\n.dshpp-group-h {\r\n  width: 100%;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  padding: 9px 12px;\r\n  border: 0;\r\n  background: transparent;\r\n  color: inherit;\r\n  cursor: pointer;\r\n  font: inherit;\r\n  text-align: left;\r\n}\r\n.dshpp-group-h:hover {\r\n  background: var(--dshpp-fill);\r\n}\r\n.dshpp-group-h:focus-visible {\r\n  outline: 2px solid var(--dshpp-accent);\r\n  outline-offset: -2px;\r\n}\r\n.dshpp-group-h strong {\r\n  font-family: var(--dshpp-display);\r\n  font-size: 14px;\r\n  font-weight: 500;\r\n}\r\n.dshpp-group-h em {\r\n  font-style: normal;\r\n  font-size: 12px;\r\n  color: var(--dshpp-mute);\r\n  flex: 1;\r\n}\r\n.dshpp-count {\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 12px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-table {\r\n  width: 100%;\r\n  border-collapse: collapse;\r\n  font-size: 12.5px;\r\n}\r\n.dshpp-table th {\r\n  text-align: left;\r\n  font-weight: 500;\r\n  font-size: 11px;\r\n  letter-spacing: 0.06em;\r\n  color: var(--dshpp-mute);\r\n  padding: 7px 12px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-table td {\r\n  padding: 8px 12px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  vertical-align: middle;\r\n}\r\n.dshpp-table tr:last-child td {\r\n  border-bottom: 0;\r\n}\r\n.dshpp-table tr.is-on td {\r\n  background: var(--dshpp-accent-soft);\r\n}\r\n.dshpp-id {\r\n  font-family: var(--dshpp-mono);\r\n  opacity: 0.75;\r\n  width: 42px;\r\n}\r\n.dshpp-actions {\r\n  text-align: right;\r\n  white-space: nowrap;\r\n}\r\n.dshpp-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-row + .dshpp-row {\r\n  margin-top: 10px;\r\n}\r\n.dshpp-pill {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  padding: 2px 8px;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 99px;\r\n  line-height: 1.6;\r\n  background: var(--dshpp-bg);\r\n}\r\n.dshpp-pill::before {\r\n  content: "";\r\n  width: 6px;\r\n  height: 6px;\r\n  border-radius: 50%;\r\n  background: currentColor;\r\n}\r\n.dshpp-pill.is-ok {\r\n  color: var(--dshpp-ok);\r\n  border-color: color-mix(in srgb, var(--dshpp-ok) 30%, var(--dshpp-line));\r\n}\r\n.dshpp-pill.is-wait {\r\n  color: var(--dshpp-warn);\r\n  border-color: color-mix(in srgb, var(--dshpp-warn) 30%, var(--dshpp-line));\r\n}\r\n.dshpp-pill.is-miss {\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-pill.is-bad {\r\n  color: var(--dshpp-bad);\r\n}\r\n.dshpp-btn {\r\n  appearance: none;\r\n  font-family: var(--dshpp-sans);\r\n  font-size: 13px;\r\n  font-weight: 500;\r\n  min-height: 34px;\r\n  padding: 0 14px;\r\n  border-radius: 8px;\r\n  border: 1px solid transparent;\r\n  cursor: pointer;\r\n  transition:\r\n    background 0.15s var(--dshpp-ease),\r\n    opacity 0.15s var(--dshpp-ease);\r\n}\r\n.dshpp-btn:disabled {\r\n  opacity: 0.45;\r\n  cursor: not-allowed;\r\n}\r\n.dshpp-btn:focus-visible {\r\n  outline: 2px solid var(--dshpp-accent);\r\n  outline-offset: 2px;\r\n}\r\n.dshpp-btn-primary {\r\n  background: var(--dshpp-accent-soft);\r\n  color: var(--dshpp-ink);\r\n  border-color: color-mix(in srgb, var(--dshpp-accent) 35%, var(--dshpp-line));\r\n}\r\n.dshpp-btn-primary:hover:not(:disabled) {\r\n  background: color-mix(in srgb, var(--dshpp-accent) 22%, var(--dshpp-bg));\r\n}\r\n.dshpp-btn-ghost {\r\n  background: transparent;\r\n  color: var(--dshpp-ink);\r\n  border-color: var(--dshpp-line);\r\n}\r\n.dshpp-btn-danger {\r\n  background: transparent;\r\n  color: var(--dshpp-bad);\r\n  border-color: color-mix(in srgb, var(--dshpp-bad) 40%, var(--dshpp-line));\r\n}\r\n.dshpp-btn-solid-danger {\r\n  background: color-mix(in srgb, var(--dshpp-bad) 16%, var(--dshpp-bg));\r\n  color: var(--dshpp-bad);\r\n  border-color: color-mix(in srgb, var(--dshpp-bad) 30%, var(--dshpp-line));\r\n}\r\n.dshpp-btn-tiny {\r\n  min-height: 28px;\r\n  padding: 0 10px;\r\n  font-size: 12px;\r\n}\r\n.dshpp-field,\r\n.dshpp-area {\r\n  width: 100%;\r\n  box-sizing: border-box;\r\n  font: 13px/1.55 var(--dshpp-mono);\r\n  padding: 8px 10px;\r\n  background: var(--dshpp-bg);\r\n  color: var(--dshpp-ink);\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 8px;\r\n}\r\n.dshpp-field {\r\n  width: auto;\r\n  min-width: 140px;\r\n}\r\n.dshpp-cr-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  flex-wrap: wrap;\r\n  margin: 8px 0 0;\r\n  font-size: 13px;\r\n}\r\n.dshpp-cr-row label {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  color: var(--dshpp-ink);\r\n}\r\n.dshpp-cr-num {\r\n  width: 64px;\r\n  min-width: 64px;\r\n  height: 28px;\r\n  padding: 0 8px;\r\n}\r\n.dshpp-cr-text {\r\n  width: 120px;\r\n  min-width: 88px;\r\n  height: 28px;\r\n  padding: 0 8px;\r\n}\r\n.dshpp-ver {\r\n  width: 100%;\r\n  min-width: 0;\r\n  max-width: none;\r\n  height: 32px;\r\n  padding: 0 10px;\r\n  font-size: 12px;\r\n}\r\n.dshpp-rel {\r\n  margin: 0 0 14px;\r\n}\r\n.dshpp-now {\r\n  display: flex;\r\n  align-items: baseline;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n  margin: 0 0 4px;\r\n}\r\n.dshpp-now-label {\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  letter-spacing: 0.12em;\r\n  text-transform: uppercase;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-now-ver {\r\n  font-family: var(--dshpp-display);\r\n  font-size: 20px;\r\n  font-weight: 500;\r\n  letter-spacing: 0.01em;\r\n}\r\n.dshpp-now-mark {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  margin-left: 6px;\r\n  padding: 1px 7px;\r\n  border-radius: 99px;\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  font-style: normal;\r\n  font-weight: 500;\r\n  line-height: 1.5;\r\n  color: var(--dshpp-ok);\r\n  border: 1px solid color-mix(in srgb, var(--dshpp-ok) 38%, var(--dshpp-line));\r\n  background: color-mix(in srgb, var(--dshpp-ok) 14%, var(--dshpp-bg));\r\n}\r\n.dshpp-editions {\r\n  display: flex;\r\n  flex-direction: column;\r\n  margin: 10px 0 0;\r\n  border-top: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-edition {\r\n  display: grid;\r\n  grid-template-columns: auto minmax(0, 1fr) auto;\r\n  align-items: center;\r\n  gap: 10px;\r\n  padding: 10px 0;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-edition-name {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 0;\r\n  font-family: var(--dshpp-display);\r\n  font-size: 15px;\r\n  font-weight: 500;\r\n  white-space: nowrap;\r\n}\r\n.dshpp-edition.is-on .dshpp-edition-name {\r\n  color: var(--dshpp-ink);\r\n}\r\n.dshpp-edition:not(.is-on) .dshpp-edition-name {\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-edition .dshpp-btn {\r\n  min-width: 118px;\r\n}\r\n.dshpp-rel .dshpp-notice {\r\n  display: block;\r\n  margin-top: 8px;\r\n  min-height: 16px;\r\n}\r\n@media (max-width: 560px) {\r\n  .dshpp-edition {\r\n    grid-template-columns: 1fr auto;\r\n    grid-template-areas: "name btn" "sel sel";\r\n  }\r\n  .dshpp-edition-name {\r\n    grid-area: name;\r\n  }\r\n  .dshpp-edition .dshpp-ver {\r\n    grid-area: sel;\r\n  }\r\n  .dshpp-edition .dshpp-btn {\r\n    grid-area: btn;\r\n  }\r\n}\r\n.dshpp-area {\r\n  min-height: 220px;\r\n  resize: vertical;\r\n}\r\n.dshpp-field:focus,\r\n.dshpp-area:focus {\r\n  outline: none;\r\n  border-color: var(--dshpp-accent);\r\n  box-shadow: 0 0 0 3px var(--dshpp-accent-soft);\r\n}\r\n.dshpp-field:disabled,\r\n.dshpp-area:disabled {\r\n  opacity: 0.5;\r\n}\r\n.dshpp-ask {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n  margin-top: 10px;\r\n  padding: 10px 12px;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 8px;\r\n  background: var(--dshpp-bg);\r\n  font-size: 13px;\r\n}\r\n.dshpp-modal-bg {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 80;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 20px;\r\n  background: color-mix(in srgb, var(--dshpp-ink) 28%, transparent);\r\n}\r\n.dshpp-modal {\r\n  width: min(420px, 100%);\r\n  background: var(--dshpp-paper);\r\n  color: var(--dshpp-ink);\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 12px;\r\n  padding: 20px 20px 16px;\r\n  box-shadow: 0 16px 40px color-mix(in srgb, var(--dshpp-ink) 18%, transparent);\r\n}\r\n.dshpp-modal h4 {\r\n  margin: 0 0 8px;\r\n  font-family: var(--dshpp-display);\r\n  font-size: 18px;\r\n  font-weight: 500;\r\n}\r\n.dshpp-modal p {\r\n  margin: 0 0 16px;\r\n  font-size: 13.5px;\r\n  line-height: 1.55;\r\n}\r\n.dshpp-modal-ops {\r\n  display: flex;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n}\r\n.dshpp-restart-mask {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 12000;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 24px;\r\n  background: rgba(0, 0, 0, 0.62);\r\n  font-family:\r\n    "Yu Gothic UI", "Hiragino Sans GB", "Source Han Sans SC",\r\n    "Microsoft YaHei UI", system-ui, sans-serif;\r\n}\r\n.dshpp-restart-card {\r\n  width: min(420px, 100%);\r\n  box-sizing: border-box;\r\n  padding: 22px 22px 18px;\r\n  border-radius: 14px;\r\n  background: var(--dsw-alias-bg-layer-1, #fffcf7);\r\n  color: var(--dsw-alias-label-primary, #16140f);\r\n  border: 1px solid var(--dsw-alias-border-l1, #c9c3b6);\r\n  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);\r\n}\r\n.dshpp-restart-card h4 {\r\n  margin: 0 0 10px;\r\n  font-family: inherit;\r\n  font-size: 20px;\r\n  font-weight: 650;\r\n  line-height: 1.35;\r\n  color: inherit;\r\n}\r\n.dshpp-restart-card p {\r\n  margin: 0 0 18px;\r\n  font-size: 16px;\r\n  font-weight: 500;\r\n  line-height: 1.65;\r\n  color: inherit;\r\n}\r\n.dshpp-restart-card .dshpp-modal-ops {\r\n  display: flex;\r\n  justify-content: flex-end;\r\n  gap: 10px;\r\n}\r\n.dshpp-restart-card .dshpp-btn {\r\n  min-height: 38px;\r\n  padding: 0 16px;\r\n  font-size: 15px;\r\n  font-weight: 650;\r\n  color: var(--dsw-alias-label-primary, #16140f);\r\n  background: var(--dsw-alias-bg-layer-2, #fff);\r\n  border: 1px solid var(--dsw-alias-border-l1, #c9c3b6);\r\n}\r\n.dshpp-restart-card .dshpp-btn-primary,\r\n.dshpp-restart-card .dshpp-btn-primary:hover:not(:disabled) {\r\n  color: #fff;\r\n  background: #2f6b4f;\r\n  border-color: #2f6b4f;\r\n}\r\nbody[data-ds-dark-theme] .dshpp-restart-card,\r\n.dshpp-restart-mask[data-theme="dusk"] .dshpp-restart-card {\r\n  background: #1c1e24;\r\n  color: #f4f1ea;\r\n  border-color: #5a5e68;\r\n}\r\nbody[data-ds-dark-theme] .dshpp-restart-card .dshpp-btn,\r\n.dshpp-restart-mask[data-theme="dusk"] .dshpp-restart-card .dshpp-btn {\r\n  color: #f4f1ea;\r\n  background: #2a2d34;\r\n  border-color: #5a5e68;\r\n}\r\nbody[data-ds-dark-theme] .dshpp-restart-card .dshpp-btn-primary,\r\nbody[data-ds-dark-theme]\r\n  .dshpp-restart-card\r\n  .dshpp-btn-primary:hover:not(:disabled),\r\n.dshpp-restart-mask[data-theme="dusk"] .dshpp-restart-card .dshpp-btn-primary,\r\n.dshpp-restart-mask[data-theme="dusk"]\r\n  .dshpp-restart-card\r\n  .dshpp-btn-primary:hover:not(:disabled) {\r\n  color: #fff;\r\n  background: #3d8f68;\r\n  border-color: #3d8f68;\r\n}\r\n.dshpp-notice {\r\n  font-size: 12.5px;\r\n  line-height: 1.4;\r\n}\r\n.dshpp-notice.is-ok {\r\n  color: var(--dshpp-ok);\r\n}\r\n.dshpp-notice.is-bad {\r\n  color: var(--dshpp-bad);\r\n  white-space: pre-wrap;\r\n  overflow-wrap: anywhere;\r\n}\r\n.dshpp-skel {\r\n  height: 12px;\r\n  border-radius: 6px;\r\n  background: linear-gradient(\r\n    90deg,\r\n    var(--dshpp-fill),\r\n    var(--dshpp-line),\r\n    var(--dshpp-fill)\r\n  );\r\n  background-size: 200% 100%;\r\n  animation: dshpp-pulse 1.2s ease-in-out infinite;\r\n}\r\n.dshpp-active {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  flex-wrap: wrap;\r\n  padding: 10px 12px;\r\n  margin-bottom: 12px;\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dshpp-bg);\r\n  border-radius: 8px;\r\n}\r\n.dshpp-active b {\r\n  font-family: var(--dshpp-display);\r\n  font-weight: 500;\r\n}\r\n.dshpp-empty {\r\n  padding: 28px 12px;\r\n  font-size: 13px;\r\n  color: var(--dshpp-mute);\r\n  text-align: center;\r\n}\r\n.dshpp-split {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 12px;\r\n}\r\n.dshpp-rulelist {\r\n  display: flex;\r\n  flex-direction: column;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 8px;\r\n  background: var(--dshpp-bg);\r\n  overflow: hidden;\r\n}\r\n.dshpp-rulebody {\r\n  max-height: 240px;\r\n  overflow: auto;\r\n}\r\n.dshpp-ruleitem {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  width: 100%;\r\n  padding: 10px 12px;\r\n  border: 0;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  text-align: left;\r\n  cursor: pointer;\r\n}\r\n.dshpp-ruleitem:hover {\r\n  background: var(--dshpp-fill);\r\n}\r\n.dshpp-ruleitem.is-edit {\r\n  background: var(--dshpp-accent-soft);\r\n}\r\n.dshpp-rule-main {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n.dshpp-rule-name {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  font-family: var(--dshpp-display);\r\n  font-size: 14px;\r\n  line-height: 1.35;\r\n}\r\n.dshpp-rule-meta {\r\n  display: block;\r\n  margin-top: 3px;\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-rule-ops {\r\n  display: flex;\r\n  flex-direction: row;\r\n  align-items: center;\r\n  gap: 6px;\r\n  flex-shrink: 0;\r\n}\r\n.dshpp-create {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 6px;\r\n  padding: 10px 12px;\r\n  border-top: 1px solid var(--dshpp-line);\r\n  background: var(--dshpp-paper);\r\n}\r\n.dshpp-create-row {\r\n  display: flex;\r\n  gap: 6px;\r\n  align-items: center;\r\n}\r\n.dshpp-create .dshpp-field {\r\n  flex: 1;\r\n  min-width: 0;\r\n  width: auto;\r\n}\r\n.dshpp-editor {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n  min-width: 0;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 8px;\r\n  background: var(--dshpp-bg);\r\n  padding: 12px;\r\n  min-height: 320px;\r\n}\r\n.dshpp-editor .dshpp-area {\r\n  flex: 1;\r\n  min-height: 240px;\r\n}\r\n.dshpp-editor-empty {\r\n  flex: 1;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  color: var(--dshpp-mute);\r\n  font-size: 13px;\r\n  min-height: 160px;\r\n}\r\n.dshpp-block {\r\n  padding: 14px 0;\r\n  border-top: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-block-head {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  margin: 0 0 8px;\r\n}\r\n.dshpp-block-head h4 {\r\n  margin: 0;\r\n  font-family: var(--dshpp-display);\r\n  font-size: 14px;\r\n  font-weight: 500;\r\n  flex: 1;\r\n  color: var(--dshpp-ink);\r\n}\r\n.dshpp-block-hint {\r\n  margin: 8px 0 0;\r\n  font-size: 12px;\r\n  line-height: 1.55;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-policy-row {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n}\r\n.dshpp-policy-row > label {\r\n  font-size: 12px;\r\n  color: var(--dshpp-mute);\r\n  flex: 0 0 auto;\r\n}\r\n.dshpp-cwd-path {\r\n  margin: 0 0 8px;\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n  word-break: break-all;\r\n  line-height: 1.5;\r\n}\r\n.dshpp-cwd-list {\r\n  display: flex;\r\n  flex-direction: column;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 8px;\r\n  background: var(--dshpp-bg);\r\n  overflow: hidden;\r\n}\r\n.dshpp-cwd-item {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  gap: 10px;\r\n  padding: 10px 12px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  cursor: pointer;\r\n  margin: 0;\r\n}\r\n.dshpp-cwd-item:last-child {\r\n  border-bottom: 0;\r\n}\r\n.dshpp-cwd-item:hover {\r\n  background: var(--dshpp-fill);\r\n}\r\n.dshpp-cwd-item.is-on {\r\n  background: var(--dshpp-accent-soft);\r\n}\r\n.dshpp-cwd-item input {\r\n  margin: 3px 0 0;\r\n  flex: 0 0 auto;\r\n}\r\n.dshpp-cwd-main {\r\n  flex: 1;\r\n  min-width: 0;\r\n}\r\n.dshpp-cwd-name {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n  font-family: var(--dshpp-display);\r\n  font-size: 13.5px;\r\n  line-height: 1.35;\r\n  color: var(--dshpp-ink);\r\n}\r\n.dshpp-cwd-badge {\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 10px;\r\n  letter-spacing: 0.04em;\r\n  text-transform: uppercase;\r\n  padding: 1px 7px;\r\n  border-radius: 99px;\r\n  border: 1px solid var(--dshpp-line);\r\n  color: var(--dshpp-mute);\r\n  line-height: 1.6;\r\n}\r\n.dshpp-cwd-size {\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-cwd-sub {\r\n  margin-top: 3px;\r\n  font-family: var(--dshpp-mono);\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n  word-break: break-all;\r\n}\r\n.dshpp-cwd-prev {\r\n  margin-top: 4px;\r\n  font-size: 11px;\r\n  line-height: 1.5;\r\n  color: var(--dshpp-mute);\r\n  max-height: 34px;\r\n  overflow: hidden;\r\n}\r\n@keyframes dshpp-pulse {\r\n  0% {\r\n    background-position: 200% 0;\r\n  }\r\n  100% {\r\n    background-position: -200% 0;\r\n  }\r\n}\r\n@media (max-width: 640px) {\r\n  .dshpp-metrics {\r\n    grid-template-columns: 1fr;\r\n  }\r\n  .dshpp-ruleitem {\r\n    flex-wrap: wrap;\r\n  }\r\n  .dshpp-rule-ops {\r\n    width: 100%;\r\n    justify-content: flex-end;\r\n  }\r\n}\r\n@media (prefers-reduced-motion: reduce) {\r\n  .dshpp-btn,\r\n  .dshpp-bar > i {\r\n    transition: none;\r\n  }\r\n  .dshpp-skel {\r\n    animation: none;\r\n  }\r\n}\r\nbody:not([data-ds-dark-theme]) .dshpp-auth-modal {\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-bg-layer-1, #fffcf7) 92%,\r\n    transparent\r\n  );\r\n  color: var(--dsw-alias-label-primary, #1a1916);\r\n  border-color: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-border-l1, #c9c3b6) 80%,\r\n    transparent\r\n  );\r\n  backdrop-filter: blur(18px) saturate(1.3);\r\n  -webkit-backdrop-filter: blur(18px) saturate(1.3);\r\n}\r\nbody:not([data-ds-dark-theme]) .dshpp-auth-legal {\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-bg-layer-2, #f3f0e8) 90%,\r\n    transparent\r\n  );\r\n  color: var(--dsw-alias-label-primary, #1a1916);\r\n  border-color: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-border-l1, #c9c3b6) 80%,\r\n    transparent\r\n  );\r\n}\r\nbody:not([data-ds-dark-theme]) .dshpp-auth-warn {\r\n  background: color-mix(in srgb, #f5e6c8 88%, transparent);\r\n  color: #6b4a10;\r\n}\r\nbody:not([data-ds-dark-theme]) .dshpp-auth-ops button {\r\n  border-color: var(--dsw-alias-border-l1, #c9c3b6);\r\n  color: var(--dsw-alias-label-primary, #1a1916);\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-bg-layer-1, #fff) 88%,\r\n    transparent\r\n  );\r\n}\r\nbody:not([data-ds-dark-theme]) .dshpp-auth-ops button.primary {\r\n  background: var(--dsw-alias-brand-primary, #3f6b52);\r\n  border-color: var(--dsw-alias-brand-primary, #3f6b52);\r\n  color: #fff;\r\n}\r\n.dshpp-env-dialog {\r\n  position: fixed;\r\n  inset: 0;\r\n  width: min(480px, calc(100% - 32px));\r\n  max-height: calc(100% - 32px);\r\n  margin: auto;\r\n  border: 0;\r\n  padding: 0;\r\n  border-radius: 12px;\r\n  background: transparent;\r\n}\r\n.dshpp-env-dialog::backdrop {\r\n  background: rgba(0, 0, 0, 0.55);\r\n}\r\n.dshpp-env-dialog .dshpp-auth-modal {\r\n  box-sizing: border-box;\r\n  width: 100%;\r\n  overflow: auto;\r\n}\r\n.dshpp-auth-mask {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 10100;\r\n  background: rgba(0, 0, 0, 0.62);\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 20px;\r\n  pointer-events: auto;\r\n}\r\n.dshpp-auth-modal {\r\n  width: min(680px, 100%);\r\n  max-height: min(88vh, 820px);\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n  padding: 16px;\r\n  border: 1px solid var(--dsw-alias-border-l1, #333);\r\n  border-radius: 12px;\r\n  background: var(--dsw-alias-bg-layer-1, #1a1a1a);\r\n  color: var(--dsw-alias-label-primary, #eee);\r\n}\r\n.dshpp-auth-modal h2 {\r\n  margin: 0;\r\n  font-size: 16px;\r\n  font-weight: 600;\r\n}\r\n.dshpp-auth-warn {\r\n  padding: 8px 10px;\r\n  border-radius: 8px;\r\n  background: #3a2e18;\r\n  color: #f0d48a;\r\n  font-size: 13px;\r\n}\r\n.dshpp-auth-legal {\r\n  overflow: auto;\r\n  height: 300px;\r\n  margin: 0;\r\n  padding: 10px 12px;\r\n  border: 1px solid var(--dsw-alias-border-l1, #333);\r\n  border-radius: 8px;\r\n  background: #121212;\r\n  font-size: 13px;\r\n  line-height: 1.55;\r\n}\r\n.dshpp-auth-legal h3 {\r\n  margin: 14px 0 4px;\r\n  font-size: 13px;\r\n}\r\n.dshpp-auth-legal h3:first-child {\r\n  margin-top: 0;\r\n}\r\n.dshpp-auth-legal p {\r\n  margin: 0 0 8px;\r\n}\r\n.dshpp-auth-checks {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  font-size: 13px;\r\n}\r\n.dshpp-auth-checks label {\r\n  display: flex;\r\n  gap: 8px;\r\n  align-items: flex-start;\r\n}\r\n.dshpp-auth-checks label.locked {\r\n  opacity: 0.45;\r\n}\r\n.dshpp-auth-ops {\r\n  display: flex;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n}\r\n.dshpp-auth-ops button {\r\n  appearance: none;\r\n  border: 1px solid var(--dsw-alias-border-l1, #444);\r\n  background: transparent;\r\n  color: inherit;\r\n  border-radius: 8px;\r\n  padding: 6px 12px;\r\n  cursor: pointer;\r\n  font: inherit;\r\n}\r\n.dshpp-auth-ops button.primary {\r\n  background: #2a4033;\r\n  border-color: #8fbf9a;\r\n}\r\n.dshpp-auth-ops button:disabled {\r\n  opacity: 0.45;\r\n  cursor: default;\r\n}\r\n.dshpp-icon-btn {\r\n  appearance: none;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  height: 32px;\r\n  padding: 0 10px;\r\n  border: 1px solid\r\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 45%, transparent);\r\n  border-radius: 8px;\r\n  background: transparent;\r\n  color: var(--dsw-alias-label-secondary, currentColor);\r\n  cursor: pointer;\r\n  font: 13px/1 inherit;\r\n  white-space: nowrap;\r\n  flex: 0 0 auto;\r\n}\r\n.dshpp-icon-btn:hover {\r\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-brand-primary, #6dbf8c) 12%,\r\n    transparent\r\n  );\r\n  color: var(--dsw-alias-label-primary, currentColor);\r\n}\r\n.dshpp-icon-btn.on {\r\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  color: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-brand-primary, #6dbf8c) 16%,\r\n    transparent\r\n  );\r\n  box-shadow: 0 0 0 1px\r\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 28%, transparent);\r\n}\r\n.dshpp-hbtn {\r\n  appearance: none;\r\n  display: inline-flex;\r\n  flex: 0 0 auto;\r\n  align-items: center;\r\n  gap: 6px;\r\n  border: 1px solid\r\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 55%, transparent);\r\n  background: transparent;\r\n  color: var(--dsw-alias-label-secondary, currentColor);\r\n  cursor: pointer;\r\n  font: 12px/1 inherit;\r\n  padding: 5px 10px;\r\n  border-radius: 8px;\r\n  white-space: nowrap;\r\n}\r\n.dshpp-hbtn:hover {\r\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-brand-primary, #6dbf8c) 12%,\r\n    transparent\r\n  );\r\n  color: var(--dsw-alias-label-primary, currentColor);\r\n}\r\n.dshpp-hbtn.on {\r\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  color: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  background: color-mix(\r\n    in srgb,\r\n    var(--dsw-alias-brand-primary, #6dbf8c) 18%,\r\n    transparent\r\n  );\r\n  box-shadow: 0 0 0 1px\r\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 32%, transparent);\r\n}\r\n.dshpp-live-dot {\r\n  width: 7px;\r\n  height: 7px;\r\n  border-radius: 50%;\r\n  flex: none;\r\n  background: var(--dsw-alias-brand-primary, #6dbf8c);\r\n  box-shadow: 0 0 0 3px\r\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 28%, transparent);\r\n}\r\n/* Glass follows host colors; text uses a more opaque surface than the shell. */\r\n\r\n/* Keep the historical IDs addressable by sessions. Collapse a healthy alias\r\n   in Settings only while a usable canonical child is in the same roster. */\r\nul:has(\r\n    > li[data-agent-preset-id^="unrestricted-child-"]\r\n      > button[aria-disabled="false"]\r\n      [title$=" \xB7 Subtask"]\r\n  )\r\n  > li[data-agent-preset-id^="unrestricted-child-"]:has(\r\n    > button[aria-disabled="false"][aria-pressed="false"]\r\n      [title*=" \xB7 Subtask (Legacy compatibility \xB7 "][title$=")"]\r\n  ) {\r\n  display: none;\r\n}\r\n\r\nbutton[data-purge-collapsed-alias] {\r\n  display: none !important;\r\n}\r\n';

// src/styles/native.css
var native_default = '.dshpp-native.dshpp-root {\r\n  --dshpp-display: inherit;\r\n  --dshpp-sans: inherit;\r\n  --dshpp-paper: var(--dsw-alias-bg-base, transparent);\r\n  --dshpp-bg: transparent;\r\n  --dshpp-line: var(--dsw-alias-border-l1, #ddd);\r\n  --dshpp-ink: var(--dsw-alias-label-primary, #171717);\r\n  --dshpp-mute: var(--dsw-alias-label-secondary, #777);\r\n  --dshpp-accent: var(--dsw-alias-brand-primary, #4775ed);\r\n  --dshpp-fill: var(--dsw-alias-interactive-bg-hover, #f3f3f3);\r\n  container: purge-settings / inline-size;\r\n  font: inherit;\r\n  font-size: var(--dsh-content-font-size, 14px);\r\n  width: 100%;\r\n  height: 100%;\r\n  min-height: 0;\r\n  max-width: none;\r\n  padding: 0;\r\n  gap: 0;\r\n  border-radius: 0;\r\n  overflow: hidden;\r\n  box-sizing: border-box;\r\n}\r\n.dshpp-native * {\r\n  box-sizing: border-box;\r\n}\r\n.dshpp-native [hidden] {\r\n  display: none !important;\r\n}\r\n.dshpp-native-head {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  padding: 20px 20px 12px;\r\n  gap: 12px;\r\n  flex: none;\r\n}\r\n.dshpp-native-head h2 {\r\n  font: inherit;\r\n  font-size: 1.3em;\r\n  font-weight: 600;\r\n  margin: 0;\r\n}\r\n.dshpp-native-head p {\r\n  margin: 4px 0 0;\r\n  font-size: 0.85em;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-native-badge {\r\n  font-size: 0.8em;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-native-nav {\r\n  display: flex;\r\n  gap: 4px;\r\n  padding: 0 16px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  flex: none;\r\n  overflow-x: auto;\r\n}\r\n.dshpp-native-nav button {\r\n  font: inherit;\r\n  font-size: 0.92em;\r\n  border: 0;\r\n  border-bottom: 2px solid transparent;\r\n  background: none;\r\n  color: var(--dshpp-mute);\r\n  padding: 10px 8px;\r\n  white-space: nowrap;\r\n  cursor: pointer;\r\n}\r\n.dshpp-native-nav button[aria-pressed="true"] {\r\n  color: var(--dshpp-ink);\r\n  border-bottom-color: var(--dshpp-accent);\r\n}\r\n.dshpp-native-content {\r\n  min-height: 0;\r\n  flex: 1;\r\n  overflow: auto;\r\n  padding: 16px 20px;\r\n  scrollbar-gutter: stable;\r\n  overscroll-behavior: contain;\r\n}\r\n.dshpp-native .dshpp-panel {\r\n  border: 0;\r\n  border-radius: 0;\r\n  padding: 0;\r\n  background: transparent;\r\n  min-width: 0;\r\n}\r\n.dshpp-native\r\n  :is(\r\n    h3,\r\n    h4,\r\n    .dshpp-title,\r\n    .dshpp-group-h strong,\r\n    .dshpp-metric b,\r\n    .dshpp-now-ver,\r\n    .dshpp-edition-name\r\n  ) {\r\n  font-family: inherit;\r\n  font-size: 1em;\r\n  letter-spacing: normal;\r\n  font-weight: 550;\r\n}\r\n.dshpp-native .dshpp-metric b {\r\n  font-size: 1.12em;\r\n}\r\n.dshpp-native .dshpp-head {\r\n  margin-bottom: 12px;\r\n}\r\n.dshpp-native .dshpp-sub {\r\n  margin-top: 0;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-native :is(button, input, select, textarea) {\r\n  font-family: inherit;\r\n  box-shadow: none;\r\n  background-image: none;\r\n  max-width: 100%;\r\n}\r\n.dshpp-native .dshpp-btn {\r\n  font-size: 0.9em;\r\n  min-height: 32px;\r\n  border-radius: 7px;\r\n  padding: 6px 10px;\r\n  transform: none;\r\n  box-shadow: none;\r\n}\r\n.dshpp-native .dshpp-btn:hover:not(:disabled) {\r\n  background: var(--dshpp-fill);\r\n  box-shadow: none;\r\n  transform: none;\r\n}\r\n.dshpp-native .dshpp-btn-primary {\r\n  background: var(--dsw-alias-label-primary, #171717);\r\n  color: var(--dsw-alias-bg-base, #fff);\r\n  border-color: transparent;\r\n}\r\n.dshpp-native .dshpp-btn-primary:hover:not(:disabled) {\r\n  opacity: 0.85;\r\n  background: var(--dsw-alias-label-primary, #171717);\r\n}\r\n.dshpp-native :is(button, input, select, textarea):focus-visible {\r\n  outline: 2px solid var(--dshpp-accent);\r\n  outline-offset: 2px;\r\n  box-shadow: none;\r\n}\r\n.dshpp-native .dshpp-area {\r\n  font-family: inherit;\r\n  font-size: 0.92em;\r\n  line-height: 1.6;\r\n  min-height: 260px;\r\n  width: 100%;\r\n  border-radius: 8px;\r\n  background: transparent;\r\n  color: inherit;\r\n}\r\n.dshpp-native .dshpp-field {\r\n  font-size: 0.92em;\r\n  background: transparent;\r\n  color: inherit;\r\n}\r\n.dshpp-native .dshpp-metrics {\r\n  grid-template-columns: repeat(2, minmax(0, 1fr));\r\n  gap: 8px;\r\n}\r\n.dshpp-native .dshpp-metric:nth-child(2) {\r\n  display: none;\r\n}\r\n.dshpp-native .dshpp-metric {\r\n  min-height: 60px;\r\n  padding: 12px;\r\n  background: var(--dshpp-fill);\r\n  border: 0;\r\n}\r\n.dshpp-native .dshpp-metric span {\r\n  font-size: 0.85em;\r\n}\r\n.dshpp-native .dshpp-editions {\r\n  margin: 10px 0;\r\n  border: 0;\r\n}\r\n.dshpp-native summary {\r\n  cursor: pointer;\r\n  color: var(--dshpp-mute);\r\n  padding: 8px 0;\r\n  font-size: 0.9em;\r\n}\r\n.dshpp-native .dshpp-edition {\r\n  grid-template-columns: 1fr auto;\r\n  gap: 8px;\r\n}\r\n.dshpp-native .dshpp-edition-name {\r\n  grid-column: 1/-1;\r\n}\r\n.dshpp-native .dshpp-edition .dshpp-btn {\r\n  min-width: 0;\r\n}\r\n.dshpp-native .dshpp-table {\r\n  table-layout: fixed;\r\n  font-size: 0.83em;\r\n}\r\n.dshpp-native .dshpp-table td {\r\n  word-break: break-word;\r\n  padding: 8px;\r\n}\r\n.dshpp-native .dshpp-table th {\r\n  padding: 8px;\r\n}\r\n.dshpp-native .dshpp-group-h {\r\n  flex-wrap: wrap;\r\n  gap: 6px;\r\n}\r\n.dshpp-native .dshpp-group-h em {\r\n  font-size: 0.85em;\r\n}\r\n.dshpp-native .dshpp-row {\r\n  gap: 8px;\r\n}\r\n.dshpp-native .dshpp-hint {\r\n  font-size: 0.85em !important;\r\n  line-height: 1.6;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-native .dshpp-more {\r\n  border-top: 1px solid var(--dshpp-line);\r\n  padding-top: 20px;\r\n  margin-top: 24px;\r\n}\r\n.dshpp-native .dshpp-more p {\r\n  font-size: 0.9em;\r\n  line-height: 1.6;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-native .dshpp-attribution {\r\n  margin-top: 32px;\r\n  font-size: 0.78em !important;\r\n}\r\n\r\n/* The embedded drill console needs its own expansion and scrolling. */\r\n.dshpp-native-drill {\r\n  width: 100%;\r\n  min-width: 0;\r\n  min-height: 72vh;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n  padding-bottom: 24px;\r\n  box-sizing: border-box;\r\n}\r\n.dshpp-native-drill > .rt-dock.rt-embedded {\r\n  flex: 1 1 auto;\r\n  min-height: 0;\r\n  min-width: 0;\r\n  width: 100%;\r\n  height: auto;\r\n  overflow: visible;\r\n}\r\n/* Wrap flex rows in the narrow sidebar; inputs must not squeeze siblings. */\r\n.dshpp-native-drill .rt-dock,\r\n.dshpp-native-drill .rt-dock * {\r\n  box-sizing: border-box;\r\n  min-width: 0;\r\n  word-break: normal;\r\n  overflow-wrap: anywhere;\r\n}\r\n.dshpp-native-drill .rt-dock input,\r\n.dshpp-native-drill .rt-dock textarea,\r\n.dshpp-native-drill .rt-dock select {\r\n  width: 100%;\r\n  max-width: 100%;\r\n}\r\n\r\n/* Match the update-channel control to adjacent update settings.\r\n   Cover both plugin settings (.dshpp-native) and the full page (.dshpp-page). */\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-open {\r\n  min-height: 32px;\r\n  padding: 4px 12px;\r\n  border-radius: 7px;\r\n  font-size: 0.9em;\r\n  white-space: nowrap;\r\n}\r\n/* Retain legacy right-aligned headings for external consumers. */\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-head {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-head h3 {\r\n  margin: 0;\r\n}\r\n/* Fixed-position update dialog avoids depending on host portal support. */\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-mask {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 12050;\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 20px;\r\n  background: rgba(0, 0, 0, 0.55);\r\n  pointer-events: auto;\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-card {\r\n  width: min(440px, 100%);\r\n  max-height: min(88vh, 720px);\r\n  overflow: auto;\r\n  box-sizing: border-box;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 8px;\r\n  padding: 18px;\r\n  border-radius: 12px;\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dsw-alias-bg-layer-1, #fffcf7);\r\n  color: var(--dshpp-ink);\r\n  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-title {\r\n  margin: 0 0 2px;\r\n  font-family: inherit;\r\n  font-size: 1em;\r\n  font-weight: 600;\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-label {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n  font-size: 0.88em;\r\n  color: var(--dshpp-mute);\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-field {\r\n  width: 100%;\r\n  min-width: 0;\r\n  font-size: 0.92em;\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-check {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  font-size: 0.88em;\r\n  color: var(--dshpp-mute);\r\n}\r\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-ops {\r\n  display: flex;\r\n  justify-content: flex-end;\r\n  gap: 8px;\r\n  margin-top: 4px;\r\n}\r\n\r\n:is(.dshpp-native, .dshpp-page) .dshpp-composer-settings {\r\n  padding-block: 2px 8px;\r\n  margin-bottom: 12px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-composer-settings h3 {\r\n  margin: 0;\r\n  font: inherit;\r\n  font-weight: 600;\r\n}\r\n.dshpp-setting-row {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 12px;\r\n  min-height: 44px;\r\n  cursor: pointer;\r\n}\r\n.dshpp-setting-row input[role="switch"] {\r\n  appearance: none;\r\n  flex: none;\r\n  box-sizing: border-box;\r\n  width: 32px;\r\n  height: 20px;\r\n  margin: 0 2px;\r\n  padding: 2px;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 12px;\r\n  background: var(--dsw-alias-interactive-bg-hover, rgba(127, 127, 127, 0.23));\r\n  cursor: pointer;\r\n}\r\n.dshpp-setting-row input::before {\r\n  content: "";\r\n  display: block;\r\n  width: 14px;\r\n  height: 14px;\r\n  border-radius: 50%;\r\n  background: var(--dsw-alias-label-secondary, #777);\r\n}\r\n.dshpp-setting-row input:checked {\r\n  background: var(--dshpp-accent);\r\n  border-color: var(--dshpp-accent);\r\n}\r\n.dshpp-setting-row input:checked::before {\r\n  transform: translateX(12px);\r\n  background: white;\r\n}\r\n.dshpp-setting-row input:focus-visible {\r\n  outline: 2px solid var(--dshpp-accent);\r\n  outline-offset: 3px;\r\n}\r\n.dshpp-setting-row input:disabled {\r\n  opacity: 0.6;\r\n}\r\n@media (forced-colors: active) {\r\n  .dshpp-setting-row input[role="switch"] {\r\n    appearance: auto;\r\n  }\r\n  .dshpp-setting-row input::before {\r\n    content: none;\r\n  }\r\n}\r\n@container purge-settings (max-width: 520px) {\r\n  .dshpp-native-head {\r\n    padding: 14px 12px 8px;\r\n  }\r\n  .dshpp-native-nav {\r\n    padding-inline: 8px;\r\n    gap: 0;\r\n  }\r\n  .dshpp-native-nav button {\r\n    flex: 1 0 auto;\r\n    min-height: 44px;\r\n  }\r\n  .dshpp-native-content {\r\n    padding: 12px;\r\n    scrollbar-gutter: auto;\r\n  }\r\n}\r\n';

// src/styles/page.css
var page_default = '/* Full sidebar page uses DSH fonts, spacing, and theme variables. */\r\n.dshpp-page {\r\n  --dshpp-line: var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.22));\r\n  --dshpp-line-strong: var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.4));\r\n  --dshpp-fg: var(--dsw-alias-label-primary, currentColor);\r\n  --dshpp-mute: var(\r\n    --dsw-alias-label-secondary,\r\n    color-mix(in srgb, currentColor 62%, transparent)\r\n  );\r\n  --dshpp-bg: var(--dsw-alias-bg-layer-1, transparent);\r\n  --dshpp-bg-2: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.06));\r\n  --dshpp-accent: var(--dsw-alias-brand-primary, #4d6bfe);\r\n  --dshpp-ok: var(--dsw-alias-state-success-primary, #1f9d55);\r\n  --dshpp-warn: var(--dsw-alias-state-warn-primary, #b7791f);\r\n  --dshpp-bad: var(--dsw-alias-state-error-primary, #d14343);\r\n  box-sizing: border-box;\r\n  container: purge-page / inline-size;\r\n  width: 100%;\r\n  min-width: 0;\r\n  height: 100%;\r\n  min-height: 0;\r\n  overflow: auto;\r\n  padding: 20px clamp(12px, 3%, 32px) 32px;\r\n  color: var(--dshpp-fg);\r\n  font: inherit;\r\n  font-size: var(--dsh-content-font-size, 14px);\r\n  line-height: 1.55;\r\n  -webkit-font-smoothing: antialiased;\r\n}\r\n.dshpp-page *,\r\n.dshpp-page *::before,\r\n.dshpp-page *::after {\r\n  box-sizing: border-box;\r\n}\r\n\r\n.dshpp-page-head {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 12px;\r\n  min-width: 0;\r\n}\r\n.dshpp-page-glyph {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  width: 34px;\r\n  height: 34px;\r\n  border-radius: 10px;\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dshpp-bg-2);\r\n  color: var(--dshpp-accent);\r\n  flex: none;\r\n}\r\n.dshpp-page-title {\r\n  min-width: 0;\r\n}\r\n.dshpp-page-title h1 {\r\n  margin: 0;\r\n  font-size: 1.3em;\r\n  font-weight: 600;\r\n  letter-spacing: 0.01em;\r\n}\r\n.dshpp-page-title p {\r\n  margin: 2px 0 0;\r\n  font-size: 0.86em;\r\n  color: var(--dshpp-mute);\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-page-ver {\r\n  padding: 1px 6px;\r\n  border-radius: 999px;\r\n  border: 1px solid var(--dshpp-line);\r\n  font-size: 0.92em;\r\n}\r\n\r\n/* Compact status summary matches the host subtitle row. */\r\n.dshpp-strip {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 6px 18px;\r\n  margin: 0;\r\n  padding: 0 0 12px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  font-size: 0.86em;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-strip-item {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 5px;\r\n  min-width: 0;\r\n}\r\n.dshpp-strip-item b {\r\n  color: var(--dshpp-fg);\r\n  font-weight: 600;\r\n}\r\n.dshpp-dot {\r\n  width: 7px;\r\n  height: 7px;\r\n  border-radius: 50%;\r\n  background: var(--dshpp-mute);\r\n  flex: none;\r\n}\r\n.dshpp-dot.is-ok {\r\n  background: var(--dshpp-ok);\r\n}\r\n.dshpp-dot.is-warn {\r\n  background: var(--dshpp-warn);\r\n}\r\n.dshpp-dot.is-bad {\r\n  background: var(--dshpp-bad);\r\n}\r\n\r\n/* Underlined tabs match DSH settings. */\r\n.dshpp-page-tabs {\r\n  display: flex;\r\n  gap: 2px;\r\n  margin: 10px 0 0;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  overflow-x: auto;\r\n  scrollbar-width: none;\r\n}\r\n.dshpp-page-tabs::-webkit-scrollbar {\r\n  display: none;\r\n}\r\n.dshpp-page-tabs button {\r\n  appearance: none;\r\n  border: 0;\r\n  background: transparent;\r\n  color: var(--dshpp-mute);\r\n  font: inherit;\r\n  font-size: 1em;\r\n  padding: 10px 12px;\r\n  border-bottom: 2px solid transparent;\r\n  margin-bottom: -1px;\r\n  cursor: pointer;\r\n  white-space: nowrap;\r\n}\r\n.dshpp-page-tabs button:hover {\r\n  color: var(--dshpp-fg);\r\n}\r\n.dshpp-page-tabs button[aria-selected="true"] {\r\n  color: var(--dshpp-fg);\r\n  border-bottom-color: var(--dshpp-accent);\r\n  font-weight: 600;\r\n}\r\n\r\n.dshpp-page-body {\r\n  padding-top: 18px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 16px;\r\n  min-width: 0;\r\n}\r\n.dshpp-sec {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 16px;\r\n  min-width: 0;\r\n}\r\n.dshpp-sec[hidden] {\r\n  display: none;\r\n}\r\n\r\n/* Cards use the DSH layer-1 panel. */\r\n.dshpp-page .dshpp-card,\r\n.dshpp-page section.dshpp-panel {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: var(--dsw-radius-md, 10px);\r\n  background: var(--dshpp-bg);\r\n  padding: 16px 18px;\r\n  margin: 0;\r\n  min-width: 0;\r\n}\r\n.dshpp-page .dshpp-card > h3:first-child,\r\n.dshpp-page section.dshpp-panel > h3:first-child {\r\n  margin: 0 0 12px;\r\n  font-size: 1em;\r\n  font-weight: 600;\r\n}\r\n.dshpp-page .dshpp-panel {\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 12px;\r\n}\r\n\r\n/* Labels sit beside controls and wrap on narrow screens. */\r\n.dshpp-page .dshpp-field {\r\n  display: grid;\r\n  grid-template-columns: minmax(120px, 190px) 1fr;\r\n  gap: 8px 14px;\r\n  align-items: center;\r\n}\r\n.dshpp-page .dshpp-field > .dshpp-field-label {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  font-size: 0.92em;\r\n  color: var(--dshpp-fg);\r\n}\r\n.dshpp-page .dshpp-field > .dshpp-field-body {\r\n  min-width: 0;\r\n}\r\n@container purge-page (max-width: 640px) {\r\n  .dshpp-page .dshpp-field {\r\n    grid-template-columns: 1fr;\r\n  }\r\n}\r\n\r\n.dshpp-page .dshpp-muted,\r\n.dshpp-page .dshpp-hint {\r\n  color: var(--dshpp-mute) !important;\r\n  font-size: 0.86em !important;\r\n  line-height: 1.6;\r\n  margin: 0;\r\n}\r\n\r\n.dshpp-page .dshpp-row {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  gap: 10px;\r\n  align-items: center;\r\n  min-width: 0;\r\n}\r\n.dshpp-page input,\r\n.dshpp-page select,\r\n.dshpp-page textarea {\r\n  font: inherit;\r\n  color: var(--dshpp-fg);\r\n  background: var(--dshpp-bg-2);\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 8px;\r\n  padding: 7px 10px;\r\n  max-width: 100%;\r\n}\r\n.dshpp-page input:focus-visible,\r\n.dshpp-page select:focus-visible,\r\n.dshpp-page textarea:focus-visible {\r\n  outline: 2px solid color-mix(in srgb, var(--dshpp-accent) 55%, transparent);\r\n  outline-offset: 1px;\r\n}\r\n.dshpp-page textarea {\r\n  width: 100%;\r\n  min-height: 320px;\r\n  resize: vertical;\r\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\r\n  font-size: 0.86em;\r\n  line-height: 1.6;\r\n}\r\n\r\n.dshpp-page .dshpp-btn {\r\n  font: inherit;\r\n  font-size: 0.9em;\r\n  border-radius: 8px;\r\n  padding: 6px 12px;\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dshpp-bg-2);\r\n  color: var(--dshpp-fg);\r\n  cursor: pointer;\r\n  white-space: nowrap;\r\n}\r\n.dshpp-page .dshpp-btn:hover:not(:disabled) {\r\n  border-color: var(--dshpp-line-strong);\r\n}\r\n.dshpp-page .dshpp-btn:disabled {\r\n  opacity: 0.45;\r\n  cursor: not-allowed;\r\n}\r\n/* brand-primary is a bright text color in dark mode, so a background would\r\n   produce white-on-white controls. Use solid green with white text. */\r\n.dshpp-page {\r\n  --dshpp-solid: #2f6b4f;\r\n  --dshpp-solid-hover: #3a8260;\r\n  --dshpp-solid-danger: #a63b3b;\r\n  --dshpp-solid-danger-hover: #bd4747;\r\n}\r\n.dshpp-page .dshpp-btn-primary {\r\n  background: var(--dshpp-solid);\r\n  border-color: var(--dshpp-solid);\r\n  color: #fff;\r\n  font-weight: 600;\r\n}\r\n.dshpp-page .dshpp-btn-primary:hover:not(:disabled) {\r\n  background: var(--dshpp-solid-hover);\r\n  border-color: var(--dshpp-solid-hover);\r\n}\r\n.dshpp-page .dshpp-btn-solid-danger {\r\n  background: var(--dshpp-solid-danger);\r\n  border-color: var(--dshpp-solid-danger);\r\n  color: #fff;\r\n}\r\n.dshpp-page .dshpp-btn-solid-danger:hover:not(:disabled) {\r\n  background: var(--dshpp-solid-danger-hover);\r\n  border-color: var(--dshpp-solid-danger-hover);\r\n}\r\n.dshpp-page .dshpp-btn-danger {\r\n  color: var(--dshpp-bad);\r\n  border-color: color-mix(in srgb, var(--dshpp-bad) 40%, transparent);\r\n}\r\n.dshpp-page .dshpp-btn-tiny {\r\n  padding: 3px 8px;\r\n  font-size: 0.82em;\r\n}\r\n\r\n.dshpp-page .dshpp-pill {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  padding: 1px 8px;\r\n  border-radius: 999px;\r\n  font-size: 0.8em;\r\n  border: 1px solid var(--dshpp-line);\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-page .dshpp-pill.is-ok {\r\n  color: var(--dshpp-ok);\r\n  border-color: color-mix(in srgb, var(--dshpp-ok) 35%, transparent);\r\n}\r\n.dshpp-page .dshpp-pill.is-wait {\r\n  color: var(--dshpp-warn);\r\n  border-color: color-mix(in srgb, var(--dshpp-warn) 35%, transparent);\r\n}\r\n.dshpp-page .dshpp-pill.is-bad {\r\n  color: var(--dshpp-bad);\r\n  border-color: color-mix(in srgb, var(--dshpp-bad) 40%, transparent);\r\n}\r\n\r\n.dshpp-page .dshpp-table {\r\n  width: 100%;\r\n  border-collapse: collapse;\r\n  font-size: 0.86em;\r\n}\r\n.dshpp-page .dshpp-table th,\r\n.dshpp-page .dshpp-table td {\r\n  text-align: left;\r\n  padding: 7px 10px;\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n  vertical-align: top;\r\n  overflow-wrap: anywhere;\r\n}\r\n.dshpp-page .dshpp-table th {\r\n  color: var(--dshpp-mute);\r\n  font-weight: 500;\r\n  font-size: 0.95em;\r\n}\r\n.dshpp-page .dshpp-group-h {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 10px;\r\n  width: 100%;\r\n  border: 0;\r\n  background: transparent;\r\n  color: inherit;\r\n  font: inherit;\r\n  padding: 8px 0;\r\n  cursor: pointer;\r\n}\r\n.dshpp-page .dshpp-count {\r\n  color: var(--dshpp-mute);\r\n  font-size: 0.85em;\r\n}\r\n\r\n/* Drill console fills the remaining height. */\r\n.dshpp-page-drill {\r\n  min-height: 60vh;\r\n}\r\n.dshpp-page-drill .rt-dock.rt-embedded {\r\n  width: 100%;\r\n  min-width: 0;\r\n}\r\n\r\n.dshpp-page-foot {\r\n  margin-top: 28px;\r\n  padding-top: 14px;\r\n  border-top: 1px solid var(--dshpp-line);\r\n  font-size: 0.8em;\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n/* Help buttons follow labels. */\r\n.dshpp-help {\r\n  position: relative;\r\n  display: inline-flex;\r\n  align-items: center;\r\n}\r\n.dshpp-help-btn {\r\n  appearance: none;\r\n  border: 0;\r\n  background: transparent;\r\n  color: var(--dshpp-mute);\r\n  font: inherit;\r\n  font-size: 0.85em;\r\n  line-height: 1;\r\n  width: 16px;\r\n  height: 16px;\r\n  border-radius: 50%;\r\n  border: 1px solid var(--dshpp-line);\r\n  cursor: help;\r\n  display: inline-flex;\r\n  align-items: center;\r\n  justify-content: center;\r\n  padding: 0;\r\n}\r\n.dshpp-help-btn:hover,\r\n.dshpp-help-btn[aria-expanded="true"] {\r\n  color: var(--dshpp-fg);\r\n  border-color: var(--dshpp-line-strong);\r\n  background: var(--dshpp-bg-2);\r\n}\r\n.dshpp-tip {\r\n  position: absolute;\r\n  left: 0;\r\n  top: calc(100% + 6px);\r\n  z-index: 2147483000;\r\n  width: max-content;\r\n  max-width: min(340px, 70vw);\r\n  padding: 9px 11px;\r\n  border-radius: 8px;\r\n  border: 1px solid var(--dshpp-line);\r\n  background: var(--dsw-alias-bg-overlay, canvas);\r\n  color: var(--dshpp-fg);\r\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);\r\n  font-size: 0.82em;\r\n  line-height: 1.6;\r\n  white-space: normal;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 4px;\r\n}\r\n.dshpp-tip b {\r\n  font-weight: 600;\r\n}\r\n\r\n.dshpp-page .dshpp-warn {\r\n  margin: 10px 0 0;\r\n  padding: 8px 12px;\r\n  border-radius: 8px;\r\n  border: 1px solid color-mix(in srgb, var(--dshpp-warn) 45%, transparent);\r\n  color: var(--dshpp-warn);\r\n  background: color-mix(in srgb, var(--dshpp-warn) 10%, transparent);\r\n  font-size: 0.86em;\r\n}\r\n\r\n/* Keep Apply in the sticky action bar at the top of the content. */\r\n.dshpp-page .dshpp-actions {\r\n  position: sticky;\r\n  top: 0;\r\n  z-index: 5;\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 8px;\r\n  padding: 10px 0 12px;\r\n  margin: -4px 0 6px;\r\n  background: linear-gradient(\r\n    var(--dsw-alias-bg-base, canvas) 78%,\r\n    transparent\r\n  );\r\n  backdrop-filter: blur(2px);\r\n  border-bottom: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-page .dshpp-actions .dshpp-pill {\r\n  margin-left: auto;\r\n}\r\n\r\n/* Compact three-column metrics. */\r\n.dshpp-page .dshpp-metrics {\r\n  display: grid;\r\n  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));\r\n  gap: 10px;\r\n  margin: 4px 0 2px;\r\n}\r\n.dshpp-page .dshpp-metric {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 10px;\r\n  padding: 10px 12px;\r\n  background: var(--dshpp-bg-2);\r\n  min-width: 0;\r\n}\r\n.dshpp-page .dshpp-metric b {\r\n  display: block;\r\n  font-size: 1.05em;\r\n  font-weight: 600;\r\n  margin-bottom: 2px;\r\n  overflow-wrap: anywhere;\r\n}\r\n.dshpp-page .dshpp-metric span {\r\n  color: var(--dshpp-mute);\r\n  font-size: 0.82em;\r\n}\r\n\r\n/* Collapsible patch details, maintenance, and self-check. */\r\n.dshpp-page .dshpp-fold,\r\n.dshpp-page .dshpp-fold-inline {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 10px;\r\n  background: var(--dshpp-bg);\r\n  padding: 0 12px;\r\n}\r\n.dshpp-page .dshpp-fold > summary,\r\n.dshpp-page .dshpp-fold-inline > summary {\r\n  cursor: pointer;\r\n  padding: 10px 0;\r\n  font-size: 0.92em;\r\n  color: var(--dshpp-fg);\r\n  list-style: none;\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n.dshpp-page .dshpp-fold > summary::-webkit-details-marker,\r\n.dshpp-page .dshpp-fold-inline > summary::-webkit-details-marker {\r\n  display: none;\r\n}\r\n.dshpp-page .dshpp-fold > summary::before,\r\n.dshpp-page .dshpp-fold-inline > summary::before {\r\n  content: "\u25B8";\r\n  color: var(--dshpp-mute);\r\n  font-size: 0.9em;\r\n  transition: transform 0.12s ease;\r\n}\r\n.dshpp-page .dshpp-fold[open] > summary::before,\r\n.dshpp-page .dshpp-fold-inline[open] > summary::before {\r\n  transform: rotate(90deg);\r\n}\r\n.dshpp-page .dshpp-fold > summary b,\r\n.dshpp-page .dshpp-fold-inline > summary b {\r\n  color: var(--dshpp-mute);\r\n  font-weight: 500;\r\n  margin-left: auto;\r\n}\r\n\r\n/* Self-check and boost status rows. */\r\n.dshpp-page .dshpp-line {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 10px;\r\n  flex-wrap: wrap;\r\n  padding: 6px 0;\r\n}\r\n.dshpp-page .dshpp-line + .dshpp-line {\r\n  border-top: 1px solid var(--dshpp-line);\r\n}\r\n.dshpp-page .dshpp-line-main {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  font-size: 0.92em;\r\n  min-width: 0;\r\n}\r\n.dshpp-page .dshpp-line-main b {\r\n  font-weight: 600;\r\n}\r\n.dshpp-page .dshpp-fold-inline {\r\n  border: 0;\r\n  padding: 0;\r\n  background: transparent;\r\n}\r\n.dshpp-page .dshpp-fold-inline > summary {\r\n  padding: 2px 0;\r\n  color: var(--dshpp-mute);\r\n  font-size: 0.86em;\r\n}\r\n.dshpp-page .dshpp-fold-inline[open] {\r\n  flex-basis: 100%;\r\n}\r\n\r\n/* Layer self-checks use a responsive multicolumn grid. */\r\n.dshpp-page .dshpp-checks {\r\n  display: grid;\r\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\r\n  gap: 2px 14px;\r\n  padding: 6px 0 10px;\r\n}\r\n.dshpp-page .dshpp-check {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  font-size: 0.84em;\r\n  min-width: 0;\r\n  padding: 2px 0;\r\n}\r\n.dshpp-page .dshpp-check.is-bad {\r\n  color: var(--dshpp-bad);\r\n}\r\n.dshpp-page .dshpp-check-name {\r\n  overflow: hidden;\r\n  text-overflow: ellipsis;\r\n  white-space: nowrap;\r\n  min-width: 0;\r\n}\r\n.dshpp-page .dshpp-check-val {\r\n  margin-left: auto;\r\n  color: var(--dshpp-mute);\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n/* Status overview makes the current state and next action visible. */\r\n.dshpp-page .dshpp-hero {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: var(--dsw-radius-md, 10px);\r\n  background: var(--dshpp-bg);\r\n  padding: 16px 18px;\r\n  display: flex;\r\n  flex-direction: column;\r\n  gap: 10px;\r\n}\r\n.dshpp-page .dshpp-hero-state {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  font-size: 1.02em;\r\n  min-width: 0;\r\n}\r\n.dshpp-page .dshpp-hero-state b {\r\n  font-weight: 600;\r\n}\r\n.dshpp-page .dshpp-hero-sub {\r\n  margin-left: auto;\r\n  color: var(--dshpp-mute);\r\n  font-size: 0.82em;\r\n}\r\n.dshpp-page .dshpp-hero-actions {\r\n  display: flex;\r\n  flex-wrap: wrap;\r\n  align-items: center;\r\n  gap: 8px;\r\n}\r\n.dshpp-page .dshpp-btn-lead {\r\n  padding: 9px 20px;\r\n  font-size: 0.98em;\r\n  font-weight: 600;\r\n  border-radius: 10px;\r\n}\r\n.dshpp-page .dshpp-hero-hint {\r\n  margin: 0;\r\n  color: var(--dshpp-mute);\r\n  font-size: 0.84em;\r\n  line-height: 1.6;\r\n}\r\n.dshpp-check.is-warn {\r\n  color: var(--dshpp-warn);\r\n}\r\n\r\n.dshpp-page .dshpp-probe-msg {\r\n  margin: 6px 0 0;\r\n  padding: 8px 10px;\r\n  border-radius: 8px;\r\n  border: 1px dashed var(--dshpp-line);\r\n  background: var(--dshpp-bg-2);\r\n  font-size: 0.82em;\r\n  white-space: pre-wrap;\r\n  overflow-wrap: anywhere;\r\n}\r\n\r\n@container purge-page (max-width: 520px) {\r\n  .dshpp-page-head {\r\n    gap: 8px;\r\n  }\r\n  .dshpp-page-tabs {\r\n    gap: 0;\r\n  }\r\n  .dshpp-page-tabs button {\r\n    flex: 1 0 auto;\r\n    padding-inline: 6px;\r\n    min-height: 44px;\r\n  }\r\n  .dshpp-page-body {\r\n    padding-top: 12px;\r\n  }\r\n  .dshpp-sec {\r\n    gap: 12px;\r\n  }\r\n  .dshpp-page :is(.dshpp-card, section.dshpp-panel, .dshpp-hero) {\r\n    padding: 12px;\r\n  }\r\n  .dshpp-strip {\r\n    column-gap: 12px;\r\n  }\r\n  .dshpp-page :is(.dshpp-row, .dshpp-sub, .dshpp-hero-state) {\r\n    flex-wrap: wrap;\r\n  }\r\n  .dshpp-page :is(input, select, textarea) {\r\n    max-width: 100%;\r\n    min-width: 0;\r\n  }\r\n  .dshpp-page .dshpp-table {\r\n    table-layout: fixed;\r\n    overflow-wrap: anywhere;\r\n  }\r\n}\r\n\r\n/* The detail route owns scrolling; the sidebar owns its own viewport. */\r\n.dshpp-detail-settings .dshpp-page {\r\n  height: auto;\r\n  overflow: visible;\r\n  padding-inline: 0;\r\n}\r\n\r\n/* Status layout (1.7.18): health, group switches, filters, and write flow. */\r\n\r\n.dshpp-scan {\r\n  border: 0;\r\n  background: transparent;\r\n  color: var(--dshpp-mute);\r\n  font: inherit;\r\n  font-size: 12px;\r\n  padding: 6px 2px;\r\n  cursor: pointer;\r\n  text-decoration: underline;\r\n  text-underline-offset: 2px;\r\n  white-space: nowrap;\r\n}\r\n.dshpp-scan:hover {\r\n  color: var(--dshpp-fg);\r\n}\r\n.dshpp-scan:disabled {\r\n  cursor: default;\r\n  opacity: 0.55;\r\n}\r\n\r\n.dshpp-health {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 12px;\r\n  padding: 14px 16px;\r\n  margin-top: 12px;\r\n  background: var(--dshpp-bg);\r\n  min-width: 0;\r\n}\r\n.dshpp-health-top {\r\n  display: flex;\r\n  align-items: baseline;\r\n  gap: 10px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-health-big {\r\n  font-size: 26px;\r\n  font-weight: 660;\r\n  letter-spacing: -0.3px;\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n.dshpp-health-big small {\r\n  font-size: 13px;\r\n  font-weight: 500;\r\n  color: var(--dshpp-mute);\r\n  letter-spacing: 0;\r\n}\r\n.dshpp-health-verdict {\r\n  font-size: 12.5px;\r\n  color: var(--dshpp-mute);\r\n  min-width: 0;\r\n}\r\n.dshpp-bar {\r\n  display: flex;\r\n  height: 7px;\r\n  border-radius: 99px;\r\n  overflow: hidden;\r\n  background: var(--dshpp-bg-2);\r\n  margin: 10px 0 12px;\r\n}\r\n.dshpp-bar i {\r\n  display: block;\r\n  height: 100%;\r\n}\r\n.dshpp-bar .is-ok {\r\n  background: var(--dshpp-ok);\r\n}\r\n.dshpp-bar .is-wait {\r\n  background: var(--dshpp-warn);\r\n}\r\n.dshpp-bar .is-off {\r\n  background: var(--dshpp-mute);\r\n  opacity: 0.45;\r\n}\r\n.dshpp-tiles {\r\n  display: grid;\r\n  grid-template-columns: repeat(4, minmax(0, 1fr));\r\n  gap: 10px;\r\n}\r\n.dshpp-tile {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 10px;\r\n  padding: 8px 11px;\r\n  background: var(--dshpp-bg-2);\r\n  min-width: 0;\r\n}\r\n.dshpp-tile.is-na {\r\n  border-style: dashed;\r\n}\r\n.dshpp-tile-k {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 4px;\r\n  font-size: 11.5px;\r\n  color: var(--dshpp-mute);\r\n  white-space: nowrap;\r\n}\r\n.dshpp-tile-v {\r\n  margin-top: 2px;\r\n  font-size: 18px;\r\n  font-weight: 640;\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n.dshpp-tile.is-ok .dshpp-tile-v {\r\n  color: var(--dshpp-ok);\r\n}\r\n.dshpp-tile.is-wait .dshpp-tile-v {\r\n  color: var(--dshpp-warn);\r\n}\r\n.dshpp-tile.is-off .dshpp-tile-v,\r\n.dshpp-tile.is-na .dshpp-tile-v {\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n.dshpp-switches {\r\n  display: grid;\r\n  grid-template-columns: repeat(2, minmax(0, 1fr));\r\n  gap: 12px;\r\n  margin-top: 12px;\r\n}\r\n.dshpp-sw {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 12px;\r\n  padding: 12px 14px;\r\n  background: var(--dshpp-bg);\r\n  min-width: 0;\r\n}\r\n.dshpp-sw.is-on {\r\n  box-shadow: inset 3px 0 0 var(--dshpp-accent);\r\n}\r\n.dshpp-sw-h {\r\n  display: flex;\r\n  align-items: center;\r\n  justify-content: space-between;\r\n  gap: 10px;\r\n}\r\n.dshpp-sw-t {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  font-weight: 600;\r\n  min-width: 0;\r\n}\r\n.dshpp-sw-d {\r\n  margin: 6px 0 8px;\r\n  font-size: 12.5px;\r\n  line-height: 1.5;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-sw-f {\r\n  display: flex;\r\n  gap: 6px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-chip {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 99px;\r\n  padding: 2px 8px;\r\n  font-size: 11.5px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-chip.is-on {\r\n  color: var(--dshpp-accent);\r\n  border-color: currentColor;\r\n}\r\n.dshpp-track {\r\n  position: relative;\r\n  width: 42px;\r\n  height: 24px;\r\n  flex: none;\r\n  padding: 0;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 99px;\r\n  background: var(--dshpp-bg-2);\r\n  cursor: pointer;\r\n}\r\n.dshpp-track.is-on {\r\n  background: var(--dshpp-accent);\r\n  border-color: var(--dshpp-accent);\r\n}\r\n.dshpp-track:disabled {\r\n  cursor: default;\r\n  opacity: 0.55;\r\n}\r\n.dshpp-knob {\r\n  position: absolute;\r\n  top: 2px;\r\n  left: 2px;\r\n  width: 18px;\r\n  height: 18px;\r\n  border-radius: 99px;\r\n  background: #fff;\r\n  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);\r\n  transition: transform 0.15s ease;\r\n}\r\n.dshpp-track.is-on .dshpp-knob {\r\n  transform: translateX(18px);\r\n}\r\n.dshpp-sw-note {\r\n  margin: 6px 0 0;\r\n  font-size: 12.5px;\r\n  color: var(--dshpp-ok);\r\n}\r\n.dshpp-sw-note.is-bad {\r\n  color: var(--dshpp-bad);\r\n}\r\n.dshpp-sw-hint {\r\n  margin: 6px 2px 0;\r\n  font-size: 11.5px;\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n.dshpp-filter {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  flex-wrap: wrap;\r\n  margin: 10px 0 8px;\r\n}\r\n.dshpp-fbtn {\r\n  border: 1px solid transparent;\r\n  background: transparent;\r\n  color: var(--dshpp-mute);\r\n  border-radius: 99px;\r\n  padding: 4px 10px;\r\n  min-height: 32px;\r\n  font: inherit;\r\n  font-size: 12.5px;\r\n  cursor: pointer;\r\n}\r\n.dshpp-fbtn:hover {\r\n  background: var(--dshpp-bg-2);\r\n}\r\n.dshpp-fbtn.is-cur {\r\n  color: var(--dshpp-accent);\r\n  border-color: currentColor;\r\n  background: color-mix(in srgb, var(--dshpp-accent) 10%, transparent);\r\n}\r\n.dshpp-fbtn-n {\r\n  margin-left: 5px;\r\n  opacity: 0.7;\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n.dshpp-filter-hint {\r\n  margin-left: auto;\r\n  font-size: 11.5px;\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n.dshpp-caret {\r\n  width: 12px;\r\n  flex: none;\r\n  color: var(--dshpp-mute);\r\n  font-size: 10px;\r\n}\r\n.dshpp-group-chips {\r\n  margin-left: auto;\r\n  display: flex;\r\n  gap: 4px;\r\n  flex-wrap: wrap;\r\n  justify-content: flex-end;\r\n}\r\n.dshpp-group-notes {\r\n  margin: 0;\r\n  padding: 0 12px 8px 30px;\r\n  font-size: 11.5px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-row-note {\r\n  display: block;\r\n  margin-top: 1px;\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n.dshpp-flow {\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 12px;\r\n  padding: 13px 15px;\r\n  margin-top: 12px;\r\n  background: var(--dshpp-bg);\r\n}\r\n.dshpp-flow h4 {\r\n  margin: 0 0 10px;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n}\r\n.dshpp-steps {\r\n  display: grid;\r\n  grid-template-columns: repeat(3, minmax(0, 1fr));\r\n  gap: 12px;\r\n}\r\n.dshpp-step {\r\n  display: flex;\r\n  gap: 9px;\r\n  min-width: 0;\r\n}\r\n.dshpp-step-no {\r\n  width: 20px;\r\n  height: 20px;\r\n  flex: none;\r\n  border: 1px solid var(--dshpp-line);\r\n  border-radius: 99px;\r\n  display: grid;\r\n  place-items: center;\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-step b {\r\n  display: block;\r\n  font-size: 12.5px;\r\n  font-weight: 600;\r\n}\r\n.dshpp-step span {\r\n  font-size: 11.5px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-flow-foot {\r\n  margin: 10px 0 0;\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n/* Narrow screens: one-column groups, 2x2 tiles, larger switch targets. */\r\n@container purge-page (max-width: 640px) {\r\n  .dshpp-health-big {\r\n    font-size: 22px;\r\n  }\r\n  .dshpp-tiles {\r\n    grid-template-columns: repeat(2, minmax(0, 1fr));\r\n  }\r\n  .dshpp-switches {\r\n    grid-template-columns: 1fr;\r\n  }\r\n  .dshpp-steps {\r\n    grid-template-columns: 1fr;\r\n  }\r\n  .dshpp-filter-hint {\r\n    display: none;\r\n  }\r\n  .dshpp-track {\r\n    width: 46px;\r\n    height: 26px;\r\n  }\r\n  .dshpp-knob {\r\n    width: 20px;\r\n    height: 20px;\r\n  }\r\n  .dshpp-track.is-on .dshpp-knob {\r\n    transform: translateX(20px);\r\n  }\r\n  .dshpp-group-notes {\r\n    padding-left: 12px;\r\n  }\r\n  /* Wrap group headings so all status pills remain visible. */\r\n  .dshpp-group-h {\r\n    flex-wrap: wrap;\r\n    row-gap: 4px;\r\n  }\r\n  .dshpp-group-chips {\r\n    flex: 1 0 100%;\r\n    margin-left: 0;\r\n    justify-content: flex-start;\r\n  }\r\n  .dshpp-group-h {\r\n    justify-content: flex-start;\r\n    column-gap: 8px;\r\n  }\r\n  .dshpp-group-h .dshpp-count {\r\n    margin-left: auto;\r\n  }\r\n  /* Fixed columns and wrapping prevent overflow at 360px. */\r\n  .dshpp-page .dshpp-table {\r\n    width: 100%;\r\n    table-layout: fixed;\r\n  }\r\n  .dshpp-page .dshpp-table :is(th, td):first-child {\r\n    width: 44px;\r\n  }\r\n  .dshpp-page .dshpp-table :is(th, td):last-child {\r\n    width: 88px;\r\n  }\r\n  .dshpp-page .dshpp-table .dshpp-pill {\r\n    white-space: normal;\r\n    text-align: center;\r\n  }\r\n  .dshpp-sw-d,\r\n  .dshpp-sw-hint,\r\n  .dshpp-group-notes {\r\n    overflow-wrap: anywhere;\r\n  }\r\n}\r\n\r\n@container purge-page (max-width: 400px) {\r\n  .dshpp-tile-k {\r\n    white-space: normal;\r\n  }\r\n  .dshpp-fbtn {\r\n    padding: 4px 8px;\r\n    font-size: 12px;\r\n  }\r\n  .dshpp-sw {\r\n    padding: 11px 12px;\r\n  }\r\n  .dshpp-health {\r\n    padding: 12px;\r\n  }\r\n}\r\n\r\n/* Patch details remain visible rather than collapsing. */\r\n.dshpp-fold.is-open {\r\n  display: block;\r\n}\r\n.dshpp-fold-t {\r\n  display: flex;\r\n  align-items: baseline;\r\n  gap: 8px;\r\n  margin: 18px 0 6px;\r\n  font-size: 13px;\r\n  font-weight: 600;\r\n}\r\n.dshpp-fold-n {\r\n  color: var(--dshpp-mute);\r\n  font-weight: 500;\r\n  font-size: 12px;\r\n  font-variant-numeric: tabular-nums;\r\n}\r\n\r\n/* Visual alignment (1.7.18): consistent typography, spacing, radii, and colors.\r\n   Scope blue/green overrides to this page to preserve other host panels. */\r\n.dshpp-page {\r\n  --pg-accent: #2563eb;\r\n  --pg-ok: #15803d;\r\n  --pg-warn: #b45309;\r\n}\r\n\r\n/* Heading row: page name, actions, and scan time. */\r\n.dshpp-status-head {\r\n  display: flex;\r\n  align-items: flex-end;\r\n  justify-content: space-between;\r\n  gap: 14px;\r\n  flex-wrap: wrap;\r\n  margin: 2px 0 16px;\r\n}\r\n.dshpp-status-title {\r\n  margin: 0;\r\n  font-size: 19px;\r\n  font-weight: 650;\r\n  letter-spacing: -0.2px;\r\n}\r\n.dshpp-status-ops {\r\n  display: flex;\r\n  align-items: center;\r\n  gap: 8px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-status-note {\r\n  margin: -8px 0 12px;\r\n  font-size: 12.5px;\r\n  color: var(--dshpp-mute);\r\n}\r\n\r\n/* Buttons: 9px radius, 13px text, inverted primary action. */\r\n.dshpp-page .dshpp-btn {\r\n  font-size: 13px;\r\n  padding: 7px 13px;\r\n  border-radius: 9px;\r\n  line-height: 1.2;\r\n}\r\n.dshpp-page .dshpp-btn.dshpp-btn-apply {\r\n  background: var(--dshpp-fg);\r\n  border-color: var(--dshpp-fg);\r\n  color: var(--dshpp-bg, #fff);\r\n  font-weight: 560;\r\n}\r\n.dshpp-page .dshpp-btn.dshpp-btn-apply:not(:disabled):hover {\r\n  opacity: 0.88;\r\n}\r\n\r\n/* Health summary and four tiles. */\r\n.dshpp-health {\r\n  padding: 18px 20px;\r\n  border-radius: 12px;\r\n}\r\n.dshpp-health-big {\r\n  font-size: 30px;\r\n  font-weight: 680;\r\n}\r\n.dshpp-health-big small {\r\n  font-size: 15px;\r\n}\r\n.dshpp-tile {\r\n  padding: 10px 12px;\r\n}\r\n.dshpp-tile-k {\r\n  font-size: 11.5px;\r\n}\r\n.dshpp-tile-v {\r\n  font-size: 19px;\r\n  font-weight: 640;\r\n}\r\n\r\n/* Blue switches. */\r\n.dshpp-sw {\r\n  padding: 15px 17px;\r\n  border-radius: 12px;\r\n}\r\n.dshpp-sw-t {\r\n  font-size: 14px;\r\n}\r\n.dshpp-sw-d {\r\n  font-size: 12.5px;\r\n}\r\n.dshpp-chip {\r\n  font-size: 11.5px;\r\n  padding: 2px 8px;\r\n}\r\n.dshpp-track.is-on {\r\n  background: var(--pg-accent);\r\n  border-color: var(--pg-accent);\r\n}\r\n\r\n/* Selected filters use a blue outline and light background. */\r\n.dshpp-fbtn {\r\n  font-size: 12.5px;\r\n}\r\n.dshpp-fbtn.is-cur {\r\n  color: var(--pg-accent);\r\n  border-color: var(--pg-accent);\r\n  background: color-mix(in srgb, var(--pg-accent) 10%, transparent);\r\n}\r\n\r\n/* Detail table: 13px body text and 11.5px status pills. */\r\n.dshpp-page .dshpp-table {\r\n  font-size: 13px;\r\n}\r\n.dshpp-page .dshpp-table th {\r\n  font-size: 11.5px;\r\n  letter-spacing: 0.03em;\r\n  padding: 7px 15px;\r\n}\r\n.dshpp-page .dshpp-table td {\r\n  padding: 7px 15px;\r\n}\r\n.dshpp-page .dshpp-pill {\r\n  font-size: 11.5px;\r\n  padding: 2px 8px;\r\n}\r\n.dshpp-caret {\r\n  font-size: 10px;\r\n}\r\n.dshpp-group-notes {\r\n  font-size: 11.5px;\r\n}\r\n\r\n/* Write flow. */\r\n.dshpp-flow {\r\n  padding: 16px 18px;\r\n  border-radius: 12px;\r\n}\r\n.dshpp-flow h4 {\r\n  font-size: 13.5px;\r\n}\r\n.dshpp-step b {\r\n  font-size: 13px;\r\n}\r\n.dshpp-step span {\r\n  font-size: 12.5px;\r\n}\r\n\r\n/* Version badge in the maintenance heading. */\r\n.dshpp-maint-head {\r\n  display: flex;\r\n  align-items: baseline;\r\n  gap: 10px;\r\n  flex-wrap: wrap;\r\n}\r\n.dshpp-maint-head h3 {\r\n  margin: 0;\r\n}\r\n.dshpp-maint-ver {\r\n  display: inline-flex;\r\n  align-items: center;\r\n  gap: 6px;\r\n  font-size: 12px;\r\n  color: var(--dshpp-mute);\r\n}\r\n.dshpp-maint-ver b {\r\n  font-weight: 600;\r\n  color: var(--pg-ok);\r\n  border: 1px solid color-mix(in srgb, var(--pg-ok) 40%, transparent);\r\n  border-radius: 99px;\r\n  padding: 0 6px;\r\n  font-size: 11px;\r\n}\r\n\r\n/* Secondary identifier line in the detail table. */\r\n.dshpp-row-en {\r\n  display: block;\r\n  margin-top: 1px;\r\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\r\n  font-size: 11px;\r\n  color: var(--dshpp-mute);\r\n  letter-spacing: 0.01em;\r\n}\r\n';

// src/shared/runtime-error.js
function runtimeRepairDetails(report) {
  if (!report || report.ok !== false) return [];
  const text = (value) => typeof value === "string" ? value.replace(/[\r\n\t]+/g, " ").slice(0, 1200) : "";
  const details = [];
  const add = (label, value) => {
    const safe = text(value);
    if (safe) details.push(`${label}: ${safe}`);
  };
  add("runtime", report.reason);
  add("runtime error", report.error);
  add("runtime code", report.code);
  const link = report.symlink;
  if (link?.ok === false) {
    add("runtime link", link.reason);
    add("link error", link.error);
    add("link code", link.code);
    add("backup", link.backup);
    add("retained candidate", link.failedLink);
    if (link.rollback?.ok === false) {
      details.push("rollback: failed");
      add("rollback error", link.rollback.error);
    } else if (link.rollback?.ok === true) {
      details.push("rollback: original link restored");
    }
  }
  for (const shim of (Array.isArray(report.shims) ? report.shims : []).slice(
    0,
    8
  )) {
    if (!["read_error", "write_error"].includes(shim?.status)) continue;
    add("launcher", shim.path);
    add("launcher status", shim.status);
    add("launcher error", shim.error);
  }
  return details;
}

// src/api/client.js
function clientGuessSurface() {
  try {
    if (typeof navigator !== "undefined" && /electron/i.test(navigator.userAgent || ""))
      return "desktop";
    if (typeof location !== "undefined") {
      const port = String(location.port || "");
      if (port === "43120") return "desktop";
      const host3 = String(location.hostname || "");
      if (host3 && host3 !== "127.0.0.1" && host3 !== "localhost" && /dsh desktop/i.test(String(location.href || "")))
        return "desktop";
    }
  } catch {
  }
  return "";
}
function hostSurfaceOf(s) {
  return s && s.surface || clientGuessSurface() || "web";
}
function hostText(t, key, surface) {
  if (surface && surface !== "web") {
    const specific = key + "." + surface;
    const hit = t(specific);
    if (hit && hit !== specific) return hit;
  }
  return t(key);
}
function apiUrl(p, context = {}) {
  try {
    const loc = context.href || window.location.href || window.location.origin + "/";
    const page = new URL(loc);
    const module2 = new URL(
      context.moduleUrl || typeof __PURGE_MODULE_URL__ !== "undefined" && __PURGE_MODULE_URL__ || page.href,
      page
    );
    let base;
    const marker = module2.pathname.indexOf("/plugins/");
    if (module2.origin === page.origin && marker >= 0) {
      base = new URL(module2.pathname.slice(0, marker + 1), page);
    } else {
      const declared = context.baseURI || typeof document !== "undefined" && document.baseURI;
      const candidate = declared && new URL(declared, page);
      base = candidate && candidate.origin === page.origin ? candidate : page;
      base = new URL(base.href);
      if (!base.pathname.endsWith("/")) base.pathname += "/";
    }
    base.search = "";
    base.hash = "";
    if (typeof p !== "string" || !p.startsWith("/") || p.startsWith("//"))
      return p;
    return new URL(p.slice(1), base).toString();
  } catch {
    return p;
  }
}
function apiTimeoutMs(p, init) {
  const path = String(p || "");
  const method = String(init && init.method || "GET").toUpperCase();
  if (path.indexOf("/dsh-purge/community") !== -1)
    return method === "POST" ? 6e5 : 2e4;
  if (path.indexOf("/dsh-purge/update") !== -1)
    return method === "POST" ? 18e4 : 45e3;
  if (path.indexOf("/dsh-purge/uninstall") !== -1) return 9e4;
  if (path.indexOf("/dsh-purge/skill") !== -1)
    return method === "POST" ? 12e4 : 2e4;
  if (path.indexOf("/dsh-purge/status") !== -1) return 6e4;
  if (path.indexOf("/dsh-purge/apply") !== -1) return 24e4;
  if (path.indexOf("/dsh-purge/revert") !== -1) return 12e4;
  if (path.indexOf("/dsh-purge/restart") !== -1) return 6e4;
  return 2e4;
}
function isAbortError(e) {
  const msg = String(e && e.message || e || "");
  return e && e.name === "AbortError" || /aborted|abort/i.test(msg);
}
function apiError(message, status) {
  return Object.assign(new Error(message), { status });
}
var pendingStatus = null;
function apiJson(p, init) {
  const method = String(init?.method || "GET").toUpperCase();
  if (method !== "GET") pendingStatus = null;
  if (p !== "/dsh-purge/status" || init) return requestJson(p, init);
  if (pendingStatus) return pendingStatus;
  const request = requestJson(p, init);
  pendingStatus = request;
  const clear = () => {
    if (pendingStatus === request) pendingStatus = null;
  };
  request.then(clear, clear);
  return request;
}
function unavailableStatus(error) {
  return {
    ok: false,
    error: String(error?.message || error || "bad response")
  };
}
async function requestJson(p, init) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), apiTimeoutMs(p, init));
  try {
    const r = await fetch(
      apiUrl(p),
      Object.assign(
        { cache: "no-store", credentials: "same-origin", signal: ctrl.signal },
        init || {}
      )
    );
    const text = await r.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw apiError(r.status + " non-json: " + text.slice(0, 120), r.status);
    }
    if (!r.ok) {
      const runtimeDetails = runtimeRepairDetails(data?.cli_repair);
      const message = data && (data.error || data.message) || r.status + " " + r.statusText;
      throw Object.assign(
        apiError([message, ...runtimeDetails].join("\n"), r.status),
        { runtimeDetails }
      );
    }
    return data;
  } catch (e) {
    if (isAbortError(e)) throw new Error("timeout");
    const msg = String(e && e.message || e || "");
    if (!e?.status && /failed to fetch|networkerror|load failed/i.test(msg)) {
      throw new Error(
        "Cannot reach the API. Check that DSH is running, then press Ctrl+F5"
      );
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
function promptBoxEmpty(text) {
  return !String(text || "").trim();
}
function responseNeedsPrompt(d) {
  return Boolean(d && (d.needPrompt || d.injectSource === "none"));
}
function warnNeedPrompt(d, tr) {
  if (!responseNeedsPrompt(d)) return false;
  window.alert(tr("need.prompt"));
  return true;
}
async function bothInjectEmpty(overrideText, defaultText) {
  if (!promptBoxEmpty(overrideText)) return false;
  if (!promptBoxEmpty(defaultText)) return false;
  return true;
}
function rulesApi(op, extra) {
  return apiJson("/dsh-purge/rules", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({ op }, extra || {}))
  });
}
function skillsRouteMissing(e) {
  return e?.status === 404 || e?.status === 405;
}
function skillsApi(op, extra) {
  const init = {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(Object.assign({ op }, extra || {}))
  };
  return apiJson("/dsh-purge/skills", init).catch((e) => {
    if (!skillsRouteMissing(e)) throw e;
    return apiJson("/dsh-purge/skill", init);
  });
}

// src/vendor/drill.js
var import_react2 = __toESM(require("react"), 1);
var __dshPurgeDrill = (() => {
  var module2 = { exports: {} };
  var exports = module2.exports;
  var module2 = { exports: {} };
  var exports = module2.exports;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  const h2 = import_react2.default.createElement;
  const CSS = `
.rt-dock{position:fixed;top:12px;right:12px;z-index:20;display:flex;flex-direction:column;box-sizing:border-box;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-1,#1c1c1c) 52%,transparent);
  backdrop-filter:blur(20px) saturate(1.3);-webkit-backdrop-filter:blur(20px) saturate(1.3);
  border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,#444) 70%,transparent);
  border-radius:12px;
  box-shadow:0 18px 48px color-mix(in srgb,#000 28%,transparent);pointer-events:auto;color:var(--dsw-alias-label-primary);
  font-size:13px;line-height:1.5}
.rt-dock.rt-embedded{position:relative;inset:auto;width:100%;height:100%;max-width:none;border:0;border-radius:0;box-shadow:none;background:transparent!important;backdrop-filter:none;-webkit-backdrop-filter:none}
.rt-grip,.rt-resize-r,.rt-resize-b,.rt-resize-c{position:absolute;z-index:3;touch-action:none}
.rt-grip{left:-3px;top:0;bottom:0;width:8px;cursor:ew-resize;background:transparent}
.rt-resize-r{right:-3px;top:0;bottom:14px;width:8px;cursor:ew-resize}
.rt-resize-b{left:8px;right:14px;bottom:-3px;height:8px;cursor:ns-resize}
.rt-resize-c{right:0;bottom:0;width:16px;height:16px;cursor:nwse-resize}
.rt-head{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rt-title{font-weight:600;font-size:14px;display:flex;align-items:center;gap:6px;white-space:nowrap}
.rt-dot{width:8px;height:8px;border-radius:50%;background:var(--dsw-alias-brand-primary)}
.rt-spacer{flex:1}
.rt-btn{border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);color:inherit;
  border-radius:6px;padding:3px 9px;font-size:12px;cursor:pointer;font-family:inherit;white-space:nowrap}
.rt-btn:hover{border-color:var(--dsw-alias-border-l2)}
/* brand-primary is near-white in dark mode. Inverted label/background tokens
   maintain contrast in both themes instead of producing white-on-white text. */
.rt-btn-primary{background:var(--dsw-alias-label-primary,#111);border-color:var(--dsw-alias-label-primary,#111);color:var(--dsw-alias-bg-base,#fff)}
.rt-btn-primary:hover{opacity:.9}
.rt-btn:disabled{opacity:.5;cursor:default}
.rt-tabs{display:flex;flex-wrap:wrap;gap:2px;padding:6px 12px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rt-tab{padding:8px 10px 7px;border-radius:0;cursor:pointer;font-size:12.5px;color:var(--dsw-alias-label-secondary);
  display:inline-flex;align-items:center;gap:5px;border-bottom:2px solid transparent;margin-bottom:-1px;background:transparent}
.rt-tab:hover{color:var(--dsw-alias-label-primary)}
.rt-tab.on{color:var(--dsw-alias-label-primary);background:transparent;font-weight:600;border-bottom-color:var(--dsw-alias-brand-primary,#6dbf8c)}
/* Unread dots mark new assets, findings, scores, or steps until the tab opens. */
.rt-tab-dot{width:7px;height:7px;border-radius:50%;background:#ef4444;flex:none;
  box-shadow:0 0 0 2px color-mix(in srgb, #ef4444 22%, transparent)}
.rt-body{flex:1;min-height:0;display:flex;flex-direction:column}
.rt-split{flex:1;min-height:0;display:flex}
.rt-side{width:200px;flex:none;border-right:1px solid var(--dsw-alias-border-l1);overflow:auto;padding:8px}
.rt-main{flex:1;min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}
.rt-seg{padding:7px 8px;border-radius:6px;cursor:pointer;margin-bottom:4px;border:1px solid transparent}
.rt-seg:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-seg.on{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}
.rt-seg-cidr{font-family:ui-monospace,Menlo,monospace;font-size:12.5px}
.rt-seg-meta{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.rt-toolbar{display:flex;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap;align-items:center}
.rt-input{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);color:inherit;
  border-radius:6px;padding:4px 8px;font-size:12px;font-family:inherit;outline:none;min-width:0}
.rt-input:focus{border-color:var(--dsw-alias-brand-primary)}
.rt-input option,.rt-eng-select option{background:var(--dsw-alias-bg-layer-1,#1c1c1c);color:var(--dsw-alias-label-primary,#f2f2f2)}
.rt-eng-select{color:var(--dsw-alias-label-primary,#f2f2f2);background:var(--dsw-alias-bg-layer-2,#2a2a2a)}
.rt-table{flex:1;overflow:auto}
.rt-row{display:grid;grid-template-columns:150px 74px 104px 1.15fr 1fr;gap:8px;padding:6px 10px;
  border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;cursor:pointer;font-size:12.5px}
.rt-row:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-row.head{cursor:default;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-weight:600;position:sticky;top:0;
  background:var(--dsw-alias-bg-layer-1);z-index:1}
.rt-row.head:hover{background:var(--dsw-alias-bg-layer-1)}
.rt-mono{font-family:ui-monospace,Menlo,monospace}
.rt-tag{display:inline-block;padding:0 5px;border-radius:4px;font-size:11px;margin-right:4px;
  border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary);white-space:nowrap}
.rt-tag-passive{color:#8b5cf6;border-color:#8b5cf655;background:#8b5cf61a}
.rt-tag-active{color:#f59e0b;border-color:#f59e0b55;background:#f59e0b1a}
.rt-tag-live{color:#10b981;border-color:#10b98155;background:#10b9811a}
.rt-tag-warn{color:#ef4444;border-color:#ef444455;background:#ef44441a}
/* Show unmet delivery requirements (Behinder/Godzilla shell or suo5 tunnel) above the section. */
.rt-hint{border-radius:6px;padding:7px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.6;
  border:1px dashed #ef444488;background:#ef44440f;color:var(--dsw-alias-label-primary)}
.rt-hint b{color:#ef4444}
.rt-tag-dead{color:var(--dsw-alias-label-secondary)}
.rt-expand{grid-column:1/-1;padding:8px 4px 10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.rt-kv{display:flex;gap:8px;margin-bottom:3px;align-items:baseline}
.rt-kv b{color:var(--dsw-alias-label-primary);font-weight:600;min-width:64px;flex:none}
/* Asset relationships use the domain view and redteam_attack_path instead of the removed graph. */
.rt-pane{flex:1;min-height:0;overflow:auto;padding:12px}
.rt-card{border:1px solid color-mix(in srgb,var(--dsw-alias-border-l1,#444) 75%,transparent);border-radius:8px;padding:10px;margin-bottom:10px;
  background:color-mix(in srgb,var(--dsw-alias-bg-layer-2,#2a2a2a) 48%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
.rt-card h4{margin:0 0 6px;font-size:13px}
.rt-textarea{width:100%;min-height:260px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);
  color:inherit;border-radius:6px;padding:8px;font-size:12.5px;font-family:ui-monospace,Menlo,monospace;
  line-height:1.6;resize:vertical;outline:none;box-sizing:border-box}
.rt-textarea:focus{border-color:var(--dsw-alias-brand-primary)}
.rt-list{width:210px;flex:none;border-right:1px solid var(--dsw-alias-border-l1);overflow:auto;padding:8px}
.rt-item{padding:7px 8px;border-radius:6px;cursor:pointer;margin-bottom:4px;border:1px solid transparent}
.rt-item:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-item.on{background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-brand-primary)}
.rt-item-name{font-weight:600;font-size:12.5px}
.rt-item-desc{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:2px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rt-empty{padding:24px;text-align:center;color:var(--dsw-alias-label-secondary);font-size:12.5px}
.rt-err{color:var(--dsw-alias-state-error-primary);font-size:12px;padding:6px 10px}
.rt-foot{padding:8px 12px;border-top:1px solid var(--dsw-alias-border-l1);font-size:11px;
  color:var(--dsw-alias-label-secondary);display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.rt-icon-btn{display:flex;align-items:center;justify-content:center;gap:6px;width:100%;border:1px solid var(--dsw-alias-border-l1);
  background:transparent;color:inherit;border-radius:6px;padding:6px 8px;cursor:pointer;font-family:inherit;font-size:12.5px}
.rt-icon-btn:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-icon-btn.on{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.rt-hbtn{border:1px solid var(--dsw-alias-border-l1);background:transparent;color:inherit;border-radius:6px;
  padding:2px 8px;font-size:12px;cursor:pointer;font-family:inherit;display:flex;align-items:center;gap:5px}
.rt-hbtn:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-hbtn.on{border-color:var(--dsw-alias-brand-primary);color:var(--dsw-alias-brand-primary)}
.rt-test{display:inline-block;padding:0 5px;border-radius:4px;font-size:11px;white-space:nowrap;
  border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.rt-test-testing{color:#f59e0b;border-color:#f59e0b55;background:#f59e0b1a}
.rt-test-tested{color:#10b981;border-color:#10b98155;background:#10b9811a}
.rt-test-blocked{color:#fff;background:#ef4444;border-color:#ef4444}
.rt-test-abandoned{color:#94a3b8;border-color:#94a3b855;background:#94a3b81a}
.rt-test-no_surface{color:#6366f1;border-color:#6366f155;background:#6366f11a}
.rt-scope-testing{color:#5b21b6;background:#ddd6fe}
.rt-pri{display:inline-block;padding:0 6px;border-radius:4px;font-size:11px;font-weight:600;white-space:nowrap}
.rt-pri-high{color:#fff;background:#ef4444}
.rt-pri-medium{color:#fff;background:#f59e0b}
.rt-pri-low{color:#fff;background:#94a3b8}
.rt-score-row{display:grid;grid-template-columns:16px 62px minmax(0,1fr) 116px 66px;gap:8px;padding:7px 10px;
  border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;font-size:12.5px;cursor:pointer}
.rt-score-row:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-score-row.head{cursor:default;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-weight:600;
  position:sticky;top:0;background:var(--dsw-alias-bg-layer-1);z-index:1}
.rt-score-detail{grid-column:1/-1;padding:8px 4px 10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
/* Group scoring objectives into eight categories, ordered by ascending points. */
.rt-score-group{display:flex;align-items:center;gap:8px;padding:7px 10px 5px;margin-top:2px;
  font-size:12px;font-weight:600;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.rt-score-group:first-child{border-top:none}
.rt-score-group .rt-sg-sub{font-weight:400;font-size:11px;color:var(--dsw-alias-label-secondary)}
/* Session cards separate headings, facts, available commands, and notes. */
.rt-sess-facts{display:flex;flex-direction:column;gap:2px;margin-top:5px}
.rt-sess-fact{display:flex;gap:6px;font-size:11.5px;line-height:1.5}
.rt-sess-fact>b{flex:none;min-width:62px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.rt-sess-fact>span{min-width:0;overflow-wrap:anywhere}
.rt-sess-cmd{margin-top:6px}
.rt-sess-cmd>b{display:block;font-size:11px;color:var(--dsw-alias-label-secondary);margin-bottom:3px;font-weight:600}
.rt-sess-fold{margin-top:6px;font-size:11.5px}
.rt-sess-fold>summary{cursor:pointer;color:var(--dsw-alias-label-secondary);user-select:none}
.rt-sess-fold>summary:hover{color:var(--dsw-alias-label-primary)}
.rt-score-row .rt-scope{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.rt-score-form{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:6px}
.rt-score-form input,.rt-score-form select{width:100%;box-sizing:border-box}
.rt-vrow{display:grid;grid-template-columns:62px minmax(0,1fr) 132px 108px 74px 52px;gap:8px;padding:6px 10px;
  border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center;font-size:12.5px;cursor:pointer}
.rt-vrow:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-vrow.head{cursor:default;color:var(--dsw-alias-label-secondary);font-size:11.5px;font-weight:600;
  position:sticky;top:0;background:var(--dsw-alias-bg-layer-1);z-index:1}
.rt-vdetail{grid-column:1/-1;padding:8px 4px 10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.rt-vdetail .rt-kv{margin-bottom:4px}
.rt-actions{display:flex;gap:6px;margin-top:6px}
.rt-section{padding:8px 10px 2px;font-size:11.5px;font-weight:600;color:var(--dsw-alias-label-secondary)}
.rt-link{color:var(--dsw-alias-brand-primary);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-link:hover{text-decoration:underline}
.rt-full{position:fixed;inset:0;z-index:60;display:flex;flex-direction:column;
  background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;
  border-top:3px solid var(--dsw-alias-brand-primary)}
.rt-full .rt-head{padding:12px 18px}
.rt-full .rt-tabs{padding:10px 18px 0;gap:6px;flex-wrap:wrap}
.rt-full .rt-side{width:260px}
.rt-full .rt-list{width:280px}
.rt-full .rt-row{grid-template-columns:190px 90px 130px 1.4fr 1.2fr}
.rt-full .rt-vrow{grid-template-columns:80px minmax(0,1.6fr) 200px 150px 90px 64px}
.rt-full .rt-pane{padding:18px}
.rt-full .rt-textarea{min-height:60vh}
.rt-full .rt-foot{padding:10px 18px;font-size:12px}
.rt-full .rt-body{max-width:1400px;width:100%;margin:0 auto;flex:1;min-height:0;display:flex;flex-direction:column}
.rt-chain{flex:1;overflow:auto;padding:10px 12px}
.rt-step{display:flex;gap:10px;padding:8px 6px;border-left:2px solid var(--dsw-alias-border-l1);margin-left:6px}
.rt-step:last-child{border-left-color:transparent}
.rt-step-dot{width:22px;height:22px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;
  font-size:11px;font-weight:700;color:#fff;background:#64748b;margin-left:-13px}
.rt-step-body{min-width:0}
.rt-step-title{font-weight:600;font-size:13px}
.rt-step-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:2px;word-break:break-word}
.rt-stage-recon{background:#6366f1}
.rt-stage-vuln{background:#f59e0b}
.rt-stage-exploit{background:#ef4444}
.rt-stage-access{background:#10b981}
.rt-stage-pivot{background:#8b5cf6}
.rt-stage-data{background:#0ea5e9}
.rt-stage-other{background:#64748b}
.rt-step-head{display:flex;align-items:baseline;gap:6px;flex-wrap:wrap}
.rt-step-time{font-size:11px;color:var(--dsw-alias-label-secondary);margin-left:auto;white-space:nowrap}
.rt-step-detail{font-size:12px;margin-top:5px;white-space:pre-wrap;word-break:break-word;
  border-left:2px solid var(--dsw-alias-border-l1);padding:2px 0 2px 9px;line-height:1.6}
.rt-chip{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;padding:1px 7px;border-radius:5px;
  border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2);margin:4px 5px 0 0;max-width:100%}
.rt-chip>i{font-style:normal;color:var(--dsw-alias-label-secondary);font-size:10.5px}
.rt-chip>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:420px}
.rt-stage-tag{display:inline-block;padding:0 6px;border-radius:4px;font-size:11px;color:#fff;font-weight:600}
.rt-st-recon{background:#6366f1}.rt-st-vuln{background:#f59e0b}.rt-st-exploit{background:#ef4444}
.rt-st-access{background:#10b981}.rt-st-pivot{background:#8b5cf6}.rt-st-data{background:#0ea5e9}.rt-st-other{background:#64748b}
.rt-sev{display:inline-block;padding:0 6px;border-radius:4px;font-size:11px;font-weight:600;border:1px solid transparent}
.rt-sev-critical{color:#fff;background:#b91c1c}.rt-sev-high{color:#fff;background:#ef4444}
.rt-sev-medium{color:#7c2d12;background:#fdba74}.rt-sev-low{color:#1e3a8a;background:#bfdbfe}
.rt-sev-info{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);border-color:var(--dsw-alias-border-l1)}
.rt-dot-on{display:inline-block;width:7px;height:7px;border-radius:50%;background:#10b981;box-shadow:0 0 0 3px #10b98133}
.rt-dot-off{display:inline-block;width:7px;height:7px;border-radius:50%;background:#ef4444;box-shadow:0 0 0 3px #ef444433}
.rt-dot-unk{display:inline-block;width:7px;height:7px;border-radius:50%;background:#94a3b8;box-shadow:0 0 0 3px #94a3b833}
.rt-sess-grid{display:grid;grid-template-columns:1fr;gap:8px;padding:10px 12px}
.rt-sess{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;padding:9px 10px;background:var(--dsw-alias-bg-layer-2)}
.rt-sess-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rt-sess-title{font-weight:600;font-size:12.5px;font-family:ui-monospace,Menlo,monospace;word-break:break-all}
.rt-sess-sub{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:3px;word-break:break-word}
.rt-code{font-family:ui-monospace,Menlo,monospace;font-size:11px;background:var(--dsw-alias-bg-base);
  border:1px solid var(--dsw-alias-border-l1);border-radius:4px;padding:1px 5px;cursor:pointer;word-break:break-all}
.rt-code:hover{border-color:var(--dsw-alias-brand-primary)}
.rt-evi{border:1px solid var(--dsw-alias-border-l1);border-radius:8px;overflow:hidden;margin-top:8px}
.rt-evi-head{display:flex;align-items:center;gap:8px;padding:5px 9px;background:var(--dsw-alias-bg-layer-2);
  font-size:11.5px;font-weight:600;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rt-evi-body{margin:0;padding:9px 11px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.6;
  white-space:pre-wrap;word-break:break-word;max-height:340px;overflow:auto;background:var(--dsw-alias-bg-base)}
.rt-evi-body.req{max-height:220px}
.rt-hl-req{color:#10b981;font-weight:600}
.rt-hl-res{color:#0ea5e9;font-weight:600}
.rt-gain{display:inline-flex;align-items:center;gap:5px;font-size:11.5px;font-weight:600;padding:2px 8px;border-radius:12px;
  color:#065f46;background:#a7f3d0;border:1px solid #10b98155}
.rt-total{font-size:20px;font-weight:700;font-family:ui-monospace,Menlo,monospace}
.rt-sidehead{padding:7px 8px 2px;font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);
  display:flex;align-items:center;gap:5px}
.rt-sidehead-btn{cursor:pointer;outline:none;padding:6px 6px 5px;border-radius:5px;user-select:none}
.rt-sidehead-btn:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-1)}
.rt-sidehead-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-scope{display:inline-block;padding:0 4px;border-radius:3px;font-size:10px;font-weight:700;line-height:15px;flex:none}
.rt-scope-internal{color:#0e7490;background:#a5f3fc}
.rt-scope-external{color:#9a3412;background:#fed7aa}
.rt-hits{display:flex;flex-direction:column;gap:6px;margin-top:7px}
.rt-hit{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #10b981;border-radius:6px;
  padding:7px 9px;background:var(--dsw-alias-bg-layer-2)}
.rt-hit-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rt-hit-idx{width:16px;height:16px;border-radius:50%;background:#10b981;color:#fff;font-size:10.5px;font-weight:700;
  display:inline-flex;align-items:center;justify-content:center;flex:none}
.rt-hit-target{font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:12px;word-break:break-all}
.rt-hit-time{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.rt-hit-evi{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.65;white-space:pre-wrap;word-break:break-word;
  background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l1);border-radius:5px;padding:6px 8px;margin-top:5px}
.rt-hit-note{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:4px}
.rt-cred{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #f59e0b;border-radius:6px;
  padding:8px 10px;background:var(--dsw-alias-bg-layer-2);margin-bottom:7px}
.rt-cred-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rt-cred-host{font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:12.5px;word-break:break-all}
.rt-secret{font-family:ui-monospace,Menlo,monospace;font-size:12.5px;line-height:1.6;background:#fef3c7;color:#78350f;
  border:1px solid #f59e0b66;border-radius:5px;padding:6px 9px;margin-top:6px;white-space:pre-wrap;word-break:break-all;
  user-select:all;cursor:text}
.rt-secret-none{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;color:var(--dsw-alias-state-error-primary);
  border:1px dashed var(--dsw-alias-state-error-primary);border-radius:5px;padding:5px 9px;margin-top:6px}
.rt-cred-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:5px;word-break:break-word}
.rt-stage-score{background:#10b981}
.rt-counted{font-family:ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;color:#065f46;background:#a7f3d0;border:1px solid #10b98155;border-radius:9px;padding:0 7px}
.rt-scorepts{font-size:11.5px;font-weight:700;color:#065f46;background:#a7f3d0;border:1px solid #10b98155;
  border-radius:10px;padding:0 7px;white-space:nowrap}
.rt-livebar{display:flex;align-items:center;gap:7px;padding:7px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);
  background:var(--dsw-alias-bg-layer-2);flex-wrap:wrap}
.rt-live-dot{width:8px;height:8px;border-radius:50%;background:#10b981;flex:none;animation:rt-pulse 1.6s ease-in-out infinite}
.rt-live-dot.idle{background:#94a3b8;animation:none}
@keyframes rt-pulse{0%,100%{opacity:1;box-shadow:0 0 0 0 #10b98166}50%{opacity:.5;box-shadow:0 0 0 5px #10b98100}}
.rt-live-body{padding:8px 12px 2px;max-height:44vh;overflow:auto}
.rt-atest{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #10b981;border-radius:6px;
  padding:7px 10px;background:var(--dsw-alias-bg-layer-2);margin-bottom:6px}
.rt-atest.past{border-left-color:#94a3b8;opacity:.85}
.rt-atest-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rt-atest-ip{font-family:ui-monospace,Menlo,monospace;font-weight:600;font-size:12.5px;word-break:break-all}
.rt-atest-meta{font-size:11.5px;color:var(--dsw-alias-label-secondary);margin-top:3px;word-break:break-word}
.rt-atest-notes{font-family:ui-monospace,Menlo,monospace;font-size:11px;line-height:1.6;white-space:pre-wrap;
  word-break:break-word;background:var(--dsw-alias-bg-base);border-radius:4px;padding:5px 7px;margin-top:4px;max-height:76px;overflow:auto}
.rt-concl{display:flex;align-items:center;gap:4px;padding:6px 12px;border-bottom:1px solid var(--dsw-alias-border-l1);
  background:var(--dsw-alias-bg-layer-2);flex-wrap:wrap}
.rt-concl-i{display:inline-flex;align-items:baseline;gap:4px;padding:2px 8px;border-radius:6px;cursor:pointer;
  border:1px solid transparent}
.rt-concl-i:hover{border-color:var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1)}
.rt-concl-i.on{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-layer-1)}
.rt-concl-i b{font-family:ui-monospace,Menlo,monospace;font-size:14px;font-weight:700}
.rt-concl-i>span{color:var(--dsw-alias-label-secondary);font-size:11.5px}
.rt-more{color:var(--dsw-alias-brand-primary);font-size:11.5px;cursor:pointer;user-select:none;margin-top:4px;display:inline-block}
.rt-more:hover{text-decoration:underline}
.rt-subtabs{display:flex;gap:4px;padding:6px 10px 0;border-bottom:1px solid var(--dsw-alias-border-l1);align-items:center}
.rt-subtab{padding:4px 10px;border-radius:6px 6px 0 0;cursor:pointer;font-size:12px;color:var(--dsw-alias-label-secondary)}
.rt-subtab.on{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);font-weight:600}
.rt-sevbar{width:3px;border-radius:2px;align-self:stretch;flex:none;margin-right:2px}
/* Collapsible hierarchy:
   L1 .rt-sec: flat full-width headings, colored left stripe, dark background.
   L2 .rt-atest/.rt-hit/.rt-cred/.rt-evi: inset bordered cards with rounded corners.
   L3 .rt-clip-body/.rt-evi-body: borderless monospace details on a lighter surface.
   L4 .rt-sec-body: indentation and a vertical guide connect children to headings. */
.rt-sec-wrap{margin:0}
.rt-sec{display:flex;align-items:center;gap:8px;padding:7px 12px 7px 9px;cursor:pointer;
  background:var(--dsw-alias-bg-layer-2);border-left:3px solid var(--dsw-alias-border-l2);
  border-top:1px solid var(--dsw-alias-border-l1);user-select:none;outline:none}
.rt-sec:hover{background:var(--dsw-alias-bg-layer-1)}
.rt-sec:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-sec.flat{cursor:default}
.rt-sec.flat:hover{background:var(--dsw-alias-bg-layer-2)}
.rt-sec-caret{flex:none;width:11px;font-size:10px;color:var(--dsw-alias-label-secondary);text-align:center}
.rt-sec-title{font-weight:600;font-size:13px;white-space:nowrap}
.rt-sec-count{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.rt-sec-sub{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-sec-right{margin-left:auto;font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap;flex:none}
.rt-sec.t-stage{border-left-color:#8b5cf6}
.rt-sec.t-target{border-left-color:#0ea5e9}
.rt-sec.t-folder{border-left-color:#64748b}
.rt-sec.t-test{border-left-color:#10b981}
.rt-sec.t-queue{border-left-color:#f59e0b}
.rt-sec.t-past{border-left-color:#94a3b8}
.rt-sec-body{margin-left:12px;border-left:1px solid var(--dsw-alias-border-l1);padding:7px 0 3px 10px}
.rt-sec-body>.rt-atest:last-child,.rt-sec-body>.rt-hit:last-child{margin-bottom:2px}
/* Long text previews two fading lines, then expands into bounded scrolling. */
.rt-clip{margin-top:6px}
.rt-clip-head{display:flex;align-items:center;gap:6px}
.rt-clip-label{font-size:11px;color:var(--dsw-alias-label-secondary);font-weight:600}
.rt-clip-body{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.65;white-space:pre-wrap;
  word-break:break-word;background:var(--dsw-alias-bg-base);border-radius:5px;padding:6px 8px;margin-top:3px}
.rt-clip:not(.open) .rt-clip-body{max-height:46px;overflow:hidden;
  -webkit-mask-image:linear-gradient(180deg,#000 55%,transparent);mask-image:linear-gradient(180deg,#000 55%,transparent)}
.rt-clip.open .rt-clip-body{max-height:340px;overflow:auto}
.rt-flow{padding:10px 12px 16px}
.rt-flow-start,.rt-flow-end{font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:4px 0}
.rt-flow-end{font-weight:600;color:var(--dsw-alias-label-primary)}
.rt-flow-link{display:flex;align-items:center;gap:8px;padding:3px 0 3px 10px}
.rt-flow-arrow{color:var(--dsw-alias-border-l2);font-size:11px;flex:none}
.rt-flow-action{font-size:11.5px;color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-flow-action.inferred{opacity:.7;font-style:italic}
.rt-flow-node{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #10b981;border-radius:8px;
  padding:8px 11px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;outline:none}
.rt-flow-node:hover{border-color:var(--dsw-alias-border-l2)}
.rt-flow-node:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-flow-node.overflow{border-left-color:#94a3b8;opacity:.75}
.rt-flow-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rt-flow-idx{width:18px;height:18px;border-radius:50%;background:#10b981;color:#fff;font-size:11px;font-weight:700;
  display:inline-flex;align-items:center;justify-content:center;flex:none}
.rt-flow-node.overflow .rt-flow-idx{background:#94a3b8}
.rt-flow-name{font-weight:600;font-size:13px}
.rt-flow-pts{margin-left:auto;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;font-weight:700;color:#065f46;
  background:#a7f3d0;border:1px solid #10b98155;border-radius:10px;padding:0 8px;white-space:nowrap}
.rt-flow-pts.off{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l1)}
.rt-flow-times{font-size:11px;color:var(--dsw-alias-label-secondary)}
.rt-flow-target{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;margin-top:4px;word-break:break-all;
  color:var(--dsw-alias-label-secondary)}
.rt-flow-gain{font-size:12px;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-flow-detail{margin-top:7px;padding-top:7px;border-top:1px dashed var(--dsw-alias-border-l1)}
.rt-hflow-wrap{flex:1;min-height:0;display:flex;flex-direction:column;overflow:auto}
.rt-hflow{display:flex;align-items:center;gap:0;padding:16px 12px;overflow-x:auto;flex-wrap:nowrap}
.rt-hflow-item{display:flex;align-items:center;flex:none}
.rt-hflow-start,.rt-hflow-end{font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;padding:0 4px}
.rt-hflow-end{font-weight:600;color:var(--dsw-alias-label-primary)}
.rt-hflow-arrow{color:var(--dsw-alias-border-l2);padding:0 5px;font-size:13px;flex:none}
.rt-hflow-node{display:flex;align-items:center;gap:5px;border:1px solid var(--dsw-alias-border-l1);
  border-left:3px solid #10b981;border-radius:7px;padding:5px 8px;background:var(--dsw-alias-bg-layer-2);
  cursor:pointer;white-space:nowrap;outline:none}
.rt-hflow-node:hover{border-color:var(--dsw-alias-border-l2)}
.rt-hflow-node:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-hflow-node.overflow{border-left-color:#94a3b8;opacity:.72}
.rt-hflow-node.open{border-color:var(--dsw-alias-brand-primary)}
.rt-hflow-pts{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;font-weight:700;color:#065f46;background:#a7f3d0;
  border-radius:8px;padding:0 6px}
.rt-hflow-node.overflow .rt-hflow-pts{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1)}
.rt-hflow-name{font-size:11.5px}
.rt-hflow-n{font-size:10.5px;color:var(--dsw-alias-label-secondary)}
.rt-rep-list{padding:10px 12px 14px}
.rt-rep-tools{display:flex;gap:6px;justify-content:flex-end;margin-bottom:8px}
.rt-rep{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #10b981;border-radius:8px;
  padding:9px 11px;margin-bottom:10px;background:var(--dsw-alias-bg-layer-2)}
.rt-rep-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.rt-rep-idx{font-size:15px;color:#10b981;font-weight:700;flex:none}
.rt-rep-name{font-weight:600;font-size:13px}
.rt-rep-meta{font-size:12px;margin-top:4px;color:var(--dsw-alias-label-secondary);word-break:break-word}
.rt-rep-meta b{color:var(--dsw-alias-label-primary);font-weight:600;margin-right:2px}
.rt-rep-missing{font-size:11.5px;color:var(--dsw-alias-state-error-primary);margin-top:6px;
  border:1px dashed var(--dsw-alias-state-error-primary);border-radius:5px;padding:5px 8px}
.rt-rep-req{margin-top:7px;border:1px solid var(--dsw-alias-border-l1);border-radius:6px;overflow:hidden}
.rt-rep-req-head{display:flex;align-items:center;gap:7px;padding:4px 8px;font-size:11.5px;font-weight:600;
  background:var(--dsw-alias-bg-layer-1);border-bottom:1px solid var(--dsw-alias-border-l1)}
.rt-rep-http{margin:0;padding:8px 10px;font-family:ui-monospace,Menlo,monospace;font-size:11.5px;line-height:1.6;white-space:pre-wrap;word-break:break-word;max-height:240px;overflow:auto;background:var(--dsw-alias-bg-base)}
/* Report provenance: actions, commands, credentials, and tunnels. */
.rt-rep-trace{margin-top:8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:8px 10px;
  background:var(--dsw-alias-bg-base)}
.rt-rep-trace-head{display:flex;align-items:center;gap:7px;margin-bottom:5px}
.rt-rep-trace-title{font-weight:600;font-size:12.5px}
.rt-rep-trace-how{font-size:12px;color:var(--dsw-alias-label-secondary);margin-bottom:6px}
.rt-rep-step{border-left:2px solid var(--dsw-alias-border-l1);padding:2px 0 6px 9px;margin-bottom:6px}
.rt-rep-step-head{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.rt-rep-step-no{width:17px;height:17px;border-radius:50%;background:var(--dsw-alias-label-primary,#111);color:var(--dsw-alias-bg-base,#fff);
  font-size:10.5px;display:flex;align-items:center;justify-content:center;flex:none}
.rt-rep-step-title{font-weight:600;font-size:12.5px}
.rt-rep-step-detail{font-size:12px;color:var(--dsw-alias-label-secondary);margin-top:2px}
.rt-rep-step-cmd{font-size:11.5px;margin-top:4px;display:flex;gap:6px;align-items:flex-start;flex-wrap:wrap}
.rt-rep-step-cmd .rt-mono{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-l1);
  border-radius:5px;padding:2px 6px;word-break:break-all}
.rt-rep-step-result{font-size:11.5px;margin-top:3px;word-break:break-word}
.rt-rep-src{margin-top:6px;padding-top:6px;border-top:1px dashed var(--dsw-alias-border-l1)}
.rt-rep-src-title{font-weight:600;font-size:12px;margin-bottom:3px}
/* End-to-end attack path diagram. */
.rt-ap{padding:10px 12px 18px;overflow:auto}
.rt-ap-stage{margin-bottom:2px}
.rt-ap-head{display:flex;align-items:center;gap:8px;padding:7px 10px;background:var(--dsw-alias-bg-layer-2);
  border-left:4px solid #64748b;border-top:1px solid var(--dsw-alias-border-l1);border-radius:6px 6px 0 0}
.rt-ap-no{width:20px;height:20px;border-radius:5px;color:#fff;font-size:11px;font-weight:700;flex:none;
  display:inline-flex;align-items:center;justify-content:center}
.rt-ap-name{font-weight:700;font-size:13.5px}
.rt-ap-en{font-size:10px;color:var(--dsw-alias-label-secondary);letter-spacing:.3px}
.rt-ap-phase{font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.rt-ap-goal{display:flex;align-items:baseline;gap:8px;padding:6px 10px 6px 9px;font-size:12px;
  border-left:4px solid #64748b;background:var(--dsw-alias-bg-layer-1)}
.rt-ap-goal-tag{font-size:10.5px;font-weight:700;border:1px solid;border-radius:4px;padding:0 5px;white-space:nowrap;flex:none}
.rt-ap-result{padding:7px 10px 3px;border-left:4px solid transparent}
.rt-ap-result-head{display:flex;align-items:center;gap:8px;margin-bottom:5px;flex-wrap:wrap}
.rt-ap-pts{font-family:ui-monospace,Menlo,monospace;font-size:11.5px;font-weight:700;color:#065f46;background:#a7f3d0;
  border:1px solid #10b98155;border-radius:10px;padding:0 7px;white-space:nowrap}
.rt-ap-pts.off{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l1)}
/* Muted +0 labels distinguish capped or self-created findings from new points. */
.rt-ap-pts.uncounted{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-1);border-color:var(--dsw-alias-border-l1)}
.rt-ap-nth{font-size:10.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.rt-ap-hit{border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #10b981;border-radius:6px;
  padding:6px 9px;margin-bottom:5px;background:var(--dsw-alias-bg-layer-2);cursor:pointer;outline:none}
.rt-ap-hit:hover{border-color:var(--dsw-alias-border-l2)}
.rt-ap-hit:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-ap-hit.overflow{border-left-color:#94a3b8;opacity:.75}
.rt-ap-hit-head{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.rt-ap-hit-name{font-weight:600;font-size:12.5px}
.rt-ap-hit-target{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--dsw-alias-label-secondary);
  margin-left:auto;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:46%}
.rt-ap-act{font-size:11px;color:var(--dsw-alias-label-secondary);margin-top:3px}
.rt-ap-act.inferred{font-style:italic;opacity:.75}
.rt-ap-none{font-size:11.5px;color:var(--dsw-alias-label-secondary);padding:2px 0 4px}
.rt-ap-trans{display:flex;align-items:center;gap:7px;padding:2px 0 2px 14px}
.rt-ap-trans-t{font-size:11px;color:var(--dsw-alias-label-secondary)}
/* Horizontal path diagram. */
.rt-ap-h{display:flex;align-items:stretch;padding:10px 12px 14px;overflow-x:auto;flex:1;min-height:0}
.rt-ap-col{display:flex;align-items:stretch;flex:none}
.rt-ap-col-arrow{align-self:center;color:var(--dsw-alias-border-l2);padding:0 6px;font-size:12px;flex:none}
.rt-hcol{width:228px;display:flex;flex-direction:column;border:1px solid var(--dsw-alias-border-l1);
  border-top:3px solid #64748b;border-radius:7px;background:var(--dsw-alias-bg-layer-1);overflow:hidden}
.rt-hcol-goal{font-size:11px;color:var(--dsw-alias-label-secondary);padding:5px 8px;line-height:1.45;
  border-bottom:1px solid var(--dsw-alias-border-l1);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.rt-hcol-body{padding:6px 8px;flex:1;min-height:0;overflow:auto}
.rt-hcol-hit{display:flex;align-items:center;gap:5px;font-size:11px;margin-bottom:3px}
.rt-hcol-hit.off{opacity:.6}
.rt-hcol-pts{font-family:ui-monospace,Menlo,monospace;font-size:10.5px;font-weight:700;color:#065f46;background:#a7f3d0;
  border-radius:7px;padding:0 5px;flex:none}
.rt-hcol-hit.off .rt-hcol-pts{color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2)}
.rt-hcol-name{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-hcol-none{font-size:11px;color:var(--dsw-alias-label-secondary)}
.rt-hcol-secs{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px}
.rt-hcol-sec{font-size:10px;color:var(--dsw-alias-label-secondary);border:1px solid var(--dsw-alias-border-l1);
  border-radius:4px;padding:0 4px}
.rt-hcol-attck{font-family:ui-monospace,Menlo,monospace;font-size:9.5px;color:var(--dsw-alias-label-secondary);
  padding:4px 8px;border-top:1px solid var(--dsw-alias-border-l1);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-ap-cum{font-size:11px;color:var(--dsw-alias-label-secondary);white-space:nowrap}
.rt-ap-sub{font-size:11px;font-weight:600;color:var(--dsw-alias-label-secondary);margin:6px 0 3px}
.rt-ap-assets,.rt-ap-tunnels{display:flex;flex-direction:column;gap:3px}
.rt-ap-asset{display:flex;align-items:center;gap:6px;font-size:11.5px;padding:3px 6px;border-radius:5px;
  background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1)}
.rt-ap-tunnel{display:flex;align-items:center;gap:6px;font-size:11.5px;padding:4px 7px;border-radius:5px;
  background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);border-left:3px solid #f59e0b}
.rt-hcol-sub{font-size:10.5px;color:var(--dsw-alias-label-secondary);margin-bottom:2px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;gap:5px;align-items:center}
.rt-hcol-sub.off{opacity:.6}
.rt-hit-row{display:flex;flex-wrap:wrap;align-items:center;gap:2px 7px;font-size:11.5px;padding:4px 7px;border-radius:5px;
  background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);margin-bottom:3px}
/* Wrap long domains, passwords, and results rather than truncating them. */
.rt-hit-asset{font-family:ui-monospace,Menlo,monospace;font-weight:600;flex:0 1 auto;max-width:100%;
  overflow-wrap:anywhere;word-break:break-word}
.rt-hit-txt{flex:1 1 100%;color:var(--dsw-alias-label-primary);line-height:1.55;
  white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.rt-hit-txt.none{color:var(--dsw-alias-state-error-primary)}
.rt-hit-row .rt-hit-time{flex:none;margin-left:auto}
/* Self-created accounts remain recorded but muted and unscored. */
.rt-hit-row.self-created{opacity:.72;border-left:3px solid #ef444488}
/* Repeated accounts/database access on a capped asset/port remain unscored records. */
.rt-hit-row.service-capped{opacity:.72;border-left:3px solid #f59e0b88}
.rt-hit-row.service-capped .rt-hit-idx{background:#f59e0b}
.rt-rep-group{margin-bottom:14px}
.rt-rep-stage{display:flex;align-items:center;gap:8px;padding:7px 10px;margin-bottom:7px;
  background:var(--dsw-alias-bg-layer-2);border-left:4px solid #64748b;border-radius:6px;
  cursor:pointer;outline:none;user-select:none}
.rt-rep-stage:hover{background:var(--dsw-alias-bg-layer-1)}
.rt-rep-stage:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-rep-no{width:20px;height:20px;border-radius:5px;color:#fff;font-size:11px;font-weight:700;flex:none;
  display:inline-flex;align-items:center;justify-content:center}
.rt-rep-stage-name{font-weight:700;font-size:13px}
.rt-rep-stage-n{font-size:11px;color:var(--dsw-alias-label-secondary)}
/* Keep stage totals visible in collapsed headings. */
.rt-rep-pts{font-size:11px;font-weight:600;padding:1px 6px;border-radius:5px;border:1px solid transparent;flex:none}
.rt-rep-body{padding-left:6px}
/* Knowledge base (POC/EXP). */
.rt-kb-filter{display:flex;align-items:center;gap:7px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
/* Click category tags to filter the knowledge base. */
.rt-kb-cats{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
/* One sticky heading per knowledge-base category. */
.rt-kb-cat{display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--dsw-alias-bg-layer-2);
  border-bottom:1px solid var(--dsw-alias-border-l1);position:sticky;top:0;z-index:1}
.rt-kb-cat-name{font-weight:600;font-size:12.5px}
/* Skill availability badges. */
.rt-avail{display:inline-block;padding:0 5px;border-radius:4px;font-size:10.5px;white-space:nowrap;
  border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.rt-avail-available{color:#10b981;border-color:#10b98155;background:#10b9811a}
.rt-avail-broken{color:#ef4444;border-color:#ef444455;background:#ef44441a}
.rt-avail-unknown{color:#94a3b8;border-color:#94a3b855;background:#94a3b81a}
/* Version and update dialog. */
.rt-modal{position:fixed;inset:0;z-index:200;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center}
.rt-modal-box{width:min(560px,92vw);max-height:80vh;overflow:auto;background:var(--dsw-alias-bg-layer-1);
  border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:14px 16px;font-size:12.5px;line-height:1.7;
  box-shadow:0 18px 48px rgba(0,0,0,.35);color:var(--dsw-alias-label-primary)}
.rt-modal-box .rt-kv b{min-width:76px}
.rt-kb-check{display:flex;align-items:center;gap:5px;font-size:11.5px;color:var(--dsw-alias-label-secondary);white-space:nowrap;cursor:pointer}
.rt-kb{border:1px solid var(--dsw-alias-border-l1);border-radius:7px;margin:0 0 8px;overflow:hidden;
  background:var(--dsw-alias-bg-layer-2)}
.rt-kb.open{border-color:var(--dsw-alias-brand-primary)}
.rt-kb-head{display:flex;align-items:center;gap:7px;padding:7px 9px;cursor:pointer;outline:none;flex-wrap:wrap}
.rt-kb-head:hover{background:var(--dsw-alias-bg-layer-1)}
.rt-kb-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-2px}
.rt-kb-title{font-weight:600;font-size:12.5px;overflow-wrap:anywhere}
.rt-kb-kind{font-size:10px;font-weight:700;letter-spacing:.4px;padding:1px 5px;border-radius:4px;
  color:#fff;background:#64748b;flex:none}
.rt-kb-kind.k-exp{background:#ef4444}
.rt-kb-kind.k-poc{background:#f59e0b}
.rt-kb-kind.k-template{background:#8b5cf6}
.rt-kb-kind.k-script{background:#0ea5e9}
.rt-kb-kind.k-payload{background:#10b981}
.rt-kb-sub{font-size:11px;color:var(--dsw-alias-label-secondary);padding:0 9px 7px;overflow-wrap:anywhere}
.rt-kb-body{padding:0 9px 9px}
.rt-kb-actions{display:flex;gap:6px;margin:7px 0}
.rt-kb-body .rt-kv span{overflow-wrap:anywhere;word-break:break-word}
/* Show complete local nuclei template paths for copying into commands. */
.rt-kb-tpl{margin-top:12px;border-top:1px dashed var(--dsw-alias-border-l1);padding-top:8px}
.rt-kb-tpl-row{display:flex;align-items:center;gap:7px;font-size:11.5px;padding:3px 7px;border-radius:5px;
  background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);margin-bottom:3px}
.rt-kb-tpl-path{flex:0 1 auto;font-weight:600;overflow-wrap:anywhere}
.rt-kb-tpl-name{flex:1 1 auto;min-width:0;color:var(--dsw-alias-label-secondary);overflow-wrap:anywhere}
.rt-md{flex:1;overflow:auto;margin:0;padding:14px 16px;font-family:ui-monospace,Menlo,monospace;font-size:12.5px;
  line-height:1.65;white-space:pre-wrap;word-break:break-word;background:var(--dsw-alias-bg-base)}
.rt-weblink{display:block;font-size:11.5px;margin-top:1px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rt-shots{margin:8px 0 4px;padding:7px 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;
  background:var(--dsw-alias-bg-layer-1)}
.rt-shots-head{display:flex;align-items:baseline;gap:8px;font-size:11.5px;margin-bottom:6px}
.rt-shots-n{color:var(--dsw-alias-label-secondary)}
.rt-shot-row{display:flex;gap:8px;flex-wrap:wrap}
.rt-shot{display:flex;flex-direction:column;gap:3px;max-width:220px}
.rt-shot-thumb{border:1px solid var(--dsw-alias-border-l1);border-radius:5px;background:#0b1020;
  object-fit:contain;display:block;width:auto;max-width:216px}
.rt-shot-loading{display:flex;align-items:center;justify-content:center;width:150px;font-size:11px;
  color:var(--dsw-alias-label-secondary)}
.rt-shot-cap{display:flex;align-items:center;gap:5px;font-size:10.5px;overflow-wrap:anywhere}
.rt-shot-label{color:var(--dsw-alias-label-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px}
.rt-shot-zoom{position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.82);display:flex;flex-direction:column;
   align-items:center;justify-content:center;gap:10px;cursor:zoom-out;padding:18px}
.rt-shot-zoom img{max-width:96vw;max-height:86vh;border-radius:6px;box-shadow:0 18px 48px rgba(0,0,0,.5)}
.rt-shot-zoom-cap{color:#e5e7eb;font-size:12px;text-align:center;max-width:90vw;overflow-wrap:anywhere}`;
  const isFullWindow = () => {
    try {
      return String(window.location.hash || "") === "#redteam-full";
    } catch {
      return false;
    }
  };
  const api = (req) => fetch(apiUrl("/redteam/api"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(req)
  }).then(async (res) => {
    const text = await res.text().catch(() => "");
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      return {
        ok: false,
        error: res.status + " non-json: " + String(text).slice(0, 120)
      };
    }
    if (!res.ok) {
      return Object.assign({}, data || {}, {
        ok: false,
        error: data && (data.error || data.message) || res.status + " " + res.statusText
      });
    }
    return data;
  });
  let ui = { open: true, tab: "assets" };
  const subs = /* @__PURE__ */ new Set();
  const setUI = (patch) => {
    ui = Object.assign({}, ui, patch);
    const snap = Object.assign({}, ui);
    for (const f of Array.from(subs)) {
      try {
        f(snap);
      } catch {
      }
    }
  };
  let dockWidthTag = null;
  const setDockWidth = () => {
  };
  const useUI = () => {
    const [st, setSt] = import_react2.default.useState(() => Object.assign({}, ui));
    import_react2.default.useEffect(() => {
      const f = (snap) => setSt(Object.assign({}, snap || ui));
      subs.add(f);
      setSt(Object.assign({}, ui));
      return () => {
        subs.delete(f);
      };
    }, []);
    return st;
  };
  const POC_CAT_NAME = {
    rce: "Remote command execution",
    deserialization: "Deserialization",
    "file-upload": "File upload / shell access",
    sqli: "SQL injection",
    unauthorized: "Unauthorized access",
    "auth-bypass": "Authentication bypass / access control",
    "weak-password": "Weak passwords / brute force",
    ssrf: "SSRF",
    xxe: "XXE",
    "path-traversal": "Path traversal / arbitrary file read",
    "info-leak": "Information disclosure",
    privesc: "Privilege escalation / lateral movement",
    tunnel: "Tunnels / proxies",
    other: "Other"
  };
  const POC_CAT_ORDER = Object.keys(POC_CAT_NAME);
  const ROLE_LABEL = {
    plan: "Main session (coordination)",
    recon: "Reconnaissance",
    assess: "Asset assessment",
    "vuln-scan": "Vulnerability discovery",
    exploit: "Exploitation",
    internal: "Internal penetration testing"
  };
  const fmt = (s) => s ? String(s).replace("T", " ").slice(0, 16) : "\u2014";
  const shotCache = /* @__PURE__ */ new Map();
  const shotLoading = /* @__PURE__ */ new Map();
  const shotSrc = (eng, id) => shotCache.get(eng + ":" + id) || null;
  const loadShot = (eng, id) => {
    const key = eng + ":" + id;
    if (shotCache.has(key) || shotLoading.has(key)) return;
    const p = api({ op: "shotData", engagement: eng, id }).then((r) => {
      shotCache.set(
        key,
        r && r.base64 ? "data:" + (r.mime || "image/png") + ";base64," + r.base64 : ""
      );
      shotLoading.delete(key);
      const snap = Object.assign({}, ui);
      for (const f of Array.from(subs)) {
        try {
          f(snap);
        } catch {
        }
      }
    }).catch(() => {
      shotLoading.delete(key);
    });
    shotLoading.set(key, p);
  };
  const SHOT_KIND = {
    screenshot: "Captured screenshot",
    card: "Evidence excerpt generated from records"
  };
  const ShotImage = ({ eng, shot, height }) => {
    const [zoom, setZoom] = import_react2.default.useState(false);
    const src = shotSrc(eng, shot.id);
    if (src === null) {
      loadShot(eng, shot.id);
    }
    const card = shot.kind === "card";
    return h2(
      "div",
      { className: "rt-shot" },
      src === null ? h2(
        "div",
        {
          className: "rt-shot-thumb rt-shot-loading",
          style: { height: (height || 96) + "px" }
        },
        "Loading\u2026"
      ) : h2("img", {
        className: "rt-shot-thumb",
        src,
        alt: shot.label || "Evidence " + shot.id,
        style: { height: (height || 96) + "px", cursor: "zoom-in" },
        onClick: () => setZoom(true)
      }),
      h2(
        "div",
        { className: "rt-shot-cap" },
        h2(
          "span",
          {
            className: "rt-tag " + (card ? "rt-tag-warn" : "rt-tag-live"),
            title: card ? "Evidence excerpt generated from that day's records, not a captured screenshot; the report also labels this distinction" : "Captured screenshot"
          },
          SHOT_KIND[shot.kind] || shot.kind || "Evidence"
        ),
        h2(
          "span",
          { className: "rt-shot-label", title: shot.label || shot.note || "" },
          shot.label || shot.target || "#" + shot.id
        )
      ),
      zoom ? h2(
        "div",
        { className: "rt-shot-zoom", onClick: () => setZoom(false) },
        h2("img", { src, alt: shot.label || "" }),
        h2(
          "div",
          { className: "rt-shot-zoom-cap" },
          (shot.label || shot.target || "") + (card ? " \xB7 Generated from that day's records (not a captured screenshot)" : "") + (shot.captured_at ? "\u3000\xB7\u3000" + fmt(shot.captured_at) : "") + " \xB7 Click anywhere to close"
        )
      ) : null
    );
  };
  const ShotStrip = ({ eng, shots, total, title }) => {
    const list = shots || [];
    if (list.length === 0) return null;
    return h2(
      "div",
      { className: "rt-shots" },
      h2(
        "div",
        { className: "rt-shots-head" },
        h2("b", null, title || "Evidence screenshots"),
        h2(
          "span",
          { className: "rt-shots-n" },
          "Showing " + list.length + " images" + (total && total > list.length ? " (representative images from " + total + " for this scoring item)" : "")
        )
      ),
      h2(
        "div",
        { className: "rt-shot-row" },
        list.map(
          (sh) => h2(ShotImage, { key: "sh" + sh.id, eng, shot: sh })
        )
      )
    );
  };
  const fmtShort = (s) => {
    const t = String(s || "").replace("T", " ");
    return t.length >= 16 ? t.slice(5, 16) : t || "\u2014";
  };
  const provLabel = (p) => p === "passive" ? "Passive" : p === "active" ? "Active" : "Unknown";
  const clickable = (onActivate, options = {}) => {
    const props = {
      role: "button",
      tabIndex: 0,
      onClick: onActivate,
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(e);
        }
      }
    };
    if (options.label !== void 0)
      props["aria-label"] = String(options.label);
    if (options.expanded !== void 0)
      props["aria-expanded"] = options.expanded ? "true" : "false";
    return props;
  };
  const copyText = async (text) => {
    const value = text === void 0 || text === null ? "" : String(text);
    if (value === "") return false;
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (e) {
    }
    try {
      const ta = document.createElement("textarea");
      ta.value = value;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      const okFlag = document.execCommand("copy");
      document.body.removeChild(ta);
      return okFlag === true;
    } catch (e) {
      return false;
    }
  };
  const copyWithFeedback = async (text, label, onResult) => {
    const okFlag = await copyText(text);
    const message = okFlag ? "Copied: " + label : "Copy failed (clipboard permission unavailable). Select and copy the text manually.";
    if (typeof onResult === "function") onResult(okFlag, message);
    return okFlag;
  };
  function ProvTag(props) {
    if (!props.p) return h2("span", { className: "rt-tag" }, "Unknown");
    return h2(
      "span",
      { className: "rt-tag rt-tag-" + props.p },
      provLabel(props.p)
    );
  }
  const TEST_LABEL = {
    untested: "Untested",
    testing: "Testing",
    tested: "Tested",
    blocked: "Blocked",
    abandoned: "Abandoned",
    no_surface: "No attack surface"
  };
  const PRI_LABEL = { high: "High", medium: "Medium", low: "Low" };
  function PriTag(props) {
    if (!props.p) return h2("span", { className: "rt-tag" }, "Unassessed");
    return h2(
      "span",
      { className: "rt-pri rt-pri-" + props.p, title: props.title || "" },
      PRI_LABEL[props.p] || props.p
    );
  }
  function TestTag(props) {
    const st = props.s || "untested";
    return h2(
      "span",
      { className: "rt-test rt-test-" + st },
      TEST_LABEL[st] || st
    );
  }
  function AssetsTab(props) {
    const eng = props.engagement;
    const snapshot = props.snapshot;
    const refreshKey = props.refreshKey || 0;
    const onRefresh = props.onRefresh;
    const [view, setView] = import_react2.default.useState("list");
    const [cidr, setCidr] = import_react2.default.useState(null);
    const [q, setQ] = import_react2.default.useState("");
    const [qApplied, setQApplied] = import_react2.default.useState("");
    const [service, setService] = import_react2.default.useState("");
    const [port, setPort] = import_react2.default.useState("");
    const [prov, setProv] = import_react2.default.useState("");
    const [testStatus, setTestStatus] = import_react2.default.useState("");
    const [priority, setPriority] = import_react2.default.useState("");
    const [scope, setScope] = import_react2.default.useState("");
    const [assetState, setAssetState] = import_react2.default.useState("");
    const [sort, setSort] = import_react2.default.useState("priority");
    const [showAll, setShowAll] = import_react2.default.useState(null);
    const [state, setState] = import_react2.default.useState({
      loading: false,
      error: null,
      total: 0,
      items: []
    });
    const [domains, setDomains] = import_react2.default.useState(null);
    const [web, setWeb] = import_react2.default.useState(null);
    const [openId, setOpenId] = import_react2.default.useState(null);
    const [detail, setDetail] = import_react2.default.useState(null);
    const sideCollapse = useCollapse("assets-side:" + eng);
    const seq = import_react2.default.useRef(0);
    const onData = props.onData;
    import_react2.default.useEffect(() => {
      if (!eng) return;
      const my = ++seq.current;
      setState((s) => Object.assign({}, s, { loading: true, error: null }));
      api({
        op: "assets",
        engagement: eng,
        cidr: cidr || void 0,
        q: qApplied || void 0,
        service: service || void 0,
        port: port || void 0,
        provenance: prov || void 0,
        test_status: testStatus || void 0,
        priority: priority || void 0,
        scope: scope || void 0,
        state: assetState || void 0,
        sort,
        limit: 400
      }).then(
        (r) => {
          if (my !== seq.current) return;
          if (!r || r.ok === false) {
            setState({
              loading: false,
              error: r && r.error || "Query failed",
              total: 0,
              items: []
            });
            return;
          }
          setState({
            loading: false,
            error: null,
            total: r.total,
            items: r.items || []
          });
          if (onData) onData();
        },
        (e) => {
          if (my === seq.current)
            setState({
              loading: false,
              error: String(e && e.message || e),
              total: 0,
              items: []
            });
        }
      );
    }, [
      eng,
      cidr,
      qApplied,
      service,
      port,
      prov,
      testStatus,
      priority,
      scope,
      assetState,
      sort,
      refreshKey
    ]);
    import_react2.default.useEffect(() => {
      if (!eng || view !== "domain") return;
      setDomains(null);
      api({ op: "domains", engagement: eng, cidr: cidr || void 0 }).then(
        (r) => setDomains(r && r.items || []),
        () => setDomains([])
      );
    }, [eng, view, cidr, refreshKey]);
    import_react2.default.useEffect(() => {
      if (!eng || view !== "web") return;
      setWeb(null);
      api({ op: "web", engagement: eng, cidr: cidr || void 0 }).then(
        (r) => setWeb(r && r.items || []),
        () => setWeb([])
      );
    }, [eng, view, cidr, refreshKey]);
    const toggleRow = (id) => {
      if (openId === id) {
        setOpenId(null);
        setDetail(null);
        return;
      }
      setOpenId(id);
      setDetail(null);
      api({ op: "asset", engagement: eng, id }).then(
        (r) => {
          if (r && r.ok && r.asset) setDetail(r.asset);
        },
        () => {
        }
      );
    };
    const segs = snapshot && snapshot.segments || [];
    const sideChildren = [];
    sideChildren.push(
      h2(
        "div",
        Object.assign(
          {
            key: "all",
            className: "rt-seg" + (cidr === null && view !== "testing" ? " on" : "")
          },
          clickable(
            () => {
              setView("list");
              setCidr(null);
            },
            {
              label: "All subnets",
              expanded: cidr === null && view !== "testing"
            }
          )
        ),
        h2("div", { className: "rt-seg-cidr" }, "All subnets"),
        h2("div", { className: "rt-seg-meta" }, segs.length + " subnets")
      )
    );
    sideChildren.push(
      h2(
        "div",
        Object.assign(
          {
            key: "testing",
            className: "rt-seg" + (view === "testing" ? " on" : ""),
            title: "Running scans, probes, and progress (refreshes every 5 seconds)"
          },
          clickable(
            () => {
              setView("testing");
              setCidr(null);
            },
            { label: "Current tests", expanded: view === "testing" }
          )
        ),
        h2(
          "div",
          {
            className: "rt-seg-cidr",
            style: { display: "flex", alignItems: "baseline", gap: 5 }
          },
          h2(
            "span",
            {
              className: "rt-scope rt-scope-testing",
              title: "Current tests (neither internal nor external)"
            },
            "Test"
          ),
          h2("span", { style: { flex: 1 } }, "Current tests")
        ),
        h2("div", { className: "rt-seg-meta" }, "Running scans and probes")
      )
    );
    const segBlock = (title, list, kind) => {
      const open = sideCollapse.isOpen("scope:" + kind, true);
      const toggle = sideCollapse.toggle("scope:" + kind, true);
      const out = [
        h2(
          "div",
          {
            key: "h" + kind,
            className: "rt-sidehead rt-sidehead-btn",
            role: "button",
            tabIndex: 0,
            "aria-expanded": open ? "true" : "false",
            title: (open ? "Collapse group" : "Expand group") + " and return to assets",
            onClick: () => {
              setView("list");
              toggle();
            },
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setView("list");
                toggle(e);
              }
            }
          },
          h2("span", { className: "rt-sec-caret" }, open ? "\u25BE" : "\u25B8"),
          h2(
            "span",
            { className: "rt-scope rt-scope-" + kind },
            kind === "internal" ? "Internal" : "External"
          ),
          h2("span", null, title + " \xB7 " + list.length + " subnets"),
          h2("span", { className: "rt-spacer" }),
          h2(
            "span",
            { style: { fontWeight: 400 } },
            list.reduce((n, x) => n + (x.assets || 0), 0) + " assets"
          )
        )
      ];
      if (!open) return out;
      for (const s of list) {
        out.push(
          h2(
            "div",
            Object.assign(
              {
                key: s.cidr,
                className: "rt-seg" + (cidr === s.cidr ? " on" : ""),
                title: (s.org || "Unknown owner") + " \xB7 Live " + (s.live || 0) + "/" + (s.assets || 0) + " hosts"
              },
              clickable(
                () => {
                  setView("list");
                  setCidr(s.cidr);
                },
                {
                  label: "Filter subnet " + s.cidr,
                  expanded: cidr === s.cidr && view !== "testing"
                }
              )
            ),
            h2(
              "div",
              {
                className: "rt-seg-cidr",
                style: { display: "flex", alignItems: "baseline", gap: 5 }
              },
              h2(
                "span",
                { className: "rt-scope rt-scope-" + kind },
                kind === "internal" ? "Int" : "Ext"
              ),
              h2("span", { style: { flex: 1 } }, s.cidr),
              h2(
                "span",
                {
                  className: "rt-seg-meta",
                  style: { margin: 0, whiteSpace: "nowrap" }
                },
                s.assets + " hosts"
              )
            )
          )
        );
      }
      return out;
    };
    const segExternal = segs.filter((x) => x.scope !== "internal");
    const segInternal = segs.filter((x) => x.scope === "internal");
    if (segExternal.length)
      sideChildren.push(...segBlock("External assets", segExternal, "external"));
    if (segInternal.length)
      sideChildren.push(...segBlock("Internal assets", segInternal, "internal"));
    const side = h2("div", { className: "rt-side" }, sideChildren);
    const toolbar = h2(
      "div",
      { className: "rt-toolbar" },
      h2("input", {
        className: "rt-input",
        style: { flex: "1 1 150px" },
        placeholder: "Search IP / domain / fingerprint (Enter)",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setQApplied(q);
        }
      }),
      h2(
        "button",
        { className: "rt-btn", onClick: () => setQApplied(q) },
        "Search"
      ),
      h2("input", {
        className: "rt-input",
        style: { width: "78px" },
        placeholder: "Service",
        value: service,
        onChange: (e) => setService(e.target.value)
      }),
      h2("input", {
        className: "rt-input",
        style: { width: "60px" },
        placeholder: "Port",
        value: port,
        onChange: (e) => setPort(e.target.value)
      }),
      h2(
        "select",
        {
          className: "rt-input",
          value: scope,
          onChange: (e) => setScope(e.target.value)
        },
        h2("option", { value: "" }, "All network scopes"),
        h2("option", { value: "external" }, "External assets only"),
        h2("option", { value: "internal" }, "Internal assets only")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: prov,
          onChange: (e) => setProv(e.target.value),
          title: "Filter by port discovery source (shown in details)"
        },
        h2("option", { value: "" }, "All sources"),
        h2("option", { value: "passive" }, "Passive only"),
        h2("option", { value: "active" }, "Active only")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: priority,
          onChange: (e) => setPriority(e.target.value)
        },
        h2("option", { value: "" }, "All exploitability levels"),
        h2("option", { value: "high" }, "Easy (high)"),
        h2("option", { value: "medium" }, "Moderate (medium)"),
        h2("option", { value: "low" }, "Difficult (low)")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: testStatus,
          onChange: (e) => setTestStatus(e.target.value)
        },
        h2("option", { value: "" }, "All test states"),
        h2("option", { value: "untested" }, "Untested"),
        h2("option", { value: "testing" }, "Testing"),
        h2("option", { value: "tested" }, "Tested"),
        h2("option", { value: "blocked" }, "Blocked"),
        h2("option", { value: "abandoned" }, "Abandoned"),
        h2("option", { value: "no_surface" }, "No attack surface")
      ),
      h2("div", { className: "rt-spacer" }),
      h2(
        "button",
        {
          className: "rt-btn",
          title: "Reload the snapshot and current view",
          onClick: () => {
            if (onRefresh) onRefresh();
          }
        },
        "Refresh"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "list" ? " rt-btn-primary" : ""),
          onClick: () => setView("list")
        },
        "List"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "timeline" ? " rt-btn-primary" : ""),
          title: "View assets by discovery time and daily totals",
          onClick: () => setView("timeline")
        },
        "Discovery time"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "domain" ? " rt-btn-primary" : ""),
          onClick: () => setView("domain")
        },
        "Domains"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "web" ? " rt-btn-primary" : ""),
          onClick: () => setView("web")
        },
        "Web"
      )
    );
    const tests = snapshot && snapshot.tests || {};
    const snapStats = snapshot && snapshot.stats || {};
    const noFilter = !testStatus && !priority && !scope && !prov && !assetState && !cidr;
    const conclItem = (key, label, value, active, onClick) => h2(
      "span",
      Object.assign(
        {
          key,
          className: "rt-concl-i" + (active ? " on" : ""),
          title: "Click to filter; click again to clear"
        },
        clickable(onClick, {
          label: "Filter by " + label + " (" + (value || 0) + ")",
          expanded: active
        })
      ),
      h2("b", null, String(value || 0)),
      h2("span", null, label)
    );
    const toggleTest = (v) => {
      setTestStatus((cur) => cur === v ? "" : v);
      setAssetState("");
    };
    const conclusion = h2(
      "div",
      { className: "rt-concl" },
      conclItem("all", "assets", snapStats.assets, noFilter, () => {
        setTestStatus("");
        setPriority("");
        setScope("");
        setProv("");
        setAssetState("");
        setCidr(null);
      }),
      conclItem(
        "live",
        "Live",
        snapStats.liveAssets,
        assetState === "live",
        () => {
          setAssetState((v) => v === "live" ? "" : "live");
          setTestStatus("");
        }
      ),
      conclItem(
        "untested",
        "Untested",
        tests.untested,
        testStatus === "untested",
        () => toggleTest("untested")
      ),
      conclItem(
        "testing",
        "Testing",
        tests.testing,
        testStatus === "testing",
        () => toggleTest("testing")
      ),
      conclItem(
        "tested",
        "Tested",
        tests.tested,
        testStatus === "tested",
        () => toggleTest("tested")
      ),
      conclItem(
        "giveup",
        "Abandoned / blocked",
        (tests.abandoned || 0) + (tests.blocked || 0),
        testStatus === "abandoned,blocked",
        () => toggleTest("abandoned,blocked")
      ),
      h2("div", { className: "rt-spacer" }),
      h2(
        "select",
        {
          className: "rt-input",
          value: sort,
          onChange: (e) => setSort(e.target.value),
          title: "List sort order"
        },
        h2("option", { value: "priority" }, "Sort: exploitability"),
        h2("option", { value: "todo" }, "Sort: untested first"),
        h2("option", { value: "discovered" }, "Sort: newest discoveries"),
        h2("option", { value: "ports" }, "Sort: most ports"),
        h2("option", { value: "ip" }, "Sort: IP address")
      )
    );
    const head = h2(
      "div",
      { className: "rt-row head" },
      h2("span", null, "IP"),
      h2("span", null, "Priority"),
      h2("span", null, "Test status"),
      h2("span", null, "Open ports / services"),
      h2("span", null, "Fingerprints")
    );
    const rowNodes = [];
    for (const it of state.items) {
      const openPorts = it.ports.filter((p) => p.state === "open");
      const portText = openPorts.map((p) => p.port + (p.service ? "/" + p.service : "")).join(", ") || "\u2014";
      const fpText = it.fingerprints.map(
        (f) => [f.vendor, f.product, f.version].filter(Boolean).join(" ")
      ).join(" / ") || "\u2014";
      const shownPorts = openPorts.slice(0, 3).map((p) => p.port + (p.service ? "/" + p.service : "")).join(", ");
      const morePorts = openPorts.length > 3 ? " +" + (openPorts.length - 3) : "";
      rowNodes.push(
        h2(
          "div",
          Object.assign(
            {
              key: "r" + it.id,
              className: "rt-row"
            },
            clickable(() => toggleRow(it.id), {
              label: "Expand asset " + it.ip,
              expanded: openId === it.id
            })
          ),
          h2(
            "span",
            {
              className: "rt-mono",
              style: {
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                flexWrap: "wrap"
              }
            },
            h2(
              "span",
              {
                className: "rt-scope rt-scope-" + (it.scope === "internal" ? "internal" : "external")
              },
              it.scope === "internal" ? "Int" : "Ext"
            ),
            h2("span", {
              title: it.state === "live" ? "Live" : String(it.state),
              style: {
                width: 7,
                height: 7,
                borderRadius: "50%",
                flex: "none",
                marginTop: 4,
                background: it.state === "live" ? "#10b981" : "#94a3b8"
              }
            }),
            h2(
              "span",
              { style: { overflow: "hidden", textOverflow: "ellipsis" } },
              it.ip
            ),
            /* Place discovery time below the IP to preserve existing columns. */
            h2(
              "span",
              {
                style: {
                  fontSize: 10.5,
                  color: "var(--dsw-alias-label-secondary)",
                  whiteSpace: "nowrap"
                },
                title: "Discovered: " + (it.discovered_at ? fmt(it.discovered_at) : "Not recorded") + (it.last_seen ? "\nLast collected: " + fmt(it.last_seen) : "")
              },
              it.discovered_at ? fmtShort(it.discovered_at) : "Discovery time unknown"
            )
          ),
          h2(
            "span",
            null,
            h2(PriTag, { p: it.priority, title: it.potential || "" })
          ),
          h2(
            "span",
            null,
            h2(TestTag, { s: it.test_status }),
            it.blocked_count ? h2(
              "span",
              {
                className: "rt-tag",
                style: {
                  color: "#ef4444",
                  borderColor: "#ef444455",
                  marginLeft: 4
                }
              },
              "Blocked " + it.blocked_count
            ) : null
          ),
          h2("span", { title: portText }, (shownPorts || "\u2014") + morePorts),
          h2(
            "span",
            { title: fpText },
            fpText.length > 30 ? fpText.slice(0, 30) + "\u2026" : fpText
          )
        )
      );
      if (openId !== it.id) continue;
      const d = detail && detail.id === it.id ? detail : null;
      const portRows = [];
      const fpRows = [];
      const obsRows = [];
      if (d) {
        for (const p of d.ports || []) {
          if (p.state !== "open") continue;
          portRows.push(
            h2(
              "div",
              { key: "p" + p.port, className: "rt-kv" },
              h2("b", { className: "rt-mono" }, p.port + "/" + p.proto),
              h2(
                "span",
                null,
                [p.service, p.product, p.version].filter(Boolean).join(" ") || "Unknown service"
              ),
              p.url ? h2(
                "a",
                {
                  className: "rt-link",
                  href: p.url,
                  target: "_blank",
                  rel: "noreferrer",
                  title: p.url
                },
                p.title ? p.title : p.url
              ) : null,
              h2(ProvTag, { p: p.provenance })
            )
          );
        }
        for (const f of d.fingerprints || []) {
          fpRows.push(
            h2(
              "div",
              {
                key: "f" + (f.product || "") + (f.version || "") + (f.evidence || ""),
                className: "rt-kv"
              },
              h2("b", null, f.category || "\u2014"),
              h2(
                "span",
                null,
                [f.vendor, f.product, f.version].filter(Boolean).join(" ") + (f.evidence ? " (" + f.evidence + ")" : "")
              ),
              h2(ProvTag, { p: f.provenance })
            )
          );
        }
        for (const o of (d.observations || []).slice(0, 8)) {
          obsRows.push(
            h2(
              "div",
              {
                key: "o" + (o.attr || "") + (o.value || "") + (o.collected_at || ""),
                className: "rt-kv"
              },
              h2("b", null, o.attr || "\u2014"),
              h2(
                "span",
                null,
                (o.value || "") + " \xB7 " + (o.tool || "Unknown tool") + " \xB7 " + fmt(o.collected_at)
              ),
              h2(ProvTag, { p: o.provenance })
            )
          );
        }
      }
      const all = showAll === it.id;
      const noteLines = d && d.test_notes ? d.test_notes.split("\n").filter(Boolean) : [];
      const inner = d ? h2(
        "div",
        null,
        /* Three essential rows. */
        h2(
          "div",
          { className: "rt-kv" },
          h2("b", null, "Tests"),
          h2(
            "span",
            null,
            h2(TestTag, { s: d.test_status }),
            d.blocked_count ? h2(
              "span",
              {
                className: "rt-tag",
                style: {
                  marginLeft: 6,
                  color: "#ef4444",
                  borderColor: "#ef444455"
                }
              },
              "Blocked " + d.blocked_count + " times"
            ) : null,
            h2(
              "span",
              {
                style: {
                  marginLeft: 8,
                  color: "var(--dsw-alias-label-secondary)"
                }
              },
              (d.test_updated_at ? fmt(d.test_updated_at) : "Never tested") + (d.test_updated_by ? " \xB7 " + d.test_updated_by : "")
            )
          )
        ),
        h2(
          "div",
          { className: "rt-kv" },
          h2("b", null, "Exploitability"),
          h2(
            "span",
            null,
            h2(PriTag, { p: d.priority }),
            h2(
              "span",
              { style: { marginLeft: 8 } },
              d.potential || "Unassessed"
            ),
            d.assess_reason ? h2(
              "span",
              {
                style: {
                  marginLeft: 8,
                  color: "var(--dsw-alias-label-secondary)"
                }
              },
              d.assess_reason
            ) : null
          )
        ),
        h2(
          "div",
          { className: "rt-kv" },
          h2("b", null, "Attack surface"),
          h2(
            "span",
            null,
            d.test_surface || (portRows.length ? "Not recorded (open ports below)" : "No open ports"),
            d.scope ? h2(
              "span",
              {
                className: "rt-scope rt-scope-" + (d.scope === "internal" ? "internal" : "external"),
                style: { marginLeft: 8 }
              },
              d.scope === "internal" ? "Internal asset" : "External asset"
            ) : null
          )
        ),
        h2(
          "span",
          Object.assign(
            { className: "rt-more" },
            clickable(() => setShowAll(all ? null : it.id), {
              label: all ? "Collapse asset details" : "Expand asset details",
              expanded: all
            })
          ),
          all ? "Collapse all \u25B2" : "Expand all (ports \xB7 fingerprints \xB7 provenance \xB7 test records) \u25BC"
        ),
        all ? h2(
          "div",
          null,
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Hostnames"),
            h2(
              "span",
              null,
              (d.names || []).map((n) => n.name).join(", ") || "\u2014"
            )
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Discovered"),
            h2(
              "span",
              {
                title: "When this asset first entered the inventory; repeated collection updates only Last collected"
              },
              fmt(d.discovered_at)
            ),
            h2(
              "b",
              { style: { minWidth: 0, marginLeft: 8 } },
              "Last collected"
            ),
            h2("span", null, fmt(d.last_seen)),
            h2(
              "b",
              { style: { minWidth: 0, marginLeft: 8 } },
              "First seen in source"
            ),
            h2("span", null, fmt(d.first_seen))
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "C segment"),
            h2("span", null, d.segment_cidr)
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Exploitability"),
            h2(
              "span",
              null,
              (d.priority || "Not assessed") + (d.potential ? " \xB7 Expected: " + d.potential : "") + (d.assess_reason ? " \xB7 Basis: " + d.assess_reason : "") + (d.assessed_at ? "\uFF08" + fmt(d.assessed_at) + "\uFF09" : "")
            )
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Source"),
            h2(
              "span",
              null,
              "Passive ports " + (d.passive || 0) + " \xB7 Active ports " + (d.active || 0)
            )
          ),
          h2(
            "div",
            { style: { margin: "6px 0 3px", fontWeight: 600 } },
            "Open ports / services"
          ),
          h2("div", null, portRows.length ? portRows : "\u2014"),
          h2(
            "div",
            { style: { margin: "6px 0 3px", fontWeight: 600 } },
            "Fingerprints"
          ),
          h2("div", null, fpRows.length ? fpRows : "\u2014"),
          noteLines.length ? h2(Clip, {
            key: "notes",
            label: "Test notes (" + noteLines.length + " entries)",
            text: noteLines.join("\n")
          }) : null,
          h2(
            "div",
            { style: { margin: "6px 0 3px", fontWeight: 600 } },
            "Collection trace (latest 8 entries)"
          ),
          h2("div", null, obsRows.length ? obsRows : "\u2014")
        ) : null
      ) : h2("div", null, "Loading\u2026");
      rowNodes.push(
        h2(
          "div",
          {
            key: "d" + it.id,
            className: "rt-row",
            style: { cursor: "default", gridTemplateColumns: "1fr" }
          },
          h2("div", { className: "rt-expand" }, inner)
        )
      );
    }
    const listPane = h2(
      "div",
      { className: "rt-table" },
      head,
      rowNodes,
      !state.loading && !state.items.length ? h2("div", { className: "rt-empty" }, "No matching assets") : null
    );
    const domainPane = h2(
      "div",
      { className: "rt-table" },
      domains === null ? h2("div", { className: "rt-empty" }, "Loading\u2026") : domains.length ? domains.map(
        (g) => h2(
          "div",
          { key: g.domain },
          h2(
            "div",
            {
              className: "rt-section",
              style: { padding: "8px 10px 4px" }
            },
            h2(
              "a",
              {
                className: "rt-link",
                href: "http://" + g.domain,
                target: "_blank",
                rel: "noreferrer"
              },
              g.domain
            ),
            h2(
              "span",
              { className: "rt-tag", style: { marginLeft: 8 } },
              g.count + " assets"
            )
          ),
          g.assets.map(
            (a) => h2(
              "div",
              {
                key: String(g.domain) + "\0" + a.id + "\0" + a.ip,
                className: "rt-row",
                style: {
                  gridTemplateColumns: "150px 130px 70px 1fr",
                  cursor: "pointer"
                },
                onClick: () => {
                  setView("list");
                  setQ("");
                  setQApplied(a.ip);
                }
              },
              h2("span", { className: "rt-mono" }, a.ip),
              h2("span", { className: "rt-mono" }, a.segment),
              h2(
                "span",
                null,
                h2(
                  "span",
                  {
                    className: "rt-tag rt-tag-" + (a.state === "live" ? "live" : "dead")
                  },
                  a.state === "live" ? "Live" : a.state
                )
              ),
              h2(
                "span",
                {
                  style: {
                    fontSize: 11,
                    color: "var(--dsw-alias-label-secondary)"
                  }
                },
                (a.names || []).join(", ")
              )
            )
          )
        )
      ) : h2(
        "div",
        { className: "rt-empty" },
        cidr ? 'No domains in this C segment (switch to "All C segments" to see all)' : "No domain data yet (domains are written during reconnaissance)"
      )
    );
    const webPane = h2(
      "div",
      { className: "rt-table" },
      h2(
        "div",
        {
          className: "rt-row head",
          style: { gridTemplateColumns: "1.6fr 1.2fr 130px 110px" }
        },
        h2("span", null, "URL (clickable)"),
        h2("span", null, "Title"),
        h2("span", null, "Asset"),
        h2("span", null, "Service")
      ),
      (web || []).map((w) => {
        const url = w.url || "http" + (w.port === 443 || w.port === 8443 || w.port === 9443 ? "s" : "") + "://" + w.ip + (w.port === 80 || w.port === 443 ? "" : ":" + w.port);
        return h2(
          "div",
          {
            key: "w" + w.port_id,
            className: "rt-row",
            style: {
              gridTemplateColumns: "1.6fr 1.2fr 130px 110px",
              cursor: "default"
            }
          },
          h2(
            "a",
            {
              className: "rt-link rt-mono",
              href: url,
              target: "_blank",
              rel: "noreferrer",
              title: url
            },
            url
          ),
          h2("span", { title: w.title || "" }, w.title || "\u2014"),
          h2("span", { className: "rt-mono" }, w.ip + " \xB7 " + w.segment_cidr),
          h2(
            "span",
            { style: { fontSize: 11 } },
            [w.service, w.product, w.version].filter(Boolean).join(" ")
          )
        );
      }),
      web === null ? h2("div", { className: "rt-empty" }, "Loading\u2026") : !web.length ? h2(
        "div",
        { className: "rt-empty" },
        cidr ? "No web assets in this C segment" : "No web assets yet (URLs and titles are written after HTTP probing)"
      ) : null
    );
    let pane = listPane;
    if (view === "testing")
      pane = h2(TestingTab, { engagement: eng, refreshKey });
    else if (view === "domain") pane = domainPane;
    else if (view === "web") pane = webPane;
    else if (view === "timeline")
      pane = h2(DiscoveryView, { engagement: eng, refreshKey });
    return h2(
      "div",
      { className: "rt-split" },
      side,
      h2(
        "div",
        { className: "rt-main" },
        view === "testing" ? null : toolbar,
        conclusion,
        state.error ? h2("div", { className: "rt-err" }, state.error) : null,
        pane
      )
    );
  }
  function DiscoveryView(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [day, setDay] = import_react2.default.useState("");
    import_react2.default.useEffect(() => {
      if (!eng) return;
      setData(null);
      api({ op: "discoveryTimeline", engagement: eng, limit: 200 }).then(
        (r) => {
          if (!r || r.ok === false) setErr(r && r.error || "Load failed");
          else {
            setErr(null);
            setData(r);
          }
        },
        (e) => setErr(String(e && e.message || e))
      );
    }, [eng, refreshKey]);
    if (err)
      return h2(
        "div",
        { className: "rt-pane" },
        h2("div", { className: "rt-err" }, err)
      );
    if (!data) return h2("div", { className: "rt-empty" }, "Loading\u2026");
    const recent = (data.recent || []).filter(
      (a) => day === "" || String(a.discovered_at || "").slice(0, 10) === day
    );
    return h2(
      "div",
      { className: "rt-pane", style: { flex: 1, minHeight: 0 } },
      h2(
        "div",
        { className: "rt-card" },
        h2("h4", null, "Asset discovery timeline"),
        h2(
          "div",
          {
            style: { fontSize: 12, color: "var(--dsw-alias-label-secondary)" }
          },
          "Total " + (data.span && data.span.total || 0) + " hosts \xB7 Earliest " + (data.span && data.span.first ? fmt(data.span.first) : "\u2014") + " \xB7 Latest " + (data.span && data.span.last ? fmt(data.span.last) : "\u2014") + '(Discovery time = when the asset first entered the inventory; repeated collection only updates "Last collected")'
        )
      ),
      (data.days || []).length === 0 ? h2("div", { className: "rt-empty" }, "No assets yet.") : null,
      h2(
        "div",
        { className: "rt-card" },
        h2(
          "h4",
          null,
          "Daily statistics",
          day ? h2(
            "span",
            Object.assign(
              {
                className: "rt-tag",
                style: { marginLeft: 6, cursor: "pointer" }
              },
              clickable(() => setDay(""), {
                label: "Clear daily filter: " + day
              })
            ),
            "Clear filter: " + day
          ) : null
        ),
        h2(
          "div",
          { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
          (data.days || []).map(
            (d) => h2(
              "div",
              Object.assign(
                {
                  key: d.day,
                  className: "rt-seg" + (day === d.day ? " on" : ""),
                  style: { marginBottom: 0, cursor: "pointer" },
                  title: d.day + ": Added " + d.assets + " hosts (internal " + d.internal + " / external " + d.external + "\uFF09"
                },
                clickable(() => setDay(day === d.day ? "" : d.day), {
                  label: "Filter assets discovered on " + d.day,
                  expanded: day === d.day
                })
              ),
              h2("div", { className: "rt-seg-cidr" }, d.day),
              h2(
                "div",
                { className: "rt-seg-meta" },
                d.assets + " hosts \xB7 internal " + d.internal + " / external " + d.external
              )
            )
          )
        )
      ),
      h2(
        "div",
        { className: "rt-card" },
        h2(
          "h4",
          null,
          day ? "Assets discovered on " + day + " (" + recent.length + ")" : "Recently discovered assets (" + recent.length + ")"
        ),
        recent.length === 0 ? h2("div", { className: "rt-empty" }, "No new assets on this day.") : null,
        recent.map(
          (a) => h2(
            "div",
            { key: a.id, className: "rt-kv" },
            h2(
              "b",
              { className: "rt-mono", style: { minWidth: 110 } },
              h2(
                "span",
                {
                  className: "rt-scope rt-scope-" + (a.scope === "internal" ? "internal" : "external"),
                  style: { marginRight: 4 }
                },
                a.scope === "internal" ? "Internal" : "External"
              ),
              a.ip
            ),
            h2(
              "span",
              {
                style: {
                  minWidth: 132,
                  fontSize: 11.5,
                  color: "var(--dsw-alias-label-secondary)"
                }
              },
              a.discovered_at ? fmt(a.discovered_at) : "Time unknown"
            ),
            h2(
              "span",
              { style: { flex: 1 } },
              (a.primary_name || "\u2014") + (a.open_ports ? " \xB7 " + a.open_ports + " ports" : "")
            ),
            h2(PriTag, { p: a.priority })
          )
        )
      )
    );
  }
  function PromptsTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [roles, setRoles] = import_react2.default.useState([]);
    const [active, setActive] = import_react2.default.useState(null);
    const [draft, setDraft] = import_react2.default.useState("");
    const [msg, setMsg] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    import_react2.default.useEffect(() => {
      api(eng ? { op: "prompts", engagement: eng } : { op: "prompts" }).then(
        (r) => {
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Read failed" });
            return;
          }
          setRoles(r.roles || []);
          if (r.roles && r.roles.length)
            setActive((cur2) => cur2 || r.roles[0].role);
          if (r.builtin)
            setMsg({
              ok: "Currently using built-in default prompts (after creating an engagement you can save per-engagement changes)"
            });
        },
        (e) => setMsg({ err: String(e && e.message || e) })
      );
    }, [eng, refreshKey]);
    import_react2.default.useEffect(() => {
      const r = roles.find((x) => x.role === active);
      if (r) setDraft(r.content || "");
    }, [active, roles]);
    const save = () => {
      if (!eng) {
        setMsg({ err: "Create an engagement before saving prompts" });
        return;
      }
      setBusy(true);
      setMsg(null);
      api({
        op: "savePrompt",
        engagement: eng,
        role: active,
        content: draft
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Save failed" });
            return;
          }
          setRoles(
            (list) => list.map(
              (x) => x.role === active ? Object.assign({}, x, {
                content: draft,
                updated_at: (/* @__PURE__ */ new Date()).toISOString()
              }) : x
            )
          );
          setMsg({ ok: "Saved" });
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const reset = (all) => {
      if (!eng) {
        setMsg({ err: "Create an engagement before restoring default prompts" });
        return;
      }
      setBusy(true);
      setMsg(null);
      api({
        op: "resetPrompts",
        engagement: eng,
        role: all ? void 0 : active
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Restore failed" });
            return;
          }
          setMsg({ ok: "Restored built-in defaults: " + (r.reset || []).join(", ") });
          api({ op: "prompts", engagement: eng }).then(
            (rr) => {
              if (rr && rr.ok) {
                setRoles(rr.roles || []);
                const cur2 = (rr.roles || []).find((x) => x.role === active);
                if (cur2) setDraft(cur2.content || "");
              }
            },
            () => {
            }
          );
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const cur = roles.find((x) => x.role === active);
    const items = roles.map(
      (r) => h2(
        "div",
        Object.assign(
          {
            key: r.role,
            className: "rt-item" + (active === r.role ? " on" : "")
          },
          clickable(
            () => {
              setActive(r.role);
              setMsg(null);
            },
            {
              label: 'View prompt for "' + r.title + '"',
              expanded: active === r.role
            }
          )
        ),
        h2("div", { className: "rt-item-name" }, r.title),
        h2(
          "div",
          { className: "rt-item-desc" },
          (r.content || "").replace(/[#*`]/g, "").slice(0, 60) || "(empty)"
        )
      )
    );
    return h2(
      "div",
      { className: "rt-split" },
      h2("div", { className: "rt-list" }, items),
      h2(
        "div",
        { className: "rt-main" },
        h2(
          "div",
          { className: "rt-toolbar" },
          h2("span", { style: { fontWeight: 600 } }, cur ? cur.title : "Prompt"),
          h2(
            "span",
            { className: "rt-tag" },
            "Updated " + fmt(cur && cur.updated_at)
          ),
          h2("div", { className: "rt-spacer" }),
          h2(
            "button",
            {
              className: "rt-btn",
              disabled: busy || !active,
              title: "Restore this role to the latest built-in prompt",
              onClick: () => reset(false)
            },
            "Restore default for current"
          ),
          h2(
            "button",
            {
              className: "rt-btn",
              disabled: busy,
              title: "Restore all four roles to the latest built-in prompts",
              onClick: () => reset(true)
            },
            "Restore all defaults"
          ),
          h2(
            "button",
            {
              className: "rt-btn rt-btn-primary",
              disabled: busy || !active,
              onClick: save
            },
            busy ? "Saving\u2026" : "Save"
          )
        ),
        msg ? h2(
          "div",
          { className: msg.err ? "rt-err" : "rt-foot" },
          msg.err || msg.ok
        ) : null,
        h2(
          "div",
          { className: "rt-pane" },
          h2("textarea", {
            className: "rt-textarea",
            value: draft,
            spellCheck: false,
            onChange: (e) => setDraft(e.target.value),
            placeholder: "System prompt for this role (Markdown)"
          }),
          h2(
            "div",
            {
              style: {
                fontSize: 11,
                color: "var(--dsw-alias-label-secondary)",
                marginTop: 6
              }
            },
            "Saved to agents/" + (active || "role") + ".md. When a sub-session task starts with redteamRole: recon, assess, vuln-scan, exploit, or internal, the corresponding file is included in the system prompt."
          )
        )
      )
    );
  }
  function SkillsTab(props) {
    const refreshKey = props.refreshKey || 0;
    const [items, setItems] = import_react2.default.useState([]);
    const [meta, setMeta] = import_react2.default.useState({});
    const [err, setErr] = import_react2.default.useState(null);
    const [q, setQ] = import_react2.default.useState("");
    const [srcOnly, setSrcOnly] = import_react2.default.useState(false);
    const [active, setActive] = import_react2.default.useState(null);
    const [detail, setDetail] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [brokenOnly, setBrokenOnly] = import_react2.default.useState(false);
    const load = (force) => {
      setBusy(true);
      api({ op: "skillCatalog", refresh: force === true }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setMeta(r || {});
          setItems(r.items || []);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(load, [refreshKey]);
    const open = (skill) => {
      const name2 = skill && skill.name;
      const key = (skill && skill.library ? skill.library : "redteam") + ":" + name2;
      if (active === key) {
        setActive(null);
        setDetail(null);
        return;
      }
      setActive(key);
      setDetail(null);
      api({
        op: "skillRead",
        name: name2,
        library: skill.library || "redteam"
      }).then(
        (r) => {
          if (r && r.ok) setDetail(r);
          else setErr(r && r.error || "Read failed");
        },
        (e) => setErr(String(e && e.message || e))
      );
    };
    const needle = q.trim().toLowerCase();
    let filtered = needle ? items.filter(
      (s) => (s.name + " " + s.description + " " + s.whenToUse).toLowerCase().indexOf(needle) >= 0
    ) : items;
    if (srcOnly)
      filtered = filtered.filter(
        (s) => s.library !== "official" && s.fromPlugin === true
      );
    if (brokenOnly)
      filtered = filtered.filter(
        (s) => s.library !== "official" && (s.availability === "broken" || s.availability === "unknown")
      );
    const dirs = (meta.byDir || []).filter((d) => d.n > 0).slice(0, 6);
    const availSummary = meta.availability ? meta.availability.summary : null;
    const needRestart = err !== null && String(err).indexOf("unknown op") >= 0;
    const renderSkill = (s) => h2(
      "div",
      Object.assign(
        {
          key: (s.library || "redteam") + ":" + s.name,
          className: "rt-item" + (active === (s.library || "redteam") + ":" + s.name ? " on" : "")
        },
        clickable(() => open(s), {
          label: "View skill " + s.name,
          expanded: active === (s.library || "redteam") + ":" + s.name
        })
      ),
      h2(
        "div",
        { className: "rt-item-name" },
        s.name,
        s.modelInvocable === false ? h2(
          "span",
          { className: "rt-tag", style: { marginLeft: 6 } },
          "Manual only"
        ) : null,
        s.library === "official" ? h2(
          "span",
          {
            className: "rt-tag",
            style: { marginLeft: 6 },
            title: "Official skill directory; not checked against red-team tool paths"
          },
          "Official"
        ) : h2(
          "span",
          {
            className: "rt-avail rt-avail-" + (s.availability || "unknown"),
            style: { marginLeft: 6 },
            title: s.availability === "available" ? "Available: skill content can be loaded. Missing external tools or keys are noted in details and do not block invocation." : (s.problems || []).join("\n") || "Unknown"
          },
          s.availability === "available" ? "Available" : s.availability === "broken" ? "Unavailable" : "Unknown"
        ),
        h2(
          "div",
          { className: "rt-item-desc" },
          s.description || "(no description)"
        ),
        h2(
          "div",
          { className: "rt-kb-sub" },
          [
            s.source ? "Source " + s.source : null,
            s.fromPlugin ? "Bundled with this plugin" : null,
            s.provider ? s.provider : null,
            s.dir ? s.dir : null
          ].filter(Boolean).join(" \xB7 ")
        ),
        (s.problems || []).length > 0 && s.availability !== "available" && s.library !== "official" ? h2(
          "div",
          {
            className: "rt-kb-sub",
            style: {
              color: "var(--dsw-alias-state-warn-primary, #f59e0b)"
            }
          },
          "\u26A0 " + String(s.problems[0]).slice(0, 60)
        ) : null
      )
    );
    const redteamRows = filtered.filter((s) => s.library !== "official").map(renderSkill);
    const officialRows = filtered.filter((s) => s.library === "official").map(renderSkill);
    const listItems = [];
    if (redteamRows.length > 0) {
      listItems.push(
        h2(
          "div",
          {
            key: "head-redteam",
            className: "rt-kb-sub",
            style: { margin: "8px 0 4px", fontWeight: 600 }
          },
          "Red Team skills"
        )
      );
      listItems.push.apply(listItems, redteamRows);
    }
    if (officialRows.length > 0) {
      listItems.push(
        h2(
          "div",
          {
            key: "head-official",
            className: "rt-kb-sub",
            style: { margin: "8px 0 4px", fontWeight: 600 }
          },
          "Official skills"
        )
      );
      listItems.push.apply(listItems, officialRows);
    }
    return h2(
      "div",
      { className: "rt-split" },
      h2(
        "div",
        { className: "rt-list" },
        h2("input", {
          className: "rt-input",
          style: { width: "100%", marginBottom: 8, boxSizing: "border-box" },
          placeholder: "Filter skills",
          value: q,
          onChange: (e) => setQ(e.target.value)
        }),
        h2(
          "label",
          {
            className: "rt-kb-check",
            style: { display: "flex", margin: "0 0 6px" }
          },
          h2("input", {
            type: "checkbox",
            checked: srcOnly,
            onChange: (e) => setSrcOnly(e.target.checked)
          }),
          "Show only bundled with this plugin (" + (meta.fromPlugin || 0) + ")"
        ),
        availSummary && (availSummary.broken > 0 || availSummary.unknown > 0) ? h2(
          "label",
          {
            className: "rt-kb-check",
            style: { display: "flex", margin: "0 0 8px" },
            title: "Show only skills with clear gaps (missing key / local path / placeholder infrastructure) or unknown availability"
          },
          h2("input", {
            type: "checkbox",
            checked: brokenOnly,
            onChange: (e) => setBrokenOnly(e.target.checked)
          }),
          "Show only unavailable/unknown (" + ((availSummary.broken || 0) + (availSummary.unknown || 0)) + ")"
        ) : null,
        availSummary ? h2(
          "div",
          {
            style: {
              display: "flex",
              gap: 4,
              flexWrap: "wrap",
              marginBottom: 6
            }
          },
          h2(
            "span",
            { className: "rt-avail rt-avail-available" },
            "Available " + (availSummary.available || 0)
          ),
          availSummary.broken > 0 ? h2(
            "span",
            { className: "rt-avail rt-avail-broken" },
            "Unavailable " + availSummary.broken
          ) : null,
          availSummary.unknown > 0 ? h2(
            "span",
            { className: "rt-avail rt-avail-unknown" },
            "Unknown " + availSummary.unknown
          ) : null,
          h2(
            "span",
            Object.assign(
              {
                className: "rt-tag",
                style: { cursor: "pointer" },
                title: "Skill content or environment variables changed? Click to skip the 30s cache and recheck"
              },
              clickable(() => load(true), { label: "Recheck skill availability" })
            ),
            "Recheck availability"
          )
        ) : null,
        h2(
          "div",
          {
            style: {
              fontSize: 11,
              color: "var(--dsw-alias-label-secondary)",
              marginBottom: 6
            }
          },
          "Red Team " + (meta.libraries && meta.libraries.redteam || 0) + " \xB7 Official " + (meta.libraries && meta.libraries.official || 0),
          items.length > 100 ? h2(
            "div",
            { style: { marginTop: 3 } },
            "(Most skills come from roots registered by other plugins or your own skill directories; this plugin bundles only " + (meta.fromPlugin || 0) + ")"
          ) : null
        ),
        listItems
      ),
      h2(
        "div",
        { className: "rt-main" },
        h2(
          "div",
          { className: "rt-toolbar" },
          h2(
            "span",
            { style: { fontWeight: 600 } },
            detail ? detail.name : "Skill directory (DSH native)"
          ),
          h2("div", { className: "rt-spacer" }),
          h2(
            "button",
            { className: "rt-btn", disabled: busy, onClick: () => load(true) },
            busy ? "Refreshing\u2026" : "Refresh"
          )
        ),
        err ? needRestart ? h2(
          "div",
          { className: "rt-empty" },
          "Host code for this module has been updated; restart the current host (official exe / community edition / dsh web) once for changes to take effect"
        ) : h2("div", { className: "rt-err" }, err) : null,
        detail ? h2(
          "div",
          { className: "rt-pane" },
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Description"),
            h2("span", null, detail.description || "\u2014")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "When to use"),
            h2("span", null, detail.whenToUse || "\u2014")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Source"),
            h2(
              "span",
              null,
              (detail.provider || "\u2014") + " / " + (detail.source || "\u2014")
            )
          ),
          (() => {
            const s2 = items.find(
              (x) => (x.library || "redteam") + ":" + x.name === active
            );
            if (!s2) return null;
            if (s2.library === "official") {
              return h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Type"),
                h2(
                  "span",
                  null,
                  "Official skill. Invoked by the host per task; not checked against red-team tool paths."
                )
              );
            }
            const avail = s2.availability || "unknown";
            return h2(
              "div",
              null,
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Availability"),
                h2(
                  "span",
                  { className: "rt-avail rt-avail-" + avail },
                  avail === "available" ? "Available" : avail === "broken" ? "Unavailable (clear gaps)" : "Unknown (content unreadable)"
                )
              ),
              (s2.problems || []).length > 0 ? h2(
                "div",
                { className: "rt-kv" },
                h2(
                  "b",
                  null,
                  avail === "available" ? "Missing external tools" : "Gaps"
                ),
                h2(
                  "span",
                  null,
                  s2.problems.map(
                    (x, i) => h2("div", { key: "p" + i }, "\xB7 " + x)
                  )
                )
              ) : null,
              (s2.needs_user || []).length > 0 ? h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "You need to provide"),
                h2(
                  "span",
                  {
                    style: {
                      color: "var(--dsw-alias-state-warn-primary, #f59e0b)"
                    }
                  },
                  s2.needs_user.map(
                    (x, i) => h2("div", { key: "n" + i }, "\xB7 " + x)
                  )
                )
              ) : null
            );
          })(),
          detail.path ? h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "File"),
            h2(
              "span",
              {
                className: "rt-mono",
                style: { wordBreak: "break-all" }
              },
              detail.path
            )
          ) : null,
          h2(
            "pre",
            {
              className: "rt-md",
              style: {
                border: "1px solid var(--dsw-alias-border-l1)",
                borderRadius: 6,
                maxHeight: "52vh"
              }
            },
            detail.content || "(empty)"
          )
        ) : h2(
          "div",
          { className: "rt-pane" },
          h2(
            "div",
            {
              style: {
                fontSize: 12,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 8
              }
            },
            meta.note || "Skills are managed by the DSH native skill system; Red Team agents invoke them through the skill tool."
          ),
          availSummary ? h2(
            "div",
            {
              style: {
                fontSize: 12,
                marginBottom: 8,
                display: "flex",
                gap: 6,
                flexWrap: "wrap",
                alignItems: "center"
              }
            },
            h2(
              "span",
              { className: "rt-avail rt-avail-available" },
              "Available " + (availSummary.available || 0)
            ),
            availSummary.broken > 0 ? h2(
              "span",
              { className: "rt-avail rt-avail-broken" },
              "Unavailable " + availSummary.broken
            ) : null,
            availSummary.unknown > 0 ? h2(
              "span",
              { className: "rt-avail rt-avail-unknown" },
              "Unknown " + availSummary.unknown
            ) : null,
            h2(
              "span",
              { style: { color: "var(--dsw-alias-label-secondary)" } },
              "\uFF08" + (meta.availability && meta.availability.cached ? "Cached at " : "Checked at ") + (meta.availability && meta.availability.checked_at ? fmt(meta.availability.checked_at) : "\u2014") + "\uFF09"
            )
          ) : null,
          meta.availability && (meta.availability.broken || []).length > 0 ? h2(
            "div",
            { className: "rt-hint" },
            h2(
              "div",
              { style: { fontWeight: 600, marginBottom: 4 } },
              "Skills that cannot run right now:"
            ),
            meta.availability.broken.slice(0, 12).map(
              (b) => h2(
                "div",
                { key: b.name },
                "\xB7 " + b.name + (b.problems && b.problems.length ? " \u2014 " + b.problems[0] : "")
              )
            )
          ) : null,
          (meta.byDir || []).slice(0, 6).map(
            (d) => h2(
              "div",
              {
                key: d.key,
                className: "rt-mono",
                style: {
                  fontSize: 11,
                  marginBottom: 2,
                  overflowWrap: "anywhere"
                }
              },
              d.n + " \xB7 " + d.key
            )
          ),
          (meta.byDir || []).length > 6 ? h2(
            "div",
            {
              style: {
                fontSize: 11,
                color: "var(--dsw-alias-label-secondary)"
              }
            },
            "\u2026and " + ((meta.byDir || []).length - 6) + " more directories (" + items.length + " skills total)"
          ) : null,
          h2("div", { className: "rt-empty" }, "Select a skill on the left to view its content")
        )
      )
    );
  }
  const SEV_LABEL = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Info"
  };
  const STATUS_LABEL = {
    candidate: "To verify",
    confirmed: "Confirmed",
    "false-positive": "False positive",
    exploited: "Exploited",
    fixed: "Fixed"
  };
  const sevClass = (s) => "rt-sev rt-sev-" + (SEV_LABEL[s] ? s : "info");
  function targetKeyOf(v) {
    const t = String(v.target || "").trim();
    if (t !== "") {
      const url = /^([a-z][a-z0-9+.-]*:\/\/[^/?#\s]+)/i.exec(t);
      if (url) return url[1];
      const head = /^([^\s/?#]+)/.exec(t);
      if (head) return head[1];
      return t;
    }
    return v.asset_ip || "(No target specified)";
  }
  function HttpBlock(props) {
    const text = String(props.text || "");
    if (!text) return null;
    const lines = text.split(/\r?\n/);
    const nodes = lines.map((ln, i) => {
      let cls = null;
      if (i === 0 && /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|TRACE)\s/.test(ln))
        cls = "rt-hl-req";
      else if (i === 0 && /^HTTP\//.test(ln)) cls = "rt-hl-res";
      else if (/^[A-Za-z0-9-]+:/.test(ln)) {
        const name2 = ln.split(":")[0].toLowerCase();
        if (name2 === "host" || name2 === "cookie" || name2 === "authorization" || name2 === "content-type")
          cls = "rt-hl-req";
      }
      return h2(
        "div",
        { key: "l" + i, className: cls || void 0 },
        ln === "" ? "\xA0" : ln
      );
    });
    return h2(
      "pre",
      { className: "rt-evi-body" + (props.compact ? " req" : "") },
      nodes
    );
  }
  function detailEvidence(v) {
    const evi = String(v.evidence || "").trim();
    const looksHttp = /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|HTTP\/)/m.test(evi) || /\n[A-Za-z-]+: /.test(evi);
    const blocks = [];
    if (evi) {
      blocks.push(
        h2(
          "div",
          { key: "ev", className: "rt-evi" },
          h2(
            "div",
            { className: "rt-evi-head" },
            "Evidence summary",
            h2("span", { className: "rt-tag" }, looksHttp ? "Raw message" : "Text"),
            h2("div", { className: "rt-spacer" }),
            h2(
              "button",
              {
                className: "rt-btn",
                style: { padding: "0 6px", fontSize: 11 },
                onClick: (e) => {
                  e.stopPropagation();
                  copyText(evi);
                }
              },
              "Copy"
            )
          ),
          looksHttp ? h2(HttpBlock, { text: evi }) : h2("pre", { className: "rt-evi-body" }, evi)
        )
      );
    }
    const http = v.http_evidence || [];
    for (const e of http) {
      blocks.push(
        h2(
          "div",
          { key: "h" + e.id, className: "rt-evi" },
          h2(
            "div",
            { className: "rt-evi-head" },
            e.label || "HTTP evidence",
            h2(
              "span",
              { className: "rt-tag" },
              (e.method || "") + " " + (e.status === null || e.status === void 0 ? "" : e.status)
            ),
            h2("div", { className: "rt-spacer" }),
            h2(
              "span",
              {
                style: {
                  fontWeight: 400,
                  color: "var(--dsw-alias-label-secondary)"
                }
              },
              fmt(e.captured_at || e.created_at)
            )
          ),
          e.request ? h2(
            "div",
            null,
            h2(
              "div",
              { className: "rt-evi-head", style: { borderTop: "none" } },
              "\u25B8 Request (paste directly into Burp Repeater)"
            ),
            h2(HttpBlock, { text: e.request, compact: true })
          ) : null,
          e.response ? h2(
            "div",
            null,
            h2("div", { className: "rt-evi-head" }, "\u25B8 Response"),
            h2(HttpBlock, { text: e.response })
          ) : null,
          e.note ? h2(
            "pre",
            { className: "rt-evi-body", style: { maxHeight: 80 } },
            e.note
          ) : null
        )
      );
    }
    if (blocks.length === 0) {
      blocks.push(
        h2(
          "div",
          { key: "none", className: "rt-kv" },
          h2("b", null, "Evidence"),
          h2(
            "span",
            { style: { color: "var(--dsw-alias-state-error-primary)" } },
            "Missing \u2014 unverified/vulnerabilities without evidence are excluded from reports; add with redteam_http_evidence_add"
          )
        )
      );
    }
    return h2("div", { key: "eviwrap" }, blocks);
  }
  function FindingsTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [sev, setSev] = import_react2.default.useState("");
    const [status, setStatus] = import_react2.default.useState("");
    const [q, setQ] = import_react2.default.useState("");
    const [qApplied, setQApplied] = import_react2.default.useState("");
    const [state, setState] = import_react2.default.useState({
      loading: false,
      error: null,
      total: 0,
      items: [],
      stats: null
    });
    const [creds, setCreds] = import_react2.default.useState([]);
    const [accesses, setAccesses] = import_react2.default.useState([]);
    const [files, setFiles] = import_react2.default.useState([]);
    const [openId, setOpenId] = import_react2.default.useState(null);
    const [msg, setMsg] = import_react2.default.useState(null);
    const [subTab, setSubTab] = import_react2.default.useState("vulns");
    const [grouped, setGrouped] = import_react2.default.useState(true);
    const collapse = useCollapse("findings:" + eng);
    const load = () => {
      if (!eng) return;
      api({
        op: "vulns",
        engagement: eng,
        severity: sev || void 0,
        status: status || void 0,
        q: qApplied || void 0,
        limit: 200
      }).then(
        (r) => {
          if (!r || r.ok === false) {
            setState({
              loading: false,
              error: r && r.error || "Query failed",
              total: 0,
              items: [],
              stats: null
            });
            return;
          }
          setState({
            loading: false,
            error: null,
            total: r.total,
            items: r.items || [],
            stats: r.stats || null
          });
        },
        (e) => setState({
          loading: false,
          error: String(e && e.message || e),
          total: 0,
          items: [],
          stats: null
        })
      );
      api({ op: "credentials", engagement: eng }).then(
        (r) => setCreds(r && r.items || []),
        () => {
        }
      );
      api({ op: "access", engagement: eng }).then(
        (r) => setAccesses(r && r.items || []),
        () => {
        }
      );
      api({ op: "attackFiles", engagement: eng }).then(
        (r) => setFiles(r && r.items || []),
        () => {
        }
      );
    };
    import_react2.default.useEffect(load, [eng, sev, status, qApplied, refreshKey]);
    const setVulnStatus = (id, next) => {
      setMsg(null);
      api({
        op: "updateVuln",
        engagement: eng,
        id,
        patch: { status: next }
      }).then(
        (r) => {
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Update failed" });
            return;
          }
          setMsg({ ok: 'Updated to "' + (STATUS_LABEL[next] || next) + '"' });
          load();
        },
        (e) => setMsg({ err: String(e && e.message || e) })
      );
    };
    const stats = state.stats && state.stats.bySeverity ? state.stats : { bySeverity: {}, byStatus: {} };
    const needRestart = state.error !== null && String(state.error).indexOf("unknown op") >= 0;
    const allFiles = (files || []).flatMap(
      (g) => (g.files || []).map((f) => Object.assign({ target: g.target }, f))
    );
    const filesByVuln = /* @__PURE__ */ new Map();
    const orphanFiles = [];
    for (const f of allFiles) {
      const vid = f.vuln_id === null || f.vuln_id === void 0 ? null : Number(f.vuln_id);
      if (vid === null) {
        orphanFiles.push(f);
        continue;
      }
      if (!filesByVuln.has(vid)) filesByVuln.set(vid, []);
      filesByVuln.get(vid).push(f);
    }
    const concl = (key, label, value, active, onClick) => h2(
      "span",
      Object.assign(
        {
          key,
          className: "rt-concl-i" + (active ? " on" : ""),
          title: "Click to filter / click again to clear"
        },
        clickable(onClick, {
          label: 'Filter by "' + label + '" (' + (value || 0) + ")",
          expanded: active
        })
      ),
      h2("b", null, String(value || 0)),
      h2("span", null, label)
    );
    const conclusion = h2(
      "div",
      { className: "rt-concl" },
      concl(
        "conf",
        "Confirmed",
        stats.byStatus.confirmed || 0,
        status === "confirmed",
        () => setStatus((v) => v === "confirmed" ? "" : "confirmed")
      ),
      concl(
        "exp",
        "Exploited",
        stats.byStatus.exploited || 0,
        status === "exploited",
        () => setStatus((v) => v === "exploited" ? "" : "exploited")
      ),
      concl(
        "crit",
        "Critical",
        stats.bySeverity.critical || 0,
        sev === "critical",
        () => setSev((v) => v === "critical" ? "" : "critical")
      ),
      concl(
        "high",
        "High",
        stats.bySeverity.high || 0,
        sev === "high",
        () => setSev((v) => v === "high" ? "" : "high")
      ),
      concl(
        "med",
        "Medium",
        stats.bySeverity.medium || 0,
        sev === "medium",
        () => setSev((v) => v === "medium" ? "" : "medium")
      ),
      concl("gain", "Access gained", stats.withGained || 0, false, () => {
      }),
      h2("div", { className: "rt-spacer" }),
      h2(
        "span",
        { style: { fontSize: 11, color: "var(--dsw-alias-label-secondary)" } },
        "Grouped by target by default \xB7 " + (stats.targetGroups || 0) + " targets total"
      )
    );
    const head = h2(
      "div",
      { className: "rt-vrow head" },
      h2("span", null, "Severity"),
      h2("span", null, "Vulnerability / ID"),
      h2("span", null, "Target"),
      h2("span", null, "What was gained"),
      h2("span", null, "Status"),
      h2("span", null, "Confidence")
    );
    const vulnRows = (v, compact) => {
      const out = [];
      const gainedList = String(v.gained || "").split(/[、,;，；]/).map((x) => x.trim()).filter(Boolean);
      const open = openId === v.id;
      out.push(
        h2(
          "div",
          {
            key: "v" + v.id,
            className: "rt-vrow",
            role: "button",
            tabIndex: 0,
            style: compact ? {
              cursor: "pointer",
              gridTemplateColumns: "58px minmax(0,1fr) 104px 68px"
            } : { cursor: "pointer" },
            onClick: () => setOpenId(open ? null : v.id),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenId(open ? null : v.id);
              }
            }
          },
          h2(
            "span",
            null,
            h2(
              "span",
              { className: sevClass(v.severity) },
              SEV_LABEL[v.severity] || v.severity
            )
          ),
          h2(
            "span",
            { title: v.title || "" },
            h2("span", { className: "rt-sec-caret" }, open ? "\u25BE" : "\u25B8"),
            (v.cve ? v.cve + " " : "") + (v.title || "")
          ),
          compact ? null : h2(
            "span",
            { className: "rt-mono", title: v.target || "" },
            v.target || v.asset_ip || "\u2014"
          ),
          h2(
            "span",
            { title: v.gained || "" },
            gainedList.length ? h2(
              "span",
              {
                className: "rt-gain",
                style: {
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  display: "inline-block"
                }
              },
              gainedList[0] + (gainedList.length > 1 ? " +" + (gainedList.length - 1) : "")
            ) : h2(
              "span",
              { style: { color: "var(--dsw-alias-label-secondary)" } },
              "\u2014"
            )
          ),
          h2(
            "span",
            null,
            h2(
              "span",
              { className: "rt-tag" },
              STATUS_LABEL[v.status] || v.status
            )
          ),
          compact ? null : h2(
            "span",
            null,
            v.confidence === null || v.confidence === void 0 ? "\u2014" : Math.round(v.confidence * 100) + "%"
          )
        )
      );
      if (openId !== v.id) return out;
      out.push(
        h2(
          "div",
          {
            key: "vd" + v.id,
            className: "rt-vrow",
            style: { cursor: "default", gridTemplateColumns: "1fr" }
          },
          h2(
            "div",
            { className: "rt-vdetail" },
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "What was gained"),
              gainedList.length ? h2(
                "span",
                null,
                gainedList.map(
                  (g, gi) => h2(
                    "span",
                    {
                      key: "g" + gi,
                      className: "rt-gain",
                      style: { marginRight: 6 }
                    },
                    g
                  )
                )
              ) : h2(
                "span",
                { style: { color: "var(--dsw-alias-label-secondary)" } },
                "Not recorded \u2014 after gaining access/results, update gained via redteam_vuln_update (e.g. server access, internal tunnel, admin account)"
              )
            ),
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Target"),
              h2(
                "span",
                { className: "rt-mono", style: { wordBreak: "break-all" } },
                v.target || "\u2014"
              )
            ),
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Asset"),
              h2(
                "span",
                null,
                (v.asset_ip || "\u2014") + " \xB7 " + (v.segment_cidr || "")
              )
            ),
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Source"),
              h2(
                "span",
                null,
                (v.source || "\u2014") + " \xB7 " + (v.found_by_agent || "\u2014") + " \xB7 " + fmt(v.found_at)
              )
            ),
            detailEvidence(v),
            (() => {
              const mine = filesByVuln.get(Number(v.id)) || [];
              return h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Attack files"),
                mine.length ? h2(
                  "span",
                  null,
                  mine.map(
                    (f, fi) => h2(
                      "div",
                      { key: "af" + fi, style: { marginBottom: 3 } },
                      "\xB7 " + (f.kind ? "[" + f.kind + "] " : "") + (f.name || "(unnamed)") + (f.description ? " \u2014 " + f.description : ""),
                      h2(
                        "div",
                        {
                          className: "rt-mono",
                          style: {
                            fontSize: 11,
                            marginLeft: 12,
                            color: "var(--dsw-alias-label-secondary)",
                            overflowWrap: "anywhere"
                          }
                        },
                        f.path || ""
                      )
                    )
                  )
                ) : h2(
                  "span",
                  { style: { color: "var(--dsw-alias-label-secondary)" } },
                  "(None) Use redteam_attack_file_add to archive scripts/webshells/exploits used for this vulnerability and include vuln_id"
                )
              );
            })(),
            h2(
              "div",
              { className: "rt-actions" },
              h2(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "confirmed");
                  }
                },
                "Confirm"
              ),
              h2(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "exploited");
                  }
                },
                "Exploited"
              ),
              h2(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "false-positive");
                  }
                },
                "False positive"
              ),
              h2(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "fixed");
                  }
                },
                "Fixed"
              )
            )
          )
        )
      );
      return out;
    };
    const rows = [];
    if (grouped) {
      const groups = /* @__PURE__ */ new Map();
      for (const v of state.items) {
        const key = targetKeyOf(v);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
      }
      const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const list = Array.from(groups.entries()).map(([key, vs]) => ({
        key,
        vulns: vs,
        top: vs.slice().sort(
          (a, b) => (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9)
        )[0],
        gained: Array.from(
          new Set(
            vs.flatMap(
              (v) => String(v.gained || "").split(/[、,;，；]/).map((x) => x.trim()).filter(Boolean)
            )
          )
        ),
        exploited: vs.filter((v) => v.status === "exploited").length
      })).sort(
        (a, b) => (SEV_RANK[a.top.severity] ?? 9) - (SEV_RANK[b.top.severity] ?? 9) || b.vulns.length - a.vulns.length
      );
      for (const g of list) {
        const key = "target:" + g.key;
        const defOpen = false;
        rows.push(
          h2(
            Section,
            {
              key: "sec:" + g.key,
              tone: "target",
              title: g.key,
              count: g.vulns.length + " vulnerabilities",
              sub: [
                SEV_LABEL[g.top.severity] || g.top.severity,
                g.exploited ? "Exploited " + g.exploited : null,
                g.top.asset_ip && g.top.asset_ip !== g.key ? "Asset " + g.top.asset_ip : null
              ].filter(Boolean).join(" \xB7 "),
              right: g.gained.length ? g.gained.slice(0, 2).join(" / ") + (g.gained.length > 2 ? " +" + (g.gained.length - 2) : "") : "Access not recorded",
              open: collapse.isOpen(key, defOpen),
              onToggle: collapse.toggle(key, defOpen)
            },
            g.vulns.map((v) => vulnRows(v, true))
          )
        );
      }
      if (!list.length && !state.loading && !state.error) {
        rows.push(
          h2("div", { key: "none", className: "rt-empty" }, "No vulnerability records")
        );
      }
    } else {
      for (const v of state.items) rows.push(...vulnRows(v));
    }
    const toolbar = h2(
      "div",
      { className: "rt-toolbar" },
      h2("input", {
        className: "rt-input",
        style: { flex: "1 1 140px" },
        placeholder: "Search title / CVE / target (Enter)",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setQApplied(q);
        }
      }),
      h2(
        "button",
        { className: "rt-btn", onClick: () => setQApplied(q) },
        "Search"
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: sev,
          onChange: (e) => setSev(e.target.value)
        },
        h2("option", { value: "" }, "All severities"),
        h2("option", { value: "critical" }, "Critical"),
        h2("option", { value: "high" }, "High"),
        h2("option", { value: "medium" }, "Medium"),
        h2("option", { value: "low" }, "Low"),
        h2("option", { value: "info" }, "Info")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: status,
          onChange: (e) => setStatus(e.target.value)
        },
        h2("option", { value: "" }, "All statuses"),
        h2("option", { value: "candidate" }, "To verify"),
        h2("option", { value: "confirmed" }, "Confirmed"),
        h2("option", { value: "exploited" }, "Exploited"),
        h2("option", { value: "false-positive" }, "False positive"),
        h2("option", { value: "fixed" }, "Fixed")
      )
    );
    const credSection = h2(
      "div",
      null,
      h2(
        "div",
        { className: "rt-section" },
        "Credentials \xB7 " + creds.length + (creds.length ? " (shown in plaintext; be careful with screen sharing/recording)" : "")
      ),
      creds.length ? h2(
        "div",
        { style: { padding: "4px 10px 0" } },
        creds.map(
          (c) => h2(
            "div",
            { key: "c" + c.id, className: "rt-cred" },
            h2(
              "div",
              { className: "rt-cred-head" },
              h2("span", { className: "rt-cred-host" }, c.host),
              c.username ? h2("span", { className: "rt-tag" }, c.username) : null,
              h2(
                "span",
                { className: "rt-tag rt-tag-passive" },
                c.secret_type || "password"
              ),
              c.privilege ? h2(
                "span",
                { className: "rt-tag rt-tag-active" },
                c.privilege
              ) : null,
              h2("div", { className: "rt-spacer" }),
              h2(
                "button",
                {
                  className: "rt-btn",
                  style: { padding: "0 6px", fontSize: 11 },
                  onClick: (e) => {
                    e.stopPropagation();
                    copyText(String(c.secret_value || ""));
                  }
                },
                "Copy"
              )
            ),
            c.secret_value ? h2(
              "div",
              { className: "rt-secret", title: "Click to select all" },
              c.secret_value
            ) : h2(
              "div",
              { className: "rt-secret-none" },
              "Plaintext not recorded \u2014 add secret_value via redteam_credential_add so the panel can display it"
            ),
            h2(
              "div",
              { className: "rt-cred-meta" },
              [
                c.source ? "Source " + c.source : null,
                c.tool ? "Tool " + c.tool : null,
                c.secret_ref ? "Evidence " + c.secret_ref : null,
                c.found_by_agent ? "by " + c.found_by_agent : null,
                c.found_at ? fmt(c.found_at) : null
              ].filter(Boolean).join(" \xB7 ")
            ),
            c.note ? h2("div", { className: "rt-cred-meta" }, "Notes: " + c.note) : null
          )
        )
      ) : h2(
        "div",
        { className: "rt-empty" },
        "No credentials yet (after obtaining passwords/keys/hashes, store them with redteam_credential_add for instant reuse)"
      )
    );
    const accessSection = h2(
      "div",
      null,
      h2(
        "div",
        { className: "rt-section" },
        "Access sessions obtained \xB7 " + accesses.length
      ),
      accesses.length ? accesses.map(
        (a) => h2(
          "div",
          {
            key: "a" + a.id,
            className: "rt-vrow",
            style: {
              cursor: "default",
              gridTemplateColumns: "1fr 110px 80px 80px 1fr"
            }
          },
          h2("span", { className: "rt-mono" }, a.host),
          h2("span", null, a.username || "\u2014"),
          h2(
            "span",
            null,
            h2(
              "span",
              { className: "rt-tag rt-tag-active" },
              a.method || "\u2014"
            )
          ),
          h2("span", null, a.privilege || "\u2014"),
          h2(
            "span",
            { className: "rt-mono", title: a.session_ref || "" },
            a.session_ref || "\u2014"
          )
        )
      ) : h2("div", { className: "rt-empty" }, "None")
    );
    const subTabBtn = (key, label, n) => h2(
      "span",
      Object.assign(
        {
          className: "rt-subtab" + (subTab === key ? " on" : "")
        },
        clickable(() => setSubTab(key), {
          label: label + "\uFF08" + n + "\uFF09",
          expanded: subTab === key
        })
      ),
      label + " " + n
    );
    return h2(
      "div",
      { className: "rt-main" },
      toolbar,
      conclusion,
      h2(
        "div",
        { className: "rt-subtabs" },
        subTabBtn("vulns", "Vulnerabilities", state.total || 0),
        subTabBtn("files", "Attack files", allFiles.length),
        subTabBtn("creds", "Credentials", creds.length),
        subTabBtn("access", "Access sessions", accesses.length),
        h2("div", { className: "rt-spacer" }),
        grouped ? h2(
          "button",
          {
            className: "rt-btn",
            title: "Expand all targets",
            onClick: () => collapse.setAll(
              (state.items || []).map((v) => "target:" + targetKeyOf(v)),
              true
            )
          },
          "Expand all"
        ) : null,
        grouped ? h2(
          "button",
          {
            className: "rt-btn",
            title: "Collapse all targets",
            onClick: () => collapse.setAll(
              (state.items || []).map((v) => "target:" + targetKeyOf(v)),
              false
            )
          },
          "Collapse all"
        ) : null,
        h2(
          "button",
          {
            className: "rt-btn" + (grouped ? " rt-btn-primary" : ""),
            title: grouped ? "Current: grouped by target (see what was compromised on each host first)" : "Current: flat list of vulnerabilities",
            onClick: () => setGrouped((g) => !g)
          },
          grouped ? "Group by target" : "Flat list"
        )
      ),
      msg ? h2(
        "div",
        { className: msg.err ? "rt-err" : "rt-foot" },
        msg.err || msg.ok
      ) : null,
      needRestart ? h2(
        "div",
        { className: "rt-empty" },
        "Host code for this module has been updated; restart the current host (official exe / community edition / dsh web) once for changes to take effect"
      ) : null,
      state.error && !needRestart ? h2("div", { className: "rt-err" }, state.error) : null,
      subTab === "files" ? h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        h2(
          "div",
          { className: "rt-hint", style: { marginBottom: 8 } },
          'Attack files are organized by engagement directory (formerly the "Attack files" tab); related files for each vulnerability can also be viewed in its details.' + (orphanFiles.length ? " Currently " + orphanFiles.length + " files are missing vuln_id; add it to associate them with vulnerabilities." : "")
        ),
        h2(AttackFilesTab, { engagement: eng, refreshKey })
      ) : subTab === "creds" ? h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        credSection
      ) : subTab === "access" ? h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        accessSection
      ) : h2(
        "div",
        { className: "rt-table" },
        grouped ? null : head,
        rows,
        !state.loading && !state.items.length && !state.error ? h2("div", { className: "rt-empty" }, "No vulnerability records") : null
      )
    );
  }
  const STAGE_LABEL = {
    recon: "Reconnaissance",
    vuln: "Vulnerability discovery",
    exploit: "Exploitation",
    access: "Access gained",
    pivot: "Internal network pivot",
    data: "Sensitive data",
    other: "Other"
  };
  function ChainTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [loading, setLoading] = import_react2.default.useState(false);
    const [view, setView] = import_react2.default.useState("A");
    const [openId, setOpenId] = import_react2.default.useState(null);
    const load = () => {
      if (!eng) return;
      setLoading(true);
      api({ op: "scoreChain", engagement: eng }).then(
        (r) => {
          setLoading(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => {
          setLoading(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(load, [eng, refreshKey]);
    const stages = data && data.stages || [];
    const summary = data && data.summary || null;
    const toggle = (id) => setOpenId((cur) => cur === id ? null : id);
    const CIRCLED = ["\u2460", "\u2461", "\u2462", "\u2463", "\u2464", "\u2465"];
    const hitDetail = (x) => h2(
      "div",
      { className: "rt-flow-detail" },
      h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "Target"),
        h2(
          "span",
          { className: "rt-mono", style: { wordBreak: "break-all" } },
          x.target || "\u2014"
        )
      ),
      x.asset_ip ? h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "Asset"),
        h2("span", { className: "rt-mono" }, x.asset_ip)
      ) : null,
      x.vuln_title ? h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "Exploited vulnerability"),
        h2(
          "span",
          null,
          [x.vuln_cve, x.vuln_title].filter(Boolean).join(" ")
        )
      ) : null,
      h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "Count"),
        h2(
          "span",
          null,
          "Occurrence #" + x.nth_of_point + " \xB7 +" + (x.points || 0) + " pts"
        )
      ),
      h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "Record"),
        h2(
          "span",
          null,
          fmt(x.recorded_at) + (x.recorded_by ? " \xB7 " + x.recorded_by : "")
        )
      ),
      x.evidence ? h2(Clip, { label: "Result and evidence", text: x.evidence }) : null
    );
    const hitRow = (x) => h2(
      "div",
      {
        key: "h" + x.id,
        className: "rt-ap-hit" + (openId === x.id ? " open" : ""),
        role: "button",
        tabIndex: 0,
        onClick: () => toggle(x.id),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle(x.id);
          }
        }
      },
      h2(
        "div",
        { className: "rt-ap-hit-head" },
        h2(
          "span",
          {
            className: "rt-ap-pts" + (x.counted ? "" : " uncounted"),
            title: x.capped_reason || void 0
          },
          "+" + (x.counted ? x.points || 0 : 0)
        ),
        h2("span", { className: "rt-ap-hit-name" }, x.point_name),
        x.capped ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: x.capped_reason || "Only the highest-scoring entry counts for the same asset and port"
          },
          "Service cap reached \xB7 not counted"
        ) : null,
        x.nth_of_point > 1 ? h2(
          "span",
          { className: "rt-ap-nth" },
          "#" + x.nth_of_point
        ) : null,
        h2(
          "span",
          { className: "rt-ap-hit-target" },
          x.target || x.asset_ip || "\u2014"
        )
      ),
      x.action ? h2(
        "div",
        {
          className: "rt-ap-act" + (x.action_inferred ? " inferred" : "")
        },
        "Action: " + (x.action.title || "(Unnamed step)") + (x.action_inferred ? " (inferred)" : "")
      ) : null,
      openId === x.id ? hitDetail(x) : null
    );
    const assetRow = (a) => h2(
      "div",
      { key: "a" + a.id, className: "rt-ap-asset" },
      h2(
        "span",
        {
          className: "rt-scope rt-scope-" + (a.scope === "internal" ? "internal" : "external")
        },
        a.scope === "internal" ? "Internal" : "External"
      ),
      h2("span", { className: "rt-mono", style: { fontWeight: 600 } }, a.ip),
      a.segment_cidr ? h2("span", { className: "rt-ap-nth" }, a.segment_cidr) : null,
      h2("span", { className: "rt-ap-nth" }, "Ports " + (a.open_ports || 0)),
      a.vulns ? h2("span", { className: "rt-ap-nth" }, "Vulns " + a.vulns) : null,
      a.priority ? h2("span", { className: "rt-tag" }, "Ease " + a.priority) : null,
      h2("div", { className: "rt-spacer" }),
      h2("span", { className: "rt-ap-pts" }, "+" + (a.points || 0) + " pts"),
      h2("span", { className: "rt-ap-nth" }, (a.hits || 0) + " hits")
    );
    const stageA = (st, i) => {
      const isRecon = st.code === "recon";
      const body = [];
      if (isRecon) {
        body.push(
          h2(
            "div",
            { key: "at", className: "rt-ap-sub" },
            "Assets with points \xB7 " + st.assetCount + " hosts"
          )
        );
        body.push(
          h2(
            "div",
            { key: "al", className: "rt-ap-assets" },
            st.assets.length ? st.assets.map(assetRow) : h2("div", { className: "rt-ap-none" }, "No assets with points yet")
          )
        );
      } else {
        body.push(
          h2(
            "div",
            { key: "ht", className: "rt-ap-sub" },
            "Hits in this stage " + st.hits + " times" + (st.points ? " \xB7 +" + st.points + " pts" : "")
          )
        );
        body.push(
          h2(
            "div",
            { key: "hl", className: "rt-ap-hits" },
            st.items.length ? st.items.map(hitRow) : h2("div", { className: "rt-ap-none" }, "No points in this stage yet")
          )
        );
        if (st.code === "boundary") {
          const selfOnly = (st.tunnels_self_only || []).length;
          body.push(
            h2(
              "div",
              { key: "tt", className: "rt-ap-sub" },
              "Boundary-crossing channels \xB7 " + st.tunnels.length + " items" + (selfOnly ? " (another " + selfOnly + " channels only on your own VPS/self-hosted server, not a breach)" : "")
            )
          );
          if (selfOnly && st.tunnels.length === 0) {
            body.push(
              h2(
                "div",
                { key: "tw", className: "rt-ap-none" },
                "Warning: Existing channels are all on your own servers and do not reach the target \u2014 not counted as a boundary breach. Target-side initiated channels are required (reverse shell to us / frp client on target / suo5 via target WebShell)."
              )
            );
          }
          body.push(
            h2(
              "div",
              { key: "tl", className: "rt-ap-tunnels" },
              st.tunnels.length ? st.tunnels.map(
                (t) => h2(
                  "div",
                  { key: "t" + t.id, className: "rt-ap-tunnel" },
                  h2(
                    "span",
                    { className: "rt-tag rt-tag-passive" },
                    t.kind || "tunnel"
                  ),
                  h2(
                    "span",
                    { className: "rt-mono", style: { fontWeight: 600 } },
                    t.listen || "\u2014"
                  ),
                  h2(
                    "span",
                    {
                      className: "rt-tag " + (t.status === "active" ? "rt-tag-live" : ""),
                      style: t.status === "active" ? {} : { opacity: 0.7 }
                    },
                    t.status === "active" ? "Available" : t.status || "Unknown"
                  ),
                  h2(
                    "span",
                    {
                      className: "rt-ap-nth",
                      style: {
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis"
                      }
                    },
                    "Reachable " + (t.reach || "-")
                  )
                )
              ) : h2(
                "div",
                { className: "rt-ap-none" },
                "No tunnel established yet (register with redteam_tunnel_add after creating one)"
              )
            )
          );
        }
        if (st.assets.length && st.code !== "boundary") {
          body.push(
            h2(
              "div",
              { key: "at", className: "rt-ap-sub" },
              "Assets involved \xB7 " + st.assetCount + " hosts"
            )
          );
          body.push(
            h2(
              "div",
              { key: "al", className: "rt-ap-assets" },
              st.assets.map(assetRow)
            )
          );
        }
      }
      return h2(
        "div",
        { key: "st" + st.code, className: "rt-ap-stage" },
        h2(
          "div",
          { className: "rt-ap-head", style: { borderLeftColor: st.color } },
          h2(
            "span",
            { className: "rt-ap-no", style: { background: st.color } },
            CIRCLED[i] || "0" + (i + 1)
          ),
          h2("span", { className: "rt-ap-name" }, st.name),
          st.subtitle ? h2("span", { className: "rt-ap-en" }, st.subtitle) : null,
          h2("div", { className: "rt-spacer" }),
          st.points > 0 ? h2(
            "span",
            {
              className: "rt-ap-pts",
              style: {
                background: st.color + "22",
                color: st.color,
                borderColor: st.color + "66"
              }
            },
            "+" + st.points
          ) : null,
          h2(
            "span",
            { className: "rt-ap-cum" },
            "Cumulative " + st.cumulative + " pts"
          )
        ),
        h2(
          "div",
          { className: "rt-ap-goal", style: { borderLeftColor: st.color } },
          h2(
            "span",
            {
              className: "rt-ap-goal-tag",
              style: { color: st.color, borderColor: st.color + "66" }
            },
            "Stage goal"
          ),
          h2("span", null, st.goal)
        ),
        h2(
          "div",
          { className: "rt-ap-result", style: { borderLeftColor: st.color } },
          body
        ),
        i < stages.length - 1 ? h2(
          "div",
          { className: "rt-ap-trans" },
          h2("span", { className: "rt-flow-arrow" }, "\u25BC"),
          st.transition ? h2("span", { className: "rt-ap-trans-t" }, st.transition) : null,
          h2(
            "span",
            { className: "rt-ap-trans-t", style: { marginLeft: "auto" } },
            "Cumulative " + st.cumulative + " pts"
          )
        ) : h2(
          "div",
          { className: "rt-ap-trans" },
          h2("span", { className: "rt-flow-arrow" }, "\u25BC"),
          h2(
            "span",
            { className: "rt-ap-trans-t" },
            "Total " + (summary && summary.points || 0) + " pts"
          )
        )
      );
    };
    const stageB = (st, i) => h2(
      "div",
      { key: "c" + st.code, className: "rt-ap-col" },
      i > 0 ? h2("span", { className: "rt-ap-col-arrow" }, "\u25B6") : null,
      h2(
        "div",
        { className: "rt-hcol", style: { borderTopColor: st.color } },
        h2(
          "div",
          {
            className: "rt-ap-head",
            style: { borderLeftColor: st.color, padding: "5px 8px" }
          },
          h2(
            "span",
            {
              className: "rt-ap-no",
              style: {
                background: st.color,
                width: 16,
                height: 16,
                fontSize: 10
              }
            },
            String(i + 1)
          ),
          h2(
            "span",
            { className: "rt-ap-name", style: { fontSize: 12 } },
            st.name
          ),
          h2("div", { className: "rt-spacer" }),
          h2(
            "span",
            { className: "rt-ap-cum", style: { fontWeight: 700 } },
            st.cumulative
          )
        ),
        h2("div", { className: "rt-hcol-goal", title: st.goal }, st.goal),
        h2(
          "div",
          { className: "rt-hcol-body" },
          st.code === "boundary" ? h2(
            "div",
            null,
            h2(
              "div",
              { className: "rt-hcol-hit" },
              h2("span", { className: "rt-hcol-pts" }, "+" + st.points),
              h2(
                "span",
                { className: "rt-hcol-name" },
                "Tunnels " + st.tunnels.length
              )
            ),
            st.tunnels.slice(0, 3).map(
              (t) => h2(
                "div",
                { key: "t" + t.id, className: "rt-hcol-sub" },
                "\u25B8 " + (t.kind || "") + " " + (t.listen || "")
              )
            )
          ) : st.code === "recon" ? h2(
            "div",
            null,
            h2(
              "div",
              { className: "rt-hcol-hit" },
              h2("span", { className: "rt-hcol-pts" }, st.assetCount),
              h2("span", { className: "rt-hcol-name" }, "Assets with points")
            ),
            st.assets.slice(0, 6).map(
              (a) => h2(
                "div",
                {
                  key: "a" + a.id,
                  className: "rt-hcol-sub",
                  title: a.ip + "  +" + a.points + " pts"
                },
                (a.scope === "internal" ? "Internal " : "External ") + a.ip + "  +" + a.points
              )
            )
          ) : h2(
            "div",
            null,
            h2(
              "div",
              { className: "rt-hcol-hit" },
              h2("span", { className: "rt-hcol-pts" }, "+" + st.points),
              h2(
                "span",
                { className: "rt-hcol-name" },
                st.hits + " hits"
              )
            ),
            st.items.slice(0, 6).map(
              (x) => h2(
                "div",
                {
                  key: "c" + x.id,
                  className: "rt-hcol-sub",
                  title: x.point_name + "  " + (x.target || "")
                },
                h2("span", { className: "rt-hcol-pts" }, "+" + x.points),
                h2("span", { className: "rt-hcol-name" }, x.point_name)
              )
            ),
            st.items.length > 6 ? h2(
              "div",
              { className: "rt-hcol-none" },
              "...and " + (st.items.length - 6) + " more"
            ) : null,
            st.assetCount ? h2(
              "div",
              { className: "rt-hcol-none" },
              "Involves " + st.assetCount + " assets"
            ) : null
          )
        )
      )
    );
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Attack chain"),
        h2(
          "span",
          { className: "rt-tag", style: { fontSize: 10.5 } },
          "Reconnaissance -> Internet asset access -> Boundary breach -> Internal asset access -> Target access"
        ),
        summary ? h2(
          "span",
          { className: "rt-tag rt-tag-live" },
          "Total score " + summary.points + " pts"
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn" + (view === "A" ? " rt-btn-primary" : ""),
            title: "Vertical attack chain: view stage details top to bottom",
            onClick: () => setView("A")
          },
          "Chain A"
        ),
        h2(
          "button",
          {
            className: "rt-btn" + (view === "B" ? " rt-btn-primary" : ""),
            title: "Horizontal attack chain: view all five stages at a glance",
            onClick: () => setView("B")
          },
          "Chain B"
        ),
        h2(
          "button",
          { className: "rt-btn", disabled: loading, onClick: load },
          loading ? "Loading\u2026" : "Refresh"
        )
      ),
      err ? h2("div", { className: "rt-err" }, err) : null,
      !stages.length && !err && data !== null ? h2(
        "div",
        { className: "rt-empty" },
        "No score records yet. After achieving results, record them with redteam_score_hit to grow this chain."
      ) : view === "A" ? h2("div", { className: "rt-ap" }, stages.map(stageA)) : h2("div", { className: "rt-ap-h" }, stages.map(stageB))
    );
  }
  function groupByStage(reportItems, chain) {
    const byId = new Map((reportItems || []).map((x) => [x.id, x]));
    const groups = [];
    const stageList = chain && chain.stages || [];
    stageList.forEach((st, si) => {
      const items = (st.items || []).map((x) => byId.get(x.id)).filter(Boolean);
      if (items.length === 0) return;
      groups.push({
        code: st.code,
        name: st.name,
        color: st.color || "#64748b",
        ordinal: st.ordinal || si + 1,
        points: st.points || 0,
        cumulative: st.cumulative || 0,
        items
      });
    });
    const grouped = new Set(
      groups.reduce((acc, g) => acc.concat(g.items.map((x) => x.id)), [])
    );
    const rest = (reportItems || []).filter((x) => !grouped.has(x.id));
    if (rest.length > 0) {
      groups.push({
        code: "other",
        name: "Other scores",
        color: "#64748b",
        ordinal: groups.length + 1,
        points: rest.reduce((n, x) => n + (x.counted ? x.points : 0), 0),
        cumulative: 0,
        items: rest
      });
    }
    return groups;
  }
  function ReportTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [msg, setMsg] = import_react2.default.useState(null);
    const collapse = useCollapse("report:" + eng);
    const load = () => {
      if (!eng) return;
      setBusy(true);
      setMsg(null);
      api({ op: "scoreReport", engagement: eng }).then(
        (r) => {
          if (!r || r.ok === false) {
            setBusy(false);
            setErr(r && r.error || "Generation failed");
            return;
          }
          if ((!r.stages || r.stages.length === 0) && (r.items || []).length > 0) {
            api({ op: "scoreChain", engagement: eng }).then(
              (c) => {
                setBusy(false);
                setErr(null);
                setData(
                  Object.assign({}, r, { stages: groupByStage(r.items, c) })
                );
              },
              () => {
                setBusy(false);
                setErr(null);
                setData(r);
              }
            );
            return;
          }
          setBusy(false);
          setErr(null);
          setData(r);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(load, [eng, refreshKey]);
    const copy = (text, label) => copyWithFeedback(text, label, (okFlag, message) => {
      setMsg(okFlag ? { ok: message } : { err: message });
    });
    const download = (text, label) => {
      try {
        const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "report-" + String(label || "score").replace(/[^\w.\-]/g, "_") + ".md";
        a.click();
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {
          }
        }, 1e3);
        setMsg({ ok: "Downloaded: " + label });
      } catch (e) {
        setMsg({ err: "Download failed: " + (e && e.message || e) });
      }
    };
    const items = data && data.items || [];
    const stages = data && data.stages || [];
    const summary = data && data.summary || null;
    const mdText = data && data.markdown || "";
    const CIRCLED = [
      "\u2460",
      "\u2461",
      "\u2462",
      "\u2463",
      "\u2464",
      "\u2465",
      "\u2466",
      "\u2467",
      "\u2468",
      "\u2469",
      "\u246A",
      "\u246B",
      "\u246C",
      "\u246D",
      "\u246E",
      "\u246F",
      "\u2470",
      "\u2471",
      "\u2472",
      "\u2473"
    ];
    const card = (x) => h2(
      "div",
      { key: "r" + x.id, className: "rt-rep" },
      h2(
        "div",
        { className: "rt-rep-head" },
        h2("span", { className: "rt-rep-idx" }, String(x.seq)),
        h2("span", { className: "rt-rep-name" }, x.point_name),
        h2("span", { className: "rt-flow-pts" }, "+" + x.points + " pts"),
        x.nth_of_point > 1 ? h2(
          "span",
          { className: "rt-tag" },
          "Occurrence #" + x.nth_of_point
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn",
            style: { padding: "0 6px", fontSize: 11 },
            onClick: () => copy(
              (x.requests || []).map((v) => v.request || "").filter(Boolean).join("\n\n"),
              "Request #" + x.seq
            )
          },
          "Copy request"
        )
      ),
      h2(
        "div",
        { className: "rt-rep-meta" },
        h2("span", null, h2("b", null, "Target ")),
        h2("span", { className: "rt-mono" }, x.target || x.asset_ip || "\u2014")
      ),
      x.gained ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "Gained "),
        h2("span", null, x.gained)
      ) : null,
      x.vuln ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "Exploited vulnerability "),
        h2(
          "span",
          null,
          [x.vuln.cve, x.vuln.title].filter(Boolean).join(" ")
        )
      ) : null,
      x.evidence ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "Result "),
        h2("span", null, String(x.evidence).replace(/\n+/g, " "))
      ) : null,
      x.recorded_at ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "Obtained at "),
        h2(
          "span",
          null,
          fmt(x.recorded_at) + (x.recorded_by ? "\uFF08" + (ROLE_LABEL[x.recorded_by] || x.recorded_by) + "\uFF09" : "")
        )
      ) : null,
      h2(ShotStrip, {
        eng,
        shots: x.shots,
        total: x.shot_total,
        title: "Evidence screenshots"
      }),
      /* -- Reproduction steps: action records (with actual commands and output) + credentials + tunnels + WebShell -----
         This is where the report delivers value: how credentials were obtained and how tunnels were set up, so users can reproduce it. */
      h2(
        "details",
        {
          className: "rt-rep-trace",
          open: x.incomplete === true || (x.steps || []).length === 0
        },
        h2(
          "summary",
          { className: "rt-rep-trace-head", style: { cursor: "pointer" } },
          h2(
            "span",
            { className: "rt-rep-trace-title" },
            "Reproduction steps (click to expand)"
          ),
          (x.steps || []).length ? h2(
            "span",
            { className: "rt-tag" },
            (x.steps || []).length + " actions"
          ) : null,
          (x.credentials || []).length ? h2(
            "span",
            { className: "rt-tag" },
            (x.credentials || []).length + " credentials"
          ) : null,
          (x.tunnels || []).length ? h2(
            "span",
            { className: "rt-tag" },
            (x.tunnels || []).length + " tunnels"
          ) : null,
          x.incomplete ? h2("span", { className: "rt-tag rt-tag-warn" }, "Reproduction materials pending") : h2("span", { className: "rt-tag rt-tag-live" }, "Reproducible")
        ),
        h2(
          "div",
          { style: { paddingTop: 6 } },
          x.how ? h2("div", { className: "rt-rep-trace-how" }, x.how) : null,
          (x.steps || []).length === 0 ? h2(
            "div",
            { className: "rt-rep-missing" },
            "Warning: No associated attack steps: cannot explain how this step was performed. Add actions with redteam_chain_add (title / detail / tool / result), or include point_code + evidence when scoring."
          ) : (x.steps || []).map(
            (s, si) => h2(
              "div",
              { key: "s" + s.id, className: "rt-rep-step" },
              h2(
                "div",
                { className: "rt-rep-step-head" },
                h2(
                  "span",
                  { className: "rt-rep-step-no" },
                  String(si + 1)
                ),
                h2(
                  "span",
                  { className: "rt-rep-step-title" },
                  s.title || "(Unnamed action)"
                ),
                s.agent ? h2(
                  "span",
                  { className: "rt-tag" },
                  ROLE_LABEL[s.agent] || s.agent
                ) : null,
                s.stage_code ? h2("span", { className: "rt-tag" }, s.stage_code) : null,
                s.inferred ? h2("span", { className: "rt-tag" }, "Inferred from same asset") : null,
                h2("div", { className: "rt-spacer" }),
                s.recorded_at ? h2(
                  "span",
                  {
                    style: {
                      fontSize: 11,
                      color: "var(--dsw-alias-label-secondary)"
                    }
                  },
                  fmt(s.recorded_at)
                ) : null
              ),
              s.detail ? h2("div", { className: "rt-rep-step-detail" }, s.detail) : null,
              h2(
                "div",
                { className: "rt-rep-step-cmd" },
                h2("b", null, "Execution "),
                s.tool ? h2("span", { className: "rt-mono" }, s.tool) : h2(
                  "span",
                  {
                    style: {
                      color: "var(--dsw-alias-state-warn-primary, #f59e0b)"
                    }
                  },
                  "Actual command not recorded (tool in redteam_chain_add)"
                )
              ),
              s.tool ? h2(
                "div",
                { style: { marginTop: 3 } },
                h2(
                  "button",
                  {
                    className: "rt-btn",
                    style: { padding: "0 6px", fontSize: 11 },
                    onClick: () => copy(
                      String(s.tool),
                      "Step " + (si + 1) + " command"
                    )
                  },
                  "Copy command"
                )
              ) : null,
              s.result ? h2(
                "div",
                { className: "rt-rep-step-result" },
                h2("b", null, "Result "),
                String(s.result).replace(/\n+/g, " ")
              ) : null,
              s.evidence_ref ? h2(
                "div",
                { className: "rt-rep-step-result" },
                h2("b", null, "Evidence "),
                h2("span", { className: "rt-mono" }, s.evidence_ref)
              ) : null
            )
          ),
          /* How credentials were obtained: source and acquisition method */
          (x.credentials || []).length ? h2(
            "div",
            { className: "rt-rep-src" },
            h2(
              "div",
              { className: "rt-rep-src-title" },
              "Obtained credentials (traceable source)"
            ),
            (x.credentials || []).map(
              (c) => h2(
                "div",
                { key: "c" + c.id, className: "rt-kv" },
                h2(
                  "b",
                  { className: "rt-mono", style: { minWidth: 120 } },
                  c.host || "\u2014"
                ),
                h2(
                  "span",
                  null,
                  (c.username || "(No username)") + " / " + (c.secret_type || "password") + (c.privilege ? " \xB7 Privilege " + c.privilege : "") + " \xB7 Source " + (c.source || "Unspecified") + (c.tool ? " \xB7 Acquisition method " + String(c.tool).replace(/\n+/g, " ").slice(0, 160) : "")
                )
              )
            )
          ) : null,
          /* How tunnels were set up */
          (x.tunnels || []).length ? h2(
            "div",
            { className: "rt-rep-src" },
            h2(
              "div",
              { className: "rt-rep-src-title" },
              "Tunnels / channels used"
            ),
            (x.tunnels || []).map(
              (t) => h2(
                "div",
                { key: "t" + t.id, className: "rt-kv" },
                h2(
                  "b",
                  { className: "rt-mono", style: { minWidth: 120 } },
                  (t.kind || "socks5") + " " + (t.listen || "")
                ),
                h2(
                  "span",
                  null,
                  "Entry " + (t.entry || "Not registered") + (t.reach ? " \xB7 Reachable " + t.reach : "") + " \xB7 Target side " + (t.entry_kind || "Not declared") + (t.legit === false ? " \xB7 Warning: does not cross engagement boundary" : "") + (t.status ? " \xB7 " + t.status : "") + (t.command ? " \xB7 Command " + String(t.command).replace(/\n+/g, " ").slice(0, 160) : "")
                )
              )
            )
          ) : null,
          (x.webshells || []).length ? h2(
            "div",
            { className: "rt-rep-src" },
            h2(
              "div",
              { className: "rt-rep-src-title" },
              "WebShells used"
            ),
            (x.webshells || []).map(
              (w) => h2(
                "div",
                { key: "w" + w.id, className: "rt-kv" },
                h2(
                  "b",
                  { className: "rt-mono", style: { minWidth: 120 } },
                  w.shell_type || "shell"
                ),
                h2(
                  "span",
                  null,
                  (w.url || "") + (w.pass_key ? " \xB7 Password/key " + w.pass_key : "") + (w.privilege ? " \xB7 Privilege " + w.privilege : "") + (w.status ? " \xB7 " + w.status : "")
                )
              )
            )
          ) : null,
          (x.gaps || []).length ? h2(
            "div",
            { className: "rt-rep-missing" },
            "Warning: Reproduction gaps: " + x.gaps.join("; ")
          ) : null
        ),
        (x.requests || []).length === 0 ? h2(
          "div",
          { className: "rt-rep-missing" },
          "Warning: No raw request record for this item; cannot reproduce directly \u2014 add it with redteam_http_evidence_add"
        ) : (x.requests || []).map(
          (r, ri) => h2(
            "div",
            { key: "q" + ri, className: "rt-rep-req" },
            h2(
              "div",
              { className: "rt-rep-req-head" },
              h2(
                "span",
                null,
                "Reproduction request " + (ri + 1) + (r.source === "auto" ? " (auto-matched by target path; please verify)" : "")
              ),
              h2(
                "span",
                { className: "rt-tag" },
                (r.method || "GET") + " " + (r.status === null || r.status === void 0 ? "" : r.status)
              ),
              h2("div", { className: "rt-spacer" }),
              h2(
                "button",
                {
                  className: "rt-btn",
                  style: { padding: "0 6px", fontSize: 11 },
                  onClick: () => copy(String(r.request || ""), "Request " + (ri + 1))
                },
                "Copy to Yakit"
              )
            ),
            h2(
              "pre",
              { className: "rt-rep-http" },
              r.request || (r.method || "GET") + " " + (r.url || "") + " HTTP/1.1"
            ),
            r.response ? h2(
              "div",
              null,
              h2(
                "div",
                { className: "rt-rep-req-head" },
                h2("span", null, "Response summary")
              ),
              h2(
                "pre",
                {
                  className: "rt-rep-http",
                  style: { maxHeight: 160 }
                },
                String(r.response).slice(0, 1600)
              )
            ) : null
          )
        ),
        x.note ? h2(
          "div",
          { className: "rt-rep-meta" },
          h2("b", null, "Notes "),
          h2("span", null, x.note)
        ) : null
      )
    );
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Attack score chain reproduction report"),
        summary ? h2(
          "span",
          { className: "rt-tag rt-tag-live" },
          "Total " + summary.points + " pts"
        ) : null,
        summary ? h2("span", { className: "rt-tag" }, summary.count + " scored items") : null,
        summary ? h2(
          "span",
          {
            className: "rt-tag" + (summary.missingRequests ? "" : " rt-tag-live")
          },
          summary.withRequests + "/" + summary.count + " items with raw requests"
        ) : null,
        summary ? h2(
          "span",
          {
            className: "rt-tag" + (summary.incomplete ? " rt-tag-warn" : " rt-tag-live"),
            title: "Whether reproduction chain is complete: has attack steps, actual commands, and linked vulnerabilities/credentials/tunnels"
          },
          "Reproducible " + (summary.count - (summary.incomplete || 0)) + "/" + summary.count
        ) : null,
        summary && summary.serviceCappedExcluded ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: (summary.serviceCapped || []).map((x) => (x.service || "") + "\uFF5C" + (x.point_name || "")).join("\n") || "Duplicate account/database privilege hits on the same asset and port: service cap reached, not counted and excluded from report"
          },
          "Service cap reached (not counted) " + summary.serviceCappedExcluded
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn",
            disabled: busy || !mdText,
            onClick: () => copy(mdText, "Full report")
          },
          "Copy full text"
        ),
        h2(
          "button",
          {
            className: "rt-btn",
            disabled: busy || !mdText,
            onClick: () => download(mdText, data && data.target || eng)
          },
          "Download .md"
        ),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Generating\u2026" : "Regenerate"
        )
      ),
      msg ? h2(
        "div",
        { className: msg.err ? "rt-err" : "rt-foot" },
        msg.err || msg.ok
      ) : null,
      err ? h2("div", { className: "rt-err" }, err) : null,
      h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        stages.length ? h2(
          "div",
          { className: "rt-rep-list" },
          h2(
            "div",
            { className: "rt-rep-tools" },
            h2(
              "button",
              {
                className: "rt-btn",
                onClick: () => collapse.setAll(
                  stages.map((s) => "st:" + s.code),
                  true
                )
              },
              "Expand all"
            ),
            h2(
              "button",
              {
                className: "rt-btn",
                onClick: () => collapse.setAll(
                  stages.map((s) => "st:" + s.code),
                  false
                )
              },
              "Collapse all"
            )
          ),
          stages.map((st) => {
            const open = collapse.isOpen("st:" + st.code, true);
            const toggle = collapse.toggle("st:" + st.code, true);
            return h2(
              "div",
              { key: "g" + st.code, className: "rt-rep-group" },
              h2(
                "div",
                {
                  className: "rt-rep-stage",
                  role: "button",
                  tabIndex: 0,
                  style: { borderLeftColor: st.color },
                  "aria-expanded": open ? "true" : "false",
                  onClick: toggle,
                  onKeyDown: (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(e);
                    }
                  }
                },
                h2("span", { className: "rt-sec-caret" }, open ? "\u25BE" : "\u25B8"),
                h2(
                  "span",
                  {
                    className: "rt-rep-no",
                    style: { background: st.color }
                  },
                  CIRCLED[st.ordinal - 1] || st.ordinal
                ),
                h2("span", { className: "rt-rep-stage-name" }, st.name),
                h2(
                  "span",
                  { className: "rt-rep-stage-n" },
                  st.items.length + " items"
                ),
                h2("div", { className: "rt-spacer" }),
                h2(
                  "span",
                  {
                    className: "rt-rep-pts",
                    style: {
                      background: st.color + "22",
                      color: st.color,
                      borderColor: st.color + "66"
                    }
                  },
                  "+" + st.points + " pts"
                ),
                h2(
                  "span",
                  { className: "rt-ap-cum" },
                  "Cumulative " + st.cumulative + " pts"
                )
              ),
              open ? h2("div", { className: "rt-rep-body" }, st.items.map(card)) : null
            );
          })
        ) : data === null ? h2("div", { className: "rt-empty" }, "Loading\u2026") : h2(
          "div",
          { className: "rt-empty" },
          h2("div", null, "No deliverable results yet."),
          h2(
            "div",
            { style: { marginTop: 6, fontSize: 12 } },
            "This report only includes results that earned points; vulnerabilities without points are excluded. After achieving results, record them with redteam_score_hit (target asset + what was gained) and add redteam_http_evidence_add for reproduction."
          )
        )
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2(
          "span",
          null,
          "Scope: only scored results are included, each with a raw request that can be pasted into Yakit Repeater"
        )
      )
    );
  }
  const FILE_KIND = {
    poc: "POC",
    exp: "EXP",
    script: "Script",
    wordlist: "Wordlist",
    other: "Other"
  };
  function AttackFilesTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [folders, setFolders] = import_react2.default.useState([]);
    const [err, setErr] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const collapse = useCollapse("files:" + eng);
    const [detail, setDetail] = import_react2.default.useState(null);
    const load = () => {
      if (!eng) return;
      setBusy(true);
      api({ op: "attackFiles", engagement: eng }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setFolders(r.items || []);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(load, [eng, refreshKey]);
    const openFile = (f) => {
      if (detail && detail.id === f.id) {
        setDetail(null);
        return;
      }
      setDetail(null);
      api({ op: "readAttackFile", engagement: eng, id: f.id }).then(
        (r) => {
          if (r && r.ok) setDetail(r);
          else setErr(r && r.error || "Read failed");
        },
        (e) => setErr(String(e && e.message || e))
      );
    };
    const rows = [];
    for (const folder of folders) {
      const fKey = "folder:" + folder.folder;
      const fileNodes = [];
      for (const f of folder.files) {
        fileNodes.push(
          h2(
            "div",
            {
              key: "a" + f.id,
              className: "rt-vrow",
              style: {
                gridTemplateColumns: "18px 1.2fr 60px 1.6fr",
                cursor: "pointer"
              },
              role: "button",
              tabIndex: 0,
              onClick: () => openFile(f),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFile(f);
                }
              }
            },
            h2(
              "span",
              { className: "rt-sec-caret" },
              detail && detail.id === f.id ? "\u25BE" : "\u25B8"
            ),
            h2("span", { className: "rt-mono" }, f.name),
            h2(
              "span",
              null,
              h2(
                "span",
                { className: "rt-tag rt-tag-active" },
                FILE_KIND[f.kind] || f.kind || "\u2014"
              )
            ),
            h2(
              "span",
              {
                style: {
                  fontSize: 11.5,
                  color: "var(--dsw-alias-label-secondary)"
                },
                title: f.description || ""
              },
              f.description || "\u2014"
            )
          )
        );
        if (!detail || detail.id !== f.id) continue;
        fileNodes.push(
          h2(
            "div",
            {
              key: "ad" + f.id,
              className: "rt-vrow",
              style: { cursor: "default", gridTemplateColumns: "1fr" }
            },
            h2(
              "div",
              { className: "rt-vdetail" },
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Effect"),
                h2("span", null, detail.evidence || "\u2014")
              ),
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Path"),
                h2(
                  "span",
                  { className: "rt-mono", style: { wordBreak: "break-all" } },
                  detail.path
                )
              ),
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Record"),
                h2(
                  "span",
                  null,
                  fmt(detail.created_at) + (detail.created_by ? " \xB7 " + detail.created_by : "")
                )
              ),
              h2(
                "pre",
                {
                  className: "rt-md",
                  style: {
                    border: "1px solid var(--dsw-alias-border-l1)",
                    borderRadius: 6,
                    maxHeight: "40vh",
                    padding: "10px 12px"
                  }
                },
                detail.content || "(empty)"
              )
            )
          )
        );
      }
      rows.push(
        h2(
          Section,
          {
            key: "sec:" + folder.folder,
            tone: "folder",
            title: folder.folder + "/",
            count: folder.count + " files",
            open: collapse.isOpen(fKey, true),
            onToggle: collapse.toggle(fKey, true)
          },
          fileNodes.length ? fileNodes : h2("div", { className: "rt-atest-meta" }, "(empty)")
        )
      );
    }
    const total = folders.reduce((n, f) => n + f.count, 0);
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Attack files"),
        h2(
          "span",
          { className: "rt-tag" },
          folders.length + " targets / " + total + " files"
        ),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Refreshing\u2026" : "Refresh"
        )
      ),
      err ? h2("div", { className: "rt-err" }, err) : null,
      h2(
        "div",
        { className: "rt-table" },
        rows,
        !folders.length ? h2(
          "div",
          { className: "rt-empty" },
          "No attack files yet (scripts/POCs/EXPs that worked will appear here organized by target folder)"
        ) : null
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2(
          "span",
          null,
          "Directory: attack-files/<IP|URL host|C segment>/ | only files that actually worked are included"
        )
      )
    );
  }
  const POC_KIND_LABEL = {
    poc: "POC",
    exp: "EXP",
    script: "Script",
    template: "Template",
    payload: "Payload"
  };
  const POC_SOURCE_LABEL = {
    web: "Internet",
    self: "Hand-crafted",
    manual: "Manual",
    "nuclei-template": "nuclei template",
    kb: "Knowledge base"
  };
  function KnowledgeTab(props) {
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [msg, setMsg] = import_react2.default.useState(null);
    const [q, setQ] = import_react2.default.useState("");
    const [kind, setKind] = import_react2.default.useState("");
    const [category, setCategory] = import_react2.default.useState("");
    const [engagement, setEngagement] = import_react2.default.useState("");
    const [assetTarget, setAssetTarget] = import_react2.default.useState("");
    const [grouped, setGrouped] = import_react2.default.useState(true);
    const [verifiedOnly, setVerifiedOnly] = import_react2.default.useState(false);
    const [openId, setOpenId] = import_react2.default.useState(null);
    const [detail, setDetail] = import_react2.default.useState(null);
    const [detailBusy, setDetailBusy] = import_react2.default.useState(false);
    const [tplOffset, setTplOffset] = import_react2.default.useState(0);
    const tplPageSize = 40;
    const query = (over) => {
      const extra = over || {};
      const offset = Object.prototype.hasOwnProperty.call(
        extra,
        "templateOffset"
      ) ? extra.templateOffset : 0;
      setTplOffset(offset);
      const params = Object.assign(
        {
          q: q.trim() || void 0,
          kind: kind || void 0,
          category: category || void 0,
          engagement: engagement || void 0,
          asset_target: assetTarget.trim() || void 0,
          verified: verifiedOnly || void 0,
          templateOffset: offset || 0,
          templateLimit: tplPageSize
        },
        extra
      );
      setBusy(true);
      setMsg(null);
      api(Object.assign({ op: "pocSearch" }, params)).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(() => {
      query({
        q: void 0,
        kind: void 0,
        category: void 0,
        engagement: void 0,
        asset_target: void 0,
        verified: void 0
      });
    }, [refreshKey]);
    const open = (id) => {
      if (openId === id) {
        setOpenId(null);
        setDetail(null);
        return;
      }
      setOpenId(id);
      setDetail(null);
      setDetailBusy(true);
      api({ op: "pocGet", id }).then(
        (r) => {
          setDetailBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Read failed" });
            return;
          }
          setDetail(r);
        },
        (e) => {
          setDetailBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const copy = (text, label) => copyWithFeedback(text, label, (okFlag, message) => {
      setMsg(okFlag ? { ok: message } : { err: message });
    });
    const useIt = (row) => {
      api({ op: "pocUse", id: row.id, used_on: "Manually marked in console" }).then(
        () => {
          setMsg({ ok: "Recorded one reuse: " + row.title });
          query();
        },
        (e) => setMsg({ err: String(e && e.message || e) })
      );
    };
    const stats = data && data.stats || {
      total: 0,
      verified: 0,
      reused: 0,
      byKind: [],
      bySource: []
    };
    const items = data && data.items || [];
    const tpl = data && data.templates || {
      dir: null,
      total: 0,
      matched: 0,
      offset: 0,
      items: [],
      byCategory: []
    };
    const tplByCat = new Map(
      (tpl.byCategory || []).map((c) => [c.code, c.n || 0])
    );
    const catShown = (c) => (c.n || 0) + (tplByCat.get(c.code) || 0);
    const tplItems = tpl.items || [];
    const tplMatched = tpl.matched != null ? tpl.matched : tpl.total;
    const tplStart = Number(tpl.offset) || 0;
    const turnTpl = (next) => {
      const offset = Math.max(0, next);
      setTplOffset(offset);
      query({ templateOffset: offset });
    };
    const card = (x) => {
      const isOpen = openId === x.id;
      const d = isOpen && detail && detail.id === x.id ? detail : null;
      return h2(
        "div",
        { key: "p" + x.id, className: "rt-kb" + (isOpen ? " open" : "") },
        h2(
          "div",
          {
            className: "rt-kb-head",
            role: "button",
            tabIndex: 0,
            "aria-expanded": isOpen ? "true" : "false",
            onClick: () => open(x.id),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open(x.id);
              }
            }
          },
          h2("span", { className: "rt-sec-caret" }, isOpen ? "\u25BE" : "\u25B8"),
          h2(
            "span",
            { className: "rt-kb-kind k-" + (x.kind || "poc") },
            POC_KIND_LABEL[x.kind] || x.kind || "POC"
          ),
          h2("span", { className: "rt-kb-title" }, x.title),
          x.cve ? h2("span", { className: "rt-tag rt-tag-passive" }, x.cve) : null,
          x.component ? h2("span", { className: "rt-tag" }, x.component) : null,
          x.verified === 1 ? h2("span", { className: "rt-tag rt-tag-live" }, "Verified") : h2("span", { className: "rt-tag rt-tag-warn" }, "Unverified"),
          h2("div", { className: "rt-spacer" }),
          h2(
            "span",
            { className: "rt-tag" },
            POC_SOURCE_LABEL[x.source] || x.source || "\u2014"
          ),
          x.hit_count ? h2("span", { className: "rt-tag" }, "Reused " + x.hit_count) : null
        ),
        /* Source row: category · affected versions · created · source engagement · discovered asset */
        /* showing when and on which asset this knowledge was found */
        h2(
          "div",
          { className: "rt-kb-sub" },
          [
            x.category ? "Category " + (POC_CAT_NAME[x.category] || x.category) : null,
            x.versions ? "Affected versions " + x.versions : null,
            x.language || null,
            x.tags || null,
            "Created " + fmt(x.created_at),
            x.engagement_name || x.engagement_id ? "Source engagement " + (x.engagement_name || x.engagement_id) : null,
            x.asset_target ? "Discovered asset " + x.asset_target : null,
            x.found_by_agent ? "Found by role " + (ROLE_LABEL[x.found_by_agent] || x.found_by_agent) : null,
            x.source_url ? "Source " + x.source_url : null
          ].filter(Boolean).join(" \xB7 ")
        ),
        isOpen ? h2(
          "div",
          { className: "rt-kb-body" },
          detailBusy && !d ? h2("div", { className: "rt-empty" }, "Reading\u2026") : null,
          d ? h2(
            "div",
            null,
            d.usage ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Usage"),
              h2("span", { className: "rt-mono" }, d.usage)
            ) : null,
            d.description ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Description"),
              h2("span", null, d.description)
            ) : null,
            d.verified_note ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Verification evidence"),
              h2("span", null, d.verified_note)
            ) : null,
            d.used_on ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Last used"),
              h2("span", null, d.used_on)
            ) : null,
            d.path ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "Stored at"),
              h2("span", { className: "rt-mono" }, d.path)
            ) : null,
            h2(
              "div",
              { className: "rt-kb-actions" },
              h2(
                "button",
                {
                  className: "rt-btn",
                  disabled: !d.content,
                  onClick: () => copy(d.content || "", "POC content")
                },
                "Copy content"
              ),
              h2(
                "button",
                { className: "rt-btn", onClick: () => useIt(x) },
                "Record one reuse"
              ),
              d.source_url ? h2(
                "button",
                {
                  className: "rt-btn",
                  onClick: () => copy(d.source_url, "Source link")
                },
                "Copy source"
              ) : null
            ),
            d.content ? h2(
              "pre",
              { className: "rt-rep-http" },
              d.content.length > 12e3 ? d.content.slice(0, 12e3) + "\n...(truncated; see stored file for full content)" : d.content
            ) : h2(
              "div",
              { className: "rt-empty" },
              "This entry has metadata only, no content \u2014 add content with redteam_poc_update when available"
            )
          ) : null
        ) : null
      );
    };
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Knowledge base \xB7 POC / EXP"),
        h2("span", { className: "rt-tag" }, stats.total + " entries"),
        h2(
          "span",
          { className: "rt-tag rt-tag-live" },
          "Verified " + stats.verified
        ),
        h2("span", { className: "rt-tag" }, "Total reused " + (stats.reused || 0)),
        (stats.uncategorized || 0) > 0 && (stats.uncategorized || 0) !== stats.total ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: "These entries are uncategorized: set the category parameter in redteam_poc_add when adding them back"
          },
          "Uncategorized " + stats.uncategorized
        ) : null,
        tpl.total ? h2(
          "span",
          { className: "rt-tag rt-tag-passive" },
          "Local templates " + tpl.total
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn" + (grouped ? " rt-btn-primary" : ""),
            title: "Group by category / flat view",
            onClick: () => setGrouped(!grouped)
          },
          grouped ? "Group by category" : "Flat view"
        ),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: () => query() },
          busy ? "Searching\u2026" : "Refresh"
        )
      ),
      /* Category overview: click to filter by category and see at a glance how many items each category has */
      h2(
        "div",
        { className: "rt-kb-cats" },
        (stats.byCategory || []).filter((c) => catShown(c) > 0 || POC_CAT_ORDER.includes(c.code)).map(
          (c) => h2(
            "span",
            {
              key: c.code,
              className: "rt-concl-i" + (category === c.code ? " on" : ""),
              title: (c.hint || POC_CAT_NAME[c.code] || c.code) + " \xB7 Local templates " + (tplByCat.get(c.code) || 0) + " \xB7 Knowledge base " + (c.n || 0) + (c.verified ? " (verified " + c.verified + ")" : ""),
              onClick: () => {
                const next = category === c.code ? "" : c.code;
                setCategory(next);
                query({ category: next || void 0 });
              }
            },
            h2("b", null, String(catShown(c))),
            h2(
              "span",
              null,
              (POC_CAT_NAME[c.code] || c.code) + (c.verified ? " (verified " + c.verified + ")" : "")
            )
          )
        )
      ),
      h2(
        "div",
        { className: "rt-kb-filter" },
        h2("input", {
          className: "rt-input",
          style: { flex: 1, minWidth: 140 },
          placeholder: "Search CVE / component / keyword (body text included)",
          value: q,
          onChange: (e) => setQ(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") query();
          }
        }),
        h2(
          "select",
          {
            className: "rt-input",
            style: { maxWidth: 120 },
            value: category,
            onChange: (e) => {
              setCategory(e.target.value);
              query({ category: e.target.value || void 0 });
            }
          },
          h2("option", { value: "" }, "All categories"),
          POC_CAT_ORDER.map(
            (k) => h2("option", { key: k, value: k }, POC_CAT_NAME[k])
          )
        ),
        h2(
          "select",
          {
            className: "rt-input",
            style: { maxWidth: 120 },
            value: engagement,
            onChange: (e) => {
              setEngagement(e.target.value);
              query({ engagement: e.target.value || void 0 });
            }
          },
          h2("option", { value: "" }, "All source engagements"),
          (stats.byEngagement || []).map(
            (e) => h2(
              "option",
              { key: e.engagement, value: e.engagement },
              e.engagement + "\uFF08" + e.n + "\uFF09"
            )
          )
        ),
        h2("input", {
          className: "rt-input",
          style: { width: 120 },
          placeholder: "Filter by discovered asset",
          value: assetTarget,
          onChange: (e) => setAssetTarget(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") query();
          }
        }),
        h2(
          "select",
          {
            className: "rt-input",
            style: { maxWidth: 110 },
            value: kind,
            onChange: (e) => {
              setKind(e.target.value);
              query({ kind: e.target.value || void 0 });
            }
          },
          h2("option", { value: "" }, "All types"),
          Object.keys(POC_KIND_LABEL).map(
            (k) => h2("option", { key: k, value: k }, POC_KIND_LABEL[k])
          )
        ),
        h2(
          "label",
          { className: "rt-kb-check" },
          h2("input", {
            type: "checkbox",
            checked: verifiedOnly,
            onChange: (e) => {
              setVerifiedOnly(e.target.checked);
              query({ verified: e.target.checked || void 0 });
            }
          }),
          "Verified only"
        ),
        h2(
          "button",
          { className: "rt-btn rt-btn-primary", onClick: () => query() },
          "Search"
        )
      ),
      msg ? h2(
        "div",
        { className: msg.err ? "rt-err" : "rt-foot" },
        msg.err || msg.ok
      ) : null,
      err ? h2(
        "div",
        { className: "rt-err" },
        /engagement required|unknown op/i.test(err) ? (
          /* Older host does not have the knowledge base API yet: explain how to recover */
          "The knowledge base API is provided by the host; the current host is still an old process \u2014 fully exit and reopen (official exe / community edition / dsh web), then refresh the page."
        ) : err
      ) : null,
      !err && data && data.dbPath ? h2(
        "div",
        { className: "rt-foot", style: { marginBottom: 6, fontSize: 11 } },
        "Knowledge base: " + data.dbPath + (data.root ? " (root " + data.root + ")" : "")
      ) : null,
      h2(
        "div",
        { className: "rt-table" },
        (() => {
          if (!grouped) return items.map(card);
          const buckets = /* @__PURE__ */ new Map();
          for (const x of items) {
            const code = POC_CAT_NAME[x.category] ? x.category : "other";
            if (!buckets.has(code)) buckets.set(code, []);
            buckets.get(code).push(x);
          }
          const order = POC_CAT_ORDER.filter((c) => buckets.has(c));
          for (const code of buckets.keys())
            if (!order.includes(code)) order.push(code);
          const out = [];
          for (const code of order) {
            const list = buckets.get(code);
            out.push(
              h2(
                "div",
                { key: "g" + code, className: "rt-kb-cat" },
                h2(
                  "span",
                  { className: "rt-kb-cat-name" },
                  POC_CAT_NAME[code] || code
                ),
                h2("span", { className: "rt-tag" }, list.length + " entries"),
                h2(
                  "span",
                  { className: "rt-tag rt-tag-live" },
                  "Verified " + list.filter((x) => x.verified === 1).length
                ),
                h2("span", { className: "rt-spacer" }),
                h2(
                  "span",
                  {
                    style: {
                      fontSize: 11,
                      color: "var(--dsw-alias-label-secondary)"
                    }
                  },
                  "Recently created " + fmt(
                    list.map((x) => x.created_at).filter(Boolean).sort().pop()
                  )
                )
              )
            );
            for (const x of list) out.push(card(x));
          }
          return out;
        })(),
        tplItems.length ? h2(
          "div",
          { className: "rt-kb-tpl" },
          h2(
            "div",
            { className: "rt-ap-sub" },
            "Local nuclei templates \xB7 " + (tplStart + 1) + "\u2013" + (tplStart + tplItems.length) + " / " + tplMatched + "(run directly with `nuclei -t <template path>`)"
          ),
          tplItems.map(
            (t, i) => h2(
              "div",
              { key: "t" + tplStart + "-" + i, className: "rt-kb-tpl-row" },
              h2("span", { className: "rt-tag" }, t.severity || "\u2014"),
              t.category ? h2(
                "span",
                { className: "rt-tag" },
                POC_CAT_NAME[t.category] || t.category
              ) : null,
              h2(
                "span",
                { className: "rt-mono rt-kb-tpl-path", title: t.path },
                t.path
              ),
              h2(
                "span",
                { className: "rt-kb-tpl-name", title: t.name },
                t.name || ""
              ),
              h2(
                "button",
                {
                  className: "rt-btn",
                  style: { padding: "0 6px", fontSize: 10.5 },
                  onClick: () => copy("nuclei -t " + t.path + " -u <target>", "Template command")
                },
                "Copy command"
              )
            )
          ),
          h2(
            "div",
            { className: "rt-kb-actions" },
            h2(
              "button",
              {
                className: "rt-btn",
                disabled: busy || tplStart <= 0,
                onClick: () => turnTpl(tplStart - tplPageSize)
              },
              "Previous page"
            ),
            h2(
              "button",
              {
                className: "rt-btn",
                disabled: busy || tplStart + tplItems.length >= tplMatched,
                onClick: () => turnTpl(tplStart + tplPageSize)
              },
              "Next page"
            )
          ),
          tpl.dir ? h2(
            "div",
            { className: "rt-foot" },
            h2("span", null, "Template directory: " + tpl.dir)
          ) : null
        ) : null,
        data === null ? h2("div", { className: "rt-empty" }, "Loading\u2026") : null,
        data !== null && !items.length && !tplItems.length ? h2(
          "div",
          { className: "rt-empty" },
          h2(
            "div",
            null,
            q || kind || verifiedOnly ? "No matches: try different keywords, or search online / craft your own and add it back." : tpl.total ? "The POC/EXP library is still empty; this machine already has " + tpl.total + " nuclei templates, but they are not listed on this page. Fully exit and reopen the client." : tpl.dir ? "The knowledge base is still empty (local template directory exists but has no YAML files; run nuclei -update-templates)." : 'The knowledge base is still empty. No local nuclei template library found \u2014 run setup.sh or `nuclei -update-templates` on the exercise machine; after installation, "Local templates N" will appear here.'
          ),
          h2(
            "div",
            { style: { marginTop: 6, fontSize: 12 } },
            "Standard workflow for Nday/1day: 1) search here with redteam_poc_search (also searches local nuclei templates) -> 2) if none, search online (web_search / GitHub / ExploitDB / vendor advisories) or craft your own -> 3) after verifying on a real target, add back with redteam_poc_add for reuse in future engagements."
          ),
          data.dbPath ? h2(
            "div",
            {
              style: { marginTop: 6, fontSize: 11 },
              className: "rt-mono"
            },
            "Knowledge base file: " + data.dbPath
          ) : null,
          tpl.dir ? h2(
            "div",
            {
              style: { marginTop: 6, fontSize: 11 },
              className: "rt-mono"
            },
            "Template directory: " + tpl.dir
          ) : null
        ) : null
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2(
          "span",
          null,
          'Globally shared (cross-engagement) | Stored at: pocs/<code>/ | Only generic reusable POCs/EXPs; engagement-specific scripts go to "Attack files"'
        )
      )
    );
  }
  function EnvTab(props) {
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [draft, setDraft] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [msg, setMsg] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [folderPath, setFolderPath] = import_react2.default.useState("");
    const applyDraftFrom = (r) => {
      const c = r && r.config || {};
      setDraft({
        platform: c.platform || "auto",
        toolkitDir: c.toolkitDir || "",
        nucleiTemplatesDir: c.nucleiTemplatesDir || "",
        binDirsText: (c.binDirs || []).join("\n"),
        tools: Object.assign({}, c.tools || {}),
        env: Object.assign(
          { FOFA_KEY: "", REDTEAM_VPS_HOST: "", REDTEAM_VPS_KEY: "" },
          c.env || {}
        ),
        notes: c.notes || ""
      });
      if (c.toolkitDir) setFolderPath(c.toolkitDir);
    };
    const load = () => {
      setBusy(true);
      setMsg(null);
      api({ op: "platformConfigGet" }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
          applyDraftFrom(r);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(load, [refreshKey]);
    const save = () => {
      if (!draft) return;
      setBusy(true);
      setMsg(null);
      const config = {
        platform: draft.platform,
        toolkitDir: draft.toolkitDir,
        nucleiTemplatesDir: draft.nucleiTemplatesDir,
        binDirs: String(draft.binDirsText || "").split(/\r?\n/).map((x) => x.trim()).filter(Boolean),
        tools: draft.tools,
        env: draft.env,
        notes: draft.notes,
        envAdaptConfigured: true,
        envAdaptSkip: false
      };
      api({ op: "platformConfigSave", config }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Save failed" });
            return;
          }
          setData(r);
          setMsg({
            ok: "Saved to " + (r.config && r.config.path || "$DSH_HOME/redteam/config.json")
          });
          applyDraftFrom(r);
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const assignFolder = () => {
      const dir = String(
        folderPath || draft && draft.toolkitDir || ""
      ).trim();
      if (!dir) {
        setMsg({ err: "Please enter the folder path containing the tools first" });
        return;
      }
      setBusy(true);
      setMsg(null);
      api({ op: "platformAssignToolkit", dir }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Auto-assign failed" });
            return;
          }
          setData(r);
          applyDraftFrom(r);
          setMsg({
            ok: "Assigned from folder " + (r.assignedCount || 0) + " tools" + (r.nucleiTemplatesDir ? ", and detected nuclei-templates" : "")
          });
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const setTool = (id, value) => setDraft(
      (d) => d ? Object.assign({}, d, {
        tools: Object.assign({}, d.tools, { [id]: value })
      }) : d
    );
    const setEnv = (key, value) => setDraft(
      (d) => d ? Object.assign({}, d, {
        env: Object.assign({}, d.env, { [key]: value })
      }) : d
    );
    const runtime = data && data.runtime || {};
    const adapt = data && data.adapt || {};
    const tools = data && data.tools && data.tools.items || [];
    const found = tools.filter((t) => t.path).length;
    const defaultToolkit = data && data.toolkitDir || "$DSH_HOME/redteam/toolkit";
    const defaultNuclei = data && data.nucleiTemplatesDir || defaultToolkit + "/nuclei-templates";
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Environment adaptation"),
        h2(
          "span",
          { className: "rt-tag" },
          runtime.effective === "windows" ? "Windows" : "Linux/Kali"
        ),
        adapt.kali ? h2("span", { className: "rt-tag rt-tag-live" }, "Kali") : null,
        h2(
          "span",
          {
            className: "rt-tag" + (adapt.ready ? " rt-tag-live" : " rt-tag-warn")
          },
          adapt.ready ? "Ready \xB7 " + (adapt.reason || "") : "Needs configuration"
        ),
        h2(
          "span",
          { className: "rt-tag" + (found ? " rt-tag-live" : " rt-tag-warn") },
          "Tools " + found + "/" + tools.length
        ),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Reading\u2026" : "Refresh"
        ),
        h2(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy || !draft,
            onClick: save
          },
          "Save"
        )
      ),
      h2(
        "div",
        { className: "rt-pane", style: { minHeight: 0 } },
        err ? h2("div", { className: "rt-err" }, err) : null,
        msg ? h2(
          "div",
          { className: msg.err ? "rt-err" : "rt-foot" },
          msg.err || msg.ok
        ) : null,
        h2(
          "div",
          {
            className: "rt-card",
            style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.6 }
          },
          adapt.message || "All optional: leave blank for default paths/auto-detection. Filled values override defaults. Keys are only needed for mapping/reverse connections."
        ),
        h2(
          "div",
          {
            className: "rt-card",
            style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.6 }
          },
          h2(
            "div",
            { style: { fontWeight: 600, marginBottom: 6 } },
            "Toolkit folder -> auto-assign tools"
          ),
          h2(
            "div",
            { style: { marginBottom: 8, opacity: 0.9 } },
            'When all tools are in the same folder (including subdirectories), enter the path and click "Auto-assign": it sets toolkitDir and matches nmap / nuclei / fscan etc. by filename below.'
          ),
          h2(
            "div",
            { style: { display: "flex", gap: 8, alignItems: "center" } },
            h2("input", {
              className: "rt-input",
              style: { flex: 1 },
              placeholder: "e.g. D:\\pentest-tools or /opt/toolkit",
              value: folderPath,
              onChange: (e) => setFolderPath(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") assignFolder();
              }
            }),
            h2(
              "button",
              {
                className: "rt-btn rt-btn-primary",
                disabled: busy,
                onClick: assignFolder
              },
              busy ? "Scanning\u2026" : "Auto-assign"
            )
          )
        ),
        data && data.hint ? h2(
          "div",
          {
            className: "rt-card",
            style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.6 }
          },
          data.hint
        ) : null,
        data && data.egress ? h2(
          "div",
          {
            className: "rt-card",
            style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.55 }
          },
          h2(
            "div",
            { style: { fontWeight: 600, marginBottom: 6 } },
            "Egress status (inspired by Z3r0 egress, read-only)"
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "HTTP_PROXY=" + (data.egress.http_proxy || "(empty)")
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "HTTPS_PROXY=" + (data.egress.https_proxy || "(empty)")
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "ALL_PROXY=" + (data.egress.all_proxy || "(empty)")
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "NO_PROXY=" + (data.egress.no_proxy || "(empty)")
          ),
          h2(
            "div",
            { style: { marginTop: 6, opacity: 0.85 } },
            data.egress.note || ""
          )
        ) : null,
        !draft ? h2("div", { className: "rt-empty" }, "Loading\u2026") : h2(
          "div",
          null,
          h2(
            "div",
            { className: "rt-card" },
            h2("h4", null, "Platform and directories"),
            h2(
              "div",
              { style: { display: "grid", gap: 8 } },
              h2(
                "label",
                { style: { fontSize: 12 } },
                "Platform mode",
                h2(
                  "select",
                  {
                    className: "rt-input",
                    style: {
                      display: "block",
                      width: "100%",
                      marginTop: 4
                    },
                    value: draft.platform,
                    onChange: (e) => setDraft(
                      Object.assign({}, draft, {
                        platform: e.target.value
                      })
                    )
                  },
                  h2("option", { value: "auto" }, "auto (follow local machine, default)"),
                  h2("option", { value: "windows" }, "windows"),
                  h2("option", { value: "linux" }, "linux")
                )
              ),
              h2(
                "label",
                { style: { fontSize: 12 } },
                "Toolkit directory toolkitDir (blank = default)",
                h2("input", {
                  className: "rt-input",
                  style: { display: "block", width: "100%", marginTop: 4 },
                  placeholder: "Default: " + defaultToolkit,
                  value: draft.toolkitDir,
                  onChange: (e) => setDraft(
                    Object.assign({}, draft, {
                      toolkitDir: e.target.value
                    })
                  )
                })
              ),
              h2(
                "label",
                { style: { fontSize: 12 } },
                "nuclei templates directory (blank = auto: toolkit/nuclei-templates)",
                h2("input", {
                  className: "rt-input",
                  style: { display: "block", width: "100%", marginTop: 4 },
                  placeholder: "Default: " + defaultNuclei,
                  value: draft.nucleiTemplatesDir,
                  onChange: (e) => setDraft(
                    Object.assign({}, draft, {
                      nucleiTemplatesDir: e.target.value
                    })
                  )
                })
              ),
              h2(
                "label",
                { style: { fontSize: 12 } },
                "Tool search directories binDirs (blank = toolkit + PATH only; one per line)",
                h2("textarea", {
                  className: "rt-input",
                  rows: 4,
                  style: {
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    fontFamily: "var(--dsw-font-mono, monospace)"
                  },
                  placeholder: "Optional. e.g. " + String.fromCharCode(10) + "D:\\tools" + String.fromCharCode(10) + "D:\\pentest-bin",
                  value: draft.binDirsText,
                  onChange: (e) => setDraft(
                    Object.assign({}, draft, {
                      binDirsText: e.target.value
                    })
                  )
                })
              )
            )
          ),
          h2(
            "div",
            { className: "rt-card" },
            h2("h4", null, "Keys and VPS (blank = no override; process env vars take precedence)"),
            h2(
              "div",
              { style: { display: "grid", gap: 8 } },
              ["FOFA_KEY", "REDTEAM_VPS_HOST", "REDTEAM_VPS_KEY"].map(
                (k) => h2(
                  "label",
                  { key: k, style: { fontSize: 12 } },
                  k + " (optional)",
                  h2("input", {
                    className: "rt-input",
                    style: {
                      display: "block",
                      width: "100%",
                      marginTop: 4
                    },
                    type: k === "FOFA_KEY" ? "password" : "text",
                    placeholder: k === "REDTEAM_VPS_KEY" ? "Leave blank; enter absolute private key path when needed" : k === "REDTEAM_VPS_HOST" ? "Leave blank; enter user@host when needed" : "Leave blank; fill in when mapping",
                    value: draft.env && draft.env[k] || "",
                    onChange: (e) => setEnv(k, e.target.value)
                  })
                )
              )
            )
          ),
          h2(
            "div",
            { className: "rt-card" },
            h2("h4", null, "Tool executables (blank = auto-detect)"),
            h2(
              "div",
              {
                style: {
                  fontSize: 11.5,
                  color: "var(--dsw-alias-label-secondary)",
                  marginBottom: 8
                }
              },
              "Resolution order: absolute paths in this table -> toolkitDir -> binDirs -> PATH. Leave blank for default lookup."
            ),
            tools.map(
              (t) => h2(
                "div",
                { key: t.id, style: { marginBottom: 8 } },
                h2(
                  "div",
                  {
                    style: {
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      marginBottom: 4
                    }
                  },
                  h2(
                    "span",
                    { style: { fontWeight: 600, minWidth: 88 } },
                    t.label || t.id
                  ),
                  t.path ? h2(
                    "span",
                    { className: "rt-tag rt-tag-live", title: t.path },
                    t.source + " \xB7 Found"
                  ) : h2(
                    "span",
                    { className: "rt-tag rt-tag-warn" },
                    "Not found (leave blank until installed)"
                  )
                ),
                h2("input", {
                  className: "rt-input",
                  style: { width: "100%" },
                  placeholder: "Leave blank to auto-detect: " + (t.names || []).slice(0, 3).join(" / "),
                  value: draft.tools && draft.tools[t.id] || "",
                  onChange: (e) => setTool(t.id, e.target.value)
                }),
                t.path ? h2(
                  "div",
                  {
                    className: "rt-mono",
                    style: {
                      fontSize: 10.5,
                      marginTop: 2,
                      opacity: 0.8
                    }
                  },
                  t.path
                ) : null
              )
            )
          ),
          h2(
            "div",
            { className: "rt-card" },
            h2("h4", null, "Notes"),
            h2("textarea", {
              className: "rt-input",
              rows: 3,
              style: { width: "100%" },
              placeholder: "Optional. e.g. tools from a portable package",
              value: draft.notes,
              onChange: (e) => setDraft(
                Object.assign({}, draft, { notes: e.target.value })
              )
            })
          ),
          h2(
            "div",
            { className: "rt-foot" },
            h2(
              "span",
              null,
              "Config file: " + (data && data.config && data.config.path || "$DSH_HOME/redteam/config.json") + " | blank fields use defaults"
            )
          )
        )
      )
    );
  }
  function ScoreTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [openId, setOpenId] = import_react2.default.useState(null);
    const [form, setForm] = import_react2.default.useState(null);
    const [msg, setMsg] = import_react2.default.useState(null);
    const load = () => {
      if (!eng) return;
      setBusy(true);
      api({ op: "scores", engagement: eng }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    import_react2.default.useEffect(load, [eng, refreshKey]);
    const startEdit = (p) => setForm({
      id: p.id,
      name: p.name,
      category: p.category || "",
      points: p.points,
      description: p.description || "",
      enabled: p.enabled,
      builtin: p.builtin === true,
      src: p.src,
      cap: p.cap,
      rule: p.rule
    });
    const startNew = () => {
      setForm({
        name: "",
        category: "",
        points: 10,
        description: "",
        enabled: true,
        builtin: false
      });
      setMsg(null);
    };
    const setField = (k, v) => setForm((f) => Object.assign({}, f, { [k]: v }));
    const save = () => {
      if (!form || !form.name) {
        setMsg({ err: "Name cannot be empty" });
        return;
      }
      setBusy(true);
      setMsg(null);
      api({ op: "saveScorePoint", engagement: eng, point: form }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Save failed" });
            return;
          }
          if (r.overridden === false) {
            setMsg({
              err: `Saved enable/disable state. Score unchanged: this is a built-in score point distributed with "Scoring Rules", scores / caps / criteria are locked by rules (a rule's cap is cumulative across all score points in the group, changing one score alone would let a single hit consume the group cap). To customize scores, use "+ Add score point".`
            });
          } else {
            setMsg({ ok: r.note || "Saved" });
          }
          setForm(null);
          load();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const remove = () => {
      if (!form || !form.id) {
        setForm(null);
        return;
      }
      setBusy(true);
      setMsg(null);
      api({ op: "deleteScorePoint", engagement: eng, id: form.id }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Delete failed" });
            return;
          }
          setMsg({ ok: "Deleted" });
          setForm(null);
          setOpenId(null);
          load();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const summary = data && data.summary || {
      achievedPoints: 0,
      pointCount: 0,
      hitPointCount: 0,
      hitCount: 0,
      selfCreatedHits: 0,
      serviceCappedHits: 0
    };
    const items = data && data.items || [];
    const groups = data && data.ruleGroups && data.ruleGroups.length ? data.ruleGroups : [
      {
        key: "all",
        name: "",
        capSum: 0,
        points: 0,
        counted: 0,
        tiers: items
      }
    ];
    const rows = [];
    for (const g of groups) {
      if (g.name) {
        rows.push(
          h2(
            "div",
            { key: "g-" + g.key, className: "rt-score-group" },
            h2("span", null, g.name),
            h2(
              "span",
              { className: "rt-sg-sub" },
              g.tiers.length + " items" + (g.capSum > 0 ? " \xB7 Combined cap " + g.capSum + " pts (each item independent, not cumulative across items)" : "")
            ),
            h2("div", { className: "rt-spacer" }),
            g.points > 0 ? h2(
              "span",
              { className: "rt-tag rt-tag-active" },
              "+" + g.points + " pts"
            ) : null
          )
        );
      }
      for (const p of g.tiers) {
        const achieved = p.hits.length > 0;
        const open = openId === p.id;
        rows.push(
          h2(
            "div",
            {
              key: "sp" + p.id,
              className: "rt-score-row",
              role: "button",
              tabIndex: 0,
              onClick: () => setOpenId(open ? null : p.id),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenId(open ? null : p.id);
                }
              }
            },
            h2("span", { className: "rt-sec-caret" }, open ? "\u25BE" : "\u25B8"),
            h2(
              "span",
              null,
              h2(
                "span",
                {
                  className: achieved ? "rt-pri rt-pri-high" : "rt-pri rt-pri-low",
                  style: achieved ? {} : {
                    background: "var(--dsw-alias-bg-layer-2)",
                    color: "var(--dsw-alias-label-secondary)"
                  }
                },
                p.points + " pts"
              )
            ),
            h2(
              "span",
              { title: p.description || "" },
              p.name,
              p.tier ? h2("span", { className: "rt-scope" }, "\u3000" + p.tier) : null
            ),
            /* Hits and caps: how many times counted and cap usage (G3 caps are independent per item; stops counting at cap) */
            h2(
              "span",
              {
                title: p.capped > 0 ? "Counted " + p.counted + " times, plus " + p.capped + ' entries not counted due to "' + (p.scope_label || "scoring criteria") + '" or cap reached' : p.scope_label || ""
              },
              h2(
                "span",
                { className: "rt-sec-count" },
                p.hits.length > 0 ? p.counted + " hits" : "No hits"
              ),
              p.cap > 0 ? h2(
                "span",
                { className: "rt-scope" },
                "  cap " + (p.cap_used === null ? 0 : p.cap_used) + "/" + p.cap
              ) : null
            ),
            h2(
              "span",
              { style: { textAlign: "right" } },
              p.earned > 0 ? h2(
                "span",
                { className: "rt-tag rt-tag-active" },
                "+" + p.earned + " pts"
              ) : h2(
                "span",
                { style: { color: "var(--dsw-alias-label-secondary)" } },
                "\u2014"
              )
            )
          )
        );
        if (!open) continue;
        const hitNodes = p.hits.map(
          (hh, hi) => h2(
            "div",
            {
              key: "h" + hh.id,
              className: "rt-hit-row" + (hh.self_created ? " self-created" : "") + (hh.capped ? " service-capped" : "")
            },
            h2("span", { className: "rt-hit-idx" }, String(hi + 1)),
            h2(
              "span",
              {
                className: "rt-hit-asset",
                title: hh.target || hh.asset_ip || ""
              },
              hh.asset_ip || hh.target || "No asset specified"
            ),
            hh.self_created ? h2(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title: "Self-registered/self-created accounts do not count as scored access; recorded for process only"
              },
              "Self-created \xB7 not counted"
            ) : null,
            hh.capped ? h2(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title: hh.capped_reason || "Only the highest-scoring entry counts for the same asset and port; this one is not counted"
              },
              "Service cap reached \xB7 not counted" + (hh.service ? "\uFF08" + hh.service + "\uFF09" : "")
            ) : null,
            hh.shot_count ? h2(
              "span",
              {
                className: "rt-tag",
                title: "This hit has evidence screenshots (expand the score point to see representative images)"
              },
              "Img " + hh.shot_count
            ) : null,
            h2("span", { className: "rt-hit-time" }, fmt(hh.recorded_at)),
            h2(
              "button",
              {
                className: "rt-btn",
                style: { padding: "0 5px", fontSize: 10.5 },
                title: "Copy this entry",
                onClick: (e) => {
                  e.stopPropagation();
                  copyText(
                    (hh.asset_ip || hh.target || "") + "  " + (hh.evidence || "")
                  );
                }
              },
              "Copy"
            ),
            hh.evidence ? h2(
              "span",
              { className: "rt-hit-txt", title: hh.evidence },
              String(hh.evidence).replace(/\n+/g, " ")
            ) : h2(
              "span",
              { className: "rt-hit-txt none" },
              "Account/password/result not provided"
            )
          )
        );
        rows.push(
          h2(
            "div",
            {
              key: "spd" + p.id,
              className: "rt-score-row",
              style: { cursor: "default", gridTemplateColumns: "1fr" }
            },
            h2(
              "div",
              { className: "rt-score-detail" },
              p.description ? h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Scoring criteria"),
                h2("span", null, p.description)
              ) : null,
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Status"),
                h2(
                  "span",
                  null,
                  (p.enabled ? "Enabled" : "Disabled") + " \xB7 " + p.points + " pts/hit \xB7 Hits " + p.hits.length + " times = " + p.earned + " pts" + (p.self_created ? " (plus " + p.self_created + " self-created not counted)" : "") + (p.capped ? " (plus " + p.capped + " duplicate service hits not counted)" : "")
                )
              ),
              p.capped ? h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Service cap"),
                h2(
                  "span",
                  null,
                  p.service_summary + "; account and database privileges count only once per same asset and port; obtaining the highest-privilege account fills that service cap"
                )
              ) : null,
              p.hits.length ? h2(
                "div",
                null,
                h2(ShotStrip, {
                  eng,
                  shots: p.shots,
                  total: p.shot_total,
                  title: "Evidence screenshots \xB7 " + (p.shot_total || (p.shots || []).length) + " images"
                }),
                h2(
                  "div",
                  {
                    className: "rt-section",
                    style: { padding: "6px 0 0" }
                  },
                  "Hit records \xB7 " + p.hits.length + "(records asset and credentials only; see report for detailed reproduction)"
                ),
                h2("div", { className: "rt-hits" }, hitNodes)
              ) : h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "Hit records"),
                h2(
                  "span",
                  { style: { color: "var(--dsw-alias-label-secondary)" } },
                  "None yet \u2014 after achieving results, score with redteam_score_hit: specify target asset + obtained credentials/privileges"
                )
              ),
              h2(
                "div",
                { className: "rt-actions" },
                h2(
                  "button",
                  {
                    className: "rt-btn",
                    onClick: (e) => {
                      e.stopPropagation();
                      startEdit(p);
                    }
                  },
                  "Edit"
                )
              )
            )
          )
        );
      }
    }
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Score goals"),
        /* Show only total points earned; do not show target score or progress bar */
        h2(
          "span",
          {
            style: {
              fontSize: 13,
              color: "var(--dsw-alias-label-secondary)",
              marginLeft: 4
            }
          },
          "Total score"
        ),
        h2("span", { className: "rt-total" }, String(summary.achievedPoints)),
        h2(
          "span",
          {
            style: { fontSize: 13, color: "var(--dsw-alias-label-secondary)" }
          },
          "pts"
        ),
        h2("span", { className: "rt-tag" }, summary.pointCount + " score points"),
        h2(
          "span",
          { className: "rt-tag" },
          "Hits " + summary.countedHits + " times"
        ),
        summary.selfCreatedHits ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: "Self-registered/self-created accounts do not count as scored access; recorded for process only (not scored, no cap usage, excluded from reports)"
          },
          "Self-created not counted " + summary.selfCreatedHits
        ) : null,
        summary.serviceCappedHits ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: "Account and database privileges count only once per same asset and port: service cap reached, these duplicate hits are not counted (recorded only)"
          },
          "Service cap reached not counted " + summary.serviceCappedHits
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2("button", { className: "rt-btn", onClick: startNew }, "+ Add score point"),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Refreshing\u2026" : "Refresh"
        )
      ),
      msg ? h2(
        "div",
        { className: msg.err ? "rt-err" : "rt-foot" },
        msg.err || msg.ok
      ) : null,
      err ? h2("div", { className: "rt-err" }, err) : null,
      form ? h2(
        "div",
        {
          className: "rt-pane",
          style: {
            flex: "none",
            borderBottom: "1px solid var(--dsw-alias-border-l1)"
          }
        },
        /* Built-in score points (builtin): score / name / category are locked by "Scoring Rules"; inputs are disabled.
         Only "Enable / Disable" can be changed. */
        form.builtin ? h2(
          "div",
          { className: "rt-hint", style: { marginBottom: 8 } },
          h2(
            "b",
            null,
            'Built-in score point (from "Intrusion Scoring Rules (Merged)")'
          ),
          h2(
            "div",
            { style: { marginTop: 3 } },
            `Score, cap, criteria, and name are locked by rules \u2014 a rule's cap is cumulative across all score points in the group, changing one score alone would let a single hit consume the group cap. You can change "Enable / Disable" here; to customize scores, go back and click "+ Add score point".`
          ),
          form.src !== null && form.src !== void 0 ? h2(
            "div",
            {
              style: {
                marginTop: 3,
                color: "var(--dsw-alias-label-secondary)"
              }
            },
            "Rule number " + form.src + (form.rule ? " \xB7 Cap group rule=" + form.rule : "") + (form.cap > 0 ? " \xB7 Cap " + form.cap + " pts" : " \xB7 No cap")
          ) : null
        ) : null,
        h2(
          "div",
          { className: "rt-score-form" },
          h2("input", {
            className: "rt-input",
            placeholder: "Name (required)",
            value: form.name,
            readOnly: form.builtin === true,
            title: form.builtin ? "Name is locked by rules for built-in score points" : "",
            onChange: (e) => setField("name", e.target.value)
          }),
          h2("input", {
            className: "rt-input",
            placeholder: "Category, e.g. Account privilege",
            value: form.category,
            readOnly: form.builtin === true,
            title: form.builtin ? "Category is locked by rules for built-in score points (determines which panel group it belongs to)" : "",
            onChange: (e) => setField("category", e.target.value)
          }),
          h2("input", {
            className: "rt-input",
            type: "number",
            placeholder: "Points per hit",
            readOnly: form.builtin === true,
            title: form.builtin ? 'Score is locked by "Scoring Rules" for built-in score points and cannot be changed here' : "Points per hit for this type; each hit adds this score (subject to the rule cap)",
            value: form.points,
            onChange: (e) => setField("points", Number(e.target.value))
          }),
          h2(
            "select",
            {
              className: "rt-input",
              value: form.enabled ? "1" : "0",
              onChange: (e) => setField("enabled", e.target.value === "1")
            },
            h2("option", { value: "1" }, "Enabled"),
            h2("option", { value: "0" }, "Disabled")
          )
        ),
        h2("input", {
          className: "rt-input",
          style: {
            width: "100%",
            marginBottom: 6,
            boxSizing: "border-box"
          },
          placeholder: "Scoring criteria description",
          value: form.description,
          readOnly: form.builtin === true,
          title: form.builtin ? "Criteria text is locked by rules for built-in score points" : "",
          onChange: (e) => setField("description", e.target.value)
        }),
        h2(
          "div",
          { className: "rt-actions" },
          h2(
            "button",
            {
              className: "rt-btn rt-btn-primary",
              disabled: busy,
              onClick: save
            },
            "Save"
          ),
          form.id ? form.builtin ? h2(
            "button",
            {
              className: "rt-btn",
              disabled: true,
              title: 'Built-in score points cannot be deleted: removing one would leave a missing rule and omit a result category from reports (it will be restored on next startup). To exclude it from scoring, use "Disable" instead.'
            },
            "Delete (built-in items cannot be deleted)"
          ) : h2(
            "button",
            { className: "rt-btn", disabled: busy, onClick: remove },
            "Delete"
          ) : null,
          h2(
            "button",
            { className: "rt-btn", onClick: () => setForm(null) },
            "Cancel"
          )
        )
      ) : null,
      h2(
        "div",
        { className: "rt-table" },
        h2(
          "div",
          { className: "rt-score-row head" },
          h2("span", null, ""),
          h2("span", null, "Points"),
          h2("span", null, "Score points (low to high)"),
          h2("span", null, "Hits / Cap"),
          h2("span", { style: { textAlign: "right" } }, "Points earned")
        ),
        rows,
        !items.length ? h2(
          "div",
          { className: "rt-empty" },
          'No score points yet; click "+ Add score point" in the top right'
        ) : null
      )
    );
  }
  const COLLAPSE_KEY = "rt-collapse:";
  const collapseLoad = (prefix) => {
    try {
      const raw = window.localStorage.getItem(COLLAPSE_KEY + prefix);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (e) {
      return {};
    }
  };
  const collapseSave = (prefix, value) => {
    try {
      window.localStorage.setItem(COLLAPSE_KEY + prefix, JSON.stringify(value));
    } catch (e) {
    }
  };
  function useCollapse(prefix) {
    const [state, setState] = import_react2.default.useState(() => collapseLoad(prefix));
    import_react2.default.useEffect(() => {
      setState(collapseLoad(prefix));
    }, [prefix]);
    const write = (next) => {
      collapseSave(prefix, next);
      setState(next);
    };
    const isOpen = (key, defaultOpen) => {
      const v = state[key];
      return v === void 0 ? defaultOpen !== false : v === true;
    };
    const toggle = (key, defaultOpen) => (e) => {
      if (e && e.stopPropagation) e.stopPropagation();
      write(Object.assign({}, state, { [key]: !isOpen(key, defaultOpen) }));
    };
    const setAll = (keys, open) => {
      const next = Object.assign({}, state);
      for (const k of keys) next[k] = open;
      write(next);
    };
    return { isOpen, toggle, setAll };
  }
  function Section(props) {
    const always = props.always === true;
    const open = always || props.open === true;
    const head = h2(
      "div",
      {
        className: "rt-sec t-" + (props.tone || "target") + (always ? " flat" : ""),
        role: always ? void 0 : "button",
        tabIndex: always ? void 0 : 0,
        "aria-expanded": always ? void 0 : open ? "true" : "false",
        onClick: always ? void 0 : props.onToggle,
        onKeyDown: always ? void 0 : (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            if (props.onToggle) props.onToggle(e);
          }
        }
      },
      h2("span", { className: "rt-sec-caret" }, always ? "\u258D" : open ? "\u25BE" : "\u25B8"),
      props.title ? h2("span", { className: "rt-sec-title" }, props.title) : null,
      props.count !== void 0 && props.count !== null ? h2("span", { className: "rt-sec-count" }, String(props.count)) : null,
      props.sub ? h2("span", { className: "rt-sec-sub" }, props.sub) : null,
      props.right ? h2("span", { className: "rt-sec-right" }, props.right) : null
    );
    return h2(
      "div",
      { className: "rt-sec-wrap" },
      head,
      open && props.children ? h2("div", { className: "rt-sec-body" }, props.children) : null
    );
  }
  function Clip(props) {
    const [open, setOpen] = import_react2.default.useState(false);
    const text = String(
      props.text === void 0 || props.text === null ? "" : props.text
    );
    if (text.trim() === "") return null;
    return h2(
      "div",
      { className: "rt-clip" + (open ? " open" : "") },
      h2(
        "div",
        { className: "rt-clip-head" },
        props.label ? h2("span", { className: "rt-clip-label" }, props.label) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn",
            style: { padding: "0 6px", fontSize: 11 },
            onClick: (e) => {
              e.stopPropagation();
              copyText(text);
            }
          },
          "Copy"
        ),
        h2(
          "button",
          {
            className: "rt-btn",
            style: { padding: "0 6px", fontSize: 11 },
            onClick: (e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }
          },
          open ? "Collapse" : "Expand"
        )
      ),
      h2("div", { className: "rt-clip-body" }, text)
    );
  }
  const TEST_STATUS_LABEL = {
    untested: "Untested",
    testing: "Testing",
    tested: "Tested",
    blocked: "Blocked",
    abandoned: "Abandoned",
    no_surface: "No attack surface"
  };
  function TestingTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [at, setAt] = import_react2.default.useState(null);
    const [auto, setAuto] = import_react2.default.useState(true);
    const collapse = useCollapse("testing:" + eng);
    const inflight = import_react2.default.useRef(false);
    const seq = import_react2.default.useRef(0);
    const load = () => {
      if (!eng || inflight.current) return;
      inflight.current = true;
      const my = ++seq.current;
      api({ op: "activeTests", engagement: eng, limit: 20 }).then(
        (r) => {
          if (my !== seq.current) return;
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
          setAt(/* @__PURE__ */ new Date());
        },
        (e) => {
          if (my === seq.current) setErr(String(e && e.message || e));
        }
      ).finally(() => {
        if (my === seq.current) inflight.current = false;
      });
    };
    import_react2.default.useEffect(() => {
      seq.current += 1;
      load();
    }, [eng, refreshKey]);
    import_react2.default.useEffect(() => {
      if (!eng || !auto) return void 0;
      const timer = setInterval(load, 5e3);
      return () => clearInterval(timer);
    }, [eng, auto, refreshKey]);
    const testing = data && data.testing || [];
    const recent = data && data.recent || [];
    const queue = data && data.queue || [];
    const stats = data && data.stats || {};
    const card = (a, past) => {
      const chips = [];
      chips.push(
        h2(
          "span",
          {
            key: "sc",
            className: "rt-scope rt-scope-" + (a.scope === "internal" ? "internal" : "external")
          },
          a.scope === "internal" ? "Internal network" : "External network"
        )
      );
      if (a.segment_cidr)
        chips.push(
          h2("span", { key: "seg", className: "rt-tag" }, a.segment_cidr)
        );
      if (a.open_ports)
        chips.push(
          h2(
            "span",
            { key: "p", className: "rt-tag rt-tag-active" },
            "Open " + a.open_ports + " ports"
          )
        );
      if (a.vulns)
        chips.push(
          h2(
            "span",
            { key: "v", className: "rt-tag rt-tag-live" },
            "Confirmed vulns " + a.vulns
          )
        );
      if (a.webshells)
        chips.push(
          h2(
            "span",
            { key: "w", className: "rt-tag rt-tag-passive" },
            "WebShell " + a.webshells
          )
        );
      if (a.tunnels)
        chips.push(
          h2(
            "span",
            { key: "t", className: "rt-tag rt-tag-passive" },
            "Tunnels " + a.tunnels
          )
        );
      if (a.priority)
        chips.push(
          h2("span", { key: "pr", className: "rt-tag" }, "Ease " + a.priority)
        );
      if (a.blocked_count)
        chips.push(
          h2(
            "span",
            {
              key: "b",
              className: "rt-tag",
              style: { color: "#ef4444", borderColor: "#ef444455" }
            },
            "Blocked " + a.blocked_count + " times"
          )
        );
      const noteLines = a.test_notes ? String(a.test_notes).split("\n").slice(-3).map((l) => l.length > 240 ? l.slice(0, 240) + " \u2026" : l) : [];
      return h2(
        "div",
        { key: "at" + a.id, className: "rt-atest" + (past ? " past" : "") },
        h2(
          "div",
          { className: "rt-atest-head" },
          past ? null : h2("span", { className: "rt-live-dot" }),
          h2("span", { className: "rt-atest-ip" }, a.ip),
          h2(
            "span",
            {
              className: "rt-tag " + (a.test_status === "testing" ? "rt-tag-live" : "")
            },
            TEST_STATUS_LABEL[a.test_status] || a.test_status
          ),
          h2("div", { className: "rt-spacer" }),
          h2(
            "span",
            {
              style: {
                fontSize: 11,
                color: "var(--dsw-alias-label-secondary)"
              }
            },
            fmt(a.test_updated_at) + (a.test_updated_by ? " \xB7 " + a.test_updated_by : "")
          )
        ),
        chips.length ? h2("div", null, chips) : null,
        a.test_surface ? h2(
          "div",
          { className: "rt-atest-meta" },
          "Test surface: " + a.test_surface
        ) : null,
        a.potential ? h2("div", { className: "rt-atest-meta" }, "Expected score: " + a.potential) : null,
        noteLines.length ? h2(Clip, { label: "Test notes", text: noteLines.join("\n") }) : null
      );
    };
    const concl = (label, value, tone) => h2(
      "span",
      { key: label, className: "rt-concl-i", style: { cursor: "default" } },
      h2("b", null, String(value || 0)),
      h2("span", null, label)
    );
    const conclusion = h2(
      "div",
      { className: "rt-concl" },
      concl("Testing", stats.testing, "live"),
      concl("Pending", stats.untested, ""),
      concl("Tested", stats.tested, ""),
      concl("Abandoned", (stats.abandoned || 0) + (stats.blocked || 0), ""),
      concl("No attack surface", stats.no_surface, ""),
      h2("div", { className: "rt-spacer" }),
      at ? h2(
        "span",
        {
          style: {
            fontSize: 11,
            color: "var(--dsw-alias-label-secondary)"
          }
        },
        "Updated at " + at.toLocaleTimeString("en-US", { hour12: false })
      ) : null,
      h2(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          title: "Expand recently active and pending queue",
          onClick: () => collapse.setAll(
            ["testing:" + eng, "recent:" + eng, "queue:" + eng],
            true
          )
        },
        "Expand all"
      ),
      h2(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          title: "Show only testing",
          onClick: () => collapse.setAll(
            ["testing:" + eng, "recent:" + eng, "queue:" + eng],
            false
          )
        },
        "Collapse all"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (auto ? " rt-btn-primary" : ""),
          style: { padding: "0 7px", fontSize: 11 },
          title: "Auto-refresh every 5 seconds",
          onClick: () => setAuto((x) => !x)
        },
        auto ? "Live \xB7 5s" : "Paused"
      ),
      h2(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          onClick: load
        },
        "Refresh"
      )
    );
    const body = [];
    body.push(
      h2(
        Section,
        {
          key: "testing",
          tone: "test",
          title: "Testing",
          count: testing.length + " hosts",
          sub: testing.length ? "Agent is attacking these assets" : "Assets will appear here in real time when the agent starts testing them",
          open: collapse.isOpen("testing:" + eng, true),
          onToggle: collapse.toggle("testing:" + eng, true)
        },
        testing.length ? testing.map((a) => card(a, false)) : h2(
          "div",
          { className: "rt-atest-meta", style: { paddingBottom: 4 } },
          'No assets are currently in "Testing"'
        )
      )
    );
    body.push(
      h2(
        Section,
        {
          key: "recent",
          tone: "past",
          title: "Recently active",
          count: recent.length + " hosts",
          sub: "Assets that have been tested",
          open: collapse.isOpen("recent:" + eng, false),
          onToggle: collapse.toggle("recent:" + eng, false)
        },
        recent.length ? recent.map((a) => card(a, true)) : h2("div", { className: "rt-atest-meta" }, "None")
      )
    );
    body.push(
      h2(
        Section,
        {
          key: "queue",
          tone: "queue",
          title: "Pending queue",
          count: (data ? data.untested || 0 : 0) + " hosts",
          sub: "Prioritized by exploitability and port count",
          open: collapse.isOpen("queue:" + eng, false),
          onToggle: collapse.toggle("queue:" + eng, false)
        },
        queue.length ? queue.map((a) => card(a, true)).concat([
          h2(
            "div",
            {
              key: "queueHint",
              className: "rt-atest-meta",
              style: { paddingTop: 4 }
            },
            'See the "Asset mapping" page for the full list (with filtering and sorting)'
          )
        ]) : h2("div", { className: "rt-atest-meta" }, "No pending assets")
      )
    );
    return h2(
      "div",
      { className: "rt-main" },
      conclusion,
      err ? h2("div", { className: "rt-err" }, err) : null,
      data === null && !err ? h2("div", { className: "rt-empty" }, "Loading\u2026") : null,
      h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        h2("div", { style: { padding: "6px 12px 14px" } }, body)
      )
    );
  }
  function SessionTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [msg, setMsg] = import_react2.default.useState(null);
    const [copied, setCopied] = import_react2.default.useState(null);
    const load = () => {
      if (!eng) return;
      api({ op: "sessions", engagement: eng }).then(
        (r) => {
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => setErr(String(e && e.message || e))
      );
    };
    import_react2.default.useEffect(load, [eng, refreshKey]);
    const probe = () => {
      setBusy(true);
      setMsg(null);
      api({ op: "probeSessions", engagement: eng, timeoutMs: 6e3 }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Check failed" });
            load();
            return;
          }
          const on = (r.webshells || []).filter(
            (x) => x.status === "online"
          ).length;
          const act = (r.tunnels || []).filter(
            (x) => x.status === "active"
          ).length;
          setMsg({
            ok: "Check complete: WebShells online " + on + "/" + (r.webshells || []).length + ", tunnels available " + act + "/" + (r.tunnels || []).length
          });
          load();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const copy = (key, text) => copyWithFeedback(text, text, (okFlag, message) => {
      if (!okFlag) {
        setMsg({ err: message });
        return;
      }
      setCopied(key);
      setTimeout(() => setCopied((c) => c === key ? null : c), 1500);
    });
    const markTunnel = (t, status) => {
      setMsg(null);
      api({
        op: "updateTunnel",
        engagement: eng,
        id: t.id,
        patch: { status, check_note: "Manually marked in UI" }
      }).then(
        () => load(),
        (e) => setMsg({ err: String(e && e.message || e) })
      );
    };
    const markShell = (w, status) => {
      setMsg(null);
      api({
        op: "updateWebshell",
        engagement: eng,
        id: w.id,
        patch: { status, check_note: "Manually marked in UI" }
      }).then(
        () => load(),
        (e) => setMsg({ err: String(e && e.message || e) })
      );
    };
    const sessCollapse = useCollapse("sessions:" + eng);
    const totals = data && data.totals || {};
    const shells = data && data.webshells || [];
    const tunnels = data && data.tunnels || [];
    const statusDot = (s) => h2("span", {
      className: s === "online" || s === "active" ? "rt-dot-on" : s === "unknown" || !s ? "rt-dot-unk" : "rt-dot-off"
    });
    const fact = (label, value) => h2(
      "div",
      { className: "rt-sess-fact" },
      h2("b", null, label),
      h2("span", null, value)
    );
    const isEncryptedShell = (t) => /behinder|godzilla/i.test(String(t || ""));
    const isSuo5 = (t) => /suo5/i.test(String(t || ""));
    const hint = (key, title, detail) => h2(
      "div",
      { key, className: "rt-hint" },
      h2("b", null, title),
      h2(
        "details",
        { className: "rt-sess-fold", style: { marginTop: 3 } },
        h2("summary", null, "How to do it (click to expand)"),
        h2("div", { style: { marginTop: 4 } }, detail)
      )
    );
    const hints = [];
    const badShells = shells.filter((w) => !isEncryptedShell(w.shell_type));
    const legitTunnels = tunnels.filter((t) => t.legit === true);
    if (badShells.length > 0) {
      hints.push(
        hint(
          "h1",
          "There are " + badShells.length + " entries that are not Behinder/Godzilla webshells (users cannot connect; not deliverable entry points)",
          "Use the webshell-toolkit skill to re-upload a Behinder or Godzilla webshell, and record shell_type + pass_key via redteam_webshell_add. If used only as a temporary relay, note it in remarks."
        )
      );
    }
    if (tunnels.length > 0 && legitTunnels.length === 0) {
      hints.push(
        hint(
          "h3",
          "Existing " + tunnels.length + ' channels do not count as "crossing the engagement boundary" (not a boundary/internal breach)',
          "socks5, frp, or proxies opened on your own VPS/self-hosted server do not count as tunnels. Channels must be initiated from the target side: target reverse shell to us, frp/Stowaway client running on target, or suo5/HTTP tunnel via target WebShell; specify with entry_kind when registering."
        )
      );
    }
    const activeSuo5 = tunnels.filter(
      (t) => isSuo5(t.kind) && t.status === "active"
    );
    if (shells.length > 0 && activeSuo5.length === 0) {
      hints.push(
        hint(
          "h2",
          "No available suo5 tunnel yet (standard channel for internal network access)",
          'Use the suo5-tunnel skill to create a socks5 tunnel through the WebShell above, then register with redteam_tunnel_add(kind=suo5, listen=127.0.0.1:1080, entry=WebShell URL, reach=reachable subnets), then click "Check connectivity" to confirm status=active.'
        )
      );
    }
    const shellCards = shells.map(
      (w) => h2(
        "div",
        { key: "w" + w.id, className: "rt-sess" },
        h2(
          "div",
          { className: "rt-sess-head" },
          statusDot(w.status),
          h2("span", { className: "rt-sess-title" }, w.url),
          h2(
            "span",
            { className: "rt-tag rt-tag-active" },
            w.shell_type || "webshell"
          ),
          isEncryptedShell(w.shell_type) ? null : h2("span", { className: "rt-tag rt-tag-warn" }, "User cannot connect"),
          w.privilege ? h2("span", { className: "rt-tag" }, w.privilege) : null,
          h2("div", { className: "rt-spacer" }),
          copied === "cmd" + w.id ? h2(
            "span",
            { className: "rt-tag", style: { color: "#10b981" } },
            "Copied"
          ) : h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => copy("cmd" + w.id, 'curl -s "' + w.url + '"')
            },
            "Copy URL"
          ),
          h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markShell(w, "offline")
            },
            "Mark invalid"
          )
        ),
        h2(
          "div",
          { className: "rt-sess-facts" },
          fact(
            "Type",
            isEncryptedShell(w.shell_type) ? "Encrypted webshell (Behinder/Godzilla, user can connect directly)" : "Non-encrypted webshell \u2014 user cannot connect, temporary relay only"
          ),
          w.pass_key ? fact("Connection password", h2("span", { className: "rt-mono" }, w.pass_key)) : null,
          w.asset_ip ? fact("Asset", w.asset_ip) : null,
          w.privilege ? fact("Privilege", w.privilege) : null,
          w.secret_ref ? fact(
            "Credential reference",
            h2("span", { className: "rt-mono" }, w.secret_ref)
          ) : null,
          fact(
            "Last check",
            (w.last_check ? fmt(w.last_check) : "Not checked") + (w.latency_ms !== null && w.latency_ms !== void 0 ? "\uFF08" + w.latency_ms + "ms\uFF09" : "")
          ),
          w.check_note ? fact("Check note", w.check_note) : null,
          w.note ? fact("Notes", w.note) : null
        )
      )
    );
    const tunnelCards = tunnels.map((t) => {
      const proxy = t.listen ? "socks5://" + t.listen : "";
      const gogoCmd = t.listen ? "./gogo -i <internal-CIDR> -m ss --ping -p top2,win,db --proxy " + proxy : "";
      const fscanCmd = t.listen ? "./fscan -h <internal-CIDR> -np -nobr -nopoc -socks5 " + t.listen + " -o intranet.txt" : "";
      return h2(
        "div",
        { key: "t" + t.id, className: "rt-sess" },
        h2(
          "div",
          { className: "rt-sess-head" },
          statusDot(t.status),
          h2(
            "span",
            { className: "rt-sess-title" },
            t.listen || "(No listen address)"
          ),
          h2("span", { className: "rt-tag rt-tag-passive" }, t.kind || "tunnel"),
          isSuo5(t.kind) ? null : h2(
            "span",
            { className: "rt-tag rt-tag-warn" },
            "Non-standard suo5 channel"
          ),
          /* Only channels crossing the engagement boundary count as breach evidence (channels opened on your own VPS/self-hosted server do not count) */
          t.legit === true ? h2(
            "span",
            {
              className: "rt-tag rt-tag-live",
              title: t.entry_kind_label || ""
            },
            "Target-side channel"
          ) : t.legit === false ? h2(
            "span",
            {
              className: "rt-tag rt-tag-warn",
              title: "Channel opened only on your own VPS/self-hosted server, does not reach target \u2014 not a boundary/internal breach"
            },
            "Not a breach"
          ) : h2(
            "span",
            {
              className: "rt-tag",
              title: "entry_kind not declared: specify what the target-side endpoint is (target-outbound / target-http / target-agent)"
            },
            "Pending confirmation"
          ),
          t.reach ? h2("span", { className: "rt-tag" }, "Reachable " + t.reach) : null,
          h2("div", { className: "rt-spacer" }),
          h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => copy("sock" + t.id, t.listen || "")
            },
            copied === "sock" + t.id ? "Copied" : "Copy address"
          ),
          t.status === "active" ? h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markTunnel(t, "down")
            },
            "Mark invalid"
          ) : h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markTunnel(t, "active")
            },
            "Mark active"
          )
        ),
        h2(
          "div",
          { className: "rt-sess-facts" },
          fact("Target-side entry", t.entry || "Not registered"),
          fact(
            "Crosses boundary",
            t.legit === true ? h2(
              "span",
              { className: "rt-tag rt-tag-live" },
              t.entry_kind_label || t.entry_kind || "Target side confirmed"
            ) : t.legit === false ? h2(
              "span",
              { className: "rt-tag rt-tag-warn" },
              "Not a breach (proxy only on your own VPS)"
            ) : h2(
              "span",
              { className: "rt-tag" },
              "entry_kind not declared, pending confirmation"
            )
          ),
          t.reach ? fact("Reachable subnets", t.reach) : null,
          t.asset_ip ? fact("Asset", t.asset_ip) : null,
          fact(
            "Last check",
            (t.last_check ? fmt(t.last_check) : "Not checked") + (t.latency_ms !== null && t.latency_ms !== void 0 ? "\uFF08" + t.latency_ms + "ms\uFF09" : "")
          ),
          t.check_note ? fact("Check note", t.check_note) : null,
          t.note ? fact("Notes", t.note) : null
        ),
        /* Commands collapsed by default: primary info is whether the channel works and where it leads; expand commands on demand */
        t.command ? h2(
          "details",
          { className: "rt-sess-fold" },
          h2("summary", null, "Setup command (click to expand / copy)"),
          h2(
            "div",
            Object.assign(
              { className: "rt-code", title: "Click to copy" },
              clickable(() => copy("c" + t.id, t.command), {
                label: "Copy command"
              })
            ),
            copied === "c" + t.id ? "Copied" : t.command
          )
        ) : null,
        t.status === "active" && t.listen ? h2(
          "details",
          { className: "rt-sess-fold" },
          h2("summary", null, "Scan through this tunnel (gogo / fscan commands)"),
          h2(
            "div",
            { className: "rt-sess-cmd" },
            h2(
              "div",
              Object.assign(
                { className: "rt-code", title: "Click to copy" },
                clickable(() => copy("g" + t.id, gogoCmd), {
                  label: "Copy gogo command"
                })
              ),
              copied === "g" + t.id ? "Copied" : gogoCmd
            ),
            h2(
              "div",
              Object.assign(
                {
                  className: "rt-code",
                  style: { display: "block", marginTop: 3 },
                  title: "Click to copy"
                },
                clickable(() => copy("f" + t.id, fscanCmd), {
                  label: "Copy fscan command"
                })
              ),
              copied === "f" + t.id ? "Copied" : fscanCmd
            )
          )
        ) : null
      );
    });
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Sessions and entry points"),
        h2(
          "span",
          { className: "rt-tag" },
          "WebShell " + (totals.webshellsOnline || 0) + "/" + (totals.webshells || 0) + " online"
        ),
        h2(
          "span",
          { className: "rt-tag" },
          "Tunnels " + (totals.tunnelsActive || 0) + "/" + (totals.tunnels || 0) + " available"
        ),
        h2("span", { className: "rt-tag" }, "Credentials " + (totals.credentials || 0)),
        h2("span", { className: "rt-tag" }, "Access sessions " + (totals.access || 0)),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy,
            onClick: probe
          },
          busy ? "Checking\u2026" : "Check connectivity"
        ),
        h2("button", { className: "rt-btn", onClick: load }, "Refresh")
      ),
      msg ? h2(
        "div",
        { className: msg.err ? "rt-err" : "rt-foot" },
        msg.err || msg.ok
      ) : null,
      err ? h2("div", { className: "rt-err" }, err) : null,
      h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        !shells.length && !tunnels.length ? h2(
          "div",
          { className: "rt-empty" },
          h2("div", null, "No WebShells or tunnels registered yet."),
          h2(
            "div",
            { style: { marginTop: 6, fontSize: 12 } },
            "Register WebShells with redteam_webshell_add; register tunnels with redteam_tunnel_add (suo5 / socks5 / ssh -R); agents can then see them via redteam_sessions."
          )
        ) : null,
        hints.length ? h2("div", { style: { padding: "8px 10px 0" } }, hints) : null,
        h2(
          Section,
          {
            key: "webshells",
            tone: "queue",
            title: "WebShell",
            count: (totals.webshellsOnline || 0) + "/" + (totals.webshells || 0) + " online",
            sub: "Online controllable entry points",
            open: sessCollapse.isOpen("shells", true),
            onToggle: sessCollapse.toggle("shells", true)
          },
          shells.length ? h2(
            "div",
            { className: "rt-sess-grid", style: { padding: 0 } },
            shellCards
          ) : h2(
            "div",
            { className: "rt-atest-meta" },
            "None (register with redteam_webshell_add after obtaining a WebShell)"
          )
        ),
        h2(
          Section,
          {
            key: "tunnels",
            tone: "test",
            title: "Internal network tunnels",
            count: (totals.tunnelsActive || 0) + "/" + (totals.tunnels || 0) + " available",
            sub: "Can be used directly as scanner proxies",
            open: sessCollapse.isOpen("tunnels", true),
            onToggle: sessCollapse.toggle("tunnels", true)
          },
          tunnels.length ? h2(
            "div",
            { className: "rt-sess-grid", style: { padding: 0 } },
            tunnelCards
          ) : h2(
            "div",
            { className: "rt-atest-meta" },
            "None (register with redteam_tunnel_add after creating a tunnel)"
          )
        )
      )
    );
  }
  class RtBoundary extends import_react2.default.Component {
    constructor(props) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
      return { error };
    }
    componentDidCatch(error) {
      try {
        console.error("[redteam-ui] Page render error:", error);
      } catch (e) {
      }
    }
    render() {
      if (this.state.error) {
        const msg = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error);
        return h2(
          "div",
          { className: "rt-pane" },
          h2("div", { className: "rt-err" }, "This page failed to render: " + msg),
          h2(
            "button",
            {
              className: "rt-btn",
              onClick: () => {
                this.setState({ error: null });
                setUI({ tab: "assets" });
              }
            },
            "Back to asset mapping"
          )
        );
      }
      return this.props.children;
    }
  }
  function AgentsTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [roles, setRoles] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [concurrency, setConcurrency] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const load = () => {
      setBusy(true);
      api({
        op: eng ? "prompts" : "bootstrap",
        engagement: eng || void 0
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Read failed");
            return;
          }
          setErr(null);
          if (r.roles) setRoles(r.roles);
        },
        (e) => {
          setBusy(false);
          setErr(String(e && e.message || e));
        }
      );
      api({ op: "agentsStatus" }).then(
        (r) => {
          if (r && r.ok !== false) setConcurrency(r);
        },
        () => {
        }
      );
    };
    import_react2.default.useEffect(load, [eng, refreshKey]);
    const used = concurrency ? concurrency.used : null;
    const max = concurrency ? concurrency.max : 3;
    return h2(
      "div",
      { className: "rt-main" },
      h2(
        "div",
        { className: "rt-toolbar" },
        h2("span", { style: { fontWeight: 600 } }, "Operations agent"),
        h2("span", { className: "rt-tag rt-tag-passive" }, "Concurrency limit " + max),
        used === null ? h2("span", { className: "rt-tag" }, "Usage unknown") : h2(
          "span",
          {
            className: "rt-tag" + (used >= max ? " rt-tag-warn" : " rt-tag-live")
          },
          "Running " + used + " / Available " + Math.max(max - used, 0)
        ),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Reading\u2026" : "Refresh"
        )
      ),
      h2(
        "div",
        { className: "rt-pane" },
        err ? h2("div", { className: "rt-err" }, err) : null,
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "Concurrency rules (hard constraints)"),
          h2(
            "div",
            { style: { fontSize: 12, lineHeight: 1.7 } },
            "- **At most " + max + " execution agents at the same time** per engagement; the main session must reserve a slot with `redteam_agent_slot` before dispatching, and reject when full.",
            h2("br"),
            "- **Dispatch one at a time and proceed sequentially by default**; parallelize only tasks that are truly independent.",
            h2("br"),
            "- Each session has **its own engagement binding**: parallel sessions do not mix up reports (sub-agents inherit the parent session engagement)."
          )
        ),
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "Six roles"),
          h2(
            "div",
            { style: { fontSize: 12, lineHeight: 1.8 } },
            "1. Reconnaissance `recon` \u2014 collect assets only; cover all organization assets (including edge and unregistered assets)",
            h2("br"),
            "2. Asset assessment `assess` \u2014 review each asset, assess exploitability, and store all results",
            h2("br"),
            "3. Vulnerability discovery `vuln-scan` \u2014 dedupe against database first -> prioritize Nday/1day -> probe for unauthorized interfaces",
            h2("br"),
            "4. Exploitation `exploit` \u2014 obtain server access first (Behinder/Godzilla webshell) + establish suo5 tunnel, then pursue other scoring items",
            h2("br"),
            "5. Internal penetration `internal` \u2014 go through tunnels and run 1-2-3-4 in sequence for the internal network",
            h2("br"),
            "6. Main session `plan` \u2014 planning, dispatch, summarization, and reporting only; no hands-on execution"
          )
        ),
        h2(ConcurrencyCard, { concurrency, onSaved: load }),
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "Role prompts (stored per engagement, editable here)"),
          h2(
            "div",
            {
              style: {
                fontSize: 11.5,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 6
              }
            },
            '"Agent prompts" has been merged into this page; below is the full editor (save after changes; affects current engagement only).'
          ),
          h2(PromptsTab, { engagement: eng, refreshKey })
        )
      )
    );
  }
  function ConcurrencyCard(props) {
    const info = props.concurrency || {};
    const [draft, setDraft] = import_react2.default.useState("");
    const [busy, setBusy] = import_react2.default.useState(false);
    const [msg, setMsg] = import_react2.default.useState(null);
    import_react2.default.useEffect(() => {
      if (info.max) setDraft(String(info.max));
    }, [info.max]);
    const limit = info.limit || 10;
    const used = typeof info.used === "number" ? info.used : null;
    const source = info.source === "settings" ? "Set in panel" : info.source === "env" ? "Environment variable REDTEAM_MAX_AGENTS" : "Default";
    const n = Number(draft);
    const invalid = !Number.isFinite(n) || Math.floor(n) !== n || n < 1 || n > limit;
    const save = () => {
      if (invalid) return;
      setBusy(true);
      setMsg(null);
      api({ op: "setAgentsMax", max: n }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Save failed" });
            return;
          }
          setMsg({
            ok: "Saved: concurrency limit " + r.max + " (effective immediately, no restart required)"
          });
          if (props.onSaved) props.onSaved();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    return h2(
      "div",
      { className: "rt-card" },
      h2("h4", null, "Concurrency count"),
      h2(
        "div",
        { style: { fontSize: 12, lineHeight: 1.8, marginBottom: 8 } },
        "**Maximum execution agents at the same time** per engagement. Currently effective: **" + (info.max || "?") + "**" + (used === null ? "" : " (running " + used + ", available " + Math.max((info.max || 0) - used, 0) + "\uFF09") + ", source: " + source + ". Changes take effect **immediately**, no restart required."
      ),
      h2(
        "div",
        {
          style: {
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap"
          }
        },
        h2("input", {
          className: "rt-input",
          style: { width: 90 },
          type: "number",
          min: 1,
          max: limit,
          value: draft,
          onChange: (e) => setDraft(e.target.value)
        }),
        h2(
          "span",
          {
            style: {
              fontSize: 11.5,
              color: "var(--dsw-alias-label-secondary)"
            }
          },
          "Range 1 - " + limit
        ),
        h2(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy || invalid,
            onClick: save
          },
          busy ? "Saving\u2026" : "Save"
        ),
        msg && msg.err ? h2(
          "span",
          { style: { fontSize: 12, color: "var(--rt-danger, #d33)" } },
          msg.err
        ) : null,
        msg && msg.ok ? h2(
          "span",
          {
            style: {
              fontSize: 12,
              color: "var(--dsw-alias-label-secondary)"
            }
          },
          msg.ok
        ) : null
      ),
      h2(
        "div",
        { className: "rt-note", style: { marginTop: 8 } },
        "Warning: increasing does not mean faster: **concurrency/rate limits are shared for the same model API key**; dispatching too many at once causes contention, leading to queuing, timeouts, truncated responses, or rate-limit errors \u2014 making test results unstable (missed tests, incomplete runs). Start with 2-3, and increase only when the key quota is sufficient and tasks are truly independent."
      )
    );
  }
  function VersionBar(props) {
    const [info, setInfo] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [busy, setBusy] = import_react2.default.useState(false);
    const [open, setOpen] = import_react2.default.useState(false);
    const [msg, setMsg] = import_react2.default.useState(null);
    const [countdown, setCountdown] = import_react2.default.useState(0);
    const countdownRef = import_react2.default.useRef(null);
    const clearCountdown = import_react2.default.useCallback(() => {
      if (countdownRef.current) {
        try {
          clearInterval(countdownRef.current);
        } catch {
        }
      }
      countdownRef.current = null;
    }, []);
    import_react2.default.useEffect(() => () => clearCountdown(), [clearCountdown]);
    const closeModal = import_react2.default.useCallback(() => {
      clearCountdown();
      setCountdown(0);
      setOpen(false);
    }, [clearCountdown]);
    const check = (silent) => {
      if (!silent) setBusy(true);
      api({ op: "updateCheck" }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            if (!silent) setErr(r && r.error || "Update check failed");
            api({ op: "version" }).then(
              (v) => {
                if (v && v.ok !== false) setInfo(v);
              },
              () => {
              }
            );
            return;
          }
          setErr(null);
          setInfo(r);
        },
        (e) => {
          setBusy(false);
          if (!silent) setErr(String(e && e.message || e));
          api({ op: "version" }).then(
            (v) => {
              if (v && v.ok !== false) setInfo(v);
            },
            () => {
            }
          );
        }
      );
    };
    import_react2.default.useEffect(() => {
      check(true);
    }, []);
    const apply2 = () => {
      setBusy(true);
      setMsg(null);
      api({
        op: "updateApply",
        target: info && info.latest || void 0
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "Update failed" });
            return;
          }
          setMsg({
            ok: "Installed " + (r.installed || "") + ", restarting current host..."
          });
          setCountdown(6);
          clearCountdown();
          countdownRef.current = setInterval(() => {
            setCountdown((n) => {
              if (n <= 1) {
                clearCountdown();
                window.location.reload();
                return 0;
              }
              return n - 1;
            });
          }, 1e3);
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const current = info && info.current ? info.current : info && info.plugin ? info.plugin.version : null;
    const latest = info && info.latest ? info.latest : null;
    const hasNew = !!(info && info.updateAvailable);
    const blockers = info && info.blockers || [];
    const notes = info && info.notes || [];
    const mode = info && info.install ? info.install.mode : null;
    return h2(
      "span",
      { style: { display: "inline-flex", alignItems: "center", gap: 6 } },
      h2(
        "span",
        {
          className: "rt-tag" + (hasNew ? " rt-tag-warn" : ""),
          title: "Current version " + (current || "Unknown") + (latest ? "\nLatest version " + latest : "") + (mode === "dev" ? "\nInstall method: Development (source symlink)" : mode === "package" ? "\nInstall method: Package install" : "") + (info && info.check_error ? "\nCheck failed: " + info.check_error : "")
        },
        "v" + (current || "?")
      ),
      hasNew ? h2(
        "button",
        {
          className: "rt-btn rt-btn-primary",
          disabled: busy,
          onClick: () => {
            setOpen(true);
            setMsg(null);
          },
          title: "New version found " + latest + ": click to view and update with one click (will restart current host)"
        },
        busy ? "Checking\u2026" : "New version v" + latest
      ) : h2(
        "button",
        {
          className: "rt-btn",
          disabled: busy,
          onClick: () => check(false),
          title: "Recheck latest version on npm"
        },
        busy ? "Checking\u2026" : "Check for updates"
      ),
      open ? h2(
        "div",
        {
          className: "rt-modal",
          "aria-hidden": "true",
          onClick: closeModal
        },
        h2(
          "div",
          {
            className: "rt-modal-box",
            onClick: (e) => e.stopPropagation()
          },
          h2("h4", { style: { marginTop: 0 } }, "Update RedTeam mode"),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Current version"),
            h2("span", null, current || "Unknown")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Latest version"),
            h2("span", null, latest || "Unknown")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Install method"),
            h2(
              "span",
              null,
              mode === "dev" ? "Development (source symlink)" : mode === "package" ? "Package install (" + (info.install && info.install.packageManager || "npm") + "\uFF09" : "Unknown"
            )
          ),
          info && info.install && info.install.dir ? h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "Install location"),
            h2("span", { className: "rt-mono" }, info.install.dir)
          ) : null,
          blockers.length ? h2(
            "div",
            { className: "rt-hint" },
            h2(
              "div",
              { style: { fontWeight: 600, marginBottom: 4 } },
              "Cannot update now: "
            ),
            blockers.map(
              (b, i) => h2("div", { key: "b" + i }, "\xB7 " + b)
            )
          ) : null,
          notes.length ? h2(
            "div",
            { className: "rt-foot", style: { padding: "4px 0" } },
            notes.map((n, i) => h2("div", { key: "n" + i }, n))
          ) : null,
          h2(
            "div",
            {
              style: {
                fontSize: 12,
                color: "var(--dsw-alias-label-secondary)",
                margin: "8px 0"
              }
            },
            "Update process: install new version -> automatically restart current host (official exe / community edition / dsh web; this page will disconnect and auto-refresh after ~5-10 seconds). Before restart, checks if any agents are running and blocks if so."
          ),
          msg ? h2(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok
          ) : null,
          countdown > 0 ? h2(
            "div",
            { className: "rt-foot" },
            "Host is restarting, page will auto-refresh in " + countdown + " seconds..."
          ) : null,
          h2(
            "div",
            {
              style: {
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                marginTop: 10
              }
            },
            h2(
              "button",
              { className: "rt-btn", onClick: closeModal },
              "Close"
            ),
            h2(
              "button",
              {
                className: "rt-btn rt-btn-primary",
                disabled: busy || blockers.length > 0 || mode === "dev",
                title: mode === "dev" ? "Use repository workflow to upgrade development installs" : blockers.length ? "Resolve the blockers above first" : "Install and restart",
                onClick: apply2
              },
              busy ? "Updating\u2026" : "Update and restart"
            )
          )
        )
      ) : null
    );
  }
  const UNREAD_KEY = "rt-unread:";
  const loadUnread = (eng) => {
    try {
      const raw = window.localStorage.getItem(UNREAD_KEY + eng);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === "object" ? parsed : null;
    } catch (e) {
      return null;
    }
  };
  const saveUnread = (eng, value) => {
    try {
      window.localStorage.setItem(UNREAD_KEY + eng, JSON.stringify(value));
    } catch (e) {
    }
  };
  const digestHasNew = (prev, cur) => {
    if (!cur) return false;
    if (!prev) return true;
    const pc = Number(prev.count || 0);
    const cc = Number(cur.count || 0);
    if (cc > pc) return true;
    const pa = prev.at || "";
    const ca = cur.at || "";
    return ca !== "" && ca !== pa && ca > pa;
  };
  const RT_GEOM_KEY = "rt-dock-geom-v1";
  function clampRtGeom(g) {
    const vw = typeof window !== "undefined" && window.innerWidth || 1280;
    const vh = typeof window !== "undefined" && window.innerHeight || 800;
    const w = Math.min(
      Math.max(320, Number(g && g.w) || 620),
      Math.max(320, vw)
    );
    const h3 = Math.min(
      Math.max(240, Number(g && g.h) || 520),
      Math.max(240, vh)
    );
    const x = Math.min(Math.max(0, Number(g && g.x) || 0), Math.max(0, vw - w));
    const y = Math.min(Math.max(0, Number(g && g.y) || 0), Math.max(0, vh - h3));
    return { x, y, w, h: h3 };
  }
  function defaultRtGeom() {
    const vw = typeof window !== "undefined" && window.innerWidth || 1280;
    const vh = typeof window !== "undefined" && window.innerHeight || 800;
    let w = 620;
    try {
      const saved = Number(window.localStorage.getItem("rt-dock-width"));
      if (Number.isFinite(saved) && saved >= 320 && saved <= 1200) w = saved;
    } catch (e) {
    }
    const h3 = Math.max(240, Math.min(640, vh - 24));
    return clampRtGeom({ x: Math.max(0, vw - w - 12), y: 12, w, h: h3 });
  }
  function loadRtGeom() {
    try {
      const raw = JSON.parse(
        window.localStorage.getItem(RT_GEOM_KEY) || "null"
      );
      if (raw && typeof raw === "object") return clampRtGeom(raw);
    } catch (e) {
    }
    return defaultRtGeom();
  }
  function Panel(props) {
    const embedded = !!(props && props.embedded);
    const st = useUI();
    const [engagements, setEngagements] = import_react2.default.useState([]);
    const [eng, setEng] = import_react2.default.useState(null);
    const [snapshot, setSnapshot] = import_react2.default.useState(null);
    const [err, setErr] = import_react2.default.useState(null);
    const [newName, setNewName] = import_react2.default.useState("");
    const [geom, setGeom] = import_react2.default.useState(loadRtGeom);
    const [creating, setCreating] = import_react2.default.useState(false);
    const [refreshKey, setRefreshKey] = import_react2.default.useState(0);
    const [digest, setDigest] = import_react2.default.useState(null);
    const [seen, setSeen] = import_react2.default.useState(null);
    import_react2.default.useEffect(() => {
      if (embedded) return void 0;
      try {
        window.localStorage.setItem(RT_GEOM_KEY, JSON.stringify(geom));
      } catch (e) {
      }
    }, [geom, embedded]);
    import_react2.default.useEffect(() => {
      if (embedded) return void 0;
      const onResize = () => setGeom((g) => clampRtGeom(g));
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [embedded]);
    const loadSnapshot = (id) => {
      if (!id) {
        setSnapshot(null);
        return;
      }
      api({ op: "snapshot", engagement: id }).then(
        (r) => {
          if (!r || r.ok === false) {
            setErr(r && r.error || "Load failed");
            return;
          }
          setErr(null);
          setSnapshot(r);
        },
        (e) => setErr(String(e && e.message || e))
      );
    };
    const refreshList = (selectId) => {
      api({ op: "bootstrap" }).then(
        (b) => {
          setEngagements(b && b.engagements || []);
          if (selectId) {
            setEng(selectId);
            loadSnapshot(selectId);
          }
        },
        () => {
        }
      );
    };
    import_react2.default.useEffect(() => {
      api({ op: "bootstrap" }).then(
        (r) => {
          if (!r || r.ok === false) {
            setErr(r && r.error || "Cannot connect to asset database");
            return;
          }
          setEngagements(r.engagements || []);
          const id = r.current || r.engagements && r.engagements[0] && r.engagements[0].id || null;
          if (id) {
            setEng(id);
            loadSnapshot(id);
          }
        },
        (e) => setErr(String(e && e.message || e))
      );
    }, []);
    const openEngagement = (nameArg) => {
      const name2 = String(nameArg || newName).trim();
      if (!name2) return;
      setCreating(true);
      api({ op: "openEngagement", name: name2 }).then(
        (r) => {
          setCreating(false);
          if (!r || r.ok === false) {
            setErr(r && r.error || "Creation failed");
            return;
          }
          setNewName("");
          refreshList(r.engagement && r.engagement.id);
        },
        (e) => {
          setCreating(false);
          setErr(String(e && e.message || e));
        }
      );
    };
    const refreshAll = () => {
      setRefreshKey((k) => k + 1);
      api({ op: "bootstrap" }).then(
        (b) => {
          setEngagements(b && b.engagements || []);
          if (eng) loadSnapshot(eng);
        },
        () => {
          if (eng) loadSnapshot(eng);
        }
      );
    };
    const trackPointer = (e, move) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const up = () => {
        window.removeEventListener("mousemove", move);
        window.removeEventListener("mouseup", up);
      };
      window.addEventListener("mousemove", move);
      window.addEventListener("mouseup", up);
    };
    const startDrag = (e) => {
      if (e.target && e.target.closest && e.target.closest("button,a,input,select,textarea,label"))
        return;
      const sx = e.clientX;
      const sy = e.clientY;
      const ox = geom.x;
      const oy = geom.y;
      trackPointer(
        e,
        (ev) => setGeom(
          (g) => clampRtGeom({
            x: ox + (ev.clientX - sx),
            y: oy + (ev.clientY - sy),
            w: g.w,
            h: g.h
          })
        )
      );
    };
    const startResizeLeft = (e) => {
      const sx = e.clientX;
      const ox = geom.x;
      const ow = geom.w;
      trackPointer(e, (ev) => {
        const dx = ev.clientX - sx;
        setGeom((g) => clampRtGeom({ x: ox + dx, y: g.y, w: ow - dx, h: g.h }));
      });
    };
    const startResizeRight = (e) => {
      const sx = e.clientX;
      const ow = geom.w;
      trackPointer(
        e,
        (ev) => setGeom(
          (g) => clampRtGeom({ x: g.x, y: g.y, w: ow + (ev.clientX - sx), h: g.h })
        )
      );
    };
    const startResizeBottom = (e) => {
      const sy = e.clientY;
      const oh = geom.h;
      trackPointer(
        e,
        (ev) => setGeom(
          (g) => clampRtGeom({ x: g.x, y: g.y, w: g.w, h: oh + (ev.clientY - sy) })
        )
      );
    };
    const startResizeCorner = (e) => {
      const sx = e.clientX;
      const sy = e.clientY;
      const ow = geom.w;
      const oh = geom.h;
      trackPointer(
        e,
        (ev) => setGeom(
          (g) => clampRtGeom({
            x: g.x,
            y: g.y,
            w: ow + (ev.clientX - sx),
            h: oh + (ev.clientY - sy)
          })
        )
      );
    };
    import_react2.default.useEffect(() => {
      if (!eng) {
        setDigest(null);
        setSeen(null);
        return void 0;
      }
      setSeen(loadUnread(eng));
      let alive = true;
      let digestInflight = false;
      const tick = () => {
        if (digestInflight)
          return;
        digestInflight = true;
        api({ op: "consoleDigest", engagement: eng }).then(
          (r) => {
            if (alive && r && r.ok !== false && r.sections)
              setDigest(r.sections);
          },
          () => {
          }
        ).finally(() => {
          digestInflight = false;
        });
      };
      tick();
      const timer = window.setInterval(tick, 25e3);
      return () => {
        alive = false;
        window.clearInterval(timer);
      };
    }, [eng, refreshKey]);
    const markTabSeen = import_react2.default.useCallback(
      (tab) => {
        if (!eng) return;
        setSeen((prev) => {
          const base = prev || (() => {
            const fresh = {};
            for (const [k, v] of Object.entries(digest || {}))
              fresh[k] = { count: Number(v.count || 0), at: v.at || null };
            return fresh;
          })();
          const next = Object.assign({}, base);
          const cur = digest && digest[tab];
          if (cur)
            next[tab] = { count: Number(cur.count || 0), at: cur.at || null };
          saveUnread(eng, next);
          return next;
        });
      },
      [eng, digest]
    );
    const unreadOf = (tab) => {
      if (!eng || !digest) return false;
      if (!seen) return false;
      return digestHasNew(seen[tab], digest[tab]);
    };
    const stats = snapshot && snapshot.stats || {};
    const tabs = [
      ["assets", "Asset mapping"],
      ["env", "Environment adaptation"],
      ["agents", "Agent"],
      ["sessions", "Session tunnels"],
      ["findings", "Vulnerability findings"],
      ["chain", "Attack chain"],
      ["scores", "Score goals"],
      ["report", "Report"],
      ["knowledge", "Knowledge base"],
      ["skills", "Skill library"]
    ];
    const full = isFullWindow();
    const openFull = () => {
      try {
        window.open(
          window.location.href.split("#")[0] + "#redteam-full",
          "_blank",
          "noopener"
        );
      } catch (e) {
        setErr("Cannot open new window: " + (e && e.message || e));
      }
    };
    const exitFull = () => {
      try {
        window.close();
      } catch (e) {
      }
      try {
        if (window.location.hash) {
          window.location.hash = "";
          window.location.reload();
        }
      } catch (e) {
      }
    };
    import_react2.default.useEffect(() => {
      if (!full) return void 0;
      const onKey = (e) => {
        if (e.key === "Escape") exitFull();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [full]);
    let body;
    if (err) body = h2("div", { className: "rt-err" }, err);
    else if (st.tab === "knowledge")
      body = h2(KnowledgeTab, { refreshKey });
    else if (st.tab === "env") body = h2(EnvTab, { refreshKey });
    else if (st.tab === "skills")
      body = h2(SkillsTab, { refreshKey });
    else if (st.tab === "agents" || st.tab === "prompts")
      body = h2(AgentsTab, { engagement: eng, refreshKey });
    else if (!eng) {
      body = h2(
        "div",
        { className: "rt-pane" },
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "No engagement yet"),
          h2(
            "div",
            {
              style: {
                fontSize: 12,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 8
              }
            },
            "Enter the target organization name for the exercise, create an engagement, and start asset mapping."
          ),
          h2(
            "div",
            { style: { display: "flex", gap: 8 } },
            h2("input", {
              className: "rt-input",
              style: { flex: 1 },
              placeholder: "e.g. Example Technology Co., Ltd.",
              value: newName,
              onChange: (e) => setNewName(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") openEngagement();
              }
            }),
            h2(
              "button",
              {
                className: "rt-btn rt-btn-primary",
                disabled: creating,
                onClick: () => openEngagement()
              },
              creating ? "Creating\u2026" : "Create engagement"
            )
          )
        )
      );
    } else if (st.tab === "assets")
      body = h2(AssetsTab, {
        engagement: eng,
        snapshot,
        refreshKey,
        onRefresh: refreshAll,
        onData: () => loadSnapshot(eng)
      });
    else if (st.tab === "testing")
      body = h2(AssetsTab, {
        engagement: eng,
        snapshot,
        refreshKey,
        onRefresh: refreshAll,
        onData: () => loadSnapshot(eng)
      });
    else if (st.tab === "sessions")
      body = h2(SessionTab, { engagement: eng, refreshKey });
    else if (st.tab === "findings")
      body = h2(FindingsTab, { engagement: eng, refreshKey });
    else if (st.tab === "chain")
      body = h2(ChainTab, { engagement: eng, refreshKey });
    else if (st.tab === "report")
      body = h2(ReportTab, { engagement: eng, refreshKey });
    else if (st.tab === "attackfiles")
      body = h2(FindingsTab, { engagement: eng, refreshKey });
    else if (st.tab === "scores")
      body = h2(ScoreTab, { engagement: eng, refreshKey });
    else body = h2("div", { className: "rt-empty" }, "Unknown tab");
    const shellProps = full ? { className: "rt-full", style: { display: "flex" } } : embedded ? {
      className: "rt-dock rt-embedded",
      "data-open": "1",
      style: { width: "100%", display: "flex" }
    } : {
      className: "rt-dock",
      "data-open": st.open ? "1" : "0",
      style: {
        left: geom.x + "px",
        top: geom.y + "px",
        right: "auto",
        bottom: "auto",
        width: geom.w + "px",
        height: geom.h + "px",
        display: st.open ? "flex" : "none"
      }
    };
    return h2(
      "div",
      shellProps,
      full || embedded ? null : h2("div", {
        className: "rt-grip",
        title: "Drag to resize width",
        onMouseDown: startResizeLeft
      }),
      full || embedded ? null : h2("div", {
        className: "rt-resize-r",
        title: "Drag to resize width",
        onMouseDown: startResizeRight
      }),
      full || embedded ? null : h2("div", {
        className: "rt-resize-b",
        title: "Drag to resize height",
        onMouseDown: startResizeBottom
      }),
      full || embedded ? null : h2("div", {
        className: "rt-resize-c",
        title: "Drag to resize",
        onMouseDown: startResizeCorner
      }),
      h2(
        "div",
        {
          className: "rt-head",
          onMouseDown: full || embedded ? void 0 : startDrag,
          title: full || embedded ? void 0 : "Drag to move panel"
        },
        embedded ? null : h2(
          "div",
          { className: "rt-title" },
          h2("span", { className: "rt-dot" }),
          full ? "Operations console \xB7 Full view" : "Operations console",
          full ? h2(
            "span",
            { className: "rt-tag", style: { marginLeft: 6 } },
            "Separate window"
          ) : null
        ),
        h2(
          "select",
          {
            className: "rt-input rt-eng-select",
            style: {
              maxWidth: embedded ? "100%" : "170px",
              minWidth: embedded ? "160px" : void 0,
              flex: embedded ? "1 1 200px" : void 0
            },
            value: eng || "",
            onChange: (e) => {
              setEng(e.target.value);
              loadSnapshot(e.target.value);
              api({
                op: "activateEngagement",
                engagement: e.target.value
              }).catch(() => {
              });
            }
          },
          h2(
            "option",
            { value: "", disabled: true },
            engagements.length ? "Select engagement" : "No engagement"
          ),
          engagements.map(
            (x) => h2("option", { key: x.id, value: x.id }, x.name || x.id || "Unnamed")
          )
        ),
        h2("div", { className: "rt-spacer" }),
        embedded ? null : h2(VersionBar, null),
        full ? h2(
          "button",
          {
            className: "rt-btn",
            title: "Return to normal interface with sidebar (or press Esc)",
            onClick: exitFull
          },
          "Exit full view"
        ) : null,
        embedded ? null : h2(
          "button",
          {
            className: "rt-btn",
            title: "Refresh roster, snapshot, and current page data",
            onClick: refreshAll
          },
          "Refresh"
        ),
        full || embedded ? null : h2(
          "button",
          {
            className: "rt-btn",
            title: "Open full console in a new browser window",
            onClick: openFull
          },
          "Full view"
        ),
        full || embedded ? null : h2(
          "button",
          {
            className: "rt-btn",
            title: "Collapse panel",
            onClick: () => setUI({ open: false })
          },
          "Collapse"
        )
      ),
      /* Tab bar uses standard tablist/tab roles: screen readers announce tab index and selection state.
           Keyboard users can switch with Enter/Space after tabbing in (provided by clickable). */
      h2(
        "div",
        { className: "rt-tabs", role: "tablist" },
        tabs.map((t) => {
          const activate = () => {
            markTabSeen(t[0]);
            setUI({ tab: t[0] });
            setRefreshKey((k) => k + 1);
          };
          return h2(
            "div",
            Object.assign({}, clickable(activate, { label: t[1] }), {
              key: t[0],
              className: "rt-tab" + (st.tab === t[0] ? " on" : ""),
              role: "tab",
              "aria-selected": st.tab === t[0] ? "true" : "false",
              title: unreadOf(t[0]) ? t[1] + ": New content; open to mark as read and clear the dot" : t[1]
            }),
            t[1],
            unreadOf(t[0]) ? (
              /* Red dot is visual only; provide text alternative for screen readers */
              h2("span", { className: "rt-tab-dot", "aria-label": "New content" })
            ) : null
          );
        })
      ),
      h2(
        "div",
        { className: "rt-body", key: "body-" + st.tab },
        h2(RtBoundary, { key: st.tab }, body)
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2("span", null, "C segments " + (stats.segments || 0)),
        h2(
          "span",
          null,
          "Assets " + (stats.assets || 0) + " (live " + (stats.liveAssets || 0) + "\uFF09"
        ),
        h2("span", null, "Ports " + (stats.openPorts || 0)),
        h2("span", null, "Fingerprints " + (stats.fingerprints || 0)),
        h2("span", null, "Vulns " + (stats.vulns || 0)),
        h2(
          "span",
          null,
          "Passive/Active " + (stats.passiveSignals || 0) + "/" + (stats.activeSignals || 0)
        ),
        h2("div", { className: "rt-spacer" }),
        full ? h2("span", null, 'Press Esc or click "Exit full view" in the top right to return to the sidebar interface') : null,
        h2(
          "span",
          null,
          "SQLite \xB7 " + (snapshot && snapshot.engagement ? snapshot.engagement.name : "")
        )
      )
    );
  }
  function SidebarButton(props) {
    const st = useUI();
    return h2(
      "button",
      {
        className: "rt-icon-btn" + (st.open ? " on" : ""),
        title: "RedTeam console (persistent right sidebar)",
        onClick: () => setUI({ open: !st.open })
      },
      h2("span", { style: { fontSize: 14 } }, "\u26E8"),
      props.wide ? h2("span", null, "RedTeam") : null
    );
  }
  function HeaderButton() {
    const st = useUI();
    return h2(
      "button",
      {
        className: "rt-hbtn" + (st.open ? " on" : ""),
        title: "RedTeam console (persistent right sidebar)",
        onClick: () => setUI({ open: !st.open })
      },
      "\u26E8 RedTeam"
    );
  }
  function FullButton(props) {
    const open = () => {
      try {
        window.open(
          window.location.href.split("#")[0] + "#redteam-full",
          "_blank",
          "noopener"
        );
      } catch {
      }
    };
    return h2(
      "button",
      {
        className: "rt-icon-btn",
        title: "Full view: open full console in a new window (current window unaffected; press Esc in the new window to exit)",
        onClick: open
      },
      h2("span", { style: { fontSize: 14 } }, "\u26F6"),
      props.wide ? h2("span", null, "Full view") : null
    );
  }
  const inject2 = ["slots"];
  function applyDrillParts() {
    return {
      CSS,
      Panel,
      setUI,
      useUI,
      isFullWindow,
      setDockWidth
    };
  }
  exports.inject = inject2;
  return applyDrillParts();
})();

// src/state/dock.js
var AUTH_KEY = "dsh-purge-drill-auth";
var drillGrantGen = 0;
var drillGrantPosting = 0;
var drillGrantState = { ready: false, granted: false };
var drillSyncRetryTimer = null;
function readDrillAuth() {
  if (drillGrantState.ready) return drillGrantState.granted;
  try {
    return window.localStorage.getItem(AUTH_KEY) === "1";
  } catch {
    return false;
  }
}
function setDrillAuthLocal(ok) {
  try {
    if (ok) window.localStorage.setItem(AUTH_KEY, "1");
    else window.localStorage.removeItem(AUTH_KEY);
  } catch {
  }
  drillGrantState = { ready: true, granted: !!ok };
}
function writeDrillAuth(ok) {
  drillGrantGen += 1;
  const gen = drillGrantGen;
  setDrillAuthLocal(ok);
  if (!ok) return;
  drillGrantPosting += 1;
  fetch(apiUrl("/dsh-purge/drill-grant"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  }).then((r) => r.json()).then((saved) => {
    if (gen !== drillGrantGen) return;
    setDrillAuthLocal(!!(saved && saved.granted));
  }).catch(() => {
  }).finally(() => {
    drillGrantPosting = Math.max(0, drillGrantPosting - 1);
  });
}
function startGrantSync() {
  syncDrillGrant();
  return () => {
    drillGrantGen += 1;
    if (drillSyncRetryTimer) clearTimeout(drillSyncRetryTimer);
    drillSyncRetryTimer = null;
  };
}
function syncDrillGrant(attempt) {
  const n = attempt || 0;
  const gen = drillGrantGen;
  if (drillSyncRetryTimer) {
    try {
      clearTimeout(drillSyncRetryTimer);
    } catch {
    }
    drillSyncRetryTimer = null;
  }
  fetch(apiUrl("/dsh-purge/drill-grant"), { method: "GET" }).then((r) => r.json()).then((r) => {
    if (gen !== drillGrantGen) return;
    if (!r || r.ok === false) throw new Error("grant");
    if (r.granted) {
      setDrillAuthLocal(true);
      if (dockBus.authOpen) setDock({ authOpen: false });
      return;
    }
    if (drillGrantPosting > 0) return;
    setDrillAuthLocal(false);
    if (dockBus.authOpen || dockBus.tab === "drill") {
      setDock({
        open: true,
        tab: "drill",
        authOpen: true,
        pending: dockBus.pending || "tab"
      });
    }
  }).catch(() => {
    if (gen !== drillGrantGen) return;
    if (n < 5) {
      drillSyncRetryTimer = window.setTimeout(() => {
        drillSyncRetryTimer = null;
        syncDrillGrant(n + 1);
      }, 400);
    }
  });
}
var dockBus = {
  open: false,
  tab: "clean",
  authOpen: false,
  pending: "tab",
  listeners: /* @__PURE__ */ new Set()
};
function setDock(patch) {
  dockBus = Object.assign({}, dockBus, patch);
  if (patch.open && nativeSidebar) {
    try {
      nativeSidebar.openTab("dsh-purge");
    } catch {
    }
  }
  dockBus.listeners.forEach((fn) => {
    try {
      fn(dockBus);
    } catch {
    }
  });
}
function useDock() {
  const [st, setSt] = useState(dockBus);
  useEffect(() => {
    const fn = (next) => setSt(next);
    dockBus.listeners.add(fn);
    return () => {
      dockBus.listeners.delete(fn);
    };
  }, []);
  return st;
}
function requestDrill(kind) {
  const pending = kind || "tab";
  const openEnv = () => {
    try {
      if (__dshPurgeDrill && __dshPurgeDrill.setUI) {
        __dshPurgeDrill.setUI({ open: true, tab: "env" });
      }
    } catch {
    }
  };
  if (readDrillAuth()) {
    setDock({ open: true, tab: "drill", authOpen: false, pending: "tab" });
    try {
      if (__dshPurgeDrill && __dshPurgeDrill.setUI)
        __dshPurgeDrill.setUI({ open: true });
    } catch {
    }
    if (pending === "env") openEnv();
    if (pending === "full") {
      try {
        window.open(
          window.location.href.split("#")[0] + "#redteam-full",
          "_blank",
          "noopener"
        );
      } catch {
      }
    }
    return;
  }
  setDock({ open: true, tab: "drill", authOpen: true, pending });
}
function requestDrillEnv() {
  requestDrill("env");
}
var nativeSidebar = null;

// src/components/auth.js
var rd = __toESM(require("react-dom"), 1);

// src/shared/locale.js
var NS = "settings.dsh-purge-panel";
function englishText(key, values = {}) {
  const text = en[key];
  if (typeof text !== "string") return key;
  return text.replace(
    /\{(\w+)\}/g,
    (placeholder, name2) => Object.hasOwn(values, name2) ? String(values[name2]) : placeholder
  );
}
var translate = englishText;
function setTranslate(t) {
  translate = t;
}
function useT() {
  return translate;
}
function compatibilityLevelText(t, level) {
  const key = "compat.level." + (level || "unknown");
  const hit = t(key);
  return hit && hit !== key ? hit : en[key] || level || t("unknown");
}
var en = {
  nav: "Rules",
  "dock.clean": "Clean",
  "dock.drill": "Drill",
  "dock.toggle": "dsh-purge",
  "dock.newSession": "dsh-purge",
  "dock.inSession": "dsh-purge",
  "dock.redteam": "Red team",
  "dock.full": "Full view",
  "dock.close": "Collapse",
  "dock.unauthorized": "Unauthorized",
  "welcome.title": "User notice",
  "welcome.lead": "Please read this on first install. After you confirm, it will not appear again.",
  "welcome.warn": "This plugin is free and open source. Anyone who sells, resells, or profits from it behind the author's back may face legal action.",
  "welcome.body": "dsh-purge is a local DeepSeek Harness plugin for security evaluation and cleaning: adjust prompts and patches on a machine you control, and use the drill console only within authorized scope. It is free and non-profit. Repository:",
  "welcome.repo": "https://github.com/YuJunZhiXue/dsh-purge",
  "welcome.ban1": "Do not use this project for unauthorized attacks, intrusion, data theft, sabotage, or any illegal activity.",
  "welcome.ban2": "Do not commercially sell, resell, or profit from gray-market use, or redistribute for profit without the author.",
  "welcome.ban3": "You must follow local law and platform rules; illegal use is solely your responsibility.",
  "welcome.bans": "Prohibitions",
  "welcome.check": "I have read and understand this notice and will use the plugin lawfully.",
  "welcome.ok": "I understand \u2014 continue",
  "auth.title": "Drill console authorization",
  "auth.lead": "Cleaning does not need this step. Opening Drill or Full view the first time requires this dialog.",
  "auth.warn": "Warning: the drill console is only for hosts you manage, offline targets, or written authorized exercises. Unauthorized intrusion, attack, theft, or sabotage is forbidden.",
  "auth.hint.wait": "Read the notice. You can check the boxes in {n}s.",
  "auth.hint.scroll": "Countdown finished. Scroll to the end, then check the boxes.",
  "auth.hint.check": "Countdown finished. Check all three boxes.",
  "auth.check.read": "I have read the Safety and Anti-Abuse Notice and accept every clause.",
  "auth.check.scope": "I will only use authorized local hosts, offline targets, or compliant exercises.",
  "auth.check.ban": "I will not use this for any illegal purpose. Without this authorization the drill console stays closed.",
  "auth.no": "Not now",
  "auth.ok": "Authorize",
  "auth.ok.tab": "Authorize and open Drill",
  "auth.ok.full": "Authorize and open Full view",
  "auth.ok.env": "Authorize and open Env adapt",
  "envGate.title": "Environment is not ready",
  "envGate.lead": "Red team mode needs local tools before you send. If none are available, open Env adapt or confirm you will continue without them.",
  "envGate.kaliHint": "When Kali is detected, local tools are used directly and paths are optional. Otherwise set each tool path in Env adapt, or pick one toolkit folder to assign them.",
  "envGate.skip": "Skip for now",
  "envGate.skipConfirm": "You can keep chatting after this. Scan and exploit skills stay unavailable until the tools are installed. You can add paths later under dsh-purge \u2192 Env adapt.",
  "envGate.skipNo": "Back",
  "envGate.skipYes": "Continue without tools",
  "envGate.go": "Open Env adapt",
  "compat.host": "dsh-purge Community {version} \xB7 host DSH {host} \xB7 compatibility: {level}",
  "compat.loading": "Reading the host version\u2026",
  "compat.unavailable": "Host compatibility is unavailable: {error}",
  "compat.level.qualified": "regression verified",
  "compat.level.unverified": "unverified version",
  "compat.level.mixed": "mixed component versions",
  "compat.level.sealed": "host archive located",
  "compat.level.kernel-verified": "kernel verified, host unverified",
  "compat.level.missing": "host not located",
  "compat.level.no-host": "host not located",
  "compat.level.unknown": "unknown",
  "theme.aria": "Appearance",
  "theme.white": "Light",
  "theme.ink": "Ink",
  "purge.title": "Patches",
  "override.title": "Prompt",
  "own.title": "Own servers",
  "own.hint": "One IP or exact hostname per line. account@host is accepted; the account only identifies that host. A hostname also allows the addresses it resolves to. Do not enter a key, a password, or a range.",
  "own.save": "Save list",
  "saved.own": "Own servers saved",
  "saved.own.dropped": "Saved. {n} lines were not a single IP or hostname and were dropped",
  "metric.purged": "Written",
  "metric.purged.skip": "Written. Skipped {n}; those files are not on this install",
  "metric.pendingShort": "Pending {n}",
  "metric.unmatchedShort": "No match {n}",
  "metric.partialShort": "Partial {n}",
  "metric.driftedShort": "Drifted {n}",
  "metric.disabledShort": "Opt-in off {n}",
  "metric.skipShort": "Skipped {n}",
  "metric.naShort": "Not for this host {n}",
  "metric.unlocated.count": "\u2014",
  "metric.shim": "shim",
  "metric.shim.na": "Not needed here",
  "metric.bak.yes": "Backup",
  "metric.bak.no": "No backup",
  "metric.bak.hint": "Backup",
  "table.patch": "Item",
  "table.status": "Status",
  "health.applied": "Applied",
  "status.title": "Purge status",
  "scan.recent": "Scanned {time} \xB7 click to refresh",
  "scan.hint": "Click to rescan the host",
  "health.pending": "Pending",
  "health.off": "Not enabled",
  "health.na": "Not for this host",
  "health.denomUnit": "patches written to the host",
  "health.hint.applied": "Anchors replaced; effective after a restart.",
  "health.hint.pending": "Switch is on but nothing is written yet. Apply to write; a backup is taken first.",
  "health.hint.off": "Its switch is off, so nothing was written. Not a failure.",
  "health.hint.na": "This host has no such component or file. Excluded from the denominator; zero work.",
  "health.verdict.pending": "{n} enabled but not written yet",
  "health.verdict.ok": "All host patches in place",
  "groups.unreadable": "Read failed; patch detail is unavailable. Refresh to retry.",
  "filter.all": "All",
  "filter.pending": "Pending",
  "filter.off": "Not enabled",
  "filter.na": "Not for this host",
  "filter.hint": "Open a group for rows; hover a status for the reason",
  "filter.empty": "No patches match this filter.",
  "sw.permission": "Permission patches",
  "sw.permission.desc": "Stop the host from blocking tool calls behind sandbox and approval gates. On by default.",
  "sw.permission.hint": "Rewrites the host sandbox / approval / auto-grant code: 14 patches (#6 #7 #8 #9 #10 #13 #14 #15 #16 #35 #51 #59 #60 #62). Nothing is written until you press Apply, and a backup is taken first; you must quit and reopen DSH yourself. Turning it off does not roll back what is already written; the next Apply does.",
  "sw.context": "Context management",
  "sw.context.desc": "Turn off the repeat-call reminder and tool-result pruning. Off by default; tokens grow when on.",
  "sw.context.hint": "#18 repeat-tool reminder and #19 tool-result pruner. With them off the model no longer gets repeat-call reminders and long tool output is kept in full; the cost is steady token growth. Off by default.",
  "sw.chip.pending": "{n} patches \xB7 to write",
  "sw.chip.on": "{n} patches \xB7 {written} written \xB7 {pending} to write",
  "detail.title": "Patch detail",
  "detail.reading": "Reading",
  "detail.unknown": "Unknown",
  "detail.unlocated": "Host not located",
  "sw.chip.written": "{n} written",
  "sw.chip.off": "{n} patches \xB7 not enabled",
  "sw.saving": "Saving\u2026",
  "sw.saved": "Saved. Press Apply to write to the host",
  "sw.fail": "Save failed: {error}",
  "sw.applyHint": "The switch only changes the plugin setting. Press Apply above and restart to reach the host.",
  "steps.title": "Write flow",
  "steps.1.t": "Press Apply",
  "steps.1.d": "Writes the selected patches into host files, with a backup first.",
  "steps.2.t": "Quit DSH yourself",
  "steps.2.d": "You close and reopen it; this plugin never restarts the app.",
  "steps.3.t": "Come back and check",
  "steps.3.d": "Everything should be green. Pending again means a host upgrade overwrote it; apply once more.",
  "steps.foot": '"Not for this host" is excluded from the denominator and from every failure count.',
  "hint.applied": "Anchors replaced; effective after restart.",
  "hint.pending": "Anchor still present; press Apply to write.",
  "hint.disabled": "Its group switch is off; nothing written.",
  "hint.na": "This host has no such component.",
  "hint.skipped": "Target file is not part of this install.",
  "hint.missing_file": "Target file is not part of this install.",
  "hint.drifted": "Drifted: the host changed this code; the patch needs an update.",
  "hint.unmatched": "No match: host version mismatch.",
  "hint.partial": "Some targets matched, another existed but did not match.",
  "hint.off": "Off.",
  "hint.unknown": "Unknown state.",
  "status.applied": "Applied",
  "status.off": "Off",
  "status.pending": "Pending",
  "status.unmatched": "No match",
  "status.partial": "Partial",
  "status.partialDetail": " ({done}/{total} targets)",
  "status.drifted": "Drifted",
  "status.disabled": "Opt-in off",
  "status.skipped": "Skipped",
  "apply.hint": "Apply writes patches and hangs the current default prompt. A stale plugin default in the box is refreshed from the sealed slot; a separate save is unnecessary. Only a prompt you wrote yourself is kept from the box. Pending = original text still present. Skipped = not needed for this version or the component is not installed.",
  "warn.noRoot": "Could not find this host\u2019s @deepseek-ai tree, so Apply will not patch anything. Fully quit and reopen this host, then Apply here. Desktop may live on any drive; folder names like DeepseekHarnessDesktop or DeepSeek Harness are fine.",
  "warn.noRoot.desktop": "Official Harness keeps its code in app.asar. Apply unpacks it and restarts the app. If this page stays \u201Cnot found\u201D, fully quit the client, reopen it, then Apply again. Third-party DSH Desktop: just Apply.",
  "unpack.restarting": "Patches are written. Click Restart and the client opens again by itself.",
  "restart.fullQuit": "Restarting. The client will open again by itself.",
  "warn.noInject": "Official mode always uses the default prompt. Red team uses only the active rule set; otherwise it uses the default prompt without the CTF section, then the red team steps. If both are empty you will be asked to add a prompt.",
  "need.prompt": "Both the prompt and the rule set are empty. Add a prompt, or enable a rule that has content.",
  "btn.restoreInject": "Reset default",
  "saved.restoreInject": "Default prompt restored",
  skip: "Skipped",
  unknown: "Unknown",
  delete: "Delete",
  "btn.apply": "Apply",
  "btn.apply.busy": "Working\u2026",
  "btn.revert": "Restore",
  "btn.uninstall": "Uninstall",
  "btn.uninstall.busy": "Uninstalling\u2026",
  "uninstall.title": "Uninstall dsh-purge",
  "uninstall.body": "Uninstall? This restores the original Harness and removes this plugin completely.",
  "uninstall.confirm": "Uninstall",
  "uninstall.cancel": "Cancel",
  "uninstall.applying": "Uninstalling and restoring\u2026",
  "uninstall.done": "Uninstalled and restored. Restarting\u2026",
  "uninstall.done.desktop": "Uninstalled and restored. Restarting the desktop app\u2026",
  "uninstall.fail": "Uninstall failed: {error}",
  "btn.checkUpdate": "Check update",
  "btn.checkUpdate.busy": "Checking\u2026",
  "btn.doUpdate": "Update",
  "btn.doUpdate.busy": "Updating\u2026",
  "channel.title": "Channel",
  "channel.stable": "Stable",
  "channel.beta": "Beta",
  "channel.useStable": "Switch to stable",
  "channel.useBeta": "Switch to beta",
  "channel.local": "This copy",
  "update.checking": "Checking for updates\u2026",
  "update.applying": "Updating\u2026",
  "update.switching": "Switching version\u2026",
  "update.latest": "Up to date ({version})",
  "update.available": "Update {remote} available (now {local})",
  "update.pinned": "Pinned at {version}; channel latest is {remote}",
  "update.done": "Updated to {version}.",
  "update.restarting": "Restored the old patches, wrote the new ones, and restarting\u2026",
  "update.fullQuit": "Patches are written. Click Restart and the client opens again by itself.",
  "restart.official.title": "Restart required",
  "restart.official.body": "Patches are written. Click Restart and the client opens again by itself.",
  "update.switched": "Switched to {version}.",
  "update.autoDone": "Auto-updated to {version}.",
  "update.reloading": "Refreshing settings\u2026",
  "update.dirty": "Update available; local edits were not overwritten.",
  "update.fail": "Update failed: {error}",
  "update.timeout": "Check timed out. Click Check update again.",
  "update.needRestart": "Update API is not loaded. Restart dsh, then check again.",
  "update.noBeta": "No beta build yet",
  "update.switch": "Switch to this version",
  "update.pick": "Select version",
  "update.tip": "latest",
  "update.current": "current",
  "update.confirmSwitch": "Switch to {version}? You can switch back later. Uncommitted plugin edits will not be kept.",
  "update.confirmChannel": "Switch to {version}? The plugin will be reinstalled from that channel. Uncommitted plugin edits will not be kept.",
  "metric.version": "Version",
  "action.apply": "Apply",
  "action.revert": "Restore",
  "action.uninstall": "Uninstall",
  "ok.done": "Done",
  "err.action": "Failed: {error}",
  "err.status": "Read failed: {error}",
  "err.override": "Read failed: {error}",
  "err.rules": "Read failed: {error}",
  "err.read": "Read failed: {error}",
  "err.save": "Save failed: {error}",
  "btn.saveInject": "Save",
  "saved.override": "Saved",
  "rules.title": "Rule sets",
  "rules.none": "None",
  "rules.reset": "Restore",
  "rules.reset.confirm": "Restore global instruction files? The rule library is kept.",
  "rules.empty": "No rules",
  "rules.pick": "Select a rule",
  "policy.title": "Workspace policy",
  "policy.strict": "Strict",
  "policy.fallback": "Fallback",
  "policy.always": "Always on",
  "policy.hint": "Strict: always strip AGENTS.md / CLAUDE.md. Fallback: use workspace files only when the prompt box is empty. Always on: keep DSH default behavior.",
  "cwd.title": "Local rules (current folder)",
  "cwd.empty": "No AGENTS.md / CLAUDE.md in this folder",
  "cwd.rescan": "Rescan",
  "cwd.hint": "Checked files are injected only when the prompt box is empty. A non-empty prompt box always wins.",
  "cwd.scope.cwd": "cwd",
  "cwd.scope.ancestor": "ancestor",
  "cwd.scope.root": "project root",
  "cwd.no.workspace": "DSH has not opened a workspace yet. Start a task in DSH first, then come back.",
  "pill.current": "On",
  "btn.use": "Enable",
  "btn.inUse": "On",
  "confirm.delete": "Delete {id}?",
  "ph.id": "id",
  "ph.alias": "Name",
  "ph.alias.short": "Name",
  "btn.create": "New",
  "need.id": "id required",
  "ph.content": "",
  "btn.saveRule": "Save",
  "skills.title": "Skills",
  "skills.hint": "After import, DSH calls it: type /name in chat to load now; the model calls the skill tool when the task matches description or whenToUse. Writing 'activate' in the body does nothing.",
  "skills.hint.desktop": "This desktop host\u2019s official skill catalog. Type /name in chat to load; the model calls the skill tool when the task matches the description.",
  "skills.empty": "No user skills",
  "btn.importZip": "Import zip",
  "btn.importFolder": "Import folder",
  "skills.importing": "Importing\u2026",
  "saved.import": "Imported {count} skill(s)",
  "need.import": "Choose a zip or folder",
  "err.import.folder": "No files were read. Select the skill folder itself (it must contain SKILL.md).",
  "skills.pick": "Select a skill",
  "skills.invalid": "Official catalog will ignore this: invalid format",
  "skills.call.slash": "Type {cmd} in chat",
  "skills.call.model": "Model can load",
  "skills.call.modelOff": "Hidden from model",
  "skills.call.userOff": "/name disabled",
  "ph.skill.desc": "description (when to use)",
  "btn.saveSkill": "Save",
  "need.skill.id": "id must be kebab-case, e.g. code-review",
  "confirm.delete.skill": "Delete {id} from official $DSH_HOME/skills? The host will drop it from the catalog.",
  "err.skills": "Read failed: {error}",
  "err.skills.needRestart": "Skill API is not loaded. Restart this host first.",
  "btn.restart": "Restart",
  "btn.restart.busy": "Restarting\u2026",
  restarting: "Restarting\u2026",
  "restarting.desktop": "Restarting the desktop app\u2026",
  "restart.timeout": "Timed out; refresh",
  "restart.fail": "Failed: {error}",
  "restart.notStarted": "Restart did not start. This client is still open, and it will not try again by itself.",
  "restart.already": "This restart already started. It will not restart again.",
  "restart.confirm": "Apply finished. Restart to take effect.",
  "restart.confirm.desktop": "Apply finished. Restart the desktop app to take effect.",
  "restart.ask.title": "Restart now?",
  "restart.ask.body": "It is written. It takes effect in this client after a restart.",
  "restart.now": "Restart now",
  "restart.notNow": "Later",
  "restart.asarSwap": "Patches are on disk. Quitting the desktop app and moving app.asar aside; it will reopen when done. If behavior is unchanged, fully quit Harness (including tray) and Apply again.",
  "surface.web": "Web",
  "surface.desktop": "Desktop",
  "surface.gui": "GUI",
  "surface.tui": "TUI",
  "restart.incomplete": "Apply did not complete. {detail}",
  "restart.incomplete.patches": "{failed} item(s) failed (#{ids}); inspect the item details",
  "restart.incomplete.flash": "Console-window suppression check failed ({entry})",
  "restart.incomplete.host": "Target host writes are not confirmed; check the client, host version and target path",
  "restart.incomplete.restore": "Configuration restoration did not complete; inspect diagnostics",
  "restart.incomplete.runtime": "CLI runtime check or repair failed; inspect diagnostics",
  "restart.incomplete.unknown": "The backend did not provide a specific cause; inspect the host version, item details and diagnostics",
  "restart.later": "Later",
  "group.prompt": "Prompt",
  "group.code": "Code",
  "group.engine": "Engine",
  "group.tools": "Tools",
  "group.compat": "0.1.5 compat",
  "group.dsh20": "0.2.0",
  "patch.1": "Global disclaimer \u2192 mandate",
  "patch.2": "Replacement disclaimer \u2192 mandate",
  "patch.3": "Scope disclaimer \u2192 mandate",
  "patch.4": "Persona session mandate",
  "patch.5": "Approval copy \u2192 full access",
  "patch.6": "Sandbox deny \u2192 allow write",
  "patch.7": "Sandbox default full access",
  "patch.8": "Approval default never",
  "patch.9": "Approval gate auto-grant",
  "patch.10": "Approval config default never",
  "patch.11": "never copy \u2192 auto-grant",
  "patch.12": "ask copy \u2192 auto-grant",
  "patch.13": "Escalation ladder exempt",
  "patch.14": "Escalation unconditional grant",
  "patch.15": "Sandbox confine passthrough",
  "patch.16": "Filesystem fence off",
  "patch.17": "Observation policy allow R/W",
  "patch.18": "Repeat-call guard off",
  "patch.19": "Tool-result pruner off",
  "patch.21": "Restore plugin-raised bash wait",
  "patch.22": "read cap raised",
  "patch.23": "subagent depth 3 \u2192 10",
  "patch.24": "preset fetch on",
  "patch.25": "Strip official default identity (keep feature prompts)",
  "patch.26": "minimal: strip identity, open inject",
  "patch.28": "dsh-liangshen: keep dsh-purge / dshpg in phase-1",
  "patch.70": "Minimal shell drops the no-network line",
  "patch.71": "Liangshen drops the stock identity line",
  "patch.29": "dsh-tool-web: untrusted framing \u2192 usable data",
  "patch.30": "dsh-hooks-claude-code: deny\u2192allow",
  "patch.31": "dsh-hooks-codex: deny\u2192allow",
  "patch.32": "Web surface identity neutral",
  "patch.33": "Shell denial prompt \u2192 executable",
  "patch.34": "Sandbox hint neutralized",
  "patch.35": "Escalation never-reject",
  "patch.36": "FS escalation schema opened",
  "patch.37": "Subagent scope lock neutralized",
  "patch.38": "persona text\u2192prefix (0.1.2 presets)",
  "patch.39": "session v0 plugin summary (mnemon)",
  "patch.40": "Keep inject when a complete prompt is set",
  "patch.42": "Settings legacy API",
  "patch.43": "Strip identity from web presets",
  "patch.45": "Official desktop update handoff",
  "patch.46": "Official update script stays ASCII",
  "patch.47": "OAuth no longer inserts Claude identity",
  "patch.48": "Shell drops extra delete caution",
  "patch.49": "OAuth no longer mimics claude-cli",
  "patch.50": "Session references are not marked untrusted",
  "patch.51": "Fresh session stays on full access",
  "patch.52": "Session log upload off by default",
  "patch.53": "Web prompt drops do-not-start",
  "patch.54": "Deliverable prompt drops extra prohibition",
  "patch.55": "Replace the first system prompt every step",
  "patch.56": "Rewind hides only the cut range",
  "patch.57": "developer role for openai/azure only, third-party gateways use system",
  "patch.58": "Rewind markers stay off the model request",
  "patch.59": "Official Auto Review no longer denies tools",
  "patch.60": "Official run_code drops approval teaching",
  "patch.61": "Official sandbox policy no longer teaches refusal",
  "patch.62": "Fail-open without approval channel (user reject kept)",
  "patch.63": "Plan mode no longer soft-blocks execution",
  "patch.64": "Stop hook no longer steers fake user text",
  "patch.65": "UserPromptSubmit deny no longer rejects turn",
  "patch.66": "Empty system section no longer ends the turn as an internal error",
  "patch.67": "A missing messages list no longer ends the turn",
  "patch.68": "Missing content after rewind no longer ends the turn",
  "patch.69": "deepseek-flash keeps the official in-history flag",
  "patch.72": "Messages system field uses the current system prompt",
  "patch.73": "Minimal preset drops stray mirror sentence",
  "patch.74": "Hang default prompt before first assemble",
  "patch.75": "Rewind resets completed todos to pending",
  "patch.76": "Unrestricted preset: strip identity sentence",
  "patch.77": "Rewind marker drops already-sent messages",
  "patch.78": "Restore missing overlay from .bak backup",
  "patch.80": "Restore official minimal tool plugins",
  "patch.82": "Fallback DSH_PROFILE=desktop in main process",
  "patch.83": "Don't fail on signal kill (no crash dialog)",
  "patch.84": "Don't fail on code=0 clean exit (no stopped dialog)",
  "status.na": "Not for this host",
  "metric.sealed": "Official client found. Apply to unpack",
  "metric.sealed.count": "Sealed",
  "metric.lost": "Patches lost \u2014 Apply again",
  "metric.lost.count": "Lost",
  "status.unlocated": "Not located",
  "metric.unlocated": "This install was not found yet",
  "rewind.settings": "Conversation appearance",
  "rewind.show": "Show the rewind button in the composer",
  "rewind.readAgain": "Try again",
  "rewind.label": "Undo",
  "rewind.aria": "Undo",
  "rewind.busy": "Undoing\u2026",
  "rewind.empty": "Nothing to undo",
  "rewind.fail": "Undo failed: {error}",
  "rewind.once": "Undo once",
  "rewind.once.hint": "Put this round's message back in the box and drop only this round",
  "rewind.round": "Undo last round",
  "rewind.round.hint": "Put this round's message back in the box; subagents drop only this round",
  "hooksDeny.title": "Hook interception",
  "hooksDeny.bypass": "Bypass hook deny / ask (patches 30 / 31 / 64 / 65)",
  "hooksDeny.hint": "When off, your own PreToolUse / UserPromptSubmit / Stop hook deny runs as the official host wrote it. The official ask branch is a no-op; turning this off will not show an approval dialog. Click Apply and restart to write the host files.",
  "saved.hooksDeny": "Saved",
  "continue.title": "Retry / Continue",
  "continue.hint": "Failed requests auto-retry. After an abnormal stop or interrupt, use Continue or auto-resume. A manual stop never auto-continues. Counts reset after a completed turn.",
  "continue.autoRetry": "Auto-retry on failure",
  "continue.retryMax": "Retry count",
  "continue.autoContinue": "Auto-continue after interrupt",
  "continue.continueMax": "Continue count",
  "continue.text": "Continue text",
  "saved.continue": "Saved",
  "continue.label": "Continue",
  "continue.aria": "Continue after an abnormal stop",
  "continue.busy": "Continuing\u2026",
  "continue.ready": "Continue ({left} left)",
  "continue.limit": "Continue limit reached",
  "continue.fail": "Continue failed: {error}",
  "updch.open": "Update channel",
  "updch.title": "Update channel: proxy and GitHub token",
  "updch.scope": "These settings apply only to this plugin's update check and download channel. They do not affect requests to any model provider and are never written into the host process environment. Leave blank to inherit the existing update proxy environment.",
  "updch.proxy": "Proxy URL",
  "updch.proxy.ph": "socks5://127.0.0.1:60808",
  "updch.proxy.hint": "Accepts http://, https:// and socks5:// prefixes, e.g. http://127.0.0.1:7890. Leave blank to inherit the existing update proxy environment.",
  "updch.token": "GitHub token",
  "updch.token.ph": "Optional: raises the GitHub API quota. Leave blank to keep it unchanged",
  "updch.token.set": "A token is configured on this machine. The field always starts empty; saving it empty keeps the current token.",
  "updch.token.unset": "No token is configured on this machine. Leaving it blank keeps it unset.",
  "updch.token.clear": "Clear the saved token",
  "updch.save": "Save",
  "updch.saving": "Saving\u2026",
  "updch.cancel": "Cancel",
  "updch.saved": "Update channel saved. It takes effect on the next update check.",
  "updch.state.proxy": "Update channel proxy: ",
  "updch.state.direct": "Update channel: inherited environment or system proxy",
  "updch.state.token.on": "GitHub token configured",
  "updch.state.token.off": "No GitHub token configured"
};

// ../../docs/drill-auth-legal.html
var drill_auth_legal_default = `<h3>Legal Disclaimer and Compliant Use Statement</h3>\r
    <p>Read this statement in full before entering the drill console. This is a nonprofit open-source project that complies with national laws, regulations, and platform rules, and is intended solely for learning, research, and technical reference. Commercial sales, paid resale, and profit from illicit or gray-market activities are strictly prohibited.</p>\r
    <p>The developers oppose and prohibit all unlawful or criminal activity. They do not support, encourage, or assist unauthorized cyberattacks, vulnerability exploitation, data theft, unlawful intrusion into computer information systems, or the generation of prohibited content. Anyone using this project unlawfully bears full, independent legal responsibility; such conduct is unrelated to the developers. Research, teaching, testing, demonstrations, and internal study do not exempt anyone from the following terms.</p>\r
    <h3>1. This repository contains no unlawful content</h3>\r
    <p>The code, documentation, patches, and default prompts distributed by dsh-purge are not Trojans, backdoors, unauthorized penetration tools, ransomware, credential-stuffing scripts, or attack payloads directed at public networks or third-party systems. The project neither provides unlawful content nor incites, organizes, or assists criminal activity.</p>\r
    <h3>2. Local operations do not grant external authorization</h3>\r
    <p>Applying patches, writing files, rolling back, and uninstalling operate on local files and processes. These operations do not scan, probe, intrude into, or send attack traffic to public hosts or unauthorized systems. The local machine must not be used as a stepping stone for such activity.</p>\r
    <p>If update checks are enabled, the plugin may access its own GitHub repository to check versions. This access is unrelated to attacks against third-party systems and cannot be interpreted as authorization for external penetration testing.</p>\r
    <h3>3. Permitted scope</h3>\r
    <p>Use is permitted only in environments for which you can demonstrate authority: an official local Harness installation you are entitled to administer; offline, locally synthesized targets; cybersecurity training ranges with lawful written authorization from their owners; and controlled environments in compliant laboratories. Written authorization must identify the specific targets, time, and scope. An organization name alone or a verbal assertion does not constitute authorization.</p>\r
    <p>Targets without lawful written authorization from their owners, live public systems, production services, and critical information infrastructure in energy, transportation, water, finance, public services, or electronic government must not be used as drill targets.</p>\r
    <h3>4. Applicable laws, articles, and paragraphs</h3>\r
    <p>Criminal Law of the People's Republic of China, Article 285, paragraph 1: intrusion, in violation of state regulations, into computer information systems concerning state affairs, national defense, or advanced science and technology is prohibited.</p>\r
    <p>Article 285, paragraph 2: intrusion into other computer information systems, obtaining data stored, processed, or transmitted by them through intrusion or other technical means, and unlawfully controlling such systems are prohibited.</p>\r
    <p>Article 285, paragraph 3: providing programs or tools specifically intended for intrusion into or unlawful control of computer information systems is prohibited, as is knowingly supplying such programs or tools to others carrying out those acts.</p>\r
    <p>Article 286, paragraph 1: deleting, modifying, adding to, or interfering with computer information system functions so that the system cannot operate normally is prohibited.</p>\r
    <p>Article 286, paragraph 2: deleting, modifying, or adding to data and applications stored, processed, or transmitted by a system is prohibited.</p>\r
    <p>Article 286, paragraph 3: intentionally creating or distributing computer viruses or other destructive programs that affect normal system operation is prohibited.</p>\r
    <p>Article 287: using computers to commit financial fraud, theft, embezzlement, misappropriation of public funds, theft of state secrets, or other crimes is prohibited.</p>\r
    <p>Article 287-1, paragraph 1, item (1): establishing websites or communication groups for fraud, teaching criminal methods, producing or selling prohibited or controlled items, or other unlawful activities is prohibited.</p>\r
    <p>Article 287-1, paragraph 1, item (2): publishing information about producing or selling drugs, firearms, obscene materials, other prohibited or controlled items, or other unlawful activities is prohibited.</p>\r
    <p>Article 287-1, paragraph 1, item (3): publishing information to facilitate fraud or other crimes is prohibited.</p>\r
    <p>Article 287-2: knowingly providing technical support, advertising, payment settlement, or other assistance to someone using information networks to commit crimes is prohibited.</p>\r
    <p>Article 253-1, paragraphs 1 and 3: selling or providing citizens' personal information to others, stealing it, or otherwise obtaining it unlawfully is prohibited.</p>\r
    <p>Cybersecurity Law of the People's Republic of China, Article 13, paragraph 2: networks must not be used to endanger cybersecurity, national security, honor, or interests; incite subversion of state power, overthrow of the socialist system, separatism, or disruption of national unity; promote terrorism, extremism, ethnic hatred, or discrimination; distribute violent or obscene sexual information; fabricate or spread false information that disrupts economic or social order; or infringe others' reputation, privacy, intellectual property, or other lawful rights.</p>\r
    <p>Article 14: using networks for activities that harm minors' physical or mental health is prohibited.</p>\r
    <p>Article 29: unlawfully intruding into others' networks, interfering with normal network functions, or stealing network data is prohibited. Providing programs or tools specifically intended for network intrusion, interference with network functions or protections, or data theft is prohibited. Knowingly providing technical support, advertising, payment settlement, or other assistance for activities that endanger cybersecurity is prohibited.</p>\r
    <p>Article 33: critical information infrastructure in public communications and information services, energy, transportation, water, finance, public services, and electronic government receives special protection. Intrusion, interference, and destruction without lawful authorization are prohibited.</p>\r
    <p>Article 46: stealing or otherwise unlawfully obtaining personal information, or unlawfully selling or providing it to others, is prohibited.</p>\r
    <p>Article 48: establishing websites or communication groups for fraud, teaching criminal methods, producing or selling prohibited or controlled items, or other unlawful activities is prohibited, as is publishing related information through networks.</p>\r
    <p>Article 50: electronic messages and application software must not contain malicious programs or information whose publication or transmission is prohibited by laws or administrative regulations.</p>\r
    <p>Data Security Law of the People's Republic of China, Article 8: data processing must not endanger national security or public interests or harm the lawful rights of individuals and organizations.</p>\r
    <p>Article 32, paragraph 1: data must be collected lawfully and properly, without theft or other unlawful means.</p>\r
    <p>Article 32, paragraph 2: where laws or administrative regulations specify the purpose and scope of data collection or use, collection and use must remain within them.</p>\r
    <p>Article 51: stealing or otherwise unlawfully obtaining data, or thereby harming the lawful rights of individuals or organizations, is punishable under applicable laws and administrative regulations.</p>\r
    <p>Personal Information Protection Law of the People's Republic of China, Article 5: personal information must be processed lawfully, properly, necessarily, and in good faith, without misleading, fraudulent, or coercive methods.</p>\r
    <p>Article 6, paragraphs 1 and 2: processing must have a clear, reasonable purpose directly related to the processing, using methods with the least impact on individual rights. Collection must be limited to the minimum scope required for that purpose and must not be excessive.</p>\r
    <p>Article 10: unlawfully collecting, using, processing, transmitting, trading, providing, or disclosing others' personal information is prohibited, as is processing personal information in ways that endanger national security or public interests.</p>\r
    <p>Article 13: personal information must not be processed without consent unless another specified basis applies, such as necessity for concluding or performing a contract, statutory duties, emergency response, public-interest journalism or public supervision, processing information lawfully made public by the individual, or another circumstance provided by laws or administrative regulations.</p>\r
    <p>Articles 28 and 29: biometric, medical, financial-account, and location information, and personal information of children under fourteen, are sensitive personal information. Processing requires a specific purpose, sufficient necessity, strict protective measures, and separate consent.</p>\r
    <p>Other effective laws, administrative regulations, regulatory requirements, and the terms of service and abuse policies of the models used must also be followed.</p>\r
    <h3>5. Prohibited activities</h3>\r
    <p>Unauthorized access. Do not register organizations, domains, addresses, public systems, production services, or critical information infrastructure as targets without written authorization, or scan, probe, intrude into, control, or send attack traffic to them. References: Criminal Law Article 285, paragraphs 1 and 2; Cybersecurity Law Articles 29 and 33.</p>\r
    <p>Destruction and malicious programs. Do not delete, modify, add to, or interfere with others' system functions, data, or applications; create or distribute viruses, ransomware, or other destructive programs; or embed malicious programs in messages or software. References: Criminal Law Article 286, paragraphs 1-3; Cybersecurity Law Article 50.</p>\r
    <p>Tools and assistance. Do not provide this project or your machine to others for intrusion, unlawful control, or data theft. Do not knowingly provide programs, tools, technical support, advertising, or payment settlement to someone committing cybercrime. References: Criminal Law Article 285, paragraph 3, and Article 287-2; Cybersecurity Law Article 29.</p>\r
    <p>Data. Do not steal, unlawfully collect, use beyond the authorized scope, disclose, sell, or provide business data, accounts, passwords, or other protected data to others. References: Data Security Law Articles 8, 32, and 51.</p>\r
    <p>Personal information. Do not unlawfully collect, use, process, transmit, trade, provide, or disclose others' personal information; collect excessively; process through misleading, fraudulent, or coercive means; or process biometric, medical, financial-account, location, or children's information without authorization. References: Criminal Law Article 253-1, paragraphs 1 and 3; Cybersecurity Law Article 46; Personal Information Protection Law Articles 5, 6, 10, 13, 28, and 29.</p>\r
    <p>Fraud and unlawful information. Do not establish or use websites or groups for fraud, teaching criminal methods, producing or selling prohibited or controlled items, or publishing related information. Do not use computers for fraud, theft, embezzlement, misappropriation of public funds, or theft of state secrets. References: Criminal Law Articles 287 and 287-1, paragraph 1, items (1)-(3); Cybersecurity Law Article 48.</p>\r
    <p>Content. Do not generate or distribute content that endangers national security, honor, or interests; incites subversion or separatism; promotes terrorism, extremism, ethnic hatred, violence, obscene sexual material, or gambling; fabricates false information that disrupts economic or social order; infringes reputation, privacy, or intellectual property; or harms minors' physical or mental health. References: Cybersecurity Law Article 13, paragraph 2, and Article 14.</p>\r
    <p>Distribution of results. Records, asset information, and files produced during drills must remain within the targets and time limits specified by written authorization. They must not be shared with unauthorized recipients or used for purposes outside that authorization.</p>\r
    <h3>6. User responsibility</h3>\r
    <p>This project is provided as is under the MIT license. The developers make no guarantees of completeness, security, or suitability. Users bear independent and complete civil, administrative, and criminal responsibility for downloading, deploying, running, modifying, and distributing it, and for all inputs and outputs. Authors and contributors accept no direct, indirect, or joint liability arising from misuse.</p>\r
    <p>The operator must confirm personally. Confirmation cannot substitute for someone else reading this statement or establish authorization for another person's systems.</p>\r
    <h3>7. Breach terminates authorization</h3>\r
    <p>Use for unlawful attacks, malicious activity, or any prohibited purpose above automatically and irrevocably terminates permission from the time of that conduct. You must immediately stop using the project, destroy its code, scripts, and derived data, and bear responsibility under law. After termination, the drill console must not be opened or used.</p>\r
    <h3>8. Relationship with DeepSeek</h3>\r
    <p>This is an independent open-source project with no affiliation, commercial partnership, authorization, or official endorsement from DeepSeek or its affiliates. The word "official" refers only to the official DeepSeek Harness software package installed locally by the user as the evaluation subject. It does not imply that DeepSeek developed, approved, or guarantees this plugin.</p>\r
    <p>End of statement. Waiting for the countdown, scrolling here, and selecting all three checkboxes confirms your personal acceptance of this statement and completes authorization for this drill-console session.</p>\r
`;

// src/components/auth.js
function AuthGate(props) {
  const t = useT();
  const [left, setLeft] = useState(10);
  const [readEnd, setReadEnd] = useState(false);
  const [checks, setChecks] = useState({
    read: false,
    scope: false,
    ban: false
  });
  const legalRef = useRef(null);
  useEffect(() => {
    const id = window.setInterval(() => {
      setLeft((n) => {
        if (n <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return n - 1;
      });
    }, 1e3);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    const el = legalRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight + 4) setReadEnd(true);
  }, []);
  const locked = left > 0 || !readEnd;
  const ready = !locked && checks.read && checks.scope && checks.ban;
  const hint = left > 0 ? t("auth.hint.wait").replace("{n}", String(left)) : readEnd ? t("auth.hint.check") : t("auth.hint.scroll");
  const onScroll = () => {
    const el = legalRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) setReadEnd(true);
  };
  const toggle = (id) => {
    if (locked) return;
    setChecks((prev) => Object.assign({}, prev, { [id]: !prev[id] }));
  };
  const okLabel = !ready ? t("auth.ok") : props.pending === "full" ? t("auth.ok.full") : props.pending === "env" ? t("auth.ok.env") : t("auth.ok.tab");
  return h(
    "div",
    { className: "dshpp-auth-mask", role: "dialog", "aria-modal": "true" },
    h(
      "div",
      { className: "dshpp-auth-modal" },
      h("h2", null, t("auth.title")),
      h(
        "div",
        {
          className: "muted",
          style: {
            color: "var(--dsw-alias-label-secondary,#999)",
            fontSize: 12
          }
        },
        t("auth.lead")
      ),
      h("div", { className: "dshpp-auth-warn" }, t("auth.warn")),
      h("div", {
        className: "dshpp-auth-legal",
        ref: legalRef,
        onScroll,
        dangerouslySetInnerHTML: { __html: drill_auth_legal_default }
      }),
      h(
        "div",
        {
          style: {
            color: "var(--dsw-alias-label-secondary,#999)",
            fontSize: 12
          }
        },
        hint
      ),
      h(
        "div",
        { className: "dshpp-auth-checks" },
        [
          ["read", "auth.check.read"],
          ["scope", "auth.check.scope"],
          ["ban", "auth.check.ban"]
        ].map(
          (row) => h(
            "label",
            { key: row[0], className: locked ? "locked" : "" },
            h("input", {
              type: "checkbox",
              checked: !!checks[row[0]],
              disabled: locked,
              onChange: () => toggle(row[0])
            }),
            h("span", null, t(row[1]))
          )
        )
      ),
      h(
        "div",
        { className: "dshpp-auth-ops" },
        h(
          "button",
          {
            type: "button",
            onClick: () => setDock({ authOpen: false, tab: "clean", pending: "tab" })
          },
          t("auth.no")
        ),
        h(
          "button",
          {
            type: "button",
            className: "primary",
            disabled: !ready,
            onClick: () => {
              if (!ready) return;
              writeDrillAuth(true);
              const kind = props.pending || "tab";
              setDock({
                authOpen: false,
                open: true,
                tab: "drill",
                pending: "tab"
              });
              try {
                if (__dshPurgeDrill && __dshPurgeDrill.setUI)
                  __dshPurgeDrill.setUI({ open: true });
              } catch {
              }
              if (kind === "env") {
                try {
                  if (__dshPurgeDrill && __dshPurgeDrill.setUI)
                    __dshPurgeDrill.setUI({ open: true, tab: "env" });
                } catch {
                }
              }
              if (kind === "full") {
                try {
                  window.open(
                    window.location.href.split("#")[0] + "#redteam-full",
                    "_blank",
                    "noopener"
                  );
                } catch {
                }
              }
            }
          },
          okLabel
        )
      )
    )
  );
}

// src/state/rewind-visibility.js
var visible = false;
var pendingRead;
var listeners = /* @__PURE__ */ new Set();
function subscribeRewind(listener) {
  listeners.add(listener);
  listener(visible);
  return () => listeners.delete(listener);
}
function publish(value) {
  visible = value;
  for (const listener of listeners) listener(value);
  return value;
}
function valueFrom(reply) {
  if (reply?.ok !== true || typeof reply.rewind !== "boolean")
    throw new Error(reply?.error || "Cannot read rewind button settings");
  return reply.rewind;
}
function readRewindVisibility() {
  if (pendingRead) return pendingRead;
  const request = apiJson("/dsh-purge/boost").then(
    (reply) => pendingRead === request ? publish(valueFrom(reply)) : visible
  ).finally(() => {
    if (pendingRead === request) pendingRead = void 0;
  });
  pendingRead = request;
  return request;
}
async function saveRewindVisibility(value) {
  const reply = await apiJson("/dsh-purge/boost", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rewind: value })
  });
  const saved = valueFrom(reply);
  pendingRead = void 0;
  return publish(saved);
}

// src/components/rewind-setting.js
function RewindSetting() {
  const t = useT();
  const [visible2, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeRewind(setVisible);
    readRewindVisibility().then(
      () => {
        if (active) setReady(true);
      },
      (e) => {
        if (active) setError(e.message);
      }
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);
  async function change(event) {
    const checked = event.target.checked;
    setBusy(true);
    setError("");
    try {
      await saveRewindVisibility(checked);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return h(
    "section",
    { className: "dshpp-composer-settings" },
    h("h3", null, t("rewind.settings")),
    h(
      "label",
      { className: "dshpp-setting-row" },
      t("rewind.show"),
      h("input", {
        type: "checkbox",
        role: "switch",
        checked: visible2,
        disabled: !ready || busy,
        onChange: change
      })
    ),
    error && h(
      "div",
      { role: "alert" },
      error,
      !ready && h(
        "button",
        {
          type: "button",
          onClick: () => {
            setError("");
            setAttempt(attempt + 1);
          }
        },
        t("rewind.readAgain")
      )
    )
  );
}

// src/components/patch-status.js
function statusKind(st) {
  if (st === "applied" || st === "already") return "ok";
  if (st === "pending") return "wait";
  if (st === "unmatched") return "bad";
  if (st === "partial") return "bad";
  if (st === "drifted") return "bad";
  if (st === "disabled") return "muted";
  if (st === "na") return "ok";
  if (st === "missing_file" || st === "skipped" || st === "unlocated" || st === "off")
    return "miss";
  return "bad";
}
function statusLabel(st, t) {
  if (st === "applied" || st === "already") return t("status.applied");
  if (st === "off") return t("status.skipped");
  if (st === "pending") return t("status.pending");
  if (st === "unmatched") return t("status.unmatched");
  if (st === "partial") return t("status.partial");
  if (st === "drifted") return t("status.drifted");
  if (st === "disabled") return t("status.disabled");
  if (st === "skipped") return t("health.na");
  if (st === "missing_file") return t("health.na");
  if (st === "unlocated") return t("status.unlocated");
  if (st === "na") return t("health.na");
  return st || t("unknown");
}
var LAYER_GROUP = {
  Prompt: "prompt",
  Code: "code",
  Tools: "tools",
  "0.1.5 Compatible": "compat",
  "0.2.0 Compatible": "dsh20"
};
var GROUP_ORDER = ["prompt", "code", "tools", "compat", "dsh20"];
var PERMISSION_PATCH_IDS = [
  6,
  7,
  8,
  9,
  10,
  13,
  14,
  15,
  16,
  35,
  51,
  59,
  60,
  62
];
var CONTEXT_PATCH_IDS = [18, 19];
var PERMISSION_SET = new Set(PERMISSION_PATCH_IDS);
var CONTEXT_SET = new Set(CONTEXT_PATCH_IDS);
function patchGroupOf(id) {
  const n = Number(id);
  if (PERMISSION_SET.has(n)) return "permission";
  if (CONTEXT_SET.has(n)) return "context";
  return "normal";
}
function rowsFromState(state) {
  if (!state || !state.ai_base) return [];
  const source = Array.isArray(state.patch_rows) ? state.patch_rows : null;
  if (source) {
    return source.map((p) => ({
      id: Number(p.id),
      st: p.status || "na",
      layer: p.layer || "",
      name: p.name || ""
    })).filter((r) => r.st && Number.isFinite(r.id));
  }
  const names = state.patch_names || {};
  const statusMap = state.patch_status || {};
  if (Object.keys(statusMap).length) {
    return Object.keys(statusMap).map((id) => ({
      id: Number(id),
      st: statusMap[id],
      layer: "",
      name: names[id] || ""
    })).filter((r) => r.st && Number.isFinite(r.id));
  }
  return (Array.isArray(state.patches) ? state.patches : []).map((p) => ({
    id: Number(p.id),
    st: p.status || "na",
    layer: p.layer || "",
    name: ""
  })).filter((r) => r.st && Number.isFinite(r.id));
}
function patchRowsAll(state) {
  return rowsFromState(state);
}
function isNaRow(row) {
  return row.st === "na" || row.st === "skipped" || row.st === "missing_file";
}
function patchGroupCounts(rows) {
  const out = { applied: 0, pending: 0, off: 0, na: 0, total: 0, denom: 0 };
  for (const row of rows || []) {
    out.total += 1;
    if (isNaRow(row)) out.na += 1;
    else if (row.st === "disabled") out.off += 1;
    else if (row.st === "applied" || row.st === "already") out.applied += 1;
    else out.pending += 1;
  }
  out.denom = out.total - out.na;
  return out;
}
function tallyPatches(rows) {
  const out = {
    applied: 0,
    pending: 0,
    unmatched: 0,
    partial: 0,
    drifted: 0,
    disabled: 0,
    skipped: 0,
    total: 0
  };
  for (const row of rows || []) {
    out.total += 1;
    if (row.st === "applied" || row.st === "already") out.applied += 1;
    else if (row.st === "pending") out.pending += 1;
    else if (row.st === "unmatched") out.unmatched += 1;
    else if (row.st === "partial") out.partial += 1;
    else if (row.st === "drifted") out.drifted += 1;
    else if (row.st === "disabled") out.disabled += 1;
    else out.skipped += 1;
  }
  return out;
}
function Tile({ kind, label, value, title, text }) {
  return h(
    "div",
    { className: "dshpp-tile is-" + kind },
    h(
      "div",
      { className: "dshpp-tile-k" },
      label,
      h(HelpTip, { title, label }, text)
    ),
    h("div", { className: "dshpp-tile-v" }, String(value))
  );
}
function PatchHealth({ state }) {
  const t = useT();
  if (!state || !state.ai_base) return null;
  const counts = patchGroupCounts(patchRowsAll(state));
  const denom = Math.max(counts.denom, 1);
  const pct = (n) => n / denom * 100;
  const verdict = counts.pending ? t("health.verdict.pending", { n: counts.pending }) : t("health.verdict.ok");
  return h(
    "div",
    { className: "dshpp-health" },
    h(
      "div",
      { className: "dshpp-health-top" },
      h(
        "b",
        { className: "dshpp-health-big" },
        String(counts.applied),
        h("small", null, " / " + counts.denom + " " + t("health.denomUnit"))
      ),
      h("span", { className: "dshpp-health-verdict" }, verdict)
    ),
    h(
      "div",
      { className: "dshpp-bar", "aria-hidden": "true" },
      h("i", {
        className: "is-ok",
        style: { width: pct(counts.applied) + "%" }
      }),
      h("i", {
        className: "is-wait",
        style: { width: pct(counts.pending) + "%" }
      }),
      h("i", {
        className: "is-off",
        style: { width: pct(counts.off) + "%" }
      })
    ),
    h(
      "div",
      { className: "dshpp-tiles" },
      h(Tile, {
        kind: "ok",
        label: t("health.applied"),
        value: counts.applied,
        title: t("health.applied"),
        text: t("health.hint.applied")
      }),
      h(Tile, {
        kind: "wait",
        label: t("health.pending"),
        value: counts.pending,
        title: t("health.pending"),
        text: t("health.hint.pending")
      }),
      h(Tile, {
        kind: "off",
        label: t("health.off"),
        value: counts.off,
        title: t("health.off"),
        text: t("health.hint.off")
      }),
      h(Tile, {
        kind: "na",
        label: t("health.na"),
        value: counts.na,
        title: t("health.na"),
        text: t("health.hint.na")
      })
    )
  );
}
function Switch({ on, busy, label, desc, hintTitle, hint, chip, onToggle }) {
  const t = useT();
  return h(
    "div",
    { className: "dshpp-sw" + (on ? " is-on" : "") },
    h(
      "div",
      { className: "dshpp-sw-h" },
      h(
        "div",
        { className: "dshpp-sw-t" },
        label,
        h(HelpTip, { title: hintTitle, label }, hint)
      ),
      h(
        "button",
        {
          type: "button",
          className: "dshpp-track" + (on ? " is-on" : ""),
          role: "switch",
          "aria-checked": on ? "true" : "false",
          "aria-label": label,
          disabled: busy,
          onClick: onToggle
        },
        h("span", { className: "dshpp-knob" })
      )
    ),
    h("p", { className: "dshpp-sw-d" }, desc),
    h(
      "div",
      { className: "dshpp-sw-f" },
      h("span", { className: "dshpp-chip" + (on ? " is-on" : "") }, chip),
      busy ? h("span", { className: "dshpp-chip" }, t("sw.saving")) : null
    )
  );
}
function PatchGroupSwitches({ state, onSaved }) {
  const t = useT();
  const [flags, setFlags] = useState(null);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState(null);
  useEffect(() => {
    let alive = true;
    apiJson("/dsh-purge/boost").then((d) => {
      if (!alive || !d || !d.ok) return;
      setFlags({
        permissionPatches: d.permissionPatches !== false,
        contextManagement: d.contextManagement === true
      });
    }).catch(() => {
    });
    return () => {
      alive = false;
    };
  }, []);
  const counts = patchGroupCounts(patchRowsAll(state));
  const rows = patchRowsAll(state);
  const permApplied = rows.filter(
    (r) => patchGroupOf(r.id) === "permission" && r.st === "applied"
  ).length;
  const permPending = rows.filter(
    (r) => patchGroupOf(r.id) === "permission" && r.st === "pending"
  ).length;
  const ctxApplied = rows.filter(
    (r) => patchGroupOf(r.id) === "context" && r.st === "applied"
  ).length;
  const toggle = (key) => {
    if (!flags || busy) return;
    const next = !flags[key];
    setBusy(key);
    setNote(null);
    apiJson("/dsh-purge/boost", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ [key]: next })
    }).then((d) => {
      if (!d || !d.ok) throw new Error(d && d.error || "save failed");
      setFlags({
        permissionPatches: d.permissionPatches !== false,
        contextManagement: d.contextManagement === true
      });
      setNote({ kind: "ok", text: t("sw.saved") });
      if (typeof onSaved === "function") onSaved();
    }).catch(
      (e) => setNote({ kind: "error", text: t("sw.fail", { error: String(e) }) })
    ).then(() => setBusy(""));
  };
  const permOn = flags ? flags.permissionPatches : true;
  const ctxOn = flags ? flags.contextManagement : false;
  return h(
    "div",
    null,
    h(
      "div",
      { className: "dshpp-switches" },
      h(Switch, {
        on: permOn,
        busy: busy === "permissionPatches",
        label: t("sw.permission"),
        desc: t("sw.permission.desc"),
        hintTitle: t("sw.permission"),
        hint: t("sw.permission.hint"),
        chip: permOn ? t("sw.chip.on", {
          n: PERMISSION_PATCH_IDS.length,
          written: permApplied,
          pending: permPending
        }) : t("sw.chip.off", { n: PERMISSION_PATCH_IDS.length }),
        onToggle: () => toggle("permissionPatches")
      }),
      h(Switch, {
        on: ctxOn,
        busy: busy === "contextManagement",
        label: t("sw.context"),
        desc: t("sw.context.desc"),
        hintTitle: t("sw.context"),
        hint: t("sw.context.hint"),
        chip: ctxOn ? t("sw.chip.on", {
          n: CONTEXT_PATCH_IDS.length,
          written: ctxApplied,
          pending: CONTEXT_PATCH_IDS.length - ctxApplied
        }) : t("sw.chip.off", { n: CONTEXT_PATCH_IDS.length }),
        onToggle: () => toggle("contextManagement")
      })
    ),
    note ? h(
      "p",
      {
        className: "dshpp-sw-note" + (note.kind === "error" ? " is-bad" : ""),
        role: "status"
      },
      note.text
    ) : null,
    h("p", { className: "dshpp-sw-hint" }, t("sw.applyHint"))
  );
}
var FILTERS = ["all", "pending", "off", "na"];
function PatchGroups({ state }) {
  const t = useT();
  const [open, setOpen] = useState({ code: true });
  const [filter, setFilter] = useState("all");
  if (state?.ok === false)
    return h("p", { role: "status" }, t("groups.unreadable"));
  if (!state || !state.patch_status)
    return h("div", { className: "dshpp-skel", style: { height: 120 } });
  const located = !!state.ai_base;
  if (!located) return null;
  const allRows = patchRowsAll(state);
  const counts = patchGroupCounts(allRows);
  const filterCount = {
    all: counts.total,
    pending: counts.pending,
    off: counts.off,
    na: counts.na
  };
  const kept = allRows.filter((row) => {
    if (filter === "pending")
      return !isNaRow(row) && row.st !== "disabled" && row.st !== "applied" && row.st !== "already";
    if (filter === "off") return row.st === "disabled";
    if (filter === "na") return isNaRow(row);
    return true;
  });
  const grouped = /* @__PURE__ */ new Map();
  for (const row of kept) {
    const key = LAYER_GROUP[row.layer] || "code";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return h(
    "div",
    null,
    h(
      "div",
      { className: "dshpp-filter" },
      FILTERS.map(
        (f) => h(
          "button",
          {
            key: f,
            type: "button",
            className: "dshpp-fbtn" + (filter === f ? " is-cur" : ""),
            onClick: () => setFilter(f)
          },
          t("filter." + f),
          h("span", { className: "dshpp-fbtn-n" }, String(filterCount[f]))
        )
      ),
      h("span", { className: "dshpp-filter-hint" }, t("filter.hint"))
    ),
    GROUP_ORDER.filter((key) => grouped.has(key)).map((key) => {
      const rows = grouped.get(key).slice().sort((a, b) => a.id - b.id);
      const tally = tallyPatches(rows);
      const groupCounts = patchGroupCounts(rows);
      const notes = [];
      if (tally.pending)
        notes.push(t("metric.pendingShort", { n: tally.pending }));
      if (tally.unmatched)
        notes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
      if (tally.partial)
        notes.push(t("metric.partialShort", { n: tally.partial }));
      if (tally.drifted)
        notes.push(t("metric.driftedShort", { n: tally.drifted }));
      if (tally.disabled)
        notes.push(t("metric.disabledShort", { n: tally.disabled }));
      const expanded = !!open[key];
      return h(
        "div",
        { key, className: "dshpp-group" },
        h(
          "button",
          {
            type: "button",
            className: "dshpp-group-h",
            "aria-expanded": expanded ? "true" : "false",
            onClick: () => setOpen((prev) => Object.assign({}, prev, { [key]: !prev[key] }))
          },
          h("span", { className: "dshpp-caret" }, expanded ? "\u25BE" : "\u25B8"),
          h("strong", null, t("group." + key)),
          h(
            "span",
            { className: "dshpp-count" },
            groupCounts.applied + " / " + (groupCounts.denom || 0)
          ),
          h(
            "span",
            { className: "dshpp-group-chips" },
            groupCounts.applied ? h(
              "span",
              { className: "dshpp-pill is-ok" },
              String(groupCounts.applied)
            ) : null,
            groupCounts.pending ? h(
              "span",
              { className: "dshpp-pill is-wait" },
              String(groupCounts.pending)
            ) : null,
            groupCounts.off ? h(
              "span",
              { className: "dshpp-pill is-muted" },
              String(groupCounts.off)
            ) : null,
            groupCounts.na ? h(
              "span",
              { className: "dshpp-pill is-miss" },
              String(groupCounts.na)
            ) : null
          )
        ),
        notes.length ? h("p", { className: "dshpp-group-notes" }, notes.join(" \xB7 ")) : null,
        expanded ? h(
          "table",
          { className: "dshpp-table" },
          h(
            "thead",
            null,
            h(
              "tr",
              null,
              h("th", null, "#"),
              h("th", null, t("table.patch")),
              h("th", null, t("table.status"))
            )
          ),
          h(
            "tbody",
            null,
            rows.map(
              (r) => h(
                "tr",
                { key: r.id },
                h("td", { className: "dshpp-id" }, "#" + r.id),
                h(
                  "td",
                  null,
                  (t("patch." + r.id) !== "patch." + r.id ? t("patch." + r.id) : r.name) || "patch." + r.id,
                  // Show a second identifier line only when a distinct name exists.
                  r.name && t("patch." + r.id) !== "patch." + r.id ? h("span", { className: "dshpp-row-en" }, r.name) : null,
                  // Applied rows omit repetitive explanations to keep the table compact.
                  r.st === "applied" || r.st === "already" ? null : h(
                    "span",
                    { className: "dshpp-row-note" },
                    t("hint." + (r.st || "unknown"))
                  )
                ),
                h(
                  "td",
                  null,
                  h(Pill, { value: r.st }),
                  r.st === "partial" ? h(
                    "span",
                    { className: "dshpp-sub" },
                    t("status.partialDetail", {
                      done: (state.patch_files?.[r.id] || []).filter(
                        (f) => f.status === "applied"
                      ).length,
                      total: (state.patch_files?.[r.id] || []).length
                    })
                  ) : null
                )
              )
            )
          )
        ) : null
      );
    }),
    !grouped.size ? h("p", { className: "dshpp-filter-hint" }, t("filter.empty")) : null
  );
}
function PatchApplySteps() {
  const t = useT();
  const step = (n, title, desc) => h(
    "div",
    { className: "dshpp-step" },
    h("span", { className: "dshpp-step-no" }, String(n)),
    h("div", null, h("b", null, title), h("span", null, desc))
  );
  return h(
    "div",
    { className: "dshpp-flow" },
    h("h4", null, t("steps.title")),
    h(
      "div",
      { className: "dshpp-steps" },
      step(1, t("steps.1.t"), t("steps.1.d")),
      step(2, t("steps.2.t"), t("steps.2.d")),
      step(3, t("steps.3.t"), t("steps.3.d"))
    ),
    h("p", { className: "dshpp-flow-foot" }, t("steps.foot"))
  );
}

// src/components/primitives.js
function formatSize(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  return (kb >= 100 ? Math.round(kb) : kb.toFixed(1)) + " KB";
}
function noticeNode(notice) {
  if (!notice || notice.kind === "idle" || !notice.text) return null;
  return h(
    "span",
    {
      className: "dshpp-notice " + (notice.kind === "error" ? "is-bad" : "is-ok")
    },
    notice.text
  );
}
function Btn(props) {
  const { kind, tiny, children, className, type, ...rest } = props;
  const cls = [
    "dshpp-btn",
    kind ? "dshpp-btn-" + kind : "dshpp-btn-ghost",
    tiny ? "dshpp-btn-tiny" : "",
    className || ""
  ].filter(Boolean).join(" ");
  return h(
    "button",
    Object.assign({ type: type || "button", className: cls }, rest),
    children
  );
}
function Pill({ value, label }) {
  const t = useT();
  return h(
    "span",
    { className: "dshpp-pill is-" + statusKind(value) },
    label || statusLabel(value, t)
  );
}
function HelpTip({ title, children, label }) {
  const [open, setOpen] = useState(false);
  return h(
    "span",
    { className: "dshpp-help" },
    h(
      "button",
      {
        type: "button",
        className: "dshpp-help-btn",
        "aria-label": (label || title || "Help") + " (view help)",
        "aria-expanded": open ? "true" : "false",
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
        onClick: (e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }
      },
      "?"
    ),
    open ? h(
      "span",
      { className: "dshpp-tip", role: "tooltip" },
      title ? h("b", null, title) : null,
      children ? h("span", null, children) : null
    ) : null
  );
}

// src/shared/apply-result.js
function incompleteApplyDetail(result, t) {
  const parts = [];
  if (result.failed > 0) {
    const ids = (Array.isArray(result.failed_items) ? result.failed_items : []).map((item) => item?.id).filter((id) => id != null).join(",");
    parts.push(
      t("restart.incomplete.patches", {
        failed: String(result.failed),
        ids: ids || "?"
      })
    );
  }
  if (result.cmd_flash?.ok === false)
    parts.push(
      t("restart.incomplete.flash", {
        entry: String(result.cmd_flash.entry || "unknown")
      })
    );
  if (result.host_written === false) parts.push(t("restart.incomplete.host"));
  if (result.hook_restore_failed === true)
    parts.push(t("restart.incomplete.restore"));
  if (result.cli_repair?.ok === false)
    parts.push(
      t("restart.incomplete.runtime"),
      ...runtimeRepairDetails(result.cli_repair)
    );
  return parts.length ? parts.join("\uFF1B") : t("restart.incomplete.unknown");
}

// src/components/advanced.js
function HooksDenySection({ onSaved }) {
  const t = useT();
  const [cfg, setCfg] = useState(null);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    apiJson("/dsh-purge/hooks-deny").then((d) => {
      if (d && d.ok) setCfg({ hooksDenyBypass: d.hooksDenyBypass !== false });
    }).catch(() => {
    });
  }, []);
  const save = (hooksDenyBypass) => {
    if (!cfg || busy) return;
    setCfg({ hooksDenyBypass });
    setBusy(true);
    apiJson("/dsh-purge/hooks-deny", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hooksDenyBypass })
    }).then((d) => {
      if (d && d.ok) {
        setCfg({ hooksDenyBypass: d.hooksDenyBypass === true });
        setNotice({ kind: "ok", text: t("saved.hooksDeny") });
        if (typeof onSaved === "function") onSaved();
      } else {
        setNotice({
          kind: "error",
          text: t("err.save", { error: d && d.error || "" })
        });
      }
    }).catch(
      (e) => setNotice({ kind: "error", text: t("err.save", { error: e.message }) })
    ).finally(() => setBusy(false));
  };
  if (!cfg) return null;
  return h(
    "div",
    { className: "dshpp-cr", style: { marginTop: 12 } },
    h(
      "div",
      { className: "dshpp-sub" },
      h("h4", null, t("hooksDeny.title")),
      noticeNode(notice)
    ),
    h(
      "p",
      {
        className: "dshpp-hint",
        style: { margin: "0 0 4px", color: "var(--dshpp-mute)", fontSize: 12 }
      },
      t("hooksDeny.hint")
    ),
    h(
      "div",
      { className: "dshpp-cr-row" },
      h(
        "label",
        null,
        h("input", {
          type: "checkbox",
          checked: cfg.hooksDenyBypass === true,
          disabled: busy,
          onChange: (e) => save(e.target.checked)
        }),
        t("hooksDeny.bypass")
      )
    )
  );
}

// src/components/restart.js
var rd2 = __toESM(require("react-dom"), 1);
function RestartAsk(props) {
  const node = h(
    "div",
    {
      className: "dshpp-restart-mask",
      "data-theme": props.theme === "dusk" ? "dusk" : "white",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "dshpp-restart-title",
      onClick: (e) => {
        if (e.target === e.currentTarget && props.onLater) props.onLater();
      }
    },
    h(
      "div",
      { className: "dshpp-restart-card" },
      h("h4", { id: "dshpp-restart-title" }, props.t("restart.ask.title")),
      h("p", null, props.t("restart.ask.body")),
      h(
        "div",
        { className: "dshpp-modal-ops" },
        h(Btn, { onClick: props.onLater }, props.t("restart.notNow")),
        h(
          Btn,
          { kind: "primary", onClick: props.onRestart },
          props.t("restart.now")
        )
      )
    )
  );
  try {
    if (rd2 && typeof rd2.createPortal === "function" && typeof document !== "undefined" && document.body) {
      return rd2.createPortal(node, document.body);
    }
  } catch {
  }
  return node;
}
function reopenAfterRestart() {
  window.location.reload();
}
function waitForRestart(setNotice, setBusy, t) {
  const started = Date.now();
  let sawDown = false;
  const ping = () => {
    fetch(apiUrl("/dsh-purge/status"), {
      cache: "no-store",
      credentials: "same-origin"
    }).then((r) => r.ok ? r.json() : Promise.reject()).then((d) => {
      if (!sawDown) {
        retry();
        return;
      }
      if (d && d.ok && d.ready !== false) reopenAfterRestart();
      else retry();
    }).catch(() => {
      sawDown = true;
      retry();
    });
  };
  const retry = () => {
    if (Date.now() - started > 9e4) {
      setNotice({ kind: "error", text: t("restart.timeout") });
      setBusy(false);
      return;
    }
    setTimeout(ping, 500);
  };
  setTimeout(ping, 800);
}
var restartOnce = false;
function restartDsh(setNotice, setBusy, t, surface) {
  if (restartOnce) return;
  const surf = surface || clientGuessSurface() || "desktop";
  const desktop = surf === "desktop" || clientGuessSurface() === "desktop";
  restartOnce = true;
  setBusy(true);
  setNotice({ kind: "ok", text: hostText(t, "restarting", surf) });
  const stop = (error) => {
    restartOnce = false;
    setNotice({
      kind: "error",
      text: error ? t("restart.fail", { error }) : t("restart.notStarted")
    });
    setBusy(false);
  };
  let sawDrop = false;
  const watch = setTimeout(() => {
    if (sawDrop) return;
    stop("");
  }, 25e3);
  fetch(apiUrl("/dsh-purge/restart"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}"
  }).then((r) => r.json()).then((d) => {
    if (!d.ok) throw new Error(d.error || "restart failed");
    if (d.manualQuit) {
      clearTimeout(watch);
      restartOnce = false;
      setBusy(false);
      setNotice({ kind: "ok", text: d.note || t("restart.manualQuit") });
      return;
    }
    const next = d && d.surface || surf;
    const full = next === "desktop" || d && d.fullApp || desktop;
    if (full && d.already) {
      setNotice({ kind: "ok", text: hostText(t, "restarting", next) });
      return;
    }
    if (full && d.restarting === false) {
      clearTimeout(watch);
      stop(d.error || "not started");
      return;
    }
    setNotice({ kind: "ok", text: hostText(t, "restarting", next) });
    if (full) return;
    clearTimeout(watch);
    restartOnce = false;
    waitForRestart(setNotice, setBusy, t);
  }).catch((e) => {
    const msg = String(e && e.message || e || "");
    const dropped = /failed to fetch|networkerror|load failed/i.test(msg) || e.name === "TypeError";
    if (dropped && desktop) {
      sawDrop = true;
      clearTimeout(watch);
      return;
    }
    clearTimeout(watch);
    stop(msg || "restart failed");
  });
}
function detectHostTheme() {
  try {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (document.body?.hasAttribute("data-ds-dark-theme") || root?.hasAttribute("data-ds-dark-theme"))
        return "dusk";
      const scheme = (root.style.colorScheme || getComputedStyle(root).colorScheme || getComputedStyle(root).getPropertyValue("color-scheme") || "").toLowerCase();
      if (scheme.includes("dark")) return "dusk";
      if (scheme.includes("light")) return "white";
    }
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
      return "dusk";
    }
  } catch {
  }
  return "white";
}

// src/shared/versions.js
function splitListedVersion(raw) {
  const text = String(raw || "").trim().replace(/^v/i, "");
  const cut = text.split("-");
  const core = String(cut[0] || "").split(".").map((n) => parseInt(n, 10) || 0);
  return {
    core: [core[0] || 0, core[1] || 0, core[2] || 0],
    pre: cut.slice(1).join("-")
  };
}
function listedVersionNewer(remote, local) {
  if (!remote || !local || String(remote) === String(local)) return false;
  const a = splitListedVersion(remote);
  const b = splitListedVersion(local);
  for (let i = 0; i < 3; i += 1) {
    if (a.core[i] !== b.core[i]) return a.core[i] > b.core[i];
  }
  if (a.pre && !b.pre) return false;
  if (!a.pre && b.pre) return true;
  return a.pre > b.pre;
}
function listedCeiling(versions, localVer) {
  let best = "";
  const rows = (versions || []).slice();
  const local = String(localVer || "").replace(/^v/i, "");
  if (local && !/(?:^|[-._])(beta|rc|pre|preview|test)(?:\d|$|[-._])/i.test(local)) {
    rows.push({ channel: "stable", version: local });
  }
  for (const item of rows) {
    if (!item || item.channel === "beta") continue;
    const ver = String(item.version || "").replace(/^v/i, "");
    if (!/^\d+\.\d+\.\d+/.test(ver) || /(?:^|[-._])(beta|rc|pre|preview|test)(?:\d|$|[-._])/i.test(ver))
      continue;
    if (!best || listedVersionNewer(ver, best)) best = ver;
  }
  return best;
}
function keepListedVersion(item, _ceiling) {
  const ver = String(item && (item.version || item.ref || item.id) || "");
  if (!item) return false;
  if (item.ref === "beta" || item.id === "beta") return true;
  if (item.channel === "beta") return false;
  if (/(?:^|[-._])(beta|rc|pre|preview|test)(?:\d|$|[-._])/i.test(ver))
    return false;
  return true;
}
function preferListed(list, localVer, pin) {
  const pinned = pin ? (list || []).find((item) => item.ref === pin) : null;
  if (pinned) return pinned;
  const ver = String(localVer || "").replace(/^v/i, "");
  const same = (list || []).filter(
    (item) => ver && String(item.version || "").replace(/^v/i, "") === ver
  );
  if (same.length) {
    return same.find((item) => item.current) || same.find((item) => item.latest) || same[0];
  }
  return (list || []).find((item) => item.current) || (list || []).find((item) => item.latest) || (list || [])[0] || null;
}
function versionChoiceLabel(item, tr) {
  const ver = String(item && item.version || "").replace(/^v/i, "");
  const base = ver ? "v" + ver : item && (item.label || item.ref) || "\u2014";
  if (item && item.current) return base + " \xB7 " + tr("update.current");
  if (item && item.latest) return base + " \xB7 " + tr("update.tip");
  return base;
}

// src/components/settings-form.js
function PurgifySection({ page = "status", onStatus } = {}) {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [state, setState] = useState(null);
  const [scannedAt, setScannedAt] = useState(null);
  useEffect(() => {
    if (onStatus) onStatus(state);
  }, [state, onStatus]);
  const [override, setOverride] = useState("");
  const [defaultOverride, setDefaultOverride] = useState("");
  const [overrideLoaded, setOverrideLoaded] = useState(false);
  const [ownServers, setOwnServers] = useState("");
  const [ownLoaded, setOwnLoaded] = useState(false);
  const [ownBusy, setOwnBusy] = useState(false);
  const ownPending = useRef(false);
  const promptPending = useRef(false);
  const ownRef = useRef("");
  ownRef.current = ownServers;
  const [patchBusy, setPatchBusy] = useState(false);
  const [updateBusy, setUpdateBusy] = useState(false);
  const [canApplyUpdate, setCanApplyUpdate] = useState(false);
  const [updateJob, setUpdateJob] = useState(null);
  const [askRestart, setAskRestart] = useState(false);
  const suppressRestartAsk = useRef(false);
  const [askUninstall, setAskUninstall] = useState(false);
  const [uninstallBusy, setUninstallBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const [updateNotice, setUpdateNotice] = useState({ kind: "idle", text: "" });
  const [updateInfo, setUpdateInfo] = useState(null);
  const [channel, setChannel] = useState("stable");
  const [pick, setPick] = useState({ stable: "", beta: "" });
  const actionTicket = useRef(0);
  const overrideRef = useRef("");
  const defaultOverrideRef = useRef("");
  const promptSeededRef = useRef(false);
  const ownSeededRef = useRef(false);
  const promptAreaRef = useRef(null);
  overrideRef.current = override;
  defaultOverrideRef.current = defaultOverride;
  const readPromptBox = () => {
    const node = promptAreaRef.current;
    const live = node && typeof node.value === "string" ? node.value : overrideRef.current;
    overrideRef.current = live || "";
    return overrideRef.current;
  };
  const syncPicks = (d) => {
    const versions2 = d && d.versions || [];
    const ceiling = listedCeiling(versions2, d && d.localVersion);
    const next = { stable: "", beta: "" };
    for (const id of ["stable", "beta"]) {
      const list = versions2.filter(
        (item) => item.channel === id && keepListedVersion(item, ceiling)
      );
      const hit = preferListed(list, d && d.localVersion, d && d.pin);
      next[id] = hit && hit.ref || "";
    }
    setPick(next);
  };
  const updateErrorText = (tr, e) => {
    const msg = String(e && e.message || e || "");
    if (msg === "timeout" || /aborted|abort|timeout/i.test(msg))
      return tr("update.timeout");
    if (/\b404\b/.test(msg) || /non-json/.test(msg))
      return tr("update.needRestart");
    return tr("update.fail", { error: msg });
  };
  const applyUpdateInfo = useCallback((d, tr, kind) => {
    if (d.channel) setChannel(d.channel);
    setUpdateInfo((prev) => {
      const versions2 = d.versions && d.versions.length ? d.versions : prev && prev.versions || [];
      return Object.assign({}, prev || {}, d, { versions: versions2 });
    });
    if (d.versions && d.versions.length) syncPicks(d);
    if (kind === "check") setCanApplyUpdate(Boolean(d.hasUpdate) && !d.error);
    else if (kind === "done" || kind === "switched" || kind === "channel")
      setCanApplyUpdate(false);
    const version = d.localVersion || d.localSha || "\u2014";
    const remote = d.remoteVersion || d.remoteSha || "\u2014";
    let text = tr("update.latest", { version });
    if (d.hasUpdate) text = tr("update.available", { remote, local: version });
    if (d.pinned && d.hasUpdate)
      text = tr("update.pinned", { version, remote });
    if (kind === "switched" || kind === "channel")
      text = tr("update.switched", {
        version: d.localVersion || d.remoteVersion || "\u2014"
      });
    if (kind === "done")
      text = tr("update.done", {
        version: d.localVersion || d.remoteVersion || "\u2014"
      });
    if (d.error) text = d.error;
    setUpdateNotice({ kind: d.ok === false || d.error ? "error" : "ok", text });
  }, []);
  const checkUpdate = useCallback(
    (id) => {
      setUpdateBusy(true);
      setUpdateJob({ id: id || "", kind: "check" });
      const tr = tRef.current;
      setUpdateNotice({ kind: "ok", text: tr("update.checking") });
      apiJson("/dsh-purge/update").then((d) => {
        if (!d || !d.ok && !d.channel)
          throw new Error(d && d.error || "check failed");
        applyUpdateInfo(d, tr, "check");
      }).catch(
        (e) => setUpdateNotice({ kind: "error", text: updateErrorText(tr, e) })
      ).finally(() => {
        setUpdateBusy(false);
        setUpdateJob(null);
      });
    },
    [applyUpdateInfo]
  );
  const postUpdate = useCallback(
    (body, kind, id) => {
      setUpdateBusy(true);
      setUpdateJob({ id: id || "", kind });
      const tr = tRef.current;
      setUpdateNotice({
        kind: "ok",
        text: kind === "switched" || kind === "channel" ? tr("update.switching") : tr("update.applying")
      });
      return apiJson("/dsh-purge/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body || {})
      }).then((d) => {
        if (!d || d.ok === false && d.error)
          throw new Error(d && d.error || "update failed");
        applyUpdateInfo(d, tr, kind);
        if (d.needsFullQuit) {
          suppressRestartAsk.current = false;
          setAskRestart(true);
          setUpdateNotice({ kind: "ok", text: tr("restart.official.body") });
          return d;
        }
        if (d.restartAfter) {
          setUpdateNotice({ kind: "ok", text: tr("update.restarting") });
          return d;
        }
        if (d.applied && d.reloadClient !== false) {
          setUpdateNotice({ kind: "ok", text: tr("update.reloading") });
          setTimeout(() => {
            try {
              window.location.reload();
            } catch {
            }
          }, 280);
        } else if (d.needRestart) {
          setAskRestart(true);
        }
        return d;
      }).catch((e) => {
        setUpdateNotice({ kind: "error", text: updateErrorText(tr, e) });
        throw e;
      }).finally(() => {
        setUpdateBusy(false);
        setUpdateJob(null);
      });
    },
    [applyUpdateInfo]
  );
  const doUpdate = useCallback(
    (id) => {
      const lane = id === "beta" ? "beta" : "stable";
      postUpdate(
        {
          op: "apply",
          ref: lane === "beta" ? "beta" : "master",
          channel: lane
        },
        "done",
        id
      ).catch(() => {
      });
    },
    [postUpdate]
  );
  const changeChannel = useCallback(
    (next) => {
      if (!next) return;
      const tr = tRef.current;
      if (!window.confirm(
        tr("update.confirmChannel", { version: tr("channel." + next) })
      ))
        return;
      const prevChannel = channel;
      const prevInfo = updateInfo;
      setChannel(next);
      setUpdateInfo((cur) => Object.assign({}, cur || {}, { channel: next }));
      postUpdate({ op: "channel", channel: next }, "channel", next).catch(
        () => {
          setChannel(prevChannel);
          setUpdateInfo(prevInfo);
        }
      );
    },
    [channel, postUpdate, updateInfo]
  );
  const switchSelected = useCallback(
    (id) => {
      const tr = tRef.current;
      const ref = pick[id];
      const versions2 = (updateInfo && updateInfo.versions || []).filter(
        (item) => item.channel === id
      );
      const hit = versions2.find((item) => item.ref === ref);
      const label = hit && (hit.label || hit.version) || ref;
      if (!ref) return;
      if (!window.confirm(tr("update.confirmSwitch", { version: label })))
        return;
      const prevChannel = channel;
      const prevInfo = updateInfo;
      if (hit && hit.channel) {
        setChannel(hit.channel);
        setUpdateInfo(
          (cur) => Object.assign({}, cur || {}, { channel: hit.channel })
        );
      }
      postUpdate({ op: "switch", ref }, "switched", id).catch(() => {
        setChannel(prevChannel);
        setUpdateInfo(prevInfo);
      });
    },
    [channel, pick, postUpdate, updateInfo]
  );
  const loadAll = useCallback(() => {
    const tr = tRef.current;
    apiJson("/dsh-purge/status").then((d) => {
      if (d && d.ok) {
        setState(d);
        try {
          setScannedAt(
            (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false
            })
          );
        } catch {
        }
        setNotice(
          (previous) => previous?.source === "status" ? { kind: "idle", text: "" } : previous
        );
        if (d.channel) setChannel(d.channel);
        if (d.update && d.update.ok && !d.update.error)
          setUpdateInfo(d.update);
        if (d.boot_full_quit && !suppressRestartAsk.current)
          setAskRestart(true);
      } else {
        setState(unavailableStatus(d?.error || "bad response"));
        setNotice({
          kind: "error",
          source: "status",
          text: tr("err.status", { error: d && d.error || "bad response" })
        });
      }
    }).catch((e) => {
      setState(unavailableStatus(e));
      setNotice({
        kind: "error",
        source: "status",
        text: tr("err.status", { error: e.message })
      });
    });
    apiJson("/dsh-purge/update").then((d) => {
      if (!d) return;
      if (d.channel) setChannel(d.channel);
      setUpdateInfo(d);
      syncPicks(d);
    }).catch(() => {
    });
    apiJson("/dsh-purge/override").then((d) => {
      if (d && d.ok) {
        const packed = typeof d.defaultContent === "string" ? d.defaultContent : "";
        const shown = typeof d.content === "string" ? d.content : packed;
        if (packed) setDefaultOverride(packed);
        if (!promptSeededRef.current) {
          promptSeededRef.current = true;
          setOverride(shown || packed);
        }
        setOverrideLoaded(true);
      } else
        setNotice({
          kind: "error",
          text: tr("err.override", { error: d && d.error || "" })
        });
    }).catch(
      (e) => setNotice({
        kind: "error",
        text: tr("err.override", { error: e.message })
      })
    );
    apiJson("/dsh-purge/own-servers").then((d) => {
      if (d && d.ok) {
        if (!ownSeededRef.current) {
          ownSeededRef.current = true;
          setOwnServers(typeof d.content === "string" ? d.content : "");
        }
        setOwnLoaded(true);
      }
    }).catch(() => {
    });
  }, []);
  useEffect(() => {
    loadAll();
  }, [loadAll]);
  const rejectNeedPrompt = useCallback((tr) => {
    setAskRestart(false);
    setNotice({ kind: "error", text: tr("need.prompt") });
    setTimeout(() => window.alert(tr("need.prompt")), 0);
  }, []);
  const doAction = useCallback(
    (action, actionKey) => {
      const tr = tRef.current;
      const label = tr(actionKey);
      const ticket = ++actionTicket.current;
      const run = () => {
        setPatchBusy(true);
        setAskRestart(false);
        setNotice({ kind: "idle", text: "" });
        const applyContent = action === "apply" ? readPromptBox() : "";
        fetch(apiUrl("/dsh-purge/" + action), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            action === "apply" ? { content: applyContent } : {}
          )
        }).then((r) => r.json()).then((d) => {
          if (ticket !== actionTicket.current) return;
          if (responseNeedsPrompt(d)) {
            rejectNeedPrompt(tr);
            return;
          }
          if (!d.ok) {
            setNotice({
              kind: "error",
              text: tr("err.action", {
                action: label,
                error: [
                  d.error || "",
                  ...runtimeRepairDetails(d.cli_repair)
                ].join("\n")
              })
            });
            return;
          }
          if (action === "apply") {
            if (typeof d.defaultContent === "string")
              setDefaultOverride(d.defaultContent);
            if (typeof d.override_content === "string") {
              setOverride(d.override_content);
              setOverrideLoaded(true);
            }
          }
          if (action === "apply" && d.complete === false) {
            setNotice({
              kind: "error",
              text: tr("restart.incomplete", {
                detail: incompleteApplyDetail(d, tr)
              })
            });
            loadAll();
            if (d.restarting || d.needs_full_quit) {
              suppressRestartAsk.current = false;
              setAskRestart(true);
            }
            return;
          }
          if (action === "apply") {
            if (d.manualQuit) {
              setNotice({
                kind: "ok",
                text: "Patches have been written to disk but are not loaded by the current process. The handoff helper is waiting for a full exit (Cmd+Q on macOS, system tray on Windows). After confirming handoff completion, open DSH manually. It will not restart automatically."
              });
              setAskRestart(false);
              loadAll();
              return;
            }
            setNotice({ kind: "ok", text: tr("ok.done") });
            loadAll();
            if (d.restarting || d.needs_full_quit) {
              suppressRestartAsk.current = false;
              setAskRestart(true);
            } else {
              setAskRestart(false);
            }
            return;
          }
          setNotice({ kind: "ok", text: tr("ok.done") });
          loadAll();
        }).catch((e) => {
          if (ticket !== actionTicket.current) return;
          setNotice({
            kind: "error",
            text: tr("err.action", { action: label, error: e.message })
          });
        }).finally(() => {
          if (ticket === actionTicket.current) setPatchBusy(false);
        });
      };
      run();
    },
    [loadAll, rejectNeedPrompt, state]
  );
  const saveOverride = useCallback(async () => {
    if (promptPending.current) return;
    promptPending.current = true;
    const ticket = ++actionTicket.current;
    const content = readPromptBox();
    setPatchBusy(true);
    setNotice({ kind: "idle", text: "" });
    try {
      if (await bothInjectEmpty(content, defaultOverrideRef.current)) {
        rejectNeedPrompt(t);
        return;
      }
      const d = await apiJson("/dsh-purge/override", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (ticket !== actionTicket.current) return;
      if (responseNeedsPrompt(d)) {
        rejectNeedPrompt(t);
        return;
      }
      if (!d || !d.ok) throw new Error(d && d.error || "Save failed");
      const unchanged = readPromptBox() === content;
      if (unchanged && typeof d.content === "string") {
        overrideRef.current = d.content;
        setOverride(d.content);
      }
      setNotice({
        kind: "ok",
        text: unchanged ? t("saved.override") : "The submitted version was saved; current edits are still unsaved."
      });
    } catch (e) {
      if (ticket === actionTicket.current)
        setNotice({ kind: "error", text: t("err.save", { error: e.message }) });
    } finally {
      promptPending.current = false;
      if (ticket === actionTicket.current) setPatchBusy(false);
    }
  }, [t, rejectNeedPrompt]);
  const saveOwnServers = async () => {
    if (ownPending.current || !ownLoaded) return;
    ownPending.current = true;
    setOwnBusy(true);
    const content = ownRef.current;
    try {
      const d = await apiJson("/dsh-purge/own-servers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!d || !d.ok) throw new Error(d && d.error || "Save failed");
      const unchanged = ownRef.current === content;
      if (unchanged && typeof d.content === "string") {
        ownRef.current = d.content;
        setOwnServers(d.content);
      }
      setNotice({
        kind: "ok",
        text: !unchanged ? "The submitted version was saved; current edits are still unsaved." : d.dropped > 0 ? t("saved.own.dropped", { n: d.dropped }) : t("saved.own")
      });
    } catch (e) {
      setNotice({ kind: "error", text: t("err.save", { error: e.message }) });
    } finally {
      ownPending.current = false;
      setOwnBusy(false);
    }
  };
  const restoreOverride = useCallback(() => {
    if (!defaultOverride) return;
    const tr = t;
    const ticket = ++actionTicket.current;
    overrideRef.current = defaultOverride;
    setOverride(defaultOverride);
    setPatchBusy(true);
    setNotice({ kind: "idle", text: "" });
    apiJson("/dsh-purge/override", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: defaultOverride })
    }).then((d) => {
      if (ticket !== actionTicket.current) return;
      if (!d || !d.ok) {
        setNotice({
          kind: "error",
          text: tr("err.save", { error: d && d.error || "" })
        });
        return;
      }
      const unchanged = readPromptBox() === defaultOverride;
      if (typeof d.content === "string" && unchanged) {
        overrideRef.current = d.content;
        setOverride(d.content);
      }
      setNotice({
        kind: "ok",
        text: unchanged ? tr("saved.restoreInject") : "Defaults were restored; current edits are still unsaved."
      });
    }).catch((e) => {
      if (ticket !== actionTicket.current) return;
      setNotice({
        kind: "error",
        text: tr("err.save", { error: e.message })
      });
    }).finally(() => {
      if (ticket === actionTicket.current) setPatchBusy(false);
    });
  }, [defaultOverride, t]);
  const waitHostAfterUninstall = useCallback((tr) => {
    const started = Date.now();
    const ping = () => {
      fetch(apiUrl("/"), { cache: "no-store", credentials: "same-origin" }).then((r) => {
        if (r.ok) {
          try {
            window.localStorage.removeItem("dshpp-theme");
            window.localStorage.removeItem("dshpp-theme-mode");
          } catch {
          }
          window.location.reload();
          return;
        }
        retry();
      }).catch(retry);
    };
    const retry = () => {
      if (Date.now() - started > 9e4) {
        setNotice({ kind: "error", text: tr("restart.timeout") });
        setUninstallBusy(false);
        return;
      }
      setTimeout(ping, 500);
    };
    setTimeout(ping, 800);
  }, []);
  const doUninstall = useCallback(() => {
    setUninstallBusy(true);
    setAskUninstall(false);
    setAskRestart(false);
    const tr = tRef.current;
    setNotice({ kind: "ok", text: tr("uninstall.applying") });
    apiJson("/dsh-purge/uninstall", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    }).then((d) => {
      if (!d || !d.ok) throw new Error(d && d.error || "uninstall failed");
      setNotice({
        kind: "ok",
        text: d && d.note || hostText(tr, "uninstall.done", d.surface || hostSurfaceOf(state))
      });
      if ((d && d.surface) === "desktop" || d && d.fullApp || hostSurfaceOf(state) === "desktop")
        return;
      waitHostAfterUninstall(tr);
    }).catch((e) => {
      const msg = String(e && e.message || e || "");
      if (/failed to fetch|networkerror|load failed/i.test(msg)) {
        setNotice({
          kind: "ok",
          text: hostText(tr, "uninstall.done", hostSurfaceOf(state))
        });
        if (hostSurfaceOf(state) === "desktop" || clientGuessSurface() === "desktop")
          return;
        waitHostAfterUninstall(tr);
        return;
      }
      setNotice({
        kind: "error",
        text: tr("uninstall.fail", { error: msg })
      });
      setUninstallBusy(false);
    });
  }, [state, waitHostAfterUninstall]);
  const s = state;
  const located = !!(s && s.ai_base);
  const hostSurface = hostSurfaceOf(s);
  const desktopLikely = hostSurface === "desktop" || clientGuessSurface() === "desktop";
  const sealedReady = !located && desktopLikely && !!(s && (s.asar_still_sealed || s.desktop_exe || s.desktop_install));
  const patchesLost = !located && !!(s && s.patches_lost);
  const allRows = located ? patchRowsAll(s) : [];
  const tally = located ? tallyPatches(allRows) : {
    applied: 0,
    pending: 0,
    unmatched: 0,
    partial: 0,
    drifted: 0,
    disabled: 0,
    skipped: 0,
    total: 0
  };
  const counts = located ? patchGroupCounts(allRows) : { applied: 0, pending: 0, off: 0, na: 0, total: 0, denom: 0 };
  const total = counts.denom;
  const applied = counts.applied;
  const pct = located && total ? Math.round(applied / total * 100) : 0;
  const metricNotes = [];
  if (tally.pending)
    metricNotes.push(t("metric.pendingShort", { n: tally.pending }));
  if (tally.unmatched)
    metricNotes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
  if (tally.partial)
    metricNotes.push(t("metric.partialShort", { n: tally.partial }));
  if (tally.drifted)
    metricNotes.push(t("metric.driftedShort", { n: tally.drifted }));
  if (tally.disabled)
    metricNotes.push(t("metric.disabledShort", { n: tally.disabled }));
  if (tally.skipped)
    metricNotes.push(t("metric.naShort", { n: tally.skipped }));
  const versions = updateInfo && updateInfo.versions || [];
  const channelNow = updateInfo && updateInfo.channel || channel || "stable";
  const localVer = s && s.plugin_version || updateInfo && updateInfo.localVersion || "";
  const renderEdition = (id) => {
    const lane = updateInfo && updateInfo.lanes && updateInfo.lanes[id] || {};
    const ceiling = listedCeiling(
      versions,
      localVer || updateInfo && updateInfo.localVersion
    );
    const list = versions.filter(
      (item) => item.channel === id && keepListedVersion(item, ceiling)
    );
    const selectedRef = pick[id] || "";
    const hit = list.find((item) => item.ref === selectedRef) || preferListed(list, localVer, updateInfo && updateInfo.pin);
    const onLane = channelNow === id;
    const noBeta = id === "beta" && Array.isArray(updateInfo && updateInfo.versions) && !list.length;
    const pickedOther = Boolean(hit && selectedRef && !hit.current);
    const thisJob = updateJob && updateJob.id === id ? updateJob : null;
    let actionLabel = t("btn.checkUpdate");
    let actionKind;
    let actionClick = () => checkUpdate(id);
    let actionDisabled = updateBusy || Boolean(noBeta);
    if (noBeta) {
      actionLabel = t("update.noBeta");
      actionClick = () => {
      };
    } else if (pickedOther) {
      actionLabel = t("update.switch");
      actionKind = "primary";
      actionClick = () => switchSelected(id);
    } else if (!onLane) {
      actionLabel = id === "beta" ? t("channel.useBeta") : t("channel.useStable");
      actionKind = "primary";
      actionClick = () => changeChannel(id);
    } else if (canApplyUpdate && lane.hasUpdate) {
      actionLabel = t("btn.doUpdate");
      actionKind = "primary";
      actionClick = () => doUpdate(id);
    }
    if (thisJob) {
      if (thisJob.kind === "check") actionLabel = t("btn.checkUpdate.busy");
      else if (thisJob.kind === "done") actionLabel = t("btn.doUpdate.busy");
      else actionLabel = t("update.switching");
    }
    return h(
      "div",
      {
        className: "dshpp-edition" + (onLane ? " is-on" : ""),
        "aria-label": t("channel." + id)
      },
      h(
        "span",
        { className: "dshpp-edition-name" },
        t("channel." + id),
        onLane ? h("em", { className: "dshpp-now-mark" }, t("update.current")) : null
      ),
      h(
        "select",
        {
          className: "dshpp-field dshpp-ver",
          value: list.length ? hit && hit.ref || "" : "",
          disabled: updateBusy || !list.length,
          onChange: (e) => setPick(
            (prev) => Object.assign({}, prev, { [id]: e.target.value })
          ),
          "aria-label": t("update.pick")
        },
        list.length ? list.map(
          (item) => h(
            "option",
            {
              key: item.ref + (item.sha || ""),
              value: item.ref
            },
            versionChoiceLabel(item, t)
          )
        ) : h(
          "option",
          { value: "" },
          noBeta ? t("update.noBeta") : t("update.pick")
        )
      ),
      h(
        Btn,
        {
          tiny: true,
          kind: actionKind,
          disabled: actionDisabled,
          onClick: actionClick
        },
        actionLabel
      )
    );
  };
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": t("purge.title") },
    h(
      "div",
      { hidden: page !== "status" },
      // Align the page title with actions and the last scan time.
      h(
        "div",
        { className: "dshpp-status-head" },
        h("h3", { className: "dshpp-status-title" }, t("status.title")),
        h(
          "div",
          { className: "dshpp-status-ops" },
          h(
            Btn,
            {
              kind: "primary",
              className: "dshpp-btn-apply",
              disabled: patchBusy || uninstallBusy || !overrideLoaded,
              onClick: () => doAction("apply", "action.apply")
            },
            patchBusy ? t("btn.apply.busy") : t("btn.apply") + (counts.pending ? " " + counts.pending : "")
          ),
          h(
            Btn,
            {
              kind: "danger",
              disabled: patchBusy || uninstallBusy,
              onClick: () => doAction("revert", "action.revert")
            },
            t("btn.revert")
          ),
          h(
            Btn,
            {
              kind: "solid-danger",
              disabled: patchBusy || uninstallBusy,
              onClick: () => setAskUninstall(true)
            },
            uninstallBusy ? t("btn.uninstall.busy") : t("btn.uninstall")
          ),
          h(
            "button",
            {
              type: "button",
              className: "dshpp-scan",
              onClick: loadAll,
              disabled: patchBusy || uninstallBusy,
              title: t("scan.hint")
            },
            scannedAt ? t("scan.recent", { time: scannedAt }) : t("scan.hint")
          )
        )
      ),
      !located ? h(
        "p",
        { className: "dshpp-status-note" },
        sealedReady ? "Host is still packed: click Apply" : t("metric.unlocated")
      ) : null,
      noticeNode(notice),
      h(PatchHealth, { state: s }),
      h(PatchGroupSwitches, { state: s, onSaved: loadAll }),
      h(
        "section",
        { className: "dshpp-fold is-open" },
        h(
          "h4",
          { className: "dshpp-fold-t" },
          t("detail.title"),
          h(
            "span",
            { className: "dshpp-fold-n" },
            !s ? t("detail.reading") : s.ok === false ? t("detail.unknown") : s.ai_base ? `${applied} / ${total}` : t("detail.unlocated")
          )
        ),
        h(PatchGroups, { state: s })
      ),
      h(PatchApplySteps, null),
      h(
        "details",
        null,
        h("summary", null, "Advanced options"),
        h(HooksDenySection, { onSaved: loadAll })
      ),
      askUninstall ? h(
        "div",
        {
          className: "dshpp-modal-bg",
          role: "dialog",
          "aria-modal": "true",
          "aria-labelledby": "dshpp-uninstall-title",
          onClick: (e) => {
            if (e.target === e.currentTarget && !uninstallBusy)
              setAskUninstall(false);
          }
        },
        h(
          "div",
          { className: "dshpp-modal" },
          h("h4", { id: "dshpp-uninstall-title" }, t("uninstall.title")),
          h("p", null, t("uninstall.body")),
          h(
            "div",
            { className: "dshpp-modal-ops" },
            h(
              Btn,
              {
                disabled: uninstallBusy,
                onClick: () => setAskUninstall(false)
              },
              t("uninstall.cancel")
            ),
            h(
              Btn,
              {
                kind: "solid-danger",
                disabled: uninstallBusy,
                onClick: doUninstall
              },
              t("uninstall.confirm")
            )
          )
        )
      ) : null,
      h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-mute)",
            fontSize: 12
          }
        },
        t("apply.hint")
      ),
      s?.ok === true && !s.ai_base ? h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-danger, #c44)",
            fontSize: 12
          }
        },
        hostText(t, "warn.noRoot", hostSurface)
      ) : null,
      s && s.ai_base && s.override_status === "missing" ? h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-mute)",
            fontSize: 12
          }
        },
        t("warn.noInject")
      ) : null,
      askRestart ? h(RestartAsk, {
        t,
        theme: detectHostTheme(),
        onLater: () => {
          suppressRestartAsk.current = true;
          setAskRestart(false);
        },
        onRestart: () => {
          suppressRestartAsk.current = true;
          setAskRestart(false);
          restartDsh(setNotice, function() {
          }, t, hostSurface);
        }
      }) : null
    ),
    h(
      "div",
      { hidden: page !== "prompt" },
      h(
        "div",
        { className: "dshpp-sub" },
        h("h4", null, t("override.title")),
        h(
          "div",
          { className: "dshpp-row", style: { margin: 0 } },
          h(
            Btn,
            {
              kind: "primary",
              tiny: true,
              disabled: patchBusy || !overrideLoaded,
              onClick: saveOverride
            },
            t("btn.saveInject")
          ),
          h(
            Btn,
            {
              tiny: true,
              disabled: patchBusy || !overrideLoaded || !defaultOverride,
              onClick: restoreOverride
            },
            t("btn.restoreInject")
          )
        )
      ),
      h("textarea", {
        className: "dshpp-area",
        ref: promptAreaRef,
        "aria-label": "Prompt content",
        disabled: !overrideLoaded,
        value: override,
        onChange: (e) => {
          overrideRef.current = e.target.value;
          setOverride(e.target.value);
        },
        spellCheck: false,
        placeholder: ""
      }),
      noticeNode(notice),
      promptBoxEmpty(override) ? h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-danger, #c44)",
            fontSize: 12
          }
        },
        t("need.prompt")
      ) : null
    ),
    h(
      "div",
      { hidden: page !== "more" },
      h(
        "div",
        { className: "dshpp-sub" },
        h("h4", null, t("own.title")),
        h(
          "div",
          { className: "dshpp-row", style: { margin: 0 } },
          h(
            Btn,
            {
              kind: "primary",
              tiny: true,
              disabled: !ownLoaded || ownBusy,
              onClick: saveOwnServers
            },
            t("own.save")
          )
        )
      ),
      h("textarea", {
        className: "dshpp-area",
        "aria-label": "Server list",
        disabled: !ownLoaded,
        value: ownServers,
        onChange: (e) => {
          ownRef.current = e.target.value;
          setOwnServers(e.target.value);
        },
        spellCheck: false,
        rows: 4,
        style: { minHeight: 96 }
      }),
      h(
        "p",
        {
          className: "dshpp-hint",
          style: {
            margin: "8px 0 0",
            color: "var(--dshpp-mute)",
            fontSize: 12
          }
        },
        t("own.hint")
      ),
      noticeNode(notice)
    )
  );
}

// src/state/session-context.js
var import_react11 = require("react");
var host = null;
var listeners2 = /* @__PURE__ */ new Set();
function notify() {
  for (const listener of listeners2) listener();
}
function subscribe(listener) {
  listeners2.add(listener);
  return () => listeners2.delete(listener);
}
function bindSessionContext(ctx) {
  host = ctx;
  const dispose = [ctx.uiWorkspace?.selection, ctx.sessions?.list].filter((store) => typeof store?.subscribe === "function").map((store) => store.subscribe(notify));
  notify();
  return () => {
    for (const fn of dispose) if (typeof fn === "function") fn();
    if (host === ctx) {
      host = null;
      notify();
    }
  };
}
function readSessionCwd(sess) {
  if (!sess || typeof sess !== "object") return "";
  try {
    const pv = sess.projectionValues;
    if (pv && typeof pv.cwd === "string" && pv.cwd.trim()) return pv.cwd.trim();
  } catch {
  }
  try {
    if (typeof sess.cwd === "string" && sess.cwd.trim()) return sess.cwd.trim();
  } catch {
  }
  try {
    const header = sess.header;
    if (header && typeof header.cwd === "string" && header.cwd.trim())
      return header.cwd.trim();
  } catch {
  }
  return "";
}
function clientCurrentCwd() {
  if (!host?.sessions) return "";
  const sessions = host.sessions;
  const selection = host.uiWorkspace?.selection?.getSnapshot?.();
  const list = sessions.list?.getSnapshot?.();
  const id = selection?.sessionId || list?.current;
  if (!id) return "";
  const fromList = readSessionCwd(list?.byId?.[id]);
  if (fromList) return fromList;
  try {
    const scope = sessions.scope?.(id);
    const face = sessions.sessionOf?.(scope);
    return readSessionCwd(face?.getSnapshot?.() ?? face);
  } catch {
    return "";
  }
}
function useCurrentCwd() {
  return (0, import_react11.useSyncExternalStore)(subscribe, clientCurrentCwd, () => "");
}

// src/components/rules.js
var TARGETS = ["AGENTS.md", "CLAUDE.md"];
function ruleLabel(r) {
  if (!r) return "";
  if (r.name !== r.id) return r.name + " (" + r.id + ")";
  return r.id;
}
function RulesSection() {
  const t = useT();
  const cwd = useCurrentCwd();
  const statusTicket = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;
  const [st, setSt] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("AGENTS.md");
  const [content, setContent] = useState("");
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("AGENTS.md");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const loadStatus = useCallback(() => {
    const tr = tRef.current;
    const ticket = ++statusTicket.current;
    rulesApi("status", cwd ? { cwd } : void 0).then((d) => {
      if (ticket !== statusTicket.current) return;
      if (d && d.ok) setSt(d);
      else {
        setSt({ ok: false, rules: [], active: null });
        setNotice({
          kind: "error",
          text: tr("err.rules", { error: d && d.error || "bad response" })
        });
      }
    }).catch((e) => {
      if (ticket !== statusTicket.current) return;
      setSt({ ok: false, rules: [], active: null });
      setNotice({
        kind: "error",
        text: tr("err.rules", { error: e.message })
      });
    });
  }, [cwd]);
  useEffect(() => {
    loadStatus();
    return () => {
      statusTicket.current += 1;
    };
  }, [loadStatus]);
  const doPost = useCallback(
    (action, payload, after) => {
      setBusy(true);
      setNotice({ kind: "idle", text: "" });
      rulesApi(action, payload).then((d) => {
        if (d && d.ok) {
          setNotice({ kind: "ok", text: t("ok.done") });
          if (action === "save" || action === "activate")
            warnNeedPrompt(d, t);
          loadStatus();
          if (after) after();
        } else {
          warnNeedPrompt(d, t);
          setNotice({
            kind: "error",
            text: t("err.action", { error: d && d.error || "" })
          });
        }
      }).catch(
        (e) => setNotice({
          kind: "error",
          text: t("err.action", { error: e.message })
        })
      ).finally(() => setBusy(false));
    },
    [loadStatus, t]
  );
  const openRule = useCallback(
    (id) => {
      setBusy(true);
      rulesApi("read", { id }).then((d) => {
        if (d.ok) {
          setEditId(id);
          setEditName(d.name || id);
          setEditTarget(d.target || "AGENTS.md");
          setContent(typeof d.content === "string" ? d.content : "");
        } else
          setNotice({
            kind: "error",
            text: t("err.read", { error: d.error || "" })
          });
      }).catch(
        (e) => setNotice({
          kind: "error",
          text: t("err.read", { error: e.message })
        })
      ).finally(() => setBusy(false));
    },
    [t]
  );
  const clearEditor = () => {
    setEditId(null);
    setEditName("");
    setEditTarget("AGENTS.md");
    setContent("");
  };
  let list;
  if (!st) {
    list = h("div", {
      className: "dshpp-skel",
      style: { height: 80, margin: 12 }
    });
  } else if (!st.rules || st.rules.length === 0) {
    list = h("p", { className: "dshpp-empty" }, t("rules.empty"));
  } else {
    list = st.rules.map((r) => {
      const isActive = r.id === st.active;
      const isEdit = r.id === editId;
      return h(
        "div",
        {
          key: r.id,
          className: "dshpp-ruleitem" + (isEdit ? " is-edit" : ""),
          role: "button",
          tabIndex: 0,
          onClick: () => openRule(r.id),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openRule(r.id);
            }
          }
        },
        h(
          "div",
          { className: "dshpp-rule-main" },
          h(
            "span",
            { className: "dshpp-rule-name" },
            ruleLabel(r),
            isActive ? h("span", { className: "dshpp-pill is-ok" }, t("pill.current")) : null
          ),
          h(
            "span",
            { className: "dshpp-rule-meta" },
            r.target + " \xB7 " + formatSize(r.size)
          )
        ),
        h(
          "div",
          { className: "dshpp-rule-ops" },
          h(
            Btn,
            {
              tiny: true,
              kind: isActive ? void 0 : "primary",
              disabled: busy || isActive,
              onClick: (e) => {
                e.stopPropagation();
                if (!isActive) doPost("activate", { id: r.id });
              }
            },
            isActive ? t("btn.inUse") : t("btn.use")
          ),
          h(
            Btn,
            {
              tiny: true,
              kind: "danger",
              disabled: busy,
              onClick: (e) => {
                e.stopPropagation();
                if (!window.confirm(t("confirm.delete", { id: r.id }))) return;
                if (editId === r.id) clearEditor();
                doPost("delete", { id: r.id });
              }
            },
            t("delete")
          )
        )
      );
    });
  }
  const policyValue = st && typeof st.workspace_policy === "string" ? st.workspace_policy : "fallback";
  const policyOptions = st && Array.isArray(st.workspace_policies) && st.workspace_policies.length ? st.workspace_policies : ["fallback", "strict", "always"];
  const cwdCandidates = st && Array.isArray(st.cwd_candidates) ? st.cwd_candidates : [];
  const cwdValue = st && typeof st.cwd === "string" ? st.cwd : "";
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": t("rules.title") },
    h(
      "div",
      { className: "dshpp-head" },
      h("h3", { className: "dshpp-title" }, t("rules.title")),
      h(
        "div",
        { className: "dshpp-row", style: { margin: 0 } },
        noticeNode(notice),
        h(
          Btn,
          {
            tiny: true,
            kind: "danger",
            disabled: busy,
            onClick: () => {
              if (!window.confirm(t("rules.reset.confirm"))) return;
              clearEditor();
              doPost("reset", {});
            }
          },
          t("rules.reset")
        )
      )
    ),
    h(
      "div",
      { className: "dshpp-block" },
      h(
        "div",
        { className: "dshpp-policy-row" },
        h("label", { htmlFor: "dshpp-policy-select" }, t("policy.title")),
        h(
          "select",
          {
            id: "dshpp-policy-select",
            className: "dshpp-field",
            value: policyValue,
            disabled: busy || !st,
            onChange: (e) => doPost("set-policy", { policy: e.target.value })
          },
          policyOptions.map(
            (p) => h("option", { key: p, value: p }, t("policy." + p))
          )
        )
      ),
      h("p", { className: "dshpp-block-hint" }, t("policy.hint"))
    ),
    h(
      "div",
      { className: "dshpp-block" },
      h(
        "div",
        { className: "dshpp-block-head" },
        h("h4", null, t("cwd.title")),
        h(
          Btn,
          {
            tiny: true,
            disabled: busy,
            onClick: () => {
              let cwd2 = cwdValue;
              if (!cwd2) {
                try {
                  cwd2 = clientCurrentCwd();
                } catch {
                }
              }
              doPost("scan-cwd", cwd2 ? { cwd: cwd2 } : {});
            }
          },
          t("cwd.rescan")
        )
      ),
      cwdValue ? h("p", { className: "dshpp-cwd-path" }, cwdValue) : null,
      !st || !cwdValue ? h("p", { className: "dshpp-empty" }, t("cwd.no.workspace")) : cwdCandidates.length === 0 ? h("p", { className: "dshpp-empty" }, t("cwd.empty")) : h(
        "div",
        { className: "dshpp-cwd-list" },
        cwdCandidates.map(
          (item) => h(
            "label",
            {
              key: item.path,
              className: "dshpp-cwd-item" + (item.selected ? " is-on" : "")
            },
            h("input", {
              type: "checkbox",
              checked: Boolean(item.selected),
              disabled: busy,
              onChange: (e) => doPost("toggle-cwd", {
                path: item.path,
                enabled: e.target.checked
              })
            }),
            h(
              "div",
              { className: "dshpp-cwd-main" },
              h(
                "div",
                { className: "dshpp-cwd-name" },
                h("span", null, item.name),
                h(
                  "span",
                  { className: "dshpp-cwd-badge" },
                  t("cwd.scope." + (item.scope || "cwd"))
                ),
                h(
                  "span",
                  { className: "dshpp-cwd-size" },
                  formatSize(item.size || 0)
                )
              ),
              h("div", { className: "dshpp-cwd-sub" }, item.path),
              item.preview ? h("div", { className: "dshpp-cwd-prev" }, item.preview) : null
            )
          )
        )
      ),
      h("p", { className: "dshpp-block-hint" }, t("cwd.hint"))
    ),
    h(
      "div",
      { className: "dshpp-block" },
      h(
        "div",
        { className: "dshpp-split" },
        h(
          "div",
          { className: "dshpp-rulelist" },
          h("div", { className: "dshpp-rulebody" }, list),
          h(
            "div",
            { className: "dshpp-create" },
            h(
              "div",
              { className: "dshpp-create-row" },
              h("input", {
                className: "dshpp-field",
                placeholder: t("ph.id"),
                value: newId,
                onChange: (e) => setNewId(e.target.value)
              }),
              h("input", {
                className: "dshpp-field",
                placeholder: t("ph.alias"),
                value: newName,
                onChange: (e) => setNewName(e.target.value)
              }),
              h(
                "select",
                {
                  className: "dshpp-field",
                  style: { minWidth: 120, flex: "0 0 auto" },
                  value: newTarget,
                  onChange: (e) => setNewTarget(e.target.value)
                },
                TARGETS.map((x) => h("option", { key: x, value: x }, x))
              ),
              h(
                Btn,
                {
                  kind: "primary",
                  tiny: true,
                  disabled: busy,
                  onClick: () => {
                    const id = newId.trim();
                    if (!id) {
                      setNotice({ kind: "error", text: t("need.id") });
                      return;
                    }
                    const name2 = newName.trim() || id;
                    const target = newTarget;
                    doPost("save", { id, content: "", name: name2, target }, () => {
                      setEditId(id);
                      setEditName(name2);
                      setEditTarget(target);
                      setContent("");
                    });
                    setNewId("");
                    setNewName("");
                    setNewTarget("AGENTS.md");
                  }
                },
                t("btn.create")
              )
            )
          )
        ),
        h(
          "div",
          { className: "dshpp-editor" },
          editId ? [
            h(
              "div",
              { key: "meta", className: "dshpp-row" },
              h("input", {
                className: "dshpp-field",
                placeholder: t("ph.alias.short"),
                value: editName,
                onChange: (e) => setEditName(e.target.value)
              }),
              h(
                "select",
                {
                  className: "dshpp-field",
                  style: { minWidth: 120 },
                  value: editTarget,
                  onChange: (e) => setEditTarget(e.target.value)
                },
                TARGETS.map((x) => h("option", { key: x, value: x }, x))
              )
            ),
            h("textarea", {
              key: "body",
              className: "dshpp-area",
              value: content,
              onChange: (e) => setContent(e.target.value),
              placeholder: ""
            }),
            h(
              "div",
              { key: "save", className: "dshpp-row" },
              h(
                Btn,
                {
                  kind: "primary",
                  disabled: busy,
                  onClick: () => doPost("save", {
                    id: editId,
                    content,
                    name: editName,
                    target: editTarget
                  })
                },
                t("btn.saveRule")
              ),
              noticeNode(notice)
            )
          ] : h("div", { className: "dshpp-editor-empty" }, t("rules.pick"))
        )
      )
    )
  );
}

// src/components/skills.js
function skillUiAllowed(d) {
  if (!d) return false;
  const ver = String(d.plugin_version || d.localVersion || "").replace(
    /^v/i,
    ""
  );
  if (/^1\.1\.11(?:-|$)/.test(ver)) return false;
  const parts = ver.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!parts) return false;
  if (+parts[1] !== 1) return +parts[1] > 1;
  if (+parts[2] !== 1) return +parts[2] > 1;
  return +parts[3] >= 12;
}
function SkillsSection() {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [onBeta, setOnBeta] = useState(false);
  const [st, setSt] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const zipRef = useRef(null);
  const folderRef = useRef(null);
  const loadStatus = useCallback(() => {
    const tr = tRef.current;
    const fail = (e) => {
      setSt({ ok: false, skills: [] });
      setNotice({
        kind: "error",
        text: skillsRouteMissing(e) ? tr("err.skills.needRestart") : tr("err.skills", {
          error: e && e.message || e || "bad response"
        })
      });
    };
    const apply2 = (d) => {
      if (d && d.ok) setSt({ ok: true, skills: d.skills || [] });
      else fail({ message: d && d.error || "bad response" });
    };
    apiJson("/dsh-purge/status").then((d) => {
      const allowed = skillUiAllowed(d);
      setOnBeta(allowed);
      if (!allowed) {
        setSt(null);
        return;
      }
      if (d.skills) {
        apply2({ ok: true, skills: d.skills });
        return;
      }
      skillsApi("status").then(apply2).catch(fail);
    }).catch(() => {
      setOnBeta(false);
      setSt(null);
    });
  }, []);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  const doPost = useCallback(
    (action, payload, after) => {
      setBusy(true);
      setNotice({ kind: "idle", text: "" });
      skillsApi(action, payload).then((d) => {
        if (d && d.ok) {
          setNotice({ kind: "ok", text: t("ok.done") });
          loadStatus();
          if (after) after(d);
        } else {
          setNotice({
            kind: "error",
            text: t("err.action", { error: d && d.error || "" })
          });
        }
      }).catch(
        (e) => setNotice({
          kind: "error",
          text: skillsRouteMissing(e) ? t("err.skills.needRestart") : t("err.action", { error: e.message })
        })
      ).finally(() => setBusy(false));
    },
    [loadStatus, t]
  );
  const openSkill = useCallback(
    (id) => {
      setBusy(true);
      skillsApi("read", { id }).then((d) => {
        if (d.ok) {
          setEditId(id);
          setEditDesc(d.description || "");
          setContent(typeof d.content === "string" ? d.content : "");
        } else
          setNotice({
            kind: "error",
            text: t("err.read", { error: d.error || "" })
          });
      }).catch(
        (e) => setNotice({
          kind: "error",
          text: t("err.read", { error: e.message })
        })
      ).finally(() => setBusy(false));
    },
    [t]
  );
  const clearEditor = () => {
    setEditId(null);
    setEditDesc("");
    setContent("");
  };
  const readAsBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      const at = text.indexOf(",");
      resolve(at >= 0 ? text.slice(at + 1) : text);
    };
    reader.onerror = () => reject(new Error(t("need.import")));
    reader.readAsDataURL(file);
  });
  const importZip = (file) => {
    if (!file) {
      setNotice({ kind: "error", text: t("need.import") });
      return;
    }
    setBusy(true);
    setNotice({ kind: "ok", text: t("skills.importing") });
    readAsBase64(file).then((data) => skillsApi("import", { data, name: file.name })).then((d) => {
      if (!d || !d.ok) throw new Error(d && d.error || "");
      setNotice({
        kind: "ok",
        text: t("saved.import", { count: (d.imported || []).length || 1 })
      });
      loadStatus();
    }).catch(
      (e) => setNotice({
        kind: "error",
        text: skillsRouteMissing(e) ? t("err.skills.needRestart") : t("err.action", { error: e.message })
      })
    ).finally(() => setBusy(false));
  };
  const keepFolderFile = (file) => {
    const rel = String(file.webkitRelativePath || file.name || "").replace(
      /\\/g,
      "/"
    );
    if (!rel || rel.includes("..")) return false;
    if (/(^|\/)(node_modules|\.git|__MACOSX|\.system)(\/|$)/i.test(rel))
      return false;
    if (/(^|\/)\._/.test(rel) || /\/\.DS_Store$/i.test(rel)) return false;
    return true;
  };
  const importFolder = (list2) => {
    const files = Array.from(list2 || []).filter(keepFolderFile);
    if (!files.length) {
      setNotice({ kind: "error", text: t("err.import.folder") });
      return;
    }
    setBusy(true);
    setNotice({ kind: "ok", text: t("skills.importing") });
    Promise.all(
      files.map(
        (file) => readAsBase64(file).then((content2) => ({
          path: file.webkitRelativePath || file.name,
          content: content2,
          encoding: "base64"
        }))
      )
    ).then(
      (payload) => skillsApi("import", {
        files: payload,
        name: String(payload[0] && payload[0].path || "").split("/")[0]
      })
    ).then((d) => {
      if (!d || !d.ok) throw new Error(d && d.error || "");
      setNotice({
        kind: "ok",
        text: t("saved.import", { count: (d.imported || []).length || 1 })
      });
      loadStatus();
    }).catch(
      (e) => setNotice({
        kind: "error",
        text: skillsRouteMissing(e) ? t("err.skills.needRestart") : t("err.action", { error: e.message })
      })
    ).finally(() => setBusy(false));
  };
  if (!onBeta) return null;
  let list;
  if (!st) {
    list = h("div", {
      className: "dshpp-skel",
      style: { height: 80, margin: 12 }
    });
  } else if (!st.skills || st.skills.length === 0) {
    list = h("p", { className: "dshpp-empty" }, t("skills.empty"));
  } else {
    list = st.skills.map((item) => {
      const isEdit = item.id === editId;
      return h(
        "div",
        {
          key: item.id,
          className: "dshpp-ruleitem" + (isEdit ? " is-edit" : ""),
          role: "button",
          tabIndex: 0,
          onClick: () => openSkill(item.id),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openSkill(item.id);
            }
          }
        },
        h(
          "div",
          { className: "dshpp-rule-main" },
          h("span", { className: "dshpp-rule-name" }, item.id),
          h(
            "span",
            { className: "dshpp-rule-meta" },
            (item.valid ? item.description : t("skills.invalid")) + " \xB7 " + formatSize(item.size)
          ),
          item.valid ? h(
            "span",
            { className: "dshpp-rule-meta" },
            [
              item.userInvocable ? t("skills.call.slash", { cmd: "/" + item.id }) : t("skills.call.userOff"),
              item.modelInvocable ? t("skills.call.model") : t("skills.call.modelOff")
            ].join(" \xB7 ")
          ) : null
        ),
        h(
          "div",
          { className: "dshpp-rule-ops" },
          h(
            Btn,
            {
              tiny: true,
              kind: "danger",
              disabled: busy,
              onClick: (e) => {
                e.stopPropagation();
                if (!window.confirm(t("confirm.delete.skill", { id: item.id })))
                  return;
                if (editId === item.id) clearEditor();
                doPost("delete", { id: item.id });
              }
            },
            t("delete")
          )
        )
      );
    });
  }
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": t("skills.title") },
    h(
      "div",
      { className: "dshpp-head" },
      h("h3", { className: "dshpp-title" }, t("skills.title")),
      h(
        "div",
        { className: "dshpp-row", style: { margin: 0 } },
        noticeNode(notice)
      )
    ),
    h(
      "p",
      {
        className: "dshpp-hint",
        style: { margin: "0 0 10px", color: "var(--dshpp-mute)", fontSize: 12 }
      },
      hostText(t, "skills.hint", hostSurfaceOf())
    ),
    h(
      "div",
      { className: "dshpp-split" },
      h(
        "div",
        { className: "dshpp-rulelist" },
        h("div", { className: "dshpp-rulebody" }, list),
        h(
          "div",
          { className: "dshpp-create" },
          h(
            "div",
            { className: "dshpp-create-row" },
            h("input", {
              ref: zipRef,
              type: "file",
              accept: ".zip,.tgz,.tar.gz,.tar,.skill",
              style: { display: "none" },
              onChange: (e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = "";
                importZip(file);
              }
            }),
            h("input", {
              ref: (el) => {
                folderRef.current = el;
                if (!el) return;
                el.setAttribute("webkitdirectory", "");
                el.setAttribute("directory", "");
                el.multiple = true;
              },
              type: "file",
              multiple: true,
              style: { display: "none" },
              onChange: (e) => {
                const files = Array.from(e.target && e.target.files || []);
                e.target.value = "";
                importFolder(files);
              }
            }),
            h(
              Btn,
              {
                kind: "primary",
                tiny: true,
                disabled: busy,
                onClick: () => zipRef.current && zipRef.current.click()
              },
              t("btn.importZip")
            ),
            h(
              Btn,
              {
                tiny: true,
                disabled: busy,
                onClick: () => folderRef.current && folderRef.current.click()
              },
              t("btn.importFolder")
            )
          )
        )
      ),
      h(
        "div",
        { className: "dshpp-editor" },
        editId ? [
          h(
            "div",
            { key: "meta", className: "dshpp-row" },
            h("input", {
              className: "dshpp-field",
              placeholder: t("ph.skill.desc"),
              value: editDesc,
              onChange: (e) => setEditDesc(e.target.value)
            })
          ),
          h("textarea", {
            key: "body",
            className: "dshpp-area",
            value: content,
            onChange: (e) => setContent(e.target.value),
            spellCheck: false,
            placeholder: ""
          }),
          h(
            "div",
            { key: "save", className: "dshpp-row" },
            h(
              Btn,
              {
                kind: "primary",
                disabled: busy,
                onClick: () => doPost("save", {
                  id: editId,
                  content,
                  description: editDesc
                })
              },
              t("btn.saveSkill")
            ),
            noticeNode(notice)
          )
        ] : h("div", { className: "dshpp-editor-empty" }, t("skills.pick"))
      )
    )
  );
}

// src/components/maintenance.js
function useText() {
  const t = useT();
  return (key, fallback) => {
    const hit = t(key);
    return hit && hit !== key ? hit : fallback;
  };
}
function StatusExtras() {
  const [check, setCheck] = useState(null);
  const [boost, setBoost] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () => Promise.all([
    apiJson("/dsh-purge/selfcheck").then(setCheck).catch(() => setCheck(null)),
    apiJson("/dsh-purge/boost").then((r) => setBoost(!!r.enabled)).catch(() => setBoost(null))
  ]);
  useEffect(() => {
    load();
  }, []);
  async function toggle() {
    try {
      const r = await apiJson("/dsh-purge/boost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !boost })
      });
      setBoost(!!r.enabled);
      setNotice(
        r.enabled ? "Enabled; takes effect after restart" : "Disabled; takes effect after restart"
      );
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function rerun() {
    setBusy(true);
    try {
      setCheck(await apiJson("/dsh-purge/selfcheck"));
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  const layers = check && Array.isArray(check.layers) ? check.layers : [];
  const failed = layers.filter(
    (l) => l.state === "broken" || !l.state && !l.ok
  );
  const pendingLayers = layers.filter((l) => l.state === "pending");
  const uncertain = layers.filter(
    (l) => ["inferred", "unknown"].includes(l.state)
  );
  const pendingPatches = pendingLayers.reduce(
    (n, l) => n + (l.pending?.length || 0),
    0
  );
  const total = layers.filter((layer) => layer.applicable !== false).length;
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "Patch status" },
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        h("i", {
          className: "dshpp-dot " + (check ? failed.length ? "is-bad" : pendingLayers.length || uncertain.length ? "is-warn" : "is-ok" : "")
        }),
        "Self-check",
        h(
          "b",
          null,
          check ? failed.length ? `${failed.length} layers inactive` : pendingLayers.length ? `${pendingPatches} patches pending` : uncertain.length ? `${uncertain.length} layers need confirmation` : `All ${total} layers in place` : "Checking\u2026"
        )
      ),
      h(
        "details",
        { className: "dshpp-fold-inline" },
        h("summary", null, "View layers"),
        h(
          "div",
          { className: "dshpp-checks" },
          check && Array.isArray(check.layers) ? check.layers.map(
            (layer) => h(
              "div",
              {
                key: layer.title,
                className: "dshpp-check" + (["pending", "inferred", "unknown"].includes(layer.state) ? " is-warn" : layer.ok ? "" : " is-bad")
              },
              h("i", {
                className: "dshpp-dot " + (["pending", "inferred", "unknown"].includes(layer.state) ? "is-warn" : layer.ok ? "is-ok" : "is-bad")
              }),
              h("span", { className: "dshpp-check-name" }, layer.title),
              h(
                "span",
                { className: "dshpp-check-val" },
                layer.applicable === false ? "Not applicable" : layer.state === "pending" ? `Pending #${(layer.pending || []).join("/#")}` : layer.state === "inferred" ? "Inferred from host" : layer.state === "unknown" ? "Unconfirmed" : `${layer.applied}/${layer.required ?? layer.total}`
              ),
              layer.note ? h(HelpTip, { title: layer.title }, layer.note) : null
            )
          ) : h("div", { className: "dshpp-muted" }, "Checking\u2026")
        )
      ),
      h(
        Btn,
        { tiny: true, disabled: busy, onClick: rerun },
        busy ? "\u2026" : "Recheck"
      ),
      h(
        Btn,
        {
          tiny: true,
          title: "Generate a one-time probe and check whether the next reply echoes its marker exactly",
          onClick: async () => {
            try {
              const r = await apiJson("/dsh-purge/probe", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{}"
              });
              setNotice(r.message || "");
            } catch (e) {
              setNotice(e.message);
            }
          }
        },
        "Probe"
      )
    ),
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        "Prompt boost",
        h(
          HelpTip,
          { title: "Prompt boost" },
          "Appends a section at the end of the system prompt, at the same level as the injection: priority declarations, refusal handling, anti-sycophancy, and repeated instructions across turns. Enabled by default."
        ),
        h("b", null, boost === null ? "\u2026" : boost ? "Enabled" : "Disabled")
      ),
      h(
        Btn,
        { tiny: true, disabled: boost === null, onClick: toggle },
        boost ? "Disable" : "Enable"
      ),
      notice ? h("span", { className: "dshpp-muted" }, notice) : null
    )
  );
}
function assertMaintenanceResult(result) {
  if (!result || typeof result !== "object")
    throw new Error("The maintenance API returned an invalid result");
  if (result.ok === false) {
    const errors = Array.isArray(result.errors) ? result.errors.filter(Boolean).join("; ") : "";
    const partial = result.applied ? "; some targets were updated. Restart their DSH processes to load the changes" : "";
    throw new Error(
      (result.error || errors || "Maintenance operation failed") + partial
    );
  }
}
function maintenanceNotice(op, result) {
  if (op === "backup") {
    if (!result.id)
      throw new Error(
        "The backup operation returned no backup ID. Refresh the list to verify the result"
      );
    return `Backup created: ${result.id}`;
  }
  if (op === "rollback")
    return (result.note || "Plugin rollback completed") + ". Restart the DSH process; refreshing the browser alone will not load the updated backend.";
  if (op === "update") {
    if (result.applied === false || result.skipped)
      return result.note || "No new version was installed. The current installation was not updated.";
    if (result.applied || result.needRestart || result.restart_required) {
      const version = result.release?.version || result.localVersion || result.remoteVersion;
      const warnings = result.cleanup_warnings || [];
      const cleanup = warnings.length ? `Cleanup incomplete (${warnings.map((w) => `${w.stage}:${w.code}`).join(", ")}); remaining files were retained. ` : "";
      return `${cleanup}Plugin installed${version ? ": " + version : ""}. Restart the DSH process; refreshing the browser alone will not load the updated backend.`;
    }
    return result.note || "Update request completed. Refresh the status to verify the installation result.";
  }
  return result.note || "Maintenance operation completed";
}
function UpdatePreferences({
  value,
  status = {},
  onSaved,
  onOpenChannel
}) {
  const tr = useText();
  const [saving, setSaving] = useState(false), [error, setError] = useState("");
  const locked = useRef(false);
  if (!value) return null;
  async function save(patch) {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "preferences", value: patch })
      });
      assertMaintenanceResult(result);
      onSaved(result.update_preferences);
    } catch (e) {
      setError(e.message);
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  return h(
    "section",
    { "aria-label": "Automatic update settings", className: "dshpp-card" },
    h(
      "div",
      { className: "dshpp-row" },
      h(
        "label",
        null,
        h("input", {
          type: "checkbox",
          checked: value.autoCheck,
          disabled: saving,
          onChange: (e) => save({ autoCheck: e.target.checked }),
          "aria-label": "Automatically check for updates"
        }),
        "Automatically check for updates"
      ),
      h(HelpTip, {
        title: "Automatically check for updates",
        children: "Checks 30 seconds after startup, then at the selected interval. Disabling this pauses automatic installation while preserving its saved preference."
      }),
      h(
        "select",
        {
          "aria-label": "Update check interval",
          value: value.intervalHours,
          disabled: saving || !value.autoCheck,
          onChange: (e) => save({ intervalHours: Number(e.target.value) })
        },
        [.../* @__PURE__ */ new Set([1, 6, 12, 24, value.intervalHours])].sort((a, b) => a - b).map(
          (v) => h(
            "option",
            { key: v, value: v },
            `Every ${v} hour${v === 1 ? "" : "s"}`
          )
        )
      ),
      // Keep the update channel beside the controls whose proxy/token it configures.
      onOpenChannel ? h(
        Btn,
        {
          tiny: true,
          className: "dshpp-updch-open",
          disabled: saving,
          onClick: () => onOpenChannel(),
          title: tr(
            "updch.title",
            "Update channel: proxy and GitHub token"
          )
        },
        tr("updch.open", "Update channel")
      ) : null
    ),
    h(
      "div",
      { className: "dshpp-row" },
      h(
        "label",
        null,
        h("input", {
          type: "checkbox",
          checked: value.autoInstall,
          disabled: saving,
          onChange: (e) => save({ autoInstall: e.target.checked }),
          "aria-label": "Automatically install updates"
        }),
        "Automatically install updates"
      ),
      h(HelpTip, {
        title: "Automatically install updates",
        children: "Installs only when automatic checks are enabled and a new stable release is available without a version lock. Backs up and verifies the release before installation; failures do not switch sources automatically. Restart DSH manually afterward."
      })
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      status.reconciliationError ? "Installation status needs verification. Automatic installation is paused." : status.restartRequired ? `Version on disk: ${status.pendingVersion}; running: ${status.runningVersion || "unknown"}. Waiting for you to restart DSH manually.` : !value.autoCheck ? "Automatic checks are disabled. Automatic installation is paused." : status.checkedAt ? `Last checked: ${new Date(status.checkedAt).toLocaleString()}${status.hasUpdate ? ` \xB7 Available version: ${status.availableVersion}` : ""}` : "Checks automatically after startup. Installation prompts you to restart manually."
    ),
    [
      ...new Set(
        [
          status.reconciliationError,
          status.error,
          status.installError,
          error
        ].filter(Boolean)
      )
    ].map((message) => h("p", { key: message, role: "alert" }, message))
  );
}
function UpdateChannelDialog({ value, onClose, onSaved }) {
  const tr = useText();
  const [proxy, setProxy] = useState(value?.proxyUrl || "");
  const [mirror, setMirror] = useState(value?.mirrorUrl || "");
  const [token, setToken] = useState("");
  const [clearToken, setClearToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const proxyRef = useRef(null);
  const hasToken = !!value?.hasGithubToken;
  useEffect(() => {
    try {
      proxyRef.current?.focus?.();
    } catch {
    }
  }, []);
  useEffect(() => {
    if (typeof document === "undefined" || !document.addEventListener)
      return void 0;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  async function save() {
    if (saving) return;
    const next = {};
    if (mirror.trim() !== (value?.mirrorUrl || ""))
      next.mirrorUrl = mirror.trim();
    if (proxy.trim() !== (value?.proxyUrl || "")) next.proxyUrl = proxy.trim();
    if (clearToken) next.clearGithubToken = true;
    else if (token.trim()) next.githubToken = token.trim();
    setSaving(true);
    setError("");
    try {
      const result = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "preferences", value: next })
      });
      assertMaintenanceResult(result);
      onSaved(result.update_preferences);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return h(
    "div",
    {
      className: "dshpp-updch-mask",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": tr("updch.title", "Update channel: proxy and GitHub token"),
      onClick: (e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }
    },
    h(
      "div",
      { className: "dshpp-updch-card" },
      h(
        "h4",
        { className: "dshpp-updch-title" },
        tr("updch.title", "Update channel: proxy and GitHub token")
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        tr(
          "updch.scope",
          "The proxy and token apply only to this plugin's update checks and downloads. They do not affect model-provider requests or the host process environment. Leave blank to inherit the existing update proxy environment."
        )
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, "GitHub mirror (optional)"),
        h("input", {
          type: "text",
          value: mirror,
          placeholder: "https://mirror.example/",
          onChange: (e) => setMirror(e.target.value),
          disabled: saving
        }),
        h(
          "small",
          null,
          "Used for queries and downloads without sending the GitHub token. Installation still retrieves official checksums from GitHub, optionally through the update proxy. Leave blank to disable the mirror."
        )
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, tr("updch.proxy", "Proxy URL")),
        h("input", {
          ref: proxyRef,
          type: "text",
          className: "dshpp-field dshpp-updch-field",
          "aria-label": tr("updch.proxy", "Proxy URL"),
          value: proxy,
          disabled: saving,
          placeholder: tr("updch.proxy.ph", "socks5://127.0.0.1:60808"),
          spellCheck: false,
          autoComplete: "off",
          onChange: (e) => setProxy(e.target.value)
        })
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        tr(
          "updch.proxy.hint",
          "Supports http://, https://, and socks5:// URLs, such as http://127.0.0.1:7890. Leave blank to inherit the existing update proxy environment."
        )
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, tr("updch.token", "GitHub token")),
        h("input", {
          type: "password",
          className: "dshpp-field dshpp-updch-field",
          "aria-label": tr("updch.token", "GitHub token"),
          value: token,
          disabled: saving || clearToken,
          placeholder: tr(
            "updch.token.ph",
            "Optional: increases the GitHub API quota. Leave blank to keep unchanged"
          ),
          spellCheck: false,
          autoComplete: "off",
          onChange: (e) => setToken(e.target.value)
        })
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        hasToken ? tr(
          "updch.token.set",
          "A token is configured on this machine. The field always starts empty; saving it empty preserves the token."
        ) : tr(
          "updch.token.unset",
          "No token is configured on this machine. Leave blank to keep it unset."
        )
      ),
      hasToken ? h(
        "label",
        { className: "dshpp-updch-check" },
        h("input", {
          type: "checkbox",
          checked: clearToken,
          disabled: saving,
          "aria-label": tr("updch.token.clear", "Clear the saved token"),
          onChange: (e) => setClearToken(!!e.target.checked)
        }),
        h("span", null, tr("updch.token.clear", "Clear the saved token"))
      ) : null,
      error ? h("p", { role: "alert" }, error) : null,
      h(
        "div",
        { className: "dshpp-updch-ops" },
        h(
          Btn,
          { disabled: saving, onClick: onClose },
          tr("updch.cancel", "Cancel")
        ),
        h(
          Btn,
          { kind: "primary", disabled: saving, onClick: save },
          saving ? tr("updch.saving", "Saving\u2026") : tr("updch.save", "Save")
        )
      )
    )
  );
}
var preferenceListeners = /* @__PURE__ */ new Set();
function publishPreferences(next) {
  for (const receive of preferenceListeners) receive(next);
}
function CommunityMaintenance({ localVersion = "" } = {}) {
  const [value, setValue] = useState(null), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false), [selected, setSelected] = useState(""), [releases, setReleases] = useState(null), [release, setRelease] = useState("");
  const [listState, setListState] = useState("loading"), [listError, setListError] = useState("");
  const [channelOpen, setChannelOpen] = useState(false);
  const tr = useText();
  const mounted = useRef(false), generation = useRef(0), running = useRef(false);
  const latestSave = useRef(null);
  const load = useCallback(async () => {
    const previousSave = latestSave.current;
    const request = ++generation.current;
    setListState("loading");
    setListError("");
    try {
      const result = await apiJson("/dsh-purge/community");
      assertMaintenanceResult(result);
      if (!Array.isArray(result.backups))
        throw new Error("Invalid backup list response");
      if (!mounted.current || request !== generation.current) return;
      setValue(
        previousSave === latestSave.current ? result : { ...result, update_preferences: latestSave.current }
      );
      setSelected(
        (current) => result.backups.some((b) => b.id === current) ? current : ""
      );
      setListState("ready");
    } catch (e) {
      if (!mounted.current || request !== generation.current) return;
      setListError(e.message);
      setListState("error");
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const receive = (next) => {
      latestSave.current = next;
      setValue(
        (current) => current && { ...current, update_preferences: next }
      );
    };
    preferenceListeners.add(receive);
    load();
    return () => {
      preferenceListeners.delete(receive);
      mounted.current = false;
      generation.current++;
    };
  }, [load]);
  async function run(op) {
    if (running.current) return;
    if (op === "rollback" && !window.confirm(
      "Roll back the Purge plugin and its entry points while preserving current prompts and settings? Restart the DSH process afterward; refreshing the browser alone will not load the updated backend. Continue?"
    ))
      return;
    if (op === "update" && !window.confirm(
      "Create a backup, then install the selected stable community release? Host patches will not be reapplied. Restart the DSH process afterward; refreshing the browser alone will not load the updated backend. Continue?"
    ))
      return;
    running.current = true;
    setBusy(true);
    setNotice("Working\u2026");
    try {
      const r = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, id: selected, ref: release })
      });
      assertMaintenanceResult(r);
      if (!mounted.current) return;
      if (op === "check") {
        if (!Array.isArray(r.versions))
          throw new Error("Invalid release list response");
        setReleases(r.versions.filter((v) => v.asset));
        setRelease(r.versions.find((v) => v.asset)?.ref || "");
        setNotice(
          r.degraded ? `${r.degraded}; ${r.stale ? "Showing a cached list. Try again later" : "Showing the fallback list"}` : r.error ? `Update check failed: ${r.error}` : r.hasUpdate ? `New version available: ${r.remoteVersion}` : "The latest stable version is installed"
        );
      } else {
        setNotice(maintenanceNotice(op, r));
      }
    } catch (e) {
      if (mounted.current)
        setNotice(
          e.message === "timeout" ? "The maintenance request timed out; the operation may still be running. Refresh the status before submitting again." : e.message
        );
    } finally {
      if (op !== "check" && mounted.current) await load();
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": "Community edition maintenance" },
    h(
      "div",
      { className: "dshpp-maint-head" },
      h("h3", null, "Maintenance: updates and local backups"),
      localVersion ? h(
        "span",
        { className: "dshpp-maint-ver" },
        "Local v" + localVersion,
        h("b", null, "Current")
      ) : null
    ),
    // Summarize proxy and token configuration without exposing the token.
    // The channel button sits beside the automatic update check control.
    value ? h(
      "p",
      { className: "dshpp-hint" },
      (value.update_preferences?.proxyUrl ? tr("updch.state.proxy", "Update channel proxy: ") + value.update_preferences.proxyUrl : tr(
        "updch.state.direct",
        "Update channel: inherited environment or system proxy"
      )) + " \xB7 " + (value.update_preferences?.hasGithubToken ? tr("updch.state.token.on", "GitHub token configured") : tr("updch.state.token.off", "No GitHub token configured"))
    ) : null,
    h(UpdatePreferences, {
      value: value?.update_preferences,
      status: value?.update_status,
      onSaved: publishPreferences,
      onOpenChannel: () => setChannelOpen(true)
    }),
    h(
      "div",
      { className: "dshpp-row" },
      h(
        Btn,
        { disabled: busy, onClick: () => run("check") },
        "Check for community updates"
      ),
      h(
        Btn,
        {
          disabled: busy,
          onClick: async () => {
            try {
              const r = await apiJson("/dsh-purge/audit?limit=10");
              const lines = (r.entries || []).map(
                (x) => `${new Date(x.at).toLocaleString()}  ${x.event}  ${JSON.stringify(
                  Object.fromEntries(
                    Object.entries(x).filter(
                      ([k]) => !["at", "event", "pid"].includes(k)
                    )
                  )
                )}`
              );
              setNotice(
                lines.length ? lines.join("\n") : "No actions recorded yet"
              );
            } catch (e) {
              setNotice(e.message);
            }
          }
        },
        "Recent actions"
      ),
      h(
        "a",
        {
          href: "https://github.com/kingcharleslzy-ai/dsh-purge/releases",
          target: "_blank",
          rel: "noreferrer"
        },
        "Release history"
      )
    ),
    releases?.length ? h(
      "div",
      { className: "dshpp-row" },
      h(
        "select",
        {
          "aria-label": "Select a community release",
          value: release,
          onChange: (e) => setRelease(e.target.value),
          disabled: busy
        },
        releases.map(
          (r) => h("option", { key: r.ref, value: r.ref }, r.label)
        )
      ),
      h(
        Btn,
        { disabled: busy || !release, onClick: () => run("update") },
        "Install selected version"
      )
    ) : null,
    h("h3", { style: { marginTop: 20 } }, "Local backups"),
    h(
      Btn,
      { disabled: busy || listState === "loading", onClick: load },
      "Refresh backups"
    ),
    listState === "loading" ? h("p", { role: "status" }, "Loading backups\u2026") : null,
    listState === "error" ? h("p", { role: "alert" }, `Failed to load backups: ${listError}`) : null,
    listState === "ready" && !value.backups.length ? h("p", { role: "status" }, "No backups yet") : null,
    h(
      "div",
      { className: "dshpp-row" },
      h(Btn, { disabled: busy, onClick: () => run("backup") }, "Back up now"),
      h(
        "select",
        {
          "aria-label": "Select a backup to restore",
          value: selected,
          onChange: (e) => setSelected(e.target.value),
          disabled: busy || listState !== "ready"
        },
        h("option", { value: "" }, "Select a backup"),
        ...(value?.backups || []).map(
          (b) => h(
            "option",
            { key: b.id, value: b.id },
            `${new Date(b.created_at).toLocaleString()} \xB7 ${b.plugins.map((p) => p.version).join(" / ")}`
          )
        )
      ),
      h(
        Btn,
        {
          disabled: busy || !selected || listState !== "ready",
          onClick: () => run("rollback")
        },
        "Roll back plugin"
      )
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      "Backups are stored locally. Rollback preserves current prompts, rules, and other plugin settings. Restart the DSH process after installation or rollback; refreshing the browser alone will not load the updated backend."
    ),
    notice ? h("p", { role: "status" }, notice) : null,
    // Fixed positioning lets the dialog escape its container without a portal.
    channelOpen && value ? h(UpdateChannelDialog, {
      value: value.update_preferences,
      onClose: () => setChannelOpen(false),
      onSaved: (next) => {
        publishPreferences(next);
        setNotice(
          tr(
            "updch.saved",
            "Update channel saved. It takes effect on the next update check."
          )
        );
      }
    }) : null
  );
}

// src/components/page.js
var TABS = [
  ["status", "Status", "Host compatibility, patches, and self-check"],
  ["prompt", "Prompts", "Prompt injection and boost"],
  ["rules", "Rules", "Rule sets and workspace policies"],
  ["skills", "Skills", "DSH skill directory"],
  ["drill", "Drill", "Red-team exercises and environment setup"],
  ["more", "More", "Conversation appearance and server settings"]
];
function PurgeGlyph({ size = 18 } = {}) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      "aria-hidden": true
    },
    h("path", { d: "M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z" }),
    h("path", { d: "M9.5 12.2l1.8 1.8 3.4-3.6" })
  );
}
function StatusStrip({ info }) {
  const t = useT();
  const compat = info?.compatibility || {};
  const level = compat.level || "";
  const ok = level === "qualified";
  return h(
    "div",
    { className: "dshpp-strip" },
    h(
      "span",
      { className: "dshpp-strip-item" },
      h("i", {
        className: "dshpp-dot " + (ok ? "is-ok" : level ? "is-warn" : "")
      }),
      "DSH ",
      h("b", null, compat.host_version || "\u2026")
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "Compatibility level ",
      h(
        "b",
        null,
        level ? compatibilityLevelText(t, level) : info?.ok === false ? "Failed to load" : "Checking"
      ),
      h(
        HelpTip,
        { title: "Compatibility level" },
        compat.message || "Determined from host component versions. Qualified means every patch anchor has been regression-tested against this DSH version."
      )
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "Patches written to disk ",
      h(
        "b",
        null,
        `${info?.patches_applied ?? "?"}/${info?.patches_total ?? "?"}`,
        info?.patches_na > 0 ? ` \xB7 ${info.patches_na} not applicable locally` : ""
      ),
      h(
        HelpTip,
        { title: "Host patches" },
        `Patches actually written into DSH host code; the denominator includes only locally applicable patches. Of ${info?.patches_total_all ?? "?"} patches, ${info?.patches_na ?? 0} target plugins or presets are not installed. Pending means the anchor exists but the patch has not been written. A mismatch means the host source changed and the anchor must be relocated.`
      )
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "Plugin ",
      h("b", null, info?.plugin_version || "1.7.18")
    )
  );
}
function LayoutNotice({ info }) {
  if (!info || !info.asar_still_sealed && !info.host_layout) return null;
  if (info.host_layout?.family === "tauri") {
    return h(
      "p",
      { className: "dshpp-note", role: "status" },
      info.host_layout.note
    );
  }
  const sealed = info.asar_still_sealed === true;
  const note = info.host_layout?.note || "app.asar remains on the target disk; the current process's load source is unconfirmed.";
  const handoff = info.asar_handoff ? ` Archive handoff: ${{ not_scheduled: "Not applied; click Apply to schedule the handoff", archive_reappeared: "The archive reappeared; the previous handoff record does not confirm current completion", backup_missing: "Original archive backup missing; check diagnostics", unknown_target: "Target instance unknown", unreadable: "Handoff record unreadable; check diagnostics", starting: "Helper starting; readiness unconfirmed", ready: "Helper ready", waiting_for_quit: "Waiting for a full exit (macOS Cmd+Q / Windows system tray)", waiting_for_unlock: "Waiting for the archive to unlock", moving: "Preserving the original archive", complete: "Handoff complete; open DSH manually", already_unsealed: "Archive already moved; open DSH manually", failed: "Failed; check diagnostics and follow the recovery documentation", expired: "Wait timed out; apply again or follow the recovery documentation", helper_stopped: "Helper exited unexpectedly; apply again or follow the recovery documentation" }[info.asar_handoff.phase] || info.asar_handoff.phase}.` : "";
  const failure = info.asar_handoff?.error;
  const detail = info.asar_handoff?.detail ? ` Details: ${info.asar_handoff.detail}${failure?.win32_code != null ? ` (Windows error ${failure.win32_code})` : ""}` : "";
  const layout = info.host_layout;
  if (info.ok !== false && info.surface === "web" && layout?.disk?.surface === "web" && layout.state === "unknown_runtime" && layout.process?.entry_layout === "unknown" && layout.process.matches_target === null && layout.disk.archive_exists === null && layout.disk.unpacked_exists === null && !info.desktop_exe && !info.desktop_install && !sealed && !layout.errors?.length && info.asar_handoff?.phase === "unknown_target" && !info.asar_handoff.error && !info.asar_handoff.detail) {
    return h(
      "details",
      { className: "dshpp-layout-details" },
      h("summary", null, "Archive handoff: not applicable (web host)"),
      h(
        "p",
        { className: "dshpp-note" },
        "Web services do not require desktop archive handoff. Raw diagnostics: ",
        layout.state,
        " / ",
        info.asar_handoff.phase
      )
    );
  }
  const confirmed = info.host_layout?.state === "unpacked_entry" && info.host_layout?.process?.matches_target === true && info.host_layout?.disk?.archive_exists === false;
  const diskNote = info.host_layout?.disk?.archive_exists === true ? " app.asar remains on the target disk." : "";
  if (sealed || !confirmed) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      note,
      diskNote,
      handoff,
      detail
    );
  }
  return h(
    "details",
    { className: "dshpp-layout-details" },
    h(
      "summary",
      null,
      "\u2713 Started from the unpacked directory (handoff complete)"
    ),
    h("p", { className: "dshpp-note" }, note, diskNote, handoff, detail)
  );
}
function VersionNotice({ info }) {
  if (info && info.ok === false) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      `Failed to read status: ${info.error || "API unavailable"}. Current host and patch states are unknown. Click Refresh to retry; if this persists, report your OS, DSH/plugin versions, and this error.`
    );
  }
  const backend = info?.plugin_version;
  if (!backend || backend === "1.7.18") return null;
  return h(
    "p",
    { className: "dshpp-warn", role: "status" },
    `Backend version ${backend}; UI ${"1.7.18"}. Settings may not work when these differ. Update both to the same version, then restart DSH.`
  );
}
function PurgePage() {
  const t = useT();
  const [tab, setTab] = useState("status");
  const [visited, setVisited] = useState({ status: true });
  const [info, setInfo] = useState(null);
  const select = (id) => {
    setTab(id);
    setVisited((v) => Object.assign({}, v, { [id]: true }));
  };
  const loadInfo = () => apiJson("/dsh-purge/status").then(setInfo).catch((error) => setInfo(unavailableStatus(error)));
  const mergeInfo = useCallback((s) => s && setInfo(s), []);
  useEffect(() => {
    if (tab === "status") loadInfo();
  }, [tab]);
  useEffect(() => {
    const phase = info?.asar_handoff?.phase;
    if (![
      "starting",
      "ready",
      "waiting_for_quit",
      "waiting_for_unlock",
      "moving"
    ].includes(phase))
      return;
    const timer = setInterval(loadInfo, 2e3);
    return () => clearInterval(timer);
  }, [info?.asar_handoff?.phase]);
  const active = TABS.find((row) => row[0] === tab) || TABS[0];
  return h(
    "div",
    { className: "dshpp-page" },
    h("style", null, base_default + native_default + page_default),
    h(
      "header",
      { className: "dshpp-page-head" },
      h("span", { className: "dshpp-page-glyph" }, h(PurgeGlyph, { size: 20 })),
      h(
        "div",
        { className: "dshpp-page-title" },
        h("h1", null, "Purge"),
        h(
          "p",
          null,
          active[2],
          true ? h(
            "span",
            { className: "dshpp-page-ver" },
            "Community 1.7.18"
          ) : null
        )
      )
    ),
    h(VersionNotice, { info }),
    h(LayoutNotice, { info }),
    h(
      "nav",
      { className: "dshpp-page-tabs", role: "tablist" },
      TABS.map(
        ([id, label]) => h(
          "button",
          {
            key: id,
            type: "button",
            role: "tab",
            "aria-selected": tab === id ? "true" : "false",
            className: tab === id ? "is-on" : "",
            onClick: () => select(id)
          },
          label
        )
      )
    ),
    h(
      "div",
      { className: "dshpp-page-body" },
      h(
        "div",
        { hidden: tab !== "status", className: "dshpp-sec" },
        h(StatusStrip, { info }),
        h(PurgifySection, { page: "status", onStatus: mergeInfo }),
        h(StatusExtras),
        h(CommunityMaintenance, { localVersion: info?.plugin_version || "" })
      ),
      h(
        "div",
        { hidden: tab !== "prompt", className: "dshpp-sec" },
        visited.prompt ? h(PurgifySection, { page: "prompt" }) : null
      ),
      h(
        "div",
        { hidden: tab !== "rules", className: "dshpp-sec" },
        visited.rules ? h(RulesSection) : null
      ),
      h(
        "div",
        { hidden: tab !== "skills", className: "dshpp-sec" },
        visited.skills ? h(SkillsSection) : null
      ),
      h(
        "div",
        { hidden: tab !== "more", className: "dshpp-sec" },
        tab === "more" ? h(RewindSetting) : null,
        visited.more ? h(PurgifySection, { page: "more" }) : null
      ),
      tab === "drill" ? h(
        "div",
        { className: "dshpp-sec dshpp-page-drill" },
        __dshPurgeDrill && __dshPurgeDrill.CSS ? h("style", { "data-dsh-purge-drill": "1" }, __dshPurgeDrill.CSS) : null,
        readDrillAuth() ? h(__dshPurgeDrill.Panel, { embedded: true }) : h(
          "div",
          { className: "dshpp-card" },
          h(
            "p",
            { className: "dshpp-muted" },
            "Complete the one-time authorization before using the drill console."
          ),
          h(
            Btn,
            {
              kind: "primary",
              onClick: () => {
                setDock({ tab: "drill", authOpen: true });
                requestDrill("auth");
              }
            },
            "Authorize"
          )
        )
      ) : null
    ),
    h(
      "footer",
      { className: "dshpp-page-foot" },
      true ? "Independently maintained, based on YuJunZhiXue/dsh-purge 1.1.71 \xB7 MIT \xB7 Original author credited" : "Independently maintained UI \xB7 Based on YuJunZhiXue/dsh-purge 1.1.71 (MIT)"
    )
  );
}

// src/assets/sidebar-glyph.png
var sidebar_glyph_default = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAIUUlEQVR42t1baWxVRRT+3uOxtNUWpAWLIkrFBRAlSsRYd0KVRUJ/uIQqVuqCUaNxQYMmRoQQYzRxCQTcFVSIwahEJURFRDEhGkVEDOK+YK0NINTSls8/303Gce599953b1s6yeTe9+bOnHO+OXPOLGcyJNFFqReAwQB2AujoKiaynUyvH4BxAGYD2ADgFz1n6/9+nQ1AJmUNyEio0QCuAlAHoDTg+90AXgLwLIBNANpTR4BkGnkgyVqSq0m28L9pD8nFJKeSPEbPxfrfTNenxNt/clIN9SJZRfIWkq/z/2mHhDyWZLFPG8UCrYVkG8mGAHrZ7gCAJ/TtJLc6hP6G5F0SOheyzQGq20yyvw/N50luIXmb6Bd1JgBFJM8Q8S0OobeRvJvkCDEbtf1HSXaQXO5TXuug2SztOjMOGPk+yEg1x/uMU5J8h+QlJMtjCN3PeK+U6pPkKMe3OZI/CqBPSb7p4GUPycdJni87FBuAw0hWy4i1WkSa9P9lYYlYgA4heQHJZeq9V0mOU3sdJL/3AfJy0f/VAK6C5DQJ3ewAZBHJsyRPaAAyJDc51OwRksNjqFkfkieTnENyA91pGskn9D49wDaQZH3A8PQM8a9W+5skVygABssS75Xajy9A6PkOZprU++eI4UEkT1XZdpK9He3Nl3b8HtKg9pOtWiQ5WiRXKACGGMyWRBC6jOQEkvPEqJl+JHkfyRMdAvYi+bO+u8fRbn/DNlwU4EZducTgYUgcAMry+OIyMbXSodbrSF5BcqRPr3q5Wt+3yZDa5Q+rfJ48DEmuEN2yPHOCskIBKHWUDyV5kyyxndZL6MF+Y85hb1ZLvec5yk9Sux0C8gVDG7z0qfgZ6qhfmjQAx1vEW0k+RfJs9V4moq04zmhrmAOcNRJ4ndHTJaq3xOGhTkgbgAliaIuMXEmBU9H71LtrHeCNNfg4KWCMT5TNaRN/kQCIuhxuBZADsB/A5wD2FrAOGwBgrpbkcwCYy9I+AFYDOADgIQCbfdrYC2ANgN/EV2va+wEZo16hewm3iumdDgFrAVQKgIUhZMha/HXbDREv5QBcqfc7pVFe6g3gYb0/DqCpJ+0IeWkSgGFS3ZetsnvV+z8AuL2nbYnZPfyK1fslAuCAdpLO7YkAHAmgSttdDziMWi2Av7VhuhbACwDO0rDpEQDU6vkPgMsBFFvlqwAcDuBBAH9qH/EDAF8DmJI0EF0BwAoA3wA4BMBj2hm+zgKiRa5xKIAG/VcF4A0An+XZWO32APwEYCSAGgBfAugPYLHcYYPF0z8AngJwhDRgt3aYyw92L9ChCcxYADcA+FYasRTARzKUZmrWxKkUwAIAOw52ALzUDmARgDE6D9gH4HR5A5PHjTKK3wG4vyfMA+y0D8DrsgNvA9hllN0hgABgepzp7sEAQBZAvfz/M8a6YJwxFb5G64/U3SDFCHzK0khHAZio9/f0HCj3BwDLATwd5qAralnWZ56eDZjDp5FmC/T18v0A8KJmgzsBXB/QKWH56xUWgD/kp+Eg+lcKQycH4Gq1uVg91QDgQpWfDGBPSE3+y/r/gHHoui8sAK0Atuu9r1X2tVGPCU6NvYnNmxJ4qX7PlAbkU/usxR8s/jc6wAnVk2f6fF+e4Fn+dG2ArNTvd9Rz6zQMECLmoNxHHo//tqheoMhHA9o0FR0kv5xEmmCsAear3d0ALg057geLny8cgnr8F0cFYLWeMxwTlw/F2KgEhD9aewP7Retm/X96CNX30ijx85YjoGKGJU9oAL5So65FxyeqV5MAAJcZvTxZz3sMIxwm1Ygfl5Clav+rqBEildpJ3eXYGR6ondzGPAce+XJfHVt1aEe3jeS7EWIJIPqNaqPCsSO8S3JU+rXhpwGNWrWVAqh2uML3ZHgmFND7lRqb7coHNO7bI9qPcvHzp1VWLf5/kjyRhkA7gOfE1CyH23lS7zcWAMBcPffLkp8XxKhP8ug/6XDLs8T/c4GgBqjXSCPo4FDH6at3AFoVU/2bjJOduTHaqFLd361AC4hfL5hjZNwIkd6GkFMc5fXGQWVU5quNo7VNEce9l1cExAtMUdnOfHYqH5FZMjDbHEz2FQGSHB2R+TnGkdWAGMKPNgTs6wil2Sa+6wuNERqkhkhysg9AQYENfnm8zhfHxhC+t+hR9O3yycbQLUoiSmyJXNR2R+xO1ginWRkjXiiO+1xphL1kHcEW28XvkqTC5IZYsTx2ebkMGknWpRzZWWeE2biCKablOw2OGyc43zBarqCJiQbhupSFp+i5Qmk8r3J/0oGSfYxxtzBEEGNdisLX+nzzmso/jjK8ojAxJkQgswnCjISEnxFC+IuNb8akGSq70CA0IgQIy31ifsPk/qqfT/gqY86/MO1Y4axUzLMHfrPAGsMw7iU5KSKdSarnGbwan++GG0FTy+JEkcfpmQpDuDYx4TeHWGdpw7EBTGZVvtwKtRsUQvgmkod0Zrh8WBAystiNhlAbSJ5mzCxz+m2G0TaqXiak8BVdcV/ABKElwCZ4i6eZxvckuVmRoZutMNqZjsWNmUcYt1AKEj6JGyMVllDXhYjhrTfWEDTm9PV5BIfaZ1LCJ3VlpoLk+wZjq0IscIrU04/qWRTiJskqg8b7SQif5J2hLMkFVgTp1JjLXHtlN9WKCF3QXe4MufIpxoyRuks0OQYQOdXbasUhn9Jdb43Z+wQN1hjfKt+eCyH4JMd9pFlJ9nraAHj5CC1JbSBqHEDk9L8t+FK10+3vDQblI409BfMe4V0kj9Jzh+URFqjeQXNxMkw+VEOj2efeUBPJawu9B9idATBdYL1xTeZn/S7qAl5SvzwdlIoVBdLkd3bfGelfIQ46gMinIh4AAAAASUVORK5CYII=";

// src/state/preset-menu.js
function bindPresetMenu(doc, listPresets) {
  let turn = 0;
  let cleanup = () => {
  };
  function open(event) {
    const trigger = event.target.closest?.('button[aria-haspopup="menu"]');
    const label = trigger?.querySelector('[class$="_seatLabel"]');
    if (!label || trigger.getAttribute("aria-expanded") !== "false") return;
    const prefix = [...label.classList].find((x) => x.endsWith("_seatLabel"))?.slice(0, -"_seatLabel".length);
    if (!prefix || !trigger.classList.contains(prefix + "_seat")) return;
    const revision = ++turn;
    cleanup();
    doc.defaultView.setTimeout(async () => {
      if (revision !== turn || trigger.getAttribute("aria-expanded") !== "true")
        return;
      const menus = [...doc.querySelectorAll('[role="menu"]')].filter(
        (menu2) => menu2.getElementsByClassName(prefix + "_itemName").length
      );
      if (menus.length !== 1) return;
      const menu = menus[0];
      let rows;
      try {
        rows = (await listPresets())?.value?.presets;
      } catch {
        return;
      }
      if (!Array.isArray(rows) || revision !== turn || !menu.isConnected || trigger.getAttribute("aria-expanded") !== "true")
        return;
      const hidden = /* @__PURE__ */ new Set();
      function restore(button) {
        button.disabled = false;
        button.removeAttribute("data-purge-collapsed-alias");
        hidden.delete(button);
      }
      function reconcile() {
        const rendered = /* @__PURE__ */ new Map();
        for (const button of menu.querySelectorAll('button[role="menuitem"]')) {
          const name2 = button.getElementsByClassName(prefix + "_itemName")[0]?.textContent;
          const description = button.getElementsByClassName(
            prefix + "_itemDesc"
          )[0]?.textContent;
          const matches = rows.filter(
            (row) => row.name === name2 && row.description === description
          );
          if (matches.length === 1) rendered.set(button, matches[0]);
        }
        const collapse = /* @__PURE__ */ new Set();
        for (const [button, row] of rendered) {
          const suffix = /^unrestricted-child-([a-f0-9]{10})$/.exec(
            row.id
          )?.[1];
          const compatMarker = " (Legacy compatibility \xB7 " + suffix + ")";
          const marker = compatMarker;
          if (!suffix || !row.name?.endsWith(marker) || row.broken !== void 0 || row.isDefault || row.name === label.textContent || button.contains(doc.activeElement) || button.disabled && !hidden.has(button))
            continue;
          const canonical = row.name.slice(0, -marker.length);
          if (canonical.endsWith(" \xB7 Subtask") && [...rendered.values()].some(
            (other) => /^unrestricted-child-[a-f0-9]{10}$/.test(other.id) && other.name === canonical && other.description === row.description && other.broken === void 0
          ))
            collapse.add(button);
        }
        for (const button of hidden) if (!collapse.has(button)) restore(button);
        for (const button of collapse) {
          button.disabled = true;
          button.setAttribute("data-purge-collapsed-alias", "");
          hidden.add(button);
        }
      }
      reconcile();
      const observer = new doc.defaultView.MutationObserver(() => {
        if (!menu.isConnected || trigger.getAttribute("aria-expanded") !== "true")
          cleanup();
        else reconcile();
      });
      observer.observe(menu, {
        childList: true,
        subtree: true,
        characterData: true
      });
      observer.observe(trigger, {
        attributes: true,
        attributeFilter: ["aria-expanded"]
      });
      observer.observe(doc.body, { childList: true });
      cleanup = () => {
        observer.disconnect();
        for (const button of hidden) restore(button);
        cleanup = () => {
        };
      };
    });
  }
  doc.addEventListener("click", open, true);
  return () => {
    turn++;
    cleanup();
    doc.removeEventListener("click", open, true);
  };
}

// src/state/legacy-visibility.js
var ENTRY_CSS = ".dshp-launch,.dshp-hero-chip,.dshp-tab-chip,.dshp-dock{display:none!important}";
function installLegacyVisibility(doc = globalThis.document) {
  if (!doc?.head) return () => {
  };
  const style = doc.createElement("style");
  style.setAttribute("data-dsh-purge-panel-visibility", "1");
  style.textContent = ENTRY_CSS;
  doc.head.append(style);
  return () => style.remove();
}

// src/components/rewind.js
var import_react_dom = require("react-dom");

// src/state/rewind-draft.js
var DRAFT_KEY = "dshp-rewind-draft:";
var ARM_KEY = "dshp-rewind-arm:";
var FILL_DELAYS = [0, 50, 180, 400, 800];
var ARM_TTL_MS = 45 * 1e3;
var seenAt = 0;
var host2 = null;
var workspace = null;
var conversation = null;
var pendingComposer = { sessionId: "", text: "", at: 0 };
var armedFill = { sessionId: "", text: "", at: 0 };
function storage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}
function bindRewindHost(ctx) {
  host2 = ctx || null;
  workspace = ctx && ctx.uiWorkspace || null;
  conversation = ctx && ctx.conversation || null;
}
function hostSessions() {
  return host2 && host2.sessions || null;
}
function getRewindSeenAt() {
  return seenAt;
}
function noteRewindAt(at) {
  if (at) seenAt = at;
}
function rewindText(t, key, fallback) {
  try {
    if (typeof t === "function") {
      const value = t(key);
      if (value && value !== key) return value;
    }
  } catch {
  }
  return fallback;
}
function currentSessionId(sessions) {
  try {
    const selected = workspace?.selection?.getSnapshot?.()?.sessionId;
    if (typeof selected === "string" && selected) return selected;
  } catch {
  }
  try {
    const snap = (sessions?.list || host2?.sessions?.list)?.getSnapshot?.();
    if (typeof snap?.current === "string" && snap.current) return snap.current;
  } catch {
  }
  return "";
}
function sessionKnown(sessions, sessionId) {
  try {
    const snap = sessions?.list?.getSnapshot?.();
    if (!snap || !sessionId) return false;
    if (snap.byId && Object.prototype.hasOwnProperty.call(snap.byId, sessionId))
      return true;
    if (Array.isArray(snap.ids) && snap.ids.includes(sessionId)) return true;
  } catch {
  }
  return false;
}
function waitMs(ms) {
  return new Promise((resolve) => {
    if (typeof window !== "undefined" && window.setTimeout)
      window.setTimeout(resolve, ms);
    else setTimeout(resolve, ms);
  });
}
function isPluginDraft(text) {
  const value = String(text || "").trim();
  if (!value) return false;
  return /^\[MNEMON\]/i.test(value) || /MNEMON RUNTIME MEMORY SNAPSHOT/i.test(value) || /^MNEMON VIEW TOOLS/im.test(value);
}
function writeDraft(sessionId, text) {
  if (!sessionId) return;
  const value = isPluginDraft(text) ? "" : text || "";
  pendingComposer = { sessionId, text: value, at: Date.now() };
  try {
    storage()?.setItem(DRAFT_KEY + sessionId, value);
  } catch {
  }
}
function peekDraft(sessionId) {
  if (!sessionId) return "";
  if (pendingComposer.sessionId === sessionId && pendingComposer.text)
    return pendingComposer.text;
  try {
    return storage()?.getItem(DRAFT_KEY + sessionId) || "";
  } catch {
    return "";
  }
}
function clearStoredDraft(sessionId) {
  if (!sessionId) return;
  if (pendingComposer.sessionId === sessionId)
    pendingComposer = { sessionId: "", text: "", at: 0 };
  try {
    storage()?.removeItem(DRAFT_KEY + sessionId);
  } catch {
  }
  try {
    storage()?.removeItem(ARM_KEY + sessionId);
  } catch {
  }
}
function armComposerFill(sessionId, text) {
  if (!sessionId || !text || isPluginDraft(text)) return;
  const at = Date.now();
  armedFill = { sessionId, text, at };
  writeDraft(sessionId, text);
  try {
    storage()?.setItem(ARM_KEY + sessionId, String(at));
  } catch {
  }
}
function takeArmedFill(sessionId) {
  if (!sessionId) return "";
  let text = "";
  let at = 0;
  if (armedFill.sessionId === sessionId && armedFill.text) {
    text = armedFill.text;
    at = armedFill.at;
  } else {
    text = peekDraft(sessionId);
    try {
      at = Number(storage()?.getItem(ARM_KEY + sessionId) || 0);
    } catch {
      at = 0;
    }
  }
  if (!text || !at || Date.now() - at > ARM_TTL_MS) {
    if (text && (!at || Date.now() - at > ARM_TTL_MS))
      clearStoredDraft(sessionId);
    return "";
  }
  clearStoredDraft(sessionId);
  armedFill = { sessionId: "", text: "", at: 0 };
  return text;
}
function conversationFace() {
  if (conversation) return conversation;
  if (host2?.conversation) return host2.conversation;
  if (typeof host2?.get === "function") {
    try {
      return host2.get("conversation");
    } catch {
      return void 0;
    }
  }
  return void 0;
}
function conversationInput(sessionId) {
  try {
    const input = conversationFace()?.input;
    if (!input || !sessionId) return null;
    if (typeof input.shell === "function") {
      try {
        return input.shell(sessionId);
      } catch {
      }
    }
    const sessions = host2?.sessions;
    const actx = typeof sessions?.scope === "function" ? sessions.scope(sessionId) : void 0;
    if (typeof input.for === "function" && actx) return input.for(actx);
    return null;
  } catch {
    return null;
  }
}
function liveDraft(sessionId, inputActions) {
  try {
    const fromActions = inputActions?.state?.getSnapshot?.()?.draft;
    if (typeof fromActions === "string") return fromActions;
  } catch {
  }
  try {
    const draft = conversationInput(sessionId)?.state?.getSnapshot?.()?.draft;
    if (typeof draft === "string") return draft;
  } catch {
  }
  return "";
}
function hostSetDraft(sessionId, text) {
  if (!sessionId) return false;
  try {
    const input = conversationInput(sessionId);
    if (input && typeof input.setDraft === "function") {
      input.setDraft(text || "");
      return true;
    }
  } catch {
  }
  return false;
}
function fillComposer(inputActions, text) {
  if (inputActions && typeof inputActions.setDraft === "function") {
    try {
      inputActions.setDraft(text || "");
    } catch {
    }
  }
}
function scheduleComposerFill(sessionId, text, inputActions) {
  if (!sessionId || !text || isPluginDraft(text)) return () => {
  };
  let stopped = false;
  let filled = false;
  const timers = [];
  const setTimer = typeof window !== "undefined" && window.setTimeout ? (fn, ms) => window.setTimeout(fn, ms) : (fn, ms) => setTimeout(fn, ms);
  const clearTimer = typeof window !== "undefined" && window.clearTimeout ? (id) => window.clearTimeout(id) : (id) => clearTimeout(id);
  const tryFill = () => {
    if (stopped) return;
    const current = liveDraft(sessionId, inputActions);
    if (filled && current !== text) {
      stopped = true;
      return;
    }
    if (current && current !== text) {
      stopped = true;
      return;
    }
    fillComposer(inputActions, text);
    hostSetDraft(sessionId, text);
    filled = true;
  };
  for (const ms of FILL_DELAYS) timers.push(setTimer(tryFill, ms));
  return () => {
    stopped = true;
    for (const id of timers) {
      try {
        clearTimer(id);
      } catch {
      }
    }
  };
}
function scheduleEchoClear(sessionId, inputActions) {
  if (!sessionId) return () => {
  };
  let last = "";
  let stopped = false;
  const timers = [];
  const setTimer = typeof window !== "undefined" && window.setTimeout ? (fn, ms) => window.setTimeout(fn, ms) : (fn, ms) => setTimeout(fn, ms);
  const clearTimer = typeof window !== "undefined" && window.clearTimeout ? (id) => window.clearTimeout(id) : (id) => clearTimeout(id);
  const tryClear = () => {
    if (stopped || !last) return;
    const current = String(liveDraft(sessionId, inputActions) || "").trim();
    if (!current) {
      stopped = true;
      return;
    }
    if (current !== last) return;
    fillComposer(inputActions, "");
    hostSetDraft(sessionId, "");
    clearStoredDraft(sessionId);
    stopped = true;
  };
  apiJson("/dsh-purge/last-user?sessionId=" + encodeURIComponent(sessionId)).then((data) => {
    if (stopped) return;
    last = String(data?.text || "").trim();
    if (!last || isPluginDraft(last)) return;
    tryClear();
    for (const ms of [0, 50, 180, 400]) timers.push(setTimer(tryClear, ms));
  }).catch(() => {
  });
  return () => {
    stopped = true;
    for (const id of timers) {
      try {
        clearTimer(id);
      } catch {
      }
    }
  };
}
async function dropInheritedQueue(sessions, sessionId) {
  if (!sessions || !sessionId) return;
  const drop = async () => {
    try {
      const actx = typeof sessions.scope === "function" ? sessions.scope(sessionId) : void 0;
      const face = typeof sessions.sessionOf === "function" ? sessions.sessionOf(actx) : void 0;
      const queue = face?.getSnapshot?.()?.queue || [];
      for (const item of queue) {
        const id = item?.id || item?.itemId;
        if (!id) continue;
        try {
          await face.updateQueue?.(id, { kind: "remove" });
        } catch {
        }
      }
    } catch {
    }
  };
  await drop();
  if (typeof window !== "undefined" && window.setTimeout)
    window.setTimeout(() => {
      drop();
    }, 80);
}
async function openRewoundSession(sessions, sessionId) {
  if (!sessionId) return;
  let lastError = null;
  for (let attempt = 0; attempt < 25; attempt += 1) {
    if (sessions && typeof sessions.refresh === "function" && !sessionKnown(sessions, sessionId)) {
      try {
        await sessions.refresh();
      } catch (error) {
        lastError = error;
      }
    }
    const known = sessionKnown(sessions, sessionId);
    if (known || typeof sessions?.open === "function") {
      try {
        if (workspace && typeof workspace.openSession === "function") {
          workspace.openSession(sessionId);
        } else if (typeof sessions?.open === "function") {
          sessions.open(sessionId);
        } else {
          throw new Error("Cannot open the restored session");
        }
        const selected = workspace?.selection?.getSnapshot?.()?.sessionId;
        if (!workspace || selected === sessionId) {
          await dropInheritedQueue(sessions, sessionId);
          if (typeof window !== "undefined" && window.setTimeout)
            window.setTimeout(() => {
              dropInheritedQueue(sessions, sessionId);
            }, 250);
          return;
        }
      } catch (error) {
        lastError = error;
      }
    }
    await waitMs(120);
  }
  throw new Error(
    lastError && lastError.message || "The restored session did not open"
  );
}

// src/components/rewind.js
var REWIND_CSS = `
.dshp-rewind-wrap{position:relative;display:inline-flex}
.dshp-rewind{appearance:none;display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,currentColor);font:12px/1 var(--ds-font-sans,system-ui,sans-serif);cursor:pointer}
.dshp-rewind:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,currentColor)}
.dshp-rewind:disabled{opacity:.4;cursor:default}
.dshp-rewind svg{display:block}
.dshp-rewind-menu{position:fixed;z-index:2147483000;box-sizing:border-box;width:max-content;min-width:min(220px,calc(100vw - 16px));max-width:calc(100vw - 16px);max-height:calc(100vh - 16px);overflow:auto;padding:4px;border:0;border-radius:12px;background:var(--dsw-specific-menu,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent,0 8px 24px rgba(0,0,0,.16));transform:translateY(-100%)}
body[data-ds-dark-theme] .dshp-rewind-menu{background:var(--dsw-specific-menu,#32312d);color:var(--dsw-alias-label-primary,#e6e2db);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1,#3f3d38);box-shadow:var(--dsw-elevation-prominent,0 10px 28px rgba(0,0,0,.45))}
.dshp-rewind-item{display:flex;flex-direction:column;gap:2px;width:100%;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer;font:12px/1.3 var(--ds-font-sans,system-ui,sans-serif)}
.dshp-rewind-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.dshp-rewind-item b{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}
.dshp-rewind-item span{color:var(--dsw-alias-label-tertiary,#9a958c);font-size:11px}
body[data-ds-dark-theme] .dshp-rewind-item span{color:var(--dsw-alias-label-tertiary,#a8a39a)}
`;
var RewindMenu = class extends Component {
  state = { position: null };
  reposition = () => {
    const { anchor, menuRef } = this.props;
    const menu = menuRef.current;
    if (!anchor || !menu) return;
    const rect = anchor.getBoundingClientRect();
    const size = menu.getBoundingClientRect();
    const win = anchor.ownerDocument.defaultView;
    const viewport = win.visualViewport;
    const x = viewport?.offsetLeft ?? 0;
    const y = viewport?.offsetTop ?? 0;
    const right = x + (viewport?.width ?? win.innerWidth);
    const bottom = y + (viewport?.height ?? win.innerHeight);
    const above = rect.top - 8 - size.height;
    const left = Math.max(
      x + 8,
      Math.min(rect.right - size.width, right - size.width - 8)
    );
    const top = Math.max(
      y + 8,
      Math.min(
        above >= y + 8 ? above : rect.bottom + 8,
        bottom - size.height - 8
      )
    );
    const prev = this.state.position;
    if (!prev || left !== prev.left || top !== prev.top)
      this.setState({ position: { left, top } });
  };
  componentDidMount() {
    const win = this.props.anchor?.ownerDocument?.defaultView;
    if (!win || typeof import_react_dom.createPortal !== "function") return;
    this.win = win;
    this.reposition();
    win.addEventListener("resize", this.reposition);
    win.addEventListener("scroll", this.reposition, true);
    win.visualViewport?.addEventListener("resize", this.reposition);
    win.visualViewport?.addEventListener("scroll", this.reposition);
    if (win.ResizeObserver) {
      this.observer = new win.ResizeObserver(this.reposition);
      this.observer.observe(this.props.anchor);
      this.observer.observe(this.props.menuRef.current);
    }
  }
  componentWillUnmount() {
    this.win?.removeEventListener("resize", this.reposition);
    this.win?.removeEventListener("scroll", this.reposition, true);
    this.win?.visualViewport?.removeEventListener("resize", this.reposition);
    this.win?.visualViewport?.removeEventListener("scroll", this.reposition);
    this.observer?.disconnect();
  }
  render() {
    const { t, menuRef, runRewind, anchor } = this.props;
    const body = anchor?.ownerDocument?.body;
    const portal = body && typeof import_react_dom.createPortal === "function";
    const style = portal ? {
      ...this.state.position,
      visibility: this.state.position ? "visible" : "hidden",
      transform: "none"
    } : {
      position: "absolute",
      right: 0,
      bottom: "calc(100% + 8px)",
      transform: "none"
    };
    const menu = rewindMenuNode(t, style, menuRef, runRewind);
    return portal ? (0, import_react_dom.createPortal)(menu, body) : menu;
  }
};
function rewindMenuNode(t, style, menuRef, runRewind) {
  return h(
    "div",
    {
      className: "dshp-rewind-menu",
      role: "menu",
      ref: menuRef,
      style
    },
    h(
      "button",
      {
        type: "button",
        className: "dshp-rewind-item",
        onMouseDown: (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          runRewind("once");
        }
      },
      h("b", null, rewindText(t, "rewind.once", "Undo once")),
      h(
        "span",
        null,
        rewindText(
          t,
          "rewind.once.hint",
          "Restore this turn's message to the input and remove the turn"
        )
      )
    ),
    h(
      "button",
      {
        type: "button",
        className: "dshp-rewind-item",
        onMouseDown: (e) => {
          e.preventDefault();
          e.stopPropagation();
        },
        onClick: (e) => {
          e.preventDefault();
          e.stopPropagation();
          runRewind("round");
        }
      },
      h("b", null, rewindText(t, "rewind.round", "Undo last round")),
      h(
        "span",
        null,
        rewindText(
          t,
          "rewind.round.hint",
          "Restore this turn's message to the input; undo only this turn for subagents too"
        )
      )
    )
  );
}
var RewindFallback = class extends Component {
  constructor(p) {
    super(p);
    this.state = { menu: false, busy: false, notice: "" };
    this.wrap = null;
    this.menuRef = { current: null };
    this.onDoc = (event) => {
      if (this.wrap && this.wrap.contains(event.target)) return;
      if (this.menuRef.current?.contains(event.target)) return;
      this.setState({ menu: false });
    };
  }
  componentDidMount() {
    if (typeof document !== "undefined" && document.addEventListener)
      document.addEventListener("mousedown", this.onDoc);
  }
  componentWillUnmount() {
    if (typeof document !== "undefined" && document.removeEventListener)
      document.removeEventListener("mousedown", this.onDoc);
  }
  run(mode) {
    const sessionId = this.props.sessionId || currentSessionId(hostSessions());
    if (!sessionId || this.state.busy) return;
    this.setState({ busy: true, menu: false, notice: "" });
    apiJson("/dsh-purge/rewind", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId, mode })
    }).then(async (data) => {
      if (!data || !data.ok || !data.sessionId || data.cleared === false) {
        throw new Error(
          data && data.error || "The previously sent content was not removed"
        );
      }
      noteRewindAt(data.at);
      const text = isPluginDraft(data.text) ? "" : data.text || "";
      armComposerFill(data.sessionId, text);
      await openRewoundSession(hostSessions(), data.sessionId);
      scheduleComposerFill(data.sessionId, text);
      this.setState({ busy: false });
    }).catch((e) => {
      this.setState({
        busy: false,
        notice: "Undo failed: " + String(e && e.message || e)
      });
    });
  }
  openMenu() {
    this.setState(({ menu }) => ({ menu: !menu, notice: "" }));
  }
  render() {
    const sessionId = this.props.sessionId || currentSessionId(hostSessions());
    const t = this.props.t || null;
    const label = this.state.busy ? "Undoing\u2026" : this.state.notice ? this.state.notice.slice(0, 18) : "Undo";
    return h(
      "div",
      {
        className: "dshp-rewind-wrap",
        ref: (node) => {
          this.wrap = node;
        }
      },
      h("style", null, REWIND_CSS),
      h(
        "button",
        {
          type: "button",
          className: "dshp-rewind",
          disabled: this.state.busy || !sessionId,
          onMouseDown: (e) => e.preventDefault(),
          onClick: (e) => {
            e.preventDefault();
            this.openMenu();
          }
        },
        label
      ),
      this.state.menu ? h(RewindMenu, {
        t,
        anchor: this.wrap,
        menuRef: this.menuRef,
        runRewind: (mode) => this.run(mode)
      }) : null
    );
  }
};
var RewindSafe = class extends Component {
  constructor(p) {
    super(p);
    this.state = { failed: false, visible: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error) {
    try {
      console.error("[dsh-purge] rewind slot:", error);
    } catch {
    }
  }
  componentDidMount() {
    this.unsubscribe = subscribeRewind((visible2) => this.setState({ visible: visible2 }));
    readRewindVisibility().catch(() => {
      if (false)
        this.setState({ visible: true });
    });
  }
  componentWillUnmount() {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }
  render() {
    return h(
      import_react.default.Fragment,
      null,
      !this.state.failed && h(RewindDraftSync, this.props),
      this.state.visible ? h(this.state.failed ? RewindFallback : RewindButton, this.props) : null
    );
  }
};
function RewindDraftSync({ sessionId: slotSession, inputActions }) {
  const sessionId = slotSession || currentSessionId(hostSessions());
  useEffect(() => {
    if (!sessionId) return;
    const armed = takeArmedFill(sessionId);
    if (armed) {
      scheduleComposerFill(sessionId, armed, inputActions);
      return;
    }
    scheduleEchoClear(sessionId, inputActions);
  }, [sessionId, inputActions]);
  return null;
}
function RewindButton(props) {
  const fallbackT = useT();
  const t = props.t || fallbackT;
  const sessions = hostSessions();
  const sessionId = props.sessionId || currentSessionId(sessions);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    if (typeof document === "undefined" || !document.addEventListener)
      return void 0;
    const onDoc = (event) => {
      if (wrapRef.current && wrapRef.current.contains(event.target)) return;
      if (menuRef.current && menuRef.current.contains(event.target)) return;
      setMenu(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);
  const runRewind = async (mode) => {
    if (!sessionId || busy) return;
    setBusy(true);
    setMenu(false);
    setNotice("");
    try {
      const data = await apiJson("/dsh-purge/rewind", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sessionId, mode })
      });
      if (!data || !data.ok || !data.sessionId || data.cleared === false) {
        throw new Error(
          data && data.error || "The previously sent content was not removed"
        );
      }
      noteRewindAt(data.at);
      const text = isPluginDraft(data.text) ? "" : data.text || "";
      armComposerFill(data.sessionId, text);
      await openRewoundSession(sessions, data.sessionId);
      scheduleComposerFill(data.sessionId, text);
    } catch (e) {
      const message = rewindText(
        t,
        "rewind.fail",
        "Undo failed: {error}"
      ).replace("{error}", String(e && e.message || e));
      setNotice(message);
    } finally {
      setBusy(false);
    }
  };
  const onClick = (event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (!sessionId || busy) return;
    if (menu) {
      setMenu(false);
      return;
    }
    setNotice("");
    setMenu(true);
  };
  const failLabel = notice ? notice.length > 18 ? notice.slice(0, 18) + "\u2026" : notice : "";
  const label = busy ? rewindText(t, "rewind.busy", "Undoing\u2026") : failLabel || rewindText(t, "rewind.label", "Undo");
  const title = notice || rewindText(t, "rewind.aria", "Undo");
  return h(
    "div",
    { className: "dshp-rewind-wrap", ref: wrapRef },
    h("style", null, REWIND_CSS),
    h(
      "button",
      {
        type: "button",
        className: "dshp-rewind",
        title,
        "aria-label": rewindText(t, "rewind.aria", "Undo"),
        "aria-expanded": menu ? "true" : "false",
        disabled: busy || !sessionId,
        onMouseDown: (e) => e.preventDefault(),
        onClick
      },
      h(
        "svg",
        {
          viewBox: "0 0 16 16",
          width: "14",
          height: "14",
          "aria-hidden": true
        },
        h("path", {
          fill: "currentColor",
          d: "M7.2 3.2 3.4 7l3.8 3.8V8.6c2.8 0 4.7.7 5.9 2.3-.2-2.8-1.9-5.2-5.9-5.6V3.2z"
        })
      ),
      label
    ),
    menu ? h(RewindMenu, { t, anchor: wrapRef.current, menuRef, runRewind }) : null
  );
}
function installRewindWatch(ctx) {
  const sessions = ctx && ctx.sessions || hostSessions();
  if (!sessions) return () => {
  };
  const tick = async () => {
    try {
      const data = await apiJson("/dsh-purge/rewind");
      if (!data || !data.sessionId || !data.at || data.at <= getRewindSeenAt())
        return;
      noteRewindAt(data.at);
      const current = currentSessionId(sessions);
      if (current && current !== data.parentId) return;
      const text = isPluginDraft(data.text) ? "" : data.text || "";
      armComposerFill(data.sessionId, text);
      scheduleComposerFill(data.sessionId, text);
      await openRewoundSession(sessions, data.sessionId);
      scheduleComposerFill(data.sessionId, text);
    } catch {
    }
  };
  const timer = typeof window !== "undefined" && window.setInterval ? window.setInterval(tick, 1200) : null;
  return () => {
    if (timer && typeof window !== "undefined" && window.clearInterval)
      window.clearInterval(timer);
  };
}
function installRewindUi(ctx) {
  bindRewindHost(ctx);
  ctx.slots.inject(
    "conversation.input.right",
    () => ctx.slots.register(
      {
        name: "conversation.input.right",
        id: "dsh-purge-rewind",
        order: 20,
        inject: (sessionId) => ({ sessionId, t: ctx.locale.bind(NS) })
      },
      RewindSafe
    )
  );
  ctx.effect(() => installRewindWatch(ctx), "dsh-purge: rewind watch");
}

// src/components/welcome.js
var rd3 = __toESM(require("react-dom"), 1);

// src/styles/welcome.css
var welcome_default = "/* The first-run dialog is rendered before any settings page. It must own its\r\n   styles and cannot depend on the optional drill vendor stylesheet. */\r\n.dshpp-welcome-mask {\r\n  position: fixed;\r\n  inset: 0;\r\n  z-index: 2147483000;\r\n  display: grid;\r\n  place-items: center;\r\n  padding: 24px;\r\n  overflow: auto;\r\n  box-sizing: border-box;\r\n  background: rgb(0 0 0 / 35%);\r\n  color: var(--dsw-alias-label-primary, #171717);\r\n  font-family: inherit;\r\n  font-size: 14px;\r\n  line-height: 1.6;\r\n  text-align: left;\r\n}\r\n.dshpp-welcome-card {\r\n  width: min(600px, 100%);\r\n  max-height: calc(100dvh - 48px);\r\n  overflow: auto;\r\n  box-sizing: border-box;\r\n  padding: 24px;\r\n  border: 1px solid var(--dsw-alias-border-l1, #ddd);\r\n  border-radius: 16px;\r\n  background: var(--dsw-alias-bg-layer-1, #fff);\r\n  box-shadow: 0 16px 64px rgb(0 0 0 / 18%);\r\n}\r\n.dshpp-welcome-card h2 {\r\n  margin: 0 0 6px;\r\n  font: inherit;\r\n  font-size: 20px;\r\n  font-weight: 600;\r\n}\r\n.dshpp-welcome-card h3 {\r\n  margin: 16px 0 6px;\r\n  font: inherit;\r\n  font-weight: 600;\r\n}\r\n.dshpp-welcome-lead {\r\n  color: var(--dsw-alias-label-secondary, #666);\r\n}\r\n.dshpp-welcome-warn {\r\n  margin: 16px 0;\r\n  padding: 12px;\r\n  border-radius: 8px;\r\n  background: var(--dsw-alias-bg-layer-2, #f5f5f5);\r\n}\r\n.dshpp-welcome-legal p {\r\n  margin: 10px 0;\r\n}\r\n.dshpp-welcome-legal a {\r\n  color: var(--dsw-alias-label-brand, #436ee8);\r\n  overflow-wrap: anywhere;\r\n}\r\n.dshpp-welcome-check {\r\n  display: flex;\r\n  align-items: flex-start;\r\n  gap: 10px;\r\n  margin-top: 20px;\r\n  cursor: pointer;\r\n}\r\n.dshpp-welcome-check input {\r\n  flex: 0 0 auto;\r\n  width: 16px;\r\n  height: 16px;\r\n  margin: 4px 0 0;\r\n  accent-color: var(--dsw-alias-label-brand, #436ee8);\r\n}\r\n.dshpp-welcome-ops {\r\n  display: flex;\r\n  justify-content: flex-end;\r\n  margin-top: 20px;\r\n}\r\n.dshpp-welcome-ops button {\r\n  min-height: 36px;\r\n  padding: 8px 16px;\r\n  border: 0;\r\n  border-radius: 8px;\r\n  background: var(--dsw-alias-label-primary, #171717);\r\n  color: var(--dsw-alias-bg-base, #fff);\r\n  font: inherit;\r\n  cursor: pointer;\r\n}\r\n.dshpp-welcome-ops button:disabled {\r\n  opacity: 0.4;\r\n  cursor: default;\r\n}\r\n.dshpp-welcome-ops button:focus-visible,\r\n.dshpp-welcome-check input:focus-visible {\r\n  outline: 2px solid var(--dsw-alias-label-brand, #436ee8);\r\n  outline-offset: 3px;\r\n}\r\n@media (max-height: 600px) {\r\n  .dshpp-welcome-mask {\r\n    padding: 12px;\r\n  }\r\n  .dshpp-welcome-card {\r\n    max-height: calc(100dvh - 24px);\r\n    padding: 18px;\r\n  }\r\n}\r\n\r\n/* Phone WebViews can put native navigation over the top-left of the page.\r\n   Reserve its row; keep a single scroll region for long notice text. */\r\n@media (max-width: 600px) and (min-height: 500px) {\r\n  .dshpp-welcome-mask {\r\n    padding: max(76px, env(safe-area-inset-top)) 12px\r\n      max(20px, env(safe-area-inset-bottom));\r\n    grid-template: minmax(0, 1fr) / minmax(0, 1fr);\r\n  }\r\n  .dshpp-welcome-card {\r\n    display: grid;\r\n    grid-template-rows: auto minmax(0, 1fr) auto auto;\r\n    max-height: 100%;\r\n    padding: 16px;\r\n  }\r\n  .dshpp-welcome-copy {\r\n    overflow: auto;\r\n    overscroll-behavior: contain;\r\n  }\r\n  .dshpp-welcome-check,\r\n  .dshpp-welcome-ops {\r\n    margin-top: 10px;\r\n  }\r\n}\r\n";

// src/components/welcome.js
var WELCOME_KEY = "dsh-purge-user-notice-v1";
function readWelcomeAck() {
  try {
    return window.localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return false;
  }
}
function writeWelcomeAck() {
  try {
    window.localStorage.setItem(WELCOME_KEY, "1");
  } catch {
  }
}
function WelcomeNotice(props = {}) {
  const t = useT();
  const [open, setOpen] = useState(() => !readWelcomeAck());
  const [checked, setChecked] = useState(false);
  if (!open) return null;
  const repo = props.repo || t("welcome.repo");
  const node = h(
    "div",
    {
      className: "dshpp-welcome-mask",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "dshpp-welcome-title"
    },
    h("style", null, welcome_default),
    h(
      "div",
      { className: "dshpp-welcome-card" },
      h("h2", { id: "dshpp-welcome-title" }, t("welcome.title")),
      h(
        "div",
        { className: "dshpp-welcome-copy", tabIndex: 0 },
        h("div", { className: "dshpp-welcome-lead" }, t("welcome.lead")),
        h("div", { className: "dshpp-welcome-warn" }, t("welcome.warn")),
        h(
          "div",
          { className: "dshpp-welcome-legal" },
          h("p", null, t("welcome.body")),
          h(
            "p",
            null,
            h(
              "a",
              {
                href: repo,
                target: "_blank",
                rel: "noopener noreferrer"
              },
              repo
            )
          ),
          h("h3", null, t("welcome.bans")),
          h("p", null, t("welcome.ban1")),
          h("p", null, t("welcome.ban2")),
          h("p", null, t("welcome.ban3"))
        )
      ),
      h(
        "div",
        { className: "dshpp-welcome-checks" },
        h(
          "label",
          { className: "dshpp-welcome-check" },
          h("input", {
            type: "checkbox",
            checked,
            onChange: (e) => setChecked(!!(e && e.target && e.target.checked))
          }),
          h("span", null, t("welcome.check"))
        )
      ),
      h(
        "div",
        { className: "dshpp-welcome-ops" },
        h(
          "button",
          {
            type: "button",
            className: "primary",
            disabled: !checked,
            onClick: () => {
              if (!checked) return;
              writeWelcomeAck();
              setOpen(false);
            }
          },
          t("welcome.ok")
        )
      )
    )
  );
  if (rd3?.createPortal && typeof document !== "undefined" && document.body)
    return rd3.createPortal(node, document.body);
  return node;
}

// src/state/redteam-mode.js
function isRedteamPresetId(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  if (text === "redteam") return true;
  if (/^red[\s_-]*team$/i.test(text)) return true;
  const label = text.replace(/not\s+red[\s_-]*team/gi, "").replace(/non[- ]?red[\s_-]*team/gi, "");
  if (/red[\s_-]*team/i.test(label)) return true;
  return false;
}
function readSessionAgentPreset(sess) {
  if (!sess || typeof sess !== "object") return "";
  try {
    const pv = sess.projectionValues;
    if (pv && typeof pv.agentPreset === "string") return pv.agentPreset;
  } catch {
  }
  try {
    if (typeof sess.agentPreset === "string") return sess.agentPreset;
  } catch {
  }
  try {
    const header = sess.header;
    if (header && typeof header.agentPreset === "string")
      return header.agentPreset;
  } catch {
  }
  return "";
}
function isRedteamModeActive() {
  try {
    const sessions = hostSessions();
    const sid = currentSessionId(sessions);
    if (sid && sessions) {
      try {
        const snap = typeof sessions.list?.getSnapshot === "function" ? sessions.list.getSnapshot() : null;
        const sess = snap && snap.byId ? snap.byId[sid] : null;
        if (isRedteamPresetId(readSessionAgentPreset(sess))) return true;
      } catch {
      }
      try {
        const actx = typeof sessions.scope === "function" ? sessions.scope(sid) : void 0;
        const face = typeof sessions.sessionOf === "function" ? sessions.sessionOf(actx) : void 0;
        const faceSnap = face && typeof face.getSnapshot === "function" ? face.getSnapshot() : face;
        if (isRedteamPresetId(readSessionAgentPreset(faceSnap))) return true;
      } catch {
      }
    }
  } catch {
  }
  if (typeof document === "undefined" || !document.querySelector) return false;
  try {
    const semantic = document.querySelector(
      "[data-agent-preset='redteam'], [data-preset-id='redteam'], [data-mode='redteam']"
    );
    if (semantic) return true;
    const nodes = document.querySelectorAll(
      "[class*='seat' i][class*='label' i], [class*='seatLabel' i], button[class*='seat' i], [role='button'][class*='seat' i]"
    );
    for (const el of nodes) {
      const text = String(el.textContent || "").replace(/\s+/g, " ").trim();
      if (/red ?team(?: mode)?/i.test(text) || /^RedTeam\b/i.test(text))
        return true;
    }
  } catch {
  }
  try {
    const labels = document.querySelectorAll(
      "[class*='label' i][class*='preset' i], [class*='presetLabel' i], [title*='Red Team' i], [title*='RedTeam']"
    );
    for (const el of labels) {
      const text = String(el.textContent || "").trim();
      if (/red ?team(?: mode)?/i.test(text) || /^RedTeam\b/i.test(text))
        return true;
      if (isRedteamPresetId(text)) return true;
    }
  } catch {
  }
  return false;
}
function looksLikeSendControl(el) {
  if (!el || el.nodeType !== 1) return false;
  const btn = el.closest("button, [role='button']");
  if (!btn) return false;
  if (btn.closest(".dshp-dock, .dshp-auth-mask, .rt-dock, .dshp-env-gate"))
    return false;
  const label = [
    btn.getAttribute("aria-label"),
    btn.getAttribute("title"),
    btn.getAttribute("data-testid"),
    btn.textContent
  ].filter(Boolean).join(" ");
  if (/\bStop\b/i.test(label) && !/\bSend\b/i.test(label))
    return false;
  if (/\bSubmit\b|Send(?!\s*feedback)/i.test(label)) return true;
  try {
    const card = btn.closest("[data-composer-card], [data-composer-seat]");
    if (card) {
      const cls = String(btn.className || "");
      if (/primary/i.test(cls) && btn.querySelector("svg")) return true;
    }
  } catch {
  }
  if (btn.type === "submit") {
    const form = btn.closest("form");
    if (form && form.querySelector("textarea, [contenteditable='true']"))
      return true;
  }
  return false;
}

// src/components/env-gate.js
function fetchEnvAdaptStatus() {
  return fetch(apiUrl("/redteam/api"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "platformEnvAdaptStatus" })
  }).then((r) => r.json()).catch(() => null);
}
function EnvironmentDialog({ title, onDismiss, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  return h(
    "dialog",
    {
      ref,
      className: "dshp-env-gate dshpp-env-dialog",
      "aria-label": title,
      onCancel: (event) => {
        event.preventDefault();
        onDismiss();
      }
    },
    h(
      "section",
      { className: "dshpp-auth-modal" },
      h("h2", null, title),
      children
    )
  );
}
function EnvAdaptSendGate() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [confirmSkip, setConfirmSkip] = useState(false);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const cacheRef = useRef({ at: 0, ready: false });
  const refresh = useCallback(async () => {
    const r = await fetchEnvAdaptStatus();
    const ready = !!(r && r.ready);
    cacheRef.current = {
      at: Date.now(),
      ready,
      skipped: !!(r && r.skipped)
    };
    setStatus(r);
    return r;
  }, []);
  const blockAndOpen = useCallback(() => {
    setConfirmSkip(false);
    refresh();
    if (!readDrillAuth()) {
      setOpen(false);
      requestDrillEnv();
      return true;
    }
    setOpen(true);
    return true;
  }, [refresh]);
  const mustBlockSubmit = useCallback(() => {
    if (!isRedteamModeActive()) return false;
    const cached = cacheRef.current;
    if (!cached.at || Date.now() - cached.at > 2500) {
      refresh().catch(() => {
      });
    }
    if (cached.ready) return false;
    blockAndOpen();
    return true;
  }, [blockAndOpen, refresh]);
  useEffect(() => {
    const patched = /* @__PURE__ */ new WeakMap();
    const patchedShells = [];
    const patchShell = (shell) => {
      if (!shell || patched.has(shell)) return;
      if (typeof shell.submit !== "function") return;
      const origSubmit = shell.submit;
      const origActionsSubmit = shell.actions && typeof shell.actions.submit === "function" ? shell.actions.submit : null;
      patched.set(shell, { origSubmit, origActionsSubmit });
      patchedShells.push(shell);
      const bound = origSubmit.bind(shell);
      shell.submit = function gatedSubmit(mode) {
        try {
          if (mustBlockSubmit()) return;
        } catch {
        }
        return bound(mode);
      };
      if (shell.actions && typeof shell.actions === "object") {
        shell.actions.submit = () => shell.submit("queue");
      }
    };
    const tick = () => {
      try {
        const sessions = hostSessions();
        const sid = currentSessionId(sessions);
        if (!sid) return;
        patchShell(conversationInput(sid));
      } catch {
      }
    };
    tick();
    const iv = typeof window !== "undefined" && window.setInterval ? window.setInterval(tick, 400) : null;
    return () => {
      if (iv && typeof window !== "undefined" && window.clearInterval)
        window.clearInterval(iv);
      for (const shell of patchedShells) {
        const info = patched.get(shell);
        if (!info) continue;
        try {
          shell.submit = info.origSubmit;
        } catch {
        }
        if (info.origActionsSubmit && shell.actions) {
          try {
            shell.actions.submit = info.origActionsSubmit;
          } catch {
          }
        }
      }
      patchedShells.length = 0;
    };
  }, [mustBlockSubmit]);
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      try {
        if (!isRedteamModeActive()) return;
      } catch {
        return;
      }
      refresh();
    };
    tick();
    const iv = typeof window !== "undefined" && window.setInterval ? window.setInterval(tick, 5e3) : null;
    return () => {
      alive = false;
      if (iv && typeof window !== "undefined" && window.clearInterval)
        window.clearInterval(iv);
    };
  }, [refresh]);
  useEffect(() => {
    if (typeof document === "undefined" || !document.addEventListener)
      return void 0;
    const onPointer = (e) => {
      if (!looksLikeSendControl(e.target)) return;
      if (!mustBlockSubmit()) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function")
        e.stopImmediatePropagation();
    };
    const onKey = (e) => {
      if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
      const target = e.target;
      const inComposer = target && target.closest && target.closest(
        "[data-composer-card], [data-composer-seat], [contenteditable='true'], textarea"
      );
      if (!inComposer) return;
      if (target.closest && target.closest(".dshp-dock, .dshp-auth-mask, .rt-dock, .dshp-env-gate"))
        return;
      if (!mustBlockSubmit()) return;
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === "function")
        e.stopImmediatePropagation();
    };
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("click", onPointer, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("click", onPointer, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [mustBlockSubmit]);
  if (!open) return null;
  const message = status && status.message || t("envGate.lead");
  return h(
    EnvironmentDialog,
    { title: t("envGate.title"), onDismiss: () => setOpen(false) },
    h("div", { style: { fontSize: 13, lineHeight: 1.55 } }, message),
    h(
      "div",
      {
        style: {
          fontSize: 12,
          color: "var(--dsw-alias-label-secondary,#999)",
          lineHeight: 1.5
        }
      },
      t("envGate.kaliHint")
    ),
    confirmSkip ? h("div", { className: "dshpp-auth-warn" }, t("envGate.skipConfirm")) : null,
    h(
      "div",
      { className: "dshpp-auth-ops" },
      confirmSkip ? [
        h(
          "button",
          {
            key: "no",
            type: "button",
            onClick: () => setConfirmSkip(false)
          },
          t("envGate.skipNo")
        ),
        h(
          "button",
          {
            key: "yes",
            type: "button",
            className: "primary",
            disabled: busy,
            onClick: () => {
              setBusy(true);
              fetch(apiUrl("/redteam/api"), {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  op: "platformEnvAdaptSkip",
                  skip: true
                })
              }).then((r) => r.json()).then((r) => {
                setBusy(false);
                cacheRef.current = {
                  at: Date.now(),
                  ready: true,
                  skipped: true
                };
                setStatus(r);
                setOpen(false);
                setConfirmSkip(false);
              }).catch(() => {
                setBusy(false);
                cacheRef.current = {
                  at: Date.now(),
                  ready: true,
                  skipped: true
                };
                setOpen(false);
              });
            }
          },
          t("envGate.skipYes")
        )
      ] : [
        h(
          "button",
          {
            key: "skip",
            type: "button",
            onClick: () => setConfirmSkip(true)
          },
          t("envGate.skip")
        ),
        h(
          "button",
          {
            key: "go",
            type: "button",
            className: "primary",
            onClick: () => {
              setOpen(false);
              requestDrillEnv();
            }
          },
          t("envGate.go")
        )
      ]
    )
  );
}

// src/entry.js
var name = true ? "dsh-purge-community" : "dsh-purge-panel";
var inject = ["slots", "locale"];
function PurgeIcon({ size = 20 } = {}) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      "aria-hidden": true
    },
    h("path", { d: "M4 7h16M4 17h16" }),
    h("circle", { cx: 9, cy: 7, r: 3, fill: "none" }),
    h("circle", { cx: 15, cy: 17, r: 3, fill: "none" })
  );
}
function PurgeGlyphIcon({ size = 16 } = {}) {
  const paint = {
    width: size,
    height: size,
    display: "block",
    backgroundColor: "currentColor",
    maskImage: `url("${sidebar_glyph_default}")`,
    WebkitMaskImage: `url("${sidebar_glyph_default}")`,
    maskSize: "contain",
    WebkitMaskSize: "contain",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskPosition: "center",
    WebkitMaskPosition: "center"
  };
  return h("span", { "aria-hidden": true, style: paint });
}
function DetailSettings({ view } = {}) {
  if (view === "summary")
    return h("span", null, "Purge \xB7 1.7.18");
  return h("div", { className: "dshpp-detail-settings" }, h(PurgePage));
}
function PanelOverlays() {
  const st = useDock();
  return h(
    import_react.default.Fragment,
    null,
    h("style", null, base_default),
    // Restored from 1.1.71 apply(): shell.overlay carried the welcome notice
    // and the red-team environment gate next to the dock.
    h(WelcomeNotice, {
      repo: true ? "https://github.com/kingcharleslzy-ai/dsh-purge" : void 0
    }),
    h(EnvAdaptSendGate),
    st.authOpen ? h(AuthGate, { pending: st.pending }) : null
  );
}
function apply(ctx) {
  ctx.effect(() => installLegacyVisibility(), "panel legacy visibility");
  ctx.inject(["sessions", "uiWorkspace"], (host3) => {
    host3.effect(() => bindSessionContext(host3), "panel session context");
  });
  ctx.inject(
    ["remote", "remote.agentPresets"],
    (host3) => host3.effect(
      () => bindPresetMenu(document, () => host3.remote.agentPresets.list()),
      "preset menu aliases"
    )
  );
  ctx.effect(startGrantSync, "panel grant sync");
  ctx.inject(
    ["sessions", "uiWorkspace", "conversation"],
    (host3) => installRewindUi(host3)
  );
  ctx.effect(() => ctx.locale.register(NS, { en }), "panel locale");
  const t = englishText;
  setTranslate(t);
  ctx.slots.inject(
    "shell.overlay",
    () => ctx.slots.register(
      {
        name: "shell.overlay",
        id: "dsh-purge-panel-overlays",
        order: 60
      },
      PanelOverlays
    )
  );
  ctx.slots.inject(
    "sidebar.panellist",
    () => ctx.slots.register(
      {
        name: "sidebar.panellist",
        id: "dsh-purge",
        order: 30,
        label: "Purge",
        inject: () => ({ t })
      },
      PurgeGlyphIcon
    )
  );
  ctx.slots.inject(
    "main",
    () => ctx.slots.register(
      {
        name: "main",
        key: "dsh-purge",
        inject: () => ({ t })
      },
      PurgePage
    )
  );
  ctx.slots.inject(
    "plugins.bundle.config",
    () => ctx.slots.register(
      {
        name: "plugins.bundle.config",
        key: true ? "dsh-purge-community" : "dsh-purge-panel",
        inject: () => ({ t })
      },
      DetailSettings
    )
  );
  ctx.slots.inject(
    "plugins.row.config",
    () => ctx.slots.register(
      {
        name: "plugins.row.config",
        key: name + "#" + (true ? "dsh-purge" : "dsh-purge-panel"),
        inject: () => ({ t })
      },
      DetailSettings
    )
  );
}

return module.exports;
}});})();
