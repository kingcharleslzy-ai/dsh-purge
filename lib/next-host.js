/**
 * DSH NEXT 宿主家族（第三方桌面壳 `dsh-desktop-next`）。
 *
 * 设计约束（对应 review 意见）：
 *  1. 只认包证据：根 `package.json` 的 `name` + `main` 必须存在，绝不看 exe 文件名；
 *  2. 与官方 `@deepseek-ai/dsh-desktop-host` 家族完全分开，不进入
 *     `QUALIFIED_HOST_VERSIONS` 的资格判定，也不改变官方路径的失败语义；
 *  3. 布局差异集中在这里说明：NEXT 的 `@deepseek-ai` 位于应用根 `node_modules/`，
 *     没有官方那种 `dsh/node_modules/` 前缀。
 */
import path from "node:path";

export const NEXT_FAMILY = Object.freeze({
  id: "dsh-desktop-next",
  product: "DSH NEXT",
  // 独立家族：补丁锚点未经逐条回归，不参与官方 qualified 判定
  qualified: false,
});

/** 该 package.json 是否属于 NEXT 家族（第三方桌面壳）。 */
export function isNextPackage(meta) {
  return Boolean(meta) && meta.name === NEXT_FAMILY.id;
}

/** 把根 package.json 转成身份对象；与官方 identity 的返回形状保持一致。 */
export function nextIdentity(meta) {
  if (!isNextPackage(meta)) return null;
  return {
    kind: "next",
    family: NEXT_FAMILY.id,
    product: NEXT_FAMILY.product,
    package: meta.name,
    version: typeof meta.version === "string" ? meta.version : "",
  };
}

/** NEXT 的 @deepseek-ai 只可能在这两个位置（解包目录优先于归档旁路）。 */
export function nextAiBaseCandidates(resources) {
  if (!resources) return [];
  return [
    path.join(resources, "app", "node_modules", "@deepseek-ai"),
    path.join(resources, "app.asar.unpacked", "node_modules", "@deepseek-ai"),
  ];
}

/** NEXT 的官方 CLI 修复位置（用于判断“修复是否真的不适用”）。 */
export function nextCliShim(resources) {
  return resources ? path.join(resources, "runtime", "cli", "bin", "dsh") : "";
}

/**
 * CLI 修复结论。NEXT 没有官方那套 `runtime/cli/bin/dsh` shim：
 *  - 没有 shim → 明确 notApplicable，`ok` 保持 false（我们确实没修、也没验证）；
 *  - 居然有 shim → 说明这是未知变体，按失败处理，交由调用方拦下换包。
 * 绝不返回 `ok: true` 来表达“跳过”。
 */
export function nextCliRepairVerdict({ shimExists = false } = {}) {
  if (shimExists) {
    return {
      ok: false,
      notApplicable: false,
      status: "unsupported_family",
      reason: "next_family_cli_shim_present_but_unsupported",
    };
  }
  return {
    ok: false,
    notApplicable: true,
    status: "not_applicable",
    reason: "next_family_has_no_runtime_cli",
  };
}
