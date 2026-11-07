// [dsh-purge] 补丁汇总入口；导出与 core.js 原文逐字一致。
import { PATCHES } from './prompt.mjs';
import { CODE_PATCHES } from './code.mjs';
import { ENGINE_PATCHES } from './engine.mjs';
import { NEW_TOOL_PATCHES } from './new-tools.mjs';
import { OPT_IN_PATCHES } from './opt-in.mjs';
import { PRIVACY_PATCHES } from './privacy.mjs';

export const ALL_PATCHES = [...PATCHES, ...CODE_PATCHES, ...ENGINE_PATCHES, ...NEW_TOOL_PATCHES, ...OPT_IN_PATCHES, ...PRIVACY_PATCHES];

/** 同一条清洗的升级链。Apply 仍按 ALL_PATCHES 全打，只有清洗页 / 计数展示合成一行。 */
export const PATCH_DISPLAY_GROUPS = {
  disclaimer: [1, 2, 3],
  approval_sentence: [5, 11, 12],
  approval_policy: [8, 9, 10],
  desktop_update: [45, 46],
  desktop_close: [83, 84],
  // #85/#86 已被 #90（RESTORE_NATIVE_STEERING）取代并移出 ALL_PATCHES，
  // 这里保留分组只会留下永远命中不到的死 id，故删除。
  hang: [87, 88],
  hooks_deny: [30, 31],
  hooks_steer: [64, 65],
};
