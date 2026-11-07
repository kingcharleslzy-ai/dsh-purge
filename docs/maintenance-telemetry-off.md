# 默认关掉三条上报通道（#95–#97）

## 为什么做

宿主 0.2.2-rc.1 上这三条默认是**开着**的：

| 通道 | 宿主默认 | 落点 |
| --- | --- | --- |
| 产品埋点 | `enabled: z.boolean().default(true).volatile()` | `dsh-client-product-analytics/lib/index.js` |
| 产品遥测 OTLP | 构造 `createEventReporter` 并上报 | `dsh-host-product-telemetry-otel/lib/index.js` |
| 会话遥测 | `DEFAULT_TELEMETRY_MODE = FEEDBACK_ONLY` | `dsh-session-telemetry-otel/lib/index.js` |

本插件其余补丁（#52 会话日志上传）已经在关上传，但这三条一直空着。补齐之后，
"这个插件不替你往外送东西"才算成立。

## 三条补丁

| id | 名称 | 改动 |
| --- | --- | --- |
| 95 | `PRODUCT_ANALYTICS_DEFAULT_OFF` | `default(true)` → `default(false)` |
| 96 | `PRODUCT_TELEMETRY_OTEL_NOOP` | 上报器换成空实现并 return，导出器不建立 |
| 97 | `SESSION_TELEMETRY_OTEL_DISABLED` | `FEEDBACK_ONLY` → `DISABLED` |

**只改默认值，不动能力本身。** 用户以后要上报，在设置里打开就行 —— 这几条不是
删除功能，是把出厂默认反过来。

## 锚点与验收

- 三条都是 `optional: true`：精简安装没装对应包时判为「不适用」，不算失败。
- 每条锚点在宿主 0.2.2-rc.1 上**恰好命中一次**，用 `expect: 1` 钉死；命中数不符
  时整条拒写（`hit_mismatch`），不会连带改掉别处的同名默认值。
- #95 的第二条 pattern（无 `.volatile()` 的旧写法）不钉命中数：当前宿主为 0 次，
  留着给更早的宿主用。
- 应用后的三个文件都通过 `node --check`，构造器里插入的 `return` 不破坏语法。
- `test/privacy-patches.test.mjs`：补丁表形状契约（注册唯一、optional、带 marker、
  `expect` 为正整数）+ 同目标文件内锚点不与他人重复。不依赖实机安装。

## 不改的东西

- 不动权限、沙箱、审批、提示词。
- 不改第三方插件行为。
- 不删除任何上报代码路径 —— 只改默认值，随时可逆。
