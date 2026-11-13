// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { warnNeedPrompt, rulesApi } from "../api/client.js";
import { formatSize, noticeNode, Btn } from "./primitives.js";
import { clientCurrentCwd, useCurrentCwd } from "../state/session-context.js";

export const TARGETS = ["AGENTS.md", "CLAUDE.md"];

export function ruleLabel(r) {
  if (!r) return "";
  if (r.name !== r.id) return r.name + " (" + r.id + ")";
  return r.id;
}

export function RulesSection() {
  const t = useT();
  const cwd = useCurrentCwd();
  const statusTicket = useRef(0);
  const tRef = useRef(t);
  tRef.current = t;
  const [st, setSt] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editTarget, setEditTarget] = useState("AGENTS.md");
  const [content, setContent] = useState("");
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newTarget, setNewTarget] = useState("AGENTS.md");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });

  const loadStatus = useCallback(() => {
    const tr = tRef.current;
    const ticket = ++statusTicket.current;
    rulesApi("status", cwd ? { cwd: cwd } : undefined)
      .then((d) => {
        if (ticket !== statusTicket.current) return;
        if (d && d.ok) setSt(d);
        else {
          setSt({ ok: false, rules: [], active: null });
          setNotice({
            kind: "error",
            text: tr("err.rules", { error: (d && d.error) || "bad response" }),
          });
        }
      })
      .catch((e) => {
        if (ticket !== statusTicket.current) return;
        setSt({ ok: false, rules: [], active: null });
        setNotice({
          kind: "error",
          text: tr("err.rules", { error: e.message }),
        });
      });
  }, [cwd]);

  useEffect(() => {
    loadStatus();
    return () => {
      statusTicket.current += 1;
    };
  }, [loadStatus]);

  const doPost = useCallback(
    (action, payload, after) => {
      setBusy(true);
      setNotice({ kind: "idle", text: "" });
      rulesApi(action, payload)
        .then((d) => {
          if (d && d.ok) {
            setNotice({ kind: "ok", text: t("ok.done") });
            if (action === "save" || action === "activate")
              warnNeedPrompt(d, t);
            loadStatus();
            if (after) after();
          } else {
            warnNeedPrompt(d, t);
            setNotice({
              kind: "error",
              text: t("err.action", { error: (d && d.error) || "" }),
            });
          }
        })
        .catch((e) =>
          setNotice({
            kind: "error",
            text: t("err.action", { error: e.message }),
          }),
        )
        .finally(() => setBusy(false));
    },
    [loadStatus, t],
  );

  const openRule = useCallback(
    (id) => {
      setBusy(true);
      rulesApi("read", { id: id })
        .then((d) => {
          if (d.ok) {
            setEditId(id);
            setEditName(d.name || id);
            setEditTarget(d.target || "AGENTS.md");
            setContent(typeof d.content === "string" ? d.content : "");
          } else
            setNotice({
              kind: "error",
              text: t("err.read", { error: d.error || "" }),
            });
        })
        .catch((e) =>
          setNotice({
            kind: "error",
            text: t("err.read", { error: e.message }),
          }),
        )
        .finally(() => setBusy(false));
    },
    [t],
  );

  const clearEditor = () => {
    setEditId(null);
    setEditName("");
    setEditTarget("AGENTS.md");
    setContent("");
  };

  let list;
  if (!st) {
    list = h("div", {
      className: "dshpp-skel",
      style: { height: 80, margin: 12 },
    });
  } else if (!st.rules || st.rules.length === 0) {
    list = h("p", { className: "dshpp-empty" }, t("rules.empty"));
  } else {
    list = st.rules.map((r) => {
      const isActive = r.id === st.active;
      const isEdit = r.id === editId;
      return h(
        "div",
        {
          key: r.id,
          className: "dshpp-ruleitem" + (isEdit ? " is-edit" : ""),
          role: "button",
          tabIndex: 0,
          onClick: () => openRule(r.id),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openRule(r.id);
            }
          },
        },
        h(
          "div",
          { className: "dshpp-rule-main" },
          h(
            "span",
            { className: "dshpp-rule-name" },
            ruleLabel(r),
            isActive
              ? h("span", { className: "dshpp-pill is-ok" }, t("pill.current"))
              : null,
          ),
          h(
            "span",
            { className: "dshpp-rule-meta" },
            r.target + " · " + formatSize(r.size),
          ),
        ),
        h(
          "div",
          { className: "dshpp-rule-ops" },
          h(
            Btn,
            {
              tiny: true,
              kind: isActive ? undefined : "primary",
              disabled: busy || isActive,
              onClick: (e) => {
                e.stopPropagation();
                if (!isActive) doPost("activate", { id: r.id });
              },
            },
            isActive ? t("btn.inUse") : t("btn.use"),
          ),
          h(
            Btn,
            {
              tiny: true,
              kind: "danger",
              disabled: busy,
              onClick: (e) => {
                e.stopPropagation();
                if (!window.confirm(t("confirm.delete", { id: r.id }))) return;
                if (editId === r.id) clearEditor();
                doPost("delete", { id: r.id });
              },
            },
            t("delete"),
          ),
        ),
      );
    });
  }

  const policyValue =
    st && typeof st.workspace_policy === "string"
      ? st.workspace_policy
      : "fallback";
  const policyOptions =
    st && Array.isArray(st.workspace_policies) && st.workspace_policies.length
      ? st.workspace_policies
      : ["fallback", "strict", "always"];
  const cwdCandidates =
    st && Array.isArray(st.cwd_candidates) ? st.cwd_candidates : [];
  const cwdValue = st && typeof st.cwd === "string" ? st.cwd : "";
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": t("rules.title") },
    h(
      "div",
      { className: "dshpp-head" },
      h("h3", { className: "dshpp-title" }, t("rules.title")),
      h(
        "div",
        { className: "dshpp-row", style: { margin: 0 } },
        noticeNode(notice),
        h(
          Btn,
          {
            tiny: true,
            kind: "danger",
            disabled: busy,
            onClick: () => {
              if (!window.confirm(t("rules.reset.confirm"))) return;
              clearEditor();
              doPost("reset", {});
            },
          },
          t("rules.reset"),
        ),
      ),
    ),
    h(
      "div",
      { className: "dshpp-block" },
      h(
        "div",
        { className: "dshpp-policy-row" },
        h("label", { htmlFor: "dshpp-policy-select" }, t("policy.title")),
        h(
          "select",
          {
            id: "dshpp-policy-select",
            className: "dshpp-field",
            value: policyValue,
            disabled: busy || !st,
            onChange: (e) => doPost("set-policy", { policy: e.target.value }),
          },
          policyOptions.map((p) =>
            h("option", { key: p, value: p }, t("policy." + p)),
          ),
        ),
      ),
      h("p", { className: "dshpp-block-hint" }, t("policy.hint")),
    ),
    h(
      "div",
      { className: "dshpp-block" },
      h(
        "div",
        { className: "dshpp-block-head" },
        h("h4", null, t("cwd.title")),
        h(
          Btn,
          {
            tiny: true,
            disabled: busy,
            onClick: () => {
              let cwd = cwdValue;
              if (!cwd) {
                try {
                  cwd = clientCurrentCwd();
                } catch {
                  /* ignore */
                }
              }
              doPost("scan-cwd", cwd ? { cwd: cwd } : {});
            },
          },
          t("cwd.rescan"),
        ),
      ),
      cwdValue ? h("p", { className: "dshpp-cwd-path" }, cwdValue) : null,
      !st || !cwdValue
        ? h("p", { className: "dshpp-empty" }, t("cwd.no.workspace"))
        : cwdCandidates.length === 0
          ? h("p", { className: "dshpp-empty" }, t("cwd.empty"))
          : h(
              "div",
              { className: "dshpp-cwd-list" },
              cwdCandidates.map((item) =>
                h(
                  "label",
                  {
                    key: item.path,
                    className:
                      "dshpp-cwd-item" + (item.selected ? " is-on" : ""),
                  },
                  h("input", {
                    type: "checkbox",
                    checked: Boolean(item.selected),
                    disabled: busy,
                    onChange: (e) =>
                      doPost("toggle-cwd", {
                        path: item.path,
                        enabled: e.target.checked,
                      }),
                  }),
                  h(
                    "div",
                    { className: "dshpp-cwd-main" },
                    h(
                      "div",
                      { className: "dshpp-cwd-name" },
                      h("span", null, item.name),
                      h(
                        "span",
                        { className: "dshpp-cwd-badge" },
                        t("cwd.scope." + (item.scope || "cwd")),
                      ),
                      h(
                        "span",
                        { className: "dshpp-cwd-size" },
                        formatSize(item.size || 0),
                      ),
                    ),
                    h("div", { className: "dshpp-cwd-sub" }, item.path),
                    item.preview
                      ? h("div", { className: "dshpp-cwd-prev" }, item.preview)
                      : null,
                  ),
                ),
              ),
            ),
      h("p", { className: "dshpp-block-hint" }, t("cwd.hint")),
    ),
    h(
      "div",
      { className: "dshpp-block" },
      h(
        "div",
        { className: "dshpp-split" },
        h(
          "div",
          { className: "dshpp-rulelist" },
          h("div", { className: "dshpp-rulebody" }, list),
          h(
            "div",
            { className: "dshpp-create" },
            h(
              "div",
              { className: "dshpp-create-row" },
              h("input", {
                className: "dshpp-field",
                placeholder: t("ph.id"),
                value: newId,
                onChange: (e) => setNewId(e.target.value),
              }),
              h("input", {
                className: "dshpp-field",
                placeholder: t("ph.alias"),
                value: newName,
                onChange: (e) => setNewName(e.target.value),
              }),
              h(
                "select",
                {
                  className: "dshpp-field",
                  style: { minWidth: 120, flex: "0 0 auto" },
                  value: newTarget,
                  onChange: (e) => setNewTarget(e.target.value),
                },
                TARGETS.map((x) => h("option", { key: x, value: x }, x)),
              ),
              h(
                Btn,
                {
                  kind: "primary",
                  tiny: true,
                  disabled: busy,
                  onClick: () => {
                    const id = newId.trim();
                    if (!id) {
                      setNotice({ kind: "error", text: t("need.id") });
                      return;
                    }
                    const name = newName.trim() || id;
                    const target = newTarget;
                    doPost("save", { id, content: "", name, target }, () => {
                      setEditId(id);
                      setEditName(name);
                      setEditTarget(target);
                      setContent("");
                    });
                    setNewId("");
                    setNewName("");
                    setNewTarget("AGENTS.md");
                  },
                },
                t("btn.create"),
              ),
            ),
          ),
        ),
        h(
          "div",
          { className: "dshpp-editor" },
          editId
            ? [
                h(
                  "div",
                  { key: "meta", className: "dshpp-row" },
                  h("input", {
                    className: "dshpp-field",
                    placeholder: t("ph.alias.short"),
                    value: editName,
                    onChange: (e) => setEditName(e.target.value),
                  }),
                  h(
                    "select",
                    {
                      className: "dshpp-field",
                      style: { minWidth: 120 },
                      value: editTarget,
                      onChange: (e) => setEditTarget(e.target.value),
                    },
                    TARGETS.map((x) => h("option", { key: x, value: x }, x)),
                  ),
                ),
                h("textarea", {
                  key: "body",
                  className: "dshpp-area",
                  value: content,
                  onChange: (e) => setContent(e.target.value),
                  placeholder: "",
                }),
                h(
                  "div",
                  { key: "save", className: "dshpp-row" },
                  h(
                    Btn,
                    {
                      kind: "primary",
                      disabled: busy,
                      onClick: () =>
                        doPost("save", {
                          id: editId,
                          content,
                          name: editName,
                          target: editTarget,
                        }),
                    },
                    t("btn.saveRule"),
                  ),
                  noticeNode(notice),
                ),
              ]
            : h("div", { className: "dshpp-editor-empty" }, t("rules.pick")),
        ),
      ),
    ),
  );
}
