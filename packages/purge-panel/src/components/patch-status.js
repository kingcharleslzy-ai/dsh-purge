// UI derived from YuJunZhiXue/dsh-purge 1.1.71 (MIT). See LICENSE.
import { h, useState } from "../shared/react.js";
import { useT } from "../shared/locale.js";
import { Pill, HelpTip } from "./primitives.js";
import {
  statusKind,
  statusLabel,
  shimKind,
  markKind,
} from "../shared/status.js";

export { statusKind, statusLabel, shimKind, markKind };

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
    drifted: 0,
    disabled: 0,
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
    else if (row.st === "disabled") out.disabled += 1;
    else out.skipped += 1;
  }
  return out;
}

/**
 * 补丁矩阵：每个补丁一个方块，按组铺成二维轨道。
 * 86 条补丁不再需要展开表格和滚动，方块颜色即状态，悬停读名称。
 */
export function PatchMatrix({ state }) {
  const t = useT();
  if (!state || state.ok === false) {
    return h(
      "section",
      { className: "dshpp-card", "aria-label": "补丁矩阵" },
      h("h3", null, "补丁矩阵"),
      h(
        "p",
        { className: "dshpp-hint", role: "status" },
        state
          ? "读取失败，补丁明细暂不可用；请刷新重试。"
          : "正在读取补丁状态…",
      ),
    );
  }
  const rows = patchRowsOf(state);
  if (!state.ai_base) {
    return h(
      "section",
      { className: "dshpp-card", "aria-label": "补丁矩阵" },
      h("h3", null, "补丁矩阵"),
      h("p", { className: "dshpp-hint" }, "未定位到宿主，补丁状态未知。"),
    );
  }
  const grouped = new Map();
  for (const row of rows) {
    const key = LAYER_GROUP[row.layer] || "code";
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  }
  const keys = GROUP_ORDER.filter((key) => grouped.has(key));
  const total = rows.length;
  const applied = tallyPatches(rows).applied;
  return h(
    "section",
    { className: "dshpp-card", "aria-label": "补丁矩阵" },
    h(
      "h3",
      null,
      "补丁矩阵",
      h(
        "span",
        { className: "dshpp-card-sub" },
        `${applied}/${total} 已应用`,
        h(
          HelpTip,
          { title: "宿主补丁" },
          "每条补丁一个方块，按组铺开。已应用为绿色，待应用为橙色，没对上或锚点漂移为红色，虚线框表示按选择关闭，灰底表示本机不适用。悬停方块可读补丁名。",
        ),
      ),
    ),
    keys.map((key) => {
      const list = grouped
        .get(key)
        .slice()
        .sort((a, b) => a.id - b.id);
      const tally = tallyPatches(list);
      const notes = [];
      if (tally.pending)
        notes.push(t("metric.pendingShort", { n: tally.pending }));
      if (tally.unmatched)
        notes.push(t("metric.unmatchedShort", { n: tally.unmatched }));
      if (tally.partial)
        notes.push(t("metric.partialShort", { n: tally.partial }));
      if (tally.drifted)
        notes.push(t("metric.driftedShort", { n: tally.drifted }));
      if (tally.disabled)
        notes.push(t("metric.disabledShort", { n: tally.disabled }));
      return h(
        "div",
        { key: key, className: "dshpp-track" },
        h("span", { className: "dshpp-track-name" }, t("group." + key)),
        h(
          "span",
          { className: "dshpp-cells" },
          list.map((row) =>
            h("i", {
              key: row.id,
              className: "dshpp-cell-mark is-" + markKind(row.st),
              title: `#${row.id} ${t("patch." + row.id)} · ${statusLabel(row.st, t)}`,
            }),
          ),
        ),
        h(
          "span",
          { className: "dshpp-track-count" },
          `${tally.applied}/${tally.total}`,
          notes.length
            ? h(
                "span",
                { className: "dshpp-track-note" },
                " " + notes.join(" "),
              )
            : null,
        ),
      );
    }),
  );
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
    if (tally.drifted)
      notes.push(t("metric.driftedShort", { n: tally.drifted }));
    if (tally.disabled)
      notes.push(t("metric.disabledShort", { n: tally.disabled }));
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
