// Source archives have no node_modules. Only annotate a missing direct dependency.
try {
  import.meta.resolve("yaml");
} catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND") {
    error.message += "\nThe source installation is missing yaml. Run npm ci --omit=dev --ignore-scripts in the plugin source root containing package-lock.json.";
  }
  throw error;
}
export const { parseDocument, isMap, isSeq, isScalar } = await import("yaml");
