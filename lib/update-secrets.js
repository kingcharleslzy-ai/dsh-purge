// Credential files are distinct from non-secret update preferences. No plaintext
// is passed in command arguments, environment variables or diagnostic output.
import fs from 'node:fs';
import path from 'node:path';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const secured=new Map();
const signature=s=>[s.dev,s.ino,s.size,s.mtimeMs,s.ctimeMs].join(':');
function regular(file) {
  const stat=fs.lstatSync(file);
  if(!stat.isFile() || stat.isSymbolicLink()) throw Error('更新密钥文件不是普通文件，未读取或覆盖');
  return stat;
}
const script=String.raw`
$ErrorActionPreference='Stop'
# A pwsh 7 parent can export incompatible modules to Windows PowerShell 5.1.
# This helper only needs trusted built-in modules, scoped to this child process.
$env:PSModulePath=$PSHOME+'\Modules'
$ProgressPreference='SilentlyContinue'
[Console]::InputEncoding=[Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false)
$stage='input'
try {
  $p=[Console]::In.ReadToEnd()|ConvertFrom-Json
  $sid=[Security.Principal.WindowsIdentity]::GetCurrent().User
  $allowed=@($sid.Value,'S-1-5-18','S-1-5-32-544')|Select-Object -Unique
  function CheckPath($name,$directory) {
    if(Test-Path -LiteralPath $name) {
      $item=Get-Item -LiteralPath $name -Force
      if(($item.Attributes -band [IO.FileAttributes]::ReparsePoint) -ne 0 -or $item.PSIsContainer -ne $directory){throw 'unsupported target'}
    }
  }
  function NewAcl($directory) {
    if($directory){$acl=[Security.AccessControl.DirectorySecurity]::new()}else{$acl=[Security.AccessControl.FileSecurity]::new()}
    $acl.SetAccessRuleProtection($true,$false)
    $acl.SetOwner($sid)
    foreach($id in $allowed) {
      $identity=[Security.Principal.SecurityIdentifier]::new($id)
      $rule=[Security.AccessControl.FileSystemAccessRule]::new($identity,[Security.AccessControl.FileSystemRights]::FullControl,[Security.AccessControl.AccessControlType]::Allow)
      $acl.AddAccessRule($rule)
    }
    return $acl
  }
  function VerifyAcl($name) {
    $acl=Get-Acl -LiteralPath $name
    if(!$acl.AreAccessRulesProtected){throw 'inheritance enabled'}
    $rules=$acl.GetAccessRules($true,$true,[Security.Principal.SecurityIdentifier])
    foreach($r in $rules){if($r.IsInherited -or $r.AccessControlType -ne 'Allow' -or $r.IdentityReference.Value -notin $allowed){throw 'unexpected permission'}}
    if(!($rules|Where-Object {$_.IdentityReference.Value -eq $sid.Value -and ($_.FileSystemRights -band [Security.AccessControl.FileSystemRights]::FullControl) -eq [Security.AccessControl.FileSystemRights]::FullControl})){throw 'owner access missing'}
  }
  $stage='validate'
  CheckPath ([IO.Path]::GetDirectoryName($p.file)) $true
  CheckPath $p.file $false
  if($p.operation -eq 'protect') {
    $owner=(Get-Acl -LiteralPath $p.file).GetOwner([Security.Principal.SecurityIdentifier]).Value
    if($owner -notin $allowed){throw 'unexpected owner'}
    $stage='protect-existing'
    [IO.File]::SetAccessControl($p.file,(NewAcl $false))
    VerifyAcl $p.file
  } elseif($p.operation -eq 'write') {
    $stage='create-private-directory'
    if(Test-Path -LiteralPath $p.stage){throw 'staging collision'}
    [void][IO.Directory]::CreateDirectory($p.stage,(NewAcl $true))
    VerifyAcl $p.stage
    $stage='create-private-file'
    $temp=[IO.Path]::Combine($p.stage,'channel.json')
    $stream=[IO.File]::Create($temp,4096,[IO.FileOptions]::None,(NewAcl $false))
    try {
      VerifyAcl $temp
      $stage='write'
      $bytes=[Text.UTF8Encoding]::new($false).GetBytes($p.content)
      $stream.Write($bytes,0,$bytes.Length)
      $stream.Flush($true)
    } finally {$stream.Dispose()}
  } else {throw 'unknown operation'}
  [Console]::Out.Write('{"ok":true}')
} catch {
  # Never serialize the exception: it may include input or credentials.
  $reason=''
  if($_.Exception.Message -in @('inheritance enabled','unexpected permission','owner access missing','staging collision','unexpected owner','unsupported target')){$reason=$_.Exception.Message}
  $cause=$_.Exception
  while($cause.InnerException){$cause=$cause.InnerException}
  [Console]::Out.Write((@{ok=$false;stage=$stage;code=$cause.HResult;reason=$reason}|ConvertTo-Json -Compress))
  exit 1
}
`;
function windows(payload) {
  const exe=path.join(process.env.SystemRoot || 'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe');
  let output;
  try {
    output=execFileSync(exe,['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{
      input:JSON.stringify(payload),encoding:'utf8',windowsHide:true,timeout:20000,maxBuffer:32768,
    });
  } catch(e) {
    let result;try{result=JSON.parse(String(e.stdout).replace(/^\uFEFF/,''));}catch{}
    const stage=String(result?.stage || 'helper').replace(/[^a-z-]/g,'');
    const code=String(result?.code ?? e.code ?? 'FAILED').replace(/[^A-Z0-9_-]/g,'');
    const reason=String(result?.reason || '').replace(/[^a-z ]/g,'');
    throw Error(`Windows 更新密钥文件保护失败（${stage}: ${code}${reason?', '+reason:''}）；未写入新密钥，请检查文件权限或安全软件记录`);
  }
  if(JSON.parse(output.replace(/^\uFEFF/,'')).ok!==true) throw Error('Windows 更新密钥文件保护结果无效');
}
export function protectSecretFile(file) {
  let stat;try{stat=regular(file);}catch(e){if(e.code==='ENOENT')return;throw e;}
  if(secured.get(file)===signature(stat)) return;
  if(process.platform==='win32') windows({operation:'protect',file});
  else fs.chmodSync(file,0o600);
  secured.set(file,signature(regular(file)));
}
export function writeSecretFile(file,content) {
  fs.mkdirSync(path.dirname(file),{recursive:true});
  const parent=fs.lstatSync(path.dirname(file));
  if(!parent.isDirectory() || parent.isSymbolicLink()) throw Error('更新密钥目录不是普通目录，未写入');
  try{regular(file);}catch(e){if(e.code!=='ENOENT')throw e;}
  const stage=path.join(path.dirname(file),'.update-channel-'+randomUUID());
  const temp=path.join(stage,'channel.json');
  let failure;
  try {
    if(process.platform==='win32') windows({operation:'write',file,stage,content});
    else {fs.mkdirSync(stage,{mode:0o700});fs.writeFileSync(temp,content,{mode:0o600,flag:'wx'});}
    // rename preserves the new protected DACL, unlike File.Replace which can
    // merge destination metadata. The original file survives a failed rename.
    fs.renameSync(temp,file);
    secured.set(file,signature(regular(file)));
  } catch(e) {failure=e;throw e;} finally {
    // Only remove our exact staging file/directory, never a recursive target.
    const cleanup=[];
    try{fs.unlinkSync(temp);}catch(e){if(e.code!=='ENOENT')cleanup.push(e.code || 'UNLINK_FAILED');}
    try{fs.rmdirSync(stage);}catch(e){if(e.code!=='ENOENT')cleanup.push(e.code || 'RMDIR_FAILED');}
    if(cleanup.length) throw Error(`${failure?failure.message+'；':''}更新密钥暂存清理失败（${cleanup.join(',')}），请检查权限或安全软件记录`);
  }
}
