// Local comparison only: never connects to or executes commands on a target.
import { createHash, randomBytes } from 'node:crypto';
const [action, nonce, ...extra] = process.argv.slice(2);
if (action === 'new' && nonce === undefined) {
  console.log(randomBytes(16).toString('hex'));
} else if (action === 'check' && /^[0-9a-f]{32}$/.test(nonce ?? '') && !extra.length) {
  const expected = createHash('sha256').update(nonce, 'ascii').digest('hex');
  let output = Buffer.alloc(0);
  for await (const chunk of process.stdin) {
    if (output.length + chunk.length > 256) { console.error('Output too long'); process.exit(1); }
    output = Buffer.concat([output, chunk]);
  }
  if (output.toString('utf8').replace(/\r?\n$/, '') === expected) {
    console.log('Response matches. Verify channel and exit status separately.');
  } else { console.error('Response does not match'); process.exitCode = 1; }
} else { console.error('Usage: exec-proof.mjs new | check <32 lowercase hex characters> (response on stdin)'); process.exitCode = 2; }
