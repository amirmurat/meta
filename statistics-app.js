import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js?v=3";
import {MOCK} from "./reading-mock-bank.js";
import {LISTENING} from "./listening-practice-bank.js";
import {ASSESSMENT} from "./assessment-bank.js";
const $=id=>document.getElementById(id);
const en=language()==="en",fmt=n=>new Intl.NumberFormat("ru-RU").format(Number(n)||0);
const pct=(n,total)=>total?(100*n/total).toFixed(1)+"%":"—";
const DAY_MS=86400000,zone="Asia/Almaty";
let days=30,data=null,user=null;
const examDefs=[
 {key:MOCK.key,version:MOCK.version,name:"Reading Mock",questions:MOCK.questions,code:"ielts"},
 {key:LISTENING.key,version:LISTENING.version,name:"Listening TTS",questions:LISTENING.parts.flatMap(p=>p.questions),code:"ielts"},
 {key:ASSESSMENT.key,version:ASSESSMENT.version,name:"Reading Skills Check",questions:ASSESSMENT.questions,code:"ielts"}
];
function node(tag,cls="",text=""){const el=document.createElement(tag);if(cls)el.className=cls;el.textContent=String(text);return el}
function set(id,s){$(id).textContent=s}function show(id,yes){$(id).hidden=!yes}
function status(s,error=false){set("status",s);$("status").style.color=error?"#a10f1c":"";show("status",!!s)}
function dateDay(value){
 const d=new Date(value);if(!Number.isFinite(d.getTime()))return null;
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
 const o=Object.fromEntries(parts.map(x=>[x.type,x.value]));
 return o.year+"-"+o.month+"-"+o.day;
}
const dayText=value=>value?value.split("-").reverse().join("."):"—";
const dateText=value=>value?new Intl.DateTimeFormat("ru-RU",{timeZone:zone,day:"2-digit",month:"short",year:"numeric"}).format(new Date(value)):"—";
const today=()=>dateDay(Date.now());
function rangeStart(){
 const iso=today();const d=new Date(iso+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-(days-1));
 return d.toISOString().slice(0,10);
}
async function getAll(table,fields){
 const all=[],page=1000;
 for(let offset=0;offset<20000;offset+=page){
  const orderBy={lesson_progress:"lesson_id",lesson_attempts:"lesson_id",learning_sessions:"id",assessment_attempts:"id",ielts_writing_attempts:"id"}[table];
  const {data:rows,error}=await supabase.from(table).select(fields).eq("user_id",user.id).order(orderBy,{ascending:true}).range(offset,offset+page-1);
  if(error)throw error;
  all.push(...(rows||[]));if(!rows||rows.length<page)return all;
 }
 throw Error("Слишком много записей для полной загрузки; отчёт нужно выгрузить частями.");
}
async function mapLessons(ids){
 const result=new Map();
 const arr=[...new Set(ids)];
 for(let offset=0;offset<arr.length;offset+=120){
  const {data,error}=await supabase.from("lessons").select("id,course_slug,external_id,title,title_en,task_type").in("id",arr.slice(offset,offset+120));
  if(error)throw error;
  for(const x of data||[])result.set(x.id,x);
 }
 return result;
}
const normal=s=>String(s||"").toLowerCase().trim().replace(/[.,!?;:]+$/g,"").replace(/\s+/g," ");
function testScore(a){
 const def=examDefs.find(x=>x.key===a.assessment_key&&x.version===a.version);
 if(!def||!a.responses||typeof a.responses!=="object")return null;
 let score=0;
 for(const q of def.questions){
  const ans=a.responses[q.id];
  if(q.type==="short"){if(q.answers?.some(v=>normal(v)===normal(ans)))score++}
  else if(q.answer===ans)score++;
 }
 return {score,total:def.questions.length,name:def.name};
}
function metric(label,value,note=""){
 const box=node("div","analytics-kpi");
 box.append(node("strong","",String(value)),node("span","",label));
 if(note)box.append(node("small","",note));return box;
}
function eventRecord(day,course,type,detail,source,ts=null,link=null){
 return day?{day,course,type,detail,source,ts,link}:null;
}
function derive(){
 const {enrollments,courses,progress,attempts,sessions,assessments,writing,lessons}=data;
 const enrolled=new Set(enrollments.map(c=>c.course_slug));
 const courseLookup=new Map(courses.map(c=>[c.slug,c]));
 const countCourse=new Map(),events=[],bounded=[],unknown=[];
 const quality={historical:0,exact:0,bounded:0,unknown:0};
 for(const p of progress){
  const lesson=lessons.get(p.lesson_id);if(!lesson||!enrolled.has(lesson.course_slug))continue;
  countCourse.set(lesson.course_slug,(countCourse.get(lesson.course_slug)||0)+1);
  const exact=p.date_accuracy==="exact_day"&&p.achieved_on;
  const fresh=p.verification_method!=="historical_import"&&p.completed_at;
  const title=(en?lesson.title_en||lesson.title:lesson.title)||lesson.external_id;
  if(p.verification_method==="historical_import")quality.historical++;
  if(exact||fresh){
   const day=exact?p.achieved_on:dateDay(p.completed_at);
   quality.exact++;
   events.push(eventRecord(day,lesson.course_slug,"Завершён урок",title,exact?"Точная дата": "Отметка Meta",p.completed_at,
    lesson.course_slug==="ielts"?"./ielts-lesson.html?id="+encodeURIComponent(lesson.external_id):
    lesson.course_slug==="flutter"?"./flutter-lesson.html?id="+encodeURIComponent(lesson.external_id):
    "./quran.html?s="+encodeURIComponent(lesson.external_id.split(":")[0])+"&a="+encodeURIComponent(lesson.external_id.split(":")[1])));
  }else if(p.date_accuracy==="on_or_before_day"&&p.achieved_on){quality.bounded++;bounded.push(p)}
  else {quality.unknown++;unknown.push(p)}
 }
 for(const a of attempts){
  const lesson=lessons.get(a.lesson_id);
  if(!lesson||!enrolled.has(lesson.course_slug))continue;
  if(a.submitted_at)events.push(eventRecord(dateDay(a.submitted_at),lesson.course_slug,"Сдано задание",lesson.title||lesson.external_id,"Отправка ответа",a.submitted_at));
  if(a.ai_review_confirmed_at)events.push(eventRecord(dateDay(a.ai_review_confirmed_at),lesson.course_slug,"Подтверждён разбор",lesson.title||lesson.external_id,"Подтверждение пользователя",a.ai_review_confirmed_at));
 }
 for(const a of assessments)events.push(eventRecord(dateDay(a.submitted_at),a.course_slug,"Сдан тест",testScore(a)?.name||a.assessment_key,"Assessment",a.submitted_at));
 for(const w of writing)events.push(eventRecord(dateDay(w.submitted_at),"ielts","Сдан Writing","Task 1: "+w.word_count_1+" слов; Task 2: "+w.word_count_2+" слов","Writing",w.submitted_at));
 for(const s of sessions)if(s.session_date)events.push(eventRecord(s.session_date,s.course_slug,"Сессия обучения",
  Number.isFinite(s.minutes)?s.minutes+" мин":"без зафиксированного времени","Learning sessions",s.started_at));
 const dates=new Map();
 for(const e of events.filter(Boolean))dates.set(e.day,(dates.get(e.day)||0)+1);
 const activeDays=[...dates.keys()].sort(),now=today(),dateFrom=rangeStart();
 const periodEvents=events.filter(e=>e&&e.day>=dateFrom&&e.day<=now);
 const periodSessions=sessions.filter(s=>s.session_date>=dateFrom&&s.session_date<=now);
 const completed=periodEvents.filter(e=>e.type==="Завершён урок").length;
 let currentStreak=0,bestStreak=0,run=0;
 const dateSet=new Set(activeDays);
 const cursor=new Date(now+"T12:00:00Z");
 if(!dateSet.has(now))cursor.setUTCDate(cursor.getUTCDate()-1);
 while(dateSet.has(cursor.toISOString().slice(0,10))){currentStreak++;cursor.setUTCDate(cursor.getUTCDate()-1)}
 for(let i=0;i<activeDays.length;i++){
  const prev=i?new Date(activeDays[i-1]+"T12:00:00Z").getTime():0;
  const curr=new Date(activeDays[i]+"T12:00:00Z").getTime();
  run=i&&curr-prev===DAY_MS?run+1:1;bestStreak=Math.max(bestStreak,run);
 }
 return {enrolled,courseLookup,countCourse,events:events.filter(Boolean),dates,activeDays,periodEvents,periodSessions,completed,quality,bounded,unknown,currentStreak,bestStreak,dateFrom,now};
}
function overview(d){
 const e=d.periodEvents,s=d.periodSessions;
 const totalMinutes=s.filter(x=>Number.isFinite(x.minutes)&&x.minutes>=0).reduce((n,x)=>n+x.minutes,0);
 const measured=s.filter(x=>Number.isFinite(x.minutes)).length;
 const scores=data.assessments.filter(x=>dateDay(x.submitted_at)>=d.dateFrom).length;
 const written=data.writing.filter(x=>dateDay(x.submitted_at)>=d.dateFrom).length;
 const root=$("summary"),extra=$("summary-details");root.replaceChildren();extra.replaceChildren();
 const rows=[
 ["Пройдено единиц всего",[...d.countCourse.values()].reduce((a,b)=>a+b,0),"включая исторические отметки"],
 ["Завершения за период",d.completed,days+(en?" days · exact dates":" дней · реальные даты")],
 ["Учебных дней",new Set(e.map(x=>x.day)).size,"дни с зафиксированными событиями"],
 ["Текущая серия",d.currentStreak,"дней подряд по событиям"],
 ["Лучшая серия",d.bestStreak,"дней за всё время"],
 ["Сдано заданий",e.filter(x=>x.type==="Сдано задание").length,"с отметкой сдачи"],
 ["Сдано тестов",scores,"за выбранный период"],
 ["Writing-попытки",written,"сохранённые работы"],
 ["Минут зафиксировано",totalMinutes,measured+(en?" sessions with duration":" сессий с длительностью")],
 ["Учебных событий",e.length,"завершения, сдачи, тесты и сессии"],
 ["Назначено программ",d.enrolled.size,"в личном аккаунте"],
 ["Сохранено заметок",data.notesCount,"личные заметки по курсам"],
 ["Подтверждённых разборов",e.filter(x=>x.type==="Подтверждён разбор").length,"отмечено пользователем"]
 ];
 for(const [index,[label,val,hint]]of rows.entries())(new Set([0,2,5,11]).has(index)?root:extra).append(metric(label,fmt(val),hint));
 $("period-label").textContent=dayText(d.dateFrom)+" — "+dayText(d.now)+(en?" · Almaty":" · Алматы");
}
function progress(d){
 const root=$("course-progress");root.replaceChildren();
 for(const slug of d.enrolled){
  const course=d.courseLookup.get(slug);if(!course)continue;
  const done=d.countCourse.get(slug)||0,total=Number(course.total_units)||0;
  const row=node("div","analytics-compare-row");row.dataset.course=slug;
  const heading=node("div","analytics-compare-head");
  heading.append(node("strong","",en?(course.title_en||course.title):course.title),node("span","",fmt(done)+" / "+fmt(total)+" · "+pct(done,total)));
  const track=node("div","analytics-track"),fill=node("div","analytics-fill");
  track.setAttribute("role","progressbar");track.setAttribute("aria-label",en?(course.title_en||course.title):course.title);
  track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(total));track.setAttribute("aria-valuenow",String(done));
  fill.style.width=Math.min(100,Math.max(0,total?100*done/total:0))+"%";track.append(fill);row.append(heading,track);root.append(row);
 }
 if(!root.children.length)root.append(node("p","analytics-empty",en?"No assigned courses yet.":"Нет назначенных программ."));
}
function topics(d){
 const root=$("topic-groups");root.replaceChildren();
 for(const slug of d.enrolled){
  const bySection=new Map();
  const all=[...data.lessons.values()].filter(x=>x.course_slug===slug);
  const completed=new Set(data.progress.map(p=>p.lesson_id));
  for(const l of all){
   let section="";
   if(slug==="ielts")section=l.external_id?.split(".").slice(0,2).join(".")||"?";
   else if(slug==="quran")section="Сура "+(l.external_id||"?").split(":")[0];
   else section=l.task_type==="explain"?"Объяснение":l.task_type==="practical"?"Практика":"Код и логика";
   const row=bySection.get(section)||{done:0,total:0};
   row.done+=completed.has(l.id)?1:0;row.total++;
   bySection.set(section,row);
  }
  const box=node("article","analytics-panel"),h=node("h3","",en?(d.courseLookup.get(slug)?.title_en||d.courseLookup.get(slug)?.title||slug):(d.courseLookup.get(slug)?.title||slug));box.dataset.course=slug;
  box.append(h);
  const entries=[...bySection].sort((a,b)=>slug==="quran"?Number(a[0].split(" ")[1])-Number(b[0].split(" ")[1]):a[0].localeCompare(b[0]));
  for(const [name,s]of entries){
   if(slug==="quran"&&!s.done)continue;
   const row=node("div","analytics-progress");
   const header=node("div","analytics-progress-header");header.append(node("strong","",slug==="ielts"?({"A.1":"Listening","A.2":"Reading","A.3":"Writing","A.4":"Speaking"}[name]||name):name),
    node("span","",slug==="quran"?fmt(s.done)+" отмечено":fmt(s.done)+" / "+fmt(s.total)));
   row.append(header);
   if(slug!=="quran"){const track=node("div","analytics-track"),fill=node("div","analytics-fill");
     fill.style.width=Math.min(100,100*s.done/(s.total||1))+"%";track.append(fill);row.append(track)}
   box.append(row);
  }
  if(entries.length&&slug==="quran"&&!entries.some(([k,v])=>v.done))box.append(node("p","analytics-note","Пока нет отмеченных аятов."));
  root.append(box);
 }
}
function groupBars(items){
 if(days===365){
  const m=new Map();
  for(const row of items){const key=row.day.slice(0,7);m.set(key,(m.get(key)||0)+row.count)}
  return [...m].map(([label,count])=>({label,count}));
 }
 if(days===90){
  const groups=[];items.forEach((r,i)=>{const n=Math.floor(i/7);if(!groups[n])groups[n]={label:r.day.slice(5),count:0};groups[n].count+=r.count});return groups;
 }
 return items.map(r=>({label:r.day.slice(5),count:r.count}));
}
function activity(d){
 $("activity-empty").hidden=d.periodEvents.length!==0;
 $("activity-visuals").hidden=d.periodEvents.length===0;
 const entries=[];
 for(let i=0;i<days;i++){
  const dt=new Date(d.dateFrom+"T12:00:00Z");dt.setUTCDate(dt.getUTCDate()+i);
  const day=dt.toISOString().slice(0,10);entries.push({day,count:d.dates.get(day)||0});
 }
 const bars=groupBars(entries),max=Math.max(1,...bars.map(x=>x.count)),root=$("activity-chart");root.replaceChildren();
 for(const row of bars){
  const div=node("div","analytics-bar-col");
  const v=node("span","analytics-bar-value",row.count);
  const bar=node("div","analytics-bar");bar.style.height=(row.count?Math.max(3,141*row.count/max):0)+"px";
  bar.title=row.label+": "+row.count+" событий";
  div.append(v,bar,node("span","analytics-bar-label",row.label));root.append(div);
 }
 set("activity-desc",fmt(d.periodEvents.length)+" событий за период. "+(days>90?"Группировка по месяцам.":days===90?"Группировка по неделям.":"Группировка по дням."));
 const heat=$("heatmap");heat.replaceChildren();
 const base=new Date(d.now+"T12:00:00Z");
 for(let i=90;i>=0;i--){
  const date=new Date(base);date.setUTCDate(base.getUTCDate()-i);
  const iso=date.toISOString().slice(0,10),n=d.dates.get(iso)||0;
  const cell=node("span","analytics-day"+(n>=4?" lv3":n>=2?" lv2":n>=1?" lv1":""));
  cell.title=dayText(iso)+": "+n+" событий";heat.append(cell);
 }
 set("calendar-meta",(en?"91 days · ":"91 день · ")+d.activeDays.filter(day=>day>=new Date(base.getTime()-90*DAY_MS).toISOString().slice(0,10)).length+(en?" learning days.":" учебных дней."));
 const types=$("activity-types");types.replaceChildren();
 const groups=[
  ["Завершён урок",en?"Completed lessons":"Завершённые уроки"],
  ["Сдано задание",en?"Submitted answers":"Сданные ответы"],
  ["Сдан тест",en?"Submitted tests":"Сданные тесты"],
  ["Сдан Writing",en?"Writing submissions":"Сданные Writing"],
  ["Подтверждён разбор",en?"Confirmed reviews":"Подтверждённые разборы"],
  ["Сессия обучения",en?"Recorded sessions":"Записанные сессии"]
 ];
 const counts=new Map();for(const event of d.periodEvents)counts.set(event.type,(counts.get(event.type)||0)+1);
 const maximum=Math.max(1,...groups.map(([key])=>counts.get(key)||0));
 for(const [key,label]of groups){const count=counts.get(key)||0;if(!count)continue;
  const row=node("div","analytics-mix-row"),track=node("div","analytics-track"),fill=node("div","analytics-fill");
  row.append(node("strong","",label),node("span","",fmt(count)));
  track.setAttribute("role","meter");track.setAttribute("aria-label",label);track.setAttribute("aria-valuemin","0");track.setAttribute("aria-valuemax",String(maximum));track.setAttribute("aria-valuenow",String(count));
  fill.style.width=100*count/maximum+"%";track.append(fill);row.append(track);types.append(row);
 }
}
function testing(d){
 const root=$("testing-kpis");root.replaceChildren();
 const exams=data.assessments.filter(a=>dateDay(a.submitted_at)>=d.dateFrom);
 const writing=data.writing.filter(a=>dateDay(a.submitted_at)>=d.dateFrom);
 root.append(metric("Тестов за период",fmt(exams.length)),
   metric("Разных типов тестов",fmt(new Set(exams.map(a=>a.assessment_key)).size)),
   metric("Writing-попыток",fmt(writing.length)),
   metric("Попыток за всё время",fmt(data.assessments.length)));
 const table=$("testing-history");table.replaceChildren();
 for(const a of [...data.assessments].sort((x,y)=>y.submitted_at.localeCompare(x.submitted_at)).slice(0,60)){
  const s=testScore(a),tr=node("tr");
  const values=[dateText(a.submitted_at),a.course_slug,s?.name||a.assessment_key,s?s.score+" / "+s.total:"—",s?"Тренировочный raw score":"Версия без доступного ключа"];
  for(const [i,x]of values.entries())tr.append(node("td",i===3?"num":"",x));
  table.append(tr);
 }
 if(!table.children.length){const tr=node("tr"),td=node("td","analytics-empty","Тесты пока не сдавались.");td.colSpan=5;tr.append(td);table.append(tr)}
}
function practice(d){
 const root=$("practice-kpis");root.replaceChildren();
 const completed=data.attempts.filter(a=>a.submitted_at);
 const reviewed=data.attempts.filter(a=>a.ai_review_confirmed_at);
 const writing=data.writing;
 const timed=data.sessions.filter(x=>Number.isFinite(x.minutes));
 const minutes=timed.reduce((n,s)=>n+s.minutes,0);
 for(const [label,val,hint]of [
  ["Заданий сдано всего",completed.length,"черновики не учитываются"],
  ["Разборов подтверждено",reviewed.length,"проверка подтверждена пользователем"],
  ["Writing-работ сохранено",writing.length,"Task 1 + Task 2"],
  ["Сессий с длительностью",timed.length,fmt(minutes)+" мин суммарно"]
 ])root.append(metric(label,fmt(val),hint));
 const writingRoot=$("writing-history");writingRoot.replaceChildren();
 writingRoot.append(node("h3","","Последние Writing-попытки"));
 for(const item of [...writing].sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at)).slice(0,12)){
  writingRoot.append(node("div","analytics-event",dateText(item.submitted_at)+" · Task 1: "+item.word_count_1+" слов · Task 2: "+item.word_count_2+" слов"));
 }
 if(!writing.length)writingRoot.append(node("p","analytics-note","Сохранённых Writing-попыток пока нет."));
}
function timeline(d){
 const root=$("timeline");root.replaceChildren();
 for(const e of [...d.events].sort((a,b)=>b.day.localeCompare(a.day)||String(b.ts||"").localeCompare(String(a.ts||""))).slice(0,120)){
  const tr=node("tr");
  for(const [i,v]of [dayText(e.day),d.courseLookup.get(e.course)?.title||e.course,e.type,e.detail,e.source].entries()){
   const td=node("td","",v);
   if(i===3&&e.link){td.replaceChildren();const a=node("a","",v);a.href=e.link;td.append(a)}
   tr.append(td);
  }
  root.append(tr);
 }
 if(!root.children.length){const tr=node("tr"),td=node("td","analytics-empty","Пока нет датированных событий.");td.colSpan=5;tr.append(td);root.append(tr)}
}
function integrity(d){
 const root=$("integrity");root.replaceChildren();
 for(const [title,val,desc]of [
  ["Точные события завершения",d.quality.exact,"показываются на календаре"],
  ["Исторические отметки",d.quality.historical,"учтены в общем прогрессе"],
  ["Даты «не позднее»",d.quality.bounded,"не становятся точным днём"],
  ["Без точной даты",d.quality.unknown,"исключены из дневной активности"],
  ["Сессии без времени",data.sessions.filter(s=>!Number.isFinite(s.minutes)).length,"не добавляют минуты"],
  ["Дата начала анализа",dayText(d.dateFrom),days+" дней, часовой пояс Алматы"]
 ])root.append(metric(title,typeof val==="number"?fmt(val):val,desc));
}
function escapeCsv(value){
 const v=String(value??""),safe=/^\s*[=+@\-]/.test(v)?"'"+v:v;
 return '"'+safe.replaceAll('"','""')+'"';
}
function exportCSV(){
 if(!data)return;
 const d=derive(),rows=[["Дата","Курс","Тип события","Подробности","Источник"]];
 for(const e of [...d.events].sort((a,b)=>b.day.localeCompare(a.day)))rows.push([e.day,e.course,e.type,e.detail,e.source]);
 const csv="\uFEFF"+rows.map(x=>x.map(escapeCsv).join(",")).join("\r\n");
 const blob=new Blob([csv],{type:"text/csv;charset=utf-8"});
 const url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="meta-my-activity.csv";document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
}
function render(){
 const d=derive();
 overview(d);progress(d);topics(d);activity(d);testing(d);practice(d);timeline(d);integrity(d);
 document.querySelectorAll("[data-days]").forEach(b=>b.setAttribute("aria-pressed",String(Number(b.dataset.days)===days)));
}
async function boot(){
 user=await authenticatedUser();if(!user){location.replace(authPage("./statistics.html"));return}
 const requests=await Promise.all([
  supabase.from("course_enrollments").select("course_slug").eq("user_id",user.id),
  supabase.from("courses").select("slug,title,title_en,total_units"),
  getAll("lesson_progress","lesson_id,completed_at,achieved_on,date_accuracy,verification_method"),
  getAll("lesson_attempts","lesson_id,submitted_at,ai_review_confirmed_at"),
  getAll("learning_sessions","course_slug,session_date,minutes,started_at"),
  getAll("assessment_attempts","assessment_key,course_slug,version,responses,submitted_at"),
  getAll("ielts_writing_attempts","version,word_count_1,word_count_2,submitted_at"),
  supabase.from("notes").select("id",{count:"exact",head:true}).eq("user_id",user.id)
 ]);
 if(requests[0].error)throw requests[0].error;
 if(requests[1].error)throw requests[1].error;
 const [e,c,p,a,s,ass,w]=requests.slice(0,7).map((r,i)=>i<=1?r.data||[]:r);
 if(requests[7].error)throw requests[7].error;
 const notesCount=requests[7].count||0;
 const details=await mapLessons([...p.map(x=>x.lesson_id),...a.map(x=>x.lesson_id)]);
 // IELTS (332) and Flutter (56): load full course catalogues for accurate section denominators.
 const assigned=new Set(e.map(x=>x.course_slug));
 for(const slug of ["ielts","flutter"]){
  if(!assigned.has(slug))continue;
  const {data:allLessons,error:lessonError}=await supabase.from("lessons")
   .select("id,course_slug,external_id,title,title_en,task_type").eq("course_slug",slug).order("sort_order",{ascending:true}).range(0,999);
  if(lessonError)throw lessonError;
  for(const lesson of allLessons||[])details.set(lesson.id,lesson);
 }
 data={enrollments:e,courses:c,progress:p,attempts:a,sessions:s,assessments:ass,writing:w,lessons:details,notesCount};
 document.querySelectorAll("[data-days]").forEach(b=>b.addEventListener("click",()=>{days=Number(b.dataset.days);render()}));
 $("export").onclick=exportCSV;
 const grant=await supabase.rpc("meta_admin_access");
 if(!grant.error&&grant.data===true)show("admin-link",true);
 show("dashboard",true);status("");render();
}
void boot().catch(err=>{console.error("Personal analytics:",err);status("Не удалось загрузить статистику: "+String(err.message||err),true)});
