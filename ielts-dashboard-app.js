import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js?v=3";
import {MOCK} from "./reading-mock-bank.js";
import {LISTENING} from "./listening-practice-bank.js";
const en=language()==="en",t=(a,b)=>en?a:b,$=id=>document.getElementById(id);
const sections=[
 {key:MOCK.key,version:MOCK.version,name:"Reading",questions:MOCK.questions,skills:MOCK.skills,href:"./reading-mock.html",
  good:(q,a)=>q.type==="short"?q.answers.some(x=>String(x).trim().toLowerCase().replace(/[.,!?;:]+$/g,"").replace(/\s+/g," ")===String(a[q.id]||"").trim().toLowerCase().replace(/[.,!?;:]+$/g,"").replace(/\s+/g," ")):a[q.id]===q.answer},
 {key:LISTENING.key,version:LISTENING.version,name:"Listening",questions:LISTENING.parts.flatMap(p=>p.questions),skills:LISTENING.skills,href:"./listening-practice.html",
  good:(q,a)=>a[q.id]===q.answer}
];
function set(id,value){$(id).textContent=value}
function show(id,b){$(id).hidden=!b}
function status(v,err=false){set("status",v);show("status",!!v);$("status").style.color=err?"#a10f1c":""}
function makeLink(text,href){const a=document.createElement("a");a.href=href;a.textContent=text;return a}
function scored(section,record){
 let correct=0;const groups={};
 for(const q of section.questions){
  const s=groups[q.skill]||(groups[q.skill]={correct:0,total:0});
  const yes=section.good(q,record.responses||{});
  s.total++;if(yes){s.correct++;correct++}
 }
 return {correct,total:section.questions.length,skills:groups};
}
function renderSummary(section,record){
 const row=document.createElement("article");row.className="panel";
 const h=document.createElement("h2");h.textContent=section.name+" · "+(record?"latest attempt":"not yet attempted");
 row.append(h);
 if(record){
  const result=scored(section,record);
  const v=document.createElement("p");v.className="score";v.textContent=result.correct+" / "+result.total;row.append(v);
  const caveat=document.createElement("p");caveat.className="muted";
  caveat.textContent=t("Original uncalibrated practice, not an official IELTS band.","Авторская некалиброванная тренировка, не официальный IELTS band.");
  row.append(caveat);
 }else{
  const p=document.createElement("p");p.textContent=t("No saved result yet.","Пока нет сохранённого результата.");row.append(p);
 }
 row.append(makeLink(t("Open practice →","Открыть тренировку →"),section.href));$("summaries").append(row);
}
function makePlan(priorities,writ){
 const target=$("plan");target.replaceChildren();
 const top=priorities.slice(0,3);
 const topics=top.length?top:[{title:t("General Reading practice","Тренировка Reading"),href:"./reading-mock.html"},{title:t("Listening for details","Listening: поиск деталей"),href:"./listening-practice.html"}];
 const strategy=[
 t("Learn the weakest skill","Изучить самый слабый навык"),
 t("Learn the second priority","Изучить второй приоритет"),
 t("Practice the third priority","Тренировать третий приоритет"),
 t("Review yesterday's mistakes with NEW questions","Разобрать ошибки на НОВЫХ заданиях"),
 t("Consolidate the second skill","Закрепить второй навык"),
 t("Timed independent mixed practice","Независимая смешанная тренировка с таймером"),
 t("New practice and compare errors","Новая тренировка и сравнение ошибок")
 ];
 for(let i=0;i<7;i++){
  const index=[0,1,2,0,1,2,0][i]%topics.length,topic=topics[index];
  const li=document.createElement("li");
  const lead=document.createElement("strong");lead.textContent=t("Day ","День ")+(i+1)+" · "+strategy[i]+" ("+[25,25,25,30,30,40,60][i]+" "+t("min","мин")+")";
  const p=document.createElement("p");p.append(makeLink(topic.title+" →",topic.href));
  if(i>=3){
   p.append(document.createTextNode(" · "));
   p.append(makeLink(t("Official sample questions","Официальные примеры заданий"),"https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test"));
  }
  li.append(lead,p);target.append(li);
 }
 if(writ&&(writ.word_count_1<150||writ.word_count_2<250)){
  const li=document.createElement("li");li.append(makeLink(
    t("Writing: complete under-length answers; review with an instructor","Writing: доработать короткие ответы и проверить с преподавателем"),
    "./writing-mock.html"));target.append(li);
 }
}
async function boot(){
 const user=await authenticatedUser();if(!user){location.replace(authPage("./ielts-dashboard.html"));return}
 const permission=await supabase.from("course_enrollments").select("course_slug").eq("user_id",user.id).eq("course_slug","ielts").maybeSingle();
 if(permission.error)throw permission.error;if(!permission.data)throw Error(t("IELTS not assigned to your account","IELTS не назначен аккаунту"));
 const [attempts,writing]=await Promise.all([
  supabase.from("assessment_attempts").select("assessment_key,version,responses,submitted_at").eq("user_id",user.id).eq("course_slug","ielts").order("submitted_at",{ascending:false}).limit(100),
  supabase.from("ielts_writing_attempts").select("submitted_at,word_count_1,word_count_2,duration_seconds").eq("user_id",user.id).order("submitted_at",{ascending:false}).limit(1)
 ]);
 if(attempts.error)throw attempts.error;if(writing.error)throw writing.error;
 const data=attempts.data||[],writ=writing.data?.[0]||null;
 const all=[];
 for(const section of sections){
  const match=data.find(x=>x.assessment_key===section.key&&x.version===section.version&&x.responses&&typeof x.responses==="object");
  renderSummary(section,match);
  if(!match)continue;
  const result=scored(section,match);
  for(const [id,score]of Object.entries(result.skills)){
   if(score.total===0||score.correct===score.total)continue;
   all.push({id,title:section.name+" · "+section.skills[id][en?"en":"ru"],href:"./ielts-lesson.html?id="+encodeURIComponent(section.skills[id].lesson),
    accuracy:score.correct/score.total,total:score.total,correct:score.correct});
  }
 }
 const w=document.createElement("article");w.className="panel";
 const h=document.createElement("h2");h.textContent="Writing";w.append(h);
 const p=document.createElement("p");p.textContent=writ?
  t("Task 1: ","Task 1: ")+writ.word_count_1+t(" words · Task 2: "," слов · Task 2: ")+writ.word_count_2+t(" words. Not graded."," слов. Не оценено."):
  t("No saved Writing submission.","Пока нет сохранённой работы Writing.");
 w.append(p);w.append(makeLink(t("Open Writing practice →","Открыть Writing →"),"./writing-mock.html"));$("summaries").append(w);
 all.sort((a,b)=>a.accuracy-b.accuracy||b.total-a.total||a.title.localeCompare(b.title));
 const priorities=$("priority-list");priorities.replaceChildren();
 if(all.length){
  for(const x of all){
   const li=document.createElement("li");
   const p=document.createElement("p");
   p.textContent=x.title+" · "+x.correct+"/"+x.total+" · ";
   p.append(makeLink(t("Study micro-lesson →","Изучить микроурок →"),x.href));li.append(p);
   priorities.append(li);
  }
 }else{
  const li=document.createElement("li");li.textContent=t("Not enough incorrect responses yet. Take an independent Reading or Listening practice.","Пока мало данных об ошибках. Пройди Reading или Listening.");priorities.append(li);
 }
 makePlan(all,writ);
 status("");
}
void boot().catch(e=>{console.error("IELTS dashboard:",e);status(t("Could not load analytics.","Не удалось загрузить аналитику.")+" "+String(e.message||e),true)});
