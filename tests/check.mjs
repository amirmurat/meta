import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {safeDestination,completionRequirements} from '../meta-routing.js';
const base='https://amirmurat.github.io/meta/account.html';
for(const bad of ['https://evil.test/','//evil.test/','javascript:alert(1)','../other/','/elsewhere/','./account.html','./welcome.html','\\evil.test','./%2e%2e/elsewhere/','./index.html/../account.html'])assert.equal(safeDestination(bad,base),'https://amirmurat.github.io/meta/');
assert.equal(safeDestination('./ielts-lesson.html?id=A.1.1.1.1',base),'https://amirmurat.github.io/meta/ielts-lesson.html?id=A.1.1.1.1');
assert.equal(safeDestination('./flutter.html#module-D','https://meta.test/account.html'),'https://meta.test/flutter.html#module-D');
const ready={signedIn:true,answer:'My work',criteria:[true,true],aiReviewed:true,selfPassed:true};
assert.equal(completionRequirements(ready).length,0);
for(const [key,value]of Object.entries({signedIn:false,answer:' ',criteria:[true,false],aiReviewed:false,selfPassed:false}))assert.equal(completionRequirements({...ready,[key]:value}).length,1,key);
const root=new URL('../',import.meta.url);let scripts=0,html=0;
for(const f of fs.readdirSync(root)){
 if(!/\.(html|js|css)$/.test(f))continue;
 const text=fs.readFileSync(new URL(f,root),'utf8');
 const blocks=f.endsWith('.js')?[text]:[...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(x=>x[1]).filter(x=>x.trim());
 for(const code of blocks){const result=spawnSync(process.execPath,['--input-type=module','--check'],{input:code,encoding:'utf8'});assert.equal(result.status,0,f+': '+result.stderr);scripts++;}
 if(f.endsWith('.html')){
  html++;const ids=[...text.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'Duplicate IDs '+f);
  for(const m of text.matchAll(/(?:href|src)="(\.\/[^"?#]+)(?:[?#][^"]*)?"/g))assert.ok(fs.existsSync(new URL(m[1],root)),f+' dead link '+m[1]);
  assert.equal((text.match(/<details\b/g)||[]).length,(text.match(/<\/details>/g)||[]).length,f+' details');
 }
}
console.log(`PASS: redirect attacks and safe deep links; all completion gates; ${html} HTML routes; ${scripts} JS blocks/modules; internal files and duplicate IDs.`);
