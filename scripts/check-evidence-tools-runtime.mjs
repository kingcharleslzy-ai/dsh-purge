// Run against an isolated prefix containing the official DSH tool registry.
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { createRequire } from 'node:module'
import * as storePlugin from '../lib/redteam/store.js'

const prefix = path.resolve(process.argv[2])
const host = createRequire(path.join(prefix, 'package.json'))
const { Context } = host('@deepseek-ai/cordis')
const { SystemPrompt } = host('@deepseek-ai/dsh-system-prompt')
const { ToolsService } = host('@deepseek-ai/dsh-tools')
process.env.DSH_HOME = prefix
const toolPlugin = await import('../lib/redteam/tools.js')
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'purge-evidence-tools-'))
const ctx = new Context()
try {
  await ctx.plugin(SystemPrompt)
  await ctx.plugin(ToolsService)
  await ctx.plugin(storePlugin, {root:path.join(tmp, 'store')})
  await ctx.plugin(toolPlugin)
  const tools = ctx.tools.view().visible
  const call = async (name, args) => JSON.parse(await tools.get('redteam_' + name).execute(args, {}))
  const opened = await call('engagement_open', {target:'runtime-fixture'})
  assert.equal(opened.ok, true)
  const engagement = opened.engagement.id
  const run = (name, args = {}) => call(name, {engagement, ...args})
  const input = {operation:'fixture', result:{value:1}, authority:'subagent-report', confidence:'claimed', source_agent:'fixture'}
  const claim = await run('evidence_record', input)
  assert.equal(claim.ok, true)
  assert.equal((await run('evidence_list')).items.length, 1)
  assert.equal((await run('evidence_upgrade', {claimed_ev_id:claim.ev_id})).ok, false)
  assert.equal((await run('unverified_count')).unverified_count, 1)
  const match = await run('evidence_verify', {operation:'fixture', result:input.result, confidence:'claimed', authority:'subagent-report'})
  assert.equal(match.matched, true)
  assert.equal(match.confidence, 'claimed')
  assert.equal((await run('evidence_upgrade', {claimed_ev_id:claim.ev_id, verified_result:{measurement:1}})).ok, true)
  assert.equal((await run('unverified_count')).unverified_count, 0)
  const unknown = await run('unknown_record', {question:'fixture?'})
  assert.equal((await run('unknown_resolve', {unk_id:unknown.unk_id, disposition:'withdrawn'})).ok, true)
  assert.equal((await run('unknown_list', {status:'withdrawn'})).items[0].unk_id, unknown.unk_id)
  assert.equal((await run('unknown_resolve', {unk_id:'missing', disposition:'resolved'})).ok, false)
  const external = path.join(tmp, 'external')
  fs.mkdirSync(external)
  fs.writeFileSync(path.join(external, 'marker'), 'preserve')
  const linkType = process.platform === 'win32' ? 'junction' : 'dir'
  for (const subdir of ['shots','attack-files','incoming']) {
    fs.symlinkSync(external, path.join(ctx.redteam.dirOf(engagement), subdir), linkType)
  }
  assert.equal((await run('shot_add', {data_base64:'aGk='})).ok, false)
  assert.equal((await run('attack_file_add', {target:'sample', name:'marker', evidence:'fixture', content:'changed'})).ok, false)
  fs.unlinkSync(path.join(ctx.redteam.dirOf(engagement), 'shots'))
  assert.equal((await run('shot_add', {path:'incoming/marker'})).ok, false)
  assert.equal((await run('shot_add', {data_base64:'aGk='})).ok, true)
  assert.deepEqual(fs.readdirSync(external), ['marker'])
  assert.equal(fs.readFileSync(path.join(external, 'marker'), 'utf8'), 'preserve')
  ctx.redteam.db(engagement).prepare('UPDATE evidence SET result=? WHERE ev_id=?').run('{"value":2}', claim.ev_id)
  assert.equal((await run('evidence_verify', {operation:'fixture', result:input.result, confidence:'claimed', authority:'subagent-report'})).ok, false)
  const count = await run('unverified_count')
  assert.equal(count.ok, false)
  assert.equal(count.unverified_count, undefined)
  console.log('PASS registered evidence, unknown, file import and containment tools:', process.platform, process.version, linkType)
} finally {
  await ctx.fiber.dispose()
  fs.rmSync(tmp, {recursive:true, force:true})
}
