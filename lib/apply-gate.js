/**
 * 换包前的 CLI 修复闸门。
 *
 * 原实现把 `repairOfficialCliAfterUnpack()` 的 `ok===true` 同时当作
 * “修好了”与“不需要修”，于是第三方家族只能靠伪造 `ok:true` 才能继续换包。
 * 这里把两种语义拆开：
 *  - `ok === true`            真修好了
 *  - `notApplicable === true` 明确不适用（我们没做，也允许继续）
 *  - 其它                    失败，保留归档、中止换包
 */

export function cliRepairBlocksApply({ handoff = null, sealed = false, cliRepair = null } = {}) {
  if (!handoff || !sealed) return false;
  if (!cliRepair) return true;
  if (cliRepair.ok === true) return false;
  if (cliRepair.notApplicable === true) return false;
  return true;
}

/** 给面板/日志用的归一化描述，避免把“跳过”显示成“成功”。 */
export function describeCliRepair(cliRepair = null) {
  if (!cliRepair) return { state: "missing", ok: false, notApplicable: false };
  if (cliRepair.ok === true) return { ...cliRepair, state: "repaired" };
  if (cliRepair.notApplicable === true) return { ...cliRepair, state: "not_applicable" };
  return { ...cliRepair, state: "failed" };
}
