# 插件详情页样式全面检查（对照 dsh-ops / 宿主原生调研结论）

检查对象：`worktrees/refactor-plugin-detail-page` 上的详情页实现（1.6.104）。
检查方法：**静态契约比对**——我们的 CSS 声明 vs 调研取得的原生数值；配合**源码清点**（每个页面真正渲染哪些控件、多少个）。
不包含真机 DOM/截图（本 worktree 无 react 依赖，headless 又进不了这个 SPA），所以「手感」仍需你截图复核。
复现：`node notes/evidence/audit-detail-page.mjs`，结果 JSON 见 [detail-page-style-audit.json](detail-page-style-audit.json)。

**合计 52 项：FAIL 42 / NOTE 6 / PASS 4。**

---

## 一、开关（11 项：FAIL 10 / NOTE 1）—— 这是最严重的一组

现状 `styles/detail-card.css:104-109`，目标 = `@deepseek-ai/dsh-client-ui-primitives/lib/Switch.module.css`。

| id | 项 | 现在 | 应为 |
| --- | --- | --- | --- |
| S1 | 轨道 width | 32px | **36px** |
| S2 | 轨道 height | 18px | **20px** |
| S3 | 轨道 radius | 9px | **999px** |
| S4 | 选中底色 | `state-business-primary` | **`brand-primary`** |
| S5 | 圆点 width | 14px | **16px** |
| S6 | 圆点底色 | `bg-layer-3` | **`label-primary-foreground`（关：`switch-thumb`）** |
| S7 | 位移 | `translateX(14px)` | **`translateX(16px)`** |
| S8 | 禁用透明度 | `.4` | **`.5`** |
| S9 | 圆点阴影 | `0 1px 2px rgba(0,0,0,.2)` | **删掉（无字面色）** |
| S10 | 圆点靠 `input::after` 绘制 | `content:''` | 宿主用 `button[role=switch] + span.thumb`（NOTE：input 伪元素真机是否渲染未验证） |
| S11 | 用 `role=switch` 形态 | 0 处 | 布尔开关应走 `button[role=switch]` + `aria-checked` |

**比数值更严重的是作用域**：`.dpg-detail input[type=checkbox]` 覆盖整页所有 checkbox。
页面里布尔开关只有 **4 处**（`advanced.js:73` 的 hooks 绕行、`maintenance.js:298/346` 自动检查/自动安装、`maintenance.js:548` 清除密钥），
但**列表型多选也有 4 处**（`rules.js:320` 的 cwd 候选列表、`vendor/drill.js` 3 处），它们会被一起画成 32px 胶囊 → 列表变成了「一排开关」。这是功能性错误，不只是样式不合。

## 二、下拉（8 项 + 1 NOTE：FAIL 7 / PASS 1）

唯一的下拉是配置区「版本选择器」`settings-form.js:774`（`className: "dshpp-field dshpp-ver"`，共 4 个渠道各一个）。
目标 = 宿主唯一实测的 `<select>` 形（`dsh-client-ui-settings-models` 的 `v1K0Ja_input` + `selectInput`）。

| id | 项 | 现在 | 应为 |
| --- | --- | --- | --- |
| P1 | height | 34px | **32px** |
| P2 | 底色 | `bg-layer-3` | **`bg-layer-1`** |
| P3 | font-size | 13px | **14px（行高 22）** |
| P4 | caret | 两个 5px 渐变三角 | **单条 12×12 SVG 折线** |
| P5 | padding | `0 30px 0 12px` | **`0 10px`，右内边距 32px** |
| P6 | max-width | 100% | **240px** |
| P7 | 禁用 | 只改文字色 | **`opacity:.6`** |
| P8 | focus | `outline:none` + 边框变色 | ✅（唯一达标项，但要看 P9） |
| P9 | NOTE：与上游 `.dshpp-field/.dshpp-ver` 冲突 | base.css 给的是 `1px 边框 / 8px 圆角 / mono 字体 / height 32px / font 12px`，我们靠 `.dpg-detail select`（(0,1,1)）压过 `.dshpp-ver`（(0,1,0)） | 只在权重上赢，任何选择器调整就会翻车 |

## 三、卡片（5 FAIL）

目标 = 宿主 5 处官方设置卡一致的 token 对（`settings-card-stroke` = `border-l4`、`settings-card-fill` = `bg-layer-2`）。

| id | 项 | 现在 | 应为 |
| --- | --- | --- | --- |
| C1 | 描边 | `border-l2` | **`settings-card-stroke`** |
| C2 | 填充 | 无 | **`settings-card-fill`** |
| C3 | 圆角 | `radius-lg` | **`radius-xl`** |
| C4 | 内边距 | 14px | **12px 14px** |
| C5 | 间距 | 10px | **12px** |

卡片数已达标：行页正好 3 张（状态 / 业务 / 配置），与「一级只有状态区、二级状态+业务+配置」的设计一致。

## 四、分段切换（7 FAIL）

目标 = 宿主 `SegmentedControl`。

| id | 项 | 现在 | 应为 |
| --- | --- | --- | --- |
| T1 | 轨道 padding | 2px | **4px** |
| T2 | tab height | 未声明 | **28px** |
| T3 | tab font-size | 12px | **13px** |
| T4 | tab font-weight | 未声明 | **500** |
| T5 | tab padding | `4px 10px` | **`0 16px`** |
| T6 | 选中态 | 直接给 tab 铺 `bg-layer-3` | **透明 tab + 滑动药丸** |
| T7 | 滑动指示块 | 无 | **`bg-layer-1` + `elevation-soft` 的 `.indicator`** |

## 五、事实表（5 FAIL）

现状用 dsh-ops 的「网格 + 列距 14 + dt 用 tertiary」；宿主详情页的 `.facts` 是另一套（两端对齐、44px 行高、右对齐、发丝线、dt 用 secondary）。两者都原生，但现在是**谁都没像**：既没有 dsh-ops 之外的装饰，也没拿到宿主的手感。

| id | 项 | 现在 | 宿主 `.facts` |
| --- | --- | --- | --- |
| F1 | 布局 | `grid`（无 justify） | `space-between` |
| F2 | 行高 | 无 | `min-height:44px` |
| F3 | 值对齐 | 左 | `text-align:end` |
| F4 | 标签色 | `label-tertiary` | `label-secondary` |
| F5 | 行分隔 | 无 | `.5px border-l2` 底发丝线 |

## 六、子分区头（1 PASS / 1 FAIL）

| id | 项 | 现在 | 应为 |
| --- | --- | --- | --- |
| H1 | 字重 | **600** | **500** |
| H2 | 字号 | 13px | ✅（12~14 区间内） |

## 七、令牌纪律（2 FAIL + 2 NOTE）

| id | 结果 |
| --- | --- |
| N1 | FAIL：`detail-card.css` 仍有 `rgba(0,0,0,.2)`（开关圆点阴影） |
| N2 | FAIL：`detail-card.css:77` 有 1 处 `!important`（`.dshpp-hint` 字号） |
| N3 | NOTE：`base.css` 随详情页一并注入，含 **72 处 hex** + 1 处 `!important`（含插件自带的暖纸色 `#fffcf7`、绿按钮 `#2f6b4f`、深色弹窗 `#1c1e24`） |
| N4 | NOTE：`native.css` 另有 9 处 hex |

也就是说：即使 `detail-card.css` 全改成 token，配置区与业务区仍会被上游皮肤染色——这才是「看着不像原生」的大头。

## 八、结构（5 FAIL + 2 NOTE，源码清点）

| id | 结论 | 数字 |
| --- | --- | --- |
| D1 | FAIL：页组件内渲染 `<style>` | **2 处**（`DetailPage`/`ConfigPage` 各调 `h(PageStyle)`），dsh-ops 是 apply 期一份 |
| D2 | PASS：行页卡片数 | 3 |
| D3 | FAIL：`role=switch` | 0 |
| D4 | FAIL：布尔开关用 `input[type=checkbox]` | 4 处 |
| D5 | PASS：配置区 select | 4 处（4 个渠道的版本选择器） |
| D6 | FAIL：上游状态行靠 CSS 隐藏 | 1 条规则 `display:none`（`dshpp-hero-state` 仍在 DOM） |
| D7 | FAIL：列表型 checkbox 被开关样式误伤 | 4 处 |
| D8 | NOTE：配置区上游皮肤类 | **31 个 `.dshpp-*` 类名** |
| D9 | NOTE：业务区上游皮肤类 | **54 个** |

## 九、未验证（不要当成已修）

1. `input[type=checkbox]::after` 圆点在真机是否渲染——宿主不用这种画法；改成 `button[role=switch]+span.thumb` 可以把这个不确定性彻底消掉。
2. 我们能否在 bundle 里 `require` 到 `@deepseek-ai/dsh-client-ui-primitives`（dsh-ops 的构建把它标成 external）。未验证前只能 CSS 仿制。
3. 分区间距：宿主给 `plugins.detail.section` 外层 `gap:32px`，我们自己卡片之间要不要再加 12px，只能看真机。

## 十、修复顺序

1. **P0 开关**：改 `detail-card.css` 的 8 个数值 + 删 `rgba`；把作用域从 `input[type=checkbox]` 收到「布尔开关的专属类」，或直接换 `button[role=switch]` 组件（同时解决 D3/D4/D7/S10）。
2. **P0 下拉**：整块替换成 `v1K0Ja_input + selectInput` 契约（8 条值 + SVG caret）。
3. **P1 卡片**：`settings-card-stroke/fill` + `radius-xl` + `12px 14px` + `gap 12`。
4. **P1 分段**：`SegmentedControl` 几何 + 滑动指示块（纯 CSS 可实现）。
5. **P1 事实表**：定口径（宿主 `.facts` 形态），一次性把 5 条改到位。
6. **P1 子分区头**：600 → 500。
7. **P2 令牌纪律**：清 `rgba` + 那 1 处 `!important`；base/native 的 81 处 hex 分批替换成 token（业务区改造时一起做）。
8. **P2 结构**：样式注入收敛到 apply 期一份；上游状态行从 JSX 移除而不是 `display:none`。
