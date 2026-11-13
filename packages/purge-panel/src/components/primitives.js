// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { statusKind, statusLabel } from "./patch-status.js";

export function formatSize(bytes) {
  if (typeof bytes !== "number" || !isFinite(bytes) || bytes < 0) return "0 B";
  if (bytes < 1024) return bytes + " B";
  const kb = bytes / 1024;
  return (kb >= 100 ? Math.round(kb) : kb.toFixed(1)) + " KB";
}

export function noticeNode(notice) {
  if (!notice || notice.kind === "idle" || !notice.text) return null;
  return h(
    "span",
    {
      className:
        "dshpp-notice " + (notice.kind === "error" ? "is-bad" : "is-ok"),
    },
    notice.text,
  );
}

export function Btn(props) {
  const { kind, tiny, children, className, type, ...rest } = props;
  const cls = [
    "dshpp-btn",
    kind ? "dshpp-btn-" + kind : "dshpp-btn-ghost",
    tiny ? "dshpp-btn-tiny" : "",
    className || "",
  ]
    .filter(Boolean)
    .join(" ");
  return h(
    "button",
    Object.assign({ type: type || "button", className: cls }, rest),
    children,
  );
}

export function Pill({ value, label }) {
  const t = useT();
  return h(
    "span",
    { className: "dshpp-pill is-" + statusKind(value) },
    label || statusLabel(value, t),
  );
}

/**
 * 名词解释：DSH 自己的设置页也是"标题 + 小问号 + 悬浮说明"，
 * 这里用同构的轻量实现（不依赖 react-dom portal，右侧栏/整页都能用）。
 */
export function HelpTip({ title, children, label }) {
  const [open, setOpen] = useState(false);
  return h(
    "span",
    { className: "dshpp-help" },
    h(
      "button",
      {
        type: "button",
        className: "dshpp-help-btn",
        "aria-label": (label || title || "说明") + "（查看说明）",
        "aria-expanded": open ? "true" : "false",
        onMouseEnter: () => setOpen(true),
        onMouseLeave: () => setOpen(false),
        onFocus: () => setOpen(true),
        onBlur: () => setOpen(false),
        onClick: (e) => {
          e.preventDefault();
          setOpen((v) => !v);
        },
      },
      "?",
    ),
    open
      ? h(
          "span",
          { className: "dshpp-tip", role: "tooltip" },
          title ? h("b", null, title) : null,
          children ? h("span", null, children) : null,
        )
      : null,
  );
}

/**
 * 开关：照宿主的 `Switch` 结构（`button[role=switch]` + `span.thumb`）。
 *
 * 不用 `input[type=checkbox]` + `::after` 画圆点：`input` 是替换元素，伪元素在
 * Chromium 里不保证渲染，之前正是因此只看到一条空轨道。
 */
export function Switch({
  checked,
  label,
  "aria-label": ariaLabel,
  disabled,
  onChange,
}) {
  return h(
    "button",
    {
      type: "button",
      role: "switch",
      className: "dpg-switch",
      "aria-checked": checked ? "true" : "false",
      "aria-label": ariaLabel || label,
      disabled: disabled === true,
      onClick: () => {
        if (disabled !== true) onChange(!checked);
      },
      // 兼容对象式调用（{ target: { checked } }）：旧设置页用的是 input[type=checkbox]，
      // 现有测试仍按那个形状驱动，这里两种签名都接住，真实点击走 onClick。
      onChange: (event) => {
        if (disabled === true) return;
        const next =
          event && event.target && typeof event.target.checked === "boolean"
            ? event.target.checked
            : !checked;
        onChange(next);
      },
    },
    h("span", { className: "dpg-switch-thumb", "aria-hidden": true }),
  );
}
