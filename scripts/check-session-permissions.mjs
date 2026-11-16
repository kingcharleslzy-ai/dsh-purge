// Copy this probe next to node_modules in the isolated DSH host under test.
// Place the fixture outside OS temp (the host grants separate temp access).
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Context, Service } from "@deepseek-ai/cordis";
import { SandboxedFileSystem } from "@deepseek-ai/dsh-fs-sandbox";
import { LocalSandboxProvider } from "@deepseek-ai/dsh-sandbox-local";

const fixture = path.dirname(fileURLToPath(import.meta.url));
assert(fs.existsSync(path.join(fixture, "node_modules", "@deepseek-ai", "dsh-sandbox-local")));
const root = fs.mkdtempSync(path.join(fixture, "permission-check-"));
const workspace = path.join(root, "workspace");
const sibling = path.join(root, "sibling");
const ctx = new Context();

class TestPolicy extends Service {
  constructor(context) {
    super(context, "sandboxPolicy");
    this.defaultMode = "read-only";
  }
}

function writeCommand(file) {
  if (process.platform !== "win32") return ["/bin/sh", "-c", 'printf AFTER > "$1"', "probe", file];
  const script = `try {
    Set-Content -LiteralPath '${file.replaceAll("'", "''")}' -Value AFTER -NoNewline -ErrorAction Stop
  } catch [System.UnauthorizedAccessException] { Write-Output ACCESS_DENIED; exit 5 }
  catch { Write-Output $_.FullyQualifiedErrorId; exit 1 }`;
  const exe = path.join(process.env.SystemRoot, "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
  return [exe, "-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")];
}

try {
  fs.mkdirSync(workspace);
  fs.mkdirSync(sibling);
  await ctx.plugin(TestPolicy);
  await ctx.plugin(SandboxedFileSystem, { cwd: workspace, diffBasisMaxBytes: 65536 });
  await ctx.plugin(LocalSandboxProvider, { runnerCommand: [], runnerFailureSignatures: [], probeTimeoutMs: 15000 });
  const service = ctx.get("fs");
  for (const mode of ["read-only", "workspace-write"]) {
    const policy = { mode, workspaceRoot: workspace, sessionId: "permission-check" };
    for (const dir of [workspace, sibling]) {
      const allowed = mode === "workspace-write" && dir === workspace;
      const file = path.join(dir, "canary");
      fs.writeFileSync(file, "BEFORE");
      const destination = await service.resolve(file);
      const attempt = service.writeText(destination, "AFTER", undefined, undefined, policy);
      if (allowed) await attempt;
      else await assert.rejects(attempt, { code: "FS_SANDBOX_DENIED" });
      assert.equal(fs.readFileSync(file, "utf8"), allowed ? "AFTER" : "BEFORE");

      fs.writeFileSync(file, "BEFORE");
      const { argv } = await ctx.get("sandbox").confine(writeCommand(file), policy);
      const result = spawnSync(argv[0], argv.slice(1), { cwd: workspace, encoding: "utf8", timeout: 30000 });
      assert.ifError(result.error);
      assert.equal(result.status === 0, allowed, result.stderr + result.stdout);
      if (!allowed) assert.match(result.stderr + result.stdout, /denied|permitted|拒绝/i);
      assert.equal(fs.readFileSync(file, "utf8"), allowed ? "AFTER" : "BEFORE");
      console.log(mode, path.basename(dir), "filesystem + process", allowed ? "allowed" : "denied");
    }
  }
} finally {
  try { await ctx.fiber.dispose(); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}
