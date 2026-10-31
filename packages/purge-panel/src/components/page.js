// Full-page shell for the left sidebar entry. Replaces the old right-sidebar
// drawer: same components, but laid out like a DSH settings page (host font,
// host tokens, one column, explanations in "?" tips instead of paragraphs).
import { h, useState, useEffect, useCallback } from "../shared/react.js";
import { PURGE_CSS, NATIVE_CSS, PAGE_CSS } from "../styles/index.js";
import { useT } from "../shared/locale.js";
import { apiJson, unavailableStatus } from "../api/client.js";
import { Btn, HelpTip } from "./primitives.js";
import { PurgifySection } from "./settings-form.js";
import { RulesSection } from "./rules.js";
import { SkillsSection } from "./skills.js";
import { CommunityMaintenance, StatusExtras } from "./maintenance.js";
import { __dshPurgeDrill } from "../vendor/drill.js";
import { readDrillAuth, setDock, requestDrill } from "../state/dock.js";

const TABS = [
  ["status", "状态", "宿主兼容、补丁、破甲自检"],
  ["prompt", "提示词", "注入正文与破甲强化段"],
  ["rules", "规则", "规则集与工作区策略"],
  ["skills", "技能", "DSH 技能目录"],
  ["drill", "演练台", "红队演练与环境适配"],
  ["more", "更多", "服务器名单、更新与维护"],
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
      "aria-hidden": true,
    },
    h("path", { d: "M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z" }),
    h("path", { d: "M9.5 12.2l1.8 1.8 3.4-3.6" }),
  );
}

export function StatusStrip({ info }) {
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
        className: "dshpp-dot " + (ok ? "is-ok" : level ? "is-warn" : ""),
      }),
      "DSH ",
      h("b", null, compat.host_version || "…"),
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "兼容级别 ",
      h(
        "b",
        null,
        level === "qualified"
          ? "已回归验证"
          : level === "unverified"
            ? "未验证版本"
            : level === "mixed"
              ? "组件版本不一致"
              : level
                ? "未定位宿主"
                : info?.ok === false
                  ? "读取失败"
                  : "检测中",
      ),
      h(
        HelpTip,
        { title: "兼容级别" },
        compat.message ||
          "读取宿主组件版本后给出结论。qualified 表示该 DSH 版本的补丁锚点已逐条回归。",
      ),
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "磁盘写入计数 ",
      h(
        "b",
        null,
        `${info?.patches_applied ?? "?"}/${info?.patches_total ?? "?"}`,
        info?.patches_na > 0 ? ` · ${info.patches_na} 条本机不适用` : "",
      ),
      h(
        HelpTip,
        { title: "宿主补丁" },
        `实际写进 DSH 宿主代码的补丁条数（分母只算本机适用的）。全部补丁 ${info?.patches_total_all ?? "?"} 条，其中 ${info?.patches_na ?? 0} 条目标插件/预设未安装；待应用表示锚点还在、还没写入；没对上表示宿主源码已变，需要重新定位锚点。`,
      ),
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "插件 ",
      h("b", null, info?.plugin_version || __PANEL_VERSION__),
    ),
  );
}

/** 磁盘归档与进程入口分别呈现；不能从磁盘写入推断运行时已加载。 */
export function LayoutNotice({ info }) {
  if (!info || (!info.asar_still_sealed && !info.host_layout)) return null;
  const sealed = info.asar_still_sealed === true;
  const note =
    info.host_layout?.note ||
    "目标磁盘仍有 app.asar；当前进程加载来源尚未确认。";
  const handoff = info.asar_handoff
    ? ` 换包状态：${{ not_scheduled: "尚未应用：点「应用」后才会安排换包", archive_reappeared: "归档再次出现，旧换包记录不代表当前已完成", backup_missing: "原归档备份缺失，请检查诊断", unknown_target: "目标实例未确定", unreadable: "换包记录不可读，请检查诊断", starting: "助手启动中（尚未确认就绪）", ready: "助手已就绪", waiting_for_quit: "等待完整退出（macOS ⌘Q / Windows 系统托盘）", waiting_for_unlock: "等待归档解锁", moving: "正在保留原归档", complete: "换包完成，请手动打开 DSH", already_unsealed: "归档已移走，请手动打开 DSH", failed: "失败，请查看诊断并按恢复文档操作", expired: "等待超时，请重新应用或按恢复文档操作", helper_stopped: "助手意外结束，请重新应用或按恢复文档操作" }[info.asar_handoff.phase] || info.asar_handoff.phase}。`
    : "";
  const failure = info.asar_handoff?.error;
  const detail = info.asar_handoff?.detail
    ? ` 详情：${info.asar_handoff.detail}${failure?.win32_code != null ? `（Windows 错误 ${failure.win32_code}）` : ""}`
    : "";
  const confirmed =
    info.host_layout?.state === "unpacked_entry" &&
    info.host_layout?.process?.matches_target === true &&
    info.host_layout?.disk?.archive_exists === false;
  const diskNote =
    info.host_layout?.disk?.archive_exists === true
      ? " 目标磁盘仍有 app.asar。"
      : "";
  if (sealed || !confirmed) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      note,
      diskNote,
      handoff,
      detail,
    );
  }
  // 换包正常时只留一行确认，说明折进 details：它讲的是"入口不代表已重载"，
  // 属于常驻解释，不该每次都占一行注意力。
  return h(
    "details",
    { className: "dshpp-layout-details" },
    h("summary", null, "✓ 已从解包目录启动（换包完成）"),
    h("p", { className: "dshpp-note" }, note, diskNote, handoff, detail),
  );
}

/** 界面与后端不是同一份包时，必须显眼提示——否则用户会以为设置没生效。 */
export function VersionNotice({ info }) {
  if (info && info.ok === false) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      `状态读取失败：${info.error || "接口不可用"}。当前宿主与补丁状态未知，请点「刷新」重试；持续失败时请提供操作系统、DSH/插件版本和此错误。`,
    );
  }
  const backend = info?.plugin_version;
  if (!backend || backend === __PANEL_VERSION__) return null;
  return h(
    "p",
    { className: "dshpp-warn", role: "status" },
    `官方版本 ${backend}；界面 ${__PANEL_VERSION__}。两者不一致时设置可能不生效，请更新到同一版本后重启 DSH。`,
  );
}

export function PurgePage() {
  const t = useT();
  const [tab, setTab] = useState("status");
  const [visited, setVisited] = useState({ status: true });
  const [info, setInfo] = useState(null);
  const select = (id) => {
    setTab(id);
    setVisited((v) => Object.assign({}, v, { [id]: true }));
  };
  const loadInfo = () =>
    apiJson("/dsh-purge/status")
      .then(setInfo)
      .catch((error) => setInfo(unavailableStatus(error)));
  // 子组件的 onStatus 在依赖里，必须是稳定引用，否则每次渲染都会再 setInfo 一次。
  const mergeInfo = useCallback((s) => s && setInfo(s), []);
  useEffect(() => {
    if (tab === "status") loadInfo();
  }, [tab]);
  useEffect(() => {
    const phase = info?.asar_handoff?.phase;
    if (
      ![
        "starting",
        "ready",
        "waiting_for_quit",
        "waiting_for_unlock",
        "moving",
      ].includes(phase)
    )
      return;
    const timer = setInterval(loadInfo, 2000);
    return () => clearInterval(timer);
  }, [info?.asar_handoff?.phase]);
  const active = TABS.find((row) => row[0] === tab) || TABS[0];
  return h(
    "div",
    { className: "dshpp-page" },
    h("style", null, PURGE_CSS + NATIVE_CSS + PAGE_CSS),
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
          __COMMUNITY__
            ? h(
                "span",
                { className: "dshpp-page-ver" },
                "社区版 " + __PANEL_VERSION__,
              )
            : null,
        ),
      ),
    ),
    h(StatusStrip, { info }),
    h(VersionNotice, { info }),
    h(LayoutNotice, { info }),
    h(
      "nav",
      { className: "dshpp-page-tabs", role: "tablist" },
      TABS.map(([id, label]) =>
        h(
          "button",
          {
            key: id,
            type: "button",
            role: "tab",
            "aria-selected": tab === id ? "true" : "false",
            className: tab === id ? "is-on" : "",
            onClick: () => select(id),
          },
          label,
        ),
      ),
    ),
    h(
      "div",
      { className: "dshpp-page-body" },
      h(
        "div",
        { hidden: tab !== "status", className: "dshpp-sec" },
        h(PurgifySection, { page: "status", onStatus: mergeInfo }),
        h(StatusExtras),
        h(CommunityMaintenance),
      ),
      h(
        "div",
        { hidden: tab !== "prompt", className: "dshpp-sec" },
        visited.prompt ? h(PurgifySection, { page: "prompt" }) : null,
      ),
      h(
        "div",
        { hidden: tab !== "rules", className: "dshpp-sec" },
        visited.rules ? h(RulesSection) : null,
      ),
      h(
        "div",
        { hidden: tab !== "skills", className: "dshpp-sec" },
        visited.skills ? h(SkillsSection) : null,
      ),
      h(
        "div",
        { hidden: tab !== "more", className: "dshpp-sec" },
        visited.more ? h(PurgifySection, { page: "more" }) : null,
      ),
      tab === "drill"
        ? h(
            "div",
            { className: "dshpp-sec dshpp-page-drill" },
            __dshPurgeDrill && __dshPurgeDrill.CSS
              ? h("style", { "data-dsh-purge-drill": "1" }, __dshPurgeDrill.CSS)
              : null,
            readDrillAuth()
              ? h(__dshPurgeDrill.Panel, { embedded: true })
              : h(
                  "div",
                  { className: "dshpp-card" },
                  h(
                    "p",
                    { className: "dshpp-muted" },
                    "演练台需要先完成一次授权。",
                  ),
                  h(
                    Btn,
                    {
                      kind: "primary",
                      onClick: () => {
                        setDock({ tab: "drill", authOpen: true });
                        requestDrill("auth");
                      },
                    },
                    "去授权",
                  ),
                ),
          )
        : null,
    ),
    h(
      "footer",
      { className: "dshpp-page-foot" },
      __COMMUNITY__
        ? "基于 YuJunZhiXue/dsh-purge 1.1.71 独立维护 · MIT · 保留原作者署名"
        : "界面独立维护 · 基于 YuJunZhiXue/dsh-purge 1.1.71（MIT）",
    ),
  );
}

export { PurgeGlyph };
