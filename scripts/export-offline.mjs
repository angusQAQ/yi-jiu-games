import {build} from 'esbuild';
import {zipSync} from 'fflate';
import {readFile, readdir, mkdir, writeFile} from 'node:fs/promises';
import {resolve, relative, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const out=resolve(process.argv[2]||resolve(root,'exports/yi-jiu-games-offline.html'));
const revision=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const mimeTypes={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.gif':'image/gif','.mp3':'audio/mpeg','.ttf':'font/ttf','.woff2':'font/woff2','.txt':'text/plain;charset=utf-8'};
const archive={},mime={},hashes={};
let sourceBytes=0;
async function collect(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.'))continue;
  const path=resolve(dir,entry.name);
  if(entry.isDirectory())await collect(path);
  else if(entry.isFile()){
   const key=relative(resolve(root,'dist'),path).replaceAll('\\','/');
   const bytes=await readFile(path),ext=extname(path).toLowerCase();
   archive[key]=[bytes,{level:['.ttf','.txt'].includes(ext)?6:0}];
   mime[key]=mimeTypes[ext]||'application/octet-stream';
   hashes[key]=createHash('sha256').update(bytes).digest('hex');
   sourceBytes+=bytes.length;
  }
 }
}
await collect(resolve(root,'dist/assets'));
const css=(await Promise.all(['style.css','dish-cards.css'].map(name=>readFile(resolve(root,'dist',name),'utf8')))).join('\n');
const bootstrap=String.raw`
import {unzipSync} from 'fflate';
import {assetKey,isAssetPath,offlineHTML,offlineCSS} from './scripts/offline-helpers.mjs';
try{
 let node=document.getElementById('offline-assets');
 let encoded=node.textContent.trim();
 node.remove();node=null;
 let binary=atob(encoded);encoded=null;
 let packed=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)packed[i]=binary.charCodeAt(i);
 binary=null;
 const files=unzipSync(packed);packed=null;
 const types=${JSON.stringify(mime)},urls=new Map();
 function asset(path){
  const key=assetKey(path);
  if(urls.has(key))return urls.get(key);
  if(!Object.hasOwn(files,key))throw new Error('Missing offline asset: '+key);
  const url=URL.createObjectURL(new Blob([files[key]],{type:types[key]}));
  urls.set(key,url);delete files[key];return url;
 }
 function html(value){return offlineHTML(value,asset);}
 const inner=Object.getOwnPropertyDescriptor(Element.prototype,'innerHTML');
 Object.defineProperty(Element.prototype,'innerHTML',{...inner,set(value){inner.set.call(this,html(value));}});
 const insert=Element.prototype.insertAdjacentHTML;
 Element.prototype.insertAdjacentHTML=function(position,value){return insert.call(this,position,html(value));};
 const media=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'src');
 Object.defineProperty(HTMLMediaElement.prototype,'src',{...media,set(value){media.set.call(this,isAssetPath(value)?asset(value):value);}});
 const styles=document.createElement('style');
 styles.textContent=offlineCSS(${JSON.stringify(css)},asset);
 document.head.append(styles);
 import('./dist/app.js').catch(failed);
}catch(error){failed(error);}
function failed(error){console.error(error);document.getElementById('app').textContent='離線版未能載入，請重新下載完整 HTML 檔。';}
`;
const bundled=await build({stdin:{contents:bootstrap,resolveDir:root,sourcefile:'offline-bootstrap.js'},bundle:true,write:false,platform:'browser',format:'iife',target:['chrome100','edge100','safari16'],charset:'utf8',minify:true,legalComments:'none',plugins:[{name:'local-module-versions',setup(api){api.onResolve({filter:/^\.\/.*\?v=/},args=>({path:resolve(args.resolveDir,args.path.split('?')[0])}));}}]});
const script=bundled.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
const packed=zipSync(archive,{level:6});
const metadata={version:1,revision,createdAt:new Date().toISOString(),assetCount:Object.keys(archive).length,sourceBytes,packedBytes:packed.length,hashes};
const html=`<!doctype html>\n<html lang="zh-HK"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5"><title>中文句式小遊戲・離線完整版</title><link rel="icon" href="data:,"><style>body{margin:0;background:#eaf5ec;color:#244958;font-family:serif}#offline-loading{padding:48px;text-align:center;font-size:32px;font-weight:bold}</style></head><body><div id="app"><p id="offline-loading">正在載入遊戲……</p></div><div id="modal-root"></div><div id="live" class="sr-only" aria-live="polite"></div><noscript>請開啟 JavaScript，開始遊戲。</noscript><script type="application/json" id="offline-build">${JSON.stringify(metadata)}</script><script type="application/octet-stream" id="offline-assets">${Buffer.from(packed).toString('base64')}</script><script id="offline-code">${script}</script></body></html>\n`;
await mkdir(dirname(out),{recursive:true});
await writeFile(out,html);
await writeFile(out+'.json',JSON.stringify({...metadata,output:out,htmlBytes:Buffer.byteLength(html)},null,2));
console.log(JSON.stringify({output:out,assets:metadata.assetCount,sizeMiB:(Buffer.byteLength(html)/1048576).toFixed(1),revision},null,2));
