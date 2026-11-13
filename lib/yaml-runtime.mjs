// Source archives have no node_modules. Only annotate a missing direct dependency.
try {
  import.meta.resolve("yaml");
} catch (error) {
  if (error.code === "ERR_MODULE_NOT_FOUND") {
    error.message += "\n源码安装缺少 yaml。请在插件源码根目录（含 package-lock.json）运行 npm ci --omit=dev --ignore-scripts。";
  }
  throw error;
}
export const { parseDocument, isMap, isSeq, isScalar } = await import("yaml");
