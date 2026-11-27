# Run only on a disposable test account. Do not reuse a user's installation.
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
$url = "https://download.deepseek.com/dsh-desk/bin/win-x64/deepseek-harness-$version-win-x64.exe"
curl.exe --fail --location --retry 2 --max-time 240 --output $installer $url
if ($LASTEXITCODE) { throw "Installer download failed: $LASTEXITCODE" }
$signature = Get-AuthenticodeSignature $installer
if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.GetNameInfo('SimpleName', $false) -ne 'Hangzhou DeepSeek Artificial Intelligence Co., Ltd.') { throw 'Installer signer mismatch' }
$install = Start-Process $installer -ArgumentList ("/S /D=" + $target) -Wait -PassThru
if ($install.ExitCode -ne 0 -or (Get-Item $exe).VersionInfo.FileVersion -ne $version) { throw 'Installation or version check failed' }
foreach ($name in 'app.asar','app','runtime','runtime/bin','runtime/cli/bin','runtime/primary-runtime/dependencies/pnpm/bin/pnpm.mjs') {
    $present = Test-Path -LiteralPath (Join-Path $target "resources/$name")
    Write-Output "rc.5 fresh install: resources/$name present=$present"
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
foreach ($mode in 'normal','updated') {
    $launch = @{ FilePath = $exe; PassThru = $true }
    if ($mode -eq 'updated') { $launch.ArgumentList = '--updated' }
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
