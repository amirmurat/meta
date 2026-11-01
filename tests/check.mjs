import fs from 'node:fs';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {safeDestination,completionRequirements} from '../meta-routing.js';
import {selectIeltsVideos} from '../meta-ielts-videos.js';
import {explanationPrompt} from '../meta-lesson-prompts.js';
const matching=(external_id,title_en)=>selectIeltsVideos({external_id,title_en}).map(video=>video.id);
assert.deepEqual(matching('A.1.1.1.1','Distinguish the end of one word and the beginning of the next in an unfamiliar recording.'),['listening-linking']);
assert.deepEqual(matching('A.1.1.1.3','Restore a word, some of whose sounds are reduced.'),['listening-schwa']);
assert.deepEqual(matching('A.3.1.1.1','Distinguish between chart types: line/bar/pie/table.'),['writing-task1']);
assert.deepEqual(matching('A.4.1.1.1','Quickly start a response to a familiar topic.'),[]);
assert.deepEqual(matching('A.2.1.1.1','Determine the meaning of a polysemantic word based on a paragraph.'),[]);
const base='https://amirmurat.github.io/meta/account.html';
for(const bad of ['https://evil.test/','//evil.test/','javascript:alert(1)','../other/','/elsewhere/','./account.html','./welcome.html','\\evil.test','./%2e%2e/elsewhere/','./index.html/../account.html'])assert.equal(safeDestination(bad,base),'https://amirmurat.github.io/meta/');
assert.equal(safeDestination('./ielts-lesson.html?id=A.1.1.1.1',base),'https://amirmurat.github.io/meta/ielts-lesson.html?id=A.1.1.1.1');
assert.equal(safeDestination('./flutter.html#module-D','https://meta.test/account.html'),'https://meta.test/flutter.html#module-D');
const ready={signedIn:true,answer:'My work',aiReviewed:true,selfPassed:true};
assert.equal(completionRequirements(ready).length,0);
for(const [key,value]of Object.entries({signedIn:false,answer:' ',aiReviewed:false,selfPassed:false}))assert.equal(completionRequirements({...ready,[key]:value}).length,1,key);
const teach=explanationPrompt({course:'IELTS',title:'Word boundaries',theory:'Listen for linking.',example:'A different example.',task:'Identify a boundary.',criteria:['Use audio'],resourceUrl:'https://ielts.org/example'},true);
assert.ok(teach.includes('Explain the knowledge')&&teach.includes('Do not complete the exact task')&&teach.includes('https://ielts.org/example'));
assert.ok(!teach.includes('My work'));
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
