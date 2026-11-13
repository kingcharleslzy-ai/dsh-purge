// In affected builds the Cordis tree budget excludes the state record wrapper.
// Limit recovery to the state buffer's overflow branch, after it restored the
// previous value. Other topics and all serialization/observer errors propagate.
const limitError = 'throw new Error("inspector: source state exceeds the source-frame byte limit");';
const reserveMarker = "/* [dsh-purge] reserve inspector record overhead */";
const dropMarker = "/* [dsh-purge] discard oversized Cordis tree */";

function treeBudgetPatch(id, file, moduleName, budget) {
  const budgetLine = `maxBytes: ${budget} - 4096`;
  const indent = moduleName === "index.js" ? "\t\t\t" : "\t\t\t\t\t";
  const restore = "else this.state.set(topic, previous);\n" + indent;
  return {
    id,
    name: id === 95 ? "INSPECTOR_FRAME_BUDGET_RECORD_OVERHEAD" : "INSPECTOR_FRAME_BUDGET_RECORD_OVERHEAD_CLIENT",
    layer: "代码",
    layer_en: "Code",
    desc: "Cordis 树预留记录开销，超限时保留上一帧",
    file,
    rel: ["lib", moduleName],
    replacements: [
      { pattern: budgetLine + "\n", replace: budgetLine + " - 1024 " + reserveMarker + "\n", expect: 1 },
      { pattern: restore + limitError, replace: restore + 'if (topic === "cordis/tree") return; ' + dropMarker + "\n" + indent + limitError, expect: 1 },
    ],
    markers: [reserveMarker, dropMarker],
    optional: true,
  };
}

export const STABILITY_PATCHES = [
  treeBudgetPatch(95, "experimental-inspector", "index.js", "spec.maxSourceFrameBytes"),
  treeBudgetPatch(96, "experimental-inspector-client", "client.js", "bootstrap.maxFrameBytes"),
];
