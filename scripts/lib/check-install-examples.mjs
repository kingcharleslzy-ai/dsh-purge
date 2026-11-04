import { parseDocument } from 'yaml';

export const LEGACY_NOTICE = '<!-- legacy-standalone-config -->';
const legacyName = (name) => typeof name === 'string' && /^dsh-purge(?:\/|$)/.test(name);

// Inspect entry lists only: config.name and prompt text are not module imports.
function hasLegacyEntry(entries, visited = new Set()) {
  if (!Array.isArray(entries) || visited.has(entries)) return false;
  visited.add(entries);
  return entries.some(entry => entry && typeof entry === 'object' && (
    legacyName(entry.name) || hasLegacyEntry(entry.insert, visited) || hasLegacyEntry(entry.group, visited)
  ));
}

export function checkInstallExamples(markdown, { archive = false } = {}) {
  const lines = markdown.split(/\r?\n/);
  const problems = [];
  let previousFenceEnd = -1;
  let guardedExamples = 0;
  for (let i = 0; i < lines.length; i++) {
    const open = lines[i].match(/^ {0,3}(`{3,}|~{3,})\s*([^\s]*)[^\r\n]*$/);
    if (!open) continue;
    const start = i;
    const fence = open[1];
    const close = new RegExp(`^ {0,3}${fence[0]}{${fence.length},}\\s*$`);
    while (++i < lines.length && !close.test(lines[i])) { /* consume fenced content */ }
    if (!/^ya?ml$/i.test(open[2])) { previousFenceEnd = i; continue; }
    if (i === lines.length) { problems.push(`line ${start + 1}: unclosed YAML fence`); break; }
    const doc = parseDocument(lines.slice(start + 1, i).join('\n'), { uniqueKeys: true });
    if (doc.errors.length) {
      problems.push(`line ${start + 1}: invalid YAML example`);
      previousFenceEnd = i;
      continue;
    }
    // toJS has an alias limit; malformed/unbounded examples must not crash CI.
    let data;
    try { data = doc.toJS({ maxAliasCount: 100 }); }
    catch { problems.push(`line ${start + 1}: unsupported YAML aliases`); previousFenceEnd = i; continue; }
    if (hasLegacyEntry(data)) {
      if (!archive) problems.push(`line ${start + 1}: legacy standalone plugin entry in community instructions`);
      else {
        const before = lines.slice(previousFenceEnd + 1, start);
        const marker = before.lastIndexOf(LEGACY_NOTICE);
        const notice = before.slice(marker + 1).join('\n');
        // One local notice per example. A distant notice, heading or intervening
        // code fence cannot accidentally bless another installation example.
        if (marker < 0 || before.length - marker > 24 ||
            !/^> \[!WARNING\]\s*$/m.test(notice) || /^ {0,3}#{1,6}\s/m.test(notice))
          problems.push(`line ${start + 1}: legacy example requires an adjacent warning`);
        else guardedExamples++;
      }
    }
    previousFenceEnd = i;
  }
  if (archive && !guardedExamples) problems.push('archive must retain its warned historical YAML example');
  return problems;
}
