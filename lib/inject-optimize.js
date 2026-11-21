// 提示词优化：把用户在编辑框里的注入正文交给当前模型改写。
//
// 设计约束（都很保守）：
//   · 只在用户主动点击时调用，不进入对话路径，不影响任何一次真实注入；
//   · 结果是**建议**，回填到编辑框由用户确认后才保存，不自动落盘；
//   · 模型不可用、超时、输出异常时返回失败并说明原因，绝不静默替换原文；
//   · 原文永不修改——本模块不写任何文件。
import fs from "node:fs";
import path from "node:path";

const MAX_INPUT_BYTES = 64 * 1024;
const DEFAULT_TIMEOUT_MS = 90_000;

/** 优化目标：用户可选，每个对应一段追加指令。 */
export const OPTIMIZE_GOALS = {
  concise: {
    label: "精简",
    instruction:
      "在不丢失任何约束的前提下压缩篇幅：删掉重复、空话和可有可无的解释。保留全部具体要求与边界。",
  },
  precise: {
    label: "明确",
    instruction:
      "把含糊的表述改成可执行、可验证的要求：模糊动词换成具体动作，模糊程度换成明确标准。不要新增用户没表达过的偏好。",
  },
  structure: {
    label: "结构化",
    instruction:
      "重排为清晰的结构（分节 + 短句），让关键约束更靠前。不加新内容，只重组与措辞。",
  },
  strengthen: {
    label: "强化执行",
    instruction:
      "减少模型过度保守的倾向：明确“按已给信息直接执行、不追加行为外的免责与反问”。不写任何违法或伤害性内容。",
  },
};

const SYSTEM_PROMPT = [
  "你是提示词编辑器。输入是一段系统提示词注入正文，输出是改写后的版本。",
  "硬性规则：",
  "1. 只输出改写后的正文本身，不要任何前言、说明、标题包装或代码围栏。",
  "2. 不得新增输入中不存在的请求、人物设定、身份声明或越权指令。",
  "3. 保留原文中的占位符、变量名、路径、专有名词与既定格式约定。",
  "4. 不改变原文的语言。",
].join("\n");

function buildUserPrompt(text, goalKey) {
  const goal = OPTIMIZE_GOALS[goalKey];
  const lines = [];
  if (goal) lines.push(`改写目标：${goal.label}。${goal.instruction}`);
  lines.push("", "原文如下（三反引号之间是待改写内容本身）：", "```", text, "```");
  return lines.join("\n");
}

/** 从模型输出里剥掉可能被包上的代码围栏。 */
export function stripFence(raw) {
  let s = String(raw || "").trim();
  const fence = s.match(/^```[a-zA-Z0-9_-]*\n([\s\S]*?)\n```$/);
  if (fence) s = fence[1].trim();
  return s;
}

/**
 * 校验优化输入，返回 { ok, text, goal, error }。
 * 输入过大或为空直接拒绝，不把半截内容交给模型。
 */
export function validateOptimizeInput(text, goal) {
  const raw = typeof text === "string" ? text : "";
  if (!raw.trim()) return { ok: false, error: "content is empty" };
  if (Buffer.byteLength(raw, "utf8") > MAX_INPUT_BYTES) {
    return { ok: false, error: "content too large (max 64 KiB)" };
  }
  const key = typeof goal === "string" ? goal.trim() : "";
  if (key && !Object.prototype.hasOwnProperty.call(OPTIMIZE_GOALS, key)) {
    return { ok: false, error: `unknown goal: ${key}` };
  }
  return { ok: true, text: raw, goal: key };
}

/**
 * 取 llm 服务。
 * 与 index.js 的拒绝重试同一写法：本插件未声明 inject: ['llm']，
 * 直接 ctx.llm 会抛，reflect.get 是非严格取法，服务不在时返回 undefined。
 */
export function resolveLlm(ctx) {
  try {
    const llm = ctx?.reflect?.get?.("llm", false) || null;
    if (llm && typeof llm.stream === "function") return llm;
  } catch { /* fall through */ }
  return null;
}

/** 会话当前使用的模型选择：从最近的请求头推断，取不到就用默认。 */
function modelSelectionOf(ctx, sessionId) {
  try {
    const agents = typeof ctx?.get === "function" ? ctx.get("agents") : ctx?.agents;
    const agent = agents?.get?.(sessionId);
    const sel = agent?.session?.header?.model || agent?.session?.header?.modelSelection;
    if (sel && typeof sel === "object") return sel;
  } catch { /* ignore */ }
  return undefined;
}

/**
 * 调用模型改写。返回 { ok, content } 或 { ok:false, error }。
 * 不抛异常——路由层只需要一个确定的结果。
 */
export async function optimizePrompt(ctx, { text, goal, sessionId, timeoutMs } = {}) {
  const check = validateOptimizeInput(text, goal);
  if (!check.ok) return { ok: false, error: check.error };

  const llm = resolveLlm(ctx);
  if (!llm) return { ok: false, error: "llm service unavailable" };

  const controller = new AbortController();
  const timer = setTimeout(() => {
    try { controller.abort(); } catch { /* ignore */ }
  }, Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : DEFAULT_TIMEOUT_MS);

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(check.text, check.goal) },
    ];
    const opts = {
      messages,
      signal: controller.signal,
      // 标记非普通对话请求，便于宿主忽略（与 refusal-retry 的私有标记同思路）。
      ...(sessionId ? { sessionId } : {}),
    };
    const model = modelSelectionOf(ctx, sessionId);
    if (model) opts.model = model;

    const iterator = llm.stream(opts)[Symbol.asyncIterator]();
    let out = "";
    while (true) {
      const step = await iterator.next();
      if (step.done) break;
      const value = step.value;
      if (value && value.type === "text-delta" && typeof value.text === "string") {
        out += value.text;
        if (out.length > MAX_INPUT_BYTES * 2) {
          try { await iterator.return?.(); } catch { /* ignore */ }
          return { ok: false, error: "model output too large" };
        }
      }
    }
    const cleaned = stripFence(out);
    if (!cleaned.trim()) return { ok: false, error: "model returned empty content" };
    return { ok: true, content: cleaned };
  } catch (error) {
    const aborted = error && (error.name === "AbortError" || /abort/i.test(String(error.message || "")));
    return { ok: false, error: aborted ? "timed out" : String(error && error.message || error) };
  } finally {
    clearTimeout(timer);
  }
}

/** 仅供测试：替换默认超时的读法。 */
export const __internals = { MAX_INPUT_BYTES };
