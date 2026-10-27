import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {resolve,dirname,relative} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {Script} from 'node:vm';
import {unzipSync} from 'fflate';
import {assetKey,isAssetPath,offlineHTML,offlineCSS} from './offline-helpers.mjs';

const fakeAsset=path=>'blob:offline/'+assetKey(path);
assert.equal(assetKey('./assets/audio/v7-train-s-3.mp3?v=18'),'assets/audio/v7-train-s-3.mp3');
assert(isAssetPath('assets/audio/v7-train-s-3.mp3?v=18'));
assert(!isAssetPath('blob:offline/example'));
assert.equal(offlineHTML('<img src="assets/sushi.png"><image href="assets/island-lamp-16-v4.png"/><g clip-path="url(#scene)"></g>',fakeAsset),'<img src="blob:offline/assets/sushi.png"><image href="blob:offline/assets/island-lamp-16-v4.png"/><g clip-path="url(#scene)"></g>');
assert.equal(offlineHTML("<image href='./assets/train-carriages-16-v3.png'/>",fakeAsset),"<image href='blob:offline/assets/train-carriages-16-v3.png'/>");
assert.equal(offlineCSS("a{background:url('assets/customers.png')}@font-face{src:url(assets/education-kai.ttf)}g{clip-path:url(#clip)}",fakeAsset),'a{background:url("blob:offline/assets/customers.png")}@font-face{src:url("blob:offline/assets/education-kai.ttf")}g{clip-path:url(#clip)}');

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const file=resolve(process.argv[2]||resolve(root,'exports/yi-jiu-games-offline.html'));
const html=await readFile(file,'utf8');
const metadata=JSON.parse(html.match(/<script type="application\/json" id="offline-build">([\s\S]*?)<\/script>/)[1]);
const encoded=html.match(/<script type="application\/octet-stream" id="offline-assets">([\s\S]*?)<\/script>/)[1];
const code=html.match(/<script id="offline-code">([\s\S]*?)<\/script>/)[1];
new Script(code,{filename:'offline-code.js'});
assert(!/<script[^>]+\bsrc=/i.test(html));
assert(!/<link[^>]+rel="(?:stylesheet|preload)"/i.test(html));
assert(!/\bimport\s*\(/.test(code));
const files=unzipSync(Buffer.from(encoded,'base64'));
assert.equal(Object.keys(files).length,metadata.assetCount);
const expected=[];
async function collect(dir){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.name.startsWith('.'))continue;const path=resolve(dir,entry.name);if(entry.isDirectory())await collect(path);else if(entry.isFile())expected.push(relative(resolve(root,'dist'),path).replaceAll('\\','/'));}}
await collect(resolve(root,'dist/assets'));
assert.deepEqual(Object.keys(files).sort(),expected.sort(),'Every source asset must be embedded');
for(const [path,hash]of Object.entries(metadata.hashes)){
 assert.equal(createHash('sha256').update(files[path]).digest('hex'),hash,path);
 assert.deepEqual(Buffer.from(files[path]),await readFile(resolve(root,'dist',path)),path);
}
for(const name of ['壽司小店','釣魚對戰','小島生活任務','小島句子列車','收拾碗碟','用橡皮擦擦走錯字','起牀'])assert(code.includes(name),name);
console.log(`PASS: single classic-script HTML; all ${metadata.assetCount} embedded assets match source bytes; four games, Kai fonts, animation atlases, and Cantonese audio included; no external scripts/styles/modules.`);
