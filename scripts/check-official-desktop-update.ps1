# Destructive only to a disposable GitHub-hosted Windows runner, including its test account's installer registry.
$ErrorActionPreference = 'Stop'
if ($env:GITHUB_ACTIONS -ne 'true' -or $env:RUNNER_ENVIRONMENT -ne 'github-hosted' -or $env:RUNNER_OS -ne 'Windows') {
    throw 'This acceptance test requires a disposable GitHub-hosted Windows runner.'
}
$root = Join-Path $env:RUNNER_TEMP ("dsh official " + [Guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $root | Out-Null
$target = Join-Path $root 'Desktop'
$exe = Join-Path $target 'DeepSeek Harness.exe'
$hashes = @('830947F8996DC05D991CA9133FFF4D3400073E47B9CFA6507754867E79482B23','7E25286518CE520B5C0943E178C52CDBA1CC9EC3680BC7DA181B79879E080C32')
foreach ($rc in 1,2) {
    $name = "deepseek-harness-0.2.2-rc.$rc-win-x64.exe"
    $file = Join-Path $root "$rc.exe"
    curl.exe --fail --location --retry 2 --max-time 240 --output $file "https://download.deepseek.com/dsh-desk/bin/win-x64/$name"
    if ($LASTEXITCODE -or (Get-FileHash $file -Algorithm SHA256).Hash -ne $hashes[$rc-1]) { throw "Invalid download rc.$rc" }
    $sig = Get-AuthenticodeSignature $file
    if ($sig.Status -ne 'Valid' -or $sig.SignerCertificate.GetNameInfo('SimpleName',$false) -ne 'Hangzhou DeepSeek Artificial Intelligence Co., Ltd.') { throw "Unexpected signer rc.$rc" }
}
function Assert-Version($rc) {
    $found = (Get-Item -LiteralPath $exe).VersionInfo.FileVersion
    if ($found -ne "0.2.2-rc.$rc") { throw "Expected rc.$rc, found $found" }
}
$first = Start-Process (Join-Path $root '1.exe') -ArgumentList ("/S /D=" + $target) -Wait -PassThru
if ($first.ExitCode -ne 0) { throw "Initial install exited $($first.ExitCode)" }
Assert-Version 1
# Mirror the reported rc.1 disk layout using the unmodified contents of the vendor ASAR.
$layoutDriver = Join-Path $root 'legacy-layout.mjs'
@'
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const [source, resources] = process.argv.slice(2);
const {extractAsarToSide, overlayAsarUnpacked, verifyStagedAsar, commitExtractedDir} = await import(pathToFileURL(source));
const archive = path.join(resources,'app.asar'), dest=path.join(resources,'app');
const {next}=extractAsarToSide(archive,dest);
overlayAsarUnpacked(archive,next);
verifyStagedAsar(archive,next);
commitExtractedDir(dest,next);
fs.renameSync(archive, archive + '.purge-qa.bak');
'@ | Set-Content -LiteralPath $layoutDriver -Encoding utf8
& node $layoutDriver (Resolve-Path lib/extract-asar.js).Path (Join-Path $target 'resources')
if ($LASTEXITCODE) { throw "Legacy layout preparation failed: $LASTEXITCODE" }
$driver = (Resolve-Path scripts/drive-official-desktop-update.mjs).Path
function Invoke-Handoff($rc, $want) {
    $homeDir = Join-Path $root ([Guid]::NewGuid().ToString('N'))
    $env:ELECTRON_RUN_AS_NODE = '1'
    $argsList = @($driver, $homeDir, "$rc", (Join-Path $root "$rc.exe"))
    # Use the official Electron executable as the parent PID that the external worker waits for.
    & $exe @argsList | Out-Host
    if ($LASTEXITCODE -ne 0) { throw "Coordinator exited $LASTEXITCODE" }
    Remove-Item Env:ELECTRON_RUN_AS_NODE
    $limit = [DateTime]::UtcNow.AddMinutes(4)
    do {
        Start-Sleep -Milliseconds 500
        $last = Get-ChildItem -Path "$homeDir/logs/official-installer/update-*/result.jsonl" | ForEach-Object { Get-Content $_.FullName -Tail 1 | ConvertFrom-Json }
        if ($last.phase -in @('installed','failed')) { break }
    } while ([DateTime]::UtcNow -lt $limit)
    Write-Output ($last | ConvertTo-Json -Compress)
    if ($last.phase -ne $want) { throw "Expected $want, got $($last.phase)" }
}
$holdPath = Join-Path $target 'resources/app/package.json'
$hold = [IO.File]::Open($holdPath, 'Open', 'Read','Read')
try {
    Invoke-Handoff 2 'failed'
    Assert-Version 1
    if ((Get-Content $holdPath -Raw | ConvertFrom-Json).version -ne '0.2.2-rc.1' -or -not (Test-Path (Join-Path $target 'resources/app.asar.purge-qa.bak'))) { throw 'Previous layout was not restored' }
} finally { $hold.Dispose() }
Invoke-Handoff 2 'installed'
Assert-Version 2
Invoke-Handoff 1 'installed'
Assert-Version 1
