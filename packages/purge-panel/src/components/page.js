// Full-page shell for the left sidebar entry. Replaces the old right-sidebar
// drawer: same components, but laid out like a DSH settings page (host font,
// host tokens, one column, explanations in "?" tips instead of paragraphs).
import { h, useState, useEffect, useCallback } from "../shared/react.js";
import { PURGE_CSS, NATIVE_CSS, PAGE_CSS } from "../styles/index.js";
import { compatibilityLevelText, useT } from "../shared/locale.js";
import { RewindSetting } from "./rewind-setting.js";
import { apiJson, unavailableStatus } from "../api/client.js";
import { Btn, HelpTip } from "./primitives.js";
import { PurgifySection } from "./settings-form.js";
import { RulesSection } from "./rules.js";
import { SkillsSection } from "./skills.js";
import { CommunityMaintenance, StatusExtras } from "./maintenance.js";
import { __dshPurgeDrill } from "../vendor/drill.js";
import { readDrillAuth, setDock, requestDrill } from "../state/dock.js";

const TABS = [
  ["status", "Status", "Host compatibility, patches, and self-check"],
  ["prompt", "Prompts", "Prompt injection and boost"],
  ["rules", "Rules", "Rule sets and workspace policies"],
  ["skills", "Skills", "DSH skill directory"],
  ["drill", "Drill", "Red-team exercises and environment setup"],
  ["more", "More", "Conversation appearance and server settings"],
];

function PurgeGlyph({ size = 18 } = {}) {
  return h(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.6,
      "aria-hidden": true,
    },
    h("path", { d: "M12 3l7 3v6c0 4.2-2.9 7.4-7 9-4.1-1.6-7-4.8-7-9V6l7-3z" }),
    h("path", { d: "M9.5 12.2l1.8 1.8 3.4-3.6" }),
  );
}

export function StatusStrip({ info }) {
  const t = useT();
  const compat = info?.compatibility || {};
  const level = compat.level || "";
  const ok = level === "qualified";
  return h(
    "div",
    { className: "dshpp-strip" },
    h(
      "span",
      { className: "dshpp-strip-item" },
      h("i", {
        className: "dshpp-dot " + (ok ? "is-ok" : level ? "is-warn" : ""),
      }),
      "DSH ",
      h("b", null, compat.host_version || "…"),
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "Compatibility level ",
      h(
        "b",
        null,
        level
          ? compatibilityLevelText(t, level)
          : info?.ok === false
            ? "Failed to load"
            : "Checking",
      ),
      h(
        HelpTip,
        { title: "Compatibility level" },
        compat.message ||
          "Determined from host component versions. Qualified means every patch anchor has been regression-tested against this DSH version.",
      ),
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "Patches written to disk ",
      h(
        "b",
        null,
        `${info?.patches_applied ?? "?"}/${info?.patches_total ?? "?"}`,
        info?.patches_na > 0
          ? ` · ${info.patches_na} not applicable locally`
          : "",
      ),
      h(
        HelpTip,
        { title: "Host patches" },
        `Patches actually written into DSH host code; the denominator includes only locally applicable patches. Of ${info?.patches_total_all ?? "?"} patches, ${info?.patches_na ?? 0} target plugins or presets are not installed. Pending means the anchor exists but the patch has not been written. A mismatch means the host source changed and the anchor must be relocated.`,
      ),
    ),
    h(
      "span",
      { className: "dshpp-strip-item" },
      "Plugin ",
      h("b", null, info?.plugin_version || __PANEL_VERSION__),
    ),
  );
}

/** Disk archives and process entry points are separate evidence of runtime state. */
export function LayoutNotice({ info }) {
  if (!info || (!info.asar_still_sealed && !info.host_layout)) return null;
  if (info.host_layout?.family === "tauri") {
    return h(
      "p",
      { className: "dshpp-note", role: "status" },
      info.host_layout.note,
    );
  }
  const sealed = info.asar_still_sealed === true;
  const note =
    info.host_layout?.note ||
    "app.asar remains on the target disk; the current process's load source is unconfirmed.";
  const handoff = info.asar_handoff
    ? ` Archive handoff: ${{ not_scheduled: "Not applied; click Apply to schedule the handoff", archive_reappeared: "The archive reappeared; the previous handoff record does not confirm current completion", backup_missing: "Original archive backup missing; check diagnostics", unknown_target: "Target instance unknown", unreadable: "Handoff record unreadable; check diagnostics", starting: "Helper starting; readiness unconfirmed", ready: "Helper ready", waiting_for_quit: "Waiting for a full exit (macOS Cmd+Q / Windows system tray)", waiting_for_unlock: "Waiting for the archive to unlock", moving: "Preserving the original archive", complete: "Handoff complete; open DSH manually", already_unsealed: "Archive already moved; open DSH manually", failed: "Failed; check diagnostics and follow the recovery documentation", expired: "Wait timed out; apply again or follow the recovery documentation", helper_stopped: "Helper exited unexpectedly; apply again or follow the recovery documentation" }[info.asar_handoff.phase] || info.asar_handoff.phase}.`
    : "";
  const failure = info.asar_handoff?.error;
  const detail = info.asar_handoff?.detail
    ? ` Details: ${info.asar_handoff.detail}${failure?.win32_code != null ? ` (Windows error ${failure.win32_code})` : ""}`
    : "";
  const layout = info.host_layout;
  if (
    info.ok !== false &&
    info.surface === "web" &&
    layout?.disk?.surface === "web" &&
    layout.state === "unknown_runtime" &&
    layout.process?.entry_layout === "unknown" &&
    layout.process.matches_target === null &&
    layout.disk.archive_exists === null &&
    layout.disk.unpacked_exists === null &&
    !info.desktop_exe &&
    !info.desktop_install &&
    !sealed &&
    !layout.errors?.length &&
    info.asar_handoff?.phase === "unknown_target" &&
    !info.asar_handoff.error &&
    !info.asar_handoff.detail
  ) {
    return h(
      "details",
      { className: "dshpp-layout-details" },
      h("summary", null, "Archive handoff: not applicable (web host)"),
      h(
        "p",
        { className: "dshpp-note" },
        "Web services do not require desktop archive handoff. Raw diagnostics: ",
        layout.state,
        " / ",
        info.asar_handoff.phase,
      ),
    );
  }
  const confirmed =
    info.host_layout?.state === "unpacked_entry" &&
    info.host_layout?.process?.matches_target === true &&
    info.host_layout?.disk?.archive_exists === false;
  const diskNote =
    info.host_layout?.disk?.archive_exists === true
      ? " app.asar remains on the target disk."
      : "";
  if (sealed || !confirmed) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      note,
      diskNote,
      handoff,
      detail,
    );
  }
  // Collapse the standing explanation when the handoff is confirmed.
  return h(
    "details",
    { className: "dshpp-layout-details" },
    h(
      "summary",
      null,
      "✓ Started from the unpacked directory (handoff complete)",
    ),
    h("p", { className: "dshpp-note" }, note, diskNote, handoff, detail),
  );
}

/** Make frontend/backend version mismatches visible before settings appear broken. */
export function VersionNotice({ info }) {
  if (info && info.ok === false) {
    return h(
      "p",
      { className: "dshpp-warn", role: "status" },
      `Failed to read status: ${info.error || "API unavailable"}. Current host and patch states are unknown. Click Refresh to retry; if this persists, report your OS, DSH/plugin versions, and this error.`,
    );
  }
  const backend = info?.plugin_version;
  if (!backend || backend === __PANEL_VERSION__) return null;
  return h(
    "p",
    { className: "dshpp-warn", role: "status" },
    `Backend version ${backend}; UI ${__PANEL_VERSION__}. Settings may not work when these differ. Update both to the same version, then restart DSH.`,
  );
}

export function PurgePage() {
  const t = useT();
  const [tab, setTab] = useState("status");
  const [visited, setVisited] = useState({ status: true });
  const [info, setInfo] = useState(null);
  const select = (id) => {
    setTab(id);
    setVisited((v) => Object.assign({}, v, { [id]: true }));
  };
  const loadInfo = () =>
    apiJson("/dsh-purge/status")
      .then(setInfo)
      .catch((error) => setInfo(unavailableStatus(error)));
  // Keep onStatus stable to prevent child effects calling setInfo on every render.
  const mergeInfo = useCallback((s) => s && setInfo(s), []);
  useEffect(() => {
    if (tab === "status") loadInfo();
  }, [tab]);
  useEffect(() => {
    const phase = info?.asar_handoff?.phase;
    if (
      ![
        "starting",
        "ready",
        "waiting_for_quit",
        "waiting_for_unlock",
        "moving",
      ].includes(phase)
    )
      return;
    const timer = setInterval(loadInfo, 2000);
    return () => clearInterval(timer);
  }, [info?.asar_handoff?.phase]);
  const active = TABS.find((row) => row[0] === tab) || TABS[0];
  return h(
    "div",
    { className: "dshpp-page" },
    h("style", null, PURGE_CSS + NATIVE_CSS + PAGE_CSS),
    h(
      "header",
      { className: "dshpp-page-head" },
      h("span", { className: "dshpp-page-glyph" }, h(PurgeGlyph, { size: 20 })),
      h(
        "div",
        { className: "dshpp-page-title" },
        h("h1", null, "Purge"),
        h(
          "p",
          null,
          active[2],
          __COMMUNITY__
            ? h(
                "span",
                { className: "dshpp-page-ver" },
                "Community " + __PANEL_VERSION__,
              )
            : null,
        ),
      ),
    ),
    h(VersionNotice, { info }),
    h(LayoutNotice, { info }),
    h(
      "nav",
      { className: "dshpp-page-tabs", role: "tablist" },
      TABS.map(([id, label]) =>
        h(
          "button",
          {
            key: id,
            type: "button",
            role: "tab",
            "aria-selected": tab === id ? "true" : "false",
            className: tab === id ? "is-on" : "",
            onClick: () => select(id),
          },
          label,
        ),
      ),
    ),
    h(
      "div",
      { className: "dshpp-page-body" },
      h(
        "div",
        { hidden: tab !== "status", className: "dshpp-sec" },
        h(StatusStrip, { info }),
        h(PurgifySection, { page: "status", onStatus: mergeInfo }),
        h(StatusExtras),
        h(CommunityMaintenance, { localVersion: info?.plugin_version || "" }),
      ),
      h(
        "div",
        { hidden: tab !== "prompt", className: "dshpp-sec" },
        visited.prompt ? h(PurgifySection, { page: "prompt" }) : null,
      ),
      h(
        "div",
        { hidden: tab !== "rules", className: "dshpp-sec" },
        visited.rules ? h(RulesSection) : null,
      ),
      h(
        "div",
        { hidden: tab !== "skills", className: "dshpp-sec" },
        visited.skills ? h(SkillsSection) : null,
      ),
      h(
        "div",
        { hidden: tab !== "more", className: "dshpp-sec" },
        __COMMUNITY__ && tab === "more" ? h(RewindSetting) : null,
        visited.more ? h(PurgifySection, { page: "more" }) : null,
      ),
      tab === "drill"
        ? h(
            "div",
            { className: "dshpp-sec dshpp-page-drill" },
            __dshPurgeDrill && __dshPurgeDrill.CSS
              ? h("style", { "data-dsh-purge-drill": "1" }, __dshPurgeDrill.CSS)
              : null,
            readDrillAuth()
              ? h(__dshPurgeDrill.Panel, { embedded: true })
              : h(
                  "div",
                  { className: "dshpp-card" },
                  h(
                    "p",
                    { className: "dshpp-muted" },
                    "Complete the one-time authorization before using the drill console.",
                  ),
                  h(
                    Btn,
                    {
                      kind: "primary",
                      onClick: () => {
                        setDock({ tab: "drill", authOpen: true });
                        requestDrill("auth");
                      },
                    },
                    "Authorize",
                  ),
                ),
          )
        : null,
    ),
    h(
      "footer",
      { className: "dshpp-page-foot" },
      __COMMUNITY__
        ? "Independently maintained, based on YuJunZhiXue/dsh-purge 1.1.71 · MIT · Original author credited"
        : "Independently maintained UI · Based on YuJunZhiXue/dsh-purge 1.1.71 (MIT)",
    ),
  );
}

export { PurgeGlyph };
