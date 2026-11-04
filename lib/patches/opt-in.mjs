// [dsh-purge] 从 core.js 逐字搬移（社区版 1.6.69 补丁表拆分），语义零改动。
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
    "replacements": [
      {
        "pattern": "\tctx.on(\"tools/post-execute\", async (exec, _result, next) => {\n\t\tconst reminder = observe(exec);\n\t\tconst downstream = await next();\n\t\tif (!reminder) return downstream;\n\t\tif (downstream.kind === \"block\") return {\n\t\t\tkind: \"block\",\n\t\t\tfeedback: downstream.feedback,\n\t\t\tadditionalContexts: prependContext(reminder, downstream.additionalContexts)\n\t\t};\n\t\treturn {\n\t\t\t...downstream,\n\t\t\tadditionalContexts: prependContext(reminder, downstream.additionalContexts)\n\t\t};\n\t});\n\tctx.on(\"agent/pre-step\", ({ agent, messages }, next) => {\n\t\tif (messages.some((message) => message.source.kind === \"user\")) chains.delete(agent);\n\t\treturn next();\n\t});",
        "replace": "\t// [dsh-purge] repeat-tool-reminder disabled: no reminder injection,\n\t// no chain tracking. The guard is fully inert."
      }
    ],
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

