/**
 * Extract lib/redteam/client.js into an embeddable factory fragment,
 * and write it between the DSH_PURGE_DRILL markers in client.js.
 *
 * Usage: node scripts/build-client.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const drillSrc = join(root, "lib", "redteam", "client.js");
const clientPath = join(root, "client.js");

const BEGIN = "/* __DSH_PURGE_DRILL_BEGIN__ */";
const END = "/* __DSH_PURGE_DRILL_END__ */";

let raw = readFileSync(drillSrc, "utf8").replace(/\r\n/g, "\n");
const startMark = "factory: (require) => {";
const start = raw.indexOf(startMark);
if (start < 0) throw new Error("cannot find ModuleLoader factory in drill client");
const endMark = "\n    return module.exports\n  },\n})";
const end = raw.lastIndexOf(endMark);
if (end < 0) throw new Error("cannot find factory end in drill client");
let body = raw.slice(start + startMark.length, end);

// Remove trailing exports (return is already outside endMark)
body = body
	.replace(/\n\s*exports\.apply\s*=\s*apply\s*\n/, "\n")
	.replace(/\n\s*exports\.inject\s*=\s*inject\s*\n/, "\n");

// Replace apply(ctx): no longer register slots itself, only export Panel / CSS / state
const applyAt = body.lastIndexOf("function apply(ctx) {");
if (applyAt < 0) throw new Error("apply(ctx) not found in drill client");
// apply() body has no nested function braces that conflict with CSS (CSS comes first), so brace depth is sufficient
let d = 0;
let j = body.indexOf("{", applyAt);
for (; j < body.length; j += 1) {
	const ch = body[j];
	if (ch === "{") d += 1;
	else if (ch === "}") {
		d -= 1;
		if (d === 0) {
			j += 1;
			break;
		}
	}
}
const applyParts = `function applyDrillParts() {
      return { CSS: CSS, Panel: Panel, setUI: setUI, useUI: useUI, isFullWindow: isFullWindow, setDockWidth: setDockWidth };
    }
`;
body = body.slice(0, applyAt) + applyParts + body.slice(j);

const fragment = `${BEGIN}
		// Embedded drill console (source in lib/redteam, merged into this plugin)
		const __dshPurgeDrill = (() => {
			var module = { exports: {} };
			var exports = module.exports;
${body}
			return applyDrillParts();
		})();
${END}`;

let client = readFileSync(clientPath, "utf8");
if (!client.includes(BEGIN) || !client.includes(END)) {
	throw new Error("client.js missing drill markers; run patch-client-dock.mjs first");
}
const beginAt = client.indexOf(BEGIN);
const endAt = client.indexOf(END);
if (beginAt < 0 || endAt < 0 || endAt < beginAt) throw new Error("drill markers out of order");
client = client.slice(0, beginAt) + fragment + client.slice(endAt + END.length);
writeFileSync(clientPath, client);
console.log("embedded drill client into client.js (" + Buffer.byteLength(fragment) + " bytes fragment)");
