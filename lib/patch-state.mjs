// Shared by diagnostic backends and the browser bundle. No filesystem or host imports.
export function patchNotApplicable(patch, status) {
  return status === "na" || status === "off" || status === "disabled" ||
    (status === "not_needed" && patch?.id === 76) ||
    (status === "missing_file" && patch?.optional === true) ||
    (status === "skipped" && patch?.settleWhenAbsent === true);
}

export function patchStateCategory(patch, status) {
  if (patchNotApplicable(patch, status)) return "inactive";
  if (status === "applied" || status === "already") return "applied";
  if (status === "pending") return "pending";
  if (!status || ["unknown", "unreadable", "unlocated"].includes(status)) return "unknown";
  return "broken";
}

// total counts applicable patches; all also includes explicit inactive entries.
export function summarizePatchRows(rows) {
  const out = {
    all: 0, total: 0, applied: 0, pending: 0, broken: 0, unknown: 0,
    not_applicable: 0, partial: 0, missing_file: 0, skipped: 0,
    na: 0, off: 0, disabled: 0, unmatched: 0, drifted: 0,
  };
  for (const row of rows || []) {
    const status = row.status ?? row.st;
    const category = patchStateCategory(row, status);
    out.all++;
    if (["partial", "missing_file", "skipped", "na", "off", "disabled", "unmatched", "drifted"].includes(status))
      out[status]++;
    if (category === "inactive") out.not_applicable++;
    else {
      out.total++;
      out[category]++;
    }
  }
  return out;
}
