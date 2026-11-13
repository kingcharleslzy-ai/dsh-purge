// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { useT } from "../shared/locale.js";
import {
  hostSurfaceOf,
  hostText,
  apiJson,
  skillsRouteMissing,
  skillsApi,
} from "../api/client.js";
import { formatSize, noticeNode, Btn } from "./primitives.js";

export function skillUiAllowed(d) {
  if (!d) return false;
  const ver = String(d.plugin_version || d.localVersion || "").replace(
    /^v/i,
    "",
  );
  if (/^1\.1\.11(?:-|$)/.test(ver)) return false;
  const parts = ver.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!parts) return false;
  if (+parts[1] !== 1) return +parts[1] > 1;
  if (+parts[2] !== 1) return +parts[2] > 1;
  return +parts[3] >= 12;
}

export function SkillsSection() {
  const t = useT();
  const tRef = useRef(t);
  tRef.current = t;
  const [onBeta, setOnBeta] = useState(false);
  const [st, setSt] = useState(null);
  const [editId, setEditId] = useState(null);
  const [editDesc, setEditDesc] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const zipRef = useRef(null);
  const folderRef = useRef(null);

  const loadStatus = useCallback(() => {
    const tr = tRef.current;
    const fail = (e) => {
      setSt({ ok: false, skills: [] });
      setNotice({
        kind: "error",
        text: skillsRouteMissing(e)
          ? tr("err.skills.needRestart")
          : tr("err.skills", {
              error: (e && e.message) || e || "bad response",
            }),
      });
    };
    const apply = (d) => {
      if (d && d.ok) setSt({ ok: true, skills: d.skills || [] });
      else fail({ message: (d && d.error) || "bad response" });
    };
    apiJson("/dsh-purge/status")
      .then((d) => {
        const allowed = skillUiAllowed(d);
        setOnBeta(allowed);
        if (!allowed) {
          setSt(null);
          return;
        }
        if (d.skills) {
          apply({ ok: true, skills: d.skills });
          return;
        }
        skillsApi("status").then(apply).catch(fail);
      })
      .catch(() => {
        setOnBeta(false);
        setSt(null);
      });
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const doPost = useCallback(
    (action, payload, after) => {
      setBusy(true);
      setNotice({ kind: "idle", text: "" });
      skillsApi(action, payload)
        .then((d) => {
          if (d && d.ok) {
            setNotice({ kind: "ok", text: t("ok.done") });
            loadStatus();
            if (after) after(d);
          } else {
            setNotice({
              kind: "error",
              text: t("err.action", { error: (d && d.error) || "" }),
            });
          }
        })
        .catch((e) =>
          setNotice({
            kind: "error",
            text: skillsRouteMissing(e)
              ? t("err.skills.needRestart")
              : t("err.action", { error: e.message }),
          }),
        )
        .finally(() => setBusy(false));
    },
    [loadStatus, t],
  );

  const openSkill = useCallback(
    (id) => {
      setBusy(true);
      skillsApi("read", { id: id })
        .then((d) => {
          if (d.ok) {
            setEditId(id);
            setEditDesc(d.description || "");
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
    setEditDesc("");
    setContent("");
  };

  const readAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result || "");
        const at = text.indexOf(",");
        resolve(at >= 0 ? text.slice(at + 1) : text);
      };
      reader.onerror = () => reject(new Error(t("need.import")));
      reader.readAsDataURL(file);
    });

  const importZip = (file) => {
    if (!file) {
      setNotice({ kind: "error", text: t("need.import") });
      return;
    }
    setBusy(true);
    setNotice({ kind: "ok", text: t("skills.importing") });
    readAsBase64(file)
      .then((data) => skillsApi("import", { data, name: file.name }))
      .then((d) => {
        if (!d || !d.ok) throw new Error((d && d.error) || "");
        setNotice({
          kind: "ok",
          text: t("saved.import", { count: (d.imported || []).length || 1 }),
        });
        loadStatus();
      })
      .catch((e) =>
        setNotice({
          kind: "error",
          text: skillsRouteMissing(e)
            ? t("err.skills.needRestart")
            : t("err.action", { error: e.message }),
        }),
      )
      .finally(() => setBusy(false));
  };

  const keepFolderFile = (file) => {
    const rel = String(file.webkitRelativePath || file.name || "").replace(
      /\\/g,
      "/",
    );
    if (!rel || rel.includes("..")) return false;
    if (/(^|\/)(node_modules|\.git|__MACOSX|\.system)(\/|$)/i.test(rel))
      return false;
    if (/(^|\/)\._/.test(rel) || /\/\.DS_Store$/i.test(rel)) return false;
    return true;
  };

  const importFolder = (list) => {
    const files = Array.from(list || []).filter(keepFolderFile);
    if (!files.length) {
      setNotice({ kind: "error", text: t("err.import.folder") });
      return;
    }
    setBusy(true);
    setNotice({ kind: "ok", text: t("skills.importing") });
    Promise.all(
      files.map((file) =>
        readAsBase64(file).then((content) => ({
          path: file.webkitRelativePath || file.name,
          content,
          encoding: "base64",
        })),
      ),
    )
      .then((payload) =>
        skillsApi("import", {
          files: payload,
          name: String((payload[0] && payload[0].path) || "").split("/")[0],
        }),
      )
      .then((d) => {
        if (!d || !d.ok) throw new Error((d && d.error) || "");
        setNotice({
          kind: "ok",
          text: t("saved.import", { count: (d.imported || []).length || 1 }),
        });
        loadStatus();
      })
      .catch((e) =>
        setNotice({
          kind: "error",
          text: skillsRouteMissing(e)
            ? t("err.skills.needRestart")
            : t("err.action", { error: e.message }),
        }),
      )
      .finally(() => setBusy(false));
  };

  if (!onBeta) return null;

  let list;
  if (!st) {
    list = h("div", {
      className: "dshpp-skel",
      style: { height: 80, margin: 12 },
    });
  } else if (!st.skills || st.skills.length === 0) {
    list = h("p", { className: "dshpp-empty" }, t("skills.empty"));
  } else {
    list = st.skills.map((item) => {
      const isEdit = item.id === editId;
      return h(
        "div",
        {
          key: item.id,
          className: "dshpp-ruleitem" + (isEdit ? " is-edit" : ""),
          role: "button",
          tabIndex: 0,
          onClick: () => openSkill(item.id),
          onKeyDown: (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openSkill(item.id);
            }
          },
        },
        h(
          "div",
          { className: "dshpp-rule-main" },
          h("span", { className: "dshpp-rule-name" }, item.id),
          h(
            "span",
            { className: "dshpp-rule-meta" },
            (item.valid ? item.description : t("skills.invalid")) +
              " · " +
              formatSize(item.size),
          ),
          item.valid
            ? h(
                "span",
                { className: "dshpp-rule-meta" },
                [
                  item.userInvocable
                    ? t("skills.call.slash", { cmd: "/" + item.id })
                    : t("skills.call.userOff"),
                  item.modelInvocable
                    ? t("skills.call.model")
                    : t("skills.call.modelOff"),
                ].join(" · "),
              )
            : null,
        ),
        h(
          "div",
          { className: "dshpp-rule-ops" },
          h(
            Btn,
            {
              tiny: true,
              kind: "danger",
              disabled: busy,
              onClick: (e) => {
                e.stopPropagation();
                if (!window.confirm(t("confirm.delete.skill", { id: item.id })))
                  return;
                if (editId === item.id) clearEditor();
                doPost("delete", { id: item.id });
              },
            },
            t("delete"),
          ),
        ),
      );
    });
  }

  return h(
    "section",
    { className: "dshpp-panel", "aria-label": t("skills.title") },
    h(
      "div",
      { className: "dshpp-head" },
      h("h3", { className: "dshpp-title" }, t("skills.title")),
      h(
        "div",
        { className: "dshpp-row", style: { margin: 0 } },
        noticeNode(notice),
      ),
    ),
    h(
      "p",
      {
        className: "dshpp-hint",
        style: { margin: "0 0 10px", color: "var(--dshpp-mute)", fontSize: 12 },
      },
      hostText(t, "skills.hint", hostSurfaceOf()),
    ),
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
              ref: zipRef,
              type: "file",
              accept: ".zip,.tgz,.tar.gz,.tar,.skill",
              style: { display: "none" },
              onChange: (e) => {
                const file = e.target.files && e.target.files[0];
                e.target.value = "";
                importZip(file);
              },
            }),
            h("input", {
              ref: (el) => {
                folderRef.current = el;
                if (!el) return;
                el.setAttribute("webkitdirectory", "");
                el.setAttribute("directory", "");
                el.multiple = true;
              },
              type: "file",
              multiple: true,
              style: { display: "none" },
              onChange: (e) => {
                const files = Array.from((e.target && e.target.files) || []);
                e.target.value = "";
                importFolder(files);
              },
            }),
            h(
              Btn,
              {
                kind: "primary",
                tiny: true,
                disabled: busy,
                onClick: () => zipRef.current && zipRef.current.click(),
              },
              t("btn.importZip"),
            ),
            h(
              Btn,
              {
                tiny: true,
                disabled: busy,
                onClick: () => folderRef.current && folderRef.current.click(),
              },
              t("btn.importFolder"),
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
                  placeholder: t("ph.skill.desc"),
                  value: editDesc,
                  onChange: (e) => setEditDesc(e.target.value),
                }),
              ),
              h("textarea", {
                key: "body",
                className: "dshpp-area",
                value: content,
                onChange: (e) => setContent(e.target.value),
                spellCheck: false,
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
                        description: editDesc,
                      }),
                  },
                  t("btn.saveSkill"),
                ),
                noticeNode(notice),
              ),
            ]
          : h("div", { className: "dshpp-editor-empty" }, t("skills.pick")),
      ),
    ),
  );
}
