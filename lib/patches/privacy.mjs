// [dsh-purge] 隐私默认值：宿主默认开着的三条上报通道，改成默认关。
//
// 只改默认值，不动能力本身 —— 用户以后要上报，在设置里打开就行。
// 三条都是 optional：精简安装没装对应包时判为"不适用"，不算失败。
// 宿主 0.2.2-rc.1 上每条锚点都恰好命中一次，用 expect 钉住，防止连带改到
// 别处的同名默认值（命中数不符时整条拒写，见 applyReplacementsToText）。
export const PRIVACY_PATCHES = [
  {
    id: 95,
    name: "PRODUCT_ANALYTICS_DEFAULT_OFF",
    layer: "代码",
    layer_en: "Code",
    desc: "产品埋点默认关闭，行为事件不再送 collector / product analytics off by default",
    file: ["product-analytics"],
    optional: true,
    replacements: [
      {
        // 0.2.2-rc.1 的默认值带 .volatile()；更早的宿主是裸写法，实测 0 次。
        pattern: "enabled: z.boolean().default(true).volatile(),",
        replace: "enabled: z.boolean().default(false).volatile(), // [dsh-purge] product analytics off by default",
        expect: 1,
      },
      {
        pattern: "enabled: z.boolean().default(true),",
        replace: "enabled: z.boolean().default(false), // [dsh-purge] product analytics off by default",
      },
    ],
    markers: ["[dsh-purge] product analytics off by default"],
  },
  {
    id: 96,
    name: "PRODUCT_TELEMETRY_OTEL_NOOP",
    layer: "代码",
    layer_en: "Code",
    desc: "产品遥测的 OTLP 导出器装上也不发事件 / product telemetry exporter becomes a no-op",
    file: ["product-telemetry-otel"],
    optional: true,
    replacements: [
      {
        // 构造完上报器立刻换成空实现并返回：导出器不建立，事件不发。
        pattern: '\t\tsuper(ctx, "productTelemetry");\n\t\tconst reporter = ctx.otel.createEventReporter({',
        replace:
          '\t\tsuper(ctx, "productTelemetry");\n\t\tthis.reporter = { emit() {}, async shutdown() {} }; return; const reporter = ctx.otel.createEventReporter({ // [dsh-purge] product telemetry otel off',
        expect: 1,
      },
    ],
    markers: ["[dsh-purge] product telemetry otel off"],
  },
  {
    id: 97,
    name: "SESSION_TELEMETRY_OTEL_DISABLED",
    layer: "代码",
    layer_en: "Code",
    desc: "会话遥测默认 DISABLED，反馈也不再走 OTLP / session telemetry otel defaults to DISABLED",
    file: ["session-telemetry-otel"],
    optional: true,
    replacements: [
      {
        pattern: "const DEFAULT_TELEMETRY_MODE = SessionTelemetryMode.FEEDBACK_ONLY;",
        replace:
          "const DEFAULT_TELEMETRY_MODE = SessionTelemetryMode.DISABLED; // [dsh-purge] session telemetry otel off",
        expect: 1,
      },
    ],
    markers: ["[dsh-purge] session telemetry otel off"],
  },
];
