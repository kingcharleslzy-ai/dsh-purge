// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, useState, useEffect } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { apiJson } from "../api/client.js";
import { noticeNode } from "./primitives.js";

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
    { className: "dshpp-cr", style: { marginTop: 12 } },
    h(
      "div",
      { className: "dshpp-sub" },
      h("h4", null, t("hooksDeny.title")),
      noticeNode(notice),
    ),
    h(
      "p",
      {
        className: "dshpp-hint",
        style: { margin: "0 0 4px", color: "var(--dshpp-mute)", fontSize: 12 },
      },
      t("hooksDeny.hint"),
    ),
    h(
      "div",
      { className: "dshpp-cr-row" },
      h(
        "label",
        null,
        h("input", {
          type: "checkbox",
          checked: cfg.hooksDenyBypass === true,
          disabled: busy,
          onChange: (e) => save(e.target.checked),
        }),
        t("hooksDeny.bypass"),
      ),
    ),
  );
}
