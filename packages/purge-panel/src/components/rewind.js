// Session composer "回退" (rewind) button ported from YuJunZhiXue/dsh-purge
// 1.1.71 (MIT). Original block: client.js 1.1.71 lines 2835-3474:
// REWIND_CSS, RewindSafe/RewindFallback/RewindButton, installRewindUi,
// installRewindWatch.
import * as rd from "react-dom";
import { h, useState, useEffect, useRef, Component } from "../shared/react.js";
import { NS, useT } from "../shared/locale.js";
import { apiJson } from "../api/client.js";
import {
  armComposerFill,
  bindRewindHost,
  currentSessionId,
  getRewindSeenAt,
  hostSessions,
  isPluginDraft,
  noteRewindAt,
  openRewoundSession,
  rewindText,
  scheduleComposerFill,
  scheduleEchoClear,
  takeArmedFill,
} from "../state/rewind-draft.js";

export const REWIND_CSS = `
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
      style: menuPos
        ? { left: menuPos.left + "px", top: menuPos.top + "px" }
        : { left: "8px", bottom: "48px", transform: "none" },
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
        },
      },
      h("b", null, rewindText(t, "rewind.once", "回退一次")),
      h(
        "span",
        null,
        rewindText(
          t,
          "rewind.once.hint",
          "把这一轮发出去的那句放回输入框，并清掉这一轮",
        ),
      ),
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
        },
      },
      h("b", null, rewindText(t, "rewind.round", "回退上一轮")),
      h(
        "span",
        null,
        rewindText(
          t,
          "rewind.round.hint",
          "把这一轮发出去的那句放回输入框；子代理也只撤这一轮",
        ),
      ),
    ),
  );
}

export class RewindFallback extends Component {
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
      body: JSON.stringify({ sessionId, mode }),
    })
      .then(async (data) => {
        if (!data || !data.ok || !data.sessionId || data.cleared === false) {
          throw new Error((data && data.error) || "没有清掉之前发送的内容");
        }
        noteRewindAt(data.at);
        const text = isPluginDraft(data.text) ? "" : data.text || "";
        armComposerFill(data.sessionId, text);
        await openRewoundSession(hostSessions(), data.sessionId);
        scheduleComposerFill(data.sessionId, text);
        this.setState({ busy: false });
      })
      .catch((e) => {
        this.setState({
          busy: false,
          notice: "回退失败: " + String((e && e.message) || e),
        });
      });
  }
  openMenu() {
    const rect =
      this.wrap && this.wrap.getBoundingClientRect
        ? this.wrap.getBoundingClientRect()
        : null;
    this.setState({
      menu: !this.state.menu,
      notice: "",
      menuPos: rect
        ? {
            left: Math.max(8, rect.right - 228),
            top: Math.max(8, rect.top - 8),
          }
        : null,
    });
  }
  render() {
    const sessionId = this.props.sessionId || currentSessionId(hostSessions());
    const t = this.props.t || null;
    const label = this.state.busy
      ? "回退中…"
      : this.state.notice
        ? this.state.notice.slice(0, 18)
        : "回退";
    return h(
      "div",
      {
        className: "dshp-rewind-wrap",
        ref: (node) => {
          this.wrap = node;
        },
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
          },
        },
        label,
      ),
      this.state.menu
        ? rewindMenuNode(
            t,
            this.state.menuPos,
            (node) => {
              this.menuEl = node;
            },
            (mode) => this.run(mode),
          )
        : null,
    );
  }
}

/** 回退按钮是否显示：默认显示（原版功能），可用 `purge-community rewind off` 关掉。 */
let rewindVisible = true;
let rewindProbe = null;

function loadRewindVisibility() {
  if (!rewindProbe) {
    rewindProbe = apiJson("/dsh-purge/boost")
      .then((r) => {
        rewindVisible = r && r.rewind !== false;
        return rewindVisible;
      })
      .catch(() => true);
  }
  return rewindProbe;
}

export class RewindSafe extends Component {
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
      /* ignore */
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
}

export function RewindButton(props) {
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
      return undefined;
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
        body: JSON.stringify({ sessionId, mode }),
      });
      if (!data || !data.ok || !data.sessionId || data.cleared === false) {
        throw new Error((data && data.error) || "没有清掉之前发送的内容");
      }
      noteRewindAt(data.at);
      const text = isPluginDraft(data.text) ? "" : data.text || "";
      armComposerFill(data.sessionId, text);
      await openRewoundSession(sessions, data.sessionId);
      scheduleComposerFill(data.sessionId, text);
    } catch (e) {
      const message = rewindText(t, "rewind.fail", "回退失败: {error}").replace(
        "{error}",
        String((e && e.message) || e),
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
        top: Math.max(8, rect.top - 8),
      });
    }
    setNotice("");
    setMenu(true);
  };

  const failLabel = notice
    ? notice.length > 18
      ? notice.slice(0, 18) + "…"
      : notice
    : "";
  const label = busy
    ? rewindText(t, "rewind.busy", "回退中…")
    : failLabel || rewindText(t, "rewind.label", "回退");
  const title = notice || rewindText(t, "rewind.aria", "回退");
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
        "aria-label": rewindText(t, "rewind.aria", "回退"),
        "aria-expanded": menu ? "true" : "false",
        disabled: busy || !sessionId,
        onMouseDown: (e) => e.preventDefault(),
        onClick,
      },
      h(
        "svg",
        {
          viewBox: "0 0 16 16",
          width: "14",
          height: "14",
          "aria-hidden": true,
        },
        h("path", {
          fill: "currentColor",
          d: "M7.2 3.2 3.4 7l3.8 3.8V8.6c2.8 0 4.7.7 5.9 2.3-.2-2.8-1.9-5.2-5.9-5.6V3.2z",
        }),
      ),
      label,
    ),
    // 菜单自身是 position:fixed，但宿主 composerSeat 带 will-change:transform，
    // 它会成为 fixed 的包含块，菜单就按那个容器算坐标（#151）。
    // 门户到 body 才回到视口坐标系；host 没暴露 react-dom 时退回原位置渲染。
    menu
      ? typeof rd.createPortal === "function" &&
        typeof document !== "undefined" &&
        document.body
        ? rd.createPortal(
            rewindMenuNode(t, menuPos, menuRef, runRewind),
            document.body,
          )
        : rewindMenuNode(t, menuPos, menuRef, runRewind)
      : null,
  );
}

export function installRewindWatch(ctx) {
  const sessions = (ctx && ctx.sessions) || hostSessions();
  if (!sessions) return () => {};
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
      /* ignore */
    }
  };
  const timer =
    typeof window !== "undefined" && window.setInterval
      ? window.setInterval(tick, 1200)
      : null;
  return () => {
    if (timer && typeof window !== "undefined" && window.clearInterval)
      window.clearInterval(timer);
  };
}

export function installRewindUi(ctx) {
  bindRewindHost(ctx);
  ctx.slots.inject("conversation.input.right", () =>
    ctx.slots.register(
      {
        name: "conversation.input.right",
        id: "dsh-purge-rewind",
        order: 20,
        inject: (sessionId) => ({ sessionId, t: ctx.locale.bind(NS) }),
      },
      RewindSafe,
    ),
  );
  ctx.effect(() => installRewindWatch(ctx), "dsh-purge: rewind watch");
}
