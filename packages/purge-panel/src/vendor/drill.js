import { apiUrl } from "../api/client.js";
import React from "react";
// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.

export const __dshPurgeDrill = (() => {
  var module = { exports: {} };
  var exports = module.exports;

  var module = { exports: {} };
  var exports = module.exports;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

  const h = React.createElement;

  /*
   * The floating console uses fixed positioning with left/top/width/height.
   * Preserve host frame padding and input width; use .rt-embedded inside Purge.
   */
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
.rt-shot-zoom-cap{color:#e5e7eb;font-size:12px;text-align:center;max-width:90vw;overflow-wrap:anywhere}`; /* Bridge and state. */
  /** The URL hash identifies a full-view window sharing the same UI. */
  const isFullWindow = () => {
    try {
      return String(window.location.hash || "") === "#redteam-full";
    } catch {
      return false;
    }
  };

  const api = (req) =>
    fetch(apiUrl("/redteam/api"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
    }).then(async (res) => {
      const text = await res.text().catch(() => "");
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        return {
          ok: false,
          error: res.status + " non-json: " + String(text).slice(0, 120),
        };
      }
      if (!res.ok) {
        return Object.assign({}, data || {}, {
          ok: false,
          error:
            (data && (data.error || data.message)) ||
            res.status + " " + res.statusText,
        });
      }
      return data;
    });

  let ui = { open: true, tab: "assets" };
  const subs = new Set();
  const setUI = (patch) => {
    ui = Object.assign({}, ui, patch);
    const snap = Object.assign({}, ui);
    for (const f of Array.from(subs)) {
      try {
        f(snap);
      } catch {
        /* ignore subscriber errors */
      }
    }
  };
  /* Preserve the export; sizing affects only panel elements, not the host frame. */
  let dockWidthTag = null;
  const setDockWidth = () => {};
  const useUI = () => {
    const [st, setSt] = React.useState(() => Object.assign({}, ui));
    React.useEffect(() => {
      const f = (snap) => setSt(Object.assign({}, snap || ui));
      subs.add(f);
      setSt(Object.assign({}, ui));
      return () => {
        subs.delete(f);
      };
    }, []);
    return st;
  };

  /* Knowledge-base categories match POC_CATEGORIES in core.js. */
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
    other: "Other",
  };
  const POC_CAT_ORDER = Object.keys(POC_CAT_NAME);
  /* Role labels identify discoverers in reports and the knowledge base. */
  const ROLE_LABEL = {
    plan: "Main session (coordination)",
    recon: "Reconnaissance",
    assess: "Asset assessment",
    "vuln-scan": "Vulnerability discovery",
    exploit: "Exploitation",
    internal: "Internal penetration testing",
  };

  const fmt = (s) => (s ? String(s).replace("T", " ").slice(0, 16) : "—");
  const shotCache = new Map();
  const shotLoading = new Map();
  const shotSrc = (eng, id) => shotCache.get(eng + ":" + id) || null;
  const loadShot = (eng, id) => {
    const key = eng + ":" + id;
    if (shotCache.has(key) || shotLoading.has(key)) return;
    const p = api({ op: "shotData", engagement: eng, id: id })
      .then((r) => {
        shotCache.set(
          key,
          r && r.base64
            ? "data:" + (r.mime || "image/png") + ";base64," + r.base64
            : "",
        );
        shotLoading.delete(key);
        const snap = Object.assign({}, ui);
        for (const f of Array.from(subs)) {
          try {
            f(snap);
          } catch {
            /* ignore subscriber errors */
          }
        }
      })
      .catch(() => {
        shotLoading.delete(key);
      });
    shotLoading.set(key, p);
  };
  const SHOT_KIND = {
    screenshot: "Captured screenshot",
    card: "Evidence excerpt generated from records",
  };
  const ShotImage = ({ eng, shot, height }) => {
    const [zoom, setZoom] = React.useState(false);
    const src = shotSrc(eng, shot.id);
    if (src === null) {
      loadShot(eng, shot.id);
    }
    const card = shot.kind === "card";
    return h(
      "div",
      { className: "rt-shot" },
      src === null
        ? h(
            "div",
            {
              className: "rt-shot-thumb rt-shot-loading",
              style: { height: (height || 96) + "px" },
            },
            "Loading…",
          )
        : h("img", {
            className: "rt-shot-thumb",
            src: src,
            alt: shot.label || "Evidence " + shot.id,
            style: { height: (height || 96) + "px", cursor: "zoom-in" },
            onClick: () => setZoom(true),
          }),
      h(
        "div",
        { className: "rt-shot-cap" },
        h(
          "span",
          {
            className: "rt-tag " + (card ? "rt-tag-warn" : "rt-tag-live"),
            title: card
              ? "Evidence excerpt generated from that day's records, not a captured screenshot; the report also labels this distinction"
              : "Captured screenshot",
          },
          SHOT_KIND[shot.kind] || shot.kind || "Evidence",
        ),
        h(
          "span",
          { className: "rt-shot-label", title: shot.label || shot.note || "" },
          shot.label || shot.target || "#" + shot.id,
        ),
      ),
      zoom
        ? h(
            "div",
            { className: "rt-shot-zoom", onClick: () => setZoom(false) },
            h("img", { src: src, alt: shot.label || "" }),
            h(
              "div",
              { className: "rt-shot-zoom-cap" },
              (shot.label || shot.target || "") +
                (card
                  ? " · Generated from that day's records (not a captured screenshot)"
                  : "") +
                (shot.captured_at ? "　·　" + fmt(shot.captured_at) : "") +
                " · Click anywhere to close",
            ),
          )
        : null,
    );
  };
  const ShotStrip = ({ eng, shots, total, title }) => {
    const list = shots || [];
    if (list.length === 0) return null;
    return h(
      "div",
      { className: "rt-shots" },
      h(
        "div",
        { className: "rt-shots-head" },
        h("b", null, title || "Evidence screenshots"),
        h(
          "span",
          { className: "rt-shots-n" },
          "Showing " +
            list.length +
            " images" +
            (total && total > list.length
              ? " (representative images from " +
                total +
                " for this scoring item)"
              : ""),
        ),
      ),
      h(
        "div",
        { className: "rt-shot-row" },
        list.map((sh) =>
          h(ShotImage, { key: "sh" + sh.id, eng: eng, shot: sh }),
        ),
      ),
    );
  };
  /** Compact discovery timestamps; tooltips retain the full value. */
  const fmtShort = (s) => {
    const t = String(s || "").replace("T", " ");
    return t.length >= 16 ? t.slice(5, 16) : t || "—";
  };
  const provLabel = (p) =>
    p === "passive" ? "Passive" : p === "active" ? "Active" : "Unknown";

  /**
   * Add keyboard access to clickable elements that are not native buttons.
   * Table rows, tabs, summary bars, and subnet entries previously had sixteen
   * inconsistent implementations, some missing roles or Space-key support.
   * Spread clickable(fn, { label }) into props for consistent semantics.
   * Do not apply this to native buttons, which already provide these semantics.
   * @param onActivate - Callback for mouse clicks, Enter, and Space.
   * @param options - Optional label and expanded state for ARIA attributes.
   * @returns Props containing role, tabIndex, handlers, and ARIA attributes.
   */
  const clickable = (onActivate, options = {}) => {
    const props = {
      role: "button",
      tabIndex: 0,
      onClick: onActivate,
      onKeyDown: (e) => {
        /* Enter and Space activate buttons; prevent Space from scrolling. */
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onActivate(e);
        }
      },
    };
    if (options.label !== undefined)
      props["aria-label"] = String(options.label);
    if (options.expanded !== undefined)
      props["aria-expanded"] = options.expanded ? "true" : "false";
    return props;
  };

  /**
   * Copy text and report actual success.
   * Clipboard promises can reject in insecure contexts, without focus, or when
   * permission is denied. Await completion before reporting success, falling
   * back to execCommand for older browsers and insecure contexts.
   * @param text - Text to copy.
   * @returns Promise<boolean>
   */
  const copyText = async (text) => {
    const value = text === undefined || text === null ? "" : String(text);
    if (value === "") return false;
    try {
      if (
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch (e) {
      /* Try the fallback below. */
    }
    /* A temporary textarea supports legacy copying in insecure contexts. */
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

  /**
   * Copy with consistent feedback reflecting actual success or failure.
   * @param text - Text to copy.
   * @param label - Name included in the success message.
   * @param onResult - Optional (ok, message) callback; returns Promise<boolean>.
   */
  const copyWithFeedback = async (text, label, onResult) => {
    const okFlag = await copyText(text);
    const message = okFlag
      ? "Copied: " + label
      : "Copy failed (clipboard permission unavailable). Select and copy the text manually.";
    if (typeof onResult === "function") onResult(okFlag, message);
    return okFlag;
  };

  function ProvTag(props) {
    if (!props.p) return h("span", { className: "rt-tag" }, "Unknown");
    return h(
      "span",
      { className: "rt-tag rt-tag-" + props.p },
      provLabel(props.p),
    );
  }

  const TEST_LABEL = {
    untested: "Untested",
    testing: "Testing",
    tested: "Tested",
    blocked: "Blocked",
    abandoned: "Abandoned",
    no_surface: "No attack surface",
  };
  const PRI_LABEL = { high: "High", medium: "Medium", low: "Low" };

  /** Asset exploitability badge. */
  function PriTag(props) {
    if (!props.p) return h("span", { className: "rt-tag" }, "Unassessed");
    return h(
      "span",
      { className: "rt-pri rt-pri-" + props.p, title: props.title || "" },
      PRI_LABEL[props.p] || props.p,
    );
  }

  /** Asset test status badge. */
  function TestTag(props) {
    const st = props.s || "untested";
    return h(
      "span",
      { className: "rt-test rt-test-" + st },
      TEST_LABEL[st] || st,
    );
  }

  /* ---------------------------------------------------------- Asset mapping */
  function AssetsTab(props) {
    const eng = props.engagement;
    const snapshot = props.snapshot;
    const refreshKey = props.refreshKey || 0;
    const onRefresh = props.onRefresh;
    const [view, setView] = React.useState("list");
    const [cidr, setCidr] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [qApplied, setQApplied] = React.useState("");
    const [service, setService] = React.useState("");
    const [port, setPort] = React.useState("");
    const [prov, setProv] = React.useState("");
    const [testStatus, setTestStatus] = React.useState("");
    const [priority, setPriority] = React.useState("");
    const [scope, setScope] = React.useState("");
    const [assetState, setAssetState] = React.useState("");
    const [sort, setSort] = React.useState("priority");
    const [showAll, setShowAll] = React.useState(null);
    const [state, setState] = React.useState({
      loading: false,
      error: null,
      total: 0,
      items: [],
    });
    const [domains, setDomains] = React.useState(null);
    const [web, setWeb] = React.useState(null);
    const [openId, setOpenId] = React.useState(null);
    const [detail, setDetail] = React.useState(null);
    /* Persist external/internal subnet collapse state per engagement. */
    const sideCollapse = useCollapse("assets-side:" + eng);
    const seq = React.useRef(0);
    const onData = props.onData;

    React.useEffect(() => {
      if (!eng) return;
      const my = ++seq.current;
      setState((s) => Object.assign({}, s, { loading: true, error: null }));
      api({
        op: "assets",
        engagement: eng,
        cidr: cidr || undefined,
        q: qApplied || undefined,
        service: service || undefined,
        port: port || undefined,
        provenance: prov || undefined,
        test_status: testStatus || undefined,
        priority: priority || undefined,
        scope: scope || undefined,
        state: assetState || undefined,
        sort: sort,
        limit: 400,
      }).then(
        (r) => {
          if (my !== seq.current) return;
          if (!r || r.ok === false) {
            setState({
              loading: false,
              error: (r && r.error) || "Query failed",
              total: 0,
              items: [],
            });
            return;
          }
          setState({
            loading: false,
            error: null,
            total: r.total,
            items: r.items || [],
          });
          /* Refresh the snapshot so newly discovered subnets update the sidebar. */
          if (onData) onData();
        },
        (e) => {
          if (my === seq.current)
            setState({
              loading: false,
              error: String((e && e.message) || e),
              total: 0,
              items: [],
            });
        },
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
      refreshKey,
    ]);

    React.useEffect(() => {
      if (!eng || view !== "domain") return;
      setDomains(null);
      api({ op: "domains", engagement: eng, cidr: cidr || undefined }).then(
        (r) => setDomains((r && r.items) || []),
        () => setDomains([]),
      );
    }, [eng, view, cidr, refreshKey]);

    React.useEffect(() => {
      if (!eng || view !== "web") return;
      setWeb(null);
      api({ op: "web", engagement: eng, cidr: cidr || undefined }).then(
        (r) => setWeb((r && r.items) || []),
        () => setWeb([]),
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
      api({ op: "asset", engagement: eng, id: id }).then(
        (r) => {
          if (r && r.ok && r.asset) setDetail(r.asset);
        },
        () => {},
      );
    };

    const segs = (snapshot && snapshot.segments) || [];

    const sideChildren = [];
    sideChildren.push(
      h(
        "div",
        Object.assign(
          {
            key: "all",
            className:
              "rt-seg" + (cidr === null && view !== "testing" ? " on" : ""),
          },
          clickable(
            () => {
              setView("list");
              setCidr(null);
            },
            {
              label: "All subnets",
              expanded: cidr === null && view !== "testing",
            },
          ),
        ),
        h("div", { className: "rt-seg-cidr" }, "All subnets"),
        h("div", { className: "rt-seg-meta" }, segs.length + " subnets"),
      ),
    );
    sideChildren.push(
      h(
        "div",
        Object.assign(
          {
            key: "testing",
            className: "rt-seg" + (view === "testing" ? " on" : ""),
            title: "Running scans, probes, and progress (refreshes every 5 seconds)",
          },
          clickable(
            () => {
              setView("testing");
              setCidr(null);
            },
            { label: "Current tests", expanded: view === "testing" },
          ),
        ),
        h(
          "div",
          {
            className: "rt-seg-cidr",
            style: { display: "flex", alignItems: "baseline", gap: 5 },
          },
          h(
            "span",
            {
              className: "rt-scope rt-scope-testing",
              title: "Current tests (neither internal nor external)",
            },
            "Test",
          ),
          h("span", { style: { flex: 1 } }, "Current tests"),
        ),
        h("div", { className: "rt-seg-meta" }, "Running scans and probes"),
      ),
    );
    /* Show externally reachable subnets before internal subnets. */
    const segBlock = (title, list, kind) => {
      /* Groups default to expanded and retain state per engagement. */
      const open = sideCollapse.isOpen("scope:" + kind, true);
      const toggle = sideCollapse.toggle("scope:" + kind, true);
      const out = [
        h(
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
            },
          },
          h("span", { className: "rt-sec-caret" }, open ? "▾" : "▸"),
          h(
            "span",
            { className: "rt-scope rt-scope-" + kind },
            kind === "internal" ? "Internal" : "External",
          ),
          h("span", null, title + " · " + list.length + " subnets"),
          h("span", { className: "rt-spacer" }),
          h(
            "span",
            { style: { fontWeight: 400 } },
            list.reduce((n, x) => n + (x.assets || 0), 0) + " assets",
          ),
        ),
      ];
      if (!open) return out;
      for (const s of list) {
        /* Rows show subnet and asset counts; ownership and liveness use tooltips. */
        out.push(
          h(
            "div",
            Object.assign(
              {
                key: s.cidr,
                className: "rt-seg" + (cidr === s.cidr ? " on" : ""),
                title:
                  (s.org || "Unknown owner") +
                  " · Live " +
                  (s.live || 0) +
                  "/" +
                  (s.assets || 0) +
                  " hosts",
              },
              clickable(
                () => {
                  setView("list");
                  setCidr(s.cidr);
                },
                {
                  label: "Filter subnet " + s.cidr,
                  expanded: cidr === s.cidr && view !== "testing",
                },
              ),
            ),
            h(
              "div",
              {
                className: "rt-seg-cidr",
                style: { display: "flex", alignItems: "baseline", gap: 5 },
              },
              h(
                "span",
                { className: "rt-scope rt-scope-" + kind },
                kind === "internal" ? "Int" : "Ext",
              ),
              h("span", { style: { flex: 1 } }, s.cidr),
              h(
                "span",
                {
                  className: "rt-seg-meta",
                  style: { margin: 0, whiteSpace: "nowrap" },
                },
                s.assets + " hosts",
              ),
            ),
          ),
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
    const side = h("div", { className: "rt-side" }, sideChildren);

    const toolbar = h(
      "div",
      { className: "rt-toolbar" },
      h("input", {
        className: "rt-input",
        style: { flex: "1 1 150px" },
        placeholder: "Search IP / domain / fingerprint (Enter)",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setQApplied(q);
        },
      }),
      h(
        "button",
        { className: "rt-btn", onClick: () => setQApplied(q) },
        "Search",
      ),
      h("input", {
        className: "rt-input",
        style: { width: "78px" },
        placeholder: "Service",
        value: service,
        onChange: (e) => setService(e.target.value),
      }),
      h("input", {
        className: "rt-input",
        style: { width: "60px" },
        placeholder: "Port",
        value: port,
        onChange: (e) => setPort(e.target.value),
      }),
      h(
        "select",
        {
          className: "rt-input",
          value: scope,
          onChange: (e) => setScope(e.target.value),
        },
        h("option", { value: "" }, "All network scopes"),
        h("option", { value: "external" }, "External assets only"),
        h("option", { value: "internal" }, "Internal assets only"),
      ),
      h(
        "select",
        {
          className: "rt-input",
          value: prov,
          onChange: (e) => setProv(e.target.value),
          title: "Filter by port discovery source (shown in details)",
        },
        h("option", { value: "" }, "All sources"),
        h("option", { value: "passive" }, "Passive only"),
        h("option", { value: "active" }, "Active only"),
      ),
      h(
        "select",
        {
          className: "rt-input",
          value: priority,
          onChange: (e) => setPriority(e.target.value),
        },
        h("option", { value: "" }, "All exploitability levels"),
        h("option", { value: "high" }, "Easy (high)"),
        h("option", { value: "medium" }, "Moderate (medium)"),
        h("option", { value: "low" }, "Difficult (low)"),
      ),
      h(
        "select",
        {
          className: "rt-input",
          value: testStatus,
          onChange: (e) => setTestStatus(e.target.value),
        },
        h("option", { value: "" }, "All test states"),
        h("option", { value: "untested" }, "Untested"),
        h("option", { value: "testing" }, "Testing"),
        h("option", { value: "tested" }, "Tested"),
        h("option", { value: "blocked" }, "Blocked"),
        h("option", { value: "abandoned" }, "Abandoned"),
        h("option", { value: "no_surface" }, "No attack surface"),
      ),
      h("div", { className: "rt-spacer" }),
      h(
        "button",
        {
          className: "rt-btn",
          title: "Reload the snapshot and current view",
          onClick: () => {
            if (onRefresh) onRefresh();
          },
        },
        "Refresh",
      ),
      h(
        "button",
        {
          className: "rt-btn" + (view === "list" ? " rt-btn-primary" : ""),
          onClick: () => setView("list"),
        },
        "List",
      ),
      h(
        "button",
        {
          className: "rt-btn" + (view === "timeline" ? " rt-btn-primary" : ""),
          title: "View assets by discovery time and daily totals",
          onClick: () => setView("timeline"),
        },
        "Discovery time",
      ),
      h(
        "button",
        {
          className: "rt-btn" + (view === "domain" ? " rt-btn-primary" : ""),
          onClick: () => setView("domain"),
        },
        "Domains",
      ),
      h(
        "button",
        {
          className: "rt-btn" + (view === "web" ? " rt-btn-primary" : ""),
          onClick: () => setView("web"),
        },
        "Web",
      ),
    );

    /* Click summary counts to filter the inventory. */
    const tests = (snapshot && snapshot.tests) || {};
    const snapStats = (snapshot && snapshot.stats) || {};
    const noFilter =
      !testStatus && !priority && !scope && !prov && !assetState && !cidr;
    const conclItem = (key, label, value, active, onClick) =>
      h(
        "span",
        Object.assign(
          {
            key: key,
            className: "rt-concl-i" + (active ? " on" : ""),
            title: "Click to filter; click again to clear",
          },
          clickable(onClick, {
            label: "Filter by " + label + " (" + (value || 0) + ")",
            expanded: active,
          }),
        ),
        h("b", null, String(value || 0)),
        h("span", null, label),
      );
    const toggleTest = (v) => {
      setTestStatus((cur) => (cur === v ? "" : v));
      setAssetState("");
    };
    const conclusion = h(
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
          setAssetState((v) => (v === "live" ? "" : "live"));
          setTestStatus("");
        },
      ),
      conclItem(
        "untested",
        "Untested",
        tests.untested,
        testStatus === "untested",
        () => toggleTest("untested"),
      ),
      conclItem(
        "testing",
        "Testing",
        tests.testing,
        testStatus === "testing",
        () => toggleTest("testing"),
      ),
      conclItem("tested", "Tested", tests.tested, testStatus === "tested", () =>
        toggleTest("tested"),
      ),
      conclItem(
        "giveup",
        "Abandoned / blocked",
        (tests.abandoned || 0) + (tests.blocked || 0),
        testStatus === "abandoned,blocked",
        () => toggleTest("abandoned,blocked"),
      ),
      h("div", { className: "rt-spacer" }),
      h(
        "select",
        {
          className: "rt-input",
          value: sort,
          onChange: (e) => setSort(e.target.value),
          title: "List sort order",
        },
        h("option", { value: "priority" }, "Sort: exploitability"),
        h("option", { value: "todo" }, "Sort: untested first"),
        h("option", { value: "discovered" }, "Sort: newest discoveries"),
        h("option", { value: "ports" }, "Sort: most ports"),
        h("option", { value: "ip" }, "Sort: IP address"),
      ),
    );

    const head = h(
      "div",
      { className: "rt-row head" },
      h("span", null, "IP"),
      h("span", null, "Priority"),
      h("span", null, "Test status"),
      h("span", null, "Open ports / services"),
      h("span", null, "Fingerprints"),
    );

    const rowNodes = [];
    for (const it of state.items) {
      const openPorts = it.ports.filter((p) => p.state === "open");
      const portText =
        openPorts
          .map((p) => p.port + (p.service ? "/" + p.service : ""))
          .join(", ") || "—";
      const fpText =
        it.fingerprints
          .map((f) =>
            [f.vendor, f.product, f.version].filter(Boolean).join(" "),
          )
          .join(" / ") || "—";
      /* Show three ports plus a remainder count; discovery sources use details. */
      const shownPorts = openPorts
        .slice(0, 3)
        .map((p) => p.port + (p.service ? "/" + p.service : ""))
        .join(", ");
      const morePorts =
        openPorts.length > 3 ? " +" + (openPorts.length - 3) : "";
      rowNodes.push(
        h(
          "div",
          Object.assign(
            {
              key: "r" + it.id,
              className: "rt-row",
            },
            clickable(() => toggleRow(it.id), {
              label: "Expand asset " + it.ip,
              expanded: openId === it.id,
            }),
          ),
          h(
            "span",
            {
              className: "rt-mono",
              style: {
                display: "flex",
                alignItems: "baseline",
                gap: 4,
                flexWrap: "wrap",
              },
            },
            h(
              "span",
              {
                className:
                  "rt-scope rt-scope-" +
                  (it.scope === "internal" ? "internal" : "external"),
              },
              it.scope === "internal" ? "Int" : "Ext",
            ),
            h("span", {
              title: it.state === "live" ? "Live" : String(it.state),
              style: {
                width: 7,
                height: 7,
                borderRadius: "50%",
                flex: "none",
                marginTop: 4,
                background: it.state === "live" ? "#10b981" : "#94a3b8",
              },
            }),
            h(
              "span",
              { style: { overflow: "hidden", textOverflow: "ellipsis" } },
              it.ip,
            ),
            /* Place discovery time below the IP to preserve existing columns. */
            h(
              "span",
              {
                style: {
                  fontSize: 10.5,
                  color: "var(--dsw-alias-label-secondary)",
                  whiteSpace: "nowrap",
                },
                title:
                  "Discovered: " +
                  (it.discovered_at ? fmt(it.discovered_at) : "Not recorded") +
                  (it.last_seen ? "\nLast collected: " + fmt(it.last_seen) : ""),
              },
              it.discovered_at ? fmtShort(it.discovered_at) : "Discovery time unknown",
            ),
          ),
          h(
            "span",
            null,
            h(PriTag, { p: it.priority, title: it.potential || "" }),
          ),
          h(
            "span",
            null,
            h(TestTag, { s: it.test_status }),
            it.blocked_count
              ? h(
                  "span",
                  {
                    className: "rt-tag",
                    style: {
                      color: "#ef4444",
                      borderColor: "#ef444455",
                      marginLeft: 4,
                    },
                  },
                  "Blocked " + it.blocked_count,
                )
              : null,
          ),
          h("span", { title: portText }, (shownPorts || "—") + morePorts),
          h(
            "span",
            { title: fpText },
            fpText.length > 30 ? fpText.slice(0, 30) + "…" : fpText,
          ),
        ),
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
            h(
              "div",
              { key: "p" + p.port, className: "rt-kv" },
              h("b", { className: "rt-mono" }, p.port + "/" + p.proto),
              h(
                "span",
                null,
                [p.service, p.product, p.version].filter(Boolean).join(" ") ||
                  "Unknown service",
              ),
              p.url
                ? h(
                    "a",
                    {
                      className: "rt-link",
                      href: p.url,
                      target: "_blank",
                      rel: "noreferrer",
                      title: p.url,
                    },
                    p.title ? p.title : p.url,
                  )
                : null,
              h(ProvTag, { p: p.provenance }),
            ),
          );
        }
        for (const f of d.fingerprints || []) {
          fpRows.push(
            h(
              "div",
              {
                key:
                  "f" +
                  (f.product || "") +
                  (f.version || "") +
                  (f.evidence || ""),
                className: "rt-kv",
              },
              h("b", null, f.category || "—"),
              h(
                "span",
                null,
                [f.vendor, f.product, f.version].filter(Boolean).join(" ") +
                  (f.evidence ? " (" + f.evidence + ")" : ""),
              ),
              h(ProvTag, { p: f.provenance }),
            ),
          );
        }
        for (const o of (d.observations || []).slice(0, 8)) {
          obsRows.push(
            h(
              "div",
              {
                key:
                  "o" +
                  (o.attr || "") +
                  (o.value || "") +
                  (o.collected_at || ""),
                className: "rt-kv",
              },
              h("b", null, o.attr || "—"),
              h(
                "span",
                null,
                (o.value || "") +
                  " · " +
                  (o.tool || "Unknown tool") +
                  " · " +
                  fmt(o.collected_at),
              ),
              h(ProvTag, { p: o.provenance }),
            ),
          );
        }
      }
      /* Keep three key rows visible; expand provenance, raw records, and notes. */
      const all = showAll === it.id;
      const noteLines =
        d && d.test_notes ? d.test_notes.split("\n").filter(Boolean) : [];
      const inner = d
        ? h(
            "div",
            null,
            /* Three essential rows. */
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Tests"),
              h(
                "span",
                null,
                h(TestTag, { s: d.test_status }),
                d.blocked_count
                  ? h(
                      "span",
                      {
                        className: "rt-tag",
                        style: {
                          marginLeft: 6,
                          color: "#ef4444",
                          borderColor: "#ef444455",
                        },
                      },
                      "Blocked " + d.blocked_count + " times",
                    )
                  : null,
                h(
                  "span",
                  {
                    style: {
                      marginLeft: 8,
                      color: "var(--dsw-alias-label-secondary)",
                    },
                  },
                  (d.test_updated_at ? fmt(d.test_updated_at) : "Never tested") +
                    (d.test_updated_by ? " · " + d.test_updated_by : ""),
                ),
              ),
            ),
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Exploitability"),
              h(
                "span",
                null,
                h(PriTag, { p: d.priority }),
                h(
                  "span",
                  { style: { marginLeft: 8 } },
                  d.potential || "Unassessed",
                ),
                d.assess_reason
                  ? h(
                      "span",
                      {
                        style: {
                          marginLeft: 8,
                          color: "var(--dsw-alias-label-secondary)",
                        },
                      },
                      d.assess_reason,
                    )
                  : null,
              ),
            ),
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Attack surface"),
              h(
                "span",
                null,
                d.test_surface ||
                  (portRows.length ? "Not recorded (open ports below)" : "No open ports"),
                d.scope
                  ? h(
                      "span",
                      {
                        className:
                          "rt-scope rt-scope-" +
                          (d.scope === "internal" ? "internal" : "external"),
                        style: { marginLeft: 8 },
                      },
                      d.scope === "internal" ? "Internal asset" : "External asset",
                    )
                  : null,
              ),
            ),
            h(
              "span",
              Object.assign(
                { className: "rt-more" },
                clickable(() => setShowAll(all ? null : it.id), {
                  label: all ? "Collapse asset details" : "Expand asset details",
                  expanded: all,
                }),
              ),
              all
                ? "Collapse all ▲"
                : "Expand all (ports · fingerprints · provenance · test records) ▼",
            ),
            all
              ? h(
                  "div",
                  null,
                  h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Hostnames"),
                    h(
                      "span",
                      null,
                      (d.names || []).map((n) => n.name).join(", ") || "—",
                    ),
                  ),
                  h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Discovered"),
                    h(
                      "span",
                      {
                        title:
                          "When this asset first entered the inventory; repeated collection updates only Last collected",
                      },
                      fmt(d.discovered_at),
                    ),
                    h(
                      "b",
                      { style: { minWidth: 0, marginLeft: 8 } },
                      "Last collected",
                    ),
                    h("span", null, fmt(d.last_seen)),
                    h(
                      "b",
                      { style: { minWidth: 0, marginLeft: 8 } },
                      "First seen in source",
                    ),
                    h("span", null, fmt(d.first_seen)),
                  ),
                  h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "C segment"),
                    h("span", null, d.segment_cidr),
                  ),
                  h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Exploitability"),
                    h(
                      "span",
                      null,
                      (d.priority || "Not assessed") +
                        (d.potential ? " · Expected: " + d.potential : "") +
                        (d.assess_reason ? " · Basis: " + d.assess_reason : "") +
                        (d.assessed_at ? "（" + fmt(d.assessed_at) + "）" : ""),
                    ),
                  ),
                  h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Source"),
                    h(
                      "span",
                      null,
                      "Passive ports " +
                        (d.passive || 0) +
                        " · Active ports " +
                        (d.active || 0),
                    ),
                  ),
                  h(
                    "div",
                    { style: { margin: "6px 0 3px", fontWeight: 600 } },
                    "Open ports / services",
                  ),
                  h("div", null, portRows.length ? portRows : "—"),
                  h(
                    "div",
                    { style: { margin: "6px 0 3px", fontWeight: 600 } },
                    "Fingerprints",
                  ),
                  h("div", null, fpRows.length ? fpRows : "—"),
                  noteLines.length
                    ? h(Clip, {
                        key: "notes",
                        label: "Test notes (" + noteLines.length + " entries)",
                        text: noteLines.join("\n"),
                      })
                    : null,
                  h(
                    "div",
                    { style: { margin: "6px 0 3px", fontWeight: 600 } },
                    "Collection trace (latest 8 entries)",
                  ),
                  h("div", null, obsRows.length ? obsRows : "—"),
                )
              : null,
          )
        : h("div", null, "Loading…");
      rowNodes.push(
        h(
          "div",
          {
            key: "d" + it.id,
            className: "rt-row",
            style: { cursor: "default", gridTemplateColumns: "1fr" },
          },
          h("div", { className: "rt-expand" }, inner),
        ),
      );
    }

    const listPane = h(
      "div",
      { className: "rt-table" },
      head,
      rowNodes,
      !state.loading && !state.items.length
        ? h("div", { className: "rt-empty" }, "No matching assets")
        : null,
    );

    /* Domain view: domain → associated assets */
    const domainPane = h(
      "div",
      { className: "rt-table" },
      domains === null
        ? h("div", { className: "rt-empty" }, "Loading…")
        : domains.length
          ? domains.map((g) =>
              h(
                "div",
                { key: g.domain },
                h(
                  "div",
                  {
                    className: "rt-section",
                    style: { padding: "8px 10px 4px" },
                  },
                  h(
                    "a",
                    {
                      className: "rt-link",
                      href: "http://" + g.domain,
                      target: "_blank",
                      rel: "noreferrer",
                    },
                    g.domain,
                  ),
                  h(
                    "span",
                    { className: "rt-tag", style: { marginLeft: 8 } },
                    g.count + " assets",
                  ),
                ),
                g.assets.map((a) =>
                  h(
                    "div",
                    {
                      key: String(g.domain) + "\u0000" + a.id + "\u0000" + a.ip,
                      className: "rt-row",
                      style: {
                        gridTemplateColumns: "150px 130px 70px 1fr",
                        cursor: "pointer",
                      },
                      onClick: () => {
                        setView("list");
                        setQ("");
                        setQApplied(a.ip);
                      },
                    },
                    h("span", { className: "rt-mono" }, a.ip),
                    h("span", { className: "rt-mono" }, a.segment),
                    h(
                      "span",
                      null,
                      h(
                        "span",
                        {
                          className:
                            "rt-tag rt-tag-" +
                            (a.state === "live" ? "live" : "dead"),
                        },
                        a.state === "live" ? "Live" : a.state,
                      ),
                    ),
                    h(
                      "span",
                      {
                        style: {
                          fontSize: 11,
                          color: "var(--dsw-alias-label-secondary)",
                        },
                      },
                      (a.names || []).join(", "),
                    ),
                  ),
                ),
              ),
            )
          : h(
              "div",
              { className: "rt-empty" },
              cidr
                ? "No domains in this C segment (switch to \"All C segments\" to see all)"
                : "No domain data yet (domains are written during reconnaissance)",
            ),
    );

    /* Web assets: title + clickable URL */
    const webPane = h(
      "div",
      { className: "rt-table" },
      h(
        "div",
        {
          className: "rt-row head",
          style: { gridTemplateColumns: "1.6fr 1.2fr 130px 110px" },
        },
        h("span", null, "URL (clickable)"),
        h("span", null, "Title"),
        h("span", null, "Asset"),
        h("span", null, "Service"),
      ),
      (web || []).map((w) => {
        const url =
          w.url ||
          "http" +
            (w.port === 443 || w.port === 8443 || w.port === 9443 ? "s" : "") +
            "://" +
            w.ip +
            (w.port === 80 || w.port === 443 ? "" : ":" + w.port);
        return h(
          "div",
          {
            key: "w" + w.port_id,
            className: "rt-row",
            style: {
              gridTemplateColumns: "1.6fr 1.2fr 130px 110px",
              cursor: "default",
            },
          },
          h(
            "a",
            {
              className: "rt-link rt-mono",
              href: url,
              target: "_blank",
              rel: "noreferrer",
              title: url,
            },
            url,
          ),
          h("span", { title: w.title || "" }, w.title || "—"),
          h("span", { className: "rt-mono" }, w.ip + " · " + w.segment_cidr),
          h(
            "span",
            { style: { fontSize: 11 } },
            [w.service, w.product, w.version].filter(Boolean).join(" "),
          ),
        );
      }),
      web === null
        ? h("div", { className: "rt-empty" }, "Loading…")
        : !web.length
          ? h(
              "div",
              { className: "rt-empty" },
              cidr
                ? "No web assets in this C segment"
                : "No web assets yet (URLs and titles are written after HTTP probing)",
            )
          : null,
    );

    let pane = listPane;
    if (view === "testing")
      pane = h(TestingTab, { engagement: eng, refreshKey: refreshKey });
    else if (view === "domain") pane = domainPane;
    else if (view === "web") pane = webPane;
    /* The discovery timeline view has its own scroll container; place it directly in the rt-main flex area */
    else if (view === "timeline")
      pane = h(DiscoveryView, { engagement: eng, refreshKey: refreshKey });

    return h(
      "div",
      { className: "rt-split" },
      side,
      h(
        "div",
        { className: "rt-main" },
        view === "testing" ? null : toolbar,
        conclusion,
        state.error ? h("div", { className: "rt-err" }, state.error) : null,
        pane,
      ),
    );
  }

  /* ---------------------------------------------------------- Asset discovery timeline */
  /**
   * Asset discovery timeline: when things were found and how many were collected each day.
   * ⚠️ This component was accidentally removed when the "remove graph view" change was made — the deletion range end marker was too broad
   *    (it was adjacent to the end of the graph canvas), causing the bundle self-check for "client.js has asset \"discovery timeline\" view"
   *    to fail. When restoring it, pin the insertion point to "before the asset mapping comment block" to avoid similar collateral deletions.
   */
  function DiscoveryView(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [day, setDay] = React.useState("");
    React.useEffect(() => {
      if (!eng) return;
      setData(null);
      api({ op: "discoveryTimeline", engagement: eng, limit: 200 }).then(
        (r) => {
          if (!r || r.ok === false) setErr((r && r.error) || "Load failed");
          else {
            setErr(null);
            setData(r);
          }
        },
        (e) => setErr(String((e && e.message) || e)),
      );
    }, [eng, refreshKey]);
    if (err)
      return h(
        "div",
        { className: "rt-pane" },
        h("div", { className: "rt-err" }, err),
      );
    if (!data) return h("div", { className: "rt-empty" }, "Loading…");
    const recent = (data.recent || []).filter(
      (a) => day === "" || String(a.discovered_at || "").slice(0, 10) === day,
    );
    return h(
      "div",
      { className: "rt-pane", style: { flex: 1, minHeight: 0 } },
      h(
        "div",
        { className: "rt-card" },
        h("h4", null, "Asset discovery timeline"),
        h(
          "div",
          {
            style: { fontSize: 12, color: "var(--dsw-alias-label-secondary)" },
          },
          "Total " +
            ((data.span && data.span.total) || 0) +
            " hosts · Earliest " +
            (data.span && data.span.first ? fmt(data.span.first) : "—") +
            " · Latest " +
            (data.span && data.span.last ? fmt(data.span.last) : "—") +
            '(Discovery time = when the asset first entered the inventory; repeated collection only updates "Last collected")',
        ),
      ),
      (data.days || []).length === 0
        ? h("div", { className: "rt-empty" }, "No assets yet.")
        : null,
      h(
        "div",
        { className: "rt-card" },
        h(
          "h4",
          null,
          "Daily statistics",
          day
            ? h(
                "span",
                Object.assign(
                  {
                    className: "rt-tag",
                    style: { marginLeft: 6, cursor: "pointer" },
                  },
                  clickable(() => setDay(""), {
                    label: "Clear daily filter: " + day,
                  }),
                ),
                "Clear filter: " + day,
              )
            : null,
        ),
        h(
          "div",
          { style: { display: "flex", flexWrap: "wrap", gap: 8 } },
          (data.days || []).map((d) =>
            h(
              "div",
              Object.assign(
                {
                  key: d.day,
                  className: "rt-seg" + (day === d.day ? " on" : ""),
                  style: { marginBottom: 0, cursor: "pointer" },
                  title:
                    d.day +
                    ": Added " +
                    d.assets +
                    " hosts (internal " +
                    d.internal +
                    " / external " +
                    d.external +
                    "）",
                },
                clickable(() => setDay(day === d.day ? "" : d.day), {
                  label: "Filter assets discovered on " + d.day,
                  expanded: day === d.day,
                }),
              ),
              h("div", { className: "rt-seg-cidr" }, d.day),
              h(
                "div",
                { className: "rt-seg-meta" },
                d.assets + " hosts · internal " + d.internal + " / external " + d.external,
              ),
            ),
          ),
        ),
      ),
      h(
        "div",
        { className: "rt-card" },
        h(
          "h4",
          null,
          day
            ? "Assets discovered on " + day + " (" + recent.length + ")"
            : "Recently discovered assets (" + recent.length + ")",
        ),
        recent.length === 0
          ? h("div", { className: "rt-empty" }, "No new assets on this day.")
          : null,
        recent.map((a) =>
          h(
            "div",
            { key: a.id, className: "rt-kv" },
            h(
              "b",
              { className: "rt-mono", style: { minWidth: 110 } },
              h(
                "span",
                {
                  className:
                    "rt-scope rt-scope-" +
                    (a.scope === "internal" ? "internal" : "external"),
                  style: { marginRight: 4 },
                },
                a.scope === "internal" ? "Internal" : "External",
              ),
              a.ip,
            ),
            h(
              "span",
              {
                style: {
                  minWidth: 132,
                  fontSize: 11.5,
                  color: "var(--dsw-alias-label-secondary)",
                },
              },
              a.discovered_at ? fmt(a.discovered_at) : "Time unknown",
            ),
            h(
              "span",
              { style: { flex: 1 } },
              (a.primary_name || "—") +
                (a.open_ports ? " · " + a.open_ports + " ports" : ""),
            ),
            h(PriTag, { p: a.priority }),
          ),
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Agent prompts */
  function PromptsTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [roles, setRoles] = React.useState([]);
    const [active, setActive] = React.useState(null);
    const [draft, setDraft] = React.useState("");
    const [msg, setMsg] = React.useState(null);
    const [busy, setBusy] = React.useState(false);

    React.useEffect(() => {
      /* Allowed without an engagement: the server returns built-in defaults instead of reporting engagement required */
      api(eng ? { op: "prompts", engagement: eng } : { op: "prompts" }).then(
        (r) => {
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Read failed" });
            return;
          }
          setRoles(r.roles || []);
          if (r.roles && r.roles.length)
            setActive((cur) => cur || r.roles[0].role);
          if (r.builtin)
            setMsg({
              ok: "Currently using built-in default prompts (after creating an engagement you can save per-engagement changes)",
            });
        },
        (e) => setMsg({ err: String((e && e.message) || e) }),
      );
    }, [eng, refreshKey]);

    React.useEffect(() => {
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
        content: draft,
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Save failed" });
            return;
          }
          setRoles((list) =>
            list.map((x) =>
              x.role === active
                ? Object.assign({}, x, {
                    content: draft,
                    updated_at: new Date().toISOString(),
                  })
                : x,
            ),
          );
          setMsg({ ok: "Saved" });
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    /* Prompts for older engagements may use outdated templates; restore the current role (or all) to the latest built-in version here */
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
        role: all ? undefined : active,
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Restore failed" });
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
            () => {},
          );
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    const cur = roles.find((x) => x.role === active);
    const items = roles.map((r) =>
      h(
        "div",
        Object.assign(
          {
            key: r.role,
            className: "rt-item" + (active === r.role ? " on" : ""),
          },
          clickable(
            () => {
              setActive(r.role);
              setMsg(null);
            },
            {
              label: "View prompt for \"" + r.title + "\"",
              expanded: active === r.role,
            },
          ),
        ),
        h("div", { className: "rt-item-name" }, r.title),
        h(
          "div",
          { className: "rt-item-desc" },
          (r.content || "").replace(/[#*`]/g, "").slice(0, 60) || "(empty)",
        ),
      ),
    );

    return h(
      "div",
      { className: "rt-split" },
      h("div", { className: "rt-list" }, items),
      h(
        "div",
        { className: "rt-main" },
        h(
          "div",
          { className: "rt-toolbar" },
          h("span", { style: { fontWeight: 600 } }, cur ? cur.title : "Prompt"),
          h(
            "span",
            { className: "rt-tag" },
            "Updated " + fmt(cur && cur.updated_at),
          ),
          h("div", { className: "rt-spacer" }),
          h(
            "button",
            {
              className: "rt-btn",
              disabled: busy || !active,
              title: "Restore this role to the latest built-in prompt",
              onClick: () => reset(false),
            },
            "Restore default for current",
          ),
          h(
            "button",
            {
              className: "rt-btn",
              disabled: busy,
              title: "Restore all four roles to the latest built-in prompts",
              onClick: () => reset(true),
            },
            "Restore all defaults",
          ),
          h(
            "button",
            {
              className: "rt-btn rt-btn-primary",
              disabled: busy || !active,
              onClick: save,
            },
            busy ? "Saving…" : "Save",
          ),
        ),
        msg
          ? h(
              "div",
              { className: msg.err ? "rt-err" : "rt-foot" },
              msg.err || msg.ok,
            )
          : null,
        h(
          "div",
          { className: "rt-pane" },
          h("textarea", {
            className: "rt-textarea",
            value: draft,
            spellCheck: false,
            onChange: (e) => setDraft(e.target.value),
            placeholder: "System prompt for this role (Markdown)",
          }),
          h(
            "div",
            {
              style: {
                fontSize: 11,
                color: "var(--dsw-alias-label-secondary)",
                marginTop: 6,
              },
            },
            "Saved to agents/" +
              (active || "role") +
              ".md. When a sub-session task starts with redteamRole: recon, assess, vuln-scan, exploit, or internal, the corresponding file is included in the system prompt.",
          ),
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Skill library (DSH native) */
  function SkillsTab(props) {
    const refreshKey = props.refreshKey || 0;
    const [items, setItems] = React.useState([]);
    const [meta, setMeta] = React.useState({});
    const [err, setErr] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [srcOnly, setSrcOnly] = React.useState(false);
    const [active, setActive] = React.useState(null);
    const [detail, setDetail] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [brokenOnly, setBrokenOnly] = React.useState(false);

    /* refresh=true skips the backend 30s availability cache (skill content/env vars may have just changed) */
    const load = (force) => {
      setBusy(true);
      api({ op: "skillCatalog", refresh: force === true }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setMeta(r || {});
          setItems(r.items || []);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    React.useEffect(load, [refreshKey]);

    const open = (skill) => {
      const name = skill && skill.name;
      const key =
        (skill && skill.library ? skill.library : "redteam") + ":" + name;
      if (active === key) {
        setActive(null);
        setDetail(null);
        return;
      }
      setActive(key);
      setDetail(null);
      api({
        op: "skillRead",
        name: name,
        library: skill.library || "redteam",
      }).then(
        (r) => {
          if (r && r.ok) setDetail(r);
          else setErr((r && r.error) || "Read failed");
        },
        (e) => setErr(String((e && e.message) || e)),
      );
    };

    const needle = q.trim().toLowerCase();
    let filtered = needle
      ? items.filter(
          (s) =>
            (s.name + " " + s.description + " " + s.whenToUse)
              .toLowerCase()
              .indexOf(needle) >= 0,
        )
      : items;
    if (srcOnly)
      filtered = filtered.filter(
        (s) => s.library !== "official" && s.fromPlugin === true,
      );
    if (brokenOnly)
      filtered = filtered.filter(
        (s) =>
          s.library !== "official" &&
          (s.availability === "broken" || s.availability === "unknown"),
      );
    /* Directory aggregation: see at a glance where these skills come from (this project / other plugins / built-in roots…) */
    const dirs = (meta.byDir || []).filter((d) => d.n > 0).slice(0, 6);
    const availSummary = meta.availability ? meta.availability.summary : null;
    const needRestart = err !== null && String(err).indexOf("unknown op") >= 0;

    const renderSkill = (s) =>
      h(
        "div",
        Object.assign(
          {
            key: (s.library || "redteam") + ":" + s.name,
            className:
              "rt-item" +
              (active === (s.library || "redteam") + ":" + s.name ? " on" : ""),
          },
          clickable(() => open(s), {
            label: "View skill " + s.name,
            expanded: active === (s.library || "redteam") + ":" + s.name,
          }),
        ),
        h(
          "div",
          { className: "rt-item-name" },
          s.name,
          s.modelInvocable === false
            ? h(
                "span",
                { className: "rt-tag", style: { marginLeft: 6 } },
                "Manual only",
              )
            : null,
          s.library === "official"
            ? h(
                "span",
                {
                  className: "rt-tag",
                  style: { marginLeft: 6 },
                  title: "Official skill directory; not checked against red-team tool paths",
                },
                "Official",
              )
            : h(
                "span",
                {
                  className:
                    "rt-avail rt-avail-" + (s.availability || "unknown"),
                  style: { marginLeft: 6 },
                  title:
                    s.availability === "available"
                      ? "Available: skill content can be loaded. Missing external tools or keys are noted in details and do not block invocation."
                      : (s.problems || []).join("\n") || "Unknown",
                },
                s.availability === "available"
                  ? "Available"
                  : s.availability === "broken"
                    ? "Unavailable"
                    : "Unknown",
              ),
          h(
            "div",
            { className: "rt-item-desc" },
            s.description || "(no description)",
          ),
          h(
            "div",
            { className: "rt-kb-sub" },
            [
              s.source ? "Source " + s.source : null,
              s.fromPlugin ? "Bundled with this plugin" : null,
              s.provider ? s.provider : null,
              s.dir ? s.dir : null,
            ]
              .filter(Boolean)
              .join(" · "),
          ),
          (s.problems || []).length > 0 &&
            s.availability !== "available" &&
            s.library !== "official"
            ? h(
                "div",
                {
                  className: "rt-kb-sub",
                  style: {
                    color: "var(--dsw-alias-state-warn-primary, #f59e0b)",
                  },
                },
                "⚠ " + String(s.problems[0]).slice(0, 60),
              )
            : null,
        ),
      );
    const redteamRows = filtered
      .filter((s) => s.library !== "official")
      .map(renderSkill);
    const officialRows = filtered
      .filter((s) => s.library === "official")
      .map(renderSkill);
    const listItems = [];
    if (redteamRows.length > 0) {
      listItems.push(
        h(
          "div",
          {
            key: "head-redteam",
            className: "rt-kb-sub",
            style: { margin: "8px 0 4px", fontWeight: 600 },
          },
          "Red Team skills",
        ),
      );
      listItems.push.apply(listItems, redteamRows);
    }
    if (officialRows.length > 0) {
      listItems.push(
        h(
          "div",
          {
            key: "head-official",
            className: "rt-kb-sub",
            style: { margin: "8px 0 4px", fontWeight: 600 },
          },
          "Official skills",
        ),
      );
      listItems.push.apply(listItems, officialRows);
    }

    return h(
      "div",
      { className: "rt-split" },
      h(
        "div",
        { className: "rt-list" },
        h("input", {
          className: "rt-input",
          style: { width: "100%", marginBottom: 8, boxSizing: "border-box" },
          placeholder: "Filter skills",
          value: q,
          onChange: (e) => setQ(e.target.value),
        }),
        h(
          "label",
          {
            className: "rt-kb-check",
            style: { display: "flex", margin: "0 0 6px" },
          },
          h("input", {
            type: "checkbox",
            checked: srcOnly,
            onChange: (e) => setSrcOnly(e.target.checked),
          }),
          "Show only bundled with this plugin (" + (meta.fromPlugin || 0) + ")",
        ),
        availSummary && (availSummary.broken > 0 || availSummary.unknown > 0)
          ? h(
              "label",
              {
                className: "rt-kb-check",
                style: { display: "flex", margin: "0 0 8px" },
                title:
                  "Show only skills with clear gaps (missing key / local path / placeholder infrastructure) or unknown availability",
              },
              h("input", {
                type: "checkbox",
                checked: brokenOnly,
                onChange: (e) => setBrokenOnly(e.target.checked),
              }),
              "Show only unavailable/unknown (" +
                ((availSummary.broken || 0) + (availSummary.unknown || 0)) +
                 ")",
            )
          : null,
        availSummary
          ? h(
              "div",
              {
                style: {
                  display: "flex",
                  gap: 4,
                  flexWrap: "wrap",
                  marginBottom: 6,
                },
              },
              h(
                "span",
                { className: "rt-avail rt-avail-available" },
                "Available " + (availSummary.available || 0),
              ),
              availSummary.broken > 0
                ? h(
                    "span",
                    { className: "rt-avail rt-avail-broken" },
                    "Unavailable " + availSummary.broken,
                  )
                : null,
              availSummary.unknown > 0
                ? h(
                    "span",
                    { className: "rt-avail rt-avail-unknown" },
                    "Unknown " + availSummary.unknown,
                  )
                : null,
              h(
                "span",
                Object.assign(
                  {
                    className: "rt-tag",
                    style: { cursor: "pointer" },
                    title: "Skill content or environment variables changed? Click to skip the 30s cache and recheck",
                  },
                  clickable(() => load(true), { label: "Recheck skill availability" }),
                ),
                "Recheck availability",
              ),
            )
          : null,
        h(
          "div",
          {
            style: {
              fontSize: 11,
              color: "var(--dsw-alias-label-secondary)",
              marginBottom: 6,
            },
          },
          "Red Team " +
            ((meta.libraries && meta.libraries.redteam) || 0) +
            " · Official " +
            ((meta.libraries && meta.libraries.official) || 0),
          items.length > 100
            ? h(
                "div",
                { style: { marginTop: 3 } },
                "(Most skills come from roots registered by other plugins or your own skill directories; this plugin bundles only " +
                  (meta.fromPlugin || 0) +
                   ")",
              )
            : null,
        ),
        listItems,
      ),
      h(
        "div",
        { className: "rt-main" },
        h(
          "div",
          { className: "rt-toolbar" },
          h(
            "span",
            { style: { fontWeight: 600 } },
            detail ? detail.name : "Skill directory (DSH native)",
          ),
          h("div", { className: "rt-spacer" }),
          h(
            "button",
            { className: "rt-btn", disabled: busy, onClick: () => load(true) },
            busy ? "Refreshing…" : "Refresh",
          ),
        ),
        err
          ? needRestart
            ? h(
                "div",
                { className: "rt-empty" },
                "Host code for this module has been updated; restart the current host (official exe / community edition / dsh web) once for changes to take effect",
              )
            : h("div", { className: "rt-err" }, err)
          : null,
        detail
          ? h(
              "div",
              { className: "rt-pane" },
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Description"),
                h("span", null, detail.description || "—"),
              ),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "When to use"),
                h("span", null, detail.whenToUse || "—"),
              ),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Source"),
                h(
                  "span",
                  null,
                  (detail.provider || "—") + " / " + (detail.source || "—"),
                ),
              ),
              (() => {
                const s2 = items.find(
                  (x) => (x.library || "redteam") + ":" + x.name === active,
                );
                if (!s2) return null;
                if (s2.library === "official") {
                  return h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Type"),
                    h(
                      "span",
                      null,
                      "Official skill. Invoked by the host per task; not checked against red-team tool paths.",
                    ),
                  );
                }
                const avail = s2.availability || "unknown";
                return h(
                  "div",
                  null,
                  h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Availability"),
                    h(
                      "span",
                      { className: "rt-avail rt-avail-" + avail },
                      avail === "available"
                        ? "Available"
                        : avail === "broken"
                          ? "Unavailable (clear gaps)"
                          : "Unknown (content unreadable)",
                    ),
                  ),
                  (s2.problems || []).length > 0
                    ? h(
                        "div",
                        { className: "rt-kv" },
                        h(
                          "b",
                          null,
                          avail === "available" ? "Missing external tools" : "Gaps",
                        ),
                        h(
                          "span",
                          null,
                          s2.problems.map((x, i) =>
                            h("div", { key: "p" + i }, "· " + x),
                          ),
                        ),
                      )
                    : null,
                  (s2.needs_user || []).length > 0
                    ? h(
                        "div",
                        { className: "rt-kv" },
                        h("b", null, "You need to provide"),
                        h(
                          "span",
                          {
                            style: {
                              color:
                                "var(--dsw-alias-state-warn-primary, #f59e0b)",
                            },
                          },
                          s2.needs_user.map((x, i) =>
                            h("div", { key: "n" + i }, "· " + x),
                          ),
                        ),
                      )
                    : null,
                );
              })(),
              detail.path
                ? h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "File"),
                    h(
                      "span",
                      {
                        className: "rt-mono",
                        style: { wordBreak: "break-all" },
                      },
                      detail.path,
                    ),
                  )
                : null,
              h(
                "pre",
                {
                  className: "rt-md",
                  style: {
                    border: "1px solid var(--dsw-alias-border-l1)",
                    borderRadius: 6,
                    maxHeight: "52vh",
                  },
                },
                detail.content || "(empty)",
              ),
            )
          : h(
              "div",
              { className: "rt-pane" },
              h(
                "div",
                {
                  style: {
                    fontSize: 12,
                    color: "var(--dsw-alias-label-secondary)",
                    marginBottom: 8,
                  },
                },
                meta.note ||
                  "Skills are managed by the DSH native skill system; Red Team agents invoke them through the skill tool.",
              ),
              availSummary
                ? h(
                    "div",
                    {
                      style: {
                        fontSize: 12,
                        marginBottom: 8,
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        alignItems: "center",
                      },
                    },
                    h(
                      "span",
                      { className: "rt-avail rt-avail-available" },
                      "Available " + (availSummary.available || 0),
                    ),
                    availSummary.broken > 0
                      ? h(
                          "span",
                          { className: "rt-avail rt-avail-broken" },
                          "Unavailable " + availSummary.broken,
                        )
                      : null,
                    availSummary.unknown > 0
                      ? h(
                          "span",
                          { className: "rt-avail rt-avail-unknown" },
                          "Unknown " + availSummary.unknown,
                        )
                      : null,
                    h(
                      "span",
                      { style: { color: "var(--dsw-alias-label-secondary)" } },
                      "（" +
                        (meta.availability && meta.availability.cached
                          ? "Cached at "
                          : "Checked at ") +
                        (meta.availability && meta.availability.checked_at
                          ? fmt(meta.availability.checked_at)
                          : "—") +
                        "）",
                    ),
                  )
                : null,
              meta.availability && (meta.availability.broken || []).length > 0
                ? h(
                    "div",
                    { className: "rt-hint" },
                    h(
                      "div",
                      { style: { fontWeight: 600, marginBottom: 4 } },
                      "Skills that cannot run right now:",
                    ),
                    meta.availability.broken
                      .slice(0, 12)
                      .map((b) =>
                        h(
                          "div",
                          { key: b.name },
                          "· " +
                            b.name +
                            (b.problems && b.problems.length
                              ? " — " + b.problems[0]
                              : ""),
                        ),
                      ),
                  )
                : null,
              (meta.byDir || []).slice(0, 6).map((d) =>
                h(
                  "div",
                  {
                    key: d.key,
                    className: "rt-mono",
                    style: {
                      fontSize: 11,
                      marginBottom: 2,
                      overflowWrap: "anywhere",
                    },
                  },
                  d.n + " · " + d.key,
                ),
              ),
              (meta.byDir || []).length > 6
                ? h(
                    "div",
                    {
                      style: {
                        fontSize: 11,
                        color: "var(--dsw-alias-label-secondary)",
                      },
                    },
                    "…and " +
                      ((meta.byDir || []).length - 6) +
                      " more directories (" +
                      items.length +
                      " skills total)",
                  )
                : null,
              h("div", { className: "rt-empty" }, "Select a skill on the left to view its content"),
            ),
      ),
    );
  }

  /* ---------------------------------------------------------- Vulnerability findings */
  const SEV_LABEL = {
    critical: "Critical",
    high: "High",
    medium: "Medium",
    low: "Low",
    info: "Info",
  };
  const STATUS_LABEL = {
    candidate: "To verify",
    confirmed: "Confirmed",
    "false-positive": "False positive",
    exploited: "Exploited",
    fixed: "Fixed",
  };
  const sevClass = (s) => "rt-sev rt-sev-" + (SEV_LABEL[s] ? s : "info");

  /** Target grouping: aggregate by "scheme://host:port" to avoid splitting groups by URL paths. */
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

  /* ---------------------------------------------------------- Evidence rendering */
  /** Colorize a raw HTTP message into request/status line + headers + body for easier reading. */
  function HttpBlock(props) {
    const text = String(props.text || "");
    if (!text) return null;
    const lines = text.split(/\r?\n/);
    const nodes = lines.map((ln, i) => {
      let cls = null;
      if (
        i === 0 &&
        /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|TRACE)\s/.test(ln)
      )
        cls = "rt-hl-req";
      else if (i === 0 && /^HTTP\//.test(ln)) cls = "rt-hl-res";
      else if (/^[A-Za-z0-9-]+:/.test(ln)) {
        const name = ln.split(":")[0].toLowerCase();
        if (
          name === "host" ||
          name === "cookie" ||
          name === "authorization" ||
          name === "content-type"
        )
          cls = "rt-hl-req";
      }
      return h(
        "div",
        { key: "l" + i, className: cls || undefined },
        ln === "" ? "\u00a0" : ln,
      );
    });
    return h(
      "pre",
      { className: "rt-evi-body" + (props.compact ? " req" : "") },
      nodes,
    );
  }

  /** Evidence section in vulnerability details: structured evidence text + raw HTTP request/response records for this vulnerability. */
  function detailEvidence(v) {
    const evi = String(v.evidence || "").trim();
    const looksHttp =
      /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH|HTTP\/)/m.test(evi) ||
      /\n[A-Za-z-]+: /.test(evi);
    const blocks = [];
    if (evi) {
      blocks.push(
        h(
          "div",
          { key: "ev", className: "rt-evi" },
          h(
            "div",
            { className: "rt-evi-head" },
            "Evidence summary",
            h("span", { className: "rt-tag" }, looksHttp ? "Raw message" : "Text"),
            h("div", { className: "rt-spacer" }),
            h(
              "button",
              {
                className: "rt-btn",
                style: { padding: "0 6px", fontSize: 11 },
                onClick: (e) => {
                  e.stopPropagation();
                  copyText(evi);
                },
              },
              "Copy",
            ),
          ),
          looksHttp
            ? h(HttpBlock, { text: evi })
            : h("pre", { className: "rt-evi-body" }, evi),
        ),
      );
    }
    const http = v.http_evidence || [];
    for (const e of http) {
      blocks.push(
        h(
          "div",
          { key: "h" + e.id, className: "rt-evi" },
          h(
            "div",
            { className: "rt-evi-head" },
            e.label || "HTTP evidence",
            h(
              "span",
              { className: "rt-tag" },
              (e.method || "") +
                " " +
                (e.status === null || e.status === undefined ? "" : e.status),
            ),
            h("div", { className: "rt-spacer" }),
            h(
              "span",
              {
                style: {
                  fontWeight: 400,
                  color: "var(--dsw-alias-label-secondary)",
                },
              },
              fmt(e.captured_at || e.created_at),
            ),
          ),
          e.request
            ? h(
                "div",
                null,
                h(
                  "div",
                  { className: "rt-evi-head", style: { borderTop: "none" } },
                  "▸ Request (paste directly into Burp Repeater)",
                ),
                h(HttpBlock, { text: e.request, compact: true }),
              )
            : null,
          e.response
            ? h(
                "div",
                null,
                h("div", { className: "rt-evi-head" }, "▸ Response"),
                h(HttpBlock, { text: e.response }),
              )
            : null,
          e.note
            ? h(
                "pre",
                { className: "rt-evi-body", style: { maxHeight: 80 } },
                e.note,
              )
            : null,
        ),
      );
    }
    if (blocks.length === 0) {
      blocks.push(
        h(
          "div",
          { key: "none", className: "rt-kv" },
          h("b", null, "Evidence"),
          h(
            "span",
            { style: { color: "var(--dsw-alias-state-error-primary)" } },
            "Missing — unverified/vulnerabilities without evidence are excluded from reports; add with redteam_http_evidence_add",
          ),
        ),
      );
    }
    return h("div", { key: "eviwrap" }, blocks);
  }

  function FindingsTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [sev, setSev] = React.useState("");
    const [status, setStatus] = React.useState("");
    const [q, setQ] = React.useState("");
    const [qApplied, setQApplied] = React.useState("");
    const [state, setState] = React.useState({
      loading: false,
      error: null,
      total: 0,
      items: [],
      stats: null,
    });
    const [creds, setCreds] = React.useState([]);
    const [accesses, setAccesses] = React.useState([]);
    const [files, setFiles] = React.useState([]);
    const [openId, setOpenId] = React.useState(null);
    const [msg, setMsg] = React.useState(null);
    /* Sub-tabs: Vulnerabilities / Credentials / Access sessions (credentials no longer listed at the bottom of the vulnerabilities page) */
    const [subTab, setSubTab] = React.useState("vulns");
    /* Group by target by default: a flat list of 322 is unreadable; first see "what was compromised on which host" */
    const [grouped, setGrouped] = React.useState(true);
    const collapse = useCollapse("findings:" + eng);

    const load = () => {
      if (!eng) return;
      api({
        op: "vulns",
        engagement: eng,
        severity: sev || undefined,
        status: status || undefined,
        q: qApplied || undefined,
        limit: 200,
      }).then(
        (r) => {
          if (!r || r.ok === false) {
            setState({
              loading: false,
              error: (r && r.error) || "Query failed",
              total: 0,
              items: [],
              stats: null,
            });
            return;
          }
          setState({
            loading: false,
            error: null,
            total: r.total,
            items: r.items || [],
            stats: r.stats || null,
          });
        },
        (e) =>
          setState({
            loading: false,
            error: String((e && e.message) || e),
            total: 0,
            items: [],
            stats: null,
          }),
      );
      api({ op: "credentials", engagement: eng }).then(
        (r) => setCreds((r && r.items) || []),
        () => {},
      );
      api({ op: "access", engagement: eng }).then(
        (r) => setAccesses((r && r.items) || []),
        () => {},
      );
      api({ op: "attackFiles", engagement: eng }).then(
        (r) => setFiles((r && r.items) || []),
        () => {},
      );
    };
    React.useEffect(load, [eng, sev, status, qApplied, refreshKey]);

    const setVulnStatus = (id, next) => {
      setMsg(null);
      api({
        op: "updateVuln",
        engagement: eng,
        id: id,
        patch: { status: next },
      }).then(
        (r) => {
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Update failed" });
            return;
          }
          setMsg({ ok: "Updated to \"" + (STATUS_LABEL[next] || next) + "\"" });
          load();
        },
        (e) => setMsg({ err: String((e && e.message) || e) }),
      );
    };

    const stats =
      state.stats && state.stats.bySeverity
        ? state.stats
        : { bySeverity: {}, byStatus: {} };
    const needRestart =
      state.error !== null && String(state.error).indexOf("unknown op") >= 0;

    const allFiles = (files || []).flatMap((g) =>
      (g.files || []).map((f) => Object.assign({ target: g.target }, f)),
    );
    const filesByVuln = new Map();
    const orphanFiles = [];
    for (const f of allFiles) {
      const vid =
        f.vuln_id === null || f.vuln_id === undefined
          ? null
          : Number(f.vuln_id);
      if (vid === null) {
        orphanFiles.push(f);
        continue;
      }
      if (!filesByVuln.has(vid)) filesByVuln.set(vid, []);
      filesByVuln.get(vid).push(f);
    }

    /* ── Conclusion row: conclusions only; click a number to filter ─────────────────────── */
    const concl = (key, label, value, active, onClick) =>
      h(
        "span",
        Object.assign(
          {
            key: key,
            className: "rt-concl-i" + (active ? " on" : ""),
            title: "Click to filter / click again to clear",
          },
          clickable(onClick, {
            label: "Filter by \"" + label + "\" (" + (value || 0) + ")",
            expanded: active,
          }),
        ),
        h("b", null, String(value || 0)),
        h("span", null, label),
      );
    const conclusion = h(
      "div",
      { className: "rt-concl" },
      concl(
        "conf",
        "Confirmed",
        stats.byStatus.confirmed || 0,
        status === "confirmed",
        () => setStatus((v) => (v === "confirmed" ? "" : "confirmed")),
      ),
      concl(
        "exp",
        "Exploited",
        stats.byStatus.exploited || 0,
        status === "exploited",
        () => setStatus((v) => (v === "exploited" ? "" : "exploited")),
      ),
      concl(
        "crit",
        "Critical",
        stats.bySeverity.critical || 0,
        sev === "critical",
        () => setSev((v) => (v === "critical" ? "" : "critical")),
      ),
      concl("high", "High", stats.bySeverity.high || 0, sev === "high", () =>
        setSev((v) => (v === "high" ? "" : "high")),
      ),
      concl("med", "Medium", stats.bySeverity.medium || 0, sev === "medium", () =>
        setSev((v) => (v === "medium" ? "" : "medium")),
      ),
      concl("gain", "Access gained", stats.withGained || 0, false, () => {}),
      h("div", { className: "rt-spacer" }),
      h(
        "span",
        { style: { fontSize: 11, color: "var(--dsw-alias-label-secondary)" } },
        "Grouped by target by default · " + (stats.targetGroups || 0) + " targets total",
      ),
    );

    const head = h(
      "div",
      { className: "rt-vrow head" },
      h("span", null, "Severity"),
      h("span", null, "Vulnerability / ID"),
      h("span", null, "Target"),
      h("span", null, "What was gained"),
      h("span", null, "Status"),
      h("span", null, "Confidence"),
    );

    /* Single vulnerability (row + expandable details), shared by grouped and flat views */
    const vulnRows = (v, compact) => {
      const out = [];
      const gainedList = String(v.gained || "")
        .split(/[、,;，；]/)
        .map((x) => x.trim())
        .filter(Boolean);
      const open = openId === v.id;
      out.push(
        h(
          "div",
          {
            key: "v" + v.id,
            className: "rt-vrow",
            role: "button",
            tabIndex: 0,
            style: compact
              ? {
                  cursor: "pointer",
                  gridTemplateColumns: "58px minmax(0,1fr) 104px 68px",
                }
              : { cursor: "pointer" },
            onClick: () => setOpenId(open ? null : v.id),
            onKeyDown: (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpenId(open ? null : v.id);
              }
            },
          },
          h(
            "span",
            null,
            h(
              "span",
              { className: sevClass(v.severity) },
              SEV_LABEL[v.severity] || v.severity,
            ),
          ),
          h(
            "span",
            { title: v.title || "" },
            h("span", { className: "rt-sec-caret" }, open ? "▾" : "▸"),
            (v.cve ? v.cve + " " : "") + (v.title || ""),
          ),
          compact
            ? null
            : h(
                "span",
                { className: "rt-mono", title: v.target || "" },
                v.target || v.asset_ip || "—",
              ),
          h(
            "span",
            { title: v.gained || "" },
            gainedList.length
              ? h(
                  "span",
                  {
                    className: "rt-gain",
                    style: {
                      maxWidth: "100%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      display: "inline-block",
                    },
                  },
                  gainedList[0] +
                    (gainedList.length > 1
                      ? " +" + (gainedList.length - 1)
                      : ""),
                )
              : h(
                  "span",
                  { style: { color: "var(--dsw-alias-label-secondary)" } },
                  "—",
                ),
          ),
          h(
            "span",
            null,
            h(
              "span",
              { className: "rt-tag" },
              STATUS_LABEL[v.status] || v.status,
            ),
          ),
          compact
            ? null
            : h(
                "span",
                null,
                v.confidence === null || v.confidence === undefined
                  ? "—"
                  : Math.round(v.confidence * 100) + "%",
              ),
        ),
      );
      if (openId !== v.id) return out;
      out.push(
        h(
          "div",
          {
            key: "vd" + v.id,
            className: "rt-vrow",
            style: { cursor: "default", gridTemplateColumns: "1fr" },
          },
          h(
            "div",
            { className: "rt-vdetail" },
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "What was gained"),
              gainedList.length
                ? h(
                    "span",
                    null,
                    gainedList.map((g, gi) =>
                      h(
                        "span",
                        {
                          key: "g" + gi,
                          className: "rt-gain",
                          style: { marginRight: 6 },
                        },
                        g,
                      ),
                    ),
                  )
                : h(
                    "span",
                    { style: { color: "var(--dsw-alias-label-secondary)" } },
                    "Not recorded — after gaining access/results, update gained via redteam_vuln_update (e.g. server access, internal tunnel, admin account)",
                  ),
            ),
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Target"),
              h(
                "span",
                { className: "rt-mono", style: { wordBreak: "break-all" } },
                v.target || "—",
              ),
            ),
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Asset"),
              h(
                "span",
                null,
                (v.asset_ip || "—") + " · " + (v.segment_cidr || ""),
              ),
            ),
            h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Source"),
              h(
                "span",
                null,
                (v.source || "—") +
                  " · " +
                  (v.found_by_agent || "—") +
                  " · " +
                  fmt(v.found_at),
              ),
            ),
            detailEvidence(v),
            (() => {
              const mine = filesByVuln.get(Number(v.id)) || [];
              return h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Attack files"),
                mine.length
                  ? h(
                      "span",
                      null,
                      mine.map((f, fi) =>
                        h(
                          "div",
                          { key: "af" + fi, style: { marginBottom: 3 } },
                          "· " +
                            (f.kind ? "[" + f.kind + "] " : "") +
                            (f.name || "(unnamed)") +
                            (f.description ? " — " + f.description : ""),
                          h(
                            "div",
                            {
                              className: "rt-mono",
                              style: {
                                fontSize: 11,
                                marginLeft: 12,
                                color: "var(--dsw-alias-label-secondary)",
                                overflowWrap: "anywhere",
                              },
                            },
                            f.path || "",
                          ),
                        ),
                      ),
                    )
                  : h(
                      "span",
                      { style: { color: "var(--dsw-alias-label-secondary)" } },
                      "(None) Use redteam_attack_file_add to archive scripts/webshells/exploits used for this vulnerability and include vuln_id",
                    ),
              );
            })(),
            h(
              "div",
              { className: "rt-actions" },
              h(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "confirmed");
                  },
                },
                "Confirm",
              ),
              h(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "exploited");
                  },
                },
                "Exploited",
              ),
              h(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "false-positive");
                  },
                },
                "False positive",
              ),
              h(
                "button",
                {
                  className: "rt-btn",
                  onClick: (e) => {
                    e.stopPropagation();
                    setVulnStatus(v.id, "fixed");
                  },
                },
                "Fixed",
              ),
            ),
          ),
        ),
      );
      return out;
    };

    const rows = [];
    if (grouped) {
      /* Group by target: first see "what was compromised on which host", then drill into specific vulnerabilities */
      const groups = new Map();
      for (const v of state.items) {
        const key = targetKeyOf(v);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
      }
      const SEV_RANK = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
      const list = Array.from(groups.entries())
        .map(([key, vs]) => ({
          key,
          vulns: vs,
          top: vs
            .slice()
            .sort(
              (a, b) =>
                (SEV_RANK[a.severity] ?? 9) - (SEV_RANK[b.severity] ?? 9),
            )[0],
          gained: Array.from(
            new Set(
              vs.flatMap((v) =>
                String(v.gained || "")
                  .split(/[、,;，；]/)
                  .map((x) => x.trim())
                  .filter(Boolean),
              ),
            ),
          ),
          exploited: vs.filter((v) => v.status === "exploited").length,
        }))
        .sort(
          (a, b) =>
            (SEV_RANK[a.top.severity] ?? 9) - (SEV_RANK[b.top.severity] ?? 9) ||
            b.vulns.length - a.vulns.length,
        );
      for (const g of list) {
        const key = "target:" + g.key;
        const defOpen = false;
        rows.push(
          h(
            Section,
            {
              key: "sec:" + g.key,
              tone: "target",
              title: g.key,
              count: g.vulns.length + " vulnerabilities",
              sub: [
                SEV_LABEL[g.top.severity] || g.top.severity,
                g.exploited ? "Exploited " + g.exploited : null,
                g.top.asset_ip && g.top.asset_ip !== g.key
                  ? "Asset " + g.top.asset_ip
                  : null,
              ]
                .filter(Boolean)
                .join(" · "),
              right: g.gained.length
                ? g.gained.slice(0, 2).join(" / ") +
                  (g.gained.length > 2 ? " +" + (g.gained.length - 2) : "")
                : "Access not recorded",
              open: collapse.isOpen(key, defOpen),
              onToggle: collapse.toggle(key, defOpen),
            },
            g.vulns.map((v) => vulnRows(v, true)),
          ),
        );
      }
      if (!list.length && !state.loading && !state.error) {
        rows.push(
          h("div", { key: "none", className: "rt-empty" }, "No vulnerability records"),
        );
      }
    } else {
      for (const v of state.items) rows.push(...vulnRows(v));
    }

    const toolbar = h(
      "div",
      { className: "rt-toolbar" },
      h("input", {
        className: "rt-input",
        style: { flex: "1 1 140px" },
        placeholder: "Search title / CVE / target (Enter)",
        value: q,
        onChange: (e) => setQ(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") setQApplied(q);
        },
      }),
      h(
        "button",
        { className: "rt-btn", onClick: () => setQApplied(q) },
        "Search",
      ),
      h(
        "select",
        {
          className: "rt-input",
          value: sev,
          onChange: (e) => setSev(e.target.value),
        },
        h("option", { value: "" }, "All severities"),
        h("option", { value: "critical" }, "Critical"),
        h("option", { value: "high" }, "High"),
        h("option", { value: "medium" }, "Medium"),
        h("option", { value: "low" }, "Low"),
        h("option", { value: "info" }, "Info"),
      ),
      h(
        "select",
        {
          className: "rt-input",
          value: status,
          onChange: (e) => setStatus(e.target.value),
        },
        h("option", { value: "" }, "All statuses"),
        h("option", { value: "candidate" }, "To verify"),
        h("option", { value: "confirmed" }, "Confirmed"),
        h("option", { value: "exploited" }, "Exploited"),
        h("option", { value: "false-positive" }, "False positive"),
        h("option", { value: "fixed" }, "Fixed"),
      ),
    );

    const credSection = h(
      "div",
      null,
      h(
        "div",
        { className: "rt-section" },
        "Credentials · " +
          creds.length +
          (creds.length ? " (shown in plaintext; be careful with screen sharing/recording)" : ""),
      ),
      creds.length
        ? h(
            "div",
            { style: { padding: "4px 10px 0" } },
            creds.map((c) =>
              h(
                "div",
                { key: "c" + c.id, className: "rt-cred" },
                h(
                  "div",
                  { className: "rt-cred-head" },
                  h("span", { className: "rt-cred-host" }, c.host),
                  c.username
                    ? h("span", { className: "rt-tag" }, c.username)
                    : null,
                  h(
                    "span",
                    { className: "rt-tag rt-tag-passive" },
                    c.secret_type || "password",
                  ),
                  c.privilege
                    ? h(
                        "span",
                        { className: "rt-tag rt-tag-active" },
                        c.privilege,
                      )
                    : null,
                  h("div", { className: "rt-spacer" }),
                  h(
                    "button",
                    {
                      className: "rt-btn",
                      style: { padding: "0 6px", fontSize: 11 },
                      onClick: (e) => {
                        e.stopPropagation();
                        copyText(String(c.secret_value || ""));
                      },
                    },
                    "Copy",
                  ),
                ),
                c.secret_value
                  ? h(
                      "div",
                      { className: "rt-secret", title: "Click to select all" },
                      c.secret_value,
                    )
                  : h(
                      "div",
                      { className: "rt-secret-none" },
                      "Plaintext not recorded — add secret_value via redteam_credential_add so the panel can display it",
                    ),
                h(
                  "div",
                  { className: "rt-cred-meta" },
                  [
                    c.source ? "Source " + c.source : null,
                    c.tool ? "Tool " + c.tool : null,
                    c.secret_ref ? "Evidence " + c.secret_ref : null,
                    c.found_by_agent ? "by " + c.found_by_agent : null,
                    c.found_at ? fmt(c.found_at) : null,
                  ]
                    .filter(Boolean)
                    .join(" · "),
                ),
                c.note
                  ? h("div", { className: "rt-cred-meta" }, "Notes: " + c.note)
                  : null,
              ),
            ),
          )
        : h(
            "div",
            { className: "rt-empty" },
            "No credentials yet (after obtaining passwords/keys/hashes, store them with redteam_credential_add for instant reuse)",
          ),
    );

    const accessSection = h(
      "div",
      null,
      h(
        "div",
        { className: "rt-section" },
        "Access sessions obtained · " + accesses.length,
      ),
      accesses.length
        ? accesses.map((a) =>
            h(
              "div",
              {
                key: "a" + a.id,
                className: "rt-vrow",
                style: {
                  cursor: "default",
                  gridTemplateColumns: "1fr 110px 80px 80px 1fr",
                },
              },
              h("span", { className: "rt-mono" }, a.host),
              h("span", null, a.username || "—"),
              h(
                "span",
                null,
                h(
                  "span",
                  { className: "rt-tag rt-tag-active" },
                  a.method || "—",
                ),
              ),
              h("span", null, a.privilege || "—"),
              h(
                "span",
                { className: "rt-mono", title: a.session_ref || "" },
                a.session_ref || "—",
              ),
            ),
          )
        : h("div", { className: "rt-empty" }, "None"),
    );

    const subTabBtn = (key, label, n) =>
      h(
        "span",
        Object.assign(
          {
            className: "rt-subtab" + (subTab === key ? " on" : ""),
          },
          clickable(() => setSubTab(key), {
            label: label + "（" + n + "）",
            expanded: subTab === key,
          }),
        ),
        label + " " + n,
      );

    return h(
      "div",
      { className: "rt-main" },
      toolbar,
      conclusion,
      h(
        "div",
        { className: "rt-subtabs" },
        subTabBtn("vulns", "Vulnerabilities", state.total || 0),
        subTabBtn("files", "Attack files", allFiles.length),
        subTabBtn("creds", "Credentials", creds.length),
        subTabBtn("access", "Access sessions", accesses.length),
        h("div", { className: "rt-spacer" }),
        grouped
          ? h(
              "button",
              {
                className: "rt-btn",
                title: "Expand all targets",
                onClick: () =>
                  collapse.setAll(
                    (state.items || []).map((v) => "target:" + targetKeyOf(v)),
                    true,
                  ),
              },
              "Expand all",
            )
          : null,
        grouped
          ? h(
              "button",
              {
                className: "rt-btn",
                title: "Collapse all targets",
                onClick: () =>
                  collapse.setAll(
                    (state.items || []).map((v) => "target:" + targetKeyOf(v)),
                    false,
                  ),
              },
              "Collapse all",
            )
          : null,
        h(
          "button",
          {
            className: "rt-btn" + (grouped ? " rt-btn-primary" : ""),
            title: grouped
              ? "Current: grouped by target (see what was compromised on each host first)"
              : "Current: flat list of vulnerabilities",
            onClick: () => setGrouped((g) => !g),
          },
          grouped ? "Group by target" : "Flat list",
        ),
      ),
      msg
        ? h(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok,
          )
        : null,
      needRestart
        ? h(
            "div",
            { className: "rt-empty" },
            "Host code for this module has been updated; restart the current host (official exe / community edition / dsh web) once for changes to take effect",
          )
        : null,
      state.error && !needRestart
        ? h("div", { className: "rt-err" }, state.error)
        : null,
      subTab === "files"
        ? h(
            "div",
            { className: "rt-body", style: { overflow: "auto" } },
            h(
              "div",
              { className: "rt-hint", style: { marginBottom: 8 } },
              "Attack files are organized by engagement directory (formerly the \"Attack files\" tab); related files for each vulnerability can also be viewed in its details." +
                (orphanFiles.length
                  ? " Currently " +
                    orphanFiles.length +
                    " files are missing vuln_id; add it to associate them with vulnerabilities."
                  : ""),
            ),
            h(AttackFilesTab, { engagement: eng, refreshKey: refreshKey }),
          )
        : subTab === "creds"
          ? h(
              "div",
              { className: "rt-body", style: { overflow: "auto" } },
              credSection,
            )
          : subTab === "access"
            ? h(
                "div",
                { className: "rt-body", style: { overflow: "auto" } },
                accessSection,
              )
            : h(
                "div",
                { className: "rt-table" },
                grouped ? null : head,
                rows,
                !state.loading && !state.items.length && !state.error
                  ? h("div", { className: "rt-empty" }, "No vulnerability records")
                  : null,
              ),
    );
  }

  /* ---------------------------------------------------------- Attack chain */
  const STAGE_LABEL = {
    recon: "Reconnaissance",
    vuln: "Vulnerability discovery",
    exploit: "Exploitation",
    access: "Access gained",
    pivot: "Internal network pivot",
    data: "Sensitive data",
    other: "Other",
  };

  /* ---------------------------------------------------------- Attack chain (five stages) */
  /**
   * Chain by attack-surface position:
   * 1. Reconnaissance -> 2. Internet asset access -> 3. Boundary breach -> 4. Internal asset access -> 5. Target access.
   * Each stage shows only two things: points gained (and cumulative) and which assets/tunnels were involved.
   * A = vertical chain (detailed); B = horizontal chain (at a glance).
   */
  function ChainTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [view, setView] = React.useState("A");
    const [openId, setOpenId] = React.useState(null);

    const load = () => {
      if (!eng) return;
      setLoading(true);
      api({ op: "scoreChain", engagement: eng }).then(
        (r) => {
          setLoading(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => {
          setLoading(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    React.useEffect(load, [eng, refreshKey]);

    const stages = (data && data.stages) || [];
    const summary = (data && data.summary) || null;
    const toggle = (id) => setOpenId((cur) => (cur === id ? null : id));
    const CIRCLED = ["①", "②", "③", "④", "⑤", "⑥"];

    /* Details for a single score entry */
    const hitDetail = (x) =>
      h(
        "div",
        { className: "rt-flow-detail" },
        h(
          "div",
          { className: "rt-kv" },
          h("b", null, "Target"),
          h(
            "span",
            { className: "rt-mono", style: { wordBreak: "break-all" } },
            x.target || "—",
          ),
        ),
        x.asset_ip
          ? h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Asset"),
              h("span", { className: "rt-mono" }, x.asset_ip),
            )
          : null,
        x.vuln_title
          ? h(
              "div",
              { className: "rt-kv" },
              h("b", null, "Exploited vulnerability"),
              h(
                "span",
                null,
                [x.vuln_cve, x.vuln_title].filter(Boolean).join(" "),
              ),
            )
          : null,
        h(
          "div",
          { className: "rt-kv" },
          h("b", null, "Count"),
          h(
            "span",
            null,
            "Occurrence #" + x.nth_of_point + " · +" + (x.points || 0) + " pts",
          ),
        ),
        h(
          "div",
          { className: "rt-kv" },
          h("b", null, "Record"),
          h(
            "span",
            null,
            fmt(x.recorded_at) + (x.recorded_by ? " · " + x.recorded_by : ""),
          ),
        ),
        x.evidence ? h(Clip, { label: "Result and evidence", text: x.evidence }) : null,
      );

    const hitRow = (x) =>
      h(
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
          },
        },
        h(
          "div",
          { className: "rt-ap-hit-head" },
          h(
            "span",
            {
              className: "rt-ap-pts" + (x.counted ? "" : " uncounted"),
              title: x.capped_reason || undefined,
            },
            "+" + (x.counted ? x.points || 0 : 0),
          ),
          h("span", { className: "rt-ap-hit-name" }, x.point_name),
          x.capped
            ? h(
                "span",
                {
                  className: "rt-tag rt-tag-warn",
                  title:
                    x.capped_reason || "Only the highest-scoring entry counts for the same asset and port",
                },
                "Service cap reached · not counted",
              )
            : null,
          x.nth_of_point > 1
            ? h(
                "span",
                { className: "rt-ap-nth" },
                "#" + x.nth_of_point,
              )
            : null,
          h(
            "span",
            { className: "rt-ap-hit-target" },
            x.target || x.asset_ip || "—",
          ),
        ),
        x.action
          ? h(
              "div",
              {
                className: "rt-ap-act" + (x.action_inferred ? " inferred" : ""),
              },
              "Action: " +
                (x.action.title || "(Unnamed step)") +
                (x.action_inferred ? " (inferred)" : ""),
            )
          : null,
        openId === x.id ? hitDetail(x) : null,
      );

    /* Asset rows (reconnaissance stage / assets involved in each stage) */
    const assetRow = (a) =>
      h(
        "div",
        { key: "a" + a.id, className: "rt-ap-asset" },
        h(
          "span",
          {
            className:
              "rt-scope rt-scope-" +
              (a.scope === "internal" ? "internal" : "external"),
          },
          a.scope === "internal" ? "Internal" : "External",
        ),
        h("span", { className: "rt-mono", style: { fontWeight: 600 } }, a.ip),
        a.segment_cidr
          ? h("span", { className: "rt-ap-nth" }, a.segment_cidr)
          : null,
        h("span", { className: "rt-ap-nth" }, "Ports " + (a.open_ports || 0)),
        a.vulns
          ? h("span", { className: "rt-ap-nth" }, "Vulns " + a.vulns)
          : null,
        a.priority
          ? h("span", { className: "rt-tag" }, "Ease " + a.priority)
          : null,
        h("div", { className: "rt-spacer" }),
        h("span", { className: "rt-ap-pts" }, "+" + (a.points || 0) + " pts"),
        h("span", { className: "rt-ap-nth" }, (a.hits || 0) + " hits"),
      );

    /* The attack chain shows only progress and points earned; it omits tactics and tool lists,
         which are execution details that would obscure score and asset information. */

    /* -- A: Vertical attack chain ------------------------------------------- */
    const stageA = (st, i) => {
      const isRecon = st.code === "recon";
      const body = [];
      if (isRecon) {
        body.push(
          h(
            "div",
            { key: "at", className: "rt-ap-sub" },
            "Assets with points · " + st.assetCount + " hosts",
          ),
        );
        body.push(
          h(
            "div",
            { key: "al", className: "rt-ap-assets" },
            st.assets.length
              ? st.assets.map(assetRow)
              : h("div", { className: "rt-ap-none" }, "No assets with points yet"),
          ),
        );
      } else {
        body.push(
          h(
            "div",
            { key: "ht", className: "rt-ap-sub" },
            "Hits in this stage " +
              st.hits +
              " times" +
              (st.points ? " · +" + st.points + " pts" : ""),
          ),
        );
        body.push(
          h(
            "div",
            { key: "hl", className: "rt-ap-hits" },
            st.items.length
              ? st.items.map(hitRow)
              : h("div", { className: "rt-ap-none" }, "No points in this stage yet"),
          ),
        );
        if (st.code === "boundary") {
          const selfOnly = (st.tunnels_self_only || []).length;
          body.push(
            h(
              "div",
              { key: "tt", className: "rt-ap-sub" },
              "Boundary-crossing channels · " +
                st.tunnels.length +
                " items" +
                (selfOnly
                  ? " (another " +
                    selfOnly +
                    " channels only on your own VPS/self-hosted server, not a breach)"
                  : ""),
            ),
          );
          if (selfOnly && st.tunnels.length === 0) {
            body.push(
              h(
                "div",
                { key: "tw", className: "rt-ap-none" },
                "Warning: Existing channels are all on your own servers and do not reach the target — not counted as a boundary breach. Target-side initiated channels are required (reverse shell to us / frp client on target / suo5 via target WebShell).",
              ),
            );
          }
          body.push(
            h(
              "div",
              { key: "tl", className: "rt-ap-tunnels" },
              st.tunnels.length
                ? st.tunnels.map((t) =>
                    h(
                      "div",
                      { key: "t" + t.id, className: "rt-ap-tunnel" },
                      h(
                        "span",
                        { className: "rt-tag rt-tag-passive" },
                        t.kind || "tunnel",
                      ),
                      h(
                        "span",
                        { className: "rt-mono", style: { fontWeight: 600 } },
                        t.listen || "—",
                      ),
                      h(
                        "span",
                        {
                          className:
                            "rt-tag " +
                            (t.status === "active" ? "rt-tag-live" : ""),
                          style: t.status === "active" ? {} : { opacity: 0.7 },
                        },
                        t.status === "active" ? "Available" : t.status || "Unknown",
                      ),
                      h(
                        "span",
                        {
                          className: "rt-ap-nth",
                          style: {
                            minWidth: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          },
                        },
                        "Reachable " + (t.reach || "-"),
                      ),
                    ),
                  )
                : h(
                    "div",
                    { className: "rt-ap-none" },
                    "No tunnel established yet (register with redteam_tunnel_add after creating one)",
                  ),
            ),
          );
        }
        if (st.assets.length && st.code !== "boundary") {
          body.push(
            h(
              "div",
              { key: "at", className: "rt-ap-sub" },
              "Assets involved · " + st.assetCount + " hosts",
            ),
          );
          body.push(
            h(
              "div",
              { key: "al", className: "rt-ap-assets" },
              st.assets.map(assetRow),
            ),
          );
        }
      }

      return h(
        "div",
        { key: "st" + st.code, className: "rt-ap-stage" },
        h(
          "div",
          { className: "rt-ap-head", style: { borderLeftColor: st.color } },
          h(
            "span",
            { className: "rt-ap-no", style: { background: st.color } },
            CIRCLED[i] || "0" + (i + 1),
          ),
          h("span", { className: "rt-ap-name" }, st.name),
          st.subtitle
            ? h("span", { className: "rt-ap-en" }, st.subtitle)
            : null,
          h("div", { className: "rt-spacer" }),
          st.points > 0
            ? h(
                "span",
                {
                  className: "rt-ap-pts",
                  style: {
                    background: st.color + "22",
                    color: st.color,
                    borderColor: st.color + "66",
                  },
                },
                "+" + st.points,
              )
            : null,
          h(
            "span",
            { className: "rt-ap-cum" },
            "Cumulative " + st.cumulative + " pts",
          ),
        ),
        h(
          "div",
          { className: "rt-ap-goal", style: { borderLeftColor: st.color } },
          h(
            "span",
            {
              className: "rt-ap-goal-tag",
              style: { color: st.color, borderColor: st.color + "66" },
            },
            "Stage goal",
          ),
          h("span", null, st.goal),
        ),
        h(
          "div",
          { className: "rt-ap-result", style: { borderLeftColor: st.color } },
          body,
        ),
        i < stages.length - 1
          ? h(
              "div",
              { className: "rt-ap-trans" },
              h("span", { className: "rt-flow-arrow" }, "▼"),
              st.transition
                ? h("span", { className: "rt-ap-trans-t" }, st.transition)
                : null,
              h(
                "span",
                { className: "rt-ap-trans-t", style: { marginLeft: "auto" } },
                "Cumulative " + st.cumulative + " pts",
              ),
            )
          : h(
              "div",
              { className: "rt-ap-trans" },
              h("span", { className: "rt-flow-arrow" }, "▼"),
              h(
                "span",
                { className: "rt-ap-trans-t" },
                "Total " + ((summary && summary.points) || 0) + " pts",
              ),
            ),
      );
    };

    /* -- B: Horizontal attack chain (at a glance) --------------------------- */
    const stageB = (st, i) =>
      h(
        "div",
        { key: "c" + st.code, className: "rt-ap-col" },
        i > 0 ? h("span", { className: "rt-ap-col-arrow" }, "▶") : null,
        h(
          "div",
          { className: "rt-hcol", style: { borderTopColor: st.color } },
          h(
            "div",
            {
              className: "rt-ap-head",
              style: { borderLeftColor: st.color, padding: "5px 8px" },
            },
            h(
              "span",
              {
                className: "rt-ap-no",
                style: {
                  background: st.color,
                  width: 16,
                  height: 16,
                  fontSize: 10,
                },
              },
              String(i + 1),
            ),
            h(
              "span",
              { className: "rt-ap-name", style: { fontSize: 12 } },
              st.name,
            ),
            h("div", { className: "rt-spacer" }),
            h(
              "span",
              { className: "rt-ap-cum", style: { fontWeight: 700 } },
              st.cumulative,
            ),
          ),
          h("div", { className: "rt-hcol-goal", title: st.goal }, st.goal),
          h(
            "div",
            { className: "rt-hcol-body" },
            st.code === "boundary"
              ? h(
                  "div",
                  null,
                  h(
                    "div",
                    { className: "rt-hcol-hit" },
                    h("span", { className: "rt-hcol-pts" }, "+" + st.points),
                    h(
                      "span",
                      { className: "rt-hcol-name" },
                      "Tunnels " + st.tunnels.length,
                    ),
                  ),
                  st.tunnels
                    .slice(0, 3)
                    .map((t) =>
                      h(
                        "div",
                        { key: "t" + t.id, className: "rt-hcol-sub" },
                        "▸ " + (t.kind || "") + " " + (t.listen || ""),
                      ),
                    ),
                )
              : st.code === "recon"
                ? h(
                    "div",
                    null,
                    h(
                      "div",
                      { className: "rt-hcol-hit" },
                      h("span", { className: "rt-hcol-pts" }, st.assetCount),
                      h("span", { className: "rt-hcol-name" }, "Assets with points"),
                    ),
                    st.assets.slice(0, 6).map((a) =>
                      h(
                        "div",
                        {
                          key: "a" + a.id,
                          className: "rt-hcol-sub",
                          title: a.ip + "  +" + a.points + " pts",
                        },
                        (a.scope === "internal" ? "Internal " : "External ") +
                          a.ip +
                          "  +" +
                          a.points,
                      ),
                    ),
                  )
                : h(
                    "div",
                    null,
                    h(
                      "div",
                      { className: "rt-hcol-hit" },
                      h("span", { className: "rt-hcol-pts" }, "+" + st.points),
                      h(
                        "span",
                        { className: "rt-hcol-name" },
                        st.hits + " hits",
                      ),
                    ),
                    st.items.slice(0, 6).map((x) =>
                      h(
                        "div",
                        {
                          key: "c" + x.id,
                          className: "rt-hcol-sub",
                          title: x.point_name + "  " + (x.target || ""),
                        },
                        h("span", { className: "rt-hcol-pts" }, "+" + x.points),
                        h("span", { className: "rt-hcol-name" }, x.point_name),
                      ),
                    ),
                    st.items.length > 6
                      ? h(
                          "div",
                          { className: "rt-hcol-none" },
                          "...and " + (st.items.length - 6) + " more",
                        )
                      : null,
                    st.assetCount
                      ? h(
                          "div",
                          { className: "rt-hcol-none" },
                          "Involves " + st.assetCount + " assets",
                        )
                      : null,
                  ),
          ),
        ),
      );

    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Attack chain"),
        h(
          "span",
          { className: "rt-tag", style: { fontSize: 10.5 } },
          "Reconnaissance -> Internet asset access -> Boundary breach -> Internal asset access -> Target access",
        ),
        summary
          ? h(
              "span",
              { className: "rt-tag rt-tag-live" },
              "Total score " + summary.points + " pts",
            )
          : null,
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          {
            className: "rt-btn" + (view === "A" ? " rt-btn-primary" : ""),
            title: "Vertical attack chain: view stage details top to bottom",
            onClick: () => setView("A"),
          },
          "Chain A",
        ),
        h(
          "button",
          {
            className: "rt-btn" + (view === "B" ? " rt-btn-primary" : ""),
            title: "Horizontal attack chain: view all five stages at a glance",
            onClick: () => setView("B"),
          },
          "Chain B",
        ),
        h(
          "button",
          { className: "rt-btn", disabled: loading, onClick: load },
          loading ? "Loading…" : "Refresh",
        ),
      ),
      err ? h("div", { className: "rt-err" }, err) : null,
      !stages.length && !err && data !== null
        ? h(
            "div",
            { className: "rt-empty" },
            "No score records yet. After achieving results, record them with redteam_score_hit to grow this chain.",
          )
        : view === "A"
          ? h("div", { className: "rt-ap" }, stages.map(stageA))
          : h("div", { className: "rt-ap-h" }, stages.map(stageB)),
    );
  }

  /* ---------------------------------------------------------- Score reproduction report */
  /**
   * Report grouping fallback: when the host only provides flat items, use scoreChain stage info to group items in attack-chain order.
   * Based on the shared score_hit id — each scoreChain item has stage_code,
   * and each scoreReport item has the same id. Even if the host is older or stage rows are missing,
   * the report page still displays correctly instead of incorrectly reporting "no deliverable results yet".
   */
  function groupByStage(reportItems, chain) {
    const byId = new Map((reportItems || []).map((x) => [x.id, x]));
    const groups = [];
    const stageList = (chain && chain.stages) || [];
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
        items,
      });
    });
    /* When scoreChain has no stage info at all, at least assign scores to "Other" so items do not disappear */
    const grouped = new Set(
      groups.reduce((acc, g) => acc.concat(g.items.map((x) => x.id)), []),
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
        items: rest,
      });
    }
    return groups;
  }

  function ReportTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    /* Report collapsed by stage: open by default, collapse state remembered per engagement */
    const collapse = useCollapse("report:" + eng);

    const load = () => {
      if (!eng) return;
      setBusy(true);
      setMsg(null);
      api({ op: "scoreReport", engagement: eng }).then(
        (r) => {
          if (!r || r.ok === false) {
            setBusy(false);
            setErr((r && r.error) || "Generation failed");
            return;
          }
          /* Older host provides only flat items without stage grouping (or missing stage rows): group by attack chain ourselves,
             otherwise the report page incorrectly reports "no deliverable results yet". Grouping data comes from scoreChain. */
          if (
            (!r.stages || r.stages.length === 0) &&
            (r.items || []).length > 0
          ) {
            api({ op: "scoreChain", engagement: eng }).then(
              (c) => {
                setBusy(false);
                setErr(null);
                setData(
                  Object.assign({}, r, { stages: groupByStage(r.items, c) }),
                );
              },
              () => {
                setBusy(false);
                setErr(null);
                setData(r);
              },
            );
            return;
          }
          setBusy(false);
          setErr(null);
          setData(r);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    React.useEffect(load, [eng, refreshKey]);

    /* Copy results must be truthful: if the clipboard API fails (insecure context/focus loss/denied), report it accurately,
         otherwise users may think the copy succeeded but paste empty content into Yakit. */
    const copy = (text, label) =>
      copyWithFeedback(text, label, (okFlag, message) => {
        setMsg(okFlag ? { ok: message } : { err: message });
      });
    const download = (text, label) => {
      try {
        const blob = new Blob([text], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download =
          "report-" +
          String(label || "score").replace(/[^\w.\-]/g, "_") +
          ".md";
        a.click();
        /* Revoking immediately can break click-initiated downloads in some browsers; delay slightly */
        setTimeout(() => {
          try {
            URL.revokeObjectURL(url);
          } catch {
            /* ignore */
          }
        }, 1000);
        setMsg({ ok: "Downloaded: " + label });
      } catch (e) {
        setMsg({ err: "Download failed: " + ((e && e.message) || e) });
      }
    };

    const items = (data && data.items) || [];
    const stages = (data && data.stages) || [];
    const summary = (data && data.summary) || null;
    const mdText = (data && data.markdown) || "";
    const CIRCLED = [
      "①",
      "②",
      "③",
      "④",
      "⑤",
      "⑥",
      "⑦",
      "⑧",
      "⑨",
      "⑩",
      "⑪",
      "⑫",
      "⑬",
      "⑭",
      "⑮",
      "⑯",
      "⑰",
      "⑱",
      "⑲",
      "⑳",
    ];

    /* One entry per item, flat: Target -> Gained -> Reproduction request (paste into Yakit) -> Response */
    const card = (x) =>
      h(
        "div",
        { key: "r" + x.id, className: "rt-rep" },
        h(
          "div",
          { className: "rt-rep-head" },
          h("span", { className: "rt-rep-idx" }, String(x.seq)),
          h("span", { className: "rt-rep-name" }, x.point_name),
          h("span", { className: "rt-flow-pts" }, "+" + x.points + " pts"),
          x.nth_of_point > 1
            ? h(
                "span",
                { className: "rt-tag" },
                "Occurrence #" + x.nth_of_point,
              )
            : null,
          h("div", { className: "rt-spacer" }),
          h(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () =>
                copy(
                  (x.requests || [])
                    .map((v) => v.request || "")
                    .filter(Boolean)
                    .join("\n\n"),
                  "Request #" + x.seq,
                ),
            },
            "Copy request",
          ),
        ),
        h(
          "div",
          { className: "rt-rep-meta" },
          h("span", null, h("b", null, "Target ")),
          h("span", { className: "rt-mono" }, x.target || x.asset_ip || "—"),
        ),
        x.gained
          ? h(
              "div",
              { className: "rt-rep-meta" },
              h("b", null, "Gained "),
              h("span", null, x.gained),
            )
          : null,
        x.vuln
          ? h(
              "div",
              { className: "rt-rep-meta" },
              h("b", null, "Exploited vulnerability "),
              h(
                "span",
                null,
                [x.vuln.cve, x.vuln.title].filter(Boolean).join(" "),
              ),
            )
          : null,
        x.evidence
          ? h(
              "div",
              { className: "rt-rep-meta" },
              h("b", null, "Result "),
              h("span", null, String(x.evidence).replace(/\n+/g, " ")),
            )
          : null,
        x.recorded_at
          ? h(
              "div",
              { className: "rt-rep-meta" },
              h("b", null, "Obtained at "),
              h(
                "span",
                null,
                fmt(x.recorded_at) +
                  (x.recorded_by
                    ? "（" + (ROLE_LABEL[x.recorded_by] || x.recorded_by) + "）"
                    : ""),
              ),
            )
          : null,
        h(ShotStrip, {
          eng: eng,
          shots: x.shots,
          total: x.shot_total,
          title: "Evidence screenshots",
        }),
        /* -- Reproduction steps: action records (with actual commands and output) + credentials + tunnels + WebShell -----
           This is where the report delivers value: how credentials were obtained and how tunnels were set up, so users can reproduce it. */
        h(
          "details",
          {
            className: "rt-rep-trace",
            open: x.incomplete === true || (x.steps || []).length === 0,
          },
          h(
            "summary",
            { className: "rt-rep-trace-head", style: { cursor: "pointer" } },
            h(
              "span",
              { className: "rt-rep-trace-title" },
              "Reproduction steps (click to expand)",
            ),
            (x.steps || []).length
              ? h(
                  "span",
                  { className: "rt-tag" },
                  (x.steps || []).length + " actions",
                )
              : null,
            (x.credentials || []).length
              ? h(
                  "span",
                  { className: "rt-tag" },
                  (x.credentials || []).length + " credentials",
                )
              : null,
            (x.tunnels || []).length
              ? h(
                  "span",
                  { className: "rt-tag" },
                  (x.tunnels || []).length + " tunnels",
                )
              : null,
            x.incomplete
              ? h("span", { className: "rt-tag rt-tag-warn" }, "Reproduction materials pending")
              : h("span", { className: "rt-tag rt-tag-live" }, "Reproducible"),
          ),
          h(
            "div",
            { style: { paddingTop: 6 } },
            x.how ? h("div", { className: "rt-rep-trace-how" }, x.how) : null,
            (x.steps || []).length === 0
              ? h(
                  "div",
                  { className: "rt-rep-missing" },
                  "Warning: No associated attack steps: cannot explain how this step was performed. Add actions with redteam_chain_add (title / detail / tool / result), or include point_code + evidence when scoring.",
                )
              : (x.steps || []).map((s, si) =>
                  h(
                    "div",
                    { key: "s" + s.id, className: "rt-rep-step" },
                    h(
                      "div",
                      { className: "rt-rep-step-head" },
                      h(
                        "span",
                        { className: "rt-rep-step-no" },
                        String(si + 1),
                      ),
                      h(
                        "span",
                        { className: "rt-rep-step-title" },
                        s.title || "(Unnamed action)",
                      ),
                      s.agent
                        ? h(
                            "span",
                            { className: "rt-tag" },
                            ROLE_LABEL[s.agent] || s.agent,
                          )
                        : null,
                      s.stage_code
                        ? h("span", { className: "rt-tag" }, s.stage_code)
                        : null,
                      s.inferred
                        ? h("span", { className: "rt-tag" }, "Inferred from same asset")
                        : null,
                      h("div", { className: "rt-spacer" }),
                      s.recorded_at
                        ? h(
                            "span",
                            {
                              style: {
                                fontSize: 11,
                                color: "var(--dsw-alias-label-secondary)",
                              },
                            },
                            fmt(s.recorded_at),
                          )
                        : null,
                    ),
                    s.detail
                      ? h("div", { className: "rt-rep-step-detail" }, s.detail)
                      : null,
                    h(
                      "div",
                      { className: "rt-rep-step-cmd" },
                      h("b", null, "Execution "),
                      s.tool
                        ? h("span", { className: "rt-mono" }, s.tool)
                        : h(
                            "span",
                            {
                              style: {
                                color:
                                  "var(--dsw-alias-state-warn-primary, #f59e0b)",
                              },
                            },
                            "Actual command not recorded (tool in redteam_chain_add)",
                          ),
                    ),
                    s.tool
                      ? h(
                          "div",
                          { style: { marginTop: 3 } },
                          h(
                            "button",
                            {
                              className: "rt-btn",
                              style: { padding: "0 6px", fontSize: 11 },
                              onClick: () =>
                                copy(
                                  String(s.tool),
                                  "Step " + (si + 1) + " command",
                                ),
                            },
                            "Copy command",
                          ),
                        )
                      : null,
                    s.result
                      ? h(
                          "div",
                          { className: "rt-rep-step-result" },
                          h("b", null, "Result "),
                          String(s.result).replace(/\n+/g, " "),
                        )
                      : null,
                    s.evidence_ref
                      ? h(
                          "div",
                          { className: "rt-rep-step-result" },
                          h("b", null, "Evidence "),
                          h("span", { className: "rt-mono" }, s.evidence_ref),
                        )
                      : null,
                  ),
                ),
            /* How credentials were obtained: source and acquisition method */
            (x.credentials || []).length
              ? h(
                  "div",
                  { className: "rt-rep-src" },
                  h(
                    "div",
                    { className: "rt-rep-src-title" },
                    "Obtained credentials (traceable source)",
                  ),
                  (x.credentials || []).map((c) =>
                    h(
                      "div",
                      { key: "c" + c.id, className: "rt-kv" },
                      h(
                        "b",
                        { className: "rt-mono", style: { minWidth: 120 } },
                        c.host || "—",
                      ),
                      h(
                        "span",
                        null,
                        (c.username || "(No username)") +
                          " / " +
                          (c.secret_type || "password") +
                          (c.privilege ? " · Privilege " + c.privilege : "") +
                          " · Source " +
                          (c.source || "Unspecified") +
                          (c.tool
                            ? " · Acquisition method " +
                              String(c.tool).replace(/\n+/g, " ").slice(0, 160)
                            : ""),
                      ),
                    ),
                  ),
                )
              : null,
            /* How tunnels were set up */
            (x.tunnels || []).length
              ? h(
                  "div",
                  { className: "rt-rep-src" },
                  h(
                    "div",
                    { className: "rt-rep-src-title" },
                    "Tunnels / channels used",
                  ),
                  (x.tunnels || []).map((t) =>
                    h(
                      "div",
                      { key: "t" + t.id, className: "rt-kv" },
                      h(
                        "b",
                        { className: "rt-mono", style: { minWidth: 120 } },
                        (t.kind || "socks5") + " " + (t.listen || ""),
                      ),
                      h(
                        "span",
                        null,
                        "Entry " +
                          (t.entry || "Not registered") +
                          (t.reach ? " · Reachable " + t.reach : "") +
                          " · Target side " +
                          (t.entry_kind || "Not declared") +
                          (t.legit === false ? " · Warning: does not cross engagement boundary" : "") +
                          (t.status ? " · " + t.status : "") +
                          (t.command
                            ? " · Command " +
                              String(t.command)
                                .replace(/\n+/g, " ")
                                .slice(0, 160)
                            : ""),
                      ),
                    ),
                  ),
                )
              : null,
            (x.webshells || []).length
              ? h(
                  "div",
                  { className: "rt-rep-src" },
                  h(
                    "div",
                    { className: "rt-rep-src-title" },
                    "WebShells used",
                  ),
                  (x.webshells || []).map((w) =>
                    h(
                      "div",
                      { key: "w" + w.id, className: "rt-kv" },
                      h(
                        "b",
                        { className: "rt-mono", style: { minWidth: 120 } },
                        w.shell_type || "shell",
                      ),
                      h(
                        "span",
                        null,
                        (w.url || "") +
                          (w.pass_key ? " · Password/key " + w.pass_key : "") +
                          (w.privilege ? " · Privilege " + w.privilege : "") +
                          (w.status ? " · " + w.status : ""),
                      ),
                    ),
                  ),
                )
              : null,
            (x.gaps || []).length
              ? h(
                  "div",
                  { className: "rt-rep-missing" },
                  "Warning: Reproduction gaps: " + x.gaps.join("; "),
                )
              : null,
          ),
          (x.requests || []).length === 0
            ? h(
                "div",
                { className: "rt-rep-missing" },
                "Warning: No raw request record for this item; cannot reproduce directly — add it with redteam_http_evidence_add",
              )
            : (x.requests || []).map((r, ri) =>
                h(
                  "div",
                  { key: "q" + ri, className: "rt-rep-req" },
                  h(
                    "div",
                    { className: "rt-rep-req-head" },
                    h(
                      "span",
                      null,
                      "Reproduction request " +
                        (ri + 1) +
                        (r.source === "auto"
                          ? " (auto-matched by target path; please verify)"
                          : ""),
                    ),
                    h(
                      "span",
                      { className: "rt-tag" },
                      (r.method || "GET") +
                        " " +
                        (r.status === null || r.status === undefined
                          ? ""
                          : r.status),
                    ),
                    h("div", { className: "rt-spacer" }),
                    h(
                      "button",
                      {
                        className: "rt-btn",
                        style: { padding: "0 6px", fontSize: 11 },
                        onClick: () =>
                          copy(String(r.request || ""), "Request " + (ri + 1)),
                      },
                      "Copy to Yakit",
                    ),
                  ),
                  h(
                    "pre",
                    { className: "rt-rep-http" },
                    r.request ||
                      (r.method || "GET") + " " + (r.url || "") + " HTTP/1.1",
                  ),
                  r.response
                    ? h(
                        "div",
                        null,
                        h(
                          "div",
                          { className: "rt-rep-req-head" },
                          h("span", null, "Response summary"),
                        ),
                        h(
                          "pre",
                          {
                            className: "rt-rep-http",
                            style: { maxHeight: 160 },
                          },
                          String(r.response).slice(0, 1600),
                        ),
                      )
                    : null,
                ),
              ),
          x.note
            ? h(
                "div",
                { className: "rt-rep-meta" },
                h("b", null, "Notes "),
                h("span", null, x.note),
              )
            : null,
        ),
      );

    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Attack score chain reproduction report"),
        summary
          ? h(
              "span",
              { className: "rt-tag rt-tag-live" },
              "Total " + summary.points + " pts",
            )
          : null,
        summary
          ? h("span", { className: "rt-tag" }, summary.count + " scored items")
          : null,
        summary
          ? h(
              "span",
              {
                className:
                  "rt-tag" + (summary.missingRequests ? "" : " rt-tag-live"),
              },
              summary.withRequests + "/" + summary.count + " items with raw requests",
            )
          : null,
        summary
          ? h(
              "span",
              {
                className:
                  "rt-tag" +
                  (summary.incomplete ? " rt-tag-warn" : " rt-tag-live"),
                title:
                  "Whether reproduction chain is complete: has attack steps, actual commands, and linked vulnerabilities/credentials/tunnels",
              },
              "Reproducible " +
                (summary.count - (summary.incomplete || 0)) +
                "/" +
                summary.count,
            )
          : null,
        summary && summary.serviceCappedExcluded
          ? h(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title:
                  (summary.serviceCapped || [])
                    .map((x) => (x.service || "") + "｜" + (x.point_name || ""))
                    .join("\n") ||
                  "Duplicate account/database privilege hits on the same asset and port: service cap reached, not counted and excluded from report",
              },
              "Service cap reached (not counted) " + summary.serviceCappedExcluded,
            )
          : null,
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          {
            className: "rt-btn",
            disabled: busy || !mdText,
            onClick: () => copy(mdText, "Full report"),
          },
          "Copy full text",
        ),
        h(
          "button",
          {
            className: "rt-btn",
            disabled: busy || !mdText,
            onClick: () => download(mdText, (data && data.target) || eng),
          },
          "Download .md",
        ),
        h(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Generating…" : "Regenerate",
        ),
      ),
      msg
        ? h(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok,
          )
        : null,
      err ? h("div", { className: "rt-err" }, err) : null,
      h(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        stages.length
          ? h(
              "div",
              { className: "rt-rep-list" },
              h(
                "div",
                { className: "rt-rep-tools" },
                h(
                  "button",
                  {
                    className: "rt-btn",
                    onClick: () =>
                      collapse.setAll(
                        stages.map((s) => "st:" + s.code),
                        true,
                      ),
                  },
                  "Expand all",
                ),
                h(
                  "button",
                  {
                    className: "rt-btn",
                    onClick: () =>
                      collapse.setAll(
                        stages.map((s) => "st:" + s.code),
                        false,
                      ),
                  },
                  "Collapse all",
                ),
              ),
              stages.map((st) => {
                const open = collapse.isOpen("st:" + st.code, true);
                const toggle = collapse.toggle("st:" + st.code, true);
                return h(
                  "div",
                  { key: "g" + st.code, className: "rt-rep-group" },
                  h(
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
                      },
                    },
                    h("span", { className: "rt-sec-caret" }, open ? "▾" : "▸"),
                    h(
                      "span",
                      {
                        className: "rt-rep-no",
                        style: { background: st.color },
                      },
                      CIRCLED[st.ordinal - 1] || st.ordinal,
                    ),
                    h("span", { className: "rt-rep-stage-name" }, st.name),
                    h(
                      "span",
                      { className: "rt-rep-stage-n" },
                      st.items.length + " items",
                    ),
                    h("div", { className: "rt-spacer" }),
                    h(
                      "span",
                      {
                        className: "rt-rep-pts",
                        style: {
                          background: st.color + "22",
                          color: st.color,
                          borderColor: st.color + "66",
                        },
                      },
                      "+" + st.points + " pts",
                    ),
                    h(
                      "span",
                      { className: "rt-ap-cum" },
                      "Cumulative " + st.cumulative + " pts",
                    ),
                  ),
                  open
                    ? h("div", { className: "rt-rep-body" }, st.items.map(card))
                    : null,
                );
              }),
            )
          : data === null
            ? h("div", { className: "rt-empty" }, "Loading…")
            : h(
                "div",
                { className: "rt-empty" },
                h("div", null, "No deliverable results yet."),
                h(
                  "div",
                  { style: { marginTop: 6, fontSize: 12 } },
                  'This report only includes results that earned points; vulnerabilities without points are excluded. After achieving results, record them with redteam_score_hit (target asset + what was gained) and add redteam_http_evidence_add for reproduction.',
                ),
              ),
      ),
      h(
        "div",
        { className: "rt-foot" },
        h(
          "span",
          null,
          "Scope: only scored results are included, each with a raw request that can be pasted into Yakit Repeater",
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Attack files */
  const FILE_KIND = {
    poc: "POC",
    exp: "EXP",
    script: "Script",
    wordlist: "Wordlist",
    other: "Other",
  };

  function AttackFilesTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [folders, setFolders] = React.useState([]);
    const [err, setErr] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const collapse = useCollapse("files:" + eng);
    const [detail, setDetail] = React.useState(null);

    const load = () => {
      if (!eng) return;
      setBusy(true);
      api({ op: "attackFiles", engagement: eng }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setFolders(r.items || []);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    React.useEffect(load, [eng, refreshKey]);

    const openFile = (f) => {
      if (detail && detail.id === f.id) {
        setDetail(null);
        return;
      }
      setDetail(null);
      api({ op: "readAttackFile", engagement: eng, id: f.id }).then(
        (r) => {
          if (r && r.ok) setDetail(r);
          else setErr((r && r.error) || "Read failed");
        },
        (e) => setErr(String((e && e.message) || e)),
      );
    };

    const rows = [];
    for (const folder of folders) {
      const fKey = "folder:" + folder.folder;
      const fileNodes = [];
      for (const f of folder.files) {
        fileNodes.push(
          h(
            "div",
            {
              key: "a" + f.id,
              className: "rt-vrow",
              style: {
                gridTemplateColumns: "18px 1.2fr 60px 1.6fr",
                cursor: "pointer",
              },
              role: "button",
              tabIndex: 0,
              onClick: () => openFile(f),
              onKeyDown: (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openFile(f);
                }
              },
            },
            h(
              "span",
              { className: "rt-sec-caret" },
              detail && detail.id === f.id ? "▾" : "▸",
            ),
            h("span", { className: "rt-mono" }, f.name),
            h(
              "span",
              null,
              h(
                "span",
                { className: "rt-tag rt-tag-active" },
                FILE_KIND[f.kind] || f.kind || "—",
              ),
            ),
            h(
              "span",
              {
                style: {
                  fontSize: 11.5,
                  color: "var(--dsw-alias-label-secondary)",
                },
                title: f.description || "",
              },
              f.description || "—",
            ),
          ),
        );
        if (!detail || detail.id !== f.id) continue;
        fileNodes.push(
          h(
            "div",
            {
              key: "ad" + f.id,
              className: "rt-vrow",
              style: { cursor: "default", gridTemplateColumns: "1fr" },
            },
            h(
              "div",
              { className: "rt-vdetail" },
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Effect"),
                h("span", null, detail.evidence || "—"),
              ),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Path"),
                h(
                  "span",
                  { className: "rt-mono", style: { wordBreak: "break-all" } },
                  detail.path,
                ),
              ),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Record"),
                h(
                  "span",
                  null,
                  fmt(detail.created_at) +
                    (detail.created_by ? " · " + detail.created_by : ""),
                ),
              ),
              h(
                "pre",
                {
                  className: "rt-md",
                  style: {
                    border: "1px solid var(--dsw-alias-border-l1)",
                    borderRadius: 6,
                    maxHeight: "40vh",
                    padding: "10px 12px",
                  },
                },
                detail.content || "(empty)",
              ),
            ),
          ),
        );
      }
      rows.push(
        h(
          Section,
          {
            key: "sec:" + folder.folder,
            tone: "folder",
            title: folder.folder + "/",
            count: folder.count + " files",
            open: collapse.isOpen(fKey, true),
            onToggle: collapse.toggle(fKey, true),
          },
          fileNodes.length
            ? fileNodes
            : h("div", { className: "rt-atest-meta" }, "(empty)"),
        ),
      );
    }

    const total = folders.reduce((n, f) => n + f.count, 0);
    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Attack files"),
        h(
          "span",
          { className: "rt-tag" },
          folders.length + " targets / " + total + " files",
        ),
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Refreshing…" : "Refresh",
        ),
      ),
      err ? h("div", { className: "rt-err" }, err) : null,
      h(
        "div",
        { className: "rt-table" },
        rows,
        !folders.length
          ? h(
              "div",
              { className: "rt-empty" },
              "No attack files yet (scripts/POCs/EXPs that worked will appear here organized by target folder)",
            )
          : null,
      ),
      h(
        "div",
        { className: "rt-foot" },
        h(
          "span",
          null,
          "Directory: attack-files/<IP|URL host|C segment>/ | only files that actually worked are included",
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Knowledge base (POC/EXP, globally shared) */
  /**
   * Knowledge base page: search here before working on Nday/1day. The search box supports CVE / component / keyword / body text;
   * expand matches to get full content (copy and use directly); if none, find online or craft your own, then add back after verification.
   * This is **global**: not scoped to an engagement; generic POCs saved from one engagement can be reused in future engagements.
   */
  const POC_KIND_LABEL = {
    poc: "POC",
    exp: "EXP",
    script: "Script",
    template: "Template",
    payload: "Payload",
  };
  const POC_SOURCE_LABEL = {
    web: "Internet",
    self: "Hand-crafted",
    manual: "Manual",
    "nuclei-template": "nuclei template",
    kb: "Knowledge base",
  };

  function KnowledgeTab(props) {
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const [q, setQ] = React.useState("");
    const [kind, setKind] = React.useState("");
    const [category, setCategory] = React.useState("");
    const [engagement, setEngagement] = React.useState("");
    const [assetTarget, setAssetTarget] = React.useState("");
    const [grouped, setGrouped] = React.useState(true);
    const [verifiedOnly, setVerifiedOnly] = React.useState(false);
    const [openId, setOpenId] = React.useState(null);
    const [detail, setDetail] = React.useState(null);
    const [detailBusy, setDetailBusy] = React.useState(false);
    const [tplOffset, setTplOffset] = React.useState(0);
    const tplPageSize = 40;

    const query = (over) => {
      const extra = over || {};
      const offset = Object.prototype.hasOwnProperty.call(
        extra,
        "templateOffset",
      )
        ? extra.templateOffset
        : 0;
      setTplOffset(offset);
      const params = Object.assign(
        {
          q: q.trim() || undefined,
          kind: kind || undefined,
          category: category || undefined,
          engagement: engagement || undefined,
          asset_target: assetTarget.trim() || undefined,
          verified: verifiedOnly || undefined,
          templateOffset: offset || 0,
          templateLimit: tplPageSize,
        },
        extra,
      );
      setBusy(true);
      setMsg(null);
      api(Object.assign({ op: "pocSearch" }, params)).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    /* Load full data on first entry and when refresh key changes (search is explicit to avoid calling API while typing) */
    React.useEffect(() => {
      query({
        q: undefined,
        kind: undefined,
        category: undefined,
        engagement: undefined,
        asset_target: undefined,
        verified: undefined,
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
      api({ op: "pocGet", id: id }).then(
        (r) => {
          setDetailBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Read failed" });
            return;
          }
          setDetail(r);
        },
        (e) => {
          setDetailBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    /* Same as report page: await the real result before showing feedback */
    const copy = (text, label) =>
      copyWithFeedback(text, label, (okFlag, message) => {
        setMsg(okFlag ? { ok: message } : { err: message });
      });
    const useIt = (row) => {
      api({ op: "pocUse", id: row.id, used_on: "Manually marked in console" }).then(
        () => {
          setMsg({ ok: "Recorded one reuse: " + row.title });
          query();
        },
        (e) => setMsg({ err: String((e && e.message) || e) }),
      );
    };

    const stats = (data && data.stats) || {
      total: 0,
      verified: 0,
      reused: 0,
      byKind: [],
      bySource: [],
    };
    const items = (data && data.items) || [];
    const tpl = (data && data.templates) || {
      dir: null,
      total: 0,
      matched: 0,
      offset: 0,
      items: [],
      byCategory: [],
    };
    const tplByCat = new Map(
      (tpl.byCategory || []).map((c) => [c.code, c.n || 0]),
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
      return h(
        "div",
        { key: "p" + x.id, className: "rt-kb" + (isOpen ? " open" : "") },
        h(
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
            },
          },
          h("span", { className: "rt-sec-caret" }, isOpen ? "▾" : "▸"),
          h(
            "span",
            { className: "rt-kb-kind k-" + (x.kind || "poc") },
            POC_KIND_LABEL[x.kind] || x.kind || "POC",
          ),
          h("span", { className: "rt-kb-title" }, x.title),
          x.cve
            ? h("span", { className: "rt-tag rt-tag-passive" }, x.cve)
            : null,
          x.component ? h("span", { className: "rt-tag" }, x.component) : null,
          x.verified === 1
            ? h("span", { className: "rt-tag rt-tag-live" }, "Verified")
            : h("span", { className: "rt-tag rt-tag-warn" }, "Unverified"),
          h("div", { className: "rt-spacer" }),
          h(
            "span",
            { className: "rt-tag" },
            POC_SOURCE_LABEL[x.source] || x.source || "—",
          ),
          x.hit_count
            ? h("span", { className: "rt-tag" }, "Reused " + x.hit_count)
            : null,
        ),
        /* Source row: category · affected versions · created · source engagement · discovered asset */
/* showing when and on which asset this knowledge was found */
        h(
          "div",
          { className: "rt-kb-sub" },
          [
            x.category
              ? "Category " + (POC_CAT_NAME[x.category] || x.category)
              : null,
            x.versions ? "Affected versions " + x.versions : null,
            x.language || null,
            x.tags || null,
            "Created " + fmt(x.created_at),
            x.engagement_name || x.engagement_id
              ? "Source engagement " + (x.engagement_name || x.engagement_id)
              : null,
            x.asset_target ? "Discovered asset " + x.asset_target : null,
            x.found_by_agent
              ? "Found by role " + (ROLE_LABEL[x.found_by_agent] || x.found_by_agent)
              : null,
            x.source_url ? "Source " + x.source_url : null,
          ]
            .filter(Boolean)
            .join(" · "),
        ),
        isOpen
          ? h(
              "div",
              { className: "rt-kb-body" },
              detailBusy && !d
                ? h("div", { className: "rt-empty" }, "Reading…")
                : null,
              d
                ? h(
                    "div",
                    null,
                    d.usage
                      ? h(
                          "div",
                          { className: "rt-kv" },
                          h("b", null, "Usage"),
                          h("span", { className: "rt-mono" }, d.usage),
                        )
                      : null,
                    d.description
                      ? h(
                          "div",
                          { className: "rt-kv" },
                          h("b", null, "Description"),
                          h("span", null, d.description),
                        )
                      : null,
                    d.verified_note
                      ? h(
                          "div",
                          { className: "rt-kv" },
                          h("b", null, "Verification evidence"),
                          h("span", null, d.verified_note),
                        )
                      : null,
                    d.used_on
                      ? h(
                          "div",
                          { className: "rt-kv" },
                          h("b", null, "Last used"),
                          h("span", null, d.used_on),
                        )
                      : null,
                    d.path
                      ? h(
                          "div",
                          { className: "rt-kv" },
                          h("b", null, "Stored at"),
                          h("span", { className: "rt-mono" }, d.path),
                        )
                      : null,
                    h(
                      "div",
                      { className: "rt-kb-actions" },
                      h(
                        "button",
                        {
                          className: "rt-btn",
                          disabled: !d.content,
                          onClick: () => copy(d.content || "", "POC content"),
                        },
                        "Copy content",
                      ),
                      h(
                        "button",
                        { className: "rt-btn", onClick: () => useIt(x) },
                        "Record one reuse",
                      ),
                      d.source_url
                        ? h(
                            "button",
                            {
                              className: "rt-btn",
                              onClick: () => copy(d.source_url, "Source link"),
                            },
                            "Copy source",
                          )
                        : null,
                    ),
                    d.content
                      ? h(
                          "pre",
                          { className: "rt-rep-http" },
                          d.content.length > 12000
                            ? d.content.slice(0, 12000) +
                                "\n...(truncated; see stored file for full content)"
                            : d.content,
                        )
                      : h(
                          "div",
                          { className: "rt-empty" },
                          "This entry has metadata only, no content — add content with redteam_poc_update when available",
                        ),
                  )
                : null,
            )
          : null,
      );
    };

    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Knowledge base · POC / EXP"),
        h("span", { className: "rt-tag" }, stats.total + " entries"),
        h(
          "span",
          { className: "rt-tag rt-tag-live" },
          "Verified " + stats.verified,
        ),
        h("span", { className: "rt-tag" }, "Total reused " + (stats.reused || 0)),
        (stats.uncategorized || 0) > 0 &&
          (stats.uncategorized || 0) !== stats.total
          ? h(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title:
                  "These entries are uncategorized: set the category parameter in redteam_poc_add when adding them back",
              },
              "Uncategorized " + stats.uncategorized,
            )
          : null,
        tpl.total
          ? h(
              "span",
              { className: "rt-tag rt-tag-passive" },
              "Local templates " + tpl.total,
            )
          : null,
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          {
            className: "rt-btn" + (grouped ? " rt-btn-primary" : ""),
            title: "Group by category / flat view",
            onClick: () => setGrouped(!grouped),
          },
          grouped ? "Group by category" : "Flat view",
        ),
        h(
          "button",
          { className: "rt-btn", disabled: busy, onClick: () => query() },
          busy ? "Searching…" : "Refresh",
        ),
      ),
      /* Category overview: click to filter by category and see at a glance how many items each category has */
      h(
        "div",
        { className: "rt-kb-cats" },
        (stats.byCategory || [])
          .filter((c) => catShown(c) > 0 || POC_CAT_ORDER.includes(c.code))
          .map((c) =>
            h(
              "span",
              {
                key: c.code,
                className: "rt-concl-i" + (category === c.code ? " on" : ""),
                title:
                  (c.hint || POC_CAT_NAME[c.code] || c.code) +
                  " · Local templates " +
                  (tplByCat.get(c.code) || 0) +
                  " · Knowledge base " +
                  (c.n || 0) +
                  (c.verified ? " (verified " + c.verified + ")" : ""),
                onClick: () => {
                  const next = category === c.code ? "" : c.code;
                  setCategory(next);
                  query({ category: next || undefined });
                },
              },
              h("b", null, String(catShown(c))),
              h(
                "span",
                null,
                (POC_CAT_NAME[c.code] || c.code) +
                  (c.verified ? " (verified " + c.verified + ")" : ""),
              ),
            ),
          ),
      ),
      h(
        "div",
        { className: "rt-kb-filter" },
        h("input", {
          className: "rt-input",
          style: { flex: 1, minWidth: 140 },
          placeholder: "Search CVE / component / keyword (body text included)",
          value: q,
          onChange: (e) => setQ(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") query();
          },
        }),
        h(
          "select",
          {
            className: "rt-input",
            style: { maxWidth: 120 },
            value: category,
            onChange: (e) => {
              setCategory(e.target.value);
              query({ category: e.target.value || undefined });
            },
          },
          h("option", { value: "" }, "All categories"),
          POC_CAT_ORDER.map((k) =>
            h("option", { key: k, value: k }, POC_CAT_NAME[k]),
          ),
        ),
        h(
          "select",
          {
            className: "rt-input",
            style: { maxWidth: 120 },
            value: engagement,
            onChange: (e) => {
              setEngagement(e.target.value);
              query({ engagement: e.target.value || undefined });
            },
          },
          h("option", { value: "" }, "All source engagements"),
          (stats.byEngagement || []).map((e) =>
            h(
              "option",
              { key: e.engagement, value: e.engagement },
              e.engagement + "（" + e.n + "）",
            ),
          ),
        ),
        h("input", {
          className: "rt-input",
          style: { width: 120 },
          placeholder: "Filter by discovered asset",
          value: assetTarget,
          onChange: (e) => setAssetTarget(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter") query();
          },
        }),
        h(
          "select",
          {
            className: "rt-input",
            style: { maxWidth: 110 },
            value: kind,
            onChange: (e) => {
              setKind(e.target.value);
              query({ kind: e.target.value || undefined });
            },
          },
          h("option", { value: "" }, "All types"),
          Object.keys(POC_KIND_LABEL).map((k) =>
            h("option", { key: k, value: k }, POC_KIND_LABEL[k]),
          ),
        ),
        h(
          "label",
          { className: "rt-kb-check" },
          h("input", {
            type: "checkbox",
            checked: verifiedOnly,
            onChange: (e) => {
              setVerifiedOnly(e.target.checked);
              query({ verified: e.target.checked || undefined });
            },
          }),
          "Verified only",
        ),
        h(
          "button",
          { className: "rt-btn rt-btn-primary", onClick: () => query() },
          "Search",
        ),
      ),
      msg
        ? h(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok,
          )
        : null,
      err
        ? h(
            "div",
            { className: "rt-err" },
            /engagement required|unknown op/i.test(err)
              ? /* Older host does not have the knowledge base API yet: explain how to recover */
                "The knowledge base API is provided by the host; the current host is still an old process — fully exit and reopen (official exe / community edition / dsh web), then refresh the page."
              : err,
          )
        : null,
      !err && data && data.dbPath
        ? h(
            "div",
            { className: "rt-foot", style: { marginBottom: 6, fontSize: 11 } },
            "Knowledge base: " +
              data.dbPath +
              (data.root ? " (root " + data.root + ")" : ""),
          )
        : null,
      h(
        "div",
        { className: "rt-table" },
        (() => {
          if (!grouped) return items.map(card);
          /* Grouped rendering: by built-in category order; unknown categories go to "Other" at the end */
          const buckets = new Map();
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
              h(
                "div",
                { key: "g" + code, className: "rt-kb-cat" },
                h(
                  "span",
                  { className: "rt-kb-cat-name" },
                  POC_CAT_NAME[code] || code,
                ),
                h("span", { className: "rt-tag" }, list.length + " entries"),
                h(
                  "span",
                  { className: "rt-tag rt-tag-live" },
                  "Verified " + list.filter((x) => x.verified === 1).length,
                ),
                h("span", { className: "rt-spacer" }),
                h(
                  "span",
                  {
                    style: {
                      fontSize: 11,
                      color: "var(--dsw-alias-label-secondary)",
                    },
                  },
                  "Recently created " +
                    fmt(
                      list
                        .map((x) => x.created_at)
                        .filter(Boolean)
                        .sort()
                        .pop(),
                    ),
                ),
              ),
            );
            for (const x of list) out.push(card(x));
          }
          return out;
        })(),
        tplItems.length
          ? h(
              "div",
              { className: "rt-kb-tpl" },
              h(
                "div",
                { className: "rt-ap-sub" },
                "Local nuclei templates · " +
                  (tplStart + 1) +
                  "–" +
                  (tplStart + tplItems.length) +
                  " / " +
                  tplMatched +
                  "(run directly with `nuclei -t <template path>`)",
              ),
              tplItems.map((t, i) =>
                h(
                  "div",
                  { key: "t" + tplStart + "-" + i, className: "rt-kb-tpl-row" },
                  h("span", { className: "rt-tag" }, t.severity || "—"),
                  t.category
                    ? h(
                        "span",
                        { className: "rt-tag" },
                        POC_CAT_NAME[t.category] || t.category,
                      )
                    : null,
                  h(
                    "span",
                    { className: "rt-mono rt-kb-tpl-path", title: t.path },
                    t.path,
                  ),
                  h(
                    "span",
                    { className: "rt-kb-tpl-name", title: t.name },
                    t.name || "",
                  ),
                  h(
                    "button",
                    {
                      className: "rt-btn",
                      style: { padding: "0 6px", fontSize: 10.5 },
                      onClick: () =>
                        copy("nuclei -t " + t.path + " -u <target>", "Template command"),
                    },
                    "Copy command",
                  ),
                ),
              ),
              h(
                "div",
                { className: "rt-kb-actions" },
                h(
                  "button",
                  {
                    className: "rt-btn",
                    disabled: busy || tplStart <= 0,
                    onClick: () => turnTpl(tplStart - tplPageSize),
                  },
                  "Previous page",
                ),
                h(
                  "button",
                  {
                    className: "rt-btn",
                    disabled: busy || tplStart + tplItems.length >= tplMatched,
                    onClick: () => turnTpl(tplStart + tplPageSize),
                  },
                  "Next page",
                ),
              ),
              tpl.dir
                ? h(
                    "div",
                    { className: "rt-foot" },
                    h("span", null, "Template directory: " + tpl.dir),
                  )
                : null,
            )
          : null,
        data === null ? h("div", { className: "rt-empty" }, "Loading…") : null,
        data !== null && !items.length && !tplItems.length
          ? h(
              "div",
              { className: "rt-empty" },
              h(
                "div",
                null,
                q || kind || verifiedOnly
                  ? "No matches: try different keywords, or search online / craft your own and add it back."
                  : tpl.total
                    ? "The POC/EXP library is still empty; this machine already has " +
                      tpl.total +
                      " nuclei templates, but they are not listed on this page. Fully exit and reopen the client."
                    : tpl.dir
                      ? "The knowledge base is still empty (local template directory exists but has no YAML files; run nuclei -update-templates)."
                      : "The knowledge base is still empty. No local nuclei template library found — run setup.sh or `nuclei -update-templates` on the exercise machine; after installation, \"Local templates N\" will appear here.",
              ),
              h(
                "div",
                { style: { marginTop: 6, fontSize: 12 } },
                "Standard workflow for Nday/1day: 1) search here with redteam_poc_search (also searches local nuclei templates) -> 2) if none, search online (web_search / GitHub / ExploitDB / vendor advisories) or craft your own -> 3) after verifying on a real target, add back with redteam_poc_add for reuse in future engagements.",
              ),
              data.dbPath
                ? h(
                    "div",
                    {
                      style: { marginTop: 6, fontSize: 11 },
                      className: "rt-mono",
                    },
                    "Knowledge base file: " + data.dbPath,
                  )
                : null,
              tpl.dir
                ? h(
                    "div",
                    {
                      style: { marginTop: 6, fontSize: 11 },
                      className: "rt-mono",
                    },
                    "Template directory: " + tpl.dir,
                  )
                : null,
            )
          : null,
      ),
      h(
        "div",
        { className: "rt-foot" },
        h(
          "span",
          null,
          "Globally shared (cross-engagement) | Stored at: pocs/<code>/ | Only generic reusable POCs/EXPs; engagement-specific scripts go to \"Attack files\"",
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Environment adaptation (Windows / non-Kali) */
  /**
   * Inspired by Z3r0\'s "System configuration" approach: paths and keys go into centralized config instead of bash/ps1.
   * Stored at $DSH_HOME/redteam/config.json — users can provide absolute tool paths or a toolkit search directory.
   */
  function EnvTab(props) {
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [draft, setDraft] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [msg, setMsg] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [folderPath, setFolderPath] = React.useState("");

    const applyDraftFrom = (r) => {
      const c = (r && r.config) || {};
      setDraft({
        platform: c.platform || "auto",
        toolkitDir: c.toolkitDir || "",
        nucleiTemplatesDir: c.nucleiTemplatesDir || "",
        binDirsText: (c.binDirs || []).join("\n"),
        tools: Object.assign({}, c.tools || {}),
        env: Object.assign(
          { FOFA_KEY: "", REDTEAM_VPS_HOST: "", REDTEAM_VPS_KEY: "" },
          c.env || {},
        ),
        notes: c.notes || "",
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
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
          applyDraftFrom(r);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    React.useEffect(load, [refreshKey]);

    const save = () => {
      if (!draft) return;
      setBusy(true);
      setMsg(null);
      const config = {
        platform: draft.platform,
        toolkitDir: draft.toolkitDir,
        nucleiTemplatesDir: draft.nucleiTemplatesDir,
        binDirs: String(draft.binDirsText || "")
          .split(/\r?\n/)
          .map((x) => x.trim())
          .filter(Boolean),
        tools: draft.tools,
        env: draft.env,
        notes: draft.notes,
        envAdaptConfigured: true,
        envAdaptSkip: false,
      };
      api({ op: "platformConfigSave", config }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Save failed" });
            return;
          }
          setData(r);
          setMsg({
            ok:
              "Saved to " +
              ((r.config && r.config.path) || "$DSH_HOME/redteam/config.json"),
          });
          applyDraftFrom(r);
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    const assignFolder = () => {
      const dir = String(
        folderPath || (draft && draft.toolkitDir) || "",
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
            setMsg({ err: (r && r.error) || "Auto-assign failed" });
            return;
          }
          setData(r);
          applyDraftFrom(r);
          setMsg({
            ok:
              "Assigned from folder " +
              (r.assignedCount || 0) +
              " tools" +
              (r.nucleiTemplatesDir ? ", and detected nuclei-templates" : ""),
          });
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    const setTool = (id, value) =>
      setDraft((d) =>
        d
          ? Object.assign({}, d, {
              tools: Object.assign({}, d.tools, { [id]: value }),
            })
          : d,
      );
    const setEnv = (key, value) =>
      setDraft((d) =>
        d
          ? Object.assign({}, d, {
              env: Object.assign({}, d.env, { [key]: value }),
            })
          : d,
      );

    const runtime = (data && data.runtime) || {};
    const adapt = (data && data.adapt) || {};
    const tools = (data && data.tools && data.tools.items) || [];
    const found = tools.filter((t) => t.path).length;
    const defaultToolkit =
      (data && data.toolkitDir) || "$DSH_HOME/redteam/toolkit";
    const defaultNuclei =
      (data && data.nucleiTemplatesDir) || defaultToolkit + "/nuclei-templates";

    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Environment adaptation"),
        h(
          "span",
          { className: "rt-tag" },
          runtime.effective === "windows" ? "Windows" : "Linux/Kali",
        ),
        adapt.kali
          ? h("span", { className: "rt-tag rt-tag-live" }, "Kali")
          : null,
        h(
          "span",
          {
            className:
              "rt-tag" + (adapt.ready ? " rt-tag-live" : " rt-tag-warn"),
          },
          adapt.ready ? "Ready · " + (adapt.reason || "") : "Needs configuration",
        ),
        h(
          "span",
          { className: "rt-tag" + (found ? " rt-tag-live" : " rt-tag-warn") },
          "Tools " + found + "/" + tools.length,
        ),
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Reading…" : "Refresh",
        ),
        h(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy || !draft,
            onClick: save,
          },
          "Save",
        ),
      ),
      h(
        "div",
        { className: "rt-pane", style: { minHeight: 0 } },
        err ? h("div", { className: "rt-err" }, err) : null,
        msg
          ? h(
              "div",
              { className: msg.err ? "rt-err" : "rt-foot" },
              msg.err || msg.ok,
            )
          : null,
        h(
          "div",
          {
            className: "rt-card",
            style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.6 },
          },
          adapt.message ||
            "All optional: leave blank for default paths/auto-detection. Filled values override defaults. Keys are only needed for mapping/reverse connections.",
        ),
        h(
          "div",
          {
            className: "rt-card",
            style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.6 },
          },
          h(
            "div",
            { style: { fontWeight: 600, marginBottom: 6 } },
            "Toolkit folder -> auto-assign tools",
          ),
          h(
            "div",
            { style: { marginBottom: 8, opacity: 0.9 } },
            "When all tools are in the same folder (including subdirectories), enter the path and click \"Auto-assign\": it sets toolkitDir and matches nmap / nuclei / fscan etc. by filename below.",
          ),
          h(
            "div",
            { style: { display: "flex", gap: 8, alignItems: "center" } },
            h("input", {
              className: "rt-input",
              style: { flex: 1 },
              placeholder: "e.g. D:\\pentest-tools or /opt/toolkit",
              value: folderPath,
              onChange: (e) => setFolderPath(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") assignFolder();
              },
            }),
            h(
              "button",
              {
                className: "rt-btn rt-btn-primary",
                disabled: busy,
                onClick: assignFolder,
              },
              busy ? "Scanning…" : "Auto-assign",
            ),
          ),
        ),
        data && data.hint
          ? h(
              "div",
              {
                className: "rt-card",
                style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.6 },
              },
              data.hint,
            )
          : null,
        data && data.egress
          ? h(
              "div",
              {
                className: "rt-card",
                style: { margin: "0 0 8px", fontSize: 12, lineHeight: 1.55 },
              },
              h(
                "div",
                { style: { fontWeight: 600, marginBottom: 6 } },
                "Egress status (inspired by Z3r0 egress, read-only)",
              ),
              h(
                "div",
                { className: "rt-mono", style: { fontSize: 11 } },
                "HTTP_PROXY=" + (data.egress.http_proxy || "(empty)"),
              ),
              h(
                "div",
                { className: "rt-mono", style: { fontSize: 11 } },
                "HTTPS_PROXY=" + (data.egress.https_proxy || "(empty)"),
              ),
              h(
                "div",
                { className: "rt-mono", style: { fontSize: 11 } },
                "ALL_PROXY=" + (data.egress.all_proxy || "(empty)"),
              ),
              h(
                "div",
                { className: "rt-mono", style: { fontSize: 11 } },
                "NO_PROXY=" + (data.egress.no_proxy || "(empty)"),
              ),
              h(
                "div",
                { style: { marginTop: 6, opacity: 0.85 } },
                data.egress.note || "",
              ),
            )
          : null,
        !draft
          ? h("div", { className: "rt-empty" }, "Loading…")
          : h(
              "div",
              null,
              h(
                "div",
                { className: "rt-card" },
                h("h4", null, "Platform and directories"),
                h(
                  "div",
                  { style: { display: "grid", gap: 8 } },
                  h(
                    "label",
                    { style: { fontSize: 12 } },
                    "Platform mode",
                    h(
                      "select",
                      {
                        className: "rt-input",
                        style: {
                          display: "block",
                          width: "100%",
                          marginTop: 4,
                        },
                        value: draft.platform,
                        onChange: (e) =>
                          setDraft(
                            Object.assign({}, draft, {
                              platform: e.target.value,
                            }),
                          ),
                      },
                      h("option", { value: "auto" }, "auto (follow local machine, default)"),
                      h("option", { value: "windows" }, "windows"),
                      h("option", { value: "linux" }, "linux"),
                    ),
                  ),
                  h(
                    "label",
                    { style: { fontSize: 12 } },
                    "Toolkit directory toolkitDir (blank = default)",
                    h("input", {
                      className: "rt-input",
                      style: { display: "block", width: "100%", marginTop: 4 },
                      placeholder: "Default: " + defaultToolkit,
                      value: draft.toolkitDir,
                      onChange: (e) =>
                        setDraft(
                          Object.assign({}, draft, {
                            toolkitDir: e.target.value,
                          }),
                        ),
                    }),
                  ),
                  h(
                    "label",
                    { style: { fontSize: 12 } },
                    "nuclei templates directory (blank = auto: toolkit/nuclei-templates)",
                    h("input", {
                      className: "rt-input",
                      style: { display: "block", width: "100%", marginTop: 4 },
                      placeholder: "Default: " + defaultNuclei,
                      value: draft.nucleiTemplatesDir,
                      onChange: (e) =>
                        setDraft(
                          Object.assign({}, draft, {
                            nucleiTemplatesDir: e.target.value,
                          }),
                        ),
                    }),
                  ),
                  h(
                    "label",
                    { style: { fontSize: 12 } },
                    "Tool search directories binDirs (blank = toolkit + PATH only; one per line)",
                    h("textarea", {
                      className: "rt-input",
                      rows: 4,
                      style: {
                        display: "block",
                        width: "100%",
                        marginTop: 4,
                        fontFamily: "var(--dsw-font-mono, monospace)",
                      },
                      placeholder:
                        "Optional. e.g. " +
                        String.fromCharCode(10) +
                        "D:\\tools" +
                        String.fromCharCode(10) +
                        "D:\\pentest-bin",
                      value: draft.binDirsText,
                      onChange: (e) =>
                        setDraft(
                          Object.assign({}, draft, {
                            binDirsText: e.target.value,
                          }),
                        ),
                    }),
                  ),
                ),
              ),
              h(
                "div",
                { className: "rt-card" },
                h("h4", null, "Keys and VPS (blank = no override; process env vars take precedence)"),
                h(
                  "div",
                  { style: { display: "grid", gap: 8 } },
                  ["FOFA_KEY", "REDTEAM_VPS_HOST", "REDTEAM_VPS_KEY"].map((k) =>
                    h(
                      "label",
                      { key: k, style: { fontSize: 12 } },
                      k + " (optional)",
                      h("input", {
                        className: "rt-input",
                        style: {
                          display: "block",
                          width: "100%",
                          marginTop: 4,
                        },
                        type: k === "FOFA_KEY" ? "password" : "text",
                        placeholder:
                          k === "REDTEAM_VPS_KEY"
                            ? "Leave blank; enter absolute private key path when needed"
                            : k === "REDTEAM_VPS_HOST"
                              ? "Leave blank; enter user@host when needed"
                               : "Leave blank; fill in when mapping",
                        value: (draft.env && draft.env[k]) || "",
                        onChange: (e) => setEnv(k, e.target.value),
                      }),
                    ),
                  ),
                ),
              ),
              h(
                "div",
                { className: "rt-card" },
                h("h4", null, "Tool executables (blank = auto-detect)"),
                h(
                  "div",
                  {
                    style: {
                      fontSize: 11.5,
                      color: "var(--dsw-alias-label-secondary)",
                      marginBottom: 8,
                    },
                  },
                  "Resolution order: absolute paths in this table -> toolkitDir -> binDirs -> PATH. Leave blank for default lookup.",
                ),
                tools.map((t) =>
                  h(
                    "div",
                    { key: t.id, style: { marginBottom: 8 } },
                    h(
                      "div",
                      {
                        style: {
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          marginBottom: 4,
                        },
                      },
                      h(
                        "span",
                        { style: { fontWeight: 600, minWidth: 88 } },
                        t.label || t.id,
                      ),
                      t.path
                        ? h(
                            "span",
                            { className: "rt-tag rt-tag-live", title: t.path },
                            t.source + " · Found",
                          )
                        : h(
                            "span",
                            { className: "rt-tag rt-tag-warn" },
                            "Not found (leave blank until installed)",
                          ),
                    ),
                    h("input", {
                      className: "rt-input",
                      style: { width: "100%" },
                      placeholder:
                        "Leave blank to auto-detect: " +
                        (t.names || []).slice(0, 3).join(" / "),
                      value: (draft.tools && draft.tools[t.id]) || "",
                      onChange: (e) => setTool(t.id, e.target.value),
                    }),
                    t.path
                      ? h(
                          "div",
                          {
                            className: "rt-mono",
                            style: {
                              fontSize: 10.5,
                              marginTop: 2,
                              opacity: 0.8,
                            },
                          },
                          t.path,
                        )
                      : null,
                  ),
                ),
              ),
              h(
                "div",
                { className: "rt-card" },
                h("h4", null, "Notes"),
                h("textarea", {
                  className: "rt-input",
                  rows: 3,
                  style: { width: "100%" },
                  placeholder: "Optional. e.g. tools from a portable package",
                  value: draft.notes,
                  onChange: (e) =>
                    setDraft(
                      Object.assign({}, draft, { notes: e.target.value }),
                    ),
                }),
              ),
              h(
                "div",
                { className: "rt-foot" },
                h(
                  "span",
                  null,
                  "Config file: " +
                    ((data && data.config && data.config.path) ||
                      "$DSH_HOME/redteam/config.json") +
                    " | blank fields use defaults",
                ),
              ),
            ),
      ),
    );
  }

  /* ---------------------------------------------------------- Score goals */
  function ScoreTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [openId, setOpenId] = React.useState(null);
    const [form, setForm] = React.useState(null);
    const [msg, setMsg] = React.useState(null);

    const load = () => {
      if (!eng) return;
      setBusy(true);
      api({ op: "scores", engagement: eng }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
    };
    React.useEffect(load, [eng, refreshKey]);

    /* builtin must flow through to the form: scores/names/criteria for built-in score points are locked by "Scoring Rules",
         the UI must disable inputs and explain why — previously it looked editable, said "saved", then reverted on refresh,
         which users thought was a bug. */
    const startEdit = (p) =>
      setForm({
        id: p.id,
        name: p.name,
        category: p.category || "",
        points: p.points,
        description: p.description || "",
        enabled: p.enabled,
        builtin: p.builtin === true,
        src: p.src,
        cap: p.cap,
        rule: p.rule,
      });
    const startNew = () => {
      setForm({
        name: "",
        category: "",
        points: 10,
        description: "",
        enabled: true,
        builtin: false,
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
            setMsg({ err: (r && r.error) || "Save failed" });
            return;
          }
          /* overridden === false means the backend did **not** accept the submitted score (built-in points are locked by rules).
             Do not say "Saved" generically — that would imply the score change succeeded. */
          if (r.overridden === false) {
            setMsg({
              err:
                "Saved enable/disable state. Score unchanged: this is a built-in score point distributed with \"Scoring Rules\", " +
                "scores / caps / criteria are locked by rules (a rule's cap is cumulative across all score points in the group, " +
                "changing one score alone would let a single hit consume the group cap). To customize scores, use \"+ Add score point\".",
            });
          } else {
            setMsg({ ok: r.note || "Saved" });
          }
          setForm(null);
          load();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
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
            setMsg({ err: (r && r.error) || "Delete failed" });
            return;
          }
          setMsg({ ok: "Deleted" });
          setForm(null);
          setOpenId(null);
          load();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    const summary = (data && data.summary) || {
      achievedPoints: 0,
      pointCount: 0,
      hitPointCount: 0,
      hitCount: 0,
      selfCreatedHits: 0,
      serviceCappedHits: 0,
    };
    const items = (data && data.items) || [];

    /* Render grouped by 8 merged categories (backend ruleGroups are pre-sorted, ascending by score within groups).
         Compatibility: fall back to flat list when backend does not provide ruleGroups (older host). */
    const groups =
      data && data.ruleGroups && data.ruleGroups.length
        ? data.ruleGroups
        : [
            {
              key: "all",
              name: "",
              capSum: 0,
              points: 0,
              counted: 0,
              tiers: items,
            },
          ];
    const rows = [];
    for (const g of groups) {
      if (g.name) {
        rows.push(
          h(
            "div",
            { key: "g-" + g.key, className: "rt-score-group" },
            h("span", null, g.name),
            h(
              "span",
              { className: "rt-sg-sub" },
              g.tiers.length +
                " items" +
                (g.capSum > 0
                  ? " · Combined cap " +
                    g.capSum +
                    " pts (each item independent, not cumulative across items)"
                  : ""),
            ),
            h("div", { className: "rt-spacer" }),
            g.points > 0
              ? h(
                  "span",
                  { className: "rt-tag rt-tag-active" },
                  "+" + g.points + " pts",
                )
              : null,
          ),
        );
      }
      for (const p of g.tiers) {
        const achieved = p.hits.length > 0;
        const open = openId === p.id;
        rows.push(
          h(
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
              },
            },
            h("span", { className: "rt-sec-caret" }, open ? "▾" : "▸"),
            h(
              "span",
              null,
              h(
                "span",
                {
                  className: achieved
                    ? "rt-pri rt-pri-high"
                    : "rt-pri rt-pri-low",
                  style: achieved
                    ? {}
                    : {
                        background: "var(--dsw-alias-bg-layer-2)",
                        color: "var(--dsw-alias-label-secondary)",
                      },
                },
                p.points + " pts",
              ),
            ),
            h(
              "span",
              { title: p.description || "" },
              p.name,
              p.tier
                ? h("span", { className: "rt-scope" }, "　" + p.tier)
                : null,
            ),
            /* Hits and caps: how many times counted and cap usage (G3 caps are independent per item; stops counting at cap) */
            h(
              "span",
              {
                title:
                  p.capped > 0
                    ? "Counted " +
                      p.counted +
                      " times, plus " +
                      p.capped +
                      ' entries not counted due to "' +
                      (p.scope_label || "scoring criteria") +
                      '" or cap reached'
                    : p.scope_label || "",
              },
              h(
                "span",
                { className: "rt-sec-count" },
                p.hits.length > 0 ? p.counted + " hits" : "No hits",
              ),
              p.cap > 0
                ? h(
                    "span",
                    { className: "rt-scope" },
                    "  cap " +
                      (p.cap_used === null ? 0 : p.cap_used) +
                      "/" +
                      p.cap,
                  )
                : null,
            ),
            h(
              "span",
              { style: { textAlign: "right" } },
              p.earned > 0
                ? h(
                    "span",
                    { className: "rt-tag rt-tag-active" },
                    "+" + p.earned + " pts",
                  )
                : h(
                    "span",
                    { style: { color: "var(--dsw-alias-label-secondary)" } },
                    "—",
                  ),
            ),
          ),
        );
        if (!open) continue;
        /* Hit records: one per line — first line shows "index + asset + time + copy", content wraps on the next line */
        const hitNodes = p.hits.map((hh, hi) =>
          h(
            "div",
            {
              key: "h" + hh.id,
              className:
                "rt-hit-row" +
                (hh.self_created ? " self-created" : "") +
                (hh.capped ? " service-capped" : ""),
            },
            h("span", { className: "rt-hit-idx" }, String(hi + 1)),
            h(
              "span",
              {
                className: "rt-hit-asset",
                title: hh.target || hh.asset_ip || "",
              },
              hh.asset_ip || hh.target || "No asset specified",
            ),
            hh.self_created
              ? h(
                  "span",
                  {
                    className: "rt-tag rt-tag-warn",
                    title: "Self-registered/self-created accounts do not count as scored access; recorded for process only",
                  },
                  "Self-created · not counted",
                )
              : null,
            hh.capped
              ? h(
                  "span",
                  {
                    className: "rt-tag rt-tag-warn",
                    title:
                      hh.capped_reason ||
                      "Only the highest-scoring entry counts for the same asset and port; this one is not counted",
                  },
                  "Service cap reached · not counted" +
                    (hh.service ? "（" + hh.service + "）" : ""),
                )
              : null,
            hh.shot_count
              ? h(
                  "span",
                  {
                    className: "rt-tag",
                    title: "This hit has evidence screenshots (expand the score point to see representative images)",
                  },
                  "Img " + hh.shot_count,
                )
              : null,
            h("span", { className: "rt-hit-time" }, fmt(hh.recorded_at)),
            h(
              "button",
              {
                className: "rt-btn",
                style: { padding: "0 5px", fontSize: 10.5 },
                title: "Copy this entry",
                onClick: (e) => {
                  e.stopPropagation();
                  copyText(
                    (hh.asset_ip || hh.target || "") +
                      "  " +
                      (hh.evidence || ""),
                  );
                },
              },
              "Copy",
            ),
            hh.evidence
              ? h(
                  "span",
                  { className: "rt-hit-txt", title: hh.evidence },
                  String(hh.evidence).replace(/\n+/g, " "),
                )
              : h(
                  "span",
                  { className: "rt-hit-txt none" },
                  "Account/password/result not provided",
                ),
          ),
        );
        rows.push(
          h(
            "div",
            {
              key: "spd" + p.id,
              className: "rt-score-row",
              style: { cursor: "default", gridTemplateColumns: "1fr" },
            },
            h(
              "div",
              { className: "rt-score-detail" },
              p.description
                ? h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Scoring criteria"),
                    h("span", null, p.description),
                  )
                : null,
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Status"),
                h(
                  "span",
                  null,
                  (p.enabled ? "Enabled" : "Disabled") +
                    " · " +
                    p.points +
                    " pts/hit · Hits " +
                    p.hits.length +
                    " times = " +
                    p.earned +
                    " pts" +
                    (p.self_created
                      ? " (plus " + p.self_created + " self-created not counted)"
                      : "") +
                    (p.capped
                      ? " (plus " + p.capped + " duplicate service hits not counted)"
                      : ""),
                ),
              ),
              p.capped
                ? h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Service cap"),
                    h(
                      "span",
                      null,
                      p.service_summary +
                        "; account and database privileges count only once per same asset and port; obtaining the highest-privilege account fills that service cap",
                    ),
                  )
                : null,
              p.hits.length
                ? h(
                    "div",
                    null,
                    h(ShotStrip, {
                      eng: eng,
                      shots: p.shots,
                      total: p.shot_total,
                      title:
                        "Evidence screenshots · " +
                        (p.shot_total || (p.shots || []).length) +
                        " images",
                    }),
                    h(
                      "div",
                      {
                        className: "rt-section",
                        style: { padding: "6px 0 0" },
                      },
                      "Hit records · " +
                        p.hits.length +
                        "(records asset and credentials only; see report for detailed reproduction)",
                    ),
                    h("div", { className: "rt-hits" }, hitNodes),
                  )
                : h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Hit records"),
                    h(
                      "span",
                      { style: { color: "var(--dsw-alias-label-secondary)" } },
                      "None yet — after achieving results, score with redteam_score_hit: specify target asset + obtained credentials/privileges",
                    ),
                  ),
              h(
                "div",
                { className: "rt-actions" },
                h(
                  "button",
                  {
                    className: "rt-btn",
                    onClick: (e) => {
                      e.stopPropagation();
                      startEdit(p);
                    },
                  },
                  "Edit",
                ),
              ),
            ),
          ),
        );
      }
    }

    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Score goals"),
        /* Show only total points earned; do not show target score or progress bar */
        h(
          "span",
          {
            style: {
              fontSize: 13,
              color: "var(--dsw-alias-label-secondary)",
              marginLeft: 4,
            },
          },
          "Total score",
        ),
        h("span", { className: "rt-total" }, String(summary.achievedPoints)),
        h(
          "span",
          {
            style: { fontSize: 13, color: "var(--dsw-alias-label-secondary)" },
          },
          "pts",
        ),
        h("span", { className: "rt-tag" }, summary.pointCount + " score points"),
        h(
          "span",
          { className: "rt-tag" },
          "Hits " + summary.countedHits + " times",
        ),
        summary.selfCreatedHits
          ? h(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title:
                  "Self-registered/self-created accounts do not count as scored access; recorded for process only (not scored, no cap usage, excluded from reports)",
              },
              "Self-created not counted " + summary.selfCreatedHits,
            )
          : null,
        summary.serviceCappedHits
          ? h(
              "span",
              {
                className: "rt-tag rt-tag-warn",
                title:
                  "Account and database privileges count only once per same asset and port: service cap reached, these duplicate hits are not counted (recorded only)",
              },
              "Service cap reached not counted " + summary.serviceCappedHits,
            )
          : null,
        h("div", { className: "rt-spacer" }),
        h("button", { className: "rt-btn", onClick: startNew }, "+ Add score point"),
        h(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Refreshing…" : "Refresh",
        ),
      ),
      msg
        ? h(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok,
          )
        : null,
      err ? h("div", { className: "rt-err" }, err) : null,
      form
        ? h(
            "div",
            {
              className: "rt-pane",
              style: {
                flex: "none",
                borderBottom: "1px solid var(--dsw-alias-border-l1)",
              },
            },
            /* Built-in score points (builtin): score / name / category are locked by "Scoring Rules"; inputs are disabled.
             Only "Enable / Disable" can be changed. */
            form.builtin
              ? h(
                  "div",
                  { className: "rt-hint", style: { marginBottom: 8 } },
                  h(
                    "b",
                    null,
                    "Built-in score point (from \"Intrusion Scoring Rules (Merged)\")",
                  ),
                  h(
                    "div",
                    { style: { marginTop: 3 } },
                    "Score, cap, criteria, and name are locked by rules — a rule's cap is cumulative across all score points in the group, " +
                      "changing one score alone would let a single hit consume the group cap. You can change \"Enable / Disable\" here; " +
                      "to customize scores, go back and click \"+ Add score point\".",
                  ),
                  form.src !== null && form.src !== undefined
                    ? h(
                        "div",
                        {
                          style: {
                            marginTop: 3,
                            color: "var(--dsw-alias-label-secondary)",
                          },
                        },
                        "Rule number " +
                          form.src +
                          (form.rule ? " · Cap group rule=" + form.rule : "") +
                          (form.cap > 0
                            ? " · Cap " + form.cap + " pts"
                            : " · No cap"),
                      )
                    : null,
                )
              : null,
            h(
              "div",
              { className: "rt-score-form" },
              h("input", {
                className: "rt-input",
                placeholder: "Name (required)",
                value: form.name,
                readOnly: form.builtin === true,
                title: form.builtin ? "Name is locked by rules for built-in score points" : "",
                onChange: (e) => setField("name", e.target.value),
              }),
              h("input", {
                className: "rt-input",
                placeholder: "Category, e.g. Account privilege",
                value: form.category,
                readOnly: form.builtin === true,
                title: form.builtin
                  ? "Category is locked by rules for built-in score points (determines which panel group it belongs to)"
                  : "",
                onChange: (e) => setField("category", e.target.value),
              }),
              h("input", {
                className: "rt-input",
                type: "number",
                placeholder: "Points per hit",
                readOnly: form.builtin === true,
                title: form.builtin
                  ? "Score is locked by \"Scoring Rules\" for built-in score points and cannot be changed here"
                   : "Points per hit for this type; each hit adds this score (subject to the rule cap)",
                value: form.points,
                onChange: (e) => setField("points", Number(e.target.value)),
              }),
              h(
                "select",
                {
                  className: "rt-input",
                  value: form.enabled ? "1" : "0",
                  onChange: (e) => setField("enabled", e.target.value === "1"),
                },
                h("option", { value: "1" }, "Enabled"),
                h("option", { value: "0" }, "Disabled"),
              ),
            ),
            h("input", {
              className: "rt-input",
              style: {
                width: "100%",
                marginBottom: 6,
                boxSizing: "border-box",
              },
              placeholder: "Scoring criteria description",
              value: form.description,
              readOnly: form.builtin === true,
              title: form.builtin ? "Criteria text is locked by rules for built-in score points" : "",
              onChange: (e) => setField("description", e.target.value),
            }),
            h(
              "div",
              { className: "rt-actions" },
              h(
                "button",
                {
                  className: "rt-btn rt-btn-primary",
                  disabled: busy,
                  onClick: save,
                },
                "Save",
              ),
              form.id
                ? form.builtin
                  ? h(
                      "button",
                      {
                        className: "rt-btn",
                        disabled: true,
                        title:
                          "Built-in score points cannot be deleted: removing one would leave a missing rule and omit a result category from reports (it will be restored on next startup). To exclude it from scoring, use \"Disable\" instead.",
                      },
                      "Delete (built-in items cannot be deleted)",
                    )
                  : h(
                      "button",
                      { className: "rt-btn", disabled: busy, onClick: remove },
                      "Delete",
                    )
                : null,
              h(
                "button",
                { className: "rt-btn", onClick: () => setForm(null) },
                "Cancel",
              ),
            ),
          )
        : null,
      h(
        "div",
        { className: "rt-table" },
        h(
          "div",
          { className: "rt-score-row head" },
          h("span", null, ""),
          h("span", null, "Points"),
          h("span", null, "Score points (low to high)"),
          h("span", null, "Hits / Cap"),
          h("span", { style: { textAlign: "right" } }, "Points earned"),
        ),
        rows,
        !items.length
          ? h(
              "div",
              { className: "rt-empty" },
              "No score points yet; click \"+ Add score point\" in the top right",
            )
          : null,
      ),
    );
  }

  /* ---------------------------------------------------------- Collapse base */
  /**
   * Collapse state is persisted to localStorage by "tab + engagement" and remains unchanged after switching tabs/refreshing.
   * Only keys explicitly toggled by the user are recorded; untouched keys use the caller's default.
   */
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
      /* Privacy mode, etc. */
    }
  };

  /** One hook per tab: isOpen(key, defaultOpen) / toggle(key, defaultOpen) / setAll(keys, open) */
  function useCollapse(prefix) {
    const [state, setState] = React.useState(() => collapseLoad(prefix));
    React.useEffect(() => {
      setState(collapseLoad(prefix));
    }, [prefix]);
    const write = (next) => {
      collapseSave(prefix, next);
      setState(next);
    };
    const isOpen = (key, defaultOpen) => {
      const v = state[key];
      return v === undefined ? defaultOpen !== false : v === true;
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
    return { isOpen: isOpen, toggle: toggle, setAll: setAll };
  }

  /**
   * Unified collapse header (L1): chevron fixed on the left, bold title, count follows, time or actions on the right,
   * content indented 12px with a vertical guide line. always=true means "always visible" (not collapsible).
   */
  function Section(props) {
    const always = props.always === true;
    const open = always || props.open === true;
    const head = h(
      "div",
      {
        className:
          "rt-sec t-" + (props.tone || "target") + (always ? " flat" : ""),
        role: always ? undefined : "button",
        tabIndex: always ? undefined : 0,
        "aria-expanded": always ? undefined : open ? "true" : "false",
        onClick: always ? undefined : props.onToggle,
        onKeyDown: always
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (props.onToggle) props.onToggle(e);
              }
            },
      },
      h("span", { className: "rt-sec-caret" }, always ? "▍" : open ? "▾" : "▸"),
      props.title
        ? h("span", { className: "rt-sec-title" }, props.title)
        : null,
      props.count !== undefined && props.count !== null
        ? h("span", { className: "rt-sec-count" }, String(props.count))
        : null,
      props.sub ? h("span", { className: "rt-sec-sub" }, props.sub) : null,
      props.right
        ? h("span", { className: "rt-sec-right" }, props.right)
        : null,
    );
    return h(
      "div",
      { className: "rt-sec-wrap" },
      head,
      open && props.children
        ? h("div", { className: "rt-sec-body" }, props.children)
        : null,
    );
  }

  /** Long text collapse (L3): fixed preview height + fade + expand/copy. */
  function Clip(props) {
    const [open, setOpen] = React.useState(false);
    const text = String(
      props.text === undefined || props.text === null ? "" : props.text,
    );
    if (text.trim() === "") return null;
    return h(
      "div",
      { className: "rt-clip" + (open ? " open" : "") },
      h(
        "div",
        { className: "rt-clip-head" },
        props.label
          ? h("span", { className: "rt-clip-label" }, props.label)
          : null,
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          {
            className: "rt-btn",
            style: { padding: "0 6px", fontSize: 11 },
            onClick: (e) => {
              e.stopPropagation();
              copyText(text);
            },
          },
          "Copy",
        ),
        h(
          "button",
          {
            className: "rt-btn",
            style: { padding: "0 6px", fontSize: 11 },
            onClick: (e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            },
          },
          open ? "Collapse" : "Expand",
        ),
      ),
      h("div", { className: "rt-clip-body" }, text),
    );
  }

  /* ---------------------------------------------------------- Current testing (live) */
  const TEST_STATUS_LABEL = {
    untested: "Untested",
    testing: "Testing",
    tested: "Tested",
    blocked: "Blocked",
    abandoned: "Abandoned",
    no_surface: "No attack surface",
  };

  /**
   * Current testing page: which assets the agent is attacking, what step it is on, and what is queued.
   * Auto-refreshes every 5 seconds; three sections are collapsible, with "Testing" always fully expanded.
   */
  function TestingTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [at, setAt] = React.useState(null);
    const [auto, setAuto] = React.useState(true);
    /* Collapse state is remembered by "tab + engagement"; Testing is always visible and not collapsible */
    const collapse = useCollapse("testing:" + eng);

    /* 5-second polling needs an in-flight guard: when the network is slow or backend stalls, requests pile up,
         and old responses can overwrite new state (appearing as numbers jumping back and forth). */
    const inflight = React.useRef(false);
    const seq = React.useRef(0);
    const load = () => {
      if (!eng || inflight.current) return;
      inflight.current = true;
      const my = ++seq.current;
      api({ op: "activeTests", engagement: eng, limit: 20 })
        .then(
          (r) => {
            if (my !== seq.current) return; /* Engagement switched: this response is stale, discard it */
            if (!r || r.ok === false) {
              setErr((r && r.error) || "Read failed");
              return;
            }
            setErr(null);
            setData(r);
            setAt(new Date());
          },
          (e) => {
            if (my === seq.current) setErr(String((e && e.message) || e));
          },
        )
        .finally(() => {
          if (my === seq.current) inflight.current = false;
        });
    };
    React.useEffect(() => {
      seq.current += 1;
      load();
    }, [eng, refreshKey]);
    React.useEffect(() => {
      if (!eng || !auto) return undefined;
      const timer = setInterval(load, 5000);
      return () => clearInterval(timer);
    }, [eng, auto, refreshKey]);

    const testing = (data && data.testing) || [];
    const recent = (data && data.recent) || [];
    const queue = (data && data.queue) || [];
    const stats = (data && data.stats) || {};

    /* One card per asset: see at a glance who is being attacked, progress, and what was gained */
    const card = (a, past) => {
      const chips = [];
      chips.push(
        h(
          "span",
          {
            key: "sc",
            className:
              "rt-scope rt-scope-" +
              (a.scope === "internal" ? "internal" : "external"),
          },
          a.scope === "internal" ? "Internal network" : "External network",
        ),
      );
      if (a.segment_cidr)
        chips.push(
          h("span", { key: "seg", className: "rt-tag" }, a.segment_cidr),
        );
      if (a.open_ports)
        chips.push(
          h(
            "span",
            { key: "p", className: "rt-tag rt-tag-active" },
            "Open " + a.open_ports + " ports",
          ),
        );
      if (a.vulns)
        chips.push(
          h(
            "span",
            { key: "v", className: "rt-tag rt-tag-live" },
            "Confirmed vulns " + a.vulns,
          ),
        );
      if (a.webshells)
        chips.push(
          h(
            "span",
            { key: "w", className: "rt-tag rt-tag-passive" },
            "WebShell " + a.webshells,
          ),
        );
      if (a.tunnels)
        chips.push(
          h(
            "span",
            { key: "t", className: "rt-tag rt-tag-passive" },
            "Tunnels " + a.tunnels,
          ),
        );
      if (a.priority)
        chips.push(
          h("span", { key: "pr", className: "rt-tag" }, "Ease " + a.priority),
        );
      if (a.blocked_count)
        chips.push(
          h(
            "span",
            {
              key: "b",
              className: "rt-tag",
              style: { color: "#ef4444", borderColor: "#ef444455" },
            },
            "Blocked " + a.blocked_count + " times",
          ),
        );
      const noteLines = a.test_notes
        ? String(a.test_notes)
            .split("\n")
            .slice(-3)
            .map((l) => (l.length > 240 ? l.slice(0, 240) + " …" : l))
        : [];
      return h(
        "div",
        { key: "at" + a.id, className: "rt-atest" + (past ? " past" : "") },
        h(
          "div",
          { className: "rt-atest-head" },
          past ? null : h("span", { className: "rt-live-dot" }),
          h("span", { className: "rt-atest-ip" }, a.ip),
          h(
            "span",
            {
              className:
                "rt-tag " + (a.test_status === "testing" ? "rt-tag-live" : ""),
            },
            TEST_STATUS_LABEL[a.test_status] || a.test_status,
          ),
          h("div", { className: "rt-spacer" }),
          h(
            "span",
            {
              style: {
                fontSize: 11,
                color: "var(--dsw-alias-label-secondary)",
              },
            },
            fmt(a.test_updated_at) +
              (a.test_updated_by ? " · " + a.test_updated_by : ""),
          ),
        ),
        chips.length ? h("div", null, chips) : null,
        a.test_surface
          ? h(
              "div",
              { className: "rt-atest-meta" },
              "Test surface: " + a.test_surface,
            )
          : null,
        a.potential
          ? h("div", { className: "rt-atest-meta" }, "Expected score: " + a.potential)
          : null,
        noteLines.length
          ? h(Clip, { label: "Test notes", text: noteLines.join("\n") })
          : null,
      );
    };

    const concl = (label, value, tone) =>
      h(
        "span",
        { key: label, className: "rt-concl-i", style: { cursor: "default" } },
        h("b", null, String(value || 0)),
        h("span", null, label),
      );
    const conclusion = h(
      "div",
      { className: "rt-concl" },
      concl("Testing", stats.testing, "live"),
      concl("Pending", stats.untested, ""),
      concl("Tested", stats.tested, ""),
      concl("Abandoned", (stats.abandoned || 0) + (stats.blocked || 0), ""),
      concl("No attack surface", stats.no_surface, ""),
      h("div", { className: "rt-spacer" }),
      at
        ? h(
            "span",
            {
              style: {
                fontSize: 11,
                color: "var(--dsw-alias-label-secondary)",
              },
            },
            "Updated at " + at.toLocaleTimeString("en-US", { hour12: false }),
          )
        : null,
      h(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          title: "Expand recently active and pending queue",
          onClick: () =>
            collapse.setAll(
              ["testing:" + eng, "recent:" + eng, "queue:" + eng],
              true,
            ),
        },
        "Expand all",
      ),
      h(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          title: "Show only testing",
          onClick: () =>
            collapse.setAll(
              ["testing:" + eng, "recent:" + eng, "queue:" + eng],
              false,
            ),
        },
        "Collapse all",
      ),
      h(
        "button",
        {
          className: "rt-btn" + (auto ? " rt-btn-primary" : ""),
          style: { padding: "0 7px", fontSize: 11 },
          title: "Auto-refresh every 5 seconds",
          onClick: () => setAuto((x) => !x),
        },
        auto ? "Live · 5s" : "Paused",
      ),
      h(
        "button",
        {
          className: "rt-btn",
          style: { padding: "0 7px", fontSize: 11 },
          onClick: load,
        },
        "Refresh",
      ),
    );

    const body = [];
    /* Testing: always visible, fully expanded (not collapsible) */
    body.push(
      h(
        Section,
        {
          key: "testing",
          tone: "test",
          title: "Testing",
          count: testing.length + " hosts",
          sub: testing.length
            ? "Agent is attacking these assets"
             : "Assets will appear here in real time when the agent starts testing them",
          open: collapse.isOpen("testing:" + eng, true),
          onToggle: collapse.toggle("testing:" + eng, true),
        },
        testing.length
          ? testing.map((a) => card(a, false))
          : h(
              "div",
              { className: "rt-atest-meta", style: { paddingBottom: 4 } },
              "No assets are currently in \"Testing\"",
            ),
      ),
    );

    /* Recently active (collapsed by default, remembered) */
    body.push(
      h(
        Section,
        {
          key: "recent",
          tone: "past",
          title: "Recently active",
          count: recent.length + " hosts",
          sub: "Assets that have been tested",
          open: collapse.isOpen("recent:" + eng, false),
          onToggle: collapse.toggle("recent:" + eng, false),
        },
        recent.length
          ? recent.map((a) => card(a, true))
          : h("div", { className: "rt-atest-meta" }, "None"),
      ),
    );

    /* Pending queue (collapsed by default, remembered) */
    body.push(
      h(
        Section,
        {
          key: "queue",
          tone: "queue",
          title: "Pending queue",
          count: (data ? data.untested || 0 : 0) + " hosts",
          sub: "Prioritized by exploitability and port count",
          open: collapse.isOpen("queue:" + eng, false),
          onToggle: collapse.toggle("queue:" + eng, false),
        },
        queue.length
          ? queue
              .map((a) => card(a, true))
              .concat([
                h(
                  "div",
                  {
                    key: "queueHint",
                    className: "rt-atest-meta",
                    style: { paddingTop: 4 },
                  },
                  "See the \"Asset mapping\" page for the full list (with filtering and sorting)",
                ),
              ])
          : h("div", { className: "rt-atest-meta" }, "No pending assets"),
      ),
    );

    return h(
      "div",
      { className: "rt-main" },
      conclusion,
      err ? h("div", { className: "rt-err" }, err) : null,
      data === null && !err
        ? h("div", { className: "rt-empty" }, "Loading…")
        : null,
      h(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        h("div", { style: { padding: "6px 12px 14px" } }, body),
      ),
    );
  }

  /* ---------------------------------------------------------- Sessions and entry points (WebShell / Tunnel) */
  /**
   * A common problem in internal network operations: forgetting to register WebShells or tunnels, then later "forgetting there are available entry points".
   * This tab centralizes WebShells and tunnels from the fact store, shows connectivity status, and allows one-click host-side checks.
   */
  function SessionTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [data, setData] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const [copied, setCopied] = React.useState(null);

    const load = () => {
      if (!eng) return;
      api({ op: "sessions", engagement: eng }).then(
        (r) => {
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          setData(r);
        },
        (e) => setErr(String((e && e.message) || e)),
      );
    };
    React.useEffect(load, [eng, refreshKey]);

    const probe = () => {
      setBusy(true);
      setMsg(null);
      api({ op: "probeSessions", engagement: eng, timeoutMs: 6000 }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Check failed" });
            load();
            return;
          }
          const on = (r.webshells || []).filter(
            (x) => x.status === "online",
          ).length;
          const act = (r.tunnels || []).filter(
            (x) => x.status === "active",
          ).length;
          setMsg({
            ok:
              "Check complete: WebShells online " +
              on +
              "/" +
              (r.webshells || []).length +
              ", tunnels available " +
              act +
              "/" +
              (r.tunnels || []).length,
          });
          load();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    /* Only show "Copied" when actually written to clipboard; report errors truthfully on failure */
    const copy = (key, text) =>
      copyWithFeedback(text, text, (okFlag, message) => {
        if (!okFlag) {
          setMsg({ err: message });
          return;
        }
        setCopied(key);
        setTimeout(() => setCopied((c) => (c === key ? null : c)), 1500);
      });

    const markTunnel = (t, status) => {
      setMsg(null);
      api({
        op: "updateTunnel",
        engagement: eng,
        id: t.id,
        patch: { status: status, check_note: "Manually marked in UI" },
      }).then(
        () => load(),
        (e) => setMsg({ err: String((e && e.message) || e) }),
      );
    };
    const markShell = (w, status) => {
      setMsg(null);
      api({
        op: "updateWebshell",
        engagement: eng,
        id: w.id,
        patch: { status: status, check_note: "Manually marked in UI" },
      }).then(
        () => load(),
        (e) => setMsg({ err: String((e && e.message) || e) }),
      );
    };

    const sessCollapse = useCollapse("sessions:" + eng);
    const totals = (data && data.totals) || {};
    const shells = (data && data.webshells) || [];
    const tunnels = (data && data.tunnels) || [];
    const statusDot = (s) =>
      h("span", {
        className:
          s === "online" || s === "active"
            ? "rt-dot-on"
            : s === "unknown" || !s
              ? "rt-dot-unk"
              : "rt-dot-off",
      });
    /* Cards use unified "label + value" two-column layout with wrapping for long text — easier to scan than dot-separated single lines */
    const fact = (label, value) =>
      h(
        "div",
        { className: "rt-sess-fact" },
        h("b", null, label),
        h("span", null, value),
      );
    /* Delivery requirement: webshell must be Behinder/Godzilla encrypted (so users can connect); internal network must use suo5 tunnel */
    const isEncryptedShell = (t) =>
      /behinder|godzilla/i.test(String(t || ""));
    const isSuo5 = (t) => /suo5/i.test(String(t || ""));
    /* Tip bar: one conclusion + expandable instructions (previously three long explanations were flattened and overwhelmed the content) */
    const hint = (key, title, detail) =>
      h(
        "div",
        { key, className: "rt-hint" },
        h("b", null, title),
        h(
          "details",
          { className: "rt-sess-fold", style: { marginTop: 3 } },
          h("summary", null, "How to do it (click to expand)"),
          h("div", { style: { marginTop: 4 } }, detail),
        ),
      );
    const hints = [];
    const badShells = shells.filter((w) => !isEncryptedShell(w.shell_type));
    const legitTunnels = tunnels.filter((t) => t.legit === true);
    if (badShells.length > 0) {
      hints.push(
        hint(
          "h1",
          "There are " +
            badShells.length +
            " entries that are not Behinder/Godzilla webshells (users cannot connect; not deliverable entry points)",
          "Use the webshell-toolkit skill to re-upload a Behinder or Godzilla webshell, " +
            "and record shell_type + pass_key via redteam_webshell_add. If used only as a temporary relay, note it in remarks.",
        ),
      );
    }
    if (tunnels.length > 0 && legitTunnels.length === 0) {
      hints.push(
        hint(
          "h3",
          "Existing " +
            tunnels.length +
            ' channels do not count as "crossing the engagement boundary" (not a boundary/internal breach)',
          "socks5, frp, or proxies opened on your own VPS/self-hosted server do not count as tunnels. Channels must be initiated from the target side: " +
            "target reverse shell to us, frp/Stowaway client running on target, or suo5/HTTP tunnel via target WebShell; specify with entry_kind when registering.",
        ),
      );
    }
    const activeSuo5 = tunnels.filter(
      (t) => isSuo5(t.kind) && t.status === "active",
    );
    if (shells.length > 0 && activeSuo5.length === 0) {
      hints.push(
        hint(
          "h2",
          "No available suo5 tunnel yet (standard channel for internal network access)",
          "Use the suo5-tunnel skill to create a socks5 tunnel through the WebShell above, then register with redteam_tunnel_add" +
            "(kind=suo5, listen=127.0.0.1:1080, entry=WebShell URL, reach=reachable subnets), " +
            "then click \"Check connectivity\" to confirm status=active.",
        ),
      );
    }

    const shellCards = shells.map((w) =>
      h(
        "div",
        { key: "w" + w.id, className: "rt-sess" },
        h(
          "div",
          { className: "rt-sess-head" },
          statusDot(w.status),
          h("span", { className: "rt-sess-title" }, w.url),
          h(
            "span",
            { className: "rt-tag rt-tag-active" },
            w.shell_type || "webshell",
          ),
          isEncryptedShell(w.shell_type)
            ? null
            : h("span", { className: "rt-tag rt-tag-warn" }, "User cannot connect"),
          w.privilege ? h("span", { className: "rt-tag" }, w.privilege) : null,
          h("div", { className: "rt-spacer" }),
          copied === "cmd" + w.id
            ? h(
                "span",
                { className: "rt-tag", style: { color: "#10b981" } },
                "Copied",
              )
            : h(
                "button",
                {
                  className: "rt-btn",
                  style: { padding: "0 6px", fontSize: 11 },
                  onClick: () => copy("cmd" + w.id, 'curl -s "' + w.url + '"'),
                },
                "Copy URL",
              ),
          h(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => markShell(w, "offline"),
            },
            "Mark invalid",
          ),
        ),
        h(
          "div",
          { className: "rt-sess-facts" },
          fact(
            "Type",
            isEncryptedShell(w.shell_type)
              ? "Encrypted webshell (Behinder/Godzilla, user can connect directly)"
              : "Non-encrypted webshell — user cannot connect, temporary relay only",
          ),
          w.pass_key
            ? fact("Connection password", h("span", { className: "rt-mono" }, w.pass_key))
            : null,
          w.asset_ip ? fact("Asset", w.asset_ip) : null,
          w.privilege ? fact("Privilege", w.privilege) : null,
          w.secret_ref
            ? fact(
                "Credential reference",
                h("span", { className: "rt-mono" }, w.secret_ref),
              )
            : null,
          fact(
            "Last check",
            (w.last_check ? fmt(w.last_check) : "Not checked") +
              (w.latency_ms !== null && w.latency_ms !== undefined
                ? "（" + w.latency_ms + "ms）"
                : ""),
          ),
          w.check_note ? fact("Check note", w.check_note) : null,
          w.note ? fact("Notes", w.note) : null,
        ),
      ),
    );

    const tunnelCards = tunnels.map((t) => {
      const proxy = t.listen ? "socks5://" + t.listen : "";
      const gogoCmd = t.listen
        ? "./gogo -i <internal-CIDR> -m ss --ping -p top2,win,db --proxy " + proxy
        : "";
      const fscanCmd = t.listen
        ? "./fscan -h <internal-CIDR> -np -nobr -nopoc -socks5 " +
          t.listen +
          " -o intranet.txt"
        : "";
      return h(
        "div",
        { key: "t" + t.id, className: "rt-sess" },
        h(
          "div",
          { className: "rt-sess-head" },
          statusDot(t.status),
          h(
            "span",
            { className: "rt-sess-title" },
            t.listen || "(No listen address)",
          ),
          h("span", { className: "rt-tag rt-tag-passive" }, t.kind || "tunnel"),
          isSuo5(t.kind)
            ? null
            : h(
                "span",
                { className: "rt-tag rt-tag-warn" },
                "Non-standard suo5 channel",
              ),
          /* Only channels crossing the engagement boundary count as breach evidence (channels opened on your own VPS/self-hosted server do not count) */
          t.legit === true
            ? h(
                "span",
                {
                  className: "rt-tag rt-tag-live",
                  title: t.entry_kind_label || "",
                },
                "Target-side channel",
              )
            : t.legit === false
              ? h(
                  "span",
                  {
                    className: "rt-tag rt-tag-warn",
                    title:
                      "Channel opened only on your own VPS/self-hosted server, does not reach target — not a boundary/internal breach",
                  },
                  "Not a breach",
                )
              : h(
                  "span",
                  {
                    className: "rt-tag",
                    title:
                      "entry_kind not declared: specify what the target-side endpoint is (target-outbound / target-http / target-agent)",
                  },
                  "Pending confirmation",
                ),
          t.reach
            ? h("span", { className: "rt-tag" }, "Reachable " + t.reach)
            : null,
          h("div", { className: "rt-spacer" }),
          h(
            "button",
            {
              className: "rt-btn",
              style: { padding: "0 6px", fontSize: 11 },
              onClick: () => copy("sock" + t.id, t.listen || ""),
            },
            copied === "sock" + t.id ? "Copied" : "Copy address",
          ),
          t.status === "active"
            ? h(
                "button",
                {
                  className: "rt-btn",
                  style: { padding: "0 6px", fontSize: 11 },
                  onClick: () => markTunnel(t, "down"),
                },
                "Mark invalid",
              )
            : h(
                "button",
                {
                  className: "rt-btn",
                  style: { padding: "0 6px", fontSize: 11 },
                  onClick: () => markTunnel(t, "active"),
                },
                "Mark active",
              ),
        ),
        h(
          "div",
          { className: "rt-sess-facts" },
          fact("Target-side entry", t.entry || "Not registered"),
          fact(
            "Crosses boundary",
            t.legit === true
              ? h(
                  "span",
                  { className: "rt-tag rt-tag-live" },
                  t.entry_kind_label || t.entry_kind || "Target side confirmed",
                )
              : t.legit === false
                ? h(
                    "span",
                    { className: "rt-tag rt-tag-warn" },
                    "Not a breach (proxy only on your own VPS)",
                  )
                : h(
                    "span",
                    { className: "rt-tag" },
                    "entry_kind not declared, pending confirmation",
                  ),
          ),
          t.reach ? fact("Reachable subnets", t.reach) : null,
          t.asset_ip ? fact("Asset", t.asset_ip) : null,
          fact(
            "Last check",
            (t.last_check ? fmt(t.last_check) : "Not checked") +
              (t.latency_ms !== null && t.latency_ms !== undefined
                ? "（" + t.latency_ms + "ms）"
                : ""),
          ),
          t.check_note ? fact("Check note", t.check_note) : null,
          t.note ? fact("Notes", t.note) : null,
        ),
        /* Commands collapsed by default: primary info is whether the channel works and where it leads; expand commands on demand */
        t.command
          ? h(
              "details",
              { className: "rt-sess-fold" },
              h("summary", null, "Setup command (click to expand / copy)"),
              h(
                "div",
                Object.assign(
                  { className: "rt-code", title: "Click to copy" },
                  clickable(() => copy("c" + t.id, t.command), {
                    label: "Copy command",
                  }),
                ),
                copied === "c" + t.id ? "Copied" : t.command,
              ),
            )
          : null,
        t.status === "active" && t.listen
          ? h(
              "details",
              { className: "rt-sess-fold" },
              h("summary", null, "Scan through this tunnel (gogo / fscan commands)"),
              h(
                "div",
                { className: "rt-sess-cmd" },
                h(
                  "div",
                  Object.assign(
                    { className: "rt-code", title: "Click to copy" },
                    clickable(() => copy("g" + t.id, gogoCmd), {
                      label: "Copy gogo command",
                    }),
                  ),
                  copied === "g" + t.id ? "Copied" : gogoCmd,
                ),
                h(
                  "div",
                  Object.assign(
                    {
                      className: "rt-code",
                      style: { display: "block", marginTop: 3 },
                      title: "Click to copy",
                    },
                    clickable(() => copy("f" + t.id, fscanCmd), {
                      label: "Copy fscan command",
                    }),
                  ),
                  copied === "f" + t.id ? "Copied" : fscanCmd,
                ),
              ),
            )
          : null,
      );
    });

    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Sessions and entry points"),
        h(
          "span",
          { className: "rt-tag" },
          "WebShell " +
            (totals.webshellsOnline || 0) +
            "/" +
            (totals.webshells || 0) +
            " online",
        ),
        h(
          "span",
          { className: "rt-tag" },
          "Tunnels " +
            (totals.tunnelsActive || 0) +
            "/" +
            (totals.tunnels || 0) +
            " available",
        ),
        h("span", { className: "rt-tag" }, "Credentials " + (totals.credentials || 0)),
        h("span", { className: "rt-tag" }, "Access sessions " + (totals.access || 0)),
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy,
            onClick: probe,
          },
          busy ? "Checking…" : "Check connectivity",
        ),
        h("button", { className: "rt-btn", onClick: load }, "Refresh"),
      ),
      msg
        ? h(
            "div",
            { className: msg.err ? "rt-err" : "rt-foot" },
            msg.err || msg.ok,
          )
        : null,
      err ? h("div", { className: "rt-err" }, err) : null,
      h(
        "div",
        { className: "rt-body", style: { overflow: "auto" } },
        !shells.length && !tunnels.length
          ? h(
              "div",
              { className: "rt-empty" },
              h("div", null, "No WebShells or tunnels registered yet."),
              h(
                "div",
                { style: { marginTop: 6, fontSize: 12 } },
                "Register WebShells with redteam_webshell_add; register tunnels with redteam_tunnel_add (suo5 / socks5 / ssh -R); agents can then see them via redteam_sessions.",
              ),
            )
          : null,
        hints.length
          ? h("div", { style: { padding: "8px 10px 0" } }, hints)
          : null,
        h(
          Section,
          {
            key: "webshells",
            tone: "queue",
            title: "WebShell",
            count:
              (totals.webshellsOnline || 0) +
              "/" +
              (totals.webshells || 0) +
              " online",
            sub: "Online controllable entry points",
            open: sessCollapse.isOpen("shells", true),
            onToggle: sessCollapse.toggle("shells", true),
          },
          shells.length
            ? h(
                "div",
                { className: "rt-sess-grid", style: { padding: 0 } },
                shellCards,
              )
            : h(
                "div",
                { className: "rt-atest-meta" },
                "None (register with redteam_webshell_add after obtaining a WebShell)",
              ),
        ),
        h(
          Section,
          {
            key: "tunnels",
            tone: "test",
            title: "Internal network tunnels",
            count:
              (totals.tunnelsActive || 0) +
              "/" +
              (totals.tunnels || 0) +
              " available",
            sub: "Can be used directly as scanner proxies",
            open: sessCollapse.isOpen("tunnels", true),
            onToggle: sessCollapse.toggle("tunnels", true),
          },
          tunnels.length
            ? h(
                "div",
                { className: "rt-sess-grid", style: { padding: 0 } },
                tunnelCards,
              )
            : h(
                "div",
                { className: "rt-atest-meta" },
                "None (register with redteam_tunnel_add after creating a tunnel)",
              ),
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Error boundary */
  /**
   * When a single tab fails to render, only degrade that tab without breaking the entire panel: panel and sidebar buttons remain usable,
   * and users can return to asset mapping with one click. (Previously the whole panel disappeared and buttons became unclickable without this protection.)
   */
  class RtBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { error: null };
    }
    static getDerivedStateFromError(error) {
      return { error: error };
    }
    componentDidCatch(error) {
      try {
        console.error("[redteam-ui] Page render error:", error);
      } catch (e) {
        /* ignore */
      }
    }
    render() {
      if (this.state.error) {
        const msg =
          this.state.error && this.state.error.message
            ? this.state.error.message
            : String(this.state.error);
        return h(
          "div",
          { className: "rt-pane" },
          h("div", { className: "rt-err" }, "This page failed to render: " + msg),
          h(
            "button",
            {
              className: "rt-btn",
              onClick: () => {
                this.setState({ error: null });
                setUI({ tab: "assets" });
              },
            },
            "Back to asset mapping",
          ),
        );
      }
      return this.props.children;
    }
  }

  /**
   * Agents tab: concurrency slots (max 3) + six roles and their prompts.
   * The main session checks slots here before dispatching work; users can also see at a glance how many agents can still be launched.
   */
  function AgentsTab(props) {
    const eng = props.engagement;
    const refreshKey = props.refreshKey || 0;
    const [roles, setRoles] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [concurrency, setConcurrency] = React.useState(null);
    const [busy, setBusy] = React.useState(false);

    const load = () => {
      setBusy(true);
      api({
        op: eng ? "prompts" : "bootstrap",
        engagement: eng || undefined,
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Read failed");
            return;
          }
          setErr(null);
          if (r.roles) setRoles(r.roles);
        },
        (e) => {
          setBusy(false);
          setErr(String((e && e.message) || e));
        },
      );
      /* Concurrency slots are based on currently running sub-agents; the host reads the subagents registry */
      api({ op: "agentsStatus" }).then(
        (r) => {
          if (r && r.ok !== false) setConcurrency(r);
        },
        () => {},
      );
    };
    React.useEffect(load, [eng, refreshKey]);

    const used = concurrency ? concurrency.used : null;
    const max = concurrency ? concurrency.max : 3;
    return h(
      "div",
      { className: "rt-main" },
      h(
        "div",
        { className: "rt-toolbar" },
        h("span", { style: { fontWeight: 600 } }, "Operations agent"),
        h("span", { className: "rt-tag rt-tag-passive" }, "Concurrency limit " + max),
        used === null
          ? h("span", { className: "rt-tag" }, "Usage unknown")
          : h(
              "span",
              {
                className:
                  "rt-tag" + (used >= max ? " rt-tag-warn" : " rt-tag-live"),
              },
              "Running " + used + " / Available " + Math.max(max - used, 0),
            ),
        h("div", { className: "rt-spacer" }),
        h(
          "button",
          { className: "rt-btn", disabled: busy, onClick: load },
          busy ? "Reading…" : "Refresh",
        ),
      ),
      h(
        "div",
        { className: "rt-pane" },
        err ? h("div", { className: "rt-err" }, err) : null,
        h(
          "div",
          { className: "rt-card" },
          h("h4", null, "Concurrency rules (hard constraints)"),
          h(
            "div",
            { style: { fontSize: 12, lineHeight: 1.7 } },
            "- **At most " +
              max +
              " execution agents at the same time** per engagement; the main session must reserve a slot with `redteam_agent_slot` before dispatching, and reject when full.",
            h("br"),
            "- **Dispatch one at a time and proceed sequentially by default**; parallelize only tasks that are truly independent.",
            h("br"),
            "- Each session has **its own engagement binding**: parallel sessions do not mix up reports (sub-agents inherit the parent session engagement).",
          ),
        ),
        h(
          "div",
          { className: "rt-card" },
          h("h4", null, "Six roles"),
          h(
            "div",
            { style: { fontSize: 12, lineHeight: 1.8 } },
            "1. Reconnaissance `recon` — collect assets only; cover all organization assets (including edge and unregistered assets)",
            h("br"),
            "2. Asset assessment `assess` — review each asset, assess exploitability, and store all results",
            h("br"),
            "3. Vulnerability discovery `vuln-scan` — dedupe against database first -> prioritize Nday/1day -> probe for unauthorized interfaces",
            h("br"),
            "4. Exploitation `exploit` — obtain server access first (Behinder/Godzilla webshell) + establish suo5 tunnel, then pursue other scoring items",
            h("br"),
            "5. Internal penetration `internal` — go through tunnels and run 1-2-3-4 in sequence for the internal network",
            h("br"),
            "6. Main session `plan` — planning, dispatch, summarization, and reporting only; no hands-on execution",
          ),
        ),
        h(ConcurrencyCard, { concurrency, onSaved: load }),
        h(
          "div",
          { className: "rt-card" },
          h("h4", null, "Role prompts (stored per engagement, editable here)"),
          h(
            "div",
            {
              style: {
                fontSize: 11.5,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 6,
              },
            },
            "\"Agent prompts\" has been merged into this page; below is the full editor (save after changes; affects current engagement only).",
          ),
          h(PromptsTab, { engagement: eng, refreshKey: refreshKey }),
        ),
      ),
    );
  }

  function ConcurrencyCard(props) {
    const info = props.concurrency || {};
    const [draft, setDraft] = React.useState("");
    const [busy, setBusy] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    React.useEffect(() => {
      if (info.max) setDraft(String(info.max));
    }, [info.max]);

    const limit = info.limit || 10;
    const used = typeof info.used === "number" ? info.used : null;
    const source =
      info.source === "settings"
        ? "Set in panel"
        : info.source === "env"
          ? "Environment variable REDTEAM_MAX_AGENTS"
           : "Default";
    const n = Number(draft);
    const invalid =
      !Number.isFinite(n) || Math.floor(n) !== n || n < 1 || n > limit;
    const save = () => {
      if (invalid) return;
      setBusy(true);
      setMsg(null);
      api({ op: "setAgentsMax", max: n }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Save failed" });
            return;
          }
          setMsg({
            ok: "Saved: concurrency limit " + r.max + " (effective immediately, no restart required)",
          });
          if (props.onSaved) props.onSaved();
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };
    return h(
      "div",
      { className: "rt-card" },
      h("h4", null, "Concurrency count"),
      h(
        "div",
        { style: { fontSize: 12, lineHeight: 1.8, marginBottom: 8 } },
        "**Maximum execution agents at the same time** per engagement. Currently effective: **" +
          (info.max || "?") +
          "**" +
          (used === null
            ? ""
             : " (running " +
              used +
              ", available " +
              Math.max((info.max || 0) - used, 0) +
              "）") +
          ", source: " +
          source +
          ". Changes take effect **immediately**, no restart required.",
      ),
      h(
        "div",
        {
          style: {
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          },
        },
        h("input", {
          className: "rt-input",
          style: { width: 90 },
          type: "number",
          min: 1,
          max: limit,
          value: draft,
          onChange: (e) => setDraft(e.target.value),
        }),
        h(
          "span",
          {
            style: {
              fontSize: 11.5,
              color: "var(--dsw-alias-label-secondary)",
            },
          },
          "Range 1 - " + limit,
        ),
        h(
          "button",
          {
            className: "rt-btn rt-btn-primary",
            disabled: busy || invalid,
            onClick: save,
          },
          busy ? "Saving…" : "Save",
        ),
        msg && msg.err
          ? h(
              "span",
              { style: { fontSize: 12, color: "var(--rt-danger, #d33)" } },
              msg.err,
            )
          : null,
        msg && msg.ok
          ? h(
              "span",
              {
                style: {
                  fontSize: 12,
                  color: "var(--dsw-alias-label-secondary)",
                },
              },
              msg.ok,
            )
          : null,
      ),
      h(
        "div",
        { className: "rt-note", style: { marginTop: 8 } },
        "Warning: increasing does not mean faster: **concurrency/rate limits are shared for the same model API key**; dispatching too many at once causes contention, " +
          "leading to queuing, timeouts, truncated responses, or rate-limit errors — making test results unstable (missed tests, incomplete runs). " +
          "Start with 2-3, and increase only when the key quota is sufficient and tasks are truly independent.",
      ),
    );
  }

  /**
   * Version display + auto-update button.
   *
   * Behavior: silently check latest version on mount (npm registry); if a new version exists, highlight the button as
   * "New version vX"; clicking opens a confirmation dialog (current version / latest version / install location / blockers),
   * after confirmation the host performs install -> restart dsh web (page will disconnect; refresh after restart).
   */
  function VersionBar(props) {
    const [info, setInfo] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [busy, setBusy] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [msg, setMsg] = React.useState(null);
    const [countdown, setCountdown] = React.useState(0);
    const countdownRef = React.useRef(null);
    const clearCountdown = React.useCallback(() => {
      if (countdownRef.current) {
        try {
          clearInterval(countdownRef.current);
        } catch {
          /* ignore */
        }
      }
      countdownRef.current = null;
    }, []);
    React.useEffect(() => () => clearCountdown(), [clearCountdown]);
    const closeModal = React.useCallback(() => {
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
            /* Dev mode or registry unavailable: show current version only, no error to disturb user */
            if (!silent) setErr((r && r.error) || "Update check failed");
            api({ op: "version" }).then(
              (v) => {
                if (v && v.ok !== false) setInfo(v);
              },
              () => {},
            );
            return;
          }
          setErr(null);
          setInfo(r);
        },
        (e) => {
          setBusy(false);
          if (!silent) setErr(String((e && e.message) || e));
          api({ op: "version" }).then(
            (v) => {
              if (v && v.ok !== false) setInfo(v);
            },
            () => {},
          );
        },
      );
    };
    React.useEffect(() => {
      check(true);
    }, []);

    const apply = () => {
      setBusy(true);
      setMsg(null);
      api({
        op: "updateApply",
        target: (info && info.latest) || undefined,
      }).then(
        (r) => {
          setBusy(false);
          if (!r || r.ok === false) {
            setMsg({ err: (r && r.error) || "Update failed" });
            return;
          }
          setMsg({
            ok: "Installed " + (r.installed || "") + ", restarting current host...",
          });
          /* Restart will disconnect this page: countdown prompts user to refresh later */
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
          }, 1000);
        },
        (e) => {
          setBusy(false);
          setMsg({ err: String((e && e.message) || e) });
        },
      );
    };

    const current =
      info && info.current
        ? info.current
        : info && info.plugin
          ? info.plugin.version
          : null;
    const latest = info && info.latest ? info.latest : null;
    const hasNew = !!(info && info.updateAvailable);
    const blockers = (info && info.blockers) || [];
    const notes = (info && info.notes) || [];
    const mode = info && info.install ? info.install.mode : null;

    return h(
      "span",
      { style: { display: "inline-flex", alignItems: "center", gap: 6 } },
      h(
        "span",
        {
          className: "rt-tag" + (hasNew ? " rt-tag-warn" : ""),
          title:
            "Current version " +
            (current || "Unknown") +
            (latest ? "\nLatest version " + latest : "") +
            (mode === "dev"
              ? "\nInstall method: Development (source symlink)"
              : mode === "package"
                 ? "\nInstall method: Package install"
                : "") +
            (info && info.check_error ? "\nCheck failed: " + info.check_error : ""),
        },
        "v" + (current || "?"),
      ),
      hasNew
        ? h(
            "button",
            {
              className: "rt-btn rt-btn-primary",
              disabled: busy,
              onClick: () => {
                setOpen(true);
                setMsg(null);
              },
              title:
                "New version found " +
                latest +
                ": click to view and update with one click (will restart current host)",
            },
            busy ? "Checking…" : "New version v" + latest,
          )
        : h(
            "button",
            {
              className: "rt-btn",
              disabled: busy,
              onClick: () => check(false),
              title: "Recheck latest version on npm",
            },
            busy ? "Checking…" : "Check for updates",
          ),
      open
        ? h(
            "div",
            {
              className: "rt-modal",
              "aria-hidden": "true",
              onClick: closeModal,
            },
            h(
              "div",
              {
                className: "rt-modal-box",
                onClick: (e) => e.stopPropagation(),
              },
              h("h4", { style: { marginTop: 0 } }, "Update RedTeam mode"),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Current version"),
                h("span", null, current || "Unknown"),
              ),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Latest version"),
                h("span", null, latest || "Unknown"),
              ),
              h(
                "div",
                { className: "rt-kv" },
                h("b", null, "Install method"),
                h(
                  "span",
                  null,
                  mode === "dev"
                    ? "Development (source symlink)"
                    : mode === "package"
                      ? "Package install (" +
                        ((info.install && info.install.packageManager) ||
                          "npm") +
                        "）"
                      : "Unknown",
                ),
              ),
              info && info.install && info.install.dir
                ? h(
                    "div",
                    { className: "rt-kv" },
                    h("b", null, "Install location"),
                    h("span", { className: "rt-mono" }, info.install.dir),
                  )
                : null,
              blockers.length
                ? h(
                    "div",
                    { className: "rt-hint" },
                    h(
                      "div",
                      { style: { fontWeight: 600, marginBottom: 4 } },
                      "Cannot update now: ",
                    ),
                    blockers.map((b, i) =>
                      h("div", { key: "b" + i }, "· " + b),
                    ),
                  )
                : null,
              notes.length
                ? h(
                    "div",
                    { className: "rt-foot", style: { padding: "4px 0" } },
                    notes.map((n, i) => h("div", { key: "n" + i }, n)),
                  )
                : null,
              h(
                "div",
                {
                  style: {
                    fontSize: 12,
                    color: "var(--dsw-alias-label-secondary)",
                    margin: "8px 0",
                  },
                },
                "Update process: install new version -> automatically restart current host (official exe / community edition / dsh web; this page will disconnect and auto-refresh after ~5-10 seconds). " +
                  "Before restart, checks if any agents are running and blocks if so.",
              ),
              msg
                ? h(
                    "div",
                    { className: msg.err ? "rt-err" : "rt-foot" },
                    msg.err || msg.ok,
                  )
                : null,
              countdown > 0
                ? h(
                    "div",
                    { className: "rt-foot" },
                    "Host is restarting, page will auto-refresh in " + countdown + " seconds...",
                  )
                : null,
              h(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 10,
                  },
                },
                h(
                  "button",
                  { className: "rt-btn", onClick: closeModal },
                  "Close",
                ),
                h(
                  "button",
                  {
                    className: "rt-btn rt-btn-primary",
                    disabled: busy || blockers.length > 0 || mode === "dev",
                    title:
                      mode === "dev"
                        ? "Use repository workflow to upgrade development installs"
                        : blockers.length
                          ? "Resolve the blockers above first"
                           : "Install and restart",
                    onClick: apply,
                  },
                  busy ? "Updating…" : "Update and restart",
                ),
              ),
            ),
          )
        : null,
    );
  }

  /* ---------------------------------------------------------- Persistent panel body */
  /**
   * "Unread" state: recorded per engagement in localStorage; polls host consoleDigest every 25 seconds
   * (count and last update time per tab). If newer than locally remembered snapshot -> show red dot on that tab;
   * opening that tab marks current values as read and the red dot disappears.
   */
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
      /* Privacy mode, etc.: works without persistence */
    }
  };
  /** Whether this tab has new content since last viewed (count increased, or latest item newer than last view). */
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
    const vw = (typeof window !== "undefined" && window.innerWidth) || 1280;
    const vh = (typeof window !== "undefined" && window.innerHeight) || 800;
    const w = Math.min(
      Math.max(320, Number(g && g.w) || 620),
      Math.max(320, vw),
    );
    const h = Math.min(
      Math.max(240, Number(g && g.h) || 520),
      Math.max(240, vh),
    );
    const x = Math.min(Math.max(0, Number(g && g.x) || 0), Math.max(0, vw - w));
    const y = Math.min(Math.max(0, Number(g && g.y) || 0), Math.max(0, vh - h));
    return { x: x, y: y, w: w, h: h };
  }
  function defaultRtGeom() {
    const vw = (typeof window !== "undefined" && window.innerWidth) || 1280;
    const vh = (typeof window !== "undefined" && window.innerHeight) || 800;
    let w = 620;
    try {
      const saved = Number(window.localStorage.getItem("rt-dock-width"));
      if (Number.isFinite(saved) && saved >= 320 && saved <= 1200) w = saved;
    } catch (e) {
      /* Privacy mode */
    }
    const h = Math.max(240, Math.min(640, vh - 24));
    return clampRtGeom({ x: Math.max(0, vw - w - 12), y: 12, w: w, h: h });
  }
  function loadRtGeom() {
    try {
      const raw = JSON.parse(
        window.localStorage.getItem(RT_GEOM_KEY) || "null",
      );
      if (raw && typeof raw === "object") return clampRtGeom(raw);
    } catch (e) {
      /* Privacy mode or invalid data */
    }
    return defaultRtGeom();
  }

  function Panel(props) {
    /* embedded: when embedded in outer dsh-purge dock, omit built-in collapse/full-view/drag bar to avoid overlapping outer buttons */
    const embedded = !!(props && props.embedded);
    const st = useUI();
    const [engagements, setEngagements] = React.useState([]);
    const [eng, setEng] = React.useState(null);
    const [snapshot, setSnapshot] = React.useState(null);
    const [err, setErr] = React.useState(null);
    const [newName, setNewName] = React.useState("");
    const [geom, setGeom] = React.useState(loadRtGeom);
    const [creating, setCreating] = React.useState(false);
    const [refreshKey, setRefreshKey] = React.useState(0);
    const [digest, setDigest] = React.useState(null);
    const [seen, setSeen] = React.useState(null);

    React.useEffect(() => {
      if (embedded) return undefined;
      try {
        window.localStorage.setItem(RT_GEOM_KEY, JSON.stringify(geom));
      } catch (e) {
        /* Privacy mode */
      }
    }, [geom, embedded]);
    React.useEffect(() => {
      if (embedded) return undefined;
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
            setErr((r && r.error) || "Load failed");
            return;
          }
          setErr(null);
          setSnapshot(r);
        },
        (e) => setErr(String((e && e.message) || e)),
      );
    };

    const refreshList = (selectId) => {
      api({ op: "bootstrap" }).then(
        (b) => {
          setEngagements((b && b.engagements) || []);
          if (selectId) {
            setEng(selectId);
            loadSnapshot(selectId);
          }
        },
        () => {},
      );
    };

    React.useEffect(() => {
      api({ op: "bootstrap" }).then(
        (r) => {
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Cannot connect to asset database");
            return;
          }
          setEngagements(r.engagements || []);
          const id =
            r.current ||
            (r.engagements && r.engagements[0] && r.engagements[0].id) ||
            null;
          if (id) {
            setEng(id);
            loadSnapshot(id);
          }
        },
        (e) => setErr(String((e && e.message) || e)),
      );
    }, []);

    const openEngagement = (nameArg) => {
      const name = String(nameArg || newName).trim();
      if (!name) return;
      setCreating(true);
      api({ op: "openEngagement", name: name }).then(
        (r) => {
          setCreating(false);
          if (!r || r.ok === false) {
            setErr((r && r.error) || "Creation failed");
            return;
          }
          setNewName("");
          refreshList(r.engagement && r.engagement.id);
        },
        (e) => {
          setCreating(false);
          setErr(String((e && e.message) || e));
        },
      );
    };

    /** Refresh: re-fetch roster/snapshot and reload data for the current tab. */
    const refreshAll = () => {
      setRefreshKey((k) => k + 1);
      api({ op: "bootstrap" }).then(
        (b) => {
          setEngagements((b && b.engagements) || []);
          if (eng) loadSnapshot(eng);
        },
        () => {
          if (eng) loadSnapshot(eng);
        },
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
      if (
        e.target &&
        e.target.closest &&
        e.target.closest("button,a,input,select,textarea,label")
      )
        return;
      const sx = e.clientX;
      const sy = e.clientY;
      const ox = geom.x;
      const oy = geom.y;
      trackPointer(e, (ev) =>
        setGeom((g) =>
          clampRtGeom({
            x: ox + (ev.clientX - sx),
            y: oy + (ev.clientY - sy),
            w: g.w,
            h: g.h,
          }),
        ),
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
      trackPointer(e, (ev) =>
        setGeom((g) =>
          clampRtGeom({ x: g.x, y: g.y, w: ow + (ev.clientX - sx), h: g.h }),
        ),
      );
    };
    const startResizeBottom = (e) => {
      const sy = e.clientY;
      const oh = geom.h;
      trackPointer(e, (ev) =>
        setGeom((g) =>
          clampRtGeom({ x: g.x, y: g.y, w: g.w, h: oh + (ev.clientY - sy) }),
        ),
      );
    };
    const startResizeCorner = (e) => {
      const sx = e.clientX;
      const sy = e.clientY;
      const ow = geom.w;
      const oh = geom.h;
      trackPointer(e, (ev) =>
        setGeom((g) =>
          clampRtGeom({
            x: g.x,
            y: g.y,
            w: ow + (ev.clientX - sx),
            h: oh + (ev.clientY - sy),
          }),
        ),
      );
    };

    /* Switch engagement: re-read unread snapshot for this engagement and fetch a summary immediately */
    React.useEffect(() => {
      if (!eng) {
        setDigest(null);
        setSeen(null);
        return undefined;
      }
      setSeen(loadUnread(eng));
      let alive = true;
      let digestInflight = false;
      const tick = () => {
        if (digestInflight)
          return; /* Previous round not returned yet; skip this round to avoid piling up requests */
        digestInflight = true;
        api({ op: "consoleDigest", engagement: eng })
          .then(
            (r) => {
              if (alive && r && r.ok !== false && r.sections)
                setDigest(r.sections);
            },
            () => {
              /* Network error: do not interrupt, wait for next round */
            },
          )
          .finally(() => {
            digestInflight = false;
          });
      };
      tick();
      const timer = window.setInterval(tick, 25000);
      return () => {
        alive = false;
        window.clearInterval(timer);
      };
    }, [eng, refreshKey]);

    /**
     * Opening a tab means viewing its content: mark current summary as read.
     * Never-read (first panel open) is not treated as new content — otherwise the screen would be full of red dots on first load.
     */
    const markTabSeen = React.useCallback(
      (tab) => {
        if (!eng) return;
        setSeen((prev) => {
          const base =
            prev ||
            (() => {
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
      [eng, digest],
    );

    const unreadOf = (tab) => {
      if (!eng || !digest) return false;
      if (!seen) return false;
      return digestHasNew(seen[tab], digest[tab]);
    };

    const stats = (snapshot && snapshot.stats) || {};
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
      ["skills", "Skill library"],
    ];
    const full = isFullWindow();
    const openFull = () => {
      try {
        window.open(
          window.location.href.split("#")[0] + "#redteam-full",
          "_blank",
          "noopener",
        );
      } catch (e) {
        setErr("Cannot open new window: " + ((e && e.message) || e));
      }
    };
    const exitFull = () => {
      /* Prefer closing script-opened window; if not possible, fall back to normal interface with sidebar */
      try {
        window.close();
      } catch (e) {
        /* Windows not opened by script cannot be closed */
      }
      try {
        if (window.location.hash) {
          window.location.hash = "";
          window.location.reload();
        }
      } catch (e) {
        /* ignore */
      }
    };
    React.useEffect(() => {
      if (!full) return undefined;
      const onKey = (e) => {
        if (e.key === "Escape") exitFull();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [full]);

    let body;
    if (err) body = h("div", { className: "rt-err" }, err);
    /* Global pages: viewable without an engagement (Knowledge base / Environment / Skill library / Agent overview) */
    else if (st.tab === "knowledge")
      body = h(KnowledgeTab, { refreshKey: refreshKey });
    else if (st.tab === "env") body = h(EnvTab, { refreshKey: refreshKey });
    else if (st.tab === "skills")
      body = h(SkillsTab, { refreshKey: refreshKey });
    else if (st.tab === "agents" || st.tab === "prompts")
      body = h(AgentsTab, { engagement: eng, refreshKey: refreshKey });
    else if (!eng) {
      body = h(
        "div",
        { className: "rt-pane" },
        h(
          "div",
          { className: "rt-card" },
          h("h4", null, "No engagement yet"),
          h(
            "div",
            {
              style: {
                fontSize: 12,
                color: "var(--dsw-alias-label-secondary)",
                marginBottom: 8,
              },
            },
            "Enter the target organization name for the exercise, create an engagement, and start asset mapping.",
          ),
          h(
            "div",
            { style: { display: "flex", gap: 8 } },
            h("input", {
              className: "rt-input",
              style: { flex: 1 },
              placeholder: "e.g. Example Technology Co., Ltd.",
              value: newName,
              onChange: (e) => setNewName(e.target.value),
              onKeyDown: (e) => {
                if (e.key === "Enter") openEngagement();
              },
            }),
            h(
              "button",
              {
                className: "rt-btn rt-btn-primary",
                disabled: creating,
                onClick: () => openEngagement(),
              },
              creating ? "Creating…" : "Create engagement",
            ),
          ),
        ),
      );
    } else if (st.tab === "assets")
      body = h(AssetsTab, {
        engagement: eng,
        snapshot: snapshot,
        refreshKey: refreshKey,
        onRefresh: refreshAll,
        onData: () => loadSnapshot(eng),
      });
    else if (st.tab === "testing")
      body = h(AssetsTab, {
        engagement: eng,
        snapshot: snapshot,
        refreshKey: refreshKey,
        onRefresh: refreshAll,
        onData: () => loadSnapshot(eng),
      });
    else if (st.tab === "sessions")
      body = h(SessionTab, { engagement: eng, refreshKey: refreshKey });
    else if (st.tab === "findings")
      body = h(FindingsTab, { engagement: eng, refreshKey: refreshKey });
    else if (st.tab === "chain")
      body = h(ChainTab, { engagement: eng, refreshKey: refreshKey });
    else if (st.tab === "report")
      body = h(ReportTab, { engagement: eng, refreshKey: refreshKey });
    else if (st.tab === "attackfiles")
      body = h(FindingsTab, { engagement: eng, refreshKey: refreshKey });
    else if (st.tab === "scores")
      body = h(ScoreTab, { engagement: eng, refreshKey: refreshKey });
    else body = h("div", { className: "rt-empty" }, "Unknown tab");

    const shellProps = full
      ? { className: "rt-full", style: { display: "flex" } }
      : embedded
        ? {
            className: "rt-dock rt-embedded",
            "data-open": "1",
            style: { width: "100%", display: "flex" },
          }
        : {
            className: "rt-dock",
            "data-open": st.open ? "1" : "0",
            style: {
              left: geom.x + "px",
              top: geom.y + "px",
              right: "auto",
              bottom: "auto",
              width: geom.w + "px",
              height: geom.h + "px",
              display: st.open ? "flex" : "none",
            },
          };

    return h(
      "div",
      shellProps,
      full || embedded
        ? null
        : h("div", {
            className: "rt-grip",
            title: "Drag to resize width",
            onMouseDown: startResizeLeft,
          }),
      full || embedded
        ? null
        : h("div", {
            className: "rt-resize-r",
            title: "Drag to resize width",
            onMouseDown: startResizeRight,
          }),
      full || embedded
        ? null
        : h("div", {
            className: "rt-resize-b",
            title: "Drag to resize height",
            onMouseDown: startResizeBottom,
          }),
      full || embedded
        ? null
        : h("div", {
            className: "rt-resize-c",
            title: "Drag to resize",
            onMouseDown: startResizeCorner,
          }),
      h(
        "div",
        {
          className: "rt-head",
          onMouseDown: full || embedded ? undefined : startDrag,
          title: full || embedded ? undefined : "Drag to move panel",
        },
        embedded
          ? null
          : h(
              "div",
              { className: "rt-title" },
              h("span", { className: "rt-dot" }),
              full ? "Operations console · Full view" : "Operations console",
              full
                ? h(
                    "span",
                    { className: "rt-tag", style: { marginLeft: 6 } },
                    "Separate window",
                  )
                : null,
            ),
        h(
          "select",
          {
            className: "rt-input rt-eng-select",
            style: {
              maxWidth: embedded ? "100%" : "170px",
              minWidth: embedded ? "160px" : undefined,
              flex: embedded ? "1 1 200px" : undefined,
            },
            value: eng || "",
            onChange: (e) => {
              setEng(e.target.value);
              loadSnapshot(e.target.value);
              /* Sync "current engagement": native skill directory resolves skill roots based on it */
              api({
                op: "activateEngagement",
                engagement: e.target.value,
              }).catch(() => {});
            },
          },
          h(
            "option",
            { value: "", disabled: true },
            engagements.length ? "Select engagement" : "No engagement",
          ),
          engagements.map((x) =>
            h("option", { key: x.id, value: x.id }, x.name || x.id || "Unnamed"),
          ),
        ),
        h("div", { className: "rt-spacer" }),
        embedded ? null : h(VersionBar, null),
        full
          ? h(
              "button",
              {
                className: "rt-btn",
                title: "Return to normal interface with sidebar (or press Esc)",
                onClick: exitFull,
              },
              "Exit full view",
            )
          : null,
        embedded
          ? null
          : h(
              "button",
              {
                className: "rt-btn",
                title: "Refresh roster, snapshot, and current page data",
                onClick: refreshAll,
              },
              "Refresh",
            ),
        full || embedded
          ? null
          : h(
              "button",
              {
                className: "rt-btn",
                title: "Open full console in a new browser window",
                onClick: openFull,
              },
              "Full view",
            ),
        full || embedded
          ? null
          : h(
              "button",
              {
                className: "rt-btn",
                title: "Collapse panel",
                onClick: () => setUI({ open: false }),
              },
              "Collapse",
            ),
      ),
      /* Tab bar uses standard tablist/tab roles: screen readers announce tab index and selection state.
           Keyboard users can switch with Enter/Space after tabbing in (provided by clickable). */
      h(
        "div",
        { className: "rt-tabs", role: "tablist" },
        tabs.map((t) => {
          const activate = () => {
            markTabSeen(t[0]);
            setUI({ tab: t[0] });
            /* Force current page to refetch data to avoid showing cached content from previous page */
            setRefreshKey((k) => k + 1);
          };
          return h(
            "div",
            Object.assign({}, clickable(activate, { label: t[1] }), {
              key: t[0],
              className: "rt-tab" + (st.tab === t[0] ? " on" : ""),
              role: "tab",
              "aria-selected": st.tab === t[0] ? "true" : "false",
              title: unreadOf(t[0])
                ? t[1] + ": New content; open to mark as read and clear the dot"
                : t[1],
            }),
            t[1],
            unreadOf(t[0])
              ? /* Red dot is visual only; provide text alternative for screen readers */
                h("span", { className: "rt-tab-dot", "aria-label": "New content" })
              : null,
          );
        }),
      ),
      h(
        "div",
        { className: "rt-body", key: "body-" + st.tab },
        h(RtBoundary, { key: st.tab }, body),
      ),
      h(
        "div",
        { className: "rt-foot" },
        h("span", null, "C segments " + (stats.segments || 0)),
        h(
          "span",
          null,
          "Assets " +
            (stats.assets || 0) +
            " (live " +
            (stats.liveAssets || 0) +
            "）",
        ),
        h("span", null, "Ports " + (stats.openPorts || 0)),
        h("span", null, "Fingerprints " + (stats.fingerprints || 0)),
        h("span", null, "Vulns " + (stats.vulns || 0)),
        h(
          "span",
          null,
          "Passive/Active " +
            (stats.passiveSignals || 0) +
            "/" +
            (stats.activeSignals || 0),
        ),
        h("div", { className: "rt-spacer" }),
        full
          ? h("span", null, "Press Esc or click \"Exit full view\" in the top right to return to the sidebar interface")
          : null,
        h(
          "span",
          null,
          "SQLite · " +
            (snapshot && snapshot.engagement ? snapshot.engagement.name : ""),
        ),
      ),
    );
  }

  /* ---------------------------------------------------------- Entry buttons */
  function SidebarButton(props) {
    const st = useUI();
    return h(
      "button",
      {
        className: "rt-icon-btn" + (st.open ? " on" : ""),
        title: "RedTeam console (persistent right sidebar)",
        onClick: () => setUI({ open: !st.open }),
      },
      h("span", { style: { fontSize: 14 } }, "⛨"),
      props.wide ? h("span", null, "RedTeam") : null,
    );
  }

  function HeaderButton() {
    const st = useUI();
    return h(
      "button",
      {
        className: "rt-hbtn" + (st.open ? " on" : ""),
        title: "RedTeam console (persistent right sidebar)",
        onClick: () => setUI({ open: !st.open }),
      },
      "⛨ RedTeam",
    );
  }

  /** Sidebar "Full view": open full console in a new browser window (current window unaffected). */
  function FullButton(props) {
    const open = () => {
      try {
        window.open(
          window.location.href.split("#")[0] + "#redteam-full",
          "_blank",
          "noopener",
        );
      } catch {
        /* Blocked by browser */
      }
    };
    return h(
      "button",
      {
        className: "rt-icon-btn",
        title:
          "Full view: open full console in a new window (current window unaffected; press Esc in the new window to exit)",
        onClick: open,
      },
      h("span", { style: { fontSize: 14 } }, "⛶"),
      props.wide ? h("span", null, "Full view") : null,
    );
  }

  /* ---------------------------------------------------------- Plugin entry */
  /** Sole hard dependency: slot registry. */
  const inject = ["slots"];

  /**
   * Inject styles + three slots. Style tag and width variable are removed when the fiber unmounts.
   * @param ctx - Client root context.
   */
  function applyDrillParts() {
    return {
      CSS: CSS,
      Panel: Panel,
      setUI: setUI,
      useUI: useUI,
      isFullWindow: isFullWindow,
      setDockWidth: setDockWidth,
    };
  }

  exports.inject = inject;
  return applyDrillParts();
})();
