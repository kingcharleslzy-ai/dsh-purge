// 状态读写流程。所有取数与写操作都收敛在这里，视图只负责排版。
import { apiUrl } from "../api/client.js";
import { incompleteApplyDetail } from "../shared/apply-result.js";
import { runtimeRepairDetails } from "../shared/runtime-error.js";
import { useState, useEffect, useCallback, useRef } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import {
  clientGuessSurface,
  hostSurfaceOf,
  hostText,
  apiJson,
  unavailableStatus,
  responseNeedsPrompt,
  bothInjectEmpty,
} from "../api/client.js";

/** 宿主状态与提示词、服务器名单的读取。每次读盘共用同一个在途请求。 */
export function usePurgeData() {
  const tRef = useRef(useT());
  const [state, setState] = useState(null);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const [override, setOverride] = useState("");
  const [defaultOverride, setDefaultOverride] = useState("");
  const [overrideLoaded, setOverrideLoaded] = useState(false);
  const [ownServers, setOwnServers] = useState("");
  const [ownLoaded, setOwnLoaded] = useState(false);
  const overrideRef = useRef("");
  const defaultOverrideRef = useRef("");
  const ownRef = useRef("");
  const promptSeededRef = useRef(false);
  const ownSeededRef = useRef(false);
  const actionTicket = useRef(0);
  overrideRef.current = override;
  defaultOverrideRef.current = defaultOverride;
  ownRef.current = ownServers;

  const loadAll = useCallback(() => {
    const tr = tRef.current;
    apiJson("/dsh-purge/status")
      .then((d) => {
        if (d && d.ok) {
          setState(d);
          setNotice((previous) =>
            previous?.source === "status"
              ? { kind: "idle", text: "" }
              : previous,
          );
        } else {
          setState(unavailableStatus(d?.error || "bad response"));
          setNotice({
            kind: "error",
            source: "status",
            text: tr("err.status", { error: (d && d.error) || "bad response" }),
          });
        }
      })
      .catch((e) => {
        setState(unavailableStatus(e));
        setNotice({
          kind: "error",
          source: "status",
          text: tr("err.status", { error: e.message }),
        });
      });
    apiJson("/dsh-purge/override")
      .then((d) => {
        if (d && d.ok) {
          const packed =
            typeof d.defaultContent === "string" ? d.defaultContent : "";
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
            text: tr("err.override", { error: (d && d.error) || "" }),
          });
      })
      .catch((e) =>
        setNotice({
          kind: "error",
          text: tr("err.override", { error: e.message }),
        }),
      );
    apiJson("/dsh-purge/own-servers")
      .then((d) => {
        if (d && d.ok) {
          if (!ownSeededRef.current) {
            ownSeededRef.current = true;
            setOwnServers(typeof d.content === "string" ? d.content : "");
          }
          setOwnLoaded(true);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAll();
    // 只读一次。重复读取会覆盖用户未保存的输入。
  }, [loadAll]);

  const readPromptBox = () => {
    const live = overrideRef.current;
    overrideRef.current = live || "";
    return overrideRef.current;
  };

  const setOverrideText = (text) => {
    overrideRef.current = text;
    setOverride(text);
  };

  return {
    state,
    setState,
    notice,
    setNotice,
    override,
    setOverride: setOverrideText,
    overrideRef,
    defaultOverride,
    defaultOverrideRef,
    overrideLoaded,
    ownServers,
    ownRef,
    setOwnServers: (text) => {
      ownRef.current = text;
      setOwnServers(text);
    },
    ownLoaded,
    loadAll,
    readPromptBox,
    actionTicket,
    setDefaultOverride: (text) => {
      defaultOverrideRef.current = text;
      setDefaultOverride(text);
    },
  };
}

/** 更新通道：检查、切换、安装。 */
export function useUpdateFlow(onStatus) {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [updateBusy, setUpdateBusy] = useState(false);
  const [canApplyUpdate, setCanApplyUpdate] = useState(false);
  const [updateJob, setUpdateJob] = useState(null);
  const [updateNotice, setUpdateNotice] = useState({ kind: "idle", text: "" });
  const [updateInfo, setUpdateInfo] = useState(null);
  const [channel, setChannel] = useState("stable");
  const [pick, setPick] = useState({ stable: "", beta: "" });
  const actionTicket = useRef(0);

  const syncPicks = useCallback((d) => {
    const versions = (d && d.versions) || [];
    const ceiling = listedCeiling(versions, d && d.localVersion);
    const next = { stable: "", beta: "" };
    for (const id of ["stable", "beta"]) {
      const list = versions.filter(
        (item) => item.channel === id && keepListedVersion(item, ceiling),
      );
      const hit = preferListed(list, d && d.localVersion, d && d.pin);
      next[id] = (hit && hit.ref) || "";
    }
    setPick(next);
  }, []);

  const updateErrorText = useCallback((tr, e) => {
    const msg = String((e && e.message) || e || "");
    if (msg === "timeout" || /aborted|abort|超时/i.test(msg))
      return tr("update.timeout");
    if (/\b404\b/.test(msg) || /non-json/.test(msg))
      return tr("update.needRestart");
    return tr("update.fail", { error: msg });
  }, []);

  const applyUpdateInfo = useCallback(
    (d, tr, kind) => {
      if (d.channel) setChannel(d.channel);
      setUpdateInfo((prev) => {
        const versions =
          d.versions && d.versions.length
            ? d.versions
            : (prev && prev.versions) || [];
        return Object.assign({}, prev || {}, d, { versions });
      });
      if (d.versions && d.versions.length) syncPicks(d);
      if (kind === "check") setCanApplyUpdate(Boolean(d.hasUpdate) && !d.error);
      else if (kind === "done" || kind === "switched" || kind === "channel")
        setCanApplyUpdate(false);
      const version = d.localVersion || d.localSha || "—";
      const remote = d.remoteVersion || d.remoteSha || "—";
      let text = tr("update.latest", { version });
      if (d.hasUpdate)
        text = tr("update.available", { remote, local: version });
      if (d.pinned && d.hasUpdate)
        text = tr("update.pinned", { version, remote });
      if (kind === "switched" || kind === "channel")
        text = tr("update.switched", {
          version: d.localVersion || d.remoteVersion || "—",
        });
      if (kind === "done")
        text = tr("update.done", {
          version: d.localVersion || d.remoteVersion || "—",
        });
      if (d.error) text = d.error;
      setUpdateNotice({
        kind: d.ok === false || d.error ? "error" : "ok",
        text,
      });
    },
    [syncPicks],
  );

  const checkUpdate = useCallback(
    (id) => {
      setUpdateBusy(true);
      setUpdateJob({ id: id || "", kind: "check" });
      const tr = tRef.current;
      setUpdateNotice({ kind: "ok", text: tr("update.checking") });
      apiJson("/dsh-purge/update")
        .then((d) => {
          if (!d || (!d.ok && !d.channel))
            throw new Error((d && d.error) || "check failed");
          applyUpdateInfo(d, tr, "check");
        })
        .catch((e) =>
          setUpdateNotice({ kind: "error", text: updateErrorText(tr, e) }),
        )
        .finally(() => {
          setUpdateBusy(false);
          setUpdateJob(null);
        });
    },
    [applyUpdateInfo, updateErrorText],
  );

  const postUpdate = useCallback(
    (body, kind, id) => {
      setUpdateBusy(true);
      setUpdateJob({ id: id || "", kind });
      const tr = tRef.current;
      setUpdateNotice({
        kind: "ok",
        text:
          kind === "switched" || kind === "channel"
            ? tr("update.switching")
            : tr("update.applying"),
      });
      return apiJson("/dsh-purge/update", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body || {}),
      })
        .then((d) => {
          if (!d || (d.ok === false && d.error))
            throw new Error((d && d.error) || "update failed");
          applyUpdateInfo(d, tr, kind);
          if (d.needsFullQuit) {
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
                /* ignore */
              }
            }, 280);
          } else if (d.needRestart) {
            setUpdateNotice({ kind: "ok", text: tr("update.done") });
          }
          return d;
        })
        .catch((e) => {
          setUpdateNotice({ kind: "error", text: updateErrorText(tr, e) });
          throw e;
        })
        .finally(() => {
          setUpdateBusy(false);
          setUpdateJob(null);
        });
    },
    [applyUpdateInfo, updateErrorText],
  );

  const doUpdate = useCallback(
    (id) => {
      const lane = id === "beta" ? "beta" : "stable";
      postUpdate(
        {
          op: "apply",
          ref: lane === "beta" ? "beta" : "master",
          channel: lane,
        },
        "done",
        id,
      ).catch(() => {});
    },
    [postUpdate],
  );

  const changeChannel = useCallback(
    (next) => {
      if (!next) return;
      const tr = tRef.current;
      if (
        !window.confirm(
          tr("update.confirmChannel", { version: tr("channel." + next) }),
        )
      )
        return;
      const prevChannel = channel;
      const prevInfo = updateInfo;
      setChannel(next);
      setUpdateInfo((cur) => Object.assign({}, cur || {}, { channel: next }));
      postUpdate({ op: "channel", channel: next }, "channel", next).catch(
        () => {
          setChannel(prevChannel);
          setUpdateInfo(prevInfo);
        },
      );
    },
    [channel, postUpdate, updateInfo],
  );

  const switchSelected = useCallback(
    (id) => {
      const tr = tRef.current;
      const ref = pick[id];
      const versions = ((updateInfo && updateInfo.versions) || []).filter(
        (item) => item.channel === id,
      );
      const hit = versions.find((item) => item.ref === ref);
      const label = (hit && (hit.label || hit.version)) || ref;
      if (!ref) return;
      if (!window.confirm(tr("update.confirmSwitch", { version: label })))
        return;
      const prevChannel = channel;
      const prevInfo = updateInfo;
      if (hit && hit.channel) {
        setChannel(hit.channel);
        setUpdateInfo((cur) =>
          Object.assign({}, cur || {}, { channel: hit.channel }),
        );
      }
      postUpdate({ op: "switch", ref }, "switched", id).catch(() => {
        setChannel(prevChannel);
        setUpdateInfo(prevInfo);
      });
    },
    [channel, pick, postUpdate, updateInfo],
  );

  useEffect(() => {
    apiJson("/dsh-purge/update")
      .then((d) => {
        if (!d) return;
        if (d.channel) setChannel(d.channel);
        setUpdateInfo(d);
        syncPicks(d);
      })
      .catch(() => {});
  }, [syncPicks]);

  return {
    updateBusy,
    canApplyUpdate,
    updateJob,
    updateNotice,
    updateInfo,
    channel,
    pick,
    checkUpdate,
    doUpdate,
    changeChannel,
    switchSelected,
  };
}

/** 应用、还原、卸载与重启询问。 */
export function useApplyFlow({ data, onStatus }) {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [patchBusy, setPatchBusy] = useState(false);
  const [askRestart, setAskRestart] = useState(false);
  const suppressRestartAsk = useRef(false);
  const [askUninstall, setAskUninstall] = useState(false);
  const [uninstallBusy, setUninstallBusy] = useState(false);
  const actionTicket = useRef(0);

  useEffect(() => {
    if (onStatus) onStatus(data.state);
  }, [data.state, onStatus]);

  const rejectNeedPrompt = useCallback(
    (tr) => {
      setAskRestart(false);
      data.setNotice({ kind: "error", text: tr("need.prompt") });
      setTimeout(() => window.alert(tr("need.prompt")), 0);
    },
    [data],
  );

  const doAction = useCallback(
    (action, actionKey) => {
      const tr = tRef.current;
      const label = tr(actionKey);
      const ticket = ++actionTicket.current;
      setPatchBusy(true);
      setAskRestart(false);
      data.setNotice({ kind: "idle", text: "" });
      const applyContent = action === "apply" ? data.readPromptBox() : "";
      fetch(apiUrl("/dsh-purge/" + action), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(
          action === "apply" ? { content: applyContent } : {},
        ),
      })
        .then((r) => r.json())
        .then((d) => {
          if (ticket !== actionTicket.current) return;
          if (responseNeedsPrompt(d)) {
            rejectNeedPrompt(tr);
            return;
          }
          if (!d.ok) {
            data.setNotice({
              kind: "error",
              text: tr("err.action", {
                action: label,
                error: [
                  d.error || "",
                  ...runtimeRepairDetails(d.cli_repair),
                ].join("\n"),
              }),
            });
            return;
          }
          if (action === "apply") {
            if (typeof d.defaultContent === "string")
              data.setDefaultOverride(d.defaultContent);
            if (typeof d.override_content === "string") {
              data.setOverride(d.override_content);
            }
          }
          if (action === "apply" && d.complete === false) {
            data.setNotice({
              kind: "error",
              text: tr("restart.incomplete", {
                detail: incompleteApplyDetail(d, tr),
              }),
            });
            data.loadAll();
            if (d.restarting || d.needs_full_quit) {
              suppressRestartAsk.current = false;
              setAskRestart(true);
            }
            return;
          }
          if (action === "apply") {
            if (d.manualQuit) {
              data.setNotice({
                kind: "ok",
                text: "补丁已写入磁盘，当前进程尚未加载。换包助手等待你完整退出（macOS 用 ⌘Q，Windows 从系统托盘退出）。确认换包完成后再手动打开 DSH，不会自动重启。",
              });
              setAskRestart(false);
              data.loadAll();
              return;
            }
            data.setNotice({ kind: "ok", text: tr("ok.done") });
            data.loadAll();
            if (d.restarting || d.needs_full_quit) {
              suppressRestartAsk.current = false;
              setAskRestart(true);
            } else {
              setAskRestart(false);
            }
            return;
          }
          data.setNotice({ kind: "ok", text: tr("ok.done") });
          data.loadAll();
        })
        .catch((e) => {
          if (ticket !== actionTicket.current) return;
          data.setNotice({
            kind: "error",
            text: tr("err.action", { action: label, error: e.message }),
          });
        })
        .finally(() => {
          if (ticket === actionTicket.current) setPatchBusy(false);
        });
    },
    [data, rejectNeedPrompt],
  );

  const waitHostAfterUninstall = useCallback(
    (tr) => {
      const started = Date.now();
      const ping = () => {
        fetch(apiUrl("/"), { cache: "no-store", credentials: "same-origin" })
          .then((r) => {
            if (r.ok) {
              try {
                window.localStorage.removeItem("dshpp-theme");
                window.localStorage.removeItem("dshpp-theme-mode");
              } catch {
                /* ignore */
              }
              window.location.reload();
              return;
            }
            retry();
          })
          .catch(retry);
      };
      const retry = () => {
        if (Date.now() - started > 90000) {
          data.setNotice({ kind: "error", text: tr("restart.timeout") });
          setUninstallBusy(false);
          return;
        }
        setTimeout(ping, 500);
      };
      setTimeout(ping, 800);
    },
    [data],
  );

  const doUninstall = useCallback(() => {
    setUninstallBusy(true);
    setAskUninstall(false);
    setAskRestart(false);
    const tr = tRef.current;
    data.setNotice({ kind: "ok", text: tr("uninstall.applying") });
    apiJson("/dsh-purge/uninstall", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}",
    })
      .then((d) => {
        if (!d || !d.ok) throw new Error((d && d.error) || "uninstall failed");
        data.setNotice({
          kind: "ok",
          text:
            (d && d.note) ||
            hostText(
              tr,
              "uninstall.done",
              d.surface || hostSurfaceOf(data.state),
            ),
        });
        if (
          (d && d.surface) === "desktop" ||
          (d && d.fullApp) ||
          hostSurfaceOf(data.state) === "desktop"
        )
          return;
        waitHostAfterUninstall(tr);
      })
      .catch((e) => {
        const msg = String((e && e.message) || e || "");
        if (/failed to fetch|networkerror|load failed/i.test(msg)) {
          data.setNotice({
            kind: "ok",
            text: hostText(tr, "uninstall.done", hostSurfaceOf(data.state)),
          });
          if (
            hostSurfaceOf(data.state) === "desktop" ||
            clientGuessSurface() === "desktop"
          )
            return;
          waitHostAfterUninstall(tr);
          return;
        }
        data.setNotice({
          kind: "error",
          text: tr("uninstall.fail", { error: msg }),
        });
        setUninstallBusy(false);
      });
  }, [data, waitHostAfterUninstall]);

  return {
    patchBusy,
    askRestart,
    setAskRestart,
    suppressRestartAsk,
    askUninstall,
    setAskUninstall,
    uninstallBusy,
    doAction,
    doUninstall,
  };
}

/** 提示词正文与服务器名单的保存动作。 */
export function useDraftFlow(data) {
  const t = useT();
  const [ownBusy, setOwnBusy] = useState(false);
  const [promptBusy, setPromptBusy] = useState(false);
  const promptPending = useRef(false);
  const ownPending = useRef(false);

  const saveOverride = useCallback(async () => {
    if (promptPending.current) return;
    promptPending.current = true;
    const ticket = data.actionTicket.current;
    const content = data.readPromptBox();
    data.setNotice({ kind: "idle", text: "" });
    setPromptBusy(true);
    try {
      if (await bothInjectEmpty(content, data.defaultOverrideRef.current)) {
        data.setNotice({ kind: "error", text: t("need.prompt") });
        setTimeout(() => window.alert(t("need.prompt")), 0);
        return;
      }
      const d = await apiJson("/dsh-purge/override", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (ticket !== data.actionTicket.current) return;
      if (responseNeedsPrompt(d)) {
        data.setNotice({ kind: "error", text: t("need.prompt") });
        setTimeout(() => window.alert(t("need.prompt")), 0);
        return;
      }
      if (!d || !d.ok) throw new Error((d && d.error) || "保存失败");
      const unchanged = data.readPromptBox() === content;
      if (unchanged && typeof d.content === "string") {
        data.overrideRef.current = d.content;
        data.setOverride(d.content);
      }
      data.setNotice({
        kind: "ok",
        text: unchanged
          ? t("saved.override")
          : "已保存提交的版本；当前修改尚未保存。",
      });
    } catch (e) {
      if (ticket === data.actionTicket.current)
        data.setNotice({
          kind: "error",
          text: t("err.save", { error: e.message }),
        });
    } finally {
      promptPending.current = false;
      setPromptBusy(false);
    }
  }, [data, t]);

  const restoreOverride = useCallback(() => {
    if (!data.defaultOverride) return;
    const tr = t;
    const ticket = data.actionTicket.current;
    data.overrideRef.current = data.defaultOverride;
    data.setOverride(data.defaultOverride);
    data.setNotice({ kind: "idle", text: "" });
    apiJson("/dsh-purge/override", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: data.defaultOverride }),
    })
      .then((d) => {
        if (ticket !== data.actionTicket.current) return;
        if (!d || !d.ok) {
          data.setNotice({
            kind: "error",
            text: tr("err.save", { error: (d && d.error) || "" }),
          });
          return;
        }
        const unchanged = data.readPromptBox() === data.defaultOverride;
        if (typeof d.content === "string" && unchanged) {
          data.overrideRef.current = d.content;
          data.setOverride(d.content);
        }
        data.setNotice({
          kind: "ok",
          text: unchanged
            ? tr("saved.restoreInject")
            : "已恢复默认值；当前修改尚未保存。",
        });
      })
      .catch((e) =>
        data.setNotice({
          kind: "error",
          text: tr("err.save", { error: e.message }),
        }),
      );
  }, [data, t]);

  const saveOwnServers = useCallback(async () => {
    if (ownPending.current || !data.ownLoaded) return;
    ownPending.current = true;
    setOwnBusy(true);
    const content = data.ownRef.current;
    try {
      const d = await apiJson("/dsh-purge/own-servers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!d || !d.ok) throw new Error((d && d.error) || "保存失败");
      const unchanged = data.ownRef.current === content;
      if (unchanged && typeof d.content === "string") {
        data.ownRef.current = d.content;
        data.setOwnServers(d.content);
      }
      data.setNotice({
        kind: "ok",
        text: !unchanged
          ? "已保存提交的版本；当前修改尚未保存。"
          : d.dropped > 0
            ? t("saved.own.dropped", { n: d.dropped })
            : t("saved.own"),
      });
    } catch (e) {
      data.setNotice({
        kind: "error",
        text: t("err.save", { error: e.message }),
      });
    } finally {
      ownPending.current = false;
      setOwnBusy(false);
    }
  }, [data, t]);

  return { ownBusy, promptBusy, saveOverride, restoreOverride, saveOwnServers };
}

/** 补丁状态的语义分类，用于点阵颜色与表格标签。 */
