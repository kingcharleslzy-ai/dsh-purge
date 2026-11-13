# 参考插件 dsh-ops 样式调研（含宿主原生对照）

> 目的：把「参考插件 dsh-ops」到底怎么画、以及「原生 DSH」到底怎么画，逐条落到可核对的数字上，
> 供插件详情页（一级/二级）改造使用。所有数值均从**运行期产物**里抽取，不是从文档转述。
> 原始抽取结果：`notes/evidence/dsh-ops-css-raw.txt`、`notes/evidence/host-native-css-raw.txt`。

## 0. 取证口径

| 对象 | 版本 | 路径 | 证据类型 |
| --- | --- | --- | --- |
| dsh-ops（实例里跑的那份） | **0.5.4** | `E:\FXS\Data\DSH-NEXT\.dsh-inst-xcmmisop\profiles\desktop\node_modules\dsh-ops\lib\client.js:1118-1201` | 运行期产物（`exports.SETTINGS_CSS`） |
| dsh-ops（可读源码） | 0.5.0-alpha3 | `E:\FXS\Data\DSH-Dev\pr\dsh-ops\main\src\client\{styles.ts,detail.tsx,row-form.tsx,row-settings.tsx,index.tsx}` | 源码；与 0.5.4 逐条比对，卡片/状态卡/字段全部一致，仅 `.ops-choice` 微调并新增 `.ops-candidate` |
| 宿主 | 0.2.2-rc.1（app） | `E:\FXS\APP\DSH NEXT\resources\app\node_modules\@deepseek-ai\*` | 运行期产物（各包 `lib/client.js` 内联 CSS 字面量） |

抽取方法：`lib/client.js` 把 CSS 作为单行字面量内联（`const css = "…"`），按 `}` 切规则后按类名前缀过滤。
注意 `read` 会把超长行截断到约 2 KB，所以要用 fs 读整行再切。

---

## 1. dsh-ops 的运行时装配（样式与插槽）

`src/client/index.tsx`：

```ts
ctx.effect(() => {                       // 样式在 apply 期挂一次，随插件卸载移除
  const style = document.createElement('style')
  style.dataset.dshOpsSettings = 'true'; style.textContent = SETTINGS_CSS
  document.head.append(style)
  return () => style.remove()
}, 'dsh-ops: settings styles')

ctx.slots.inject('plugins.row.config', …)      // key: ROW_ID#ROW_ID
ctx.slots.inject('plugins.detail.section', …)  // id: dsh-ops.diagnostics, order: 50
```

- 全局只注册**两个**插槽：`plugins.row.config`（二级页/配置）与 `plugins.detail.section`（一级页/状态）。
- 样式只挂**一份**，生命周期 = 插件 fiber，不随页面挂载/卸载反复插拔。
- 类名统一前缀 `ops-`，**没有任何 hex**，全部 `--dsw-*` token。
- 状态段自过滤：`hasStatus(subject)` → `item` 返回 false、`pkg.name !== 'dsh-ops'` 返回 false、`row.rowId !== ROW_ID` 返回 false；`enabled` 为 false 时整段返回 null。

> 对照我们：`PageStyle()` 把 `<style>` **渲染在组件树里**，一级页 + 二级页同时挂载时会有 2~3 份同内容样式节点。这不是视觉 bug，但与参考实现不同，且每次切页重建样式表。可作为后续统一项。

---

## 2. dsh-ops 的设计语言：三层表面

1. **页面**（宿主提供）：`.detailSections` gap **32**、`.detailSection` gap **12**。
2. **卡片**（dsh-ops 自画）：`.ops-card / .ops-status-card` = `0.5px border-l2` + `radius-lg` + `padding 14` + `gap 10`，**无填充**。
3. **凹陷体**（卡片内可操作/可读的那块）：`.ops-card-body / .ops-status-body` = `interactive-bg-hover` + `radius-md` + `padding 12`。

即：**卡片是「对象」，凹陷体是「对象里能改/能看的东西」**。这是 dsh-ops 全部版式的骨架，注释里写得很直白（`styles.ts:27-29`、`:80-82`）。

### 逐类数值表

| 用途 | 类 | 几何 | 颜色/字体 token |
| --- | --- | --- | --- |
| 容器 | `.ops-settings` / `.ops-detail` | flex column，**gap 12**，min-width 0 | `label-primary` |
| 卡片 | `.ops-card`、`.ops-status-card` | border `.5px`、`radius-lg`、`padding 14`、`gap 10` | border `border-l2` |
| 卡头 | `.ops-group-head` | flex，**gap 16**，`align-items:flex-start` | — |
| 卡头文字列 | `.ops-field-text` | flex column，**gap 2**（`.ops-group-head` 内为 2） | — |
| 卡标题 | `.ops-group-title` | 13/**600**/20，margin `0 0 4` | `label-secondary` |
| 卡副文 | `.ops-field-hint` | 12/1.5 | `label-tertiary` |
| 折叠按钮 | `.ops-disclosure` | gap 8，无边框/无背景，hover 只染标题 | focus ring `--dsw-focus-ring-*`，offset 2 |
| 折叠箭头 | `.ops-chevron` | **12×12**，margin-top 4，transition `.12s` | `label-tertiary` |
| 凹陷体 | `.ops-card-body` | `radius-md`、`padding 12` | `interactive-bg-hover` |
| 凹陷体里的字段 | `.ops-card-body > .ops-field` | padding **10** 0，首尾去掉，相邻加 `.5px` 上发丝线 | `border-l2` |
| 字段 | `.ops-field` | flex column，**gap 6**，`padding 12 0` | — |
| 字段名 | `.ops-field-label` | 13/**500**/1.5 | `label-primary` |
| 开关行 | `.ops-switch-row` | flex，gap 16，顶端对齐 | — |
| 输入框 | `.ops-input` | **34px** 高，`padding 0 12`，border `.5px`，`radius-md` | border `border-l4`，底 `bg-layer-3`，字 13/1.5 |
| 状态卡头 | `.ops-detail-head` | flex，gap 10，可换行 | — |
| 状态标题 | `.ops-detail-title` | 13/**600**/20 | `label-primary` |
| 状态副标 | `.ops-detail-metric` | 12/18 | `label-tertiary` |
| 状态动作 | `.ops-detail-action` + `.ops-small` | `margin-left:auto`；按钮 **28px** 高、`padding 0 10`、border `.5px`、`radius-sm`，字 12/18 | border `border-l3` |
| 状态体 | `.ops-status-body` | `padding 12`、`radius-md` | `interactive-bg-hover` |
| 引导句 | `.ops-status-lead` | 13/1.6，`margin 0 0 12` | `label-secondary` |
| **事实表** | `.ops-facts` | `display:grid`，**gap 6** | — |
| 事实行 | `.ops-facts > div` | `grid-template-columns: max-content minmax(0,1fr)`，`align-items:baseline`，**column-gap 14** | — |
| 事实名 | `.ops-facts dt` | 13 | **`label-tertiary`** |
| 事实值 | `.ops-facts dd` | 13，`overflow-wrap:anywhere` | 继承 |
| 脚注 | `.ops-status-note` | 12/1.6，`margin 12 0 0` | `label-tertiary` |
| 主按钮 | `.ops-primary` | `radius-md`、`padding 5 14`、13/1.5；禁用 `opacity .4` | 底 `label-primary`，字 `bg-layer-3` |
| 文本按钮 | `.ops-text-button` / `.ops-reset` | 12/1.5，无 chrome | `label-secondary` → hover `label-primary` |
| 链接 | `.ops-link` | `text-underline-offset:2px` | `label-secondary` |
| 预览块 | `.ops-preview` | `padding 12`、`radius-md`、gap 10、13px | `interactive-bg-hover` |
| 窄屏 | `@media(max-width:440px)` | facts 退化为单列（`1fr`，gap 2） | — |

要点：
- 卡片**没有填充**，只有发丝边；凹陷体才是带底色的那块 → 视觉上「一张纸 + 纸上的内嵌框」。
- 标题层级：卡头 13/600/20 `label-secondary`；字段名 13/500 `label-primary`；副文 12 `label-tertiary`。
- 所有交互都用宿主 focus ring（`--dsw-focus-ring-width` + `--dsw-focus-ring-color` 兜底 `state-business-primary`），offset 1~2。

---

## 3. 原生 Switch：参考实现是**用宿主组件**，不是自己画

`src/client/row-settings.tsx:9` → `import { Switch } from '../adapter/dsh/browser.js'`；
`src/adapter/dsh/browser.ts:11` → `export { Switch } from '@deepseek-ai/dsh-client-ui-primitives'`。
`primitives.d.ts` 本地声明契约（`{checked,label,disabled?,title?,onChange}`，`label` 是可达名）。
整包只有这一个模块引用 primitives，其余组件保持可脱离宿主模块加载器测试（`row-form.tsx` 接收 `Switch` 作为 prop）。

宿主真实样式（`@deepseek-ai/dsh-client-ui-primitives/lib/Switch.module.css`，全文 48 行）：

```css
.switch{width:36px;height:20px;padding:2px;border:0;border-radius:999px;corner-shape:round;background:var(--dsw-alias-border-l3)}
.switch[aria-checked='true']{background:var(--dsw-alias-brand-primary)}
.switch:disabled{opacity:.5}
.switch:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
.thumb{width:16px;height:16px;border-radius:50%;corner-shape:round;background:var(--dsw-alias-label-primary-foreground);transition:transform 120ms ease}
.switch[aria-checked='false'] .thumb{background:var(--dsw-alias-switch-thumb)}
.switch[aria-checked='true'] .thumb{transform:translateX(16px)}
```

我们现在的仿制（`detail-card.css:104-109`）：**32×18 / 圆点 14 / 选中 `state-business-primary` / 圆点 `bg-layer-3` + `rgba(0,0,0,.2)` 阴影**。
四处不一致：尺寸、选中色（应 `brand-primary`）、圆点色（应 `label-primary-foreground` / `switch-thumb`）、并且 `rgba()` 是**字面色**（违反「只用 token」）。
另外宿主用 `aria-checked` 而非 `:checked` 决定外观——它渲染的是 `button[role=switch]`，不是 `input[type=checkbox]`。

结论：要「原生开关」，正解是**引 primitives 的 `Switch`**（与 dsh-ops 同一路径），CSS 仿制的天花板就是上面这份数字。若暂时不引组件，就必须逐字照抄这份数字（36/20/16/16/`brand-primary`/`switch-thumb`/`label-primary-foreground`/opacity .5/offset 2）。

---

## 4. 宿主自己的插件详情页几何（比 dsh-ops 更「原生」的一层）

`dsh-client-ui-plugin-manager/lib/client.js:4225`（`PluginManagerPage.module.css`）：

| 元素 | 规则 |
| --- | --- |
| 页面 | `.detail{display:flex;flex-direction:column}` |
| 主区 | `.detailMain{margin-top:20px;gap:8px;flex column}` |
| 标题 | `.detailTitle{font-size:20px;font-weight:500;line-height:28px}` |
| 描述 | `.detailDesc{14px/22px;label-secondary}` |
| 包名 | `.detailName{12px/18px;label-tertiary}` |
| **分区栈** | `.detailSections{margin-top:32px;**gap:32px**;flex column}` |
| **单个分区** | `.detailSection{**gap:12px**;flex column}` ← 分区自己不是卡片 |
| 分区头 | `.sectionHead{align-items:baseline;gap:10px}` |
| 分区标题 | `.sectionTitle{**14px/500/20**}` |
| 分区计数 | `.sectionCount{12px/18px;label-secondary}` |

**关键事实：宿主的分区本身没有边框、没有填充、没有内边距**——它只是一个 gap 12 的列。卡片（若有）是分区内容自己画的。
所以「一级页只有状态区」在原生语义里 = `plugins.detail.section` 里一个 `<section class=detailSection>`，里面一个自绘卡片。

### 4.1 原生事实表（宿主自己就在用 `dl.facts`）

```css
.facts{margin:0}
.facts div{border-bottom:.5px solid var(--dsw-alias-border-l2);display:flex;justify-content:space-between;align-items:center;gap:16px;min-height:44px;padding:8px 2px}
.facts dt{color:var(--dsw-alias-label-secondary);flex:none;font-size:13px;line-height:20px}
.facts dd{text-align:end;overflow-wrap:anywhere;min-width:0;margin:0;font-size:13px;line-height:20px}
.facts code{background:var(--dsw-alias-bg-module-platform);border-radius:4px;padding:2px 6px;font-size:12px;font-family:var(--dsw-font-mono,…)}
```

形态是**左右两端对齐 + 每行一条底发丝线 + 每行至少 44px**，值是右对齐（`text-align:end`），不是两列网格。
dsh-ops 的 `.ops-facts` 是另一种（左对齐网格、列距 14、dt 用 tertiary）。两者都「原生」，但宿主这份是官方详情页真身。

### 4.2 原生组件行（`.row`，就是「组件」这一行该长的样子）

```css
.rows{flex column;list-style:none}
.row{border-bottom:.5px solid var(--dsw-alias-border-l2);padding:12px 2px}   /* 最后一行无底线 */
.rowLine{display:flex;align-items:center;gap:16px;min-width:0}
.rowIcon{width:40px;height:40px;border:.5px solid var(--dsw-alias-border-l3);border-radius:var(--dsw-radius-md)}
.rowMain{flex column;gap:2px;flex:1}
.rowId{13.5px/500/20;label-primary}            /* data-state=off → label-secondary */
.rowModule{11.5px/16;label-tertiary;mono}
.rowState{12.5px/18;label-secondary;gap:6px}   /* 前面挂 StateDot */
.rowOpen{无 chrome；hover 时 .rowId 加下划线}
```

### 4.3 原生卡片（两套，别混用）

1. **列表卡** `.card`：`radius-xl`、`margin:0 -8px`、**无边框**、hover 才铺 `interactive-bg-hover`；头 `padding 8` + `gap 14`；图标 48×48 `.5px border-l3 radius-lg`；标题 14/500/20；描述 13/18 `label-tertiary` 单行截断。
2. **设置卡**（账号页 / 模型页 / 代理→预设页 / 插件清单页 / 插件页版本面板，共 5 处官方一致）：
   ```css
   border:.5px solid var(--dsw-alias-settings-card-stroke);   /* = --dsw-alias-border-l4 */
   background:var(--dsw-alias-settings-card-fill);            /* = --dsw-alias-bg-layer-2 */
   border-radius:var(--dsw-radius-xl);
   padding:12px 14px (模型页) / 12px 16px (账号页); gap:12px
   ```
   token 定义见 `dsh-client-ui-theme/lib/client.js:1464`。

**这是本次调研最值得改的一处**：我们和 dsh-ops 的卡片都是 `border-l2 + radius-lg + padding 14 + 无填充`；
宿主设置页的卡片是 `border-l4 + bg-layer-2 + radius-xl + 12/14`。前者是 dsh-ops 的借用，后者才是 DSH 的卡。

---

## 5. 原生「下拉选择」：宿主确实有 `<select>`，样式在模型设置页

先纠正一个容易搞错的判断：宿主**不是**完全没有 `<select>`。全仓 grep `\("select"` 命中 11 处
（`settings-models` 4 处、`experimental-session-inspector`、`cot-translation`、`voice-input` 4 处、`client-ui-cordis`）。
其中 **`dsh-client-ui-settings-models` 是官方设置页**，它的 `<select>` 就是原生下拉的标准形：

```html
<select class="v1K0Ja_input v1K0Ja_selectInput" value=… aria-label=…>
```

```css
.v1K0Ja_input{box-sizing:border-box;border:.5px solid var(--dsw-alias-border-l4);border-radius:var(--dsw-radius-md);
  width:100%;height:**32px**;font:inherit;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);
  padding:0 10px;font-size:**14px**;line-height:22px}
select.v1K0Ja_input{cursor:pointer;max-width:**240px**}
.v1K0Ja_selectInput{appearance:none;
  background-image:url("data:image/svg+xml,…12×12… <path d='M3 4.5L6 7.5L9 4.5' stroke='%2381858C' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/>");
  background-position:right 12px center;background-repeat:no-repeat;background-size:12px 12px;padding-right:32px}
.v1K0Ja_input:focus{border-color:var(--dsw-alias-state-business-primary);outline:none}
.v1K0Ja_input:disabled{opacity:.6;cursor:default}
```

我们现在的下拉（`detail-card.css:112`）：**34px / `bg-layer-3` / 13px / 5px 渐变三角双拼 caret**。
四项全错：高度 32、底色 `bg-layer-1`、字号 14/22、caret 是**单条 12×12 SVG 折线**（右侧 12px 居中、`padding-right:32`），
并且要看 `max-width:240px`、`cursor:pointer`、禁用 `opacity:.6`、focus 只换 border 不画 outline。

顺带记两条宿主内并存的事实（不是我们选错，是宿主自己有两套字段度量）：
- 设置表单字段（`settings-form/fields.module.css`）：34px / `bg-layer-3` / 13 / `padding 0 12`；
- 模型页字段：32px / `bg-layer-1` / 14 / `padding 0 10`。
只有后者带官方 `select` 形，所以**下拉照后者，文本框照前者**是唯一有出处的组合。

---

## 6. 原生「一个区的子分区」与分段切换

- **子分区头**（宿主字段/分组）：`.field{flex column;gap:6px;padding:12px 0}` + `.field + .field{border-top:.5px solid border-l2}`；
  分组标题 `.title{16px/500/24}`（模型页）、`.label{13px/500/1.5 label-primary}`（设置表单）、`.fieldLabel{12px/500/18 label-secondary}`（模型页字段名）。
  → 「区里的小标题」原生是 12~16px 的**轻字重标题 + 发丝线**，不是带底色的横条，也没有 600 字重的 13px 副标色标题（那是 dsh-ops 的写法）。
- **分段切换**（业务区 tab 的正解）：宿主有专门的 `SegmentedControl`
  ```css
  .control{display:inline-grid;grid-auto-flow:column;gap:2px;padding:4px;border-radius:var(--dsw-radius-md);background:var(--dsw-alias-interactive-bg-hover)}
  .indicator{position:absolute;top:4px;left:4px;height:calc(100% - 8px);border-radius:var(--dsw-radius-sm);
             background:var(--dsw-alias-bg-layer-1);box-shadow:var(--dsw-elevation-soft);
             transform:translateX(calc(var(--dsh-segment-index) * (100% + 2px)));transition:transform 160ms ease}
  .tab{height:28px;padding:0 16px;border:0;border-radius:var(--dsw-radius-sm);font-size:13px;line-height:20px;font-weight:500;color:var(--dsw-alias-label-secondary)}
  .tab[aria-selected='true']{color:var(--dsw-alias-label-primary)}
  ```
  我们现在的 `.dpg-tabs`：`padding 2`（应 4）、tab `12px/18 + padding 4 10`（应 `28px 高 / 13/20 / 500 / padding 0 16`）、
  选中态直接给 tab 上 `bg-layer-3` 底色（原生是**滑动的 `layer-1` 药丸 + elevation-soft 阴影**，tab 本身透明）。
  另外 `SegmentedTabs`（页面级，34px、`bg-module-platform` 轨道、指示块带 `.5px border-l3`）是另一种场景，不适合塞进卡头。

---

## 7. 三方差值矩阵（我们 / dsh-ops / 宿主原生）

| 项 | 我们现在 | dsh-ops 0.5.4 | 宿主原生 | 结论 |
| --- | --- | --- | --- | --- |
| 卡片 | `border-l2` + `radius-lg` + `p14` + gap10，无填充 | 同左 | 设置卡：`border-l4` + `bg-layer-2` + `radius-xl` + `12 14` + gap12 | **改宿主设置卡** |
| 卡标题 | 13/600/20 `label-secondary` | 同左 | 分区标题 14/500/20；字段名 13/500 `label-primary` | 保留 dsh-ops（卡头就是 dsh-ops 语义），或将 600 降为 500 |
| 凹陷体 | `interactive-bg-hover` + `radius-md` + p12 | 同左 | 字段直接排在卡内，用发丝线分隔 | 状态卡保留凹陷体；配置卡用发丝线 |
| 事实表 | 网格 max-content/1fr、col-gap 14、dt tertiary | 同左 | `space-between` + 右对齐 + 每行底发丝线 + `min-height:44`、dt `label-secondary` | 二选一：跟 dsh-ops（紧凑）或跟宿主（更像官方详情页） |
| 开关 | 32×18、knob14、`state-business-primary`、`rgba()` 阴影 | 用宿主 `Switch` 组件 | 36×20、knob16、`brand-primary`、`switch-thumb`、opacity .5 | **改宿主数字或直接引组件** |
| 下拉 | 34 / layer-3 / 13 / 双渐变三角 | 无 select（只有 input） | 32 / layer-1 / 14 / 单 SVG caret(12px, right12) / max-w 240 | **改宿主 select** |
| 分段 tab | 12px 字、选中铺底色 | 无（用 disclosure 卡片） | SegmentedControl 28px / 13-500 / 滑块 layer-1 + elevation-soft | **改原生分段** |
| 子分区头 | 13/600 + 底线 | 13/600 + 底线 | 12/500 `label-secondary` 或 16/500，配发丝线 | 降字重/改度量 |
| 样式注入 | 组件树内 `<style>`（每页一份） | apply 期一份 `ctx.effect` | 各包 `<style data-plugin-css>` 一份 | 收敛成一份 |
| 主按钮 | `bg label-primary` + 字 `bg-layer-3` | 同左 | settings-form `.save` 同左 | 一致，不动 |
| 小按钮 | 28px / `border-l3` / `radius-sm` / 12-18 | 同左 | `.small` 同左 | 一致，不动 |

---

## 8. 结论：按「有出处」排序的改造清单

1. **开关**：优先引 `@deepseek-ai/dsh-client-ui-primitives` 的 `Switch`（dsh-ops 就是这么做的，只有一个模块引用它，且用 `label` 传可达名）。若暂不引，CSS 必须逐字复制 `Switch.module.css` 的数字与 token：36×20、圆点 16、选中 `brand-primary`、圆点 `label-primary-foreground`/`switch-thumb`、`translateX(16px)`、`opacity .5`、focus offset 2、`corner-shape:round`。删掉 `rgba(0,0,0,.2)`。
2. **下拉**：直接搬 `v1K0Ja_input + selectInput` 契约（32px/`bg-layer-1`/14-22/padding 0 10/max-width 240/SVG caret 12px 右 12/padding-right 32/cursor pointer/focus 只换边框/禁用 opacity .6）。
3. **卡片**：换成宿主设置卡 token 对 `settings-card-stroke`(=border-l4) + `settings-card-fill`(=bg-layer-2)，`radius-xl`，`padding 12 14`，`gap 12`。
4. **业务区分段**：换成原生 `SegmentedControl` 几何（轨道 padding 4、gap 2、`interactive-bg-hover`；tab 28px、13/20/500、padding 0 16；选中用滑动 `layer-1` 药丸 + `elevation-soft`，可只用 CSS `::before` 定位实现，不必引组件）。
5. **子分区头**：13/600 降为 12/500 `label-secondary`（或 14/500），只靠发丝线分隔，不加底色。
6. **事实表**：定一个口径。要「官方详情页手感」→ `space-between` + 右对齐 + 44px 行高 + `label-secondary` 的 dt；要「紧凑对齐」→ 保持 dsh-ops 网格。**不要两版混**。
7. **组件行**：一级页上那一行收敛成 `.row` 形态（40×40 图标框、13.5/500 名、11.5 mono 模块名、12.5 状态 + StateDot、`.5px` 底发丝线、最后一行去线）。
8. **样式注入**：从「组件树里渲染 `<style>`」改成 apply 期一次注入 + `ctx.effect` 回收（与 dsh-ops、与宿主各包一致）。

## 9. 还没证明的部分（不要当成已完成）

- 以上全部是**静态产物数值**与源码结构比对，**没有真机截图**。headless Edge 在这个 SPA 上拿不到 PNG（已多次失败），所以「像不像」仍需你截图确认。
- `Switch` / `Select` 能否在我们的 bundle 里通过宿主模块加载器解析，**尚未验证**（dsh-ops 的构建把 primitives 标成 external，我们的构建流程不同）。引组件前必须先做一个最小验证，失败就退回逐字 CSS 仿制。
- 宿主 `facts` / `rows` 是插件页内部元素，其外层分区间距（`gap:32`）由宿主提供；我们自己的卡片之间若还要额外 gap，需要显式写 12（分区内）——这一点只能靠截图定。
