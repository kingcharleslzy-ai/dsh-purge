# Run only on a disposable test account. Do not reuse a user's installation.
param([switch]$Upgrade)
$ErrorActionPreference = 'Stop'
if ($env:RUNNER_ENVIRONMENT -ne 'github-hosted' -or $env:RUNNER_OS -ne 'Windows') {
    throw 'Requires a GitHub-hosted Windows runner'
}
$root = Join-Path $env:RUNNER_TEMP ('desktop-baseline-' + [guid]::NewGuid())
New-Item $root -ItemType Directory | Out-Null
$installer = Join-Path $root 'installer.exe'
$target = Join-Path $root 'DSH'
$exe = Join-Path $target 'DeepSeek Harness.exe'
$version = '0.2.2-rc.5'
function Install-Official([string]$release) {
    $url = "https://download.deepseek.com/dsh-desk/bin/win-x64/deepseek-harness-$release-win-x64.exe"
    & curl.exe --fail --location --retry 2 --max-time 240 --output $installer $url
    if ($LASTEXITCODE) { throw "Installer download failed: $LASTEXITCODE" }
    $signature = Get-AuthenticodeSignature $installer
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.GetNameInfo('SimpleName', $false) -ne 'Hangzhou DeepSeek Artificial Intelligence Co., Ltd.') { throw 'Installer signer mismatch' }
    $install = Start-Process $installer -ArgumentList ("/S /D=" + $target) -Wait -PassThru
    if ($install.ExitCode -ne 0 -or (Get-Item $exe).VersionInfo.FileVersion -ne $release) { throw 'Installation or version check failed' }
}
if ($Upgrade) { Install-Official '0.2.2-rc.3' }
Install-Official $version
foreach ($name in 'app.asar','app','runtime','runtime/bin','runtime/cli/bin','runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs') {
    $present = Test-Path -LiteralPath (Join-Path $target "resources/$name")
    Write-Output "rc.5 inventory: resources/$name present=$present"
    if (!$present -and $name -ne 'app') { throw "Required stock installation entry missing: $name" }
}

# Compare a normal launch with the flag in #286. Leave the vendor archive sealed.
$env:DSH_HOME = Join-Path $root 'profile'
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public static class WindowProbe {
    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr handle);
}
'@
function Test-Window([string]$mode, [switch]$Updated) {
    $launch = @{ FilePath = $exe; PassThru = $true }
    if ($Updated) { $launch.ArgumentList = '--updated' }
    $p = Start-Process @launch
    $deadline = [DateTime]::UtcNow.AddSeconds(90)
    $visibleSamples = 0
    do {
        Start-Sleep -Milliseconds 500
        $p.Refresh()
        if ($p.HasExited) { throw "$mode exited before the window check: $($p.ExitCode)" }
        $hwnd = $p.MainWindowHandle
        if ($hwnd -ne [IntPtr]::Zero -and [WindowProbe]::IsWindowVisible($hwnd) -and $p.MainWindowTitle -like '*DeepSeek Harness*') {
            $visibleSamples++
        } else { $visibleSamples = 0 }
    } while ($visibleSamples -lt 4 -and [DateTime]::UtcNow -lt $deadline)
    if ($visibleSamples -lt 4) { throw "$mode has no stable visible DSH window (last handle $hwnd)" }
    Write-Output "$mode visible window: pid=$($p.Id) hwnd=$hwnd title=$($p.MainWindowTitle)"
    # On the disposable runner isolate the second launch from tray/single-instance reuse.
    taskkill.exe /T /F /PID $p.Id | Out-Null
    if ($LASTEXITCODE -or !$p.WaitForExit(15000)) { throw "Unable to end the $mode test process" }
}

Test-Window 'sealed-normal'
Test-Window 'sealed-updated' -Updated

# Use only the original vendor bytes. This isolates layout from all plugin hooks.
$resources = Join-Path $target 'resources'
$archive = Join-Path $resources 'app.asar'
$backup = "$archive.qa-backup"
$previousHash = (Get-FileHash $archive).Hash
$stage = Join-Path $root 'stage.mjs'
@'
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const [source, resources] = process.argv.slice(2);
const { extractAsarToSide, overlayAsarUnpacked, verifyStagedAsar, commitExtractedDir } = await import(pathToFileURL(source));
const archive = path.join(resources, 'app.asar');
const dest = path.join(resources, 'app');
const { next } = extractAsarToSide(archive, dest);
overlayAsarUnpacked(archive, next);
verifyStagedAsar(archive, next);
commitExtractedDir(dest, next);
'@ | Set-Content -LiteralPath $stage -Encoding utf8
& node $stage (Resolve-Path lib/extract-asar.js).Path $resources
if ($LASTEXITCODE) { throw 'Archive staging or verification failed' }
# Reproduce the reported empty directory against the real installation, before
# changing the archive. Restore the complete signed-installer runtime in finally.
$runtime = Join-Path $resources 'runtime'
$savedRuntime = Join-Path $root 'saved-runtime'
Move-Item -LiteralPath $runtime -Destination $savedRuntime
try {
    New-Item -ItemType Directory -Path $runtime | Out-Null
    & node --input-type=module -e "import {ensureAppRuntimeLink} from './lib/runtime-layout.js'; import assert from 'node:assert/strict'; const r=ensureAppRuntimeLink(process.argv[1]); assert.equal(r.ok,false); assert.equal(r.inventory,'empty'); console.log(r.error);" $resources
    if ($LASTEXITCODE -or (Get-FileHash $archive).Hash -ne $previousHash) { throw 'Empty runtime did not fail cleanly' }
} finally {
    # Non-recursive delete also asserts that the check did not populate the directory.
    [IO.Directory]::Delete($runtime)
    Move-Item -LiteralPath $savedRuntime -Destination $runtime
}
Move-Item -LiteralPath $archive -Destination $backup
try {
    Test-Window 'unpacked-updated' -Updated
} finally {
    Move-Item -LiteralPath (Join-Path $resources 'app') -Destination (Join-Path $root 'tested-app')
    Move-Item -LiteralPath $backup -Destination $archive
    if ((Get-FileHash $archive).Hash -ne $previousHash) { throw 'Rollback archive checksum mismatch' }
    Test-Window 'rollback-normal'
}
