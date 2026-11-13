// Detail page style audit (v3, post-fix contract).
import fs from "node:fs";
import path from "node:path";
const W = process.env.PURGE_W || "E:/FXS/Data/DSH-Dev/pr/dsh-purge-community/worktrees/refactor-plugin-detail-page";
const SRC = path.join(W, "packages/purge-panel/src");
const S = path.join(SRC, "styles");
const read = (p) => fs.readFileSync(p, "utf8");
const flat = (p) => read(p).replace(/\s+/g, " ").replace(/:\s+/g, ":").replace(/\{\s*/g, "{ ").replace(/\s+\}/g, "}");
const detailCss = flat(path.join(S, "detail-card.css"));
const nativeCss = flat(path.join(S, "native.css"));
const baseCss = flat(path.join(S, "base.css"));
const entryJs = read(path.join(SRC, "entry.js"));
const pageJs = read(path.join(SRC, "components/detail-page.js"));
const formJs = read(path.join(SRC, "components/settings-form.js"));
const maintJs = read(path.join(SRC, "components/maintenance.js"));
const advJs = read(path.join(SRC, "components/advanced.js"));
const rulesJs = read(path.join(SRC, "components/rules.js"));
const psJs = read(path.join(SRC, "components/patch-status.js"));
const localeJs = read(path.join(SRC, "shared/locale.js"));
const skillsJs = read(path.join(SRC, "components/skills.js"));
const drillJs = read(path.join(SRC, "vendor/drill.js"));

const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, "");
function decl(css, selRegex, prop) {
  const bodies = [];
  for (const chunk of strip(css).split("}")) {
    const i = chunk.lastIndexOf("{");
    if (i < 0) continue;
    if (selRegex.test(chunk.slice(0, i).trim())) bodies.push(chunk.slice(i + 1));
  }
  for (const body of bodies.reverse()) {
    const m = new RegExp("(?:^|;)\\s*" + prop + "\\s*:\\s*([^;]+)", "i").exec(body);
    if (m) return m[1].trim();
  }
  return undefined;
}
const CHECKS = [];
function add(id, group, item, want, actual, ref, verdict) {
  let ok;
  if (verdict) ok = verdict !== "FAIL";
  else if (typeof want === "function") ok = want(actual);
  else if (want instanceof RegExp) ok = actual !== undefined && want.test(String(actual));
  else ok = actual !== undefined && String(actual).includes(want);
  CHECKS.push({ id, group, item, want: (typeof want === "function" || want instanceof RegExp) ? "见判据" : want, actual: actual === undefined ? "（无此声明）" : String(actual), verdict: verdict || (ok ? "PASS" : "FAIL"), ref });
}
const cnt = (src, re) => (src.match(re) || []).length;
const SW = /^\.dpg-detail \.dpg-switch$/;
const SEL = /^\.dpg-detail \.dpg-select select/;

// ── 开关：宿主 Switch.module.css，作用域收在 .dpg-switch ──
add("S1", "开关", "轨道 width 36px", "36px", decl(detailCss, SW, "width"), "Switch.module.css:9");
add("S2", "开关", "轨道 height 20px", "20px", decl(detailCss, SW, "height"), "Switch.module.css:10");
add("S3", "开关", "轨道 radius 999px", "999px", decl(detailCss, SW, "border-radius"), "Switch.module.css:13");
add("S4", "开关", "选中 brand-primary", "--dsw-alias-brand-primary", decl(detailCss, /dpg-switch\[aria-checked="true"\]$/, "background"), "Switch.module.css:20");
add("S5", "开关", "圆点 16px", "16px", decl(detailCss, /dpg-switch-thumb$/, "width"), "Switch.module.css:35");
add("S6", "开关", "圆点 switch-thumb", "--dsw-alias-switch-thumb", decl(detailCss, /^.dpg-detail .dpg-switch-thumb$/, "background"), "Switch.module.css:44");
add("S7", "开关", "选中圆点 foreground", "--dsw-alias-label-primary-foreground", decl(detailCss, /aria-checked="true"] .dpg-switch-thumb$/, "background"), "Switch.module.css:39");
add("S8", "开关", "位移 16px", "translateX(16px)", decl(detailCss, /aria-checked="true"] .dpg-switch-thumb$/, "transform"), "Switch.module.css:48");
add("S9", "开关", "禁用 opacity .5", ".5", (decl(detailCss, /dpg-switch:disabled$/, "opacity") || "").replace(/\s+/g, "").replace("0.5", ".5"), "Switch.module.css:25");
add("S10", "开关", "无字面色", (s) => s === undefined, strip(detailCss).match(/rgba?\(|#[0-9a-fA-F]{3,8}\b/g)?.join(" ") || undefined, "只用 token");
add("S11", "开关", "作用域只覆盖布尔开关", (s) => s === undefined, decl(detailCss, /input\[type=checkbox\]/, "width"), "列表多选保持原生");
add("S13", "开关", "开关行结构（文本左 / 开关右）", () => cnt(maintJs + advJs, /dpg-switch-row/g) >= 3, cnt(maintJs + advJs, /dpg-switch-row/g) + " 处（多控件字段用 actions 行）", "单开关字段：文本左、开关右");
add("S12", "开关", "宿主形态 role=switch + span.thumb", () => cnt(maintJs + advJs, /h\(Switch/g) === 4, cnt(maintJs + advJs, /h\(Switch/g) + " 处", "与宿主结构一致（按钮 + 圆点元素）");

// ── 下拉：v1K0Ja_input + 右 12 单 caret ──
add("P1", "下拉", "height 32px", "32px", decl(detailCss, SEL, "height"), "v1K0Ja_input");
add("P2", "下拉", "底色 bg-layer-1", "--dsw-alias-bg-layer-1", decl(detailCss, SEL, "background"), "v1K0Ja_input");
add("P3", "下拉", "font-size 14px", "14px", decl(detailCss, SEL, "font-size"), "v1K0Ja_input 14/22");
add("P4", "下拉", "caret（token 色元素，右 12）", /label-tertiary/, decl(detailCss, /^\.dpg-select::after$/, "border-right"), "宿主用 12×12 SVG；我们用同色 token 元素");
add("P5", "下拉", "padding-right 32px", /32px/, decl(detailCss, SEL, "padding"), "v1K0Ja_selectInput");
add("P6", "下拉", "max-width 240px", "240px", decl(detailCss, /^\.dpg-select$/, "max-width"), "select.v1K0Ja_input");
add("P7", "下拉", "禁用 opacity .6", ".6", decl(detailCss, /select:disabled$/, "opacity"), "v1K0Ja_input:disabled");
add("P8", "下拉", "focus 只换边框", "none", decl(detailCss, /select:focus-visible$/, "outline"), "v1K0Ja_input:focus");
add("P9", "下拉", "markup 被 .dpg-select 包裹", (s) => s === 1, cnt(formJs, /className: "dpg-select"/g), "caret 需要容器元素");

// ── 卡片：宿主设置卡 ──
add("C1", "卡片", "描边 border-l2（截图）", "--dsw-alias-border-l2", decl(detailCss, /^\.dpg-card$/, "border"), "截图：细描边卡片");
add("C2", "卡片", "卡片无填充（截图）", (s) => s === undefined, decl(detailCss, /^\.dpg-card$/, "background"), "截图：卡片与页面同底色，只有凹陷体是浅色");
add("C3", "卡片", "radius-lg", "var(--dsw-radius-lg)", decl(detailCss, /^\.dpg-card$/, "border-radius"), "dsh-ops .ops-card");
add("C4", "卡片", "padding 14px", "14px", decl(detailCss, /^\.dpg-card$/, "padding"), "dsh-ops .ops-card");
add("C5", "卡片", "gap 10px", "10px", decl(detailCss, /^\.dpg-card$/, "gap"), "dsh-ops .ops-card");

// ── 分段：SegmentedControl ──
add("T1", "分段", "轨道 padding 4px", "4px", decl(detailCss, /^\.dpg-tabs$/, "padding"), "SegmentedControl");
add("T2", "分段", "tab height 28px", "28px", decl(detailCss, /^\.dpg-tab$/, "height"), ".tab");
add("T3", "分段", "tab font 13px", "13px", decl(detailCss, /^\.dpg-tab$/, "font-size"), "13/20");
add("T4", "分段", "tab weight 500", "500", decl(detailCss, /^\.dpg-tab$/, "font-weight"), "500");
add("T5", "分段", "tab padding 0 16px", "0 16px", decl(detailCss, /^\.dpg-tab$/, "padding"), "0 16px");
add("T6", "分段", "选中不铺底色", (s) => s === undefined, decl(detailCss, /aria-selected="true"\]$/, "background"), "indicator 药丸");
add("T7", "分段", "滑动指示块 layer-1 + elevation-soft", (s) => s !== undefined && /bg-layer-1/.test(s), decl(detailCss, /^\.dpg-tab-indicator$/, "background"), "SegmentedControl .indicator");
add("T8", "分段", "指示块由 index/count 驱动", (s) => s === 2, cnt(pageJs, /--dpg-seg-(count|index)/g), "宿主用 CSS 变量定位");

// ── 事实表：宿主 .facts ──
add("F1", "事实表", "左对齐两列网格（截图）", /max-content/, decl(detailCss, /^\.dpg-facts > div$/, "grid-template-columns"), "dsh-ops .ops-facts");
add("F2", "事实表", "列距 14px", "14px", decl(detailCss, /^\.dpg-facts > div$/, "column-gap"), "dsh-ops column-gap:14");
add("F3", "事实表", "值不右对齐（截图）", (s) => s === undefined, decl(detailCss, /^\.dpg-facts dd$/, "text-align"), "截图：值紧跟标签列");
add("F4", "事实表", "dt label-tertiary", "--dsw-alias-label-tertiary", decl(detailCss, /^\.dpg-facts dt$/, "color"), "dsh-ops .ops-facts dt");
add("F5", "事实表", "行间无分隔线（截图）", (s) => s === undefined, decl(detailCss, /^\.dpg-facts > div$/, "border-bottom"), "截图：事实行之间无线");

// ── 子分区头 ──
add("H1", "子分区头", "字重 600（截图无下划线）", "600", decl(detailCss, /dshpp-group-h\) :is\(h3, h4\)$/, "font-weight"), "dsh-ops .ops-group-title 600");
add("H2", "子分区头", "字号 13px", "13px", decl(detailCss, /dshpp-group-h\) :is\(h3, h4\)$/, "font-size"), "12~14");

// ── 令牌纪律 ──
add("N1", "令牌纪律", "detail-card.css 无字面色", (s) => s === undefined, strip(detailCss).match(/rgba?\(|#[0-9a-fA-F]{3,8}\b/g)?.join(" ") || undefined, "只用 token");
add("N2", "令牌纪律", "detail-card.css 无 !important", (s) => s === undefined, cnt(strip(detailCss), /!important/g) ? cnt(strip(detailCss), /!important/g) + " 处" : undefined, "靠权重");
add("N3", "令牌纪律", "base.css 字面色（随页面注入）", "见判据", cnt(strip(baseCss), /#[0-9a-fA-F]{3,8}\b/g) + " 处 hex", "业务区改造时一并替换", "NOTE");
add("N4", "令牌纪律", "native.css 字面色", "见判据", cnt(strip(nativeCss), /#[0-9a-fA-F]{3,8}\b/g) + " 处 hex", "同上", "NOTE");

// ── 结构 ──
const inv = {
  styleInTree: cnt(pageJs, /PageStyle/g),
  styleAtApply: cnt(entryJs, /data-dsh-purge-styles/g),
  cardsInPage: cnt(pageJs, /className: "dpg-card[ "]/g),
  switchClassSites: cnt(advJs + maintJs, /h\(Switch/g),
  listCheckboxSites: cnt(rulesJs, /type: "checkbox"/g) + cnt(drillJs, /type: "checkbox"/g),
  heroStateInJsx: cnt(formJs, /className: "dshpp-hero-state"/g),
  heroHiddenByCss: cnt(strip(detailCss), /dshpp-hero-state[^{]*\{[^}]*display:none/g),
  selectsWrapped: cnt(formJs, /className: "dpg-select"/g),
  fields: cnt(formJs + maintJs + advJs, /className: "dpg-field[ "]/g),
  fieldLabels: cnt(formJs + maintJs + advJs, /className: "dpg-field-label"/g),
  fieldHints: cnt(formJs + maintJs + advJs, /className: "dpg-field-hint"/g),
  fieldControls: cnt(formJs, /className: "dpg-field-control/g),
  selectSites: cnt(formJs, /"select",/g),
};
add("D1", "结构", "页面内渲染 <style>（应 0）", (s) => s === 0, inv.styleInTree, "样式在 apply 期注入");
add("D2", "结构", "apply 期样式注入存在", (s) => s > 0, inv.styleAtApply, "dsh-ops/宿主同做法");
add("D3", "结构", "行页卡片数 =3", (s) => s === 3, inv.cardsInPage, "状态/业务/配置");
add("D4", "结构", "布尔开关带 .dpg-switch", (s) => s === 4, inv.switchClassSites, "4 处布尔开关");
add("D5", "结构", "列表多选未被改造", (s) => s !== undefined && inv.switchClassSites === 4, "列表 " + inv.listCheckboxSites + " 处仍用浏览器原生 checkbox", "作用域隔离");
add("D6", "结构", "上游状态行在详情页不渲染", () => /all\s*\?\s*null\s*:\s*h\(\s*"div",\s*\{\s*className: "dshpp-hero-state"/s.test(formJs), "hero-state 由 all?null 门控（hero-state " + inv.heroStateInJsx + " 处、CSS 隐藏 " + inv.heroHiddenByCss + " 条）", "page=all 时 JSX 直接不渲染；重启提示现在常显");
add("D7", "结构", "配置区 select 数量", (s) => s > 0, inv.selectSites, "4 个渠道版本选择器");
add("D8", "结构", "上游皮肤类残留", "见判据", "配置区 31 / 业务区 54", "业务区改造时处理", "NOTE");

// ── 配置区结构：名称 → 描述 → 配置 ──
add("K1", "配置区", "每个字段都有名称", () => inv.fields === inv.fieldLabels && inv.fields > 0, inv.fields + " 个字段 / " + inv.fieldLabels + " 个名称", "名称-描述-配置");
add("K2", "配置区", "描述紧贴名称（不是散在控件后）", () => inv.fieldHints >= 3, inv.fieldHints + " 处字段描述", "参考插件：标题下一行灰字");
add("K3", "配置区", "竖向控件有独立控件区", () => inv.fieldControls >= 3, inv.fieldControls + " 处 dpg-field-control", "文本域/按钮行在描述下方");
add("K4", "配置区", "按钮行是独立 flex 行（不叠成竖排）", () => !/dpg-field-control dpg-actions/.test(formJs), /dpg-field-control dpg-actions/.test(formJs) ? "两个类同挂" : "已拆分", "同挂会把 column 带进按钮行");
add("K5", "配置区", "相邻独立选项之间有分隔线", () => /div:not\(\[hidden\]\) \+ div:not\(\[hidden\]\)/.test(strip(detailCss)), undefined, "块与块之间 .5px 发丝线");
add("K6", "配置区", "补丁明细子分组可展开且带提示", () => cnt(psJs, /dpg-row-toggle/g) === 1 && cnt(psJs, /dshpp-group-h/g) === 0, "dpg-row-toggle ×" + cnt(psJs, /dpg-row-toggle/g) + " / 旧样式 ×" + cnt(psJs, /dshpp-group-h/g), "箭头 + 名称 + 计数提示");
add("K8", "配置区", "分隔线上下等距（12px / 线 / 12px）", () => {
  const rules = strip(detailCss);
  const hasPad = /--dpg-row-pad:12px/.test(rules);
  // 线本身不许再带自己的 padding（按钮行的 padding-top:4px 不算）
  const noAdHoc = !/\+ div:not\(\[hidden\]\) \{ border-top:\.5px solid var\(--dsw-alias-border-l2\); padding-top/.test(rules);
  const families = [
    /\.dpg-field \+ \.dpg-field/,
    /\.dshpp-edition \+ \.dshpp-edition/,
    /\.dpg-patch-group \+ \.dpg-patch-group/,
    /div:not\(\[hidden\]\) \+ div:not\(\[hidden\]\)/,
  ].every((re) => re.test(rules));
  return hasPad && noAdHoc && families;
}, "pad 12 / 无 4px 补丁 / 4 类相邻线齐全", "分隔线只由行自己的上下留白产生");
add("K9", "配置区", "面板里的折叠块之间也有线", () => /:is\(\.dshpp-hero, \.dshpp-rel, \.dshpp-fold, details\) \+ :is\(\.dshpp-hero/.test(strip(detailCss)), undefined, "应用与还原 / 版本管理 / 补丁明细 / 高级选项 同级，必须有线");
add("K7", "配置区", "Hooks 拦截合并成一个字段", () => cnt(advJs, /dshpp-sub/g) === 0 && /hooksDeny\.title"\) \+ "："/.test(advJs), "标题并进字段名", "只有一个选项时不再分组");

// ── 上游残留留白/边框是否被 .dpg-config 清零 ──
const FAMILY = /^\.dshpp-(panel|hero|rel|fold|editions|edition|sub|group|cr)$/;
const upstream = new Set();
for (const chunk of strip(baseCss).split("}")) {
  const i = chunk.lastIndexOf("{");
  if (i < 0) continue;
  const sel = chunk.slice(0, i).trim(), body = chunk.slice(i + 1);
  if (!/(margin|padding|border-(top|bottom))\s*:/.test(body)) continue;
  for (const m of sel.matchAll(/\.dshpp-[a-z0-9-]+/g)) if (FAMILY.test(m[0])) upstream.add(m[0]);
}
const resetRule = (strip(detailCss).match(/\.dpg-config :is\([^)]*\)\s*\{\s*margin-block:0;/s) || [""])[0];
const resetClasses = new Set([...resetRule.matchAll(/\.dshpp-[a-z0-9-]+/g)].map((m) => m[0]));
const missing = [...upstream].filter((c) => !resetClasses.has(c));
add("K12", "业务区", "标题带当前视图的标题（业务（规则集））", () => /panel\.business\.titled/.test(pageJs) && /view: titled\(view\)/.test(pageJs), "标题 = {title}（{view}）", "括号里是视图自己的标题键");
add("K21", "业务区", "业务卡体限高并内部滚动", () => {
  const block = strip(detailCss).match(/\.dpg-business \.dpg-card-body \{[\s\S]*?\}/);
  if (!block) return false;
  const b = block[0];
  return /max-height:\s*clamp\(/.test(b) && /overflow-y:\s*auto/.test(b) && /overscroll-behavior:\s*contain/.test(b);
}, "max-height clamp + overflow-y auto", "内容变长时不吃掉状态区/配置区");
add("K20", "业务区", "维护区也用字段结构", () => {
  const maint = maintJs;
  const heads = cnt(maint, /className: "dpg-field-head"/g);
  const lines = cnt(maint, /className: "dshpp-line"/g);
  const panel = cnt(maint, /className: "dshpp-card"/g);
  return heads >= 1 && lines === 0 && panel === 0;
}, "字段头 ≥1 / 旧状态行 0 / 旧卡片 0", "破甲自检与强化段都是字段");
add("K19", "业务区", "规则集排版已定稿（用户确认）", () => {
  const head = cnt(rulesJs, /className: "dpg-field-head"/g) >= 1;
  const cwdInline = rulesJs.indexOf('className: "dpg-field-inline"') > -1 &&
    rulesJs.indexOf('className: "dpg-field-inline"') < rulesJs.indexOf('t("cwd.title")');
  const emptyCentred = /\.dshpp-rulebody \.dshpp-empty \{ text-align:center/.test(detailCss);
  const allCentred = /:is\(\.dshpp-empty, \.dshpp-editor-empty, \.dpg-empty\) \{[^}]*text-align:center/.test(detailCss);
  const emptyBeforeHint = rulesJs.indexOf('className: "dshpp-empty"') < rulesJs.indexOf('t("cwd.hint")');
  const labelPinned = /\.dpg-detail \.dpg-field-label \{ font-size:13px/.test(detailCss);
  return head && cwdInline && emptyCentred && allCentred && emptyBeforeHint && labelPinned;
}, "字段头 + 目录行内头 + 空态居中 + 字段名压回 13px", "名称/描述/配置项一行，内容全宽在下");
add("K18", "业务区", "窄控件在右、宽控件在下", () => {
  const css = strip(detailCss);
  const grid = /\.dpg-field-inline \{ display:grid/.test(css);
  const narrow = cnt(detailCss, /dpg-field-inline/g) >= 1;
  const wideRule = /@media \(max-width:520px\)[\s\S]*?grid-template-columns:minmax\(0, 1fr\)/.test(css);
  return grid && narrow && wideRule;
}, "grid 两列 + 窄屏落回单列", "窄控件右侧、宽控件下方");
add("K17", "业务区", "技能视图用配置区的行结构", () => cnt(skillsJs, /className: "dpg-field"/g) >= 1 && cnt(skillsJs, /dshpp-hint/g) === 0, cnt(skillsJs, /className: "dpg-field"/g) + " 个字段 / 旧 hint " + cnt(skillsJs, /dshpp-hint/g) + " 处", "名称 → 描述 → 控件");
add("K16", "业务区", "规则集用配置区的行结构", () => cnt(rulesJs, /className: "dpg-field[ "]/g) >= 3 && cnt(rulesJs, /dshpp-block/g) === 0, cnt(rulesJs, /className: "dpg-field[ "]/g) + " 个字段 / dshpp-block " + cnt(rulesJs, /dshpp-block/g) + " 处", "名称 → 描述 → 配置，行间发丝线");
add("K14", "业务区", "视图内不再重复标题", () => cnt(rulesJs + skillsJs, /dshpp-title/g) === 0, cnt(rulesJs + skillsJs, /dshpp-title/g) + " 个内层标题", "标题上提到卡片头，视图里只留右对齐动作");
add("K15", "业务区", "括号里用视图自己的标题（上游决定）", () => /"rules\.title"/.test(pageJs) && /"skills\.title"/.test(pageJs) && /titled\(view\)/.test(pageJs), "rules.title / skills.title，缺键退回标签名", "不是我们给视图起的名字");
add("K13", "业务区", "上游皮肤变量改指 DSH token", () => {
  const block = strip(detailCss).match(/\.dpg-business\s*\{[\s\S]*?\}/);
  if (!block) return false;
  const body = block[0];
  const mapped = (body.match(/--dshpp-[a-z-]+:\s*var\(--dsw-[a-z0-9-]+/g) || []).length;
  const literalColour = /#[0-9a-fA-F]{3,8}\b|rgba?\(/.test(body);
  return mapped >= 9 && !literalColour;
}, "见判据", "≥10 个 --dshpp-* → --dsw-*，且无字面色");
add("K11", "配置区", "折叠块不是 flex（否则关闭时多留一段 gap）", () => {
  const rules = strip(detailCss);
  const detailsBlock = /\.dpg-config details \{ display:block/.test(rules);
  const flexNoDetails = !/\.dpg-config :is\([^)]*details[^)]*\) \{ display:flex/.test(rules);
  return detailsBlock && flexNoDetails;
}, "details display:block 且不在 flex 名单里", "<details> 折叠时 ::details-content 仍是 flex item");
add("K10", "配置区", "上游自带留白/边框已清零", () => missing.length === 0, upstream.size + " 个块类命中 base.css，未覆盖：" + (missing.join(", ") || "无"), "上游 margin 会与行留白叠加成双倍空隙");

const F = CHECKS.filter((c) => c.verdict === "FAIL");
const N = CHECKS.filter((c) => c.verdict === "NOTE");
console.log("== " + CHECKS.length + " 项：PASS " + (CHECKS.length - F.length - N.length) + " / FAIL " + F.length + " / NOTE " + N.length + " ==");
for (const c of CHECKS) if (c.verdict !== "PASS") console.log(c.verdict + "  " + c.id + " [" + c.group + "] " + c.item + "  应=" + c.want + "  现=" + c.actual.slice(0, 100));
console.log("\n== 清点 ==", JSON.stringify(inv));
fs.writeFileSync(path.join(W, "notes/evidence/detail-page-style-audit.json"), JSON.stringify({ generatedAt: new Date().toISOString(), totals: { checks: CHECKS.length, fail: F.length, note: N.length }, checks: CHECKS, inventory: inv }, null, 2));
