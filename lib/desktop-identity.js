// Bounded, read-only package evidence. Display names and the existence of an
// Electron archive are not evidence that an application is a DSH host.
import path from 'node:path';
import { nextIdentity } from "./next-host.js";
import { memoDesktopRead, clearDesktopReadScope } from './desktop-read-scope.js';
import {execFileSync} from 'node:child_process';
import {diskFs} from './extract-asar.js';
const fs=diskFs();
const HOST='@deepseek-ai/dsh-desktop-host';
const hostRoots=['dsh/node_modules/'+HOST,'node_modules/'+HOST];
const inside=(root,file)=>{const rel=path.relative(root,file);return rel!==''&&!rel.startsWith('..'+path.sep)&&rel!=='..'&&!path.isAbsolute(rel);};
const safeRelative=rel=>typeof rel==='string'&&rel.length>0&&!rel.includes('\\')&&!path.posix.isAbsolute(rel)&&!rel.split('/').some(p=>p==='..'||p==='');
function directoryReader(root) {
  const base=fs.realpathSync(root);
  const file=rel=>{
    if(!safeRelative(rel))throw Error('Invalid desktop package path');
    const p=fs.realpathSync(path.join(root,rel));
    if(!inside(base,p)||!fs.statSync(p).isFile())throw Error('Desktop package entry escapes its application');
    return p;
  };
  return {has(rel){try{return Boolean(file(rel));}catch{return false;}},json(rel){const p=file(rel);if(fs.statSync(p).size>65536)throw Error('Oversized desktop manifest');return JSON.parse(fs.readFileSync(p,'utf8'));}};
}
function archiveReader(archive,callback) {
  const fd=fs.openSync(archive,'r');
  try {
    const total=fs.fstatSync(fd).size,pre=Buffer.alloc(16);
    if(fs.readSync(fd,pre,0,16,0)!==16||pre.readUInt32LE(0)!==4)throw Error('Invalid desktop ASAR');
    const dataOffset=8+pre.readUInt32LE(4),size=pre.readUInt32LE(12);
    if(size<1||size>32*1024*1024||16+size>dataOffset||dataOffset>total)throw Error('Invalid desktop ASAR header');
    const buf=Buffer.alloc(size);if(fs.readSync(fd,buf,0,size,16)!==size)throw Error('Truncated desktop ASAR');
    const header=JSON.parse(buf.toString('utf8'));
    const entry=(rel,depth=0)=>{
      if(!safeRelative(rel)||depth>8)throw Error('Invalid desktop ASAR path');
      let node=header,parts=rel.split('/');
      for(let i=0;i<parts.length;i++) {
        node=node?.files?.[parts[i]];if(!node)throw Error('Missing desktop ASAR entry');
        if(node.link)return entry([node.link,...parts.slice(i+1)].join('/'),depth+1);
      }
      if(node.files||!Number.isSafeInteger(node.size)||node.size<0)throw Error('Invalid desktop ASAR entry');
      if(node.unpacked)return {node,rel};
      const offset=Number(node.offset);
      if(!Number.isSafeInteger(offset)||offset<0||dataOffset+offset+node.size>total)throw Error('Truncated desktop ASAR entry');
      return {node,rel,offset:dataOffset+offset};
    };
    const unpacked=()=>directoryReader(archive+'.unpacked');
    return callback({
      has(rel){try{const e=entry(rel);return e.node.unpacked?unpacked().has(e.rel):true;}catch{return false;}},
      json(rel){const e=entry(rel);if(e.node.size>65536)throw Error('Oversized desktop manifest');
        if(e.node.unpacked)return unpacked().json(e.rel);
        const bytes=Buffer.alloc(e.node.size);if(fs.readSync(fd,bytes,0,bytes.length,e.offset)!==bytes.length)throw Error('Truncated desktop manifest');
        return JSON.parse(bytes.toString('utf8'));
      }
    });
  } finally {fs.closeSync(fd);}
}
function identity(reader) {
  for(const root of hostRoots) {
    if(!reader.has(root+'/package.json'))continue;
    const meta=reader.json(root+'/package.json');
    if(meta.name===HOST&&reader.has(root+'/lib/cli.js'))return {kind:'bundled-host',package:meta.name};
  }
  // Legacy community desktop shells remain distinct from the bundled host path.
  if(reader.has('package.json')) {
    const meta=reader.json('package.json');
    if (safeRelative(meta.main) && reader.has(meta.main)) {
      if (["dsh-desktop", "dsh-plugin-desktop"].includes(meta.name)) return { kind: "community", package: meta.name };
      // NEXT 家族走独立模块判定：只看包证据，不看 exe 文件名
      const next = nextIdentity(meta);
      if (next) return next;
    }
  }
  return null;
}
export function clearDesktopIdentityCache(){clearDesktopReadScope();}
export function desktopIdentity(resources) {
  if(!resources)return null;
  return memoDesktopRead('identity',path.resolve(resources),()=>{
    // Do not fall through a damaged or unreadable preferred archive.
    const archive=path.join(resources,'app.asar');
    let sealed;
    try { fs.lstatSync(archive); sealed=true; }
    catch(error) { if(error.code!=='ENOENT'&&error.code!=='ENOTDIR')throw error; sealed=false; }
    if(sealed)return archiveReader(archive,identity);
    for(const layout of ['app','app.asar.unpacked']) {
      const root=path.join(resources,layout);
      try { fs.lstatSync(root); }
      catch(error) { if(error.code==='ENOENT'||error.code==='ENOTDIR')continue; throw error; }
      return identity(directoryReader(root));
    }
    return null;
  });
}
export function hasDesktopIdentity(resources,kind) {
  try {const found=desktopIdentity(resources);return Boolean(found&&(!kind||found.kind===kind));}catch{return false;}
}
export function bundleExecutable(bundle) {
  if(process.platform!=='darwin')throw Error('macOS bundle metadata requires macOS plutil');
  const root=fs.realpathSync(bundle),plist=path.join(root,'Contents/Info.plist');
  if(fs.lstatSync(plist).isSymbolicLink()||!inside(root,fs.realpathSync(plist)))throw Error('Bundle metadata escapes application');
  const name=execFileSync('/usr/bin/plutil',['-extract','CFBundleExecutable','raw','-expect','string','-o','-',plist],{encoding:'utf8',timeout:5000,maxBuffer:65536}).replace(/\n$/,'');
  if(!name||name==='.'||name==='..'||/[\\/\x00-\x1f\x7f]/.test(name))throw Error('Invalid CFBundleExecutable');
  const dir=path.join(root,'Contents/MacOS'),file=path.join(dir,name);
  if(fs.realpathSync(dir)!==dir||fs.lstatSync(file).isSymbolicLink()||!inside(dir,fs.realpathSync(file))||!fs.statSync(file).isFile())throw Error('Bundle executable escapes Contents/MacOS');
  fs.accessSync(file,fs.constants.X_OK);
  return file;
}
