/**
 * DSH NEXT host family (third-party desktop shell `dsh-desktop-next`).
 *
 * Design constraints (per review feedback):
 *  1. Package evidence only: root `package.json` must have `name` + `main`; never the exe filename;
 *  2. Fully separate from the official `@deepseek-ai/dsh-desktop-host` family; never enters
 *     the `QUALIFIED_HOST_VERSIONS` verdict and never changes the official path's failure semantics;
 *  3. Layout differences are documented here: NEXT keeps `@deepseek-ai` in the app root `node_modules/`,
 *     with no official `dsh/node_modules/` prefix.
 */
import path from "node:path";

export const NEXT_FAMILY = Object.freeze({
  id: "dsh-desktop-next",
  product: "DSH NEXT",
  // Separate family: patch anchors were never regressed per patch, so it skips the official qualified verdict
  qualified: false,
});

/** Whether this package.json belongs to the NEXT family (third-party desktop shell). */
export function isNextPackage(meta) {
  return Boolean(meta) && meta.name === NEXT_FAMILY.id;
}

/** Turn the root package.json into an identity object; same shape the official identity returns. */
export function nextIdentity(meta) {
  if (!isNextPackage(meta)) return null;
  return {
    kind: "next",
    family: NEXT_FAMILY.id,
    product: NEXT_FAMILY.product,
    package: meta.name,
    version: typeof meta.version === "string" ? meta.version : "",
  };
}

/** NEXT's @deepseek-ai can only be in these two places (unpacked dir before the archive sidecar). */
export function nextAiBaseCandidates(resources) {
  if (!resources) return [];
  return [
    path.join(resources, "app", "node_modules", "@deepseek-ai"),
    path.join(resources, "app.asar.unpacked", "node_modules", "@deepseek-ai"),
  ];
}

/** Where NEXT's official CLI repair applies (used to decide whether the repair is really inapplicable). */
export function nextCliShim(resources) {
  return resources ? path.join(resources, "runtime", "cli", "bin", "dsh") : "";
}

/**
 * CLI repair verdict. NEXT has none of the official `runtime/cli/bin/dsh` shim:
 *  - no shim -> explicitly notApplicable, `ok` stays false (nothing was repaired or verified);
 *  - a shim present -> an unknown variant: treat as failure and let the caller block the swap.
 * Never return `ok: true` to mean "skipped".
 */
export function nextCliRepairVerdict({ shimExists = false } = {}) {
  if (shimExists) {
    return {
      ok: false,
      notApplicable: false,
      status: "unsupported_family",
      reason: "next_family_cli_shim_present_but_unsupported",
    };
  }
  return {
    ok: false,
    notApplicable: true,
    status: "not_applicable",
    reason: "next_family_has_no_runtime_cli",
  };
}
