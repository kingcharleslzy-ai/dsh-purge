import { apiUrl } from "../api/client.js";
// Red-team "environment not ready" send gate, ported from
// YuJunZhiXue/dsh-purge 1.1.71 (MIT). Original block: client.js 1.1.71
// lines 8134-8346: fetchEnvAdaptStatus / fetchEnvAdaptStatusSync /
// EnvAdaptSendGate.
import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { readDrillAuth, requestDrillEnv } from "../state/dock.js";
import {
  conversationInput,
  currentSessionId,
  hostSessions,
} from "../state/rewind-draft.js";
import {
  isRedteamModeActive,
  looksLikeSendControl,
} from "../state/redteam-mode.js";

export function fetchEnvAdaptStatus() {
  return fetch(apiUrl("/redteam/api"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ op: "platformEnvAdaptStatus" }),
  })
    .then((r) => r.json())
    .catch(() => null);
}

/* 同步探测的占位：不再做同步 XHR（会卡 UI 主线程）。调用方 mustBlockSubmit
 * 在 cache 过期/缺失时按"未知→保守 block"处理，同时 EnvAdaptSendGate 的
 * useEffect 轮询会异步 refresh，下次调用即可放行。 */
export function fetchEnvAdaptStatusSync() {
  return null;
}

// Use the browser top layer: the host settings dialog can itself be modal.
export function EnvironmentDialog({ title, onDismiss, children }) {
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
      },
    },
    h(
      "section",
      { className: "dshpp-auth-modal" },
      h("h2", null, title),
      children,
    ),
  );
}

/** 红队发送前门禁：未就绪 → 授权并打开环境适配；可确认跳过。 */
export function EnvAdaptSendGate() {
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
      ready: ready,
      skipped: !!(r && r.skipped),
    };
    setStatus(r);
    return r;
  }, []);

  const blockAndOpen = useCallback(() => {
    setConfirmSkip(false);
    refresh();
    /* 第一次：只走完整授权窗 → 授权后进环境适配页 */
    if (!readDrillAuth()) {
      setOpen(false);
      requestDrillEnv();
      return true;
    }
    /* 已授权过：只弹精简环境适配窗，不再自动拉开整块演练台 */
    setOpen(true);
    return true;
  }, [refresh]);

  const mustBlockSubmit = useCallback(() => {
    if (!isRedteamModeActive()) return false;
    const cached = cacheRef.current;
    /* cache 过期时触发异步刷新;本次调用按最后一次 cache 判断,未知保守 block */
    if (!cached.at || Date.now() - cached.at > 2500) {
      refresh().catch(() => {});
    }
    if (cached.ready) return false;
    blockAndOpen();
    return true;
  }, [blockAndOpen, refresh]);

  /* 挂住宿主 SessionInputShell.submit —— 比点按钮启发式可靠。
   * patch 必须可逆:存 origSubmit 到 WeakMap,unmount / 依赖变更时恢复。 */
  useEffect(() => {
    const patched = new WeakMap();
    const patchedShells = [];
    const patchShell = (shell) => {
      if (!shell || patched.has(shell)) return;
      if (typeof shell.submit !== "function") return;
      const origSubmit = shell.submit;
      const origActionsSubmit =
        shell.actions && typeof shell.actions.submit === "function"
          ? shell.actions.submit
          : null;
      patched.set(shell, { origSubmit, origActionsSubmit });
      patchedShells.push(shell);
      const bound = origSubmit.bind(shell);
      shell.submit = function gatedSubmit(mode) {
        try {
          if (mustBlockSubmit()) return;
        } catch {
          /* 门禁异常时不吞掉发送 */
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
        /* ignore */
      }
    };
    tick();
    const iv =
      typeof window !== "undefined" && window.setInterval
        ? window.setInterval(tick, 400)
        : null;
    return () => {
      if (iv && typeof window !== "undefined" && window.clearInterval)
        window.clearInterval(iv);
      for (const shell of patchedShells) {
        const info = patched.get(shell);
        if (!info) continue;
        try {
          shell.submit = info.origSubmit;
        } catch {
          /* ignore */
        }
        if (info.origActionsSubmit && shell.actions) {
          try {
            shell.actions.submit = info.origActionsSubmit;
          } catch {
            /* ignore */
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
    const iv =
      typeof window !== "undefined" && window.setInterval
        ? window.setInterval(tick, 5000)
        : null;
    return () => {
      alive = false;
      if (iv && typeof window !== "undefined" && window.clearInterval)
        window.clearInterval(iv);
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof document === "undefined" || !document.addEventListener)
      return undefined;
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
      const inComposer =
        target &&
        target.closest &&
        target.closest(
          "[data-composer-card], [data-composer-seat], [contenteditable='true'], textarea",
        );
      if (!inComposer) return;
      if (
        target.closest &&
        target.closest(".dshp-dock, .dshp-auth-mask, .rt-dock, .dshp-env-gate")
      )
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

  const message = (status && status.message) || t("envGate.lead");
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
          lineHeight: 1.5,
        },
      },
      t("envGate.kaliHint"),
    ),
    confirmSkip
      ? h("div", { className: "dshpp-auth-warn" }, t("envGate.skipConfirm"))
      : null,
    h(
      "div",
      { className: "dshpp-auth-ops" },
      confirmSkip
        ? [
            h(
              "button",
              {
                key: "no",
                type: "button",
                onClick: () => setConfirmSkip(false),
              },
              t("envGate.skipNo"),
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
                      skip: true,
                    }),
                  })
                    .then((r) => r.json())
                    .then((r) => {
                      setBusy(false);
                      cacheRef.current = {
                        at: Date.now(),
                        ready: true,
                        skipped: true,
                      };
                      setStatus(r);
                      setOpen(false);
                      setConfirmSkip(false);
                    })
                    .catch(() => {
                      setBusy(false);
                      cacheRef.current = {
                        at: Date.now(),
                        ready: true,
                        skipped: true,
                      };
                      setOpen(false);
                    });
                },
              },
              t("envGate.skipYes"),
            ),
          ]
        : [
            h(
              "button",
              {
                key: "skip",
                type: "button",
                onClick: () => setConfirmSkip(true),
              },
              t("envGate.skip"),
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
                },
              },
              t("envGate.go"),
            ),
          ],
    ),
  );
}
