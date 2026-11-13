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
      { pattern: budgetLine + "\n", replace: budgetLine + " - 1024 " + reserveMarker + "\n" },
      { pattern: restore + limitError, replace: restore + 'if (topic === "cordis/tree") return; ' + dropMarker + "\n" + indent + limitError },
      {
        // 0.2.2-rc.2 client bundle is minified onto one line; the formatted
        // anchor above cannot match it. Keep the same rollback-only guard.
        pattern:
          'if(!this.stateFits()){if(previous===void 0)this.state.delete(topic);else this.state.set(topic,previous);throw new Error(`inspector: source state exceeds the source-frame byte limit`)}this.enqueue(record)',
        replace:
          'if(!this.stateFits()){if(previous===void 0)this.state.delete(topic);else this.state.set(topic,previous);if(topic===`cordis/tree`)return; ' + dropMarker + 'throw new Error(`inspector: source state exceeds the source-frame byte limit`)}this.enqueue(record)',
      },
    ],
    markers: [reserveMarker, dropMarker],
    // Hosts that already reserve the wrapper lack the budget anchor but still
    // need the drop-frame guard; either marker proves this patch settled there.
    markersAny: true,
    optional: true,
    // 0.2.2-rc.2/rc.3 already reserve STATE_RECORD_OVERHEAD_BYTES and route the
    // Cordis tree through maxStatePayloadBytes. Absent anchors there mean the
    // hardening is present upstream, not drift.
    silentWhenMissing: true,
  };
}

export const STABILITY_PATCHES = [
  treeBudgetPatch(95, "experimental-inspector", "index.js", "spec.maxSourceFrameBytes"),
  treeBudgetPatch(96, "experimental-inspector-client", "client.js", "bootstrap.maxFrameBytes"),
];
