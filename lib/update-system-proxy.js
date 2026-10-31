// Read-only WinINET discovery. Never evaluate PAC or change the user's routing.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile);
const key='HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';
export function parseRegistryProxy(text) {
  // reg.exe uses the active console code page. Fall back to UTF-8 PowerShell
  // rather than corrupt non-ASCII proxy credentials or bypass rules.
  if(/[^\x00-\x7f]/.test(text) || !text.includes('HKEY_CURRENT_USER\\')) throw Error('registry encoding/layout');
  const value={};
  for(const line of text.split(/\r?\n/)) {
    const m=/^\s*(ProxyEnable|ProxyServer|ProxyOverride|AutoConfigURL)\s+(REG_\w+)\s*(.*?)\s*$/.exec(line);
    if(!m) continue;
    if(m[1]==='ProxyEnable') {
      if(m[2]!=='REG_DWORD' || !/^(0x[0-9a-f]+|\d+)$/i.test(m[3])) throw Error('registry type');
      value[m[1]]=Number(m[3]);
    } else {
      if(m[2]!=='REG_SZ') throw Error('registry type');
      value[m[1]]=m[3];
    }
  }
  return value;
}
export async function readWindowsProxy({signal,run=exec,root=process.env.SystemRoot || 'C:\\Windows'}={}) {
  const options={signal,windowsHide:true,maxBuffer:32768,encoding:'utf8'};
  try {
    const {stdout}=await run(root+'\\System32\\reg.exe',['query',key],{...options,timeout:2000});
    return parseRegistryProxy(stdout);
  } catch {
    if(signal?.aborted) throw Error('更新代理探测超时（HTTP 请求尚未发送）');
  }
  try {
    const script="$ErrorActionPreference='Stop';$env:PSModulePath=$PSHOME+'\\Modules';[Console]::OutputEncoding=[Text.UTF8Encoding]::new($false);$k='HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';if(Test-Path -LiteralPath $k){$p=Get-ItemProperty -LiteralPath $k -ErrorAction Stop;@{ProxyEnable=$p.ProxyEnable;ProxyServer=$p.ProxyServer;ProxyOverride=$p.ProxyOverride;AutoConfigURL=$p.AutoConfigURL}|ConvertTo-Json -Compress}else{'{}'}";
    const {stdout}=await run(root+'\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',['-NoProfile','-NonInteractive','-EncodedCommand',Buffer.from(script,'utf16le').toString('base64')],{...options,timeout:8000});
    const config=JSON.parse(stdout.replace(/^\uFEFF/,''));
    if(!config || typeof config!=='object' || Array.isArray(config)) throw Error('invalid config');
    return config;
  } catch(e) {
    const code=String(e.code || (e.killed?'TIMEOUT':'INVALID_RESULT')).replace(/[^A-Z0-9_]/g,'') || 'PROBE_FAILED';
    throw Error(`更新代理探测失败（${code}，HTTP 请求尚未发送）；请检查 Windows 代理读取权限或单独配置更新代理`);
  }
}
