import { CommunityMaintenance } from "./maintenance.js";
// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, useState, useEffect } from "../shared/react.js";
import {
  compatibilityLevelText,
  setTranslate,
  useT,
} from "../shared/locale.js";
import { RewindSetting } from "./rewind-setting.js";
import { apiJson } from "../api/client.js";
import { PURGE_CSS, NATIVE_CSS } from "../styles/index.js";
import { Btn } from "./primitives.js";
import { PurgifySection } from "./settings-form.js";
import { RulesSection } from "./rules.js";
import { SkillsSection } from "./skills.js";
import { __dshPurgeDrill } from "../vendor/drill.js";
import {
  readDrillAuth,
  setDock,
  useDock,
  requestDrill,
} from "../state/dock.js";

/**
 * 社区版兼容提示：读取后端 /dsh-purge/community 报告的宿主版本与兼容级别。
 * 原版 1.1.71 的 CompatibilityNote 只对官方接口版本告警；社区版换成本 fork
 * 真实的宿主版本/兼容级别，且永远渲染（不再无条件 return null）。
 */
export function CommunityCompatibilityNote() {
  const t = useT();
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiJson("/dsh-purge/community")
      .then((d) => {
        if (d && d.ok !== false) setInfo(d);
        else setError((d && d.error) || "bad response");
      })
      .catch((e) => setError((e && e.message) || String(e)));
  }, []);
  const compat = (info && info.compatibility) || null;
  const host = (compat && compat.host_version) || "unknown";
  const text = compat
    ? t("compat.host", {
        version: info && info.version ? info.version : "—",
        host,
        level: compatibilityLevelText(t, compat.level),
      })
    : error
      ? t("compat.unavailable", { error })
      : t("compat.loading");
  return h(
    "p",
    {
      role: "status",
      className: "dshpp-hint",
      style: { margin: "0 20px 10px" },
    },
    text,
    compat && compat.message ? " " + compat.message : "",
  );
}

export function CompatibilityNote({ status }) {
  if (__COMMUNITY__) return h(CommunityCompatibilityNote);
  if (!status) return null;
  const v = String(status.plugin_version || "");
  const valid = typeof status.patches_total === "number" && !!v;
  if (valid && v === "1.1.71") return null;
  return h(
    "p",
    {
      role: "status",
      className: "dshpp-hint",
      style: { margin: "0 20px 10px" },
    },
    valid
      ? "官方版本 " +
          v +
          "；此界面已验证 1.1.71。如遇设置异常，请更新界面插件。"
      : "无法确认官方 Purge 接口。请检查官方插件是否启用，或更新界面插件。",
  );
}

export function SettingsRoot(props = {}) {
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
    h("style", null, PURGE_CSS + NATIVE_CSS),
    h(
      "header",
      { className: "dshpp-native-head" },
      h("div", null, h("h2", null, "Purge"), h("p", null, "插件设置")),
      h(
        "span",
        { className: "dshpp-native-badge" },
        (__COMMUNITY__ ? "社区版 " : "独立界面 ") + __PANEL_VERSION__,
      ),
    ),
    h(CompatibilityNote, { status: backendStatus }),
    h(
      "nav",
      { className: "dshpp-native-nav", "aria-label": "Purge 设置分类" },
      [
        ["status", "状态"],
        ["prompt", "提示词"],
        ["rules", "规则"],
        ["skills", "技能"],
        ["more", "更多"],
      ].map(([id, label]) =>
        h(
          "button",
          {
            key: id,
            type: "button",
            "aria-pressed": page === id,
            onClick: () => select(id),
          },
          label,
        ),
      ),
    ),
    h(
      "div",
      { className: "dshpp-native-content" },
      __COMMUNITY__ && page === "status" ? h(CommunityMaintenance) : null,
      h(
        "div",
        { hidden: !["status", "prompt", "more"].includes(page) },
        __COMMUNITY__ && page === "more" ? h(RewindSetting) : null,
        h(PurgifySection, { page, onStatus: setBackendStatus }),
      ),
      visited.rules
        ? h("div", { hidden: page !== "rules" }, h(RulesSection))
        : null,
      visited.skills
        ? h("div", { hidden: page !== "skills" }, h(SkillsSection))
        : null,
      h(
        "div",
        { hidden: page !== "more", className: "dshpp-more" },
        h("h3", null, "演练台"),
        h("p", null, "打开插件原有的演练工具与环境设置。"),
        h(
          Btn,
          {
            onClick: () => {
              select("drill");
              requestDrill("tab");
            },
          },
          "打开演练台",
        ),
        h(
          "p",
          { className: "dshpp-attribution" },
          __COMMUNITY__
            ? "基于 YuJunZhiXue/dsh-purge 1.1.71 独立维护，保留原作者署名；更新仅来自本 fork。"
            : "界面独立维护；官方 Purge 可单独更新。基于 YuJunZhiXue/dsh-purge 1.1.71（MIT）。",
        ),
      ),
      page === "drill"
        ? h(
            "div",
            { className: "dshpp-native-drill" },
            // 演练台自带一套 CSS（.rt-*）；旧版由 dock 注入 <head>，重构时丢了，
            // 结果面板在右侧栏里完全没样式、文字被挤成一列。这里随组件一起挂上。
            __dshPurgeDrill && __dshPurgeDrill.CSS
              ? h("style", { "data-dsh-purge-drill": "1" }, __dshPurgeDrill.CSS)
              : null,
            h(
              Btn,
              {
                onClick: () => {
                  setDock({ tab: "clean" });
                  select("more");
                },
              },
              "返回设置",
            ),
            readDrillAuth()
              ? h(__dshPurgeDrill.Panel, { embedded: true })
              : h("p", null, "请先完成演练台授权。"),
          )
        : null,
    ),
  );
}
