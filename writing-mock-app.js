import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js?v=3";
const en=language()==="en",t=(a,b)=>en?a:b,$=id=>document.getElementById(id);
const VERSION="1",MAX=60*60*1000;
const storage=id=>"meta:ielts-writing:"+id+":v"+VERSION;
let user=null,started=0,timer=null,submitting=false,task1="",task2="";
function set(id,s){$(id).textContent=s}function show(id,yes){$(id).hidden=!yes}
function count(s){return (String(s||"").trim().match(/\S+/gu)||[]).length}
function save(){if(!user)return;try{localStorage.setItem(storage(user.id),JSON.stringify({started,task1,task2}))}catch{}}
function restore(){try{const v=JSON.parse(localStorage.getItem(storage(user.id))||"{}");
 started=Number.isFinite(v.started)&&v.started>0?v.started:0;
 task1=typeof v.task1==="string"?v.task1.slice(0,12000):"";
 task2=typeof v.task2==="string"?v.task2.slice(0,20000):"";
}catch{started=0;task1="";task2=""}}
function clear(){try{localStorage.removeItem(storage(user.id))}catch{}}
function note(msg,err=false){set("status",msg);show("status",!!msg);$("status").style.color=err?"#a10f1c":""}
function wordCounts(){
 const a=count(task1),b=count(task2);
 set("count1",a+" / 150 "+t("words","слов"));
 set("count2",b+" / 250 "+t("words","слов"));
 set("count-note",a<150||b<250?t("One or both tasks are below the IELTS minimum length. Word count does not measure writing quality.","Одно или оба задания короче требований IELTS. Количество слов не равно качеству текста."):"");
}
function clock(){
 if(!started)return;
 const remaining=Math.max(0,MAX-(Date.now()-started));
 const seconds=Math.ceil(remaining/1000);
 set("timer",String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0"));
 if(!remaining){clearInterval(timer);timer=null;void finish(true)}
}
function begin(){
 if(!started)started=Date.now();save();
 $("task1").value=task1;$("task2").value=task2;
 show("welcome",false);show("work",true);show("latest",false);show("result",false);
 wordCounts();clock();
 if(timer)clearInterval(timer);
 if(Date.now()<started+MAX)timer=setInterval(clock,1000);
}
function recommendation(text,href){
 const li=document.createElement("li"),a=document.createElement("a");a.href=href;a.textContent=t("Open lesson","Открыть урок");
 li.append(document.createTextNode(text+" — "),a);return li;
}
function result(wordsA,wordsB,minutes,saved){
 show("welcome",false);show("work",false);show("latest",false);show("result",true);
 set("result-info",t("Task 1: ","Задание 1: ")+wordsA+t(" words · Task 2: "," слов · Задание 2: ")+wordsB+t(" words · elapsed: "," слов · затрачено: ")+minutes+" "+t("min","мин"));
 const root=$("priorities");root.replaceChildren();
 if(wordsA<150)root.append(recommendation(t("1. Complete a Task 1 overview and essential comparisons","1. Дополнить Task 1: обзор и ключевые сравнения"),"./ielts-lesson.html?id=A.3.1.3.1"));
 if(wordsB<250)root.append(recommendation(t("2. Develop Task 2 arguments with explanations and examples","2. Развить аргументы Task 2 и добавить примеры"),"./ielts-lesson.html?id=A.3.2.4.3"));
 root.append(recommendation(t("Check whether you identified the main data trends","Проверь, выделены ли главные тенденции данных"),"./ielts-lesson.html?id=A.3.1.2.1"));
 root.append(recommendation(t("Check that the essay answers every part of the question","Проверь, отвечает ли эссе на каждую часть вопроса"),"./ielts-lesson.html?id=A.3.2.1.2"));
 set("save-result",saved);
}
async function finish(expired=false){
 if(submitting||!started)return;
 if(!expired&&!confirm(t("Submit both tasks now? They cannot be edited after submission.","Отправить оба текста? После сдачи изменить ответы нельзя.")))return;
 submitting=true;$("finish").disabled=true;
 task1=$("task1").value;task2=$("task2").value;
 const duration=Math.min(7200,Math.floor((Date.now()-started)/1000));
 let err=null;
 try{const response=await supabase.from("ielts_writing_attempts").insert({
 user_id:user.id,version:VERSION,task1,task2,word_count_1:count(task1),word_count_2:count(task2),duration_seconds:duration
 });err=response.error;}catch(e){err=e}
 if(!err){clear();started=0;}
 result(count(task1),count(task2),Math.round(duration/60),(expired?t("Time expired. ","Время истекло. "):"")+(err?t("Could not save: ","Ошибка сохранения: ")+String(err.message||err):t("Saved privately. This is not a graded IELTS band.","Сохранено в личном аккаунте. IELTS band не выставлялся.")));
 if(!err)await history();
 submitting=false;$("finish").disabled=false;
}
async function history(){
 const {data,error}=await supabase.from("ielts_writing_attempts").select("submitted_at,word_count_1,word_count_2,duration_seconds,version")
 .eq("user_id",user.id).order("submitted_at",{ascending:false}).limit(10);
 if(error){note(t("History unavailable: ","История недоступна: ")+error.message,true);return}
 const root=$("history-list");root.replaceChildren();
 for(const item of data||[]){
  const p=document.createElement("p");p.className="history-row";
  const date=new Intl.DateTimeFormat(en?"en-GB":"ru-RU",{timeZone:"Asia/Almaty",dateStyle:"medium"}).format(new Date(item.submitted_at));
  p.textContent=date+" · Task 1 "+item.word_count_1+" "+t("words","слов")+" · Task 2 "+item.word_count_2+" "+t("words","слов");root.append(p);
 }
 show("history",!!data?.length);
}
async function boot(){
 user=await authenticatedUser();if(!user){location.replace(authPage("./writing-mock.html"));return;}
 const access=await supabase.from("course_enrollments").select("course_slug").eq("user_id",user.id).eq("course_slug","ielts").maybeSingle();
 if(access.error)throw access.error;
 if(!access.data){note(t("IELTS is not assigned to your account.","Курс IELTS не назначен аккаунту."),true);return}
 restore();
 $("start").onclick=()=>{started=0;task1="";task2="";clear();begin()};
 $("resume").onclick=begin;
 $("task1").addEventListener("input",e=>{task1=e.target.value;save();wordCounts()});
 $("task2").addEventListener("input",e=>{task2=e.target.value;save();wordCounts()});
 $("work").onsubmit=e=>{e.preventDefault();void finish(false)};
 show("resume",!!started);show("welcome",true);note("");
 await history();
}
void boot().catch(e=>{console.error("Writing practice:",e);note(t("Could not load Writing practice.","Не удалось открыть Writing.")+" "+String(e.message||e),true)});
