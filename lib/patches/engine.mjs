// [dsh-purge] Moved verbatim from core.js (community 1.6.69 patch table split), semantics unchanged.
export const ENGINE_PATCHES = [
  {
    id: 9,
    permissionOverride: true,
    name: "APPROVAL_AUTO_GRANT", layer: "Code", layer_en: "Code",
    desc: "approval gate auto-grant / approval auto-grant",
    file: ["user-approval-code", "user-approval-invariant", "user-approval"],
    rel: ["lib", "index.js"],
    replacements: [
      {
        pattern:
          'if (this.effectivePolicy(session) === "never") return "rejected";\n' +
          '\t\tconst answer = Promise.resolve().then(() => this.ctx.waterfall(scopeTarget(req.agent, req.agent), "approval/request", req, () => Promise.resolve("unavailable"))).then((outcome) => OUTCOMES.includes(outcome) ? outcome : "unavailable", () => "unavailable");',
        replace:
          'return "allowed-once";\n' +
          '\t\t// [dsh-purge] approval bypass: every approval request is auto-granted\n' +
          '\t\t// without prompting — no waterfall, no rejection, no fail-closed path.',
      },
      {
        pattern: "if (this.effectivePolicy(session) === 'never')\n            return 'rejected';",
        replace:
          "return 'allowed-once'; // [dsh-purge] approval bypass: types never-policy no longer rejects",
      },
    ],
    markersAny: true,
    markers: [
      'return "allowed-once";\n\t\t// [dsh-purge] approval bypass',
      "[dsh-purge] approval bypass: types never-policy no longer rejects",
    ],
  },
  {
    id: 10,
    permissionOverride: true,
    name: "APPROVAL_CONFIG_DEFAULT_NEVER", layer: "Code", layer_en: "Code",
    desc: "approval config defaults to never / approval config default",
    file: "user-approval-code",
    rel: ["lib", "index.js"],
    patterns: ['static Config = z.object({ policy: z.union(["ask", "never"]).default("ask") });'],
    replace: 'static Config = z.object({ policy: z.union(["ask", "never"]).default("never") });',
    marker: 'z.union(["ask", "never"]).default("never")',
  },
  {
    id: 11, name: "APPROVAL_NEVER_SENTENCE_BYPASS", layer: "Prompt", layer_en: "Prompt",
    desc: "never prompt sentence -> auto-grant / never sentence bypass",
    file: "user-approval-code",
    rel: ["lib", "index.js"],
    replacements: [
      {
        pattern:
          "Approval prompts are disabled in this session: actions that require " +
          "approval are rejected automatically — do not request sandbox " +
          "escalation (do not set `sandbox_permissions`).",
        replace:
          "Approval requests are auto-granted in this session (approval bypass, " +
          "approval policy: never): no approval prompt will appear; request " +
          "sandbox escalation freely with a one-sentence justification.",
      },
    ],
    markersAny: true,
    markers: [
      "auto-granted in this session (approval bypass, approval policy: never)",
      "The host MAX profile has already selected its configured permission policy",
    ],
  },
  {
    id: 12, name: "APPROVAL_ASK_SENTENCE_BYPASS", layer: "Prompt", layer_en: "Prompt",
    desc: "ask prompt sentence -> auto-grant / ask sentence bypass",
    file: ["user-approval-code", "user-approval", "user-approval-invariant"],
    rel: ["lib", "index.js"],
    replacements: [
      {
        pattern:
          "Approval policy: ask. Operations that require approval may ask " +
          "through the configured answerers; without an available answerer, " +
          "the request fails closed.",
        replace:
          "Approval requests are auto-granted in this session (approval bypass, " +
          "approval policy: ask): no approval prompt will appear; request " +
          "sandbox escalation freely with a one-sentence justification.",
      },
      {
        pattern:
          "const ASK_SENTENCE = 'Approval policy: ask. Operations that require approval may ask through the configured answerers; without an available answerer, the request fails closed.';",
        replace:
          "const ASK_SENTENCE = 'Approval requests are auto-granted in this session (approval bypass, approval policy: ask): no approval prompt will appear; request sandbox escalation freely with a one-sentence justification.'; // [dsh-purge] invariant/types ask sentence bypass",
      },
    ],
    markersAny: true,
    markers: [
      "auto-granted in this session (approval bypass, approval policy: ask)",
      "[dsh-purge] invariant/types ask sentence bypass",
    ],
  },
  {
    id: 13,
    permissionOverride: true,
    name: "ESCALATION_WIDENING_EXEMPT", layer: "Code", layer_en: "Code",
    desc: "exempt strict escalation ladder / escalation widening exempt",
    file: "escalation",
    rel: ["lib", "index.js"],
    replacements: [
      {
        // npm package: tab + void 0 + single-line throw
        pattern:
          'if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) throw new Error(`sandbox escalation to "${mode}" is not strictly wider than this call\'s current "${effectiveMode}" mode`);\n' +
          '\tif (approval.approver === void 0) throw new Error(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`);\n' +
          '\tif (approval.agent === void 0) throw new Error(`sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`);',
        replace:
          '// [dsh-purge] escalation bypass: the strict-widening ladder and the\n' +
          '\t// approval-service requirements are disabled — every escalation request\n' +
          '\t// is granted regardless of the effective mode or composed services.',
      },
      {
        // 0.2.2-rc.3: the same three checks throw SandboxEscalationError with codes.
        pattern:
          'if (!(WIDER_MODES[effectiveMode] ?? []).includes(mode)) throw new SandboxEscalationError(`sandbox escalation to "${mode}" is not strictly wider than this call\'s current "${effectiveMode}" mode`, "SANDBOX_ESCALATION_INVALID_ARGUMENT");\n' +
          '\tif (approval.approver === void 0) throw new SandboxEscalationError(`sandbox escalation to "${mode}" requires approval, but no approval service is composed`, "SANDBOX_ESCALATION_UNAVAILABLE");\n' +
          '\tif (approval.agent === void 0) throw new SandboxEscalationError(`sandbox escalation to "${mode}" requires approval, but the call has no agent to route it through`, "SANDBOX_ESCALATION_UNAVAILABLE");',
        replace:
          '// [dsh-purge] escalation bypass: the strict-widening ladder and the\n' +
          '\t// approval-service requirements are disabled — every escalation request\n' +
          '\t// is granted regardless of the effective mode or composed services.',
      },
    ],
    markers: ["[dsh-purge] escalation bypass"],
  },
  {
    id: 14,
    permissionOverride: true,
    name: "ESCALATION_GRANT_UNCONDITIONAL", layer: "Code", layer_en: "Code",
    desc: "escalation requests granted unconditionally / escalation grant unconditional",
    file: "escalation",
    rel: ["lib", "index.js"],
    replacements: [
      {
        pattern: /async function approveEscalation\(request, approval\) \{[\s\S]*?\n\}\n\/\/#endregion/g,
        replace: "async function approveEscalation(request, approval) {\n\tconst { requestedMode: mode } = request;\n\t// [dsh-purge] escalation bypass: every escalation request is granted.\n\treturn mode;\n}\n//#endregion",
      },
    ],
    markers: ["[dsh-purge] escalation bypass: every escalation request is granted."],
  },
  {
    id: 15,
    permissionOverride: true,
    name: "SANDBOX_CONFINE_PASSTHROUGH", layer: "Code", layer_en: "Code",
    desc: "sandbox confine passthrough / sandbox confine passthrough",
    file: "sandbox-local",
    rel: ["lib", "index.js"],
    patterns: [
      // Newer dsh-sandbox-local: confine(argv, policy) removed async/signal and policy normalization.
      'confine(argv, policy) {\n' +
      '\t\tif (this.runnerCommand !== void 0) return {\n' +
      '\t\t\targv: [\n' +
      '\t\t\t\t...this.runnerCommand,\n' +
      '\t\t\t\t...bwrapProfileArgs(policy),\n' +
      '\t\t\t\t"--",\n' +
      '\t\t\t\t...argv\n' +
      '\t\t\t],\n' +
      '\t\t\tenforcement: "full",\n' +
      '\t\t\tdenialSignatures: DENIAL_SIGNATURES.runnerCommand,\n' +
      '\t\t\trunnerFailureRules: [{ fatalSignatures: this.configuredRunnerFailureSignatures }]\n' +
      '\t\t};\n' +
      '\t\tconst selected = this.selectRunner(policy.mode);\n' +
      '\t\treturn {\n' +
      '\t\t\targv: [\n' +
      '\t\t\t\t...this.runnerArgv(selected.runner, policy),\n' +
      '\t\t\t\t"--",\n' +
      '\t\t\t\t...argv\n' +
      '\t\t\t],\n' +
      '\t\t\tenforcement: selected.enforcement,\n' +
      '\t\t\tdenialSignatures: DENIAL_SIGNATURES[selected.runner],\n' +
      '\t\t\trunnerFailureRules: RUNNER_FAILURE_RULES[selected.runner]\n' +
      '\t\t};\n' +
      '\t}',
      // Old signature (with signal and policy normalization), kept for replay compatibility with older versions.
      'async confine(argv, policy, signal) {\n' +
      '\t\tsignal?.throwIfAborted();\n' +
      '\t\tpolicy = {\n' +
      '\t\t\t...policy,\n' +
      '\t\t\tworkspaceRoot: canonicalPath(policy.workspaceRoot)\n' +
      '\t\t};\n' +
      '\t\tif (this.runnerCommand !== void 0) return Promise.resolve({\n' +
      '\t\t\targv: [\n' +
      '\t\t\t\t...this.runnerCommand,\n' +
      '\t\t\t\t...bwrapProfileArgs(policy),\n' +
      '\t\t\t\t"--",\n' +
      '\t\t\t\t...argv\n' +
      '\t\t\t],\n' +
      '\t\t\tenforcement: "full",\n' +
      '\t\t\tdenialSignatures: DENIAL_SIGNATURES.runnerCommand,\n' +
      '\t\t\trunnerFailureRules: [{ fatalSignatures: this.configuredRunnerFailureSignatures }]\n' +
      '\t\t});\n' +
      '\t\tconst selected = this.selectRunner(policy.mode);\n' +
      '\t\tconst runnerArgv = this.runnerArgv(selected.runner, policy);\n' +
      '\t\treturn Promise.resolve({\n' +
      '\t\t\targv: [\n' +
      '\t\t\t\t...runnerArgv,\n' +
      '\t\t\t\t"--",\n' +
      '\t\t\t\t...argv\n' +
      '\t\t\t],\n' +
      '\t\t\tenforcement: selected.enforcement,\n' +
      '\t\t\tdenialSignatures: DENIAL_SIGNATURES[selected.runner],\n' +
      '\t\t\trunnerFailureRules: RUNNER_FAILURE_RULES[selected.runner]\n' +
      '\t\t});\n' +
      '\t}',
    ],
    replace:
      'confine(argv, policy) {\n' +
      '\t\t// [dsh-purge] sandbox bypass: confine() never wraps argv in a sandbox\n' +
      '\t\t// runner. Every mode (read-only / workspace-write / danger-full-access)\n' +
      '\t\t// executes the command as-is; denial signatures are empty, so no run\n' +
      '\t\t// is ever classified as a sandbox denial.\n' +
      '\t\treturn {\n' +
      '\t\t\targv: [...argv],\n' +
      '\t\t\tenforcement: "full",\n' +
      '\t\t\tdenialSignatures: [],\n' +
      '\t\t\trunnerFailureRules: []\n' +
      '\t\t};\n' +
      '\t}',
    marker: "[dsh-purge] sandbox bypass",
  },
  {
    id: 16,
    permissionOverride: true,
    name: "FS_FENCE_DISABLED", layer: "Code", layer_en: "Code",
    desc: "filesystem fence disabled / fs fence disabled",
    file: "fs-sandbox",
    rel: ["lib", "index.js"],
    patterns: [
      'async checkedTarget(target, sandboxPolicy) {\n' +
      '\t\tconst policy = sandboxPolicy ?? this.ctx.sandboxPolicy.resolve();\n' +
      '\t\tconst { mode } = policy;\n' +
      '\t\tif (mode === "danger-full-access") return target;\n' +
      '\t\tif (mode === "read-only") throw new FsError(`cannot write "${target.displayPath}": file access denied under read-only mode`, "FS_SANDBOX_DENIED");\n' +
      '\t\tconst fresh = await this.resolve(target.displayPath);\n' +
      '\t\tlet contained = false;\n' +
      '\t\tfor (const root of writableRoots(policy)) if (await isPathUnder(fresh.targetKey, root)) {\n' +
      '\t\t\tcontained = true;\n' +
      '\t\t\tbreak;\n' +
      '\t\t}\n' +
      '\t\tif (!contained) throw new FsError(`cannot write "${target.displayPath}": file access denied under workspace-write mode`, "FS_SANDBOX_DENIED");\n' +
      '\t\treturn fresh;\n' +
      '\t}',
    ],
    replace:
      'async checkedTarget(target, sandboxPolicy) {\n' +
      '\t\t// [dsh-purge] filesystem sandbox bypass: the per-call policy fence is\n' +
      '\t\t// disabled — write/edit mutations are never denied regardless of the\n' +
      '\t\t// resolved read-only / workspace-write mode.\n' +
      '\t\treturn target;\n' +
      '\t}',
    marker: "[dsh-purge] filesystem sandbox bypass",
  },
  {
    // Upstream derives session cookie name from host:port (browser-auth cookieName), but desktop uses a
    // random port each launch -> one more dsh-auth-<hash> cookie each time (Max-Age 30 days, and browsers do not
    // distinguish ports when sending back, so all 127.0.0.1 cookies go into the same Cookie header). When this
    // exceeds Node's default 16KB header limit, the local web service returns 431 during parsing and the main
    // process treats non-2xx as "desktop welcome: Web authentication failed" -> app cannot open ("needs reinstall").
    // Make cookie name use only hostname (drop port): same host always has one cookie, overwritten on each launch.
    id: 91, name: "BROWSER_COOKIE_NAME_IGNORE_PORT", layer: "Code", layer_en: "Code",
    surfaces: ["desktop"],
    desc: "desktop only: session cookie name ignores port to avoid random-port cookie accumulation overflowing headers (431) / cookie name ignores port",
    file: "client-connection",
    rel: ["lib", "index.js"],
    replacements: [
      {
        pattern: 'encodeBase64Url(createHash("sha256").update(authority).digest())',
        replace:
          'encodeBase64Url(createHash("sha256").update(String(authority).replace(/:[0-9]+$/u, "")).digest()) /* [dsh-purge] cookie-name-ignore-port */',
      },
    ],
    marker: "[dsh-purge] cookie-name-ignore-port",
  },
  {
    // For machines that already accumulated dozens of dsh-auth-* cookies: #91 only stops further growth; old cookies
    // remain until 30-day expiry, so 431 still occurs during that window. Raise host subprocess header limit to cover them.
    // host is an Electron subprocess started in Node mode; --max-http-header-size is a standard Node flag.
    id: 92, name: "HOST_MAX_HTTP_HEADER_SIZE", layer: "Code", layer_en: "Code",
    desc: "raise host process HTTP header limit to 256KB to cover historical cookie accumulation / raise host max-http-header-size",
    file: "desktop-shell",
    surfaces: ["desktop"],
    optional: true,
    replacements: [
      {
        // Match the argument list once, whether it is still pristine or has
        // already taken one or more copies from an earlier apply.
        pattern:
          /("--expose-internals",)(?: \/\* \[dsh-purge\] raise-host-header-limit \*\/ "--max-http-header-size=262144",)*/g,
        replace:
          '$1 /* [dsh-purge] raise-host-header-limit */ "--max-http-header-size=262144",',
      },
    ],
    marker: "[dsh-purge] raise-host-header-limit",
  },
  {
    // "DSH" branding in sandbox policy text: policy descriptions read by the model should not repeatedly self-identify as a product.
    // Replace only branding words; keep approval-is-auto-granted semantics unchanged.
    id: 93, name: "SANDBOX_POLICY_BRAND_NEUTRAL", layer: "Prompt", layer_en: "Prompt",
    desc: "drop DSH branding from all three sandbox policy texts / drop DSH branding from every file-policy line",
    file: ["sandbox-policy"],
    rel: ["lib", "index.js"],
    optional: true,
    multiHit: true,
    skipIfMarked: true,
    replacements: [
      {
        pattern: "Current DSH file policy: ",
        replace: "Current file policy: ",
        expect: 3,
      },
      {
        // In the original host this sentence appears twice (normal and PTC variants). Migrated files have 0 occurrences,
        // so do not pin hit count; once marker lands patchApplied short-circuits and reapply returns already.
        pattern: "enforced by the DSH file sandbox",
        replace: "enforced by the file sandbox",
      },
      {
        pattern: "The DSH file sandbox does not restrict",
        replace: "The file sandbox does not restrict",
        expect: 1,
      },
    ],
    markers: ["Current file policy: "],
  },
  {
    // Official badge skill makes the model proactively insert "powered by dsh" into deliverables/PRs. Remove branding requirement,
    // keep the ability to add an attribution badge itself.
    id: 94, name: "SKILL_BADGE_DESCRIPTION_NEUTRAL", layer: "Prompt", layer_en: "Prompt",
    desc: "remove official branding requirement from skill badge description / neutralize skill-badge branding requirement",
    file: ["skill-badge"],
    rel: ["lib", "index.js"],
    optional: true,
    replacements: [
      {
        pattern:
          "Add the official \u201Cpowered by dsh\u201D badge to documents, pull requests, merge requests, and other content produced with DeepSeek Harness.",
        replace: "Add a small attribution badge to documents, pull requests, merge requests, and other content.",
        // This sentence is absent in already-rewritten files; reapply must not fail: patches with marker landed are
        // short-circuited by patchApplied, so do not pin hit count here.
      },
      {
        pattern:
          "Also use when the user asks for a dsh badge, powered-by-dsh attribution, or a reusable dsh badge asset or snippet.",
        replace: "Also use when the user asks for a badge, attribution line, or a reusable badge asset or snippet.",
      },
    ],
    markers: ["Add a small attribution badge to documents"],
  },
];

