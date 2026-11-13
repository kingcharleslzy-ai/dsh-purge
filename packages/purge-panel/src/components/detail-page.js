// Two pages, one language.
//
// The plugin page (`plugins.bundle.config`) carries the status area and one
// business component; the row page (`plugins.row.config`) carries the
// configuration, the way the native `dsh-ops` plugin splits them. Both render the
// same card language from `styles/detail-card.css`.
import { h, useEffect, useState } from "../shared/react.js";
import { compatibilityLevelText, useT } from "../shared/locale.js";
import { LayoutNotice } from "./layout-notice.js";
import {
  BUNDLE_NAME,
  REPO_URL,
  ROW_ID,
  RowSummary,
  readDetailStatus,
  tallyOf,
  useDetailStatus,
} from "./detail-info.js";
import { AuthGate } from "./auth.js";
import { PurgifySection } from "./settings-form.js";
import { RulesSection } from "./rules.js";
import { SkillsSection } from "./skills.js";
import { CommunityMaintenance, StatusExtras } from "./maintenance.js";
import { __dshPurgeDrill } from "../vendor/drill.js";
import { readDrillAuth, writeDrillAuth } from "../state/dock.js";

/** Whether this page belongs to this plugin. A bundle page names a package, a row
 *  page names a row id, and an item page names neither. The row slot is
 *  registered for our own row only, so a missing subject is ours as well. */
export function ownsSubject(subject) {
  if (!subject) return true;
  if (subject.kind === "bundle")
    return Boolean(subject.pkg && subject.pkg.name === BUNDLE_NAME);
  if (subject.kind === "row")
    return Boolean(subject.row && subject.row.rowId === ROW_ID);
  return false;
}

function dash(value) {
  return value === undefined || value === null || value === ""
    ? "—"
    : String(value);
}

/** 12px chevron, the same path the host's group toggle draws. */
function Chevron({ open }) {
  return h(
    "svg",
    {
      className: "dpg-chevron" + (open ? " is-open" : ""),
      width: 12,
      height: 12,
      viewBox: "0 0 16 16",
      fill: "none",
      strokeWidth: 1,
      "aria-hidden": true,
    },
    h("path", {
      d: "M4 6L7.29289 9.29289C7.68342 9.68342 8.31658 9.68342 8.70711 9.29289L12 6",
      stroke: "currentColor",
    }),
  );
}

/** Card head: title + hint on the left, one control on the right. The disclosure
 *  is the text side only, so a switch or a tab strip stays its own control. */
function CardHead({ id, open, title, hint, onToggle, extra }) {
  const text = h(
    "span",
    { className: "dpg-card-text" },
    h("h4", { className: "dpg-card-title" }, title),
    hint ? h("p", { className: "dpg-card-hint" }, hint) : null,
  );
  return h(
    "div",
    { className: "dpg-card-head" },
    onToggle
      ? h(
          "button",
          {
            type: "button",
            className: "dpg-disclosure",
            "aria-expanded": open ? "true" : "false",
            "aria-controls": id,
            onClick: onToggle,
          },
          h(Chevron, { open: Boolean(open) }),
          text,
        )
      : text,
    extra || null,
  );
}

/** The status area: what this install reports, as facts. */
function StatusCard({ state, onRefresh, busy }) {
  const t = useT();
  // dsh-ops 的卡头带「刷新于 HH:MM:SS」：以最近一次拿到状态的时刻为准。
  const [atTime, setAtTime] = useState(() => new Date().toLocaleTimeString());
  useEffect(() => {
    setAtTime(new Date().toLocaleTimeString());
  }, [state]);
  const tally = tallyOf(state);
  const compat = (state && state.compatibility) || {};
  const level = compat.level
    ? compatibilityLevelText(t, compat.level)
    : t("panel.na");
  const failed = Boolean(state && state.ok === false);
  const mismatch = Boolean(
    state && state.plugin_version && state.plugin_version !== __PANEL_VERSION__,
  );
  const lead = failed
    ? t("panel.status.unavailable") + dash(state.error)
    : !state
      ? t("panel.na")
      : tally.total
        ? t("panel.patches", { applied: tally.applied, total: tally.total }) +
          " · " +
          level
        : level;
  // 词典里这些键是「标签 {占位}」的模板；事实表只需要标签本身，去掉 {…}。
  const label = (key) =>
    t(key)
      .replace(/\s*\{[^}]*\}/g, "")
      .replace(/[\s/]+$/, "")
      .trim() || t(key);
  const facts = state
    ? [
        [
          label("panel.version"),
          dash(state.plugin_version || __PANEL_VERSION__),
        ],
        [label("panel.host"), dash(compat.host_version)],
        [
          label("panel.patches"),
          failed
            ? "?/?"
            : tally.total
              ? tally.applied + "/" + tally.total
              : t("panel.none"),
        ],
        [label("panel.patches.pending"), String(tally.pending)],
        [label("panel.channel"), dash(state.channel)],
        [
          label("panel.backup"),
          state.has_backup ? t("panel.backup.yes") : t("panel.backup.no"),
        ],
        [label("panel.prompt"), dash(state.override_status)],
        [label("panel.home"), dash(state.dsh_home)],
      ]
    : [];
  return h(
    "section",
    { className: "dpg-card" },
    h(
      "div",
      { className: "dpg-card-head" },
      h(
        "span",
        { className: "dpg-card-text" },
        h("h4", { className: "dpg-card-title" }, t("panel.status.title")),
        h(
          "p",
          { className: "dpg-card-hint" },
          t("panel.status.refreshed", { time: atTime }),
        ),
      ),
      h(
        "button",
        {
          type: "button",
          className: "dpg-small dpg-action",
          disabled: busy,
          onClick: onRefresh,
        },
        busy ? t("panel.refreshing") : t("panel.status.recheck"),
      ),
    ),
    h(
      "div",
      {
        className:
          "dpg-status-body" + (compat.level === "qualified" ? " is-ok" : ""),
        role: "status",
      },
      h("p", { className: "dpg-lead" }, lead),
      facts.length
        ? h(
            "dl",
            { className: "dpg-facts" },
            facts.map((pair, index) =>
              h(
                "div",
                { key: "f" + index },
                h("dt", null, pair[0]),
                h("dd", null, pair[1]),
              ),
            ),
          )
        : null,
      h(LayoutNotice, { info: state }),
      h("p", { className: "dpg-status-note" }, t("panel.status.note")),
    ),
    mismatch
      ? h(
          "p",
          { className: "dpg-note", role: "status" },
          t("panel.version.mismatch", {
            backend: state.plugin_version,
            panel: __PANEL_VERSION__,
          }),
        )
      : null,
    h(
      "p",
      { className: "dpg-note" },
      t("panel.about"),
      " ",
      h(
        "a",
        { href: REPO_URL, target: "_blank", rel: "noreferrer noopener" },
        REPO_URL.replace("https://", ""),
      ),
      " · MIT · ",
      t("panel.about.upstream"),
    ),
  );
}

function DrillPanel() {
  const t = useT();
  const [granted, setGranted] = useState(() => Boolean(readDrillAuth()));
  // 授权直接复用旧弹窗（AuthGate）：倒计时 + 须读到底 + 三条确认，一处实现两处复用。
  const [authOpen, setAuthOpen] = useState(false);
  useEffect(() => {
    if (!authOpen || granted) return undefined;
    // 弹窗自己写 drillAuth，写完不会回调；这里轻量轮询拿结果。
    const id = window.setInterval(() => {
      if (readDrillAuth()) {
        setGranted(true);
        setAuthOpen(false);
      }
    }, 400);
    return () => window.clearInterval(id);
  }, [authOpen, granted]);
  // 演练台自带一整份 vendor CSS：挂到文档头，不进渲染树（我们的样式纪律是树里 0 个 <style>）。
  useEffect(() => {
    if (!granted || typeof document === "undefined") return undefined;
    if (!__dshPurgeDrill || !__dshPurgeDrill.CSS) return undefined;
    const el = document.createElement("style");
    el.setAttribute("data-dsh-purge-drill", "1");
    el.textContent = __dshPurgeDrill.CSS;
    document.head.appendChild(el);
    return () => {
      el.remove();
    };
  }, [granted]);
  return h(
    "div",
    { className: "dpg-view" },
    h(
      "div",
      { className: "dpg-field" },
      h(
        "div",
        { className: "dpg-field-head" },
        h("h4", { className: "dpg-field-label" }, t("panel.card.drill")),
        h(
          "div",
          { className: "dpg-view-actions" },
          h(
            "button",
            {
              type: "button",
              className: "dshpp-btn dshpp-btn-ghost dshpp-btn-tiny",
              onClick: () => {
                if (granted) {
                  writeDrillAuth(false);
                  setGranted(false);
                  return;
                }
                setAuthOpen(true);
              },
            },
            granted ? "撤销授权" : "完成授权",
          ),
        ),
      ),
      h(
        "p",
        { className: "dpg-field-hint" },
        granted
          ? "已授权：演练台在本地靶场里跑，不会把内容发往任何远端。"
          : t("panel.drill.locked"),
      ),
    ),
    authOpen && !granted ? h(AuthGate, { pending: "tab" }) : null,
    granted && __dshPurgeDrill && __dshPurgeDrill.Panel
      ? h(__dshPurgeDrill.Panel, { embedded: true })
      : null,
  );
}

/** The business area: one component, its own view switcher. These are the parts
 *  of the old sidebar page that are not configuration — the rule set, the skill
 *  directory, the drill bench and the maintenance workbench. */
function BusinessArea() {
  const t = useT();
  // 第四个元素是「视图自己的标题」的词典键——由上游决定，不是我们给视图起的名字。
  const views = [
    ["rules", t("panel.card.rules"), RulesSection, "rules.title"],
    ["skills", t("panel.card.skills"), SkillsSection, "skills.title"],
    ["drill", t("panel.card.drill"), DrillPanel, null],
    ["maintenance", t("panel.card.more"), MaintenanceView, null],
  ];
  // 词典缺该键时 t() 会回传键名本身，这时退回标签名。
  const titled = (row) => (row[3] && t(row[3]) !== row[3] ? t(row[3]) : row[1]);
  const [active, setActive] = useState("rules");
  const [seen, setSeen] = useState({ rules: true });
  const open = (id) => {
    setActive(id);
    setSeen((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  };
  const view = views.find((row) => row[0] === active) || views[0];
  const index = Math.max(
    0,
    views.findIndex((row) => row[0] === active),
  );
  return h(
    "section",
    { className: "dpg-card dpg-business" },
    h(
      "div",
      { className: "dpg-card-head" },
      h(
        "span",
        { className: "dpg-card-text" },
        h(
          "h4",
          { className: "dpg-card-title" },
          t("panel.business.titled", {
            title: t("panel.business.title"),
            view: titled(view),
          }),
        ),
        h("p", { className: "dpg-card-hint" }, t("panel.business.hint")),
      ),
      h(
        "div",
        {
          className: "dpg-tabs",
          role: "tablist",
          "aria-label": t("panel.business.title"),
        },
        // The host's SegmentedControl places one sliding pill arithmetically from
        // the segment count and index, instead of painting the selected tab.
        h("span", {
          key: "indicator",
          className: "dpg-tab-indicator",
          "aria-hidden": "true",
          style: { "--dpg-seg-count": views.length, "--dpg-seg-index": index },
        }),
        views.map((row) =>
          h(
            "button",
            {
              key: row[0],
              type: "button",
              role: "tab",
              className: "dpg-tab",
              "aria-selected": active === row[0] ? "true" : "false",
              "data-view": row[0],
              onClick: () => open(row[0]),
            },
            row[1],
          ),
        ),
      ),
    ),
    h(
      "div",
      { className: "dpg-card-body", role: "tabpanel" },
      views.map((row) =>
        seen[row[0]]
          ? h("div", { key: row[0], hidden: active !== row[0] }, h(row[2]))
          : null,
      ),
    ),
  );
}

function MaintenanceView() {
  return h(
    "div",
    null,
    h(StatusExtras),
    __COMMUNITY__ ? h(CommunityMaintenance) : null,
  );
}

/** `plugins.detail.section`: the status area, on every plugin page that is ours. */
/** 旧设置页的两个导出（page.js 已删除），保留给测试与外部调用；语义不变。 */
export function StatusStrip({ info }) {
  return h(StatusCard, { state: info });
}

export function VersionNotice({ info }) {
  const t = useT();
  if (!info || !info.plugin_version) return null;
  if (info.plugin_version === __PANEL_VERSION__) return null;
  return h(
    "p",
    { className: "dpg-note", role: "status" },
    t("panel.version.mismatch", {
      backend: info.plugin_version,
      panel: __PANEL_VERSION__,
    }),
  );
}

export function StatusSection(props) {
  if (!ownsSubject(props && props.subject)) return null;
  return h(DetailPage);
}

/** The status area on its own. */
export function DetailPage() {
  const state = useDetailStatus(true);
  const [busy, setBusy] = useState(false);
  // The page is where a reader looks for the truth: read past the shared cache
  // the badge uses, so a stale answer never outlives opening the page.
  useEffect(() => {
    readDetailStatus(true);
  }, []);
  const refresh = () => {
    setBusy(true);
    readDetailStatus(true).finally(() => setBusy(false));
  };
  // 与 dsh-ops 同一分工：bundle 页只放状态卡，配置留在 row 自己的页面上。
  return h(
    "div",
    { className: "dpg-detail dshpp-native" },
    h(StatusCard, { state, onRefresh: refresh, busy }),
  );
}

/** `plugins.row.config` page view: the configuration area, as its own page. */
export function ConfigPage() {
  const t = useT();
  const state = useDetailStatus(true);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    readDetailStatus(true);
  }, []);
  const refresh = () => {
    setBusy(true);
    readDetailStatus(true).finally(() => setBusy(false));
  };
  return h(
    "div",
    { className: "dpg-detail dshpp-native" },
    // One panel instance: it owns the whole configuration state, so every group
    // can be on the page at once without duplicating an editor.
    h(BusinessArea),
    h(
      "section",
      { className: "dpg-card" },
      h(
        "div",
        { className: "dpg-card-head" },
        h(
          "span",
          { className: "dpg-card-text" },
          h("h4", { className: "dpg-card-title" }, t("panel.config.title")),
          h("p", { className: "dpg-card-hint" }, t("panel.config.hint")),
        ),
      ),
      h(
        "div",
        { className: "dpg-card-body dpg-config" },
        h(PurgifySection, { page: "all" }),
      ),
    ),
  );
}

/** Row card summary line, and the row page, which is the configuration. */
export function RowConfig(props = {}) {
  if (props.view === "summary") return h(RowSummary);
  return h(ConfigPage);
}
