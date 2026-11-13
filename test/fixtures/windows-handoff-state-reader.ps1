param([Parameter(Mandatory=$true)][string]$Helper)
$ErrorActionPreference = 'Stop'
# PowerShell 5.1 started by pwsh may inherit a module path without Get-FileHash.
function FixtureHash([string]$file) {
    $sha = [Security.Cryptography.SHA256]::Create()
    try { return [BitConverter]::ToString($sha.ComputeHash([IO.File]::ReadAllBytes($file))).Replace('-', '') }
    finally { $sha.Dispose() }
}
$root = Join-Path $env:TEMP ('purge-state-reader-' + [guid]::NewGuid())
$null = New-Item -ItemType Directory -Path (Join-Path $root 'app')
$asar = Join-Path $root 'app.asar'
$state = $asar + '.json'
$token = [guid]::NewGuid().ToString('N')
$starting = @{ token=$token; phase='starting' } | ConvertTo-Json -Compress
$process = $null
$stateReader = $null
$archiveReader = $null
try {
    [IO.File]::WriteAllText((Join-Path $root 'app/package.json'), '{}')
    [IO.File]::WriteAllText($asar, 'isolated archive fixture')
    $hash = (FixtureHash $asar)
    [IO.File]::WriteAllText($state, $starting)
    $stateReader = [IO.File]::Open($state, 'Open', 'Read', 'ReadWrite')
    $archiveReader = [IO.File]::Open($asar, 'Open', 'Read', 'ReadWrite')
    $argsText = '-NoProfile -File "' + $Helper + '" -ExePath "' + (Join-Path $root 'fixture.exe') + '" -AsarPath "' + $asar + '" -StatePath "' + $state + '" -Token ' + $token + ' -TimeoutSeconds 20 -PollMilliseconds 40'
    $process = Start-Process powershell.exe -ArgumentList $argsText -PassThru -WindowStyle Hidden
    $timer = [Diagnostics.Stopwatch]::StartNew()
    while (!(Test-Path -LiteralPath ($state + '.' + $token + '.tmp'))) {
        if ($process.HasExited -or $timer.Elapsed.TotalSeconds -gt 8) { throw 'Helper did not stage its first state' }
        Start-Sleep -Milliseconds 5
    }
    Start-Sleep -Milliseconds 250
    if ([IO.File]::ReadAllText($state) -ne $starting) { throw 'Previous state changed while locked' }
    $stateReader.Dispose()
    $stateReader = $null

    # Read on every iteration, including while the helper publishes status.
    # Missing files, malformed JSON, or a lost attempt token fail this test.
    $reads = 0
    $cycles = 0
    $previous = ''
    while ($cycles -lt 3) {
        # Match Node fs.readFileSync sharing: allow rename while this handle
        # continues to read the previously opened file.
        try {
            $stream = [IO.File]::Open($state, 'Open', 'Read', ([IO.FileShare]::ReadWrite -bor [IO.FileShare]::Delete))
        } catch {
            # ReplaceFile may briefly deny opening a new handle. No other
            # exception, missing file, or JSON parse failure is expected.
            if ($_.Exception.GetBaseException().HResult -ne -2147024864 -or $timer.Elapsed.TotalSeconds -gt 15) { throw }
            Start-Sleep -Milliseconds 5
            continue
        }
        try {
            $reader = [IO.StreamReader]::new($stream)
            try { $row = $reader.ReadToEnd() | ConvertFrom-Json }
            finally { $reader.Dispose() }
        } finally { $stream.Dispose() }
        $reads++
        if ($row.token -ne $token) { throw 'Lost attempt token' }
        if ($row.phase -eq 'waiting_for_unlock' -and $row.updated_at -ne $previous) {
            if ($row.error.win32_code -ne 32) { throw 'Unexpected archive error' }
            $cycles++
            $previous = $row.updated_at
        }
        if ($row.phase -eq 'failed' -or $process.HasExited -or $timer.Elapsed.TotalSeconds -gt 15) {
            throw ('Helper stopped or timed out while reading: ' + ($row | ConvertTo-Json -Compress))
        }
        Start-Sleep -Milliseconds 1
    }
    if ((FixtureHash $asar) -ne $hash) { throw 'Locked archive changed' }
    $archiveReader.Dispose()
    $archiveReader = $null
    if (!$process.WaitForExit(10000) -or $process.ExitCode -ne 0) { throw 'Helper did not finish' }
    $row = [IO.File]::ReadAllText($state) | ConvertFrom-Json
    $backup = $asar + '.purge-' + $token + '.bak'
    if ($row.phase -ne 'complete' -or $row.archive_sha256 -ne $hash -or (Test-Path -LiteralPath $asar) -or (FixtureHash $backup) -ne $hash) {
        throw 'Handoff did not preserve the archive'
    }
    [IO.File]::Move($backup, $asar)
    if ((FixtureHash $asar) -ne $hash) { throw 'Offline rollback did not restore original archive' }
    @{reads=$reads; lockCycles=$cycles; rollback=$true} | ConvertTo-Json -Compress
} finally {
    if ($stateReader) { $stateReader.Dispose() }
    if ($archiveReader) { $archiveReader.Dispose() }
    if ($process -and !$process.HasExited) { $process.Kill(); $process.WaitForExit() }
    Remove-Item -LiteralPath $root -Recurse -Force
}
