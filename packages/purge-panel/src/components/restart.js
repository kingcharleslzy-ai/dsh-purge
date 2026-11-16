import { apiUrl } from "../api/client.js";
import * as rd from "react-dom";
// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h } from "../shared/react.js";
import { Btn } from "./primitives.js";
import { clientGuessSurface, hostText } from "../api/client.js";

export function RestartAsk(props) {
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
      },
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
          props.t("restart.now"),
        ),
      ),
    ),
  );
  try {
    if (
      rd &&
      typeof rd.createPortal === "function" &&
      typeof document !== "undefined" &&
      document.body
    ) {
      return rd.createPortal(node, document.body);
    }
  } catch {
    /* The host may not expose react-dom. */
  }
  return node;
}

export function reopenAfterRestart() {
  window.location.reload();
}

export function waitForRestart(setNotice, setBusy, t) {
  const started = Date.now();
  // Wait for the old process to disconnect before accepting a ready response.
  // Otherwise its immediate HTTP 200 could falsely confirm a restart.
  let sawDown = false;
  const ping = () => {
    fetch(apiUrl("/dsh-purge/status"), {
      cache: "no-store",
      credentials: "same-origin",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => {
        if (!sawDown) {
          retry();
          return;
        }
        if (d && d.ok && d.ready !== false) reopenAfterRestart();
        else retry();
      })
      .catch(() => {
        sawDown = true;
        retry();
      });
  };
  const retry = () => {
    if (Date.now() - started > 90000) {
      setNotice({ kind: "error", text: t("restart.timeout") });
      setBusy(false);
      return;
    }
    setTimeout(ping, 500);
  };
  setTimeout(ping, 800);
}

export let restartOnce = false;

export function restartDsh(setNotice, setBusy, t, surface) {
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
      text: error ? t("restart.fail", { error }) : t("restart.notStarted"),
    });
    setBusy(false);
  };
  let sawDrop = false;
  const watch = setTimeout(() => {
    if (sawDrop) return;
    stop("");
  }, 25000);
  fetch(apiUrl("/dsh-purge/restart"), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  })
    .then((r) => r.json())
    .then((d) => {
      if (!d.ok) throw new Error(d.error || "restart failed");
      if (d.manualQuit) {
        clearTimeout(watch);
        restartOnce = false;
        setBusy(false);
        setNotice({ kind: "ok", text: d.note || t("restart.manualQuit") });
        return;
      }
      const next = (d && d.surface) || surf;
      const full = next === "desktop" || (d && d.fullApp) || desktop;
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
    })
    .catch((e) => {
      const msg = String((e && e.message) || e || "");
      const dropped =
        /failed to fetch|networkerror|load failed/i.test(msg) ||
        e.name === "TypeError";
      if (dropped && desktop) {
        sawDrop = true;
        clearTimeout(watch);
        return;
      }
      clearTimeout(watch);
      stop(msg || "restart failed");
    });
}

export function detectHostTheme() {
  try {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (
        document.body?.hasAttribute("data-ds-dark-theme") ||
        root?.hasAttribute("data-ds-dark-theme")
      )
        return "dusk";
      const scheme = (
        root.style.colorScheme ||
        getComputedStyle(root).colorScheme ||
        getComputedStyle(root).getPropertyValue("color-scheme") ||
        ""
      ).toLowerCase();
      if (scheme.includes("dark")) return "dusk";
      if (scheme.includes("light")) return "white";
    }
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ) {
      return "dusk";
    }
  } catch {
    /* ignore */
  }
  return "white";
}
