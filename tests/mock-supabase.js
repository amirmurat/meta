// Served ONLY by the loopback QA server, replacing the import at response time.
// Never imported by production. All writes stay in sessionStorage on localhost.
if(!['127.0.0.1','localhost'].includes(location.hostname))throw new Error('QA fixtures are localhost only');
const scenario=location.pathname.split('/')[2];
const key='meta-qa-'+scenario;
let state=JSON.parse(sessionStorage.getItem(key)||'null')||{};
const save=()=>sessionStorage.setItem(key,JSON.stringify(state));
const user={id:'qa-user',email:'learner@example.test',user_metadata:{}};
const signed=()=> state.signed ?? !['guest','signup','unconfirmed','recovery'].includes(scenario);
const courses=[{slug:'ielts',title:'IELTS Academic',total_units:332},{slug:'flutter',title:'Flutter',total_units:56},{slug:'quran',title:'Quran Study',total_units:6236}];
if(['arabic','admin'].includes(scenario))courses.push({slug:'arabic',title:'Арабский язык (MSA)',title_en:'Arabic (MSA)',total_units:5,unit_type:'task'});
const content={theory:'Read the question before listening. Identify what information you need.',example:'Question: What time does the train leave? Listen for the departure time.',task:'Write what you would listen for and explain your choice.',criteria:['Identify the information needed','Explain your answer'],ancestors:[],resource_url:'https://ielts.org/'};
const firstRu={theory:'В быстрой речи между словами часто нет паузы. Сначала улови смысл фразы, затем проверь, где заканчивается одно слово и начинается следующее.',example:'Иллюстрация: an aim («цель») и a name («имя») могут звучать похоже. Контекст помогает выбрать вариант; текст не заменяет прослушивание.',task:'Возьми короткий фрагмент официальной записи IELTS. До чтения транскрипта отметь таймкод, два возможных разделения звуков и подсказку из контекста.',criteria:['Записаны источник и таймкод','Вариант проверен по звуку и смыслу'],ancestors:[],resource_url:'https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test'};
const firstEn={theory:'In fast speech there is often no pause between words. Follow the meaning first, then check where one word ends and the next begins.',example:'Illustration: “an aim” and “a name” can sound similar. Context helps distinguish them; written text does not replace listening.',task:'Use a short official IELTS recording. Before reading the transcript, note the timecode, two possible word divisions and a contextual clue.',criteria:['Source and timecode are included','The choice is checked against sound and meaning'],ancestors:[],resource_url:firstRu.resource_url};
const lessons=[...Array.from({length:332},(_,i)=>({id:'i'+i,external_id:'A.1.1.1.'+(i+1),course_slug:'ielts',sort_order:i,title:i?'Учебная тема '+(i+1):'Различать границу между словами в незнакомой записи',title_en:i?'Learning topic '+(i+1):'Distinguish the end of one word and the beginning of the next in an unfamiliar recording.',lesson_content:i?content:firstRu,lesson_content_en:i?content:firstEn,task_type:'written'})),...Array.from({length:56},(_,i)=>({id:'f'+i,external_id:'D'+String(i+1).padStart(2,'0'),course_slug:'flutter',sort_order:i,title:'Flutter '+(i+1),lesson_content:content,task_type:'written'})),{id:'q0',external_id:'1:1',course_slug:'quran',sort_order:0,title:'Аль-Фатиха'}];
if(scenario==='arabic')for(let i=1;i<=5;i++)lessons.push({id:'ar'+i,external_id:'AR.01.0'+i,course_slug:'arabic',sort_order:i,title:'Arabic '+i});
function rows(table){
 const history=['existing','history','multi','admin'].includes(scenario);
 const defaults={courses,lessons,course_enrollments:scenario==='empty'?[]:(scenario==='multi'?courses:scenario==='admin'?courses.slice(0,3):scenario==='arabic'?[courses.at(-1)]:[courses[0]]).map(c=>({user_id:user.id,course_slug:c.slug})),lesson_progress:history?[{user_id:user.id,lesson_id:'i0',verification_method:'historical_import',date_accuracy:'unknown'}]:[],course_resume_positions:history?[{user_id:user.id,course_slug:'ielts',lesson_id:'i1',visited_at:'2026-10-30T15:00:00Z'}]:[],lesson_attempts:[],notes:[],profiles:[{id:user.id,display_name:'Test learner'}],meta_support_threads:scenario==='admin'?[{user_id:'qa-learner',updated_at:'2026-10-31T12:00:00Z'}]:[],meta_support_messages:scenario==='admin'?[{id:'qa-msg-1',user_id:'qa-learner',sender_id:'qa-learner',body:'How do I start IELTS?',created_at:'2026-10-31T12:00:00Z'}]:[]};
 return state[table]??defaults[table]??[];
}
const callbacks=[];
export const supabase={auth:{
 onAuthStateChange(cb){callbacks.push(cb);if(scenario==='recovery')setTimeout(()=>cb('PASSWORD_RECOVERY',{user}),0);return{data:{subscription:{unsubscribe(){}}}};},
 async signOut(){state.signed=false;save();callbacks.forEach(cb=>cb('SIGNED_OUT'));return{};},
 async signInWithPassword(){if(scenario==='unconfirmed')return{error:{message:'Email not confirmed'}};state.signed=true;save();return{data:{user}};},
 async signUp(){if(scenario==='signup')return{data:{user,session:null}};state.signed=true;save();return{data:{user,session:{user}}};},
 async resetPasswordForEmail(){return{};},async updateUser(){return{};}
},async rpc(name,args){if(name==='meta_admin_access')return{data:scenario==='admin'};if(name==='meta_complete_arabic_lesson'&&scenario==='arabic'){const attempt=rows('lesson_attempts').find(x=>x.lesson_id===args.p_lesson_id);if(!attempt||attempt.answer_text.trim().length<12)return{error:{message:'Save a practice answer first'}};state.lesson_progress=[...rows('lesson_progress'),{user_id:user.id,lesson_id:args.p_lesson_id,verification_method:'self_practice',completed_at:new Date().toISOString()}];save();return{data:null}}if(name==='meta_admin_report'&&scenario==='admin')return{data:{learners:[{id:'qa-learner',name:'QA learner',email:'learner@example.test'}],courses}};if(name==='meta_admin_reply'&&scenario==='admin'){state.meta_support_messages=[...rows('meta_support_messages'),{id:'qa-msg-reply',user_id:args.p_user,sender_id:user.id,body:args.p_body,created_at:'2026-10-31T12:01:00Z'}];save();return{data:null}}return{data:null,error:{message:'QA: this admin report is not mocked'}};},from(table){
 let filters=[],single=false,max=Infinity,offset=0,operation=null,payload=null;
 const q={select(){return q;},eq(k,v){filters.push(r=>r[k]===v);return q;},in(k,values){filters.push(r=>values.includes(r[k]));return q;},order(){return q;},limit(n){max=n;return q;},range(a,b){offset=a;max=b-a+1;return q;},maybeSingle(){single=true;return q;},single(){single=true;return q;},upsert(p){operation='upsert';payload=p;return q;},insert(p){operation='insert';payload=p;return q;},update(p){operation='update';payload=p;return q;},delete(){operation='delete';return q;},then(resolve,reject){return Promise.resolve().then(()=>{
  if(scenario==='network'||(scenario==='save-error'&&operation))return{data:null,error:{message:'QA simulated network failure'}};
  let data=rows(table).map(r=>({...r}));
  if(operation){
   if(operation==='insert')data.push({...payload,id:payload.id||'qa-record'});
   if(operation==='upsert'){const i=data.findIndex(r=>r.user_id===payload.user_id&&(payload.lesson_id?r.lesson_id===payload.lesson_id:r.course_slug===payload.course_slug));if(i<0)data.push({...payload});else data[i]={...data[i],...payload};}
   if(operation==='update')data=data.map(r=>filters.every(fn=>fn(r))?{...r,...payload}:r);
   if(operation==='delete')data=data.filter(r=>!filters.every(fn=>fn(r)));
   state[table]=data;save();
  }
  data=data.filter(r=>filters.every(fn=>fn(r))).slice(offset,offset+max);
  return{data:single?data[0]||null:data,error:null,count:data.length};
 }).then(resolve,reject);}};return q;
}};
export async function authenticatedUser(){await new Promise(r=>setTimeout(r,5));return signed()?user:null;}
export async function ensureProfile(){return rows('profiles')[0];}
export function authPage(next=''){const url=new URL('./account.html',location.href);if(next)url.searchParams.set('next',next);return url.href;}
