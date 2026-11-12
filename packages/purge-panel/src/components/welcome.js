// First-run user notice, ported from YuJunZhiXue/dsh-purge 1.1.71 (MIT).
// Original block: client.js 1.1.71 lines 7698-7703 (WELCOME_KEY /
// readWelcomeAck / writeWelcomeAck) and 7846-7903 (WelcomeNotice).
import * as rd from "react-dom";
import WELCOME_CSS from "../styles/welcome.css";
import { h, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";

export const WELCOME_KEY = "dsh-purge-user-notice-v1";

export function readWelcomeAck() {
  try {
    return window.localStorage.getItem(WELCOME_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeWelcomeAck() {
  try {
    window.localStorage.setItem(WELCOME_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function WelcomeNotice(props = {}) {
  const t = useT();
  const [open, setOpen] = useState(() => !readWelcomeAck());
  const [checked, setChecked] = useState(false);
  if (!open) return null;
  // Branding-only difference: the community build points at its own repository.
  const repo = props.repo || t("welcome.repo");
  const node = h(
    "div",
    {
      className: "dshpp-welcome-mask",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "dshpp-welcome-title",
    },
    h("style", null, WELCOME_CSS),
    h(
      "div",
      { className: "dshpp-welcome-card" },
      h("h2", { id: "dshpp-welcome-title" }, t("welcome.title")),
      h(
        "div",
        { className: "dshpp-welcome-copy", tabIndex: 0 },
        h("div", { className: "dshpp-welcome-lead" }, t("welcome.lead")),
        h("div", { className: "dshpp-welcome-warn" }, t("welcome.warn")),
        h(
          "div",
          { className: "dshpp-welcome-legal" },
          h("p", null, t("welcome.body")),
          h(
            "p",
            null,
            h(
              "a",
              {
                href: repo,
                target: "_blank",
                rel: "noopener noreferrer",
              },
              repo,
            ),
          ),
          h("h3", null, t("welcome.bans")),
          h("p", null, t("welcome.ban1")),
          h("p", null, t("welcome.ban2")),
          h("p", null, t("welcome.ban3")),
        ),
      ),
      h(
        "div",
        { className: "dshpp-welcome-checks" },
        h(
          "label",
          { className: "dshpp-welcome-check" },
          h("input", {
            type: "checkbox",
            checked: checked,
            onChange: (e) => setChecked(!!(e && e.target && e.target.checked)),
          }),
          h("span", null, t("welcome.check")),
        ),
      ),
      h(
        "div",
        { className: "dshpp-welcome-ops" },
        h(
          "button",
          {
            type: "button",
            className: "primary",
            disabled: !checked,
            onClick: () => {
              if (!checked) return;
              writeWelcomeAck();
              setOpen(false);
            },
          },
          t("welcome.ok"),
        ),
      ),
    ),
  );
  // Escape overlay-seat clipping/transforms without relying on another page.
  if (rd?.createPortal && typeof document !== "undefined" && document.body)
    return rd.createPortal(node, document.body);
  return node;
}
