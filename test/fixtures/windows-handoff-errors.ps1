param([string]$Helper)
$ErrorActionPreference='Stop'; $ProgressPreference='SilentlyContinue'
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$root=Join-Path $env:TEMP ('purge118-'+[guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $root 'app') | Out-Null
[IO.File]::WriteAllText((Join-Path $root 'app/package.json'),'{}')
$results=@()
foreach($scenario in @('locked','collision')) {
 $asar=Join-Path $root ($scenario+'.asar'); $state=$asar+'.json'; $token=[guid]::NewGuid().ToString('N')
 [IO.File]::WriteAllText($asar,'original fixture')
 $backup=$asar+'.purge-'+$token+'.bak'
 if($scenario -eq 'collision'){[IO.File]::WriteAllText($backup,'existing backup')}
 $handle=$null; $p=$null
 try {
  if($scenario -eq 'locked'){$handle=[IO.File]::Open($asar,[IO.FileMode]::Open,[IO.FileAccess]::Read,[IO.FileShare]::ReadWrite)}
  $arg='-NoProfile -ExecutionPolicy Bypass -File "'+$Helper+'" -ExePath "'+(Join-Path $root 'no-host.exe')+'" -AsarPath "'+$asar+'" -StatePath "'+$state+'" -Token '+$token+' -TimeoutSeconds 15 -PollMilliseconds 100'
  $p=Start-Process powershell.exe -ArgumentList $arg -PassThru -WindowStyle Hidden
  $s=$null
  for($i=0;$i -lt 100;$i++) {Start-Sleep -Milliseconds 100;try{$s=Get-Content -LiteralPath $state -Raw -Encoding UTF8|ConvertFrom-Json}catch{};if($s.phase -in @('waiting_for_unlock','failed')){break}}
  $observed=$s
  if($handle){$handle.Dispose();$handle=$null}
  # 等的是状态机到终态，不是"进程退出"：助手在锁释放后才开始写备份和换包，
  # 只等 WaitForExit 会先读到还没生成的 .bak，报 FileNotFoundException。
  $exited=$p.WaitForExit(10000)
  for($i=0;$i -lt 100;$i++) {
    try{$s=Get-Content -LiteralPath $state -Raw -Encoding UTF8|ConvertFrom-Json}catch{$s=$null}
    if($s -and $s.phase -in @('complete','failed','expired','helper_stopped')){break}
    if($p.HasExited -and $s -and $s.phase -in @('complete','failed')){break}
    Start-Sleep -Milliseconds 100
  }
  $backupText=$null
  if(Test-Path -LiteralPath $backup){$backupText=[IO.File]::ReadAllText($backup)}
  $results+=@{scenario=$scenario;observed=$observed;final=$s;exitCode=$p.ExitCode;exited=[bool]$exited;originalExists=(Test-Path -LiteralPath $asar);backupExists=(Test-Path -LiteralPath $backup);backupText=$backupText}
 } finally {if($handle){$handle.Dispose()};if($p -and -not $p.HasExited){$p.Kill();$p.WaitForExit()}}
}
@{root=$root;results=$results}|ConvertTo-Json -Depth 8
