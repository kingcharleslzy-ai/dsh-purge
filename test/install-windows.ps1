# Run on Windows with both Windows PowerShell 5.1 and PowerShell 7.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$target = Join-Path $root 'scripts\install.ps1'
$temporary = Join-Path ([IO.Path]::GetTempPath()) ('purge-wrapper-' + [guid]::NewGuid().ToString('N'))
$fixtureHome = Join-Path $temporary ('space ' + [char]0x4e2d + [char]0x6587)
$node = (Get-Command node -ErrorAction Stop).Source
[void](New-Item -ItemType Directory -Path $fixtureHome -Force)
$initialHome = $env:DSH_HOME
$initialElectron = $env:ELECTRON_RUN_AS_NODE
$initialPath = $env:PATH
$initialProtocol = [Net.ServicePointManager]::SecurityProtocol
function Assert([bool]$condition, [string]$message) { if (-not $condition) { throw $message } }
$global:purgeFixtureDownloadFail = $false
$global:purgeFixtureExitCode = 0
function Invoke-WebRequest {
    param([switch]$UseBasicParsing, $TimeoutSec, $Uri, $OutFile)
    if ($global:purgeFixtureDownloadFail) { throw 'fixture download unavailable' }
    $javascript = 'import fs from "node:fs";fs.writeFileSync(process.env.DSH_HOME+"/called.json",JSON.stringify({args:process.argv.slice(2),electron:process.env.ELECTRON_RUN_AS_NODE}));process.exit(' + $global:purgeFixtureExitCode + ');'
    [IO.File]::WriteAllText($OutFile, $javascript)
}
$compiler = Join-Path $env:SystemRoot 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$gui = Join-Path $temporary 'gui-fixture.exe'
$source = Join-Path $temporary 'gui-fixture.cs'
$code = @'
using System;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading;
class Fixture {
    static string Json(string value) { return "\"" + (value ?? "").Replace("\\", "\\\\").Replace("\"", "\\\"") + "\""; }
    static int Main(string[] args) {
        Thread.Sleep(600);
        if (args.Length == 0 || !File.Exists(args[0])) return 29;
        string javascript = File.ReadAllText(args[0]);
        string payload = "{\"args\":[" + String.Join(",", args.Skip(1).Select(Json)) + "],\"electron\":" + Json(Environment.GetEnvironmentVariable("ELECTRON_RUN_AS_NODE")) + "}";
        File.WriteAllText(Path.Combine(Environment.GetEnvironmentVariable("DSH_HOME"), "called.json"), payload);
        Console.WriteLine("GUI-subsystem fixture finished");
        Match match = Regex.Match(javascript, @"process.exit\((\d+)\)");
        return match.Success ? Int32.Parse(match.Groups[1].Value) : 0;
    }
}
'@
[IO.File]::WriteAllText($source, $code)
& $compiler /nologo /target:winexe "/out:$gui" $source
if ($LASTEXITCODE -ne 0) { throw 'GUI fixture build failed' }
try {
    $env:DSH_HOME = 'original-home'
    $env:ELECTRON_RUN_AS_NODE = 'original-electron'
    & $target -DshExe $node -DshHome $fixtureHome -Profile web -Version 1.6.8 -DryRun -AcceptBackupFailure ('a' * 64)
    $called = Get-Content -LiteralPath (Join-Path $fixtureHome 'called.json') -Raw | ConvertFrom-Json
    Assert ($called.args -contains '--profile=web') 'profile was lost'
    Assert ($called.args -contains '--version=1.6.8') 'version was lost'
    Assert ($called.args -contains '--dry-run') 'dry-run was lost'
    Assert ($called.args -contains ('--accept-backup-failure=' + ('a' * 64))) 'backup consent was lost'
    Assert ($called.electron -eq '1') 'runtime mode not set'
    Assert ($env:DSH_HOME -eq 'original-home') 'home not restored'
    Assert ($env:ELECTRON_RUN_AS_NODE -eq 'original-electron') 'electron env not restored'
    # A true GUI-subsystem process deliberately starts reading the file late.
    # The old call-operator wrapper deleted it early and falsely returned success.
    Remove-Item -LiteralPath (Join-Path $fixtureHome 'called.json') -Force
    & $target -DshExe $gui -DshHome $fixtureHome -Profile web -Version 1.6.8 -DryRun -AcceptBackupFailure ('a' * 64)
    Assert (Test-Path -LiteralPath (Join-Path $fixtureHome 'called.json')) 'GUI process returned before reading bootstrap'
    $guiCalled = Get-Content -LiteralPath (Join-Path $fixtureHome 'called.json') -Raw | ConvertFrom-Json
    Assert ($guiCalled.args -contains '--dry-run') 'GUI arguments lost'
    Assert ($guiCalled.args -contains ('--accept-backup-failure=' + ('a' * 64))) 'GUI backup consent was lost'
    $global:purgeFixtureExitCode = 17
    $failed = $false
    try { & $target -DshExe $node -DshHome $fixtureHome } catch { $failed = $true }
    Assert $failed 'nonzero process exit was ignored'
    $failed = $false
    try { & $target -DshExe $gui -DshHome $fixtureHome } catch { $failed = $true }
    Assert $failed 'GUI nonzero exit was ignored'
    Assert ($env:DSH_HOME -eq 'original-home') 'failure changed home'
    $global:purgeFixtureDownloadFail = $true
    $failed = $false
    try { & $target -DshExe $node -DshHome $fixtureHome } catch { $failed = $true }
    Assert $failed 'download failure was ignored'
    Assert ($env:ELECTRON_RUN_AS_NODE -eq 'original-electron') 'download failure changed env'
    $failed = $false
    try { & $target -DshExe (Join-Path $temporary 'missing.exe') } catch { $failed = $true }
    Assert $failed 'missing executable was accepted'
    Assert ($env:PATH -eq $initialPath) 'global PATH was changed'
    Write-Host 'Windows wrapper: arguments, Unicode/space paths, exit status, download failure, env/PATH preservation passed.'
    $global:LASTEXITCODE = 0
} finally {
    $env:DSH_HOME = $initialHome
    $env:ELECTRON_RUN_AS_NODE = $initialElectron
    [Net.ServicePointManager]::SecurityProtocol = $initialProtocol
    Remove-Item -LiteralPath $temporary -Recurse -Force
}
