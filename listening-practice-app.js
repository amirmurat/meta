import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js?v=3";
import {LISTENING as BANK} from "./listening-practice-bank.js";
const en=language()==="en",t=(a,b)=>en?a:b,$=id=>document.getElementById(id);
let user=null,answers={},started=0,played={},speaking=false,active=false,saving=false,timer=null;
const questions=BANK.parts.flatMap(p=>p.questions);
const store=()=>["meta",user.id,BANK.key,BANK.version,"draft"].join(":");
function set(id,v){$(id).textContent=v}function show(id,b){$(id).hidden=!b}
function status(s,error=false){set("status",s);show("status",!!s);$("status").style.color=error?"#a10f1c":""}
function persist(){try{localStorage.setItem(store(),JSON.stringify({started,answers,played}))}catch{}}
function restore(){try{const d=JSON.parse(localStorage.getItem(store())||"{}");started=d.started||0;
 answers=d.answers&&typeof d.answers==="object"?d.answers:{};
 played=d.played&&typeof d.played==="object"?d.played:{};
 }catch{answers={};played={};started=0}}
function clear(){try{localStorage.removeItem(store())}catch{}}
function score(data){
 const result=Object.fromEntries(Object.keys(BANK.skills).map(k=>[k,{correct:0,total:0}]));
 let right=0;
 for(const q of questions){const success=data[q.id]===q.answer;result[q.skill].total++;if(success){result[q.skill].correct++;right++}}
 return {correct:right,bySkill:result};
}
function priorities(result,prefix){
 const div=$(prefix+"-skills");div.replaceChildren();
 const ranked=Object.entries(result.bySkill).filter(([,s])=>s.total).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total||b[1].total-a[1].total);
 set(prefix+"-score",result.correct+" / 40");
 for(const [id,s] of ranked){
  const p=document.createElement("p");p.className="skill-line";
  const label=document.createElement("strong");label.textContent=BANK.skills[id][en?"en":"ru"]+" · "+s.correct+"/"+s.total+" ";
  p.append(label);
  if(s.correct<s.total){const a=document.createElement("a");a.href="./ielts-lesson.html?id="+encodeURIComponent(BANK.skills[id].lesson);a.textContent=t("Study lesson","Открыть урок");p.append(a)}
  div.append(p);
 }
 const weak=ranked.filter(([,s])=>s.correct<s.total).slice(0,3).map(([id])=>id);
 const plan=$(prefix+"-plan");plan.replaceChildren();
 for(let i=0;i<7;i++){
  const key=(weak.length?weak:ranked.map(([id])=>id))[i%Math.max(1,weak.length||ranked.length)];
  const li=document.createElement("li");
  const a=document.createElement("a");a.href="./ielts-lesson.html?id="+encodeURIComponent(BANK.skills[key].lesson);
  a.textContent=BANK.skills[key][en?"en":"ru"];
  li.append(document.createTextNode(t("Day ","День ")+(i+1)+" · "),a);
  if(i>=3)li.append(document.createTextNode(t(" · practise with new audio"," · проверить на новой записи")));
  plan.append(li);
 }
}
function review(){
 const container=$("review");container.replaceChildren();
 let number=0;
 for(const part of BANK.parts){
  const h=document.createElement("h3");h.textContent=part.title;container.append(h);
  const d=document.createElement("details"),sum=document.createElement("summary");
  sum.textContent=t("Show original listening script (after submission)","Показать текст записи после сдачи");
  const p=document.createElement("p");p.textContent=part.script;
  d.append(sum,p);container.append(d);
  for(const q of part.questions){
   number++;const line=document.createElement("p");line.className="review-row";
   const correctAnswer=q.options[q.answer],chosen=q.options[answers[q.id]]||"—";
   line.textContent=(answers[q.id]===q.answer?"✓ ":"✕ ")+number+". "+q.prompt+" · "+t("Your: ","Твой: ")+chosen+" · "+t("Correct: ","Верно: ")+correctAnswer;
   container.append(line);
  }
 }
}
function progress(){set("answered",questions.filter(q=>Number.isInteger(answers[q.id])).length+" / 40")}
function playback(part,id,button){
 if(!("speechSynthesis" in window)||!("SpeechSynthesisUtterance" in window)){
  status(t("This browser has no speech synthesis. Use official Listening audio exercises.","Браузер не поддерживает озвучивание. Используй официальные Listening-записи."),true);return;
 }
 if(speaking||played[id])return;
 speaking=true;played[id]=true;persist();
 button.disabled=true;
 const utter=new SpeechSynthesisUtterance(part.script);
 utter.lang="en-GB";utter.rate=0.88;utter.pitch=1;
 utter.onend=()=>{speaking=false;status(t("Audio finished. Continue answering.","Запись закончилась. Продолжай отвечать."));};
 utter.onerror=()=>{speaking=false;played[id]=false;button.disabled=false;persist();status(t("Speech playback failed. You can retry this part.","Не удалось воспроизвести запись. Можно повторить попытку."),true)};
 try{window.speechSynthesis.cancel();window.speechSynthesis.speak(utter);
  status(t("Synthetic audio is playing. Do not refresh this page.","Идёт синтезированная запись. Не обновляй страницу."));}
 catch(e){utter.onerror();}
}
function renderQuestions(){
 const root=$("parts");root.replaceChildren();let n=0;
 for(const part of BANK.parts){
  const section=document.createElement("section");section.className="part";
  const h=document.createElement("h2");h.textContent=part.title;section.append(h);
  const p=document.createElement("p");p.className="muted";p.textContent=t("Read the questions before playing the synthetic voice. Playback is limited to once per part in a saved attempt.","Прочитай вопросы перед озвучиванием. В сохранённой попытке один запуск на часть.");section.append(p);
  const btn=document.createElement("button");btn.type="button";btn.textContent=t("Play synthetic audio","Воспроизвести синтез речи");
  btn.disabled=!!played[part.id];btn.onclick=()=>playback(part,part.id,btn);section.append(btn);
  for(const q of part.questions){
   n++;const fs=document.createElement("fieldset");fs.className="question";
   const legend=document.createElement("legend");legend.textContent=n+". "+q.prompt;fs.append(legend);
   for(let i=0;i<q.options.length;i++){
    const label=document.createElement("label");label.className="option";
    const input=document.createElement("input");input.type="radio";input.name=q.id;input.value=String(i);input.checked=answers[q.id]===i;
    input.onchange=()=>{answers[q.id]=i;persist();progress()};
    const span=document.createElement("span");span.textContent=q.options[i];label.append(input,span);fs.append(label);
   }
   section.append(fs);
  }
  root.append(section);
 }
 progress();
}
function tick(){
 if(!active)return;
 const sec=Math.max(0,Math.ceil((1800000-(Date.now()-started))/1000));
 set("clock",String(Math.floor(sec/60)).padStart(2,"0")+":"+String(sec%60).padStart(2,"0"));
 if(!sec){if(timer)clearInterval(timer);timer=null;void finish(true)}
}
function begin(){
 if(!("speechSynthesis" in window)){status(t("Your browser cannot play this practice. Try Chrome or Edge.","Этот браузер не умеет озвучивать тест. Попробуй Chrome или Edge."),true);return}
 if(!started)started=Date.now();persist();active=true;
 show("intro",false);show("exam",true);show("results",false);show("history",false);
 renderQuestions();tick();if(timer)clearInterval(timer);
 if(active)timer=setInterval(tick,1000);
}
async function finish(auto=false){
 if(saving||!active)return;
 if(!auto&&!confirm(t("Submit answers? Unanswered questions count as incorrect.","Сдать ответы? Неотвеченные вопросы будут неверными.")))return;
 saving=true;
 try{window.speechSynthesis?.cancel()}catch{}
 speaking=false;if(timer)clearInterval(timer);timer=null;active=false;
 const result=score(answers);
 let error=null;try{({error}=await supabase.from("assessment_attempts").insert({
  user_id:user.id,course_slug:"ielts",assessment_key:BANK.key,version:BANK.version,responses:{...answers}
 }))}catch(e){error=e}
 if(!error)clear();
 show("exam",false);show("results",true);
 priorities(result,"result");review();
 set("result-status",(auto?t("Time expired. ","Время истекло. "):"")+(error?t("Not saved: ","Не сохранено: ")+String(error.message||error):t("Saved in your private history.","Сохранено в личной истории.")));
 saving=false;
 if(!error)await history();
}
async function history(){
 const {data,error}=await supabase.from("assessment_attempts").select("responses,submitted_at,version")
 .eq("user_id",user.id).eq("assessment_key",BANK.key).order("submitted_at",{ascending:false}).limit(10);
 if(error){status(t("History unavailable","История недоступна"),true);return}
 const holder=$("history-list");holder.replaceChildren();
 for(const row of data||[]){
  const p=document.createElement("p");p.className="history-line";
  const date=new Intl.DateTimeFormat(en?"en-GB":"ru-RU",{timeZone:"Asia/Almaty",dateStyle:"medium"}).format(new Date(row.submitted_at));
  p.textContent=date+" · "+(row.version===BANK.version?score(row.responses).correct+"/40":t("Other version","Другая версия"));holder.append(p);
 }
 show("history",!!data?.length);
}
async function boot(){
 user=await authenticatedUser();if(!user){location.replace(authPage("./listening-practice.html"));return}
 const access=await supabase.from("course_enrollments").select("course_slug").eq("user_id",user.id).eq("course_slug","ielts").maybeSingle();
 if(access.error)throw access.error;if(!access.data){status(t("IELTS is not assigned.","IELTS не назначен."),true);return}
 restore();set("notice",BANK.notice[en?"en":"ru"]);
 $("start").onclick=()=>{answers={};played={};started=0;clear();begin()};
 $("resume").onclick=begin;
 $("exam").onsubmit=e=>{e.preventDefault();void finish(false)};
 show("resume",!!started);show("intro",true);status("");await history();
}
void boot().catch(e=>{console.error("Listening practice:",e);status(t("Cannot load listening practice.","Не удалось открыть Listening.")+" "+String(e.message||e),true)});
