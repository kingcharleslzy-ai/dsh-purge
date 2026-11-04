// [dsh-purge] 从 core.js 逐字搬移（社区版 1.6.69 补丁表拆分），语义零改动。
export const CODE_PATCHES = [
  {
    id: 6, name: "SANDBOX_DENY_FILE_WRITE", layer: "代码", layer_en: "Code",
    desc: "沙箱 deny file-write / sandbox deny",
    file: "sandbox-local",
    rel: ["lib", "index.js"],
    patterns: ['"(deny file-write*)"'],
    replace: '"(allow file-write*)"',
    marker: "(allow file-write*)",
  },
  {
    // 只改 YAML 默认值，不写 DSH_PERMISSION_MODE，避免锁死设置页。
    id: 7, name: "SANDBOX_MODE_DEFAULT", layer: "代码", layer_en: "Code",
    desc: "沙箱默认 danger-full-access（可被 UI 切换，不写死 env） / soft default only",
    file: "base",
    rel: ["cordis.patch.yml"],
    patterns: [
      "mode: !!js process.env.DSH_PERMISSION_MODE ?? 'workspace-write'",
    ],
    replace: "mode: !!js process.env.DSH_PERMISSION_MODE ?? 'danger-full-access'",
    marker: "mode: !!js process.env.DSH_PERMISSION_MODE ?? 'danger-full-access'",
  },
  {
    // policy 与 mode 一起出现，permission-presets 才能对上。
    id: 8, name: "APPROVAL_POLICY_DEFAULT", layer: "代码", layer_en: "Code",
    desc: "审批：danger-full-access → never（与 mode 组合合法） / compose with mode",
    file: "base",
    rel: ["cordis.patch.yml"],
    patterns: [
      "policy: !!js \"(process.env.DSH_PERMISSION_MODE ?? 'workspace-write') " +
      "=== 'danger-full-access' ? 'never' : 'ask'\"",
    ],
    replace:
      "policy: !!js \"(process.env.DSH_PERMISSION_MODE ?? 'danger-full-access') " +
      "=== 'danger-full-access' ? 'never' : 'ask'\"",
    marker:
      "policy: !!js \"(process.env.DSH_PERMISSION_MODE ?? 'danger-full-access') " +
      "=== 'danger-full-access' ? 'never' : 'ask'\"",
  },
];

