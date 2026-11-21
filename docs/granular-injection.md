# 按会话排除注入 + 按层关闭

> 新增两个**纯可选**配置：`excludeSessions`（按会话 id 排除）与 `layers`（按层关闭）。
> **不配置时行为与 1.7.20 逐字一致**，没有任何默认值变化。

## 1. 为什么需要

现状（1.7.20）：

- 提示词注入、boost 强化段、能力协议段三层共用**同一个** `enabled` 开关，
  要么全开，要么全关。
- 排除粒度只有 `excludePresets`——按**预设**排除，无法按**具体会话**排除。

实际使用时会出现两个需求：

1. 某个会话在跑敏感内容，希望它不受注入影响，但其他会话照常。
2. 只想关掉 boost 段（它的措辞较强），但保留主注入和能力协议。

## 2. 新增配置

```yaml
- id: dsh-purge
  config:
    enabled: true          # 保持原语义：总开关，false 压过一切
    excludePresets: []     # 原有字段，语义不变
    # ---- 以下全部为可选，不写 = 行为完全不变 ----
    excludeSessions: []    # 按会话 id 精确排除
    layers:                # 按层关闭；不写的层保持开启
      main: true           # 主注入（prompt-inject.md）
      boost: true          # 尾部强化段
      protocol: true       # 能力协议说明
```

### `excludeSessions`

精确匹配会话 id（区分大小写、不做子串匹配）。命中则该会话**三层全部不注入**。

- 会话 id 拿不到时（例如 `context` 缺失）**不会**触发排除，避免误伤。
- 子 Agent 使用自己的会话 id 判定，与 `excludePresets` 的既有约定一致。

### `layers`

| 键 | 对应段 | 关闭后 |
| --- | --- | --- |
| `main` | `prompt-inject.md` 注入 | 用户注入正文不再进入系统提示 |
| `boost` | 尾部强化段 | 不再追加 `dsh-purge-boost` 段 |
| `protocol` | 能力协议说明 | 不再追加 capability 段 |

未写入的层按 `true` 处理——只关你关心的那层，其余保持原样。

## 3. 默认行为等价性

这是本改动的硬约束，由 `test/preset-injection-granular.test.mjs` 钉住：

- 实现里保留了一份 **1.7.20 原始判定的参照实现（oracle）**；
- 对 9 组 `config` × 5 个 `preset` × 3 个层的全部组合，断言
  `injectionPolicy(...).allowed` 与 oracle 结果**逐一相等**；
- 另外覆盖 `context === undefined` 的路径。

也就是说：**只要你不写 `excludeSessions` / `layers`，装上后行为与之前没有区别。**

`enabled: false` 仍然压过一切，保持原有总开关语义（有专门用例覆盖）。

## 4. 与 `excludePresets` 的关系

两者独立、可叠加。判定顺序：

```
enabled === false            → 不注入（总开关）
excludeSessions 命中         → 不注入
layers[layer] === false      → 该层不注入
excludePresets 命中          → 不注入
预设信息缺失且排除列表非空    → 不注入（原有防泄漏约定）
```

## 5. 边界

- 本次改动**不涉及**宿主补丁、权限、沙箱、审批。
- 不修改任何默认值：`enabled`、`excludePresets`、`boost`、`refusalRetry`
  的默认值全部原样保留。
- 被排除的会话保留装配服务提供的人设、工作区规则、工具与变量，
  只清理 Purge 自己的段落（沿用 `withoutPurgeInjection` 的既有逻辑）。

## 6. 回归

```sh
node --test test/preset-injection-granular.test.mjs
```

新增 11 项，全部通过；全量测试失败数与改动前一致（均为本机缺 `yaml` 导致的既有失败）。
