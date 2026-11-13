// Plugin detail surfaces: the title badge, the summary strip, the maintenance
// section and the row summary. Every one of them filters on the subject itself —
// the host broadcasts the detail slots to every plugin page, and an item page
// carries no package at all.
import { h, useEffect, useState } from "../shared/react.js";
import { apiJson } from "../api/client.js";
import { compatibilityLevelText, useT } from "../shared/locale.js";
import { patchRowsOf, tallyPatches } from "./patch-status.js";

export const BUNDLE_NAME = __COMMUNITY__
  ? "dsh-purge-community"
  : "dsh-purge-panel";
export const ROW_ID = __COMMUNITY__ ? "dsh-purge" : "dsh-purge-panel";
export const REPO_URL = "https://github.com/kingcharleslzy-ai/dsh-purge";

// One cached read of /dsh-purge/status shared by the badge and the section, so
// opening a detail page costs one request instead of one per contribution.
const TTL = 30000;
const box = { at: 0, value: null, pending: null, listeners: new Set() };

function publish(value) {
  box.value = value;
  box.at = Date.now();
  for (const fn of box.listeners) {
    try {
      fn(value);
    } catch {
      /* one throwing listener must not stop the others */
    }
  }
}

export function publishDetailStatus(value) {
  // A reported failure is kept: the page names the error instead of going blank.
  publish(value || null);
}

export function readDetailStatus(force = false) {
  if (box.value && !force && Date.now() - box.at < TTL)
    return Promise.resolve(box.value);
  if (box.pending) return box.pending;
  box.pending = apiJson("/dsh-purge/status")
    .then((d) => {
      publishDetailStatus(d);
      return box.value;
    })
    .catch((error) => {
      // A failed read is reported, not swallowed: the page names the reason.
      publishDetailStatus({
        ok: false,
        error: (error && error.message) || String(error),
      });
      return box.value;
    })
    .finally(() => {
      box.pending = null;
    });
  return box.pending;
}

export function useDetailStatus(enabled = true) {
  const [value, setValue] = useState(box.value);
  useEffect(() => {
    if (!enabled) return undefined;
    let live = true;
    const fn = (next) => {
      if (live) setValue(next);
    };
    box.listeners.add(fn);
    readDetailStatus();
    if (box.value !== value) setValue(box.value);
    return () => {
      live = false;
      box.listeners.delete(fn);
    };
  }, [enabled]);
  return value;
}

/** Applied/total over the same rows the panel's group view uses, falling back
 *  to the flat counters for a host that returns no per-patch list. */
export function tallyOf(state) {
  const rows = patchRowsOf(state || undefined);
  const tally = tallyPatches(rows);
  const flatTotal = Number(state && state.patches_total) || 0;
  const flatApplied = Number(state && state.patches_applied) || 0;
  return {
    applied: tally.total ? tally.applied : flatApplied,
    total: tally.total || flatTotal,
    all: Number(state && state.patches_total_all) || 0,
    pending: tally.pending || 0,
  };
}

const CHIP = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  padding: "1px 7px",
  border:
    "0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1, transparent))",
  borderRadius: "var(--dsw-radius-sm, 4px)",
  color: "var(--dsw-alias-label-secondary, inherit)",
  fontSize: "12px",
  lineHeight: "18px",
  whiteSpace: "nowrap",
};

const SECTION = {
  display: "flex",
  flexDirection: "column",
  gap: "6px",
  marginTop: "18px",
  paddingTop: "12px",
  borderTop:
    "0.5px solid var(--dsw-alias-border-l2, var(--dsw-alias-border-l1, transparent))",
};

const ROW = {
  display: "grid",
  gridTemplateColumns: "minmax(6em, max-content) 1fr",
  gap: "4px 12px",
  margin: 0,
  fontSize: "13px",
  lineHeight: "20px",
};

const KEY = { color: "var(--dsw-alias-label-secondary, inherit)", margin: 0 };
const VAL = { margin: 0, color: "var(--dsw-alias-label-primary, inherit)" };

function row(key, value, index) {
  return [
    h("dt", { key: "k" + index, style: KEY }, key),
    h("dd", { key: "v" + index, style: VAL }, value),
  ];
}

function dash(value) {
  return value === undefined || value === null || value === ""
    ? "—"
    : String(value);
}

/** Title-row badge: applied/total, ours only. */
export function PatchBadge(props) {
  const t = useT();
  const subject = props && props.subject;
  const mine = Boolean(
    subject &&
    subject.kind === "bundle" &&
    subject.pkg &&
    subject.pkg.name === BUNDLE_NAME,
  );
  const state = useDetailStatus(mine);
  if (!mine) return null;
  const tally = tallyOf(state);
  if (!tally.total) return null;
  return h(
    "span",
    {
      style: CHIP,
      title: t("panel.badge.title", {
        applied: tally.applied,
        total: tally.total,
      }),
    },
    t("panel.patches", { applied: tally.applied, total: tally.total }),
  );
}

/** One strip above the panel body: version, host, patches, compatibility, channel. */
export function DetailSummary({ status }) {
  const t = useT();
  const state = status || null;
  if (!state) {
    return h(
      "p",
      {
        className: "dshpp-hint",
        role: "status",
        style: { margin: "0 0 10px" },
      },
      t("panel.na"),
    );
  }
  const tally = tallyOf(state);
  const compat = state.compatibility || {};
  const items = [
    t("panel.version", {
      version: dash(state.plugin_version || __PANEL_VERSION__),
    }),
    t("panel.host", { version: dash(compat.host_version) }),
    tally.total
      ? t("panel.patches", { applied: tally.applied, total: tally.total })
      : null,
    compat.level ? compatibilityLevelText(t, compat.level) : null,
    state.channel ? t("panel.channel", { channel: state.channel }) : null,
  ].filter(Boolean);
  return h(
    "div",
    { className: "dshpp-strip", role: "status", style: { flexWrap: "wrap" } },
    items.map((text, index) =>
      h("span", { key: index, className: "dshpp-strip-item" }, text),
    ),
  );
}

/** Page-bottom section: what the plugin keeps on disk, how it is installed, where it comes from. */
export function DetailSection(props) {
  const t = useT();
  const subject = props && props.subject;
  const mine = Boolean(
    subject &&
    subject.kind === "bundle" &&
    subject.pkg &&
    subject.pkg.name === BUNDLE_NAME,
  );
  const state = useDetailStatus(mine);
  if (!mine) return null;
  if (!state || state.ok === false) {
    return h(
      "section",
      { style: SECTION },
      h("h3", null, t("panel.section.title")),
      h("p", { className: "dshpp-hint" }, t("panel.na")),
    );
  }
  const tally = tallyOf(state);
  const skills = Array.isArray(state.skills) ? state.skills.length : 0;
  const layout = state.host_layout || {};
  const install = [
    layout.family ? String(layout.family) : "",
    state.surface ? String(state.surface) : "",
    state.asar_still_sealed === true ? t("panel.install.sealed") : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const rows = [
    [
      t("panel.backup"),
      state.has_backup ? t("panel.backup.yes") : t("panel.backup.no"),
    ],
    [
      t("panel.prompt"),
      dash(state.override_status) +
        (state.override_path ? " · " + state.override_path : ""),
    ],
    [t("panel.skills"), skills ? String(skills) : t("panel.none")],
    [
      t("panel.hooks"),
      state.hooks_deny_bypass ? t("panel.hooks.on") : t("panel.hooks.off"),
    ],
    [t("panel.patches.pending"), String(tally.pending)],
    [t("panel.install"), install || t("panel.none")],
    [t("panel.home"), dash(state.dsh_home)],
  ];
  return h(
    "section",
    { style: SECTION },
    h(
      "h3",
      { style: { margin: 0, fontSize: "14px" } },
      t("panel.section.title"),
    ),
    h(
      "dl",
      { style: ROW },
      rows.map((pairs, index) => row(pairs[0], pairs[1], index)),
    ),
    h(
      "p",
      { className: "dshpp-hint", style: { margin: "6px 0 0" } },
      t("panel.about"),
      " ",
      h(
        "a",
        { href: REPO_URL, target: "_blank", rel: "noreferrer noopener" },
        REPO_URL.replace("https://", ""),
      ),
      " · MIT · ",
      t("panel.about.upstream"),
    ),
  );
}

/** `plugins.row.config` summary view: one line for the row card. */
export function RowSummary() {
  const t = useT();
  const state = useDetailStatus();
  if (!state) return h("span", null, t("panel.na"));
  const tally = tallyOf(state);
  const compat = state.compatibility || {};
  const parts = [
    tally.total
      ? t("panel.patches", { applied: tally.applied, total: tally.total })
      : null,
    compat.level ? compatibilityLevelText(t, compat.level) : null,
    state.channel ? t("panel.channel", { channel: state.channel }) : null,
  ].filter(Boolean);
  return h("span", null, parts.join(" · "));
}
