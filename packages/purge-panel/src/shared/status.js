// 补丁与自检状态的语义分类。独立成模块，避免 primitives 与 patch-status 互相引用。
export function statusKind(st) {
  if (st === "applied" || st === "already") return "ok";
  if (st === "pending") return "wait";
  if (st === "unmatched") return "bad";
  if (st === "partial") return "bad";
  if (st === "drifted") return "bad";
  if (st === "disabled") return "muted";
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
  if (st === "disabled") return t("status.disabled");
  if (st === "skipped") return t("status.skipped");
  if (st === "missing_file") return t("skip");
  if (st === "unlocated") return t("status.unlocated");
  if (st === "na") return t("status.na");
  return st || t("unknown");
}

/** 点阵用的语义色：已应用 / 待应用 / 故障 / 按选择关闭 / 本机不适用。 */
export function markKind(st) {
  if (st === "applied" || st === "already") return "ok";
  if (st === "pending") return "warn";
  if (st === "unmatched" || st === "partial" || st === "drifted") return "bad";
  if (st === "disabled") return "off";
  return "miss";
}

export function shimKind(v) {
  if (v === "patched" || v === "n/a") return "ok";
  if (v === "original") return "wait";
  if (v === "missing" || !v) return "miss";
  return "bad";
}
