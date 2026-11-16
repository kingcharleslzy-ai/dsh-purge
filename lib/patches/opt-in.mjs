// [dsh-purge] Moved verbatim from core.js (community 1.6.69 patch table split), semantics unchanged.
export const OPT_IN_PATCHES = [
  {
    "id": 18,
    "name": "REPEAT_TOOL_REMINDER_DISABLED",
    "layer": "Code",
    "layer_en": "Code",
    "desc": "disable repeat-call guard / repeat-tool-reminder disabled (optional, off by default; enabling removes context protection)",
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
    "layer": "Code",
    "layer_en": "Code",
    "desc": "disable tool-result pruning / tool-result pruner disabled (optional, off by default; enabling removes context protection)",
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

