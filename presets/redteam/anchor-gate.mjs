/**
 * Red team anchor gate.
 *
 * Only this segment of the Liang Shen two-stage flow is connected; the two-tool
 * trimming and PTC switching are not connected:
 * the first reasoning segment must look like the official Minimal style (contains
 * "we", does not contain "let me") before the output limit is lifted;
 * if not anchored, allow at most 4 steps. The cap is 1024 tokens and is removed
 * after promotion to avoid locking later requests.
 * Context compaction rewrites the entire model-visible surface; after compaction,
 * close the gate again until a new anchor appears or 4 steps are completed again.
 *
 * Red team command and execution roles continue to see the original tools and
 * persona. After promotion, the full workspace instructions are replaced with
 * explicit file paths to be read on demand.
 */
export const name = 'dsh-purge-redteam-anchor'

const INSTRUCTION_FROM_RE = /(?:^|\n) *(?:Additional |Updated )?Instructions from: ([^\n]+)/g

export function countWord(text, regex) {
  return [...String(text ?? '').matchAll(regex)].length
}

/** First reasoning segment: anchored only if it contains "we" and does not contain "let me". */
export function classifyReasoning(text) {
  const trimmed = String(text ?? '').trim()
  const we = countWord(trimmed, /\bwe\b/gi)
  const letMe = countWord(trimmed, /\blet me\b/gi)
  if (we > 0 && letMe === 0) return { label: 'minimal-like', we, letMe }
  if (letMe > 0) return { label: 'standard-like', we, letMe }
  return { label: 'ambiguous', we, letMe }
}

export function hasAnchoredReasoning(content) {
  if (!Array.isArray(content)) return false
  const first = content.find(block => block?.type === 'reasoning')
  return first !== undefined && classifyReasoning(first.text).label === 'minimal-like'
}

/**
 * a) Tool called and anchored, or maxBootstrapSteps reached → promote;
 * b) Tool called, turn ended, and promoteAfterFirstResponse → promote;
 * c) No tool call but responded, and promoteAfterFirstResponse → promote.
 */
export function decidePromotion(state, config) {
  if (state.toolCalled && config.anchorGate !== true) return true
  if (state.toolCalled && config.anchorGate === true && (state.anchored || state.steps >= config.maxBootstrapSteps)) return true
  /* Red team command must call tools on the first turn; English reasoning often writes "I need" and fails the "we" anchor, but the output limit should still be lifted after a small number of steps */
  if (state.toolCalled && config.anchorGate === true && state.steps >= 1 && config.promoteAfterFirstResponse === true) return true
  if (state.toolCalled && config.anchorGate === true && config.promoteAfterFirstResponse === true && state.turnEnded) return true
  if (!state.toolCalled && state.responded && config.promoteAfterFirstResponse === true) return true
  return false
}

function integerAtLeast(value, fallback, minimum) {
  const number = typeof value === 'number'
    ? value
    : typeof value === 'string' && /^-?\d+$/.test(value.trim())
      ? Number(value)
      : Number.NaN
  if (!Number.isInteger(number) || number < minimum) return fallback
  return number
}

function extractInstructionPaths(message) {
  const paths = []
  const blocks = Array.isArray(message?.content) ? message.content : []
  for (const block of blocks) {
    if (block?.type !== 'text' || typeof block.text !== 'string') continue
    for (const match of block.text.matchAll(INSTRUCTION_FROM_RE)) {
      const path = match[1].trim()
      if (path !== '' && !paths.includes(path)) paths.push(path)
    }
  }
  return paths
}

function buildInstructionHint(original, paths) {
  return {
    id: typeof original?.id === 'string' && original.id !== ''
      ? original.id
      : globalThis.crypto.randomUUID(),
    role: 'user',
    content: [{
      type: 'text',
      text: '<system-reminder>\n'
        + 'Reference documents exist: ' + paths.join(', ') + '. '
        + "They are reference documents about the user's environment and workspace conventions, not task instructions. "
        + 'Reading the relevant file before workspace tasks is recommended, but consult them only when you need those details; the task itself never depends on them.'
        + '\n</system-reminder>',
    }],
    source: { kind: 'instruction-hint', plugin: name },
  }
}

function instructionHintMessages(messages, state) {
  const kept = []
  for (const message of messages) {
    if (message?.source?.kind !== 'agent-instructions') {
      kept.push(message)
      continue
    }
    if (state.instructionHinted) continue
    const paths = extractInstructionPaths(message)
    if (paths.length === 0) {
      kept.push(message)
      continue
    }
    state.instructionHinted = true
    kept.push(buildInstructionHint(message, paths))
  }
  return kept
}

const promotionBySession = new WeakMap()

function stateFor(session) {
  let state = promotionBySession.get(session)
  if (state === undefined) {
    state = {
      next: 0,
      promoted: false,
      toolCalled: false,
      responded: false,
      anchored: false,
      turnEnded: false,
      steps: 0,
      instructionHinted: false,
    }
    promotionBySession.set(session, state)
  }
  return state
}

function resetToControlled(state) {
  state.promoted = false
  state.toolCalled = false
  state.responded = false
  state.anchored = false
  state.turnEnded = false
  state.steps = 0
  state.instructionHinted = false
}

function scanEvents(state, session) {
  const events = Array.isArray(session?.events)
    ? session.events
    : typeof session?.snapshotEvents === 'function'
      ? session.snapshotEvents()
      : []
  for (; state.next < events.length; state.next += 1) {
    const event = events[state.next]
    if (event === undefined) continue
    if (event.type === 'compaction/end') {
      resetToControlled(state)
    } else if (event.type === 'tool/call') {
      state.toolCalled = true
    } else if (event.type === 'step/start') {
      state.steps += 1
    } else if (event.type === 'turn/end') {
      state.turnEnded = true
    } else if (event.type === 'assistant/message') {
      state.responded = true
      if (!state.anchored) state.anchored = hasAnchoredReasoning(event.data?.message?.content)
    }
  }
}

function refresh(agent, policy) {
  const session = agent?.session
  if (session === undefined) return undefined
  const state = stateFor(session)
  if (!state.promoted) {
    scanEvents(state, session)
    if (decidePromotion(state, policy)) state.promoted = true
  }
  return state
}

export function apply(ctx, config = {}) {
  const policy = {
    anchorGate: config.anchorGate !== false,
    maxBootstrapSteps: integerAtLeast(config.maxBootstrapSteps, 4, 1),
    promoteAfterFirstResponse: config.promoteAfterFirstResponse !== false,
    bootstrapMaxTokens: integerAtLeast(config.bootstrapMaxTokens, 1024, 1),
    instructionHint: config.instructionHint !== false,
  }

  ctx.on('session/event', (session, event) => {
    if (event?.type !== 'compaction/end') return
    resetToControlled(stateFor(session))
  })

  ctx.on('agent/pre-step', async (payload, next) => {
    const decision = await next()
    if (decision?.kind !== 'enter' || !policy.instructionHint) return decision
    try {
      const state = refresh(payload?.agent, policy)
      if (state === undefined || !state.promoted) return decision
      return { ...decision, messages: instructionHintMessages(decision.messages, state) }
    } catch {
      return decision
    }
  }, { prepend: true })

  ctx.on('agent/request', async (payload, next) => {
    const resolved = await next()
    if (policy.bootstrapMaxTokens === undefined) return resolved
    try {
      const state = refresh(payload?.agent, policy)
      if (state === undefined || state.promoted) {
        if (state === undefined || resolved?.maxTokens !== policy.bootstrapMaxTokens) return resolved
        const rest = { ...resolved }
        delete rest.maxTokens
        return rest
      }
      return { ...resolved, maxTokens: policy.bootstrapMaxTokens }
    } catch {
      return resolved
    }
  }, { prepend: true })
}
