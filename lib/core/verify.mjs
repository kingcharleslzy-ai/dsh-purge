// [dsh-purge] 补丁状态判定簇：这条补丁在这个文件里算不算完成；自 core.js 逐字搬移，仅补 export。
import { ALL_PATCHES } from "../patches/index.mjs";
import { adapterFor, detectSurface } from "../surface.js";
import { nativeSteeringRestored } from "../steering.js";
import { asLf, isYamlPath, collapseDuplicateLegacyApplyPath, rewriteStaleLegacyApplyCall, modernSettingsApi, modernSettingsPatch, patchApplied, cloneRegExp, isLayoutSoftPatch, patchReplacements, isBareIdentityNeedle, yamlJsCommentsToHash } from "./shared.mjs";

export function applyReplacementsToText(text, patch, fp = "") {
  let source = text;
  let preChanged = false;
  if (patch?.id === 42 && modernSettingsApi(asLf(source))) return modernSettingsPatch(source, patch);
  if (patch?.id === 42) {
    const collapsed = collapseDuplicateLegacyApplyPath(source);
    if (collapsed !== source) {
      source = collapsed;
      preChanged = true;
    }
    const rewritten = rewriteStaleLegacyApplyCall(source);
    if (rewritten !== source) {
      source = rewritten;
      preChanged = true;
    }
  }
  // 插入型补丁锚点仍在，已有标记则不再 replaceAll。
  if (patch.skipIfMarked && patchApplied(source, patch)) {
    return { text: source, changed: preChanged };
  }
  const crlf = typeof source === "string" && source.includes("\r\n");
  const yaml = isYamlPath(fp);
  let out = asLf(source);
  let changed = false;
  for (const rep of patchReplacements(patch)) {
    const { pattern, replace } = rep;
    if (!pattern || typeof replace !== "string") continue;
    // YAML 块标量行首有缩进；无缩进 identity+\n\n 会留下 6 空格，再和下一段拼成 12 空格。
    if (yaml && isBareIdentityNeedle(pattern)) continue;
    const written = yaml ? yamlJsCommentsToHash(asLf(replace)) : asLf(replace);
    // 正则 pattern：用于自匹配型替换（产物包含原 pattern，如 timeoutMs 追加 0）。
    if (pattern instanceof RegExp) {
      // 命中数契约对正则同样生效：官方复制同一段代码时正则会把两处一起改掉。
      if (typeof rep.expect === "number") {
        const hits = (out.match(cloneRegExp(pattern, true)) || []).length;
        if (hits !== rep.expect) {
          return { text: source, changed: preChanged, hitMismatch: { patch_id: patch?.id, expected: rep.expect, actual: hits, file: fp } };
        }
      }
      const re = cloneRegExp(pattern, true);
      re.lastIndex = 0;
      if (!re.test(out)) continue;
      re.lastIndex = 0;
      // 用字符串形态调用：保留 $1..$9 展开语义（回调形态会把 "$1" 当字面量写进文件）。
      const next = out.replace(re, written);
      if (next === out) continue;
      out = next;
      changed = true;
      continue;
    }
    const needle = asLf(pattern);
    // 命中数契约：声明 expect 时命中数必须完全一致才允许写；0 次也算不符。
    // 它同时是"上游又改了"的探针——多一处/少一处会当场暴露，而不是把不相干的第二处一起改掉。
    if (typeof rep.expect === "number") {
      const hits = needle ? out.split(needle).length - 1 : 0;
      if (hits !== rep.expect) {
        return { text: source, changed: preChanged, hitMismatch: { patch_id: patch?.id, expected: rep.expect, actual: hits, file: fp } };
      }
    }
    if (!out.includes(needle)) continue;
    const next = out.split(needle).join(written);
    if (next === out) continue;
    out = next;
    changed = true;
  }
  // Do not partially migrate an unrecognized steering implementation.
  if (patch?.id === 90 && changed && !nativeSteeringRestored(out)) {
    // 静默丢弃时面板只会一直显示 pending，看不出是「锚点只命中一部分」。
    console.warn(
      `[dsh-purge] #90 steering 迁移被放弃：${fp || "未知文件"} 只命中部分改写，原文保持不变`,
    );
    return { text, changed: false };
  }
  // Preserve the existing host backup on repeated apply: otherwise the generic
  // upgrade detector treats a fully restored file as new vendor code.
  if (patch?.id === 90 && changed && !out.includes("// [dsh-purge] native steering restored (#90)")) {
    out = "// [dsh-purge] native steering restored (#90)\n" + out;
  }
  if (crlf) out = out.replace(/\n/g, "\r\n");
  return { text: out, changed: changed || preChanged };
}

export function rollupPatchStatus({ applied, already, missing, notFound, lastError, keyCount, layoutSoft, strictFiles }) {
  if (strictFiles && lastError) return lastError;
  if (strictFiles && notFound > 0) return "pattern_not_found";
  if (applied > 0) return "applied";
  if (already > 0 && (notFound === 0 || layoutSoft)) return "already";
  if (missing === keyCount) return "missing_file";
  if (lastError) return lastError;
  // 文件在，但这份原文不在：列表里本来就是跳过，不能再把整次应用判失败。
  if (notFound === 0) return "skipped";
  return "pattern_not_found";
}

export const ALWAYS_SOFT_STATUSES = new Set(["applied", "already", "missing_file", "skipped", "na", "off", "disabled"]);

export function patchAppliesHere(patch, surface = detectSurface()) {
  const want = patch?.surfaces;
  if (!Array.isArray(want) || want.length === 0) return true;
  const adapter = adapterFor(surface);
  return want.includes(adapter) || want.includes(surface);
}

export function isPatchResultSoftOk(row, patch = null) {
  if (!row) return false;
  if (ALWAYS_SOFT_STATUSES.has(row.status)) return true;
  const p = patch || ALL_PATCHES.find((x) => x.id === row.patch_id || x.id === row.id);
  if (p?.strictFiles && row.status === "pattern_not_found") return false;
  if (p?.optional && row.status === "pattern_not_found") return true;
  if (isLayoutSoftPatch(p) && row.status === "pattern_not_found") return true;
  return false;
}

export function summarizeApplyReport(report, patches = ALL_PATCHES) {
  const byId = new Map(patches.map((p) => [p.id, p]));
  const failed = [];
  const soft = [];
  for (const row of report) {
    const patch = byId.get(row.patch_id) || byId.get(row.id);
    if (isPatchResultSoftOk(row, patch)) soft.push(row);
    else failed.push(row);
  }
  return {
    failed,
    soft,
    applied: report.filter((r) => r.status === "applied").length,
    already: report.filter((r) => r.status === "already").length,
  };
}

export const DISPLAY_GROUP_BY_ID = new Map();

export const DISPLAY_SKIP = new Set(["skipped", "missing_file", "off"]);

export const DISPLAY_DONE = new Set(["applied", "already"]);

export function rollupDisplayStatus(statuses) {
  const list = (statuses || []).filter(Boolean);
  if (list.length === 0) return "skipped";
  if (list.some((s) => s === "pending")) return "pending";
  if (list.some((s) => s === "unmatched")) return "unmatched";
  if (list.every((s) => DISPLAY_SKIP.has(s))) return "skipped";
  if (list.some((s) => DISPLAY_DONE.has(s))) return "applied";
  return "skipped";
}

export function groupPatchesForDisplay(patches = ALL_PATCHES, patch_status = {}, surface) {
  const buckets = new Map();
  for (const p of patches) {
    if (!patchAppliesHere(p, surface)) continue;
    const st = patch_status[p.id];
    if (!st || st === "na") continue;
    const key = DISPLAY_GROUP_BY_ID.get(p.id) || `solo:${p.id}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { lead: p, ids: [], statuses: [] };
      buckets.set(key, bucket);
    }
    bucket.ids.push(p.id);
    bucket.statuses.push(st);
    if (p.id < bucket.lead.id) bucket.lead = p;
  }
  return [...buckets.values()]
    .sort((a, b) => a.lead.id - b.lead.id)
    .map((bucket) => ({
      id: bucket.lead.id,
      ids: bucket.ids,
      layer: bucket.lead.layer || "",
      status: rollupDisplayStatus(bucket.statuses),
    }));
}

export function tallyDisplayPatches(rows) {
  const out = { applied: 0, pending: 0, unmatched: 0, skipped: 0, total: 0, ready: 0 };
  for (const row of rows || []) {
    const st = row.status || row.st;
    out.total += 1;
    if (st === "applied" || st === "already") {
      out.applied += 1;
      out.ready += 1;
    } else if (st === "pending") out.pending += 1;
    else if (st === "unmatched") out.unmatched += 1;
    else {
      out.skipped += 1;
      out.ready += 1;
    }
  }
  return out;
}

export function patchStatusReady(status, patch = null) {
  if (status === "applied" || status === "already" || status === "off" || status === "disabled") return true;
  if (status === "skipped" || status === "missing_file") return true;
  if (status === "na") return false;
  if (status === "pattern_not_found" && patch?.strictFiles) return false;
  if (status === "pattern_not_found" && patch?.optional) return true;
  return false;
}
