# 提示词作用域与优化

> 三个能力，都**不改变默认行为**：
> 1. 会话级覆盖——只对某个会话换一份注入正文；
> 2. 一次性覆盖——只存在内存，重启即消失；
> 3. 提示词优化——让模型改写你在编辑框里的正文，结果为**建议**，不自动保存。

## 1. 为什么需要

改动前，注入正文只有一个来源：`$DSH_HOME/prompt-inject.md`。面板编辑框
（`POST /dsh-purge/override` → `saveOverrideContent`）直接写这个文件，
**全局生效且持久化**，没有会话级或临时作用域。

常见诉求因此无法表达：

- 这个会话想换一种措辞，但不想影响其他会话；
- 只想临时试一段提示词，不想改动磁盘上的正式版本。

## 2. 作用域与查找顺序

`lib/inject-scope.js` 定义三级查找，`readInjectFallback` 在使用全局正文前先查它：

```
1. 一次性覆盖（内存，TTL 6 小时）      ← 命中则完全接管
2. 会话级覆盖（$DSH_HOME/dsh-purge-sessions/<session>.inject.md）
3. 全局正文（$DSH_HOME/prompt-inject.md）  ← 原有路径，逐字不变
```

**关键不变量**：三级都不命中时，`lookupOverride` 返回空串，
`readInjectFallback` 走原来的 `refreshHungOperator` → `ensureOperatorBody`
路径，行为与改动前**逐字一致**。

### 安全边界

| 项 | 处理 |
| --- | --- |
| 会话 id | 只保留 `A-Za-z0-9._-`，其余折成 `_`，长度截断到 128 |
| 路径穿越 | 分隔符被折叠，结果固定落在 `dsh-purge-sessions/` 下 |
| `dshHome` 为空 | 读写均直接返回，**绝不**落到相对路径（`path.join('', …)` 会指向 cwd） |
| 单文件大小 | 上限 256 KiB，超限拒绝写入而不是截断 |
| 一次性覆盖 | 纯内存 Map，任何情况下不写盘 |

## 3. 提示词优化

`lib/inject-optimize.js`。**项目此前没有任何提示词优化能力**：所有
`rewrite*` 函数都是纯字符串处理（删标签、去人设句、拼接 section），
唯一的 LLM 调用点在拒绝重试路径上。

实现复用同一条通道（`ctx.reflect?.get?.("llm", false)`，与 `index.js` 的拒绝重试
同一写法，因为插件未声明 `inject: ['llm']`）。

### 四个目标

| 键 | 名称 | 指令要点 |
| --- | --- | --- |
| `concise` | 精简 | 不丢约束的前提下压缩篇幅 |
| `precise` | 明确 | 模糊动词换具体动作，模糊程度换明确标准 |
| `structure` | 结构化 | 分节 + 短句，关键约束靠前 |
| `strengthen` | 强化执行 | 减少过度保守，明确按已给信息直接执行 |

### 安全约束

- **只在用户点击时运行**，不进入对话路径，不影响任何一次真实注入；
- 结果是**建议**：回填到编辑框，必须再点保存才落盘；
- 系统提示明确禁止新增原文没有的请求、身份声明或越权指令；
- 输出超过 128 KiB、为空、超时、llm 不可用时一律返回失败并说明原因，
  **绝不静默替换原文**；
- 本模块不写任何文件。

## 4. 面板入口

宿主当前版本没有右侧栏 slot（`sidebar.right` / `sidebar.right.tab` 均不可用），
因此入口放在**输入框工具行的 `conversation.input.right`**（session 作用域）：

- 按钮 `P` → 浮层编辑器，点击外部或按 Esc 关闭；
- 因为 slot 是 session 作用域，组件能取到当前会话 id
  （复用项目既有的 `currentSessionId(hostSessions())`），据此支持三种作用域；
- 没有活动会话时只能编辑全局，界面会明确提示。

### 路由

| 路由 | 方法 | 用途 |
| --- | --- | --- |
| `/dsh-purge/inject-scope` | GET | 读某会话的会话级与一次性覆盖 |
| `/dsh-purge/inject-scope` | POST | 写覆盖，`scope=session` 落盘 / `scope=one-shot` 仅内存；传空内容即清除 |
| `/dsh-purge/inject-optimize` | POST | 调模型改写，返回建议文本 |

全局作用域仍走原有的 `/dsh-purge/override`，不重复实现。

## 5. 回归

```sh
node --test test/inject-scope.test.mjs test/inject-optimize.test.mjs
```

新增 23 项（10 项作用域/查找顺序/路径安全 + 13 项优化输入校验与流式处理），全部通过。

全量对照上游 master：

| | tests | pass | fail |
| --- | --- | --- | --- |
| 上游 master | 792 | 757 | 4 |
| 本改动 | 838 | 803 | 4 |

失败项完全相同（`cwd-compat`、`desktop-presets`、`desktop-registration`
与一项并发状态读取，均为本机环境所限），**无新增失败**。

## 6. 已知限制

- 一次性覆盖存在进程内存，**多实例/多进程不共享**，重启即失效（这是设计意图）；
- 优化走当前会话的模型，不同模型的改写风格会有差异；
- 会话级覆盖文件不会随会话删除自动清理，需在面板里手动清空，
  或删除 `$DSH_HOME/dsh-purge-sessions/` 下对应文件。
