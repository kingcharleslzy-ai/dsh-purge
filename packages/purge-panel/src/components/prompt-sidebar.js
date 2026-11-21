import { h, useEffect, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { apiJson } from "../api/client.js";
import { noticeNode } from "./primitives.js";

// 作用域三选一：全局（原有行为）/ 会话（持久）/ 一次性（内存，重启即失效）
const SCOPES = ["global", "session", "one-shot"];

// 优化目标与后端 OPTIMIZE_GOALS 对应
const GOALS = ["concise", "precise", "structure", "strengthen"];

function scopeOf(session, oneShot) {
  if (oneShot) return "one-shot";
  if (session) return "session";
  return "global";
}

/**
 * 提示词编辑（侧边栏）。
 *
 * · 全局走原有的 /dsh-purge/override（写 $DSH_HOME/prompt-inject.md）；
 * · 会话走 /dsh-purge/inject-scope（scope=session，写会话文件）；
 * · 一次性走同一路由（scope=one-shot，纯内存）。
 *
 * 优化按钮把当前编辑框内容交给模型改写，结果**只回填不保存**，
 * 必须由用户再点保存才落盘。
 */
export function PromptSidebar({ sessionId = "" } = {}) {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState({ kind: "idle", text: "" });

  const [globalText, setGlobalText] = useState("");
  const [sessionText, setSessionText] = useState("");
  const [oneShotText, setOneShotText] = useState("");
  const [scope, setScope] = useState("global");
  const [draft, setDraft] = useState("");
  const [goal, setGoal] = useState("concise");
  const [optimizedFrom, setOptimizedFrom] = useState("");

  // 载入两个来源
  useEffect(() => {
    let active = true;
    setNotice({ kind: "idle", text: "" });
    Promise.all([
      apiJson("/dsh-purge/override").catch(() => null),
      sessionId ? apiJson("/dsh-purge/inject-scope?sessionId=" + encodeURIComponent(sessionId)).catch(() => null) : Promise.resolve(null),
    ]).then(
      ([ov, sc]) => {
        if (!active) return;
        const g = ov && typeof ov.content === "string" ? ov.content : "";
        setGlobalText(g);
        const s = sc && typeof sc.session === "string" ? sc.session : "";
        const o = sc && typeof sc.oneShot === "string" ? sc.oneShot : "";
        setSessionText(s);
        setOneShotText(o);
        const first = scopeOf(s, o);
        setScope(first);
        setDraft(first === "global" ? g : first === "session" ? s : o);
        setReady(true);
      },
    );
    return () => {
      active = false;
    };
  }, [sessionId]);

  function switchScope(next) {
    setScope(next);
    setNotice({ kind: "idle", text: "" });
    setOptimizedFrom("");
    setDraft(next === "global" ? globalText : next === "session" ? sessionText : oneShotText);
  }

  async function save(content) {
    setBusy("save");
    setNotice({ kind: "idle", text: "" });
    try {
      if (scope === "global") {
        const d = await apiJson("/dsh-purge/override", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content }),
        });
        if (d && d.ok === false) throw new Error(d.error || "save failed");
        const next = typeof d?.content === "string" ? d.content : content;
        setGlobalText(next);
        setDraft(next);
      } else {
        if (!sessionId) throw new Error(t("prompt.noSession"));
        const d = await apiJson("/dsh-purge/inject-scope", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId, scope, content }),
        });
        if (d && d.ok === false) throw new Error(d.error || "save failed");
        setSessionText(typeof d?.session === "string" ? d.session : "");
        setOneShotText(typeof d?.oneShot === "string" ? d.oneShot : "");
      }
      setNotice({ kind: "ok", text: t("prompt.saved") });
    } catch (e) {
      setNotice({ kind: "error", text: String(e && e.message ? e.message : e) });
    } finally {
      setBusy("");
    }
  }

  async function optimize() {
    setBusy("optimize");
    setNotice({ kind: "idle", text: "" });
    const before = draft;
    try {
      const d = await apiJson("/dsh-purge/inject-optimize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: draft, goal, sessionId }),
      });
      if (!d || d.ok !== true) throw new Error((d && d.error) || "optimize failed");
      // 只回填，不保存：用户看到结果后自己决定是否保存
      setDraft(d.content);
      setOptimizedFrom(before);
      setNotice({ kind: "ok", text: t("prompt.optimizedHint") });
    } catch (e) {
      setNotice({ kind: "error", text: String(e && e.message ? e.message : e) });
    } finally {
      setBusy("");
    }
  }

  const disabled = !ready || !!busy;
  // 作用域键与 locale 命名对应：one-shot 的提示语键是 oneShotHint。
  const scopeHintKey = scope === "one-shot" ? "prompt.scope.oneShotHint" : `prompt.scope.${scope}Hint`;
  const scopeHint = t(scopeHintKey);

  return h(
    "section",
    { className: "dshpp-composer-settings" },
    h("h3", null, t("prompt.title")),
    h("p", { style: { opacity: 0.8, margin: "0 0 10px" } }, t("prompt.desc")),

    // 作用域
    h(
      "div",
      { className: "dshpp-setting-row", style: { gap: "6px", flexWrap: "wrap" } },
      ...SCOPES.map((s) =>
        h(
          "button",
          {
            key: s,
            type: "button",
            disabled,
            "aria-pressed": scope === s ? "true" : "false",
            style: { fontWeight: scope === s ? 600 : 400, opacity: scope === s ? 1 : 0.6 },
            onClick: () => switchScope(s),
          },
          t("prompt.scope." + s),
        ),
      ),
    ),
    h("p", { style: { opacity: 0.7, margin: "0 0 8px", fontSize: "0.9em" } }, scopeHint),
    scope !== "global" && !sessionId
      ? h("p", { style: { color: "#c66", margin: "0 0 8px" } }, t("prompt.noSession"))
      : null,

    // 正文
    h("textarea", {
      className: "dshpp-textarea",
      rows: 12,
      value: draft,
      disabled,
      placeholder: t("prompt.placeholder"),
      onChange: (e) => setDraft(e.target.value),
    }),

    // 优化
    h(
      "div",
      { className: "dshpp-setting-row", style: { gap: "6px", flexWrap: "wrap", marginTop: "8px" } },
      h("select", {
        value: goal,
        disabled,
        onChange: (e) => setGoal(e.target.value),
        style: { flex: "0 0 auto" },
      }, ...GOALS.map((g) => h("option", { key: g, value: g }, t("prompt.goal." + g)))),
      h(
        "button",
        { type: "button", disabled, onClick: optimize },
        busy === "optimize" ? t("prompt.optimizing") : t("prompt.optimize"),
      ),
      h(
        "button",
        { type: "button", disabled, onClick: () => save(draft) },
        busy === "save" ? t("prompt.saving") : t("prompt.save"),
      ),
      optimizedFrom
        ? h(
            "button",
            {
              type: "button",
              disabled,
              onClick: () => {
                setDraft(optimizedFrom);
                setOptimizedFrom("");
                setNotice({ kind: "idle", text: "" });
              },
            },
            t("prompt.revertOptimize"),
          )
        : null,
    ),

    // 清空该作用域
    scope !== "global"
      ? h(
          "div",
          { style: { marginTop: "6px" } },
          h(
            "button",
            {
              type: "button",
              disabled: disabled || !sessionId,
              onClick: () => save(""),
            },
            t("prompt.clearScope"),
          ),
        )
      : null,

    notice.text ? noticeNode(notice) : null,
  );
}
