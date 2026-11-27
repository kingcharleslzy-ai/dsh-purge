import { h, useEffect, useRef, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { apiJson } from "../api/client.js";
import { noticeNode } from "./primitives.js";

const LAYERS = ["main", "boost", "protocol"];

// 逗号或换行分隔的文本 -> 字符串数组
function parseList(text) {
  return String(text || "")
    .split(/[\n,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function listText(list) {
  return Array.isArray(list) ? list.join(", ") : "";
}

// 把服务端返回的 config 写进表单状态
function applyConfig(cfg, setters) {
  const presets = listText(cfg.excludePresets);
  const sessions = listText(cfg.excludeSessions);
  setters.setEnabled(cfg.enabled !== false);
  setters.setPresetsText(presets);
  setters.setSessionsText(sessions);
  setters.setLayered(!!cfg.layers);
  setters.setLayers(
    cfg.layers
      ? {
          main: cfg.layers.main !== false,
          boost: cfg.layers.boost !== false,
          protocol: cfg.layers.protocol !== false,
        }
      : { main: true, boost: true, protocol: true },
  );
  setters.lastSavedPresets.current = presets;
  setters.lastSavedSessions.current = sessions;
}

/**
 * 注入层设置。
 *
 * 写盘走宿主 configEditor（官方 Loader 路径），不做任何手写文件的后备方案。
 * 宿主不提供该服务时给出明确提示，而不是静默失败。
 */
export function InjectSettings() {
  const t = useT();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState({ kind: "idle", text: "" });
  const [enabled, setEnabled] = useState(true);
  const [presetsText, setPresetsText] = useState("");
  const [sessionsText, setSessionsText] = useState("");
  const [layers, setLayers] = useState({
    main: true,
    boost: true,
    protocol: true,
  });
  const [layered, setLayered] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // 记录上次成功写入的列表值，避免失焦时无变化也触发 Loader 协调。
  const lastSavedPresets = useRef("");
  const lastSavedSessions = useRef("");

  const setters = {
    setEnabled,
    setPresetsText,
    setSessionsText,
    setLayers,
    setLayered,
    lastSavedPresets,
    lastSavedSessions,
  };

  useEffect(() => {
    let active = true;
    setNotice({ kind: "idle", text: "" });
    apiJson("/dsh-purge/inject-config").then(
      (d) => {
        if (!active) return;
        applyConfig((d && d.config) || {}, setters);
        setReady(true);
      },
      (e) => {
        if (!active) return;
        setNotice({
          kind: "error",
          text: String(e && e.message ? e.message : e),
        });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt]);

  async function save(patch) {
    setBusy(true);
    setNotice({ kind: "idle", text: "" });
    try {
      const d = await apiJson("/dsh-purge/inject-config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (d && d.ok === false) throw new Error(d.error || "save failed");
      applyConfig((d && d.config) || {}, setters);
      setNotice({ kind: "ok", text: t("inject.saved") });
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      // configEditor 不可用属于宿主能力缺失，不是用户操作错误，单独提示。
      const hint = /configEditor|unavailable|not found/i.test(msg)
        ? " " + t("inject.noHost")
        : "";
      setNotice({ kind: "error", text: msg + hint });
    } finally {
      setBusy(false);
    }
  }

  const disabled = !ready || busy;

  return h(
    "section",
    { className: "dshpp-composer-settings" },
    h("h3", null, t("inject.title")),
    h("p", { style: { opacity: 0.8, margin: "0 0 10px" } }, t("inject.desc")),

    h(
      "label",
      { className: "dshpp-setting-row" },
      t("inject.enabled"),
      h("input", {
        type: "checkbox",
        role: "switch",
        checked: enabled,
        disabled,
        onChange: (e) => save({ enabled: e.target.checked }),
      }),
    ),

    h("h4", { style: { margin: "14px 0 6px" } }, t("inject.layers")),
    h(
      "p",
      { style: { opacity: 0.75, margin: "0 0 8px", fontSize: "0.9em" } },
      layered ? t("inject.layersHint") : t("inject.layersUnset"),
    ),
    ...LAYERS.map((layer) =>
      h(
        "label",
        { className: "dshpp-setting-row", key: layer },
        t("inject.layer." + layer),
        h("input", {
          type: "checkbox",
          role: "switch",
          checked: layers[layer],
          disabled,
          onChange: (e) => save({ layers: { [layer]: e.target.checked } }),
        }),
      ),
    ),

    h("h4", { style: { margin: "14px 0 6px" } }, t("inject.presets")),
    h(
      "p",
      { style: { opacity: 0.75, margin: "0 0 6px", fontSize: "0.9em" } },
      t("inject.presetsHint"),
    ),
    h("textarea", {
      className: "dshpp-textarea",
      rows: 2,
      value: presetsText,
      disabled,
      placeholder: "roleplay, minimal",
      onChange: (e) => setPresetsText(e.target.value),
      onBlur: () => {
        const next = parseList(presetsText);
        if (listText(next) !== lastSavedPresets.current)
          save({ excludePresets: next });
      },
    }),

    h("h4", { style: { margin: "14px 0 6px" } }, t("inject.sessions")),
    h(
      "p",
      { style: { opacity: 0.75, margin: "0 0 6px", fontSize: "0.9em" } },
      t("inject.sessionsHint"),
    ),
    h("textarea", {
      className: "dshpp-textarea",
      rows: 2,
      value: sessionsText,
      disabled,
      placeholder: t("inject.sessionsPlaceholder"),
      onChange: (e) => setSessionsText(e.target.value),
      onBlur: () => {
        const next = parseList(sessionsText);
        if (listText(next) !== lastSavedSessions.current)
          save({ excludeSessions: next });
      },
    }),

    notice.text ? noticeNode(notice) : null,
    !ready && notice.kind === "error"
      ? h(
          "button",
          {
            type: "button",
            onClick: () => {
              setNotice({ kind: "idle", text: "" });
              setAttempt(attempt + 1);
            },
          },
          t("inject.retry"),
        )
      : null,
  );
}
