# 1.6.64 维护记录：能力审计与 expect 契约

## 审计口径

- 补丁表按 `patchStatusDetail` 逐条核对真机 0.2.1-rc.5；分层统计见发行说明。
- 与上游 1.1.83 按 **name** 对齐：82 vs 82，72 条 replacements 逐字一致；6 条差异（WEB_SURFACE_IDENTITY_NEUTRAL、COMPLETE_PROMPT_KEEP_INJECT、WEB_SURFACE_PROHIBITION、REWIND_DROP_SENT_ON_APPEND、DEEPSEEK_SYSTEM_ROLE、HUNG_PROMPT_LF_NEEDLE）均为我方新增迁移或 rc 修正。
- 上游独有 4 条：#18/#19（上下文保护，非闸）、#85/#86（插话，已由 #90 覆盖）。

## expect 契约

- 声明方式：`{ pattern, replace, expect: 1 }`；字面量与正则都检查；0 次同样算不符。
- 应用路径：`hitMismatch` → `notFound += 1`、`lastError = hit_mismatch:期望!=实际`，不写盘。
- 真机探针：优先读 `.dshpurge.bak`（未打补丁原文），统计字面锚点出现次数，>1 即失败。

## 为什么 #18/#19 仍不启用

它们不是门禁补丁，而是关闭宿主的质量保护：重复调用提醒、工具结果修剪（8192 字符阈值）。启用后长会话上下文会线性膨胀，属于稳定性倒退；上游自己也在 1.1.83 里继续保留。需要时可单独加回，但不进默认表。
