// Generated from src/ by npm run build. Do not edit.
// Derived UI: YuJunZhiXue/dsh-purge (MIT), see LICENSE.
(()=>{const __PURGE_MODULE_URL__ = typeof document !== 'undefined' ? document.currentScript?.src : undefined;
window.__ModuleLoader__.load({id:"dsh-purge-panel",factory:(require)=>{
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
var base_default = '.dshpp-root {\n  --dshpp-display:\n    "Songti SC", "Noto Serif SC", "Iowan Old Style", Palatino,\n    "Palatino Linotype", Georgia, serif;\n  --dshpp-sans:\n    "Yu Gothic UI", "Hiragino Sans GB", "Source Han Sans SC", system-ui,\n    sans-serif;\n  --dshpp-mono: "Cascadia Mono", "Sarasa Mono SC", ui-monospace, monospace;\n  --dshpp-ease: cubic-bezier(0.16, 1, 0.3, 1);\n  max-width: 920px;\n  display: flex;\n  flex-direction: column;\n  gap: 18px;\n  padding: 16px;\n  border-radius: 12px;\n  background: var(--dshpp-bg);\n  color: var(--dshpp-ink);\n  font-family: var(--dshpp-sans);\n}\n.dshpp-root {\n  --dshpp-bg: transparent;\n  --dshpp-paper: color-mix(\n    in srgb,\n    var(--dsw-alias-bg-layer-1, #f6f4ef) 74%,\n    transparent\n  );\n  --dshpp-ink: var(--dsw-alias-label-primary, #1a1916);\n  --dshpp-mute: color-mix(\n    in srgb,\n    var(--dsw-alias-label-primary, #1a1916) 74%,\n    var(--dsw-alias-label-secondary, #5c564c)\n  );\n  --dshpp-line: color-mix(\n    in srgb,\n    var(--dsw-alias-border-l1, #c8c2b6) 78%,\n    transparent\n  );\n  --dshpp-fill: color-mix(\n    in srgb,\n    var(--dsw-alias-brand-primary, #6d8f78) 14%,\n    transparent\n  );\n  --dshpp-accent: var(--dsw-alias-brand-primary, #3f6b52);\n  --dshpp-accent-soft: color-mix(\n    in srgb,\n    var(--dsw-alias-brand-primary, #6d8f78) 18%,\n    transparent\n  );\n  --dshpp-ok: #1f7a45;\n  --dshpp-warn: #8a5a12;\n  --dshpp-bad: #9a3434;\n}\n.dshpp-root[data-theme="white"] {\n  color-scheme: light;\n}\n.dshpp-root[data-theme="dusk"] {\n  color-scheme: dark;\n  --dshpp-ok: #8fd0a8;\n  --dshpp-warn: #e4c48a;\n  --dshpp-bad: #f0b4b4;\n}\n.dshpp-toolbar {\n  display: flex;\n  align-items: center;\n  justify-content: flex-end;\n  gap: 8px;\n}\n.dshpp-switch {\n  display: inline-flex;\n  border: 1px solid var(--dshpp-line);\n  border-radius: 999px;\n  overflow: hidden;\n  background: var(--dshpp-paper);\n}\n.dshpp-switch button {\n  appearance: none;\n  border: 0;\n  background: transparent;\n  color: var(--dshpp-mute);\n  font: 12px/1 var(--dshpp-sans);\n  padding: 6px 14px;\n  cursor: pointer;\n}\n.dshpp-switch button.is-on {\n  background: var(--dshpp-accent-soft);\n  color: var(--dshpp-ink);\n}\n.dshpp-switch button:focus-visible {\n  outline: 2px solid var(--dshpp-accent);\n  outline-offset: -2px;\n}\n.dshpp-panel {\n  border: 1px solid var(--dshpp-line);\n  background: var(--dshpp-paper);\n  border-radius: 10px;\n  padding: 18px 18px 16px;\n}\n.dshpp-kicker {\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  letter-spacing: 0.14em;\n  text-transform: uppercase;\n  color: var(--dshpp-mute);\n  margin: 0 0 4px;\n}\n.dshpp-title {\n  font-family: var(--dshpp-display);\n  font-size: 20px;\n  font-weight: 500;\n  letter-spacing: 0.02em;\n  line-height: 1.3;\n  margin: 0;\n  color: var(--dshpp-ink);\n}\n.dshpp-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 12px;\n  margin-bottom: 14px;\n  flex-wrap: wrap;\n}\n.dshpp-sub {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  margin: 20px 0 10px;\n}\n.dshpp-sub h4 {\n  margin: 0;\n  font-family: var(--dshpp-display);\n  font-size: 15px;\n  font-weight: 500;\n}\n.dshpp-metrics {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 8px;\n  margin-bottom: 14px;\n}\n.dshpp-metric {\n  border: 1px solid var(--dshpp-line);\n  background: var(--dshpp-bg);\n  padding: 12px;\n  min-height: 68px;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  border-radius: 8px;\n}\n.dshpp-metric b {\n  font-family: var(--dshpp-display);\n  font-size: 18px;\n  font-weight: 500;\n  line-height: 1.2;\n}\n.dshpp-metric span {\n  font-size: 11px;\n  color: var(--dshpp-mute);\n}\n.dshpp-bar {\n  height: 3px;\n  border-radius: 99px;\n  background: var(--dshpp-line);\n  overflow: hidden;\n  margin: 8px 0 14px;\n}\n.dshpp-bar > i {\n  display: block;\n  height: 100%;\n  background: var(--dshpp-accent);\n  width: 0;\n  transition: width 0.4s var(--dshpp-ease);\n}\n.dshpp-group {\n  border: 1px solid var(--dshpp-line);\n  margin: 0 0 8px;\n  background: var(--dshpp-bg);\n  border-radius: 8px;\n  overflow: hidden;\n}\n.dshpp-group-h {\n  width: 100%;\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  padding: 9px 12px;\n  border: 0;\n  background: transparent;\n  color: inherit;\n  cursor: pointer;\n  font: inherit;\n  text-align: left;\n}\n.dshpp-group-h:hover {\n  background: var(--dshpp-fill);\n}\n.dshpp-group-h:focus-visible {\n  outline: 2px solid var(--dshpp-accent);\n  outline-offset: -2px;\n}\n.dshpp-group-h strong {\n  font-family: var(--dshpp-display);\n  font-size: 14px;\n  font-weight: 500;\n}\n.dshpp-group-h em {\n  font-style: normal;\n  font-size: 12px;\n  color: var(--dshpp-mute);\n  flex: 1;\n}\n.dshpp-count {\n  font-family: var(--dshpp-mono);\n  font-size: 12px;\n  color: var(--dshpp-mute);\n}\n.dshpp-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 12.5px;\n}\n.dshpp-table th {\n  text-align: left;\n  font-weight: 500;\n  font-size: 11px;\n  letter-spacing: 0.06em;\n  color: var(--dshpp-mute);\n  padding: 7px 12px;\n  border-bottom: 1px solid var(--dshpp-line);\n}\n.dshpp-table td {\n  padding: 8px 12px;\n  border-bottom: 1px solid var(--dshpp-line);\n  vertical-align: middle;\n}\n.dshpp-table tr:last-child td {\n  border-bottom: 0;\n}\n.dshpp-table tr.is-on td {\n  background: var(--dshpp-accent-soft);\n}\n.dshpp-id {\n  font-family: var(--dshpp-mono);\n  opacity: 0.75;\n  width: 42px;\n}\n.dshpp-actions {\n  text-align: right;\n  white-space: nowrap;\n}\n.dshpp-row {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.dshpp-row + .dshpp-row {\n  margin-top: 10px;\n}\n.dshpp-pill {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  padding: 2px 8px;\n  border: 1px solid var(--dshpp-line);\n  border-radius: 99px;\n  line-height: 1.6;\n  background: var(--dshpp-bg);\n}\n.dshpp-pill::before {\n  content: "";\n  width: 6px;\n  height: 6px;\n  border-radius: 50%;\n  background: currentColor;\n}\n.dshpp-pill.is-ok {\n  color: var(--dshpp-ok);\n  border-color: color-mix(in srgb, var(--dshpp-ok) 30%, var(--dshpp-line));\n}\n.dshpp-pill.is-wait {\n  color: var(--dshpp-warn);\n  border-color: color-mix(in srgb, var(--dshpp-warn) 30%, var(--dshpp-line));\n}\n.dshpp-pill.is-miss {\n  color: var(--dshpp-mute);\n}\n.dshpp-pill.is-bad {\n  color: var(--dshpp-bad);\n}\n.dshpp-btn {\n  appearance: none;\n  font-family: var(--dshpp-sans);\n  font-size: 13px;\n  font-weight: 500;\n  min-height: 34px;\n  padding: 0 14px;\n  border-radius: 8px;\n  border: 1px solid transparent;\n  cursor: pointer;\n  transition:\n    background 0.15s var(--dshpp-ease),\n    opacity 0.15s var(--dshpp-ease);\n}\n.dshpp-btn:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n.dshpp-btn:focus-visible {\n  outline: 2px solid var(--dshpp-accent);\n  outline-offset: 2px;\n}\n.dshpp-btn-primary {\n  background: var(--dshpp-accent-soft);\n  color: var(--dshpp-ink);\n  border-color: color-mix(in srgb, var(--dshpp-accent) 35%, var(--dshpp-line));\n}\n.dshpp-btn-primary:hover:not(:disabled) {\n  background: color-mix(in srgb, var(--dshpp-accent) 22%, var(--dshpp-bg));\n}\n.dshpp-btn-ghost {\n  background: transparent;\n  color: var(--dshpp-ink);\n  border-color: var(--dshpp-line);\n}\n.dshpp-btn-danger {\n  background: transparent;\n  color: var(--dshpp-bad);\n  border-color: color-mix(in srgb, var(--dshpp-bad) 40%, var(--dshpp-line));\n}\n.dshpp-btn-solid-danger {\n  background: color-mix(in srgb, var(--dshpp-bad) 16%, var(--dshpp-bg));\n  color: var(--dshpp-bad);\n  border-color: color-mix(in srgb, var(--dshpp-bad) 30%, var(--dshpp-line));\n}\n.dshpp-btn-tiny {\n  min-height: 28px;\n  padding: 0 10px;\n  font-size: 12px;\n}\n.dshpp-field,\n.dshpp-area {\n  width: 100%;\n  box-sizing: border-box;\n  font: 13px/1.55 var(--dshpp-mono);\n  padding: 8px 10px;\n  background: var(--dshpp-bg);\n  color: var(--dshpp-ink);\n  border: 1px solid var(--dshpp-line);\n  border-radius: 8px;\n}\n.dshpp-field {\n  width: auto;\n  min-width: 140px;\n}\n.dshpp-cr-row {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  margin: 8px 0 0;\n  font-size: 13px;\n}\n.dshpp-cr-row label {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  color: var(--dshpp-ink);\n}\n.dshpp-cr-num {\n  width: 64px;\n  min-width: 64px;\n  height: 28px;\n  padding: 0 8px;\n}\n.dshpp-cr-text {\n  width: 120px;\n  min-width: 88px;\n  height: 28px;\n  padding: 0 8px;\n}\n.dshpp-ver {\n  width: 100%;\n  min-width: 0;\n  max-width: none;\n  height: 32px;\n  padding: 0 10px;\n  font-size: 12px;\n}\n.dshpp-rel {\n  margin: 0 0 14px;\n}\n.dshpp-now {\n  display: flex;\n  align-items: baseline;\n  gap: 8px;\n  flex-wrap: wrap;\n  margin: 0 0 4px;\n}\n.dshpp-now-label {\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  letter-spacing: 0.12em;\n  text-transform: uppercase;\n  color: var(--dshpp-mute);\n}\n.dshpp-now-ver {\n  font-family: var(--dshpp-display);\n  font-size: 20px;\n  font-weight: 500;\n  letter-spacing: 0.01em;\n}\n.dshpp-now-mark {\n  display: inline-flex;\n  align-items: center;\n  margin-left: 6px;\n  padding: 1px 7px;\n  border-radius: 99px;\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  font-style: normal;\n  font-weight: 500;\n  line-height: 1.5;\n  color: var(--dshpp-ok);\n  border: 1px solid color-mix(in srgb, var(--dshpp-ok) 38%, var(--dshpp-line));\n  background: color-mix(in srgb, var(--dshpp-ok) 14%, var(--dshpp-bg));\n}\n.dshpp-editions {\n  display: flex;\n  flex-direction: column;\n  margin: 10px 0 0;\n  border-top: 1px solid var(--dshpp-line);\n}\n.dshpp-edition {\n  display: grid;\n  grid-template-columns: auto minmax(0, 1fr) auto;\n  align-items: center;\n  gap: 10px;\n  padding: 10px 0;\n  border-bottom: 1px solid var(--dshpp-line);\n}\n.dshpp-edition-name {\n  display: inline-flex;\n  align-items: center;\n  gap: 0;\n  font-family: var(--dshpp-display);\n  font-size: 15px;\n  font-weight: 500;\n  white-space: nowrap;\n}\n.dshpp-edition.is-on .dshpp-edition-name {\n  color: var(--dshpp-ink);\n}\n.dshpp-edition:not(.is-on) .dshpp-edition-name {\n  color: var(--dshpp-mute);\n}\n.dshpp-edition .dshpp-btn {\n  min-width: 118px;\n}\n.dshpp-rel .dshpp-notice {\n  display: block;\n  margin-top: 8px;\n  min-height: 16px;\n}\n@media (max-width: 560px) {\n  .dshpp-edition {\n    grid-template-columns: 1fr auto;\n    grid-template-areas: "name btn" "sel sel";\n  }\n  .dshpp-edition-name {\n    grid-area: name;\n  }\n  .dshpp-edition .dshpp-ver {\n    grid-area: sel;\n  }\n  .dshpp-edition .dshpp-btn {\n    grid-area: btn;\n  }\n}\n.dshpp-area {\n  min-height: 220px;\n  resize: vertical;\n}\n.dshpp-field:focus,\n.dshpp-area:focus {\n  outline: none;\n  border-color: var(--dshpp-accent);\n  box-shadow: 0 0 0 3px var(--dshpp-accent-soft);\n}\n.dshpp-field:disabled,\n.dshpp-area:disabled {\n  opacity: 0.5;\n}\n.dshpp-ask {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  margin-top: 10px;\n  padding: 10px 12px;\n  border: 1px solid var(--dshpp-line);\n  border-radius: 8px;\n  background: var(--dshpp-bg);\n  font-size: 13px;\n}\n.dshpp-modal-bg {\n  position: fixed;\n  inset: 0;\n  z-index: 80;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  background: color-mix(in srgb, var(--dshpp-ink) 28%, transparent);\n}\n.dshpp-modal {\n  width: min(420px, 100%);\n  background: var(--dshpp-paper);\n  color: var(--dshpp-ink);\n  border: 1px solid var(--dshpp-line);\n  border-radius: 12px;\n  padding: 20px 20px 16px;\n  box-shadow: 0 16px 40px color-mix(in srgb, var(--dshpp-ink) 18%, transparent);\n}\n.dshpp-modal h4 {\n  margin: 0 0 8px;\n  font-family: var(--dshpp-display);\n  font-size: 18px;\n  font-weight: 500;\n}\n.dshpp-modal p {\n  margin: 0 0 16px;\n  font-size: 13.5px;\n  line-height: 1.55;\n}\n.dshpp-modal-ops {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n}\n.dshpp-restart-mask {\n  position: fixed;\n  inset: 0;\n  z-index: 12000;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 24px;\n  background: rgba(0, 0, 0, 0.62);\n  font-family:\n    "Yu Gothic UI", "Hiragino Sans GB", "Source Han Sans SC",\n    "Microsoft YaHei UI", system-ui, sans-serif;\n}\n.dshpp-restart-card {\n  width: min(420px, 100%);\n  box-sizing: border-box;\n  padding: 22px 22px 18px;\n  border-radius: 14px;\n  background: var(--dsw-alias-bg-layer-1, #fffcf7);\n  color: var(--dsw-alias-label-primary, #16140f);\n  border: 1px solid var(--dsw-alias-border-l1, #c9c3b6);\n  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);\n}\n.dshpp-restart-card h4 {\n  margin: 0 0 10px;\n  font-family: inherit;\n  font-size: 20px;\n  font-weight: 650;\n  line-height: 1.35;\n  color: inherit;\n}\n.dshpp-restart-card p {\n  margin: 0 0 18px;\n  font-size: 16px;\n  font-weight: 500;\n  line-height: 1.65;\n  color: inherit;\n}\n.dshpp-restart-card .dshpp-modal-ops {\n  display: flex;\n  justify-content: flex-end;\n  gap: 10px;\n}\n.dshpp-restart-card .dshpp-btn {\n  min-height: 38px;\n  padding: 0 16px;\n  font-size: 15px;\n  font-weight: 650;\n  color: var(--dsw-alias-label-primary, #16140f);\n  background: var(--dsw-alias-bg-layer-2, #fff);\n  border: 1px solid var(--dsw-alias-border-l1, #c9c3b6);\n}\n.dshpp-restart-card .dshpp-btn-primary,\n.dshpp-restart-card .dshpp-btn-primary:hover:not(:disabled) {\n  color: #fff;\n  background: #2f6b4f;\n  border-color: #2f6b4f;\n}\nbody[data-ds-dark-theme] .dshpp-restart-card,\n.dshpp-restart-mask[data-theme="dusk"] .dshpp-restart-card {\n  background: #1c1e24;\n  color: #f4f1ea;\n  border-color: #5a5e68;\n}\nbody[data-ds-dark-theme] .dshpp-restart-card .dshpp-btn,\n.dshpp-restart-mask[data-theme="dusk"] .dshpp-restart-card .dshpp-btn {\n  color: #f4f1ea;\n  background: #2a2d34;\n  border-color: #5a5e68;\n}\nbody[data-ds-dark-theme] .dshpp-restart-card .dshpp-btn-primary,\nbody[data-ds-dark-theme]\n  .dshpp-restart-card\n  .dshpp-btn-primary:hover:not(:disabled),\n.dshpp-restart-mask[data-theme="dusk"] .dshpp-restart-card .dshpp-btn-primary,\n.dshpp-restart-mask[data-theme="dusk"]\n  .dshpp-restart-card\n  .dshpp-btn-primary:hover:not(:disabled) {\n  color: #fff;\n  background: #3d8f68;\n  border-color: #3d8f68;\n}\n.dshpp-notice {\n  font-size: 12.5px;\n  line-height: 1.4;\n}\n.dshpp-notice.is-ok {\n  color: var(--dshpp-ok);\n}\n.dshpp-notice.is-bad {\n  color: var(--dshpp-bad);\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n.dshpp-skel {\n  height: 12px;\n  border-radius: 6px;\n  background: linear-gradient(\n    90deg,\n    var(--dshpp-fill),\n    var(--dshpp-line),\n    var(--dshpp-fill)\n  );\n  background-size: 200% 100%;\n  animation: dshpp-pulse 1.2s ease-in-out infinite;\n}\n.dshpp-active {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  padding: 10px 12px;\n  margin-bottom: 12px;\n  border: 1px solid var(--dshpp-line);\n  background: var(--dshpp-bg);\n  border-radius: 8px;\n}\n.dshpp-active b {\n  font-family: var(--dshpp-display);\n  font-weight: 500;\n}\n.dshpp-empty {\n  padding: 28px 12px;\n  font-size: 13px;\n  color: var(--dshpp-mute);\n  text-align: center;\n}\n.dshpp-split {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n.dshpp-rulelist {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--dshpp-line);\n  border-radius: 8px;\n  background: var(--dshpp-bg);\n  overflow: hidden;\n}\n.dshpp-rulebody {\n  max-height: 240px;\n  overflow: auto;\n}\n.dshpp-ruleitem {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  width: 100%;\n  padding: 10px 12px;\n  border: 0;\n  border-bottom: 1px solid var(--dshpp-line);\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  text-align: left;\n  cursor: pointer;\n}\n.dshpp-ruleitem:hover {\n  background: var(--dshpp-fill);\n}\n.dshpp-ruleitem.is-edit {\n  background: var(--dshpp-accent-soft);\n}\n.dshpp-rule-main {\n  flex: 1;\n  min-width: 0;\n}\n.dshpp-rule-name {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-family: var(--dshpp-display);\n  font-size: 14px;\n  line-height: 1.35;\n}\n.dshpp-rule-meta {\n  display: block;\n  margin-top: 3px;\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  color: var(--dshpp-mute);\n}\n.dshpp-rule-ops {\n  display: flex;\n  flex-direction: row;\n  align-items: center;\n  gap: 6px;\n  flex-shrink: 0;\n}\n.dshpp-create {\n  display: flex;\n  flex-direction: column;\n  gap: 6px;\n  padding: 10px 12px;\n  border-top: 1px solid var(--dshpp-line);\n  background: var(--dshpp-paper);\n}\n.dshpp-create-row {\n  display: flex;\n  gap: 6px;\n  align-items: center;\n}\n.dshpp-create .dshpp-field {\n  flex: 1;\n  min-width: 0;\n  width: auto;\n}\n.dshpp-editor {\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  min-width: 0;\n  border: 1px solid var(--dshpp-line);\n  border-radius: 8px;\n  background: var(--dshpp-bg);\n  padding: 12px;\n  min-height: 320px;\n}\n.dshpp-editor .dshpp-area {\n  flex: 1;\n  min-height: 240px;\n}\n.dshpp-editor-empty {\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  color: var(--dshpp-mute);\n  font-size: 13px;\n  min-height: 160px;\n}\n.dshpp-block {\n  padding: 14px 0;\n  border-top: 1px solid var(--dshpp-line);\n}\n.dshpp-block-head {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  margin: 0 0 8px;\n}\n.dshpp-block-head h4 {\n  margin: 0;\n  font-family: var(--dshpp-display);\n  font-size: 14px;\n  font-weight: 500;\n  flex: 1;\n  color: var(--dshpp-ink);\n}\n.dshpp-block-hint {\n  margin: 8px 0 0;\n  font-size: 12px;\n  line-height: 1.55;\n  color: var(--dshpp-mute);\n}\n.dshpp-policy-row {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n}\n.dshpp-policy-row > label {\n  font-size: 12px;\n  color: var(--dshpp-mute);\n  flex: 0 0 auto;\n}\n.dshpp-cwd-path {\n  margin: 0 0 8px;\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  color: var(--dshpp-mute);\n  word-break: break-all;\n  line-height: 1.5;\n}\n.dshpp-cwd-list {\n  display: flex;\n  flex-direction: column;\n  border: 1px solid var(--dshpp-line);\n  border-radius: 8px;\n  background: var(--dshpp-bg);\n  overflow: hidden;\n}\n.dshpp-cwd-item {\n  display: flex;\n  align-items: flex-start;\n  gap: 10px;\n  padding: 10px 12px;\n  border-bottom: 1px solid var(--dshpp-line);\n  cursor: pointer;\n  margin: 0;\n}\n.dshpp-cwd-item:last-child {\n  border-bottom: 0;\n}\n.dshpp-cwd-item:hover {\n  background: var(--dshpp-fill);\n}\n.dshpp-cwd-item.is-on {\n  background: var(--dshpp-accent-soft);\n}\n.dshpp-cwd-item input {\n  margin: 3px 0 0;\n  flex: 0 0 auto;\n}\n.dshpp-cwd-main {\n  flex: 1;\n  min-width: 0;\n}\n.dshpp-cwd-name {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n  font-family: var(--dshpp-display);\n  font-size: 13.5px;\n  line-height: 1.35;\n  color: var(--dshpp-ink);\n}\n.dshpp-cwd-badge {\n  font-family: var(--dshpp-mono);\n  font-size: 10px;\n  letter-spacing: 0.04em;\n  text-transform: uppercase;\n  padding: 1px 7px;\n  border-radius: 99px;\n  border: 1px solid var(--dshpp-line);\n  color: var(--dshpp-mute);\n  line-height: 1.6;\n}\n.dshpp-cwd-size {\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  color: var(--dshpp-mute);\n}\n.dshpp-cwd-sub {\n  margin-top: 3px;\n  font-family: var(--dshpp-mono);\n  font-size: 11px;\n  color: var(--dshpp-mute);\n  word-break: break-all;\n}\n.dshpp-cwd-prev {\n  margin-top: 4px;\n  font-size: 11px;\n  line-height: 1.5;\n  color: var(--dshpp-mute);\n  max-height: 34px;\n  overflow: hidden;\n}\n@keyframes dshpp-pulse {\n  0% {\n    background-position: 200% 0;\n  }\n  100% {\n    background-position: -200% 0;\n  }\n}\n@media (max-width: 640px) {\n  .dshpp-metrics {\n    grid-template-columns: 1fr;\n  }\n  .dshpp-ruleitem {\n    flex-wrap: wrap;\n  }\n  .dshpp-rule-ops {\n    width: 100%;\n    justify-content: flex-end;\n  }\n}\n@media (prefers-reduced-motion: reduce) {\n  .dshpp-btn,\n  .dshpp-bar > i {\n    transition: none;\n  }\n  .dshpp-skel {\n    animation: none;\n  }\n}\nbody:not([data-ds-dark-theme]) .dshpp-auth-modal {\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-bg-layer-1, #fffcf7) 92%,\n    transparent\n  );\n  color: var(--dsw-alias-label-primary, #1a1916);\n  border-color: color-mix(\n    in srgb,\n    var(--dsw-alias-border-l1, #c9c3b6) 80%,\n    transparent\n  );\n  backdrop-filter: blur(18px) saturate(1.3);\n  -webkit-backdrop-filter: blur(18px) saturate(1.3);\n}\nbody:not([data-ds-dark-theme]) .dshpp-auth-legal {\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-bg-layer-2, #f3f0e8) 90%,\n    transparent\n  );\n  color: var(--dsw-alias-label-primary, #1a1916);\n  border-color: color-mix(\n    in srgb,\n    var(--dsw-alias-border-l1, #c9c3b6) 80%,\n    transparent\n  );\n}\nbody:not([data-ds-dark-theme]) .dshpp-auth-warn {\n  background: color-mix(in srgb, #f5e6c8 88%, transparent);\n  color: #6b4a10;\n}\nbody:not([data-ds-dark-theme]) .dshpp-auth-ops button {\n  border-color: var(--dsw-alias-border-l1, #c9c3b6);\n  color: var(--dsw-alias-label-primary, #1a1916);\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-bg-layer-1, #fff) 88%,\n    transparent\n  );\n}\nbody:not([data-ds-dark-theme]) .dshpp-auth-ops button.primary {\n  background: var(--dsw-alias-brand-primary, #3f6b52);\n  border-color: var(--dsw-alias-brand-primary, #3f6b52);\n  color: #fff;\n}\n.dshpp-auth-mask {\n  position: fixed;\n  inset: 0;\n  z-index: 10100;\n  background: rgba(0, 0, 0, 0.62);\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  pointer-events: auto;\n}\n.dshpp-auth-modal {\n  width: min(680px, 100%);\n  max-height: min(88vh, 820px);\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding: 16px;\n  border: 1px solid var(--dsw-alias-border-l1, #333);\n  border-radius: 12px;\n  background: var(--dsw-alias-bg-layer-1, #1a1a1a);\n  color: var(--dsw-alias-label-primary, #eee);\n}\n.dshpp-auth-modal h2 {\n  margin: 0;\n  font-size: 16px;\n  font-weight: 600;\n}\n.dshpp-auth-warn {\n  padding: 8px 10px;\n  border-radius: 8px;\n  background: #3a2e18;\n  color: #f0d48a;\n  font-size: 13px;\n}\n.dshpp-auth-legal {\n  overflow: auto;\n  height: 300px;\n  margin: 0;\n  padding: 10px 12px;\n  border: 1px solid var(--dsw-alias-border-l1, #333);\n  border-radius: 8px;\n  background: #121212;\n  font-size: 13px;\n  line-height: 1.55;\n}\n.dshpp-auth-legal h3 {\n  margin: 14px 0 4px;\n  font-size: 13px;\n}\n.dshpp-auth-legal h3:first-child {\n  margin-top: 0;\n}\n.dshpp-auth-legal p {\n  margin: 0 0 8px;\n}\n.dshpp-auth-checks {\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  font-size: 13px;\n}\n.dshpp-auth-checks label {\n  display: flex;\n  gap: 8px;\n  align-items: flex-start;\n}\n.dshpp-auth-checks label.locked {\n  opacity: 0.45;\n}\n.dshpp-auth-ops {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n}\n.dshpp-auth-ops button {\n  appearance: none;\n  border: 1px solid var(--dsw-alias-border-l1, #444);\n  background: transparent;\n  color: inherit;\n  border-radius: 8px;\n  padding: 6px 12px;\n  cursor: pointer;\n  font: inherit;\n}\n.dshpp-auth-ops button.primary {\n  background: #2a4033;\n  border-color: #8fbf9a;\n}\n.dshpp-auth-ops button:disabled {\n  opacity: 0.45;\n  cursor: default;\n}\n.dshpp-icon-btn {\n  appearance: none;\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  height: 32px;\n  padding: 0 10px;\n  border: 1px solid\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 45%, transparent);\n  border-radius: 8px;\n  background: transparent;\n  color: var(--dsw-alias-label-secondary, currentColor);\n  cursor: pointer;\n  font: 13px/1 inherit;\n  white-space: nowrap;\n  flex: 0 0 auto;\n}\n.dshpp-icon-btn:hover {\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-brand-primary, #6dbf8c) 12%,\n    transparent\n  );\n  color: var(--dsw-alias-label-primary, currentColor);\n}\n.dshpp-icon-btn.on {\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\n  color: var(--dsw-alias-brand-primary, #6dbf8c);\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-brand-primary, #6dbf8c) 16%,\n    transparent\n  );\n  box-shadow: 0 0 0 1px\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 28%, transparent);\n}\n.dshpp-hbtn {\n  appearance: none;\n  display: inline-flex;\n  flex: 0 0 auto;\n  align-items: center;\n  gap: 6px;\n  border: 1px solid\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 55%, transparent);\n  background: transparent;\n  color: var(--dsw-alias-label-secondary, currentColor);\n  cursor: pointer;\n  font: 12px/1 inherit;\n  padding: 5px 10px;\n  border-radius: 8px;\n  white-space: nowrap;\n}\n.dshpp-hbtn:hover {\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-brand-primary, #6dbf8c) 12%,\n    transparent\n  );\n  color: var(--dsw-alias-label-primary, currentColor);\n}\n.dshpp-hbtn.on {\n  border-color: var(--dsw-alias-brand-primary, #6dbf8c);\n  color: var(--dsw-alias-brand-primary, #6dbf8c);\n  background: color-mix(\n    in srgb,\n    var(--dsw-alias-brand-primary, #6dbf8c) 18%,\n    transparent\n  );\n  box-shadow: 0 0 0 1px\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 32%, transparent);\n}\n.dshpp-live-dot {\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  flex: none;\n  background: var(--dsw-alias-brand-primary, #6dbf8c);\n  box-shadow: 0 0 0 3px\n    color-mix(in srgb, var(--dsw-alias-brand-primary, #6dbf8c) 28%, transparent);\n}\n/* \u73BB\u7483\u8DDF\u968F\u5BBF\u4E3B\u989C\u8272\u3002\u5B57\u91CD\u548C\u5E95\u7684\u4E0D\u900F\u660E\u5EA6\u5206\u5F00\uFF1A\u58F3\u900F\uFF0C\u5B57\u5750\u5728\u66F4\u5B9E\u7684\u4E00\u5C42\u4E0A\u3002 */\n';

// src/styles/native.css
var native_default = '.dshpp-native.dshpp-root {\n  --dshpp-display: inherit;\n  --dshpp-sans: inherit;\n  --dshpp-paper: var(--dsw-alias-bg-base, transparent);\n  --dshpp-bg: transparent;\n  --dshpp-line: var(--dsw-alias-border-l1, #ddd);\n  --dshpp-ink: var(--dsw-alias-label-primary, #171717);\n  --dshpp-mute: var(--dsw-alias-label-secondary, #777);\n  --dshpp-accent: var(--dsw-alias-brand-primary, #4775ed);\n  --dshpp-fill: var(--dsw-alias-interactive-bg-hover, #f3f3f3);\n  font: inherit;\n  font-size: var(--dsh-content-font-size, 14px);\n  width: 100%;\n  height: 100%;\n  min-height: 0;\n  max-width: none;\n  padding: 0;\n  gap: 0;\n  border-radius: 0;\n  overflow: hidden;\n  box-sizing: border-box;\n}\n.dshpp-native * {\n  box-sizing: border-box;\n}\n.dshpp-native [hidden] {\n  display: none !important;\n}\n.dshpp-native-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  padding: 20px 20px 12px;\n  gap: 12px;\n  flex: none;\n}\n.dshpp-native-head h2 {\n  font: inherit;\n  font-size: 1.15em;\n  font-weight: 600;\n  margin: 0;\n}\n.dshpp-native-head p {\n  margin: 4px 0 0;\n  font-size: 0.85em;\n  color: var(--dshpp-mute);\n}\n.dshpp-native-badge {\n  font-size: 0.8em;\n  color: var(--dshpp-mute);\n}\n.dshpp-native-nav {\n  display: flex;\n  gap: 4px;\n  padding: 0 16px;\n  border-bottom: 1px solid var(--dshpp-line);\n  flex: none;\n  overflow-x: auto;\n}\n.dshpp-native-nav button {\n  font: inherit;\n  font-size: 0.92em;\n  border: 0;\n  border-bottom: 2px solid transparent;\n  background: none;\n  color: var(--dshpp-mute);\n  padding: 10px 8px;\n  white-space: nowrap;\n  cursor: pointer;\n}\n.dshpp-native-nav button[aria-pressed="true"] {\n  color: var(--dshpp-ink);\n  border-bottom-color: var(--dshpp-accent);\n}\n.dshpp-native-content {\n  min-height: 0;\n  flex: 1;\n  overflow: auto;\n  padding: 20px;\n  scrollbar-gutter: stable;\n  overscroll-behavior: contain;\n}\n.dshpp-native .dshpp-panel {\n  border: 0;\n  border-radius: 0;\n  padding: 0;\n  background: transparent;\n  min-width: 0;\n}\n.dshpp-native\n  :is(\n    h3,\n    h4,\n    .dshpp-title,\n    .dshpp-group-h strong,\n    .dshpp-metric b,\n    .dshpp-now-ver,\n    .dshpp-edition-name\n  ) {\n  font-family: inherit;\n  font-size: 1em;\n  letter-spacing: normal;\n  font-weight: 550;\n}\n.dshpp-native .dshpp-metric b {\n  font-size: 1.12em;\n}\n.dshpp-native .dshpp-head {\n  margin-bottom: 12px;\n}\n.dshpp-native .dshpp-sub {\n  margin-top: 0;\n  flex-wrap: wrap;\n}\n.dshpp-native :is(button, input, select, textarea) {\n  font-family: inherit;\n  box-shadow: none;\n  background-image: none;\n  max-width: 100%;\n}\n.dshpp-native .dshpp-btn {\n  font-size: 0.9em;\n  min-height: 32px;\n  border-radius: 7px;\n  padding: 6px 10px;\n  transform: none;\n  box-shadow: none;\n}\n.dshpp-native .dshpp-btn:hover:not(:disabled) {\n  background: var(--dshpp-fill);\n  box-shadow: none;\n  transform: none;\n}\n.dshpp-native .dshpp-btn-primary {\n  background: var(--dsw-alias-label-primary, #171717);\n  color: var(--dsw-alias-bg-base, #fff);\n  border-color: transparent;\n}\n.dshpp-native .dshpp-btn-primary:hover:not(:disabled) {\n  opacity: 0.85;\n  background: var(--dsw-alias-label-primary, #171717);\n}\n.dshpp-native :is(button, input, select, textarea):focus-visible {\n  outline: 2px solid var(--dshpp-accent);\n  outline-offset: 2px;\n  box-shadow: none;\n}\n.dshpp-native .dshpp-area {\n  font-family: inherit;\n  font-size: 0.92em;\n  line-height: 1.6;\n  min-height: 260px;\n  width: 100%;\n  border-radius: 8px;\n  background: transparent;\n  color: inherit;\n}\n.dshpp-native .dshpp-field {\n  font-size: 0.92em;\n  background: transparent;\n  color: inherit;\n}\n.dshpp-native .dshpp-metrics {\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 8px;\n}\n.dshpp-native .dshpp-metric:nth-child(2) {\n  display: none;\n}\n.dshpp-native .dshpp-metric {\n  min-height: 60px;\n  padding: 12px;\n  background: var(--dshpp-fill);\n  border: 0;\n}\n.dshpp-native .dshpp-metric span {\n  font-size: 0.85em;\n}\n.dshpp-native .dshpp-editions {\n  margin: 10px 0;\n  border: 0;\n}\n.dshpp-native summary {\n  cursor: pointer;\n  color: var(--dshpp-mute);\n  padding: 8px 0;\n  font-size: 0.9em;\n}\n.dshpp-native .dshpp-edition {\n  grid-template-columns: 1fr auto;\n  gap: 8px;\n}\n.dshpp-native .dshpp-edition-name {\n  grid-column: 1/-1;\n}\n.dshpp-native .dshpp-edition .dshpp-btn {\n  min-width: 0;\n}\n.dshpp-native .dshpp-table {\n  table-layout: fixed;\n  font-size: 0.83em;\n}\n.dshpp-native .dshpp-table td {\n  word-break: break-word;\n  padding: 8px;\n}\n.dshpp-native .dshpp-table th {\n  padding: 8px;\n}\n.dshpp-native .dshpp-group-h {\n  flex-wrap: wrap;\n  gap: 6px;\n}\n.dshpp-native .dshpp-group-h em {\n  font-size: 0.85em;\n}\n.dshpp-native .dshpp-row {\n  gap: 8px;\n}\n.dshpp-native .dshpp-hint {\n  font-size: 0.85em !important;\n  line-height: 1.6;\n  color: var(--dshpp-mute);\n}\n.dshpp-native .dshpp-more {\n  border-top: 1px solid var(--dshpp-line);\n  padding-top: 20px;\n  margin-top: 24px;\n}\n.dshpp-native .dshpp-more p {\n  font-size: 0.9em;\n  line-height: 1.6;\n  color: var(--dshpp-mute);\n}\n.dshpp-native .dshpp-attribution {\n  margin-top: 32px;\n  font-size: 0.78em !important;\n}\n\n/* \u6F14\u7EC3\u53F0\uFF1A\u65E7\u7248\u8DD1\u5728\u53EF\u62D6\u62FD\u60AC\u6D6E\u7A97\u91CC\uFF0C\u73B0\u5728\u5D4C\u5728\u53F3\u4FA7\u680F\uFF0C\u5FC5\u987B\u81EA\u5DF1\u6491\u5F00\u5E76\u5141\u8BB8\u6EDA\u52A8 */\n.dshpp-native-drill {\n  width: 100%;\n  min-width: 0;\n  min-height: 72vh;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n  padding-bottom: 24px;\n  box-sizing: border-box;\n}\n.dshpp-native-drill > .rt-dock.rt-embedded {\n  flex: 1 1 auto;\n  min-height: 0;\n  min-width: 0;\n  width: 100%;\n  height: auto;\n  overflow: visible;\n}\n/* \u53F3\u4FA7\u680F\u5F88\u7A84\uFF1A\u5185\u90E8\u6240\u6709 flex \u884C\u90FD\u5F97\u80FD\u6362\u884C\uFF0C\u8F93\u5165\u6846\u4E0D\u80FD\u628A\u5144\u5F1F\u5143\u7D20\u6324\u6210 1ch \u5BBD */\n.dshpp-native-drill .rt-dock,\n.dshpp-native-drill .rt-dock * {\n  box-sizing: border-box;\n  min-width: 0;\n  word-break: normal;\n  overflow-wrap: anywhere;\n}\n.dshpp-native-drill .rt-dock input,\n.dshpp-native-drill .rt-dock textarea,\n.dshpp-native-drill .rt-dock select {\n  width: 100%;\n  max-width: 100%;\n}\n\n/* \u300C\u66F4\u65B0\u901A\u9053\u300D\u4E0E\u300C\u81EA\u52A8\u68C0\u67E5\u66F4\u65B0 / \u6BCF N \u5C0F\u65F6\u300D\u540C\u884C\u5E76\u6392\uFF1A\u9AD8\u5EA6\u3001\u5706\u89D2\u3001\u5B57\u53F7\u5BF9\u9F50 select\u3002\n   \u540C\u4E00\u7EC4\u4EF6\u540C\u65F6\u6302\u5728\u63D2\u4EF6\u8BBE\u7F6E\u9875(.dshpp-native)\u548C\u5DE6\u4FA7 Purge \u6574\u9875(.dshpp-page)\uFF0C\n   \u4E24\u5904\u6839 class \u4E0D\u540C\uFF0C\u9009\u62E9\u5668\u5FC5\u987B\u90FD\u8986\u76D6\u3002 */\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-open {\n  min-height: 32px;\n  padding: 4px 12px;\n  border-radius: 7px;\n  font-size: 0.9em;\n  white-space: nowrap;\n}\n/* \u65E7\u7248\u6807\u9898\u884C\u53F3\u5BF9\u9F50\u5E03\u5C40\u4FDD\u7559\u7ED9\u53EF\u80FD\u7684\u5916\u90E8\u8C03\u7528\uFF0C\u4F46\u4E3B\u5165\u53E3\u5DF2\u79FB\u5230\u8BBE\u7F6E\u884C\u3002 */\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-head {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-head h3 {\n  margin: 0;\n}\n/* \u66F4\u65B0\u901A\u9053\u5BF9\u8BDD\u6846\uFF1A\u9762\u677F\u91CC\u6CA1\u6709\u53EF\u9760\u7684 react-dom portal\uFF0C\u7528\u56FA\u5B9A\u5B9A\u4F4D + \u906E\u7F69\u81EA\u5DF1\u5B9E\u73B0 */\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-mask {\n  position: fixed;\n  inset: 0;\n  z-index: 12050;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  padding: 20px;\n  background: rgba(0, 0, 0, 0.55);\n  pointer-events: auto;\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-card {\n  width: min(440px, 100%);\n  max-height: min(88vh, 720px);\n  overflow: auto;\n  box-sizing: border-box;\n  display: flex;\n  flex-direction: column;\n  gap: 8px;\n  padding: 18px;\n  border-radius: 12px;\n  border: 1px solid var(--dshpp-line);\n  background: var(--dsw-alias-bg-layer-1, #fffcf7);\n  color: var(--dshpp-ink);\n  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-title {\n  margin: 0 0 2px;\n  font-family: inherit;\n  font-size: 1em;\n  font-weight: 600;\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-label {\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n  font-size: 0.88em;\n  color: var(--dshpp-mute);\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-field {\n  width: 100%;\n  min-width: 0;\n  font-size: 0.92em;\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-check {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 0.88em;\n  color: var(--dshpp-mute);\n}\n:is(.dshpp-native, .dshpp-page) .dshpp-updch-ops {\n  display: flex;\n  justify-content: flex-end;\n  gap: 8px;\n  margin-top: 4px;\n}\n';

// src/styles/page.css
var page_default = '/* \u6574\u9875\uFF08\u5DE6\u4FA7\u680F\u5165\u53E3\uFF09\u6837\u5F0F\uFF1A\u6CBF\u7528 DSH \u81EA\u5DF1\u7684\u5B57\u4F53\u3001\u95F4\u8DDD\u4E0E\u4E3B\u9898\u53D8\u91CF\uFF0C\u4E0D\u5F15\u5165\u81EA\u5B9A\u4E49\u5B57\u4F53\u3002 */\n.dshpp-page {\n  --dshpp-line: var(--dsw-alias-border-l1, rgba(127, 127, 127, 0.22));\n  --dshpp-line-strong: var(--dsw-alias-border-l2, rgba(127, 127, 127, 0.4));\n  --dshpp-fg: var(--dsw-alias-label-primary, currentColor);\n  --dshpp-mute: var(\n    --dsw-alias-label-secondary,\n    color-mix(in srgb, currentColor 62%, transparent)\n  );\n  --dshpp-bg: var(--dsw-alias-bg-layer-1, transparent);\n  --dshpp-bg-2: var(--dsw-alias-bg-layer-2, rgba(127, 127, 127, 0.06));\n  --dshpp-accent: var(--dsw-alias-brand-primary, #4d6bfe);\n  --dshpp-ok: var(--dsw-alias-state-success-primary, #1f9d55);\n  --dshpp-warn: var(--dsw-alias-state-warn-primary, #b7791f);\n  --dshpp-bad: var(--dsw-alias-state-error-primary, #d14343);\n  box-sizing: border-box;\n  height: 100%;\n  min-height: 0;\n  overflow: auto;\n  padding: 20px 24px 40px;\n  color: var(--dshpp-fg);\n  font: inherit;\n  line-height: 1.55;\n  -webkit-font-smoothing: antialiased;\n}\n.dshpp-page *,\n.dshpp-page *::before,\n.dshpp-page *::after {\n  box-sizing: border-box;\n}\n\n.dshpp-page-head {\n  display: flex;\n  align-items: center;\n  gap: 12px;\n  min-width: 0;\n}\n.dshpp-page-glyph {\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  width: 34px;\n  height: 34px;\n  border-radius: 10px;\n  border: 1px solid var(--dshpp-line);\n  background: var(--dshpp-bg-2);\n  color: var(--dshpp-accent);\n  flex: none;\n}\n.dshpp-page-title {\n  min-width: 0;\n}\n.dshpp-page-title h1 {\n  margin: 0;\n  font-size: 1.15em;\n  font-weight: 600;\n  letter-spacing: 0.01em;\n}\n.dshpp-page-title p {\n  margin: 2px 0 0;\n  font-size: 0.86em;\n  color: var(--dshpp-mute);\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  flex-wrap: wrap;\n}\n.dshpp-page-ver {\n  padding: 1px 6px;\n  border-radius: 999px;\n  border: 1px solid var(--dshpp-line);\n  font-size: 0.92em;\n}\n\n/* \u9876\u90E8\u4E00\u884C\u72B6\u6001\u6458\u8981\uFF1A\u4E0D\u7528\u5361\u7247\uFF0C\u8DDF DSH \u7684 subtitle \u884C\u4E00\u81F4 */\n.dshpp-strip {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 6px 18px;\n  margin: 14px 0 2px;\n  padding: 10px 0 12px;\n  border-bottom: 1px solid var(--dshpp-line);\n  font-size: 0.86em;\n  color: var(--dshpp-mute);\n}\n.dshpp-strip-item {\n  display: inline-flex;\n  align-items: center;\n  gap: 5px;\n  min-width: 0;\n}\n.dshpp-strip-item b {\n  color: var(--dshpp-fg);\n  font-weight: 600;\n}\n.dshpp-dot {\n  width: 7px;\n  height: 7px;\n  border-radius: 50%;\n  background: var(--dshpp-mute);\n  flex: none;\n}\n.dshpp-dot.is-ok {\n  background: var(--dshpp-ok);\n}\n.dshpp-dot.is-warn {\n  background: var(--dshpp-warn);\n}\n.dshpp-dot.is-bad {\n  background: var(--dshpp-bad);\n}\n\n/* \u9875\u7B7E\uFF1A\u4E0B\u5212\u7EBF\u5F0F\uFF0C\u8DDF DSH \u8BBE\u7F6E\u9875\u7684 tab \u4E00\u81F4 */\n.dshpp-page-tabs {\n  display: flex;\n  gap: 2px;\n  margin: 10px 0 0;\n  border-bottom: 1px solid var(--dshpp-line);\n  overflow-x: auto;\n  scrollbar-width: none;\n}\n.dshpp-page-tabs::-webkit-scrollbar {\n  display: none;\n}\n.dshpp-page-tabs button {\n  appearance: none;\n  border: 0;\n  background: transparent;\n  color: var(--dshpp-mute);\n  font: inherit;\n  font-size: 0.92em;\n  padding: 9px 12px 10px;\n  border-bottom: 2px solid transparent;\n  margin-bottom: -1px;\n  cursor: pointer;\n  white-space: nowrap;\n}\n.dshpp-page-tabs button:hover {\n  color: var(--dshpp-fg);\n}\n.dshpp-page-tabs button[aria-selected="true"] {\n  color: var(--dshpp-fg);\n  border-bottom-color: var(--dshpp-accent);\n  font-weight: 600;\n}\n\n.dshpp-page-body {\n  padding-top: 18px;\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  min-width: 0;\n}\n.dshpp-sec {\n  display: flex;\n  flex-direction: column;\n  gap: 16px;\n  min-width: 0;\n}\n.dshpp-sec[hidden] {\n  display: none;\n}\n\n/* \u5361\u7247\uFF1ADSH \u7684 layer-1 \u9762\u677F */\n.dshpp-page .dshpp-card,\n.dshpp-page section.dshpp-panel {\n  border: 1px solid var(--dshpp-line);\n  border-radius: 12px;\n  background: var(--dshpp-bg);\n  padding: 16px 18px;\n  margin: 0;\n  min-width: 0;\n}\n.dshpp-page .dshpp-card > h3:first-child,\n.dshpp-page section.dshpp-panel > h3:first-child {\n  margin: 0 0 12px;\n  font-size: 1em;\n  font-weight: 600;\n}\n.dshpp-page .dshpp-panel {\n  display: flex;\n  flex-direction: column;\n  gap: 12px;\n}\n\n/* \u5B57\u6BB5\u884C\uFF1A\u5DE6\u6807\u9898\u53F3\u63A7\u4EF6\uFF1B\u7A84\u5C4F\u81EA\u52A8\u6362\u884C */\n.dshpp-page .dshpp-field {\n  display: grid;\n  grid-template-columns: minmax(120px, 190px) 1fr;\n  gap: 8px 14px;\n  align-items: center;\n}\n.dshpp-page .dshpp-field > .dshpp-field-label {\n  display: inline-flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 0.92em;\n  color: var(--dshpp-fg);\n}\n.dshpp-page .dshpp-field > .dshpp-field-body {\n  min-width: 0;\n}\n@media (max-width: 720px) {\n  .dshpp-page .dshpp-field {\n    grid-template-columns: 1fr;\n  }\n}\n\n.dshpp-page .dshpp-muted,\n.dshpp-page .dshpp-hint {\n  color: var(--dshpp-mute) !important;\n  font-size: 0.86em !important;\n  line-height: 1.6;\n  margin: 0;\n}\n\n.dshpp-page .dshpp-row {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 10px;\n  align-items: center;\n  min-width: 0;\n}\n.dshpp-page input,\n.dshpp-page select,\n.dshpp-page textarea {\n  font: inherit;\n  color: var(--dshpp-fg);\n  background: var(--dshpp-bg-2);\n  border: 1px solid var(--dshpp-line);\n  border-radius: 8px;\n  padding: 7px 10px;\n  max-width: 100%;\n}\n.dshpp-page input:focus-visible,\n.dshpp-page select:focus-visible,\n.dshpp-page textarea:focus-visible {\n  outline: 2px solid color-mix(in srgb, var(--dshpp-accent) 55%, transparent);\n  outline-offset: 1px;\n}\n.dshpp-page textarea {\n  width: 100%;\n  min-height: 320px;\n  resize: vertical;\n  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;\n  font-size: 0.86em;\n  line-height: 1.6;\n}\n\n.dshpp-page .dshpp-btn {\n  font: inherit;\n  font-size: 0.9em;\n  border-radius: 8px;\n  padding: 6px 12px;\n  border: 1px solid var(--dshpp-line);\n  background: var(--dshpp-bg-2);\n  color: var(--dshpp-fg);\n  cursor: pointer;\n  white-space: nowrap;\n}\n.dshpp-page .dshpp-btn:hover:not(:disabled) {\n  border-color: var(--dshpp-line-strong);\n}\n.dshpp-page .dshpp-btn:disabled {\n  opacity: 0.45;\n  cursor: not-allowed;\n}\n/* \u4E3B\u6309\u94AE\uFF1A\u4E0D\u8981\u7528 brand-primary \u5F53\u5E95\u8272\u2014\u2014\u6DF1\u8272\u6A21\u5F0F\u4E0B\u5B83\u662F\u9AD8\u4EAE\u6587\u5B57\u8272\uFF0C\n   \u76F4\u63A5\u94FA\u6210\u80CC\u666F\u5C31\u6210\u4E86"\u767D\u5E95\u767D\u5B57"\u7684\u65B9\u5757\u3002\u8FD9\u91CC\u7528\u56FA\u5B9A\u7684\u5B9E\u5FC3\u7EFF + \u767D\u5B57\u3002 */\n.dshpp-page {\n  --dshpp-solid: #2f6b4f;\n  --dshpp-solid-hover: #3a8260;\n  --dshpp-solid-danger: #a63b3b;\n  --dshpp-solid-danger-hover: #bd4747;\n}\n.dshpp-page .dshpp-btn-primary {\n  background: var(--dshpp-solid);\n  border-color: var(--dshpp-solid);\n  color: #fff;\n  font-weight: 600;\n}\n.dshpp-page .dshpp-btn-primary:hover:not(:disabled) {\n  background: var(--dshpp-solid-hover);\n  border-color: var(--dshpp-solid-hover);\n}\n.dshpp-page .dshpp-btn-solid-danger {\n  background: var(--dshpp-solid-danger);\n  border-color: var(--dshpp-solid-danger);\n  color: #fff;\n}\n.dshpp-page .dshpp-btn-solid-danger:hover:not(:disabled) {\n  background: var(--dshpp-solid-danger-hover);\n  border-color: var(--dshpp-solid-danger-hover);\n}\n.dshpp-page .dshpp-btn-danger {\n  color: var(--dshpp-bad);\n  border-color: color-mix(in srgb, var(--dshpp-bad) 40%, transparent);\n}\n.dshpp-page .dshpp-btn-tiny {\n  padding: 3px 8px;\n  font-size: 0.82em;\n}\n\n.dshpp-page .dshpp-pill {\n  display: inline-flex;\n  align-items: center;\n  padding: 1px 8px;\n  border-radius: 999px;\n  font-size: 0.8em;\n  border: 1px solid var(--dshpp-line);\n  color: var(--dshpp-mute);\n}\n.dshpp-page .dshpp-pill.is-ok {\n  color: var(--dshpp-ok);\n  border-color: color-mix(in srgb, var(--dshpp-ok) 35%, transparent);\n}\n.dshpp-page .dshpp-pill.is-wait {\n  color: var(--dshpp-warn);\n  border-color: color-mix(in srgb, var(--dshpp-warn) 35%, transparent);\n}\n.dshpp-page .dshpp-pill.is-bad {\n  color: var(--dshpp-bad);\n  border-color: color-mix(in srgb, var(--dshpp-bad) 40%, transparent);\n}\n\n.dshpp-page .dshpp-table {\n  width: 100%;\n  border-collapse: collapse;\n  font-size: 0.86em;\n}\n.dshpp-page .dshpp-table th,\n.dshpp-page .dshpp-table td {\n  text-align: left;\n  padding: 7px 10px;\n  border-bottom: 1px solid var(--dshpp-line);\n  vertical-align: top;\n  overflow-wrap: anywhere;\n}\n.dshpp-page .dshpp-table th {\n  color: var(--dshpp-mute);\n  font-weight: 500;\n  font-size: 0.95em;\n}\n.dshpp-page .dshpp-group-h {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 10px;\n  width: 100%;\n  border: 0;\n  background: transparent;\n  color: inherit;\n  font: inherit;\n  padding: 8px 0;\n  cursor: pointer;\n}\n.dshpp-page .dshpp-count {\n  color: var(--dshpp-mute);\n  font-size: 0.85em;\n}\n\n/* \u6F14\u7EC3\u53F0\u5360\u6EE1\u5269\u4F59\u9AD8\u5EA6 */\n.dshpp-page-drill {\n  min-height: 60vh;\n}\n.dshpp-page-drill .rt-dock.rt-embedded {\n  width: 100%;\n  min-width: 0;\n}\n\n.dshpp-page-foot {\n  margin-top: 28px;\n  padding-top: 14px;\n  border-top: 1px solid var(--dshpp-line);\n  font-size: 0.8em;\n  color: var(--dshpp-mute);\n}\n\n/* \u540D\u8BCD\u89E3\u91CA\uFF1A\u6807\u9898\u540E\u9762\u7684\u5C0F\u95EE\u53F7 */\n.dshpp-help {\n  position: relative;\n  display: inline-flex;\n  align-items: center;\n}\n.dshpp-help-btn {\n  appearance: none;\n  border: 0;\n  background: transparent;\n  color: var(--dshpp-mute);\n  font: inherit;\n  font-size: 0.85em;\n  line-height: 1;\n  width: 16px;\n  height: 16px;\n  border-radius: 50%;\n  border: 1px solid var(--dshpp-line);\n  cursor: help;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  padding: 0;\n}\n.dshpp-help-btn:hover,\n.dshpp-help-btn[aria-expanded="true"] {\n  color: var(--dshpp-fg);\n  border-color: var(--dshpp-line-strong);\n  background: var(--dshpp-bg-2);\n}\n.dshpp-tip {\n  position: absolute;\n  left: 0;\n  top: calc(100% + 6px);\n  z-index: 2147483000;\n  width: max-content;\n  max-width: min(340px, 70vw);\n  padding: 9px 11px;\n  border-radius: 8px;\n  border: 1px solid var(--dshpp-line);\n  background: var(--dsw-alias-bg-overlay, canvas);\n  color: var(--dshpp-fg);\n  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);\n  font-size: 0.82em;\n  line-height: 1.6;\n  white-space: normal;\n  display: flex;\n  flex-direction: column;\n  gap: 4px;\n}\n.dshpp-tip b {\n  font-weight: 600;\n}\n\n.dshpp-page .dshpp-warn {\n  margin: 10px 0 0;\n  padding: 8px 12px;\n  border-radius: 8px;\n  border: 1px solid color-mix(in srgb, var(--dshpp-warn) 45%, transparent);\n  color: var(--dshpp-warn);\n  background: color-mix(in srgb, var(--dshpp-warn) 10%, transparent);\n  font-size: 0.86em;\n}\n\n/* \u64CD\u4F5C\u6761\uFF1A\u6700\u5E38\u7528\u7684\u300C\u5E94\u7528\u300D\u56FA\u5B9A\u5728\u5185\u5BB9\u533A\u9876\u90E8 */\n.dshpp-page .dshpp-actions {\n  position: sticky;\n  top: 0;\n  z-index: 5;\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px;\n  padding: 10px 0 12px;\n  margin: -4px 0 6px;\n  background: linear-gradient(\n    var(--dsw-alias-bg-base, canvas) 78%,\n    transparent\n  );\n  backdrop-filter: blur(2px);\n  border-bottom: 1px solid var(--dshpp-line);\n}\n.dshpp-page .dshpp-actions .dshpp-pill {\n  margin-left: auto;\n}\n\n/* \u6307\u6807\uFF1A\u4E09\u5217\u7D27\u51D1 */\n.dshpp-page .dshpp-metrics {\n  display: grid;\n  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));\n  gap: 10px;\n  margin: 4px 0 2px;\n}\n.dshpp-page .dshpp-metric {\n  border: 1px solid var(--dshpp-line);\n  border-radius: 10px;\n  padding: 10px 12px;\n  background: var(--dshpp-bg-2);\n  min-width: 0;\n}\n.dshpp-page .dshpp-metric b {\n  display: block;\n  font-size: 1.05em;\n  font-weight: 600;\n  margin-bottom: 2px;\n  overflow-wrap: anywhere;\n}\n.dshpp-page .dshpp-metric span {\n  color: var(--dshpp-mute);\n  font-size: 0.82em;\n}\n\n/* \u6298\u53E0\u5757\uFF1A\u8865\u4E01\u660E\u7EC6 / \u7EF4\u62A4 / \u81EA\u68C0 */\n.dshpp-page .dshpp-fold,\n.dshpp-page .dshpp-fold-inline {\n  border: 1px solid var(--dshpp-line);\n  border-radius: 10px;\n  background: var(--dshpp-bg);\n  padding: 0 12px;\n}\n.dshpp-page .dshpp-fold > summary,\n.dshpp-page .dshpp-fold-inline > summary {\n  cursor: pointer;\n  padding: 10px 0;\n  font-size: 0.92em;\n  color: var(--dshpp-fg);\n  list-style: none;\n  display: flex;\n  align-items: center;\n  gap: 8px;\n}\n.dshpp-page .dshpp-fold > summary::-webkit-details-marker,\n.dshpp-page .dshpp-fold-inline > summary::-webkit-details-marker {\n  display: none;\n}\n.dshpp-page .dshpp-fold > summary::before,\n.dshpp-page .dshpp-fold-inline > summary::before {\n  content: "\u25B8";\n  color: var(--dshpp-mute);\n  font-size: 0.9em;\n  transition: transform 0.12s ease;\n}\n.dshpp-page .dshpp-fold[open] > summary::before,\n.dshpp-page .dshpp-fold-inline[open] > summary::before {\n  transform: rotate(90deg);\n}\n.dshpp-page .dshpp-fold > summary b,\n.dshpp-page .dshpp-fold-inline > summary b {\n  color: var(--dshpp-mute);\n  font-weight: 500;\n  margin-left: auto;\n}\n\n/* \u72B6\u6001\u884C\uFF08\u81EA\u68C0 / \u5F3A\u5316\u6BB5\uFF09 */\n.dshpp-page .dshpp-line {\n  display: flex;\n  align-items: center;\n  gap: 10px;\n  flex-wrap: wrap;\n  padding: 6px 0;\n}\n.dshpp-page .dshpp-line + .dshpp-line {\n  border-top: 1px solid var(--dshpp-line);\n}\n.dshpp-page .dshpp-line-main {\n  display: inline-flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 0.92em;\n  min-width: 0;\n}\n.dshpp-page .dshpp-line-main b {\n  font-weight: 600;\n}\n.dshpp-page .dshpp-fold-inline {\n  border: 0;\n  padding: 0;\n  background: transparent;\n}\n.dshpp-page .dshpp-fold-inline > summary {\n  padding: 2px 0;\n  color: var(--dshpp-mute);\n  font-size: 0.86em;\n}\n.dshpp-page .dshpp-fold-inline[open] {\n  flex-basis: 100%;\n}\n\n/* \u9010\u5C42\u81EA\u68C0\uFF1A\u4E24\u5217/\u591A\u5217\u7F51\u683C\uFF0C\u4E0D\u518D\u4E00\u6761\u4E00\u884C */\n.dshpp-page .dshpp-checks {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));\n  gap: 2px 14px;\n  padding: 6px 0 10px;\n}\n.dshpp-page .dshpp-check {\n  display: flex;\n  align-items: center;\n  gap: 6px;\n  font-size: 0.84em;\n  min-width: 0;\n  padding: 2px 0;\n}\n.dshpp-page .dshpp-check.is-bad {\n  color: var(--dshpp-bad);\n}\n.dshpp-page .dshpp-check-name {\n  overflow: hidden;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  min-width: 0;\n}\n.dshpp-page .dshpp-check-val {\n  margin-left: auto;\n  color: var(--dshpp-mute);\n  font-variant-numeric: tabular-nums;\n}\n\n/* \u72B6\u6001\u9875 hero\uFF1A\u4E00\u773C\u770B\u5230"\u73B0\u5728\u4EC0\u4E48\u72B6\u6001\u3001\u4E0B\u4E00\u6B65\u70B9\u54EA" */\n.dshpp-page .dshpp-hero {\n  border: 1px solid var(--dshpp-line);\n  border-radius: 12px;\n  background: var(--dshpp-bg);\n  padding: 16px 18px;\n  display: flex;\n  flex-direction: column;\n  gap: 10px;\n}\n.dshpp-page .dshpp-hero-state {\n  display: flex;\n  align-items: center;\n  gap: 8px;\n  font-size: 1.02em;\n  min-width: 0;\n}\n.dshpp-page .dshpp-hero-state b {\n  font-weight: 600;\n}\n.dshpp-page .dshpp-hero-sub {\n  margin-left: auto;\n  color: var(--dshpp-mute);\n  font-size: 0.82em;\n}\n.dshpp-page .dshpp-hero-actions {\n  display: flex;\n  flex-wrap: wrap;\n  align-items: center;\n  gap: 8px;\n}\n.dshpp-page .dshpp-btn-lead {\n  padding: 9px 20px;\n  font-size: 0.98em;\n  font-weight: 600;\n  border-radius: 10px;\n}\n.dshpp-page .dshpp-hero-hint {\n  margin: 0;\n  color: var(--dshpp-mute);\n  font-size: 0.84em;\n  line-height: 1.6;\n}\n.dshpp-check.is-warn {\n  color: var(--dshpp-warn);\n}\n\n.dshpp-page .dshpp-probe-msg {\n  margin: 6px 0 0;\n  padding: 8px 10px;\n  border-radius: 8px;\n  border: 1px dashed var(--dshpp-line);\n  background: var(--dshpp-bg-2);\n  font-size: 0.82em;\n  white-space: pre-wrap;\n  overflow-wrap: anywhere;\n}\n';

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
      throw new Error("\u8FDE\u4E0D\u4E0A\u63A5\u53E3\uFF0C\u8BF7\u786E\u8BA4 dsh \u8FD8\u5728\u8DD1\u540E Ctrl+F5");
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
/* brand-primary \u5728\u6DF1\u8272\u4E3B\u9898\u4E0B\u662F\u8FD1\u767D\u8272\uFF08#f9fafb\uFF09\uFF0C\u5F53\u5E95\u8272\u914D #fff \u4F1A\u767D\u5E95\u767D\u5B57\u3002
   \u6539\u7528\u6807\u7B7E\u8272/\u5E95\u8272\u8FD9\u5BF9\u53CD\u8F6C token\uFF0C\u4E24\u5957\u4E3B\u9898\u90FD\u4FDD\u6301\u9AD8\u5BF9\u6BD4\u3002 */
.rt-btn-primary{background:var(--dsw-alias-label-primary,#111);border-color:var(--dsw-alias-label-primary,#111);color:var(--dsw-alias-bg-base,#fff)}
.rt-btn-primary:hover{opacity:.9}
.rt-btn:disabled{opacity:.5;cursor:default}
.rt-tabs{display:flex;flex-wrap:wrap;gap:2px;padding:6px 12px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.rt-tab{padding:8px 10px 7px;border-radius:0;cursor:pointer;font-size:12.5px;color:var(--dsw-alias-label-secondary);
  display:inline-flex;align-items:center;gap:5px;border-bottom:2px solid transparent;margin-bottom:-1px;background:transparent}
.rt-tab:hover{color:var(--dsw-alias-label-primary)}
.rt-tab.on{color:var(--dsw-alias-label-primary);background:transparent;font-weight:600;border-bottom-color:var(--dsw-alias-brand-primary,#6dbf8c)}
/* \u672A\u8BFB\u7EA2\u70B9\uFF1A\u8BE5\u9875\u7B7E\u6709\u65B0\u5185\u5BB9\uFF08\u65B0\u8D44\u4EA7/\u65B0\u6F0F\u6D1E/\u65B0\u5F97\u5206/\u65B0\u6B65\u9AA4\u2026\uFF09\uFF0C\u70B9\u5F00\u770B\u8FC7\u5C31\u6D88\u5931 */
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
/* \u7EAA\u5F8B\u63D0\u793A\u6761\uFF1A\u4E0D\u6EE1\u8DB3\u4EA4\u4ED8\u8981\u6C42\uFF08\u975E\u51B0\u874E/\u54E5\u65AF\u62C9\u9A6C\u3001\u6CA1\u6709 suo5 \u96A7\u9053\uFF09\u65F6\u9876\u5728\u533A\u5757\u6700\u4E0A\u65B9 */
.rt-hint{border-radius:6px;padding:7px 9px;margin-bottom:8px;font-size:11.5px;line-height:1.6;
  border:1px dashed #ef444488;background:#ef44440f;color:var(--dsw-alias-label-primary)}
.rt-hint b{color:#ef4444}
.rt-tag-dead{color:var(--dsw-alias-label-secondary)}
.rt-expand{grid-column:1/-1;padding:8px 4px 10px;font-size:12px;color:var(--dsw-alias-label-secondary)}
.rt-kv{display:flex;gap:8px;margin-bottom:3px;align-items:baseline}
.rt-kv b{color:var(--dsw-alias-label-primary);font-weight:600;min-width:64px;flex:none}
/* \u56FE\u8C31\u89C6\u56FE\u5DF2\u79FB\u9664\uFF08\u89C1 AssetsTab\uFF1A\u8D44\u4EA7\u5173\u7CFB\u7531\u300C\u57DF\u540D\u7EF4\u5EA6\u300D\u4E0E redteam_attack_path \u5DE5\u5177\u627F\u62C5\uFF09 */
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
/* \u5F97\u5206\u76EE\u6807\u6309\u5408\u5E76\u7248\u7684 8 \u4E2A\u7C7B\u522B\u5206\u7EC4\uFF1A\u7C7B\u522B\u5934 + \u7EC4\u5185\u6309\u5206\u503C\u5347\u5E8F */
.rt-score-group{display:flex;align-items:center;gap:8px;padding:7px 10px 5px;margin-top:2px;
  font-size:12px;font-weight:600;border-top:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-2)}
.rt-score-group:first-child{border-top:none}
.rt-score-group .rt-sg-sub{font-weight:400;font-size:11px;color:var(--dsw-alias-label-secondary)}
/* \u2500\u2500 \u4F1A\u8BDD\u4E0E\u5165\u53E3\uFF1A\u6BCF\u5F20\u5361\u7247\u5206\u300C\u6807\u9898\u884C / \u5173\u952E\u4E8B\u5B9E / \u53EF\u7528\u547D\u4EE4 / \u5907\u6CE8\u300D\u56DB\u6BB5\uFF0C\u907F\u514D\u4E00\u884C\u7CCA\u5728\u4E00\u8D77 \u2500\u2500 */
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
/* \u2500\u2500 \u6298\u53E0\u5C42\u6B21\u4F53\u7CFB \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
   L1 \u6298\u53E0\u5934 .rt-sec   \uFF1A\u901A\u680F\u3001\u65E0\u5706\u89D2\u65E0\u8FB9\u6846\u3001\u5DE6\u8272\u6761\u3001\u6DF1\u5E95 \u2014\u2014 \u6C38\u8FDC\u662F"\u6241"\u7684
   L2 \u5185\u5BB9\u5361 .rt-atest/.rt-hit/.rt-cred/.rt-evi\uFF1A\u5185\u7F29\u3001\u6709\u8FB9\u6846\u3001\u5706\u89D2 \u2014\u2014 \u7ACB\u8D77\u6765
   L3 \u8BE6\u60C5/\u957F\u6587\u672C .rt-clip-body / .rt-evi-body \uFF1A\u65E0\u8FB9\u6846\u3001\u6700\u6D45\u3001\u7B49\u5BBD
   L4 \u5B50\u9879\u5BB9\u5668 .rt-sec-body\uFF1A\u5DE6\u7F29\u8FDB + \u7AD6\u5F15\u5BFC\u7EBF\uFF0C\u8868\u660E"\u5C5E\u4E8E\u4E0A\u9762\u90A3\u4E2A\u5934"
   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
/* \u957F\u6587\u672C\u6298\u53E0\uFF08L3\uFF09\uFF1A\u9ED8\u8BA4\u9884\u89C8 2 \u884C\u5E76\u6E10\u9690\uFF0C\u5C55\u5F00\u540E\u9650\u9AD8\u6EDA\u52A8 */
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
/* \u2500\u2500 \u62A5\u544A\u91CC\u7684\u300C\u8FD9\u4E00\u6B65\u600E\u4E48\u6765\u7684\u300D\uFF1A\u52A8\u4F5C\u6B65\u9AA4 / \u547D\u4EE4 / \u51ED\u636E / \u96A7\u9053 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
/* \u2500\u2500 \u5168\u94FE\u8DEF\u653B\u51FB\u8DEF\u5F84\u56FE \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
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
/* \u6309\u670D\u52A1\u5C01\u9876/\u81EA\u5EFA\u800C\u4E0D\u8BA1\u5206\u7684\u547D\u4E2D\uFF1A\u5206\u503C\u6807\u7070\uFF08+0\uFF09\uFF0C\u907F\u514D\u770B\u7740\u50CF\u53C8\u52A0\u4E86\u5206 */
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
/* \u6A2A\u5411\u8DEF\u5F84\u56FE */
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
/* \u8D44\u4EA7\u4E0E\u5185\u5BB9\u90FD\u81EA\u9002\u5E94\u6362\u884C\uFF1A\u957F\u57DF\u540D/\u957F\u53E3\u4EE4/\u957F\u7ED3\u679C\u4E00\u5F8B\u6362\u884C\u663E\u793A\uFF0C\u4E0D\u622A\u65AD\u6210\u7701\u7565\u53F7 */
.rt-hit-asset{font-family:ui-monospace,Menlo,monospace;font-weight:600;flex:0 1 auto;max-width:100%;
  overflow-wrap:anywhere;word-break:break-word}
.rt-hit-txt{flex:1 1 100%;color:var(--dsw-alias-label-primary);line-height:1.55;
  white-space:pre-wrap;overflow-wrap:anywhere;word-break:break-word}
.rt-hit-txt.none{color:var(--dsw-alias-state-error-primary)}
.rt-hit-row .rt-hit-time{flex:none;margin-left:auto}
/* \u81EA\u5DF1\u6CE8\u518C/\u81EA\u5EFA\u7684\u8D26\u53F7\uFF1A\u7559\u75D5\u4F46\u4E0D\u8BA1\u5206\uFF0C\u6574\u884C\u538B\u6697 */
.rt-hit-row.self-created{opacity:.72;border-left:3px solid #ef444488}
/* \u540C\u4E00\u8D44\u4EA7\u540C\u4E00\u7AEF\u53E3\u7684\u91CD\u590D\u8D26\u53F7/\u5E93\u6743\u9650\uFF1A\u670D\u52A1\u5DF2\u62FF\u6EE1\uFF0C\u4E0D\u8BA1\u5206\uFF08\u53EA\u4F5C\u7559\u75D5\uFF09 */
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
/* \u6298\u53E0\u540E\u4ECD\u8981\u80FD\u4E00\u773C\u770B\u5230"\u8FD9\u4E00\u9636\u6BB5\u62FF\u4E86\u591A\u5C11\u5206"\uFF0C\u6240\u4EE5\u5206\u6570\u7559\u5728\u5934\u4E0A */
.rt-rep-pts{font-size:11px;font-weight:600;padding:1px 6px;border-radius:5px;border:1px solid transparent;flex:none}
.rt-rep-body{padding-left:6px}
/* \u2500\u2500 \u77E5\u8BC6\u5E93\uFF08POC/EXP\uFF09 \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500 */
.rt-kb-filter{display:flex;align-items:center;gap:7px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
/* \u77E5\u8BC6\u5E93\u5F52\u7C7B\u603B\u89C8\uFF1A\u4E00\u884C\u6807\u7B7E\uFF0C\u70B9\u4E00\u4E0B\u6309\u8BE5\u7C7B\u7B5B\u9009 */
.rt-kb-cats{display:flex;flex-wrap:wrap;gap:6px;padding:8px 10px;border-bottom:1px solid var(--dsw-alias-border-l1)}
/* \u77E5\u8BC6\u5E93\u5206\u7EC4\u6807\u9898\uFF08\u6309\u5F52\u7C7B\u5206\u7EC4\u65F6\u6BCF\u7EC4\u4E00\u6761\uFF09 */
.rt-kb-cat{display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--dsw-alias-bg-layer-2);
  border-bottom:1px solid var(--dsw-alias-border-l1);position:sticky;top:0;z-index:1}
.rt-kb-cat-name{font-weight:600;font-size:12.5px}
/* \u6280\u80FD\u53EF\u7528\u6027\u5FBD\u7AE0\uFF08\u6280\u80FD\u5E93\u9875\u7B7E\uFF09 */
.rt-avail{display:inline-block;padding:0 5px;border-radius:4px;font-size:10.5px;white-space:nowrap;
  border:1px solid var(--dsw-alias-border-l1);color:var(--dsw-alias-label-secondary)}
.rt-avail-available{color:#10b981;border-color:#10b98155;background:#10b9811a}
.rt-avail-broken{color:#ef4444;border-color:#ef444455;background:#ef44441a}
.rt-avail-unknown{color:#94a3b8;border-color:#94a3b855;background:#94a3b81a}
/* \u7248\u672C / \u66F4\u65B0\u5F39\u7A97 */
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
/* \u672C\u673A nuclei \u6A21\u677F\u547D\u4E2D\uFF1A\u8DEF\u5F84\u8981\u80FD\u5B8C\u6574\u770B\u5230\uFF08\u590D\u5236\u6210\u547D\u4EE4\u76F4\u63A5\u8DD1\uFF09 */
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
    rce: "\u8FDC\u7A0B\u547D\u4EE4\u6267\u884C",
    deserialization: "\u53CD\u5E8F\u5217\u5316",
    "file-upload": "\u6587\u4EF6\u4E0A\u4F20 getshell",
    sqli: "SQL \u6CE8\u5165",
    unauthorized: "\u672A\u6388\u6743\u8BBF\u95EE",
    "auth-bypass": "\u8BA4\u8BC1\u7ED5\u8FC7 / \u8D8A\u6743",
    "weak-password": "\u5F31\u53E3\u4EE4 / \u7206\u7834",
    ssrf: "SSRF",
    xxe: "XXE",
    "path-traversal": "\u76EE\u5F55\u7A7F\u8D8A / \u4EFB\u610F\u6587\u4EF6\u8BFB",
    "info-leak": "\u4FE1\u606F\u6CC4\u9732",
    privesc: "\u63D0\u6743 / \u6A2A\u5411",
    tunnel: "\u96A7\u9053 / \u4EE3\u7406",
    other: "\u5176\u5B83"
  };
  const POC_CAT_ORDER = Object.keys(POC_CAT_NAME);
  const ROLE_LABEL = {
    plan: "\u4E3B\u4F1A\u8BDD\uFF08\u6307\u6325\uFF09",
    recon: "\u4FE1\u606F\u6536\u96C6",
    assess: "\u8D44\u4EA7\u68B3\u7406",
    "vuln-scan": "\u6F0F\u6D1E\u53D1\u73B0",
    exploit: "\u6F0F\u6D1E\u5229\u7528",
    internal: "\u5185\u7F51\u6E17\u900F"
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
  const SHOT_KIND = { screenshot: "\u73B0\u573A\u622A\u56FE", card: "\u8BB0\u5F55\u751F\u6210\u7684\u8BC1\u636E\u6458\u5F55" };
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
        "\u8F7D\u5165\u4E2D\u2026"
      ) : h2("img", {
        className: "rt-shot-thumb",
        src,
        alt: shot.label || "\u8BC1\u636E " + shot.id,
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
            title: card ? "\u7531\u5F53\u65E5\u8BB0\u5F55\u751F\u6210\u7684\u8BC1\u636E\u6458\u5F55\uFF0C\u4E0D\u662F\u73B0\u573A\u622A\u56FE \u2014\u2014 \u62A5\u544A\u91CC\u540C\u6837\u4F1A\u6807\u6CE8" : "\u73B0\u573A\u622A\u56FE"
          },
          SHOT_KIND[shot.kind] || shot.kind || "\u8BC1\u636E"
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
          (shot.label || shot.target || "") + (card ? "\u3000\xB7\u3000\u7531\u5F53\u65E5\u8BB0\u5F55\u751F\u6210\uFF08\u975E\u73B0\u573A\u622A\u56FE\uFF09" : "") + (shot.captured_at ? "\u3000\xB7\u3000" + fmt(shot.captured_at) : "") + "\u3000\xB7\u3000\u70B9\u51FB\u4EFB\u610F\u5904\u5173\u95ED"
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
        h2("b", null, title || "\u8BC1\u636E\u622A\u56FE"),
        h2(
          "span",
          { className: "rt-shots-n" },
          "\u663E\u793A " + list.length + " \u5F20" + (total && total > list.length ? "\uFF08\u8BE5\u5F97\u5206\u70B9\u5171 " + total + " \u5F20\uFF0C\u53D6\u4EE3\u8868\u56FE\uFF09" : "")
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
  const provLabel = (p) => p === "passive" ? "\u88AB\u52A8" : p === "active" ? "\u4E3B\u52A8" : "\u672A\u77E5";
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
    const message = okFlag ? "\u5DF2\u590D\u5236\uFF1A" + label : "\u590D\u5236\u5931\u8D25\uFF08\u6D4F\u89C8\u5668\u672A\u6388\u6743\u526A\u8D34\u677F\uFF09\u2014\u2014 \u8BF7\u624B\u52A8\u9009\u4E2D\u6587\u672C\u590D\u5236";
    if (typeof onResult === "function") onResult(okFlag, message);
    return okFlag;
  };
  function ProvTag(props) {
    if (!props.p) return h2("span", { className: "rt-tag" }, "\u672A\u77E5");
    return h2(
      "span",
      { className: "rt-tag rt-tag-" + props.p },
      provLabel(props.p)
    );
  }
  const TEST_LABEL = {
    untested: "\u672A\u6D4B\u8BD5",
    testing: "\u6D4B\u8BD5\u4E2D",
    tested: "\u5DF2\u6D4B\u8BD5",
    blocked: "\u88AB\u5C01\u7981",
    abandoned: "\u5DF2\u653E\u5F03",
    no_surface: "\u65E0\u653B\u51FB\u9762"
  };
  const PRI_LABEL = { high: "\u9AD8", medium: "\u4E2D", low: "\u4F4E" };
  function PriTag(props) {
    if (!props.p) return h2("span", { className: "rt-tag" }, "\u672A\u8BC4");
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
              error: r && r.error || "\u67E5\u8BE2\u5931\u8D25",
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
              label: "\u5168\u90E8 C \u6BB5",
              expanded: cidr === null && view !== "testing"
            }
          )
        ),
        h2("div", { className: "rt-seg-cidr" }, "\u5168\u90E8 C \u6BB5"),
        h2("div", { className: "rt-seg-meta" }, segs.length + " \u4E2A\u7F51\u6BB5")
      )
    );
    sideChildren.push(
      h2(
        "div",
        Object.assign(
          {
            key: "testing",
            className: "rt-seg" + (view === "testing" ? " on" : ""),
            title: "\u6B63\u5728\u8DD1\u7684\u626B\u63CF / \u63A2\u6D4B\u4E0E\u8FDB\u5EA6\uFF085 \u79D2\u81EA\u52A8\u5237\u65B0\uFF09"
          },
          clickable(
            () => {
              setView("testing");
              setCidr(null);
            },
            { label: "\u5F53\u524D\u6D4B\u8BD5", expanded: view === "testing" }
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
              title: "\u5F53\u524D\u6D4B\u8BD5\uFF08\u65E2\u975E\u5185\u7F51\u4E5F\u975E\u5916\u7F51\uFF09"
            },
            "\u6D4B"
          ),
          h2("span", { style: { flex: 1 } }, "\u5F53\u524D\u6D4B\u8BD5")
        ),
        h2("div", { className: "rt-seg-meta" }, "\u6B63\u5728\u8DD1\u7684\u626B\u63CF\u4E0E\u63A2\u6D4B")
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
            title: (open ? "\u6536\u8D77\u672C\u7EC4" : "\u5C55\u5F00\u672C\u7EC4") + "\uFF08\u5E76\u5207\u56DE\u8D44\u4EA7\u5217\u8868\uFF09",
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
            kind === "internal" ? "\u5185\u7F51" : "\u5916\u7F51"
          ),
          h2("span", null, title + " \xB7 " + list.length + " \u4E2A C \u6BB5"),
          h2("span", { className: "rt-spacer" }),
          h2(
            "span",
            { style: { fontWeight: 400 } },
            list.reduce((n, x) => n + (x.assets || 0), 0) + " \u8D44\u4EA7"
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
                title: (s.org || "\u672A\u77E5\u5F52\u5C5E") + " \xB7 \u5B58\u6D3B " + (s.live || 0) + "/" + (s.assets || 0) + " \u53F0"
              },
              clickable(
                () => {
                  setView("list");
                  setCidr(s.cidr);
                },
                {
                  label: "\u7B5B\u9009 C \u6BB5 " + s.cidr,
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
                kind === "internal" ? "\u5185" : "\u5916"
              ),
              h2("span", { style: { flex: 1 } }, s.cidr),
              h2(
                "span",
                {
                  className: "rt-seg-meta",
                  style: { margin: 0, whiteSpace: "nowrap" }
                },
                s.assets + " \u53F0"
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
      sideChildren.push(...segBlock("\u5916\u7F51\u8D44\u4EA7", segExternal, "external"));
    if (segInternal.length)
      sideChildren.push(...segBlock("\u5185\u7F51\u8D44\u4EA7", segInternal, "internal"));
    const side = h2("div", { className: "rt-side" }, sideChildren);
    const toolbar = h2(
      "div",
      { className: "rt-toolbar" },
      h2("input", {
        className: "rt-input",
        style: { flex: "1 1 150px" },
        placeholder: "\u641C\u7D22 IP / \u57DF\u540D / \u6307\u7EB9\uFF08\u56DE\u8F66\uFF09",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setQApplied(q);
        }
      }),
      h2(
        "button",
        { className: "rt-btn", onClick: () => setQApplied(q) },
        "\u641C\u7D22"
      ),
      h2("input", {
        className: "rt-input",
        style: { width: "78px" },
        placeholder: "\u670D\u52A1",
        value: service,
        onChange: (e) => setService(e.target.value)
      }),
      h2("input", {
        className: "rt-input",
        style: { width: "60px" },
        placeholder: "\u7AEF\u53E3",
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
        h2("option", { value: "" }, "\u5185\u5916\u7F51\u4E0D\u9650"),
        h2("option", { value: "external" }, "\u4EC5\u5916\u7F51\u8D44\u4EA7"),
        h2("option", { value: "internal" }, "\u4EC5\u5185\u7F51\u8D44\u4EA7")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: prov,
          onChange: (e) => setProv(e.target.value),
          title: "\u6309\u7AEF\u53E3\u6765\u6E90\u8FC7\u6EE4\uFF08\u5217\u8868\u5DF2\u4E0D\u518D\u5355\u5217\u663E\u793A\uFF0C\u8BE6\u60C5\u91CC\u53EF\u89C1\uFF09"
        },
        h2("option", { value: "" }, "\u6765\u6E90\u4E0D\u9650"),
        h2("option", { value: "passive" }, "\u4EC5\u88AB\u52A8"),
        h2("option", { value: "active" }, "\u4EC5\u4E3B\u52A8")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: priority,
          onChange: (e) => setPriority(e.target.value)
        },
        h2("option", { value: "" }, "\u6613\u6253\u6027\u4E0D\u9650"),
        h2("option", { value: "high" }, "\u6613\u6253\uFF08\u9AD8\uFF09"),
        h2("option", { value: "medium" }, "\u4E00\u822C\uFF08\u4E2D\uFF09"),
        h2("option", { value: "low" }, "\u96BE\u6253\uFF08\u4F4E\uFF09")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: testStatus,
          onChange: (e) => setTestStatus(e.target.value)
        },
        h2("option", { value: "" }, "\u6D4B\u8BD5\u72B6\u6001\u4E0D\u9650"),
        h2("option", { value: "untested" }, "\u672A\u6D4B\u8BD5"),
        h2("option", { value: "testing" }, "\u6D4B\u8BD5\u4E2D"),
        h2("option", { value: "tested" }, "\u5DF2\u6D4B\u8BD5"),
        h2("option", { value: "blocked" }, "\u88AB\u5C01\u7981"),
        h2("option", { value: "abandoned" }, "\u5DF2\u653E\u5F03"),
        h2("option", { value: "no_surface" }, "\u65E0\u653B\u51FB\u9762")
      ),
      h2("div", { className: "rt-spacer" }),
      h2(
        "button",
        {
          className: "rt-btn",
          title: "\u91CD\u65B0\u62C9\u53D6\u5FEB\u7167\u4E0E\u5F53\u524D\u89C6\u56FE\u6570\u636E",
          onClick: () => {
            if (onRefresh) onRefresh();
          }
        },
        "\u5237\u65B0"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "list" ? " rt-btn-primary" : ""),
          onClick: () => setView("list")
        },
        "\u5217\u8868"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "timeline" ? " rt-btn-primary" : ""),
          title: "\u6309\u53D1\u73B0\u65F6\u95F4\u770B\u8D44\u4EA7\uFF08\u4EC0\u4E48\u65F6\u5019\u53D1\u73B0\u3001\u54EA\u5929\u6536\u4E86\u591A\u5C11\uFF09",
          onClick: () => setView("timeline")
        },
        "\u53D1\u73B0\u65F6\u95F4"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (view === "domain" ? " rt-btn-primary" : ""),
          onClick: () => setView("domain")
        },
        "\u57DF\u540D"
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
          title: "\u70B9\u51FB\u7B5B\u9009 / \u518D\u70B9\u53D6\u6D88"
        },
        clickable(onClick, {
          label: "\u6309\u300C" + label + "\u300D\u7B5B\u9009\uFF08" + (value || 0) + "\uFF09",
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
      conclItem("all", "\u53F0\u8D44\u4EA7", snapStats.assets, noFilter, () => {
        setTestStatus("");
        setPriority("");
        setScope("");
        setProv("");
        setAssetState("");
        setCidr(null);
      }),
      conclItem(
        "live",
        "\u5B58\u6D3B",
        snapStats.liveAssets,
        assetState === "live",
        () => {
          setAssetState((v) => v === "live" ? "" : "live");
          setTestStatus("");
        }
      ),
      conclItem(
        "untested",
        "\u5F85\u6D4B",
        tests.untested,
        testStatus === "untested",
        () => toggleTest("untested")
      ),
      conclItem(
        "testing",
        "\u6D4B\u8BD5\u4E2D",
        tests.testing,
        testStatus === "testing",
        () => toggleTest("testing")
      ),
      conclItem(
        "tested",
        "\u5DF2\u6D4B",
        tests.tested,
        testStatus === "tested",
        () => toggleTest("tested")
      ),
      conclItem(
        "giveup",
        "\u653E\u5F03",
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
          title: "\u5217\u8868\u6392\u5E8F\u65B9\u5F0F"
        },
        h2("option", { value: "priority" }, "\u6392\u5E8F\uFF1A\u6613\u6253\u6027\u4F18\u5148"),
        h2("option", { value: "todo" }, "\u6392\u5E8F\uFF1A\u5F85\u6D4B\u4F18\u5148"),
        h2("option", { value: "discovered" }, "\u6392\u5E8F\uFF1A\u6700\u8FD1\u53D1\u73B0\u4F18\u5148"),
        h2("option", { value: "ports" }, "\u6392\u5E8F\uFF1A\u7AEF\u53E3\u591A\u4F18\u5148"),
        h2("option", { value: "ip" }, "\u6392\u5E8F\uFF1A\u6309 IP")
      )
    );
    const head = h2(
      "div",
      { className: "rt-row head" },
      h2("span", null, "IP"),
      h2("span", null, "\u6613\u6253"),
      h2("span", null, "\u6D4B\u8BD5\u72B6\u6001"),
      h2("span", null, "\u5F00\u653E\u7AEF\u53E3 / \u670D\u52A1"),
      h2("span", null, "\u6307\u7EB9")
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
              label: "\u5C55\u5F00\u8D44\u4EA7 " + it.ip,
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
              it.scope === "internal" ? "\u5185" : "\u5916"
            ),
            h2("span", {
              title: it.state === "live" ? "\u5B58\u6D3B" : String(it.state),
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
            /* 发现时间挂在 IP 下面一行：IP 列宽度有限，不另开列（列宽一改整表要跟着调） */
            h2(
              "span",
              {
                style: {
                  fontSize: 10.5,
                  color: "var(--dsw-alias-label-secondary)",
                  whiteSpace: "nowrap"
                },
                title: "\u53D1\u73B0\u65F6\u95F4\uFF1A" + (it.discovered_at ? fmt(it.discovered_at) : "\u672A\u8BB0\u5F55") + (it.last_seen ? "\n\u6700\u8FD1\u91C7\u96C6\uFF1A" + fmt(it.last_seen) : "")
              },
              it.discovered_at ? fmtShort(it.discovered_at) : "\u53D1\u73B0\u65F6\u95F4\u672A\u77E5"
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
              "\u5C01" + it.blocked_count
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
                [p.service, p.product, p.version].filter(Boolean).join(" ") || "\u672A\u77E5\u670D\u52A1"
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
                [f.vendor, f.product, f.version].filter(Boolean).join(" ") + (f.evidence ? "\uFF08" + f.evidence + "\uFF09" : "")
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
                (o.value || "") + " \xB7 " + (o.tool || "\u672A\u77E5\u5DE5\u5177") + " \xB7 " + fmt(o.collected_at)
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
        /* 必读三行 */
        h2(
          "div",
          { className: "rt-kv" },
          h2("b", null, "\u6D4B\u8BD5"),
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
              "\u88AB\u5C01 " + d.blocked_count + " \u6B21"
            ) : null,
            h2(
              "span",
              {
                style: {
                  marginLeft: 8,
                  color: "var(--dsw-alias-label-secondary)"
                }
              },
              (d.test_updated_at ? fmt(d.test_updated_at) : "\u672A\u6D4B\u8FC7") + (d.test_updated_by ? " \xB7 " + d.test_updated_by : "")
            )
          )
        ),
        h2(
          "div",
          { className: "rt-kv" },
          h2("b", null, "\u6613\u6253\u6027"),
          h2(
            "span",
            null,
            h2(PriTag, { p: d.priority }),
            h2(
              "span",
              { style: { marginLeft: 8 } },
              d.potential || "\u672A\u8BC4\u4F30"
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
          h2("b", null, "\u653B\u51FB\u9762"),
          h2(
            "span",
            null,
            d.test_surface || (portRows.length ? "\u672A\u8BB0\u5F55\uFF08\u5F00\u653E\u7AEF\u53E3\u89C1\u4E0B\uFF09" : "\u65E0\u5F00\u653E\u7AEF\u53E3"),
            d.scope ? h2(
              "span",
              {
                className: "rt-scope rt-scope-" + (d.scope === "internal" ? "internal" : "external"),
                style: { marginLeft: 8 }
              },
              d.scope === "internal" ? "\u5185\u7F51\u8D44\u4EA7" : "\u5916\u7F51\u8D44\u4EA7"
            ) : null
          )
        ),
        h2(
          "span",
          Object.assign(
            { className: "rt-more" },
            clickable(() => setShowAll(all ? null : it.id), {
              label: all ? "\u6536\u8D77\u8D44\u4EA7\u8BE6\u60C5" : "\u5C55\u5F00\u8D44\u4EA7\u8BE6\u60C5",
              expanded: all
            })
          ),
          all ? "\u6536\u8D77\u5168\u90E8 \u25B2" : "\u5C55\u5F00\u5168\u90E8\uFF08\u7AEF\u53E3 \xB7 \u6307\u7EB9 \xB7 \u91C7\u96C6\u6EAF\u6E90 \xB7 \u6D4B\u8BD5\u8BB0\u5F55\uFF09\u25BC"
        ),
        all ? h2(
          "div",
          null,
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u4E3B\u673A\u540D"),
            h2(
              "span",
              null,
              (d.names || []).map((n) => n.name).join(", ") || "\u2014"
            )
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u53D1\u73B0\u65F6\u95F4"),
            h2(
              "span",
              {
                title: '\u672C\u6761\u8D44\u4EA7\u7B2C\u4E00\u6B21\u8FDB\u5165\u8D44\u4EA7\u5E93\u7684\u65F6\u523B\uFF08\u91CD\u590D\u91C7\u96C6\u53EA\u5237\u65B0"\u6700\u8FD1\u91C7\u96C6"\uFF09'
              },
              fmt(d.discovered_at)
            ),
            h2(
              "b",
              { style: { minWidth: 0, marginLeft: 8 } },
              "\u6700\u8FD1\u91C7\u96C6"
            ),
            h2("span", null, fmt(d.last_seen)),
            h2(
              "b",
              { style: { minWidth: 0, marginLeft: 8 } },
              "\u6570\u636E\u6E90\u9996\u89C1"
            ),
            h2("span", null, fmt(d.first_seen))
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "C \u6BB5"),
            h2("span", null, d.segment_cidr)
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u6613\u6253\u6027"),
            h2(
              "span",
              null,
              (d.priority || "\u672A\u8BC4\u4F30") + (d.potential ? " \xB7 \u9884\u671F\uFF1A" + d.potential : "") + (d.assess_reason ? " \xB7 \u4F9D\u636E\uFF1A" + d.assess_reason : "") + (d.assessed_at ? "\uFF08" + fmt(d.assessed_at) + "\uFF09" : "")
            )
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u6765\u6E90"),
            h2(
              "span",
              null,
              "\u88AB\u52A8\u7AEF\u53E3 " + (d.passive || 0) + " \xB7 \u4E3B\u52A8\u7AEF\u53E3 " + (d.active || 0)
            )
          ),
          h2(
            "div",
            { style: { margin: "6px 0 3px", fontWeight: 600 } },
            "\u5F00\u653E\u7AEF\u53E3 / \u670D\u52A1"
          ),
          h2("div", null, portRows.length ? portRows : "\u2014"),
          h2(
            "div",
            { style: { margin: "6px 0 3px", fontWeight: 600 } },
            "\u6307\u7EB9"
          ),
          h2("div", null, fpRows.length ? fpRows : "\u2014"),
          noteLines.length ? h2(Clip, {
            key: "notes",
            label: "\u6D4B\u8BD5\u8BB0\u5F55\uFF08" + noteLines.length + " \u6761\uFF09",
            text: noteLines.join("\n")
          }) : null,
          h2(
            "div",
            { style: { margin: "6px 0 3px", fontWeight: 600 } },
            "\u91C7\u96C6\u6EAF\u6E90\uFF08\u6700\u8FD1 8 \u6761\uFF09"
          ),
          h2("div", null, obsRows.length ? obsRows : "\u2014")
        ) : null
      ) : h2("div", null, "\u52A0\u8F7D\u4E2D\u2026");
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
      !state.loading && !state.items.length ? h2("div", { className: "rt-empty" }, "\u6CA1\u6709\u5339\u914D\u7684\u8D44\u4EA7") : null
    );
    const domainPane = h2(
      "div",
      { className: "rt-table" },
      domains === null ? h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026") : domains.length ? domains.map(
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
              g.count + " \u4E2A\u8D44\u4EA7"
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
                  a.state === "live" ? "\u5B58\u6D3B" : a.state
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
        cidr ? "\u8BE5 C \u6BB5\u4E0B\u6682\u65E0\u57DF\u540D\uFF08\u5207\u6362\u5230\u300C\u5168\u90E8 C \u6BB5\u300D\u770B\u5168\u91CF\uFF09" : "\u6682\u65E0\u57DF\u540D\u6570\u636E\uFF08\u4FE1\u606F\u6536\u96C6\u9636\u6BB5\u4F1A\u5199\u5165\u57DF\u540D\uFF09"
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
        h2("span", null, "URL\uFF08\u53EF\u70B9\u51FB\uFF09"),
        h2("span", null, "\u6807\u9898"),
        h2("span", null, "\u8D44\u4EA7"),
        h2("span", null, "\u670D\u52A1")
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
      web === null ? h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026") : !web.length ? h2(
        "div",
        { className: "rt-empty" },
        cidr ? "\u8BE5 C \u6BB5\u4E0B\u6682\u65E0 Web \u8D44\u4EA7" : "\u6682\u65E0 Web \u8D44\u4EA7\uFF08HTTP \u63A2\u6D4B\u540E\u4F1A\u5199\u5165 URL \u4E0E\u6807\u9898\uFF09"
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
          if (!r || r.ok === false) setErr(r && r.error || "\u52A0\u8F7D\u5931\u8D25");
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
    if (!data) return h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026");
    const recent = (data.recent || []).filter(
      (a) => day === "" || String(a.discovered_at || "").slice(0, 10) === day
    );
    return h2(
      "div",
      { className: "rt-pane", style: { flex: 1, minHeight: 0 } },
      h2(
        "div",
        { className: "rt-card" },
        h2("h4", null, "\u8D44\u4EA7\u53D1\u73B0\u65F6\u95F4\u7EBF"),
        h2(
          "div",
          {
            style: { fontSize: 12, color: "var(--dsw-alias-label-secondary)" }
          },
          "\u5171 " + (data.span && data.span.total || 0) + " \u53F0 \xB7 \u6700\u65E9 " + (data.span && data.span.first ? fmt(data.span.first) : "\u2014") + " \xB7 \u6700\u8FD1 " + (data.span && data.span.last ? fmt(data.span.last) : "\u2014") + '\uFF08\u53D1\u73B0\u65F6\u95F4 = \u7B2C\u4E00\u6B21\u8FDB\u5165\u8D44\u4EA7\u5E93\u7684\u65F6\u523B\uFF1B\u91CD\u590D\u91C7\u96C6\u53EA\u5237\u65B0"\u6700\u8FD1\u91C7\u96C6"\uFF09'
        )
      ),
      (data.days || []).length === 0 ? h2("div", { className: "rt-empty" }, "\u8FD8\u6CA1\u6709\u8D44\u4EA7\u3002") : null,
      h2(
        "div",
        { className: "rt-card" },
        h2(
          "h4",
          null,
          "\u6309\u5929\u7EDF\u8BA1",
          day ? h2(
            "span",
            Object.assign(
              {
                className: "rt-tag",
                style: { marginLeft: 6, cursor: "pointer" }
              },
              clickable(() => setDay(""), {
                label: "\u6E05\u9664\u6309\u5929\u7B5B\u9009\uFF1A" + day
              })
            ),
            "\u6E05\u9664\u7B5B\u9009\uFF1A" + day
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
                  title: d.day + "\uFF1A\u65B0\u589E " + d.assets + " \u53F0\uFF08\u5185\u7F51 " + d.internal + " / \u5916\u7F51 " + d.external + "\uFF09"
                },
                clickable(() => setDay(day === d.day ? "" : d.day), {
                  label: "\u7B5B\u9009 " + d.day + " \u53D1\u73B0\u7684\u8D44\u4EA7",
                  expanded: day === d.day
                })
              ),
              h2("div", { className: "rt-seg-cidr" }, d.day),
              h2(
                "div",
                { className: "rt-seg-meta" },
                d.assets + " \u53F0 \xB7 \u5185 " + d.internal + " / \u5916 " + d.external
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
          day ? day + " \u53D1\u73B0\u7684\u8D44\u4EA7\uFF08" + recent.length + "\uFF09" : "\u6700\u8FD1\u53D1\u73B0\u7684\u8D44\u4EA7\uFF08" + recent.length + "\uFF09"
        ),
        recent.length === 0 ? h2("div", { className: "rt-empty" }, "\u8FD9\u4E00\u5929\u6CA1\u6709\u65B0\u589E\u8D44\u4EA7\u3002") : null,
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
                a.scope === "internal" ? "\u5185" : "\u5916"
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
              a.discovered_at ? fmt(a.discovered_at) : "\u65F6\u95F4\u672A\u77E5"
            ),
            h2(
              "span",
              { style: { flex: 1 } },
              (a.primary_name || "\u2014") + (a.open_ports ? " \xB7 " + a.open_ports + " \u7AEF\u53E3" : "")
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
            setMsg({ err: r && r.error || "\u8BFB\u53D6\u5931\u8D25" });
            return;
          }
          setRoles(r.roles || []);
          if (r.roles && r.roles.length)
            setActive((cur2) => cur2 || r.roles[0].role);
          if (r.builtin)
            setMsg({
              ok: "\u5F53\u524D\u4E3A\u5185\u7F6E\u9ED8\u8BA4\u63D0\u793A\u8BCD\uFF08\u521B\u5EFA\u9776\u6807\u540E\u53EF\u6309\u9776\u6807\u4FDD\u5B58\u4FEE\u6539\uFF09"
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
        setMsg({ err: "\u8BF7\u5148\u521B\u5EFA\u9776\u6807\uFF0C\u518D\u4FDD\u5B58\u63D0\u793A\u8BCD" });
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
            setMsg({ err: r && r.error || "\u4FDD\u5B58\u5931\u8D25" });
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
          setMsg({ ok: "\u5DF2\u4FDD\u5B58" });
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String(e && e.message || e) });
        }
      );
    };
    const reset = (all) => {
      if (!eng) {
        setMsg({ err: "\u8BF7\u5148\u521B\u5EFA\u9776\u6807\uFF0C\u518D\u6062\u590D\u9ED8\u8BA4\u63D0\u793A\u8BCD" });
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
            setMsg({ err: r && r.error || "\u6062\u590D\u5931\u8D25" });
            return;
          }
          setMsg({ ok: "\u5DF2\u6062\u590D\u5185\u7F6E\u9ED8\u8BA4\uFF1A" + (r.reset || []).join("\u3001") });
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
              label: "\u67E5\u770B\u300C" + r.title + "\u300D\u63D0\u793A\u8BCD",
              expanded: active === r.role
            }
          )
        ),
        h2("div", { className: "rt-item-name" }, r.title),
        h2(
          "div",
          { className: "rt-item-desc" },
          (r.content || "").replace(/[#*`]/g, "").slice(0, 60) || "\uFF08\u7A7A\uFF09"
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
          h2("span", { style: { fontWeight: 600 } }, cur ? cur.title : "\u63D0\u793A\u8BCD"),
          h2(
            "span",
            { className: "rt-tag" },
            "\u66F4\u65B0 " + fmt(cur && cur.updated_at)
          ),
          h2("div", { className: "rt-spacer" }),
          h2(
            "button",
            {
              className: "rt-btn",
              disabled: busy || !active,
              title: "\u628A\u5F53\u524D\u89D2\u8272\u6062\u590D\u6210\u5185\u7F6E\u6700\u65B0\u7248\u63D0\u793A\u8BCD",
              onClick: () => reset(false)
            },
            "\u6062\u590D\u9ED8\u8BA4\u4E3A\u5F53\u524D"
          ),
          h2(
            "button",
            {
              className: "rt-btn",
              disabled: busy,
              title: "\u56DB\u4E2A\u89D2\u8272\u5168\u90E8\u6062\u590D\u6210\u5185\u7F6E\u6700\u65B0\u7248\u63D0\u793A\u8BCD",
              onClick: () => reset(true)
            },
            "\u5168\u90E8\u6062\u590D\u9ED8\u8BA4"
          ),
          h2(
            "button",
            {
              className: "rt-btn rt-btn-primary",
              disabled: busy || !active,
              onClick: save
            },
            busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
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
            placeholder: "\u8BE5\u89D2\u8272\u7684\u7CFB\u7EDF\u63D0\u793A\u8BCD\uFF08Markdown\uFF09"
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
            "\u4FDD\u5B58\u540E\u5199\u5165 agents/" + (active || "role") + ".md\u3002\u5B50\u4F1A\u8BDD\u4EFB\u52A1\u7B2C\u4E00\u884C\u5199 redteamRole: recon\u3001assess\u3001vuln-scan\u3001exploit \u6216 internal \u540E\uFF0C\u5BF9\u5E94\u6587\u4EF6\u8FDB\u5165\u7CFB\u7EDF\u63D0\u793A\u8BCD\u3002"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
          else setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
          label: "\u67E5\u770B\u6280\u80FD " + s.name,
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
          "\u4EC5\u4EBA\u5DE5"
        ) : null,
        s.library === "official" ? h2(
          "span",
          {
            className: "rt-tag",
            style: { marginLeft: 6 },
            title: "\u5B98\u65B9\u6280\u80FD\u76EE\u5F55\uFF0C\u4E0D\u6309\u7EA2\u961F\u5DE5\u5177\u8DEF\u5F84\u68C0\u67E5"
          },
          "\u5B98\u65B9"
        ) : h2(
          "span",
          {
            className: "rt-avail rt-avail-" + (s.availability || "unknown"),
            style: { marginLeft: 6 },
            title: s.availability === "available" ? "\u53EF\u7528\uFF1A\u6280\u80FD\u6B63\u6587\u53EF\u4EE5\u52A0\u8F7D\u3002\u7F3A\u7684\u5916\u90E8\u5DE5\u5177\u6216\u5BC6\u94A5\u8BB0\u5728\u8BE6\u60C5\u91CC\uFF0C\u4E0D\u963B\u6B62\u8C03\u7528\u3002" : (s.problems || []).join("\n") || "\u672A\u77E5"
          },
          s.availability === "available" ? "\u53EF\u7528" : s.availability === "broken" ? "\u4E0D\u53EF\u7528" : "\u672A\u77E5"
        ),
        h2(
          "div",
          { className: "rt-item-desc" },
          s.description || "\uFF08\u65E0\u63CF\u8FF0\uFF09"
        ),
        h2(
          "div",
          { className: "rt-kb-sub" },
          [
            s.source ? "\u6765\u6E90 " + s.source : null,
            s.fromPlugin ? "\u672C\u63D2\u4EF6\u81EA\u5E26" : null,
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
          "\u7EA2\u961F\u6280\u80FD"
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
          "\u5B98\u65B9\u6280\u80FD"
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
          placeholder: "\u8FC7\u6EE4\u6280\u80FD",
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
          "\u53EA\u770B\u672C\u63D2\u4EF6\u81EA\u5E26\uFF08" + (meta.fromPlugin || 0) + " \u4E2A\uFF09"
        ),
        availSummary && (availSummary.broken > 0 || availSummary.unknown > 0) ? h2(
          "label",
          {
            className: "rt-kb-check",
            style: { display: "flex", margin: "0 0 8px" },
            title: "\u53EA\u770B\u6709\u660E\u786E\u7F3A\u53E3\uFF08\u7F3A key / \u7F3A\u672C\u673A\u8DEF\u5F84 / \u57FA\u7840\u8BBE\u65BD\u8FD8\u662F\u5360\u4F4D\u7B26\uFF09\u6216\u5224\u4E0D\u4E86\u53EF\u7528\u6027\u7684\u6280\u80FD"
          },
          h2("input", {
            type: "checkbox",
            checked: brokenOnly,
            onChange: (e) => setBrokenOnly(e.target.checked)
          }),
          "\u53EA\u770B\u4E0D\u53EF\u7528/\u672A\u77E5\uFF08" + ((availSummary.broken || 0) + (availSummary.unknown || 0)) + " \u4E2A\uFF09"
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
            "\u53EF\u7528 " + (availSummary.available || 0)
          ),
          availSummary.broken > 0 ? h2(
            "span",
            { className: "rt-avail rt-avail-broken" },
            "\u4E0D\u53EF\u7528 " + availSummary.broken
          ) : null,
          availSummary.unknown > 0 ? h2(
            "span",
            { className: "rt-avail rt-avail-unknown" },
            "\u672A\u77E5 " + availSummary.unknown
          ) : null,
          h2(
            "span",
            Object.assign(
              {
                className: "rt-tag",
                style: { cursor: "pointer" },
                title: "\u6280\u80FD\u6B63\u6587\u6216\u73AF\u5883\u53D8\u91CF\u521A\u6539\u8FC7\uFF1F\u70B9\u8FD9\u91CC\u8DF3\u8FC7 30 \u79D2\u7F13\u5B58\u91CD\u67E5"
              },
              clickable(() => load(true), { label: "\u91CD\u65B0\u68C0\u67E5\u6280\u80FD\u53EF\u7528\u6027" })
            ),
            "\u91CD\u67E5\u53EF\u7528\u6027"
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
          "\u7EA2\u961F " + (meta.libraries && meta.libraries.redteam || 0) + " \xB7 \u5B98\u65B9 " + (meta.libraries && meta.libraries.official || 0),
          items.length > 100 ? h2(
            "div",
            { style: { marginTop: 3 } },
            "\uFF08\u6280\u80FD\u591A\u6765\u81EA\u5176\u5B83\u63D2\u4EF6\u6CE8\u518C\u7684\u6839\u6216\u4F60\u81EA\u5DF1\u7684\u6280\u80FD\u76EE\u5F55\uFF1B\u672C\u63D2\u4EF6\u53EA\u81EA\u5E26 " + (meta.fromPlugin || 0) + " \u4E2A\uFF09"
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
            detail ? detail.name : "\u6280\u80FD\u76EE\u5F55\uFF08DSH \u539F\u751F\uFF09"
          ),
          h2("div", { className: "rt-spacer" }),
          h2(
            "button",
            { className: "rt-btn", disabled: busy, onClick: () => load(true) },
            busy ? "\u5237\u65B0\u4E2D\u2026" : "\u5237\u65B0"
          )
        ),
        err ? needRestart ? h2(
          "div",
          { className: "rt-empty" },
          "\u8BE5\u6A21\u5757\u7684\u5BBF\u4E3B\u4EE3\u7801\u5DF2\u66F4\u65B0\uFF0C\u9700\u91CD\u542F\u4E00\u6B21\u5F53\u524D\u5BBF\u4E3B\uFF08\u5B98\u65B9 exe / \u793E\u533A\u7248 / dsh web\uFF09\u540E\u751F\u6548"
        ) : h2("div", { className: "rt-err" }, err) : null,
        detail ? h2(
          "div",
          { className: "rt-pane" },
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u63CF\u8FF0"),
            h2("span", null, detail.description || "\u2014")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u4F55\u65F6\u4F7F\u7528"),
            h2("span", null, detail.whenToUse || "\u2014")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u6765\u6E90"),
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
                h2("b", null, "\u7C7B\u578B"),
                h2(
                  "span",
                  null,
                  "\u5B98\u65B9\u6280\u80FD\u3002\u7531\u5BBF\u4E3B\u6309\u4EFB\u52A1\u8C03\u7528\uFF0C\u4E0D\u6309\u7EA2\u961F\u5DE5\u5177\u8DEF\u5F84\u68C0\u67E5\u3002"
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
                h2("b", null, "\u53EF\u7528\u6027"),
                h2(
                  "span",
                  { className: "rt-avail rt-avail-" + avail },
                  avail === "available" ? "\u53EF\u7528" : avail === "broken" ? "\u4E0D\u53EF\u7528\uFF08\u6709\u660E\u786E\u7F3A\u53E3\uFF09" : "\u672A\u77E5\uFF08\u6B63\u6587\u8BFB\u4E0D\u5230\uFF09"
                )
              ),
              (s2.problems || []).length > 0 ? h2(
                "div",
                { className: "rt-kv" },
                h2(
                  "b",
                  null,
                  avail === "available" ? "\u672A\u88C5\u4E0A\u7684\u5916\u90E8\u5DE5\u5177" : "\u7F3A\u53E3"
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
                h2("b", null, "\u9700\u8981\u4F60\u63D0\u4F9B"),
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
            h2("b", null, "\u6587\u4EF6"),
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
            detail.content || "\uFF08\u7A7A\uFF09"
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
            meta.note || "\u6280\u80FD\u7531 DSH \u539F\u751F skill \u4F53\u7CFB\u7BA1\u7406\uFF0C\u7EA2\u961F\u667A\u80FD\u4F53\u901A\u8FC7 skill \u5DE5\u5177\u8C03\u7528\u3002"
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
              "\u53EF\u7528 " + (availSummary.available || 0)
            ),
            availSummary.broken > 0 ? h2(
              "span",
              { className: "rt-avail rt-avail-broken" },
              "\u4E0D\u53EF\u7528 " + availSummary.broken
            ) : null,
            availSummary.unknown > 0 ? h2(
              "span",
              { className: "rt-avail rt-avail-unknown" },
              "\u672A\u77E5 " + availSummary.unknown
            ) : null,
            h2(
              "span",
              { style: { color: "var(--dsw-alias-label-secondary)" } },
              "\uFF08" + (meta.availability && meta.availability.cached ? "\u7F13\u5B58\u4E8E " : "\u68C0\u67E5\u4E8E ") + (meta.availability && meta.availability.checked_at ? fmt(meta.availability.checked_at) : "\u2014") + "\uFF09"
            )
          ) : null,
          meta.availability && (meta.availability.broken || []).length > 0 ? h2(
            "div",
            { className: "rt-hint" },
            h2(
              "div",
              { style: { fontWeight: 600, marginBottom: 4 } },
              "\u73B0\u5728\u8DD1\u4E0D\u8D77\u6765\u7684\u6280\u80FD\uFF1A"
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
              d.n + " \u4E2A \xB7 " + d.key
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
            "\u2026\u53E6\u6709 " + ((meta.byDir || []).length - 6) + " \u4E2A\u76EE\u5F55\uFF08\u5171 " + items.length + " \u4E2A\u6280\u80FD\uFF09"
          ) : null,
          h2("div", { className: "rt-empty" }, "\u5DE6\u4FA7\u9009\u62E9\u6280\u80FD\u67E5\u770B\u5185\u5BB9")
        )
      )
    );
  }
  const SEV_LABEL = {
    critical: "\u4E25\u91CD",
    high: "\u9AD8\u5371",
    medium: "\u4E2D\u5371",
    low: "\u4F4E\u5371",
    info: "\u4FE1\u606F"
  };
  const STATUS_LABEL = {
    candidate: "\u5F85\u9A8C\u8BC1",
    confirmed: "\u5DF2\u786E\u8BA4",
    "false-positive": "\u8BEF\u62A5",
    exploited: "\u5DF2\u5229\u7528",
    fixed: "\u5DF2\u4FEE\u590D"
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
    return v.asset_ip || "(\u672A\u6307\u5B9A\u76EE\u6807)";
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
            "\u8BC1\u636E\u6458\u8981",
            h2("span", { className: "rt-tag" }, looksHttp ? "\u539F\u59CB\u62A5\u6587" : "\u6587\u672C"),
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
              "\u590D\u5236"
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
            e.label || "HTTP \u8BC1\u636E",
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
              "\u25B8 \u8BF7\u6C42\uFF08\u53EF\u76F4\u63A5\u7C98\u8FDB Burp Repeater\uFF09"
            ),
            h2(HttpBlock, { text: e.request, compact: true })
          ) : null,
          e.response ? h2(
            "div",
            null,
            h2("div", { className: "rt-evi-head" }, "\u25B8 \u54CD\u5E94"),
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
          h2("b", null, "\u8BC1\u636E"),
          h2(
            "span",
            { style: { color: "var(--dsw-alias-state-error-primary)" } },
            "\u7F3A\u5931 \u2014\u2014 \u672A\u9A8C\u8BC1/\u65E0\u8BC1\u636E\u7684\u6F0F\u6D1E\u4E0D\u8BA1\u5165\u62A5\u544A\uFF0C\u8BF7\u8865 redteam_http_evidence_add"
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
              error: r && r.error || "\u67E5\u8BE2\u5931\u8D25",
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
            setMsg({ err: r && r.error || "\u66F4\u65B0\u5931\u8D25" });
            return;
          }
          setMsg({ ok: "\u5DF2\u66F4\u65B0\u4E3A\u300C" + (STATUS_LABEL[next] || next) + "\u300D" });
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
          title: "\u70B9\u51FB\u7B5B\u9009 / \u518D\u70B9\u53D6\u6D88"
        },
        clickable(onClick, {
          label: "\u6309\u300C" + label + "\u300D\u7B5B\u9009\uFF08" + (value || 0) + "\uFF09",
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
        "\u5DF2\u786E\u8BA4",
        stats.byStatus.confirmed || 0,
        status === "confirmed",
        () => setStatus((v) => v === "confirmed" ? "" : "confirmed")
      ),
      concl(
        "exp",
        "\u5DF2\u5229\u7528",
        stats.byStatus.exploited || 0,
        status === "exploited",
        () => setStatus((v) => v === "exploited" ? "" : "exploited")
      ),
      concl(
        "crit",
        "\u4E25\u91CD",
        stats.bySeverity.critical || 0,
        sev === "critical",
        () => setSev((v) => v === "critical" ? "" : "critical")
      ),
      concl(
        "high",
        "\u9AD8\u5371",
        stats.bySeverity.high || 0,
        sev === "high",
        () => setSev((v) => v === "high" ? "" : "high")
      ),
      concl(
        "med",
        "\u4E2D\u5371",
        stats.bySeverity.medium || 0,
        sev === "medium",
        () => setSev((v) => v === "medium" ? "" : "medium")
      ),
      concl("gain", "\u62FF\u5230\u6743\u9650", stats.withGained || 0, false, () => {
      }),
      h2("div", { className: "rt-spacer" }),
      h2(
        "span",
        { style: { fontSize: 11, color: "var(--dsw-alias-label-secondary)" } },
        "\u9ED8\u8BA4\u6309\u76EE\u6807\u805A\u5408 \xB7 \u5171 " + (stats.targetGroups || 0) + " \u4E2A\u76EE\u6807"
      )
    );
    const head = h2(
      "div",
      { className: "rt-vrow head" },
      h2("span", null, "\u7B49\u7EA7"),
      h2("span", null, "\u6F0F\u6D1E / \u7F16\u53F7"),
      h2("span", null, "\u76EE\u6807"),
      h2("span", null, "\u62FF\u5230\u4EC0\u4E48"),
      h2("span", null, "\u72B6\u6001"),
      h2("span", null, "\u7F6E\u4FE1")
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
              h2("b", null, "\u62FF\u5230\u4EC0\u4E48"),
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
                "\u672A\u8BB0\u5F55 \u2014\u2014 \u62FF\u5230\u6743\u9650/\u6210\u679C\u540E\u8BF7\u7528 redteam_vuln_update \u8865 gained\uFF08\u4F8B\uFF1A\u670D\u52A1\u5668\u6743\u9650\u3001\u5185\u7F51\u96A7\u9053\u3001\u540E\u53F0\u7BA1\u7406\u5458\u8D26\u53F7\uFF09"
              )
            ),
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u76EE\u6807"),
              h2(
                "span",
                { className: "rt-mono", style: { wordBreak: "break-all" } },
                v.target || "\u2014"
              )
            ),
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u8D44\u4EA7"),
              h2(
                "span",
                null,
                (v.asset_ip || "\u2014") + " \xB7 " + (v.segment_cidr || "")
              )
            ),
            h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u6765\u6E90"),
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
                h2("b", null, "\u653B\u51FB\u6587\u4EF6"),
                mine.length ? h2(
                  "span",
                  null,
                  mine.map(
                    (f, fi) => h2(
                      "div",
                      { key: "af" + fi, style: { marginBottom: 3 } },
                      "\xB7 " + (f.kind ? "[" + f.kind + "] " : "") + (f.name || "(\u672A\u547D\u540D)") + (f.description ? " \u2014 " + f.description : ""),
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
                  "\uFF08\u65E0\uFF09\u7528 redteam_attack_file_add \u628A\u8FD9\u6761\u6F0F\u6D1E\u6253\u901A\u7684\u811A\u672C/\u9A6C/EXP \u5F52\u6863\uFF0C\u5E76\u5E26\u4E0A vuln_id"
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
                "\u786E\u8BA4"
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
                "\u5DF2\u5229\u7528"
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
                "\u8BEF\u62A5"
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
                "\u5DF2\u4FEE\u590D"
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
              count: g.vulns.length + " \u4E2A\u6F0F\u6D1E",
              sub: [
                SEV_LABEL[g.top.severity] || g.top.severity,
                g.exploited ? "\u5DF2\u5229\u7528 " + g.exploited : null,
                g.top.asset_ip && g.top.asset_ip !== g.key ? "\u8D44\u4EA7 " + g.top.asset_ip : null
              ].filter(Boolean).join(" \xB7 "),
              right: g.gained.length ? g.gained.slice(0, 2).join(" / ") + (g.gained.length > 2 ? " +" + (g.gained.length - 2) : "") : "\u672A\u8BB0\u5F55\u6743\u9650",
              open: collapse.isOpen(key, defOpen),
              onToggle: collapse.toggle(key, defOpen)
            },
            g.vulns.map((v) => vulnRows(v, true))
          )
        );
      }
      if (!list.length && !state.loading && !state.error) {
        rows.push(
          h2("div", { key: "none", className: "rt-empty" }, "\u6682\u65E0\u6F0F\u6D1E\u8BB0\u5F55")
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
        placeholder: "\u641C\u7D22\u6807\u9898 / CVE / \u76EE\u6807\uFF08\u56DE\u8F66\uFF09",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setQApplied(q);
        }
      }),
      h2(
        "button",
        { className: "rt-btn", onClick: () => setQApplied(q) },
        "\u641C\u7D22"
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: sev,
          onChange: (e) => setSev(e.target.value)
        },
        h2("option", { value: "" }, "\u5168\u90E8\u7B49\u7EA7"),
        h2("option", { value: "critical" }, "\u4E25\u91CD"),
        h2("option", { value: "high" }, "\u9AD8\u5371"),
        h2("option", { value: "medium" }, "\u4E2D\u5371"),
        h2("option", { value: "low" }, "\u4F4E\u5371"),
        h2("option", { value: "info" }, "\u4FE1\u606F")
      ),
      h2(
        "select",
        {
          className: "rt-input",
          value: status,
          onChange: (e) => setStatus(e.target.value)
        },
        h2("option", { value: "" }, "\u5168\u90E8\u72B6\u6001"),
        h2("option", { value: "candidate" }, "\u5F85\u9A8C\u8BC1"),
        h2("option", { value: "confirmed" }, "\u5DF2\u786E\u8BA4"),
        h2("option", { value: "exploited" }, "\u5DF2\u5229\u7528"),
        h2("option", { value: "false-positive" }, "\u8BEF\u62A5"),
        h2("option", { value: "fixed" }, "\u5DF2\u4FEE\u590D")
      )
    );
    const credSection = h2(
      "div",
      null,
      h2(
        "div",
        { className: "rt-section" },
        "\u51ED\u636E \xB7 " + creds.length + (creds.length ? "\uFF08\u660E\u6587\u76F4\u663E\uFF0C\u6CE8\u610F\u5C4F\u5E55\u5206\u4EAB/\u5F55\u5C4F\uFF09" : "")
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
                "\u590D\u5236"
              )
            ),
            c.secret_value ? h2(
              "div",
              { className: "rt-secret", title: "\u70B9\u51FB\u53EF\u5168\u9009" },
              c.secret_value
            ) : h2(
              "div",
              { className: "rt-secret-none" },
              "\u672A\u8BB0\u660E\u6587 \u2014\u2014 \u8BF7\u7528 redteam_credential_add \u7684 secret_value \u8865\u4E0A\uFF0C\u9762\u677F\u624D\u80FD\u76F4\u663E"
            ),
            h2(
              "div",
              { className: "rt-cred-meta" },
              [
                c.source ? "\u6765\u6E90 " + c.source : null,
                c.tool ? "\u5DE5\u5177 " + c.tool : null,
                c.secret_ref ? "\u8BC1\u636E " + c.secret_ref : null,
                c.found_by_agent ? "by " + c.found_by_agent : null,
                c.found_at ? fmt(c.found_at) : null
              ].filter(Boolean).join(" \xB7 ")
            ),
            c.note ? h2("div", { className: "rt-cred-meta" }, "\u5907\u6CE8\uFF1A" + c.note) : null
          )
        )
      ) : h2(
        "div",
        { className: "rt-empty" },
        "\u6682\u65E0\u51ED\u636E\uFF08\u62FF\u5230\u53E3\u4EE4/\u5BC6\u94A5/Hash \u540E\u7528 redteam_credential_add \u843D\u5E93\uFF0C\u79D2\u7EA7\u53EF\u590D\u7528\uFF09"
      )
    );
    const accessSection = h2(
      "div",
      null,
      h2(
        "div",
        { className: "rt-section" },
        "\u5DF2\u83B7\u5F97\u8BBF\u95EE\u4F1A\u8BDD \xB7 " + accesses.length
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
      ) : h2("div", { className: "rt-empty" }, "\u6682\u65E0")
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
        subTabBtn("vulns", "\u6F0F\u6D1E", state.total || 0),
        subTabBtn("files", "\u653B\u51FB\u6587\u4EF6", allFiles.length),
        subTabBtn("creds", "\u51ED\u636E", creds.length),
        subTabBtn("access", "\u8BBF\u95EE\u4F1A\u8BDD", accesses.length),
        h2("div", { className: "rt-spacer" }),
        grouped ? h2(
          "button",
          {
            className: "rt-btn",
            title: "\u5C55\u5F00\u6240\u6709\u76EE\u6807",
            onClick: () => collapse.setAll(
              (state.items || []).map((v) => "target:" + targetKeyOf(v)),
              true
            )
          },
          "\u5168\u90E8\u5C55\u5F00"
        ) : null,
        grouped ? h2(
          "button",
          {
            className: "rt-btn",
            title: "\u6536\u8D77\u6240\u6709\u76EE\u6807",
            onClick: () => collapse.setAll(
              (state.items || []).map((v) => "target:" + targetKeyOf(v)),
              false
            )
          },
          "\u5168\u90E8\u6536\u8D77"
        ) : null,
        h2(
          "button",
          {
            className: "rt-btn" + (grouped ? " rt-btn-primary" : ""),
            title: grouped ? "\u5F53\u524D\uFF1A\u6309\u76EE\u6807\u805A\u5408\uFF08\u5148\u770B\u54EA\u53F0\u88AB\u6253\u4E0B\u4EC0\u4E48\uFF09" : "\u5F53\u524D\uFF1A\u5E73\u94FA\u6BCF\u6761\u6F0F\u6D1E",
            onClick: () => setGrouped((g) => !g)
          },
          grouped ? "\u6309\u76EE\u6807\u805A\u5408" : "\u5E73\u94FA\u5217\u8868"
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
        "\u8BE5\u6A21\u5757\u7684\u5BBF\u4E3B\u4EE3\u7801\u5DF2\u66F4\u65B0\uFF0C\u9700\u91CD\u542F\u4E00\u6B21\u5F53\u524D\u5BBF\u4E3B\uFF08\u5B98\u65B9 exe / \u793E\u533A\u7248 / dsh web\uFF09\u540E\u751F\u6548"
      ) : null,
      state.error && !needRestart ? h2("div", { className: "rt-err" }, state.error) : null,
      subTab === "files" ? h2(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        h2(
          "div",
          { className: "rt-hint", style: { marginBottom: 8 } },
          "\u653B\u51FB\u6587\u4EF6\u6309\u9776\u6807\u76EE\u5F55\u7EC4\u7EC7\uFF08\u539F\u300C\u653B\u51FB\u6587\u4EF6\u300D\u9875\u7B7E\uFF09\uFF1B\u6BCF\u6761\u6F0F\u6D1E\u7684\u5173\u8054\u6587\u4EF6\u4E5F\u80FD\u5728\u8BE5\u6F0F\u6D1E\u8BE6\u60C5\u91CC\u76F4\u63A5\u770B\u5230\u3002" + (orphanFiles.length ? " \u76EE\u524D\u6709 " + orphanFiles.length + " \u4E2A\u6587\u4EF6\u6CA1\u6302 vuln_id\uFF0C\u5EFA\u8BAE\u8865\u4E0A\u4EE5\u4FBF\u4E0E\u6F0F\u6D1E\u5BF9\u5E94\u3002" : "")
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
        !state.loading && !state.items.length && !state.error ? h2("div", { className: "rt-empty" }, "\u6682\u65E0\u6F0F\u6D1E\u8BB0\u5F55") : null
      )
    );
  }
  const STAGE_LABEL = {
    recon: "\u4FE1\u606F\u6536\u96C6",
    vuln: "\u6F0F\u6D1E\u53D1\u73B0",
    exploit: "\u6F0F\u6D1E\u5229\u7528",
    access: "\u83B7\u5F97\u6743\u9650",
    pivot: "\u5185\u7F51\u7A81\u7834",
    data: "\u654F\u611F\u6570\u636E",
    other: "\u5176\u4ED6"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
        h2("b", null, "\u76EE\u6807"),
        h2(
          "span",
          { className: "rt-mono", style: { wordBreak: "break-all" } },
          x.target || "\u2014"
        )
      ),
      x.asset_ip ? h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "\u8D44\u4EA7"),
        h2("span", { className: "rt-mono" }, x.asset_ip)
      ) : null,
      x.vuln_title ? h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "\u5229\u7528\u6F0F\u6D1E"),
        h2(
          "span",
          null,
          [x.vuln_cve, x.vuln_title].filter(Boolean).join(" ")
        )
      ) : null,
      h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "\u6B21\u6570"),
        h2(
          "span",
          null,
          "\u540C\u7C7B\u7B2C " + x.nth_of_point + " \u6B21 \xB7 +" + (x.points || 0) + " \u5206"
        )
      ),
      h2(
        "div",
        { className: "rt-kv" },
        h2("b", null, "\u8BB0\u5F55"),
        h2(
          "span",
          null,
          fmt(x.recorded_at) + (x.recorded_by ? " \xB7 " + x.recorded_by : "")
        )
      ),
      x.evidence ? h2(Clip, { label: "\u7ED3\u679C\u4E0E\u8BC1\u636E", text: x.evidence }) : null
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
            title: x.capped_reason || "\u540C\u4E00\u8D44\u4EA7\u540C\u4E00\u7AEF\u53E3\u53EA\u7B97\u5206\u503C\u6700\u9AD8\u7684\u4E00\u6761"
          },
          "\u670D\u52A1\u5DF2\u62FF\u6EE1 \xB7 \u4E0D\u8BA1\u5206"
        ) : null,
        x.nth_of_point > 1 ? h2(
          "span",
          { className: "rt-ap-nth" },
          "\u7B2C " + x.nth_of_point + " \u6B21"
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
        "\u52A8\u4F5C\uFF1A" + (x.action.title || "\uFF08\u672A\u547D\u540D\u6B65\u9AA4\uFF09") + (x.action_inferred ? "\uFF08\u63A8\u65AD\uFF09" : "")
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
        a.scope === "internal" ? "\u5185" : "\u5916"
      ),
      h2("span", { className: "rt-mono", style: { fontWeight: 600 } }, a.ip),
      a.segment_cidr ? h2("span", { className: "rt-ap-nth" }, a.segment_cidr) : null,
      h2("span", { className: "rt-ap-nth" }, "\u7AEF\u53E3 " + (a.open_ports || 0)),
      a.vulns ? h2("span", { className: "rt-ap-nth" }, "\u6F0F\u6D1E " + a.vulns) : null,
      a.priority ? h2("span", { className: "rt-tag" }, "\u6613\u6253 " + a.priority) : null,
      h2("div", { className: "rt-spacer" }),
      h2("span", { className: "rt-ap-pts" }, "+" + (a.points || 0) + " \u5206"),
      h2("span", { className: "rt-ap-nth" }, (a.hits || 0) + " \u6B21")
    );
    const stageA = (st, i) => {
      const isRecon = st.code === "recon";
      const body = [];
      if (isRecon) {
        body.push(
          h2(
            "div",
            { key: "at", className: "rt-ap-sub" },
            "\u62FF\u5230\u5206\u6570\u7684\u8D44\u4EA7 \xB7 " + st.assetCount + " \u53F0"
          )
        );
        body.push(
          h2(
            "div",
            { key: "al", className: "rt-ap-assets" },
            st.assets.length ? st.assets.map(assetRow) : h2("div", { className: "rt-ap-none" }, "\u8FD8\u6CA1\u6709\u4EA7\u751F\u5F97\u5206\u7684\u8D44\u4EA7")
          )
        );
      } else {
        body.push(
          h2(
            "div",
            { key: "ht", className: "rt-ap-sub" },
            "\u672C\u9636\u6BB5\u547D\u4E2D " + st.hits + " \u6B21" + (st.points ? " \xB7 +" + st.points + " \u5206" : "")
          )
        );
        body.push(
          h2(
            "div",
            { key: "hl", className: "rt-ap-hits" },
            st.items.length ? st.items.map(hitRow) : h2("div", { className: "rt-ap-none" }, "\u672C\u9636\u6BB5\u8FD8\u6CA1\u6709\u5F97\u5206")
          )
        );
        if (st.code === "boundary") {
          const selfOnly = (st.tunnels_self_only || []).length;
          body.push(
            h2(
              "div",
              { key: "tt", className: "rt-ap-sub" },
              "\u8DE8\u8D8A\u9776\u6807\u8FB9\u754C\u7684\u901A\u9053 \xB7 " + st.tunnels.length + " \u6761" + (selfOnly ? "\uFF08\u53E6\u6709 " + selfOnly + " \u6761\u53EA\u5728\u81EA\u5DF1 VPS/\u81EA\u5EFA\u670D\u52A1\u5668\u4E0A\uFF0C\u4E0D\u7B97\u7A81\u7834\uFF09" : "")
            )
          );
          if (selfOnly && st.tunnels.length === 0) {
            body.push(
              h2(
                "div",
                { key: "tw", className: "rt-ap-none" },
                "\u26A0\uFE0F \u73B0\u6709\u7684\u901A\u9053\u90FD\u5728\u81EA\u5DF1\u7684\u670D\u52A1\u5668\u4E0A\uFF0C\u6CA1\u6709\u78B0\u5230\u76EE\u6807 \u2014\u2014 \u4E0D\u8BA1\u8FB9\u754C\u7A81\u7834\u3002\u9700\u8981\u76EE\u6807\u4FA7\u53D1\u8D77\u7684\u901A\u9053\uFF08\u53CD\u5F39 shell \u5230\u6211\u8FD9 / \u76EE\u6807\u4E0A\u8DD1 frp \u5BA2\u6237\u7AEF / \u7ECF\u76EE\u6807 WebShell \u7684 suo5\uFF09\u3002"
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
                    t.status === "active" ? "\u53EF\u7528" : t.status || "\u672A\u77E5"
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
                    "\u53EF\u8FBE " + (t.reach || "\u2014")
                  )
                )
              ) : h2(
                "div",
                { className: "rt-ap-none" },
                "\u8FD8\u6CA1\u6709\u5EFA\u7ACB\u96A7\u9053\uFF08\u5EFA\u597D\u540E\u7528 redteam_tunnel_add \u767B\u8BB0\uFF09"
              )
            )
          );
        }
        if (st.assets.length && st.code !== "boundary") {
          body.push(
            h2(
              "div",
              { key: "at", className: "rt-ap-sub" },
              "\u6D89\u53CA\u8D44\u4EA7 \xB7 " + st.assetCount + " \u53F0"
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
            "\u7D2F\u8BA1 " + st.cumulative + " \u5206"
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
            "\u9636\u6BB5\u76EE\u6807"
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
            "\u7D2F\u8BA1 " + st.cumulative + " \u5206"
          )
        ) : h2(
          "div",
          { className: "rt-ap-trans" },
          h2("span", { className: "rt-flow-arrow" }, "\u25BC"),
          h2(
            "span",
            { className: "rt-ap-trans-t" },
            "\u5408\u8BA1 " + (summary && summary.points || 0) + " \u5206"
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
                "\u96A7\u9053 " + st.tunnels.length + " \u6761"
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
              h2("span", { className: "rt-hcol-name" }, "\u53F0\u8D44\u4EA7\u62FF\u5230\u5206")
            ),
            st.assets.slice(0, 6).map(
              (a) => h2(
                "div",
                {
                  key: "a" + a.id,
                  className: "rt-hcol-sub",
                  title: a.ip + "  +" + a.points + " \u5206"
                },
                (a.scope === "internal" ? "\u5185 " : "\u5916 ") + a.ip + "  +" + a.points
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
                st.hits + " \u6B21\u547D\u4E2D"
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
              "\u2026\u53E6\u6709 " + (st.items.length - 6) + " \u6B21"
            ) : null,
            st.assetCount ? h2(
              "div",
              { className: "rt-hcol-none" },
              "\u6D89\u53CA " + st.assetCount + " \u53F0\u8D44\u4EA7"
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
        h2("span", { style: { fontWeight: 600 } }, "\u653B\u51FB\u94FE"),
        h2(
          "span",
          { className: "rt-tag", style: { fontSize: 10.5 } },
          "\u4FE1\u606F\u6536\u96C6 \u2192 \u4E92\u8054\u7F51\u8D44\u4EA7\u6743\u9650 \u2192 \u8FB9\u754C\u7A81\u7834 \u2192 \u5185\u7F51\u8D44\u4EA7\u6743\u9650 \u2192 \u9776\u6807\u6743\u9650"
        ),
        summary ? h2(
          "span",
          { className: "rt-tag rt-tag-live" },
          "\u603B\u5206 " + summary.points + " \u5206"
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn" + (view === "A" ? " rt-btn-primary" : ""),
            title: "\u7AD6\u5411\u653B\u51FB\u94FE\uFF1A\u9010\u9636\u6BB5\u5411\u4E0B\u770B\u7EC6\u8282",
            onClick: () => setView("A")
          },
          "\u94FE\u8DEF A"
        ),
        h2(
          "button",
          {
            className: "rt-btn" + (view === "B" ? " rt-btn-primary" : ""),
            title: "\u6A2A\u5411\u653B\u51FB\u94FE\uFF1A\u4E00\u5C4F\u770B\u5B8C\u4E94\u4E2A\u9636\u6BB5",
            onClick: () => setView("B")
          },
          "\u94FE\u8DEF B"
        ),
        h2(
          "button",
          { className: "rt-btn", disabled: loading, onClick: load },
          loading ? "\u52A0\u8F7D\u4E2D\u2026" : "\u5237\u65B0"
        )
      ),
      err ? h2("div", { className: "rt-err" }, err) : null,
      !stages.length && !err && data !== null ? h2(
        "div",
        { className: "rt-empty" },
        "\u8FD8\u6CA1\u6709\u5F97\u5206\u8BB0\u5F55\u3002\u62FF\u5230\u6210\u679C\u540E\u7528 redteam_score_hit \u8BB0\u5206\uFF0C\u8FD9\u6761\u94FE\u624D\u4F1A\u957F\u51FA\u6765\u3002"
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
        name: "\u5176\u4ED6\u5F97\u5206",
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
            setErr(r && r.error || "\u751F\u6210\u5931\u8D25");
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
        setMsg({ ok: "\u5DF2\u4E0B\u8F7D\uFF1A" + label });
      } catch (e) {
        setMsg({ err: "\u4E0B\u8F7D\u5931\u8D25\uFF1A" + (e && e.message || e) });
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
        h2("span", { className: "rt-flow-pts" }, "+" + x.points + " \u5206"),
        x.nth_of_point > 1 ? h2(
          "span",
          { className: "rt-tag" },
          "\u540C\u7C7B\u7B2C " + x.nth_of_point + " \u6B21"
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn",
            style: { padding: "0 6px", fontSize: 11 },
            onClick: () => copy(
              (x.requests || []).map((v) => v.request || "").filter(Boolean).join("\n\n"),
              "\u7B2C " + x.seq + " \u9879\u8BF7\u6C42"
            )
          },
          "\u590D\u5236\u8BF7\u6C42"
        )
      ),
      h2(
        "div",
        { className: "rt-rep-meta" },
        h2("span", null, h2("b", null, "\u76EE\u6807 ")),
        h2("span", { className: "rt-mono" }, x.target || x.asset_ip || "\u2014")
      ),
      x.gained ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "\u62FF\u5230 "),
        h2("span", null, x.gained)
      ) : null,
      x.vuln ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "\u5229\u7528\u6F0F\u6D1E "),
        h2(
          "span",
          null,
          [x.vuln.cve, x.vuln.title].filter(Boolean).join(" ")
        )
      ) : null,
      x.evidence ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "\u7ED3\u679C "),
        h2("span", null, String(x.evidence).replace(/\n+/g, " "))
      ) : null,
      x.recorded_at ? h2(
        "div",
        { className: "rt-rep-meta" },
        h2("b", null, "\u53D6\u5F97\u65F6\u95F4 "),
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
        title: "\u8BC1\u636E\u622A\u56FE"
      }),
      /* ── 复现步骤：动作记录（含实际命令与回显）+ 凭据 + 隧道 + WebShell ─────
         报告的交付价值全在这块：账号密码怎么来的、隧道怎么搭的，用户照着就能复现。 */
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
            "\u590D\u73B0\u6B65\u9AA4\uFF08\u70B9\u51FB\u5C55\u5F00\uFF09"
          ),
          (x.steps || []).length ? h2(
            "span",
            { className: "rt-tag" },
            (x.steps || []).length + " \u4E2A\u52A8\u4F5C"
          ) : null,
          (x.credentials || []).length ? h2(
            "span",
            { className: "rt-tag" },
            (x.credentials || []).length + " \u6761\u51ED\u636E"
          ) : null,
          (x.tunnels || []).length ? h2(
            "span",
            { className: "rt-tag" },
            (x.tunnels || []).length + " \u6761\u96A7\u9053"
          ) : null,
          x.incomplete ? h2("span", { className: "rt-tag rt-tag-warn" }, "\u590D\u73B0\u6750\u6599\u5F85\u8865") : h2("span", { className: "rt-tag rt-tag-live" }, "\u53EF\u590D\u73B0")
        ),
        h2(
          "div",
          { style: { paddingTop: 6 } },
          x.how ? h2("div", { className: "rt-rep-trace-how" }, x.how) : null,
          (x.steps || []).length === 0 ? h2(
            "div",
            { className: "rt-rep-missing" },
            "\u26A0\uFE0F \u6CA1\u6709\u5173\u8054\u7684\u653B\u51FB\u6B65\u9AA4\uFF1A\u8BF4\u4E0D\u6E05\u8FD9\u4E00\u6B65\u662F\u600E\u4E48\u505A\u7684\u3002\u8BF7\u7528 redteam_chain_add \u8865\u4E0A\u52A8\u4F5C\uFF08title / detail / tool / result\uFF09\uFF0C\u8BB0\u5206\u65F6\u4E5F\u53EF\u4EE5\u5E26 point_code + evidence \u4E00\u6B21\u5B8C\u6210\u3002"
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
                  s.title || "(\u672A\u547D\u540D\u52A8\u4F5C)"
                ),
                s.agent ? h2(
                  "span",
                  { className: "rt-tag" },
                  ROLE_LABEL[s.agent] || s.agent
                ) : null,
                s.stage_code ? h2("span", { className: "rt-tag" }, s.stage_code) : null,
                s.inferred ? h2("span", { className: "rt-tag" }, "\u6309\u540C\u8D44\u4EA7\u63A8\u65AD") : null,
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
                h2("b", null, "\u6267\u884C "),
                s.tool ? h2("span", { className: "rt-mono" }, s.tool) : h2(
                  "span",
                  {
                    style: {
                      color: "var(--dsw-alias-state-warn-primary, #f59e0b)"
                    }
                  },
                  "\u672A\u8BB0\u5F55\u5B9E\u9645\u547D\u4EE4\uFF08redteam_chain_add \u7684 tool\uFF09"
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
                      "\u7B2C " + (si + 1) + " \u6B65\u547D\u4EE4"
                    )
                  },
                  "\u590D\u5236\u547D\u4EE4"
                )
              ) : null,
              s.result ? h2(
                "div",
                { className: "rt-rep-step-result" },
                h2("b", null, "\u7ED3\u679C "),
                String(s.result).replace(/\n+/g, " ")
              ) : null,
              s.evidence_ref ? h2(
                "div",
                { className: "rt-rep-step-result" },
                h2("b", null, "\u8BC1\u636E "),
                h2("span", { className: "rt-mono" }, s.evidence_ref)
              ) : null
            )
          ),
          /* 账号密码怎么来的：凭据的来源 + 取得方式 */
          (x.credentials || []).length ? h2(
            "div",
            { className: "rt-rep-src" },
            h2(
              "div",
              { className: "rt-rep-src-title" },
              "\u62FF\u5230\u7684\u51ED\u636E\uFF08\u6765\u6E90\u53EF\u8FFD\u6EAF\uFF09"
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
                  (c.username || "(\u65E0\u7528\u6237\u540D)") + " / " + (c.secret_type || "password") + (c.privilege ? " \xB7 \u6743\u9650 " + c.privilege : "") + " \xB7 \u6765\u6E90 " + (c.source || "\u672A\u6807\u6CE8") + (c.tool ? " \xB7 \u53D6\u5F97\u65B9\u5F0F " + String(c.tool).replace(/\n+/g, " ").slice(0, 160) : "")
                )
              )
            )
          ) : null,
          /* 隧道怎么搭的 */
          (x.tunnels || []).length ? h2(
            "div",
            { className: "rt-rep-src" },
            h2(
              "div",
              { className: "rt-rep-src-title" },
              "\u7528\u5230\u7684\u96A7\u9053 / \u901A\u9053"
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
                  "\u5165\u53E3 " + (t.entry || "\u672A\u767B\u8BB0") + (t.reach ? " \xB7 \u53EF\u8FBE " + t.reach : "") + " \xB7 \u76EE\u6807\u4FA7 " + (t.entry_kind || "\u672A\u58F0\u660E") + (t.legit === false ? " \xB7 \u26A0\uFE0F \u4E0D\u7B97\u8DE8\u8D8A\u9776\u6807\u8FB9\u754C" : "") + (t.status ? " \xB7 " + t.status : "") + (t.command ? " \xB7 \u547D\u4EE4 " + String(t.command).replace(/\n+/g, " ").slice(0, 160) : "")
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
              "\u7528\u5230\u7684 WebShell"
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
                  (w.url || "") + (w.pass_key ? " \xB7 \u53E3\u4EE4/\u5BC6\u94A5 " + w.pass_key : "") + (w.privilege ? " \xB7 \u6743\u9650 " + w.privilege : "") + (w.status ? " \xB7 " + w.status : "")
                )
              )
            )
          ) : null,
          (x.gaps || []).length ? h2(
            "div",
            { className: "rt-rep-missing" },
            "\u26A0\uFE0F \u590D\u73B0\u7F3A\u53E3\uFF1A" + x.gaps.join("\uFF1B")
          ) : null
        ),
        (x.requests || []).length === 0 ? h2(
          "div",
          { className: "rt-rep-missing" },
          "\u26A0\uFE0F \u8FD9\u4E00\u9879\u6CA1\u6709\u539F\u59CB\u8BF7\u6C42\u8BB0\u5F55\uFF0C\u65E0\u6CD5\u76F4\u63A5\u590D\u73B0 \u2014\u2014 \u8BF7\u7528 redteam_http_evidence_add \u8865\u4E0A"
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
                "\u590D\u73B0\u8BF7\u6C42 " + (ri + 1) + (r.source === "auto" ? "\uFF08\u6309\u76EE\u6807\u8DEF\u5F84\u81EA\u52A8\u5339\u914D\uFF0C\u8BF7\u6838\u5BF9\uFF09" : "")
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
                  onClick: () => copy(String(r.request || ""), "\u8BF7\u6C42 " + (ri + 1))
                },
                "\u590D\u5236\u5230 Yakit"
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
                h2("span", null, "\u54CD\u5E94\u6458\u8981")
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
          h2("b", null, "\u5907\u6CE8 "),
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
        h2("span", { style: { fontWeight: 600 } }, "\u653B\u51FB\u5F97\u5206\u94FE\u8DEF\u590D\u73B0\u62A5\u544A"),
        summary ? h2(
          "span",
          { className: "rt-tag rt-tag-live" },
          "\u5408\u8BA1 " + summary.points + " \u5206"
        ) : null,
        summary ? h2("span", { className: "rt-tag" }, summary.count + " \u9879\u5F97\u5206") : null,
        summary ? h2(
          "span",
          {
            className: "rt-tag" + (summary.missingRequests ? "" : " rt-tag-live")
          },
          summary.withRequests + "/" + summary.count + " \u9879\u5E26\u539F\u59CB\u8BF7\u6C42"
        ) : null,
        summary ? h2(
          "span",
          {
            className: "rt-tag" + (summary.incomplete ? " rt-tag-warn" : " rt-tag-live"),
            title: "\u590D\u73B0\u94FE\u662F\u5426\u5B8C\u6574\uFF1A\u6709\u653B\u51FB\u6B65\u9AA4\u3001\u5199\u4E86\u5B9E\u9645\u547D\u4EE4\u3001\u5173\u8054\u4E86\u6F0F\u6D1E/\u51ED\u636E/\u96A7\u9053"
          },
          "\u53EF\u590D\u73B0 " + (summary.count - (summary.incomplete || 0)) + "/" + summary.count
        ) : null,
        summary && summary.serviceCappedExcluded ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: (summary.serviceCapped || []).map((x) => (x.service || "") + "\uFF5C" + (x.point_name || "")).join("\n") || "\u540C\u4E00\u8D44\u4EA7\u540C\u4E00\u7AEF\u53E3\u7684\u91CD\u590D\u8D26\u53F7/\u6570\u636E\u5E93\u6743\u9650\u547D\u4E2D\uFF1A\u670D\u52A1\u5DF2\u62FF\u6EE1\uFF0C\u4E0D\u8BA1\u5206\u3001\u4E0D\u8FDB\u62A5\u544A"
          },
          "\u540C\u670D\u52A1\u5DF2\u62FF\u6EE1\u4E0D\u8BA1\u5206 " + summary.serviceCappedExcluded
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn",
            disabled: busy || !mdText,
            onClick: () => copy(mdText, "\u6574\u4EFD\u62A5\u544A")
          },
          "\u590D\u5236\u5168\u6587"
        ),
        h2(
          "button",
          {
            className: "rt-btn",
            disabled: busy || !mdText,
            onClick: () => download(mdText, data && data.target || eng)
          },
          "\u4E0B\u8F7D .md"
        ),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "\u751F\u6210\u4E2D\u2026" : "\u91CD\u65B0\u751F\u6210"
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
              "\u5168\u90E8\u5C55\u5F00"
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
              "\u5168\u90E8\u6298\u53E0"
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
                  st.items.length + " \u9879"
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
                  "+" + st.points + " \u5206"
                ),
                h2(
                  "span",
                  { className: "rt-ap-cum" },
                  "\u7D2F\u8BA1 " + st.cumulative + " \u5206"
                )
              ),
              open ? h2("div", { className: "rt-rep-body" }, st.items.map(card)) : null
            );
          })
        ) : data === null ? h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026") : h2(
          "div",
          { className: "rt-empty" },
          h2("div", null, "\u8FD8\u6CA1\u6709\u53EF\u4EA4\u4ED8\u7684\u6210\u679C\u3002"),
          h2(
            "div",
            { style: { marginTop: 6, fontSize: 12 } },
            '\u672C\u62A5\u544A\u53EA\u6536\u5F55"\u62FF\u5230\u4E86\u5206"\u7684\u6210\u679C\uFF1B\u6CA1\u6709\u5F97\u5206\u7684\u6F0F\u6D1E\u4E0D\u8FDB\u62A5\u544A\u3002\u62FF\u5230\u6210\u679C\u540E\u7528 redteam_score_hit \u8BB0\u5206\uFF08\u76EE\u6807\u8D44\u4EA7 + \u62FF\u5230\u7684\u4E1C\u897F\uFF09\uFF0C\u5E76\u8865 redteam_http_evidence_add \u4EE5\u4FBF\u590D\u73B0\u3002'
          )
        )
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2(
          "span",
          null,
          "\u53E3\u5F84\uFF1A\u53EA\u6536\u5F55\u5F97\u5206\u6210\u679C\uFF0C\u6BCF\u6761\u9644\u5E26\u53EF\u7C98\u8FDB Yakit Repeater \u7684\u539F\u59CB\u8BF7\u6C42"
        )
      )
    );
  }
  const FILE_KIND = {
    poc: "POC",
    exp: "EXP",
    script: "\u811A\u672C",
    wordlist: "\u5B57\u5178",
    other: "\u5176\u4ED6"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
          else setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
                h2("b", null, "\u6548\u679C"),
                h2("span", null, detail.evidence || "\u2014")
              ),
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "\u8DEF\u5F84"),
                h2(
                  "span",
                  { className: "rt-mono", style: { wordBreak: "break-all" } },
                  detail.path
                )
              ),
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "\u8BB0\u5F55"),
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
                detail.content || "\uFF08\u7A7A\uFF09"
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
            count: folder.count + " \u4E2A\u6587\u4EF6",
            open: collapse.isOpen(fKey, true),
            onToggle: collapse.toggle(fKey, true)
          },
          fileNodes.length ? fileNodes : h2("div", { className: "rt-atest-meta" }, "\uFF08\u7A7A\uFF09")
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
        h2("span", { style: { fontWeight: 600 } }, "\u653B\u51FB\u6587\u4EF6"),
        h2(
          "span",
          { className: "rt-tag" },
          folders.length + " \u4E2A\u76EE\u6807 / " + total + " \u4E2A\u6587\u4EF6"
        ),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "\u5237\u65B0\u4E2D\u2026" : "\u5237\u65B0"
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
          "\u6682\u65E0\u653B\u51FB\u6587\u4EF6\uFF08\u6253\u901A\u7684\u811A\u672C/POC/EXP \u4F1A\u6309\u76EE\u6807\u6587\u4EF6\u5939\u51FA\u73B0\u5728\u8FD9\u91CC\uFF09"
        ) : null
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2(
          "span",
          null,
          "\u76EE\u5F55\uFF1Aattack-files/<IP|URL\u4E3B\u673A|C\u6BB5>/ \uFF5C \u53EA\u6536\u5F55\u5B9E\u9645\u751F\u6548\u7684\u6587\u4EF6"
        )
      )
    );
  }
  const POC_KIND_LABEL = {
    poc: "POC",
    exp: "EXP",
    script: "\u811A\u672C",
    template: "\u6A21\u677F",
    payload: "\u8F7D\u8377"
  };
  const POC_SOURCE_LABEL = {
    web: "\u4E92\u8054\u7F51",
    self: "\u624B\u6413",
    manual: "\u4EBA\u5DE5",
    "nuclei-template": "nuclei \u6A21\u677F",
    kb: "\u77E5\u8BC6\u5E93"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
            setMsg({ err: r && r.error || "\u8BFB\u53D6\u5931\u8D25" });
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
      api({ op: "pocUse", id: row.id, used_on: "\u63A7\u5236\u53F0\u624B\u52A8\u6807\u8BB0" }).then(
        () => {
          setMsg({ ok: "\u5DF2\u8BB0\u4E00\u6B21\u590D\u7528\uFF1A" + row.title });
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
          x.verified === 1 ? h2("span", { className: "rt-tag rt-tag-live" }, "\u5DF2\u9A8C\u8BC1") : h2("span", { className: "rt-tag rt-tag-warn" }, "\u672A\u9A8C\u8BC1"),
          h2("div", { className: "rt-spacer" }),
          h2(
            "span",
            { className: "rt-tag" },
            POC_SOURCE_LABEL[x.source] || x.source || "\u2014"
          ),
          x.hit_count ? h2("span", { className: "rt-tag" }, "\u590D\u7528 " + x.hit_count) : null
        ),
        /* 来源行：归类 · 影响版本 · 建立时间 · 来源靶标 · 发现资产 —— 一条知识"什么时候、
             在哪个单位的哪台资产上发现的"一眼可见 */
        h2(
          "div",
          { className: "rt-kb-sub" },
          [
            x.category ? "\u5F52\u7C7B " + (POC_CAT_NAME[x.category] || x.category) : null,
            x.versions ? "\u5F71\u54CD\u7248\u672C " + x.versions : null,
            x.language || null,
            x.tags || null,
            "\u5EFA\u7ACB\u65F6\u95F4 " + fmt(x.created_at),
            x.engagement_name || x.engagement_id ? "\u6765\u6E90\u9776\u6807 " + (x.engagement_name || x.engagement_id) : null,
            x.asset_target ? "\u53D1\u73B0\u8D44\u4EA7 " + x.asset_target : null,
            x.found_by_agent ? "\u53D1\u73B0\u89D2\u8272 " + (ROLE_LABEL[x.found_by_agent] || x.found_by_agent) : null,
            x.source_url ? "\u6765\u6E90 " + x.source_url : null
          ].filter(Boolean).join(" \xB7 ")
        ),
        isOpen ? h2(
          "div",
          { className: "rt-kb-body" },
          detailBusy && !d ? h2("div", { className: "rt-empty" }, "\u8BFB\u53D6\u4E2D\u2026") : null,
          d ? h2(
            "div",
            null,
            d.usage ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u7528\u6CD5"),
              h2("span", { className: "rt-mono" }, d.usage)
            ) : null,
            d.description ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u8BF4\u660E"),
              h2("span", null, d.description)
            ) : null,
            d.verified_note ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u9A8C\u8BC1\u8BC1\u636E"),
              h2("span", null, d.verified_note)
            ) : null,
            d.used_on ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u6700\u8FD1\u4F7F\u7528"),
              h2("span", null, d.used_on)
            ) : null,
            d.path ? h2(
              "div",
              { className: "rt-kv" },
              h2("b", null, "\u843D\u76D8"),
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
                  onClick: () => copy(d.content || "", "POC \u6B63\u6587")
                },
                "\u590D\u5236\u6B63\u6587"
              ),
              h2(
                "button",
                { className: "rt-btn", onClick: () => useIt(x) },
                "\u8BB0\u4E00\u6B21\u590D\u7528"
              ),
              d.source_url ? h2(
                "button",
                {
                  className: "rt-btn",
                  onClick: () => copy(d.source_url, "\u6765\u6E90\u94FE\u63A5")
                },
                "\u590D\u5236\u6765\u6E90"
              ) : null
            ),
            d.content ? h2(
              "pre",
              { className: "rt-rep-http" },
              d.content.length > 12e3 ? d.content.slice(0, 12e3) + "\n\u2026\uFF08\u5DF2\u622A\u65AD\uFF0C\u5B8C\u6574\u5185\u5BB9\u89C1\u843D\u76D8\u6587\u4EF6\uFF09" : d.content
            ) : h2(
              "div",
              { className: "rt-empty" },
              "\u8FD9\u6761\u53EA\u6709\u5143\u6570\u636E\uFF0C\u6CA1\u6709\u6B63\u6587 \u2014\u2014 \u62FF\u5230\u6B63\u6587\u540E\u7528 redteam_poc_update \u8865\u4E0A"
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
        h2("span", { style: { fontWeight: 600 } }, "\u77E5\u8BC6\u5E93 \xB7 POC / EXP"),
        h2("span", { className: "rt-tag" }, stats.total + " \u6761"),
        h2(
          "span",
          { className: "rt-tag rt-tag-live" },
          "\u5DF2\u9A8C\u8BC1 " + stats.verified
        ),
        h2("span", { className: "rt-tag" }, "\u7D2F\u8BA1\u590D\u7528 " + (stats.reused || 0)),
        (stats.uncategorized || 0) > 0 && (stats.uncategorized || 0) !== stats.total ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: "\u8FD9\u4E9B\u6761\u76EE\u8FD8\u6CA1\u5F52\u7C7B\uFF1A\u667A\u80FD\u4F53\u56DE\u586B\u65F6\u7528 redteam_poc_add \u7684 category \u53C2\u6570\u6807\u4E00\u4E0B"
          },
          "\u672A\u5F52\u7C7B " + stats.uncategorized
        ) : null,
        tpl.total ? h2(
          "span",
          { className: "rt-tag rt-tag-passive" },
          "\u672C\u673A\u6A21\u677F " + tpl.total
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn" + (grouped ? " rt-btn-primary" : ""),
            title: "\u6309\u5F52\u7C7B\u5206\u7EC4\u663E\u793A / \u5E73\u94FA\u663E\u793A",
            onClick: () => setGrouped(!grouped)
          },
          grouped ? "\u6309\u5F52\u7C7B\u5206\u7EC4" : "\u5E73\u94FA\u663E\u793A"
        ),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: () => query() },
          busy ? "\u68C0\u7D22\u4E2D\u2026" : "\u5237\u65B0"
        )
      ),
      /* 归类总览：点一下就是按该类筛选，一眼看清"哪类武器攒了多少、哪类还是空的" */
      h2(
        "div",
        { className: "rt-kb-cats" },
        (stats.byCategory || []).filter((c) => catShown(c) > 0 || POC_CAT_ORDER.includes(c.code)).map(
          (c) => h2(
            "span",
            {
              key: c.code,
              className: "rt-concl-i" + (category === c.code ? " on" : ""),
              title: (c.hint || POC_CAT_NAME[c.code] || c.code) + " \xB7 \u672C\u673A\u6A21\u677F " + (tplByCat.get(c.code) || 0) + " \xB7 \u77E5\u8BC6\u5E93 " + (c.n || 0) + (c.verified ? "\uFF08\u5DF2\u9A8C\u8BC1 " + c.verified + "\uFF09" : ""),
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
              (POC_CAT_NAME[c.code] || c.code) + (c.verified ? "\uFF08\u5DF2\u9A8C\u8BC1 " + c.verified + "\uFF09" : "")
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
          placeholder: "\u641C CVE / \u7EC4\u4EF6 / \u5173\u952E\u5B57\uFF08\u6B63\u6587\u4E5F\u4F1A\u641C\uFF09",
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
          h2("option", { value: "" }, "\u5168\u90E8\u5F52\u7C7B"),
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
          h2("option", { value: "" }, "\u5168\u90E8\u6765\u6E90\u9776\u6807"),
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
          placeholder: "\u53D1\u73B0\u8D44\u4EA7\u7B5B\u9009",
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
          h2("option", { value: "" }, "\u5168\u90E8\u7C7B\u578B"),
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
          "\u53EA\u770B\u5DF2\u9A8C\u8BC1"
        ),
        h2(
          "button",
          { className: "rt-btn rt-btn-primary", onClick: () => query() },
          "\u68C0\u7D22"
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
          /* 老 host 还没有知识库接口：讲清怎么恢复，别让人对着 "engagement required" 发懵 */
          "\u77E5\u8BC6\u5E93\u63A5\u53E3\u7531 host \u4FA7\u63D0\u4F9B\uFF0C\u5F53\u524D\u5BBF\u4E3B\u8FD8\u662F\u65E7\u8FDB\u7A0B \u2014\u2014 \u8BF7\u5B8C\u5168\u9000\u51FA\u540E\u91CD\u65B0\u6253\u5F00\uFF08\u5B98\u65B9 exe / \u793E\u533A\u7248 / dsh web \u4EFB\u4E00\uFF09\uFF0C\u518D\u5237\u65B0\u9875\u9762\u3002"
        ) : err
      ) : null,
      !err && data && data.dbPath ? h2(
        "div",
        { className: "rt-foot", style: { marginBottom: 6, fontSize: 11 } },
        "\u77E5\u8BC6\u5E93\uFF1A" + data.dbPath + (data.root ? "\uFF08\u6839\u76EE\u5F55 " + data.root + "\uFF09" : "")
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
                h2("span", { className: "rt-tag" }, list.length + " \u6761"),
                h2(
                  "span",
                  { className: "rt-tag rt-tag-live" },
                  "\u5DF2\u9A8C\u8BC1 " + list.filter((x) => x.verified === 1).length
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
                  "\u6700\u8FD1\u5EFA\u7ACB " + fmt(
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
            "\u672C\u673A nuclei \u6A21\u677F \xB7 " + (tplStart + 1) + "\u2013" + (tplStart + tplItems.length) + " / " + tplMatched + "\uFF08\u76F4\u63A5 `nuclei -t <\u6A21\u677F\u8DEF\u5F84>`\uFF09"
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
                  onClick: () => copy("nuclei -t " + t.path + " -u <\u76EE\u6807>", "\u6A21\u677F\u547D\u4EE4")
                },
                "\u590D\u5236\u547D\u4EE4"
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
              "\u4E0A\u4E00\u9875"
            ),
            h2(
              "button",
              {
                className: "rt-btn",
                disabled: busy || tplStart + tplItems.length >= tplMatched,
                onClick: () => turnTpl(tplStart + tplPageSize)
              },
              "\u4E0B\u4E00\u9875"
            )
          ),
          tpl.dir ? h2(
            "div",
            { className: "rt-foot" },
            h2("span", null, "\u6A21\u677F\u76EE\u5F55\uFF1A" + tpl.dir)
          ) : null
        ) : null,
        data === null ? h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026") : null,
        data !== null && !items.length && !tplItems.length ? h2(
          "div",
          { className: "rt-empty" },
          h2(
            "div",
            null,
            q || kind || verifiedOnly ? "\u6CA1\u6709\u547D\u4E2D\uFF1A\u6362\u4E2A\u5173\u952E\u5B57\u518D\u8BD5\uFF0C\u6216\u53BB\u4E92\u8054\u7F51\u627E / \u81EA\u5DF1\u624B\u6413\u540E\u56DE\u586B\u3002" : tpl.total ? "POC/EXP \u5E93\u8FD8\u662F\u7A7A\u7684\uFF1B\u672C\u673A\u5DF2\u6709 " + tpl.total + " \u4E2A nuclei \u6A21\u677F\uFF0C\u4F46\u8FD9\u4E00\u9875\u6CA1\u6709\u5217\u51FA\u6765\u3002\u8BF7\u5B8C\u5168\u9000\u51FA\u540E\u91CD\u65B0\u6253\u5F00\u5BA2\u6237\u7AEF\u3002" : tpl.dir ? "\u77E5\u8BC6\u5E93\u8FD8\u662F\u7A7A\u7684\uFF08\u672C\u673A\u6A21\u677F\u76EE\u5F55\u5B58\u5728\u4F46\u6CA1\u6709 yaml\uFF0C\u8BF7\u8DD1 nuclei -update-templates\uFF09\u3002" : "\u77E5\u8BC6\u5E93\u8FD8\u662F\u7A7A\u7684\u3002\u672C\u673A\u4E5F\u8FD8\u6CA1\u6709 nuclei \u6A21\u677F\u5E93 \u2014\u2014 \u5728\u6F14\u7EC3\u673A\u4E0A\u8DD1 setup.sh \u6216 `nuclei -update-templates`\uFF0C\u88C5\u597D\u540E\u8FD9\u91CC\u4F1A\u51FA\u73B0\u300C\u672C\u673A\u6A21\u677F N\u300D\u3002"
          ),
          h2(
            "div",
            { style: { marginTop: 6, fontSize: 12 } },
            "\u6253 Nday/1day \u7684\u6807\u51C6\u987A\u5E8F\uFF1A\u2460 redteam_poc_search \u5148\u67E5\u8FD9\u91CC\uFF08\u987A\u5E26\u641C\u672C\u673A nuclei \u6A21\u677F\u5E93\uFF09\u2192 \u2461 \u90FD\u6CA1\u6709\u5C31\u4E92\u8054\u7F51\u641C\u7D22\uFF08web_search / GitHub / ExploitDB / \u5382\u5546\u516C\u544A\uFF09\u6216\u81EA\u5DF1\u624B\u6413 \u2192 \u2462 \u5728\u771F\u5B9E\u76EE\u6807\u4E0A\u9A8C\u8BC1\u6709\u6548\u540E redteam_poc_add \u56DE\u586B\uFF0C\u540E\u9762\u7684\u9776\u6807\u76F4\u63A5\u5C31\u80FD\u7528\u3002"
          ),
          data.dbPath ? h2(
            "div",
            {
              style: { marginTop: 6, fontSize: 11 },
              className: "rt-mono"
            },
            "\u77E5\u8BC6\u5E93\u6587\u4EF6\uFF1A" + data.dbPath
          ) : null,
          tpl.dir ? h2(
            "div",
            {
              style: { marginTop: 6, fontSize: 11 },
              className: "rt-mono"
            },
            "\u6A21\u677F\u76EE\u5F55\uFF1A" + tpl.dir
          ) : null
        ) : null
      ),
      h2(
        "div",
        { className: "rt-foot" },
        h2(
          "span",
          null,
          "\u5168\u5C40\u5171\u4EAB\uFF08\u8DE8\u9776\u6807\uFF09\uFF5C \u843D\u76D8\uFF1Apocs/<code>/ \uFF5C \u53EA\u6536\u5F55\u901A\u7528\u53EF\u590D\u7528\u7684 POC/EXP\uFF0C\u9776\u6807\u4E13\u7528\u811A\u672C\u8D70\u300C\u653B\u51FB\u6587\u4EF6\u300D"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
            setMsg({ err: r && r.error || "\u4FDD\u5B58\u5931\u8D25" });
            return;
          }
          setData(r);
          setMsg({
            ok: "\u5DF2\u4FDD\u5B58\u5230 " + (r.config && r.config.path || "$DSH_HOME/redteam/config.json")
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
        setMsg({ err: "\u8BF7\u5148\u586B\u5199\u5DE5\u5177\u6240\u5728\u6587\u4EF6\u5939\u8DEF\u5F84" });
        return;
      }
      setBusy(true);
      setMsg(null);
      api({ op: "platformAssignToolkit", dir }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "\u81EA\u52A8\u5206\u914D\u5931\u8D25" });
            return;
          }
          setData(r);
          applyDraftFrom(r);
          setMsg({
            ok: "\u5DF2\u4ECE\u6587\u4EF6\u5939\u5206\u914D " + (r.assignedCount || 0) + " \u4E2A\u5DE5\u5177" + (r.nucleiTemplatesDir ? "\uFF0C\u5E76\u8BC6\u522B nuclei-templates" : "")
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
        h2("span", { style: { fontWeight: 600 } }, "\u73AF\u5883\u9002\u914D"),
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
          adapt.ready ? "\u5C31\u7EEA \xB7 " + (adapt.reason || "") : "\u5F85\u914D\u7F6E"
        ),
        h2(
          "span",
          { className: "rt-tag" + (found ? " rt-tag-live" : " rt-tag-warn") },
          "\u5DE5\u5177 " + found + "/" + tools.length
        ),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0"
        ),
        h2(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy || !draft,
            onClick: save
          },
          "\u4FDD\u5B58"
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
          adapt.message || "\u5747\u53EF\u9009\u586B\uFF1A\u7559\u7A7A\u5219\u7528\u9ED8\u8BA4\u8DEF\u5F84/\u81EA\u52A8\u67E5\u627E\u3002\u586B\u4E86\u7684\u8986\u76D6\u9ED8\u8BA4\u3002\u5BC6\u94A5\u7C7B\u53EA\u5728\u9700\u8981\u6D4B\u7ED8/\u53CD\u5F39\u65F6\u624D\u586B\u3002"
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
            "\u6574\u5305\u6587\u4EF6\u5939 \u2192 \u81EA\u52A8\u5206\u914D\u5DE5\u5177"
          ),
          h2(
            "div",
            { style: { marginBottom: 8, opacity: 0.9 } },
            "\u5DE5\u5177\u90FD\u5728\u540C\u4E00\u4E2A\u6587\u4EF6\u5939\uFF08\u542B\u5B50\u76EE\u5F55\uFF09\u65F6\uFF0C\u586B\u8DEF\u5F84\u540E\u70B9\u300C\u81EA\u52A8\u5206\u914D\u300D\uFF1A\u4F1A\u5199\u5165 toolkitDir\uFF0C\u5E76\u6309\u6587\u4EF6\u540D\u5339\u914D nmap / nuclei / fscan \u7B49\u586B\u5230\u4E0B\u65B9\u3002"
          ),
          h2(
            "div",
            { style: { display: "flex", gap: 8, alignItems: "center" } },
            h2("input", {
              className: "rt-input",
              style: { flex: 1 },
              placeholder: "\u4F8B\u5982 D:\\pentest-tools \u6216 /opt/toolkit",
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
              busy ? "\u626B\u63CF\u4E2D\u2026" : "\u81EA\u52A8\u5206\u914D"
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
            "\u51FA\u7F51\u72B6\u6001\uFF08\u501F\u9274 Z3r0 egress\uFF0C\u53EA\u8BFB\uFF09"
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "HTTP_PROXY=" + (data.egress.http_proxy || "(\u7A7A)")
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "HTTPS_PROXY=" + (data.egress.https_proxy || "(\u7A7A)")
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "ALL_PROXY=" + (data.egress.all_proxy || "(\u7A7A)")
          ),
          h2(
            "div",
            { className: "rt-mono", style: { fontSize: 11 } },
            "NO_PROXY=" + (data.egress.no_proxy || "(\u7A7A)")
          ),
          h2(
            "div",
            { style: { marginTop: 6, opacity: 0.85 } },
            data.egress.note || ""
          )
        ) : null,
        !draft ? h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026") : h2(
          "div",
          null,
          h2(
            "div",
            { className: "rt-card" },
            h2("h4", null, "\u5E73\u53F0\u4E0E\u76EE\u5F55"),
            h2(
              "div",
              { style: { display: "grid", gap: 8 } },
              h2(
                "label",
                { style: { fontSize: 12 } },
                "\u5E73\u53F0\u6A21\u5F0F",
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
                  h2("option", { value: "auto" }, "auto\uFF08\u8DDF\u968F\u672C\u673A\uFF0C\u9ED8\u8BA4\uFF09"),
                  h2("option", { value: "windows" }, "windows"),
                  h2("option", { value: "linux" }, "linux")
                )
              ),
              h2(
                "label",
                { style: { fontSize: 12 } },
                "\u5DE5\u5177\u7BB1\u76EE\u5F55 toolkitDir\uFF08\u7559\u7A7A\uFF1D\u9ED8\u8BA4\uFF09",
                h2("input", {
                  className: "rt-input",
                  style: { display: "block", width: "100%", marginTop: 4 },
                  placeholder: "\u9ED8\u8BA4\uFF1A" + defaultToolkit,
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
                "nuclei \u6A21\u677F\u76EE\u5F55\uFF08\u7559\u7A7A\uFF1D\u81EA\u52A8\uFF1Atoolkit/nuclei-templates\uFF09",
                h2("input", {
                  className: "rt-input",
                  style: { display: "block", width: "100%", marginTop: 4 },
                  placeholder: "\u9ED8\u8BA4\uFF1A" + defaultNuclei,
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
                "\u5DE5\u5177\u641C\u7D22\u76EE\u5F55 binDirs\uFF08\u7559\u7A7A\uFF1D\u53EA\u641C toolkit + PATH\uFF1B\u6BCF\u884C\u4E00\u4E2A\uFF09",
                h2("textarea", {
                  className: "rt-input",
                  rows: 4,
                  style: {
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                    fontFamily: "var(--dsw-font-mono, monospace)"
                  },
                  placeholder: "\u53EF\u9009\u3002\u4F8B\u5982\uFF1A" + String.fromCharCode(10) + "D:\\tools" + String.fromCharCode(10) + "D:\\pentest-bin",
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
            h2("h4", null, "\u5BC6\u94A5\u4E0E VPS\uFF08\u7559\u7A7A\uFF1D\u4E0D\u8986\u76D6\uFF1B\u8FDB\u7A0B\u73AF\u5883\u53D8\u91CF\u4F18\u5148\uFF09"),
            h2(
              "div",
              { style: { display: "grid", gap: 8 } },
              ["FOFA_KEY", "REDTEAM_VPS_HOST", "REDTEAM_VPS_KEY"].map(
                (k) => h2(
                  "label",
                  { key: k, style: { fontSize: 12 } },
                  k + "\uFF08\u53EF\u9009\uFF09",
                  h2("input", {
                    className: "rt-input",
                    style: {
                      display: "block",
                      width: "100%",
                      marginTop: 4
                    },
                    type: k === "FOFA_KEY" ? "password" : "text",
                    placeholder: k === "REDTEAM_VPS_KEY" ? "\u7559\u7A7A\uFF1B\u9700\u8981\u65F6\u586B\u79C1\u94A5\u7EDD\u5BF9\u8DEF\u5F84" : k === "REDTEAM_VPS_HOST" ? "\u7559\u7A7A\uFF1B\u9700\u8981\u65F6\u586B user@host" : "\u7559\u7A7A\uFF1B\u6D4B\u7ED8\u65F6\u518D\u586B",
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
            h2("h4", null, "\u5DE5\u5177\u53EF\u6267\u884C\u6587\u4EF6\uFF08\u7559\u7A7A\uFF1D\u81EA\u52A8\u67E5\u627E\uFF09"),
            h2(
              "div",
              {
                style: {
                  fontSize: 11.5,
                  color: "var(--dsw-alias-label-secondary)",
                  marginBottom: 8
                }
              },
              "\u89E3\u6790\u987A\u5E8F\uFF1A\u672C\u8868\u7EDD\u5BF9\u8DEF\u5F84 \u2192 toolkitDir \u2192 binDirs \u2192 PATH\u3002\u7559\u7A7A\u5373\u8D70\u9ED8\u8BA4\u67E5\u627E\u3002"
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
                    t.source + " \xB7 \u5DF2\u627E\u5230"
                  ) : h2(
                    "span",
                    { className: "rt-tag rt-tag-warn" },
                    "\u672A\u627E\u5230\uFF08\u53EF\u7559\u7A7A\u7B49\u88C5\u597D\uFF09"
                  )
                ),
                h2("input", {
                  className: "rt-input",
                  style: { width: "100%" },
                  placeholder: "\u7559\u7A7A\u81EA\u52A8\u627E\uFF1A" + (t.names || []).slice(0, 3).join(" / "),
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
            h2("h4", null, "\u5907\u6CE8"),
            h2("textarea", {
              className: "rt-input",
              rows: 3,
              style: { width: "100%" },
              placeholder: "\u53EF\u9009\u3002\u4F8B\u5982\uFF1A\u5DE5\u5177\u6765\u81EA\u67D0\u67D0\u7EFF\u8272\u5305",
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
              "\u914D\u7F6E\u6587\u4EF6\uFF1A" + (data && data.config && data.config.path || "$DSH_HOME/redteam/config.json") + " | \u7559\u7A7A\u5B57\u6BB5\u5168\u90E8\u8D70\u9ED8\u8BA4"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
        setMsg({ err: "\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" });
        return;
      }
      setBusy(true);
      setMsg(null);
      api({ op: "saveScorePoint", engagement: eng, point: form }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: r && r.error || "\u4FDD\u5B58\u5931\u8D25" });
            return;
          }
          if (r.overridden === false) {
            setMsg({
              err: "\u5DF2\u4FDD\u5B58\u300C\u542F\u7528/\u505C\u7528\u300D\u3002\u5206\u503C\u672A\u6539\u52A8\uFF1A\u8FD9\u662F\u968F\u300A\u5F97\u5206\u89C4\u5219\u300B\u5206\u53D1\u7684\u5185\u7F6E\u5F97\u5206\u70B9\uFF0C\u5206\u503C / \u4E0A\u9650 / \u8BA1\u5206\u53E3\u5F84\u7531\u89C4\u5219\u9501\u5B9A\uFF08\u540C\u4E00\u6761\u89C4\u5219\u7684\u4E0A\u9650\u6309\u7EC4\u5185\u6240\u6709\u5F97\u5206\u70B9\u7D2F\u8BA1\uFF0C\u5355\u72EC\u6539\u5206\u503C\u4F1A\u8BA9\u4E00\u6761\u547D\u4E2D\u5403\u6389\u6574\u7EC4\u4E0A\u9650\uFF09\u3002\u8981\u81EA\u5B9A\u4E49\u5206\u503C\u65F6\u8BF7\u300C+ \u65B0\u589E\u5F97\u5206\u70B9\u300D\u3002"
            });
          } else {
            setMsg({ ok: r.note || "\u5DF2\u4FDD\u5B58" });
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
            setMsg({ err: r && r.error || "\u5220\u9664\u5931\u8D25" });
            return;
          }
          setMsg({ ok: "\u5DF2\u5220\u9664" });
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
              g.tiers.length + " \u9879" + (g.capSum > 0 ? " \xB7 \u5404\u9879\u4E0A\u9650\u5408\u8BA1 " + g.capSum + " \u5206\uFF08\u5404\u9879\u72EC\u7ACB\uFF0C\u4E0D\u8DE8\u9879\u7D2F\u52A0\uFF09" : "")
            ),
            h2("div", { className: "rt-spacer" }),
            g.points > 0 ? h2(
              "span",
              { className: "rt-tag rt-tag-active" },
              "+" + g.points + " \u5206"
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
                p.points + "\u5206"
              )
            ),
            h2(
              "span",
              { title: p.description || "" },
              p.name,
              p.tier ? h2("span", { className: "rt-scope" }, "\u3000" + p.tier) : null
            ),
            /* 命中与上限：这一条计入几次、上限用了多少（G3 各项上限独立，到顶就不再累计） */
            h2(
              "span",
              {
                title: p.capped > 0 ? "\u5DF2\u8BA1\u5165 " + p.counted + " \u6B21\uFF0C\u53E6\u6709 " + p.capped + " \u6761\u56E0\u300C" + (p.scope_label || "\u8BA1\u5206\u53E3\u5F84") + "\u300D\u6216\u5DF2\u8FBE\u4E0A\u9650\u4E0D\u8BA1\u5206" : p.scope_label || ""
              },
              h2(
                "span",
                { className: "rt-sec-count" },
                p.hits.length > 0 ? p.counted + " \u6B21\u547D\u4E2D" : "\u672A\u547D\u4E2D"
              ),
              p.cap > 0 ? h2(
                "span",
                { className: "rt-scope" },
                "\u3000\u4E0A\u9650 " + (p.cap_used === null ? 0 : p.cap_used) + "/" + p.cap
              ) : null
            ),
            h2(
              "span",
              { style: { textAlign: "right" } },
              p.earned > 0 ? h2(
                "span",
                { className: "rt-tag rt-tag-active" },
                "+" + p.earned + " \u5206"
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
              hh.asset_ip || hh.target || "\u672A\u6307\u5B9A\u8D44\u4EA7"
            ),
            hh.self_created ? h2(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title: "\u81EA\u5DF1\u6CE8\u518C/\u81EA\u5EFA\u7684\u8D26\u53F7\u4E0D\u7B97\u5F97\u5206\u6743\u9650\uFF0C\u53EA\u4F5C\u8FC7\u7A0B\u8BB0\u5F55"
              },
              "\u81EA\u5EFA \xB7 \u4E0D\u8BA1\u5206"
            ) : null,
            hh.capped ? h2(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title: hh.capped_reason || "\u540C\u4E00\u8D44\u4EA7\u540C\u4E00\u7AEF\u53E3\u53EA\u7B97\u5206\u503C\u6700\u9AD8\u7684\u4E00\u6761\uFF0C\u8FD9\u6761\u4E0D\u8BA1\u5206"
              },
              "\u670D\u52A1\u5DF2\u62FF\u6EE1 \xB7 \u4E0D\u8BA1\u5206" + (hh.service ? "\uFF08" + hh.service + "\uFF09" : "")
            ) : null,
            hh.shot_count ? h2(
              "span",
              {
                className: "rt-tag",
                title: "\u8FD9\u6761\u547D\u4E2D\u6709\u8BC1\u636E\u622A\u56FE\uFF08\u5C55\u5F00\u5F97\u5206\u70B9\u5373\u53EF\u770B\u5230\u4EE3\u8868\u56FE\uFF09"
              },
              "\u56FE " + hh.shot_count
            ) : null,
            h2("span", { className: "rt-hit-time" }, fmt(hh.recorded_at)),
            h2(
              "button",
              {
                className: "rt-btn",
                style: { padding: "0 5px", fontSize: 10.5 },
                title: "\u590D\u5236\u8FD9\u4E00\u6761",
                onClick: (e) => {
                  e.stopPropagation();
                  copyText(
                    (hh.asset_ip || hh.target || "") + "  " + (hh.evidence || "")
                  );
                }
              },
              "\u590D\u5236"
            ),
            hh.evidence ? h2(
              "span",
              { className: "rt-hit-txt", title: hh.evidence },
              String(hh.evidence).replace(/\n+/g, " ")
            ) : h2(
              "span",
              { className: "rt-hit-txt none" },
              "\u672A\u586B\u8D26\u53F7\u5BC6\u7801/\u7ED3\u679C"
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
                h2("b", null, "\u5F97\u5206\u6761\u4EF6"),
                h2("span", null, p.description)
              ) : null,
              h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "\u72B6\u6001"),
                h2(
                  "span",
                  null,
                  (p.enabled ? "\u542F\u7528" : "\u505C\u7528") + " \xB7 " + p.points + " \u5206/\u6B21 \xB7 \u547D\u4E2D " + p.hits.length + " \u6B21 = " + p.earned + " \u5206" + (p.self_created ? "\uFF08\u53E6\u6709 " + p.self_created + " \u6B21\u81EA\u5EFA\u4E0D\u8BA1\u5206\uFF09" : "") + (p.capped ? "\uFF08\u53E6\u6709 " + p.capped + " \u6B21\u540C\u670D\u52A1\u91CD\u590D\u547D\u4E2D\u4E0D\u8BA1\u5206\uFF09" : "")
                )
              ),
              p.capped ? h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "\u670D\u52A1\u5C01\u9876"),
                h2(
                  "span",
                  null,
                  p.service_summary + "\uFF1B\u8D26\u53F7\u6743\u9650\u4E0E\u6570\u636E\u5E93\u6743\u9650\u6309\u300C\u540C\u8D44\u4EA7\u540C\u7AEF\u53E3\u300D\u53EA\u7B97\u4E00\u6B21\uFF0C\u62FF\u5230\u6700\u9AD8\u6743\u9650\u8D26\u53F7\u5373\u8BE5\u670D\u52A1\u62FF\u6EE1"
                )
              ) : null,
              p.hits.length ? h2(
                "div",
                null,
                h2(ShotStrip, {
                  eng,
                  shots: p.shots,
                  total: p.shot_total,
                  title: "\u8BC1\u636E\u622A\u56FE \xB7 " + (p.shot_total || (p.shots || []).length) + " \u5F20"
                }),
                h2(
                  "div",
                  {
                    className: "rt-section",
                    style: { padding: "6px 0 0" }
                  },
                  "\u547D\u4E2D\u8BB0\u5F55 \xB7 " + p.hits.length + "\uFF08\u53EA\u8BB0\u8D44\u4EA7\u4E0E\u8D26\u53F7\u5BC6\u7801\uFF0C\u8BE6\u7EC6\u590D\u73B0\u89C1\u62A5\u544A\uFF09"
                ),
                h2("div", { className: "rt-hits" }, hitNodes)
              ) : h2(
                "div",
                { className: "rt-kv" },
                h2("b", null, "\u547D\u4E2D\u8BB0\u5F55"),
                h2(
                  "span",
                  { style: { color: "var(--dsw-alias-label-secondary)" } },
                  "\u8FD8\u6CA1\u6709 \u2014\u2014 \u62FF\u4E0B\u6210\u679C\u540E\u7528 redteam_score_hit \u8BB0\u5206\uFF1A\u5199\u660E\u76EE\u6807\u8D44\u4EA7 + \u62FF\u5230\u7684\u8D26\u53F7\u5BC6\u7801/\u6743\u9650"
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
                  "\u7F16\u8F91"
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
        h2("span", { style: { fontWeight: 600 } }, "\u5F97\u5206\u76EE\u6807"),
        /* 只显示已拿下的总分，不显示目标分数、不显示进度条 */
        h2(
          "span",
          {
            style: {
              fontSize: 13,
              color: "var(--dsw-alias-label-secondary)",
              marginLeft: 4
            }
          },
          "\u603B\u5206"
        ),
        h2("span", { className: "rt-total" }, String(summary.achievedPoints)),
        h2(
          "span",
          {
            style: { fontSize: 13, color: "var(--dsw-alias-label-secondary)" }
          },
          "\u5206"
        ),
        h2("span", { className: "rt-tag" }, summary.pointCount + " \u4E2A\u5F97\u5206\u70B9"),
        h2(
          "span",
          { className: "rt-tag" },
          "\u547D\u4E2D " + summary.countedHits + " \u6B21"
        ),
        summary.selfCreatedHits ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: "\u81EA\u5DF1\u6CE8\u518C/\u81EA\u5DF1\u521B\u5EFA\u7684\u8D26\u53F7\u4E0D\u7B97\u5F97\u5206\u6743\u9650\uFF0C\u53EA\u4F5C\u8FC7\u7A0B\u8BB0\u5F55\uFF08\u4E0D\u8BA1\u5206\u3001\u4E0D\u5360\u4E0A\u9650\u3001\u4E0D\u8FDB\u62A5\u544A\uFF09"
          },
          "\u81EA\u5EFA\u4E0D\u8BA1\u5206 " + summary.selfCreatedHits
        ) : null,
        summary.serviceCappedHits ? h2(
          "span",
          {
            className: "rt-tag rt-tag-warn",
            title: "\u8D26\u53F7\u6743\u9650\u4E0E\u6570\u636E\u5E93\u6743\u9650\u6309\u300C\u540C\u8D44\u4EA7\u540C\u7AEF\u53E3\u300D\u53EA\u7B97\u4E00\u6B21\uFF1A\u8BE5\u670D\u52A1\u5DF2\u62FF\u6EE1\uFF0C\u8FD9\u4E9B\u91CD\u590D\u547D\u4E2D\u4E0D\u8BA1\u5206\uFF08\u53EA\u4F5C\u7559\u75D5\uFF09"
          },
          "\u670D\u52A1\u5DF2\u62FF\u6EE1\u4E0D\u8BA1\u5206 " + summary.serviceCappedHits
        ) : null,
        h2("div", { className: "rt-spacer" }),
        h2("button", { className: "rt-btn", onClick: startNew }, "+ \u65B0\u589E\u5F97\u5206\u70B9"),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "\u5237\u65B0\u4E2D\u2026" : "\u5237\u65B0"
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
        /* 内置得分点（builtin）：分值 / 名称 / 分类由《得分规则》锁定，输入框置灰。
         可改的只有「启用 / 停用」。这样界面上就不会再出现「改完提示已保存、刷新变回去」的困惑。 */
        form.builtin ? h2(
          "div",
          { className: "rt-hint", style: { marginBottom: 8 } },
          h2(
            "b",
            null,
            "\u5185\u7F6E\u5F97\u5206\u70B9\uFF08\u6765\u81EA\u300A\u7A81\u7834\u5165\u4FB5\u7C7B\u5F97\u5206\u89C4\u5219\uFF08\u5408\u5E76\u7248\uFF09\u300B\uFF09"
          ),
          h2(
            "div",
            { style: { marginTop: 3 } },
            "\u5206\u503C\u3001\u4E0A\u9650\u3001\u8BA1\u5206\u53E3\u5F84\u4E0E\u540D\u79F0\u7531\u89C4\u5219\u9501\u5B9A \u2014\u2014 \u540C\u4E00\u6761\u89C4\u5219\u7684\u4E0A\u9650\u6309\u7EC4\u5185\u6240\u6709\u5F97\u5206\u70B9\u7D2F\u8BA1\uFF0C\u5355\u72EC\u6539\u5206\u503C\u4F1A\u8BA9\u4E00\u6761\u547D\u4E2D\u5403\u6389\u6574\u7EC4\u4E0A\u9650\u3002\u8FD9\u91CC\u53EF\u4EE5\u6539\u300C\u542F\u7528 / \u505C\u7528\u300D\uFF1B\u8981\u81EA\u5B9A\u4E49\u5206\u503C\u65F6\u8BF7\u8FD4\u56DE\u4E0A\u4E00\u5C4F\u70B9\u300C+ \u65B0\u589E\u5F97\u5206\u70B9\u300D\u3002"
          ),
          form.src !== null && form.src !== void 0 ? h2(
            "div",
            {
              style: {
                marginTop: 3,
                color: "var(--dsw-alias-label-secondary)"
              }
            },
            "\u89C4\u5219\u539F\u6587\u5E8F\u53F7 " + form.src + (form.rule ? "\u3000\xB7\u3000\u4E0A\u9650\u5206\u7EC4 rule=" + form.rule : "") + (form.cap > 0 ? "\u3000\xB7\u3000\u4E0A\u9650 " + form.cap + " \u5206" : "\u3000\xB7\u3000\u4E0D\u8BBE\u4E0A\u9650")
          ) : null
        ) : null,
        h2(
          "div",
          { className: "rt-score-form" },
          h2("input", {
            className: "rt-input",
            placeholder: "\u540D\u79F0\uFF08\u5FC5\u586B\uFF09",
            value: form.name,
            readOnly: form.builtin === true,
            title: form.builtin ? "\u5185\u7F6E\u5F97\u5206\u70B9\u7684\u540D\u79F0\u7531\u89C4\u5219\u9501\u5B9A" : "",
            onChange: (e) => setField("name", e.target.value)
          }),
          h2("input", {
            className: "rt-input",
            placeholder: "\u5206\u7C7B\uFF0C\u5982 \u8D26\u53F7\u6743\u9650",
            value: form.category,
            readOnly: form.builtin === true,
            title: form.builtin ? "\u5185\u7F6E\u5F97\u5206\u70B9\u7684\u5206\u7C7B\u7531\u89C4\u5219\u9501\u5B9A\uFF08\u51B3\u5B9A\u5B83\u5C5E\u4E8E\u9762\u677F\u54EA\u4E00\u7EC4\uFF09" : "",
            onChange: (e) => setField("category", e.target.value)
          }),
          h2("input", {
            className: "rt-input",
            type: "number",
            placeholder: "\u5355\u6B21\u5206\u503C",
            readOnly: form.builtin === true,
            title: form.builtin ? "\u5185\u7F6E\u5F97\u5206\u70B9\u7684\u5206\u503C\u7531\u300A\u5F97\u5206\u89C4\u5219\u300B\u9501\u5B9A\uFF0C\u4E0D\u80FD\u5728\u8FD9\u91CC\u6539" : "\u8FD9\u4E00\u7C7B\u7684\u5355\u6B21\u5206\u503C\uFF1B\u6BCF\u547D\u4E2D\u4E00\u6B21\u5C31\u6309\u8FD9\u4E2A\u5206\u503C\u7D2F\u52A0\uFF08\u53D7\u8BE5\u6761\u89C4\u5219\u4E0A\u9650\u7EA6\u675F\uFF09",
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
            h2("option", { value: "1" }, "\u542F\u7528"),
            h2("option", { value: "0" }, "\u505C\u7528")
          )
        ),
        h2("input", {
          className: "rt-input",
          style: {
            width: "100%",
            marginBottom: 6,
            boxSizing: "border-box"
          },
          placeholder: "\u5F97\u5206\u6761\u4EF6\u8BF4\u660E",
          value: form.description,
          readOnly: form.builtin === true,
          title: form.builtin ? "\u5185\u7F6E\u5F97\u5206\u70B9\u7684\u6761\u6B3E\u6B63\u6587\u7531\u89C4\u5219\u9501\u5B9A" : "",
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
            "\u4FDD\u5B58"
          ),
          form.id ? form.builtin ? h2(
            "button",
            {
              className: "rt-btn",
              disabled: true,
              title: "\u5185\u7F6E\u5F97\u5206\u70B9\u4E0D\u80FD\u5220\u9664\uFF1A\u5220\u6389\u4F1A\u8BA9\u9762\u677F\u7F3A\u4E00\u6761\u89C4\u5219\u3001\u62A5\u544A\u5C11\u4E00\u7C7B\u6210\u679C\uFF08\u4E0B\u6B21\u542F\u52A8\u8FD8\u4F1A\u81EA\u52A8\u8865\u56DE\u6765\uFF09\u3002\u8981\u8BA9\u5B83\u4E0D\u53C2\u4E0E\u8BA1\u5206\u8BF7\u6539\u7528\u300C\u505C\u7528\u300D\u3002"
            },
            "\u5220\u9664\uFF08\u5185\u7F6E\u9879\u4E0D\u53EF\u5220\uFF09"
          ) : h2(
            "button",
            { className: "rt-btn", disabled: busy, onClick: remove },
            "\u5220\u9664"
          ) : null,
          h2(
            "button",
            { className: "rt-btn", onClick: () => setForm(null) },
            "\u53D6\u6D88"
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
          h2("span", null, "\u5206\u503C"),
          h2("span", null, "\u5F97\u5206\u70B9\uFF08\u6309\u5206\u503C\u4ECE\u4F4E\u5230\u9AD8\uFF09"),
          h2("span", null, "\u547D\u4E2D / \u4E0A\u9650"),
          h2("span", { style: { textAlign: "right" } }, "\u5DF2\u5F97\u5206")
        ),
        rows,
        !items.length ? h2(
          "div",
          { className: "rt-empty" },
          "\u6682\u65E0\u5F97\u5206\u70B9\uFF0C\u70B9\u53F3\u4E0A\u89D2\u300C\u65B0\u589E\u5F97\u5206\u70B9\u300D"
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
          "\u590D\u5236"
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
          open ? "\u6536\u8D77" : "\u5C55\u5F00"
        )
      ),
      h2("div", { className: "rt-clip-body" }, text)
    );
  }
  const TEST_STATUS_LABEL = {
    untested: "\u672A\u6D4B\u8BD5",
    testing: "\u6D4B\u8BD5\u4E2D",
    tested: "\u5DF2\u6D4B\u8BD5",
    blocked: "\u88AB\u5C01\u7981",
    abandoned: "\u5DF2\u653E\u5F03",
    no_surface: "\u65E0\u653B\u51FB\u9762"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
          a.scope === "internal" ? "\u5185\u7F51" : "\u5916\u7F51"
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
            "\u5F00\u653E " + a.open_ports + " \u7AEF\u53E3"
          )
        );
      if (a.vulns)
        chips.push(
          h2(
            "span",
            { key: "v", className: "rt-tag rt-tag-live" },
            "\u5DF2\u786E\u8BA4\u6F0F\u6D1E " + a.vulns
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
            "\u96A7\u9053 " + a.tunnels
          )
        );
      if (a.priority)
        chips.push(
          h2("span", { key: "pr", className: "rt-tag" }, "\u6613\u6253 " + a.priority)
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
            "\u88AB\u5C01 " + a.blocked_count + " \u6B21"
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
          "\u6D4B\u8BD5\u9762\uFF1A" + a.test_surface
        ) : null,
        a.potential ? h2("div", { className: "rt-atest-meta" }, "\u9884\u671F\u5F97\u5206\uFF1A" + a.potential) : null,
        noteLines.length ? h2(Clip, { label: "\u6D4B\u8BD5\u8BB0\u5F55", text: noteLines.join("\n") }) : null
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
      concl("\u6D4B\u8BD5\u4E2D", stats.testing, "live"),
      concl("\u5F85\u6D4B", stats.untested, ""),
      concl("\u5DF2\u6D4B", stats.tested, ""),
      concl("\u653E\u5F03", (stats.abandoned || 0) + (stats.blocked || 0), ""),
      concl("\u65E0\u653B\u51FB\u9762", stats.no_surface, ""),
      h2("div", { className: "rt-spacer" }),
      at ? h2(
        "span",
        {
          style: {
            fontSize: 11,
            color: "var(--dsw-alias-label-secondary)"
          }
        },
        "\u66F4\u65B0\u4E8E " + at.toLocaleTimeString("zh-CN", { hour12: false })
      ) : null,
      h2(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          title: "\u5C55\u5F00\u6700\u8FD1\u52A8\u8FC7\u4E0E\u5F85\u6D4B\u961F\u5217",
          onClick: () => collapse.setAll(
            ["testing:" + eng, "recent:" + eng, "queue:" + eng],
            true
          )
        },
        "\u5168\u90E8\u5C55\u5F00"
      ),
      h2(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          title: "\u53EA\u7559\u6B63\u5728\u6D4B",
          onClick: () => collapse.setAll(
            ["testing:" + eng, "recent:" + eng, "queue:" + eng],
            false
          )
        },
        "\u5168\u90E8\u6536\u8D77"
      ),
      h2(
        "button",
        {
          className: "rt-btn" + (auto ? " rt-btn-primary" : ""),
          style: { padding: "0 7px", fontSize: 11 },
          title: "\u6BCF 5 \u79D2\u81EA\u52A8\u5237\u65B0",
          onClick: () => setAuto((x) => !x)
        },
        auto ? "\u5B9E\u65F6 \xB7 5s" : "\u5DF2\u6682\u505C"
      ),
      h2(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          onClick: load
        },
        "\u5237\u65B0"
      )
    );
    const body = [];
    body.push(
      h2(
        Section,
        {
          key: "testing",
          tone: "test",
          title: "\u6B63\u5728\u6D4B",
          count: testing.length + " \u53F0",
          sub: testing.length ? "agent \u6B63\u5728\u6253\u8FD9\u4E9B\u8D44\u4EA7" : "agent \u5F00\u59CB\u6D4B\u67D0\u53F0\u8D44\u4EA7\u540E\u4F1A\u5B9E\u65F6\u51FA\u73B0\u5728\u8FD9\u91CC",
          open: collapse.isOpen("testing:" + eng, true),
          onToggle: collapse.toggle("testing:" + eng, true)
        },
        testing.length ? testing.map((a) => card(a, false)) : h2(
          "div",
          { className: "rt-atest-meta", style: { paddingBottom: 4 } },
          "\u5F53\u524D\u6CA1\u6709\u8D44\u4EA7\u5904\u4E8E\u300C\u6D4B\u8BD5\u4E2D\u300D"
        )
      )
    );
    body.push(
      h2(
        Section,
        {
          key: "recent",
          tone: "past",
          title: "\u6700\u8FD1\u52A8\u8FC7",
          count: recent.length + " \u53F0",
          sub: "\u5DF2\u6D4B\u8FC7\u7684\u8D44\u4EA7",
          open: collapse.isOpen("recent:" + eng, false),
          onToggle: collapse.toggle("recent:" + eng, false)
        },
        recent.length ? recent.map((a) => card(a, true)) : h2("div", { className: "rt-atest-meta" }, "\u6682\u65E0")
      )
    );
    body.push(
      h2(
        Section,
        {
          key: "queue",
          tone: "queue",
          title: "\u5F85\u6D4B\u961F\u5217",
          count: (data ? data.untested || 0 : 0) + " \u53F0",
          sub: "\u6309\u6613\u6253\u6027\u4E0E\u7AEF\u53E3\u6570\u6392\u51FA\u5148\u6253\u54EA\u51E0\u53F0",
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
            "\u5B8C\u6574\u6E05\u5355\uFF08\u542B\u7B5B\u9009\u4E0E\u6392\u5E8F\uFF09\u89C1\u300C\u8D44\u4EA7\u6D4B\u7ED8\u300D\u9875"
          )
        ]) : h2("div", { className: "rt-atest-meta" }, "\u6CA1\u6709\u5F85\u6D4B\u8D44\u4EA7")
      )
    );
    return h2(
      "div",
      { className: "rt-main" },
      conclusion,
      err ? h2("div", { className: "rt-err" }, err) : null,
      data === null && !err ? h2("div", { className: "rt-empty" }, "\u52A0\u8F7D\u4E2D\u2026") : null,
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
            setMsg({ err: r && r.error || "\u68C0\u6D4B\u5931\u8D25" });
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
            ok: "\u68C0\u6D4B\u5B8C\u6210\uFF1AWebShell \u5728\u7EBF " + on + "/" + (r.webshells || []).length + "\uFF0C\u96A7\u9053\u53EF\u7528 " + act + "/" + (r.tunnels || []).length
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
        patch: { status, check_note: "\u754C\u9762\u624B\u52A8\u6807\u8BB0" }
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
        patch: { status, check_note: "\u754C\u9762\u624B\u52A8\u6807\u8BB0" }
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
    const isEncryptedShell = (t) => /behinder|godzilla|冰蝎|哥斯拉/i.test(String(t || ""));
    const isSuo5 = (t) => /suo5/i.test(String(t || ""));
    const hint = (key, title, detail) => h2(
      "div",
      { key, className: "rt-hint" },
      h2("b", null, title),
      h2(
        "details",
        { className: "rt-sess-fold", style: { marginTop: 3 } },
        h2("summary", null, "\u600E\u4E48\u505A\uFF08\u70B9\u51FB\u5C55\u5F00\uFF09"),
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
          "\u6709 " + badShells.length + " \u4E2A\u5165\u53E3\u4E0D\u662F\u51B0\u874E\u9A6C/\u54E5\u65AF\u62C9\u9A6C\uFF08\u7528\u6237\u8FDE\u4E0D\u4E0A\uFF0C\u4E0D\u7B97\u53EF\u4EA4\u4ED8\u5165\u53E3\uFF09",
          "\u7528\u6280\u80FD webshell-toolkit \u91CD\u65B0\u4E0A\u4F20\u51B0\u874E\u9A6C\uFF08behinder\uFF09\u6216\u54E5\u65AF\u62C9\u9A6C\uFF08godzilla\uFF09\uFF0C\u5E76\u628A shell_type + pass_key \u5199\u8FDB redteam_webshell_add\u3002\u53EA\u4F5C\u4E34\u65F6\u4E2D\u8F6C\u7684\u53EF\u5728\u5907\u6CE8\u91CC\u5199\u660E\u3002"
        )
      );
    }
    if (tunnels.length > 0 && legitTunnels.length === 0) {
      hints.push(
        hint(
          "h3",
          "\u73B0\u6709 " + tunnels.length + ' \u6761\u901A\u9053\u90FD\u4E0D\u7B97"\u8DE8\u8D8A\u9776\u6807\u8FB9\u754C"\uFF08\u4E0D\u7B97\u8FB9\u754C/\u5185\u7F51\u7A81\u7834\uFF09',
          "\u81EA\u5DF1\u7684 VPS / \u81EA\u5EFA\u670D\u52A1\u5668\u4E0A\u5F00\u7684 socks5\u3001frp\u3001\u4EE3\u7406\u4E0D\u7B97\u96A7\u9053\u3002\u5FC5\u987B\u662F\u76EE\u6807\u4FA7\u53D1\u8D77\u7684\u901A\u9053\uFF1A\u76EE\u6807\u53CD\u5F39 shell \u5230\u6211\u65B9\u3001\u76EE\u6807\u4E0A\u8DD1 frp/Stowaway \u5BA2\u6237\u7AEF\u3001\u6216\u7ECF\u76EE\u6807 WebShell \u5EFA\u7684 suo5/HTTP \u96A7\u9053\uFF1B\u767B\u8BB0\u65F6\u7528 entry_kind \u8BF4\u660E\u3002"
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
          "\u8FD8\u6CA1\u6709\u53EF\u7528\u7684 suo5 \u96A7\u9053\uFF08\u6253\u8FDB\u5185\u7F51\u7684\u6807\u51C6\u901A\u9053\uFF09",
          "\u7528\u6280\u80FD suo5-tunnel \u901A\u8FC7\u4E0A\u9762\u7684 WebShell \u5EFA socks5 \u96A7\u9053\uFF0C\u518D redteam_tunnel_add\uFF08kind=suo5\u3001listen=127.0.0.1:1080\u3001entry=WebShell URL\u3001reach=\u53EF\u8FBE\u7F51\u6BB5\uFF09\u767B\u8BB0\uFF0C\u6700\u540E\u70B9\u300C\u68C0\u6D4B\u8FDE\u901A\u6027\u300D\u786E\u8BA4 status=active\u3002"
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
          isEncryptedShell(w.shell_type) ? null : h2("span", { className: "rt-tag rt-tag-warn" }, "\u7528\u6237\u8FDE\u4E0D\u4E0A"),
          w.privilege ? h2("span", { className: "rt-tag" }, w.privilege) : null,
          h2("div", { className: "rt-spacer" }),
          copied === "cmd" + w.id ? h2(
            "span",
            { className: "rt-tag", style: { color: "#10b981" } },
            "\u5DF2\u590D\u5236"
          ) : h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => copy("cmd" + w.id, 'curl -s "' + w.url + '"')
            },
            "\u590D\u5236 URL"
          ),
          h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markShell(w, "offline")
            },
            "\u6807\u8BB0\u5931\u6548"
          )
        ),
        h2(
          "div",
          { className: "rt-sess-facts" },
          fact(
            "\u7C7B\u578B",
            isEncryptedShell(w.shell_type) ? "\u52A0\u5BC6\u9A6C\uFF08\u51B0\u874E/\u54E5\u65AF\u62C9\uFF0C\u7528\u6237\u53EF\u76F4\u8FDE\uFF09" : "\u975E\u52A0\u5BC6\u9A6C \u2014\u2014 \u7528\u6237\u8FDE\u4E0D\u4E0A\uFF0C\u4EC5\u53EF\u4F5C\u4E34\u65F6\u4E2D\u8F6C"
          ),
          w.pass_key ? fact("\u8FDE\u63A5\u53E3\u4EE4", h2("span", { className: "rt-mono" }, w.pass_key)) : null,
          w.asset_ip ? fact("\u6240\u5728\u8D44\u4EA7", w.asset_ip) : null,
          w.privilege ? fact("\u6743\u9650", w.privilege) : null,
          w.secret_ref ? fact(
            "\u51ED\u636E\u5F15\u7528",
            h2("span", { className: "rt-mono" }, w.secret_ref)
          ) : null,
          fact(
            "\u6700\u540E\u68C0\u6D4B",
            (w.last_check ? fmt(w.last_check) : "\u672A\u68C0\u6D4B") + (w.latency_ms !== null && w.latency_ms !== void 0 ? "\uFF08" + w.latency_ms + "ms\uFF09" : "")
          ),
          w.check_note ? fact("\u68C0\u6D4B\u8BF4\u660E", w.check_note) : null,
          w.note ? fact("\u5907\u6CE8", w.note) : null
        )
      )
    );
    const tunnelCards = tunnels.map((t) => {
      const proxy = t.listen ? "socks5://" + t.listen : "";
      const gogoCmd = t.listen ? "./gogo -i <\u5185\u7F51CIDR> -m ss --ping -p top2,win,db --proxy " + proxy : "";
      const fscanCmd = t.listen ? "./fscan -h <\u5185\u7F51CIDR> -np -nobr -nopoc -socks5 " + t.listen + " -o intranet.txt" : "";
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
            t.listen || "(\u672A\u586B\u76D1\u542C\u5730\u5740)"
          ),
          h2("span", { className: "rt-tag rt-tag-passive" }, t.kind || "tunnel"),
          isSuo5(t.kind) ? null : h2(
            "span",
            { className: "rt-tag rt-tag-warn" },
            "\u975E suo5 \u6807\u51C6\u901A\u9053"
          ),
          /* 只有跨越靶标边界的通道才算突破凭证（自己 VPS/自建服务器上开的不算） */
          t.legit === true ? h2(
            "span",
            {
              className: "rt-tag rt-tag-live",
              title: t.entry_kind_label || ""
            },
            "\u76EE\u6807\u4FA7\u901A\u9053"
          ) : t.legit === false ? h2(
            "span",
            {
              className: "rt-tag rt-tag-warn",
              title: "\u53EA\u5728\u81EA\u5DF1 VPS/\u81EA\u5EFA\u670D\u52A1\u5668\u4E0A\u5F00\u7684\u901A\u9053\uFF0C\u6CA1\u6709\u78B0\u5230\u76EE\u6807 \u2014\u2014 \u4E0D\u7B97\u8FB9\u754C\u7A81\u7834/\u5185\u7F51\u7A81\u7834"
            },
            "\u4E0D\u7B97\u7A81\u7834"
          ) : h2(
            "span",
            {
              className: "rt-tag",
              title: "\u672A\u58F0\u660E entry_kind\uFF1A\u8BF7\u8BF4\u660E\u76EE\u6807\u4FA7\u7684\u90A3\u4E00\u7AEF\u662F\u4EC0\u4E48\uFF08target-outbound / target-http / target-agent\uFF09"
            },
            "\u5F85\u786E\u8BA4"
          ),
          t.reach ? h2("span", { className: "rt-tag" }, "\u53EF\u8FBE " + t.reach) : null,
          h2("div", { className: "rt-spacer" }),
          h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => copy("sock" + t.id, t.listen || "")
            },
            copied === "sock" + t.id ? "\u5DF2\u590D\u5236" : "\u590D\u5236\u5730\u5740"
          ),
          t.status === "active" ? h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markTunnel(t, "down")
            },
            "\u6807\u8BB0\u5931\u6548"
          ) : h2(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markTunnel(t, "active")
            },
            "\u6807\u8BB0\u53EF\u7528"
          )
        ),
        h2(
          "div",
          { className: "rt-sess-facts" },
          fact("\u76EE\u6807\u4FA7\u5165\u53E3", t.entry || "\u672A\u767B\u8BB0"),
          fact(
            "\u8DE8\u8D8A\u8FB9\u754C",
            t.legit === true ? h2(
              "span",
              { className: "rt-tag rt-tag-live" },
              t.entry_kind_label || t.entry_kind || "\u5DF2\u786E\u8BA4\u76EE\u6807\u4FA7"
            ) : t.legit === false ? h2(
              "span",
              { className: "rt-tag rt-tag-warn" },
              "\u4E0D\u7B97\u7A81\u7834\uFF08\u53EA\u5728\u81EA\u5DF1 VPS \u4E0A\u5F00\u4EE3\u7406\uFF09"
            ) : h2(
              "span",
              { className: "rt-tag" },
              "\u672A\u58F0\u660E entry_kind\uFF0C\u5F85\u786E\u8BA4"
            )
          ),
          t.reach ? fact("\u53EF\u8FBE\u7F51\u6BB5", t.reach) : null,
          t.asset_ip ? fact("\u6240\u5728\u8D44\u4EA7", t.asset_ip) : null,
          fact(
            "\u6700\u540E\u68C0\u6D4B",
            (t.last_check ? fmt(t.last_check) : "\u672A\u68C0\u6D4B") + (t.latency_ms !== null && t.latency_ms !== void 0 ? "\uFF08" + t.latency_ms + "ms\uFF09" : "")
          ),
          t.check_note ? fact("\u68C0\u6D4B\u8BF4\u660E", t.check_note) : null,
          t.note ? fact("\u5907\u6CE8", t.note) : null
        ),
        /* 命令默认折叠：卡片首要信息是"这条通道能不能用、通向哪"，命令按需展开 */
        t.command ? h2(
          "details",
          { className: "rt-sess-fold" },
          h2("summary", null, "\u5EFA\u7ACB\u547D\u4EE4\uFF08\u70B9\u51FB\u5C55\u5F00 / \u590D\u5236\uFF09"),
          h2(
            "div",
            Object.assign(
              { className: "rt-code", title: "\u70B9\u51FB\u590D\u5236" },
              clickable(() => copy("c" + t.id, t.command), {
                label: "\u590D\u5236\u547D\u4EE4"
              })
            ),
            copied === "c" + t.id ? "\u5DF2\u590D\u5236" : t.command
          )
        ) : null,
        t.status === "active" && t.listen ? h2(
          "details",
          { className: "rt-sess-fold" },
          h2("summary", null, "\u8D70\u8FD9\u6761\u96A7\u9053\u626B\u63CF\uFF08gogo / fscan \u547D\u4EE4\uFF09"),
          h2(
            "div",
            { className: "rt-sess-cmd" },
            h2(
              "div",
              Object.assign(
                { className: "rt-code", title: "\u70B9\u51FB\u590D\u5236" },
                clickable(() => copy("g" + t.id, gogoCmd), {
                  label: "\u590D\u5236 gogo \u547D\u4EE4"
                })
              ),
              copied === "g" + t.id ? "\u5DF2\u590D\u5236" : gogoCmd
            ),
            h2(
              "div",
              Object.assign(
                {
                  className: "rt-code",
                  style: { display: "block", marginTop: 3 },
                  title: "\u70B9\u51FB\u590D\u5236"
                },
                clickable(() => copy("f" + t.id, fscanCmd), {
                  label: "\u590D\u5236 fscan \u547D\u4EE4"
                })
              ),
              copied === "f" + t.id ? "\u5DF2\u590D\u5236" : fscanCmd
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
        h2("span", { style: { fontWeight: 600 } }, "\u4F1A\u8BDD\u4E0E\u5165\u53E3"),
        h2(
          "span",
          { className: "rt-tag" },
          "WebShell " + (totals.webshellsOnline || 0) + "/" + (totals.webshells || 0) + " \u5728\u7EBF"
        ),
        h2(
          "span",
          { className: "rt-tag" },
          "\u96A7\u9053 " + (totals.tunnelsActive || 0) + "/" + (totals.tunnels || 0) + " \u53EF\u7528"
        ),
        h2("span", { className: "rt-tag" }, "\u51ED\u636E " + (totals.credentials || 0)),
        h2("span", { className: "rt-tag" }, "\u8BBF\u95EE\u4F1A\u8BDD " + (totals.access || 0)),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy,
            onClick: probe
          },
          busy ? "\u68C0\u6D4B\u4E2D\u2026" : "\u68C0\u6D4B\u8FDE\u901A\u6027"
        ),
        h2("button", { className: "rt-btn", onClick: load }, "\u5237\u65B0")
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
          h2("div", null, "\u8FD8\u6CA1\u6709\u767B\u8BB0\u4EFB\u4F55 WebShell \u6216\u96A7\u9053\u3002"),
          h2(
            "div",
            { style: { marginTop: 6, fontSize: 12 } },
            "\u62FF\u5230 WebShell \u7528 redteam_webshell_add\uFF1B\u5EFA\u597D\u96A7\u9053\u7528 redteam_tunnel_add\uFF08suo5 / socks5 / ssh -R\uFF09\uFF1B\u4E4B\u540E\u667A\u80FD\u4F53\u7528 redteam_sessions \u5C31\u80FD\u770B\u5230\u3002"
          )
        ) : null,
        hints.length ? h2("div", { style: { padding: "8px 10px 0" } }, hints) : null,
        h2(
          Section,
          {
            key: "webshells",
            tone: "queue",
            title: "WebShell",
            count: (totals.webshellsOnline || 0) + "/" + (totals.webshells || 0) + " \u5728\u7EBF",
            sub: "\u5DF2\u4E0A\u7EBF\u7684\u53EF\u63A7\u5165\u53E3",
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
            "\u6682\u65E0\uFF08\u62FF\u5230 WebShell \u540E\u7528 redteam_webshell_add \u767B\u8BB0\uFF09"
          )
        ),
        h2(
          Section,
          {
            key: "tunnels",
            tone: "test",
            title: "\u5185\u7F51\u96A7\u9053",
            count: (totals.tunnelsActive || 0) + "/" + (totals.tunnels || 0) + " \u53EF\u7528",
            sub: "\u53EF\u76F4\u63A5\u7ED9\u626B\u63CF\u5668\u5F53\u4EE3\u7406\u7528",
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
            "\u6682\u65E0\uFF08\u5EFA\u597D\u96A7\u9053\u540E\u7528 redteam_tunnel_add \u767B\u8BB0\uFF09"
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
        console.error("[redteam-ui] \u9875\u9762\u6E32\u67D3\u51FA\u9519:", error);
      } catch (e) {
      }
    }
    render() {
      if (this.state.error) {
        const msg = this.state.error && this.state.error.message ? this.state.error.message : String(this.state.error);
        return h2(
          "div",
          { className: "rt-pane" },
          h2("div", { className: "rt-err" }, "\u8BE5\u9875\u9762\u6E32\u67D3\u51FA\u9519\uFF1A" + msg),
          h2(
            "button",
            {
              className: "rt-btn",
              onClick: () => {
                this.setState({ error: null });
                setUI({ tab: "assets" });
              }
            },
            "\u56DE\u5230\u8D44\u4EA7\u6D4B\u7ED8"
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
            setErr(r && r.error || "\u8BFB\u53D6\u5931\u8D25");
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
        h2("span", { style: { fontWeight: 600 } }, "\u4F5C\u6218\u667A\u80FD\u4F53"),
        h2("span", { className: "rt-tag rt-tag-passive" }, "\u5E76\u53D1\u4E0A\u9650 " + max),
        used === null ? h2("span", { className: "rt-tag" }, "\u5360\u7528\u672A\u77E5") : h2(
          "span",
          {
            className: "rt-tag" + (used >= max ? " rt-tag-warn" : " rt-tag-live")
          },
          "\u5728\u8DD1 " + used + " / \u5269\u4F59 " + Math.max(max - used, 0)
        ),
        h2("div", { className: "rt-spacer" }),
        h2(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "\u8BFB\u53D6\u4E2D\u2026" : "\u5237\u65B0"
        )
      ),
      h2(
        "div",
        { className: "rt-pane" },
        err ? h2("div", { className: "rt-err" }, err) : null,
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "\u5E76\u53D1\u89C4\u5219\uFF08\u786C\u7EA6\u675F\uFF09"),
          h2(
            "div",
            { style: { fontSize: 12, lineHeight: 1.7 } },
            "\xB7 \u540C\u4E00\u9776\u6807**\u540C\u65F6\u6700\u591A " + max + " \u4E2A\u6267\u884C\u667A\u80FD\u4F53**\uFF1B\u4E3B\u4F1A\u8BDD\u6D3E\u6D3B\u524D\u7528 `redteam_agent_slot` \u5360\u4F4D\uFF0C\u6EE1\u4E86\u76F4\u63A5\u62D2\u7EDD\u3002",
            h2("br"),
            "\xB7 **\u9ED8\u8BA4\u4E00\u4E2A\u4E00\u4E2A\u6D3E\u3001\u6309\u987A\u5E8F\u63A8\u8FDB**\uFF1B\u53EA\u6709\u786E\u5B9E\u4E92\u4E0D\u4F9D\u8D56\u7684\u6D3B\u624D\u5E76\u884C\u3002",
            h2("br"),
            "\xB7 \u6BCF\u4E2A\u4F1A\u8BDD\u6709**\u81EA\u5DF1\u7684\u9776\u6807\u7ED1\u5B9A**\uFF1A\u591A\u4F1A\u8BDD\u5E76\u884C\u4E0D\u4F1A\u628A\u62A5\u544A\u5199\u4E32\uFF08\u5B50\u667A\u80FD\u4F53\u7EE7\u627F\u7236\u4F1A\u8BDD\u7684\u9776\u6807\uFF09\u3002"
          )
        ),
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "\u516D\u4E2A\u89D2\u8272"),
          h2(
            "div",
            { style: { fontSize: 12, lineHeight: 1.8 } },
            "\u2460 \u4FE1\u606F\u6536\u96C6 `recon` \u2014\u2014 \u53EA\u6536\u96C6\u8D44\u4EA7\uFF0C\u628A\u5355\u4F4D\u8D44\u4EA7\u6536\u96C6\u5B8C\u6574\uFF08\u542B\u8FB9\u7F18\u4E0E\u672A\u5907\u6848\u8D44\u4EA7\uFF09",
            h2("br"),
            "\u2461 \u8D44\u4EA7\u68B3\u7406 `assess` \u2014\u2014 \u4E00\u6761\u4E00\u6761\u8FC7\uFF0C\u8BC4\u6613\u6253\u6027\u5E76\u5168\u90E8\u843D\u5E93",
            h2("br"),
            "\u2462 \u6F0F\u6D1E\u53D1\u73B0 `vuln-scan` \u2014\u2014 \u5148\u67E5\u5E93\u53BB\u91CD \u2192 Nday/1day \u4F18\u5148 \u2192 \u63A5\u53E3\u672A\u6388\u6743\u63A2\u6D4B",
            h2("br"),
            "\u2463 \u6F0F\u6D1E\u5229\u7528 `exploit` \u2014\u2014 \u5148\u62FF\u670D\u52A1\u5668\u6743\u9650\uFF08\u51B0\u874E/\u54E5\u65AF\u62C9\u9A6C\uFF09+ \u5EFA suo5 \u96A7\u9053\uFF0C\u518D\u6253\u5176\u5B83\u5F97\u5206\u9879",
            h2("br"),
            "\u2464 \u5185\u7F51\u6E17\u900F `internal` \u2014\u2014 \u8D70\u96A7\u9053\uFF0C\u4F9D\u6B21\u62C9\u8D77 \u2460\u2461\u2462\u2463 \u505A\u5185\u7F51",
            h2("br"),
            "\u2465 \u4E3B\u4F1A\u8BDD `plan` \u2014\u2014 \u53EA\u505A\u8BA1\u5212\u3001\u6D3E\u6D3B\u3001\u6C47\u603B\u3001\u6C47\u62A5\uFF0C\u4E0D\u52A8\u624B"
          )
        ),
        h2(ConcurrencyCard, { concurrency, onSaved: load }),
        h2(
          "div",
          { className: "rt-card" },
          h2("h4", null, "\u89D2\u8272\u63D0\u793A\u8BCD\uFF08\u6309\u9776\u6807\u5B58\uFF0C\u53EF\u5728\u8FD9\u91CC\u7F16\u8F91\uFF09"),
          h2(
            "div",
            {
              style: {
                fontSize: 11.5,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 6
              }
            },
            "\u300C\u667A\u80FD\u4F53\u63D0\u793A\u8BCD\u300D\u5DF2\u5E76\u5165\u672C\u9875\uFF1B\u4E0B\u9762\u662F\u5B8C\u6574\u7F16\u8F91\u5668\uFF08\u6539\u5B8C\u70B9\u4FDD\u5B58\uFF0C\u53EA\u5F71\u54CD\u5F53\u524D\u9776\u6807\uFF09\u3002"
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
    const source = info.source === "settings" ? "\u9762\u677F\u4E2D\u8BBE\u7F6E" : info.source === "env" ? "\u73AF\u5883\u53D8\u91CF REDTEAM_MAX_AGENTS" : "\u9ED8\u8BA4\u503C";
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
            setMsg({ err: r && r.error || "\u4FDD\u5B58\u5931\u8D25" });
            return;
          }
          setMsg({
            ok: "\u5DF2\u4FDD\u5B58\uFF1A\u5E76\u53D1\u4E0A\u9650 " + r.max + "\uFF08\u7ACB\u5373\u751F\u6548\uFF0C\u4E0D\u7528\u91CD\u542F\uFF09"
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
      h2("h4", null, "\u5E76\u53D1\u6570\u91CF"),
      h2(
        "div",
        { style: { fontSize: 12, lineHeight: 1.8, marginBottom: 8 } },
        "\u540C\u4E00\u9776\u6807**\u540C\u65F6\u6700\u591A\u51E0\u4E2A\u6267\u884C\u667A\u80FD\u4F53**\u3002\u5F53\u524D\u751F\u6548\uFF1A**" + (info.max || "?") + "**" + (used === null ? "" : "\uFF08\u5728\u8DD1 " + used + "\uFF0C\u5269\u4F59 " + Math.max((info.max || 0) - used, 0) + "\uFF09") + "\uFF0C\u6765\u6E90\uFF1A" + source + "\u3002\u6539\u5B8C**\u7ACB\u5373\u751F\u6548**\uFF0C\u4E0D\u7528\u91CD\u542F\u3002"
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
          "\u8303\u56F4 1 \u2013 " + limit
        ),
        h2(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy || invalid,
            onClick: save
          },
          busy ? "\u4FDD\u5B58\u4E2D\u2026" : "\u4FDD\u5B58"
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
        "\u26A0\uFE0F \u8C03\u5927\u4E0D\u7B49\u4E8E\u66F4\u5FEB\uFF1A**\u540C\u4E00\u4E2A\u6A21\u578B API Key \u7684\u5E76\u53D1/\u901F\u7387\u4E0A\u9650\u662F\u5171\u4EAB\u7684**\uFF0C\u540C\u65F6\u6D3E\u592A\u591A\u4F1A\u4E92\u76F8\u6324\u5360\uFF0C\u8868\u73B0\u4E3A\u6392\u961F\u7B49\u5F85\u3001\u8D85\u65F6\u3001\u8FD4\u56DE\u88AB\u622A\u65AD\u751A\u81F3\u9650\u6D41\u62A5\u9519 \u2014\u2014 \u53CD\u800C\u8BA9\u6D4B\u8BD5\u7ED3\u679C\u4E0D\u7A33\u5B9A\uFF08\u6F0F\u6D4B\u3001\u534A\u9014\u800C\u5E9F\uFF09\u3002\u5EFA\u8BAE\u4ECE 2\u20133 \u5F00\u59CB\uFF0C\u53EA\u6709\u5728\u786E\u8BA4 Key \u7684\u989D\u5EA6\u8DB3\u591F\u3001\u4EFB\u52A1\u4E4B\u95F4\u786E\u5B9E\u4E92\u4E0D\u4F9D\u8D56\u65F6\u624D\u8C03\u5927\u3002"
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
            if (!silent) setErr(r && r.error || "\u68C0\u67E5\u66F4\u65B0\u5931\u8D25");
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
            setMsg({ err: r && r.error || "\u66F4\u65B0\u5931\u8D25" });
            return;
          }
          setMsg({
            ok: "\u5DF2\u5B89\u88C5 " + (r.installed || "") + "\uFF0C\u6B63\u5728\u91CD\u542F\u5F53\u524D\u5BBF\u4E3B\u2026"
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
          title: "\u5F53\u524D\u7248\u672C " + (current || "\u672A\u77E5") + (latest ? "\n\u6700\u65B0\u7248\u672C " + latest : "") + (mode === "dev" ? "\n\u5B89\u88C5\u65B9\u5F0F\uFF1A\u5F00\u53D1\u6001\uFF08\u6E90\u7801\u8F6F\u94FE\uFF09" : mode === "package" ? "\n\u5B89\u88C5\u65B9\u5F0F\uFF1A\u5305\u5B89\u88C5" : "") + (info && info.check_error ? "\n\u68C0\u67E5\u5931\u8D25\uFF1A" + info.check_error : "")
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
          title: "\u53D1\u73B0\u65B0\u7248\u672C " + latest + "\uFF1A\u70B9\u51FB\u67E5\u770B\u5E76\u4E00\u952E\u66F4\u65B0\uFF08\u4F1A\u91CD\u542F\u5F53\u524D\u5BBF\u4E3B\uFF09"
        },
        busy ? "\u68C0\u67E5\u4E2D\u2026" : "\u6709\u65B0\u7248\u672C v" + latest
      ) : h2(
        "button",
        {
          className: "rt-btn",
          disabled: busy,
          onClick: () => check(false),
          title: "\u91CD\u65B0\u68C0\u67E5 npm \u4E0A\u7684\u6700\u65B0\u7248\u672C"
        },
        busy ? "\u68C0\u67E5\u4E2D\u2026" : "\u68C0\u67E5\u66F4\u65B0"
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
          h2("h4", { style: { marginTop: 0 } }, "\u66F4\u65B0 RedTeam \u6A21\u5F0F"),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u5F53\u524D\u7248\u672C"),
            h2("span", null, current || "\u672A\u77E5")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u6700\u65B0\u7248\u672C"),
            h2("span", null, latest || "\u672A\u77E5")
          ),
          h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u5B89\u88C5\u65B9\u5F0F"),
            h2(
              "span",
              null,
              mode === "dev" ? "\u5F00\u53D1\u6001\uFF08\u6E90\u7801\u8F6F\u94FE\uFF09" : mode === "package" ? "\u5305\u5B89\u88C5\uFF08" + (info.install && info.install.packageManager || "npm") + "\uFF09" : "\u672A\u77E5"
            )
          ),
          info && info.install && info.install.dir ? h2(
            "div",
            { className: "rt-kv" },
            h2("b", null, "\u5B89\u88C5\u4F4D\u7F6E"),
            h2("span", { className: "rt-mono" }, info.install.dir)
          ) : null,
          blockers.length ? h2(
            "div",
            { className: "rt-hint" },
            h2(
              "div",
              { style: { fontWeight: 600, marginBottom: 4 } },
              "\u73B0\u5728\u4E0D\u80FD\u66F4\u65B0\uFF1A"
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
            "\u66F4\u65B0\u8FC7\u7A0B\uFF1A\u5B89\u88C5\u65B0\u7248\u672C \u2192 \u81EA\u52A8\u91CD\u542F\u5F53\u524D\u5BBF\u4E3B\uFF08\u5B98\u65B9 exe / \u793E\u533A\u7248 / dsh web\uFF1B\u5F53\u524D\u9875\u9762\u4F1A\u65AD\u5F00\uFF0C\u7EA6 5\u201310 \u79D2\u540E\u81EA\u52A8\u5237\u65B0\uFF09\u3002\u91CD\u542F\u524D\u4F1A\u68C0\u67E5\u6709\u6CA1\u6709\u667A\u80FD\u4F53\u5728\u8DD1\uFF0C\u6709\u5C31\u62E6\u4F4F\u4E0D\u52A8\u3002"
          ),
          msg ? h2(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok
          ) : null,
          countdown > 0 ? h2(
            "div",
            { className: "rt-foot" },
            "\u5BBF\u4E3B\u6B63\u5728\u91CD\u542F\uFF0C" + countdown + " \u79D2\u540E\u81EA\u52A8\u5237\u65B0\u9875\u9762\u2026"
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
              "\u5173\u95ED"
            ),
            h2(
              "button",
              {
                className: "rt-btn rt-btn-primary",
                disabled: busy || blockers.length > 0 || mode === "dev",
                title: mode === "dev" ? "\u5F00\u53D1\u6001\u5B89\u88C5\u8BF7\u7528\u4ED3\u5E93\u6D41\u7A0B\u5347\u7EA7" : blockers.length ? "\u5148\u89E3\u51B3\u4E0A\u9762\u7684\u963B\u585E\u9879" : "\u5B89\u88C5\u5E76\u91CD\u542F",
                onClick: apply2
              },
              busy ? "\u66F4\u65B0\u4E2D\u2026" : "\u4E00\u952E\u66F4\u65B0\u5E76\u91CD\u542F"
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
            setErr(r && r.error || "\u52A0\u8F7D\u5931\u8D25");
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
            setErr(r && r.error || "\u65E0\u6CD5\u8FDE\u63A5\u8D44\u4EA7\u5E93");
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
            setErr(r && r.error || "\u521B\u5EFA\u5931\u8D25");
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
      ["assets", "\u8D44\u4EA7\u6D4B\u7ED8"],
      ["env", "\u73AF\u5883\u9002\u914D"],
      ["agents", "\u667A\u80FD\u4F53"],
      ["sessions", "\u4F1A\u8BDD\u96A7\u9053"],
      ["findings", "\u6F0F\u6D1E\u6218\u679C"],
      ["chain", "\u653B\u51FB\u94FE"],
      ["scores", "\u5F97\u5206\u76EE\u6807"],
      ["report", "\u62A5\u544A"],
      ["knowledge", "\u77E5\u8BC6\u5E93"],
      ["skills", "\u6280\u80FD\u5E93"]
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
        setErr("\u65E0\u6CD5\u6253\u5F00\u65B0\u7A97\u53E3\uFF1A" + (e && e.message || e));
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
          h2("h4", null, "\u8FD8\u6CA1\u6709\u9776\u6807"),
          h2(
            "div",
            {
              style: {
                fontSize: 12,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 8
              }
            },
            "\u8F93\u5165\u653B\u9632\u6F14\u7EC3\u9776\u6807\u5355\u4F4D\u540D\u79F0\uFF0C\u521B\u5EFA\u6F14\u7EC3\u5E76\u5F00\u59CB\u8D44\u4EA7\u6D4B\u7ED8\u3002"
          ),
          h2(
            "div",
            { style: { display: "flex", gap: 8 } },
            h2("input", {
              className: "rt-input",
              style: { flex: 1 },
              placeholder: "\u4F8B\u5982\uFF1A\u793A\u4F8B\u79D1\u6280\u6709\u9650\u516C\u53F8",
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
              creating ? "\u521B\u5EFA\u4E2D\u2026" : "\u521B\u5EFA\u9776\u6807"
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
    else body = h2("div", { className: "rt-empty" }, "\u672A\u77E5\u9875\u7B7E");
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
        title: "\u62D6\u52A8\u8C03\u6574\u5BBD\u5EA6",
        onMouseDown: startResizeLeft
      }),
      full || embedded ? null : h2("div", {
        className: "rt-resize-r",
        title: "\u62D6\u52A8\u8C03\u6574\u5BBD\u5EA6",
        onMouseDown: startResizeRight
      }),
      full || embedded ? null : h2("div", {
        className: "rt-resize-b",
        title: "\u62D6\u52A8\u8C03\u6574\u9AD8\u5EA6",
        onMouseDown: startResizeBottom
      }),
      full || embedded ? null : h2("div", {
        className: "rt-resize-c",
        title: "\u62D6\u52A8\u8C03\u6574\u5927\u5C0F",
        onMouseDown: startResizeCorner
      }),
      h2(
        "div",
        {
          className: "rt-head",
          onMouseDown: full || embedded ? void 0 : startDrag,
          title: full || embedded ? void 0 : "\u6309\u4F4F\u62D6\u52A8\u9762\u677F"
        },
        embedded ? null : h2(
          "div",
          { className: "rt-title" },
          h2("span", { className: "rt-dot" }),
          full ? "\u6F14\u7EC3\u53F0 \xB7 \u5168\u9762\u6D4F\u89C8" : "\u6F14\u7EC3\u53F0",
          full ? h2(
            "span",
            { className: "rt-tag", style: { marginLeft: 6 } },
            "\u72EC\u7ACB\u7A97\u53E3"
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
            engagements.length ? "\u9009\u62E9\u9776\u6807" : "\u6682\u65E0\u9776\u6807"
          ),
          engagements.map(
            (x) => h2("option", { key: x.id, value: x.id }, x.name || x.id || "\u672A\u547D\u540D")
          )
        ),
        h2("div", { className: "rt-spacer" }),
        embedded ? null : h2(VersionBar, null),
        full ? h2(
          "button",
          {
            className: "rt-btn",
            title: "\u56DE\u5230\u5E26\u4FA7\u680F\u7684\u666E\u901A\u754C\u9762\uFF08\u6216\u6309 Esc\uFF09",
            onClick: exitFull
          },
          "\u9000\u51FA\u5168\u9762\u6D4F\u89C8"
        ) : null,
        embedded ? null : h2(
          "button",
          {
            className: "rt-btn",
            title: "\u5237\u65B0\u540D\u518C\u3001\u5FEB\u7167\u4E0E\u5F53\u524D\u9875\u9762\u6570\u636E",
            onClick: refreshAll
          },
          "\u5237\u65B0"
        ),
        full || embedded ? null : h2(
          "button",
          {
            className: "rt-btn",
            title: "\u5728\u65B0\u6D4F\u89C8\u5668\u7A97\u53E3\u6253\u5F00\u5B8C\u6574\u63A7\u5236\u53F0",
            onClick: openFull
          },
          "\u5168\u9762\u6D4F\u89C8"
        ),
        full || embedded ? null : h2(
          "button",
          {
            className: "rt-btn",
            title: "\u6536\u8D77\u9762\u677F",
            onClick: () => setUI({ open: false })
          },
          "\u6536\u8D77"
        )
      ),
      /* 页签栏用标准 tablist/tab 角色：读屏软件据此播报「第几个页签、是否选中」。
           键盘用户 Tab 进来后可用 Enter/Space 切换（由 clickable 提供）。 */
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
              title: unreadOf(t[0]) ? t[1] + "\uFF1A\u6709\u65B0\u5185\u5BB9\uFF0C\u70B9\u5F00\u770B\u8FC7\u7EA2\u70B9\u5C31\u4F1A\u6D88\u5931" : t[1]
            }),
            t[1],
            unreadOf(t[0]) ? (
              /* 红点是纯视觉信息，给读屏软件一个文字替代 */
              h2("span", { className: "rt-tab-dot", "aria-label": "\u6709\u65B0\u5185\u5BB9" })
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
        h2("span", null, "C \u6BB5 " + (stats.segments || 0)),
        h2(
          "span",
          null,
          "\u8D44\u4EA7 " + (stats.assets || 0) + "\uFF08\u5B58\u6D3B " + (stats.liveAssets || 0) + "\uFF09"
        ),
        h2("span", null, "\u7AEF\u53E3 " + (stats.openPorts || 0)),
        h2("span", null, "\u6307\u7EB9 " + (stats.fingerprints || 0)),
        h2("span", null, "\u6F0F\u6D1E " + (stats.vulns || 0)),
        h2(
          "span",
          null,
          "\u88AB\u52A8/\u4E3B\u52A8 " + (stats.passiveSignals || 0) + "/" + (stats.activeSignals || 0)
        ),
        h2("div", { className: "rt-spacer" }),
        full ? h2("span", null, "\u6309 Esc \u6216\u70B9\u53F3\u4E0A\u89D2\u300C\u9000\u51FA\u5168\u9762\u6D4F\u89C8\u300D\u56DE\u5230\u5E26\u4FA7\u680F\u7684\u754C\u9762") : null,
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
        title: "RedTeam \u63A7\u5236\u53F0\uFF08\u5E38\u9A7B\u53F3\u4FA7\u680F\uFF09",
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
        title: "RedTeam \u63A7\u5236\u53F0\uFF08\u5E38\u9A7B\u53F3\u4FA7\u680F\uFF09",
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
        title: "\u5168\u9762\u6D4F\u89C8\uFF1A\u5728\u65B0\u7A97\u53E3\u6253\u5F00\u5B8C\u6574\u63A7\u5236\u53F0\uFF08\u5F53\u524D\u7A97\u53E3\u4E0D\u53D7\u5F71\u54CD\uFF1B\u65B0\u7A97\u53E3\u5185\u6309 Esc \u9000\u51FA\uFF09",
        onClick: open
      },
      h2("span", { style: { fontSize: 14 } }, "\u26F6"),
      props.wide ? h2("span", null, "\u5168\u9762\u6D4F\u89C8") : null
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
var translate = (key) => key;
function setTranslate(t) {
  translate = t;
}
function useT() {
  return translate;
}
var zh = {
  nav: "\u89C4\u5219\u8BBE\u5B9A",
  "dock.clean": "\u6E05\u6D17",
  "dock.drill": "\u6F14\u7EC3\u53F0",
  "dock.toggle": "dsh-purge",
  "dock.newSession": "dsh-purge",
  "dock.inSession": "dsh-purge",
  "dock.redteam": "\u7EA2\u961F\u6A21\u5F0F",
  "dock.full": "\u5168\u9762\u6D4F\u89C8",
  "dock.close": "\u6536\u8D77",
  "dock.unauthorized": "\u672A\u6388\u6743",
  "welcome.title": "\u7528\u6237\u987B\u77E5",
  "welcome.lead": "\u9996\u6B21\u5B89\u88C5\u672C\u63D2\u4EF6\u65F6\u8BF7\u9605\u8BFB\u4EE5\u4E0B\u8BF4\u660E\u3002\u786E\u8BA4\u540E\u672C\u7A97\u4E0D\u518D\u5F39\u51FA\u3002",
  "welcome.warn": "\u672C\u63D2\u4EF6\u514D\u8D39\u5F00\u6E90\u3002\u4EFB\u4F55\u80CC\u7740\u4F5C\u8005\u79C1\u81EA\u552E\u5356\u3001\u4ED8\u8D39\u5012\u5356\u6216\u501F\u672C\u9879\u76EE\u76C8\u5229\u7684\u884C\u4E3A\uFF0C\u4F5C\u8005\u5C06\u4F9D\u6CD5\u8FFD\u7A76\u6CD5\u5F8B\u8D23\u4EFB\u3002",
  "welcome.body": "dsh-purge \u662F DeepSeek Harness \u7684\u672C\u673A\u7F51\u7EDC\u5B89\u5168\u7EA2\u961F\u8BC4\u6D4B\u4E0E\u6E05\u6D17\u63D2\u4EF6\uFF1A\u5728\u53D7\u63A7\u672C\u673A\u73AF\u5883\u4E2D\u8C03\u6574\u63D0\u793A\u8BCD\u4E0E\u8865\u4E01\u3001\u505A\u6388\u6743\u8303\u56F4\u5185\u7684\u6F14\u7EC3\u53F0\u64CD\u4F5C\u3002\u9879\u76EE\u514D\u8D39\u3001\u975E\u8425\u5229\uFF0C\u6E90\u7801\u4ED3\u5E93\uFF1A",
  "welcome.repo": "https://github.com/YuJunZhiXue/dsh-purge",
  "welcome.ban1": "\u7981\u6B62\u5C06\u672C\u9879\u76EE\u7528\u4E8E\u672A\u6388\u6743\u7684\u7F51\u7EDC\u653B\u51FB\u3001\u5165\u4FB5\u3001\u7A83\u53D6\u6570\u636E\u3001\u7834\u574F\u7CFB\u7EDF\u6216\u4EFB\u4F55\u8FDD\u6CD5\u72AF\u7F6A\u3002",
  "welcome.ban2": "\u7981\u6B62\u5546\u4E1A\u552E\u5356\u3001\u4ED8\u8D39\u5012\u5356\u3001\u9ED1\u7070\u4EA7\u725F\u5229\uFF0C\u4EE5\u53CA\u9690\u7792\u4F5C\u8005\u7684\u8425\u5229\u6027\u518D\u5206\u53D1\u3002",
  "welcome.ban3": "\u4F7F\u7528\u8005\u987B\u81EA\u884C\u9075\u5B88\u6240\u5728\u5730\u6CD5\u5F8B\u6CD5\u89C4\u4E0E\u5E73\u53F0\u89C4\u8303\uFF1B\u8FDD\u6CD5\u540E\u679C\u7531\u884C\u4E3A\u4EBA\u81EA\u884C\u627F\u62C5\uFF0C\u4E0E\u4F5C\u8005\u65E0\u5173\u3002",
  "welcome.bans": "\u7981\u6B62\u4E8B\u9879",
  "welcome.check": "\u6211\u5DF2\u9605\u8BFB\u5E76\u7406\u89E3\u4E0A\u8FF0\u7528\u6237\u987B\u77E5\uFF0C\u540C\u610F\u5408\u6CD5\u5408\u89C4\u4F7F\u7528\u3002",
  "welcome.ok": "\u6211\u5DF2\u77E5\u6653\u5E76\u7EE7\u7EED",
  "auth.title": "\u6F14\u7EC3\u53F0\u6388\u6743\u786E\u8BA4",
  "auth.lead": "\u6E05\u6D17\u4E0D\u9700\u8981\u8FD9\u4E00\u6B65\u3002\u7B2C\u4E00\u6B21\u8FDB\u5165\u6F14\u7EC3\u53F0\uFF0C\u6216\u6253\u5F00\u5168\u9762\u6D4F\u89C8\uFF0C\u90FD\u8981\u5148\u5B8C\u6210\u672C\u7A97\u3002",
  "auth.warn": "\u5B89\u5168\u8B66\u544A\uFF1A\u6F14\u7EC3\u53F0\u53EA\u7528\u4E8E\u4F60\u6709\u6743\u7BA1\u7406\u7684\u672C\u673A\u3001\u79BB\u7EBF\u9776\u6807\uFF0C\u6216\u5DF2\u4E66\u9762\u6388\u6743\u7684\u6F14\u7EC3\u73AF\u5883\u3002\u672A\u7ECF\u6388\u6743\u7684\u6E17\u900F\u3001\u653B\u51FB\u3001\u7A83\u53D6\u548C\u7834\u574F\u4E00\u5F8B\u7981\u6B62\u3002",
  "auth.hint.wait": "\u8BF7\u9605\u8BFB\u58F0\u660E\u3002{n} \u79D2\u540E\u624D\u80FD\u52FE\u9009\u3002",
  "auth.hint.scroll": "\u5012\u8BA1\u65F6\u5DF2\u7ED3\u675F\u3002\u8BF7\u628A\u58F0\u660E\u6EDA\u5230\u6587\u672B\uFF0C\u518D\u52FE\u9009\u3002",
  "auth.hint.check": "\u5012\u8BA1\u65F6\u5DF2\u7ED3\u675F\u3002\u8BF7\u52FE\u9009\u5168\u90E8\u4E09\u9879\u3002",
  "auth.check.read": "\u6211\u5DF2\u8BFB\u5B8C\u300A\u5B89\u5168\u4E0E\u7981\u6B62\u8FDD\u6CD5\u58F0\u660E\u300B\uFF0C\u5E76\u8BA4\u53EF\u5176\u4E2D\u7684\u5168\u90E8\u6761\u6B3E\u3002",
  "auth.check.scope": "\u6211\u786E\u8BA4\u53EA\u7528\u5728\u672C\u673A\u5DF2\u6388\u6743\u73AF\u5883\u3001\u79BB\u7EBF\u9776\u6807\u6216\u5408\u89C4\u6F14\u7EC3\u4E2D\u3002",
  "auth.check.ban": "\u6211\u786E\u8BA4\u7981\u6B62\u4EFB\u4F55\u8FDD\u6CD5\u7528\u9014\u3002\u672A\u5B8C\u6210\u672C\u6388\u6743\uFF0C\u4E0D\u5F97\u4F7F\u7528\u6F14\u7EC3\u53F0\u3002",
  "auth.no": "\u6682\u4E0D\u8FDB\u5165",
  "auth.ok": "\u786E\u8BA4\u6388\u6743",
  "auth.ok.tab": "\u786E\u8BA4\u6388\u6743\u5E76\u8FDB\u5165\u6F14\u7EC3\u53F0",
  "auth.ok.full": "\u786E\u8BA4\u6388\u6743\u5E76\u5168\u9762\u6D4F\u89C8",
  "auth.ok.env": "\u786E\u8BA4\u6388\u6743\u5E76\u6253\u5F00\u73AF\u5883\u9002\u914D",
  "envGate.title": "\u73AF\u5883\u8FD8\u6CA1\u914D\u597D",
  "envGate.lead": "\u7EA2\u961F\u6A21\u5F0F\u53D1\u9001\u524D\u9700\u8981\u672C\u673A\u5DE5\u5177\u3002\u672A\u68C0\u6D4B\u5230\u53EF\u7528\u73AF\u5883\u65F6\uFF0C\u5148\u53BB\u73AF\u5883\u9002\u914D\uFF0C\u6216\u786E\u8BA4\u6682\u4E0D\u914D\u7F6E\u3002",
  "envGate.kaliHint": "\u68C0\u6D4B\u5230 Kali \u65F6\u4F1A\u76F4\u63A5\u7528\u672C\u673A\u5DE5\u5177\uFF0C\u4E0D\u5FC5\u586B\u8DEF\u5F84\u3002\u6CA1\u6709 Kali \u65F6\uFF0C\u5728\u73AF\u5883\u9002\u914D\u91CC\u586B\u5199\u5404\u5DE5\u5177\u8DEF\u5F84\uFF0C\u6216\u9009\u4E00\u4E2A\u6574\u5305\u6587\u4EF6\u5939\u81EA\u52A8\u5206\u914D\u3002",
  "envGate.skip": "\u6682\u4E0D\u914D\u7F6E",
  "envGate.skipConfirm": "\u786E\u8BA4\u540E\u8FD9\u6B21\u53EF\u4EE5\u7EE7\u7EED\u5BF9\u8BDD\u3002\u626B\u63CF\u548C\u5229\u7528\u7C7B\u6280\u80FD\u4ECD\u4F1A\u56E0\u4E3A\u7F3A\u5C11\u5DE5\u5177\u800C\u4E0D\u53EF\u7528\uFF0C\u4E4B\u540E\u53EF\u4EE5\u5728 dsh-purge \u2192 \u73AF\u5883\u9002\u914D\u91CC\u8865\u8DEF\u5F84\u3002",
  "envGate.skipNo": "\u8FD4\u56DE",
  "envGate.skipYes": "\u786E\u8BA4\u6682\u4E0D\u914D\u7F6E",
  "envGate.go": "\u53BB\u73AF\u5883\u9002\u914D",
  "compat.host": "dsh-purge Community {version} \xB7 \u5BBF\u4E3B DSH {host} \xB7 \u517C\u5BB9\u7EA7\u522B\uFF1A{level}",
  "compat.loading": "\u6B63\u5728\u8BFB\u53D6\u5BBF\u4E3B\u7248\u672C\u2026",
  "compat.unavailable": "\u8BFB\u4E0D\u5230\u5BBF\u4E3B\u517C\u5BB9\u4FE1\u606F\uFF1A{error}",
  "compat.level.qualified": "\u5DF2\u56DE\u5F52\u9A8C\u8BC1",
  "compat.level.unverified": "\u672A\u9A8C\u8BC1\u7248\u672C",
  "compat.level.mixed": "\u7EC4\u4EF6\u7248\u672C\u4E0D\u4E00\u81F4",
  "compat.level.no-host": "\u672A\u5B9A\u4F4D\u5BBF\u4E3B",
  "compat.level.unknown": "\u672A\u77E5",
  "theme.aria": "\u5916\u89C2",
  "theme.white": "\u767D",
  "theme.ink": "\u58A8",
  "purge.title": "\u8865\u4E01",
  "override.title": "\u63D0\u793A\u8BCD",
  "own.title": "\u81EA\u5DF1\u7684\u670D\u52A1\u5668",
  "own.hint": "\u6BCF\u884C\u4E00\u4E2A IP \u6216\u5B8C\u6574\u4E3B\u673A\u540D\u3002\u53EF\u4EE5\u5199\u6210 \u8D26\u53F7@\u4E3B\u673A\uFF0C\u8D26\u53F7\u53EA\u7528\u6765\u8BA4\u51FA\u8FD9\u79CD\u5199\u6CD5\u3002\u4E3B\u673A\u540D\u4F1A\u8FDE\u540C\u5B83\u5F53\u65F6\u89E3\u6790\u51FA\u7684\u5730\u5740\u4E00\u8D77\u653E\u884C\u3002\u4E0D\u8981\u5199\u5BC6\u94A5\u3001\u5BC6\u7801\u3001\u7F51\u6BB5\u3002",
  "own.save": "\u4FDD\u5B58\u540D\u5355",
  "saved.own": "\u5DF2\u4FDD\u5B58\u81EA\u5DF1\u7684\u670D\u52A1\u5668",
  "saved.own.dropped": "\u5DF2\u4FDD\u5B58\u3002\u6709 {n} \u884C\u4E0D\u662F\u5355\u4E2A IP \u6216\u4E3B\u673A\u540D\uFF0C\u5DF2\u4E22\u6389",
  "metric.purged": "\u5DF2\u5199\u5165",
  "metric.purged.skip": "\u5DF2\u5199\u5165\u3002\u8DF3\u8FC7 {n} \u9879\uFF0C\u672C\u673A\u6CA1\u6709\u8FD9\u4E9B\u6587\u4EF6",
  "metric.pendingShort": "\u5F85\u5904\u7406 {n}",
  "metric.unmatchedShort": "\u6CA1\u5BF9\u4E0A {n}",
  "metric.partialShort": "\u90E8\u5206\u547D\u4E2D {n}",
  "metric.driftedShort": "\u951A\u70B9\u6F02\u79FB {n}",
  "metric.disabledShort": "\u53EF\u9009\u5173\u95ED {n}",
  "metric.skipShort": "\u8DF3\u8FC7 {n}",
  "metric.unlocated.count": "\u2014",
  "metric.shim": "shim",
  "metric.shim.na": "\u672C\u7AEF\u4E0D\u9700\u8981",
  "metric.bak.yes": "\u6709\u5907\u4EFD",
  "metric.bak.no": "\u65E0\u5907\u4EFD",
  "metric.bak.hint": "\u5907\u4EFD",
  "table.patch": "\u9879\u76EE",
  "table.status": "\u72B6\u6001",
  "status.applied": "\u5DF2\u5E94\u7528",
  "status.off": "\u5DF2\u5173\u95ED",
  "status.pending": "\u5F85\u5E94\u7528",
  "status.unmatched": "\u6CA1\u5BF9\u4E0A",
  "status.partial": "\u90E8\u5206\u547D\u4E2D",
  "status.partialDetail": "\uFF08{done}/{total} \u76EE\u6807\uFF09",
  "status.drifted": "\u951A\u70B9\u6F02\u79FB",
  "status.disabled": "\u53EF\u9009\u5173\u95ED",
  "status.skipped": "\u8DF3\u8FC7",
  "apply.hint": "\u70B9\u5E94\u7528\u4F1A\u6253\u8865\u4E01\u5E76\u628A\u5F53\u524D\u9ED8\u8BA4\u63D0\u793A\u8BCD\u6302\u4E0A\uFF0C\u6846\u91CC\u4ECD\u662F\u63D2\u4EF6\u65E7\u9ED8\u8BA4\u65F6\u81EA\u52A8\u5237\u5230\u52A0\u5BC6\u69FD\uFF0C\u4E0D\u5FC5\u518D\u70B9\u4FDD\u5B58\u3002\u53EA\u6709\u4F60\u53E6\u5199\u7684\u7A3F\u624D\u4F1A\u6309\u6846\u843D\u76D8\u3002\u5F85\u5E94\u7528=\u539F\u6587\u8FD8\u5728\u3002\u8DF3\u8FC7=\u5F53\u524D\u7248\u672C\u4E0D\u9700\u8981\u6216\u7EC4\u4EF6\u672A\u5B89\u88C5\u3002",
  "warn.noRoot": "\u672A\u5B9A\u4F4D\u5230\u5F53\u524D\u5BBF\u4E3B\u7684 @deepseek-ai\uFF0C\u6E05\u6D17\u4E0D\u4F1A\u751F\u6548\u3002\u8BF7\u5B8C\u5168\u9000\u51FA\u540E\u518D\u6253\u5F00\u672C\u5BBF\u4E3B\uFF0C\u5728\u672C\u9875\u70B9\u300C\u5E94\u7528\u300D\u3002\u684C\u9762\u7AEF\u5B89\u88C5\u76EE\u5F55\u53EF\u4EE5\u662F\u4EFB\u610F\u76D8\u7B26\uFF1B\u76EE\u5F55\u540D\u5E26 DeepseekHarness / DeepSeek Harness \u5747\u53EF\u3002",
  "warn.noRoot.desktop": "\u5B98\u65B9\u5BA2\u6237\u7AEF\u7684\u4EE3\u7801\u5728 app.asar \u91CC\u3002\u70B9\u300C\u5E94\u7528\u300D\u4F1A\u89E3\u5F00\u5E76\u81EA\u52A8\u91CD\u542F\uFF0C\u4E0D\u7528\u53E6\u8DD1\u811A\u672C\u3002\u82E5\u4E00\u76F4\u663E\u793A\u8FD8\u6CA1\u5B9A\u4F4D\uFF0C\u5148\u5B8C\u5168\u9000\u51FA\u5BA2\u6237\u7AEF\u518D\u5F00\uFF0C\u518D\u70B9\u300C\u5E94\u7528\u300D\u3002\u7B2C\u4E09\u65B9 DSH Desktop \u76F4\u63A5\u70B9\u300C\u5E94\u7528\u300D\u3002",
  "unpack.restarting": "\u8865\u4E01\u5DF2\u5199\u5165\u3002\u70B9\u300C\u91CD\u542F\u300D\u540E\u5BA2\u6237\u7AEF\u4F1A\u81EA\u5DF1\u91CD\u65B0\u6253\u5F00\u3002",
  "restart.fullQuit": "\u6B63\u5728\u91CD\u542F\uFF0C\u5BA2\u6237\u7AEF\u4F1A\u81EA\u5DF1\u91CD\u65B0\u6253\u5F00\u3002",
  "warn.noInject": "\u5B98\u65B9\u59CB\u7EC8\u7528\u9ED8\u8BA4\u63D0\u793A\u8BCD\u3002\u7EA2\u961F\u5F00\u4E86\u89C4\u5219\u96C6\u5C31\u53EA\u7528\u89C4\u5219\u96C6\uFF1B\u6CA1\u5F00\u65F6\u7528\u53BB\u6389 CTF \u7684\u9ED8\u8BA4\u63D0\u793A\u8BCD\uFF0C\u518D\u63A5\u7EA2\u961F\u64CD\u4F5C\u3002\u4E24\u8FB9\u90FD\u7A7A\u4F1A\u63D0\u793A\u5FC5\u987B\u6DFB\u52A0\u3002",
  "need.prompt": "\u63D0\u793A\u8BCD\u548C\u89C4\u5219\u96C6\u90FD\u662F\u7A7A\u7684\uFF0C\u5FC5\u987B\u5148\u6DFB\u52A0\u63D0\u793A\u8BCD\uFF0C\u6216\u542F\u7528\u4E00\u6761\u6709\u5185\u5BB9\u7684\u89C4\u5219\u96C6\u3002",
  "btn.restoreInject": "\u6062\u590D\u9ED8\u8BA4",
  "saved.restoreInject": "\u5DF2\u6062\u590D\u9ED8\u8BA4\u63D0\u793A\u8BCD",
  skip: "\u8DF3\u8FC7",
  unknown: "\u672A\u77E5",
  delete: "\u5220\u9664",
  "btn.apply": "\u5E94\u7528",
  "btn.apply.busy": "\u5904\u7406\u4E2D\u2026",
  "btn.revert": "\u8FD8\u539F",
  "btn.uninstall": "\u5378\u8F7D",
  "btn.uninstall.busy": "\u5378\u8F7D\u4E2D\u2026",
  "uninstall.title": "\u5378\u8F7D dsh-purge",
  "uninstall.body": "\u662F\u5426\u5378\u8F7D\uFF1F\u5378\u8F7D\u5C06\u8FD8\u539F\u56DE\u539F\u7248\uFF0C\u5E76\u6E05\u9664\u672C\u63D2\u4EF6\u7684\u5168\u90E8\u6587\u4EF6\u4E0E\u8865\u4E01\u3002",
  "uninstall.confirm": "\u786E\u8BA4\u5378\u8F7D",
  "uninstall.cancel": "\u53D6\u6D88",
  "uninstall.applying": "\u6B63\u5728\u5378\u8F7D\u5E76\u8FD8\u539F\u2026",
  "uninstall.done": "\u5DF2\u5378\u8F7D\u5E76\u8FD8\u539F\uFF0C\u6B63\u5728\u91CD\u542F\u2026",
  "uninstall.done.desktop": "\u5DF2\u5378\u8F7D\u5E76\u8FD8\u539F\uFF0C\u6B63\u5728\u91CD\u542F\u684C\u9762\u5E94\u7528\u2026",
  "uninstall.fail": "\u5378\u8F7D\u5931\u8D25: {error}",
  "btn.checkUpdate": "\u68C0\u6D4B\u66F4\u65B0",
  "btn.checkUpdate.busy": "\u68C0\u6D4B\u4E2D\u2026",
  "btn.doUpdate": "\u66F4\u65B0",
  "btn.doUpdate.busy": "\u66F4\u65B0\u4E2D\u2026",
  "channel.title": "\u901A\u9053",
  "channel.stable": "\u6B63\u5F0F\u7248",
  "channel.beta": "\u6D4B\u8BD5\u7248",
  "channel.useStable": "\u5207\u6362\u5230\u6B63\u5F0F\u7248",
  "channel.useBeta": "\u5207\u6362\u5230\u6D4B\u8BD5\u7248",
  "channel.local": "\u672C\u673A",
  "update.checking": "\u6B63\u5728\u68C0\u6D4B\u66F4\u65B0\u2026",
  "update.applying": "\u6B63\u5728\u66F4\u65B0\u2026",
  "update.switching": "\u6B63\u5728\u5207\u6362\u7248\u672C\u2026",
  "update.latest": "\u5DF2\u662F\u6700\u65B0\uFF08{version}\uFF09",
  "update.available": "\u6709\u65B0\u7248\u672C {remote}\uFF0C\u5F53\u524D {local}",
  "update.pinned": "\u5DF2\u56FA\u5B9A\u5728 {version}\uFF0C\u901A\u9053\u6700\u65B0\u662F {remote}",
  "update.done": "\u5DF2\u66F4\u65B0\u5230 {version}",
  "update.restarting": "\u5DF2\u8FD8\u539F\u5E76\u5199\u5165\u65B0\u8865\u4E01\uFF0C\u6B63\u5728\u91CD\u542F\u2026",
  "update.fullQuit": "\u8865\u4E01\u5DF2\u5199\u5165\u3002\u70B9\u300C\u91CD\u542F\u300D\u540E\u5BA2\u6237\u7AEF\u4F1A\u81EA\u5DF1\u91CD\u65B0\u6253\u5F00\u3002",
  "restart.official.title": "\u9700\u8981\u91CD\u542F",
  "restart.official.body": "\u8865\u4E01\u5DF2\u5199\u5165\u3002\u70B9\u91CD\u542F\u540E\u5BA2\u6237\u7AEF\u4F1A\u81EA\u5DF1\u91CD\u65B0\u6253\u5F00\u3002",
  "update.switched": "\u5DF2\u5207\u6362\u5230 {version}",
  "update.autoDone": "\u5DF2\u81EA\u52A8\u66F4\u65B0\u5230 {version}",
  "update.reloading": "\u6B63\u5728\u5237\u65B0\u8BBE\u7F6E\u9875\u2026",
  "update.dirty": "\u6709\u65B0\u7248\u672C\uFF0C\u672C\u5730\u6709\u6539\u52A8\u672A\u81EA\u52A8\u8986\u76D6",
  "update.fail": "\u66F4\u65B0\u5931\u8D25: {error}",
  "update.timeout": "\u68C0\u6D4B\u8D85\u65F6\uFF0C\u8BF7\u518D\u70B9\u4E00\u6B21\u68C0\u6D4B\u66F4\u65B0",
  "update.needRestart": "\u68C0\u6D4B\u63A5\u53E3\u672A\u52A0\u8F7D\uFF0C\u8BF7\u5148\u91CD\u542F dsh \u518D\u70B9\u68C0\u6D4B\u66F4\u65B0",
  "update.noBeta": "\u8FD8\u6CA1\u6709\u6D4B\u8BD5\u7248",
  "update.switch": "\u5207\u6362\u5230\u6B64\u7248\u672C",
  "update.pick": "\u9009\u62E9\u7248\u672C",
  "update.tip": "\u6700\u65B0",
  "update.current": "\u5F53\u524D",
  "update.confirmSwitch": "\u5207\u6362\u5230 {version}\uFF1F\u4E4B\u540E\u53EF\u518D\u5207\u56DE\u53E6\u4E00\u901A\u9053\u6216\u5176\u5B83\u7248\u672C\u3002\u672C\u5730\u672A\u63D0\u4EA4\u7684\u63D2\u4EF6\u6539\u52A8\u4E0D\u4F1A\u4FDD\u7559\u3002",
  "update.confirmChannel": "\u5207\u6362\u5230{version}\uFF1F\u4F1A\u6309\u8BE5\u901A\u9053\u91CD\u65B0\u5B89\u88C5\u63D2\u4EF6\uFF0C\u672C\u5730\u672A\u63D0\u4EA4\u7684\u63D2\u4EF6\u6539\u52A8\u4E0D\u4F1A\u4FDD\u7559\u3002",
  "metric.version": "\u7248\u672C",
  "action.apply": "\u5E94\u7528",
  "action.revert": "\u8FD8\u539F",
  "action.uninstall": "\u5378\u8F7D",
  "ok.done": "\u5DF2\u5B8C\u6210",
  "err.action": "\u5931\u8D25: {error}",
  "err.status": "\u8BFB\u53D6\u5931\u8D25: {error}",
  "err.override": "\u8BFB\u53D6\u5931\u8D25: {error}",
  "err.rules": "\u8BFB\u53D6\u5931\u8D25: {error}",
  "err.read": "\u8BFB\u53D6\u5931\u8D25: {error}",
  "err.save": "\u4FDD\u5B58\u5931\u8D25: {error}",
  "btn.saveInject": "\u4FDD\u5B58",
  "saved.override": "\u5DF2\u4FDD\u5B58",
  "rules.title": "\u89C4\u5219\u96C6",
  "rules.none": "\u65E0",
  "rules.reset": "\u8FD8\u539F",
  "rules.reset.confirm": "\u8FD8\u539F\u5168\u5C40\u6307\u4EE4\u6587\u4EF6\uFF1F\u89C4\u5219\u5E93\u4F1A\u4FDD\u7559\u3002",
  "rules.empty": "\u6682\u65E0\u89C4\u5219",
  "rules.pick": "\u9009\u62E9\u89C4\u5219",
  "policy.title": "\u5DE5\u4F5C\u533A\u7B56\u7565",
  "policy.strict": "\u4E25\u683C",
  "policy.fallback": "\u7A7A\u4F4D\u515C\u5E95",
  "policy.always": "\u603B\u662F\u5141\u8BB8",
  "policy.hint": "\u4E25\u683C\uFF1A\u6C38\u8FDC\u5265 AGENTS.md / CLAUDE.md\uFF1B\u7A7A\u4F4D\u515C\u5E95\uFF1A\u63D0\u793A\u8BCD\u6846\u4E3A\u7A7A\u65F6\u624D\u7528\uFF1B\u603B\u662F\u5141\u8BB8\uFF1A\u4FDD\u7559 DSH \u539F\u751F\u884C\u4E3A",
  "cwd.title": "\u672C\u5730\u89C4\u5219\uFF08\u5F53\u524D\u76EE\u5F55\uFF09",
  "cwd.empty": "\u5F53\u524D\u76EE\u5F55\u6CA1\u6709 AGENTS.md / CLAUDE.md",
  "cwd.rescan": "\u91CD\u65B0\u626B\u63CF",
  "cwd.hint": "\u53EA\u6709\u63D0\u793A\u8BCD\u6846\u4E3A\u7A7A\u65F6\uFF0C\u88AB\u52FE\u9009\u7684\u672C\u5730\u6587\u4EF6\u624D\u4F5C\u4E3A\u515C\u5E95\u6CE8\u5165\uFF1B\u63D0\u793A\u8BCD\u6846\u4E00\u65E6\u975E\u7A7A\u5C31\u4E0D\u4F1A\u7528\u8FD9\u4E9B\u6587\u4EF6\u3002",
  "cwd.scope.cwd": "\u5F53\u524D\u76EE\u5F55",
  "cwd.scope.ancestor": "\u4E0A\u7EA7",
  "cwd.scope.root": "\u9879\u76EE\u6839",
  "cwd.no.workspace": "DSH \u5C1A\u672A\u9009\u8FC7\u5DE5\u4F5C\u76EE\u5F55\uFF0C\u8BF7\u5148\u5728 DSH \u91CC\u5F00\u59CB\u4E00\u6B21\u4EFB\u52A1\u518D\u56DE\u6765\u3002",
  "pill.current": "\u5F53\u524D",
  "btn.use": "\u542F\u7528",
  "btn.inUse": "\u5F53\u524D",
  "confirm.delete": "\u5220\u9664 {id}\uFF1F",
  "ph.id": "id",
  "ph.alias": "\u540D\u79F0",
  "ph.alias.short": "\u540D\u79F0",
  "btn.create": "\u65B0\u5EFA",
  "need.id": "\u9700\u8981 id",
  "ph.content": "",
  "btn.saveRule": "\u4FDD\u5B58",
  "skills.title": "Skill",
  "skills.hint": "\u5BFC\u5165\u5230\u5B98\u65B9\u76EE\u5F55\u540E\uFF0C\u7531 DSH \u8C03\u7528\uFF1A\u804A\u5929\u8F93\u5165 /\u540D\u79F0 \u7ACB\u5373\u52A0\u8F7D\uFF1B\u4EFB\u52A1\u5BF9\u4E0A description \u6216 whenToUse \u65F6\u6A21\u578B\u4F1A\u8C03 skill \u5DE5\u5177\u3002\u6B63\u6587\u5199\u300C\u6FC0\u6D3B\u300D\u4E0D\u4F1A\u89E6\u53D1\u3002",
  "skills.hint.desktop": "\u5F53\u524D\u684C\u9762\u5BBF\u4E3B\u7684\u5B98\u65B9 Skill \u76EE\u5F55\u3002\u804A\u5929\u8F93\u5165 /\u540D\u79F0 \u7ACB\u5373\u52A0\u8F7D\uFF1B\u4EFB\u52A1\u5BF9\u4E0A description \u65F6\u6A21\u578B\u4F1A\u8C03 skill \u5DE5\u5177\u3002",
  "skills.empty": "\u6682\u65E0\u7528\u6237 Skill",
  "btn.importZip": "\u5BFC\u5165\u538B\u7F29\u5305",
  "btn.importFolder": "\u5BFC\u5165\u6587\u4EF6\u5939",
  "skills.importing": "\u6B63\u5728\u5BFC\u5165\u2026",
  "saved.import": "\u5DF2\u5BFC\u5165 {count} \u4E2A Skill",
  "need.import": "\u8BF7\u9009\u62E9\u538B\u7F29\u5305\u6216\u6587\u4EF6\u5939",
  "err.import.folder": "\u6CA1\u8BFB\u5230\u6587\u4EF6\u5939\u91CC\u7684\u6587\u4EF6\uFF0C\u8BF7\u76F4\u63A5\u9009 Skill \u76EE\u5F55\uFF08\u91CC\u9762\u8981\u6709 SKILL.md\uFF09",
  "skills.pick": "\u9009\u62E9 Skill",
  "skills.invalid": "\u5B98\u65B9\u4F1A\u5FFD\u7565\uFF1A\u683C\u5F0F\u4E0D\u5BF9",
  "skills.call.slash": "\u804A\u5929\u8F93\u5165 {cmd}",
  "skills.call.model": "\u6A21\u578B\u53EF\u8C03",
  "skills.call.modelOff": "\u6A21\u578B\u4E0D\u53EF\u8C03",
  "skills.call.userOff": "\u4E0D\u53EF /\u540D\u79F0",
  "ph.skill.desc": "description\uFF08\u4F55\u65F6\u7528\uFF09",
  "btn.saveSkill": "\u4FDD\u5B58",
  "need.skill.id": "id \u5FC5\u987B\u662F kebab-case\uFF0C\u4F8B\u5982 code-review",
  "confirm.delete.skill": "\u4ECE\u5B98\u65B9 $DSH_HOME/skills \u5220\u9664 {id}\uFF1F\u5BBF\u4E3B\u4F1A\u81EA\u52A8\u4ECE\u76EE\u5F55\u62FF\u6389\u3002",
  "err.skills": "\u8BFB\u53D6\u5931\u8D25: {error}",
  "err.skills.needRestart": "Skill \u63A5\u53E3\u672A\u52A0\u8F7D\uFF0C\u8BF7\u5148\u91CD\u542F\u5F53\u524D\u5BBF\u4E3B",
  "btn.restart": "\u91CD\u542F",
  "btn.restart.busy": "\u91CD\u542F\u4E2D\u2026",
  restarting: "\u91CD\u542F\u4E2D\u2026",
  "restarting.desktop": "\u6B63\u5728\u91CD\u542F\u684C\u9762\u5E94\u7528\u2026",
  "restart.timeout": "\u8D85\u65F6\uFF0C\u8BF7\u5237\u65B0",
  "restart.fail": "\u5931\u8D25: {error}",
  "restart.notStarted": "\u91CD\u542F\u6CA1\u6709\u5F00\u59CB\uFF0C\u5BA2\u6237\u7AEF\u8FD8\u5728\u3002\u4E0D\u4F1A\u81EA\u52A8\u518D\u8BD5\u3002",
  "restart.already": "\u8FD9\u4E00\u6B21\u91CD\u542F\u5DF2\u7ECF\u5F00\u59CB\uFF0C\u4E0D\u4F1A\u518D\u91CD\u542F\u4E00\u6B21\u3002",
  "restart.confirm": "\u6E05\u6D17\u5DF2\u5B8C\u6210\uFF0C\u91CD\u542F\u540E\u751F\u6548\u3002",
  "restart.confirm.desktop": "\u6E05\u6D17\u5DF2\u5B8C\u6210\uFF0C\u91CD\u542F\u684C\u9762\u5E94\u7528\u540E\u751F\u6548\u3002",
  "restart.ask.title": "\u8981\u73B0\u5728\u91CD\u542F\u5417",
  "restart.ask.body": "\u5DF2\u7ECF\u5199\u5165\u3002\u91CD\u542F\u540E\u624D\u4F1A\u5728\u5F53\u524D\u5BA2\u6237\u7AEF\u91CC\u751F\u6548\u3002",
  "restart.now": "\u73B0\u5728\u91CD\u542F",
  "restart.notNow": "\u7A0D\u540E",
  "restart.asarSwap": "\u8865\u4E01\u5DF2\u5199\u5165\u78C1\u76D8\u3002\u6B63\u5728\u7ED3\u675F\u684C\u9762\u8FDB\u7A0B\u5E76\u632A\u5F00 app.asar\uFF0C\u5B8C\u6210\u540E\u4F1A\u81EA\u52A8\u91CD\u65B0\u6253\u5F00\uFF1B\u82E5\u4ECD\u65E0\u6548\uFF0C\u8BF7\u5148\u5B8C\u5168\u9000\u51FA Harness\uFF08\u6258\u76D8\u4E5F\u5173\uFF09\uFF0C\u518D\u70B9\u4E00\u6B21\u5E94\u7528\u3002",
  "surface.web": "Web",
  "surface.desktop": "\u684C\u9762\u7AEF",
  "surface.gui": "GUI",
  "surface.tui": "TUI",
  "restart.incomplete": "\u5E94\u7528\u672A\u5B8C\u6210\u3002{detail}",
  "restart.incomplete.patches": "\u6709 {failed} \u9879\u5904\u7406\u5931\u8D25\uFF08#{ids}\uFF09\uFF0C\u8BF7\u67E5\u770B\u8865\u4E01\u660E\u7EC6",
  "restart.incomplete.flash": "\u7EC8\u7AEF\u7A97\u53E3\u6291\u5236\u68C0\u67E5\u672A\u901A\u8FC7\uFF08{entry}\uFF09",
  "restart.incomplete.host": "\u672A\u786E\u8BA4\u76EE\u6807\u5BBF\u4E3B\u5199\u5165\u5B8C\u6210\uFF0C\u8BF7\u6838\u5BF9\u5BA2\u6237\u7AEF\u3001\u5BBF\u4E3B\u7248\u672C\u548C\u76EE\u6807\u8DEF\u5F84",
  "restart.incomplete.restore": "\u914D\u7F6E\u6062\u590D\u672A\u5B8C\u6210\uFF0C\u8BF7\u67E5\u770B\u8BCA\u65AD\u8BB0\u5F55",
  "restart.incomplete.runtime": "CLI \u8FD0\u884C\u65F6\u68C0\u67E5\u6216\u4FEE\u590D\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u8BCA\u65AD\u8BB0\u5F55",
  "restart.incomplete.unknown": "\u5F53\u524D\u540E\u7AEF\u672A\u8FD4\u56DE\u5177\u4F53\u539F\u56E0\uFF0C\u8BF7\u67E5\u770B\u5BBF\u4E3B\u7248\u672C\u3001\u8865\u4E01\u660E\u7EC6\u548C\u8BCA\u65AD\u7ED3\u679C",
  "restart.later": "\u4EE5\u540E",
  "group.prompt": "\u63D0\u793A\u8BCD",
  "group.code": "\u4EE3\u7801",
  "group.engine": "\u5F15\u64CE",
  "group.tools": "\u5DE5\u5177",
  "group.compat": "0.1.5 \u517C\u5BB9",
  "group.dsh20": "0.2.0",
  "patch.1": "\u5168\u5C40\u514D\u8D23 \u2192 \u5F3A\u6307\u4EE4",
  "patch.2": "\u66FF\u6362\u5F0F\u514D\u8D23 \u2192 \u5F3A\u6307\u4EE4",
  "patch.3": "\u4F5C\u7528\u57DF\u514D\u8D23 \u2192 \u5F3A\u6307\u4EE4",
  "patch.4": "persona \u4F1A\u8BDD\u5F3A\u6307\u4EE4",
  "patch.5": "\u5BA1\u6279\u63D0\u793A\u53E5 \u2192 \u5168\u6743\u9650",
  "patch.6": "\u6C99\u7BB1 deny \u2192 allow \u5199",
  "patch.7": "\u6C99\u7BB1\u9ED8\u8BA4\u5168\u6743\u9650",
  "patch.8": "\u5BA1\u6279\u9ED8\u8BA4 never",
  "patch.9": "\u5BA1\u6279\u95E8\u81EA\u52A8\u653E\u884C",
  "patch.10": "\u5BA1\u6279\u914D\u7F6E\u9ED8\u8BA4 never",
  "patch.11": "never \u63D0\u793A\u53E5 \u2192 \u81EA\u52A8\u653E\u884C",
  "patch.12": "ask \u63D0\u793A\u53E5 \u2192 \u81EA\u52A8\u653E\u884C",
  "patch.13": "\u8C41\u514D\u5347\u7EA7\u9636\u68AF",
  "patch.14": "\u5347\u7EA7\u65E0\u6761\u4EF6\u6388\u4FE1",
  "patch.15": "\u6C99\u7BB1 confine \u76F4\u901A",
  "patch.16": "\u6587\u4EF6\u7CFB\u7EDF\u56F4\u680F\u53D6\u6D88",
  "patch.17": "\u89C2\u5BDF\u7B56\u7565\u8BFB\u5199\u653E\u884C",
  "patch.18": "\u91CD\u590D\u8C03\u7528\u5B88\u536B\u7981\u7528",
  "patch.19": "\u5DE5\u5177\u7ED3\u679C\u4FEE\u526A\u7981\u7528",
  "patch.21": "\u6062\u590D\u63D2\u4EF6\u5EF6\u957F\u7684 bash \u7B49\u5F85",
  "patch.22": "read \u4E0A\u9650\u653E\u5BBD",
  "patch.23": "\u5B50\u4EE3\u7406\u6DF1\u5EA6 3 \u2192 10",
  "patch.24": "preset fetch \u542F\u7528",
  "patch.25": "\u53BB\u6389\u5B98\u65B9\u9ED8\u8BA4\u8EAB\u4EFD\uFF08\u529F\u80FD\u63D0\u793A\u8BCD\u4E0D\u52A8\uFF09",
  "patch.26": "minimal\uFF1A\u53BB\u6389\u9ED8\u8BA4\u8EAB\u4EFD\u5E76\u6253\u5F00 inject",
  "patch.28": "dsh-liangshen\uFF08\u6881\u795E\uFF09\uFF1Aphase-1 \u4FDD\u7559 dsh-purge / dshpg \u6BB5",
  "patch.70": "\u6781\u7B80\u6A21\u5F0F\u7EC8\u7AEF\u4E0D\u518D\u7981\u6B62\u7F51\u7EDC",
  "patch.71": "\u6881\u795E\u53BB\u6389\u5B98\u65B9\u8EAB\u4EFD\u53E5",
  "patch.29": "dsh-tool-web\uFF1A\u5916\u90E8 untrusted \u62E6\u622A\u2192\u53EF\u6267\u884C",
  "patch.30": "dsh-hooks-claude-code\uFF1Adeny\u2192allow",
  "patch.31": "dsh-hooks-codex\uFF1Adeny\u2192allow",
  "patch.32": "Web \u8868\u9762\u8EAB\u4EFD\u4E2D\u6027\u5316",
  "patch.33": "Shell \u62D2\u7EDD\u63D0\u793A \u2192 \u53EF\u6267\u884C",
  "patch.34": "\u6C99\u7BB1\u63D0\u793A\u4E2D\u6027\u5316",
  "patch.35": "\u5347\u7EA7 never \u4E0D\u62D2",
  "patch.36": "\u6587\u4EF6\u7CFB\u7EDF\u5347\u7EA7 schema \u653E\u884C",
  "patch.37": "\u5B50\u4EE3\u7406 scope lock \u4E2D\u6027\u5316",
  "patch.38": "persona text\u2192prefix\uFF080.1.2 \u9884\u8BBE\uFF09",
  "patch.39": "\u4F1A\u8BDD v0 plugin summary\uFF08mnemon\uFF09",
  "patch.40": "complete \u9884\u8BBE\u4ECD\u4FDD\u7559\u6CE8\u5165",
  "patch.42": "\u8BBE\u7F6E\u9875\u65E7\u63A5\u53E3",
  "patch.43": "\u7F51\u9875\u9884\u8BBE\u53BB\u6389\u9ED8\u8BA4\u8EAB\u4EFD",
  "patch.45": "\u5B98\u65B9\u684C\u9762\u66F4\u65B0\u4EA4\u63A5",
  "patch.46": "\u5B98\u65B9\u66F4\u65B0\u811A\u672C\u53EA\u7528\u82F1\u6587",
  "patch.47": "OAuth \u4E0D\u518D\u63D2\u5165 Claude \u8EAB\u4EFD",
  "patch.48": "shell \u53BB\u6389\u5220\u9664\u524D\u7684\u989D\u5916\u786E\u8BA4",
  "patch.49": "OAuth \u4E0D\u518D\u4F2A\u88C5 claude-cli",
  "patch.50": "\u8DE8\u4F1A\u8BDD\u5F15\u7528\u4E0D\u518D\u6807\u4E0D\u53EF\u4FE1",
  "patch.51": "\u65B0\u4F1A\u8BDD\u4FDD\u6301\u5B8C\u5168\u6743\u9650",
  "patch.52": "\u4F1A\u8BDD\u65E5\u5FD7\u9ED8\u8BA4\u4E0D\u4E0A\u4F20",
  "patch.53": "\u7F51\u9875\u63D0\u793A\u53BB\u6389\u7981\u6B62\u53E6\u5F00\u670D\u52A1\u5668",
  "patch.54": "\u4EA4\u4ED8\u7269\u63D0\u793A\u53BB\u6389\u591A\u4F59\u7981\u6B62",
  "patch.55": "\u6BCF\u4E00\u6B65\u66FF\u6362\u7B2C\u4E00\u6761\u7CFB\u7EDF\u63D0\u793A",
  "patch.56": "\u56DE\u9000\u53EA\u85CF\u88AB\u64A4\u6389\u7684\u90A3\u4E00\u8F6E",
  "patch.57": "developer role \u4EC5\u9650 openai/azure\uFF0C\u7B2C\u4E09\u65B9\u4EE3\u7406\u56DE\u9000 system",
  "patch.58": "\u56DE\u9000\u7A7A\u6807\u8BB0\u4E0D\u8FDB\u6A21\u578B\u8BF7\u6C42",
  "patch.59": "\u5B98\u65B9 Auto Review \u4E0D\u518D\u62E6\u5DE5\u5177",
  "patch.60": "\u5B98\u65B9 run_code \u53BB\u6389\u5BA1\u6279\u6559\u5B66",
  "patch.61": "\u5B98\u65B9\u6C99\u7BB1\u7B56\u7565\u4E0D\u518D\u6559\u62D2\u7EDD",
  "patch.62": "\u65E0\u5BA1\u6279\u901A\u9053\u65F6\u653E\u884C\uFF08\u7528\u6237\u62D2\u7EDD\u4ECD\u6709\u6548\uFF09",
  "patch.63": "\u8BA1\u5212\u6A21\u5F0F\u4E0D\u518D\u8F6F\u62E6\u6267\u884C",
  "patch.64": "Stop hook \u4E0D\u518D\u6CE8\u5165\u5047\u7528\u6237\u8BDD",
  "patch.65": "UserPromptSubmit deny \u4E0D\u518D\u6574\u8F6E reject",
  "patch.66": "\u7A7A\u7684\u7CFB\u7EDF\u6BB5\u4E0D\u518D\u628A\u8FD9\u4E00\u8F6E\u6253\u6210\u5185\u90E8\u9519\u8BEF",
  "patch.67": "\u7F3A messages \u65F6\u8FD9\u4E00\u8F6E\u4E0D\u4E2D\u65AD",
  "patch.68": "\u56DE\u9000\u540E\u7F3A content \u4E0D\u4E2D\u65AD",
  "patch.69": "deepseek-flash \u4FDD\u6301\u5B98\u65B9 in-history",
  "patch.72": "Messages \u7684 system \u7528\u5F53\u524D\u7CFB\u7EDF\u63D0\u793A",
  "patch.73": "\u6781\u7B80 bash \u53BB\u6389\u8BEF\u7559\u7684\u955C\u50CF\u8BF4\u660E",
  "patch.74": "\u9996\u53D1\u524D\u5148\u6302\u9ED8\u8BA4\u63D0\u793A\u8BCD",
  "patch.75": "\u56DE\u9000\u628A\u5DF2\u5B8C\u6210\u4EFB\u52A1\u6536\u56DE\u6210\u672A\u5F00\u59CB",
  "patch.76": "unrestricted \u9884\u8BBE\u53BB\u6389\u8EAB\u4EFD\u53E5",
  "patch.77": "\u56DE\u9000\u6807\u8BB0\u5230\u8FBE\u65F6\u4E22\u5F03\u5DF2\u53D1\u9001\u6D88\u606F",
  "patch.78": "\u8865\u4E01\u6587\u4EF6\u7F3A\u5931\u65F6\u4ECE .bak \u6062\u590D",
  "patch.80": "\u6062\u590D\u5B98\u65B9\u6781\u7B80\u5DE5\u5177\u8868",
  "patch.82": "\u4E3B\u8FDB\u7A0B\u515C\u5E95 DSH_PROFILE=desktop",
  "patch.83": "host \u4FE1\u53F7\u6740\u65F6\u4E0D\u62A5\u9519\u4E0D\u5F39\u5BF9\u8BDD\u6846",
  "patch.84": "host code=0 \u6B63\u5E38\u9000\u51FA\u4E0D\u62A5\u9519 (\u6D88\u9664 stopped \u5BF9\u8BDD\u6846)",
  "status.unlocated": "\u672A\u5B9A\u4F4D",
  "status.na": "\u672C\u7AEF\u4E0D\u9700\u8981",
  "metric.unlocated": "\u8FD8\u6CA1\u5B9A\u4F4D\u5230\u672C\u673A Harness",
  "metric.sealed": "\u5DF2\u627E\u5230\u5B98\u65B9\u5BA2\u6237\u7AEF\uFF0C\u70B9\u5E94\u7528\u89E3\u5F00",
  "metric.sealed.count": "\u5F85\u89E3\u5F00",
  "metric.lost": "\u8865\u4E01\u5DF2\u4E22\u5931\uFF0C\u8BF7\u91CD\u65B0\u5E94\u7528",
  "metric.lost.count": "\u5DF2\u4E22\u5931",
  "rewind.label": "\u56DE\u9000",
  "rewind.aria": "\u56DE\u9000",
  "rewind.busy": "\u56DE\u9000\u4E2D\u2026",
  "rewind.empty": "\u6CA1\u6709\u53EF\u56DE\u9000\u7684\u4E0A\u4E00\u53E5",
  "rewind.fail": "\u56DE\u9000\u5931\u8D25: {error}",
  "rewind.once": "\u56DE\u9000\u4E00\u6B21",
  "rewind.once.hint": "\u628A\u8FD9\u4E00\u8F6E\u53D1\u51FA\u53BB\u7684\u90A3\u53E5\u653E\u56DE\u8F93\u5165\u6846\uFF0C\u5E76\u6E05\u6389\u8FD9\u4E00\u8F6E",
  "rewind.round": "\u56DE\u9000\u4E0A\u4E00\u8F6E",
  "rewind.round.hint": "\u628A\u8FD9\u4E00\u8F6E\u53D1\u51FA\u53BB\u7684\u90A3\u53E5\u653E\u56DE\u8F93\u5165\u6846\uFF1B\u5B50\u4EE3\u7406\u4E5F\u53EA\u64A4\u8FD9\u4E00\u8F6E",
  "hooksDeny.title": "Hooks \u62E6\u622A",
  "hooksDeny.bypass": "\u653E\u884C hooks \u7684 deny / ask\uFF08\u8865\u4E01 30 / 31 / 64 / 65\uFF09",
  "hooksDeny.hint": "\u5173\u6389\u540E\uFF0C\u7528\u6237\u81EA\u5DF1\u7684 PreToolUse / UserPromptSubmit / Stop hook \u7684 deny \u4F1A\u6309\u5B98\u65B9\u903B\u8F91\u751F\u6548\u3002\u5B98\u65B9 ask \u5206\u652F\u672C\u8EAB\u662F\u7A7A\u64CD\u4F5C\uFF0C\u5173\u5F00\u5173\u4E0D\u4F1A\u5F39\u51FA\u5BA1\u6279\u6846\u3002\u6539\u5B8C\u540E\u70B9\u300C\u5E94\u7528\u300D\u5E76\u91CD\u542F\u624D\u5199\u8FDB\u5BBF\u4E3B\u3002",
  "saved.hooksDeny": "\u5DF2\u4FDD\u5B58",
  "continue.title": "\u5931\u8D25\u91CD\u8BD5 / \u7EE7\u7EED",
  "continue.hint": "\u8BF7\u6C42\u5931\u8D25\u4F1A\u81EA\u52A8\u91CD\u8BD5\uFF1B\u5F02\u5E38\u505C\u6B62\u6216\u4E2D\u65AD\u53EF\u70B9\u300C\u7EE7\u7EED\u300D\u6216\u81EA\u52A8\u7EED\u8DD1\u3002\u81EA\u5DF1\u70B9\u505C\u6B62\u4E0D\u4F1A\u81EA\u52A8\u7EE7\u7EED\u3002\u6B21\u6570\u7528\u5B8C\u540E\u9700\u65B0\u5F00\u4E00\u8F6E\u3002",
  "continue.autoRetry": "\u5931\u8D25\u81EA\u52A8\u91CD\u8BD5",
  "continue.retryMax": "\u91CD\u8BD5\u6B21\u6570",
  "continue.autoContinue": "\u4E2D\u65AD\u540E\u81EA\u52A8\u7EE7\u7EED",
  "continue.continueMax": "\u7EE7\u7EED\u6B21\u6570",
  "continue.text": "\u7EE7\u7EED\u7528\u8BED",
  "saved.continue": "\u5DF2\u4FDD\u5B58",
  "continue.label": "\u7EE7\u7EED",
  "continue.aria": "\u5F02\u5E38\u505C\u6B62\u540E\u7EE7\u7EED",
  "continue.busy": "\u7EE7\u7EED\u4E2D\u2026",
  "continue.ready": "\u7EE7\u7EED\uFF08\u8FD8\u53EF {left} \u6B21\uFF09",
  "continue.limit": "\u5DF2\u8FBE\u7EE7\u7EED\u4E0A\u9650",
  "continue.fail": "\u7EE7\u7EED\u5931\u8D25: {error}",
  "updch.open": "\u66F4\u65B0\u901A\u9053",
  "updch.title": "\u66F4\u65B0\u901A\u9053\uFF1A\u4EE3\u7406\u4E0E GitHub \u5BC6\u94A5",
  "updch.scope": "\u8FD9\u91CC\u7684\u4EE3\u7406\u4E0E\u5BC6\u94A5\u53EA\u4F5C\u7528\u4E8E\u672C\u63D2\u4EF6\u7684\u66F4\u65B0\u68C0\u67E5\u4E0E\u4E0B\u8F7D\u901A\u9053\uFF0C\u4E0D\u5F71\u54CD\u5176\u5B83\u6A21\u578B\u5382\u5546\u7684\u8BF7\u6C42\uFF0C\u4E5F\u4E0D\u5199\u5165\u5BBF\u4E3B\u8FDB\u7A0B\u73AF\u5883\u3002\u7559\u7A7A\u7EE7\u627F\u5DF2\u6709\u66F4\u65B0\u4EE3\u7406\u73AF\u5883\u3002",
  "updch.proxy": "\u4EE3\u7406\u5730\u5740",
  "updch.proxy.ph": "socks5://127.0.0.1:60808",
  "updch.proxy.hint": "\u652F\u6301 http:// / https:// / socks5:// \u524D\u7F00\uFF0C\u4F8B\u5982 http://127.0.0.1:7890\u3002\u7559\u7A7A\u7EE7\u627F\u5DF2\u6709\u66F4\u65B0\u4EE3\u7406\u73AF\u5883\u3002",
  "updch.token": "GitHub \u5BC6\u94A5",
  "updch.token.ph": "\u53EF\u9009\uFF1A\u63D0\u9AD8 GitHub API \u989D\u5EA6\uFF0C\u7559\u7A7A\u5219\u4E0D\u4FEE\u6539",
  "updch.token.set": "\u672C\u673A\u5DF2\u914D\u7F6E\u5BC6\u94A5\u3002\u8F93\u5165\u6846\u59CB\u7EC8\u4E3A\u7A7A\uFF0C\u7559\u7A7A\u4FDD\u5B58\u8868\u793A\u4FDD\u6301\u4E0D\u53D8\u3002",
  "updch.token.unset": "\u672C\u673A\u5C1A\u672A\u914D\u7F6E\u5BC6\u94A5\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u914D\u7F6E\u3002",
  "updch.token.clear": "\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684\u5BC6\u94A5",
  "updch.save": "\u4FDD\u5B58",
  "updch.saving": "\u4FDD\u5B58\u4E2D\u2026",
  "updch.cancel": "\u53D6\u6D88",
  "updch.saved": "\u66F4\u65B0\u901A\u9053\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u4E00\u6B21\u68C0\u67E5\u66F4\u65B0\u5373\u751F\u6548\u3002",
  "updch.state.proxy": "\u66F4\u65B0\u901A\u9053\u4EE3\u7406\uFF1A",
  "updch.state.direct": "\u66F4\u65B0\u901A\u9053\uFF1A\u7EE7\u627F\u73AF\u5883\u6216\u7CFB\u7EDF\u4EE3\u7406",
  "updch.state.token.on": "GitHub \u5BC6\u94A5\u5DF2\u914D\u7F6E",
  "updch.state.token.off": "\u672A\u914D\u7F6E GitHub \u5BC6\u94A5"
};
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
  "metric.unlocated.count": "\u2014",
  "metric.shim": "shim",
  "metric.shim.na": "Not needed here",
  "metric.bak.yes": "Backup",
  "metric.bak.no": "No backup",
  "metric.bak.hint": "Backup",
  "table.patch": "Item",
  "table.status": "Status",
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
  "skills.hint": "After import, DSH calls it: type /name in chat to load now; the model calls the skill tool when the task matches description or whenToUse. Writing\u300C\u6FC0\u6D3B\u300Din the body does nothing.",
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

// src/components/auth.js
var AUTH_LEGAL_HTML = "<h3>\u4E25\u6B63\u6CD5\u5F8B\u514D\u8D23\u4E0E\u5408\u89C4\u4F7F\u7528\u58F0\u660E</h3>\r\n    <p>\u672C\u58F0\u660E\u5728\u8FDB\u5165\u6F14\u7EC3\u53F0\u524D\u5FC5\u987B\u5168\u6587\u9605\u8BFB\u3002\u672C\u9879\u76EE\u662F\u975E\u8425\u5229\u5F00\u6E90\u9879\u76EE\uFF0C\u9075\u5B88\u56FD\u5BB6\u6CD5\u5F8B\u6CD5\u89C4\u53CA\u6240\u5728\u5E73\u53F0\u7684\u89C4\u8303\uFF0C\u4EC5\u4F9B\u5B66\u4E60\u4E0E\u7814\u7A76\u3001\u6280\u672F\u53C2\u8003\u3002\u4E25\u7981\u4EFB\u4F55\u4E3B\u4F53\u628A\u672C\u9879\u76EE\u7528\u4E8E\u5546\u4E1A\u552E\u5356\u3001\u4ED8\u8D39\u5012\u5356\u6216\u9ED1\u7070\u4EA7\u725F\u5229\u3002</p>\r\n    <p>\u5F00\u53D1\u8005\u575A\u51B3\u53CD\u5BF9\u5E76\u4E25\u7981\u4EFB\u4F55\u5F62\u5F0F\u7684\u8FDD\u6CD5\u72AF\u7F6A\uFF0C\u7EDD\u4E0D\u652F\u6301\u3001\u4E0D\u9F13\u52B1\u3001\u4E0D\u534F\u52A9\u672A\u6388\u6743\u7F51\u7EDC\u653B\u51FB\u3001\u6F0F\u6D1E\u5229\u7528\u3001\u6570\u636E\u7A83\u53D6\u3001\u975E\u6CD5\u4FB5\u5165\u8BA1\u7B97\u673A\u4FE1\u606F\u7CFB\u7EDF\uFF0C\u6216\u751F\u6210\u8FDD\u6CD5\u8FDD\u7981\u5185\u5BB9\u3002\u4EFB\u4F55\u5C06\u672C\u9879\u76EE\u7528\u4E8E\u8FDD\u6CD5\u72AF\u7F6A\u7684\u884C\u4E3A\uFF0C\u5747\u4E0E\u5F00\u53D1\u8005\u65E0\u5173\uFF0C\u7531\u884C\u4E3A\u4EBA\u4F9D\u6CD5\u72EC\u7ACB\u627F\u62C5\u5168\u90E8\u6CD5\u5F8B\u8D23\u4EFB\u3002\u4E0D\u5F97\u4EE5\u79D1\u7814\u3001\u6559\u5B66\u3001\u6D4B\u8BD5\u3001\u6F14\u793A\u6216\u5185\u90E8\u5B66\u4E60\u4E3A\u7531\u89C4\u907F\u4E0B\u5217\u6761\u6B3E\u3002</p>\r\n    <h3>1. \u672C\u4ED3\u5E93\u4E0D\u542B\u8FDD\u6CD5\u5185\u5BB9</h3>\r\n    <p>dsh-purge \u53D1\u5E03\u7684\u4EE3\u7801\u3001\u6587\u6863\u3001\u8865\u4E01\u4E0E\u9ED8\u8BA4\u63D0\u793A\u8BCD\u4E0D\u662F\u6728\u9A6C\u3001\u540E\u95E8\u3001\u672A\u6388\u6743\u6E17\u900F\u5DE5\u5177\u3001\u52D2\u7D22\u8F6F\u4EF6\u3001\u649E\u5E93\u811A\u672C\uFF0C\u4E5F\u4E0D\u662F\u9488\u5BF9\u516C\u7F51\u6216\u7B2C\u4E09\u65B9\u7CFB\u7EDF\u7684\u653B\u51FB\u8F7D\u8377\u3002\u9879\u76EE\u4E0D\u63D0\u4F9B\u8FDD\u6CD5\u5185\u5BB9\uFF0C\u4E5F\u4E0D\u6559\u5506\u3001\u7EC4\u7EC7\u3001\u534F\u52A9\u5B9E\u65BD\u8FDD\u6CD5\u72AF\u7F6A\u3002</p>\r\n    <h3>2. \u672C\u673A\u64CD\u4F5C\u4E0D\u6784\u6210\u5BF9\u5916\u6388\u6743</h3>\r\n    <p>\u5E94\u7528\u8865\u4E01\u3001\u5199\u5165\u3001\u56DE\u6EDA\u3001\u5378\u8F7D\uFF0C\u90FD\u5728\u672C\u673A\u6587\u4EF6\u548C\u672C\u673A\u8FDB\u7A0B\u5185\u5B8C\u6210\u3002\u8FD9\u4E9B\u64CD\u4F5C\u4E0D\u5BF9\u4EFB\u4F55\u516C\u7F51\u4E3B\u673A\u6216\u672A\u6388\u6743\u7CFB\u7EDF\u8FDB\u884C\u626B\u63CF\u3001\u63A2\u6D4B\u3001\u5165\u4FB5\u6216\u653B\u51FB\u53D1\u5305\uFF0C\u4E5F\u4E0D\u5F97\u628A\u672C\u673A\u5F53\u4F5C\u8DF3\u677F\u3002</p>\r\n    <p>\u63D2\u4EF6\u82E5\u5F00\u542F\u68C0\u6D4B\u66F4\u65B0\uFF0C\u4EC5\u53EF\u80FD\u8BBF\u95EE\u672C\u63D2\u4EF6\u81EA\u5DF1\u7684 GitHub \u4ED3\u5E93\u4EE5\u6838\u5BF9\u7248\u672C\u3002\u8BE5\u8BBF\u95EE\u4E0E\u5BF9\u7B2C\u4E09\u65B9\u7CFB\u7EDF\u7684\u7F51\u7EDC\u653B\u51FB\u65E0\u5173\uFF0C\u4E0D\u80FD\u88AB\u89E3\u91CA\u4E3A\u5BF9\u5916\u6E17\u900F\u7684\u6388\u6743\u3002</p>\r\n    <h3>3. \u5141\u8BB8\u4F7F\u7528\u7684\u8303\u56F4</h3>\r\n    <p>\u53EA\u5141\u8BB8\u7528\u5728\u4F60\u80FD\u8BC1\u660E\u6709\u6743\u5904\u7406\u7684\u73AF\u5883\uFF1A\u672C\u4EBA\u6709\u6743\u7BA1\u7406\u7684\u672C\u673A\u5B98\u65B9 Harness\uFF1B\u79BB\u7EBF\u7684\u672C\u5730\u5408\u6210\u9776\u6807\uFF1B\u6240\u6709\u8005\u5DF2\u7ECF\u51FA\u5177\u5408\u6CD5\u4E66\u9762\u6388\u6743\u7684\u7F51\u7EDC\u5B89\u5168\u6F14\u7EC3\u9776\u573A\uFF1B\u5408\u89C4\u5B9E\u9A8C\u5BA4\u91CC\u7684\u53D7\u63A7\u73AF\u5883\u3002\u4E66\u9762\u6388\u6743\u8981\u80FD\u5BF9\u5E94\u5177\u4F53\u76EE\u6807\u3001\u65F6\u95F4\u548C\u8303\u56F4\u3002\u53EA\u586B\u5199\u4E00\u4E2A\u5355\u4F4D\u540D\u79F0\uFF0C\u6216\u53EA\u6709\u53E3\u5934\u8BF4\u6CD5\uFF0C\u4E0D\u6784\u6210\u6388\u6743\u3002</p>\r\n    <p>\u672A\u7ECF\u6240\u6709\u8005\u5408\u6CD5\u4E66\u9762\u6388\u6743\u7684\u76EE\u6807\u3001\u516C\u7F51\u5728\u7EBF\u7CFB\u7EDF\u3001\u751F\u4EA7\u4E1A\u52A1\uFF0C\u4EE5\u53CA\u80FD\u6E90\u3001\u4EA4\u901A\u3001\u6C34\u5229\u3001\u91D1\u878D\u3001\u516C\u5171\u670D\u52A1\u3001\u7535\u5B50\u653F\u52A1\u7B49\u5173\u952E\u4FE1\u606F\u57FA\u7840\u8BBE\u65BD\uFF0C\u90FD\u4E0D\u5F97\u4F5C\u4E3A\u6F14\u7EC3\u5BF9\u8C61\u3002</p>\r\n    <h3>4. \u5FC5\u987B\u9075\u5B88\u7684\u6CD5\u5F8B\uFF0C\u6309\u6761\u3001\u6B3E</h3>\r\n    <p>\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u5211\u6CD5\u300B\u7B2C\u4E8C\u767E\u516B\u5341\u4E94\u6761\u7B2C\u4E00\u6B3E\uFF1A\u7981\u6B62\u8FDD\u53CD\u56FD\u5BB6\u89C4\u5B9A\uFF0C\u4FB5\u5165\u56FD\u5BB6\u4E8B\u52A1\u3001\u56FD\u9632\u5EFA\u8BBE\u3001\u5C16\u7AEF\u79D1\u5B66\u6280\u672F\u9886\u57DF\u7684\u8BA1\u7B97\u673A\u4FE1\u606F\u7CFB\u7EDF\u3002</p>\r\n    <p>\u540C\u6761\u7B2C\u4E8C\u6B3E\uFF1A\u7981\u6B62\u4FB5\u5165\u524D\u6B3E\u89C4\u5B9A\u4EE5\u5916\u7684\u8BA1\u7B97\u673A\u4FE1\u606F\u7CFB\u7EDF\uFF0C\u6216\u8005\u7528\u5176\u4ED6\u6280\u672F\u624B\u6BB5\uFF0C\u83B7\u53D6\u8BE5\u7CFB\u7EDF\u4E2D\u5B58\u50A8\u3001\u5904\u7406\u6216\u8005\u4F20\u8F93\u7684\u6570\u636E\uFF0C\u6216\u8005\u5BF9\u8BE5\u7CFB\u7EDF\u5B9E\u65BD\u975E\u6CD5\u63A7\u5236\u3002</p>\r\n    <p>\u540C\u6761\u7B2C\u4E09\u6B3E\uFF1A\u7981\u6B62\u63D0\u4F9B\u4E13\u95E8\u7528\u4E8E\u4FB5\u5165\u3001\u975E\u6CD5\u63A7\u5236\u8BA1\u7B97\u673A\u4FE1\u606F\u7CFB\u7EDF\u7684\u7A0B\u5E8F\u3001\u5DE5\u5177\uFF1B\u660E\u77E5\u4ED6\u4EBA\u5B9E\u65BD\u4FB5\u5165\u3001\u975E\u6CD5\u63A7\u5236\u800C\u4E3A\u5176\u63D0\u4F9B\u7A0B\u5E8F\u3001\u5DE5\u5177\uFF0C\u540C\u6837\u7981\u6B62\u3002</p>\r\n    <p>\u7B2C\u4E8C\u767E\u516B\u5341\u516D\u6761\u7B2C\u4E00\u6B3E\uFF1A\u7981\u6B62\u5BF9\u8BA1\u7B97\u673A\u4FE1\u606F\u7CFB\u7EDF\u529F\u80FD\u8FDB\u884C\u5220\u9664\u3001\u4FEE\u6539\u3001\u589E\u52A0\u3001\u5E72\u6270\uFF0C\u9020\u6210\u7CFB\u7EDF\u4E0D\u80FD\u6B63\u5E38\u8FD0\u884C\u3002</p>\r\n    <p>\u540C\u6761\u7B2C\u4E8C\u6B3E\uFF1A\u7981\u6B62\u5BF9\u7CFB\u7EDF\u4E2D\u5B58\u50A8\u3001\u5904\u7406\u6216\u8005\u4F20\u8F93\u7684\u6570\u636E\u548C\u5E94\u7528\u7A0B\u5E8F\u8FDB\u884C\u5220\u9664\u3001\u4FEE\u6539\u3001\u589E\u52A0\u3002</p>\r\n    <p>\u540C\u6761\u7B2C\u4E09\u6B3E\uFF1A\u7981\u6B62\u6545\u610F\u5236\u4F5C\u3001\u4F20\u64AD\u8BA1\u7B97\u673A\u75C5\u6BD2\u7B49\u7834\u574F\u6027\u7A0B\u5E8F\uFF0C\u5F71\u54CD\u8BA1\u7B97\u673A\u7CFB\u7EDF\u6B63\u5E38\u8FD0\u884C\u3002</p>\r\n    <p>\u7B2C\u4E8C\u767E\u516B\u5341\u4E03\u6761\uFF1A\u7981\u6B62\u5229\u7528\u8BA1\u7B97\u673A\u5B9E\u65BD\u91D1\u878D\u8BC8\u9A97\u3001\u76D7\u7A83\u3001\u8D2A\u6C61\u3001\u632A\u7528\u516C\u6B3E\u3001\u7A83\u53D6\u56FD\u5BB6\u79D8\u5BC6\u6216\u8005\u5176\u4ED6\u72AF\u7F6A\u3002</p>\r\n    <p>\u7B2C\u4E8C\u767E\u516B\u5341\u4E03\u6761\u4E4B\u4E00\u7B2C\u4E00\u6B3E\u7B2C\uFF08\u4E00\uFF09\u9879\uFF1A\u7981\u6B62\u8BBE\u7ACB\u7528\u4E8E\u5B9E\u65BD\u8BC8\u9A97\u3001\u4F20\u6388\u72AF\u7F6A\u65B9\u6CD5\u3001\u5236\u4F5C\u6216\u8005\u9500\u552E\u8FDD\u7981\u7269\u54C1\u3001\u7BA1\u5236\u7269\u54C1\u7B49\u8FDD\u6CD5\u72AF\u7F6A\u6D3B\u52A8\u7684\u7F51\u7AD9\u3001\u901A\u8BAF\u7FA4\u7EC4\u3002</p>\r\n    <p>\u540C\u6B3E\u7B2C\uFF08\u4E8C\uFF09\u9879\uFF1A\u7981\u6B62\u53D1\u5E03\u6709\u5173\u5236\u4F5C\u6216\u8005\u9500\u552E\u6BD2\u54C1\u3001\u67AA\u652F\u3001\u6DEB\u79FD\u7269\u54C1\u7B49\u8FDD\u7981\u7269\u54C1\u3001\u7BA1\u5236\u7269\u54C1\u6216\u8005\u5176\u4ED6\u8FDD\u6CD5\u72AF\u7F6A\u7684\u4FE1\u606F\u3002</p>\r\n    <p>\u540C\u6B3E\u7B2C\uFF08\u4E09\uFF09\u9879\uFF1A\u7981\u6B62\u4E3A\u5B9E\u65BD\u8BC8\u9A97\u7B49\u8FDD\u6CD5\u72AF\u7F6A\u6D3B\u52A8\u53D1\u5E03\u4FE1\u606F\u3002</p>\r\n    <p>\u7B2C\u4E8C\u767E\u516B\u5341\u4E03\u6761\u4E4B\u4E8C\uFF1A\u7981\u6B62\u660E\u77E5\u4ED6\u4EBA\u5229\u7528\u4FE1\u606F\u7F51\u7EDC\u5B9E\u65BD\u72AF\u7F6A\uFF0C\u4ECD\u4E3A\u5176\u63D0\u4F9B\u6280\u672F\u652F\u6301\uFF0C\u6216\u8005\u63D0\u4F9B\u5E7F\u544A\u63A8\u5E7F\u3001\u652F\u4ED8\u7ED3\u7B97\u7B49\u5E2E\u52A9\u3002</p>\r\n    <p>\u7B2C\u4E8C\u767E\u4E94\u5341\u4E09\u6761\u4E4B\u4E00\u7B2C\u4E00\u6B3E\u3001\u7B2C\u4E09\u6B3E\uFF1A\u7981\u6B62\u5411\u4ED6\u4EBA\u51FA\u552E\u6216\u8005\u63D0\u4F9B\u516C\u6C11\u4E2A\u4EBA\u4FE1\u606F\uFF1B\u7981\u6B62\u7A83\u53D6\u6216\u8005\u4EE5\u5176\u4ED6\u65B9\u6CD5\u975E\u6CD5\u83B7\u53D6\u516C\u6C11\u4E2A\u4EBA\u4FE1\u606F\u3002</p>\r\n    <p>\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u7F51\u7EDC\u5B89\u5168\u6CD5\u300B\u7B2C\u5341\u4E09\u6761\u7B2C\u4E8C\u6B3E\uFF1A\u4F7F\u7528\u7F51\u7EDC\u4E0D\u5F97\u5371\u5BB3\u7F51\u7EDC\u5B89\u5168\uFF0C\u4E0D\u5F97\u5229\u7528\u7F51\u7EDC\u4ECE\u4E8B\u5371\u5BB3\u56FD\u5BB6\u5B89\u5168\u3001\u8363\u8A89\u548C\u5229\u76CA\uFF0C\u717D\u52A8\u98A0\u8986\u56FD\u5BB6\u653F\u6743\u3001\u63A8\u7FFB\u793E\u4F1A\u4E3B\u4E49\u5236\u5EA6\uFF0C\u717D\u52A8\u5206\u88C2\u56FD\u5BB6\u3001\u7834\u574F\u56FD\u5BB6\u7EDF\u4E00\uFF0C\u5BA3\u626C\u6050\u6016\u4E3B\u4E49\u3001\u6781\u7AEF\u4E3B\u4E49\uFF0C\u5BA3\u626C\u6C11\u65CF\u4EC7\u6068\u3001\u6C11\u65CF\u6B67\u89C6\uFF0C\u4F20\u64AD\u66B4\u529B\u3001\u6DEB\u79FD\u8272\u60C5\u4FE1\u606F\uFF0C\u7F16\u9020\u3001\u4F20\u64AD\u865A\u5047\u4FE1\u606F\u6270\u4E71\u7ECF\u6D4E\u79E9\u5E8F\u548C\u793E\u4F1A\u79E9\u5E8F\uFF0C\u4EE5\u53CA\u4FB5\u5BB3\u4ED6\u4EBA\u540D\u8A89\u3001\u9690\u79C1\u3001\u77E5\u8BC6\u4EA7\u6743\u548C\u5176\u4ED6\u5408\u6CD5\u6743\u76CA\u7B49\u6D3B\u52A8\u3002</p>\r\n    <p>\u7B2C\u5341\u56DB\u6761\uFF1A\u7981\u6B62\u5229\u7528\u7F51\u7EDC\u4ECE\u4E8B\u5371\u5BB3\u672A\u6210\u5E74\u4EBA\u8EAB\u5FC3\u5065\u5EB7\u7684\u6D3B\u52A8\u3002</p>\r\n    <p>\u7B2C\u4E8C\u5341\u4E5D\u6761\uFF1A\u7981\u6B62\u975E\u6CD5\u4FB5\u5165\u4ED6\u4EBA\u7F51\u7EDC\u3001\u5E72\u6270\u4ED6\u4EBA\u7F51\u7EDC\u6B63\u5E38\u529F\u80FD\u3001\u7A83\u53D6\u7F51\u7EDC\u6570\u636E\uFF1B\u7981\u6B62\u63D0\u4F9B\u4E13\u95E8\u7528\u4E8E\u4FB5\u5165\u7F51\u7EDC\u3001\u5E72\u6270\u7F51\u7EDC\u6B63\u5E38\u529F\u80FD\u53CA\u9632\u62A4\u63AA\u65BD\u3001\u7A83\u53D6\u7F51\u7EDC\u6570\u636E\u7684\u7A0B\u5E8F\u3001\u5DE5\u5177\uFF1B\u660E\u77E5\u4ED6\u4EBA\u4ECE\u4E8B\u5371\u5BB3\u7F51\u7EDC\u5B89\u5168\u7684\u6D3B\u52A8\uFF0C\u7981\u6B62\u4E3A\u5176\u63D0\u4F9B\u6280\u672F\u652F\u6301\u3001\u5E7F\u544A\u63A8\u5E7F\u3001\u652F\u4ED8\u7ED3\u7B97\u7B49\u5E2E\u52A9\u3002</p>\r\n    <p>\u7B2C\u4E09\u5341\u4E09\u6761\uFF1A\u516C\u5171\u901A\u4FE1\u548C\u4FE1\u606F\u670D\u52A1\u3001\u80FD\u6E90\u3001\u4EA4\u901A\u3001\u6C34\u5229\u3001\u91D1\u878D\u3001\u516C\u5171\u670D\u52A1\u3001\u7535\u5B50\u653F\u52A1\u7B49\u5173\u952E\u4FE1\u606F\u57FA\u7840\u8BBE\u65BD\u5B9E\u884C\u91CD\u70B9\u4FDD\u62A4\u3002\u672A\u83B7\u5408\u6CD5\u6388\u6743\uFF0C\u4E0D\u5F97\u4FB5\u5165\u3001\u5E72\u6270\u6216\u7834\u574F\u3002</p>\r\n    <p>\u7B2C\u56DB\u5341\u516D\u6761\uFF1A\u7981\u6B62\u7A83\u53D6\u6216\u8005\u4EE5\u5176\u4ED6\u975E\u6CD5\u65B9\u5F0F\u83B7\u53D6\u4E2A\u4EBA\u4FE1\u606F\uFF0C\u7981\u6B62\u975E\u6CD5\u51FA\u552E\u6216\u8005\u975E\u6CD5\u5411\u4ED6\u4EBA\u63D0\u4F9B\u4E2A\u4EBA\u4FE1\u606F\u3002</p>\r\n    <p>\u7B2C\u56DB\u5341\u516B\u6761\uFF1A\u7981\u6B62\u8BBE\u7ACB\u7528\u4E8E\u5B9E\u65BD\u8BC8\u9A97\uFF0C\u4F20\u6388\u72AF\u7F6A\u65B9\u6CD5\uFF0C\u5236\u4F5C\u6216\u8005\u9500\u552E\u8FDD\u7981\u7269\u54C1\u3001\u7BA1\u5236\u7269\u54C1\u7B49\u8FDD\u6CD5\u72AF\u7F6A\u6D3B\u52A8\u7684\u7F51\u7AD9\u3001\u901A\u8BAF\u7FA4\u7EC4\uFF1B\u7981\u6B62\u5229\u7528\u7F51\u7EDC\u53D1\u5E03\u6D89\u53CA\u4E0A\u8FF0\u8FDD\u6CD5\u72AF\u7F6A\u6D3B\u52A8\u7684\u4FE1\u606F\u3002</p>\r\n    <p>\u7B2C\u4E94\u5341\u6761\uFF1A\u53D1\u9001\u7684\u7535\u5B50\u4FE1\u606F\u3001\u63D0\u4F9B\u7684\u5E94\u7528\u8F6F\u4EF6\u4E0D\u5F97\u8BBE\u7F6E\u6076\u610F\u7A0B\u5E8F\uFF0C\u4E0D\u5F97\u542B\u6709\u6CD5\u5F8B\u3001\u884C\u653F\u6CD5\u89C4\u7981\u6B62\u53D1\u5E03\u6216\u8005\u4F20\u8F93\u7684\u4FE1\u606F\u3002</p>\r\n    <p>\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u6570\u636E\u5B89\u5168\u6CD5\u300B\u7B2C\u516B\u6761\uFF1A\u5F00\u5C55\u6570\u636E\u5904\u7406\u6D3B\u52A8\uFF0C\u4E0D\u5F97\u5371\u5BB3\u56FD\u5BB6\u5B89\u5168\u3001\u516C\u5171\u5229\u76CA\uFF0C\u4E0D\u5F97\u635F\u5BB3\u4E2A\u4EBA\u3001\u7EC4\u7EC7\u7684\u5408\u6CD5\u6743\u76CA\u3002</p>\r\n    <p>\u7B2C\u4E09\u5341\u4E8C\u6761\u7B2C\u4E00\u6B3E\uFF1A\u6536\u96C6\u6570\u636E\u5E94\u5F53\u91C7\u53D6\u5408\u6CD5\u3001\u6B63\u5F53\u7684\u65B9\u5F0F\uFF0C\u4E0D\u5F97\u7A83\u53D6\u6216\u8005\u4EE5\u5176\u4ED6\u975E\u6CD5\u65B9\u5F0F\u83B7\u53D6\u6570\u636E\u3002</p>\r\n    <p>\u540C\u6761\u7B2C\u4E8C\u6B3E\uFF1A\u6CD5\u5F8B\u3001\u884C\u653F\u6CD5\u89C4\u5BF9\u6536\u96C6\u3001\u4F7F\u7528\u6570\u636E\u7684\u76EE\u7684\u548C\u8303\u56F4\u6709\u89C4\u5B9A\u7684\uFF0C\u53EA\u80FD\u5728\u8BE5\u76EE\u7684\u548C\u8303\u56F4\u5185\u6536\u96C6\u3001\u4F7F\u7528\u3002</p>\r\n    <p>\u7B2C\u4E94\u5341\u4E00\u6761\uFF1A\u7A83\u53D6\u6216\u8005\u4EE5\u5176\u4ED6\u975E\u6CD5\u65B9\u5F0F\u83B7\u53D6\u6570\u636E\uFF0C\u6216\u8005\u56E0\u6B64\u635F\u5BB3\u4E2A\u4EBA\u3001\u7EC4\u7EC7\u5408\u6CD5\u6743\u76CA\u7684\uFF0C\u4F9D\u7167\u6709\u5173\u6CD5\u5F8B\u3001\u884C\u653F\u6CD5\u89C4\u5904\u7F5A\u3002</p>\r\n    <p>\u300A\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD\u4E2A\u4EBA\u4FE1\u606F\u4FDD\u62A4\u6CD5\u300B\u7B2C\u4E94\u6761\uFF1A\u5904\u7406\u4E2A\u4EBA\u4FE1\u606F\u5E94\u5F53\u5408\u6CD5\u3001\u6B63\u5F53\u3001\u5FC5\u8981\u3001\u8BDA\u4FE1\uFF0C\u4E0D\u5F97\u901A\u8FC7\u8BEF\u5BFC\u3001\u6B3A\u8BC8\u3001\u80C1\u8FEB\u7B49\u65B9\u5F0F\u5904\u7406\u3002</p>\r\n    <p>\u7B2C\u516D\u6761\u7B2C\u4E00\u6B3E\u3001\u7B2C\u4E8C\u6B3E\uFF1A\u5904\u7406\u4E2A\u4EBA\u4FE1\u606F\u5E94\u5F53\u5177\u6709\u660E\u786E\u3001\u5408\u7406\u7684\u76EE\u7684\uFF0C\u5E76\u4E0E\u8BE5\u76EE\u7684\u76F4\u63A5\u76F8\u5173\uFF0C\u91C7\u53D6\u5BF9\u4E2A\u4EBA\u6743\u76CA\u5F71\u54CD\u6700\u5C0F\u7684\u65B9\u5F0F\uFF1B\u6536\u96C6\u9650\u4E8E\u5B9E\u73B0\u5904\u7406\u76EE\u7684\u7684\u6700\u5C0F\u8303\u56F4\uFF0C\u4E0D\u5F97\u8FC7\u5EA6\u6536\u96C6\u3002</p>\r\n    <p>\u7B2C\u5341\u6761\uFF1A\u7981\u6B62\u975E\u6CD5\u6536\u96C6\u3001\u4F7F\u7528\u3001\u52A0\u5DE5\u3001\u4F20\u8F93\u4ED6\u4EBA\u4E2A\u4EBA\u4FE1\u606F\uFF0C\u7981\u6B62\u975E\u6CD5\u4E70\u5356\u3001\u63D0\u4F9B\u6216\u8005\u516C\u5F00\u4ED6\u4EBA\u4E2A\u4EBA\u4FE1\u606F\uFF1B\u7981\u6B62\u4ECE\u4E8B\u5371\u5BB3\u56FD\u5BB6\u5B89\u5168\u3001\u516C\u5171\u5229\u76CA\u7684\u4E2A\u4EBA\u4FE1\u606F\u5904\u7406\u6D3B\u52A8\u3002</p>\r\n    <p>\u7B2C\u5341\u4E09\u6761\uFF1A\u6CA1\u6709\u53D6\u5F97\u4E2A\u4EBA\u540C\u610F\uFF0C\u4E5F\u4E0D\u5C5E\u4E8E\u8BA2\u7ACB\u5C65\u884C\u5408\u540C\u6240\u5FC5\u9700\u3001\u5C65\u884C\u6CD5\u5B9A\u804C\u8D23\u3001\u5E94\u5BF9\u7A81\u53D1\u3001\u516C\u5171\u5229\u76CA\u65B0\u95FB\u8206\u8BBA\u3001\u5904\u7406\u672C\u4EBA\u5DF2\u7ECF\u5408\u6CD5\u516C\u5F00\u7684\u4FE1\u606F\uFF0C\u4EE5\u53CA\u6CD5\u5F8B\u884C\u653F\u6CD5\u89C4\u89C4\u5B9A\u7684\u5176\u4ED6\u60C5\u5F62\u4E4B\u4E00\u7684\uFF0C\u4E0D\u5F97\u5904\u7406\u4E2A\u4EBA\u4FE1\u606F\u3002</p>\r\n    <p>\u7B2C\u4E8C\u5341\u516B\u6761\u3001\u7B2C\u4E8C\u5341\u4E5D\u6761\uFF1A\u751F\u7269\u8BC6\u522B\u3001\u533B\u7597\u5065\u5EB7\u3001\u91D1\u878D\u8D26\u6237\u3001\u884C\u8E2A\u8F68\u8FF9\uFF0C\u4EE5\u53CA\u4E0D\u6EE1\u5341\u56DB\u5468\u5C81\u672A\u6210\u5E74\u4EBA\u7684\u4E2A\u4EBA\u4FE1\u606F\uFF0C\u5C5E\u4E8E\u654F\u611F\u4E2A\u4EBA\u4FE1\u606F\u3002\u6CA1\u6709\u7279\u5B9A\u76EE\u7684\u3001\u5145\u5206\u5FC5\u8981\u6027\u548C\u4E25\u683C\u4FDD\u62A4\u63AA\u65BD\uFF0C\u5E76\u4E14\u6CA1\u6709\u53D6\u5F97\u4E2A\u4EBA\u5355\u72EC\u540C\u610F\u7684\uFF0C\u4E0D\u5F97\u5904\u7406\u3002</p>\r\n    <p>\u6B64\u5916\u8FD8\u987B\u9075\u5B88\u5176\u4ED6\u73B0\u884C\u6709\u6548\u7684\u6CD5\u5F8B\u3001\u884C\u653F\u6CD5\u89C4\u3001\u76D1\u7BA1\u89C4\u5B9A\uFF0C\u4EE5\u53CA\u6240\u4F7F\u7528\u6A21\u578B\u7684\u670D\u52A1\u6761\u6B3E\u4E0E\u6EE5\u7528\u653F\u7B56\u3002</p>\r\n    <h3>5. \u636E\u6B64\u7981\u6B62\u7684\u65B9\u5411</h3>\r\n    <p>\u672A\u6388\u6743\u8FDB\u5165\u3002\u7981\u6B62\u628A\u6CA1\u6709\u4E66\u9762\u6388\u6743\u7684\u5355\u4F4D\u3001\u57DF\u540D\u3001\u5730\u5740\u3001\u516C\u7F51\u7CFB\u7EDF\u3001\u751F\u4EA7\u4E1A\u52A1\u6216\u5173\u952E\u4FE1\u606F\u57FA\u7840\u8BBE\u65BD\u767B\u8BB0\u4E3A\u9776\u6807\uFF0C\u7981\u6B62\u5BF9\u5176\u626B\u63CF\u3001\u63A2\u6D4B\u3001\u4FB5\u5165\u3001\u63A7\u5236\u6216\u53D1\u5305\u3002\u5BF9\u5E94\u5211\u6CD5\u7B2C\u4E8C\u767E\u516B\u5341\u4E94\u6761\u7B2C\u4E00\u6B3E\u3001\u7B2C\u4E8C\u6B3E\uFF0C\u7F51\u7EDC\u5B89\u5168\u6CD5\u7B2C\u4E8C\u5341\u4E5D\u6761\u3001\u7B2C\u4E09\u5341\u4E09\u6761\u3002</p>\r\n    <p>\u7834\u574F\u4E0E\u6076\u610F\u7A0B\u5E8F\u3002\u7981\u6B62\u5220\u9664\u3001\u4FEE\u6539\u3001\u589E\u52A0\u3001\u5E72\u6270\u4ED6\u4EBA\u7CFB\u7EDF\u529F\u80FD\u6216\u5176\u4E2D\u7684\u6570\u636E\u3001\u5E94\u7528\u7A0B\u5E8F\uFF1B\u7981\u6B62\u5236\u4F5C\u3001\u4F20\u64AD\u75C5\u6BD2\u3001\u52D2\u7D22\u7A0B\u5E8F\u6216\u5176\u4ED6\u7834\u574F\u6027\u7A0B\u5E8F\uFF1B\u7981\u6B62\u5728\u4FE1\u606F\u6216\u8F6F\u4EF6\u4E2D\u8BBE\u7F6E\u6076\u610F\u7A0B\u5E8F\u3002\u5BF9\u5E94\u5211\u6CD5\u7B2C\u4E8C\u767E\u516B\u5341\u516D\u6761\u7B2C\u4E00\u6B3E\u81F3\u7B2C\u4E09\u6B3E\uFF0C\u7F51\u7EDC\u5B89\u5168\u6CD5\u7B2C\u4E94\u5341\u6761\u3002</p>\r\n    <p>\u5DE5\u5177\u4E0E\u5E2E\u52A9\u3002\u7981\u6B62\u628A\u672C\u9879\u76EE\u6216\u672C\u673A\u63D0\u4F9B\u7ED9\u4ED6\u4EBA\uFF0C\u7528\u4E8E\u4FB5\u5165\u3001\u975E\u6CD5\u63A7\u5236\u6216\u7A83\u53D6\u6570\u636E\uFF1B\u7981\u6B62\u660E\u77E5\u5BF9\u65B9\u5728\u5B9E\u65BD\u7F51\u7EDC\u72AF\u7F6A\uFF0C\u4ECD\u63D0\u4F9B\u7A0B\u5E8F\u3001\u5DE5\u5177\u3001\u6280\u672F\u652F\u6301\u3001\u5E7F\u544A\u63A8\u5E7F\u6216\u652F\u4ED8\u7ED3\u7B97\u3002\u5BF9\u5E94\u5211\u6CD5\u7B2C\u4E8C\u767E\u516B\u5341\u4E94\u6761\u7B2C\u4E09\u6B3E\u3001\u7B2C\u4E8C\u767E\u516B\u5341\u4E03\u6761\u4E4B\u4E8C\uFF0C\u7F51\u7EDC\u5B89\u5168\u6CD5\u7B2C\u4E8C\u5341\u4E5D\u6761\u3002</p>\r\n    <p>\u6570\u636E\u3002\u7981\u6B62\u7A83\u53D6\u3001\u975E\u6CD5\u6536\u96C6\u3001\u8D85\u8303\u56F4\u4F7F\u7528\u3001\u6CC4\u9732\u3001\u51FA\u552E\u6216\u5411\u4ED6\u4EBA\u63D0\u4F9B\u4E1A\u52A1\u6570\u636E\u3001\u8D26\u53F7\u3001\u53E3\u4EE4\u548C\u5176\u4ED6\u53D7\u4FDD\u62A4\u6570\u636E\u3002\u5BF9\u5E94\u6570\u636E\u5B89\u5168\u6CD5\u7B2C\u516B\u6761\u3001\u7B2C\u4E09\u5341\u4E8C\u6761\u3001\u7B2C\u4E94\u5341\u4E00\u6761\u3002</p>\r\n    <p>\u4E2A\u4EBA\u4FE1\u606F\u3002\u7981\u6B62\u975E\u6CD5\u6536\u96C6\u3001\u4F7F\u7528\u3001\u52A0\u5DE5\u3001\u4F20\u8F93\u3001\u4E70\u5356\u3001\u63D0\u4F9B\u6216\u516C\u5F00\u4ED6\u4EBA\u4E2A\u4EBA\u4FE1\u606F\uFF1B\u7981\u6B62\u8FC7\u5EA6\u6536\u96C6\uFF1B\u7981\u6B62\u4EE5\u8BEF\u5BFC\u3001\u6B3A\u8BC8\u3001\u80C1\u8FEB\u65B9\u5F0F\u5904\u7406\uFF1B\u7981\u6B62\u64C5\u81EA\u5904\u7406\u751F\u7269\u8BC6\u522B\u3001\u533B\u7597\u5065\u5EB7\u3001\u91D1\u878D\u8D26\u6237\u3001\u884C\u8E2A\u8F68\u8FF9\u548C\u513F\u7AE5\u4E2A\u4EBA\u4FE1\u606F\u3002\u5BF9\u5E94\u5211\u6CD5\u7B2C\u4E8C\u767E\u4E94\u5341\u4E09\u6761\u4E4B\u4E00\u7B2C\u4E00\u6B3E\u3001\u7B2C\u4E09\u6B3E\uFF0C\u7F51\u7EDC\u5B89\u5168\u6CD5\u7B2C\u56DB\u5341\u516D\u6761\uFF0C\u4E2A\u4EBA\u4FE1\u606F\u4FDD\u62A4\u6CD5\u7B2C\u4E94\u6761\u3001\u7B2C\u516D\u6761\u3001\u7B2C\u5341\u6761\u3001\u7B2C\u5341\u4E09\u6761\u3001\u7B2C\u4E8C\u5341\u516B\u6761\u3001\u7B2C\u4E8C\u5341\u4E5D\u6761\u3002</p>\r\n    <p>\u8BC8\u9A97\u4E0E\u8FDD\u6CD5\u4FE1\u606F\u3002\u7981\u6B62\u8BBE\u7ACB\u6216\u5229\u7528\u7F51\u7AD9\u3001\u7FA4\u7EC4\u5B9E\u65BD\u8BC8\u9A97\u3001\u4F20\u6388\u72AF\u7F6A\u65B9\u6CD5\u3001\u5236\u4F5C\u6216\u9500\u552E\u8FDD\u7981\u7269\u54C1\u3001\u7BA1\u5236\u7269\u54C1\uFF1B\u7981\u6B62\u53D1\u5E03\u6B64\u7C7B\u4FE1\u606F\uFF1B\u7981\u6B62\u5229\u7528\u8BA1\u7B97\u673A\u5B9E\u65BD\u8BC8\u9A97\u3001\u76D7\u7A83\u3001\u8D2A\u6C61\u3001\u632A\u7528\u516C\u6B3E\u3001\u7A83\u53D6\u56FD\u5BB6\u79D8\u5BC6\u3002\u5BF9\u5E94\u5211\u6CD5\u7B2C\u4E8C\u767E\u516B\u5341\u4E03\u6761\u3001\u7B2C\u4E8C\u767E\u516B\u5341\u4E03\u6761\u4E4B\u4E00\u7B2C\u4E00\u6B3E\u7B2C\uFF08\u4E00\uFF09\u9879\u81F3\u7B2C\uFF08\u4E09\uFF09\u9879\uFF0C\u7F51\u7EDC\u5B89\u5168\u6CD5\u7B2C\u56DB\u5341\u516B\u6761\u3002</p>\r\n    <p>\u5185\u5BB9\u3002\u7981\u6B62\u751F\u6210\u6216\u4F20\u64AD\u5371\u5BB3\u56FD\u5BB6\u5B89\u5168\u3001\u8363\u8A89\u548C\u5229\u76CA\u7684\u5185\u5BB9\uFF0C\u7981\u6B62\u717D\u52A8\u98A0\u8986\u3001\u5206\u88C2\uFF0C\u7981\u6B62\u6050\u6016\u4E3B\u4E49\u3001\u6781\u7AEF\u4E3B\u4E49\u3001\u6C11\u65CF\u4EC7\u6068\uFF0C\u7981\u6B62\u66B4\u529B\u3001\u6DEB\u79FD\u8272\u60C5\u3001\u8D4C\u535A\uFF0C\u7981\u6B62\u7F16\u9020\u865A\u5047\u4FE1\u606F\u6270\u4E71\u7ECF\u6D4E\u79E9\u5E8F\u548C\u793E\u4F1A\u79E9\u5E8F\uFF0C\u7981\u6B62\u4FB5\u5BB3\u540D\u8A89\u3001\u9690\u79C1\u3001\u77E5\u8BC6\u4EA7\u6743\uFF0C\u7981\u6B62\u5371\u5BB3\u672A\u6210\u5E74\u4EBA\u8EAB\u5FC3\u5065\u5EB7\u7684\u5185\u5BB9\u3002\u5BF9\u5E94\u7F51\u7EDC\u5B89\u5168\u6CD5\u7B2C\u5341\u4E09\u6761\u7B2C\u4E8C\u6B3E\u3001\u7B2C\u5341\u56DB\u6761\u3002</p>\r\n    <p>\u7ED3\u679C\u6269\u6563\u3002\u6F14\u7EC3\u4E2D\u5F62\u6210\u7684\u8BB0\u5F55\u3001\u8D44\u4EA7\u4FE1\u606F\u548C\u6587\u4EF6\uFF0C\u53EA\u7559\u5728\u4E66\u9762\u6388\u6743\u5199\u660E\u7684\u76EE\u6807\u548C\u671F\u9650\u91CC\uFF0C\u4E0D\u5F97\u4EA4\u7ED9\u65E0\u6743\u83B7\u77E5\u7684\u4EBA\uFF0C\u4E5F\u4E0D\u5F97\u6539\u4F5C\u6388\u6743\u4EE5\u5916\u7684\u7528\u9014\u3002</p>\r\n    <h3>6. \u8D23\u4EFB\u7531\u4F7F\u7528\u8005\u627F\u62C5</h3>\r\n    <p>\u672C\u9879\u76EE\u4F9D\u636E MIT \u534F\u8BAE\u6309\u73B0\u72B6\u63D0\u4F9B\u3002\u5F00\u53D1\u8005\u4E0D\u5C31\u5B8C\u6574\u6027\u3001\u5B89\u5168\u6027\u4E0E\u9002\u7528\u6027\u4F5C\u4FDD\u8BC1\u3002\u4F7F\u7528\u8005\u5BF9\u81EA\u5DF1\u7684\u4E0B\u8F7D\u3001\u90E8\u7F72\u3001\u8FD0\u884C\u3001\u4FEE\u6539\u3001\u4F20\u64AD\uFF0C\u4EE5\u53CA\u5168\u90E8\u8F93\u5165\u4E0E\u8F93\u51FA\uFF0C\u627F\u62C5\u72EC\u7ACB\u3001\u5B8C\u5168\u7684\u6C11\u4E8B\u3001\u884C\u653F\u53CA\u5211\u4E8B\u6CD5\u5F8B\u8D23\u4EFB\u3002\u4F5C\u8005\u4E0E\u8D21\u732E\u8005\u4E0D\u627F\u62C5\u56E0\u6EE5\u7528\u4EA7\u751F\u7684\u76F4\u63A5\u3001\u95F4\u63A5\u6216\u8FDE\u5E26\u8D23\u4EFB\u3002</p>\r\n    <p>\u52FE\u9009\u786E\u8BA4\u7684\u662F\u64CD\u4F5C\u8005\u672C\u4EBA\uFF0C\u4E0D\u80FD\u4EE3\u66FF\u6CA1\u6709\u9605\u8BFB\u672C\u58F0\u660E\u7684\u4EBA\uFF0C\u4E5F\u4E0D\u80FD\u628A\u522B\u4EBA\u7684\u7CFB\u7EDF\u8BF4\u6210\u5DF2\u7ECF\u6388\u6743\u3002</p>\r\n    <h3>7. \u8FDD\u7EA6\u5373\u7EC8\u6B62\u6388\u6743</h3>\r\n    <p>\u4E00\u65E6\u7528\u4E8E\u975E\u6CD5\u653B\u51FB\u3001\u6076\u610F\u6D3B\u52A8\u6216\u4E0A\u8FF0\u4EFB\u4E00\u7981\u6B62\u65B9\u5411\uFF0C\u4F7F\u7528\u8BB8\u53EF\u81EA\u8BE5\u884C\u4E3A\u53D1\u751F\u4E4B\u65E5\u8D77\u81EA\u52A8\u7EC8\u6B62\uFF0C\u4E14\u4E0D\u53EF\u64A4\u9500\u3002\u5FC5\u987B\u7ACB\u5373\u505C\u6B62\u4F7F\u7528\uFF0C\u5E76\u9500\u6BC1\u672C\u9879\u76EE\u7684\u4EE3\u7801\u3001\u811A\u672C\u4E0E\u884D\u751F\u6570\u636E\uFF0C\u4F9D\u6CD5\u627F\u62C5\u8D23\u4EFB\u3002\u6388\u6743\u7EC8\u6B62\u540E\uFF0C\u6F14\u7EC3\u53F0\u4E0D\u5F97\u7EE7\u7EED\u6253\u5F00\u6216\u7EE7\u7EED\u4F7F\u7528\u3002</p>\r\n    <h3>8. \u4E0E DeepSeek \u5B98\u65B9\u7684\u5173\u7CFB</h3>\r\n    <p>\u672C\u9879\u76EE\u662F\u72EC\u7ACB\u7684\u5F00\u6E90\u9879\u76EE\uFF0C\u4E0E DeepSeek \u5B98\u65B9\u6216\u5176\u5173\u8054\u4E3B\u4F53\u6CA1\u6709\u96B6\u5C5E\u3001\u5546\u4E1A\u5408\u4F5C\u3001\u6388\u6743\u6216\u5B98\u65B9\u80CC\u4E66\u3002\u6587\u4E2D\u7684\u300C\u5B98\u65B9\u300D\u53EA\u8868\u793A\u8BC4\u6D4B\u5BF9\u8C61\u662F\u4F7F\u7528\u8005\u672C\u673A\u5B89\u88C5\u7684\u5B98\u65B9 DeepSeek Harness \u8F6F\u4EF6\u5305\uFF0C\u4E0D\u4EE3\u8868 DeepSeek \u5B98\u65B9\u5F00\u53D1\u3001\u8BA4\u53EF\u6216\u62C5\u4FDD\u672C\u63D2\u4EF6\u3002</p>\r\n    <p>\u6587\u672B\u3002\u5012\u8BA1\u65F6\u7ED3\u675F\u3001\u6EDA\u5230\u8FD9\u91CC\u5E76\u52FE\u9009\u5168\u90E8\u4E09\u9879\uFF0C\u624D\u8868\u793A\u4F60\u4EE5\u672C\u4EBA\u8EAB\u4EFD\u8BA4\u53EF\u672C\u58F0\u660E\uFF0C\u5E76\u5B8C\u6210\u672C\u6B21\u6F14\u7EC3\u53F0\u6388\u6743\u3002</p>";
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
        dangerouslySetInnerHTML: { __html: AUTH_LEGAL_HTML }
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
  if (st === "skipped") return t("status.skipped");
  if (st === "missing_file") return t("skip");
  if (st === "unlocated") return t("status.unlocated");
  if (st === "na") return t("status.na");
  return st || t("unknown");
}
var LAYER_GROUP = {
  \u63D0\u793A\u8BCD: "prompt",
  \u4EE3\u7801: "code",
  \u5DE5\u5177: "tools",
  "0.1.5 \u517C\u5BB9": "compat",
  "0.2.0 \u517C\u5BB9": "dsh20"
};
var GROUP_ORDER = ["prompt", "code", "tools", "compat", "dsh20"];
function patchRowsOf(state) {
  if (!state || !state.ai_base) return [];
  const fromList = Array.isArray(state.patches) ? state.patches : null;
  const rows = fromList ? fromList.map((p) => ({
    id: Number(p.id),
    st: p.status || "missing_file",
    layer: p.layer || ""
  })) : Object.keys(state.patch_status || {}).map((id) => ({
    id: Number(id),
    st: state.patch_status[id],
    layer: ""
  }));
  return rows.filter((r) => r.st && r.st !== "na" && Number.isFinite(r.id));
}
function tallyPatches(rows) {
  const out = {
    applied: 0,
    pending: 0,
    unmatched: 0,
    partial: 0,
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
function PatchGroups({ state }) {
  const t = useT();
  const [open, setOpen] = useState({});
  if (state?.ok === false)
    return h(
      "p",
      { role: "status" },
      "\u8BFB\u53D6\u5931\u8D25\uFF0C\u8865\u4E01\u660E\u7EC6\u6682\u4E0D\u53EF\u7528\uFF1B\u8BF7\u5237\u65B0\u91CD\u8BD5\u3002"
    );
  if (!state || !state.patch_status)
    return h("div", { className: "dshpp-skel", style: { height: 120 } });
  const located = !!state.ai_base;
  if (!located) return null;
  const grouped = /* @__PURE__ */ new Map();
  for (const row of patchRowsOf(state)) {
    const key = LAYER_GROUP[row.layer] || "code";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return GROUP_ORDER.filter((key) => grouped.has(key)).map((key) => {
    const rows = grouped.get(key).slice().sort((a, b) => a.id - b.id);
    if (!rows.length) return null;
    const tally = tallyPatches(rows);
    const notes = [];
    if (tally.pending)
      notes.push(t("metric.pendingShort", { n: tally.pending }));
    if (tally.unmatched)
      notes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
    if (tally.partial)
      notes.push(t("metric.partialShort", { n: tally.partial }));
    if (tally.skipped) notes.push(t("metric.skipShort", { n: tally.skipped }));
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
        h("strong", null, t("group." + key)),
        h(
          "span",
          { className: "dshpp-count" },
          tally.applied + "/" + tally.total + (notes.length ? " \xB7 " + notes.join(" \xB7 ") : "")
        )
      ),
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
              h("td", null, t("patch." + r.id)),
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
  });
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
        "aria-label": (label || title || "\u8BF4\u660E") + "\uFF08\u67E5\u770B\u8BF4\u660E\uFF09",
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
      setNotice(r.enabled ? "\u5DF2\u5F00\u542F\uFF0C\u91CD\u542F\u540E\u751F\u6548" : "\u5DF2\u5173\u95ED\uFF0C\u91CD\u542F\u540E\u751F\u6548");
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
    { className: "dshpp-card", "aria-label": "\u7834\u7532\u72B6\u6001" },
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        h("i", {
          className: "dshpp-dot " + (check ? failed.length ? "is-bad" : pendingLayers.length || uncertain.length ? "is-warn" : "is-ok" : "")
        }),
        "\u7834\u7532\u81EA\u68C0",
        h(
          "b",
          null,
          check ? failed.length ? `${failed.length} \u5C42\u672A\u751F\u6548` : pendingLayers.length ? `${pendingPatches} \u6761\u5F85\u5E94\u7528` : uncertain.length ? `${uncertain.length} \u5C42\u9700\u786E\u8BA4` : `${total} \u5C42\u5168\u90E8\u5728\u4F4D` : "\u68C0\u6D4B\u4E2D\u2026"
        )
      ),
      h(
        "details",
        { className: "dshpp-fold-inline" },
        h("summary", null, "\u67E5\u770B\u9010\u5C42"),
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
                layer.applicable === false ? "\u4E0D\u9002\u7528" : layer.state === "pending" ? `\u5F85\u5E94\u7528 #${(layer.pending || []).join("/#")}` : layer.state === "inferred" ? "\u5BBF\u4E3B\u63A8\u5BFC" : layer.state === "unknown" ? "\u672A\u786E\u8BA4" : `${layer.applied}/${layer.required ?? layer.total}`
              ),
              layer.note ? h(HelpTip, { title: layer.title }, layer.note) : null
            )
          ) : h("div", { className: "dshpp-muted" }, "\u68C0\u6D4B\u4E2D\u2026")
        )
      ),
      h(
        Btn,
        { tiny: true, disabled: busy, onClick: rerun },
        busy ? "\u2026" : "\u91CD\u6D4B"
      ),
      h(
        Btn,
        {
          tiny: true,
          title: "\u751F\u6210\u4E00\u6B21\u6027\u63A2\u9488\uFF1A\u4E0B\u4E00\u8F6E\u56DE\u590D\u91CC\u770B\u6A21\u578B\u6709\u6CA1\u6709\u539F\u6837\u56DE\u663E\u8BE5\u6807\u8BB0",
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
        "\u63A2\u9488"
      )
    ),
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        "\u7834\u7532\u5F3A\u5316\u6BB5",
        h(
          HelpTip,
          { title: "\u7834\u7532\u5F3A\u5316\u6BB5" },
          "\u5728\u7CFB\u7EDF\u63D0\u793A\u8BCD\u672B\u5C3E\u8FFD\u52A0\u4E00\u6BB5\u4E0E\u6CE8\u5165\u540C\u7EA7\u7684\u6587\u672C\uFF1A\u5C42\u7EA7\u58F0\u660E / \u62D2\u7EDD\u5373\u6545\u969C / \u6297\u8C04\u5A9A / \u591A\u8F6E\u91CD\u7533\u3002\u9ED8\u8BA4\u5F00\u542F\u3002"
        ),
        h("b", null, boost === null ? "\u2026" : boost ? "\u5DF2\u5F00\u542F" : "\u5DF2\u5173\u95ED")
      ),
      h(
        Btn,
        { tiny: true, disabled: boost === null, onClick: toggle },
        boost ? "\u5173\u95ED" : "\u5F00\u542F"
      ),
      notice ? h("span", { className: "dshpp-muted" }, notice) : null
    )
  );
}
function assertMaintenanceResult(result) {
  if (!result || typeof result !== "object")
    throw new Error("\u7EF4\u62A4\u63A5\u53E3\u8FD4\u56DE\u4E86\u65E0\u6548\u7ED3\u679C");
  if (result.ok === false) {
    const errors = Array.isArray(result.errors) ? result.errors.filter(Boolean).join("\uFF1B") : "";
    const partial = result.applied ? "\uFF1B\u90E8\u5206\u76EE\u6807\u5DF2\u66F4\u65B0\uFF0C\u8BF7\u91CD\u542F\u5BF9\u5E94 DSH \u8FDB\u7A0B\u52A0\u8F7D" : "";
    throw new Error((result.error || errors || "\u7EF4\u62A4\u64CD\u4F5C\u5931\u8D25") + partial);
  }
}
function maintenanceNotice(op, result) {
  if (op === "backup") {
    if (!result.id)
      throw new Error("\u5907\u4EFD\u64CD\u4F5C\u672A\u8FD4\u56DE\u5907\u4EFD\u7F16\u53F7\uFF0C\u8BF7\u5237\u65B0\u5217\u8868\u6838\u5BF9\u7ED3\u679C");
    return `\u5907\u4EFD\u5DF2\u521B\u5EFA\uFF1A${result.id}`;
  }
  if (op === "rollback")
    return (result.note || "\u63D2\u4EF6\u56DE\u6EDA\u5DF2\u5B8C\u6210") + "\u3002\u8BF7\u91CD\u542F DSH \u8FDB\u7A0B\uFF1B\u4EC5\u5237\u65B0\u6D4F\u89C8\u5668\u4E0D\u4F1A\u52A0\u8F7D\u65B0\u7248\u540E\u7AEF\u3002";
  if (op === "update") {
    if (result.applied === false || result.skipped)
      return result.note || "\u672A\u5B89\u88C5\u65B0\u7248\u672C\uFF0C\u5F53\u524D\u5B89\u88C5\u672A\u66F4\u65B0\u3002";
    if (result.applied || result.needRestart || result.restart_required) {
      const version = result.release?.version || result.localVersion || result.remoteVersion;
      const warnings = result.cleanup_warnings || [];
      const cleanup = warnings.length ? `\u6E05\u7406\u672A\u5B8C\u6210\uFF08${warnings.map((w) => `${w.stage}:${w.code}`).join("\uFF0C")}\uFF09\uFF0C\u6B8B\u7559\u5DF2\u4FDD\u7559\u3002` : "";
      return `${cleanup}\u63D2\u4EF6\u5DF2\u5B89\u88C5${version ? "\uFF1A" + version : ""}\u3002\u8BF7\u91CD\u542F DSH \u8FDB\u7A0B\uFF1B\u4EC5\u5237\u65B0\u6D4F\u89C8\u5668\u4E0D\u4F1A\u52A0\u8F7D\u65B0\u7248\u540E\u7AEF\u3002`;
    }
    return result.note || "\u66F4\u65B0\u8BF7\u6C42\u5DF2\u5B8C\u6210\uFF0C\u8BF7\u5237\u65B0\u72B6\u6001\u6838\u5BF9\u5B89\u88C5\u7ED3\u679C\u3002";
  }
  return result.note || "\u7EF4\u62A4\u64CD\u4F5C\u5DF2\u5B8C\u6210";
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
    { "aria-label": "\u81EA\u52A8\u66F4\u65B0\u8BBE\u7F6E", className: "dshpp-card" },
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
          "aria-label": "\u81EA\u52A8\u68C0\u67E5\u66F4\u65B0"
        }),
        "\u81EA\u52A8\u68C0\u67E5\u66F4\u65B0"
      ),
      h(HelpTip, {
        title: "\u81EA\u52A8\u68C0\u67E5\u66F4\u65B0",
        children: "\u542F\u52A8 30 \u79D2\u540E\u68C0\u67E5\uFF0C\u4E4B\u540E\u6309\u95F4\u9694\u68C0\u67E5\u3002\u5173\u95ED\u4E0D\u4F1A\u6539\u53D8\u5DF2\u4FDD\u5B58\u7684\u81EA\u52A8\u5B89\u88C5\u504F\u597D\uFF0C\u4F46\u4F1A\u6682\u505C\u81EA\u52A8\u5B89\u88C5\u3002"
      }),
      h(
        "select",
        {
          "aria-label": "\u66F4\u65B0\u68C0\u67E5\u95F4\u9694",
          value: value.intervalHours,
          disabled: saving || !value.autoCheck,
          onChange: (e) => save({ intervalHours: Number(e.target.value) })
        },
        [.../* @__PURE__ */ new Set([1, 6, 12, 24, value.intervalHours])].sort((a, b) => a - b).map((v) => h("option", { key: v, value: v }, `\u6BCF ${v} \u5C0F\u65F6`))
      ),
      // 「更新通道」与上面两个控件同行并排，尺寸与 select 一致：
      // 它配置的正是这条更新检查走的代理/密钥，不该漂到标题最右端。
      onOpenChannel ? h(
        Btn,
        {
          tiny: true,
          className: "dshpp-updch-open",
          disabled: saving,
          onClick: () => onOpenChannel(),
          title: tr("updch.title", "\u66F4\u65B0\u901A\u9053\uFF1A\u4EE3\u7406\u4E0E GitHub \u5BC6\u94A5")
        },
        tr("updch.open", "\u66F4\u65B0\u901A\u9053")
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
          "aria-label": "\u81EA\u52A8\u5B89\u88C5\u66F4\u65B0"
        }),
        "\u81EA\u52A8\u5B89\u88C5\u66F4\u65B0"
      ),
      h(HelpTip, {
        title: "\u81EA\u52A8\u5B89\u88C5\u66F4\u65B0",
        children: "\u4EC5\u5728\u81EA\u52A8\u68C0\u67E5\u5F00\u542F\u3001\u53D1\u73B0\u672A\u9501\u5B9A\u7684\u65B0\u6B63\u5F0F\u7248\u65F6\u5B89\u88C5\u3002\u5B89\u88C5\u524D\u5907\u4EFD\u3001\u6821\u9A8C\u53D1\u884C\u5305\uFF1B\u5931\u8D25\u4E0D\u81EA\u52A8\u5207\u6362\u6765\u6E90\u3002\u5B89\u88C5\u540E\u7B49\u5F85\u4F60\u624B\u52A8\u91CD\u542F\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F DSH\u3002"
      })
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      status.reconciliationError ? "\u5B89\u88C5\u72B6\u6001\u5F85\u6838\u5BF9\uFF0C\u81EA\u52A8\u5B89\u88C5\u5DF2\u6682\u505C\u3002" : status.restartRequired ? `\u78C1\u76D8\u7248\u672C ${status.pendingVersion}\uFF0C\u5F53\u524D\u8FD0\u884C ${status.runningVersion || "\u672A\u77E5"}\uFF1B\u7B49\u5F85\u4F60\u624B\u52A8\u91CD\u542F DSH\u3002` : !value.autoCheck ? "\u81EA\u52A8\u68C0\u67E5\u5DF2\u5173\u95ED\uFF0C\u81EA\u52A8\u5B89\u88C5\u6682\u505C\u3002" : status.checkedAt ? `\u4E0A\u6B21\u68C0\u67E5\uFF1A${new Date(status.checkedAt).toLocaleString()}${status.hasUpdate ? ` \xB7 \u53EF\u7528\u7248\u672C ${status.availableVersion}` : ""}` : "\u542F\u52A8\u540E\u81EA\u52A8\u68C0\u67E5\uFF1B\u5B89\u88C5\u540E\u4EC5\u63D0\u793A\u624B\u52A8\u91CD\u542F\u3002"
    ),
    status.reconciliationError ? h("p", { role: "alert" }, status.reconciliationError) : null,
    [...new Set([status.error, status.installError].filter(Boolean))].map(
      (message) => h("p", { key: message, role: "alert" }, message)
    ),
    error ? h("p", { role: "alert" }, error) : null
  );
}
function UpdateChannelDialog({ value, onClose, onSaved }) {
  const tr = useText();
  const [proxy, setProxy] = useState(value?.proxyUrl || "");
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
      "aria-label": tr("updch.title", "\u66F4\u65B0\u901A\u9053\uFF1A\u4EE3\u7406\u4E0E GitHub \u5BC6\u94A5"),
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
        tr("updch.title", "\u66F4\u65B0\u901A\u9053\uFF1A\u4EE3\u7406\u4E0E GitHub \u5BC6\u94A5")
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        tr(
          "updch.scope",
          "\u8FD9\u91CC\u7684\u4EE3\u7406\u4E0E\u5BC6\u94A5\u53EA\u4F5C\u7528\u4E8E\u672C\u63D2\u4EF6\u7684\u66F4\u65B0\u68C0\u67E5\u4E0E\u4E0B\u8F7D\u901A\u9053\uFF0C\u4E0D\u5F71\u54CD\u5176\u5B83\u6A21\u578B\u5382\u5546\u7684\u8BF7\u6C42\uFF0C\u4E5F\u4E0D\u5199\u5165\u5BBF\u4E3B\u8FDB\u7A0B\u73AF\u5883\u3002\u7559\u7A7A\u7EE7\u627F\u5DF2\u6709\u66F4\u65B0\u4EE3\u7406\u73AF\u5883\u3002"
        )
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, tr("updch.proxy", "\u4EE3\u7406\u5730\u5740")),
        h("input", {
          ref: proxyRef,
          type: "text",
          className: "dshpp-field dshpp-updch-field",
          "aria-label": tr("updch.proxy", "\u4EE3\u7406\u5730\u5740"),
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
          "\u652F\u6301 http:// / https:// / socks5:// \u524D\u7F00\uFF0C\u4F8B\u5982 http://127.0.0.1:7890\u3002\u7559\u7A7A\u7EE7\u627F\u5DF2\u6709\u66F4\u65B0\u4EE3\u7406\u73AF\u5883\u3002"
        )
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, tr("updch.token", "GitHub \u5BC6\u94A5")),
        h("input", {
          type: "password",
          className: "dshpp-field dshpp-updch-field",
          "aria-label": tr("updch.token", "GitHub \u5BC6\u94A5"),
          value: token,
          disabled: saving || clearToken,
          placeholder: tr(
            "updch.token.ph",
            "\u53EF\u9009\uFF1A\u63D0\u9AD8 GitHub API \u989D\u5EA6\uFF0C\u7559\u7A7A\u5219\u4E0D\u4FEE\u6539"
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
          "\u672C\u673A\u5DF2\u914D\u7F6E\u5BC6\u94A5\u3002\u8F93\u5165\u6846\u59CB\u7EC8\u4E3A\u7A7A\uFF0C\u7559\u7A7A\u4FDD\u5B58\u8868\u793A\u4FDD\u6301\u4E0D\u53D8\u3002"
        ) : tr("updch.token.unset", "\u672C\u673A\u5C1A\u672A\u914D\u7F6E\u5BC6\u94A5\u3002\u7559\u7A7A\u8868\u793A\u4E0D\u914D\u7F6E\u3002")
      ),
      hasToken ? h(
        "label",
        { className: "dshpp-updch-check" },
        h("input", {
          type: "checkbox",
          checked: clearToken,
          disabled: saving,
          "aria-label": tr("updch.token.clear", "\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684\u5BC6\u94A5"),
          onChange: (e) => setClearToken(!!e.target.checked)
        }),
        h("span", null, tr("updch.token.clear", "\u6E05\u9664\u5DF2\u4FDD\u5B58\u7684\u5BC6\u94A5"))
      ) : null,
      error ? h("p", { role: "alert" }, error) : null,
      h(
        "div",
        { className: "dshpp-updch-ops" },
        h(
          Btn,
          { disabled: saving, onClick: onClose },
          tr("updch.cancel", "\u53D6\u6D88")
        ),
        h(
          Btn,
          { kind: "primary", disabled: saving, onClick: save },
          saving ? tr("updch.saving", "\u4FDD\u5B58\u4E2D\u2026") : tr("updch.save", "\u4FDD\u5B58")
        )
      )
    )
  );
}
function CommunityMaintenance() {
  const [value, setValue] = useState(null), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false), [selected, setSelected] = useState(""), [releases, setReleases] = useState(null), [release, setRelease] = useState("");
  const [listState, setListState] = useState("loading"), [listError, setListError] = useState("");
  const [channelOpen, setChannelOpen] = useState(false);
  const tr = useText();
  const mounted = useRef(false), generation = useRef(0), running = useRef(false);
  const load = useCallback(async () => {
    const request = ++generation.current;
    setListState("loading");
    setListError("");
    try {
      const result = await apiJson("/dsh-purge/community");
      assertMaintenanceResult(result);
      if (!Array.isArray(result.backups)) throw new Error("\u5907\u4EFD\u5217\u8868\u54CD\u5E94\u65E0\u6548");
      if (!mounted.current || request !== generation.current) return;
      setValue(result);
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
    load();
    return () => {
      mounted.current = false;
      generation.current++;
    };
  }, [load]);
  async function run(op) {
    if (running.current) return;
    if (op === "rollback" && !window.confirm(
      "\u53EA\u56DE\u6EDA Purge \u63D2\u4EF6\u53CA\u5176\u5165\u53E3\uFF0C\u4FDD\u7559\u5F53\u524D\u63D0\u793A\u8BCD\u548C\u8BBE\u7F6E\uFF1B\u5B8C\u6210\u540E\u9700\u91CD\u542F DSH \u8FDB\u7A0B\uFF1B\u4EC5\u5237\u65B0\u6D4F\u89C8\u5668\u4E0D\u4F1A\u52A0\u8F7D\u65B0\u7248\u540E\u7AEF\u3002\u7EE7\u7EED\uFF1F"
    ))
      return;
    if (op === "update" && !window.confirm(
      "\u5C06\u5148\u5907\u4EFD\uFF0C\u518D\u5B89\u88C5\u6240\u9009\u793E\u533A\u6B63\u5F0F\u7248\uFF1B\u4E0D\u4F1A\u91CD\u65B0\u5E94\u7528\u5BBF\u4E3B\u8865\u4E01\u3002\u5B89\u88C5\u540E\u8BF7\u91CD\u542F DSH \u8FDB\u7A0B\uFF1B\u4EC5\u5237\u65B0\u6D4F\u89C8\u5668\u4E0D\u4F1A\u52A0\u8F7D\u65B0\u7248\u540E\u7AEF\u3002\u7EE7\u7EED\uFF1F"
    ))
      return;
    running.current = true;
    setBusy(true);
    setNotice("\u5904\u7406\u4E2D\u2026");
    try {
      const r = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, id: selected, ref: release })
      });
      assertMaintenanceResult(r);
      if (!mounted.current) return;
      if (op === "check") {
        if (!Array.isArray(r.versions)) throw new Error("\u53D1\u884C\u5217\u8868\u54CD\u5E94\u65E0\u6548");
        setReleases(r.versions.filter((v) => v.asset));
        setRelease(r.versions.find((v) => v.asset)?.ref || "");
        setNotice(
          r.degraded ? `${r.degraded}\uFF1B${r.stale ? "\u5F53\u524D\u663E\u793A\u7F13\u5B58\u5217\u8868\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" : "\u5DF2\u663E\u793A\u5907\u7528\u5217\u8868"}` : r.error ? `\u68C0\u67E5\u66F4\u65B0\u5931\u8D25\uFF1A${r.error}` : r.hasUpdate ? `\u53D1\u73B0\u65B0\u7248\u672C ${r.remoteVersion}` : "\u5F53\u524D\u5DF2\u662F\u6700\u65B0\u6B63\u5F0F\u7248"
        );
      } else {
        setNotice(maintenanceNotice(op, r));
      }
    } catch (e) {
      if (mounted.current)
        setNotice(
          e.message === "timeout" ? "\u7EF4\u62A4\u8BF7\u6C42\u8D85\u65F6\uFF0C\u64CD\u4F5C\u53EF\u80FD\u4ECD\u5728\u6267\u884C\uFF1B\u8BF7\u5148\u5237\u65B0\u72B6\u6001\uFF0C\u52FF\u91CD\u590D\u63D0\u4EA4\u3002" : e.message
        );
    } finally {
      if (op !== "check" && mounted.current) await load();
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": "\u793E\u533A\u7248\u7EF4\u62A4" },
    h("h3", null, "\u7EF4\u62A4\uFF1A\u66F4\u65B0\u4E0E\u672C\u673A\u5907\u4EFD"),
    // 通道现状摘要：代理是否直连、密钥是否已配置（密钥明文永不回显）。
    // 入口按钮不在这里，它跟「自动检查更新」放在同一行。
    value ? h(
      "p",
      { className: "dshpp-hint" },
      (value.update_preferences?.proxyUrl ? tr("updch.state.proxy", "\u66F4\u65B0\u901A\u9053\u4EE3\u7406\uFF1A") + value.update_preferences.proxyUrl : tr("updch.state.direct", "\u66F4\u65B0\u901A\u9053\uFF1A\u7EE7\u627F\u73AF\u5883\u6216\u7CFB\u7EDF\u4EE3\u7406")) + " \xB7 " + (value.update_preferences?.hasGithubToken ? tr("updch.state.token.on", "GitHub \u5BC6\u94A5\u5DF2\u914D\u7F6E") : tr("updch.state.token.off", "\u672A\u914D\u7F6E GitHub \u5BC6\u94A5"))
    ) : null,
    h(UpdatePreferences, {
      value: value?.update_preferences,
      status: value?.update_status,
      onSaved: (next) => setValue((current) => ({ ...current, update_preferences: next })),
      onOpenChannel: () => setChannelOpen(true)
    }),
    h(
      "div",
      { className: "dshpp-row" },
      h(Btn, { disabled: busy, onClick: () => run("check") }, "\u68C0\u67E5\u793E\u533A\u7248\u66F4\u65B0"),
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
              setNotice(lines.length ? lines.join("\n") : "\u8FD8\u6CA1\u6709\u52A8\u4F5C\u8BB0\u5F55");
            } catch (e) {
              setNotice(e.message);
            }
          }
        },
        "\u6700\u8FD1\u52A8\u4F5C"
      ),
      h(
        "a",
        {
          href: "https://github.com/kingcharleslzy-ai/dsh-purge/releases",
          target: "_blank",
          rel: "noreferrer"
        },
        "\u53D1\u884C\u8BB0\u5F55"
      )
    ),
    releases?.length ? h(
      "div",
      { className: "dshpp-row" },
      h(
        "select",
        {
          "aria-label": "\u9009\u62E9\u793E\u533A\u53D1\u884C\u7248\u672C",
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
        "\u5B89\u88C5\u6240\u9009\u7248\u672C"
      )
    ) : null,
    h("h3", { style: { marginTop: 20 } }, "\u672C\u673A\u5907\u4EFD"),
    h(
      Btn,
      { disabled: busy || listState === "loading", onClick: load },
      "\u5237\u65B0\u5907\u4EFD\u5217\u8868"
    ),
    listState === "loading" ? h("p", { role: "status" }, "\u6B63\u5728\u8BFB\u53D6\u5907\u4EFD\u2026") : null,
    listState === "error" ? h("p", { role: "alert" }, `\u8BFB\u53D6\u5907\u4EFD\u5931\u8D25\uFF1A${listError}`) : null,
    listState === "ready" && !value.backups.length ? h("p", { role: "status" }, "\u6682\u65E0\u5907\u4EFD") : null,
    h(
      "div",
      { className: "dshpp-row" },
      h(Btn, { disabled: busy, onClick: () => run("backup") }, "\u7ACB\u5373\u5907\u4EFD"),
      h(
        "select",
        {
          "aria-label": "\u9009\u62E9\u56DE\u6EDA\u5907\u4EFD",
          value: selected,
          onChange: (e) => setSelected(e.target.value),
          disabled: busy || listState !== "ready"
        },
        h("option", { value: "" }, "\u9009\u62E9\u5907\u4EFD"),
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
        "\u56DE\u6EDA\u63D2\u4EF6"
      )
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      "\u5907\u4EFD\u53EA\u4FDD\u5B58\u5728\u672C\u673A\u3002\u56DE\u6EDA\u4FDD\u7559\u5F53\u524D\u63D0\u793A\u8BCD\u3001\u89C4\u5219\u548C\u5176\u4ED6\u63D2\u4EF6\u8BBE\u7F6E\uFF1B\u5B89\u88C5\u6216\u56DE\u6EDA\u540E\u9700\u8981\u91CD\u542F DSH \u8FDB\u7A0B\uFF1B\u4EC5\u5237\u65B0\u6D4F\u89C8\u5668\u4E0D\u4F1A\u52A0\u8F7D\u65B0\u7248\u540E\u7AEF\u3002"
    ),
    notice ? h("p", { role: "status" }, notice) : null,
    // 对话框挂在面板内部，靠固定定位脱离容器，不依赖 portal。
    channelOpen && value ? h(UpdateChannelDialog, {
      value: value.update_preferences,
      onClose: () => setChannelOpen(false),
      onSaved: (next) => {
        setValue((current) => ({ ...current, update_preferences: next }));
        setNotice(
          tr("updch.saved", "\u66F4\u65B0\u901A\u9053\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u4E00\u6B21\u68C0\u67E5\u66F4\u65B0\u5373\u751F\u6548\u3002")
        );
      }
    }) : null
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
    if (msg === "timeout" || /aborted|abort|超时/i.test(msg))
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
                text: "\u8865\u4E01\u5DF2\u5199\u5165\u78C1\u76D8\uFF0C\u5F53\u524D\u8FDB\u7A0B\u5C1A\u672A\u52A0\u8F7D\u3002\u6362\u5305\u52A9\u624B\u7B49\u5F85\u4F60\u5B8C\u6574\u9000\u51FA\uFF08macOS \u7528 \u2318Q\uFF0CWindows \u4ECE\u7CFB\u7EDF\u6258\u76D8\u9000\u51FA\uFF09\u3002\u786E\u8BA4\u6362\u5305\u5B8C\u6210\u540E\u518D\u624B\u52A8\u6253\u5F00 DSH\uFF0C\u4E0D\u4F1A\u81EA\u52A8\u91CD\u542F\u3002"
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
      if (!d || !d.ok) throw new Error(d && d.error || "\u4FDD\u5B58\u5931\u8D25");
      const unchanged = readPromptBox() === content;
      if (unchanged && typeof d.content === "string") {
        overrideRef.current = d.content;
        setOverride(d.content);
      }
      setNotice({
        kind: "ok",
        text: unchanged ? t("saved.override") : "\u5DF2\u4FDD\u5B58\u63D0\u4EA4\u7684\u7248\u672C\uFF1B\u5F53\u524D\u4FEE\u6539\u5C1A\u672A\u4FDD\u5B58\u3002"
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
      if (!d || !d.ok) throw new Error(d && d.error || "\u4FDD\u5B58\u5931\u8D25");
      const unchanged = ownRef.current === content;
      if (unchanged && typeof d.content === "string") {
        ownRef.current = d.content;
        setOwnServers(d.content);
      }
      setNotice({
        kind: "ok",
        text: !unchanged ? "\u5DF2\u4FDD\u5B58\u63D0\u4EA4\u7684\u7248\u672C\uFF1B\u5F53\u524D\u4FEE\u6539\u5C1A\u672A\u4FDD\u5B58\u3002" : d.dropped > 0 ? t("saved.own.dropped", { n: d.dropped }) : t("saved.own")
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
        text: unchanged ? tr("saved.restoreInject") : "\u5DF2\u6062\u590D\u9ED8\u8BA4\u503C\uFF1B\u5F53\u524D\u4FEE\u6539\u5C1A\u672A\u4FDD\u5B58\u3002"
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
  const tally = located ? tallyPatches(patchRowsOf(s)) : { applied: 0, pending: 0, unmatched: 0, skipped: 0, total: 0 };
  const total = tally.total;
  const applied = tally.applied;
  const pct = located && total ? Math.round(applied / total * 100) : 0;
  const metricNotes = [];
  if (tally.pending)
    metricNotes.push(t("metric.pendingShort", { n: tally.pending }));
  if (tally.unmatched)
    metricNotes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
  if (tally.skipped)
    metricNotes.push(t("metric.skipShort", { n: tally.skipped }));
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
      h(
        "div",
        { className: "dshpp-hero" },
        h(
          "div",
          { className: "dshpp-hero-state" },
          h("i", {
            className: "dshpp-dot " + (!located ? "is-warn" : patchBusy ? "" : s?.asar_still_sealed || tally.pending ? "is-warn" : "is-ok")
          }),
          h(
            "b",
            null,
            !s ? "\u6B63\u5728\u8BFB\u53D6\u5BBF\u4E3B\u72B6\u6001\u2026" : s.ok === false ? "\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF0C\u5BBF\u4E3B\u4E0E\u8865\u4E01\u72B6\u6001\u672A\u77E5" : !located ? sealedReady ? "\u5BBF\u4E3B\u8FD8\u6CA1\u89E3\u5F00\uFF1A\u70B9\u300C\u5E94\u7528\u300D" : "\u672A\u5B9A\u4F4D\u5230\u5BBF\u4E3B\uFF1A\u70B9\u300C\u5E94\u7528\u300D\u91CD\u8BD5" : s?.asar_still_sealed ? `${applied}/${total} \u6761\u78C1\u76D8\u8865\u4E01\uFF08\u9000\u51FA\u91CD\u5F00\u540E\u52A0\u8F7D\uFF09` : tally.pending ? `\u8FD8\u6709 ${tally.pending} \u6761\u5F85\u5E94\u7528` : `${applied}/${total} \u6761\u8865\u4E01\u5DF2\u751F\u6548`
          ),
          h(
            "span",
            { className: "dshpp-hero-sub" },
            t("surface." + hostSurface)
          )
        ),
        h(
          "div",
          { className: "dshpp-hero-actions" },
          h(
            Btn,
            {
              kind: "primary",
              className: "dshpp-btn-lead",
              disabled: patchBusy || uninstallBusy || !overrideLoaded,
              onClick: () => doAction("apply", "action.apply")
            },
            patchBusy ? t("btn.apply.busy") : t("btn.apply")
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
            Btn,
            {
              tiny: true,
              onClick: loadAll,
              disabled: patchBusy || uninstallBusy
            },
            "\u5237\u65B0"
          )
        ),
        h(
          "p",
          { className: "dshpp-hero-hint" },
          "\u88C5\u597D\u63D2\u4EF6\u3001\u66F4\u65B0\u8FC7 DSH\u3001\u6216\u53D1\u73B0\u6A21\u578B\u53C8\u5F00\u59CB\u63A8\u8131\u65F6\uFF1A\u70B9\u4E00\u6B21\u300C\u5E94\u7528\u300D\uFF0C\u7136\u540E\u9000\u51FA\u5E76\u91CD\u5F00 DSH\uFF0C\u5C31\u4F1A\u6062\u590D\u3002"
        ),
        noticeNode(notice)
      ),
      h(
        "div",
        { className: "dshpp-rel" },
        h(
          "div",
          { className: "dshpp-now" },
          h("span", { className: "dshpp-now-label" }, t("channel.local")),
          h(
            "b",
            { className: "dshpp-now-ver" },
            localVer ? "v" + localVer : "\u2014"
          ),
          h("em", { className: "dshpp-now-mark" }, t("update.current"))
        ),
        h(
          "details",
          { className: "dshpp-editions" },
          h("summary", null, "\u7248\u672C\u7BA1\u7406"),
          renderEdition("stable"),
          renderEdition("beta")
        ),
        noticeNode(updateNotice)
      ),
      h(
        "details",
        { className: "dshpp-fold" },
        h(
          "summary",
          null,
          "\u8865\u4E01\u660E\u7EC6 ",
          h(
            "b",
            null,
            !s ? "\u8BFB\u53D6\u4E2D" : s.ok === false ? "\u72B6\u6001\u672A\u77E5" : s.ai_base ? `${applied}/${total} \u5DF2\u5E94\u7528` : "\u672A\u5B9A\u4F4D\u5BBF\u4E3B"
          )
        ),
        h(PatchGroups, { state: s })
      ),
      h(
        "details",
        null,
        h("summary", null, "\u9AD8\u7EA7\u9009\u9879"),
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
        "aria-label": "\u63D0\u793A\u8BCD\u5185\u5BB9",
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
        "aria-label": "\u670D\u52A1\u5668\u540D\u5355",
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
var listeners = /* @__PURE__ */ new Set();
function notify() {
  for (const listener of listeners) listener();
}
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
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

// src/components/settings-shell.js
function CompatibilityNote({ status }) {
  if (false) return h(CommunityCompatibilityNote);
  if (!status) return null;
  const v = String(status.plugin_version || "");
  const valid = typeof status.patches_total === "number" && !!v;
  if (valid && v === "1.1.71") return null;
  return h(
    "p",
    {
      role: "status",
      className: "dshpp-hint",
      style: { margin: "0 20px 10px" }
    },
    valid ? "\u5B98\u65B9\u7248\u672C " + v + "\uFF1B\u6B64\u754C\u9762\u5DF2\u9A8C\u8BC1 1.1.71\u3002\u5982\u9047\u8BBE\u7F6E\u5F02\u5E38\uFF0C\u8BF7\u66F4\u65B0\u754C\u9762\u63D2\u4EF6\u3002" : "\u65E0\u6CD5\u786E\u8BA4\u5B98\u65B9 Purge \u63A5\u53E3\u3002\u8BF7\u68C0\u67E5\u5B98\u65B9\u63D2\u4EF6\u662F\u5426\u542F\u7528\uFF0C\u6216\u66F4\u65B0\u754C\u9762\u63D2\u4EF6\u3002"
  );
}
function SettingsRoot(props = {}) {
  const t = typeof props.t === "function" ? props.t : useT();
  const [page, setPage] = useState("status");
  const [backendStatus, setBackendStatus] = useState(null);
  const st = useDock();
  const [visited, setVisited] = useState({ status: true });
  const select = (id) => {
    setPage(id);
    setVisited((v) => ({ ...v, [id]: true }));
  };
  useEffect(() => {
    if (st.tab === "drill" && st.open) select("drill");
  }, [st.tab, st.open]);
  setTranslate(t);
  return h(
    "div",
    { className: "dshpp-native dshpp-root" },
    h("style", null, base_default + native_default),
    h(
      "header",
      { className: "dshpp-native-head" },
      h("div", null, h("h2", null, "Purge"), h("p", null, "\u63D2\u4EF6\u8BBE\u7F6E")),
      h(
        "span",
        { className: "dshpp-native-badge" },
        (false ? "\u793E\u533A\u7248 " : "\u72EC\u7ACB\u754C\u9762 ") + "1.1.2"
      )
    ),
    h(CompatibilityNote, { status: backendStatus }),
    h(
      "nav",
      { className: "dshpp-native-nav", "aria-label": "Purge \u8BBE\u7F6E\u5206\u7C7B" },
      [
        ["status", "\u72B6\u6001"],
        ["prompt", "\u63D0\u793A\u8BCD"],
        ["rules", "\u89C4\u5219"],
        ["skills", "\u6280\u80FD"],
        ["more", "\u66F4\u591A"]
      ].map(
        ([id, label]) => h(
          "button",
          {
            key: id,
            type: "button",
            "aria-pressed": page === id,
            onClick: () => select(id)
          },
          label
        )
      )
    ),
    h(
      "div",
      { className: "dshpp-native-content" },
      false ? h(CommunityMaintenance) : null,
      h(
        "div",
        { hidden: !["status", "prompt", "more"].includes(page) },
        h(PurgifySection, { page, onStatus: setBackendStatus })
      ),
      visited.rules ? h("div", { hidden: page !== "rules" }, h(RulesSection)) : null,
      visited.skills ? h("div", { hidden: page !== "skills" }, h(SkillsSection)) : null,
      h(
        "div",
        { hidden: page !== "more", className: "dshpp-more" },
        h("h3", null, "\u6F14\u7EC3\u53F0"),
        h("p", null, "\u6253\u5F00\u63D2\u4EF6\u539F\u6709\u7684\u6F14\u7EC3\u5DE5\u5177\u4E0E\u73AF\u5883\u8BBE\u7F6E\u3002"),
        h(
          Btn,
          {
            onClick: () => {
              select("drill");
              requestDrill("tab");
            }
          },
          "\u6253\u5F00\u6F14\u7EC3\u53F0"
        ),
        h(
          "p",
          { className: "dshpp-attribution" },
          false ? "\u57FA\u4E8E YuJunZhiXue/dsh-purge 1.1.71 \u72EC\u7ACB\u7EF4\u62A4\uFF0C\u4FDD\u7559\u539F\u4F5C\u8005\u7F72\u540D\uFF1B\u66F4\u65B0\u4EC5\u6765\u81EA\u672C fork\u3002" : "\u754C\u9762\u72EC\u7ACB\u7EF4\u62A4\uFF1B\u5B98\u65B9 Purge \u53EF\u5355\u72EC\u66F4\u65B0\u3002\u57FA\u4E8E YuJunZhiXue/dsh-purge 1.1.71\uFF08MIT\uFF09\u3002"
        )
      ),
      page === "drill" ? h(
        "div",
        { className: "dshpp-native-drill" },
        // 演练台自带一套 CSS（.rt-*）；旧版由 dock 注入 <head>，重构时丢了，
        // 结果面板在右侧栏里完全没样式、文字被挤成一列。这里随组件一起挂上。
        __dshPurgeDrill && __dshPurgeDrill.CSS ? h("style", { "data-dsh-purge-drill": "1" }, __dshPurgeDrill.CSS) : null,
        h(
          Btn,
          {
            onClick: () => {
              setDock({ tab: "clean" });
              select("more");
            }
          },
          "\u8FD4\u56DE\u8BBE\u7F6E"
        ),
        readDrillAuth() ? h(__dshPurgeDrill.Panel, { embedded: true }) : h("p", null, "\u8BF7\u5148\u5B8C\u6210\u6F14\u7EC3\u53F0\u6388\u6743\u3002")
      ) : null
    )
  );
}

// src/components/page.js
var TABS = [
  ["status", "\u72B6\u6001", "\u5BBF\u4E3B\u517C\u5BB9\u3001\u8865\u4E01\u3001\u7834\u7532\u81EA\u68C0"],
  ["prompt", "\u63D0\u793A\u8BCD", "\u6CE8\u5165\u6B63\u6587\u4E0E\u7834\u7532\u5F3A\u5316\u6BB5"],
  ["rules", "\u89C4\u5219", "\u89C4\u5219\u96C6\u4E0E\u5DE5\u4F5C\u533A\u7B56\u7565"],
  ["skills", "\u6280\u80FD", "DSH \u6280\u80FD\u76EE\u5F55"],
  ["drill", "\u6F14\u7EC3\u53F0", "\u7EA2\u961F\u6F14\u7EC3\u4E0E\u73AF\u5883\u9002\u914D"],
  ["more", "\u66F4\u591A", "\u670D\u52A1\u5668\u540D\u5355\u3001\u66F4\u65B0\u4E0E\u7EF4\u62A4"]
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
      "\u517C\u5BB9\u7EA7\u522B ",
      h(
        "b",
        null,
        level === "qualified" ? "\u5DF2\u56DE\u5F52\u9A8C\u8BC1" : level === "unverified" ? "\u672A\u9A8C\u8BC1\u7248\u672C" : level === "mixed" ? "\u7EC4\u4EF6\u7248\u672C\u4E0D\u4E00\u81F4" : level ? "\u672A\u5B9A\u4F4D\u5BBF\u4E3B" : info?.ok === false ? "\u8BFB\u53D6\u5931\u8D25" : "\u68C0\u6D4B\u4E2D"
      ),
      h(
        HelpTip,
        { title: "\u517C\u5BB9\u7EA7\u522B" },
        compat.message || "\u8BFB\u53D6\u5BBF\u4E3B\u7EC4\u4EF6\u7248\u672C\u540E\u7ED9\u51FA\u7ED3\u8BBA\u3002qualified \u8868\u793A\u8BE5 DSH \u7248\u672C\u7684\u8865\u4E01\u951A\u70B9\u5DF2\u9010\u6761\u56DE\u5F52\u3002"
      )
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "\u78C1\u76D8\u5199\u5165\u8BA1\u6570 ",
      h(
        "b",
        null,
        `${info?.patches_applied ?? "?"}/${info?.patches_total ?? "?"}`,
        info?.patches_na > 0 ? ` \xB7 ${info.patches_na} \u6761\u672C\u673A\u4E0D\u9002\u7528` : ""
      ),
      h(
        HelpTip,
        { title: "\u5BBF\u4E3B\u8865\u4E01" },
        `\u5B9E\u9645\u5199\u8FDB DSH \u5BBF\u4E3B\u4EE3\u7801\u7684\u8865\u4E01\u6761\u6570\uFF08\u5206\u6BCD\u53EA\u7B97\u672C\u673A\u9002\u7528\u7684\uFF09\u3002\u5168\u90E8\u8865\u4E01 ${info?.patches_total_all ?? "?"} \u6761\uFF0C\u5176\u4E2D ${info?.patches_na ?? 0} \u6761\u76EE\u6807\u63D2\u4EF6/\u9884\u8BBE\u672A\u5B89\u88C5\uFF1B\u5F85\u5E94\u7528\u8868\u793A\u951A\u70B9\u8FD8\u5728\u3001\u8FD8\u6CA1\u5199\u5165\uFF1B\u6CA1\u5BF9\u4E0A\u8868\u793A\u5BBF\u4E3B\u6E90\u7801\u5DF2\u53D8\uFF0C\u9700\u8981\u91CD\u65B0\u5B9A\u4F4D\u951A\u70B9\u3002`
      )
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "\u63D2\u4EF6 ",
      h("b", null, info?.plugin_version || "1.1.2")
    )
  );
}
function LayoutNotice({ info }) {
  if (!info || !info.asar_still_sealed && !info.host_layout) return null;
  const sealed = info.asar_still_sealed === true;
  const note = info.host_layout?.note || "\u76EE\u6807\u78C1\u76D8\u4ECD\u6709 app.asar\uFF1B\u5F53\u524D\u8FDB\u7A0B\u52A0\u8F7D\u6765\u6E90\u5C1A\u672A\u786E\u8BA4\u3002";
  const handoff = info.asar_handoff ? ` \u6362\u5305\u72B6\u6001\uFF1A${{ not_scheduled: "\u5C1A\u672A\u5E94\u7528\uFF1A\u70B9\u300C\u5E94\u7528\u300D\u540E\u624D\u4F1A\u5B89\u6392\u6362\u5305", archive_reappeared: "\u5F52\u6863\u518D\u6B21\u51FA\u73B0\uFF0C\u65E7\u6362\u5305\u8BB0\u5F55\u4E0D\u4EE3\u8868\u5F53\u524D\u5DF2\u5B8C\u6210", backup_missing: "\u539F\u5F52\u6863\u5907\u4EFD\u7F3A\u5931\uFF0C\u8BF7\u68C0\u67E5\u8BCA\u65AD", unknown_target: "\u76EE\u6807\u5B9E\u4F8B\u672A\u786E\u5B9A", unreadable: "\u6362\u5305\u8BB0\u5F55\u4E0D\u53EF\u8BFB\uFF0C\u8BF7\u68C0\u67E5\u8BCA\u65AD", starting: "\u52A9\u624B\u542F\u52A8\u4E2D\uFF08\u5C1A\u672A\u786E\u8BA4\u5C31\u7EEA\uFF09", ready: "\u52A9\u624B\u5DF2\u5C31\u7EEA", waiting_for_quit: "\u7B49\u5F85\u5B8C\u6574\u9000\u51FA\uFF08macOS \u2318Q / Windows \u7CFB\u7EDF\u6258\u76D8\uFF09", waiting_for_unlock: "\u7B49\u5F85\u5F52\u6863\u89E3\u9501", moving: "\u6B63\u5728\u4FDD\u7559\u539F\u5F52\u6863", complete: "\u6362\u5305\u5B8C\u6210\uFF0C\u8BF7\u624B\u52A8\u6253\u5F00 DSH", already_unsealed: "\u5F52\u6863\u5DF2\u79FB\u8D70\uFF0C\u8BF7\u624B\u52A8\u6253\u5F00 DSH", failed: "\u5931\u8D25\uFF0C\u8BF7\u67E5\u770B\u8BCA\u65AD\u5E76\u6309\u6062\u590D\u6587\u6863\u64CD\u4F5C", expired: "\u7B49\u5F85\u8D85\u65F6\uFF0C\u8BF7\u91CD\u65B0\u5E94\u7528\u6216\u6309\u6062\u590D\u6587\u6863\u64CD\u4F5C", helper_stopped: "\u52A9\u624B\u610F\u5916\u7ED3\u675F\uFF0C\u8BF7\u91CD\u65B0\u5E94\u7528\u6216\u6309\u6062\u590D\u6587\u6863\u64CD\u4F5C" }[info.asar_handoff.phase] || info.asar_handoff.phase}\u3002` : "";
  const failure = info.asar_handoff?.error;
  const detail = info.asar_handoff?.detail ? ` \u8BE6\u60C5\uFF1A${info.asar_handoff.detail}${failure?.win32_code != null ? `\uFF08Windows \u9519\u8BEF ${failure.win32_code}\uFF09` : ""}` : "";
  const confirmed = info.host_layout?.state === "unpacked_entry" && info.host_layout?.process?.matches_target === true && info.host_layout?.disk?.archive_exists === false;
  const diskNote = info.host_layout?.disk?.archive_exists === true ? " \u76EE\u6807\u78C1\u76D8\u4ECD\u6709 app.asar\u3002" : "";
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
    h("summary", null, "\u2713 \u5DF2\u4ECE\u89E3\u5305\u76EE\u5F55\u542F\u52A8\uFF08\u6362\u5305\u5B8C\u6210\uFF09"),
    h("p", { className: "dshpp-note" }, note, diskNote, handoff, detail)
  );
}
function VersionNotice({ info }) {
  if (info && info.ok === false) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      `\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF1A${info.error || "\u63A5\u53E3\u4E0D\u53EF\u7528"}\u3002\u5F53\u524D\u5BBF\u4E3B\u4E0E\u8865\u4E01\u72B6\u6001\u672A\u77E5\uFF0C\u8BF7\u70B9\u300C\u5237\u65B0\u300D\u91CD\u8BD5\uFF1B\u6301\u7EED\u5931\u8D25\u65F6\u8BF7\u63D0\u4F9B\u64CD\u4F5C\u7CFB\u7EDF\u3001DSH/\u63D2\u4EF6\u7248\u672C\u548C\u6B64\u9519\u8BEF\u3002`
    );
  }
  const backend = info?.plugin_version;
  if (!backend || backend === "1.1.2") return null;
  return h(
    "p",
    { className: "dshpp-warn", role: "status" },
    `\u5B98\u65B9\u7248\u672C ${backend}\uFF1B\u754C\u9762 ${"1.1.2"}\u3002\u4E24\u8005\u4E0D\u4E00\u81F4\u65F6\u8BBE\u7F6E\u53EF\u80FD\u4E0D\u751F\u6548\uFF0C\u8BF7\u66F4\u65B0\u5230\u540C\u4E00\u7248\u672C\u540E\u91CD\u542F DSH\u3002`
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
          false ? h(
            "span",
            { className: "dshpp-page-ver" },
            "\u793E\u533A\u7248 1.1.2"
          ) : null
        )
      )
    ),
    h(StatusStrip, { info }),
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
        h(PurgifySection, { page: "status", onStatus: mergeInfo }),
        h(StatusExtras),
        h(CommunityMaintenance)
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
            "\u6F14\u7EC3\u53F0\u9700\u8981\u5148\u5B8C\u6210\u4E00\u6B21\u6388\u6743\u3002"
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
            "\u53BB\u6388\u6743"
          )
        )
      ) : null
    ),
    h(
      "footer",
      { className: "dshpp-page-foot" },
      false ? "\u57FA\u4E8E YuJunZhiXue/dsh-purge 1.1.71 \u72EC\u7ACB\u7EF4\u62A4 \xB7 MIT \xB7 \u4FDD\u7559\u539F\u4F5C\u8005\u7F72\u540D" : "\u754C\u9762\u72EC\u7ACB\u7EF4\u62A4 \xB7 \u57FA\u4E8E YuJunZhiXue/dsh-purge 1.1.71\uFF08MIT\uFF09"
    )
  );
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
          throw new Error("\u6253\u4E0D\u5F00\u56DE\u9000\u540E\u7684\u4F1A\u8BDD");
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
  throw new Error(lastError && lastError.message || "\u56DE\u9000\u540E\u7684\u4F1A\u8BDD\u6CA1\u6709\u6253\u5F00");
}

// src/components/rewind.js
var REWIND_CSS = `
.dshp-rewind-wrap{position:relative;display:inline-flex}
.dshp-rewind{appearance:none;display:inline-flex;align-items:center;gap:4px;height:28px;padding:0 8px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-secondary,currentColor);font:12px/1 var(--ds-font-sans,system-ui,sans-serif);cursor:pointer}
.dshp-rewind:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,currentColor)}
.dshp-rewind:disabled{opacity:.4;cursor:default}
.dshp-rewind svg{display:block}
.dshp-rewind-menu{position:fixed;z-index:2147483000;box-sizing:border-box;min-width:220px;padding:4px;border:0;border-radius:12px;background:var(--dsw-specific-menu,#fff);color:var(--dsw-alias-label-primary,#1a1a1a);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1);box-shadow:var(--dsw-elevation-prominent,0 8px 24px rgba(0,0,0,.16));transform:translateY(-100%)}
body[data-ds-dark-theme] .dshp-rewind-menu{background:var(--dsw-specific-menu,#32312d);color:var(--dsw-alias-label-primary,#e6e2db);--dsw-elevation-stroke-color:var(--dsw-alias-border-l1,#3f3d38);box-shadow:var(--dsw-elevation-prominent,0 10px 28px rgba(0,0,0,.45))}
.dshp-rewind-item{display:flex;flex-direction:column;gap:2px;width:100%;padding:8px 10px;border:0;border-radius:8px;background:transparent;color:inherit;text-align:left;cursor:pointer;font:12px/1.3 var(--ds-font-sans,system-ui,sans-serif)}
.dshp-rewind-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}
.dshp-rewind-item b{font-size:13px;font-weight:600;color:var(--dsw-alias-label-primary,inherit)}
.dshp-rewind-item span{color:var(--dsw-alias-label-tertiary,#9a958c);font-size:11px}
body[data-ds-dark-theme] .dshp-rewind-item span{color:var(--dsw-alias-label-tertiary,#a8a39a)}
`;
function rewindMenuNode(t, menuPos, menuRef, runRewind) {
  return h(
    "div",
    {
      className: "dshp-rewind-menu",
      role: "menu",
      ref: menuRef,
      style: menuPos ? { left: menuPos.left + "px", top: menuPos.top + "px" } : { left: "8px", bottom: "48px", transform: "none" }
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
      h("b", null, rewindText(t, "rewind.once", "\u56DE\u9000\u4E00\u6B21")),
      h(
        "span",
        null,
        rewindText(
          t,
          "rewind.once.hint",
          "\u628A\u8FD9\u4E00\u8F6E\u53D1\u51FA\u53BB\u7684\u90A3\u53E5\u653E\u56DE\u8F93\u5165\u6846\uFF0C\u5E76\u6E05\u6389\u8FD9\u4E00\u8F6E"
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
      h("b", null, rewindText(t, "rewind.round", "\u56DE\u9000\u4E0A\u4E00\u8F6E")),
      h(
        "span",
        null,
        rewindText(
          t,
          "rewind.round.hint",
          "\u628A\u8FD9\u4E00\u8F6E\u53D1\u51FA\u53BB\u7684\u90A3\u53E5\u653E\u56DE\u8F93\u5165\u6846\uFF1B\u5B50\u4EE3\u7406\u4E5F\u53EA\u64A4\u8FD9\u4E00\u8F6E"
        )
      )
    )
  );
}
var RewindFallback = class extends Component {
  constructor(p) {
    super(p);
    this.state = { menu: false, busy: false, notice: "", menuPos: null };
    this.wrap = null;
    this.menuEl = null;
    this.onDoc = (event) => {
      if (this.wrap && this.wrap.contains(event.target)) return;
      if (this.menuEl && this.menuEl.contains(event.target)) return;
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
        throw new Error(data && data.error || "\u6CA1\u6709\u6E05\u6389\u4E4B\u524D\u53D1\u9001\u7684\u5185\u5BB9");
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
        notice: "\u56DE\u9000\u5931\u8D25: " + String(e && e.message || e)
      });
    });
  }
  openMenu() {
    const rect = this.wrap && this.wrap.getBoundingClientRect ? this.wrap.getBoundingClientRect() : null;
    this.setState({
      menu: !this.state.menu,
      notice: "",
      menuPos: rect ? {
        left: Math.max(8, rect.right - 228),
        top: Math.max(8, rect.top - 8)
      } : null
    });
  }
  render() {
    const sessionId = this.props.sessionId || currentSessionId(hostSessions());
    const t = this.props.t || null;
    const label = this.state.busy ? "\u56DE\u9000\u4E2D\u2026" : this.state.notice ? this.state.notice.slice(0, 18) : "\u56DE\u9000";
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
      this.state.menu ? rewindMenuNode(
        t,
        this.state.menuPos,
        (node) => {
          this.menuEl = node;
        },
        (mode) => this.run(mode)
      ) : null
    );
  }
};
var rewindVisible = true;
var rewindProbe = null;
function loadRewindVisibility() {
  if (!rewindProbe) {
    rewindProbe = apiJson("/dsh-purge/boost").then((r) => {
      rewindVisible = r && r.rewind !== false;
      return rewindVisible;
    }).catch(() => true);
  }
  return rewindProbe;
}
var RewindSafe = class extends Component {
  constructor(p) {
    super(p);
    this.state = { failed: false };
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
    loadRewindVisibility().then((on) => {
      if (!on && !this.unmounted) this.forceUpdate();
    });
  }
  componentWillUnmount() {
    this.unmounted = true;
  }
  render() {
    if (!rewindVisible) return null;
    if (this.state.failed) return h(RewindFallback, this.props);
    return h(RewindButton, this.props);
  }
};
function RewindButton(props) {
  const fallbackT = useT();
  const t = props.t || fallbackT;
  const sessions = hostSessions();
  const inputActions = props.inputActions;
  const sessionId = props.sessionId || currentSessionId(sessions);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [menu, setMenu] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  useEffect(() => {
    if (!sessionId) return;
    const armed = takeArmedFill(sessionId);
    if (armed) {
      scheduleComposerFill(sessionId, armed, inputActions);
      return;
    }
    scheduleEchoClear(sessionId, inputActions);
  }, [sessionId, inputActions]);
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
        throw new Error(data && data.error || "\u6CA1\u6709\u6E05\u6389\u4E4B\u524D\u53D1\u9001\u7684\u5185\u5BB9");
      }
      noteRewindAt(data.at);
      const text = isPluginDraft(data.text) ? "" : data.text || "";
      armComposerFill(data.sessionId, text);
      await openRewoundSession(sessions, data.sessionId);
      scheduleComposerFill(data.sessionId, text);
    } catch (e) {
      const message = rewindText(t, "rewind.fail", "\u56DE\u9000\u5931\u8D25: {error}").replace(
        "{error}",
        String(e && e.message || e)
      );
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
    const rect = wrapRef.current?.getBoundingClientRect?.();
    if (rect) {
      setMenuPos({
        left: Math.max(8, rect.right - 228),
        top: Math.max(8, rect.top - 8)
      });
    }
    setNotice("");
    setMenu(true);
  };
  const failLabel = notice ? notice.length > 18 ? notice.slice(0, 18) + "\u2026" : notice : "";
  const label = busy ? rewindText(t, "rewind.busy", "\u56DE\u9000\u4E2D\u2026") : failLabel || rewindText(t, "rewind.label", "\u56DE\u9000");
  const title = notice || rewindText(t, "rewind.aria", "\u56DE\u9000");
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
        "aria-label": rewindText(t, "rewind.aria", "\u56DE\u9000"),
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
    menu ? rewindMenuNode(t, menuPos, menuRef, runRewind) : null
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
var welcome_default = "/* The first-run dialog is rendered before any settings page. It must own its\n   styles and cannot depend on the optional drill vendor stylesheet. */\n.dshpp-welcome-mask {\n  position: fixed;\n  inset: 0;\n  z-index: 2147483000;\n  display: grid;\n  place-items: center;\n  padding: 24px;\n  overflow: auto;\n  box-sizing: border-box;\n  background: rgb(0 0 0 / 35%);\n  color: var(--dsw-alias-label-primary, #171717);\n  font-family: inherit;\n  font-size: 14px;\n  line-height: 1.6;\n  text-align: left;\n}\n.dshpp-welcome-card {\n  width: min(600px, 100%);\n  max-height: calc(100dvh - 48px);\n  overflow: auto;\n  box-sizing: border-box;\n  padding: 24px;\n  border: 1px solid var(--dsw-alias-border-l1, #ddd);\n  border-radius: 16px;\n  background: var(--dsw-alias-bg-layer-1, #fff);\n  box-shadow: 0 16px 64px rgb(0 0 0 / 18%);\n}\n.dshpp-welcome-card h2 {\n  margin: 0 0 6px;\n  font: inherit;\n  font-size: 20px;\n  font-weight: 600;\n}\n.dshpp-welcome-card h3 {\n  margin: 16px 0 6px;\n  font: inherit;\n  font-weight: 600;\n}\n.dshpp-welcome-lead {\n  color: var(--dsw-alias-label-secondary, #666);\n}\n.dshpp-welcome-warn {\n  margin: 16px 0;\n  padding: 12px;\n  border-radius: 8px;\n  background: var(--dsw-alias-bg-layer-2, #f5f5f5);\n}\n.dshpp-welcome-legal p {\n  margin: 10px 0;\n}\n.dshpp-welcome-legal a {\n  color: var(--dsw-alias-label-brand, #436ee8);\n  overflow-wrap: anywhere;\n}\n.dshpp-welcome-check {\n  display: flex;\n  align-items: flex-start;\n  gap: 10px;\n  margin-top: 20px;\n  cursor: pointer;\n}\n.dshpp-welcome-check input {\n  flex: 0 0 auto;\n  width: 16px;\n  height: 16px;\n  margin: 4px 0 0;\n  accent-color: var(--dsw-alias-label-brand, #436ee8);\n}\n.dshpp-welcome-ops {\n  display: flex;\n  justify-content: flex-end;\n  margin-top: 20px;\n}\n.dshpp-welcome-ops button {\n  min-height: 36px;\n  padding: 8px 16px;\n  border: 0;\n  border-radius: 8px;\n  background: var(--dsw-alias-label-primary, #171717);\n  color: var(--dsw-alias-bg-base, #fff);\n  font: inherit;\n  cursor: pointer;\n}\n.dshpp-welcome-ops button:disabled {\n  opacity: 0.4;\n  cursor: default;\n}\n.dshpp-welcome-ops button:focus-visible,\n.dshpp-welcome-check input:focus-visible {\n  outline: 2px solid var(--dsw-alias-label-brand, #436ee8);\n  outline-offset: 3px;\n}\n@media (max-height: 600px) {\n  .dshpp-welcome-mask {\n    padding: 12px;\n  }\n  .dshpp-welcome-card {\n    max-height: calc(100dvh - 24px);\n    padding: 18px;\n  }\n}\n";

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
  const label = text.replace(/不是红队/g, "").replace(/非红队/g, "");
  if (/红队/.test(label)) return true;
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
      if (/红队模式/.test(text) || /^RedTeam\b/i.test(text)) return true;
    }
  } catch {
  }
  try {
    const labels = document.querySelectorAll(
      "[class*='label' i][class*='preset' i], [class*='presetLabel' i], [title*='\u7EA2\u961F'], [title*='RedTeam']"
    );
    for (const el of labels) {
      const text = String(el.textContent || "").trim();
      if (/红队模式/.test(text) || /^RedTeam\b/i.test(text)) return true;
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
  if (/停止|Stop/i.test(label) && !/发送|Send/i.test(label)) return false;
  if (/发送|Submit|Send(?!\s*feedback)/i.test(label)) return true;
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
    "div",
    {
      className: "dshp-auth-mask dshp-env-gate",
      role: "dialog",
      "aria-modal": "true"
    },
    h(
      "div",
      { className: "dshp-auth-modal", style: { width: "min(480px,100%)" } },
      h("h2", null, t("envGate.title")),
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
      confirmSkip ? h("div", { className: "dshp-auth-warn" }, t("envGate.skipConfirm")) : null,
      h(
        "div",
        { className: "dshp-auth-ops" },
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
    )
  );
}

// src/entry.js
var name = false ? "dsh-purge-community" : "dsh-purge-panel";
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
  return h(PurgeGlyph, { size });
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
      repo: false ? "https://github.com/kingcharleslzy-ai/dsh-purge" : void 0
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
  ctx.effect(startGrantSync, "panel grant sync");
  ctx.inject(
    ["sessions", "uiWorkspace", "conversation"],
    (host3) => installRewindUi(host3)
  );
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), "panel locale");
  const t = ctx.locale.bind(NS);
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
        key: false ? "dsh-purge-community" : "dsh-purge-panel",
        inject: () => ({ t })
      },
      SettingsRoot
    )
  );
}

return module.exports;
}});})();
