import {
  h,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "../shared/react.js";
import { apiJson } from "../api/client.js";
import { useT } from "../shared/locale.js";
import { Btn, HelpTip } from "./primitives.js";
/**
 * Unregistered translations return their key. Use readable English fallbacks.
 */
function useText() {
  const t = useT();
  return (key, fallback) => {
    const hit = t(key);
    return hit && hit !== key ? hit : fallback;
  };
}
/**
 * Compact self-check and boost controls keep Apply at the top of the page.
 */
export function StatusExtras() {
  const [check, setCheck] = useState(null);
  const [boost, setBoost] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const load = () =>
    Promise.all([
      apiJson("/dsh-purge/selfcheck")
        .then(setCheck)
        .catch(() => setCheck(null)),
      apiJson("/dsh-purge/boost")
        .then((r) => setBoost(!!r.enabled))
        .catch(() => setBoost(null)),
    ]);
  useEffect(() => {
    load();
  }, []);
  async function toggle() {
    try {
      const r = await apiJson("/dsh-purge/boost", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ enabled: !boost }),
      });
      setBoost(!!r.enabled);
      setNotice(
        r.enabled
          ? "Enabled; takes effect after restart"
          : "Disabled; takes effect after restart",
      );
    } catch (e) {
      setNotice(e.message);
    }
  }
  async function rerun() {
    setBusy(true);
    try {
      setCheck(await apiJson("/dsh-purge/selfcheck"));
    } catch (e) {
      setNotice(e.message);
    } finally {
      setBusy(false);
    }
  }
  const layers = check && Array.isArray(check.layers) ? check.layers : [];
  const failed = layers.filter(
    (l) => l.state === "broken" || (!l.state && !l.ok),
  );
  const pendingLayers = layers.filter((l) => l.state === "pending");
  const uncertain = layers.filter((l) =>
    ["inferred", "unknown"].includes(l.state),
  );
  const pendingPatches = pendingLayers.reduce(
    (n, l) => n + (l.pending?.length || 0),
    0,
  );
  const total = layers.filter((layer) => layer.applicable !== false).length;
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "Patch status" },
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        h("i", {
          className:
            "dshpp-dot " +
            (check
              ? failed.length
                ? "is-bad"
                : pendingLayers.length || uncertain.length
                  ? "is-warn"
                  : "is-ok"
              : ""),
        }),
        "Self-check",
        h(
          "b",
          null,
          check
            ? failed.length
              ? `${failed.length} layers inactive`
              : pendingLayers.length
                ? `${pendingPatches} patches pending`
                : uncertain.length
                  ? `${uncertain.length} layers need confirmation`
                  : `All ${total} layers in place`
            : "Checking…",
        ),
      ),
      h(
        "details",
        { className: "dshpp-fold-inline" },
        h("summary", null, "View layers"),
        h(
          "div",
          { className: "dshpp-checks" },
          check && Array.isArray(check.layers)
            ? check.layers.map((layer) =>
                h(
                  "div",
                  {
                    key: layer.title,
                    className:
                      "dshpp-check" +
                      (["pending", "inferred", "unknown"].includes(layer.state)
                        ? " is-warn"
                        : layer.ok
                          ? ""
                          : " is-bad"),
                  },
                  h("i", {
                    className:
                      "dshpp-dot " +
                      (["pending", "inferred", "unknown"].includes(layer.state)
                        ? "is-warn"
                        : layer.ok
                          ? "is-ok"
                          : "is-bad"),
                  }),
                  h("span", { className: "dshpp-check-name" }, layer.title),
                  h(
                    "span",
                    { className: "dshpp-check-val" },
                    layer.applicable === false
                      ? "Not applicable"
                      : layer.state === "pending"
                        ? `Pending #${(layer.pending || []).join("/#")}`
                        : layer.state === "inferred"
                          ? "Inferred from host"
                          : layer.state === "unknown"
                            ? "Unconfirmed"
                            : `${layer.applied}/${layer.required ?? layer.total}`,
                  ),
                  layer.note
                    ? h(HelpTip, { title: layer.title }, layer.note)
                    : null,
                ),
              )
            : h("div", { className: "dshpp-muted" }, "Checking…"),
        ),
      ),
      h(
        Btn,
        { tiny: true, disabled: busy, onClick: rerun },
        busy ? "…" : "Recheck",
      ),
      h(
        Btn,
        {
          tiny: true,
          title:
            "Generate a one-time probe and check whether the next reply echoes its marker exactly",
          onClick: async () => {
            try {
              const r = await apiJson("/dsh-purge/probe", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: "{}",
              });
              setNotice(r.message || "");
            } catch (e) {
              setNotice(e.message);
            }
          },
        },
        "Probe",
      ),
    ),
    h(
      "div",
      { className: "dshpp-line" },
      h(
        "span",
        { className: "dshpp-line-main" },
        "Prompt boost",
        h(
          HelpTip,
          { title: "Prompt boost" },
          "Appends a section at the end of the system prompt, at the same level as the injection: priority declarations, refusal handling, anti-sycophancy, and repeated instructions across turns. Enabled by default.",
        ),
        h("b", null, boost === null ? "…" : boost ? "Enabled" : "Disabled"),
      ),
      h(
        Btn,
        { tiny: true, disabled: boost === null, onClick: toggle },
        boost ? "Disable" : "Enable",
      ),
      notice ? h("span", { className: "dshpp-muted" }, notice) : null,
    ),
  );
}

export function assertMaintenanceResult(result) {
  if (!result || typeof result !== "object")
    throw new Error("The maintenance API returned an invalid result");
  if (result.ok === false) {
    const errors = Array.isArray(result.errors)
      ? result.errors.filter(Boolean).join("; ")
      : "";
    const partial = result.applied
      ? "; some targets were updated. Restart their DSH processes to load the changes"
      : "";
    throw new Error(
      (result.error || errors || "Maintenance operation failed") + partial,
    );
  }
}
export function maintenanceNotice(op, result) {
  if (op === "backup") {
    if (!result.id)
      throw new Error(
        "The backup operation returned no backup ID. Refresh the list to verify the result",
      );
    return `Backup created: ${result.id}`;
  }
  if (op === "rollback")
    return (
      (result.note || "Plugin rollback completed") +
      ". Restart the DSH process; refreshing the browser alone will not load the updated backend."
    );
  if (op === "update") {
    if (result.applied === false || result.skipped)
      return (
        result.note ||
        "No new version was installed. The current installation was not updated."
      );
    if (result.applied || result.needRestart || result.restart_required) {
      const version =
        result.release?.version || result.localVersion || result.remoteVersion;
      const warnings = result.cleanup_warnings || [];
      const cleanup = warnings.length
        ? `Cleanup incomplete (${warnings.map((w) => `${w.stage}:${w.code}`).join(", ")}); remaining files were retained. `
        : "";
      return `${cleanup}Plugin installed${version ? ": " + version : ""}. Restart the DSH process; refreshing the browser alone will not load the updated backend.`;
    }
    return (
      result.note ||
      "Update request completed. Refresh the status to verify the installation result."
    );
  }
  return result.note || "Maintenance operation completed";
}

export function UpdatePreferences({
  value,
  status = {},
  onSaved,
  onOpenChannel,
}) {
  const tr = useText();
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  const locked = useRef(false);
  if (!value) return null;
  async function save(patch) {
    if (locked.current) return;
    locked.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "preferences", value: patch }),
      });
      assertMaintenanceResult(result);
      onSaved(result.update_preferences);
    } catch (e) {
      setError(e.message);
    } finally {
      locked.current = false;
      setSaving(false);
    }
  }
  return h(
    "section",
    { "aria-label": "Automatic update settings", className: "dshpp-card" },
    h(
      "div",
      { className: "dshpp-row" },
      h(
        "label",
        null,
        h("input", {
          type: "checkbox",
          checked: value.autoCheck,
          disabled: saving,
          onChange: (e) => save({ autoCheck: e.target.checked }),
          "aria-label": "Automatically check for updates",
        }),
        "Automatically check for updates",
      ),
      h(HelpTip, {
        title: "Automatically check for updates",
        children:
          "Checks 30 seconds after startup, then at the selected interval. Disabling this pauses automatic installation while preserving its saved preference.",
      }),
      h(
        "select",
        {
          "aria-label": "Update check interval",
          value: value.intervalHours,
          disabled: saving || !value.autoCheck,
          onChange: (e) => save({ intervalHours: Number(e.target.value) }),
        },
        [...new Set([1, 6, 12, 24, value.intervalHours])]
          .sort((a, b) => a - b)
          .map((v) =>
            h(
              "option",
              { key: v, value: v },
              `Every ${v} hour${v === 1 ? "" : "s"}`,
            ),
          ),
      ),
      // Keep the update channel beside the controls whose proxy/token it configures.
      onOpenChannel
        ? h(
            Btn,
            {
              tiny: true,
              className: "dshpp-updch-open",
              disabled: saving,
              onClick: () => onOpenChannel(),
              title: tr(
                "updch.title",
                "Update channel: proxy and GitHub token",
              ),
            },
            tr("updch.open", "Update channel"),
          )
        : null,
    ),
    h(
      "div",
      { className: "dshpp-row" },
      h(
        "label",
        null,
        h("input", {
          type: "checkbox",
          checked: value.autoInstall,
          disabled: saving,
          onChange: (e) => save({ autoInstall: e.target.checked }),
          "aria-label": "Automatically install updates",
        }),
        "Automatically install updates",
      ),
      h(HelpTip, {
        title: "Automatically install updates",
        children:
          "Installs only when automatic checks are enabled and a new stable release is available without a version lock. Backs up and verifies the release before installation; failures do not switch sources automatically. Restart DSH manually afterward.",
      }),
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      status.reconciliationError
        ? "Installation status needs verification. Automatic installation is paused."
        : status.restartRequired
          ? `Version on disk: ${status.pendingVersion}; running: ${status.runningVersion || "unknown"}. Waiting for you to restart DSH manually.`
          : !value.autoCheck
            ? "Automatic checks are disabled. Automatic installation is paused."
            : status.checkedAt
              ? `Last checked: ${new Date(status.checkedAt).toLocaleString()}${status.hasUpdate ? ` · Available version: ${status.availableVersion}` : ""}`
              : "Checks automatically after startup. Installation prompts you to restart manually.",
    ),
    [
      ...new Set(
        [
          status.reconciliationError,
          status.error,
          status.installError,
          error,
        ].filter(Boolean),
      ),
    ].map((message) => h("p", { key: message, role: "alert" }, message)),
  );
}

/**
 * Update channel: proxy URL and GitHub token.
 * The API returns an empty githubToken and a hasGithubToken flag, never plaintext.
 * Blank token input preserves the saved token; clearGithubToken removes it.
 * A fixed-position overlay avoids relying on host support for react-dom portals.
 */
export function UpdateChannelDialog({ value, onClose, onSaved }) {
  const tr = useText();
  const [proxy, setProxy] = useState(value?.proxyUrl || "");
  const [mirror, setMirror] = useState(value?.mirrorUrl || "");
  const [token, setToken] = useState("");
  const [clearToken, setClearToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const proxyRef = useRef(null);
  const hasToken = !!value?.hasGithubToken;
  useEffect(() => {
    try {
      proxyRef.current?.focus?.();
    } catch {
      /* The host may lack a real DOM; focus failures must not prevent saving. */
    }
  }, []);
  useEffect(() => {
    if (typeof document === "undefined" || !document.addEventListener)
      return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  async function save() {
    if (saving) return;
    const next = {};
    if (mirror.trim() !== (value?.mirrorUrl || ""))
      next.mirrorUrl = mirror.trim();
    if (proxy.trim() !== (value?.proxyUrl || "")) next.proxyUrl = proxy.trim();
    // Clearing takes precedence over replacement to avoid conflicting actions.
    if (clearToken) next.clearGithubToken = true;
    else if (token.trim()) next.githubToken = token.trim();
    setSaving(true);
    setError("");
    try {
      const result = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op: "preferences", value: next }),
      });
      assertMaintenanceResult(result);
      onSaved(result.update_preferences);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }
  return h(
    "div",
    {
      className: "dshpp-updch-mask",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": tr("updch.title", "Update channel: proxy and GitHub token"),
      onClick: (e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      },
    },
    h(
      "div",
      { className: "dshpp-updch-card" },
      h(
        "h4",
        { className: "dshpp-updch-title" },
        tr("updch.title", "Update channel: proxy and GitHub token"),
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        tr(
          "updch.scope",
          "The proxy and token apply only to this plugin's update checks and downloads. They do not affect model-provider requests or the host process environment. Leave blank to inherit the existing update proxy environment.",
        ),
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, "GitHub mirror (optional)"),
        h("input", {
          type: "text",
          value: mirror,
          placeholder: "https://mirror.example/",
          onChange: (e) => setMirror(e.target.value),
          disabled: saving,
        }),
        h(
          "small",
          null,
          "Used for queries and downloads without sending the GitHub token. Installation still retrieves official checksums from GitHub, optionally through the update proxy. Leave blank to disable the mirror.",
        ),
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, tr("updch.proxy", "Proxy URL")),
        h("input", {
          ref: proxyRef,
          type: "text",
          className: "dshpp-field dshpp-updch-field",
          "aria-label": tr("updch.proxy", "Proxy URL"),
          value: proxy,
          disabled: saving,
          placeholder: tr("updch.proxy.ph", "socks5://127.0.0.1:60808"),
          spellCheck: false,
          autoComplete: "off",
          onChange: (e) => setProxy(e.target.value),
        }),
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        tr(
          "updch.proxy.hint",
          "Supports http://, https://, and socks5:// URLs, such as http://127.0.0.1:7890. Leave blank to inherit the existing update proxy environment.",
        ),
      ),
      h(
        "label",
        { className: "dshpp-updch-label" },
        h("span", null, tr("updch.token", "GitHub token")),
        h("input", {
          type: "password",
          className: "dshpp-field dshpp-updch-field",
          "aria-label": tr("updch.token", "GitHub token"),
          value: token,
          disabled: saving || clearToken,
          placeholder: tr(
            "updch.token.ph",
            "Optional: increases the GitHub API quota. Leave blank to keep unchanged",
          ),
          spellCheck: false,
          autoComplete: "off",
          onChange: (e) => setToken(e.target.value),
        }),
      ),
      h(
        "p",
        { className: "dshpp-hint" },
        hasToken
          ? tr(
              "updch.token.set",
              "A token is configured on this machine. The field always starts empty; saving it empty preserves the token.",
            )
          : tr(
              "updch.token.unset",
              "No token is configured on this machine. Leave blank to keep it unset.",
            ),
      ),
      hasToken
        ? h(
            "label",
            { className: "dshpp-updch-check" },
            h("input", {
              type: "checkbox",
              checked: clearToken,
              disabled: saving,
              "aria-label": tr("updch.token.clear", "Clear the saved token"),
              onChange: (e) => setClearToken(!!e.target.checked),
            }),
            h("span", null, tr("updch.token.clear", "Clear the saved token")),
          )
        : null,
      error ? h("p", { role: "alert" }, error) : null,
      h(
        "div",
        { className: "dshpp-updch-ops" },
        h(
          Btn,
          { disabled: saving, onClick: onClose },
          tr("updch.cancel", "Cancel"),
        ),
        h(
          Btn,
          { kind: "primary", disabled: saving, onClick: save },
          saving ? tr("updch.saving", "Saving…") : tr("updch.save", "Save"),
        ),
      ),
    ),
  );
}

// A successful save updates any other mounted settings entry in this client.
const preferenceListeners = new Set();
function publishPreferences(next) {
  for (const receive of preferenceListeners) receive(next);
}

export function CommunityMaintenance({ localVersion = "" } = {}) {
  const [value, setValue] = useState(null),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [selected, setSelected] = useState(""),
    [releases, setReleases] = useState(null),
    [release, setRelease] = useState("");
  const [listState, setListState] = useState("loading"),
    [listError, setListError] = useState("");
  const [channelOpen, setChannelOpen] = useState(false);
  const tr = useText();
  const mounted = useRef(false),
    generation = useRef(0),
    running = useRef(false);
  const latestSave = useRef(null);
  const load = useCallback(async () => {
    const previousSave = latestSave.current;
    const request = ++generation.current;
    setListState("loading");
    setListError("");
    try {
      const result = await apiJson("/dsh-purge/community");
      assertMaintenanceResult(result);
      if (!Array.isArray(result.backups))
        throw new Error("Invalid backup list response");
      if (!mounted.current || request !== generation.current) return;
      setValue(
        previousSave === latestSave.current
          ? result
          : { ...result, update_preferences: latestSave.current },
      );
      setSelected((current) =>
        result.backups.some((b) => b.id === current) ? current : "",
      );
      setListState("ready");
    } catch (e) {
      if (!mounted.current || request !== generation.current) return;
      setListError(e.message);
      setListState("error");
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const receive = (next) => {
      latestSave.current = next;
      setValue(
        (current) => current && { ...current, update_preferences: next },
      );
    };
    preferenceListeners.add(receive);
    load();
    return () => {
      preferenceListeners.delete(receive);
      mounted.current = false;
      generation.current++;
    };
  }, [load]);
  async function run(op) {
    if (running.current) return;
    if (
      op === "rollback" &&
      !window.confirm(
        "Roll back the Purge plugin and its entry points while preserving current prompts and settings? Restart the DSH process afterward; refreshing the browser alone will not load the updated backend. Continue?",
      )
    )
      return;
    if (
      op === "update" &&
      !window.confirm(
        "Create a backup, then install the selected stable community release? Host patches will not be reapplied. Restart the DSH process afterward; refreshing the browser alone will not load the updated backend. Continue?",
      )
    )
      return;
    running.current = true;
    setBusy(true);
    setNotice("Working…");
    try {
      const r = await apiJson("/dsh-purge/community", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, id: selected, ref: release }),
      });
      assertMaintenanceResult(r);
      if (!mounted.current) return;
      if (op === "check") {
        if (!Array.isArray(r.versions))
          throw new Error("Invalid release list response");
        setReleases(r.versions.filter((v) => v.asset));
        setRelease(r.versions.find((v) => v.asset)?.ref || "");
        setNotice(
          r.degraded
            ? `${r.degraded}; ${r.stale ? "Showing a cached list. Try again later" : "Showing the fallback list"}`
            : r.error
              ? `Update check failed: ${r.error}`
              : r.hasUpdate
                ? `New version available: ${r.remoteVersion}`
                : "The latest stable version is installed",
        );
      } else {
        setNotice(maintenanceNotice(op, r));
      }
    } catch (e) {
      if (mounted.current)
        setNotice(
          e.message === "timeout"
            ? "The maintenance request timed out; the operation may still be running. Refresh the status before submitting again."
            : e.message,
        );
    } finally {
      // A failed write may already have created a recovery snapshot. Read once;
      // never replay the mutation to discover whether it succeeded.
      if (op !== "check" && mounted.current) await load();
      running.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  return h(
    "section",
    { className: "dshpp-panel", "aria-label": "Community edition maintenance" },
    h(
      "div",
      { className: "dshpp-maint-head" },
      h("h3", null, "Maintenance: updates and local backups"),
      localVersion
        ? h(
            "span",
            { className: "dshpp-maint-ver" },
            "Local v" + localVersion,
            h("b", null, "Current"),
          )
        : null,
    ),
    // Summarize proxy and token configuration without exposing the token.
    // The channel button sits beside the automatic update check control.
    value
      ? h(
          "p",
          { className: "dshpp-hint" },
          (value.update_preferences?.proxyUrl
            ? tr("updch.state.proxy", "Update channel proxy: ") +
              value.update_preferences.proxyUrl
            : tr(
                "updch.state.direct",
                "Update channel: inherited environment or system proxy",
              )) +
            " · " +
            (value.update_preferences?.hasGithubToken
              ? tr("updch.state.token.on", "GitHub token configured")
              : tr("updch.state.token.off", "No GitHub token configured")),
        )
      : null,
    h(UpdatePreferences, {
      value: value?.update_preferences,
      status: value?.update_status,
      onSaved: publishPreferences,
      onOpenChannel: () => setChannelOpen(true),
    }),
    h(
      "div",
      { className: "dshpp-row" },
      h(
        Btn,
        { disabled: busy, onClick: () => run("check") },
        "Check for community updates",
      ),
      h(
        Btn,
        {
          disabled: busy,
          onClick: async () => {
            try {
              const r = await apiJson("/dsh-purge/audit?limit=10");
              const lines = (r.entries || []).map(
                (x) =>
                  `${new Date(x.at).toLocaleString()}  ${x.event}  ${JSON.stringify(
                    Object.fromEntries(
                      Object.entries(x).filter(
                        ([k]) => !["at", "event", "pid"].includes(k),
                      ),
                    ),
                  )}`,
              );
              setNotice(
                lines.length ? lines.join("\n") : "No actions recorded yet",
              );
            } catch (e) {
              setNotice(e.message);
            }
          },
        },
        "Recent actions",
      ),
      h(
        "a",
        {
          href: "https://github.com/kingcharleslzy-ai/dsh-purge/releases",
          target: "_blank",
          rel: "noreferrer",
        },
        "Release history",
      ),
    ),
    releases?.length
      ? h(
          "div",
          { className: "dshpp-row" },
          h(
            "select",
            {
              "aria-label": "Select a community release",
              value: release,
              onChange: (e) => setRelease(e.target.value),
              disabled: busy,
            },
            releases.map((r) =>
              h("option", { key: r.ref, value: r.ref }, r.label),
            ),
          ),
          h(
            Btn,
            { disabled: busy || !release, onClick: () => run("update") },
            "Install selected version",
          ),
        )
      : null,
    h("h3", { style: { marginTop: 20 } }, "Local backups"),
    h(
      Btn,
      { disabled: busy || listState === "loading", onClick: load },
      "Refresh backups",
    ),
    listState === "loading"
      ? h("p", { role: "status" }, "Loading backups…")
      : null,
    listState === "error"
      ? h("p", { role: "alert" }, `Failed to load backups: ${listError}`)
      : null,
    listState === "ready" && !value.backups.length
      ? h("p", { role: "status" }, "No backups yet")
      : null,
    h(
      "div",
      { className: "dshpp-row" },
      h(Btn, { disabled: busy, onClick: () => run("backup") }, "Back up now"),
      h(
        "select",
        {
          "aria-label": "Select a backup to restore",
          value: selected,
          onChange: (e) => setSelected(e.target.value),
          disabled: busy || listState !== "ready",
        },
        h("option", { value: "" }, "Select a backup"),
        ...(value?.backups || []).map((b) =>
          h(
            "option",
            { key: b.id, value: b.id },
            `${new Date(b.created_at).toLocaleString()} · ${b.plugins.map((p) => p.version).join(" / ")}`,
          ),
        ),
      ),
      h(
        Btn,
        {
          disabled: busy || !selected || listState !== "ready",
          onClick: () => run("rollback"),
        },
        "Roll back plugin",
      ),
    ),
    h(
      "p",
      { className: "dshpp-hint" },
      "Backups are stored locally. Rollback preserves current prompts, rules, and other plugin settings. Restart the DSH process after installation or rollback; refreshing the browser alone will not load the updated backend.",
    ),
    notice ? h("p", { role: "status" }, notice) : null,
    // Fixed positioning lets the dialog escape its container without a portal.
    channelOpen && value
      ? h(UpdateChannelDialog, {
          value: value.update_preferences,
          onClose: () => setChannelOpen(false),
          onSaved: (next) => {
            publishPreferences(next);
            setNotice(
              tr(
                "updch.saved",
                "Update channel saved. It takes effect on the next update check.",
              ),
            );
          },
        })
      : null,
  );
}
