// [dsh-purge] Patch aggregation entry point; exports match the original core.js verbatim.
import { PATCHES } from './prompt.mjs';
import { CODE_PATCHES } from './code.mjs';
import { ENGINE_PATCHES } from './engine.mjs';
import { NEW_TOOL_PATCHES } from './new-tools.mjs';
import { OPT_IN_PATCHES } from './opt-in.mjs';
import { STABILITY_PATCHES } from './stability.mjs';

export const ALL_PATCHES = [...PATCHES, ...CODE_PATCHES, ...ENGINE_PATCHES, ...NEW_TOOL_PATCHES, ...OPT_IN_PATCHES, ...STABILITY_PATCHES];

/** Upgrade chain for the same cleanup item. Apply still runs all ALL_PATCHES; only the cleanup page/count display collapses them into one row. */
export const PATCH_DISPLAY_GROUPS = {
  disclaimer: [1, 2, 3],
  approval_sentence: [5, 11, 12],
  approval_policy: [8, 9, 10],
  desktop_update: [45, 46],
  desktop_close: [83, 84],
  // #85/#86 were replaced by #90 (RESTORE_NATIVE_STEERING) and removed from ALL_PATCHES;
  // keeping the group would leave dead IDs that can never match, so it was removed.
  hang: [87, 88],
  hooks_deny: [30, 31],
  hooks_steer: [64, 65],
};
