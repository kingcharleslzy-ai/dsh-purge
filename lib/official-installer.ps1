$ErrorActionPreference = 'Stop'
# A desktop launched from pwsh can inherit PowerShell 7 module paths. Load the
# system modules belonging to this Windows PowerShell process.
$env:PSModulePath = Join-Path $PSHOME 'Modules'
$log = $env:DSH_UPDATE_LOG
$exe = $env:DSH_UPDATE_EXE
$installer = $env:DSH_UPDATE_FILE
$expected = $env:DSH_UPDATE_VERSION
$installerCode = $null
function Write-State($phase, $detail) {
    $row = [ordered]@{ time = [DateTime]::UtcNow.ToString('o'); phase = $phase; expected = $expected; installerCode = $installerCode; detail = $detail }
    [IO.File]::AppendAllText($log, (($row | ConvertTo-Json -Compress) + [Environment]::NewLine))
}
$stream = $null
try {
    $parent = [Diagnostics.Process]::GetProcessById([int]$env:DSH_UPDATE_PARENT)
    $stream = [IO.File]::Open($installer, 'Open', 'Read', 'Read')
    $hash = [Security.Cryptography.SHA512]::Create()
    try { $actual = [Convert]::ToBase64String($hash.ComputeHash($stream)) } finally { $hash.Dispose() }
    if ($actual -cne $env:DSH_UPDATE_HASH) { throw 'SHA512 mismatch' }
    $signature = Get-AuthenticodeSignature -LiteralPath $installer
    if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.GetNameInfo('SimpleName', $false) -ne 'Hangzhou DeepSeek Artificial Intelligence Co., Ltd.') {
        throw "Invalid official installer signature: $($signature.Status)"
    }
    Write-State 'waiting-for-exit' $null
    if (-not $parent.WaitForExit(600000)) { throw 'Desktop did not exit within ten minutes; installer was not launched' }
    if (-not [IO.File]::Exists($log + '.confirmed')) { throw 'The host did not acknowledge this handoff; installer was not launched' }
    $env:ELECTRON_RUN_AS_NODE = $null
    $target = [IO.Path]::GetDirectoryName($exe)
    Write-State 'installing' $null
    $run = Start-Process -FilePath $installer -ArgumentList ("--updated /S /D=" + $target) -WorkingDirectory $env:TEMP -PassThru -Wait
    $installerCode = $run.ExitCode
    if ($installerCode -ne 0) { throw "Official installer exited with code $installerCode" }
    $version = (Get-Item -LiteralPath $exe).VersionInfo.FileVersion
    if ($version -cne $expected) { throw "Expected $expected, found $version after install" }
    Write-State 'installed' $version
} catch {
    Write-State 'failed' $_.Exception.Message
    exit 1
} finally {
    if ($null -ne $stream) { $stream.Dispose() }
}
