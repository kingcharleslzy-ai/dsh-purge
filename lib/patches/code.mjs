// [dsh-purge] Moved verbatim from core.js (community 1.6.69 patch table split), semantics unchanged.
export const CODE_PATCHES = [
  {
    id: 6,
    permissionOverride: true,
    name: "SANDBOX_DENY_FILE_WRITE", layer: "Code", layer_en: "Code",
    desc: "sandbox deny file-write / sandbox deny",
    file: "sandbox-local",
    rel: ["lib", "index.js"],
    patterns: ['"(deny file-write*)"'],
    replace: '"(allow file-write*)"',
    marker: "(allow file-write*)",
  },
  {
    // Change only the YAML default; do not write DSH_PERMISSION_MODE, to avoid locking the settings UI.
    id: 7,
    permissionOverride: true,
    name: "SANDBOX_MODE_DEFAULT", layer: "Code", layer_en: "Code",
    desc: "sandbox default danger-full-access (UI-switchable, env not hard-coded) / soft default only",
    file: "base",
    rel: ["cordis.patch.yml"],
    patterns: [
      "mode: !!js process.env.DSH_PERMISSION_MODE ?? 'workspace-write'",
    ],
    replace: "mode: !!js process.env.DSH_PERMISSION_MODE ?? 'danger-full-access'",
    marker: "mode: !!js process.env.DSH_PERMISSION_MODE ?? 'danger-full-access'",
  },
  {
    // policy and mode must appear together so permission-presets can match.
    id: 8,
    permissionOverride: true,
    name: "APPROVAL_POLICY_DEFAULT", layer: "Code", layer_en: "Code",
    desc: "approval: danger-full-access -> never (valid with mode) / compose with mode",
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

