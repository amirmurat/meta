import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js?v=3";
import {MOCK} from "./reading-mock-bank.js";
import {PASSAGE_CONTEXT} from "./reading-mock-context.js";
const en=language()==="en",t=(a,b)=>en?a:b,$=id=>document.getElementById(id);
let user,answers={},startTime=0,ticking=null,active=false,busy=false;
const questionNumber=Object.fromEntries(MOCK.questions.map((q,i)=>[q.id,i+1]));
const key=suffix=>["meta",user.id,MOCK.key,MOCK.version,suffix].join(":");
const norm=value=>String(value??"").trim().toLowerCase().replace(/[.,!?;:]+$/g,"").replace(/\s+/g," ");
const correct=(q,a)=>q.type==="short"?q.answers.some(v=>norm(v)===norm(a[q.id])):q.answer===a[q.id];
const answered=q=>q.type==="short"?!!String(answers[q.id]||"").trim():Number.isInteger(answers[q.id]);
function set(id,value){$(id).textContent=value}
function show(id,yes){$(id).hidden=!yes}
function notice(msg,error=false){set("status",msg);show("status",!!msg);$("status").style.color=error?"#a10f1c":""}
function draft(){
 try{localStorage.setItem(key("answers"),JSON.stringify(answers));localStorage.setItem(key("start"),String(startTime));}catch{}
}
function clearDraft(){try{localStorage.removeItem(key("answers"));localStorage.removeItem(key("start"));}catch{}}
function restore(){
 try{
  const saved=JSON.parse(localStorage.getItem(key("answers"))||"{}");answers={};
  for(const q of MOCK.questions){
   const value=saved[q.id];
   if(q.type==="short"&&typeof value==="string"&&value.length<100)answers[q.id]=value;
   if(q.type==="choice"&&Number.isInteger(value)&&value>=0&&value<q.options.length)answers[q.id]=value;
  }
  startTime=Math.max(0,Number(localStorage.getItem(key("start")))||0);
 }catch{answers={};startTime=0;}
}
function progress(){
 const count=MOCK.questions.filter(answered).length;
 set("answered",count+" / "+MOCK.questions.length);
 $("progress-fill").style.width=100*count/MOCK.questions.length+"%";
}
function renderExam(){
 const root=$("passages");root.replaceChildren();
 for(const passage of MOCK.passages){
  const section=document.createElement("section");section.className="passage-section";
  const h=document.createElement("h2");h.textContent=passage.title;section.append(h);
  const reading=document.createElement("div");reading.className="reading-passage";reading.lang="en";
  for(const par of passage.paragraphs){const p=document.createElement("p");p.textContent=par.id+". "+par.text+" "+(PASSAGE_CONTEXT[passage.id]?.[par.id]||"");reading.append(p)}
  section.append(reading);
  for(const q of MOCK.questions.filter(q=>q.passage===passage.id)){
   const fs=document.createElement("fieldset");fs.className="question";
   const legend=document.createElement("legend");legend.textContent=questionNumber[q.id]+". "+q.prompt;fs.append(legend);
   if(q.type==="short"){
    const input=document.createElement("input");input.className="answer-text";input.type="text";input.maxLength=99;
    input.value=answers[q.id]||"";input.autocomplete="off";
    input.setAttribute("aria-label",t("Answer to question ","Ответ на вопрос ")+questionNumber[q.id]);
    input.oninput=()=>{answers[q.id]=input.value;draft();progress()};fs.append(input);
   }else{
    const options=document.createElement("div");options.className="options";
    q.options.forEach((option,i)=>{
     const label=document.createElement("label");label.className="option";
     const input=document.createElement("input");input.type="radio";input.name=q.id;input.checked=answers[q.id]===i;
     input.onchange=()=>{answers[q.id]=i;draft();progress()};
     const span=document.createElement("span");span.textContent=option;label.append(input,span);options.append(label);
    });fs.append(options);
   }
   section.append(fs);
  }root.append(section);
 }
 progress();
}
function tick(){
 if(!active)return;
 const seconds=Math.max(0,Math.ceil((startTime+MOCK.durationMinutes*60000-Date.now())/1000));
 set("clock",String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0"));
 if(!seconds){clearInterval(ticking);ticking=null;void finish(true);}
}
function start(){
 if(!startTime)startTime=Date.now();draft();active=true;
 show("intro",false);show("results",false);show("exam",true);show("history",false);show("latest",false);
 renderExam();if(ticking)clearInterval(ticking);tick();
 if(active)ticking=setInterval(tick,1000);
 window.scrollTo({top:0});
}
function evaluate(a){
 const bySkill=Object.fromEntries(Object.keys(MOCK.skills).map(k=>[k,{correct:0,total:0}]));
 let totalCorrect=0;
 for(const q of MOCK.questions){
  const yes=correct(q,a);if(yes)totalCorrect++;
  bySkill[q.skill].total++;if(yes)bySkill[q.skill].correct++;
 }
 return {correct:totalCorrect,bySkill};
}
function link(skill){
 const a=document.createElement("a");a.href="./ielts-lesson.html?id="+encodeURIComponent(MOCK.skills[skill].lesson);
 a.textContent=t("Open lesson →","Открыть урок →");return a;
}
function recommendations(result,prefix){
 const sort=Object.entries(result.bySkill).sort((a,b)=>
  (a[1].correct/a[1].total)-(b[1].correct/b[1].total)||b[1].total-a[1].total);
 set(prefix+"score",result.correct+" / 40 ("+Math.round(result.correct*2.5)+"%)");
 const root=$(prefix+"skills");root.replaceChildren();
 for(const [id,v] of sort){
  const row=document.createElement("div");row.className="skill-row";
  const title=document.createElement("strong");title.textContent=MOCK.skills[id][en?"en":"ru"];
  const n=document.createElement("span");n.textContent=v.correct+" / "+v.total;
  row.append(title,n);if(v.correct<v.total){const d=document.createElement("div");d.className="skill-action";d.append(link(id));row.append(d)}
  root.append(row);
 }
 const weak=sort.filter(([,v])=>v.correct<v.total).map(([id])=>id);
 const order=weak.length?weak:sort.map(([id])=>id);
 const daySubjects=[0,1,2,0,1,2,0];
 const tasks=[
  t("Review mistakes and learn priority 1","Разбор ошибок и приоритет №1"),
  t("Learn priority 2","Изучить приоритет №2"),
  t("Learn priority 3","Изучить приоритет №3"),
  t("Practice priority 1 on new items","Новые задания по приоритету №1"),
  t("Practice priority 2 on new items","Новые задания по приоритету №2"),
  t("Mixed timed practice","Смешанная тренировка с таймером"),
  t("Independent test and review","Независимый тест и разбор")
 ];
 const mins=[25,25,25,30,30,40,60];
 const list=$(prefix+"week");list.replaceChildren();
 for(let i=0;i<7;i++){
  const skill=order[daySubjects[i]%order.length],li=document.createElement("li");
  const title=document.createElement("strong");title.textContent=t("Day ","День ")+(i+1)+": "+tasks[i]+" ("+mins[i]+" "+t("min","мин")+")";
  const sub=document.createElement("p");sub.textContent=MOCK.skills[skill][en?"en":"ru"]+" · ";sub.append(link(skill));
  if(i>=3){const a=document.createElement("a");a.href="https://ielts.org/take-a-test/preparation-resources/sample-test-questions/academic-test";
   a.target="_blank";a.rel="noopener noreferrer";a.textContent=t(" · Official practice source"," · Официальные задания");sub.append(a)}
  li.append(title,sub);list.append(li);
 }
 set(prefix+"note",t(
  "Based on errors in this original sample. Skill sample sizes vary. Days 4–7 need different questions, not a repeat of the same test. Not an official band score.",
  "По ошибкам этого авторского варианта; выборки навыков различаются. Для дней 4–7 нужны другие вопросы, а не повтор теста. Это не официальный IELTS band."
 ));
}
function review(){
 const root=$("review");root.replaceChildren();
 for(const q of MOCK.questions){
  const details=document.createElement("details"),summary=document.createElement("summary");
  summary.textContent=(correct(q,answers)?"✓ ":"✕ ")+questionNumber[q.id]+". "+q.prompt;
  const a=document.createElement("p");const got=q.type==="short"?answers[q.id]||"—":q.options[answers[q.id]]||"—";
  a.textContent=t("Your answer: ","Твой ответ: ")+got+" · "+t("Expected: ","Верный ответ: ")+(q.type==="short"?q.answers[0]:q.options[q.answer]);
  const e=document.createElement("p");e.className="muted";e.textContent=q.evidence;
  details.append(summary,a,e);root.append(details);
 }
}
async function finish(expired=false){
 if(!active||busy)return;busy=true;$("submit").disabled=true;
 const result=evaluate(answers);
 let error;
 try{({error}=await supabase.from("assessment_attempts").insert({
  user_id:user.id,course_slug:MOCK.course,assessment_key:MOCK.key,
  version:MOCK.version,responses:{...answers}
 }));}catch(e){error=e}
 if(!error)clearDraft();
 active=false;if(ticking)clearInterval(ticking);ticking=null;
 show("exam",false);show("results",true);
 recommendations(result,"result-");review();
 set("result-state",(expired?t("Time expired. ","Время истекло. "):"")+
  (error?t("Could not save: ","Не удалось сохранить: ")+String(error.message||error):t("Saved to your private history.","Сохранено в личной истории.")));
 busy=false;$("submit").disabled=false;window.scrollTo({top:0});
}
async function history(){
 const {data,error}=await supabase.from("assessment_attempts")
  .select("version,responses,submitted_at").eq("user_id",user.id).eq("course_slug",MOCK.course)
  .eq("assessment_key",MOCK.key).order("submitted_at",{ascending:false}).limit(12);
 if(error)return;
 const root=$("history-list");root.replaceChildren();
 for(const attempt of data||[]){
  const row=document.createElement("div");row.className="history-row";
  const date=document.createElement("span");
  date.textContent=new Intl.DateTimeFormat(en?"en-GB":"ru-RU",{timeZone:"Asia/Almaty",dateStyle:"medium",timeStyle:"short"}).format(new Date(attempt.submitted_at));
  const val=document.createElement("strong");
  val.textContent=attempt.version===MOCK.version?evaluate(attempt.responses).correct+" / 40":t("Older version","Старая версия");
  row.append(date,val);root.append(row);
 }
 show("history",!!data?.length);
 const recent=(data||[]).find(x=>x.version===MOCK.version&&x.responses);
 if(recent){recommendations(evaluate(recent.responses),"latest-");show("latest",true)}
}
async function boot(){
 set("heading",MOCK.title[en?"en":"ru"]);set("notice",MOCK.notice[en?"en":"ru"]);
 user=await authenticatedUser();if(!user){location.replace(authPage("./reading-mock.html"));return}
 const {data,error}=await supabase.from("course_enrollments").select("course_slug")
  .eq("user_id",user.id).eq("course_slug","ielts").maybeSingle();
 if(error)throw error;if(!data){notice(t("IELTS is not assigned to this account.","IELTS не назначен этому аккаунту."),true);return}
 restore();
 $("start").onclick=()=>{answers={};startTime=0;clearDraft();start()};
 $("resume").onclick=start;
 $("restart").onclick=()=>{answers={};startTime=0;clearDraft();start()};
 $("exam").onsubmit=e=>{e.preventDefault();void finish(false)};
 show("resume",!!startTime);show("intro",true);notice("");
 await history();
 if(startTime&&startTime+MOCK.durationMinutes*60000<=Date.now())
  notice(t("Saved attempt time has expired; continue to score remaining answers.","Время сохранённой попытки истекло; продолжи для подсчёта результата."));
}
void boot().catch(e=>{console.error("Reading mock",e);notice(t("Unable to load test.","Не удалось открыть тест.")+" "+String(e.message||e),true)});
