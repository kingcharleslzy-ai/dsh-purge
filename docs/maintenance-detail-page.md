# 插件详情页：一级看状态，二级看全部

## 两级面

| 面 | slot | 内容 |
| --- | --- | --- |
| **一级（插件页）** | `plugins.detail.section`（id `dsh-purge-status`，order 50） | 只有**状态区**（一张卡） |
| **二级（行页）** | `plugins.row.config` | **状态区 + 业务区 + 配置区**，顺序 状态 → 业务 → 配置；`view: "summary"` 只出一行摘要 |
| 标题 | `plugins.detail.badge` | 补丁计数徽标 |

`plugins.detail.section` 是广播插槽：它对每个插件的详情页都会挂一次，组件用 `ownsSubject()` 自过滤
（bundle 只看包名、row 只看 rowId、item 直接返回 null），不自过滤就会画到别人的页面上。

## 唯一组件

`cordis.patch.yml` 只有一条 insert（`id: dsh-purge`）。演练台、`presets-plugin`、演练台事实库与 HTTP 桥在
`lib/index.js` 的 apply 末尾用 `ctx.plugin()` 挂到本插件的 fiber 下，所以插件页的「包含的组件」只有一个。

## 样式只注入一份

`entry.js` 的 apply 里用 `ctx.effect` 把 `PURGE_CSS + NATIVE_CSS + DETAIL_CARD_CSS` 装进一个
`<style data-dsh-purge-styles>`，随 fiber 卸载回收。页组件**不再渲染** `<style>`：两个页面同时打开也只有一份，
这与 dsh-ops（apply 期一份）和宿主各包（`style[data-plugin-css]` 一份）一致。无 DOM 的宿主半 harness 会被
`typeof document === "undefined"` 守卫跳过，不会因为样式而失败。

## 状态区

两级页面共用同一个 `StatusCard`：标题 + 右侧 28px「刷新」+ 一句 lead + `dl.dpg-facts`（版本、宿主、补丁、
待应用、通道、备份、提示词状态、DSH 目录）+ 仓库 note。数据来自共享的 `/dsh-purge/status`（30 秒 TTL），
两个页面挂载时都强制重读一次。读失败写 `状态读取失败：<原因>`，界面与后端版本不一致时补一行 mismatch。

配置区里上游那条**带状态点的**「N/M 条补丁已生效 · 桌面端」在 `page === "all"` 时不再渲染（JSX 门控），
免得和顶部状态卡重复；但动作行下面保留一份**简单补丁状态**（`.dpg-status-line`：状态点 + `N/M 条磁盘补丁` + 通道）
和重启提示（`apply.restartHint`，常显），因为它们是「按下应用」这件事的上下文。

版本区顶部是 `.dpg-statusline` 四段：`DSH <host>` · `兼容级别 <level>` · `磁盘写入计数 N/M · K 条本机不适用` · `插件 vX`，
取代了原来只有「本机 vX 当前」的一行。

## 业务区：标题带视图名，皮肤换 token

标题是 `业务（规则集）` 这种形式：`t("panel.business.titled", { title, view })`，`view` 取当前激活的标签名，
所以切到「技能」标题就变成「业务（技能）」。右上仍是分段切换（`SegmentedControl` 几何）。

视图本体还是上游组件，但**逐个视图按配置区的行结构重排**：规则集已改成三个 `.dpg-field`
（工作区策略 / 本地规则（当前目录）/ 规则列表），每块都是「名称 13/500 + 描述 12 + 控件」，块间由发丝线分隔；
`section.dshpp-panel` 自带的 1px 边框与 18px 内边距在业务区里清零（盒中盒去掉），「还原」从顶部孤行挪进「规则列表」的控件行。
### 规则集排版（已定稿，2026-11-13 用户确认）

自上而下，顺序不要动：

1. 字段头：`本地规则（当前目录）` + 右侧 `重新扫描`（`.dpg-field-head`）；
2. 工作目录路径（`.dpg-field-hint.dpg-mono`）；
3. 目录空态（居中）；
4. 兜底说明（`.dpg-field-hint`）；
5. 发丝线 → `规则列表` 字段头（+ 右侧 `还原`）；
6. 列表 / 空态（居中）；
7. 新建行（id / 名称 / 目标 / 新建）；
8. 发丝线 → 编辑器（未选中时一行「选择规则」）。

判定口径：**动作（单个按钮、开关、窄下拉）放字段头右侧；内容型控件（列表、文本域、多输入行）放字段下方占满宽。**
闸门 K19 锁的就是这个顺序，改结构前先看 `notes/evidence/detail-page-style-audit.json`。

技能视图同样收成一块「技能列表」字段：名称 + 说明 + 控件（通知 / 导入 ZIP / 导入文件夹 / 列表 / 编辑器）。
演练台与维护视图仍待重排。

**暖纸皮肤整棵子树换掉了**：`.dpg-business` 里把 `--dshpp-*` 这一组变量重新指向 DSH token
（`--dshpp-ink/mute/line/fill/accent/ok/warn/bad/paper/sans/display/mono` 共 15 项），上游规则自然就落在原生配色上，
也顺手绕开了它们的 hex 兜底。变量管不到的几处形状（字段、表格、标签、提示气泡）另有明确覆盖。
审计 K13 会数：`≥10 个 --dshpp-* → --dsw-*` 且块内无字面色。

一个 `section.dpg-card`，头右侧是分段切换（`role=tablist`），四个视图 **规则 / 技能 / 演练台 / 维护与更新**，
只挂载打开过的视图。切换器是宿主 `SegmentedControl` 的几何：透明 tab + 一个按
`--dpg-seg-count` / `--dpg-seg-index` 位移的 `.dpg-tab-indicator` 药丸，不给选中的 tab 铺底色。

## 配置区：名称 → 描述 → 配置

`PurgifySection page="all"` 一次挂载：应用与还原、版本管理、补丁明细、高级选项、提示词、服务器名单。
每一项都走同一套结构——`.dpg-field` 里先给**名称**（`.dpg-field-label`，13/500）和**描述**（`.dpg-field-hint`，12 弱色），
再给**控件**：开关类用 `.dpg-switch-row`（描述在左、开关在右），文本域/按钮行走 `.dpg-field-control`（描述下方竖向排）。
描述不再散落在控件之后，警告与错误也归位到字段内（`.dpg-field-error`）。
**上游 base.css 自带的留白与 1px 边框必须先清零**：`.dshpp-rel` 有 `margin-bottom:14px`、`.dshpp-editions` 有
`margin-top:10px` + `border-top:1px`、`.dshpp-edition` 有 `padding:10px 0` + `border-bottom:1px`、`.dshpp-sub` 有
`margin:20px 0 10px`——它们会和行留白叠成「上 24 / 下 12」这种不对称，还会画出第二条 1px 的线。配置页用一条
`:is(...)` 重置（`margin-block:0` + `border-width:0`）统一清零，再由下面的规则给留白与线；审计 K10 会逐个类核对是否覆盖。
相邻的独立选项之间由 `div:not([hidden]) + div:not([hidden])` 补一条发丝线；**嵌套块不再自带上下留白**
（版本管理里的 `details`、高级选项里的 `.dshpp-cr`），否则同一条线会出现上 24 / 下 12 的不对称；只有一个选项的块（如 Hooks 拦截）不建分组头，
标题直接并进字段名。补丁明细的 5 个分组用 `.dpg-row-toggle`（箭头 + 名称 + 「N/M 已应用 · 跳过 X」提示）并左缩进一档。
上游的 `.dshpp-hero / .dshpp-rel / .dshpp-fold / details` 在 `.dpg-config` 作用域里**不再自画卡片**，
改成「卡片内用发丝线分隔的字段组」——外层已经是一张卡片，里面再套边框就会是盒子套盒子。

## 版面语言（数字都有出处）

`src/styles/detail-card.css`（`dpg-` 前缀），2026-11 按宿主与 dsh-ops 的**实测产物**重做：

| 元素 | 采用值 | 出处 |
| --- | --- | --- |
| 卡片 | `.5px border-l2` + `radius-lg` + `padding 14` + `gap 10`，**无填充** | 参考插件实机截图：卡片与页面同底色，只有凹陷体是浅色 |
| 开关 | `36×20`、圆点 `16`、选中 `brand-primary`、关态圆点 `switch-thumb`、位移 `16px`、禁用 `.5` | `primitives/lib/Switch.module.css` |
| 下拉 | `32px` / `bg-layer-1` / `14-22` / 右内距 `32` / `max-width:240` / 禁用 `.6` / 单 caret | `dsh-client-ui-settings-models` 的 `v1K0Ja_input + selectInput` |
| 分段 | 轨道 `padding 4`、tab `28px` `13/20/500` `0 16px`、滑动药丸 `layer-1` + `elevation-soft` | primitives `SegmentedControl` |
| 事实表 | 左对齐两列网格（`max-content` + `minmax(0,1fr)`）、`column-gap 14`、行距 6、无分隔线、`dt` `label-tertiary` | 参考插件实机截图 + 其 `.ops-facts` |
| 子分区头 | `13/600`，**不加下划线** | 截图：标题下没有分隔线，分隔线只出现在行与行之间 |
| 开关行 | 文本左（`13/500` + `12` hint）、开关右、`gap 16`、行间 `.5px` 发丝线 | 截图：每个开关独占一行 |
| 按钮 | 主按钮 `label-primary` 实底 + `bg-layer-3` 字；次要 = 无 chrome 文本 | 截图里的「保存 / 重置」 |

上游按钮（`.dshpp-btn` / `-primary` / `-ghost` / `-danger` / `-solid-danger` / `-tiny`）在 `.dpg-detail` 下全部映射到上面这套语言，
base.css 里的暖纸绿按钮不再出现在详情页。

开关**只作用于布尔项**：`.dpg-switch`（`button[role=switch]`），共 4 处（hooks 绕行、自动检查、自动安装、清除密钥），
每处都是 `.dpg-field > .dpg-switch-row > .dpg-field-text` + 开关的结构，与截图的行形态一致。
规则列表与演练台里的多选框保持浏览器原生——早期的 `input[type=checkbox]` 选择器会把它们一起画成胶囊。

只用 `--dsw-*` token：`detail-card.css` 里没有 hex、没有 `rgba()`、没有 `!important`。上游 `base.css` / `native.css`
仍带 81 处 hex 兜底色，那属于业务区素材皮肤，随业务区改造一并替换。

## 验收

```sh
npm run check:docs && npm run check:client && npm run test:ui
node packages/purge-panel/test/check.cjs && node packages/purge-panel/test/requests.cjs
node packages/purge-panel/test/community.cjs
node tools/audit-detail-page.mjs     # 53 项样式契约：PASS 49 / FAIL 0 / NOTE 4
```

`detail-info.test.cjs`：一级页 1 张卡 / 0 个业务 tab / 1 份 facts；行页 **3 张卡**（状态 / 业务 / 配置）+ 4 个视图；
业务区切换只挂载打开过的视图；卡片契约（`settings-card-*` / `radius-xl` / `12px 14px` / 事实表 44px /
28px 动作 / 6px chevron）与「样式只在 apply 期注入一份」。

`tools/audit-detail-page.mjs` 是这次重做用的机器检查：它把每条声明与调研取得的原生数值逐项比对，
输出 PASS/FAIL/NOTE 与源码清点（样式份数、卡片数、布尔/列表 checkbox 数）。改样式后先跑它，再跑上面的命令。

## 已知且自觉的偏差

- 开关**已经**是宿主结构：`components/primitives.js` 的 `Switch` 渲染 `button[role=switch]` + `span.dpg-switch-thumb`，
  数字逐条取自 `primitives/Switch.module.css`。**不用** `input[type=checkbox]::after` 画圆点——`input` 是替换元素，
  伪元素在 Chromium 里不保证渲染，早期版本因此只画出一条空轨道（只有轨道、没有圆点）。
  没有直接 `require` 宿主的 primitives 包，是因为要先验证本 bundle 能被宿主模块加载器解析。
- 下拉的 caret 用 token 色的元素画（`.dpg-select::after`），宿主用的是 12×12 SVG data-URI——那里面必须写字面色，
  与「只用 token」冲突，所以选了等价形状。
- 上游 `base.css` / `native.css` 的 hex 与 `.dshpp-*` 类名仍在业务区生效。

## 界面定稿快照（2026-11-13）

- **分工**：bundle 页（`plugins.detail.section`）只承载状态卡；row 页承载业务区 + 配置区。状态卡不再出现在 row 页（与 dsh-ops 一致）。
- **状态卡**：卡头「运行状态 · 刷新于 HH:MM:SS」+ 右侧「重新检测」；卡体一层浅面（`dpg-status-body`），事实表每行两对（窄屏一对），卡底 12px 弱色说明。
- **业务区**：标题带当前视图的上游标题（`业务（规则集）`）；四个视图统一为「字段头（名称 + 右侧动作）/ 描述 / 内容全宽」；卡体限高 `clamp(320px,56vh,720px)` 并内部滚动。
- **规则集**：工作区策略（控件在右）→ 本地规则（名称 + 路径 / 右侧重新扫描 → 空态 → 说明）→ 规则列表（名称 + 还原 → 列表 / 新建 → 编辑器）。
- **技能**：技能列表（名称 + 导入按钮在右 → 列表 → 说明）→ 编辑器字段。
- **演练台**：未授权时只有「完成授权」入口，授权复用 `AuthGate` 弹窗（倒计时 + 读到末尾 + 三条确认）；vendor CSS 注入文档头，不进渲染树。
  **演练台本体保留上游样式**（`vendor/drill.js` 自带的那套做得够好），不按业务区字段语言重排，也不做深色适配——2026-11-13 维护者决定。
- **维护与更新**：破甲自检 / 破甲强化段 / 社区版更新 / 本机备份 / 自动检查 / 自动安装，全部字段化；逐层明细三列网格，说明作为条目内第二行。
- **闸门**：`node tools/audit-detail-page.mjs` 75 项（PASS 72 / FAIL 0 / NOTE 3），K1–K21 覆盖字段结构、分割线、控件位置、状态区分工、业务区限高。
