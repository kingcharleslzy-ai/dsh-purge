// The package icon is display-only, so nothing else fails when it is missing or
// oversized; the host silently keeps its default artwork. Pin the host rules
// (relative path inside the package, SVG/PNG/JPEG/WebP, at most 256 KiB) so a
// broken declaration fails here instead of degrading the plugin list.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));

const FORMATS = {
  ".svg": (bytes) => /<svg[\s>]/.test(bytes.toString("utf8")),
  ".png": (bytes) => bytes.subarray(1, 4).toString("latin1") === "PNG",
  ".jpg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8,
  ".jpeg": (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8,
  ".webp": (bytes) => bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP",
};

function declaredIcon() {
  const icon = manifest.icon ?? manifest.exports?.["./icon"];
  assert.equal(typeof icon, "string", "package.json is missing the icon field");
  return icon.default ?? icon;
}

test("the declared icon is a path inside the package", () => {
  const icon = declaredIcon();
  assert.ok(icon.startsWith("./"), `icon must be a relative path: ${icon}`);
  assert.ok(!icon.includes("\\"), `icon must use / separators: ${icon}`);
  const target = path.resolve(root, icon);
  const outside = path.relative(root, target);
  assert.ok(outside && !outside.startsWith("..") && !path.isAbsolute(outside), `icon escapes the package directory: ${icon}`);
  assert.ok(path.basename(target).includes("."), `icon must include an extension: ${icon}`);
});

test("the icon exists, decodes as a known image, and stays under 256 KiB", () => {
  const target = path.resolve(root, declaredIcon());
  const bytes = fs.readFileSync(target);
  assert.ok(bytes.length <= 256 * 1024, `icon exceeds 256 KiB: ${bytes.length} bytes`);
  const decode = FORMATS[path.extname(target).toLowerCase()];
  assert.ok(decode, `unsupported icon format: ${path.extname(target)}`);
  assert.ok(decode(bytes), `icon content is not a valid ${path.extname(target)}: ${path.basename(target)}`);
});

test("the icon ships with the package", () => {
  const relative = declaredIcon().replace(/^\.\//, "");
  assert.ok(
    manifest.files.some((entry) => entry === relative || entry === `*${path.extname(relative)}`),
    `files does not include ${relative}, so the published package will not ship the icon`,
  );
});

test("a documented detail document is packaged with the icon", () => {
  // Plugin Manager shows this document beside the icon; a declared path that is
  // not packed renders as a diagnostic instead of the page.
  for (const locale of ["en"]) {
    const file = path.join(root, "locale", `${locale}.json`);
    const detail = JSON.parse(fs.readFileSync(file, "utf8")).meta?.detail;
    if (!detail) continue;
    assert.ok(manifest.files.includes("locale"), `files does not include locale, so ${detail} cannot be found`);
    assert.ok(fs.existsSync(path.join(root, detail)), `${locale} declares a missing detail document: ${detail}`);
  }
});
