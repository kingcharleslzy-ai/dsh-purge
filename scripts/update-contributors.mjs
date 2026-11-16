// Documentation only: retain historical credits and augment them from GitHub.
// Run with GH_TOKEN for API access; --check validates committed output offline.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repository = process.env.GITHUB_REPOSITORY || 'kingcharleslzy-ai/dsh-purge';
if (!/^[\w.-]+\/[\w.-]+$/.test(repository)) throw Error('Invalid repository');
const start = '<!-- CONTRIBUTORS:START -->', end = '<!-- CONTRIBUTORS:END -->';
const snapshot = path.join(root, '.github/contributors.json');
const previous = fs.existsSync(snapshot) ? JSON.parse(fs.readFileSync(snapshot, 'utf8')) : [];
const entries = new Map();
function remember(person) {
  if (!/^[a-z\d](?:[a-z\d-]{0,38})$/i.test(person.login || '') || !Number.isSafeInteger(person.id) || person.id <= 0)
    throw Error('Invalid contributor identity');
  entries.set(person.login.toLowerCase(), { login: person.login, id: person.id });
}
previous.forEach(remember);
const manual = [...fs.readFileSync(path.join(root, 'CONTRIBUTORS.md'), 'utf8').matchAll(/\]\(https:\/\/github\.com\/([a-z\d-]+)\)/gi)].map(m => m[1]);
async function api(route) {
  const response = await fetch(`https://api.github.com/${route}`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'purge-contributors',
      ...(process.env.GH_TOKEN ? { authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) },
    signal: AbortSignal.timeout(30000), redirect: 'error',
  });
  if (response.status !== 200) throw Error(`GitHub ${response.status}: ${route}; existing credits retained`);
  return response.json();
}
const check = process.argv.includes('--check');
if (!check) {
  let finished = false;
  for (let page = 1; page <= 100; page++) {
    const rows = await api(`repos/${repository}/contributors?per_page=100&page=${page}`);
    if (!Array.isArray(rows) || (page === 1 && !rows.length)) throw Error('Contributor list unavailable; existing credits retained');
    for (const row of rows) if (row.type === 'User') remember(row);
    if (rows.length < 100) { finished = true; break; }
  }
  if (!finished) throw Error('Contributor pagination incomplete; existing credits retained');
  for (const login of manual) if (!entries.has(login.toLowerCase())) remember(await api(`users/${login}`));
}
for (const login of manual) if (!entries.has(login.toLowerCase())) throw Error(`Missing credited contributor: ${login}`);
// Keep the curated acknowledgement order first, then stable alphabetical order.
const rank = new Map(manual.map((login, i) => [login.toLowerCase(), i]));
const people = [...entries.values()].sort((a, b) =>
  (rank.get(a.login.toLowerCase()) ?? 10000) - (rank.get(b.login.toLowerCase()) ?? 10000) ||
  a.login.toLowerCase().localeCompare(b.login.toLowerCase(), 'en'));
const cells = people.map(p => `    <td align="center" width="120"><a href="https://github.com/${p.login}"><img src="https://avatars.githubusercontent.com/u/${p.id}?s=112" width="56" height="56" alt="${p.login}" /><br /><sub>${p.login}</sub></a></td>`);
const rows = [];
for (let i = 0; i < cells.length; i += 6) rows.push('  <tr>\n' + cells.slice(i, i + 6).join('\n') + '\n  </tr>');
const block = `${start}\n<table>\n${rows.join('\n')}\n</table>\n${end}`;
const writes = [[snapshot, JSON.stringify(people, null, 2) + '\n']];
for (const name of ['README.md', 'docs/README.en.md']) {
    const file = path.join(root, name), text = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  if (text.split(start).length !== 2 || text.split(end).length !== 2 || text.indexOf(end) < text.indexOf(start))
    throw Error(`Missing or duplicate contributor markers in ${name}`);
  writes.push([file, text.slice(0, text.indexOf(start)) + block + text.slice(text.indexOf(end) + end.length)]);
}
// Complete all requests and validation before modifying any file.
for (const [file, text] of writes) {
  if (check) { if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') !== text) throw Error(`Stale contributor block: ${file}`); }
  else if (!fs.existsSync(file) || fs.readFileSync(file, 'utf8') !== text) fs.writeFileSync(file, text);
}
console.log(`${check ? 'Verified' : 'Updated'} ${people.length} contributors across two READMEs`);
