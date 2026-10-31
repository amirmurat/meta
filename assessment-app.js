import {supabase,authenticatedUser,authPage} from "./meta-supabase.js";
import {language} from "./meta-language.js?v=3";
import {ASSESSMENT,evaluateAssessment} from "./assessment-bank.js";

const en=language()==="en";
const t=(english,russian)=>en?english:russian;
const $=id=>document.getElementById(id);
const set=(id,value)=>{const el=$(id);if(el)el.textContent=value};
let user=null;
let responses={};
let currentAttempt=false;
let submitting=false;
const questions=ASSESSMENT.questions;
const questionIndex=new Map(questions.map((q,i)=>[q.id,i+1]));
const lastVersion="1";
function labelPage(){
 const fields=[
 ["back-link","← IELTS · All lessons","← IELTS · Все уроки"],
 ["courses-link","My courses","Мои программы"],
 ["eyebrow","In-site diagnostic · Meta","Встроенная диагностика · Meta"],
 ["title","IELTS Reading · Skills Check","IELTS Reading · Проверка навыков"],
 ["subtitle","Read short original passages, discover weak skills, and practise them directly in Meta.","Пройди небольшую диагностику, узнай слабые стороны и закрепи их прямо в Meta."],
 ["welcome-title","How the diagnostic works","Как работает диагностика"],
 ["description","12 original questions across three short texts. Answers help select specific lessons.","12 оригинальных вопросов по трём коротким текстам. По ошибкам подберём конкретные уроки."],
 ["start-test","Start skills check","Начать диагностику"],
 ["history-hint","Attempts are saved to your account","Попытки сохраняются в аккаунте"],
 ["quiz-heading","Reading questions","Вопросы по чтению"],
 ["exam-hint","Use evidence from the passage. If the passage does not give enough information, choose NOT GIVEN.","Отвечай только по тексту. Если данных недостаточно, выбирай NOT GIVEN, а не предположение."],
 ["submit-test","Check answers","Проверить ответы"],
 ["discard-test","Back","Назад"],
 ["results-label","Your result","Твой результат"],
 ["results-title","Skills analysis","Разбор диагностики"],
 ["next-title","Your next priorities","Что улучшить дальше"],
 ["retry-test","Repeat this practice","Повторить тренировку"],
 ["all-lessons","All IELTS lessons","Все уроки IELTS"],
 ["answers-title","Review every answer","Разбор каждого ответа"],
 ["history-title","Previous attempts","Предыдущие попытки"]
 ];
 for(const [id,eng,ru] of fields)set(id,t(eng,ru));
 set("warning",ASSESSMENT.warning[en?"en":"ru"]);
 set("result-disclaimer",t(
  "Only your accuracy on these 12 practice items is reported. No official IELTS band score is calculated.",
  "Показана точность только на этих 12 тренировочных вопросах. Официальный IELTS band не рассчитывается."
 ));
 document.title=t("Reading diagnostic — Meta","Диагностика Reading — Meta");
}
function status(message,error=false){
 set("status",message);$("status").hidden=!message;
 $("status").style.color=error?"#a53434":"";
}
function draftKey(){
 return "meta-test-draft:"+user.id+":"+ASSESSMENT.key+":"+ASSESSMENT.version;
}
function saveDraft(){
 try{localStorage.setItem(draftKey(),JSON.stringify(responses))}catch{}
}
function clearDraft(){try{localStorage.removeItem(draftKey())}catch{}}
function restoreDraft(){
 try{
  const value=JSON.parse(localStorage.getItem(draftKey())||"{}");
  if(value&&typeof value==="object"&&!Array.isArray(value)){
   responses=Object.fromEntries(questions.flatMap(q=>{
    const x=value[q.id];
    return Number.isInteger(x)&&x>=0&&x<q.options.length?[[q.id,x]]:[];
   }));
  }
 }catch{responses={}}
}
function updateCounter(){
 const count=Object.keys(responses).length;
 set("answered-count",count+" / "+questions.length);
 $("answer-fill").style.width=(100*count/questions.length)+"%";
}
function questionNode(q){
 const fieldset=document.createElement("fieldset");
 fieldset.className="question";fieldset.id="question-"+q.id;
 fieldset.style.cssText="border:0;margin:0;padding:21px 0;min-width:0";
 const legend=document.createElement("legend");
 legend.className="question-title";
 legend.textContent=questionIndex.get(q.id)+". "+q.prompt;
 fieldset.append(legend);
 const opts=document.createElement("div");opts.className="options";
 q.options.forEach((option,i)=>{
  const label=document.createElement("label");label.className="option";
  const input=document.createElement("input");
  input.type="radio";input.name="answer-"+q.id;input.value=String(i);
  input.checked=responses[q.id]===i;
  input.addEventListener("change",()=>{
   responses[q.id]=i;updateCounter();saveDraft();set("quiz-state","");
  });
  const text=document.createElement("span");text.textContent=option;
  label.append(input,text);opts.append(label);
 });
 fieldset.append(opts);return fieldset;
}
function startTest(){
 restoreDraft();
 currentAttempt=true;
 $("welcome").hidden=true;$("history").hidden=true;$("results").hidden=true;$("quiz").hidden=false;
 const root=$("questions");root.replaceChildren();
 for(const passage of ASSESSMENT.passages){
  const group=document.createElement("section");group.className="quiz-group";
  const title=document.createElement("h2");title.textContent=passage.title;
  const p=document.createElement("div");p.className="passage";p.lang="en";p.textContent=passage.text;
  group.append(title,p);
  for(const q of questions.filter(q=>q.passage===passage.id))group.append(questionNode(q));
  root.append(group);
 }
 set("quiz-state","");updateCounter();window.scrollTo({top:0,behavior:"smooth"});
}
function skillResultRows(scores){
 const root=$("skill-results");root.replaceChildren();
 const entries=Object.entries(scores).sort((a,b)=>
  a[1].correct/a[1].total-b[1].correct/b[1].total);
 for(const [key,score]of entries){
  const skill=ASSESSMENT.skills[key];
  const row=document.createElement("div");row.className="skill-score";
  const left=document.createElement("div");
  const name=document.createElement("strong");
  name.textContent=skill[en?"en":"ru"];
  const note=document.createElement("div");note.className="muted";note.style.fontSize="13px";
  note.textContent=score.correct===score.total?
   t("All 3 answered correctly in this short sample","Все 3 ответа верны в этой небольшой выборке"):
   t("Targeted lesson recommended","Рекомендуется тренировка");
  left.append(name,note);
  const side=document.createElement("div");side.style.textAlign="right";
  const stat=document.createElement("strong");stat.textContent=score.correct+" / "+score.total;
  side.append(stat);
  if(score.correct<score.total){
   const link=document.createElement("a");link.style.cssText="display:block;font-size:13px";
   link.href="./ielts-lesson.html?id="+encodeURIComponent(skill.lesson);
   link.textContent=t("Practise skill →","Укрепить навык →");
   side.append(link);
  }
  row.append(left,side);root.append(row);
 }
 return entries;
}
function reviewAnswers(result){
 const target=$("review");target.replaceChildren();
 for(const item of result.details){
  const q=questions.find(x=>x.id===item.id);
  const div=document.createElement("details");
  const title=document.createElement("summary");
  title.textContent=(item.correct?"✓ ":"✕ ")+questionIndex.get(q.id)+". "+q.prompt;
  const your=document.createElement("p");
  your.textContent=t("Your answer: ","Твой ответ: ")+(q.options[item.answer]||"—");
  const right=document.createElement("p");
  right.textContent=t("Correct answer: ","Правильный ответ: ")+q.options[q.answer];
  const explanation=document.createElement("p");explanation.className="assess-feedback "+(item.correct?"good":"review");
  explanation.textContent=q.explanation[en?"en":"ru"];
  div.append(title,your,right,explanation);target.append(div);
 }
}
function showResults(result,savedState){
 currentAttempt=false;
 $("welcome").hidden=true;$("quiz").hidden=true;$("results").hidden=false;
 set("result-score",result.correct+" / "+result.total);
 const byScore=skillResultRows(result.bySkill);
 const weak=byScore.filter(([,v])=>v.correct<v.total);
 if(weak.length){
  const top=weak.slice(0,2).map(([k])=>ASSESSMENT.skills[k][en?"en":"ru"]).join(", ");
  set("result-summary",t("Start with: ","Начни с: ")+top+". "+
   t("After practice, try a different set of questions to confirm improvement. Repeating the same items may inflate your score.","После тренировки нужна новая версия заданий, чтобы подтвердить улучшение. Повторение одних и тех же вопросов может завысить результат."));
 }else{
  set("result-summary",t(
   "All answers are correct in this short practice set. This does not establish an IELTS band or mastery; next, try a timed, independent passage.",
   "В этой небольшой тренировке все ответы верны. Это ещё не IELTS band и не доказательство полного освоения; следующий шаг — независимый текст с таймером."
  ));
 }
 reviewAnswers(result);
 set("result-save",savedState||"");
 window.scrollTo({top:0,behavior:"smooth"});
}
async function saveAttempt(){
 if(submitting)return;
 const missing=questions.find(q=>!Number.isInteger(responses[q.id]));
 if(missing){
  const message=t("Answer all questions before checking your result.","Ответь на все вопросы перед проверкой.");
  set("quiz-state",message);
  const first=$("question-"+missing.id);
  first?.scrollIntoView({behavior:"smooth",block:"center"});
  first?.querySelector("input")?.focus({preventScroll:true});
  return;
 }
 submitting=true;$("submit-test").disabled=true;
 const data={user_id:user.id,course_slug:ASSESSMENT.course,
  assessment_key:ASSESSMENT.key,version:ASSESSMENT.version,responses};
 const {error}=await supabase.from("assessment_attempts").insert(data);
 submitting=false;$("submit-test").disabled=false;
 if(!error)clearDraft();
 const result=evaluateAssessment(responses);
 showResults(result,error?
  t("Result calculated, but not saved to your account: ","Результат подсчитан, но не сохранён в аккаунте: ")+error.message:
  t("Attempt saved to your private history.","Результат сохранён в личной истории."));
 if(!error)await loadHistory();
}
function dateText(s){
 try{return new Intl.DateTimeFormat(en?"en-GB":"ru-RU",{
  timeZone:"Asia/Almaty",dateStyle:"medium",timeStyle:"short"
 }).format(new Date(s))}catch{return String(s)}
}
async function loadHistory(){
 const {data,error}=await supabase.from("assessment_attempts")
  .select("id,version,responses,submitted_at")
  .eq("user_id",user.id).eq("course_slug",ASSESSMENT.course)
  .eq("assessment_key",ASSESSMENT.key)
  .order("submitted_at",{ascending:false}).limit(20);
 const panel=$("history"),list=$("history-list");
 list.replaceChildren();panel.hidden=true;
 if(error){console.warn("Assessment history unavailable:",error.message);return}
 if(!data?.length)return;
 for(const item of data){
  const row=document.createElement("div");row.className="history-row";
  const when=document.createElement("span");when.textContent=dateText(item.submitted_at);
  const score=document.createElement("strong");
  const compatible=item.version===lastVersion&&item.responses&&typeof item.responses==="object";
  const result=compatible?evaluateAssessment(item.responses):null;
  score.textContent=result?result.correct+" / "+result.total:t("Older question version","Другая версия теста");
  row.append(when,score);list.append(row);
 }
 panel.hidden=false;
}
function setupActions(){
 $("start-test").onclick=startTest;
 $("discard-test").onclick=()=>{
  currentAttempt=false;$("quiz").hidden=true;$("welcome").hidden=false;
  void loadHistory();window.scrollTo({top:0,behavior:"smooth"});
 };
 $("retry-test").onclick=()=>{
  responses={};clearDraft();startTest();
 };
 $("quiz").addEventListener("submit",event=>{event.preventDefault();void saveAttempt()});
}
async function boot(){
 labelPage();
 user=await authenticatedUser();
 if(!user){location.replace(authPage("./assessment.html"));return}
 const {data:access,error}=await supabase.from("course_enrollments")
  .select("course_slug").eq("user_id",user.id).eq("course_slug",ASSESSMENT.course).maybeSingle();
 if(error)throw error;
 if(!access){
  status(t("IELTS is not assigned to this account.","IELTS не назначен этому аккаунту."),true);
  return;
 }
 setupActions();
 $("welcome").hidden=false;
 status("");
 await loadHistory();
}
void boot().catch(err=>{
 console.error("Meta assessment:",err);
 status(t("Could not open this diagnostic. Refresh or check your connection.","Не удалось открыть диагностику. Обнови страницу или проверь соединение."),true);
});
