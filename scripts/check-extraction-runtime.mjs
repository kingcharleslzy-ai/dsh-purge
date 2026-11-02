// Read an explicit archive, extract to a fresh temporary directory, verify every
// packed file against the original byte range. Never writes the source install.
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {diskFs,extractAsarToSide} from '../lib/extract-asar.js';
import {removeTreeNoFollowSync} from '../lib/remove-tree.js';
const fs=diskFs(),archive=process.argv[2];assert(archive,'Explicit test archive required');
assert(process.versions.electron,'Run with isolated Electron in Node mode');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'purge-archive-acceptance-'));
try {
 const result=extractAsarToSide(archive,path.join(root,'app'));
 const fd=fs.openSync(archive,'r');let checked=0,bytes=0,links=0;
 try {
  const pre=Buffer.alloc(16);fs.readSync(fd,pre,0,16,0);
  const json=Buffer.alloc(pre.readUInt32LE(12));fs.readSync(fd,json,0,json.length,16);
  const start=8+pre.readUInt32LE(4);
  function walk(node,parts=[],unpacked=false){
   for(const [name,entry] of Object.entries(node.files||{})){
    const child=[...parts,name],skip=unpacked||entry.unpacked;
    if(entry.files){walk(entry,child,skip);continue;}
    if(skip)continue;
    const file=path.join(result.next,...child);
    if(entry.link){assert(fs.lstatSync(file).isSymbolicLink());links++;continue;}
    const buffer=Buffer.alloc(entry.size);assert.equal(fs.readSync(fd,buffer,0,buffer.length,start+Number(entry.offset)),buffer.length);
    const digest=x=>createHash('sha256').update(x).digest('hex');
    assert.equal(digest(fs.readFileSync(file)),digest(buffer),child.join('/'));
    if(process.platform!=='win32'&&entry.executable)assert(fs.statSync(file).mode&0o100);
    checked++;bytes+=buffer.length;
   }
  }walk(JSON.parse(json.toString()));assert.equal(checked,result.count);assert(checked>0);
 }finally{fs.closeSync(fd);}
 console.log(JSON.stringify({platform:process.platform,electron:process.versions.electron,packedFiles:checked,packedBytes:bytes,links,allBytesMatch:true,sourceReadOnly:true,restart:false}));
}finally{removeTreeNoFollowSync(root,{fs});}
