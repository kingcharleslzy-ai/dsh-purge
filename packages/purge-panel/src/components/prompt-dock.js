import { h, useCallback, useEffect, useRef, useState } from "../shared/react.js";
import { currentSessionId, hostSessions } from "../state/rewind-draft.js";
import { PromptSidebar } from "./prompt-sidebar.js";

/**
 * 输入框工具行的提示词入口：一个按钮 + 浮层编辑器。
 *
 * 挂在 conversation.input.right（session 作用域），因此能取到当前会话 id，
 * 从而支持「全局 / 会话 / 一次性」三种作用域。
 */
export function PromptDockButton() {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const boxRef = useRef(null);

  // 打开时再取会话 id：会话可能在这期间切换。
  const resolve = useCallback(() => {
    try {
      return currentSessionId(hostSessions()) || "";
    } catch {
      return "";
    }
  }, []);

  useEffect(() => {
    if (open) setSessionId(resolve());
  }, [open, resolve]);

  // 点击外部与 Esc 关闭。
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (event) => {
      const el = boxRef.current;
      if (el && event.target instanceof Node && !el.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return h(
    "div",
    { ref: boxRef, style: { position: "relative", display: "inline-flex" } },
    h(
      "button",
      {
        type: "button",
        title: "Prompt",
        "aria-expanded": open ? "true" : "false",
        onClick: () => setOpen((v) => !v),
        style: {
          fontWeight: open ? 600 : 400,
          opacity: open ? 1 : 0.75,
        },
      },
      "P",
    ),
    open
      ? h(
          "div",
          {
            role: "dialog",
            "aria-label": "Prompt",
            style: {
              position: "absolute",
              bottom: "34px",
              right: 0,
              zIndex: 60,
              width: "min(580px, 92vw)",
              maxHeight: "72vh",
              overflowY: "auto",
              background: "var(--dsh-color-bg-elevated, #181818)",
              color: "inherit",
              border: "1px solid var(--dsh-color-border, #3a3a3a)",
              borderRadius: "10px",
              padding: "12px",
              boxShadow: "0 12px 34px rgba(0,0,0,0.28)",
            },
          },
          h(
            "div",
            { style: { display: "flex", justifyContent: "flex-end" } },
            h(
              "button",
              { type: "button", "aria-label": "Close", onClick: () => setOpen(false) },
              "×",
            ),
          ),
          h(PromptSidebar, { sessionId }),
        )
      : null,
  );
}
