// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { Pill } from "./primitives.js";

export function statusKind(st) {
  if (st === "applied" || st === "already") return "ok";
  if (st === "pending") return "wait";
  if (st === "unmatched") return "bad";
  if (st === "partial") return "bad";
  if (st === "drifted") return "bad";
  if (st === "na") return "ok";
  if (
    st === "missing_file" ||
    st === "skipped" ||
    st === "unlocated" ||
    st === "off"
  )
    return "miss";
  return "bad";
}

export function statusLabel(st, t) {
  if (st === "applied" || st === "already") return t("status.applied");
  if (st === "off") return t("status.skipped");
  if (st === "pending") return t("status.pending");
  if (st === "unmatched") return t("status.unmatched");
  if (st === "partial") return t("status.partial");
  if (st === "drifted") return t("status.drifted");
  if (st === "skipped") return t("status.skipped");
  if (st === "missing_file") return t("skip");
  if (st === "unlocated") return t("status.unlocated");
  if (st === "na") return t("status.na");
  return st || t("unknown");
}

export function shimKind(v) {
  if (v === "patched" || v === "n/a") return "ok";
  if (v === "original") return "wait";
  if (v === "missing" || !v) return "miss";
  return "bad";
}

export const LAYER_GROUP = {
  提示词: "prompt",
  代码: "code",
  工具: "tools",
  "0.1.5 兼容": "compat",
  "0.2.0 兼容": "dsh20",
};

export const GROUP_ORDER = ["prompt", "code", "tools", "compat", "dsh20"];

export function patchRowsOf(state) {
  if (!state || !state.ai_base) return [];
  const fromList = Array.isArray(state.patches) ? state.patches : null;
  const rows = fromList
    ? fromList.map((p) => ({
        id: Number(p.id),
        st: p.status || "missing_file",
        layer: p.layer || "",
      }))
    : Object.keys(state.patch_status || {}).map((id) => ({
        id: Number(id),
        st: state.patch_status[id],
        layer: "",
      }));
  return rows.filter((r) => r.st && r.st !== "na" && Number.isFinite(r.id));
}

export function tallyPatches(rows) {
  const out = {
    applied: 0,
    pending: 0,
    unmatched: 0,
    partial: 0,
    skipped: 0,
    total: 0,
  };
  for (const row of rows || []) {
    out.total += 1;
    if (row.st === "applied" || row.st === "already") out.applied += 1;
    else if (row.st === "pending") out.pending += 1;
    else if (row.st === "unmatched") out.unmatched += 1;
    else if (row.st === "partial") out.partial += 1;
    else if (row.st === "drifted") out.drifted += 1;
    else out.skipped += 1;
  }
  return out;
}

export function PatchGroups({ state }) {
  const t = useT();
  const [open, setOpen] = useState({});
  if (state?.ok === false)
    return h(
      "p",
      { role: "status" },
      "读取失败，补丁明细暂不可用；请刷新重试。",
    );
  if (!state || !state.patch_status)
    return h("div", { className: "dshpp-skel", style: { height: 120 } });
  const located = !!state.ai_base;
  if (!located) return null;
  const grouped = new Map();
  for (const row of patchRowsOf(state)) {
    const key = LAYER_GROUP[row.layer] || "code";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  return GROUP_ORDER.filter((key) => grouped.has(key)).map((key) => {
    const rows = grouped
      .get(key)
      .slice()
      .sort((a, b) => a.id - b.id);
    if (!rows.length) return null;
    const tally = tallyPatches(rows);
    const notes = [];
    if (tally.pending)
      notes.push(t("metric.pendingShort", { n: tally.pending }));
    if (tally.unmatched)
      notes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
    if (tally.partial)
      notes.push(t("metric.partialShort", { n: tally.partial }));
    if (tally.skipped) notes.push(t("metric.skipShort", { n: tally.skipped }));
    const expanded = !!open[key];
    return h(
      "div",
      { key: key, className: "dshpp-group" },
      h(
        "button",
        {
          type: "button",
          className: "dshpp-group-h",
          "aria-expanded": expanded ? "true" : "false",
          onClick: () =>
            setOpen((prev) => Object.assign({}, prev, { [key]: !prev[key] })),
        },
        h("strong", null, t("group." + key)),
        h(
          "span",
          { className: "dshpp-count" },
          tally.applied +
            "/" +
            tally.total +
            (notes.length ? " · " + notes.join(" · ") : ""),
        ),
      ),
      expanded
        ? h(
            "table",
            { className: "dshpp-table" },
            h(
              "thead",
              null,
              h(
                "tr",
                null,
                h("th", null, "#"),
                h("th", null, t("table.patch")),
                h("th", null, t("table.status")),
              ),
            ),
            h(
              "tbody",
              null,
              rows.map((r) =>
                h(
                  "tr",
                  { key: r.id },
                  h("td", { className: "dshpp-id" }, "#" + r.id),
                  h("td", null, t("patch." + r.id)),
                  h(
                    "td",
                    null,
                    h(Pill, { value: r.st }),
                    r.st === "partial"
                      ? h(
                          "span",
                          { className: "dshpp-sub" },
                          t("status.partialDetail", {
                            done: (state.patch_files?.[r.id] || []).filter(
                              (f) => f.status === "applied",
                            ).length,
                            total: (state.patch_files?.[r.id] || []).length,
                          }),
                        )
                      : null,
                  ),
                ),
              ),
            ),
          )
        : null,
    );
  });
}
