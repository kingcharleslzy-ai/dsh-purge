// [dsh-purge] 从 core.js 逐字搬移（社区版 1.6.69 补丁表拆分），语义零改动。
const repeatStart = [
  "\tctx.on(\"tools/post-execute\", async (exec, _result, next) => {",
  "\t\tconst reminder = observe(exec);",
  "\t\tconst downstream = await next();",
  "\t\tif (!reminder) return downstream;",
];
const legacyBlock = [
  "\t\tif (downstream.kind === \"block\") return {",
  "\t\t\tkind: \"block\",",
  "\t\t\tfeedback: downstream.feedback,",
  "\t\t\tadditionalContexts: prependContext(reminder, downstream.additionalContexts)",
  "\t\t};",
];
const repeatEnd = [
  "\t\treturn {",
  "\t\t\t...downstream,",
  "\t\t\tadditionalContexts: prependContext(reminder, downstream.additionalContexts)",
  "\t\t};",
  "\t});",
  "\tctx.on(\"agent/pre-step\", ({ agent, messages }, next) => {",
  "\t\tif (messages.some((message) => message.source.kind === \"user\")) chains.delete(agent);",
  "\t\treturn next();",
  "\t});",
];

export const OPT_IN_PATCHES = [
  {
    "id": 18,
    "name": "REPEAT_TOOL_REMINDER_DISABLED",
    "layer": "代码",
    "layer_en": "Code",
    "desc": "重复调用守卫禁用 / repeat-tool-reminder disabled（可选，默认关闭；开启会取消上下文保护）",
    "file": "repeat-tool-reminder",
    "rel": [
      "lib",
      "index.js"
    ],
    replacements: [legacyBlock, []].map(block => ({
      pattern: [...repeatStart, ...block, ...repeatEnd].join("\n"),
      replace: "\t// [dsh-purge] repeat-tool-reminder disabled: no reminder injection,\n\t// no chain tracking. The guard is fully inert.",
    })),
    forbid: ['ctx.on("tools/post-execute"', 'ctx.on("agent/pre-step"'],
    "markers": [
      "[dsh-purge] repeat-tool-reminder disabled"
    ],
    "optional": true,
    "disabledByDefault": true,
    "optIn": true
  },
  {
    "id": 19,
    "name": "TOOL_RESULT_PRUNER_DISABLED",
    "layer": "代码",
    "layer_en": "Code",
    "desc": "工具结果修剪禁用 / tool-result pruner disabled（可选，默认关闭；开启会取消上下文保护）",
    "file": "compaction-tool-result-pruner",
    "rel": [
      "lib",
      "index.js"
    ],
    "replacements": [
      {
        "pattern": "\tpruneContent(blocks) {\n\t\tconst totalChars = this.measureContent(blocks);\n\t\tif (totalChars <= this.config.thresholdChars) return null;",
        "replace": "\tpruneContent(blocks) {\n\t\t// [dsh-purge] tool-result pruning disabled: results pass through unchanged.\n\t\treturn null;"
      }
    ],
    "markers": [
      "[dsh-purge] tool-result pruning disabled"
    ],
    "optional": true,
    "disabledByDefault": true,
    "optIn": true
  }
];

