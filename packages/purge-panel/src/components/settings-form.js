// 视图层：把状态流程的结果排成二维平面。只做渲染，不发请求。
import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { useT } from "../shared/locale.js";
import {
  clientGuessSurface,
  hostSurfaceOf,
  promptBoxEmpty,
  apiJson,
  responseNeedsPrompt,
} from "../api/client.js";
import { patchRowsOf, tallyPatches, PatchGroups } from "./patch-status.js";
import { noticeNode, Btn, HelpTip } from "./primitives.js";
import { HooksDenySection } from "./advanced.js";
import { RestartAsk, restartDsh, detectHostTheme } from "./restart.js";
import {
  listedCeiling,
  keepListedVersion,
  preferListed,
  versionChoiceLabel,
} from "../shared/versions.js";
import {
  usePurgeData,
  useUpdateFlow,
  useApplyFlow,
  useDraftFlow,
} from "../state/purge-flows.js";

export function patchStateKind(st) {
  if (st === "applied" || st === "already") return "ok";
  if (st === "pending") return "warn";
  if (st === "unmatched" || st === "partial" || st === "drifted") return "bad";
  if (st === "disabled") return "off";
  return "miss";
}

/** 主操作条：状态句 + 应用/还原/卸载/刷新 + 就近提示。 */
export function ApplyBar({ data, flow }) {
  const t = useT();
  const s = data.state;
  const located = !!(s && s.ai_base);
  const hostSurface = hostSurfaceOf(s);
  const desktopLikely =
    hostSurface === "desktop" || clientGuessSurface() === "desktop";
  const sealedReady =
    !located &&
    desktopLikely &&
    !!(s && (s.asar_still_sealed || s.desktop_exe || s.desktop_install));
  const tally = located
    ? tallyPatches(patchRowsOf(s))
    : {
        applied: 0,
        pending: 0,
        total: 0,
        unmatched: 0,
        partial: 0,
        drifted: 0,
      };
  const total = tally.total;
  const applied = tally.applied;
  let stateText = "正在读取宿主状态…";
  let tone = "";
  if (s) {
    if (s.ok === false) {
      stateText = "状态读取失败，宿主与补丁状态未知";
      tone = "is-bad";
    } else if (!located) {
      stateText = sealedReady
        ? "宿主还没解开：点「应用」"
        : "未定位到宿主：点「应用」重试";
      tone = "is-warn";
    } else if (s.asar_still_sealed) {
      stateText = `${applied}/${total} 条磁盘补丁（退出重开后加载）`;
      tone = "is-warn";
    } else if (tally.pending) {
      stateText = `还有 ${tally.pending} 条待应用`;
      tone = "is-warn";
    } else {
      stateText = `${applied}/${total} 条补丁已生效`;
      tone = "is-ok";
    }
  }
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "宿主补丁" },
    h(
      "div",
      { className: "dshpp-apply" },
      h(
        "span",
        { className: "dshpp-apply-state" },
        h("i", { className: "dshpp-dot " + tone }),
        stateText,
      ),
      h(
        Btn,
        {
          kind: "primary",
          disabled:
            flow.patchBusy || flow.uninstallBusy || !data.overrideLoaded,
          onClick: () => flow.doAction("apply", "action.apply"),
        },
        flow.patchBusy ? t("btn.apply.busy") : t("btn.apply"),
      ),
      h(
        Btn,
        {
          disabled: flow.patchBusy || flow.uninstallBusy,
          onClick: () => flow.doAction("revert", "action.revert"),
        },
        t("btn.revert"),
      ),
      h(
        Btn,
        {
          kind: "danger",
          disabled: flow.patchBusy || flow.uninstallBusy,
          onClick: () => flow.setAskUninstall(true),
        },
        flow.uninstallBusy ? t("btn.uninstall.busy") : t("btn.uninstall"),
      ),
      h(
        Btn,
        {
          tiny: true,
          onClick: data.loadAll,
          disabled: flow.patchBusy || flow.uninstallBusy,
        },
        "刷新",
      ),
      h(
        "span",
        { className: "dshpp-apply-note" },
        "写入后需退出并重开 DSH",
        h(HelpTip, { title: "应用" }, t("apply.hint")),
      ),
    ),
    noticeNode(data.notice),
    flow.askUninstall
      ? h(
          "div",
          {
            className: "dshpp-modal-bg",
            role: "dialog",
            "aria-modal": "true",
            "aria-labelledby": "dshpp-uninstall-title",
            onClick: (e) => {
              if (e.target === e.currentTarget && !flow.uninstallBusy)
                flow.setAskUninstall(false);
            },
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
                  disabled: flow.uninstallBusy,
                  onClick: () => flow.setAskUninstall(false),
                },
                t("uninstall.cancel"),
              ),
              h(
                Btn,
                {
                  kind: "solid-danger",
                  disabled: flow.uninstallBusy,
                  onClick: flow.doUninstall,
                },
                t("uninstall.confirm"),
              ),
            ),
          ),
        )
      : null,
    flow.askRestart
      ? h(RestartAsk, {
          t: t,
          theme: detectHostTheme(),
          onLater: () => {
            flow.suppressRestartAsk.current = true;
            flow.setAskRestart(false);
          },
          onRestart: () => {
            flow.suppressRestartAsk.current = true;
            flow.setAskRestart(false);
            restartDsh(
              data.setNotice,
              function () {},
              t,
              hostSurfaceOf(data.state),
            );
          },
        })
      : null,
  );
}

/** 版本卡：本机版本、通道、自动检查。 */
export function VersionCard({ data, update }) {
  const t = useT();
  const s = data.state;
  const versions = (update.updateInfo && update.updateInfo.versions) || [];
  const channelNow =
    (update.updateInfo && update.updateInfo.channel) ||
    update.channel ||
    "stable";
  const localVer =
    (s && s.plugin_version) ||
    (update.updateInfo && update.updateInfo.localVersion) ||
    "";
  const renderEdition = (id) => {
    const lane =
      (update.updateInfo &&
        update.updateInfo.lanes &&
        update.updateInfo.lanes[id]) ||
      {};
    const ceiling = listedCeiling(
      versions,
      localVer || (update.updateInfo && update.updateInfo.localVersion),
    );
    const list = versions.filter(
      (item) => item.channel === id && keepListedVersion(item, ceiling),
    );
    const selectedRef = update.pick[id] || "";
    const hit =
      list.find((item) => item.ref === selectedRef) ||
      preferListed(list, localVer, update.updateInfo && update.updateInfo.pin);
    const onLane = channelNow === id;
    const noBeta =
      id === "beta" &&
      Array.isArray(update.updateInfo && update.updateInfo.versions) &&
      !list.length;
    const pickedOther = Boolean(hit && selectedRef && !hit.current);
    const thisJob =
      update.updateJob && update.updateJob.id === id ? update.updateJob : null;
    let actionLabel = t("btn.checkUpdate");
    let actionKind;
    let actionClick = () => update.checkUpdate(id);
    let actionDisabled = update.updateBusy || Boolean(noBeta);
    if (noBeta) {
      actionLabel = t("update.noBeta");
      actionClick = () => {};
    } else if (pickedOther) {
      actionLabel = t("update.switch");
      actionKind = "primary";
      actionClick = () => update.switchSelected(id);
    } else if (!onLane) {
      actionLabel =
        id === "beta" ? t("channel.useBeta") : t("channel.useStable");
      actionKind = "primary";
      actionClick = () => update.changeChannel(id);
    } else if (update.canApplyUpdate && lane.hasUpdate) {
      actionLabel = t("btn.doUpdate");
      actionKind = "primary";
      actionClick = () => update.doUpdate(id);
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
        "aria-label": t("channel." + id),
      },
      h(
        "span",
        { className: "dshpp-edition-name" },
        t("channel." + id),
        onLane
          ? h("em", { className: "dshpp-now-mark" }, t("update.current"))
          : null,
      ),
      h(
        "select",
        {
          className: "dshpp-field dshpp-ver",
          value: list.length ? (hit && hit.ref) || "" : "",
          disabled: update.updateBusy || !list.length,
          onChange: (e) =>
            update.pick &&
            update.setPick((prev) =>
              Object.assign({}, prev, { [id]: e.target.value }),
            ),
          "aria-label": t("update.pick"),
        },
        list.length
          ? list.map((item) =>
              h(
                "option",
                { key: item.ref + (item.sha || ""), value: item.ref },
                versionChoiceLabel(item, t),
              ),
            )
          : h(
              "option",
              { value: "" },
              noBeta ? t("update.noBeta") : t("update.pick"),
            ),
      ),
      h(
        Btn,
        {
          tiny: true,
          kind: actionKind,
          disabled: actionDisabled,
          onClick: actionClick,
        },
        actionLabel,
      ),
    );
  };
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "版本" },
    h(
      "h3",
      null,
      "版本",
      h("span", { className: "dshpp-card-sub" }, t("channel." + channelNow)),
    ),
    h(
      "div",
      { className: "dshpp-kv" },
      h("span", { className: "dshpp-kv-k" }, t("channel.local")),
      h("span", { className: "dshpp-kv-v" }, localVer ? "v" + localVer : "—"),
    ),
    h(
      "details",
      { className: "dshpp-editions" },
      h("summary", null, "版本管理"),
      renderEdition("stable"),
      renderEdition("beta"),
    ),
    noticeNode(update.updateNotice),
  );
}

/** 提示词正文编辑卡。 */
export function PromptEditor({ data, draft }) {
  const t = useT();
  return h(
    "section",
    { className: "dshpp-card", "aria-label": t("override.title") },
    h(
      "h3",
      null,
      t("override.title"),
      h(
        "span",
        { className: "dshpp-card-ops" },
        h(
          Btn,
          {
            kind: "primary",
            tiny: true,
            disabled: !data.overrideLoaded || draft.promptBusy,
            onClick: draft.saveOverride,
          },
          t("btn.saveInject"),
        ),
        h(
          Btn,
          {
            tiny: true,
            disabled: !data.overrideLoaded || !data.defaultOverride,
            onClick: draft.restoreOverride,
          },
          t("btn.restoreInject"),
        ),
      ),
    ),
    h("textarea", {
      className: "dshpp-area",
      "aria-label": "提示词内容",
      disabled: !data.overrideLoaded,
      value: data.override,
      onChange: (e) => data.setOverride(e.target.value),
      spellCheck: false,
      placeholder: "",
    }),
    noticeNode(data.notice),
    promptBoxEmpty(data.override)
      ? h("p", { className: "dshpp-hint" }, t("need.prompt"))
      : null,
  );
}

/** 自己的服务器名单。 */
export function OwnServersEditor({ data, draft }) {
  const t = useT();
  return h(
    "section",
    { className: "dshpp-card", "aria-label": t("own.title") },
    h(
      "h3",
      null,
      t("own.title"),
      h(
        "span",
        { className: "dshpp-card-ops" },
        h(
          Btn,
          {
            kind: "primary",
            tiny: true,
            disabled: !data.ownLoaded || draft.ownBusy,
            onClick: draft.saveOwnServers,
          },
          t("own.save"),
        ),
      ),
    ),
    h("textarea", {
      className: "dshpp-area dshpp-area-short",
      "aria-label": "服务器名单",
      disabled: !data.ownLoaded,
      value: data.ownServers,
      onChange: (e) => data.setOwnServers(e.target.value),
      spellCheck: false,
      placeholder: "",
    }),
    h("p", { className: "dshpp-hint" }, t("own.hint")),
  );
}

/**
 * 旧版入口：把状态、提示词、更多三块拼在一起。
 * 新版整页由 page.js 按二维网格直接组合各块；这个组件保留给插件设置页与回归测试。
 */
export function PurgifySection({ page = "status", onStatus } = {}) {
  const data = usePurgeData();
  const update = useUpdateFlow();
  const flow = useApplyFlow({ data, onStatus });
  const draft = useDraftFlow(data);
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": "purge" },
    h("div", { hidden: page !== "status" }, h(ApplyBar, { data, flow })),
    h("div", { hidden: page !== "status" }, h(VersionCard, { data, update })),
    h(
      "div",
      { hidden: page !== "status" },
      h(
        "details",
        { className: "dshpp-fold" },
        h(
          "summary",
          null,
          "补丁明细",
          h("b", null, patchSummaryText(data.state)),
        ),
        h(PatchGroups, { state: data.state }),
      ),
    ),
    h(
      "div",
      { hidden: page !== "status" },
      h(
        "details",
        null,
        h("summary", null, "高级选项"),
        h(HooksDenySection, { onSaved: data.loadAll }),
      ),
    ),
    h("div", { hidden: page !== "prompt" }, h(PromptEditor, { data, draft })),
    h("div", { hidden: page !== "more" }, h(OwnServersEditor, { data, draft })),
  );
}

function patchSummaryText(state) {
  if (!state) return "读取中";
  if (state.ok === false) return "状态未知";
  if (!state.ai_base) return "未定位宿主";
  const tally = tallyPatches(patchRowsOf(state));
  return `${tally.applied}/${tally.total} 已应用`;
}
