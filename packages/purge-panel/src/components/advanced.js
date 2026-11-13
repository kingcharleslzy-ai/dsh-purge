// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, useState, useEffect } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { apiJson } from "../api/client.js";
import { noticeNode, Switch } from "./primitives.js";

export function HooksDenySection({ onSaved }) {
  const t = useT();
  const [cfg, setCfg] = useState(null);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiJson("/dsh-purge/hooks-deny")
      .then((d) => {
        if (d && d.ok) setCfg({ hooksDenyBypass: d.hooksDenyBypass !== false });
      })
      .catch(() => {});
  }, []);

  const save = (hooksDenyBypass) => {
    if (!cfg || busy) return;
    setCfg({ hooksDenyBypass });
    setBusy(true);
    apiJson("/dsh-purge/hooks-deny", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hooksDenyBypass }),
    })
      .then((d) => {
        if (d && d.ok) {
          setCfg({ hooksDenyBypass: d.hooksDenyBypass === true });
          setNotice({ kind: "ok", text: t("saved.hooksDeny") });
          if (typeof onSaved === "function") onSaved();
        } else {
          setNotice({
            kind: "error",
            text: t("err.save", { error: (d && d.error) || "" }),
          });
        }
      })
      .catch((e) =>
        setNotice({ kind: "error", text: t("err.save", { error: e.message }) }),
      )
      .finally(() => setBusy(false));
  };

  if (!cfg) return null;
  return h(
    "div",
    { className: "dshpp-cr" },
    h(
      "div",
      { className: "dpg-field" },
      h(
        "div",
        { className: "dpg-switch-row" },
        h(
          "div",
          { className: "dpg-field-text" },
          h(
            "span",
            { className: "dpg-field-label" },
            t("hooksDeny.title") + "：" + t("hooksDeny.bypass"),
          ),
          h("p", { className: "dpg-field-hint" }, t("hooksDeny.hint")),
        ),
        h(Switch, {
          checked: cfg.hooksDenyBypass === true,
          label: t("hooksDeny.bypass"),
          disabled: busy,
          onChange: (next) => save(next),
        }),
      ),
      noticeNode(notice),
    ),
  );
}
