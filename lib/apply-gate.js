/**
 * CLI repair gate before a package swap.
 *
 * The original code read `ok===true` from `repairOfficialCliAfterUnpack()` as both
 * "repaired" and "nothing to repair", so third-party families had to fake `ok:true` to swap.
 * This splits the two meanings:
 *  - `ok === true`            really repaired
 *  - `notApplicable === true` explicitly not applicable (we did nothing, swap may proceed)
 *  - anything else            failure: keep the archive, abort the swap
 */

export function cliRepairBlocksApply({ handoff = null, sealed = false, cliRepair = null } = {}) {
  if (!handoff || !sealed) return false;
  if (!cliRepair) return true;
  if (cliRepair.ok === true) return false;
  if (cliRepair.notApplicable === true) return false;
  return true;
}

/** Normalized description for panel/logs so "skipped" never renders as "success". */
export function describeCliRepair(cliRepair = null) {
  if (!cliRepair) return { state: "missing", ok: false, notApplicable: false };
  if (cliRepair.ok === true) return { ...cliRepair, state: "repaired" };
  if (cliRepair.notApplicable === true) return { ...cliRepair, state: "not_applicable" };
  return { ...cliRepair, state: "failed" };
}
