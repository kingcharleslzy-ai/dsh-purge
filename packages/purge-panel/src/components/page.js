// 整页（左侧栏入口）骨架。
// 布局原则：二维平面。页面主体是 12 列网格；补丁与自检这类行列表数据压成点阵，
// 不做纵向堆叠，也不靠滚动才能看到全貌。
import { h, useState, useEffect, useCallback } from "../shared/react.js";
import { PURGE_CSS, NATIVE_CSS, PAGE_CSS } from "../styles/index.js";
import { compatibilityLevelText, useT } from "../shared/locale.js";
import { apiJson, unavailableStatus } from "../api/client.js";
import { Btn, HelpTip } from "./primitives.js";
import {
  ApplyBar,
  VersionCard,
  PromptEditor,
  OwnServersEditor,
} from "./settings-form.js";
import {
  usePurgeData,
  useUpdateFlow,
  useApplyFlow,
  useDraftFlow,
} from "../state/purge-flows.js";
import { PatchMatrix } from "./patch-status.js";
import { RulesSection } from "./rules.js";
import { SkillsSection } from "./skills.js";
import { HooksDenySection } from "./advanced.js";
import {
  CommunityMaintenance,
  SelfCheckCard,
  SelfCheckDetail,
  BoostCard,
} from "./maintenance.js";
import { __dshPurgeDrill } from "../vendor/drill.js";
import { readDrillAuth, setDock, requestDrill } from "../state/dock.js";

const TABS = [
  ["status", "状态", "宿主兼容、补丁与破甲自检"],
  ["prompt", "提示词", "注入正文与破甲强化段"],
  ["rules", "规则", "规则集与工作区策略"],
  ["skills", "技能", "DSH 技能目录"],
  ["drill", "演练台", "红队演练与环境适配"],
  ["more", "更多", "服务器名单与本机维护"],
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

/** 一个事实槽：标签在上、值在下。圆点与标签并排，不挤掉标签文字。 */
function Slot({ label, value, tone, help, hint, children }) {
  return h(
    "div",
    { className: "dshpp-slot" + (tone ? " is-" + tone : "") },
    h(
      "span",
      { className: "dshpp-slot-k" },
      hint ? h("span", null, hint) : null,
      label && typeof label === "string" ? h("span", null, label) : label,
      help ? h(HelpTip, { title: help.title }, help.text) : null,
    ),
    h("span", { className: "dshpp-slot-v" }, value, children),
  );
}

/**
 * 状态槽的旧版形态：一条横向信息带。
 * 新版整页用 StatusSlots 承担同一批事实，这里保留给插件设置页与回归测试。
 */
export function StatusStrip({ info }) {
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
        level
          ? compatibilityLevelText(t, level)
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

/** 状态槽：DSH 版本、兼容级别、插件版本、运行来源。四格并列，不画卡片。 */
export function StatusSlots({ info }) {
  const t = useT();
  const compat = info?.compatibility || {};
  const level = compat.level || "";
  const ok = level === "qualified";
  const layout = info?.host_layout || {};
  const confirmed =
    layout.state === "unpacked_entry" &&
    layout.process?.matches_target === true &&
    layout.disk?.archive_exists === false;
  const sourceText = !info
    ? "检测中…"
    : info.ok === false
      ? "读取失败"
      : confirmed
        ? "已从解包目录启动"
        : info.asar_still_sealed
          ? "仍加载归档宿主"
          : "来源待确认";
  const sourceTone = !info
    ? ""
    : info.ok === false
      ? "bad"
      : confirmed
        ? "ok"
        : "warn";
  return h(
    "div",
    { className: "dshpp-slots" },
    h(Slot, {
      label: h("i", {
        className: "dshpp-dot " + (ok ? "is-ok" : level ? "is-warn" : ""),
      }),
      value: compat.host_version || "…",
      hint: "DSH 宿主",
    }),
    h(Slot, {
      label: "兼容级别",
      value: level
        ? compatibilityLevelText(t, level)
        : info?.ok === false
          ? "读取失败"
          : "检测中",
      help: {
        title: "兼容级别",
        text:
          compat.message ||
          "读取宿主组件版本后给出结论。qualified 表示该 DSH 版本的补丁锚点已逐条回归。",
      },
    }),
    h(Slot, {
      label: "插件",
      value: info?.plugin_version || __PANEL_VERSION__,
      children: __COMMUNITY__ ? h("small", null, "社区版") : null,
    }),
    h(Slot, {
      label: h("i", {
        className: "dshpp-dot " + (sourceTone ? "is-" + sourceTone : ""),
      }),
      value: sourceText,
      hint: "运行来源",
    }),
  );
}

/** 磁盘归档与进程入口分别呈现；不能从磁盘写入推断运行时已加载。 */
export function LayoutNotice({ info }) {
  if (!info || (!info.asar_still_sealed && !info.host_layout)) return null;
  if (info.host_layout?.family === "tauri") {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      info.host_layout.note,
    );
  }
  const sealed = info.asar_still_sealed === true;
  const note =
    info.host_layout?.note ||
    "目标磁盘仍有 app.asar；当前进程加载来源尚未确认。";
  const handoff = info.asar_handoff
    ? ` 换包状态：${
        {
          not_scheduled: "尚未应用：点「应用」后才会安排换包",
          archive_reappeared: "归档再次出现，旧换包记录不代表当前已完成",
          backup_missing: "原归档备份缺失，请检查诊断",
          unknown_target: "目标实例未确定",
          unreadable: "换包记录不可读，请检查诊断",
          starting: "助手启动中（尚未确认就绪）",
          ready: "助手已就绪",
          waiting_for_quit: "等待完整退出（macOS ⌘Q / Windows 系统托盘）",
          waiting_for_unlock: "等待归档解锁",
          moving: "正在保留原归档",
          complete: "换包完成，请手动打开 DSH",
          already_unsealed: "归档已移走，请手动打开 DSH",
          failed: "失败，请查看诊断并按恢复文档操作",
          expired: "等待超时，请重新应用或按恢复文档操作",
          helper_stopped: "助手意外结束，请重新应用或按恢复文档操作",
        }[info.asar_handoff.phase] || info.asar_handoff.phase
      }。`
    : "";
  const failure = info.asar_handoff?.error;
  const detail = info.asar_handoff?.detail
    ? ` 详情：${info.asar_handoff.detail}${
        failure?.win32_code != null
          ? `（Windows 错误 ${failure.win32_code}）`
          : ""
      }`
    : "";
  const layout = info.host_layout;
  if (
    info.ok !== false &&
    info.surface === "web" &&
    layout?.disk?.surface === "web" &&
    layout.state === "unknown_runtime" &&
    layout.process?.entry_layout === "unknown" &&
    layout.process.matches_target === null &&
    layout.disk.archive_exists === null &&
    layout.disk.unpacked_exists === null &&
    !info.desktop_exe &&
    !info.desktop_install &&
    !sealed &&
    !layout.errors?.length &&
    info.asar_handoff?.phase === "unknown_target" &&
    !info.asar_handoff.error &&
    !info.asar_handoff.detail
  ) {
    return h(
      "details",
      { className: "dshpp-layout-details" },
      h("summary", null, "换包状态：不适用（Web 宿主）"),
      h(
        "p",
        { className: "dshpp-hint" },
        "Web 服务无需桌面归档换包。原始诊断：",
        layout.state,
        " / ",
        info.asar_handoff.phase,
      ),
    );
  }
  const confirmed =
    layout?.state === "unpacked_entry" &&
    layout?.process?.matches_target === true &&
    layout?.disk?.archive_exists === false;
  const diskNote =
    layout?.disk?.archive_exists === true ? " 目标磁盘仍有 app.asar。" : "";
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
  return h(
    "details",
    { className: "dshpp-layout-details" },
    h("summary", null, "✓ 已从解包目录启动（换包完成）"),
    h("p", { className: "dshpp-hint" }, note, diskNote, handoff, detail),
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

  const data = usePurgeData();
  const update = useUpdateFlow();
  const flow = useApplyFlow({ data, onStatus: mergeInfo });
  const draft = useDraftFlow(data);
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
        h("p", null, active[2]),
      ),
    ),
    h(StatusSlots, { info }),
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
      { className: "dshpp-grid" },
      // 状态页
      h(
        "div",
        { className: "dshpp-cell dshpp-c12", hidden: tab !== "status" },
        h(ApplyBar, { data, flow }),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c12", hidden: tab !== "status" },
        h(PatchMatrix, { state: data.state }),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c7", hidden: tab !== "status" },
        h(SelfCheckCard),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c5", hidden: tab !== "status" },
        h(VersionCard, { data, update }),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c4", hidden: tab !== "status" },
        h(BoostCard),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c4", hidden: tab !== "status" },
        h(SelfCheckDetail),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c4", hidden: tab !== "status" },
        h(
          "details",
          { className: "dshpp-fold" },
          h("summary", null, "高级选项"),
          h(HooksDenySection, { onSaved: data.loadAll }),
        ),
      ),
      // 提示词页
      h(
        "div",
        { className: "dshpp-cell dshpp-c8", hidden: tab !== "prompt" },
        h(PromptEditor, { data, draft }),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c4", hidden: tab !== "prompt" },
        h(PromptNotes),
      ),
      // 规则页：三栏直接占网格卡位
      tab === "rules" && visited.rules ? h(RulesSection) : null,
      // 技能页：两栏直接占网格卡位
      tab === "skills" && visited.skills ? h(SkillsSection) : null,
      // 更多页
      h(
        "div",
        { className: "dshpp-cell dshpp-c6", hidden: tab !== "more" },
        h(OwnServersEditor, { data, draft }),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c6", hidden: tab !== "more" },
        h(DrillEntry),
      ),
      h(
        "div",
        { className: "dshpp-cell dshpp-c12", hidden: tab !== "more" },
        h(CommunityMaintenance),
      ),
      // 演练台
      tab === "drill"
        ? h(
            "div",
            { className: "dshpp-cell dshpp-c12 dshpp-page-drill" },
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
                    { className: "dshpp-hint" },
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

/** 提示词页右侧的说明栏：把常驻长文收进这里，只在需要时读。 */
function PromptNotes() {
  const t = useT();
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "注入说明" },
    h("h3", null, "注入说明"),
    h(
      "div",
      { className: "dshpp-kv" },
      h("span", { className: "dshpp-kv-k" }, "正文来源"),
      h("span", { className: "dshpp-kv-v" }, "本机 prompt-inject.md"),
    ),
    h(
      "div",
      { className: "dshpp-kv" },
      h("span", { className: "dshpp-kv-k" }, "写入时机"),
      h("span", { className: "dshpp-kv-v" }, "每轮对话前重贴"),
    ),
    h("p", { className: "dshpp-hint" }, t("apply.hint")),
  );
}

/** 更多页的演练台入口。 */
function DrillEntry() {
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "演练台" },
    h("h3", null, "演练台"),
    h(
      "p",
      { className: "dshpp-hint" },
      "红队演练与环境适配工具，需要单独授权后使用。",
    ),
    h(
      Btn,
      {
        onClick: () => {
          setDock({ tab: "drill" });
          requestDrill("tab");
        },
      },
      "打开演练台",
    ),
  );
}

export { PurgeGlyph };
